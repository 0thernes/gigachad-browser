/**
 * ALIVE Pass 180: Phase XXXV Loss Landscape Mode Connectivity (Git Re-Basin,
 * Bezier Curves, NTK & Fourier Features) Acceptance Matrix (W2_1..W2_10) & SHA-256 Freeze
 * =======================================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p176 = null;
  var p177 = null;
  var p178 = null;
  var p179 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p176 = require('./alive-git-rebasin-hungarian-weight-permutation.js');
    p177 = require('./alive-bezier-simplicial-mode-connectivity-curve.js');
    p178 = require('./alive-empirical-ntk-eigenvalue-condition-governor.js');
    p179 = require('./alive-tancik-fourier-feature-spectral-bias-cure.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p176 = root.AliveGitRebasinHungarianWeightPermutation;
    p177 = root.AliveBezierSimplicialModeConnectivityCurve;
    p178 = root.AliveEmpiricalNtkEigenvalueConditionGovernor;
    p179 = root.AliveTancikFourierFeatureSpectralBiasCure;
  }
  var api = factory(engine, p176, p177, p178, p179);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveRebasinModeConnectivityNtkPhase35Audit = api;
    root.ALIVERebasinModeConnectivityNtkPhase35Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p176, p177, p178, p179) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass180Phase35Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r176 = p176.runPass176Evaluation({ seeds: seeds, episodes: 24 });
    var r177 = p177.runPass177Evaluation({ seeds: seeds, episodes: 24 });
    var r178 = p178.runPass178Evaluation({ seeds: seeds, episodes: 24 });
    var r179 = p179.runPass179Evaluation({ seeds: seeds, episodes: 24 });

    var w176 = r176.profiles[r176.winningProfileId].stats;
    var w177 = r177.profiles[r177.winningProfileId].stats;
    var w178 = r178.profiles[r178.winningProfileId].stats;
    var w179 = r179.profiles[r179.winningProfileId].stats;

    var rows = [
      {
        rowId: 'W2_1-GitReBasin-Permutation-Function-Equivalence-Defect',
        passNumber: 176,
        metric: 'permutationFunctionEquivalenceDefect',
        threshold: '<= 1e-12',
        observed: w176.permutationFunctionEquivalenceDefect.mean,
        verified: w176.permutationFunctionEquivalenceDefect.mean <= 1e-12
      },
      {
        rowId: 'W2_2-GitReBasin-Midpoint-Interpolation-Zero-Barrier',
        passNumber: 176,
        metric: 'midpointInterpolationLossBarrier',
        threshold: '<= 1e-12',
        observed: w176.midpointInterpolationLossBarrier.mean,
        verified: w176.midpointInterpolationLossBarrier.mean <= 1e-12
      },
      {
        rowId: 'W2_3-Bezier-Curve-Zero-Saddle-Loss-Barrier',
        passNumber: 177,
        metric: 'maxLossBarrierAlongPath',
        threshold: '<= 1e-12',
        observed: w177.maxLossBarrierAlongPath.mean,
        verified: w177.maxLossBarrierAlongPath.mean <= 1e-12
      },
      {
        rowId: 'W2_4-Bezier-Curve-Endpoint-Boundary-Interpolation',
        passNumber: 177,
        metric: 'curveEndpointBoundaryDefect',
        threshold: '<= 1e-12',
        observed: w177.curveEndpointBoundaryDefect.mean,
        verified: w177.curveEndpointBoundaryDefect.mean <= 1e-12
      },
      {
        rowId: 'W2_5-Empirical-NTK-Spectral-Condition-Number',
        passNumber: 178,
        metric: 'ntkSpectralConditionNumber',
        threshold: '<= 1.25',
        observed: w178.ntkSpectralConditionNumber.mean,
        verified: w178.ntkSpectralConditionNumber.mean <= 1.25
      },
      {
        rowId: 'W2_6-Empirical-NTK-Slowest-Eigenmode-Convergence-Rate',
        passNumber: 178,
        metric: 'slowestEigenmodeConvergenceRatePct',
        threshold: '>= 99.0%',
        observed: w178.slowestEigenmodeConvergenceRatePct.mean,
        verified: w178.slowestEigenmodeConvergenceRatePct.mean >= 99.0
      },
      {
        rowId: 'W2_7-Fourier-Feature-Unit-Sphere-Isometry-Defect',
        passNumber: 179,
        metric: 'fourierFeatureIsometryNormDefect',
        threshold: '<= 1e-12',
        observed: w179.fourierFeatureIsometryNormDefect.mean,
        verified: w179.fourierFeatureIsometryNormDefect.mean <= 1e-12
      },
      {
        rowId: 'W2_8-Fourier-SIREN-High-Frequency-Reconstruction-PSNR',
        passNumber: 179,
        metric: 'highFrequencyReconstructionPsnrDb',
        threshold: '>= 36.0 dB',
        observed: w179.highFrequencyReconstructionPsnrDb.mean,
        verified: w179.highFrequencyReconstructionPsnrDb.mean >= 36.0
      },
      {
        rowId: 'W2_9-Fourier-Feature-Shift-Invariant-Stationary-NTK',
        passNumber: 179,
        metric: 'shiftInvarianceKernelStationarityPct',
        threshold: '=== 100.0%',
        observed: w179.shiftInvarianceKernelStationarityPct.mean,
        verified: w179.shiftInvarianceKernelStationarityPct.mean === 100
      },
      {
        rowId: 'W2_10-Phase35-All-Four-Mode-Connectivity-NTK-Passes-100-Score',
        passNumber: 180,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r176.winningScore, r177.winningScore, r178.winningScore, r179.winningScore].join(' / '),
        verified: r176.winningScore === 100 && r177.winningScore === 100 && r178.winningScore === 100 && r179.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-180-REBASIN-MODE-CONNECTIVITY-NTK-PHASE35-AUDIT',
      passNumber: 180,
      phase: 'Phase XXXV: Loss Landscape Mode Connectivity (Git Re-Basin, Bezier Curves, NTK & Fourier Features)',
      generatedAt: '2026-11-09T20:44:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass176Sha256: r176.sha256,
        pass177Sha256: r177.sha256,
        pass178Sha256: r178.sha256,
        pass179Sha256: r179.sha256
      }
    };
    result.phase35Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass180Phase35Audit: runPass180Phase35Audit
  };
});
