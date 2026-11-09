'use strict';
// Production trainer methods and its exact Blob worker source, exercised in
// isolated JS realms. No engine constructor, assets, app, GPU or OS worker runs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../systems/alife-25-bleeding-edge-models.js'), 'utf8');
const ownCloneSource = `(function copy(v) {
  if (v === null || typeof v !== 'object') return v;
  if (ArrayBuffer.isView(v)) return new globalThis[Object.prototype.toString.call(v).slice(8,-1)](v);
  if (Array.isArray(v)) { const out=new Array(v.length); for(const k of Object.keys(v)) out[k]=copy(v[k]); return out; }
  const out={}; for(const k of Object.keys(v)) Object.defineProperty(out,k,{value:copy(v[k]),writable:true,enumerable:true,configurable:true}); return out;
})`;
function fixture(options = {}) {
  const workers = [], urls = new Map(), revoked = [], timers = new Map();
  let clock = 0, nextTimer = 0, nextURL = 0, clone;
  class FakeBlob { constructor(parts) { if (options.blobFailure) throw Error('Blob failed'); this.source = parts.join(''); } }
  class FakeWorker {
    constructor(url) {
      if (options.constructorFailure) throw Error('Worker failed');
      this.url = url; this.jobs = []; this.outputs = []; this.terminated = false;
      this.onmessage = this.onerror = this.onmessageerror = null;
      const self = { postMessage: value => this.outputs.push(value) };
      this.realm = vm.createContext({ self });
      this.clone = vm.runInContext(ownCloneSource, this.realm);
      vm.runInContext(urls.get(url).source, this.realm, { filename: 'actual-trainer-worker.js' });
      workers.push(this);
    }
    postMessage(data) { if (options.postFailure) throw Error('post failed'); this.jobs.push(this.clone(data)); }
    compute(index = this.jobs.length - 1) { this.realm.self.onmessage({ data: this.jobs[index] }); return this.outputs.at(-1); }
    deliver(value, handler = this.onmessage) { handler?.({ data: clone(value) }); }
    reply(index = this.jobs.length - 1) { const value = this.compute(index); this.deliver(value); return value; }
    terminate() { this.terminated = true; }
    error() { this.onerror?.({ message: 'fixture worker error', preventDefault() {} }); }
    messageError() { this.onmessageerror?.({}); }
  }
  const context = vm.createContext({ module: { exports: {} }, Worker: options.unavailable ? undefined : FakeWorker,
    Blob: FakeBlob, URL: { createObjectURL(blob) { if (options.urlFailure) throw Error('URL failed'); const url = 'blob:trainer-fixture-' + (++nextURL); urls.set(url, blob); return url; },
      revokeObjectURL(url) { revoked.push(url); } },
    setTimeout(fn, ms) { const id = ++nextTimer; timers.set(id, { fn, due: clock + ms }); return id; },
    clearTimeout(id) { timers.delete(id); }
  });
  clone = vm.runInContext(ownCloneSource, context);
  vm.runInContext(source, context, { filename: 'alife-25-bleeding-edge-models.js' });
  const engine = vm.runInContext('Object.create(BleedEdge25AlifeEngine.prototype)', context);
  context.engine = engine;
  engine.W_hyper_u = vm.runInContext('Float32Array.from({length:16},(_,i)=>(i-8)/20)', context);
  const input = vm.runInContext('Float32Array.from({length:16},(_,i)=>(i-7)/11)', context);
  const resume = options => engine.resumeWorkerTrainer(clone(options || {}));
  return { engine, input, context, workers, urls, revoked, timers, clone, resume,
    start() { return engine._initOffThreadWorkerTrainer(); },
    run(expression) { return vm.runInContext(expression, context); },
    advance(ms) {
      const until = clock + ms;
      for (;;) {
        const next = [...timers].sort((a,b) => a[1].due-b[1].due).find(([,timer]) => timer.due <= until);
        if (!next) break;
        const [id,timer] = next; timers.delete(id); clock = timer.due; timer.fn();
      }
      clock = until;
    }
  };
}
const bytes = view => Buffer.from(view.buffer, view.byteOffset, view.byteLength).toString('hex');
function oracle(input, current, epoch) {
  const deltas = new Float32Array(16), next = new Float32Array(16); let norm = 0;
  for (let i = 0; i < 16; i++) {
    const v = Number(input[i] || 0), target = Math.tanh(v * 0.92 + Math.sin(epoch * 0.3 + i) * 0.15), gradient = (v-target)*0.05;
    deltas[i] = -gradient; norm += gradient * gradient;
    next[i] = Math.max(-1.5, Math.min(1.5, current[i] + deltas[i]));
  }
  return { next, norm: Number(Math.sqrt(norm).toFixed(5)) };
}

