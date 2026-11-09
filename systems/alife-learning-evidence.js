(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AlifeLearningEvidence = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const round = (x) => Number(x.toFixed(6));
  const TEST_SEEDS = [101, 202, 303, 404, 505];
  const RETENTION_SEEDS = [607, 709, 811, 919, 1021];
  const TRAIN_SEEDS = [7, 19, 43];
  function rng(seed) {
    let state = seed >>> 0;
    return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  }
  function actorOutput(actor, morphWeights, observation, morphology, dimensions) {
    const output = new Float64Array(dimensions.actions);
    for (let a = 0; a < output.length; a++) {
      let x = 0;
      for (let j = 0; j < dimensions.observations; j++) x += actor[a * dimensions.observations + j] * observation[j];
      for (let j = 0; j < morphology.length; j++) x += 0.35 * morphWeights[a * morphology.length + j] * morphology[j];
      output[a] = Math.tanh(x);
    }
    return output;
  }
  // A bounded, deterministic simulated steering curriculum. The score is the
  // measured return of these trajectories, never a claim about unseen websites.
  function policyTrial(actor, morphWeights, morphology, dimensions, seed, train) {
    const random = rng(seed), obs = new Float64Array(dimensions.observations);
    let x = random() * 3 - 1.5, y = random() * 3 - 1.5, vx = 0, vy = 0, total = 0;
    for (let step = 0; step < 20; step++) {
      obs.fill(0);
      obs[0] = Math.tanh(x); obs[1] = Math.tanh(y);
      if (obs.length > 3) { obs[2] = vx; obs[3] = vy; }
      if (obs.length > 9) { obs[8] = .8; obs[9] = .8; }
      const action = actorOutput(actor, morphWeights, obs, morphology, dimensions);
      if (train) {
        const targets = [-Math.tanh(x + .8 * vx), -Math.tanh(y + .8 * vy), 0, 0, 0];
        for (let a = 0; a < dimensions.actions; a++) {
          const gradient = ((targets[a] || 0) - action[a]) * (1 - action[a] * action[a]);
          for (let j = 0; j < dimensions.observations; j++) {
            const i = a * dimensions.observations + j;
            actor[i] = clamp(actor[i] + .018 * gradient * obs[j], -2.5, 2.5);
          }
          for (let j = 0; j < morphology.length; j++) {
            const i = a * morphology.length + j;
            morphWeights[i] = clamp(morphWeights[i] + .003 * gradient * morphology[j], -1.8, 1.8);
          }
        }
      }
      vx = .82 * vx + .12 * action[0]; vy = .82 * vy + .12 * action[1];
      x = clamp(x + vx, -4, 4); y = clamp(y + vy, -4, 4);
      total += 1 / (1 + Math.hypot(x, y));
    }
    return total / 20;
  }
  function evaluatePolicy(actor, morph, morphology, dimensions, seeds = TEST_SEEDS) {
    const returns = seeds.map(seed => policyTrial(actor, morph, morphology, dimensions, seed, false));
    return { seeds: seeds.slice(), returns: returns.map(round), meanReturn: mean(returns) };
  }
  function worldMse(weights, transitions, dimensions) {
    let total = 0, count = 0;
    for (const transition of transitions) {
      for (let i = 0; i < dimensions; i++) {
        let prediction = 0;
        for (let j = 0; j < dimensions; j++) prediction += weights[i * dimensions + j] * transition.observation[j];
        const difference = Math.tanh(prediction) - transition.nextObservation[i];
        total += difference * difference; count++;
      }
    }
    return count ? total / count : null;
  }
  function trainWorld(weights, transitions, dimensions) {
    for (let epoch = 0; epoch < 2; epoch++) {
      for (const transition of transitions) {
        for (let i = 0; i < dimensions; i++) {
          let value = 0;
          for (let j = 0; j < dimensions; j++) value += weights[i * dimensions + j] * transition.observation[j];
          const prediction = Math.tanh(value);
          const gradient = (transition.nextObservation[i] - prediction) * (1 - prediction * prediction);
          for (let j = 0; j < dimensions; j++) {
            const k = i * dimensions + j;
            weights[k] = clamp(weights[k] + .01 * gradient * transition.observation[j], -3, 3);
          }
        }
      }
    }
  }
  function ringStep(state, target, velocity, ablated) {
    const n = state.length, average = mean(state);
    let best = 0, max = -Infinity;
    for (let i = 0; i < n; i++) {
      const left = state[(i - 1 + n) % n], right = state[(i + 1) % n];
      const visual = Math.cos(target - ((i / n) * 2 * Math.PI - Math.PI));
      const ring = ablated ? 0 : .22 * (left + right) * .5 + .18 * velocity * (right - left) - .55 * average;
      state[i] = Math.max(0, Math.tanh(.68 * state[i] + .34 * visual + ring));
      if (state[i] > max) { max = state[i]; best = i; }
    }
    return best / n * 2 * Math.PI - Math.PI;
  }
  function flywireBenchmark(initial) {
    const intact = new Float32Array(initial), ablated = new Float32Array(initial);
    let intactError = 0, ablatedError = 0;
    for (let t = 0; t < 48; t++) {
      const target = Math.sin(t * .19) * 2.4 + Math.cos(t * .11) * .6, velocity = .12 * Math.cos(t * .19);
      for (const [state, isAblated] of [[intact, false], [ablated, true]]) {
        const angle = ringStep(state, target, velocity, isAblated);
        const error = Math.abs(Math.atan2(Math.sin(target - angle), Math.cos(target - angle)));
        if (isAblated) ablatedError += error; else intactError += error;
      }
    }
    const intactScore = (1 - intactError / 48 / Math.PI) * 100;
    const ablatedScore = (1 - ablatedError / 48 / Math.PI) * 100;
    return { intactHeadingErrRad: round(intactError / 48), ablatedHeadingErrRad: round(ablatedError / 48), intactTrackScorePct: round(intactScore), ablatedTrackScorePct: round(ablatedScore), advantagePct: round(intactScore - ablatedScore), steps: 48, capacity: initial.length, source: 'simulated matched-capacity ring ablation' };
  }
  function install(h) {
    if (!h || h.learningEvidence) return h?.learningEvidence;
    const evidence = h.learningEvidence = { version: 3, transitions: [], observedPageFrames: 0, ignoredUnobservedSteps: 0,
      rejectedObservationFrames: 0, recordedTransitions: 0, continuityBreaks: 0,
      trainingRuns: 0, dreams: 0, policyEvaluation: null, flywireEvaluation: null, dreamEvaluation: null };
    const closedLoop = h.stepClosedLoop;
    let previousObservation = null, previousContext = null, latestObservedAt = -Infinity;
    h.stepClosedLoop = function (...args) {
      const result = closedLoop.apply(this, args);
      // Only the successful guest-page commit may supply this context. Ordinary
      // simulation/proprioception steps still run, but never become page evidence.
      const context = args[1], mask = args[0]?.sensorValidityMask;
      if (context?.source !== 'observed-page') { evidence.ignoredUnobservedSteps++; return result; }
      if (typeof context.tabId !== 'string' || !context.tabId.trim() ||
          typeof context.url !== 'string' || !context.url.trim() ||
          !Number.isFinite(context.observedAt) || context.observedAt < 0 || context.observedAt <= latestObservedAt ||
          !Number.isInteger(mask) || mask <= 0) {
        evidence.rejectedObservationFrames++;
        return result;
      }
      const current = Array.from(this.obsVec);
      if (current.length !== this.D_OBS || !current.every(Number.isFinite)) {
        evidence.rejectedObservationFrames++;
        return result;
      }
      const currentContext = { tabId: context.tabId.slice(0, 128), url: context.url.slice(0, 2048), observedAt: context.observedAt,
        authorityEpoch: Number.isSafeInteger(this.authorityEpoch) && this.authorityEpoch >= 0 ? this.authorityEpoch : null,
        sensorValidityMask: mask };
      latestObservedAt = context.observedAt;
      evidence.observedPageFrames++;
      if (previousObservation && previousContext.tabId === currentContext.tabId && previousContext.authorityEpoch === currentContext.authorityEpoch) {
        const transitionId = evidence.recordedTransitions++;
        evidence.transitions.push({ observation: previousObservation, nextObservation: current, tick: this.simulationTick,
          transitionId, replayPartition: transitionId % 4 === 0 ? 'heldout' : 'training',
          source: 'observed guest-page transition', from: previousContext, to: currentContext });
        if (evidence.transitions.length > 128) evidence.transitions.shift();
      } else if (previousObservation) evidence.continuityBreaks++;
      previousObservation = current;
      previousContext = currentContext;
      return result;
    };
    h.runPracticeAndHeldOutEval = function () {
      const dimensions = { actions: this.D_ACT, observations: this.D_OBS };
      const oldActor = new Float32Array(this.W_actor), oldMorph = new Float32Array(this.W_metamorph);
      const baseline = evaluatePolicy(oldActor, oldMorph, this.morphVec, dimensions);
      const retentionBaseline = evaluatePolicy(oldActor, oldMorph, this.morphVec, dimensions, RETENTION_SEEDS);
      for (const seed of TRAIN_SEEDS) policyTrial(this.W_actor, this.W_metamorph, this.morphVec, dimensions, seed, true);
      const candidate = evaluatePolicy(this.W_actor, this.W_metamorph, this.morphVec, dimensions);
      const retentionCandidate = evaluatePolicy(this.W_actor, this.W_metamorph, this.morphVec, dimensions, RETENTION_SEEDS);
      const delta = (candidate.meanReturn - baseline.meanReturn) / Math.max(1e-9, Math.abs(baseline.meanReturn)) * 100;
      const retention = retentionCandidate.meanReturn / Math.max(1e-9, retentionBaseline.meanReturn) * 100;
      const promoted = Number.isFinite(delta) && delta > 0 && retention >= 95;
      if (!promoted) { this.W_actor.set(oldActor); this.W_metamorph.set(oldMorph); }
      else {
        this.W_actor_frozen.set(this.W_actor);
        this.policyCid = this.mintCid('policy-local', `measured-control-${++evidence.trainingRuns}`);
        this.saveCheckpoint('measured-simulated-policy-promotion');
      }
      const stage = ['A','B','C','D','E','F'][this.stageIdx] || 'A';
      this.lastPracticeProposal = { hypothesis: 'Improve bounded simulated steering return with measured holdout and retention trajectories', taskFamily: 'simulated-steering', targetSkill: stage, episodeBudget: 60, expectedImprovement: 'Measured after training; no guaranteed improvement' };
      this.lastEvalReport = { candidateId: `control-${this.simulationTick}`, heldOutDeltaPct: round(delta), retentionPct: round(retention), status: promoted ? 'PROMOTED → simulated control benchmark' : 'ROLLED BACK → measured non-improvement', source: 'single-candidate simulated steering curriculum; not an independent multi-training-seed or changed-condition benchmark', baseline, candidate, retentionBaseline, retentionCandidate,
        // Keep the legacy field for checkpoint/report consumers, but distinguish
        // sequential trajectory seeds from independently initialized training runs.
        trainingSeeds: TRAIN_SEEDS.slice(), trainingSeedScope: 'sequential trajectories within one candidate training run',
        trainingProcedure: { candidateRuns: 1, trajectorySeeds: TRAIN_SEEDS.slice(), independentTrainingSeeds: [], evaluationSeeds: TEST_SEEDS.slice(), retentionEvaluationSeeds: RETENTION_SEEDS.slice(), changedConditionSuite: false }, promoted };
      evidence.policyEvaluation = this.lastEvalReport;
      this.evaluateAcceptanceGates(); this.renderRetroTerminalOverlay();
      return { proposal: this.lastPracticeProposal, evalReport: this.lastEvalReport, policyCid: this.policyCid };
    };
    h.consolidateHippocampalDreamReplay = function () {
      const samples = evidence.transitions.slice(-96);
      if (samples.length < 8) {
        const pending = { status: 'blocked', reason: 'At least eight observed state transitions are required', dreamReplayNum: this.dreamReplaysCount || 0, replayedEpisodes: 0, beforeErr: this.worldPredError, afterErr: this.worldPredError, newPolicyCid: this.policyCid };
        evidence.dreamEvaluation = pending; return pending;
      }
      // Membership is assigned once at observation time. Repartitioning a sliding
      // window by array index leaks earlier holdout transitions into later training.
      const training = samples.filter(sample => sample.replayPartition === 'training');
      const heldout = samples.filter(sample => sample.replayPartition === 'heldout');
      const previous = new Float32Array(this.W_world), before = worldMse(previous, heldout, this.D_OBS);
      trainWorld(this.W_world, training, this.D_OBS);
      const candidate = worldMse(this.W_world, heldout, this.D_OBS);
      const promoted = Number.isFinite(candidate) && candidate < before;
      if (!promoted) this.W_world.set(previous);
      const after = promoted ? candidate : before;
      this.dreamReplaysCount = (this.dreamReplaysCount || 0) + 1;
      evidence.dreams++;
      this.learningProgress = before - after;
      this.mesh.viscera.sleepS = Math.max(0, this.mesh.viscera.sleepS - .1);
      if (promoted) { this.policyCid = this.mintCid('dream-local', `measured-dream-${evidence.dreams}`); this.saveCheckpoint('observed-transition-dream-replay'); }
      evidence.dreamEvaluation = { status: promoted ? 'completed' : 'observed', dreamReplayNum: this.dreamReplaysCount, replayedEpisodes: training.length, heldoutTransitions: heldout.length, beforeErr: before, afterErr: after, candidateErr: candidate, promoted, newPolicyCid: this.policyCid,
        source: 'MSE on held-out observed state transitions', partition: 'stable transition-id membership; heldout samples never enter replay gradients',
        scope: 'Local replay diagnostic with temporally correlated and repeatedly evaluated observations; not an independent generalization benchmark' };
      this.renderRetroTerminalOverlay(); return evidence.dreamEvaluation;
    };
    h.runFlyWireAblationTest = function () {
      const benchmark = flywireBenchmark(this.flywireConnectome.epgCompass);
      benchmark.trialsRun = (evidence.flywireEvaluation?.trialsRun || 0) + 1;
      benchmark.verdict = benchmark.advantagePct > 0 ? 'INTACT_BETTER_IN_THIS_SIMULATION' : 'NO_INTACT_ADVANTAGE_IN_THIS_SIMULATION';
      this.flywireConnectome.intactVsAblatedBenchmark = benchmark;
      evidence.flywireEvaluation = benchmark;
      this.renderRetroTerminalOverlay(); return benchmark;
    };
    h.evaluateAcceptanceGates = function () {
      const pending = (id, area, metric) => ({ id, area, metric, status: 'NOT_RUN', passed: false });
      const rawTimings = this.policyLatencySamples || [], policy = evidence.policyEvaluation;
      const timings = Array.from(rawTimings).filter(value => Number.isFinite(value) && value >= 0).sort((a, b) => a - b);
      const p95Ms = timings.length ? timings[Math.ceil(timings.length * .95) - 1] : null;
      const over10Ms = timings.filter(value => value > 10).length;
      const latencyDiagnostic = { status: timings.length ? 'PARTIAL' : 'NOT_RUN', sampleCount: timings.length,
        rejectedSamples: rawTimings.length - timings.length, p95Ms, stepsOver10Ms: over10Ms,
        stepDurationOver10MsFraction: timings.length ? over10Ms / timings.length : null,
        chosenControlRateHz: null, controlDeadlineMissFraction: null, renderingLoadDefinition: null,
        queueMeasurements: null, deviceMemoryMeasurements: null,
        scope: 'Stored policy-step instrumentation with a legacy 0.15ms floor, recorded before final call bookkeeping; excludes rendering and scheduling delay. A duration over 10ms is not a measured scheduling-deadline miss' };
      const gates = [
        pending('G1', 'Browser Neural FP32 Parity', 'Independent reference parity has not been measured'),
        { ...pending('G2', 'Responsive control under rendering load', `${timings.length} finite policy-duration samples; p95=${p95Ms === null ? 'unmeasured' : p95Ms.toFixed(2) + 'ms'}; ${over10Ms} durations >10ms. Chosen-rate deadline misses, rendering-load protocol, queues and device memory remain unmeasured`),
          evidenceLevel: timings.length ? 'partial' : 'none', diagnostics: latencyDiagnostic,
          requiredEvidence: 'p95 policy step <=10ms AND <1% deadline misses at a declared control rate under rendering load; wall-clock distributions, queues and device memory' },
        pending('G3', 'Unseen DOM Navigation', '100 unseen navigation episodes have not been run'),
        { ...pending('G4', 'Learning and adaptation across training seeds', policy ? `Single-candidate simulated steering: improvement ${policy.heldOutDeltaPct}%; retention ${policy.retentionPct}%; ${policy.trainingSeeds.length} sequential training-trajectory seeds, ${policy.candidate.seeds.length} evaluation seeds. Independent training-seed and changed-condition suite NOT_RUN` : 'No measured policy comparison yet; independent training-seed and changed-condition suite NOT_RUN'),
          evidenceLevel: policy ? 'partial' : 'none', diagnostics: { status: policy ? 'PARTIAL' : 'NOT_RUN', simulatedCandidatePromoted: policy ? policy.promoted : null,
            heldOutDeltaPct: policy ? policy.heldOutDeltaPct : null, retentionPct: policy ? policy.retentionPct : null,
            trainingProcedure: policy ? policy.trainingProcedure : null },
          requiredEvidence: 'At least five independent training seeds; changed-condition candidate versus frozen policy and retained-task comparisons; policy hashes, optimizer updates, learning curves and confidence intervals' },
        pending('G5', 'RIMs + Option-Critic Router', 'Matched monolithic-baseline ablation has not been run'),
        pending('G6', 'Persistent Entity & Handoff', 'Durable restore and competing-writer fencing require an independent integration test'),
        pending('G7', 'Partner Turn & Bio-Sonar', 'Measured interruption and audio-output tests have not been run'),
        pending('G8', 'FlyWire & MetaMorph transfer', evidence.flywireEvaluation ? `Ring simulation difference ${evidence.flywireEvaluation.advantagePct} percentage points; morphology transfer not measured` : 'Matched ring and morphology-transfer measurements pending')
      ];
      const passedCount = gates.filter(g => g.passed).length;
      this.lastAcceptanceReport = { passedCount, totalCount: gates.length, allPassed: passedCount === gates.length, gates, evaluatedAtTick: this.simulationTick, releaseQualified: false,
        scope: 'Full PDF page 22 acceptance criteria; partial runtime diagnostics do not promote a gate to PASS' };
      return this.lastAcceptanceReport;
    };
    h.evaluateAcceptanceGates();
    return evidence;
  }
  return { install, evaluatePolicy, worldMse, trainWorld, flywireBenchmark, actorOutput };
});
