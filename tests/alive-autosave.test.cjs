'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { install } = require('../systems/alive-autosave.js');

function target() {
  const listeners = new Map();
  return { hidden: false,
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn); },
    emit(name) { for (const fn of listeners.get(name) || []) fn(); },
    listenerCount() { return Array.from(listeners.values()).reduce((sum, set) => sum + set.size, 0); }
  };
}
function fixture({ idle = true, save, debounceMs = 750, extra = {} } = {}) {
  let clock = 0, nextId = 0;
  const timers = new Map(), idleCallbacks = new Map(), writes = [], window = target(), document = target();
  const runtime = { value: 1, savePersistentGenome: save || function (...args) { writes.push({ value: this.value, args }); clock += 3; } };
  const original = runtime.savePersistentGenome;
  const options = { now: () => clock, window, document, debounceMs,
    setTimer(fn, ms) { const id = ++nextId; timers.set(id, { fn, due: clock + ms }); return id; },
    clearTimer(id) { timers.delete(id); },
    requestIdleCallback: idle ? function (fn) { const id = ++nextId; idleCallbacks.set(id, fn); return id; } : null,
    cancelIdleCallback(id) { idleCallbacks.delete(id); },
    ...extra
  };
  const api = install(runtime, options);
  function advance(ms) {
    const until = clock + ms;
    for (;;) {
      const next = Array.from(timers).sort((a, b) => a[1].due - b[1].due).find(([, timer]) => timer.due <= until);
      if (!next) break;
      const [id, timer] = next; timers.delete(id); clock = Math.max(clock, timer.due); timer.fn();
    }
    clock = Math.max(clock, until);
  }
  function runIdle(remaining = 10) {
    for (const [id, fn] of Array.from(idleCallbacks)) { idleCallbacks.delete(id); fn({ didTimeout: false, timeRemaining: () => remaining }); }
  }
  return { api, runtime, original, options, writes, timers, idleCallbacks, advance, runIdle, window, document };
}

test('background requests coalesce asynchronously and export latest runtime state at flush time', () => {
  const f = fixture();
  for (let i = 0; i < 10; i++) f.runtime.savePersistentGenome(i);
  f.runtime.value = 42;
  assert.equal(f.writes.length, 0);
  assert.equal(f.api.snapshot().pending, true);
  assert.equal(f.api.snapshot().coalescedRequests, 9);
  f.advance(750);
  assert.equal(f.writes.length, 0);
  assert.equal(f.idleCallbacks.size, 1);
  f.runIdle();
  assert.deepEqual(f.writes, [{ value: 42, args: [9] }]);
  assert.equal(f.api.snapshot().pending, false);
  assert.equal(f.api.snapshot().lastDurationMs, 3);
  assert.equal(f.api.snapshot().lastOutcome, 'returned-unverified');
  assert.equal(f.api.snapshot().persistenceVerified, false);
  assert.equal(f.timers.size, 0);
});

test('repeated requests cannot move the two-second deadline', () => {
  const f = fixture();
  f.runtime.savePersistentGenome();
  for (let i = 1; i <= 3; i++) { f.advance(600); f.runtime.value = i; f.runtime.savePersistentGenome(); }
  assert.equal(f.api.snapshot().deadlineAt, 2000);
  assert.equal(f.writes.length, 0);
  f.advance(200);
  assert.deepEqual(f.writes.map(write => write.value), [3]);
  assert.equal(f.api.snapshot().lastReason, 'deadline');
  assert.equal(f.timers.size, 0);
  assert.equal(f.idleCallbacks.size, 0);
});

test('a starved or unusable idle callback still flushes at the deadline', () => {
  for (const callIdle of [false, true]) {
    const f = fixture();
    f.runtime.savePersistentGenome(); f.advance(750);
    if (callIdle) f.runIdle(0);
    f.advance(1250);
    assert.equal(f.writes.length, 1);
    assert.equal(f.api.snapshot().lastReason, 'deadline');
  }
});

test('without requestIdleCallback the debounce timer flushes normally', () => {
  const f = fixture({ idle: false });
  f.runtime.savePersistentGenome(); f.advance(749);
  assert.equal(f.writes.length, 0);
  f.advance(1);
  assert.equal(f.writes.length, 1);
  assert.equal(f.api.snapshot().lastReason, 'debounce');
});

test('hidden, pagehide, and beforeunload events synchronously export current state and clear queued work', () => {
  const f = fixture();
  f.runtime.savePersistentGenome(); f.runtime.value = 2;
  f.document.emit('visibilitychange');
  assert.equal(f.writes.length, 0);
  f.document.hidden = true; f.document.emit('visibilitychange');
  assert.deepEqual(f.writes.map(write => write.value), [2]);
  f.runtime.value = 3; f.runtime.savePersistentGenome(); f.window.emit('pagehide');
  f.runtime.value = 4; f.runtime.savePersistentGenome(); f.window.emit('beforeunload');
  assert.deepEqual(f.writes.map(write => write.value), [2, 3, 4]);
  assert.equal(f.api.snapshot().pending, false);
  assert.equal(f.timers.size, 0);
});

