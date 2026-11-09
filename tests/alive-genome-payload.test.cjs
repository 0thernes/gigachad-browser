'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const codec = require('../systems/alive-genome-codec.js');

// This fixture is the unmodified synchronous writer captured before the codec
// refactor. Run it, rather than reconstructing an expected payload from the new
// implementation, so added/dropped fields and changed rounding are observable.
const legacySource = fs.readFileSync(path.join(__dirname, 'fixtures/legacy-save-persistent-genome.js.txt'), 'utf8');
const indexSource = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const KEY = 'humunculus_persistent_genome_v1';
const NOW = '2026-11-08T12:34:56.789Z';
const TOP_LEVEL_KEYS = [
  'authorityEpoch', 'simulationTick', 'policyCid', 'checkpointCid', 'bodyRecipe',
  'W_actor', 'W_metamorph', 'W_critic', 'W_world', 'offspringColony', 'episodicMemory',
  'semanticMemory', 'proceduralMemory', 'handoffLedger', 'dreamReplaysCount',
  'pelletsEatenCount', 'horizontalTransfersCount', 'personality', 'emotionState',
  'morphogenesis', 'cognitiveCortex', 'visitedUrls', 'clickedAnchors', 'swarmFormation',
  'sovereignStats', 'causalPropositions', 'trainableHub', 'sltcLearned',
  'aotTotGotLearned', 'portedPantheonLearned', 'authenticAsmodensius', 'savedAt'
];
const HUB_WEIGHTS = ['W_perc_enc', 'W_perc_dec', 'W_dyn1', 'W_dyn2', 'W_diff1', 'W_diff2',
  'W_gen1', 'W_gen2', 'W_disc1', 'W_disc2', 'W_aware16'];
const SLTC_WEIGHTS = ['sltcWeights64', 'sltcRecWeights64', 'sltcBias64'];
const AOT_WEIGHTS = ['W_aot_contractor', 'W_tot_branch4x16x16', 'W_got_attn'];
const edgeValues = [0, -0, 0.0000049, -0.0000049, 0.0000051, -0.0000051,
  1.234449, 1.234451, -1.234449, -1.234451, 1.005, 12.345675, NaN, Infinity, -Infinity];
