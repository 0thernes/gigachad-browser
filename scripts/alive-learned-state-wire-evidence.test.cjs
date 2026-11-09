'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { decodeLearnedStateWire, fingerprintDescriptorDefinition, toModelStateEvidence, LIMITS } = require('./alive-learned-state-wire-evidence.cjs');
const { observeModelState, compareModelState } = require('./alive-model-state-evidence.cjs');

const sha = value => createHash('sha256').update(value).digest('hex');
const copy = value => JSON.parse(JSON.stringify(value));
const rejects = code => error => error?.code === code;
const tensorFields = ['id', 'componentId', 'role', 'paths', 'dtype', 'dimensions', 'length', 'byteLength', 'byteOrder', 'backingGroup', 'backingOffset', 'backingByteLength'];
const component = { id: 'model', schemaVersion: 1, implementationDigest: '0'.repeat(64), present: true };
const f64 = value => { const buffer = Buffer.alloc(8); buffer.writeDoubleLE(value); return { $type: 'f64', hex: buffer.toString('hex') }; };
const tagRow = (id, valueType) => ({ id, componentId: 'model', role: 'continuation', valueType, schemaVersion: 1, required: true });

// Manually constructed public-format fixture. No production encoder/registry is
// imported. The fingerprint's canonical input below is explicitly written.
function fixture() {
  const bytes = Buffer.from('000000800000803f', 'hex');
  const definition = { registryVersion: 1, fixture: 'independent-wire-oracle' };
  const fingerprint = sha('gigachad.learned-state.registry.v1\0{"fixture":"independent-wire-oracle","registryVersion":1}');
  const row = { id: 'weights', componentId: 'model', role: 'parameter',
    paths: [{ root: 'model', keys: ['a'] }, { root: 'model', keys: ['alias'] }], dtype: 'Float32Array', dimensions: [2], length: 2, byteLength: 8,
    byteOrder: 'LE', backingGroup: 'arena', backingOffset: 4, backingByteLength: 16, blobOffset: 0, sha256: sha(bytes) };
  const wire = {
    schema: 'gigachad.learned-state.v1', architecture: { registryVersion: 1, fingerprint, components: [copy(component)] },
    snapshot: { creatureId: 'fixture', policyId: 'policy', checkpointId: 'snapshot-1', logicalTick: 42, modelEpoch: 7,
      capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' },
    tensorManifest: [row], tensorBlob: { encoding: 'base64', byteLength: 8, sha256: sha(bytes), data: bytes.toString('base64') },
    stateManifest: [tagRow('bias', 'f64'), tagRow('step', 'i53'), tagRow('word', 'bigint')],
    stateValues: { bias: f64(-0), step: { $type: 'i53', value: 42 }, word: { $type: 'bigint', signed: false, bits: 64, hex: 'ffffffffffffffff' } },
    resumeRules: [{ id: 'authority', action: 'reset', reason: 'Fresh document', version: 1 }]
  };
  const expectedCatalog = { descriptorDefinition: definition, architecture: copy(wire.architecture),
    tensors: [Object.fromEntries(tensorFields.map(key => [key, copy(row[key])]))], states: copy(wire.stateManifest), resumeRules: copy(wire.resumeRules) };
  return { wire, expectedCatalog, bytes };
}
function addState(wire, id, tag) {
  wire.stateManifest.push(tagRow(id, tag === null ? 'null' : typeof tag === 'object' ? tag.$type : typeof tag));
  wire.stateValues[id] = tag;
}
function rehash(wire, bytes) {
  wire.tensorBlob.data = bytes.toString('base64'); wire.tensorBlob.byteLength = bytes.length; wire.tensorBlob.sha256 = sha(bytes);
  for (const row of wire.tensorManifest) row.sha256 = sha(bytes.subarray(row.blobOffset, row.blobOffset + row.byteLength));
}

test('manual wire parses, yields owned exact bytes/scalars and distinguishes catalog qualification', () => {
  const { wire, expectedCatalog, bytes } = fixture();
  const unqualified = decodeLearnedStateWire(JSON.stringify(wire));
  assert.equal(unqualified.evidence.wireValid, true); assert.equal(unqualified.evidence.suppliedCatalogMatched, false);
  assert.equal(unqualified.evidence.descriptorFingerprintVerified, false); assert.equal(unqualified.evidence.registryCompleteness, 'not-established');
  const decoded = decodeLearnedStateWire(JSON.stringify(wire), { expectedCatalog });
  assert.equal(decoded.evidence.suppliedCatalogMatched, true); assert.equal(decoded.evidence.descriptorFingerprintVerified, true);
  assert.deepEqual(decoded.tensors[0].bytes, bytes);
  assert.ok(Object.is(decoded.decodedStates.get('bias'), -0)); assert.equal(decoded.decodedStates.get('step'), 42); assert.equal(decoded.decodedStates.get('word'), (1n << 64n) - 1n);
  wire.tensorBlob.data = ''; bytes.fill(0); assert.equal(decoded.tensors[0].bytes.toString('hex'), '000000800000803f');
  assert.equal(decoded.evidence.semanticStatePoliciesVerified, false);
});

test('decoded wire compares against independent live-view observer including aliases and offsets', () => {
  const { wire, expectedCatalog } = fixture(), decoded = decodeLearnedStateWire(JSON.stringify(wire), { expectedCatalog });
  const backing = new ArrayBuffer(16), a = new Float32Array(backing, 4, 2); a.set([-0, 1]);
  const registry = [{ id: 'weights', paths: wire.tensorManifest[0].paths, dtype: 'Float32Array', dimensions: [2], role: 'parameter', componentId: 'model' }];
  const expected = observeModelState({ model: { a, alias: a } }, registry);
  assert.equal(compareModelState(expected, toModelStateEvidence(decoded)).ok, true);
  decoded.tensors[0].bytes[0] ^= 1;
  assert.equal(compareModelState(expected, toModelStateEvidence(decoded)).ok, false);
});

test('descriptor fingerprint uses sorted object keys but preserves array order and exact spelling', () => {
  assert.equal(fingerprintDescriptorDefinition({ b: 2, a: [3, 1] }), sha('gigachad.learned-state.registry.v1\0{"a":[3,1],"b":2}'));
  assert.notEqual(fingerprintDescriptorDefinition({ b: 2, a: [3, 1] }), fingerprintDescriptorDefinition({ a: [1, 3], b: 2 }));
  let invoked = 0; const hostile = Object.defineProperty({}, 'a', { enumerable: true, get() { invoked++; return 1; } });
  assert.throws(() => fingerprintDescriptorDefinition(hostile), rejects('JSON_DATA')); assert.equal(invoked, 0);
});

test('supplied alias sets compare independently of path order and path object member order', () => {
  const { wire, expectedCatalog } = fixture();
  expectedCatalog.tensors[0].paths = expectedCatalog.tensors[0].paths.reverse().map(item => ({ keys: item.keys, root: item.root }));
  assert.equal(decodeLearnedStateWire(JSON.stringify(wire), { expectedCatalog }).evidence.suppliedCatalogMatched, true);
});

test('string-only compact normalized JSON rejects duplicate members, alternate escapes/numbers and whitespace', () => {
  const { wire } = fixture(), text = JSON.stringify(wire);
  assert.throws(() => decodeLearnedStateWire(wire), rejects('PAYLOAD_SIZE'));
  for (const altered of [text + '\n', text.replace('"schema":', '"schema": "duplicate","schema":'),
    text.replace('"logicalTick":42', '"logicalTick":4.2e1'), text.replace('"model"', '"\\u006dodel"'),
    text.replace('"logicalTick":42', '"logicalTick":-0')]) {
    assert.throws(() => decodeLearnedStateWire(altered), rejects('JSON_NORMALIZATION'));
  }
  assert.throws(() => decodeLearnedStateWire(text.slice(0, -1)), rejects('JSON_SYNTAX'));
});

test('parser rejects size, depth and primitive-property work floods before semantic parsing', () => {
  assert.throws(() => decodeLearnedStateWire(' '.repeat(LIMITS.payloadBytes + 1)), rejects('PAYLOAD_SIZE'));
  assert.throws(() => decodeLearnedStateWire('"' + 'é'.repeat(LIMITS.payloadBytes / 2) + '"'), rejects('PAYLOAD_SIZE'));
  assert.throws(() => decodeLearnedStateWire('['.repeat(129) + '0' + ']'.repeat(129)), rejects('JSON_BUDGET'));
  const flood = '{' + Array.from({ length: 125001 }, (_, i) => '"k' + i + '":0').join(',') + '}';
  assert.throws(() => decodeLearnedStateWire(flood), rejects('JSON_BUDGET'));
  assert.throws(() => fingerprintDescriptorDefinition({ text: '\u0000'.repeat(Math.ceil(LIMITS.payloadBytes / 6)) }), rejects('PAYLOAD_SIZE'));
});

test('schema, header, component declarations and field sets fail closed', () => {
  const changes = [
    value => { value.schema = 'unknown'; }, value => { value.extra = 1; }, value => { delete value.snapshot.logicalTick; },
    value => { value.snapshot.logicalTick = -1; }, value => { value.snapshot.modelEpoch = 0.5; }, value => { value.snapshot.resumeBoundary = 'reuse-old-authority'; },
    value => { value.snapshot.capturedAt = '2026-11-09'; }, value => { value.architecture.registryVersion = 0; },
    value => { value.architecture.components[0].implementationDigest = 'X'.repeat(64); },
    value => { value.architecture.components.push(copy(component)); }, value => { value.architecture.components[0].present = false; },
    value => { value.tensorManifest[0].componentId = 'missing'; }
  ];
  for (const change of changes) { const { wire } = fixture(); change(wire); assert.throws(() => decodeLearnedStateWire(JSON.stringify(wire))); }
  const unsafe = JSON.stringify(fixture().wire).replace('"schema":', '"__proto__":{},"schema":');
  assert.throws(() => decodeLearnedStateWire(unsafe), rejects('JSON_DATA'));
});

test('blob and view digests independently detect byte corruption, even after the other digest is repaired', () => {
  const { wire } = fixture(), raw = Buffer.from(wire.tensorBlob.data, 'base64'); raw[0] ^= 1;
  wire.tensorBlob.data = raw.toString('base64');
  assert.throws(() => decodeLearnedStateWire(JSON.stringify(wire)), rejects('BLOB_DIGEST'));
  wire.tensorBlob.sha256 = sha(raw);
  assert.throws(() => decodeLearnedStateWire(JSON.stringify(wire)), rejects('TENSOR_DIGEST'));
});

test('base64 truncation, trailing bytes and nonzero padding bits reject even with otherwise correct hashes', () => {
  const { wire } = fixture();
  for (const data of [wire.tensorBlob.data.slice(1), wire.tensorBlob.data + 'AAAA', wire.tensorBlob.data.replace(/=+$/, '!'), '!!!!' + wire.tensorBlob.data.slice(4)]) {
    const altered = copy(wire); altered.tensorBlob.data = data; assert.throws(() => decodeLearnedStateWire(JSON.stringify(altered)), rejects('BASE64'));
  }
  const altered = copy(wire); altered.tensorBlob.data = altered.tensorBlob.data.slice(0, -2) + '9=';
  assert.throws(() => decodeLearnedStateWire(JSON.stringify(altered)), rejects('BASE64'));
});

test('shape, byte order, offset, coverage, aliases and backing constraints are checked independently', () => {
  const changes = [
    row => { row.dtype = 'UnknownArray'; }, row => { row.byteOrder = 'BE'; }, row => { row.dimensions = [3]; },
    row => { row.dimensions = []; }, row => { row.dimensions = [LIMITS.tensorBytes, LIMITS.tensorBytes, LIMITS.tensorBytes]; },
    row => { row.length = 3; }, row => { row.blobOffset = 1; }, row => { row.backingOffset = 2; },
    row => { row.backingByteLength = 8; }, row => { row.paths = []; }, row => { row.paths.push(copy(row.paths[0])); },
    row => { row.paths[0].keys = ['__proto__']; }, row => { row.paths[0].keys = Array(17).fill('x'); },
    row => { row.byteLength = LIMITS.tensorBytes + 1; }
  ];
  for (const change of changes) { const { wire } = fixture(); change(wire.tensorManifest[0]); assert.throws(() => decodeLearnedStateWire(JSON.stringify(wire))); }
});

function overlapFixture() {
  const { wire } = fixture(); wire.stateManifest = []; wire.stateValues = {};
  const first = { ...wire.tensorManifest[0], id: 'a', dtype: 'Uint8Array', dimensions: [4], length: 4, byteLength: 4,
    paths: [{ root: 'model', keys: ['a'] }], backingOffset: 0, backingByteLength: 6, blobOffset: 0 };
  const second = { ...first, id: 'b', paths: [{ root: 'model', keys: ['b'] }], backingOffset: 2, blobOffset: 4 };
  wire.tensorManifest = [first, second]; rehash(wire, Buffer.from([1, 2, 3, 4, 3, 4, 5, 6])); return wire;
}

test('overlapping bytes must agree, independent of both valid SHA256 digests; large backing gaps are never allocated', () => {
  const wire = overlapFixture(), decoded = decodeLearnedStateWire(JSON.stringify(wire));
  assert.equal(decoded.evidence.overlap.comparedBytes, 2); assert.equal(decoded.evidence.overlap.unionBytes, 6);
  assert.notEqual(decoded.tensors[0].bytes.buffer, decoded.tensors[1].bytes.buffer);
  const corrupt = Buffer.from(wire.tensorBlob.data, 'base64'); corrupt[4] ^= 1; rehash(wire, corrupt);
  assert.throws(() => decodeLearnedStateWire(JSON.stringify(wire)), rejects('OVERLAP'));
  const gap = overlapFixture(); gap.tensorManifest[1].backingOffset = 1024 ** 4;
  for (const row of gap.tensorManifest) row.backingByteLength = 1024 ** 4 + 4;
  const evidence = decodeLearnedStateWire(JSON.stringify(gap)).evidence;
  assert.equal(evidence.overlap.unionBytes, 8); assert.equal(evidence.overlap.comparedBytes, 0);
});

test('tensor IDs must be sorted and exact, but zero-length tensors and empty blobs are valid wire', () => {
  const wire = overlapFixture(); wire.tensorManifest[0].id = 'b'; wire.tensorManifest[1].id = 'a';
  assert.throws(() => decodeLearnedStateWire(JSON.stringify(wire)), rejects('TENSOR_ID'));
  const empty = fixture().wire; empty.tensorManifest[0].length = 0; empty.tensorManifest[0].byteLength = 0; empty.tensorManifest[0].dimensions = [0]; rehash(empty, Buffer.alloc(0));
  assert.equal(decodeLearnedStateWire(JSON.stringify(empty)).evidence.tensorBytes, 0);
});

test('ordered arrays, object fields, Maps, Sets, signed BigInts and tensor references decode independently', () => {
  const { wire } = fixture();
  const tag = { $type: 'object', entries: [
    ['ordered', { $type: 'array', items: [true, null, 'x', f64(-0)] }],
    ['map', { $type: 'map', entries: [['first', { $type: 'tensor', id: 'weights' }], [{ $type: 'i53', value: 2 }, 'second']] }],
    ['set', { $type: 'set', values: ['z', { $type: 'i53', value: 2 }, { $type: 'bigint', signed: true, bits: 8, hex: 'ff' }] }]
  ] };
  addState(wire, 'collection', tag);
  const decoded = decodeLearnedStateWire(JSON.stringify(wire)), value = decoded.decodedStates.get('collection');
  assert.deepEqual(value.ordered, [true, null, 'x', -0]); assert.deepEqual(Array.from(value.map.keys()), ['first', 2]);
  assert.deepEqual(Array.from(value.set), ['z', 2, -1n]); assert.equal(decoded.tensorReferences[0].tensorId, 'weights');
  assert.equal(decoded.stateTags.collection.entries[1][1].entries[0][1].$type, 'tensor');
});

test('SameValueZero rejects duplicate collection keys across tag forms and BigInt widths', () => {
  const pairs = [
    [f64(-0), f64(0)], [f64(1), { $type: 'i53', value: 1 }],
    [{ $type: 'bigint', signed: true, bits: 8, hex: '01' }, { $type: 'bigint', signed: false, bits: 64, hex: '0000000000000001' }]
  ];
  for (const pair of pairs) for (const kind of ['map', 'set']) {
    const { wire } = fixture(); addState(wire, 'duplicates', kind === 'map' ? { $type: 'map', entries: pair.map(key => [key, null]) } : { $type: 'set', values: pair });
    assert.throws(() => decodeLearnedStateWire(JSON.stringify(wire)), rejects('STATE_UNIQUENESS'));
  }
  const { wire } = fixture(); addState(wire, 'distinct', { $type: 'set', values: [{ $type: 'i53', value: 1 }, { $type: 'bigint', signed: false, bits: 8, hex: '01' }] });
  assert.equal(decodeLearnedStateWire(JSON.stringify(wire)).decodedStates.get('distinct').size, 2);
});

test('state malformed values, missing/extra state, nonfinite numbers and unknown references reject', () => {
  const tags = [
    { $type: 'f64', hex: '000000000000f87f' }, { $type: 'f64', hex: '000000000000f07f' }, { $type: 'i53', value: 0.5 },
    { $type: 'bigint', signed: false, bits: 7, hex: 'ff' }, { $type: 'bigint', signed: false, bits: 8, hex: '0f0' },
    { $type: 'tensor', id: 'absent' }, { $type: 'array', items: [7] }, { $type: 'object', entries: [['a', true], ['a', false]] },
    { $type: 'map', entries: [[{ $type: 'array', items: [] }, true]] }, { $type: 'set', values: [{ $type: 'tensor', id: 'weights' }] },
    { $type: 'object', entries: [['constructor', true]] }
  ];
  for (const tag of tags) { const { wire } = fixture(); addState(wire, 'bad', tag); assert.throws(() => decodeLearnedStateWire(JSON.stringify(wire))); }
  const missing = fixture().wire; delete missing.stateValues.bias; assert.throws(() => decodeLearnedStateWire(JSON.stringify(missing)), rejects('STATE_VALUES'));
  const extra = fixture().wire; extra.stateValues.extra = true; assert.throws(() => decodeLearnedStateWire(JSON.stringify(extra)), rejects('STATE_VALUES'));
  const deep = fixture().wire; let tag = null; for (let i = 0; i < 33; i++) tag = { $type: 'array', items: [tag] }; addState(deep, 'deep', tag);
  assert.throws(() => decodeLearnedStateWire(JSON.stringify(deep)), rejects('STATE_BUDGET'));
});

test('valid42000-entry tagged object counts serialized values without double-counting array indices', () => {
  const { wire } = fixture();
  addState(wire, 'many', { $type: 'object', entries: Array.from({ length: 42000 }, (_, i) => ['k' + i, null]) });
  const decoded = decodeLearnedStateWire(JSON.stringify(wire));
  assert.equal(Object.keys(decoded.decodedStates.get('many')).length, 42000);
  assert.equal(decoded.decodedStates.get('many').k41999, null);
  assert.equal(decoded.evidence.taggedStateNodes, 42004); // Object+42000 values+three fixed scalar states.
  assert.ok(decoded.evidence.parserTokens < LIMITS.jsonNodes);
  assert.equal(decoded.evidence.suppliedCatalogMatched, false);
});

test('self-consistent omitted or changed catalog cannot qualify against the external expected catalog', () => {
  const changes = [
    value => { value.tensorManifest = []; value.tensorBlob = { encoding: 'base64', byteLength: 0, sha256: sha(Buffer.alloc(0)), data: '' }; },
    value => { value.tensorManifest[0].dimensions = [1, 2]; }, value => { value.tensorManifest[0].paths.pop(); },
    value => { value.tensorManifest[0].backingByteLength = 20; },
    value => { value.stateManifest = value.stateManifest.filter(row => row.id !== 'step'); delete value.stateValues.step; },
    value => { value.architecture.components[0].implementationDigest = '1'.repeat(64); }, value => { value.resumeRules = []; }
  ];
  for (const change of changes) {
    const { wire, expectedCatalog } = fixture(); change(wire);
    assert.equal(decodeLearnedStateWire(JSON.stringify(wire)).evidence.wireValid, true);
    assert.throws(() => decodeLearnedStateWire(JSON.stringify(wire), { expectedCatalog }), error => error.code?.startsWith('CATALOG_'));
  }
  const { wire, expectedCatalog } = fixture(); expectedCatalog.descriptorDefinition.registryVersion = 2;
  assert.throws(() => decodeLearnedStateWire(JSON.stringify(wire), { expectedCatalog }), rejects('CATALOG_FINGERPRINT'));
});

test('owner frozen interchange payload independently matches all11 source-view byte expectations', () => {
  const folder = path.resolve(__dirname, '../tests/fixtures/alive-wire-v1');
  const json = fs.readFileSync(path.join(folder, 'payload.json'), 'utf8'), expected = JSON.parse(fs.readFileSync(path.join(folder, 'expected.json'), 'utf8'));
  assert.equal(sha(json), 'a07140d8a8fe2787e94960d4ad21bb0dcfd8a8699b05327c314fa8ced33a2cb5');
  assert.equal(Buffer.byteLength(json), 5493); const decoded = decodeLearnedStateWire(json);
  assert.equal(decoded.tensors.length, 11); assert.equal(decoded.evidence.payloadSha256, expected.sha256);
  for (const row of expected.tensors) {
    const actual = decoded.tensors.find(item => item.id === row.id);
    assert.equal(actual.dtype, row.dtype); assert.deepEqual(actual.dimensions, row.dimensions); assert.deepEqual(copy(actual.paths), row.paths);
    assert.equal(actual.bytes.toString('hex'), row.hex);
  }
  assert.ok(Object.is(decoded.decodedStates.get('model.bias'), -0)); assert.equal(decoded.decodedStates.get('model.step'), 42);
  assert.equal(decoded.decodedStates.get('model.word'), (1n << 64n) - 1n);
  // This first pass is intentionally wire-only; the next test supplies the
  // independently constructed expected catalog without reading it from wire.
  assert.equal(decoded.evidence.suppliedCatalogMatched, false);
});

test('owner external normalized catalog matches exact architecture, fingerprint, aliases, state and resume sets', () => {
  const folder = path.resolve(__dirname, '../tests/fixtures/alive-wire-v1');
  const catalogText = fs.readFileSync(path.join(folder, 'expected-definition.json'), 'utf8');
  assert.equal(sha(catalogText), '17683f365269baed0a0b3849fde66ea128b7295dc521329359035347082ec0cd');
  assert.equal(Buffer.byteLength(catalogText), 13873);
  const expectedCatalog = JSON.parse(catalogText), json = fs.readFileSync(path.join(folder, 'payload.json'), 'utf8');
  const decoded = decodeLearnedStateWire(json, { expectedCatalog });
  assert.equal(fingerprintDescriptorDefinition(expectedCatalog.descriptorDefinition), '9d4270b2faeeea73743083a31e7b9d28308846e49fb1538fdc4a5e2b4be36307');
  assert.equal(decoded.evidence.suppliedCatalogMatched, true); assert.equal(decoded.evidence.descriptorFingerprintVerified, true);
  assert.equal(decoded.evidence.tensorCount, 11); assert.equal(decoded.evidence.tensorBytes, 86); assert.equal(decoded.evidence.aliasPaths, 12);
  assert.equal(decoded.evidence.stateCount, 3); assert.equal(decoded.evidence.componentCount, 1);
  assert.equal(decoded.evidence.registryCompleteness, 'not-established');
  const expected = JSON.parse(fs.readFileSync(path.join(folder, 'expected.json'), 'utf8'));
  for (const row of expected.tensors) assert.equal(decoded.tensors.find(item => item.id === row.id).bytes.toString('hex'), row.hex);
});
