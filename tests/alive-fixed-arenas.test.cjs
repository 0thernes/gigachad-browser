'use strict';

// Allocation-boundary fixtures only. The registry descriptor below covers the
// named arena views, not a complete model catalog or resumable model checkpoint.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const codec = require('../systems/alive-learned-state-codec.js');
const registryModule = require('../systems/alive-learned-state-registry.js');
const arenaSource = fs.readFileSync(path.join(__dirname, '../systems/ported-multiverse-brains.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const native = { ArrayBuffer, DataView, Float32Array, Float64Array, Int8Array, Uint8Array,
  Uint16Array, Int32Array, Uint32Array, BigInt64Array, BigUint64Array };
const arenaLayout = [
  ['f64QuantumAndRls', 'Float64Array', 0, 2048],
  ['i64CyclotomicRing', 'BigInt64Array', 16384, 512],
  ['u64SwarHypervectors', 'BigUint64Array', 20480, 512],
  ['i32CsrAndUnionFind', 'Int32Array', 24576, 2048],
  ['u32PrngAndSimHash', 'Uint32Array', 32768, 2048],
  ['u16Fp16FastWeights', 'Uint16Array', 40960, 8192],
  ['u16Bf16Gradients', 'Uint16Array', 57344, 4096],
  ['i8StochasticQ8Weights', 'Int8Array', 65536, 16384],
  ['u8TernaryBitNet', 'Uint8Array', 81920, 8192],
  ['u8AxonalDelayLines', 'Uint8Array', 90112, 8192],
  ['f32SimdActivations', 'Float32Array', 98304, 8192]
];
const hubLayout = [
  ['f64TrajectoryCurr16', 'Float64Array', 0, 16],
  ['f64TrajectoryPrev16', 'Float64Array', 128, 16],
  ['f64TrajectoryPrev2_16', 'Float64Array', 256, 16],
  ['f64AdamFirstMoment64', 'Float64Array', 384, 64],
  ['f64AdamSecondMoment64', 'Float64Array', 896, 64],
  ['f64LossHistory16', 'Float64Array', 1408, 16],
  ['int8QuantizedWeights256', 'Int8Array', 1536, 256],
  ['u64SpikeTrainLanes8', 'BigUint64Array', 1792, 8],
  ['b158TernaryMorphism256', 'Int8Array', 1856, 256],
  ['fp16PersistentWeights256', 'Uint16Array', 2112, 256],
  ['f64InterIntraCoupling16x16', 'Float64Array', 2624, 256],
  ['facultyActivations16', 'Float64Array', 4672, 16],
  ['facultyDrives16', 'Float64Array', 4800, 16]
];
const context = shared => vm.createContext({ ...native, SharedArrayBuffer: shared,
  Math, Number, BigInt, module: { exports: {} } });
const bytes = buffer => Buffer.from(new Uint8Array(buffer));
function replaceOnce(source, from, to) {
  assert.equal(source.split(from).length, 2, 'allocation reference must replace exactly one expression');
  return source.replace(from, to);
}
function fragment(from, to) {
  const start = html.indexOf(from), end = html.indexOf(to, start);
  assert.ok(start >= 0 && end > start, 'production fragment anchors must exist');
  return html.slice(start, end);
}
const hubAllocation = fragment('        const mixedArenaBuffer = new ArrayBuffer(8192);', '        // 13G.');
// Actual quantization, spike packing, perception backpropagation and Float64
// moment/trajectory updates. Other model stages are deliberately outside scope.
const hubStep = fragment('        const frame = (hub.totalBackpropStepsTrained || 0) + 1;', '        // 2A. Train World-Dynamics MLP');
function arenaExports(shared, legacyShared = false) {
  const scope = context(shared);
  const source = legacyShared ? replaceOnce(arenaSource,
    'this.backingBuffer = new ArrayBuffer(this.byteCapacity);',
    'this.backingBuffer = new SharedArrayBuffer(this.byteCapacity);') : arenaSource;
  new vm.Script(source, { filename: 'actual-ported-arena.js' }).runInContext(scope);
  return scope.module.exports;
}
function hubModel(shared, legacyShared = false) {
  const scope = context(shared);
  const allocation = legacyShared ? replaceOnce(hubAllocation,
    'const mixedArenaBuffer = new ArrayBuffer(8192);',
    'const mixedArenaBuffer = new SharedArrayBuffer(8192);') : hubAllocation;
  const allocate = new vm.Script('(function(){' + allocation + '})').runInContext(scope);
  const h = {};
  allocate.call(h);
  h.obsVec = Float32Array.from({ length: 16 }, (_, i) => Math.sin(i * 0.37) * 0.6);
  h.continuousWorldModel = { rawFloatStream64: Float32Array.from({ length: 64 }, (_, i) => Math.cos(i * 0.23) * 0.3) };
  h.deepCortex = { W_enc1: Float32Array.from({ length: 16384 }, (_, i) => Math.sin(i * 0.17) * 0.8),
    W_moe_experts: Float32Array.from({ length: 65536 }, (_, i) => Math.cos(i * 0.11) * 0.1) };
  h.deepWebAndSltcConnectomeEngine = { sltcSpikes64: Uint8Array.from({ length: 64 }, (_, i) => i % 3 === 0 ? 1 : 0) };
  h.mesh = { nm: { DA: 0.85 } };
  const step = new vm.Script('(function(){const hub=this.trainableAlifeNeuralHub,wm=this.continuousWorldModel,dc=this.deepCortex,sltc=this.deepWebAndSltcConnectomeEngine;'
    + hubStep + '\nhub.totalBackpropStepsTrained=frame;return percSqErr;})').runInContext(scope);
  return { h, hub: h.trainableAlifeNeuralHub, step: () => step.call(h) };
}
function assertLayout(object, layout, bufferKey, capacity) {
  const buffer = object[bufferKey];
  assert.equal(Object.getPrototypeOf(buffer), ArrayBuffer.prototype);
  assert.equal(buffer.byteLength, capacity);
  assert.notEqual(buffer.resizable, true);
  for (const [name, dtype, offset, length] of layout) {
    const view = object[name];
    assert.equal(Object.getPrototypeOf(view), native[dtype].prototype, name + ' dtype');
    assert.equal(view.buffer, buffer, name + ' backing identity');
    assert.equal(view.byteOffset, offset, name + ' offset');
    assert.equal(view.length, length, name + ' length');
  }
}
function descriptor(layout, capacity) {
  return { registryVersion: 1, components: [{ id: 'fixture-arena', schemaVersion: 1,
    implementationDigest: 'c'.repeat(64), present: true }],
    tensors: layout.map(([name, dtype, offset, length]) => ({ id: name, componentId: 'fixture-arena',
      role: 'state', paths: [{ root: 'arena', keys: [name] }], dtype, dimensions: [length],
      backingGroup: 'arena', backingOffset: offset, backingByteLength: capacity,
      policy: { format: 'native', finite: dtype.startsWith('Float') } })),
    states: [], families: [], resumeRules: [] };
}
const snapshot = { creatureId: 'arena-fixture', policyId: 'policy-fixture', checkpointId: 'checkpoint-fixture',
  logicalTick: 3, modelEpoch: 0, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' };

test('actual precision arena always uses fixed backing with its original eleven views and scratch aliases', () => {
  let expected;
  for (const shared of [SharedArrayBuffer, undefined, function ForbiddenSharedAllocation() { throw Error('SAB must not be allocated'); }]) {
    const arena = new (arenaExports(shared).Heterogeneous7TierPrecisionArena)();
    assertLayout(arena, arenaLayout, 'backingBuffer', 131072);
    assert.equal(arena.byteCapacity, 131072);
    assert.equal(arena.isSharedMemory, false);
    assert.equal(arena.getPrecisionAuditSummary().isSharedMemory, false);
    assert.equal(arena._scratchF32.buffer, arena._scratchU32.buffer);
    assert.equal(arena._scratchF32.byteOffset, 0); assert.equal(arena._scratchU32.byteOffset, 0);
    assert.equal(arena._scratchF32.length, 1); assert.equal(arena._scratchU32.length, 1);
    if (expected) assert.deepEqual(bytes(arena.backingBuffer), expected);
    else expected = bytes(arena.backingBuffer);
  }
});

test('ported model updates retain exact arena bytes and outputs against the former shared allocation', () => {
  const variants = [arenaExports(SharedArrayBuffer), arenaExports(undefined), arenaExports(SharedArrayBuffer, true)];
  const models = variants.map(exports => new exports.PortedMultiverseBrainsFederation());
  const before = bytes(models[0].precisionArena.backingBuffer);
  for (const other of models.slice(1)) assert.deepEqual(bytes(other.precisionArena.backingBuffer), before);
  const runtime = { trainableAlifeNeuralHub: { zPerc16: Float32Array.from({ length: 16 }, (_, i) => Math.sin(i * 0.4) * 0.25),
    tdAdvantageDelta: 0.13, adaptivePlasticityLr: 0.012 } };
  for (let frame = 1; frame <= 3; frame++) for (const model of models) model.step60Hz(runtime, frame * 0.02, frame);
  assert.notDeepEqual(bytes(models[0].precisionArena.backingBuffer), before);
  assert.equal(models[0].completedStepCount, 3);
  for (const model of models) {
    assert.equal(model.brain1Asmodensius.rlsW16x2, model.brain1Asmodensius.W_rls8x2);
    for (const key of Object.keys(model)) if (/^brain\d/.test(key)) assert.equal(model[key].arena, model.precisionArena);
    assert.deepEqual(bytes(model.precisionArena.backingBuffer), bytes(models[0].precisionArena.backingBuffer));
    assert.deepEqual(Array.from(model.councilConsensusMotor2D), Array.from(models[0].councilConsensusMotor2D));
    assert.deepEqual(Array.from(model.brain1Asmodensius.W_rls8x2), Array.from(models[0].brain1Asmodensius.W_rls8x2));
    assert.equal(model.precisionArena._prngState, models[0].precisionArena._prngState);
  }
});

test('actual hub allocation retains thirteen fixed views and truthful backend labels with or without SAB', () => {
  const variants = [SharedArrayBuffer, undefined, function ForbiddenSharedAllocation() { throw Error('SAB must not be allocated'); }].map(shared => hubModel(shared));
  for (const { hub } of variants) {
    assertLayout(hub, hubLayout, 'mixedArenaBuffer', 8192);
    assert.match(hub.tensorBackendMode, /CONTIGUOUS_ARENA/);
    assert.doesNotMatch(hub.tensorBackendMode, /SHARED|WEBGPU/i);
    assert.deepEqual(bytes(hub.mixedArenaBuffer), bytes(variants[0].hub.mixedArenaBuffer));
    assert.equal(hub.f64AdamSecondMoment64[0], 1e-4);
    assert.equal(hub.f64InterIntraCoupling16x16[0], 0.0625);
  }
});

test('actual hub quantization, spike packing, trajectories and Adam updates match former shared allocation', () => {
  const models = [hubModel(SharedArrayBuffer), hubModel(undefined), hubModel(SharedArrayBuffer, true)];
  const before = bytes(models[0].hub.mixedArenaBuffer);
  const losses = models.map(model => Array.from({ length: 3 }, () => model.step()));
  assert.notDeepEqual(bytes(models[0].hub.mixedArenaBuffer), before);
  assert.notEqual(models[0].hub.f64AdamFirstMoment64[0], 0);
  assert.notEqual(models[0].hub.u64SpikeTrainLanes8[1], 0n);
  for (let i = 0; i < models.length; i++) {
    assert.deepEqual(losses[i], losses[0]);
    assert.deepEqual(bytes(models[i].hub.mixedArenaBuffer), bytes(models[0].hub.mixedArenaBuffer));
    for (const key of ['W_perc_enc', 'W_perc_dec', 'zPerc16']) assert.deepEqual(Array.from(models[i].hub[key]), Array.from(models[0].hub[key]));
    assert.deepEqual(Array.from(models[i].h.deepCortex.W_moe_experts), Array.from(models[0].h.deepCortex.W_moe_experts));
  }
});

for (const kind of ['precision', 'hub']) test('registry accepts and restores actual fixed ' + kind + ' views while rejecting shared reference', async () => {
  const precision = kind === 'precision', layout = precision ? arenaLayout : hubLayout, capacity = precision ? 131072 : 8192;
  const make = shared => precision
    ? new (arenaExports(SharedArrayBuffer, shared).Heterogeneous7TierPrecisionArena)()
    : hubModel(SharedArrayBuffer, shared).hub;
  const registry = await registryModule.compile(descriptor(layout, capacity), { codec, crypto: webcrypto });
  const source = make(false), roots = { arena: source }, captured = registry.capture(roots, snapshot, { generation: 0 });
  assert.equal(captured.tensors.length, layout.length);
  assert.equal(new Set(captured.tensors.map(t => t.backingGroup)).size, 1);
  assert.throws(() => registry.capture({ arena: make(true) }, snapshot, { generation: 0 }), /shared backing/);
  const target = make(false), targetRoots = { arena: target }, originals = layout.map(([name]) => target[name]);
  for (const [name, dtype] of layout) target[name].fill(dtype.startsWith('Big') ? 9n : 9);
  const decoded = await codec.decode(await codec.encode(captured, { crypto: webcrypto }), { crypto: webcrypto });
  const prepared = registry.preflight(decoded, targetRoots, { generation: 0 });
  assert.equal(registry.apply(prepared, targetRoots, { generation: 0 }).readbackVerified, true);
  for (let i = 0; i < layout.length; i++) {
    const [name] = layout[i]; assert.equal(target[name], originals[i]);
    assert.deepEqual(Buffer.from(target[name].buffer, target[name].byteOffset, target[name].byteLength),
      Buffer.from(source[name].buffer, source[name].byteOffset, source[name].byteLength));
  }
});
