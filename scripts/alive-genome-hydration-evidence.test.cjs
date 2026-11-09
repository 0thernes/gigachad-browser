'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const codec = require('../systems/alive-genome-codec.js');
const { captureGenomeHydration, captureGenomeInitialState, assessGenomeHydration, captureTrainerHydration, assessTrainerHydration,
  captureReplayHydration, assessReplayHydration, captureHubHydration, assessHubHydration,
  captureCortexHydration, assessCortexHydration } = require('./alive-genome-hydration-evidence.cjs');
const index = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const HUB = ['W_perc_enc', 'W_perc_dec', 'W_dyn1', 'W_dyn2', 'W_diff1', 'W_diff2', 'W_gen1', 'W_gen2', 'W_disc1', 'W_disc2', 'W_aware16'];
const SLTC = ['sltcWeights64', 'sltcRecWeights64', 'sltcBias64'];
const AOT = ['W_aot_contractor', 'W_tot_branch4x16x16', 'W_got_attn'];
function method(name, context) {
  const text = index.match(new RegExp(`^      ${name}\\([^)]*\\) \\{[\\s\\S]*?^      \\}`, 'm'))?.[0];
  assert(text, `actual ${name} method exists`);
  return vm.runInContext(`({${text}}).${name}`, context);
}
function payload() {
  const vector = () => [.123456789, -7, 7, null, -0.00000001];
  return { authorityEpoch: 9, simulationTick: 12345, policyCid: 'policy-persisted', checkpointCid: 'checkpoint-persisted',
    bodyRecipe: { bodyCid: 'body-persisted', limbCount: 8, appearance: { glyph: 'entity Ω' } },
    W_actor: vector(), W_metamorph: vector(), W_critic: vector(), W_world: vector(),
    offspringColony: Array.from({ length: 7 }, (_, id) => ({ id })),
    episodicMemory: Array.from({ length: 45 }, (_, id) => ({ id, nested: { text: 'memory' } })),
    semanticMemory: { concepts: { learned: [1, 2] } }, proceduralMemory: { route: { choices: ['a', 'b'] } },
    handoffLedger: Array.from({ length: 20 }, (_, epoch) => ({ epoch })),
    dreamReplaysCount: 8, pelletsEatenCount: 17, horizontalTransfersCount: 3,
    personality: { curiosity: .625 }, emotionState: { activeEmotion: 'CURIOUS' }, morphogenesis: { totalExperienceXp: 99 },
    cognitiveCortex: { realizationLedger: Array.from({ length: 40 }, (_, id) => ({ id })), nested: { observed: true } },
    visitedUrls: Array.from({ length: 205 }, (_, id) => `https://example.org/${id}`),
    clickedAnchors: Array.from({ length: 205 }, (_, id) => `anchor-${id}`), swarmFormation: 'ORBIT',
    sovereignStats: { commandsExecutedCount: 4, vaultEngramsCrystallized: 5, bookmarksAutonomouslyPinned: 6,
      maxsmartDossiersSynthesized: 7, vibeCssMutationsCount: 8, emergentQueriesInjected: 0 },
    causalPropositions: Array.from({ length: 80 }, (_, id) => ({ id })),
    trainableHub: { ...Object.fromEntries(HUB.map(key => [key, vector()])), totalBackpropStepsTrained: 31, ideasSynthesizedCount: 0, dreamConsolidationSteps: 9 },
    sltcLearned: Object.fromEntries(SLTC.map(key => [key, vector()])),
    aotTotGotLearned: Object.fromEntries(AOT.map(key => [key, vector()])),
    portedPantheonLearned: null, authenticAsmodensius: null, savedAt: '2026-11-09T00:00:00Z' };
}
function hydrate(input = payload(), { federation = null, authentic = null, initialCounters = {} } = {}) {
  const raw = typeof input === 'string' ? input : JSON.stringify(input), saved = JSON.parse(raw);
  const weights = keys => Object.fromEntries(keys.map(key => [key, new Float32Array(5).fill(.75)]));
  const runtime = { ...weights(['W_actor', 'W_metamorph', 'W_critic', 'W_world', 'W_actor_frozen', 'W_world_frozen']),
    agentId: 'asmodenius-omega-001', authorityEpoch: 1, simulationTick: 0, policyCid: 'new', checkpointCid: 'new',
    bodyRecipe: { defaultOnly: true }, offspringColony: [], episodicMemory: [], semanticMemory: { defaultOnly: true }, proceduralMemory: {},
    handoffLedger: [], personality: {}, emotionState: {}, morphogenesis: {}, cognitiveCortex: { realizationLedger: [] },
    visitedUrlTabooSet: new Set(['https://initializer.example/']), clickedAnchorTabooSet: new Set(['initializer-anchor']),
    swarmCollective: { formationMode: 'DEFAULT' }, SWARM_FORMATIONS: ['DEFAULT', 'ORBIT'], sovereignMaster: {}, causalGraph: { propositions: [] },
    trainableAlifeNeuralHub: { ...weights(HUB), totalBackpropStepsTrained: 1, ideasSynthesizedCount: 1, dreamConsolidationSteps: 1 },
    deepWebAndSltcConnectomeEngine: weights(SLTC), aotTotGotEngine: weights(AOT),
    portedMultiverseBrains: federation, authenticAsmodensius: authentic,
    updateMorphologyVector() { this.morphologyUpdated = true; } };
  const context = vm.createContext({ runtime, window: { AliveGenomeCodec: codec }, btoa, Object, Array, Float32Array, Float64Array,
    ArrayBuffer, DataView, Uint8Array, Uint16Array, Int8Array, BigUint64Array,
    localStorage: { getItem: () => raw }, console: { warn() {} } });
  runtime.loadPersistentGenome = method('loadPersistentGenome', context);
  runtime.capturePersistentGenomePayload = method('capturePersistentGenomePayload', context);
  Object.assign(runtime.trainableAlifeNeuralHub, initialCounters);
  const initialState = JSON.parse(JSON.stringify(vm.runInContext(`(${captureGenomeInitialState.toString()})(runtime)`, context)));
  assert.equal(runtime.loadPersistentGenome(), true, 'actual loader executes before observation');
  const snapshot = JSON.parse(JSON.stringify(vm.runInContext(`(${captureGenomeHydration.toString()})(runtime)`, context)));
  return { runtime, snapshot, raw, saved, context, initialState };
}
test('serialized capture observes actual loader; all23 arrays match exact clamp/Float32 bytes', () => {
  const f = hydrate(), evidence = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
  assert.equal(evidence.ok, true, JSON.stringify(evidence.differences));
  assert.equal(evidence.arraysChecked, 23); assert.equal(evidence.elementsChecked, 115); assert.equal(evidence.elementsDifferent, 0);
  assert.equal(f.runtime.W_actor[0], Math.fround(.123456789));
  assert.notEqual(f.runtime.W_actor[0], JSON.parse(f.snapshot.encodedJSON).W_actor[0], 'encoded writer is rounded and is not the byte oracle');
  assert.equal(f.snapshot.fields.authorityEpoch, 10);
  assert.equal(f.snapshot.fields.episodicMemory.length, 40); assert.equal(JSON.parse(f.snapshot.encodedJSON).episodicMemory.length, 30);
  assert.equal(f.snapshot.fields.causalPropositions.length, 72); assert.equal(JSON.parse(f.snapshot.encodedJSON).causalPropositions.length, 48);
  assert.equal(f.snapshot.fields.visitedUrls.length, 201); assert.equal(JSON.parse(f.snapshot.encodedJSON).visitedUrls.length, 160);
  assert.equal(f.snapshot.fields.cognitiveCortex.realizationLedger.length, 36);
  assert.ok(evidence.excluded.some(item => item.path === 'agentId'));
  assert.equal(JSON.stringify(evidence).includes('base64'), false, 'assessment is hashes/counts, not array dumps');
});
test('one raw bit or frozen-mirror change fails even with unchanged rounded encoded payload', () => {
  for (const name of ['W_actor', 'W_actor_frozen', 'trainableAlifeNeuralHub.W_dyn1']) {
    const f = hydrate(), bytes = Buffer.from(f.snapshot.arrays[name].base64, 'base64');
    bytes[0] ^= 1; f.snapshot.arrays[name].base64 = bytes.toString('base64');
    const evidence = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
    assert.equal(evidence.ok, false); assert.equal(evidence.elementsDifferent, 1);
    assert.ok(evidence.differences.some(item => item.path === name));
  }
});
test('identity/memory differences, missing bytes and nonfinite skipped inputs cannot falsely pass', () => {
  const f = hydrate(); f.snapshot.fields.bodyRecipe.bodyCid = 'wrong'; f.snapshot.fields.episodicMemory[0].id = -1;
  let evidence = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
  assert.equal(evidence.ok, false); assert.equal(evidence.differenceCount, 2);
  const missing = hydrate(); missing.snapshot.arrays.W_critic.base64 = 'not base64';
  assert.equal(assessGenomeHydration(missing.raw, missing.snapshot, { initialState: missing.initialState }).ok, false);
  const input = payload(); input.W_actor[0] = 'not-finite';
  const skipped = hydrate(input); evidence = assessGenomeHydration(skipped.raw, skipped.snapshot, { initialState: skipped.initialState });
  assert.equal(evidence.status, 'incomplete-evidence'); assert.equal(evidence.ok, false);
  assert.ok(evidence.inconclusive.some(item => item.path === 'W_actor_frozen'));
});
test('negative zero and subnormal Float32 values use exact bytes, not tolerance', () => {
  const p = payload(); p.W_actor = [1e-45, -1e-45, 0, -5, 5];
  const raw = JSON.stringify(p).replace('"W_actor":[1e-45,-1e-45,0,-5,5]', '"W_actor":[1e-45,-1e-45,-0,-5,5]');
  const f = hydrate(raw); assert.equal(Object.is(f.runtime.W_actor[2], -0), true);
  assert.equal(assessGenomeHydration(raw, f.snapshot, { initialState: f.initialState }).ok, true);
  const bytes = Buffer.from(f.snapshot.arrays.W_actor.base64, 'base64'); bytes[11] = 0;
  f.snapshot.arrays.W_actor.base64 = bytes.toString('base64');
  assert.equal(assessGenomeHydration(raw, f.snapshot, { initialState: f.initialState }).ok, false);
});
test('actual ported importer is independently checked with F64/F32, range, alias, Dale and FP16 rules', () => {
  const { PortedMultiverseBrainsFederation } = require('../systems/ported-multiverse-brains.js');
  const federation = new PortedMultiverseBrainsFederation(), p = payload();
  p.portedPantheonLearned = federation.exportLearnedState();
  p.portedPantheonLearned.stepCount = 7.9; p.portedPantheonLearned.totalOnlinePlasticUpdates = 11.2;
  p.portedPantheonLearned.asmodensiusRlsW8x2[0] = 9;
  p.portedPantheonLearned.asmodensiusRlsW16x2[0] = -99;
  p.portedPantheonLearned.glitchlingWSite16[0] = 10;
  p.portedPantheonLearned.tsotchkeDaleRaw16x16[0] = -9;
  p.portedPantheonLearned.glitchlingCerebellar2x2[0] = -1e-99;
  p.portedPantheonLearned.glyphFp16FastSlots16.splice(0, 4, 0x7c00, 0xfc00, 0x4000, 0xc000);
  p.portedPantheonLearned.blackHoleMassM = 10;
  const f = hydrate(p, { federation }), evidence = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
  assert.equal(evidence.ok, true, JSON.stringify(evidence.differences));
  assert.equal(Object.is(federation.brain2Glitchling.cerebellarCalib2x2[0], -0), true, 'underflowed negative zero is retained by actual F32 import');
  const encoded = JSON.parse(f.snapshot.encodedJSON); encoded.portedPantheonLearned.asmodensiusRlsW8x2[0] -= .000000001;
  f.snapshot.encodedJSON = JSON.stringify(encoded);
  assert.equal(assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState }).ok, false);
});
test('actual authentic import re-exports identical envelope, RNG and signed-zero state', () => {
  const { AuthenticAsmodensiusAdapter } = require('../systems/authentic-asmodensius-adapter.js');
  const original = new AuthenticAsmodensiusAdapter({ seed: 17 });
  original.step(new Float64Array(16).fill(.4)); original.lastInput[0] = -0;
  const p = payload(); p.authenticAsmodensius = original.exportState();
  const f = hydrate(p, { authentic: new AuthenticAsmodensiusAdapter({ seed: 23 }) });
  const evidence = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
  assert.equal(evidence.ok, true, JSON.stringify(evidence.differences));
  const corrupt = JSON.parse(f.raw); corrupt.authenticAsmodensius.checksum = '00000000';
  assert.equal(assessGenomeHydration(JSON.stringify(corrupt), f.snapshot, { initialState: f.initialState }).ok, false);
});

