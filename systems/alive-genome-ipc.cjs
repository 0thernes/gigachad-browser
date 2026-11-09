'use strict';

const { randomUUID } = require('node:crypto');

// The store owns physical I/O. This bridge owns renderer identity and the
// acknowledged close boundary; a deadline never becomes a durability receipt.
function installGenomeIpc({ ipcMain, store, trusted, now = Date.now,
  setTimer = setTimeout, clearTimer = clearTimeout, closeTimeoutMs = 8000, onShutdown = () => {} }) {
  const owners = new WeakMap(), closings = new WeakMap(), verified = new WeakMap();
  let bootstrapTail = Promise.resolve(), lastShutdown = null;
  const denied = () => ({ status: 'blocked', persistenceVerified: false, settled: false, error: 'Unauthorized or obsolete genome owner' });
  const ownerFor = (event, payload) => trusted(event) && payload && typeof payload === 'object' &&
    owners.get(event.sender)?.ownerId === payload.ownerId ? owners.get(event.sender) : null;

  ipcMain.on('alive-genome-bootstrap', event => {
    // sendSync is restricted to this startup-only preload read. Disk loading
    // precedes window creation; a replacement renderer also waits for old I/O.
    bootstrapTail = bootstrapTail.catch(() => {}).then(async () => {
      if (!trusted(event) || closings.has(event.sender)) { event.returnValue = denied(); return; }
      const ownerId = randomUUID();
      try {
        const bootstrap = await store.beginOwner(ownerId);
        if (!trusted(event) || closings.has(event.sender)) { event.returnValue = denied(); return; }
        owners.set(event.sender, { ownerId, epoch: 0 });
        verified.delete(event.sender);
        event.returnValue = { ...bootstrap, ownerId, epoch: 0, previousShutdown: lastShutdown };
      } catch (error) {
        event.returnValue = { status: 'error', json: null, writeAllowed: false,
          error: String(error.message || error).slice(0, 300) };
      }
    });
  });
  ipcMain.handle('alive-genome-commit', async (event, payload) => {
    const owner = ownerFor(event, payload);
    if (!owner || closings.get(event.sender)?.sealed) return denied();
    const result = await store.commit({ ownerId: payload.ownerId, epoch: payload.epoch, jobId: payload.jobId, json: payload.json });
    if (owners.get(event.sender) === owner && result.status === 'persisted' && result.persistenceVerified === true) verified.set(event.sender, { ...result });
    return result;
  });
  ipcMain.handle('alive-genome-fence', async (event, payload) => {
    const owner = ownerFor(event, payload);
    if (!owner || closings.get(event.sender)?.sealed) return denied();
    const result = await store.fence({ ownerId: payload.ownerId, epoch: payload.epoch });
    if (result.settled && owners.get(event.sender) === owner) owner.epoch = result.epoch;
    return result;
  });
  ipcMain.handle('alive-genome-read', async (event, payload) => {
    const owner = ownerFor(event, payload);
    if (!owner || closings.get(event.sender)?.sealed || payload.epoch !== owner.epoch) return denied();
    const record = await store.readVerified();
    if (owners.get(event.sender) !== owner || payload.epoch !== owner.epoch) return denied();
    return { ...record, ownerId: owner.ownerId, epoch: owner.epoch };
  });
  ipcMain.handle('alive-genome-close-result', (event, payload) => {
    const owner = ownerFor(event, payload), closing = closings.get(event.sender);
    if (!owner || !closing || closing.sealed || closing.owner !== owner || payload.requestId !== closing.requestId) return denied();
    closing.sealed = true;
    closing.acknowledge(payload.result);
    return { status: 'acknowledged' };
  });

  function guardWindow(win) {
    const contents = win.webContents;
    let allowed = false, pending = null;
    function deadline(promise, label, deadlineAt) {
      return new Promise(resolve => {
        let done = false;
        const finish = value => { if (done) return; done = true; clearTimer(timer); resolve(value); };
        const timer = setTimer(() => finish({ status: 'failed', persistenceVerified: false,
          settled: false, error: label + ' deadline expired' }), Math.max(1, deadlineAt - now()));
        Promise.resolve(promise).then(finish, error => finish({ status: 'failed', persistenceVerified: false,
          settled: false, error: String(error.message || error).slice(0, 300) }));
      });
    }
    async function closeBoundary() {
      const startedAt = now(), deadlineAt = startedAt + closeTimeoutMs;
      const requestId = randomUUID();
      let acknowledge;
      const ack = new Promise(resolve => { acknowledge = resolve; });
      const closing = { requestId, acknowledge, owner: owners.get(contents), sealed: false };
      closings.set(contents, closing);
      let result;
      try {
        if (contents.isDestroyed()) result = { status: 'failed', persistenceVerified: false, error: 'Renderer already destroyed' };
        else {
          contents.send('alive-genome-close-request', { requestId, deadlineAt });
          result = await deadline(ack, 'Renderer final save', deadlineAt);
        }
        closing.sealed = true;
        const drain = await deadline(Promise.resolve().then(() => store.drain()),
          'Physical genome drain', deadlineAt);
        const receipt = verified.get(contents);
        const matched = owners.get(contents) === closing.owner && receipt &&
          ['ownerId', 'epoch', 'jobId', 'revision', 'digest'].every(key => result?.[key] === receipt[key]);
        lastShutdown = { at: now(), durationMs: Math.max(0, now() - startedAt),
          status: matched && result?.status === 'persisted' && result.persistenceVerified === true && drain.settled
            ? 'persisted-and-drained' : 'unverified',
          persistenceVerified: Boolean(matched && result?.status === 'persisted' && result.persistenceVerified === true && drain.settled === true),
          renderer: result, drain, scope: 'Acknowledged genome snapshot and main-owned storage queue; not an OS power-loss guarantee' };
        await deadline(Promise.resolve().then(() => onShutdown(lastShutdown)), 'Shutdown receipt recording', deadlineAt + 500);
        return lastShutdown;
      } finally { closing.sealed = true; }
    }
    win.on('close', event => {
      if (allowed) return;
      event.preventDefault();
      if (pending) return;
      pending = closeBoundary().catch(error => {
        lastShutdown = { at: now(), status: 'unverified', persistenceVerified: false, error: String(error.message || error) };
        return lastShutdown;
      }).finally(() => {
        // A failed deadline is explicit; it cannot release a store job as
        // settled. An unverified shutdown does not claim the newest state saved.
        allowed = true;
        if (!win.isDestroyed()) win.close();
      });
    });
    win.once('closed', () => { closings.delete(contents); owners.delete(contents); verified.delete(contents); });
    return { isAllowed: () => allowed, pending: () => pending };
  }
  return { guardWindow, snapshot: () => ({ lastShutdown }) };
}

module.exports = { installGenomeIpc };
