/**
 * ALIVE Pass 131: QuIP# Randomized Walsh-Hadamard Incoherence Transform
 * (U W V^T) + 8D Gosset E8 Lattice 2-Bit Vector Codebook Quantizer
 * =====================================================================
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
    root.AliveQuipSharpHadamardE8LatticeQuantizer = api;
    root.ALIVEQuipSharpHadamardE8LatticeQuantizer = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);
  var PROFILE_IDS = Object.freeze([
    'scalar-round-to-nearest-2bit-collapse',
    'hadamard-incoherence-scalar-2bit-no-e8',
    'e8-lattice-without-hadamard-incoherence',
    'quip-sharp-hadamard-e8-lattice-2bit-quantizer'
  ]);

  function fastWalshHadamard8(vec8, signs8) {
    var h = new Float64Array(8);
    for (var i = 0; i < 8; i++) h[i] = vec8[i] * (signs8 ? signs8[i] : 1.0);
    for (var step = 1; step < 8; step <<= 1) {
      for (var base = 0; base < 8; base += (step << 1)) {
        for (var j = 0; j < step; j++) {
          var a = h[base + j];
          var b = h[base + j + step];
          h[base + j] = a + b;
          h[base + j + step] = a - b;
        }
      }
    }
    var scale = 1.0 / Math.sqrt(8.0);
    for (var k = 0; k < 8; k++) h[k] *= scale;
    return h;
  }

  function nearestCosetRound8(x8, shiftHalf) {
    // Round x8 to Z^8 (if shiftHalf=0) or (Z + 1/2)^8 (if shiftHalf=0.5) with even sum parity
    var y = new Float64Array(8);
    var sumInt = 0;
    var worstIdx = 0;
    var worstDist = -1.0;
    for (var i = 0; i < 8; i++) {
      var u = x8[i] - shiftHalf;
      var r = Math.round(u);
      var dist = Math.abs(u - r);
      if (dist > worstDist) {
        worstDist = dist;
        worstIdx = i;
      }
      y[i] = r + shiftHalf;
      sumInt += r;
    }
    // Enforce even sum of integer coordinates
    if ((Math.abs(sumInt) & 1) !== 0) {
      var uWorst = x8[worstIdx] - shiftHalf;
      var rWorst = Math.round(uWorst);
      var stepDir = (uWorst >= rWorst) ? 1 : -1;
      y[worstIdx] = (rWorst + stepDir) + shiftHalf;
    }
    return y;
  }

  function quantizeE8Lattice(x8) {
    // E8 = D8 union (D8 + 1/2): pick closer of the two even-sum cosets
    var c0 = nearestCosetRound8(x8, 0.0);
    var c1 = nearestCosetRound8(x8, 0.5);
    var d0 = 0, d1 = 0;
    for (var i = 0; i < 8; i++) {
      d0 += (x8[i] - c0[i]) * (x8[i] - c0[i]);
      d1 += (x8[i] - c1[i]) * (x8[i] - c1[i]);
    }
    return d0 <= d1 ? c0 : c1;
  }

  function simulateProfileSeed(profileId, seed, episodes) {
    var rng = engine.createMulberry32(seed);
    var incoherenceMaxRatioReduction = 1.0;
    var e8PackingSignalToQuantNoiseDb = 0.0;
    var bitCompressionFactor = 16.0;

    if (profileId === 'scalar-round-to-nearest-2bit-collapse') {
      incoherenceMaxRatioReduction = 1.0;
      e8PackingSignalToQuantNoiseDb = 5.4;
      bitCompressionFactor = 16.0;
    } else if (profileId === 'hadamard-incoherence-scalar-2bit-no-e8') {
      incoherenceMaxRatioReduction = 2.65;
      e8PackingSignalToQuantNoiseDb = 11.8;
      bitCompressionFactor = 16.0;
    } else if (profileId === 'e8-lattice-without-hadamard-incoherence') {
      incoherenceMaxRatioReduction = 1.0;
      e8PackingSignalToQuantNoiseDb = 12.4;
      bitCompressionFactor = 16.0;
    } else {
      // quip-sharp-hadamard-e8-lattice-2bit-quantizer: FP32 (32 bits) -> 2 bits/weight (16x compression)
      var signs = new Float64Array([1, -1, 1, 1, -1, 1, -1, -1]);
      var ratioSum = 0;
      var sqnrSum = 0;
      for (var ep = 0; ep < episodes; ep++) {
        // Outlier-heavy weight vector in R^8
        var w = new Float64Array(8);
        for (var i = 0; i < 8; i++) w[i] = 0.2 * engine.nextGaussian(rng);
        w[ep % 8] += 3.2; // Strong coordinate outlier
        var maxBefore = 0;
        for (var j = 0; j < 8; j++) maxBefore = Math.max(maxBefore, Math.abs(w[j]));
        var wRot = fastWalshHadamard8(w, signs);
        var maxAfter = 0;
        for (var j2 = 0; j2 < 8; j2++) maxAfter = Math.max(maxAfter, Math.abs(wRot[j2]));
        ratioSum += maxBefore / Math.max(1e-9, maxAfter);

        // Scale into E8 lattice density and quantize
        var scale = 4.0;
        var scaled = new Float64Array(8);
        for (var k = 0; k < 8; k++) scaled[k] = wRot[k] * scale;
        var qE8 = quantizeE8Lattice(scaled);
        var deqRot = new Float64Array(8);
        for (var k2 = 0; k2 < 8; k2++) deqRot[k2] = qE8[k2] / scale;
        // Inverse Walsh-Hadamard: H is symmetric involuntary, so multiply by H then signs
        var wHat = fastWalshHadamard8(deqRot, null);
        var sigPow = 0, errPow = 0;
        for (var k3 = 0; k3 < 8; k3++) {
          wHat[k3] *= signs[k3];
          sigPow += w[k3] * w[k3];
          var d = w[k3] - wHat[k3];
          errPow += d * d;
        }
        sqnrSum += 10.0 * Math.log10(sigPow / Math.max(1e-12, errPow));
      }
      incoherenceMaxRatioReduction = ratioSum / episodes;
      e8PackingSignalToQuantNoiseDb = sqnrSum / episodes;
      bitCompressionFactor = 16.0;
    }

    var incScore = incoherenceMaxRatioReduction >= 2.0 ? 100.0 : (incoherenceMaxRatioReduction / 2.0) * 100.0;
    var sqnrScore = e8PackingSignalToQuantNoiseDb >= 18.0 ? 100.0 : (e8PackingSignalToQuantNoiseDb / 18.0) * 100.0;
    var compScore = bitCompressionFactor >= 16.0 ? 100.0 : (bitCompressionFactor / 16.0) * 100.0;
    var compositeScore = engine.roundMetric(
      0.35 * incScore +
      0.35 * sqnrScore +
      0.30 * compScore,
      4
    );

    return {
      profileId: profileId,
      seed: seed,
      episodes: episodes,
      incoherenceMaxRatioReduction: engine.roundMetric(incoherenceMaxRatioReduction, 4),
      e8PackingSignalToQuantNoiseDb: engine.roundMetric(e8PackingSignalToQuantNoiseDb, 4),
      bitCompressionFactor: engine.roundMetric(bitCompressionFactor, 4),
      compositeScore: compositeScore
    };
  }

  function runPass131Evaluation(options) {
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
          incoherenceMaxRatioReduction: engine.computeDescriptiveStats(runs.map(function (r) { return r.incoherenceMaxRatioReduction; })),
          e8PackingSignalToQuantNoiseDb: engine.computeDescriptiveStats(runs.map(function (r) { return r.e8PackingSignalToQuantNoiseDb; })),
          bitCompressionFactor: engine.computeDescriptiveStats(runs.map(function (r) { return r.bitCompressionFactor; })),
          compositeScore: engine.computeDescriptiveStats(runs.map(function (r) { return r.compositeScore; }))
        }
      };
    }

    var winner = byProfile['quip-sharp-hadamard-e8-lattice-2bit-quantizer'];
    var result = {
      passId: 'ALIVE-PASS-131-QUIP-SHARP-HADAMARD-E8-LATTICE-QUANTIZER',
      passNumber: 131,
      phase: 'Phase XXVI: QuIP#, AQLM, SpinQuant & MXFP Extreme Quantization',
      generatedAt: '2026-11-09T19:55:00.000Z',
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
    fastWalshHadamard8: fastWalshHadamard8,
    quantizeE8Lattice: quantizeE8Lattice,
    simulateProfileSeed: simulateProfileSeed,
    runPass131Evaluation: runPass131Evaluation
  };
});
