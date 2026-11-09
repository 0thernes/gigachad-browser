'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash, webcrypto } = require('node:crypto');
const evidence = require('../scripts/alive-trainer-state-evidence.cjs');
const independentWire = require('../scripts/alive-learned-state-wire-evidence.cjs');
const hash = value => createHash('sha256').update(value).digest('hex');
const implementationDigest = '4224f86b60fbf2488b6e92f9add25e55405a5c0b5f100187acd04b5a37bc16fa';
const fingerprint = '41923fe72ee7bfdc67d6da41745b0ba11e119bd290404d834c78f16e6f8050e6';
const componentId = 'bleeding-committed-trainer';
const snapshot = { creatureId: 'trainer-evidence-fixture', policyId: 'policy-fixture', checkpointId: 'checkpoint-fixture',
  logicalTick: 41, modelEpoch: 9, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' };
const bytesOf = value => Buffer.from(value.buffer, value.byteOffset, value.byteLength);
function weights() {
  const result = Float32Array.from({ length: 16 }, (_, i) => (i - 7) / 8);
  new Uint32Array(result.buffer).set([0x80000000, 0x00000001, 0x80000001, 0]);
  return result;
}
// Hand-built wire: no production encoder/registry and no catalog-helper output
// supplies its expected roster, metadata, state tags or bytes.
function manualWire(values = weights(), epoch = 37, timeout = 5000) {
  const raw = bytesOf(values);
  return { schema: 'gigachad.learned-state.v1',
    architecture: { registryVersion: 1, fingerprint,
      components: [{ id: componentId, schemaVersion: 1, implementationDigest, present: true }] },
    snapshot: { ...snapshot },
    tensorManifest: [{ id: 'W_hyper_u', componentId, role: 'parameter',
      paths: [{ root: 'trainer', keys: ['W_hyper_u'] }], dtype: 'Float32Array', dimensions: [16], length: 16,
      byteLength: 64, byteOrder: 'LE', backingGroup: 'W_hyper_u', backingOffset: 0, backingByteLength: 64,
      blobOffset: 0, sha256: hash(raw) }],
    tensorBlob: { encoding: 'base64', byteLength: 64, sha256: hash(raw), data: raw.toString('base64') },
    stateManifest: [
      { id: 'committedEpoch', componentId, role: 'semantic-clock', valueType: 'i53', schemaVersion: 1, required: true },
      { id: 'timeoutMs', componentId, role: 'configuration', valueType: 'i53', schemaVersion: 1, required: true }
    ],
    stateValues: { committedEpoch: { $type: 'i53', value: epoch }, timeoutMs: { $type: 'i53', value: timeout } },
    resumeRules: [
      { id: 'external-inputs', action: 'reobserve', reason: 'World, network and hub cadence belong to separately declared components and current browser authority', version: 1 },
      { id: 'pending-work', action: 'discard', reason: 'Only committed learning is durable; the next job samples a new input at committedEpoch plus one', version: 1 },
      { id: 'worker-authority', action: 'reset', reason: 'Fresh worker, generation, job identity and execution receipts; apply remains suspended', version: 1 }
    ] };
}
function repairByteHashes(record, bytes) {
  record.tensorBlob.data = bytes.toString('base64'); record.tensorBlob.sha256 = hash(bytes);
  for (const row of record.tensorManifest) row.sha256 = hash(bytes.subarray(row.blobOffset, row.blobOffset + row.byteLength));
}
function assertRejected(record, code) {
  assert.throws(() => evidence.decodeTrainerStateEvidence(JSON.stringify(record)), error => code ? error.code === code : true);
}

test('independent hand-built wire retains all 64 bytes, tagged states and strict component scope', () => {
  const original = weights(), decoded = evidence.decodeTrainerStateEvidence(JSON.stringify(manualWire(original)));
  assert.deepEqual(decoded.weights, bytesOf(original)); assert.equal(decoded.weights.length, 64);
  assert.equal(decoded.weights.readUInt32LE(0), 0x80000000); assert.equal(decoded.weights.readUInt32LE(4), 1);
  assert.equal(decoded.weights.readUInt32LE(8), 0x80000001);
  assert.equal(decoded.committedEpoch, 37); assert.equal(decoded.timeoutMs, 5000); assert.equal(decoded.exhausted, false);
  assert.equal(decoded.evidence.architectureFingerprint, fingerprint);
  assert.equal(decoded.evidence.implementationDigest, implementationDigest);
  assert.equal(decoded.evidence.tensorCount, 1); assert.equal(decoded.evidence.stateCount, 2);
  assert.equal(decoded.evidence.completeApplicationCatalog, false); assert.equal(decoded.evidence.durabilityVerified, false);
});
test('inclusive epoch/timeout boundaries include retained exhausted clock without zero reset', () => {
  for (const epoch of [0, Number.MAX_SAFE_INTEGER]) for (const timeout of [50, 30000]) {
    const result = evidence.decodeTrainerStateEvidence(JSON.stringify(manualWire(weights(), epoch, timeout)));
    assert.equal(result.committedEpoch, epoch); assert.equal(result.timeoutMs, timeout);
    assert.equal(result.exhausted, epoch === Number.MAX_SAFE_INTEGER);
  }
});
test('integer tag and semantic bounds independently reject fractional, negative, unsafe and wrong-type state', () => {
  for (const epoch of [-1, .5, Number.MAX_SAFE_INTEGER + 1]) assertRejected(manualWire(weights(), epoch));
  for (const timeout of [49, 30001, 50.5, -1]) assertRejected(manualWire(weights(), 37, timeout));
  const negativeZero = JSON.stringify(manualWire(weights(), 0)).replace('"committedEpoch":{"$type":"i53","value":0}', '"committedEpoch":{"$type":"i53","value":-0}');
  assert.throws(() => evidence.decodeTrainerStateEvidence(negativeZero));
  const wrong = manualWire(); wrong.stateValues.committedEpoch = { $type: 'f64', hex: '0000000000804240' }; assertRejected(wrong);
  const missing = manualWire(); delete missing.stateValues.timeoutMs; assertRejected(missing);
});
test('damaged digests and validly rehashed NaN/infinities fail independently', () => {
  const broken = manualWire(); broken.tensorManifest[0].sha256 = '0'.repeat(64); assertRejected(broken);
  for (const word of [0x7fc00000, 0x7f800000, 0xff800000]) {
    const record = manualWire(), bytes = Buffer.from(record.tensorBlob.data, 'base64'); bytes.writeUInt32LE(word, 12);
    repairByteHashes(record, bytes);
    assert.equal(independentWire.decodeLearnedStateWire(JSON.stringify(record)).evidence.wireValid, true);
    assertRejected(record, 'TRAINER_NONFINITE');
  }
});
test('exact assessor detects validly rehashed one-bit weights and differing scalars without dumping values', () => {
  const original = weights(), expected = { weights: original, committedEpoch: 37, timeoutMs: 5000 }, record = manualWire(original);
  let result = evidence.assessTrainerStateEvidence(JSON.stringify(record), expected);
  assert.equal(result.ok, true); assert.equal(result.comparedBytes, 64); assert.equal(result.comparedStates, 2);
  const bytes = Buffer.from(record.tensorBlob.data, 'base64'); bytes[0] ^= 1; repairByteHashes(record, bytes);
  assert.equal(evidence.decodeTrainerStateEvidence(JSON.stringify(record)).evidence.wireValid, true);
  result = evidence.assessTrainerStateEvidence(JSON.stringify(record), expected);
  assert.equal(result.ok, false); assert.equal(result.differingFloat32Values, 1);
  for (const [key, replacement] of [['committedEpoch', 38], ['timeoutMs', 5100]]) {
    const changed = manualWire(original); changed.stateValues[key].value = replacement;
    result = evidence.assessTrainerStateEvidence(JSON.stringify(changed), expected);
    assert.equal(result.ok, false); assert.ok(result.differences.some(row => row.id === key));
  }
  assert.equal(JSON.stringify(result).includes('dataBase64'), false); assert.equal(JSON.stringify(result).includes('weights":['), false);
});
test('validly re-fingerprinted incompatible shape, path, extra state and kernel identity still fail pinned catalog', () => {
  const variants = [
    (r, d) => { r.tensorManifest[0].dimensions = [4, 4]; d.tensors[0].dimensions = [4, 4]; },
    (r, d) => { const alias = { root: 'trainer', keys: ['undocumentedAlias'] }; r.tensorManifest[0].paths.push(alias); d.tensors[0].paths.push(alias); },
    (r, d) => {
      r.stateManifest.push({ id: 'undocumented', componentId, role: 'state', valueType: 'i53', schemaVersion: 1, required: true });
      r.stateValues.undocumented = { $type: 'i53', value: 1 };
      d.states.push({ id: 'undocumented', componentId, role: 'state', paths: [{ root: 'trainer', keys: ['undocumented'] }],
        schemaVersion: 1, required: true, schema: { type: 'i53' } });
    },
    (r, d) => { r.architecture.components[0].implementationDigest = hash('different-kernel'); d.components[0].implementationDigest = r.architecture.components[0].implementationDigest; }
  ];
  for (const mutate of variants) {
    const record = manualWire(), definition = evidence.createExpectedTrainerCatalog().descriptorDefinition;
    mutate(record, definition); record.architecture.fingerprint = independentWire.fingerprintDescriptorDefinition(definition);
    assert.equal(independentWire.decodeLearnedStateWire(JSON.stringify(record)).evidence.wireValid, true, 'internally valid wire must reach the external catalog check');
    assertRejected(record, 'CATALOG_FINGERPRINT');
  }
});
test('same-fingerprint manifest substitutions, extra tensor and incompatible resume/schema are rejected', () => {
  for (const mutate of [r => { r.tensorManifest[0].backingByteLength = 128; },
    r => { r.tensorManifest[0].paths[0].keys = ['wrong']; }, r => { r.tensorManifest[0].dtype = 'Int32Array'; },
    r => { r.stateManifest[0].role = 'configuration'; }, r => { r.resumeRules[1].action = 'keep'; },
    r => { r.schema = 'gigachad.learned-state.v2'; }, r => { r.architecture.components[0].schemaVersion = 2; },
    r => { r.tensorManifest.push({ ...r.tensorManifest[0], id: 'extra' }); }]) {
    const record = manualWire(); mutate(record); assertRejected(record);
  }
});
test('decoded bytes own their snapshot and expected views reject getters/shared/detached sources', () => {
  const json = JSON.stringify(manualWire()), first = evidence.decodeTrainerStateEvidence(json);
  first.weights.fill(0); assert.notDeepEqual(first.weights, evidence.decodeTrainerStateEvidence(json).weights);
  const expected = { weights: weights(), committedEpoch: 37, timeoutMs: 5000 };
  let getterCalled = false; Object.defineProperty(expected, 'timeoutMs', { get() { getterCalled = true; return 5000; } });
  assert.equal(evidence.assessTrainerStateEvidence(json, expected).status, 'invalid-evidence'); assert.equal(getterCalled, false);
  for (const view of [new Float32Array(new SharedArrayBuffer(64)), new Uint8Array(63), new Float64Array(8)]) {
    assert.equal(evidence.assessTrainerStateEvidence(json, { weights: view, committedEpoch: 37, timeoutMs: 5000 }).status, 'invalid-evidence');
  }
  const detached = weights(); structuredClone(detached.buffer, { transfer: [detached.buffer] });
  assert.equal(evidence.assessTrainerStateEvidence(json, { weights: detached, committedEpoch: 37, timeoutMs: 5000 }).status, 'invalid-evidence');
  const crossRealm = vm.runInNewContext('new Float32Array(16)'); new Uint8Array(crossRealm.buffer).set(bytesOf(weights()));
  assert.equal(evidence.assessTrainerStateEvidence(json, { weights: crossRealm, committedEpoch: 37, timeoutMs: 5000 }).ok, true);
});
test('production encoding interoperates with independent catalog and raw-value oracle without engine construction', async () => {
  // Production modules are generation-only SUTs in this test, never an expected
  // value decoder or an import performed by the evidence module.
  const codec = require('../systems/alive-learned-state-codec.js');
  const registry = require('../systems/alive-learned-state-registry.js');
  const adapterModule = require('../systems/alive-trainer-state.js');
  const original = weights();
  const engineFixture = { captureCommittedTrainerState() { return { schemaVersion: 1, kernelId: 'bleeding-hyper-worker-v1',
    weights: original, committedEpoch: 37, timeoutMs: 5000 }; },
    prepareCommittedTrainerRestore() { throw new Error('not used'); }, recheckCommittedTrainerRestore() { throw new Error('not used'); },
    commitCommittedTrainerRestore() { throw new Error('not used'); }, discardCommittedTrainerRestore() { throw new Error('not used'); } };
  const adapter = await adapterModule.create({ registry, codec, crypto: webcrypto });
  assert.deepEqual(adapter.architecture, evidence.createExpectedTrainerCatalog().architecture);
  const json = await codec.encode(adapter.capture(engineFixture, snapshot), { crypto: webcrypto });
  const result = evidence.assessTrainerStateEvidence(json, { weights: original, committedEpoch: 37, timeoutMs: 5000 });
  assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(result.actual.tensorBytes, 64);
});
test('evidence module imports only standard crypto and independent wire helper', () => {
  const filename = path.join(__dirname, '../scripts/alive-trainer-state-evidence.cjs');
  const imports = [...fs.readFileSync(filename, 'utf8').matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(match => match[1]);
  assert.deepEqual(imports, ['node:crypto', './alive-learned-state-wire-evidence.cjs']);
});
