'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pass91 = require('../systems/alive-darts-bilevel-architecture-search.js');
const pass92 = require('../systems/alive-kronecker-hypernetwork-weight-generator.js');
const pass93 = require('../systems/alive-ewc-synaptic-intelligence-continual.js');
const pass94 = require('../systems/alive-cmaes-pbt-hyperparameter-evolver.js');
const pass95 = require('../systems/alive-meta-hypernet-continual-phase18-audit.js');

test('Pass 91 Second-Order Bilevel DARTS + Skip-Penalty Architecture Bias achieves 100.0 score across 5 seeds', () => {
  const res = pass91.runPass91DartsBilevelBenchmark();
  assert.equal(res.passNumber, 91);
  assert.equal(res.winnerProfileId, 'second_order_bilevel_darts_gumbel_annealed_arch_bias');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 92 Kronecker-Factored Hypernetwork + Chang Variance Init + FiLM Biases achieves 100.0 score across 5 seeds', () => {
  const res = pass92.runPass92KroneckerHypernetworkBenchmark();
  assert.equal(res.passNumber, 92);
  assert.equal(res.winnerProfileId, 'kronecker_hypernetwork_chang_init_film_modulation');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 93 Online EWC++ + Zenke Synaptic Intelligence + Task Bias Anchors achieves 100.0 score across 5 seeds', () => {
  const res = pass93.runPass93ContinualEwcSiBenchmark();
  assert.equal(res.passNumber, 93);
  assert.equal(res.winnerProfileId, 'ewc_plusplus_synaptic_intelligence_task_bias_anchors');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 94 CMA-ES + Population-Based Training (PBT) Online Evolver achieves 100.0 score across 5 seeds', () => {
  const res = pass94.runPass94CmaesPbtBenchmark();
  assert.equal(res.passNumber, 94);
  assert.equal(res.winnerProfileId, 'cmaes_rank_mu_csa_plus_pbt_online_evolver');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 95 Phase XVIII Meta-Learning, Hypernetworks & Continual Acceptance Matrix verifies H1..H10 across 5 seeds', () => {
  const audit1 = pass95.runPass95MetaHypernetContinualPhase18Audit();
  const audit2 = pass95.runPass95MetaHypernetContinualPhase18Audit();
  assert.equal(audit1.passNumber, 95);
  assert.equal(audit1.verifiedRows, 10);
  assert.equal(audit1.totalRows, 10);
  assert.equal(audit1.allRowsVerified, true);
  assert.equal(audit1.phase18Sha256.length, 64);
  assert.equal(audit1.phase18Sha256, audit2.phase18Sha256);
});
