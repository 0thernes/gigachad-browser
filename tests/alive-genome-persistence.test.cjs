'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { create } = require('../systems/alive-genome-persistence.js');
const digest = json => createHash('sha256').update(json).digest('hex');
const oldJSON = '{"simulationTick":32,"W_actor":[0.25,-0.5]}';
const bootstrap = (extra = {}) => ({ status: 'ready', json: oldJSON, revision: 3, digest: digest(oldJSON),
  ownerId: 'renderer-one', epoch: 0, writeAllowed: true, ...extra });
const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; };
const receipt = (request, extra = {}) => ({ status: 'persisted', persistenceVerified: true, ownerId: request.ownerId,
  epoch: request.epoch, jobId: request.jobId, revision: 4, digest: digest(request.json), ...extra });
const forbiddenStorage = { getItem() { assert.fail('Canonical bootstrap must not read legacy storage'); } };

test('canonical bootstrap is synchronous and authoritative; snapshot does not expose large JSON', () => {
  const driver = create({ bootstrap: bootstrap(), invoke() { assert.fail('No bootstrap IPC needed'); } });
  assert.equal(driver.initialJSON(forbiddenStorage, 'key'), oldJSON);
  assert.equal(driver.initialJSON(forbiddenStorage, 'key'), oldJSON);
  assert.equal(driver.snapshot().source, 'canonical');
  assert.equal(driver.snapshot().application, 'not-applied');
  driver.markApplied(true);
  assert.equal(driver.snapshot().application, 'applied');
  assert.equal(driver.snapshot().writeAllowed, true);
  assert.equal(Object.hasOwn(driver.snapshot(), 'json'), false);
});

test('only absent canonical bootstrap can read legacy storage, exactly once', () => {
  for (const legacy of [null, oldJSON]) {
    let reads = 0;
    const driver = create({ bootstrap: bootstrap({ status: 'absent', json: null, revision: 0, digest: null }), invoke() {} });
    const storage = { getItem(key) { reads++; assert.equal(key, 'legacy-key'); return legacy; } };
    assert.equal(driver.initialJSON(storage, 'legacy-key'), legacy);
    assert.equal(driver.initialJSON(storage, 'legacy-key'), legacy);
    assert.equal(reads, 1);
    driver.markApplied(Boolean(legacy));
    assert.equal(driver.snapshot().writeAllowed, true);
    assert.equal(driver.snapshot().source, legacy ? 'legacy' : 'none');
  }
});

test('bootstrap/read/application failures never fall back or overwrite preserved canonical data', async () => {
  for (const initial of [bootstrap({ status: 'error', json: null, error: 'corrupt disk', writeAllowed: false }),
    bootstrap({ json: '[]' }), bootstrap({ json: '{broken' }), bootstrap({ writeAllowed: false })]) {
    let calls = 0;
    const driver = create({ bootstrap: initial, invoke() { calls++; } });
    driver.initialJSON(forbiddenStorage, 'key');
    const result = await driver.commit({ epoch: 0, jobId: 1, json: '{}' });
    assert.equal(result.persistenceVerified, false); assert.equal(calls, 0);
    assert.equal(driver.snapshot().writeAllowed, false);
  }
  const driver = create({ bootstrap: bootstrap(), invoke() { assert.fail('Rejected application must block writes'); } });
  driver.initialJSON(forbiddenStorage, 'key'); driver.markApplied(false, { hadJSON: true });
  assert.equal(driver.snapshot().application, 'rejected');
  assert.equal((await driver.commit({ epoch: 0, jobId: 1, json: '{}' })).status, 'cancelled');
  assert.equal(driver.initialJSON(forbiddenStorage, 'key'), oldJSON);
});

test('malformed or unreadable legacy checkpoint closes writes without another storage read', async () => {
  for (const storage of [{ getItem: () => 'null' }, { getItem: () => '[]' }, { getItem() { throw Error('storage unavailable'); } }]) {
    const driver = create({ bootstrap: bootstrap({ status: 'absent', json: null, revision: 0, digest: null }), invoke() { assert.fail('No write'); } });
    assert.equal(driver.initialJSON(storage, 'key'), null);
    assert.equal(driver.initialJSON(forbiddenStorage, 'key'), null);
    assert.equal(driver.snapshot().writeAllowed, false);
    assert.equal((await driver.commit({ epoch: 0, jobId: 1, json: '{}' })).persistenceVerified, false);
  }
});

test('commit updates cache only for a verified matching owner, epoch, job and monotonic revision', async () => {
  for (const mismatch of [{ ownerId: 'different' }, { epoch: 2 }, { jobId: 9 }, { revision: 2 },
    { digest: 'invalid' }, { persistenceVerified: false }, { status: 'failed', error: 'disk full' }]) {
    const driver = create({ bootstrap: bootstrap(), invoke: async (channel, request) => {
      assert.equal(channel, 'alive-genome-commit'); return receipt(request, mismatch);
    } });
    const result = await driver.commit({ epoch: 0, jobId: 1, json: '{"simulationTick":99}' });
    assert.equal(result.persistenceVerified, false);
    assert.equal(driver.initialJSON(forbiddenStorage, 'key'), oldJSON);
    assert.equal(driver.snapshot().revision, 3);
  }
  const nextJSON = '{"simulationTick":100}';
  const driver = create({ bootstrap: bootstrap(), invoke: async (_channel, request) => receipt(request) });
  assert.equal((await driver.commit({ epoch: 0, jobId: 1, json: nextJSON })).persistenceVerified, true);
  assert.equal(driver.initialJSON(forbiddenStorage, 'key'), nextJSON);
  assert.equal(driver.snapshot().verifiedWrites, 1);
});

