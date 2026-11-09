'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const onionPow = require('../systems/alive-onion-pow-client-auth.js');

test('Pass 22: deriveX25519DescriptorKeys produces deterministic non-zero ECDH/HKDF keys', () => {
  const keysA = onionPow.deriveX25519DescriptorKeys('deadbeef', 'cafebabe', '01234567');
  const keysB = onionPow.deriveX25519DescriptorKeys('deadbeef', 'cafebabe', '01234567');
  const keysC = onionPow.deriveX25519DescriptorKeys('deadbeef', 'cafebabf', '01234567');
  assert.deepEqual(keysA, keysB);
  assert.notEqual(keysA.sharedSecretHex, keysC.sharedSecretHex);
  assert.equal(keysA.kEncHex.length, 8);
  assert.equal(keysA.kMacHex.length, 8);
});

test('Pass 22: solveEquiXChallenge & verifyEquiXSolution satisfy Proposal 327 XOR collision and effort target', () => {
  const sol16 = onionPow.solveEquiXChallenge('0123456789abcdef0123456789abcdef', 16);
  const sol48 = onionPow.solveEquiXChallenge('0123456789abcdef0123456789abcdef', 48);
  assert.equal(sol16.solved, true);
  assert.equal(onionPow.verifyEquiXSolution('0123456789abcdef0123456789abcdef', sol16), true);
  assert.equal(sol48.solved, true);
  assert.equal(onionPow.verifyEquiXSolution('0123456789abcdef0123456789abcdef', sol48), true);
  assert.ok(sol48.effort > sol16.effort);

  // Tampering with index pair invalidates solution
  const badSol = Object.assign({}, sol16, { idxA: sol16.idxB });
  assert.equal(onionPow.verifyEquiXSolution('0123456789abcdef0123456789abcdef', badSol), false);
});

test('Pass 22: runFiveSeedOnionPowClientAuthBenchmark verifies 100.0 composite score on all 5 seeds', () => {
  const report = onionPow.runFiveSeedOnionPowClientAuthBenchmark();
  assert.equal(report.pass, 22);
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'full-equix-pow-x25519-client-auth');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.fullPowAuthScoreMean, 100);
  assert.equal(report.summary.legitimateRendezvousRatePctMean, 100);
  assert.equal(report.summary.privateAuthDecryptionRatePctMean, 100);
  assert.equal(report.summary.ddosQueueAdmissionRatePctMean, 100);
  assert.equal(report.summary.tamperedDescriptorRejectionRatePctMean, 100);
  assert.ok(report.summary.gainVsUnauthenticatedNoPow > 50);
  assert.ok(report.summary.gainVsClientAuthOnlyNoPow > 30);
  assert.ok(report.summary.gainVsStaticLowPowNoMac > 30);
});
