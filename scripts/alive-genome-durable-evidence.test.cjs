'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const evidence = require('./alive-genome-durable-evidence.cjs');

const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function record(payloadJSON = '{"simulationTick":123,"W_actor":[0.12345,-0.5]}', changes = {}, headerSuffix = '') {
  const payload = Buffer.isBuffer(payloadJSON) ? payloadJSON : Buffer.from(payloadJSON, 'utf8');
  const header = { schema: 'gigachad.genome-store.v1', revision: 7,
    byteLength: payload.length, sha256: digest(payload), savedAt: '2026-11-09T01:02:03.456Z', ...changes };
  return Buffer.concat([Buffer.from(JSON.stringify(header) + headerSuffix + '\n', 'utf8'), payload]);
}
function rejects(bytes, code, options) {
  assert.throws(() => evidence.parseRecord(bytes, options), error => error instanceof evidence.DurableEvidenceError && error.code === code);
}

test('independently validates exact bytes and Unicode byte counts, revision and full-record digest', () => {
  const json = '{"label":"é🌌","literal":"\\u0000","W_actor":[0.12345]}';
  const bytes = record(json), parsed = evidence.parseRecord(bytes, { expectedJSON: json, expectedRevision: 7 });
  assert.equal(parsed.payloadJSON, json);
  assert.equal(parsed.evidence.payloadBytes, Buffer.byteLength(json, 'utf8'));
  assert.notEqual(parsed.evidence.payloadBytes, json.length);
  assert.equal(parsed.evidence.payloadSha256, digest(Buffer.from(json)));
  assert.equal(parsed.evidence.recordSha256, digest(bytes));
  assert.equal(parsed.evidence.expectedBytesMatched, true);
  assert.equal(evidence.parseRecord(new Uint8Array(bytes)).evidence.expectedBytesMatched, null);
});

test('valid parsed objects do not hide byte differences in the expected serialization', () => {
  rejects(record('{"a":1}'), 'EXPECTED_BYTES', { expectedJSON: '{ "a": 1 }' });
  rejects(record('{"a":"é"}'), 'EXPECTED_BYTES', { expectedJSON: '{"a":"\\u00e9"}' });
  rejects(record(), 'EXPECTED_REVISION', { expectedRevision: 8 });
  rejects(record(), 'EXPECTED_INPUT', { expectedJSON: {} });
});

test('header bound is UTF-8 bytes excluding LF and accepts exactly the declared boundary', () => {
  const base = record('{}'), split = base.indexOf(10), padding = evidence.MAX_HEADER_BYTES - split;
  const exact = Buffer.concat([base.subarray(0, split), Buffer.alloc(padding, 32), base.subarray(split)]);
  assert.equal(evidence.parseRecord(exact).evidence.headerBytes, 2048);
  const tooLarge = Buffer.concat([exact.subarray(0, 2048), Buffer.from(' '), exact.subarray(2048)]);
  rejects(tooLarge, 'HEADER_SIZE');
  const unicodeHeader = record('{}', { note: 'é'.repeat(1000) });
  rejects(unicodeHeader, 'HEADER_SIZE');
  rejects(Buffer.from('\n{}'), 'HEADER_SIZE');
  rejects(Buffer.from('{}'), 'MISSING_HEADER_SEPARATOR');
});

test('malformed UTF-8 is rejected independently of matching raw-byte hashes', () => {
  rejects(Buffer.concat([Buffer.from([0xc0, 0xaf]), Buffer.from('\n{}')]), 'INVALID_UTF8');
  rejects(record(Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc0, 0xaf, 0x22, 0x7d])), 'INVALID_UTF8');
  rejects(record(Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xf0, 0x9f])), 'INVALID_UTF8');
  rejects(record(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('{}')])), 'INVALID_JSON');
});

test('payload size and exact byteLength reject truncation, code-unit lengths and oversize', () => {
  const json = '{"x":"é"}';
  rejects(record(json, { byteLength: json.length }), 'BYTE_LENGTH');
  rejects(record('{}', { byteLength: 3 }), 'BYTE_LENGTH');
  rejects(record('{}', { byteLength: '2' }), 'BYTE_LENGTH');
  const truncated = record('{"tick":1}').subarray(0, -1);
  rejects(truncated, 'BYTE_LENGTH');
  rejects(record(''), 'PAYLOAD_SIZE');
  const oversize = Buffer.alloc(evidence.MAX_PAYLOAD_BYTES + 1, 32);
  rejects(record(oversize), 'PAYLOAD_SIZE');
  rejects(Buffer.alloc(evidence.MAX_RECORD_BYTES + 1), 'RECORD_TOO_LARGE');
});

test('schema, header shape and positive safe committed revisions are enforced', () => {
  rejects(record('{}', { schema: 'gigachad.genome-store.v2' }), 'SCHEMA');
  for (const revision of [0, -1, 1.5, '7', null, Number.MAX_SAFE_INTEGER + 1]) rejects(record('{}', { revision }), 'REVISION');
  rejects(Buffer.from('[]\n{}'), 'HEADER_SHAPE');
  rejects(Buffer.from('null\n{}'), 'HEADER_SHAPE');
  rejects(Buffer.from('{broken}\n{}'), 'INVALID_JSON');
});

test('malformed and incorrect SHA-256 cannot be reported as valid', () => {
  rejects(record('{}', { sha256: 'not-a-hash' }), 'HASH_FORMAT');
  rejects(record('{}', { sha256: '0'.repeat(64) }), 'HASH_MISMATCH');
  const original = record('{"tick":1}'), changed = Buffer.from(original);
  changed[changed.length - 2] = 0x32;
  rejects(changed, 'HASH_MISMATCH');
});

test('invalid, trailing or non-object payload JSON fails even when its digest matches', () => {
  for (const json of ['{broken}', '{}{}', '{} trailing', '{"n":NaN}', '{"n":1,}']) rejects(record(json), 'INVALID_JSON');
  for (const json of ['null', '[]', '1', 'true', '"genome"']) rejects(record(json), 'PAYLOAD_SHAPE');
  assert.equal(evidence.parseRecord(record('{}\n')).payloadJSON, '{}\n');
});

test('savedAt is a finite parseable string without inventing an ISO-normalization requirement', () => {
  for (const savedAt of ['', 'not-a-date', 123, null]) rejects(record('{}', { savedAt }), 'SAVED_AT');
  assert.equal(evidence.parseRecord(record('{}', { savedAt: '2026-11-09T01:02:03Z' })).header.savedAt, '2026-11-09T01:02:03Z');
});

test('file reader uses real complete bytes and preserves input without relying on a store decoder', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gigachad-durable-evidence-'));
  const filename = path.join(directory, 'owned.snapshot'), bytes = record();
  try {
    fs.writeFileSync(filename, bytes);
    const parsed = evidence.readRecord(filename);
    assert.equal(parsed.evidence.recordSha256, digest(bytes));
    assert.equal(parsed.evidence.path, filename);
    assert.deepEqual(fs.readFileSync(filename), bytes);
    assert.throws(() => evidence.readRecord(directory), error => error.code === 'NOT_FILE');
  } finally { fs.unlinkSync(filename); fs.rmdirSync(directory); }
});
