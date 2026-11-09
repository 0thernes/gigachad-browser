'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { observeModelState, validateEvidence, compareModelState } = require('./alive-model-state-evidence.cjs');

const descriptor = (id, dtype = 'Uint8Array', dimensions = [4], paths = [{ root: 'model', keys: [id] }]) =>
  ({ id, paths, dtype, dimensions, role: 'verification-fixture', componentId: 'fixture' });
const clone = value => JSON.parse(JSON.stringify(value));
const observe = (model, descriptors, options) => observeModelState({ model }, descriptors, options);
const code = expected => error => error?.code === expected;
const bytes = entry => Buffer.from(entry.dataBase64, 'base64');
const kinds = result => result.differences.map(item => item.kind);

test('actual integer, floating-point and BigInt typed arrays retain exact raw bits, including empty arrays', () => {
  const model = {
    i8: new Int8Array([-128, -1, 0, 127]), u8: new Uint8Array([0, 1, 128, 255]),
    clamped: new Uint8ClampedArray([-1, 1.5, 254.5, 300]), i16: new Int16Array([-32768, -1, 32767]),
    u16: new Uint16Array([0, 32768, 65535]), i32: new Int32Array([-2147483648, -1, 2147483647]),
    u32: new Uint32Array([0, 2147483648, 4294967295]),
    f32: new Float32Array(new Uint32Array([0, 0x80000000, 1, 0x007fffff, 0x7fc01234]).buffer),
    f64: new Float64Array([0, -0, Number.MIN_VALUE, -Number.MIN_VALUE, Number.MAX_VALUE]),
    i64: new BigInt64Array([-(1n << 63n), -1n, 0n, (1n << 63n) - 1n]),
    u64: new BigUint64Array([0n, 1n, (1n << 64n) - 1n]), empty: new Float64Array(0)
  };
  const registry = Object.entries(model).map(([id, value]) => descriptor(id, value.constructor.name, [value.length]));
  const evidence = observe(model, registry);
  for (const entry of evidence.entries) {
    const value = model[entry.id];
    assert.deepEqual(bytes(entry), Buffer.from(value.buffer, value.byteOffset, value.byteLength));
  }
  assert.equal(evidence.coverage.registryComplete, 'not-established');
  assert.equal(compareModelState(evidence, clone(evidence)).ok, true);
  assert.equal(evidence.entries.find(entry => entry.id === 'empty').dataBase64, '');
});

test('observer serializes into a clean VM and recognizes cross-realm arrays without Node dependencies', () => {
  const foreign = vm.runInNewContext('({a:new Float32Array([0,-0,1.25]), b:new BigUint64Array([0n,18446744073709551615n])})');
  assert.equal(foreign.a instanceof Float32Array, false);
  const registry = [descriptor('a', 'Float32Array', [3]), descriptor('b', 'BigUint64Array', [2])];
  const direct = observe(foreign, registry);
  const serialized = vm.runInNewContext('(' + observeModelState.toString() + ')(roots, registry)',
    { roots: { model: foreign }, registry, btoa }, { timeout: 1000 });
  assert.equal(compareModelState(direct, serialized).ok, true);
  assert.equal(direct.entries[0].dtype, 'Float32Array');
});

test('same-object aliases pass; equal-valued replacement views and split aliases fail', () => {
  const a = new Float32Array([1, 2]);
  const paths = [{ root: 'model', keys: ['a'] }, { root: 'model', keys: ['nested', 'alias'] }];
  const registry = [descriptor('a', 'Float32Array', [2], paths)];
  const evidence = observe({ a, nested: { alias: a } }, registry);
  assert.equal(evidence.totals.paths, 2);
  assert.throws(() => observe({ a, nested: { alias: new Float32Array(a.buffer) } }, registry), code('ALIAS'));
  assert.throws(() => observe({ a, b: a }, [descriptor('a', 'Float32Array', [2]), descriptor('b', 'Float32Array', [2])]), code('DUPLICATE_VIEW'));
});

test('capture owns its bytes and is unaffected by later live mutations or descriptor mutations', () => {
  const a = new Uint8Array([1, 2, 3, 4]);
  const registry = [descriptor('a')];
  const evidence = observe({ a }, registry), expected = clone(evidence);
  a.fill(255); registry[0].dimensions[0] = 999; registry[0].paths[0].keys[0] = 'wrong';
  assert.deepEqual(evidence, expected);
  assert.equal(compareModelState(expected, evidence).ok, true);
});

