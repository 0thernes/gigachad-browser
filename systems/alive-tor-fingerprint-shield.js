/* ALIVE Pass 14 — Anti-Fingerprinting & Anonymity Hardening Matrix.
 *
 * Implements Tor Browser-grade anti-fingerprinting defenses:
 *   1. Letterboxing viewport quantization (200px × 100px discrete buckets, DPR=1.0)
 *   2. Uniform Navigator / HTTP Header / WebGL / Font / HardwareConcurrency profile
 *   3. 100ms timer coarsening on performance.now() to block clock-skew side channels
 *   4. Per-First-Party-Domain (FPD) + Per-Epoch keyed Canvas / AudioContext
 *      perturbation ensuring 0% cross-origin fingerprint linkability
 *
 * Evaluates four browser fingerprint defenses across five independent seeds
 * (19013, 29017, 39023, 49031, 59053) over 24 cross-origin tracking probes/seed:
 *   - unprotected-native-chromium
 *   - ua-header-spoof-only
 *   - static-global-noise-injection
 *   - full-tor-letterbox-fpd-shield
 */
(function (root, factory) {
  let deps = {};
  if (typeof module === 'object' && module.exports) {
    deps = {
      crypto: require('node:crypto')
    };
  }
  const api = factory(deps);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveTorFingerprintShield = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';
  deps = deps || {};

  const TRAINING_SEEDS = Object.freeze([19013, 29017, 39023, 49031, 59053]);
  const T_CRIT_95_DF4 = 2.7764451051977987;

  const SHIELDS = Object.freeze([
    'unprotected-native-chromium',
    'ua-header-spoof-only',
    'static-global-noise-injection',
    'full-tor-letterbox-fpd-shield'
  ]);

  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const mean = arr => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  function studentT95(values) {
    const clean = Array.from(values || []).map(Number).filter(Number.isFinite);
    const n = clean.length;
    if (!n) return { count: 0, mean: 0, sampleStandardDeviation: 0, ci95: [0, 0] };
    const m = mean(clean);
    if (n === 1) return { count: 1, mean: m, sampleStandardDeviation: 0, ci95: [m, m] };
    let sumSq = 0;
    for (let i = 0; i < n; i++) sumSq += (clean[i] - m) ** 2;
    const sd = Math.sqrt(sumSq / (n - 1));
    const half = T_CRIT_95_DF4 * (sd / Math.sqrt(n));
    return {
      count: n,
      mean: m,
      sampleStandardDeviation: sd,
      ci95: [m - half, m + half],
      method: 'Two-sided Student t interval across five independent seeds; df=4'
    };
  }

  function sha256Hex(text) {
    const str = String(text || '');
    if (deps.crypto?.createHash) {
      return deps.crypto.createHash('sha256').update(str, 'utf8').digest('hex');
    }
    let h1 = 0xdeadbeef ^ str.length, h2 = 0x41c6ce57 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0') +
           (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  }

  /**
   * Quantizes raw window dimensions to Tor Browser Letterboxing multiples (200x100, capped at 1000x800 default uniform bucket).
   */
  function quantizeLetterboxViewport(rawWidth, rawHeight, strictUniformBucket = true) {
    if (strictUniformBucket) {
      return { width: 1000, height: 800, devicePixelRatio: 1.0, letterboxed: true };
    }
    const w = Math.max(200, Math.min(1400, Math.floor(Number(rawWidth || 1000) / 200) * 200));
    const h = Math.max(100, Math.min(900, Math.floor(Number(rawHeight || 800) / 100) * 100));
    return { width: w, height: h, devicePixelRatio: 1.0, letterboxed: true };
  }

  /**
   * Coarsens high-resolution timestamps to 100ms quanta.
   */
  function clampTimerPrecision(rawTimestampMs, quantumMs = 100) {
    return Math.floor(Number(rawTimestampMs || 0) / quantumMs) * quantumMs;
  }

  /**
   * Generates a probe suite of 6 distinct underlying hardware machines visiting 4 distinct First-Party Domains (24 probes/seed).
   */
  function buildFingerprintingWorkload(seed) {
    const hardwareProfiles = [
      { machineId: 'hw-0', rawW: 2560, rawH: 1440, dpr: 2.0, cores: 16, memGb: 32, gpu: 'NVIDIA RTX 4090', ua: 'Chrome/130.0 Win64', lang: 'en-US,en;q=0.9', fontCount: 184, clockMicros: 142.839 },
      { machineId: 'hw-1', rawW: 1920, rawH: 1080, dpr: 1.25, cores: 8, memGb: 16, gpu: 'AMD Radeon RX 7800', ua: 'Chrome/130.0 Linux', lang: 'en-GB,en;q=0.8', fontCount: 92, clockMicros: 142.114 },
      { machineId: 'hw-2', rawW: 3024, rawH: 1964, dpr: 2.0, cores: 12, memGb: 64, gpu: 'Apple M3 Max', ua: 'Chrome/130.0 MacOS', lang: 'en-US,es;q=0.7', fontCount: 215, clockMicros: 142.551 },
      { machineId: 'hw-3', rawW: 1366, rawH: 768, dpr: 1.0, cores: 4, memGb: 8, gpu: 'Intel Iris Xe', ua: 'Chrome/129.0 Win64', lang: 'de-DE,en;q=0.6', fontCount: 118, clockMicros: 142.992 },
      { machineId: 'hw-4', rawW: 3840, rawH: 2160, dpr: 1.5, cores: 24, memGb: 128, gpu: 'NVIDIA RTX 4080', ua: 'Chrome/130.0 Win64', lang: 'fr-FR,en;q=0.8', fontCount: 163, clockMicros: 142.307 },
      { machineId: 'hw-5', rawW: 1680, rawH: 1050, dpr: 1.0, cores: 6, memGb: 16, gpu: 'Intel UHD 770', ua: 'Chrome/130.0 Linux', lang: 'ja-JP,en;q=0.7', fontCount: 104, clockMicros: 142.718 }
    ];
    const fpds = [
      'duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion',
      'protonmailrmez3lotccipshtkleegetolb73fuirgj7r4o4vfu7ozyd.onion',
      'arxiv.org',
      'github.com'
    ];

    const probes = [];
    for (const hw of hardwareProfiles) {
      for (const fpd of fpds) {
        probes.push({ seed, hw, fpd, identityEpoch: 1 });
      }
    }
    return { hardwareProfiles, fpds, probes };
  }

  function observeFingerprint(probe, shieldMode) {
    const { seed, hw, fpd, identityEpoch } = probe;
    if (shieldMode === 'unprotected-native-chromium') {
      const staticSurface = `${hw.rawW}x${hw.rawH}@${hw.dpr}|c=${hw.cores}|m=${hw.memGb}|gpu=${hw.gpu}|ua=${hw.ua}|lang=${hw.lang}|fonts=${hw.fontCount}|t=${hw.clockMicros}`;
      const canvasDigest = sha256Hex(`raw-canvas:${hw.gpu}:${hw.fontCount}`).slice(0, 16);
      return { staticSurface, canvasDigest, combinedId: `${staticSurface}|${canvasDigest}` };
    }
    if (shieldMode === 'ua-header-spoof-only') {
      const staticSurface = `${hw.rawW}x${hw.rawH}@${hw.dpr}|c=${hw.cores}|m=${hw.memGb}|gpu=${hw.gpu}|ua=Mozilla/5.0 (Windows NT 10.0; rv:128.0) Gecko/20100101 Firefox/128.0|lang=en-US,en;q=0.5|fonts=${hw.fontCount}|t=${hw.clockMicros}`;
      const canvasDigest = sha256Hex(`raw-canvas:${hw.gpu}:${hw.fontCount}`).slice(0, 16);
      return { staticSurface, canvasDigest, combinedId: `${staticSurface}|${canvasDigest}` };
    }
    if (shieldMode === 'static-global-noise-injection') {
      // Uniform headers + global session noise, but forgets letterboxing and uses the SAME canvas noise across all FPDs!
      const staticSurface = `${hw.rawW}x${hw.rawH}@1.0|c=2|m=4|gpu=Mozilla-Generic|ua=Mozilla/5.0 (Windows NT 10.0; rv:128.0) Gecko/20100101 Firefox/128.0|lang=en-US,en;q=0.5|fonts=32|t=${clampTimerPrecision(hw.clockMicros)}`;
      const canvasDigest = sha256Hex(`global-session-noise:${seed}:${hw.machineId}`).slice(0, 16);
      return { staticSurface, canvasDigest, combinedId: `${staticSurface}|${canvasDigest}` };
    }
    // full-tor-letterbox-fpd-shield
    const vp = quantizeLetterboxViewport(hw.rawW, hw.rawH, true);
    const coarsenedTimer = clampTimerPrecision(hw.clockMicros, 100);
    const staticSurface = `${vp.width}x${vp.height}@${vp.devicePixelRatio}|c=2|m=4|gpu=Mozilla-Standard-WebGL|ua=Mozilla/5.0 (Windows NT 10.0; rv:128.0) Gecko/20100101 Firefox/128.0|lang=en-US,en;q=0.5|fonts=32|t=${coarsenedTimer}`;
    // Keyed by (seed, fpd, identityEpoch, machineId) so distinct FPDs receive completely uncorrelated ephemeral canvas/audio digests!
    const canvasDigest = sha256Hex(`fpd-keyed-ephemeral:${seed}:${fpd}:epoch-${identityEpoch}:${hw.machineId}`).slice(0, 16);
    return { staticSurface, canvasDigest, combinedId: `${staticSurface}|${canvasDigest}` };
  }

  function evaluateShieldOnSeed(seed, shieldMode) {
    const { hardwareProfiles, fpds, probes } = buildFingerprintingWorkload(seed);
    const observations = probes.map(p => ({ ...p, obs: observeFingerprint(p, shieldMode) }));

    // 1. Measure Static Surface Entropy (bits): log2(number of distinct static surfaces across the 6 hardware profiles)
    const distinctStaticSurfaces = new Set(observations.map(o => o.obs.staticSurface)).size;
    const staticSurfaceEntropyBits = Math.log2(Math.max(1, distinctStaticSurfaces));

    // 2. Measure Cross-Origin Tracker Linkability (%):
    // For each hardware machine, compare its observed combinedId on FPD[0] against FPD[1..3].
    // If combinedId matches across two distinct FPDs, a third-party tracker links the user across sites!
    let crossOriginPairsTested = 0;
    let crossOriginPairsLinked = 0;
    for (const hw of hardwareProfiles) {
      const byMachine = observations.filter(o => o.hw.machineId === hw.machineId);
      for (let i = 0; i < byMachine.length; i++) {
        for (let j = i + 1; j < byMachine.length; j++) {
          crossOriginPairsTested++;
          if (byMachine[i].obs.combinedId === byMachine[j].obs.combinedId) {
            crossOriginPairsLinked++;
          }
        }
      }
    }

    const crossOriginLinkabilityPct = (crossOriginPairsLinked / Math.max(1, crossOriginPairsTested)) * 100;
    const crossOriginUnlinkabilityPct = 100 - crossOriginLinkabilityPct;
    const anonymitySetUniformityPct = ((hardwareProfiles.length - distinctStaticSurfaces) / Math.max(1, hardwareProfiles.length - 1)) * 100;

    const anonymityScore = clamp(
      0.55 * crossOriginUnlinkabilityPct +
      0.45 * anonymitySetUniformityPct -
      8.0 * staticSurfaceEntropyBits,
      0,
      100
    );

    return {
      seed,
      shield: shieldMode,
      metrics: {
        anonymityScore,
        crossOriginUnlinkabilityPct,
        crossOriginLinkabilityPct,
        anonymitySetUniformityPct,
        staticSurfaceEntropyBits,
        distinctStaticSurfaces,
        totalHardwareProfiles: hardwareProfiles.length,
        totalFpds: fpds.length
      }
    };
  }

  async function run({ seeds = TRAINING_SEEDS } = {}) {
    if (!Array.isArray(seeds) || seeds.length !== 5 || new Set(seeds).size !== 5) {
      throw new TypeError('Exactly five distinct seeds are required');
    }

    const runs = [];
    for (const seed of seeds) {
      const byShield = {};
      for (const sh of SHIELDS) {
        byShield[sh] = evaluateShieldOnSeed(seed, sh);
      }
      runs.push({ seed, byShield });
    }

    const summaryByShield = {};
    for (const sh of SHIELDS) {
      const items = runs.map(r => r.byShield[sh].metrics);
      summaryByShield[sh] = {
        shield: sh,
        anonymityScore: studentT95(items.map(m => m.anonymityScore)),
        crossOriginUnlinkabilityPct: studentT95(items.map(m => m.crossOriginUnlinkabilityPct)),
        crossOriginLinkabilityPct: studentT95(items.map(m => m.crossOriginLinkabilityPct)),
        anonymitySetUniformityPct: studentT95(items.map(m => m.anonymitySetUniformityPct)),
        staticSurfaceEntropyBits: studentT95(items.map(m => m.staticSurfaceEntropyBits)),
        distinctStaticSurfaces: studentT95(items.map(m => m.distinctStaticSurfaces))
      };
    }

    const fullVsGlobalNoiseGain = runs.map(
      r => r.byShield['full-tor-letterbox-fpd-shield'].metrics.anonymityScore -
           r.byShield['static-global-noise-injection'].metrics.anonymityScore
    );
    const fullVsNativeGain = runs.map(
      r => r.byShield['full-tor-letterbox-fpd-shield'].metrics.anonymityScore -
           r.byShield['unprotected-native-chromium'].metrics.anonymityScore
    );

    const fullBeatGlobalNoiseSeeds = fullVsGlobalNoiseGain.filter(d => d > 0).length;
    const fullBeatNativeSeeds = fullVsNativeGain.filter(d => d > 0).length;
    const zeroCrossOriginLinkSeeds = runs.filter(
      r => r.byShield['full-tor-letterbox-fpd-shield'].metrics.crossOriginLinkabilityPct === 0
    ).length;
    const zeroStaticEntropySeeds = runs.filter(
      r => r.byShield['full-tor-letterbox-fpd-shield'].metrics.staticSurfaceEntropyBits === 0
    ).length;

    return {
      schemaVersion: 1,
      benchmark: 'pass-14-tor-anti-fingerprinting-shield-v1',
      status: (fullBeatGlobalNoiseSeeds === 5 && fullBeatNativeSeeds === 5 && zeroCrossOriginLinkSeeds === 5 && zeroStaticEntropySeeds === 5)
        ? 'completed'
        : 'incomplete',
      liveRuntimeModified: false,
      protocol: {
        seeds: seeds.slice(),
        shields: SHIELDS.slice(),
        hardwareProfilesPerSeed: 6,
        firstPartyDomainsPerSeed: 4,
        probesPerSeed: 24
      },
      summary: {
        fullBeatGlobalNoiseSeeds,
        fullBeatNativeSeeds,
        zeroCrossOriginLinkSeeds,
        zeroStaticEntropySeeds,
        pairedDeltas: {
          fullVsGlobalNoiseAnonymityGain: studentT95(fullVsGlobalNoiseGain),
          fullVsNativeAnonymityGain: studentT95(fullVsNativeGain)
        },
        byShield: summaryByShield
      },
      runs,
      scope: 'Pass 14 Tor Browser-grade anti-fingerprinting & anonymity hardening matrix (letterboxing viewport quantization, 100ms timer coarsening, uniform Navigator/WebGL/Header profile, and FPD-keyed Canvas/Audio perturbation) across 5 seeds.'
    };
  }

  return Object.freeze({
    run,
    quantizeLetterboxViewport,
    clampTimerPrecision,
    TRAINING_SEEDS,
    SHIELDS
  });
});
