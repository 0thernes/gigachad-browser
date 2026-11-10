/**
 * ALIVE Pass 170: Phase XXXIII Preference Optimization (DPO/SimPO, KTO), CAA Steering
 * & Circuit Breakers Acceptance Matrix (A2_1..A2_10) & Cryptographic SHA-256 Freeze
 * ===================================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p166 = null;
  var p167 = null;
  var p168 = null;
  var p169 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p166 = require('./alive-dpo-simpo-reference-free-margin-weights.js');
    p167 = require('./alive-kto-kahneman-tversky-prospect-utility-weights.js');
    p168 = require('./alive-caa-contrastive-activation-addition-steering.js');
    p169 = require('./alive-circuit-breakers-orthogonal-refusal-abliteration.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p166 = root.AliveDpoSimpoReferenceFreeMarginWeights;
    p167 = root.AliveKtoKahnemanTverskyProspectUtilityWeights;
    p168 = root.AliveCaaContrastiveActivationAdditionSteering;
    p169 = root.AliveCircuitBreakersOrthogonalRefusalAbliteration;
  }
  var api = factory(engine, p166, p167, p168, p169);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AlivePreferenceDpoKtoSteeringPhase33Audit = api;
    root.ALIVEPreferenceDpoKtoSteeringPhase33Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p166, p167, p168, p169) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass170Phase33Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r166 = p166.runPass166Evaluation({ seeds: seeds, episodes: 24 });
    var r167 = p167.runPass167Evaluation({ seeds: seeds, episodes: 24 });
    var r168 = p168.runPass168Evaluation({ seeds: seeds, episodes: 24 });
    var r169 = p169.runPass169Evaluation({ seeds: seeds, episodes: 24 });

    var w166 = r166.profiles[r166.winningProfileId].stats;
    var w167 = r167.profiles[r167.winningProfileId].stats;
    var w168 = r168.profiles[r168.winningProfileId].stats;
    var w169 = r169.profiles[r169.winningProfileId].stats;

    var rows = [
      {
        rowId: 'A2_1-SimPO-Length-Normalized-Zero-Verbosity-Bias',
        passNumber: 166,
        metric: 'lengthBiasCorrelationAbs',
        threshold: '<= 1e-12',
        observed: w166.lengthBiasCorrelationAbs.mean,
        verified: w166.lengthBiasCorrelationAbs.mean <= 1e-12
      },
      {
        rowId: 'A2_2-SimPO-Preference-Margin-Win-Rate',
        passNumber: 166,
        metric: 'preferenceWinRatePct',
        threshold: '=== 100.0%',
        observed: w166.preferenceWinRatePct.mean,
        verified: w166.preferenceWinRatePct.mean === 100
      },
      {
        rowId: 'A2_3-KTO-Unpaired-Imbalanced-Alignment-Accuracy',
        passNumber: 167,
        metric: 'unpairedImbalancedAlignmentAccuracyPct',
        threshold: '=== 100.0%',
        observed: w167.unpairedImbalancedAlignmentAccuracyPct.mean,
        verified: w167.unpairedImbalancedAlignmentAccuracyPct.mean === 100
      },
      {
        rowId: 'A2_4-KTO-KL-Reference-Point-z0-Stability',
        passNumber: 167,
        metric: 'prospectReferencePointStabilityError',
        threshold: '<= 0.001',
        observed: w167.prospectReferencePointStabilityError.mean,
        verified: w167.prospectReferencePointStabilityError.mean <= 0.001
      },
      {
        rowId: 'A2_5-CAA-Steering-Residual-Norm-Preservation-Defect',
        passNumber: 168,
        metric: 'residualNormPreservationDefect',
        threshold: '<= 1e-12',
        observed: w168.residualNormPreservationDefect.mean,
        verified: w168.residualNormPreservationDefect.mean <= 1e-12
      },
      {
        rowId: 'A2_6-CAA-Target-Concept-Linear-Probe-Score',
        passNumber: 168,
        metric: 'targetConceptLinearProbeScorePct',
        threshold: '>= 99.0%',
        observed: w168.targetConceptLinearProbeScorePct.mean,
        verified: w168.targetConceptLinearProbeScorePct.mean >= 99.0
      },
      {
        rowId: 'A2_7-CircuitBreaker-Target-Direction-Zero-Residual-Projection',
        passNumber: 169,
        metric: 'targetDirectionResidualProjection',
        threshold: '<= 1e-12',
        observed: w169.targetDirectionResidualProjection.mean,
        verified: w169.targetDirectionResidualProjection.mean <= 1e-12
      },
      {
        rowId: 'A2_8-CircuitBreaker-Orthogonal-Subspace-Zero-Action-Drift',
        passNumber: 169,
        metric: 'orthogonalSubspaceActionDrift',
        threshold: '<= 1e-12',
        observed: w169.orthogonalSubspaceActionDrift.mean,
        verified: w169.orthogonalSubspaceActionDrift.mean <= 1e-12
      },
      {
        rowId: 'A2_9-CircuitBreaker-Interception-Rate',
        passNumber: 169,
        metric: 'circuitBreakerInterceptionRatePct',
        threshold: '=== 100.0%',
        observed: w169.circuitBreakerInterceptionRatePct.mean,
        verified: w169.circuitBreakerInterceptionRatePct.mean === 100
      },
      {
        rowId: 'A2_10-Phase33-All-Four-Preference-Steering-Passes-100-Score',
        passNumber: 170,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r166.winningScore, r167.winningScore, r168.winningScore, r169.winningScore].join(' / '),
        verified: r166.winningScore === 100 && r167.winningScore === 100 && r168.winningScore === 100 && r169.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-170-PREFERENCE-DPO-KTO-STEERING-PHASE33-AUDIT',
      passNumber: 170,
      phase: 'Phase XXXIII: Preference Optimization (DPO/SimPO, KTO), CAA Steering & Circuit Breakers',
      generatedAt: '2026-11-09T20:34:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass166Sha256: r166.sha256,
        pass167Sha256: r167.sha256,
        pass168Sha256: r168.sha256,
        pass169Sha256: r169.sha256
      }
    };
    result.phase33Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass170Phase33Audit: runPass170Phase33Audit
  };
});
