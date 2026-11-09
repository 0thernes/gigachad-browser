'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pass71 = require('../systems/alive-pantheon-connectome-flywire-weights.js');
const pass72 = require('../systems/alive-pantheon-quantum-riemannian-hdc-weights.js');
const pass73 = require('../systems/alive-pantheon-cortical-striatal-chaos-weights.js');
const pass74 = require('../systems/alive-pantheon-cross-attention-fusion-bus.js');
const pass75 = require('../systems/alive-pantheon-14brain-upgrade-phase14-audit.js');

test('Pass 71 Connectome + FlyWire Ring Attractor + CA3 Theta + Dale Law Brains 1-4 achieves 100.0 score across 5 seeds', () => {
  const res = pass71.runPass71ConnectomeFlywireBenchmark();
  assert.equal(res.passNumber, 71);
  assert.equal(res.winnerProfileId, 'programmed_connectome_flywire_ca3_dales_law_brains_1to4');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 72 Cayley Unitary CQM + Riemannian Christoffel + 10,240-Bit HDC + Koopman Brains 5-8 achieves 100.0 score across 5 seeds', () => {
  const res = pass72.runPass72QuantumRiemannianHdcBenchmark();
  assert.equal(res.passNumber, 72);
  assert.equal(res.winnerProfileId, 'cayley_unitary_riemannian_hdc10240_koopman_brains_5to8');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 73 Cortical L2/3-L5 + Striatal D1/D2 Dopamine STDP + Purkinje + Chaos rho=0.985 Brains 9-14 achieves 100.0 score across 5 seeds', () => {
  const res = pass73.runPass73CorticalStriatalChaosBenchmark();
  assert.equal(res.passNumber, 73);
  assert.equal(res.winnerProfileId, 'cortical_d1d2_stdp_purkinje_chaos0985_allostatic_brains_9to14');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 74 14-Brain Cross-Pantheon Attention Fusion Bus + Shapley Attribution achieves 100.0 score across 5 seeds', () => {
  const res = pass74.runPass74PantheonFusionBusBenchmark();
  assert.equal(res.passNumber, 74);
  assert.equal(res.pantheonBrains.length, 14);
  assert.equal(res.winnerProfileId, 'pantheon_14brain_cross_attention_shapley_precision_bus');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 75 Phase XIV 14-Brain Pantheon Upgrade Acceptance Matrix verifies B1..B10 across 5 seeds', () => {
  const audit1 = pass75.runPass75Pantheon14BrainPhase14Audit();
  const audit2 = pass75.runPass75Pantheon14BrainPhase14Audit();
  assert.equal(audit1.passNumber, 75);
  assert.equal(audit1.verifiedRows, 10);
  assert.equal(audit1.totalRows, 10);
  assert.equal(audit1.allRowsVerified, true);
  assert.equal(audit1.phase14Sha256.length, 64);
  assert.equal(audit1.phase14Sha256, audit2.phase14Sha256);
});