const numbers = (Type = Float32Array, offset = 0) => Type.from(edgeValues.map(value => value + offset));
function runtime() {
  const hub = Object.fromEntries(HUB_WEIGHTS.map((key, i) => [key, numbers(i % 2 ? Float64Array : Float32Array, i / 100)]));
  Object.assign(hub, { totalBackpropStepsTrained: 321, ideasSynthesizedCount: 43, dreamConsolidationSteps: 12 });
  return {
    authorityEpoch: 7, simulationTick: 654, policyCid: 'policy-fixture', checkpointCid: 'legacy-snapshot-fixture',
    bodyRecipe: { bodyCid: 'body-fixture', limbCount: 12, appearance: { label: 'Entity \u03a9', colors: ['#fff', '#0fa'] }, segments: new Uint16Array([2, 4, 8]) },
    W_actor: numbers(), W_metamorph: numbers(Float64Array), W_critic: numbers(), W_world: numbers(Float64Array, 0.01),
    offspringColony: Array.from({ length: 7 }, (_, i) => ({ id: `child-${i}`, morphology: { limbs: i + 3 } })),
    episodicMemory: Array.from({ length: 45 }, (_, i) => ({ eventId: `event-${i}`, outcome: { reward: i / 7, tags: ['observed', '\u03a9'] } })),
    semanticMemory: { domainFacts: { 'example.test': { visits: 3, supportingEvents: ['ev1', 'ev2'] } }, partnerModel: { cursorTrustScore: 0.43 } },
    proceduralMemory: { A: { skillName: 'calibrate_stop', nested: { trials: [1, 2], missing: undefined } } },
    handoffLedger: Array.from({ length: 23 }, (_, i) => ({ transferId: `handoff-${i}`, epoch: i })),
    dreamReplaysCount: 3, pelletsEatenCount: 17, horizontalTransfersCount: 2,
    personality: { novelty: 0.456789123, flags: [true, false] }, emotionState: { activeEmotion: 'CURIOUS', intensityPct: 61 },
    morphogenesis: { totalExperienceXp: 912, history: [{ archetype: 'ELDRITCH' }] },
    cognitiveCortex: { realizationLedger: [{ fact: 'sample', vector: new Float32Array([0.1234567, -0.2]) }], optional: undefined },
    visitedUrlTabooSet: new Set(Array.from({ length: 181 }, (_, i) => `https://example.test/page/${i}`)),
    clickedAnchorTabooSet: new Set(Array.from({ length: 173 }, (_, i) => `anchor-${i}`)),
    swarmCollective: { formationMode: 'ORBIT' },
    sovereignMaster: { commandsExecutedCount: 21, vaultEngramsCrystallized: 13, bookmarksAutonomouslyPinned: 8,
      maxsmartDossiersSynthesized: 5, vibeCssMutationsCount: 3, emergentQueriesInjected: 2, unpersisted: 'do not add' },
    causalGraph: { propositions: Array.from({ length: 57 }, (_, i) => ({ subject: `node-${i}`, relation: 'observes', object: { value: i } })) },
    trainableAlifeNeuralHub: hub,
    deepWebAndSltcConnectomeEngine: Object.fromEntries(SLTC_WEIGHTS.map((key, i) => [key, numbers(Float32Array, i / 100)])),
    aotTotGotEngine: Object.fromEntries(AOT_WEIGHTS.map((key, i) => [key, numbers(Float64Array, i / 100)])),
    portedMultiverseBrains: { exportLearnedState: () => ({ version: 3, brains: [{ weights: [0.123456789], state: new Int8Array([-2, 0, 3]) }], optional: null }) },
    authenticAsmodensius: { lastError: '', exportState: () => ({ schema: 'fixture-v1', epoch: 2, weights: new Float32Array([0.25, -0.125]), memory: { raw: 0.123456789 } }) }
  };
}
function currentMethod(name) {
  const found = indexSource.match(new RegExp(`^      ${name}\\(\\) \\{[\\s\\S]*?^      \\}`, 'm'));
  assert(found, `actual index.html method ${name} must exist`);
  return found[0];
}
function harness(h, { legacy = false, failStorage = false } = {}) {
  const stored = new Map([[KEY, 'previous-checkpoint']]), warnings = [];
  class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [NOW])); } static now() { return Date.parse(NOW); } }
  const context = vm.createContext({
    Date: FixedDate, AliveGenomeCodec: codec, window: { AliveGenomeCodec: codec },
    localStorage: { setItem(key, value) { if (failStorage) throw new Error('Quota exceeded'); stored.set(key, value); } },
    console: { warn(...args) { warnings.push(args); } }
  });
  const compile = (source, name) => vm.runInContext(`({${source}}).${name}`, context);
  if (!legacy) h.capturePersistentGenomePayload = compile(currentMethod('capturePersistentGenomePayload'), 'capturePersistentGenomePayload');
  h.savePersistentGenome = compile(legacy ? legacySource : currentMethod('savePersistentGenome'), 'savePersistentGenome');
  return { h, stored, warnings, context, save() { h.savePersistentGenome(); return stored.get(KEY); } };
}
function comparePair(prepare = () => {}) {
  const oldState = runtime(), newState = runtime(); prepare(oldState); prepare(newState);
  const old = harness(oldState, { legacy: true }), current = harness(newState);
  const expected = old.save(), captured = codec.encode(newState.capturePersistentGenomePayload()), actual = current.save();
  assert.equal(old.warnings.length, 0, 'legacy fixture must serialize the representative state');
  assert.equal(current.warnings.length, 0);
  assert.equal(captured, expected, 'capture plus codec preserves the exact legacy JSON');
  assert.equal(actual, expected, 'the actual synchronous save method preserves the exact legacy JSON');
  return { old, current, parsed: JSON.parse(actual) };
}

