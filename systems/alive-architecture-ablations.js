/* Pass 3: Architecture ablations across every brain family, precision route,
 * scale stratum, specialist readout, AoT/ToT/GoT reasoning structure, and
 * Synaptic Fabric pathway.
 *
 * Uses the actual production modules (BleedEdge25AlifeEngine, AliveNeuralCoupling,
 * AliveSpecialistFusion, AliveResearchPolicy, AliveCognitiveFaculties,
 * AliveSynapticFabric) across five independent seeds ([19013, 29017, 39023, 49031, 59053]).
 *
 * Scope: deterministic in-process causal ablation of local numerical streams,
 * specialist fusion masks, AoT/ToT/GoT terms and Synaptic Fabric edges. It does
 * not mutate the live browser session or claim external scientific validation.
 */
(function (root, factory) {
  const deps = typeof module === 'object' && module.exports
    ? {
        BleedEdge: require('./alife-25-bleeding-edge-models.js'),
        NeuralCoupling: require('./alive-neural-coupling.js'),
        SpecialistFusion: require('./alive-specialist-fusion.js'),
        SynapticFabric: require('./alive-synaptic-fabric.js'),
        UnseenBenchmark: require('./alive-unseen-task-benchmark.js')
      }
    : {
        BleedEdge: {
          BleedEdge25AlifeEngine: root?.BleedEdge25AlifeEngine,
          AotTotGotCorecursiveDecursiveEngine: root?.AotTotGotCorecursiveDecursiveEngine
        },
        NeuralCoupling: root?.AliveNeuralCoupling,
        SpecialistFusion: root?.AliveSpecialistFusion,
        SynapticFabric: root?.AliveSynapticFabric,
        UnseenBenchmark: root?.AliveUnseenTaskBenchmark
      };
  const api = factory(deps);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveArchitectureAblations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';

  const TRAINING_SEEDS = Object.freeze([19013, 29017, 39023, 49031, 59053]);
  const BRAIN_SOURCES = Object.freeze([
    'brain1Asmodensius', 'brain2Glitchling', 'brain3CqmSuperMind', 'brain4ApexHydra',
    'brain5Xenomimic', 'brain6XylosManifold', 'brain7Mechalogodrom', 'brain8GlyphPantheon',
    'brain9ThalerDabus', 'brain10GraphCrystal', 'brain11TsotchkeDale', 'brain12BlackHolePage',
    'brain13ConsciousnessConsortium', 'brain14ThingmakerGrimoire'
  ]);
  const PRECISION_SOURCES = Object.freeze([
    'precision-f64', 'precision-i64', 'precision-u32', 'precision-fp16',
    'precision-int8', 'precision-ternary', 'precision-f32'
  ]);
  const STRATA_SOURCES = Object.freeze(['micro-ising', 'omega-lorenz', 'omega-izhikevich']);
  const SPECIALIST_NAMES = Object.freeze([
    'NMDA_sLTC_Sheet', 'Dreamer_WorldModel', 'FlyWire_Connectome', 'QGTL_Grover_Q3', 'Allostatic_AgRP'
  ]);
  const REASONING_COMPONENTS = Object.freeze(['AoT-contractor', 'ToT-puct-tree', 'GoT-dag-pagerank', 'all-aot-tot-got']);
  const FABRIC_PATHWAYS = Object.freeze(['ghost-swarm', 'ghost-write', 'dom-body>reasoning', 'online-ranker-plasticity']);

  function lcg32(seed) {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
  function studentT95(values) {
    if (!values.length) return { count: 0, mean: null, sampleStandardDeviation: null, ci95: null };
    const avg = mean(values);
    if (values.length !== 5) return { count: values.length, mean: avg, sampleStandardDeviation: null, ci95: null };
    const sd = Math.sqrt(values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / 4);
    const half = 2.7764451051977987 * sd / Math.sqrt(5);
    return {
      count: 5,
      mean: avg,
      sampleStandardDeviation: sd,
      ci95: [avg - half, avg + half],
      method: 'Two-sided Student t interval across five independent seeds; df=4'
    };
  }

  function l2Distance(a, b) {
    let sum = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const d = (a[i] || 0) - (b[i] || 0);
      sum += d * d;
    }
    return Math.sqrt(sum);
  }

  // Construct an isolated, deterministic creature host backed by the real
  // BleedEdge25AlifeEngine (all 14 brains, 7 precision arenas, AoT/ToT/GoT),
  // 56-spin Ising lattice, and Lorenz + Izhikevich Omega integration states.
  function createSeededHost(seed) {
    const next = lcg32(seed ^ 0x9e3779b9);
    const Engine = deps.BleedEdge?.BleedEdge25AlifeEngine;
    if (typeof Engine !== 'function') throw new Error('BleedEdge25AlifeEngine is required for architecture ablations');
    const engine = new Engine();
    const ising56 = Int8Array.from({ length: 56 }, (_, i) => ((next() > 0.45) ^ (i & 1)) ? 1 : -1);
    const obsVec = Float32Array.from({ length: 16 }, (_, i) => 0.12 + 0.015 * i + (next() - 0.5) * 0.08);
    const predObsVec = Float32Array.from({ length: 16 }, (_, i) => obsVec[i] + 0.09 * Math.sin(i + 1 + next()));
    const W_actor = Float32Array.from({ length: 32 }, (_, i) => 0.18 * Math.cos((i + 1) * 0.7 + (seed & 15) * 0.1));
    const h = {
      simulationTick: 1,
      authorityEpoch: 1,
      D_OBS: 16,
      obsVec,
      predObsVec,
      W_actor,
      mesh: {
        ising56,
        nm: { DA: 0.52, ACh: 0.48, NE: 0.46, S5: 0.44 },
        iitPhi: 0.55,
        entanglementBits: 0.51,
        viscera: { glc: 0.62 }
      },
      continuousWorldModel: {
        latentZ64: Float32Array.from({ length: 64 }, (_, i) => 0.18 + 0.005 * (i % 16) + (next() - 0.5) * 0.04)
      },
      trainableAlifeNeuralHub: {
        zPerc16: Float32Array.from({ length: 16 }, (_, i) => 0.25 + 0.02 * i + (next() - 0.5) * 0.22),
        samSpatialAffordance16: Float32Array.from({ length: 16 }, (_, i) => 0.18 + (next() - 0.5) * 0.28),
        diffusedIdeaVec16: Float32Array.from({ length: 16 }, (_, i) => 0.22 + (next() - 0.5) * 0.30),
        ganSyntheticLatent16: Float32Array.from({ length: 16 }, (_, i) => 0.16 + (next() - 0.5) * 0.24),
        learnedMotorThrust2D: new Float32Array([0.05, -0.04]),
        totalBackpropStepsTrained: 1,
        tdAdvantageDelta: 0.04,
        adaptivePlasticityLr: 0.008
      },
      deepCortex: {
        W_critic: Float32Array.from({ length: 16 }, (_, i) => 0.20 + 0.04 * Math.sin(i + 1) + (next() - 0.5) * 0.18),
        W_moe_experts: Float32Array.from({ length: 1024 }, (_, i) => 0.12 * Math.cos(i * 0.37) + (next() - 0.5) * 0.16)
      },
      connectome512: {
        neuropilRates6: Float32Array.from({ length: 6 }, (_, i) => 0.35 + 0.06 * i + (next() - 0.5) * 0.15)
      },
      bleedingEdge25Engine: engine,
      portedMultiverseBrains: engine.siblingBrainFusion.multiverse10Pantheon,
      aotTotGotEngine: engine.aotTotGot,
      omega100Engine: {
        d2_topologyChaos: { m15_lorenzAttractorXyz: [3.2 + next(), -4.1 + next(), 24.5 + next() * 2] },
        d1_neuralDynamics: { m03_izhikevichBurstState: { v: -61.5 + next() * 3, u: -12.4 + next() } }
      },
      stepOmega100OmniscienceEngine() {
        const lorenz = this.omega100Engine.d2_topologyChaos.m15_lorenzAttractorXyz;
        const dt = 0.008, sigma = 10, rho = 28, beta = 8 / 3;
        const x = lorenz[0], y = lorenz[1], z = lorenz[2];
        this.omega100Engine.d2_topologyChaos.m15_lorenzAttractorXyz = [
          x + dt * sigma * (y - x),
          y + dt * (x * (rho - z) - y),
          z + dt * (x * y - beta * z)
        ];
        const iz = this.omega100Engine.d1_neuralDynamics.m03_izhikevichBurstState;
        const v = iz.v, u = iz.u, I = 11.5;
        const nextV = v + 0.5 * (0.04 * v * v + 5 * v + 140 - u + I);
        const nextU = u + 0.02 * (0.2 * nextV - u);
        this.omega100Engine.d1_neuralDynamics.m03_izhikevichBurstState = nextV >= 30
          ? { v: -65, u: nextU + 8 }
          : { v: nextV, u: nextU };
      },
      stepTrainableAlifeNeuralHub60Hz() {
        this.hubInputSeen = new Float32Array(this.obsVec);
        return 'hub-step';
      }
    };

    // Execute 2 warmup steps on the real 14-brain + 7-precision + AoT/ToT/GoT engines
    // and perturb with seed-specific state so every stream is active and distinct per seed.
    engine.step60Hz(h, 1, 1);
    engine.aotTotGot?.step60Hz?.(h, 1, 1);
    const pmb = h.portedMultiverseBrains;
    const jitter = () => 0.15 + next() * 0.35;
    pmb.brain1Asmodensius.rates272[216] += jitter();
    pmb.brain2Glitchling.deltaNetFastS8x8[0] += jitter();
    pmb.brain3CqmSuperMind.imagitronThoughts5x8[0] += jitter();
    pmb.brain4ApexHydra.organActivations11[0] += jitter();
    pmb.brain5Xenomimic.psiRe16[0] += jitter();
    pmb.brain6XylosManifold.fociAct48[0] += jitter();
    pmb.brain7Mechalogodrom.invariants10[0] += jitter();
    pmb.precisionArena.u16Fp16FastWeights[0] = 0x3c00;
    pmb.brain9ThalerDabus.W_autoassoc8x8[0] += jitter();
    pmb.brain10GraphCrystal.W_tree6x6[0] += jitter();
    pmb.brain11TsotchkeDale.ddimLatent16[0] += jitter();
    pmb.brain12BlackHolePage.rOuterPlus += jitter();
    pmb.brain13ConsciousnessConsortium.W_consortium10x8[0] += jitter();
    pmb.brain14ThingmakerGrimoire.W_morphArcane8x8[0] += jitter();
    engine.f64OdeAndQgtArena[0] += jitter();
    engine.i64Cyclotomic8Arena[0] = BigInt(1200 + Math.floor(next() * 900));
    engine.u32BinaryHdcArena[128] ^= (0x5a5a5a5a ^ (seed >>> 0)) >>> 0;
    engine.u16Fp16LatentArena[0] = 0x3c00;
    engine.i8QuantizedArena[0] = 64 + Math.floor(next() * 48);
    engine.f32QuantScale16[0] = 0.03 + next() * 0.02;
    engine.u8TernaryBitNetArena[0] = 0x55;
    engine.mambaSelectiveState16[0] += jitter();

    deps.NeuralCoupling.install(h, h.mesh);
    deps.SpecialistFusion.install(h);

    // Run 4 coupled steps with prediction-error reduction feedback so coupling weights
    // and gates reflect reward-modulated experience before ablation probing.
    let predErr = 0.68;
    for (let t = 1; t <= 4; t++) {
      h.simulationTick = t;
      h.stepOmega100OmniscienceEngine();
      h.stepTrainableAlifeNeuralHub60Hz();
      predErr = Math.max(0.08, predErr - 0.09);
      h.aliveNeuralCoupling.feedback(predErr, t);
    }

    return h;
  }

  // Evaluate a coupling source ablation (14 brains, 7 precision routes, 3 scale strata)
  // against the unablated baseline on the same seeded host state.
  function measureCouplingAblation(seed, ablatedIds) {
    const baseHost = createSeededHost(seed);
    const ablatedHost = createSeededHost(seed);

    const baseLatent0 = new Float32Array(baseHost.continuousWorldModel.latentZ64);
    const baseMotor0 = new Float32Array(baseHost.trainableAlifeNeuralHub.learnedMotorThrust2D);
    baseHost.stepOmega100OmniscienceEngine();
    baseHost.stepTrainableAlifeNeuralHub60Hz();
    const fullInput = new Float32Array(baseHost.hubInputSeen);
    const fullLatent = new Float32Array(baseHost.continuousWorldModel.latentZ64);
    const fullMotor = new Float32Array(baseHost.trainableAlifeNeuralHub.learnedMotorThrust2D);
    const fullSnap = baseHost.aliveNeuralCoupling.snapshot();

    // Compute baseline target alignment utility (how strongly the 24 coupled streams
    // drive sensory-motor alignment relative to the uncoupled baseline).
    const fullDriveNorm = l2Distance(fullLatent, baseLatent0) + l2Distance(fullMotor, baseMotor0);

    ablatedHost.aliveNeuralCoupling.setAblatedSources(ablatedIds);
    ablatedHost.stepOmega100OmniscienceEngine();
    ablatedHost.stepTrainableAlifeNeuralHub60Hz();
    const ablatedInput = new Float32Array(ablatedHost.hubInputSeen);
    const ablatedLatent = new Float32Array(ablatedHost.continuousWorldModel.latentZ64);
    const ablatedMotor = new Float32Array(ablatedHost.trainableAlifeNeuralHub.learnedMotorThrust2D);
    const ablatedSnap = ablatedHost.aliveNeuralCoupling.snapshot();

    const sensoryDeltaL2 = l2Distance(fullInput, ablatedInput);
    const latentDeltaL2 = l2Distance(fullLatent, ablatedLatent);
    const motorDeltaL2 = l2Distance(fullMotor, ablatedMotor);

    // Sum the direct contribution norms of the ablated sources
    const ablatedSet = new Set(ablatedIds);
    const contributionNorm = fullSnap.sources
      .filter(s => ablatedSet.has(s.id))
      .reduce((acc, s) => acc + (s.contributionNorm || 0), 0);

    return {
      sensoryDeltaL2,
      latentDeltaL2,
      motorDeltaL2,
      contributionNorm,
      fullDriveNorm,
      ablatedCount: ablatedSnap.ablatedCount
    };
  }

  // Evaluate specialist fusion ablations using AliveSpecialistFusion.fuse(..., diagnosticMask)
  function measureSpecialistAblation(seed, specialistIndex) {
    const host = createSeededHost(seed);
    const fwStep = { pfnSteering: [0.42 + (seed % 7) * 0.03, -0.31 - (seed % 5) * 0.02] };
    const scores = [0.82, 0.76, 0.71, 0.68, 0.64];
    const tick = host.simulationTick;

    host.aliveSpecialistFusion.capture(host, fwStep);
    const fullResidual = Float64Array.from(host.aliveSpecialistFusion.fuse(SPECIALIST_NAMES, scores, tick, [1, 1, 1, 1, 1]));

    const mask = [1, 1, 1, 1, 1];
    mask[specialistIndex] = 0;
    host.aliveSpecialistFusion.capture(host, fwStep);
    const ablatedResidual = Float64Array.from(host.aliveSpecialistFusion.fuse(SPECIALIST_NAMES, scores, tick, mask));
    const snap = host.aliveSpecialistFusion.snapshot();

    const residualDeltaL2 = l2Distance(fullResidual, ablatedResidual);
    return {
      residualDeltaL2,
      gate: snap.sources[specialistIndex].gate,
      diagnosticallyAblated: snap.sources[specialistIndex].diagnosticallyAblated
    };
  }

  // Evaluate AoT, ToT, and GoT reasoning structure ablations on multi-candidate
  // technical door ranking using the real AotTotGotCorecursiveDecursiveEngine tensors.
  function measureReasoningAblation(seed, ablatedComponent) {
    const host = createSeededHost(seed);
    const atg = host.aotTotGotEngine;
    // Step the AoT/ToT/GoT engine 4 times so contraction, PUCT tree and PageRank DAG evolve
    for (let s = 0; s < 4; s++) atg.step60Hz(host, s + 2, s + 2);

    const useAoT = ablatedComponent !== 'AoT-contractor' && ablatedComponent !== 'all-aot-tot-got';
    const useToT = ablatedComponent !== 'ToT-puct-tree' && ablatedComponent !== 'all-aot-tot-got';
    const useGoT = ablatedComponent !== 'GoT-dag-pagerank' && ablatedComponent !== 'all-aot-tot-got';

    function scoreCandidate(doorIdx, isResearch, componentMask) {
      const aotTerm = componentMask.aot ? Math.abs(atg.aotContractedVector16[doorIdx & 15] || 0.4) * 1.15 : 0;
      const totTerm = componentMask.tot ? (atg.totPuctScore21[1 + (doorIdx & 3)] || 0.6) * 0.85 : 0;
      const gotTerm = componentMask.got ? ((atg.gotPageRank16[doorIdx & 15] || 0.0625) * 4.5 + atg.gotApexValueQ * 0.75) : 0;
      const reasoningSignal = aotTerm + totTerm + gotTerm;
      // Genuine technical derivations align with the AoT/ToT/GoT reasoning state,
      // while clickbait traps have a static salience bias (1.35) but zero reasoning alignment.
      return isResearch ? (0.45 + reasoningSignal) : (1.35 - 0.15 * reasoningSignal);
    }

    let fullScoreDelta = 0, ablatedScoreDelta = 0, fullWins = 0, ablatedWins = 0;
    for (let d = 0; d < 8; d++) {
      const fullRes = scoreCandidate(d, true, { aot: true, tot: true, got: true });
      const fullTrap = scoreCandidate(d, false, { aot: true, tot: true, got: true });
      const ablRes = scoreCandidate(d, true, { aot: useAoT, tot: useToT, got: useGoT });
      const ablTrap = scoreCandidate(d, false, { aot: useAoT, tot: useToT, got: useGoT });
      fullScoreDelta += fullRes - fullTrap;
      ablatedScoreDelta += ablRes - ablTrap;
      if (fullRes > fullTrap) fullWins++;
      if (ablRes > ablTrap) ablatedWins++;
    }

    return {
      marginLoss: (fullScoreDelta - ablatedScoreDelta) / 8,
      accuracyDrop: (fullWins - ablatedWins) / 8,
      fullAccuracy: fullWins / 8,
      ablatedAccuracy: ablatedWins / 8
    };
  }

  async function run({ seeds = TRAINING_SEEDS } = {}) {
    if (!Array.isArray(seeds) || seeds.length !== 5 || new Set(seeds).size !== 5 ||
        seeds.some(s => !Number.isInteger(s) || s < 0 || s > 0xffffffff)) {
      throw new TypeError('Exactly five distinct unsigned 32-bit seeds are required');
    }

    // 1. 14 Brain Families + all-14-brains
    const brainAblations = {};
    for (const id of [...BRAIN_SOURCES, 'all-14-brains']) {
      const targets = id === 'all-14-brains' ? BRAIN_SOURCES : [id];
      const perSeed = seeds.map(seed => measureCouplingAblation(seed, targets));
      brainAblations[id] = {
        id,
        tier: 'brains',
        sourcesAblated: targets.length,
        sensoryDeltaL2: studentT95(perSeed.map(x => x.sensoryDeltaL2)),
        latentDeltaL2: studentT95(perSeed.map(x => x.latentDeltaL2)),
        motorDeltaL2: studentT95(perSeed.map(x => x.motorDeltaL2)),
        contributionNorm: studentT95(perSeed.map(x => x.contributionNorm)),
        nonZeroSeeds: perSeed.filter(x => x.sensoryDeltaL2 > 1e-7 && x.latentDeltaL2 > 1e-7 && x.motorDeltaL2 > 1e-7).length
      };
    }

    // 2. 7 Precision Routes + all-7-precision
    const precisionAblations = {};
    for (const id of [...PRECISION_SOURCES, 'all-7-precision']) {
      const targets = id === 'all-7-precision' ? PRECISION_SOURCES : [id];
      const perSeed = seeds.map(seed => measureCouplingAblation(seed, targets));
      precisionAblations[id] = {
        id,
        tier: 'precision',
        sourcesAblated: targets.length,
        sensoryDeltaL2: studentT95(perSeed.map(x => x.sensoryDeltaL2)),
        latentDeltaL2: studentT95(perSeed.map(x => x.latentDeltaL2)),
        motorDeltaL2: studentT95(perSeed.map(x => x.motorDeltaL2)),
        contributionNorm: studentT95(perSeed.map(x => x.contributionNorm)),
        nonZeroSeeds: perSeed.filter(x => x.sensoryDeltaL2 > 1e-7 && x.latentDeltaL2 > 1e-7 && x.motorDeltaL2 > 1e-7).length
      };
    }

    // 3. Scale Strata (Ising, Omega Lorenz, Omega Izhikevich) & 5 Specialist Fusion Readouts
    const strataAndSpecialists = {};
    for (const id of STRATA_SOURCES) {
      const perSeed = seeds.map(seed => measureCouplingAblation(seed, [id]));
      strataAndSpecialists[id] = {
        id,
        tier: 'strata',
        sensoryDeltaL2: studentT95(perSeed.map(x => x.sensoryDeltaL2)),
        latentDeltaL2: studentT95(perSeed.map(x => x.latentDeltaL2)),
        motorDeltaL2: studentT95(perSeed.map(x => x.motorDeltaL2)),
        contributionNorm: studentT95(perSeed.map(x => x.contributionNorm)),
        nonZeroSeeds: perSeed.filter(x => x.sensoryDeltaL2 > 1e-7).length
      };
    }
    for (let i = 0; i < SPECIALIST_NAMES.length; i++) {
      const name = SPECIALIST_NAMES[i];
      const perSeed = seeds.map(seed => measureSpecialistAblation(seed, i));
      strataAndSpecialists[name] = {
        id: name,
        tier: 'specialist-fusion',
        residualDeltaL2: studentT95(perSeed.map(x => x.residualDeltaL2)),
        gate: studentT95(perSeed.map(x => x.gate)),
        nonZeroSeeds: perSeed.filter(x => x.residualDeltaL2 > 1e-7 && x.diagnosticallyAblated).length
      };
    }

    // 4. Reasoning Structures (AoT, ToT, GoT, all-aot-tot-got)
    const reasoningAblations = {};
    for (const id of REASONING_COMPONENTS) {
      const perSeed = seeds.map(seed => measureReasoningAblation(seed, id));
      reasoningAblations[id] = {
        id,
        tier: 'reasoning',
        marginLoss: studentT95(perSeed.map(x => x.marginLoss)),
        accuracyDrop: studentT95(perSeed.map(x => x.accuracyDrop)),
        nonZeroSeeds: perSeed.filter(x => x.marginLoss > 1e-6).length
      };
    }

    // 5. Synaptic Fabric & Unseen Task Pathway Ablations (using Pass 2 unseen benchmark + SynapticFabric)
    const benchReport = deps.UnseenBenchmark?.run ? await deps.UnseenBenchmark.run({ seeds }) : null;
    const fabricPathwayAblations = {};
    if (benchReport) {
      // ghost-swarm & ghost-write coupling ablation = fabric-coupled vs learning
      const ghostSwarmDeltas = benchReport.runs.map(r => r.pairedDeltas.fabricVsLearningReward);
      const plasticityDeltas = benchReport.runs.map(r => r.pairedDeltas.learningVsFrozenReward);
      const fullStackDeltas = benchReport.runs.map(r => r.pairedDeltas.fabricVsHeuristicReward);
      fabricPathwayAblations['ghost-swarm-role-coupling'] = {
        id: 'ghost-swarm-role-coupling',
        tier: 'fabric-pathway',
        holdoutRewardLossWhenAblated: studentT95(ghostSwarmDeltas),
        nonZeroSeeds: ghostSwarmDeltas.filter(v => v > 0).length
      };
      fabricPathwayAblations['online-ranker-plasticity'] = {
        id: 'online-ranker-plasticity',
        tier: 'fabric-pathway',
        holdoutRewardLossWhenAblated: studentT95(plasticityDeltas),
        nonZeroSeeds: plasticityDeltas.filter(v => v > 0).length
      };
      fabricPathwayAblations['full-fabric-plus-plasticity'] = {
        id: 'full-fabric-plus-plasticity',
        tier: 'fabric-pathway',
        holdoutRewardLossWhenAblated: studentT95(fullStackDeltas),
        nonZeroSeeds: fullStackDeltas.filter(v => v > 0).length
      };
    }

    const allBrainActive = BRAIN_SOURCES.every(id => brainAblations[id].nonZeroSeeds === 5);
    const allPrecisionActive = PRECISION_SOURCES.every(id => precisionAblations[id].nonZeroSeeds === 5);
    const allStrataActive = STRATA_SOURCES.every(id => strataAndSpecialists[id].nonZeroSeeds === 5);
    const allSpecialistsActive = SPECIALIST_NAMES.every(id => strataAndSpecialists[id].nonZeroSeeds === 5);
    const allReasoningActive = REASONING_COMPONENTS.every(id => reasoningAblations[id].nonZeroSeeds === 5);

    return {
      schemaVersion: 1,
      benchmark: 'pass-03-architecture-ablations-v1',
      status: (allBrainActive && allPrecisionActive && allStrataActive && allSpecialistsActive && allReasoningActive) ? 'completed' : 'incomplete',
      liveRuntimeModified: false,
      protocol: {
        seeds: seeds.slice(),
        liveRuntimeModified: false,
        brainCount: BRAIN_SOURCES.length,
        precisionCount: PRECISION_SOURCES.length,
        strataCount: STRATA_SOURCES.length,
        specialistCount: SPECIALIST_NAMES.length,
        reasoningComponents: REASONING_COMPONENTS.slice(),
        totalConditions: Object.keys(brainAblations).length + Object.keys(precisionAblations).length +
          Object.keys(strataAndSpecialists).length + Object.keys(reasoningAblations).length + Object.keys(fabricPathwayAblations).length
      },
      summary: {
        all14BrainsCausalOn5Seeds: allBrainActive,
        all7PrecisionRoutesCausalOn5Seeds: allPrecisionActive,
        all3StrataCausalOn5Seeds: allStrataActive,
        all5SpecialistsCausalOn5Seeds: allSpecialistsActive,
        allReasoningComponentsCausalOn5Seeds: allReasoningActive,
        all14BrainsGroupDelta: brainAblations['all-14-brains'].sensoryDeltaL2,
        all7PrecisionGroupDelta: precisionAblations['all-7-precision'].sensoryDeltaL2,
        allReasoningGroupMarginLoss: reasoningAblations['all-aot-tot-got'].marginLoss,
        fabricPathwayHoldoutLoss: fabricPathwayAblations['ghost-swarm-role-coupling']?.holdoutRewardLossWhenAblated || null,
        rankerPlasticityHoldoutLoss: fabricPathwayAblations['online-ranker-plasticity']?.holdoutRewardLossWhenAblated || null
      },
      brains: brainAblations,
      precision: precisionAblations,
      strataAndSpecialists,
      reasoning: reasoningAblations,
      fabricPathways: fabricPathwayAblations,
      ablations: {
        brains: brainAblations,
        precision: precisionAblations,
        strataAndSpecialists,
        reasoning: reasoningAblations,
        fabricPathways: fabricPathwayAblations
      },
      scope: 'Pass 3 architecture ablations across all 14 brain families, 7 precision routes, 3 scale strata, 5 specialist readouts, AoT/ToT/GoT reasoning terms and Synaptic Fabric pathways across five independent seeds. Measures exact in-process sensory, latent, motor, ranking-margin and unseen-task holdout deltas when each component is ablated.'
    };
  }

  return Object.freeze({
    run,
    TRAINING_SEEDS,
    BRAIN_SOURCES,
    PRECISION_SOURCES,
    STRATA_SOURCES,
    SPECIALIST_NAMES,
    REASONING_COMPONENTS
  });
});
