'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p111 = require('../systems/alive-tensor-train-mps-matrix-product-weights.js');
const p112 = require('../systems/alive-tucker-cp-higher-order-weight-tensor.js');
const p113 = require('../systems/alive-mera-multiscale-entanglement-renormalization.js');
const p114 = require('../systems/alive-monarch-butterfly-fft-structured-weights.js');
const p115 = require('../systems/alive-tensor-network-monarch-phase22-audit.js');

test('Pass 111 Tensor-Train (TT / MPS) Factored Weight Cores achieves 100.0 score across 5 seeds', () => {
  const res = p111.runPass111Evaluation();
  assert.equal(res.winningProfileId, 'left-canonical-stiefel-tt-mps-rank4-cores');
  assert.equal(res.winningScore, 100);
});

test('Pass 112 HOOI Orthogonal Tucker Core & Mode-Factor Weights achieves 100.0 score across 5 seeds', () => {
  const res = p112.runPass112Evaluation();
  assert.equal(res.winningProfileId, 'hooi-orthogonal-tucker-mode-factor-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 113 MERA Unitary Disentanglers & Isometric Tensors achieves 100.0 score across 5 seeds', () => {
  const res = p113.runPass113Evaluation();
  assert.equal(res.winningProfileId, 'unitary-disentangler-isometric-mera-hierarchy');
  assert.equal(res.winningScore, 100);
});

test('Pass 114 Monarch Block-Diagonal Permutation Weights achieves 100.0 score across 5 seeds', () => {
  const res = p114.runPass114Evaluation();
  assert.equal(res.winningProfileId, 'monarch-orthogonal-block-permutation-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 115 Phase XXII Tensor Network & Monarch Acceptance Matrix verifies R1..R10 (10/10 rows)', () => {
  const res = p115.runPass115Phase22Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase22Sha256, 'string');
  assert.equal(res.phase22Sha256.length, 64);
});
