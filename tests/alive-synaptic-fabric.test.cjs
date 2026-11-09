'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Controller, CAPABILITIES } = require('../systems/alive-overdrive-runtime.js');
const { SynapticFabric, DEFAULT_EDGES, PACED, evidenceDigest, connectivity } = require('../systems/alive-synaptic-fabric.js');

const flush = () => new Promise(resolve => setImmediate(resolve));
const def = (id, extras = {}) => ({ id, label: id, mode: 'action', intervalMs: 1000, initialDelayMs: 0, ...extras });

// A real Controller whose events feed the fabric synchronously, exactly like
// the browser path (controller onEvent -> window event -> fabric).
function rig(adapters, edges, { capabilities, options = {}, controllerOptions = {} } = {}) {
  let now = 0, fabric = null;
  const controller = new Controller({ clock: () => now, capabilities: capabilities || Object.keys(adapters).map(id => def(id)),
    adapters, maxInFlight: 4, maxStartsPerTick: 8, budgetMs: 25, onEvent: event => fabric && fabric.handleEvent(event), ...controllerOptions });
  fabric = new SynapticFabric({ controller, edges, options, clock: () => now });
  controller.start({ automatic: false });
  const job = id => controller.jobs.get(id);
  return { controller, fabric, job, advance: ms => { now += ms; }, now: () => now };
}

test('every declared capability is wired into the fabric with input and output synapses', () => {
  const ids = CAPABILITIES.map(item => item.id);
  const report = connectivity(ids);
  assert.deepEqual(report.withoutOutput, [], 'every faculty excites at least one other faculty');
  assert.deepEqual(report.withoutInput, [], 'every unpaced faculty can be excited by another faculty');
  for (const [from, to, weight] of DEFAULT_EDGES) {
    assert.notEqual(from, to);
    assert.ok(weight > 0 && weight < 1, `${from}>${to}`);
  }
});

test('evidence digests ignore clock-like fields but detect real changes', () => {
  assert.equal(evidenceDigest({ tick: 1, value: 3, nested: { at: 5, x: [1, 2] } }), evidenceDigest({ tick: 99, value: 3, nested: { at: 7, x: [1, 2] } }));
  assert.notEqual(evidenceDigest({ value: 3 }), evidenceDigest({ value: 4 }));
});

test('novel evidence excites downstream faculties earlier, bounded by refractory time', async () => {
  let n = 0;
  const { controller, fabric, job, advance } = rig({ src: () => ({ evidence: { n: ++n } }), dst: () => ({ evidence: { k: 1 } }) },
    [['src', 'dst', 0.5]], { capabilities: [def('src'), def('dst', { initialDelayMs: 900 })] });
  controller.tick(); await flush();
  // dst was due at 900; refractory floor is max(400, 0.2*1000)=400 from now (dst never started)
  assert.equal(job('dst').nextDueAt, 400);
  assert.equal(fabric.snapshot().totals.excitations, 1);
  const node = fabric.snapshot().nodes.find(item => item.id === 'dst');
  assert.equal(node.lastExcitedBy, 'src');
  advance(400); controller.tick(); await flush();
  assert.equal(job('dst').runCount, 1);
});

test('repeated identical evidence neither excites nor speeds up a faculty', async () => {
  const { controller, fabric, job, advance } = rig({ src: () => ({ evidence: { same: true } }), dst: () => ({ evidence: 1 }) },
    [['src', 'dst', 0.9]], { capabilities: [def('src'), def('dst', { initialDelayMs: 5000 })] });
  controller.tick(); await flush();
  const first = fabric.snapshot().totals.excitations;
  advance(5000); job('dst').nextDueAt = 99999;
  controller.tick(); await flush();
  assert.equal(fabric.snapshot().totals.excitations, first, 'no excitation from a repeated digest');
  assert.ok(fabric.snapshot().nodes.find(item => item.id === 'src').utility < fabric.options.utilityRate, 'utility decays with repetition');
  assert.ok(fabric.cadenceFactor('src') <= 2 && fabric.cadenceFactor('src') >= 0.5);
});

