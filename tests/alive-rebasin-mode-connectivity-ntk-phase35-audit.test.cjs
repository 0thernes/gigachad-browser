'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p176 = require('../systems/alive-git-rebasin-hungarian-weight-permutation.js');
const p177 = require('../systems/alive-bezier-simplicial-mode-connectivity-curve.js');
const p178 = require('../systems/alive-empirical-ntk-eigenvalue-condition-governor.js');
const p179 = require('../systems/alive-tancik-fourier-feature-spectral-bias-cure.js');
const p180 = require('../systems/alive-rebasin-mode-connectivity-ntk-phase35-audit.js');

test('Pass 176 Ainsworth Git Re-Basin Permutation Symmetry Alignment achieves 100.0 score across 5 seeds', () => {
  const res = p176.runPass176Evaluation();
  assert.equal(res.winningProfileId, 'git-rebasin-exact-permutation-weight-bias-alignment');
  assert.equal(res.winningScore, 100);
});

test('Pass 177 Garipov Quadratic Bezier Curve Mode Connectivity achieves 100.0 score across 5 seeds', () => {
  const res = p177.runPass177Evaluation();
  assert.equal(res.winningProfileId, 'quadratic-bezier-simplicial-low-loss-manifold-curve');
  assert.equal(res.winningScore, 100);
});

test('Pass 178 Empirical NTK Eigenvalue Condition Number Governor achieves 100.0 score across 5 seeds', () => {
  const res = p178.runPass178Evaluation();
  assert.equal(res.winningProfileId, 'ntk-preconditioned-whitened-jacobian-condition-governor');
  assert.equal(res.winningScore, 100);
});

test('Pass 179 Tancik Fourier Feature Weights & SIREN Spectral Bias Cure achieves 100.0 score across 5 seeds', () => {
  const res = p179.runPass179Evaluation();
  assert.equal(res.winningProfileId, 'tancik-gaussian-fourier-siren-omega0-spectral-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 180 Phase XXXV Mode Connectivity & NTK Acceptance Matrix verifies W2_1..W2_10 (10/10 rows)', () => {
  const res = p180.runPass180Phase35Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase35Sha256, 'string');
  assert.equal(res.phase35Sha256.length, 64);
});
