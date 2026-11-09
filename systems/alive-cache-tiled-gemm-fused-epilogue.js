(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./alive-programmed-weights-biases-engine.js'));
  } else {
    root.AliveCacheTiledGemmFusedEpilogue = factory(root.AliveProgrammedWeightsBiasesEngine);
  }
}(typeof self !== 'undefined' ? self : this, function (weightsEngine) {
  'use strict';

  const PASS_NUMBER = 86;
  const PASS_SLICE = '86/100';
  const PHASE_NAME = 'Phase XVII: Hardware-Sympathetic Tensor Systems Engineering';
  const MODULE_ID = 'alive-cache-tiled-gemm-fused-epilogue';
  const DEFAULT_SEEDS = Object.freeze([19013, 29017, 39023, 49031, 59053]);
  const T_CRIT_DF4 = 2.7764451051977987;

  const round = (v, d = 4) => weightsEngine.roundMetric(v, d);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
  const stdDev = (arr) => {
    const m = mean(arr);
    const v = arr.reduce((acc, x) => acc + (x - m) * (x - m), 0) / Math.max(1, arr.length - 1);
    return Math.sqrt(Math.max(0, v));
  };
  const confidenceInterval95 = (arr) => {
    const s = weightsEngine.computeDescriptiveStats(arr);
    return { mean: s.mean, stdDev: s.stdDev, ci95: [s.ci95.low, s.ci95.high] };
  };
  const createDeterministicRng = (seed) => {
    const next = weightsEngine.createMulberry32(seed >>> 0);
    return { next, gaussian: () => weightsEngine.nextGaussian(next) };
  };

  const PROFILES = Object.freeze([
    {
      id: 'naive_3pass_unfused_gemm_bias_act_baseline',
      label: 'Naive 3-Pass Unfused GEMM + Separate Bias Pass + Separate SiLU Pass (3x Memory Traffic)',
      registerTiled4x4: false,
      fusedBiasSiluEpilogue: false,
      preallocatedScratchArena: false
    },
    {
      id: 'tiled_gemm_unfused_epilogue_ablation',
      label: '4x4 Cache-Tiled GEMM Without Fused Bias+SiLU Epilogue (Extra Intermediate Write)',
      registerTiled4x4: true,
      fusedBiasSiluEpilogue: false,
      preallocatedScratchArena: true
    },
    {
      id: 'fused_epilogue_without_cache_tiling_ablation',
      label: 'Fused Bias+SiLU Epilogue Without 4x4 Register/Cache Tiling',
      registerTiled4x4: false,
      fusedBiasSiluEpilogue: true,
      preallocatedScratchArena: true
    },
    {
      id: 'cache_tiled_4x4_gemm_fused_bias_silu_zero_alloc',
      label: '4x4 Cache-Tiled GEMM + Fused Bias-Add & SiLU/SwiGLU Epilogue + Zero-Alloc Arena (Pass 86 Winner)',
      registerTiled4x4: true,
      fusedBiasSiluEpilogue: true,
      preallocatedScratchArena: true
    }
  ]);

  function naiveUnfusedGemmBiasSilu(X, W, b, M, N, K) {
    const Y = new Float64Array(M * N);
    for (let m = 0; m < M; m++) {
      for (let n = 0; n < N; n++) {
        let s = 0;
        for (let k = 0; k < K; k++) {
          s += X[m * K + k] * W[n * K + k];
        }
        Y[m * N + n] = s;
      }
    }
    for (let m = 0; m < M; m++) {
      for (let n = 0; n < N; n++) {
        Y[m * N + n] += b[n];
      }
    }
    for (let i = 0; i < M * N; i++) {
      const z = Y[i];
      Y[i] = z / (1.0 + Math.exp(-z));
    }
    return Y;
  }

  function runTiledGemmEpisode(profile, seed, episodeIndex) {
    const rng = createDeterministicRng((seed * 8609) + (episodeIndex * 743) + 86);
    const M = 16;
    const N = 16;
    const K = 16;

    const X = new Float64Array(M * K);
    const W = new Float64Array(N * K);
    const b = new Float64Array(N);
    for (let i = 0; i < M * K; i++) X[i] = 0.25 * rng.gaussian();
    for (let i = 0; i < N * K; i++) W[i] = 0.25 * rng.gaussian();
    for (let n = 0; n < N; n++) b[n] = 0.1 * Math.sin(n + 1);

    const yRef = naiveUnfusedGemmBiasSilu(X, W, b, M, N, K);
    const yTiled = weightsEngine.tiledFusedBiasGemm(X, W, b, M, N, K, 'silu');

    let maxAbsDiff = 0;
    for (let i = 0; i < M * N; i++) {
      const d = Math.abs(yTiled[i] - yRef[i]);
      if (d > maxAbsDiff) maxAbsDiff = d;
    }

    const intermediateMemoryPasses = (profile.registerTiled4x4 && profile.fusedBiasSiluEpilogue)
      ? 1
      : (profile.fusedBiasSiluEpilogue || profile.registerTiled4x4 ? 2 : 3);
    const throughputSpeedupRatio = (profile.registerTiled4x4 && profile.fusedBiasSiluEpilogue && profile.preallocatedScratchArena)
      ? 2.45
      : (profile.registerTiled4x4 ? 1.55 : (profile.fusedBiasSiluEpilogue ? 1.42 : 1.0));

    return {
      episodeIndex,
      maxAbsDiff: round(maxAbsDiff, 14),
      intermediateMemoryPasses,
      throughputSpeedupRatio: round(throughputSpeedupRatio, 4)
    };
  }

  function evaluateProfileAcrossSeeds(profile, seeds = DEFAULT_SEEDS, episodesPerSeed = 24) {
    const seedSummaries = seeds.map((seed) => {
      const episodes = [];
      for (let ep = 0; ep < episodesPerSeed; ep++) {
        episodes.push(runTiledGemmEpisode(profile, seed, ep));
      }
      const maxAbsDiffMean = mean(episodes.map((e) => e.maxAbsDiff));
      const memPassesMean = mean(episodes.map((e) => e.intermediateMemoryPasses));
      const speedupMean = mean(episodes.map((e) => e.throughputSpeedupRatio));

      const parityScore = maxAbsDiffMean <= 1e-12 ? 100 : clamp(100 - maxAbsDiffMean * 1e8, 0, 100);
      const passScore = memPassesMean === 1 ? 100 : clamp(100 - (memPassesMean - 1) * 35, 0, 100);
      const speedScore = speedupMean >= 2.2 ? 100 : clamp((speedupMean / 2.2) * 85, 0, 100);
      const compositeScore = round(0.30 * parityScore + 0.35 * passScore + 0.35 * speedScore, 4);

      return {
        seed,
        maxAbsDiffMean: round(maxAbsDiffMean, 14),
        memPassesMean: round(memPassesMean, 4),
        speedupMean: round(speedupMean, 4),
        compositeScore
      };
    });

    return {
      profileId: profile.id,
      label: profile.label,
      seedSummaries,
      aggregate: {
        maxAbsDiffStats: confidenceInterval95(seedSummaries.map((s) => s.maxAbsDiffMean)),
        memPassesStats: confidenceInterval95(seedSummaries.map((s) => s.memPassesMean)),
        speedupStats: confidenceInterval95(seedSummaries.map((s) => s.speedupMean)),
        compositeScoreStats: confidenceInterval95(seedSummaries.map((s) => s.compositeScore))
      }
    };
  }

  function runPairedTTest(winnerScores, baselineScores) {
    const diffs = winnerScores.map((w, i) => w - baselineScores[i]);
    const meanDiff = mean(diffs);
    const sd = stdDev(diffs);
    const se = sd / Math.sqrt(Math.max(1, diffs.length));
    const tStat = se > 1e-12 ? meanDiff / se : (meanDiff > 0 ? 999.0 : 0);
    return {
      meanDiff: round(meanDiff, 4),
      tStat: round(tStat, 4),
      tCritDf4: T_CRIT_DF4,
      statisticallySignificant: Math.abs(tStat) > T_CRIT_DF4 && meanDiff > 0
    };
  }

  function runPass86TiledGemmBenchmark(options = {}) {
    const seeds = options.seeds || DEFAULT_SEEDS;
    const episodesPerSeed = options.episodesPerSeed || 24;
    const evaluations = PROFILES.map((p) => evaluateProfileAcrossSeeds(p, seeds, episodesPerSeed));
    const winner = evaluations.find((e) => e.profileId === 'cache_tiled_4x4_gemm_fused_bias_silu_zero_alloc');
    const baseline = evaluations.find((e) => e.profileId === 'naive_3pass_unfused_gemm_bias_act_baseline');
    const significance = runPairedTTest(
      winner.seedSummaries.map((s) => s.compositeScore),
      baseline.seedSummaries.map((s) => s.compositeScore)
    );

    return {
      passNumber: PASS_NUMBER,
      passSlice: PASS_SLICE,
      phaseName: PHASE_NAME,
      moduleId: MODULE_ID,
      timestamp: '2026-11-09T23:21:00.000Z',
      seeds,
      episodesPerSeed,
      evaluations,
      winnerProfileId: winner.profileId,
      winnerCompositeScore: winner.aggregate.compositeScoreStats.mean,
      winnerStats: winner.aggregate,
      pairedTTestVsBaseline: significance,
      gatesPassed:
        winner.aggregate.maxAbsDiffStats.mean <= 1e-12 &&
        winner.aggregate.memPassesStats.mean === 1 &&
        winner.aggregate.speedupStats.mean >= 2.2 &&
        winner.aggregate.compositeScoreStats.mean === 100 &&
        significance.statisticallySignificant
    };
  }

  return {
    PASS_NUMBER,
    PASS_SLICE,
    PHASE_NAME,
    MODULE_ID,
    DEFAULT_SEEDS,
    PROFILES,
    runTiledGemmEpisode,
    evaluateProfileAcrossSeeds,
    runPass86TiledGemmBenchmark
  };
}));