test('actual capture and synchronous fallback preserve every legacy top-level field and nested payload', () => {
  const { parsed, current } = comparePair();
  assert.deepEqual(Object.keys(parsed), TOP_LEVEL_KEYS);
  assert.equal(parsed.savedAt, NOW);
  assert.deepEqual(parsed.bodyRecipe.segments, { 0: 2, 1: 4, 2: 8 }, 'unrounded nested typed arrays keep their legacy JSON object representation');
  assert.deepEqual(parsed.portedPantheonLearned.brains[0].state, { 0: -2, 1: 0, 2: 3 });
  assert.equal(parsed.authenticAsmodensius.memory.raw, 0.123456789, 'exported backend state is not blanket-rounded');
  assert.deepEqual(parsed.semanticMemory.domainFacts['example.test'].supportingEvents, ['ev1', 'ev2']);
  assert(!Object.hasOwn(parsed.sovereignStats, 'unpersisted'));
  assert(current.h.W_actor instanceof Float32Array, 'serialization does not replace runtime tensors');
  assert(Number.isNaN(current.h.W_actor[12]), 'serialization leaves nonfinite runtime values untouched');
});

test('recovery provenance survives actual autosave capture without entering legacy saves', () => {
  const h = runtime();
  h.nativeStateRecovery = { schema: 'gigachad.native-state-recovery.v1', sourceRevision: 128,
    provenance: { exactHistoricalContinuation: false, developmentalAffinity: 'reinitialized-from-current-seeded-constructor' } };
  const current = harness(h);
  const captured = JSON.parse(codec.encode(h.capturePersistentGenomePayload()));
  assert.deepEqual(captured.nativeStateRecovery, h.nativeStateRecovery);
  assert.deepEqual(JSON.parse(current.save()).nativeStateRecovery, h.nativeStateRecovery);
});

test('existing 5-decimal policy and 4-decimal engine rounding is unchanged, including nonfinite JSON values', () => {
  const { current, parsed } = comparePair();
  const rounded = (values, digits) => JSON.parse(JSON.stringify(Array.from(values, value => Number(value.toFixed(digits)))));
  for (const key of ['W_actor', 'W_metamorph', 'W_critic', 'W_world']) assert.deepEqual(parsed[key], rounded(current.h[key], 5), key);
  for (const [name, keys, source] of [
    ['trainableHub', HUB_WEIGHTS, current.h.trainableAlifeNeuralHub],
    ['sltcLearned', SLTC_WEIGHTS, current.h.deepWebAndSltcConnectomeEngine],
    ['aotTotGotLearned', AOT_WEIGHTS, current.h.aotTotGotEngine]
  ]) for (const key of keys) assert.deepEqual(parsed[name][key], rounded(source[key], 4), `${name}.${key}`);
  assert.deepEqual(parsed.W_actor.slice(-3), [null, null, null]);
  assert.equal(parsed.W_actor[2], 0);
  assert.equal(parsed.W_actor[4], 0.00001);
});

test('actual genome capture defers authentic formatting and preserves the legacy complete envelope', () => {
  const { AuthenticAsmodensiusAdapter } = require('../systems/authentic-asmodensius-adapter.js');
  const { current, parsed } = comparePair(h => {
    h.authenticAsmodensius = new AuthenticAsmodensiusAdapter({ seed: 23 });
    for (let i = 0; i < 12; i++) h.authenticAsmodensius.step(Float64Array.from({ length: 16 }, (_, j) => (j + i) % 10 / 10));
  });
  const adapter = current.h.authenticAsmodensius;
  adapter.exportState = () => { throw new Error('capture must defer authentic formatting'); };
  const raw = current.h.capturePersistentGenomePayload().authenticAsmodensius;
  assert.equal(typeof raw.payload, 'object');
  const decoded = JSON.parse(codec.encode({ authenticAsmodensius: raw })).authenticAsmodensius;
  assert.deepEqual(decoded, parsed.authenticAsmodensius);
  const restored = new AuthenticAsmodensiusAdapter({ seed: 99 });
  assert.equal(restored.importState(decoded), true, restored.lastError);
});

test('legacy memory retention windows and insertion order remain unchanged', () => {
  const { parsed } = comparePair();
  assert.deepEqual(parsed.offspringColony.map(item => item.id), ['child-0', 'child-1', 'child-2', 'child-3']);
  assert.equal(parsed.episodicMemory.length, 30); assert.equal(parsed.episodicMemory[0].eventId, 'event-15');
  assert.equal(parsed.handoffLedger.length, 16); assert.equal(parsed.handoffLedger[0].transferId, 'handoff-7');
  assert.equal(parsed.visitedUrls.length, 160); assert.equal(parsed.visitedUrls[0], 'https://example.test/page/21');
  assert.equal(parsed.clickedAnchors.length, 160); assert.equal(parsed.clickedAnchors[0], 'anchor-13');
  assert.equal(parsed.causalPropositions.length, 48); assert.equal(parsed.causalPropositions[0].subject, 'node-9');
});

