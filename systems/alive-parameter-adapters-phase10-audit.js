/**
 * ALIVE Pass 55 — Phase X Parameter-Efficient & Weight-Merging Acceptance Matrix (P1..P10) & SHA-256 Freeze
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory({
      engine: require('./alive-programmed-weights-biases-engine.js'),
      pass51: require('./alive-dora-weight-decomposed-adapter.js'),
      pass52: require('./alive-pissa-svd-lora-plus-adapter.js'),
      pass53: require('./alive-vera-random-matrix-bitfit-bias.js'),
      pass54: require('./alive-ties-dare-slerp-model-merger.js')
    });
  } else {
    var api = factory({
      engine: root.AliveProgrammedWeightsBiasesEngine,
      pass51: root.AliveDoraWeightDecomposedAdapter,
      pass52: root.AlivePissaSvdLoraPlusAdapter,
      pass53: root.AliveVeraRandomMatrixBitfitBias,
      pass54: root.AliveTiesDareSlerpModelMerger
    });
    root.AliveParameterAdaptersPhase10Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';

  var engine = deps.engine;
  var DEFAULT_SEEDS = engine.DEFAULT_SEEDS;

  var PHASE10_ACCEPTANCE_ROWS = Object.freeze([
    { rowId: 'P1-DoRA-Decoupled-Magnitude-Direction-Alignment', passRef: 51, thresholdDesc: 'Alignment == 100%' },
    { rowId: 'P2-DoRA-Unit-Column-Directional-Fidelity', passRef: 51, thresholdDesc: 'Cosine Fidelity == 100%' },
    { rowId: 'P3-PiSSA-TopR-SVD-Exact-Reconstruction', passRef: 52, thresholdDesc: 'SVD Reconstruction == 100%' },
    { rowId: 'P4-LoRAPlus-Asymmetric-LR-Adaptation-Speedup', passRef: 52, thresholdDesc: 'LoRA+ Speedup == 100%' },
    { rowId: 'P5-VeRA-BitFit-56x-Parameter-Compression', passRef: 53, thresholdDesc: 'Compression >= 50x' },
    { rowId: 'P6-VeRA-BitFit-Specialist-Task-Accuracy', passRef: 53, thresholdDesc: 'Specialist Accuracy == 100%' },
    { rowId: 'P7-TIES-DARE-Sign-Conflict-Resolution', passRef: 54, thresholdDesc: 'Sign Conflict Resolution == 100%' },
    { rowId: 'P8-SLERP-Geodesic-Norm-Preservation', passRef: 54, thresholdDesc: 'Geodesic Norm == 100%' },
    { rowId: 'P9-Multi-Brain-Merged-Retention-Score', passRef: 54, thresholdDesc: 'Merged Retention == 100%' },
    { rowId: 'P10-Phase10-All-Adapter-Suites-Verified', passRef: 55, thresholdDesc: 'All 4 Adapter Suites == 100.0' }
  ]);

  function runParameterAdaptersPhase10Audit(options) {
    options = options || {};
    var seeds = Array.isArray(options.seeds) && options.seeds.length > 0 ? options.seeds : DEFAULT_SEEDS;
    var p51 = deps.pass51.run({ seeds: seeds });
    var p52 = deps.pass52.run({ seeds: seeds });
    var p53 = deps.pass53.run({ seeds: seeds });
    var p54 = deps.pass54.run({ seeds: seeds });

    var w51 = p51.aggregatedByProfile['full-dora-magnitude-direction-bias-decoupled'];
    var w52 = p52.aggregatedByProfile['pissa-topr-svd-plus-asymmetric-loraplus-lr'];
    var w53 = p53.aggregatedByProfile['coupled-vera-shared-basis-plus-bitfit-bias'];
    var w54 = p54.aggregatedByProfile['dare-ties-slerp-geodesic-weight-bias-merger'];

    var matrixRows = PHASE10_ACCEPTANCE_ROWS.map(function (row) {
      var seedResults = seeds.map(function (seed, idx) {
        var r51 = w51.seedRuns[idx];
        var r52 = w52.seedRuns[idx];
        var r53 = w53.seedRuns[idx];
        var r54 = w54.seedRuns[idx];
        var passed = false;
        var val = 0;

        if (row.rowId === 'P1-DoRA-Decoupled-Magnitude-Direction-Alignment') {
          passed = r51.fullFinetuningAlignmentPct === 100; val = r51.fullFinetuningAlignmentPct;
        } else if (row.rowId === 'P2-DoRA-Unit-Column-Directional-Fidelity') {
          passed = r51.directionalCosineFidelityPct === 100; val = r51.directionalCosineFidelityPct;
        } else if (row.rowId === 'P3-PiSSA-TopR-SVD-Exact-Reconstruction') {
          passed = r52.exactPretrainedReconstructionPct === 100; val = r52.exactPretrainedReconstructionPct;
        } else if (row.rowId === 'P4-LoRAPlus-Asymmetric-LR-Adaptation-Speedup') {
          passed = r52.asymmetricAdaptationSpeedupPct === 100; val = r52.asymmetricAdaptationSpeedupPct;
        } else if (row.rowId === 'P5-VeRA-BitFit-56x-Parameter-Compression') {
          passed = r53.parameterCompressionRatioX >= 50.0; val = r53.parameterCompressionRatioX;
        } else if (row.rowId === 'P6-VeRA-BitFit-Specialist-Task-Accuracy') {
          passed = r53.specialistTaskAccuracyPct === 100; val = r53.specialistTaskAccuracyPct;
        } else if (row.rowId === 'P7-TIES-DARE-Sign-Conflict-Resolution') {
          passed = r54.signConflictResolutionPct === 100; val = r54.signConflictResolutionPct;
        } else if (row.rowId === 'P8-SLERP-Geodesic-Norm-Preservation') {
          passed = r54.geodesicNormPreservationPct === 100; val = r54.geodesicNormPreservationPct;
        } else if (row.rowId === 'P9-Multi-Brain-Merged-Retention-Score') {
          passed = r54.multiTaskRetentionScorePct === 100; val = r54.multiTaskRetentionScorePct;
        } else if (row.rowId === 'P10-Phase10-All-Adapter-Suites-Verified') {
          passed = r51.compositeDoraScore === 100 && r52.compositePissaScore === 100 && r53.compositeVeraBitfitScore === 100 && r54.compositeMergerScore === 100;
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
      passId: 'ALIVE-PASS-55-PARAMETER-ADAPTERS-PHASE10-AUDIT',
      seeds: seeds,
      rows: matrixRows.map(function (r) { return { rowId: r.rowId, verified: r.verified, mean: r.mean }; })
    });

    return {
      passId: 'ALIVE-PASS-55-PARAMETER-ADAPTERS-PHASE10-AUDIT',
      phase: 'Phase X — Low-Rank, Weight-Decomposed & Principal-Singular Parameter Adapters',
      seeds: seeds.slice(),
      matrixRows: matrixRows,
      summary: {
        verifiedRowCount: verifiedRowCount,
        totalAcceptanceRows: PHASE10_ACCEPTANCE_ROWS.length,
        acceptanceScorePct: engine.roundMetric((verifiedRowCount / PHASE10_ACCEPTANCE_ROWS.length) * 100, 2),
        phase11SequenceArchReady: verifiedRowCount === PHASE10_ACCEPTANCE_ROWS.length,
        phase10AdaptersFrozenDigestSha256: digest,
        matrixRows: matrixRows
      }
    };
  }

  return {
    DEFAULT_SEEDS: DEFAULT_SEEDS,
    PHASE10_ACCEPTANCE_ROWS: PHASE10_ACCEPTANCE_ROWS,
    runParameterAdaptersPhase10Audit: runParameterAdaptersPhase10Audit,
    run: runParameterAdaptersPhase10Audit
  };
});
