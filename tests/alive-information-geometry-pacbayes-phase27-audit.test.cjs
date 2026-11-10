'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p136 = require('../systems/alive-amari-empirical-fisher-rao-metric-weights.js');
const p137 = require('../systems/alive-wasserstein-natural-gradient-sinkhorn-score.js');
const p138 = require('../systems/alive-bregman-mirror-descent-hyperspherical-weights.js');
const p139 = require('../systems/alive-pac-bayes-kl-weight-posterior-bound-minimizer.js');
const p140 = require('../systems/alive-information-geometry-pacbayes-phase27-audit.js');

test('Pass 136 Amari Fisher-Rao Metric Tensor & Woodbury Natural Gradient achieves 100.0 score across 5 seeds', () => {
  const res = p136.runPass136Evaluation();
  assert.equal(res.winningProfileId, 'amari-fisher-rao-woodbury-natural-gradient-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 137 Wasserstein Information Matrix & Entropic Sinkhorn Transport achieves 100.0 score across 5 seeds', () => {
  const res = p137.runPass137Evaluation();
  assert.equal(res.winningProfileId, 'wasserstein-sinkhorn-entropic-natural-gradient');
  assert.equal(res.winningScore, 100);
});

test('Pass 138 Bregman Mirror Descent & Hyperspherical Geodesic Retraction achieves 100.0 score across 5 seeds', () => {
  const res = p138.runPass138Evaluation();
  assert.equal(res.winningProfileId, 'bregman-entropic-mirror-hyperspherical-geodesic');
  assert.equal(res.winningScore, 100);
});

test('Pass 139 PAC-Bayes KL Weight Posterior Generalization Bound Minimizer achieves 100.0 score across 5 seeds', () => {
  const res = p139.runPass139Evaluation();
  assert.equal(res.winningProfileId, 'pac-bayes-kl-posterior-variance-bound-minimizer');
  assert.equal(res.winningScore, 100);
});

test('Pass 140 Phase XXVII Information Geometry & PAC-Bayes Acceptance Matrix verifies Z1..Z10 (10/10 rows)', () => {
  const res = p140.runPass140Phase27Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase27Sha256, 'string');
  assert.equal(res.phase27Sha256.length, 64);
});