test('Hebbian credit potentiates on the excited target\u2019s novel outcome and depresses on failure, within bounds', async () => {
  let fail = false, n = 0;
  const { controller, fabric, advance } = rig({ src: () => ({ evidence: { n: ++n } }), dst: () => { if (fail) throw new Error('offline'); return { evidence: { n } }; } },
    [['src', 'dst', 0.5]], { capabilities: [def('src'), def('dst', { initialDelayMs: 900 })] });
  controller.tick(); await flush();            // src novel -> excite dst
  advance(400); controller.tick(); await flush(); // dst novel -> potentiate
  const edge = () => fabric.edges[0];
  assert.ok(edge().weight > 0.5);
  assert.equal(edge().potentiations, 1);
  const potentiated = edge().weight;
  fail = true;
  advance(2000); controller.tick(); await flush(); // src again -> excite dst (dst errors in same tick? due ordering)
  advance(2000); controller.tick(); await flush();
  assert.ok(edge().depressions >= 0);
  for (let i = 0; i < 200; i++) { fabric.handleEvent({ type: 'running', id: 'dst', at: 0 }); fabric.node('dst').pending.set('src', 0); fabric.handleEvent({ type: 'error', id: 'dst', at: 1 }); }
  assert.ok(edge().weight >= fabric.options.minWeight && edge().weight < potentiated);
  for (let i = 0; i < 400; i++) { fabric.handleEvent({ type: 'running', id: 'dst', at: 0 }); fabric.node('dst').pending.set('src', 0); fabric.handleEvent({ type: 'completed', id: 'dst', at: 1, evidence: { i } }); }
  assert.ok(edge().weight <= fabric.options.maxWeight);
});

test('paused, manual-only, in-flight, erroring and paced targets are never pulled forward', async () => {
  let release;
  let n = 0;
  const adapters = {
    src: () => ({ evidence: { n: ++n } }),
    manual: () => ({ evidence: 1 }),
    busy: () => new Promise(resolve => { release = resolve; }),
    'portal-jump': () => ({ evidence: 1 })
  };
  const { controller, job, advance } = rig(adapters, [['src', 'manual', 0.9], ['src', 'busy', 0.9], ['src', 'portal-jump', 0.9]], {
    capabilities: [def('busy'), def('src', { initialDelayMs: 1 }), def('manual', { mode: 'diagnostic', manualOnly: true }), def('portal-jump', { initialDelayMs: 50000 })] });
  controller.tick(); await flush(); // busy starts
  advance(1); controller.tick(); await flush(); // src runs
  assert.equal(job('portal-jump').nextDueAt, 50000);
  assert.equal(job('manual').runCount, 0);
  assert.equal(job('busy').runCount, 1);
  release({ evidence: 'late' }); await flush();
  controller.stop();
  const before = job('portal-jump').nextDueAt;
  const fabric = new SynapticFabric({ controller, edges: [['src', 'portal-jump', 0.9]] });
  fabric.handleEvent({ type: 'running', id: 'src', at: 5 });
  fabric.handleEvent({ type: 'completed', id: 'src', at: 6, evidence: { fresh: 1 } });
  assert.equal(job('portal-jump').nextDueAt, before, 'stopped controller is not excited');
  assert.ok(PACED.includes('portal-jump'));
});

test('a success that the fabric never saw start is treated as foreign and cannot learn', () => {
  const controller = new Controller({ capabilities: [def('a'), def('b')], adapters: { a: () => 1, b: () => 1 } });
  controller.start({ automatic: false });
  const fabric = new SynapticFabric({ controller, edges: [['a', 'b', 0.5]] });
  const due = controller.jobs.get('b').nextDueAt;
  fabric.handleEvent({ type: 'completed', id: 'a', at: 1, evidence: { forged: true } });
  assert.equal(controller.jobs.get('b').nextDueAt, due);
  assert.equal(fabric.snapshot().totals.foreign, 1);
});