test('cancel invalidates queued callbacks and dispose restores the original and removes event listeners', () => {
  const f = fixture();
  f.runtime.savePersistentGenome(); f.advance(750);
  const staleIdle = Array.from(f.idleCallbacks.values())[0];
  f.api.cancel();
  assert.equal(f.timers.size, 0);
  assert.equal(f.idleCallbacks.size, 0);
  f.runtime.savePersistentGenome();
  staleIdle({ timeRemaining: () => 50 });
  assert.equal(f.writes.length, 0);
  assert.equal(f.api.snapshot().pending, true);
  f.api.dispose({ flushPending: false });
  assert.equal(f.runtime.savePersistentGenome, f.original);
  assert.equal(f.window.listenerCount() + f.document.listenerCount(), 0);
  assert.equal(f.timers.size, 0);
  assert.equal(f.api.request(), false);
  f.window.emit('pagehide');
  assert.equal(f.writes.length, 0);
});

test('reentrant save requests never recurse and retain one later export of latest state', () => {
  let calls = 0, depth = 0, maxDepth = 0;
  const f = fixture({ idle: false, save() {
    depth++; maxDepth = Math.max(maxDepth, depth); calls++;
    if (calls === 1) { this.value = 2; this.savePersistentGenome(); this.savePersistentGenome(); }
    depth--;
  } });
  f.api.flush();
  assert.equal(calls, 1);
  assert.equal(f.api.snapshot().pending, true);
  f.advance(750);
  assert.equal(calls, 2);
  assert.equal(maxDepth, 1);
  assert.equal(f.api.snapshot().pending, false);
});

test('save failures are reported without fabricated persistence success or automatic retry loops', () => {
  const f = fixture({ save() { throw new Error('storage full'); } });
  const result = f.api.flush();
  assert.equal(result.status, 'failed');
  assert.equal(result.persistenceVerified, false);
  assert.equal(f.api.snapshot().lastError, 'storage full');
  assert.equal(f.api.snapshot().pending, false);
  assert.equal(f.timers.size, 0);
});

test('installation is idempotent and original false results remain reported failures', () => {
  const f = fixture({ save() { return false; } });
  assert.equal(install(f.runtime, f.options), f.api);
  assert.equal(f.window.listenerCount() + f.document.listenerCount(), 3);
  assert.equal(f.api.flush().status, 'reported-failure');
});

const codec = require('../systems/alive-genome-codec.js');
function workerFixture({ workerTimeoutMs = 100, storageOverride = {}, workerOptions = {}, ...settings } = {}) {
  const workers = [], stored = new Map(), commits = [];
  const storage = { setItem(key, value) { stored.set(key, value); commits.push(value); }, getItem(key) { return stored.get(key) ?? null; }, ...storageOverride };
  const f = fixture({ idle: false, ...settings, extra: {
    codec, storage, storageKey: 'genome', workerURL: 'codec-worker.js',
    structuredClone() { throw new Error('Autosave must let postMessage make the only snapshot'); },
    workerTimeoutMs,
    capture() { return { value: this.value, weights: codec.numericArray(this.weights, 4), nested: this.nested }; },
    createWorker(url) {
      if (workerOptions.constructorError) throw new Error('worker unavailable');
      const worker = { url, messages: [], terminated: false, onmessage: null, onerror: null,
        postMessage(message, transfer) {
          if (workerOptions.postError) throw new Error('post failed');
          const received = structuredClone(message, { transfer });
          this.messages.push({ source: message, received, transfer, argumentCount: arguments.length });
        },
        terminate() { this.terminated = true; },
        succeed(index = this.messages.length - 1) {
          const { id, payload } = this.messages[index].received;
          let data;
          try { codec.assertIsolatedSnapshot(payload); data = { id, json: codec.encode(payload), serializationMs: 12.5 }; }
          catch (error) { data = { id, error: String(error.message).slice(0, 300), serializationMs: 12.5 }; }
          this.onmessage?.({ data });
        },
        fail() { this.onerror?.({ message: 'worker crashed', preventDefault() {} }); }
      };
      workers.push(worker); return worker;
    },
    ...settings.extra
  } });
  f.runtime.weights = new Float64Array([1.234567, -0.00001]);
  f.runtime.nested = { sequence: [1, 2], label: 'first' };
  return { ...f, workers, storage, stored, commits };
}

test('worker save snapshots the whole graph once through direct postMessage without transferring live buffers', async () => {
  const f = workerFixture();
  const liveBuffer = f.runtime.weights.buffer;
  const promise = f.api.flush('probe-verification');
  assert.equal(typeof promise.then, 'function');
  assert.equal(f.api.snapshot().flushing, true);
  assert.equal(f.api.snapshot().persistenceVerified, false);
  assert.equal(f.commits.length, 0);
  const message = f.workers[0].messages[0];
  assert.equal(message.argumentCount, 1, 'no transfer list or extra clone is used');
  assert.equal(message.transfer, undefined);
  assert.equal(message.source.payload.weights.values.buffer, liveBuffer, 'transport receives the original model buffer');
  assert.notEqual(message.received.payload.weights.values.buffer, liveBuffer, 'transport snapshots into an isolated buffer');
  assert.equal(liveBuffer.byteLength, 16, 'live model buffer remains attached');
  f.runtime.value = 9; f.runtime.weights[0] = 8; f.runtime.nested.sequence[0] = 7;
  f.advance(20);
  f.workers[0].succeed();
  const result = await promise;
  assert.equal(result.status, 'persisted');
  assert.equal(result.persistenceVerified, true);
  assert.deepEqual(JSON.parse(f.stored.get('genome')), { value: 1, weights: [1.2346, 0], nested: { sequence: [1, 2], label: 'first' } });
  assert.equal(f.api.snapshot().workerFlushes, 1);
  assert.equal(f.api.snapshot().verifiedWrites, 1);
  assert.equal(f.api.snapshot().workerMode, 'worker');
  assert.equal(f.api.snapshot().fallbackCount, 0);
  assert.equal(f.api.snapshot().lastSerializationMs, 12.5);
  assert.equal(f.api.snapshot().lastRoundTripMs, 20);
  assert.equal(f.api.snapshot().lastDurationMs, 0, 'worker wait is not counted as host execution');
  assert.equal(f.api.snapshot().flushing, false);
  f.api.dispose({ flushPending: false });
});

