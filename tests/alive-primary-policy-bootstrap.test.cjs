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
const trainer = require('../systems/alive-trainer-state.js');
const { BleedEdge25AlifeEngine: Engine } = require('../systems/alife-25-bleeding-edge-models.js');
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
const preparePaired = (json, options = {}) => bootstrap.prepare({ ...deps, trainer, json, ...options });
const trainerBytes = e => Buffer.from(e.W_hyper_u.buffer, e.W_hyper_u.byteOffset, e.W_hyper_u.byteLength).toString('hex');
function engine(epoch = 0, timeoutMs = 5000) {
  // Use the actual private engine transaction without constructing assets,
  // workers or a running model.
  const e = Object.create(Engine.prototype);
  e.W_hyper_u = Float32Array.from({ length: 16 }, (_, i) => (i - 8) / 32);
  e.workerTrainerStatus = {};
  e.suspendWorkerTrainer('bootstrap-fixture');
  if (epoch || timeoutMs !== 5000) {
    const value = e.captureCommittedTrainerState(); value.committedEpoch = epoch; value.timeoutMs = timeoutMs;
    e.commitCommittedTrainerRestore(e.prepareCommittedTrainerRestore(value, { expectedGeneration: e.workerTrainerSnapshot().generation }));
  }
  return e;
}
async function pairedSaved(epoch = 37) {
  const f = await saved(), e = engine(epoch, 1500), adapter = await trainer.create(deps);
  new Uint32Array(e.W_hyper_u.buffer).set([0, 0x80000000, 1, 0x80000001]);
  const trainerCaptured = adapter.capture(e, metadata());
  const trainerWire = await codec.seal(trainerCaptured, { crypto: webcrypto });
  const outer = { ...f.outer, trainerCommittedState: trainerWire };
  return { ...f, e, trainerCaptured, trainerWire, outer, json: JSON.stringify(outer) };
}
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

test('paired prepare requires the primary component and a trainer adapter; present corrupt fields never downgrade', async () => {
  const f = await pairedSaved();
  await assert.rejects(preparePaired(JSON.stringify({ trainerCommittedState: f.trainerWire })), /requires primary/);
  await assert.rejects(prepare(f.json), /trainer adapter required/);
  for (const trainerCommittedState of [null, {}, 'bad-wire', { ...f.trainerWire, schema: 'unknown' }]) {
    await assert.rejects(preparePaired(JSON.stringify({ ...f.outer, trainerCommittedState })));
  }
  await assert.rejects(preparePaired(JSON.stringify({ ...f.outer, primaryPolicyState: null })));
});

test('both authenticated components share every snapshot identity and reject independent architecture or numeric drift', async () => {
  const f = await pairedSaved();
  for (const [key, value] of Object.entries({ creatureId: 'other', policyId: 'other', checkpointId: 'other', logicalTick: 32,
    modelEpoch: 8, capturedAt: '2026-11-09T00:00:01.000Z' })) {
    const wire = await codec.seal({ ...f.trainerCaptured, snapshot: { ...metadata(), [key]: value } }, { crypto: webcrypto });
    await assert.rejects(preparePaired(JSON.stringify({ ...f.outer, trainerCommittedState: wire })), /snapshot conflicts/);
  }
  await assert.rejects(async () => {
    const wire = await codec.seal({ ...f.trainerCaptured, snapshot: { ...metadata(), resumeBoundary: 'old-authority' } }, { crypto: webcrypto });
    await preparePaired(JSON.stringify({ ...f.outer, trainerCommittedState: wire }));
  });
  const wrongArchitecture = { ...f.trainerCaptured, architecture: { ...f.trainerCaptured.architecture, fingerprint: 'e'.repeat(64) } };
  const wrongShape = { ...f.trainerCaptured, tensors: f.trainerCaptured.tensors.map(t => ({ ...t, dimensions: [4, 4] })) };
  const nonfinite = { ...f.trainerCaptured, tensors: f.trainerCaptured.tensors.map(t => ({ ...t, bytes: t.bytes.slice(0) })) };
  new Float32Array(nonfinite.tensors[0].bytes)[15] = NaN;
  for (const captured of [wrongArchitecture, wrongShape, nonfinite]) {
    const wire = await codec.seal(captured, { crypto: webcrypto });
    await assert.rejects(preparePaired(JSON.stringify({ ...f.outer, trainerCommittedState: wire })));
  }
});

