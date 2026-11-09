'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash, webcrypto } = require('node:crypto');
const evidence = require('./alive-hub-state-evidence.cjs');
const independentWire = require('./alive-learned-state-wire-evidence.cjs');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const componentId = 'trainable-hub-local', fingerprint = 'e8710c0a39c9eda69205bec2e90a87e2d1021cb85cf1aa5ed549188a0046d5e3';
const implementationDigest = '5ddc469e68569a9ae3a0d9e5777cbb942f71929813ad528e74323d4529e2d5db';
const snapshot = { creatureId: 'hub-evidence-fixture', policyId: 'policy-fixture', checkpointId: 'checkpoint-fixture',
  logicalTick: 37, modelEpoch: 3, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' };
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const begin = source.indexOf('        const mixedArenaBuffer = new ArrayBuffer(8192);'), end = source.indexOf('\n        };', begin) + 11;
assert(begin >= 0 && end > begin);
// Only the inert allocation literal executes. No runtime/model constructor,
// browser, worker, importer, production capture or registry is executed here.
const allocation = source.slice(begin, end).replace('this.trainableAlifeNeuralHub =', 'return');
function fixture() {
  const hub = new Function(allocation)();
  const tail = new Uint8Array(hub.mixedArenaBuffer, 4928, 3264);
  for (let i = 0; i < tail.length; i++) tail[i] = (i * 19 + 37) & 255;
  new Uint32Array(hub.W_perc_enc.buffer).set([0x80000000, 1, 0x80000001, 0x7f7fffff, 0xff7fffff]);
  new DataView(hub.mixedArenaBuffer).setBigUint64(0, 0x8000000000000000n, true);
  new DataView(hub.mixedArenaBuffer).setBigUint64(8, 1n, true);
  hub.u64SpikeTrainLanes8.set([0n, 0xffffffffffffffffn, 0x8000000000000000n]);
  hub.fp16PersistentWeights256.set([0x7c00, 0xfc00, 0x7e00, 0xffff, 1]); // Opaque native words, including half-NaN-looking patterns.
  hub.b158TernaryMorphism256.set([-128, 127, -1, 0, 1]); // Native Int8; name does not impose a ternary policy.
  hub.b_disc2 = -0;
  return { trainableAlifeNeuralHub: hub };
}
const ordinal = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const counterIds = new Set(['ideasSynthesizedCount', 'recursiveMorphismsCount', 'dreamConsolidationSteps', 'totalBackpropStepsTrained', 'persistentWeightCheckpointsSaved']);
const matrixDimensions = { f64InterIntraCoupling16x16: [16, 16], W_perc_enc: [16, 16], W_perc_dec: [16, 16], W_dyn1: [16, 24],
  W_dyn2: [16, 16], W_diff1: [16, 17], W_diff2: [16, 16], W_gen1: [16, 16], W_gen2: [16, 16], W_disc1: [16, 16],
  visionDomGrid8x8: [8, 8], visitedGrid8x8: [8, 8], W_icm_inv: [8, 32], W_robot_actor: [2, 16] };
function f64(value) { const bytes = Buffer.alloc(8); bytes.writeDoubleLE(value); return { $type: 'f64', hex: bytes.toString('hex') }; }
// Independent hand-built wire: roster comes from the earlier source allocation
// plus explicit projection semantics above, not production exports or catalog
// helper output. Every value is taken from the original source backing.
function manualWire(runtime = fixture()) {
  const hub = runtime.trainableAlifeNeuralHub, tensorManifest = [], parts = new Map(), stateManifest = [], stateValues = {};
  for (const [id, value] of Object.entries(hub)) {
    if (id === 'mixedArenaBuffer' || id === 'replayRing32' || id === 'replayWritePtr') continue;
    if (ArrayBuffer.isView(value)) {
      const arena = value.buffer === hub.mixedArenaBuffer;
      tensorManifest.push({ id, componentId, role: arena ? 'mixed-arena-view' : 'local-hub-view', paths: [{ root: 'hub', keys: [id] }],
        dtype: value.constructor.name, dimensions: matrixDimensions[id] || [value.length], length: value.length, byteLength: value.byteLength,
        byteOrder: 'LE', backingGroup: arena ? 'mixedArena' : id, backingOffset: value.byteOffset, backingByteLength: value.buffer.byteLength });
      parts.set(id, Buffer.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)));
    } else {
      const integer = counterIds.has(id) || id === 'samBestSectorIdx';
      const valueType = Array.isArray(value) ? 'array' : typeof value === 'string' ? 'string' : integer ? 'i53' : 'f64';
      stateManifest.push({ id, componentId, role: Array.isArray(value) ? 'constant-names' : counterIds.has(id) ? 'learning-counter' : 'local-hub-state',
        valueType, schemaVersion: 1, required: true });
      stateValues[id] = valueType === 'array' ? { $type: 'array', items: value.slice() } : valueType === 'string' ? value : integer ? { $type: 'i53', value } : f64(value);
    }
  }
  tensorManifest.push({ id: 'reservedArenaTail', componentId, role: 'reserved-arena-bytes', paths: [{ root: 'arena', keys: ['reservedTail'] }],
    dtype: 'Uint8Array', dimensions: [3264], length: 3264, byteLength: 3264, byteOrder: 'LE', backingGroup: 'mixedArena', backingOffset: 4928, backingByteLength: 8192 });
  parts.set('reservedArenaTail', Buffer.from(new Uint8Array(hub.mixedArenaBuffer, 4928, 3264)));
  stateManifest.sort(ordinal);
  const record = { schema: 'gigachad.learned-state.v1', architecture: { registryVersion: 1, fingerprint,
    components: [{ id: componentId, schemaVersion: 1, implementationDigest, present: true }] }, snapshot: { ...snapshot },
    tensorManifest, tensorBlob: {}, stateManifest, stateValues, resumeRules: [] };
  reseal(record, parts); return record;
}
function reseal(record, parts) {
  if (!parts) { const old = Buffer.from(record.tensorBlob.data, 'base64'); parts = new Map(record.tensorManifest.map(row => [row.id, old.subarray(row.blobOffset, row.blobOffset + row.byteLength)])); }
  record.tensorManifest.sort(ordinal); let offset = 0;
  const bytes = Buffer.concat(record.tensorManifest.map(row => { const part = parts.get(row.id); row.blobOffset = offset; offset += part.length; row.sha256 = hash(part); return part; }));
  record.tensorBlob = { encoding: 'base64', byteLength: bytes.length, sha256: hash(bytes), data: bytes.toString('base64') };
}
function mutateBytes(record, id, mutate) {
  const bytes = Buffer.from(record.tensorBlob.data, 'base64'), row = record.tensorManifest.find(row => row.id === id);
  mutate(bytes.subarray(row.blobOffset, row.blobOffset + row.byteLength));
  record.tensorBlob.data = bytes.toString('base64'); record.tensorBlob.sha256 = hash(bytes);
  for (const tensor of record.tensorManifest) tensor.sha256 = hash(bytes.subarray(tensor.blobOffset, tensor.blobOffset + tensor.byteLength));
}
const decode = record => evidence.decodeHubStateEvidence(JSON.stringify(record));
const assess = (record, observation, options) => evidence.assessHubStateEvidence(JSON.stringify(record), observation, options);
const observe = runtime => evidence.captureHubHydration(runtime);
const rejected = (record, code) => assert.throws(() => decode(record), error => !code || error.code === code);

