'use strict';

// Independent verification decoder. Do not import the production store/codec:
// agreement with the same decoder would not establish this record's integrity.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const SCHEMA = 'gigachad.genome-store.v1';
const MAX_HEADER_BYTES = 2048; // UTF-8 bytes before the first LF, excluding LF.
const MAX_PAYLOAD_BYTES = 32 * 1024 * 1024;
const MAX_RECORD_BYTES = MAX_HEADER_BYTES + 1 + MAX_PAYLOAD_BYTES;

class DurableEvidenceError extends Error {
  constructor(code, message) { super(message); this.name = 'DurableEvidenceError'; this.code = code; }
}
const reject = (code, message) => { throw new DurableEvidenceError(code, message); };
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function decodeUTF8(bytes, label) {
  try {
    // Preserve a BOM as a character: JSON.parse should reject it rather than
    // silently dropping bytes that are part of the authoritative record.
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch (_) { reject('INVALID_UTF8', `${label} is not valid UTF-8`); }
}
function parseJSON(text, label) {
  try { return JSON.parse(text); }
  catch (_) { reject('INVALID_JSON', `${label} is not one complete valid JSON value`); }
}

function parseRecord(input, options = {}) {
  if (!Buffer.isBuffer(input) && !(input instanceof Uint8Array)) reject('INVALID_INPUT', 'Record input must contain raw bytes');
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  if (bytes.length > MAX_RECORD_BYTES) reject('RECORD_TOO_LARGE', 'Record exceeds the fixed header plus payload bounds');
  const newline = bytes.indexOf(0x0a);
  if (newline < 0) reject('MISSING_HEADER_SEPARATOR', 'Record has no header LF separator');
  if (newline === 0 || newline > MAX_HEADER_BYTES) reject('HEADER_SIZE', 'Header must contain 1..2048 UTF-8 bytes before LF');
  const rawHeader = bytes.subarray(0, newline), rawPayload = bytes.subarray(newline + 1);
  if (rawPayload.length === 0 || rawPayload.length > MAX_PAYLOAD_BYTES) reject('PAYLOAD_SIZE', 'Payload must contain 1..33554432 UTF-8 bytes');
  const headerJSON = decodeUTF8(rawHeader, 'Header');
  const header = parseJSON(headerJSON, 'Header');
  if (!header || typeof header !== 'object' || Array.isArray(header)) reject('HEADER_SHAPE', 'Header must be a JSON object');
  if (header.schema !== SCHEMA) reject('SCHEMA', 'Unexpected durable genome schema');
  if (!Number.isSafeInteger(header.revision) || header.revision < 1) reject('REVISION', 'Committed revision must be a positive safe integer');
  if (!Number.isSafeInteger(header.byteLength) || header.byteLength < 1 || header.byteLength > MAX_PAYLOAD_BYTES || header.byteLength !== rawPayload.length) {
    reject('BYTE_LENGTH', 'Declared payload byteLength differs from the complete raw UTF-8 payload');
  }
  if (typeof header.sha256 !== 'string' || !/^[0-9a-fA-F]{64}$/.test(header.sha256)) reject('HASH_FORMAT', 'Header sha256 must be 64 hexadecimal digits');
  const payloadSha256 = hash(rawPayload);
  if (payloadSha256 !== header.sha256.toLowerCase()) reject('HASH_MISMATCH', 'Payload SHA-256 differs from the independently computed hash');
  if (typeof header.savedAt !== 'string' || !header.savedAt || !Number.isFinite(Date.parse(header.savedAt))) {
    reject('SAVED_AT', 'Header savedAt must be a parseable finite date string');
  }
  const payloadJSON = decodeUTF8(rawPayload, 'Payload');
  const payload = parseJSON(payloadJSON, 'Payload');
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) reject('PAYLOAD_SHAPE', 'Genome payload must be a JSON object');
  if (options.expectedRevision !== undefined && header.revision !== options.expectedRevision) reject('EXPECTED_REVISION', 'Revision differs from the independently expected commit');
  if (options.expectedJSON !== undefined) {
    if (typeof options.expectedJSON !== 'string') reject('EXPECTED_INPUT', 'expectedJSON must be the exact submitted string');
    const expectedBytes = Buffer.from(options.expectedJSON, 'utf8');
    if (payloadJSON !== options.expectedJSON || !rawPayload.equals(expectedBytes)) reject('EXPECTED_BYTES', 'Stored payload differs byte-for-byte from submitted JSON');
  }
  return { header, headerJSON, payload, payloadJSON,
    evidence: { schema: SCHEMA, headerBytes: rawHeader.length, payloadBytes: rawPayload.length,
      payloadCodeUnits: payloadJSON.length, recordBytes: bytes.length, revision: header.revision,
      payloadSha256, recordSha256: hash(bytes), expectedBytesMatched: options.expectedJSON === undefined ? null : true,
      scope: 'Independent raw-record integrity and optional submitted-byte comparison; no model restoration or physical-media durability claim' } };
}

function readRecord(filename, options = {}) {
  const absolutePath = path.resolve(filename), stat = fs.statSync(absolutePath);
  if (!stat.isFile()) reject('NOT_FILE', 'Durable record path must refer to a regular file');
  if (stat.size > MAX_RECORD_BYTES) reject('RECORD_TOO_LARGE', 'File exceeds the fixed record size bound');
  // parseRecord rechecks the bytes in case the file changed after stat.
  const bytes = fs.readFileSync(absolutePath);
  const result = parseRecord(bytes, options);
  return { ...result, evidence: { ...result.evidence, path: absolutePath, statSizeBeforeRead: stat.size } };
}

module.exports = { parseRecord, readRecord, DurableEvidenceError, SCHEMA,
  MAX_HEADER_BYTES, MAX_PAYLOAD_BYTES, MAX_RECORD_BYTES };
