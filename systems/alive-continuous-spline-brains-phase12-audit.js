/**
 * ALIVE Pass 65 — Phase XII Continuous-Depth, Spline & Implicit Brain Acceptance Matrix (C1..C10) & SHA-256 Freeze
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory({
      engine: require('./alive-programmed-weights-biases-engine.js'),
      pass61: require('./alive-kan-kolmogorov-arnold-spline-net.js'),
      pass62: require('./alive-cfc-sltc-liquid-time-constant.js'),
      pass63: require('./alive-port-hamiltonian-symplectic-ode.js'),
      pass64: require('./alive-deq-deep-equilibrium-implicit-layer.js')
    });
  } else {
    var api = factory({
      engine: root.AliveProgrammedWeightsBiasesEngine,
      pass61: root.AliveKanKolmogorovArnoldSplineNet,
      pass62: root.AliveCfcSltcLiquidTimeConstant,
      pass63: root.AlivePortHamiltonianSymplecticOde,
      pass64: root.AliveDeqDeepEquilibriumImplicitLayer
    });
    root.AliveContinuousSplineBrainsPhase12Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';

  var engine = deps.engine;
  var DEFAULT_SEEDS = engine.DEFAULT_SEEDS;

  var PHASE12_ACCEPTANCE_ROWS = Object.freeze([
    { rowId: 'C1-KAN-Chebyshev-BSpline-Symbolic-Fidelity', passRef: 61, thresholdDesc: 'Symbolic Approximation == 100%' },
    { rowId: 'C2-KAN-Continual-Grid-Refinement-Retention', passRef: 61, thresholdDesc: 'Grid Refinement Retention == 100%' },
    { rowId: 'C3-CfC-sLTC-Irregular-Timestamp-Invariance', passRef: 62, thresholdDesc: 'Timestamp Invariance == 100%' },
    { rowId: 'C4-CfC-sLTC-Stiff-Ratio-Attractor-Stability', passRef: 62, thresholdDesc: 'Stiff Stability == 100%' },
    { rowId: 'C5-PortHamiltonian-Passivity-Energy-Conservation', passRef: 63, thresholdDesc: 'Energy Passivity == 100%' },
    { rowId: 'C6-Symplectic-Verlet-Liouville-Volume-Invariance', passRef: 63, thresholdDesc: 'Phase Volume == 100%' },
    { rowId: 'C7-DEQ-Anderson-Fixed-Point-Convergence', passRef: 64, thresholdDesc: 'Fixed-Point Convergence == 100%' },
    { rowId: 'C8-DEQ-O1-Memory-Savings-Vs-Unrolled', passRef: 64, thresholdDesc: 'Memory Savings >= 95%' },
    { rowId: 'C9-DEQ-Exact-Implicit-Function-Theorem-Jacobian', passRef: 64, thresholdDesc: 'IFT Gradient Fidelity == 100%' },
    { rowId: 'C10-Phase12-All-Continuous-Spline-Suites-Verified', passRef: 65, thresholdDesc: 'All 4 Continuous Suites == 100.0' }
  ]);

  function runContinuousSplineBrainsPhase12Audit(options) {
    options = options || {};
    var seeds = Array.isArray(options.seeds) && options.seeds.length > 0 ? options.seeds : DEFAULT_SEEDS;
    var p61 = deps.pass61.run({ seeds: seeds });
    var p62 = deps.pass62.run({ seeds: seeds });
    var p63 = deps.pass63.run({ seeds: seeds });
    var p64 = deps.pass64.run({ seeds: seeds });

    var w61 = p61.aggregatedByProfile['chebyshev-bspline-kan-with-silu-residual-weights'];
    var w62 = p62.aggregatedByProfile['cfc-closed-form-sltc-exponential-euler-hybrid'];
    var w63 = p63.aggregatedByProfile['symplectic-stormer-verlet-port-hamiltonian-cholesky'];
    var w64 = p64.aggregatedByProfile['anderson-accelerated-contractive-deq-exact-ift'];

    var matrixRows = PHASE12_ACCEPTANCE_ROWS.map(function (row) {
      var seedResults = seeds.map(function (seed, idx) {
        var r61 = w61.seedRuns[idx];
        var r62 = w62.seedRuns[idx];
        var r63 = w63.seedRuns[idx];
        var r64 = w64.seedRuns[idx];
        var passed = false;
        var val = 0;

        if (row.rowId === 'C1-KAN-Chebyshev-BSpline-Symbolic-Fidelity') {
          passed = r61.symbolicFormulaApproximationPct === 100; val = r61.symbolicFormulaApproximationPct;
        } else if (row.rowId === 'C2-KAN-Continual-Grid-Refinement-Retention') {
          passed = r61.continualGridRefinementRetentionPct === 100; val = r61.continualGridRefinementRetentionPct;
        } else if (row.rowId === 'C3-CfC-sLTC-Irregular-Timestamp-Invariance') {
          passed = r62.irregularTimestampInvariancePct === 100; val = r62.irregularTimestampInvariancePct;
        } else if (row.rowId === 'C4-CfC-sLTC-Stiff-Ratio-Attractor-Stability') {
          passed = r62.stiffRatioStabilityPct === 100; val = r62.stiffRatioStabilityPct;
        } else if (row.rowId === 'C5-PortHamiltonian-Passivity-Energy-Conservation') {
          passed = r63.passivityEnergyConservationPct === 100; val = r63.passivityEnergyConservationPct;
        } else if (row.rowId === 'C6-Symplectic-Verlet-Liouville-Volume-Invariance') {
          passed = r63.symplecticPhaseVolumeInvariancePct === 100; val = r63.symplecticPhaseVolumeInvariancePct;
        } else if (row.rowId === 'C7-DEQ-Anderson-Fixed-Point-Convergence') {
          passed = r64.fixedPointResidualConvergencePct === 100; val = r64.fixedPointResidualConvergencePct;
        } else if (row.rowId === 'C8-DEQ-O1-Memory-Savings-Vs-Unrolled') {
          passed = r64.memorySavingsVsUnrolledPct >= 95.0; val = r64.memorySavingsVsUnrolledPct;
        } else if (row.rowId === 'C9-DEQ-Exact-Implicit-Function-Theorem-Jacobian') {
          passed = r64.implicitGradientFidelityPct === 100; val = r64.implicitGradientFidelityPct;
        } else if (row.rowId === 'C10-Phase12-All-Continuous-Spline-Suites-Verified') {
          passed = r61.compositeKanScore === 100 && r62.compositeCfcSltcScore === 100 && r63.compositeHamiltonianScore === 100 && r64.compositeDeqScore === 100;
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
      passId: 'ALIVE-PASS-65-CONTINUOUS-SPLINE-BRAINS-PHASE12-AUDIT',
      seeds: seeds,
      rows: matrixRows.map(function (r) { return { rowId: r.rowId, verified: r.verified, mean: r.mean }; })
    });

    return {
      passId: 'ALIVE-PASS-65-CONTINUOUS-SPLINE-BRAINS-PHASE12-AUDIT',
      phase: 'Phase XII — Kolmogorov-Arnold Networks (KAN), Liquid Time-Constant (sLTC) & Continuous-Depth Neural ODEs',
      seeds: seeds.slice(),
      matrixRows: matrixRows,
      summary: {
        verifiedRowCount: verifiedRowCount,
        totalAcceptanceRows: PHASE12_ACCEPTANCE_ROWS.length,
        acceptanceScorePct: engine.roundMetric((verifiedRowCount / PHASE12_ACCEPTANCE_ROWS.length) * 100, 2),
        phase13MoeRoutingReady: verifiedRowCount === PHASE12_ACCEPTANCE_ROWS.length,
        phase12ContinuousSplineFrozenDigestSha256: digest,
        matrixRows: matrixRows
      }
    };
  }

  return {
    DEFAULT_SEEDS: DEFAULT_SEEDS,
    PHASE12_ACCEPTANCE_ROWS: PHASE12_ACCEPTANCE_ROWS,
    runContinuousSplineBrainsPhase12Audit: runContinuousSplineBrainsPhase12Audit,
    run: runContinuousSplineBrainsPhase12Audit
  };
});
