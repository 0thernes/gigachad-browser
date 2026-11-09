'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { migrateLegacyNative, NATIVE_SCHEMA, RECOVERY_SCHEMA, BACKUP_FILE } = require('../systems/alive-genome-migration.cjs');
const { createStore, FILENAME } = require('../systems/alive-genome-store.cjs');
const { AuthenticAsmodensiusAdapter } = require('../systems/authentic-asmodensius-adapter.js');
const runtime = { electron: '45.0.0-test', node: process.versions.node, v8: process.versions.v8 };
const digest = text => createHash('sha256').update(text).digest('hex');
function fnv(text) { let value = 2166136261; for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619) >>> 0; return value.toString(16).padStart(8, '0'); }
function envelope(data, sourceDigest = 'a'.repeat(64)) { const payload = JSON.stringify(data); return { schema: NATIVE_SCHEMA, sourceDigest, checksum: fnv(payload), payload }; }
const legacy = () => envelope({ seed: 17, native: { rng: 37, weights: [0.25, -0.1], opaque: { $number: '-0' } }, sets: ['x'] });
function adapter() {
  return { sourceDigest: 'a'.repeat(64), calls: 0, prepareLegacyRecovery(value) {
    this.calls++; const next = envelope({ ...JSON.parse(value.payload), developmentAffinity: [{ values: [0.125] }] });
    return { schema: 'gigachad.authentic-asmodensius.legacy-recovery.v1', envelope: next, provenance: {
      sourceDigest: this.sourceDigest, sourceEnvelopeChecksum: value.checksum, preparedEnvelopeChecksum: next.checksum,
      preservedKnownState: true, knownStateComparison: 'exact-serialized-known-fields', exactHistoricalContinuation: false,
      developmentalAffinity: 'reinitialized-from-current-seeded-constructor', limitations: ['Historical closure was not saved.'] } };
  } };
}
function fixture(json = JSON.stringify({ epoch: 9, authenticAsmodensius: legacy(), unknown: { nested: [1, false] } })) {
  let current = { status: 'ready', json, revision: 7, digest: digest(json), writeAllowed: true };
  let activeOwner, blocked = false; const calls = [], requests = {}, Type = adapter();
  const store = {
    async readVerified() { calls.push('read'); return { ...current, writeAllowed: !blocked }; },
    async beginOwner(ownerId) { calls.push('owner'); activeOwner = ownerId; requests.ownerId = ownerId; return { ...current, ownerId, epoch: 0 }; },
    async backupMigration(request) { calls.push('backup'); requests.backup = request; return { status: 'backup-verified', backupVerified: true,
      ownerId: activeOwner, epoch: 0, requestId: request.requestId, backupId: 'backup-fixture', sourceRevision: current.revision, sourceDigest: current.digest,
      sourceFileDigest: 'b'.repeat(64), backupFile: BACKUP_FILE, backupByteLength: Buffer.byteLength(current.json) + 200, verifiedAt: '2026-11-09T00:00:00.000Z' }; },
    async commit(request) { calls.push('commit'); requests.commit = request; current = { status: 'ready', json: request.json, revision: current.revision + 1, digest: digest(request.json), writeAllowed: true };
      return { status: 'persisted', persistenceVerified: true, ownerId: request.ownerId, epoch: request.epoch, jobId: request.jobId, revision: current.revision, digest: current.digest }; },
    blockWrites(reason) { calls.push('block'); blocked = true; requests.blockReason = reason; return { status: 'error', writeAllowed: false }; }
  };
  return { store, Type, calls, requests, original: current, current: () => current, run: () => migrateLegacyNative({ store, Adapter: { AuthenticAsmodensiusAdapter: Type }, runtime }) };
}