test('absent optional engines retain explicit null fields', () => {
  const { parsed } = comparePair(h => {
    h.trainableAlifeNeuralHub = null; h.deepWebAndSltcConnectomeEngine = undefined;
    h.aotTotGotEngine = null; h.portedMultiverseBrains = undefined; h.authenticAsmodensius = null;
  });
  for (const key of ['trainableHub', 'sltcLearned', 'aotTotGotLearned', 'portedPantheonLearned', 'authenticAsmodensius']) assert.equal(parsed[key], null, key);
  assert.deepEqual(Object.keys(parsed), TOP_LEVEL_KEYS);
});

test('partially initialized optional engines and empty typed arrays remain compatible', () => {
  const { parsed } = comparePair(h => {
    h.aotTotGotEngine = {}; h.portedMultiverseBrains = {};
    h.W_actor = new Float32Array(0); h.W_world = new Float64Array(0);
    h.trainableAlifeNeuralHub.W_perc_enc = new Float32Array(0);
    h.deepWebAndSltcConnectomeEngine.sltcBias64 = new Float32Array(0);
  });
  assert.equal(parsed.aotTotGotLearned, null); assert.equal(parsed.portedPantheonLearned, null);
  assert.deepEqual(parsed.W_actor, []); assert.deepEqual(parsed.W_world, []);
  assert.deepEqual(parsed.trainableHub.W_perc_enc, []); assert.deepEqual(parsed.sltcLearned.sltcBias64, []);
});

for (const [name, prepare, errorText, failStorage] of [
  ['storage quota failure', () => {}, 'Quota exceeded', true],
  ['backend export failure', h => { h.authenticAsmodensius.exportState = () => { throw new Error('Export failed'); }; }, 'Export failed', false],
  ['cyclic nested memory', h => { h.semanticMemory.loop = h.semanticMemory; }, 'circular', false],
  ['unsupported nested BigInt', h => { h.semanticMemory.exact = 1n; }, 'BigInt', false]
]) test(`${name} preserves the prior checkpoint and reports failure`, () => {
  for (const legacy of [true, false]) {
    const h = runtime(); prepare(h);
    const check = harness(h, { legacy, failStorage });
    assert.doesNotThrow(() => check.save());
    assert.equal(check.stored.get(KEY), 'previous-checkpoint');
    assert.equal(check.warnings.length, 1);
    assert.match(String(check.warnings[0][1]), new RegExp(errorText, 'i'));
    assert.match(h.authenticAsmodensius.lastError, /^Checkpoint save failed: /);
    assert.match(h.authenticAsmodensius.lastError, new RegExp(errorText, 'i'));
  }
});