test('trainer inner raw JSON and outer duplicates retain strict parsing and exact source admission', async () => {
  const f = await pairedSaved(), raw = f.json, controller = await preparePaired(raw), h = model();
  h.bleedingEdge25Engine = engine();
  const duplicateOuter = raw.slice(0, -1) + ',"trainerCommittedState":' + JSON.stringify(f.trainerWire) + '}';
  await assert.rejects(preparePaired(duplicateOuter), /duplicate outer/);
  const inner = JSON.stringify(f.trainerWire);
  await assert.rejects(preparePaired(raw.replace(inner, '{"schema":"ignored",' + inner.slice(1))));
  for (const changed of [' ' + raw, JSON.stringify({ trainerCommittedState: f.trainerWire })]) {
    const before = bytes(h), beforeTrainer = trainerBytes(h.bleedingEdge25Engine);
    assert.throws(() => controller.preflight(h, changed, { startup: true }), /source differs/);
    assert.throws(() => controller.apply(h, changed, { startup: true }), /source differs/);
    assert.deepEqual(bytes(h), before); assert.equal(trainerBytes(h.bleedingEdge25Engine), beforeTrainer);
  }
});

test('paired live restore rejects before bytes, clocks or option accessors are touched', async () => {
  const f = await pairedSaved(), controller = await preparePaired(f.json), h = model(); h.bleedingEdge25Engine = engine(2);
  const before = bytes(h), trainerBefore = trainerBytes(h.bleedingEdge25Engine), generation = h.bleedingEdge25Engine.workerTrainerSnapshot().generation;
  let reads = 0;
  const accessor = { get startup() { reads++; return true; } };
  for (const options of [undefined, {}, { startup: false }, Object.create({ startup: true }), accessor]) {
    assert.throws(() => controller.preflight(h, f.json, options), /unsupported-live-restore/);
    assert.throws(() => controller.apply(h, f.json, options), /unsupported-live-restore/);
  }
  assert.equal(reads, 0); assert.deepEqual(bytes(h), before); assert.equal(trainerBytes(h.bleedingEdge25Engine), trainerBefore);
  assert.equal(h.bleedingEdge25Engine.captureCommittedTrainerState().committedEpoch, 2);
  assert.equal(h.bleedingEdge25Engine.workerTrainerSnapshot().generation, generation);
});

test('paired prepared source cannot be downgraded to legacy or absent data even after successful startup', async () => {
  const f = await pairedSaved(), controller = await preparePaired(f.json), h = model(); h.bleedingEdge25Engine = engine(2);
  controller.apply(h, f.json, { startup: true });
  const before = bytes(h), trainerBefore = trainerBytes(h.bleedingEdge25Engine), state = controller.snapshot(h), worker = h.bleedingEdge25Engine.workerTrainerSnapshot();
  for (const raw of ['{}', null, '', undefined, JSON.stringify({ simulationTick: 1 })]) {
    assert.throws(() => controller.preflight(h, raw, { startup: true }), /paired.*source differs/);
    assert.throws(() => controller.apply(h, raw, { startup: true }), /paired.*source differs/);
    assert.deepEqual(bytes(h), before); assert.equal(trainerBytes(h.bleedingEdge25Engine), trainerBefore);
    assert.deepEqual(controller.snapshot(h), state); assert.deepEqual(h.bleedingEdge25Engine.workerTrainerSnapshot(), worker);
  }
});

