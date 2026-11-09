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
  const SCOPE = 'Exact six primary tensors only; remaining legacy genome is partial, not full learned-state continuity';
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
    if (raw === null || raw === undefined || raw === '') return { present: false, outer: null };
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
    const names = new Set(); let offset = skip(0) + 1, primaryJSON = null;
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
      offset = raw[i] === ',' ? i + 1 : i;
    }
    return { present: names.has(FIELD), outer, primaryJSON };
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
  async function prepare({ primary, registry, codec, crypto, json = null } = {}) {
    if (typeof primary?.create !== 'function' || typeof codec?.decode !== 'function' || typeof codec?.verifiedCopy !== 'function') fail('primary adapter and codec required');
    const source = inspect(json);
    const adapter = await primary.create({ registry, codec, crypto });
    let decoded = null, savedSnapshot = null;
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
    const preparedRaw = json, hasPrimary = source.present, states = new WeakMap();
    function stateFor(h) {
      if (!h || typeof h !== 'object') fail('runtime object required');
      let state = states.get(h);
      if (!state) {
        state = { generation: 0, initialized: !hasPrimary, source: hasPrimary ? 'unapplied' : json ? 'legacy' : 'fresh',
          creatureId: null, modelEpoch: 0, applied: false };
        states.set(h, state);
      }
      return state;
    }
    function matchingSource(raw) {
      if (raw === preparedRaw) return hasPrimary;
      const other = inspect(raw);
      if (other.present) fail('primary source differs from asynchronously prepared JSON; prepare a new controller');
      return false;
    }
    function preflight(h, raw) {
      const state = stateFor(h);
      if (!matchingSource(raw)) return { status: 'not-present', tensorCount: 0, scope: SCOPE };
      adapter.preflight(decoded, h, { generation: state.generation });
      return { status: 'prepared', tensorCount: 6, scope: SCOPE };
    }
    function apply(h, raw) {
      const state = stateFor(h);
      if (!matchingSource(raw)) {
        state.generation++; state.initialized = true; state.source = raw ? 'legacy' : 'fresh';
        state.creatureId = null; state.modelEpoch = 0; state.applied = false;
        return { status: 'not-present', tensorCount: 0, scope: SCOPE };
      }
      // Legacy assignments may have changed contents since early validation.
      // Resolve and verify current bindings afresh immediately before applying.
      const plan = adapter.preflight(decoded, h, { generation: state.generation });
      const result = adapter.apply(plan, h, { generation: state.generation });
      state.generation++; state.initialized = true; state.source = 'primary'; state.applied = true;
      state.creatureId = savedSnapshot.creatureId; state.modelEpoch = savedSnapshot.modelEpoch;
      return { ...result, generation: state.generation, scope: SCOPE };
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
    function snapshot(h) {
      const state = stateFor(h);
      return { prepared: hasPrimary, initialized: state.initialized, applied: state.applied, source: state.source,
        generation: state.generation, creatureId: state.creatureId, modelEpoch: state.modelEpoch,
        tensorCount: 6, float32Values: 718, tensorBytes: 2872, scope: SCOPE };
    }
    return Object.freeze({ architecture: adapter.architecture, scope: SCOPE, preflight, apply, capture, snapshot });
  }
  return Object.freeze({ prepare, FIELD, scope: SCOPE });
});