test('actual payload capture owns primary, committed trainer and replay state with one snapshot identity', async () => {
  const { webcrypto } = require('node:crypto');
  const learned = require('../systems/alive-learned-state-codec.js');
  const registry = require('../systems/alive-learned-state-registry.js');
  const primary = require('../systems/alive-primary-policy-state.js');
  const trainer = require('../systems/alive-trainer-state.js');
  const replay = require('../systems/alive-replay-state.js');
  const bootstrap = require('../systems/alive-primary-policy-bootstrap.js');
  const { BleedEdge25AlifeEngine: Engine } = require('../systems/alife-25-bleeding-edge-models.js');
  const h = runtime();
  Object.assign(h, { D_OBS: 16, D_ACT: 5, D_MORPH: 6, agentId: 'payload-creature' });
  for (const [key, size] of [['W_actor',80], ['W_metamorph',30], ['W_critic',16], ['W_world',256], ['W_actor_frozen',80], ['W_world_frozen',256]]) {
    h[key] = Float32Array.from({ length: size }, (_, i) => (i - 7) / 256);
  }
  h.W_actor[0] = -0;
  h.deepCortex = { W_actor: h.W_actor, W_critic: h.W_critic };
  const engine = h.bleedingEdge25Engine = Object.create(Engine.prototype);
  engine.W_hyper_u = Float32Array.from({ length: 16 }, (_, i) => (i - 5) / 32);
  new Uint32Array(engine.W_hyper_u.buffer).set([0x80000000, 1]);
  engine.workerTrainerStatus = {};
  engine.suspendWorkerTrainer('payload-fixture');
  const committed = engine.captureCommittedTrainerState();
  committed.committedEpoch = 37; committed.timeoutMs = 1500;
  engine.commitCommittedTrainerRestore(engine.prepareCommittedTrainerRestore(committed, { expectedGeneration: engine.workerTrainerSnapshot().generation }));
  const originalBytes = Buffer.from(engine.W_hyper_u.buffer).toString('hex');
  const originalTrainer = engine.workerTrainerSnapshot();
  Object.assign(h.trainableAlifeNeuralHub, { replayRing32: [{ z16: new Float32Array(16).fill(.125),
    a8: new Float32Array(8).fill(.25), zNext16: new Float32Array(16).fill(.375), surprise: -0 }], replayWritePtr: 1 });
  new Uint32Array(h.trainableAlifeNeuralHub.replayRing32[0].z16.buffer).set([0x80000000, 1]);
  const replayBytes = Buffer.from(h.trainableAlifeNeuralHub.replayRing32[0].z16.buffer).toString('hex');
  const controller = await bootstrap.prepare({ primary, trainer, replay, registry, codec: learned, crypto: webcrypto, json: null });
  const f = harness(h);
  f.context.window.alivePrimaryPolicyBootstrap = controller;
  const payload = h.capturePersistentGenomePayload();
  assert.equal(codec.hasAsyncState(payload), true);
  assert.deepEqual(engine.workerTrainerSnapshot(), originalTrainer, 'ordinary capture must not suspend, dispatch or discard trainer work');
  // The exact component captures already own bytes before any encoder is called.
  h.W_actor.fill(3); engine.W_hyper_u.fill(4);
  h.trainableAlifeNeuralHub.replayRing32[0].z16.fill(5);
  h.trainableAlifeNeuralHub.replayRing32 = []; h.trainableAlifeNeuralHub.replayWritePtr = 0;
  // Match autosave's structured-clone boundary from the VM-owned payload.
  const json = await codec.encodeAsync(structuredClone(payload), { learnedCodec: learned, crypto: webcrypto });
  const parsed = JSON.parse(json);
  const p = learned.verifiedCopy(await learned.decode(JSON.stringify(parsed.primaryPolicyState), { crypto: webcrypto }));
  const t = learned.verifiedCopy(await learned.decode(JSON.stringify(parsed.trainerCommittedState), { crypto: webcrypto }));
  const replayDecoded = await learned.decode(JSON.stringify(parsed.replayMemoryState), { crypto: webcrypto });
  const r = learned.verifiedCopy(replayDecoded);
  assert.deepEqual(p.snapshot, t.snapshot);
  assert.deepEqual(p.snapshot, r.snapshot);
  assert.equal(Buffer.from(r.tensors.find(row => row.id === 'replay/0/z16').bytes).toString('hex'), replayBytes);
  assert.equal(Object.is(learned.untagValue(r.stateValues['replay/0/surprise']), -0), true);
  const replayAdapter = await replay.create({ registry, codec: learned, crypto: webcrypto });
  assert.equal(replayAdapter.validate(replayDecoded).count, 1);
  assert.equal(replayAdapter.validate(replayDecoded).cursor, 1);
  assert.equal(p.snapshot.logicalTick, 654);
  assert.equal(t.snapshot.creatureId, 'payload-creature');
  assert.equal(Buffer.from(t.tensors[0].bytes).toString('hex'), originalBytes);
  const adapter = await trainer.create({ registry, codec: learned, crypto: webcrypto });
  const receipt = adapter.validate(await learned.decode(JSON.stringify(parsed.trainerCommittedState), { crypto: webcrypto }));
  assert.equal(receipt.committedEpoch, 37); assert.equal(receipt.timeoutMs, 1500);
  assert.equal(new Uint32Array(p.tensors.find(row => row.id === 'W_actor').bytes)[0], 0x80000000);
});
