'use strict';
// Independent verification of the public committed-trainer wire contract.
// No production codec, registry, trainer, capture or importer is imported.
// This catalog is a component subset, not a claim of whole-model persistence.
const { createHash } = require('node:crypto');
const wire = require('./alive-learned-state-wire-evidence.cjs');
const COMPONENT_ID = 'bleeding-committed-trainer';
const KERNEL_ID = 'bleeding-hyper-worker-v1';
const SCHEMA_VERSION = 1;
const MAX_EPOCH = Number.MAX_SAFE_INTEGER;
const sha = value => createHash('sha256').update(value).digest('hex');
const ordinal = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const fail = (code, message) => { const error = new TypeError(message); error.code = code; throw error; };

function createExpectedTrainerCatalog() {
  // Explicit independently transcribed public contract. Physical target was
  // source-audited as one owned Float32[16]; paths below describe the detached
  // persistence projection, not aliases of the engine's private clock.
  const rows = {
    tensors: [{ id: 'W_hyper_u', componentId: COMPONENT_ID, role: 'parameter',
      paths: [{ root: 'trainer', keys: ['W_hyper_u'] }], dtype: 'Float32Array', dimensions: [16],
      backingGroup: 'W_hyper_u', backingOffset: 0, backingByteLength: 64,
      policy: { format: 'native', finite: true } }],
    states: [
      { id: 'committedEpoch', componentId: COMPONENT_ID, role: 'semantic-clock',
        paths: [{ root: 'trainer', keys: ['committedEpoch'] }], schemaVersion: 1, required: true,
        schema: { type: 'i53', min: 0, max: MAX_EPOCH } },
      { id: 'timeoutMs', componentId: COMPONENT_ID, role: 'configuration',
        paths: [{ root: 'trainer', keys: ['timeoutMs'] }], schemaVersion: 1, required: true,
        schema: { type: 'i53', min: 50, max: 30000 } }
    ],
    families: [],
    resumeRules: [
      { id: 'worker-authority', action: 'reset', reason: 'Fresh worker, generation, job identity and execution receipts; apply remains suspended', version: 1 },
      { id: 'pending-work', action: 'discard', reason: 'Only committed learning is durable; the next job samples a new input at committedEpoch plus one', version: 1 },
      { id: 'external-inputs', action: 'reobserve', reason: 'World, network and hub cadence belong to separately declared components and current browser authority', version: 1 }
    ]
  };
  const implementationDigest = wire.fingerprintDescriptorDefinition({ componentId: COMPONENT_ID,
    schemaVersion: SCHEMA_VERSION, kernelId: KERNEL_ID, ...rows,
    interpretation: 'Exact finite Float32 u bytes and private committed epoch with timeout configuration; pending work discarded; inputs and event order external' });
  const definition = { registryVersion: 1,
    components: [{ id: COMPONENT_ID, schemaVersion: SCHEMA_VERSION, implementationDigest, present: true }],
    tensors: rows.tensors.sort(ordinal), states: rows.states.sort(ordinal), families: [], resumeRules: rows.resumeRules.sort(ordinal) };
  const fingerprint = wire.fingerprintDescriptorDefinition(definition);
  if (implementationDigest !== '4224f86b60fbf2488b6e92f9add25e55405a5c0b5f100187acd04b5a37bc16fa' ||
      fingerprint !== '41923fe72ee7bfdc67d6da41745b0ba11e119bd290404d834c78f16e6f8050e6') {
    fail('TRAINER_CATALOG_CHANGED', 'Independent trainer catalog changed; explicit contract review required');
  }
  return { descriptorDefinition: definition,
    architecture: { registryVersion: 1, fingerprint, components: definition.components },
    tensors: [{ id: 'W_hyper_u', componentId: COMPONENT_ID, role: 'parameter',
      paths: [{ root: 'trainer', keys: ['W_hyper_u'] }], dtype: 'Float32Array', dimensions: [16],
      length: 16, byteLength: 64, byteOrder: 'LE', backingGroup: 'W_hyper_u', backingOffset: 0, backingByteLength: 64 }],
    states: rows.states.map(row => ({ id: row.id, componentId: row.componentId, role: row.role,
      valueType: 'i53', schemaVersion: 1, required: true })), resumeRules: definition.resumeRules };
}
function integer(value, min, max, label) {
  if (!Number.isSafeInteger(value) || Object.is(value, -0) || value < min || value > max) {
    fail('TRAINER_STATE_RANGE', 'Invalid committed trainer ' + label);
  }
  return value;
}
function finiteWeights(bytes) {
  if (bytes.length !== 64) fail('TRAINER_WEIGHTS', 'Trainer weights require 64 bytes');
  for (let i = 0; i < 16; i++) if (!Number.isFinite(bytes.readFloatLE(i * 4))) fail('TRAINER_NONFINITE', 'Trainer weights contain nonfinite Float32 data');
}

