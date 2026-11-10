/**
 * ALIVE Pass 120: Phase XXIII Spectral, Wavelet & Laplace Neural Operator
 * Acceptance Matrix (F1..F10) & Cryptographic SHA-256 Freeze
 * =======================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p116 = null;
  var p117 = null;
  var p118 = null;
  var p119 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p116 = require('./alive-fourier-neural-operator-fno-spectral-weights.js');
    p117 = require('./alive-wavelet-neural-operator-multi-resolution.js');
    p118 = require('./alive-laplace-neural-operator-pole-residue-weights.js');
    p119 = require('./alive-chebnet-cayleynet-spectral-graph-weights.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p116 = root.AliveFourierNeuralOperatorFnoSpectralWeights;
    p117 = root.AliveWaveletNeuralOperatorMultiResolution;
    p118 = root.AliveLaplaceNeuralOperatorPoleResidueWeights;
    p119 = root.AliveChebnetCayleynetSpectralGraphWeights;
  }
  var api = factory(engine, p116, p117, p118, p119);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveSpectralOperatorWaveletPhase23Audit = api;
    root.ALIVESpectralOperatorWaveletPhase23Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p116, p117, p118, p119) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass120Phase23Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r116 = p116.runPass116Evaluation({ seeds: seeds, episodes: 24 });
    var r117 = p117.runPass117Evaluation({ seeds: seeds, episodes: 24 });
    var r118 = p118.runPass118Evaluation({ seeds: seeds, episodes: 24 });
    var r119 = p119.runPass119Evaluation({ seeds: seeds, episodes: 24 });

    var w116 = r116.profiles[r116.winningProfileId].stats;
    var w117 = r117.profiles[r117.winningProfileId].stats;
    var w118 = r118.profiles[r118.winningProfileId].stats;
    var w119 = r119.profiles[r119.winningProfileId].stats;

    var rows = [
      {
        rowId: 'F1-FNO-ZeroShot-4x-SuperResolution-L2-Error',
        passNumber: 116,
        metric: 'superResolutionErrorL2',
        threshold: '<= 1e-9',
        observed: w116.superResolutionErrorL2.mean,
        verified: w116.superResolutionErrorL2.mean <= 1e-9
      },
      {
        rowId: 'F2-FNO-Parseval-Spectral-Energy-Conservation',
        passNumber: 116,
        metric: 'parsevalEnergyConservationPct',
        threshold: '=== 100.0%',
        observed: w116.parsevalEnergyConservationPct.mean,
        verified: w116.parsevalEnergyConservationPct.mean === 100
      },
      {
        rowId: 'F3-WNO-Orthogonal-Haar-DWT-Perfect-Reconstruction',
        passNumber: 117,
        metric: 'perfectReconstructionDefect',
        threshold: '<= 1e-9',
        observed: w117.perfectReconstructionDefect.mean,
        verified: w117.perfectReconstructionDefect.mean <= 1e-9
      },
      {
        rowId: 'F4-WNO-Shock-Discontinuity-Wavelet-Localization',
        passNumber: 117,
        metric: 'shockDiscontinuityLocalizationPct',
        threshold: '=== 100.0%',
        observed: w117.shockDiscontinuityLocalizationPct.mean,
        verified: w117.shockDiscontinuityLocalizationPct.mean === 100
      },
      {
        rowId: 'F5-LNO-Hurwitz-Left-Half-Plane-Pole-Bias-Stability',
        passNumber: 118,
        metric: 'hurwitzPoleStabilityPct',
        threshold: '=== 100.0%',
        observed: w118.hurwitzPoleStabilityPct.mean,
        verified: w118.hurwitzPoleStabilityPct.mean === 100
      },
      {
        rowId: 'F6-LNO-Transient-And-SteadyState-Stiff-Tracking-RMSE',
        passNumber: 118,
        metric: 'stiffDecayTrackingRmse',
        threshold: '<= 0.005',
        observed: w118.stiffDecayTrackingRmse.mean,
        verified: w118.stiffDecayTrackingRmse.mean <= 0.005
      },
      {
        rowId: 'F7-ChebNet-Strict-KHop-Spatial-Support-Localization',
        passNumber: 119,
        metric: 'khopLocalizationExactnessPct',
        threshold: '=== 100.0%',
        observed: w119.khopLocalizationExactnessPct.mean,
        verified: w119.khopLocalizationExactnessPct.mean === 100
      },
      {
        rowId: 'F8-CayleyNet-Spectral-Band-Selectivity-Ratio',
        passNumber: 119,
        metric: 'spectralBandSelectivityRatio',
        threshold: '>= 15.0',
        observed: w119.spectralBandSelectivityRatio.mean,
        verified: w119.spectralBandSelectivityRatio.mean >= 15.0
      },
      {
        rowId: 'F9-ChebNet-Anti-Oversmoothing-Dirichlet-Energy',
        passNumber: 119,
        metric: 'dirichletEnergyPreservationPct',
        threshold: '=== 100.0%',
        observed: w119.dirichletEnergyPreservationPct.mean,
        verified: w119.dirichletEnergyPreservationPct.mean === 100
      },
      {
        rowId: 'F10-Phase23-All-Four-Spectral-Operator-Passes-100-Score',
        passNumber: 120,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r116.winningScore, r117.winningScore, r118.winningScore, r119.winningScore].join(' / '),
        verified: r116.winningScore === 100 && r117.winningScore === 100 && r118.winningScore === 100 && r119.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-120-SPECTRAL-OPERATOR-WAVELET-PHASE23-AUDIT',
      passNumber: 120,
      phase: 'Phase XXIII: Spectral, Wavelet & Laplace Neural Operators',
      generatedAt: '2026-11-09T19:44:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass116Sha256: r116.sha256,
        pass117Sha256: r117.sha256,
        pass118Sha256: r118.sha256,
        pass119Sha256: r119.sha256
      }
    };
    result.phase23Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass120Phase23Audit: runPass120Phase23Audit
  };
});
