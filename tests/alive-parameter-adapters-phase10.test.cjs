'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const pass51 = require('../systems/alive-dora-weight-decomposed-adapter.js');
const pass52 = require('../systems/alive-pissa-svd-lora-plus-adapter.js');
const pass53 = require('../systems/alive-vera-random-matrix-bitfit-bias.js');
const pass54 = require('../systems/alive-ties-dare-slerp-model-merger.js');
const pass55 = require('../systems/alive-parameter-adapters-phase10-audit.js');

test('Pass 51 DoRA Weight-Decomposed Low-Rank Adapter achieves 100.0 score across 5 seeds', () => {
  const r = pass51.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 52 PiSSA Top-r SVD + Asymmetric LoRA+ achieves 100.0 score across 5 seeds', () => {
  const r = pass52.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 53 VeRA Shared Random Basis + BitFit Bias Specialization achieves 100.0 score across 5 seeds', () => {
  const r = pass53.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 54 DARE + TIES + SLERP Geodesic Model Merger achieves 100.0 score across 5 seeds', () => {
  const r = pass54.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 55 Phase X Parameter Adapters Acceptance Matrix verifies P1..P10 across 5 seeds', () => {
  const r = pass55.run();
  assert.equal(r.summary.verifiedRowCount, 10);
  assert.equal(r.summary.acceptanceScorePct, 100);
  assert.equal(r.summary.phase10AdaptersFrozenDigestSha256.length, 64);
  for (const row of r.matrixRows) {
    assert.equal(row.verified, true, row.rowId);
    assert.equal(row.passedSeeds, 5);
  }
});
