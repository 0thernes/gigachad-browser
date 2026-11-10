/**
 * ALIVE Pass 115: Phase XXII Tensor Network, MERA & Monarch Structured Weight
 * Acceptance Matrix (R1..R10) & Cryptographic SHA-256 Freeze
 * ===========================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p111 = null;
  var p112 = null;
  var p113 = null;
  var p114 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p111 = require('./alive-tensor-train-mps-matrix-product-weights.js');
    p112 = require('./alive-tucker-cp-higher-order-weight-tensor.js');
    p113 = require('./alive-mera-multiscale-entanglement-renormalization.js');
    p114 = require('./alive-monarch-butterfly-fft-structured-weights.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p111 = root.AliveTensorTrainMpsMatrixProductWeights;
    p112 = root.AliveTuckerCpHigherOrderWeightTensor;
    p113 = root.AliveMeraMultiscaleEntanglementRenormalization;
    p114 = root.AliveMonarchButterflyFftStructuredWeights;
  }
  var api = factory(engine, p111, p112, p113, p114);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveTensorNetworkMonarchPhase22Audit = api;
    root.ALIVETensorNetworkMonarchPhase22Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p111, p112, p113, p114) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass115Phase22Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r111 = p111.runPass111Evaluation({ seeds: seeds, episodes: 24 });
    var r112 = p112.runPass112Evaluation({ seeds: seeds, episodes: 24 });
    var r113 = p113.runPass113Evaluation({ seeds: seeds, episodes: 24 });
    var r114 = p114.runPass114Evaluation({ seeds: seeds, episodes: 24 });

    var w111 = r111.profiles[r111.winningProfileId].stats;
    var w112 = r112.profiles[r112.winningProfileId].stats;
    var w113 = r113.profiles[r113.winningProfileId].stats;
    var w114 = r114.profiles[r114.winningProfileId].stats;

    var rows = [
      {
        rowId: 'R1-TT-MPS-Parameter-Compression-Ratio',
        passNumber: 111,
        metric: 'parameterCompressionRatio',
        threshold: '>= 50.0x',
        observed: w111.parameterCompressionRatio.mean,
        verified: w111.parameterCompressionRatio.mean >= 50.0
      },
      {
        rowId: 'R2-TT-MPS-Left-Canonical-Stiefel-Gauge-Defect',
        passNumber: 111,
        metric: 'leftCanonicalGaugeDefect',
        threshold: '<= 1e-6',
        observed: w111.leftCanonicalGaugeDefect.mean,
        verified: w111.leftCanonicalGaugeDefect.mean <= 1e-6
      },
      {
        rowId: 'R3-Tucker-HOOI-Mode-Factor-Orthogonality-Defect',
        passNumber: 112,
        metric: 'modeFactorOrthoDefect',
        threshold: '<= 1e-6',
        observed: w112.modeFactorOrthoDefect.mean,
        verified: w112.modeFactorOrthoDefect.mean <= 1e-6
      },
      {
        rowId: 'R4-Tucker-HOOI-Explained-Subspace-Variance',
        passNumber: 112,
        metric: 'explainedTensorVariancePct',
        threshold: '=== 100.0%',
        observed: w112.explainedTensorVariancePct.mean,
        verified: w112.explainedTensorVariancePct.mean === 100
      },
      {
        rowId: 'R5-MERA-Disentangler-And-Isometry-Unitarity-Defect',
        passNumber: 113,
        metric: 'isometryUnitarityDefect',
        threshold: '<= 1e-6',
        observed: w113.isometryUnitarityDefect.mean,
        verified: w113.isometryUnitarityDefect.mean <= 1e-6
      },
      {
        rowId: 'R6-MERA-Causal-Cone-Norm-And-Correlation-Retention',
        passNumber: 113,
        metric: 'causalConeNormPreservationPct',
        threshold: '=== 100.0%',
        observed: w113.causalConeNormPreservationPct.mean,
        verified: w113.causalConeNormPreservationPct.mean === 100
      },
      {
        rowId: 'R7-Monarch-SubQuadratic-FLOP-Reduction-Factor',
        passNumber: 114,
        metric: 'flopReductionFactor',
        threshold: '>= 4.0x',
        observed: w114.flopReductionFactor.mean,
        verified: w114.flopReductionFactor.mean >= 4.0
      },
      {
        rowId: 'R8-Monarch-Global-AllToAll-Receptive-Field-Connectivity',
        passNumber: 114,
        metric: 'globalReceptiveConnectivityPct',
        threshold: '=== 100.0%',
        observed: w114.globalReceptiveConnectivityPct.mean,
        verified: w114.globalReceptiveConnectivityPct.mean === 100
      },
      {
        rowId: 'R9-Monarch-Orthogonal-Block-Norm-Preservation',
        passNumber: 114,
        metric: 'orthogonalNormPreservationDefect',
        threshold: '<= 1e-9',
        observed: w114.orthogonalNormPreservationDefect.mean,
        verified: w114.orthogonalNormPreservationDefect.mean <= 1e-9
      },
      {
        rowId: 'R10-Phase22-All-Four-Tensor-Network-Passes-100-Score',
        passNumber: 115,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r111.winningScore, r112.winningScore, r113.winningScore, r114.winningScore].join(' / '),
        verified: r111.winningScore === 100 && r112.winningScore === 100 && r113.winningScore === 100 && r114.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-115-TENSOR-NETWORK-MONARCH-PHASE22-AUDIT',
      passNumber: 115,
      phase: 'Phase XXII: Tensor Networks, MERA & Monarch Structured Weights',
      generatedAt: '2026-11-09T19:39:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass111Sha256: r111.sha256,
        pass112Sha256: r112.sha256,
        pass113Sha256: r113.sha256,
        pass114Sha256: r114.sha256
      }
    };
    result.phase22Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass115Phase22Audit: runPass115Phase22Audit
  };
});
