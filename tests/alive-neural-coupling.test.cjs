'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { install, SOURCE_IDS } = require('../systems/alive-neural-coupling.js');
const { BleedEdge25AlifeEngine } = require('../systems/alife-25-bleeding-edge-models.js');
const checkpoints = require('../systems/alive-checkpoints.js');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const pageSource = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const omegaInitStart = pageSource.indexOf('this.omega100Engine = ') + 'this.omega100Engine = '.length;
const omegaInitEnd = pageSource.indexOf(';', pageSource.indexOf('\n        };', omegaInitStart));
const omegaStepStart = pageSource.indexOf('      stepOmega100OmniscienceEngine(pageData = {}) {');
const omegaStepEnd = pageSource.indexOf('\n      }', omegaStepStart) + '\n      }'.length;
assert.ok(omegaInitStart > 0 && omegaInitEnd > omegaInitStart && omegaStepStart > omegaInitEnd && omegaStepEnd > omegaStepStart);
const omegaStep = vm.runInNewContext('({' + pageSource.slice(omegaStepStart, omegaStepEnd) + '}).stepOmega100OmniscienceEngine', {
  console: { warn(_message, error) { throw error; } }
});
function attachActualOmega(h) {
  h.omega100Engine = vm.runInNewContext('(' + pageSource.slice(omegaInitStart, omegaInitEnd) + ')');
  h.stepOmega100OmniscienceEngine = omegaStep;
  Object.assign(h.mesh, { nm: { DA: .5, ACh: .5, NE: .5, S5: .44 }, iitPhi: .5, entanglementBits: .5, viscera: { glc: .5 } });
  Object.assign(h, {
    simulationTick: 1, connectome512: { activeSpikesCount: 120, meanSynapticWeight: .18 },
    deepCortex: { gradNormL2: .2, imaginedHorizon5Return: .3 },
    rationalLogicEngine: { cnfClausesCount: 5, epistemicConsistencyPct: 90, contradictionsDetected: 0 },
    deepObservatory: { kolmogorovLzRatio: .5, klDivergenceInfoGainBits: .3, zipfAlphaExponent: 1,
      quantStats: { stdDev: 1, mean: 1 }, domTomography: { buttons: 1, inputs: 1, internalLinks: 2, externalLinks: 1, codeBlocks: 0, tables: 0 } },
    swarmCollective: { kuramotoOrderR: .7, bftQuorumPct: 85, atpTransfersCount: 0 },
    causalGraph: { propositions: [], topHubs: [], nodeCentrality: {} },
    cognitiveCortex: { activeHypothesis: 'fixture', lastComprehension: { topConcepts: [] } },
    hdcLastCosineSimilarity: .5, offspringColony: [], verletPhysics: { stanceFeetCount: 2, gaussSeidelIterations: 4 },
    bodyRecipe: { limbCount: 4, hue: 180 }, morphogenesis: { stageName: 'fixture' }, episodicMemory: [],
    visitedUrlTabooSet: new Set(), clickedAnchorTabooSet: new Set(), authorityEpoch: 1,
    sovereignMaster: { maxsmartDossiersSynthesized: 0, bookmarksAutonomouslyPinned: 0, vaultEngramsCrystallized: 0, vibeCssMutationsCount: 0 },
    hdcCodebook: new Map(), emotionState: { emoji: '', activeEmotion: 'fixture' }, personality: {}, dreamReplaysCount: 0,
    semanticMemory: { partnerModel: { cursorTrustScore: .5 } }, stepDeity100OmnipotenceEngine() {}
  });
}

