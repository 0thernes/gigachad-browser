'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p166 = require('../systems/alive-dpo-simpo-reference-free-margin-weights.js');
const p167 = require('../systems/alive-kto-kahneman-tversky-prospect-utility-weights.js');
const p168 = require('../systems/alive-caa-contrastive-activation-addition-steering.js');
const p169 = require('../systems/alive-circuit-breakers-orthogonal-refusal-abliteration.js');
const p170 = require('../systems/alive-preference-dpo-kto-steering-phase33-audit.js');

test('Pass 166 DPO / SimPO Length-Normalized Preference Margin Weights achieves 100.0 score across 5 seeds', () => {
  const res = p166.runPass166Evaluation();
  assert.equal(res.winningProfileId, 'simpo-length-normalized-margin-gamma-preference-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 167 KTO Kahneman-Tversky Prospect Theory Utility Weights achieves 100.0 score across 5 seeds', () => {
  const res = p167.runPass167Evaluation();
  assert.equal(res.winningProfileId, 'kto-prospect-utility-kl-reference-point-asymmetric-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 168 Contrastive Activation Addition (CAA) Residual Stream Steering achieves 100.0 score across 5 seeds', () => {
  const res = p168.runPass168Evaluation();
  assert.equal(res.winningProfileId, 'caa-mean-difference-norm-preserving-midlayer-steering-bias');
  assert.equal(res.winningScore, 100);
});

test('Pass 169 Orthogonal Subspace Weight Projection & Circuit Breakers achieves 100.0 score across 5 seeds', () => {
  const res = p169.runPass169Evaluation();
  assert.equal(res.winningProfileId, 'orthogonal-rank1-weight-projection-circuit-breaker');
  assert.equal(res.winningScore, 100);
});

test('Pass 170 Phase XXXIII Preference Optimization & Steering Acceptance Matrix verifies A2_1..A2_10 (10/10 rows)', () => {
  const res = p170.runPass170Phase33Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase33Sha256, 'string');
  assert.equal(res.phase33Sha256.length, 64);
});
