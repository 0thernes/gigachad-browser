'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash, webcrypto } = require('node:crypto');
const evidence = require('./alive-replay-state-evidence.cjs');
const independentWire = require('./alive-learned-state-wire-evidence.cjs');
const hash = value => createHash('sha256').update(value).digest('hex');
const implementationDigest = '405f828d971811c28eea64ceb92ee3bb6056e1708b2a00e7c4f965b69e493a42';
const fingerprint = '31300355fd4f232bdd8860e4375f8e887a462da0d044a5bbbacee5ce50c8647e';
const componentId = 'trainable-hub-replay';
const snapshot = { creatureId: 'replay-evidence-fixture', policyId: 'policy-fixture', checkpointId: 'checkpoint-fixture',
  logicalTick: 91, modelEpoch: 4, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' };
const bytesOf = value => Buffer.from(value.buffer, value.byteOffset, value.byteLength);
const ordinal = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
function runtime(count = 3, cursor = count === 32 ? 7 : count) {
  const replayRing32 = [];
  for (let slot = 0; slot < count; slot++) {
    const record = {};
    for (const [name, length] of [['z16', 16], ['a8', 8], ['zNext16', 16]]) {
      const view = Float32Array.from({ length }, (_, i) => (slot * 3 + i - 20) / 16);
      new Uint32Array(view.buffer).set([0x80000000, 1, 0x80000001, 0x7f7fffff, 0xff7fffff]); record[name] = view;
    }
    record.surprise = [-0, Number.MIN_VALUE, -Number.MIN_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE, 0, 1 / 3][slot % 7];
    replayRing32.push(record);
  }
  return { trainableAlifeNeuralHub: { replayRing32, replayWritePtr: cursor } };
}
function scalar(number) { const bytes = Buffer.alloc(8); bytes.writeDoubleLE(number); return { $type: 'f64', hex: bytes.toString('hex') }; }
// Hand-built public wire, independent of production code AND catalog helper.
// Its explicit expected descriptor roster/data are never derived from a SUT.
function manualWire(source = runtime()) {
  const hub = source.trainableAlifeNeuralHub, count = hub.replayRing32.length;
  const tensorManifest = [], stateManifest = [
    { id: 'count', componentId, role: 'occupancy', valueType: 'i53', schemaVersion: 1, required: true },
    { id: 'cursor', componentId, role: 'insertion-cursor', valueType: 'i53', schemaVersion: 1, required: true },
    { id: 'indices', componentId, role: 'occupancy', valueType: 'array', schemaVersion: 1, required: true }
  ];
  const stateValues = { count: { $type: 'i53', value: count }, cursor: { $type: 'i53', value: hub.replayWritePtr },
    indices: { $type: 'array', items: Array.from({ length: count }, (_, value) => ({ $type: 'i53', value })) } };
  const parts = new Map();
  for (let slot = 0; slot < count; slot++) {
    for (const [field, length] of [['z16', 16], ['a8', 8], ['zNext16', 16]]) {
      const id = 'replay/' + slot + '/' + field;
      tensorManifest.push({ id, componentId, role: 'replay-memory', paths: [{ root: 'replay', keys: ['slots', String(slot), field] }],
        dtype: 'Float32Array', dimensions: [length], length, byteLength: length * 4, byteOrder: 'LE',
        backingGroup: id, backingOffset: 0, backingByteLength: length * 4 });
      parts.set(id, Buffer.from(bytesOf(hub.replayRing32[slot][field])));
    }
    const id = 'replay/' + slot + '/surprise';
    stateManifest.push({ id, componentId, role: 'replay-priority', valueType: 'f64', schemaVersion: 1, required: true });
    stateValues[id] = scalar(hub.replayRing32[slot].surprise);
  }
  tensorManifest.sort(ordinal); stateManifest.sort(ordinal);
  const record = { schema: 'gigachad.learned-state.v1',
    architecture: { registryVersion: 1, fingerprint, components: [{ id: componentId, schemaVersion: 1, implementationDigest, present: true }] },
    snapshot: { ...snapshot }, tensorManifest, tensorBlob: {}, stateManifest, stateValues, resumeRules: [] };
  reseal(record, parts); return record;
}
function reseal(record, parts) {
  if (!parts) {
    const original = Buffer.from(record.tensorBlob.data, 'base64');
    parts = new Map(record.tensorManifest.map(row => [row.id, Buffer.from(original.subarray(row.blobOffset, row.blobOffset + row.byteLength))]));
  }
  record.tensorManifest.sort(ordinal);
  let offset = 0;
  const blob = Buffer.concat(record.tensorManifest.map(row => {
    const bytes = parts.get(row.id); row.blobOffset = offset; row.sha256 = hash(bytes); offset += bytes.length; return bytes;
  }));
  record.tensorBlob = { encoding: 'base64', byteLength: blob.length, sha256: hash(blob), data: blob.toString('base64') };
}
function editBytes(record, mutate) {
  const bytes = Buffer.from(record.tensorBlob.data, 'base64'); mutate(bytes, record.tensorManifest);
  record.tensorBlob.data = bytes.toString('base64'); record.tensorBlob.sha256 = hash(bytes);
  for (const row of record.tensorManifest) row.sha256 = hash(bytes.subarray(row.blobOffset, row.blobOffset + row.byteLength));
}
const decode = record => evidence.decodeReplayStateEvidence(JSON.stringify(record));
const assess = (record, observation, options) => evidence.assessReplayStateEvidence(JSON.stringify(record), observation, options);
const reject = (record, code) => assert.throws(() => decode(record), error => !code || error.code === code);

test('independent static catalog is pinned and invariant across all occupancy counts', () => {
  for (let count = 0; count <= 32; count++) {
    const catalog = evidence.createExpectedReplayCatalog(count);
    assert.equal(catalog.architecture.fingerprint, fingerprint); assert.equal(catalog.architecture.components[0].implementationDigest, implementationDigest);
    assert.equal(catalog.tensors.length, count * 3); assert.equal(catalog.states.length, count + 3);
    assert.equal(independentWire.fingerprintDescriptorDefinition(catalog.descriptorDefinition), fingerprint);
  }
  for (const count of [undefined, -0, -1, 33, .1, NaN, Infinity, Number.MAX_SAFE_INTEGER]) assert.throws(() => evidence.createExpectedReplayCatalog(count));
});

test('independent empty/partial/full wire and direct raw observation compare all bits and occupied scalar state', () => {
  for (const count of [0, 1, 7, 31, 32]) for (const cursor of count === 32 ? [0, 7, 31] : [count]) {
    const h = runtime(count, cursor), record = manualWire(h), observation = evidence.captureReplayHydration(h), result = assess(record, observation, { expectedSnapshot: snapshot });
    assert.equal(observation.ok, true); assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.arraysChecked, count * 3); assert.equal(result.elementsChecked, count * 40);
    assert.equal(result.comparedBytes, count * 160); assert.equal(result.comparedStates, count + 3); assert.equal(result.snapshotMatched, true);
    const decoded = decode(record);
    assert.equal(decoded.count, count); assert.equal(decoded.cursor, cursor); assert.deepEqual(decoded.indices, Array.from({ length: count }, (_, i) => i));
    assert.equal(decoded.evidence.completeApplicationCatalog, false); assert.equal(decoded.evidence.durabilityVerified, false);
    assert.equal(decoded.evidence.restoreExecuted, false); assert.equal(decoded.evidence.liveEngineObserved, false);
    if (count) { assert.equal(decoded.entries[0].z16.readUInt32LE(0), 0x80000000); assert.equal(decoded.entries[0].z16.readUInt32LE(4), 1); assert(Object.is(decoded.entries[0].surprise, -0)); }
    assert.equal(JSON.stringify(result).includes('z16Hex'), false);
  }
});

