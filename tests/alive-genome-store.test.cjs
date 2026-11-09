'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createStore, SCHEMA, FILENAME, MIGRATION_BACKUP_FILENAME, MAX_PAYLOAD_BYTES, MAX_HEADER_BYTES } = require('../systems/alive-genome-store.cjs');
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const tick = () => new Promise(resolve => setImmediate(resolve));
const error = code => Object.assign(new Error('Injected ' + code), { code });

async function fixture(t, makeIo) {
  const base = path.resolve(os.tmpdir());
  const directory = await fs.mkdtemp(path.join(base, 'gigachad-genome-store-test-'));
  t.after(async () => {
    const resolved = path.resolve(directory);
    assert.equal(path.dirname(resolved), base);
    assert.ok(path.basename(resolved).startsWith('gigachad-genome-store-test-'));
    await fs.rm(resolved, { recursive: true, force: true });
  });
  const canonical = path.join(directory, FILENAME);
  const store = createStore({ directory, ...(makeIo ? { fs: makeIo({ canonical, directory }) } : {}) });
  return { store, directory, canonical, async own(id = 'owner-a') { return store.beginOwner(id); },
    async save(json = '{"value":1}', jobId = 1, epoch = 0, ownerId = 'owner-a') { return store.commit({ ownerId, epoch, jobId, json }); } };
}
function proxyHandle(handle, overrides) {
  return new Proxy(handle, { get(target, key) {
    if (key in overrides) return overrides[key];
    const value = Reflect.get(target, key, target);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
}
function record(json, changes = {}) {
  const payload = Buffer.from(json, 'utf8');
  const header = { schema: SCHEMA, revision: 1, byteLength: payload.length,
    sha256: createHash('sha256').update(payload).digest('hex'), savedAt: '2026-11-09T00:00:00.000Z', ...changes };
  return Buffer.concat([Buffer.from(JSON.stringify(header) + '\n'), payload]);
}

async function backup(f, changes = {}) {
  const snapshot = f.store.snapshot();
  return f.store.backupMigration({ ownerId: snapshot.ownerId, epoch: snapshot.epoch, requestId: 'backup-request',
    expectedRevision: snapshot.revision, expectedDigest: snapshot.digest, ...changes });
}
function migration(receipt) {
  return { backupId: receipt.backupId, expectedRevision: receipt.sourceRevision, expectedDigest: receipt.sourceDigest };
}

test('first commit fsyncs and verifies exact legacy UTF-8 JSON; restart advances durable revision', async t => {
  const operations = [];
  const f = await fixture(t, () => ({ ...fs,
    async open(filename, flags, mode) {
      const handle = await fs.open(filename, flags, mode);
      operations.push(flags === 'wx' ? 'temp-open' : 'read-open');
      return flags === 'wx' ? proxyHandle(handle, {
        async sync() { operations.push('file-sync'); return handle.sync(); }
      }) : handle;
    }, async rename(from, to) { operations.push('rename'); return fs.rename(from, to); }
  }));
  assert.deepEqual(await f.store.initialize(), { status: 'absent', json: null, revision: 0, digest: null, error: null, writeAllowed: true });
  assert.equal((await f.own()).epoch, 0);
  const json = '{\n  "unicode": "🧬", "negativeZero": -0, "order": [3,2,1]\n}\n';
  const result = await f.save(json);
  assert.equal(result.status, 'persisted'); assert.equal(result.persistenceVerified, true); assert.equal(result.revision, 1);
  assert.match(result.digest, /^[0-9a-f]{64}$/);
  assert.ok(operations.indexOf('file-sync') < operations.indexOf('rename'));
  assert.equal(operations.at(-1), 'read-open', 'verification independently reopens the canonical file');
  const bytes = await fs.readFile(f.canonical), boundary = bytes.indexOf(10);
  const header = JSON.parse(bytes.subarray(0, boundary));
  assert.ok(boundary <= MAX_HEADER_BYTES); assert.equal(header.byteLength, Buffer.byteLength(json));
  assert.equal(bytes.subarray(boundary + 1).toString('utf8'), json);
  const next = createStore({ directory: f.directory });
  const bootstrap = await next.initialize();
  assert.equal(bootstrap.json, json); assert.equal(bootstrap.revision, 1); assert.equal(bootstrap.digest, result.digest);
  await next.beginOwner('owner-restart');
  const second = await next.commit({ ownerId: 'owner-restart', epoch: 0, jobId: 1, json: '{"value":2}' });
  assert.equal(second.status, 'persisted'); assert.equal(second.revision, 2);
  assert.equal((await next.readVerified()).json, '{"value":2}');
  assert.equal('json' in next.snapshot(), false, 'recurring metadata snapshot must not copy full payload');
  assert.deepEqual(await fs.readdir(f.directory), [FILENAME]);
});

test('invalid payloads and duplicate/out-of-order job IDs never overwrite canonical state', async t => {
  const f = await fixture(t); await f.own(); await f.save();
  const before = await fs.readFile(f.canonical);
  for (const json of ['null', '[]', '"text"', '{', '', '{"bad":"\ud800"}', '{"oversized":"' + 'x'.repeat(MAX_PAYLOAD_BYTES) + '"}']) {
    const jobId = f.store.snapshot().active ? 100 : 2;
    const result = await f.save(json, jobId);
    assert.equal(result.status, 'blocked'); assert.equal(result.persistenceVerified, false);
  }
  assert.equal((await f.save('{"duplicate":true}', 1)).status, 'blocked');
  assert.equal((await f.save('{"duplicate":true}', 2)).status, 'blocked');
  assert.equal((await f.save('{"value":3}', 3)).status, 'persisted');
  assert.notDeepEqual(await fs.readFile(f.canonical), before);
  assert.equal(f.store.snapshot().revision, 2);
});

test('each invalid payload is rejected before creating any file', async t => {
  const f = await fixture(t); await f.own();
  const values = ['null', '[]', '1', 'false', '"object"', '{', '', '{"bad":"\ud800"}', '{"big":"' + 'x'.repeat(MAX_PAYLOAD_BYTES) + '"}'];
  for (let i = 0; i < values.length; i++) assert.equal((await f.save(values[i], i + 1)).status, 'blocked');
  assert.deepEqual(await fs.readdir(f.directory), []);
  assert.equal((await f.save('{}', values.length + 1)).revision, 1);
});

test('fence while temp file sync is pending cancels active and queued publications and drains before acknowledgement', async t => {
  const entered = deferred(), release = deferred(); let held = false;
  const f = await fixture(t, () => ({ ...fs, async open(filename, flags, mode) {
    const handle = await fs.open(filename, flags, mode);
    return flags === 'wx' ? proxyHandle(handle, { async sync() {
      if (held) { entered.resolve(); await release.promise; }
      return handle.sync();
    } }) : handle;
  } }));
  await f.own(); await f.save(); const prior = await fs.readFile(f.canonical); held = true;
  const active = f.save('{"value":2}', 2); await entered.promise;
  const queued = f.save('{"value":3}', 3);
  let settled = false;
  const fence = f.store.fence({ ownerId: 'owner-a', epoch: 1 }).then(value => { settled = true; return value; });
  assert.equal(f.store.snapshot().epoch, 1); assert.equal(f.store.snapshot().ownerReady, false);
  await tick(); assert.equal(settled, false);
  assert.equal((await f.save('{"old":true}', 4)).status, 'blocked');
  release.resolve();
  assert.equal((await active).status, 'cancelled'); assert.equal((await queued).status, 'cancelled');
  assert.equal((await fence).settled, true); assert.deepEqual(await fs.readFile(f.canonical), prior);
  assert.deepEqual(await fs.readdir(f.directory), [FILENAME]);
  assert.equal((await f.save('{"newEpoch":true}', 4, 1)).status, 'persisted');
});

test('fence inside entered rename waits for physical publication and suppresses its stale acknowledgement', async t => {
  const entered = deferred(), release = deferred(); let hold = false;
  const f = await fixture(t, () => ({ ...fs, async rename(from, to) {
    if (hold) { entered.resolve(); await release.promise; }
    return fs.rename(from, to);
  } }));
  await f.own(); await f.save(); hold = true;
  const job = f.save('{"value":2}', 2); await entered.promise;
  let settled = false;
  const fence = f.store.fence({ ownerId: 'owner-a', epoch: 1 }).then(value => { settled = true; return value; });
  await tick(); assert.equal(settled, false); release.resolve();
  const cancelled = await job;
  assert.equal(cancelled.status, 'cancelled'); assert.equal(cancelled.persistenceVerified, false); assert.equal(cancelled.revision, 2);
  assert.equal((await fence).settled, true);
  assert.equal((await f.store.readVerified()).json, '{"value":2}', 'already-entered physical rename is observed truthfully');
  const next = await f.own('owner-new'); assert.equal(next.json, '{"value":2}'); assert.equal(next.revision, 2);
  assert.equal((await f.save('{"next":true}', 1, 0, 'owner-new')).revision, 3);
});

test('new owner immediately rejects old admission and waits through pending independent readback', async t => {
  const entered = deferred(), release = deferred(); let hold = false, store;
  const f = await fixture(t, ({ canonical }) => ({ ...fs, async open(filename, flags, mode) {
    if (hold && filename === canonical && flags === 'r' && store.snapshot().active?.phase === 'verifying') {
      entered.resolve(); await release.promise;
    }
    return fs.open(filename, flags, mode);
  } }));
  store = f.store;
  await f.own(); await f.save(); hold = true;
  const old = f.save('{"duringReadback":true}', 2); await entered.promise;
  let ready = false;
  const next = f.own('owner-b').then(value => { ready = true; return value; });
  assert.equal((await f.save('{"stale":true}', 3)).status, 'blocked');
  await tick(); assert.equal(ready, false); release.resolve();
  assert.equal((await old).status, 'cancelled');
  const bootstrap = await next;
  assert.equal(bootstrap.json, '{"duringReadback":true}'); assert.equal(bootstrap.revision, 2);
  assert.equal(bootstrap.ownerId, 'owner-b'); assert.equal(bootstrap.epoch, 0);
  assert.equal((await f.own('owner-b')).writeAllowed, false, 'owner IDs cannot be reused with a reset epoch');
});

test('competing owner transitions grant only the newest owner and stale fences never lower its epoch', async t => {
  const f = await fixture(t); await f.own();
  const first = f.own('owner-b'), second = f.own('owner-c');
  assert.equal((await first).writeAllowed, false); assert.equal((await second).writeAllowed, true);
  assert.equal((await f.store.fence({ ownerId: 'owner-a', epoch: 100 })).settled, false);
  assert.equal((await f.store.fence({ ownerId: 'owner-c', epoch: 3 })).settled, true);
  assert.equal((await f.store.fence({ ownerId: 'owner-c', epoch: 2 })).settled, false);
  assert.equal(f.store.snapshot().epoch, 3);
  assert.equal((await f.save('{}', 1, 0, 'owner-c')).status, 'blocked');
  assert.equal((await f.save('{}', 1, 3, 'owner-c')).status, 'persisted');
});

test('an older owner bootstrap read cannot roll back or quarantine a newer owner commit', async t => {
  for (const staleReadFails of [false, true]) {
    const entered = deferred(), release = deferred(); let hold = false, store;
    const f = await fixture(t, ({ canonical }) => ({ ...fs, async open(filename, flags, mode) {
      const handle = await fs.open(filename, flags, mode);
      if (hold && filename === canonical && flags === 'r' && store.snapshot().ownerId === 'owner-b') {
        hold = false;
        return proxyHandle(handle, { async close() {
          await handle.close(); entered.resolve(); await release.promise;
          if (staleReadFails) throw error('EIO');
        } });
      }
      return handle;
    } }));
    store = f.store; await f.own(); await f.save(); hold = true;
    const oldBootstrap = f.own('owner-b'); await entered.promise;
    assert.equal((await store.fence({ ownerId: 'owner-b', epoch: 0 })).settled, false,
      'fence must not grant admission before bootstrap validation settles');
    assert.equal((await f.own('owner-c')).writeAllowed, true);
    const newer = await f.save('{"newOwner":2}', 1, 0, 'owner-c');
    assert.equal(newer.revision, 2, JSON.stringify(newer));
    release.resolve(); assert.equal((await oldBootstrap).writeAllowed, false);
    assert.equal(store.snapshot().revision, 2); assert.equal(store.snapshot().writeAllowed, true);
    assert.equal((await f.save('{"newOwner":3}', 2, 0, 'owner-c')).revision, 3);
  }
});

test('valid queued jobs publish in admission order with only one physical writer', async t => {
  const entered = deferred(), release = deferred(); let opens = 0, hold = true;
  const f = await fixture(t, () => ({ ...fs,
    async open(filename, flags, mode) { if (flags === 'wx') opens++; return fs.open(filename, flags, mode); },
    async rename(from, to) { if (hold) { hold = false; entered.resolve(); await release.promise; } return fs.rename(from, to); }
  }));
  await f.own();
  const first = f.save('{"ordered":1}', 1); await entered.promise;
  const second = f.save('{"ordered":2}', 2), third = f.save('{"ordered":3}', 3);
  await tick(); assert.equal(opens, 1);
  release.resolve();
  const results = await Promise.all([first, second, third]);
  assert.deepEqual(results.map(result => result.status), ['persisted', 'persisted', 'persisted']);
  assert.deepEqual(results.map(result => result.revision), [1, 2, 3]);
  assert.equal((await f.store.readVerified()).json, '{"ordered":3}');
});

test('prepublication quota, sync, and rename errors preserve the canonical record and remove owned temps', async t => {
  for (const failure of ['open', 'write', 'sync', 'rename']) {
    let fail = false;
    const f = await fixture(t, () => ({ ...fs,
      async open(filename, flags, mode) {
        if (fail && flags === 'wx' && failure === 'open') throw error('ENOSPC');
        const handle = await fs.open(filename, flags, mode);
        return flags === 'wx' ? proxyHandle(handle, {
          async writeFile(bytes) { if (fail && failure === 'write') throw error('ENOSPC'); return handle.writeFile(bytes); },
          async sync() { if (fail && failure === 'sync') throw error('EIO'); return handle.sync(); }
        }) : handle;
      }, async rename(from, to) { if (fail && failure === 'rename') throw error('EPERM'); return fs.rename(from, to); }
    }));
    await f.own(); await f.save(); const prior = await fs.readFile(f.canonical); fail = true;
    const result = await f.save('{"failed":true}', 2);
    assert.equal(result.status, 'failed', failure); assert.equal(result.persistenceVerified, false);
    assert.deepEqual(await fs.readFile(f.canonical), prior, failure);
    assert.deepEqual(await fs.readdir(f.directory), [FILENAME], failure);
    assert.equal(f.store.snapshot().writeAllowed, true, 'known unchanged canonical permits a later explicit attempt');
  }
});

test('post-publication read failure resolves unverified, quarantines writes, and still physically drains', async t => {
  let fail = false, store;
  const f = await fixture(t, ({ canonical }) => ({ ...fs, async open(filename, flags, mode) {
    if (fail && filename === canonical && store.snapshot().active?.phase === 'verifying') throw error('EACCES');
    return fs.open(filename, flags, mode);
  } }));
  store = f.store; await f.own(); await f.save(); fail = true;
  const result = await f.save('{"publishedButUnverified":true}', 2);
  assert.equal(result.status, 'verification-failed'); assert.equal(result.persistenceVerified, false);
  assert.equal(store.snapshot().writeAllowed, false); assert.equal((await f.save('{}', 3)).status, 'blocked');
  assert.equal((await store.drain()).settled, true);
  assert.equal((await f.own('owner-after-failure')).writeAllowed, false, 'owner switch cannot silently clear quarantine');
  const reopened = createStore({ directory: f.directory });
  assert.equal((await reopened.initialize()).json, '{"publishedButUnverified":true}', 'restart independently verifies physical truth');
});

test('corrupt headers, hashes, payload types and truncated data quarantine startup without changing the file', async t => {
  const variants = [
    Buffer.from('{bad header}\n{}'), record('{}', { schema: 'other' }), record('{}', { revision: 0 }),
    record('{}', { revision: Number.MAX_SAFE_INTEGER + 1 }), record('{}', { byteLength: 3 }),
    record('{}', { sha256: '0'.repeat(64) }), record('{}', { savedAt: 'invalid' }),
    record('null'), record('[]'), record('1'), record('{'), record('{}').subarray(0, -1),
    Buffer.from(' '.repeat(MAX_HEADER_BYTES + 1) + '\n{}')
  ];
  const f = await fixture(t);
  for (const bytes of variants) {
    await fs.writeFile(f.canonical, bytes);
    const store = createStore({ directory: f.directory });
    const initial = await store.initialize();
    assert.equal(initial.status, 'error'); assert.equal(initial.json, null); assert.equal(initial.writeAllowed, false);
    await store.beginOwner('new-owner');
    assert.equal((await store.commit({ ownerId: 'new-owner', epoch: 0, jobId: 1, json: '{}' })).status, 'blocked');
    assert.deepEqual(await fs.readFile(f.canonical), bytes);
  }
});

test('stat size bound rejects an oversized file before allocating or reading its payload', async t => {
  let reads = 0;
  const f = await fixture(t, () => ({ ...fs, async open(filename, flags, mode) {
    const handle = await fs.open(filename, flags, mode);
    return proxyHandle(handle, { async read(...args) { reads++; return handle.read(...args); } });
  } }));
  await fs.writeFile(f.canonical, ''); await fs.truncate(f.canonical, MAX_PAYLOAD_BYTES + MAX_HEADER_BYTES + 2);
  const result = await f.store.initialize();
  assert.equal(result.status, 'error'); assert.equal(result.writeAllowed, false); assert.equal(reads, 0);
});

test('read errors and external canonical corruption never silently fall back to an absent store', async t => {
  const denied = await fixture(t, () => ({ ...fs, async open() { throw error('EACCES'); } }));
  assert.equal((await denied.store.initialize()).status, 'error');
  assert.equal((await denied.own()).writeAllowed, false);
  const f = await fixture(t); await f.own(); await f.save();
  await fs.writeFile(f.canonical, 'external corruption');
  assert.equal((await f.save('{"defaults":true}', 2)).status, 'failed');
  assert.equal((await f.store.readVerified()).status, 'error');
  assert.equal(await fs.readFile(f.canonical, 'utf8'), 'external corruption');
});

test('a previously verified record cannot silently disappear or roll back during owner bootstrap or explicit read', async t => {
  for (const change of ['missing-owner', 'missing-read', 'rollback', 'same-revision-conflict']) {
    const f = await fixture(t); await f.own(); await f.save(); await f.save('{"value":2}', 2);
    if (change.startsWith('missing')) await fs.unlink(f.canonical);
    else await fs.writeFile(f.canonical, record('{"different":true}', { revision: change === 'rollback' ? 1 : 2 }));
    const read = change === 'missing-read' ? await f.store.readVerified() : await f.own('new-owner');
    assert.equal(read.status, 'error', change); assert.equal(read.json, null); assert.equal(read.writeAllowed, false);
    assert.equal(f.store.snapshot().revision, 2, 'verified metadata is not silently regressed');
  }
});

test('migration backup preserves exact full canonical bytes and verifies across restart without advancing canonical', async t => {
  const events = [];
  const f = await fixture(t, () => ({ ...fs,
    async open(filename, flags, mode) {
      const handle = await fs.open(filename, flags, mode);
      if (path.basename(filename).includes('.tmp-backup-')) events.push(flags === 'wx' ? 'open-temp' : 'verify-temp');
      if (path.basename(filename) === MIGRATION_BACKUP_FILENAME) events.push('read-backup');
      return flags === 'wx' ? proxyHandle(handle, { async sync() { events.push('sync'); return handle.sync(); } }) : handle;
    }, async link(from, to) { events.push('exclusive-publish'); return fs.link(from, to); }
  }));
  const json = '{\n  "preserved": "🧬", "negativeZero": -0, "unknownFutureField": [3, 2, 1]\n}\n';
  const source = record(json, { revision: 128, extraHeaderField: 'preserve exact old header' });
  await fs.writeFile(f.canonical, source); await f.own();
  const receipt = await backup(f);
  assert.equal(receipt.status, 'backup-verified'); assert.equal(receipt.backupVerified, true);
  assert.notEqual(receipt.persistenceVerified, true);
  assert.equal(receipt.sourceRevision, 128); assert.equal(receipt.sourceDigest, f.store.snapshot().digest);
  assert.equal(receipt.sourceFileDigest, createHash('sha256').update(source).digest('hex'));
  assert.equal(receipt.backupByteLength, source.length); assert.equal(receipt.backupFile, MIGRATION_BACKUP_FILENAME);
  assert.ok(events.indexOf('sync') < events.indexOf('verify-temp'));
  assert.ok(events.indexOf('verify-temp') < events.indexOf('exclusive-publish'));
  assert.ok(events.lastIndexOf('read-backup') > events.indexOf('exclusive-publish'));
  assert.deepEqual(await fs.readFile(path.join(f.directory, MIGRATION_BACKUP_FILENAME)), source);
  assert.deepEqual(await fs.readFile(f.canonical), source); assert.equal(f.store.snapshot().revision, 128);
  const firstInode = (await fs.stat(path.join(f.directory, MIGRATION_BACKUP_FILENAME))).ino;
  const next = createStore({ directory: f.directory }); await next.beginOwner('restart-owner');
  const resumed = await next.backupMigration({ ownerId: 'restart-owner', epoch: 0, requestId: 'restart', expectedRevision: 128, expectedDigest: receipt.sourceDigest });
  assert.equal(resumed.backupVerified, true); assert.notEqual(resumed.backupId, receipt.backupId);
  assert.equal((await fs.stat(path.join(f.directory, MIGRATION_BACKUP_FILENAME))).ino, firstInode, 'matching existing backup was not replaced');
  assert.deepEqual((await fs.readdir(f.directory)).sort(), [FILENAME, MIGRATION_BACKUP_FILENAME].sort());
});

test('guarded migration commit advances canonical only with current capability and retains original backup', async t => {
  const f = await fixture(t); await f.own(); await f.save('{"native":"old","unrelated":[3,2,1]}');
  const original = await fs.readFile(f.canonical), receipt = await backup(f);
  const result = await f.store.commit({ ownerId: 'owner-a', epoch: 0, jobId: 2,
    json: '{"native":"recovered","unrelated":[3,2,1],"recovery":"partial"}', migration: migration(receipt) });
  assert.equal(result.status, 'persisted'); assert.equal(result.persistenceVerified, true); assert.equal(result.revision, 2);
  assert.deepEqual(await fs.readFile(path.join(f.directory, MIGRATION_BACKUP_FILENAME)), original);
  assert.equal((await f.store.readVerified()).json, '{"native":"recovered","unrelated":[3,2,1],"recovery":"partial"}');
  assert.equal((await f.store.commit({ ownerId: 'owner-a', epoch: 0, jobId: 3, json: '{}', migration: migration(receipt) })).status, 'blocked');
});

test('malformed or stale backup identities never create backup files or advance canonical', async t => {
  const f = await fixture(t); await f.own(); await f.save(); const source = await fs.readFile(f.canonical);
  for (const fields of [
    { ownerId: 'old' }, { epoch: 1 }, { requestId: '' }, { requestId: 'x'.repeat(129) },
    { expectedRevision: 0 }, { expectedRevision: 2 }, { expectedRevision: '1' },
    { expectedDigest: 'bad' }, { expectedDigest: '0'.repeat(64) }
  ]) assert.equal((await backup(f, fields)).status, 'blocked');
  assert.deepEqual(await fs.readdir(f.directory), [FILENAME]); assert.deepEqual(await fs.readFile(f.canonical), source);
  const absent = await fixture(t); await absent.own();
  assert.equal((await backup(absent, { expectedRevision: 1, expectedDigest: 'a'.repeat(64) })).status, 'blocked');
  assert.deepEqual(await fs.readdir(absent.directory), []);
});

test('migration preconditions are copied at admission and reject malformed, forged and stale receipts', async t => {
  const f = await fixture(t); await f.own(); await f.save(); const source = await fs.readFile(f.canonical);
  const receipt = await backup(f); let jobId = 2;
  for (const condition of [null, [], {}, { ...migration(receipt), extra: true },
    { ...migration(receipt), backupId: 'forged' }, { ...migration(receipt), expectedRevision: 2 },
    { ...migration(receipt), expectedDigest: '0'.repeat(64) }]) {
    assert.equal((await f.store.commit({ ownerId: 'owner-a', epoch: 0, jobId: jobId++, json: '{}', migration: condition })).status, 'blocked');
  }
  assert.deepEqual(await fs.readFile(f.canonical), source);
  const condition = migration(receipt), pending = f.store.commit({ ownerId: 'owner-a', epoch: 0, jobId: jobId++, json: '{"new":true}', migration: condition });
  condition.backupId = 'forged-after-call'; condition.expectedRevision++;
  assert.equal((await pending).status, 'persisted');
});

test('intervening normal commit makes migration source CAS fail instead of replacing newer data', async t => {
  const f = await fixture(t); await f.own(); await f.save(); const receipt = await backup(f);
  const newer = f.save('{"newerValidState":true}', 2);
  const obsolete = f.store.commit({ ownerId: 'owner-a', epoch: 0, jobId: 3, json: '{"oldMigration":true}', migration: migration(receipt) });
  assert.equal((await newer).status, 'persisted'); assert.equal((await obsolete).status, 'blocked');
  assert.equal((await f.store.readVerified()).json, '{"newerValidState":true}'); assert.equal(f.store.snapshot().revision, 2);
});

test('existing different or corrupt fixed backup is never overwritten', async t => {
  for (const bytes of [record('{"different":true}'), Buffer.from('incomplete backup')]) {
    const f = await fixture(t); await f.own(); await f.save(); const source = await fs.readFile(f.canonical);
    const destination = path.join(f.directory, MIGRATION_BACKUP_FILENAME); await fs.writeFile(destination, bytes);
    const result = await backup(f);
    assert.equal(result.backupVerified, false); assert.ok(['failed', 'verification-failed'].includes(result.status));
    assert.deepEqual(await fs.readFile(destination), bytes); assert.deepEqual(await fs.readFile(f.canonical), source);
    assert.deepEqual((await fs.readdir(f.directory)).sort(), [FILENAME, MIGRATION_BACKUP_FILENAME].sort());
  }
});

test('backup failures at every physical stage preserve canonical and cleanup only owned temporary files', async t => {
  for (const phase of ['open', 'write', 'sync', 'temp-readback', 'link', 'backup-readback']) {
    let fail = false;
    const f = await fixture(t, () => ({ ...fs,
      async open(filename, flags, mode) {
        const temporary = path.basename(filename).includes('.tmp-backup-');
        if (fail && (temporary && ((phase === 'open' && flags === 'wx') || (phase === 'temp-readback' && flags === 'r')) ||
            phase === 'backup-readback' && path.basename(filename) === MIGRATION_BACKUP_FILENAME)) throw error('EIO');
        const handle = await fs.open(filename, flags, mode);
        return temporary && flags === 'wx' ? proxyHandle(handle, {
          async writeFile(bytes) { if (fail && phase === 'write') throw error('ENOSPC'); return handle.writeFile(bytes); },
          async sync() { if (fail && phase === 'sync') throw error('EIO'); return handle.sync(); }
        }) : handle;
      }, async link(from, to) { if (fail && phase === 'link') throw error('ENOTSUP'); return fs.link(from, to); }
    }));
    await f.own(); await f.save(); const before = await fs.readFile(f.canonical); fail = true;
    const result = await backup(f);
    assert.equal(result.backupVerified, false, phase); assert.notEqual(result.persistenceVerified, true);
    assert.deepEqual(await fs.readFile(f.canonical), before, phase);
    assert.equal((await fs.readdir(f.directory)).some(name => name.includes('.tmp-')), false, phase);
    assert.equal((await f.store.drain()).settled, true);
  }
});

test('fence before backup publication cancels active and queued work and waits for physical cleanup', async t => {
  const entered = deferred(), release = deferred(); let hold = false;
  const f = await fixture(t, () => ({ ...fs, async open(filename, flags, mode) {
    const handle = await fs.open(filename, flags, mode);
    return flags === 'wx' && path.basename(filename).includes('.tmp-backup-') ? proxyHandle(handle, {
      async sync() { if (hold) { entered.resolve(); await release.promise; } return handle.sync(); }
    }) : handle;
  } }));
  await f.own(); await f.save(); const source = await fs.readFile(f.canonical); hold = true;
  const active = backup(f); await entered.promise; const queued = backup(f, { requestId: 'queued' });
  let settled = false; const fence = f.store.fence({ ownerId: 'owner-a', epoch: 1 }).then(result => { settled = true; return result; });
  await tick(); assert.equal(settled, false); release.resolve();
  assert.equal((await active).status, 'cancelled'); assert.equal((await queued).status, 'cancelled'); assert.equal((await fence).settled, true);
  assert.deepEqual(await fs.readdir(f.directory), [FILENAME]); assert.deepEqual(await fs.readFile(f.canonical), source);
});

test('fence inside entered exclusive publication drains actual backup but suppresses stale capability', async t => {
  const entered = deferred(), release = deferred(); let hold = true;
  const f = await fixture(t, () => ({ ...fs, async link(from, to) {
    if (hold) { hold = false; entered.resolve(); await release.promise; } return fs.link(from, to);
  } }));
  await f.own(); await f.save(); const before = await fs.readFile(f.canonical);
  const operation = backup(f); await entered.promise;
  let drained = false; const fence = f.store.fence({ ownerId: 'owner-a', epoch: 1 }).then(value => { drained = true; return value; });
  await tick(); assert.equal(drained, false); release.resolve();
  const obsolete = await operation; assert.equal(obsolete.status, 'cancelled'); assert.equal(obsolete.backupId, undefined);
  assert.equal((await fence).settled, true);
  assert.deepEqual(await fs.readFile(path.join(f.directory, MIGRATION_BACKUP_FILENAME)), before);
  assert.deepEqual(await fs.readFile(f.canonical), before);
  assert.equal((await backup(f, { requestId: 'new-epoch' })).backupVerified, true);
});

test('new owner waits through backup readback and invalidates every old backup capability', async t => {
  const entered = deferred(), release = deferred(); let hold = false, store;
  const f = await fixture(t, () => ({ ...fs, async open(filename, flags, mode) {
    if (hold && path.basename(filename) === MIGRATION_BACKUP_FILENAME && store.snapshot().active?.phase === 'backup-verifying') {
      hold = false; entered.resolve(); await release.promise;
    }
    return fs.open(filename, flags, mode);
  } }));
  store = f.store; await f.own(); await f.save(); const prior = await backup(f); hold = true;
  const pending = backup(f, { requestId: 'pending' }); await entered.promise;
  let ready = false; const next = f.own('owner-b').then(value => { ready = true; return value; });
  await tick(); assert.equal(ready, false); release.resolve();
  assert.equal((await pending).status, 'cancelled'); assert.equal((await next).writeAllowed, true);
  assert.equal((await store.commit({ ownerId: 'owner-b', epoch: 0, jobId: 1, json: '{}', migration: migration(prior) })).status, 'blocked');
  assert.equal((await backup(f)).backupVerified, true);
});

test('migration publication independently rejects removed or modified backup and changed source header', async t => {
  for (const kind of ['missing', 'corrupt', 'different-valid', 'source-header']) {
    const f = await fixture(t); await f.own(); await f.save(); const receipt = await backup(f);
    const destination = path.join(f.directory, MIGRATION_BACKUP_FILENAME);
    if (kind === 'missing') await fs.unlink(destination);
    else if (kind === 'corrupt') await fs.writeFile(destination, 'corrupt');
    else if (kind === 'different-valid') await fs.writeFile(destination, record('{"other":true}'));
    else await fs.writeFile(f.canonical, record('{"value":1}', { savedAt: '2026-11-10T00:00:00.000Z' }));
    const before = await fs.readFile(f.canonical);
    const result = await f.store.commit({ ownerId: 'owner-a', epoch: 0, jobId: 2, json: '{"recovery":true}', migration: migration(receipt) });
    assert.equal(result.status, 'verification-failed', kind); assert.equal(result.persistenceVerified, false);
    assert.deepEqual(await fs.readFile(f.canonical), before, kind);
  }
});

test('main-only blockWrites quarantines future work without filesystem mutation or default fallback', async t => {
  const f = await fixture(t); await f.own(); await f.save(); const receipt = await backup(f);
  const files = await fs.readdir(f.directory), before = await fs.readFile(f.canonical);
  const result = f.store.blockWrites('Known native migration was rejected');
  assert.equal(result.status, 'error'); assert.equal(result.writeAllowed, false); assert.equal(result.json, null);
  assert.equal((await f.save('{}', 2)).status, 'blocked'); assert.equal((await backup(f)).status, 'blocked');
  assert.equal((await f.store.commit({ ownerId: 'owner-a', epoch: 0, jobId: 3, json: '{}', migration: migration(receipt) })).status, 'blocked');
  assert.equal((await f.own('owner-b')).writeAllowed, false);
  assert.deepEqual(await fs.readdir(f.directory), files); assert.deepEqual(await fs.readFile(f.canonical), before);
  const restarted = createStore({ directory: f.directory });
  assert.equal((await restarted.initialize()).json, '{"value":1}', 'canonical evidence remains independently recoverable');
});

test('exclusive publication races never replace a competing backup and only exact bytes can verify', async t => {
  for (const matching of [true, false]) {
    let competingBytes;
    const f = await fixture(t, () => ({ ...fs, async link(from, to) {
      competingBytes = matching ? await fs.readFile(from) : record('{"unrelatedBackup":true}');
      await fs.writeFile(to, competingBytes, { flag: 'wx' });
      return fs.link(from, to); // Real EEXIST, not a synthetic success receipt.
    } }));
    await f.own(); await f.save(); const source = await fs.readFile(f.canonical);
    const result = await backup(f);
    assert.equal(result.backupVerified, matching);
    assert.equal(result.status, matching ? 'backup-verified' : 'verification-failed');
    assert.deepEqual(await fs.readFile(path.join(f.directory, MIGRATION_BACKUP_FILENAME)), competingBytes);
    assert.deepEqual(await fs.readFile(f.canonical), source);
    assert.equal((await fs.readdir(f.directory)).some(name => name.includes('.tmp-')), false);
  }
});

test('fence during migration backup revalidation cancels canonical publication and drains before acknowledgement', async t => {
  const entered = deferred(), release = deferred(); let hold = false, store;
  const f = await fixture(t, () => ({ ...fs, async open(filename, flags, mode) {
    if (hold && path.basename(filename) === MIGRATION_BACKUP_FILENAME && store.snapshot().active?.phase === 'migration-verifying') {
      hold = false; entered.resolve(); await release.promise;
    }
    return fs.open(filename, flags, mode);
  } }));
  store = f.store; await f.own(); await f.save(); const source = await fs.readFile(f.canonical), receipt = await backup(f); hold = true;
  const operation = store.commit({ ownerId: 'owner-a', epoch: 0, jobId: 2, json: '{"recovered":true}', migration: migration(receipt) });
  await entered.promise;
  let settled = false; const fence = store.fence({ ownerId: 'owner-a', epoch: 1 }).then(value => { settled = true; return value; });
  await tick(); assert.equal(settled, false); release.resolve();
  assert.equal((await operation).status, 'cancelled'); assert.equal((await fence).settled, true);
  assert.deepEqual(await fs.readFile(f.canonical), source);
  assert.equal((await store.commit({ ownerId: 'owner-a', epoch: 1, jobId: 3, json: '{}', migration: migration(receipt) })).status, 'blocked');
});

test('a symbolic-link backup cannot certify preservation of the canonical file', async t => {
  // Inject the lstat classification to keep this test independent of Windows
  // symlink privileges, while the underlying snapshot bytes remain real files.
  const f = await fixture(t, () => ({ ...fs, async lstat(filename) {
    const stat = await fs.lstat(filename);
    if (path.basename(filename) === MIGRATION_BACKUP_FILENAME) return { ...stat, isFile: () => true, isSymbolicLink: () => true };
    return stat;
  } }));
  await f.own(); await f.save(); const source = await fs.readFile(f.canonical);
  await fs.writeFile(path.join(f.directory, MIGRATION_BACKUP_FILENAME), source);
  const result = await backup(f);
  assert.equal(result.backupVerified, false); assert.match(result.error, /symbolic link/);
  assert.deepEqual(await fs.readFile(f.canonical), source);
});
