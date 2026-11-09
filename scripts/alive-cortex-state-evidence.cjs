'use strict';
// Independent verification only. Production adapters/codecs are not imported.
const { createHash } = require('node:crypto');
const wire = require('./alive-learned-state-wire-evidence.cjs');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const OBSERVATION_SCHEMA = 'gigachad.cortex-hydration-evidence.v1';
const SNAPSHOT_KEYS = ['creatureId', 'policyId', 'checkpointId', 'logicalTick', 'modelEpoch', 'capturedAt', 'resumeBoundary'];
const TOTAL_BYTES = 4994760, VIEW_COUNT = 47, STATE_COUNT = 43;
const ordinal = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const fail = (code, message) => { const error = new TypeError(message); error.code = code; throw error; };
const COMPONENT_ID = 'deep-cortex-connectome', SCHEMA_VERSION = 1;
// Independent transcription of actual allocations, including the eager cold
// state block. No source parser or production module supplies the oracle roster.
const DC_FLOATS = [
  ['x64', [64]], ['h256', [256]], ['h128', [128]], ['rssmH', [128]], ['rssmZPrior', [128]], ['rssmZPost', [128]],
  ['nextRH', [128]], ['actH', [128]], ['decX64', [64]], ['act32', [32]], ['masterCmd64', [64]], ['attnWeights8', [8]],
  ['W_enc1', [256, 64]], ['b_enc1', [256]], ['ln1_g', [256]], ['W_enc2', [128, 256]], ['b_enc2', [128]], ['ln2_g', [128]],
  ['W_rssm_rec', [128, 128]], ['W_rssm_in', [128, 128]], ['W_prior', [128, 128]], ['W_post', [128, 128]],
  ['W_dec', [64, 128]], ['W_attn_qkv', [192, 64]], ['W_attn_out', [64, 64]], ['W_actor_h', [128, 128]],
  ['W_actor_out', [32, 128]], ['W_critic_h', [64, 128]], ['W_critic_out', [1, 64]], ['M_hopfield', [128, 128]],
  ['W_moe_experts', [2048, 256]], ['W_connectome_synapses', [512, 512]], ['W_stdp_elig', [512, 512]],
  ['W_browser_master', [64, 128]], ['W_body_genome', [51, 64]], ['moeInput256', [256]], ['moeResidual256', [256]]
];
const DC_BYTES = [['moeCoveragePhases8', [8]], ['moeCoverageMasks8', [8]], ['attentionQkvCoverage768', [768]], ['attentionOutputCoverage512', [512]]];
const CN_FLOATS = [['v512', [512]], ['trace512', [512]], ['neuropilRates6', [6]]];
const CN_BYTES = [['spikes512', [512]], ['axonCoveragePhases512', [512]], ['axonCoverageMasks512', [512]]];
const DC_NUMBERS = ['hopfieldWritePtr', 'criticValue', 'rssmKlDivergence', 'imaginedHorizon5Return', 'gradNormL2', 'totalParams', 'totalBytes',
  'moeExplorationCursor', 'moeParameterVisits', 'moeUniqueParametersVisited', 'moeParameterVisitsThisStep', 'moeParameterCoveragePct',
  'attentionQkvPhase', 'attentionOutputPhase', 'attentionQkvUniqueParameters', 'attentionOutputUniqueParameters', 'attentionParameterVisits',
  'attentionParameterVisitsThisStep', 'attentionParameterCoveragePct', 'cortexCoverageStep', 'cortexPairedReadMask', 'cortexGradientMask',
  'cortexPairedWeightVisitsThisStep', 'cortexGradientUpdatesThisStep'];
const DC_STRINGS = ['moeCoverageScope', 'attentionCoverageScope', 'hopfieldReadoutScope', 'cortexCoverageScope'];
const DC_ARRAYS = ['topMoEExperts', 'moeActiveExpertIndices', 'moeActiveGates'];
const CN_NUMBERS = ['totalSynapses', 'activeSpikesCount', 'activeSynapsesTraversed', 'stdpUpdatesCount', 'meanSynapticWeight',
  'axonalPresynapticCursor', 'synapseVisits', 'uniqueSynapsesTraversed', 'processedPresynapticSpikes', 'synapseCoveragePct'];
const CN_STRINGS = ['synapseCoverageScope'], CN_ARRAYS = ['neuropilNames'];
const NEUROPIL_NAMES = ['CX_ELLIPSOID_RING(0..85)', 'MB_KENYON_SPARSE(86..171)', 'HIP_CA3_CA1_LOOP(172..257)',
  'CTX_PYRAMIDAL_L23_L5(258..343)', 'BG_STRIATAL_D1_D2(344..429)', 'CER_PURKINJE_ERR(430..511)'];
const EXPERT_LABELS = ['EXP0:DOM_TOPOLOGY', 'EXP1:FLYWIRE_RING', 'EXP2:HIPPOCAMPAL_MEM', 'EXP3:HDC1024_ANALOGY',
  'EXP4:SVO_CAUSAL', 'EXP5:ALLOSTATIC_VISCERA', 'EXP6:VERLET_LOCOMOTION', 'EXP7:SOVEREIGN_MASTER'];
