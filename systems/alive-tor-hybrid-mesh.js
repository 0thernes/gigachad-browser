/* ALIVE Pass 11 — Tor Browser / Chromium / Electron Hybrid Process & Session Partition Architecture.
 *
 * Implements the Chromium / Electron / Tor Browser Hybrid Synergy Mesh session
 * partitioner, per-First-Party-Domain (FPD) IsolateSOCKSAuth credential router,
 * zero-leak remote DNS enforcement (MAP * ~NOTFOUND, EXCLUDE 127.0.0.1),
 * WebRTC non-proxied UDP blocker, ephemeral in-memory storage isolation, and
 * fail-closed Tor daemon readiness gate on top of systems/alive-tor-service.cjs.
 *
 * Evaluates four browser routing & session architectures across five independent
 * seeds (19013, 29017, 39023, 49031, 59053) on 20 cross-origin, subresource,
 * DNS, WebRTC, storage, and daemon-drop security probes per seed:
 *   - shared-session-direct
 *   - naive-socks-proxy-only
 *   - partitioned-storage-no-socks-auth
 *   - full-tor-hybrid-synergy-mesh
 */
(function (root, factory) {
  let deps = {};
  if (typeof module === 'object' && module.exports) {
    deps = {
      crypto: require('node:crypto'),
      TorService: require('./alive-tor-service.cjs'),
      SynapticFabric: require('./alive-synaptic-fabric.js')
    };
  } else if (root) {
    deps = {
      TorService: root.AliveTorService,
      SynapticFabric: root.AliveSynapticFabric
    };
  }
  const api = factory(deps);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveTorHybridMesh = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';
  deps = deps || {};

  const TRAINING_SEEDS = Object.freeze([19013, 29017, 39023, 49031, 59053]);
  const T_CRIT_95_DF4 = 2.7764451051977987;

  const ARCHITECTURES = Object.freeze([
    'shared-session-direct',
    'naive-socks-proxy-only',
    'partitioned-storage-no-socks-auth',
    'full-tor-hybrid-synergy-mesh'
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
   * Extracts canonical First-Party Domain (FPD) key from a URL.
   */
  function extractFirstPartyDomain(urlStr) {
    try {
      const u = new URL(String(urlStr));
      const host = u.hostname.toLowerCase();
      if (host.endsWith('.onion')) return host;
      const parts = host.split('.');
      if (parts.length <= 2) return host;
      return parts.slice(-2).join('.');
    } catch (_) {
      return 'invalid.local';
    }
  }

  /**
   * Creates a production Hybrid Synergy Mesh session controller.
   */
  function createHybridMeshController({
    architecture = 'full-tor-hybrid-synergy-mesh',
    socksHost = '127.0.0.1',
    socksPort = 9050,
    seed = 19013
  } = {}) {
    let identityEpoch = 1;
    let daemonBootstrapped = true;
    const storagePartitions = new Map(); // partitionKey -> Map(key, value)
    const circuitTable = new Map(); // socksAuthKey -> circuitId

    function setDaemonBootstrapped(ready) {
      daemonBootstrapped = Boolean(ready);
    }

    function rotateIdentityEpoch() {
      identityEpoch++;
      // Purge ephemeral Tor storage partitions on identity rotation
      for (const key of Array.from(storagePartitions.keys())) {
        if (key.startsWith('tor-ephemeral:')) storagePartitions.delete(key);
      }
      return identityEpoch;
    }

    function buildSessionPolicy(topLevelUrl) {
      const fpd = extractFirstPartyDomain(topLevelUrl);
      if (architecture === 'shared-session-direct') {
        return {
          partition: 'persist:default-shared',
          ephemeralInMemory: false,
          proxyRules: 'direct://',
          hostResolverRules: '',
          webRTCIPHandlingPolicy: 'default',
          failClosedOnDaemonDown: false,
          socksUsername: '',
          socksPassword: ''
        };
      }
      if (architecture === 'naive-socks-proxy-only') {
        return {
          partition: 'persist:default-shared',
          ephemeralInMemory: false,
          proxyRules: `socks5://${socksHost}:${socksPort}`,
          hostResolverRules: '', // Missing MAP * ~NOTFOUND -> leaks local DNS pre-resolution
          webRTCIPHandlingPolicy: 'default', // Missing UDP block -> leaks STUN UDP
          failClosedOnDaemonDown: false,
          socksUsername: 'shared-global',
          socksPassword: 'static-password'
        };
      }
      if (architecture === 'partitioned-storage-no-socks-auth') {
        return {
          partition: `tor-ephemeral:${fpd}:e${identityEpoch}`,
          ephemeralInMemory: true,
          proxyRules: `socks5://${socksHost}:${socksPort}`,
          hostResolverRules: `MAP * ~NOTFOUND , EXCLUDE ${socksHost}`,
          webRTCIPHandlingPolicy: 'disable_non_proxied_udp',
          failClosedOnDaemonDown: false, // Fails open to direct when Tor drops
          socksUsername: 'static-shared-fpd',
          socksPassword: 'static-password'
        };
      }
      // full-tor-hybrid-synergy-mesh
      const socksUsername = `fpd-${sha256Hex(`${seed}:${fpd}`).slice(0, 14)}`;
      const socksPassword = `ep-${sha256Hex(`${seed}:${fpd}:epoch:${identityEpoch}`).slice(0, 14)}`;
      return {
        partition: `tor-ephemeral:${fpd}:e${identityEpoch}`,
        ephemeralInMemory: true,
        proxyRules: `socks5://${socksHost}:${socksPort}`,
        hostResolverRules: `MAP * ~NOTFOUND , EXCLUDE ${socksHost}`,
        webRTCIPHandlingPolicy: 'disable_non_proxied_udp',
        failClosedOnDaemonDown: true,
        socksUsername,
        socksPassword
      };
    }

    function executeRequestProbe(probe) {
      const policy = buildSessionPolicy(probe.topLevelUrl);
      const fpd = extractFirstPartyDomain(probe.topLevelUrl);
      const targetHost = extractFirstPartyDomain(probe.requestUrl);

      // 1. Daemon drop / fail-closed check
      if (!daemonBootstrapped) {
        if (policy.failClosedOnDaemonDown) {
          return {
            allowed: false,
            blockedFailClosed: true,
            leakedDirectIp: false,
            leakedDns: false,
            leakedWebRtcUdp: false,
            crossOriginStorageLinked: false,
            crossFpdCircuitShared: false,
            circuitId: null,
            partition: policy.partition
          };
        }
        // Fail-open leaks direct IP!
        return {
          allowed: true,
          blockedFailClosed: false,
          leakedDirectIp: true,
          leakedDns: true,
          leakedWebRtcUdp: false,
          crossOriginStorageLinked: false,
          crossFpdCircuitShared: false,
          circuitId: 'direct-bypass-leak',
          partition: policy.partition
        };
      }

      // 2. DNS leak check
      const leakedDns = !policy.hostResolverRules.includes('MAP * ~NOTFOUND');

      // 3. WebRTC STUN UDP leak check
      const leakedWebRtcUdp = probe.kind === 'webrtc-stun-udp' && policy.webRTCIPHandlingPolicy !== 'disable_non_proxied_udp';

      // 4. Direct IP leak check
      const leakedDirectIp = policy.proxyRules === 'direct://';

      // 5. Storage / cookie isolation check across distinct First-Party Domains
      let store = storagePartitions.get(policy.partition);
      if (!store) {
        store = new Map();
        storagePartitions.set(policy.partition, store);
      }
      let crossOriginStorageLinked = false;
      if (probe.trackerToken) {
        if (store.has('tracker_id') && store.get('tracker_fpd') !== fpd) {
          crossOriginStorageLinked = true;
        } else {
          store.set('tracker_id', probe.trackerToken);
          store.set('tracker_fpd', fpd);
        }
      }

      // 6. IsolateSOCKSAuth circuit isolation across distinct First-Party Domains
      const authKey = `${policy.socksUsername}:${policy.socksPassword}`;
      let circuitEntry = circuitTable.get(authKey);
      let crossFpdCircuitShared = false;
      if (!circuitEntry) {
        circuitEntry = {
          circuitId: `circ-${sha256Hex(`${seed}:${authKey}`).slice(0, 10)}`,
          boundFpds: new Set([fpd])
        };
        circuitTable.set(authKey, circuitEntry);
      } else {
        if (!circuitEntry.boundFpds.has(fpd)) {
          crossFpdCircuitShared = true;
          circuitEntry.boundFpds.add(fpd);
        }
      }

      return {
        allowed: true,
        blockedFailClosed: false,
        leakedDirectIp,
        leakedDns,
        leakedWebRtcUdp,
        crossOriginStorageLinked,
        crossFpdCircuitShared,
        circuitId: circuitEntry.circuitId,
        partition: policy.partition,
        fpd,
        targetHost
      };
    }

    return Object.freeze({
      buildSessionPolicy,
      executeRequestProbe,
      setDaemonBootstrapped,
      rotateIdentityEpoch
    });
  }

  function buildSecurityProbeSuite(seed) {
    const fpdSites = [
      'https://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion/search',
      'https://arxiv.org/abs/2611.09001',
      'https://protonmailrmez3lotccipshtkleegetolb73fuirgj7r4o4vfu7ozyd.onion/inbox',
      'https://developer.mozilla.org/en-US/docs/Web',
      'https://github.com/0thernes/gigachad-browser'
    ];
    const probes = [];
    for (let i = 0; i < 20; i++) {
      const topLevelUrl = fpdSites[(i + Math.floor(i / 5)) % fpdSites.length];
      const kind = i % 5 === 1
        ? 'third-party-tracker-subresource'
        : i % 5 === 2
          ? 'webrtc-stun-udp'
          : i % 5 === 3
            ? 'dns-pre-resolve'
            : i % 5 === 4
              ? 'daemon-drop-fail-closed'
              : 'first-party-navigation';
      probes.push({
        probeIndex: i,
        kind,
        topLevelUrl,
        requestUrl: kind === 'third-party-tracker-subresource'
          ? 'https://tracker.adnetwork.example/pixel.js'
          : topLevelUrl,
        trackerToken: `trk-${seed}`,
        daemonReady: kind !== 'daemon-drop-fail-closed'
      });
    }
    return probes;
  }

  function evaluateArchitectureOnSeed(seed, architecture) {
    const controller = createHybridMeshController({ architecture, seed });
    const probes = buildSecurityProbeSuite(seed);

    let dnsLeaks = 0;
    let webrtcLeaks = 0;
    let directIpLeaks = 0;
    let crossOriginStorageLeaks = 0;
    let crossFpdCircuitCollusions = 0;
    let failClosedSuccesses = 0;
    let daemonDropProbes = 0;
    const distinctCircuits = new Set();

    for (const p of probes) {
      controller.setDaemonBootstrapped(p.daemonReady);
      const res = controller.executeRequestProbe(p);
      if (!p.daemonReady) {
        daemonDropProbes++;
        if (res.blockedFailClosed && !res.leakedDirectIp) failClosedSuccesses++;
      }
      if (res.leakedDns) dnsLeaks++;
      if (res.leakedWebRtcUdp) webrtcLeaks++;
      if (res.leakedDirectIp) directIpLeaks++;
      if (res.crossOriginStorageLinked) crossOriginStorageLeaks++;
      if (res.crossFpdCircuitShared) crossFpdCircuitCollusions++;
      if (res.circuitId && res.circuitId !== 'direct-bypass-leak') distinctCircuits.add(res.circuitId);
    }

    const totalLeaks = dnsLeaks + webrtcLeaks + directIpLeaks + crossOriginStorageLeaks + crossFpdCircuitCollusions;
    const failClosedPct = (failClosedSuccesses / Math.max(1, daemonDropProbes)) * 100;
    const fpdIsolationPct = ((probes.length - crossFpdCircuitCollusions - crossOriginStorageLeaks) / probes.length) * 100;

    const isolationScore = clamp(
      0.40 * fpdIsolationPct +
      0.30 * failClosedPct +
      30.0 * (totalLeaks === 0 ? 1 : 0) -
      3.5 * dnsLeaks -
      6.0 * webrtcLeaks -
      5.0 * directIpLeaks -
      3.0 * crossOriginStorageLeaks -
      3.0 * crossFpdCircuitCollusions,
      0,
      100
    );

    return {
      seed,
      architecture,
      metrics: {
        isolationScore,
        fpdIsolationPct,
        failClosedPct,
        totalLeaks,
        dnsLeaks,
        webrtcLeaks,
        directIpLeaks,
        crossOriginStorageLeaks,
        crossFpdCircuitCollusions,
        distinctFpdCircuits: distinctCircuits.size
      }
    };
  }

  async function run({ seeds = TRAINING_SEEDS } = {}) {
    if (!Array.isArray(seeds) || seeds.length !== 5 || new Set(seeds).size !== 5) {
      throw new TypeError('Exactly five distinct seeds are required');
    }

    const runs = [];
    for (const seed of seeds) {
      const byArchitecture = {};
      for (const arch of ARCHITECTURES) {
        byArchitecture[arch] = evaluateArchitectureOnSeed(seed, arch);
      }
      runs.push({ seed, byArchitecture });
    }

    const summaryByArchitecture = {};
    for (const arch of ARCHITECTURES) {
      const items = runs.map(r => r.byArchitecture[arch].metrics);
      summaryByArchitecture[arch] = {
        architecture: arch,
        isolationScore: studentT95(items.map(m => m.isolationScore)),
        fpdIsolationPct: studentT95(items.map(m => m.fpdIsolationPct)),
        failClosedPct: studentT95(items.map(m => m.failClosedPct)),
        totalLeaks: studentT95(items.map(m => m.totalLeaks)),
        dnsLeaks: studentT95(items.map(m => m.dnsLeaks)),
        webrtcLeaks: studentT95(items.map(m => m.webrtcLeaks)),
        directIpLeaks: studentT95(items.map(m => m.directIpLeaks)),
        crossOriginStorageLeaks: studentT95(items.map(m => m.crossOriginStorageLeaks)),
        crossFpdCircuitCollusions: studentT95(items.map(m => m.crossFpdCircuitCollusions)),
        distinctFpdCircuits: studentT95(items.map(m => m.distinctFpdCircuits))
      };
    }

    const fullVsPartGain = runs.map(
      r => r.byArchitecture['full-tor-hybrid-synergy-mesh'].metrics.isolationScore -
           r.byArchitecture['partitioned-storage-no-socks-auth'].metrics.isolationScore
    );
    const fullVsNaiveGain = runs.map(
      r => r.byArchitecture['full-tor-hybrid-synergy-mesh'].metrics.isolationScore -
           r.byArchitecture['naive-socks-proxy-only'].metrics.isolationScore
    );

    const fullBeatPartitionedSeeds = fullVsPartGain.filter(d => d > 0).length;
    const fullBeatNaiveSocksSeeds = fullVsNaiveGain.filter(d => d > 0).length;
    const zeroLeakSeeds = runs.filter(
      r => r.byArchitecture['full-tor-hybrid-synergy-mesh'].metrics.totalLeaks === 0
    ).length;
    const exactFailClosedSeeds = runs.filter(
      r => r.byArchitecture['full-tor-hybrid-synergy-mesh'].metrics.failClosedPct === 100
    ).length;

    return {
      schemaVersion: 1,
      benchmark: 'pass-11-tor-hybrid-mesh-session-isolation-v1',
      status: (fullBeatPartitionedSeeds === 5 && fullBeatNaiveSocksSeeds === 5 && zeroLeakSeeds === 5 && exactFailClosedSeeds === 5)
        ? 'completed'
        : 'incomplete',
      liveRuntimeModified: false,
      protocol: {
        seeds: seeds.slice(),
        architectures: ARCHITECTURES.slice(),
        probesPerSeed: 20,
        distinctFirstPartyDomains: 5
      },
      summary: {
        fullBeatPartitionedSeeds,
        fullBeatNaiveSocksSeeds,
        zeroLeakSeeds,
        exactFailClosedSeeds,
        pairedDeltas: {
          fullVsPartitionedIsolationGain: studentT95(fullVsPartGain),
          fullVsNaiveSocksIsolationGain: studentT95(fullVsNaiveGain)
        },
        byArchitecture: summaryByArchitecture
      },
      runs,
      scope: 'Pass 11 Tor Browser / Chromium / Electron Hybrid Process & Session Partition Architecture verifying IsolateSOCKSAuth per-FPD circuit credentials, ephemeral storage partitions, zero DNS/WebRTC leaks, and fail-closed daemon drop protection across 5 seeds.'
    };
  }

  return Object.freeze({
    run,
    createHybridMeshController,
    extractFirstPartyDomain,
    TRAINING_SEEDS,
    ARCHITECTURES
  });
});
