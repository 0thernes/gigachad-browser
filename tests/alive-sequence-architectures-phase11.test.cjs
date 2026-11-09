'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const pass56 = require('../systems/alive-mamba2-ssd-state-space-duality.js');
const pass57 = require('../systems/alive-mla-multi-head-latent-attention.js');
const pass58 = require('../systems/alive-xlstm-exponential-matrix-memory.js');
const pass59 = require('../systems/alive-griffin-rglru-hybrid-recurrent.js');
const pass60 = require('../systems/alive-sequence-architectures-phase11-audit.js');

test('Pass 56 Mamba-2 SSD State-Space Duality achieves 100.0 score and exact recurrent-to-matrix parity across 5 seeds', () => {
  const r = pass56.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 57 Multi-Head Latent Attention (MLA) achieves 100.0 score and 93.75% KV cache reduction across 5 seeds', () => {
  const r = pass57.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 58 Extended LSTM (xLSTM) achieves 100.0 score across 5 seeds', () => {
  const r = pass58.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 59 Griffin RG-LRU + Local MQA achieves 100.0 score across 5 seeds', () => {
  const r = pass59.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 60 Phase XI Sequence Architectures Acceptance Matrix verifies A1..A10 across 5 seeds', () => {
  const r = pass60.run();
  assert.equal(r.summary.verifiedRowCount, 10);
  assert.equal(r.summary.acceptanceScorePct, 100);
  assert.equal(r.summary.phase11SequenceFrozenDigestSha256.length, 64);
  for (const row of r.matrixRows) {
    assert.equal(row.verified, true, row.rowId);
    assert.equal(row.passedSeeds, 5);
  }
});