function fixture() {
  // Use the actual local ports and precision kernel implementation. The hub
  // callback records the sensory input at its boundary without running the UI.
  const engine = new BleedEdge25AlifeEngine();
  const h = {
    mesh: { ising56: Int8Array.from({ length: 56 }, (_, i) => i % 2 ? -1 : 1) },
    obsVec: Float32Array.from({ length: 16 }, (_, i) => 0.1 + i * 0.01),
    continuousWorldModel: { latentZ64: new Float32Array(64).fill(0.2) },
    trainableAlifeNeuralHub: {
      zPerc16: Float32Array.from({ length: 16 }, (_, i) => 0.3 + i * 0.02),
      learnedMotorThrust2D: new Float32Array(2), totalBackpropStepsTrained: 1,
      tdAdvantageDelta: 0.04, adaptivePlasticityLr: 0.008
    },
    bleedingEdge25Engine: engine,
    portedMultiverseBrains: engine.siblingBrainFusion.multiverse10Pantheon,
    stepTrainableAlifeNeuralHub60Hz() { this.hubInputSeen = new Float32Array(this.obsVec); return 'hub-result'; }
  };
  attachActualOmega(h);
  engine.step60Hz(h, 1, 1);
  return h;
}
const differs = (a, b) => a.some((value, i) => Math.abs(value - b[i]) > 1e-8);
function run(h) { install(h); h.stepOmega100OmniscienceEngine?.(); const result = h.stepTrainableAlifeNeuralHub60Hz(); assert.equal(result, 'hub-result'); return h; }

test('actual model instances expose 14 brains, seven precision streams, Ising, and two computed Omega streams to the hub', () => {
  const h = fixture(), pageObservation = [...h.obsVec];
  run(h);
  assert.equal(h.aliveNeuralCoupling.snapshot().sourceCount, 24);
  assert.equal(h.aliveNeuralCoupling.snapshot().trainableParameters, 408);
  assert.deepEqual(h.aliveNeuralCoupling.snapshot().sources.map(item => item.id), SOURCE_IDS);
  assert(h.aliveNeuralCoupling.snapshot().sources.every(item => item.available));
  assert(differs(h.hubInputSeen, pageObservation), 'the actual hub boundary must receive coupled inputs');
  assert.deepEqual([...h.obsVec], pageObservation, 'measured page observation must be restored after hub training');
  assert(differs(h.continuousWorldModel.latentZ64, new Float32Array(64).fill(0.2)));
  assert(differs(h.trainableAlifeNeuralHub.learnedMotorThrust2D, new Float32Array(2)));
});

const brainPerturbations = [
  ['Asmodensius', h => { h.portedMultiverseBrains.brain1Asmodensius.rates272[216] += 0.8; }],
  ['Glitchling', h => { h.portedMultiverseBrains.brain2Glitchling.deltaNetFastS8x8[0] += 0.8; }],
  ['CQM SuperMind', h => { h.portedMultiverseBrains.brain3CqmSuperMind.imagitronThoughts5x8[0] += 0.8; }],
  ['Apex Hydra', h => { h.portedMultiverseBrains.brain4ApexHydra.organActivations11[0] += 0.8; }],
  ['Xenomimic', h => { h.portedMultiverseBrains.brain5Xenomimic.psiRe16[0] += 0.8; }],
  ['Xylos', h => { h.portedMultiverseBrains.brain6XylosManifold.fociAct48[0] += 0.8; }],
  ['Mechalogodrom', h => { h.portedMultiverseBrains.brain7Mechalogodrom.invariants10[0] += 0.8; }],
  ['Glyph', h => { h.portedMultiverseBrains.precisionArena.u16Fp16FastWeights[0] = 0x3c00; }],
  ['Thaler DABUS', h => { h.portedMultiverseBrains.brain9ThalerDabus.W_autoassoc8x8[0] += 0.8; }],
  ['GraphMind', h => { h.portedMultiverseBrains.brain10GraphCrystal.W_tree6x6[0] += 0.8; }],
  ['Tsotchke Dale', h => { h.portedMultiverseBrains.brain11TsotchkeDale.ddimLatent16[0] += 0.8; }],
  ['BlackHole', h => { h.portedMultiverseBrains.brain12BlackHolePage.rOuterPlus += 2; }],
  ['Consciousness Consortium', h => { h.portedMultiverseBrains.brain13ConsciousnessConsortium.W_consortium10x8[0] += 0.8; }],
  ['Thingmaker Grimoire', h => { h.portedMultiverseBrains.brain14ThingmakerGrimoire.W_morphArcane8x8[0] += 0.8; }]
];
for (const [name, change] of brainPerturbations) test(`${name} model perturbation changes shared sensory input, latent state and motor`, () => {
  const baseline = run(fixture()), changed = fixture(); change(changed); run(changed);
  assert(differs(changed.hubInputSeen, baseline.hubInputSeen));
  assert(differs(changed.continuousWorldModel.latentZ64, baseline.continuousWorldModel.latentZ64));
  assert(differs(changed.trainableAlifeNeuralHub.learnedMotorThrust2D, baseline.trainableAlifeNeuralHub.learnedMotorThrust2D));
});

