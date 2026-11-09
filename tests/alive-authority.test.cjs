'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const authorityModule = require('../systems/alive-authority.js');
const { createExecutor } = require('../systems/alive-guest-execution.js');

function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
async function turns(count = 12) { for (let i = 0; i < count; i++) await Promise.resolve(); }
async function authoritySettled(f) {
  for (let i = 0; i < 100 && f.authority.snapshot().transitioning; i++) await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(f.authority.snapshot().transitioning, false, 'bounded authority cleanup settled');
}
function fixture({ paused = false, selected = 'a', commitError = false, timeoutMs = 100, controlHook, realExecutor = false, authorityOptions = {} } = {}) {
  const guests = new Map(), lifecycle = new Set(), commits = [], controls = [], waits = [];
  let provider, current = selected, hostEpoch = 4, hook = controlHook;
  function add(id) {
    const listeners = new Map();
    const guest = { id, generation: 0, available: true, ready: true, connected: true, isConnected: true, raw: new Set(), context: null,
      addEventListener(name, listener) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(listener); },
      emit(name) { for (const listener of listeners.get(name) || []) listener({}); },
      executeJavaScript(code) {
        const ack = vm.runInContext(code, this.context);
        if (!ack?.operation) return Promise.resolve(ack);
        controls.push({ guest: id, operation: ack.operation, ack });
        return Promise.resolve(hook ? hook({ guest: this, code, ack }) : ack);
      }
    };
    guest.context = vm.createContext({ window: { mutations: 0, commands: [] }, crypto: { randomUUID: () => `${id}-document-${guest.generation}` }, Date, Math });
    guests.set(id, guest); return guest;
  }
  for (const id of ['a', 'b', 'c']) add(id);
  const executor = realExecutor ? createExecutor() : {
    configureAuthority(value) { provider = value; },
    documentIdentity(guest) { return { generation: guest.generation, available: guest.available, connected: guest.connected }; },
    subscribeLifecycle(listener) { lifecycle.add(listener); return () => lifecycle.delete(listener); },
    async waitForIdle(targets, options) {
      const checked = targets === null ? Array.from(guests.values()) : targets;
      waits.push(checked.map(guest => guest.id));
      return !options.signal?.aborted && checked.every(guest => guest.raw.size === 0);
    },
    async runControl(guest, code, options) {
      if (options.signal?.aborted || !guest.connected) return null;
      const ack = vm.runInContext(code, guest.context);
      controls.push({ guest: guest.id, operation: ack.operation, ack });
      const value = hook ? await hook({ guest, code, ack, options }) : ack;
      return options.signal?.aborted ? null : value;
    },
    async run(guest, code, { authorityToken, authority = true } = {}) {
      const token = authorityToken || provider?.tokenFor(guest);
      if (authority !== false && provider && !provider.isCurrent(token, guest)) { provider.onRejected?.(); return null; }
      const value = vm.runInContext(authority === false || !provider ? code : provider.wrap(code, token), guest.context);
      if (authority !== false && provider && !provider.isCurrent(token, guest)) { provider.onRejected?.(); return null; }
      return authority === false || !provider ? value : provider.attachResult(value, token);
    }
  };
  const authority = authorityModule.create({ executor, sessionId: 'fixture-session', paused, timeoutMs, revocationRetryMs: 0, ...authorityOptions,
    resolveGuest: id => { const guest = guests.get(id); return guest?.available && guest.connected ? guest : null; },
    isGuestReady: (_id, guest) => guest.ready,
    getSelectedTabId: () => current, getEpoch: () => hostEpoch,
    onCommit(record) { if (commitError) throw Error('commit fixture failure'); hostEpoch = record.newEpoch; commits.push(record); }
  });
  function replace(id, { close = false } = {}) {
    const guest = guests.get(id); guest.generation++;
    if (close) { guest.connected = false; guest.isConnected = false; guest.available = false; }
    else guest.context = vm.createContext({ window: { mutations: 0, commands: [] }, crypto: { randomUUID: () => `${id}-document-${guest.generation}` }, Date, Math });
    guest.raw.clear();
    if (realExecutor) {
      if (close) executor.retire(guest, 'tab-closed'); else guest.emit('did-navigate');
    } else for (const listener of lifecycle) listener({ webview: guest, reason: close ? 'tab-closed' : 'document-replaced', generation: guest.generation });
  }
  return { authority, executor, guests, commits, controls, waits, replace,
    setSelected(id) { current = id; }, setHook(value) { hook = value; },
    guest(id) { return guests.get(id); }, getProvider() { return provider; } };
}

