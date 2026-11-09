'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createExecutor } = require('../systems/alive-guest-execution.js');
const flush = () => new Promise(resolve => setImmediate(resolve));

function fixture() {
  let clock = 0, nextTimer = 0, calls = 0;
  const timers = new Map(), operations = [];
  const executor = createExecutor({ now: () => clock,
    setTimer: (fn, ms) => { const id = ++nextTimer; timers.set(id, { fn, due: clock + ms }); return id; },
    clearTimer: id => timers.delete(id)
  });
  const listeners = new Map();
  const webview = { isConnected: true, id: 'webview-test', src: 'https://fixture.test/first',
    addEventListener(name, listener) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(listener); },
    getURL() { return this.src; }, getWebContentsId() { return 42; },
    executeJavaScript(code) { calls++; return new Promise((resolve, reject) => operations.push({ code, resolve, reject })); } };
  const emit = (name, event = {}) => { for (const listener of listeners.get(name) || []) listener(event); };
  const advance = ms => {
    clock += ms;
    for (const [id, timer] of Array.from(timers)) if (timer.due <= clock) { timers.delete(id); timer.fn(); }
  };
  return { executor, webview, operations, advance, emit, calls: () => calls, timers };
}

test('timeout releases callers but repeated calls do not enqueue another raw guest script', async () => {
  const f = fixture();
  const first = f.executor.run(f.webview, 'first', { tag: 'body', timeoutMs: 20 });
  const joined = f.executor.run(f.webview, 'second', { tag: 'body', timeoutMs: 20 });
  assert.equal(first, joined);
  f.advance(20);
  assert.equal(await first, null);
  for (let i = 0; i < 100; i++) assert.equal(await f.executor.run(f.webview, 'repeat', { tag: 'body' }), null);
  assert.equal(f.calls(), 1);
  assert.equal(f.executor.pendingCount(), 1);
  assert.equal(f.executor.snapshot(f.webview)[0].timedOut, true);
  f.operations[0].resolve('late');
  await flush();
  assert.equal(f.executor.pendingCount(), 0);
  const next = f.executor.run(f.webview, 'fresh', { tag: 'body' });
  f.operations[1].resolve('fresh result');
  assert.equal(await next, 'fresh result');
  assert.equal(f.calls(), 2);
});

test('owner cancellation suppresses the result and preserves the raw lock until settlement', async () => {
  const f = fixture(), abort = new AbortController();
  const result = f.executor.run(f.webview, 'body', { tag: 'body', signal: abort.signal });
  abort.abort();
  assert.equal(await result, null);
  assert.equal(f.executor.pendingCount(), 1);
  assert.equal(await f.executor.run(f.webview, 'replacement', { tag: 'body' }), null);
  assert.equal(f.calls(), 1);
  f.operations[0].resolve({ stale: true });
  await flush();
  assert.equal(f.executor.pendingCount(), 0);
  assert.equal(f.timers.size, 0);
});

test('a joining caller can cancel without cancelling another caller or receiving a late result', async () => {
  const f = fixture(), abort = new AbortController();
  const owner = f.executor.run(f.webview, 'body', { tag: 'body' });
  const joined = f.executor.run(f.webview, 'other', { tag: 'body', signal: abort.signal });
  abort.abort();
  assert.equal(await joined, null);
  f.operations[0].resolve('owner result');
  assert.equal(await owner, 'owner result');
  assert.equal(f.calls(), 1);
});

test('an already-aborted signal never schedules guest execution', async () => {
  const f = fixture(), abort = new AbortController(); abort.abort();
  assert.equal(await f.executor.run(f.webview, 'body', { signal: abort.signal }), null);
  assert.equal(f.calls(), 0);
  assert.equal(f.executor.pendingCount(), 0);
});

