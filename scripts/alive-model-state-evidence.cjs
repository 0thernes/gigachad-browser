'use strict';

// Verification-only, disk-format-agnostic evidence. No production capture or
// decoder is imported. The observer below is self-contained for .toString().
//
// Descriptor: {id,paths:[{root,keys:[...]}],dtype,dimensions,role,componentId,
//              kind?:'tensor'|'scalar'}.
// Tensor dtypes are actual JS typed-array names. Scalar dtypes are Float64,
// SafeInteger, BigInt64 and BigUint64; scalar dimensions must be [].
// Roots/descriptors must be audited ordinary object graphs, not hostile Proxies.
// JS cannot inspect an arbitrary Proxy without potentially running its traps.
function observeModelState(roots, descriptors, options) {
  'use strict';
  if (options === undefined) options = {};
  const fail = (code, message) => { const error = new Error(message); error.code = code; throw error; };
  const limits = { maxEntries: 4096, maxPaths: 8192, maxRawBytes: 16 * 1024 * 1024,
    maxDepth: 16, maxDimensions: 8, maxText: 256, maxTotalText: 1024 * 1024 };
  const own = (object, key, required = true) => {
    if ((typeof object !== 'object' && typeof object !== 'function') || object === null) fail('OBJECT', 'Expected an object with own data properties');
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    if (!descriptor) { if (!required) return undefined; fail('MISSING_PROPERTY', 'Missing own property: ' + String(key)); }
    if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) fail('ACCESSOR', 'Accessor properties cannot be observed: ' + String(key));
    return descriptor.value;
  };
  for (const name of Object.keys(limits)) {
    const value = own(options, name, false);
    if (value !== undefined) {
      if (!Number.isSafeInteger(value) || value < 1 || value > limits[name]) fail('LIMIT', 'A limit may only reduce the default bound: ' + name);
      limits[name] = value;
    }
  }
  const sizes = { Int8Array: 1, Uint8Array: 1, Uint8ClampedArray: 1, Int16Array: 2, Uint16Array: 2,
    Int32Array: 4, Uint32Array: 4, Float32Array: 4, Float64Array: 8, BigInt64Array: 8, BigUint64Array: 8 };
  const scalarTypes = new Set(['Float64', 'SafeInteger', 'BigInt64', 'BigUint64']);
  const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
  const ordinal = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  let textUnits = 0, pathsCount = 0, rawBytes = 0;
  function text(value, label) {
    if (typeof value !== 'string' || !value.length || value.length > limits.maxText) fail('TEXT', 'Invalid bounded text: ' + label);
    textUnits += value.length;
    if (textUnits > limits.maxTotalText) fail('TEXT_LIMIT', 'Descriptor text exceeds its bound');
    return value;
  }
  function array(value, label, limit) {
    if (!Array.isArray(value)) fail('ARRAY', 'Expected array: ' + label);
    const length = own(value, 'length');
    if (length > limit) fail('ARRAY_LIMIT', label + ' exceeds its bound');
    const values = [];
    for (let i = 0; i < length; i++) values.push(own(value, String(i)));
    return values;
  }
  const rawDescriptors = array(descriptors, 'descriptors', limits.maxEntries);
  if (!rawDescriptors.length) fail('EMPTY_REGISTRY', 'At least one explicit descriptor is required');
  const ids = new Set(), usedPaths = new Set();
  const normalized = rawDescriptors.map(descriptor => {
    for (const key of Reflect.ownKeys(descriptor)) {
      if (typeof key !== 'string' || !['id', 'paths', 'dtype', 'dimensions', 'role', 'componentId', 'kind'].includes(key)) fail('DESCRIPTOR_KEY', 'Unknown descriptor property');
      own(descriptor, key); // Reject accessors even on optional fields.
    }
    const id = text(own(descriptor, 'id'), 'id');
    if (ids.has(id)) fail('DUPLICATE_ID', 'Duplicate descriptor ID: ' + id);
    ids.add(id);
    const dtype = text(own(descriptor, 'dtype'), 'dtype');
    const suppliedKind = own(descriptor, 'kind', false);
    const kind = suppliedKind === undefined ? (scalarTypes.has(dtype) ? 'scalar' : 'tensor') : suppliedKind;
    if (kind !== 'tensor' && kind !== 'scalar' || kind === 'tensor' && !Object.prototype.hasOwnProperty.call(sizes, dtype) || kind === 'scalar' && !scalarTypes.has(dtype)) fail('DTYPE', 'Unsupported kind/dtype: ' + id);
    const dimensions = array(own(descriptor, 'dimensions'), 'dimensions', limits.maxDimensions);
    let length = 1;
    for (const dimension of dimensions) {
      if (!Number.isSafeInteger(dimension) || dimension < 0 || !Number.isSafeInteger(length * dimension)) fail('DIMENSIONS', 'Invalid dimensions: ' + id);
      length *= dimension;
    }
    if (kind === 'scalar' && dimensions.length) fail('DIMENSIONS', 'Scalar dimensions must be empty: ' + id);
    if (kind === 'tensor' && !dimensions.length) fail('DIMENSIONS', 'A tensor must declare at least one dimension: ' + id);
    const paths = array(own(descriptor, 'paths'), 'paths', limits.maxPaths).map(item => {
      for (const key of Reflect.ownKeys(item)) if (key !== 'root' && key !== 'keys') fail('PATH', 'Unknown path descriptor property');
      const root = text(own(item, 'root'), 'root');
      if (forbidden.has(root)) fail('PATH', 'Unsafe root key');
      const keys = array(own(item, 'keys'), 'path keys', limits.maxDepth).map(key => {
        text(key, 'path key'); if (forbidden.has(key)) fail('PATH', 'Unsafe path key'); return key;
      });
      if (!keys.length) fail('PATH', 'Paths must name a property beneath a supplied root');
      const pathKey = JSON.stringify([root, keys]);
      if (usedPaths.has(pathKey)) fail('DUPLICATE_PATH', 'A path occurs more than once');
      usedPaths.add(pathKey);
      if (++pathsCount > limits.maxPaths) fail('PATH_LIMIT', 'Total paths exceed their bound');
      return { root, keys };
    });
    if (!paths.length) fail('PATH', 'At least one path is required: ' + id);
    paths.sort((a, b) => ordinal(JSON.stringify(a), JSON.stringify(b)));
    return { id, kind, paths, dtype, dimensions, role: text(own(descriptor, 'role'), 'role'),
      componentId: text(own(descriptor, 'componentId'), 'componentId'), length };
  }).sort((a, b) => ordinal(a.id, b.id));

  const typedPrototype = Object.getPrototypeOf(Uint8Array.prototype);
  const getters = Object.fromEntries(['buffer', 'byteLength', 'byteOffset', 'length'].map(name => [name, Object.getOwnPropertyDescriptor(typedPrototype, name).get]));
  const tag = Object.getOwnPropertyDescriptor(typedPrototype, Symbol.toStringTag).get;
  const arrayBufferLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get;
  const resizableBuffer = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get;
  const buffers = new Map(), viewOwners = new Map(), entries = [], backings = [];
  const resolve = path => { let value = own(roots, path.root); for (const key of path.keys) value = own(value, key); return value; };
  const encode = bytes => {
    if (typeof btoa !== 'function') fail('BASE64_UNAVAILABLE', 'The host must supply standard btoa');
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  };
  for (const descriptor of normalized) {
    const value = resolve(descriptor.paths[0]);
    for (const alias of descriptor.paths.slice(1)) {
      const actual = resolve(alias);
      if (descriptor.kind === 'tensor' ? actual !== value : !Object.is(actual, value)) fail('ALIAS', 'Declared aliases differ: ' + descriptor.id);
    }
    let bytes, length = descriptor.length, byteOffset = null, backingId = null;
    if (descriptor.kind === 'tensor') {
      if (!ArrayBuffer.isView(value)) fail('NOT_TYPED_ARRAY', 'Not a real typed array: ' + descriptor.id);
      let actualType, buffer, byteLength, backingBytes;
      try {
        actualType = tag.call(value); buffer = getters.buffer.call(value); byteLength = getters.byteLength.call(value);
        byteOffset = getters.byteOffset.call(value); length = getters.length.call(value);
      } catch (_) { fail('NOT_TYPED_ARRAY', 'DataView or unsupported view: ' + descriptor.id); }
      if (actualType !== descriptor.dtype || length !== descriptor.length || byteLength !== length * sizes[actualType]) fail('TYPE_OR_SHAPE', 'Actual view type or shape differs: ' + descriptor.id);
      try { backingBytes = arrayBufferLength.call(buffer); }
      catch (_) { fail('SHARED_BUFFER', 'Shared backing storage cannot be captured coherently'); }
      if (resizableBuffer && resizableBuffer.call(buffer)) fail('RESIZABLE_BUFFER', 'Resizable backing storage is unsupported');
      if (viewOwners.has(value)) fail('DUPLICATE_VIEW', 'The same typed object needs one descriptor with all aliases');
      viewOwners.set(value, descriptor.id);
      rawBytes += byteLength;
      if (rawBytes > limits.maxRawBytes) fail('BYTE_LIMIT', 'Total observed bytes exceed their bound');
      try { bytes = new Uint8Array(buffer, byteOffset, byteLength); }
      catch (_) { fail('DETACHED_BUFFER', 'Detached or inaccessible backing storage'); }
      if (!buffers.has(buffer)) {
        const id = 'backing-' + buffers.size; buffers.set(buffer, id); backings.push({ id, byteLength: backingBytes });
      }
      backingId = buffers.get(buffer);
    } else {
      const buffer = new ArrayBuffer(8), data = new DataView(buffer);
      if (descriptor.dtype === 'Float64' || descriptor.dtype === 'SafeInteger') {
        if (typeof value !== 'number' || !Number.isFinite(value) || descriptor.dtype === 'SafeInteger' && !Number.isSafeInteger(value)) fail('SCALAR', 'Invalid numeric scalar: ' + descriptor.id);
        data.setFloat64(0, value, true);
      } else {
        if (typeof value !== 'bigint') fail('SCALAR', 'BigInt scalar required: ' + descriptor.id);
        if (descriptor.dtype === 'BigInt64') {
          if (value < -(1n << 63n) || value >= (1n << 63n)) fail('SCALAR', 'BigInt64 scalar out of range');
          data.setBigInt64(0, value, true);
        } else {
          if (value < 0n || value >= (1n << 64n)) fail('SCALAR', 'BigUint64 scalar out of range');
          data.setBigUint64(0, value, true);
        }
      }
      bytes = new Uint8Array(buffer); rawBytes += 8;
      if (rawBytes > limits.maxRawBytes) fail('BYTE_LIMIT', 'Total observed bytes exceed their bound');
      length = 1;
    }
    entries.push({ ...descriptor, length, byteLength: bytes.length, byteOffset, backingId,
      encoding: descriptor.kind === 'scalar' ? 'scalar-le-base64' : 'native-byte-base64', dataBase64: encode(bytes) });
  }
  return { schema: 'gigachad.model-state-evidence.v1',
    byteOrder: new Uint8Array(new Uint16Array([1]).buffer)[0] === 1 ? 'LE' : 'BE',
    entries, backings, totals: { entries: entries.length, paths: pathsCount, rawBytes, backings: backings.length }, limits,
    coverage: { registryComplete: 'not-established', scope: 'Exact values and declared alias/backing relationships for supplied audited descriptors only; no registry completeness, learning-quality or disk-durability claim',
      assumptions: ['Trusted ordinary object graph, not hostile Proxies', 'Single synchronous observation; SharedArrayBuffer rejected', 'Scalar aliases assert equal values, not mutable primitive identity'] } };
}

