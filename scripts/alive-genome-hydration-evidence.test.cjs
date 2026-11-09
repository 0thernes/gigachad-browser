'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const codec = require('../systems/alive-genome-codec.js');
const { captureGenomeHydration, captureGenomeInitialState, assessGenomeHydration } = require('./alive-genome-hydration-evidence.cjs');
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
  const context = vm.createContext({ runtime, window: { AliveGenomeCodec: codec }, btoa, ArrayBuffer, DataView, Uint8Array, Uint16Array,
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
  f.context.window.alivePrimaryPolicyBootstrap = { capture() { return { fixtureOnly: true }; } };
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
