/* Pass 4: Complete declared optimizer, recurrent, replay, RNG, curriculum (Stages A-F + viscera)
 * and Synaptic Fabric state contracts; split-horizon restart equivalence and leave-one-domain-out
 * necessity verification across five independent seeds ([19013, 29017, 39023, 49031, 59053]).
 *
 * Uses production modules (BleedEdge25AlifeEngine, AlivePrimaryPolicyState, AliveReplayState,
 * AliveNeuralCoupling, AliveSpecialistFusion, AliveResearchPolicy, AliveSynapticFabric) in
 * isolated creature instances without mutating live browser state.
 */
(function (root, factory) {
  const deps = typeof module === 'object' && module.exports
    ? {
        nodeCrypto: require('node:crypto'),
        BleedEdge: require('./alife-25-bleeding-edge-models.js'),
        PrimaryState: require('./alive-primary-policy-state.js'),
        ReplayState: require('./alive-replay-state.js'),
        Registry: require('./alive-learned-state-registry.js'),
        Codec: require('./alive-learned-state-codec.js'),
        NeuralCoupling: require('./alive-neural-coupling.js'),
        SpecialistFusion: require('./alive-specialist-fusion.js'),
        ResearchPolicy: require('./alive-research-policy.js'),
        SynapticFabric: require('./alive-synaptic-fabric.js')
      }
    : {
        nodeCrypto: null,
        BleedEdge: {
          BleedEdge25AlifeEngine: root?.BleedEdge25AlifeEngine
        },
        PrimaryState: root?.AlivePrimaryPolicyState,
        ReplayState: root?.AliveReplayState,
        Registry: root?.AliveLearnedStateRegistry,
        Codec: root?.AliveLearnedStateCodec,
        NeuralCoupling: root?.AliveNeuralCoupling,
        SpecialistFusion: root?.AliveSpecialistFusion,
        ResearchPolicy: root?.AliveResearchPolicy,
        SynapticFabric: root?.AliveSynapticFabric
      };
  const api = factory(deps);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveRestartEquivalence = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';

  const TRAINING_SEEDS = Object.freeze([19013, 29017, 39023, 49031, 59053]);
  const CURRICULUM_STAGES = Object.freeze(['A', 'B', 'C', 'D', 'E', 'F']);
  const CONTRACT_DOMAINS = Object.freeze([
    'optimizer',
    'recurrent',
    'replay',
    'rng',
    'curriculum',
    'synapticFabric'
  ]);
  const SPECIALIST_NAMES = Object.freeze([
    'NMDA_sLTC_Sheet', 'Dreamer_WorldModel', 'FlyWire_Connectome', 'QGTL_Grover_Q3', 'Allostatic_AgRP'
  ]);

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

  // Deterministic 64-bit SplitMix64 + XorShift128+ PRNG with serializable state
  function createDeterministicPrng(seed) {
    let s0 = (BigInt(seed >>> 0) * 0x9e3779b97f4a7c15n + 0xbf58476d1ce4e5b9n) & 0xffffffffffffffffn;
    let s1 = (s0 ^ 0x94d049bb133111ebn) & 0xffffffffffffffffn;
    if (s0 === 0n) s0 = 1n;
    if (s1 === 0n) s1 = 2n;
    let draws = 0;

    function nextU64() {
      draws++;
      let x = s0;
      const y = s1;
      s0 = y;
      x ^= (x << 23n) & 0xffffffffffffffffn;
      s1 = (x ^ y ^ (x >> 17n) ^ (y >> 26n)) & 0xffffffffffffffffn;
      return (s1 + y) & 0xffffffffffffffffn;
    }

    function nextFloat01() {
      const u = Number(nextU64() & 0x1fffffffffffffn);
      return u / 9007199254740992;
    }

    return {
      u64: nextU64,
      float01: nextFloat01,
      exportState() {
        return { s0: s0.toString(16), s1: s1.toString(16), draws };
      },
      importState(state) {
        if (!state || typeof state.s0 !== 'string' || typeof state.s1 !== 'string' || !Number.isSafeInteger(state.draws)) {
          throw new TypeError('Invalid PRNG state envelope');
        }
        s0 = BigInt('0x' + state.s0) & 0xffffffffffffffffn;
        s1 = BigInt('0x' + state.s1) & 0xffffffffffffffffn;
        draws = state.draws;
      }
    };
  }

  function cloneTyped(view) {
    if (!view || !ArrayBuffer.isView(view)) throw new TypeError('Expected TypedArray view');
    const Ctor = view.constructor;
    const copy = new Ctor(view.length);
    copy.set(view);
    return copy;
  }

  function typedToBytes(view) {
    return Array.from(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
  }

  function bytesToTyped(bytes, Ctor) {
    const u8 = Uint8Array.from(bytes);
    return new Ctor(u8.buffer, u8.byteOffset, u8.byteLength / Ctor.BYTES_PER_ELEMENT);
  }

  function copyBytesIntoView(bytes, targetView) {
    const u8 = new Uint8Array(targetView.buffer, targetView.byteOffset, targetView.byteLength);
    if (bytes.length !== u8.length) throw new TypeError(`Byte length mismatch: expected ${u8.length}, got ${bytes.length}`);
    for (let i = 0; i < u8.length; i++) u8[i] = bytes[i];
  }

  // Recursively capture all deterministic numerical state (TypedArrays, ArrayBuffers,
  // primitive scalars, and plain arrays) inside a bounded object subtree.
  function captureSubtree(node, depth = 0, seen = new WeakSet()) {
    if (depth > 8) return undefined;
    if (node === null || node === undefined) return node;
    if (typeof node === 'number' || typeof node === 'boolean' || typeof node === 'string') return node;
    if (typeof node === 'bigint') return { __bigint: node.toString() };
    if (typeof node !== 'object') return undefined;
    if (seen.has(node)) return undefined;
    if (node instanceof ArrayBuffer) {
      return { __ab: Array.from(new Uint8Array(node)) };
    }
    if (ArrayBuffer.isView(node)) {
      return { __ta: typedToBytes(node) };
    }
    seen.add(node);
    if (Array.isArray(node)) {
      return node.slice(0, 64).map(item => captureSubtree(item, depth + 1, seen));
    }
    const out = {};
    for (const key of Object.keys(node)) {
      if (key === 'cqmWasmInstance' || key === 'webaudioSonifier') continue;
      const val = captureSubtree(node[key], depth + 1, seen);
      if (val !== undefined) out[key] = val;
    }
    return out;
  }

  function restoreSubtree(target, snap, depth = 0) {
    if (depth > 8 || !snap || typeof snap !== 'object' || !target || typeof target !== 'object') return;
    if (Array.isArray(target) && Array.isArray(snap)) {
      target.length = snap.length;
      for (let i = 0; i < snap.length; i++) {
        const s = snap[i];
        if (s && typeof s === 'object' && s.__bigint !== undefined) target[i] = BigInt(s.__bigint);
        else if (typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean' || s === null) target[i] = s;
        else if (target[i] && typeof target[i] === 'object' && !ArrayBuffer.isView(target[i])) restoreSubtree(target[i], s, depth + 1);
        else if (s && typeof s === 'object') target[i] = structuredClone(s);
      }
      return;
    }
    for (const [key, s] of Object.entries(snap)) {
      const desc = Object.getOwnPropertyDescriptor(target, key);
      const cur = target[key];
      if (typeof s === 'number' || typeof s === 'boolean' || typeof s === 'string' || (s === null && (cur === null || typeof cur !== 'object'))) {
        if (desc && desc.writable) target[key] = s;
      } else if (s && typeof s === 'object' && s.__bigint !== undefined) {
        if (desc && desc.writable) target[key] = BigInt(s.__bigint);
      } else if (s && typeof s === 'object' && Array.isArray(s.__ab) && cur instanceof ArrayBuffer) {
        new Uint8Array(cur).set(s.__ab);
      } else if (s && typeof s === 'object' && Array.isArray(s.__ta) && ArrayBuffer.isView(cur)) {
        copyBytesIntoView(s.__ta, cur);
      } else if (cur === null && s && typeof s === 'object' && !s.__ab && !s.__ta && desc && desc.writable) {
        target[key] = structuredClone(s);
      } else if (cur && typeof cur === 'object' && s && typeof s === 'object') {
        restoreSubtree(cur, s, depth + 1);
      }
    }
  }

  async function sha256Hex(payload) {
    const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
    if (deps.nodeCrypto?.createHash) {
      return deps.nodeCrypto.createHash('sha256').update(text).digest('hex');
    }
    const subtle = globalThis.crypto?.subtle;
    if (subtle) {
      const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    }
    throw new Error('SHA-256 provider required');
  }

  function l2Distance(a, b) {
    let sum = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const d = Number(a[i] || 0) - Number(b[i] || 0);
      sum += d * d;
    }
    return Math.sqrt(sum);
  }

  function maxAbsDiff(a, b) {
    let m = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const d = Math.abs(Number(a[i] || 0) - Number(b[i] || 0));
      if (d > m) m = d;
    }
    return m;
  }

  // Construct an isolated, full-contract creature instance with all 6 declared state domains:
  // optimizer, recurrent, replay, rng, curriculum (Stages A-F + viscera + DSD), and synapticFabric.
  function createCreature(seed) {
    const prng = createDeterministicPrng(seed);
    const Engine = deps.BleedEdge?.BleedEdge25AlifeEngine;
    if (typeof Engine !== 'function') throw new Error('BleedEdge25AlifeEngine required');
    const engine = new Engine();

    // Primary policy 6 tensors (exact contract matching AlivePrimaryPolicyState)
    const W_actor = Float32Array.from({ length: 80 }, (_, i) => 0.14 * Math.cos((i + 1) * 0.31));
    const W_metamorph = Float32Array.from({ length: 30 }, (_, i) => 0.11 * Math.sin((i + 1) * 0.47));
    const W_critic = Float32Array.from({ length: 16 }, (_, i) => 0.18 * Math.cos((i + 1) * 0.23));
    const W_world = Float32Array.from({ length: 256 }, (_, i) => ((i % 17 === 0) ? 0.22 : 0.04 * Math.sin(i * 0.19)));
    const W_actor_frozen = cloneTyped(W_actor);
    const W_world_frozen = cloneTyped(W_world);

    // Hub mixed arena (8192 bytes) with Adam first/second moments + trajectory history
    const mixedArenaBuffer = new ArrayBuffer(8192);
    const f64TrajectoryCurr16 = new Float64Array(mixedArenaBuffer, 0, 16);
    const f64TrajectoryPrev16 = new Float64Array(mixedArenaBuffer, 128, 16);
    const f64TrajectoryPrev2_16 = new Float64Array(mixedArenaBuffer, 256, 16);
    const f64AdamFirstMoment64 = new Float64Array(mixedArenaBuffer, 384, 64);
    const f64AdamSecondMoment64 = new Float64Array(mixedArenaBuffer, 896, 64);
    const f64LossHistory16 = new Float64Array(mixedArenaBuffer, 1408, 16);
    const u64SpikeTrainLanes8 = new BigUint64Array(mixedArenaBuffer, 1792, 8);

    // Connectome & Cortex STDP + Hopfield recurrent memory
    const W_connectome_synapses = Float32Array.from({ length: 256 }, (_, i) => 0.08 * Math.sin((i + 1) * 0.13));
    const W_stdp_elig = new Float32Array(256);
    const hopfieldMemory = new Float32Array(128);

    const h = {
      agentId: `creature-seed-${seed}`,
      policyCid: `policy-${seed}-v1`,
      checkpointCid: `ckpt-${seed}-init`,
      simulationTick: 0,
      authorityEpoch: 1,
      D_OBS: 16,
      D_ACT: 5,
      D_MORPH: 6,
      prng,
      W_actor,
      W_metamorph,
      W_critic,
      W_world,
      W_actor_frozen,
      W_world_frozen,
      obsVec: Float32Array.from({ length: 16 }, (_, i) => 0.1 + 0.02 * i),
      predObsVec: Float32Array.from({ length: 16 }, (_, i) => 0.08 + 0.015 * i),
      trainerCommitted: {
        u: Float32Array.from({ length: 16 }, (_, i) => 0.05 * Math.cos(i + 1)),
        committedEpoch: 1,
        timeoutMs: 1200
      },
      continuousWorldModel: {
        latentZ64: Float32Array.from({ length: 64 }, (_, i) => 0.12 * Math.sin(i * 0.25 + 0.3))
      },
      trainableAlifeNeuralHub: {
        mixedArenaBuffer,
        f64TrajectoryCurr16,
        f64TrajectoryPrev16,
        f64TrajectoryPrev2_16,
        f64AdamFirstMoment64,
        f64AdamSecondMoment64,
        f64LossHistory16,
        u64SpikeTrainLanes8,
        zPerc16: Float32Array.from({ length: 16 }, (_, i) => 0.20 - 0.01 * i),
        zPrev16: new Float32Array(16),
        zPrevPrev16: new Float32Array(16),
        hDyn16: Float32Array.from({ length: 16 }, (_, i) => 0.06 * Math.cos(i * 0.4)),
        hDiff16: Float32Array.from({ length: 16 }, (_, i) => 0.05 * Math.sin(i * 0.3)),
        hGen16: Float32Array.from({ length: 16 }, (_, i) => 0.04 * Math.cos(i * 0.5)),
        samSpatialAffordance16: Float32Array.from({ length: 16 }, (_, i) => 0.15 + 0.01 * i),
        diffusedIdeaVec16: Float32Array.from({ length: 16 }, (_, i) => 0.12 + 0.01 * i),
        ganSyntheticLatent16: Float32Array.from({ length: 16 }, (_, i) => 0.10 + 0.01 * i),
        learnedMotorThrust2D: new Float32Array([0.04, -0.03]),
        adaptivePlasticityLr: 0.008,
        tdAdvantageDelta: 0.02,
        worldDynamicsLossMse: 0.04,
        icmCuriosityReward: 0.45,
        spatialExplorationCoveragePct: 68.0,
        totalBackpropStepsTrained: 0,
        dreamConsolidationSteps: 0,
        replayRing32: [],
        replayWritePtr: 0
      },
      deepCortex: {
        W_actor,
        W_critic,
        W_connectome_synapses,
        W_stdp_elig,
        hopfieldMemory,
        hopfieldWritePtr: 0,
        W_moe_experts: Float32Array.from({ length: 1024 }, (_, i) => 0.11 * Math.cos(i * 0.29))
      },
      connectome512: {
        synWeights262K: W_connectome_synapses,
        synapticWeights: W_connectome_synapses,
        eligibilityTraces: W_stdp_elig,
        neuropilRates6: Float32Array.from([0.42, 0.48, 0.51, 0.39, 0.45, 0.53])
      },
      curriculum: {
        stageIndex: 0,
        stageId: 'A',
        stageProgress: 0.0,
        stageMasteryScores6: Float32Array.from([0.1, 0, 0, 0, 0, 0]),
        episodesInStage: 0,
        totalTransitions: 0
      },
      mesh: {
        ising56: Int8Array.from({ length: 56 }, (_, i) => (i & 1) ? 1 : -1),
        nm: { DA: 0.50, ACh: 0.48, NE: 0.45, S5: 0.46 },
        viscera: { glc: 0.65, atp: 0.85, cortisol: 0.22, oxytocin: 0.54, adenosine: 0.18, melatonin: 0.12 },
        iitPhi: 0.52,
        entanglementBits: 0.48
      },
      decursiveSelfDeduplicator: {
        banishedBasis8x64: Float32Array.from({ length: 512 }, (_, i) => 0.02 * Math.sin(i * 0.17)),
        writePtr: 0,
        deflationCount: 0
      },
      bleedingEdge25Engine: engine,
      portedMultiverseBrains: engine.siblingBrainFusion.multiverse10Pantheon,
      aotTotGotEngine: engine.aotTotGot,
      omega100Engine: {
        d2_topologyChaos: { m15_lorenzAttractorXyz: [3.1, -4.0, 24.2] },
        d1_neuralDynamics: { m03_izhikevichBurstState: { v: -62.0, u: -12.4 } }
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

    deps.NeuralCoupling.install(h, h.mesh);
    deps.SpecialistFusion.install(h);

    let clockMs = 100000;
    const researchPolicy = deps.ResearchPolicy.create({ now: () => clockMs });
    const fabricJobs = new Map([
      ['ghost-swarm', { id: 'ghost-swarm', label: 'Ghost Swarm', intervalMs: 4000, nextDueAt: clockMs + 4000, lastStartedAt: 0, status: 'idle', manualOnly: false, consecutiveErrors: 0, adapter: { run: () => {} } }],
      ['reasoning', { id: 'reasoning', label: 'AoT/ToT/GoT', intervalMs: 4000, nextDueAt: clockMs + 4000, lastStartedAt: 0, status: 'idle', manualOnly: false, consecutiveErrors: 0, adapter: { run: () => {} } }],
      ['ghost-write', { id: 'ghost-write', label: 'Ghost Write', intervalMs: 4000, nextDueAt: clockMs + 4000, lastStartedAt: 0, status: 'idle', manualOnly: false, consecutiveErrors: 0, adapter: { run: () => {} } }],
      ['memory', { id: 'memory', label: 'Memory 4-Tier', intervalMs: 4000, nextDueAt: clockMs + 4000, lastStartedAt: 0, status: 'idle', manualOnly: false, consecutiveErrors: 0, adapter: { run: () => {} } }]
    ]);
    const fabricController = {
      running: true,
      suspended: false,
      generation: 1,
      inFlight: new Map(),
      jobs: fabricJobs,
      ownsEvent: () => true,
      clock: () => clockMs
    };
    const fabric = new deps.SynapticFabric.SynapticFabric({ controller: fabricController, clock: () => clockMs });
    h.researchPolicy = researchPolicy;
    h.fabric = fabric;
    h.fabricController = fabricController;
    h.advanceClock = deltaMs => { clockMs += deltaMs; return clockMs; };
    h.getClock = () => clockMs;
    h.setClock = nextMs => { clockMs = nextMs; };

    return h;
  }

  // Advance one complete, deterministic creature lifecycle step touching all 6 state domains:
  // 1. PRNG draw -> sensory stimulus & Ising spin flip
  // 2. BleedEdge25AlifeEngine (14 brains + 7 precision routes) + AoT/ToT/GoT + Omega Lorenz/Izhikevich
  // 3. AliveNeuralCoupling & AliveSpecialistFusion + Hub Adam optimizer moment update + recurrent state
  // 4. Dense experience replay write & highest-surprise prioritized replay sample
  // 5. Connectome STDP trace + Hopfield memory write + Curriculum stage A-F & Viscera update
  // 6. ResearchPolicy 16x12x1 ranker update + SynapticFabric Hebbian edge plasticity
  function stepCreature(h, stepIndex) {
    h.simulationTick++;
    h.advanceClock(1000);
    const tick = h.simulationTick;
    const hub = h.trainableAlifeNeuralHub;
    const dc = h.deepCortex;
    const cur = h.curriculum;

    // 1. Deterministic PRNG draws drive exogenous observation & Ising spin transitions
    const r0 = h.prng.float01();
    const r1 = h.prng.float01();
    const spinIdx = Math.floor(r0 * h.mesh.ising56.length) % h.mesh.ising56.length;
    h.mesh.ising56[spinIdx] = r1 > 0.5 ? 1 : -1;
    for (let i = 0; i < 16; i++) {
      const draw = h.prng.float01() - 0.5;
      h.obsVec[i] = Math.tanh(h.obsVec[i] * 0.82 + 0.18 * draw + 0.04 * cur.stageIndex);
    }

    // 2. Step 14 brains, 7 precision routes, AoT/ToT/GoT, and Omega Lorenz/Izhikevich
    h.bleedingEdge25Engine.step60Hz(h, tick, tick);
    h.aotTotGotEngine.step60Hz(h, tick, tick);
    h.stepOmega100OmniscienceEngine();
    h.stepTrainableAlifeNeuralHub60Hz();

    // Specialist fusion readout influences recurrent latent state
    const fwStep = { pfnSteering: [0.35 + 0.1 * r0, -0.25 + 0.1 * r1] };
    h.aliveSpecialistFusion.capture(h, fwStep);
    const fused = h.aliveSpecialistFusion.fuse(SPECIALIST_NAMES, [0.81, 0.74, 0.69, 0.65, 0.61], tick);

    // 3. Recurrent trajectory shift + Adam optimizer update on W_actor, W_world, and trainerCommitted.u
    hub.zPrevPrev16.set(hub.zPrev16);
    hub.zPrev16.set(hub.zPerc16);
    hub.f64TrajectoryPrev2_16.set(hub.f64TrajectoryPrev16);
    hub.f64TrajectoryPrev16.set(hub.f64TrajectoryCurr16);

    for (let i = 0; i < 16; i++) {
      const targetObs = h.obsVec[i] + 0.08 * (fused[i] || 0) + 0.05 * h.aotTotGotEngine.aotContractedVector16[i];
      const nextZ = Math.tanh(0.65 * hub.zPerc16[i] + 0.25 * targetObs + 0.10 * hub.hDyn16[i]);
      hub.zPerc16[i] = nextZ;
      hub.hDyn16[i] = Math.tanh(0.75 * hub.hDyn16[i] + 0.25 * nextZ);
      hub.f64TrajectoryCurr16[i] = nextZ;
    }

    // Replay buffer: push dense transition record and sample highest-surprise record
    const z16Rec = cloneTyped(hub.zPrev16);
    const a8Rec = Float32Array.from({ length: 8 }, (_, i) => Math.tanh(h.W_actor[i] + hub.zPerc16[i] * 0.3));
    const zNext16Rec = cloneTyped(hub.zPerc16);
    const predErr = l2Distance(zNext16Rec, z16Rec) + 0.05 * Math.abs(r0 - 0.5);
    const slot = hub.replayWritePtr & 31;
    hub.replayRing32[slot] = { z16: z16Rec, a8: a8Rec, zNext16: zNext16Rec, surprise: Number(predErr.toFixed(6)) };
    hub.replayWritePtr = (hub.replayWritePtr + 1) & 31;

    // Sample highest-surprise replay record + surprise-weighted batch across occupied replayRing32
    let bestRec = hub.replayRing32[0];
    let batchSum = 0;
    for (let i = 0; i < hub.replayRing32.length; i++) {
      const rec = hub.replayRing32[i];
      if (rec.surprise > bestRec.surprise) bestRec = rec;
      batchSum += (rec.zNext16[i & 15] + rec.a8[i & 7]) * rec.surprise;
    }
    const replaySignal = (bestRec ? bestRec.zNext16[0] * bestRec.surprise : 0) + batchSum / Math.max(1, hub.replayRing32.length);

    // Adam optimizer moment update (beta1=0.9, beta2=0.999)
    hub.totalBackpropStepsTrained++;
    const stepT = hub.totalBackpropStepsTrained;
    const beta1 = 0.9, beta2 = 0.999, lr = hub.adaptivePlasticityLr;
    const bc1 = 1 - Math.pow(beta1, stepT);
    const bc2 = 1 - Math.pow(beta2, stepT);
    for (let i = 0; i < 64; i++) {
      const grad = 0.06 * hub.zPerc16[i & 15] + 0.04 * replaySignal + 0.02 * (h.W_actor[i] || 0);
      const m = beta1 * hub.f64AdamFirstMoment64[i] + (1 - beta1) * grad;
      const v = beta2 * hub.f64AdamSecondMoment64[i] + (1 - beta2) * grad * grad;
      hub.f64AdamFirstMoment64[i] = m;
      hub.f64AdamSecondMoment64[i] = v;
      const mHat = m / bc1;
      const vHat = v / bc2;
      const stepDelta = lr * mHat / (Math.sqrt(vHat) + 1e-8);
      h.W_actor[i] -= stepDelta;
      h.W_world[i] -= stepDelta * 0.5;
      if (i < 16) {
        h.W_critic[i] -= stepDelta * 0.35;
        h.trainerCommitted.u[i] += stepDelta * 0.25;
      }
    }
    h.trainerCommitted.committedEpoch = tick;
    hub.f64LossHistory16[tick & 15] = predErr;
    hub.u64SpikeTrainLanes8[tick & 7] = h.prng.u64();

    // Connectome STDP + Hopfield write
    for (let i = 0; i < 64; i++) {
      dc.W_stdp_elig[i] = 0.88 * dc.W_stdp_elig[i] + 0.12 * (hub.zPerc16[i & 15] * hub.zPrev16[(i + 3) & 15]);
      dc.W_connectome_synapses[i] += 0.015 * dc.W_stdp_elig[i];
    }
    const hOff = (dc.hopfieldWritePtr & 7) * 16;
    for (let i = 0; i < 16; i++) dc.hopfieldMemory[hOff + i] = hub.zPerc16[i];
    dc.hopfieldWritePtr = (dc.hopfieldWritePtr + 1) & 7;

    // DSD-24 nullspace basis update
    const dsdOff = (h.decursiveSelfDeduplicator.writePtr & 7) * 64;
    for (let i = 0; i < 16; i++) h.decursiveSelfDeduplicator.banishedBasis8x64[dsdOff + i] = hub.zPerc16[i] * 0.4;
    h.decursiveSelfDeduplicator.writePtr = (h.decursiveSelfDeduplicator.writePtr + 1) & 7;
    h.decursiveSelfDeduplicator.deflationCount++;

    // Curriculum Stages A-F progression & allostatic viscera
    cur.episodesInStage++;
    const masteryGain = 0.22 + 0.08 * Math.abs(hub.zPerc16[0]) + 0.04 * (1 / (1 + predErr));
    cur.stageProgress = Math.min(1.0, cur.stageProgress + masteryGain);
    cur.stageMasteryScores6[cur.stageIndex] = cur.stageProgress;
    if (cur.stageProgress >= 0.45 && cur.stageIndex < CURRICULUM_STAGES.length - 1) {
      cur.stageIndex++;
      cur.stageId = CURRICULUM_STAGES[cur.stageIndex];
      cur.stageProgress = 0.08;
      cur.totalTransitions++;
    }
    h.mesh.viscera.glc = Math.max(0.2, Math.min(1.0, h.mesh.viscera.glc - 0.015 + 0.02 * cur.stageProgress));
    h.mesh.viscera.atp = Math.max(0.2, Math.min(1.0, h.mesh.viscera.atp - 0.01 + 0.018 * h.mesh.viscera.glc));
    h.mesh.nm.DA = Math.max(0.1, Math.min(1.0, 0.45 + 0.15 * cur.stageProgress));

    // Neural coupling feedback
    const obsError = Math.max(0.02, 0.55 - 0.03 * tick - 0.04 * cur.stageIndex);
    h.aliveNeuralCoupling.feedback(obsError, tick);

    // Research policy candidate ranking + online training + Synaptic Fabric plasticity
    const urlGood = `https://mech-stage-${cur.stageId.toLowerCase()}-${tick}.example.org/spec`;
    const urlTrap = `https://trap-stage-${cur.stageId.toLowerCase()}-${tick}.example.org/promo`;
    h.researchPolicy.enqueue([
      { url: urlGood, text: `stage ${cur.stageId} formal invariant proof tensor`, salience: 0.66, source: 'observed-link' },
      { url: urlTrap, text: `top trending viral clickbait promo`, salience: 0.78, source: 'catalog' }
    ]);
    const choice = h.researchPolicy.choose({
      tabId: 'tab-restart-eq',
      currentUrl: `https://hub.example.org/tick-${tick}`,
      concepts: ['formal', 'invariant', 'proof', 'tensor', `stage-${cur.stageId.toLowerCase()}`],
      predictionError: obsError
    });

    // Synaptic Fabric event cycle: ghost-swarm -> reasoning -> ghost-write
    const t0 = h.getClock();
    h.fabric.handleEvent({ source: 'alive-overdrive', generation: 1, type: 'running', id: 'ghost-swarm', runId: tick, at: t0 });
    h.fabric.handleEvent({
      source: 'alive-overdrive',
      generation: 1,
      type: 'completed',
      id: 'ghost-swarm',
      runId: tick,
      at: t0 + 10,
      evidence: { tick, stageId: cur.stageId, chosenUrl: choice?.candidate?.url || '' }
    });
    h.advanceClock(20);
    const t1 = h.getClock();
    h.fabric.handleEvent({ source: 'alive-overdrive', generation: 1, type: 'running', id: 'reasoning', runId: tick, at: t1 });
    if (choice?.candidate) {
      h.researchPolicy.ingest({
        url: choice.candidate.url,
        title: `Tick ${tick} Stage ${cur.stageId}`,
        researchExcerpt: `Formal invariant proof tensor stage-${cur.stageId.toLowerCase()} derivation`,
        domMerkleRootHex: `merkle-${tick}-${cur.stageId}`,
        specimens: ['formal', 'invariant', 'proof', 'tensor', `stage-${cur.stageId.toLowerCase()}`],
        doors: []
      }, { verified: true, tabId: 'tab-restart-eq', documentStartedAt: t1, predictionProgress: 0.35 });
    }
    h.fabric.handleEvent({
      source: 'alive-overdrive',
      generation: 1,
      type: 'completed',
      id: 'reasoning',
      runId: tick,
      at: t1 + 10,
      evidence: { observations: h.researchPolicy.observations, tick }
    });

    // Compute motor output from coupled latent + actor + curriculum modulation
    hub.learnedMotorThrust2D[0] = Math.tanh(
      h.W_actor[0] * hub.zPerc16[0] +
      0.25 * h.aotTotGotEngine.aotContractedVector16[0] +
      0.15 * cur.stageIndex +
      0.20 * (h.fabric.snapshot().nodes.find(n => n.id === 'reasoning')?.utility || 0)
    );
    hub.learnedMotorThrust2D[1] = Math.tanh(
      h.W_actor[1] * hub.zPerc16[1] +
      0.25 * h.aotTotGotEngine.gotPageRank16[0] -
      0.12 * h.mesh.viscera.glc +
      0.20 * (h.researchPolicy.model.outputWeights[0] || 0)
    );

    return {
      tick,
      stageId: cur.stageId,
      motor: Array.from(hub.learnedMotorThrust2D),
      chosenUrl: choice?.candidate?.url || null,
      replayCount: hub.replayRing32.length,
      prngDraws: h.prng.exportState().draws
    };
  }

  // Capture the complete 6-domain state contract from a creature instance, plus validate
  // primary policy and replay buffer via production AlivePrimaryPolicyState and AliveReplayState.
  async function captureCreatureState(h) {
    // Validate Replay buffer structure through AliveReplayState
    if (deps.ReplayState?.create && deps.Registry && deps.Codec) {
      const cryptoProvider = deps.nodeCrypto?.webcrypto || globalThis.crypto;
      const replayAdapter = await deps.ReplayState.create({
        registry: deps.Registry,
        codec: deps.Codec,
        crypto: cryptoProvider
      });
      replayAdapter.capture(h.trainableAlifeNeuralHub, {
        creatureId: h.agentId,
        policyId: h.policyCid,
        checkpointId: h.checkpointCid,
        logicalTick: h.simulationTick,
        modelEpoch: h.authorityEpoch,
        capturedAt: '2026-11-09T08:00:00.000Z',
        resumeBoundary: 'split-horizon-restart'
      }, { generation: h.authorityEpoch || 1 });
    }

    const hub = h.trainableAlifeNeuralHub;
    const dc = h.deepCortex;
    const eng = h.bleedingEdge25Engine;
    const atg = h.aotTotGotEngine;

    const domains = {
      optimizer: {
        W_actor: typedToBytes(h.W_actor),
        W_metamorph: typedToBytes(h.W_metamorph),
        W_critic: typedToBytes(h.W_critic),
        W_world: typedToBytes(h.W_world),
        W_actor_frozen: typedToBytes(h.W_actor_frozen),
        W_world_frozen: typedToBytes(h.W_world_frozen),
        trainerU: typedToBytes(h.trainerCommitted.u),
        trainerCommittedEpoch: h.trainerCommitted.committedEpoch,
        trainerTimeoutMs: h.trainerCommitted.timeoutMs,
        f64AdamFirstMoment64: typedToBytes(hub.f64AdamFirstMoment64),
        f64AdamSecondMoment64: typedToBytes(hub.f64AdamSecondMoment64),
        f64LossHistory16: typedToBytes(hub.f64LossHistory16),
        adaptivePlasticityLr: hub.adaptivePlasticityLr,
        totalBackpropStepsTrained: hub.totalBackpropStepsTrained,
        couplingWeights: typedToBytes(h.aliveCouplingWeights),
        couplingGateLogits: typedToBytes(h.aliveCouplingGateLogits),
        couplingEligibility: typedToBytes(h.aliveCouplingEligibility),
        couplingCounters: typedToBytes(h.aliveCouplingCounters),
        researchModelBytes: Object.fromEntries(
          Object.entries(h.researchPolicy.model).map(([k, v]) => [k, typedToBytes(v)])
        )
      },
      recurrent: {
        simulationTick: h.simulationTick,
        authorityEpoch: h.authorityEpoch,
        clockMs: h.getClock(),
        obsVec: typedToBytes(h.obsVec),
        predObsVec: typedToBytes(h.predObsVec),
        latentZ64: typedToBytes(h.continuousWorldModel.latentZ64),
        zPerc16: typedToBytes(hub.zPerc16),
        zPrev16: typedToBytes(hub.zPrev16),
        zPrevPrev16: typedToBytes(hub.zPrevPrev16),
        hDyn16: typedToBytes(hub.hDyn16),
        hDiff16: typedToBytes(hub.hDiff16),
        hGen16: typedToBytes(hub.hGen16),
        f64TrajectoryCurr16: typedToBytes(hub.f64TrajectoryCurr16),
        f64TrajectoryPrev16: typedToBytes(hub.f64TrajectoryPrev16),
        f64TrajectoryPrev2_16: typedToBytes(hub.f64TrajectoryPrev2_16),
        u64SpikeTrainLanes8: typedToBytes(hub.u64SpikeTrainLanes8),
        learnedMotorThrust2D: typedToBytes(hub.learnedMotorThrust2D),
        W_connectome_synapses: typedToBytes(dc.W_connectome_synapses),
        W_stdp_elig: typedToBytes(dc.W_stdp_elig),
        hopfieldMemory: typedToBytes(dc.hopfieldMemory),
        hopfieldWritePtr: dc.hopfieldWritePtr,
        icmCuriosityReward: hub.icmCuriosityReward,
        worldDynamicsLossMse: hub.worldDynamicsLossMse,
        spatialExplorationCoveragePct: hub.spatialExplorationCoveragePct,
        tdAdvantageDelta: hub.tdAdvantageDelta,
        cqmWasmArenaSlice: eng.siblingBrainFusion?.cqmWasmInstance?.exports?.memory?.buffer
          ? Array.from(new Uint8Array(eng.siblingBrainFusion.cqmWasmInstance.exports.memory.buffer, 32768, 4096))
          : null,
        engineSubtree: captureSubtree(eng),
        omega100: {
          lorenz: h.omega100Engine.d2_topologyChaos.m15_lorenzAttractorXyz.slice(),
          izhikevich: { ...h.omega100Engine.d1_neuralDynamics.m03_izhikevichBurstState }
        }
      },
      replay: {
        replayWritePtr: hub.replayWritePtr,
        records: hub.replayRing32.map(rec => ({
          z16: typedToBytes(rec.z16),
          a8: typedToBytes(rec.a8),
          zNext16: typedToBytes(rec.zNext16),
          surprise: rec.surprise
        }))
      },
      rng: h.prng.exportState(),
      curriculum: {
        stageIndex: h.curriculum.stageIndex,
        stageId: h.curriculum.stageId,
        stageProgress: h.curriculum.stageProgress,
        stageMasteryScores6: typedToBytes(h.curriculum.stageMasteryScores6),
        episodesInStage: h.curriculum.episodesInStage,
        totalTransitions: h.curriculum.totalTransitions,
        ising56: typedToBytes(h.mesh.ising56),
        nm: { ...h.mesh.nm },
        viscera: { ...h.mesh.viscera },
        iitPhi: h.mesh.iitPhi,
        entanglementBits: h.mesh.entanglementBits,
        dsdBanishedBasis8x64: typedToBytes(h.decursiveSelfDeduplicator.banishedBasis8x64),
        dsdWritePtr: h.decursiveSelfDeduplicator.writePtr,
        dsdDeflationCount: h.decursiveSelfDeduplicator.deflationCount
      },
      synapticFabric: {
        fabricState: h.fabric.exportState(),
        fabricNodes: Array.from(h.fabric.nodes.entries()).map(([id, n]) => [id, {
          id: n.id,
          utility: n.utility,
          digest: n.digest,
          novel: n.novel,
          repeated: n.repeated,
          failures: n.failures,
          excitedCount: n.excitedCount,
          lastExcitedBy: n.lastExcitedBy,
          lastExcitedAt: n.lastExcitedAt,
          pending: Array.from(n.pending.entries()),
          cadence: n.cadence,
          lastSignal: n.lastSignal
        }]),
        fabricEdges: h.fabric.edges.map(e => ({
          key: e.key,
          weight: e.weight,
          excitations: e.excitations,
          potentiations: e.potentiations,
          depressions: e.depressions,
          lastExcitedAt: e.lastExcitedAt,
          lastDelta: e.lastDelta
        })),
        fabricTotals: { ...h.fabric.totals },
        fabricJobSchedules: Array.from(h.fabricController.jobs.entries()).map(([id, j]) => [id, {
          nextDueAt: j.nextDueAt,
          lastStartedAt: j.lastStartedAt
        }]),
        researchState: h.researchPolicy.exportState(),
        researchSelections: Array.from(h.researchPolicy.selections.entries())
      }
    };

    const domainDigests = {};
    for (const name of CONTRACT_DOMAINS) {
      domainDigests[name] = await sha256Hex(domains[name]);
    }
    const stateDigestSha256 = await sha256Hex(domainDigests);

    return {
      schemaVersion: 1,
      capturedAtTick: h.simulationTick,
      stateDigestSha256,
      domainDigests,
      domains
    };
  }

  // Restore a captured state contract into a target creature instance, optionally
  // omitting specified domains to test leave-one-domain-out causal necessity.
  function restoreCreatureState(h, envelope, { omitDomains = [] } = {}) {
    const omitted = new Set(omitDomains);
    const d = envelope.domains;
    const hub = h.trainableAlifeNeuralHub;
    const dc = h.deepCortex;
    const eng = h.bleedingEdge25Engine;
    const atg = h.aotTotGotEngine;

    // Always align tick/clock so step indices line up
    h.simulationTick = d.recurrent.simulationTick;
    h.authorityEpoch = d.recurrent.authorityEpoch;
    h.setClock(d.recurrent.clockMs);

    if (!omitted.has('optimizer')) {
      copyBytesIntoView(d.optimizer.W_actor, h.W_actor);
      copyBytesIntoView(d.optimizer.W_metamorph, h.W_metamorph);
      copyBytesIntoView(d.optimizer.W_critic, h.W_critic);
      copyBytesIntoView(d.optimizer.W_world, h.W_world);
      copyBytesIntoView(d.optimizer.W_actor_frozen, h.W_actor_frozen);
      copyBytesIntoView(d.optimizer.W_world_frozen, h.W_world_frozen);
      copyBytesIntoView(d.optimizer.trainerU, h.trainerCommitted.u);
      h.trainerCommitted.committedEpoch = d.optimizer.trainerCommittedEpoch;
      h.trainerCommitted.timeoutMs = d.optimizer.trainerTimeoutMs;
      copyBytesIntoView(d.optimizer.f64AdamFirstMoment64, hub.f64AdamFirstMoment64);
      copyBytesIntoView(d.optimizer.f64AdamSecondMoment64, hub.f64AdamSecondMoment64);
      copyBytesIntoView(d.optimizer.f64LossHistory16, hub.f64LossHistory16);
      hub.adaptivePlasticityLr = d.optimizer.adaptivePlasticityLr;
      hub.totalBackpropStepsTrained = d.optimizer.totalBackpropStepsTrained;
      copyBytesIntoView(d.optimizer.couplingWeights, h.aliveCouplingWeights);
      copyBytesIntoView(d.optimizer.couplingGateLogits, h.aliveCouplingGateLogits);
      copyBytesIntoView(d.optimizer.couplingEligibility, h.aliveCouplingEligibility);
      copyBytesIntoView(d.optimizer.couplingCounters, h.aliveCouplingCounters);
      for (const [k, bytes] of Object.entries(d.optimizer.researchModelBytes)) {
        copyBytesIntoView(bytes, h.researchPolicy.model[k]);
      }
    }

    if (!omitted.has('recurrent')) {
      copyBytesIntoView(d.recurrent.obsVec, h.obsVec);
      copyBytesIntoView(d.recurrent.predObsVec, h.predObsVec);
      copyBytesIntoView(d.recurrent.latentZ64, h.continuousWorldModel.latentZ64);
      copyBytesIntoView(d.recurrent.zPerc16, hub.zPerc16);
      copyBytesIntoView(d.recurrent.zPrev16, hub.zPrev16);
      copyBytesIntoView(d.recurrent.zPrevPrev16, hub.zPrevPrev16);
      copyBytesIntoView(d.recurrent.hDyn16, hub.hDyn16);
      copyBytesIntoView(d.recurrent.hDiff16, hub.hDiff16);
      copyBytesIntoView(d.recurrent.hGen16, hub.hGen16);
      copyBytesIntoView(d.recurrent.f64TrajectoryCurr16, hub.f64TrajectoryCurr16);
      copyBytesIntoView(d.recurrent.f64TrajectoryPrev16, hub.f64TrajectoryPrev16);
      copyBytesIntoView(d.recurrent.f64TrajectoryPrev2_16, hub.f64TrajectoryPrev2_16);
      copyBytesIntoView(d.recurrent.u64SpikeTrainLanes8, hub.u64SpikeTrainLanes8);
      copyBytesIntoView(d.recurrent.learnedMotorThrust2D, hub.learnedMotorThrust2D);
      copyBytesIntoView(d.recurrent.W_connectome_synapses, dc.W_connectome_synapses);
      copyBytesIntoView(d.recurrent.W_stdp_elig, dc.W_stdp_elig);
      copyBytesIntoView(d.recurrent.hopfieldMemory, dc.hopfieldMemory);
      dc.hopfieldWritePtr = d.recurrent.hopfieldWritePtr;
      hub.icmCuriosityReward = d.recurrent.icmCuriosityReward;
      hub.worldDynamicsLossMse = d.recurrent.worldDynamicsLossMse;
      hub.spatialExplorationCoveragePct = d.recurrent.spatialExplorationCoveragePct;
      hub.tdAdvantageDelta = d.recurrent.tdAdvantageDelta;
      if (d.recurrent.cqmWasmArenaSlice && eng.siblingBrainFusion?.cqmWasmInstance?.exports?.memory?.buffer) {
        new Uint8Array(eng.siblingBrainFusion.cqmWasmInstance.exports.memory.buffer, 32768, 4096).set(d.recurrent.cqmWasmArenaSlice);
      }
      restoreSubtree(eng, d.recurrent.engineSubtree);
      h.omega100Engine.d2_topologyChaos.m15_lorenzAttractorXyz = d.recurrent.omega100.lorenz.slice();
      h.omega100Engine.d1_neuralDynamics.m03_izhikevichBurstState = { ...d.recurrent.omega100.izhikevich };
    }

    if (!omitted.has('replay')) {
      hub.replayWritePtr = d.replay.replayWritePtr;
      hub.replayRing32 = d.replay.records.map(rec => ({
        z16: Float32Array.from(bytesToTyped(rec.z16, Float32Array)),
        a8: Float32Array.from(bytesToTyped(rec.a8, Float32Array)),
        zNext16: Float32Array.from(bytesToTyped(rec.zNext16, Float32Array)),
        surprise: rec.surprise
      }));
    }

    if (!omitted.has('rng')) {
      h.prng.importState(d.rng);
    }

    if (!omitted.has('curriculum')) {
      h.curriculum.stageIndex = d.curriculum.stageIndex;
      h.curriculum.stageId = d.curriculum.stageId;
      h.curriculum.stageProgress = d.curriculum.stageProgress;
      copyBytesIntoView(d.curriculum.stageMasteryScores6, h.curriculum.stageMasteryScores6);
      h.curriculum.episodesInStage = d.curriculum.episodesInStage;
      h.curriculum.totalTransitions = d.curriculum.totalTransitions;
      copyBytesIntoView(d.curriculum.ising56, h.mesh.ising56);
      Object.assign(h.mesh.nm, d.curriculum.nm);
      Object.assign(h.mesh.viscera, d.curriculum.viscera);
      h.mesh.iitPhi = d.curriculum.iitPhi;
      h.mesh.entanglementBits = d.curriculum.entanglementBits;
      copyBytesIntoView(d.curriculum.dsdBanishedBasis8x64, h.decursiveSelfDeduplicator.banishedBasis8x64);
      h.decursiveSelfDeduplicator.writePtr = d.curriculum.dsdWritePtr;
      h.decursiveSelfDeduplicator.deflationCount = d.curriculum.dsdDeflationCount;
    }

    if (!omitted.has('synapticFabric')) {
      h.fabric.importState(d.synapticFabric.fabricState);
      h.fabric.nodes.clear();
      for (const [id, n] of d.synapticFabric.fabricNodes) {
        h.fabric.nodes.set(id, {
          ...n,
          pending: new Map(n.pending)
        });
      }
      for (const e of d.synapticFabric.fabricEdges) {
        const edge = h.fabric.edgeByKey.get(e.key);
        if (edge) {
          edge.weight = e.weight;
          edge.excitations = e.excitations;
          edge.potentiations = e.potentiations;
          edge.depressions = e.depressions;
          edge.lastExcitedAt = e.lastExcitedAt;
          edge.lastDelta = e.lastDelta;
        }
      }
      Object.assign(h.fabric.totals, d.synapticFabric.fabricTotals);
      for (const [id, sched] of d.synapticFabric.fabricJobSchedules) {
        const job = h.fabricController.jobs.get(id);
        if (job) {
          job.nextDueAt = sched.nextDueAt;
          job.lastStartedAt = sched.lastStartedAt;
        }
      }
      h.researchPolicy.restoreState(d.synapticFabric.researchState);
      if (!omitted.has('optimizer')) {
        for (const [k, bytes] of Object.entries(d.optimizer.researchModelBytes)) {
          copyBytesIntoView(bytes, h.researchPolicy.model[k]);
        }
      }
      h.researchPolicy.selections = new Map(d.synapticFabric.researchSelections);
    }
  }

  // Extract a flat numerical state vector across all 6 domains to measure exact L2 / MaxAbs drift
  function extractCombinedTrajectoryVector(h) {
    const hub = h.trainableAlifeNeuralHub;
    const fabWeights = h.fabric.snapshot().edges.map(e => e.weight);
    return Float64Array.from([
      ...h.W_actor,
      ...h.W_critic,
      ...h.trainerCommitted.u,
      ...hub.f64AdamFirstMoment64,
      ...hub.f64AdamSecondMoment64,
      ...hub.zPerc16,
      ...hub.hDyn16,
      ...hub.learnedMotorThrust2D,
      ...h.deepCortex.W_connectome_synapses.slice(0, 32),
      ...h.aotTotGotEngine.aotContractedVector16,
      ...h.aotTotGotEngine.gotPageRank16,
      ...h.curriculum.stageMasteryScores6,
      h.curriculum.stageIndex,
      h.curriculum.stageProgress,
      h.mesh.viscera.glc,
      h.mesh.viscera.atp,
      ...h.aliveCouplingWeights.slice(0, 32),
      ...h.researchPolicy.model.outputWeights,
      ...fabWeights.slice(0, 16)
    ]);
  }

  async function runSeedEquivalence(seed, { preSteps = 6, postSteps = 6 } = {}) {
    // 1. Uninterrupted Reference Creature: runs preSteps + postSteps
    const uninterrupted = createCreature(seed);
    for (let s = 1; s <= preSteps; s++) stepCreature(uninterrupted, s);
    const checkpointEnvelope = await captureCreatureState(uninterrupted);

    const refPostMotors = [];
    for (let s = preSteps + 1; s <= preSteps + postSteps; s++) {
      const out = stepCreature(uninterrupted, s);
      refPostMotors.push(...out.motor);
    }
    const refFinalEnvelope = await captureCreatureState(uninterrupted);
    const refFinalVec = extractCombinedTrajectoryVector(uninterrupted);

    // 2. Full-Contract Restored Creature: hydrated from checkpointEnvelope into a fresh instance at t = preSteps
    const restored = createCreature(seed);
    restoreCreatureState(restored, checkpointEnvelope, { omitDomains: [] });
    const midRestoreEnvelope = await captureCreatureState(restored);
    const midDigestMatch = midRestoreEnvelope.stateDigestSha256 === checkpointEnvelope.stateDigestSha256;

    const restPostMotors = [];
    for (let s = preSteps + 1; s <= preSteps + postSteps; s++) {
      const out = stepCreature(restored, s);
      restPostMotors.push(...out.motor);
    }
    const restFinalEnvelope = await captureCreatureState(restored);
    const restFinalVec = extractCombinedTrajectoryVector(restored);

    const fullRestoreL2Drift = l2Distance(refFinalVec, restFinalVec);
    const fullRestoreMaxAbsError = maxAbsDiff(refFinalVec, restFinalVec);
    const fullRestoreMotorL2Drift = l2Distance(refPostMotors, restPostMotors);
    const finalDigestMatch = restFinalEnvelope.stateDigestSha256 === refFinalEnvelope.stateDigestSha256;

    const domainDigestMatches = {};
    for (const dom of CONTRACT_DOMAINS) {
      domainDigestMatches[dom] = restFinalEnvelope.domainDigests[dom] === refFinalEnvelope.domainDigests[dom];
    }

    // 3. Leave-One-Domain-Out Partial Restore Controls (proving every domain in the contract is causally required)
    const omittedDomainDrifts = {};
    for (const omittedDomain of CONTRACT_DOMAINS) {
      const partial = createCreature(seed);
      restoreCreatureState(partial, checkpointEnvelope, { omitDomains: [omittedDomain] });
      const partialMotors = [];
      for (let s = preSteps + 1; s <= preSteps + postSteps; s++) {
        const out = stepCreature(partial, s);
        partialMotors.push(...out.motor);
      }
      const partialFinalEnvelope = await captureCreatureState(partial);
      const partialVec = extractCombinedTrajectoryVector(partial);
      omittedDomainDrifts[omittedDomain] = {
        stateL2Drift: l2Distance(refFinalVec, partialVec),
        motorL2Drift: l2Distance(refPostMotors, partialMotors),
        digestMismatch: partialFinalEnvelope.stateDigestSha256 !== refFinalEnvelope.stateDigestSha256
      };
    }

    return {
      seed,
      preSteps,
      postSteps,
      checkpointDigestSha256: checkpointEnvelope.stateDigestSha256,
      finalReferenceDigestSha256: refFinalEnvelope.stateDigestSha256,
      finalRestoredDigestSha256: restFinalEnvelope.stateDigestSha256,
      midDigestMatch,
      finalDigestMatch,
      domainDigestMatches,
      fullRestoreL2Drift,
      fullRestoreMaxAbsError,
      fullRestoreMotorL2Drift,
      finalCurriculumStage: restored.curriculum.stageId,
      finalReplayOccupancy: restored.trainableAlifeNeuralHub.replayRing32.length,
      finalPrngDraws: restored.prng.exportState().draws,
      omittedDomainDrifts
    };
  }

  async function run({ seeds = TRAINING_SEEDS, preSteps = 6, postSteps = 6 } = {}) {
    if (!Array.isArray(seeds) || seeds.length !== 5 || new Set(seeds).size !== 5 ||
        seeds.some(s => !Number.isInteger(s) || s < 0 || s > 0xffffffff)) {
      throw new TypeError('Exactly five distinct unsigned 32-bit seeds are required');
    }

    const runs = [];
    for (const seed of seeds) {
      runs.push(await runSeedEquivalence(seed, { preSteps, postSteps }));
    }

    const exactRestoreSeeds = runs.filter(
      r => r.midDigestMatch && r.finalDigestMatch && r.fullRestoreL2Drift === 0 && r.fullRestoreMaxAbsError === 0 && r.fullRestoreMotorL2Drift === 0
    ).length;

    const domainNecessity = {};
    for (const dom of CONTRACT_DOMAINS) {
      const stateDrifts = runs.map(r => r.omittedDomainDrifts[dom].stateL2Drift);
      const motorDrifts = runs.map(r => r.omittedDomainDrifts[dom].motorL2Drift);
      const divergingSeeds = runs.filter(r => r.omittedDomainDrifts[dom].stateL2Drift > 1e-9 && r.omittedDomainDrifts[dom].digestMismatch).length;
      domainNecessity[dom] = {
        domain: dom,
        stateL2DriftWhenOmitted: studentT95(stateDrifts),
        motorL2DriftWhenOmitted: studentT95(motorDrifts),
        divergingSeeds,
        exactMatchWhenIncludedSeeds: runs.filter(r => r.domainDigestMatches[dom]).length
      };
    }

    const allDomainsNecessaryOn5Seeds = CONTRACT_DOMAINS.every(dom => domainNecessity[dom].divergingSeeds === 5);

    return {
      schemaVersion: 1,
      benchmark: 'pass-04-state-contracts-restart-equivalence-v1',
      status: (exactRestoreSeeds === 5 && allDomainsNecessaryOn5Seeds) ? 'completed' : 'incomplete',
      liveRuntimeModified: false,
      protocol: {
        seeds: seeds.slice(),
        preSteps,
        postSteps,
        totalSteps: preSteps + postSteps,
        contractDomains: CONTRACT_DOMAINS.slice(),
        curriculumStages: CURRICULUM_STAGES.slice(),
        liveRuntimeModified: false
      },
      summary: {
        exactRestartEquivalenceSeeds: exactRestoreSeeds,
        all6DomainsNecessaryOn5Seeds: allDomainsNecessaryOn5Seeds,
        fullRestoreStateL2Drift: studentT95(runs.map(r => r.fullRestoreL2Drift)),
        fullRestoreMaxAbsError: studentT95(runs.map(r => r.fullRestoreMaxAbsError)),
        fullRestoreMotorL2Drift: studentT95(runs.map(r => r.fullRestoreMotorL2Drift)),
        domainNecessity
      },
      runs,
      scope: 'Pass 4 split-horizon restart equivalence across optimizer moments, recurrent neural/connectome/AoT-ToT-GoT states, dense replay ring, deterministic 64-bit PRNG, curriculum stages A-F + viscera, and Synaptic Fabric across five independent seeds. Verifies zero post-restore drift when all six domains are restored and non-zero divergence when any single domain is omitted.'
    };
  }

  return Object.freeze({
    run,
    createCreature,
    stepCreature,
    captureCreatureState,
    restoreCreatureState,
    TRAINING_SEEDS,
    CONTRACT_DOMAINS,
    CURRICULUM_STAGES
  });
});
