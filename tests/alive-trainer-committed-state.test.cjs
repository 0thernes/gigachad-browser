'use strict';
// Actual engine methods and emitted worker code in isolated JavaScript realms.
// Transport/timers are controlled; no Electron, native Worker, files or network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(require.resolve('../systems/alife-25-bleeding-edge-models.js'), 'utf8');
const cloneSource = `(function clone(value) {
  if (!value || typeof value !== 'object') return value;
  if (ArrayBuffer.isView(value)) return new globalThis[Object.prototype.toString.call(value).slice(8,-1)](value);
  if (Array.isArray(value)) { const out=new Array(value.length); for(let i=0;i<value.length;i++) out[i]=clone(value[i]); return out; }
  const out={}; for (const key of Object.keys(value)) out[key]=clone(value[key]); return out;
})`;
const bytes = value => Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('hex');
function fixture({ construct = false, defer = false } = {}) {
  const workers = [], blobs = new Map(), timers = new Map(), requests = [];
  let nextTimer = 0, nextBlob = 0, clone;
  class MockWorker {
    constructor(url) {
      this.jobs = []; this.outputs = []; this.terminated = false;
      this.realm = vm.createContext({ self: { postMessage: data => this.outputs.push(data) } });
      this.clone = vm.runInContext(cloneSource, this.realm);
      vm.runInContext(blobs.get(url), this.realm, { timeout: 500 }); workers.push(this);
    }
    postMessage(value) { this.jobs.push(this.clone(value)); }
    compute(index = this.jobs.length - 1) { this.realm.self.onmessage({ data: this.jobs[index] }); return this.outputs.at(-1); }
    deliver(value, callback = this.onmessage) { callback?.({ data: clone(value) }); }
    reply() { const value = this.compute(); this.deliver(value); return value; }
    terminate() { this.terminated = true; }
  }
  const context = vm.createContext({ module: { exports: {} }, Worker: MockWorker,
    Blob: class { constructor(parts) { this.text = parts.join(''); } },
    URL: { createObjectURL(blob) { const id = `blob:unit-${++nextBlob}`; blobs.set(id, blob.text); return id; }, revokeObjectURL(id) { blobs.delete(id); } },
    setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; }, clearTimeout(id) { timers.delete(id); }
  });
  vm.runInContext(source, context, { timeout: 1000 });
  const run = code => vm.runInContext(code, context, { timeout: 1000 });
  clone = run(cloneSource);
  const engine = run(construct ? `new BleedEdge25AlifeEngine({deferWorkerActivation:${defer}})` : `Object.create(BleedEdge25AlifeEngine.prototype)`);
  context.engine = engine;
  if (!construct) run(`engine.W_hyper_u=Float32Array.from({length:16},(_,i)=>(i-8)/32);
    engine.workerTrainerStatus={};engine.cyberHatTelemetry={hostname:'before',networkSensoryVector8:[.1,.2,.3,.4,.5,.6,.7,.8]};
    engine.suspendWorkerTrainer('unit-paused');`);
  context.gigachad = { invoke(name, payload) { return new Promise((resolve, reject) => requests.push({ name, payload, resolve, reject })); } };
  const input = run('Float32Array.from({length:16},(_,i)=>(i-7)/13)');
  return { engine, context, workers, timers, requests, input, clone, run,
    prepare(data = engine.captureCommittedTrainerState()) {
      return engine.prepareCommittedTrainerRestore(data, clone({ expectedGeneration: engine.workerTrainerSnapshot().generation }));
    },
    state() { return JSON.parse(JSON.stringify(engine.workerTrainerSnapshot())); },
    resume(options = {}) { return engine.resumeWorkerTrainer(clone(options)); },
    candidate(epoch = 37, timeoutMs = 1500) {
      const data = engine.captureCommittedTrainerState(); data.committedEpoch = epoch; data.timeoutMs = timeoutMs;
      data.weights.fill(-.375); return data;
    }
  };
}

