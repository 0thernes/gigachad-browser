'use strict';
// Verification-only independent catalog and raw observer. No production
// codec, registry, adapter, exporter or model is imported by this module.
const { createHash } = require('node:crypto');
const wire = require('./alive-learned-state-wire-evidence.cjs');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const OBSERVATION_SCHEMA = 'gigachad.hub-hydration-evidence.v1';
const COMPONENT_ID = 'trainable-hub-local', SCHEMA_VERSION = 1;
const SNAPSHOT_KEYS = ['creatureId', 'policyId', 'checkpointId', 'logicalTick', 'modelEpoch', 'capturedAt', 'resumeBoundary'];
const ordinal = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const fail = (code, message) => { const error = new TypeError(message); error.code = code; throw error; };
// Actual constructor layout, independently audited before the hub adapter.
const ARENA_VIEWS = [
  ['f64TrajectoryCurr16', 'Float64Array', 16, 0], ['f64TrajectoryPrev16', 'Float64Array', 16, 128],
  ['f64TrajectoryPrev2_16', 'Float64Array', 16, 256], ['f64AdamFirstMoment64', 'Float64Array', 64, 384],
  ['f64AdamSecondMoment64', 'Float64Array', 64, 896], ['f64LossHistory16', 'Float64Array', 16, 1408],
  ['int8QuantizedWeights256', 'Int8Array', 256, 1536], ['u64SpikeTrainLanes8', 'BigUint64Array', 8, 1792],
  ['b158TernaryMorphism256', 'Int8Array', 256, 1856], ['fp16PersistentWeights256', 'Uint16Array', 256, 2112],
  ['f64InterIntraCoupling16x16', 'Float64Array', 256, 2624], ['facultyActivations16', 'Float64Array', 16, 4672],
  ['facultyDrives16', 'Float64Array', 16, 4800]
];
const F32_VIEWS = [
  ['W_perc_enc', 256], ['b_perc_enc', 16], ['W_perc_dec', 256], ['b_perc_dec', 16],
  ['zPerc16', 16], ['zPrev16', 16], ['zPrevPrev16', 16], ['xHat16', 16],
  ['W_dyn1', 384], ['b_dyn1', 16], ['W_dyn2', 256], ['b_dyn2', 16], ['hDyn16', 16], ['zPredNext16', 16],
  ['lastAction8', 8], ['bestReasoningAction8', 8], ['diffusionAlphaBar8', 8],
  ['W_diff1', 272], ['b_diff1', 16], ['W_diff2', 256], ['b_diff2', 16], ['hDiff16', 16], ['diffusedIdeaVec16', 16],
  ['W_gen1', 256], ['b_gen1', 16], ['W_gen2', 256], ['b_gen2', 16], ['hGen16', 16], ['ganSyntheticLatent16', 16],
  ['W_disc1', 256], ['b_disc1', 16], ['W_disc2', 16], ['hDiscReal16', 16], ['hDiscFake16', 16], ['W_aware16', 16],
  ['visionDomGrid8x8', 64], ['visitedGrid8x8', 64], ['samSpatialAffordance16', 16], ['W_icm_inv', 256],
  ['b_icm_inv', 8], ['predActionInv8', 8], ['W_robot_actor', 32], ['b_robot_actor', 2], ['learnedMotorThrust2D', 2], ['predictedFuturePos2D', 2]
];
const NUMBER_FIELDS = [
  'int8QuantScale', 'interIntraCoherenceScore', 'perceptionLossMse', 'observanceClarityPct', 'worldDynamicsLossMse',
  'thoughtCurvatureKappa', 'thoughtTorsionTau', 'thoughtGeodesicAngleRad', 'bestReasoningBranchScore',
  'diffusionScoreLossMse', 'ideaNoveltyScore', 'ideasSynthesizedCount', 'b_disc2', 'ganDiscRealProb', 'ganDiscFakeProb',
  'ganGeneratorLoss', 'ganDiscriminatorLoss', 'selfCriticismScorePct', 'b_aware', 'predictedUncertainty',
  'awarenessCalibrationPct', 'contemplationDepthScore', 'adaptivePlasticityLr', 'recursiveMorphismEigenvalue',
  'recursiveMorphismsCount', 'dreamConsolidationSteps', 'totalBackpropStepsTrained', 'millionParamSlicesUpdatedPerSec',
  'persistentWeightCheckpointsSaved', 'samBestSectorIdx', 'inversePhysicsLossMse', 'icmCuriosityReward',
  'extrinsicForagingReward', 'robotPrevValueEstimate', 'tdAdvantageDelta', 'spatialExplorationCoveragePct'
];
const STRING_FIELDS = ['tensorBackendMode', 'reasoningVerdict', 'activeIdeaSummary', 'selfCriticismVerdict', 'selfAnalysisSummary', 'embodiedRoboticsHeadline'];
const NAME_ARRAYS = [['facultyNames16', 16], ['moeExpertNames8', 8]];
const COUNTERS = ['ideasSynthesizedCount', 'recursiveMorphismsCount', 'dreamConsolidationSteps', 'totalBackpropStepsTrained', 'persistentWeightCheckpointsSaved'];
const NONNEGATIVE_MSE = ['perceptionLossMse', 'worldDynamicsLossMse', 'diffusionScoreLossMse', 'inversePhysicsLossMse'];
const TENSOR_BOUNDS = { f64AdamSecondMoment64: { min: 0 }, diffusionAlphaBar8: { min: 0, max: 1 } };
const CONSTANT_NAMES = {
  facultyNames16: ['F00:SELF_PERCEPTION', 'F01:SPIKING_sLTC', 'F02:SELF_LEARNING', 'F03:SELF_TRAINING',
    'F04:SELF_PLASTICITY', 'F05:SELF_THINKING', 'F06:SELF_REASONING', 'F07:SELF_PERSISTENT_MEMORY',
    'F08:SELF_METACOGNITION', 'F09:SELF_OBSERVANCE', 'F10:SELF_AWARENESS', 'F11:THOUGHT_CURVATURE',
    'F12:SELF_CRITICISM', 'F13:SELF_CONTEMPLATION_ANALYSIS', 'F14:SELF_RECURSIVE_DECURSIVE', 'F15:AFFECT_IDEAS_DREAM_DIFF_GAN'],
  moeExpertNames8: ['EXP0:SELF_PERCEPTION_OBSERVANCE_AUTOENCODER(65K)', 'EXP1:SELF_THINKING_REASONING_THOUGHT_CURVATURE(65K)',
    'EXP2:LATENT_DIFFUSION_DDPM_IDEA_GENERATOR(65K)', 'EXP3:LATENT_GAN_GENERATOR_SYNTHESIS(65K)',
    'EXP4:LATENT_GAN_DISCRIMINATOR_SELF_CRITICISM(65K)', 'EXP5:SELF_AWARENESS_METACOGNITION_CONTEMPLATION(65K)',
    'EXP6:AFFECTIVE_FEELINGS_EMOTIONS_HOMEOSTASIS(65K)', 'EXP7:SELF_RECURSIVE_MORPHISMS_DREAM_CONSOLIDATOR(65K)']
};
const MATRIX_DIMENSIONS = { f64InterIntraCoupling16x16: [16, 16], W_perc_enc: [16, 16], W_perc_dec: [16, 16],
  W_dyn1: [16, 24], W_dyn2: [16, 16], W_diff1: [16, 17], W_diff2: [16, 16], W_gen1: [16, 16], W_gen2: [16, 16],
  W_disc1: [16, 16], visionDomGrid8x8: [8, 8], visitedGrid8x8: [8, 8], W_icm_inv: [8, 32], W_robot_actor: [2, 16] };
