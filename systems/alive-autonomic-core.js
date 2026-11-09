/* Autonomic drive. Converts measured runtime signals into bounded behavioural
 * set-points: how urgently each capability should run, how long to stay on a
 * page, how hard the local controllers may push the body.
 *
 * A drive value is a control set-point computed from observed numbers. It is
 * not evidence of motivation, feeling, intelligence or consciousness. Every
 * output is finite and bounded; an absent or invalid input degrades to the
 * neutral value rather than propagating NaN.
 *
 * Pure and deterministic: the caller supplies `now`. Nothing here touches the
 * DOM, storage, the network or a clock.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AliveAutonomicCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const VERSION = 1;
  const finite = (value, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const unit = (value, fallback = 0) => clamp(finite(value, fallback), 0, 1);
  // Smooth, saturating response so a single extreme sample cannot dominate.
  const soft = value => 1 - Math.exp(-Math.max(0, value));

  // Capability urgency profiles. `base` is the scheduler interval the adapter
  // declares; `floorMs` is the hard lower bound this module will never go under,
  // so a runaway drive cannot turn a capability into a busy loop.
  const PROFILES = Object.freeze({
    'dom-body':      { weights: { boredom: 0.30, novelty: 0.45, arousal: 0.25 }, floorMs: 260 },
    'portal-jump':   { weights: { satiation: 0.55, boredom: 0.30, novelty: 0.15 }, floorMs: 700 },
    'research-plan': { weights: { satiation: 0.40, boredom: 0.35, novelty: 0.25 }, floorMs: 6000 },
    'grover-collapse': { weights: { satiation: 0.45, arousal: 0.30, novelty: 0.25 }, floorMs: 1200 },
    'decursive':     { weights: { boredom: 0.70, satiation: 0.30 }, floorMs: 2500 },
    'train-policy':  { weights: { learningProgress: 0.55, energy: 0.45 }, floorMs: 4000 },
    'dream':         { weights: { fatigue: 0.75, energy: 0.25 }, floorMs: 8000 },
    'feed':          { weights: { hunger: 1.00 }, floorMs: 3000 },
    'morph':         { weights: { boredom: 0.55, learningProgress: 0.45 }, floorMs: 6000 },
    'procreate':     { weights: { energy: 0.60, learningProgress: 0.40 }, floorMs: 9000 },
    'soul-surge':    { weights: { arousal: 0.60, boredom: 0.40 }, floorMs: 6000 },
    'deep-dark-dive': { weights: { novelty: 0.50, satiation: 0.50 }, floorMs: 5000 },
    'epoch-handoff': { weights: { satiation: 0.60, boredom: 0.40 }, floorMs: 6000 },
    'checkpoint':    { weights: { learningProgress: 1.00 }, floorMs: 20000 }
  });
  const DEFAULT_PROFILE = Object.freeze({ weights: { boredom: 0.5, novelty: 0.5 }, floorMs: 1000 });

  // How far urgency may compress a declared interval. 0.88 means a fully driven
  // capability runs at 12% of its declared period, subject to its own floor.
  const MAX_COMPRESSION = 0.88;

  function driveVector(signals = {}) {
    const s = signals;

    // Learning progress: prediction error falling is progress. Scaled so a
    // typical per-observation improvement reaches a useful fraction of 1.
    const errorNow = finite(s.predictionError, 0.5);
    const errorPrev = finite(s.predictionErrorPrev, errorNow);
    const learningProgress = unit(0.5 + clamp((errorPrev - errorNow) * 4, -0.5, 0.5));

    // Novelty: how much of what this page offers has not been seen before.
    const conceptsSeen = Math.max(1, finite(s.conceptsOnPage, 1));
    const conceptRatio = unit(finite(s.newConceptsOnPage, 0) / conceptsSeen);
    const domainRatio = unit(s.newDomainRatio, 0.5);
    const frontierPressure = soft(finite(s.frontierCount, 0) / 120);
    const novelty = unit(conceptRatio * 0.55 + domainRatio * 0.30 + frontierPressure * 0.15);

    // Satiation: this document has nothing further to give.
    const phase = String(s.explorationPhase || 'exploring');
    const exhausted = phase === 'exhausted' || phase === 'blocked';
    const stagnant = unit(finite(s.stagnantObservations, 0) / 3);
    const unchanged = unit(finite(s.unchangedObservations, 0) / 3);
    const satiation = unit((exhausted ? 0.65 : 0) + stagnant * 0.20 + unchanged * 0.15);

    // Boredom: time without anything new, independent of scroll geometry.
    const quiet = soft(Math.max(0, finite(s.msSinceNewConcept, 0)) / 9000);
    const dwellRatio = unit(finite(s.dwellMs, 0) / Math.max(1, finite(s.referenceDwellMs, 12000)));
    const boredom = unit(quiet * 0.60 + dwellRatio * 0.40);

    // Internal budget. Low ATP must be able to slow the whole animal down.
    const atp = unit(s.atp, 0.8);
    const glucose = unit(s.glucose, 0.8);
    const cortisol = unit(s.cortisol, 0.2);
    const energy = unit(atp * 0.6 + glucose * 0.4 - cortisol * 0.25);
    const hunger = unit(finite(s.agRP, 0.4) * 0.6 + (1 - glucose) * 0.4);
    const fatigue = unit(finite(s.sleepDebt, 0) * 0.7 + cortisol * 0.3);

    // Arousal from the neuromodulator set-points the mesh already maintains.
    const arousal = unit((unit(s.NE, 0.45) * 0.5 + unit(s.DA, 0.5) * 0.5) * (0.4 + 0.6 * energy));

    return { novelty, learningProgress, satiation, boredom, energy, hunger, fatigue, arousal };
  }

  function evaluate(signals = {}, previous = null) {
    const now = finite(signals.now, 0);
    const drives = driveVector(signals);
    const yielding = signals.userActive === true || String(signals.explorationPhase || '') === 'yielding';

    // Restlessness is the pressure to leave. Learning here suppresses it: a page
    // that is still teaching the model is worth staying on.
    const rawRestlessness = unit(
      drives.satiation * 0.45 + drives.boredom * 0.35 + (1 - drives.learningProgress) * 0.20
    );
    const restlessness = yielding ? Math.min(rawRestlessness, 0.15) : rawRestlessness;

    // Tempo scales the scheduler. Energy gates it so a depleted model slows down
    // instead of thrashing, and a yielding model goes quiet for the user.
    const rawTempo = unit(drives.arousal * 0.40 + drives.novelty * 0.25 + restlessness * 0.35);
    const tempo = yielding ? Math.min(rawTempo, 0.2) : unit(rawTempo * (0.45 + 0.55 * drives.energy));

    // How hard the local controllers may push the body this tick.
    const couplingGain = yielding ? 0.15 : unit(0.25 + 0.75 * (tempo * 0.6 + drives.arousal * 0.4));

    // Dwell multiplier: 1 keeps the configured reading time, lower leaves sooner.
    // Capped below so an excited model still reads a genuinely new page.
    const dwellScale = yielding ? 1 : clamp(1 - 0.72 * restlessness + 0.25 * drives.learningProgress, 0.18, 1.25);

    // Departure is a measured conclusion, not a timer: the page is exhausted or
    // repeatedly unchanged, and nothing is currently being learned from it.
    const departure = !yielding && drives.satiation >= 0.6 && drives.learningProgress < 0.56;

    const smoothed = previous && previous.version === VERSION
      ? {
          tempo: clamp(finite(previous.tempo, tempo) * 0.6 + tempo * 0.4, 0, 1),
          couplingGain: clamp(finite(previous.couplingGain, couplingGain) * 0.7 + couplingGain * 0.3, 0, 1),
          restlessness: clamp(finite(previous.restlessness, restlessness) * 0.55 + restlessness * 0.45, 0, 1)
        }
      : { tempo, couplingGain, restlessness };

    return {
      version: VERSION, at: now, drives, yielding, departure, dwellScale,
      tempo: smoothed.tempo, couplingGain: smoothed.couplingGain, restlessness: smoothed.restlessness,
      observations: Math.min(1000000, finite(previous?.observations, 0) + 1)
    };
  }

  // Urgency for one capability, from the drive vector its profile cares about.
  function urgency(state, capabilityId) {
    const profile = PROFILES[capabilityId] || DEFAULT_PROFILE;
    const drives = state?.drives;
    if (!drives) return 0;
    let total = 0, weight = 0;
    for (const [key, w] of Object.entries(profile.weights)) {
      total += unit(drives[key], 0) * w;
      weight += w;
    }
    const value = weight > 0 ? total / weight : 0;
    // Tempo lifts every capability together; a quiet model leaves everything slow.
    return unit(value * (0.35 + 0.65 * unit(state.tempo, 0)));
  }

  // Declared interval -> actual next interval, floored per capability.
  function intervalFor(state, capabilityId, baseMs) {
    const profile = PROFILES[capabilityId] || DEFAULT_PROFILE;
    const base = clamp(finite(baseMs, 5000), 1, 3600000);
    if (!state?.drives) return base;
    const compressed = base * (1 - MAX_COMPRESSION * urgency(state, capabilityId));
    return Math.round(clamp(compressed, Math.min(profile.floorMs, base), base));
  }

  // Scheduler shape. Bounded to what the existing Controller validates.
  function schedulerProfile(state) {
    const tempo = unit(state?.tempo, 0);
    return {
      intervalMs: Math.round(clamp(50 - 25 * tempo, 16, 1000)),
      budgetMs: Math.round(clamp(5 + 3 * tempo, 1, 25)),
      maxInFlight: Math.round(clamp(2 + 2 * tempo, 1, 4)),
      maxStartsPerTick: Math.round(clamp(2 + 4 * tempo, 1, 8))
    };
  }

  // Bounded gains for the motor path. `base` stays the floor so a calm model
  // behaves exactly as it does today; only an aroused one pushes harder.
  function motorGains(state) {
    const gain = unit(state?.couplingGain, 0);
    return {
      fusionLimit: Number((0.08 + 0.34 * gain).toFixed(4)),
      couplingMotor: Number((0.025 + 0.155 * gain).toFixed(4)),
      learnedThrustPrimary: Number((0.55 + 0.40 * gain).toFixed(4)),
      learnedThrustSwarm: Number((0.35 + 0.35 * gain).toFixed(4))
    };
  }

  function describe(state) {
    if (!state?.drives) return 'Autonomic drive has not been evaluated.';
    const d = state.drives;
    const pct = value => Math.round(unit(value) * 100);
    return `tempo ${pct(state.tempo)}% · restlessness ${pct(state.restlessness)}% · ` +
      `novelty ${pct(d.novelty)}% · learning ${pct(d.learningProgress)}% · satiation ${pct(d.satiation)}% · ` +
      `energy ${pct(d.energy)}%${state.yielding ? ' · yielding to the user' : ''}${state.departure ? ' · ready to depart' : ''}`;
  }

  return {
    VERSION, evaluate, driveVector, urgency, intervalFor, schedulerProfile, motorGains, describe,
    capabilities: Object.freeze(Object.keys(PROFILES)),
    profile: id => PROFILES[id] || DEFAULT_PROFILE
  };
});