test('constructor default still activates; deferred option allocates models and keeps only trainer suspended', () => {
  const ordinary = fixture({ construct: true }), deferred = fixture({ construct: true, defer: true });
  assert.equal(ordinary.workers.length, 1); assert.equal(ordinary.state().active, true);
  assert.equal(deferred.workers.length, 0); assert.equal(deferred.state().phase, 'suspended');
  assert.equal(deferred.state().committedEpoch, 0); assert.equal(deferred.timers.size, 0);
  assert.ok(deferred.engine.aotTotGot); assert.ok(deferred.engine.siblingBrainFusion);
  assert.equal(deferred.engine.multiPrecisionBuffer64K.byteLength, 65536);
  assert.equal(bytes(deferred.engine.W_hyper_u), bytes(ordinary.engine.W_hyper_u));
  assert.equal(deferred.resume().status, 'ready'); assert.equal(deferred.workers.length, 1);
});

test('capture keeps exact zero/subnormal bytes, owns its copy and ignores editable clock telemetry', () => {
  const f = fixture();
  f.run(`new Uint32Array(engine.W_hyper_u.buffer).set([0,0x80000000,1,0x80000001,0x007fffff,0x807fffff,0x7f7fffff,0xff7fffff]);
    engine.W_hyper_u[Symbol.iterator]=()=>{throw Error('iterator');};engine.W_hyper_u.set=()=>{throw Error('set');};
    engine.workerTrainerStatus={committedEpoch:999};`);
  const expected = bytes(f.engine.W_hyper_u), data = f.engine.captureCommittedTrainerState();
  assert.deepEqual(Object.keys(data), ['schemaVersion','kernelId','weights','committedEpoch','timeoutMs']);
  assert.equal(data.schemaVersion, 1); assert.equal(data.kernelId, 'bleeding-hyper-worker-v1');
  assert.equal(data.committedEpoch, 0); assert.equal(data.timeoutMs, 5000); assert.equal(bytes(data.weights), expected);
  assert.notEqual(data.weights.buffer, f.engine.W_hyper_u.buffer);
  data.weights.fill(2); assert.equal(bytes(f.engine.W_hyper_u), expected);
});

test('capture during pending work excludes that job and reflects only the last actual commit', () => {
  const f = fixture(); f.resume(); f.engine.dispatchWorkerTrainer(f.input);
  const pending = f.engine.captureCommittedTrainerState();
  assert.equal(pending.committedEpoch, 0); assert.equal('pendingJobId' in pending, false);
  f.workers[0].reply(); const committed = f.engine.captureCommittedTrainerState();
  assert.equal(committed.committedEpoch, 1); assert.notEqual(bytes(pending.weights), bytes(committed.weights));
});

test('prepare owns candidate bytes; atomic commit preserves counters, view aliases and suspension without activation', () => {
  const f = fixture(); f.resume(); f.engine.dispatchWorkerTrainer(f.input); f.workers[0].reply();
  assert.equal(f.state().committedEpoch, 1); assert.equal(f.state().applied, 1);
  f.engine.suspendWorkerTrainer('restore');
  const before = f.state(), alias = f.engine.W_hyper_u, backing = alias.buffer, data = f.candidate();
  const expected = bytes(data.weights), handle = f.prepare(data);
  assert.equal(Object.keys(handle).length, 0); assert.equal(Object.isFrozen(handle), true);
  data.weights.fill(9); data.committedEpoch = 99; data.timeoutMs = 55;
  assert.equal(f.engine.recheckCommittedTrainerRestore(handle), true);
  const receipt = f.engine.commitCommittedTrainerRestore(handle), after = f.state();
  assert.equal(receipt.status, 'restored'); assert.equal(receipt.weightsBytes, 64);
  assert.equal(after.committedEpoch, 37); assert.equal(after.timeoutMs, 1500); assert.equal(after.generation, before.generation + 1);
  assert.equal(after.phase, 'suspended'); assert.equal(after.active, false); assert.equal(after.committedStateRestored, true);
  assert.equal(after.semanticClockPersisted, false);
  for (const key of ['submitted','applied','discarded','rejectedReplies','rejectedInputs','busySkips','faults','timeouts','workersCreated','lastReplayGradNorm']) assert.equal(after[key], before[key], key);
  assert.equal(f.engine.W_hyper_u, alias); assert.equal(alias.buffer, backing); assert.equal(bytes(alias), expected);
  assert.equal(f.workers.length, 1); assert.equal(f.timers.size, 0); assert.equal(f.engine.dispatchWorkerTrainer(f.input).status, 'blocked');
  assert.equal(f.engine.recheckCommittedTrainerRestore(handle), false);
  assert.throws(() => f.engine.commitCommittedTrainerRestore(handle), /stale/);
});