test('many requests during serialization retain one bounded later snapshot of latest state', async () => {
  const f = workerFixture();
  const first = f.api.flush();
  for (let i = 2; i <= 15; i++) { f.runtime.value = i; f.runtime.savePersistentGenome(); }
  assert.equal(f.workers.length, 1);
  assert.equal(f.workers[0].messages.length, 1);
  assert.equal(f.api.snapshot().pending, true);
  assert.equal(f.api.snapshot().coalescedRequests, 13);
  f.workers[0].succeed(); await first;
  f.advance(750);
  assert.equal(f.workers[0].messages.length, 2);
  assert.equal(f.workers[0].messages[1].received.payload.value, 15);
  f.workers[0].succeed();
  assert.deepEqual(f.commits.map(x => JSON.parse(x).value), [1, 15]);
  assert.equal(f.api.snapshot().pending, false);
  assert.equal(f.timers.size, 0);
  f.api.dispose({ flushPending: false });
});

test('an explicit flush during flight awaits the requested latest snapshot without parallel work', async () => {
  const f = workerFixture();
  const first = f.api.flush();
  f.runtime.value = 8;
  const latest = f.api.flush('probe-verification');
  assert.equal(f.workers[0].messages.length, 1);
  f.workers[0].succeed(); await first; await Promise.resolve();
  assert.equal(f.workers[0].messages.length, 2);
  let settled = false; latest.then(() => { settled = true; });
  await Promise.resolve(); assert.equal(settled, false);
  f.workers[0].succeed();
  assert.equal((await latest).persistenceVerified, true);
  assert.equal(JSON.parse(f.stored.get('genome')).value, 8);
  f.api.dispose({ flushPending: false });
});

test('lifecycle final saves synchronously capture latest state and fence the old worker result', async () => {
  for (const event of ['pagehide', 'beforeunload', 'visibilitychange', 'dispose']) {
    const f = workerFixture();
    const previous = f.api.flush();
    const worker = f.workers[0], oldHandler = worker.onmessage, oldMessage = worker.messages[0].received;
    f.runtime.value = 42; f.runtime.weights[0] = 4.22222;
    if (event === 'visibilitychange') { f.document.hidden = true; f.document.emit(event); }
    else if (event === 'dispose') f.api.dispose();
    else f.window.emit(event);
    assert.equal(worker.terminated, true);
    assert.equal(JSON.parse(f.stored.get('genome')).value, 42);
    assert.equal((await previous).status, 'cancelled');
    oldHandler({ data: { id: oldMessage.id, json: codec.encode(oldMessage.payload), serializationMs: 1 } });
    assert.equal(f.commits.length, 1);
    assert.equal(f.api.snapshot().persistenceVerified, true);
    assert.equal(f.api.snapshot().flushing, false);
    f.api.dispose({ flushPending: false });
  }
});

test('cancel after checkpoint restore prevents an old write and permits a fresh worker save', async () => {
  const f = workerFixture();
  const old = f.api.flush();
  const staleWorker = f.workers[0], staleHandler = staleWorker.onmessage, stale = staleWorker.messages[0].received;
  f.runtime.value = 99;
  f.runtime.weights[0] = 2.5;
  f.api.cancel('checkpoint-restore');
  f.runtime.savePersistentGenome();
  f.advance(750);
  assert.equal(staleWorker.terminated, true);
  assert.equal(f.workers.length, 2);
  staleHandler({ data: { id: stale.id, json: codec.encode(stale.payload), serializationMs: 8 } });
  assert.equal(f.commits.length, 0);
  f.workers[1].succeed();
  assert.equal((await old).status, 'cancelled');
  assert.equal(JSON.parse(f.stored.get('genome')).value, 99);
  assert.equal(f.api.snapshot().fallbackCount, 0);
  f.api.dispose({ flushPending: false });
});

test('cancel also fences a waiting explicit flush continuation', async () => {
  const f = workerFixture();
  const first = f.api.flush(), next = f.api.flush('latest');
  f.api.cancel();
  assert.equal((await first).status, 'cancelled');
  assert.equal((await next).status, 'cancelled');
  assert.equal(f.api.snapshot().pending, false);
  assert.equal(f.workers.length, 1);
  assert.equal(f.commits.length, 0);
  assert.equal(f.timers.size, 0);
  f.api.dispose({ flushPending: false });
});