test('actual worker equation commits one exact Float32 update and host epoch; dispatch snapshots its input', () => {
  const f = fixture(); assert.equal(f.start().status, 'ready');
  assert.equal(f.engine.workerTrainerSnapshot().lastReplayGradNorm, null);
  assert.equal(f.engine.workerTrainerSnapshot().semanticClockPersisted, false);
  const originalInput = Array.from(f.input), before = Array.from(f.engine.W_hyper_u);
  const job = f.engine.dispatchWorkerTrainer(f.input);
  assert.equal(job.status, 'submitted'); assert.equal(job.targetEpoch, 1);
  f.input.fill(99); f.workers[0].reply();
  const expected = oracle(originalInput, before, 1), state = f.engine.workerTrainerSnapshot();
  assert.equal(bytes(f.engine.W_hyper_u), bytes(expected.next)); assert.equal(state.lastReplayGradNorm, expected.norm);
  assert.equal(state.applied, 1); assert.equal(state.committedEpoch, 1); assert.equal(state.workerEpochsCompleted, 1);
  assert.equal(state.pendingJobId, null); assert.equal(f.timers.size, 0);
});

test('one pending job bounds work and wrong, reordered or duplicate replies cannot advance weights or clock', () => {
  const f = fixture(); f.start(); f.engine.dispatchWorkerTrainer(f.input);
  const worker = f.workers[0], reply = worker.compute(), before = bytes(f.engine.W_hyper_u);
  assert.equal(f.engine.dispatchWorkerTrainer(f.input).status, 'busy'); assert.equal(worker.jobs.length, 1);
  for (const change of [{ jobId: reply.jobId+1 }, { generation: reply.generation+1 }, { targetEpoch: reply.targetEpoch+1 }]) {
    worker.deliver({ ...reply, ...change }); assert.equal(bytes(f.engine.W_hyper_u), before);
    assert.equal(f.engine.workerTrainerSnapshot().committedEpoch, 0);
  }
  worker.deliver(reply); const applied = bytes(f.engine.W_hyper_u);
  worker.deliver(reply); assert.equal(bytes(f.engine.W_hyper_u), applied);
  const second = f.engine.dispatchWorkerTrainer(f.input); worker.deliver(reply);
  assert.equal(f.engine.workerTrainerSnapshot().pendingJobId, second.jobId);
  worker.reply(); assert.equal(f.engine.workerTrainerSnapshot().committedEpoch, 2);
  assert.equal(f.engine.workerTrainerSnapshot().rejectedReplies, 5);
});

test('current finite target values may change while a job runs; intrinsic application ignores a shadowed set', () => {
  const f = fixture(); f.start(); f.engine.dispatchWorkerTrainer(f.input);
  f.engine.W_hyper_u.fill(0.8);
  f.engine.W_hyper_u.set = () => assert.fail('Must use captured intrinsic set');
  const expected = oracle(f.input, Array.from(f.engine.W_hyper_u), 1);
  f.workers[0].reply(); assert.equal(bytes(f.engine.W_hyper_u), bytes(expected.next));
  assert.equal(f.engine.workerTrainerSnapshot().committedEpoch, 1);
});

test('typed input snapshots do not invoke a replaced iterator and a detached in-flight target cannot be written', () => {
  const f = fixture(); f.start();
  const input = f.run('(()=>{const a=new Float32Array(16).fill(0.25);a[Symbol.iterator]=()=>{throw Error("replaced iterator called")};return a;})()');
  assert.equal(f.engine.dispatchWorkerTrainer(input).status, 'submitted');
  assert.equal(f.workers[0].jobs[0].latent16.length, 16);
  structuredClone(f.engine.W_hyper_u.buffer, { transfer: [f.engine.W_hyper_u.buffer] });
  f.workers[0].reply();
  assert.equal(f.engine.workerTrainerSnapshot().committedEpoch, 0);
  assert.equal(f.engine.workerTrainerSnapshot().phase, 'faulted'); assert.equal(f.timers.size, 0);
});