test('rejections and synchronous Electron errors clear locks without unhandled failures', async () => {
  const f = fixture();
  const result = f.executor.run(f.webview, 'body');
  f.operations[0].reject(new Error('guest destroyed'));
  assert.equal(await result, null);
  await flush();
  assert.equal(f.executor.pendingCount(), 0);
  const broken = { executeJavaScript() { throw new Error('not attached'); } };
  assert.equal(await f.executor.run(broken, 'body'), null);
  assert.equal(f.executor.pendingCount(), 0);
});

test('separate guest lanes can progress while a different lane is stuck, with bounded lane count', async () => {
  const f = fixture();
  for (let i = 0; i < 8; i++) f.executor.run(f.webview, 'work' + i, { tag: 'lane' + i });
  assert.equal(await f.executor.run(f.webview, 'overflow', { tag: 'lane8' }), null);
  assert.equal(f.calls(), 8);
  f.operations[3].resolve('done');
  await flush();
  assert.equal(f.executor.snapshot(f.webview).length, 7);
  const replacement = f.executor.run(f.webview, 'next', { tag: 'lane3' });
  f.operations[8].resolve('next result');
  assert.equal(await replacement, 'next result');
  for (const operation of f.operations) operation.resolve(null);
  await flush();
  assert.equal(f.executor.pendingCount(), 0);
});


test('committed navigation releases the old document but late settlement cannot clear a new lock', async () => {
  const f = fixture();
  const old = f.executor.run(f.webview, 'old', { tag: 'body', timeoutMs: 10 });
  f.advance(10);
  assert.equal(await old, null);
  f.webview.src = 'https://fixture.test/next';
  f.emit('did-navigate');
  assert.equal(f.executor.pendingCount(), 0);
  const fresh = f.executor.run(f.webview, 'fresh', { tag: 'body' });
  f.operations[0].resolve('stale');
  await flush();
  assert.equal(f.executor.pendingCount(), 1);
  assert.equal(f.executor.snapshot(f.webview)[0].generation, 1);
  f.operations[1].resolve('new document result');
  assert.equal(await fresh, 'new document result');
  assert.equal(f.executor.lifecycleSnapshot()[0].reason, 'document-replaced');
});

test('navigation start, navigation failure, in-page changes and close requests retain raw locks', async () => {
  const f = fixture();
  const raw = f.executor.run(f.webview, 'old', { tag: 'body', timeoutMs: 10 });
  for (const name of ['did-start-navigation', 'did-fail-load', 'did-navigate-in-page', 'close']) f.emit(name);
  f.advance(10);
  assert.equal(await raw, null);
  assert.equal(f.executor.pendingCount(), 1);
  assert.equal(f.executor.retire(f.webview), false);
  assert.equal(await f.executor.run(f.webview, 'duplicate', { tag: 'body' }), null);
  assert.equal(f.calls(), 1);
  f.operations[0].resolve(null);
  await flush();
  assert.equal(f.executor.pendingCount(), 0);
});

test('destroyed guests and renderer loss release callers and reject submissions until reattached', async () => {
  for (const event of ['destroyed', 'render-process-gone']) {
    const f = fixture();
    const old = f.executor.run(f.webview, 'old', { tag: 'body' });
    f.emit(event);
    assert.equal(await old, null);
    assert.equal(f.executor.pendingCount(), 0);
    assert.equal(await f.executor.run(f.webview, 'unavailable', { tag: 'body' }), null);
    assert.equal(f.calls(), 1);
    f.emit('did-attach');
    const fresh = f.executor.run(f.webview, 'fresh', { tag: 'body' });
    f.operations[0].resolve('stale');
    await flush();
    assert.equal(f.executor.pendingCount(), 1);
    f.operations[1].resolve('fresh');
    assert.equal(await fresh, 'fresh');
  }
});

