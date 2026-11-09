'use strict';
// The real codec, registry and engine transaction; no browser, workers or network.
const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const codec = require('../systems/alive-learned-state-codec.js');
const registry = require('../systems/alive-learned-state-registry.js');
const trainer = require('../systems/alive-trainer-state.js');
const { BleedEdge25AlifeEngine: Engine } = require('../systems/alife-25-bleeding-edge-models.js');
const create = () => trainer.create({ registry, codec, crypto: webcrypto });
const snapshot = () => ({ creatureId: 'trainer-fixture', policyId: 'policy-fixture', checkpointId: 'checkpoint-fixture',
  logicalTick: 31, modelEpoch: 4, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' });
const hex = v => Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString('hex');
const decode = input => codec.encode(input, { crypto: webcrypto }).then(json => codec.decode(json, { crypto: webcrypto }));
const context = e => ({ expectedGeneration: e.workerTrainerSnapshot().generation });
function engine(epoch = 0, timeoutMs = 5000) {
  const e = Object.create(Engine.prototype);
  e.W_hyper_u = Float32Array.from({ length: 16 }, (_, i) => (i - 8) / 32);
  e.workerTrainerStatus = {};
  e.suspendWorkerTrainer('fixture');
  if (epoch || timeoutMs !== 5000) {
    const data = e.captureCommittedTrainerState();
    data.committedEpoch = epoch; data.timeoutMs = timeoutMs;
    e.commitCommittedTrainerRestore(e.prepareCommittedTrainerRestore(data, context(e)));
  }
  return e;
}
test('static wire contains one exact weight view and authoritative independent clock/configuration', async () => {
  const a = await create(), e = engine(37, 1500);
  e.workerTrainerStatus = { committedEpoch: 999 };
  const input = a.capture(e, snapshot());
  assert.equal(input.tensors.length, 1);
  assert.equal(input.tensors[0].id, 'W_hyper_u');
  assert.equal(input.tensors[0].length, 16); assert.equal(input.tensors[0].byteLength, 64);
  assert.deepEqual(input.tensors[0].paths, [{ root: 'trainer', keys: ['W_hyper_u'] }]);
  assert.equal(input.stateManifest.length, 2);
  const valid = a.validate(await decode(input));
  assert.equal(valid.committedEpoch, 37); assert.equal(valid.timeoutMs, 1500); assert.equal(valid.exhausted, false);
  assert.equal(a.scope.completeApplicationCatalog, false);
  assert.match(a.scope.externalDependencies, /World latent/);
  assert.equal(a.architecture.fingerprint, (await create()).architecture.fingerprint);
});
test('sealed roundtrip retains signed-zero/subnormal bits, epoch and timeout while preserving target alias', async () => {
  const a = await create(), source = engine(37, 50), target = engine(2, 30000);
  new Uint32Array(source.W_hyper_u.buffer).set([0, 0x80000000, 1, 0x80000001, 0x007fffff, 0x807fffff]);
  source.W_hyper_u[15] = Math.fround(.123456789);
  const expected = hex(source.W_hyper_u), alias = target.W_hyper_u;
  const prepared = a.preflight(await decode(a.capture(source, snapshot())), target, context(target));
  assert.equal(a.recheck(prepared, target), true);
  const receipt = a.apply(prepared, target);
  assert.equal(receipt.status, 'restored'); assert.equal(receipt.active, false);
  assert.equal(target.W_hyper_u, alias); assert.equal(hex(alias), expected);
  assert.equal(target.captureCommittedTrainerState().committedEpoch, 37);
  assert.equal(target.workerTrainerSnapshot().timeoutMs, 50);
  assert.equal(target.workerTrainerSnapshot().phase, 'suspended');
  assert.equal(a.recheck(prepared, target), false);
  assert.throws(() => a.apply(prepared, target), /stale/);
});
test('capture owns all bytes before asynchronous sealing, and decoder mirrors cannot change restore', async () => {
  const a = await create(), source = engine(8), target = engine(), expected = hex(source.W_hyper_u);
  const captured = a.capture(source, snapshot()); source.W_hyper_u.fill(3);
  const decoded = await decode(captured);
  new Uint8Array(decoded.tensors[0].bytes).fill(255);
  if (decoded.stateValues) decoded.stateValues.committedEpoch = 999;
  const plan = a.preflight(decoded, target, context(target));
  new Uint8Array(decoded.tensors[0].bytes).fill(0);
  a.apply(plan, target);
  assert.equal(hex(target.W_hyper_u), expected);
  assert.equal(target.captureCommittedTrainerState().committedEpoch, 8);
});
test('rehashed missing roster, substituted shape, unknown state, nonfinite tail and bad clock reject before mutation', async () => {
  const a = await create(), source = engine(5), target = engine(3), before = hex(target.W_hyper_u);
  for (const mutate of [
    c => { c.tensors = []; },
    c => { c.tensors[0].dimensions = [4, 4]; },
    c => { c.stateManifest = c.stateManifest.filter(s => s.id !== 'timeoutMs'); delete c.stateValues.timeoutMs; },
    c => { c.stateValues.committedEpoch = -1; },
    c => { c.stateValues.timeoutMs = 30001; }
  ]) {
    const captured = a.capture(source, snapshot()); mutate(captured);
    await assert.rejects(async () => a.preflight(await decode(captured), target, context(target)));
    assert.equal(hex(target.W_hyper_u), before); assert.equal(target.captureCommittedTrainerState().committedEpoch, 3);
  }
  source.W_hyper_u[15] = NaN;
  assert.throws(() => a.capture(source, snapshot()), /finite|numeric/i);
  assert.throws(() => a.preflight({}, target, context(target)), /verified|handle|decoded/i);
});
test('opaque plans reject forged handles, another engine, changed bytes, methods and generations', async () => {
  const a = await create(), decoded = await decode(a.capture(engine(9), snapshot()));
  assert.equal(a.recheck({}, engine()), false);
  for (const mutation of [
    e => { e.W_hyper_u[15] += .25; },
    e => { e.W_hyper_u = new Float32Array(e.W_hyper_u); },
    e => { e.commitCommittedTrainerRestore = function () { throw Error('replacement must not run'); }; },
    e => { e.suspendWorkerTrainer('new-generation'); }
  ]) {
    const target = engine(), p = a.preflight(decoded, target, context(target)); mutation(target);
    const before = hex(target.W_hyper_u);
    assert.equal(a.recheck(p, target), false); assert.throws(() => a.apply(p, target), /stale/);
    assert.equal(hex(target.W_hyper_u), before);
  }
  const target = engine(), p = a.preflight(decoded, target, context(target));
  assert.equal(a.recheck(p, engine()), false); assert.equal(a.discard(p, engine()), false);
  assert.equal(a.discard(p, target), true); assert.equal(a.discard(p, target), false);
  assert.throws(() => a.apply(p, target), /stale/);
});
test('method accessors are rejected without executing them and current generation is required', async () => {
  const a = await create(), target = engine(), decoded = await decode(a.capture(engine(), snapshot()));
  let reads = 0;
  Object.defineProperty(target, 'captureCommittedTrainerState', { get() { reads++; throw Error('accessor'); } });
  assert.throws(() => a.capture(target, snapshot()), /method/); assert.equal(reads, 0);
  assert.throws(() => a.preflight(decoded, engine()), /generation/);
});
test('terminal private epoch survives serialization as exhausted and never silently resets', async () => {
  const a = await create(), target = engine(), decoded = await decode(a.capture(engine(Number.MAX_SAFE_INTEGER, 30000), snapshot()));
  assert.equal(a.validate(decoded).exhausted, true);
  a.apply(a.preflight(decoded, target, context(target)), target);
  assert.equal(target.captureCommittedTrainerState().committedEpoch, Number.MAX_SAFE_INTEGER);
  assert.equal(target.resumeWorkerTrainer().status, 'blocked');
  assert.equal(target.captureCommittedTrainerState().committedEpoch, Number.MAX_SAFE_INTEGER);
});