test('one-bit changes and negative zero cannot pass exact comparison', () => {
  const a = new Uint8Array([0, 1, 2, 3]);
  const expected = observe({ a }, [descriptor('a')]);
  a[2] ^= 1;
  const result = compareModelState(expected, observe({ a }, [descriptor('a')]));
  assert.equal(result.ok, false);
  assert.deepEqual(result.differences, [{ kind: 'value-bits', id: 'a', firstDifferentByte: 2 }]);
  const minusZero = observe({ a: new Float64Array([-0]) }, [descriptor('a', 'Float64Array', [1])]);
  const plusZero = observe({ a: new Float64Array([0]) }, [descriptor('a', 'Float64Array', [1])]);
  assert.equal(compareModelState(minusZero, plusZero).ok, false);
});

test('exact ID and alias-path sets, dimensions, dtype and metadata are required', () => {
  const model = { a: new Uint8Array([1, 2, 3, 4]), b: new Uint8Array([5, 6, 7, 8]) };
  model.alias = model.a;
  const registry = [descriptor('a'), descriptor('b')];
  const expected = observe(model, registry);
  assert.deepEqual(kinds(compareModelState(expected, observe(model, [registry[0]]))), ['missing-id']);
  assert.deepEqual(kinds(compareModelState(observe(model, [registry[0]]), expected)), ['extra-id']);
  for (const change of [
    entry => { entry.paths = [{ root: 'model', keys: ['alias'] }]; },
    entry => { entry.paths.push({ root: 'model', keys: ['alias'] }); },
    entry => { entry.dimensions = [2, 2]; }, entry => { entry.role = 'other-role'; },
    entry => { entry.componentId = 'other-component'; }
  ]) {
    const changed = clone(registry); change(changed[0]);
    assert.ok(kinds(compareModelState(expected, observe(model, changed))).includes('descriptor-or-path-set'));
  }
  const other = { ...model, a: new Int8Array(model.a.buffer) };
  const changed = clone(registry); changed[0].dtype = 'Int8Array';
  assert.ok(kinds(compareModelState(expected, observe(other, changed))).includes('descriptor-or-path-set'));
});

test('descriptor/path order and arbitrary backing labels do not change semantic topology', () => {
  const backing = new ArrayBuffer(16), a = new Uint8Array(backing, 4, 4), b = new Uint16Array(backing, 8, 2);
  a.set([1, 2, 3, 4]); b.set([500, 600]);
  const model = { a, b, alias: a };
  const registry = [descriptor('a', 'Uint8Array', [4], [{ root: 'model', keys: ['a'] }, { root: 'model', keys: ['alias'] }]), descriptor('b', 'Uint16Array', [2])];
  const expected = observe(model, registry), permuted = clone(registry).reverse(); permuted[1].paths.reverse();
  const actual = observe(model, permuted);
  assert.deepEqual(expected, actual);
  actual.backings[0].id = 'arbitrary-wire-id';
  for (const entry of actual.entries) entry.backingId = 'arbitrary-wire-id';
  actual.entries.reverse();
  assert.equal(compareModelState(expected, actual).ok, true);
});

test('shared storage, offsets, backing lengths and separate-view identity are independently checked', () => {
  const backing = new ArrayBuffer(16);
  const registry = [descriptor('a'), descriptor('b')];
  const expected = observe({ a: new Uint8Array(backing, 4, 4), b: new Uint8Array(backing, 8, 4) }, registry);
  for (const model of [
    { a: new Uint8Array(new ArrayBuffer(16), 4, 4), b: new Uint8Array(new ArrayBuffer(16), 8, 4) },
    { a: new Uint8Array(backing, 0, 4), b: new Uint8Array(backing, 8, 4) },
    (() => { const longer = new ArrayBuffer(20); return { a: new Uint8Array(longer, 4, 4), b: new Uint8Array(longer, 8, 4) }; })()
  ]) assert.ok(kinds(compareModelState(expected, observe(model, registry))).includes('backing-topology'));
  const view = new Uint8Array(backing, 4, 4);
  assert.throws(() => observe({ a: view, b: view }, registry), code('DUPLICATE_VIEW'));
});

