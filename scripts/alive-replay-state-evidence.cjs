'use strict';
// Independent verification of the declared dense replay subset. This module
// imports no production codec, registry, replay adapter, exporter or model.
const { createHash } = require('node:crypto');
const wire = require('./alive-learned-state-wire-evidence.cjs');
const COMPONENT_ID = 'trainable-hub-replay', SCHEMA_VERSION = 1, CAPACITY = 32;
const OBSERVATION_SCHEMA = 'gigachad.replay-hydration-evidence.v1';
const FIELDS = [['z16', 16], ['a8', 8], ['zNext16', 16]];
const SNAPSHOT_KEYS = ['creatureId', 'policyId', 'checkpointId', 'logicalTick', 'modelEpoch', 'capturedAt', 'resumeBoundary'];
const sha = value => createHash('sha256').update(value).digest('hex');
const ordinal = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const fail = (code, message) => { const error = new TypeError(message); error.code = code; throw error; };
function integer(value, min, max, label) {
  if (!Number.isSafeInteger(value) || Object.is(value, -0) || value < min || value > max) fail('REPLAY_RANGE', 'Invalid replay ' + label);
  return value;
}
function occupancy(count, cursor, indices) {
  integer(count, 0, CAPACITY, 'count'); integer(cursor, 0, CAPACITY - 1, 'cursor');
  if (count < CAPACITY && cursor !== count) fail('REPLAY_OCCUPANCY', 'Partial replay cursor must equal dense occupied count');
  if (indices && (indices.length !== count || indices.some((value, i) => !Number.isSafeInteger(value) || Object.is(value, -0) || value !== i))) {
    fail('REPLAY_OCCUPANCY', 'Replay indices must be exactly 0 through count minus one');
  }
}

function createExpectedReplayCatalog(count) {
  integer(count, 0, CAPACITY, 'catalog count');
  // Independently transcribed declaration. The implementation digest includes
  // declaration order; the registry fingerprint uses normalized static rows.
  // Occupancy never changes this fingerprint or pads the live ring.
  const fixed = (id, role, schema) => ({ id, componentId: COMPONENT_ID, role,
    paths: [{ root: 'replay', keys: [id] }], schemaVersion: 1, required: true, schema });
  const rows = { tensors: [], states: [
    fixed('count', 'occupancy', { type: 'i53', min: 0, max: 32 }),
    fixed('indices', 'occupancy', { type: 'array', items: { type: 'i53', min: 0, max: 31 }, maxLength: 32, unique: true }),
    fixed('cursor', 'insertion-cursor', { type: 'i53', min: 0, max: 31 })
  ], families: [{ id: 'replay', componentId: COMPONENT_ID, capacity: 32,
    slotPath: { root: 'replay', keys: ['slots'] }, countStateId: 'count', indicesStateId: 'indices', cursorStateId: 'cursor',
    tensors: FIELDS.map(([id, length]) => ({ id, role: 'replay-memory', paths: [[id]], dtype: 'Float32Array', dimensions: [length],
      backingGroup: id, backingOffset: 0, backingByteLength: length * 4, policy: { format: 'native', finite: true } })),
    states: [{ id: 'surprise', role: 'replay-priority', paths: [['surprise']], schemaVersion: 1, required: true, schema: { type: 'f64' } }]
  }], resumeRules: [] };
  const implementationDigest = wire.fingerprintDescriptorDefinition({ componentId: COMPONENT_ID, schemaVersion: 1, capacity: 32, ...rows,
    interpretation: 'Dense physical slots only; partial cursor equals count; full cursor 0..31; exact standalone distinct finite Float32 fields disjoint from direct hub views and finite Float64 surprise; no omitted cadence or model state' });
  rows.states.sort(ordinal); rows.families[0].tensors.sort(ordinal);
  const definition = { registryVersion: 1, components: [{ id: COMPONENT_ID, schemaVersion: 1, implementationDigest, present: true }], ...rows };
  const fingerprint = wire.fingerprintDescriptorDefinition(definition);
  if (implementationDigest !== '405f828d971811c28eea64ceb92ee3bb6056e1708b2a00e7c4f965b69e493a42' ||
      fingerprint !== '31300355fd4f232bdd8860e4375f8e887a462da0d044a5bbbacee5ce50c8647e') {
    fail('REPLAY_CATALOG_CHANGED', 'Independent replay catalog changed; explicit contract review required');
  }
  const tensors = [], states = rows.states.map(row => ({ id: row.id, componentId: COMPONENT_ID, role: row.role,
    valueType: row.schema.type, schemaVersion: 1, required: true }));
  for (let slot = 0; slot < count; slot++) {
    for (const [field, length] of FIELDS) {
      const id = 'replay/' + slot + '/' + field;
      tensors.push({ id, componentId: COMPONENT_ID, role: 'replay-memory', paths: [{ root: 'replay', keys: ['slots', String(slot), field] }],
        dtype: 'Float32Array', dimensions: [length], length, byteLength: length * 4, byteOrder: 'LE',
        backingGroup: id, backingOffset: 0, backingByteLength: length * 4 });
    }
    states.push({ id: 'replay/' + slot + '/surprise', componentId: COMPONENT_ID, role: 'replay-priority', valueType: 'f64', schemaVersion: 1, required: true });
  }
  return { descriptorDefinition: definition, architecture: { registryVersion: 1, fingerprint, components: definition.components },
    tensors: tensors.sort(ordinal), states: states.sort(ordinal), resumeRules: [] };
}

