'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p146 = require('../systems/alive-optnet-differentiable-qp-kkt-implicit-layer.js');
const p147 = require('../systems/alive-neural-sinkhorn-softsort-permutation-weights.js');
const p148 = require('../systems/alive-satnet-maxsat-semidefinite-relaxation-weights.js');
const p149 = require('../systems/alive-convex-icnn-input-convex-neural-weights.js');
const p150 = require('../systems/alive-differentiable-optnet-satnet-icnn-phase29-audit.js');

test('Pass 146 OptNet Differentiable QP Implicit KKT Layer achieves 100.0 score across 5 seeds', () => {
  const res = p146.runPass146Evaluation();
  assert.equal(res.winningProfileId, 'optnet-implicit-kkt-primal-dual-qp-layer');
  assert.equal(res.winningScore, 100);
});

test('Pass 147 Differentiable SoftSort & Birkhoff Sinkhorn Permutation Weights achieves 100.0 score across 5 seeds', () => {
  const res = p147.runPass147Evaluation();
  assert.equal(res.winningProfileId, 'sinkhorn-birkhoff-softsort-permutation-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 148 SATNet Differentiable MAXSAT Semidefinite Relaxation Weights achieves 100.0 score across 5 seeds', () => {
  const res = p148.runPass148Evaluation();
  assert.equal(res.winningProfileId, 'satnet-rank-k-sdp-coordinate-descent-clauses');
  assert.equal(res.winningScore, 100);
});

test('Pass 149 Input Convex Neural Network (ICNN) Non-Negative Recurrence Weights achieves 100.0 score across 5 seeds', () => {
  const res = p149.runPass149Evaluation();
  assert.equal(res.winningProfileId, 'icnn-softplus-nonnegative-wz-passthrough-wx-convex');
  assert.equal(res.winningScore, 100);
});

test('Pass 150 Phase XXIX Differentiable Optimization Acceptance Matrix verifies Q2_1..Q2_10 (10/10 rows)', () => {
  const res = p150.runPass150Phase29Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase29Sha256, 'string');
  assert.equal(res.phase29Sha256.length, 64);
});