const INTERPRETATION = { kind: 'declared-local-cortex-connectome', completeApplicationCatalog: false,
  includes: '47 standalone native views, retained traversal history, 43 scalar/array state rows, and three connectome aliases into owned matrices',
  primaryAliases: 'Actor and critic aliases are identity-only bindings; their bytes belong to the primary component and are neither captured nor fenced here',
  excludes: 'Primary tensor bytes, other model components, global RNG, browser authority, external observations and input/order history, pending operations',
  continuation: 'Further numerical updates require independently equivalent omitted state and inputs; local storage does not establish whole-model continuation',
  nativeProperties: 'Custom JavaScript properties on native views/buffers are excluded non-model metadata and ignored without invoking them; native type/storage intrinsics determine all captured bytes',
  numericDomains: 'Finite floating storage; bounded phases/cursors/flags and nonnegative safe counters; nonnegative KL/gradient/mean-absolute-weight; exact coverage receipts match retained masks; populated expert labels match selected indices and paired gates; finite imported matrix weights have no invented global clamp',
  publication: 'In-place registered writes under a caller-owned generation fence with readback and best-effort verified rollback; not a whole-model transaction',
  inputs: 'Ordinary non-Proxy cortex/connectome own-data records and fixed nonshared native backings; unknown graph fields rejected' };
const INTEGER_BOUNDS = {
  'dc.hopfieldWritePtr': 127, 'dc.totalParams': 1245184, 'dc.totalBytes': 4980736, 'dc.moeExplorationCursor': 7,
  'dc.moeParameterVisits': Number.MAX_SAFE_INTEGER, 'dc.moeUniqueParametersVisited': 524288, 'dc.moeParameterVisitsThisStep': 16384,
  'dc.attentionQkvPhase': 767, 'dc.attentionOutputPhase': 511, 'dc.attentionQkvUniqueParameters': 12288,
  'dc.attentionOutputUniqueParameters': 4096, 'dc.attentionParameterVisits': Number.MAX_SAFE_INTEGER,
  'dc.attentionParameterVisitsThisStep': 24, 'dc.cortexCoverageStep': Number.MAX_SAFE_INTEGER, 'dc.cortexPairedReadMask': 3,
  'dc.cortexGradientMask': 255, 'dc.cortexPairedWeightVisitsThisStep': 32768, 'dc.cortexGradientUpdatesThisStep': 1536,
  'cn.totalSynapses': 262144, 'cn.activeSpikesCount': 512, 'cn.activeSynapsesTraversed': 262144, 'cn.stdpUpdatesCount': Number.MAX_SAFE_INTEGER,
  'cn.axonalPresynapticCursor': 511, 'cn.synapseVisits': Number.MAX_SAFE_INTEGER, 'cn.uniqueSynapsesTraversed': 262144, 'cn.processedPresynapticSpikes': 44
};
const CONSTANT_NUMBERS = { 'dc.totalParams': 1245184, 'dc.totalBytes': 4980736, 'cn.totalSynapses': 262144 };
const FLOAT_BOUNDS = { 'dc.criticValue': [-1, 1], 'dc.rssmKlDivergence': [0, 2], 'dc.gradNormL2': [0],
  'dc.moeParameterCoveragePct': [0, 100], 'dc.attentionParameterCoveragePct': [0, 100], 'cn.meanSynapticWeight': [0], 'cn.synapseCoveragePct': [0, 100] };