test('independently transcribed static catalog matches source roster and pinned interpretation', () => {
  const catalog = evidence.createExpectedHubCatalog(), manual = manualWire();
  assert.equal(catalog.architecture.fingerprint, fingerprint); assert.equal(catalog.architecture.components[0].implementationDigest, implementationDigest);
  assert.equal(catalog.tensors.length, 59); assert.equal(catalog.states.length, 44);
  assert.deepEqual(manual.tensorManifest.map(({ blobOffset, sha256, ...row }) => row), catalog.tensors);
  assert.deepEqual(manual.stateManifest, catalog.states);
  assert.equal(catalog.tensors.reduce((sum, row) => sum + row.byteLength, 0), 21368);
  assert.equal(independentWire.fingerprintDescriptorDefinition(catalog.descriptorDefinition), fingerprint);
});

test('direct source capture and manual wire preserve59tensors/58nativeviews/46buffers/44states including full arena', () => {
  const runtime = fixture(), raw = observe(runtime), result = assess(manualWire(runtime), raw, { expectedSnapshot: snapshot });
  assert.equal(raw.ok, true); assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(raw.views.length, 58); assert.equal(raw.backings.length, 46); assert.equal(Object.keys(raw.states).length, 44);
  assert.equal(result.arraysChecked, 59); assert.equal(result.actualNativeViews, 58); assert.equal(result.comparedBytes, 21368); assert.equal(result.comparedStates, 44);
  assert.equal(result.elementsChecked, 7814); assert.equal(result.elementsDifferent, 0); assert.equal(result.snapshotMatched, true);
  const decoded = decode(manualWire(runtime));
  assert.equal(decoded.backings.get('mixedArenaBuffer').equals(Buffer.from(runtime.trainableAlifeNeuralHub.mixedArenaBuffer)), true);
  assert.equal(decoded.evidence.reservedArenaSHA256, hash(Buffer.from(runtime.trainableAlifeNeuralHub.mixedArenaBuffer).subarray(4928)));
  for (const field of ['completeApplicationCatalog', 'liveEngineObserved', 'restoreExecuted', 'durabilityVerified']) assert.equal(decoded.evidence[field], false);
  assert.equal(JSON.stringify(result).includes('"hex"'), false);
});