test('worker failure falls back once using latest coherent state and disables further worker submissions', async () => {
  for (const kind of ['error', 'timeout', 'constructor', 'post', 'invalid-response', 'encoding-error']) {
    const f = workerFixture({ workerOptions: { constructorError: kind === 'constructor', postError: kind === 'post' } });
    const promise = f.api.flush();
    if (kind === 'error' || kind === 'timeout' || kind === 'invalid-response' || kind === 'encoding-error') {
      f.runtime.value = 7;
      if (kind === 'error') f.workers[0].fail();
      if (kind === 'timeout') f.advance(100);
      if (kind === 'invalid-response') f.workers[0].onmessage({ data: { id: f.api.snapshot().inFlightId, json: null } });
      if (kind === 'encoding-error') f.workers[0].onmessage({ data: { id: f.api.snapshot().inFlightId, error: 'serializer failed' } });
    }
    assert.equal((await promise).persistenceVerified, true, kind);
    assert.equal(f.api.snapshot().workerMode, 'failed-sync', kind);
    assert.equal(f.api.snapshot().fallbackCount, 1, kind);
    assert.ok(f.api.snapshot().lastFallbackReason, kind);
    assert.equal(f.api.snapshot().flushing, false, kind);
    assert.equal(f.timers.size, 0, kind);
    const submissions = f.api.snapshot().workerFlushes;
    f.runtime.value = 10;
    assert.equal((await f.api.flush()).persistenceVerified, true);
    assert.equal(f.api.snapshot().workerFlushes, submissions);
    assert.equal(f.api.snapshot().fallbackCount, 1);
    assert.equal(JSON.parse(f.stored.get('genome')).value, 10);
    f.api.dispose({ flushPending: false });
  }
});

test('storage failure and mismatched readback never claim persistence or cause serialization retries', async () => {
  for (const override of [{ setItem() { throw new Error('quota exceeded'); } }, { getItem() { return 'stale'; } }]) {
    const f = workerFixture({ storageOverride: override });
    const promise = f.api.flush(); f.workers[0].succeed();
    const result = await promise;
    assert.equal(result.persistenceVerified, false);
    assert.ok(['failed', 'verification-failed'].includes(result.status));
    assert.equal(f.api.snapshot().verifiedWrites, 0);
    assert.equal(f.api.snapshot().fallbackCount, 0);
    assert.equal(f.api.snapshot().pending, false);
    assert.equal(f.api.snapshot().flushing, false);
    assert.equal(f.timers.size, 0);
    f.api.dispose({ flushPending: false });
  }
});

test('capture errors resolve failed, do not write a partial genome, and do not retry in a loop', async () => {
  const f = workerFixture({ extra: { capture() { throw new Error('cannot capture'); } } });
  const result = await f.api.flush();
  assert.equal(result.status, 'failed');
  assert.equal(result.persistenceVerified, false);
  assert.equal(f.commits.length, 0);
  assert.equal(f.api.snapshot().fallbackCount, 1);
  assert.equal(f.api.snapshot().flushing, false);
  assert.equal(f.timers.size, 0);
  f.api.dispose({ flushPending: false });
});

test('payload mode without an available worker performs a synchronous verified save', () => {
  const f = workerFixture({ extra: { workerURL: null } });
  const result = f.api.flush();
  assert.equal(result.status, 'persisted');
  assert.equal(result.persistenceVerified, true);
  assert.equal(f.api.snapshot().workerMode, 'sync');
  assert.equal(f.workers.length, 0);
  f.api.dispose({ flushPending: false });
});

test('direct postMessage preserves typed-view aliases within the copy and never detaches live aliases', async () => {
  const f = workerFixture({ extra: { capture() {
    return { one: codec.numericArray(this.weights, 4), two: codec.numericArray(this.weights.subarray(1), 6) };
  } } });
  const first = f.api.flush();
  const message = f.workers[0].messages[0];
  assert.equal(message.transfer, undefined);
  assert.equal(message.received.payload.one.values.buffer, message.received.payload.two.values.buffer);
  assert.notEqual(message.received.payload.one.values.buffer, f.runtime.weights.buffer);
  assert.equal(f.runtime.weights.byteLength, 16);
  f.workers[0].succeed(); await first;
  assert.deepEqual(JSON.parse(f.stored.get('genome')), { one: [1.2346, 0], two: [-0.00001] });
  f.api.dispose({ flushPending: false });
});

test('a late worker completion after timeout cannot overwrite a newer fallback save', async () => {
  const f = workerFixture();
  const first = f.api.flush();
  const stale = f.workers[0].messages[0].received, handler = f.workers[0].onmessage;
  f.runtime.value = 2;
  f.advance(100);
  assert.equal((await first).status, 'persisted');
  f.runtime.value = 3;
  await f.api.flush();
  handler({ data: { id: stale.id, json: codec.encode(stale.payload), serializationMs: 2 } });
  assert.equal(f.commits.length, 2);
  assert.equal(JSON.parse(f.stored.get('genome')).value, 3);
  assert.equal(f.api.snapshot().fallbackCount, 1);
  f.api.dispose({ flushPending: false });
});

test('shared memory is rejected as an isolated async snapshot and falls back synchronously', async () => {
  const f = workerFixture();
  f.runtime.weights = new Float64Array(new SharedArrayBuffer(16));
  f.runtime.weights.set([1.25, 2.5]);
  const promise = f.api.flush();
  assert.equal(f.workers.length, 1);
  assert.equal(f.commits.length, 0, 'shared worker result cannot be committed');
  f.runtime.weights.set([3.75, 4.5]);
  f.workers[0].succeed();
  assert.equal((await promise).status, 'persisted');
  assert.equal(f.workers[0].terminated, true);
  assert.equal(f.api.snapshot().workerMode, 'failed-sync');
  assert.match(f.api.snapshot().lastFallbackReason, /isolated worker snapshot/);
  assert.deepEqual(JSON.parse(f.stored.get('genome')).weights, [3.75, 4.5], 'fallback captures the current model');
  f.runtime.weights.set([6, 7]);
  await f.api.flush();
  assert.equal(f.workers.length, 1, 'failed worker mode is not retried');
  assert.equal(f.api.snapshot().fallbackCount, 1);
  assert.deepEqual(JSON.parse(f.stored.get('genome')).weights, [6, 7]);
  f.api.dispose({ flushPending: false });
});