test('serialized capture is self-contained and owns bytes before subsequent mutation/detach', () => {
  const context = vm.createContext({});
  vm.runInContext('var h=(' + runtime.toString() + ')(7); var observe=(' + evidence.captureReplayHydration.toString() + '); var result=observe(h);', context);
  const observation = JSON.parse(vm.runInContext('JSON.stringify(result)', context));
  assert.equal(assess(manualWire(runtime(7)), observation).ok, true);
  vm.runInContext('h.trainableAlifeNeuralHub.replayRing32[0].z16.fill(99); h.trainableAlifeNeuralHub.replayRing32[0].surprise=9;', context);
  assert.equal(assess(manualWire(runtime(7)), observation).ok, true);
  const h = runtime(1), captured = evidence.captureReplayHydration(h);
  structuredClone(h.trainableAlifeNeuralHub.replayRing32[0].z16.buffer, { transfer: [h.trainableAlifeNeuralHub.replayRing32[0].z16.buffer] });
  assert.equal(assess(manualWire(runtime(1)), captured).ok, true); assert.equal(evidence.captureReplayHydration(h).ok, false);
});

test('raw capture rejects holes, incorrect cursor, extra fields, duplicate records and repeated backing aliases', () => {
  const mutations = [
    h => { delete h.replayRing32[1]; }, h => { h.replayWritePtr = 0; }, h => { h.replayWritePtr = -0; },
    h => { h.replayRing32.length = 33; }, h => { h.replayRing32.extra = 1; }, h => { h.replayRing32[0].extra = 1; },
    h => { h.replayRing32[1] = h.replayRing32[0]; }, h => { h.replayRing32[0].zNext16 = h.replayRing32[0].z16; },
    h => { h.replayRing32[1].z16 = new Float32Array(h.replayRing32[0].z16.buffer); },
    h => { h.replayRing32[0].z16 = new Float32Array(new ArrayBuffer(68), 4, 16); },
    h => { h.replayRing32[0].a8 = new Uint32Array(8); }, h => { h.replayRing32[0].a8 = new Float32Array(9); },
    h => { h.replayRing32[0].a8.toJSON = () => []; }, h => { h.replayRing32[0][Symbol('hidden')] = 1; },
    h => { Object.setPrototypeOf(h.replayRing32[0], {}); }, h => { Object.setPrototypeOf(h.replayRing32, Object.create(Array.prototype)); },
    h => { Object.setPrototypeOf(h.replayRing32[0].z16, Object.create(Float32Array.prototype)); },
    h => { Object.defineProperty(h, 'replayWritePtr', { writable: false }); }
  ];
  for (const mutate of mutations) { const source = runtime(); mutate(source.trainableAlifeNeuralHub); assert.equal(evidence.captureReplayHydration(source).ok, false, mutate.toString()); }
});