test('Float32/Float64 signedzero/subnormals, BigUint64 extremes and opaque Int8/Uint16 words remain exact', () => {
  const record = manualWire(), decoded = decode(record), arena = decoded.backings.get('mixedArenaBuffer');
  assert.equal(decoded.backings.get('W_perc_enc').readUInt32LE(0), 0x80000000); assert.equal(decoded.backings.get('W_perc_enc').readUInt32LE(4), 1);
  assert.equal(arena.readBigUInt64LE(0), 0x8000000000000000n); assert.equal(arena.readBigUInt64LE(8), 1n);
  assert.equal(arena.readBigUInt64LE(1800), 0xffffffffffffffffn); assert.equal(arena.readInt8(1856), -128);
  assert.equal(arena.readUInt16LE(2116), 0x7e00); assert.equal(decoded.states.b_disc2.hex, '0000000000000080');
});

test('serializable observer has no runtime dependencies and owns all backing/scalar/name bytes before later mutation', () => {
  const context = vm.createContext({});
  vm.runInContext('var runtime={trainableAlifeNeuralHub:(function(){' + allocation + '})()};var before=(' + evidence.captureHubHydration.toString() + ')(runtime);', context);
  const before = JSON.parse(vm.runInContext('JSON.stringify(before)', context));
  assert.equal(before.ok, true); assert.equal(evidence.compareHubHydration(before, before).ok, true);
  const runtime = fixture(), raw = observe(runtime), record = manualWire(runtime);
  new Uint8Array(runtime.trainableAlifeNeuralHub.mixedArenaBuffer).fill(0); runtime.trainableAlifeNeuralHub.W_perc_enc.fill(3);
  runtime.trainableAlifeNeuralHub.tensorBackendMode = 'changed'; runtime.trainableAlifeNeuralHub.facultyNames16[0] = 'changed';
  assert.equal(assess(record, raw).ok, true);
  structuredClone(runtime.trainableAlifeNeuralHub.W_perc_enc.buffer, { transfer: [runtime.trainableAlifeNeuralHub.W_perc_enc.buffer] });
  assert.equal(assess(record, raw).ok, true);
});