function scalarSchema(root, field) {
  const id = root + '.' + field;
  if (Object.hasOwn(INTEGER_BOUNDS, id)) return { type: 'i53', min: CONSTANT_NUMBERS[id] || 0, max: INTEGER_BOUNDS[id] };
  if (DC_STRINGS.includes(field) || CN_STRINGS.includes(field)) return { type: 'string', maxLength: 512 };
  if (field === 'topMoEExperts') return { type: 'array', items: { type: 'string', maxLength: 64 }, minLength: 2, maxLength: 2, unique: true };
  if (field === 'neuropilNames') return { type: 'array', items: { type: 'string', maxLength: 64 }, minLength: 6, maxLength: 6, unique: true };
  if (field === 'moeActiveExpertIndices') return { type: 'array', items: { type: 'i53', min: 0, max: 7 }, minLength: 0, maxLength: 2, unique: true };
  if (field === 'moeActiveGates') return { type: 'array', items: { type: 'f64', min: 0, max: 1 }, minLength: 0, maxLength: 2 };
  const bounds = FLOAT_BOUNDS[id]; return { type: 'f64', ...(bounds ? { min: bounds[0], ...(bounds.length > 1 ? { max: bounds[1] } : {}) } : {}) };
}
function tensorDomain(root, field) {
  const ranges = { 'dc.attnWeights8': [0, 1], 'cn.trace512': [0, 1.5], 'cn.neuropilRates6': [0, 1],
    'dc.moeCoveragePhases8': [0, 7], 'cn.axonCoveragePhases512': [0, 7], 'dc.attentionQkvCoverage768': [0, 1],
    'dc.attentionOutputCoverage512': [0, 1], 'cn.spikes512': [0, 1] };
  const range = ranges[root + '.' + field]; return { format: 'native', finite: true, ...(range ? { min: range[0], max: range[1] } : {}) };
}
const LEARNED_MATRIX_IDS = new Set(['dc.W_dec', 'dc.W_actor_out', 'dc.W_connectome_synapses', 'dc.W_moe_experts']);
const ALIASES = [
  { path: { root: 'cn', keys: ['synWeights262K'] }, targetId: 'dc.W_connectome_synapses' },
  { path: { root: 'cn', keys: ['synapticWeights'] }, targetId: 'dc.W_connectome_synapses' },
  { path: { root: 'cn', keys: ['eligibilityTraces'] }, targetId: 'dc.W_stdp_elig' },
  { path: { root: 'dc', keys: ['W_actor'] }, targetId: 'W_actor', runtimeField: 'W_actor', length: 80 },
  { path: { root: 'dc', keys: ['W_critic'] }, targetId: 'W_critic', runtimeField: 'W_critic', length: 16 }
];
function allocatedRows() {
  return [['dc', 'Float32Array', DC_FLOATS], ['dc', 'Uint8Array', DC_BYTES], ['cn', 'Float32Array', CN_FLOATS], ['cn', 'Uint8Array', CN_BYTES]]
    .flatMap(([root, dtype, entries]) => entries.map(([field, dimensions]) => {
      const length = dimensions.reduce((a, b) => a * b, 1), id = root + '.' + field;
      return { id, root, field, dtype, dimensions: dimensions.slice(), length, byteLength: length * (dtype === 'Float32Array' ? 4 : 1), policy: tensorDomain(root, field) };
    }));
}
function scalarRows() {
  return [['dc', DC_NUMBERS], ['cn', CN_NUMBERS], ['dc', DC_STRINGS], ['cn', CN_STRINGS], ['dc', DC_ARRAYS], ['cn', CN_ARRAYS]]
    .flatMap(([root, fields]) => fields.map(field => ({ id: root + '.' + field, root, field, schema: scalarSchema(root, field),
      ...(field === 'neuropilNames' ? { constant: NEUROPIL_NAMES.slice() } : {}) })));
}
const RAW_CONTRACT = {
  roots: { dc: 'deepCortex', cn: 'connectome512' }, expertLabels: EXPERT_LABELS,
  views: allocatedRows().sort(ordinal), states: scalarRows().sort(ordinal), aliases: ALIASES,
  fields: {
    dc: [...DC_FLOATS, ...DC_BYTES].map(row => row[0]).concat(DC_NUMBERS, DC_STRINGS, DC_ARRAYS, ['W_actor', 'W_critic']),
    cn: [...CN_FLOATS, ...CN_BYTES].map(row => row[0]).concat(CN_NUMBERS, CN_STRINGS, CN_ARRAYS, ['synWeights262K', 'synapticWeights', 'eligibilityTraces'])
  }
};
function createExpectedCortexCatalog() {
  const allocated = allocatedRows(), stateRows = scalarRows();
  const tensors = allocated.map(row => ({ id: row.id, componentId: COMPONENT_ID, role: row.root === 'dc' ? 'cortex-local-view' : 'connectome-local-view',
    paths: [{ root: row.root, keys: [row.field] }, ...ALIASES.filter(alias => !alias.runtimeField && alias.targetId === row.id).map(alias => ({ root: alias.path.root, keys: alias.path.keys.slice() }))],
    dtype: row.dtype, dimensions: row.dimensions, backingGroup: row.id, backingOffset: 0, backingByteLength: row.byteLength, policy: row.policy }));
  const states = stateRows.map(row => ({ id: row.id, componentId: COMPONENT_ID, role: row.root === 'dc' ? 'cortex-local-state' : 'connectome-local-state',
    paths: [{ root: row.root, keys: [row.field] }], schemaVersion: 1, required: true, schema: row.schema }));
  const fieldDispositions = {};
  for (const root of ['dc', 'cn']) fieldDispositions[root] = Object.fromEntries([
    ...allocated.filter(row => row.root === root).map(row => [row.field, 'exact-native-view']),
    ...stateRows.filter(row => row.root === root).map(row => [row.field, 'exact-state']),
    ...ALIASES.filter(row => row.path.root === root).map(row => [row.path.keys[0], row.runtimeField ? 'primary-owned-identity-alias' : 'owned-cortex-view-alias'])
  ]);
  const rows = { tensors, states, families: [], resumeRules: [] };
  const implementationDigest = wire.fingerprintDescriptorDefinition({ componentId: COMPONENT_ID, schemaVersion: 1, ...rows,
    expertLabels: EXPERT_LABELS, neuropilNames: NEUROPIL_NAMES, fieldDispositions, interpretation: INTERPRETATION });
  const definition = { registryVersion: 1, components: [{ id: COMPONENT_ID, schemaVersion: 1, implementationDigest, present: true }],
    tensors: tensors.sort(ordinal), states: states.sort(ordinal), families: [], resumeRules: [] };
  const fingerprint = wire.fingerprintDescriptorDefinition(definition);
  if (implementationDigest !== 'a67d9b59efe0b388f58058b0af888858bb98e04009000b100bf363a7eab9c292' ||
      fingerprint !== '680085e1c02e829c50f532228784e848d6c2ee4e1d3af2f7ab6d1a6dfb62ec0e') fail('CORTEX_CATALOG_CHANGED', 'Independent cortex catalog changed; explicit contract review required: ' + implementationDigest + '/' + fingerprint);
  return { descriptorDefinition: definition, architecture: { registryVersion: 1, fingerprint, components: definition.components },
    tensors: tensors.map(row => { const length = row.dimensions.reduce((a, b) => a * b, 1); return { id: row.id, componentId: COMPONENT_ID, role: row.role,
      paths: row.paths, dtype: row.dtype, dimensions: row.dimensions, length, byteLength: length * (row.dtype === 'Float32Array' ? 4 : 1), byteOrder: 'LE',
      backingGroup: row.backingGroup, backingOffset: 0, backingByteLength: row.backingByteLength }; }),
    states: states.map(row => ({ id: row.id, componentId: COMPONENT_ID, role: row.role, valueType: row.schema.type, schemaVersion: 1, required: true })), resumeRules: [] };
}
// All inputs here are already owned, bounded data. This is independently
// implemented semantic receipt validation, shared by raw and wire observation.
function receiptPolicy(backings, states, expertLabels, reject) {
  if (states['dc.topMoEExperts'].some(label => !expertLabels.includes(label))) reject('CORTEX_RECEIPT', 'Unknown expert label');
  const indices = states['dc.moeActiveExpertIndices'], gates = states['dc.moeActiveGates'];
  if (indices.length !== gates.length || indices.length !== 0 && indices.length !== 2) reject('CORTEX_RECEIPT', 'Expert selection must be empty or paired');
  if (indices.length === 2 && indices.some((index, i) => states['dc.topMoEExperts'][i] !== expertLabels[index])) reject('CORTEX_RECEIPT', 'Expert labels disagree with selected indices');
  if (gates.length && (gates[1] < .05 || gates[1] > .5 || gates[0] !== 1 - gates[1])) reject('CORTEX_RECEIPT', 'Expert gates do not match');
  const bits = n => { let count = 0; while (n) { count += n & 1; n >>>= 1; } return count; };
  const sum = (id, scale, mask) => { let value = 0; const bytes = backings.get(id); for (let i = 0; i < bytes.length; i++) value += (mask ? bits(bytes[i]) : bytes[i]) * scale; return value; };
  const moe = sum('dc.moeCoverageMasks8', 8192, true), synapse = sum('cn.axonCoverageMasks512', 64, true);
  const qkv = sum('dc.attentionQkvCoverage768', 16, false), output = sum('dc.attentionOutputCoverage512', 8, false);
  if (states['dc.moeUniqueParametersVisited'] !== moe || states['dc.moeParameterCoveragePct'] !== 100 * moe / 524288 ||
      states['cn.uniqueSynapsesTraversed'] !== synapse || states['cn.synapseCoveragePct'] !== 100 * synapse / 262144 ||
      states['dc.attentionQkvUniqueParameters'] !== qkv || states['dc.attentionOutputUniqueParameters'] !== output ||
      states['dc.attentionParameterCoveragePct'] !== 100 * (qkv + output) / 16384) reject('CORTEX_RECEIPT', 'Coverage receipts disagree with owned masks');
}
function validateOwnedReceipts(backings, states) {
  const values = {};
  for (const row of RAW_CONTRACT.states) {
    const value = states[row.id];
    values[row.id] = row.schema.type === 'i53' || row.schema.type === 'f64' ? rawNumber(value) :
      row.schema.type === 'array' && row.schema.items.type !== 'string' ? value.map(rawNumber) : value;
  }
  receiptPolicy(backings, values, EXPERT_LABELS, fail);
}

