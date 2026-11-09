'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Controller, CAPABILITIES } = require('../systems/alive-overdrive-runtime.js');

const flush = () => new Promise(resolve => setImmediate(resolve));
const definition = (id, extras = {}) => ({ id, label: id, mode: 'action', intervalMs: 100, initialDelayMs: 0, ...extras });
function harness(adapters, options = {}) {
  let now = 0;
  const capabilities = Object.keys(adapters).map(id => definition(id));
  const controller = new Controller({ clock: () => now, capabilities, adapters, ...options });
  controller.start({ automatic: false });
  return { controller, advance: ms => { now += ms; }, setTime: value => { now = value; } };
}
const job = (controller, id) => controller.snapshot().jobs.find(item => item.id === id);

test('the roster consolidates equivalent controls while retaining every requested architecture and action', () => {
  assert.equal(CAPABILITIES.length, 30);
  assert.equal(new Set(CAPABILITIES.map(item => item.id)).size, CAPABILITIES.length);
  for (const id of ['brains-precision', 'checkpoint', 'soul-surge', 'grover-collapse', 'portal-jump', 'dom-body', 'reasoning', 'decursive', 'feed', 'formation', 'procreate', 'morph', 'dream', 'deity', 'zalgo', 'neo', 'train-policy', 'flywire', 'epoch-handoff', 'acceptance-gates', 'onion', 'omega', 'deep-dark-dive', 'macro', 'meso', 'micro', 'body-curriculum', 'connectome', 'millennium']) {
    assert.ok(CAPABILITIES.some(item => item.id === id), id);
  }
  for (const label of ['Mitosis Split', 'Mutate Body', 'Dream Replay']) assert.ok(CAPABILITIES.some(item => item.aliases.includes(label)));
});

test('absent adapters are unavailable and cannot produce execution evidence', () => {
  const { controller } = harness({}, { capabilities: [definition('missing')] });
  controller.tick();
  assert.equal(controller.request('missing'), false);
  assert.equal(job(controller, 'missing').status, 'unavailable');
  assert.equal(job(controller, 'missing').runCount, 0);
  assert.equal(job(controller, 'missing').evidence, null);
});

test('an unresolved operation cannot be launched twice, even after timeout and stop/start', async () => {
  let release;
  let calls = 0;
  const { controller, advance } = harness({ stalled: { timeoutMs: 100, run: () => { calls++; return new Promise(resolve => { release = resolve; }); } } });
  controller.tick();
  advance(200);
  controller.tick();
  assert.equal(job(controller, 'stalled').status, 'timeout');
  assert.equal(controller.request('stalled'), false);
  controller.stop();
  controller.start({ automatic: false });
  controller.tick();
  assert.equal(calls, 1);
  assert.equal(controller.snapshot().inFlight, 1);
  release({ evidence: 'stale' });
  await flush();
  assert.equal(job(controller, 'stalled').completedCount, 0);
  assert.equal(controller.snapshot().inFlight, 0);
  advance(100);
  controller.tick();
  assert.equal(calls, 2);
  release({ evidence: 'fresh' });
  await flush();
  assert.equal(job(controller, 'stalled').evidence, 'fresh');
});

test('stop aborts pending work and excludes stale completion from model feedback', async () => {
  let resolveOperation;
  let signal;
  const feedback = [];
  const { controller } = harness({ a: args => { signal = args.signal; return new Promise(resolve => { resolveOperation = resolve; }); } }, { onOutcome: (...args) => feedback.push(args) });
  controller.tick();
  controller.stop();
  assert.equal(signal.aborted, true);
  resolveOperation({ status: 'completed', evidence: { weightDelta: 0.2 }, reward: 0.5 });
  await flush();
  assert.deepEqual(feedback, []);
  assert.equal(job(controller, 'a').status, 'stopped');
});

test('fair due ordering prevents the first capability from starving other modules', async () => {
  const order = [];
  const { controller, advance } = harness({ a: () => order.push('a'), b: () => order.push('b'), c: () => order.push('c') });
  for (let i = 0; i < 6; i++) { controller.tick(); await flush(); advance(100); }
  assert.deepEqual(order, ['a', 'b', 'c', 'a', 'b', 'c']);
});

