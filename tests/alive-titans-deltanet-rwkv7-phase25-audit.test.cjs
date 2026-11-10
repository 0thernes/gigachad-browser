'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p126 = require('../systems/alive-titans-neural-long-term-surprise-memory.js');
const p127 = require('../systems/alive-deltanet-householder-rank1-fast-weights.js');
const p128 = require('../systems/alive-rwkv7-goose-dynamic-state-evolution-weights.js');
const p129 = require('../systems/alive-gsa-gated-slot-attention-abc-memory.js');
const p130 = require('../systems/alive-titans-deltanet-rwkv7-phase25-audit.js');

test('Pass 126 Google Titans Neural Long-Term Surprise Memory achieves 100.0 score across 5 seeds', () => {
  const res = p126.runPass126Evaluation();
  assert.equal(res.winningProfileId, 'titans-momentum-surprise-persistent-bias-memory');
  assert.equal(res.winningScore, 100);
});

test('Pass 127 Gated DeltaNet Householder Rank-1 Fast Weights achieves 100.0 score across 5 seeds', () => {
  const res = p127.runPass127Evaluation();
  assert.equal(res.winningProfileId, 'gated-deltanet-householder-rank1-fast-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 128 RWKV-7 Goose Generalized Dynamic State Evolution Weights achieves 100.0 score across 5 seeds', () => {
  const res = p128.runPass128Evaluation();
  assert.equal(res.winningProfileId, 'rwkv7-goose-generalized-state-evolution-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 129 Gated Slot Attention (GSA) Bounded-Slot KV Memory achieves 100.0 score across 5 seeds', () => {
  const res = p129.runPass129Evaluation();
  assert.equal(res.winningProfileId, 'gsa-chrono-forget-bias-two-pass-slot-memory');
  assert.equal(res.winningScore, 100);
});

test('Pass 130 Phase XXV Titans, DeltaNet & RWKV-7 Acceptance Matrix verifies J1..J10 (10/10 rows)', () => {
  const res = p130.runPass130Phase25Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase25Sha256, 'string');
  assert.equal(res.phase25Sha256.length, 64);
});
