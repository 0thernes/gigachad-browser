'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { createHash } = require('node:crypto');
const { create } = require('../systems/alive-genome-persistence.js');
const { AuthenticAsmodensiusAdapter } = require('../systems/authentic-asmodensius-adapter.js');
const index = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const engineSource = fs.readFileSync(path.join(__dirname, '../alife_neural_cyber_engine.js'), 'utf8');
const digest = json => createHash('sha256').update(json).digest('hex');
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
function method(name) {
  const found = index.match(new RegExp('^      ' + name + '\\([^\\n]*\\) \\{[\\s\\S]*?^      \\}', 'm'));
  assert.ok(found, 'Execute actual production method ' + name); return found[0];
}
function runtime() {
  const array = n => new Float32Array(n).fill(.7);
  const h = { authorityEpoch: 1, simulationTick: 0, W_actor: array(80), W_actor_frozen: array(80),
    W_critic: array(16), W_metamorph: array(30), W_world: array(256), W_world_frozen: array(256),
    bodyRecipe: {}, cognitiveCortex: { realizationLedger: [] }, visitedUrlTabooSet: new Set(), clickedAnchorTabooSet: new Set(),
    SWARM_FORMATIONS: [], updateMorphologyVector() {},
    deepCortex: { W_enc1: array(1024), W_rssm_rec: array(1024), W_actor_out: array(512), W_critic_out: array(64), W_body_genome: array(448) },
    trainableAlifeNeuralHub: Object.fromEntries(['W_perc_enc','W_perc_dec','W_dyn1','W_dyn2','W_diff1','W_diff2','W_gen1','W_gen2','W_disc1','W_disc2','W_aware16','W_icm_inv'].map(key=>[key,array(512)])) };
  h.deepCortex.W_actor = h.W_actor; h.deepCortex.W_critic = h.W_critic;
  h.trainableAlifeNeuralHub.totalBackpropStepsTrained = 1;
  return h;
}
function loader(h, driver, legacy = null) {
  const calls = { reads: 0, writes: 0, captures: 0 };
  const window = { aliveGenomePersistence: driver };
  const context = vm.createContext({ window, console, localStorage: {
    getItem() { calls.reads++; return legacy; }, setItem() { calls.writes++; }
  } });
  h.loadPersistentGenome = vm.runInContext('({' + method('loadPersistentGenome') + '}).loadPersistentGenome', context);
  h.savePersistentGenome = vm.runInContext('({' + method('savePersistentGenome') + '}).savePersistentGenome', context);
  h.capturePersistentGenomePayload = () => { calls.captures++; throw Error('Must defer capture until autosave is installed'); };
  return { context, window, calls };
}
function driverFor(json, status = 'ready') {
  return create({ bootstrap: { status, json, revision: status === 'ready' ? 4 : 0,
    digest: json ? digest(json) : null, ownerId: 'fixture', epoch: 0, writeAllowed: status !== 'error' },
    invoke() { assert.fail('Startup must not write canonical data directly'); } });
}
function binaryFixture(h = runtime()) {
  const context = vm.createContext({ Float32Array, Float64Array, Uint8Array, atob: value => Buffer.from(value, 'base64').toString('binary') });
  vm.runInContext(engineSource, context);
  const engine = Object.create(context.GigachadAlifeNeuralCyberEngine.prototype);
  Object.assign(engine, { diskCheckpointStatus: {}, W_mamba_delta16: new Float32Array(256).fill(.4),
    W_jepa_online: new Float32Array(256).fill(.4), W_jepa_target_ema: new Float32Array(256).fill(.4) });
  const values = new Float32Array(4096).fill(.125);
  const response = () => ({ ok: true, weightsBase64: Buffer.from(values.buffer).toString('base64'), byteLength: values.byteLength, sha256Prefix: 'fixture-digest' });
  return { h, engine, values, response, context };
}

