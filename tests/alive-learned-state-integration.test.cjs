'use strict';

// Cross-layer fixture qualification only. This is not the application's mature
// component catalog, startup barrier, migration, or process-restart oracle.
const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const codec = require('../systems/alive-learned-state-codec.js');
const registryModule = require('../systems/alive-learned-state-registry.js');

function definition() {
  return {
    registryVersion: 1,
    components: [{ id: 'model', schemaVersion: 1, implementationDigest: '0'.repeat(64), present: true }],
    tensors: [
      { id: 'model.a', componentId: 'model', role: 'parameter',
        paths: [{ root: 'model', keys: ['a'] }, { root: 'model', keys: ['aliasA'] }],
        dtype: 'Float32Array', dimensions: [2], backingGroup: 'a', backingOffset: 0, backingByteLength: 8,
        policy: { format: 'native', finite: true } },
      { id: 'model.b', componentId: 'model', role: 'optimizer',
        paths: [{ root: 'model', keys: ['b'] }], dtype: 'Float64Array', dimensions: [2],
        backingGroup: 'b', backingOffset: 0, backingByteLength: 16,
        policy: { format: 'native', finite: true } }
    ],
    states: [
      { id: 'model.bias', componentId: 'model', role: 'parameter', paths: [{ root: 'model', keys: ['bias'] }],
        schemaVersion: 1, required: true, schema: { type: 'f64', min: -10, max: 10 } },
      { id: 'model.step', componentId: 'model', role: 'optimizer', paths: [{ root: 'model', keys: ['step'] }],
        schemaVersion: 1, required: true, schema: { type: 'i53', min: 0, max: 100000 } }
    ],
    families: [],
    resumeRules: [{ id: 'authority', action: 'reset', reason: 'Fresh browser authority', version: 1 }]
  };
}