test('startup pair restores seven exact views and private clock while retaining aliases and remaining suspended', async () => {
  const f = await pairedSaved(), controller = await preparePaired(f.json), h = model(); h.bleedingEdge25Engine = engine(2, 30000);
  const before = bytes(h), trainerBefore = trainerBytes(h.bleedingEdge25Engine), alias = h.bleedingEdge25Engine.W_hyper_u;
  assert.equal(controller.preflight(h, f.json, { startup: true }).trainerPrepared, true);
  assert.deepEqual(bytes(h), before); assert.equal(trainerBytes(h.bleedingEdge25Engine), trainerBefore);
  legacyAssignments(h, f.outer);
  const receipt = controller.apply(h, f.json, { startup: true });
  assert.deepEqual(bytes(h), bytes(f.h)); assert.equal(trainerBytes(h.bleedingEdge25Engine), trainerBytes(f.e));
  assert.equal(h.bleedingEdge25Engine.W_hyper_u, alias); assert.equal(h.deepCortex.W_actor, h.W_actor);
  assert.equal(receipt.trainer.committedEpoch, 37); assert.equal(receipt.trainer.timeoutMs, 1500); assert.equal(receipt.trainer.active, false);
  assert.equal(h.bleedingEdge25Engine.workerTrainerSnapshot().phase, 'suspended');
  assert.equal(controller.snapshot(h).initialized, true); assert.equal(controller.snapshot(h).trainerStatus, 'restored-suspended');
  receipt.trainer.committedEpoch = 1234;
  const evidence = controller.snapshot(h); evidence.trainerReceipt.committedEpoch = 4321;
  assert.equal(controller.snapshot(h).trainerReceipt.committedEpoch, 37);
  assert.match(evidence.scope, /not full learned-state continuity/);
});

test('replaced own engine binding and cross-component backing aliases reject paired writes', async () => {
  const f = await pairedSaved(), controller = await preparePaired(f.json), h = model(); h.bleedingEdge25Engine = engine();
  controller.preflight(h, f.json, { startup: true }); h.bleedingEdge25Engine = engine(9);
  const before = bytes(h), trainerBefore = trainerBytes(h.bleedingEdge25Engine);
  assert.throws(() => controller.apply(h, f.json, { startup: true }), /engine binding changed/);
  assert.deepEqual(bytes(h), before); assert.equal(trainerBytes(h.bleedingEdge25Engine), trainerBefore);
  const shared = model(); shared.bleedingEdge25Engine = engine(); shared.bleedingEdge25Engine.W_hyper_u = shared.W_critic;
  const sharedBefore = bytes(shared);
  assert.throws(() => controller.preflight(shared, f.json, { startup: true }), /must be disjoint/);
  assert.throws(() => controller.apply(shared, f.json, { startup: true }), /must be disjoint/);
  assert.deepEqual(bytes(shared), sharedBefore);
  const accessor = model(); let reads = 0;
  Object.defineProperty(accessor, 'bleedingEdge25Engine', { get() { reads++; return engine(); } });
  assert.throws(() => controller.preflight(accessor, f.json, { startup: true }), /own data/); assert.equal(reads, 0);
});

test('last trainer generation recheck denies a plan invalidated before any primary write', async () => {
  const f = await pairedSaved();
  const invalidatingTrainer = { async create(options) {
    const a = await trainer.create(options);
    return { ...a, preflight(decoded, e, context) {
      const prepared = a.preflight(decoded, e, context); e.suspendWorkerTrainer('intervening-fence'); return prepared;
    } };
  } };
  const controller = await preparePaired(f.json, { trainer: invalidatingTrainer }), h = model(); h.bleedingEdge25Engine = engine(2);
  const before = bytes(h), trainerBefore = trainerBytes(h.bleedingEdge25Engine);
  assert.throws(() => controller.apply(h, f.json, { startup: true }), /preparation changed/);
  assert.deepEqual(bytes(h), before); assert.equal(trainerBytes(h.bleedingEdge25Engine), trainerBefore);
  assert.equal(controller.snapshot(h).partialApplication, false);
});