test('semantic ordering uses ordinal UTF-16 order for non-ASCII, punctuation and case', () => {
  const ids = ['a', 'A', '_', '-', 'é', 'e\u0301', 'e', '😀', 'Ω'], model = {}, backing = new ArrayBuffer(4);
  const registry = ids.map(id => { model[id] = new Uint8Array(backing); return descriptor(id); });
  const expected = observe(model, registry), permuted = observe(model, registry.slice().reverse());
  assert.deepEqual(expected.entries.map(entry => entry.id), ids.slice().sort());
  assert.deepEqual(permuted, expected);
  assert.equal(compareModelState(expected, permuted).ok, true);
  const view = new Uint8Array(4), aliases = Object.fromEntries(ids.map(id => [id, view]));
  const paths = ids.map(id => ({ root: 'model', keys: [id] }));
  const evidence = observe(aliases, [descriptor('aliased', 'Uint8Array', [4], paths)]);
  assert.deepEqual(evidence.entries[0].paths.map(path => JSON.stringify(path)), paths.map(path => JSON.stringify(path)).sort());
});

test('overlapping views agree byte-for-byte; forged inconsistent overlapping evidence is rejected', () => {
  const backing = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
  const evidence = observe({ a: new Uint8Array(backing, 0, 6), b: new Uint8Array(backing, 2, 4), c: new Uint8Array(backing, 6, 2) },
    [descriptor('a', 'Uint8Array', [6]), descriptor('b'), descriptor('c', 'Uint8Array', [2])]);
  const parsed = validateEvidence(evidence);
  assert.equal(parsed.unionBytes, 8); assert.equal(parsed.overlapBytes, 4); assert.equal(parsed.rangeChecks, 3);
  const corrupt = clone(evidence), entry = corrupt.entries.find(item => item.id === 'b'), raw = bytes(entry);
  raw[0] ^= 1; entry.dataBase64 = raw.toString('base64');
  const result = compareModelState(evidence, corrupt);
  assert.equal(result.ok, false); assert.match(result.differences[0].reason, /overlapping/);
});

test('dense overlap work remains linear in declared view bytes, not quadratic in view count', () => {
  const backing = new Uint8Array(64).fill(7).buffer, model = {}, registry = [];
  for (let i = 0; i < 2048; i++) {
    const id = 'view-' + String(i).padStart(4, '0'); model[id] = new Uint8Array(backing, 8, 16); registry.push(descriptor(id, 'Uint8Array', [16]));
  }
  const evidence = observe(model, registry), parsed = validateEvidence(evidence);
  assert.equal(parsed.rangeChecks, 2048); assert.equal(parsed.unionBytes, 16);
  assert.equal(parsed.overlapBytes, 2047 * 16); assert.ok(parsed.overlapBytes < parsed.rawBytes);
  assert.equal(compareModelState(evidence, clone(evidence)).ok, true);
});

test('scalar exact F64, safe-integer and BigInt encodings preserve values and reject invalid values', () => {
  const model = { minusZero: -0, tiny: Number.MIN_VALUE, clock: Number.MAX_SAFE_INTEGER, signed: -(1n << 63n), unsigned: (1n << 64n) - 1n };
  const registry = [descriptor('minusZero', 'Float64', []), descriptor('tiny', 'Float64', []), descriptor('clock', 'SafeInteger', []), descriptor('signed', 'BigInt64', []), descriptor('unsigned', 'BigUint64', [])];
  const evidence = observe(model, registry);
  assert.equal(bytes(evidence.entries.find(item => item.id === 'minusZero')).readDoubleLE(), -0);
  assert.equal(bytes(evidence.entries.find(item => item.id === 'tiny')).readDoubleLE(), Number.MIN_VALUE);
  assert.equal(bytes(evidence.entries.find(item => item.id === 'signed')).readBigInt64LE(), model.signed);
  assert.equal(bytes(evidence.entries.find(item => item.id === 'unsigned')).readBigUInt64LE(), model.unsigned);
  assert.equal(compareModelState(evidence, clone(evidence)).ok, true);
  for (const [dtype, value] of [['Float64', NaN], ['Float64', Infinity], ['SafeInteger', 1.5], ['SafeInteger', Number.MAX_SAFE_INTEGER + 1], ['BigInt64', 1n << 63n], ['BigUint64', -1n], ['BigUint64', 1n << 64n]]) {
    assert.throws(() => observe({ a: value }, [descriptor('a', dtype, [])]), code('SCALAR'));
  }
  const scalarAlias = descriptor('a', 'Float64', [], [{ root: 'model', keys: ['a'] }, { root: 'model', keys: ['b'] }]);
  assert.throws(() => observe({ a: -0, b: 0 }, [scalarAlias]), code('ALIAS'));
});

test('numeric scalar bytes must conform to the scalar dtype even in untrusted evidence', () => {
  const evidence = observe({ a: 1 }, [descriptor('a', 'SafeInteger', [])]);
  for (const value of [1.5, Infinity, NaN]) {
    const altered = clone(evidence), raw = Buffer.alloc(8); raw.writeDoubleLE(value);
    altered.entries[0].dataBase64 = raw.toString('base64');
    assert.equal(compareModelState(altered, altered).ok, false);
  }
});