function decodeTrainerStateEvidence(json) {
  // The independent generic reader enforces its documented 32 MiB canonical
  // string/JSON budgets, exact metadata, owned blob bytes and all SHA256s.
  const decoded = wire.decodeLearnedStateWire(json, { expectedCatalog: createExpectedTrainerCatalog() });
  const weights = Buffer.from(decoded.tensors[0].bytes); // caller owns its copy
  finiteWeights(weights);
  const committedEpoch = integer(decoded.decodedStates.get('committedEpoch'), 0, MAX_EPOCH, 'epoch');
  const timeoutMs = integer(decoded.decodedStates.get('timeoutMs'), 50, 30000, 'timeout');
  return { weights, committedEpoch, timeoutMs, exhausted: committedEpoch === MAX_EPOCH,
    evidence: { wireValid: true, exactTrainerCatalogMatched: true, trainerNumericPoliciesVerified: true,
      schema: decoded.evidence.schema, componentId: COMPONENT_ID, componentSchemaVersion: SCHEMA_VERSION, kernelId: KERNEL_ID,
      architectureFingerprint: decoded.architecture.fingerprint,
      implementationDigest: decoded.architecture.components[0].implementationDigest,
      payloadSHA256: decoded.evidence.payloadSha256, payloadBytes: decoded.evidence.payloadBytes,
      tensorCount: 1, tensorValues: 16, tensorBytes: 64, declaredProjectionPaths: 1, stateCount: 2,
      weightsSHA256: sha(weights), committedEpoch, timeoutMs, exhausted: committedEpoch === MAX_EPOCH,
      completeApplicationCatalog: false, liveEngineObserved: false, restoreExecuted: false, durabilityVerified: false,
      scope: 'Exact declared committed-trainer wire subset only; no full-model continuity, actual engine hydration, worker execution or durable restart claim' } };
}

function copyExpected(expected) {
  const names = ['weights', 'committedEpoch', 'timeoutMs'];
  if (!expected || typeof expected !== 'object' || Array.isArray(expected) || Reflect.ownKeys(expected).length !== names.length) {
    fail('TRAINER_EXPECTED', 'Expected evidence requires exactly weights, committedEpoch and timeoutMs');
  }
  const fields = Object.getOwnPropertyDescriptors(expected), values = {};
  for (const name of names) {
    if (!fields[name] || !Object.hasOwn(fields[name], 'value')) fail('TRAINER_EXPECTED', 'Expected fields must be own data');
    values[name] = fields[name].value;
  }
  const proto = Object.getPrototypeOf(Uint8Array.prototype);
  const get = name => Object.getOwnPropertyDescriptor(proto, name).get.call(values.weights);
  let bytes;
  try {
    const type = Object.getOwnPropertyDescriptor(proto, Symbol.toStringTag).get.call(values.weights);
    if (!['Float32Array', 'Uint8Array'].includes(type) || get('byteLength') !== 64) throw new Error('wrong view');
    const buffer = get('buffer'), offset = get('byteOffset');
    // Shared/resizable/detached sources cannot serve as a coherent oracle.
    const capacity = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get.call(buffer);
    const resizable = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get;
    if (capacity < offset + 64 || resizable?.call(buffer)) throw new Error('unsupported backing');
    bytes = Buffer.from(new Uint8Array(buffer, offset, 64));
  } catch (_) { fail('TRAINER_EXPECTED', 'Expected weights require an attached fixed nonshared 64-byte Float32/Uint8 view'); }
  finiteWeights(bytes);
  return { weights: bytes, committedEpoch: integer(values.committedEpoch, 0, MAX_EPOCH, 'expected epoch'),
    timeoutMs: integer(values.timeoutMs, 50, 30000, 'expected timeout') };
}

function assessTrainerStateEvidence(json, expected) {
  let wanted, actual;
  try { wanted = copyExpected(expected); actual = decodeTrainerStateEvidence(json); }
  catch (error) { return { ok: false, status: 'invalid-evidence', code: error.code || null,
    reason: String(error.message || error).slice(0, 400), completeApplicationCatalog: false }; }
  const differences = [];
  let differingFloat32Values = 0;
  for (let i = 0; i < 16; i++) if (!wanted.weights.subarray(i * 4, i * 4 + 4).equals(actual.weights.subarray(i * 4, i * 4 + 4))) differingFloat32Values++;
  if (differingFloat32Values) differences.push({ id: 'W_hyper_u', kind: 'value-bits', differingFloat32Values });
  if (wanted.committedEpoch !== actual.committedEpoch) differences.push({ id: 'committedEpoch', kind: 'integer-value' });
  if (wanted.timeoutMs !== actual.timeoutMs) differences.push({ id: 'timeoutMs', kind: 'integer-value' });
  return { ok: differences.length === 0, status: differences.length ? 'committed-trainer-mismatch' : 'passed-committed-trainer-subset',
    differences, differingFloat32Values, comparedBytes: 64, comparedStates: 2,
    expectedWeightsSHA256: sha(wanted.weights), actualWeightsSHA256: sha(actual.weights),
    actual: actual.evidence, completeApplicationCatalog: false,
    scope: 'Wire compared to externally supplied exact bytes and scalar values; supplied evidence provenance and complete-model coverage are not established' };
}
module.exports = { COMPONENT_ID, KERNEL_ID, SCHEMA_VERSION, createExpectedTrainerCatalog,
  decodeTrainerStateEvidence, assessTrainerStateEvidence };