test('successful startup migration orders isolated preparation, backup, guarded commit and exact readback', async () => {
  const f = fixture(), outcome = await f.run();
  assert.equal(outcome.status, 'migrated'); assert.equal(outcome.persistenceVerified, true); assert.equal(outcome.exactHistoricalContinuation, false);
  assert.deepEqual(f.calls, ['read', 'owner', 'backup', 'commit', 'read']); assert.equal(f.Type.calls, 1);
  assert.match(f.requests.ownerId, /^[0-9a-f-]{36}$/); assert.notEqual(f.requests.ownerId, f.requests.backup.requestId);
  assert.deepEqual(f.requests.commit.migration, { backupId: 'backup-fixture', expectedRevision: 7, expectedDigest: f.original.digest });
  assert.equal(f.requests.commit.jobId, 1); assert.equal(f.requests.commit.epoch, 0);
  const saved = JSON.parse(f.current().json); assert.equal(saved.epoch, 9); assert.deepEqual(saved.unknown, { nested: [1, false] });
  const proof = saved.nativeStateRecovery; assert.equal(proof.schema, RECOVERY_SCHEMA); assert.deepEqual(proof.runtime, runtime);
  assert.deepEqual(proof.source, { revision: 7, sha256: f.original.digest }); assert.equal(proof.backup.backupId, 'backup-fixture');
  assert.equal(proof.provenance.exactHistoricalContinuation, false); assert.equal(proof.provenance.preservedKnownState, true);
  assert.equal(JSON.stringify(outcome).includes('payload'), false); assert.equal(JSON.stringify(outcome).includes('weights'), false);
});

test('unrelated outer values retain exact JSON bytes including -0, numeric spelling and escapes', async () => {
  const raw = '{\n "neg": -0, "large": 9007199254740993, "exp":1e+09, "text":"} , \\\" [", "opaque":{"b":[1,{"a":true}],"a":null},\n "authenticAsmodensius" : ' + JSON.stringify(legacy()) + ', "tail" : [3, 2, 1]\n}\n';
  const f = fixture(raw); assert.equal((await f.run()).status, 'migrated');
  const saved = f.current().json;
  for (const exact of ['"neg": -0', '"large": 9007199254740993', '"exp":1e+09', '"text":"} , \\\" ["', '"opaque":{"b":[1,{"a":true}],"a":null}', '"tail" : [3, 2, 1]']) assert.ok(saved.includes(exact), exact);
  assert.ok(Object.is(JSON.parse(saved).neg, -0));
});

test('missing canonical, absent native and current native envelopes are no-op without owner or write', async () => {
  for (const payload of [{ unrelated: 1 }, { authenticAsmodensius: null }, { authenticAsmodensius: envelope({ seed: 17, developmentAffinity: [] }) }]) {
    const f = fixture(JSON.stringify(payload)); assert.equal((await f.run()).status, 'noop'); assert.deepEqual(f.calls, ['read']); assert.equal(f.Type.calls, 0);
  }
  const f = fixture(); f.store.readVerified = async () => ({ status: 'absent', json: null, revision: 0, digest: null, writeAllowed: true });
  assert.equal((await f.run()).reason, 'canonical-absent'); assert.equal(f.Type.calls, 0); assert.equal(f.calls.length, 0);
});

test('an existing recovery record beside a legacy envelope is ambiguous and never overwritten', async () => {
  const f = fixture(JSON.stringify({ authenticAsmodensius: legacy(), nativeStateRecovery: { prior: 'must survive' } })), result = await f.run();
  assert.equal(result.status, 'blocked'); assert.equal(result.reason, 'legacy-recovery-provenance-already-present'); assert.equal(result.writesBlocked, true);
  assert.deepEqual(f.calls, ['read', 'block']); assert.equal(f.current().json, f.original.json); assert.equal(f.Type.calls, 0);
});

test('unknown, malformed, duplicate and checksum-corrupt formats block without preparing defaults', async () => {
  const badNative = [{ ...legacy(), schema: 'unknown-v2' }, { ...legacy(), checksum: '00000000' }, { ...legacy(), sourceDigest: 'f'.repeat(64) }, { ...legacy(), extra: 1 }, {}];
  for (const native of badNative) {
    const f = fixture(JSON.stringify({ authenticAsmodensius: native })); const result = await f.run();
    assert.equal(result.status, 'blocked'); assert.equal(result.writesBlocked, true); assert.equal(f.Type.calls, 0); assert.equal(f.current().json, f.original.json); assert.ok(!f.calls.includes('commit'));
  }
  for (const json of ['{"x":1,"x":2,"authenticAsmodensius":' + JSON.stringify(legacy()) + '}', '{"authenticAsmodensius":']) {
    const f = fixture(json); assert.equal((await f.run()).status, 'blocked'); assert.equal(f.Type.calls, 0); assert.ok(!f.calls.includes('backup'));
  }
});