test('a graph that cannot be posted falls back once without detaching buffers or leaving a pending job', async () => {
  const f = workerFixture();
  f.runtime.nested.callback = () => {};
  const result = await f.api.flush();
  assert.equal(result.status, 'persisted', 'legacy JSON can omit an uncloneable function');
  assert.equal(f.runtime.weights.byteLength, 16);
  assert.equal(f.api.snapshot().fallbackCount, 1);
  assert.equal(f.api.snapshot().flushing, false);
  assert.equal(f.timers.size, 0);
  assert.equal(f.workers[0].messages.length, 0);
  assert.equal(f.workers[0].terminated, true);
  f.api.dispose({ flushPending: false });
});

test('cyclic data copies safely but worker and fallback encoding fail without false persistence or retries', async () => {
  const f = workerFixture();
  f.runtime.nested.self = f.runtime.nested;
  const promise = f.api.flush();
  const received = f.workers[0].messages[0].received.payload.nested;
  assert.equal(received.self, received, 'structured cloning supports cycles');
  f.workers[0].succeed();
  const result = await promise;
  assert.equal(result.status, 'failed');
  assert.equal(result.persistenceVerified, false);
  assert.match(result.error, /circular|cyclic/i);
  assert.equal(f.api.snapshot().fallbackCount, 1);
  assert.equal(f.api.snapshot().workerMode, 'failed-sync');
  assert.equal(f.api.snapshot().flushing, false);
  assert.equal(f.api.snapshot().pending, false);
  assert.equal(f.timers.size, 0);
  assert.equal(f.commits.length, 0);
  f.api.dispose({ flushPending: false });
});

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function microtasks() { for (let i = 0; i < 8; i++) await Promise.resolve(); }
function durableFixture({ worker = true, commitHook, ...settings } = {}) {
  const commits = [], fences = [];
  const durableStorage = {
    commit(request) {
      const job = { ...request, ...deferred() };
      commits.push(job);
      commitHook?.();
      return job.promise;
    },
    fence(request) { const job = { ...request, ...deferred() }; fences.push(job); return job.promise; }
  };
  const f = workerFixture({ ...settings,
    storageOverride: { setItem() { throw Error('Durable mode must never write legacy storage'); }, getItem() { throw Error('Durable mode must never read legacy storage'); } },
    extra: { ...settings.extra, durableStorage, ...(!worker ? { workerURL: null } : {}) }
  });
  return { ...f, commits, fences,
    persisted(index = commits.length - 1) { const job = commits[index]; job.resolve({ status: 'persisted', persistenceVerified: true, epoch: job.epoch, jobId: job.jobId }); },
    fenced(index = fences.length - 1) { const job = fences[index]; job.resolve({ settled: true, epoch: job.epoch }); }
  };
}

test('durable storage remains owned until commit and readback settle and wait time is not renderer CPU', async () => {
  let f;
  f = durableFixture({ worker: false, commitHook: () => f.advance(3) });
  const promise = f.api.flush();
  assert.equal(f.api.snapshot().storageMode, 'async-main');
  assert.equal(f.api.snapshot().phase, 'committing');
  assert.equal(f.api.snapshot().flushing, true);
  assert.equal(f.api.snapshot().verifiedWrites, 0);
  assert.equal(f.commits[0].epoch, 0);
  assert.equal(JSON.parse(f.commits[0].json).value, 1);
  f.advance(997);
  let settled = false; promise.then(() => { settled = true; });
  await microtasks(); assert.equal(settled, false);
  f.persisted();
  const result = await promise;
  assert.equal(result.status, 'persisted'); assert.equal(result.persistenceVerified, true);
  assert.equal(result.commitDispatchMs, 3); assert.equal(result.durationMs, 3);
  assert.equal(result.asyncCommitLatencyMs, 1000);
  assert.equal(f.api.snapshot().lastAsyncCommitLatencyMs, 1000);
  assert.equal(f.api.snapshot().verifiedWrites, 1);
  assert.equal(f.api.snapshot().flushing, false);
  assert.equal(f.stored.size, 0); assert.equal(f.writes.length, 0);
});

test('durable saves coalesce across serialization and storage while explicit latest flush awaits its own snapshot', async () => {
  const f = durableFixture();
  const first = f.api.flush();
  f.runtime.value = 2; f.api.request();
  f.workers[0].succeed();
  for (let value = 3; value <= 12; value++) { f.runtime.value = value; f.api.request(); }
  const latest = f.api.flush('latest');
  assert.equal(f.workers[0].messages.length, 1); assert.equal(f.commits.length, 1);
  f.advance(5000);
  assert.equal(f.api.snapshot().fallbackCount, 0, 'serializer deadline is cleared before async storage');
  assert.equal(f.commits.length, 1); assert.equal(f.api.snapshot().flushing, true);
  f.persisted(0); await first; await microtasks();
  assert.equal(f.workers[0].messages.length, 2);
  assert.equal(f.workers[0].messages[1].received.payload.value, 12);
  let latestSettled = false; latest.then(() => { latestSettled = true; });
  f.workers[0].succeed(); await microtasks();
  assert.equal(latestSettled, false);
  assert.deepEqual(f.commits.map(job => JSON.parse(job.json).value), [1, 12]);
  f.persisted(1); assert.equal((await latest).persistenceVerified, true);
  assert.equal(f.api.snapshot().pending, false); assert.equal(f.api.snapshot().flushing, false);
});

