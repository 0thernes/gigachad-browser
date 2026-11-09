/* Legacy genome formatting plus optional exact primary/trainer worker encoding. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveGenomeCodec = api;
  // This same file is the dedicated Worker entry point. No DOM or runtime state
  // is available in that scope: only the already-cloned message is serialized.
  if (root && typeof root.document === 'undefined' && typeof root.importScripts === 'function' &&
      typeof root.postMessage === 'function' && typeof root.addEventListener === 'function') {
    root.addEventListener('message', async event => {
      const { id, payload } = event.data || {};
      const now = () => root.performance?.now?.() ?? Date.now();
      const started = now();
      try {
        api.assertIsolatedSnapshot(payload);
        if (api.hasAsyncState(payload) && !root.AliveLearnedStateCodec) root.importScripts('alive-learned-state-codec.js');
        const json = await api.encodeAsync(payload);
        root.postMessage({ id, json, serializationMs: Math.max(0, now() - started) });
      } catch (error) {
        root.postMessage({ id, error: String(error?.message || error).slice(0, 300),
          serializationMs: Math.max(0, now() - started) });
      }
    });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const marker = '__alive_genome_numeric_array_v1__';
  const authenticMarker = '__alive_genome_authentic_state_v1__';
  const primaryMarker = '__alive_genome_primary_state_v1__';
  const trainerMarker = '__alive_genome_trainer_state_v1__';
  const authenticSchema = 'gigachad.authentic-asmodensius.state.v1';
  const authenticLimit = 8 * 1024 * 1024;
  function numericArray(values, digits) {
    return { [marker]: true, values, digits };
  }
  function authenticState(payload, sourceDigest) {
    return { [authenticMarker]: true, payload, sourceDigest };
  }
  function primaryState(captured) { return { [primaryMarker]: true, captured }; }
  function trainerState(captured) { return { [trainerMarker]: true, captured }; }
  function trainerField(payload) {
    const field = payload && typeof payload === 'object' && Object.getOwnPropertyDescriptor(payload, 'trainerCommittedState');
    if (field && !Object.prototype.hasOwnProperty.call(field, 'value')) throw new TypeError('Trainer committed state must be an own data field');
    return field;
  }
  function hasAsyncState(payload) {
    // Presence, not marker truthiness: malformed reserved trainer data must
    // never escape through the legacy serialization path.
    return !!trainerField(payload) || hasPrimaryState(payload);
  }
  function hasPrimaryState(payload) {
    const field = payload && typeof payload === 'object' && Object.getOwnPropertyDescriptor(payload, 'primaryPolicyState');
    if (!field) return false;
    if (!Object.prototype.hasOwnProperty.call(field, 'value')) throw new TypeError('Primary policy state must be an own data field');
    const marker = field.value && typeof field.value === 'object' && Object.getOwnPropertyDescriptor(field.value, primaryMarker);
    if (marker && !Object.prototype.hasOwnProperty.call(marker, 'value')) throw new TypeError('Primary policy marker must be plain data');
    return marker?.value === true;
  }
  function assertIsolatedSnapshot(payload) {
    // Ordinary message data has already been copied by postMessage. Shared
    // backing stores are the exception: reject them before reading model values
    // for JSON. Keep this graph walk off the renderer, including Map/Set members
    // that JSON itself would ignore and non-enumerable Error causes.
    const seen = new Set(), pending = [payload];
    while (pending.length) {
      const value = pending.pop();
      if (!value || typeof value !== 'object' || seen.has(value)) continue;
      seen.add(value);
      if (typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer) {
        throw new TypeError('SharedArrayBuffer cannot provide an isolated worker snapshot');
      }
      if (value instanceof ArrayBuffer) continue;
      if (ArrayBuffer.isView(value)) { pending.push(value.buffer); continue; }
      if (typeof WebAssembly !== 'undefined' && value instanceof WebAssembly.Memory) {
        pending.push(value.buffer); continue;
      }
      if (value instanceof Map) {
        for (const [key, item] of value) pending.push(key, item);
        continue;
      }
      if (value instanceof Set) { for (const item of value) pending.push(item); continue; }
      for (const key of Object.getOwnPropertyNames(value)) pending.push(value[key]);
    }
  }
  function formatAuthenticState(state, sourceDigest) {
    const payload = JSON.stringify(state, (_key, value) => Object.is(value, -0) ? { $number: '-0' } : value);
    // This is the existing UTF-16 string-length limit and checksum contract,
    // not a UTF-8 byte limit or a cryptographic authentication checksum.
    if (payload.length > authenticLimit) throw new Error('Authentic checkpoint exceeds 8 MiB; state was not saved');
    let hash = 2166136261;
    for (let i = 0; i < payload.length; i++) hash = Math.imul(hash ^ payload.charCodeAt(i), 16777619) >>> 0;
    return { schema: authenticSchema, sourceDigest, checksum: hash.toString(16).padStart(8, '0'), payload };
  }
  function encode(payload) {
    if (trainerField(payload)) throw new TypeError('Trainer committed state requires paired asynchronous encoding');
    return JSON.stringify(payload, (_key, value) => {
      if (value && value[primaryMarker] === true) throw new TypeError('Pending primary policy state requires asynchronous encoding');
      if (value && value[trainerMarker] === true) throw new TypeError('Pending trainer committed state requires asynchronous encoding');
      if (value && value[marker] === true) {
        // Keep the original per-number rounding semantics, including NaN,
        // infinity, negative zero, and toFixed's range/type errors.
        return Array.from(value.values, number => Number(number.toFixed(value.digits)));
      }
      if (value && value[authenticMarker] === true) return formatAuthenticState(value.payload, value.sourceDigest);
      return value;
    });
  }
  function pendingCapture(field, marker, label) {
    if (!field || !Object.prototype.hasOwnProperty.call(field, 'value') || !field.enumerable) {
      throw new TypeError(label + ' must be an enumerable data field');
    }
    const wrapper = field.value;
    if (!wrapper || typeof wrapper !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(wrapper))) {
      throw new TypeError('Invalid ' + label.toLowerCase() + ' marker');
    }
    const descriptors = Object.getOwnPropertyDescriptors(wrapper);
    if (Reflect.ownKeys(descriptors).length !== 2 || !descriptors.captured ||
        !Object.prototype.hasOwnProperty.call(descriptors.captured, 'value') || !descriptors.captured.enumerable ||
        !descriptors[marker]?.enumerable || !Object.prototype.hasOwnProperty.call(descriptors[marker], 'value') ||
        descriptors[marker].value !== true) throw new TypeError('Invalid ' + label.toLowerCase() + ' marker');
    return descriptors.captured.value;
  }
  function checkPairedSnapshot(primary, trainer, legacyJSON) {
    // These records come from the codec's owned results, never the live inputs
    // retained by the caller. Different components have different architectures.
    const keys = ['creatureId', 'policyId', 'checkpointId', 'logicalTick', 'modelEpoch', 'capturedAt', 'resumeBoundary'];
    if (!primary?.snapshot || !trainer?.snapshot || keys.some(key => primary.snapshot[key] !== trainer.snapshot[key])) {
      throw new TypeError('Primary and trainer snapshot metadata disagree');
    }
    const snapshot = primary.snapshot, outer = JSON.parse(legacyJSON);
    if (!Number.isSafeInteger(outer.simulationTick) || Object.is(outer.simulationTick, -0) || outer.simulationTick < 0 ||
        snapshot.logicalTick !== outer.simulationTick || snapshot.policyId !== outer.policyCid || snapshot.checkpointId !== outer.checkpointCid ||
        (Object.prototype.hasOwnProperty.call(outer, 'agentId') && snapshot.creatureId !== outer.agentId)) {
      throw new TypeError('Paired snapshot conflicts with outer tick/policy/checkpoint/creature');
    }
  }
  async function encodeAsync(payload, options = {}) {
    if (!hasAsyncState(payload)) return encode(payload);
    if (options.signal?.aborted) throw new Error('Genome encoding cancelled');
    const fields = Object.getOwnPropertyDescriptors(payload);
    if (![Object.prototype, null].includes(Object.getPrototypeOf(payload))) throw new TypeError('Primary genome payload must be a plain object');
    const captured = pendingCapture(fields.primaryPolicyState, primaryMarker, 'Primary policy state');
    const paired = Object.prototype.hasOwnProperty.call(fields, 'trainerCommittedState');
    const trainer = paired ? pendingCapture(fields.trainerCommittedState, trainerMarker, 'Trainer committed state') : null;
    // Root replacement could reintroduce the omitted field (and duplicate the
    // appended key). Ordinary legacy encode retains its previous toJSON rules.
    if (fields.toJSON && (!Object.prototype.hasOwnProperty.call(fields.toJSON, 'value') || typeof fields.toJSON.value === 'function')) {
      throw new TypeError('Primary genome cannot replace its root with toJSON');
    }
    const legacy = {};
    for (const key of Reflect.ownKeys(fields)) {
      if (key === 'primaryPolicyState' || key === 'trainerCommittedState') continue;
      // Capture the normal JSON behavior now. Never retain a live legacy graph
      // across the first WebCrypto await; descriptors keep getters synchronous.
      Object.defineProperty(legacy, key, fields[key]);
    }
    const legacyJSON = encode(legacy);
    if (typeof legacyJSON !== 'string' || !legacyJSON.startsWith('{') || !legacyJSON.endsWith('}')) throw new TypeError('Primary genome must encode as an object');
    const learned = options.learnedCodec || root?.AliveLearnedStateCodec;
    if (!learned || typeof learned.seal !== 'function') throw new Error('Exact learned-state codec is unavailable');
    const sealOptions = { crypto: options.crypto, signal: options.signal };
    let wire, trainerWire;
    if (paired) {
      // Start both seals in this turn: each synchronously owns every input byte
      // before its first hash await. A failed sibling cannot finish the physical
      // encoding/drain promise while the other hash remains in progress.
      const start = input => { try { return Promise.resolve(learned.seal(input, sealOptions)); } catch (error) { return Promise.reject(error); } };
      const primarySeal = start(captured), trainerSeal = start(trainer);
      const results = await Promise.allSettled([primarySeal, trainerSeal]);
      if (options.signal?.aborted) throw new Error('Genome encoding cancelled');
      for (const result of results) if (result.status === 'rejected') throw result.reason;
      wire = results[0].value; trainerWire = results[1].value;
      checkPairedSnapshot(wire, trainerWire, legacyJSON);
    } else {
      // Preserve the existing primary-only contract and legacy formatting.
      wire = await learned.seal(captured, sealOptions);
    }
    if (options.signal?.aborted) throw new Error('Genome encoding cancelled');
    const json = legacyJSON.slice(0, -1) + (legacyJSON === '{}' ? '' : ',') + '"primaryPolicyState":' + JSON.stringify(wire) +
      (paired ? ',"trainerCommittedState":' + JSON.stringify(trainerWire) : '') + '}';
    if (json.length > 32 * 1024 * 1024 || new TextEncoder().encode(json).byteLength > 32 * 1024 * 1024) throw new RangeError('Combined genome exceeds the 32 MiB payload bound');
    return json;
  }
  return { numericArray, authenticState, primaryState, trainerState, hasPrimaryState, hasAsyncState, formatAuthenticState, assertIsolatedSnapshot, encode, encodeAsync };
});
