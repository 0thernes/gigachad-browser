'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const primary = require('../systems/alive-primary-policy-state.js');
const registry = require('../systems/alive-learned-state-registry.js');
const codec = require('../systems/alive-learned-state-codec.js');
const bootstrap = require('../systems/alive-primary-policy-bootstrap.js');
const deps = { primary, registry, codec, crypto: webcrypto };
const keys = ['W_actor', 'W_metamorph', 'W_critic', 'W_world', 'W_actor_frozen', 'W_world_frozen'];
function model(seed = 1) {
  const h = { D_OBS: 16, D_ACT: 5, D_MORPH: 6, agentId: 'default-runtime', simulationTick: 0, policyCid: 'initial-policy', checkpointCid: 'initial-checkpoint', authorityEpoch: 900 };
  for (const [lane, [key, length]] of [['W_actor',80],['W_metamorph',30],['W_critic',16],['W_world',256],['W_actor_frozen',80],['W_world_frozen',256]].entries()) {
    h[key] = Float32Array.from({ length }, (_, i) => (seed + lane + 1) / 32 + (i % 17) / 256);
  }
  h.deepCortex = { W_actor: h.W_actor, W_critic: h.W_critic };
  return h;
}
const bytes = h => Object.fromEntries(keys.map(key => [key, Buffer.from(h[key].buffer, h[key].byteOffset, h[key].byteLength).toString('hex')]));
const metadata = () => ({ creatureId: 'saved-creature', policyId: 'saved-policy', checkpointId: 'saved-checkpoint', logicalTick: 31, modelEpoch: 7, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' });
async function saved() {
  const h = model(7), adapter = await primary.create(deps);
  h.W_actor[0] = -0; h.W_world[1] = 1.401298464324817e-45;
  const captured = adapter.capture(h, metadata(), { generation: 4 });
  const wire = await codec.seal(captured, { crypto: webcrypto });
  const outer = { simulationTick: 31, policyCid: 'saved-policy', checkpointCid: 'saved-checkpoint', W_actor: Array(80).fill(0.12346), primaryPolicyState: wire, unknown: { retained: true } };
  return { h, captured, wire, outer, json: JSON.stringify(outer) };
}
const prepare = json => bootstrap.prepare({ ...deps, json });
function legacyAssignments(h, outer) {
  h.simulationTick = outer.simulationTick; h.policyCid = outer.policyCid; h.checkpointCid = outer.checkpointCid;
  h.W_actor.fill(0.12346); h.W_world.fill(0.5); h.W_actor_frozen.set(h.W_actor); h.W_world_frozen.set(h.W_world);
}

test('preflight precedes legacy writes and fresh apply restores exact six tensors and independent baselines', async () => {
  const f = await saved(), controller = await prepare(f.json), target = model(), before = bytes(target);
  assert.equal(controller.preflight(target, f.json).status, 'prepared'); assert.deepEqual(bytes(target), before);
  legacyAssignments(target, f.outer);
  const result = controller.apply(target, f.json); assert.equal(result.status, 'applied'); assert.equal(result.readbackVerified, true);
  assert.deepEqual(bytes(target), bytes(f.h)); assert.notEqual(bytes(target).W_actor, bytes(target).W_actor_frozen);
  assert.equal(target.deepCortex.W_actor, target.W_actor); assert.equal(target.deepCortex.W_critic, target.W_critic);
  assert.equal(controller.snapshot(target).source, 'primary'); assert.match(result.scope, /six primary tensors only/);
});

test('capture uses current host tick and IDs but privately preserves saved creature and model epoch', async () => {
  const f = await saved(), controller = await prepare(f.json), target = model();
  legacyAssignments(target, f.outer); controller.apply(target, f.json);
  target.simulationTick = 55; target.policyCid = 'new-policy'; target.checkpointCid = 'new-checkpoint'; target.authorityEpoch = 20000;
  const captured = controller.capture(target);
  assert.deepEqual({ ...captured.snapshot, capturedAt: undefined }, { creatureId: 'saved-creature', policyId: 'new-policy', checkpointId: 'new-checkpoint', logicalTick: 55, modelEpoch: 7, capturedAt: undefined, resumeBoundary: 'fresh-browser-authority' });
  assert.equal(new Date(captured.snapshot.capturedAt).toISOString(), captured.snapshot.capturedAt);
  assert.equal(target.agentId, 'default-runtime'); assert.equal(captured.tensors.length, 6);
  assert.equal(captured.provenance.completeApplicationCatalog, false);
});

test('unapplied prepared state cannot be captured and bookkeeping is per runtime', async () => {
  const f = await saved(), controller = await prepare(f.json), a = model(), b = model();
  assert.throws(() => controller.capture(a), /not been applied/);
  controller.apply(a, f.json); assert.equal(controller.snapshot(a).applied, true);
  assert.equal(controller.snapshot(b).applied, false); assert.equal(controller.snapshot(b).creatureId, null);
  assert.throws(() => controller.capture(b), /not been applied/);
});

test('legacy and absent startup still compile for future capture without importing primary defaults', async () => {
  for (const json of [null, '', JSON.stringify({ simulationTick: 9, unknown: 'legacy' })]) {
    const controller = await prepare(json), h = model(), before = bytes(h);
    assert.equal(controller.preflight(h, json).status, 'not-present'); assert.equal(controller.apply(h, json).status, 'not-present'); assert.deepEqual(bytes(h), before);
    const captured = controller.capture(h); assert.equal(captured.snapshot.creatureId, h.agentId); assert.equal(captured.snapshot.modelEpoch, 0);
    assert.equal(captured.snapshot.logicalTick, h.simulationTick); assert.equal(captured.tensors.length, 6);
  }
});

test('a changed primary-bearing raw source cannot reuse prepared bytes, including mere whitespace differences', async () => {
  const f = await saved(), controller = await prepare(f.json), h = model(), before = bytes(h);
  for (const changed of [' ' + f.json, JSON.stringify({ ...f.outer, unknown: { changed: true } })]) {
    assert.throws(() => controller.preflight(h, changed), /source differs/); assert.throws(() => controller.apply(h, changed), /source differs/); assert.deepEqual(bytes(h), before);
  }
  const legacy = JSON.stringify({ simulationTick: 2, policyCid: 'older-policy', checkpointCid: 'older-checkpoint' });
  assert.equal(controller.preflight(h, legacy).status, 'not-present'); assert.equal(controller.apply(h, legacy).status, 'not-present');
  assert.deepEqual(bytes(h), before); assert.equal(controller.capture(h).snapshot.creatureId, 'default-runtime');
});

test('current primary member cannot be decoded lazily by a controller prepared for legacy input', async () => {
  const f = await saved(), controller = await prepare('{}'), h = model(), before = bytes(h);
  assert.throws(() => controller.preflight(h, f.json), /prepare a new controller/); assert.deepEqual(bytes(h), before);
});

test('outer snapshot identity conflicts reject before activation', async () => {
  const f = await saved();
  for (const change of [{ simulationTick: 30 }, { simulationTick: '31' }, { policyCid: 'other' }, { checkpointCid: 'other' }, { agentId: 'other-creature' }]) {
    await assert.rejects(prepare(JSON.stringify({ ...f.outer, ...change })), /conflicts/);
  }
  const missing = { ...f.outer }; delete missing.policyCid;
  await assert.rejects(prepare(JSON.stringify(missing)), /conflicts/);
});

test('validly rehashed wrong architecture, missing roster, wrong shape and nonfinite policy reject during prepare', async () => {
  const f = await saved();
  const wrongArchitecture = { ...f.captured, architecture: { ...f.captured.architecture, fingerprint: 'f'.repeat(64) } };
  const missing = { ...f.captured, tensors: f.captured.tensors.filter(t => t.id !== 'W_world_frozen') };
  const wrongShape = { ...f.captured, tensors: f.captured.tensors.map(t => t.id === 'W_actor' ? { ...t, dimensions: [80] } : t) };
  const nonfinite = { ...f.captured, tensors: f.captured.tensors.map(t => ({ ...t, bytes: t.bytes.slice(0) })) };
  new Float32Array(nonfinite.tensors.find(t => t.id === 'W_actor').bytes)[0] = NaN;
  for (const captured of [wrongArchitecture, missing, wrongShape, nonfinite]) {
    const wire = await codec.seal(captured, { crypto: webcrypto });
    await assert.rejects(prepare(JSON.stringify({ ...f.outer, primaryPolicyState: wire })));
  }
});

test('present null/corrupt primary state never falls back to legacy data', async () => {
  const f = await saved();
  for (const primaryPolicyState of [null, {}, 'not-a-wire-payload', { ...f.wire, schema: 'unknown' }]) {
    await assert.rejects(prepare(JSON.stringify({ ...f.outer, primaryPolicyState })));
  }
});

test('duplicate outer fields and duplicate inner wire fields are rejected before activation', async () => {
  const f = await saved(), wireJSON = JSON.stringify(f.wire);
  const prefix = '{"simulationTick":31,"policyCid":"saved-policy","checkpointCid":"saved-checkpoint",';
  await assert.rejects(prepare(prefix + '"simulationTick":31,"primaryPolicyState":' + wireJSON + '}'), /duplicate outer/);
  const innerDuplicate = '{"schema":"ignored-unknown",' + wireJSON.slice(1);
  await assert.rejects(prepare(prefix + '"primaryPolicyState":' + innerDuplicate + '}'));
  // Whitespace outside the compact authenticated inner value remains valid.
  const controller = await prepare(' \n' + prefix + '"primaryPolicyState" : ' + wireJSON + '\n}\n');
  assert.ok(controller);
});

test('apply validates current bindings again and leaves tensors untouched on a broken alias', async () => {
  const f = await saved(), controller = await prepare(f.json), h = model(); controller.preflight(h, f.json);
  legacyAssignments(h, f.outer); h.deepCortex.W_actor = new Float32Array(h.W_actor); const before = bytes(h);
  assert.throws(() => controller.apply(h, f.json), /alias/); assert.deepEqual(bytes(h), before);
  assert.throws(() => controller.capture(h), /not been applied/);
});

test('capture rejects metadata accessors, invalid counters and identifiers without inventing values', async () => {
  const controller = await prepare(null); let reads = 0; const accessor = model();
  Object.defineProperty(accessor, 'policyCid', { get() { reads++; return 'value'; } });
  assert.throws(() => controller.capture(accessor), /accessor/); assert.equal(reads, 0);
  for (const change of [h => h.simulationTick = -0, h => h.simulationTick = -1, h => h.policyCid = '', h => h.agentId = 'x'.repeat(129), h => h.checkpointCid = 'bad\nvalue']) {
    const h = model(); change(h); assert.throws(() => controller.capture(h));
  }
});

test('capture returns owned bytes and a source-free public evidence snapshot', async () => {
  const f = await saved(), controller = await prepare(f.json), h = model(); controller.apply(h, f.json);
  const captured = controller.capture(h), first = captured.tensors.find(t => t.id === 'W_actor');
  const original = new Uint8Array(first.bytes).slice(); h.W_actor.fill(8); assert.deepEqual(new Uint8Array(first.bytes), original);
  const evidence = controller.snapshot(h); assert.equal(own(evidence, 'json'), false); assert.equal(own(evidence, 'decoded'), false);
  evidence.source = 'mutated'; assert.equal(controller.snapshot(h).source, 'primary');
});

function own(value, key) { return Object.prototype.hasOwnProperty.call(value, key); }

function actualLoader(h, controller, raw, onMark = () => {}) {
  const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const match = source.match(/^      loadPersistentGenome\([^\n]*\) \{[\s\S]*?^      \}/m);
  assert.ok(match, 'Actual production loadPersistentGenome must be present');
  Object.assign(h, { bodyRecipe: {}, cognitiveCortex: { realizationLedger: [] }, visitedUrlTabooSet: new Set(),
    clickedAnchorTabooSet: new Set(), SWARM_FORMATIONS: [], updateMorphologyVector() {} });
  const marks = [];
  const driver = { initialJSON() { return raw; }, snapshot() { return { source: 'canonical' }; },
    markApplied(applied, options) { marks.push({ applied, options }); onMark(applied); } };
  const context = vm.createContext({ window: { alivePrimaryPolicyBootstrap: controller, aliveGenomePersistence: driver }, console,
    localStorage: { getItem() { throw new Error('Canonical startup must not read legacy storage'); } } });
  h.loadPersistentGenome = vm.runInContext('({' + match[0] + '}).loadPersistentGenome', context);
  return { marks, context };
}

test('actual index loader establishes exact authoritative bytes and distinct baselines before markApplied', async () => {
  const f = await saved();
  const outer = { ...f.outer, W_world: Array(256).fill(.33333), W_metamorph: Array(30).fill(.11111), W_critic: Array(16).fill(.22222) };
  const raw = JSON.stringify(outer), controller = await prepare(raw), h = model(), expected = bytes(f.h);
  const fixture = actualLoader(h, controller, raw, applied => { if (applied) assert.deepEqual(bytes(h), expected, 'Driver must not observe applied before exact restore'); });
  assert.equal(h.loadPersistentGenome(), true);
  assert.deepEqual(bytes(h), expected); assert.equal(h.simulationTick, 31); assert.equal(h.policyCid, 'saved-policy');
  assert.equal(h.persistentGenomeRestore.primaryPolicy.readbackVerified, true); assert.equal(fixture.marks.length, 1); assert.equal(fixture.marks[0].applied, true);
  assert.notEqual(bytes(h).W_actor, bytes(h).W_actor_frozen); assert.notEqual(bytes(h).W_world, bytes(h).W_world_frozen);
});

test('actual loader failed primary preflight precedes legacy parameter and native mutation', async () => {
  const f = await saved(), raw = JSON.stringify({ ...f.outer, authenticAsmodensius: { sentinel: 'must not reach importer' } });
  const controller = await prepare(raw), h = model(), before = bytes(h); let nativeCalls = 0;
  h.authenticAsmodensius = { importState() { nativeCalls++; return true; } };
  h.deepCortex.W_actor = new Float32Array(h.W_actor);
  const fixture = actualLoader(h, controller, raw);
  assert.throws(() => h.loadPersistentGenome(), /alias/);
  assert.deepEqual(bytes(h), before); assert.equal(h.simulationTick, 0); assert.equal(nativeCalls, 0);
  assert.equal(fixture.marks.at(-1).applied, false); assert.throws(() => controller.capture(h), /not been applied/);
});

test('actual loader cannot route malformed explicit primary data through legacy fallback', async () => {
  const controller = await prepare('{}'), h = model(), before = bytes(h), fixture = actualLoader(h, controller, '{}');
  assert.throws(() => h.loadPersistentGenome(JSON.stringify({ simulationTick: 99, W_actor: Array(80).fill(1), primaryPolicyState: null })), /source differs/);
  assert.deepEqual(bytes(h), before); assert.equal(h.simulationTick, 0); assert.equal(fixture.marks.at(-1).applied, false);
});

test('actual absent loader returns without apply and the fresh runtime can still capture', async () => {
  const controller = await prepare(null), h = model(), fixture = actualLoader(h, controller, null);
  assert.equal(h.loadPersistentGenome(), false); assert.equal(controller.snapshot(h).source, 'fresh');
  assert.equal(controller.capture(h).snapshot.creatureId, h.agentId); assert.equal(fixture.marks[0].options.hadJSON, false);
});

function actualSmokeReload(fixture, h, json) {
  const main = fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8');
  const start = main.indexOf('                      // Smoke reloads a newly saved source, not the startup source.');
  const end = main.indexOf('                      // End of the explicit smoke reload boundary.', start);
  assert.ok(start >= 0 && end > start, 'Actual smoke reload boundary must be present');
  Object.assign(fixture.context.window, { AlivePrimaryPolicyBootstrap: bootstrap,
    AlivePrimaryPolicyState: primary, AliveLearnedStateRegistry: registry,
    AliveLearnedStateCodec: codec, crypto: webcrypto });
  fixture.context.humunculusRuntime = h;
  fixture.context.durableRead = { status: 'ready', json };
  return vm.runInContext('(async () => {' + main.slice(start, end) + '\n})()', fixture.context);
}

test('actual smoke reload authenticates its newly saved exact source without weakening startup binding', async () => {
  const f = await saved(), original = await prepare(null), h = model(), fixture = actualLoader(h, original, null);
  assert.throws(() => original.preflight(h, f.json), /source differs/);
  await actualSmokeReload(fixture, h, f.json);
  assert.notEqual(fixture.context.window.alivePrimaryPolicyBootstrap, original);
  assert.equal(fixture.context.window.alivePrimaryPolicyBootstrap.snapshot(h).applied, true);
  assert.deepEqual(bytes(h), bytes(f.h));
  assert.equal(h.persistentGenomeRestore.primaryPolicy.readbackVerified, true);
  assert.equal(fixture.marks.at(-1).applied, true);
  assert.throws(() => original.preflight(h, f.json), /source differs/);
});

test('actual smoke reload preserves the previous controller and live bytes if new wire authentication fails', async () => {
  const f = await saved(), original = await prepare(null), h = model(), before = bytes(h), fixture = actualLoader(h, original, null);
  const json = JSON.stringify({ ...f.outer, primaryPolicyState: { ...f.wire, schema: 'invalid-wire' } });
  await assert.rejects(actualSmokeReload(fixture, h, json));
  assert.equal(fixture.context.window.alivePrimaryPolicyBootstrap, original);
  assert.deepEqual(bytes(h), before); assert.equal(fixture.marks.length, 0);
});

test('actual smoke reload checks current aliases before publishing the replacement controller', async () => {
  const f = await saved(), original = await prepare(null), h = model(), before = bytes(h), fixture = actualLoader(h, original, null);
  h.deepCortex.W_actor = new Float32Array(h.W_actor);
  await assert.rejects(actualSmokeReload(fixture, h, f.json), /alias/);
  assert.equal(fixture.context.window.alivePrimaryPolicyBootstrap, original);
  assert.deepEqual(bytes(h), before); assert.equal(fixture.marks.length, 0);
});