test('unexpected trainer commit failure after primary writes locks capture and never claims initialized', async () => {
  const f = await pairedSaved();
  for (const faultyApply of [() => { throw new Error('injected commit fault'); }, () => ({ status: 'restored', active: true, weightsBytes: 64 })]) {
    const failingTrainer = { async create(options) { const a = await trainer.create(options); return { ...a, apply: faultyApply }; } };
    const controller = await preparePaired(f.json, { trainer: failingTrainer }), h = model(); h.bleedingEdge25Engine = engine(2);
    assert.throws(() => controller.apply(h, f.json, { startup: true }), error => error.partialApplication === true && error.primaryApplied === true);
    assert.deepEqual(bytes(h), bytes(f.h), 'Already-applied primary bytes are honestly reported, not claimed rolled back');
    const state = controller.snapshot(h); assert.equal(state.initialized, false); assert.equal(state.trainerInitialized, false); assert.equal(state.partialApplication, true);
    assert.equal(state.trainerReceipt, null); assert.throws(() => controller.capture(h), /not been applied/);
    assert.throws(() => controller.captureComponents(h), /not been applied/);
    assert.throws(() => controller.preflight(h, f.json, { startup: true }), /previous partial/);
    assert.throws(() => controller.apply(h, '{}'), /previous partial/);
  }
});

test('paired capture uses one common snapshot and owns all bytes without activating or suspending the engine', async () => {
  const controller = await preparePaired(null), h = model(); h.bleedingEdge25Engine = engine(19, 1200);
  const e = h.bleedingEdge25Engine, before = e.workerTrainerSnapshot(), expected = trainerBytes(e);
  const captured = controller.captureComponents(h);
  assert.equal(captured.primary.tensors.length, 6); assert.equal(captured.trainer.tensors.length, 1);
  assert.deepEqual(captured.primary.snapshot, captured.trainer.snapshot);
  assert.deepEqual(e.workerTrainerSnapshot(), before);
  assert.equal(Buffer.from(captured.trainer.tensors[0].bytes).toString('hex'), expected);
  assert.equal(codec.untagValue(captured.trainer.stateValues.committedEpoch), 19);
  const original = Buffer.from(captured.primary.tensors.find(t => t.id === 'W_actor').bytes).toString('hex');
  h.W_actor.fill(5); e.W_hyper_u.fill(8);
  assert.equal(Buffer.from(captured.trainer.tensors[0].bytes).toString('hex'), expected);
  assert.equal(Buffer.from(captured.primary.tensors.find(t => t.id === 'W_actor').bytes).toString('hex'), original);
  assert.equal(controller.snapshot(h).trainerStatus, 'trainer-not-present');
  const shared = model(); shared.bleedingEdge25Engine = engine(); shared.bleedingEdge25Engine.W_hyper_u = shared.W_critic;
  assert.throws(() => controller.captureComponents(shared), /must be disjoint/);
});

test('primary-only restore remains supported and does not invent a restored trainer history', async () => {
  const f = await saved(), controller = await preparePaired(f.json), h = model(); h.bleedingEdge25Engine = engine(8);
  const before = trainerBytes(h.bleedingEdge25Engine);
  controller.preflight(h, f.json); const result = controller.apply(h, f.json);
  assert.equal(result.trainer, null); assert.equal(controller.snapshot(h).trainerStatus, 'trainer-not-present');
  assert.equal(trainerBytes(h.bleedingEdge25Engine), before); assert.equal(h.bleedingEdge25Engine.captureCommittedTrainerState().committedEpoch, 8);
  assert.equal(codec.untagValue(controller.captureComponents(h).trainer.stateValues.committedEpoch), 8);
  const oldController = await prepare(null); assert.equal(oldController.captureComponents(model()).trainer, null);
});