test('primary authority commits only after exact destination document acknowledgement', async () => {
  const f = fixture();
  assert.equal(f.authority.leaseFor('a'), null);
  const outcome = await f.authority.select('a');
  assert.equal(outcome.status, 'completed');
  assert.equal(f.commits.length, 1);
  assert.equal(outcome.evidence.newEpoch, 5);
  assert.equal(outcome.evidence.documentNonce, 'a-document-0');
  assert.equal(outcome.evidence.destinationAcknowledged, true);
  assert.equal(outcome.evidence.distributedWriterFencing, false);
  assert.equal(outcome.evidence.checkpointTransferred, false);
  assert.deepEqual(f.controls.map(item => item.operation), ['probe', 'install']);
  const lease = f.authority.leaseFor('a');
  const value = await f.executor.run(f.guest('a'), '(() => { window.mutations++; return { ok: true }; })()');
  assert.equal(value.ok, true);
  assert.equal(authorityModule.sameToken(value.authority, lease), true);
  assert.equal(f.guest('a').context.window.mutations, 1);
  assert.equal((await f.authority.select('a')).evidence.unchanged, true);
  assert.equal(f.commits.length, 1);
});

test('failed first revocation never skips later guests, and exhausted cleanup remains observable and closed', async () => {
  const f = fixture(); await f.authority.select('a'); await f.authority.grant('b'); await f.authority.grant('c');
  const old = f.authority.leaseFor('a');
  for (const id of ['a', 'b', 'c']) await f.executor.run(f.guest(id), `(() => {
    window.cleaned = 0;
    window.__aliveAuthority.onRevoke(window.__aliveAuthority.executingToken, () => window.cleaned++);
    return true;
  })()`);
  f.setHook(({ guest, ack }) => guest.id === 'a' && ack.operation === 'revoke' ? { ...ack, requestId: 'incorrect' } : ack);
  const result = await f.authority.setPaused(true);
  assert.equal(result.status, 'blocked');
  assert.equal(f.guest('b').context.window.cleaned, 1);
  assert.equal(f.guest('c').context.window.cleaned, 1);
  const snapshot = f.authority.snapshot();
  assert.equal(snapshot.paused, true);
  assert.equal(snapshot.transitioning, false);
  assert.equal(snapshot.cleanup.status, 'blocked');
  assert.equal(snapshot.cleanup.attempt, 3);
  assert.deepEqual(snapshot.cleanup.unresolved.map(item => item.tabId), ['a']);
  assert.match(snapshot.cleanup.unresolved[0].reason, /request/);
  assert.deepEqual(snapshot.cleanup.revoked.map(item => item.tabId).sort(), ['b', 'c']);
  assert.equal(f.authority.isCurrent(old), false);
  const controlCount = f.controls.length;
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(f.controls.length, controlCount, 'retry exhaustion does not schedule an infinite retry loop');
  let writes = 0;
  assert.equal((await f.authority.withManualLease('b', () => writes++)).status, 'blocked');
  assert.equal(writes, 0);
  f.setHook(null);
  assert.equal((await f.authority.invalidate('manual-cleanup-retry')).status, 'completed');
  assert.equal(f.authority.snapshot().cleanup.status, 'completed');
  assert.equal(f.authority.snapshot().paused, true);
  assert.equal(await f.authority.withManualLease('b', () => ++writes), 1);
});

test('transient revocation failure retries within a bounded request and never admits writers during retry', async () => {
  const f = fixture({ realExecutor: true }); await f.authority.select('a'); await f.authority.grant('b');
  const old = f.authority.leaseFor('a'); let failures = 0, manualWrites = 0;
  const admissions = [];
  f.setHook(({ guest, ack }) => {
    if (guest.id === 'a' && ack.operation === 'revoke') {
      assert.equal(f.authority.isCurrent(old), false);
      admissions.push(f.authority.withManualLease('b', () => manualWrites++));
      if (failures++ === 0) return null;
    }
    return ack;
  });
  const outcome = await f.authority.setPaused(true);
  assert.equal(outcome.status, 'completed');
  assert.equal(f.authority.snapshot().cleanup.attempt, 2);
  assert.equal(f.authority.snapshot().cleanup.status, 'completed');
  assert.equal(f.authority.snapshot().cleanup.rawDrained, true);
  assert.equal(f.authority.snapshot().leases.length, 0);
  assert.equal(f.authority.snapshot().paused, true);
  assert.equal(manualWrites, 0);
  assert.ok((await Promise.all(admissions)).every(item => item.status === 'blocked'));
  assert.equal(f.controls.filter(item => item.guest === 'b' && item.operation === 'revoke').length, 1, 'successful acknowledgements are retained across retry passes');
});