test('raw signed-zero and subnormal candidate bytes survive actual preparation and commit', () => {
  const f = fixture(), data = f.candidate(0, 50); f.context.data = data;
  f.run('new Uint32Array(data.weights.buffer).set([0,0x80000000,1,0x80000001,0x007fffff,0x807fffff])');
  const expected = bytes(data.weights); f.engine.commitCommittedTrainerRestore(f.prepare(data));
  assert.equal(bytes(f.engine.W_hyper_u), expected); assert.equal(f.state().committedEpoch, 0); assert.equal(f.state().timeoutMs, 50);
});

test('all candidate fields and final lane are validated before destination mutation', () => {
  const mutations = [
    'data.weights[15]=NaN', 'data.weights[15]=Infinity', 'data.weights=new Float32Array(15)',
    'data.weights=new Float64Array(16)', 'data.weights=new Float32Array(new ArrayBuffer(128),0,16)',
    'data.weights=new Float32Array(new ArrayBuffer(68),4,16)', 'data.weights=new Float32Array(new SharedArrayBuffer(64))',
    "data.weights=new Float32Array(new ArrayBuffer(64,{maxByteLength:128}))",
    'data.schemaVersion=2', "data.kernelId='other'", 'data.extra=1', 'delete data.timeoutMs',
    'data.committedEpoch=-1', 'data.committedEpoch=-0', 'data.committedEpoch=1.1', 'data.committedEpoch=NaN',
    'data.committedEpoch=Number.MAX_SAFE_INTEGER+1', 'data.timeoutMs=49', 'data.timeoutMs=30001', 'data.timeoutMs=50.5',
    "Object.defineProperty(data,'weights',{get(){throw Error('getter must not run')}})", 'data[Symbol()]=1', 'Object.setPrototypeOf(data,{})'
  ];
  for (const mutation of mutations) {
    const f = fixture(), data = f.candidate(), before = bytes(f.engine.W_hyper_u), state = f.state(); f.context.data = data;
    f.run(mutation); assert.throws(() => f.prepare(data), undefined, mutation);
    assert.equal(bytes(f.engine.W_hyper_u), before, mutation); assert.deepEqual(f.state(), state, mutation);
  }
});

test('exact target allocation, own slots and expected-generation context are enforced', () => {
  for (const mutation of [
    'engine.W_hyper_u=new Float32Array(new ArrayBuffer(128),0,16)',
    'engine.W_hyper_u=new Float32Array(new ArrayBuffer(68),4,16)',
    'engine.W_hyper_u=new Float32Array(new SharedArrayBuffer(64))',
    "Object.defineProperty(engine,'W_hyper_u',{get(){throw Error('weight accessor')}})",
    "Object.defineProperty(engine,'workerTrainerStatus',{get(){throw Error('status accessor')}})",
    "Object.defineProperty(engine,'workerTrainerStatus',{writable:false})"
  ]) {
    const f = fixture(), data = f.candidate(); f.run(mutation); assert.throws(() => f.prepare(data), undefined, mutation);
  }
  const f = fixture(), data = f.candidate();
  for (const options of [{}, {expectedGeneration:0}, {expectedGeneration:-0}, {expectedGeneration:1,extra:true}]) {
    assert.throws(() => f.engine.prepareCommittedTrainerRestore(data, f.clone(options)), /generation/);
  }
});

test('active, pending and disposed trainer states cannot prepare a restore', () => {
  for (const kind of ['active','pending','disposed']) {
    const f = fixture(), data = f.candidate(); f.resume();
    if (kind === 'pending') f.engine.dispatchWorkerTrainer(f.input);
    if (kind === 'disposed') f.engine.disposeWorkerTrainer();
    const before = bytes(f.engine.W_hyper_u); assert.throws(() => f.prepare(data), /inactive/); assert.equal(bytes(f.engine.W_hyper_u), before);
  }
});

test('opaque handles are target-bound and single-use, including explicit discard', () => {
  const f = fixture(), other = fixture(), handle = f.prepare(f.candidate());
  assert.equal(f.engine.recheckCommittedTrainerRestore({}), false); assert.throws(() => f.engine.commitCommittedTrainerRestore({}), /stale/);
  assert.equal(other.engine.recheckCommittedTrainerRestore(handle), false); assert.equal(other.engine.discardCommittedTrainerRestore(handle), false);
  assert.throws(() => other.engine.commitCommittedTrainerRestore(handle), /stale/);
  assert.equal(f.engine.recheckCommittedTrainerRestore(handle), true);
  assert.equal(f.engine.discardCommittedTrainerRestore(handle), true); assert.equal(f.engine.discardCommittedTrainerRestore(handle), false);
  assert.throws(() => f.engine.commitCommittedTrainerRestore(handle), /stale/);
});

