'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { sha3_256 } = require('../systems/sha3-256.cjs');
const hex = bytes => Buffer.from(sha3_256(bytes)).toString('hex');

// Fixed SHA3-256 vectors, including the NIST 1600-bit message example:
// https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/SHA3-256_1600.pdf
// These assertions do not depend on native SHA3 availability.
test('FIPS 202 SHA3-256 empty, abc, and 1600-bit message vectors', () => {
  assert.equal(hex(Buffer.alloc(0)), 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a');
  assert.equal(hex(Buffer.from('abc')), '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532');
  assert.equal(hex(Buffer.alloc(200, 0xa3)), '79f38adec5c20307a98ef76e8324afbfd46cfd81b22e3973c65fa1bd9de31787');
});

test('SHA3 domain separator is not legacy Keccak-256', () => {
  assert.notEqual(hex(Buffer.alloc(0)), 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
  assert.notEqual(hex(Buffer.from('abc')), '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45');
});

test('independent native SHA3 oracle covers onion-size, padding boundaries, and multiblock inputs', () => {
  assert.ok(crypto.getHashes().includes('sha3-256'), 'Run oracle comparison using the development Node runtime with SHA3 support');
  const lengths = [0, 1, 2, 7, 8, 31, 32, 47, 48, 63, 64, 134, 135, 136, 137, 138, 200, 270, 271, 272, 273, 274, 4096];
  for (const length of lengths) {
    const message = Buffer.from(Array.from({ length }, (_, index) => (index * 73 + length * 11) & 255));
    assert.equal(hex(message), crypto.createHash('sha3-256').update(message).digest('hex'), `bytes=${length}`);
  }
  for (let iteration = 0; iteration < 32; iteration++) {
    const message = crypto.randomBytes(crypto.randomInt(0, 2049));
    assert.equal(hex(message), crypto.createHash('sha3-256').update(message).digest('hex'), `random bytes=${message.length}`);
  }
});

test('byte-offset views hash only their logical contents and never mutate input', () => {
  const bytes = Buffer.from('prefixabcpostfix');
  const original = Buffer.from(bytes);
  const view = bytes.subarray(6, 9);
  const typed = new Uint8Array(bytes.buffer, bytes.byteOffset + 6, 3);
  const expected = '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532';
  assert.equal(hex(view), expected);
  assert.equal(hex(typed), expected);
  assert.deepEqual(bytes, original);
  const first = sha3_256(view); first.fill(0);
  assert.equal(hex(view), expected, 'digest mutation cannot corrupt another call');
});

test('byte-only contract rejects implicit text or numeric reinterpretation', () => {
  for (const input of ['abc', [1, 2, 3], new Uint16Array([1, 2]), new ArrayBuffer(3), null]) {
    assert.throws(() => sha3_256(input), TypeError);
  }
});