const precisionPerturbations = [
  ['Float64 ODE', e => { e.f64OdeAndQgtArena[0] += 0.8; }],
  ['BigInt64 cyclotomic', e => { e.i64Cyclotomic8Arena[0] = 2000n; }],
  ['Uint32 HDC', e => { e.u32BinaryHdcArena[128] ^= 0xffffffff; }],
  ['FP16 decoded latent', e => { e.u16Fp16LatentArena[0] = 0x3c00; }],
  ['Int8 dequantized readout', e => { e.i8QuantizedArena[0] = -127; e.f32QuantScale16[0] = 0.02; }],
  ['packed ternary readout', e => { e.u8TernaryBitNetArena[0] = 0x55; }],
  ['Float32 Mamba', e => { e.mambaSelectiveState16[0] += 0.8; }]
];
for (const [name, change] of precisionPerturbations) test(`${name} computed state affects the shared hub`, () => {
  const baseline = run(fixture()), changed = fixture(); change(changed.bleedingEdge25Engine); run(changed);
  assert(differs(changed.hubInputSeen, baseline.hubInputSeen));
  assert(differs(changed.continuousWorldModel.latentZ64, baseline.continuousWorldModel.latentZ64));
  assert(differs(changed.trainableAlifeNeuralHub.learnedMotorThrust2D, baseline.trainableAlifeNeuralHub.learnedMotorThrust2D));
});

test('all 56 Ising spins can affect the shared model rather than only its display', () => {
  const h = fixture(); install(h);
  const reset = () => { h.obsVec.fill(0.2); h.continuousWorldModel.latentZ64.fill(0.2); };
  reset(); h.stepTrainableAlifeNeuralHub60Hz(); const baseline = [...h.hubInputSeen];
  for (let i = 0; i < 56; i++) {
    h.mesh.ising56[i] *= -1; reset(); h.stepTrainableAlifeNeuralHub60Hz();
    assert(differs(h.hubInputSeen, baseline), `spin ${i} must have a neural input path`);
    h.mesh.ising56[i] *= -1;
  }
});

test('only newer finite observed prediction-error feedback trains gates and projection weights', () => {
  const h = run(fixture()), api = h.aliveNeuralCoupling;
  const beforeWeights = [...h.aliveCouplingWeights], beforeGates = [...h.aliveCouplingGateLogits];
  assert.equal(api.feedback(0.7, 100), false, 'first observation establishes a baseline');
  assert.equal(api.feedback(0.4, 101), true);
  assert(differs(h.aliveCouplingWeights, beforeWeights));
  assert(differs(h.aliveCouplingGateLogits, beforeGates));
  const trained = [...h.aliveCouplingWeights];
  assert.equal(api.feedback(0.1, 101), false, 'the same observation cannot be rewarded twice');
  assert.equal(api.feedback(NaN, 102), false);
  assert.equal(api.feedback(0.2, 99), false, 'older observations cannot overwrite the feedback baseline');
  assert.deepEqual([...h.aliveCouplingWeights], trained);
  assert.equal(api.snapshot().feedbackUpdates, 1);
});