test('actual constructor restores canonical before binary request and defers init-baseline save without legacy writes', async () => {
  const h = runtime(), saved = { simulationTick: 75, W_actor: Array(80).fill(.12345), trainableHub: { W_perc_enc: Array(512).fill(.2345) } };
  const driver = driverFor(JSON.stringify(saved)), f = loader(h, driver, '{"simulationTick":999}');
  let binaryCalled = 0;
  h.frontierNeuralCyberEngine = { loadWeightsFromDisk(model) {
    binaryCalled++; assert.equal(model.simulationTick, 75); assert.equal(model.persistentGenomeRestore.restoredTensorCount, 2); return Promise.resolve(false);
  } };
  Object.assign(h, { initWebGpuWorldModelShader() {}, stepOmega100OmniscienceEngine() {}, evaluateAcceptanceGates() {},
    saveCheckpoint(label) { assert.equal(label, 'init-baseline'); this.savePersistentGenome(); } });
  f.context.ipcRenderer = { invoke: async () => ({ ok: false }) };
  const start = index.indexOf('        this.initWebGpuWorldModelShader();'), end = index.indexOf('        this.evaluateAcceptanceGates();', start);
  assert.ok(start > 0 && end > start);
  const constructorTail = vm.runInContext('(function(){' + index.slice(start, end + '        this.evaluateAcceptanceGates();'.length) + '})', f.context);
  constructorTail.call(h); await Promise.resolve();
  assert.equal(binaryCalled, 1); assert.equal(h.persistentGenomeSaveDeferred, true);
  assert.deepEqual(f.calls, { reads: 0, writes: 0, captures: 0 });
  assert.equal(driver.snapshot().application, 'applied');
  assert.ok(index.indexOf('src="systems/alive-genome-persistence.js"') < index.indexOf('    const ipcRenderer ='));
});

test('actual loader accepts explicit fresh JSON, rejects array/invalid data, and records actual application failure', () => {
  const h = runtime(), driver = driverFor('{"simulationTick":7}'), f = loader(h, driver);
  assert.equal(h.loadPersistentGenome(JSON.stringify({ simulationTick: 91, W_actor: Array(80).fill(.33333) })), true);
  assert.equal(h.simulationTick, 91); assert.equal(h.persistentGenomeRestore.source, 'explicit');
  assert.equal(h.persistentGenomeRestore.restoredTensorCount, 1); assert.equal(f.calls.reads, 0);
  assert.equal(h.loadPersistentGenome('[]'), false); assert.equal(driver.snapshot().writeAllowed, false);
  assert.equal(driver.snapshot().application, 'rejected');
  assert.equal(h.loadPersistentGenome('{broken'), false);
});

test('actual loader retains historical recovery provenance and clears it for an unrecovered save', () => {
  const h = runtime(), provenance = { schema: 'gigachad.native-state-recovery.v1', sourceRevision: 128,
    provenance: { exactHistoricalContinuation: false } };
  const driver = driverFor(JSON.stringify({ simulationTick: 91, nativeStateRecovery: provenance }));
  loader(h, driver);
  assert.equal(h.loadPersistentGenome(), true);
  assert.equal(JSON.stringify(h.nativeStateRecovery), JSON.stringify(provenance));
  assert.equal(h.loadPersistentGenome('{"simulationTick":92}'), true);
  assert.equal(h.nativeStateRecovery, null);
});

test('canonical bootstrap errors cannot cause an init-baseline legacy write or false restored state', () => {
  const h = runtime(), driver = driverFor(null, 'error'), f = loader(h, driver, '{"simulationTick":99}');
  assert.equal(h.loadPersistentGenome(), false); h.savePersistentGenome();
  assert.equal(h.persistentGenomeRestore, undefined);
  assert.equal(driver.snapshot().application, 'unavailable'); assert.equal(driver.snapshot().writeAllowed, false);
  assert.deepEqual(f.calls, { reads: 0, writes: 0, captures: 0 });
});