test('throwing revocation control still attempts every later known guest', async () => {
  const f = fixture(); await f.authority.select('a'); await f.authority.grant('c');
  f.setHook(({ guest, ack }) => { if (guest.id === 'a' && ack.operation === 'revoke') throw Error('transient control failure'); return ack; });
  assert.equal((await f.authority.setPaused(true)).status, 'blocked');
  assert.ok(f.controls.some(item => item.guest === 'c' && item.operation === 'revoke'));
  assert.match(f.authority.snapshot().cleanup.unresolved[0].reason, /transient control failure/);
});

test('revoke-only nonce reconciliation uses a fresh probe but never retires unresolved physical writers', async () => {
  const f = fixture(); await f.authority.select('a');
  const old = f.authority.leaseFor('a'), raw = {};
  f.guest('a').raw.add(raw);
  f.guest('a').context = vm.createContext({ window: { mutations: 0 }, crypto: { randomUUID: () => 'dns-error-document' }, Date, Math });
  const outcome = await f.authority.setPaused(true);
  assert.equal(outcome.status, 'blocked', 'new document ACK is insufficient while any physical writer remains');
  assert.equal(f.guest('a').raw.has(raw), true);
  const snapshot = f.authority.snapshot();
  assert.equal(snapshot.cleanup.rawDrained, false);
  assert.equal(snapshot.cleanup.revoked[0].documentNonce, 'dns-error-document');
  assert.equal(snapshot.cleanup.revoked[0].previousDocumentNonce, old.documentNonce);
  assert.equal(snapshot.cleanup.revoked[0].documentGeneration, old.documentGeneration);
  assert.equal(f.commits.length, 1, 'reconciliation does not create a new grant');
  assert.equal(f.authority.leaseFor('a'), null);
  f.guest('a').raw.delete(raw);
  assert.equal((await f.authority.invalidate('retry-after-raw-settlement')).status, 'completed');
  assert.equal(f.authority.snapshot().paused, true);
});

test('resume cannot grant new writes while revocation remains unresolved, but explicit retry can recover', async () => {
  const f = fixture(); await f.authority.select('a'); const old = f.authority.leaseFor('a');
  f.setHook(({ ack }) => ack.operation === 'revoke' ? null : ack);
  assert.equal((await f.authority.setPaused(true)).status, 'blocked');
  assert.equal((await f.authority.setPaused(false)).status, 'blocked');
  await authoritySettled(f);
  assert.equal(f.authority.snapshot().cleanup.status, 'blocked');
  assert.equal(f.authority.snapshot().leases.length, 0);
  assert.equal(f.authority.isCurrent(old), false);
  assert.equal(await f.executor.run(f.guest('a'), 'window.mutations++'), null);
  assert.equal(f.commits.length, 1);
  f.setHook(null);
  assert.equal((await f.authority.select('a', { reason: 'explicit-retry' })).status, 'completed');
  assert.equal(f.authority.snapshot().cleanup.status, 'completed');
  assert.equal(f.commits.length, 2);
  assert.equal(await f.executor.run(f.guest('a'), '(window.mutations++, true)'), true);
});

test('lost reconciled revoke ACK retains original mismatch provenance through its successful retry', async () => {
  const f = fixture(); await f.authority.select('a'); const old = f.authority.leaseFor('a');
  f.guest('a').context = vm.createContext({ window: {}, crypto: { randomUUID: () => 'new-error-document' }, Date, Math });
  let dropped = false;
  f.setHook(({ ack }) => {
    if (!dropped && ack.operation === 'revoke' && ack.ok === true) { dropped = true; return null; }
    return ack;
  });
  const result = await f.authority.setPaused(true);
  assert.equal(result.status, 'completed');
  assert.equal(result.evidence.cleanup.attempt, 2);
  const receipt = result.evidence.cleanup.revoked[0];
  assert.equal(receipt.documentNonce, 'new-error-document');
  assert.equal(receipt.previousDocumentNonce, old.documentNonce);
  assert.equal(receipt.freshProbeAcknowledged, true);
  assert.match(receipt.reconciliationReason, /document-mismatch/);
  assert.equal(f.commits.length, 1);
});