test('coupling establishes a new reward baseline after a guest handoff or checkpoint epoch change', () => {
  const h = run(fixture()), api = h.aliveNeuralCoupling;
  api.feedback(.8, 100); api.feedback(.5, 101);
  const beforeWeights = [...h.aliveCouplingWeights], beforeGates = [...h.aliveCouplingGateLogits];
  h.authorityEpoch++;
  assert.equal(api.feedback(.1, 102), false, 'an error reduction across authority contexts is not a learning reward');
  assert.deepEqual([...h.aliveCouplingWeights], beforeWeights);
  assert.deepEqual([...h.aliveCouplingGateLogits], beforeGates);
  assert.equal(api.snapshot().lastReward, 0);
  assert.equal(api.snapshot().feedbackUpdates, 1);
  assert.equal(api.snapshot().feedbackEpoch, h.authorityEpoch);
  assert.equal(api.feedback(.05, 103), true);
  assert(differs(h.aliveCouplingWeights, beforeWeights));
  assert.equal(api.snapshot().feedbackUpdates, 2);
});

test('nonfinite inputs, restored parameters, and sustained feedback stay bounded', () => {
  const h = fixture(); install(h);
  h.portedMultiverseBrains.brain6XylosManifold.fociAct48.fill(Infinity);
  h.portedMultiverseBrains.brain7Mechalogodrom.invariants10.fill(NaN);
  h.bleedingEdge25Engine.f64OdeAndQgtArena.fill(Infinity);
  h.aliveCouplingWeights.fill(Infinity); h.aliveCouplingGateLogits.fill(NaN);
  for (let i = 0; i < 100; i++) {
    h.stepTrainableAlifeNeuralHub60Hz(); h.aliveNeuralCoupling.feedback(i % 2 ? 0.01 : 4, i);
  }
  for (const tensor of [h.hubInputSeen, h.continuousWorldModel.latentZ64, h.trainableAlifeNeuralHub.learnedMotorThrust2D, h.aliveCouplingWeights, h.aliveCouplingGateLogits]) assert([...tensor].every(Number.isFinite));
  assert([...h.aliveCouplingWeights].every(value => Math.abs(value) <= 0.400001));
  assert([...h.aliveCouplingGateLogits].every(value => Math.abs(value) <= 3));
  assert([...h.continuousWorldModel.latentZ64].every(value => Math.abs(value) <= 1));
  assert(h.aliveNeuralCoupling.snapshot().rejectedNonfiniteValues > 0);
});

test('missing engines are unavailable and do not invent their input streams', () => {
  const h = fixture(); h.portedMultiverseBrains = null; h.bleedingEdge25Engine = null; h.mesh.ising56 = null; h.omega100Engine = null;
  const observed = [...h.obsVec], latent = [...h.continuousWorldModel.latentZ64]; run(h);
  assert.equal(h.aliveNeuralCoupling.snapshot().sourceCount, 0);
  assert.deepEqual([...h.hubInputSeen], observed);
  assert.deepEqual([...h.continuousWorldModel.latentZ64], latent);
});

test('seeded or restored hub counters cannot admit precision arrays that have never executed', () => {
  const h = fixture();
  h.bleedingEdge25Engine = new BleedEdge25AlifeEngine();
  h.trainableAlifeNeuralHub.totalBackpropStepsTrained = 1000000;
  run(h);
  const sources = () => h.aliveNeuralCoupling.snapshot().sources.filter(item => item.id.startsWith('precision-'));
  assert.equal(sources().length, 7);
  assert(sources().every(item => !item.available && item.gate === 0));
  h.bleedingEdge25Engine.step60Hz({}, 2, 2);
  h.stepTrainableAlifeNeuralHub60Hz();
  assert(sources().every(item => !item.available), 'attempt counters and an early-return engine call are not execution');
  h.bleedingEdge25Engine.step60Hz(h, 3, 3);
  h.stepTrainableAlifeNeuralHub60Hz();
  assert(sources().every(item => item.available && item.gate > 0));
});