test('unknown fields, broken aliases, wrong shape/offset/prototype and implicit backing replacements fail raw capture', () => {
  const changes = [h => { h.extra = 1; }, h => { delete h.b_aware; }, h => { h[Symbol('extra')] = 1; },
    h => { h.f64TrajectoryCurr16 = new Float64Array(h.f64TrajectoryCurr16); }, h => { h.mixedArenaBuffer = h.mixedArenaBuffer.slice(0); },
    h => { h.zPrev16 = h.zPerc16; }, h => { h.zPrev16 = new Float32Array(h.zPerc16.buffer); },
    h => { h.W_perc_enc = new Float32Array(new ArrayBuffer(1028), 4, 256); }, h => { h.W_perc_enc = new Float64Array(256); },
    h => { h.f64TrajectoryCurr16 = new Float64Array(h.mixedArenaBuffer, 128, 16); }, h => { h.W_perc_enc.extra = true; },
    h => { h.mixedArenaBuffer.extra = true; }, h => { Object.setPrototypeOf(h, {}); }, h => { Object.setPrototypeOf(h.zPerc16, Object.create(Float32Array.prototype)); },
    h => { h.facultyNames16.reverse(); }, h => { delete h.moeExpertNames8[0]; }];
  for (const change of changes) { const runtime = fixture(); change(runtime.trainableAlifeNeuralHub); assert.equal(observe(runtime).ok, false, change.toString()); }
});

test('own data and writable state requirements reject getters without invoking them, including separately owned replay slots', () => {
  let calls = 0;
  for (const id of ['mixedArenaBuffer', 'W_perc_enc', 'b_aware', 'replayRing32', 'replayWritePtr', 'facultyNames16']) {
    const runtime = fixture(); Object.defineProperty(runtime.trainableAlifeNeuralHub, id, { get() { calls++; throw new Error('never'); } });
    assert.equal(observe(runtime).ok, false); assert.equal(calls, 0);
  }
  for (const id of ['b_aware', 'totalBackpropStepsTrained', 'tensorBackendMode', 'facultyNames16']) {
    const runtime = fixture(); Object.defineProperty(runtime.trainableAlifeNeuralHub, id, { writable: false }); assert.equal(observe(runtime).ok, false);
  }
  const runtime = fixture(); Object.defineProperty(runtime.trainableAlifeNeuralHub.facultyNames16, '0', { get() { calls++; return 'fake'; } });
  assert.equal(observe(runtime).ok, false); assert.equal(calls, 0);
});

test('shared/resizable/detached buffers are rejected on arena and standalone paths', () => {
  for (const buffer of [new SharedArrayBuffer(8192), new ArrayBuffer(8192, { maxByteLength: 16384 })]) {
    const runtime = fixture(); runtime.trainableAlifeNeuralHub.mixedArenaBuffer = buffer; assert.equal(observe(runtime).ok, false);
  }
  for (const buffer of [new SharedArrayBuffer(1024), new ArrayBuffer(1024, { maxByteLength: 2048 })]) {
    const runtime = fixture(); runtime.trainableAlifeNeuralHub.W_perc_enc = new Float32Array(buffer); assert.equal(observe(runtime).ok, false);
  }
  for (const id of ['mixedArenaBuffer', 'W_perc_enc']) {
    const runtime = fixture(), buffer = id === 'mixedArenaBuffer' ? runtime.trainableAlifeNeuralHub[id] : runtime.trainableAlifeNeuralHub[id].buffer;
    structuredClone(buffer, { transfer: [buffer] }); assert.equal(observe(runtime).ok, false);
  }
});

