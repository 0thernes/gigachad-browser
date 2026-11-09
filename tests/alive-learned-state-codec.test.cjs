'use strict';
// Pure format fixtures only. These do not qualify a complete application catalog,
// live importer, process restart, continued numerical update, or model coverage.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash, webcrypto } = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');
const { Worker } = require('node:worker_threads');
const codec = require('../systems/alive-learned-state-codec.js');
const options = { crypto: webcrypto };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const copy = object => structuredClone(object);
function tensor(id, raw = [0, 0, 0, 128, 1, 0, 0, 0], dtype = 'Float32Array', changes = {}) {
  const bytes = Uint8Array.from(raw).buffer;
  return { id, componentId: 'core', role: 'parameter', paths: [{ root: 'model', keys: [id] }],
    dtype, dimensions: [bytes.byteLength / codec.DTYPES[dtype]], length: bytes.byteLength / codec.DTYPES[dtype],
    byteLength: bytes.byteLength, byteOrder: 'LE', backingGroup: id, backingOffset: 0,
    backingByteLength: bytes.byteLength, bytes, ...changes };
}
function fixture(tensors = [tensor('weights')]) {
  return {
    architecture: { registryVersion: 1, fingerprint: 'a'.repeat(64), components: [
      { id: 'core', schemaVersion: 1, implementationDigest: 'b'.repeat(64), present: true },
      { id: 'optional', schemaVersion: 1, implementationDigest: 'c'.repeat(64), present: false }
    ] },
    snapshot: { creatureId: 'creature-fixture', policyId: 'policy-fixture', checkpointId: 'checkpoint-fixture',
      logicalTick: 123, modelEpoch: 8, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' },
    tensors, stateManifest: [{ id: 'bias', componentId: 'core', role: 'parameter', valueType: 'f64', schemaVersion: 1, required: true }],
    stateValues: { bias: codec.float64(-0) },
    resumeRules: [{ id: 'document', action: 'reset', reason: 'A new document requires fresh authority.', version: 1 }],
    provenance: { qualification: 'synthetic codec fixture, not full-model coverage' }
  };
}
function setState(capture, id, tag, valueType = tag === null ? 'null' : typeof tag === 'object' ? tag.$type : typeof tag) {
  capture.stateManifest.push({ id, componentId: 'core', role: 'continuation', valueType, schemaVersion: 1, required: true });
  capture.stateValues[id] = tag;
}
function firstHashBarrier() {
  let release, entered = false;
  const pending = new Promise(resolve => { release = resolve; });
  return { release, get entered() { return entered; }, crypto: { subtle: { async digest(algorithm, bytes) {
    if (!entered) { entered = true; await pending; }
    return webcrypto.subtle.digest(algorithm, bytes);
  } } } };
}
function rehash(wire) {
  const bytes = Buffer.from(wire.tensorBlob.data, 'base64');
  wire.tensorBlob.sha256 = sha(bytes);
  for (const row of wire.tensorManifest) row.sha256 = sha(bytes.subarray(row.blobOffset, row.blobOffset + row.byteLength));
}

test('exact binary representation for all supported dtypes agrees with independent Buffer/SHA oracle', async () => {
  const tensors = Object.entries(codec.DTYPES).map(([dtype, width], index) => {
    const raw = Array.from({ length: width * 3 }, (_, i) => (index * 29 + i * 53) & 255);
    // Explicit Float32 -0 and least positive subnormal; Float64 -0 and subnormal.
    if (dtype === 'Float32Array') raw.splice(0, 8, 0, 0, 0, 128, 1, 0, 0, 0);
    if (dtype === 'Float64Array') raw.splice(0, 16, 0, 0, 0, 0, 0, 0, 0, 128, 1, 0, 0, 0, 0, 0, 0, 0);
    return tensor(`tensor/${dtype}`, raw, dtype);
  });
  const capture = fixture(tensors.reverse());
  const ordered = [...tensors].sort((a, b) => a.id < b.id ? -1 : 1);
  const expected = Buffer.concat(ordered.map(row => Buffer.from(row.bytes)));
  const wire = await codec.seal(capture, options);
  assert.equal(wire.tensorBlob.data, expected.toString('base64'));
  assert.equal(wire.tensorBlob.sha256, sha(expected));
  for (const [index, row] of wire.tensorManifest.entries()) {
    assert.equal(row.sha256, sha(Buffer.from(ordered[index].bytes)));
    assert.equal(row.dtype, ordered[index].dtype);
  }
  const json = JSON.stringify(wire), decoded = await codec.decode(json, options);
  assert.equal(decoded.evidence.digest, sha(Buffer.from(json, 'utf8')));
  assert.equal(decoded.evidence.payloadBytes, Buffer.byteLength(json, 'utf8'));
  assert.equal(decoded.evidence.totalTensorBytes, expected.byteLength);
  for (const [index, row] of decoded.tensors.entries()) {
    assert.deepEqual(Buffer.from(row.bytes), Buffer.from(ordered[index].bytes));
    assert.notEqual(row.bytes, ordered[index].bytes);
  }
  assert.ok(Object.is(codec.untagValue(decoded.stateValues.bias), -0));
});

test('explicit tags retain finite Float64 bits, safe counters, signed widths and ordered collections', async () => {
  for (const value of [-0, 0, Number.MIN_VALUE, -Number.MIN_VALUE, Math.PI, Number.MAX_VALUE]) {
    const bytes = Buffer.alloc(8); bytes.writeDoubleLE(value);
    assert.equal(codec.float64(value).hex, bytes.toString('hex'));
    assert.ok(Object.is(codec.untagValue(codec.float64(value)), value));
  }
  assert.equal(codec.tagValue(1).$type, 'f64');
  assert.equal(codec.untagValue(codec.integer(Number.MIN_SAFE_INTEGER)), Number.MIN_SAFE_INTEGER);
  for (const bits of [8, 16, 32, 64, 128, 256]) for (const signed of [false, true]) {
    const limit = 1n << BigInt(bits - (signed ? 1 : 0));
    for (const value of signed ? [-limit, -1n, 0n, limit - 1n] : [0n, limit - 1n]) {
      assert.equal(codec.untagValue(codec.bigint(value, { bits, signed })), value);
    }
    assert.throws(() => codec.bigint(limit, { bits, signed }), /outside/);
  }
  const original = { cursor: 12, replay: [null, true, '🙂', -0],
    ordered: new Map([['second', 2], [1, 1n], [null, false]]), set: new Set(['z', 'a', 1n]) };
  const decoded = codec.untagValue(codec.tagValue(original));
  assert.deepEqual(decoded, original);
  assert.deepEqual([...decoded.ordered.keys()], ['second', 1, null]);
  assert.deepEqual([...decoded.set], ['z', 'a', 1n]);
  const capture = fixture(); setState(capture, 'replay', codec.tagValue(original));
  setState(capture, 'reference', codec.tensorRef('weights'));
  assert.deepEqual(codec.untagValue((await codec.decode(await codec.encode(capture, options), options)).stateValues.reference), { $type: 'tensor', id: 'weights' });
});

test('invalid scalar envelopes, signed zero counters and semantically duplicate Map/Set members reject', () => {
  for (const value of [NaN, Infinity, -Infinity]) assert.throws(() => codec.float64(value), /finite/);
  assert.throws(() => codec.integer(-0), /i53/);
  for (const tag of [
    { $type: 'f64', hex: '000000000000f07f' }, { $type: 'f64', hex: '0000' },
    { $type: 'f64', hex: '0000000000000000', extra: 1 }, { $type: 'i53', value: -0 },
    { $type: 'i53', value: '1' }, { $type: 'bigint', signed: false, bits: 8, hex: 'fff' },
    { $type: 'bigint', signed: true, bits: 7, hex: '7f' }, { $type: 'unknown' },
    { $type: 'object', entries: [['x', true], ['x', false]] },
    { $type: 'object', entries: [['constructor', true]] },
    { $type: 'map', entries: [[codec.float64(1), true], [codec.integer(1), false]] },
    { $type: 'map', entries: [[codec.float64(-0), true], [codec.float64(0), false]] },
    { $type: 'set', values: [codec.float64(1), codec.integer(1)] },
    { $type: 'set', values: [codec.float64(-0), codec.float64(0)] },
    { $type: 'map', entries: [[codec.tensorRef('weights'), true]] },
    { $type: 'set', values: [codec.tensorRef('weights')] }, 1, undefined
  ]) assert.throws(() => codec.untagValue(tag), /Learned-state/);
  assert.throws(() => codec.tagValue(new Map([[{}, 1]])), /scalar/);
  assert.throws(() => codec.tagValue(new Set([{}])), /scalar/);
  assert.throws(() => codec.untagValue(codec.tensorRef('missing'), { tensorIds: new Set(['weights']) }), /unknown tensor/);
});

test('input tensors, metadata and tags are synchronously owned before the first asynchronous hash', async () => {
  const capture = fixture(), original = Buffer.from(capture.tensors[0].bytes).toString('hex');
  const gate = firstHashBarrier();
  const pending = codec.seal(capture, { crypto: gate.crypto });
  assert.equal(gate.entered, true);
  new Uint8Array(capture.tensors[0].bytes).fill(99);
  capture.tensors[0].paths[0].keys[0] = 'replaced';
  capture.snapshot.logicalTick = 999;
  capture.stateValues.bias.hex = codec.float64(42).hex;
  gate.release();
  const wire = await pending;
  assert.equal(Buffer.from(wire.tensorBlob.data, 'base64').toString('hex'), original);
  assert.equal(wire.tensorManifest[0].paths[0].keys[0], 'weights');
  assert.equal(wire.snapshot.logicalTick, 123);
  assert.ok(Object.is(codec.untagValue(wire.stateValues.bias), -0));
});

test('decode owns wire metadata and bytes across hash awaits and returns independent destination buffers', async () => {
  const wire = await codec.seal(fixture(), options), gate = firstHashBarrier();
  const pending = codec.decode(wire, { crypto: gate.crypto });
  assert.equal(gate.entered, true);
  wire.tensorBlob.data = 'corrupted'; wire.tensorManifest[0].id = 'changed';
  wire.stateValues.bias = codec.float64(52); wire.snapshot.logicalTick = 999;
  gate.release(); const decoded = await pending;
  assert.equal(decoded.tensors[0].id, 'weights');
  assert.equal(decoded.snapshot.logicalTick, 123);
  assert.deepEqual([...new Uint8Array(decoded.tensors[0].bytes)], [0, 0, 0, 128, 1, 0, 0, 0]);
  assert.ok(Object.is(codec.untagValue(decoded.stateValues.bias), -0));
});

test('decoder-issued capsule ignores corrupted public mirrors and rejects forged or spread handles', async () => {
  const decoded = await codec.decode(await codec.encode(fixture(), options), options);
  const expectedDigest = decoded.evidence.digest;
  new Uint8Array(decoded.tensors[0].bytes).fill(255);
  decoded.tensorManifest[0].paths[0].keys[0] = 'wrong';
  decoded.stateValues.bias = codec.float64(91); decoded.snapshot.logicalTick = 999;
  decoded.evidence.digest = '0'.repeat(64); decoded.tensorBlob.data = 'bad';
  const verified = codec.verifiedCopy(decoded);
  assert.deepEqual([...new Uint8Array(verified.tensors[0].bytes)], [0, 0, 0, 128, 1, 0, 0, 0]);
  assert.equal(verified.tensorManifest[0].paths[0].keys[0], 'weights');
  assert.equal(verified.snapshot.logicalTick, 123); assert.equal(verified.evidence.digest, expectedDigest);
  assert.ok(Object.is(codec.untagValue(verified.stateValues.bias), -0));
  assert.equal(Object.hasOwn(verified, 'tensorBlob'), false, 'private capsule does not retain redundant encoded blob');
  new Uint8Array(verified.tensors[0].bytes).fill(17); verified.stateValues.bias = codec.float64(17);
  assert.deepEqual([...new Uint8Array(codec.verifiedCopy(decoded).tensors[0].bytes)], [0, 0, 0, 128, 1, 0, 0, 0]);
  assert.ok(Object.is(codec.untagValue(codec.verifiedCopy(decoded).stateValues.bias), -0));
  assert.throws(() => codec.verifiedCopy({ ...decoded }), /decoder-issued/);
  assert.throws(() => codec.verifiedCopy(copy(decoded)), /decoder-issued/);
  assert.throws(() => codec.verifiedCopy({}), /decoder-issued/);
});

test('custom Array prototypes cannot retain caller-owned metadata through overridden map or iterators', async () => {
  let invoked = false;
  class BorrowingArray extends Array { map() { invoked = true; return this; } }
  const capture = fixture();
  capture.architecture.components = new BorrowingArray(...capture.architecture.components);
  await assert.rejects(codec.seal(capture, options), /array/);
  assert.throws(() => codec.tagValue(new BorrowingArray(1, 2)), /array/);
  const wire = await codec.seal(fixture(), options);
  Object.setPrototypeOf(wire.tensorManifest[0].paths, { map() { invoked = true; return this; } });
  await assert.rejects(codec.decode(wire, options), /array/);
  const keys = fixture();
  Object.setPrototypeOf(keys.tensors[0].paths[0].keys, { map() { invoked = true; return this; } });
  await assert.rejects(codec.seal(keys, options), /array/);
  assert.equal(invoked, false, 'untrusted array methods were never invoked');
});

test('normal-array proxies cannot smuggle original arrays past owned-descriptor copying', async () => {
  let methodsRead = 0;
  const proxy = array => new Proxy(array, { get(target, key, receiver) {
    if (key === 'map' || key === Symbol.iterator) { methodsRead++; return () => target; }
    return Reflect.get(target, key, receiver);
  } });
  const capture = fixture(), components = capture.architecture.components, path = capture.tensors[0].paths[0].keys;
  capture.architecture.components = proxy(components);
  capture.tensors[0].paths[0].keys = proxy(path); capture.tensors = proxy(capture.tensors);
  const gate = firstHashBarrier(), pending = codec.seal(capture, { crypto: gate.crypto });
  components[0].present = false; path[0] = 'changed'; gate.release();
  const wire = await pending;
  assert.equal(wire.architecture.components[0].present, true);
  assert.equal(wire.tensorManifest[0].paths[0].keys[0], 'weights');
  const wireComponents = wire.architecture.components; wire.architecture.components = proxy(wireComponents);
  const decodeGate = firstHashBarrier(), decodePending = codec.decode(wire, { crypto: decodeGate.crypto });
  wireComponents[0].present = false; decodeGate.release();
  const decoded = await decodePending;
  assert.equal(codec.verifiedCopy(decoded).architecture.components[0].present, true);
  assert.deepEqual(codec.untagValue(codec.tagValue(proxy([1, 2]))), [1, 2]);
  assert.equal(methodsRead, 0, 'source map/iterator overrides were never read');
});

test('consistent aliases/overlaps and sparse backing capacity preserve bytes without allocating capacity', async () => {
  const first = tensor('a', [1, 2, 3, 4, 5, 6, 7, 8], 'Uint8Array', { backingGroup: 'shared', backingOffset: 1000000000000, backingByteLength: 1000000000020,
    paths: [{ root: 'model', keys: ['a'] }, { root: 'alias', keys: ['0', 'a'] }] });
  const second = tensor('b', [5, 6, 7, 8, 9, 10], 'Uint8Array', { backingGroup: 'shared', backingOffset: 1000000000004, backingByteLength: 1000000000020 });
  const third = tensor('c', [3, 4, 5, 6, 7, 8, 9], 'Uint8Array', { backingGroup: 'shared', backingOffset: 1000000000002, backingByteLength: 1000000000020 });
  const capture = fixture([third, second, first]);
  const wire = await codec.seal(capture, options), decoded = await codec.decode(wire, options);
  assert.equal(decoded.evidence.totalTensorBytes, 21);
  assert.equal(decoded.tensors[0].paths.length, 2);
  assert.equal(decoded.tensors[1].backingOffset, 1000000000004);
  new Uint8Array(capture.tensors[0].bytes)[3] = 255;
  await assert.rejects(codec.seal(capture, options), /inconsistent overlapping/);
  // Recompute BOTH hashes so this failure tests topology, not a checksum mismatch.
  const adversarial = copy(wire), bytes = Buffer.from(adversarial.tensorBlob.data, 'base64');
  bytes[adversarial.tensorManifest[1].blobOffset] ^= 1;
  adversarial.tensorBlob.data = bytes.toString('base64'); rehash(adversarial);
  await assert.rejects(codec.decode(adversarial, options), /inconsistent overlapping/);
});

test('every checksum is independently enforced, even when the other checksum is updated', async () => {
  const wire = await codec.seal(fixture(), options);
  const altered = copy(wire), bytes = Buffer.from(altered.tensorBlob.data, 'base64'); bytes[2] ^= 0x80;
  altered.tensorBlob.data = bytes.toString('base64');
  await assert.rejects(codec.decode(altered, options), /blob SHA-256/);
  altered.tensorBlob.sha256 = sha(bytes);
  await assert.rejects(codec.decode(altered, options), /tensor SHA-256/);
  const hashOnly = copy(wire); hashOnly.tensorManifest[0].sha256 = '0'.repeat(64);
  await assert.rejects(codec.decode(hashOnly, options), /tensor SHA-256/);
});

test('base64 padding, unused bits, truncation and declared sizes reject before hash admission', async () => {
  const wire = await codec.seal(fixture([tensor('weights', [255], 'Uint8Array')]), options);
  assert.equal(wire.tensorBlob.data, '/w==');
  for (const data of ['/x==', '/w=A', '/w=', '/w===', ' /w==', '_w==', '/w\n=', 'AAAA']) {
    const altered = copy(wire); altered.tensorBlob.data = data;
    await assert.rejects(codec.decode(altered, options), /base64|blob size/);
  }
  const empty = fixture([tensor('empty', [], 'Uint8Array')]);
  const decoded = await codec.decode(await codec.encode(empty, options), options);
  assert.equal(decoded.tensorBlob.data, ''); assert.equal(decoded.tensors[0].bytes.byteLength, 0);
});

test('compact string policy rejects duplicate and escaped duplicate members without canonical key-order assumptions', async () => {
  const wire = await codec.seal(fixture(), options), json = JSON.stringify(wire);
  for (const malformed of [
    json.replace('{"schema":', '{"schema":"wrong","schema":'),
    json.replace('{"schema":', '{"\\u0073chema":"wrong","schema":'),
    json.replace('"stateValues":{"bias":', '"stateValues":{"bias":true,"bias":'),
    json.replace('"$type":"f64"', '"$type":"wrong","$type":"f64"'),
    json.replace('"logicalTick":123', '"logicalTick":1.23e2'),
    json.replace('"core"', '"\\u0063ore"'), ' ' + json, JSON.stringify(wire, null, 2)
  ]) await assert.rejects(codec.decode(malformed, options), /normalized/);
  const reversed = Object.fromEntries(Object.entries(wire).reverse());
  assert.equal((await codec.decode(JSON.stringify(reversed), options)).snapshot.logicalTick, 123);
});

test('structural shape, component, alias, arithmetic and exact-envelope faults all reject', async () => {
  const original = await codec.seal(fixture(), options);
  const faults = [
    wire => { wire.schema = 'unknown'; }, wire => { wire.extra = true; },
    wire => { wire.architecture.registryVersion = 0; }, wire => { wire.architecture.components[0].present = false; },
    wire => { wire.architecture.components.push(copy(wire.architecture.components[0])); },
    wire => { wire.tensorManifest[0].dtype = 'Uint128Array'; }, wire => { wire.tensorManifest[0].byteOrder = 'BE'; },
    wire => { wire.tensorManifest[0].length = 3; }, wire => { wire.tensorManifest[0].dimensions = [1, 1]; },
    wire => { wire.tensorManifest[0].dimensions = [0, Number.MAX_SAFE_INTEGER]; },
    wire => { wire.tensorManifest[0].dimensions = [codec.LIMITS.tensorBytes, codec.LIMITS.tensorBytes, codec.LIMITS.tensorBytes, 0]; },
    wire => { wire.tensorManifest[0].blobOffset = 1; }, wire => { wire.tensorManifest[0].backingOffset = Number.MAX_SAFE_INTEGER; },
    wire => { wire.tensorManifest[0].backingOffset = 1; wire.tensorManifest[0].backingByteLength++; },
    wire => { wire.tensorManifest[0].paths.push(copy(wire.tensorManifest[0].paths[0])); },
    wire => { wire.tensorManifest[0].paths[0].keys = ['__proto__']; },
    wire => { wire.tensorManifest[0].paths[0].keys = ['x'.repeat(129)]; },
    wire => { wire.tensorManifest[0].paths = Array.from({ length: 33 }, (_, i) => ({ root: 'r', keys: [String(i)] })); },
    wire => { wire.tensorManifest[0].paths[0].keys = Array(17).fill('x'); },
    wire => { wire.stateManifest[0].valueType = 'i53'; }, wire => { delete wire.stateValues.bias; },
    wire => { wire.stateValues.extra = false; }, wire => { wire.stateManifest.push(copy(wire.stateManifest[0])); },
    wire => { wire.stateValues.bias = codec.tensorRef('missing'); wire.stateManifest[0].valueType = 'tensor'; },
    wire => { wire.snapshot.logicalTick = -0; }, wire => { wire.snapshot.capturedAt = 0; },
    wire => { wire.snapshot.capturedAt = '2026-11-09'; }, wire => { wire.snapshot.resumeBoundary = 'restore-old-leases'; },
    wire => { wire.resumeRules.push(copy(wire.resumeRules[0])); }
  ];
  for (const fault of faults) { const wire = copy(original); fault(wire); await assert.rejects(codec.decode(wire, options), /Learned-state/); }
});

test('prototype-sensitive members, accessor, shared/resizable/detached bytes and cyclic data reject without invoking getters', async () => {
  let invoked = false;
  const capture = fixture(); Object.defineProperty(capture.snapshot, 'logicalTick', { enumerable: true, get() { invoked = true; return 1; } });
  await assert.rejects(codec.seal(capture, options), /unsafe property/); assert.equal(invoked, false);
  for (const value of [new Map(), new Set()]) {
    Object.defineProperty(value, 'size', { get() { invoked = true; return 1; } });
    assert.throws(() => codec.tagValue(value), /extended/);
  }
  assert.equal(invoked, false, 'collection accessors were not invoked');
  const cycle = fixture(); cycle.provenance.cycle = cycle.provenance;
  await assert.rejects(codec.seal(cycle, options), /cyclic/);
  const polluted = fixture(); polluted.provenance = JSON.parse('{"__proto__":{"x":1}}');
  await assert.rejects(codec.seal(polluted, options), /unsafe property/);
  const shared = fixture(); shared.tensors[0].bytes = new SharedArrayBuffer(8);
  await assert.rejects(codec.seal(shared, options), /ArrayBuffer/);
  const detached = fixture(); structuredClone(detached.tensors[0].bytes, { transfer: [detached.tensors[0].bytes] });
  await assert.rejects(codec.seal(detached, options), /detached/);
  if ('resizable' in ArrayBuffer.prototype) {
    const resized = fixture(); resized.tensors[0].bytes = new ArrayBuffer(8, { maxByteLength: 16 });
    await assert.rejects(codec.seal(resized, options), /resizable/);
  }
  const view = fixture(); view.tensors[0].bytes = new Uint8Array(8);
  await assert.rejects(codec.seal(view, options), /ArrayBuffer/);
});

test('depth, node count, raw bytes and final UTF-8 payload ceilings reject without dropping entries', async () => {
  let tag = true;
  for (let i = 0; i <= codec.LIMITS.stateDepth; i++) tag = { $type: 'array', items: [tag] };
  assert.throws(() => codec.untagValue(tag), /budget/);
  assert.throws(() => codec.untagValue({ $type: 'array', items: Array(codec.LIMITS.stateNodes).fill(null) }), /budget/);
  await assert.rejects(codec.decode('['.repeat(129) + '0' + ']'.repeat(129), options), /work budget/);
  await assert.rejects(codec.decode('[' + '0,'.repeat(codec.LIMITS.jsonNodes) + '0]', options), /work budget/);
  const broad = fixture();
  broad.provenance = Object.fromEntries(Array.from({ length: codec.LIMITS.jsonNodes / 2 }, (_, i) => [`k${i}`, true]));
  await assert.rejects(codec.seal(broad, options), /work budget/);
  const raw = fixture(); raw.tensors[0].bytes = new ArrayBuffer(codec.LIMITS.tensorBytes + 1);
  await assert.rejects(codec.seal(raw, options), /tensor byte budget/);
  const large = fixture();
  setState(large, 'unicode', '🙂'.repeat(codec.LIMITS.payloadBytes / 4), 'string');
  // Code-unit count fits the cap; UTF-8 plus manifests does not. Tiny tensors
  // show that a raw-byte cap alone cannot establish whole-record admission.
  await assert.rejects(codec.encode(large, options), /UTF-8 size|payload exceeds/);
  assert.equal(large.stateValues.unicode.length, codec.LIMITS.payloadBytes / 2);
});

test('abort/hash-provider failures never yield a partially verified success', async () => {
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(codec.encode(fixture(), { ...options, signal: cancelled.signal }), /cancelled/);
  const gate = firstHashBarrier(), controller = new AbortController();
  const pending = codec.encode(fixture(), { crypto: gate.crypto, signal: controller.signal });
  controller.abort(); gate.release(); await assert.rejects(pending, /cancelled/);
  await assert.rejects(codec.seal(fixture(), { crypto: { subtle: { digest: async () => { throw new Error('injected hash failure'); } } } }), /injected/);
  await assert.rejects(codec.seal(fixture(), { crypto: {} }), /WebCrypto/);
  await assert.rejects(codec.seal(fixture(), { crypto: { subtle: { digest: async () => new ArrayBuffer(31) } } }), /provider result/);
});

test('descriptor fingerprint is deterministic sorted data, domain separated and independent of property construction order', async () => {
  const first = { version: 1, family: { capacity: 32, dimensions: [2, 8] }, entries: ['a', 'b'] };
  const second = { entries: ['a', 'b'], family: { dimensions: [2, 8], capacity: 32 }, version: 1 };
  const canonical = '{"entries":["a","b"],"family":{"capacity":32,"dimensions":[2,8]},"version":1}';
  assert.equal(codec.canonicalDescriptorJSON(first), canonical);
  assert.equal(codec.canonicalDescriptorJSON(second), canonical);
  assert.equal(await codec.fingerprintDescriptors(first, options), sha(Buffer.from('gigachad.learned-state.registry.v1\0' + canonical)));
  assert.equal(await codec.fingerprintDescriptors(first, options), await codec.fingerprintDescriptors(second, options));
  second.family.capacity = 33;
  assert.notEqual(await codec.fingerprintDescriptors(first, options), await codec.fingerprintDescriptors(second, options));
});

test('wire validity alone deliberately does not assert completeness of an unknown live catalog', async () => {
  const capture = fixture([]);
  const decoded = await codec.decode(await codec.encode(capture, options), options);
  assert.equal(decoded.evidence.tensorCount, 0);
  assert.equal(Object.hasOwn(decoded.evidence, 'coverageComplete'), false);
  assert.equal(Object.hasOwn(decoded.evidence, 'liveModelRestored'), false);
});

test('browser-like UMD loads without Node APIs or automatically installing worker listeners', () => {
  let listeners = 0;
  const context = vm.createContext({ TextEncoder, importScripts() {}, postMessage() {}, addEventListener() { listeners++; } });
  vm.runInContext(fs.readFileSync(require.resolve('../systems/alive-learned-state-codec.js'), 'utf8'), context);
  assert.equal(vm.runInContext('AliveLearnedStateCodec.SCHEMA', context), codec.SCHEMA);
  assert.equal(vm.runInContext('AliveLearnedStateCodec.float64(-0).hex', context), '0000000000000080');
  assert.equal(listeners, 0);
});

test('actual worker structured clone supplies isolated owned input without detaching caller buffers', async t => {
  const capture = fixture(), expected = await codec.encode(capture, options);
  const worker = new Worker(`const {parentPort}=require('node:worker_threads');
    const codec=require(${JSON.stringify(require.resolve('../systems/alive-learned-state-codec.js'))});
    parentPort.on('message',async capture=>{try{parentPort.postMessage({json:await codec.encode(capture)});}catch(error){parentPort.postMessage({error:error.message});}});`, { eval: true });
  t.after(() => worker.terminate());
  const response = new Promise((resolve, reject) => {
    worker.once('message', resolve); worker.once('error', reject);
  });
  worker.postMessage(capture);
  new Uint8Array(capture.tensors[0].bytes).fill(17); capture.snapshot.logicalTick++;
  const result = await response;
  assert.equal(result.error, undefined); assert.equal(result.json, expected);
  assert.equal(capture.tensors[0].bytes.byteLength, 8);
});
