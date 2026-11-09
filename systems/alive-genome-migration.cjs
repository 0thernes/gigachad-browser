'use strict';

// Main-startup coordinator only. It never imports into a live renderer/model.
// The adapter prepares an isolated candidate; the store owns backup, CAS,
// publication and readback. Missing historical affinity remains approximate.
const { createHash, randomUUID } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { MAX_PAYLOAD_BYTES, MAX_HEADER_BYTES } = require('./alive-genome-store.cjs');

const NATIVE_SCHEMA = 'gigachad.authentic-asmodensius.state.v1';
const RECOVERY_SCHEMA = 'gigachad.native-state-recovery.v1';
const BACKUP_FILE = 'alive-genome-v1.migration-backup.snapshot';
const MAX_NATIVE_BYTES = 8 * 1024 * 1024;
const MAX_PROVENANCE_BYTES = 16 * 1024;
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const nonnegative = value => Number.isSafeInteger(value) && !Object.is(value, -0) && value >= 0;
const plain = value => value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
const reject = message => { throw new TypeError(message); };
function checksum(text) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619) >>> 0;
  return value.toString(16).padStart(8, '0');
}
function record(value, keys) {
  if (!plain(value) || Reflect.ownKeys(value).length !== keys.length || keys.some(key => !own(value, key))) reject('Unexpected record fields');
  for (const key of keys) if (!own(Object.getOwnPropertyDescriptor(value, key), 'value')) reject('Accessor records are unsupported');
  return value;
}
function boundedData(value, budget = { nodes: 0 }, depth = 0) {
  if (++budget.nodes > 2048 || depth > 12) reject('Recovery provenance exceeds structural bounds');
  if (value === null || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') { if (value.length > 4096) reject('Recovery provenance string exceeds bound'); return value; }
  if (!value || typeof value !== 'object' || !Array.isArray(value) && !plain(value)) reject('Recovery provenance must be plain data');
  if (Array.isArray(value) && Object.getPrototypeOf(value) !== Array.prototype) reject('Custom arrays are unsupported');
  const descriptors = Object.getOwnPropertyDescriptors(value), names = Reflect.ownKeys(descriptors);
  if (names.some(key => typeof key !== 'string')) reject('Symbol metadata is unsupported');
  const result = Array.isArray(value) ? [] : {};
  if (Array.isArray(value) && (names.length !== value.length + 1 || names.some(key => key !== 'length' && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length)))) reject('Sparse or extended arrays are unsupported');
  for (const key of names) {
    if (Array.isArray(value) && key === 'length') continue;
    const entry = descriptors[key];
    if (!own(entry, 'value') || !entry.enumerable || ['__proto__', 'constructor', 'prototype'].includes(key)) reject('Unsafe recovery metadata');
    Object.defineProperty(result, key, { value: boundedData(entry.value, budget, depth + 1), enumerable: true, writable: true, configurable: true });
  }
  return result;
}

