'use strict';

// Independent verification implementation of the public v1 wire format.
// No production codec, registry, capture, importer or decoder is imported.
// A supplied catalog is an external oracle, not evidence of model completeness.
const { createHash } = require('node:crypto');
const { Buffer } = require('node:buffer');

const LIMITS = Object.freeze({ payloadBytes: 32 * 1024 * 1024, tensorBytes: 24 * 1024 * 1024,
  tensors: 4096, states: 16384, components: 64, aliases: 32, pathDepth: 16,
  identifierLength: 128, rank: 8, stateDepth: 32, stateNodes: 100000, jsonDepth: 128, jsonNodes: 250000 });
const DTYPES = Object.freeze({ Int8Array: 1, Uint8Array: 1, Uint8ClampedArray: 1,
  Int16Array: 2, Uint16Array: 2, Int32Array: 4, Uint32Array: 4,
  Float32Array: 4, Float64Array: 8, BigInt64Array: 8, BigUint64Array: 8 });
const TENSOR_FIELDS = ['id', 'componentId', 'role', 'paths', 'dtype', 'dimensions', 'length', 'byteLength',
  'byteOrder', 'backingGroup', 'backingOffset', 'backingByteLength'];
const STATE_FIELDS = ['id', 'componentId', 'role', 'valueType', 'schemaVersion', 'required'];
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const ordinal = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const fail = (code, message) => { const error = new Error(message); error.code = code; throw error; };
const check = (condition, code, message) => { if (!condition) fail(code, message); };

function exact(value, names, label, optional = []) {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), 'FIELDS', label + ' must be a record');
  const keys = Object.keys(value);
  check(names.every(key => Object.hasOwn(value, key)) && keys.every(key => names.includes(key) || optional.includes(key)),
    'FIELDS', 'Unexpected/missing fields in ' + label);
}
function list(value, maximum, label) {
  check(Array.isArray(value) && value.length <= maximum, 'ARRAY', 'Invalid bounded ' + label);
  return value;
}
function integer(value, minimum, maximum, label) {
  check(Number.isSafeInteger(value) && !Object.is(value, -0) && value >= minimum && value <= maximum, 'INTEGER', 'Invalid ' + label);
  return value;
}
function identifier(value) {
  check(typeof value === 'string' && value.length > 0 && value.length <= LIMITS.identifierLength &&
    !FORBIDDEN.has(value) && !/[\u0000-\u001f\u007f]/.test(value), 'IDENTIFIER', 'Invalid identifier');
  return value;
}
function digestString(value) { check(typeof value === 'string' && /^[a-f0-9]{64}$/.test(value), 'DIGEST', 'Invalid SHA256 syntax'); }

