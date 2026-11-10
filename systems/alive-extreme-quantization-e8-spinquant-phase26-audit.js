/**
 * ALIVE Pass 135: Phase XXVI QuIP#, AQLM, SpinQuant & MXFP Extreme Quantization
 * Acceptance Matrix (Y1..Y10) & Cryptographic SHA-256 Freeze
 * =============================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p131 = null;
  var p132 = null;
  var p133 = null;
  var p134 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p131 = require('./alive-quip-sharp-hadamard-e8-lattice-quantizer.js');
    p132 = require('./alive-aqlm-additive-multi-codebook-weight-quantizer.js');
    p133 = require('./alive-spinquant-cayley-orthogonal-outlier-remover.js');
    p134 = require('./alive-fp8-e4m3-e5m2-microscaling-mx-block-weights.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p131 = root.AliveQuipSharpHadamardE8LatticeQuantizer;
    p132 = root.AliveAqlmAdditiveMultiCodebookWeightQuantizer;
    p133 = root.AliveSpinquantCayleyOrthogonalOutlierRemover;
    p134 = root.AliveFp8E4m3E5m2MicroscalingMxBlockWeights;
  }
  var api = factory(engine, p131, p132, p133, p134);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveExtremeQuantizationE8SpinquantPhase26Audit = api;
    root.ALIVEExtremeQuantizationE8SpinquantPhase26Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p131, p132, p133, p134) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass135Phase26Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r131 = p131.runPass131Evaluation({ seeds: seeds, episodes: 24 });
    var r132 = p132.runPass132Evaluation({ seeds: seeds, episodes: 24 });
    var r133 = p133.runPass133Evaluation({ seeds: seeds, episodes: 24 });
    var r134 = p134.runPass134Evaluation({ seeds: seeds, episodes: 24 });

    var w131 = r131.profiles[r131.winningProfileId].stats;
    var w132 = r132.profiles[r132.winningProfileId].stats;
    var w133 = r133.profiles[r133.winningProfileId].stats;
    var w134 = r134.profiles[r134.winningProfileId].stats;

    var rows = [
      {
        rowId: 'Y1-QuIPSharp-Hadamard-Incoherence-Outlier-Reduction',
        passNumber: 131,
        metric: 'incoherenceMaxRatioReduction',
        threshold: '>= 2.0x',
        observed: w131.incoherenceMaxRatioReduction.mean,
        verified: w131.incoherenceMaxRatioReduction.mean >= 2.0
      },
      {
        rowId: 'Y2-QuIPSharp-Gosset-E8-Lattice-2Bit-SQNR',
        passNumber: 131,
        metric: 'e8PackingSignalToQuantNoiseDb',
        threshold: '>= 18.0 dB',
        observed: w131.e8PackingSignalToQuantNoiseDb.mean,
        verified: w131.e8PackingSignalToQuantNoiseDb.mean >= 18.0
      },
      {
        rowId: 'Y3-AQLM-Multi-Codebook-Relative-Reconstruction-Error',
        passNumber: 132,
        metric: 'layerOutputRelativeErrorPct',
        threshold: '<= 1.0%',
        observed: w132.layerOutputRelativeErrorPct.mean,
        verified: w132.layerOutputRelativeErrorPct.mean <= 1.0
      },
      {
        rowId: 'Y4-AQLM-Beam-Search-Codeword-Optimality',
        passNumber: 132,
        metric: 'beamSearchCodewordOptimalityPct',
        threshold: '=== 100.0%',
        observed: w132.beamSearchCodewordOptimalityPct.mean,
        verified: w132.beamSearchCodewordOptimalityPct.mean === 100
      },
      {
        rowId: 'Y5-SpinQuant-Cayley-Rotation-Kurtosis-Suppression',
        passNumber: 133,
        metric: 'postRotationKurtosis',
        threshold: '<= 3.6',
        observed: w133.postRotationKurtosis.mean,
        verified: w133.postRotationKurtosis.mean <= 3.6
      },
      {
        rowId: 'Y6-SpinQuant-ZeroOverhead-Weight-Bias-Fusion-Equivalence',
        passNumber: 133,
        metric: 'rotationFusionEquivalenceDefect',
        threshold: '<= 1e-9',
        observed: w133.rotationFusionEquivalenceDefect.mean,
        verified: w133.rotationFusionEquivalenceDefect.mean <= 1e-9
      },
      {
        rowId: 'Y7-SpinQuant-W4A4-Accuracy-Retention',
        passNumber: 133,
        metric: 'w4a4QuantizedAccuracyRetentionPct',
        threshold: '>= 99.0%',
        observed: w133.w4a4QuantizedAccuracyRetentionPct.mean,
        verified: w133.w4a4QuantizedAccuracyRetentionPct.mean >= 99.0
      },
      {
        rowId: 'Y8-MXFP8-Stochastic-Rounding-Unbiased-Subgrid-Drift',
        passNumber: 134,
        metric: 'stochasticRoundingBiasDrift',
        threshold: '<= 0.12',
        observed: w134.stochasticRoundingBiasDrift.mean,
        verified: w134.stochasticRoundingBiasDrift.mean <= 0.12
      },
      {
        rowId: 'Y9-MXFP8-Block32-Shared-Exponent-Dynamic-Range',
        passNumber: 134,
        metric: 'block32DynamicRangeDb',
        threshold: '>= 110.0 dB',
        observed: w134.block32DynamicRangeDb.mean,
        verified: w134.block32DynamicRangeDb.mean >= 110.0
      },
      {
        rowId: 'Y10-Phase26-All-Four-Extreme-Quantization-Passes-100-Score',
        passNumber: 135,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r131.winningScore, r132.winningScore, r133.winningScore, r134.winningScore].join(' / '),
        verified: r131.winningScore === 100 && r132.winningScore === 100 && r133.winningScore === 100 && r134.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-135-EXTREME-QUANTIZATION-E8-SPINQUANT-PHASE26-AUDIT',
      passNumber: 135,
      phase: 'Phase XXVI: QuIP#, AQLM, SpinQuant & MXFP Extreme Quantization',
      generatedAt: '2026-11-09T19:59:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass131Sha256: r131.sha256,
        pass132Sha256: r132.sha256,
        pass133Sha256: r133.sha256,
        pass134Sha256: r134.sha256
      }
    };
    result.phase26Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass135Phase26Audit: runPass135Phase26Audit
  };
});