// Locate only top-level value spans after JSON.parse has checked syntax. Keeping
// their original bytes avoids changing unknown fields, negative zero, large
// numeric spellings, nested key order or whitespace during this narrow repair.
function outerSpans(json) {
  const parsed = JSON.parse(json);
  if (!plain(parsed)) reject('Genome must be a JSON object');
  const whitespace = character => character === ' ' || character === '\n' || character === '\r' || character === '\t';
  const skip = offset => { while (whitespace(json[offset])) offset++; return offset; };
  const stringEnd = start => {
    let escaped = false;
    for (let i = start + 1; i < json.length; i++) {
      if (escaped) escaped = false;
      else if (json[i] === '\\') escaped = true;
      else if (json[i] === '"') return i + 1;
    }
    reject('Unterminated JSON string');
  };
  const spans = new Map(); let offset = skip(0) + 1;
  while (true) {
    offset = skip(offset);
    if (json[offset] === '}') return { parsed, spans, closing: offset };
    const keyEnd = stringEnd(offset), key = JSON.parse(json.slice(offset, keyEnd));
    if (spans.has(key)) reject('Duplicate outer genome fields are ambiguous');
    offset = skip(keyEnd) + 1;
    const start = skip(offset); let i = start, depth = 0;
    for (; i < json.length; i++) {
      const character = json[i];
      if (character === '"') { i = stringEnd(i) - 1; continue; }
      if (character === '[' || character === '{') depth++;
      else if (character === ']' || character === '}') { if (!depth) break; depth--; }
      else if (character === ',' && !depth) break;
    }
    let end = i; while (end > start && whitespace(json[end - 1])) end--;
    spans.set(key, { start, end });
    offset = json[i] === ',' ? i + 1 : i;
  }
}
function verifyRecord(receipt) {
  if (!receipt || receipt.status !== 'ready' || receipt.writeAllowed !== true || typeof receipt.json !== 'string' ||
      !nonnegative(receipt.revision) || receipt.revision < 1 || !digest(receipt.digest) ||
      Buffer.byteLength(receipt.json, 'utf8') > MAX_PAYLOAD_BYTES || sha256(receipt.json) !== receipt.digest) reject('Invalid verified source record');
}
function envelope(value, Adapter) {
  record(value, ['schema', 'sourceDigest', 'checksum', 'payload']);
  if (value.schema !== NATIVE_SCHEMA || value.sourceDigest !== Adapter.sourceDigest || !digest(value.sourceDigest) ||
      typeof value.payload !== 'string' || Buffer.byteLength(value.payload, 'utf8') > MAX_NATIVE_BYTES ||
      typeof value.checksum !== 'string' || value.checksum !== checksum(value.payload)) reject('Unsupported or corrupt native envelope');
  const parsed = JSON.parse(value.payload);
  if (!plain(parsed)) reject('Native payload must be an object');
  return parsed;
}
function runtimeRecord(runtime) {
  const result = {};
  for (const key of ['electron', 'node', 'v8']) {
    const value = runtime?.[key];
    if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > 128 || /[\x00-\x1f\x7f]/.test(value))) reject('Invalid runtime provenance');
    result[key] = value ?? null;
  }
  return result;
}
function replacement(original, spans, preparedEnvelope, provenance) {
  const at = spans.spans.get('authenticAsmodensius'), nativeJSON = JSON.stringify(preparedEnvelope), provenanceJSON = JSON.stringify(provenance);
  if (!at || Buffer.byteLength(provenanceJSON, 'utf8') > MAX_PROVENANCE_BYTES) reject('Recovery metadata exceeds bounds');
  const json = original.slice(0, at.start) + nativeJSON + original.slice(at.end, spans.closing) +
    ',"nativeStateRecovery":' + provenanceJSON + original.slice(spans.closing);
  if (Buffer.byteLength(json, 'utf8') > MAX_PAYLOAD_BYTES) reject('Recovered genome exceeds storage bound');
  const next = outerSpans(json);
  if (next.spans.size !== spans.spans.size + 1) reject('Unexpected recovered outer field set');
  for (const [key, before] of spans.spans) {
    if (key === 'authenticAsmodensius') continue;
    const after = next.spans.get(key);
    if (!after || original.slice(before.start, before.end) !== json.slice(after.start, after.end) ||
        !isDeepStrictEqual(spans.parsed[key], next.parsed[key])) reject('Recovery changed an unrelated outer genome field');
  }
  if (!isDeepStrictEqual(next.parsed.authenticAsmodensius, preparedEnvelope) || !isDeepStrictEqual(next.parsed.nativeStateRecovery, provenance)) reject('Recovered fields failed comparison');
  return json;
}