test('falsy stored counters require actual initializer evidence instead of a hardcoded seed', () => {
  const p = payload();
  p.trainableHub.totalBackpropStepsTrained = 0;
  p.trainableHub.ideasSynthesizedCount = 0;
  delete p.trainableHub.dreamConsolidationSteps;
  for (const seed of [0, 1, 42]) {
    const initialCounters = { totalBackpropStepsTrained: seed, ideasSynthesizedCount: seed, dreamConsolidationSteps: seed };
    const f = hydrate(p, { initialCounters });
    const unknown = assessGenomeHydration(f.raw, f.snapshot);
    assert.equal(unknown.status, 'incomplete-evidence');
    assert.equal(unknown.inconclusive.filter(item => item.path.startsWith('trainableHub.')).length, 3);
    const evidence = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
    assert.equal(evidence.ok, true, JSON.stringify(evidence));
    assert.deepEqual(f.snapshot.fields.trainableHub, initialCounters);
    f.snapshot.fields.trainableHub.totalBackpropStepsTrained = seed + 1;
    assert.equal(assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState }).ok, false);
  }
});

// These cases test the verification observer/assessor using original fixture
// bytes, not a production decoder or an assertion of importer/startup behavior.
function exactPrimaryHydration() {
  const f = hydrate();
  const fixture = path.join(__dirname, '../tests/fixtures/alive-primary-policy-v1');
  const { createExpectedPrimaryCatalog } = require('./alive-primary-policy-evidence.cjs');
  for (const row of createExpectedPrimaryCatalog().tensors) {
    f.runtime[row.id] = new Float32Array(row.length);
    new Uint8Array(f.runtime[row.id].buffer).set(fs.readFileSync(path.join(fixture, row.id + '.bin')));
  }
  f.runtime.deepCortex = { W_actor: f.runtime.W_actor, W_critic: f.runtime.W_critic };
  f.saved.primaryPolicyState = JSON.parse(fs.readFileSync(path.join(fixture, 'payload.json'), 'utf8'));
  f.raw = JSON.stringify(f.saved);
  f.context.window.alivePrimaryPolicyBootstrap = { capture() { return { fixtureOnly: true }; }, captureComponents() { return { primary: { fixtureOnly: true } }; } };
  f.recapture = () => JSON.parse(JSON.stringify(vm.runInContext(`(${captureGenomeHydration.toString()})(runtime)`, f.context)));
  f.snapshot = f.recapture();
  return f;
}
test('pending primary marker is omitted only from synchronous legacy diagnostic; exact six bytes are authoritative', () => {
  const f = exactPrimaryHydration();
  assert.deepEqual(f.snapshot.errors, []);
  assert.equal(f.snapshot.primaryDiagnosticOmitted, true);
  assert.equal(Object.hasOwn(JSON.parse(f.snapshot.encodedJSON), 'primaryPolicyState'), false);
  assert.equal(codec.hasPrimaryState(f.runtime.capturePersistentGenomePayload()), true, 'actual payload marker remains intact');
  assert.equal(f.snapshot.primaryPolicyEvidence.entries.length, 6);
  const evidence = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
  assert.equal(evidence.ok, true, JSON.stringify(evidence));
  assert.equal(evidence.arraysChecked, 23); assert.equal(evidence.elementsChecked, 803);
  assert.equal(evidence.primaryPolicy.elementsChecked, 718);
  assert.equal(evidence.primaryPolicy.exactComparison.bytesCompared, 2872);
  assert.notDeepEqual(f.runtime.W_actor, f.runtime.W_actor_frozen);
  assert.equal(JSON.stringify(evidence).includes('dataBase64'), false);
});
test('exact primary state rejects live one-bit tamper and regenerated baselines while keeping17 legacy checks', () => {
  for (const key of ['W_actor', 'W_actor_frozen', 'W_world_frozen']) {
    const f = exactPrimaryHydration(); new Uint8Array(f.runtime[key].buffer)[0] ^= 1;
    const result = assessGenomeHydration(f.raw, f.recapture(), { initialState: f.initialState });
    assert.equal(result.ok, false); assert.equal(result.elementsDifferent, 1);
    assert.ok(result.differences.some(row => row.path === key));
  }
  const f = exactPrimaryHydration(); f.runtime.W_actor_frozen.set(f.runtime.W_actor); f.runtime.W_world_frozen.set(f.runtime.W_world);
  let result = assessGenomeHydration(f.raw, f.recapture(), { initialState: f.initialState });
  assert.equal(result.ok, false);
  assert.deepEqual(result.primaryPolicy.differences.filter(row => row.kind === 'value-bits').map(row => row.id).sort(), ['W_actor_frozen', 'W_world_frozen']);
  const other = exactPrimaryHydration(); other.runtime.trainableAlifeNeuralHub.W_dyn1[0] += .1;
  result = assessGenomeHydration(other.raw, other.recapture(), { initialState: other.initialState });
  assert.equal(result.ok, false); assert.equal(result.primaryPolicy.ok, true);
  assert.ok(result.differences.some(row => row.path === 'trainableAlifeNeuralHub.W_dyn1'));
});

test('healing exporter cannot erase pre-export actor or frozen-baseline corruption', () => {
  for (const key of ['W_actor', 'W_actor_frozen', 'W_world_frozen']) {
    const f = exactPrimaryHydration(), originalBytes = Buffer.from(new Uint8Array(f.runtime[key].buffer));
    new Uint8Array(f.runtime[key].buffer)[0] ^= 1;
    const corruptedBytes = Buffer.from(new Uint8Array(f.runtime[key].buffer));
    const exporter = f.runtime.capturePersistentGenomePayload.bind(f.runtime);
    let calls = 0;
    f.runtime.capturePersistentGenomePayload = () => {
      calls++; new Uint8Array(f.runtime[key].buffer).set(originalBytes);
      return exporter();
    };
    const snapshot = f.recapture();
    assert.equal(calls, 1);
    assert.deepEqual(Buffer.from(new Uint8Array(f.runtime[key].buffer)), originalBytes, 'exporter really healed the live view');
    assert.deepEqual(Buffer.from(snapshot.arrays[key].base64, 'base64'), corruptedBytes);
    assert.deepEqual(Buffer.from(snapshot.primaryPolicyEvidence.entries.find(row => row.id === key).dataBase64, 'base64'), corruptedBytes,
      'independent primary snapshot retains pre-export bytes');
    const result = assessGenomeHydration(f.raw, snapshot, { initialState: f.initialState });
    assert.equal(result.ok, false); assert.equal(result.elementsDifferent, 1);
    assert.ok(result.differences.some(row => row.path === key && row.kind === 'value-bits'));
  }
});

