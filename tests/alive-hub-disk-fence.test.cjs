'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Load the complete production engine; IPC settlement is the only controlled boundary.
function fixture() {
  const scope = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'alife_neural_cyber_engine.js'), 'utf8'),
    { window: scope, btoa: text => Buffer.from(text, 'binary').toString('base64'), console });
  const engine = new scope.GigachadAlifeNeuralCyberEngine();
  const hub = { persistentWeightCheckpointsSaved: 3, totalBackpropStepsTrained: 17 };
  for (const key of ['W_perc_enc', 'W_dyn1', 'W_diff1', 'W_gen1', 'W_disc1', 'W_icm_inv']) hub[key] = new Float32Array(256);
  const dc = Object.fromEntries(['W_enc1', 'W_rssm_rec', 'W_actor', 'W_critic', 'W_body_genome'].map(key => [key, new Float32Array(512)]));
  const runtime = { deepCortex: dc, trainableAlifeNeuralHub: hub, frontierNeuralCyberEngine: engine,
    authorityEpoch: 4, simulationTick: 17, persistentGenomeRestore: { generation: 2 } };
  let settle, calls = 0;
  const bridge = { invoke(channel, payload) {
    calls++; assert.equal(channel, 'alife-neural-weights-sync'); assert.equal(payload.action, 'save');
    assert.equal(Buffer.from(payload.weightsBase64, 'base64').length, 18432);
    return new Promise(resolve => { settle = resolve; });
  } };
  const snapshot = () => JSON.stringify({ status: engine.diskCheckpointStatus, hat: engine.cyberHatMaster, counter: hub.persistentWeightCheckpointsSaved });
  return { scope, engine, hub, runtime, snapshot, get calls() { return calls; },
    start: () => engine.syncWeightsToDisk(runtime, bridge),
    resolve: value => settle(value ?? { ok: true, savedAt: 'fixed-date', byteLength: 18432, sha256Prefix: 'saved-hash' }) };
}

test('disk save publishes once after ordinary training progress', async () => {
  const f = fixture(), before = f.engine.diskCheckpointStatus.saveCount, pending = f.start();
  f.runtime.simulationTick++; f.hub.totalBackpropStepsTrained++; f.hub.W_perc_enc[0] = 0.75;
  f.resolve(); assert.equal((await pending).ok, true);
  assert.equal(f.hub.persistentWeightCheckpointsSaved, 4);
  assert.equal(f.engine.diskCheckpointStatus.saveCount, before + 1);
  assert.equal(f.engine.cyberHatMaster.goldHatMerkleRoot, 'saved-hash');
  assert.equal(f.hub.W_perc_enc[0], 0.75);
});

for (const [label, change] of Object.entries({
  shutdown: f => { f.scope.__alivePersistenceClosing = true; },
  restoreInProgress: f => { f.scope.__aliveCheckpointRestore = true; },
  restoreGeneration: f => { f.runtime.persistentGenomeRestore.generation++; },
  completedInPlaceCheckpoint: f => { f.runtime.authorityEpoch++; },
  hubReplaced: f => { f.runtime.trainableAlifeNeuralHub = { ...f.hub }; },
  cortexReplaced: f => { f.runtime.deepCortex = { ...f.runtime.deepCortex }; },
  engineReplaced: f => { f.runtime.frontierNeuralCyberEngine = {}; },
  controllerReplaced: f => { f.scope.aliveOverdrive = {}; },
  reasoningEngineReplaced: f => { f.engine.aotTotGotEngine = {}; },
  statusReplaced: f => { f.engine.diskCheckpointStatus = { ...f.engine.diskCheckpointStatus }; },
  hatReplaced: f => { f.engine.cyberHatMaster = { ...f.engine.cyberHatMaster }; }
})) test(`disk completion cannot publish after ${label}`, async () => {
  const f = fixture(), pending = f.start(); assert.equal(f.calls, 1); change(f);
  const before = f.snapshot(); f.resolve(); assert.equal(await pending, null); assert.equal(f.snapshot(), before);
});

for (const flag of ['__alivePersistenceClosing', '__aliveCheckpointRestore']) test(`disk request is not admitted during ${flag}`, async () => {
  const f = fixture(); f.scope[flag] = true; const before = f.snapshot();
  assert.equal(await f.start(), null); assert.equal(f.calls, 0); assert.equal(f.snapshot(), before);
});

test('failed disk receipt leaves all local checkpoint fields untouched', async () => {
  const f = fixture(), before = f.snapshot(), pending = f.start(); f.resolve({ ok: false });
  assert.equal((await pending).ok, false); assert.equal(f.snapshot(), before);
});

for (const counter of ['hub', 'engine']) for (const value of [-1, NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER])
  test(`unsafe ${counter} counter ${value} cannot partially publish disk completion`, async () => {
    const f = fixture(), pending = f.start();
    if (counter === 'hub') f.hub.persistentWeightCheckpointsSaved = value;
    else f.engine.diskCheckpointStatus.saveCount = value;
    const before = f.snapshot(); f.resolve(); assert.equal(await pending, null); assert.equal(f.snapshot(), before);
  });
