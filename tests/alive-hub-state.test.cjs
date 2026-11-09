'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto, createHash } = require('node:crypto');
const hubModule = require('../systems/alive-hub-state.js');
const codec = require('../systems/alive-learned-state-codec.js');
const registry = require('../systems/alive-learned-state-registry.js');
const options = { crypto: webcrypto }, generation = 11;
const adapterPromise = hubModule.create({ registry, codec, ...options });
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const START = 'const mixedArenaBuffer = new ArrayBuffer(8192);', ASSIGN = 'this.trainableAlifeNeuralHub = {';
function allocation(text) {
  if (text.split(START).length !== 2 || text.split(ASSIGN).length !== 2) throw Error('unique hub allocation anchors required');
  const begin = text.indexOf(START), end = text.indexOf('\n        };', begin);
  if (end < begin || text.indexOf(ASSIGN) < begin || text.indexOf(ASSIGN) > end) throw Error('hub allocation boundary missing');
  return Function(text.slice(begin, end + '\n        };'.length).replace('this.trainableAlifeNeuralHub =', 'return'));
}
const makeHub = allocation(source);
const snapshot = { creatureId: 'hub-test', policyId: 'policy', checkpointId: 'checkpoint', logicalTick: 27,
  modelEpoch: 3, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' };
const bits = view => Buffer.from(view.buffer, view.byteOffset, view.byteLength).toString('hex');
function scalarBits(value) { const b = Buffer.alloc(8); b.writeDoubleLE(value); return b.toString('hex'); }
function evidence(hub) {
  const values = {};
  for (const name of Object.keys(hub).sort()) {
    if (name === 'replayRing32' || name === 'replayWritePtr') continue;
    const value = hub[name];
    values[name] = ArrayBuffer.isView(value) ? { type: value.constructor.name, offset: value.byteOffset, bytes: bits(value) } :
      value instanceof ArrayBuffer ? Buffer.from(value).toString('hex') : typeof value === 'number' ? scalarBits(value) :
        Array.isArray(value) ? value.slice() : value;
  }
  return values;
}
function decoratedHub() {
  const hub = makeHub(); let serial = 0;
  for (const value of Object.values(hub)) if (ArrayBuffer.isView(value)) {
    if (value instanceof BigUint64Array) { for (let i = 0; i < value.length; i++) value[i] = (1n << 63n) + BigInt(i); }
    else if (value instanceof Float32Array || value instanceof Float64Array) { for (let i = 0; i < value.length; i++) value[i] = ++serial / 4096; }
    else for (let i = 0; i < value.length; i++) value[i] = i * 37 + serial++;
  }
  new Uint32Array(hub.W_perc_enc.buffer).set([0, 0x80000000, 1, 0x80000001]);
  hub.f64AdamFirstMoment64[63] = -0; hub.f64AdamSecondMoment64[63] = Number.MIN_VALUE;
  hub.fp16PersistentWeights256.set([0x7c00, 0x7e01, 0xfc01, 0x8000, 0xffff]);
  hub.diffusionAlphaBar8.set([0, 1, .125, .25, .375, .5, .75, .875]);
  new Uint8Array(hub.mixedArenaBuffer, 4928).forEach((_, i, a) => { a[i] = (i * 131 + 7) & 255; });
  hub.b_aware = -0; hub.robotPrevValueEstimate = Number.MIN_VALUE; hub.totalBackpropStepsTrained = 182;
  hub.persistentWeightCheckpointsSaved = 93; hub.adaptivePlasticityLr = .00012345678912345;
  hub.reasoningVerdict = 'Retained exact dynamic description';
  return hub;
}
async function decodeCapture(capture) { return codec.decode(await codec.encode(capture, options), options); }
async function decoded(adapter, hub) { return decodeCapture(adapter.capture(hub, snapshot, { generation })); }

test('actual unchanged constructor has exactly 105 explicitly classified fields and complete 59-row backing coverage', async () => {
  const adapter = await adapterPromise, hub = makeHub(), captured = adapter.capture(hub, snapshot, { generation });
  assert.equal(Object.keys(hub).length, 105);
  assert.deepEqual(Object.keys(hubModule.fieldDispositions).sort(), Object.keys(hub).sort());
  assert.equal(Object.values(hubModule.fieldDispositions).filter(x => x === 'exact-native-view').length, 58);
  assert.equal(Object.values(hubModule.fieldDispositions).filter(x => x === 'exact-state').length, 44);
  assert.equal(captured.tensors.length, 59); assert.equal(captured.stateManifest.length, 44);
  assert.equal(captured.tensors.reduce((sum, row) => sum + row.bytes.byteLength, 0), 21368);
  const groups = new Map();
  for (const row of captured.tensors) { if (!groups.has(row.backingGroup)) groups.set(row.backingGroup, []); groups.get(row.backingGroup).push(row); }
  assert.equal(groups.size, 46);
  let uniqueBytes = 0;
  for (const rows of groups.values()) {
    rows.sort((a, b) => a.backingOffset - b.backingOffset); let offset = 0;
    for (const row of rows) { assert.equal(row.backingOffset, offset, 'no gap or overlap in complete backing'); offset += row.byteLength; }
    assert.equal(offset, rows[0].backingByteLength); uniqueBytes += offset;
  }
  assert.equal(uniqueBytes, 21368);
  const tail = captured.tensors.find(row => row.id === 'reservedArenaTail');
  assert.equal(tail.backingOffset, 4928); assert.deepEqual(tail.dimensions, [3264]); assert.equal(tail.backingByteLength, 8192);
  assert.equal(captured.tensors.find(row => row.id === 'W_dyn1').dtype, 'Float32Array');
  assert.deepEqual(captured.tensors.find(row => row.id === 'W_dyn1').dimensions, [16, 24]);
  assert.ok(!captured.stateManifest.some(row => ['replayRing32', 'replayWritePtr'].includes(row.id)));
  assert.equal(hubModule.scope.completeApplicationCatalog, false);
  assert.match(createHash('sha256').update(source).digest('hex'), /^[0-9a-f]{64}$/);
});

test('constructor proof rejects missing or duplicated extraction anchors', () => {
  assert.throws(() => allocation(source.replace(START, 'changed allocation')), /anchors/);
  assert.throws(() => allocation(source + START), /anchors/);
  assert.throws(() => allocation(source + ASSIGN), /anchors/);
});

test('exact native values, Uint16 words, Float64 history, constants and full reserved tail restore in place', async () => {
  const adapter = await adapterPromise, hub = decoratedHub(), expected = evidence(hub), target = makeHub();
  const originalViews = Object.fromEntries(Object.entries(target).filter(([, value]) => ArrayBuffer.isView(value)));
  const arena = target.mixedArenaBuffer, ring = target.replayRing32;
  ring.push({ sentinel: 'replay-owned' }); target.replayWritePtr = 1;
  const handle = await decoded(adapter, hub), valid = adapter.validate(handle);
  assert.equal(valid.status, 'validated'); assert.equal(valid.stateCount, 44);
  const before = evidence(target), plan = adapter.preflight(handle, target, { generation });
  assert.deepEqual(evidence(target), before); assert.equal(adapter.recheck(plan, target, { generation }).status, 'ready');
  const receipt = adapter.apply(plan, target, { generation });
  assert.deepEqual(receipt, { status: 'applied', generation, tensorCount: 59, tensorBytes: 21368, stateCount: 44, scope: hubModule.scope.kind, readbackVerified: true });
  assert.deepEqual(evidence(target), expected); assert.equal(target.mixedArenaBuffer, arena);
  for (const [name, view] of Object.entries(originalViews)) assert.equal(target[name], view, name + ' preserves view identity');
  assert.equal(target.replayRing32, ring); assert.equal(target.replayWritePtr, 1); assert.equal(ring[0].sentinel, 'replay-owned');
  assert.equal(target.u64SpikeTrainLanes8[0], 1n << 63n); assert.ok(Object.is(target.b_aware, -0));
  assert.deepEqual(Array.from(target.fp16PersistentWeights256.slice(0, 5)), [0x7c00, 0x7e01, 0xfc01, 0x8000, 0xffff]);
});

test('capture owns every tensor/state before subsequent source mutation and encoding', async () => {
  const adapter = await adapterPromise, hub = decoratedHub(), expected = evidence(hub);
  const capture = adapter.capture(hub, snapshot, { generation });
  new Uint8Array(hub.mixedArenaBuffer).fill(0); hub.W_dyn1.fill(9); hub.b_aware = 3;
  hub.facultyNames16[0] = 'changed'; hub.reasoningVerdict = 'changed';
  const target = makeHub(), handle = await decodeCapture(capture);
  adapter.apply(adapter.preflight(handle, target, { generation }), target, { generation });
  assert.deepEqual(evidence(target), expected);
});

test('all own fields, getters, names, numeric domains and counter overflow are validated without invoking accessors', async () => {
  const adapter = await adapterPromise;
  const bad = [h => { h.unregistered = 1; }, h => { delete h.robotPrevValueEstimate; }, h => { h[Symbol('unknown')] = 2; },
    h => { h.totalBackpropStepsTrained = Number.MAX_SAFE_INTEGER + 1; }, h => { h.dreamConsolidationSteps = -1; },
    h => { h.ideasSynthesizedCount = .5; }, h => { h.persistentWeightCheckpointsSaved = -0; }, h => { h.samBestSectorIdx = 16; },
    h => { h.b_disc2 = Infinity; }, h => { h.W_perc_enc[1] = NaN; }, h => { h.f64LossHistory16[2] = Infinity; },
    h => { h.reasoningVerdict = 'a'.repeat(2049); }, h => { h.facultyNames16[0] = 'different'; },
    h => { h.moeExpertNames8.reverse(); }, h => { h.facultyNames16.extra = 'x'; },
    h => { Object.defineProperty(h, 'b_aware', { writable: false }); }, h => { Object.setPrototypeOf(h, { custom: true }); }];
  for (const mutate of bad) { const hub = makeHub(); mutate(hub); assert.throws(() => adapter.capture(hub, snapshot, { generation }), /Hub state/); }
  const maximum = makeHub(); maximum.totalBackpropStepsTrained = Number.MAX_SAFE_INTEGER;
  assert.doesNotThrow(() => adapter.capture(maximum, snapshot, { generation }));
  let calls = 0;
  for (const where of ['view', 'state', 'names', 'replay', 'unknown']) {
    const hub = makeHub(), accessor = { configurable: true, get() { calls++; throw Error('must not invoke'); } };
    if (where === 'view') Object.defineProperty(hub, 'W_dyn1', accessor);
    if (where === 'state') Object.defineProperty(hub, 'b_aware', accessor);
    if (where === 'names') Object.defineProperty(hub.facultyNames16, '0', accessor);
    if (where === 'replay') Object.defineProperty(hub, 'replayRing32', accessor);
    if (where === 'unknown') Object.defineProperty(hub, 'extra', accessor);
    assert.throws(() => adapter.capture(hub, snapshot, { generation }), /Hub state/);
  }
  assert.equal(calls, 0);
});

test('actual source topology rejects aliases, detached/resizable/shared backings and custom native prototypes', async () => {
  const adapter = await adapterPromise;
  const bad = [h => { h.W_perc_dec = h.W_perc_enc; }, h => { h.W_perc_dec = new Float32Array(h.W_perc_enc.buffer); },
    h => { h.zPerc16 = new Float32Array(h.mixedArenaBuffer, 0, 16); }, h => { h.f64TrajectoryPrev16 = new Float64Array(16); },
    h => { h.f64TrajectoryPrev16 = new Float64Array(h.mixedArenaBuffer, 0, 16); }, h => { h.mixedArenaBuffer = h.mixedArenaBuffer.slice(0); },
    h => { h.W_perc_enc = new Float32Array(new SharedArrayBuffer(1024)); },
    h => { h.W_perc_enc = new Float32Array(new ArrayBuffer(1024, { maxByteLength: 2048 })); },
    h => { structuredClone(h.W_perc_enc.buffer, { transfer: [h.W_perc_enc.buffer] }); },
    h => { h.W_perc_enc.extra = true; }, h => { h.W_perc_enc.buffer.extra = true; },
    h => { Object.setPrototypeOf(h.W_perc_enc, Object.create(Float32Array.prototype)); }, h => { h.W_perc_enc = new Float64Array(256); }];
  for (const mutate of bad) { const hub = makeHub(); mutate(hub); assert.throws(() => adapter.capture(hub, snapshot, { generation }), /Hub state/); }
});

test('validly rehashed wrong rosters, backing metadata, schemas and constant names reject before destination writes', async () => {
  const adapter = await adapterPromise;
  const variants = [c => { c.tensors.pop(); }, c => { c.stateManifest.pop(); delete c.stateValues.worldDynamicsLossMse; },
    c => { c.tensors.find(r => r.id === 'W_dyn1').dimensions = [24, 16]; },
    c => { c.tensors.find(r => r.id === 'reservedArenaTail').backingOffset = 0; },
    c => { c.tensors.find(r => r.id === 'W_perc_enc').backingGroup = 'wrongGroup'; },
    c => { const row = c.tensors.find(r => r.id === 'W_dyn2'); row.paths[0].keys = ['W_perc_enc']; },
    c => { c.stateValues.totalBackpropStepsTrained = codec.float64(0); c.stateManifest.find(r => r.id === 'totalBackpropStepsTrained').valueType = 'f64'; },
    c => { c.stateValues.facultyNames16.items[0] = 'incompatible versioned constant'; },
    c => { c.stateValues.b_aware = codec.float64(Infinity); },
    c => { new Float32Array(c.tensors.find(r => r.id === 'W_dyn1').bytes)[0] = NaN; }];
  for (const mutate of variants) {
    const capture = adapter.capture(makeHub(), snapshot, { generation }), target = decoratedHub(), before = evidence(target);
    let rejected = false;
    try { mutate(capture); const handle = await decodeCapture(capture); adapter.preflight(handle, target, { generation }); }
    catch (_) { rejected = true; }
    assert.equal(rejected, true); assert.deepEqual(evidence(target), before);
  }
});

test('source-proved Adam, diffusion and squared-error EMA domains reject live and rehashed wire corruption before writes', async () => {
  const adapter = await adapterPromise;
  const cases = [
    { tensor: 'f64AdamSecondMoment64', C: Float64Array, value: -.0001 },
    { tensor: 'diffusionAlphaBar8', C: Float32Array, value: -.25 },
    { tensor: 'diffusionAlphaBar8', C: Float32Array, value: 1.25 },
    ...['perceptionLossMse', 'worldDynamicsLossMse', 'diffusionScoreLossMse', 'inversePhysicsLossMse'].map(state => ({ state, value: -.01 }))
  ];
  for (const item of cases) {
    const live = makeHub();
    if (item.tensor) live[item.tensor][0] = item.value; else live[item.state] = item.value;
    assert.throws(() => adapter.capture(live, snapshot, { generation }), /domain/);
    const capture = adapter.capture(makeHub(), snapshot, { generation });
    if (item.tensor) new item.C(capture.tensors.find(row => row.id === item.tensor).bytes)[0] = item.value;
    else capture.stateValues[item.state] = codec.float64(item.value);
    // Encoding recomputes checksums; this is semantic validation of a valid
    // wire record, not merely rejection of broken transport integrity.
    const handle = await decodeCapture(capture), target = makeHub(), before = evidence(target);
    assert.throws(() => adapter.validate(handle), /numeric policy|scalar range/);
    assert.throws(() => adapter.preflight(handle, target, { generation }), /numeric policy|scalar range/);
    assert.deepEqual(evidence(target), before);
  }
  const boundary = makeHub(); boundary.f64AdamSecondMoment64.fill(-0);
  boundary.diffusionAlphaBar8.set([-0, 1, 0, 1, 0, 1, 0, 1]); boundary.perceptionLossMse = -0;
  assert.equal(adapter.validate(await decoded(adapter, boundary)).status, 'validated');
});

test('only the private verified decoder capsule supplies restored values and architecture', async () => {
  const adapter = await adapterPromise, sourceHub = decoratedHub(), expected = evidence(sourceHub), handle = await decoded(adapter, sourceHub);
  handle.architecture.fingerprint = '0'.repeat(64); handle.tensors.forEach(row => new Uint8Array(row.bytes).fill(255));
  handle.stateValues.b_aware = codec.float64(81); handle.stateManifest.length = 0; handle.tensors.length = 0;
  assert.equal(adapter.validate(handle).status, 'validated');
  const target = makeHub(); adapter.apply(adapter.preflight(handle, target, { generation }), target, { generation });
  assert.deepEqual(evidence(target), expected);
  for (const forged of [{ ...handle }, {}, JSON.parse(JSON.stringify(handle))]) assert.throws(() => adapter.validate(forged), /decoder-issued/);
});

test('preflight binds all owned identities, descriptor attributes, names and complete bytes before any writes', async () => {
  const adapter = await adapterPromise, handle = await decoded(adapter, decoratedHub());
  const mutations = [h => { h.W_dyn1[8] += .25; }, h => { new Uint8Array(h.mixedArenaBuffer)[8191] ^= 1; },
    h => { h.W_perc_enc = h.W_perc_enc.slice(); }, h => { h.b_aware = -0; },
    h => { h.facultyNames16 = h.facultyNames16.slice(); }, h => { h.reasoningVerdict += '!'; },
    h => { Object.defineProperty(h, 'mixedArenaBuffer', { enumerable: false }); },
    h => { Object.defineProperty(h, 'W_dyn1', { writable: false }); },
    h => { Object.defineProperty(h.facultyNames16, '0', { enumerable: false }); }, h => { Object.setPrototypeOf(h, null); }];
  for (const mutate of mutations) {
    const target = makeHub(), plan = adapter.preflight(handle, target, { generation }); mutate(target); const before = evidence(target);
    assert.throws(() => adapter.recheck(plan, target, { generation }), /changed since preflight/);
    assert.throws(() => adapter.apply(plan, target, { generation }), /changed since preflight/);
    assert.deepEqual(evidence(target), before);
  }
});

test('generation, hub binding, single-use and disposal fences do not bind separately owned replay contents', async () => {
  const adapter = await adapterPromise, handle = await decoded(adapter, decoratedHub()), target = makeHub();
  const plan = adapter.preflight(handle, target, { generation });
  assert.ok(Object.isFrozen(plan)); assert.equal(Object.hasOwn(plan, 'compiledPlan'), false);
  assert.throws(() => adapter.recheck(plan, target, { generation: generation + 1 }), /stale or foreign/);
  assert.throws(() => adapter.apply(plan, { ...target }, { generation }), /stale or foreign/);
  target.replayRing32 = [{ sentinel: true }]; target.replayWritePtr = 1;
  assert.equal(adapter.recheck(plan, target, { generation }).status, 'ready'); adapter.apply(plan, target, { generation });
  assert.equal(target.replayWritePtr, 1); assert.equal(target.replayRing32[0].sentinel, true);
  assert.throws(() => adapter.apply(plan, target, { generation }), /stale or foreign/);
  const discarded = adapter.preflight(handle, target, { generation }); assert.equal(adapter.discard(discarded), true);
  assert.equal(adapter.discard(discarded), false); assert.throws(() => adapter.recheck(discarded, target, { generation }), /stale or foreign/);
  assert.throws(() => adapter.capture(target, snapshot, { generation: -0 }), /valid model generation/);
});

test('publication failure restores original tensor bytes and scalar/name values and consumes the plan', async () => {
  const adapter = await adapterPromise, target = makeHub(), handle = await decoded(adapter, decoratedHub());
  const before = evidence(target), names = target.facultyNames16, plan = adapter.preflight(handle, target, { generation });
  const original = Object.defineProperty; let injected = false;
  try {
    Object.defineProperty = function (object, key, property) {
      if (object === target && key === 'ganGeneratorLoss' && !injected) { injected = true; throw Error('injected publication failure'); }
      return original(object, key, property);
    };
    assert.throws(() => adapter.apply(plan, target, { generation }), error => error.rollbackVerified === true && error.partialApplication === false);
  } finally { Object.defineProperty = original; }
  assert.equal(injected, true); assert.deepEqual(evidence(target), before); assert.equal(target.facultyNames16, names);
  assert.throws(() => adapter.apply(plan, target, { generation }), /stale or foreign/);
});

test('same hub cannot silently rebind its cached arena projection after replacement', async () => {
  const adapter = await adapterPromise, hub = makeHub(); adapter.capture(hub, snapshot, { generation });
  const replacement = makeHub(); hub.mixedArenaBuffer = replacement.mixedArenaBuffer;
  for (const [name, value] of Object.entries(replacement)) if (ArrayBuffer.isView(value) && value.buffer === replacement.mixedArenaBuffer) hub[name] = value;
  assert.throws(() => adapter.capture(hub, snapshot, { generation }), /cached mixed arena binding changed/);
});