test('changed target bytes, view, slots, diagnostics or lifecycle invalidate a prepared handle without writes', () => {
  for (const mutation of [
    'engine.W_hyper_u[15]+=.125', 'new Uint8Array(engine.W_hyper_u.buffer)[3]^=0x80',
    'engine.W_hyper_u=new Float32Array(engine.W_hyper_u)',
    "Object.defineProperty(engine,'W_hyper_u',{enumerable:false})",
    'engine.workerTrainerStatus={}', "Object.defineProperty(engine,'workerTrainerStatus',{writable:false})",
    "engine.suspendWorkerTrainer('again')", 'engine.resumeWorkerTrainer()', 'engine.disposeWorkerTrainer()'
  ]) {
    const f = fixture(), handle = f.prepare(f.candidate()); f.run(mutation);
    const before = bytes(f.engine.W_hyper_u), state = f.state();
    assert.equal(f.engine.recheckCommittedTrainerRestore(handle), false, mutation);
    assert.throws(() => f.engine.commitCommittedTrainerRestore(handle), /stale/, mutation);
    assert.equal(bytes(f.engine.W_hyper_u), before, mutation); assert.deepEqual(f.state(), state, mutation);
  }
});

test('detached destination and input buffers reject rather than partially restore', () => {
  const f = fixture(), data = f.candidate(), handle = f.prepare(data), before = f.state();
  structuredClone(f.engine.W_hyper_u.buffer, {transfer:[f.engine.W_hyper_u.buffer]});
  assert.equal(f.engine.recheckCommittedTrainerRestore(handle), false);
  assert.throws(() => f.engine.commitCommittedTrainerRestore(handle), /stale/); assert.deepEqual(f.state(), before);
  const g = fixture(), invalid = g.candidate(); structuredClone(invalid.weights.buffer, {transfer:[invalid.weights.buffer]});
  assert.throws(() => g.prepare(invalid));
});

test('terminal maximum epoch is retained and default resume never silently resets it', () => {
  const f = fixture(); f.engine.commitCommittedTrainerRestore(f.prepare(f.candidate(Number.MAX_SAFE_INTEGER, 30000)));
  assert.equal(f.state().committedEpoch, Number.MAX_SAFE_INTEGER); assert.equal(f.resume().status, 'blocked');
  assert.equal(f.state().committedEpoch, Number.MAX_SAFE_INTEGER); assert.equal(f.workers.length, 0);
  assert.equal(f.engine.dispatchWorkerTrainer(f.input).status, 'blocked');
});

test('old reply is rejected after committed restore and new exact epoch update matches uninterrupted worker math', () => {
  const f = fixture(); f.resume(); f.engine.dispatchWorkerTrainer(f.input);
  const old = f.workers[0], callback = old.onmessage, reply = old.compute(); f.engine.suspendWorkerTrainer('restore');
  const data = f.candidate(37), expectedInitial = Array.from(data.weights);
  f.engine.commitCommittedTrainerRestore(f.prepare(data));
  old.deliver(reply, callback); assert.deepEqual(Array.from(f.engine.W_hyper_u), expectedInitial); assert.equal(f.state().committedEpoch, 37);
  assert.equal(f.resume().status, 'ready'); assert.equal(f.engine.dispatchWorkerTrainer(f.input).targetEpoch, 38);
  const expected = new Float32Array(16);
  for (let i=0;i<16;i++) {
    const v=Number(f.input[i]||0), delta=Math.fround(-(v-Math.tanh(v*.92+Math.sin(38*.3+i)*.15))*.05);
    expected[i]=Math.max(-1.5,Math.min(1.5,expectedInitial[i]+delta));
  }
  f.workers[1].reply(); assert.equal(bytes(f.engine.W_hyper_u), bytes(expected)); assert.equal(f.state().committedEpoch, 38);
});

