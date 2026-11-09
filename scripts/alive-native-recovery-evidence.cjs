'use strict';

// Verification only. No production module, native constructor or importer is used.
const { createHash } = require('node:crypto');
const MAX_INPUT_BYTES = 32 * 1024 * 1024;
const MAX_PAYLOAD_UNITS = 8 * 1024 * 1024;
const MAX_NODES = 1000000;
const ENVELOPE = 'gigachad.authentic-asmodensius.state.v1';
const RECOVERY = 'gigachad.authentic-asmodensius.legacy-recovery.v1';
const FIELDS = ['seed', 'profile', 'elapsedMs', 'paused', 'input', 'motor', 'native', 'sets'];
const PROVENANCE = ['kind', 'sourceDigest', 'sourceEnvelopeChecksum', 'preparedEnvelopeChecksum',
  'checksumAlgorithm', 'constructorStateChecksum', 'seed', 'profile', 'nativeTick', 'edges', 'affinityRows',
  'preservedKnownState', 'knownStateComparison', 'developmentalAffinity', 'exactHistoricalContinuation', 'limitations'];
const LIMITATIONS = [
  'Historical developmental affinity/jitter was absent and cannot be recovered exactly.',
  'Only missing affinity values are reconstructed from the current same-seed default-profile constructor; saved native state, topology, genome, RNG and collections are retained.',
  'Constructor RNG consumption can vary with V8 sorting; the constructor-state checksum describes this preparation, not cross-runtime reproducibility.',
  'Future developmental refinement is approximate relative to the historical organism; no historical continuity or learning-quality claim is made.',
  'Preparation does not publish, persist or activate the returned candidate; verified backup and caller-controlled publication remain separate.'
];
const scope = 'Recorded legacy state preservation and declared nonexact recovery provenance only; not affinity semantic equivalence, native behavior, authored topology validity, publication or durability.';
const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
const checksum = text => {
  // FNV-1a over UTF-16 code units, not bytes. This is corruption checking only.
  let value = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return value.toString(16).padStart(8, '0');
};
const fail = (code, path) => { const error = new Error(code); error.code = code; error.path = path; throw error; };
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactFields = (value, keys, path) => {
  if (!plain(value)) fail('object-required', path);
  const actual = Object.keys(value).sort(), expected = keys.slice().sort();
  if (actual.length !== expected.length || actual.some((key, i) => key !== expected[i])) fail('field-set', path);
};
const uint = (value, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0) && value <= max;
const pathKey = key => /^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/.test(key) ? '.' + key : '[key-sha256:' + sha256(key) + ']';

// A bounded grammar pass detects duplicates and excessive depth before JSON.parse.
// String contents are never included in errors. The final parse checks escape and
// numeric grammar; the subsequent finite walk rejects exponent overflow.
function parseBounded(text, label, maxString) {
  let at = 0, nodes = 0, keys = 0, keyUnits = 0;
  const ws = () => { while (at < text.length && /[\x20\t\r\n]/.test(text[at])) at++; };
  const string = key => {
    if (text[at] !== '"') fail('json-syntax', label);
    const begin = at++; let units = 0;
    while (at < text.length) {
      const char = text[at++];
      if (char === '"') {
        if (units > (key ? 256 : maxString)) fail('string-limit', label);
        if (!key) return;
        let result; try { result = JSON.parse(text.slice(begin, at)); } catch (_) { fail('json-syntax', label); }
        keyUnits += result.length;
        if (keyUnits > 1024 * 1024) fail('key-text-limit', label);
        if (['__proto__', 'prototype', 'constructor'].includes(result)) fail('unsafe-key', label);
        return result;
      }
      if (char === '\\') {
        if (at >= text.length) fail('json-syntax', label);
        if (text[at++] === 'u') at += 4;
      } else if (char.charCodeAt(0) < 32) fail('json-syntax', label);
      if (++units > (key ? 256 : maxString)) fail('string-limit', label);
    }
    fail('json-syntax', label);
  };
  const value = depth => {
    if (depth > 48) fail('depth-limit', label);
    if (++nodes > MAX_NODES) fail('node-limit', label);
    ws(); const char = text[at];
    if (char === '"') { string(false); return; }
    if (char === '{') {
      at++; ws(); const names = new Set();
      if (text[at] === '}') { at++; return; }
      while (at < text.length) {
        ws(); const name = string(true);
        if (++keys > MAX_NODES || names.size >= 4096) fail('key-count-limit', label);
        if (names.has(name)) fail('duplicate-key', label);
        names.add(name); ws(); if (text[at++] !== ':') fail('json-syntax', label);
        value(depth + 1); ws(); const next = text[at++];
        if (next === '}') return;
        if (next !== ',') fail('json-syntax', label);
      }
      fail('json-syntax', label);
    }
    if (char === '[') {
      at++; ws(); let count = 0;
      if (text[at] === ']') { at++; return; }
      while (at < text.length) {
        if (++count > 100000) fail('array-limit', label);
        value(depth + 1); ws(); const next = text[at++];
        if (next === ']') return;
        if (next !== ',') fail('json-syntax', label);
      }
      fail('json-syntax', label);
    }
    const begin = at;
    while (at < text.length && !/[\x20\t\r\n,}\]]/.test(text[at])) at++;
    if (at === begin) fail('json-syntax', label);
  };
  value(0); ws(); if (at !== text.length) fail('json-syntax', label);
  let result; try { result = JSON.parse(text); } catch (_) { fail('json-syntax', label); }
  const pending = [result];
  while (pending.length) {
    const item = pending.pop();
    if (typeof item === 'number' && !Number.isFinite(item)) fail('nonfinite-number', label);
    if (item && typeof item === 'object') for (const key of Object.keys(item)) pending.push(item[key]);
  }
  return { value: result, nodes, keys };
}