test('duplicate serializer replies and late worker errors cannot resubmit an owned durable commit', async () => {
  const f = durableFixture();
  const promise = f.api.flush(), worker = f.workers[0];
  worker.succeed(); worker.succeed(); worker.fail();
  f.advance(1000);
  assert.equal(f.commits.length, 1);
  assert.equal(f.api.snapshot().fallbackCount, 0);
  assert.equal(f.api.snapshot().phase, 'committing');
  f.persisted(); await promise;
  worker.succeed(); worker.fail();
  assert.equal(f.commits.length, 1); assert.equal(f.api.snapshot().verifiedWrites, 1);
});

test('durable cancel closes admission until both the fence and physical commit settle before explicit resume', async () => {
  const f = durableFixture();
  const first = f.api.flush(), worker = f.workers[0], staleHandler = worker.onmessage;
  const stale = worker.messages[0].received;
  worker.succeed();
  const waitingLatest = f.api.flush('latest');
  const drain = f.api.cancelAndDrain('checkpoint-restore');
  assert.equal(worker.terminated, true);
  assert.equal(f.api.snapshot().epoch, 1);
  assert.equal(f.api.snapshot().admissionClosed, true);
  assert.equal(f.api.request(), false); assert.equal(f.api.flush().status, 'blocked'); assert.equal(f.api.resume(), false);
  f.fenced();
  let drained = false; drain.then(() => { drained = true; });
  await microtasks(); assert.equal(drained, false);
  assert.equal(f.api.snapshot().flushing, true);
  f.persisted();
  assert.equal((await drain).settled, true);
  assert.equal((await first).status, 'cancelled'); assert.equal((await waitingLatest).status, 'cancelled');
  assert.equal(f.api.snapshot().verifiedWrites, 0, 'superseded receipt does not claim the restored generation');
  assert.equal(f.api.snapshot().admissionClosed, true); assert.equal(f.api.request(), false);
  assert.equal(f.api.resume(), true);
  f.runtime.value = 99;
  const restored = f.api.flush('checkpoint-restored');
  assert.equal(f.workers.length, 2);
  staleHandler({ data: { id: stale.id, json: codec.encode(stale.payload), serializationMs: 1 } });
  assert.equal(f.commits.length, 1, 'retired serializer cannot write after the barrier');
  f.workers[1].succeed();
  assert.equal(f.commits[1].epoch, 1); assert.equal(JSON.parse(f.commits[1].json).value, 99);
  f.persisted(1); assert.equal((await restored).persistenceVerified, true);
  assert.equal(f.api.snapshot().verifiedWrites, 1);
});

test('cancelled durable serialization produces no write and a failed fence stays closed until a manual retry settles', async () => {
  const f = durableFixture();
  const save = f.api.flush(), worker = f.workers[0], handler = worker.onmessage, message = worker.messages[0].received;
  const drain = f.api.cancel();
  handler({ data: { id: message.id, json: codec.encode(message.payload), serializationMs: 1 } });
  assert.equal(f.commits.length, 0); assert.equal(f.api.resume(), false);
  f.fences[0].reject(Error('durable owner unavailable'));
  assert.equal((await drain).settled, false);
  assert.equal((await save).status, 'cancelled');
  assert.equal(f.api.snapshot().lastOutcome, 'failed'); assert.match(f.api.snapshot().lastError, /owner unavailable/);
  assert.equal(f.api.resume(), false); assert.equal(f.api.request(), false);
  f.advance(10000); assert.equal(f.fences.length, 1, 'fence failure does not retry in a loop');
  const retry = f.api.cancelAndDrain('manual retry');
  assert.equal(f.fences.length, 2); f.fenced(1);
  assert.equal((await retry).settled, true); assert.equal(f.api.resume(), true);
});

test('durable failures and wrong readback identity never become verified saves or serialization retries', async () => {
  for (const failure of ['reject', 'quota', 'readback', 'identity', 'unverified']) {
    const f = durableFixture();
    const save = f.api.flush(); f.workers[0].succeed();
    if (failure === 'reject') f.commits[0].reject(Error('readback failed'));
    else if (failure === 'quota') f.commits[0].resolve({ status: 'failed', persistenceVerified: false, error: 'quota exceeded' });
    else if (failure === 'readback') f.commits[0].resolve({ status: 'verification-failed', persistenceVerified: false, error: 'readback mismatch' });
    else if (failure === 'identity') f.commits[0].resolve({ status: 'persisted', persistenceVerified: true, epoch: 99 });
    else f.commits[0].resolve({ status: 'persisted', persistenceVerified: false });
    const outcome = await save;
    assert.equal(outcome.persistenceVerified, false, failure);
    assert.ok(['failed', 'verification-failed'].includes(outcome.status), failure);
    assert.ok(f.api.snapshot().lastError, failure);
    assert.equal(f.api.snapshot().verifiedWrites, 0); assert.equal(f.api.snapshot().fallbackCount, 0);
    assert.equal(f.api.snapshot().flushing, false);
    f.advance(10000); assert.equal(f.commits.length, 1);
  }
});

