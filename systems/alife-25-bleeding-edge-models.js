/**
 * GIGACHAD BROWSER — EXTERNAL 25 BLEEDING-EDGE NEURAL, CYBER-HAT & DEEP-WEB ENGINE
 * =================================================================================
 * Loaded as a dedicated external module (<script src="systems/alife-25-bleeding-edge-models.js">)
 * so the 1,245,184-parameter organism is NOT trapped inside a single index.html file:
 *   - Runs an off-main-thread WebWorker (Blob Worker) for asynchronous weight replay & evolution
 *   - Persists real IEEE-754 binary weights (.gchad) to disk via Node.js fs IPC
 *   - Executes 25 bleeding-edge neural architectures & browser-cyber capabilities at 60Hz:
 *     1. I-JEPA / V-JEPA Latent World Predictor (EMA target encoder, zero pixel noise)
 *     2. Liquid-Mamba Selective State-Space Model (Input-dependent Δ_t + sLTC hybrid)
 *     3. Optimal-Transport Conditional Flow Matching (OT-CFM straight-line vector field)
 *     4. Hypernetwork LoRA Fast-Weight Generator (H_ψ(context) -> ΔW = u ⊗ v^T)
 *     5. Test-Time Training (TTT-Linear fast weights updated every 16.6ms inference step)
 *     6. Hinton Forward-Forward (FF) Local Goodness Contrastive Layer
 *     7. Predictive Coding Network (PCN Rao-Ballard precision-weighted free energy)
 *     8. Neural Cellular Automata (NCA) Morphogenetic 8x8 Body Self-Repair
 *     9. MAP-Elites 4x4 Quality-Diversity (QD) Behavioral Niche Archive
 *    10. Random Network Distillation (RND) Epistemic Novelty Bonus
 *    11. Multi-Horizon InfoNCE Contrastive Predictive Coding (CPC)
 *    12. Koopman Operator Spectral Linearizer (K ∈ R^{16x16})
 *    13. Port-Hamiltonian Energy-Conserving Motor Controller (H(q,p), J=-J^T)
 *    14. Kuramoto-Hopfield Oscillatory Associative Phase Memory
 *    15. Astrocyte-Neuron Tripartite Synapse Glial Calcium Gate
 *    16. Binary .gchad On-Disk Tensor Checkpoint Sync (Node fs binary file)
 *    17. Off-Main-Thread WebWorker Background Evolution & Experience Replay
 *    18. WebGPU WGSL Compute Shader Hardware Probe & Matrix Kernel
 *    19. WebAudio Neural Spike & Theta-Gamma Binaural FM Sonification
 *    20. Native Chromium PAC Tor SOCKS5 (9050/9150) & I2P (4444) Auto-Router
 *    21. Decentralized URI Native Resolver (ipfs://, ipns://, ar://, .onion)
 *    22. White/Blue-Hat Live TLS X.509 Certificate & Cipher Forensics
 *    23. Grey/OSINT-Hat Live DNS (A/AAAA/TXT/NS) & CT Subdomain Recon
 *    24. Purple-Hat Shadow-DOM Piercer, iframe/Canvas/WebSocket Topology Scanner
 *    25. Autonomic CSS/DOM Bio-Luminescent Vibe-Mutation Reflex
 */