test('superseding cleanup aborts its retry delay and immediately exposes the new pending revision', async () => {
  const f = fixture({ authorityOptions: { revocationRetryMs: 1000 } }); await f.authority.select('a');
  const reached = deferred();
  f.setHook(({ ack }) => { if (ack.operation === 'revoke') { reached.resolve(); return null; } return ack; });
  const paused = f.authority.setPaused(true);
  await reached.promise; await turns(20);
  assert.notEqual(f.authority.snapshot().cleanup.nextRetryAt, null);
  f.setHook(null);
  const retried = f.authority.invalidate('explicit-retry');
  const pending = f.authority.snapshot();
  assert.equal(pending.cleanup.status, 'pending');
  assert.equal(pending.cleanup.revision, pending.revision);
  assert.equal((await paused).status, 'cancelled');
  assert.equal((await retried).status, 'completed');
  assert.equal(f.authority.snapshot().paused, true);
  assert.equal(f.authority.snapshot().cleanup.revision, pending.revision);
});

test('failed automatic handoff gets one bounded revoke-only reconciliation and next selection can recover', async () => {
  const f = fixture(); await f.authority.select('a');
  const old = f.authority.leaseFor('a');
  f.guest('a').context = vm.createContext({ window: {}, crypto: { randomUUID: () => 'error-before-navigation-event' }, Date, Math });
  f.setSelected('b');
  assert.equal((await f.authority.select('b')).status, 'blocked');
  assert.equal(f.authority.snapshot().cleanup.status, 'pending', 'follow-up cleanup is visible before its first microtask');
  await authoritySettled(f);
  assert.equal(f.authority.snapshot().paused, false);
  assert.equal(f.authority.snapshot().cleanup.status, 'completed');
  assert.equal(f.authority.snapshot().cleanup.revoked[0].previousDocumentNonce, old.documentNonce);
  assert.equal(f.commits.length, 1, 'cleanup itself never grants a replacement lease');
  assert.equal(f.authority.leaseFor('b'), null);
  assert.equal((await f.authority.select('b')).status, 'completed');
  assert.equal(f.commits.length, 2);
  assert.equal(f.authority.leaseFor('b').tabId, 'b');
});

test('handoff revokes source callbacks and rejects stale scripts, commands, and A-B-A tokens', async () => {
  const f = fixture(); await f.authority.select('a');
  const old = f.authority.leaseFor('a');
  await f.executor.run(f.guest('a'), `(() => {
    const token = window.__aliveAuthority.executingToken;
    window.oldCallback = window.__aliveAuthority.guard(token, () => window.mutations++);
    window.cleanupCount = 0;
    window.__aliveAuthority.onRevoke(token, () => window.cleanupCount++);
    window.oldCommand = window.__aliveAuthority.command('morph', token);
    return true;
  })()`);
  assert.equal(f.authority.validateCommand(f.guest('a').context.window.oldCommand, 'a'), true);
  f.setSelected('b'); const handoff = await f.authority.select('b');
  assert.equal(handoff.status, 'completed');
  assert.equal(handoff.evidence.rawDrained, true);
  assert.equal(handoff.evidence.revokedDocuments[0].tabId, 'a');
  assert.equal(handoff.evidence.revokedDocuments[0].documentNonce, old.documentNonce);
  assert.equal(handoff.evidence.revokedDocuments[0].acknowledged, true);
  assert.equal(f.guest('a').context.window.cleanupCount, 1);
  vm.runInContext('window.oldCallback()', f.guest('a').context);
  assert.equal(f.guest('a').context.window.mutations, 0);
  assert.equal(f.authority.validateCommand(f.guest('a').context.window.oldCommand, 'a'), false);
  assert.equal(await f.executor.run(f.guest('a'), 'window.mutations++', { authorityToken: old }), null);
  f.setSelected('a'); await f.authority.select('a');
  assert.notEqual(f.authority.leaseFor('a').epoch, old.epoch);
  assert.equal(f.authority.isCurrent(old), false);
  vm.runInContext(authorityModule.guardedScript('window.mutations++', old), f.guest('a').context);
  assert.equal(f.guest('a').context.window.mutations, 0, 'old script cannot write even when same tab is selected again');
  assert.equal(f.controls.filter(item => item.operation === 'revoke').length, 3, 'every known nonce is revoked, including previously revoked habitats');
});