test('retiring a removed tab clears orphaned raw execution and preserves diagnostic evidence', async () => {
  const f = fixture();
  const old = f.executor.run(f.webview, 'old', { tag: 'body' });
  const diagnostic = f.executor.pendingSnapshot()[0];
  assert.equal(diagnostic.origin.webContentsId, 42);
  assert.equal(diagnostic.origin.url, 'https://fixture.test/first');
  assert.equal(diagnostic.tag, 'body');
  f.webview.isConnected = false;
  assert.equal(f.executor.retire(f.webview, 'tab-closed'), true);
  assert.equal(await old, null);
  assert.equal(f.executor.pendingCount(), 0);
  assert.equal(f.executor.pendingSnapshot().length, 0);
  assert.equal(f.executor.lifecycleSnapshot()[0].reason, 'tab-closed');
  assert.equal(f.executor.lifecycleSnapshot()[0].released, 1);
  assert.equal(await f.executor.run(f.webview, 'removed'), null);
  f.operations[0].resolve('stale');
  await flush();
  assert.equal(f.executor.pendingCount(), 0);
});

test('bounded idle waits observe real raw settlement rather than caller timeouts and abort without freeing locks', async () => {
  const f = fixture();
  const raw = f.executor.run(f.webview, 'pending', { timeoutMs: 5 });
  f.advance(5); assert.equal(await raw, null);
  const timed = f.executor.waitForIdle(null, { timeoutMs: 20 });
  f.advance(20); assert.equal(await timed, false);
  assert.equal(f.executor.pendingCount(), 1);
  const abort = new AbortController();
  const cancelled = f.executor.waitForIdle([f.webview], { timeoutMs: 100, signal: abort.signal });
  abort.abort(); assert.equal(await cancelled, false);
  assert.equal(f.executor.pendingCount(), 1);
  const settled = f.executor.waitForIdle([f.webview], { timeoutMs: 100 });
  f.operations[0].resolve('actually settled');
  assert.equal(await settled, true);
  assert.equal(f.timers.size, 0);
});

test('document identity and lifecycle observers change only when the document can no longer execute', async () => {
  const f = fixture(), events = [];
  const initial = f.executor.documentIdentity(f.webview);
  const unsubscribe = f.executor.subscribeLifecycle(event => events.push(event));
  f.emit('did-start-navigation'); f.emit('did-navigate-in-page'); f.emit('did-fail-load');
  assert.equal(f.executor.documentIdentity(f.webview).generation, initial.generation);
  const raw = f.executor.run(f.webview, 'pending');
  const idle = f.executor.waitForIdle(null);
  f.emit('did-navigate');
  assert.equal(await raw, null); assert.equal(await idle, true);
  assert.equal(f.executor.documentIdentity(f.webview).generation, initial.generation + 1);
  assert.equal(events[0].webview, f.webview);
  assert.equal(events[0].reason, 'document-replaced');
  unsubscribe(); f.emit('destroyed'); assert.equal(events.length, 1);
  f.operations[0].resolve(null); await flush();
});

test('configured epochs cannot join old raw lanes or receive stale results; unscoped tools remain explicit', async () => {
  const f = fixture(); let current = { epoch: 1 }, rejected = 0;
  f.executor.configureAuthority({ tokenFor: () => current, isCurrent: token => token === current,
    wrap: (code, token) => `epoch:${token.epoch}:${code}`, onRejected: () => rejected++,
    attachResult: (value, token) => value && typeof value === 'object' ? { ...value, authority: token } : value });
  const oldToken = current;
  const old = f.executor.run(f.webview, 'old', { tag: 'body' });
  assert.equal(f.operations[0].code, 'epoch:1:old');
  current = { epoch: 2 };
  assert.equal(await f.executor.run(f.webview, 'fresh', { tag: 'body' }), null);
  assert.equal(await f.executor.run(f.webview, 'stale', { authorityToken: oldToken }), null);
  assert.equal(f.calls(), 1);
  f.operations[0].resolve({ stale: true }); assert.equal(await old, null);
  const fresh = f.executor.run(f.webview, 'fresh', { tag: 'body' });
  f.operations[1].resolve({ fresh: true });
  assert.deepEqual(await fresh, { fresh: true, authority: current });
  const browserTool = f.executor.run(f.webview, 'manual-browser-tool', { authority: false });
  assert.equal(f.operations[2].code, 'manual-browser-tool');
  f.operations[2].resolve(true); assert.equal(await browserTool, true);
  assert.ok(rejected >= 2);
});

