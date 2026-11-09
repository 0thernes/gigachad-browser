'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { verifyNativeRecovery } = require('./alive-native-recovery-evidence.cjs');

const digest = 'a'.repeat(64);
// Independent fixture checksum calculation: little-endian UTF-16 bytes + BigInt.
function fnv(text) {
  const bytes = Buffer.from(text, 'utf16le'); let hash = 2166136261n;
  for (let i = 0; i < bytes.length; i += 2) hash = BigInt.asUintN(32, (hash ^ BigInt(bytes.readUInt16LE(i))) * 16777619n);
  return hash.toString(16).padStart(8, '0');
}
const clone = value => JSON.parse(JSON.stringify(value));
const limitations = [
  'Historical developmental affinity/jitter was absent and cannot be recovered exactly.',
  'Only missing affinity values are reconstructed from the current same-seed default-profile constructor; saved native state, topology, genome, RNG and collections are retained.',
  'Constructor RNG consumption can vary with V8 sorting; the constructor-state checksum describes this preparation, not cross-runtime reproducibility.',
  'Future developmental refinement is approximate relative to the historical organism; no historical continuity or learning-quality claim is made.',
  'Preparation does not publish, persist or activate the returned candidate; verified backup and caller-controlled publication remain separate.'
];
function envelope(data) {
  const payload = JSON.stringify(data);
  return { schema: 'gigachad.authentic-asmodensius.state.v1', sourceDigest: digest, checksum: fnv(payload), payload };
}
function fixture() {
  const data = { seed: 1, profile: { mind: 'v40', entropy: 'seeded', substrate: 'synthetic', noise: 'quantum', access: 'all', fixtureUnicode: '\u03bc\ud83c\udf12' },
    elapsedMs: 17.5, paused: true, input: [0, { $number: '-0' }, 1], motor: [0.25, -0.125],
    native: { org: { t: 91, syn: { pre: { __ta: 'Int32Array', v: [0, 1] }, w: { __ta: 'Float32Array', v: [0.125, { $number: '-0' }] } },
      g: { __rng: 4294967295 }, genome: [1, 3, 2] } },
    sets: [{ part: 'affect', field: 'off', values: ['clock', 'flux'] }] };
  const source = envelope(data), candidate = { ...clone(data), developmentAffinity: [{ projection: 1, post: 10, start: 0, values: [0.5, 1] }] };
  const prepared = { schema: 'gigachad.authentic-asmodensius.legacy-recovery.v1', envelope: envelope(candidate), provenance: {
    kind: 'legacy-missing-development-affinity-recovery', sourceDigest: digest,
    sourceEnvelopeChecksum: source.checksum, preparedEnvelopeChecksum: '', checksumAlgorithm: 'fnv1a32-accidental-corruption-only',
    constructorStateChecksum: '0123abcd', seed: 1, profile: clone(data.profile), nativeTick: 91, edges: 2, affinityRows: 1,
    preservedKnownState: true, knownStateComparison: 'exact-serialized-known-fields',
    developmentalAffinity: 'reinitialized-from-current-seeded-constructor', exactHistoricalContinuation: false, limitations: limitations.slice()
  } };
  prepared.provenance.preparedEnvelopeChecksum = prepared.envelope.checksum;
  return { data, source, prepared };
}
function check(f, options) { return verifyNativeRecovery(JSON.stringify(f.source), JSON.stringify(f.prepared), options); }
function rewrite(f, change) {
  const data = JSON.parse(f.prepared.envelope.payload); change(data);
  f.prepared.envelope = envelope(data); f.prepared.provenance.preparedEnvelopeChecksum = f.prepared.envelope.checksum;
}
function rejected(report) { assert.equal(report.ok, false); assert.ok(report.differenceCount > 0); return report; }