test('same tab and URL in a replacement document never reuse the old nonce or lease', async () => {
  const f = fixture(); await f.authority.select('a'); const old = f.authority.leaseFor('a');
  f.replace('a'); await turns();
  assert.equal(f.authority.isCurrent(old), false);
  const result = await f.authority.select('a');
  assert.equal(result.status, 'completed');
  const current = f.authority.leaseFor('a');
  assert.equal(current.documentGeneration, 1);
  assert.notEqual(current.documentNonce, old.documentNonce);
  assert.equal(vm.runInContext(authorityModule.guardedScript('window.mutations++', old), f.guest('a').context), null);
  assert.equal(f.guest('a').context.window.mutations, 0);
});

test('raw busy scripts prevent authority commit without freeing their physical lock', async () => {
  const f = fixture(); await f.authority.select('a');
  const marker = {}; f.guest('a').raw.add(marker);
  f.setSelected('b');
  const blocked = await f.authority.select('b');
  assert.equal(blocked.status, 'blocked');
  assert.equal(f.commits.length, 1);
  assert.equal(f.guest('a').raw.has(marker), true);
  assert.equal(f.authority.leaseFor('a'), null);
  assert.equal(f.authority.leaseFor('b'), null);
  assert.equal((await f.authority.grant('c')).status, 'blocked');
  f.guest('a').raw.delete(marker);
  assert.equal((await f.authority.select('b')).status, 'completed');
});

test('rapid selections coalesce to the latest target and late acknowledgement cannot commit an obsolete one', async () => {
  const f = fixture(); await f.authority.select('a');
  const hold = deferred(), reached = deferred();
  f.setHook(({ guest, ack }) => {
    if (guest.id === 'b' && ack.operation === 'install') { reached.resolve(); return hold.promise.then(() => ack); }
    return ack;
  });
  f.setSelected('b'); const b = f.authority.select('b'); await reached.promise;
  f.setSelected('c'); const c = f.authority.select('c');
  f.setSelected('a'); const a = f.authority.select('a');
  assert.equal((await c).status, 'cancelled');
  hold.resolve(); assert.equal((await b).status, 'cancelled');
  assert.equal((await a).status, 'completed');
  assert.deepEqual(f.commits.map(record => record.toTabId), ['a', 'a']);
  assert.equal(f.authority.snapshot().pendingTarget, null);
});

test('pause synchronously closes admission and a late destination acknowledgement cannot resume it', async () => {
  const f = fixture(); await f.authority.select('a');
  const old = f.authority.leaseFor('a'), hold = deferred(), reached = deferred();
  f.setHook(({ guest, ack }) => {
    if (guest.id === 'b' && ack.operation === 'install') { reached.resolve(); return hold.promise.then(() => ack); }
    return ack;
  });
  f.setSelected('b'); const transfer = f.authority.select('b'); await reached.promise;
  const paused = f.authority.setPaused(true);
  assert.equal(f.authority.isCurrent(old), false);
  hold.resolve(); await transfer; await paused;
  assert.equal(f.authority.snapshot().paused, true);
  assert.equal(f.authority.leaseFor('b'), null);
  assert.equal(f.commits.length, 1);
  assert.equal((await f.authority.select('b')).status, 'blocked');
});

test('incorrect acknowledgement identity, epoch, or revision never reports successful authority', async () => {
  for (const mutate of [ack => ({ ...ack, requestId: 'other' }), ack => ({ ...ack, documentNonce: 'other' }),
    ack => ({ ...ack, revision: ack.revision + 1 }), ack => ({ ...ack, token: { ...ack.token, epoch: 999 } })]) {
    const f = fixture({ controlHook: ({ ack }) => ack.operation === 'install' ? mutate(ack) : ack });
    assert.equal((await f.authority.select('a')).status, 'blocked');
    assert.equal(f.commits.length, 0);
    assert.equal(f.authority.leaseFor('a'), null);
  }
});

test('closing or replacing destination during acknowledgement invalidates its pending transition', async () => {
  for (const close of [false, true]) {
    const f = fixture(); const hold = deferred(), reached = deferred();
    f.setHook(({ ack }) => { if (ack.operation === 'install') { reached.resolve(); return hold.promise.then(() => ack); } return ack; });
    const request = f.authority.select('a'); await reached.promise;
    f.replace('a', { close }); hold.resolve();
    assert.notEqual((await request).status, 'completed');
    await turns(); assert.equal(f.commits.length, 0);
  }
});

