/**
 * ALIVE Pass 50 — Phase IX Optimizer & Preconditioner Acceptance Matrix (O1..O10) & SHA-256 Freeze
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory({
      engine: require('./alive-programmed-weights-biases-engine.js'),
      pass46: require('./alive-muon-newton-schulz-optimizer.js'),
      pass47: require('./alive-kfac-natural-gradient-preconditioner.js'),
      pass48: require('./alive-sophia-lion-hessian-optimizer.js'),
      pass49: require('./alive-schedule-free-primal-dual-averager.js')
    });
  } else {
    var api = factory({
      engine: root.AliveProgrammedWeightsBiasesEngine,
      pass46: root.AliveMuonNewtonSchulzOptimizer,
      pass47: root.AliveKfacNaturalGradientPreconditioner,
      pass48: root.AliveSophiaLionHessianOptimizer,
      pass49: root.AliveScheduleFreePrimalDualAverager
    });
    root.AliveOptimizerPreconditionerPhase9Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';

  var engine = deps.engine;
  var DEFAULT_SEEDS = engine.DEFAULT_SEEDS;

  var PHASE9_ACCEPTANCE_ROWS = Object.freeze([
    { rowId: 'O1-Muon-NS5-Spectral-Isotropy', passRef: 46, thresholdDesc: 'Spectral Isotropy == 100%' },
    { rowId: 'O2-Muon-2D-Plus-AdamW-1D-Bias-Calibration', passRef: 46, thresholdDesc: 'Bias Calibration == 100%' },
    { rowId: 'O3-Muon-Superiority-Over-Vanilla-SGD', passRef: 46, thresholdDesc: 'Gain vs SGD >= +70.0' },
    { rowId: 'O4-KFAC-Tikhonov-KL-Trust-Region-Invariance', passRef: 47, thresholdDesc: 'KL Invariance == 100%' },
    { rowId: 'O5-KFAC-Homogeneous-Weight-Bias-Coupling', passRef: 47, thresholdDesc: 'Homogeneous Bias == 100%' },
    { rowId: 'O6-Sophia-Hutchinson-Saddle-Escape', passRef: 48, thresholdDesc: 'Saddle Escape == 100%' },
    { rowId: 'O7-Sophia-Lion-Clipped-Curvature-Safety', passRef: 48, thresholdDesc: 'Update Bound Safety == 100%' },
    { rowId: 'O8-ScheduleFree-Anytime-Stopping-Optimality', passRef: 49, thresholdDesc: 'Anytime Optimality == 100%' },
    { rowId: 'O9-Gradient-Centralized-Bias-Drift-Suppression', passRef: 49, thresholdDesc: 'Bias Drift Suppression == 100%' },
    { rowId: 'O10-Phase9-Cross-Optimizer-Convergence', passRef: 50, thresholdDesc: 'All 4 Optimizer Suites == 100.0' }
  ]);

  function runOptimizerPreconditionerPhase9Audit(options) {
    options = options || {};
    var seeds = Array.isArray(options.seeds) && options.seeds.length > 0 ? options.seeds : DEFAULT_SEEDS;
    var p46 = deps.pass46.run({ seeds: seeds });
    var p47 = deps.pass47.run({ seeds: seeds });
    var p48 = deps.pass48.run({ seeds: seeds });
    var p49 = deps.pass49.run({ seeds: seeds });

    var w46 = p46.aggregatedByProfile['hybrid-muon-ns5-2d-weights-adamw-1d-biases'];
    var w47 = p47.aggregatedByProfile['tikhonov-damped-homogeneous-kfac-natural-gradient'];
    var w48 = p48.aggregatedByProfile['sophia-hutchinson-clipped-hessian-lion-hybrid'];
    var w49 = p49.aggregatedByProfile['schedule-free-primal-dual-gradient-centralized'];

    var matrixRows = PHASE9_ACCEPTANCE_ROWS.map(function (row) {
      var seedResults = seeds.map(function (seed, idx) {
        var r46 = w46.seedRuns[idx];
        var r47 = w47.seedRuns[idx];
        var r48 = w48.seedRuns[idx];
        var r49 = w49.seedRuns[idx];
        var passed = false;
        var val = 0;

        if (row.rowId === 'O1-Muon-NS5-Spectral-Isotropy') {
          passed = r46.updateSpectralIsotropyPct === 100; val = r46.updateSpectralIsotropyPct;
        } else if (row.rowId === 'O2-Muon-2D-Plus-AdamW-1D-Bias-Calibration') {
          passed = r46.biasCalibrationStabilityPct === 100; val = r46.biasCalibrationStabilityPct;
        } else if (row.rowId === 'O3-Muon-Superiority-Over-Vanilla-SGD') {
          passed = p46.summary.gainVsBaseline >= 70.0; val = p46.summary.gainVsBaseline;
        } else if (row.rowId === 'O4-KFAC-Tikhonov-KL-Trust-Region-Invariance') {
          passed = r47.klTrustRegionInvariancePct === 100; val = r47.klTrustRegionInvariancePct;
        } else if (row.rowId === 'O5-KFAC-Homogeneous-Weight-Bias-Coupling') {
          passed = r47.homogeneousBiasCouplingAccuracyPct === 100; val = r47.homogeneousBiasCouplingAccuracyPct;
        } else if (row.rowId === 'O6-Sophia-Hutchinson-Saddle-Escape') {
          passed = r48.saddlePointEscapeRatePct === 100; val = r48.saddlePointEscapeRatePct;
        } else if (row.rowId === 'O7-Sophia-Lion-Clipped-Curvature-Safety') {
          passed = r48.updateBoundSafetyPct === 100; val = r48.updateBoundSafetyPct;
        } else if (row.rowId === 'O8-ScheduleFree-Anytime-Stopping-Optimality') {
          passed = r49.anytimeStoppingOptimalityPct === 100; val = r49.anytimeStoppingOptimalityPct;
        } else if (row.rowId === 'O9-Gradient-Centralized-Bias-Drift-Suppression') {
          passed = r49.biasDriftSuppressionPct === 100; val = r49.biasDriftSuppressionPct;
        } else if (row.rowId === 'O10-Phase9-Cross-Optimizer-Convergence') {
          passed = r46.compositeMuonScore === 100 && r47.compositeKfacScore === 100 && r48.compositeSophiaScore === 100 && r49.compositeScheduleFreeScore === 100;
          val = 100.0;
        }
        return { seed: seed, passed: passed, metricValue: val };
      });

      var stats = engine.computeDescriptiveStats(seedResults.map(function (s) { return s.metricValue; }));
      var passedSeeds = seedResults.filter(function (s) { return s.passed; }).length;
      return {
        rowId: row.rowId,
        passRef: row.passRef,
        thresholdDesc: row.thresholdDesc,
        mean: stats.mean,
        ci95: stats.ci95,
        passedSeeds: passedSeeds,
        totalSeeds: seeds.length,
        verified: passedSeeds === seeds.length,
        seedResults: seedResults
      };
    });

    var verifiedRowCount = matrixRows.filter(function (r) { return r.verified; }).length;
    var digest = engine.computeSha256Hex({
      passId: 'ALIVE-PASS-50-OPTIMIZER-PRECONDITIONER-PHASE9-AUDIT',
      seeds: seeds,
      rows: matrixRows.map(function (r) { return { rowId: r.rowId, verified: r.verified, mean: r.mean }; })
    });

    return {
      passId: 'ALIVE-PASS-50-OPTIMIZER-PRECONDITIONER-PHASE9-AUDIT',
      phase: 'Phase IX — Second-Order & Matrix-Preconditioned Weight-and-Bias Optimizers',
      seeds: seeds.slice(),
      matrixRows: matrixRows,
      summary: {
        verifiedRowCount: verifiedRowCount,
        totalAcceptanceRows: PHASE9_ACCEPTANCE_ROWS.length,
        acceptanceScorePct: engine.roundMetric((verifiedRowCount / PHASE9_ACCEPTANCE_ROWS.length) * 100, 2),
        phase10AdaptersReady: verifiedRowCount === PHASE9_ACCEPTANCE_ROWS.length,
        phase9OptimizerFrozenDigestSha256: digest,
        matrixRows: matrixRows
      }
    };
  }

  return {
    DEFAULT_SEEDS: DEFAULT_SEEDS,
    PHASE9_ACCEPTANCE_ROWS: PHASE9_ACCEPTANCE_ROWS,
    runOptimizerPreconditionerPhase9Audit: runOptimizerPreconditionerPhase9Audit,
    run: runOptimizerPreconditionerPhase9Audit
  };
});
