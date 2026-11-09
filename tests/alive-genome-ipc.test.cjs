'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { installGenomeIpc } = require('../systems/alive-genome-ipc.cjs');
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

function fixture() {
  const ipcMain = new EventEmitter(), handlers = new Map(), timers = new Map();
  let clock = 0, timerId = 0, currentOwner, gate = null;
  ipcMain.handle = (channel, handler) => handlers.set(channel, handler);
  const win = new EventEmitter(), sent = [], calls = [], receipts = [];
  win.destroyed = false;
  win.isDestroyed = () => win.destroyed;
  win.webContents = { isDestroyed: () => win.destroyed, send: (channel, payload) => sent.push({ channel, payload }) };
  win.close = () => { let prevented = false; win.emit('close', { preventDefault() { prevented = true; } }); if (!prevented) win.destroyed = true; };
  const store = {
    async beginOwner(ownerId) { calls.push('begin'); currentOwner = ownerId; return { status: 'absent', json: null, writeAllowed: true, revision: 0 }; },
    async commit(payload) { calls.push(['commit', payload]); return { ...payload, json: undefined, status: 'persisted', persistenceVerified: true, revision: 1, digest: 'a'.repeat(64) }; },
    async fence(payload) { calls.push(['fence', payload]); return { ...payload, settled: true }; },
    async readVerified() { calls.push('read'); return { status: 'ready', json: '{}', revision: 1, digest: 'a'.repeat(64), writeAllowed: true }; },
    async drain() { calls.push('drain'); if (gate) await gate.promise; return { settled: true }; }
  };
  const trusted = event => event.allowed === true && event.sender === win.webContents;
  const api = installGenomeIpc({ ipcMain, store, trusted, now: () => clock,
    setTimer(fn, ms) { const id = ++timerId; timers.set(id, { fn, at: clock + ms }); return id; },
    clearTimer(id) { timers.delete(id); }, closeTimeoutMs: 100, onShutdown: result => receipts.push(result) });
  const guard = api.guardWindow(win);
  const event = () => ({ allowed: true, sender: win.webContents });
  return { api, guard, win, sent, calls, receipts, handlers, timers, store,
    event, owner: () => currentOwner,
    async boot(allowed = true) { const ev = { ...event(), allowed }; ipcMain.emit('alive-genome-bootstrap', ev); await settle(); return ev.returnValue; },
    invoke: (channel, payload, allowed = true) => handlers.get(channel)({ ...event(), allowed }, payload),
    blockDrain() { return gate = deferred(); },
    advance(ms) { clock += ms; for (const [id, timer] of [...timers]) if (timer.at <= clock) { timers.delete(id); timer.fn(); } }
  };
}

test('only trusted chrome bootstrap can create an owner; each renderer bootstrap gets a fresh identity', async () => {
  const f = fixture();
  assert.equal((await f.boot(false)).status, 'blocked'); assert.equal(f.calls.length, 0);
  const first = await f.boot(), second = await f.boot();
  assert.equal(first.status, 'absent'); assert.notEqual(first.ownerId, second.ownerId);
  assert.equal(first.epoch, 0);
  assert.equal((await f.invoke('alive-genome-commit', { ownerId: first.ownerId })).status, 'blocked');
});

test('all genome channels deny untrusted senders and obsolete owners before touching storage', async () => {
  const f = fixture(), boot = await f.boot();
  for (const channel of ['alive-genome-commit', 'alive-genome-fence', 'alive-genome-read', 'alive-genome-close-result']) {
    for (const [ownerId, allowed] of [[boot.ownerId, false], ['obsolete', true]]) {
      assert.equal((await f.invoke(channel, { ownerId, epoch: 0 }, allowed)).status, 'blocked');
    }
  }
  assert.deepEqual(f.calls, ['begin']);
});

test('fence receipt changes the accepted read epoch; a stale read cannot claim the current generation', async () => {
  const f = fixture(), boot = await f.boot();
  const pending = deferred(); f.store.readVerified = () => pending.promise;
  const read = f.invoke('alive-genome-read', { ownerId: boot.ownerId, epoch: 0 });
  await f.invoke('alive-genome-fence', { ownerId: boot.ownerId, epoch: 1 });
  pending.resolve({ status: 'ready', json: '{}' });
  assert.equal((await read).status, 'blocked');
  assert.equal((await f.invoke('alive-genome-read', { ownerId: boot.ownerId, epoch: 0 })).status, 'blocked');
});

test('close waits for a matched renderer receipt and actual store drain; duplicate close does not duplicate work', async () => {
  const f = fixture(), boot = await f.boot(), drain = f.blockDrain();
  f.win.close(); f.win.close(); await settle();
  assert.equal(f.sent.length, 1); assert.equal(f.win.destroyed, false);
  const requestId = f.sent[0].payload.requestId;
  assert.equal((await f.invoke('alive-genome-close-result', { ownerId: boot.ownerId, requestId: 'wrong' })).status, 'blocked');
  const result = await f.invoke('alive-genome-commit', { ownerId: boot.ownerId, epoch: 0, jobId: 1, json: '{}' });
  await f.invoke('alive-genome-close-result', { ownerId: boot.ownerId, requestId,
    result });
  assert.equal((await f.boot()).status, 'blocked', 'renderer reload cannot install a new writer while closing');
  assert.equal((await f.invoke('alive-genome-commit', { ownerId: boot.ownerId, epoch: 0, jobId: 2, json: '{}' })).status, 'blocked');
  await settle(); assert.equal(f.win.destroyed, false); assert.equal(f.receipts.length, 0);
  drain.resolve(); await settle();
  assert.equal(f.win.destroyed, true); assert.equal(f.receipts[0].status, 'persisted-and-drained');
  assert.equal(f.timers.size, 0);
});

test('close deadline reports unverified persistence, never a fabricated renderer or physical drain acknowledgement', async () => {
  const f = fixture(); await f.boot(); const drain = f.blockDrain();
  f.win.close(); f.advance(100); await settle(); f.advance(1); await settle();
  assert.equal(f.win.destroyed, true); assert.equal(f.receipts[0].status, 'unverified');
  assert.equal(f.receipts[0].persistenceVerified, false); assert.equal(f.receipts[0].drain.settled, false);
  drain.resolve(); await settle(); assert.equal(f.receipts[0].persistenceVerified, false);
});

test('a renderer assertion without a matching verified store receipt cannot certify close', async () => {
  const f = fixture(), boot = await f.boot(); f.win.close();
  await f.invoke('alive-genome-close-result', { ownerId: boot.ownerId, requestId: f.sent[0].payload.requestId,
    result: { status: 'persisted', persistenceVerified: true, revision: 1, digest: 'a'.repeat(64) } });
  await settle(); assert.equal(f.win.destroyed, true); assert.equal(f.receipts[0].persistenceVerified, false);
});