test('malformed input and invalid targets are rejected before dispatch without partial weight writes', () => {
  const inputs = ['new Float32Array(15)', 'new Float32Array(17)', 'Array(16)',
    'Array(16).fill(NaN)', 'Array(16).fill(Infinity)', 'Array(16).fill("1")',
    '(()=>{const a=Array(16).fill(1);Object.defineProperty(a,"7",{get(){throw Error("getter executed")}});return a;})()'];
  for (const expression of inputs) {
    const f = fixture(); f.start(); const before = bytes(f.engine.W_hyper_u);
    assert.equal(f.engine.dispatchWorkerTrainer(f.run(expression)).status, 'rejected', expression);
    assert.equal(bytes(f.engine.W_hyper_u), before); assert.equal(f.workers[0].jobs.length, 0); assert.equal(f.timers.size, 0);
  }
  for (const expression of ['new Float64Array(16)', 'new Float32Array(15)', 'new Float32Array(16).fill(Infinity)',
    'new Float32Array(new SharedArrayBuffer(64))', 'new Float32Array(new ArrayBuffer(64,{maxByteLength:128}))']) {
    const f = fixture(); f.start(); f.engine.W_hyper_u = f.run(expression);
    const before = bytes(f.engine.W_hyper_u);
    assert.equal(f.engine.dispatchWorkerTrainer(f.input).status, 'rejected', expression);
    assert.equal(bytes(f.engine.W_hyper_u), before); assert.equal(f.workers[0].jobs.length, 0);
  }
});

test('matching malformed replies validate every lane and result field before the single target write', () => {
  const variants = [r => ({ ...r, deltas: r.deltas.slice(0,15) }), r => ({ ...r, deltas: [...r.deltas.slice(0,15), NaN] }),
    r => ({ ...r, deltas: [...r.deltas.slice(0,15), Infinity] }), r => ({ ...r, deltas: [...r.deltas.slice(0,15), Number.MAX_VALUE] }),
    r => ({ ...r, gradNorm: NaN }), r => ({ ...r, gradNorm: -1 }), r => ({ ...r, ok: false }), r => ({ ...r, extra: true })];
  for (const corrupt of variants) {
    const f = fixture(); f.start(); f.engine.dispatchWorkerTrainer(f.input); const worker = f.workers[0], before = bytes(f.engine.W_hyper_u);
    worker.deliver(corrupt(worker.compute()));
    assert.equal(bytes(f.engine.W_hyper_u), before); const state = f.engine.workerTrainerSnapshot();
    assert.equal(state.committedEpoch, 0); assert.equal(state.phase, 'faulted'); assert.equal(state.discarded, 1);
    assert.equal(worker.terminated, true); assert.deepEqual(f.revoked, [worker.url]); assert.equal(f.timers.size, 0);
  }
});

test('target replacement, same-backing different view and later nonfinite target reject the whole reply', () => {
  for (const expression of ['new Float32Array(engine.W_hyper_u)',
    'new Float32Array(engine.W_hyper_u.buffer,engine.W_hyper_u.byteOffset,16)',
    '(()=>{engine.W_hyper_u[15]=NaN;return engine.W_hyper_u;})()']) {
    const f = fixture(); f.start(); f.engine.dispatchWorkerTrainer(f.input);
    const original = f.engine.W_hyper_u;
    f.engine.W_hyper_u = f.run(expression); const current = bytes(f.engine.W_hyper_u), originalBefore = bytes(original);
    f.workers[0].reply();
    assert.equal(bytes(f.engine.W_hyper_u), current); assert.equal(bytes(original), originalBefore);
    assert.equal(f.engine.workerTrainerSnapshot().committedEpoch, 0); assert.equal(f.engine.workerTrainerSnapshot().phase, 'faulted');
  }
});