test('auxiliary same-epoch grants preserve explicit multi-tab effects and are all revoked at the next handoff', async () => {
  const f = fixture(); await f.authority.select('a');
  const grant = await f.authority.grant('c');
  assert.equal(grant.status, 'completed');
  assert.equal(grant.evidence.token.epoch, f.authority.leaseFor('a').epoch);
  assert.equal(grant.evidence.token.kind, 'auxiliary');
  assert.equal(await f.executor.run(f.guest('c'), '(window.mutations++, true)'), true);
  f.setSelected('b'); await f.authority.select('b');
  assert.equal(f.authority.isCurrent(grant.evidence.token), false);
  assert.equal(await f.executor.run(f.guest('c'), 'window.mutations++', { authorityToken: grant.evidence.token }), null);
  assert.deepEqual(f.controls.filter(item => item.operation === 'revoke').map(item => item.guest).sort(), ['a', 'c']);
});

test('manual one-shot lease works while paused but cannot install persistent callbacks or resume automation', async () => {
  const f = fixture({ paused: true }); let captured;
  const value = await f.authority.withManualLease('a', async token => {
    captured = token;
    assert.equal(f.authority.leaseFor('a'), null, 'automatic admission cannot borrow the manual permit');
    const result = await f.executor.run(f.guest('a'), `(() => {
      const api = window.__aliveAuthority, token = api.executingToken;
      window.manualCallback = api.guard(token, () => window.mutations += 100);
      window.mutations++;
      return { command: api.command('morph', token) };
    })()`, { authorityToken: token });
    assert.equal(f.authority.validateCommand(result.command, 'a'), true);
    vm.runInContext('window.manualCallback()', f.guest('a').context);
    return result;
  });
  assert.equal(value.command.action, 'morph');
  assert.equal(f.guest('a').context.window.mutations, 1);
  assert.equal(f.authority.snapshot().paused, true);
  assert.equal(f.commits.length, 0);
  assert.equal(f.authority.isCurrent(captured), false);
  assert.equal(vm.runInContext(authorityModule.guardedScript('window.mutations++', captured), f.guest('a').context), null);
  assert.equal(f.authority.snapshot().manuals, 0);
});

test('manual permits remain valid through asynchronous host commits, then revoke on completion', async () => {
  const f = fixture({ paused: true }), hold = deferred(), reached = deferred(); let token;
  const action = f.authority.withManualLease('a', async lease => { token = lease; reached.resolve(); await hold.promise; assert.equal(f.authority.isCurrent(lease), true); return 'saved'; });
  await reached.promise;
  assert.equal((await f.authority.withManualLease('b', () => 'second')).status, 'blocked');
  assert.equal(f.authority.isCurrent(token), true);
  hold.resolve(); assert.equal(await action, 'saved');
  assert.equal(f.authority.isCurrent(token), false);
});

test('aborted manual transactions and timed-out work cannot keep guest permissions alive', async () => {
  for (const abortEarly of [true, false]) {
    const f = fixture({ paused: true, timeoutMs: 25 }), abort = new AbortController(), started = deferred(); let token;
    const action = f.authority.withManualLease('a', lease => { token = lease; started.resolve(); return new Promise(() => {}); }, { signal: abort.signal });
    await started.promise;
    if (abortEarly) abort.abort();
    const outcome = await action;
    assert.notEqual(outcome.status, 'completed');
    assert.equal(f.authority.isCurrent(token), false);
    assert.equal(f.authority.snapshot().manuals, 0);
    assert.equal(vm.runInContext(authorityModule.guardedScript('window.mutations++', token), f.guest('a').context), null);
  }
});

test('revocation high-water mark rejects late lower-revision install scripts in the same document', async () => {
  const f = fixture(); await f.authority.select('a'); const old = f.authority.leaseFor('a');
  await f.authority.invalidate('checkpoint-restore');
  const stale = vm.runInContext(authorityModule.controlScript(old.sessionId, { operation: 'install', sessionId: old.sessionId,
    requestId: 'late', revision: old.revision, documentNonce: old.documentNonce, token: old }), f.guest('a').context);
  assert.equal(stale.ok, false); assert.equal(stale.reason, 'stale-revision');
  assert.equal(vm.runInContext(authorityModule.guardedScript('window.mutations++', old), f.guest('a').context), null);
});

test('host commit failure stays closed and does not manufacture a successful handoff', async () => {
  const f = fixture({ commitError: true });
  const outcome = await f.authority.select('a');
  assert.equal(outcome.status, 'blocked');
  assert.match(outcome.reason, /commit fixture failure/);
  assert.equal(f.authority.leaseFor('a'), null);
  assert.equal(f.commits.length, 0);
});