test('preparation exceptions and changed known native fields block before backup', async () => {
  for (const attack of ['throw', 'mutation', 'false-proof']) {
    const f = fixture(), originalPrepare = f.Type.prepareLegacyRecovery;
    f.Type.prepareLegacyRecovery = function (value) {
      if (attack === 'throw') throw new Error('private payload details must not leak');
      const prepared = originalPrepare.call(this, value);
      if (attack === 'mutation') { const data = JSON.parse(prepared.envelope.payload); data.native.rng = 999; prepared.envelope = envelope(data); prepared.provenance.preparedEnvelopeChecksum = prepared.envelope.checksum; }
      if (attack === 'false-proof') prepared.provenance.exactHistoricalContinuation = true;
      return prepared;
    };
    const result = await f.run(); assert.equal(result.status, 'blocked'); assert.equal(result.writesBlocked, true); assert.ok(!f.calls.includes('backup'));
    assert.equal(f.current().json, f.original.json); assert.ok(!JSON.stringify(result).includes('private payload'));
  }
});

test('source revision or owner changes during beginOwner prevent backup and publication', async () => {
  for (const mismatch of ['revision', 'ownerId', 'epoch', 'digest']) {
    const f = fixture(), begin = f.store.beginOwner;
    f.store.beginOwner = async ownerId => ({ ...await begin(ownerId), [mismatch]: mismatch === 'revision' ? 8 : mismatch === 'epoch' ? 1 : 'changed' });
    assert.equal((await f.run()).status, 'blocked'); assert.ok(!f.calls.includes('backup')); assert.equal(f.current().json, f.original.json);
  }
});

test('prepared envelope and provenance are privately captured before asynchronous ownership and backup', async () => {
  const f = fixture(), prepare = f.Type.prepareLegacyRecovery, begin = f.store.beginOwner; let publicCandidate, expected;
  f.Type.prepareLegacyRecovery = function (value) { publicCandidate = prepare.call(this, value); expected = structuredClone(publicCandidate); return publicCandidate; };
  f.store.beginOwner = async ownerId => {
    publicCandidate.envelope = envelope({ compromised: 'late replacement' });
    publicCandidate.provenance.exactHistoricalContinuation = true;
    return begin(ownerId);
  };
  assert.equal((await f.run()).status, 'migrated');
  const saved = JSON.parse(f.current().json);
  assert.deepEqual(saved.authenticAsmodensius, expected.envelope);
  assert.deepEqual(saved.nativeStateRecovery.provenance, expected.provenance);
});

test('failed, thrown or mismatched backup receipts cannot authorize a commit', async () => {
  for (const attack of ['throw', 'status', 'sourceDigest', 'ownerId', 'requestId', 'backupVerified', 'backupFile']) {
    const f = fixture(), backup = f.store.backupMigration;
    f.store.backupMigration = async request => { const receipt = await backup(request); if (attack === 'throw') throw new Error('backup failed');
      return { ...receipt, [attack]: attack === 'backupVerified' ? false : 'wrong' }; };
    const result = await f.run(); assert.equal(result.status, 'blocked'); assert.equal(result.stage, 'backup'); assert.equal(result.writesBlocked, true);
    assert.ok(!f.calls.includes('commit')); assert.equal(f.current().json, f.original.json);
  }
});

test('unverified or stale commit receipts block and never claim the original remained untouched', async () => {
  for (const attack of ['status', 'persistenceVerified', 'ownerId', 'epoch', 'jobId', 'revision', 'digest', 'throw-after-write']) {
    const f = fixture(), commit = f.store.commit;
    f.store.commit = async request => { const receipt = await commit(request); if (attack === 'throw-after-write') throw new Error('late write uncertainty');
      return { ...receipt, [attack]: attack === 'persistenceVerified' ? false : 'mismatch' }; };
    const result = await f.run(); assert.equal(result.status, 'blocked'); assert.equal(result.stage, 'commit'); assert.equal(result.canonicalPublication, 'unverified');
    assert.equal(result.writesBlocked, true); assert.notEqual(f.current().json, f.original.json);
  }
});