// Self-contained direct observer. Only this embedded static contract is used;
// no runtime exporter, metadata callback, model step or caller method is called.
function observeCortex(runtime, contract, receipts) {
  const schema = 'gigachad.cortex-hydration-evidence.v1';
  const reject = (code, message) => { const error = new TypeError(message); error.code = code; throw error; };
  const own = (object, key, writable = false) => {
    const d = Object.getOwnPropertyDescriptor(object, key);
    if (!d || !Object.prototype.hasOwnProperty.call(d, 'value') || writable && !d.writable) reject('CORTEX_OWN_DATA', 'Expected own data: ' + key);
    return d.value;
  };
  const exact = (value, expected, label) => {
    const keys = Reflect.ownKeys(value), names = new Set(expected);
    if (keys.length !== names.size || keys.some(key => typeof key !== 'string' || !names.has(key))) reject('CORTEX_SHAPE', 'Unexpected ' + label + ' keys');
  };
  const f64 = value => {
    const bytes = new Uint8Array(8); new DataView(bytes.buffer).setFloat64(0, value, true);
    let hex = ''; for (let i = 0; i < 8; i++) hex += bytes[i].toString(16).padStart(2, '0');
    return { $type: 'f64', hex };
  };
  try {
    if (new Uint8Array(new Uint16Array([1]).buffer)[0] !== 1) reject('CORTEX_ENDIAN', 'Little endian host required');
    const roots = {};
    for (const [root, field] of Object.entries(contract.roots)) {
      const value = own(runtime, field);
      if (!value || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) reject('CORTEX_SHAPE', 'Ordinary cortex/connectome object required');
      exact(value, contract.fields[root], root); roots[root] = value;
    }
    const tp = Object.getPrototypeOf(Uint8Array.prototype);
    const getters = {};
    for (const key of ['buffer', 'byteOffset', 'byteLength', 'length', Symbol.toStringTag]) getters[key] = Object.getOwnPropertyDescriptor(tp, key).get;
    const bufferLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get;
    const resizable = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get;
    const constructors = { Float32Array, Uint8Array };
    const fixed = (buffer, length) => {
      if (Object.getPrototypeOf(buffer) !== ArrayBuffer.prototype || bufferLength.call(buffer) !== length || resizable?.call(buffer)) reject('CORTEX_BACKING', 'Fixed nonshared native backing required');
      // Buffer and native-view expandos have no persisted meaning. Never enumerate
      // typed indices or invoke a shadowed length/buffer/iterator/toJSON property.
      return new Uint8Array(buffer).slice();
    };
    const copied = new Map(), liveViews = new Map(), buffers = new Set(), seenViews = new Set();
    for (const row of contract.views) {
      const view = own(roots[row.root], row.field), C = constructors[row.dtype];
      if (Object.getPrototypeOf(view) !== C.prototype || getters[Symbol.toStringTag].call(view) !== row.dtype ||
          getters.length.call(view) !== row.length || getters.byteLength.call(view) !== row.byteLength ||
          getters.byteOffset.call(view) !== 0 || seenViews.has(view)) reject('CORTEX_VIEW', 'Invalid native view: ' + row.id);
      const buffer = getters.buffer.call(view);
      if (buffers.has(buffer)) reject('CORTEX_ALIAS', 'Unexpected cortex backing alias: ' + row.id);
      seenViews.add(view); buffers.add(buffer); liveViews.set(row.id, view); copied.set(row.id, fixed(buffer, row.byteLength));
    }
    const cortexBuffers = new Set(buffers), aliases = [];
    for (const row of contract.aliases) {
      const value = own(roots[row.path.root], row.path.keys[0]);
      const target = row.runtimeField ? own(runtime, row.runtimeField) : liveViews.get(row.targetId);
      if (value !== target) reject('CORTEX_ALIAS', 'Required same-view alias differs: ' + row.path.keys[0]);
      if (row.runtimeField) {
        if (Object.getPrototypeOf(target) !== Float32Array.prototype || getters[Symbol.toStringTag].call(target) !== 'Float32Array' ||
            getters.length.call(target) !== row.length || getters.byteOffset.call(target) !== 0 || getters.byteLength.call(target) !== row.length * 4) reject('CORTEX_ALIAS', 'Invalid primary alias target');
        const buffer = getters.buffer.call(target);
        if (buffers.has(buffer) || Object.getPrototypeOf(buffer) !== ArrayBuffer.prototype || bufferLength.call(buffer) !== row.length * 4 || resizable?.call(buffer)) reject('CORTEX_ALIAS', 'Primary backing is not separate');
        new Uint8Array(buffer); buffers.add(buffer);
      }
      aliases.push({ path: { root: row.path.root, keys: row.path.keys.slice() }, targetId: row.targetId });
    }
    // Optional application siblings are observed by own descriptors only. The
    // local fixture need not construct them, but a present sibling must not hide
    // equal-valued cross-component aliases from a byte-only comparison.
    const optional = (object, key) => {
      const d = Object.getOwnPropertyDescriptor(object, key);
      if (!d) return undefined;
      if (!Object.prototype.hasOwnProperty.call(d, 'value')) reject('CORTEX_OWN_DATA', 'Sibling slot is an accessor: ' + key);
      return d.value;
    };
    const separateView = view => {
      if (!ArrayBuffer.isView(view)) reject('CORTEX_ALIAS', 'Expected native sibling view');
      if (cortexBuffers.has(getters.buffer.call(view))) reject('CORTEX_ALIAS', 'Unexpected cross-component backing alias');
    };
    for (const key of ['W_actor', 'W_critic', 'W_metamorph', 'W_world', 'W_actor_frozen', 'W_world_frozen']) {
      const value = optional(runtime, key); if (value !== undefined) separateView(value);
    }
    const engine = optional(runtime, 'bleedingEdge25Engine');
    if (engine !== undefined && engine !== null) separateView(own(engine, 'W_hyper_u'));
    const hub = optional(runtime, 'trainableAlifeNeuralHub');
    if (hub !== undefined && hub !== null) {
      const fields = Reflect.ownKeys(hub);
      if (fields.length > 4096) reject('CORTEX_BOUND', 'Sibling own-field bound exceeded');
      const arena = optional(hub, 'mixedArenaBuffer');
      if (cortexBuffers.has(arena)) reject('CORTEX_ALIAS', 'Cortex backing aliases hub arena');
      for (const key of fields) {
        const d = Object.getOwnPropertyDescriptor(hub, key);
        if (d && Object.prototype.hasOwnProperty.call(d, 'value') && ArrayBuffer.isView(d.value)) separateView(d.value);
      }
      const ring = optional(hub, 'replayRing32');
      if (ring !== undefined) {
        if (!Array.isArray(ring)) reject('CORTEX_ALIAS', 'Bounded sibling replay required');
        const length = own(ring, 'length');
        if (!Number.isSafeInteger(length) || length < 0 || length > 32) reject('CORTEX_BOUND', 'Sibling replay bound exceeded');
        for (let i = 0; i < length; i++) {
          const record = own(ring, String(i));
          for (const key of ['z16', 'a8', 'zNext16']) separateView(own(record, key));
        }
      }
    }
    // All actual backing bytes are now owned. Domains are checked on copies.
    for (const row of contract.views) {
      const bytes = copied.get(row.id), data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      for (let i = 0; i < row.length; i++) {
        const value = row.dtype === 'Float32Array' ? data.getFloat32(i * 4, true) : bytes[i];
        if (!Number.isFinite(value) || row.policy.min !== undefined && value < row.policy.min || row.policy.max !== undefined && value > row.policy.max) reject('CORTEX_DOMAIN', 'Invalid tensor domain: ' + row.id);
      }
    }
    const numbers = (value, policy, label) => {
      if (typeof value !== 'number' || !Number.isFinite(value) || policy.type === 'i53' && (!Number.isSafeInteger(value) || Object.is(value, -0)) ||
          policy.min !== undefined && value < policy.min || policy.max !== undefined && value > policy.max) reject('CORTEX_STATE', 'Invalid numeric state: ' + label);
      return value;
    };
    const states = {}, arrays = new Set();
    for (const row of contract.states) {
      const value = own(roots[row.root], row.field, true), policy = row.schema;
      if (policy.type === 'i53' || policy.type === 'f64') states[row.id] = numbers(value, policy, row.id);
      else if (policy.type === 'string') {
        if (typeof value !== 'string' || value.length > policy.maxLength) reject('CORTEX_STATE', 'Invalid bounded string: ' + row.id);
        states[row.id] = value;
      } else {
        if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || arrays.has(value)) reject('CORTEX_STATE', 'Distinct native state array required');
        const length = own(value, 'length');
        if (!Number.isSafeInteger(length) || length < policy.minLength || length > policy.maxLength) reject('CORTEX_STATE', 'Invalid state array length');
        exact(value, ['length', ...Array.from({ length }, (_, i) => String(i))], 'state array'); arrays.add(value);
        const copy = [], unique = new Set();
        for (let i = 0; i < length; i++) {
          const item = own(value, String(i));
          if (policy.items.type === 'string') {
            if (typeof item !== 'string' || item.length > policy.items.maxLength) reject('CORTEX_STATE', 'Invalid array string');
          } else numbers(item, policy.items, row.id);
          if (policy.unique && unique.has(item)) reject('CORTEX_STATE', 'Duplicate state array value');
          unique.add(item); copy.push(item);
        }
        if (row.constant && (copy.length !== row.constant.length || copy.some((item, i) => item !== row.constant[i]))) reject('CORTEX_STATE', 'Constant names differ');
        states[row.id] = copy;
      }
    }
    receipts(copied, states, contract.expertLabels, reject);
    // Scalars and arrays are also owned before conversion/formatting begins.
    for (const row of contract.states) {
      if (row.schema.type === 'i53' || row.schema.type === 'f64') states[row.id] = f64(states[row.id]);
      else if (row.schema.type === 'array' && row.schema.items.type !== 'string') states[row.id] = states[row.id].map(f64);
    }
    const base64 = bytes => {
      const chunks = []; for (let i = 0; i < bytes.length; i += 8190) {
        let binary = ''; const end = Math.min(bytes.length, i + 8190);
        for (let j = i; j < end; j++) binary += String.fromCharCode(bytes[j]);
        chunks.push(btoa(binary));
      }
      return chunks.join(''); // Chunk width is divisible by3: padding only at end.
    };
    return { schema, ok: true, byteOrder: 'LE', backings: contract.views.map(row => ({ id: row.id, byteLength: row.byteLength, dataBase64: base64(copied.get(row.id)) })),
      views: contract.views.map(({ id, dtype, length, byteLength }) => ({ id, dtype, length, byteOffset: 0, byteLength, backingId: id })),
      states, aliases, totals: { views: 47, backings: 47, uniqueBytes: 4994760, stateFields: 43 } };
  } catch (error) { return { schema, ok: false, code: typeof error.code === 'string' ? error.code : 'CORTEX_CAPTURE', reason: String(error.message || error).slice(0, 400) }; }
}

