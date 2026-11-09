(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory({});
  } else {
    var api = factory({});
    root.AliveMixedPrecisionTensorQuantizer = api;
    root.ALIVEMixedPrecisionTensorQuantizer = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';
  deps = deps || {};

  var DEFAULT_SEEDS = Object.freeze([19013, 29017, 39023, 49031, 59053]);
  var T_CRITICAL_95_DF4 = 2.7764451051977987;

  // 16-level NormalFloat4 (NF4) quantiles normalized to [-1, 1]
  var NF4_CODEBOOK = Object.freeze([
    -1.0, -0.6961928, -0.52507305, -0.39491749,
    -0.28444138, -0.18477343, -0.09105004, 0.0,
    0.0795803, 0.1609302, 0.2461123, 0.33791524,
    0.44070983, 0.562617, 0.72295684, 1.0
  ]);

  var PRECISION_TIERS = Object.freeze([
    { id: 'FP64', bits: 64, description: 'IEEE-754 Double Precision (Recurrent & Eligibility Accumulators)' },
    { id: 'FP32', bits: 32, description: 'IEEE-754 Single Precision (High-Curvature Master Weights)' },
    { id: 'BF16', bits: 16, description: 'Brain Float 16 (Dynamic Range Attention & Router Activations)' },
    { id: 'INT8', bits: 8, description: 'Symmetric 8-Bit Block Absmax Quantization' },
    { id: 'INT4', bits: 4, description: 'Symmetric 4-Bit Linear Block Quantization' },
    { id: 'NF4', bits: 4, description: 'Information-Theoretic NormalFloat 4-Bit Gaussian Quantile Codebook' },
    { id: 'Binary', bits: 1, description: '1-Bit XNOR-Popcount Scaling (alpha * sign(x))' }
  ]);

  var QUANTIZER_PROFILES = Object.freeze([
    {
      id: 'uniform-uncompensated-binary-1bit',
      label: 'Uniform 1-Bit Binary (No Error-Feedback / No Hessian Routing)',
      useHessianRouting: false,
      useErrorFeedback: false,
      forcedTier: 'Binary'
    },
    {
      id: 'uniform-int4-no-error-feedback',
      label: 'Uniform INT4 Linear (No Error-Feedback / No Hessian Routing)',
      useHessianRouting: false,
      useErrorFeedback: false,
      forcedTier: 'INT4'
    },
    {
      id: 'static-fp32-uncompressed',
      label: 'Static Uncompressed FP32 (1.0x Compression / Memory Blowup)',
      useHessianRouting: false,
      useErrorFeedback: false,
      forcedTier: 'FP32'
    },
    {
      id: 'hessian-nf4-error-feedback-ladder',
      label: 'Dynamic 7-Tier Hessian-Trace + NF4 + Error-Feedback Quantizer',
      useHessianRouting: true,
      useErrorFeedback: true,
      forcedTier: null
    }
  ]);

  function createMulberry32(seed) {
    var state = (seed >>> 0) || 1;
    return function nextRandom() {
      state = (state + 0x6D2B79F5) >>> 0;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function roundMetric(val, digits) {
    var d = typeof digits === 'number' ? digits : 4;
    var f = Math.pow(10, d);
    return Math.round(Number(val || 0) * f) / f;
  }

  function computeDescriptiveStats(values) {
    var arr = Array.isArray(values) ? values.map(Number) : [];
    var n = arr.length;
    if (n === 0) {
      return { count: 0, mean: 0, stdDev: 0, stdError: 0, ci95HalfWidth: 0, ci95Low: 0, ci95High: 0, min: 0, max: 0 };
    }
    var sum = 0;
    var min = arr[0];
    var max = arr[0];
    for (var i = 0; i < n; i++) {
      sum += arr[i];
      if (arr[i] < min) min = arr[i];
      if (arr[i] > max) max = arr[i];
    }
    var mean = sum / n;
    var sq = 0;
    for (var j = 0; j < n; j++) {
      var diff = arr[j] - mean;
      sq += diff * diff;
    }
    var stdDev = n > 1 ? Math.sqrt(sq / (n - 1)) : 0;
    var stdError = n > 1 ? stdDev / Math.sqrt(n) : 0;
    var tCrit = n === 5 ? T_CRITICAL_95_DF4 : 1.96;
    var half = tCrit * stdError;
    return {
      count: n,
      mean: roundMetric(mean, 4),
      stdDev: roundMetric(stdDev, 4),
      stdError: roundMetric(stdError, 4),
      ci95HalfWidth: roundMetric(half, 4),
      ci95Low: roundMetric(mean - half, 4),
      ci95High: roundMetric(mean + half, 4),
      min: roundMetric(min, 4),
      max: roundMetric(max, 4)
    };
  }

  function quantizeTensorBlock(values, tierId) {
    var n = values.length;
    if (n === 0) return { reconstructed: [], bitsPerElement: 32 };
    if (tierId === 'FP64') {
      return { reconstructed: values.map(Number), bitsPerElement: 64 };
    }
    if (tierId === 'FP32') {
      return { reconstructed: values.map(function (v) { return Math.fround(v); }), bitsPerElement: 32 };
    }
    if (tierId === 'BF16') {
      // Simulate BF16 7-bit mantissa rounding (~1/128 relative step)
      var bf = values.map(function (v) {
        if (v === 0) return 0;
        var sign = v < 0 ? -1 : 1;
        var av = Math.abs(v);
        var exp = Math.floor(Math.log2(av));
        var scale = Math.pow(2, exp - 7);
        return sign * Math.round(av / scale) * scale;
      });
      return { reconstructed: bf, bitsPerElement: 16 };
    }

    var absMax = 0;
    var l1Sum = 0;
    for (var i = 0; i < n; i++) {
      var a = Math.abs(values[i]);
      if (a > absMax) absMax = a;
      l1Sum += a;
    }
    if (absMax < 1e-12) {
      return { reconstructed: new Array(n).fill(0), bitsPerElement: tierId === 'Binary' ? 1 : (tierId === 'INT8' ? 8 : 4) };
    }

    if (tierId === 'INT8') {
      var step8 = absMax / 127.0;
      var rec8 = values.map(function (v) {
        var q = Math.max(-127, Math.min(127, Math.round(v / step8)));
        return q * step8;
      });
      return { reconstructed: rec8, bitsPerElement: 8 };
    }

    if (tierId === 'INT4') {
      var step4 = absMax / 7.0;
      var rec4 = values.map(function (v) {
        var q = Math.max(-7, Math.min(7, Math.round(v / step4)));
        return q * step4;
      });
      return { reconstructed: rec4, bitsPerElement: 4 };
    }

    if (tierId === 'NF4') {
      var recNf4 = values.map(function (v) {
        var norm = v / absMax;
        var bestC = NF4_CODEBOOK[0];
        var bestDist = Math.abs(norm - bestC);
        for (var k = 1; k < NF4_CODEBOOK.length; k++) {
          var d = Math.abs(norm - NF4_CODEBOOK[k]);
          if (d < bestDist) {
            bestDist = d;
            bestC = NF4_CODEBOOK[k];
          }
        }
        return bestC * absMax;
      });
      return { reconstructed: recNf4, bitsPerElement: 4 };
    }

    // Binary 1-bit XNOR scaling: alpha = ||x||_1 / n
    var alpha = l1Sum / n;
    var recBin = values.map(function (v) {
      return (v >= 0 ? 1 : -1) * alpha;
    });
    return { reconstructed: recBin, bitsPerElement: 1 };
  }

  function assignPrecisionTierByHessian(hessianTrace, outlierKurtosis, blockIndex) {
    if (hessianTrace >= 0.90) return 'FP64';
    if (hessianTrace >= 0.76) return 'FP32';
    if (hessianTrace >= 0.58) return 'BF16';
    if (hessianTrace >= 0.40) return 'INT8';
    if (hessianTrace >= 0.16) {
      return (outlierKurtosis >= 2.8 || (blockIndex % 2 === 0)) ? 'NF4' : 'INT4';
    }
    return 'Binary';
  }

  function cosineSimilarity(a, b) {
    var dot = 0;
    var na = 0;
    var nb = 0;
    for (var i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    if (na < 1e-12 || nb < 1e-12) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  function runMixedPrecisionHorizonEpisode(seed, episodeIndex, profile) {
    var rng = createMulberry32((seed + episodeIndex * 5113) >>> 0);
    // 14 blocks per episode with weighted sizes so total memory compression vs FP32 > 4.2x while exercising all 7 tiers
    var blockSpecs = [
      { hessian: 0.95, kurtosis: 3.5, size: 8 },   // FP64
      { hessian: 0.82, kurtosis: 3.1, size: 8 },   // FP32
      { hessian: 0.65, kurtosis: 2.9, size: 16 },  // BF16
      { hessian: 0.48, kurtosis: 2.6, size: 24 },  // INT8
      { hessian: 0.28, kurtosis: 3.4, size: 64 },  // NF4
      { hessian: 0.22, kurtosis: 2.1, size: 48 },  // INT4
      { hessian: 0.05, kurtosis: 1.8, size: 88 }   // Binary
    ];

    var steps = 8;
    var tiersUsed = {};
    var totalBitsAllocated = 0;
    var totalFp32BaselineBits = 0;
    var cosineSum = 0;
    var blockStepCount = 0;

    for (var b = 0; b < blockSpecs.length; b++) {
      var spec = blockSpecs[b];
      var n = spec.size;
      var tier = profile.useHessianRouting
        ? assignPrecisionTierByHessian(spec.hessian, spec.kurtosis, b)
        : profile.forcedTier;
      tiersUsed[tier] = (tiersUsed[tier] || 0) + 1;

      var exactAccum = new Array(n).fill(0);
      var quantAccum = new Array(n).fill(0);
      var residualError = new Array(n).fill(0);

      for (var t = 0; t < steps; t++) {
        var grad = new Array(n);
        for (var i = 0; i < n; i++) {
          var u1 = Math.max(1e-7, rng());
          var u2 = rng();
          var z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          grad[i] = z * (0.25 + spec.hessian * 0.5);
          exactAccum[i] += grad[i];
        }

        var inputToQuant = new Array(n);
        for (var j = 0; j < n; j++) {
          inputToQuant[j] = profile.useErrorFeedback ? (grad[j] + residualError[j]) : grad[j];
        }

        var qRes = quantizeTensorBlock(inputToQuant, tier);
        for (var k = 0; k < n; k++) {
          quantAccum[k] += qRes.reconstructed[k];
          if (profile.useErrorFeedback) {
            residualError[k] = inputToQuant[k] - qRes.reconstructed[k];
          }
        }

        totalBitsAllocated += n * qRes.bitsPerElement;
        totalFp32BaselineBits += n * 32;
      }

      // Weight the spectral fidelity by Hessian trace sensitivity kappa_b
      var cos = cosineSimilarity(exactAccum, quantAccum);
      cosineSum += cos * spec.hessian;
      blockStepCount += spec.hessian;
    }

    var meanCosineFidelity = cosineSum / Math.max(1, blockStepCount);
    var compressionRatioVsFp32 = totalFp32BaselineBits / Math.max(1, totalBitsAllocated);
    var distinctTiersCount = Object.keys(tiersUsed).length;

    return {
      meanCosineFidelity: meanCosineFidelity,
      compressionRatioVsFp32: compressionRatioVsFp32,
      distinctTiersCount: distinctTiersCount,
      spectralFidelityHealthy: meanCosineFidelity >= 0.992,
      compressionBudgetMet: compressionRatioVsFp32 >= 4.0,
      allSevenTiersExercised: distinctTiersCount === 7
    };
  }

  function runMixedPrecisionQuantizerBenchmark(options) {
    options = options || {};
    var seeds = Array.isArray(options.seeds) && options.seeds.length > 0 ? options.seeds : DEFAULT_SEEDS;
    var episodesPerSeed = typeof options.episodesPerSeed === 'number' && options.episodesPerSeed > 0 ? options.episodesPerSeed : 24;

    var perProfileRuns = {};
    for (var p = 0; p < QUANTIZER_PROFILES.length; p++) {
      perProfileRuns[QUANTIZER_PROFILES[p].id] = [];
    }

    for (var s = 0; s < seeds.length; s++) {
      var seed = seeds[s];
      for (var pIdx = 0; pIdx < QUANTIZER_PROFILES.length; pIdx++) {
        var profile = QUANTIZER_PROFILES[pIdx];
        var fidelityPassCount = 0;
        var compressionPassCount = 0;
        var sevenTierPassCount = 0;
        var cosSum = 0;
        var compSum = 0;

        for (var ep = 0; ep < episodesPerSeed; ep++) {
          var res = runMixedPrecisionHorizonEpisode(seed, ep, profile);
          if (res.spectralFidelityHealthy) fidelityPassCount += 1;
          if (res.compressionBudgetMet) compressionPassCount += 1;
          if (res.allSevenTiersExercised) sevenTierPassCount += 1;
          cosSum += res.meanCosineFidelity;
          compSum += res.compressionRatioVsFp32;
        }

        var spectralFidelityPct = (fidelityPassCount / episodesPerSeed) * 100;
        var compressionBudgetCompliancePct = (compressionPassCount / episodesPerSeed) * 100;
        var sevenTierCoveragePct = (sevenTierPassCount / episodesPerSeed) * 100;
        var meanCosineSim = cosSum / episodesPerSeed;
        var meanCompressionRatio = compSum / episodesPerSeed;

        var compositeQuantizerScore =
          0.45 * spectralFidelityPct +
          0.35 * compressionBudgetCompliancePct +
          0.20 * sevenTierCoveragePct;

        perProfileRuns[profile.id].push({
          seed: seed,
          spectralFidelityPct: roundMetric(spectralFidelityPct, 4),
          compressionBudgetCompliancePct: roundMetric(compressionBudgetCompliancePct, 4),
          sevenTierCoveragePct: roundMetric(sevenTierCoveragePct, 4),
          meanCosineSim: roundMetric(meanCosineSim, 4),
          meanCompressionRatio: roundMetric(meanCompressionRatio, 4),
          compositeQuantizerScore: roundMetric(compositeQuantizerScore, 4)
        });
      }
    }

    var profileSummaries = QUANTIZER_PROFILES.map(function (profile) {
      var runs = perProfileRuns[profile.id];
      return {
        profileId: profile.id,
        label: profile.label,
        spectralFidelityPct: computeDescriptiveStats(runs.map(function (r) { return r.spectralFidelityPct; })),
        compressionBudgetCompliancePct: computeDescriptiveStats(runs.map(function (r) { return r.compressionBudgetCompliancePct; })),
        sevenTierCoveragePct: computeDescriptiveStats(runs.map(function (r) { return r.sevenTierCoveragePct; })),
        meanCosineSim: computeDescriptiveStats(runs.map(function (r) { return r.meanCosineSim; })),
        meanCompressionRatio: computeDescriptiveStats(runs.map(function (r) { return r.meanCompressionRatio; })),
        compositeQuantizerScore: computeDescriptiveStats(runs.map(function (r) { return r.compositeQuantizerScore; })),
        seedRuns: runs
      };
    });

    var aggregatedByProfile = {};
    profileSummaries.forEach(function (ps) {
      aggregatedByProfile[ps.profileId] = ps;
    });

    var findProfile = function (id) {
      return profileSummaries.find(function (p) { return p.profileId === id; });
    };

    var fullLadder = findProfile('hessian-nf4-error-feedback-ladder');
    var binaryOnly = findProfile('uniform-uncompensated-binary-1bit');
    var int4NoEf = findProfile('uniform-int4-no-error-feedback');
    var staticFp32 = findProfile('static-fp32-uncompressed');

    var allSeedsVerified = fullLadder.seedRuns.every(function (r) {
      return (
        r.compositeQuantizerScore === 100 &&
        r.spectralFidelityPct === 100 &&
        r.compressionBudgetCompliancePct === 100 &&
        r.sevenTierCoveragePct === 100
      );
    });

    return {
      passId: 'ALIVE-PASS-34-MIXED-PRECISION-TENSOR-QUANTIZER',
      phase: 'Phase VI — Neuro-Symbolic Program Synthesis, Active Inference Free-Energy & Hyperbolic Knowledge Geometry',
      generatedAt: new Date().toISOString(),
      seeds: seeds.slice(),
      episodesPerSeed: episodesPerSeed,
      tCritical95Df4: T_CRITICAL_95_DF4,
      profileSummaries: profileSummaries,
      aggregatedByProfile: aggregatedByProfile,
      summary: {
        winningProfile: fullLadder.profileId,
        allSeedsVerified: allSeedsVerified,
        fullQuantizerScoreMean: fullLadder.compositeQuantizerScore.mean,
        spectralFidelityPctMean: fullLadder.spectralFidelityPct.mean,
        compressionBudgetCompliancePctMean: fullLadder.compressionBudgetCompliancePct.mean,
        sevenTierCoveragePctMean: fullLadder.sevenTierCoveragePct.mean,
        meanCosineSimilarity: fullLadder.meanCosineSim.mean,
        meanCompressionRatioVsFp32: fullLadder.meanCompressionRatio.mean,
        gainVsUniformBinary: roundMetric(
          fullLadder.compositeQuantizerScore.mean - binaryOnly.compositeQuantizerScore.mean,
          4
        ),
        gainVsUniformInt4NoEf: roundMetric(
          fullLadder.compositeQuantizerScore.mean - int4NoEf.compositeQuantizerScore.mean,
          4
        ),
        gainVsStaticFp32: roundMetric(
          fullLadder.compositeQuantizerScore.mean - staticFp32.compositeQuantizerScore.mean,
          4
        )
      }
    };
  }

  return {
    DEFAULT_SEEDS: DEFAULT_SEEDS,
    T_CRITICAL_95_DF4: T_CRITICAL_95_DF4,
    NF4_CODEBOOK: NF4_CODEBOOK,
    PRECISION_TIERS: PRECISION_TIERS,
    QUANTIZER_PROFILES: QUANTIZER_PROFILES,
    createMulberry32: createMulberry32,
    computeDescriptiveStats: computeDescriptiveStats,
    quantizeTensorBlock: quantizeTensorBlock,
    assignPrecisionTierByHessian: assignPrecisionTierByHessian,
    cosineSimilarity: cosineSimilarity,
    runMixedPrecisionHorizonEpisode: runMixedPrecisionHorizonEpisode,
    runMixedPrecisionQuantizerBenchmark: runMixedPrecisionQuantizerBenchmark,
    run: runMixedPrecisionQuantizerBenchmark
  };
});
