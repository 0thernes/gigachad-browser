'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p106 = require('../systems/alive-clifford-cl40-multivector-weight-algebra.js');
const p107 = require('../systems/alive-se3-equivariant-steerable-spherical-weights.js');
const p108 = require('../systems/alive-quaternion-octonion-hypercomplex-weights.js');
const p109 = require('../systems/alive-gauge-covariant-parallel-transport-weights.js');
const p110 = require('../systems/alive-geometric-clifford-gauge-phase21-audit.js');

test('Pass 106 Clifford Cl(4,0) 16-Blade Multivector Weight Algebra achieves 100.0 score across 5 seeds', () => {
  const res = p106.runPass106Evaluation();
  assert.equal(res.winningProfileId, 'cl40-16blade-rotor-grade-bias-algebra');
  assert.equal(res.winningScore, 100);
});

test('Pass 107 SE(3)-Equivariant Clebsch-Gordan Steerable Weights achieves 100.0 score across 5 seeds', () => {
  const res = p107.runPass107Evaluation();
  assert.equal(res.winningProfileId, 'se3-clebsch-gordan-norm-gated-bias-steerable');
  assert.equal(res.winningScore, 100);
});

test('Pass 108 Hamilton Quaternion & Cayley-Dickson Octonion Weights achieves 100.0 score across 5 seeds', () => {
  const res = p108.runPass108Evaluation();
  assert.equal(res.winningProfileId, 'unit-hamilton-quaternion-octonion-hypercomplex');
  assert.equal(res.winningScore, 100);
});

test('Pass 109 Gauge-Covariant SO(4) Parallel-Transport & Wilson-Loop Biases achieves 100.0 score across 5 seeds', () => {
  const res = p109.runPass109Evaluation();
  assert.equal(res.winningProfileId, 'cayley-so4-gauge-covariant-wilson-loop-transport');
  assert.equal(res.winningScore, 100);
});

test('Pass 110 Phase XXI Clifford & Equivariant Weight Acceptance Matrix verifies Q1..Q10 (10/10 rows)', () => {
  const res = p110.runPass110Phase21Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase21Sha256, 'string');
  assert.equal(res.phase21Sha256.length, 64);
});