function verifyNativeRecovery(sourceEnvelopeJSON, preparedRecoveryJSON, options = {}) {
  const report = { ok: false, scope, hashes: {}, counts: {}, differences: [],
    provenanceChecks: { sourceDigestExternallyMatched: false, exactHistoricalContinuation: false,
      constructorStateChecksumIndependentlyVerified: false, affinitySemanticsVerified: false } };
  let totalDifferences = 0;
  const difference = (kind, path) => { totalDifferences++; if (report.differences.length < 128) report.differences.push({ kind, path }); };
  const same = (left, right, path) => {
    if (Object.is(left, right)) return;
    if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) !== Array.isArray(right)) {
      difference('value-or-type-changed', path); return;
    }
    if (Array.isArray(left)) {
      if (left.length !== right.length) difference('array-length-changed', path);
      for (let i = 0; i < Math.min(left.length, right.length); i++) same(left[i], right[i], path + '[' + i + ']');
      return;
    }
    const a = Object.keys(left), b = Object.keys(right);
    for (const key of a) {
      if (!Object.hasOwn(right, key)) difference('missing-field', path + pathKey(key));
      else same(left[key], right[key], path + pathKey(key));
    }
    for (const key of b) if (!Object.hasOwn(left, key)) difference('extra-field', path + pathKey(key));
  };
  try {
    if (typeof sourceEnvelopeJSON !== 'string' || typeof preparedRecoveryJSON !== 'string') fail('string-input-required', '$');
    if (sourceEnvelopeJSON.length + preparedRecoveryJSON.length > MAX_INPUT_BYTES) fail('whole-input-limit', '$');
    const wholeBytes = Buffer.byteLength(sourceEnvelopeJSON, 'utf8') + Buffer.byteLength(preparedRecoveryJSON, 'utf8');
    if (wholeBytes > MAX_INPUT_BYTES) fail('whole-input-limit', '$');
    report.hashes.sourceEnvelopeSHA256 = sha256(sourceEnvelopeJSON);
    report.hashes.preparedRecoverySHA256 = sha256(preparedRecoveryJSON);
    report.counts.wholeInputUTF8Bytes = wholeBytes;
    exactFields(options, options.expectedSourceDigest === undefined ? [] : ['expectedSourceDigest'], '$options');
    if (options.expectedSourceDigest !== undefined && !/^[a-f0-9]{64}$/.test(options.expectedSourceDigest)) fail('invalid-expected-digest', '$options.expectedSourceDigest');
    const source = parseBounded(sourceEnvelopeJSON, '$sourceEnvelope', MAX_PAYLOAD_UNITS).value;
    const prepared = parseBounded(preparedRecoveryJSON, '$preparedRecovery', MAX_PAYLOAD_UNITS).value;
    exactFields(prepared, ['schema', 'envelope', 'provenance'], '$preparedRecovery');
    if (prepared.schema !== RECOVERY) fail('recovery-schema', '$preparedRecovery.schema');
    const readEnvelope = (envelope, label) => {
      exactFields(envelope, ['schema', 'sourceDigest', 'checksum', 'payload'], label);
      if (envelope.schema !== ENVELOPE || typeof envelope.sourceDigest !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.sourceDigest)) fail('envelope-schema-or-digest', label);
      if (typeof envelope.payload !== 'string' || envelope.payload.length > MAX_PAYLOAD_UNITS) fail('payload-limit', label + '.payload');
      if (!/^[a-f0-9]{8}$/.test(envelope.checksum) || checksum(envelope.payload) !== envelope.checksum) fail('envelope-checksum', label + '.checksum');
      const parsed = parseBounded(envelope.payload, label + '.payload', 4096);
      return { ...parsed, units: envelope.payload.length, sha: sha256(envelope.payload) };
    };
    const original = readEnvelope(source, '$sourceEnvelope'), recovered = readEnvelope(prepared.envelope, '$preparedRecovery.envelope');
    if (prepared.envelope.sourceDigest !== source.sourceDigest) fail('source-digest-mismatch', '$preparedRecovery.envelope.sourceDigest');
    if (options.expectedSourceDigest !== undefined && options.expectedSourceDigest !== source.sourceDigest) fail('external-source-digest-mismatch', '$sourceEnvelope.sourceDigest');
    report.provenanceChecks.sourceDigestExternallyMatched = options.expectedSourceDigest !== undefined;
    report.hashes.sourcePayloadSHA256 = original.sha;
    report.hashes.preparedPayloadSHA256 = recovered.sha;
    report.hashes.sourceEnvelopeFNV1a32 = source.checksum;
    report.hashes.preparedEnvelopeFNV1a32 = prepared.envelope.checksum;
    report.hashes.sourceDigest = source.sourceDigest;
    report.counts.sourcePayloadUTF16Units = original.units;
    report.counts.preparedPayloadUTF16Units = recovered.units;
    report.counts.sourcePayloadNodes = original.nodes;
    report.counts.preparedPayloadNodes = recovered.nodes;
    const before = original.value, after = recovered.value;
    if (plain(before) && Object.hasOwn(before, 'developmentAffinity')) fail('source-already-has-affinity', '$sourceEnvelope.payload.developmentAffinity');
    exactFields(before, FIELDS, '$sourceEnvelope.payload');
    exactFields(after, [...FIELDS, 'developmentAffinity'], '$preparedRecovery.envelope.payload');
    for (const field of FIELDS) same(before[field], after[field], '$payload.' + field);
    report.counts.knownTopLevelFieldsCompared = FIELDS.length;
    if (!uint(before.seed, 0xffffffff) || !plain(before.profile) || !uint(before.native?.org?.t) || !Array.isArray(before.native?.org?.syn?.pre?.v)) fail('source-binding-fields', '$sourceEnvelope.payload');
    const rows = after.developmentAffinity;
    if (!Array.isArray(rows) || rows.length > 26 * 272) fail('affinity-row-bound', '$payload.developmentAffinity');
    const seen = new Set(); let affinityValues = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i], at = '$payload.developmentAffinity[' + i + ']';
      exactFields(row, ['projection', 'post', 'start', 'values'], at);
      if (!uint(row.projection, 25) || !uint(row.post, 271) || !uint(row.start, 271) ||
          !Array.isArray(row.values) || !row.values.length || row.values.length > 272 || row.start + row.values.length > 272) fail('affinity-row-shape', at);
      const key = row.projection + ':' + row.post;
      if (seen.has(key)) fail('duplicate-affinity-row', at);
      seen.add(key); affinityValues += row.values.length;
      if (affinityValues > 250000) fail('affinity-value-budget', '$payload.developmentAffinity');
      for (const value of row.values) if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 2) fail('affinity-value-range', at + '.values');
    }
    report.counts.affinityRows = rows.length; report.counts.affinityValues = affinityValues;
    const p = prepared.provenance;
    exactFields(p, PROVENANCE, '$provenance');
    const required = { kind: 'legacy-missing-development-affinity-recovery', sourceDigest: source.sourceDigest,
      sourceEnvelopeChecksum: source.checksum, preparedEnvelopeChecksum: prepared.envelope.checksum,
      checksumAlgorithm: 'fnv1a32-accidental-corruption-only', preservedKnownState: true,
      knownStateComparison: 'exact-serialized-known-fields', developmentalAffinity: 'reinitialized-from-current-seeded-constructor',
      exactHistoricalContinuation: false, seed: before.seed, nativeTick: before.native.org.t,
      edges: before.native.org.syn.pre.v.length, affinityRows: rows.length };
    for (const [key, expected] of Object.entries(required)) if (!Object.is(p[key], expected)) difference('provenance-mismatch', '$provenance.' + key);
    if (typeof p.constructorStateChecksum !== 'string' || !/^[a-f0-9]{8}$/.test(p.constructorStateChecksum)) fail('constructor-checksum-format', '$provenance.constructorStateChecksum');
    same(before.profile, p.profile, '$provenance.profile');
    same(LIMITATIONS, p.limitations, '$provenance.limitations');
    report.provenanceChecks.sourceBindingAndNonexactDeclarationMatched = totalDifferences === 0;
    report.ok = totalDifferences === 0;
  } catch (error) {
    difference(error.code || 'invalid-input', error.path || '$');
  }
  report.differenceCount = totalDifferences;
  return report;
}

module.exports = { verifyNativeRecovery };