test('initial primary alias error remains a failure even if exporter repairs the alias', () => {
  const f = exactPrimaryHydration(), exporter = f.runtime.capturePersistentGenomePayload.bind(f.runtime);
  f.runtime.deepCortex.W_actor = new Float32Array(f.runtime.W_actor);
  f.runtime.capturePersistentGenomePayload = () => { f.runtime.deepCortex.W_actor = f.runtime.W_actor; return exporter(); };
  const snapshot = f.recapture();
  assert.equal(f.runtime.deepCortex.W_actor, f.runtime.W_actor);
  assert.equal(snapshot.primaryPolicyEvidence, null);
  assert.equal(typeof snapshot.primaryPolicyCaptureError, 'string');
  assert.match(snapshot.errors.join(';'), /Initial primary capture failed/);
  assert.equal(assessGenomeHydration(f.raw, snapshot, { initialState: f.initialState }).status, 'invalid-evidence');
});

test('export-time scalar and nested metadata repairs cannot alter direct hydration evidence', () => {
  const f = exactPrimaryHydration(), exporter = f.runtime.capturePersistentGenomePayload.bind(f.runtime);
  f.runtime.simulationTick = -123;
  f.runtime.bodyRecipe.bodyCid = 'incorrect-before-export';
  f.runtime.agentId = 'agent-before-export';
  const originalFormations = f.runtime.SWARM_FORMATIONS.slice();
  f.runtime.capturePersistentGenomePayload = () => {
    f.runtime.simulationTick = f.saved.simulationTick;
    f.runtime.bodyRecipe.bodyCid = f.saved.bodyRecipe.bodyCid;
    f.runtime.agentId = 'agent-after-export';
    f.runtime.SWARM_FORMATIONS.push('AFTER_EXPORT');
    return exporter();
  };
  const snapshot = f.recapture();
  assert.equal(f.runtime.simulationTick, f.saved.simulationTick);
  assert.equal(f.runtime.bodyRecipe.bodyCid, f.saved.bodyRecipe.bodyCid);
  assert.equal(snapshot.fields.simulationTick, -123);
  assert.equal(snapshot.fields.bodyRecipe.bodyCid, 'incorrect-before-export');
  assert.equal(snapshot.agentIdObserved, 'agent-before-export');
  assert.deepEqual(snapshot.allowedFormations, originalFormations);
  const result = assessGenomeHydration(f.raw, snapshot, { initialState: f.initialState });
  assert.equal(result.ok, false);
  assert.ok(result.differences.some(row => row.path === 'simulationTick'));
  assert.ok(result.differences.some(row => row.path === 'bodyRecipe.bodyCid'));
});
test('missing or corrupt primary proof never falls back to matching legacy values', () => {
  const f = exactPrimaryHydration();
  f.snapshot.primaryPolicyEvidence = null;
  assert.equal(assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState }).ok, false);
  const bad = exactPrimaryHydration(); bad.saved.primaryPolicyState.tensorBlob.sha256 = '0'.repeat(64);
  const result = assessGenomeHydration(JSON.stringify(bad.saved), bad.snapshot, { initialState: bad.initialState });
  assert.equal(result.ok, false); assert.equal(result.primaryPolicy.status, 'invalid-primary-wire');
  const broken = exactPrimaryHydration(); broken.runtime.deepCortex.W_actor = new Float32Array(broken.runtime.W_actor);
  assert.equal(assessGenomeHydration(broken.raw, broken.recapture(), { initialState: broken.initialState }).status, 'invalid-evidence');
});
test('sealed primary diagnostic is retained and malformed pending marker is not silently omitted', () => {
  const f = exactPrimaryHydration();
  const original = f.runtime.capturePersistentGenomePayload.bind(f.runtime);
  f.runtime.capturePersistentGenomePayload = () => ({ ...original(), primaryPolicyState: f.saved.primaryPolicyState });
  let snapshot = f.recapture();
  assert.equal(snapshot.primaryDiagnosticOmitted, false);
  assert.deepEqual(JSON.parse(snapshot.encodedJSON).primaryPolicyState, f.saved.primaryPolicyState);
  assert.equal(assessGenomeHydration(f.raw, snapshot, { initialState: f.initialState }).ok, true);
  f.runtime.capturePersistentGenomePayload = () => ({ ...original(), primaryPolicyState: {
    __alive_genome_primary_state_v1__: true, captured: {}, unexpected: true } });
  snapshot = f.recapture(); assert.match(snapshot.errors.join(';'), /Invalid pending primary marker/);
  assert.equal(assessGenomeHydration(f.raw, snapshot, { initialState: f.initialState }).ok, false);
});

// Manual wire around the independent catalog: these tests qualify the observer,
// never use a production adapter/decoder to manufacture expected restored bytes.
function exactTrainerHydration() {
  const f = exactPrimaryHydration(), { createHash } = require('node:crypto');
  const catalog = require('./alive-trainer-state-evidence.cjs').createExpectedTrainerCatalog();
  const weights = Float32Array.from({ length: 16 }, (_, i) => (i - 7) / 16);
  new Uint32Array(weights.buffer).set([0x80000000, 1, 0x80000001, 0]);
  const raw = Buffer.from(weights.buffer), hash = createHash('sha256').update(raw).digest('hex');
  const state = { active: false, generation: 3, committedEpoch: 7, timeoutMs: 1500,
    pendingJobId: null, pendingTargetEpoch: null, applied: 0, submitted: 0 };
  const engine = { W_hyper_u: weights, workerTrainerStatus: { committedEpoch: 999 },
    captureCommittedTrainerState() { return { schemaVersion: 1, kernelId: 'bleeding-hyper-worker-v1', weights: new Float32Array(this.W_hyper_u),
      committedEpoch: state.committedEpoch, timeoutMs: state.timeoutMs }; },
    workerTrainerSnapshot() { return { ...state }; } };
  f.runtime.bleedingEdge25Engine = engine; f.engine = engine; f.trainerState = state;
  Object.assign(f.saved.primaryPolicyState.snapshot, { policyId: f.saved.policyCid, checkpointId: f.saved.checkpointCid, logicalTick: f.saved.simulationTick });
  f.saved.trainerCommittedState = { schema: 'gigachad.learned-state.v1', architecture: catalog.architecture,
    snapshot: { ...f.saved.primaryPolicyState.snapshot },
    tensorManifest: [{ ...catalog.tensors[0], blobOffset: 0, sha256: hash }],
    tensorBlob: { encoding: 'base64', byteLength: 64, sha256: hash, data: raw.toString('base64') },
    stateManifest: catalog.states, stateValues: { committedEpoch: { $type: 'i53', value: 7 }, timeoutMs: { $type: 'i53', value: 1500 } },
    resumeRules: catalog.resumeRules };
  f.context.window.alivePrimaryPolicyBootstrap.captureComponents = () => ({ primary: { fixtureOnly: true }, trainer: { fixtureOnly: true } });
  f.raw = JSON.stringify(f.saved); f.snapshot = f.recapture();
  return f;
}

test('both pending markers are omitted only from diagnostic copy; exact trainer bytes/private clock compare independently', () => {
  const f = exactTrainerHydration(), result = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.arraysChecked, 24); assert.equal(result.elementsChecked, 819);
  assert.equal(result.trainer.comparedBytes, 64); assert.equal(result.trainer.comparedStates, 2); assert.equal(result.trainer.inactive, true);
  assert.equal(f.snapshot.trainerEvidence.committedEpoch, 7, 'editable telemetry is ignored');
  assert.equal(f.snapshot.primaryDiagnosticOmitted, true); assert.equal(f.snapshot.trainerDiagnosticOmitted, true);
  assert.equal(Object.hasOwn(JSON.parse(f.snapshot.encodedJSON), 'trainerCommittedState'), false);
  assert.equal(f.runtime.capturePersistentGenomePayload().trainerCommittedState.__alive_genome_trainer_state_v1__, true);
  assert.equal(JSON.stringify(result).includes('weightsBase64'), false, 'assessor output contains metadata only');
});

test('trainer exporter healing cannot replace direct pre-export bit evidence', () => {
  const f = exactTrainerHydration(), expected = new Uint8Array(f.engine.W_hyper_u.buffer).slice();
  new Uint8Array(f.engine.W_hyper_u.buffer)[17] ^= 1;
  const wrong = Buffer.from(new Uint8Array(f.engine.W_hyper_u.buffer)), exporter = f.runtime.capturePersistentGenomePayload.bind(f.runtime);
  f.runtime.capturePersistentGenomePayload = () => { new Uint8Array(f.engine.W_hyper_u.buffer).set(expected); return exporter(); };
  const observed = f.recapture();
  assert.deepEqual(Buffer.from(observed.trainerEvidence.weightsBase64, 'base64'), wrong);
  assert.deepEqual(new Uint8Array(f.engine.W_hyper_u.buffer), expected);
  const result = assessGenomeHydration(f.raw, observed, { initialState: f.initialState });
  assert.equal(result.ok, false); assert.equal(result.elementsDifferent, 1);
  assert.ok(result.differences.some(row => row.path === 'trainer.W_hyper_u'));
});

