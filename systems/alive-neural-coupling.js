/* Bounded sensory coupling for the local models. This does not establish the
 * scientific claims attached to their names, or independent causal credit. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveNeuralCoupling = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DIM = 16;
  const BRAIN_KEYS = Object.freeze([
    'brain1Asmodensius', 'brain2Glitchling', 'brain3CqmSuperMind', 'brain4ApexHydra',
    'brain5Xenomimic', 'brain6XylosManifold', 'brain7Mechalogodrom', 'brain8GlyphPantheon',
    'brain9ThalerDabus', 'brain10GraphCrystal', 'brain11TsotchkeDale', 'brain12BlackHolePage',
    'brain13ConsciousnessConsortium', 'brain14ThingmakerGrimoire'
  ]);
  const SOURCE_IDS = Object.freeze(BRAIN_KEYS.concat([
    'precision-f64', 'precision-i64', 'precision-u32', 'precision-fp16',
    'precision-int8', 'precision-ternary', 'precision-f32', 'micro-ising',
    'omega-lorenz', 'omega-izhikevich'
  ]));
  const SOURCE_PATHS = Object.freeze([
    'brain1Asmodensius.rates272', 'brain2Glitchling.deltaNetFastS8x8',
    'brain3CqmSuperMind.imagitronThoughts5x8', 'brain4ApexHydra.organActivations11',
    'brain5Xenomimic.psiRe16 / psiIm16', 'brain6XylosManifold.fociAct48',
    'brain7Mechalogodrom.invariants10 / subBrainWeights10x8',
    'brain8GlyphPantheon.arena.u16Fp16FastWeights (decoded readout)',
    'brain9ThalerDabus.W_autoassoc8x8 (learned readout)',
    'brain10GraphCrystal.W_tree6x6 (learned readout)', 'brain11TsotchkeDale.ddimLatent16',
    'brain12BlackHolePage numerical geometry / entropy fields',
    'brain13ConsciousnessConsortium.W_consortium10x8 (learned readout)',
    'brain14ThingmakerGrimoire.W_morphArcane8x8 (learned readout)',
    'bleedingEdge25Engine.f64OdeAndQgtArena', 'bleedingEdge25Engine.i64Cyclotomic8Arena',
    'bleedingEdge25Engine.u32BinaryHdcArena[128..135]', 'bleedingEdge25Engine.u16Fp16LatentArena',
    'bleedingEdge25Engine.i8QuantizedArena × f32QuantScale16 (dequantized readout)',
    'bleedingEdge25Engine.u8TernaryBitNetArena (packed add/subtract readout)',
    'bleedingEdge25Engine.mambaSelectiveState16', 'hybridBrainMesh.ising56',
    'omega100Engine.d2_topologyChaos.m15_lorenzAttractorXyz (computed integration state)',
    'omega100Engine.d1_neuralDynamics.m03_izhikevichBurstState.v/u (computed integration state)'
  ]);
  const COUNT = SOURCE_IDS.length;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function finite(v) { return typeof v === 'number' && Number.isFinite(v) ? v : 0; }
  function half(bits) {
    const sign = bits & 0x8000 ? -1 : 1, exponent = (bits >>> 10) & 31, mantissa = bits & 1023;
    if (exponent === 31) return 0;
    return sign * (exponent ? Math.pow(2, exponent - 15) * (1 + mantissa / 1024) : Math.pow(2, -14) * mantissa / 1024);
  }
  function popcnt32(value) {
    value -= (value >>> 1) & 0x55555555;
    value = (value & 0x33333333) + ((value >>> 2) & 0x33333333);
    return (((value + (value >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
  }
  function install(h, mesh = h && h.mesh) {
    if (!h || typeof h.stepTrainableAlifeNeuralHub60Hz !== 'function') throw new Error('A trainable creature hub is required for neural coupling');
    if (h.aliveNeuralCoupling) return h.aliveNeuralCoupling;
    const features = new Float32Array(COUNT * DIM);
    const weights = new Float32Array(COUNT * DIM);
    const gateLogits = new Float32Array(COUNT);
    const eligibility = new Float32Array(COUNT * DIM);
    const gates = new Float32Array(COUNT);
    const present = new Uint8Array(COUNT);
    const ablated = new Uint8Array(COUNT);
    const sourceNorms = new Float32Array(COUNT);
    const input = new Float32Array(DIM);
    const previousObservation = new Float32Array(DIM);
    // [steps, feedback updates, last error, last transition, has feedback baseline,
    //  rejected nonfinite values, source count, last reward]
    const counters = new Float64Array(8);
    const currentFeedbackEpoch = () => Number.isSafeInteger(h.authorityEpoch) && h.authorityEpoch >= 0 ? h.authorityEpoch : null;
    let feedbackEpoch = currentFeedbackEpoch();
    const computedOmega = { engine: null, lorenz: null, izhikevich: null };
    for (let s = 0; s < COUNT; s++) for (let j = 0; j < DIM; j++) weights[s * DIM + j] = 0.10 + 0.035 * Math.sin((s + 1) * (j + 3));
    // The checkpoint codec's policy traversal intentionally captures direct
    // typed fields only. These aliases preserve the trainable state on restore.
    h.aliveCouplingWeights = weights;
    h.aliveCouplingGateLogits = gateLogits;
    h.aliveCouplingEligibility = eligibility;
    h.aliveCouplingFeatures = features;
    h.aliveCouplingInput = input;
    h.aliveCouplingCounters = counters;
    const scalar = value => {
      if (typeof value !== 'number' || !Number.isFinite(value)) { counters[5]++; return 0; }
      return Math.tanh(clamp(value, -1000, 1000));
    };
    function vector(slot, values, offset = 0, stride = 1, scale = 1) {
      if (!values || !values.length || offset >= values.length) return;
      const count = values.length - offset;
      present[slot] = 1;
      for (let j = 0; j < DIM; j++) features[slot * DIM + j] = scalar(values[offset + ((j * stride) % count)] * scale);
    }
    function project(slot, matrix, rows, columns, latent, scale = 1, decoder = finite, rowStride = columns) {
      if (!matrix || matrix.length < (rows - 1) * rowStride + columns || !latent || !latent.length) return;
      present[slot] = 1;
      for (let j = 0; j < DIM; j++) {
        let value = 0;
        const row = (j % rows) * rowStride;
        for (let c = 0; c < columns; c++) value += finite(decoder(matrix[row + c])) * finite(latent[c % latent.length]);
        features[slot * DIM + j] = scalar(value * scale / Math.sqrt(columns));
      }
    }
    // Omega has no execution counter. Its actual integration method replaces
    // these two state records; observe those replacements rather than treating
    // constructor seeds, status strings or claimed module counts as execution.
    const originalOmegaStep = h.stepOmega100OmniscienceEngine;
    if (typeof originalOmegaStep === 'function') {
      h.stepOmega100OmniscienceEngine = function (...args) {
        const engine = this.omega100Engine;
        const lorenz = engine?.d2_topologyChaos?.m15_lorenzAttractorXyz;
        const izhikevich = engine?.d1_neuralDynamics?.m03_izhikevichBurstState;
        const result = originalOmegaStep.apply(this, args);
        if (this === h && engine && this.omega100Engine === engine) {
          if (computedOmega.engine !== engine) {
            computedOmega.engine = engine; computedOmega.lorenz = computedOmega.izhikevich = null;
          }
          const nextLorenz = engine.d2_topologyChaos?.m15_lorenzAttractorXyz;
          const nextIzhikevich = engine.d1_neuralDynamics?.m03_izhikevichBurstState;
          if (nextLorenz && nextLorenz !== lorenz) computedOmega.lorenz = nextLorenz;
          if (nextIzhikevich && nextIzhikevich !== izhikevich) computedOmega.izhikevich = nextIzhikevich;
        }
        return result;
      };
    }
    function sampleOmega() {
      const engine = h.omega100Engine;
      if (!engine || engine !== computedOmega.engine) return;
      const lorenz = engine.d2_topologyChaos?.m15_lorenzAttractorXyz;
      if (lorenz && lorenz === computedOmega.lorenz && lorenz.length === 3) {
        let valid = true;
        for (let i = 0; i < 3; i++) if (!Number.isFinite(lorenz[i])) { counters[5]++; valid = false; }
        if (valid) {
          present[22] = 1;
          for (let j = 0; j < DIM; j++) {
            const axis = j % 3;
            features[22 * DIM + j] = scalar(lorenz[axis] / (axis === 2 ? 55 : 35));
          }
        }
      }
      const izhikevich = engine.d1_neuralDynamics?.m03_izhikevichBurstState;
      if (izhikevich && izhikevich === computedOmega.izhikevich) {
        const validV = Number.isFinite(izhikevich.v), validU = Number.isFinite(izhikevich.u);
        if (!validV) counters[5]++;
        if (!validU) counters[5]++;
        if (validV && validU) {
          present[23] = 1;
          for (let j = 0; j < DIM; j++) features[23 * DIM + j] = scalar(j & 1 ? izhikevich.u / 50 : izhikevich.v / 100);
        }
      }
    }
    function sample() {
      features.fill(0); present.fill(0);
      const federation = h.portedMultiverseBrains;
      const hub = h.trainableAlifeNeuralHub;
      const latent = hub?.zPerc16;
      // Initial seeded states are not reported as exercised sources.
      if (federation && finite(federation.stepCount) > 0) {
        const b = BRAIN_KEYS.map(key => federation[key]);
        vector(0, b[0]?.rates272, 216);
        project(1, b[1]?.deltaNetFastS8x8, 8, 8, latent);
        vector(2, b[2]?.imagitronThoughts5x8);
        vector(3, b[3]?.organActivations11);
        vector(4, b[4]?.psiRe16);
        if (present[4] && b[4]?.psiIm16) for (let j = 0; j < DIM; j++) features[4 * DIM + j] = scalar(features[4 * DIM + j] + finite(b[4].psiIm16[j]));
        vector(5, b[5]?.fociAct48, 0, 3);
        vector(6, b[6]?.invariants10);
        if (present[6] && b[6]?.subBrainWeights10x8 && latent) for (let j = 0; j < DIM; j++) {
          let readout = 0;
          for (let c = 0; c < 8; c++) readout += finite(b[6].subBrainWeights10x8[(j % 10) * 8 + c]) * finite(latent[c]);
          features[6 * DIM + j] = scalar(features[6 * DIM + j] + readout * 0.25);
        }
        project(7, b[7]?.arena?.u16Fp16FastWeights, 16, 16, latent, 1, half, 32);
        project(8, b[8]?.W_autoassoc8x8, 8, 8, latent);
        project(9, b[9]?.W_tree6x6, 6, 6, latent);
        vector(10, b[10]?.ddimLatent16);
        if (b[11]) {
          const names = ['rOuterPlus', 'rInnerMinus', 'photonSphereRadiusRph', 'qnmOmegaReal', 'qnmOmegaImag', 'surfaceGravityKappa', 'hawkingTempTH', 'pageCurveRadiationEntropy'];
          const scales = [0.15, 0.5, 0.1, 2, 5, 3, 10, 0.02];
          if (names.some(key => Number.isFinite(b[11][key]))) {
            present[11] = 1;
            for (let j = 0; j < DIM; j++) features[11 * DIM + j] = scalar(b[11][names[j & 7]] * scales[j & 7]);
          }
        }
        project(12, b[12]?.W_consortium10x8, 10, 8, latent);
        project(13, b[13]?.W_morphArcane8x8, 8, 8, latent);
      }
      const precision = h.bleedingEdge25Engine;
      // The precision kernels run during the preceding hub step; their concrete
      // execution receipts, not seeded/restored hub counters, admit the arrays.
      const precisionExecution = precision?.precisionExecutionEvidence?.();
      if (precision && precisionExecution?.kernelsCompleted === true) {
        vector(14, precision.f64OdeAndQgtArena);
        const ring = precision.i64Cyclotomic8Arena;
        if (ring?.length >= 4) {
          present[15] = 1;
          for (let j = 0; j < DIM; j++) {
            const value = ring[j & 3];
            features[15 * DIM + j] = typeof value === 'bigint' ? Number(value % 4096n) / 4096 : 0;
          }
        }
        const hdc = precision.u32BinaryHdcArena;
        if (hdc?.length >= 136) {
          present[16] = 1;
          for (let j = 0; j < DIM; j++) {
            const word = hdc[128 + (j & 7)] >>> 0;
            features[16 * DIM + j] = j < 8 ? (popcnt32(word) - 16) / 16 : (word & 65535) / 32767.5 - 1;
          }
        }
        if (precision.u16Fp16LatentArena?.length >= DIM) {
          present[17] = 1;
          for (let j = 0; j < DIM; j++) features[17 * DIM + j] = scalar(half(precision.u16Fp16LatentArena[j]));
        }
        if (precision.i8QuantizedArena?.length >= 256 && precision.f32QuantScale16?.length >= DIM && latent) {
          present[18] = 1;
          for (let j = 0; j < DIM; j++) {
            let sum = 0;
            for (let c = 0; c < DIM; c++) sum += precision.i8QuantizedArena[j * DIM + c] * finite(latent[c]);
            features[18 * DIM + j] = scalar(sum * finite(precision.f32QuantScale16[j]) / 4);
          }
        }
        if (precision.u8TernaryBitNetArena?.length >= 64 && latent) {
          present[19] = 1;
          for (let j = 0; j < DIM; j++) {
            let sum = 0;
            for (let c = 0; c < DIM; c++) {
              const code = (precision.u8TernaryBitNetArena[j * 4 + (c >>> 2)] >>> ((c & 3) * 2)) & 3;
              sum += (code === 1 ? 1 : code === 2 ? -1 : 0) * finite(latent[c]);
            }
            features[19 * DIM + j] = scalar(sum / 4);
          }
        }
      }
      if (precision && precisionExecution?.mambaCompleted === true) vector(20, precision.mambaSelectiveState16);
      const spins = mesh?.ising56;
      if (spins?.length) {
        present[21] = 1;
        for (let j = 0; j < DIM; j++) {
          let sum = 0, count = 0;
          for (let i = j; i < spins.length; i += DIM) { sum += finite(spins[i]); count++; }
          features[21 * DIM + j] = scalar(sum / Math.max(1, count));
        }
      }
      sampleOmega();
      input.fill(0);
      sourceNorms.fill(0);
      let available = 0;
      for (let s = 0; s < COUNT; s++) {
        gateLogits[s] = clamp(finite(gateLogits[s]), -3, 3);
        if (!present[s]) {
          gates[s] = 0;
          // Invalid restored parameters must not remain nonfinite merely
          // because their source has not produced a usable sample yet.
          for (let j = 0; j < DIM; j++) {
            const k = s * DIM + j;
            weights[k] = clamp(finite(weights[k]), -0.4, 0.4);
            eligibility[k] = finite(eligibility[k]);
          }
          continue;
        }
        available++;
        gates[s] = 0.15 + 0.7 / (1 + Math.exp(-gateLogits[s]));
        let sq = 0;
        for (let j = 0; j < DIM; j++) {
          const k = s * DIM + j;
          weights[k] = clamp(finite(weights[k]), -0.4, 0.4);
          eligibility[k] = finite(eligibility[k]) * 0.9 + features[k] * 0.1;
          const contrib = gates[s] * weights[k] * features[k];
          sq += contrib * contrib;
          if (!ablated[s]) input[j] += contrib;
        }
        sourceNorms[s] = ablated[s] ? 0 : Math.sqrt(sq);
      }
      const divisor = Math.sqrt(Math.max(1, available));
      for (let j = 0; j < DIM; j++) input[j] = Math.tanh(input[j] / divisor);
      counters[6] = available;
      return input;
    }
    function setAblatedSources(targets = []) {
      ablated.fill(0);
      const list = Array.isArray(targets) || targets instanceof Set ? Array.from(targets) : [targets];
      let count = 0;
      for (const item of list) {
        const idx = typeof item === 'number' && Number.isInteger(item) ? item : SOURCE_IDS.indexOf(String(item));
        if (idx >= 0 && idx < COUNT && !ablated[idx]) { ablated[idx] = 1; count++; }
      }
      return count;
    }
    function clearAblations() {
      ablated.fill(0);
      return 0;
    }
    function feedback(predictionError, transitionId) {
      if (!Number.isFinite(predictionError) || predictionError < 0 || !Number.isSafeInteger(transitionId) || transitionId < 0) return false;
      const epoch = currentFeedbackEpoch();
      if (epoch !== feedbackEpoch) {
        // A handoff or restore has no measured causal prediction-error delta
        // from the prior guest/model state. Establish a fresh baseline first.
        feedbackEpoch = epoch;
        counters[4] = 0;
      }
      if (counters[4] && transitionId <= counters[3]) return false;
      const reward = counters[4] ? clamp(counters[2] - predictionError, -1, 1) : 0;
      const eligible = counters[4] && counters[0] > 0;
      counters[2] = predictionError; counters[3] = transitionId; counters[4] = 1; counters[7] = reward;
      if (!eligible) return false;
      for (let s = 0; s < COUNT; s++) {
        if (!present[s] || ablated[s]) continue;
        let activity = 0;
        for (let j = 0; j < DIM; j++) {
          const k = s * DIM + j, trace = clamp(finite(eligibility[k]), -1, 1);
          weights[k] = clamp(finite(weights[k]) + 0.005 * reward * trace, -0.4, 0.4);
          activity += Math.abs(trace);
        }
        gateLogits[s] = clamp(finite(gateLogits[s]) + 0.002 * reward * activity / DIM, -3, 3);
      }
      counters[1]++;
      return true;
    }
    const original = h.stepTrainableAlifeNeuralHub60Hz;
    let busy = false;
    h.stepTrainableAlifeNeuralHub60Hz = function (...args) {
      if (busy) return original.apply(this, args);
      busy = true;
      const obs = this.obsVec;
      const n = Math.min(DIM, obs?.length || 0);
      let succeeded = false, result;
      for (let j = 0; j < n; j++) previousObservation[j] = obs[j];
      try {
        sample();
        for (let j = 0; j < n; j++) obs[j] = clamp(finite(obs[j]) + 0.12 * input[j], -5, 5);
        result = original.apply(this, args);
        succeeded = true;
      } finally {
        for (let j = 0; j < n; j++) obs[j] = previousObservation[j];
        busy = false;
      }
      if (succeeded) {
        const latent = this.continuousWorldModel?.latentZ64;
        if (latent) for (let j = 0; j < Math.min(DIM, latent.length); j++) latent[j] = clamp(finite(latent[j]) + 0.035 * input[j], -1, 1);
        const motor = this.trainableAlifeNeuralHub?.learnedMotorThrust2D;
        if (motor?.length >= 2) for (let j = 0; j < 2; j++) motor[j] = clamp(finite(motor[j]) + 0.025 * input[j], -1, 1);
        counters[0]++;
      }
      return result;
    };
    const api = Object.freeze({
      feedback,
      setAblatedSources,
      clearAblations,
      snapshot() {
        return { steps: counters[0], feedbackUpdates: counters[1], sourceCount: counters[6],
          ablatedCount: ablated.reduce((a, b) => a + b, 0),
          lastPredictionError: counters[4] ? counters[2] : null, lastReward: counters[7], feedbackEpoch,
          rejectedNonfiniteValues: counters[5], trainableParameters: weights.length + gateLogits.length,
          sources: SOURCE_IDS.map((id, index) => ({ id, source: SOURCE_PATHS[index], available: Boolean(present[index]), gate: gates[index],
            diagnosticallyAblated: Boolean(ablated[index]), contributionNorm: sourceNorms[index] })),
          scope: 'Local model state and numerical precision kernels influence hub sensory input, latent state and motor thrust; reward-modulated gates use observed prediction-error change, not proven causal credit or external backend capability.' };
      }
    });
    Object.defineProperty(h, 'aliveNeuralCoupling', { value: api, configurable: true });
    return api;
  }
  return Object.freeze({ install, SOURCE_IDS, SOURCE_PATHS });
});