test('native checkpoint rejection precedes legacy mutation and blocks canonical replacement', async () => {
  const adapter = new AuthenticAsmodensiusAdapter({ seed: 17 });
  adapter.step(new Float64Array(16).fill(.25));
  const nativeBefore = adapter.exportState().payload;
  const cases = [
    { adapter, error: /Invalid, incompatible or corrupted authentic checkpoint|Checkpoint envelope requires own-data fields/ },
    { adapter: undefined, error: /adapter is unavailable/ },
    { adapter: {}, error: /adapter is unavailable/ },
    { adapter: { importState() { throw Error('native validation failed'); } }, error: /native validation failed/ }
  ];
  for (const scenario of cases) {
    const h = runtime(), actorBefore = h.W_actor.slice(), frozenBefore = h.W_actor_frozen.slice();
    h.authenticAsmodensius = scenario.adapter;
    h.persistentGenomeRestore = { applied: true, generation: 2 };
    let morphologyCalls = 0;
    h.updateMorphologyVector = () => { morphologyCalls++; };
    const json = JSON.stringify({ authorityEpoch: 77, simulationTick: 91, W_actor: Array(80).fill(.33333),
      bodyRecipe: { shouldNotApply: true }, authenticAsmodensius: { schema: 'incompatible-upgrade' } });
    const driver = driverFor(json), f = loader(h, driver);
    assert.equal(h.loadPersistentGenome(), false);
    assert.equal(h.authorityEpoch, 1); assert.equal(h.simulationTick, 0);
    assert.deepEqual(h.W_actor, actorBefore); assert.deepEqual(h.W_actor_frozen, frozenBefore);
    assert.deepEqual(h.bodyRecipe, {}); assert.equal(morphologyCalls, 0);
    assert.equal(h.persistentGenomeRestore.applied, false);
    assert.equal(h.persistentGenomeRestore.restoredTensorCount, 0);
    assert.equal(h.persistentGenomeRestore.generation, 2);
    assert.equal(h.persistentGenomeRestore.source, 'canonical');
    assert.match(h.persistentGenomeRestore.error, scenario.error);
    assert.equal(driver.snapshot().application, 'rejected'); assert.equal(driver.snapshot().writeAllowed, false);
    assert.equal((await driver.commit({ epoch: 0, jobId: 1, json: '{}' })).status, 'cancelled');
    assert.equal(driver.initialJSON(null, 'unused'), json, 'rejected checkpoint remains the canonical cached state');
    assert.deepEqual(f.calls, { reads: 0, writes: 0, captures: 0 });
  }
  assert.equal(adapter.exportState().payload, nativeBefore, 'actual adapter rejection preserves its native state');
});

test('accepted native checkpoint restores native and legacy state before allowing canonical writes', () => {
  const savedNative = new AuthenticAsmodensiusAdapter({ seed: 17 });
  savedNative.step(new Float64Array(16).fill(.25));
  const h = runtime(); h.authenticAsmodensius = new AuthenticAsmodensiusAdapter({ seed: 999 });
  const driver = driverFor(JSON.stringify({ authorityEpoch: 4, simulationTick: 91,
    W_actor: Array(80).fill(.33333), authenticAsmodensius: savedNative.exportState() }));
  loader(h, driver);
  assert.equal(h.loadPersistentGenome(), true, h.persistentGenomeRestore?.error);
  assert.equal(h.authenticAsmodensius.exportState().payload, savedNative.exportState().payload);
  assert.equal(h.authorityEpoch, 5); assert.equal(h.simulationTick, 91);
  assert.equal(h.W_actor[0], Math.fround(.33333)); assert.deepEqual(h.W_actor_frozen, h.W_actor);
  assert.equal(h.persistentGenomeRestore.applied, true); assert.equal(h.persistentGenomeRestore.restoredTensorCount, 1);
  assert.equal(driver.snapshot().application, 'applied'); assert.equal(driver.snapshot().writeAllowed, true);
});

test('legacy genomes without native state, including the null capture sentinel, remain loadable', () => {
  for (const native of [{}, { authenticAsmodensius: null }]) {
    const h = runtime(), driver = driverFor(JSON.stringify({ simulationTick: 91, W_actor: Array(80).fill(.33333), ...native }));
    loader(h, driver);
    assert.equal(h.loadPersistentGenome(), true);
    assert.equal(h.simulationTick, 91); assert.equal(h.W_actor[0], Math.fround(.33333));
    assert.equal(h.persistentGenomeRestore.applied, true); assert.equal(driver.snapshot().writeAllowed, true);
  }
});

test('actual binary loader remains functional for an unchanged new runtime', async () => {
  const f = binaryFixture();
  assert.equal(await f.engine.loadWeightsFromDisk(f.h, { invoke: async () => f.response() }), true);
  assert.equal(f.h.W_actor[0], .125); assert.equal(f.h.trainableAlifeNeuralHub.W_perc_enc[255], .125);
  assert.equal(f.h.trainableAlifeNeuralHub.W_perc_enc[256], Math.fround(.7), 'only original prefix is applied');
  assert.equal(f.engine.diskCheckpointStatus.loadedFromDisk, true);
});

