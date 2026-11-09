'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pass76 = require('../systems/alive-hinton-forward-forward-goodness.js');
const pass77 = require('../systems/alive-equilibrium-propagation-energy-ising.js');
const pass78 = require('../systems/alive-rao-ballard-predictive-coding-net.js');
const pass79 = require('../systems/alive-modern-continuous-hopfield-ramsauer.js');
const pass80 = require('../systems/alive-local-learning-energy-phase15-audit.js');

test('Pass 76 Hinton Forward-Forward (FF) + L2 Norm + Goodness Threshold + Peer Bias achieves 100.0 score across 5 seeds', () => {
  const res = pass76.runPass76ForwardForwardBenchmark();
  assert.equal(res.passNumber, 76);
  assert.equal(res.winnerProfileId, 'hinton_ff_l2norm_goodness_threshold_peer_bias');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 77 Centered Equilibrium Propagation (EqProp) Symmetric Nudging achieves 100.0 score across 5 seeds', () => {
  const res = pass77.runPass77EquilibriumPropagationBenchmark();
  assert.equal(res.passNumber, 77);
  assert.equal(res.winnerProfileId, 'centered_eqprop_symmetric_weights_pm_beta005');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 78 Rao-Ballard / Friston Precision-Weighted Predictive Coding Network achieves 100.0 score across 5 seeds', () => {
  const res = pass78.runPass78PredictiveCodingBenchmark();
  assert.equal(res.passNumber, 78);
  assert.equal(res.winnerProfileId, 'rao_ballard_friston_precision_weighted_pcn_16step');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 79 Ramsauer Modern Continuous Hopfield Network achieves 100.0 score across 5 seeds', () => {
  const res = pass79.runPass79ModernHopfieldBenchmark();
  assert.equal(res.passNumber, 79);
  assert.equal(res.winnerProfileId, 'ramsauer_modern_continuous_hopfield_beta24_prior_bias');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 80 Phase XV Local Learning & Energy-Based Brains Acceptance Matrix verifies L1..L10 across 5 seeds', () => {
  const audit1 = pass80.runPass80LocalLearningPhase15Audit();
  const audit2 = pass80.runPass80LocalLearningPhase15Audit();
  assert.equal(audit1.passNumber, 80);
  assert.equal(audit1.verifiedRows, 10);
  assert.equal(audit1.totalRows, 10);
  assert.equal(audit1.allRowsVerified, true);
  assert.equal(audit1.phase15Sha256.length, 64);
  assert.equal(audit1.phase15Sha256, audit2.phase15Sha256);
});
