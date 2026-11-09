'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const pass66 = require('../systems/alive-deepseek-moe-dynamic-bias-router.js');
const pass67 = require('../systems/alive-sinkhorn-expert-choice-soft-moe.js');
const pass68 = require('../systems/alive-mixture-of-depths-compute-router.js');
const pass69 = require('../systems/alive-sparsegpt-hessian-pruning-2to4.js');
const pass70 = require('../systems/alive-moe-sparse-routing-phase13-audit.js');

test('Pass 66 DeepSeekMoE Aux-Loss-Free Dynamic Bias Router achieves 100.0 score across 5 seeds', () => {
  const r = pass66.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 67 Causal Sinkhorn-Knopp Doubly-Stochastic Soft-MoE achieves 100.0 score across 5 seeds', () => {
  const r = pass67.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 68 Mixture-of-Depths (MoD) Causal Threshold Bias Router achieves 100.0 score across 5 seeds', () => {
  const r = pass68.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 69 SparseGPT Cholesky Inverse-Hessian 2:4 Pruning achieves 100.0 score across 5 seeds', () => {
  const r = pass69.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 70 Phase XIII MoE & Sparse Routing Acceptance Matrix verifies X1..X10 across 5 seeds', () => {
  const r = pass70.run();
  assert.equal(r.summary.verifiedRowCount, 10);
  assert.equal(r.summary.acceptanceScorePct, 100);
  assert.equal(r.summary.phase13MoeSparseFrozenDigestSha256.length, 64);
  for (const row of r.matrixRows) {
    assert.equal(row.verified, true, row.rowId);
    assert.equal(row.passedSeeds, 5);
  }
});