test('precision and Float32 Mamba receipts reflect their own completed computations', () => {
  const h = fixture();
  h.bleedingEdge25Engine = new BleedEdge25AlifeEngine();
  const engine = h.bleedingEdge25Engine;
  const roster = () => checkpoints.capture({ precision: engine }, {}).tensors.map(item => item.path.join('.'));
  const beforeRoster = roster();
  const kernelStep = engine._stepMultiPrecisionHybridKernels;
  engine._stepMultiPrecisionHybridKernels(h.trainableAlifeNeuralHub.zPerc16, 1);
  assert.deepEqual(engine.precisionExecutionEvidence(), { kernelsCompleted: true, mambaCompleted: false });
  run(h);
  const sources = () => h.aliveNeuralCoupling.snapshot().sources.filter(item => item.id.startsWith('precision-'));
  assert(sources().slice(0, 6).every(item => item.available));
  assert.equal(sources()[6].available, false, 'running the six precision kernels does not execute Float32 Mamba');
  engine._stepMultiPrecisionHybridKernels = () => { throw Error('injected kernel failure'); };
  assert.throws(() => engine.step60Hz(h, 2, 2), /injected kernel failure/);
  h.stepTrainableAlifeNeuralHub60Hz();
  assert(sources().slice(0, 6).every(item => !item.available), 'a failed new engine step revokes old kernel receipts');
  assert.equal(sources()[6].available, true, 'the Mamba computation completed before this kernel failure');
  engine._stepMultiPrecisionHybridKernels = kernelStep;
  engine.step60Hz(h, 3, 3);
  h.stepTrainableAlifeNeuralHub60Hz();
  assert(sources().every(item => item.available));
  assert.deepEqual(roster(), beforeRoster, 'private receipts add no tensor or checkpoint state');
  const receipt = engine.precisionExecutionEvidence(); receipt.kernelsCompleted = false;
  assert.equal(engine.precisionExecutionEvidence().kernelsCompleted, true, 'reported evidence cannot mutate the receipt');
});

test('a failing direct precision update invalidates its previous success receipt', () => {
  const h = fixture(), engine = h.bleedingEdge25Engine;
  assert.equal(engine.precisionExecutionEvidence().kernelsCompleted, true);
  const ring = engine.i64Cyclotomic8Arena;
  engine.i64Cyclotomic8Arena = [1, 2, 3, 4];
  assert.throws(() => engine._stepMultiPrecisionHybridKernels(h.trainableAlifeNeuralHub.zPerc16, 2), /BigInt/);
  assert.equal(engine.precisionExecutionEvidence().kernelsCompleted, false);
  engine.i64Cyclotomic8Arena = ring;
  engine._stepMultiPrecisionHybridKernels(h.trainableAlifeNeuralHub.zPerc16, 3);
  assert.equal(engine.precisionExecutionEvidence().kernelsCompleted, true);
});

test('install is idempotent and direct coupling tensors participate in checkpoint verification and restore', async () => {
  const h = run(fixture()), api = h.aliveNeuralCoupling, wrapper = h.stepTrainableAlifeNeuralHub60Hz;
  assert.equal(install(h), api); assert.equal(h.stepTrainableAlifeNeuralHub60Hz, wrapper);
  api.feedback(0.7, 100); api.feedback(0.4, 101);
  const names = ['aliveCouplingWeights', 'aliveCouplingGateLogits', 'aliveCouplingEligibility', 'aliveCouplingFeatures', 'aliveCouplingInput', 'aliveCouplingCounters'];
  const saved = names.map(name => [...h[name]]);
  assert(saved[1].some(value => value !== 0), 'checkpoint includes learned gates');
  const captured = checkpoints.capture({ policy: h }, { agentId: 'fixture' });
  for (const name of names) assert(captured.tensors.some(item => item.path[0] === name), name);
  const record = await checkpoints.seal(captured);
  await checkpoints.verify(record);
  for (const name of names) h[name].fill(0.35);
  checkpoints.applyVerified(record, { policy: h });
  for (let i = 0; i < names.length; i++) assert.deepEqual([...h[names[i]]], saved[i], names[i]);
  assert.equal(api.snapshot().feedbackUpdates, 1, 'closure reads restored counter tensor');
});