test('own and inherited ordinary getters are not invoked on observed paths or metadata', () => {
  let invoked = 0;
  const ownGetter = Object.defineProperty({}, 'a', { get() { invoked++; throw new Error('getter ran'); } });
  assert.throws(() => observe(ownGetter, [descriptor('a')]), code('ACCESSOR'));
  const inherited = Object.create(ownGetter);
  assert.throws(() => observe(inherited, [descriptor('a')]), code('MISSING_PROPERTY'));
  const invalidDescriptor = descriptor('a'); Object.defineProperty(invalidDescriptor, 'role', { get() { invoked++; throw new Error('getter ran'); } });
  assert.throws(() => observe({ a: new Uint8Array(4) }, [invalidDescriptor]), code('ACCESSOR'));
  const roots = Object.create(Object.defineProperty({}, 'model', { get() { invoked++; return ownGetter; } }));
  assert.throws(() => observeModelState(roots, [descriptor('a')]), code('MISSING_PROPERTY'));
  assert.equal(invoked, 0);
});

test('hostile own typed-array metadata is ignored in favor of intrinsic brand getters', () => {
  const a = new Float32Array([1, -0]); let invoked = 0;
  for (const key of ['constructor', 'buffer', 'byteLength', 'byteOffset', 'length', Symbol.toStringTag]) {
    Object.defineProperty(a, key, { get() { invoked++; throw new Error('spoofed metadata'); } });
  }
  const evidence = observe({ a }, [descriptor('a', 'Float32Array', [2])]);
  assert.equal(evidence.entries[0].dtype, 'Float32Array'); assert.equal(evidence.entries[0].byteLength, 8);
  assert.equal(invoked, 0);
  assert.throws(() => observe({ a: new DataView(new ArrayBuffer(4)) }, [descriptor('a')]), code('NOT_TYPED_ARRAY'));
});

test('unsafe paths, sparse registries and duplicate IDs/paths fail closed', () => {
  const model = { a: new Uint8Array(4) };
  for (const key of ['constructor', 'prototype', '__proto__']) {
    assert.throws(() => observe(model, [descriptor('a', 'Uint8Array', [4], [{ root: 'model', keys: [key] }])]), code('PATH'));
  }
  assert.throws(() => observe(model, new Array(1)), code('MISSING_PROPERTY'));
  assert.throws(() => observe(model, [descriptor('a'), descriptor('a')]), code('DUPLICATE_ID'));
  const duplicatePath = descriptor('b', 'Uint8Array', [4], [{ root: 'model', keys: ['a'] }]);
  assert.throws(() => observe(model, [descriptor('a'), duplicatePath]), code('DUPLICATE_PATH'));
  for (const kind of ['', false, 0, null]) {
    const invalid = descriptor('a'); invalid.kind = kind;
    assert.throws(() => observe(model, [invalid]), code('DTYPE'));
  }
});

test('shared, resizable and detached backing buffers are explicitly unsupported', () => {
  assert.throws(() => observe({ a: new Uint8Array(new SharedArrayBuffer(4)) }, [descriptor('a')]), code('SHARED_BUFFER'));
  const resizable = new ArrayBuffer(4, { maxByteLength: 16 });
  assert.equal(resizable.resizable, true, 'test runtime must exercise resizable buffers');
  assert.throws(() => observe({ a: new Uint8Array(resizable) }, [descriptor('a')]), code('RESIZABLE_BUFFER'));
  const buffer = new ArrayBuffer(0), a = new Uint8Array(buffer); structuredClone(buffer, { transfer: [buffer] });
  assert.throws(() => observe({ a }, [descriptor('a', 'Uint8Array', [0])]), code('DETACHED_BUFFER'));
});

test('capture bounds are checked before byte encoding and cannot be enlarged', () => {
  const model = { a: new Uint8Array(8), b: new Uint8Array(8) };
  assert.throws(() => observe(model, [descriptor('a', 'Uint8Array', [8])], { maxRawBytes: 7 }), code('BYTE_LIMIT'));
  assert.throws(() => observe(model, [descriptor('a', 'Uint8Array', [8]), descriptor('b', 'Uint8Array', [8])], { maxRawBytes: 15 }), code('BYTE_LIMIT'));
  assert.throws(() => observe(model, [descriptor('a'), descriptor('b')], { maxEntries: 1 }), code('ARRAY_LIMIT'));
  assert.throws(() => observe(model, [descriptor('a')], { maxRawBytes: 32 * 1024 * 1024 }), code('LIMIT'));
  assert.throws(() => observe(model, [descriptor('a')], { maxTotalText: 1 }), code('TEXT_LIMIT'));
  let encodings = 0;
  assert.throws(() => vm.runInNewContext('(' + observeModelState.toString() + ')(roots, registry, {maxRawBytes:7})',
    { roots: { model }, registry: [descriptor('a', 'Uint8Array', [8])], btoa() { encodings++; throw new Error('unexpected encoding'); } }), code('BYTE_LIMIT'));
  assert.equal(encodings, 0);
});

