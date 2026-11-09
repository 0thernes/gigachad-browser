/* Exact local trainable-hub state. No model stepping, storage or browser access.
 * Fenced ordinary non-Proxy objects are required. Replay and external engines
 * have separate owners; a hub snapshot alone is not whole-model continuation.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveHubState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const COMPONENT_ID = 'trainable-hub-local', SCHEMA_VERSION = 1;
  const ARENA_BYTES = 8192, RESERVED_OFFSET = 4928, RESERVED_BYTES = 3264;
  const TENSOR_COUNT = 59, TENSOR_BYTES = 21368, STATE_COUNT = 44;
  const SCOPE = Object.freeze({ kind: 'declared-local-trainable-hub', completeApplicationCatalog: false,
    includes: '58 native views, complete fixed 8192-byte arena including reserved tail, 42 primitive fields and two constant name arrays',
    excludes: 'Replay ring/cursor, external engine and federation graphs, global QRNG state and draws, browser observations/authority, asynchronous operations',
    halfwordInterpretation: 'fp16PersistentWeights256 preserves native Uint16 words; no IEEE Float16 numeric interpretation or conversion is claimed',
    numericDomains: 'Finite floating values; Adam second moments and four squared-error EMA scalars are nonnegative; diffusion alpha-bar is in [0,1]; counters are nonnegative safe integers; sector index is 0..15',
    continuation: 'Further updates require equivalent omitted state, external inputs and random draws',
    publication: 'Synchronous in-place registered writes with readback and best-effort rollback, under a caller-owned startup generation fence; not a whole-model transaction',
    inputs: 'Fenced ordinary non-Proxy own-data records and fixed nonshared native buffers; unknown hub fields are rejected' });
  const ARENA = [
    ['f64TrajectoryCurr16', 'Float64Array', [16], 0], ['f64TrajectoryPrev16', 'Float64Array', [16], 128],
    ['f64TrajectoryPrev2_16', 'Float64Array', [16], 256], ['f64AdamFirstMoment64', 'Float64Array', [64], 384],
    ['f64AdamSecondMoment64', 'Float64Array', [64], 896], ['f64LossHistory16', 'Float64Array', [16], 1408],
    ['int8QuantizedWeights256', 'Int8Array', [256], 1536], ['u64SpikeTrainLanes8', 'BigUint64Array', [8], 1792],
    ['b158TernaryMorphism256', 'Int8Array', [256], 1856], ['fp16PersistentWeights256', 'Uint16Array', [256], 2112],
    ['f64InterIntraCoupling16x16', 'Float64Array', [16, 16], 2624], ['facultyActivations16', 'Float64Array', [16], 4672],
    ['facultyDrives16', 'Float64Array', [16], 4800]
  ];
  const FLOATS = [
    ['W_perc_enc', [16, 16]], ['b_perc_enc', [16]], ['W_perc_dec', [16, 16]], ['b_perc_dec', [16]],
    ['zPerc16', [16]], ['zPrev16', [16]], ['zPrevPrev16', [16]], ['xHat16', [16]],
    ['W_dyn1', [16, 24]], ['b_dyn1', [16]], ['W_dyn2', [16, 16]], ['b_dyn2', [16]], ['hDyn16', [16]],
    ['zPredNext16', [16]], ['lastAction8', [8]], ['bestReasoningAction8', [8]],
    ['diffusionAlphaBar8', [8]], ['W_diff1', [16, 17]], ['b_diff1', [16]], ['W_diff2', [16, 16]],
    ['b_diff2', [16]], ['hDiff16', [16]], ['diffusedIdeaVec16', [16]],
    ['W_gen1', [16, 16]], ['b_gen1', [16]], ['W_gen2', [16, 16]], ['b_gen2', [16]], ['hGen16', [16]],
    ['ganSyntheticLatent16', [16]], ['W_disc1', [16, 16]], ['b_disc1', [16]], ['W_disc2', [16]],
    ['hDiscReal16', [16]], ['hDiscFake16', [16]], ['W_aware16', [16]],
    ['visionDomGrid8x8', [8, 8]], ['visitedGrid8x8', [8, 8]], ['samSpatialAffordance16', [16]],
    ['W_icm_inv', [8, 32]], ['b_icm_inv', [8]], ['predActionInv8', [8]], ['W_robot_actor', [2, 16]],
    ['b_robot_actor', [2]], ['learnedMotorThrust2D', [2]], ['predictedFuturePos2D', [2]]
  ];
  const NUMBERS = ['int8QuantScale', 'interIntraCoherenceScore', 'perceptionLossMse', 'observanceClarityPct',
    'worldDynamicsLossMse', 'thoughtCurvatureKappa', 'thoughtTorsionTau', 'thoughtGeodesicAngleRad', 'bestReasoningBranchScore',
    'diffusionScoreLossMse', 'ideaNoveltyScore', 'ideasSynthesizedCount', 'b_disc2', 'ganDiscRealProb', 'ganDiscFakeProb',
    'ganGeneratorLoss', 'ganDiscriminatorLoss', 'selfCriticismScorePct', 'b_aware', 'predictedUncertainty',
    'awarenessCalibrationPct', 'contemplationDepthScore', 'adaptivePlasticityLr', 'recursiveMorphismEigenvalue',
    'recursiveMorphismsCount', 'dreamConsolidationSteps', 'totalBackpropStepsTrained', 'millionParamSlicesUpdatedPerSec',
    'persistentWeightCheckpointsSaved', 'samBestSectorIdx', 'inversePhysicsLossMse', 'icmCuriosityReward',
    'extrinsicForagingReward', 'robotPrevValueEstimate', 'tdAdvantageDelta', 'spatialExplorationCoveragePct'];
  const COUNTERS = new Set(['ideasSynthesizedCount', 'recursiveMorphismsCount', 'dreamConsolidationSteps',
    'totalBackpropStepsTrained', 'persistentWeightCheckpointsSaved']);
  const MSE_FIELDS = new Set(['perceptionLossMse', 'worldDynamicsLossMse', 'diffusionScoreLossMse', 'inversePhysicsLossMse']);
  const STRINGS = ['tensorBackendMode', 'reasoningVerdict', 'activeIdeaSummary', 'selfCriticismVerdict',
    'selfAnalysisSummary', 'embodiedRoboticsHeadline'];
  const NAMES = {
    facultyNames16: ['F00:SELF_PERCEPTION', 'F01:SPIKING_sLTC', 'F02:SELF_LEARNING', 'F03:SELF_TRAINING',
      'F04:SELF_PLASTICITY', 'F05:SELF_THINKING', 'F06:SELF_REASONING', 'F07:SELF_PERSISTENT_MEMORY',
      'F08:SELF_METACOGNITION', 'F09:SELF_OBSERVANCE', 'F10:SELF_AWARENESS', 'F11:THOUGHT_CURVATURE',
      'F12:SELF_CRITICISM', 'F13:SELF_CONTEMPLATION_ANALYSIS', 'F14:SELF_RECURSIVE_DECURSIVE', 'F15:AFFECT_IDEAS_DREAM_DIFF_GAN'],
    moeExpertNames8: ['EXP0:SELF_PERCEPTION_OBSERVANCE_AUTOENCODER(65K)', 'EXP1:SELF_THINKING_REASONING_THOUGHT_CURVATURE(65K)',
      'EXP2:LATENT_DIFFUSION_DDPM_IDEA_GENERATOR(65K)', 'EXP3:LATENT_GAN_GENERATOR_SYNTHESIS(65K)',
      'EXP4:LATENT_GAN_DISCRIMINATOR_SELF_CRITICISM(65K)', 'EXP5:SELF_AWARENESS_METACOGNITION_CONTEMPLATION(65K)',
      'EXP6:AFFECTIVE_FEELINGS_EMOTIONS_HOMEOSTASIS(65K)', 'EXP7:SELF_RECURSIVE_MORPHISMS_DREAM_CONSOLIDATOR(65K)']
  };
  const constructors = { Float32Array, Float64Array, Int8Array, Uint16Array, BigUint64Array, Uint8Array };
  const ALL_VIEWS = [...ARENA.map(([name, dtype, dimensions, offset]) => ({ name, dtype, dimensions, offset, arena: true })),
    ...FLOATS.map(([name, dimensions]) => ({ name, dtype: 'Float32Array', dimensions, offset: 0, arena: false }))];
  const STATE_FIELDS = [...NUMBERS, ...STRINGS, ...Object.keys(NAMES)];
  const FIELD_DISPOSITIONS = Object.freeze(Object.fromEntries([
    ...ALL_VIEWS.map(row => [row.name, 'exact-native-view']), ...STATE_FIELDS.map(name => [name, 'exact-state']),
    ['mixedArenaBuffer', 'bound-backing-including-reserved-tail'], ['replayRing32', 'separate-replay-component'],
    ['replayWritePtr', 'separate-replay-component']]));
  const ALL_KEYS = Object.keys(FIELD_DISPOSITIONS);
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const descriptor = Object.getOwnPropertyDescriptor;
  const tp = Object.getPrototypeOf(Uint8Array.prototype);
  const getter = key => descriptor(tp, key).get;
  const native = { buffer: getter('buffer'), offset: getter('byteOffset'), length: getter('length'), bytes: getter('byteLength'),
    dtype: descriptor(tp, Symbol.toStringTag).get, bufferBytes: descriptor(ArrayBuffer.prototype, 'byteLength').get,
    resizable: descriptor(ArrayBuffer.prototype, 'resizable')?.get };
  const fail = message => { throw new TypeError('Hub state: ' + message); };
  const lengthOf = row => row.dimensions.reduce((a, b) => a * b, 1);
  const integer = value => Number.isSafeInteger(value) && !Object.is(value, -0) && value >= 0;
  const sameDescriptor = (a, b) => !!a && !!b && own(a, 'value') && own(b, 'value') && Object.is(a.value, b.value) &&
    a.writable === b.writable && a.enumerable === b.enumerable && a.configurable === b.configurable;
  const equalBytes = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  function data(object, key, writable = false) {
    const slot = descriptor(object, key);
    if (!slot || !own(slot, 'value') || writable && slot.writable !== true) fail('expected ' + (writable ? 'writable ' : '') + 'own-data slot ' + key);
    return slot;
  }
  function keys(object, expected, label) {
    const actual = Reflect.ownKeys(object);
    if (actual.length !== expected.length || actual.some(key => typeof key !== 'string' || !expected.includes(key))) fail('unknown/missing ' + label + ' field');
  }
  function fixedBuffer(buffer, bytes) {
    try {
      if (Object.getPrototypeOf(buffer) !== ArrayBuffer.prototype || native.bufferBytes.call(buffer) !== bytes || native.resizable?.call(buffer)) fail('fixed nonshared backing required');
      keys(buffer, [], 'buffer'); new Uint8Array(buffer);
    } catch (error) { fail('invalid backing: ' + error.message); }
  }
  function scalarSchema(name) {
    if (COUNTERS.has(name)) return { type: 'i53', min: 0, max: Number.MAX_SAFE_INTEGER };
    if (name === 'samBestSectorIdx') return { type: 'i53', min: 0, max: 15 };
    if (STRINGS.includes(name)) return { type: 'string', maxLength: 2048 };
    if (own(NAMES, name)) return { type: 'array', items: { type: 'string', maxLength: 128 }, minLength: NAMES[name].length, maxLength: NAMES[name].length, unique: true };
    if (MSE_FIELDS.has(name)) return { type: 'f64', min: 0 };
    return { type: 'f64' };
  }
  function tensorPolicy(name) {
    return { format: 'native', finite: true, ...(name === 'f64AdamSecondMoment64' ? { min: 0 } :
      name === 'diffusionAlphaBar8' ? { min: 0, max: 1 } : {}) };
  }
  function inspect(hub) {
    if (!hub || ![Object.prototype, null].includes(Object.getPrototypeOf(hub))) fail('ordinary hub object required');
    keys(hub, ALL_KEYS, 'hub');
    const checks = [], check = (object, key, writable = false) => { const slot = data(object, key, writable); checks.push({ object, key, slot }); return slot.value; };
    // The two replay slots are classified but neither their contents nor their
    // identities are bound by this component; the replay adapter owns them.
    data(hub, 'replayRing32'); data(hub, 'replayWritePtr');
    const arena = check(hub, 'mixedArenaBuffer'); fixedBuffer(arena, ARENA_BYTES);
    const buffers = new Map([[arena, new Uint8Array(arena).slice()]]), views = new Set();
    for (const row of ALL_VIEWS) {
      const view = check(hub, row.name), C = constructors[row.dtype], length = lengthOf(row), bytes = length * C.BYTES_PER_ELEMENT;
      let backing;
      try {
        if (Object.getPrototypeOf(view) !== C.prototype || native.dtype.call(view) !== row.dtype || native.length.call(view) !== length ||
            native.bytes.call(view) !== bytes || native.offset.call(view) !== row.offset || views.has(view)) fail('invalid tensor type/shape/identity ' + row.name);
        views.add(view); backing = native.buffer.call(view);
        keys(view, Array.from({ length }, (_, i) => String(i)), 'tensor');
        if (row.arena) { if (backing !== arena) fail('mixed arena binding mismatch ' + row.name); }
        else { fixedBuffer(backing, bytes); if (buffers.has(backing)) fail('standalone backing alias ' + row.name); buffers.set(backing, new Uint8Array(backing).slice()); }
        if (row.dtype === 'Float32Array' || row.dtype === 'Float64Array') {
          const policy = tensorPolicy(row.name);
          if (new C(backing, row.offset, length).some(v => !Number.isFinite(v) || policy.min !== undefined && v < policy.min || policy.max !== undefined && v > policy.max)) fail('tensor numeric domain rejected ' + row.name);
        }
      } catch (error) { fail('invalid tensor ' + row.name + ': ' + error.message); }
    }
    for (const name of STATE_FIELDS) {
      const value = check(hub, name, true);
      if (own(NAMES, name)) {
        const expected = NAMES[name];
        if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) fail('ordinary constant names array required');
        keys(value, ['length', ...expected.map((_, i) => String(i))], 'names');
        if (check(value, 'length') !== expected.length) fail('constant names length mismatch');
        expected.forEach((entry, i) => { if (check(value, String(i)) !== entry) fail('constant names mismatch ' + name); });
      } else if (STRINGS.includes(name)) { if (typeof value !== 'string' || value.length > 2048) fail('bounded string required ' + name); }
      else if (COUNTERS.has(name) || name === 'samBestSectorIdx') {
        if (!integer(value) || name === 'samBestSectorIdx' && value > 15) fail('nonnegative safe integer required ' + name);
      } else if (typeof value !== 'number' || !Number.isFinite(value) || MSE_FIELDS.has(name) && value < 0) fail('finite scalar/domain required ' + name);
    }
    return { hub, prototype: Object.getPrototypeOf(hub), arena, checks, buffers };
  }
  function unchanged(before, hub) {
    const after = inspect(hub);
    if (before.hub !== hub || before.prototype !== after.prototype || before.arena !== after.arena || before.checks.length !== after.checks.length ||
        before.checks.some((c, i) => c.object !== after.checks[i].object || c.key !== after.checks[i].key || !sameDescriptor(c.slot, after.checks[i].slot)) ||
        before.buffers.size !== after.buffers.size || [...before.buffers].some(([buffer, bytes]) => !after.buffers.has(buffer) || !equalBytes(bytes, after.buffers.get(buffer)))) fail('destination changed since preflight');
    return after;
  }
  function definitionRows() {
    const tensors = ALL_VIEWS.map(row => ({ id: row.name, componentId: COMPONENT_ID, role: row.arena ? 'mixed-arena-view' : 'local-hub-view',
      paths: [{ root: 'hub', keys: [row.name] }], dtype: row.dtype, dimensions: row.dimensions.slice(),
      backingGroup: row.arena ? 'mixedArena' : row.name, backingOffset: row.offset,
      backingByteLength: row.arena ? ARENA_BYTES : lengthOf(row) * 4, policy: tensorPolicy(row.name) }));
    tensors.push({ id: 'reservedArenaTail', componentId: COMPONENT_ID, role: 'reserved-arena-bytes', paths: [{ root: 'arena', keys: ['reservedTail'] }],
      dtype: 'Uint8Array', dimensions: [RESERVED_BYTES], backingGroup: 'mixedArena', backingOffset: RESERVED_OFFSET,
      backingByteLength: ARENA_BYTES, policy: { format: 'native', finite: true } });
    const states = STATE_FIELDS.map(name => ({ id: name, componentId: COMPONENT_ID, role: own(NAMES, name) ? 'constant-names' : COUNTERS.has(name) ? 'learning-counter' : 'local-hub-state',
      paths: [{ root: 'hub', keys: [name] }], schemaVersion: 1, required: true, schema: scalarSchema(name) }));
    return { tensors, states, families: [], resumeRules: [] };
  }
  function blankHub() {
    const hub = { mixedArenaBuffer: new ArrayBuffer(ARENA_BYTES), replayRing32: [], replayWritePtr: 0 };
    for (const row of ALL_VIEWS) { const C = constructors[row.dtype]; hub[row.name] = row.arena ? new C(hub.mixedArenaBuffer, row.offset, lengthOf(row)) : new C(lengthOf(row)); }
    NUMBERS.forEach(name => { hub[name] = 0; }); STRINGS.forEach(name => { hub[name] = ''; });
    Object.entries(NAMES).forEach(([name, values]) => { hub[name] = values.slice(); }); return hub;
  }
  async function create({ registry, codec, crypto } = {}) {
    if (typeof registry?.compile !== 'function' || typeof codec?.fingerprintDescriptors !== 'function' || typeof codec?.verifiedCopy !== 'function') fail('compatible codec and registry required');
    const rows = definitionRows();
    const implementationDigest = await codec.fingerprintDescriptors({ componentId: COMPONENT_ID, schemaVersion: SCHEMA_VERSION, ...rows,
      constantNames: NAMES, fieldDispositions: FIELD_DISPOSITIONS, interpretation: SCOPE }, { crypto });
    const compiled = await registry.compile({ registryVersion: 1, components: [{ id: COMPONENT_ID, schemaVersion: SCHEMA_VERSION, implementationDigest, present: true }], ...rows }, { codec, crypto });
    const projections = new WeakMap(), plans = new WeakMap();
    const generation = value => { if (!integer(value)) fail('valid model generation required'); return value; };
    const summary = (status, gen) => ({ status, ...(gen === undefined ? {} : { generation: gen }), tensorCount: TENSOR_COUNT, tensorBytes: TENSOR_BYTES, stateCount: STATE_COUNT, scope: SCOPE.kind });
    function projection(current) {
      let saved = projections.get(current.hub);
      if (saved && saved.arena !== current.arena) fail('cached mixed arena binding changed');
      if (!saved) { saved = { arena: current.arena, roots: { hub: current.hub, arena: { reservedTail: new Uint8Array(current.arena, RESERVED_OFFSET, RESERVED_BYTES) } } }; projections.set(current.hub, saved); }
      return saved.roots;
    }
    function stage(decoded) {
      // Registry preflight reads the private verified capsule, never its public mirrors.
      const hub = blankHub(), roots = projection(inspect(hub));
      compiled.apply(compiled.preflight(decoded, roots, { generation: 0 }), roots, { generation: 0 });
      inspect(hub); // also enforce the exact versioned name literals on saved values
    }
    function planFor(prepared, hub, gen) {
      generation(gen); const plan = plans.get(prepared);
      if (!plan || plan.hub !== hub || plan.generation !== gen) fail('stale or foreign hub publication plan');
      return plan;
    }
    function recheck(prepared, hub, { generation: gen } = {}) {
      const plan = planFor(prepared, hub, gen); unchanged(plan.before, hub); return summary('ready', gen);
    }
    return Object.freeze({ architecture: compiled.architecture, scope: SCOPE,
      capture(hub, snapshot, { generation: gen, provenance } = {}) {
        generation(gen); const current = inspect(hub);
        return compiled.capture(projection(current), snapshot, { generation: gen, provenance });
      },
      validate(decoded) { stage(decoded); return summary('validated'); },
      preflight(decoded, hub, { generation: gen } = {}) {
        generation(gen); const before = inspect(hub), roots = projection(before); stage(decoded); unchanged(before, hub);
        const compiledPlan = compiled.preflight(decoded, roots, { generation: gen });
        const prepared = Object.freeze(summary('prepared', gen)); plans.set(prepared, { hub, generation: gen, before, roots, compiledPlan }); return prepared;
      }, recheck,
      apply(prepared, hub, { generation: gen } = {}) {
        const plan = planFor(prepared, hub, gen); unchanged(plan.before, hub); plans.delete(prepared);
        const receipt = compiled.apply(plan.compiledPlan, plan.roots, { generation: gen });
        return { ...summary('applied', gen), readbackVerified: receipt.readbackVerified };
      },
      discard(prepared) { return plans.delete(prepared); }
    });
  }
  return Object.freeze({ create, COMPONENT_ID, SCHEMA_VERSION, TENSOR_COUNT, TENSOR_BYTES, STATE_COUNT,
    fieldDispositions: FIELD_DISPOSITIONS, scope: SCOPE });
});