test('retains hand-authored known fields, native arrays, tagged negative zero, RNG and ordered sets', () => {
  const f = fixture(), result = check(f, { expectedSourceDigest: digest });
  assert.equal(result.ok, true); assert.equal(result.differenceCount, 0);
  assert.equal(result.counts.knownTopLevelFieldsCompared, 8);
  assert.equal(result.counts.affinityRows, 1); assert.equal(result.counts.affinityValues, 2);
  assert.equal(result.provenanceChecks.sourceDigestExternallyMatched, true);
  assert.equal(result.provenanceChecks.affinitySemanticsVerified, false);
  assert.equal(result.provenanceChecks.constructorStateChecksumIndependentlyVerified, false);
  assert.match(result.scope, /not affinity semantic equivalence/);
  assert.equal(result.hashes.sourcePayloadSHA256, createHash('sha256').update(f.source.payload).digest('hex'));
  assert.equal(result.hashes.sourceEnvelopeFNV1a32, fnv(f.source.payload));
  assert.equal(check(f).provenanceChecks.sourceDigestExternallyMatched, false);
});

test('one learned value, RNG state, tagged negative zero or ordered element change is detected even with valid new checksums', () => {
  for (const mutate of [
    d => { d.native.org.syn.w.v[0] = 0.126; }, d => { d.native.org.g.__rng--; },
    d => { d.input[1] = 0; }, d => { d.native.org.genome.reverse(); },
    d => { d.sets[0].values.reverse(); }, d => { d.motor.push(0); }
  ]) { const f = fixture(); rewrite(f, mutate); rejected(check(f)); }
});

test('dropping or adding fields anywhere cannot be hidden by a valid envelope', () => {
  for (const mutate of [
    d => { delete d.native.org.g; }, d => { d.native.org.newOverlay = 1; },
    d => { delete d.elapsedMs; }, d => { d.newTopField = 1; }, d => { delete d.developmentAffinity; }
  ]) { const f = fixture(); rewrite(f, mutate); rejected(check(f)); }
});

test('source carrying developmental affinity is ineligible, and source/target envelope schema is exact', () => {
  const f = fixture(); f.source = envelope({ ...f.data, developmentAffinity: [] });
  f.prepared.provenance.sourceEnvelopeChecksum = f.source.checksum;
  assert.equal(rejected(check(f)).differences[0].kind, 'source-already-has-affinity');
  for (const mutate of [f => { f.source.extra = true; }, f => { f.prepared.extra = true; },
    f => { f.prepared.envelope.schema = 'other'; }, f => { f.source.schema = 'other'; }]) {
    const next = fixture(); mutate(next); rejected(check(next));
  }
});

test('provenance must bind source, candidate, seed, profile, tick, edge count and added rows', () => {
  for (const [key, value] of [
    ['sourceEnvelopeChecksum', '00000000'], ['preparedEnvelopeChecksum', '00000000'], ['sourceDigest', 'b'.repeat(64)],
    ['seed', 2], ['nativeTick', 92], ['edges', 3], ['affinityRows', 2], ['profile', { mind: 'other' }],
    ['preservedKnownState', false], ['knownStateComparison', 'approximate'], ['checksumAlgorithm', 'sha256']
  ]) { const f = fixture(); f.prepared.provenance[key] = value; rejected(check(f)); }
});

test('a fabricated exact-continuation claim or changed recovery limitation is rejected', () => {
  for (const mutate of [
    p => { p.exactHistoricalContinuation = true; }, p => { p.developmentalAffinity = 'historically-recovered'; },
    p => { p.limitations = ['Everything was recovered exactly.']; }, p => { p.kind = 'exact-recovery'; },
    p => { p.extraExactClaim = true; }, p => { p.constructorStateChecksum = 'not-a-checksum'; }
  ]) { const f = fixture(); mutate(f.prepared.provenance); rejected(check(f)); }
});

test('affinity rows require exact bounded shape, finite range and unique projection/post pairs', () => {
  for (const mutate of [
    r => { r.push(clone(r[0])); }, r => { r[0].extra = 1; }, r => { delete r[0].start; },
    r => { r[0].projection = 26; }, r => { r[0].post = 272; }, r => { r[0].start = 271; },
    r => { r[0].values = []; }, r => { r[0].values[0] = null; }, r => { r[0].values[0] = '0.5'; },
    r => { r[0].values[0] = -0.1; }, r => { r[0].values[0] = 2.1; }
  ]) { const f = fixture(); rewrite(f, d => mutate(d.developmentAffinity)); rejected(check(f)); }
});