async function migrateLegacyNative({ store, Adapter, runtime = process.versions } = {}) {
  let stage = 'read', sourceRevision = null, sourceDigest = null, backupId = null;
  const fail = async reason => {
    // Do not return raw exceptions or payloads: callers may log this receipt.
    let writesBlocked = false;
    try { const state = await store?.blockWrites?.('Native legacy migration blocked at ' + stage + ': ' + reason); writesBlocked = state?.writeAllowed === false; } catch (_) {}
    return { status: 'blocked', reason, stage, writesBlocked, sourceRevision, sourceDigest, backupId,
      canonicalPublication: stage === 'commit' || stage === 'readback' ? 'unverified' : 'not-attempted', exactHistoricalContinuation: false };
  };
  try {
    if (!store || typeof store.readVerified !== 'function' || typeof store.blockWrites !== 'function') return fail('store-contract-unavailable');
    const source = await store.readVerified();
    if (source?.status === 'absent' && source.writeAllowed === true) return { status: 'noop', reason: 'canonical-absent' };
    verifyRecord(source); sourceRevision = source.revision; sourceDigest = source.digest;
    const originalJSON = source.json;
    stage = 'inspect'; const spans = outerSpans(originalJSON), genome = spans.parsed;
    if (!own(genome, 'authenticAsmodensius') || genome.authenticAsmodensius === null) return { status: 'noop', reason: 'no-native-envelope', sourceRevision, sourceDigest };
    const Type = typeof Adapter === 'function' ? Adapter : Adapter?.AuthenticAsmodensiusAdapter;
    if (typeof Type?.prepareLegacyRecovery !== 'function') return fail('native-adapter-unavailable');
    const previousNative = envelope(genome.authenticAsmodensius, Type);
    if (own(previousNative, 'developmentAffinity')) return { status: 'noop', reason: 'native-affinity-present', sourceRevision, sourceDigest };
    if (own(genome, 'nativeStateRecovery')) return fail('legacy-recovery-provenance-already-present');
    stage = 'prepare';
    const prepared = Type.prepareLegacyRecovery(Object.freeze({ ...genome.authenticAsmodensius }));
    if (!prepared || prepared.schema !== 'gigachad.authentic-asmodensius.legacy-recovery.v1') return fail('invalid-preparation-receipt');
    const nextNative = envelope(prepared.envelope, Type), candidateEnvelope = Object.freeze({ ...prepared.envelope }), nativeProof = boundedData(prepared.provenance);
    if (!own(nextNative, 'developmentAffinity') || Object.keys(nextNative).length !== Object.keys(previousNative).length + 1 ||
        Object.keys(previousNative).some(key => !own(nextNative, key) || !isDeepStrictEqual(previousNative[key], nextNative[key])) ||
        nativeProof.preservedKnownState !== true || nativeProof.knownStateComparison !== 'exact-serialized-known-fields' ||
        nativeProof.exactHistoricalContinuation !== false || nativeProof.developmentalAffinity !== 'reinitialized-from-current-seeded-constructor' ||
        nativeProof.sourceEnvelopeChecksum !== genome.authenticAsmodensius.checksum || nativeProof.preparedEnvelopeChecksum !== candidateEnvelope.checksum ||
        nativeProof.sourceDigest !== Type.sourceDigest) return fail('native-known-state-retention-not-proven');
    const runtimeProof = runtimeRecord(runtime);
    if (typeof store.beginOwner !== 'function' || typeof store.backupMigration !== 'function' || typeof store.commit !== 'function') return fail('migration-store-contract-unavailable');
    stage = 'owner'; const ownerId = randomUUID(), owned = await store.beginOwner(ownerId);
    verifyRecord(owned);
    if (owned.ownerId !== ownerId || owned.epoch !== 0 || owned.revision !== sourceRevision || owned.digest !== sourceDigest || owned.json !== originalJSON) return fail('source-changed-before-backup');
    stage = 'backup'; const requestId = randomUUID();
    const backup = await store.backupMigration({ ownerId, epoch: 0, requestId, expectedRevision: sourceRevision, expectedDigest: sourceDigest });
    if (!backup || backup.status !== 'backup-verified' || backup.backupVerified !== true || backup.ownerId !== ownerId || backup.epoch !== 0 || backup.requestId !== requestId ||
        backup.sourceRevision !== sourceRevision || backup.sourceDigest !== sourceDigest || !digest(backup.sourceFileDigest) ||
        typeof backup.backupId !== 'string' || !backup.backupId.length || backup.backupId.length > 128 || backup.backupFile !== BACKUP_FILE ||
        !nonnegative(backup.backupByteLength) || backup.backupByteLength < 1 || backup.backupByteLength > MAX_PAYLOAD_BYTES + MAX_HEADER_BYTES + 1 ||
        typeof backup.verifiedAt !== 'string' || !Number.isFinite(Date.parse(backup.verifiedAt)) || new Date(backup.verifiedAt).toISOString() !== backup.verifiedAt) return fail('backup-not-verified');
    backupId = backup.backupId;
    stage = 'candidate';
    const provenance = { schema: RECOVERY_SCHEMA, kind: 'legacy-missing-development-affinity-recovery', recoveredAt: new Date().toISOString(),
      source: { revision: sourceRevision, sha256: sourceDigest }, runtime: runtimeProof,
      backup: { backupId, file: backup.backupFile, byteLength: backup.backupByteLength, sourceFileSha256: backup.sourceFileDigest, verifiedAt: backup.verifiedAt },
      provenance: nativeProof, preservedKnownState: true, exactHistoricalContinuation: false };
    const json = replacement(originalJSON, spans, candidateEnvelope, provenance), expectedDigest = sha256(json);
    stage = 'commit';
    const committed = await store.commit({ ownerId, epoch: 0, jobId: 1, json, migration: { backupId, expectedRevision: sourceRevision, expectedDigest: sourceDigest } });
    if (!committed || committed.status !== 'persisted' || committed.persistenceVerified !== true || committed.ownerId !== ownerId || committed.epoch !== 0 || committed.jobId !== 1 ||
        committed.revision !== sourceRevision + 1 || committed.digest !== expectedDigest) return fail('migration-commit-not-verified');
    stage = 'readback'; const actual = await store.readVerified(); verifyRecord(actual);
    if (actual.revision !== committed.revision || actual.digest !== expectedDigest || actual.json !== json) return fail('migration-readback-mismatch');
    return { status: 'migrated', persistenceVerified: true, sourceRevision, sourceDigest, revision: actual.revision, digest: actual.digest,
      backupId, backupVerified: true, preservedKnownState: true, exactHistoricalContinuation: false,
      developmentalAffinity: 'reinitialized-from-current-seeded-constructor' };
  } catch (_) { return fail('migration-' + stage + '-failed'); }
}

module.exports = { migrateLegacyNative, NATIVE_SCHEMA, RECOVERY_SCHEMA, BACKUP_FILE, MAX_PROVENANCE_BYTES };