// Self-contained, synchronous and serializable with .toString(). Reads raw
// live own-data slots only; no production exports or metadata callbacks. The
// ordinary non-Proxy/intrinsics contract matches the replay adapter boundary.
// All Float32 bytes are copied before formatting any observation. Failure is
// retained as a receipt, never repaired or retried through an exporter.
function captureReplayHydration(runtime) {
  const schema = 'gigachad.replay-hydration-evidence.v1';
  const error = (code, message) => { const e = new TypeError(message); e.code = code; throw e; };
  const own = (object, key, writable = false) => {
    const d = Object.getOwnPropertyDescriptor(object, key);
    if (!d || !Object.prototype.hasOwnProperty.call(d, 'value') || writable && d.writable !== true) error('REPLAY_OWN_DATA', 'Replay observation requires own data: ' + key);
    return d.value;
  };
  const exact = (object, names, label) => {
    const keys = Reflect.ownKeys(object);
    if (keys.length !== names.length || keys.some(key => typeof key !== 'string' || !names.includes(key))) error('REPLAY_SHAPE', 'Unexpected ' + label + ' keys or holes');
  };
  const plain = value => value !== null && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const int = (value, max) => Number.isSafeInteger(value) && !Object.is(value, -0) && value >= 0 && value <= max;
  try {
    if (new Uint8Array(new Uint16Array([1]).buffer)[0] !== 1) error('REPLAY_ENDIAN', 'Replay observation requires little-endian host');
    const hub = own(runtime, 'trainableAlifeNeuralHub');
    if (!plain(hub)) error('REPLAY_SHAPE', 'Replay hub must be ordinary data');
    const hubKeys = Reflect.ownKeys(hub);
    if (hubKeys.length > 4096) error('REPLAY_BOUND', 'Direct hub field inspection exceeds 4096 fields');
    const ring = own(hub, 'replayRing32', true), cursor = own(hub, 'replayWritePtr', true);
    if (!Array.isArray(ring) || Object.getPrototypeOf(ring) !== Array.prototype) error('REPLAY_SHAPE', 'Replay ring must be an ordinary array');
    const count = own(ring, 'length');
    if (!int(count, 32) || !int(cursor, 31) || count < 32 && cursor !== count) error('REPLAY_OCCUPANCY', 'Invalid dense replay occupancy/cursor');
    exact(ring, ['length', ...Array.from({ length: count }, (_, i) => String(i))], 'ring');
    const typed = Object.getPrototypeOf(Float32Array.prototype), getter = name => Object.getOwnPropertyDescriptor(typed, name).get;
    const bufferSize = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get;
    const resizable = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get;
    const backings = new Set(), records = new Set(), captured = [];
    for (let slot = 0; slot < count; slot++) {
      const record = own(ring, String(slot));
      if (!plain(record) || records.has(record)) error('REPLAY_ALIAS', 'Replay records must be distinct ordinary objects');
      records.add(record); exact(record, ['z16', 'a8', 'zNext16', 'surprise'], 'record');
      const copied = { slot };
      for (const [field, length] of [['z16', 16], ['a8', 8], ['zNext16', 16]]) {
        const view = own(record, field);
        if (Object.getPrototypeOf(view) !== Float32Array.prototype || getter(Symbol.toStringTag).call(view) !== 'Float32Array' ||
            getter('length').call(view) !== length || getter('byteLength').call(view) !== length * 4 || getter('byteOffset').call(view) !== 0) error('REPLAY_TENSOR', 'Replay requires standalone Float32[' + length + ']');
        exact(view, Array.from({ length }, (_, i) => String(i)), 'tensor');
        const buffer = getter('buffer').call(view);
        // Intrinsic ArrayBuffer getter rejects SharedArrayBuffer and proxies.
        if (bufferSize.call(buffer) !== length * 4 || resizable?.call(buffer) || backings.has(buffer)) error('REPLAY_ALIAS', 'Replay requires distinct fixed nonshared backing');
        backings.add(buffer);
        const bytes = new Uint8Array(buffer).slice();
        const values = new DataView(bytes.buffer);
        for (let i = 0; i < length; i++) if (!Number.isFinite(values.getFloat32(i * 4, true))) error('REPLAY_NONFINITE', 'Replay tensor contains nonfinite Float32');
        copied[field] = bytes;
      }
      const surprise = own(record, 'surprise');
      if (typeof surprise !== 'number' || !Number.isFinite(surprise)) error('REPLAY_NONFINITE', 'Replay surprise must be finite Float64');
      copied.surprise = surprise; captured.push(copied);
    }
    for (const key of hubKeys) {
      const member = Object.getOwnPropertyDescriptor(hub, key);
      if (!member || !Object.prototype.hasOwnProperty.call(member, 'value') || !ArrayBuffer.isView(member.value)) continue;
      let backing;
      try { backing = getter('buffer').call(member.value); }
      catch (_) { backing = Object.getOwnPropertyDescriptor(DataView.prototype, 'buffer').get.call(member.value); }
      if (backings.has(backing)) error('REPLAY_ALIAS', 'Replay backing aliases a direct hub view');
    }
    const hex = bytes => { let result = ''; for (let i = 0; i < bytes.length; i++) result += bytes[i].toString(16).padStart(2, '0'); return result; };
    const entries = captured.map(row => {
      const scalar = new ArrayBuffer(8); new DataView(scalar).setFloat64(0, row.surprise, true);
      return { slot: row.slot, z16Hex: hex(row.z16), a8Hex: hex(row.a8), zNext16Hex: hex(row.zNext16), surpriseHex: hex(new Uint8Array(scalar)) };
    });
    return { schema, ok: true, byteOrder: 'LE', count, cursor, entries, tensorBytes: count * 160 };
  } catch (failure) {
    return { schema, ok: false, code: typeof failure.code === 'string' ? failure.code : 'REPLAY_CAPTURE', reason: String(failure.message || failure).slice(0, 400) };
  }
}