function dataRecord(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('CORTEX_EVIDENCE', 'Expected ' + label + ' record');
  const names = Reflect.ownKeys(value), expected = new Set(keys);
  if (names.length !== keys.length || names.some(key => typeof key !== 'string' || !expected.has(key))) fail('CORTEX_EVIDENCE', 'Unexpected ' + label + ' fields');
  const out = Object.create(null);
  for (const key of keys) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (!d || !Object.hasOwn(d, 'value') || !d.enumerable) fail('CORTEX_EVIDENCE', 'Enumerable own data required: ' + key);
    out[key] = d.value;
  }
  return out;
}
function dataArray(value, length, label) {
  if (!Array.isArray(value) || Object.getOwnPropertyDescriptor(value, 'length')?.value !== length || Reflect.ownKeys(value).length !== length + 1) fail('CORTEX_EVIDENCE', 'Invalid bounded ' + label + ' array');
  const out = [];
  for (let i = 0; i < length; i++) {
    const d = Object.getOwnPropertyDescriptor(value, String(i));
    if (!d || !Object.hasOwn(d, 'value') || !d.enumerable) fail('CORTEX_EVIDENCE', 'Evidence array hole/accessor'); out.push(d.value);
  }
  return out;
}
function fromBase64(text, length) {
  if (typeof text !== 'string' || text.length !== 4 * Math.ceil(length / 3)) fail('CORTEX_BASE64', 'Invalid bounded backing encoding');
  const bytes = Buffer.from(text, 'base64');
  if (bytes.length !== length || bytes.toString('base64') !== text) fail('CORTEX_BASE64', 'Noncanonical backing encoding');
  return bytes;
}
function rawNumber(value) {
  const tag = dataRecord(value, ['$type', 'hex'], 'numeric tag');
  if (tag.$type !== 'f64' || typeof tag.hex !== 'string' || !/^[a-f0-9]{16}$/.test(tag.hex)) fail('CORTEX_STATE', 'Exact Float64 evidence required');
  return Buffer.from(tag.hex, 'hex').readDoubleLE();
}
function numericPolicy(value, policy, id) {
  if (typeof value !== 'number' || !Number.isFinite(value) || policy.type === 'i53' && (!Number.isSafeInteger(value) || Object.is(value, -0)) ||
      policy.min !== undefined && value < policy.min || policy.max !== undefined && value > policy.max) fail('CORTEX_STATE', 'Invalid numeric state: ' + id);
  const bytes = Buffer.alloc(8); bytes.writeDoubleLE(value); return { $type: 'f64', hex: bytes.toString('hex') };
}
function stateValue(value, row, raw) {
  const policy = row.schema;
  if (policy.type === 'i53' || policy.type === 'f64') return numericPolicy(raw ? rawNumber(value) : value, policy, row.id);
  if (policy.type === 'string') {
    if (typeof value !== 'string' || value.length > policy.maxLength) fail('CORTEX_STATE', 'Invalid bounded string: ' + row.id); return value;
  }
  const length = Object.getOwnPropertyDescriptor(value || {}, 'length')?.value;
  if (!Number.isSafeInteger(length) || length < policy.minLength || length > policy.maxLength) fail('CORTEX_STATE', 'Invalid array length: ' + row.id);
  const items = dataArray(value, length, row.id), unique = new Set();
  return items.map((item, i) => {
    let actual, result;
    if (policy.items.type === 'string') {
      if (typeof item !== 'string' || item.length > policy.items.maxLength) fail('CORTEX_STATE', 'Invalid array string'); actual = result = item;
    } else { actual = raw ? rawNumber(item) : item; result = numericPolicy(actual, policy.items, row.id); }
    if (policy.unique && unique.has(actual) || row.constant && actual !== row.constant[i]) fail('CORTEX_STATE', 'Invalid constant/unique array: ' + row.id);
    unique.add(actual); return result;
  });
}
function tensorPolicy(bytes, row) {
  for (let i = 0; i < row.length; i++) {
    const value = row.dtype === 'Float32Array' ? bytes.readFloatLE(i * 4) : bytes[i];
    if (!Number.isFinite(value) || row.policy.min !== undefined && value < row.policy.min || row.policy.max !== undefined && value > row.policy.max) fail('CORTEX_DOMAIN', 'Invalid tensor domain: ' + row.id);
  }
}
function verifyStateTag(tag, schema) {
  if (schema.type === 'string') { if (typeof tag !== 'string') fail('CORTEX_STATE', 'String state tag required'); return; }
  if (!tag || typeof tag !== 'object' || tag.$type !== schema.type) fail('CORTEX_STATE', 'State nested numeric tag differs from schema');
  if (schema.type === 'array') {
    if (!Array.isArray(tag.items) || tag.items.length < schema.minLength || tag.items.length > schema.maxLength) fail('CORTEX_STATE', 'State tag array bound mismatch');
    for (const item of tag.items) verifyStateTag(item, schema.items);
  }
}
function publicViews() {
  return RAW_CONTRACT.views.map(({ id, dtype, length, byteLength }) => ({ id, dtype, length, byteOffset: 0, byteLength, backingId: id }));
}
function publicAliases() { return RAW_CONTRACT.aliases.map(row => ({ path: row.path, targetId: row.targetId })); }
function copyObservation(input) {
  const status = Object.getOwnPropertyDescriptor(input || {}, 'ok');
  if (status && Object.hasOwn(status, 'value') && status.value === false) fail('CORTEX_CAPTURE_FAILED', 'The first direct cortex observation failed');
  const value = dataRecord(input, ['schema', 'ok', 'byteOrder', 'backings', 'views', 'states', 'aliases', 'totals'], 'cortex observation');
  if (value.schema !== OBSERVATION_SCHEMA || value.ok !== true || value.byteOrder !== 'LE') fail('CORTEX_EVIDENCE', 'Wrong observation schema/status/byte order');
  const totals = dataRecord(value.totals, ['views', 'backings', 'uniqueBytes', 'stateFields'], 'totals');
  if (totals.views !== VIEW_COUNT || totals.backings !== VIEW_COUNT || totals.uniqueBytes !== TOTAL_BYTES || totals.stateFields !== STATE_COUNT) fail('CORTEX_EVIDENCE', 'Cortex observation totals differ');
  const backings = new Map(), views = publicViews();
  dataArray(value.backings, VIEW_COUNT, 'backings').forEach((item, i) => {
    const row = dataRecord(item, ['id', 'byteLength', 'dataBase64'], 'backing'), expected = RAW_CONTRACT.views[i];
    if (row.id !== expected.id || row.byteLength !== expected.byteLength) fail('CORTEX_BACKING', 'Wrong backing roster/order/size');
    const bytes = fromBase64(row.dataBase64, row.byteLength); tensorPolicy(bytes, expected); backings.set(row.id, bytes);
  });
  dataArray(value.views, VIEW_COUNT, 'views').forEach((item, i) => {
    const expected = views[i], row = dataRecord(item, ['id', 'dtype', 'length', 'byteOffset', 'byteLength', 'backingId'], 'view');
    if (Object.keys(expected).some(key => !Object.is(row[key], expected[key]))) fail('CORTEX_VIEW', 'Incorrect direct view layout/identity');
  });
  const expectedAliases = publicAliases();
  dataArray(value.aliases, expectedAliases.length, 'aliases').forEach((item, i) => {
    const row = dataRecord(item, ['path', 'targetId'], 'alias'), expected = expectedAliases[i];
    const path = dataRecord(row.path, ['root', 'keys'], 'alias path');
    const keys = dataArray(path.keys, expected.path.keys.length, 'alias keys');
    if (row.targetId !== expected.targetId || path.root !== expected.path.root || keys.some((key, j) => key !== expected.path.keys[j])) fail('CORTEX_ALIAS', 'Incorrect direct alias receipt');
  });
  const source = dataRecord(value.states, RAW_CONTRACT.states.map(row => row.id), 'states'), states = Object.create(null);
  for (const row of RAW_CONTRACT.states) states[row.id] = stateValue(source[row.id], row, true);
  validateOwnedReceipts(backings, states);
  return { backings, states, views, aliases: expectedAliases };
}
function decodeCortexStateEvidence(json) {
  const catalog = createExpectedCortexCatalog(), decoded = wire.decodeLearnedStateWire(json, { expectedCatalog: catalog });
  if (decoded.stateManifest.some((row, i) => row.id !== catalog.states[i].id)) fail('CORTEX_STATE_ORDER', 'Cortex state roster must be ordinal sorted');
  const backings = new Map(), tensors = [];
  for (let i = 0; i < decoded.tensors.length; i++) {
    const row = decoded.tensors[i], expected = RAW_CONTRACT.views[i];
    if (row.id !== expected.id) fail('CORTEX_TENSOR_ORDER', 'Cortex tensor roster must be ordinal sorted');
    const bytes = Buffer.from(row.bytes); tensorPolicy(bytes, expected);
    backings.set(row.id, bytes); tensors.push({ ...row, bytes });
  }
  const states = Object.create(null);
  for (const row of RAW_CONTRACT.states) {
    verifyStateTag(decoded.stateTags[row.id], row.schema);
    states[row.id] = stateValue(decoded.decodedStates.get(row.id), row, false);
  }
  validateOwnedReceipts(backings, states);
  return { snapshot: { ...decoded.snapshot }, backings, tensors, states, views: publicViews(),
    evidence: { wireValid: true, exactCortexCatalogMatched: true, cortexNumericPoliciesVerified: true,
      schema: decoded.evidence.schema, componentId: COMPONENT_ID, componentSchemaVersion: SCHEMA_VERSION,
      architectureFingerprint: decoded.architecture.fingerprint, implementationDigest: decoded.architecture.components[0].implementationDigest,
      payloadSHA256: decoded.evidence.payloadSha256, payloadBytes: decoded.evidence.payloadBytes,
      tensorCount: VIEW_COUNT, actualNativeViews: VIEW_COUNT, backingCount: VIEW_COUNT, tensorBytes: TOTAL_BYTES,
      uniqueBackingBytes: TOTAL_BYTES, stateCount: STATE_COUNT, declaredInternalAliasPaths: 3, requiredPrimaryAliases: 2,
      completeApplicationCatalog: false, liveEngineObserved: false, restoreExecuted: false, durabilityVerified: false,
      scope: 'Declared deep-cortex/connectome state only; primary alias values, other models, RNG, external inputs and durable restart require separate evidence' } };
}
function compareOwned(before, after) {
  let changedBackingBytes = 0, changedLearnedMatrixBytes = 0, changedScratchBytes = 0;
  const changedBackingIds = [], changedLearnedMatrixIds = [], changedScratchIds = [], changedStateIds = [], differences = [];
  for (const [id, bytes] of before.backings) {
    const next = after.backings.get(id); let changed = 0;
    for (let i = 0; i < bytes.length; i++) if (bytes[i] !== next[i]) changed++;
    if (changed) {
      changedBackingBytes += changed; changedBackingIds.push(id); differences.push({ id, kind: 'backing-bytes', changedBytes: changed });
      if (LEARNED_MATRIX_IDS.has(id)) { changedLearnedMatrixBytes += changed; changedLearnedMatrixIds.push(id); }
      else { changedScratchBytes += changed; changedScratchIds.push(id); }
    }
  }
  for (const id of Object.keys(before.states).sort()) {
    if (JSON.stringify(before.states[id]) !== JSON.stringify(after.states[id])) { changedStateIds.push(id); differences.push({ id, kind: 'state-value' }); }
  }
  return { changedBackingBytes, changedBackingIds: changedBackingIds.sort(), changedStateIds,
    changedLearnedMatrixBytes, changedLearnedMatrixIds: changedLearnedMatrixIds.sort(), changedScratchBytes, changedScratchIds: changedScratchIds.sort(), differences };
}
function invalid(error) {
  return { ok: false, status: 'invalid-evidence', code: error.code || 'CORTEX_EVIDENCE', reason: String(error.message).slice(0, 400),
    arraysChecked: 0, elementsChecked: 0, elementsDifferent: 0, comparedBytes: 0, comparedStates: 0, completeApplicationCatalog: false };
}
function compareCortexHydration(before, after) {
  try {
    const result = compareOwned(copyObservation(before), copyObservation(after));
    return { ok: true, status: 'compared-cortex-subset', equal: result.changedBackingBytes === 0 && result.changedStateIds.length === 0,
      ...result, comparedBytes: TOTAL_BYTES, comparedStates: STATE_COUNT, actualNativeViews: VIEW_COUNT, validatedAliasCount: 5,
      completeApplicationCatalog: false,
      scope: 'Two direct supplied observations; learned-matrix byte changes are parameter evolution, not proof of learning quality, equal future outputs or durable restart; other backing bytes include scratch, associative state and matrices outside the conservative learned set' };
  } catch (error) { return invalid(error); }
}
function assessCortexStateEvidence(json, observation, { expectedSnapshot } = {}) {
  let observed, expected, identity;
  try {
    observed = copyObservation(observation);
    if (expectedSnapshot !== undefined) identity = dataRecord(expectedSnapshot, SNAPSHOT_KEYS, 'expected snapshot');
    expected = decodeCortexStateEvidence(json);
  } catch (error) { return invalid(error); }
  const result = compareOwned(expected, observed), differences = result.differences.slice(), comparisons = [];
  if (identity) for (const key of SNAPSHOT_KEYS) if (!Object.is(expected.snapshot[key], identity[key])) differences.push({ id: 'snapshot.' + key, kind: 'snapshot-identity' });
  let elementsChecked = 0, elementsDifferent = 0;
  for (const row of expected.tensors) {
    const actual = observed.backings.get(row.id), width = row.byteLength / row.length; let changed = 0;
    for (let i = 0; i < row.byteLength; i += width) {
      let different = false; for (let j = 0; j < width; j++) if (row.bytes[i + j] !== actual[i + j]) { different = true; break; }
      if (different) changed++;
    }
    elementsChecked += row.length; elementsDifferent += changed;
    comparisons.push({ id: row.id, ok: changed === 0, elementsCompared: row.length, elementsDifferent: changed, expectedBytesSHA256: sha(row.bytes), observedBytesSHA256: sha(actual) });
  }
  return { ok: differences.length === 0, status: differences.length ? 'cortex-mismatch' : 'passed-cortex-subset',
    arraysChecked: VIEW_COUNT, actualNativeViews: VIEW_COUNT, elementsChecked, elementsDifferent, comparedBytes: TOTAL_BYTES,
    comparedStates: STATE_COUNT, ...result, differences, comparisons, actual: expected.evidence, validatedAliasCount: 5,
    snapshotMatched: identity ? !differences.some(row => row.kind === 'snapshot-identity') : null, completeApplicationCatalog: false,
    scope: 'Supplied cortex wire compared with first direct observation; complete application continuity, provenance and durable restart require separate evidence' };
}
const captureCortexHydration = new Function('return function captureCortexHydration(runtime) { return (' + observeCortex.toString() + ')(runtime,' +
  JSON.stringify(RAW_CONTRACT) + ',(' + receiptPolicy.toString() + ')); }')();
module.exports = { COMPONENT_ID, SCHEMA_VERSION, createExpectedCortexCatalog, captureCortexHydration, decodeCortexStateEvidence,
  assessCortexStateEvidence, compareCortexHydration };
