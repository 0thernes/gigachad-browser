/**
 * ALIVE Pass 160: Phase XXXI Consistency Models, Schrodinger Bridges, Karras EDM &
 * AutoGuidance Acceptance Matrix (D2_1..D2_10) & Cryptographic SHA-256 Freeze
 * ================================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p156 = null;
  var p157 = null;
  var p158 = null;
  var p159 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p156 = require('./alive-consistency-model-single-step-distillation.js');
    p157 = require('./alive-schrodinger-bridge-iterative-proportional-fitting.js');
    p158 = require('./alive-edm-karras-preconditioned-score-weights.js');
    p159 = require('./alive-cfg-autoguidance-tangential-score-steering.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p156 = root.AliveConsistencyModelSingleStepDistillation;
    p157 = root.AliveSchrodingerBridgeIterativeProportionalFitting;
    p158 = root.AliveEdmKarrasPreconditionedScoreWeights;
    p159 = root.AliveCfgAutoguidanceTangentialScoreSteering;
  }
  var api = factory(engine, p156, p157, p158, p159);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveConsistencySchrodingerEdmPhase31Audit = api;
    root.ALIVEConsistencySchrodingerEdmPhase31Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p156, p157, p158, p159) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass160Phase31Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r156 = p156.runPass156Evaluation({ seeds: seeds, episodes: 24 });
    var r157 = p157.runPass157Evaluation({ seeds: seeds, episodes: 24 });
    var r158 = p158.runPass158Evaluation({ seeds: seeds, episodes: 24 });
    var r159 = p159.runPass159Evaluation({ seeds: seeds, episodes: 24 });

    var w156 = r156.profiles[r156.winningProfileId].stats;
    var w157 = r157.profiles[r157.winningProfileId].stats;
    var w158 = r158.profiles[r158.winningProfileId].stats;
    var w159 = r159.profiles[r159.winningProfileId].stats;

    var rows = [
      {
        rowId: 'D2_1-Consistency-Model-Exact-Boundary-Identity-Condition',
        passNumber: 156,
        metric: 'boundaryIdentityConditionDefect',
        threshold: '=== 0.0',
        observed: w156.boundaryIdentityConditionDefect.mean,
        verified: w156.boundaryIdentityConditionDefect.mean === 0
      },
      {
        rowId: 'D2_2-Consistency-Model-Trajectory-Self-Consistency-Discrepancy',
        passNumber: 156,
        metric: 'trajectorySelfConsistencyDiscrepancy',
        threshold: '<= 0.001',
        observed: w156.trajectorySelfConsistencyDiscrepancy.mean,
        verified: w156.trajectorySelfConsistencyDiscrepancy.mean <= 0.001
      },
      {
        rowId: 'D2_3-Schrodinger-Bridge-IPF-Terminal-Marginal-KL',
        passNumber: 157,
        metric: 'terminalMarginalKlDiscrepancy',
        threshold: '<= 0.001',
        observed: w157.terminalMarginalKlDiscrepancy.mean,
        verified: w157.terminalMarginalKlDiscrepancy.mean <= 0.001
      },
      {
        rowId: 'D2_4-Schrodinger-Bridge-Finite-Step-Transport-Fidelity',
        passNumber: 157,
        metric: 'finiteStepTransportFidelityPct',
        threshold: '>= 99.0%',
        observed: w157.finiteStepTransportFidelityPct.mean,
        verified: w157.finiteStepTransportFidelityPct.mean >= 99.0
      },
      {
        rowId: 'D2_5-Karras-EDM-cIn-Unit-Variance-Input-Normalization',
        passNumber: 158,
        metric: 'inputUnitVarianceDeviation',
        threshold: '<= 1e-12',
        observed: w158.inputUnitVarianceDeviation.mean,
        verified: w158.inputUnitVarianceDeviation.mean <= 1e-12
      },
      {
        rowId: 'D2_6-Karras-EDM-cSkip-cOut-Unit-Variance-Target-Normalization',
        passNumber: 158,
        metric: 'targetEffectiveUnitVarianceDeviation',
        threshold: '<= 1e-12',
        observed: w158.targetEffectiveUnitVarianceDeviation.mean,
        verified: w158.targetEffectiveUnitVarianceDeviation.mean <= 1e-12
      },
      {
        rowId: 'D2_7-AutoGuidance-Tangential-Manifold-Zero-Normal-Leakage',
        passNumber: 159,
        metric: 'normalComponentOffManifoldLeakage',
        threshold: '<= 1e-12',
        observed: w159.normalComponentOffManifoldLeakage.mean,
        verified: w159.normalComponentOffManifoldLeakage.mean <= 1e-12
      },
      {
        rowId: 'D2_8-AutoGuidance-Sample-Diversity-Recall-Retention',
        passNumber: 159,
        metric: 'sampleDiversityRecallRetentionPct',
        threshold: '>= 98.0%',
        observed: w159.sampleDiversityRecallRetentionPct.mean,
        verified: w159.sampleDiversityRecallRetentionPct.mean >= 98.0
      },
      {
        rowId: 'D2_9-AutoGuidance-Precision-Alignment-Quality',
        passNumber: 159,
        metric: 'precisionAlignmentQualityScorePct',
        threshold: '>= 99.0%',
        observed: w159.precisionAlignmentQualityScorePct.mean,
        verified: w159.precisionAlignmentQualityScorePct.mean >= 99.0
      },
      {
        rowId: 'D2_10-Phase31-All-Four-Consistency-Schrodinger-EDM-Passes-100-Score',
        passNumber: 160,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r156.winningScore, r157.winningScore, r158.winningScore, r159.winningScore].join(' / '),
        verified: r156.winningScore === 100 && r157.winningScore === 100 && r158.winningScore === 100 && r159.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-160-CONSISTENCY-SCHRODINGER-EDM-PHASE31-AUDIT',
      passNumber: 160,
      phase: 'Phase XXXI: Consistency Models, Schrodinger Bridges, Karras EDM & AutoGuidance',
      generatedAt: '2026-11-09T20:24:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass156Sha256: r156.sha256,
        pass157Sha256: r157.sha256,
        pass158Sha256: r158.sha256,
        pass159Sha256: r159.sha256
      }
    };
    result.phase31Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass160Phase31Audit: runPass160Phase31Audit
  };
});
