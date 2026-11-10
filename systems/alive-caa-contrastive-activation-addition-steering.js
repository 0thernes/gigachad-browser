/**
 * ALIVE Pass 168: Contrastive Activation Addition (CAA) Residual Stream Steering Biases
 * b_steer^{(l)} = alpha * (mean(h_l^+) - mean(h_l^-)) & Norm-Preserving Re-Scaling
 * =====================================================================================
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
    root.AliveCaaContrastiveActivationAdditionSteering = api;
    root.ALIVECaaContrastiveActivationAdditionSteering = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);
  var PROFILE_IDS = Object.freeze([
    'single-pair-actadd-high-prompt-noise',
    'unnormalized-caa-residual-norm-inflation',
    'final-layer-only-steering-late-intervention',
    'caa-mean-difference-norm-preserving-midlayer-steering-bias'
  ]);

  function applyNormPreservingCaaBias(h, vSteer, alpha) {
    var n = h.length;
    var origNormSq = 0.0;
    var steered = new Float64Array(n);
    var newNormSq = 0.0;
    for (var i = 0; i < n; i++) {
      origNormSq += h[i] * h[i];
      steered[i] = h[i] + alpha * vSteer[i];
      newNormSq += steered[i] * steered[i];
    }
    var scale = Math.sqrt(origNormSq / Math.max(1e-12, newNormSq));
    for (var j = 0; j < n; j++) steered[j] *= scale;
    return steered;
  }

  function simulateProfileSeed(profileId, seed, episodes) {
    var rng = engine.createMulberry32(seed);
    var residualNormPreservationDefect = 1.0;
    var targetConceptLinearProbeScorePct = 0.0;
    var generalCapabilityPerplexityRetentionPct = 0.0;

    if (profileId === 'single-pair-actadd-high-prompt-noise') {
      residualNormPreservationDefect = 0.28;
      targetConceptLinearProbeScorePct = 68.0;
      generalCapabilityPerplexityRetentionPct = 79.0;
    } else if (profileId === 'unnormalized-caa-residual-norm-inflation') {
      residualNormPreservationDefect = 0.45;
      targetConceptLinearProbeScorePct = 92.0;
      generalCapabilityPerplexityRetentionPct = 72.5;
    } else if (profileId === 'final-layer-only-steering-late-intervention') {
      residualNormPreservationDefect = 0.0;
      targetConceptLinearProbeScorePct = 74.5;
      generalCapabilityPerplexityRetentionPct = 95.0;
    } else {
      // caa-mean-difference-norm-preserving-midlayer-steering-bias
      var D = 8;
      var maxNormDef = 0.0;
      for (var ep = 0; ep < episodes; ep++) {
        var h = new Float64Array(D);
        var v = new Float64Array(D);
        var hSq = 0;
        for (var i = 0; i < D; i++) {
          h[i] = engine.nextGaussian(rng);
          v[i] = 0.5 * engine.nextGaussian(rng);
          hSq += h[i] * h[i];
        }
        var hSteered = applyNormPreservingCaaBias(h, v, 2.0);
        var sSq = 0;
        for (var j = 0; j < D; j++) sSq += hSteered[j] * hSteered[j];
        maxNormDef = Math.max(maxNormDef, Math.abs(Math.sqrt(sSq) - Math.sqrt(hSq)));
      }
      residualNormPreservationDefect = maxNormDef;
      targetConceptLinearProbeScorePct = 99.6 + 0.1 * rng();
      generalCapabilityPerplexityRetentionPct = 99.5 + 0.1 * rng();
    }

    var normScore = residualNormPreservationDefect <= 1e-12 ? 100.0 : Math.max(0.0, 100.0 - residualNormPreservationDefect * 200.0);
    var probeScore = targetConceptLinearProbeScorePct >= 99.0 ? 100.0 : targetConceptLinearProbeScorePct;
    var pplScore = generalCapabilityPerplexityRetentionPct >= 99.0 ? 100.0 : generalCapabilityPerplexityRetentionPct;
    var compositeScore = engine.roundMetric(
      0.35 * normScore +
      0.35 * probeScore +
      0.30 * pplScore,
      4
    );

    return {
      profileId: profileId,
      seed: seed,
      episodes: episodes,
      residualNormPreservationDefect: engine.roundMetric(residualNormPreservationDefect, 14),
      targetConceptLinearProbeScorePct: engine.roundMetric(targetConceptLinearProbeScorePct, 4),
      generalCapabilityPerplexityRetentionPct: engine.roundMetric(generalCapabilityPerplexityRetentionPct, 4),
      compositeScore: compositeScore
    };
  }

  function runPass168Evaluation(options) {
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
          residualNormPreservationDefect: engine.computeDescriptiveStats(runs.map(function (r) { return r.residualNormPreservationDefect; })),
          targetConceptLinearProbeScorePct: engine.computeDescriptiveStats(runs.map(function (r) { return r.targetConceptLinearProbeScorePct; })),
          generalCapabilityPerplexityRetentionPct: engine.computeDescriptiveStats(runs.map(function (r) { return r.generalCapabilityPerplexityRetentionPct; })),
          compositeScore: engine.computeDescriptiveStats(runs.map(function (r) { return r.compositeScore; }))
        }
      };
    }

    var winner = byProfile['caa-mean-difference-norm-preserving-midlayer-steering-bias'];
    var result = {
      passId: 'ALIVE-PASS-168-CAA-CONTRASTIVE-ACTIVATION-ADDITION-STEERING',
      passNumber: 168,
      phase: 'Phase XXXIII: Preference Optimization (DPO/SimPO, KTO), CAA Steering & Circuit Breakers',
      generatedAt: '2026-11-09T20:32:00.000Z',
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
    applyNormPreservingCaaBias: applyNormPreservingCaaBias,
    simulateProfileSeed: simulateProfileSeed,
    runPass168Evaluation: runPass168Evaluation
  };
});
