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
const cortex = require('../systems/alive-cortex-state.js');
const registry = require('../systems/alive-learned-state-registry.js');
const learned = require('../systems/alive-learned-state-codec.js');
const genome = require('../systems/alive-genome-codec.js');
const bootstrap = require('../systems/alive-primary-policy-bootstrap.js');
const { BleedEdge25AlifeEngine: Engine } = require('../systems/alife-25-bleeding-edge-models.js');
const dependencies = { primary, trainer, replay, hub: hubModule, cortex, registry, codec: learned, crypto: webcrypto };
const fields = ['primaryPolicyState', 'trainerCommittedState', 'replayMemoryState', 'hubMemoryState', 'cortexMemoryState'];
const primaryRows = [['W_actor', 80], ['W_metamorph', 30], ['W_critic', 16], ['W_world', 256], ['W_actor_frozen', 80], ['W_world_frozen', 256]];
const source = fs.readFileSync(require.resolve('../index.html'), 'utf8');
function extract(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from && source.indexOf(start, from + start.length) < 0, 'unique actual source boundaries');
  return source.slice(from, to);
}
const allocateCortex = new Function('hybridQrng', extract('        const initXavier = (rows, cols) => {', '        // Sovereign Browser Master Controller Telemetry'));
const allocateHub = new Function(extract('        const mixedArenaBuffer = new ArrayBuffer(8192);', '        // 13G.'));
const firstUseGuards = new Function('dc', 'cn', [
  extract('        if (!dc.moeCoveragePhases8 || !dc.moeCoverageMasks8 || !dc.moeInput256 || !dc.moeResidual256) {', '        let bestE1 = 0;'),
  extract('        if (!cn.axonCoveragePhases512 || !cn.axonCoverageMasks512) {', '        let actualSpikeCount = 0;'),
  extract('        if (!dc.attentionQkvCoverage768 || !dc.attentionOutputCoverage512) {', '        // W_attn_out is 64x64:')
].join('\n'));
function model() {
  const engine = Object.create(Engine.prototype);
  engine.W_hyper_u = Float32Array.from({ length: 16 }, (_, i) => (i - 8) / 32);
  engine.workerTrainerStatus = {}; engine.suspendWorkerTrainer('cortex-integration-fixture');
  const h = { D_OBS: 16, D_ACT: 5, D_MORPH: 6, agentId: 'cortex-fixture', simulationTick: 37,
    policyCid: 'saved-policy', checkpointCid: 'saved-checkpoint', bleedingEdge25Engine: engine };
  for (const [key, length] of primaryRows) h[key] = Float32Array.from({ length }, (_, i) => i / 256);
  // Actual bounded allocations only; no broad constructor, stepping, IPC or timer.
  allocateCortex.call(h, { u64: () => 0x12345678n }); allocateHub.call(h);
  const local = h.trainableAlifeNeuralHub;
  local.replayRing32 = Array.from({ length: 3 }, (_, i) => ({ z16: Float32Array.from({ length: 16 }, (_, j) => (i + j) / 32),
    a8: Float32Array.from({ length: 8 }, (_, j) => (i + j) / 16), zNext16: Float32Array.from({ length: 16 }, (_, j) => (i - j) / 32), surprise: i / 7 }));
  local.replayWritePtr = 3;
  return h;
}
const raw = value => Buffer.from(value.buffer || value, value.byteOffset || 0, value.byteLength).toString('hex');
function localEvidence(owner) {
  return Object.fromEntries(Object.entries(owner).map(([key, value]) => [key,
    ArrayBuffer.isView(value) || value instanceof ArrayBuffer ? raw(value) : structuredClone(value)]));
}
function evidence(h) { return { primary: primaryRows.map(([key]) => raw(h[key])), trainer: raw(h.bleedingEdge25Engine.W_hyper_u),
  clock: h.bleedingEdge25Engine.captureCommittedTrainerState().committedEpoch,
  hub: localEvidence(h.trainableAlifeNeuralHub), cortex: localEvidence(h.deepCortex), connectome: localEvidence(h.connectome512) }; }
