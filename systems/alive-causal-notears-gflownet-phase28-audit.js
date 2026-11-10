/**
 * ALIVE Pass 145: Phase XXVIII Causal Representation Learning (NOTEARS/DAGMA, IRM/V-REx,
 * GFlowNets & ICM) Acceptance Matrix (I1..I10) & Cryptographic SHA-256 Freeze
 * ======================================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p141 = null;
  var p142 = null;
  var p143 = null;
  var p144 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p141 = require('./alive-notears-dagma-acyclic-causal-weight-learner.js');
    p142 = require('./alive-irm-vrex-invariant-causal-predictor-weights.js');
    p143 = require('./alive-gflownet-trajectory-balance-flow-weights.js');
    p144 = require('./alive-independent-causal-mechanisms-sparse-modular.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p141 = root.AliveNotearsDagmaAcyclicCausalWeightLearner;
    p142 = root.AliveIrmVrexInvariantCausalPredictorWeights;
    p143 = root.AliveGflownetTrajectoryBalanceFlowWeights;
    p144 = root.AliveIndependentCausalMechanismsSparseModular;
  }
  var api = factory(engine, p141, p142, p143, p144);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveCausalNotearsGflownetPhase28Audit = api;
    root.ALIVECausalNotearsGflownetPhase28Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p141, p142, p143, p144) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass145Phase28Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r141 = p141.runPass141Evaluation({ seeds: seeds, episodes: 24 });
    var r142 = p142.runPass142Evaluation({ seeds: seeds, episodes: 24 });
    var r143 = p143.runPass143Evaluation({ seeds: seeds, episodes: 24 });
    var r144 = p144.runPass144Evaluation({ seeds: seeds, episodes: 24 });

    var w141 = r141.profiles[r141.winningProfileId].stats;
    var w142 = r142.profiles[r142.winningProfileId].stats;
    var w143 = r143.profiles[r143.winningProfileId].stats;
    var w144 = r144.profiles[r144.winningProfileId].stats;

    var rows = [
      {
        rowId: 'I1-DAGMA-LogDet-Acyclicity-Constraint-Zero-Cycle-Defect',
        passNumber: 141,
        metric: 'acyclicityConstraintDefect',
        threshold: '<= 1e-12',
        observed: w141.acyclicityConstraintDefect.mean,
        verified: w141.acyclicityConstraintDefect.mean <= 1e-12
      },
      {
        rowId: 'I2-DAGMA-Causal-DAG-Structural-Hamming-Distance',
        passNumber: 141,
        metric: 'structuralHammingDistance',
        threshold: '=== 0.0',
        observed: w141.structuralHammingDistance.mean,
        verified: w141.structuralHammingDistance.mean === 0
      },
      {
        rowId: 'I3-IRM-VREx-Spurious-Feature-Weight-Elimination',
        passNumber: 142,
        metric: 'spuriousFeatureWeightLeakage',
        threshold: '<= 1e-6',
        observed: w142.spuriousFeatureWeightLeakage.mean,
        verified: w142.spuriousFeatureWeightLeakage.mean <= 1e-6
      },
      {
        rowId: 'I4-IRM-VREx-Cross-Environment-Risk-Variance',
        passNumber: 142,
        metric: 'crossEnvironmentRiskVariance',
        threshold: '<= 1e-4',
        observed: w142.crossEnvironmentRiskVariance.mean,
        verified: w142.crossEnvironmentRiskVariance.mean <= 1e-4
      },
      {
        rowId: 'I5-IRM-VREx-AntiCorrelated-OOD-Accuracy',
        passNumber: 142,
        metric: 'oodAntiCorrelatedTestAccuracyPct',
        threshold: '>= 99.0%',
        observed: w142.oodAntiCorrelatedTestAccuracyPct.mean,
        verified: w142.oodAntiCorrelatedTestAccuracyPct.mean >= 99.0
      },
      {
        rowId: 'I6-GFlowNet-Trajectory-Balance-Residual-Conservation',
        passNumber: 143,
        metric: 'trajectoryBalanceResidualLoss',
        threshold: '<= 1e-12',
        observed: w143.trajectoryBalanceResidualLoss.mean,
        verified: w143.trajectoryBalanceResidualLoss.mean <= 1e-12
      },
      {
        rowId: 'I7-GFlowNet-Multimodal-Reward-Proportional-Sampling',
        passNumber: 143,
        metric: 'multimodalRewardSampleCorrelation',
        threshold: '>= 0.99',
        observed: w143.multimodalRewardSampleCorrelation.mean,
        verified: w143.multimodalRewardSampleCorrelation.mean >= 0.99
      },
      {
        rowId: 'I8-ICM-NonIntervened-Mechanism-Zero-Weight-Drift',
        passNumber: 144,
        metric: 'nonIntervenedMechanismWeightDrift',
        threshold: '=== 0.0',
        observed: w144.nonIntervenedMechanismWeightDrift.mean,
        verified: w144.nonIntervenedMechanismWeightDrift.mean === 0
      },
      {
        rowId: 'I9-ICM-Algorithmic-Independence-Mutual-Information',
        passNumber: 144,
        metric: 'algorithmicIndependenceMutualInfo',
        threshold: '<= 0.005',
        observed: w144.algorithmicIndependenceMutualInfo.mean,
        verified: w144.algorithmicIndependenceMutualInfo.mean <= 0.005
      },
      {
        rowId: 'I10-Phase28-All-Four-Causal-Representation-Passes-100-Score',
        passNumber: 145,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r141.winningScore, r142.winningScore, r143.winningScore, r144.winningScore].join(' / '),
        verified: r141.winningScore === 100 && r142.winningScore === 100 && r143.winningScore === 100 && r144.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-145-CAUSAL-NOTEARS-GFLOWNET-PHASE28-AUDIT',
      passNumber: 145,
      phase: 'Phase XXVIII: Causal Representation Learning (NOTEARS/DAGMA, IRM/V-REx, GFlowNets & ICM)',
      generatedAt: '2026-11-09T20:09:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass141Sha256: r141.sha256,
        pass142Sha256: r142.sha256,
        pass143Sha256: r143.sha256,
        pass144Sha256: r144.sha256
      }
    };
    result.phase28Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass145Phase28Audit: runPass145Phase28Audit
  };
});