test('explicit non-creature browser scripts remain available while automatic authority is paused', async () => {
  const f = fixture({ paused: true });
  assert.equal(await f.executor.run(f.guest('a'), '(window.mutations++, true)'), null);
  assert.equal(await f.executor.run(f.guest('a'), '(window.mutations++, true)', { authority: false }), true);
  assert.equal(f.authority.snapshot().paused, true);
});

test('pre-aborted selection leaves the current committed lease intact', async () => {
  const f = fixture(); await f.authority.select('a'); const lease = f.authority.leaseFor('a');
  const abort = new AbortController(); abort.abort();
  assert.equal((await f.authority.select('a', { signal: abort.signal })).status, 'cancelled');
  assert.equal(f.authority.isCurrent(lease), true);
});

test('real executor drains an aborted auxiliary install before committing and revokes the possible unacknowledged grant', async () => {
  const f = fixture({ realExecutor: true, timeoutMs: 500 }); await f.authority.select('a');
  const hold = deferred(), reached = deferred(); let possibleLease;
  f.setHook(({ guest, ack }) => {
    if (guest.id === 'c' && ack.operation === 'install') {
      possibleLease = ack.token; reached.resolve(); return hold.promise.then(() => ack);
    }
    return ack;
  });
  const auxiliary = f.authority.grant('c'); await reached.promise;
  f.setSelected('b'); const selected = f.authority.select('b');
  assert.equal((await auxiliary).status, 'cancelled');
  await turns();
  assert.equal(f.executor.pendingCount(), 1, 'cancelled acknowledgement still occupies the physical raw lock');
  assert.equal(f.commits.length, 1, 'new primary cannot commit while old grant script is unresolved');
  hold.resolve();
  assert.equal((await selected).status, 'completed');
  assert.equal(f.executor.pendingCount(), 0);
  assert.ok(f.controls.some(item => item.guest === 'c' && item.operation === 'revoke'));
  assert.equal(vm.runInContext(authorityModule.guardedScript('window.mutations++', possibleLease), f.guest('c').context), null);
  assert.equal(f.guest('c').context.window.mutations, 0);
});

test('real executor retains a timed-out pre-configuration or unscoped raw script across authority transitions', async () => {
  const f = fixture({ realExecutor: true, timeoutMs: 25 });
  const delayed = deferred(); f.guest('c').context.delayed = delayed.promise;
  const raw = f.executor.run(f.guest('c'), 'delayed', { tag: 'external-read', timeoutMs: 5, authority: false });
  assert.equal(await raw, null);
  assert.equal((await f.authority.select('a')).status, 'blocked');
  assert.equal(f.executor.pendingCount(), 1);
  assert.equal(f.commits.length, 0);
  delayed.resolve('late'); await turns();
  assert.equal((await f.authority.select('a')).status, 'completed');
  assert.equal(f.executor.pendingCount(), 0);
});

test('real executor suppresses stale delayed results and direct guest scripts after A-B-A and same-URL document replacement', async () => {
  const f = fixture({ realExecutor: true, timeoutMs: 500 }); await f.authority.select('a');
  const old = f.authority.leaseFor('a'), delayed = deferred(); f.guest('a').context.delayed = delayed.promise;
  const observation = f.executor.run(f.guest('a'), 'delayed', { tag: 'body', authorityToken: old });
  f.setSelected('b'); const transfer = f.authority.select('b');
  delayed.resolve({ outcome: 'old observation' });
  assert.equal(await observation, null);
  assert.equal((await transfer).status, 'completed');
  f.setSelected('a'); await f.authority.select('a');
  assert.equal(await f.executor.run(f.guest('a'), 'window.mutations++', { authorityToken: old }), null);
  f.replace('a'); await turns();
  assert.equal((await f.authority.select('a')).status, 'completed');
  assert.equal(f.authority.leaseFor('a').documentGeneration, 1);
  assert.equal(await f.executor.run(f.guest('a'), 'window.mutations++', { authorityToken: old }), null);
  assert.equal(f.guest('a').context.window.mutations, 0);
});