test('all six integer policies and exact name/string contracts reject malformed raw and saved states', () => {
  for (const id of [...counterIds, 'samBestSectorIdx']) {
    for (const bad of [-1, -0, .5, Number.MAX_SAFE_INTEGER + 1, id === 'samBestSectorIdx' ? 16 : Infinity]) {
      const runtime = fixture(); runtime.trainableAlifeNeuralHub[id] = bad; assert.equal(observe(runtime).ok, false);
      const record = manualWire(); record.stateValues[id] = { $type: 'i53', value: bad };
      if (Object.is(bad, -0)) {
        const encoded = JSON.stringify(record).replace('"' + id + '":{"$type":"i53","value":0}', '"' + id + '":{"$type":"i53","value":-0}');
        assert.throws(() => evidence.decodeHubStateEvidence(encoded)); // JSON.stringify itself normalizes -0 to +0.
      } else rejected(record);
    }
    const runtime = fixture(); runtime.trainableAlifeNeuralHub[id] = id === 'samBestSectorIdx' ? 15 : Number.MAX_SAFE_INTEGER;
    assert.equal(assess(manualWire(runtime), observe(runtime)).ok, true);
    const wrongTag = manualWire(); wrongTag.stateValues[id] = f64(1); rejected(wrongTag);
  }
  for (const mutate of [r => { r.stateValues.tensorBackendMode = 'x'.repeat(2049); },
    r => { r.stateValues.facultyNames16.items[0] = 'changed'; }, r => { r.stateValues.facultyNames16.items.reverse(); },
    r => { r.stateValues.moeExpertNames8.items.push('extra'); }]) { const record = manualWire(); mutate(record); rejected(record); }
});

test('source-proved domains reject validly resealed negative moments/MSE and out-of-range diffusion schedules', () => {
  for (const [id, value] of [['f64AdamSecondMoment64', -Number.MIN_VALUE], ['diffusionAlphaBar8', -.1], ['diffusionAlphaBar8', 1.1]]) {
    const runtime = fixture(); runtime.trainableAlifeNeuralHub[id][0] = value; assert.equal(observe(runtime).code, 'HUB_DOMAIN');
    const record = manualWire(); mutateBytes(record, id, bytes => id.startsWith('f64') ? bytes.writeDoubleLE(value) : bytes.writeFloatLE(value));
    assert.equal(independentWire.decodeLearnedStateWire(JSON.stringify(record)).evidence.wireValid, true); rejected(record, 'HUB_DOMAIN');
  }
  for (const id of ['perceptionLossMse', 'worldDynamicsLossMse', 'diffusionScoreLossMse', 'inversePhysicsLossMse']) {
    const runtime = fixture(); runtime.trainableAlifeNeuralHub[id] = -Number.MIN_VALUE; assert.equal(observe(runtime).code, 'HUB_DOMAIN');
    const record = manualWire(); record.stateValues[id] = f64(-Number.MIN_VALUE); rejected(record, 'HUB_DOMAIN');
    const raw = observe(fixture()); raw.states[id] = f64(-Number.MIN_VALUE); assert.equal(evidence.compareHubHydration(raw, raw).ok, false);
    runtime.trainableAlifeNeuralHub[id] = -0; assert.equal(assess(manualWire(runtime), observe(runtime)).ok, true);
  }
});

test('nonfinite floating arrays and scalars fail even after every checksum is recomputed', () => {
  for (const id of ['W_perc_enc', 'f64TrajectoryCurr16']) for (const value of [NaN, Infinity, -Infinity]) {
    const runtime = fixture(); runtime.trainableAlifeNeuralHub[id][0] = value; assert.equal(observe(runtime).ok, false);
    const record = manualWire(); mutateBytes(record, id, bytes => id.startsWith('f64') ? bytes.writeDoubleLE(value) : bytes.writeFloatLE(value));
    assert.equal(independentWire.decodeLearnedStateWire(JSON.stringify(record)).evidence.wireValid, true); rejected(record, 'HUB_NONFINITE');
  }
  for (const value of [NaN, Infinity, -Infinity]) { const record = manualWire(); record.stateValues.b_aware = f64(value); rejected(record); }
});

test('one-bit changes are detected in every one of59wire ranges, including the reserved tail', () => {
  const runtime = fixture(), raw = observe(runtime), baseline = manualWire(runtime);
  for (const descriptor of baseline.tensorManifest) {
    const record = structuredClone(baseline); mutateBytes(record, descriptor.id, bytes => { bytes[0] ^= 1; });
    const result = assess(record, raw);
    assert.equal(result.status, 'hub-mismatch', descriptor.id + ': ' + JSON.stringify(result));
    assert.equal(result.elementsDifferent, 1); assert.equal(result.changedBackingBytes, 1);
    assert.equal(result.comparisons.find(row => !row.ok).id, descriptor.id);
  }
});