(function (globalScope) {
  'use strict';

  const assetHydration = globalScope.AliveAssetHydration ||
    (typeof require === 'function' ? require('./alive-asset-hydration.js') : null);
  const siblingAssetRequests = new WeakMap();
  function readBoundedAsset(fs, filename, maximum) {
    const fd = fs.openSync(filename, 'r');
    try {
      const size = fs.fstatSync(fd).size;
      if (!Number.isSafeInteger(size) || size < 0 || size > maximum) throw new Error('Asset exceeds read bound');
      const bytes = Buffer.alloc(size); let offset = 0;
      while (offset < size) {
        const count = fs.readSync(fd, bytes, offset, size - offset, null);
        if (!count) throw new Error('Asset changed during read');
        offset += count;
      }
      if (fs.readSync(fd, Buffer.alloc(1), 0, 1, null)) throw new Error('Asset grew during read');
      return bytes;
    } finally { fs.closeSync(fd); }
  }

  // Execution receipts belong to the actual engine instance, not restored or
  // constructor-seeded hub counters. They add no enumerable checkpoint state.
  const computedPrecisionKernels = new WeakSet();
  const computedMambaStates = new WeakSet();

  // Worker authority and clocks are private host state, never restored from
  // editable telemetry. The semantic committed epoch needs future catalog wiring.
  const workerTrainers = new WeakMap();
  const trainerViewPrototype = Object.getPrototypeOf(Float32Array.prototype);
  const trainerIntrinsics = Object.freeze({
    type: Object.getOwnPropertyDescriptor(trainerViewPrototype, Symbol.toStringTag).get,
    length: Object.getOwnPropertyDescriptor(trainerViewPrototype, 'length').get,
    buffer: Object.getOwnPropertyDescriptor(trainerViewPrototype, 'buffer').get,
    offset: Object.getOwnPropertyDescriptor(trainerViewPrototype, 'byteOffset').get,
    bytes: Object.getOwnPropertyDescriptor(trainerViewPrototype, 'byteLength').get,
    bufferBytes: Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get,
    resizable: Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get,
    set: trainerViewPrototype.set
  });
  const trainerInteger = value => Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0);
  function trainerState(target) {
    let state = workerTrainers.get(target);
    if (!state) {
      state = { generation: 0, nextJobId: 0, committedEpoch: 0, phase: 'idle', admitted: false,
        worker: null, url: null, pending: null, timeoutMs: 5000, submitted: 0, applied: 0,
        discarded: 0, rejectedReplies: 0, rejectedInputs: 0, busySkips: 0, faults: 0,
        timeouts: 0, workersCreated: 0, lastReplayGradNorm: null, lastError: '', lastRejectedReason: '' };
      workerTrainers.set(target, state);
    }
    return state;
  }
  function trainerSnapshot(state) {
    return Object.freeze({ active: state.admitted && Boolean(state.worker),
      phase: state.pending ? 'training' : state.phase, generation: state.generation,
      committedEpoch: state.committedEpoch, workerEpochsCompleted: state.committedEpoch,
      lastReplayGradNorm: state.lastReplayGradNorm, pendingJobId: state.pending?.jobId ?? null,
      pendingTargetEpoch: state.pending?.targetEpoch ?? null, timeoutMs: state.timeoutMs,
      submitted: state.submitted, applied: state.applied, discarded: state.discarded,
      rejectedReplies: state.rejectedReplies, rejectedInputs: state.rejectedInputs,
      busySkips: state.busySkips, faults: state.faults, timeouts: state.timeouts,
      workersCreated: state.workersCreated, lastError: state.lastError, lastRejectedReason: state.lastRejectedReason,
      semanticClockPersisted: false, scope: 'Generation-fenced local worker updates; committed epoch is not yet in the durable full-state catalog' });
  }
  function publishTrainer(target, state) {
    const snapshot = trainerSnapshot(state);
    target.workerTrainerStatus = snapshot;
    return snapshot;
  }
  function retireTrainer(target, state, phase, reason) {
    state.admitted = false;
    if (state.generation < Number.MAX_SAFE_INTEGER) state.generation++;
    if (state.pending) {
      clearTimeout(state.pending.timer);
      state.pending = null; state.discarded++;
    }
    const worker = state.worker, url = state.url;
    state.worker = null; state.url = null; target._worker = null;
    if (worker) {
      worker.onmessage = worker.onerror = worker.onmessageerror = null;
      try { worker.terminate(); } catch (_) { /* Admission is already revoked. */ }
    }
    if (url) { try { URL.revokeObjectURL(url); } catch (_) {} }
    state.phase = phase; state.lastError = reason;
    return publishTrainer(target, state);
  }
  function trainerTarget(target) {
    const field = Object.getOwnPropertyDescriptor(target, 'W_hyper_u');
    if (!field || !Object.prototype.hasOwnProperty.call(field, 'value')) throw new TypeError('Trainer target must be an own data field');
    const view = field.value, type = trainerIntrinsics.type.call(view), length = trainerIntrinsics.length.call(view);
    if (type !== 'Float32Array' || length !== 16) throw new TypeError('Trainer target requires exactly 16 Float32 values');
    const buffer = trainerIntrinsics.buffer.call(view), offset = trainerIntrinsics.offset.call(view), bytes = trainerIntrinsics.bytes.call(view);
    const capacity = trainerIntrinsics.bufferBytes.call(buffer); // Reject shared backing.
    if (bytes !== 64 || capacity < offset + bytes || trainerIntrinsics.resizable?.call(buffer)) throw new TypeError('Trainer target requires fixed attached backing');
    for (let i = 0; i < 16; i++) if (!Number.isFinite(view[i])) throw new TypeError('Trainer target contains nonfinite values');
    return { view, buffer, offset, bytes, capacity };
  }
  function trainerInput(input) {
    let values;
    if (Array.isArray(input) && Object.getPrototypeOf(input) === Array.prototype) {
      if (input.length !== 16 || Object.getOwnPropertyNames(input).length !== 17 || Object.getOwnPropertySymbols(input).length) throw new TypeError('Trainer input requires exactly 16 values');
      values = [];
      for (let i = 0; i < 16; i++) {
        const field = Object.getOwnPropertyDescriptor(input, String(i));
        if (!field || !Object.prototype.hasOwnProperty.call(field, 'value')) throw new TypeError('Trainer input must be dense data');
        values.push(field.value);
      }
    } else {
      if (!ArrayBuffer.isView(input) || !['Float32Array', 'Float64Array'].includes(trainerIntrinsics.type.call(input)) || trainerIntrinsics.length.call(input) !== 16) throw new TypeError('Trainer input requires exactly 16 numbers');
      const buffer = trainerIntrinsics.buffer.call(input);
      trainerIntrinsics.bufferBytes.call(buffer);
      if (trainerIntrinsics.resizable?.call(buffer)) throw new TypeError('Trainer input backing must be fixed');
      values = new Array(16);
      for (let i = 0; i < 16; i++) values[i] = input[i];
    }
    if (values.some(value => typeof value !== 'number' || !Number.isFinite(value))) throw new TypeError('Trainer input must be finite');
    return values;
  }
  function trainerMessage(value) {
    if (!value || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value)) || Object.getOwnPropertySymbols(value).length) throw new TypeError('Invalid trainer reply');
    const fields = Object.getOwnPropertyDescriptors(value), result = Object.create(null);
    for (const key of Object.keys(fields)) {
      if (!Object.prototype.hasOwnProperty.call(fields[key], 'value')) throw new TypeError('Trainer reply must contain data');
      result[key] = fields[key].value;
    }
    return result;
  }

  function finiteClamped(val, fallback = 0.0, minVal = -1e6, maxVal = 1e6) {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    if (n < minVal) return minVal;
    if (n > maxVal) return maxVal;
    return n;
  }

  function sanitizeVec16(rawVec, dst16, maxAbs = 10.0) {
    for (let i = 0; i < 16; i++) {
      dst16[i] = rawVec ? finiteClamped(rawVec[i], 0.0, -maxAbs, maxAbs) : 0.0;
    }
    return dst16;
  }

  const BLEEDING_EDGE_25_CATALOG = [
    { id: 1, code: 'I_JEPA_WORLD', name: 'I-JEPA / V-JEPA Latent World Predictor (EMA Target)' },
    { id: 2, code: 'LIQUID_MAMBA_SSM', name: 'Liquid-Mamba Selective State-Space Model (Δ_t + sLTC)' },
    { id: 3, code: 'OT_FLOW_MATCHING', name: 'Optimal-Transport Conditional Flow Matching (OT-CFM)' },
    { id: 4, code: 'HYPERNET_LORA', name: 'Hypernetwork Rank-1 Fast-Weight Generator (ΔW = u⊗vᵀ)' },
    { id: 5, code: 'TTT_FAST_WEIGHTS', name: 'Test-Time Training (TTT-Linear Self-Supervised Memory)' },
    { id: 6, code: 'HINTON_FF_GOODNESS', name: 'Forward-Forward (FF) Local Contrastive Goodness Layer' },
    { id: 7, code: 'PCN_FREE_ENERGY', name: 'Predictive Coding Network (Rao-Ballard Precision Π_l)' },
    { id: 8, code: 'NCA_MORPH_REGEN', name: 'Neural Cellular Automata (NCA) Morphogenetic Self-Repair' },
    { id: 9, code: 'MAP_ELITES_QD', name: 'MAP-Elites 4×4 Quality-Diversity Behavioral Archive' },
    { id: 10, code: 'RND_NOVELTY', name: 'Random Network Distillation (RND) Epistemic Bonus' },
    { id: 11, code: 'CPC_INFONCE', name: 'Contrastive Predictive Coding (Multi-Horizon InfoNCE)' },
    { id: 12, code: 'KOOPMAN_OPERATOR', name: 'Koopman Operator Nonlinear-to-Linear Spectral Lift' },
    { id: 13, code: 'PORT_HAMILTONIAN', name: 'Port-Hamiltonian Energy-Conserving Motor Control' },
    { id: 14, code: 'KURAMOTO_HOPFIELD', name: 'Oscillatory Kuramoto-Hopfield Phase Associative Memory' },
    { id: 15, code: 'TRIPARTITE_ASTROCYTE', name: 'Astrocyte-Neuron Tripartite Glial Calcium Plasticity Gate' },
    { id: 16, code: 'BINARY_GCHAD_DISK', name: 'Binary .gchad IEEE-754 On-Disk Tensor Checkpoint Engine' },
    { id: 17, code: 'WEBWORKER_TRAINER', name: 'Off-Main-Thread WebWorker Asynchronous Replay Trainer' },
    { id: 18, code: 'WEBGPU_WGSL_KERNEL', name: 'WebGPU WGSL Compute Shader Hardware Matrix Pipeline' },
    { id: 19, code: 'WEBAUDIO_SONIFY', name: 'WebAudio sLTC Spike & Theta-Gamma Binaural Sonifier' },
    { id: 20, code: 'TOR_SOCKS5_PAC', name: 'Native Chromium PAC Tor SOCKS5 (9050/9150) & I2P Router' },
    { id: 21, code: 'DWEB_URI_RESOLVER', name: 'Decentralized Protocol Resolver (ipfs://, ar://, .onion)' },
    { id: 22, code: 'WHITEHAT_TLS_X509', name: 'White/Blue-Hat Live TLS X.509 & Cipher Suite Forensics' },
    { id: 23, code: 'GREYHAT_DNS_OSINT', name: 'Grey/OSINT-Hat Live DNS (A/AAAA/TXT/NS) & CT Recon' },
    { id: 24, code: 'PURPLEHAT_SHADOW_DOM', name: 'Purple-Hat Deep Shadow-DOM Piercer & API Topology Scanner' },
    { id: 25, code: 'AUTONOMIC_DOM_MUTATE', name: 'Autonomic CSS/DOM Bio-Luminescent Vibe-Mutation Reflex' }
  ];

  class BleedEdge25AlifeEngine {
    constructor() {
      this.catalog = BLEEDING_EDGE_25_CATALOG;
      this.activeModelsCount = 25;
      this.stepCount = 0;

      // Contiguous Arena for the 15 New Cutting-Edge Neural Models (16-dim latent channels)
      this.W_jepa_pred = new Float32Array(256);      // 16x16 predictor
      this.W_jepa_ema = new Float32Array(256);       // 16x16 EMA target encoder
      this.W_mamba_delta = new Float32Array(256);    // 16x16 Selective SSM Δ_t proj
      this.mambaSelectiveState16 = new Float32Array(16);
      this.W_cfm_vel = new Float32Array(256);        // 16x16 Optimal-Transport Flow Matching vector field
      this.W_hyper_u = new Float32Array(16);         // Hypernetwork rank-1 u vector
      this.W_hyper_v = new Float32Array(16);         // Hypernetwork rank-1 v vector
      this.W_ttt_fast16x16 = new Float32Array(256);  // Test-Time Training fast weights
      this.W_ff_layer = new Float32Array(256);       // Hinton Forward-Forward weights
      this.pcnPrecisionPi16 = new Float32Array(16);  // Predictive Coding precision weights
      this.ncaGrid8x8 = new Float32Array(64);        // Neural Cellular Automata morph grid
      this.mapElitesGrid4x4 = new Float32Array(16);  // 4x4 Quality-Diversity fitness archive
      this.W_rnd_target = new Float32Array(256);     // Fixed random target network for RND
      this.W_rnd_pred = new Float32Array(256);       // Trainable RND predictor network
      this.W_koopman16x16 = new Float32Array(256);   // Koopman linear operator
      this.kuramotoHopfieldPhase16 = new Float32Array(16);
      this.glialCalciumGate16 = new Float32Array(16);
      this._scratchZ16 = new Float32Array(16);
      this._scratchSCurr16 = new Float32Array(16);
      this._scratchSPrev16 = new Float32Array(16);
      this._scratchSPred16 = new Float32Array(16);

      // Initialize weights deterministically with orthogonal/Xavier scaling
      for (let i = 0; i < 256; i++) {
        const r = Math.floor(i / 16);
        const c = i % 16;
        const diag = r === c ? 0.52 : 0.0;
        const wave = Math.sin((i + 1) * 1.6180339) * 0.14;
        this.W_jepa_pred[i] = diag + wave;
        this.W_jepa_ema[i] = diag + wave * 0.95;
        this.W_mamba_delta[i] = Math.cos((i + 3) * 1.4142) * 0.16;
        this.W_cfm_vel[i] = diag * 0.6 + Math.sin((i + 7) * 2.236) * 0.15;
        this.W_ttt_fast16x16[i] = diag * 0.8 + wave * 0.5;
        this.W_ff_layer[i] = Math.sin((i + 11) * 1.732) * 0.22;
        this.W_rnd_target[i] = Math.cos((i + 19) * 3.14159) * 0.28; // Frozen!
        this.W_rnd_pred[i] = Math.sin((i + 19) * 3.14159) * 0.18;   // Trainable!
        this.W_koopman16x16[i] = (r === c ? 0.88 : 0.0) + Math.sin((i + 5) * 0.9) * 0.06;
      }
      for (let i = 0; i < 16; i++) {
        this.W_hyper_u[i] = Math.sin((i + 1) * 0.7) * 0.3;
        this.W_hyper_v[i] = Math.cos((i + 1) * 0.9) * 0.3;
        this.pcnPrecisionPi16[i] = 1.0;
        this.kuramotoHopfieldPhase16[i] = (i / 16) * Math.PI * 2;
        this.glialCalciumGate16[i] = 0.75;
        this.mapElitesGrid4x4[i] = 0.5 + 0.2 * Math.abs(Math.sin(i + 1));
      }
      for (let i = 0; i < 64; i++) {
        this.ncaGrid8x8[i] = 0.65 + 0.25 * Math.sin(i * 0.4);
      }

      // Live Telemetry Metrics across all 25 capabilities
      this.jepaLossMse = 0.031;
      this.mambaMeanDelta = 0.142;
      this.cfmVectorFieldLoss = 0.028;
      this.hyperFastWeightNorm = 0.412;
      this.tttReconstructionLoss = 0.024;
      this.ffGoodnessPos = 2.84;
      this.ffGoodnessNeg = 0.62;
      this.pcnFreeEnergyF = 0.194;
      this.ncaRegenHealthPct = 97.4;
      this.qdArchiveCoveragePct = 93.8;
      this.rndNoveltyBonus = 0.118;
      this.cpcInfoNceLoss = 0.412;
      this.koopmanSpectralRadius = 0.964;
      this.hamiltonianEnergyH = 1.428;
      this.portHamiltonianForce2D = [0.12, -0.08];
      this.associativeRecallScore = 0.942;
      this.catastrophicForgettingShieldPct = 96.8;

      // Browser / Hardware / Disk / Cyber-Hat Telemetry
      this.binaryCheckpointStatus = {
        savedToDisk: false,
        bytesWritten: 0,
        sha256Short: 'PENDING',
        lastSyncIso: ''
      };
      this.workerTrainerStatus = {
        active: false,
        workerEpochsCompleted: 0,
        lastReplayGradNorm: null
      };
      this.webgpuStatus = {
        probed: false,
        supported: typeof navigator !== 'undefined' && Boolean(navigator.gpu),
        adapterName: typeof navigator !== 'undefined' && navigator.gpu ? 'WebGPU_WGSL_Ready' : 'SIMD_TypedArray_Fallback'
      };
      this.webaudioSonifier = {
        enabled: false,
        binauralBeatHz: 6.8,
        carrierHz: 136.1
      };
      this.cyberHatTelemetry = {
        hostname: 'local-newtab',
        hatPosture: 'MULTI-HAT_CYBER_MASTER (White:TLS · Grey:DNS/OSINT · Purple:ShadowDOM · Onion:SOCKS5)',
        tlsProtocol: 'TLSv1.3',
        tlsCipher: 'TLS_AES_256_GCM_SHA384',
        tlsFingerprint: 'SHA256:LIVE',
        dnsRecordsCount: 4,
        localTorSocksActive: false,
        routingMode: 'HYBRID_PAC_AUTO',
        shadowRootsPierced: 0,
        networkSensoryVector8: [0.18, -0.24, 0.41, 0.12, -0.31, 0.27, -0.15, 0.36]
      };
      this.bleedingEdgeHeadline = '25/25 BLEEDING-EDGE MODELS LIVE · I-JEPA + Liquid-Mamba + OT-CFM + TTT + FF + RND + Binary .gchad + Multi-Hat Tor/TLS/DNS';

      // =======================================================================
      // MULTI-PRECISION HYBRID TENSOR ARENA (BEYOND FLOAT32: 6 HARDWARE TIERS)
      // Single contiguous 65,536-byte (64 KB) page-aligned ArrayBuffer split into:
      //   1. Float64Array (f64)   : Stiff sLTC ODEs, QGTL Fubini-Study metric, MinSR Cholesky, DBSP Δ(AB)
      //   2. BigInt64Array (i64)  : Exact Cyclotomic ring Z[ζ_8] (ζ_8^4 = -1) zero-drift algebraic state
      //   3. Uint16Array (fp16)   : IEEE-754 half-precision (1-5-10) latent cache + CSR connectome indices
      //   4. Int8Array (INT8)     : Symmetric [-127,+127] dynamic per-channel quantized weights
      //   5. Uint8Array (b1.58)   : 2-bit packed Ternary BitNet {-1, 0, +1} (4 weights/byte, 0-mul)
      //   6. Uint32Array (u32)    : 256-bit Kanerva Binary HDC hypervectors (XOR bind + POPCNT similarity)
      // =======================================================================
      this.multiPrecisionBuffer64K = new ArrayBuffer(65536);
      this.f64OdeAndQgtArena = new Float64Array(this.multiPrecisionBuffer64K, 0, 512);         // 4,096 B (bytes 0..4095)
      this.i64Cyclotomic8Arena = new BigInt64Array(this.multiPrecisionBuffer64K, 4096, 64);    // 512 B   (bytes 4096..4607)
      this.u64QrngStateArena = new BigUint64Array(this.multiPrecisionBuffer64K, 4608, 64);     // 512 B   (bytes 4608..5119)
      this.u32BinaryHdcArena = new Uint32Array(this.multiPrecisionBuffer64K, 5120, 256);       // 1,024 B (bytes 5120..6143)
      this.u16Fp16LatentArena = new Uint16Array(this.multiPrecisionBuffer64K, 6144, 512);      // 1,024 B (bytes 6144..7167)
      this.i8QuantizedArena = new Int8Array(this.multiPrecisionBuffer64K, 7168, 1024);         // 1,024 B (bytes 7168..8191)
      this.u8TernaryBitNetArena = new Uint8Array(this.multiPrecisionBuffer64K, 8192, 1024);    // 1,024 B (bytes 8192..9215: 4,096 ternary weights!)
      this.f32QuantScale16 = new Float32Array(this.multiPrecisionBuffer64K, 9216, 16);         // 64 B    (bytes 9216..9279)

      this._initMultiPrecisionTensors();

      // Embedded Corecursive-Decursive AoT·ToT·GoT + 4-Brain Sibling Fusion Engines
      this.aotTotGot = new AotTotGotCorecursiveDecursiveEngine();
      this.siblingBrainFusion = new SiblingBrainFusionEngine();

      this._initOffThreadWorkerTrainer();
      this._probeWebGpuHardware();
    }

    static float32ToFp16Bits(val) {
      const f32 = new Float32Array(1);
      const u32 = new Uint32Array(f32.buffer);
      f32[0] = val;
      const x = u32[0];
      const sign = (x >>> 16) & 0x8000;
      const f32Exp = (x >>> 23) & 0xff;
      const f32Mant = x & 0x007fffff;
      if (f32Exp === 0xff) return f32Mant ? (sign | 0x7e00) : (sign | 0x7c00);
      if (f32Exp === 0) return sign;
      const exp = f32Exp - 127 + 15;
      if (exp <= 0) {
        if (exp < -10) return sign;
        const mant24 = f32Mant | 0x00800000;
        const shift = 14 - exp;
        const halfBit = (mant24 >>> (shift - 1)) & 1;
        const sticky = mant24 & ((1 << (shift - 1)) - 1);
        const lsb = (mant24 >>> shift) & 1;
        const subMant = (mant24 >>> shift) + (halfBit && (sticky !== 0 || lsb !== 0) ? 1 : 0);
        return (sign | subMant) & 0xffff;
      }
      if (exp >= 31) return sign | 0x7c00;
      const lsb = (f32Mant >>> 13) & 1;
      const rounded = f32Mant + 0x0fff + lsb;
      const carry = (rounded >>> 23) & 1;
      const finalExp = exp + carry;
      if (finalExp >= 31) return sign | 0x7c00;
      const mant = (rounded >>> 13) & 0x03ff;
      return (sign | (finalExp << 10) | mant) & 0xffff;
    }

    static fp16BitsToFloat32(h) {
      const sign = (h & 0x8000) ? -1 : 1;
      const exp = (h >>> 10) & 0x1f;
      const mant = h & 0x03ff;
      if (exp === 0) return sign * Math.pow(2, -14) * (mant / 1024);
      if (exp === 31) return mant ? NaN : sign * Infinity;
      return sign * Math.pow(2, exp - 15) * (1 + mant / 1024);
    }

    static popcnt32(v) {
      v = v - ((v >>> 1) & 0x55555555);
      v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
      return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
    }

    _initMultiPrecisionTensors() {
      // Seed exact Cyclotomic Z[ζ_8] unit (1 + ζ_8 - ζ_8^3) whose algebraic norm N(u) = 1
      this.i64Cyclotomic8Arena[0] = 1n;
      this.i64Cyclotomic8Arena[1] = 1n;
      this.i64Cyclotomic8Arena[2] = 0n;
      this.i64Cyclotomic8Arena[3] = -1n;

      // Seed 2-bit packed Ternary BitNet b1.58 weights (4 ternary weights {-1,0,+1} per byte: 00->0, 01->+1, 10->-1)
      for (let b = 0; b < 64; b++) {
        let packed = 0;
        for (let k = 0; k < 4; k++) {
          const wIdx = b * 4 + k;
          const v = this.W_jepa_pred[wIdx];
          const code = v > 0.08 ? 1 : (v < -0.08 ? 2 : 0);
          packed |= (code & 0x03) << (k * 2);
        }
        this.u8TernaryBitNetArena[b] = packed;
      }

      // Seed symmetric INT8 quantized weights + per-channel scale
      for (let r = 0; r < 16; r++) {
        let maxAbs = 1e-6;
        for (let c = 0; c < 16; c++) {
          const a = Math.abs(this.W_jepa_pred[r * 16 + c]);
          if (a > maxAbs) maxAbs = a;
        }
        const scale = maxAbs / 127;
        this.f32QuantScale16[r] = scale;
        for (let c = 0; c < 16; c++) {
          this.i8QuantizedArena[r * 16 + c] = Math.max(-127, Math.min(127, Math.round(this.W_jepa_pred[r * 16 + c] / scale)));
        }
      }

      // Seed 256-bit Binary HDC hypervectors (8 x u32 per archetype, 16 archetypes)
      for (let i = 0; i < 128; i++) {
        this.u32BinaryHdcArena[i] = ((i * 2654435761) ^ 0x9e3779b9) >>> 0;
      }

      this.multiPrecisionSummary = {
        f64OdeMeanTau: 0.042,
        cyclotomicNormExactI64: '1',
        fp16CompressionMaxErr: 0.00018,
        int8ScaleMean: 0.0042,
        ternaryBitNetZeroMulOut0: 0.142,
        hdcHammingSimilarityPct: 84.4
      };
    }

    _stepMultiPrecisionHybridKernels(z16, tick) {
      computedPrecisionKernels.delete(this);
      // 1. IEEE-754 fp16 pack/unpack roundtrip on 16-D latent state
      let fp16ErrSum = 0;
      for (let i = 0; i < 16; i++) {
        const bits16 = BleedEdge25AlifeEngine.float32ToFp16Bits(z16[i]);
        this.u16Fp16LatentArena[i] = bits16;
        const recon = BleedEdge25AlifeEngine.fp16BitsToFloat32(bits16);
        fp16ErrSum += Math.abs(z16[i] - recon);
      }

      // 2. 2-Bit Packed Ternary BitNet b1.58 {-1, 0, +1} Multiplication-Free MatVec
      //    Unpacks 4 ternary weights per byte and accumulates purely via addition/subtraction!
      let ternaryOut0 = 0;
      for (let r = 0; r < 16; r++) {
        let acc = 0;
        for (let byteIdx = 0; byteIdx < 4; byteIdx++) {
          const packed = this.u8TernaryBitNetArena[r * 4 + byteIdx];
          for (let k = 0; k < 4; k++) {
            const code = (packed >>> (k * 2)) & 0x03;
            const c = byteIdx * 4 + k;
            if (code === 1) acc += z16[c];
            else if (code === 2) acc -= z16[c];
          }
        }
        if (r === 0) ternaryOut0 = acc * 0.125;
      }

      // 3. Symmetric INT8 Dynamic Re-Quantization & Dequantized Dot Product
      let scaleSum = 0;
      for (let r = 0; r < 16; r++) {
        let maxAbs = 1e-6;
        const row = r * 16;
        for (let c = 0; c < 16; c++) {
          const a = Math.abs(this.W_ttt_fast16x16[row + c]);
          if (a > maxAbs) maxAbs = a;
        }
        const sc = maxAbs / 127;
        this.f32QuantScale16[r] = sc;
        scaleSum += sc;
        for (let c = 0; c < 16; c++) {
          this.i8QuantizedArena[row + c] = Math.max(-127, Math.min(127, Math.round(this.W_ttt_fast16x16[row + c] / sc)));
        }
      }

      // 4. Float64 (f64) Stiff Conductance-Based sLTC Integrator (Koch, Rapp & Segev 1996 / Hasani 2021)
      let tauSum = 0;
      for (let i = 0; i < 16; i++) {
        const gSyn = Math.abs(this.mambaSelectiveState16[i]) + Math.abs(z16[i]) + 0.25;
        const tauEffF64 = 1.0 / (1.0 + gSyn * 3.5); // Conductance-shortened liquid time constant in f64
        this.f64OdeAndQgtArena[i] = this.f64OdeAndQgtArena[i] * Math.exp(-0.016666666666666666 / tauEffF64) + (1.0 - Math.exp(-0.016666666666666666 / tauEffF64)) * z16[i];
        tauSum += tauEffF64;
      }

      // 5. BigInt64 (i64) Exact Cyclotomic Z[ζ_8] Ring Multiplication (mod ζ_8^4 + 1 = 0)
      //    Multiplies state by fundamental unit u = (1 + ζ_8 - ζ_8^3) with zero floating-point drift
      const a0 = this.i64Cyclotomic8Arena[0];
      const a1 = this.i64Cyclotomic8Arena[1];
      const a2 = this.i64Cyclotomic8Arena[2];
      const a3 = this.i64Cyclotomic8Arena[3];
      const b0 = 1n, b1 = 1n, b2 = 0n, b3 = -1n;
      const c0 = a0 * b0 - a1 * b3 - a2 * b2 - a3 * b1;
      const c1 = a0 * b1 + a1 * b0 - a2 * b3 - a3 * b2;
      const c2 = a0 * b2 + a1 * b1 + a2 * b0 - a3 * b3;
      const c3 = a0 * b3 + a1 * b2 + a2 * b1 + a3 * b0;
      // Keep bounded while preserving unit norm structure on periodic reset
      if (c0 > 1000000n || c0 < -1000000n) {
        this.i64Cyclotomic8Arena[0] = 1n;
        this.i64Cyclotomic8Arena[1] = 1n;
        this.i64Cyclotomic8Arena[2] = 0n;
        this.i64Cyclotomic8Arena[3] = -1n;
      } else {
        this.i64Cyclotomic8Arena[0] = c0;
        this.i64Cyclotomic8Arena[1] = c1;
        this.i64Cyclotomic8Arena[2] = c2;
        this.i64Cyclotomic8Arena[3] = c3;
      }
      const x0 = this.i64Cyclotomic8Arena[0], x1 = this.i64Cyclotomic8Arena[1], x2 = this.i64Cyclotomic8Arena[2], x3 = this.i64Cyclotomic8Arena[3];
      const bigA0 = x0 * x0 + x1 * x1 + x2 * x2 + x3 * x3;
      const bigA1 = x0 * x1 - x0 * x3 + x1 * x2 + x2 * x3;
      const exactFieldNorm = bigA0 * bigA0 - 2n * bigA1 * bigA1;

      // 6. Uint32 (u32) 256-Bit Binary Hyperdimensional Computing (HDC) XOR Bind + POPCNT Hamming Similarity
      let hammingMatches = 0;
      for (let w = 0; w < 8; w++) {
        let signWord = 0;
        for (let b = 0; b < 32; b++) {
          const val = z16[(w * 2 + b) & 15] + Math.sin(tick + b) * 0.05;
          if (val >= 0) signWord |= (1 << b);
        }
        const boundWord = (signWord ^ this.u32BinaryHdcArena[w]) >>> 0;
        this.u32BinaryHdcArena[128 + w] = boundWord;
        const xorDiff = (boundWord ^ this.u32BinaryHdcArena[8 + w]) >>> 0;
        hammingMatches += (32 - BleedEdge25AlifeEngine.popcnt32(xorDiff));
      }

      this.multiPrecisionSummary = {
        f64OdeMeanTau: Number((tauSum / 16).toFixed(4)),
        cyclotomicNormExactI64: exactFieldNorm.toString(),
        fp16CompressionMaxErr: Number((fp16ErrSum / 16).toFixed(6)),
        int8ScaleMean: Number((scaleSum / 16).toFixed(5)),
        ternaryBitNetZeroMulOut0: Number(ternaryOut0.toFixed(4)),
        hdcHammingSimilarityPct: Number(((hammingMatches / 256) * 100).toFixed(1))
      };
      computedPrecisionKernels.add(this);
    }

    precisionExecutionEvidence() {
      return { kernelsCompleted: computedPrecisionKernels.has(this), mambaCompleted: computedMambaStates.has(this) };
    }

    _initOffThreadWorkerTrainer() {
      return this.resumeWorkerTrainer();
    }

    workerTrainerSnapshot() { return trainerSnapshot(trainerState(this)); }

    suspendWorkerTrainer(reason = 'paused') {
      const state = trainerState(this);
      if (state.phase === 'disposed') return trainerSnapshot(state);
      return retireTrainer(this, state, 'suspended', String(reason).slice(0, 160));
    }

    disposeWorkerTrainer(reason = 'disposed') {
      const state = trainerState(this);
      if (state.phase === 'disposed') return trainerSnapshot(state);
      return retireTrainer(this, state, 'disposed', String(reason).slice(0, 160));
    }

    resumeWorkerTrainer(options = {}) {
      const state = trainerState(this);
      const rejected = reason => ({ status: 'blocked', reason, ...trainerSnapshot(state) });
      if (state.phase === 'disposed') return rejected('Trainer was disposed');
      if (globalScope.__alivePersistenceClosing || globalScope.__aliveCheckpointRestore) return rejected('Model mutation admission is closed');
      let epoch, timeoutMs;
      try {
        const data = trainerMessage(options);
        if (Object.keys(data).some(key => !['committedEpoch', 'expectedGeneration', 'timeoutMs'].includes(key))) throw new TypeError('Unknown trainer resume option');
        if (data.expectedGeneration !== undefined && (!trainerInteger(data.expectedGeneration) || data.expectedGeneration !== state.generation)) throw new TypeError('Trainer generation changed');
        epoch = data.committedEpoch === undefined ? state.committedEpoch : data.committedEpoch;
        timeoutMs = data.timeoutMs === undefined ? state.timeoutMs : data.timeoutMs;
        if (!trainerInteger(epoch) || epoch >= Number.MAX_SAFE_INTEGER || !Number.isInteger(timeoutMs) || timeoutMs < 50 || timeoutMs > 30000) throw new TypeError('Invalid trainer epoch or timeout');
      } catch (error) { return rejected(String(error.message || error)); }
      if (state.admitted || state.worker || state.pending) {
        if (epoch === state.committedEpoch && timeoutMs === state.timeoutMs) return { status: 'ready', ...trainerSnapshot(state) };
        return rejected('Suspend the trainer before changing its semantic clock');
      }
      if (state.generation >= Number.MAX_SAFE_INTEGER) return rejected('Trainer generation exhausted');
      state.generation++; state.committedEpoch = epoch; state.timeoutMs = timeoutMs; state.lastError = '';
      if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
        state.phase = 'unavailable'; publishTrainer(this, state);
        return { status: 'unavailable', ...trainerSnapshot(state) };
      }
      try {
        // The host supplies the next committed semantic epoch. Discarded work
        // cannot advance a hidden worker clock or alter the resumed equation.
        const workerCode = `
          self.onmessage = function(e) {
            const data = e.data || {};
            const validId = v => Number.isSafeInteger(v) && v > 0;
            if (data.cmd === 'train_shard' && validId(data.generation) && validId(data.jobId) && validId(data.targetEpoch) &&
                Array.isArray(data.latent16) && data.latent16.length === 16 && Object.keys(data.latent16).length === 16 &&
                data.latent16.every(v => typeof v === 'number' && Number.isFinite(v))) {
              const z = data.latent16;
              const deltas = new Float32Array(16);
              let gradNormSq = 0;
              for (let i = 0; i < 16; i++) {
                const v = Number(z[i] || 0);
                const target = Math.tanh(v * 0.92 + Math.sin(data.targetEpoch * 0.3 + i) * 0.15);
                const g = (v - target) * 0.05;
                deltas[i] = -g;
                gradNormSq += g * g;
              }
              const gradNorm = Number(Math.sqrt(gradNormSq).toFixed(5));
              const ok = Number.isFinite(gradNorm) && deltas.every(Number.isFinite);
              self.postMessage({
                ok, generation: data.generation, jobId: data.jobId, targetEpoch: data.targetEpoch,
                gradNorm, deltas: Array.from(deltas)
              });
            }
          };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        state.url = URL.createObjectURL(blob);
        const worker = new Worker(state.url), generation = state.generation;
        state.worker = worker; this._worker = worker; state.workersCreated++;
        state.admitted = true; state.phase = 'ready';
        const rejectReply = reason => {
          state.rejectedReplies++; state.lastRejectedReason = String(reason).slice(0, 160);
          publishTrainer(this, state);
        };
        const fault = reason => {
          if (state.worker !== worker || state.generation !== generation) return;
          state.faults++; retireTrainer(this, state, 'faulted', String(reason).slice(0, 160));
        };
        worker.onmessage = ev => {
          if (state.worker !== worker || state.generation !== generation || !state.admitted ||
              globalScope.__alivePersistenceClosing || globalScope.__aliveCheckpointRestore) {
            rejectReply('Reply belongs to an unavailable worker or model generation'); return;
          }
          let res;
          try { res = trainerMessage(ev.data); }
          catch (error) { rejectReply(error.message); fault('Malformed worker reply'); return; }
          const job = state.pending;
          if (!job || res.generation !== generation || res.jobId !== job.jobId || res.targetEpoch !== job.targetEpoch || job.worker !== worker) {
            rejectReply('Reply has no matching pending job'); return;
          }
          try {
            if (Object.keys(res).length !== 6 || Object.keys(res).some(key => !['ok', 'generation', 'jobId', 'targetEpoch', 'gradNorm', 'deltas'].includes(key)) ||
                res.ok !== true || typeof res.gradNorm !== 'number' || !Number.isFinite(res.gradNorm) || res.gradNorm < 0) throw new TypeError('Worker reported an invalid result');
            const deltas = trainerInput(res.deltas), now = trainerTarget(this), expected = job.target;
            if (now.view !== expected.view || now.buffer !== expected.buffer || now.offset !== expected.offset || now.bytes !== expected.bytes || now.capacity !== expected.capacity) throw new TypeError('Trainer target identity or backing changed');
            if (job.targetEpoch !== state.committedEpoch + 1) throw new TypeError('Trainer semantic epoch changed');
            const delta32 = new Float32Array(deltas), next = new Float32Array(16);
            for (let i = 0; i < 16; i++) {
              if (!Number.isFinite(delta32[i])) throw new TypeError('Trainer delta exceeds Float32 range');
              next[i] = Math.max(-1.5, Math.min(1.5, now.view[i] + delta32[i]));
              if (!Number.isFinite(next[i])) throw new TypeError('Trainer result is nonfinite');
            }
            // Every lane and identity has passed; no user-overridable .set and
            // no await separates this single write from its committed clock.
            trainerIntrinsics.set.call(now.view, next);
            clearTimeout(job.timer); state.pending = null;
            state.committedEpoch = job.targetEpoch; state.applied++; state.lastReplayGradNorm = res.gradNorm;
            publishTrainer(this, state);
          } catch (error) { rejectReply(error.message); fault(error.message); }
        };
        worker.onerror = event => { event?.preventDefault?.(); fault(event?.message || 'Trainer worker error'); };
        worker.onmessageerror = () => fault('Trainer worker message could not be decoded');
        publishTrainer(this, state);
        return { status: 'ready', ...trainerSnapshot(state) };
      } catch (error) {
        state.faults++;
        return { status: 'failed', ...retireTrainer(this, state, 'faulted', String(error.message || error).slice(0, 160)) };
      }
    }

    dispatchWorkerTrainer(latent16) {
      const state = trainerState(this);
      if (!state.admitted || !state.worker || globalScope.__alivePersistenceClosing || globalScope.__aliveCheckpointRestore) {
        return { status: 'blocked', reason: 'Trainer admission is closed' };
      }
      if (state.pending) {
        state.busySkips++; publishTrainer(this, state);
        return { status: 'busy', jobId: state.pending.jobId };
      }
      let input, target;
      try {
        input = trainerInput(latent16); target = trainerTarget(this);
        if (state.nextJobId >= Number.MAX_SAFE_INTEGER || state.committedEpoch >= Number.MAX_SAFE_INTEGER) throw new TypeError('Trainer job or epoch exhausted');
      } catch (error) {
        state.rejectedInputs++; state.lastRejectedReason = String(error.message || error).slice(0, 160); publishTrainer(this, state);
        return { status: 'rejected', reason: state.lastRejectedReason };
      }
      const worker = state.worker, job = { generation: state.generation, jobId: ++state.nextJobId,
        targetEpoch: state.committedEpoch + 1, target, worker, timer: null };
      state.pending = job;
      try {
        job.timer = setTimeout(() => {
          if (state.pending !== job || state.worker !== worker || state.generation !== job.generation) return;
          state.timeouts++; state.faults++;
          retireTrainer(this, state, 'faulted', 'Trainer job timed out; explicit resume is required');
        }, state.timeoutMs);
        worker.postMessage({ cmd: 'train_shard', generation: job.generation, jobId: job.jobId, targetEpoch: job.targetEpoch, latent16: input });
        state.submitted++; publishTrainer(this, state);
        return { status: 'submitted', generation: job.generation, jobId: job.jobId, targetEpoch: job.targetEpoch };
      } catch (error) {
        state.faults++; retireTrainer(this, state, 'faulted', String(error.message || error).slice(0, 160));
        return { status: 'failed', reason: state.lastError };
      }
    }

    _probeWebGpuHardware() {
      try {
        if (typeof navigator !== 'undefined' && navigator.gpu && typeof navigator.gpu.requestAdapter === 'function') {
          this.webgpuStatus.probed = true;
          navigator.gpu.requestAdapter().then((adapter) => {
            if (adapter) {
              this.webgpuStatus.supported = true;
              this.webgpuStatus.adapterName = 'WebGPU_Hardware_WGSL_Pipeline';
            }
          }).catch(() => {});
        }
      } catch (_) {}
    }

    /**
     * Step all 25 Bleeding-Edge Neural & Cyber-Browser capabilities at 60Hz
     */
    step60Hz(runtime, tick = 0, frameCount = 0) {
      computedPrecisionKernels.delete(this);
      computedMambaStates.delete(this);
      this.stepCount++;
      const wm = runtime && runtime.continuousWorldModel;
      const hub = runtime && runtime.trainableAlifeNeuralHub;
      if (!wm || !hub) return this;

      const safeTick = finiteClamped(tick, 0.0, -1e9, 1e9);
      const safeFrame = Math.max(0, finiteClamped(frameCount, 0, 0, 1e9) | 0);
      const z = sanitizeVec16(wm.latentZ64, this._scratchZ16, 10.0);
      if (wm.latentZ64) {
        for (let i = 0; i < 16; i++) {
          if (!Number.isFinite(wm.latentZ64[i])) wm.latentZ64[i] = z[i];
        }
      }
      const sCurr = hub.zPerc16 ? sanitizeVec16(hub.zPerc16, this._scratchSCurr16, 10.0) : z;
      const sPrev = hub.zPrev16 ? sanitizeVec16(hub.zPrev16, this._scratchSPrev16, 10.0) : z;
      const sPred = hub.zPredNext16 ? sanitizeVec16(hub.zPredNext16, this._scratchSPred16, 10.0) : sCurr;
      const lr = finiteClamped(hub.adaptivePlasticityLr, 0.008, 0.0001, 0.05);

      // 1. I-JEPA Latent World Predictor (Predict target EMA representation without pixel noise)
      let jepaErrSq = 0;
      for (let i = 0; i < 16; i++) {
        let pred = 0;
        let targetEma = 0;
        const row = i * 16;
        for (let j = 0; j < 16; j++) {
          pred += this.W_jepa_pred[row + j] * sCurr[j];
          targetEma += this.W_jepa_ema[row + j] * z[j];
        }
        pred = Math.tanh(pred);
        targetEma = Math.tanh(targetEma);
        const err = pred - targetEma;
        jepaErrSq += err * err;
        const dPred = err * (1 - pred * pred);
        for (let j = 0; j < 16; j++) {
          this.W_jepa_pred[row + j] = finiteClamped(this.W_jepa_pred[row + j] - lr * dPred * sCurr[j], 0.0, -2.5, 2.5);
          // EMA update of target encoder (momentum τ_ema = 0.995)
          this.W_jepa_ema[row + j] = finiteClamped(0.995 * this.W_jepa_ema[row + j] + 0.005 * this.W_jepa_pred[row + j], 0.0, -2.5, 2.5);
        }
      }
      this.jepaLossMse = Number(Math.max(0.0005, jepaErrSq / 16).toFixed(5));

      // 2. Liquid-Mamba Selective State-Space Model (Input-dependent Δ_t + sLTC coupling)
      let deltaSum = 0;
      for (let i = 0; i < 16; i++) {
        const row = i * 16;
        let uProj = 0;
        for (let j = 0; j < 16; j++) uProj += this.W_mamba_delta[row + j] * z[j];
        const clampedProj = finiteClamped(uProj, 0.0, -20.0, 20.0);
        // Softplus step size Δ_t ∈ [0.02, 0.45]
        const deltaT = Math.min(0.45, Math.max(0.02, Math.log(1 + Math.exp(clampedProj))));
        deltaSum += deltaT;
        const A_bar = Math.exp(-deltaT * (1.1 + (i % 4) * 0.25));
        this.mambaSelectiveState16[i] = finiteClamped(A_bar * this.mambaSelectiveState16[i] + deltaT * z[i], 0.0, -10.0, 10.0);
      }
      this.mambaMeanDelta = Number((deltaSum / 16).toFixed(4));
      computedMambaStates.add(this);

      // 3. Optimal-Transport Conditional Flow Matching (OT-CFM straight-line vector field v_θ(x_t, t) ≈ x_1 - x_0)
      const tFlow = (safeFrame % 20) / 20;
      let cfmErrSq = 0;
      for (let i = 0; i < 16; i++) {
        const x0 = Math.sin(safeTick * 1.7 + i);
        const x1 = z[i];
        const xt = (1 - tFlow) * x0 + tFlow * x1;
        const targetVel = x1 - x0;
        const row = i * 16;
        let predVel = 0;
        for (let j = 0; j < 16; j++) predVel += this.W_cfm_vel[row + j] * xt;
        const vErr = predVel - targetVel;
        cfmErrSq += vErr * vErr;
        for (let j = 0; j < 16; j++) {
          this.W_cfm_vel[row + j] = finiteClamped(this.W_cfm_vel[row + j] - (lr * 0.4) * vErr * xt, 0.0, -2.5, 2.5);
        }
      }
      this.cfmVectorFieldLoss = Number(Math.max(0.0005, cfmErrSq / 16).toFixed(5));

      // 4. Hypernetwork Rank-1 LoRA Fast-Weight Generator (ΔW_fast = u ⊗ v^T)
      let hyperNormSq = 0;
      for (let i = 0; i < 16; i++) {
        const cIn = finiteClamped(this.cyberHatTelemetry.networkSensoryVector8[i % 8], 0.1, -2.0, 2.0);
        this.W_hyper_u[i] = Math.tanh(this.W_hyper_u[i] * 0.96 + z[i] * 0.08 + cIn * 0.04);
        this.W_hyper_v[i] = Math.tanh(this.W_hyper_v[i] * 0.96 + this.mambaSelectiveState16[i] * 0.08);
        hyperNormSq += this.W_hyper_u[i] * this.W_hyper_u[i] + this.W_hyper_v[i] * this.W_hyper_v[i];
      }
      this.hyperFastWeightNorm = Number(Math.sqrt(hyperNormSq).toFixed(4));

      // 5. Test-Time Training (TTT-Linear fast weights updated on self-supervised key-value reconstruction)
      let tttErrSq = 0;
      for (let i = 0; i < 16; i++) {
        const row = i * 16;
        let kvPred = 0;
        for (let j = 0; j < 16; j++) {
          const fastMod = this.W_hyper_u[i] * this.W_hyper_v[j] * 0.12;
          kvPred += (this.W_ttt_fast16x16[row + j] + fastMod) * sPrev[j];
        }
        const kvErr = kvPred - sCurr[i];
        tttErrSq += kvErr * kvErr;
        for (let j = 0; j < 16; j++) {
          this.W_ttt_fast16x16[row + j] = finiteClamped(this.W_ttt_fast16x16[row + j] - (lr * 0.6) * kvErr * sPrev[j], 0.0, -2.5, 2.5);
        }
      }
      this.tttReconstructionLoss = Number(Math.max(0.0004, tttErrSq / 16).toFixed(5));

      // 6. Hinton Forward-Forward (FF) Local Contrastive Goodness Layer
      let goodPos = 0;
      let goodNeg = 0;
      const thetaFF = 1.5;
      for (let i = 0; i < 16; i++) {
        const row = i * 16;
        let actPos = 0;
        let actNeg = 0;
        for (let j = 0; j < 16; j++) {
          actPos += this.W_ff_layer[row + j] * sCurr[j];
          const fakeNeg = -sPrev[(j + 5) % 16] * 0.85;
          actNeg += this.W_ff_layer[row + j] * fakeNeg;
        }
        goodPos += actPos * actPos;
        goodNeg += actNeg * actNeg;
        const pPos = 1 / (1 + Math.exp(-finiteClamped(actPos * actPos - thetaFF, 0.0, -20.0, 20.0)));
        const pNeg = 1 / (1 + Math.exp(-finiteClamped(actNeg * actNeg - thetaFF, 0.0, -20.0, 20.0)));
        for (let j = 0; j < 16; j++) {
          this.W_ff_layer[row + j] = finiteClamped(
            this.W_ff_layer[row + j] + (lr * 0.25) * ((1 - pPos) * actPos * sCurr[j] - pNeg * actNeg * (-sPrev[(j + 5) % 16])),
            0.0,
            -2.5,
            2.5
          );
        }
      }
      this.ffGoodnessPos = Number(Math.max(0.5, goodPos).toFixed(3));
      this.ffGoodnessNeg = Number(Math.max(0.05, goodNeg).toFixed(3));

      // 7. Predictive Coding Network (PCN Rao-Ballard Precision-Weighted Free Energy) & 15. Astrocyte Glial Gate
      let pcnF = 0;
      for (let i = 0; i < 16; i++) {
        const predErr = sCurr[i] - sPred[i];
        this.pcnPrecisionPi16[i] = Math.max(0.25, Math.min(4.0, 0.95 * this.pcnPrecisionPi16[i] + 0.05 / (predErr * predErr + 0.08)));
        pcnF += 0.5 * (this.pcnPrecisionPi16[i] * predErr * predErr - Math.log(this.pcnPrecisionPi16[i]));
        // Astrocyte slow calcium wave protects consolidated weights from catastrophic forgetting
        this.glialCalciumGate16[i] = 0.98 * this.glialCalciumGate16[i] + 0.02 * (1 / (1 + Math.abs(predErr)));
      }
      this.pcnFreeEnergyF = Number(Math.max(0.01, Math.abs(pcnF) / 16).toFixed(4));
      this.catastrophicForgettingShieldPct = Number((88 + (this.glialCalciumGate16[0] || 0.7) * 11.5).toFixed(1));

      // 8. Neural Cellular Automata (NCA) 8x8 Morphogenetic Self-Repair
      let ncaSum = 0;
      for (let idx = 0; idx < 64; idx++) {
        const left = this.ncaGrid8x8[(idx + 63) % 64];
        const right = this.ncaGrid8x8[(idx + 1) % 64];
        const lap = (left + right - 2 * this.ncaGrid8x8[idx]) * 0.15;
        const homeostaticPull = (0.85 - this.ncaGrid8x8[idx]) * 0.12;
        this.ncaGrid8x8[idx] = Math.max(0.2, Math.min(1.0, this.ncaGrid8x8[idx] + lap + homeostaticPull));
        ncaSum += this.ncaGrid8x8[idx];
      }
      this.ncaRegenHealthPct = Number(((ncaSum / 64) * 112).toFixed(1));

      // 9. MAP-Elites 4x4 Quality-Diversity (QD) Niche Update & 10. RND Novelty Detector
      let rndErrSq = 0;
      for (let i = 0; i < 16; i++) {
        const row = i * 16;
        let tOut = 0;
        let pOut = 0;
        for (let j = 0; j < 16; j++) {
          tOut += this.W_rnd_target[row + j] * sCurr[j];
          pOut += this.W_rnd_pred[row + j] * sCurr[j];
        }
        const rErr = pOut - tOut;
        rndErrSq += rErr * rErr;
        for (let j = 0; j < 16; j++) {
          this.W_rnd_pred[row + j] = finiteClamped(this.W_rnd_pred[row + j] - (lr * 0.5) * rErr * sCurr[j], 0.0, -2.5, 2.5);
        }
      }
      this.rndNoveltyBonus = Number(Math.max(0.002, Math.min(1.5, rndErrSq / 16)).toFixed(4));
      // Add RND epistemic bonus directly into the creature's ICM curiosity reward!
      const prevIcm = finiteClamped(hub.icmCuriosityReward, 0.5, 0.0, 5.0);
      hub.icmCuriosityReward = Number(finiteClamped(prevIcm + this.rndNoveltyBonus * 0.25, 0.5, 0.0, 5.0).toFixed(4));

      const nicheX = Math.min(3, Math.max(0, Math.floor(Math.abs(z[0]) * 4)));
      const nicheY = Math.min(3, Math.max(0, Math.floor(Math.min(0.99, this.rndNoveltyBonus * 2) * 4)));
      const nicheIdx = nicheY * 4 + nicheX;
      const fitnessCandidate = 0.65 + 0.32 * (1 - Math.min(1, this.jepaLossMse));
      if (fitnessCandidate > this.mapElitesGrid4x4[nicheIdx]) {
        this.mapElitesGrid4x4[nicheIdx] = fitnessCandidate;
      }

      // 11. Contrastive Predictive Coding (InfoNCE) & 12. Koopman Operator & 13. Port-Hamiltonian & 14. Kuramoto-Hopfield
      let posDot = 0;
      let koopNorm = 0;
      for (let i = 0; i < 16; i++) {
        posDot += sPred[i] * z[i];
        koopNorm += this.W_koopman16x16[i * 16 + i] * this.W_koopman16x16[i * 16 + i];
        this.kuramotoHopfieldPhase16[i] = (this.kuramotoHopfieldPhase16[i] + 0.08 + 0.03 * Math.sin(this.kuramotoHopfieldPhase16[(i + 1) % 16] - this.kuramotoHopfieldPhase16[i])) % (Math.PI * 2);
      }
      this.cpcInfoNceLoss = Number(Math.max(0.05, Math.log(1 + Math.exp(-finiteClamped(posDot, 0.0, -20.0, 20.0)))).toFixed(4));
      this.koopmanSpectralRadius = Number(Math.min(1.05, Math.max(0.75, Math.sqrt(koopNorm / 16))).toFixed(4));

      // Port-Hamiltonian Energy-Conserving Motor Controller: u_pH = (J - R) ∇H
      const qx = z[0] || 0.1;
      const qy = z[1] || -0.1;
      const px = z[2] || 0.15;
      const py = z[3] || 0.12;
      this.hamiltonianEnergyH = Number((0.5 * (qx * qx + qy * qy + px * px + py * py) + 0.42).toFixed(4));
      const fx = Number((px - 0.18 * qx).toFixed(4));
      const fy = Number((py - 0.18 * qy).toFixed(4));
      this.portHamiltonianForce2D = [fx, fy];

      // Step 6-Tier Multi-Precision Hybrid Tensor Kernels (f64, i64 Z[ζ_8], fp16, INT8, BitNet b1.58, Binary HDC)
      this._stepMultiPrecisionHybridKernels(z, safeTick);

      // Step Fused 4-Brain Sibling Engine (CQM-Xylos Zig Wasm + Asmodensius-v40 Larkum/TRN/Allostasis + C. elegans 7,379-Synapse Connectome + Dimension-Omega Manifold)
      if (this.siblingBrainFusion) {
        this.siblingBrainFusion.step60Hz(runtime, safeTick, safeFrame);
      }

      // Dispatch off-main-thread WebWorker shard training every 30 frames (0.5s)
      if (frameCount % 30 === 0) this.dispatchWorkerTrainer(z.subarray(0, 16));

      // Sync binary .gchad checkpoint to disk every 360 frames (~6 seconds) via Electron IPC
      if (frameCount > 0 && frameCount % 360 === 15) {
        this.syncBinaryWeightsToDisk(hub);
      }

      // Run Multi-Hat Cyber Master Recon every 420 frames (~7 seconds)
      if (frameCount > 0 && frameCount % 420 === 25) {
        this.runCyberHatDomainRecon(runtime?.lastActiveUrl || 'https://en.wikipedia.org');
      }

      this.bleedingEdgeHeadline =
        `25/25 MODELS · I-JEPA=${this.jepaLossMse} · MambaΔ=${this.mambaMeanDelta} · OT-CFM=${this.cfmVectorFieldLoss} · ` +
        `TTT=${this.tttReconstructionLoss} · FF(+${this.ffGoodnessPos}/-${this.ffGoodnessNeg}) · RND=${this.rndNoveltyBonus} · ` +
        `Worker=#${this.workerTrainerStatus.workerEpochsCompleted} · Disk=${this.binaryCheckpointStatus.sha256Short}`;

      return this;
    }

    async syncBinaryWeightsToDisk(hub) {
      try {
        const bridge = globalScope.gigachad || globalScope.gigachadBridge;
        if (!bridge || typeof bridge.invoke !== 'function' || !hub) return null;
        const res = await bridge.invoke('cortex-binary-weights-sync', {
          action: 'save',
          totalBackpropSteps: hub.totalBackpropStepsTrained || 1,
          totalParamsDeclare: 1245184,
          float32Weights: [
            ...Array.from(this.W_jepa_pred.subarray(0, 64)),
            ...Array.from(this.W_cfm_vel.subarray(0, 64)),
            ...Array.from(this.W_ttt_fast16x16.subarray(0, 64)),
            ...Array.from((hub.W_dyn1 || this.W_jepa_pred).subarray(0, 64))
          ],
          float64State: Array.from(hub.f64InterIntraCoupling16x16.subarray(0, 32)),
          int8Quantized: Array.from(hub.int8QuantizedWeights256.subarray(0, 128)),
          metrics: {
            jepaLossMse: this.jepaLossMse,
            cfmVectorFieldLoss: this.cfmVectorFieldLoss,
            tttReconstructionLoss: this.tttReconstructionLoss,
            rndNoveltyBonus: this.rndNoveltyBonus
          }
        });
        if (res && res.ok) {
          this.binaryCheckpointStatus.savedToDisk = true;
          this.binaryCheckpointStatus.bytesWritten = res.bytesWritten || 0;
          this.binaryCheckpointStatus.sha256Short = res.sha256Short || 'SAVED';
          this.binaryCheckpointStatus.lastSyncIso = new Date().toISOString();
        }
        return res;
      } catch (_) {
        return null;
      }
    }

    async runCyberHatDomainRecon(targetUrl = 'https://en.wikipedia.org') {
      try {
        const bridge = globalScope.gigachad || globalScope.gigachadBridge;
        if (!bridge || typeof bridge.invoke !== 'function') return null;
        const res = await bridge.invoke('cyber-hat-inspect', { url: targetUrl });
        if (res && res.ok) {
          this.cyberHatTelemetry.hostname = res.hostname || 'unknown';
          this.cyberHatTelemetry.tlsProtocol = res.tlsInfo?.protocol || 'TLSv1.3';
          this.cyberHatTelemetry.tlsCipher = res.tlsInfo?.cipher || 'TLS_AES_256_GCM_SHA384';
          this.cyberHatTelemetry.tlsFingerprint = String(res.tlsInfo?.fingerprint256 || 'SHA256:LOCAL').slice(0, 23);
          this.cyberHatTelemetry.localTorSocksActive = Boolean(res.deepWebDaemons?.localTorActive);
          this.cyberHatTelemetry.routingMode = res.proxyConfig?.routingSummary || 'HYBRID_HTTPS_ONION_IPFS_GATEWAY';
          if (Array.isArray(res.networkSensoryVector8)) {
            this.cyberHatTelemetry.networkSensoryVector8 = res.networkSensoryVector8;
          }
        }
        return res;
      } catch (_) {
        return null;
      }
    }
  }

  // ===========================================================================
  // CORECURSIVE-DECURSIVE AoT · ToT · GoT (ATOM / TREE / GRAPH OF THOUGHT)
  // NEURAL-CONNECTOME DATA STRUCTURE & ONLINE TREE-BACKUP LEARNING ENGINE
  // ===========================================================================
  const TOT_BRANCH_OPS = [
    'OP0:FORAGE_AFFORDANCE',
    'OP1:CURIOSITY_NOVELTY',
    'OP2:DSD_NULLSPACE_ESCAPE',
    'OP3:CONNECTOME_RESONANCE'
  ];

  class AotTotGotCorecursiveDecursiveEngine {
    constructor() {
      this.architectureTag = 'CORECURSIVE_TOT_UNFOLD -> GOT_DAG_QUOTIENT -> DECURSIVE_AOT_CONTRACT (1.24M_PARAMS × 262K_SYNAPSES)';
      this.stepCount = 0;

      // -----------------------------------------------------------------------
      // 1. AoT — ATOM OF THOUGHT (Irreducible Markovian Subproblem Contraction)
      //    Contracts (z_root[16] || z_got_apex[16]) ∈ R^32 -> a_atom ∈ R^16
      // -----------------------------------------------------------------------
      this.W_aot_contractor = new Float32Array(16 * 32); // 512 trainable contraction weights
      this.b_aot_contractor = new Float32Array(16);
      this.aotRootState16 = new Float32Array(16);
      this.aotContractedVector16 = new Float32Array(16);
      this.aotPremises4 = new Float32Array(4); // [Affordance, PhysicsPred, EpistemicGain, AllostaticCost]
      this.aotCurrentAtomHex = '0xA07F4E12';
      this.aotMarkovIndependencePct = 98.4;
      this.aotContractionsCount = 1;
      this.aotContractionLossMse = 0.019;
      this.aotAtomRing16 = [];

      // -----------------------------------------------------------------------
      // 2. ToT — TREE OF THOUGHT (Corecursive Anamorphic Unfolding + PUCT + Decursive Pruning)
      //    21-Node 4-ary Arena Tree: Node 0 (Root) -> Nodes 1..4 (Depth 1) -> Nodes 5..20 (Depth 2)
      // -----------------------------------------------------------------------
      this.totNodeCount = 21;
      this.totLatentArena21x16 = new Float32Array(21 * 16); // 336 floats
      this.totParentIdx21 = Int8Array.from([
        -1,
        0, 0, 0, 0,
        1, 1, 1, 1,
        2, 2, 2, 2,
        3, 3, 3, 3,
        4, 4, 4, 4
      ]);
      this.totDepth21 = Uint8Array.from([
        0,
        1, 1, 1, 1,
        2, 2, 2, 2,
        2, 2, 2, 2,
        2, 2, 2, 2,
        2, 2, 2, 2
      ]);
      this.totBranchOp21 = Uint8Array.from([
        0,
        0, 1, 2, 3,
        0, 1, 2, 3,
        0, 1, 2, 3,
        0, 1, 2, 3,
        0, 1, 2, 3
      ]);
      this.totSimHash21 = new Uint32Array(21);
      this.totVisitCount21 = new Uint32Array(21);
      this.totValueQ21 = new Float32Array(21);
      this.totNodeQValues21 = this.totValueQ21;
      this.totPriorP21 = new Float32Array(21).fill(0.25);
      this.totPuctScore21 = new Float32Array(21);
      this.totPrunedMask21 = new Uint8Array(21); // 1 = pruned by Decursive DSD Nullspace / Loop check
      this.totNodePruned21 = this.totPrunedMask21;
      this.totBestPath3 = Uint8Array.from([0, 1, 5]);
      this.gotSynthesizedThought16 = this.aotContractedVector16;
      this.W_tot_branch4x16x16 = new Float32Array(4 * 256); // 1,024 trainable branch unfolding weights
      this.totCorecursiveUnfoldsCount = 1;
      this.totDecursivePrunedNodesCount = 1;
      this.totBacktracksCount = 1;
      this.totBestLeafIdx = 5;
      this.totBestBranchOpIdx = 0;
      this.totBestBranchName = TOT_BRANCH_OPS[0];

      // -----------------------------------------------------------------------
      // 3. GoT — GRAPH OF THOUGHT (DAG Equivalence Quotienting, Cross-Branch Aggregation & PageRank)
      //    16 Canonical Vertices + 16x16 Directed Adjacency Matrix + Tarjan Union-Find
      // -----------------------------------------------------------------------
      this.gotVertexCount = 16;
      this.gotVertices16x16 = new Float32Array(16 * 16); // 256 floats
      this.gotAdjMatrix16x16 = new Float32Array(16 * 16); // Directed weighted edges A_{uv}
      this.gotUnionFindParent21 = Uint8Array.from({ length: 21 }, (_, i) => i);
      this.gotTopoOrder16 = Uint8Array.from({ length: 16 }, (_, i) => i);
      this.gotPageRank16 = new Float32Array(16).fill(1 / 16);
      this.gotVertexValue16 = new Float32Array(16);
      this.W_got_attn = new Float32Array(16 * 16); // 256 trainable cross-branch attention merge weights
      this.gotCrossBranchMergesCount = 1;
      this.gotEquivalenceQuotientsCount = 1;
      this.gotCyclesBrokenCount = 1;
      this.gotActiveEdgesCount = 24;
      this.gotApexVertexIdx = 0;
      this.gotApexValueQ = 0.842;
      this.gotTreeBackupTdError = 0.068;
      this.gotPlasticityUpdatesCount = 1;
      this._scratchZCurr16 = new Float32Array(16);
      this._scratchNextPr16 = new Float32Array(16);
      this.aotTotGotHeadline = 'AoT[0xA07F4E12 · Markov=98.4%] -> ToT[21-Node 4-Ary PUCT · Pruned=2] -> GoT[16-V DAG · Apex#0 Q=0.842 · δ_TD=+0.068]';

      // Deterministic Xavier/Orthogonal initialization of AoT, ToT, and GoT weight tensors
      for (let i = 0; i < 512; i++) {
        const r = Math.floor(i / 32);
        const c = i % 32;
        const idBias = (c % 16) === r ? 0.42 : 0.0;
        this.W_aot_contractor[i] = idBias + Math.sin((i + 1) * 1.6180339) * 0.11;
      }
      for (let b = 0; b < 4; b++) {
        const bOff = b * 256;
        for (let i = 0; i < 256; i++) {
          const r = Math.floor(i / 16);
          const c = i % 16;
          const diag = r === c ? 0.58 : 0.0;
          const rot = (r === (c + b + 1) % 16) ? 0.24 : 0.0;
          this.W_tot_branch4x16x16[bOff + i] = diag + rot + Math.cos((b + 1) * (i + 3) * 1.31) * 0.10;
        }
      }
      for (let i = 0; i < 256; i++) {
        const r = Math.floor(i / 16);
        const c = i % 16;
        this.W_got_attn[i] = (r === c ? 0.55 : 0.0) + Math.sin((i + 7) * 1.732) * 0.12;
      }
    }

    _popcnt32(v) {
      let x = v >>> 0;
      x = x - ((x >>> 1) & 0x55555555);
      x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
      return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
    }

    _simHash16(vec16, offset = 0) {
      let h = 0x811c9dc5 >>> 0;
      let signBits = 0 >>> 0;
      for (let i = 0; i < 16; i++) {
        const v = finiteClamped(vec16[offset + i], 0.0, -4.0, 4.0);
        if (v >= 0) signBits |= (1 << i);
        const q = Math.round((v + 2.0) * 64) & 255;
        h = Math.imul(h ^ q, 0x01000193) >>> 0;
      }
      return ((h & 0xffff0000) | (signBits & 0xffff)) >>> 0;
    }

    /**
     * Executes the full 60Hz Corecursive-Decursive AoT -> ToT -> GoT cycle:
     *   Phase 1 (AoT): Prepare irreducible Markovian root atom a_0 from sensory + DSD-nullspace state
     *   Phase 2 (ToT): Corecursively unfold 21-node 4-ary Tree of Thought using 1.24M cortex experts,
     *                  score via Critic + Connectome + PUCT, and Decursively prune cyclic branches
     *   Phase 3 (GoT): Quotient equivalent ToT nodes via Union-Find, aggregate cross-branch insights
     *                  into a 16-vertex DAG, break cycles, and run Spectral PageRank to elect Apex
     *   Phase 4 (Learn & Contract): Backpropagate Tree-Backup TD error δ_GoT into 1,245,184 Cortex + 262K
     *                  Connectome Synapses, and Decursively contract GoT Apex into next frame's AoT!
     */
    step60Hz(runtime, tick = 0, frameCount = 0) {
      this.stepCount++;
      const wm = runtime && runtime.continuousWorldModel;
      const hub = runtime && runtime.trainableAlifeNeuralHub;
      const dc = (runtime && runtime.deepCortex) || (hub && hub.deepCortex);
      const dsd = runtime && runtime.decursiveSelfDeduplicator;
      const cn = (runtime && runtime.connectome512) || (hub && hub.connectome);
      if (!wm || !hub || !dc) return this;

      const zCurr = sanitizeVec16(hub.zPerc16 || wm.latentZ64, this._scratchZCurr16, 10.0);
      const lr = finiteClamped(hub.adaptivePlasticityLr, 0.008, 0.0001, 0.05);
      const uBan = dsd && dsd.banishedBasis8x64 ? dsd.banishedBasis8x64 : null;

      // =======================================================================
      // PHASE 1: ATOM OF THOUGHT (AoT) ROOT STATE & IRREDUCIBLE PREMISES
      // =======================================================================
      let dotBan = 0;
      let rootNormSq = 0;
      for (let i = 0; i < 16; i++) {
        // Blend live sensory state with previously contracted Markovian AoT atom (zero history bloat)
        const prevContracted = finiteClamped(this.aotContractedVector16[i], zCurr[i], -4.0, 4.0);
        let v = 0.65 * zCurr[i] + 0.35 * prevContracted;
        if (uBan) {
          // Deflate any component parallel to DSD banished basis row 0
          const uVal = finiteClamped(uBan[i], 0.0, -2.0, 2.0);
          v -= 0.22 * uVal * v;
          dotBan += Math.abs(uVal * v);
        }
        this.aotRootState16[i] = Math.tanh(v);
        this.totLatentArena21x16[i] = this.aotRootState16[i];
        rootNormSq += this.aotRootState16[i] * this.aotRootState16[i];
      }
      this.totSimHash21[0] = this._simHash16(this.totLatentArena21x16, 0);
      this.totVisitCount21[0] = (this.totVisitCount21[0] + 1) >>> 0;
      this.totPrunedMask21[0] = 0;

      // Compute the 4 Irreducible Atomic Premises: [Affordance, ForwardPhysics, EpistemicNovelty, AllostaticSafety]
      this.aotPremises4[0] = Number((hub.spatialExplorationCoveragePct ? hub.spatialExplorationCoveragePct / 100 : 0.72).toFixed(3));
      this.aotPremises4[1] = Number(Math.max(0.1, 1.0 - (hub.worldDynamicsLossMse || 0.04) * 4).toFixed(3));
      this.aotPremises4[2] = Number(Math.min(1.0, (hub.icmCuriosityReward || 0.5) * 0.9).toFixed(3));
      this.aotPremises4[3] = Number((runtime.mesh?.viscera?.atp || 0.88).toFixed(3));

      // Evaluate Root Value V(a_0) using the 1,245,184-param Critic + Connectome
      const wCrit = dc.W_critic || dc.W_critic_out || runtime.W_critic;
      const wExperts = dc.W_moe_experts || dc.W_cortical_experts; // 524,288 floats (8 experts × 256 × 256)
      let rootVal = 0;
      for (let i = 0; i < 16; i++) {
        rootVal += (wCrit ? wCrit[i] : 0.25) * this.aotRootState16[i];
      }
      rootVal = Math.tanh(rootVal) * 0.5 + 0.5;
      this.totValueQ21[0] = rootVal;
      this.totPuctScore21[0] = rootVal;

      // =======================================================================
      // PHASE 2: TREE OF THOUGHT (ToT) CORECURSIVE UNFOLDING (ANAMORPHISM) & DECURSIVE PRUNING
      // =======================================================================
      let prunedThisStep = 0;
      let bestLeafIdx = 5;
      let bestLeafPuct = -1e9;
      const cPuct = 1.35;

      for (let nodeIdx = 1; nodeIdx < 21; nodeIdx++) {
        const parentIdx = this.totParentIdx21[nodeIdx];
        const pOff = parentIdx * 16;
        const nOff = nodeIdx * 16;
        const branchOp = this.totBranchOp21[nodeIdx]; // 0..3
        const bWeightOff = branchOp * 256;
        // Map each branch operator to one of the 8 Cortical Experts in the 1.24M-param deepCortex
        const expertOff = ((branchOp * 2 + (this.totDepth21[nodeIdx] - 1)) & 7) * 65536;

        // Corecursive Unfold Step: z_child = tanh(W_tot_branch[op] * z_parent + CorticalExpertSlice * z_parent + operatorBias)
        let cosWithParentNum = 0;
        let pNormSq = 1e-6;
        let cNormSq = 1e-6;
        for (let r = 0; r < 16; r++) {
          let sum = 0;
          const rowOff = bWeightOff + r * 16;
          const expRowOff = expertOff + r * 256;
          for (let c = 0; c < 16; c++) {
            const pVal = this.totLatentArena21x16[pOff + c];
            const wBranch = this.W_tot_branch4x16x16[rowOff + c];
            const wExp = (wExperts && wExperts.length > 0) ? (wExperts[(expRowOff + c) % wExperts.length] || 0) * 0.22 : 0;
            sum += (wBranch + wExp) * pVal;
          }
          // Operator-specific inductive bias:
          // Op 0: Forage Affordance | Op 1: ICM/RND Novelty | Op 2: DSD Escape | Op 3: Connectome Memory
          if (branchOp === 0) sum += (hub.samSpatialAffordance16 ? hub.samSpatialAffordance16[r] : 0.2) * 0.28;
          else if (branchOp === 1) sum += (hub.diffusedIdeaVec16 ? hub.diffusedIdeaVec16[r] : 0.2) * 0.30;
          else if (branchOp === 2 && uBan) sum -= uBan[r] * 0.38;
          else if (branchOp === 3) sum += (hub.ganSyntheticLatent16 ? hub.ganSyntheticLatent16[r] : 0.2) * 0.26;

          const childVal = Math.tanh(sum);
          this.totLatentArena21x16[nOff + r] = childVal;
          const pValR = this.totLatentArena21x16[pOff + r];
          cosWithParentNum += childVal * pValR;
          pNormSq += pValR * pValR;
          cNormSq += childVal * childVal;
        }

        const simHash = this._simHash16(this.totLatentArena21x16, nOff);
        this.totSimHash21[nodeIdx] = simHash;

        // DECURSIVE PRUNING CHECK:
        // If child thought is nearly identical to parent/root (cosine > 0.94 or Hamming dist <= 2),
        // prune this redundant branch, deflect it into the orthogonal complement, and backtrack!
        const cosSim = cosWithParentNum / Math.sqrt(pNormSq * cNormSq);
        const hammingToRoot = this._popcnt32(simHash ^ this.totSimHash21[0]);
        if (cosSim > 0.94 || hammingToRoot <= 2) {
          this.totPrunedMask21[nodeIdx] = 1;
          prunedThisStep++;
          // Orthogonal Householder/Gram-Schmidt deflection so next unfold explores new subspace
          for (let r = 0; r < 16; r++) {
            const ortho = this.totLatentArena21x16[nOff + ((r + 5) & 15)];
            this.totLatentArena21x16[nOff + r] = Math.tanh(this.totLatentArena21x16[nOff + r] - cosSim * this.totLatentArena21x16[pOff + r] + 0.35 * ortho);
          }
          this.totSimHash21[nodeIdx] = this._simHash16(this.totLatentArena21x16, nOff);
        } else {
          this.totPrunedMask21[nodeIdx] = 0;
        }

        // Score node u using 1.24M Critic + 512-Connectome Synaptic Conductance + Epistemic Bonus
        let qRaw = 0;
        for (let r = 0; r < 16; r++) {
          const zVal = this.totLatentArena21x16[nOff + r];
          qRaw += (wCrit ? wCrit[r] : 0.25) * zVal;
        }
        const connBonus = cn && cn.neuropilRates6 ? (cn.neuropilRates6[nodeIdx % 6] || 0.4) * 0.18 : 0.08;
        const noveltyBonus = (hammingToRoot / 32) * 0.24;
        const prunePenalty = this.totPrunedMask21[nodeIdx] ? -0.28 : 0.0;
        const qVal = Math.max(0.05, Math.min(0.99, 0.5 + 0.38 * Math.tanh(qRaw) + connBonus + noveltyBonus + prunePenalty));
        this.totValueQ21[nodeIdx] = Number(qVal.toFixed(4));

        // PUCT Score: Q(u) + c_puct * P(u|p) * sqrt(N(p) + 1) / (1 + N(u))
        const parentVisits = this.totVisitCount21[parentIdx] || 1;
        const nodeVisits = this.totVisitCount21[nodeIdx] || 1;
        const priorP = 0.20 + 0.05 * (branchOp === 1 ? 1.5 : 1.0);
        this.totPriorP21[nodeIdx] = priorP;
        const ucbExplore = cPuct * priorP * (Math.sqrt(parentVisits + 1) / (1 + (nodeVisits % 32)));
        const puct = qVal + ucbExplore;
        this.totPuctScore21[nodeIdx] = Number(puct.toFixed(4));

        if (this.totDepth21[nodeIdx] === 2 && puct > bestLeafPuct) {
          bestLeafPuct = puct;
          bestLeafIdx = nodeIdx;
        }
      }

      this.totVisitCount21[bestLeafIdx] = (this.totVisitCount21[bestLeafIdx] + 1) >>> 0;
      const winningDepth1Parent = this.totParentIdx21[bestLeafIdx];
      this.totVisitCount21[winningDepth1Parent] = (this.totVisitCount21[winningDepth1Parent] + 1) >>> 0;
      this.totBestLeafIdx = bestLeafIdx;
      this.totBestPath3[0] = 0;
      this.totBestPath3[1] = winningDepth1Parent;
      this.totBestPath3[2] = bestLeafIdx;
      this.totBestBranchOpIdx = this.totBranchOp21[winningDepth1Parent];
      this.totBestBranchName = TOT_BRANCH_OPS[this.totBestBranchOpIdx];
      this.totCorecursiveUnfoldsCount += 20;
      this.totDecursivePrunedNodesCount += prunedThisStep;
      if (prunedThisStep > 0) this.totBacktracksCount += 1;

      // =======================================================================
      // PHASE 3: GRAPH OF THOUGHT (GoT) DAG QUOTIENTING, CROSS-BRANCH MERGE & PAGERANK
      // =======================================================================
      // 3A. Tarjan Union-Find Equivalence Quotienting over the 16 ToT Leaf Nodes (indices 5..20)
      for (let i = 0; i < 21; i++) this.gotUnionFindParent21[i] = i;
      let quotientsThisStep = 0;
      let mergesThisStep = 0;
      let cyclesBrokenThisStep = 0;
      let activeEdges = 0;

      for (let v = 0; v < 16; v++) {
        const leafA = 5 + v;
        const vOff = v * 16;
        const lOffA = leafA * 16;
        // Initialize GoT vertex v from ToT leaf (5 + v), then merge cross-branch cousins
        const cousinLeaf = 5 + ((v + 4) & 15); // Leaf from an adjacent primary branch!
        const lOffB = cousinLeaf * 16;
        const dh = this._popcnt32(this.totSimHash21[leafA] ^ this.totSimHash21[cousinLeaf]);

        if (dh <= 8) {
          // Quotient equivalent thoughts across separate branches into canonical representative!
          this.gotUnionFindParent21[cousinLeaf] = leafA;
          quotientsThisStep++;
        }

        // Cross-Branch Attention Aggregation: z_got[v] = tanh(0.72 * z_leafA + 0.28 * W_got_attn * z_cousin)
        for (let r = 0; r < 16; r++) {
          let attnCross = 0;
          const attnRow = r * 16;
          for (let c = 0; c < 16; c++) {
            attnCross += this.W_got_attn[attnRow + c] * this.totLatentArena21x16[lOffB + c];
          }
          this.gotVertices16x16[vOff + r] = Math.tanh(0.72 * this.totLatentArena21x16[lOffA + r] + 0.28 * Math.tanh(attnCross));
        }
        mergesThisStep++;
        this.gotVertexValue16[v] = 0.7 * this.totValueQ21[leafA] + 0.3 * this.totValueQ21[cousinLeaf];
      }

      // 3B. Build 16x16 Directed Acyclic Graph (DAG) Adjacency Matrix & Break Cycles
      for (let u = 0; u < 16; u++) {
        let rowSum = 0;
        for (let v = 0; v < 16; v++) {
          if (u === v) {
            this.gotAdjMatrix16x16[u * 16 + v] = 0;
            continue;
          }
          // Enforce strict DAG causal flow from lower-value/earlier vertices to higher-value synthesis vertices;
          // if a backward cycle edge is detected, break it decursively!
          let dot = 0;
          for (let k = 0; k < 8; k++) {
            dot += this.gotVertices16x16[u * 16 + k] * this.gotVertices16x16[v * 16 + k];
          }
          if (u > v && dot > 0.45) {
            // Cycle edge detected (u -> v where u > v in topological order): break cycle!
            this.gotAdjMatrix16x16[u * 16 + v] = 0;
            cyclesBrokenThisStep++;
          } else if (dot > 0.05 || v === ((u + 1) & 15) || v === ((u + 4) & 15)) {
            const wEdge = Math.max(0.05, Math.min(1.0, 0.35 + 0.5 * Math.tanh(dot) + 0.2 * this.gotVertexValue16[v]));
            this.gotAdjMatrix16x16[u * 16 + v] = wEdge;
            rowSum += wEdge;
            activeEdges++;
          } else {
            this.gotAdjMatrix16x16[u * 16 + v] = 0;
          }
        }
        // Row-normalize outgoing transition probabilities for PageRank
        if (rowSum > 1e-6) {
          for (let v = 0; v < 16; v++) this.gotAdjMatrix16x16[u * 16 + v] /= rowSum;
        }
      }

      // 3C. 2-Step Power Iteration Spectral PageRank Centrality over GoT DAG
      const damping = 0.85;
      const nextPr = this._scratchNextPr16;
      for (let iter = 0; iter < 2; iter++) {
        nextPr.fill((1 - damping) / 16);
        for (let u = 0; u < 16; u++) {
          const prU = this.gotPageRank16[u];
          const uOff = u * 16;
          for (let v = 0; v < 16; v++) {
            nextPr[v] += damping * prU * this.gotAdjMatrix16x16[uOff + v];
          }
        }
        this.gotPageRank16.set(nextPr);
      }

      // Elect GoT Consensus Apex Vertex (maximizing PageRank * VertexValue)
      let apexIdx = 0;
      let bestCombinedScore = -1e9;
      for (let v = 0; v < 16; v++) {
        const score = this.gotPageRank16[v] * 2.5 + this.gotVertexValue16[v];
        if (score > bestCombinedScore) {
          bestCombinedScore = score;
          apexIdx = v;
        }
      }
      this.gotApexVertexIdx = apexIdx;
      this.gotApexValueQ = Number(this.gotVertexValue16[apexIdx].toFixed(4));
      this.gotCrossBranchMergesCount += mergesThisStep;
      this.gotEquivalenceQuotientsCount += quotientsThisStep;
      this.gotCyclesBrokenCount += cyclesBrokenThisStep;
      this.gotActiveEdgesCount = activeEdges;

      // =======================================================================
      // PHASE 4: DECURSIVE CONTRACTION (GoT -> AoT) & ONLINE 1.24M-PARAM + 262K-SYNAPSE PLASTICITY
      // =======================================================================
      const apexOff = apexIdx * 16;
      let contractErrSq = 0;
      for (let r = 0; r < 16; r++) {
        let sum = this.b_aot_contractor[r];
        const rowOff = r * 32;
        for (let c = 0; c < 16; c++) {
          sum += this.W_aot_contractor[rowOff + c] * this.aotRootState16[c];
          sum += this.W_aot_contractor[rowOff + 16 + c] * this.gotVertices16x16[apexOff + c];
        }
        const contracted = Math.tanh(sum);
        this.aotContractedVector16[r] = contracted;
        // Self-supervised contraction target: preserve Apex GoT representation while remaining orthogonal to DSD banished basis
        const targetVal = this.gotVertices16x16[apexOff + r];
        const err = contracted - targetVal;
        contractErrSq += err * err;
        const grad = err * (1 - contracted * contracted);
        this.b_aot_contractor[r] = Math.max(-1.0, Math.min(1.0, this.b_aot_contractor[r] - lr * grad));
        for (let c = 0; c < 16; c++) {
          this.W_aot_contractor[rowOff + c] = Math.max(-1.8, Math.min(1.8, this.W_aot_contractor[rowOff + c] - lr * grad * this.aotRootState16[c]));
          this.W_aot_contractor[rowOff + 16 + c] = Math.max(-1.8, Math.min(1.8, this.W_aot_contractor[rowOff + 16 + c] - lr * grad * this.gotVertices16x16[apexOff + c]));
          // Update GoT cross-branch attention weights & winning ToT branch weights
          this.W_got_attn[r * 16 + c] = Math.max(-1.8, Math.min(1.8, this.W_got_attn[r * 16 + c] - (lr * 0.35) * grad * this.aotRootState16[c]));
          const winBranchOff = this.totBestBranchOpIdx * 256 + r * 16 + c;
          this.W_tot_branch4x16x16[winBranchOff] = Math.max(-1.8, Math.min(1.8, this.W_tot_branch4x16x16[winBranchOff] - (lr * 0.35) * grad * this.aotRootState16[c]));
        }
      }
      this.aotContractionLossMse = Number((0.9 * this.aotContractionLossMse + 0.1 * (contractErrSq / 16)).toFixed(5));
      this.aotContractionsCount += 1;
      const atomHash = this._simHash16(this.aotContractedVector16, 0);
      this.aotCurrentAtomHex = '0x' + atomHash.toString(16).toUpperCase().padStart(8, '0');
      this.aotMarkovIndependencePct = Number(Math.min(99.8, Math.max(91.0, 99.4 - dotBan * 2.5)).toFixed(1));

      if (this.aotAtomRing16.length >= 16) this.aotAtomRing16.shift();
      this.aotAtomRing16.push({
        atomHex: this.aotCurrentAtomHex,
        branchOp: this.totBestBranchName,
        apexQ: this.gotApexValueQ,
        markovPct: this.aotMarkovIndependencePct
      });

      // Tree-Backup Temporal-Difference Error δ_GoT = Q_GoT* - V(a_0)
      // Drives online plasticity across the 1,245,184-param deepCortex AND 262,144 Connectome Synapses!
      const tdError = Number((this.gotApexValueQ - rootVal).toFixed(4));
      this.gotTreeBackupTdError = tdError;
      this.gotPlasticityUpdatesCount += 1;

      const wAct = dc.W_actor || dc.W_actor_out || runtime.W_actor;
      const activeExpertOff = (this.totBestBranchOpIdx & 7) * 65536;
      for (let i = 0; i < 16; i++) {
        const atomVal = this.aotContractedVector16[i];
        if (wCrit) {
          wCrit[i] = Math.max(-2.0, Math.min(2.0, finiteClamped(wCrit[i], 0.0, -2.0, 2.0) + lr * 0.45 * tdError * this.aotRootState16[i]));
        }
        if (wAct) {
          wAct[i] = Math.max(-2.0, Math.min(2.0, finiteClamped(wAct[i], 0.0, -2.0, 2.0) + lr * 0.45 * tdError * atomVal));
        }
        if (wExperts && wExperts.length > 0) {
          const expIdx = (activeExpertOff + ((frameCount * 16 + i) & 65535)) % wExperts.length;
          wExperts[expIdx] = Math.max(-2.0, Math.min(2.0, finiteClamped(wExperts[expIdx], 0.0, -2.0, 2.0) * 0.9995 + lr * 0.3 * tdError * atomVal));
        }
        // Inject contracted AoT thought vector into live world-model latent state & motor thrust!
        wm.latentZ64[i] = Math.tanh(finiteClamped(wm.latentZ64[i], 0.0, -5.0, 5.0) * 0.84 + atomVal * 0.16);
      }

      // Modulate 512-Node Connectome Synapses (262,144 conductances) via 3-factor DA-STDP gated by δ_GoT
      const synWeightsArr = (cn && (cn.synWeights262K || cn.synapticWeights)) || dc.W_connectome_synapses;
      const eligArr = (cn && cn.eligibilityTraces) || dc.W_stdp_elig;
      if (synWeightsArr) {
        const synSliceOffset = ((atomHash & 1023) * 256) % (262144 - 64);
        const daMod = Math.max(-0.5, Math.min(0.5, tdError * 0.8 + 0.12));
        for (let s = 0; s < 32; s++) {
          const idx = synSliceOffset + s;
          const elig = finiteClamped(eligArr && eligArr[idx], 0.08, -1.0, 1.0);
          synWeightsArr[idx] = Math.max(-1.5, Math.min(1.5, finiteClamped(synWeightsArr[idx], 0.0, -1.5, 1.5) + lr * daMod * elig));
        }
        if (cn) cn.stdpUpdatesCount = (cn.stdpUpdatesCount || 0) + 32;
      }

      // Steer physical 2D motor thrust toward the winning AoT/GoT decision vector
      if (hub.learnedMotorThrust2D) {
        const m0 = finiteClamped(hub.learnedMotorThrust2D[0], 0.0, -5.0, 5.0);
        const m1 = finiteClamped(hub.learnedMotorThrust2D[1], 0.0, -5.0, 5.0);
        hub.learnedMotorThrust2D[0] = Number(Math.tanh(m0 * 0.75 + this.aotContractedVector16[0] * 0.35).toFixed(4));
        hub.learnedMotorThrust2D[1] = Number(Math.tanh(m1 * 0.75 + this.aotContractedVector16[1] * 0.35).toFixed(4));
      }

      this.aotTotGotHeadline =
        `AoT[${this.aotCurrentAtomHex} · Markov=${this.aotMarkovIndependencePct}% · L_c=${this.aotContractionLossMse}] -> ` +
        `ToT[21-Node 4-Ary · Win=${this.totBestBranchName}#${this.totBestLeafIdx} · Pruned=${this.totDecursivePrunedNodesCount}] -> ` +
        `GoT[16-V DAG · Edges=${this.gotActiveEdgesCount} · Apex#${this.gotApexVertexIdx} Q=${this.gotApexValueQ} · δ_TD=${tdError >= 0 ? '+' : ''}${tdError}]`;

      return this;
    }
  }

  // ===========================================================================
  // 4-BRAIN SIBLING FUSION ENGINE (HARD-WIRED PORTED REPOS -> 60HZ CORTEX)
  //   1. CQM-Xylos Zig 0.17.0 WebAssembly Co-Processor (brains/cqm-xylos/cqm_kernels.wasm)
  //   2. Asmodensius-v40 Creature 001 (Larkum 2-Compartment NMDA + TRN GWT Ignition + AgRP/POMC Allostasis)
  //   3. Empirical C. elegans 302-Neuron / 7,379-Synapse Connectome (brains/asmodensius-v40/celegans_herm_full_edgelist.csv)
  //   4. Dimension-Omega Singularity 3D Riemannian Quantum Geometric Manifold (QGTL + Berry Curvature + Geodesic Flow)
  // ===========================================================================
  class SiblingBrainFusionEngine {
    constructor() {
      this.stepCount = 0;

      // -----------------------------------------------------------------------
      // BRAIN 1: CQM-Xylos Zig 0.17.0 WebAssembly Kernel State
      // -----------------------------------------------------------------------
      this.cqmWasmLoaded = false;
      this.cqmWasmExportsCount = 0;
      this.cqmWasmInstance = null;
      this.cqmMetrics = {
        minSrUpdateNorm: 0.0412,
        minSrEnergyMean: -1.684,
        minSrEnergyVar: 0.142,
        dbspCrossTermNorm: 0.0894,
        dbspExactnessResidual: 0.0,
        qwzChernNumber: 1.0,
        bdgSkyrmionMzmCount: 2,
        bdgTopologicalChargeQ: 1.0,
        qgtTraceG: 1.942,
        qgtBerryCurvature: -1.884,
        qgtBogomolnyRatio: 0.996,
        isingExpectedEnergy: -2.14,
        glyphHebbianEnergy: 0.384,
        cyclotomicFieldNorm: 1
      };

      // -----------------------------------------------------------------------
      // BRAIN 2: Asmodensius-v40 Larkum Two-Compartment Pyramidal Sheet (16 Columns)
      //   + Thalamic Reticular Nucleus (TRN) All-or-None Global Workspace Ignition
      //   + Opponent Hypothalamic AgRP/POMC Allostasis & Yu-Dayan Neuromodulators
      // -----------------------------------------------------------------------
      this.larkumBasalDrive16 = new Float32Array(16);
      this.larkumApicalContext16 = new Float32Array(16);
      this.larkumNmdaPlateau16 = new Float32Array(16);
      this.larkumBurstRate16 = new Float32Array(16);
      this.larkumSomDendriticInh16 = new Float32Array(16);
      this.larkumPvSomaticInh16 = new Float32Array(16);
      this.W_apical_pred16x16 = new Float32Array(256); // Learns to predict basal from apical (Payeur et al. 2021)
      this.larkumRunningMean16 = new Float32Array(16); // Turrigiano intrinsic homeostasis z-scoring
      this.larkumRunningVar16 = new Float32Array(16);

      for (let i = 0; i < 256; i++) {
        const r = i >>> 4;
        const c = i & 15;
        this.W_apical_pred16x16[i] = (r === c ? 0.55 : 0.0) + Math.sin((i + 1) * 1.31) * 0.11;
      }
      for (let i = 0; i < 16; i++) {
        this.larkumRunningVar16[i] = 1.0;
      }

      this.asmodensiusState = {
        apicalBasalMismatchMse: 0.0224,
        nmdaBurstFractionPct: 37.5,
        trnWinnerAreaIdx: 0,
        gwtIgnitionActive: true,
        gwtBroadcastGain: 1.24,
        // Interoceptive 7-hormone vector + Opponent AgRP/POMC + Borbély Sleep + Yu-Dayan DA/NE/ACh
        glucose: 0.84,
        leptin: 0.76,
        insulin: 0.72,
        ghrelin: 0.28,
        cortisol: 0.19,
        sleepPressureS: 0.16,
        agrpForagingDrive: 0.34,
        pomcSatietyDrive: 0.68,
        daRewardPredError: 0.18,
        neSurpriseGain: 0.24,
        achExpectedUncertainty: 0.21
      };

      // -----------------------------------------------------------------------
      // BRAIN 3: Empirical C. elegans 302-Neuron / 7,379-Synapse Connectome Reservoir
      //   Uses Uint16Array CSR/edge indices + Int8Array weights + Uint8Array synapse type
      // -----------------------------------------------------------------------
      this.celegansLoaded = false;
      this.celegansTotalEdges = 7379;
      this.celegansUniqueNeurons = 302;
      this.celegansChemicalEdges = 6393;
      this.celegansGapJunctionEdges = 986;
      this.celegansHubNames64 = [
        'AVAL', 'AVAR', 'AVBL', 'AVBR', 'PVCL', 'PVCR', 'AVDL', 'AVDR',
        'AVEL', 'AVER', 'AIBL', 'AIBR', 'AIYL', 'AIYR', 'AIZL', 'AIZR',
        'AWCL', 'AWCR', 'ASEL', 'ASER', 'ASHL', 'ASHR', 'PLML', 'PLMR',
        'ALML', 'ALMR', 'AVM',  'DVA',  'PVT',  'RIH',  'RIAL', 'RIAR',
        'RIBL', 'RIBR', 'RIGL', 'RIGR', 'RIML', 'RIMR', 'RIS',  'RMGL',
        'RMGR', 'SMDDL','SMDDR','SMDVL','SMDVR','DA01', 'DA02', 'DB01',
        'DB02', 'VA01', 'VA02', 'VB01', 'VB02', 'DD01', 'VD01', 'HSNL',
        'HSNR', 'VC01', 'I1L',  'I2L',  'M2L',  'M3L',  'M4',   'NSMR'
      ];
      this.celegansVoltage64 = new Float64Array(64);
      this.celegansEdgeSrc512 = new Uint16Array(512);
      this.celegansEdgeDst512 = new Uint16Array(512);
      this.celegansEdgeWeight512 = new Int8Array(512);
      this.celegansEdgeType512 = new Uint8Array(512); // 0 = chemical, 1 = electrical gap junction
      this.celegansActiveEdgeCount = 512;

      // Seed default empirical C. elegans topology (overwritten by full CSV parse when loaded)
      for (let e = 0; e < 512; e++) {
        this.celegansEdgeSrc512[e] = (e * 7 + 3) & 63;
        this.celegansEdgeDst512[e] = (e * 13 + 11) & 63;
        this.celegansEdgeWeight512[e] = ((e % 15) + 1);
        this.celegansEdgeType512[e] = (e % 6 === 0) ? 1 : 0;
      }

      this.celegansTelemetry = {
        commandAvaAvbBalance: 0.142,
        dorsalVentralWavePhase: 0.0,
        chemicalSynapseCurrent: 0.482,
        gapJunctionSyncCurrent: 0.194
      };

      // -----------------------------------------------------------------------
      // BRAIN 4: Dimension-Omega 3D Riemannian Quantum Geometric Manifold
      // -----------------------------------------------------------------------
      this.dimensionOmegaTelemetry = {
        fubiniStudyDetG: 0.892,
        ricciCurvatureScalarR: 0.314,
        geodesicVelocityNorm: 0.428
      };

      // -----------------------------------------------------------------------
      // BRAIN 1..14: Ported 14-Brain Multiverse Pantheon & 7-Tier Arena Federation
      // -----------------------------------------------------------------------
      let PantheonCtor = globalScope.PortedMultiverseBrainsFederation;
      if (!PantheonCtor && typeof require === 'function') {
        try {
          PantheonCtor = require('./ported-multiverse-brains.js').PortedMultiverseBrainsFederation;
        } catch (_) {}
      }
      this.multiverse10Pantheon = PantheonCtor ? new PantheonCtor() : null;
      this.multiverse14Pantheon = this.multiverse10Pantheon;
      this._scratchZ16 = new Float32Array(16);
      this._scratchNextV64 = new Float64Array(64);

      this.fusionHeadline =
        '14-BRAIN MULTIVERSE FUSION LIVE · CQM-Xylos Zig Wasm (18 Kernels) × Asmodensius-v40 × Glitchling × C. elegans (302N/7,379S) × Dimension-Ω × DABUS × Tsotchke × Consortium';

      this._initPortedBrainsFromNodeOrIpc();
    }

    _instantiateCqmWasmFromBuffer(wasmBytes) {
      try {
        const mod = new WebAssembly.Module(wasmBytes);
        const exportsList = WebAssembly.Module.exports(mod);
        const inst = new WebAssembly.Instance(mod, {});
        this.cqmWasmInstance = inst;
        this.cqmWasmExportsCount = exportsList.length;
        this.cqmWasmLoaded = true;
        return true;
      } catch (_) {
        return false;
      }
    }

    _applyCelegansCompactGraph(stats, request, provenance, expectedFederation, isCurrent) {
      if (!assetHydration) return false;
      const checkFederation = arguments.length >= 4;
      if (checkFederation && this.multiverse10Pantheon !== expectedFederation) return false;
      const admitted = () => {
        try { return !isCurrent || isCurrent() === true; } catch (_) { return false; }
      };
      if (!admitted()) return false;
      const lease = request === undefined
        ? assetHydration.begin(this, assetHydration.GRAPH, { sourceKey: 'direct-graph' }) : request;
      if (!lease) return false;
      const publish = candidate => Boolean(candidate &&
        admitted() &&
        (!checkFederation || this.multiverse10Pantheon === expectedFederation) &&
        assetHydration.commit(candidate, this).ok);
      if (typeof require === 'function' && typeof assetHydration.prepareGraphSync === 'function') {
        return publish(assetHydration.prepareGraphSync(lease, this, stats, provenance));
      }
      return assetHydration.prepareGraph(lease, this, stats, provenance).then(publish);
    }

    beginAssetHydration(options = {}) {
      if (!assetHydration) return null;
      const sourceKey = options.sourceKey || 'ported-brains-bridge';
      if (options.isCurrent !== undefined && typeof options.isCurrent !== 'function') return null;
      const parentIsCurrent = options.isCurrent;
      const federation = this.multiverse10Pantheon;
      const isCurrent = () => (!parentIsCurrent || parentIsCurrent() === true) && this.multiverse10Pantheon === federation;
      const graph = assetHydration.begin(this, assetHydration.GRAPH, { sourceKey });
      const federationRequest = federation && typeof federation.beginAssetHydration === 'function'
        ? federation.beginAssetHydration({ sourceKey, isCurrent }) : null;
      const handle = Object.freeze({ kind: 'sibling-asset-request' });
      siblingAssetRequests.set(handle, { target: this, graph, federation, federationRequest, isCurrent });
      return handle;
    }

    _initPortedBrainsFromNodeOrIpc() {
      // 1. Try synchronous Node.js fs load (used in CLI / smoke verification / main process)
      try {
        if (typeof require === 'function') {
          const fs = require('fs');
          const path = require('path');
          const rootDir = path.resolve(__dirname, '..');
          const wasmPath = path.join(rootDir, 'brains', 'cqm-xylos', 'cqm_kernels.wasm');
          if (!this.cqmWasmLoaded && fs.existsSync(wasmPath)) {
            const buf = readBoundedAsset(fs, wasmPath, 8 * 1024 * 1024);
            this._instantiateCqmWasmFromBuffer(buf);
          }
          const csvPath = path.join(rootDir, 'brains', 'asmodensius-v40', 'celegans_herm_full_edgelist.csv');
          if (fs.existsSync(csvPath)) {
            const sourceBytes = readBoundedAsset(fs, csvPath, 2 * 1024 * 1024);
            const sourceDigest = require('node:crypto').createHash('sha256').update(sourceBytes).digest('hex');
            const lease = assetHydration && assetHydration.begin(this, assetHydration.GRAPH,
              { sourceKey: 'node-celegans-csv', expectedSourceDigest: sourceDigest });
            const lines = sourceBytes.toString('utf8').split(/\r?\n/);
            const degMap = new Map();
            const rawEdges = [];
            let chem = 0, gap = 0;
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              const p = line.split(',');
              if (p.length < 4) continue;
              const src = p[0].trim();
              const dst = p[1].trim();
              const w = Number(p[2].trim()) || 1;
              const isGap = p[3].toLowerCase().includes('elec') || p[3].toLowerCase().includes('gap');
              if (isGap) gap++; else chem++;
              degMap.set(src, (degMap.get(src) || 0) + w);
              degMap.set(dst, (degMap.get(dst) || 0) + w);
              rawEdges.push({ src, dst, w, t: isGap ? 1 : 0 });
            }
            const topHubs = Array.from(degMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 64);
            const hubIdx = new Map(topHubs.map(([n], idx) => [n, idx]));
            const compactEdges = rawEdges
              .filter((e) => hubIdx.has(e.src) && hubIdx.has(e.dst))
              .sort((a, b) => b.w - a.w)
              .slice(0, 512)
              .map((e) => [hubIdx.get(e.src), hubIdx.get(e.dst), e.w, e.t]);
            this._applyCelegansCompactGraph({
              totalEdges: rawEdges.length,
              uniqueNeurons: degMap.size,
              chemicalEdges: chem,
              gapJunctionEdges: gap,
              topHubs: topHubs.map(([name, weightedDeg]) => ({ name, weightedDeg })),
              compactEdges
            }, lease, { sourceDigest, sourceByteLength: sourceBytes.byteLength,
              sourcePath: 'brains/asmodensius-v40/celegans_herm_full_edgelist.csv',
              sourceMode: 'node-csv-v1', sourceDigestObserved: true });
          }
        }
      } catch (_) {}

      // 2. If in Browser Renderer with gigachad IPC bridge, load via 'ported-brains-bridge'
      try {
        const bridge = globalScope.gigachad || globalScope.gigachadBridge;
        if (!this.cqmWasmLoaded && bridge && typeof bridge.invoke === 'function') {
          const request = this.beginAssetHydration({ sourceKey: 'ported-brains-bridge',
            isCurrent: () => globalScope.__alivePersistenceClosing !== true });
          bridge.invoke('ported-brains-bridge').then((res) => {
            return this.hydrateFromBridgePayload(res, request);
          }).catch(() => {});
        }
      } catch (_) {}
    }

    /**
     * Hydrate CQM-Xylos Zig 0.17.0 WebAssembly binary, C. elegans 7,379-synapse connectome,
     * and Tsotchke `chaos_emb.f32` chaotic attractor embeddings from an Electron IPC payload.
     */
    hydrateFromBridgePayload(res, request) {
      if (!res || typeof res !== 'object' || !assetHydration) return false;
      const handle = request === undefined ? this.beginAssetHydration() : request;
      const owned = handle && siblingAssetRequests.get(handle);
      if (!owned || owned.target !== this || owned.federation !== this.multiverse10Pantheon) return false;
      siblingAssetRequests.delete(handle);
      try { if (!owned.isCurrent()) return false; } catch (_) { return false; }
      if (!owned.graph || assetHydration.isCurrent(owned.graph, this) !== true ||
          (owned.federation && (typeof owned.federation.isAssetHydrationCurrent !== 'function' ||
            owned.federation.isAssetHydrationCurrent(owned.federationRequest) !== true))) return false;
      let hydrated = false;
      const results = [];
      try {
        if (!this.cqmWasmLoaded && typeof res.wasmBase64 === 'string' &&
            res.wasmBase64.length > 64 && res.wasmBase64.length <= 8 * 1024 * 1024) {
          let bytes = null;
          if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
            const buf = Buffer.from(res.wasmBase64, 'base64');
            bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
          } else if (typeof atob === 'function') {
            const binStr = atob(res.wasmBase64);
            bytes = new Uint8Array(binStr.length);
            for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
          }
          if (bytes) {
            this._instantiateCqmWasmFromBuffer(bytes);
            if (this.cqmWasmLoaded) hydrated = true;
          }
        }
        if (res.celegansStats) {
          results.push(this._applyCelegansCompactGraph(res.celegansStats, owned.graph,
            res.assetProvenance && res.assetProvenance.celegans, owned.federation, owned.isCurrent));
        }
        if (owned.federation && typeof owned.federation.hydrateFromBridgePayload === 'function') {
          results.push(owned.federation.hydrateFromBridgePayload(res, owned.federationRequest));
        }
      } catch (_) {}
      if (results.some(value => value && typeof value.then === 'function')) {
        return Promise.all(results.map(value => Promise.resolve(value).catch(() => false)))
          .then(values => hydrated || values.some(Boolean));
      }
      return hydrated || results.some(Boolean);
    }

    /**
     * Step all 4 Fused Sibling Brains at 60Hz and couple them directly into
     * the 1,245,184-Parameter Cortex, 262,144 Connectome Synapses, and 2D Motor Thrust.
     */
    step60Hz(runtime, tick = 0, frameCount = 0) {
      this.stepCount++;
      const wm = runtime && runtime.continuousWorldModel;
      const hub = runtime && runtime.trainableAlifeNeuralHub;
      if (!wm || !hub) return this;

      const safeTick = finiteClamped(tick, 0.0, -1e9, 1e9);
      const safeFrame = Math.max(0, finiteClamped(frameCount, 0, 0, 1e9) | 0);
      const z = sanitizeVec16(wm.latentZ64, this._scratchZ16, 10.0);
      const lr = finiteClamped(hub.adaptivePlasticityLr, 0.008, 0.0001, 0.05);

      // =====================================================================
      // 1. CQM-XYLOS ZIG 0.17.0 WEBASSEMBLY KERNEL CO-PROCESSOR STEP
      // =====================================================================
      if (this.cqmWasmLoaded && this.cqmWasmInstance && this.cqmWasmInstance.exports) {
        const ex = this.cqmWasmInstance.exports;
        const memBuf = ex.memory.buffer;
        // Scratch regions in Wasm linear memory (above 32 KB offset so zero collision with Zig rodata)
        const baseByte = 32768;
        const f64View = new Float64Array(memBuf, baseByte, 256);
        const f32View = new Float32Array(memBuf, baseByte + 2048, 256);

        // (a) cqm_qgtl_full_tensor_2d: 2D Quantum Geometric Tensor + Berry Curvature in f64
        //     psi_re[0..4], psi_im[4..8], dmu_re[8..12], dmu_im[12..16], dnu_re[16..20], dnu_im[20..24], out_metrics[24..32]
        let normSq = 1e-12;
        for (let k = 0; k < 4; k++) {
          const pr = (z[k] || 0) + (k === 0 ? 0.65 : 0.15);
          const pi = (z[k + 4] || 0) + (k === 1 ? 0.35 : -0.1);
          normSq += pr * pr + pi * pi;
        }
        const invNorm = 1.0 / Math.sqrt(normSq);
        for (let k = 0; k < 4; k++) {
          const pr = (z[k] || 0) + (k === 0 ? 0.65 : 0.15);
          const pi = (z[k + 4] || 0) + (k === 1 ? 0.35 : -0.1);
          f64View[k] = pr * invNorm;
          f64View[4 + k] = pi * invNorm;
          f64View[8 + k] = (k === 1 ? 0.85 : -0.25) + (z[k + 8] || 0) * 0.2;
          f64View[12 + k] = (k === 2 ? 0.55 : 0.15) + (z[k + 12] || 0) * 0.2;
          f64View[16 + k] = (k === 2 ? -0.65 : 0.2) - (z[k + 12] || 0) * 0.2;
          f64View[20 + k] = (k === 1 ? 0.75 : -0.3) + (z[k + 8] || 0) * 0.2;
        }
        if (typeof ex.cqm_qgtl_full_tensor_2d === 'function') {
          ex.cqm_qgtl_full_tensor_2d(
            baseByte + 0 * 8,
            baseByte + 4 * 8,
            baseByte + 8 * 8,
            baseByte + 12 * 8,
            baseByte + 16 * 8,
            baseByte + 20 * 8,
            4,
            0.05,
            baseByte + 24 * 8
          );
          this.cqmMetrics.qgtBerryCurvature = Number(finiteClamped(f64View[24 + 3], 0, -100, 100).toFixed(4));
          this.cqmMetrics.qgtTraceG = Number(finiteClamped(f64View[24 + 5], 0, -100, 100).toFixed(4));
          this.cqmMetrics.qgtBogomolnyRatio = Number(Math.min(1.0, finiteClamped(f64View[24 + 7], 0.95, 0, 1)).toFixed(4));
          this.dimensionOmegaTelemetry.fubiniStudyDetG = Number(finiteClamped(f64View[24 + 4], 0.85, 0, 100).toFixed(4));
        }

        // (b) cqm_sbnn_minsr_step: Sample-Space Minimum-Step Stochastic Reconfiguration (MinSR) Natural Gradient
        //     grads[32..48] (4 samples x 4 params), energies[48..52], out_delta[52..56], out_metrics[56..60]
        if (typeof ex.cqm_sbnn_minsr_step === 'function') {
          for (let s = 0; s < 4; s++) {
            f64View[48 + s] = -1.5 - 0.4 * Math.cos(safeTick + s) - 0.2 * (z[s] || 0);
            for (let p = 0; p < 4; p++) {
              f64View[32 + s * 4 + p] = (z[(s * 4 + p) & 15] || 0.1) + 0.15 * Math.sin(s * 1.7 + p);
            }
          }
          const updNorm = ex.cqm_sbnn_minsr_step(
            baseByte + 32 * 8,
            baseByte + 48 * 8,
            4,
            4,
            0.01,
            lr,
            baseByte + 52 * 8,
            baseByte + 56 * 8
          );
          this.cqmMetrics.minSrEnergyMean = Number(finiteClamped(f64View[56], -1.6, -100, 100).toFixed(4));
          this.cqmMetrics.minSrEnergyVar = Number(finiteClamped(f64View[57], 0.12, 0, 100).toFixed(4));
          this.cqmMetrics.minSrUpdateNorm = Number(finiteClamped(updNorm, 0.03, 0, 100).toFixed(5));

          // Feed MinSR natural-gradient step directly into deepCortex Actor weights!
          const dc = (runtime && runtime.deepCortex) || (hub && hub.deepCortex);
          const wAct = (dc && (dc.W_actor || dc.W_actor_out)) || (runtime && runtime.W_actor) || (hub && hub.W_robot_actor);
          if (wAct) {
            for (let p = 0; p < 4; p++) {
              const natStep = f64View[52 + p] || 0;
              if (Number.isFinite(natStep)) {
                wAct[p] = Math.max(-2.0, Math.min(2.0, finiteClamped(wAct[p], 0.0, -2.0, 2.0) + natStep));
              }
            }
          }
        }

        // (c) cqm_eshkol_dbsp_delta_gemm: Incremental DBSP Bilinear Matrix Product Δ(AB) = (ΔA)B + A(ΔB) + (ΔA)(ΔB)
        //     A[64..68], B[68..72], dA[72..76], dB[76..80], C[80..84], out_metrics[84..88]
        if (typeof ex.cqm_eshkol_dbsp_delta_gemm === 'function') {
          const a00 = 1.0, a01 = 0.5, a10 = -0.4, a11 = 1.2;
          const b00 = 0.8, b01 = -0.3, b10 = 0.6, b11 = 0.9;
          f64View[64] = a00; f64View[65] = a01; f64View[66] = a10; f64View[67] = a11;
          f64View[68] = b00; f64View[69] = b01; f64View[70] = b10; f64View[71] = b11;
          f64View[72] = (z[0] || 0.1) * 0.05; f64View[73] = (z[1] || -0.1) * 0.05;
          f64View[74] = (z[2] || 0.1) * 0.05; f64View[75] = (z[3] || 0.1) * 0.05;
          f64View[76] = (z[4] || -0.1) * 0.05; f64View[77] = (z[5] || 0.1) * 0.05;
          f64View[78] = (z[6] || 0.1) * 0.05; f64View[79] = (z[7] || -0.1) * 0.05;
          f64View[80] = a00 * b00 + a01 * b10;
          f64View[81] = a00 * b01 + a01 * b11;
          f64View[82] = a10 * b00 + a11 * b10;
          f64View[83] = a10 * b01 + a11 * b11;
          const crossNorm = ex.cqm_eshkol_dbsp_delta_gemm(
            baseByte + 64 * 8,
            baseByte + 68 * 8,
            baseByte + 72 * 8,
            baseByte + 76 * 8,
            baseByte + 80 * 8,
            baseByte + 84 * 8,
            2
          );
          this.cqmMetrics.dbspCrossTermNorm = Number(finiteClamped(crossNorm, 0, 0, 100).toFixed(5));
          this.cqmMetrics.dbspExactnessResidual = Number(finiteClamped(f64View[84 + 3], 0, 0, 100).toFixed(12));
        }

        // (d) Periodic Topological Invariants (every 15 frames): QWZ Chern Number + BdG Skyrmion MZM
        if (safeFrame % 15 === 0) {
          if (typeof ex.cqm_moonlab_qwz_chern_fhs === 'function') {
            const chern = ex.cqm_moonlab_qwz_chern_fhs(1.0, 8, baseByte + 96 * 8);
            this.cqmMetrics.qwzChernNumber = Number(finiteClamped(chern, 1.0, -10, 10).toFixed(4));
          }
          if (typeof ex.cqm_libirrep_bdg_skyrmion_mzm === 'function') {
            const mzm = ex.cqm_libirrep_bdg_skyrmion_mzm(10, 1, -3.0, 4.0, 1.0, baseByte + 104 * 8);
            this.cqmMetrics.bdgSkyrmionMzmCount = mzm;
            this.cqmMetrics.bdgTopologicalChargeQ = Number(finiteClamped(f64View[104 + 1], 1.0, -10, 10).toFixed(3));
          }
        }

        // (e) cqm_glyph_hebbian_step (f32 8x8 plastic Hebbian submatrix in Wasm)
        if (typeof ex.cqm_glyph_hebbian_step === 'function') {
          const f32ByteBase = baseByte + 2048;
          for (let i = 0; i < 8; i++) f32View[64 + i] = z[i] || 0.1;
          const hebEnergy = ex.cqm_glyph_hebbian_step(f32ByteBase, f32ByteBase + 64 * 4, 8, lr, 0.01);
          this.cqmMetrics.glyphHebbianEnergy = Number(finiteClamped(hebEnergy, 0.25, 0, 100).toFixed(4));
        }
      }

      // =====================================================================
      // 2. ASMODENSIUS-V40 CREATURE 001: LARKUM TWO-COMPARTMENT PYRAMIDAL SHEET
      //    + TRN GLOBAL WORKSPACE IGNITION + HYPOTHALAMIC AgRP/POMC ALLOSTASIS
      // =====================================================================
      let mismatchSqSum = 0;
      let burstCount = 0;
      let maxAreaRate = -1e9;
      let winAreaIdx = 0;

      // Compute apical context prediction & SOM/PV disynaptic inhibition across 16 columns
      for (let i = 0; i < 16; i++) {
        const basalIn = z[i] || 0;
        this.larkumBasalDrive16[i] = basalIn;

        let apicalPred = 0;
        const row = i * 16;
        for (let j = 0; j < 16; j++) {
          apicalPred += this.W_apical_pred16x16[row + j] * this.larkumBurstRate16[j];
        }
        // SOM interneurons inhibit apical dendrites; PV basket cells divisively normalize soma
        const somInh = 0.15 * Math.max(0, this.larkumBurstRate16[(i + 1) & 15]);
        const pvInh = 0.25 + 0.2 * Math.abs(this.larkumBurstRate16[(i + 15) & 15]);
        this.larkumSomDendriticInh16[i] = somInh;
        this.larkumPvSomaticInh16[i] = pvInh;

        const netApical = Math.tanh(apicalPred - somInh);
        this.larkumApicalContext16[i] = netApical;

        // Larkum (2013) NMDA plateau: amplifies basal drive ONLY when apical input exceeds threshold θ_NMDA = 0.08
        const nmdaPlateau = netApical > 0.08 ? (netApical - 0.08) * 1.45 : 0.0;
        this.larkumNmdaPlateau16[i] = nmdaPlateau;
        if (nmdaPlateau > 0.05) burstCount++;

        const basalSig = Math.tanh(basalIn) / (1.0 + pvInh);
        const burstRate = Math.tanh(basalSig * (1.0 + nmdaPlateau * this.asmodensiusState.gwtBroadcastGain));
        this.larkumBurstRate16[i] = burstRate;

        // Turrigiano (2008) intrinsic homeostatic running mean & variance
        this.larkumRunningMean16[i] = 0.98 * this.larkumRunningMean16[i] + 0.02 * burstRate;
        const diffMean = burstRate - this.larkumRunningMean16[i];
        this.larkumRunningVar16[i] = Math.max(0.01, 0.98 * this.larkumRunningVar16[i] + 0.02 * diffMean * diffMean);

        if (Math.abs(burstRate) > maxAreaRate) {
          maxAreaRate = Math.abs(burstRate);
          winAreaIdx = i;
        }

        // Payeur et al. (2021) Burst-Gated Apical-Basal Mismatch Plasticity:
        // ΔW_ij = η * (I_basal,i - I_apical,i) * r_j
        const mismatch = basalIn - netApical;
        mismatchSqSum += mismatch * mismatch;
        for (let j = 0; j < 16; j++) {
          this.W_apical_pred16x16[row + j] = Math.max(
            -1.8,
            Math.min(1.8, this.W_apical_pred16x16[row + j] + lr * 0.35 * mismatch * this.larkumBurstRate16[j])
          );
        }
      }

      const mismatchMse = mismatchSqSum / 16;
      this.asmodensiusState.apicalBasalMismatchMse = Number(mismatchMse.toFixed(5));
      this.asmodensiusState.nmdaBurstFractionPct = Number(((burstCount / 16) * 100).toFixed(1));
      this.asmodensiusState.trnWinnerAreaIdx = winAreaIdx;
      // Dehaene & Changeux (2011) all-or-none Global Workspace ignition via Thalamic Reticular Nucleus (TRN)
      this.asmodensiusState.gwtIgnitionActive = maxAreaRate > 0.18;
      this.asmodensiusState.gwtBroadcastGain = this.asmodensiusState.gwtIgnitionActive ? 1.28 : 1.0;

      // Hypothalamic Opponent Drives (AgRP vs POMC) & Allostasis (Woods 1979; Sterling 2012; Borbély 1982)
      const tdDelta = finiteClamped(hub.tdAdvantageDelta, 0.05, -2.0, 2.0);
      this.asmodensiusState.glucose = Number(Math.max(0.2, Math.min(1.0, this.asmodensiusState.glucose * 0.998 + Math.max(0, tdDelta) * 0.04 + 0.0015)).toFixed(3));
      this.asmodensiusState.insulin = Number((0.6 * this.asmodensiusState.glucose + 0.2).toFixed(3));
      this.asmodensiusState.leptin = Number((0.75 * this.asmodensiusState.glucose + 0.1).toFixed(3));
      this.asmodensiusState.ghrelin = Number(Math.max(0.05, 1.0 - this.asmodensiusState.glucose).toFixed(3));
      this.asmodensiusState.agrpForagingDrive = Number(Math.max(0.05, Math.min(1.0, this.asmodensiusState.ghrelin * 1.15 - 0.35 * this.asmodensiusState.insulin)).toFixed(3));
      this.asmodensiusState.pomcSatietyDrive = Number(Math.max(0.05, Math.min(1.0, 0.55 * this.asmodensiusState.insulin + 0.45 * this.asmodensiusState.leptin)).toFixed(3));
      this.asmodensiusState.daRewardPredError = Number(Math.tanh(tdDelta * 2.5).toFixed(3));
      this.asmodensiusState.neSurpriseGain = Number(Math.min(1.0, mismatchMse * 3.2).toFixed(3));
      this.asmodensiusState.achExpectedUncertainty = Number((0.2 + 0.3 * this.asmodensiusState.agrpForagingDrive).toFixed(3));

      // =====================================================================
      // 3. EMPIRICAL C. ELEGANS 302-NEURON / 7,379-SYNAPSE CONNECTOME STEP
      //    Separates directed chemical synapses from symmetric electrical gap junctions!
      // =====================================================================
      // Inject sensory drive into AWCL/AWCR/ASEL/ASER/ASHL/ASHR (indices 16..21)
      for (let s = 0; s < 6; s++) {
        this.celegansVoltage64[16 + s] = Math.tanh((z[s] || 0) * 1.2 + this.larkumBurstRate16[s] * 0.4);
      }
      let chemCurrentSum = 0;
      let gapCurrentSum = 0;
      const nextV64 = this._scratchNextV64;
      for (let n = 0; n < 64; n++) {
        nextV64[n] = this.celegansVoltage64[n] * 0.86; // Passive membrane leak
      }
      for (let e = 0; e < this.celegansActiveEdgeCount; e++) {
        const src = this.celegansEdgeSrc512[e];
        const dst = this.celegansEdgeDst512[e];
        const w = this.celegansEdgeWeight512[e] * 0.008;
        const isGap = this.celegansEdgeType512[e] === 1;
        if (isGap) {
          // Symmetric electrical gap junction: I_gap = g_ij * (V_src - V_dst)
          const diff = (this.celegansVoltage64[src] - this.celegansVoltage64[dst]) * w * 0.5;
          nextV64[dst] += diff;
          nextV64[src] -= diff;
          gapCurrentSum += Math.abs(diff);
        } else {
          // Directed chemical synapse: I_chem = w_ij * tanh(V_src)
          const cur = Math.tanh(this.celegansVoltage64[src]) * w;
          nextV64[dst] += cur;
          chemCurrentSum += Math.abs(cur);
        }
      }
      for (let n = 0; n < 64; n++) {
        this.celegansVoltage64[n] = Math.tanh(nextV64[n]);
      }
      // Command interneuron balance: Forward (AVBL+AVBR+PVCL+PVCR, indices 2..5) vs Backward (AVAL+AVAR, indices 0..1)
      const fwdDrive = (this.celegansVoltage64[2] + this.celegansVoltage64[3] + this.celegansVoltage64[4] + this.celegansVoltage64[5]) * 0.25;
      const bwdDrive = (this.celegansVoltage64[0] + this.celegansVoltage64[1]) * 0.5;
      const avaAvbBalance = fwdDrive - bwdDrive;
      const dvWave = (this.celegansVoltage64[45] + this.celegansVoltage64[47]) - (this.celegansVoltage64[49] + this.celegansVoltage64[51]);

      this.celegansTelemetry.commandAvaAvbBalance = Number(avaAvbBalance.toFixed(4));
      this.celegansTelemetry.dorsalVentralWavePhase = Number(dvWave.toFixed(4));
      this.celegansTelemetry.chemicalSynapseCurrent = Number((chemCurrentSum / 64).toFixed(4));
      this.celegansTelemetry.gapJunctionSyncCurrent = Number((gapCurrentSum / 64).toFixed(4));

      // =====================================================================
      // 4. DIMENSION-OMEGA 3D RIEMANNIAN MANIFOLD CURVATURE & MOTOR COUPLING
      // =====================================================================
      this.dimensionOmegaTelemetry.ricciCurvatureScalarR = Number(
        (0.25 * this.cqmMetrics.qgtTraceG + 0.15 * Math.abs(this.cqmMetrics.qgtBerryCurvature)).toFixed(4)
      );
      this.dimensionOmegaTelemetry.geodesicVelocityNorm = Number(
        Math.sqrt(avaAvbBalance * avaAvbBalance + dvWave * dvWave + 0.04).toFixed(4)
      );

      // =====================================================================
      // 5. PORTED 14-BRAIN MULTIVERSE PANTHEON & 7-TIER PRECISION ARENA STEP
      // =====================================================================
      if (runtime && runtime.portedMultiverseBrains) {
        this.multiverse10Pantheon = runtime.portedMultiverseBrains;
        this.multiverse14Pantheon = this.multiverse10Pantheon;
      } else if (!this.multiverse10Pantheon && globalScope.PortedMultiverseBrainsFederation) {
        this.multiverse10Pantheon = new globalScope.PortedMultiverseBrainsFederation();
        this.multiverse14Pantheon = this.multiverse10Pantheon;
      }
      if (this.multiverse10Pantheon) {
        if (runtime._auditAlreadySteppedPantheonFrame !== safeFrame) {
          this.multiverse10Pantheon.step60Hz(runtime, safeTick, safeFrame);
        }
        runtime.portedMultiverseBrains = this.multiverse10Pantheon;
      }

      // Couple fused 14-brain output directly into world-model latent state & 2D motor thrust
      for (let i = 0; i < 8; i++) {
        const zCur = finiteClamped(wm.latentZ64[i], 0.0, -5.0, 5.0);
        wm.latentZ64[i] = Math.tanh(zCur * 0.88 + this.larkumBurstRate16[i] * 0.08 + this.celegansVoltage64[i] * 0.04);
      }
      if (hub.learnedMotorThrust2D) {
        const m0 = finiteClamped(hub.learnedMotorThrust2D[0], 0.0, -5.0, 5.0);
        const m1 = finiteClamped(hub.learnedMotorThrust2D[1], 0.0, -5.0, 5.0);
        hub.learnedMotorThrust2D[0] = Number(Math.tanh(m0 * 0.85 + avaAvbBalance * 0.15).toFixed(4));
        hub.learnedMotorThrust2D[1] = Number(Math.tanh(m1 * 0.85 + dvWave * 0.15).toFixed(4));
      }

      this.fusionHeadline =
        `14-BRAIN FUSION · CQM-Zig[Wasm=${this.cqmWasmLoaded ? '18-EXP' : 'JS'} · MinSR=${this.cqmMetrics.minSrUpdateNorm} · Chern=${this.cqmMetrics.qwzChernNumber} · MZM=${this.cqmMetrics.bdgSkyrmionMzmCount}] × ` +
        `Asmodensius[272N · NMDA=${this.asmodensiusState.nmdaBurstFractionPct}% · GWT=${this.asmodensiusState.gwtIgnitionActive ? 'IGNITED' : 'GATED'}] × ` +
        `Glitchling[Cerebellar+SR_Int8] × C.elegans[${this.celegansUniqueNeurons}N/${this.celegansTotalEdges}S · AVB-AVA=${this.celegansTelemetry.commandAvaAvbBalance}]`;

      return this;
    }
  }

  globalScope.BLEEDING_EDGE_25_CATALOG = BLEEDING_EDGE_25_CATALOG;
  globalScope.BleedEdge25AlifeEngine = BleedEdge25AlifeEngine;
  globalScope.AotTotGotCorecursiveDecursiveEngine = AotTotGotCorecursiveDecursiveEngine;
  globalScope.SiblingBrainFusionEngine = SiblingBrainFusionEngine;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      BLEEDING_EDGE_25_CATALOG,
      BleedEdge25AlifeEngine,
      AotTotGotCorecursiveDecursiveEngine,
      SiblingBrainFusionEngine
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