test('private capture projection must agree with bytes already observed, even if the API repairs live weights', () => {
  const f = exactTrainerHydration(), expected = new Uint8Array(f.engine.W_hyper_u.buffer).slice(), capture = f.engine.captureCommittedTrainerState;
  new Uint8Array(f.engine.W_hyper_u.buffer)[17] ^= 1;
  f.engine.captureCommittedTrainerState = function () { new Uint8Array(this.W_hyper_u.buffer).set(expected); return capture.call(this); };
  const observed = f.recapture();
  assert.match(observed.trainerCaptureError, /pre-callback direct bytes/);
  assert.match(observed.errors.join(';'), /Initial trainer capture failed/);
  assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, false);
});

test('metadata toJSON healing cannot precede the direct trainer observation', () => {
  const f = exactTrainerHydration(), expected = new Uint8Array(f.engine.W_hyper_u.buffer).slice();
  new Uint8Array(f.engine.W_hyper_u.buffer)[17] ^= 1;
  const wrong = Buffer.from(new Uint8Array(f.engine.W_hyper_u.buffer)), original = f.runtime.bodyRecipe;
  let calls = 0;
  f.runtime.bodyRecipe = { toJSON() { calls++; new Uint8Array(f.engine.W_hyper_u.buffer).set(expected); return original; } };
  const observed = f.recapture();
  assert.ok(calls > 0, 'metadata serialization really executes the healing callback');
  assert.deepEqual(new Uint8Array(f.engine.W_hyper_u.buffer), expected);
  assert.deepEqual(Buffer.from(observed.trainerEvidence.weightsBase64, 'base64'), wrong);
  const result = assessGenomeHydration(f.raw, observed, { initialState: f.initialState });
  assert.equal(result.ok, false); assert.equal(result.elementsDifferent, 1);
  assert.ok(result.differences.some(row => row.path === 'trainer.W_hyper_u'));
});

test('trainer admission, private epoch/configuration and paired snapshot mismatch cannot pass hydration', () => {
  for (const mutate of [
    f => { f.trainerState.active = true; },
    f => { f.trainerState.pendingJobId = 1; f.trainerState.pendingTargetEpoch = 8; },
    f => { f.trainerState.committedEpoch = 8; },
    f => { f.trainerState.timeoutMs = 1600; },
    f => { f.saved.trainerCommittedState.snapshot.modelEpoch++; },
    f => { f.saved.trainerCommittedState.snapshot.logicalTick++; },
    f => { delete f.saved.primaryPolicyState; }
  ]) {
    const f = exactTrainerHydration(); mutate(f);
    const result = assessGenomeHydration(JSON.stringify(f.saved), f.recapture(), { initialState: f.initialState });
    assert.equal(result.ok, false, mutate.toString());
  }
});

test('malformed trainer wrappers reject without invoking accessor fields and sealed diagnostics remain available', () => {
  const f = exactTrainerHydration(), exporter = f.runtime.capturePersistentGenomePayload.bind(f.runtime);
  f.runtime.capturePersistentGenomePayload = () => ({ ...exporter(), trainerCommittedState: f.saved.trainerCommittedState });
  assert.equal(f.recapture().trainerDiagnosticOmitted, false);
  let getterCalls = 0;
  for (const wrapper of [
    { __alive_genome_trainer_state_v1__: true, captured: {}, extra: true },
    { __alive_genome_trainer_state_v1__: false, captured: {} },
    { captured: {} },
    { __alive_genome_trainer_state_v1__: true, captured: null },
    Object.defineProperty({ captured: {} }, '__alive_genome_trainer_state_v1__', { enumerable: true, get() { getterCalls++; throw Error('must not read'); } })
  ]) {
    f.runtime.capturePersistentGenomePayload = () => ({ ...exporter(), trainerCommittedState: wrapper });
    const observed = f.recapture(); assert.ok(observed.errors.length); assert.equal(assessGenomeHydration(f.raw, observed).ok, false);
  }
  assert.equal(getterCalls, 0);
});

test('standalone trainer observer rejects target getters, shared backing, absent proof and noncanonical byte encodings', () => {
  const f = exactTrainerHydration(); let reads = 0;
  const bad = Object.defineProperty({}, 'bleedingEdge25Engine', { get() { reads++; } });
  assert.throws(() => captureTrainerHydration(bad), /own data/); assert.equal(reads, 0);
  f.engine.W_hyper_u = new Float32Array(new SharedArrayBuffer(64));
  assert.throws(() => captureTrainerHydration(f.runtime));
  assert.equal(assessTrainerHydration(f.saved.trainerCommittedState, null).ok, false);
  const observed = { ...f.snapshot.trainerEvidence, weightsBase64: f.snapshot.trainerEvidence.weightsBase64 + '\n' };
  assert.equal(assessTrainerHydration(f.saved.trainerCommittedState, observed).ok, false);
});

// Build the saved replay wire from independent catalog metadata and original
// fixture buffers. No production replay adapter/codec/importer supplies its
// expected bytes, occupied order, Float64 priorities or cursor.
function exactReplayHydration(count = 3, cursor = count === 32 ? 13 : count) {
  const f = exactTrainerHydration(), { createHash } = require('node:crypto');
  const catalog = require('./alive-replay-state-evidence.cjs').createExpectedReplayCatalog(count);
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  const ring = Array.from({ length: count }, (_, slot) => {
    const vector = (length, offset) => Float32Array.from({ length }, (_, i) => (slot * 41 + offset + i) / 128);
    const record = { z16: vector(16, 1), a8: vector(8, 18), zNext16: vector(16, 26), surprise: slot === 0 ? -0 : slot / 7 };
    if (slot === 0) new Uint32Array(record.z16.buffer).set([0x80000000, 1, 0x80000001]);
    return record;
  });
  f.runtime.trainableAlifeNeuralHub.replayRing32 = ring;
  f.runtime.trainableAlifeNeuralHub.replayWritePtr = cursor;
  const chunks = [], tensorManifest = []; let blobOffset = 0;
  for (const row of catalog.tensors) {
    const match = /^replay\/(\d+)\/(z16|a8|zNext16)$/.exec(row.id);
    assert.ok(match, 'independent replay tensor ID is recognized');
    const bytes = Buffer.from(ring[Number(match[1])][match[2]].buffer);
    tensorManifest.push({ ...row, blobOffset, sha256: sha(bytes) }); chunks.push(bytes); blobOffset += bytes.length;
  }
  const i53 = value => ({ $type: 'i53', value });
  const stateValues = { count: i53(count), cursor: i53(cursor), indices: { $type: 'array', items: Array.from({ length: count }, (_, i) => i53(i)) } };
  for (let slot = 0; slot < count; slot++) {
    const bytes = Buffer.alloc(8); bytes.writeDoubleLE(ring[slot].surprise);
    stateValues[`replay/${slot}/surprise`] = { $type: 'f64', hex: bytes.toString('hex') };
  }
  const bytes = Buffer.concat(chunks);
  f.saved.replayMemoryState = { schema: 'gigachad.learned-state.v1', architecture: catalog.architecture,
    snapshot: { ...f.saved.primaryPolicyState.snapshot }, tensorManifest,
    tensorBlob: { encoding: 'base64', byteLength: bytes.length, sha256: sha(bytes), data: bytes.toString('base64') },
    stateManifest: catalog.states, stateValues, resumeRules: catalog.resumeRules };
  f.context.window.alivePrimaryPolicyBootstrap.captureComponents = () => ({ primary: { fixtureOnly: true }, trainer: { fixtureOnly: true }, replay: { fixtureOnly: true } });
  f.raw = JSON.stringify(f.saved); f.snapshot = f.recapture(); f.replayRing = ring;
  return f;
}

test('empty, partial and full replay rings compare independently and omit only the pending diagnostic wrapper', () => {
  for (const [count, cursor] of [[0, 0], [3, 3], [32, 0], [32, 17], [32, 31]]) {
    const f = exactReplayHydration(count, cursor), result = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.replay.ok, true); assert.equal(result.replay.count, count); assert.equal(result.replay.cursor, cursor);
    assert.equal(result.replay.arraysChecked, count * 3); assert.equal(result.replay.elementsChecked, count * 40);
    assert.equal(f.snapshot.replayEvidence.entries.length, count); assert.equal(f.snapshot.replayEvidence.tensorBytes, count * 160);
    assert.equal(f.snapshot.replayCaptureError, null); assert.equal(f.snapshot.replayDiagnosticOmitted, true);
    assert.equal(Object.hasOwn(JSON.parse(f.snapshot.encodedJSON), 'replayMemoryState'), false);
    assert.equal(f.runtime.capturePersistentGenomePayload().replayMemoryState.__alive_genome_replay_state_v1__, true);
    assert.equal(result.arraysChecked, 24 + count * 3); assert.equal(result.elementsChecked, 819 + count * 40);
    if (count) assert.equal(f.snapshot.replayEvidence.entries[0].surpriseHex, '0000000000000080', 'negative zero priority survives serializable observation');
    assert.doesNotMatch(JSON.stringify(result), /z16Hex|a8Hex|zNext16Hex|surpriseHex|"data":/, 'assessment remains metadata only');
  }
});