test('exact primary-only restoration fences the actual late binary loader even without legacy weight copies', async () => {
  const f = binaryFixture(), actor = f.h.W_actor.slice(), critic = f.h.W_critic.slice();
  f.h.persistentGenomeRestore = { applied: true, generation: 1, restoredTensorCount: 0,
    primaryPolicy: { status: 'applied', readbackVerified: true, tensorCount: 6 } };
  assert.equal(await f.engine.loadWeightsFromDisk(f.h, { invoke: async () => f.response() }), false);
  assert.deepEqual(f.h.W_actor, actor); assert.deepEqual(f.h.W_critic, critic);
});

test('restored canonical policy and hub prefixes survive the actual late binary bootstrap while asset metadata remains visible', async () => {
  const f = binaryFixture(), driver = driverFor(JSON.stringify({ simulationTick: 75,
    W_actor: Array(80).fill(.12345), trainableHub: { W_perc_enc: Array(512).fill(.2345), totalBackpropStepsTrained: 321 } }));
  loader(f.h, driver); assert.equal(f.h.loadPersistentGenome(), true);
  const actor = f.h.W_actor.slice(), perc = f.h.trainableAlifeNeuralHub.W_perc_enc.slice();
  assert.equal(await f.engine.loadWeightsFromDisk(f.h, { invoke: async () => f.response() }), false);
  assert.deepEqual(f.h.W_actor, actor); assert.deepEqual(f.h.trainableAlifeNeuralHub.W_perc_enc, perc);
  assert.equal(f.h.trainableAlifeNeuralHub.totalBackpropStepsTrained, 321);
  assert.equal(f.engine.diskCheckpointStatus.assetAvailable, true);
  assert.equal(f.engine.diskCheckpointStatus.loadedFromDisk, false);
  assert.equal(f.engine.diskCheckpointStatus.skipReason, 'persisted-genome-precedence');
});

test('learning, restore, or direct target edits during the actual binary await fence stale bootstrap writes', async () => {
  for (const change of ['tick', 'steps', 'prefix', 'restore', 'replacement']) {
    const f = binaryFixture(), gate = deferred();
    const pending = f.engine.loadWeightsFromDisk(f.h, { invoke: () => gate.promise });
    if (change === 'tick') f.h.simulationTick++;
    if (change === 'steps') f.h.trainableAlifeNeuralHub.totalBackpropStepsTrained++;
    if (change === 'prefix') f.h.trainableAlifeNeuralHub.W_perc_enc[0] = .9;
    if (change === 'restore') f.h.persistentGenomeRestore = { generation: 1, restoredTensorCount: 1 };
    if (change === 'replacement') f.h.trainableAlifeNeuralHub.W_perc_enc = f.h.trainableAlifeNeuralHub.W_perc_enc.slice();
    const before = f.h.trainableAlifeNeuralHub.W_perc_enc.slice();
    gate.resolve(f.response()); assert.equal(await pending, false, change);
    assert.deepEqual(f.h.trainableAlifeNeuralHub.W_perc_enc, before, change);
    assert.equal(f.h.deepCortex.W_enc1[0], Math.fround(.7), change);
    assert.equal(f.engine.diskCheckpointStatus.loadStatus, 'available-not-applied', change);
  }
});

test('nonfinite binary payload is rejected before the first tensor write', async () => {
  const f = binaryFixture(); f.values[3000] = NaN;
  assert.equal(await f.engine.loadWeightsFromDisk(f.h, { invoke: async () => f.response() }), false);
  assert.equal(f.h.deepCortex.W_enc1[0], Math.fround(.7));
  assert.equal(f.engine.diskCheckpointStatus.loadStatus, 'invalid-binary');
});

test('final persistence blocks initial and already pending binary asset application', async () => {
  const f = binaryFixture(), gate = deferred();
  const pending = f.engine.loadWeightsFromDisk(f.h, { invoke: () => gate.promise });
  f.context.__alivePersistenceClosing = true;
  gate.resolve(f.response());
  assert.equal(await pending, false);
  assert.equal(f.engine.diskCheckpointStatus.skipReason, 'persistence-closing');
  assert.equal(f.h.deepCortex.W_enc1[0], Math.fround(.7));
  assert.equal(await f.engine.loadWeightsFromDisk(f.h, { invoke() { assert.fail('Closing must not start another binary load'); } }), false);
});
