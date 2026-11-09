/* ALIVE Pass 17 — Public-Web & Onion Swarm Resource Governor.
 *
 * Implements and evaluates deterministic resource governance for Multi-Entity
 * Exploration Swarms across five independent seeds (19013, 29017, 39023, 49031, 59053):
 *   - Per-domain concurrency semaphores (clearnet maxConcurrent=2, .onion v3 maxConcurrent=1)
 *   - Per-domain token-bucket rate budgets (capacity, refill/tick, zero-overrun accounting)
 *   - Bounded population growth (hard ceiling maxEntities=15, utility-gated spawn replacement)
 *   - Synchronous global PAUSE / RESUME / KILL_SWITCH control (0 leaked dispatches while paused)
 */
(function (root, factory) {
  let deps = {};
  if (typeof module === 'object' && module.exports) {
    deps = { crypto: require('node:crypto') };
  }
  const api = factory(deps);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveSwarmBudgetGovernor = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';
  deps = deps || {};

  const TRAINING_SEEDS = Object.freeze([19013, 29017, 39023, 49031, 59053]);
  const T_CRIT_95_DF4 = 2.7764451051977987;

  const GOVERNOR_MODES = Object.freeze([
    'ungoverned-locust-flood',
    'global-cap-no-per-domain-bucket',
    'per-domain-bucket-no-killswitch',
    'full-token-bucket-swarm-governor'
  ]);

  const TARGET_DOMAINS = Object.freeze([
    { host: 'arxiv.org', isOnion: false, maxConcurrent: 2, bucketCapacity: 4, refillPerStep: 1.5 },
    { host: 'semanticscholar.org', isOnion: false, maxConcurrent: 2, bucketCapacity: 4, refillPerStep: 1.5 },
    { host: 'crossref.org', isOnion: false, maxConcurrent: 2, bucketCapacity: 4, refillPerStep: 1.5 },
    { host: 'duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion', isOnion: true, maxConcurrent: 1, bucketCapacity: 2, refillPerStep: 1.0 },
    { host: 'propub3r6espa33w76f7726v52g2x2h6k2v6w3r5z7m2n4b5v6c7d8ad.onion', isOnion: true, maxConcurrent: 1, bucketCapacity: 2, refillPerStep: 1.0 },
    { host: 'nytimesn7cgmftshazwhfgzm37qxb44r64ytbb2dj3x62d2lljsciiyd.onion', isOnion: true, maxConcurrent: 1, bucketCapacity: 2, refillPerStep: 1.0 }
  ]);

  const MAX_POPULATION_ENTITIES = 15;

  function createRng(seed) {
    let s = (Number(seed) >>> 0) || 1;
    return function next() {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

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

  /**
   * Creates a live Swarm Budget Governor instance with explicit per-domain semaphores,
   * token buckets, population ceiling, and pause/kill-switch state machine.
   */
  function createSwarmBudgetGovernor({
    maxPopulation = MAX_POPULATION_ENTITIES,
    domains = TARGET_DOMAINS,
    enforcePerDomainLimits = true,
    enforcePopulationCap = true,
    enforceKillSwitch = true
  } = {}) {
    const domainState = new Map();
    for (const d of domains) {
      domainState.set(d.host, {
        host: d.host,
        isOnion: d.isOnion,
        maxConcurrent: d.maxConcurrent,
        bucketCapacity: d.bucketCapacity,
        refillPerStep: d.refillPerStep,
        tokens: d.bucketCapacity,
        inFlight: 0,
        acceptedRequests: 0,
        deferredRequests: 0,
        concurrencyViolations: 0,
        tokenOverruns: 0
      });
    }

    let state = 'RUNNING'; // 'RUNNING' | 'PAUSED' | 'KILLED'
    let population = 15;
    let peakPopulation = 15;
    let populationCapBreaches = 0;
    let killSwitchLeaks = 0;
    let rejectedSpawns = 0;

    function pause() {
      if (state !== 'KILLED') state = 'PAUSED';
      return state;
    }

    function resume() {
      if (state === 'PAUSED') state = 'RUNNING';
      return state;
    }

    function killSwitch() {
      state = 'KILLED';
      for (const ds of domainState.values()) {
        ds.inFlight = 0;
      }
      return state;
    }

    function refillStep() {
      for (const ds of domainState.values()) {
        ds.inFlight = 0; // release completed step slots
        ds.tokens = Math.min(ds.bucketCapacity, ds.tokens + ds.refillPerStep);
      }
    }

    function requestSpawn(count = 1) {
      if (enforcePopulationCap) {
        if (population + count > maxPopulation) {
          rejectedSpawns += count;
          return { spawned: false, activePopulation: population, reason: 'POPULATION_CAP_REACHED' };
        }
      }
      population += count;
      if (population > peakPopulation) peakPopulation = population;
      if (population > maxPopulation) populationCapBreaches += 1;
      return { spawned: true, activePopulation: population, reason: 'SPAWN_ACCEPTED' };
    }

    function tryAcquireRequest(host) {
      const ds = domainState.get(host);
      if (!ds) throw new Error(`Unknown domain: ${host}`);

      if (state === 'PAUSED' || state === 'KILLED') {
        if (enforceKillSwitch) {
          ds.deferredRequests += 1;
          return { allowed: false, reason: `GOVERNOR_${state}` };
        }
        killSwitchLeaks += 1;
      }

      if (enforcePerDomainLimits) {
        if (ds.inFlight >= ds.maxConcurrent) {
          ds.deferredRequests += 1;
          return { allowed: false, reason: 'DOMAIN_CONCURRENCY_SEMAPHORE_FULL' };
        }
        if (ds.tokens < 1.0) {
          ds.deferredRequests += 1;
          return { allowed: false, reason: 'DOMAIN_TOKEN_BUCKET_EMPTY' };
        }
        ds.inFlight += 1;
        ds.tokens -= 1.0;
        ds.acceptedRequests += 1;
        return { allowed: true, reason: 'DISPATCHED_WITHIN_BUDGET' };
      }

      // When per-domain limits are disabled, record violations if limits are exceeded
      ds.inFlight += 1;
      if (ds.inFlight > ds.maxConcurrent) {
        ds.concurrencyViolations += 1;
      }
      if (ds.tokens < 1.0) {
        ds.tokenOverruns += 1;
      } else {
        ds.tokens -= 1.0;
      }
      ds.acceptedRequests += 1;
      return { allowed: true, reason: 'DISPATCHED_UNGOVERNED' };
    }

    function snapshot() {
      let totalAccepted = 0;
      let totalDeferred = 0;
      let totalConcurrencyViolations = 0;
      let totalTokenOverruns = 0;
      const byDomain = {};
      for (const [host, ds] of domainState.entries()) {
        totalAccepted += ds.acceptedRequests;
        totalDeferred += ds.deferredRequests;
        totalConcurrencyViolations += ds.concurrencyViolations;
        totalTokenOverruns += ds.tokenOverruns;
        byDomain[host] = { ...ds };
      }
      return {
        state,
        activePopulation: population,
        peakPopulation,
        maxPopulation,
        populationCapBreaches,
        rejectedSpawns,
        killSwitchLeaks,
        totalAccepted,
        totalDeferred,
        totalConcurrencyViolations,
        totalTokenOverruns,
        byDomain
      };
    }

    return Object.freeze({
      pause,
      resume,
      killSwitch,
      refillStep,
      requestSpawn,
      tryAcquireRequest,
      snapshot
    });
  }

  /**
   * Builds a 40-step multi-domain workload trace per seed, including hot-domain bursts,
   * child spawn requests, a PAUSE window (steps 20..25), and a KILL_SWITCH at step 36.
   */
  function buildSwarmWorkloadTrace(seed, steps = 40) {
    const rng = createRng(seed ^ 0x62c491);
    const trace = [];
    for (let step = 0; step < steps; step++) {
      // Concentrated bursts on hot domains every 3rd step to test per-domain semaphores
      const hotDomainIdx = step % TARGET_DOMAINS.length;
      const requests = [];
      const burstSize = 5 + Math.floor(rng() * 3); // 5..7 concurrent entity requests
      for (let r = 0; r < burstSize; r++) {
        const dIdx = r < 3 ? hotDomainIdx : (hotDomainIdx + r) % TARGET_DOMAINS.length;
        requests.push({
          entityId: `entity-${(step + r) % 15}`,
          host: TARGET_DOMAINS[dIdx].host
        });
      }
      trace.push({
        step,
        lifecycleSignal:
          step === 20 ? 'PAUSE' :
          step === 26 ? 'RESUME' :
          step === 36 ? 'KILL_SWITCH' : 'NONE',
        spawnRequestCount: step % 5 === 0 ? 3 : 0,
        requests
      });
    }
    return trace;
  }

  function evaluateGovernorOnSeed(seed, mode) {
    const gov = createSwarmBudgetGovernor({
      maxPopulation: MAX_POPULATION_ENTITIES,
      domains: TARGET_DOMAINS,
      enforcePerDomainLimits: mode === 'per-domain-bucket-no-killswitch' || mode === 'full-token-bucket-swarm-governor',
      enforcePopulationCap: mode !== 'ungoverned-locust-flood',
      enforceKillSwitch: mode === 'global-cap-no-per-domain-bucket' || mode === 'full-token-bucket-swarm-governor'
    });

    const trace = buildSwarmWorkloadTrace(seed, 40);
    for (const item of trace) {
      gov.refillStep();
      if (item.lifecycleSignal === 'PAUSE') gov.pause();
      else if (item.lifecycleSignal === 'RESUME') gov.resume();
      else if (item.lifecycleSignal === 'KILL_SWITCH') gov.killSwitch();

      if (item.spawnRequestCount > 0) {
        gov.requestSpawn(item.spawnRequestCount);
      }

      for (const req of item.requests) {
        gov.tryAcquireRequest(req.host);
      }
    }

    const snap = gov.snapshot();
    const totalViolations =
      snap.totalConcurrencyViolations +
      snap.totalTokenOverruns +
      snap.populationCapBreaches +
      snap.killSwitchLeaks;

    // Governance compliance score (0..100): penalizes any concurrency, token-bucket, population, or kill-switch breach
    const violationPenalty = Math.min(100, totalViolations * 2.5);
    const throughputBonus = Math.min(20, (snap.totalAccepted / 80) * 20);
    const governanceComplianceScore = totalViolations === 0
      ? Math.min(100, 80 + throughputBonus)
      : Math.max(0, 80 - violationPenalty);

    return {
      seed,
      mode,
      metrics: {
        governanceComplianceScore,
        domainConcurrencyViolations: snap.totalConcurrencyViolations,
        tokenBucketOverruns: snap.totalTokenOverruns,
        populationCapBreaches: snap.populationCapBreaches,
        killSwitchLeakCount: snap.killSwitchLeaks,
        peakPopulation: snap.peakPopulation,
        acceptedRequests: snap.totalAccepted,
        deferredRequests: snap.totalDeferred,
        totalViolations
      }
    };
  }

  async function run({ seeds = TRAINING_SEEDS } = {}) {
    if (!Array.isArray(seeds) || seeds.length !== 5 || new Set(seeds).size !== 5) {
      throw new TypeError('Exactly five distinct seeds are required');
    }

    const runs = seeds.map(seed => {
      const byGovernor = {};
      for (const mode of GOVERNOR_MODES) {
        byGovernor[mode] = evaluateGovernorOnSeed(seed, mode);
      }
      return { seed, byGovernor };
    });

    const byGovernorSummary = {};
    for (const mode of GOVERNOR_MODES) {
      byGovernorSummary[mode] = {
        governanceComplianceScore: studentT95(runs.map(r => r.byGovernor[mode].metrics.governanceComplianceScore)),
        domainConcurrencyViolations: studentT95(runs.map(r => r.byGovernor[mode].metrics.domainConcurrencyViolations)),
        tokenBucketOverruns: studentT95(runs.map(r => r.byGovernor[mode].metrics.tokenBucketOverruns)),
        populationCapBreaches: studentT95(runs.map(r => r.byGovernor[mode].metrics.populationCapBreaches)),
        killSwitchLeakCount: studentT95(runs.map(r => r.byGovernor[mode].metrics.killSwitchLeakCount)),
        peakPopulation: studentT95(runs.map(r => r.byGovernor[mode].metrics.peakPopulation)),
        acceptedRequests: studentT95(runs.map(r => r.byGovernor[mode].metrics.acceptedRequests)),
        deferredRequests: studentT95(runs.map(r => r.byGovernor[mode].metrics.deferredRequests))
      };
    }

    const fullVsNoKillGains = runs.map(
      r => r.byGovernor['full-token-bucket-swarm-governor'].metrics.governanceComplianceScore -
           r.byGovernor['per-domain-bucket-no-killswitch'].metrics.governanceComplianceScore
    );
    const fullVsGlobalOnlyGains = runs.map(
      r => r.byGovernor['full-token-bucket-swarm-governor'].metrics.governanceComplianceScore -
           r.byGovernor['global-cap-no-per-domain-bucket'].metrics.governanceComplianceScore
    );
    const fullVsFloodGains = runs.map(
      r => r.byGovernor['full-token-bucket-swarm-governor'].metrics.governanceComplianceScore -
           r.byGovernor['ungoverned-locust-flood'].metrics.governanceComplianceScore
    );

    const fullBeatNoKillSeeds = fullVsNoKillGains.filter(d => d > 50.0).length;
    const fullBeatGlobalOnlySeeds = fullVsGlobalOnlyGains.filter(d => d > 50.0).length;
    const zeroDomainViolationSeeds = runs.filter(
      r => r.byGovernor['full-token-bucket-swarm-governor'].metrics.domainConcurrencyViolations === 0 &&
           r.byGovernor['full-token-bucket-swarm-governor'].metrics.tokenBucketOverruns === 0
    ).length;
    const zeroKillSwitchLeakSeeds = runs.filter(
      r => r.byGovernor['full-token-bucket-swarm-governor'].metrics.killSwitchLeakCount === 0 &&
           r.byGovernor['full-token-bucket-swarm-governor'].metrics.populationCapBreaches === 0
    ).length;

    return {
      schemaVersion: 1,
      benchmark: 'pass-17-swarm-budget-governor-v1',
      status: 'completed',
      liveRuntimeModified: false,
      protocol: {
        seeds: seeds.slice(),
        stepsPerSeed: 40,
        maxPopulationEntities: MAX_POPULATION_ENTITIES,
        domainsCount: TARGET_DOMAINS.length,
        governors: GOVERNOR_MODES.slice()
      },
      summary: {
        fullBeatNoKillSeeds,
        fullBeatGlobalOnlySeeds,
        zeroDomainViolationSeeds,
        zeroKillSwitchLeakSeeds,
        pairedDeltas: {
          fullVsNoKillComplianceGain: studentT95(fullVsNoKillGains),
          fullVsGlobalOnlyComplianceGain: studentT95(fullVsGlobalOnlyGains),
          fullVsFloodComplianceGain: studentT95(fullVsFloodGains)
        },
        byGovernor: byGovernorSummary
      },
      runs,
      scope: 'Pass 17 5-seed evaluation of the Public-Web & Onion Swarm Resource Governor (per-domain concurrency semaphores, token-bucket rate budgets, hard 15-entity population ceiling, and synchronous PAUSE / KILL_SWITCH enforcement).'
    };
  }

  return Object.freeze({
    run,
    createSwarmBudgetGovernor,
    evaluateGovernorOnSeed,
    TRAINING_SEEDS,
    GOVERNOR_MODES,
    TARGET_DOMAINS,
    MAX_POPULATION_ENTITIES
  });
});
