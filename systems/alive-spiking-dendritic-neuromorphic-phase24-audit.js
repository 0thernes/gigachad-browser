/**
 * ALIVE Pass 125: Phase XXIV Spiking Neuromorphic & Dendritic Weight
 * Acceptance Matrix (V1..V10) & Cryptographic SHA-256 Freeze
 * ==================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p121 = null;
  var p122 = null;
  var p123 = null;
  var p124 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p121 = require('./alive-triplet-stdp-dopamine-modulated-weights.js');
    p122 = require('./alive-arctangent-fast-sigmoid-surrogate-spiking.js');
    p123 = require('./alive-dendritic-apical-basal-compartment-weights.js');
    p124 = require('./alive-theta-gamma-phase-precession-oscillator-weights.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p121 = root.AliveTripletStdpDopamineModulatedWeights;
    p122 = root.AliveArctangentFastSigmoidSurrogateSpiking;
    p123 = root.AliveDendriticApicalBasalCompartmentWeights;
    p124 = root.AliveThetaGammaPhasePrecessionOscillatorWeights;
  }
  var api = factory(engine, p121, p122, p123, p124);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveSpikingDendriticNeuromorphicPhase24Audit = api;
    root.ALIVESpikingDendriticNeuromorphicPhase24Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p121, p122, p123, p124) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass125Phase24Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r121 = p121.runPass121Evaluation({ seeds: seeds, episodes: 24 });
    var r122 = p122.runPass122Evaluation({ seeds: seeds, episodes: 24 });
    var r123 = p123.runPass123Evaluation({ seeds: seeds, episodes: 24 });
    var r124 = p124.runPass124Evaluation({ seeds: seeds, episodes: 24 });

    var w121 = r121.profiles[r121.winningProfileId].stats;
    var w122 = r122.profiles[r122.winningProfileId].stats;
    var w123 = r123.profiles[r123.winningProfileId].stats;
    var w124 = r124.profiles[r124.winningProfileId].stats;

    var rows = [
      {
        rowId: 'V1-Triplet-STDP-Dopamine-RPE-Distal-Credit-Accuracy',
        passNumber: 121,
        metric: 'distalCreditAssignmentAccuracyPct',
        threshold: '=== 100.0%',
        observed: w121.distalCreditAssignmentAccuracyPct.mean,
        verified: w121.distalCreditAssignmentAccuracyPct.mean === 100
      },
      {
        rowId: 'V2-Triplet-STDP-Homeostatic-Threshold-Bias-Stability',
        passNumber: 121,
        metric: 'firingRateHomeostasisStabilityPct',
        threshold: '=== 100.0%',
        observed: w121.firingRateHomeostasisStabilityPct.mean,
        verified: w121.firingRateHomeostasisStabilityPct.mean === 100
      },
      {
        rowId: 'V3-ALIF-Adaptive-Threshold-Bias-Working-Memory',
        passNumber: 122,
        metric: 'temporalWorkingMemoryRetentionPct',
        threshold: '=== 100.0%',
        observed: w122.temporalWorkingMemoryRetentionPct.mean,
        verified: w122.temporalWorkingMemoryRetentionPct.mean === 100
      },
      {
        rowId: 'V4-ALIF-Arctan-Surrogate-Gradient-Cosine-Fidelity',
        passNumber: 122,
        metric: 'surrogateGradientCosineFidelity',
        threshold: '>= 0.99',
        observed: w122.surrogateGradientCosineFidelity.mean,
        verified: w122.surrogateGradientCosineFidelity.mean >= 0.99
      },
      {
        rowId: 'V5-Dendritic-Single-Neuron-Nonlinear-XOR-Solvability',
        passNumber: 123,
        metric: 'singleLayerXorSolvabilityPct',
        threshold: '=== 100.0%',
        observed: w123.singleLayerXorSolvabilityPct.mean,
        verified: w123.singleLayerXorSolvabilityPct.mean === 100
      },
      {
        rowId: 'V6-Dendritic-Apical-Basal-Burst-Credit-Alignment',
        passNumber: 123,
        metric: 'burstMultiplexedCreditAlignmentDeg',
        threshold: '<= 5.0 deg',
        observed: w123.burstMultiplexedCreditAlignmentDeg.mean,
        verified: w123.burstMultiplexedCreditAlignmentDeg.mean <= 5.0
      },
      {
        rowId: 'V7-Theta-Gamma-7Slot-Working-Memory-Order-Accuracy',
        passNumber: 124,
        metric: 'gammaSlotSequenceOrderAccuracyPct',
        threshold: '=== 100.0%',
        observed: w124.gammaSlotSequenceOrderAccuracyPct.mean,
        verified: w124.gammaSlotSequenceOrderAccuracyPct.mean === 100
      },
      {
        rowId: 'V8-Theta-Gamma-Phase-Amplitude-Modulation-Index',
        passNumber: 124,
        metric: 'modulationIndexTort',
        threshold: '>= 0.95',
        observed: w124.modulationIndexTort.mean,
        verified: w124.modulationIndexTort.mean >= 0.95
      },
      {
        rowId: 'V9-Theta-Gamma-Phase-Precession-Linear-Correlation',
        passNumber: 124,
        metric: 'phasePrecessionLinearCorrelation',
        threshold: '>= 0.99',
        observed: w124.phasePrecessionLinearCorrelation.mean,
        verified: w124.phasePrecessionLinearCorrelation.mean >= 0.99
      },
      {
        rowId: 'V10-Phase24-All-Four-Neuromorphic-Passes-100-Score',
        passNumber: 125,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r121.winningScore, r122.winningScore, r123.winningScore, r124.winningScore].join(' / '),
        verified: r121.winningScore === 100 && r122.winningScore === 100 && r123.winningScore === 100 && r124.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-125-SPIKING-DENDRITIC-NEUROMORPHIC-PHASE24-AUDIT',
      passNumber: 125,
      phase: 'Phase XXIV: Spiking Neuromorphic & Dendritic Compartment Weights',
      generatedAt: '2026-11-09T19:49:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass121Sha256: r121.sha256,
        pass122Sha256: r122.sha256,
        pass123Sha256: r123.sha256,
        pass124Sha256: r124.sha256
      }
    };
    result.phase24Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass125Phase24Audit: runPass125Phase24Audit
  };
});