test('suspend discards pending work; resume from a restored epoch rejects obsolete callbacks and uses the next exact epoch', () => {
  const f = fixture(); f.start(); const first = f.engine.dispatchWorkerTrainer(f.input), old = f.workers[0], handler = old.onmessage, reply = old.compute();
  const held = f.engine.suspendWorkerTrainer('checkpoint-restore');
  assert.equal(held.phase, 'suspended'); assert.equal(held.committedEpoch, 0); assert.equal(held.discarded, 1);
  assert.equal(f.timers.size, 0); assert.equal(old.terminated, true); assert.deepEqual(f.revoked, [old.url]);
  assert.equal(f.engine.dispatchWorkerTrainer(f.input).status, 'blocked');
  assert.equal(f.resume({ expectedGeneration: held.generation, committedEpoch: 40 }).status, 'ready');
  const next = f.engine.dispatchWorkerTrainer(f.input), before = bytes(f.engine.W_hyper_u);
  assert.ok(next.jobId > first.jobId); assert.equal(next.targetEpoch, 41);
  old.deliver(reply, handler); assert.equal(bytes(f.engine.W_hyper_u), before);
  const expected = oracle(f.input, Array.from(f.engine.W_hyper_u), 41);
  f.workers[1].reply(); assert.equal(bytes(f.engine.W_hyper_u), bytes(expected.next));
  assert.equal(f.engine.workerTrainerSnapshot().committedEpoch, 41);
});

test('worker error and decoding error retire only their owned worker, preserve epoch, and allow explicit recovery', () => {
  for (const kind of ['error', 'messageError']) {
    const f = fixture(); f.start(); f.engine.dispatchWorkerTrainer(f.input);
    const old = f.workers[0], oldError = old.onerror, before = bytes(f.engine.W_hyper_u);
    old[kind](); assert.equal(bytes(f.engine.W_hyper_u), before); assert.equal(f.engine.workerTrainerSnapshot().phase, 'faulted');
    assert.equal(f.timers.size, 0); assert.deepEqual(f.revoked, [old.url]);
    assert.equal(f.resume().status, 'ready'); const current = f.workers[1];
    oldError({ message: 'late old error', preventDefault() {} });
    assert.equal(current.terminated, false); assert.equal(f.engine.workerTrainerSnapshot().active, true);
    assert.equal(f.engine.dispatchWorkerTrainer(f.input).targetEpoch, 1); current.reply();
    assert.equal(f.engine.workerTrainerSnapshot().committedEpoch, 1);
  }
});

test('bounded stall timeout discards without learning or automatic retries; explicit resume recovers', () => {
  const f = fixture(); f.start(); f.engine.dispatchWorkerTrainer(f.input);
  const before = bytes(f.engine.W_hyper_u), old = f.workers[0], handler = old.onmessage, reply = old.compute();
  f.advance(4999); assert.equal(f.engine.workerTrainerSnapshot().phase, 'training');
  f.advance(1); const state = f.engine.workerTrainerSnapshot();
  assert.equal(state.phase, 'faulted'); assert.equal(state.timeouts, 1); assert.equal(state.committedEpoch, 0);
  assert.equal(old.terminated, true); assert.equal(f.timers.size, 0); assert.equal(bytes(f.engine.W_hyper_u), before);
  f.advance(60000); assert.equal(f.workers.length, 1);
  old.deliver(reply, handler); assert.equal(bytes(f.engine.W_hyper_u), before);
  f.resume(); f.engine.dispatchWorkerTrainer(f.input); f.workers[1].reply();
  assert.equal(f.engine.workerTrainerSnapshot().committedEpoch, 1);
});

test('creation and dispatch failures clean owned URLs and timers without counting discarded jobs as trained', () => {
  for (const kind of ['blobFailure', 'urlFailure', 'constructorFailure', 'postFailure']) {
    const options = { [kind]: true }, f = fixture(options), start = f.start();
    if (kind === 'postFailure') assert.equal(f.engine.dispatchWorkerTrainer(f.input).status, 'failed'); else assert.equal(start.status, 'failed');
    assert.equal(f.engine.workerTrainerSnapshot().committedEpoch, 0); assert.equal(f.engine.workerTrainerSnapshot().active, false);
    assert.equal(f.timers.size, 0); assert.equal(f.revoked.length, kind === 'constructorFailure' || kind === 'postFailure' ? 1 : 0);
    options[kind] = false; assert.equal(f.resume().status, 'ready');
    f.engine.dispatchWorkerTrainer(f.input); f.workers.at(-1).reply(); assert.equal(f.engine.workerTrainerSnapshot().committedEpoch, 1);
  }
});

