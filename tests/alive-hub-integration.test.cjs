'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { webcrypto } = require('node:crypto');
const { Worker } = require('node:worker_threads');
const primary = require('../systems/alive-primary-policy-state.js');
const trainer = require('../systems/alive-trainer-state.js');
const replay = require('../systems/alive-replay-state.js');
const hubModule = require('../systems/alive-hub-state.js');
const registry = require('../systems/alive-learned-state-registry.js');
const learned = require('../systems/alive-learned-state-codec.js');
const genome = require('../systems/alive-genome-codec.js');
const bootstrap = require('../systems/alive-primary-policy-bootstrap.js');
const { BleedEdge25AlifeEngine: Engine } = require('../systems/alife-25-bleeding-edge-models.js');
const dependencies = { primary, trainer, replay, hub: hubModule, registry, codec: learned, crypto: webcrypto };
const fields = ['primaryPolicyState', 'trainerCommittedState', 'replayMemoryState', 'hubMemoryState'];
const primaryRows = [['W_actor', 80], ['W_metamorph', 30], ['W_critic', 16], ['W_world', 256], ['W_actor_frozen', 80], ['W_world_frozen', 256]];
const source = fs.readFileSync(require.resolve('../index.html'), 'utf8');
const allocationStart = source.indexOf('        const mixedArenaBuffer = new ArrayBuffer(8192);');
const allocationEnd = source.indexOf('\n        // 13G.', allocationStart);
assert.ok(allocationStart >= 0 && allocationEnd > allocationStart, 'actual local hub allocation anchors exist');
// Only the actual bounded allocation, no renderer/model constructor, IPC or timer.
const allocateHub = new Function(source.slice(allocationStart, allocationEnd) + '\nreturn this.trainableAlifeNeuralHub;');
function hub(count = 3, cursor = count & 31) {
  const result = allocateHub.call({});
  result.replayRing32 = Array.from({ length: count }, (_, i) => ({
    z16: Float32Array.from({ length: 16 }, (_, j) => (i + j) / 16),
    a8: Float32Array.from({ length: 8 }, (_, j) => (i - j) / 8),
    zNext16: Float32Array.from({ length: 16 }, (_, j) => (i - j) / 32), surprise: i ? i / 7 : -0 }));
  result.replayWritePtr = cursor;
  return result;
}
function model(count = 3, cursor = count & 31) {
  const engine = Object.create(Engine.prototype);
  engine.W_hyper_u = Float32Array.from({ length: 16 }, (_, i) => (i - 8) / 32);
  engine.workerTrainerStatus = {}; engine.suspendWorkerTrainer('hub-integration-fixture');
  const h = { D_OBS: 16, D_ACT: 5, D_MORPH: 6, agentId: 'hub-fixture', simulationTick: 37,
    policyCid: 'saved-policy', checkpointCid: 'saved-checkpoint', bleedingEdge25Engine: engine, trainableAlifeNeuralHub: hub(count, cursor) };
  for (const [key, length] of primaryRows) h[key] = Float32Array.from({ length }, (_, i) => i / 256);
  h.deepCortex = { W_actor: h.W_actor, W_critic: h.W_critic };
  return h;
}
const raw = value => Buffer.from(value.buffer || value, value.byteOffset || 0, value.byteLength).toString('hex');
function hubEvidence(value) {
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === 'replayRing32') result[key] = item.map(record => ({ z16: raw(record.z16), a8: raw(record.a8), zNext16: raw(record.zNext16), surprise: record.surprise }));
    else result[key] = ArrayBuffer.isView(item) || item instanceof ArrayBuffer ? raw(item) : structuredClone(item);
  }
  return result;
}
function evidence(h) { return { primary: primaryRows.map(([key]) => raw(h[key])),
  trainer: raw(h.bleedingEdge25Engine.W_hyper_u), clock: h.bleedingEdge25Engine.captureCommittedTrainerState().committedEpoch,
  hub: hubEvidence(h.trainableAlifeNeuralHub) }; }