test('distinct control acknowledgements never coalesce while unresolved physical control lock is retained', async () => {
  const f = fixture();
  const first = f.executor.runControl(f.webview, 'control-one', { tag: 'authority-control', timeoutMs: 5 });
  f.advance(5); assert.equal(await first, null);
  assert.equal(await f.executor.runControl(f.webview, 'control-two', { tag: 'authority-control' }), null);
  assert.equal(f.calls(), 1);
  assert.equal(f.executor.pendingSnapshot()[0].control, true);
  f.operations[0].resolve('old ack'); await flush();
  const fresh = f.executor.runControl(f.webview, 'control-two', { tag: 'authority-control' });
  f.operations[1].resolve('new ack'); assert.equal(await fresh, 'new ack');
});

test('one bounded revocation lane remains available when all normal guest lanes are physically occupied', async () => {
  const f = fixture();
  for (let index = 0; index < 8; index++) f.executor.run(f.webview, 'normal', { tag: 'lane-' + index, timeoutMs: 5 });
  f.advance(5);
  const revoke = f.executor.runControl(f.webview, 'revoke', { tag: 'authority-revoke' });
  assert.equal(f.calls(), 9);
  assert.equal(f.executor.pendingCount(), 9);
  assert.equal(await f.executor.runControl(f.webview, 'other-revoke', { tag: 'authority-revoke' }), null);
  assert.equal(await f.executor.runControl(f.webview, 'overflow', { tag: 'other-control' }), null);
  f.operations[8].resolve({ revoked: true });
  assert.deepEqual(await revoke, { revoked: true });
  assert.equal(f.executor.pendingCount(), 8);
  for (const operation of f.operations) operation.resolve(null);
  await flush(); assert.equal(f.executor.pendingCount(), 0);
});

test('DNS failure and a fresh error-document revocation acknowledgement cannot retire unresolved old guest work', async () => {
  const f = fixture();
  const oldIdentity = f.executor.documentIdentity(f.webview);
  const original = f.executor.run(f.webview, 'old document unresolved asynchronous writer', { tag: 'body', timeoutMs: 5 });
  f.advance(5); assert.equal(await original, null);
  f.emit('did-start-navigation', { isMainFrame: true, url: 'https://cdn.example/missing' });
  f.emit('did-fail-load', { isMainFrame: true, errorCode: -105, errorDescription: 'ERR_NAME_NOT_RESOLVED', validatedURL: 'https://cdn.example/missing' });
  f.webview.src = 'chrome-error://chromewebdata/';
  f.emit('dom-ready');
  assert.equal(f.executor.documentIdentity(f.webview).generation, oldIdentity.generation);
  assert.equal(f.executor.pendingCount(), 1);
  assert.equal(f.executor.lifecycleSnapshot().length, 0, 'failure and error URL are not proof that old scripts were physically retired');
  const revoke = f.executor.runControl(f.webview, 'revoke current error-document nonce', { tag: 'authority-revoke', timeoutMs: 10 });
  f.operations[1].resolve({ ok: true, operation: 'revoke', documentNonce: 'fresh-error-document', revision: 10 });
  assert.equal((await revoke).ok, true);
  assert.equal(f.executor.pendingCount(), 1, 'acknowledgement only settles its own physical control execution');
  assert.equal(f.executor.snapshot(f.webview)[0].origin.url, 'https://fixture.test/first');
  assert.equal(f.executor.snapshot(f.webview)[0].current.url, 'chrome-error://chromewebdata/');
  const unsettled = f.executor.waitForIdle(null, { timeoutMs: 10 });
  f.advance(10); assert.equal(await unsettled, false);
  assert.equal(await f.executor.run(f.webview, 'replacement body', { tag: 'body' }), null);
  const settled = f.executor.waitForIdle(null, { timeoutMs: 10 });
  f.operations[0].resolve('late old result');
  assert.equal(await settled, true);
  assert.equal(f.executor.pendingCount(), 0);
});