test('real executor permits paused explicit one-shot writes and stamps host-validated results without recurring authority', async () => {
  const f = fixture({ realExecutor: true, paused: true }); let lease;
  const value = await f.authority.withManualLease('a', async token => {
    lease = token;
    assert.equal(await f.executor.run(f.guest('a'), 'window.mutations++'), null);
    const result = await f.executor.run(f.guest('a'), `(() => {
      const api = window.__aliveAuthority;
      window.callback = api.guard(api.executingToken, () => window.mutations += 10);
      return { action: 'morph', value: ++window.mutations };
    })()`, { authorityToken: token });
    assert.equal(f.authority.validateCommand(result, 'a'), true);
    return result;
  });
  assert.equal(value.value, 1);
  assert.equal(authorityModule.sameToken(value.authority, lease), true);
  assert.equal(f.authority.isCurrent(lease), false);
  vm.runInContext('window.callback()', f.guest('a').context);
  assert.equal(f.guest('a').context.window.mutations, 1);
  assert.equal(f.authority.snapshot().paused, true);
  assert.equal(f.executor.pendingCount(), 0);
});

test('loading readiness prevents new grants but never hides a still-live source from revocation', async () => {
  const f = fixture({ realExecutor: true }); await f.authority.select('a'); const old = f.authority.leaseFor('a');
  f.guest('a').ready = false;
  f.setSelected('b'); assert.equal((await f.authority.select('b')).status, 'completed');
  assert.ok(f.controls.some(item => item.guest === 'a' && item.operation === 'revoke'));
  assert.equal(vm.runInContext(authorityModule.guardedScript('window.mutations++', old), f.guest('a').context), null);
  assert.equal((await f.authority.grant('a')).status, 'blocked');
  assert.equal(f.guest('a').context.window.mutations, 0);
});

test('pause revokes persistent guest callbacks before waiting on an unresolved async raw result', async () => {
  const f = fixture({ realExecutor: true, timeoutMs: 25 }); await f.authority.select('a');
  await f.executor.run(f.guest('a'), `window.callback = window.__aliveAuthority.guard(window.__aliveAuthority.executingToken, () => ++window.mutations); true;`);
  const delayed = deferred(); f.guest('a').context.delayed = delayed.promise;
  const raw = f.executor.run(f.guest('a'), 'delayed', { tag: 'body', timeoutMs: 5 });
  const paused = f.authority.setPaused(true);
  await turns(24);
  vm.runInContext('window.callback()', f.guest('a').context);
  assert.equal(f.guest('a').context.window.mutations, 0, 'revocation is not held hostage by the unresolved result');
  assert.equal(f.executor.pendingCount(), 1, 'raw execution remains retained');
  assert.equal((await paused).status, 'blocked', 'unsettled physical drain is reported honestly');
  assert.equal(await raw, null);
  delayed.resolve(null); await turns();
  assert.equal(f.executor.pendingCount(), 0);
});

test('a selection aborted before its first turn still performs bounded guest revocation cleanup', async () => {
  const f = fixture({ realExecutor: true }); await f.authority.select('a'); const old = f.authority.leaseFor('a');
  const abort = new AbortController(); f.setSelected('b');
  const selection = f.authority.select('b', { signal: abort.signal }); abort.abort();
  assert.equal((await selection).status, 'cancelled');
  await turns(30);
  assert.equal(vm.runInContext(authorityModule.guardedScript('window.mutations++', old), f.guest('a').context), null);
  assert.equal(f.guest('a').context.window.mutations, 0);
  assert.equal(f.authority.snapshot().transitioning, false);
  assert.equal(f.commits.length, 1);
});

test('paused A-B-A browser selection immediately fences an outstanding manual guest result and host commit', async () => {
  const f = fixture({ realExecutor: true, paused: true }), delayed = deferred(), started = deferred();
  let token, imports = 0;
  f.guest('a').context.delayed = delayed.promise;
  const manual = f.authority.withManualLease('a', async permit => {
    token = permit;
    const result = f.executor.run(f.guest('a'), 'delayed', { tag: 'body', authorityToken: permit });
    started.resolve();
    const value = await result;
    if (f.authority.isCurrent(permit)) imports++;
    return value;
  });
  await started.promise;
  f.setSelected('b'); const away = f.authority.select('b');
  assert.equal(f.authority.isCurrent(token), false, 'selection invalidates synchronously before the guest responds');
  f.setSelected('a'); const back = f.authority.select('a');
  delayed.resolve({ stale: true });
  assert.notEqual((await manual)?.status, 'completed');
  await away; await back; await turns();
  assert.equal(imports, 0);
  assert.equal(f.authority.snapshot().paused, true);
  assert.equal(f.authority.leaseFor('a'), null);
  assert.equal(vm.runInContext(authorityModule.guardedScript('window.mutations++', token), f.guest('a').context), null);
  assert.equal(f.commits.length, 0);
});