test('raw capture rejects shared/resizable/detached/nonfinite arrays and nonfinite scalar priorities', () => {
  const variants = [new Float32Array(new SharedArrayBuffer(64)), new Float32Array(new ArrayBuffer(64, { maxByteLength: 128 }))];
  const detached = new Float32Array(16); structuredClone(detached.buffer, { transfer: [detached.buffer] }); variants.push(detached);
  for (const word of [0x7fc00000, 0x7f800000, 0xff800000]) { const view = new Float32Array(16); new Uint32Array(view.buffer)[0] = word; variants.push(view); }
  for (const view of variants) { const h = runtime(); h.trainableAlifeNeuralHub.replayRing32[0].z16 = view; assert.equal(evidence.captureReplayHydration(h).ok, false); }
  for (const surprise of [NaN, Infinity, -Infinity, '1', 1n]) { const h = runtime(); h.trainableAlifeNeuralHub.replayRing32[0].surprise = surprise; assert.equal(evidence.captureReplayHydration(h).ok, false); }
});

test('direct hub tensor aliases are rejected without invoking hub or replay accessors', () => {
  for (const makeView of [view => view, view => new Uint8Array(view.buffer), view => new DataView(view.buffer)]) {
    const source = runtime(); source.trainableAlifeNeuralHub.latent16 = makeView(source.trainableAlifeNeuralHub.replayRing32[0].z16);
    assert.equal(evidence.captureReplayHydration(source).code, 'REPLAY_ALIAS');
  }
  let calls = 0;
  const source = runtime(); Object.defineProperty(source.trainableAlifeNeuralHub, 'unrelated', { get() { calls++; throw new Error('must not read'); } });
  assert.equal(evidence.captureReplayHydration(source).ok, true); assert.equal(calls, 0);
  for (const target of [h => [h, 'replayWritePtr'], h => [h.replayRing32, '0'], h => [h.replayRing32[0], 'z16'], h => [h.replayRing32[0], 'surprise']]) {
    const h = runtime(), [object, key] = target(h.trainableAlifeNeuralHub);
    Object.defineProperty(object, key, { get() { calls++; return 1; } });
    assert.equal(evidence.captureReplayHydration(h).ok, false); assert.equal(calls, 0);
  }
  const huge = runtime(0); for (let i = 0; i < 4095; i++) huge.trainableAlifeNeuralHub['x' + i] = 0;
  assert.equal(evidence.captureReplayHydration(huge).code, 'REPLAY_BOUND');
});

test('resealed one-bit changes and signed-zero scalar changes are mismatches, not checksum failures', () => {
  const h = runtime(7), observation = evidence.captureReplayHydration(h), changed = manualWire(h);
  editBytes(changed, bytes => { bytes[0] ^= 1; });
  assert.equal(decode(changed).evidence.wireValid, true);
  const result = assess(changed, observation);
  assert.equal(result.ok, false); assert.equal(result.elementsDifferent, 1); assert.equal(result.differences[0].kind, 'value-bits');
  const priority = manualWire(h); priority.stateValues['replay/0/surprise'] = scalar(0);
  assert.equal(assess(priority, observation).differences[0].kind, 'scalar-bits');
  const full = runtime(32), moved = manualWire(full); moved.stateValues.cursor.value = 8;
  assert.equal(assess(moved, evidence.captureReplayHydration(full)).differences[0].id, 'cursor');
  assert.equal(assess(manualWire(runtime(2)), observation).differences[0].id, 'count');
});