test('resume validates clock/generation/options; disposal is terminal and telemetry cannot change private authority', () => {
  const f = fixture(); f.start();
  assert.equal(f.resume({ committedEpoch: 9 }).status, 'blocked');
  const held = f.engine.suspendWorkerTrainer();
  for (const options of [{ committedEpoch: -1 }, { committedEpoch: -0 }, { committedEpoch: NaN }, { committedEpoch: Number.MAX_SAFE_INTEGER },
    { expectedGeneration: held.generation-1 }, { timeoutMs: 49 }, { timeoutMs: 30001 }, { unknown: true }]) {
    assert.equal(f.resume(options).status, 'blocked'); assert.equal(f.engine.workerTrainerSnapshot().committedEpoch, 0);
  }
  f.engine.workerTrainerStatus = { active: true, committedEpoch: 999, generation: 999 };
  assert.equal(f.engine.workerTrainerSnapshot().committedEpoch, 0); assert.equal(f.engine.dispatchWorkerTrainer(f.input).status, 'blocked');
  f.resume({ committedEpoch: 12, timeoutMs: 50 }); f.engine.dispatchWorkerTrainer(f.input);
  const disposed = f.engine.disposeWorkerTrainer('shutdown'); assert.equal(disposed.phase, 'disposed');
  assert.equal(disposed.committedEpoch, 12); assert.equal(f.timers.size, 0); assert.equal(f.resume().status, 'blocked');
  assert.equal(f.engine.dispatchWorkerTrainer(f.input).status, 'blocked');
});

test('closing and restore flags block submission and late application even before lifecycle hooks retire the worker', () => {
  for (const flag of ['__alivePersistenceClosing', '__aliveCheckpointRestore']) {
    const f = fixture(); f.start(); f.engine.dispatchWorkerTrainer(f.input); const before = bytes(f.engine.W_hyper_u);
    f.context[flag] = true; f.workers[0].reply();
    assert.equal(bytes(f.engine.W_hyper_u), before); assert.equal(f.engine.workerTrainerSnapshot().committedEpoch, 0);
    assert.equal(f.engine.dispatchWorkerTrainer(f.input).status, 'blocked'); assert.equal(f.resume().status, 'blocked');
    f.engine.suspendWorkerTrainer('admission-closed'); assert.equal(f.timers.size, 0);
  }
});

test('actual worker rejects malformed input instead of computing a missing-lane default update', () => {
  const f = fixture(); f.start(); const worker = f.workers[0];
  for (const bad of [Array(16), Array(15).fill(1), Array(16).fill(Infinity)]) {
    const input = worker.clone({ cmd: 'train_shard', generation: 1, jobId: 1, targetEpoch: 1, latent16: bad });
    worker.realm.self.onmessage({ data: input });
  }
  assert.equal(worker.outputs.length, 0);
});

test('unavailable Worker is reported truthfully and the actual frame dispatch uses the bounded method', () => {
  const f = fixture({ unavailable: true }); assert.equal(f.start().status, 'unavailable');
  assert.equal(f.engine.workerTrainerSnapshot().active, false); assert.equal(f.engine.workerTrainerSnapshot().applied, 0);
  const from = source.indexOf('      // Dispatch off-main-thread WebWorker shard training'), to = source.indexOf('      // Sync binary .gchad', from);
  assert.ok(from > 0 && to > from);
  const dispatch = new vm.Script('(function(frameCount,z){' + source.slice(from,to) + '})').runInContext(f.context);
  const calls = []; f.engine.dispatchWorkerTrainer = value => calls.push(Array.from(value));
  dispatch.call(f.engine, 29, f.input); assert.equal(calls.length, 0);
  dispatch.call(f.engine, 30, f.input); assert.deepEqual(calls, [Array.from(f.input)]);
});
