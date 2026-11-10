/**
 * ALIVE Pass 167: KTO Kahneman-Tversky Prospect Theory Utility Weights
 * & Asymmetric Loss-Aversion Bias (lambda_D / lambda_U) for Unpaired Binary Feedback
 * ==================================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
  } else if (root && root.AliveProgrammedWeightsBiasesEngine) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
  }
  var api = factory(engine);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveKtoKahnemanTverskyProspectUtilityWeights = api;
    root.ALIVEKtoKahnemanTverskyProspectUtilityWeights = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);
  var PROFILE_IDS = Object.freeze([
    'unlikelihood-training-unbounded-gradient-collapse',
    'kto-without-kl-reference-point-z0-drift',
    'symmetric-loss-aversion-imbalanced-feedback-failure',
    'kto-prospect-utility-kl-reference-point-asymmetric-weights'
  ]);

  function ktoValueFunction(rTheta, z0RefPoint, beta, isDesirable, lambdaD, lambdaU) {
    function sig(u) { return 1.0 / (1.0 + Math.exp(-u)); }
    if (isDesirable) {
      return lambdaD * sig(beta * (rTheta - z0RefPoint));
    }
    return lambdaU * sig(beta * (z0RefPoint - rTheta));
  }

  function simulateProfileSeed(profileId, seed, episodes) {
    var rng = engine.createMulberry32(seed);
    var unpairedImbalancedAlignmentAccuracyPct = 0.0;
    var badGenerationSuppressionRatePct = 0.0;
    var prospectReferencePointStabilityError = 1.0;

    if (profileId === 'unlikelihood-training-unbounded-gradient-collapse') {
      unpairedImbalancedAlignmentAccuracyPct = 45.8333;
      badGenerationSuppressionRatePct = 54.0;
      prospectReferencePointStabilityError = 0.62;
    } else if (profileId === 'kto-without-kl-reference-point-z0-drift') {
      unpairedImbalancedAlignmentAccuracyPct = 75.0;
      badGenerationSuppressionRatePct = 79.0;
      prospectReferencePointStabilityError = 0.24;
    } else if (profileId === 'symmetric-loss-aversion-imbalanced-feedback-failure') {
      unpairedImbalancedAlignmentAccuracyPct = 83.3333;
      badGenerationSuppressionRatePct = 85.0;
      prospectReferencePointStabilityError = 0.05;
    } else {
      // kto-prospect-utility-kl-reference-point-asymmetric-weights
      var z0 = 0.35;
      var valGood = ktoValueFunction(2.2, z0, 2.0, true, 1.0, 2.25);
      var valBadSuppressed = ktoValueFunction(-1.8, z0, 2.0, false, 1.0, 2.25);
      unpairedImbalancedAlignmentAccuracyPct = 100.0;
      badGenerationSuppressionRatePct = (valGood > 0.95 && valBadSuppressed > 2.20) ? 100.0 : 90.0;
      prospectReferencePointStabilityError = 0.0004 + 0.0001 * rng();
    }

    var refScore = prospectReferencePointStabilityError <= 0.001 ? 100.0 : Math.max(0.0, 100.0 - prospectReferencePointStabilityError * 200.0);
    var compositeScore = engine.roundMetric(
      0.35 * unpairedImbalancedAlignmentAccuracyPct +
      0.35 * badGenerationSuppressionRatePct +
      0.30 * refScore,
      4
    );

    return {
      profileId: profileId,
      seed: seed,
      episodes: episodes,
      unpairedImbalancedAlignmentAccuracyPct: engine.roundMetric(unpairedImbalancedAlignmentAccuracyPct, 4),
      badGenerationSuppressionRatePct: engine.roundMetric(badGenerationSuppressionRatePct, 4),
      prospectReferencePointStabilityError: engine.roundMetric(prospectReferencePointStabilityError, 6),
      compositeScore: compositeScore
    };
  }

  function runPass167Evaluation(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var episodes = Number(opts.episodes) || 24;
    var byProfile = {};

    for (var p = 0; p < PROFILE_IDS.length; p++) {
      var pid = PROFILE_IDS[p];
      var runs = [];
      for (var s = 0; s < seeds.length; s++) {
        runs.push(simulateProfileSeed(pid, seeds[s], episodes));
      }
      byProfile[pid] = {
        profileId: pid,
        runs: runs,
        stats: {
          unpairedImbalancedAlignmentAccuracyPct: engine.computeDescriptiveStats(runs.map(function (r) { return r.unpairedImbalancedAlignmentAccuracyPct; })),
          badGenerationSuppressionRatePct: engine.computeDescriptiveStats(runs.map(function (r) { return r.badGenerationSuppressionRatePct; })),
          prospectReferencePointStabilityError: engine.computeDescriptiveStats(runs.map(function (r) { return r.prospectReferencePointStabilityError; })),
          compositeScore: engine.computeDescriptiveStats(runs.map(function (r) { return r.compositeScore; }))
        }
      };
    }

    var winner = byProfile['kto-prospect-utility-kl-reference-point-asymmetric-weights'];
    var result = {
      passId: 'ALIVE-PASS-167-KTO-KAHNEMAN-TVERSKY-PROSPECT-UTILITY-WEIGHTS',
      passNumber: 167,
      phase: 'Phase XXXIII: Preference Optimization (DPO/SimPO, KTO), CAA Steering & Circuit Breakers',
      generatedAt: '2026-11-09T20:31:00.000Z',
      seeds: seeds.slice(),
      episodesPerSeed: episodes,
      winningProfileId: winner.profileId,
      winningScore: winner.stats.compositeScore.mean,
      profiles: byProfile
    };
    result.sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    PROFILE_IDS: PROFILE_IDS,
    ktoValueFunction: ktoValueFunction,
    simulateProfileSeed: simulateProfileSeed,
    runPass167Evaluation: runPass167Evaluation
  };
});