test('the original hub exception propagates and the measured observation is restored', () => {
  const h = fixture(), originalObs = [...h.obsVec];
  h.stepTrainableAlifeNeuralHub60Hz = function () { throw new Error('hub failure'); };
  install(h);
  assert.throws(() => h.stepTrainableAlifeNeuralHub60Hz(), /hub failure/);
  assert.deepEqual([...h.obsVec], originalObs);
  assert.equal(h.aliveNeuralCoupling.snapshot().steps, 0);
});

const omegaSource = (h, id) => h.aliveNeuralCoupling.snapshot().sources.find(source => source.id === id);
const omegaChanges = [
  ['Lorenz x', h => { h.omega100Engine.d2_topologyChaos.m15_lorenzAttractorXyz[0] += 4; }],
  ['Lorenz y', h => { h.omega100Engine.d2_topologyChaos.m15_lorenzAttractorXyz[1] += 4; }],
  ['Lorenz z', h => { h.omega100Engine.d2_topologyChaos.m15_lorenzAttractorXyz[2] += 4; }],
  ['Izhikevich voltage', h => { h.omega100Engine.d1_neuralDynamics.m03_izhikevichBurstState.v += 4; }],
  ['Izhikevich recovery', h => { h.omega100Engine.d1_neuralDynamics.m03_izhikevichBurstState.u += 4; }]
];
for (const [name, mutate] of omegaChanges) test(`${name} perturbation through actual integration changes shared input, latent state and motor`, () => {
  const baseline = run(fixture()), changed = fixture();
  mutate(changed); run(changed);
  assert(differs(changed.hubInputSeen, baseline.hubInputSeen));
  assert(differs(changed.continuousWorldModel.latentZ64, baseline.continuousWorldModel.latentZ64));
  assert(differs(changed.trainableAlifeNeuralHub.learnedMotorThrust2D, baseline.trainableAlifeNeuralHub.learnedMotorThrust2D));
});

test('Omega descriptive statuses, percentages and constant module claims do not enter the shared model', () => {
  const baseline = run(fixture()), changed = run(fixture());
  const engine = changed.omega100Engine;
  engine.totalActiveModules = 1000000; engine.verifiedModulesCount = -1000000;
  engine.lastOmniscienceHeadline = 'made-up status'; engine.summaryBanner = 'made-up banner';
  engine.d1_neuralDynamics.m03_izhikevichBurstState.mode = 'made-up mode';
  engine.d3_quantumActiveInference.m24_markovBlanketIntegrityPct = Infinity;
  engine.d10_consciousnessAutopoiesis.m100_autopoieticViabilityPct = NaN;
  // Reset consumers; do not re-run Omega, which would overwrite the telemetry.
  for (const h of [baseline, changed]) {
    h.continuousWorldModel.latentZ64.fill(.2); h.trainableAlifeNeuralHub.learnedMotorThrust2D.fill(0);
    h.stepTrainableAlifeNeuralHub60Hz();
  }
  assert.deepEqual([...changed.hubInputSeen], [...baseline.hubInputSeen]);
  assert.deepEqual([...changed.continuousWorldModel.latentZ64], [...baseline.continuousWorldModel.latentZ64]);
  assert.deepEqual([...changed.trainableAlifeNeuralHub.learnedMotorThrust2D], [...baseline.trainableAlifeNeuralHub.learnedMotorThrust2D]);
});