test('ordinary state changes and signedzero compare exactly while two-observation evolution excludes value dumps', () => {
  const runtime = fixture(), before = observe(runtime);
  runtime.trainableAlifeNeuralHub.totalBackpropStepsTrained++;
  const counter = evidence.compareHubHydration(before, observe(runtime));
  assert.equal(counter.ok, true); assert.equal(counter.equal, false); assert.equal(counter.changedBackingBytes, 0);
  assert.deepEqual(counter.changedStateIds, ['totalBackpropStepsTrained']);
  new Uint8Array(runtime.trainableAlifeNeuralHub.mixedArenaBuffer)[8191] ^= 1;
  runtime.trainableAlifeNeuralHub.b_disc2 = 0; runtime.trainableAlifeNeuralHub.reasoningVerdict = 'updated';
  const changed = evidence.compareHubHydration(before, observe(runtime));
  assert.equal(changed.ok, true); assert.equal(changed.changedBackingBytes, 1); assert.deepEqual(changed.changedBackingIds, ['mixedArenaBuffer']);
  assert(changed.changedStateIds.includes('b_disc2')); assert(changed.changedStateIds.includes('reasoningVerdict')); assert.equal(JSON.stringify(changed).includes('"hex"'), false);
});

test('same-capture identity matches all seven fields independently', () => {
  const runtime = fixture(), record = manualWire(runtime), raw = observe(runtime);
  for (const id of Object.keys(snapshot)) {
    const expectedSnapshot = { ...snapshot, [id]: typeof snapshot[id] === 'number' ? snapshot[id] + 1 : snapshot[id] + '-different' };
    const result = assess(record, raw, { expectedSnapshot }); assert.equal(result.ok, false); assert.equal(result.snapshotMatched, false);
    assert.equal(result.differences[0].id, 'snapshot.' + id);
  }
});

test('re-fingerprinted architecture, domain policy and backing substitutions cannot replace the external catalog', () => {
  for (const mutate of [d => { d.tensors.find(row => row.id === 'diffusionAlphaBar8').policy.max = 2; },
    d => { d.tensors.find(row => row.id === 'reservedArenaTail').backingOffset = 4927; },
    d => { d.components[0].implementationDigest = hash('other'); }, d => { d.states.find(row => row.id === 'perceptionLossMse').schema.min = -1; }]) {
    const record = manualWire(), definition = evidence.createExpectedHubCatalog().descriptorDefinition; mutate(definition);
    record.architecture.fingerprint = independentWire.fingerprintDescriptorDefinition(definition); record.architecture.components = definition.components;
    assert.equal(independentWire.decodeLearnedStateWire(JSON.stringify(record)).evidence.wireValid, true); rejected(record, 'CATALOG_FINGERPRINT');
  }
});

test('roster/path/alias/backing/dtype/shape/resume substitutions and missing reserved bytes fail closed', () => {
  for (const mutate of [r => { r.tensorManifest[0].paths.push({ root: 'hub', keys: ['inventedAlias'] }); },
    r => { r.tensorManifest[0].dtype = 'Int32Array'; }, r => { r.tensorManifest[0].dimensions = [4, 4]; },
    r => { r.tensorManifest[0].backingByteLength += 4; }, r => { r.tensorManifest[0].paths[0].root = 'other'; },
    r => { r.stateManifest.reverse(); }, r => { r.stateManifest[0].required = false; },
    r => { r.resumeRules.push({ id: 'reset', action: 'reset', reason: 'invalid', version: 1 }); }]) { const record = manualWire(); mutate(record); rejected(record); }
  const missing = manualWire(); missing.tensorManifest = missing.tensorManifest.filter(row => row.id !== 'reservedArenaTail'); reseal(missing); rejected(missing, 'CATALOG_TENSORS');
  const extra = manualWire(); extra.stateManifest.push({ id: 'replayWritePtr', componentId, role: 'other', valueType: 'i53', schemaVersion: 1, required: true }); extra.stateValues.replayWritePtr = { $type: 'i53', value: 0 }; rejected(extra);
});