// Charge all keys and values, including primitive properties. Accessors and
// inherited fields are never used. Arbitrary hostile Proxy traps are excluded.
function cleanData(input) {
  let nodes = 0, chars = 0;
  const active = new Set();
  const visit = (value, depth) => {
    check(++nodes <= LIMITS.jsonNodes && depth <= LIMITS.jsonDepth, 'JSON_BUDGET', 'JSON graph budget exceeded');
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      chars += value.length; check(chars <= LIMITS.payloadBytes, 'JSON_BUDGET', 'JSON text budget exceeded'); return value;
    }
    if (typeof value === 'number') {
      check(Number.isFinite(value) && !Object.is(value, -0), 'JSON_NUMBER', 'Noncanonical JSON number'); return value;
    }
    check(value !== null && typeof value === 'object' && !active.has(value), 'JSON_DATA', 'Non-data/cyclic JSON value');
    check(depth < LIMITS.jsonDepth, 'JSON_BUDGET', 'Container depth exceeds JSON wire limit');
    active.add(value);
    const array = Array.isArray(value), keys = Reflect.ownKeys(value);
    check(keys.length <= LIMITS.jsonNodes, 'JSON_BUDGET', 'Too many own properties');
    let copy;
    if (array) {
      const length = Object.getOwnPropertyDescriptor(value, 'length')?.value;
      integer(length, 0, LIMITS.jsonNodes, 'array length');
      check(keys.length === length + 1, 'JSON_DATA', 'Sparse/extended data array'); copy = new Array(length);
    } else copy = Object.create(null);
    for (const key of keys) {
      check(typeof key === 'string' && !FORBIDDEN.has(key), 'JSON_DATA', 'Unsafe data key');
      if (array && key === 'length') continue;
      // Object keys are serialized JSON nodes/text. Array indices are not;
      // their elements are charged once by visit(), including primitive values.
      if (!array) {
        check(++nodes <= LIMITS.jsonNodes, 'JSON_BUDGET', 'Property budget exceeded');
        chars += key.length; check(chars <= LIMITS.payloadBytes, 'JSON_BUDGET', 'Key text budget exceeded');
      }
      if (array) check(/^(0|[1-9][0-9]*)$/.test(key) && Number(key) < copy.length, 'JSON_DATA', 'Non-index array field');
      const property = Object.getOwnPropertyDescriptor(value, key);
      check(property && Object.hasOwn(property, 'value') && property.enumerable, 'JSON_DATA', 'Accessor/hidden data property');
      Object.defineProperty(copy, key, { value: visit(property.value, depth + 1), enumerable: true, writable: true, configurable: true });
    }
    active.delete(value); return copy;
  };
  return visit(input, 0);
}

function parseWireJSON(json) {
  check(typeof json === 'string' && json.length > 0 && json.length <= LIMITS.payloadBytes, 'PAYLOAD_SIZE', 'Expected bounded JSON string');
  const byteLength = Buffer.byteLength(json, 'utf8');
  check(byteLength <= LIMITS.payloadBytes, 'PAYLOAD_SIZE', 'UTF8 payload exceeds32MiB');
  let depth = 0, tokens = 0;
  for (let i = 0; i < json.length; i++) {
    const c = json[i];
    if (c === '"') {
      tokens++;
      for (++i; i < json.length; i++) { if (json[i] === '\\') i++; else if (json[i] === '"') break; }
    } else if (c === '[' || c === '{') { depth++; tokens++; }
    else if (c === ']' || c === '}') depth--;
    else if (!/[\s,:]/.test(c)) { tokens++; while (i + 1 < json.length && !/[\s,\]}:]/.test(json[i + 1])) i++; }
    check(depth <= LIMITS.jsonDepth && tokens <= LIMITS.jsonNodes, 'JSON_BUDGET', 'Lexical JSON budget exceeded');
  }
  let parsed;
  try { parsed = JSON.parse(json); } catch (_) { fail('JSON_SYNTAX', 'Invalid JSON syntax'); }
  check(JSON.stringify(parsed) === json, 'JSON_NORMALIZATION', 'JSON must exactly equal compact JSON.stringify output');
  return { wire: cleanData(parsed), byteLength, tokens };
}

function canonicalJSON(value) {
  const sort = item => {
    if (Array.isArray(item)) return item.map(sort);
    if (item !== null && typeof item === 'object') {
      const out = Object.create(null);
      for (const key of Object.keys(item).sort()) out[key] = sort(item[key]);
      return out;
    }
    return item;
  };
  const json = JSON.stringify(sort(cleanData(value)));
  check(json.length <= LIMITS.payloadBytes && Buffer.byteLength(json, 'utf8') <= LIMITS.payloadBytes,
    'PAYLOAD_SIZE', 'Canonical descriptor JSON exceeds32MiB after escaping');
  return json;
}
function fingerprintDescriptorDefinition(definition) {
  return hash(Buffer.from('gigachad.learned-state.registry.v1\0' + canonicalJSON(definition), 'utf8'));
}

