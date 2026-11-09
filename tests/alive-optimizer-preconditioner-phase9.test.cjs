'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const pass46 = require('../systems/alive-muon-newton-schulz-optimizer.js');
const pass47 = require('../systems/alive-kfac-natural-gradient-preconditioner.js');
const pass48 = require('../systems/alive-sophia-lion-hessian-optimizer.js');
const pass49 = require('../systems/alive-schedule-free-primal-dual-averager.js');
const pass50 = require('../systems/alive-optimizer-preconditioner-phase9-audit.js');

test('Pass 46 Muon NS5 Orthogonalized Momentum + AdamW Biases achieves 100.0 score across 5 seeds', () => {
  const r = pass46.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 47 K-FAC Tikhonov Homogeneous Natural-Gradient Preconditioner achieves 100.0 score across 5 seeds', () => {
  const r = pass47.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 48 Sophia-H Hutchinson Clipped Hessian + Lion Hybrid achieves 100.0 score across 5 seeds', () => {
  const r = pass48.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 49 Schedule-Free Primal-Dual Averager + Gradient Centralization achieves 100.0 score across 5 seeds', () => {
  const r = pass49.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 50 Phase IX Optimizer & Preconditioner Acceptance Matrix verifies O1..O10 across 5 seeds', () => {
  const r = pass50.run();
  assert.equal(r.summary.verifiedRowCount, 10);
  assert.equal(r.summary.acceptanceScorePct, 100);
  assert.equal(r.summary.phase9OptimizerFrozenDigestSha256.length, 64);
  for (const row of r.matrixRows) {
    assert.equal(row.verified, true, row.rowId);
    assert.equal(row.passedSeeds, 5);
  }
});
