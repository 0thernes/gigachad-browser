'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p181 = require('../systems/alive-dpsgd-renyi-accountant-per-sample-clipping.js');
const p182 = require('../systems/alive-bulyan-multi-krum-geometric-median-aggregator.js');
const p183 = require('../systems/alive-fisher-scrubbing-certified-machine-unlearning.js');
const p184 = require('../systems/alive-uchida-spread-spectrum-weight-watermarking.js');
const p185 = require('../systems/alive-dpsgd-byzantine-unlearning-watermark-phase36-audit.js');

test('Pass 181 Abadi-Mironov DP-SGD Per-Sample Clipping & Renyi Accountant achieves 100.0 score across 5 seeds', () => {
  const res = p181.runPass181Evaluation();
  assert.equal(res.winningProfileId, 'dpsgd-per-sample-clip-renyi-rdp-moments-accountant');
  assert.equal(res.winningScore, 100);
});

test('Pass 182 Bulyan + Multi-Krum Byzantine Weight Aggregator achieves 100.0 score across 5 seeds', () => {
  const res = p182.runPass182Evaluation();
  assert.equal(res.winningProfileId, 'bulyan-multikrum-weiszfeld-geometric-median-aggregator');
  assert.equal(res.winningScore, 100);
});

test('Pass 183 Fisher Information Scrubbing Certified Machine Unlearning achieves 100.0 score across 5 seeds', () => {
  const res = p183.runPass183Evaluation();
  assert.equal(res.winningProfileId, 'fisher-hessian-newton-step-certified-unlearning');
  assert.equal(res.winningScore, 100);
});

test('Pass 184 Uchida Walsh Orthogonal Spread-Spectrum Weight Watermarking achieves 100.0 score across 5 seeds', () => {
  const res = p184.runPass184Evaluation();
  assert.equal(res.winningProfileId, 'uchida-walsh-orthogonal-spread-spectrum-weight-watermark');
  assert.equal(res.winningScore, 100);
});

test('Pass 185 Phase XXXVI Privacy & Cryptographic Weights Acceptance Matrix verifies P2_1..P2_10 (10/10 rows)', () => {
  const res = p185.runPass185Phase36Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase36Sha256, 'string');
  assert.equal(res.phase36Sha256.length, 64);
});
