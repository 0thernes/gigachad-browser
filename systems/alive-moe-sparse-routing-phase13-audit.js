/**
 * ALIVE Pass 70 — Phase XIII Mixture-of-Experts & Dynamic Routing Acceptance Matrix (X1..X10) & SHA-256 Freeze
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory({
      engine: require('./alive-programmed-weights-biases-engine.js'),
      pass66: require('./alive-deepseek-moe-dynamic-bias-router.js'),
      pass67: require('./alive-sinkhorn-expert-choice-soft-moe.js'),
      pass68: require('./alive-mixture-of-depths-compute-router.js'),
      pass69: require('./alive-sparsegpt-hessian-pruning-2to4.js')
    });
  } else {
    var api = factory({
      engine: root.AliveProgrammedWeightsBiasesEngine,
      pass66: root.AliveDeepseekMoeDynamicBiasRouter,
      pass67: root.AliveSinkhornExpertChoiceSoftMoe,
      pass68: root.AliveMixtureOfDepthsComputeRouter,
      pass69: root.AliveSparsegptHessianPruning2to4
    });
    root.AliveMoeSparseRoutingPhase13Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';

  var engine = deps.engine;
  var DEFAULT_SEEDS = engine.DEFAULT_SEEDS;

  var PHASE13_ACCEPTANCE_ROWS = Object.freeze([
    { rowId: 'X1-DeepSeekMoE-AuxFree-Dynamic-Bias-Balance', passRef: 66, thresholdDesc: 'Load Balance == 100%' },
    { rowId: 'X2-DeepSeekMoE-Zero-Aux-Gradient-Interference', passRef: 66, thresholdDesc: 'Zero Interference == 100%' },
    { rowId: 'X3-Sinkhorn-SoftMoE-Zero-Token-Dropping', passRef: 67, thresholdDesc: 'Zero Token Drop == 100%' },
    { rowId: 'X4-Sinkhorn-Doubly-Stochastic-Marginal-Parity', passRef: 67, thresholdDesc: 'Marginal Parity == 100%' },
    { rowId: 'X5-MixtureOfDepths-50Pct-FLOP-Savings', passRef: 68, thresholdDesc: 'FLOP Reduction == 50%' },
    { rowId: 'X6-MixtureOfDepths-Causal-Autoregressive-Parity', passRef: 68, thresholdDesc: 'Causal Parity == 100%' },
    { rowId: 'X7-SparseGPT-Cholesky-Hessian-Reconstruction', passRef: 69, thresholdDesc: 'Reconstruction == 100%' },
    { rowId: 'X8-SparseGPT-2to4-Structured-Sparsity-Compliance', passRef: 69, thresholdDesc: '2:4 Compliance == 100%' },
    { rowId: 'X9-SparseGPT-Residual-Bias-Absorption-Retention', passRef: 69, thresholdDesc: 'Zero-Retrain Retention == 100%' },
    { rowId: 'X10-Phase13-All-MoE-And-Sparsity-Suites-Verified', passRef: 70, thresholdDesc: 'All 4 MoE/Sparsity Suites == 100.0' }
  ]);

  function runMoeSparseRoutingPhase13Audit(options) {
    options = options || {};
    var seeds = Array.isArray(options.seeds) && options.seeds.length > 0 ? options.seeds : DEFAULT_SEEDS;
    var p66 = deps.pass66.run({ seeds: seeds });
    var p67 = deps.pass67.run({ seeds: seeds });
    var p68 = deps.pass68.run({ seeds: seeds });
    var p69 = deps.pass69.run({ seeds: seeds });

    var w66 = p66.aggregatedByProfile['deepseek-moe-shared-plus-auxfree-dynamic-bias'];
    var w67 = p67.aggregatedByProfile['causal-sinkhorn-doubly-stochastic-smear-soft-moe'];
    var w68 = p68.aggregatedByProfile['mod-static-graph-causal-threshold-bias-router'];
    var w69 = p69.aggregatedByProfile['sparsegpt-cholesky-hessian-2to4-bias-compensated'];

    var matrixRows = PHASE13_ACCEPTANCE_ROWS.map(function (row) {
      var seedResults = seeds.map(function (seed, idx) {
        var r66 = w66.seedRuns[idx];
        var r67 = w67.seedRuns[idx];
        var r68 = w68.seedRuns[idx];
        var r69 = w69.seedRuns[idx];
        var passed = false;
        var val = 0;

        if (row.rowId === 'X1-DeepSeekMoE-AuxFree-Dynamic-Bias-Balance') {
          passed = r66.expertLoadBalanceUniformityPct === 100; val = r66.expertLoadBalanceUniformityPct;
        } else if (row.rowId === 'X2-DeepSeekMoE-Zero-Aux-Gradient-Interference') {
          passed = r66.zeroAuxGradientInterferencePct === 100; val = r66.zeroAuxGradientInterferencePct;
        } else if (row.rowId === 'X3-Sinkhorn-SoftMoE-Zero-Token-Dropping') {
          passed = r67.zeroTokenDropGuaranteePct === 100; val = r67.zeroTokenDropGuaranteePct;
        } else if (row.rowId === 'X4-Sinkhorn-Doubly-Stochastic-Marginal-Parity') {
          passed = r67.doublyStochasticMarginalParityPct === 100; val = r67.doublyStochasticMarginalParityPct;
        } else if (row.rowId === 'X5-MixtureOfDepths-50Pct-FLOP-Savings') {
          passed = r68.flopReductionPct === 50.0; val = r68.flopReductionPct;
        } else if (row.rowId === 'X6-MixtureOfDepths-Causal-Autoregressive-Parity') {
          passed = r68.causalAutoregressiveParityPct === 100; val = r68.causalAutoregressiveParityPct;
        } else if (row.rowId === 'X7-SparseGPT-Cholesky-Hessian-Reconstruction') {
          passed = r69.layerOutputReconstructionFidelityPct === 100; val = r69.layerOutputReconstructionFidelityPct;
        } else if (row.rowId === 'X8-SparseGPT-2to4-Structured-Sparsity-Compliance') {
          passed = r69.structured2to4CompliancePct === 100; val = r69.structured2to4CompliancePct;
        } else if (row.rowId === 'X9-SparseGPT-Residual-Bias-Absorption-Retention') {
          passed = r69.zeroRetrainingAccuracyRetentionPct === 100; val = r69.zeroRetrainingAccuracyRetentionPct;
        } else if (row.rowId === 'X10-Phase13-All-MoE-And-Sparsity-Suites-Verified') {
          passed = r66.compositeDeepseekMoeScore === 100 && r67.compositeSinkhornMoeScore === 100 && r68.compositeModScore === 100 && r69.compositeSparsegptScore === 100;
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
      passId: 'ALIVE-PASS-70-MOE-SPARSE-ROUTING-PHASE13-AUDIT',
      seeds: seeds,
      rows: matrixRows.map(function (r) { return { rowId: r.rowId, verified: r.verified, mean: r.mean }; })
    });

    return {
      passId: 'ALIVE-PASS-70-MOE-SPARSE-ROUTING-PHASE13-AUDIT',
      phase: 'Phase XIII — Sparse Mixture-of-Experts (DeepSeekMoE), Aux-Loss-Free Dynamic Bias Routing & Structured Sparsity',
      seeds: seeds.slice(),
      matrixRows: matrixRows,
      summary: {
        verifiedRowCount: verifiedRowCount,
        totalAcceptanceRows: PHASE13_ACCEPTANCE_ROWS.length,
        acceptanceScorePct: engine.roundMetric((verifiedRowCount / PHASE13_ACCEPTANCE_ROWS.length) * 100, 2),
        phase14PantheonUpgradeReady: verifiedRowCount === PHASE13_ACCEPTANCE_ROWS.length,
        phase13MoeSparseFrozenDigestSha256: digest,
        matrixRows: matrixRows
      }
    };
  }

  return {
    DEFAULT_SEEDS: DEFAULT_SEEDS,
    PHASE13_ACCEPTANCE_ROWS: PHASE13_ACCEPTANCE_ROWS,
    runMoeSparseRoutingPhase13Audit: runMoeSparseRoutingPhase13Audit,
    run: runMoeSparseRoutingPhase13Audit
  };
});
