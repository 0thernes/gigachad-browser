/**
 * ALIVE Pass 60 — Phase XI Sequence & State-Space Architecture Acceptance Matrix (A1..A10) & SHA-256 Freeze
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory({
      engine: require('./alive-programmed-weights-biases-engine.js'),
      pass56: require('./alive-mamba2-ssd-state-space-duality.js'),
      pass57: require('./alive-mla-multi-head-latent-attention.js'),
      pass58: require('./alive-xlstm-exponential-matrix-memory.js'),
      pass59: require('./alive-griffin-rglru-hybrid-recurrent.js')
    });
  } else {
    var api = factory({
      engine: root.AliveProgrammedWeightsBiasesEngine,
      pass56: root.AliveMamba2SsdStateSpaceDuality,
      pass57: root.AliveMlaMultiHeadLatentAttention,
      pass58: root.AliveXlstmExponentialMatrixMemory,
      pass59: root.AliveGriffinRglruHybridRecurrent
    });
    root.AliveSequenceArchitecturesPhase11Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';

  var engine = deps.engine;
  var DEFAULT_SEEDS = engine.DEFAULT_SEEDS;

  var PHASE11_ACCEPTANCE_ROWS = Object.freeze([
    { rowId: 'A1-Mamba2-SSD-Recurrent-To-Matrix-Duality', passRef: 56, thresholdDesc: 'SSD Duality Parity == 100%' },
    { rowId: 'A2-Mamba2-Selective-Associative-Recall', passRef: 56, thresholdDesc: 'Selective Recall == 100%' },
    { rowId: 'A3-MLA-Joint-KV-Cache-Reduction', passRef: 57, thresholdDesc: 'KV Cache Reduction >= 90%' },
    { rowId: 'A4-MLA-Decoupled-RoPE-Matrix-Absorption', passRef: 57, thresholdDesc: 'Matrix Absorption == 100%' },
    { rowId: 'A5-xLSTM-State-Tracking-Parity-Accuracy', passRef: 58, thresholdDesc: 'State Tracking == 100%' },
    { rowId: 'A6-xLSTM-Log-Stabilizer-Overflow-Immunity', passRef: 58, thresholdDesc: 'Overflow Immunity == 100%' },
    { rowId: 'A7-Griffin-RGLRU-4x-Horizon-Extrapolation', passRef: 59, thresholdDesc: '4x Extrapolation == 100%' },
    { rowId: 'A8-Griffin-Local-MQA-Exact-Needle-Copy', passRef: 59, thresholdDesc: 'Needle Copy == 100%' },
    { rowId: 'A9-RGLRU-Sqrt-Norm-Preserving-Invariance', passRef: 59, thresholdDesc: 'Norm Conservation == 100%' },
    { rowId: 'A10-Phase11-All-Sequence-Architectures-Verified', passRef: 60, thresholdDesc: 'All 4 Sequence Suites == 100.0' }
  ]);

  function runSequenceArchitecturesPhase11Audit(options) {
    options = options || {};
    var seeds = Array.isArray(options.seeds) && options.seeds.length > 0 ? options.seeds : DEFAULT_SEEDS;
    var p56 = deps.pass56.run({ seeds: seeds });
    var p57 = deps.pass57.run({ seeds: seeds });
    var p58 = deps.pass58.run({ seeds: seeds });
    var p59 = deps.pass59.run({ seeds: seeds });

    var w56 = p56.aggregatedByProfile['mamba2-ssd-1semiseparable-softplus-dt-bias'];
    var w57 = p57.aggregatedByProfile['full-mla-joint-kv-latent-decoupled-rope-absorption'];
    var w58 = p58.aggregatedByProfile['xlstm-stabilized-exp-gate-mlstm-matrix-memory'];
    var w59 = p59.aggregatedByProfile['griffin-rglru-norm-preserving-plus-local-mqa'];

    var matrixRows = PHASE11_ACCEPTANCE_ROWS.map(function (row) {
      var seedResults = seeds.map(function (seed, idx) {
        var r56 = w56.seedRuns[idx];
        var r57 = w57.seedRuns[idx];
        var r58 = w58.seedRuns[idx];
        var r59 = w59.seedRuns[idx];
        var passed = false;
        var val = 0;

        if (row.rowId === 'A1-Mamba2-SSD-Recurrent-To-Matrix-Duality') {
          passed = r56.recurrentToMatrixDualityParityPct === 100; val = r56.recurrentToMatrixDualityParityPct;
        } else if (row.rowId === 'A2-Mamba2-Selective-Associative-Recall') {
          passed = r56.selectiveAssociativeRecallPct === 100; val = r56.selectiveAssociativeRecallPct;
        } else if (row.rowId === 'A3-MLA-Joint-KV-Cache-Reduction') {
          passed = r57.kvCacheReductionPct >= 90.0; val = r57.kvCacheReductionPct;
        } else if (row.rowId === 'A4-MLA-Decoupled-RoPE-Matrix-Absorption') {
          passed = r57.matrixAbsorptionEquivalencePct === 100; val = r57.matrixAbsorptionEquivalencePct;
        } else if (row.rowId === 'A5-xLSTM-State-Tracking-Parity-Accuracy') {
          passed = r58.stateTrackingParityAccuracyPct === 100; val = r58.stateTrackingParityAccuracyPct;
        } else if (row.rowId === 'A6-xLSTM-Log-Stabilizer-Overflow-Immunity') {
          passed = r58.numericalOverflowImmunityPct === 100; val = r58.numericalOverflowImmunityPct;
        } else if (row.rowId === 'A7-Griffin-RGLRU-4x-Horizon-Extrapolation') {
          passed = r59.extrapolation4xHorizonAccuracyPct === 100; val = r59.extrapolation4xHorizonAccuracyPct;
        } else if (row.rowId === 'A8-Griffin-Local-MQA-Exact-Needle-Copy') {
          passed = r59.exactNeedleCopyFidelityPct === 100; val = r59.exactNeedleCopyFidelityPct;
        } else if (row.rowId === 'A9-RGLRU-Sqrt-Norm-Preserving-Invariance') {
          passed = r59.stateNormConservationPct === 100; val = r59.stateNormConservationPct;
        } else if (row.rowId === 'A10-Phase11-All-Sequence-Architectures-Verified') {
          passed = r56.compositeMamba2SsdScore === 100 && r57.compositeMlaScore === 100 && r58.compositeXlstmScore === 100 && r59.compositeGriffinScore === 100;
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
      passId: 'ALIVE-PASS-60-SEQUENCE-ARCHITECTURES-PHASE11-AUDIT',
      seeds: seeds,
      rows: matrixRows.map(function (r) { return { rowId: r.rowId, verified: r.verified, mean: r.mean }; })
    });

    return {
      passId: 'ALIVE-PASS-60-SEQUENCE-ARCHITECTURES-PHASE11-AUDIT',
      phase: 'Phase XI — Next-Generation Sequence & State-Space Neural Architectures',
      seeds: seeds.slice(),
      matrixRows: matrixRows,
      summary: {
        verifiedRowCount: verifiedRowCount,
        totalAcceptanceRows: PHASE11_ACCEPTANCE_ROWS.length,
        acceptanceScorePct: engine.roundMetric((verifiedRowCount / PHASE11_ACCEPTANCE_ROWS.length) * 100, 2),
        phase12ContinuousSplineReady: verifiedRowCount === PHASE11_ACCEPTANCE_ROWS.length,
        phase11SequenceFrozenDigestSha256: digest,
        matrixRows: matrixRows
      }
    };
  }

  return {
    DEFAULT_SEEDS: DEFAULT_SEEDS,
    PHASE11_ACCEPTANCE_ROWS: PHASE11_ACCEPTANCE_ROWS,
    runSequenceArchitecturesPhase11Audit: runSequenceArchitecturesPhase11Audit,
    run: runSequenceArchitecturesPhase11Audit
  };
});