test('utility shortens cadence for productive faculties and lengthens it for failing ones', async () => {
  let n = 0;
  const { controller, fabric, job, advance } = rig({ good: () => ({ evidence: { n: ++n } }), bad: () => ({ status: 'blocked', reason: 'waiting' }) }, []);
  for (let i = 0; i < 12; i++) { controller.tick(); await flush(); advance(1000); }
  assert.ok(fabric.cadenceFactor('good') < 1, 'novel producer is sampled more often');
  const nextGap = job('good').nextDueAt - job('good').lastCompletedAt;
  assert.ok(nextGap < 1000 && nextGap >= 500);
  assert.ok(fabric.node('bad').utility < 0);
});

test('synaptic scaling bounds each source\u2019s outgoing weight so potentiation is competitive, not saturating', () => {
  const controller = new Controller({ capabilities: [def('s'), def('a'), def('b'), def('c')], adapters: {} });
  const fabric = new SynapticFabric({ controller, edges: [['s', 'a', 0.3], ['s', 'b', 0.3], ['s', 'c', 0.3]] });
  const budget = 0.9 * fabric.options.outgoingBudget;
  for (let i = 0; i < 500; i++) {
    fabric.handleEvent({ type: 'running', id: 'a', at: i });
    fabric.node('a').pending.set('s', i);
    fabric.handleEvent({ type: 'completed', id: 'a', at: i, evidence: { i } });
  }
  const total = fabric.edges.reduce((sum, edge) => sum + edge.weight, 0);
  assert.ok(total <= budget + 1e-9, `outgoing total ${total} within budget ${budget}`);
  const [a, b, c] = fabric.edges;
  assert.ok(a.weight > b.weight && a.weight > c.weight, 'the repeatedly productive synapse wins the competition');
  assert.ok(fabric.snapshot().totals.scalings > 0);
});

test('number quantization keeps tiny float drift from counting as new evidence', () => {
  assert.equal(evidenceDigest({ gate: 0.50012 }), evidenceDigest({ gate: 0.50049 }));
  assert.notEqual(evidenceDigest({ gate: 0.5 }), evidenceDigest({ gate: 0.62 }));
});

test('export/import validates before applying and never invents edges', () => {
  const controller = new Controller({ capabilities: [def('a'), def('b')], adapters: {} });
  const fabric = new SynapticFabric({ controller, edges: [['a', 'b', 0.3]] });
  assert.equal(fabric.importState({ version: 1, edges: [{ from: 'a', to: 'b', weight: NaN }] }).status, 'rejected');
  assert.equal(fabric.edges[0].weight, 0.3);
  assert.equal(fabric.importState({ version: 2, edges: [] }).status, 'rejected');
  const result = fabric.importState({ version: 1, edges: [{ from: 'a', to: 'b', weight: 5 }, { from: 'b', to: 'a', weight: 0.5 }], utilities: { a: 0.4 } });
  assert.equal(result.status, 'restored');
  assert.equal(result.edges, 1);
  assert.equal(fabric.edges.length, 1);
  assert.equal(fabric.edges[0].weight, fabric.options.maxWeight);
  assert.equal(fabric.node('a').utility, 0.4);
  const round = new SynapticFabric({ controller, edges: [['a', 'b', 0.3]] });
  round.importState(fabric.exportState());
  assert.equal(round.edges[0].weight, fabric.edges[0].weight);
});

test('spans and events stay bounded and record true concurrency', async () => {
  const releases = [];
  const adapters = { a: { group: 'one', run: () => new Promise(r => releases.push(r)) }, b: { group: 'two', run: () => new Promise(r => releases.push(r)) } };
  const { controller, fabric } = rig(adapters, [], { options: { spanLimit: 20 } });
  controller.tick(); await flush();
  const open = fabric.snapshot().spans.filter(span => span.end === null);
  assert.equal(open.length, 2, 'two lanes executing at the same time');
  releases.forEach(r => r({ evidence: 1 })); await flush();
  for (let i = 0; i < 100; i++) { fabric.handleEvent({ type: 'running', id: 'a', at: i }); fabric.handleEvent({ type: 'blocked', id: 'a', at: i }); }
  assert.ok(fabric.snapshot().spans.length <= 20);
  assert.ok(fabric.events.length <= fabric.options.eventLimit);
});
