/* Legacy genome formatting plus optional exact primary-state worker encoding. */
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
        if (api.hasPrimaryState(payload) && !root.AliveLearnedStateCodec) root.importScripts('alive-learned-state-codec.js');
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
  const authenticSchema = 'gigachad.authentic-asmodensius.state.v1';
  const authenticLimit = 8 * 1024 * 1024;
  function numericArray(values, digits) {
    return { [marker]: true, values, digits };
  }
  function authenticState(payload, sourceDigest) {
    return { [authenticMarker]: true, payload, sourceDigest };
  }
  function primaryState(captured) { return { [primaryMarker]: true, captured }; }
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
    return JSON.stringify(payload, (_key, value) => {
      if (value && value[primaryMarker] === true) throw new TypeError('Pending primary policy state requires asynchronous encoding');
      if (value && value[marker] === true) {
        // Keep the original per-number rounding semantics, including NaN,
        // infinity, negative zero, and toFixed's range/type errors.
        return Array.from(value.values, number => Number(number.toFixed(value.digits)));
      }
      if (value && value[authenticMarker] === true) return formatAuthenticState(value.payload, value.sourceDigest);
      return value;
    });
  }
  async function encodeAsync(payload, options = {}) {
    if (!hasPrimaryState(payload)) return encode(payload);
    if (options.signal?.aborted) throw new Error('Genome encoding cancelled');
    const fields = Object.getOwnPropertyDescriptors(payload);
    if (![Object.prototype, null].includes(Object.getPrototypeOf(payload))) throw new TypeError('Primary genome payload must be a plain object');
    if (!fields.primaryPolicyState || !Object.prototype.hasOwnProperty.call(fields.primaryPolicyState, 'value') ||
        !fields.primaryPolicyState.enumerable) throw new TypeError('Primary policy state must be an enumerable data field');
    const wrapper = fields.primaryPolicyState.value, descriptors = Object.getOwnPropertyDescriptors(wrapper);
    if (![Object.prototype, null].includes(Object.getPrototypeOf(wrapper)) || Reflect.ownKeys(descriptors).length !== 2 ||
        !descriptors.captured || !Object.prototype.hasOwnProperty.call(descriptors.captured, 'value') ||
        !descriptors[primaryMarker]?.enumerable || !Object.prototype.hasOwnProperty.call(descriptors[primaryMarker], 'value') ||
        descriptors[primaryMarker].value !== true || !descriptors.captured.enumerable) throw new TypeError('Invalid primary policy state marker');
    // Root replacement could reintroduce the omitted field (and duplicate the
    // appended key). Ordinary legacy encode retains its previous toJSON rules.
    if (fields.toJSON && (!Object.prototype.hasOwnProperty.call(fields.toJSON, 'value') || typeof fields.toJSON.value === 'function')) {
      throw new TypeError('Primary genome cannot replace its root with toJSON');
    }
    const captured = descriptors.captured.value, legacy = {};
    for (const key of Reflect.ownKeys(fields)) {
      if (key === 'primaryPolicyState') continue;
      // Capture the normal JSON behavior now. Never retain a live legacy graph
      // across the first WebCrypto await; descriptors keep getters synchronous.
      Object.defineProperty(legacy, key, fields[key]);
    }
    const legacyJSON = encode(legacy);
    if (typeof legacyJSON !== 'string' || !legacyJSON.startsWith('{') || !legacyJSON.endsWith('}')) throw new TypeError('Primary genome must encode as an object');
    const learned = options.learnedCodec || root?.AliveLearnedStateCodec;
    if (!learned || typeof learned.seal !== 'function') throw new Error('Exact learned-state codec is unavailable');
    // seal owns every tensor/metadata byte synchronously before its first await.
    const wire = await learned.seal(captured, { crypto: options.crypto, signal: options.signal });
    if (options.signal?.aborted) throw new Error('Genome encoding cancelled');
    const json = legacyJSON.slice(0, -1) + (legacyJSON === '{}' ? '' : ',') + '"primaryPolicyState":' + JSON.stringify(wire) + '}';
    if (json.length > 32 * 1024 * 1024 || new TextEncoder().encode(json).byteLength > 32 * 1024 * 1024) throw new RangeError('Combined genome exceeds the 32 MiB payload bound');
    return json;
  }
  return { numericArray, authenticState, primaryState, hasPrimaryState, formatAuthenticState, assertIsolatedSnapshot, encode, encodeAsync };
});