test('a fence closes admission immediately and a late old commit cannot replace the cache', async () => {
  const write = deferred(), barrier = deferred(), calls = [];
  const driver = create({ bootstrap: bootstrap(), invoke(channel, request) {
    calls.push({ channel, request }); return channel === 'alive-genome-commit' ? write.promise : barrier.promise;
  } });
  const pending = driver.commit({ epoch: 0, jobId: 1, json: '{"oldJob":true}' });
  const fenced = driver.fence({ epoch: 1 });
  assert.equal(driver.snapshot().writeAllowed, false);
  assert.equal((await driver.commit({ epoch: 1, jobId: 2, json: '{}' })).status, 'cancelled');
  write.resolve(receipt(calls[0].request));
  assert.equal((await pending).status, 'cancelled');
  assert.equal(driver.initialJSON(forbiddenStorage, 'key'), oldJSON);
  barrier.resolve({ settled: true, ownerId: 'renderer-one', epoch: 1 });
  assert.equal((await fenced).settled, true);
  assert.equal(driver.snapshot().epoch, 1); assert.equal(driver.snapshot().writeAllowed, true);
  assert.equal(driver.snapshot().pending, 0);
});

test('a wrong or failed fence acknowledgement keeps write admission closed', async () => {
  for (const reply of [{ settled: false, error: 'readback pending' }, { settled: true, ownerId: 'other', epoch: 1 },
    { settled: true, ownerId: 'renderer-one', epoch: 0 }]) {
    const driver = create({ bootstrap: bootstrap(), invoke: async () => reply });
    assert.equal((await driver.fence({ epoch: 1 })).settled, false);
    assert.equal(driver.snapshot().writeAllowed, false);
  }
  const quarantined = create({ bootstrap: bootstrap(), invoke: async (_channel, payload) => ({ settled: true, writeAllowed: false, ...payload }) });
  assert.equal((await quarantined.fence({ epoch: 1 })).settled, true, 'physical drain and write permission are distinct');
  assert.equal(quarantined.snapshot().writeAllowed, false, 'main-store quarantine remains authoritative after successful drain');
});

test('fresh read requires validated main data and cannot accept a read superseded by fencing', async () => {
  const nextJSON = '{"simulationTick":101}';
  const driver = create({ bootstrap: bootstrap(), invoke: async (channel, payload) => {
    assert.equal(channel, 'alive-genome-read'); assert.deepEqual(payload, { ownerId: 'renderer-one', epoch: 0 });
    return { status: 'ready', json: nextJSON, revision: 4, digest: digest(nextJSON), writeAllowed: true, ...payload };
  } });
  assert.equal((await driver.readFresh()).json, nextJSON);
  assert.equal(driver.initialJSON(forbiddenStorage, 'key'), nextJSON);
  const delayed = deferred();
  const stale = create({ bootstrap: bootstrap(), invoke: async (channel, payload) => channel === 'alive-genome-read'
    ? delayed.promise : { settled: true, ...payload } });
  const reading = stale.readFresh(); await stale.fence({ epoch: 1 });
  delayed.resolve({ status: 'ready', json: nextJSON, revision: 4, digest: digest(nextJSON), writeAllowed: true });
  assert.equal((await reading).status, 'error');
  assert.equal(stale.initialJSON(forbiddenStorage, 'key'), oldJSON);
  const corrupt = create({ bootstrap: bootstrap(), invoke: async (_channel, payload) => ({ status: 'ready', json: '[]', revision: 4, digest: 'a'.repeat(64), writeAllowed: true, ...payload }) });
  assert.equal((await corrupt.readFresh()).status, 'error'); assert.equal(corrupt.snapshot().writeAllowed, false);
  assert.equal(corrupt.initialJSON(forbiddenStorage, 'key'), oldJSON);
});

test('late failures from fenced writes, reads and fences cannot poison a newer verified cache or admission', async () => {
  for (const operation of ['commit', 'read', 'fence']) {
    const delayed = deferred(); let delayedOnce = false;
    const driver = create({ bootstrap: bootstrap(), invoke: async (channel, payload) => {
      if (!delayedOnce && channel === 'alive-genome-' + operation) { delayedOnce = true; return delayed.promise; }
      if (channel === 'alive-genome-fence') return { settled: true, ...payload };
      return receipt(payload);
    } });
    const old = operation === 'commit' ? driver.commit({ epoch: 0, jobId: 1, json: '{}' })
      : operation === 'read' ? driver.readFresh() : driver.fence({ epoch: 1 });
    assert.equal((await driver.fence({ epoch: 2 })).settled, true);
    const nextJSON = '{"newOwnerEpoch":2}';
    assert.equal((await driver.commit({ epoch: 2, jobId: 2, json: nextJSON })).persistenceVerified, true);
    delayed.reject(Error('obsolete I/O failed')); await old;
    assert.equal(driver.snapshot().writeAllowed, true, operation);
    assert.equal(driver.snapshot().lastOutcome, 'persisted', operation);
    assert.equal(driver.snapshot().error, '', operation);
    assert.equal(driver.initialJSON(forbiddenStorage, 'key'), nextJSON, operation);
  }
});

test('fresh reads reject missing or mismatched owner and epoch receipts', async () => {
  for (const mismatch of [{ ownerId: undefined }, { ownerId: 'other' }, { epoch: undefined }, { epoch: 1 }]) {
    const driver = create({ bootstrap: bootstrap(), invoke: async (_channel, payload) => ({ ...bootstrap(), ...payload, ...mismatch }) });
    assert.equal((await driver.readFresh()).status, 'error');
    assert.equal(driver.initialJSON(forbiddenStorage, 'key'), oldJSON);
    assert.equal(driver.snapshot().writeAllowed, false);
  }
});
