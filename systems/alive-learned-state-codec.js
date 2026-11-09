/* Pure, bounded learned-state wire codec. This is not a live model catalog or an
 * importer. A trusted registry must prove completeness, semantics and bindings.
 * String input is compact JSON.stringify-normalized JSON: duplicate members,
 * whitespace and alternate number/escape spellings are intentionally rejected.
 * Object key order need not be unique. Only descriptor fingerprints sort keys.
 * No worker listener, storage operation or application initialization occurs. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveLearnedStateCodec = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SCHEMA = 'gigachad.learned-state.v1';
  const SCOPE = 'Bounded wire-format verification only; complete live-model coverage and safe application require a trusted registry and separate integration qualification.';
  const LIMITS = Object.freeze({ payloadBytes: 32 * 1024 * 1024, tensorBytes: 24 * 1024 * 1024,
    tensors: 4096, states: 16384, components: 64, aliases: 32, pathDepth: 16,
    identifierLength: 128, rank: 8, stateDepth: 32, stateNodes: 100000,
    jsonDepth: 128, jsonNodes: 250000 });
  const DTYPES = Object.freeze({ Int8Array: 1, Uint8Array: 1, Uint8ClampedArray: 1,
    Int16Array: 2, Uint16Array: 2, Int32Array: 4, Uint32Array: 4,
    Float32Array: 4, Float64Array: 8, BigInt64Array: 8, BigUint64Array: 8 });
  const tensorKeys = ['id', 'componentId', 'role', 'paths', 'dtype', 'dimensions', 'length',
    'byteLength', 'byteOrder', 'backingGroup', 'backingOffset', 'backingByteLength'];
  const unsafe = new Set(['__proto__', 'prototype', 'constructor']);
  const encoder = new TextEncoder();
  // A decoded handle's public fields are diagnostic mirrors. Registry preflight
  // consumes verifiedCopy(handle), never caller-mutable mirrors. The capsule
  // retains metadata and one set of view bytes, not JSON/base64 or the full blob.
  const verifiedSnapshots = new WeakMap();
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const fail = message => { throw new TypeError(`Learned-state: ${message}`); };
  const abort = signal => { if (signal && signal.aborted) throw new Error('Learned-state operation cancelled'); };
  const safeInteger = (value, minimum = 0) => Number.isSafeInteger(value) && !Object.is(value, -0) && value >= minimum;
  const integerCheck = (value, label, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) => {
    if (!safeInteger(value, minimum) || value > maximum) fail(`invalid ${label}`);
    return value;
  };
  function identifier(value, label = 'identifier') {
    if (typeof value !== 'string' || !value.length || value.length > LIMITS.identifierLength ||
        unsafe.has(value) || /[\u0000-\u001f\u007f]/.test(value)) fail(`invalid ${label}`);
    return value;
  }
  const hashCheck = value => { if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) fail('invalid SHA-256'); };
  function properties(value, label) {
    if (!value || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(`invalid ${label} record`);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Reflect.ownKeys(descriptors).some(key => typeof key !== 'string')) fail(`symbol in ${label}`);
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (unsafe.has(key) || !own(descriptor, 'value') || !descriptor.enumerable) fail(`unsafe property in ${label}`);
    }
    return descriptors;
  }
  function exactDescriptors(value, required, optional = [], label = 'schema') {
    const descriptors = properties(value, label), allowed = new Set(required.concat(optional));
    if (required.some(key => !own(descriptors, key)) || Object.keys(descriptors).some(key => !allowed.has(key))) fail(`unexpected or missing ${label} fields`);
    return descriptors;
  }
  function exact(value, required, optional = [], label = 'schema') { exactDescriptors(value, required, optional, label); return value; }
  function arrayDescriptors(value, maximum, label) {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) fail(`invalid ${label} array`);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const length = descriptors.length && descriptors.length.value;
    if (!safeInteger(length) || length > maximum) fail(`invalid ${label} array length`);
    if (Reflect.ownKeys(descriptors).length !== length + 1) fail(`sparse or extended ${label} array`);
    for (let i = 0; i < length; i++) {
      const descriptor = descriptors[i];
      if (!descriptor || !own(descriptor, 'value') || !descriptor.enumerable) fail(`unsafe ${label} array`);
    }
    return descriptors;
  }
  function array(value, maximum, label) { arrayDescriptors(value, maximum, label); return value; }
  function arrayValues(value, maximum, label) {
    const descriptors = arrayDescriptors(value, maximum, label), result = [];
    for (let i = 0; i < descriptors.length.value; i++) result.push(descriptors[i].value);
    return result;
  }
  function utf8Length(value) {
    let bytes = 0;
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code < 0x80) bytes++;
      else if (code < 0x800) bytes += 2;
      else if (code >= 0xd800 && code <= 0xdbff && i + 1 < value.length &&
          value.charCodeAt(i + 1) >= 0xdc00 && value.charCodeAt(i + 1) <= 0xdfff) { bytes += 4; i++; }
      else bytes += 3;
      if (bytes > LIMITS.payloadBytes) fail('UTF-8 size exceeds payload limit');
    }
    return bytes;
  }
  function budget() { return { nodes: 0, chars: 0, ancestors: new Set() }; }
  function cloneData(value, state = budget(), depth = 0) {
    if (++state.nodes > LIMITS.jsonNodes || depth > LIMITS.jsonDepth) fail('JSON work budget exceeded');
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || Object.is(value, -0)) fail('noncanonical JSON number');
      return value;
    }
    if (typeof value === 'string') {
      state.chars += value.length;
      if (state.chars > LIMITS.payloadBytes) fail('JSON string budget exceeded');
      return value;
    }
    if (!value || typeof value !== 'object' || state.ancestors.has(value)) fail('non-data or cyclic value');
    state.ancestors.add(value);
    let copy;
    if (Array.isArray(value)) {
      copy = arrayValues(value, LIMITS.jsonNodes, 'data').map(item => cloneData(item, state, depth + 1));
    } else {
      const descriptors = properties(value, 'data');
      copy = {};
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (++state.nodes > LIMITS.jsonNodes) fail('JSON work budget exceeded');
        state.chars += key.length;
        if (state.chars > LIMITS.payloadBytes) fail('JSON string budget exceeded');
        Object.defineProperty(copy, key, { value: cloneData(descriptor.value, state, depth + 1), enumerable: true, writable: true, configurable: true });
      }
    }
    state.ancestors.delete(value);
    return copy;
  }
  function prescan(json) {
    if (typeof json !== 'string' || json.length > LIMITS.payloadBytes || !json.length) fail('invalid JSON payload size');
    const bytes = utf8Length(json);
    let depth = 0, nodes = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json[i];
      if (char === '{' || char === '[') { depth++; nodes++; }
      else if (char === '}' || char === ']') depth--;
      else if (char === '"') {
        nodes++;
        for (++i; i < json.length; i++) { if (json[i] === '\\') i++; else if (json[i] === '"') break; }
      } else if (!/[\s,:]/.test(char)) {
        nodes++;
        while (i + 1 < json.length && !/[\s,\]}:]/.test(json[i + 1])) i++;
      }
      if (depth > LIMITS.jsonDepth || nodes > LIMITS.jsonNodes) fail('JSON work budget exceeded');
    }
    return bytes;
  }
  function normalizedJSON(record) {
    const json = JSON.stringify(record);
    if (json.length > LIMITS.payloadBytes) fail('JSON payload exceeds 32 MiB');
    // Admission of generated output uses the same lexical budget as string
    // input, so a successful encode cannot exceed the decoder's parser budget.
    const bytes = prescan(json);
    return { json, bytes };
  }
  const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  async function digest(bytes, options = {}) {
    abort(options.signal);
    const provider = options.crypto || globalThis.crypto;
    if (!provider || !provider.subtle || typeof provider.subtle.digest !== 'function') fail('WebCrypto SHA-256 unavailable');
    const output = await provider.subtle.digest('SHA-256', bytes);
    abort(options.signal);
    const result = new Uint8Array(output);
    if (result.byteLength !== 32) fail('invalid SHA-256 provider result');
    return hex(result);
  }
  function canonicalDescriptorJSON(value) {
    const copied = cloneData(value);
    const sort = item => {
      if (Array.isArray(item)) return item.map(sort);
      if (item && typeof item === 'object') {
        const result = {};
        for (const key of Object.keys(item).sort()) result[key] = sort(item[key]);
        return result;
      }
      return item;
    };
    return normalizedJSON(sort(copied)).json;
  }
  function fingerprintDescriptors(value, options = {}) {
    const json = canonicalDescriptorJSON(value);
    return digest(encoder.encode('gigachad.learned-state.registry.v1\0' + json), options);
  }
  function float64(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) fail('float64 must be finite');
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setFloat64(0, value, true);
    return { $type: 'f64', hex: hex(bytes) };
  }
  function integer(value) { integerCheck(value, 'i53', -Number.MAX_SAFE_INTEGER); return { $type: 'i53', value }; }
  function bigint(value, { signed, bits } = {}) {
    if (typeof value !== 'bigint' || typeof signed !== 'boolean' || ![8, 16, 32, 64, 128, 256].includes(bits)) fail('invalid BigInt type/width');
    const bound = 1n << BigInt(bits - (signed ? 1 : 0));
    if (value < (signed ? -bound : 0n) || value >= bound) fail('BigInt outside declared width');
    return { $type: 'bigint', signed, bits, hex: BigInt.asUintN(bits, value).toString(16).padStart(bits / 4, '0') };
  }
  const tensorRef = id => ({ $type: 'tensor', id: identifier(id) });
  const scalar = value => value === null || ['boolean', 'string', 'number', 'bigint'].includes(typeof value);
  function tagValue(value) {
    const seen = new Set();
    let nodes = 0;
    const visit = (item, depth) => {
      if (++nodes > LIMITS.stateNodes || depth > LIMITS.stateDepth) fail('tagged state work budget exceeded');
      if (item === null || typeof item === 'boolean' || typeof item === 'string') return item;
      if (typeof item === 'number') return float64(item);
      if (typeof item === 'bigint') return bigint(item, { signed: item < 0n, bits: 64 });
      if (!item || typeof item !== 'object' || seen.has(item)) fail('non-data or cyclic state');
      seen.add(item);
      let result;
      if (Array.isArray(item)) {
        result = { $type: 'array', items: arrayValues(item, LIMITS.stateNodes, 'state').map(child => visit(child, depth + 1)) };
      } else if (item instanceof Map) {
        if (Object.getPrototypeOf(item) !== Map.prototype || Reflect.ownKeys(item).length) fail('extended Map state');
        const size = Object.getOwnPropertyDescriptor(Map.prototype, 'size').get.call(item);
        if (size > LIMITS.stateNodes) fail('Map exceeds state budget');
        result = { $type: 'map', entries: Array.from(Map.prototype.entries.call(item), ([key, child]) => {
          if (!scalar(key)) fail('Map keys must be scalar');
          return [visit(key, depth + 1), visit(child, depth + 1)];
        }) };
      } else if (item instanceof Set) {
        if (Object.getPrototypeOf(item) !== Set.prototype || Reflect.ownKeys(item).length) fail('extended Set state');
        const size = Object.getOwnPropertyDescriptor(Set.prototype, 'size').get.call(item);
        if (size > LIMITS.stateNodes) fail('Set exceeds state budget');
        result = { $type: 'set', values: Array.from(Set.prototype.values.call(item), child => {
          if (!scalar(child)) fail('Set values must be scalar');
          return visit(child, depth + 1);
        }) };
      } else {
        const descriptors = properties(item, 'state');
        result = { $type: 'object', entries: Object.entries(descriptors).map(([key, descriptor]) => [identifier(key, 'state key'), visit(descriptor.value, depth + 1)]) };
      }
      seen.delete(item);
      return result;
    };
    const result = visit(value, 0);
    validateTag(result, { nodes: 0 }, 0);
    return result;
  }
  function validateTag(tag, state, depth, tensorIds) {
    if (++state.nodes > LIMITS.stateNodes || depth > LIMITS.stateDepth) fail('tagged state work budget exceeded');
    if (tag === null || typeof tag === 'boolean') return tag;
    if (typeof tag === 'string') { if (tag.length > LIMITS.payloadBytes) fail('state string too large'); return tag; }
    properties(tag, 'tag');
    if (typeof tag.$type !== 'string') fail('missing state tag');
    if (tag.$type === 'f64') {
      exact(tag, ['$type', 'hex'], [], 'f64');
      if (!/^[a-f0-9]{16}$/.test(tag.hex) || typeof tag.hex !== 'string') fail('invalid Float64 bytes');
      const bytes = Uint8Array.from(tag.hex.match(/../g), pair => parseInt(pair, 16));
      const value = new DataView(bytes.buffer).getFloat64(0, true);
      if (!Number.isFinite(value)) fail('nonfinite Float64 state');
      return value;
    }
    if (tag.$type === 'i53') { exact(tag, ['$type', 'value'], [], 'i53'); return integerCheck(tag.value, 'i53', -Number.MAX_SAFE_INTEGER); }
    if (tag.$type === 'bigint') {
      exact(tag, ['$type', 'signed', 'bits', 'hex'], [], 'BigInt');
      if (typeof tag.signed !== 'boolean' || ![8, 16, 32, 64, 128, 256].includes(tag.bits) ||
          typeof tag.hex !== 'string' || tag.hex.length !== tag.bits / 4 || !/^[a-f0-9]+$/.test(tag.hex)) fail('invalid BigInt bytes');
      const value = BigInt('0x' + tag.hex);
      return tag.signed ? BigInt.asIntN(tag.bits, value) : value;
    }
    if (tag.$type === 'tensor') {
      exact(tag, ['$type', 'id'], [], 'tensor reference'); identifier(tag.id);
      if (tensorIds && !tensorIds.has(tag.id)) fail('unknown tensor reference');
      return { $type: 'tensor', id: tag.id };
    }
    const child = value => validateTag(value, state, depth + 1, tensorIds);
    if (tag.$type === 'array') { exact(tag, ['$type', 'items'], [], 'array tag'); return array(tag.items, LIMITS.stateNodes, 'state').map(child); }
    if (tag.$type === 'object' || tag.$type === 'map') {
      exact(tag, ['$type', 'entries'], [], 'collection tag');
      array(tag.entries, LIMITS.stateNodes, 'entries');
      const result = tag.$type === 'map' ? new Map() : {}, keys = new Set();
      for (const pair of tag.entries) {
        array(pair, 2, 'entry'); if (pair.length !== 2) fail('invalid entry pair');
        const key = tag.$type === 'map' ? child(pair[0]) : identifier(pair[0], 'state key');
        if (!scalar(key) || keys.has(key)) fail('duplicate or nonscalar collection key');
        keys.add(key);
        const value = child(pair[1]);
        if (result instanceof Map) result.set(key, value); else result[key] = value;
      }
      return result;
    }
    if (tag.$type === 'set') {
      exact(tag, ['$type', 'values'], [], 'set tag');
      const result = new Set();
      for (const value of array(tag.values, LIMITS.stateNodes, 'set')) {
        const decoded = child(value);
        if (!scalar(decoded) || result.has(decoded)) fail('duplicate or nonscalar Set value');
        result.add(decoded);
      }
      return result;
    }
    fail('unknown state tag');
  }
  // Tensor refs become plain semantic tokens, not live bindings or branded
  // capabilities. Importers resolve references from verified RAW tags; a tagged
  // ordinary object may legitimately decode to an identically shaped object.
  function untagValue(tag, { tensorIds } = {}) { return validateTag(cloneData(tag), { nodes: 0 }, 0, tensorIds); }
  function validateMetadata(wire) {
    exact(wire, ['schema', 'architecture', 'snapshot', 'tensorManifest', 'tensorBlob', 'stateManifest', 'stateValues', 'resumeRules'], ['provenance']);
    if (wire.schema !== SCHEMA) fail('unsupported schema');
    const architecture = exact(wire.architecture, ['registryVersion', 'fingerprint', 'components'], [], 'architecture');
    integerCheck(architecture.registryVersion, 'registry version', 1); hashCheck(architecture.fingerprint);
    const componentIds = new Set();
    for (const item of array(architecture.components, LIMITS.components, 'components')) {
      exact(item, ['id', 'schemaVersion', 'implementationDigest', 'present'], [], 'component'); identifier(item.id);
      if (componentIds.has(item.id) || typeof item.present !== 'boolean') fail('invalid or duplicate component');
      componentIds.add(item.id); integerCheck(item.schemaVersion, 'component version', 1); hashCheck(item.implementationDigest);
    }
    const presentIds = new Set(architecture.components.filter(item => item.present).map(item => item.id));
    const snapshot = exact(wire.snapshot, ['creatureId', 'policyId', 'checkpointId', 'logicalTick', 'modelEpoch', 'capturedAt', 'resumeBoundary'], [], 'snapshot');
    for (const key of ['creatureId', 'policyId', 'checkpointId']) identifier(snapshot[key], key);
    integerCheck(snapshot.logicalTick, 'logical tick'); integerCheck(snapshot.modelEpoch, 'model epoch');
    if (snapshot.resumeBoundary !== 'fresh-browser-authority' || typeof snapshot.capturedAt !== 'string' ||
        !Number.isFinite(Date.parse(snapshot.capturedAt)) || new Date(snapshot.capturedAt).toISOString() !== snapshot.capturedAt) fail('invalid snapshot boundary or time');
    const rows = array(wire.tensorManifest, LIMITS.tensors, 'tensors'), ids = new Set(), paths = new Set(), groups = new Map();
    let end = 0, previous = '';
    for (const row of rows) {
      exact(row, tensorKeys.concat(['blobOffset', 'sha256']), [], 'tensor');
      identifier(row.id); identifier(row.componentId); identifier(row.role); identifier(row.backingGroup);
      if (ids.has(row.id) || (previous && previous >= row.id)) fail('tensor IDs must be unique and sorted');
      previous = row.id; ids.add(row.id);
      if (!presentIds.has(row.componentId)) fail('unknown or absent tensor component');
      if (!own(DTYPES, row.dtype) || row.byteOrder !== 'LE') fail('unsupported tensor dtype or byte order');
      integerCheck(row.length, 'tensor length', 0, LIMITS.tensorBytes);
      integerCheck(row.byteLength, 'tensor bytes', 0, LIMITS.tensorBytes);
      if (row.length * DTYPES[row.dtype] !== row.byteLength) fail('tensor length/byte mismatch');
      let product = 1;
      const dimensions = array(row.dimensions, LIMITS.rank, 'dimensions');
      if (!dimensions.length) fail('missing tensor dimensions');
      for (const dimension of dimensions) {
        integerCheck(dimension, 'dimension', 0, LIMITS.tensorBytes);
        if (product !== 0 && dimension !== 0 && product > Number.MAX_SAFE_INTEGER / dimension) fail('dimension product overflow');
        product *= dimension;
      }
      if (product !== row.length) fail('tensor shape mismatch');
      integerCheck(row.blobOffset, 'blob offset', 0, LIMITS.tensorBytes);
      if (row.blobOffset !== end || row.byteLength > LIMITS.tensorBytes - end) fail('tensor blob ranges must cover exactly');
      end += row.byteLength; hashCheck(row.sha256);
      integerCheck(row.backingByteLength, 'backing capacity'); integerCheck(row.backingOffset, 'backing offset');
      if (row.backingOffset % DTYPES[row.dtype] || row.backingOffset > row.backingByteLength || row.byteLength > row.backingByteLength - row.backingOffset) fail('invalid backing range/alignment');
      if (groups.has(row.backingGroup) && groups.get(row.backingGroup) !== row.backingByteLength) fail('inconsistent backing capacity');
      groups.set(row.backingGroup, row.backingByteLength);
      const aliases = array(row.paths, LIMITS.aliases, 'aliases');
      if (!aliases.length) fail('missing tensor paths');
      for (const path of aliases) {
        exact(path, ['root', 'keys'], [], 'path'); identifier(path.root, 'root');
        if (!array(path.keys, LIMITS.pathDepth, 'path').length) fail('empty tensor path');
        path.keys.forEach(key => identifier(key, 'path key'));
        const key = JSON.stringify([path.root, path.keys]);
        if (paths.has(key)) fail('duplicate tensor path'); paths.add(key);
      }
    }
    const blob = exact(wire.tensorBlob, ['encoding', 'byteLength', 'sha256', 'data'], [], 'blob');
    if (blob.encoding !== 'base64' || typeof blob.data !== 'string') fail('invalid blob encoding');
    integerCheck(blob.byteLength, 'blob size', 0, LIMITS.tensorBytes); hashCheck(blob.sha256);
    if (end !== blob.byteLength) fail('manifest/blob length mismatch');
    const stateIds = new Set(), stateBudget = { nodes: 0 };
    properties(wire.stateValues, 'state values');
    for (const row of array(wire.stateManifest, LIMITS.states, 'state manifest')) {
      exact(row, ['id', 'componentId', 'role', 'valueType', 'schemaVersion', 'required'], [], 'state descriptor');
      identifier(row.id); identifier(row.componentId); identifier(row.role);
      if (stateIds.has(row.id) || !presentIds.has(row.componentId) || typeof row.required !== 'boolean') fail('invalid state descriptor');
      stateIds.add(row.id); integerCheck(row.schemaVersion, 'state version', 1);
      if (!own(wire.stateValues, row.id)) fail('missing state value');
      const tag = wire.stateValues[row.id], kind = tag === null ? 'null' : typeof tag === 'object' ? tag.$type : typeof tag;
      if (row.valueType !== kind) fail('state tag/descriptor mismatch');
      validateTag(tag, stateBudget, 0, ids);
    }
    if (Object.keys(wire.stateValues).length !== stateIds.size) fail('extra state value');
    const ruleIds = new Set();
    for (const rule of array(wire.resumeRules, LIMITS.states, 'resume rules')) {
      exact(rule, ['id', 'action', 'reason', 'version'], [], 'resume rule'); identifier(rule.id); identifier(rule.action);
      integerCheck(rule.version, 'resume version', 1);
      if (ruleIds.has(rule.id) || typeof rule.reason !== 'string' || !rule.reason.length || rule.reason.length > 2048) fail('invalid resume rule');
      ruleIds.add(rule.id);
    }
    return end;
  }
  // Rows sorted by backing offset expose a monotonically growing union. Keep
  // source spans for that union, never allocate unused backing capacity. Each
  // compared byte belongs to a serialized view, so comparison work <= raw bytes.
  function validateOverlaps(rows, bytesFor) {
    const groups = new Map();
    for (const row of rows) { if (!groups.has(row.backingGroup)) groups.set(row.backingGroup, []); groups.get(row.backingGroup).push(row); }
    for (const group of groups.values()) {
      group.sort((a, b) => a.backingOffset - b.backingOffset || a.id.localeCompare(b.id));
      const segments = [];
      let coveredEnd = 0;
      for (const row of group) {
        if (!row.byteLength) continue;
        const start = row.backingOffset, end = start + row.byteLength, bytes = bytesFor(row);
        let position = start;
        if (start < coveredEnd) {
          let lo = 0, hi = segments.length;
          while (lo < hi) { const mid = (lo + hi) >>> 1; if (segments[mid].end <= start) lo = mid + 1; else hi = mid; }
          for (let index = lo; index < segments.length && position < Math.min(end, coveredEnd); index++) {
            const segment = segments[index], stop = Math.min(end, segment.end);
            if (segment.start > position) fail('invalid overlap coverage');
            for (; position < stop; position++) if (bytes[position - start] !== segment.bytes[position - segment.origin]) fail('inconsistent overlapping tensor bytes');
          }
        }
        if (end > coveredEnd) { segments.push({ start: Math.max(start, coveredEnd), end, origin: start, bytes }); coveredEnd = end; }
      }
    }
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function base64Encode(bytes) {
    const chunks = [];
    for (let start = 0; start < bytes.length; start += 12288) {
      let out = '';
      for (let i = start; i < Math.min(start + 12288, bytes.length); i += 3) {
        const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2];
        out += alphabet[a >>> 2] + alphabet[((a & 3) << 4) | ((b || 0) >>> 4)] +
          (i + 1 < bytes.length ? alphabet[((b & 15) << 2) | ((c || 0) >>> 6)] : '=') + (i + 2 < bytes.length ? alphabet[c & 63] : '=');
      }
      chunks.push(out);
    }
    return chunks.join('');
  }
  function base64Decode(data, length) {
    if (data.length !== 4 * Math.ceil(length / 3)) fail('encoded blob size mismatch');
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (let i = 0; i < data.length; i += 4) {
      const values = [];
      for (let j = 0; j < 4; j++) {
        const char = data[i + j], value = alphabet.indexOf(char);
        if (value < 0 && !(char === '=' && i + 4 === data.length && j >= 2)) fail('invalid base64');
        values.push(value < 0 ? 0 : value);
      }
      const word = (values[0] << 18) | (values[1] << 12) | (values[2] << 6) | values[3];
      if (offset < length) bytes[offset++] = word >>> 16;
      if (offset < length) bytes[offset++] = word >>> 8;
      if (offset < length) bytes[offset++] = word;
    }
    if (base64Encode(bytes) !== data) fail('noncanonical base64');
    return bytes;
  }
  function isolatedBuffer(value) {
    if (!(value instanceof ArrayBuffer)) fail('tensor bytes must be an ArrayBuffer');
    const resizable = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable');
    if (resizable && resizable.get.call(value)) fail('resizable tensor buffer');
    try { return new Uint8Array(value); } catch (_) { fail('detached tensor buffer'); }
  }
  function copyCaptured(captured) {
    const fields = exactDescriptors(captured, ['architecture', 'snapshot', 'tensors', 'stateManifest', 'stateValues', 'resumeRules'], ['provenance'], 'capture');
    const metadata = {}, state = budget();
    for (const key of ['architecture', 'snapshot', 'stateManifest', 'stateValues', 'resumeRules', 'provenance']) if (own(fields, key)) metadata[key] = cloneData(fields[key].value, state);
    const tensors = [], rows = arrayValues(fields.tensors.value, LIMITS.tensors, 'capture tensors'), prepared = [];
    let total = 0;
    for (const row of rows) {
      const descriptors = exactDescriptors(row, tensorKeys.concat(['bytes']), [], 'captured tensor');
      const bytes = isolatedBuffer(descriptors.bytes.value);
      if (bytes.byteLength > LIMITS.tensorBytes - total) fail('capture exceeds tensor byte budget');
      total += bytes.byteLength;
      prepared.push({ descriptors, bytes });
    }
    for (const row of prepared) {
      const descriptor = {};
      for (const key of tensorKeys) descriptor[key] = cloneData(row.descriptors[key].value, state);
      const bytes = new Uint8Array(row.bytes);
      tensors.push({ descriptor, bytes });
    }
    tensors.sort((a, b) => a.descriptor.id < b.descriptor.id ? -1 : a.descriptor.id > b.descriptor.id ? 1 : 0);
    return { metadata, tensors, total };
  }
  async function seal(captured, options = {}) {
    abort(options.signal);
    // Entire input is copied in this turn, before any hash can yield.
    const { metadata, tensors, total } = copyCaptured(captured);
    const wire = { schema: SCHEMA, architecture: metadata.architecture, snapshot: metadata.snapshot,
      tensorManifest: [], tensorBlob: { encoding: 'base64', byteLength: total, sha256: '0'.repeat(64), data: '' },
      stateManifest: metadata.stateManifest, stateValues: metadata.stateValues, resumeRules: metadata.resumeRules };
    if (own(metadata, 'provenance')) wire.provenance = metadata.provenance;
    let offset = 0;
    for (const tensor of tensors) {
      if (tensor.bytes.byteLength !== tensor.descriptor.byteLength) fail('capture byte length mismatch');
      wire.tensorManifest.push({ ...tensor.descriptor, blobOffset: offset, sha256: '0'.repeat(64) });
      offset += tensor.bytes.byteLength;
    }
    validateMetadata(wire);
    const ownedBytes = new Map(tensors.map(tensor => [tensor.descriptor.id, tensor.bytes]));
    validateOverlaps(wire.tensorManifest, row => ownedBytes.get(row.id));
    const blob = new Uint8Array(total);
    for (const row of wire.tensorManifest) blob.set(ownedBytes.get(row.id), row.blobOffset);
    for (const row of wire.tensorManifest) row.sha256 = await digest(ownedBytes.get(row.id), options);
    wire.tensorBlob.sha256 = await digest(blob, options);
    wire.tensorBlob.data = base64Encode(blob);
    normalizedJSON(wire); abort(options.signal);
    return wire;
  }
  async function encode(captured, options = {}) { return normalizedJSON(await seal(captured, options)).json; }
  function copyVerified(snapshot) {
    const copy = {}, state = budget();
    for (const key of ['schema', 'architecture', 'snapshot', 'tensorManifest', 'stateManifest', 'stateValues', 'resumeRules', 'provenance', 'evidence']) {
      if (own(snapshot, key)) copy[key] = cloneData(snapshot[key], state);
    }
    copy.tensors = snapshot.tensors.map((row, index) => ({ ...copy.tensorManifest[index], bytes: new Uint8Array(row.bytes).slice().buffer }));
    return copy;
  }
  function verifiedCopy(handle) {
    const snapshot = verifiedSnapshots.get(handle);
    if (!snapshot) fail('not a decoder-issued verified handle');
    return copyVerified(snapshot);
  }
  async function decode(input, options = {}) {
    abort(options.signal);
    let parsed;
    if (typeof input === 'string') { prescan(input); parsed = JSON.parse(input); }
    else parsed = input;
    const wire = cloneData(parsed);
    const total = validateMetadata(wire), normalized = normalizedJSON(wire);
    if (typeof input === 'string' && normalized.json !== input) fail('JSON is not compact normalized input (duplicate members or alternate spelling)');
    const blob = base64Decode(wire.tensorBlob.data, total);
    validateOverlaps(wire.tensorManifest, row => blob.subarray(row.blobOffset, row.blobOffset + row.byteLength));
    if (await digest(blob, options) !== wire.tensorBlob.sha256) fail('blob SHA-256 mismatch');
    for (const row of wire.tensorManifest) if (await digest(blob.subarray(row.blobOffset, row.blobOffset + row.byteLength), options) !== row.sha256) fail(`tensor SHA-256 mismatch: ${row.id}`);
    const payloadDigest = await digest(encoder.encode(normalized.json), options);
    const tensors = wire.tensorManifest.map(row => ({ ...row, bytes: blob.slice(row.blobOffset, row.blobOffset + row.byteLength).buffer }));
    const privateSnapshot = { ...wire, tensors, evidence: { tensorCount: tensors.length, totalTensorBytes: total, payloadBytes: normalized.bytes, digest: payloadDigest } };
    delete privateSnapshot.tensorBlob;
    const handle = { ...copyVerified(privateSnapshot), tensorBlob: wire.tensorBlob };
    verifiedSnapshots.set(handle, privateSnapshot);
    return handle;
  }
  return Object.freeze({ SCHEMA, SCOPE, LIMITS, DTYPES, seal, encode, decode, canonicalDescriptorJSON, fingerprintDescriptors,
    float64, integer, bigint, tensorRef, tagValue, untagValue, verifiedCopy });
});