test('capture while a real engine job is pending leaves admission, pending identity and generation unchanged', async t => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'Worker');
  class InertWorker { postMessage(message) { this.sent = message; } terminate() {} }
  Object.defineProperty(globalThis, 'Worker', { value: InertWorker, configurable: true, writable: true });
  const controller = await preparePaired(null), h = model(); h.bleedingEdge25Engine = engine(12);
  const e = h.bleedingEdge25Engine;
  t.after(() => { e.suspendWorkerTrainer('test-cleanup'); if (descriptor) Object.defineProperty(globalThis, 'Worker', descriptor); else delete globalThis.Worker; });
  assert.equal(e.resumeWorkerTrainer().status, 'ready');
  assert.equal(e.dispatchWorkerTrainer(new Float32Array(16).fill(.25)).status, 'submitted');
  const before = e.workerTrainerSnapshot(), worker = e._worker, captured = controller.captureComponents(h);
  assert.deepEqual(e.workerTrainerSnapshot(), before); assert.equal(e._worker, worker);
  assert.equal(codec.untagValue(captured.trainer.stateValues.committedEpoch), 12);
  assert.equal(captured.trainer.stateManifest.length, 2, 'No pending job or execution authority enters durable state');
});

test('terminal trainer clock survives paired startup as exhausted without wrapping', async () => {
  const f = await pairedSaved(Number.MAX_SAFE_INTEGER), controller = await preparePaired(f.json), h = model(); h.bleedingEdge25Engine = engine();
  controller.apply(h, f.json, { startup: true });
  assert.equal(h.bleedingEdge25Engine.captureCommittedTrainerState().committedEpoch, Number.MAX_SAFE_INTEGER);
  assert.equal(h.bleedingEdge25Engine.workerTrainerSnapshot().phase, 'suspended');
});

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

test('actual index startup loader applies both exact components before acknowledging initialized state', async () => {
  const f = await pairedSaved(), controller = await preparePaired(f.json), h = model(); h.bleedingEdge25Engine = engine(3);
  const fixture = actualLoader(h, controller, f.json, applied => {
    if (!applied) return;
    assert.deepEqual(bytes(h), bytes(f.h)); assert.equal(trainerBytes(h.bleedingEdge25Engine), trainerBytes(f.e));
    assert.equal(h.bleedingEdge25Engine.captureCommittedTrainerState().committedEpoch, 37);
    assert.equal(h.bleedingEdge25Engine.workerTrainerSnapshot().phase, 'suspended');
  });
  fixture.context.window.aliveStartup = { snapshot: () => ({ phase: 'main' }) };
  assert.equal(h.loadPersistentGenome(), true); assert.equal(fixture.marks.at(-1).applied, true);
  assert.equal(h.persistentGenomeRestore.primaryPolicy.trainer.committedEpoch, 37);
  assert.equal(controller.snapshot(h).trainerStatus, 'restored-suspended');
});

test('actual index loader rejects paired explicit and published-runtime loads before native or legacy mutation', async () => {
  const f = await pairedSaved(), raw = JSON.stringify({ ...f.outer, authenticAsmodensius: { sentinel: 'must not import' } });
  for (const [phase, explicit] of [['ready', false], ['main', true], ['ready', true]]) {
    const controller = await preparePaired(raw), h = model(); h.bleedingEdge25Engine = engine(3);
    let nativeCalls = 0; h.authenticAsmodensius = { importState() { nativeCalls++; return true; } };
    const before = bytes(h), trainerBefore = trainerBytes(h.bleedingEdge25Engine), fixture = actualLoader(h, controller, raw);
    fixture.context.window.aliveStartup = { snapshot: () => ({ phase }) };
    assert.throws(() => explicit ? h.loadPersistentGenome(raw) : h.loadPersistentGenome(), /unsupported-live-restore/);
    assert.deepEqual(bytes(h), before); assert.equal(trainerBytes(h.bleedingEdge25Engine), trainerBefore);
    assert.equal(h.simulationTick, 0); assert.equal(nativeCalls, 0); assert.equal(fixture.marks.at(-1).applied, false);
  }
});

