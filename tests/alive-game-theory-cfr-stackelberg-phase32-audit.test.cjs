'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p161 = require('../systems/alive-cfr-plus-regret-matching-nash-policy-weights.js');
const p162 = require('../systems/alive-stackelberg-bilevel-leader-follower-jacobian.js');
const p163 = require('../systems/alive-mean-field-fokker-planck-hjb-swarm-weights.js');
const p164 = require('../systems/alive-vcg-mechanism-incentive-compatible-bias-pricing.js');
const p165 = require('../systems/alive-game-theory-cfr-stackelberg-phase32-audit.js');

test('Pass 161 Tammelin CFR+ Regret-Matching Nash Policy Weights achieves 100.0 score across 5 seeds', () => {
  const res = p161.runPass161Evaluation();
  assert.equal(res.winningProfileId, 'cfr-plus-nonnegative-regret-matching-linear-nash-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 162 Stackelberg Bi-Level Leader-Follower Implicit Response Jacobian achieves 100.0 score across 5 seeds', () => {
  const res = p162.runPass162Evaluation();
  assert.equal(res.winningProfileId, 'stackelberg-total-derivative-implicit-response-jacobian');
  assert.equal(res.winningScore, 100);
});

test('Pass 163 Lasry-Lions Mean-Field Coupled HJB-FPK Swarm Density Weights achieves 100.0 score across 5 seeds', () => {
  const res = p163.runPass163Evaluation();
  assert.equal(res.winningProfileId, 'lasry-lions-coupled-hjb-fpk-conservative-mean-field-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 164 Vickrey-Clarke-Groves (VCG) Clarke Pivot DSIC Bias Pricing achieves 100.0 score across 5 seeds', () => {
  const res = p164.runPass164Evaluation();
  assert.equal(res.winningProfileId, 'vcg-clarke-pivot-dsic-ir-bias-pricing-mechanism');
  assert.equal(res.winningScore, 100);
});

test('Pass 165 Phase XXXII Multi-Agent Game Theory Acceptance Matrix verifies M2_1..M2_10 (10/10 rows)', () => {
  const res = p165.runPass165Phase32Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase32Sha256, 'string');
  assert.equal(res.phase32Sha256.length, 64);
});
