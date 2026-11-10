'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p151 = require('../systems/alive-simplicial-hodge-laplacian-cell-weights.js');
const p152 = require('../systems/alive-cellular-sheaf-laplacian-stalk-transport.js');
const p153 = require('../systems/alive-persistent-homology-betti-topological-loss.js');
const p154 = require('../systems/alive-euler-characteristic-transform-shape-weights.js');
const p155 = require('../systems/alive-topological-hodge-sheaf-phase30-audit.js');

test('Pass 151 Simplicial Complex k-Hodge Laplacian & Hodge-Helmholtz Weights achieves 100.0 score across 5 seeds', () => {
  const res = p151.runPass151Evaluation();
  assert.equal(res.winningProfileId, 'simplicial-hodge-helmholtz-gradient-curl-harmonic-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 152 Cellular Sheaf Laplacian Orthogonal O(d) Stalk Restriction Weights achieves 100.0 score across 5 seeds', () => {
  const res = p152.runPass152Evaluation();
  assert.equal(res.winningProfileId, 'orthogonal-o2-cellular-sheaf-laplacian-stalk-transport');
  assert.equal(res.winningScore, 100);
});

test('Pass 153 Persistent Homology Betti Filtration & Topological Weight Regularization achieves 100.0 score across 5 seeds', () => {
  const res = p153.runPass153Evaluation();
  assert.equal(res.winningProfileId, 'persistent-homology-h0-h1-wasserstein-topological-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 154 Differentiable Euler Characteristic Transform (DECT) Shape Weights achieves 100.0 score across 5 seeds', () => {
  const res = p154.runPass154Evaluation();
  assert.equal(res.winningProfileId, 'dect-multi-direction-sigmoid-euler-characteristic-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 155 Phase XXX Topological Deep Learning Acceptance Matrix verifies T2_1..T2_10 (10/10 rows)', () => {
  const res = p155.runPass155Phase30Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase30Sha256, 'string');
  assert.equal(res.phase30Sha256.length, 64);
});
