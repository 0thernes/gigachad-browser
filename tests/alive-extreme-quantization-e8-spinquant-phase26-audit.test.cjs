'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p131 = require('../systems/alive-quip-sharp-hadamard-e8-lattice-quantizer.js');
const p132 = require('../systems/alive-aqlm-additive-multi-codebook-weight-quantizer.js');
const p133 = require('../systems/alive-spinquant-cayley-orthogonal-outlier-remover.js');
const p134 = require('../systems/alive-fp8-e4m3-e5m2-microscaling-mx-block-weights.js');
const p135 = require('../systems/alive-extreme-quantization-e8-spinquant-phase26-audit.js');

test('Pass 131 QuIP# Randomized Hadamard Incoherence & Gosset E8 Lattice Quantizer achieves 100.0 score across 5 seeds', () => {
  const res = p131.runPass131Evaluation();
  assert.equal(res.winningProfileId, 'quip-sharp-hadamard-e8-lattice-2bit-quantizer');
  assert.equal(res.winningScore, 100);
});

test('Pass 132 AQLM Additive Multi-Codebook Beam-Search Weight Quantizer achieves 100.0 score across 5 seeds', () => {
  const res = p132.runPass132Evaluation();
  assert.equal(res.winningProfileId, 'aqlm-2codebook-beam-search-joint-bias-finetune');
  assert.equal(res.winningScore, 100);
});

test('Pass 133 SpinQuant Cayley Orthogonal Outlier Remover achieves 100.0 score across 5 seeds', () => {
  const res = p133.runPass133Evaluation();
  assert.equal(res.winningProfileId, 'spinquant-cayley-orthogonal-weight-bias-fusion');
  assert.equal(res.winningScore, 100);
});

test('Pass 134 Microscaling MXFP8 Block-Scaled Weights & Stochastic Rounding achieves 100.0 score across 5 seeds', () => {
  const res = p134.runPass134Evaluation();
  assert.equal(res.winningProfileId, 'mxfp8-e4m3-e5m2-block32-stochastic-rounding');
  assert.equal(res.winningScore, 100);
});

test('Pass 135 Phase XXVI Extreme Quantization Acceptance Matrix verifies Y1..Y10 (10/10 rows)', () => {
  const res = p135.runPass135Phase26Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase26Sha256, 'string');
  assert.equal(res.phase26Sha256.length, 64);
});
