/* On-demand tensor inspection. Copies are captured synchronously, then numeric
 * statistics yield in bounded chunks. Hashes indicate byte changes, not utility. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveTensorEvidence = api;
  if (root?.document && typeof humunculusRuntime !== 'undefined') {
    const inspector = api.create({ getRoots: () => ({ creature: humunculusRuntime, mesh: hybridBrainMesh }) });
    root.getAliveTensorEvidence = () => inspector.request();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const typed = Object.getPrototypeOf(Float32Array.prototype);
  const get = name => Object.getOwnPropertyDescriptor(typed, name).get;
  const intrinsic = Object.freeze({ type: get(Symbol.toStringTag), length: get('length'), buffer: get('buffer'),
    offset: get('byteOffset'), bytes: get('byteLength'), set: Uint8Array.prototype.set,
    bufferBytes: Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get });
  const constructors = Object.freeze({ Float32Array, Float64Array, Int8Array, Uint8Array, Uint8ClampedArray,
    Int16Array, Uint16Array, Int32Array, Uint32Array, BigInt64Array, BigUint64Array });
  function collect(roots, { maxBytes = 32 * 1024 * 1024, maxArrays = 2048, maxObjects = 4096, maxProperties = 512 } = {}) {
    const tensors = [], seen = new Set(), spans = new Map();
    let bytes = 0, omitted = 0, objects = 0;
    function visit(value, path, depth) {
      if (!value || typeof value !== 'object') return;
      if (ArrayBuffer.isView(value)) {
        const dtype = intrinsic.type.call(value), Constructor = constructors[dtype];
        if (!Constructor) return;
        const buffer = intrinsic.buffer.call(value), offset = intrinsic.offset.call(value), size = intrinsic.bytes.call(value), length = intrinsic.length.call(value);
        // Shared memory cannot provide a coherent single-thread capture.
        try { intrinsic.bufferBytes.call(buffer); } catch (_) { omitted++; return; }
        const signature = `${offset}:${size}:${dtype}`;
        let known = spans.get(buffer); if (!known) { known = new Map(); spans.set(buffer, known); }
        if (known.has(signature)) { known.get(signature).aliases.push(path); return; }
        if (bytes + size > maxBytes || tensors.length >= maxArrays) { omitted++; return; }
        const values = new Constructor(length);
        intrinsic.set.call(new Uint8Array(intrinsic.buffer.call(values)), new Uint8Array(buffer, offset, size));
        const row = { id: path, owner: path.split('.').slice(0, 2).join('.'), dtype, length, aliases: [], values };
        tensors.push(row); known.set(signature, row); bytes += size; return;
      }
      if (seen.has(value)) return;
      seen.add(value);
      if (depth <= 0 || ++objects > maxObjects) { omitted++; return; }
      // No getters, application callbacks, Maps or arbitrary iterators execute.
      const array = Array.isArray(value), count = array ? value.length : null;
      const keys = array ? Array.from({ length: Math.min(count, maxProperties) }, (_, i) => String(i)) : Object.getOwnPropertyNames(value);
      if (array ? count > maxProperties : keys.length > maxProperties) omitted++;
      for (const key of keys.slice(0, maxProperties)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor) continue;
        if ('value' in descriptor && typeof descriptor.value === 'object') visit(descriptor.value, path ? path + '.' + key : key, depth - 1);
      }
    }
    for (const [name, value] of Object.entries(roots || {})) visit(value, name, 7);
    return { tensors, bytes, omitted, objects };
  }
  function create({ getRoots, clock = Date.now, yieldTask = () => new Promise(resolve => setTimeout(resolve, 0)), sliceValues = 32768, limits } = {}) {
    if (typeof getRoots !== 'function') throw new TypeError('Tensor roots provider required');
    const previous = new Map();
    let pending = null, result = { sampledAt: null, status: 'not_sampled', rows: [] };
    async function inspect() {
      const capturedAt = clock(), capture = collect(getRoots(), limits), rows = [];
      let remaining = Math.max(1, sliceValues), valuesScanned = 0;
      for (const tensor of capture.tensors) {
        let finite = 0, nonzero = 0, mean = 0, scale = 0, scaledSquares = 0, min = Infinity, max = -Infinity;
        for (let i = 0; i < tensor.length; i++) {
          const value = Number(tensor.values[i]);
          if (Number.isFinite(value)) {
            finite++; nonzero += value !== 0 ? 1 : 0;
            const difference = value - mean;
            mean = Number.isFinite(difference) ? mean + difference / finite : mean * (1 - 1 / finite) + value / finite;
            const magnitude = Math.abs(value);
            if (magnitude > 0) {
              if (magnitude > scale) { scaledSquares = 1 + scaledSquares * (scale / magnitude) ** 2; scale = magnitude; }
              else scaledSquares += (magnitude / scale) ** 2;
            }
            min = Math.min(min, value); max = Math.max(max, value);
          }
          valuesScanned++;
          if (--remaining <= 0) { remaining = Math.max(1, sliceValues); await yieldTask(); }
        }
        let hash = 2166136261;
        const bytes = new Uint8Array(tensor.values.buffer, tensor.values.byteOffset, tensor.values.byteLength);
        for (let i = 0; i < bytes.length; i++) {
          hash = Math.imul(hash ^ bytes[i], 16777619) >>> 0;
          if ((i & 131071) === 131071) await yieldTask();
        }
        const fingerprint = hash.toString(16).padStart(8, '0'), before = previous.get(tensor.id);
        previous.set(tensor.id, fingerprint);
        rows.push({ id: tensor.id, owner: tensor.owner, dtype: tensor.dtype, length: tensor.length, finite, nonzero,
          min: finite ? min : null, max: finite ? max : null, mean: finite ? mean : null, rms: finite ? scale * Math.sqrt(Math.min(1, scaledSquares / finite)) : null,
          hash: fingerprint, changed: before === undefined ? null : before !== fingerprint, changedValues: null,
          inspection: 'full', aliases: tensor.aliases, sample: Array.from(tensor.values.slice(0, 16), v => typeof v === 'bigint' ? String(v) : Number.isFinite(v) ? v : String(v)),
          numericScope: /Big/.test(tensor.dtype) ? 'Integer bytes hashed exactly; numeric statistics use approximate Number conversion' : 'All captured values scanned' });
      }
      // Prevent historical paths from growing without bound after structural changes.
      const live = new Set(rows.map(row => row.id));
      for (const id of previous.keys()) if (!live.has(id)) previous.delete(id);
      result = { sampledAt: capturedAt, completedAt: clock(), status: 'completed', rows, bytes: capture.bytes, omitted: capture.omitted, valuesScanned,
        scope: 'Owned nonshared typed arrays within depth/size/property limits; full copied-array scans. Ordinary-object key enumeration is host work. Byte changes are not proof of learning or causal influence. Non-array/private state is outside this inspection.' };
      return result;
    }
    function start() {
      if (!pending) {
        pending = inspect().catch(error => { result = { ...result, status: 'error', reason: String(error.message).slice(0, 240) }; return result; }).finally(() => { pending = null; });
      }
      return pending;
    }
    return Object.freeze({
      request() { start(); return { ...result, collecting: Boolean(pending) }; },
      sample() { return start(); },
      snapshot() { return { ...result, collecting: Boolean(pending) }; }
    });
  }
  return Object.freeze({ collect, create });
});
