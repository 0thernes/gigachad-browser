/* Async verification before classic application activation; synchronous subset
 * preflight/apply inside the existing loader. No storage or model execution.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AlivePrimaryPolicyBootstrap = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FIELD = 'primaryPolicyState';
  const TRAINER_FIELD = 'trainerCommittedState';
  const SCOPE = 'Exact six primary tensors only; remaining legacy genome is partial, not full learned-state continuity';
  const PAIRED_SCOPE = 'Exact six primary tensors plus committed trainer u/epoch/timeout; external inputs and ordering are not restored, not full learned-state continuity';
  const SNAPSHOT_FIELDS = ['creatureId', 'policyId', 'checkpointId', 'logicalTick', 'modelEpoch', 'capturedAt', 'resumeBoundary'];
  const PRIMARY_KEYS = ['W_actor', 'W_metamorph', 'W_critic', 'W_world', 'W_actor_frozen', 'W_world_frozen'];
  const viewBuffer = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Float32Array.prototype), 'buffer').get;
  const MAX_JSON_BYTES = 32 * 1024 * 1024;
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const fail = message => { throw new TypeError('Primary policy bootstrap: ' + message); };
  const safeInteger = value => Number.isSafeInteger(value) && !Object.is(value, -0) && value >= 0;
  function identifier(value) {
    if (typeof value !== 'string' || !value.length || value.length > 128 || /[\x00-\x1f\x7f]/.test(value) || ['__proto__','prototype','constructor'].includes(value)) fail('invalid snapshot identity');
    return value;
  }
  function ownValue(value, key) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !own(descriptor, 'value')) fail('missing/accessor runtime metadata: ' + key);
    return descriptor.value;
  }
  // Outer legacy JSON may contain whitespace. Decode the primary member from
  // its original substring so the inner codec retains its strict JSON policy.
  function inspect(raw) {
    if (raw === null || raw === undefined || raw === '') return { present: false, trainerPresent: false, outer: null };
    if (typeof raw !== 'string' || raw.length > MAX_JSON_BYTES || new TextEncoder().encode(raw).byteLength > MAX_JSON_BYTES) fail('invalid or oversized source JSON');
    const outer = JSON.parse(raw);
    if (!outer || typeof outer !== 'object' || Array.isArray(outer)) fail('source must be a JSON object');
    const whitespace = c => c === ' ' || c === '\n' || c === '\r' || c === '\t';
    const skip = start => { while (whitespace(raw[start])) start++; return start; };
    const stringEnd = start => {
      let escaped = false;
      for (let i = start + 1; i < raw.length; i++) {
        if (escaped) escaped = false;
        else if (raw[i] === '\\') escaped = true;
        else if (raw[i] === '"') return i + 1;
      }
      fail('unterminated source string');
    };
    const names = new Set(); let offset = skip(0) + 1, primaryJSON = null, trainerJSON = null;
    while (true) {
      offset = skip(offset);
      if (raw[offset] === '}') break;
      const keyEnd = stringEnd(offset), key = JSON.parse(raw.slice(offset, keyEnd));
      if (names.has(key)) fail('duplicate outer field');
      names.add(key);
      const start = skip(skip(keyEnd) + 1); let i = start, depth = 0;
      for (; i < raw.length; i++) {
        const c = raw[i];
        if (c === '"') { i = stringEnd(i) - 1; continue; }
        if (c === '[' || c === '{') depth++;
        else if (c === ']' || c === '}') { if (!depth) break; depth--; }
        else if (c === ',' && !depth) break;
      }
      let end = i; while (end > start && whitespace(raw[end - 1])) end--;
      if (key === FIELD) primaryJSON = raw.slice(start, end);
      if (key === TRAINER_FIELD) trainerJSON = raw.slice(start, end);
      offset = raw[i] === ',' ? i + 1 : i;
    }
    return { present: names.has(FIELD), trainerPresent: names.has(TRAINER_FIELD), outer, primaryJSON, trainerJSON };
  }
  function validationTarget() {
    const h = { D_OBS: 16, D_ACT: 5, D_MORPH: 6,
      W_actor: new Float32Array(80), W_metamorph: new Float32Array(30), W_critic: new Float32Array(16),
      W_world: new Float32Array(256), W_actor_frozen: new Float32Array(80), W_world_frozen: new Float32Array(256) };
    h.deepCortex = { W_actor: h.W_actor, W_critic: h.W_critic };
    return h;
  }
  function checkOuter(snapshot, outer) {
    if (!safeInteger(outer.simulationTick) || snapshot.logicalTick !== outer.simulationTick ||
        snapshot.policyId !== outer.policyCid || snapshot.checkpointId !== outer.checkpointCid) fail('primary snapshot conflicts with outer tick/policy/checkpoint');
    if (own(outer, 'agentId') && outer.agentId !== snapshot.creatureId) fail('primary snapshot conflicts with outer creature identity');
  }
  function dataMethod(object, name) {
    for (let node = object, depth = 0; node && depth < 8; node = Object.getPrototypeOf(node), depth++) {
      const descriptor = Object.getOwnPropertyDescriptor(node, name);
      if (!descriptor) continue;
      if (!own(descriptor, 'value') || typeof descriptor.value !== 'function') fail('missing/accessor trainer method: ' + name);
      return descriptor.value;
    }
    fail('missing trainer method: ' + name);
  }
  async function prepare({ primary, trainer, registry, codec, crypto, json = null } = {}) {
    if (typeof primary?.create !== 'function' || typeof codec?.decode !== 'function' || typeof codec?.verifiedCopy !== 'function') fail('primary adapter and codec required');
    const source = inspect(json);
    if (source.trainerPresent && !source.present) fail('trainer committed state requires primary policy state');
    if (source.trainerPresent && typeof trainer?.create !== 'function') fail('trainer adapter required for committed state');
    if (trainer !== undefined && typeof trainer?.create !== 'function') fail('invalid trainer adapter');
    const adapter = await primary.create({ registry, codec, crypto });
    const trainerAdapter = trainer ? await trainer.create({ registry, codec, crypto }) : null;
    let decoded = null, savedSnapshot = null, trainerDecoded = null;
    if (source.present) {
      decoded = await codec.decode(source.primaryJSON, { crypto });
      const verified = codec.verifiedCopy(decoded);
      if (codec.canonicalDescriptorJSON(verified.architecture) !== codec.canonicalDescriptorJSON(adapter.architecture)) fail('primary architecture mismatch');
      checkOuter(verified.snapshot, source.outer);
      // Validate the complete static roster, layout and numeric policy before
      // activation without constructing or stepping an application model.
      adapter.preflight(decoded, validationTarget(), { generation: 0 });
      savedSnapshot = { ...verified.snapshot };
    }
    if (source.trainerPresent) {
      trainerDecoded = await codec.decode(source.trainerJSON, { crypto });
      const verified = codec.verifiedCopy(trainerDecoded);
      if (codec.canonicalDescriptorJSON(verified.architecture) !== codec.canonicalDescriptorJSON(trainerAdapter.architecture)) fail('trainer architecture mismatch');
      if (SNAPSHOT_FIELDS.some(key => verified.snapshot[key] !== savedSnapshot[key])) fail('trainer snapshot conflicts with primary snapshot');
      checkOuter(verified.snapshot, source.outer);
      trainerAdapter.validate(trainerDecoded);
    }
    const preparedRaw = json, hasPrimary = source.present, hasTrainer = source.trainerPresent, states = new WeakMap();
    const scope = hasTrainer ? PAIRED_SCOPE : SCOPE;
    function stateFor(h) {
      if (!h || typeof h !== 'object') fail('runtime object required');
      let state = states.get(h);
      if (!state) {
        state = { generation: 0, initialized: !hasPrimary, source: hasPrimary ? 'unapplied' : json ? 'legacy' : 'fresh',
          creatureId: null, modelEpoch: 0, applied: false, trainerInitialized: !hasTrainer,
          trainerStatus: hasTrainer ? 'unapplied' : 'trainer-not-present', trainerReceipt: null,
          trainerBinding: null, partialApplication: false };
        states.set(h, state);
      }
      return state;
    }
    function matchingSource(raw) {
      if (raw === preparedRaw) return hasPrimary;
      if (hasTrainer) fail('paired exact component source differs from asynchronously prepared JSON; prepare a new controller');
      const other = inspect(raw);
      if (other.present || other.trainerPresent) fail('exact component source differs from asynchronously prepared JSON; prepare a new controller');
      return false;
    }
    function engineFor(h, state) {
      const descriptor = Object.getOwnPropertyDescriptor(h, 'bleedingEdge25Engine');
      if (!descriptor || !own(descriptor, 'value') || !descriptor.value || typeof descriptor.value !== 'object') fail('trainer engine must be an own data field');
      const previous = state.trainerBinding;
      if (previous && ['value', 'writable', 'enumerable', 'configurable'].some(key => descriptor[key] !== previous[key])) fail('trainer engine binding changed');
      if (!previous) state.trainerBinding = descriptor;
      return descriptor.value;
    }
    function trainerPlan(h, state) {
      const engine = engineFor(h, state), snapshot = dataMethod(engine, 'workerTrainerSnapshot').call(engine);
      const generation = ownValue(snapshot, 'generation');
      if (!safeInteger(generation)) fail('invalid trainer generation');
      return { engine, plan: trainerAdapter.preflight(trainerDecoded, engine, { expectedGeneration: generation }) };
    }
    function requireStartup(options) {
      const descriptor = options && typeof options === 'object' && Object.getOwnPropertyDescriptor(options, 'startup');
      if (!descriptor || !own(descriptor, 'value') || descriptor.value !== true) fail('unsupported-live-restore: paired exact state is startup-only');
    }
    function checkDisjoint(h, engine) {
      const buffer = viewBuffer.call(ownValue(engine, 'W_hyper_u'));
      for (const key of PRIMARY_KEYS) if (viewBuffer.call(ownValue(h, key)) === buffer) fail('trainer and primary tensor backings must be disjoint');
    }
    function discardTrainer(prepared) {
      if (prepared) trainerAdapter.discard(prepared.plan, prepared.engine);
    }
    function preflight(h, raw, options) {
      const state = stateFor(h);
      if (state.partialApplication) fail('previous partial application requires a new runtime');
      if (!matchingSource(raw)) return { status: 'not-present', tensorCount: 0, scope };
      if (hasTrainer) requireStartup(options);
      adapter.preflight(decoded, h, { generation: state.generation });
      if (hasTrainer) {
        const prepared = trainerPlan(h, state);
        try {
          checkDisjoint(h, prepared.engine);
          if (engineFor(h, state) !== prepared.engine || !trainerAdapter.recheck(prepared.plan, prepared.engine)) fail('trainer preparation changed');
        }
        finally { discardTrainer(prepared); }
      }
      return { status: 'prepared', tensorCount: 6, trainerPrepared: hasTrainer, scope };
    }
    function apply(h, raw, options) {
      const state = stateFor(h);
      if (state.partialApplication) fail('previous partial application requires a new runtime');
      if (!matchingSource(raw)) {
        state.generation++; state.initialized = true; state.source = raw ? 'legacy' : 'fresh';
        state.creatureId = null; state.modelEpoch = 0; state.applied = false;
        state.trainerInitialized = true; state.trainerStatus = 'trainer-not-present'; state.trainerReceipt = null; state.trainerBinding = null;
        return { status: 'not-present', tensorCount: 0, trainer: null, scope };
      }
      if (hasTrainer) requireStartup(options);
      // Legacy assignments may have changed contents since early validation.
      // Resolve and verify current bindings afresh immediately before applying.
      const plan = adapter.preflight(decoded, h, { generation: state.generation });
      let preparedTrainer = null, result, trainerReceipt = null, primaryApplied = false;
      try {
        if (hasTrainer) {
          preparedTrainer = trainerPlan(h, state);
          checkDisjoint(h, preparedTrainer.engine);
          if (engineFor(h, state) !== preparedTrainer.engine || !trainerAdapter.recheck(preparedTrainer.plan, preparedTrainer.engine)) fail('trainer preparation changed before primary apply');
        }
        result = adapter.apply(plan, h, { generation: state.generation }); primaryApplied = true;
        if (preparedTrainer) {
          trainerReceipt = trainerAdapter.apply(preparedTrainer.plan, preparedTrainer.engine);
          if (!trainerReceipt || trainerReceipt.status !== 'restored' || trainerReceipt.active !== false || trainerReceipt.weightsBytes !== 64) fail('trainer commit did not return a suspended restore receipt');
        }
      } catch (cause) {
        if (primaryApplied || cause?.partialApplication === true) {
          state.initialized = false; state.applied = false; state.trainerInitialized = false;
          state.trainerStatus = 'partial-application'; state.trainerReceipt = null; state.partialApplication = true;
          const error = new Error('Exact component application failed after writes; runtime must remain closed: ' + String(cause?.message || cause));
          error.partialApplication = true; error.primaryApplied = primaryApplied; throw error;
        }
        throw cause;
      } finally { discardTrainer(preparedTrainer); }
      state.generation++; state.initialized = true; state.source = 'primary'; state.applied = true;
      state.creatureId = savedSnapshot.creatureId; state.modelEpoch = savedSnapshot.modelEpoch;
      state.trainerInitialized = true; state.trainerStatus = hasTrainer ? 'restored-suspended' : 'trainer-not-present';
      state.trainerReceipt = trainerReceipt ? { ...trainerReceipt } : null;
      return { ...result, generation: state.generation, trainer: trainerReceipt ? { ...trainerReceipt } : null, scope };
    }
    function capture(h) {
      const state = stateFor(h);
      if (!state.initialized) fail('prepared primary state has not been applied to this runtime');
      const logicalTick = ownValue(h, 'simulationTick');
      if (!safeInteger(logicalTick)) fail('invalid current logical tick');
      const creatureId = state.creatureId || identifier(ownValue(h, 'agentId'));
      const snapshot = { creatureId, policyId: identifier(ownValue(h, 'policyCid')), checkpointId: identifier(ownValue(h, 'checkpointCid')),
        logicalTick, modelEpoch: state.modelEpoch, capturedAt: new Date().toISOString(), resumeBoundary: 'fresh-browser-authority' };
      return adapter.capture(h, snapshot, { generation: state.generation,
        provenance: { component: 'primary-policy-tensors', scope: 'six-tensor-subset', bootstrapSource: state.source, completeApplicationCatalog: false } });
    }
    function captureComponents(h) {
      const state = stateFor(h), primaryCapture = capture(h);
      if (!state.trainerInitialized) fail('prepared trainer state has not been applied to this runtime');
      let trainerCapture = null;
      if (trainerAdapter) {
        const engine = engineFor(h, state); checkDisjoint(h, engine);
        trainerCapture = trainerAdapter.capture(engine, primaryCapture.snapshot,
          { provenance: { component: 'committed-trainer', completeApplicationCatalog: false, bootstrapSource: state.trainerStatus } });
        if (engineFor(h, state) !== engine) fail('trainer engine binding changed during capture');
        checkDisjoint(h, engine);
      }
      return { primary: primaryCapture, trainer: trainerCapture };
    }
    function snapshot(h) {
      const state = stateFor(h);
      return { prepared: hasPrimary, initialized: state.initialized, applied: state.applied, source: state.source,
        generation: state.generation, creatureId: state.creatureId, modelEpoch: state.modelEpoch,
        tensorCount: 6, float32Values: 718, tensorBytes: 2872, trainerPrepared: hasTrainer,
        trainerInitialized: state.trainerInitialized, trainerStatus: state.trainerStatus,
        trainerReceipt: state.trainerReceipt ? { ...state.trainerReceipt } : null,
        partialApplication: state.partialApplication, scope };
    }
    return Object.freeze({ architecture: adapter.architecture, trainerArchitecture: trainerAdapter?.architecture || null,
      scope, preflight, apply, capture, captureComponents, snapshot });
  }
  return Object.freeze({ prepare, FIELD, TRAINER_FIELD, scope: PAIRED_SCOPE });
});
