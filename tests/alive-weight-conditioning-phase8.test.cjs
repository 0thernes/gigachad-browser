'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const pass41 = require('../systems/alive-stiefel-orthogonal-weight-bias-init.js');
const pass42 = require('../systems/alive-spectral-norm-lipschitz-conditioner.js');
const pass43 = require('../systems/alive-mup-maximal-update-parameterization.js');
const pass44 = require('../systems/alive-rmsnorm-rezero-residual-conditioning.js');
const pass45 = require('../systems/alive-weight-conditioning-phase8-audit.js');

test('Pass 41 Stiefel QR Orthogonal Weight & Chrono/Gate Bias Init achieves 100.0 score across 5 seeds', () => {
  const r = pass41.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
  assert.ok(r.summary.gainVsBaseline >= 75);
});

test('Pass 42 Power-Iteration Spectral Norm & 1-Lipschitz Conditioner achieves 100.0 score across 5 seeds', () => {
  const r = pass42.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 43 Maximal Update Parameterization (muP) achieves 100.0 zero-shot width transfer across 5 seeds', () => {
  const r = pass43.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 44 Pre-RMSNorm + QK-Norm + ReZero Residual Conditioning achieves 100.0 score across 5 seeds', () => {
  const r = pass44.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 45 Phase VIII Weight Conditioning Acceptance Matrix verifies W1..W10 across 5 seeds', () => {
  const r = pass45.run();
  assert.equal(r.summary.verifiedRowCount, 10);
  assert.equal(r.summary.acceptanceScorePct, 100);
  assert.equal(r.summary.phase8WeightConditioningFrozenDigestSha256.length, 64);
  for (const row of r.matrixRows) {
    assert.equal(row.verified, true, row.rowId);
    assert.equal(row.passedSeeds, 5);
  }
});
