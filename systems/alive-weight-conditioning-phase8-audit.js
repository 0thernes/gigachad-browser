/**
 * ALIVE Pass 45 — Phase VIII Weight & Bias Conditioning Acceptance Matrix (W1..W10) & SHA-256 Freeze
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory({
      engine: require('./alive-programmed-weights-biases-engine.js'),
      pass41: require('./alive-stiefel-orthogonal-weight-bias-init.js'),
      pass42: require('./alive-spectral-norm-lipschitz-conditioner.js'),
      pass43: require('./alive-mup-maximal-update-parameterization.js'),
      pass44: require('./alive-rmsnorm-rezero-residual-conditioning.js')
    });
  } else {
    var api = factory({
      engine: root.AliveProgrammedWeightsBiasesEngine,
      pass41: root.AliveStiefelOrthogonalWeightBiasInit,
      pass42: root.AliveSpectralNormLipschitzConditioner,
      pass43: root.AliveMupMaximalUpdateParameterization,
      pass44: root.AliveRmsnormRezeroResidualConditioning
    });
    root.AliveWeightConditioningPhase8Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';

  var engine = deps.engine;
  var DEFAULT_SEEDS = engine.DEFAULT_SEEDS;

  var PHASE8_ACCEPTANCE_ROWS = Object.freeze([
    { rowId: 'W1-Stiefel-QR-Orthogonality-Fidelity', passRef: 41, thresholdDesc: 'Orthogonality == 100%' },
    { rowId: 'W2-Analytic-Chrono-And-Gate-Bias-Retention', passRef: 41, thresholdDesc: 'Chrono Bias Retention == 100%' },
    { rowId: 'W3-Stiefel-Superiority-Over-Naive-Init', passRef: 41, thresholdDesc: 'Gain vs Naive >= +75.0' },
    { rowId: 'W4-Power-Iteration-1Lipschitz-Compliance', passRef: 42, thresholdDesc: '1-Lipschitz Compliance == 100%' },
    { rowId: 'W5-Deep-Jacobian-Spectral-Radius-Stability', passRef: 42, thresholdDesc: 'Spectral Deviation < 1e-6' },
    { rowId: 'W6-MuP-Width-Invariant-ZeroShot-Transfer', passRef: 43, thresholdDesc: 'muP Transfer == 100%' },
    { rowId: 'W7-MuP-Feature-Evolution-Coordinate-Check', passRef: 43, thresholdDesc: 'Optimal LR Shift == 0.0' },
    { rowId: 'W8-PreRMSNorm-ReZero-64Layer-Signal', passRef: 44, thresholdDesc: '64-Layer Preservation == 100%' },
    { rowId: 'W9-QKNorm-Effective-Rank-Retention', passRef: 44, thresholdDesc: 'Rank Retention == 100%' },
    { rowId: 'W10-Runtime-Primary-Cortex-Hub-Weight-Programming', passRef: 45, thresholdDesc: '13 Runtime Tensors Programmed' }
  ]);

  function runWeightConditioningPhase8Audit(options) {
    options = options || {};
    var seeds = Array.isArray(options.seeds) && options.seeds.length > 0 ? options.seeds : DEFAULT_SEEDS;
    var p41 = deps.pass41.run({ seeds: seeds });
    var p42 = deps.pass42.run({ seeds: seeds });
    var p43 = deps.pass43.run({ seeds: seeds });
    var p44 = deps.pass44.run({ seeds: seeds });

    var w41 = p41.aggregatedByProfile['stiefel-qr-orthogonal-chrono-gate-bias'];
    var w42 = p42.aggregatedByProfile['exact-power-iteration-1lipschitz-rescaler'];
    var w43 = p43.aggregatedByProfile['full-mup-width-invariant-weight-bias-lr-scaling'];
    var w44 = p44.aggregatedByProfile['pre-rmsnorm-qknorm-rezero-affine-conditioned'];

    var mockRuntime = {
      W_actor: new Float32Array(80),
      W_metamorph: new Float32Array(30),
      W_critic: new Float32Array(16),
      W_world: new Float32Array(256),
      deepCortex: {
        W_enc1: new Float32Array(16384),
        b_enc1: new Float32Array(256),
        W_enc2: new Float32Array(32768),
        b_enc2: new Float32Array(128),
        W_rssm_rec: new Float32Array(16384)
      },
      trainableHub: {
        W_perc_enc: new Float32Array(256),
        b_perc_enc: new Float32Array(16),
        W_dyn1: new Float32Array(384),
        b_dyn1: new Float32Array(16)
      }
    };

    var matrixRows = PHASE8_ACCEPTANCE_ROWS.map(function (row) {
      var seedResults = seeds.map(function (seed, idx) {
        var r41 = w41.seedRuns[idx];
        var r42 = w42.seedRuns[idx];
        var r43 = w43.seedRuns[idx];
        var r44 = w44.seedRuns[idx];
        var passed = false;
        var val = 0;

        if (row.rowId === 'W1-Stiefel-QR-Orthogonality-Fidelity') {
          passed = r41.orthogonalityFidelityPct === 100; val = r41.orthogonalityFidelityPct;
        } else if (row.rowId === 'W2-Analytic-Chrono-And-Gate-Bias-Retention') {
          passed = r41.chronoBiasLongHorizonRetentionPct === 100; val = r41.chronoBiasLongHorizonRetentionPct;
        } else if (row.rowId === 'W3-Stiefel-Superiority-Over-Naive-Init') {
          passed = p41.summary.gainVsBaseline >= 75.0; val = p41.summary.gainVsBaseline;
        } else if (row.rowId === 'W4-Power-Iteration-1Lipschitz-Compliance') {
          passed = r42.lipschitzBoundCompliancePct === 100; val = r42.lipschitzBoundCompliancePct;
        } else if (row.rowId === 'W5-Deep-Jacobian-Spectral-Radius-Stability') {
          passed = r42.spectralRadiusDeviation < 1e-6; val = r42.spectralRadiusDeviation;
        } else if (row.rowId === 'W6-MuP-Width-Invariant-ZeroShot-Transfer') {
          passed = r43.hyperparameterTransferZeroShotPct === 100; val = r43.hyperparameterTransferZeroShotPct;
        } else if (row.rowId === 'W7-MuP-Feature-Evolution-Coordinate-Check') {
          passed = r43.optimalLrShiftLog10 === 0; val = r43.featureEvolutionCoordCheckPct;
        } else if (row.rowId === 'W8-PreRMSNorm-ReZero-64Layer-Signal') {
          passed = r44.deep64LayerSignalPreservationPct === 100; val = r44.deep64LayerSignalPreservationPct;
        } else if (row.rowId === 'W9-QKNorm-Effective-Rank-Retention') {
          passed = r44.effectiveRankRetentionPct === 100; val = r44.effectiveRankRetentionPct;
        } else if (row.rowId === 'W10-Runtime-Primary-Cortex-Hub-Weight-Programming') {
          var receipt = engine.programRuntimeWeightsAndBiases(mockRuntime, seed);
          passed = receipt.programmedTensorCount === 13; val = receipt.programmedTensorCount;
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
      passId: 'ALIVE-PASS-45-WEIGHT-CONDITIONING-PHASE8-AUDIT',
      seeds: seeds,
      rows: matrixRows.map(function (r) { return { rowId: r.rowId, verified: r.verified, mean: r.mean }; })
    });

    return {
      passId: 'ALIVE-PASS-45-WEIGHT-CONDITIONING-PHASE8-AUDIT',
      phase: 'Phase VIII — Spectral, Orthogonal & Riemannian Weight-and-Bias Initialization & Parameter Conditioning',
      seeds: seeds.slice(),
      matrixRows: matrixRows,
      summary: {
        verifiedRowCount: verifiedRowCount,
        totalAcceptanceRows: PHASE8_ACCEPTANCE_ROWS.length,
        acceptanceScorePct: engine.roundMetric((verifiedRowCount / PHASE8_ACCEPTANCE_ROWS.length) * 100, 2),
        phase9OptimizerReady: verifiedRowCount === PHASE8_ACCEPTANCE_ROWS.length,
        phase8WeightConditioningFrozenDigestSha256: digest,
        matrixRows: matrixRows
      }
    };
  }

  return {
    DEFAULT_SEEDS: DEFAULT_SEEDS,
    PHASE8_ACCEPTANCE_ROWS: PHASE8_ACCEPTANCE_ROWS,
    runWeightConditioningPhase8Audit: runWeightConditioningPhase8Audit,
    run: runWeightConditioningPhase8Audit
  };
});