test('seeded, missing and no-op Omega engines remain unavailable until an actual integration is observed', () => {
  for (const state of ['unstepped', 'missing', 'no-method', 'no-op']) {
    const h = fixture();
    if (state === 'missing') h.omega100Engine = null;
    if (state === 'no-method') delete h.stepOmega100OmniscienceEngine;
    if (state === 'no-op') h.stepOmega100OmniscienceEngine = function () { return this.omega100Engine; };
    install(h);
    if (state === 'no-op') h.stepOmega100OmniscienceEngine();
    h.stepTrainableAlifeNeuralHub60Hz();
    for (const id of ['omega-lorenz', 'omega-izhikevich']) {
      assert.equal(omegaSource(h, id).available, false, state);
      assert.equal(omegaSource(h, id).gate, 0, state);
    }
    assert.equal(h.aliveNeuralCoupling.snapshot().sourceCount, 22, state);
  }
});

test('replacing an Omega engine or state record cannot reuse old execution evidence', () => {
  for (const replaceEngine of [false, true]) {
    const h = run(fixture());
    if (replaceEngine) h.omega100Engine = structuredClone(h.omega100Engine);
    else {
      h.omega100Engine.d2_topologyChaos.m15_lorenzAttractorXyz = [...h.omega100Engine.d2_topologyChaos.m15_lorenzAttractorXyz];
      h.omega100Engine.d1_neuralDynamics.m03_izhikevichBurstState = { ...h.omega100Engine.d1_neuralDynamics.m03_izhikevichBurstState };
    }
    h.stepTrainableAlifeNeuralHub60Hz();
    assert.equal(omegaSource(h, 'omega-lorenz').available, false);
    assert.equal(omegaSource(h, 'omega-izhikevich').available, false);
    h.stepOmega100OmniscienceEngine(); h.stepTrainableAlifeNeuralHub60Hz();
    assert.equal(omegaSource(h, 'omega-lorenz').available, true);
    assert.equal(omegaSource(h, 'omega-izhikevich').available, true);
  }
});

test('nonfinite or incomplete Omega state is rejected while the shared model and gates remain finite', () => {
  for (const [id, corrupt] of [
    ['omega-lorenz', h => { h.omega100Engine.d2_topologyChaos.m15_lorenzAttractorXyz[1] = Infinity; }],
    ['omega-izhikevich', h => { h.omega100Engine.d1_neuralDynamics.m03_izhikevichBurstState.u = NaN; }],
    ['omega-izhikevich', h => { delete h.omega100Engine.d1_neuralDynamics.m03_izhikevichBurstState.v; }]
  ]) {
    const h = run(fixture()); corrupt(h); h.stepTrainableAlifeNeuralHub60Hz();
    assert.equal(omegaSource(h, id).available, false);
    assert.equal(omegaSource(h, id).gate, 0);
    assert(h.aliveNeuralCoupling.snapshot().rejectedNonfiniteValues > 0);
    for (const tensor of [h.hubInputSeen, h.continuousWorldModel.latentZ64, h.trainableAlifeNeuralHub.learnedMotorThrust2D]) {
      assert([...tensor].every(Number.isFinite));
    }
  }
});

test('observed outcome feedback trains both computed Omega gates and projection rows', () => {
  const h = run(fixture()), api = h.aliveNeuralCoupling;
  const first = h.aliveCouplingWeights.slice(22 * 16), initialGates = h.aliveCouplingGateLogits.slice(22);
  api.feedback(.8, 1); api.feedback(.4, 2);
  for (let source = 0; source < 2; source++) {
    assert(differs(h.aliveCouplingWeights.slice((22 + source) * 16, (23 + source) * 16), first.slice(source * 16, (source + 1) * 16)));
    assert.notEqual(h.aliveCouplingGateLogits[22 + source], initialGates[source]);
  }
});