test('actual adapter and wire roundtrip retain real learning and the next worker update with controlled intervening inputs', { timeout: 5000 }, async () => {
  const f = fixture(), initialBytes = bytes(f.engine.W_hyper_u);
  f.resume();
  for (let epoch = 1; epoch <= 3; epoch++) {
    f.run(`engine.dispatchWorkerTrainer(Float32Array.from({length:16},(_,i)=>(i-${epoch})/17))`);
    f.workers[0].reply(); assert.equal(f.state().committedEpoch, epoch);
  }
  const learnedBytes = bytes(f.engine.W_hyper_u), generationBeforeCapture = f.state().generation;
  assert.notEqual(learnedBytes, initialBytes); assert.equal(f.state().applied, 3);
  // All real production components share the engine realm. Only WebCrypto and
  // TextEncoder are supplied platform facilities; no adapter is stubbed.
  f.context.crypto = webcrypto; f.context.TextEncoder = TextEncoder;
  for (const name of ['alive-learned-state-codec', 'alive-learned-state-registry', 'alive-trainer-state']) {
    vm.runInContext(fs.readFileSync(require.resolve(`../systems/${name}.js`), 'utf8'), f.context, { filename: name + '.js', timeout: 1000 });
  }
  await f.run(`(async()=>{
    globalThis.trainerAdapter=await AliveTrainerState.create({registry:AliveLearnedStateRegistry,codec:AliveLearnedStateCodec,crypto});
    globalThis.trainerWire=await AliveLearnedStateCodec.encode(trainerAdapter.capture(engine,{
      creatureId:'controlled-worker',policyId:'controlled-policy',checkpointId:'controlled-checkpoint',
      logicalTick:90,modelEpoch:3,capturedAt:'2026-11-09T00:00:00.000Z',resumeBoundary:'fresh-browser-authority'
    }),{crypto});
    globalThis.trainerDecoded=await AliveLearnedStateCodec.decode(trainerWire,{crypto});
    globalThis.restoredEngine=Object.create(BleedEdge25AlifeEngine.prototype);
    restoredEngine.W_hyper_u=new Float32Array(16).fill(-.875);restoredEngine.workerTrainerStatus={};
    restoredEngine.suspendWorkerTrainer('fresh-instance');
    globalThis.restoredAlias=restoredEngine.W_hyper_u;
    globalThis.trainerPlan=trainerAdapter.preflight(trainerDecoded,restoredEngine,{
      expectedGeneration:restoredEngine.workerTrainerSnapshot().generation
    });
    globalThis.trainerReceipt=trainerAdapter.apply(trainerPlan,restoredEngine);
  })()`);
  const restored = f.context.restoredEngine;
  assert.equal(typeof f.context.trainerWire, 'string'); assert.ok(f.context.trainerWire.length > 64);
  assert.equal(f.context.trainerReceipt.status, 'restored'); assert.equal(f.context.trainerReceipt.committedEpoch, 3);
  assert.equal(restored.W_hyper_u, f.context.restoredAlias); assert.equal(bytes(restored.W_hyper_u), learnedBytes);
  assert.equal(f.state().generation, generationBeforeCapture); assert.equal(f.state().active, true);
  assert.equal(restored.workerTrainerSnapshot().active, false); assert.equal(restored.workerTrainerSnapshot().applied, 0);
  assert.equal(f.workers.length, 1, 'Wire restoration must not activate a new worker');

  // Deliberately controlled omissions: next world latent, network context and
  // event order are supplied equally; this does not replay the hub, browser,
  // frame cadence, full world model, hardware entropy or native worker timing.
  f.run(`restoredEngine.resumeWorkerTrainer();
    globalThis.nextInput=Float32Array.from({length:16},(_,i)=>(i-5)/19);
    globalThis.originalJob=engine.dispatchWorkerTrainer(nextInput);
    globalThis.restoredJob=restoredEngine.dispatchWorkerTrainer(nextInput);`);
  assert.equal(f.context.originalJob.targetEpoch, 4); assert.equal(f.context.restoredJob.targetEpoch, 4);
  const uWrites = source.split(/\r?\n/).filter(line => line.includes('this.W_hyper_u[i] = Math.tanh('));
  assert.equal(uWrites.length, 1, 'One actual main-thread hypernetwork update expression');
  // Execute the actual production U update expression, with identical bounded
  // external z/cIn inputs, AFTER both dispatches and BEFORE either reply.
  f.run(`(function(){
    const z=Float32Array.from({length:16},(_,i)=>(i-4)/17);
    function mainThreadUpdate(){for(let i=0;i<16;i++){const cIn=((i%8)-3)/10;${uWrites[0]}}}
    mainThreadUpdate.call(engine);mainThreadUpdate.call(restoredEngine);
  })()`);
  const interveningBytes = bytes(f.engine.W_hyper_u);
  assert.notEqual(interveningBytes, learnedBytes); assert.equal(bytes(restored.W_hyper_u), interveningBytes);
  const originalReply = f.workers[0].compute(), restoredReply = f.workers[1].compute();
  assert.equal(originalReply.targetEpoch, 4); assert.equal(restoredReply.targetEpoch, 4);
  assert.equal(originalReply.gradNorm, restoredReply.gradNorm);
  assert.equal(bytes(Float32Array.from(originalReply.deltas)), bytes(Float32Array.from(restoredReply.deltas)));
  f.workers[0].deliver(originalReply); f.workers[1].deliver(restoredReply);
  assert.notEqual(bytes(f.engine.W_hyper_u), interveningBytes);
  assert.equal(bytes(restored.W_hyper_u), bytes(f.engine.W_hyper_u));
  assert.equal(f.state().committedEpoch, 4); assert.equal(restored.workerTrainerSnapshot().committedEpoch, 4);
  assert.equal(f.state().applied, 4); assert.equal(restored.workerTrainerSnapshot().applied, 1);
});