test('an observed synchronous budget overrun yields and reduces that adapter cadence', async () => {
  let bCalls = 0;
  const { controller, advance } = harness({ a: () => { advance(18); return { evidence: 'work' }; }, b: () => { bCalls++; } }, { maxInFlight: 2, budgetMs: 5 });
  controller.tick();
  await flush();
  assert.equal(bCalls, 0);
  assert.equal(controller.snapshot().metrics.overBudgetTicks, 1);
  assert.equal(job(controller, 'a').syncDurationMs, 18);
  assert.ok(job(controller, 'a').nextDueAt >= 378);
  controller.tick();
  await flush();
  assert.equal(bCalls, 1);
});

test('async mutations serialize while a read observer may run concurrently', async () => {
  let finish;
  let mutationB = 0;
  let observed = 0;
  const { controller } = harness({
    a: () => new Promise(resolve => { finish = resolve; }),
    b: () => { mutationB++; },
    observer: { group: 'observe', run: () => { observed++; return { status: 'observed', evidence: 7 }; } }
  }, { maxInFlight: 2, maxStartsPerTick: 3 });
  controller.tick();
  await flush();
  assert.equal(observed, 1);
  assert.equal(mutationB, 0);
  finish({ evidence: 'done' });
  await flush();
  controller.tick();
  await flush();
  assert.equal(mutationB, 1);
});

test('manual diagnostics do not run during autonomy but requests use the same bounded executor', async () => {
  let calls = 0;
  const { controller } = harness({ gate: () => { calls++; return { evidence: { passed: false, reason: 'unmeasured' } }; } }, {
    capabilities: [definition('gate', { mode: 'diagnostic', manualOnly: true })]
  });
  controller.tick();
  assert.equal(calls, 0);
  for (let i = 0; i < 1000; i++) controller.request('gate');
  assert.equal(controller.snapshot().queued, 1);
  controller.tick();
  await flush();
  assert.equal(calls, 1);
  assert.equal(job(controller, 'gate').evidence.passed, false);
});

test('failures remain visible with backoff, and successful outcomes receive only explicit rewards', async () => {
  const feedback = [];
  const { controller, advance } = harness({ broken: () => { throw new Error('backend offline'); }, healthy: () => ({ evidence: { spikes: 3 } }) }, {
    onOutcome: (id, result) => feedback.push({ id, result })
  });
  controller.tick();
  await flush();
  assert.equal(job(controller, 'broken').status, 'error');
  assert.equal(job(controller, 'broken').lastError, 'backend offline');
  assert.equal(job(controller, 'broken').nextDueAt, 200);
  controller.tick();
  await flush();
  assert.equal(feedback.length, 1);
  assert.equal(feedback[0].result.reward, null);
  advance(200);
  controller.tick();
  await flush();
  controller.tick();
  await flush();
  assert.equal(job(controller, 'broken').errorCount, 2);
});

test('failed prerequisites are truthful, recoverable, and do not invoke the action', async () => {
  let ready = false;
  let calls = 0;
  const { controller, advance } = harness({ portal: { ready: () => ready || 'Navigation disabled', run: () => { calls++; return { evidence: { tabCount: 1 } }; } } });
  controller.tick();
  assert.equal(job(controller, 'portal').status, 'blocked');
  assert.equal(calls, 0);
  ready = true;
  advance(1000);
  controller.tick();
  await flush();
  assert.equal(calls, 1);
  assert.equal(job(controller, 'portal').status, 'completed');
});

test('bounded evidence and logs cannot grow with model arrays or repeated observations', async () => {
  const { controller, advance } = harness({ a: () => ({ evidence: { tensor: new Float32Array(262144), infinite: Infinity } }) }, { eventLimit: 20 });
  for (let i = 0; i < 100; i++) { controller.tick(); await flush(); advance(100); }
  const snap = controller.snapshot();
  assert.equal(snap.events.length, 20);
  assert.equal(snap.jobs[0].evidence.tensor.length, 12);
  assert.equal(snap.jobs[0].evidence.infinite, 'Infinity');
});

test('an unknown error-like adapter status cannot silently become a completed execution', async () => {
  const { controller } = harness({ a: () => ({ status: 'failed', reason: 'external service failed' }) });
  controller.tick();
  await flush();
  assert.equal(job(controller, 'a').status, 'error');
  assert.equal(job(controller, 'a').completedCount, 0);
});

test('hidden or paused host context suspends automatic and manual starts until visible', async () => {
  let paused = true, calls = 0;
  const { controller } = harness({ a: () => { calls++; } }, { getContext: () => ({ paused }) });
  controller.request('a');
  controller.tick();
  assert.equal(calls, 0);
  assert.equal(controller.snapshot().suspended, true);
  paused = false;
  controller.tick();
  await flush();
  assert.equal(calls, 1);
  assert.equal(controller.snapshot().suspended, false);
});