// Exact public interpretation is part of the independently pinned digest.
const INTERPRETATION = { kind: 'declared-local-trainable-hub', completeApplicationCatalog: false,
  includes: '58 native views, complete fixed 8192-byte arena including reserved tail, 42 primitive fields and two constant name arrays',
  excludes: 'Replay ring/cursor, external engine and federation graphs, global QRNG state and draws, browser observations/authority, asynchronous operations',
  halfwordInterpretation: 'fp16PersistentWeights256 preserves native Uint16 words; no IEEE Float16 numeric interpretation or conversion is claimed',
  numericDomains: 'Finite floating values; Adam second moments and four squared-error EMA scalars are nonnegative; diffusion alpha-bar is in [0,1]; counters are nonnegative safe integers; sector index is 0..15',
  continuation: 'Further updates require equivalent omitted state, external inputs and random draws',
  publication: 'Synchronous in-place registered writes with readback and best-effort rollback, under a caller-owned startup generation fence; not a whole-model transaction',
  inputs: 'Fenced ordinary non-Proxy own-data records and fixed nonshared native buffers; unknown hub fields are rejected' };
const WIDTHS = { Float64Array: 8, Float32Array: 4, BigUint64Array: 8, Uint16Array: 2, Int8Array: 1 };
function physicalViews() {
  return [...ARENA_VIEWS.map(([id, dtype, length, byteOffset]) => ({ id, dtype, length, byteOffset, byteLength: length * WIDTHS[dtype], backingId: 'mixedArenaBuffer' })),
    ...F32_VIEWS.map(([id, length]) => ({ id, dtype: 'Float32Array', length, byteOffset: 0, byteLength: length * 4, backingId: id }))].sort(ordinal);
}
const RAW_CONTRACT = { views: physicalViews(), numbers: NUMBER_FIELDS, strings: STRING_FIELDS, names: NAME_ARRAYS,
  counters: COUNTERS, constantNames: CONSTANT_NAMES, nonnegativeMse: NONNEGATIVE_MSE, tensorBounds: TENSOR_BOUNDS };

