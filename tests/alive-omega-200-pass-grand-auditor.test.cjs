'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const p196 = require('../systems/alive-acdc-attribution-patching-circuit-transcoder.js');
const p197 = require('../systems/alive-pedersen-merkle-zk-weight-inference-commitment.js');
const p198 = require('../systems/alive-pareto-multi-objective-mgda-pcgrad-weight-surgeon.js');
const p199 = require('../systems/alive-200pass-titan-omni-organism-benchmark.js');
const p200 = require('../systems/alive-omega-200-pass-grand-auditor.js');

test('Pass 196 Conmy ACDC & EAP-IG Sparse MLP Transcoder Circuit Weights achieves 100.0 score across 5 seeds', () => {
  const res = p196.runPass196Evaluation();
  assert.equal(res.winningProfileId, 'acdc_integrated_gradients_sparse_mlp_transcoder');
  assert.equal(res.winningScore, 100);
  const w = res.profiles[res.winningProfileId].stats;
  assert.ok(w.circuitEdgeSparsityPct.mean >= 92.0);
  assert.ok(w.circuitFaithfulnessKlDivergence.mean <= 0.001);
  assert.ok(w.completenessIntegratedGradientsDefect.mean <= 1e-12);
});

test('Pass 197 Freivalds k=64 MatMul Verification & Merkle-SHA256 Weight Commitment achieves 100.0 score across 5 seeds', () => {
  const res = p197.runPass197Evaluation();
  assert.equal(res.winningProfileId, 'freivalds_k64_sumcheck_merkle_sha256_committed_weights');
  assert.equal(res.winningScore, 100);
  const w = res.profiles[res.winningProfileId].stats;
  assert.ok(w.freivaldsLinearIdentityResidual.mean <= 1e-12);
  assert.ok(w.soundnessForgeryUpperBound.mean <= 1e-18);
  assert.equal(w.merkleWeightTamperDetectionPct.mean, 100.0);
});

test('Pass 198 Desideri-Sener MGDA Frank-Wolfe & Yu PCGrad Pareto Weight Surgeon achieves 100.0 score across 5 seeds', () => {
  const res = p198.runPass198Evaluation();
  assert.equal(res.winningProfileId, 'hybrid_pcgrad_mgda_frank_wolfe_pareto_surgeon');
  assert.equal(res.winningScore, 100);
  const w = res.profiles[res.winningProfileId].stats;
  assert.equal(w.conflictingGradientNegativeCosineCount.mean, 0.0);
  assert.ok(w.simplexConvexHullConservationDefect.mean <= 1e-12);
  assert.ok(w.paretoHypervolumeNormalizedScore.mean >= 0.94);
});

test('Pass 199 200-Pass Titan Omni-Organism 24-Tensor-Family Benchmark achieves 100.0 score across 5 seeds', () => {
  const res = p199.runPass199Evaluation();
  assert.equal(res.winningProfileId, 'titan_200pass_omni_organism_crown');
  assert.equal(res.winningScore, 100);
  const w = res.profiles[res.winningProfileId].stats;
  assert.equal(w.activeProgrammedTensorFamilies.mean, 24);
  assert.ok(w.maxStiefelSymplecticConservationDefect.mean <= 1e-12);
  assert.ok(w.normalizedTitanOrganismReturn.mean >= 0.995);
});

test('Pass 200 Phase XXXIX Acceptance Matrix verifies O2_1..O2_10 (10/10 rows) and all 383/383 Gates across 39 Phases', () => {
  const res = p200.runPass200GrandOmegaCrownAudit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.totalRows, 10);
  assert.equal(res.allVerified, true);
  assert.equal(res.totalPassesCompleted, 200);
  assert.equal(res.totalPhasesCompleted, 39);
  assert.equal(res.totalGatesVerified, 383);
  assert.equal(res.all383GatesVerified, true);
  assert.match(res.phase39Sha256, /^[0-9a-f]{64}$/);
  assert.match(res.master200PassSha256, /^[0-9a-f]{64}$/);
});