const reconResult = () => ({ok:true,hostname:'fresh.example',tlsInfo:{protocol:'TLSv1.3',cipher:'fixture',fingerprint256:'sha256-fixture'},
  deepWebDaemons:{localTorActive:true},proxyConfig:{routingSummary:'fixture'},networkSensoryVector8:[8,7,6,5,4,3,2,1]});

test('late recon responses cannot publish after pause, restore, close, owner replacement or admission flags', async () => {
  for (const boundary of ['pause','restore','dispose','replacement','closing','restoring']) {
    const f = fixture(); f.resume(); const original = f.engine.cyberHatTelemetry;
    const originalBefore = JSON.stringify(original), pending = f.engine.runCyberHatDomainRecon('https://fixture.example');
    assert.equal(f.requests.length, 1);
    if (boundary === 'pause') f.engine.suspendWorkerTrainer('paused');
    if (boundary === 'restore') { f.engine.suspendWorkerTrainer('restore'); f.engine.commitCommittedTrainerRestore(f.prepare(f.candidate())); }
    if (boundary === 'dispose') f.engine.disposeWorkerTrainer('closed');
    if (boundary === 'replacement') f.run("engine.cyberHatTelemetry={hostname:'new-owner',networkSensoryVector8:[0,0,0,0,0,0,0,0]}");
    if (boundary === 'closing') f.context.__alivePersistenceClosing = true;
    if (boundary === 'restoring') f.context.__aliveCheckpointRestore = true;
    const liveBefore = JSON.stringify(f.engine.cyberHatTelemetry);
    f.requests[0].resolve(f.clone(reconResult())); assert.equal(await pending, null, boundary);
    assert.equal(JSON.stringify(original), originalBefore, boundary); assert.equal(JSON.stringify(f.engine.cyberHatTelemetry), liveBefore, boundary);
  }
});

test('fresh recon preserves ordinary results, including a new manual request while trainer remains suspended', async () => {
  const f = fixture(), pending = f.engine.runCyberHatDomainRecon('https://fixture.example');
  assert.equal(f.requests[0].name, 'cyber-hat-inspect');
  const result = f.clone(reconResult()); f.requests[0].resolve(result); assert.equal(await pending, result);
  assert.equal(f.engine.cyberHatTelemetry.hostname, 'fresh.example');
  assert.deepEqual(Array.from(f.engine.cyberHatTelemetry.networkSensoryVector8), [8,7,6,5,4,3,2,1]);
  assert.equal(f.state().phase, 'suspended'); assert.equal(f.workers.length, 0);
});

test('closed/restore/disposed recon admission does not invoke IPC at all', async () => {
  for (const kind of ['closing','restoring','disposed']) {
    const f = fixture();
    if (kind === 'closing') f.context.__alivePersistenceClosing = true;
    if (kind === 'restoring') f.context.__aliveCheckpointRestore = true;
    if (kind === 'disposed') f.engine.disposeWorkerTrainer();
    assert.equal(await f.engine.runCyberHatDomainRecon(), null); assert.equal(f.requests.length, 0);
  }
});