test('serializer failure may encode on the host but durable mode never falls back to a legacy write', async () => {
  const f = durableFixture();
  const save = f.api.flush(); f.runtime.value = 7; f.workers[0].fail();
  assert.equal(f.api.snapshot().fallbackCount, 1);
  assert.equal(f.api.snapshot().storageMode, 'async-main');
  assert.equal(f.api.snapshot().flushing, true);
  assert.equal(JSON.parse(f.commits[0].json).value, 7);
  assert.equal(f.stored.size, 0); assert.equal(f.writes.length, 0);
  f.persisted(); assert.equal((await save).persistenceVerified, true);
});

test('durable flushSync and lifecycle saves expose async work without pretending synchronous persistence', async () => {
  for (const event of ['flushSync', 'pagehide', 'beforeunload', 'visibilitychange']) {
    const f = durableFixture({ worker: false });
    let requested;
    if (event === 'flushSync') requested = f.api.flushSync();
    else if (event === 'visibilitychange') { f.document.hidden = true; f.document.emit(event); }
    else f.window.emit(event);
    if (requested) { assert.equal(requested.status, 'async-required'); assert.equal(requested.persistenceVerified, false); }
    assert.equal(f.api.snapshot().flushing, true); assert.equal(f.api.snapshot().persistenceVerified, false);
    assert.equal(f.commits.length, 1); assert.equal(f.writes.length, 0);
    f.persisted(); await microtasks();
    if (requested) assert.equal((await requested.promise).persistenceVerified, true);
    assert.equal(f.api.snapshot().persistenceVerified, true);
  }
});

test('durable dispose waits for latest requested save and fence before releasing ownership or restoring legacy saver', async () => {
  const f = durableFixture({ worker: false });
  const first = f.api.flush(); f.runtime.value = 55;
  const disposed = f.api.dispose();
  assert.equal(f.api.request(), false);
  assert.notEqual(f.runtime.savePersistentGenome, f.original);
  assert.equal(f.api.snapshot().disposed, false);
  f.persisted(0); await first; await microtasks();
  assert.equal(f.commits.length, 2);
  assert.equal(JSON.parse(f.commits[1].json).value, 55);
  f.persisted(1); await microtasks();
  assert.equal(f.fences.length, 1);
  assert.equal(f.api.snapshot().disposed, false);
  assert.notEqual(f.runtime.savePersistentGenome, f.original);
  f.fenced();
  const outcome = await disposed;
  assert.equal(outcome.persistenceVerified, true);
  assert.equal(f.api.snapshot().disposed, true);
  assert.equal(f.runtime.savePersistentGenome, f.original);
  assert.equal(f.window.listenerCount() + f.document.listenerCount(), 0);
});

test('a rejected old commit cannot finish cancellation or change its evidence before the storage fence settles', async () => {
  const f = durableFixture({ worker: false });
  const save = f.api.flush(), drain = f.api.cancelAndDrain('restore');
  assert.equal(f.api.snapshot().lastDrain.status, 'pending');
  assert.equal(f.api.snapshot().lastDrain.epoch, 1);
  f.commits[0].reject(Error('late old write failure'));
  await microtasks();
  assert.equal(f.api.snapshot().flushing, true);
  assert.equal(f.api.snapshot().lastOutcome, 'cancelling');
  assert.equal(f.api.resume(), false);
  f.fenced(); await drain;
  assert.equal((await save).status, 'cancelled');
  assert.equal(f.api.snapshot().lastOutcome, 'cancelled');
  assert.equal(f.api.snapshot().lastError, '');
});

test('an incomplete durable storage contract fails installation instead of quietly using legacy persistence', () => {
  for (const durableStorage of [{ commit() {} }, { fence() {} }, {}]) {
    assert.throws(() => workerFixture({ extra: { durableStorage } }), /Durable autosave requires/);
  }
});

// Controlled encoding/commit settlement seams; byte fidelity and real worker
// import are independently exercised against the real learned codec suite.
function primaryDurableFixture({ worker = false, ...settings } = {}) {
  const encodings = [];
  const asyncCodec = { ...codec, encodeAsync(payload, options) {
    return codec.encodeAsync(payload, { ...options, learnedCodec: { seal(captured, { signal }) {
      const operation = { captured: structuredClone(captured), signal, ...deferred() };
      encodings.push(operation);
      return operation.promise;
    } } });
  } };
  const f = durableFixture({ ...settings, worker, extra: { ...settings.extra, codec: asyncCodec,
    capture() { return { value: this.value, weights: codec.numericArray(this.weights, 4), nested: this.nested,
      primaryPolicyState: codec.primaryState({ fixtureStamp: this.value }) }; }
  } });
  return { ...f, encodings,
    encoded(index = encodings.length - 1) { const item = encodings[index]; item.resolve({ schema: 'controlled-encoding-fixture', ...item.captured }); }
  };
}

