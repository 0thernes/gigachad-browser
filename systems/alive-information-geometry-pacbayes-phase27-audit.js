/**
 * ALIVE Pass 140: Phase XXVII Information Geometry, Fisher-Rao Natural Gradients,
 * Wasserstein & PAC-Bayes Acceptance Matrix (Z1..Z10) & Cryptographic SHA-256 Freeze
 * ==================================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p136 = null;
  var p137 = null;
  var p138 = null;
  var p139 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p136 = require('./alive-amari-empirical-fisher-rao-metric-weights.js');
    p137 = require('./alive-wasserstein-natural-gradient-sinkhorn-score.js');
    p138 = require('./alive-bregman-mirror-descent-hyperspherical-weights.js');
    p139 = require('./alive-pac-bayes-kl-weight-posterior-bound-minimizer.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p136 = root.AliveAmariEmpiricalFisherRaoMetricWeights;
    p137 = root.AliveWassersteinNaturalGradientSinkhornScore;
    p138 = root.AliveBregmanMirrorDescentHypersphericalWeights;
    p139 = root.AlivePacBayesKlWeightPosteriorBoundMinimizer;
  }
  var api = factory(engine, p136, p137, p138, p139);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveInformationGeometryPacbayesPhase27Audit = api;
    root.ALIVEInformationGeometryPacbayesPhase27Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p136, p137, p138, p139) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass140Phase27Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r136 = p136.runPass136Evaluation({ seeds: seeds, episodes: 24 });
    var r137 = p137.runPass137Evaluation({ seeds: seeds, episodes: 24 });
    var r138 = p138.runPass138Evaluation({ seeds: seeds, episodes: 24 });
    var r139 = p139.runPass139Evaluation({ seeds: seeds, episodes: 24 });

    var w136 = r136.profiles[r136.winningProfileId].stats;
    var w137 = r137.profiles[r137.winningProfileId].stats;
    var w138 = r138.profiles[r138.winningProfileId].stats;
    var w139 = r139.profiles[r139.winningProfileId].stats;

    var rows = [
      {
        rowId: 'Z1-Amari-Fisher-Rao-Reparameterization-Invariance',
        passNumber: 136,
        metric: 'reparameterizationInvarianceDefect',
        threshold: '<= 1e-9',
        observed: w136.reparameterizationInvarianceDefect.mean,
        verified: w136.reparameterizationInvarianceDefect.mean <= 1e-9
      },
      {
        rowId: 'Z2-Amari-Fisher-Rao-Plateau-Escape-Speedup',
        passNumber: 136,
        metric: 'plateauEscapeSpeedupFactor',
        threshold: '>= 4.0x',
        observed: w136.plateauEscapeSpeedupFactor.mean,
        verified: w136.plateauEscapeSpeedupFactor.mean >= 4.0
      },
      {
        rowId: 'Z3-Wasserstein-Sinkhorn-Doubly-Stochastic-Marginal-Conservation',
        passNumber: 137,
        metric: 'marginalConservationError',
        threshold: '<= 1e-6',
        observed: w137.marginalConservationError.mean,
        verified: w137.marginalConservationError.mean <= 1e-6
      },
      {
        rowId: 'Z4-Wasserstein-Disjoint-Support-Gradient-Finiteness',
        passNumber: 137,
        metric: 'disjointSupportGradientFinitenessPct',
        threshold: '=== 100.0%',
        observed: w137.disjointSupportGradientFinitenessPct.mean,
        verified: w137.disjointSupportGradientFinitenessPct.mean === 100
      },
      {
        rowId: 'Z5-Bregman-Mirror-Descent-Simplex-Feasibility-Preservation',
        passNumber: 138,
        metric: 'simplexBregmanFeasibilityDefect',
        threshold: '<= 1e-12',
        observed: w138.simplexBregmanFeasibilityDefect.mean,
        verified: w138.simplexBregmanFeasibilityDefect.mean <= 1e-12
      },
      {
        rowId: 'Z6-Hyperspherical-Geodesic-Retraction-Unit-Norm-Invariance',
        passNumber: 138,
        metric: 'hypersphericalNormDefect',
        threshold: '<= 1e-12',
        observed: w138.hypersphericalNormDefect.mean,
        verified: w138.hypersphericalNormDefect.mean <= 1e-12
      },
      {
        rowId: 'Z7-Bregman-Logarithmic-HighDim-Regret-Bound-Gain',
        passNumber: 138,
        metric: 'highDimSimplexRegretBoundGain',
        threshold: '>= 3.5x',
        observed: w138.highDimSimplexRegretBoundGain.mean,
        verified: w138.highDimSimplexRegretBoundGain.mean >= 3.5
      },
      {
        rowId: 'Z8-PAC-Bayes-NonVacuous-Generalization-Risk-Upper-Bound',
        passNumber: 139,
        metric: 'pacBayesNonVacuousUpperBound',
        threshold: '<= 0.08',
        observed: w139.pacBayesNonVacuousUpperBound.mean,
        verified: w139.pacBayesNonVacuousUpperBound.mean <= 0.08
      },
      {
        rowId: 'Z9-PAC-Bayes-Empirical-To-True-Risk-Gap',
        passNumber: 139,
        metric: 'empiricalToTrueRiskGap',
        threshold: '<= 0.02',
        observed: w139.empiricalToTrueRiskGap.mean,
        verified: w139.empiricalToTrueRiskGap.mean <= 0.02
      },
      {
        rowId: 'Z10-Phase27-All-Four-Information-Geometry-Passes-100-Score',
        passNumber: 140,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r136.winningScore, r137.winningScore, r138.winningScore, r139.winningScore].join(' / '),
        verified: r136.winningScore === 100 && r137.winningScore === 100 && r138.winningScore === 100 && r139.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-140-INFORMATION-GEOMETRY-PACBAYES-PHASE27-AUDIT',
      passNumber: 140,
      phase: 'Phase XXVII: Information Geometry, Fisher-Rao Natural Gradients, Wasserstein & PAC-Bayes',
      generatedAt: '2026-11-09T20:04:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass136Sha256: r136.sha256,
        pass137Sha256: r137.sha256,
        pass138Sha256: r138.sha256,
        pass139Sha256: r139.sha256
      }
    };
    result.phase27Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass140Phase27Audit: runPass140Phase27Audit
  };
});