test('strict JSON, fullblob/per-view digests, base64 and exact blob coverage are independently checked', () => {
  const json = JSON.stringify(manualWire());
  for (const text of [' ' + json, json.replace('"schema":', '"schema":"discarded","schema":'), ' '.repeat(32 * 1024 * 1024 + 1)]) assert.throws(() => evidence.decodeHubStateEvidence(text));
  for (const mutate of [r => { r.tensorBlob.sha256 = '0'.repeat(64); }, r => { r.tensorManifest[0].sha256 = '0'.repeat(64); },
    r => { r.tensorManifest[0].blobOffset = 1; }, r => { r.tensorBlob.data += '='; }, r => { r.tensorManifest.push(r.tensorManifest[0]); }]) { const record = manualWire(); mutate(record); rejected(record); }
});

test('raw evidence malformed metadata, accessors, failure receipts and domain-invalid payloads cannot qualify', () => {
  const good = observe(fixture());
  for (const change of [o => { o.views[0].backingId = 'mixedArenaBuffer'; }, o => { o.views[0].byteOffset++; },
    o => { o.backings.pop(); }, o => { o.backings[0].hex += '00'; }, o => { o.totals.uniqueBytes--; },
    o => { o.states.facultyNames16[0] = 'wrong'; }, o => { o.states.tensorBackendMode = 'x'.repeat(2049); },
    o => { o.states.samBestSectorIdx = f64(16); }, o => { delete o.views[0]; }, o => { o.extra = true; }]) {
    const bad = structuredClone(good); change(bad); assert.equal(evidence.compareHubHydration(good, bad).ok, false);
  }
  let reads = 0; const bad = structuredClone(good);
  Object.defineProperty(bad.backings[0], 'hex', { get() { reads++; return ''; }, enumerable: true });
  assert.equal(evidence.compareHubHydration(good, bad).ok, false); assert.equal(reads, 0);
  assert.equal(evidence.compareHubHydration(good, { ok: false }).code, 'HUB_CAPTURE_FAILED');
});

test('decoder owns its data and evidence helper imports no production module', () => {
  const record = manualWire(), before = decode(record), after = decode(record);
  before.backings.get('mixedArenaBuffer').fill(0); before.tensors[0].bytes.fill(0); before.states.b_disc2.hex = '0000000000000000';
  assert.notDeepEqual(before.backings.get('mixedArenaBuffer'), after.backings.get('mixedArenaBuffer')); assert.equal(after.states.b_disc2.hex, '0000000000000080');
  const imports = [...fs.readFileSync(path.join(__dirname, 'alive-hub-state-evidence.cjs'), 'utf8').matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(match => match[1]);
  assert.deepEqual(imports, ['node:crypto', './alive-learned-state-wire-evidence.cjs']);
});

test('production encoder is generation-only SUT and agrees with independent source/raw-bit expectations', async () => {
  const codec = require('../systems/alive-learned-state-codec.js'), registry = require('../systems/alive-learned-state-registry.js');
  const adapter = await require('../systems/alive-hub-state.js').create({ codec, registry, crypto: webcrypto });
  assert.deepEqual(adapter.architecture, evidence.createExpectedHubCatalog().architecture);
  const runtime = fixture(), raw = observe(runtime), json = await codec.encode(adapter.capture(runtime.trainableAlifeNeuralHub, snapshot, { generation: 3 }), { crypto: webcrypto });
  const result = evidence.assessHubStateEvidence(json, raw, { expectedSnapshot: snapshot }); assert.equal(result.ok, true, JSON.stringify(result));
  const expected = decode(manualWire(runtime)), actual = evidence.decodeHubStateEvidence(json);
  assert.deepEqual(actual.backings, expected.backings); assert.deepEqual(actual.states, expected.states);
});