test('all seven snapshot fields must match independently supplied same-capture identity', () => {
  const h = runtime(), record = manualWire(h), observed = evidence.captureReplayHydration(h);
  for (const key of Object.keys(snapshot)) {
    const expectedSnapshot = { ...snapshot, [key]: typeof snapshot[key] === 'number' ? snapshot[key] + 1 : snapshot[key] + '-other' };
    const result = assess(record, observed, { expectedSnapshot });
    assert.equal(result.ok, false); assert.equal(result.snapshotMatched, false); assert.equal(result.differences[0].id, 'snapshot.' + key);
  }
  const malicious = { ...snapshot }; let calls = 0;
  Object.defineProperty(malicious, 'logicalTick', { get() { calls++; return 91; }, enumerable: true });
  assert.equal(assess(record, observed, { expectedSnapshot: malicious }).status, 'invalid-evidence'); assert.equal(calls, 0);
});

test('validly rehashed nonfinite arrays and finite-policy-violating priority tags are rejected', () => {
  for (const word of [0x7fc00000, 0x7f800000, 0xff800000]) {
    const record = manualWire(); editBytes(record, bytes => bytes.writeUInt32LE(word, 4));
    assert.equal(independentWire.decodeLearnedStateWire(JSON.stringify(record)).evidence.wireValid, true); reject(record, 'REPLAY_NONFINITE');
  }
  for (const hex of ['000000000000f07f', '000000000000f0ff', '010000000000f87f']) { const record = manualWire(); record.stateValues['replay/0/surprise'].hex = hex; reject(record); }
});

test('occupied slots must be dense/exact with integer tags, correct cursor and no inactive padding', () => {
  const mutations = [
    r => { r.stateValues.count.value = 33; }, r => { r.stateValues.count.value = -1; }, r => { r.stateValues.cursor.value = 0; },
    r => { r.stateValues.cursor.value = 32; }, r => { r.stateValues.indices.items.reverse(); },
    r => { r.stateValues.indices.items[1].value = 0; }, r => { r.stateValues.indices.items.pop(); },
    r => { r.stateValues.indices.items[0] = scalar(0); }, r => { delete r.stateValues['replay/0/surprise']; },
    r => { r.stateManifest.reverse(); }, r => { r.stateValues.count = scalar(3); },
    r => { r.stateValues['replay/31/surprise'] = scalar(0); r.stateManifest.push({ id: 'replay/31/surprise', componentId, role: 'replay-priority', valueType: 'f64', schemaVersion: 1, required: true }); }
  ];
  for (const change of mutations) { const record = manualWire(); change(record); reject(record); }
  const missing = manualWire(); missing.tensorManifest.splice(1, 1); reseal(missing); reject(missing, 'CATALOG_TENSORS');
  const padding = manualWire(), bytes = Buffer.from(padding.tensorBlob.data, 'base64');
  const parts = new Map(padding.tensorManifest.map(row => [row.id, bytes.subarray(row.blobOffset, row.blobOffset + row.byteLength)]));
  const row = { ...padding.tensorManifest[0], id: 'replay/31/a8', paths: [{ root: 'replay', keys: ['slots', '31', 'a8'] }], backingGroup: 'replay/31/a8' };
  padding.tensorManifest.push(row); parts.set(row.id, Buffer.alloc(32)); reseal(padding, parts); reject(padding, 'CATALOG_TENSORS');
});

test('re-fingerprinted architecture, family bound and policy substitutions cannot replace the pinned oracle', () => {
  for (const change of [d => { d.families[0].capacity = 64; }, d => { d.families[0].tensors[0].policy.finite = false; },
    d => { d.components[0].implementationDigest = hash('different-implementation'); }, d => { d.families[0].slotPath.keys = ['other']; }]) {
    const record = manualWire(), definition = evidence.createExpectedReplayCatalog(3).descriptorDefinition;
    change(definition); record.architecture.fingerprint = independentWire.fingerprintDescriptorDefinition(definition);
    record.architecture.components = definition.components;
    assert.equal(independentWire.decodeLearnedStateWire(JSON.stringify(record)).evidence.wireValid, true); reject(record, 'CATALOG_FINGERPRINT');
  }
});

