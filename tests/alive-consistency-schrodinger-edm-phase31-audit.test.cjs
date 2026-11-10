'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p156 = require('../systems/alive-consistency-model-single-step-distillation.js');
const p157 = require('../systems/alive-schrodinger-bridge-iterative-proportional-fitting.js');
const p158 = require('../systems/alive-edm-karras-preconditioned-score-weights.js');
const p159 = require('../systems/alive-cfg-autoguidance-tangential-score-steering.js');
const p160 = require('../systems/alive-consistency-schrodinger-edm-phase31-audit.js');

test('Pass 156 Song Consistency Model Single-Step Trajectory Distillation achieves 100.0 score across 5 seeds', () => {
  const res = p156.runPass156Evaluation();
  assert.equal(res.winningProfileId, 'consistency-model-cskip-cout-pseudo-huber-single-step');
  assert.equal(res.winningScore, 100);
});

test('Pass 157 Diffusion Schrodinger Bridge (DSB) IPF Forward-Backward Drift Weights achieves 100.0 score across 5 seeds', () => {
  const res = p157.runPass157Evaluation();
  assert.equal(res.winningProfileId, 'schrodinger-bridge-ipf-forward-backward-drift-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 158 Karras EDM Preconditioned Score Denoiser Weights achieves 100.0 score across 5 seeds', () => {
  const res = p158.runPass158Evaluation();
  assert.equal(res.winningProfileId, 'karras-edm-cskip-cout-cin-unit-variance-preconditioner');
  assert.equal(res.winningScore, 100);
});

test('Pass 159 Karras AutoGuidance & Tangential Manifold Score Steering achieves 100.0 score across 5 seeds', () => {
  const res = p159.runPass159Evaluation();
  assert.equal(res.winningProfileId, 'autoguidance-tangential-manifold-projected-score-steering');
  assert.equal(res.winningScore, 100);
});

test('Pass 160 Phase XXXI Consistency, Schrodinger & EDM Acceptance Matrix verifies D2_1..D2_10 (10/10 rows)', () => {
  const res = p160.runPass160Phase31Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase31Sha256, 'string');
  assert.equal(res.phase31Sha256.length, 64);
});