function decodeTags(stateValues, manifest, tensorIds) {
  let nodes = 0;
  const references = [], values = new Map();
  const scalar = value => value === null || ['string', 'boolean', 'number', 'bigint'].includes(typeof value);
  const visit = (tag, depth, stateId, path) => {
    check(++nodes <= LIMITS.stateNodes && depth <= LIMITS.stateDepth, 'STATE_BUDGET', 'Tagged state budget exceeded');
    if (tag === null || typeof tag === 'boolean' || typeof tag === 'string') return tag;
    check(tag !== null && typeof tag === 'object' && !Array.isArray(tag), 'STATE_TAG', 'Missing state tag');
    switch (tag.$type) {
      case 'f64': {
        exact(tag, ['$type', 'hex'], 'f64');
        check(typeof tag.hex === 'string' && /^[a-f0-9]{16}$/.test(tag.hex), 'F64', 'Invalid F64 hex');
        const number = Buffer.from(tag.hex, 'hex').readDoubleLE();
        check(Number.isFinite(number), 'F64', 'Nonfinite scalar state'); return number;
      }
      case 'i53': exact(tag, ['$type', 'value'], 'i53'); return integer(tag.value, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 'i53');
      case 'bigint': {
        exact(tag, ['$type', 'signed', 'bits', 'hex'], 'bigint');
        check(typeof tag.signed === 'boolean' && [8, 16, 32, 64, 128, 256].includes(tag.bits) &&
          typeof tag.hex === 'string' && tag.hex.length === tag.bits / 4 && /^[a-f0-9]+$/.test(tag.hex), 'BIGINT', 'Invalid BigInt encoding');
        const raw = BigInt('0x' + tag.hex), width = BigInt(tag.bits);
        return tag.signed && raw >= (1n << (width - 1n)) ? raw - (1n << width) : raw;
      }
      case 'tensor': {
        exact(tag, ['$type', 'id'], 'tensor reference'); identifier(tag.id);
        check(tensorIds.has(tag.id), 'TENSOR_REFERENCE', 'Unknown tensor reference');
        references.push({ stateId, path, tensorId: tag.id });
        // Raw tags remain available; an ordinary object can mimic this shape.
        return Object.freeze({ $type: 'tensor', id: tag.id });
      }
      case 'array': {
        exact(tag, ['$type', 'items'], 'array tag');
        return list(tag.items, LIMITS.stateNodes, 'state array').map((item, i) => visit(item, depth + 1, stateId, path.concat(['items', i])));
      }
      case 'object':
      case 'map': {
        exact(tag, ['$type', 'entries'], 'collection tag');
        const map = tag.$type === 'map', result = map ? new Map() : Object.create(null), keys = new Set();
        list(tag.entries, LIMITS.stateNodes, 'collection').forEach((pair, i) => {
          check(Array.isArray(pair) && pair.length === 2, 'STATE_PAIR', 'Expected exact pair');
          const key = map ? visit(pair[0], depth + 1, stateId, path.concat(['entries', i, 0])) : identifier(pair[0]);
          check(scalar(key) && !keys.has(key), 'STATE_UNIQUENESS', 'Duplicate/nonscalar collection key (SameValueZero)'); keys.add(key);
          const value = visit(pair[1], depth + 1, stateId, path.concat(['entries', i, 1]));
          if (map) result.set(key, value); else result[key] = value;
        });
        return result;
      }
      case 'set': {
        exact(tag, ['$type', 'values'], 'set tag'); const result = new Set();
        list(tag.values, LIMITS.stateNodes, 'set').forEach((tagValue, i) => {
          const value = visit(tagValue, depth + 1, stateId, path.concat(['values', i]));
          check(scalar(value) && !result.has(value), 'STATE_UNIQUENESS', 'Duplicate/nonscalar Set member (SameValueZero)'); result.add(value);
        });
        return result;
      }
      default: fail('STATE_TAG', 'Unknown tagged state type');
    }
  };
  for (const row of manifest) {
    const tag = stateValues[row.id], kind = tag === null ? 'null' : typeof tag === 'object' ? tag.$type : typeof tag;
    check(row.valueType === kind, 'STATE_TYPE', 'State descriptor/tag mismatch');
    values.set(row.id, visit(tag, 0, row.id, []));
  }
  return { values, references, nodes };
}