test('actual index loader treats trainer-only input as exact and fails closed when bootstrap is absent', () => {
  const raw = JSON.stringify({ simulationTick: 999, W_actor: Array(80).fill(2), trainerCommittedState: null });
  const h = model(), before = bytes(h), fixture = actualLoader(h, undefined, raw);
  fixture.context.window.aliveStartup = { snapshot: () => ({ phase: 'main' }) };
  assert.throws(() => h.loadPersistentGenome(), /Exact component bootstrap is unavailable/);
  assert.deepEqual(bytes(h), before); assert.equal(h.simulationTick, 0); assert.equal(fixture.marks.at(-1).applied, false);
});

test('actual startup loader rejects a trainer binding failure before native and compatibility writes', async () => {
  const f = await pairedSaved(), raw = JSON.stringify({ ...f.outer, authenticAsmodensius: { sentinel: true } });
  const controller = await preparePaired(raw), h = model(); h.bleedingEdge25Engine = engine(); h.bleedingEdge25Engine.W_hyper_u = h.W_critic;
  let nativeCalls = 0; h.authenticAsmodensius = { importState() { nativeCalls++; return true; } };
  const before = bytes(h), fixture = actualLoader(h, controller, raw);
  fixture.context.window.aliveStartup = { snapshot: () => ({ phase: 'main' }) };
  assert.throws(() => h.loadPersistentGenome(), /must be disjoint/);
  assert.deepEqual(bytes(h), before); assert.equal(nativeCalls, 0); assert.equal(fixture.marks.at(-1).applied, false);
});

function actualSmokeReload(fixture, h, json) {
  const main = fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8');
  const start = main.indexOf('                      // Smoke reloads a newly saved source, not the startup source.');
  const end = main.indexOf('                      // End of the explicit smoke reload boundary.', start);
  assert.ok(start >= 0 && end > start, 'Actual smoke reload boundary must be present');
  Object.assign(fixture.context.window, { AlivePrimaryPolicyBootstrap: bootstrap,
    AlivePrimaryPolicyState: primary, AliveTrainerState: trainer, AliveLearnedStateRegistry: registry,
    AliveLearnedStateCodec: codec, crypto: webcrypto });
  fixture.context.humunculusRuntime = h;
  fixture.context.durableRead = { status: 'ready', json };
  return vm.runInContext('(async () => {' + main.slice(start, end) + '\nreturn durableGenomeValidation;})()', fixture.context);
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

test('actual paired smoke authenticates detached components without claiming live restore or replacing its controller', async () => {
  const f = await pairedSaved(), original = await preparePaired(null), h = model(); h.bleedingEdge25Engine = engine(4);
  const before = bytes(h), trainerBefore = trainerBytes(h.bleedingEdge25Engine), fixture = actualLoader(h, original, null);
  const result = await actualSmokeReload(fixture, h, f.json);
  assert.equal(result.prepared, true); assert.equal(result.trainerPrepared, true); assert.equal(result.application, 'startup-only-not-reloaded');
  assert.equal(fixture.context.window.alivePrimaryPolicyBootstrap, original); assert.equal(fixture.marks.length, 0);
  assert.deepEqual(bytes(h), before); assert.equal(trainerBytes(h.bleedingEdge25Engine), trainerBefore);
  assert.equal(h.bleedingEdge25Engine.captureCommittedTrainerState().committedEpoch, 4);
  const malformed = JSON.stringify({ ...f.outer, trainerCommittedState: { ...f.trainerWire, schema: 'bad' } });
  await assert.rejects(actualSmokeReload(fixture, h, malformed));
  assert.equal(fixture.context.window.alivePrimaryPolicyBootstrap, original); assert.deepEqual(bytes(h), before);
});
