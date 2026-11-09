/* Independent, isolated repetitions of the production simulated policy learner.
 * This diagnostic does not mutate the live creature or qualify the PDF G4 gate. */
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports
    ? require('./alife-learning-evidence.js') : root.AlifeLearningEvidence);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AliveLearningFiveSeed = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (learning) {
  'use strict';
  const TRAINING_SEEDS = Object.freeze([17011, 27011, 37013, 47017, 57037]);
  const DIMENSIONS = Object.freeze({ actions: 5, observations: 16 });
  const MORPHOLOGY = Object.freeze([0.67, 0.75, 0.575, 0.58, 0.88, 1.0]);
  const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
  function random(seed) {
    let state = seed >>> 0;
    return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  }
  function initialization(seed) {
    const next = random(seed);
    // The ranges and morphology match HumunculusTokenlessRuntime's controller.
    // The seeded source substitutes for its browser entropy to permit replication.
    return { actor: Float32Array.from({ length: 80 }, () => (next() - .5) * .45),
      morph: Float32Array.from({ length: 30 }, () => (next() - .5) * .28) };
  }
  function trajectorySeeds(seed, reserved) {
    const next = random(seed ^ 0x9e3779b9), result = [];
    while (result.length < 3) {
      const candidate = Math.floor(next() * 4294967296);
      if (!reserved.has(candidate)) { reserved.add(candidate); result.push(candidate); }
    }
    return result;
  }
  async function stateHash(actor, morph, crypto) {
    // Explicit little-endian encoding makes fingerprints portable across hosts.
    const header = new TextEncoder().encode('gigachad-simulated-policy-v1:actor[5,16]:morph[5,6]:float32-le\n');
    const bytes = new Uint8Array(header.length + (actor.length + morph.length) * 4);
    bytes.set(header);
    const view = new DataView(bytes.buffer); let offset = header.length;
    for (const values of [actor, morph]) for (const value of values) {
      if (!Number.isFinite(value)) throw new Error('Nonfinite policy parameter');
      view.setFloat32(offset, value, true); offset += 4;
    }
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function parameterDelta(before, after) {
    let changed = 0, l1 = 0, squares = 0, maxAbs = 0;
    for (let i = 0; i < before.length; i++) {
      const delta = after[i] - before[i];
      if (!Number.isFinite(delta)) throw new Error('Nonfinite parameter change');
      if (!Object.is(before[i], after[i])) changed++;
      l1 += Math.abs(delta); squares += delta * delta; maxAbs = Math.max(maxAbs, Math.abs(delta));
    }
    return { count: before.length, changed, l1, l2: Math.sqrt(squares), maxAbs };
  }
  function checkedEvaluation(actor, morph, morphology, seeds) {
    const result = learning.evaluatePolicy(actor, morph, morphology, DIMENSIONS, seeds);
    if (!Number.isFinite(result.meanReturn) || result.returns.length !== seeds.length || !result.returns.every(Number.isFinite))
      throw new Error('Nonfinite or incomplete trajectory evaluation');
    return result;
  }
  function interval(values) {
    if (!values.length) return { count: 0, mean: null, sampleStandardDeviation: null, ci95: null };
    const average = mean(values);
    if (values.length !== 5) return { count: values.length, mean: average, sampleStandardDeviation: null, ci95: null };
    const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / 4);
    const halfWidth = 2.7764451051977987 * deviation / Math.sqrt(5);
    return { count: 5, mean: average, sampleStandardDeviation: deviation, ci95: [average - halfWidth, average + halfWidth],
      method: 'Two-sided Student t interval across five independent training runs; df=4, approximate normality assumption, descriptive only' };
  }
  async function run({ trainingSeeds = TRAINING_SEEDS, crypto = globalThis.crypto } = {}) {
    if (!Array.isArray(trainingSeeds) || trainingSeeds.length !== 5 || new Set(trainingSeeds).size !== 5 ||
        trainingSeeds.some(seed => !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff))
      throw new TypeError('Exactly five distinct unsigned 32-bit training seeds are required');
    if (!crypto?.subtle?.digest) throw new Error('SHA-256 WebCrypto is required for policy provenance');
    if (typeof learning?.policyTrial !== 'function' || typeof learning?.evaluatePolicy !== 'function' || !learning?.policySeeds)
      throw new Error('The production policy learning functions are unavailable');
    const seeds = trainingSeeds.slice(), holdoutSeeds = learning.policySeeds.holdout.slice(), retentionSeeds = learning.policySeeds.retention.slice();
    const reserved = new Set([...holdoutSeeds, ...retentionSeeds]);
    const runs = [];
    for (const seed of seeds) {
      const trajectories = trajectorySeeds(seed, reserved);
      const record = { trainingSeed: seed, trajectorySeeds: trajectories, status: 'error', error: null, optimizerUpdates: 0,
        learningCurve: [], initialStateSha256: null, candidateStateSha256: null, frozenStateSha256: null };
      try {
        const initial = initialization(seed), actor = new Float32Array(initial.actor), morph = new Float32Array(initial.morph);
        const morphology = new Float32Array(MORPHOLOGY);
        record.initialStateSha256 = await stateHash(initial.actor, initial.morph, crypto);
        record.frozen = { holdout: checkedEvaluation(initial.actor, initial.morph, morphology, holdoutSeeds),
          retention: checkedEvaluation(initial.actor, initial.morph, morphology, retentionSeeds) };
        record.learningCurve.push({ trajectory: 0, optimizerUpdates: 0, holdoutMean: record.frozen.holdout.meanReturn,
          retentionMean: record.frozen.retention.meanReturn });
        for (let i = 0; i < trajectories.length; i++) {
          const trainingReturn = learning.policyTrial(actor, morph, morphology, DIMENSIONS, trajectories[i], true);
          if (!Number.isFinite(trainingReturn)) throw new Error('Nonfinite training trajectory return');
          record.optimizerUpdates += 20;
          record.learningCurve.push({ trajectory: i + 1, optimizerUpdates: record.optimizerUpdates, trainingReturn,
            holdoutMean: checkedEvaluation(actor, morph, morphology, holdoutSeeds).meanReturn,
            retentionMean: checkedEvaluation(actor, morph, morphology, retentionSeeds).meanReturn });
        }
        record.candidate = { holdout: checkedEvaluation(actor, morph, morphology, holdoutSeeds),
          retention: checkedEvaluation(actor, morph, morphology, retentionSeeds) };
        record.parameterDelta = { actor: parameterDelta(initial.actor, actor), morphologyConditioning: parameterDelta(initial.morph, morph) };
        record.holdoutDelta = record.candidate.holdout.meanReturn - record.frozen.holdout.meanReturn;
        record.heldOutDeltaPct = record.holdoutDelta / Math.max(1e-9, Math.abs(record.frozen.holdout.meanReturn)) * 100;
        record.retentionPct = record.candidate.retention.meanReturn / Math.max(1e-9, record.frozen.retention.meanReturn) * 100;
        record.wouldPromoteUnderProductionRule = record.heldOutDeltaPct > 0 && record.retentionPct >= 95;
        record.candidateStateSha256 = await stateHash(actor, morph, crypto);
        record.frozenStateSha256 = await stateHash(initial.actor, initial.morph, crypto);
        if (record.frozenStateSha256 !== record.initialStateSha256) throw new Error('Frozen baseline changed during training');
        record.status = 'completed';
      } catch (error) { record.error = String(error?.message || error).slice(0, 320); }
      runs.push(record);
    }
    const completed = runs.filter(item => item.status === 'completed');
    return { schemaVersion: 1, benchmark: 'independent-five-seed-simulated-steering-v1', status: completed.length === 5 ? 'completed' : 'incomplete',
      releaseQualified: false, gateG4Passed: false, livePolicyModified: false,
      protocol: { independentTrainingSeeds: seeds, holdoutSeeds, retentionSeeds, dimensions: DIMENSIONS, morphology: MORPHOLOGY.slice(),
        trainingTrajectoriesPerSeed: 3, stepsPerTrajectory: 20, optimizerUpdatesPerSeed: 60,
        initialState: 'Fresh independently seeded Float32 actor and morphology weights; production initialization ranges',
        randomSource: 'LCG32: state = 1664525 * state + 1013904223 mod 2^32; reproducibility source, not cryptographic entropy',
        productionMethods: ['AlifeLearningEvidence.policyTrial', 'AlifeLearningEvidence.evaluatePolicy'],
        fixedBudget: true, evaluationControls: 'Each candidate and frozen same-initial-state baseline use identical fixed holdout and retention trajectories',
        curveUse: 'Reported after a fixed schedule; no early stopping or model selection using intermediate evaluations',
        changedConditionSuite: false, retentionScope: 'Disjoint trajectories of the same steering task, not distinct previously learned tasks',
        fingerprint: 'SHA-256 over versioned shape header and explicit little-endian Float32 actor then morphology weights' },
      summary: { requestedRuns: 5, completedRuns: completed.length, failedRuns: 5 - completed.length,
        positiveHoldoutRuns: completed.filter(item => item.holdoutDelta > 0).length,
        productionRulePassRuns: completed.filter(item => item.wouldPromoteUnderProductionRule).length,
        holdoutDelta: interval(completed.map(item => item.holdoutDelta)),
        heldOutDeltaPct: interval(completed.map(item => item.heldOutDeltaPct)),
        retentionPct: interval(completed.map(item => item.retentionPct)) }, runs,
      scope: 'Independent initialization and training randomness for a compact simulated steering learner. No browser navigation, changed-condition adaptation, distinct-task retention, consciousness, full-body transfer or PDF G4 qualification is established.' };
  }
  return Object.freeze({ run, TRAINING_SEEDS });
});
