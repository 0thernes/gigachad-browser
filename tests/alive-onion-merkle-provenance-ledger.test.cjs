'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const merkleLedger = require('../systems/alive-onion-merkle-provenance-ledger.js');

test('Pass 24: buildMerkleTree, generateMerkleProof & verifyMerkleInclusionProof validate valid leaves and reject tampered leaves', () => {
  const payloads = ['doc-0', 'doc-1', 'doc-2', 'doc-3', 'doc-4', 'doc-5', 'doc-6', 'doc-7'];
  const tree = merkleLedger.buildMerkleTree(payloads);
  for (let i = 0; i < payloads.length; i++) {
    const leafHex = merkleLedger.computeLeafDigest(payloads[i]);
    const proof = merkleLedger.generateMerkleProof(tree, i);
    assert.equal(merkleLedger.verifyMerkleInclusionProof(leafHex, proof, tree.rootHex), true);
    const tamperedHex = merkleLedger.computeLeafDigest(payloads[i] + '-tampered');
    assert.equal(merkleLedger.verifyMerkleInclusionProof(tamperedHex, proof, tree.rootHex), false);
  }
});

test('Pass 24: runFiveSeedOnionMerkleLedgerBenchmark verifies 100.0 composite score and 0 corrupted accepted on all 5 seeds', () => {
  const report = merkleLedger.runFiveSeedOnionMerkleLedgerBenchmark();
  assert.equal(report.pass, 24);
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'signed-merkle-dag-bft-provenance-ledger');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.fullLedgerCompositeScoreMean, 100);
  assert.equal(report.summary.offlineOnionReplaySurvivalPctMean, 100);
  assert.equal(report.summary.tamperedContentRejectionPctMean, 100);
  assert.equal(report.summary.equivocationFraudDetectionPctMean, 100);
  assert.equal(report.summary.merkleProofVerificationPctMean, 100);
  assert.ok(report.summary.gainVsMutableUrlBookmark > 90);
  assert.ok(report.summary.gainVsUnverifiedSnapshot > 70);
  assert.ok(report.summary.gainVsSingleVantageChain >= 15);
});