function stateSchema(id) {
  if (COUNTERS.includes(id)) return { type: 'i53', min: 0, max: Number.MAX_SAFE_INTEGER };
  if (id === 'samBestSectorIdx') return { type: 'i53', min: 0, max: 15 };
  if (STRING_FIELDS.includes(id)) return { type: 'string', maxLength: 2048 };
  if (Object.hasOwn(CONSTANT_NAMES, id)) return { type: 'array', items: { type: 'string', maxLength: 128 },
    minLength: CONSTANT_NAMES[id].length, maxLength: CONSTANT_NAMES[id].length, unique: true };
  if (NONNEGATIVE_MSE.includes(id)) return { type: 'f64', min: 0 };
  return { type: 'f64' };
}
function createExpectedHubCatalog() {
  const views = [...ARENA_VIEWS.map(([id, dtype, length, byteOffset]) => ({ id, dtype, length, byteOffset, arena: true })),
    ...F32_VIEWS.map(([id, length]) => ({ id, dtype: 'Float32Array', length, byteOffset: 0, arena: false }))];
  const tensors = views.map(row => ({ id: row.id, componentId: COMPONENT_ID, role: row.arena ? 'mixed-arena-view' : 'local-hub-view',
    paths: [{ root: 'hub', keys: [row.id] }], dtype: row.dtype, dimensions: (MATRIX_DIMENSIONS[row.id] || [row.length]).slice(),
    backingGroup: row.arena ? 'mixedArena' : row.id, backingOffset: row.byteOffset,
    backingByteLength: row.arena ? 8192 : row.length * 4, policy: { format: 'native', finite: true, ...(TENSOR_BOUNDS[row.id] || {}) } }));
  tensors.push({ id: 'reservedArenaTail', componentId: COMPONENT_ID, role: 'reserved-arena-bytes',
    paths: [{ root: 'arena', keys: ['reservedTail'] }], dtype: 'Uint8Array', dimensions: [3264],
    backingGroup: 'mixedArena', backingOffset: 4928, backingByteLength: 8192, policy: { format: 'native', finite: true } });
  const stateIds = [...NUMBER_FIELDS, ...STRING_FIELDS, ...NAME_ARRAYS.map(row => row[0])];
  const states = stateIds.map(id => ({ id, componentId: COMPONENT_ID,
    role: Object.hasOwn(CONSTANT_NAMES, id) ? 'constant-names' : COUNTERS.includes(id) ? 'learning-counter' : 'local-hub-state',
    paths: [{ root: 'hub', keys: [id] }], schemaVersion: 1, required: true, schema: stateSchema(id) }));
  const rows = { tensors, states, families: [], resumeRules: [] };
  const fieldDispositions = Object.fromEntries([...views.map(row => [row.id, 'exact-native-view']), ...stateIds.map(id => [id, 'exact-state']),
    ['mixedArenaBuffer', 'bound-backing-including-reserved-tail'], ['replayRing32', 'separate-replay-component'], ['replayWritePtr', 'separate-replay-component']]);
  const implementationDigest = wire.fingerprintDescriptorDefinition({ componentId: COMPONENT_ID, schemaVersion: 1, ...rows,
    constantNames: CONSTANT_NAMES, fieldDispositions, interpretation: INTERPRETATION });
  const definition = { registryVersion: 1, components: [{ id: COMPONENT_ID, schemaVersion: 1, implementationDigest, present: true }],
    tensors: tensors.sort(ordinal), states: states.sort(ordinal), families: [], resumeRules: [] };
  const fingerprint = wire.fingerprintDescriptorDefinition(definition);
  if (implementationDigest !== '5ddc469e68569a9ae3a0d9e5777cbb942f71929813ad528e74323d4529e2d5db' ||
      fingerprint !== 'e8710c0a39c9eda69205bec2e90a87e2d1021cb85cf1aa5ed549188a0046d5e3') fail('HUB_CATALOG_CHANGED', 'Independent hub catalog changed; explicit contract review required');
  return { descriptorDefinition: definition, architecture: { registryVersion: 1, fingerprint, components: definition.components },
    tensors: tensors.map(row => { const length = row.dimensions.reduce((a, b) => a * b, 1); return { id: row.id, componentId: COMPONENT_ID, role: row.role,
      paths: row.paths, dtype: row.dtype, dimensions: row.dimensions, length, byteLength: length * (WIDTHS[row.dtype] || 1), byteOrder: 'LE',
      backingGroup: row.backingGroup, backingOffset: row.backingOffset, backingByteLength: row.backingByteLength }; }),
    states: states.map(row => ({ id: row.id, componentId: COMPONENT_ID, role: row.role, valueType: row.schema.type, schemaVersion: 1, required: true })), resumeRules: [] };
}