test('replay payload bits, priority bits, occupied order and full insertion cursor cannot be replaced by matching exports', () => {
  for (const mutate of [
    f => { new Uint8Array(f.replayRing[0].z16.buffer)[9] ^= 1; },
    f => { f.replayRing[0].surprise = 0; },
    f => { [f.replayRing[0], f.replayRing[1]] = [f.replayRing[1], f.replayRing[0]]; },
    f => { f.runtime.trainableAlifeNeuralHub.replayWritePtr = 14; }
  ]) {
    const f = exactReplayHydration(32, 13); mutate(f);
    const result = assessGenomeHydration(f.raw, f.recapture(), { initialState: f.initialState });
    assert.equal(result.ok, false, mutate.toString()); assert.equal(result.replay.ok, false);
    assert.ok(result.differences.some(row => row.path.startsWith('replay.')));
  }
});

function installReplayMutation(f, phase, mutation) {
  let calls = 0;
  const run = () => { calls++; mutation(); };
  if (phase === 'trainer-capture' || phase === 'trainer-snapshot') {
    const key = phase === 'trainer-capture' ? 'captureCommittedTrainerState' : 'workerTrainerSnapshot';
    const original = f.engine[key];
    f.engine[key] = function (...args) { run(); return original.apply(this, args); };
  } else if (phase === 'metadata') {
    const original = f.runtime.bodyRecipe;
    f.runtime.bodyRecipe = { toJSON() { run(); return original; } };
  } else {
    const original = f.runtime.capturePersistentGenomePayload.bind(f.runtime);
    f.runtime.capturePersistentGenomePayload = () => { run(); return original(); };
  }
  return () => calls;
}

test('replay bytes are owned before trainer APIs, metadata serialization and production export can heal them', () => {
  for (const phase of ['trainer-capture', 'trainer-snapshot', 'metadata', 'export']) {
    const f = exactReplayHydration(), view = f.replayRing[0].z16;
    const original = new Uint8Array(view.buffer).slice(); new Uint8Array(view.buffer)[9] ^= 1;
    const wrong = Buffer.from(view.buffer).toString('hex');
    const calls = installReplayMutation(f, phase, () => new Uint8Array(view.buffer).set(original));
    const observed = f.recapture();
    assert.ok(calls() > 0, phase + ' callback actually ran');
    assert.deepEqual(new Uint8Array(view.buffer), original, phase + ' repaired the live record');
    assert.equal(observed.replayEvidence.entries[0].z16Hex, wrong, phase + ' cannot replace the first observation');
    const result = assessGenomeHydration(f.raw, observed, { initialState: f.initialState });
    assert.equal(result.ok, false, phase); assert.equal(result.replay.ok, false);
  }
});

test('later callback mutations cannot contaminate an initially correct owned replay observation', () => {
  for (const phase of ['trainer-capture', 'trainer-snapshot', 'metadata', 'export']) {
    const f = exactReplayHydration(), original = f.snapshot.replayEvidence.entries[0].zNext16Hex;
    const calls = installReplayMutation(f, phase, () => { f.replayRing[0].zNext16.fill(9); f.replayRing[0].surprise = 99; });
    const observed = f.recapture();
    assert.ok(calls() > 0); assert.equal(f.replayRing[0].zNext16[0], 9);
    assert.equal(observed.replayEvidence.entries[0].zNext16Hex, original);
    assert.equal(observed.replayEvidence.entries[0].surpriseHex, '0000000000000080');
    const result = assessGenomeHydration(f.raw, observed, { initialState: f.initialState });
    assert.equal(result.ok, true, JSON.stringify({ phase, result }));
  }
});

test('first replay observation failures remain failures after trainer or exporter repairs the ring', () => {
  for (const phase of ['trainer-capture', 'metadata', 'export']) {
    const f = exactReplayHydration(), original = f.replayRing[1];
    delete f.replayRing[1];
    const calls = installReplayMutation(f, phase, () => { f.replayRing[1] = original; });
    const observed = f.recapture();
    assert.ok(calls() > 0); assert.equal(f.replayRing[1], original);
    assert.equal(observed.replayEvidence.ok, false); assert.equal(typeof observed.replayCaptureError, 'string');
    assert.match(observed.errors.join(';'), /Initial replay capture failed/);
    assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, false);
    // Even a later exporter omitting the field cannot turn the initial error
    // into success for a saved record that explicitly requires exact replay.
    observed.errors = []; observed.encodedJSON = '{}';
    assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, false);
  }
});

test('replay requires both exact peers and shared seven-field metadata bound to the outer saved identity', () => {
  for (const mutate of [
    saved => { delete saved.primaryPolicyState; }, saved => { delete saved.trainerCommittedState; },
    saved => { saved.replayMemoryState.snapshot.creatureId = 'other-creature'; },
    saved => { saved.replayMemoryState.snapshot.policyId = 'other-policy'; },
    saved => { saved.replayMemoryState.snapshot.checkpointId = 'other-checkpoint'; },
    saved => { saved.replayMemoryState.snapshot.logicalTick++; },
    saved => { saved.replayMemoryState.snapshot.modelEpoch++; },
    saved => { saved.replayMemoryState.snapshot.capturedAt = '2026-11-10T00:00:00.000Z'; },
    saved => { saved.replayMemoryState.snapshot.resumeBoundary = 'invalid-boundary'; },
    saved => { saved.agentId = 'other-outer-creature'; }
  ]) {
    const f = exactReplayHydration(); mutate(f.saved);
    assert.equal(assessGenomeHydration(JSON.stringify(f.saved), f.snapshot, { initialState: f.initialState }).ok, false, mutate.toString());
  }
});

test('malformed replay pending wrappers, sealed wires and missing direct observations fail closed', () => {
  const f = exactReplayHydration(), exporter = f.runtime.capturePersistentGenomePayload.bind(f.runtime);
  let getterCalls = 0;
  for (const wrapper of [null, {}, { __alive_genome_replay_state_v1__: false, captured: {} },
    { __alive_genome_replay_state_v1__: true, captured: null },
    { __alive_genome_replay_state_v1__: true, captured: {}, extra: true },
    Object.defineProperty({ captured: {} }, '__alive_genome_replay_state_v1__', { enumerable: true, get() { getterCalls++; return true; } }),
    Object.defineProperty({ __alive_genome_replay_state_v1__: true }, 'captured', { enumerable: true, get() { getterCalls++; return {}; } }),
    { schema: 'gigachad.learned-state.v1', tensorBlob: {} }]) {
    f.runtime.capturePersistentGenomePayload = () => ({ ...exporter(), replayMemoryState: wrapper });
    const observed = f.recapture(); assert.ok(observed.errors.length);
    assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, false);
  }
  assert.equal(getterCalls, 0);
  assert.equal(assessReplayHydration(f.saved.replayMemoryState, null).ok, false);
  const invalid = structuredClone(f.saved.replayMemoryState); invalid.tensorBlob.sha256 = '0'.repeat(64);
  assert.equal(assessReplayHydration(invalid, f.snapshot.replayEvidence).ok, false);
  const absent = { ...f.snapshot, replayEvidence: null, replayCaptureError: null };
  assert.equal(assessGenomeHydration(f.raw, absent, { initialState: f.initialState }).ok, false);
});

test('retained sealed replay diagnostics are independently checked instead of trusted as an exporter projection', () => {
  const f = exactReplayHydration(), exporter = f.runtime.capturePersistentGenomePayload.bind(f.runtime);
  // An intentionally permissive diagnostic encoder isolates the assessor's
  // boundary: expected bytes still come from the pre-callback raw observation.
  f.context.window.AliveGenomeCodec = { ...codec, encode: payload => JSON.stringify(payload) };
  f.runtime.capturePersistentGenomePayload = () => ({ ...exporter(), replayMemoryState: f.saved.replayMemoryState });
  let observed = f.recapture();
  assert.equal(observed.replayDiagnosticOmitted, false);
  assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, true);
  const invalid = structuredClone(f.saved.replayMemoryState); invalid.tensorBlob.sha256 = '0'.repeat(64);
  f.runtime.capturePersistentGenomePayload = () => ({ ...exporter(), replayMemoryState: invalid });
  observed = f.recapture(); assert.deepEqual(observed.errors, []);
  const result = assessGenomeHydration(f.raw, observed, { initialState: f.initialState });
  assert.equal(result.ok, false);
  assert.ok(result.differences.some(row => row.path === 'replayMemoryState.exportDiagnostic'));
});

test('legacy snapshots without a replay component remain compatible despite unavailable replay observation', () => {
  const f = hydrate();
  assert.equal(f.snapshot.replayEvidence.ok, false); assert.equal(typeof f.snapshot.replayCaptureError, 'string');
  assert.deepEqual(f.snapshot.errors, []);
  const result = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
  assert.equal(result.ok, true); assert.equal(result.replay, null);
  assert.equal(captureReplayHydration(f.runtime).ok, false);
});

