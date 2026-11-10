/**
 * ALIVE Pass 150: Phase XXIX Differentiable Optimization Layers (OptNet QP KKT,
 * SoftSort Sinkhorn, SATNet & ICNN) Acceptance Matrix (Q2_1..Q2_10) & SHA-256 Freeze
 * ==================================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p146 = null;
  var p147 = null;
  var p148 = null;
  var p149 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p146 = require('./alive-optnet-differentiable-qp-kkt-implicit-layer.js');
    p147 = require('./alive-neural-sinkhorn-softsort-permutation-weights.js');
    p148 = require('./alive-satnet-maxsat-semidefinite-relaxation-weights.js');
    p149 = require('./alive-convex-icnn-input-convex-neural-weights.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p146 = root.AliveOptnetDifferentiableQpKktImplicitLayer;
    p147 = root.AliveNeuralSinkhornSoftsortPermutationWeights;
    p148 = root.AliveSatnetMaxsatSemidefiniteRelaxationWeights;
    p149 = root.AliveConvexIcnnInputConvexNeuralWeights;
  }
  var api = factory(engine, p146, p147, p148, p149);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveDifferentiableOptnetSatnetIcnnPhase29Audit = api;
    root.ALIVEDifferentiableOptnetSatnetIcnnPhase29Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p146, p147, p148, p149) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass150Phase29Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r146 = p146.runPass146Evaluation({ seeds: seeds, episodes: 24 });
    var r147 = p147.runPass147Evaluation({ seeds: seeds, episodes: 24 });
    var r148 = p148.runPass148Evaluation({ seeds: seeds, episodes: 24 });
    var r149 = p149.runPass149Evaluation({ seeds: seeds, episodes: 24 });

    var w146 = r146.profiles[r146.winningProfileId].stats;
    var w147 = r147.profiles[r147.winningProfileId].stats;
    var w148 = r148.profiles[r148.winningProfileId].stats;
    var w149 = r149.profiles[r149.winningProfileId].stats;

    var rows = [
      {
        rowId: 'Q2_1-OptNet-KKT-Primal-Dual-Stationarity-Feasibility-Defect',
        passNumber: 146,
        metric: 'kktStationarityAndFeasibilityDefect',
        threshold: '<= 1e-12',
        observed: w146.kktStationarityAndFeasibilityDefect.mean,
        verified: w146.kktStationarityAndFeasibilityDefect.mean <= 1e-12
      },
      {
        rowId: 'Q2_2-OptNet-Hard-Constraint-Satisfaction',
        passNumber: 146,
        metric: 'hardConstraintSatisfactionPct',
        threshold: '=== 100.0%',
        observed: w146.hardConstraintSatisfactionPct.mean,
        verified: w146.hardConstraintSatisfactionPct.mean === 100
      },
      {
        rowId: 'Q2_3-SoftSort-Birkhoff-Row-Stochastic-Defect',
        passNumber: 147,
        metric: 'birkhoffRowStochasticDefect',
        threshold: '<= 1e-12',
        observed: w147.birkhoffRowStochasticDefect.mean,
        verified: w147.birkhoffRowStochasticDefect.mean <= 1e-12
      },
      {
        rowId: 'Q2_4-SoftSort-Exact-Permutation-Order-Accuracy',
        passNumber: 147,
        metric: 'sortingPermutationOrderAccuracyPct',
        threshold: '=== 100.0%',
        observed: w147.sortingPermutationOrderAccuracyPct.mean,
        verified: w147.sortingPermutationOrderAccuracyPct.mean === 100
      },
      {
        rowId: 'Q2_5-SATNet-SDP-Unit-Sphere-Column-Norm-Preservation',
        passNumber: 148,
        metric: 'sdpUnitSphereColumnDefect',
        threshold: '<= 1e-12',
        observed: w148.sdpUnitSphereColumnDefect.mean,
        verified: w148.sdpUnitSphereColumnDefect.mean <= 1e-12
      },
      {
        rowId: 'Q2_6-SATNet-MAXSAT-Logical-Clause-Satisfaction',
        passNumber: 148,
        metric: 'maxsatLogicalClauseSatisfactionPct',
        threshold: '=== 100.0%',
        observed: w148.maxsatLogicalClauseSatisfactionPct.mean,
        verified: w148.maxsatLogicalClauseSatisfactionPct.mean === 100
      },
      {
        rowId: 'Q2_7-ICNN-Global-Jensen-Convexity-Zero-Violation',
        passNumber: 149,
        metric: 'jensenConvexityViolationDefect',
        threshold: '=== 0.0',
        observed: w149.jensenConvexityViolationDefect.mean,
        verified: w149.jensenConvexityViolationDefect.mean === 0
      },
      {
        rowId: 'Q2_8-ICNN-Global-Optimum-Uniqueness-Guarantee',
        passNumber: 149,
        metric: 'globalOptimumUniquenessPct',
        threshold: '=== 100.0%',
        observed: w149.globalOptimumUniquenessPct.mean,
        verified: w149.globalOptimumUniquenessPct.mean === 100
      },
      {
        rowId: 'Q2_9-ICNN-Brenier-Potential-Approximation-Fidelity',
        passNumber: 149,
        metric: 'BrenierPotentialApproximationR2',
        threshold: '>= 0.99',
        observed: w149.BrenierPotentialApproximationR2.mean,
        verified: w149.BrenierPotentialApproximationR2.mean >= 0.99
      },
      {
        rowId: 'Q2_10-Phase29-All-Four-Differentiable-Optimization-Passes-100-Score',
        passNumber: 150,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r146.winningScore, r147.winningScore, r148.winningScore, r149.winningScore].join(' / '),
        verified: r146.winningScore === 100 && r147.winningScore === 100 && r148.winningScore === 100 && r149.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-150-DIFFERENTIABLE-OPTNET-SATNET-ICNN-PHASE29-AUDIT',
      passNumber: 150,
      phase: 'Phase XXIX: Differentiable Optimization Layers (OptNet QP KKT, SoftSort Sinkhorn, SATNet & ICNN)',
      generatedAt: '2026-11-09T20:14:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass146Sha256: r146.sha256,
        pass147Sha256: r147.sha256,
        pass148Sha256: r148.sha256,
        pass149Sha256: r149.sha256
      }
    };
    result.phase29Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass150Phase29Audit: runPass150Phase29Audit
  };
});
