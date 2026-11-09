(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    var activeInf = require('./alive-active-inference-free-energy.js');
    var poincare = require('./alive-hyperbolic-poincare-knowledge-embedder.js');
    var neurosym = require('./alive-neurosymbolic-program-synthesizer.js');
    var quantizer = require('./alive-mixed-precision-tensor-quantizer.js');
    module.exports = factory({
      activeInf: activeInf,
      poincare: poincare,
      neurosym: neurosym,
      quantizer: quantizer
    });
  } else {
    var api = factory({
      activeInf: root.AliveActiveInferenceFreeEnergy,
      poincare: root.AliveHyperbolicPoincareKnowledgeEmbedder,
      neurosym: root.AliveNeurosymbolicProgramSynthesizer,
      quantizer: root.AliveMixedPrecisionTensorQuantizer
    });
    root.AliveNeurosymbolicPhase6Audit = api;
    root.ALIVENeurosymbolicPhase6Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';
  deps = deps || {};

  var DEFAULT_SEEDS = Object.freeze([19013, 29017, 39023, 49031, 59053]);

  var PHASE6_ACCEPTANCE_ROWS = Object.freeze([
    {
      rowId: 'N1-ActiveInference-VFE-Monotonic-Descent',
      passRef: 31,
      description: 'Variational Free-Energy F(Q,o) monotonic descent (100% episodes, mean drop >= 0.70 nats)'
    },
    {
      rowId: 'N2-ActiveInference-EFE-Epistemic-Disambiguation',
      passRef: 31,
      description: 'Expected Free Energy G(pi) epistemic probe disambiguation under high latent entropy (100%)'
    },
    {
      rowId: 'N3-ActiveInference-Pragmatic-Goal-Convergence',
      passRef: 31,
      description: 'Active Inference pragmatic goal convergence (100%) and >= +60.0 gain vs greedy/curiosity'
    },
    {
      rowId: 'N4-Poincare-Arcosh-Geodesic-Low-Distortion',
      passRef: 32,
      description: 'Hyperbolic Poincaré Ball B^8_c tree distortion <= 0.15 and 100% neighborhood MAP@k'
    },
    {
      rowId: 'N5-Poincare-Mobius-Gyrovector-And-Boundary-Safety',
      passRef: 32,
      description: 'Poincaré Möbius gyrovector hierarchy depth monotonicity (100%) & c||x||^2 < 1 safety (100%)'
    },
    {
      rowId: 'N6-NeuroSymbolic-TypedDSL-SMT-Soundness',
      passRef: 33,
      description: 'Neuro-Symbolic Typed Combinator DSL Hoare/SMT invariant soundness (100% across INV1..INV5)'
    },
    {
      rowId: 'N7-NeuroSymbolic-CEGIS-Adversarial-Holdout-And-Decoy-Guard',
      passRef: 33,
      description: 'CEGIS counterexample refinement (<= 3.0 steps), 100% adversarial survival & 100% decoy guard'
    },
    {
      rowId: 'N8-MixedPrecision-7Tier-Hessian-Routing',
      passRef: 34,
      description: 'Dynamic 7-tier (FP64..Binary) Hessian-trace sensitivity routing coverage (100%)'
    },
    {
      rowId: 'N9-MixedPrecision-NF4-ErrorFeedback-Fidelity',
      passRef: 34,
      description: 'NF4 + Karimireddy e_t error-feedback Hessian-weighted cosine similarity >= 0.995 (100%)'
    },
    {
      rowId: 'N10-MixedPrecision-Compression-Ratio-Compliance',
      passRef: 34,
      description: 'Mixed-precision memory compression >= 4.0x vs FP32 baseline (100% episodes)'
    }
  ]);

  function computeFNV1a256Hex(inputStr) {
    var str = String(inputStr || '');
    var states = [
      0x811c9dc5, 0xcbf29ce4, 0x84222325, 0x1b873593,
      0xcc9e2d51, 0xe6546b64, 0x9e3779b9, 0x85ebca6b
    ];
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      for (var lane = 0; lane < 8; lane++) {
        var h = states[lane] ^ ((code + lane * 31) & 0xff);
        h = Math.imul(h, 0x01000193) >>> 0;
        h = ((h << 13) | (h >>> 19)) >>> 0;
        states[lane] = (h ^ (i * 0x27d4eb2d)) >>> 0;
      }
    }
    return states.map(function (s) { return ('00000000' + (s >>> 0).toString(16)).slice(-8); }).join('');
  }

  function computeSha256Hex(payload) {
    var canonical = typeof payload === 'string' ? payload : JSON.stringify(payload);
    if (typeof require === 'function') {
      try {
        var crypto = require('node:crypto');
        return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
      } catch (_) {}
    }
    return computeFNV1a256Hex(canonical);
  }

  function runNeurosymbolicPhase6Audit(options) {
    options = options || {};
    var seeds = Array.isArray(options.seeds) && options.seeds.length > 0 ? options.seeds : DEFAULT_SEEDS;

    var p31 = deps.activeInf.run({ seeds: seeds });
    var p32 = deps.poincare.run({ seeds: seeds });
    var p33 = deps.neurosym.run({ seeds: seeds });
    var p34 = deps.quantizer.run({ seeds: seeds });

    var p32Winner = p32.aggregatedByProfile['poincare-riemannian-gyrovector-b8'];
    var p33Winner = p33.aggregatedByProfile['neurosymbolic-cegis-smt-synthesizer'];
    var p34Winner = p34.aggregatedByProfile['hessian-nf4-error-feedback-ladder'];

    var rowEvaluations = PHASE6_ACCEPTANCE_ROWS.map(function (row) {
      var seedResults = seeds.map(function (seed, idx) {
        var r31 = p31.seedRuns[idx].byProfile['full-vfe-efe-active-inference-planner'];
        var r32 = p32Winner.seedRuns[idx];
        var r33 = p33Winner.seedRuns[idx];
        var r34 = p34Winner.seedRuns[idx];
        var passed = false;
        var metricValue = 0;

        if (row.rowId === 'N1-ActiveInference-VFE-Monotonic-Descent') {
          passed = r31.vfeMonotonicReductionPct === 100 && r31.meanVfeDropNats >= 0.70;
          metricValue = r31.meanVfeDropNats;
        } else if (row.rowId === 'N2-ActiveInference-EFE-Epistemic-Disambiguation') {
          passed = r31.epistemicDisambiguationPct === 100;
          metricValue = r31.epistemicDisambiguationPct;
        } else if (row.rowId === 'N3-ActiveInference-Pragmatic-Goal-Convergence') {
          passed = r31.pragmaticGoalConvergencePct === 100 && p31.summary.gainVsGreedyPragmatic >= 60;
          metricValue = r31.activeInferenceScore;
        } else if (row.rowId === 'N4-Poincare-Arcosh-Geodesic-Low-Distortion') {
          passed = r32.meanTreeDistortion <= 0.15 && r32.mapAtKScorePct === 100;
          metricValue = r32.meanTreeDistortion;
        } else if (row.rowId === 'N5-Poincare-Mobius-Gyrovector-And-Boundary-Safety') {
          passed = r32.hierarchyDepthNormSpearmanPct === 100 && r32.manifoldBoundarySafetyPct === 100;
          metricValue = r32.compositePoincareScore;
        } else if (row.rowId === 'N6-NeuroSymbolic-TypedDSL-SMT-Soundness') {
          passed = r33.smtInvariantSoundnessPct === 100;
          metricValue = r33.smtInvariantSoundnessPct;
        } else if (row.rowId === 'N7-NeuroSymbolic-CEGIS-Adversarial-Holdout-And-Decoy-Guard') {
          passed = r33.mutationHoldoutSurvivalPct === 100 && r33.decoyRejectionPct === 100 && r33.meanCegisSteps <= 3.0;
          metricValue = r33.compositeSynthesisScore;
        } else if (row.rowId === 'N8-MixedPrecision-7Tier-Hessian-Routing') {
          passed = r34.sevenTierCoveragePct === 100;
          metricValue = r34.sevenTierCoveragePct;
        } else if (row.rowId === 'N9-MixedPrecision-NF4-ErrorFeedback-Fidelity') {
          passed = r34.spectralFidelityPct === 100 && r34.meanCosineSim >= 0.995;
          metricValue = r34.meanCosineSim;
        } else if (row.rowId === 'N10-MixedPrecision-Compression-Ratio-Compliance') {
          passed = r34.compressionBudgetCompliancePct === 100 && r34.meanCompressionRatio >= 4.0;
          metricValue = r34.meanCompressionRatio;
        }

        return { seed: seed, passed: passed, metricValue: metricValue };
      });

      var passedSeeds = seedResults.filter(function (sr) { return sr.passed; }).length;
      return {
        rowId: row.rowId,
        passRef: row.passRef,
        description: row.description,
        passedSeeds: passedSeeds,
        totalSeeds: seeds.length,
        verified: passedSeeds === seeds.length,
        seedResults: seedResults
      };
    });

    var verifiedRowCount = rowEvaluations.filter(function (r) { return r.verified; }).length;
    var manifestPayload = {
      phase: 'PHASE_VI_NEUROSYMBOLIC_ACTIVE_INFERENCE_PASSES_31_TO_35',
      seeds: seeds,
      rows: rowEvaluations.map(function (r) {
        return { rowId: r.rowId, passRef: r.passRef, passedSeeds: r.passedSeeds, verified: r.verified };
      }),
      passSummaries: {
        pass31: p31.summary,
        pass32: p32.summary,
        pass33: p33.summary,
        pass34: p34.summary
      }
    };

    var phase6NeurosymbolicFrozenDigestSha256 = computeSha256Hex(manifestPayload);

    return {
      passId: 'ALIVE-PASS-35-NEUROSYMBOLIC-PHASE6-ACCEPTANCE-MATRIX',
      phase: 'Phase VI — Neuro-Symbolic Program Synthesis, Active Inference Free-Energy & Hyperbolic Knowledge Geometry',
      generatedAt: new Date().toISOString(),
      seeds: seeds.slice(),
      matrixRows: rowEvaluations,
      upstreamSummaries: {
        pass31: p31.summary,
        pass32: p32.summary,
        pass33: p33.summary,
        pass34: p34.summary
      },
      summary: {
        verifiedRowCount: verifiedRowCount,
        totalAcceptanceRows: PHASE6_ACCEPTANCE_ROWS.length,
        acceptanceScorePct: (verifiedRowCount / PHASE6_ACCEPTANCE_ROWS.length) * 100,
        phase6NeurosymbolicFrozenDigestSha256: phase6NeurosymbolicFrozenDigestSha256,
        phase7OmegaMissionReady: verifiedRowCount === PHASE6_ACCEPTANCE_ROWS.length,
        matrixRows: rowEvaluations
      }
    };
  }

  return {
    DEFAULT_SEEDS: DEFAULT_SEEDS,
    PHASE6_ACCEPTANCE_ROWS: PHASE6_ACCEPTANCE_ROWS,
    computeSha256Hex: computeSha256Hex,
    runNeurosymbolicPhase6Audit: runNeurosymbolicPhase6Audit,
    run: runNeurosymbolicPhase6Audit
  };
});