test('comparator rejects malformed, cyclic, oversized or accessor evidence without invoking ordinary getters', () => {
  const evidence = observe({ a: new Uint8Array(4) }, [descriptor('a')]);
  const variants = [
    value => { value.entries[0].dataBase64 = '!!!!AAAA'; },
    value => { value.entries[0].dataBase64 = value.entries[0].dataBase64.slice(1); },
    value => { value.entries[0].byteOffset = 1; },
    value => { value.totals.rawBytes++; },
    value => { value.entries[0].dimensions = [16777217]; value.entries[0].length = 16777217; value.entries[0].byteLength = 16777217; },
    value => { value.backings.push({ id: 'unused', byteLength: 1 }); value.totals.backings++; },
    value => { value.extra = value; },
    value => { value.entries = new Array(100001); }
  ];
  for (const change of variants) { const altered = clone(evidence); change(altered); assert.equal(compareModelState(evidence, altered).ok, false); }
  let invoked = 0;
  const ownGetter = clone(evidence); Object.defineProperty(ownGetter, 'schema', { get() { invoked++; return evidence.schema; } });
  assert.equal(compareModelState(evidence, ownGetter).ok, false);
  const inherited = Object.create(Object.defineProperty({}, 'schema', { get() { invoked++; return evidence.schema; } }));
  assert.equal(compareModelState(evidence, inherited).ok, false);
  assert.equal(invoked, 0);
});

test('snapshot observation is read-only and root traversal neither requires nor changes prototypes', () => {
  const model = Object.create(null); model.a = new Uint8Array([1, 2, 3, 4]); Object.freeze(model);
  const descriptorValue = descriptor('a'); Object.freeze(descriptorValue.paths[0].keys); Object.freeze(descriptorValue.paths[0]); Object.freeze(descriptorValue.paths); Object.freeze(descriptorValue.dimensions); Object.freeze(descriptorValue);
  const roots = Object.freeze({ model }), registry = Object.freeze([descriptorValue]);
  const before = Buffer.from(model.a);
  assert.equal(compareModelState(observeModelState(roots, registry), observeModelState(roots, registry)).ok, true);
  assert.equal(Object.getPrototypeOf(model), null); assert.deepEqual(Buffer.from(model.a), before);
});

test('primitive-only property floods, oversized keys and non-JSON array fields cannot bypass parser bounds', () => {
  const evidence = observe({ a: new Uint8Array(4) }, [descriptor('a')]);
  const wide = clone(evidence); wide.extra = Object.fromEntries(Array.from({ length: 100001 }, (_, i) => ['k' + i, i]));
  const result = compareModelState(evidence, wide);
  assert.equal(result.ok, false); assert.match(result.differences[0].reason, /own-property bound/);
  const longKey = clone(evidence); longKey['k'.repeat(257)] = 1;
  assert.match(compareModelState(evidence, longKey).differences[0].reason, /key text bound/);
  const namedArray = clone(evidence); namedArray.entries.extra = 1;
  assert.match(compareModelState(evidence, namedArray).differences[0].reason, /Non-index array property/);
  const oddIndex = clone(evidence); oddIndex.entries['00'] = 1;
  assert.match(compareModelState(evidence, oddIndex).differences[0].reason, /Non-index array property/);
  const extra = clone(evidence); extra.entries[0].ignoredMetadata = 1;
  assert.match(compareModelState(evidence, extra).differences[0].reason, /Unknown evidence field/);
});

test('maximum allowed entry count with distinct empty backings fits the parser resource envelope', () => {
  const model = {}, registry = [];
  for (let i = 0; i < 4096; i++) {
    const id = 'empty-' + i; model[id] = new Uint8Array(0); registry.push(descriptor(id, 'Uint8Array', [0]));
  }
  const evidence = observe(model, registry);
  const parsed = validateEvidence(evidence);
  assert.equal(parsed.entries.size, 4096); assert.equal(parsed.rawBytes, 0); assert.equal(parsed.rangeChecks, 0);
});