test('fresh readback failure after a successful receipt quarantines the published candidate', async () => {
  const f = fixture(), read = f.store.readVerified; let reads = 0;
  f.store.readVerified = async () => { const value = await read(); if (++reads === 2) return { ...value, json: f.original.json, digest: f.original.digest }; return value; };
  const result = await f.run(); assert.equal(result.status, 'blocked'); assert.equal(result.stage, 'readback'); assert.equal(result.writesBlocked, true); assert.equal(result.canonicalPublication, 'unverified');
});

test('runtime and provenance limits cannot inject unbounded recovery metadata', async () => {
  const f = fixture(); const result = await migrateLegacyNative({ store: f.store, Adapter: { AuthenticAsmodensiusAdapter: f.Type }, runtime: { electron: 'x'.repeat(129) } });
  assert.equal(result.status, 'blocked'); assert.ok(!f.calls.includes('backup'));
  const g = fixture(), prepare = g.Type.prepareLegacyRecovery;
  g.Type.prepareLegacyRecovery = function (value) { const ready = prepare.call(this, value); ready.provenance.limitations = ['x'.repeat(5000)]; return ready; };
  assert.equal((await g.run()).status, 'blocked'); assert.ok(!g.calls.includes('backup'));
  const h = fixture(), prepareH = h.Type.prepareLegacyRecovery;
  h.Type.prepareLegacyRecovery = function (value) { const ready = prepareH.call(this, value); ready.provenance.limitations = new Array(1); ready.provenance.limitations.hidden = 'not an array entry'; return ready; };
  assert.equal((await h.run()).status, 'blocked'); assert.ok(!h.calls.includes('backup'));
});

test('actual adapter and durable store recover only absent affinity, preserve backup and retain explicit approximation', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'gigachad-native-migration-test-'));
  t.after(async () => { const resolved = path.resolve(directory); assert.equal(path.dirname(resolved), path.resolve(os.tmpdir())); assert.ok(path.basename(resolved).startsWith('gigachad-native-migration-test-')); await fs.rm(resolved, { recursive: true, force: true }); });
  const sourceAdapter = new AuthenticAsmodensiusAdapter({ seed: 17 });
  const originalNative = sourceAdapter.exportState(), data = JSON.parse(originalNative.payload); delete data.developmentAffinity;
  const legacyEnvelope = envelope(data, AuthenticAsmodensiusAdapter.sourceDigest);
  const json = JSON.stringify({ identity: { creature: 'existing' }, epoch: 42, savedAt: 'historic', authenticAsmodensius: legacyEnvelope, unknown: { retained: true } });
  const store = createStore({ directory }); await store.beginOwner('fixture-seed-owner');
  assert.equal((await store.commit({ ownerId: 'fixture-seed-owner', epoch: 0, jobId: 1, json })).persistenceVerified, true);
  const before = await fs.readFile(path.join(directory, FILENAME));
  const result = await migrateLegacyNative({ store, Adapter: { AuthenticAsmodensiusAdapter }, runtime });
  assert.equal(result.status, 'migrated', JSON.stringify(result)); assert.equal(result.revision, 2);
  assert.deepEqual(await fs.readFile(path.join(directory, BACKUP_FILE)), before);
  const fresh = await store.readVerified(), saved = JSON.parse(fresh.json), restored = new AuthenticAsmodensiusAdapter({ seed: 99 });
  assert.equal(restored.importState(saved.authenticAsmodensius), true, restored.lastError);
  const recovered = JSON.parse(saved.authenticAsmodensius.payload); assert.ok(Array.isArray(recovered.developmentAffinity)); delete recovered.developmentAffinity; assert.deepEqual(recovered, data);
  assert.deepEqual(saved.identity, { creature: 'existing' }); assert.deepEqual(saved.unknown, { retained: true }); assert.equal(saved.epoch, 42); assert.equal(saved.savedAt, 'historic');
  assert.equal(saved.nativeStateRecovery.provenance.exactHistoricalContinuation, false);
  const rerun = await migrateLegacyNative({ store, Adapter: AuthenticAsmodensiusAdapter, runtime }); assert.equal(rerun.status, 'noop'); assert.equal((await store.readVerified()).revision, 2);
});