test('durable primary fallback owns async encoding and captures legacy values before waiting or coalescing a later save', async () => {
  const f = primaryDurableFixture();
  const first = f.api.flush();
  assert.equal(f.api.snapshot().phase, 'serializing'); assert.equal(f.api.snapshot().workerMode, 'async');
  assert.equal(f.encodings.length, 1); assert.equal(f.commits.length, 0);
  f.runtime.value = 22; f.runtime.weights.fill(9); f.runtime.nested.sequence.push(3);
  const latest = f.api.flush();
  assert.equal(f.encodings.length, 1, 'pending encode remains the single active job');
  f.encoded(0); await microtasks();
  assert.equal(f.commits.length, 1);
  const prior = JSON.parse(f.commits[0].json);
  assert.equal(prior.value, 1); assert.deepEqual(prior.weights, [1.2346, 0]);
  assert.deepEqual(prior.nested.sequence, [1, 2]); assert.equal(prior.primaryPolicyState.fixtureStamp, 1);
  f.persisted(0); assert.equal((await first).persistenceVerified, true); await microtasks();
  assert.equal(f.encodings.length, 2); assert.equal(f.encodings[1].captured.fixtureStamp, 22);
  f.encoded(1); await microtasks();
  assert.equal(JSON.parse(f.commits[1].json).value, 22);
  f.persisted(1); assert.equal((await latest).persistenceVerified, true);
  assert.equal(f.api.snapshot().verifiedWrites, 2); assert.equal(f.writes.length, 0);
});

test('durable fence waits for physical async encoding settlement and rejects any late publication', async () => {
  const f = primaryDurableFixture();
  const save = f.api.flush(), drain = f.api.cancelAndDrain('checkpoint-restore');
  let drained = false; drain.then(() => { drained = true; });
  assert.equal(f.encodings[0].signal.aborted, true);
  f.fenced(); await microtasks();
  assert.equal(drained, false, 'fence alone cannot release unfinished in-process encoding');
  assert.equal(f.api.snapshot().flushing, true); assert.equal(f.api.resume(), false);
  assert.equal(f.api.request(), false); assert.equal(f.api.flush().status, 'blocked');
  f.encoded();
  assert.equal((await drain).settled, true); assert.equal((await save).status, 'cancelled');
  assert.equal(f.commits.length, 0); assert.equal(f.api.snapshot().verifiedWrites, 0);
  assert.equal(f.api.resume(), true);
  f.runtime.value = 51;
  const current = f.api.flush(); f.encoded(); await microtasks();
  assert.equal(f.commits.length, 1); assert.equal(f.commits[0].epoch, 1);
  assert.equal(JSON.parse(f.commits[0].json).value, 51);
  f.persisted(); assert.equal((await current).persistenceVerified, true);
});

test('durable primary dispose has no successful receipt until encoding, persistence and physical fencing complete', async () => {
  const f = primaryDurableFixture();
  const closing = f.api.dispose(); let finished = false;
  closing.then(() => { finished = true; });
  await microtasks();
  assert.equal(finished, false); assert.equal(f.encodings.length, 1);
  assert.equal(f.commits.length, 0); assert.equal(f.fences.length, 0);
  f.encoded(); await microtasks();
  assert.equal(finished, false); assert.equal(f.commits.length, 1); assert.equal(f.fences.length, 0);
  assert.equal(f.api.snapshot().persistenceVerified, false);
  f.persisted(); await microtasks();
  assert.equal(finished, false); assert.equal(f.fences.length, 1);
  f.fenced();
  assert.equal((await closing).persistenceVerified, true);
  assert.equal(f.api.snapshot().disposed, true); assert.equal(f.runtime.savePersistentGenome, f.original);
});

test('failed primary encoding never reaches canonical storage and close reports the failure after fencing', async () => {
  const f = primaryDurableFixture();
  let canonical = '{"existing":"verified"}';
  const originalCanonical = canonical;
  const closing = f.api.dispose();
  f.encodings[0].reject(Error('hash unavailable'));
  await microtasks();
  assert.equal(f.commits.length, 0); assert.equal(f.fences.length, 1);
  assert.equal(f.api.snapshot().verifiedWrites, 0);
  // The controlled durable sink changes canonical only when it receives a
  // commit. There is no legacy storage fallback on an encoder failure.
  if (f.commits.length) canonical = f.commits.at(-1).json;
  assert.equal(canonical, originalCanonical);
  f.fenced();
  const result = await closing;
  assert.equal(result.status, 'failed'); assert.equal(result.persistenceVerified, false);
  assert.match(result.error, /hash unavailable/); assert.equal(f.writes.length, 0);
});

test('a primary worker failure makes exactly one async fallback and fences all old worker replies', async () => {
  const f = primaryDurableFixture({ worker: true });
  const save = f.api.flush(), worker = f.workers[0], oldHandler = worker.onmessage;
  const oldMessage = worker.messages[0].received;
  f.runtime.value = 27; worker.fail();
  assert.equal(worker.terminated, true); assert.equal(f.encodings.length, 1);
  assert.equal(f.api.snapshot().workerMode, 'failed-async'); assert.equal(f.api.snapshot().fallbackCount, 1);
  assert.equal(f.commits.length, 0);
  oldHandler({ data: { id: oldMessage.id, json: '{"obsolete":true}', serializationMs: 1 } });
  assert.equal(f.commits.length, 0);
  f.encoded(); await microtasks();
  assert.equal(JSON.parse(f.commits[0].json).primaryPolicyState.fixtureStamp, 27);
  f.persisted(); assert.equal((await save).persistenceVerified, true);
  const next = f.api.flush();
  assert.equal(f.workers.length, 1); assert.equal(f.encodings.length, 2);
  f.encoded(); await microtasks(); f.persisted(); await next;
  assert.equal(f.api.snapshot().fallbackCount, 1);
});