function verifyOverlaps(tensors) {
  const groups = new Map();
  for (const row of tensors) {
    if (!groups.has(row.backingGroup)) groups.set(row.backingGroup, []);
    groups.get(row.backingGroup).push(row);
  }
  let unionBytes = 0, comparedBytes = 0, ranges = 0;
  for (const group of groups.values()) {
    const rows = group.filter(row => row.byteLength).sort((a, b) => a.backingOffset - b.backingOffset || ordinal(a.id, b.id));
    for (let i = 0; i < rows.length;) {
      const start = rows[i].backingOffset;
      let end = start + rows[i].byteLength, next = i + 1;
      while (next < rows.length && rows[next].backingOffset <= end) { end = Math.max(end, rows[next].backingOffset + rows[next].byteLength); next++; }
      unionBytes += end - start; check(unionBytes <= LIMITS.tensorBytes, 'OVERLAP_BUDGET', 'Backing union exceeds declared byte bound');
      const union = Buffer.alloc(end - start); let covered = 0;
      for (; i < next; i++) {
        const row = rows[i], offset = row.backingOffset - start;
        const overlap = Math.min(row.byteLength, Math.max(0, covered - offset));
        ranges++; comparedBytes += overlap;
        check(comparedBytes <= LIMITS.tensorBytes, 'OVERLAP_BUDGET', 'Overlap comparison byte bound exceeded');
        check(row.bytes.subarray(0, overlap).equals(union.subarray(offset, offset + overlap)), 'OVERLAP', 'Inconsistent overlapping tensor bytes');
        if (overlap < row.byteLength) row.bytes.copy(union, offset + overlap, overlap);
        covered = Math.max(covered, offset + row.byteLength);
      }
    }
  }
  return { backingGroups: groups.size, unionBytes, comparedBytes, ranges };
}

function normalizedRows(rows, fields, paths = false) {
  return rows.map(row => {
    exact(row, fields, 'expected catalog row');
    const copy = Object.fromEntries(fields.map(key => [key, row[key]]));
    if (paths) copy.paths = copy.paths.slice().sort((a, b) => ordinal(JSON.stringify([a.root, a.keys]), JSON.stringify([b.root, b.keys])));
    return copy;
  }).sort((a, b) => ordinal(a.id, b.id));
}

function verifyExpectedCatalog(wire, catalog) {
  if (catalog === undefined) return { matched: false, fingerprintVerified: false };
  const expected = cleanData(catalog);
  exact(expected, ['descriptorDefinition', 'architecture', 'tensors', 'states', 'resumeRules'], 'expected catalog');
  const fingerprint = fingerprintDescriptorDefinition(expected.descriptorDefinition);
  check(fingerprint === wire.architecture.fingerprint && fingerprint === expected.architecture.fingerprint,
    'CATALOG_FINGERPRINT', 'Externally supplied descriptor fingerprint mismatch');
  check(canonicalJSON(wire.architecture) === canonicalJSON(expected.architecture), 'CATALOG_ARCHITECTURE', 'Expected architecture/component set mismatch');
  const actualTensors = wire.tensorManifest.map(row => Object.fromEntries(TENSOR_FIELDS.map(key => [key, row[key]])));
  const expectedTensors = normalizedRows(list(expected.tensors, LIMITS.tensors, 'expected tensors'), TENSOR_FIELDS, true);
  check(canonicalJSON(normalizedRows(actualTensors, TENSOR_FIELDS, true)) === canonicalJSON(expectedTensors),
    'CATALOG_TENSORS', 'Expected exact tensor descriptor/alias/backing set mismatch');
  check(canonicalJSON(normalizedRows(wire.stateManifest, STATE_FIELDS)) === canonicalJSON(normalizedRows(list(expected.states, LIMITS.states, 'expected states'), STATE_FIELDS)),
    'CATALOG_STATES', 'Expected exact state descriptor set mismatch');
  check(canonicalJSON(wire.resumeRules) === canonicalJSON(expected.resumeRules), 'CATALOG_RESUME', 'Expected resume rules mismatch');
  return { matched: true, fingerprintVerified: true };
}

