'use strict';
// Main-process, single-writer persistence. The application must hold its process
// instance lock; renderer ownership/epochs fence queued work within this store.
const nativeFs = require('node:fs/promises');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');

const SCHEMA = 'gigachad.genome-store.v1';
const FILENAME = 'alive-genome-v1.snapshot';
const MIGRATION_BACKUP_FILENAME = 'alive-genome-v1.migration-backup.snapshot';
const MAX_PAYLOAD_BYTES = 32 * 1024 * 1024;
const MAX_HEADER_BYTES = 2048;
const digestOf = bytes => createHash('sha256').update(bytes).digest('hex');
const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const messageOf = error => String(error?.message || error || 'Persistence failed').slice(0, 300);

function payloadBytes(json) {
  if (typeof json !== 'string') throw new TypeError('Genome payload must be a JSON string');
  const length = Buffer.byteLength(json, 'utf8');
  if (!length || length > MAX_PAYLOAD_BYTES) throw new RangeError('Genome payload exceeds the 32 MiB bound or is empty');
  const bytes = Buffer.from(json, 'utf8');
  if (bytes.toString('utf8') !== json) throw new TypeError('Genome payload must round-trip exactly through UTF-8');
  if (!plainObject(JSON.parse(json))) throw new TypeError('Genome payload must encode a plain JSON object');
  return bytes;
}