const stamp = () => ({ creatureId: 'hub-fixture', policyId: 'saved-policy', checkpointId: 'saved-checkpoint', logicalTick: 37,
  modelEpoch: 2, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' });
async function fixture(count = 3, cursor = count & 31) {
  const source = model(count, cursor), local = source.trainableAlifeNeuralHub;
  new Uint32Array(local.zPrev16.buffer).set([0x80000000, 1, 0x80000001]);
  local.f64TrajectoryPrev16[0] = -0; local.f64AdamFirstMoment64[3] = 0.123456789012345;
  local.u64SpikeTrainLanes8[3] = 0xFEDCBA9876543210n; new Uint8Array(local.mixedArenaBuffer, 4928).fill(0xA7);
  local.totalBackpropStepsTrained = 124; local.dreamConsolidationSteps = 11; local.ideasSynthesizedCount = 35;
  const adapters = await Promise.all([primary.create(dependencies), trainer.create(dependencies), replay.create(dependencies), hubModule.create(dependencies)]);
  const snapshot = stamp(), captures = [adapters[0].capture(source, snapshot, { generation: 0 }),
    adapters[1].capture(source.bleedingEdge25Engine, snapshot), adapters[2].capture(local, snapshot, { generation: 0 }),
    adapters[3].capture(local, snapshot, { generation: 0 })];
  const payload = { simulationTick: 37, policyCid: snapshot.policyId, checkpointCid: snapshot.checkpointId, agentId: snapshot.creatureId,
    legacy: { unchanged: true }, primaryPolicyState: genome.primaryState(captures[0]), trainerCommittedState: genome.trainerState(captures[1]),
    replayMemoryState: genome.replayState(captures[2]), hubMemoryState: genome.hubState(captures[3]) };
  const json = await genome.encodeAsync(payload, { learnedCodec: learned, crypto: webcrypto });
  return { source, captures, payload, json, wire: JSON.parse(json) };
}
const prepare = (json, overrides = {}) => bootstrap.prepare({ ...dependencies, json, ...overrides });

test('four-component startup restores exact arena, local histories and ring while preserving existing view identities', async () => {
  for (const [count, cursor] of [[0, 0], [3, 3], [32, 11]]) {
    const f = await fixture(count, cursor), target = model(1), current = await prepare(f.json), before = evidence(target);
    const arena = target.trainableAlifeNeuralHub.mixedArenaBuffer;
    const views = Object.entries(target.trainableAlifeNeuralHub).filter(([, value]) => ArrayBuffer.isView(value));
    assert.equal(current.preflight(target, f.json, { startup: true }).hubPrepared, true);
    assert.deepEqual(evidence(target), before); assert.throws(() => current.captureComponents(target), /not been applied/);
    const receipt = current.apply(target, f.json, { startup: true });
    assert.equal(receipt.tensorCount, 6); assert.equal(receipt.readbackVerified, true, 'old primary asset fence remains valid');
    assert.equal(receipt.hub.status, 'applied'); assert.equal(receipt.hub.tensorCount, 59);
    assert.equal(receipt.hub.tensorBytes, 21368); assert.equal(receipt.hub.stateCount, 44); assert.equal(receipt.hub.readbackVerified, true);
    assert.equal(receipt.replay.count, count); assert.equal(receipt.replay.cursor, cursor);
    assert.deepEqual(evidence(target), evidence(f.source));
    assert.equal(target.trainableAlifeNeuralHub.mixedArenaBuffer, arena);
    for (const [key, value] of views) assert.equal(target.trainableAlifeNeuralHub[key], value, key);
    assert.equal(target.bleedingEdge25Engine.workerTrainerSnapshot().active, false);
    assert.equal(current.snapshot(target).hubStatus, 'restored');
    const captures = current.captureComponents(target);
    for (const value of Object.values(captures)) assert.deepEqual(value.snapshot, captures.primary.snapshot);
  }
});

test('historical zero, one, two and three-component histories remain readable and configured capture adds hub', async () => {
  const f = await fixture();
  for (let count = 0; count < 4; count++) {
    const wire = { ...f.wire }; fields.slice(count).forEach(field => delete wire[field]);
    const json = JSON.stringify(wire), current = await prepare(json), target = model();
    current.apply(target, json, { startup: true });
    assert.equal(current.snapshot(target).hubStatus, 'hub-not-present');
    assert.ok(current.captureComponents(target).hub);
  }
  const triple = { ...f.wire }; delete triple.hubMemoryState;
  const current = await prepare(JSON.stringify(triple), { hub: undefined }), target = model();
  current.apply(target, JSON.stringify(triple), { startup: true }); assert.equal(current.captureComponents(target).hub, null);
  await assert.rejects(prepare(null, { replay: undefined }), /hub capture requires/);
});

test('hub presence cannot downgrade malformed, orphan, duplicate or unavailable state to legacy', async () => {
  const f = await fixture();
  for (const value of [null, false, {}, 'wrong', genome.hubState({})]) await assert.rejects(prepare(JSON.stringify({ ...f.wire, hubMemoryState: value })));
  for (const omitted of fields.slice(0, 3)) await assert.rejects(prepare(JSON.stringify({ ...f.wire, [omitted]: undefined })), /requires/);
  await assert.rejects(prepare(f.json, { hub: undefined }), /hub adapter required/);
  await assert.rejects(prepare(f.json.slice(0, -1) + ',"hubMemoryState":' + JSON.stringify(f.wire.hubMemoryState) + '}'), /duplicate outer/);
  const inside = JSON.stringify(f.wire.hubMemoryState);
  await assert.rejects(prepare(f.json.replace(inside, '{"schema":"duplicate",' + inside.slice(1))));
});

test('all hub snapshot fields and architecture remain bound before model activation', async () => {
  const f = await fixture();
  for (const [key, value] of Object.entries({ creatureId: 'different', policyId: 'different', checkpointId: 'different', logicalTick: 38,
    modelEpoch: 3, capturedAt: '2026-11-09T00:00:01.000Z' })) {
    const wire = await learned.seal({ ...f.captures[3], snapshot: { ...stamp(), [key]: value } }, { crypto: webcrypto });
    await assert.rejects(prepare(JSON.stringify({ ...f.wire, hubMemoryState: wire })), /snapshot conflicts/);
  }
  const wire = await learned.seal({ ...f.captures[3], architecture: { ...f.captures[3].architecture, fingerprint: 'e'.repeat(64) } }, { crypto: webcrypto });
  await assert.rejects(prepare(JSON.stringify({ ...f.wire, hubMemoryState: wire })), /architecture/);
});

test('four-component source, live admission and actual hub binding reject before writes', async () => {
  const f = await fixture(), current = await prepare(f.json), target = model(2), before = evidence(target);
  for (const json of ['{}', null, ' ' + f.json, JSON.stringify({ ...f.wire, hubMemoryState: undefined })]) {
    assert.throws(() => current.apply(target, json, { startup: true }), /source differs/);
  }
  for (const options of [undefined, {}, { startup: false }]) assert.throws(() => current.apply(target, f.json, options), /unsupported-live-restore/);
  assert.deepEqual(evidence(target), before);
  current.preflight(target, f.json, { startup: true }); target.trainableAlifeNeuralHub = hub(2);
  assert.throws(() => current.apply(target, f.json, { startup: true }), /hub binding changed/);
  assert.deepEqual(evidence(target), before);
});

test('hub aliases into primary or trainer storage are rejected during restore and fresh capture', async () => {
  const f = await fixture();
  for (const trainerAlias of [false, true]) {
    const target = model(), current = await prepare(f.json);
    target.trainableAlifeNeuralHub.W_aware16 = trainerAlias ? target.bleedingEdge25Engine.W_hyper_u : target.W_critic;
    const before = evidence(target);
    assert.throws(() => current.apply(target, f.json, { startup: true }), /backings must be disjoint/);
    assert.deepEqual(evidence(target), before);
    assert.throws(() => current.captureComponents(target), /not been applied/);
    const report = current.snapshot(target); report.applied = true;
    assert.equal(current.snapshot(target).applied, false, 'public evidence cannot grant capture admission');
    const fresh = await prepare(null); assert.throws(() => fresh.captureComponents(target), /backings must be disjoint/);
  }
});

test('all destination preparations precede specialized primary, trainer, hub, replay commits', async () => {
  const f = await fixture(), events = [];
  const wrap = (module, label) => ({ async create(options) { const api = await module.create(options); return { ...api,
    preflight(...args) { events.push(label + ':prepare'); return api.preflight(...args); },
    apply(...args) { events.push(label + ':apply'); return api.apply(...args); } }; } });
  const current = await prepare(f.json, { primary: wrap(primary, 'primary'), trainer: wrap(trainer, 'trainer'),
    replay: wrap(replay, 'replay'), hub: wrap(hubModule, 'hub') });
  events.length = 0; current.apply(model(1), f.json, { startup: true });
  assert.deepEqual(events.filter(event => event.endsWith(':apply')), ['primary:apply', 'trainer:apply', 'hub:apply', 'replay:apply']);
  assert.equal(events.slice(0, events.indexOf('primary:apply')).filter(event => event.endsWith(':prepare')).length, 4);
});

test('stale hub preflight is write-free, and late hub failure or false receipts close all capture admission', async () => {
  const f = await fixture();
  for (const fault of ['early', 'throw', 'receipt', 'late']) {
    const failing = { async create(options) { const api = await hubModule.create(options); let checks = 0; return { ...api,
      recheck(...args) { checks++; return fault === 'early' || fault === 'late' && checks === 2 ? { status: 'stale' } : api.recheck(...args); },
      apply(...args) { if (fault === 'throw') throw Error('hub commit failure'); const receipt = api.apply(...args); return fault === 'receipt' ? { ...receipt, stateCount: 45 } : receipt; } }; } };
    const current = await prepare(f.json, { hub: failing }), target = model(1), before = evidence(target);
    if (fault === 'early') { assert.throws(() => current.apply(target, f.json, { startup: true }), /hub preparation changed/); assert.deepEqual(evidence(target), before); }
    else {
      assert.throws(() => current.apply(target, f.json, { startup: true }), error => error.partialApplication === true && error.primaryApplied === true);
      const status = current.snapshot(target); assert.equal(status.partialApplication, true); assert.equal(status.hubInitialized, false);
      assert.throws(() => current.captureComponents(target), /not been applied/);
      assert.throws(() => current.apply(target, f.json, { startup: true }), /previous partial/);
    }
  }
});

test('malformed reserved hub markers and nested markers cannot leak through legacy serialization or invoke accessors', async () => {
  const f = await fixture(); let calls = 0;
  for (const value of [null, undefined, false, {}, { __alive_genome_hub_state_v1__: false, captured: f.captures[3] },
    { ...genome.hubState(f.captures[3]), extra: true }, f.wire.hubMemoryState]) {
    const payload = { ...f.payload, hubMemoryState: value };
    assert.equal(genome.hasAsyncState(payload), true); assert.throws(() => genome.encode(payload), /asynchronous/);
    await assert.rejects(genome.encodeAsync(payload, { learnedCodec: learned, crypto: webcrypto }), /Invalid hub/);
  }
  for (const key of ['captured', '__alive_genome_hub_state_v1__']) {
    const wrapper = genome.hubState(f.captures[3]); Object.defineProperty(wrapper, key, { get() { calls++; return true; } });
    await assert.rejects(genome.encodeAsync({ ...f.payload, hubMemoryState: wrapper }), /Invalid hub/);
  }
  const accessor = { ...f.payload }; Object.defineProperty(accessor, 'hubMemoryState', { get() { calls++; return null; } });
  assert.throws(() => genome.hasAsyncState(accessor), /own data/); assert.equal(calls, 0);
  assert.throws(() => genome.encode({ nested: genome.hubState(f.captures[3]) }), /asynchronous/);
  for (const omitted of fields.slice(0, 3)) { const payload = { ...f.payload }; delete payload[omitted]; await assert.rejects(genome.encodeAsync(payload)); }
});

function barriers() {
  const pending = []; let calls = 0;
  return { pending, crypto: { subtle: { digest(algorithm, bytes) {
    if (++calls > 4) return webcrypto.subtle.digest(algorithm, bytes);
    return new Promise((resolve, reject) => pending.push({ release: () => resolve(webcrypto.subtle.digest(algorithm, bytes)), reject }));
  } } } };
}
test('four seals copy every exact input before the first await and retain owned legacy data', async () => {
  const f = await fixture(), gate = barriers(), expected = f.captures.map(capture => capture.tensors.map(row => raw(new Uint8Array(row.bytes))));
  const operation = genome.encodeAsync(f.payload, { learnedCodec: learned, crypto: gate.crypto });
  assert.equal(gate.pending.length, 4);
  for (const capture of f.captures) for (const row of capture.tensors) new Uint8Array(row.bytes).fill(255);
  f.payload.legacy.unchanged = false; gate.pending.forEach(request => request.release());
  const wire = JSON.parse(await operation); assert.deepEqual(wire.legacy, { unchanged: true });
  for (const [index, field] of fields.entries()) {
    const decoded = learned.verifiedCopy(await learned.decode(wire[field], { crypto: webcrypto }));
    assert.deepEqual(decoded.tensors.map(row => raw(new Uint8Array(row.bytes))), expected[index]);
    assert.deepEqual(wire[field].snapshot, wire.primaryPolicyState.snapshot);
  }
});

test('any rejected or cancelled component physically drains all four seals before save settlement', async () => {
  for (const failure of [0, 1, 2, 3]) {
    const f = await fixture(), gate = barriers(); let settled = false;
    const operation = genome.encodeAsync(f.payload, { learnedCodec: learned, crypto: gate.crypto });
    operation.then(() => { settled = true; }, () => { settled = true; }); gate.pending[failure].reject(Error('digest failure'));
    await new Promise(resolve => setImmediate(resolve)); assert.equal(settled, false);
    gate.pending.forEach((request, i) => { if (i !== failure) request.release(); }); await assert.rejects(operation, /digest failure/);
  }
  const f = await fixture(), gate = barriers(), abort = new AbortController(); let settled = false;
  const operation = genome.encodeAsync(f.payload, { learnedCodec: learned, crypto: gate.crypto, signal: abort.signal });
  operation.catch(() => { settled = true; }); abort.abort();
  await new Promise(resolve => setImmediate(resolve)); assert.equal(settled, false);
  gate.pending.forEach(request => request.release()); await assert.rejects(operation, /cancelled/);
});

test('hub snapshot mismatch, outer conflicts and combined UTF-8 bound reject the entire four-component save', async () => {
  const f = await fixture(), changed = structuredClone(f.payload); changed.hubMemoryState.captured.snapshot.modelEpoch++;
  await assert.rejects(genome.encodeAsync(changed, { learnedCodec: learned, crypto: webcrypto }), /hub snapshot metadata disagree/);
  await assert.rejects(genome.encodeAsync({ ...f.payload, simulationTick: 38 }, { learnedCodec: learned, crypto: webcrypto }), /outer/);
  const triple = { ...f.payload, padding: '' }; delete triple.hubMemoryState;
  const base = await genome.encodeAsync(triple, { learnedCodec: learned, crypto: webcrypto });
  triple.padding = 'é'.repeat(Math.floor((32 * 1024 * 1024 - Buffer.byteLength(base) - 1) / 2));
  assert.ok(Buffer.byteLength(await genome.encodeAsync(triple, { learnedCodec: learned, crypto: webcrypto })) <= 32 * 1024 * 1024);
  await assert.rejects(genome.encodeAsync({ ...triple, hubMemoryState: f.payload.hubMemoryState }, { learnedCodec: learned, crypto: webcrypto }), /32 MiB payload bound/);
});

test('actual serialization worker preserves four-component wire without loading a model or adapter', async t => {
  const worker = new Worker(`const {parentPort,workerData}=require('node:worker_threads');const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
    global.crypto=require('node:crypto').webcrypto;global.postMessage=m=>parentPort.postMessage(m);
    global.addEventListener=(type,fn)=>parentPort.on('message',data=>fn({data}));
    global.importScripts=name=>vm.runInThisContext(fs.readFileSync(path.join(path.dirname(workerData),name),'utf8'));
    vm.runInThisContext(fs.readFileSync(workerData,'utf8'));`, { eval: true, workerData: require.resolve('../systems/alive-genome-codec.js') });
  t.after(() => worker.terminate());
  const exchange = payload => new Promise((resolve, reject) => { worker.once('message', resolve); worker.once('error', reject); worker.postMessage(payload); });
  const f = await fixture(), answer = await exchange({ id: 1, payload: f.payload });
  assert.equal(answer.error, undefined); assert.deepEqual(JSON.parse(answer.json).hubMemoryState, f.wire.hubMemoryState);
  const failure = await exchange({ id: 2, payload: { hubMemoryState: f.payload.hubMemoryState } });
  assert.match(failure.error, /Primary policy state/); assert.equal(failure.json, undefined);
});
