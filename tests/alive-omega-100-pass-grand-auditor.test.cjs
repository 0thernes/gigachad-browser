'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pass96 = require('../systems/alive-sparse-autoencoder-monosemantic-sae.js');
const pass97 = require('../systems/alive-ibp-crown-formal-bound-verifier.js');
const pass98 = require('../systems/alive-conformal-temperature-calibration.js');
const pass99 = require('../systems/alive-100pass-supremo-organism-benchmark.js');
const pass100 = require('../systems/alive-omega-100-pass-grand-auditor.js');

test('Pass 96 Top-k JumpReLU Monosemantic SAE achieves 100.0 score across 5 seeds', () => {
  const res = pass96.runPass96MonosemanticSaeBenchmark();
  assert.equal(res.passNumber, 96);
  assert.equal(res.winnerProfileId, 'jumprelu_topk_monosemantic_sae_b_pre_unit_decoder');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 97 Hybrid IBP + alpha-CROWN Formal Bound Verifier achieves 100.0 score across 5 seeds', () => {
  const res = pass97.runPass97IbpCrownBenchmark();
  assert.equal(res.passNumber, 97);
  assert.equal(res.winnerProfileId, 'ibp_plus_alpha_crown_adaptive_chord_verifier');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 98 Vector Temperature & Bias Scaling + Split Conformal 95% achieves 100.0 score across 5 seeds', () => {
  const res = pass98.runPass98ConformalCalibrationBenchmark();
  assert.equal(res.passNumber, 98);
  assert.equal(res.winnerProfileId, 'vector_temperature_bias_scaling_plus_split_conformal_95');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 99 100-Pass Supremo Organism Benchmark & Live Runtime Weight/Bias Programming achieves 100.0 score across 5 seeds', () => {
  const res = pass99.runPass99SupremoOrganismBenchmark();
  assert.equal(res.passNumber, 99);
  assert.equal(res.liveTensorReceipt.programmedTensorCount, 13);
  assert.equal(res.winnerProfileId, 'pass99_100pass_supremo_programmed_weights_biases_organism');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 100 Grand Omega Crown Audit verifies S1..S10 and all 183/183 gates across 19 phases & 100 passes', () => {
  const audit1 = pass100.runPass100GrandOmegaCrownAudit();
  const audit2 = pass100.runPass100GrandOmegaCrownAudit();
  assert.equal(audit1.passNumber, 100);
  assert.equal(audit1.verifiedRows, 10);
  assert.equal(audit1.totalRows, 10);
  assert.equal(audit1.allRowsVerified, true);
  assert.equal(audit1.totalPassesCompleted, 100);
  assert.equal(audit1.totalPhasesCompleted, 19);
  assert.equal(audit1.totalGatesVerified, 183);
  assert.equal(audit1.all183GatesVerified, true);
  assert.equal(audit1.phase19Sha256.length, 64);
  assert.equal(audit1.master100PassSha256.length, 64);
  assert.equal(audit1.master100PassSha256, audit2.master100PassSha256);

  const startupSource = fs.readFileSync(path.join(__dirname, '..', 'systems', 'alive-startup-loader.js'), 'utf8');
  const idxEngine = startupSource.indexOf("'systems/alive-programmed-weights-biases-engine.js'");
  const idxOmega100 = startupSource.indexOf("'systems/alive-omega-100-pass-grand-auditor.js'");
  const idxViz = startupSource.indexOf("'systems/alive-fabric-visualizer.js'");
  assert.ok(idxEngine > 0 && idxOmega100 > idxEngine && idxViz > idxOmega100);

  const vizSource = fs.readFileSync(path.join(__dirname, '..', 'systems', 'alive-fabric-visualizer.js'), 'utf8');
  assert.ok(vizSource.includes('runOmega100Audit'));
  assert.ok(vizSource.includes('47 · 100-Pass Grand Omega Crown'));
});