function finite(bytes, width, label) {
  for (let i = 0; i < bytes.length; i += width) if (!Number.isFinite(width === 4 ? bytes.readFloatLE(i) : bytes.readDoubleLE(i))) {
    fail('REPLAY_NONFINITE', 'Nonfinite replay ' + label);
  }
}
function decodeReplayStateEvidence(json) {
  // First generic validation owns/parses the bounded string, checks every hash
  // and tag, then count selects the external exact occupied-roster oracle.
  const initial = wire.decodeLearnedStateWire(json);
  const count = initial.decodedStates.get('count'), cursor = initial.decodedStates.get('cursor'), indices = initial.decodedStates.get('indices');
  if (!Array.isArray(indices)) fail('REPLAY_OCCUPANCY', 'Missing replay occupied indices');
  occupancy(count, cursor, indices);
  const catalog = createExpectedReplayCatalog(count);
  const decoded = wire.decodeLearnedStateWire(json, { expectedCatalog: catalog });
  if (decoded.stateManifest.some((row, i) => row.id !== catalog.states[i].id)) fail('REPLAY_STATE_ORDER', 'Replay state manifest must be ordinal sorted');
  // The family contract uses integer tags even inside the indices array. The
  // generic wire format permits f64 tags here; numerical equality is not enough.
  const indexTags = decoded.stateTags.indices.items;
  if (indexTags.some((tag, i) => tag?.$type !== 'i53' || tag.value !== i)) fail('REPLAY_STATE_TAG', 'Replay indices require exact integer tags');
  const byId = new Map(decoded.tensors.map(row => [row.id, row]));
  const entries = [];
  for (let slot = 0; slot < count; slot++) {
    const record = { slot };
    for (const [field] of FIELDS) {
      const bytes = Buffer.from(byId.get('replay/' + slot + '/' + field).bytes);
      finite(bytes, 4, field); record[field] = bytes;
    }
    const surpriseHex = decoded.stateTags['replay/' + slot + '/surprise'].hex;
    const scalar = Buffer.from(surpriseHex, 'hex'); finite(scalar, 8, 'surprise');
    record.surprise = scalar.readDoubleLE(); record.surpriseHex = surpriseHex; entries.push(record);
  }
  return { count, cursor, indices: indices.slice(), entries, snapshot: { ...decoded.snapshot },
    evidence: { wireValid: true, exactReplayCatalogMatched: true, replayNumericPoliciesVerified: true,
      schema: decoded.evidence.schema, componentId: COMPONENT_ID, componentSchemaVersion: 1,
      architectureFingerprint: decoded.architecture.fingerprint, implementationDigest: decoded.architecture.components[0].implementationDigest,
      payloadSHA256: decoded.evidence.payloadSha256, payloadBytes: decoded.evidence.payloadBytes,
      count, cursor, capacity: 32, tensorCount: count * 3, tensorValues: count * 40, tensorBytes: count * 160, stateCount: count + 3,
      completeApplicationCatalog: false, liveEngineObserved: false, restoreExecuted: false, durabilityVerified: false,
      scope: 'Exact declared dense replay wire subset only; cadence, RNG, learning rate, model weights, next output and durable restart are not established' } };
}