const stamp = () => ({ creatureId: 'cortex-fixture', policyId: 'saved-policy', checkpointId: 'saved-checkpoint', logicalTick: 37,
  modelEpoch: 2, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' });
let cached;
async function fixture() {
  if (!cached) cached = (async () => {
    const source = model(), dc = source.deepCortex, cn = source.connectome512;
    source.W_actor[3] = .75; source.W_critic[4] = -.5;
    dc.W_moe_experts[17] = .3; dc.rssmH[19] = -.2; dc.W_stdp_elig[10] = .4;
    new Uint32Array(dc.W_enc1.buffer).set([0x80000000, 1, 0x80000001]);
    dc.cortexCoverageStep = 11; dc.hopfieldWritePtr = 65; dc.attentionQkvPhase = 37;
    dc.attentionOutputPhase = 270; dc.moeExplorationCursor = 4; cn.axonalPresynapticCursor = 273;
    const adapters = await Promise.all([primary.create(dependencies), trainer.create(dependencies), replay.create(dependencies), hubModule.create(dependencies), cortex.create(dependencies)]);
    const snapshot = stamp(), captures = [adapters[0].capture(source, snapshot, { generation: 0 }),
      adapters[1].capture(source.bleedingEdge25Engine, snapshot), adapters[2].capture(source.trainableAlifeNeuralHub, snapshot, { generation: 0 }),
      adapters[3].capture(source.trainableAlifeNeuralHub, snapshot, { generation: 0 }), adapters[4].capture(source, snapshot, { generation: 0 })];
    const payload = { simulationTick: 37, policyCid: snapshot.policyId, checkpointCid: snapshot.checkpointId, agentId: snapshot.creatureId,
      legacy: { unchanged: true }, primaryPolicyState: genome.primaryState(captures[0]), trainerCommittedState: genome.trainerState(captures[1]),
      replayMemoryState: genome.replayState(captures[2]), hubMemoryState: genome.hubState(captures[3]), cortexMemoryState: genome.cortexState(captures[4]) };
    const json = await genome.encodeAsync(payload, { learnedCodec: learned, crypto: webcrypto });
    return { source, captures, payload, json, wire: JSON.parse(json) };
  })();
  return cached;
}
const prepare = (json, overrides = {}) => bootstrap.prepare({ ...dependencies, json, ...overrides });

test('five-component startup restores cold cortex and connectome with exact primary and synaptic aliases', async () => {
  const f = await fixture(), target = model(), current = await prepare(f.json), before = evidence(target);
  const cortexOwner = target.deepCortex, connectomeOwner = target.connectome512;
  const views = [target.deepCortex, target.connectome512].flatMap(owner => Object.entries(owner).filter(([, value]) => ArrayBuffer.isView(value)).map(([key, value]) => ({ owner, key, value })));
  assert.equal(current.preflight(target, f.json, { startup: true }).cortexPrepared, true); assert.deepEqual(evidence(target), before);
  assert.throws(() => current.captureComponents(target), /not been applied/);
  const receipt = current.apply(target, f.json, { startup: true });
  assert.equal(receipt.tensorCount, 6); assert.equal(receipt.readbackVerified, true);
  assert.deepEqual([receipt.cortex.tensorCount, receipt.cortex.tensorBytes, receipt.cortex.stateCount], [47, 4994760, 43]);
  assert.equal(receipt.cortex.status, 'applied'); assert.equal(receipt.cortex.readbackVerified, true);
  assert.deepEqual(evidence(target), evidence(f.source));
  assert.equal(target.deepCortex, cortexOwner); assert.equal(target.connectome512, connectomeOwner);
  for (const { owner, key, value } of views) assert.equal(owner[key], value, key);
  assert.equal(target.deepCortex.W_actor, target.W_actor); assert.equal(target.deepCortex.W_critic, target.W_critic);
  assert.equal(target.connectome512.synWeights262K, target.deepCortex.W_connectome_synapses);
  assert.equal(target.connectome512.synapticWeights, target.deepCortex.W_connectome_synapses);
  assert.equal(target.connectome512.eligibilityTraces, target.deepCortex.W_stdp_elig);
  const restored = evidence(target); firstUseGuards(target.deepCortex, target.connectome512);
  assert.deepEqual(evidence(target), restored, 'actual first-step initialization guards do not reset restored arrays or cursors');
  for (const { owner, key, value } of views) assert.equal(owner[key], value, key);
  assert.equal(target.bleedingEdge25Engine.workerTrainerSnapshot().active, false);
  assert.equal(current.snapshot(target).cortexStatus, 'restored');
  const captures = current.captureComponents(target);
  for (const value of Object.values(captures)) assert.deepEqual(value.snapshot, captures.primary.snapshot);
});

test('historical zero through four-component records stay readable and configured capture adds cortex', async () => {
  const f = await fixture();
  for (let count = 0; count < 5; count++) {
    const wire = { ...f.wire }; fields.slice(count).forEach(field => delete wire[field]);
    const json = JSON.stringify(wire), current = await prepare(json), target = model();
    current.apply(target, json, { startup: true });
    assert.equal(current.snapshot(target).cortexStatus, 'cortex-not-present'); assert.ok(current.captureComponents(target).cortex);
  }
  const old = { ...f.wire }; delete old.cortexMemoryState;
  const current = await prepare(JSON.stringify(old), { cortex: undefined }), target = model();
  current.apply(target, JSON.stringify(old), { startup: true }); assert.equal(current.captureComponents(target).cortex, undefined);
  await assert.rejects(prepare(null, { hub: undefined }), /cortex capture requires/);
});

test('present malformed, orphan, duplicate or unavailable cortex records never become legacy fallback', async () => {
  const f = await fixture();
  for (const value of [null, false, {}, 'wrong', genome.cortexState({})]) await assert.rejects(prepare(JSON.stringify({ ...f.wire, cortexMemoryState: value })));
  for (const omitted of fields.slice(0, 4)) await assert.rejects(prepare(JSON.stringify({ ...f.wire, [omitted]: undefined })), /requires/);
  await assert.rejects(prepare(f.json, { cortex: undefined }), /cortex adapter required/);
  await assert.rejects(prepare(f.json.slice(0, -1) + ',"cortexMemoryState":' + JSON.stringify(f.wire.cortexMemoryState) + '}'), /duplicate outer/);
  const inside = JSON.stringify(f.wire.cortexMemoryState);
  await assert.rejects(prepare(f.json.replace(inside, '{"schema":"duplicate",' + inside.slice(1))));
});

test('cortex snapshot identity and architecture cannot conflict with the other four prepared components', async () => {
  const f = await fixture();
  for (const [key, value] of Object.entries({ creatureId: 'different', logicalTick: 38, modelEpoch: 3, capturedAt: '2026-11-09T00:00:01.000Z' })) {
    const wire = await learned.seal({ ...f.captures[4], snapshot: { ...stamp(), [key]: value } }, { crypto: webcrypto });
    await assert.rejects(prepare(JSON.stringify({ ...f.wire, cortexMemoryState: wire })), /snapshot conflicts/);
  }
  const wire = await learned.seal({ ...f.captures[4], architecture: { ...f.captures[4].architecture, fingerprint: 'e'.repeat(64) } }, { crypto: webcrypto });
  await assert.rejects(prepare(JSON.stringify({ ...f.wire, cortexMemoryState: wire })), /architecture/);
});

test('strict source and startup admission plus both actual runtime owners are bound before writes', async () => {
  const f = await fixture(), current = await prepare(f.json), target = model(), before = evidence(target);
  for (const json of ['{}', null, ' ' + f.json, JSON.stringify({ ...f.wire, cortexMemoryState: undefined })]) assert.throws(() => current.apply(target, json, { startup: true }), /source differs/);
  for (const options of [undefined, {}, { startup: false }]) assert.throws(() => current.apply(target, f.json, options), /unsupported-live-restore/);
  assert.deepEqual(evidence(target), before);
  for (const owner of ['deepCortex', 'connectome512']) {
    const bound = await prepare(f.json), h = model(); bound.preflight(h, f.json, { startup: true }); h[owner] = { ...h[owner] };
    const previous = evidence(h); assert.throws(() => bound.apply(h, f.json, { startup: true }), /binding changed/); assert.deepEqual(evidence(h), previous);
  }
});

test('intentional alias breakage and cross-component cortex backing aliases reject without writes', async () => {
  const f = await fixture();
  const changes = [
    h => { h.deepCortex.W_actor = h.W_actor.slice(); },
    h => { h.connectome512.synapticWeights = h.deepCortex.W_connectome_synapses.slice(); },
    h => { h.deepCortex.h256 = h.W_world; },
    h => { h.deepCortex.x64 = h.trainableAlifeNeuralHub.visionDomGrid8x8; },
    h => { h.deepCortex.attnWeights8 = h.trainableAlifeNeuralHub.replayRing32[0].a8; },
    h => { h.deepCortex.attnWeights8 = new Float32Array(h.bleedingEdge25Engine.W_hyper_u.buffer, 0, 8); }
  ];
  const current = await prepare(f.json), fresh = await prepare(null);
  for (const change of changes) {
    const h = model(); change(h); const before = evidence(h);
    assert.throws(() => current.apply(h, f.json, { startup: true }), /alias|backing|shape/);
    assert.deepEqual(evidence(h), before); assert.throws(() => fresh.captureComponents(h), /alias|backing|shape/);
  }
});

test('all five preparations precede primary, trainer, hub, cortex, replay publication', async () => {
  const f = await fixture(), events = [];
  const wrap = (module, label) => ({ async create(options) { const api = await module.create(options); return { ...api,
    preflight(...args) { events.push(label + ':prepare'); return api.preflight(...args); },
    apply(...args) { events.push(label + ':apply'); return api.apply(...args); } }; } });
  const current = await prepare(f.json, { primary: wrap(primary, 'primary'), trainer: wrap(trainer, 'trainer'),
    replay: wrap(replay, 'replay'), hub: wrap(hubModule, 'hub'), cortex: wrap(cortex, 'cortex') });
  events.length = 0; current.apply(model(), f.json, { startup: true });
  assert.deepEqual(events.filter(event => event.endsWith(':apply')), ['primary:apply', 'trainer:apply', 'hub:apply', 'cortex:apply', 'replay:apply']);
  assert.equal(events.slice(0, events.indexOf('primary:apply')).filter(event => event.endsWith(':prepare')).length, 5);
});

test('early cortex rejection is write-free and late rejection or false receipt closes all capture admission', async () => {
  const f = await fixture();
  for (const fault of ['early', 'late', 'throw', 'receipt']) {
    const failing = { async create(options) { const api = await cortex.create(options); let checks = 0; return { ...api,
      recheck(...args) { checks++; return fault === 'early' || fault === 'late' && checks === 2 ? { status: 'stale' } : api.recheck(...args); },
      apply(...args) { if (fault === 'throw') throw Error('cortex commit failure'); const receipt = api.apply(...args); return fault === 'receipt' ? { ...receipt, stateCount: 44 } : receipt; } }; } };
    const current = await prepare(f.json, { cortex: failing }), h = model(), before = evidence(h);
    if (fault === 'early') { assert.throws(() => current.apply(h, f.json, { startup: true }), /cortex preparation changed/); assert.deepEqual(evidence(h), before); }
    else {
      assert.throws(() => current.apply(h, f.json, { startup: true }), error => error.partialApplication === true && error.primaryApplied === true);
      assert.equal(current.snapshot(h).cortexInitialized, false); assert.equal(current.snapshot(h).partialApplication, true);
      assert.throws(() => current.captureComponents(h), /not been applied/); assert.throws(() => current.apply(h, f.json, { startup: true }), /previous partial/);
    }
  }
});

test('reserved cortex data and nested pending markers cannot leak to legacy JSON or invoke accessors', async () => {
  const f = await fixture(); let calls = 0;
  for (const value of [null, undefined, false, {}, { __alive_genome_cortex_state_v1__: false, captured: f.captures[4] },
    { ...genome.cortexState(f.captures[4]), extra: true }, f.wire.cortexMemoryState]) {
    const payload = { ...f.payload, cortexMemoryState: value };
    assert.equal(genome.hasAsyncState(payload), true); assert.throws(() => genome.encode(payload), /asynchronous/);
    await assert.rejects(genome.encodeAsync(payload), /Invalid cortex/);
  }
  for (const key of ['captured', '__alive_genome_cortex_state_v1__']) {
    const wrapper = genome.cortexState(f.captures[4]); Object.defineProperty(wrapper, key, { get() { calls++; return true; } });
    await assert.rejects(genome.encodeAsync({ ...f.payload, cortexMemoryState: wrapper }), /Invalid cortex/);
  }
  const accessor = { ...f.payload }; Object.defineProperty(accessor, 'cortexMemoryState', { get() { calls++; return null; } });
  assert.throws(() => genome.hasAsyncState(accessor), /own data/); assert.equal(calls, 0);
  assert.throws(() => genome.encode({ nested: genome.cortexState(f.captures[4]) }), /asynchronous/);
  for (const omitted of fields.slice(0, 4)) { const payload = { ...f.payload }; delete payload[omitted]; await assert.rejects(genome.encodeAsync(payload)); }
});

function barriers() {
  const pending = []; let calls = 0;
  return { pending, crypto: { subtle: { digest(algorithm, bytes) {
    if (++calls > 5) return webcrypto.subtle.digest(algorithm, bytes);
    return new Promise((resolve, reject) => pending.push({ release: () => resolve(webcrypto.subtle.digest(algorithm, bytes)), reject }));
  } } } };
}
test('all five seals own their raw bytes before the first await, including the full cortex', async () => {
  const f = await fixture(), payload = structuredClone(f.payload), gate = barriers();
  const expected = f.captures.map(capture => capture.tensors.map(row => raw(new Uint8Array(row.bytes))));
  const operation = genome.encodeAsync(payload, { learnedCodec: learned, crypto: gate.crypto }); assert.equal(gate.pending.length, 5);
  for (const field of fields) for (const row of payload[field].captured.tensors) new Uint8Array(row.bytes).fill(255);
  payload.legacy.unchanged = false; gate.pending.forEach(request => request.release());
  const wire = JSON.parse(await operation); assert.deepEqual(wire.legacy, { unchanged: true });
  for (const [index, field] of fields.entries()) {
    const decoded = learned.verifiedCopy(await learned.decode(wire[field], { crypto: webcrypto }));
    assert.deepEqual(decoded.tensors.map(row => raw(new Uint8Array(row.bytes))), expected[index]);
    assert.deepEqual(wire[field].snapshot, wire.primaryPolicyState.snapshot);
  }
});

test('a failed fifth or earlier seal and cancellation drain all five physical operations', async () => {
  const f = await fixture();
  for (const failure of [0, 4]) {
    const gate = barriers(); let settled = false;
    const operation = genome.encodeAsync(f.payload, { learnedCodec: learned, crypto: gate.crypto });
    operation.then(() => { settled = true; }, () => { settled = true; }); gate.pending[failure].reject(Error('digest failure'));
    await new Promise(resolve => setImmediate(resolve)); assert.equal(settled, false);
    gate.pending.forEach((request, i) => { if (i !== failure) request.release(); }); await assert.rejects(operation, /digest failure/);
  }
  const gate = barriers(), abort = new AbortController(); let settled = false;
  const operation = genome.encodeAsync(f.payload, { learnedCodec: learned, crypto: gate.crypto, signal: abort.signal });
  operation.catch(() => { settled = true; }); abort.abort();
  await new Promise(resolve => setImmediate(resolve)); assert.equal(settled, false);
  gate.pending.forEach(request => request.release()); await assert.rejects(operation, /cancelled/);
});

test('fifth snapshot mismatch and aggregate UTF-8 overflow reject the whole canonical save', async () => {
  const f = await fixture(), changed = { ...f.payload, cortexMemoryState: genome.cortexState({ ...f.captures[4], snapshot: { ...stamp(), modelEpoch: 3 } }) };
  await assert.rejects(genome.encodeAsync(changed, { learnedCodec: learned, crypto: webcrypto }), /cortex snapshot metadata disagree/);
  await assert.rejects(genome.encodeAsync({ ...f.payload, simulationTick: 38 }, { learnedCodec: learned, crypto: webcrypto }), /outer/);
  const four = { ...f.payload, padding: '' }; delete four.cortexMemoryState;
  const base = await genome.encodeAsync(four, { learnedCodec: learned, crypto: webcrypto });
  four.padding = 'é'.repeat(Math.floor((32 * 1024 * 1024 - Buffer.byteLength(base) - 1) / 2));
  assert.ok(Buffer.byteLength(await genome.encodeAsync(four, { learnedCodec: learned, crypto: webcrypto })) <= 32 * 1024 * 1024);
  await assert.rejects(genome.encodeAsync({ ...four, cortexMemoryState: f.payload.cortexMemoryState }, { learnedCodec: learned, crypto: webcrypto }), /32 MiB payload bound/);
});

test('actual serializer worker retains five-component wire without model or adapter imports', async t => {
  const worker = new Worker(`const {parentPort,workerData}=require('node:worker_threads');const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
    global.crypto=require('node:crypto').webcrypto;global.postMessage=m=>parentPort.postMessage(m);
    global.addEventListener=(type,fn)=>parentPort.on('message',data=>fn({data}));
    global.importScripts=name=>vm.runInThisContext(fs.readFileSync(path.join(path.dirname(workerData),name),'utf8'));
    vm.runInThisContext(fs.readFileSync(workerData,'utf8'));`, { eval: true, workerData: require.resolve('../systems/alive-genome-codec.js') });
  t.after(() => worker.terminate());
  const exchange = payload => new Promise((resolve, reject) => { worker.once('message', resolve); worker.once('error', reject); worker.postMessage(payload); });
  const f = await fixture(), answer = await exchange({ id: 1, payload: f.payload }); assert.equal(answer.error, undefined);
  assert.deepEqual(JSON.parse(answer.json).cortexMemoryState, f.wire.cortexMemoryState);
  const failure = await exchange({ id: 2, payload: { cortexMemoryState: f.payload.cortexMemoryState } });
  assert.match(failure.error, /Primary policy state/); assert.equal(failure.json, undefined);
});