// Execute only the actual constructor's inert hub allocation in the host realm.
// Expected wire bytes below come from those original buffers and the independent
// catalog, never the production hub adapter, exporter, codec or importer.
function exactHubHydration() {
  const f = exactReplayHydration(), { createHash } = require('node:crypto');
  const catalog = require('./alive-hub-state-evidence.cjs').createExpectedHubCatalog();
  const start = index.indexOf('        const mixedArenaBuffer = new ArrayBuffer(8192);');
  const end = index.indexOf('        // 13G.', start);
  assert.ok(start >= 0 && end > start, 'actual hub allocation remains an independently executable fragment');
  new Function(index.slice(start, end)).call(f.runtime);
  const hub = f.runtime.trainableAlifeNeuralHub;
  hub.replayRing32 = f.replayRing; hub.replayWritePtr = f.replayRing.length;
  hub.W_perc_enc[0] = .123456789; hub.b_aware = -0;
  hub.totalBackpropStepsTrained = 0; hub.ideasSynthesizedCount = 0; hub.dreamConsolidationSteps = 0;
  new Uint8Array(hub.mixedArenaBuffer, 4928).set(Uint8Array.from({ length: 3264 }, (_, i) => (i * 37 + 11) & 255));
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  const chunks = [], tensorManifest = []; let blobOffset = 0, derived = 0;
  for (const row of catalog.tensors) {
    const field = row.paths[0].keys.at(-1), view = hub[field];
    let bytes;
    if (ArrayBuffer.isView(view)) bytes = Buffer.from(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
    else {
      derived++;
      assert.equal(row.backingOffset, 4928); assert.equal(row.byteLength, 3264);
      bytes = Buffer.from(new Uint8Array(hub.mixedArenaBuffer, row.backingOffset, row.byteLength));
    }
    assert.equal(bytes.length, row.byteLength);
    tensorManifest.push({ ...row, blobOffset, sha256: sha(bytes) }); chunks.push(bytes); blobOffset += bytes.length;
  }
  assert.equal(derived, 1, 'only the reserved arena tail is a derived wire view');
  const stateValues = {};
  for (const row of catalog.states) {
    const declaration = catalog.descriptorDefinition.states.find(entry => entry.id === row.id);
    const value = hub[declaration.paths[0].keys.at(-1)];
    if (row.valueType === 'f64') {
      const bytes = Buffer.alloc(8); bytes.writeDoubleLE(value); stateValues[row.id] = { $type: 'f64', hex: bytes.toString('hex') };
    } else if (row.valueType === 'i53') stateValues[row.id] = { $type: 'i53', value };
    else if (row.valueType === 'array') stateValues[row.id] = { $type: 'array', items: value.slice() };
    else { assert.equal(row.valueType, 'string'); stateValues[row.id] = value; }
  }
  const bytes = Buffer.concat(chunks);
  f.saved.hubMemoryState = { schema: 'gigachad.learned-state.v1', architecture: catalog.architecture,
    snapshot: { ...f.saved.primaryPolicyState.snapshot }, tensorManifest,
    tensorBlob: { encoding: 'base64', byteLength: bytes.length, sha256: sha(bytes), data: bytes.toString('base64') },
    stateManifest: catalog.states, stateValues, resumeRules: catalog.resumeRules };
  f.context.window.alivePrimaryPolicyBootstrap.captureComponents = () => ({ primary: { fixtureOnly: true }, trainer: { fixtureOnly: true },
    replay: { fixtureOnly: true }, hub: { fixtureOnly: true } });
  f.hub = hub; f.raw = JSON.stringify(f.saved); f.snapshot = f.recapture();
  return f;
}

test('exact hub checks the full arena and declared state while superseding rounded legacy hub copies', () => {
  const f = exactHubHydration(), result = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
  assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(result.hub.ok, true);
  assert.equal(result.hub.arraysChecked, 59); assert.equal(result.hub.comparedBytes, 21368);
  assert.equal(result.hub.comparedStates, 44); assert.equal(result.hub.actualNativeViews, 58);
  assert.deepEqual(f.snapshot.hubEvidence.totals, { views: 58, backings: 46, uniqueBytes: 21368, stateFields: 44 });
  assert.equal(f.snapshot.hubCaptureError, null); assert.equal(f.snapshot.hubDiagnosticOmitted, true);
  assert.equal(Object.hasOwn(JSON.parse(f.snapshot.encodedJSON), 'hubMemoryState'), false);
  assert.equal(f.runtime.capturePersistentGenomePayload().hubMemoryState.__alive_genome_hub_state_v1__, true);
  assert.notEqual(f.saved.trainableHub.W_perc_enc.length, f.hub.W_perc_enc.length, 'old rounded legacy dimensions are deliberately superseded');
  assert.notEqual(f.saved.trainableHub.totalBackpropStepsTrained, f.hub.totalBackpropStepsTrained);
  assert.equal(assessGenomeHydration(f.raw, f.snapshot).ok, true, 'exact zero counters do not need a legacy initializer fallback');
  assert.ok(result.excluded.some(row => row.path === 'legacy trainableHub arrays and counters'));
  assert.equal(result.comparisons.some(row => row.path.startsWith('trainableHub.') || row.path.startsWith('trainableAlifeNeuralHub.')), false);
  assert.doesNotMatch(JSON.stringify(result), /"hex":|"data":/, 'assessment contains metadata only');
});

test('hub one-bit values, mixed lanes, reserved tail, scalar signs and name state cannot hide behind rounded exports', () => {
  for (const mutate of [
    hub => { new Uint8Array(hub.W_perc_enc.buffer)[0] ^= 1; },
    hub => { new Uint8Array(hub.f64AdamFirstMoment64.buffer, hub.f64AdamFirstMoment64.byteOffset)[2] ^= 1; },
    hub => { hub.u64SpikeTrainLanes8[7] = 0xfedcba9876543210n; },
    hub => { hub.fp16PersistentWeights256[3] = 0x3c00; },
    hub => { new Uint8Array(hub.mixedArenaBuffer)[8191] ^= 1; },
    hub => { hub.b_aware = 0; }, hub => { hub.totalBackpropStepsTrained++; },
    hub => { hub.facultyNames16[0] += '-changed'; }
  ]) {
    const f = exactHubHydration(); mutate(f.hub);
    const observed = f.recapture(), result = assessGenomeHydration(f.raw, observed, { initialState: f.initialState });
    assert.equal(result.ok, false, mutate.toString());
    if (result.hub) assert.equal(result.hub.ok, false);
  }
});

test('hub raw layout and alias failures are retained before any production exporter can repair them', () => {
  for (const change of [
    hub => { hub.f64TrajectoryPrev16 = new Float64Array(hub.f64TrajectoryPrev16); },
    hub => { hub.f64TrajectoryPrev16 = new Float64Array(hub.mixedArenaBuffer, 0, 16); },
    hub => { hub.b_perc_enc = hub.zPerc16; },
    hub => { hub.W_aware16 = new DataView(new ArrayBuffer(64)); },
    hub => { delete hub.W_dyn2; }, hub => { hub.adaptivePlasticityLr = NaN; },
    hub => { hub.totalBackpropStepsTrained = -1; }
  ]) {
    const f = exactHubHydration(), originals = Object.getOwnPropertyDescriptors(f.hub);
    change(f.hub);
    const calls = installReplayMutation(f, 'export', () => Object.defineProperties(f.hub, originals));
    const observed = f.recapture();
    assert.ok(calls() > 0); assert.equal(observed.hubEvidence.ok, false);
    assert.match(observed.errors.join(';'), /Initial hub capture failed/);
    assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, false);
    observed.errors = []; observed.encodedJSON = '{}';
    assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, false);
  }
});

test('first hub bytes and scalars survive trainer, metadata and exporter healing callbacks', () => {
  for (const phase of ['trainer-capture', 'trainer-snapshot', 'metadata', 'export']) {
    const f = exactHubHydration(), original = new Uint8Array(f.hub.W_perc_enc.buffer).slice();
    new Uint8Array(f.hub.W_perc_enc.buffer)[1] ^= 1; f.hub.b_aware = 0;
    const wrong = Buffer.from(f.hub.W_perc_enc.buffer).toString('hex');
    const calls = installReplayMutation(f, phase, () => { new Uint8Array(f.hub.W_perc_enc.buffer).set(original); f.hub.b_aware = -0; });
    const observed = f.recapture();
    assert.ok(calls() > 0); assert.equal(Object.is(f.hub.b_aware, -0), true);
    assert.equal(observed.hubEvidence.backings.find(row => row.id === 'W_perc_enc').hex, wrong);
    assert.equal(observed.hubEvidence.states.b_aware.hex, '0000000000000000');
    const result = assessGenomeHydration(f.raw, observed, { initialState: f.initialState });
    assert.equal(result.ok, false, phase); assert.equal(result.hub.ok, false);
  }
});

test('later callbacks cannot contaminate an initially correct exact hub observation', () => {
  for (const phase of ['trainer-capture', 'trainer-snapshot', 'metadata', 'export']) {
    const f = exactHubHydration(), original = f.snapshot.hubEvidence;
    const calls = installReplayMutation(f, phase, () => { f.hub.W_perc_enc.fill(9); f.hub.totalBackpropStepsTrained = 999; new Uint8Array(f.hub.mixedArenaBuffer)[8191] = 7; });
    const observed = f.recapture(); assert.ok(calls() > 0);
    assert.deepEqual(observed.hubEvidence, original);
    const result = assessGenomeHydration(f.raw, observed, { initialState: f.initialState });
    assert.equal(result.ok, true, JSON.stringify({ phase, result }));
  }
});

test('exact hub requires all prior components and binds every peer snapshot and outer identity', () => {
  for (const mutate of [
    saved => { delete saved.primaryPolicyState; }, saved => { delete saved.trainerCommittedState; }, saved => { delete saved.replayMemoryState; },
    ...['creatureId', 'policyId', 'checkpointId', 'logicalTick', 'modelEpoch', 'capturedAt', 'resumeBoundary'].map(key => saved => {
      const value = saved.hubMemoryState.snapshot[key]; saved.hubMemoryState.snapshot[key] = typeof value === 'number' ? value + 1 : 'different';
    }), saved => { saved.agentId = 'different-outer'; }, saved => { saved.simulationTick++; }
  ]) {
    const f = exactHubHydration(); mutate(f.saved);
    assert.equal(assessGenomeHydration(JSON.stringify(f.saved), f.snapshot, { initialState: f.initialState }).ok, false, mutate.toString());
  }
});

