/**
 * ALIVE Pass 190: Phase XXXVII Neuro-Genetic & Developmental Weight Encoding
 * (HyperNEAT, NCA, Backpropamine & Baldwin) Acceptance Matrix (G2_1..G2_10) & SHA-256 Freeze
 * ==========================================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p186 = null;
  var p187 = null;
  var p188 = null;
  var p189 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p186 = require('./alive-hyperneat-cppn-geometric-substrate-weights.js');
    p187 = require('./alive-mordvintsev-neural-cellular-automata-weight-grower.js');
    p188 = require('./alive-miconi-backpropamine-differentiable-hebbian-weights.js');
    p189 = require('./alive-baldwin-lamarckian-epigenetic-weight-assimilation.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p186 = root.AliveHyperneatCppnGeometricSubstrateWeights;
    p187 = root.AliveMordvintsevNeuralCellularAutomataWeightGrower;
    p188 = root.AliveMiconiBackpropamineDifferentiableHebbianWeights;
    p189 = root.AliveBaldwinLamarckianEpigeneticWeightAssimilation;
  }
  var api = factory(engine, p186, p187, p188, p189);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveHyperneatNcaBackpropaminePhase37Audit = api;
    root.ALIVEHyperneatNcaBackpropaminePhase37Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p186, p187, p188, p189) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass190Phase37Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r186 = p186.runPass186Evaluation({ seeds: seeds, episodes: 24 });
    var r187 = p187.runPass187Evaluation({ seeds: seeds, episodes: 24 });
    var r188 = p188.runPass188Evaluation({ seeds: seeds, episodes: 24 });
    var r189 = p189.runPass189Evaluation({ seeds: seeds, episodes: 24 });

    var w186 = r186.profiles[r186.winningProfileId].stats;
    var w187 = r187.profiles[r187.winningProfileId].stats;
    var w188 = r188.profiles[r188.winningProfileId].stats;
    var w189 = r189.profiles[r189.winningProfileId].stats;

    var rows = [
      {
        rowId: 'G2_1-HyperNEAT-CPPN-Exact-Bilateral-Symmetry-Preservation',
        passNumber: 186,
        metric: 'bilateralSymmetryViolationDefect',
        threshold: '<= 1e-12',
        observed: w186.bilateralSymmetryViolationDefect.mean,
        verified: w186.bilateralSymmetryViolationDefect.mean <= 1e-12
      },
      {
        rowId: 'G2_2-HyperNEAT-CPPN-Genome-To-Phenotype-Compression',
        passNumber: 186,
        metric: 'genomeToPhenotypeCompressionRatio',
        threshold: '>= 200.0x',
        observed: w186.genomeToPhenotypeCompressionRatio.mean,
        verified: w186.genomeToPhenotypeCompressionRatio.mean >= 200.0
      },
      {
        rowId: 'G2_3-Mordvintsev-NCA-50Pct-Ablation-Self-Healing-Recovery',
        passNumber: 187,
        metric: 'postAblationRegenerationRecoveryPct',
        threshold: '>= 99.5%',
        observed: w187.postAblationRegenerationRecoveryPct.mean,
        verified: w187.postAblationRegenerationRecoveryPct.mean >= 99.5
      },
      {
        rowId: 'G2_4-Mordvintsev-NCA-Asymptotic-Attractor-Drift-Error',
        passNumber: 187,
        metric: 'asymptoticAttractorDriftError',
        threshold: '<= 1e-4',
        observed: w187.asymptoticAttractorDriftError.mean,
        verified: w187.asymptoticAttractorDriftError.mean <= 1e-4
      },
      {
        rowId: 'G2_5-Backpropamine-OneShot-Cue-Reward-Associative-Recall',
        passNumber: 188,
        metric: 'oneShotCueRewardRecallAccuracyPct',
        threshold: '=== 100.0%',
        observed: w188.oneShotCueRewardRecallAccuracyPct.mean,
        verified: w188.oneShotCueRewardRecallAccuracyPct.mean === 100
      },
      {
        rowId: 'G2_6-Backpropamine-Neuromodulated-Distractor-Resistance',
        passNumber: 188,
        metric: 'distractorInterferenceResistancePct',
        threshold: '=== 100.0%',
        observed: w188.distractorInterferenceResistancePct.mean,
        verified: w188.distractorInterferenceResistancePct.mean === 100
      },
      {
        rowId: 'G2_7-Backpropamine-Oja-Trace-Norm-Stability',
        passNumber: 188,
        metric: 'ojaTraceNormStabilityDefect',
        threshold: '<= 1e-12',
        observed: w188.ojaTraceNormStabilityDefect.mean,
        verified: w188.ojaTraceNormStabilityDefect.mean <= 1e-12
      },
      {
        rowId: 'G2_8-Baldwin-Effect-Needle-In-Haystack-Discovery-Speedup',
        passNumber: 189,
        metric: 'needleInHaystackDiscoverySpeedup',
        threshold: '>= 25.0x',
        observed: w189.needleInHaystackDiscoverySpeedup.mean,
        verified: w189.needleInHaystackDiscoverySpeedup.mean >= 25.0
      },
      {
        rowId: 'G2_9-Baldwin-Effect-Innate-ZeroShot-Genetic-Assimilation',
        passNumber: 189,
        metric: 'innateZeroShotAssimilationPct',
        threshold: '=== 100.0%',
        observed: w189.innateZeroShotAssimilationPct.mean,
        verified: w189.innateZeroShotAssimilationPct.mean === 100
      },
      {
        rowId: 'G2_10-Phase37-All-Four-Neuro-Genetic-Developmental-Passes-100-Score',
        passNumber: 190,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r186.winningScore, r187.winningScore, r188.winningScore, r189.winningScore].join(' / '),
        verified: r186.winningScore === 100 && r187.winningScore === 100 && r188.winningScore === 100 && r189.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-190-HYPERNEAT-NCA-BACKPROPAMINE-PHASE37-AUDIT',
      passNumber: 190,
      phase: 'Phase XXXVII: Neuro-Genetic & Developmental Weight Encoding (HyperNEAT, NCA, Backpropamine & Baldwin)',
      generatedAt: '2026-11-09T20:54:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass186Sha256: r186.sha256,
        pass187Sha256: r187.sha256,
        pass188Sha256: r188.sha256,
        pass189Sha256: r189.sha256
      }
    };
    result.phase37Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass190Phase37Audit: runPass190Phase37Audit
  };
});