// This function receives only an embedded static contract. It has no closure
// dependencies, and its enclosing exported function can be injected verbatim.
function observeHub(runtime, contract) {
  const schema = 'gigachad.hub-hydration-evidence.v1';
  const reject = (code, message) => { const error = new TypeError(message); error.code = code; throw error; };
  const own = (object, key, writable = false) => {
    const d = Object.getOwnPropertyDescriptor(object, key);
    if (!d || !Object.prototype.hasOwnProperty.call(d, 'value') || writable && d.writable !== true) reject('HUB_OWN_DATA', 'Hub observation requires own data: ' + key);
    return d.value;
  };
  const exact = (object, expected, label) => {
    const keys = Reflect.ownKeys(object);
    if (keys.length !== expected.length || keys.some(key => typeof key !== 'string' || !expected.includes(key))) reject('HUB_SHAPE', 'Unexpected ' + label + ' keys, symbols or holes');
  };
  try {
    if (new Uint8Array(new Uint16Array([1]).buffer)[0] !== 1) reject('HUB_ENDIAN', 'Little-endian host required');
    const hub = own(runtime, 'trainableAlifeNeuralHub');
    if (!hub || ![Object.prototype, null].includes(Object.getPrototypeOf(hub))) reject('HUB_SHAPE', 'Ordinary hub object required');
    exact(hub, ['mixedArenaBuffer', 'replayRing32', 'replayWritePtr', ...contract.views.map(row => row.id),
      ...contract.numbers, ...contract.strings, ...contract.names.map(row => row[0])], 'hub');
    own(hub, 'replayRing32'); own(hub, 'replayWritePtr'); // Classified, owned by the separate replay component.
    const byteLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get;
    const resizable = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get;
    const bufferInfo = (buffer, length) => {
      if (Object.getPrototypeOf(buffer) !== ArrayBuffer.prototype || byteLength.call(buffer) !== length || resizable?.call(buffer)) reject('HUB_BACKING', 'Fixed native nonshared hub backing required');
      exact(buffer, [], 'backing'); return new Uint8Array(buffer).slice();
    };
    const arena = own(hub, 'mixedArenaBuffer'), copied = new Map([['mixedArenaBuffer', bufferInfo(arena, 8192)]]);
    const seenBuffers = new Set([arena]), seenViews = new Set(), views = [];
    const typed = Object.getPrototypeOf(Float32Array.prototype), read = (view, name) => Object.getOwnPropertyDescriptor(typed, name).get.call(view);
    const constructors = { Float64Array, Float32Array, BigUint64Array, Uint16Array, Int8Array };
    for (const row of contract.views) {
      const view = own(hub, row.id), C = constructors[row.dtype];
      if (Object.getPrototypeOf(view) !== C.prototype || read(view, Symbol.toStringTag) !== row.dtype || read(view, 'length') !== row.length ||
          read(view, 'byteLength') !== row.byteLength || read(view, 'byteOffset') !== row.byteOffset || seenViews.has(view)) reject('HUB_VIEW', 'Wrong hub view identity/layout: ' + row.id);
      exact(view, Array.from({ length: row.length }, (_, i) => String(i)), 'view'); seenViews.add(view);
      const backing = read(view, 'buffer');
      if (row.backingId === 'mixedArenaBuffer') {
        if (backing !== arena) reject('HUB_ALIAS', 'Arena view has different backing: ' + row.id);
      } else {
        if (seenBuffers.has(backing)) reject('HUB_ALIAS', 'Standalone hub backing is aliased: ' + row.id);
        seenBuffers.add(backing); copied.set(row.id, bufferInfo(backing, row.byteLength));
      }
      views.push({ ...row });
    }
    for (const row of contract.views) {
      if (row.dtype !== 'Float32Array' && row.dtype !== 'Float64Array') continue;
      const bytes = copied.get(row.backingId), view = new DataView(bytes.buffer, bytes.byteOffset + row.byteOffset, row.byteLength);
      const width = row.dtype === 'Float64Array' ? 8 : 4;
      const bounds = contract.tensorBounds[row.id] || {};
      for (let i = 0; i < row.length; i++) {
        const value = width === 8 ? view.getFloat64(i * 8, true) : view.getFloat32(i * 4, true);
        if (!Number.isFinite(value)) reject('HUB_NONFINITE', 'Nonfinite hub tensor: ' + row.id);
        if (bounds.min !== undefined && value < bounds.min || bounds.max !== undefined && value > bounds.max) reject('HUB_DOMAIN', 'Hub tensor domain rejected: ' + row.id);
      }
    }
    // Own exact primitive values and dense name arrays before any formatting.
    const numbers = {}, states = {}, nameArrays = new Set();
    for (const id of contract.numbers) {
      const value = own(hub, id, true);
      if (typeof value !== 'number' || !Number.isFinite(value)) reject('HUB_NONFINITE', 'Finite hub number required: ' + id);
      if ((contract.counters.includes(id) || id === 'samBestSectorIdx') && (!Number.isSafeInteger(value) || Object.is(value, -0) || value < 0 || id === 'samBestSectorIdx' && value > 15)) reject('HUB_STATE', 'Invalid hub integer: ' + id);
      if (contract.nonnegativeMse.includes(id) && value < 0) reject('HUB_DOMAIN', 'Negative hub MSE: ' + id);
      numbers[id] = value;
    }
    for (const id of contract.strings) {
      const value = own(hub, id, true);
      if (typeof value !== 'string' || value.length > 2048) reject('HUB_STATE', 'Bounded hub string required: ' + id);
      states[id] = value;
    }
    for (const [id, length] of contract.names) {
      const value = own(hub, id, true);
      if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || own(value, 'length') !== length || nameArrays.has(value)) reject('HUB_STATE', 'Distinct dense hub names array required: ' + id);
      exact(value, ['length', ...Array.from({ length }, (_, i) => String(i))], 'names array'); nameArrays.add(value);
      const copy = [];
      for (let i = 0; i < length; i++) {
        const item = own(value, String(i));
        if (item !== contract.constantNames[id][i]) reject('HUB_STATE', 'Exact versioned hub name required: ' + id);
        copy.push(item);
      }
      states[id] = copy;
    }
    const hex = bytes => { let value = ''; for (let i = 0; i < bytes.length; i++) value += bytes[i].toString(16).padStart(2, '0'); return value; };
    for (const id of contract.numbers) {
      const bytes = new ArrayBuffer(8); new DataView(bytes).setFloat64(0, numbers[id], true);
      states[id] = { $type: 'f64', hex: hex(new Uint8Array(bytes)) };
    }
    const backings = Array.from(copied, ([id, bytes]) => ({ id, byteLength: bytes.length, hex: hex(bytes) })).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    return { schema, ok: true, byteOrder: 'LE', backings, views, states,
      totals: { views: 58, backings: 46, uniqueBytes: 21368, stateFields: 44 } };
  } catch (failure) {
    return { schema, ok: false, code: typeof failure.code === 'string' ? failure.code : 'HUB_CAPTURE', reason: String(failure.message || failure).slice(0, 400) };
  }
}
const captureHubHydration = new Function('return function captureHubHydration(runtime) { return (' + observeHub.toString() + ')(runtime,' + JSON.stringify(RAW_CONTRACT) + '); }')();

