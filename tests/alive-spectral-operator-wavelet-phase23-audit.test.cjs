'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p116 = require('../systems/alive-fourier-neural-operator-fno-spectral-weights.js');
const p117 = require('../systems/alive-wavelet-neural-operator-multi-resolution.js');
const p118 = require('../systems/alive-laplace-neural-operator-pole-residue-weights.js');
const p119 = require('../systems/alive-chebnet-cayleynet-spectral-graph-weights.js');
const p120 = require('../systems/alive-spectral-operator-wavelet-phase23-audit.js');

test('Pass 116 Fourier Neural Operator (FNO) Spectral Mode Weights achieves 100.0 score across 5 seeds', () => {
  const res = p116.runPass116Evaluation();
  assert.equal(res.winningProfileId, 'fno-complex-kmode-weights-plus-bypass-bias');
  assert.equal(res.winningScore, 100);
});

test('Pass 117 Wavelet Neural Operator (WNO) Multi-Resolution DWT achieves 100.0 score across 5 seeds', () => {
  const res = p117.runPass117Evaluation();
  assert.equal(res.winningProfileId, 'multi-scale-orthogonal-dwt-wno-threshold-bias');
  assert.equal(res.winningScore, 100);
});

test('Pass 118 Laplace Neural Operator (LNO) Hurwitz Pole-Residue Weights achieves 100.0 score across 5 seeds', () => {
  const res = p118.runPass118Evaluation();
  assert.equal(res.winningProfileId, 'hurwitz-pole-residue-laplace-neural-operator');
  assert.equal(res.winningScore, 100);
});

test('Pass 119 ChebNet & CayleyNet Spectral Graph Convolution Weights achieves 100.0 score across 5 seeds', () => {
  const res = p119.runPass119Evaluation();
  assert.equal(res.winningProfileId, 'chebnet-cayleynet-bandpass-spectral-graph-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 120 Phase XXIII Spectral Operator Acceptance Matrix verifies F1..F10 (10/10 rows)', () => {
  const res = p120.runPass120Phase23Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase23Sha256, 'string');
  assert.equal(res.phase23Sha256.length, 64);
});