test('source and prepared FNV checksums are independently enforced', () => {
  for (const target of ['source', 'prepared']) {
    const f = fixture(), item = target === 'source' ? f.source : f.prepared.envelope;
    item.checksum = '00000000'; assert.equal(rejected(check(f)).differences[0].kind, 'envelope-checksum');
  }
  const f = fixture(); f.prepared.envelope.payload = f.prepared.envelope.payload.replace('0.125', '0.126');
  assert.equal(rejected(check(f)).differences[0].kind, 'envelope-checksum');
});

test('external digest binding is optional but strong when supplied', () => {
  rejected(check(fixture(), { expectedSourceDigest: 'b'.repeat(64) }));
  rejected(check(fixture(), { expectedSourceDigest: 'not-a-digest' }));
  const f = fixture(); f.prepared.envelope.sourceDigest = 'b'.repeat(64); rejected(check(f));
});

test('duplicate decoded JSON keys fail before ordinary JSON.parse can discard them', () => {
  const f = fixture(), source = JSON.stringify(f.source), prepared = JSON.stringify(f.prepared);
  const duplicate = source.replace('{', '{"schema":"other",');
  assert.equal(rejected(verifyNativeRecovery(duplicate, prepared)).differences[0].kind, 'duplicate-key');
  f.source.payload = f.source.payload.replace('"seed":1', '"seed":1,"\\u0073eed":1'); f.source.checksum = fnv(f.source.payload);
  assert.equal(rejected(check(f)).differences[0].kind, 'duplicate-key');
});

test('depth, string, whole-input and payload limits reject without native parsing or execution', () => {
  const f = fixture(), prepared = JSON.stringify(f.prepared);
  assert.equal(rejected(verifyNativeRecovery('['.repeat(50) + '0' + ']'.repeat(50), prepared)).differences[0].kind, 'depth-limit');
  assert.equal(rejected(verifyNativeRecovery(' '.repeat(32 * 1024 * 1024 + 1), prepared)).differences[0].kind, 'whole-input-limit');
  f.source.payload = 'x'.repeat(8 * 1024 * 1024 + 1);
  assert.equal(rejected(check(f)).differences[0].kind, 'string-limit');
  const longString = fixture(); rewrite(longString, d => { d.profile.mind = 'x'.repeat(4097); }); rejected(check(longString));
});

test('prototype keys, malformed syntax and numeric overflow fail closed', () => {
  const f = fixture(), prepared = JSON.stringify(f.prepared);
  for (const input of ['{"__proto__":{}}', '{"constructor":1}', '{"x":', '{"x":"\\q"}']) rejected(verifyNativeRecovery(input, prepared));
  const overflow = fixture(); overflow.source.payload = overflow.source.payload.replace('"elapsedMs":17.5', '"elapsedMs":1e400');
  overflow.source.checksum = fnv(overflow.source.payload);
  assert.equal(rejected(check(overflow)).differences[0].kind, 'nonfinite-number');
});

test('object member order may differ while values, array order and every field remain exact', () => {
  const f = fixture(); rewrite(f, d => { d.native.org.g = { __rng: d.native.org.g.__rng }; d.profile = Object.fromEntries(Object.entries(d.profile).reverse()); });
  assert.equal(check(f).ok, true);
});

test('reports contain only hashes/counts/safe difference paths, never source values or payload snippets', () => {
  const f = fixture(), secret = 'PRIVATE_VALUE_DO_NOT_PRINT'; rewrite(f, d => { d.profile.mind = secret; });
  const report = rejected(check(f)); assert.equal(JSON.stringify(report).includes(secret), false);
  assert.equal(Object.hasOwn(report, 'source'), false); assert.equal(Object.hasOwn(report, 'candidate'), false);
  const key = 'private.example/account/name'; const second = fixture(); rewrite(second, d => { d.native.org[key] = secret; });
  const text = JSON.stringify(rejected(check(second))); assert.equal(text.includes(key), false); assert.equal(text.includes(secret), false);
  assert.match(text, /key-sha256/);
  assert.equal(JSON.stringify(rejected(verifyNativeRecovery('{"secret":"' + secret + '"', '{}'))).includes(secret), false);
});