function decodeLearnedStateWire(json, { expectedCatalog } = {}) {
  const { wire, byteLength: payloadBytes, tokens } = parseWireJSON(json);
  exact(wire, ['schema', 'architecture', 'snapshot', 'tensorManifest', 'tensorBlob', 'stateManifest', 'stateValues', 'resumeRules'], 'wire', ['provenance']);
  check(wire.schema === 'gigachad.learned-state.v1', 'SCHEMA', 'Unsupported learned-state schema');
  exact(wire.architecture, ['registryVersion', 'fingerprint', 'components'], 'architecture');
  integer(wire.architecture.registryVersion, 1, Number.MAX_SAFE_INTEGER, 'registry version'); digestString(wire.architecture.fingerprint);
  const components = new Map();
  for (const component of list(wire.architecture.components, LIMITS.components, 'components')) {
    exact(component, ['id', 'schemaVersion', 'implementationDigest', 'present'], 'component'); identifier(component.id);
    integer(component.schemaVersion, 1, Number.MAX_SAFE_INTEGER, 'component schema version'); digestString(component.implementationDigest);
    check(typeof component.present === 'boolean' && !components.has(component.id), 'COMPONENT', 'Duplicate/invalid component'); components.set(component.id, component);
  }
  const snapshot = wire.snapshot;
  exact(snapshot, ['creatureId', 'policyId', 'checkpointId', 'logicalTick', 'modelEpoch', 'capturedAt', 'resumeBoundary'], 'snapshot');
  for (const key of ['creatureId', 'policyId', 'checkpointId']) identifier(snapshot[key]);
  for (const key of ['logicalTick', 'modelEpoch']) integer(snapshot[key], 0, Number.MAX_SAFE_INTEGER, key);
  check(snapshot.resumeBoundary === 'fresh-browser-authority' && typeof snapshot.capturedAt === 'string' && Number.isFinite(Date.parse(snapshot.capturedAt)) &&
    new Date(snapshot.capturedAt).toISOString() === snapshot.capturedAt, 'SNAPSHOT', 'Invalid snapshot time/boundary');
  const ids = new Set(), paths = new Set(), backings = new Map(); let total = 0, previous = '';
  for (const row of list(wire.tensorManifest, LIMITS.tensors, 'tensor manifest')) {
    exact(row, TENSOR_FIELDS.concat(['blobOffset', 'sha256']), 'tensor row');
    for (const key of ['id', 'componentId', 'role', 'backingGroup']) identifier(row[key]);
    check(!ids.has(row.id) && (!previous || previous < row.id), 'TENSOR_ID', 'Tensor IDs must be unique and ordinal sorted'); previous = row.id; ids.add(row.id);
    check(components.get(row.componentId)?.present === true, 'COMPONENT', 'Tensor references unknown/absent component');
    check(Object.hasOwn(DTYPES, row.dtype) && row.byteOrder === 'LE', 'DTYPE', 'Unsupported tensor type/byte order');
    integer(row.length, 0, LIMITS.tensorBytes, 'tensor length'); integer(row.byteLength, 0, LIMITS.tensorBytes, 'tensor bytes');
    check(row.length * DTYPES[row.dtype] === row.byteLength, 'SHAPE', 'Typed length/byte count mismatch');
    const dimensions = list(row.dimensions, LIMITS.rank, 'dimensions'); check(dimensions.length > 0, 'SHAPE', 'Missing dimensions');
    let product = 1;
    for (const dimension of dimensions) { integer(dimension, 0, LIMITS.tensorBytes, 'dimension'); product *= dimension; check(Number.isSafeInteger(product), 'SHAPE', 'Dimension product overflow'); }
    check(product === row.length, 'SHAPE', 'Dimensions/length mismatch');
    integer(row.blobOffset, 0, LIMITS.tensorBytes, 'blob offset');
    check(row.blobOffset === total && row.byteLength <= LIMITS.tensorBytes - total, 'BLOB_RANGE', 'Blob ranges must cover exactly without holes/overlap'); total += row.byteLength; digestString(row.sha256);
    integer(row.backingOffset, 0, Number.MAX_SAFE_INTEGER, 'backing offset'); integer(row.backingByteLength, 0, Number.MAX_SAFE_INTEGER, 'backing length');
    check(row.backingOffset % DTYPES[row.dtype] === 0 && row.backingOffset <= row.backingByteLength && row.byteLength <= row.backingByteLength - row.backingOffset,
      'BACKING', 'Invalid backing range/alignment');
    check(!backings.has(row.backingGroup) || backings.get(row.backingGroup) === row.backingByteLength, 'BACKING', 'Conflicting backing capacity'); backings.set(row.backingGroup, row.backingByteLength);
    const aliases = list(row.paths, LIMITS.aliases, 'aliases'); check(aliases.length > 0, 'PATH', 'Missing tensor alias paths');
    for (const path of aliases) {
      exact(path, ['root', 'keys'], 'path'); identifier(path.root); const keys = list(path.keys, LIMITS.pathDepth, 'path keys');
      check(keys.length > 0, 'PATH', 'Empty path'); keys.forEach(identifier);
      const key = JSON.stringify([path.root, path.keys]); check(!paths.has(key), 'PATH', 'Duplicate alias path'); paths.add(key);
    }
  }
  const blob = wire.tensorBlob;
  exact(blob, ['encoding', 'byteLength', 'sha256', 'data'], 'tensor blob'); digestString(blob.sha256);
  integer(blob.byteLength, 0, LIMITS.tensorBytes, 'blob bytes');
  check(blob.encoding === 'base64' && typeof blob.data === 'string' && blob.byteLength === total && blob.data.length === 4 * Math.ceil(total / 3), 'BASE64', 'Invalid blob encoding/length');
  const raw = Buffer.from(blob.data, 'base64');
  check(raw.byteLength === total && raw.toString('base64') === blob.data, 'BASE64', 'Noncanonical/truncated base64');
  check(hash(raw) === blob.sha256, 'BLOB_DIGEST', 'Full blob SHA256 mismatch');
  const tensors = wire.tensorManifest.map(row => {
    const part = raw.subarray(row.blobOffset, row.blobOffset + row.byteLength);
    check(hash(part) === row.sha256, 'TENSOR_DIGEST', 'Tensor SHA256 mismatch: ' + row.id);
    const bytes = Buffer.alloc(row.byteLength); part.copy(bytes); // Own allocation, not a shared slice of the blob.
    return { ...row, bytes };
  });
  const overlap = verifyOverlaps(tensors), stateIds = new Set();
  check(wire.stateValues !== null && typeof wire.stateValues === 'object' && !Array.isArray(wire.stateValues), 'STATE_VALUES', 'State values must be a record');
  for (const row of list(wire.stateManifest, LIMITS.states, 'state manifest')) {
    exact(row, STATE_FIELDS, 'state row'); identifier(row.id); identifier(row.componentId); identifier(row.role);
    integer(row.schemaVersion, 1, Number.MAX_SAFE_INTEGER, 'state schema version');
    check(!stateIds.has(row.id) && components.get(row.componentId)?.present === true && typeof row.required === 'boolean', 'STATE_DESCRIPTOR', 'Invalid/duplicate state descriptor'); stateIds.add(row.id);
    check(Object.hasOwn(wire.stateValues, row.id), 'STATE_VALUES', 'Missing state value');
  }
  check(Object.keys(wire.stateValues).length === stateIds.size, 'STATE_VALUES', 'Extra state value');
  const states = decodeTags(wire.stateValues, wire.stateManifest, ids), ruleIds = new Set();
  for (const rule of list(wire.resumeRules, LIMITS.states, 'resume rules')) {
    exact(rule, ['id', 'action', 'reason', 'version'], 'resume rule'); identifier(rule.id); identifier(rule.action);
    integer(rule.version, 1, Number.MAX_SAFE_INTEGER, 'resume version');
    check(!ruleIds.has(rule.id) && typeof rule.reason === 'string' && rule.reason.length > 0 && rule.reason.length <= 2048, 'RESUME', 'Duplicate/invalid resume rule'); ruleIds.add(rule.id);
  }
  const catalog = verifyExpectedCatalog(wire, expectedCatalog);
  return {
    evidence: { schema: wire.schema, payloadBytes, payloadSha256: hash(Buffer.from(json, 'utf8')), tensorCount: tensors.length,
      tensorBytes: total, aliasPaths: paths.size, stateCount: stateIds.size, componentCount: components.size,
      wireValid: true, suppliedCatalogMatched: catalog.matched, descriptorFingerprintVerified: catalog.fingerprintVerified,
      registryCompleteness: 'not-established', semanticStatePoliciesVerified: false,
      overlap, parserTokens: tokens, taggedStateNodes: states.nodes, tensorReferenceCount: states.references.length,
      scope: 'Independent wire and optional supplied-catalog match only; no complete live-model, numerical-policy, import, restart, or durability claim' },
    architecture: wire.architecture, snapshot, tensors, stateManifest: wire.stateManifest,
    stateTags: wire.stateValues, decodedStates: states.values, tensorReferences: states.references, resumeRules: wire.resumeRules
  };
}

