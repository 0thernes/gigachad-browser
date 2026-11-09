'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const { Worker } = require('node:worker_threads');
const fs = require('node:fs');
const path = require('node:path');
const primary = require('../systems/alive-primary-policy-state.js');
const trainer = require('../systems/alive-trainer-state.js');
const replay = require('../systems/alive-replay-state.js');
const registry = require('../systems/alive-learned-state-registry.js');
const learned = require('../systems/alive-learned-state-codec.js');
const genome = require('../systems/alive-genome-codec.js');
const bootstrap = require('../systems/alive-primary-policy-bootstrap.js');
const { BleedEdge25AlifeEngine: Engine } = require('../systems/alife-25-bleeding-edge-models.js');
const dependencies = { primary, trainer, replay, registry, codec: learned, crypto: webcrypto };
const primaryRows = [['W_actor', 80], ['W_metamorph', 30], ['W_critic', 16], ['W_world', 256], ['W_actor_frozen', 80], ['W_world_frozen', 256]];
const snapshot = () => ({ creatureId: 'replay-fixture', policyId: 'saved-policy', checkpointId: 'saved-checkpoint',
  logicalTick: 37, modelEpoch: 2, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' });
function hub(count = 3, cursor = count & 31) {
  return { replayRing32: Array.from({ length: count }, (_, i) => ({ z16: Float32Array.from({ length: 16 }, (_, j) => (i + j) / 16),
    a8: Float32Array.from({ length: 8 }, (_, j) => (i - j) / 8), zNext16: Float32Array.from({ length: 16 }, (_, j) => (i - j) / 32),
    surprise: i === 0 ? -0 : i / 7 })), replayWritePtr: cursor,
    totalBackpropStepsTrained: 41, dreamConsolidationSteps: 7 };
}
function engine() {
  // Actual private transaction, without any model constructor, asset or worker.
  const result = Object.create(Engine.prototype);
  result.W_hyper_u = Float32Array.from({ length: 16 }, (_, i) => (i - 8) / 32);
  result.workerTrainerStatus = {};
  result.suspendWorkerTrainer('replay-integration-fixture');
  return result;
}
function model(count = 3, cursor = count & 31) {
  const result = { D_OBS: 16, D_ACT: 5, D_MORPH: 6, agentId: 'replay-fixture', simulationTick: 37,
    policyCid: 'saved-policy', checkpointCid: 'saved-checkpoint', bleedingEdge25Engine: engine(), trainableAlifeNeuralHub: hub(count, cursor) };
  for (const [key, length] of primaryRows) result[key] = Float32Array.from({ length }, (_, i) => i / 256);
  result.deepCortex = { W_actor: result.W_actor, W_critic: result.W_critic };
  return result;
}
const rawView = view => Buffer.from(view.buffer, view.byteOffset, view.byteLength).toString('hex');
const ringEvidence = value => ({ cursor: value.replayWritePtr, records: value.replayRing32.map(record => ({
  z16: rawView(record.z16), a8: rawView(record.a8), zNext16: rawView(record.zNext16), surprise: record.surprise })) });
function liveEvidence(h) { return { primary: primaryRows.map(([key]) => rawView(h[key])),
  trainer: rawView(h.bleedingEdge25Engine.W_hyper_u), clock: h.bleedingEdge25Engine.captureCommittedTrainerState().committedEpoch,
  replay: ringEvidence(h.trainableAlifeNeuralHub) }; }
async function fixture(count = 3, cursor = count & 31) {
  const source = model(count, cursor), stamp = snapshot();
  if (count) new Uint32Array(source.trainableAlifeNeuralHub.replayRing32[0].z16.buffer).set([0x80000000, 1, 0x80000001]);
  const adapters = await Promise.all([primary.create(dependencies), trainer.create(dependencies), replay.create(dependencies)]);
  const captures = [adapters[0].capture(source, stamp, { generation: 0 }), adapters[1].capture(source.bleedingEdge25Engine, stamp),
    adapters[2].capture(source.trainableAlifeNeuralHub, stamp, { generation: 0 })];
  const payload = { simulationTick: 37, policyCid: stamp.policyId, checkpointCid: stamp.checkpointId, agentId: stamp.creatureId,
    legacy: { untouched: true }, primaryPolicyState: genome.primaryState(captures[0]), trainerCommittedState: genome.trainerState(captures[1]),
    replayMemoryState: genome.replayState(captures[2]) };
  const json = await genome.encodeAsync(payload, { learnedCodec: learned, crypto: webcrypto });
  return { source, adapters, captures, payload, json, wire: JSON.parse(json) };
}
const prepare = (json, overrides = {}) => bootstrap.prepare({ ...dependencies, json, ...overrides });

test('triple component startup restores empty, partial and wrapped full rings before capture admission', async () => {
  for (const [count, cursor] of [[0, 0], [3, 3], [32, 11]]) {
    const f = await fixture(count, cursor), target = model(1), current = await prepare(f.json), before = liveEvidence(target);
    assert.equal(current.preflight(target, f.json, { startup: true }).replayPrepared, true);
    assert.deepEqual(liveEvidence(target), before, 'preflight writes no live state');
    assert.throws(() => current.captureComponents(target), /not been applied/);
    const receipt = current.apply(target, f.json, { startup: true });
    assert.equal(receipt.replay.status, 'applied'); assert.equal(receipt.replay.count, count); assert.equal(receipt.replay.cursor, cursor);
    assert.equal(receipt.replay.tensorBytes, count * 160); assert.equal(receipt.replay.readbackVerified, true);
    assert.deepEqual(liveEvidence(target), liveEvidence(f.source));
    assert.equal(target.trainableAlifeNeuralHub.totalBackpropStepsTrained, 41);
    assert.equal(target.bleedingEdge25Engine.workerTrainerSnapshot().active, false);
    assert.equal(current.snapshot(target).replayStatus, 'restored');
    const captured = current.captureComponents(target);
    assert.deepEqual(captured.primary.snapshot, captured.trainer.snapshot); assert.deepEqual(captured.primary.snapshot, captured.replay.snapshot);
    assert.equal(f.adapters[2].validate(await learned.decode(await learned.encode(captured.replay, { crypto: webcrypto }), { crypto: webcrypto })).count, count);
  }
});

test('historical legacy, primary-only and paired saves remain readable; configured capture always adds current replay', async () => {
  const f = await fixture();
  for (const old of [null, '{}', JSON.stringify({ ...f.wire, replayMemoryState: undefined }),
    JSON.stringify({ ...f.wire, trainerCommittedState: undefined, replayMemoryState: undefined })]) {
    const current = await prepare(old), target = model(2);
    if (old) current.apply(target, old, { startup: true });
    assert.equal(current.snapshot(target).replayStatus, 'replay-not-present');
    const captured = current.captureComponents(target);
    assert.ok(captured.replay); assert.equal(captured.replay.tensors.length, 6);
  }
  const withoutReplay = await prepare(JSON.stringify({ ...f.wire, replayMemoryState: undefined }), { replay: undefined });
  const target = model(); withoutReplay.apply(target, JSON.stringify({ ...f.wire, replayMemoryState: undefined }), { startup: true });
  assert.equal(withoutReplay.captureComponents(target).replay, null);
  await assert.rejects(prepare(null, { trainer: undefined }), /trainer adapter/);
});

test('reserved replay presence rejects malformed values, absent siblings and unavailable adapter before activation', async () => {
  const f = await fixture();
  for (const value of [null, false, {}, 'not-wire', { __alive_genome_replay_state_v1__: true, captured: {} }]) {
    await assert.rejects(prepare(JSON.stringify({ ...f.wire, replayMemoryState: value })));
  }
  for (const omitted of ['primaryPolicyState', 'trainerCommittedState']) {
    await assert.rejects(prepare(JSON.stringify({ ...f.wire, [omitted]: undefined })), /requires/);
  }
  await assert.rejects(prepare(f.json, { replay: undefined }), /replay adapter required/);
  await assert.rejects(prepare(f.json.slice(0, -1) + ',"replayMemoryState":' + JSON.stringify(f.wire.replayMemoryState) + '}'), /duplicate outer/);
  const inside = JSON.stringify(f.wire.replayMemoryState);
  await assert.rejects(prepare(f.json.replace(inside, '{"schema":"duplicate",' + inside.slice(1))));
});

test('replay snapshot and architecture mismatches reject during asynchronous preparation', async () => {
  const f = await fixture();
  for (const [key, value] of Object.entries({ creatureId: 'different', policyId: 'different', checkpointId: 'different', logicalTick: 38,
    modelEpoch: 3, capturedAt: '2026-11-09T00:00:01.000Z' })) {
    const wire = await learned.seal({ ...f.captures[2], snapshot: { ...snapshot(), [key]: value } }, { crypto: webcrypto });
    await assert.rejects(prepare(JSON.stringify({ ...f.wire, replayMemoryState: wire })), /snapshot conflicts/);
  }
  const wire = await learned.seal({ ...f.captures[2], architecture: { ...f.captures[2].architecture, fingerprint: 'e'.repeat(64) } }, { crypto: webcrypto });
  await assert.rejects(prepare(JSON.stringify({ ...f.wire, replayMemoryState: wire })), /architecture/);
});

test('triple source cannot downgrade or live-reload, and actual hub binding is retained across preflight', async () => {
  const f = await fixture(), current = await prepare(f.json), target = model(2), before = liveEvidence(target);
  for (const raw of ['{}', null, ' ' + f.json, JSON.stringify({ ...f.wire, replayMemoryState: undefined })]) {
    assert.throws(() => current.apply(target, raw, { startup: true }), /source differs/);
  }
  for (const options of [undefined, {}, { startup: false }]) assert.throws(() => current.apply(target, f.json, options), /unsupported-live-restore/);
  assert.deepEqual(liveEvidence(target), before);
  current.preflight(target, f.json, { startup: true }); target.trainableAlifeNeuralHub = hub(2);
  assert.throws(() => current.apply(target, f.json, { startup: true }), /hub binding changed/);
  assert.deepEqual(liveEvidence(target), before);
});

test('cross-component replay backing overlap rejects before any exact writes', async () => {
  const f = await fixture();
  for (const useTrainer of [false, true]) {
    const target = model(1), current = await prepare(f.json);
    target.trainableAlifeNeuralHub.replayRing32[0].z16 = useTrainer ? target.bleedingEdge25Engine.W_hyper_u : target.W_critic;
    const before = liveEvidence(target);
    assert.throws(() => current.apply(target, f.json, { startup: true }), /backings must be disjoint/);
    assert.deepEqual(liveEvidence(target), before);
    const fresh = await prepare(null);
    assert.throws(() => fresh.captureComponents(target), /backings must be disjoint/);
  }
});

test('a replay plan invalidated before primary publication cannot change any component', async () => {
  const f = await fixture(), target = model(2), before = liveEvidence(target);
  const stale = { async create(options) { const api = await replay.create(options); return { ...api, recheck() { return { status: 'stale' }; } }; } };
  const current = await prepare(f.json, { replay: stale });
  assert.throws(() => current.apply(target, f.json, { startup: true }), /replay preparation changed/);
  assert.deepEqual(liveEvidence(target), before);
});

test('unexpected replay commit or dishonest receipt after sibling writes blocks capture and further application', async () => {
  const f = await fixture();
  for (const fault of ['throw', 'receipt', 'stale-after-primary']) {
    const failing = { async create(options) { const api = await replay.create(options); let checks = 0;
      return { ...api, recheck(...args) { return fault === 'stale-after-primary' && ++checks === 2 ? { status: 'stale' } : api.recheck(...args); },
        apply(...args) { if (fault === 'throw') throw Error('replay commit failure'); const result = api.apply(...args); return { ...result, count: result.count + 1 }; } }; } };
    const current = await prepare(f.json, { replay: failing }), target = model(1);
    assert.throws(() => current.apply(target, f.json, { startup: true }), error => error.partialApplication === true && error.primaryApplied === true);
    assert.equal(current.snapshot(target).partialApplication, true); assert.equal(current.snapshot(target).replayInitialized, false);
    assert.throws(() => current.captureComponents(target), /not been applied/);
    assert.throws(() => current.apply(target, f.json, { startup: true }), /previous partial/);
  }
});

test('replay reserved fields and nested pending markers never escape through synchronous or fallback legacy JSON', async () => {
  const f = await fixture(); let getterCalls = 0;
  for (const value of [null, undefined, false, {}, { __alive_genome_replay_state_v1__: false, captured: f.captures[2] },
    { ...genome.replayState(f.captures[2]), extra: true }, { schema: 'gigachad.learned-state.v1' }]) {
    const payload = { ...f.payload, replayMemoryState: value };
    assert.equal(genome.hasAsyncState(payload), true); assert.throws(() => genome.encode(payload), /asynchronous/);
    await assert.rejects(genome.encodeAsync(payload, { learnedCodec: learned, crypto: webcrypto }), /Invalid replay/);
  }
  for (const key of ['captured', '__alive_genome_replay_state_v1__']) {
    const wrapper = genome.replayState(f.captures[2]); Object.defineProperty(wrapper, key, { get() { getterCalls++; return true; } });
    await assert.rejects(genome.encodeAsync({ ...f.payload, replayMemoryState: wrapper }), /Invalid replay/);
  }
  const accessor = { ...f.payload }; Object.defineProperty(accessor, 'replayMemoryState', { get() { getterCalls++; return null; } });
  assert.throws(() => genome.hasAsyncState(accessor), /own data/);
  assert.equal(getterCalls, 0);
  assert.throws(() => genome.encode({ nested: genome.replayState(f.captures[2]) }), /asynchronous/);
  await assert.rejects(genome.encodeAsync({ ...f.payload, trainerCommittedState: undefined }), /Invalid trainer/);
  const noTrainer = { ...f.payload }; delete noTrainer.trainerCommittedState;
  await assert.rejects(genome.encodeAsync(noTrainer), /requires both/);
});

function barriers() {
  const pending = []; let calls = 0;
  return { pending, crypto: { subtle: { digest(algorithm, bytes) {
    if (++calls > 3) return webcrypto.subtle.digest(algorithm, bytes);
    return new Promise((resolve, reject) => pending.push({ release: () => resolve(webcrypto.subtle.digest(algorithm, bytes)), reject }));
  } } } };
}
test('all three seals own their bytes before the first await and retain one shared snapshot', async () => {
  const f = await fixture(), gate = barriers(), expected = f.captures.map(capture => capture.tensors.map(row => rawView(new Uint8Array(row.bytes))));
  const operation = genome.encodeAsync(f.payload, { learnedCodec: learned, crypto: gate.crypto });
  assert.equal(gate.pending.length, 3, 'all seals started in the initial turn');
  for (const capture of f.captures) for (const row of capture.tensors) new Uint8Array(row.bytes).fill(255);
  f.payload.legacy.untouched = false;
  for (const request of gate.pending) request.release();
  const wire = JSON.parse(await operation);
  assert.deepEqual(wire.legacy, { untouched: true });
  for (const [index, field] of ['primaryPolicyState', 'trainerCommittedState', 'replayMemoryState'].entries()) {
    const decoded = learned.verifiedCopy(await learned.decode(wire[field], { crypto: webcrypto }));
    assert.deepEqual(decoded.tensors.map(row => rawView(new Uint8Array(row.bytes))), expected[index]);
    assert.deepEqual(wire[field].snapshot, wire.primaryPolicyState.snapshot);
  }
});

test('a rejected or aborted sibling cannot settle encoding while another component seal remains in flight', async () => {
  for (const failedIndex of [0, 1, 2]) {
    const f = await fixture(), gate = barriers(); let settled = false;
    const operation = genome.encodeAsync(f.payload, { learnedCodec: learned, crypto: gate.crypto });
    operation.then(() => { settled = true; }, () => { settled = true; });
    gate.pending[failedIndex].reject(Error('component digest failure'));
    await new Promise(resolve => setImmediate(resolve)); assert.equal(settled, false);
    gate.pending.forEach((request, i) => { if (i !== failedIndex) request.release(); });
    await assert.rejects(operation, /component digest failure/);
  }
  const f = await fixture(), gate = barriers(), abort = new AbortController(); let settled = false;
  const operation = genome.encodeAsync(f.payload, { learnedCodec: learned, crypto: gate.crypto, signal: abort.signal });
  operation.catch(() => { settled = true; }); abort.abort();
  await new Promise(resolve => setImmediate(resolve)); assert.equal(settled, false);
  gate.pending.forEach(request => request.release()); await assert.rejects(operation, /cancelled/);
});

test('third snapshot mismatch, outer conflicts and aggregate UTF-8 growth reject the complete save', async () => {
  const f = await fixture();
  const changed = structuredClone(f.payload); changed.replayMemoryState.captured.snapshot.modelEpoch++;
  await assert.rejects(genome.encodeAsync(changed, { learnedCodec: learned, crypto: webcrypto }), /replay snapshot metadata disagree/);
  await assert.rejects(genome.encodeAsync({ ...f.payload, simulationTick: 38 }, { learnedCodec: learned, crypto: webcrypto }), /outer/);
  const empty = JSON.parse(f.json); delete empty.replayMemoryState;
  const limit = 32 * 1024 * 1024, pair = { ...f.payload }; delete pair.replayMemoryState;
  pair.padding = '';
  const minimalPair = await genome.encodeAsync(pair, { learnedCodec: learned, crypto: webcrypto });
  const room = limit - Buffer.byteLength(minimalPair) - 1;
  pair.padding = 'é'.repeat(Math.floor(room / 2));
  assert.ok(Buffer.byteLength(await genome.encodeAsync(pair, { learnedCodec: learned, crypto: webcrypto })) <= limit);
  await assert.rejects(genome.encodeAsync({ ...pair, replayMemoryState: f.payload.replayMemoryState }, { learnedCodec: learned, crypto: webcrypto }), /32 MiB payload bound/);
});

test('real serializer worker retains replay bytes and rejects replay-only input without application modules', async t => {
  const codecPath = require.resolve('../systems/alive-genome-codec.js');
  const worker = new Worker(`const {parentPort,workerData}=require('node:worker_threads'); const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
    global.crypto=require('node:crypto').webcrypto;global.postMessage=message=>parentPort.postMessage(message);
    global.addEventListener=(type,fn)=>parentPort.on('message',data=>fn({data}));
    global.importScripts=name=>vm.runInThisContext(fs.readFileSync(path.join(path.dirname(workerData),name),'utf8'));
    vm.runInThisContext(fs.readFileSync(workerData,'utf8'));`, { eval: true, workerData: codecPath });
  t.after(() => worker.terminate());
  const exchange = payload => new Promise((resolve, reject) => { worker.once('message', resolve); worker.once('error', reject); worker.postMessage(payload); });
  const f = await fixture();
  const answer = await exchange({ id: 1, payload: f.payload }); assert.equal(answer.error, undefined);
  const wire = JSON.parse(answer.json); assert.deepEqual(wire.replayMemoryState, f.wire.replayMemoryState);
  const rejected = await exchange({ id: 2, payload: { replayMemoryState: f.payload.replayMemoryState } });
  assert.match(rejected.error, /Primary policy state/); assert.equal(rejected.json, undefined);
});
