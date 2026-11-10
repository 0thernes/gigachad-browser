'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p101 = require('../systems/alive-cortex-124m-full-weight-bias-programmer.js');
const p102 = require('../systems/alive-hub-59tensor-mixed-arena-programmer.js');
const p103 = require('../systems/alive-neural-coupling-24source-gate-bias-learner.js');
const p104 = require('../systems/alive-specialist-fusion-option-critic-rims-router.js');
const p105 = require('../systems/alive-core-brain-programming-phase20-audit.js');

test('Pass 101 Deep Cortex 1.245M-Parameter & Connectome Weight/Bias Programmer achieves 100.0 score across 5 seeds', () => {
  const res = p101.runPass101Evaluation();
  assert.equal(res.winningProfileId, 'stiefel-chrono-bias-124m-cortex-programmer');
  assert.equal(res.winningScore, 100);
});

test('Pass 102 Trainable Hub 59-Tensor Mixed-Arena Weight/Bias Programmer achieves 100.0 score across 5 seeds', () => {
  const res = p102.runPass102Evaluation();
  assert.equal(res.winningProfileId, 'full-59tensor-mixed-arena-stiefel-cosine-programmer');
  assert.equal(res.winningScore, 100);
});

test('Pass 103 24-Source Neural Coupling Weight & Gate Bias Learner achieves 100.0 score across 5 seeds', () => {
  const res = p103.runPass103Evaluation();
  assert.equal(res.winningProfileId, 'natural-gradient-eligibility-24source-coupler');
  assert.equal(res.winningScore, 100);
});

test('Pass 104 Specialist Fusion Option-Critic & RIMs Router achieves 100.0 score across 5 seeds', () => {
  const res = p104.runPass104Evaluation();
  assert.equal(res.winningProfileId, 'rims-option-critic-specialist-fusion-router');
  assert.equal(res.winningScore, 100);
});

test('Pass 105 Phase XX Core Brain Programming Acceptance Matrix verifies U1..U10 (10/10 rows)', () => {
  const res = p105.runPass105Phase20Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase20Sha256, 'string');
  assert.equal(res.phase20Sha256.length, 64);
});