test('malformed hub pending wrappers, sealed wire and missing first observation fail closed', () => {
  const f = exactHubHydration(), exporter = f.runtime.capturePersistentGenomePayload.bind(f.runtime); let reads = 0;
  for (const wrapper of [null, {}, { __alive_genome_hub_state_v1__: false, captured: {} },
    { __alive_genome_hub_state_v1__: true, captured: null }, { __alive_genome_hub_state_v1__: true, captured: {}, extra: true },
    Object.defineProperty({ captured: {} }, '__alive_genome_hub_state_v1__', { enumerable: true, get() { reads++; return true; } }),
    { schema: 'gigachad.learned-state.v1', tensorBlob: {} }]) {
    f.runtime.capturePersistentGenomePayload = () => ({ ...exporter(), hubMemoryState: wrapper });
    const observed = f.recapture(); assert.ok(observed.errors.length);
    assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, false);
  }
  assert.equal(reads, 0); assert.equal(assessHubHydration(f.saved.hubMemoryState, null).ok, false);
  const invalid = structuredClone(f.saved.hubMemoryState); invalid.tensorBlob.sha256 = '0'.repeat(64);
  assert.equal(assessHubHydration(invalid, f.snapshot.hubEvidence).ok, false);
  assert.equal(assessGenomeHydration(f.raw, { ...f.snapshot, hubEvidence: null, hubCaptureError: null }, { initialState: f.initialState }).ok, false);
});

test('retained sealed hub diagnostics are independently checked against the first raw observation', () => {
  const f = exactHubHydration(), exporter = f.runtime.capturePersistentGenomePayload.bind(f.runtime);
  f.context.window.AliveGenomeCodec = { ...codec, encode: payload => JSON.stringify(payload) };
  f.runtime.capturePersistentGenomePayload = () => ({ ...exporter(), hubMemoryState: f.saved.hubMemoryState });
  let observed = f.recapture(); assert.equal(observed.hubDiagnosticOmitted, false);
  assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, true);
  const invalid = structuredClone(f.saved.hubMemoryState); invalid.tensorBlob.sha256 = '0'.repeat(64);
  f.runtime.capturePersistentGenomePayload = () => ({ ...exporter(), hubMemoryState: invalid });
  observed = f.recapture(); assert.deepEqual(observed.errors, []);
  const result = assessGenomeHydration(f.raw, observed, { initialState: f.initialState });
  assert.equal(result.ok, false); assert.ok(result.differences.some(row => row.path === 'hubMemoryState.exportDiagnostic'));
});

test('historical genomes without exact hub retain legacy array and counter checks', () => {
  for (const fixture of [hydrate, exactPrimaryHydration, exactTrainerHydration, exactReplayHydration]) {
    const f = fixture(), result = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
    assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(result.hub, null);
    assert.equal(f.snapshot.hubEvidence.ok, false); assert.deepEqual(f.snapshot.errors, []);
    f.runtime.trainableAlifeNeuralHub.W_perc_enc[0] += .01;
    const changed = f.recapture ? f.recapture() : JSON.parse(JSON.stringify(vm.runInContext(`(${captureGenomeHydration.toString()})(runtime)`, f.context)));
    assert.equal(assessGenomeHydration(f.raw, changed, { initialState: f.initialState }).ok, false);
  }
  assert.equal(captureHubHydration({}).ok, false);
});

// Build only an interchange fixture: actual constructor allocations plus an
// independently declared verification catalog. No production cortex adapter,
// learned-state codec, importer or model step supplies expected bytes.
function exactCortexHydration() {
  const f = exactHubHydration(), { createHash } = require('node:crypto');
  const catalog = require('./alive-cortex-state-evidence.cjs').createExpectedCortexCatalog();
  const start = index.indexOf('        const initXavier = (rows, cols) => {');
  const end = index.indexOf('        // Sovereign Browser Master Controller Telemetry', start);
  assert.ok(start >= 0 && end > start && end - start < 20000, 'bounded actual cortex/connectome allocation includes eager cold defaults');
  let seed = 23n;
  new Function('hybridQrng', index.slice(start, end)).call(f.runtime, { u64() { return seed++; } });
  const dc = f.runtime.deepCortex, cn = f.runtime.connectome512;
  dc.W_enc1[0] = Math.fround(.123456789); dc.criticValue = -0;
  dc.moeActiveExpertIndices = [0, 4]; dc.moeActiveGates = [.625, .375];
  const roots = { h: f.runtime, dc, cn };
  const readPath = declared => {
    assert.ok(Object.hasOwn(roots, declared.root), 'independent catalog uses a known fixture root');
    return declared.keys.reduce((object, key) => Object.getOwnPropertyDescriptor(object, key).value, roots[declared.root]);
  };
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  const chunks = [], tensorManifest = []; let blobOffset = 0;
  for (const row of catalog.tensors) {
    const view = readPath(row.paths[0]);
    const bytes = Buffer.from(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
    assert.equal(bytes.length, row.byteLength);
    tensorManifest.push({ ...row, blobOffset, sha256: sha(bytes) }); chunks.push(bytes); blobOffset += bytes.length;
  }
  const tagged = (value, schema) => {
    if (typeof value === 'number') {
      if (schema.type === 'i53') return { $type: 'i53', value };
      assert.equal(schema.type, 'f64');
      const bytes = Buffer.alloc(8); bytes.writeDoubleLE(value); return { $type: 'f64', hex: bytes.toString('hex') };
    }
    if (Array.isArray(value)) return { $type: 'array', items: value.map(item => tagged(item, schema.items)) };
    assert.equal(typeof value, 'string'); return value;
  };
  const stateValues = {};
  for (const row of catalog.states) {
    const declaration = catalog.descriptorDefinition.states.find(entry => entry.id === row.id);
    stateValues[row.id] = tagged(readPath(declaration.paths[0]), declaration.schema);
  }
  const bytes = Buffer.concat(chunks);
  f.saved.cortexMemoryState = { schema: 'gigachad.learned-state.v1', architecture: catalog.architecture,
    snapshot: { ...f.saved.primaryPolicyState.snapshot }, tensorManifest,
    tensorBlob: { encoding: 'base64', byteLength: bytes.length, sha256: sha(bytes), data: bytes.toString('base64') },
    stateManifest: catalog.states, stateValues, resumeRules: catalog.resumeRules };
  f.context.window.alivePrimaryPolicyBootstrap.captureComponents = () => ({ primary: { fixtureOnly: true }, trainer: { fixtureOnly: true },
    replay: { fixtureOnly: true }, hub: { fixtureOnly: true }, cortex: { fixtureOnly: true } });
  f.dc = dc; f.cn = cn; f.raw = JSON.stringify(f.saved); f.snapshot = f.recapture();
  return f;
}

test('cortex verifies first raw bytes, state and aliases while keeping exact peers and unrelated legacy checks', () => {
  const f = exactCortexHydration(), result = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
  assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(result.cortex.ok, true);
  assert.equal(result.cortex.arraysChecked, 47); assert.equal(result.cortex.actualNativeViews, 47);
  assert.equal(result.cortex.comparedBytes, 4994760); assert.equal(result.cortex.comparedStates, 43);
  assert.deepEqual(f.snapshot.cortexEvidence.totals, { views: 47, backings: 47, uniqueBytes: 4994760, stateFields: 43 });
  assert.equal(f.snapshot.cortexCaptureError, null); assert.equal(f.snapshot.cortexDiagnosticOmitted, true);
  assert.equal(Object.hasOwn(JSON.parse(f.snapshot.encodedJSON), 'cortexMemoryState'), false);
  assert.equal(f.runtime.capturePersistentGenomePayload().cortexMemoryState.__alive_genome_cortex_state_v1__, true);
  assert.notEqual(f.saved.W_actor.length, f.runtime.W_actor.length, 'rounded legacy primary copy is deliberately not authoritative');
  assert.equal(f.dc.W_actor, f.runtime.W_actor); assert.equal(f.dc.W_critic, f.runtime.W_critic);
  assert.ok(result.comparisons.some(row => row.path === 'deepWebAndSltcConnectomeEngine.sltcWeights64'));
  assert.doesNotMatch(JSON.stringify(result), /"(?:hex|data|dataBase64)":/, 'assessment contains metadata only');
});

test('cortex first raw bytes and signed-zero state cannot be healed by trainer, metadata or exporter callbacks', () => {
  const f = exactCortexHydration(), originals = Object.getOwnPropertyDescriptors(f.runtime);
  const originalTrainer = { capture: f.engine.captureCommittedTrainerState, snapshot: f.engine.workerTrainerSnapshot };
  const original = new Uint8Array(f.dc.W_enc1.buffer).slice();
  for (const phase of ['trainer-capture', 'trainer-snapshot', 'metadata', 'export']) {
    Object.defineProperties(f.runtime, originals);
    f.engine.captureCommittedTrainerState = originalTrainer.capture; f.engine.workerTrainerSnapshot = originalTrainer.snapshot;
    new Uint8Array(f.dc.W_enc1.buffer).set(original); new Uint8Array(f.dc.W_enc1.buffer)[0] ^= 1; f.dc.criticValue = 0;
    const first = captureCortexHydration(f.runtime); assert.equal(first.ok, true);
    const calls = installReplayMutation(f, phase, () => { new Uint8Array(f.dc.W_enc1.buffer).set(original); f.dc.criticValue = -0; });
    const observed = f.recapture(); assert.ok(calls() > 0);
    assert.deepEqual(observed.cortexEvidence, first, phase + ' cannot rewrite owned first evidence');
    assert.equal(Object.is(f.dc.criticValue, -0), true);
    const result = assessGenomeHydration(f.raw, observed, { initialState: f.initialState });
    assert.equal(result.ok, false); assert.equal(result.cortex.ok, false);
  }
});

test('later callbacks cannot contaminate an initially correct owned cortex observation', () => {
  const f = exactCortexHydration(), originalEvidence = f.snapshot.cortexEvidence;
  const originals = Object.getOwnPropertyDescriptors(f.runtime), originalWeights = new Uint8Array(f.dc.W_enc1.buffer).slice();
  const originalTrainer = { capture: f.engine.captureCommittedTrainerState, snapshot: f.engine.workerTrainerSnapshot };
  for (const phase of ['trainer-capture', 'trainer-snapshot', 'metadata', 'export']) {
    Object.defineProperties(f.runtime, originals);
    f.engine.captureCommittedTrainerState = originalTrainer.capture; f.engine.workerTrainerSnapshot = originalTrainer.snapshot;
    new Uint8Array(f.dc.W_enc1.buffer).set(originalWeights); f.dc.criticValue = -0;
    const calls = installReplayMutation(f, phase, () => { f.dc.W_enc1[0] = .875; f.dc.criticValue = .25; });
    const observed = f.recapture(); assert.ok(calls() > 0);
    assert.deepEqual(observed.cortexEvidence, originalEvidence);
    assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, true, phase);
  }
});