test('a hung backend retains its own lock while model mutations continue without duplicate probes', async () => {
  let release, probes = 0, mutations = 0;
  const { controller, advance } = harness({
    backend: { group: 'backend', timeoutMs: 100, run: () => { probes++; return new Promise(resolve => { release = resolve; }); } },
    mutation: () => { mutations++; return { evidence: mutations }; }
  }, { maxInFlight: 2 });
  controller.tick();
  await flush();
  advance(200);
  controller.tick();
  await flush();
  assert.equal(probes, 1);
  assert.equal(mutations, 2);
  assert.equal(job(controller, 'backend').status, 'timeout');
  release({ evidence: 'late backend result' });
  await flush();
  assert.equal(job(controller, 'backend').completedCount, 0);
});

test('returned error outcomes back off like thrown failures and recover after real success', async () => {
  let succeeds = false;
  const { controller, advance } = harness({ backend: () => succeeds
    ? { status: 'completed', evidence: { actualResponse: true } }
    : { status: 'error', reason: 'configured provider is offline' } });
  controller.tick(); await flush();
  assert.equal(job(controller, 'backend').nextDueAt, 200);
  advance(199); controller.tick(); await flush();
  assert.equal(job(controller, 'backend').runCount, 1);
  advance(1); controller.tick(); await flush();
  assert.equal(job(controller, 'backend').nextDueAt, 600);
  succeeds = true;
  advance(400); controller.tick(); await flush();
  assert.equal(job(controller, 'backend').nextDueAt, 700);
  assert.equal(job(controller, 'backend').lastSuccessfulAt, 600);
  assert.equal(job(controller, 'backend').evidenceAt, 600);
  assert.equal(job(controller, 'backend').completedCount, 1);
});

test('hidden host state remains observable when every execution slot is occupied', async () => {
  let paused = false, release;
  const { controller } = harness({ stalled: () => new Promise(resolve => { release = resolve; }) }, {
    getContext: () => ({ paused })
  });
  controller.tick();
  paused = true;
  controller.tick();
  assert.equal(controller.snapshot().suspended, true);
  assert.equal(controller.snapshot().health.state, 'suspended');
  release({ evidence: 'settled' }); await flush();
});

test('health identifies retained locks and names capabilities waiting for the same lane', async () => {
  let release;
  const { controller, advance } = harness({
    stalled: { timeoutMs: 100, run: () => new Promise(resolve => { release = resolve; }) },
    other: () => ({ evidence: 'actual' })
  }, { maxInFlight: 2 });
  controller.tick();
  advance(150); controller.tick();
  const state = controller.snapshot(false);
  assert.equal(state.health.awaitingSettlement, 1);
  assert.equal(state.health.waitingCapabilities, 1);
  assert.deepEqual(job(controller, 'other').waitingFor, ['stalled']);
  assert.equal(state.executions[0].elapsedMs, 150);
  assert.equal(state.executions[0].timedOut, true);
  assert.equal(job(controller, 'other').completedCount, 0);
  controller.stop();
  assert.equal(controller.snapshot().executions[0].cancelled, true);
  release({ evidence: 'late' }); await flush();
  assert.equal(controller.snapshot().health.awaitingSettlement, 0);
});

test('a later failure retains the timestamp of last actual successful evidence', async () => {
  let fail = false;
  const { controller, advance } = harness({ a: () => { if (fail) throw new Error('now offline'); return { evidence: { response: 'live' } }; } });
  controller.tick(); await flush();
  advance(100); fail = true; controller.tick(); await flush();
  assert.equal(job(controller, 'a').status, 'error');
  assert.equal(job(controller, 'a').lastSuccessfulAt, 0);
  assert.equal(job(controller, 'a').evidenceAt, 0);
  assert.equal(job(controller, 'a').lastCompletedAt, 100);
});

test('a settled provider deadline remains a timeout outcome with retry backoff', async () => {
  const { controller } = harness({ planner: () => ({ status: 'timeout', reason: 'Local inference deadline expired' }) });
  controller.tick(); await flush();
  assert.equal(job(controller, 'planner').status, 'timeout');
  assert.equal(job(controller, 'planner').completedCount, 0);
  assert.equal(job(controller, 'planner').errorCount, 1);
  assert.equal(job(controller, 'planner').nextDueAt, 200);
  assert.equal(controller.snapshot().inFlight, 0);
  assert.equal(controller.snapshot().health.awaitingSettlement, 0);
});