function roots(seed = false) {
  const a = new Float32Array(seed ? [-0, 0.001953125] : [9, 8]);
  return { model: { a, aliasA: a, b: new Float64Array(seed ? [-0, 1e-300] : [7, 6]), bias: seed ? -0 : 5, step: seed ? 42 : 3 } };
}
const snapshot = () => ({ creatureId: 'fixture-creature', policyId: 'fixture-policy', checkpointId: 'fixture-checkpoint',
  logicalTick: 17, modelEpoch: 3, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' });
const bytes = view => Buffer.from(view.buffer, view.byteOffset, view.byteLength).toString('hex');
const state = value => ({ a: bytes(value.model.a), b: bytes(value.model.b), bias: value.model.bias, step: value.model.step });

async function fixture() {
  const registry = await registryModule.compile(definition(), { codec, crypto: webcrypto });
  const source = roots(true);
  const captured = registry.capture(source, snapshot(), { generation: 7 });
  const json = await codec.encode(captured, { crypto: webcrypto });
  const decoded = await codec.decode(json, { crypto: webcrypto });
  return { registry, source, captured, json, decoded };
}

test('wire blob matches independently observed source bytes and restores exact floats, aliases and scalar tags', async () => {
  const f = await fixture();
  const wire = JSON.parse(f.json), blob = Buffer.from(wire.tensorBlob.data, 'base64');
  for (const [id, view] of [['model.a', f.source.model.a], ['model.b', f.source.model.b]]) {
    const row = wire.tensorManifest.find(item => item.id === id);
    assert.ok(row);
    assert.equal(blob.subarray(row.blobOffset, row.blobOffset + row.byteLength).toString('hex'), bytes(view));
  }
  assert.deepEqual(wire.stateValues['model.bias'], { $type: 'f64', hex: '0000000000000080' });
  assert.deepEqual(wire.stateValues['model.step'], { $type: 'i53', value: 42 });
  const target = roots(), originalA = target.model.a, originalB = target.model.b;
  const plan = f.registry.preflight(f.decoded, target, { generation: 7 });
  f.registry.apply(plan, target, { generation: 7 });
  assert.deepEqual(state(target), state(f.source));
  assert.equal(target.model.a, originalA);
  assert.equal(target.model.aliasA, originalA);
  assert.equal(target.model.b, originalB);
  assert.ok(Object.is(target.model.bias, -0));
});

test('valid wire checksums cannot substitute for a complete expected tensor roster', async () => {
  const f = await fixture(), target = roots(), before = state(target);
  const reduced = { ...f.captured, tensors: f.captured.tensors.filter(item => item.id !== 'model.b') };
  const validReduced = await codec.decode(await codec.encode(reduced, { crypto: webcrypto }), { crypto: webcrypto });
  assert.throws(() => f.registry.preflight(validReduced, target, { generation: 7 }));
  assert.deepEqual(state(target), before);
});

test('valid wire checksums cannot substitute for the complete scalar and optimizer-state set', async () => {
  const f = await fixture(), target = roots(), before = state(target);
  const { ['model.step']: removed, ...stateValues } = f.captured.stateValues;
  assert.ok(removed);
  const reduced = { ...f.captured, stateManifest: f.captured.stateManifest.filter(item => item.id !== 'model.step'), stateValues };
  const validReduced = await codec.decode(await codec.encode(reduced, { crypto: webcrypto }), { crypto: webcrypto });
  assert.throws(() => f.registry.preflight(validReduced, target, { generation: 7 }));
  assert.deepEqual(state(target), before);
});

test('same-shape array replacement after preflight rejects before tensor or scalar writes', async () => {
  const f = await fixture(), target = roots(), previousA = target.model.a;
  const plan = f.registry.preflight(f.decoded, target, { generation: 7 });
  target.model.a = new Float32Array([4, 3]); target.model.aliasA = target.model.a;
  const before = state(target), previousBytes = bytes(previousA);
  assert.throws(() => f.registry.apply(plan, target, { generation: 7 }));
  assert.deepEqual(state(target), before);
  assert.equal(bytes(previousA), previousBytes);
});

test('same-shape root replacement and generation changes both leave current state untouched', async () => {
  for (const mode of ['root', 'generation']) {
    const f = await fixture(), target = roots();
    const plan = f.registry.preflight(f.decoded, target, { generation: 7 });
    if (mode === 'root') target.model = roots().model;
    const before = state(target);
    assert.throws(() => f.registry.apply(plan, target, { generation: mode === 'generation' ? 8 : 7 }));
    assert.deepEqual(state(target), before);
  }
});

test('a late accessor replacement cannot run its setter or cause earlier tensor writes', async () => {
  const f = await fixture(), target = roots();
  const plan = f.registry.preflight(f.decoded, target, { generation: 7 });
  const beforeA = bytes(target.model.a), beforeB = bytes(target.model.b), beforeStep = target.model.step;
  let reads = 0, writes = 0;
  Object.defineProperty(target.model, 'bias', { configurable: true, enumerable: true,
    get() { reads++; return 5; }, set() { writes++; } });
  assert.throws(() => f.registry.apply(plan, target, { generation: 7 }));
  assert.equal(reads, 0); assert.equal(writes, 0);
  assert.equal(bytes(target.model.a), beforeA); assert.equal(bytes(target.model.b), beforeB);
  assert.equal(target.model.step, beforeStep);
});

test('preflight owns its input bytes and state independently of caller mutation', async () => {
  const f = await fixture(), target = roots();
  const expected = state(f.source);
  const plan = f.registry.preflight(f.decoded, target, { generation: 7 });
  for (const tensor of f.decoded.tensors) new Uint8Array(tensor.bytes).fill(0x7f);
  f.decoded.stateValues['model.bias'] = codec.float64(8);
  f.decoded.stateValues['model.step'] = codec.integer(999);
  assert.equal(Reflect.set(plan, 'generation', 999), false);
  f.registry.apply(plan, target, { generation: 7 });
  assert.deepEqual(state(target), expected);
});

test('broken declared alias identity rejects before any model change', async () => {
  const f = await fixture(), target = roots();
  target.model.aliasA = new Float32Array(target.model.a);
  const before = state(target), aliasBytes = bytes(target.model.aliasA);
  assert.throws(() => f.registry.preflight(f.decoded, target, { generation: 7 }));
  assert.deepEqual(state(target), before);
  assert.equal(bytes(target.model.aliasA), aliasBytes);
});

test('mutable decode diagnostics cannot replace the privately verified payload before preflight', async () => {
  const f = await fixture(), target = roots();
  const expected = state(f.source);
  for (const tensor of f.decoded.tensors) new Uint8Array(tensor.bytes).fill(0x7f);
  f.decoded.stateValues['model.bias'] = codec.float64(8);
  f.decoded.stateValues['model.step'] = codec.integer(999);
  const plan = f.registry.preflight(f.decoded, target, { generation: 7 });
  f.registry.apply(plan, target, { generation: 7 });
  assert.deepEqual(state(target), expected);
});

test('a copied or forged decoded handle cannot authorize a model restore', async () => {
  const f = await fixture(), target = roots(), before = state(target);
  assert.throws(() => f.registry.preflight({ ...f.decoded }, target, { generation: 7 }));
  assert.deepEqual(state(target), before);
});