// Bridge to the separate independent observer's evidence format. Its tighter
//16MiB/8192-path envelope is explicit; no tensor is silently omitted.
function toModelStateEvidence(decoded) {
  const rows = decoded.tensors;
  check(Array.isArray(rows) && rows.length > 0 && rows.length <= 4096, 'OBSERVER_BOUND', 'Observer needs1..4096 tensors');
  const rawBytes = rows.reduce((sum, row) => sum + row.byteLength, 0), paths = rows.reduce((sum, row) => sum + row.paths.length, 0);
  check(rawBytes <= 16 * 1024 * 1024 && paths <= 8192, 'OBSERVER_BOUND', 'Wire exceeds independent observer bridge bounds');
  const backings = new Map();
  const entries = rows.map(row => {
    backings.set(row.backingGroup, row.backingByteLength);
    return { id: row.id, kind: 'tensor', paths: row.paths, dtype: row.dtype, dimensions: row.dimensions, role: row.role,
      componentId: row.componentId, length: row.length, byteLength: row.byteLength, byteOffset: row.backingOffset,
      backingId: row.backingGroup, encoding: 'native-byte-base64', dataBase64: row.bytes.toString('base64') };
  });
  return { schema: 'gigachad.model-state-evidence.v1', byteOrder: 'LE', entries,
    backings: Array.from(backings, ([id, byteLength]) => ({ id, byteLength })),
    totals: { entries: entries.length, paths, rawBytes, backings: backings.size },
    coverage: { registryComplete: 'not-established', scope: 'Supplied wire tensor catalog only', assumptions: ['Use original decoder output; caller mutation invalidates its prior evidence'] } };
}

module.exports = { LIMITS, DTYPES, TENSOR_FIELDS, STATE_FIELDS, decodeLearnedStateWire, fingerprintDescriptorDefinition, toModelStateEvidence };