function dataRecord(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('HUB_EVIDENCE', 'Expected ' + label + ' record');
  const names = Reflect.ownKeys(value);
  if (names.length !== keys.length || names.some(key => typeof key !== 'string' || !keys.includes(key))) fail('HUB_EVIDENCE', 'Unexpected ' + label + ' fields');
  const result = Object.create(null);
  for (const key of keys) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (!d || !Object.hasOwn(d, 'value') || !d.enumerable) fail('HUB_EVIDENCE', 'Expected enumerable own-data evidence: ' + key);
    result[key] = d.value;
  }
  return result;
}
function dataArray(value, length, label) {
  if (!Array.isArray(value) || Object.getOwnPropertyDescriptor(value, 'length')?.value !== length || Reflect.ownKeys(value).length !== length + 1) fail('HUB_EVIDENCE', 'Invalid bounded ' + label + ' array');
  const result = [];
  for (let i = 0; i < length; i++) {
    const d = Object.getOwnPropertyDescriptor(value, String(i));
    if (!d || !Object.hasOwn(d, 'value') || !d.enumerable) fail('HUB_EVIDENCE', 'Evidence array hole/accessor');
    result.push(d.value);
  }
  return result;
}
function fromHex(text, length) {
  if (typeof text !== 'string' || text.length !== length * 2 || !/^[a-f0-9]+$/.test(text)) fail('HUB_HEX', 'Invalid bounded hub byte encoding');
  return Buffer.from(text, 'hex');
}
function numberPolicy(value, id) {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail('HUB_NONFINITE', 'Nonfinite hub number: ' + id);
  if ((COUNTERS.includes(id) || id === 'samBestSectorIdx') && (!Number.isSafeInteger(value) || Object.is(value, -0) || value < 0 || id === 'samBestSectorIdx' && value > 15)) fail('HUB_STATE', 'Invalid hub integer: ' + id);
  if (NONNEGATIVE_MSE.includes(id) && value < 0) fail('HUB_DOMAIN', 'Negative hub MSE: ' + id);
}
function tensorPolicy(bytes, row) {
  if (row.dtype !== 'Float32Array' && row.dtype !== 'Float64Array') return;
  const width = row.dtype === 'Float32Array' ? 4 : 8;
  const bounds = TENSOR_BOUNDS[row.id] || {};
  for (let i = 0; i < bytes.length; i += width) {
    const value = width === 4 ? bytes.readFloatLE(i) : bytes.readDoubleLE(i);
    if (!Number.isFinite(value)) fail('HUB_NONFINITE', 'Nonfinite hub tensor: ' + row.id);
    if (bounds.min !== undefined && value < bounds.min || bounds.max !== undefined && value > bounds.max) fail('HUB_DOMAIN', 'Hub tensor domain rejected: ' + row.id);
  }
}
function stateValue(value, id, raw) {
  if (NUMBER_FIELDS.includes(id)) {
    if (raw) {
      const tag = dataRecord(value, ['$type', 'hex'], 'raw number');
      if (tag.$type !== 'f64') fail('HUB_STATE', 'Raw hub number must preserve Float64 bytes');
      const bytes = fromHex(tag.hex, 8); numberPolicy(bytes.readDoubleLE(), id);
      return { $type: 'f64', hex: tag.hex };
    }
    numberPolicy(value, id); const bytes = Buffer.alloc(8); bytes.writeDoubleLE(value); return { $type: 'f64', hex: bytes.toString('hex') };
  }
  if (STRING_FIELDS.includes(id)) {
    if (typeof value !== 'string' || value.length > 2048) fail('HUB_STATE', 'Bounded hub string required: ' + id); return value;
  }
  const expected = CONSTANT_NAMES[id], names = dataArray(value, expected.length, 'constant names');
  if (names.some((name, i) => name !== expected[i])) fail('HUB_STATE', 'Exact versioned names required: ' + id);
  return names;
}
function copyObservation(value) {
  const status = Object.getOwnPropertyDescriptor(value || {}, 'ok');
  if (status && Object.hasOwn(status, 'value') && status.value === false) fail('HUB_CAPTURE_FAILED', 'The first direct hub observation failed');
  const source = dataRecord(value, ['schema', 'ok', 'byteOrder', 'backings', 'views', 'states', 'totals'], 'hub observation');
  if (source.schema !== OBSERVATION_SCHEMA || source.ok !== true || source.byteOrder !== 'LE') fail('HUB_EVIDENCE', 'Invalid hub observation schema/status/byte order');
  const totals = dataRecord(source.totals, ['views', 'backings', 'uniqueBytes', 'stateFields'], 'totals');
  if (totals.views !== 58 || totals.backings !== 46 || totals.uniqueBytes !== 21368 || totals.stateFields !== 44) fail('HUB_EVIDENCE', 'Hub observation totals disagree with independent catalog');
  const expectedViews = physicalViews(), backings = new Map();
  const expectedBackings = [{ id: 'mixedArenaBuffer', byteLength: 8192 }, ...F32_VIEWS.map(([id, length]) => ({ id, byteLength: length * 4 }))].sort(ordinal);
  dataArray(source.backings, 46, 'backings').forEach((value, i) => {
    const row = dataRecord(value, ['id', 'byteLength', 'hex'], 'backing'), expected = expectedBackings[i];
    if (row.id !== expected.id || row.byteLength !== expected.byteLength) fail('HUB_BACKING', 'Wrong hub backing roster/order/capacity');
    backings.set(row.id, fromHex(row.hex, row.byteLength));
  });
  dataArray(source.views, 58, 'views').forEach((value, i) => {
    const expected = expectedViews[i], row = dataRecord(value, ['id', 'dtype', 'length', 'byteOffset', 'byteLength', 'backingId'], 'view');
    if (Object.keys(expected).some(key => !Object.is(row[key], expected[key]))) fail('HUB_VIEW', 'Observed hub view/alias topology differs from catalog');
    tensorPolicy(backings.get(row.backingId).subarray(row.byteOffset, row.byteOffset + row.byteLength), row);
  });
  const stateIds = [...NUMBER_FIELDS, ...STRING_FIELDS, ...NAME_ARRAYS.map(row => row[0])];
  const inputStates = dataRecord(source.states, stateIds, 'states'), states = Object.create(null);
  for (const id of stateIds) states[id] = stateValue(inputStates[id], id, true);
  return { backings, views: expectedViews, states };
}
function decodeHubStateEvidence(json) {
  const catalog = createExpectedHubCatalog(), decoded = wire.decodeLearnedStateWire(json, { expectedCatalog: catalog });
  if (decoded.stateManifest.some((row, i) => row.id !== catalog.states[i].id)) fail('HUB_STATE_ORDER', 'Hub states must be ordinal sorted');
  const backings = new Map(), tensors = [];
  for (const source of decoded.tensors) {
    const bytes = Buffer.from(source.bytes); tensorPolicy(bytes, source);
    const id = source.backingGroup === 'mixedArena' ? 'mixedArenaBuffer' : source.backingGroup;
    if (!backings.has(id)) backings.set(id, Buffer.alloc(source.backingByteLength));
    bytes.copy(backings.get(id), source.backingOffset); tensors.push({ ...source, bytes });
  }
  const states = Object.create(null);
  for (const row of catalog.states) states[row.id] = stateValue(decoded.decodedStates.get(row.id), row.id, false);
  return { snapshot: { ...decoded.snapshot }, backings, tensors, states, views: physicalViews(),
    evidence: { wireValid: true, exactHubCatalogMatched: true, hubNumericPoliciesVerified: true, schema: decoded.evidence.schema,
      componentId: COMPONENT_ID, componentSchemaVersion: 1, architectureFingerprint: decoded.architecture.fingerprint,
      implementationDigest: decoded.architecture.components[0].implementationDigest, payloadSHA256: decoded.evidence.payloadSha256,
      payloadBytes: decoded.evidence.payloadBytes, tensorCount: 59, actualNativeViews: 58, backingCount: 46, tensorBytes: 21368, uniqueBackingBytes: 21368,
      arenaBytes: 8192, reservedArenaBytes: 3264, reservedArenaSHA256: sha(backings.get('mixedArenaBuffer').subarray(4928)), stateCount: 44,
      completeApplicationCatalog: false, liveEngineObserved: false, restoreExecuted: false, durabilityVerified: false,
      scope: 'Exact declared local hub subset including reserved arena bytes; replay, external models, QRNG, future outputs and durable restart are not established' } };
}
function compareOwned(before, after) {
  let changedBackingBytes = 0;
  const changedBackingIds = [], changedStateIds = [], differences = [];
  for (const [id, bytes] of before.backings) {
    const next = after.backings.get(id); let changed = 0;
    for (let i = 0; i < bytes.length; i++) if (bytes[i] !== next[i]) changed++;
    if (changed) { changedBackingBytes += changed; changedBackingIds.push(id); differences.push({ id, kind: 'backing-bytes', changedBytes: changed }); }
  }
  for (const id of Object.keys(before.states).sort()) {
    // Both graphs have already been copied/validated into owned primitive data.
    if (JSON.stringify(before.states[id]) !== JSON.stringify(after.states[id])) { changedStateIds.push(id); differences.push({ id, kind: 'state-value' }); }
  }
  return { changedBackingBytes, changedBackingIds: changedBackingIds.sort(), changedStateIds, differences };
}
function invalid(error) {
  return { ok: false, status: 'invalid-evidence', code: error.code || 'HUB_EVIDENCE', reason: String(error.message).slice(0, 400),
    arraysChecked: 0, elementsChecked: 0, elementsDifferent: 0, comparedBytes: 0, comparedStates: 0, completeApplicationCatalog: false };
}
function compareHubHydration(before, after) {
  try {
    const result = compareOwned(copyObservation(before), copyObservation(after));
    return { ok: true, status: 'compared-hub-subset', equal: result.changedBackingBytes === 0 && result.changedStateIds.length === 0,
      ...result, comparedBytes: 21368, comparedStates: 44, actualNativeViews: 58, completeApplicationCatalog: false,
      scope: 'Two supplied raw hub observations only; state evolution is not proof of learning quality, equivalent future outputs or durable restart' };
  } catch (error) { return invalid(error); }
}
function assessHubStateEvidence(json, observation, { expectedSnapshot } = {}) {
  let expected, observed, identity;
  try {
    observed = copyObservation(observation);
    if (expectedSnapshot !== undefined) identity = dataRecord(expectedSnapshot, SNAPSHOT_KEYS, 'expected snapshot');
    expected = decodeHubStateEvidence(json);
  } catch (error) { return invalid(error); }
  const compared = compareOwned(expected, observed), differences = compared.differences.slice(), comparisons = [];
  if (identity) for (const key of SNAPSHOT_KEYS) if (!Object.is(expected.snapshot[key], identity[key])) differences.push({ id: 'snapshot.' + key, kind: 'snapshot-identity' });
  let elementsChecked = 0, elementsDifferent = 0;
  for (const row of expected.tensors) {
    const backingId = row.backingGroup === 'mixedArena' ? 'mixedArenaBuffer' : row.backingGroup;
    const actual = observed.backings.get(backingId).subarray(row.backingOffset, row.backingOffset + row.byteLength), width = row.byteLength / row.length;
    let changed = 0;
    for (let i = 0; i < row.length; i++) if (!row.bytes.subarray(i * width, (i + 1) * width).equals(actual.subarray(i * width, (i + 1) * width))) changed++;
    elementsChecked += row.length; elementsDifferent += changed;
    comparisons.push({ id: row.id, ok: changed === 0, elementsCompared: row.length, elementsDifferent: changed, expectedBytesSHA256: sha(row.bytes), observedBytesSHA256: sha(actual) });
  }
  return { ok: differences.length === 0, status: differences.length ? 'hub-mismatch' : 'passed-hub-subset',
    arraysChecked: 59, actualNativeViews: 58, elementsChecked, elementsDifferent, comparedBytes: 21368, comparedStates: 44,
    changedBackingBytes: compared.changedBackingBytes, changedBackingIds: compared.changedBackingIds, changedStateIds: compared.changedStateIds,
    differences, comparisons, actual: expected.evidence, snapshotMatched: identity ? !differences.some(row => row.kind === 'snapshot-identity') : null,
    completeApplicationCatalog: false, scope: 'Supplied hub wire compared with direct observation only; provenance, complete application continuity and durable restart require separate evidence' };
}

module.exports = { COMPONENT_ID, SCHEMA_VERSION, createExpectedHubCatalog, captureHubHydration,
  decodeHubStateEvidence, assessHubStateEvidence, compareHubHydration };