test('same-fingerprint descriptors cannot introduce aliases, wrong dtype, shape, backing or undeclared state', () => {
  for (const change of [r => { r.tensorManifest[0].dtype = 'Int32Array'; }, r => { r.tensorManifest[0].dimensions = [2, 4]; },
    r => { r.tensorManifest[0].backingByteLength = 64; }, r => { r.tensorManifest[0].paths[0].keys[0] = 'live'; },
    r => { r.tensorManifest[0].paths.push({ root: 'hub', keys: ['latent16'] }); },
    r => { r.stateManifest[0].role = 'unknown'; }, r => { r.stateManifest[0].required = false; },
    r => { r.architecture.components[0].present = false; }, r => { r.resumeRules.push({ id: 'reset-replay', action: 'reset', reason: 'bad', version: 1 }); }]) {
    const record = manualWire(); change(record); reject(record);
  }
});

test('strict wire reader rejects duplicate JSON keys, noncompact/oversized inputs and bad hashes/base64/ranges', () => {
  const json = JSON.stringify(manualWire());
  for (const text of [json.replace('"schema":', '"schema":"discarded","schema":'), ' ' + json,
    json.replace('"value":3', '"value":-0'), ' '.repeat(32 * 1024 * 1024 + 1)]) assert.throws(() => evidence.decodeReplayStateEvidence(text));
  for (const mutate of [r => { r.tensorBlob.sha256 = '0'.repeat(64); }, r => { r.tensorManifest[0].sha256 = '0'.repeat(64); },
    r => { r.tensorBlob.data += '='; }, r => { r.tensorManifest[0].blobOffset = 4; }, r => { r.tensorBlob.byteLength++; },
    r => { r.tensorManifest.push(r.tensorManifest[0]); }]) { const record = manualWire(); mutate(record); reject(record); }
});

test('observation validation rejects failure, accessor, malformed hex and omitted or reordered evidence without callbacks', () => {
  const record = manualWire(), good = evidence.captureReplayHydration(runtime());
  const changes = [o => { o.ok = false; }, o => { o.byteOrder = 'BE'; }, o => { o.tensorBytes++; },
    o => { o.entries.reverse(); }, o => { o.entries.length--; }, o => { delete o.entries[0]; },
    o => { o.entries[0].z16Hex = 'f'.repeat(128); }, o => { o.entries[0].surpriseHex = '000000000000f07f'; },
    o => { o.entries[0].a8Hex += '00'; }, o => { o.entries[0].slot = -0; }, o => { o.extra = 1; }];
  for (const change of changes) { const copy = structuredClone(good); change(copy); assert.equal(assess(record, copy).status, 'invalid-evidence'); }
  let calls = 0; const accessor = structuredClone(good);
  Object.defineProperty(accessor.entries[0], 'surpriseHex', { get() { calls++; return '0000000000000000'; }, enumerable: true });
  assert.equal(assess(record, accessor).status, 'invalid-evidence'); assert.equal(calls, 0);
  assert.equal(assess(record, { schema: good.schema, ok: false, code: 'x', reason: 'first capture failed' }).code, 'REPLAY_CAPTURE_FAILED');
});

test('decoded tensors are owned copies and evidence module imports no production module', () => {
  const record = manualWire(), a = decode(record), b = decode(record);
  a.entries[0].z16.fill(0); a.snapshot.logicalTick = 0;
  assert.notDeepEqual(a.entries[0].z16, b.entries[0].z16); assert.equal(b.snapshot.logicalTick, 91);
  const imports = [...fs.readFileSync(path.join(__dirname, 'alive-replay-state-evidence.cjs'), 'utf8').matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(match => match[1]);
  assert.deepEqual(imports, ['node:crypto', './alive-learned-state-wire-evidence.cjs']);
});

test('production capture/encoding as generation-only SUT agrees with independent manual oracle at all bounds', async () => {
  const codec = require('../systems/alive-learned-state-codec.js'), registry = require('../systems/alive-learned-state-registry.js');
  const production = await require('../systems/alive-replay-state.js').create({ codec, registry, crypto: webcrypto });
  assert.deepEqual(production.architecture, evidence.createExpectedReplayCatalog(0).architecture);
  for (const count of [0, 1, 31, 32]) {
    const h = runtime(count), observed = evidence.captureReplayHydration(h);
    const json = await codec.encode(production.capture(h.trainableAlifeNeuralHub, snapshot, { generation: 4 }), { crypto: webcrypto });
    const result = evidence.assessReplayStateEvidence(json, observed, { expectedSnapshot: snapshot });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.deepEqual(decode(JSON.parse(json)).entries, decode(manualWire(h)).entries);
  }
});