function createStore({ directory, fs = nativeFs } = {}) {
  if (typeof directory !== 'string' || !path.isAbsolute(directory)) throw new TypeError('An absolute application data directory is required');
  const root = path.resolve(directory), canonical = path.join(root, FILENAME);
  const migrationBackup = path.join(root, MIGRATION_BACKUP_FILENAME);
  const ownedTemps = new Set(), usedOwners = new Set();
  const migrationReceipts = new Map();
  let tail = Promise.resolve(), initialization = null, owner = null, ownerSequence = 0;
  let cache = { status: 'uninitialized', json: null, revision: 0, digest: null, savedAt: null, byteLength: 0 };
  let quarantine = null, queued = 0, active = null;

  function bootstrap() {
    if (quarantine) return { status: 'error', json: null, revision: cache.revision, digest: cache.digest,
      error: quarantine, writeAllowed: false };
    return { status: cache.status, json: cache.json, revision: cache.revision, digest: cache.digest,
      error: null, writeAllowed: cache.status === 'ready' || cache.status === 'absent' };
  }
  function quarantineWith(error) {
    if (!quarantine) quarantine = messageOf(error);
    return bootstrap();
  }
  function acceptFreshRecord(actual) {
    if (cache.status === 'ready' && (actual.status !== 'ready' || actual.revision < cache.revision ||
        actual.revision === cache.revision && actual.digest !== cache.digest)) {
      throw new Error('Previously verified genome is missing or its revision regressed/conflicted');
    }
    cache = actual;
  }
  async function readFileRecord(filename, fullFileDigest = true) {
    let handle;
    try {
      handle = await fs.open(filename, 'r');
      const stat = await handle.stat();
      if (!stat.isFile() || !Number.isSafeInteger(stat.size) || stat.size < 3 || stat.size > MAX_PAYLOAD_BYTES + MAX_HEADER_BYTES + 1) {
        throw new Error('Genome snapshot file type or size is invalid');
      }
      // Read through the same handle used for stat, with one bounded extra byte
      // to detect growth. Never read an arbitrarily growing file into memory.
      const file = Buffer.alloc(stat.size + 1);
      let offset = 0;
      while (offset < file.length) {
        const { bytesRead } = await handle.read(file, offset, file.length - offset, null);
        if (!bytesRead) break;
        offset += bytesRead;
      }
      if (offset !== stat.size) throw new Error('Genome snapshot changed length while reading');
      const bytes = file.subarray(0, offset), newline = bytes.indexOf(10);
      if (newline < 1 || newline > MAX_HEADER_BYTES) throw new Error('Genome snapshot header exceeds the 2 KiB bound or is missing');
      const headerBytes = bytes.subarray(0, newline), headerText = headerBytes.toString('utf8');
      if (!Buffer.from(headerText, 'utf8').equals(headerBytes)) throw new Error('Genome snapshot header is not valid UTF-8');
      const header = JSON.parse(headerText);
      if (!plainObject(header) || header.schema !== SCHEMA || !Number.isSafeInteger(header.revision) || header.revision < 1 ||
          !Number.isSafeInteger(header.byteLength) || header.byteLength < 1 || header.byteLength > MAX_PAYLOAD_BYTES ||
          !/^[0-9a-f]{64}$/.test(header.sha256) || typeof header.savedAt !== 'string' || header.savedAt.length > 64 || !Number.isFinite(Date.parse(header.savedAt))) {
        throw new Error('Genome snapshot header fields are invalid');
      }
      const payload = bytes.subarray(newline + 1);
      if (payload.length !== header.byteLength || digestOf(payload) !== header.sha256) throw new Error('Genome snapshot length or SHA-256 mismatch');
      const json = payload.toString('utf8');
      if (!Buffer.from(json, 'utf8').equals(payload) || !plainObject(JSON.parse(json))) throw new Error('Genome snapshot payload is not a plain UTF-8 JSON object');
      return { record: { status: 'ready', json, revision: header.revision, digest: header.sha256, savedAt: header.savedAt, byteLength: header.byteLength },
        fileBytes: bytes, fileDigest: fullFileDigest ? digestOf(bytes) : null };
    } catch (error) {
      if (!handle && error?.code === 'ENOENT') return { record: { status: 'absent', json: null, revision: 0, digest: null, savedAt: null, byteLength: 0 }, fileBytes: null, fileDigest: null };
      throw error;
    } finally { if (handle) await handle.close(); }
  }
  async function readRecord() { return (await readFileRecord(canonical, false)).record; }
  async function readBackupRecord() {
    // A pre-existing symlink to canonical is not a backup: a later canonical
    // replacement would silently change what the apparent backup resolves to.
    let stat;
    try { stat = await fs.lstat(migrationBackup); }
    catch (error) { if (error?.code === 'ENOENT') return { record: { status: 'absent' }, fileBytes: null, fileDigest: null }; throw error; }
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Migration backup must be a regular file, not a symbolic link');
    return readFileRecord(migrationBackup);
  }
  function initialize() {
    if (!initialization) initialization = (async () => {
      try { cache = await readRecord(); } catch (error) { quarantineWith(error); }
      return bootstrap();
    })();
    return initialization.then(() => bootstrap());
  }
  function enqueue(work) {
    queued++;
    const result = tail.then(work);
    tail = result.then(() => { queued--; }, () => { queued--; });
    return result;
  }
  function current(job) {
    return owner === job.owner && owner.ready && owner.epoch === job.epoch && !quarantine;
  }
  function response(job, status, error = null, extra = {}) {
    return { status, persistenceVerified: status === 'persisted', ownerId: job.ownerId,
      epoch: job.epoch, jobId: job.jobId, revision: cache.revision, digest: cache.digest,
      ...(error ? { error: messageOf(error) } : {}), ...extra };
  }
  async function cleanupTemp(temp) {
    if (!ownedTemps.has(temp) || path.dirname(temp) !== root || !path.basename(temp).startsWith(FILENAME + '.tmp-')) return;
    try { await fs.unlink(temp); ownedTemps.delete(temp); }
    catch (error) { if (error?.code === 'ENOENT') ownedTemps.delete(temp); }
  }
  async function beginOwner(ownerId) {
    if (typeof ownerId !== 'string' || !ownerId.trim() || ownerId.length > 128 || usedOwners.has(ownerId)) {
      return { ...bootstrap(), status: 'error', json: null, writeAllowed: false, ownerId,
        epoch: 0, error: 'A fresh nonempty ownerId of at most 128 characters is required' };
    }
    usedOwners.add(ownerId);
    const next = { id: ownerId, serial: ++ownerSequence, epoch: 0, lastJobId: 0, ready: false, initializing: true };
    owner = next; // Revoke old admission before any await.
    migrationReceipts.clear();
    await tail;
    await initialize();
    if (owner !== next) return { ...bootstrap(), status: 'error', json: null, writeAllowed: false,
      ownerId, epoch: 0, error: 'Genome owner request was superseded' };
    // An older rename may already have entered the OS when ownership changed.
    // Fresh disk verification after draining discovers its actual final record.
    let actual, readError;
    try { actual = await readRecord(); } catch (error) { readError = error; }
    if (owner !== next) return { ...bootstrap(), status: 'error', json: null, writeAllowed: false,
      ownerId, epoch: 0, error: 'Genome owner request was superseded' };
    if (readError) quarantineWith(readError);
    else { try { acceptFreshRecord(actual); } catch (error) { quarantineWith(error); } }
    next.initializing = false;
    next.ready = !quarantine;
    return { ...bootstrap(), ownerId, epoch: 0 };
  }
  const validDigest = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
  const validRevision = value => Number.isSafeInteger(value) && value >= 1;
  const validRequestId = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 128;
  function migrationPrecondition(value) {
    if (value === undefined) return null;
    if (!plainObject(value)) throw new TypeError('Invalid migration precondition');
    const fields = Object.getOwnPropertyDescriptors(value), keys = Reflect.ownKeys(fields);
    if (keys.length !== 3 || !['backupId', 'expectedRevision', 'expectedDigest'].every(key =>
      fields[key] && Object.prototype.hasOwnProperty.call(fields[key], 'value') && fields[key].enumerable)) throw new TypeError('Invalid migration precondition fields');
    const copy = { backupId: fields.backupId.value, expectedRevision: fields.expectedRevision.value, expectedDigest: fields.expectedDigest.value };
    if (!validRequestId(copy.backupId) || !validRevision(copy.expectedRevision) || !validDigest(copy.expectedDigest)) throw new TypeError('Invalid migration source identity');
    return copy;
  }
  function backupResponse(job, status, error = null, extra = {}) {
    return { status, backupVerified: status === 'backup-verified', ownerId: job.ownerId, epoch: job.epoch,
      requestId: job.requestId, ...(error ? { error: messageOf(error) } : {}), ...extra };
  }
  function backupMigration({ ownerId, epoch, requestId, expectedRevision, expectedDigest } = {}) {
    const job = { owner, ownerId, epoch, requestId, expectedRevision, expectedDigest };
    if (!owner || owner.id !== ownerId || !owner.ready || !Number.isSafeInteger(epoch) || epoch !== owner.epoch ||
        !validRequestId(requestId) || !validRevision(expectedRevision) || !validDigest(expectedDigest) || quarantine) {
      return Promise.resolve(backupResponse(job, 'blocked', quarantine || 'Migration owner, epoch, request or expected source is invalid'));
    }
    return enqueue(async () => {
      if (!current(job)) return backupResponse(job, 'cancelled', 'Migration ownership or epoch changed before backup');
      active = { kind: 'migration-backup', ownerId, epoch, requestId, phase: 'backup-preflight' };
      let handle = null, temp = null, published = false;
      try {
        let source;
        try { source = await readFileRecord(canonical); }
        catch (error) { quarantineWith(error); return backupResponse(job, 'failed', error); }
        const record = source.record;
        if (record.status !== cache.status || record.revision !== cache.revision || record.digest !== cache.digest) {
          quarantineWith(new Error('Canonical genome changed outside the active store; migration blocked'));
          return backupResponse(job, 'failed', quarantine);
        }
        if (record.status !== 'ready' || record.revision !== expectedRevision || record.digest !== expectedDigest) {
          return backupResponse(job, 'blocked', 'Canonical genome no longer matches the expected migration source');
        }
        if (!current(job)) return backupResponse(job, 'cancelled', 'Migration ownership or epoch changed during source read');
        let existing = await readBackupRecord();
        if (existing.record.status === 'absent') {
          await fs.mkdir(root, { recursive: true });
          if (!current(job)) return backupResponse(job, 'cancelled', 'Migration ownership or epoch changed before backup creation');
          temp = path.join(root, FILENAME + '.tmp-backup-' + randomUUID());
          handle = await fs.open(temp, 'wx', 0o600); ownedTemps.add(temp);
          active.phase = 'backup-writing';
          await handle.writeFile(source.fileBytes);
          await handle.sync();
          await handle.close(); handle = null;
          const staged = await readFileRecord(temp);
          if (!staged.fileBytes?.equals(source.fileBytes)) throw new Error('Staged migration backup failed independent verification');
          if (!current(job)) return backupResponse(job, 'cancelled', 'Migration ownership or epoch changed before backup publication');
          active.phase = 'backup-publishing';
          // Exclusive link of our complete private copy, never a link of the
          // canonical file. Unlike rename, this cannot replace an existing backup.
          // Unsupported hard links fail explicitly; no overwrite/copy fallback.
          try { await fs.link(temp, migrationBackup); published = true; }
          catch (error) { if (error?.code !== 'EEXIST') throw error; }
        }
        active.phase = 'backup-verifying';
        existing = await readBackupRecord();
        if (!existing.fileBytes?.equals(source.fileBytes) || existing.fileDigest !== source.fileDigest) {
          return backupResponse(job, 'verification-failed', 'Existing migration backup does not exactly match the canonical source');
        }
        const after = await readFileRecord(canonical);
        if (!after.fileBytes?.equals(source.fileBytes)) {
          quarantineWith(new Error('Canonical genome changed while its migration backup was being verified'));
          return backupResponse(job, 'verification-failed', quarantine);
        }
        if (!current(job)) return backupResponse(job, 'cancelled', 'Migration backup settled after ownership or epoch changed');
        const backupId = randomUUID(), verifiedAt = new Date().toISOString();
        const receipt = { owner: job.owner, epoch, sourceRevision: record.revision, sourceDigest: record.digest,
          sourceFileDigest: source.fileDigest, backupByteLength: source.fileBytes.length };
        migrationReceipts.set(backupId, receipt);
        return backupResponse(job, 'backup-verified', null, { backupId, sourceRevision: receipt.sourceRevision,
          sourceDigest: receipt.sourceDigest, sourceFileDigest: receipt.sourceFileDigest,
          backupFile: MIGRATION_BACKUP_FILENAME, backupByteLength: receipt.backupByteLength, verifiedAt });
      } catch (error) { return backupResponse(job, published ? 'verification-failed' : 'failed', error); }
      finally {
        if (handle) { try { await handle.close(); } catch (_) {} }
        if (temp) await cleanupTemp(temp);
        active = null;
      }
    });
  }
  function commit({ ownerId, epoch, jobId, json, migration } = {}) {
    const job = { owner: owner, ownerId, epoch, jobId, json };
    if (!owner || owner.id !== ownerId || !owner.ready || !Number.isSafeInteger(epoch) || epoch !== owner.epoch ||
        !Number.isSafeInteger(jobId) || jobId < 1 || jobId <= owner.lastJobId || quarantine) {
      return Promise.resolve(response(job, 'blocked', quarantine || 'Genome owner, epoch, or monotonic job ID is not current'));
    }
    owner.lastJobId = jobId; // Reserve IDs even for malformed or failed attempts.
    let bytes;
    try { bytes = payloadBytes(json); job.migration = migrationPrecondition(migration); }
    catch (error) { return Promise.resolve(response(job, 'blocked', error)); }
    return enqueue(async () => {
      if (!current(job)) return response(job, 'cancelled', 'Genome ownership or epoch changed before writing');
      active = { ownerId, epoch, jobId, phase: 'preflight' };
      let handle = null, temp = null, published = false;
      try {
        let before;
        try { before = await readRecord(); }
        catch (error) { quarantineWith(error); return response(job, 'failed', error); }
        if (before.revision !== cache.revision || before.digest !== cache.digest || before.status !== cache.status) {
          quarantineWith(new Error('Canonical genome changed outside the active store; writes quarantined'));
          return response(job, 'failed', quarantine);
        }
        if (!current(job)) return response(job, 'cancelled', 'Genome ownership or epoch changed during preflight');
        if (job.migration) {
          const condition = job.migration, receipt = migrationReceipts.get(condition.backupId);
          if (!receipt || receipt.owner !== job.owner || receipt.epoch !== epoch ||
              receipt.sourceRevision !== condition.expectedRevision || receipt.sourceDigest !== condition.expectedDigest ||
              before.revision !== condition.expectedRevision || before.digest !== condition.expectedDigest) {
            return response(job, 'blocked', 'Migration backup capability or expected canonical source is stale');
          }
          active.phase = 'migration-verifying';
          let source, backup;
          try { source = await readFileRecord(canonical); backup = await readBackupRecord(); }
          catch (error) { return response(job, 'verification-failed', error); }
          if (source.record.revision !== before.revision || source.record.digest !== before.digest ||
              source.fileDigest !== receipt.sourceFileDigest) {
            quarantineWith(new Error('Canonical genome changed before migration publication'));
            return response(job, 'verification-failed', quarantine);
          }
          if (!backup.fileBytes?.equals(source.fileBytes) || backup.fileDigest !== receipt.sourceFileDigest ||
              backup.fileBytes.length !== receipt.backupByteLength) {
            return response(job, 'verification-failed', 'Migration backup no longer verifies against its source');
          }
          if (!current(job) || migrationReceipts.get(condition.backupId) !== receipt) return response(job, 'cancelled', 'Migration ownership or epoch changed during backup verification');
        }
        if (cache.revision >= Number.MAX_SAFE_INTEGER) return response(job, 'failed', 'Genome revision space exhausted');
        const revision = cache.revision + 1, digest = digestOf(bytes), savedAt = new Date().toISOString();
        const header = Buffer.from(JSON.stringify({ schema: SCHEMA, revision, byteLength: bytes.length, sha256: digest, savedAt }) + '\n', 'utf8');
        if (header.length - 1 > MAX_HEADER_BYTES) throw new Error('Genome header exceeded its bound');
        await fs.mkdir(root, { recursive: true });
        if (!current(job)) return response(job, 'cancelled', 'Genome ownership or epoch changed before temp creation');
        temp = path.join(root, FILENAME + '.tmp-' + randomUUID());
        handle = await fs.open(temp, 'wx', 0o600);
        ownedTemps.add(temp);
        active.phase = 'writing';
        await handle.writeFile(header);
        await handle.writeFile(bytes);
        await handle.sync();
        await handle.close(); handle = null;
        if (!current(job)) return response(job, 'cancelled', 'Genome ownership or epoch changed before publication');
        active.phase = 'publishing';
        // No await separates the final epoch check and entry to rename. A fence
        // arriving after entry waits for this physical operation to settle.
        await fs.rename(temp, canonical);
        published = true; ownedTemps.delete(temp); temp = null;
        active.phase = 'verifying';
        const actual = await readRecord();
        if (actual.status !== 'ready' || actual.revision !== revision || actual.digest !== digest || actual.json !== json) {
          throw new Error('Published genome failed independent readback verification');
        }
        cache = actual; // Keep physical truth even if the old caller was fenced.
        if (job.migration) migrationReceipts.delete(job.migration.backupId);
        if (!current(job)) return response(job, 'cancelled', 'Genome was physically settled after its ownership or epoch changed');
        return response(job, 'persisted');
      } catch (error) {
        // A rename that completed cannot be undone by suppressing a callback.
        // Quarantine unverifiable published state instead of claiming success.
        if (published) quarantineWith(error);
        return response(job, published ? 'verification-failed' : 'failed', error);
      } finally {
        if (handle) { try { await handle.close(); } catch (_) {} }
        if (temp) await cleanupTemp(temp);
        active = null;
      }
    });
  }
  async function fence({ ownerId, epoch } = {}) {
    const target = owner;
    if (!target || target.id !== ownerId || target.initializing || !Number.isSafeInteger(epoch) || epoch < target.epoch) {
      return { settled: false, ownerId, epoch: target?.epoch ?? null, error: 'Genome owner or fence epoch is stale' };
    }
    target.epoch = epoch; target.ready = false; // Immediate admission fence.
    migrationReceipts.clear();
    await tail;
    if (owner !== target || target.epoch !== epoch) return { settled: false, ownerId, epoch, error: 'Genome fence was superseded' };
    target.ready = !quarantine;
    return { settled: true, ownerId, epoch, writeAllowed: !quarantine };
  }
  function readVerified() {
    return enqueue(async () => {
      await initialize();
      try {
        const actual = await readRecord();
        acceptFreshRecord(actual);
      } catch (error) { quarantineWith(error); }
      return bootstrap();
    });
  }
  function snapshot() {
    return { status: quarantine ? 'error' : cache.status, revision: cache.revision, digest: cache.digest,
      byteLength: cache.byteLength, savedAt: cache.savedAt, writeAllowed: !quarantine && ['ready', 'absent'].includes(cache.status),
      ownerId: owner?.id ?? null, epoch: owner?.epoch ?? null, ownerReady: Boolean(owner?.ready),
      queued, active: active ? { ...active } : null, pendingTempCleanup: ownedTemps.size, error: quarantine };
  }
  function blockWrites(reason) {
    migrationReceipts.clear();
    if (owner) owner.ready = false;
    return quarantineWith(reason || 'Canonical writes blocked by startup migration validation');
  }
  return { initialize, beginOwner, commit, backupMigration, blockWrites, fence, readVerified, snapshot, drain: () => tail.then(() => ({ settled: true })) };
}

module.exports = { createStore, SCHEMA, FILENAME, MIGRATION_BACKUP_FILENAME, MAX_PAYLOAD_BYTES, MAX_HEADER_BYTES };