const { Buffer } = require('node:buffer');
const TYPE_BYTES = Object.freeze({ Int8Array: 1, Uint8Array: 1, Uint8ClampedArray: 1, Int16Array: 2, Uint16Array: 2,
  Int32Array: 4, Uint32Array: 4, Float32Array: 4, Float64Array: 8, BigInt64Array: 8, BigUint64Array: 8 });
const SCALARS = new Set(['Float64', 'SafeInteger', 'BigInt64', 'BigUint64']);

function validateEvidence(record) {
  const bad = message => { throw new Error(message); };
  // Evidence is plain JSON data. Reject accessors before reading their values;
  // this guard does not claim to neutralize arbitrary Proxy traps.
  let nodes = 0, chars = 0, properties = 0;
  const seen = new Set();
  function data(value, depth = 0) {
    if (typeof value === 'string') { chars += value.length; if (chars > 24 * 1024 * 1024) bad('Evidence text bound exceeded'); return value; }
    if (value === null || ['number', 'boolean', 'undefined'].includes(typeof value)) return value;
    if (typeof value !== 'object' || depth > 24 || ++nodes > 100000 || seen.has(value)) bad('Invalid, cyclic or oversized evidence graph');
    seen.add(value);
    const isArray = Array.isArray(value);
    let copy = Object.create(null);
    if (isArray) {
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
      const length = lengthDescriptor?.value;
      if (!Number.isSafeInteger(length) || length < 0 || length > 100000) bad('Evidence array length exceeds its bound');
      copy = new Array(length);
    }
    const keys = Reflect.ownKeys(value);
    properties += keys.length;
    // 400k covers the observer's maximum combined entry/path/dimension schema;
    // a single wide record is limited separately before any property copying.
    if (keys.length > 100000 || properties > 400000) bad('Evidence own-property bound exceeded');
    for (const key of keys) {
      if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key)) bad('Unsafe evidence key');
      chars += key.length;
      if (key.length > 256 || chars > 24 * 1024 * 1024) bad('Evidence key text bound exceeded');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) bad('Accessor evidence is forbidden');
      if (isArray && key === 'length') continue;
      if (isArray && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= copy.length)) bad('Non-index array property in evidence');
      Object.defineProperty(copy, key, { value: data(descriptor.value, depth + 1), enumerable: true, configurable: true, writable: true });
    }
    seen.delete(value);
    return copy;
  }
  record = data(record);
  const fields = (object, allowed) => {
    if (!object || typeof object !== 'object' || Array.isArray(object)) bad('Expected plain evidence record');
    for (const key of Object.keys(object)) if (!allowed.includes(key)) bad('Unknown evidence field: ' + key);
  };
  fields(record, ['schema', 'byteOrder', 'entries', 'backings', 'totals', 'limits', 'coverage']);
  if (record?.schema !== 'gigachad.model-state-evidence.v1' || !['LE', 'BE'].includes(record.byteOrder) ||
      !Array.isArray(record.entries) || !record.entries.length || record.entries.length > 4096 ||
      !Array.isArray(record.backings) || record.backings.length > 4096) bad('Unsupported evidence schema or entry bound');
  const backings = new Map(), entries = new Map(), paths = new Set(); let rawBytes = 0, pathCount = 0;
  const validText = value => typeof value === 'string' && value.length > 0 && value.length <= 256;
  fields(record.totals, ['entries', 'paths', 'rawBytes', 'backings']);
  if (record.limits !== undefined) fields(record.limits, ['maxEntries', 'maxPaths', 'maxRawBytes', 'maxDepth', 'maxDimensions', 'maxText', 'maxTotalText']);
  if (record.coverage !== undefined) fields(record.coverage, ['registryComplete', 'scope', 'assumptions']);
  for (const backing of record.backings) {
    fields(backing, ['id', 'byteLength']);
    if (!validText(backing.id) || backings.has(backing.id) || !Number.isSafeInteger(backing.byteLength) || backing.byteLength < 0) bad('Invalid backing descriptor');
    backings.set(backing.id, { ...backing, views: [] });
  }
  for (const entry of record.entries) {
    fields(entry, ['id', 'kind', 'paths', 'dtype', 'dimensions', 'role', 'componentId', 'length', 'byteLength', 'byteOffset', 'backingId', 'encoding', 'dataBase64']);
    if (!validText(entry.id) || entries.has(entry.id) || !validText(entry.role) || !validText(entry.componentId) ||
        !Array.isArray(entry.paths) || !entry.paths.length || !Array.isArray(entry.dimensions) || entry.dimensions.length > 8) bad('Invalid or duplicate entry descriptor');
    const tensor = entry.kind === 'tensor', scalar = entry.kind === 'scalar';
    if (!tensor && !scalar || tensor && !Object.hasOwn(TYPE_BYTES, entry.dtype) || scalar && !SCALARS.has(entry.dtype)) bad('Unsupported entry dtype');
    let length = 1;
    for (const dimension of entry.dimensions) {
      if (!Number.isSafeInteger(dimension) || dimension < 0 || !Number.isSafeInteger(length * dimension)) bad('Invalid dimensions');
      length *= dimension;
    }
    if (tensor && !entry.dimensions.length || scalar && entry.dimensions.length || entry.length !== length ||
        entry.byteLength !== (tensor ? length * TYPE_BYTES[entry.dtype] : 8) || !Number.isSafeInteger(entry.byteLength)) bad('Inconsistent entry type/shape/byte count');
    rawBytes += entry.byteLength;
    if (rawBytes > 16 * 1024 * 1024) bad('Evidence byte bound exceeded');
    const canonicalPaths = [];
    for (const item of entry.paths) {
      fields(item, ['root', 'keys']);
      if (++pathCount > 8192 || !validText(item.root) || ['__proto__', 'prototype', 'constructor'].includes(item.root) ||
          !Array.isArray(item.keys) || !item.keys.length || item.keys.length > 16 ||
          item.keys.some(key => !validText(key) || ['__proto__', 'prototype', 'constructor'].includes(key))) bad('Invalid entry path');
      const key = JSON.stringify([item.root, item.keys]);
      if (paths.has(key)) bad('Duplicate declared path');
      paths.add(key); canonicalPaths.push(key);
    }
    canonicalPaths.sort();
    if (typeof entry.dataBase64 !== 'string' || entry.dataBase64.length !== 4 * Math.ceil(entry.byteLength / 3)) bad('Invalid base64 encoded length');
    const bytes = Buffer.from(entry.dataBase64, 'base64');
    if (bytes.length !== entry.byteLength || bytes.toString('base64') !== entry.dataBase64) bad('Noncanonical or truncated base64');
    if (scalar && (entry.dtype === 'Float64' || entry.dtype === 'SafeInteger')) {
      const value = bytes.readDoubleLE(0);
      if (!Number.isFinite(value) || entry.dtype === 'SafeInteger' && !Number.isSafeInteger(value)) bad('Invalid numeric scalar bytes');
    }
    const normalized = { descriptor: JSON.stringify({ id: entry.id, kind: entry.kind, paths: canonicalPaths,
      dtype: entry.dtype, dimensions: entry.dimensions, role: entry.role, componentId: entry.componentId }), entry, bytes };
    entries.set(entry.id, normalized);
    if (tensor) {
      const backing = backings.get(entry.backingId);
      if (!backing || entry.encoding !== 'native-byte-base64' || !Number.isSafeInteger(entry.byteOffset) || entry.byteOffset < 0 ||
          entry.byteOffset % TYPE_BYTES[entry.dtype] || entry.byteOffset + entry.byteLength > backing.byteLength) bad('Invalid typed-view backing range');
      backing.views.push(normalized);
    } else if (entry.encoding !== 'scalar-le-base64' || entry.byteOffset !== null || entry.backingId !== null) bad('Invalid scalar representation');
  }
  if (record.totals?.entries !== entries.size || record.totals?.paths !== pathCount || record.totals?.rawBytes !== rawBytes || record.totals?.backings !== backings.size) bad('Evidence totals disagree with contents');
  let rangeChecks = 0, overlapBytes = 0, unionBytes = 0;
  const topology = new Map();
  for (const backing of backings.values()) {
    if (!backing.views.length) bad('Unused backing descriptor');
    const views = backing.views.slice().sort((a, b) => a.entry.id < b.entry.id ? -1 : a.entry.id > b.entry.id ? 1 : 0);
    // The smallest semantic ID uniquely names this partition. Membership is
    // checked through every entry, without repeating the full ID list N times.
    const group = views[0].entry.id;
    for (const view of views) topology.set(view.entry.id, JSON.stringify({ group, backingBytes: backing.byteLength, byteOffset: view.entry.byteOffset, byteLength: view.entry.byteLength }));
    // Sorted connected ranges avoid all-pairs comparisons. Each declared byte
    // is compared or copied once; union allocation never exceeds rawBytes.
    const ranges = views.filter(view => view.entry.byteLength > 0).sort((a, b) => a.entry.byteOffset - b.entry.byteOffset);
    for (let i = 0; i < ranges.length;) {
      const start = ranges[i].entry.byteOffset;
      let end = start + ranges[i].entry.byteLength, next = i + 1;
      while (next < ranges.length && ranges[next].entry.byteOffset <= end) {
        end = Math.max(end, ranges[next].entry.byteOffset + ranges[next].entry.byteLength); next++;
      }
      unionBytes += end - start;
      if (unionBytes > rawBytes) bad('Union byte bound exceeded');
      const union = Buffer.alloc(end - start);
      let covered = 0;
      for (; i < next; i++) {
        const view = ranges[i], offset = view.entry.byteOffset - start;
        const overlap = Math.min(view.bytes.length, Math.max(0, covered - offset));
        rangeChecks++; overlapBytes += overlap;
        if (overlapBytes > rawBytes) bad('Overlap work bound exceeded');
        if (!view.bytes.subarray(0, overlap).equals(union.subarray(offset, offset + overlap))) bad('Inconsistent bytes in overlapping declared views');
        if (overlap < view.bytes.length) view.bytes.copy(union, offset + overlap, overlap);
        covered = Math.max(covered, offset + view.bytes.length);
      }
    }
  }
  return { entries, topology, rawBytes, pathCount, overlapBytes, unionBytes, rangeChecks, byteOrder: record.byteOrder };
}

