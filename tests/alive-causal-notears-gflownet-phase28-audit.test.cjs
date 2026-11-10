'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p141 = require('../systems/alive-notears-dagma-acyclic-causal-weight-learner.js');
const p142 = require('../systems/alive-irm-vrex-invariant-causal-predictor-weights.js');
const p143 = require('../systems/alive-gflownet-trajectory-balance-flow-weights.js');
const p144 = require('../systems/alive-independent-causal-mechanisms-sparse-modular.js');
const p145 = require('../systems/alive-causal-notears-gflownet-phase28-audit.js');

test('Pass 141 NOTEARS / DAGMA Continuous Acyclicity Causal Weight Learner achieves 100.0 score across 5 seeds', () => {
  const res = p141.runPass141Evaluation();
  assert.equal(res.winningProfileId, 'dagma-logdet-mmatrix-augmented-lagrangian-dag');
  assert.equal(res.winningScore, 100);
});

test('Pass 142 IRM & V-REx Out-of-Distribution Invariant Causal Predictor Weights achieves 100.0 score across 5 seeds', () => {
  const res = p142.runPass142Evaluation();
  assert.equal(res.winningProfileId, 'irm-vrex-joint-invariant-causal-predictor-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 143 GFlowNet Trajectory Balance Weights & Log-Partition Bias achieves 100.0 score across 5 seeds', () => {
  const res = p143.runPass143Evaluation();
  assert.equal(res.winningProfileId, 'gflownet-trajectory-balance-logz-bias-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 144 Independent Causal Mechanisms (ICM) Sparse Modular Weight Routing achieves 100.0 score across 5 seeds', () => {
  const res = p144.runPass144Evaluation();
  assert.equal(res.winningProfileId, 'icm-sparse-intervention-isolated-modular-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 145 Phase XXVIII Causal Representation Acceptance Matrix verifies I1..I10 (10/10 rows)', () => {
  const res = p145.runPass145Phase28Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase28Sha256, 'string');
  assert.equal(res.phase28Sha256.length, 64);
});
