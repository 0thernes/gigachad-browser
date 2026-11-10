/**
 * ALIVE Pass 130: Phase XXV Titans, Gated DeltaNet, RWKV-7 & Fast-Weight
 * Memory Acceptance Matrix (J1..J10) & Cryptographic SHA-256 Freeze
 * ======================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p126 = null;
  var p127 = null;
  var p128 = null;
  var p129 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p126 = require('./alive-titans-neural-long-term-surprise-memory.js');
    p127 = require('./alive-deltanet-householder-rank1-fast-weights.js');
    p128 = require('./alive-rwkv7-goose-dynamic-state-evolution-weights.js');
    p129 = require('./alive-gsa-gated-slot-attention-abc-memory.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p126 = root.AliveTitansNeuralLongTermSurpriseMemory;
    p127 = root.AliveDeltanetHouseholderRank1FastWeights;
    p128 = root.AliveRwkv7GooseDynamicStateEvolutionWeights;
    p129 = root.AliveGsaGatedSlotAttentionAbcMemory;
  }
  var api = factory(engine, p126, p127, p128, p129);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveTitansDeltanetRwkv7Phase25Audit = api;
    root.ALIVETitansDeltanetRwkv7Phase25Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p126, p127, p128, p129) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass130Phase25Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r126 = p126.runPass126Evaluation({ seeds: seeds, episodes: 24 });
    var r127 = p127.runPass127Evaluation({ seeds: seeds, episodes: 24 });
    var r128 = p128.runPass128Evaluation({ seeds: seeds, episodes: 24 });
    var r129 = p129.runPass129Evaluation({ seeds: seeds, episodes: 24 });

    var w126 = r126.profiles[r126.winningProfileId].stats;
    var w127 = r127.profiles[r127.winningProfileId].stats;
    var w128 = r128.profiles[r128.winningProfileId].stats;
    var w129 = r129.profiles[r129.winningProfileId].stats;

    var rows = [
      {
        rowId: 'J1-Titans-Surprise-Gradient-Needle-Recall-Accuracy',
        passNumber: 126,
        metric: 'needleInHaystackRecallPct',
        threshold: '=== 100.0%',
        observed: w126.needleInHaystackRecallPct.mean,
        verified: w126.needleInHaystackRecallPct.mean === 100
      },
      {
        rowId: 'J2-Titans-Momentum-Surprise-Retention-Ratio',
        passNumber: 126,
        metric: 'surpriseTriggeredRetentionRatio',
        threshold: '>= 14.0x',
        observed: w126.surpriseTriggeredRetentionRatio.mean,
        verified: w126.surpriseTriggeredRetentionRatio.mean >= 14.0
      },
      {
        rowId: 'J3-Gated-DeltaNet-Selective-Key-Overwrite-Zero-Crosstalk',
        passNumber: 127,
        metric: 'selectiveKeyOverwriteAccuracyPct',
        threshold: '=== 100.0%',
        observed: w127.selectiveKeyOverwriteAccuracyPct.mean,
        verified: w127.selectiveKeyOverwriteAccuracyPct.mean === 100
      },
      {
        rowId: 'J4-Gated-DeltaNet-Beta2-Householder-Reflection-Isometry',
        passNumber: 127,
        metric: 'householderUnitarityAtBeta2Defect',
        threshold: '<= 1e-9',
        observed: w127.householderUnitarityAtBeta2Defect.mean,
        verified: w127.householderUnitarityAtBeta2Defect.mean <= 1e-9
      },
      {
        rowId: 'J5-RWKV7-Goose-NonDiagonal-S5-Permutation-Tracking',
        passNumber: 128,
        metric: 's5SymmetricGroupTrackingPct',
        threshold: '=== 100.0%',
        observed: w128.s5SymmetricGroupTrackingPct.mean,
        verified: w128.s5SymmetricGroupTrackingPct.mean === 100
      },
      {
        rowId: 'J6-RWKV7-Goose-O1-Constant-State-Memory-Guarantee',
        passNumber: 128,
        metric: 'constantMemoryO1InferencePct',
        threshold: '=== 100.0%',
        observed: w128.constantMemoryO1InferencePct.mean,
        verified: w128.constantMemoryO1InferencePct.mean === 100
      },
      {
        rowId: 'J7-GSA-Bounded-Slot-KV-Compression-Ratio',
        passNumber: 129,
        metric: 'slotCompressionRatio',
        threshold: '>= 16.0x',
        observed: w129.slotCompressionRatio.mean,
        verified: w129.slotCompressionRatio.mean >= 16.0
      },
      {
        rowId: 'J8-GSA-Chrono-Forget-Gate-Bias-Multi-Needle-Recall',
        passNumber: 129,
        metric: 'multiNeedleRecallAccuracyPct',
        threshold: '=== 100.0%',
        observed: w129.multiNeedleRecallAccuracyPct.mean,
        verified: w129.multiNeedleRecallAccuracyPct.mean === 100
      },
      {
        rowId: 'J9-GSA-Two-Pass-Softmax-Readout-Stability',
        passNumber: 129,
        metric: 'softmaxBoundedOutputStabilityPct',
        threshold: '=== 100.0%',
        observed: w129.softmaxBoundedOutputStabilityPct.mean,
        verified: w129.softmaxBoundedOutputStabilityPct.mean === 100
      },
      {
        rowId: 'J10-Phase25-All-Four-Fast-Weight-Memory-Passes-100-Score',
        passNumber: 130,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r126.winningScore, r127.winningScore, r128.winningScore, r129.winningScore].join(' / '),
        verified: r126.winningScore === 100 && r127.winningScore === 100 && r128.winningScore === 100 && r129.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-130-TITANS-DELTANET-RWKV7-PHASE25-AUDIT',
      passNumber: 130,
      phase: 'Phase XXV: Titans, Gated DeltaNet, RWKV-7 & Fast-Weight Memory',
      generatedAt: '2026-11-09T19:54:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass126Sha256: r126.sha256,
        pass127Sha256: r127.sha256,
        pass128Sha256: r128.sha256,
        pass129Sha256: r129.sha256
      }
    };
    result.phase25Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass130Phase25Audit: runPass130Phase25Audit
  };
});