function compareModelState(expected, actual) {
  const differences = [];
  let left, right;
  for (const [label, value] of [['expected', expected], ['actual', actual]]) {
    try { const parsed = validateEvidence(value); if (label === 'expected') left = parsed; else right = parsed; }
    catch (error) { differences.push({ kind: 'invalid-evidence', side: label, reason: String(error.message).slice(0, 400) }); }
  }
  if (!left || !right) return { ok: false, differences, entriesCompared: 0, bytesCompared: 0, registryCompleteness: 'not-established' };
  if (left.byteOrder !== right.byteOrder) differences.push({ kind: 'byte-order' });
  let entriesCompared = 0, bytesCompared = 0;
  for (const [id, entry] of left.entries) {
    const other = right.entries.get(id);
    if (!other) { differences.push({ kind: 'missing-id', id }); continue; }
    entriesCompared++;
    if (entry.descriptor !== other.descriptor) differences.push({ kind: 'descriptor-or-path-set', id });
    if (left.topology.get(id) !== right.topology.get(id)) differences.push({ kind: 'backing-topology', id });
    bytesCompared += Math.min(entry.bytes.length, other.bytes.length);
    if (!entry.bytes.equals(other.bytes)) {
      let offset = 0;
      while (offset < Math.min(entry.bytes.length, other.bytes.length) && entry.bytes[offset] === other.bytes[offset]) offset++;
      differences.push({ kind: 'value-bits', id, firstDifferentByte: offset });
    }
  }
  for (const id of right.entries.keys()) if (!left.entries.has(id)) differences.push({ kind: 'extra-id', id });
  return { ok: differences.length === 0, differences: differences.slice(0, 256), differenceCount: differences.length,
    entriesCompared, bytesCompared, expectedEntries: left.entries.size, actualEntries: right.entries.size,
    registryCompleteness: 'not-established', scope: 'Exact supplied registry/value/declared-alias/backing comparison only; no completeness, semantic validity, training or durability inference' };
}

module.exports = { observeModelState, validateEvidence, compareModelState };