function dataRecord(object, names, label) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) fail('REPLAY_OBSERVATION', 'Expected ' + label + ' record');
  const keys = Reflect.ownKeys(object);
  if (keys.length !== names.length || keys.some(key => typeof key !== 'string' || !names.includes(key))) fail('REPLAY_OBSERVATION', 'Unexpected ' + label + ' fields');
  const copy = Object.create(null);
  for (const key of names) {
    const property = Object.getOwnPropertyDescriptor(object, key);
    if (!property || !Object.hasOwn(property, 'value') || !property.enumerable) fail('REPLAY_OBSERVATION', 'Observation requires enumerable own data: ' + key);
    copy[key] = property.value;
  }
  return copy;
}
function copyObservation(observation) {
  const receipt = Object.getOwnPropertyDescriptor(observation || {}, 'ok');
  if (receipt && Object.hasOwn(receipt, 'value') && receipt.value === false) fail('REPLAY_CAPTURE_FAILED', 'The first direct replay observation failed');
  const value = dataRecord(observation, ['schema', 'ok', 'byteOrder', 'count', 'cursor', 'entries', 'tensorBytes'], 'replay observation');
  if (value.schema !== OBSERVATION_SCHEMA || value.ok !== true || value.byteOrder !== 'LE') fail('REPLAY_OBSERVATION', 'Invalid replay observation schema/status/byte order');
  occupancy(value.count, value.cursor);
  if (value.tensorBytes !== value.count * 160 || !Array.isArray(value.entries)) fail('REPLAY_OBSERVATION', 'Invalid replay observation byte count/entries');
  const length = Object.getOwnPropertyDescriptor(value.entries, 'length')?.value;
  if (length !== value.count || Reflect.ownKeys(value.entries).length !== length + 1) fail('REPLAY_OBSERVATION', 'Replay observation entries must be dense');
  const entries = [];
  for (let slot = 0; slot < length; slot++) {
    const property = Object.getOwnPropertyDescriptor(value.entries, String(slot));
    if (!property || !Object.hasOwn(property, 'value') || !property.enumerable) fail('REPLAY_OBSERVATION', 'Replay observation entry accessor/hole');
    const row = dataRecord(property.value, ['slot', 'z16Hex', 'a8Hex', 'zNext16Hex', 'surpriseHex'], 'replay entry');
    if (!Number.isSafeInteger(row.slot) || Object.is(row.slot, -0) || row.slot !== slot) fail('REPLAY_OBSERVATION', 'Replay observation slot order mismatch');
    const owned = { slot };
    for (const [field, elements] of [...FIELDS, ['surprise', 2]]) {
      const text = row[field + 'Hex'];
      if (typeof text !== 'string' || text.length !== elements * 8 || !/^[0-9a-f]+$/.test(text)) fail('REPLAY_OBSERVATION', 'Invalid bounded raw hex: ' + field);
      const bytes = Buffer.from(text, 'hex'); finite(bytes, field === 'surprise' ? 8 : 4, field);
      owned[field] = bytes;
    }
    entries.push(owned);
  }
  return { count: value.count, cursor: value.cursor, entries };
}