test('cortex invalid first layout, alias or numeric observations remain failures after exporter repairs', () => {
  const f = exactCortexHydration(), dcSlots = Object.getOwnPropertyDescriptors(f.dc), cnSlots = Object.getOwnPropertyDescriptors(f.cn);
  const exportOriginal = f.runtime.capturePersistentGenomePayload;
  const attentionBytes = new Uint8Array(f.dc.attnWeights8.buffer).slice();
  const repair = () => { Object.defineProperties(f.dc, dcSlots); Object.defineProperties(f.cn, cnSlots);
    new Uint8Array(f.dc.attnWeights8.buffer).set(attentionBytes); };
  for (const change of [
    () => { f.dc.W_actor = new Float32Array(f.runtime.W_actor); },
    () => { f.dc.W_critic = new Float32Array(f.runtime.W_critic); },
    () => { f.cn.synWeights262K = new Float32Array(f.dc.W_connectome_synapses); },
    () => { f.cn.synapticWeights = new Float32Array(f.dc.W_connectome_synapses); },
    () => { f.cn.eligibilityTraces = f.cn.synWeights262K; },
    () => { f.dc.W_attn_out = new Float32Array(8192); },
    () => { f.dc.attnWeights8[7] = NaN; },
    () => { f.dc.attentionOutputPhase = 512; },
    () => { f.dc.criticValue = NaN; },
    () => { f.dc.moeActiveGates = [NaN, .5]; },
    () => { f.dc.moeActiveExpertIndices = [-0, 4]; },
    () => { f.cn.stdpUpdatesCount = -1; }
  ]) {
    repair(); f.runtime.capturePersistentGenomePayload = exportOriginal; change();
    const calls = installReplayMutation(f, 'export', repair);
    const observed = f.recapture(); assert.ok(calls() > 0);
    assert.equal(observed.cortexEvidence.ok, false); assert.ok(observed.cortexCaptureError);
    assert.match(observed.errors.join(';'), /Initial (?:primary|cortex) capture failed/);
    assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, false);
    observed.errors = []; observed.encodedJSON = '{}';
    assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, false, 'export diagnostic failure is not the only rejection');
  }
});

test('cortex requires all four exact peers, all seven shared snapshot fields and outer identity', () => {
  const f = exactCortexHydration();
  for (const field of ['primaryPolicyState', 'trainerCommittedState', 'replayMemoryState', 'hubMemoryState']) {
    const saved = { ...f.saved }; delete saved[field];
    const result = assessGenomeHydration(JSON.stringify(saved), f.snapshot, { initialState: f.initialState });
    assert.equal(result.ok, false); assert.ok(result.differences.some(row => row.kind === 'cortex-requires-' + field));
    const changed = { ...f.saved, [field]: { ...f.saved[field], snapshot: { ...f.saved[field].snapshot,
      modelEpoch: f.saved[field].snapshot.modelEpoch + 1 } } };
    const disagreement = assessGenomeHydration(JSON.stringify(changed), f.snapshot, { initialState: f.initialState });
    assert.equal(disagreement.ok, false);
    assert.ok(disagreement.comparisons.some(row => row.path === 'cortex-paired-' + field + '-snapshot' && row.ok === false));
  }
  for (const key of ['creatureId', 'policyId', 'checkpointId', 'logicalTick', 'modelEpoch', 'capturedAt', 'resumeBoundary']) {
    const value = f.saved.cortexMemoryState.snapshot[key];
    const saved = { ...f.saved, cortexMemoryState: { ...f.saved.cortexMemoryState,
      snapshot: { ...f.saved.cortexMemoryState.snapshot, [key]: typeof value === 'number' ? value + 1 : 'different' } } };
    assert.equal(assessGenomeHydration(JSON.stringify(saved), f.snapshot, { initialState: f.initialState }).ok, false, key);
  }
  for (const change of [{ agentId: 'different-outer' }, { simulationTick: f.saved.simulationTick + 1 },
    { policyCid: 'different-policy' }, { checkpointCid: 'different-checkpoint' }]) {
    assert.equal(assessGenomeHydration(JSON.stringify({ ...f.saved, ...change }), f.snapshot, { initialState: f.initialState }).ok, false);
  }
});

test('malformed cortex wrappers and missing first evidence never fall back to rounded legacy state', () => {
  const f = exactCortexHydration(), exporter = f.runtime.capturePersistentGenomePayload.bind(f.runtime); let reads = 0;
  for (const wrapper of [null, {}, { __alive_genome_cortex_state_v1__: false, captured: {} },
    { __alive_genome_cortex_state_v1__: true, captured: null }, { __alive_genome_cortex_state_v1__: true, captured: {}, extra: true },
    Object.defineProperty({ captured: {} }, '__alive_genome_cortex_state_v1__', { enumerable: true, get() { reads++; return true; } })]) {
    f.runtime.capturePersistentGenomePayload = () => ({ ...exporter(), cortexMemoryState: wrapper });
    const observed = f.recapture(); assert.ok(observed.errors.length);
    assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, false);
  }
  assert.equal(reads, 0); assert.equal(assessCortexHydration(f.saved.cortexMemoryState, null).ok, false);
  assert.equal(assessGenomeHydration(f.raw, { ...f.snapshot, cortexEvidence: null, cortexCaptureError: null }, { initialState: f.initialState }).ok, false);
});

test('sealed cortex diagnostic must independently match the first raw observation', () => {
  const f = exactCortexHydration(), exporter = f.runtime.capturePersistentGenomePayload.bind(f.runtime);
  f.context.window.AliveGenomeCodec = { ...codec, encode: payload => JSON.stringify(payload) };
  f.runtime.capturePersistentGenomePayload = () => ({ ...exporter(), cortexMemoryState: f.saved.cortexMemoryState });
  let observed = f.recapture(); assert.equal(observed.cortexDiagnosticOmitted, false);
  assert.equal(assessGenomeHydration(f.raw, observed, { initialState: f.initialState }).ok, true);
  const invalid = { ...f.saved.cortexMemoryState, tensorBlob: { ...f.saved.cortexMemoryState.tensorBlob, sha256: '0'.repeat(64) } };
  f.runtime.capturePersistentGenomePayload = () => ({ ...exporter(), cortexMemoryState: invalid });
  observed = f.recapture(); assert.deepEqual(observed.errors, []);
  const result = assessGenomeHydration(f.raw, observed, { initialState: f.initialState });
  assert.equal(result.ok, false); assert.ok(result.differences.some(row => row.path === 'cortexMemoryState.exportDiagnostic'));
});

test('historical checkpoints without cortex remain compatible and retain unrelated legacy byte checks', () => {
  for (const fixture of [hydrate, exactPrimaryHydration, exactTrainerHydration, exactReplayHydration, exactHubHydration]) {
    const f = fixture(), result = assessGenomeHydration(f.raw, f.snapshot, { initialState: f.initialState });
    assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(result.cortex, null);
    assert.equal(f.snapshot.cortexEvidence.ok, false); assert.deepEqual(f.snapshot.errors, []);
    f.runtime.deepWebAndSltcConnectomeEngine.sltcWeights64[0] += .01;
    const changed = f.recapture ? f.recapture() : JSON.parse(JSON.stringify(vm.runInContext(`(${captureGenomeHydration.toString()})(runtime)`, f.context)));
    assert.equal(assessGenomeHydration(f.raw, changed, { initialState: f.initialState }).ok, false);
  }
  assert.equal(captureCortexHydration({}).ok, false);
  const verificationSource = fs.readFileSync(require.resolve('./alive-genome-hydration-evidence.cjs'), 'utf8');
  assert.doesNotMatch(verificationSource, /require\([^\n]*(?:alive-cortex-state\.js|alive-learned-state-codec|alive-learned-state-registry)/);
  assert.doesNotMatch(captureGenomeHydration.toString(), /AliveCortexState|alivePrimaryPolicyBootstrap/);
});