function assessReplayStateEvidence(json, observation, { expectedSnapshot } = {}) {
  let actual, observed, snapshot;
  try {
    observed = copyObservation(observation); // Own direct evidence before decode.
    if (expectedSnapshot !== undefined) snapshot = dataRecord(expectedSnapshot, SNAPSHOT_KEYS, 'expected snapshot');
    actual = decodeReplayStateEvidence(json);
  } catch (error) {
    return { ok: false, status: 'invalid-evidence', code: error.code || 'REPLAY_EVIDENCE', reason: String(error.message).slice(0, 400),
      arraysChecked: 0, elementsChecked: 0, elementsDifferent: 0, comparedBytes: 0, comparedStates: 0, differences: [], completeApplicationCatalog: false };
  }
  const differences = [], comparisons = [];
  for (const key of ['count', 'cursor']) if (actual[key] !== observed[key]) differences.push({ id: key, kind: 'state-value' });
  if (snapshot) for (const key of SNAPSHOT_KEYS) if (!Object.is(actual.snapshot[key], snapshot[key])) differences.push({ id: 'snapshot.' + key, kind: 'snapshot-identity' });
  let arraysChecked = 0, elementsChecked = 0, elementsDifferent = 0, comparedBytes = 0;
  const common = Math.min(actual.count, observed.count);
  for (let slot = 0; slot < common; slot++) {
    for (const [field, length] of FIELDS) {
      const expected = actual.entries[slot][field], seen = observed.entries[slot][field], id = 'replay/' + slot + '/' + field;
      let changed = 0;
      for (let i = 0; i < length; i++) if (!expected.subarray(i * 4, i * 4 + 4).equals(seen.subarray(i * 4, i * 4 + 4))) changed++;
      arraysChecked++; elementsChecked += length; elementsDifferent += changed; comparedBytes += expected.length;
      if (changed) differences.push({ id, kind: 'value-bits', elementsDifferent: changed });
      comparisons.push({ id, ok: changed === 0, elementsCompared: length, elementsDifferent: changed,
        expectedBytesSHA256: sha(expected), observedBytesSHA256: sha(seen) });
    }
    if (actual.entries[slot].surpriseHex !== observed.entries[slot].surprise.toString('hex')) differences.push({ id: 'replay/' + slot + '/surprise', kind: 'scalar-bits' });
  }
  return { ok: differences.length === 0, status: differences.length ? 'replay-mismatch' : 'passed-replay-subset',
    count: actual.count, cursor: actual.cursor, observedCount: observed.count, observedCursor: observed.cursor,
    arraysChecked, elementsChecked, elementsDifferent, comparedBytes, comparedStates: common + 3,
    differences, comparisons, actual: actual.evidence, completeApplicationCatalog: false,
    snapshotMatched: snapshot ? !differences.some(row => row.kind === 'snapshot-identity') : null,
    scope: 'Compared supplied replay wire to direct observation only; observation provenance, full-model continuation and durable restart require separate evidence' };
}

module.exports = { COMPONENT_ID, SCHEMA_VERSION, CAPACITY, createExpectedReplayCatalog,
  captureReplayHydration, decodeReplayStateEvidence, assessReplayStateEvidence };
