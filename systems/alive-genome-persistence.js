/* Renderer cache and receipt checks for the main-process canonical genome store. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveGenomePersistence = api;
  if (root?.document && root.gigachad && !root.aliveGenomePersistence) {
    root.aliveGenomePersistence = api.create({ bootstrap: root.gigachad.genomeBootstrap,
      invoke: (channel, payload) => root.gigachad.invoke(channel, payload) });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const validInteger = value => Number.isSafeInteger(value) && value >= 0;
  const validDigest = value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
  function validJSON(json) {
    if (typeof json !== 'string' || !json.length) return false;
    try { const value = JSON.parse(json); return value !== null && typeof value === 'object' && !Array.isArray(value); }
    catch (_) { return false; }
  }
  function create({ bootstrap, invoke } = {}) {
    const initial = bootstrap || {};
    const ownerId = typeof initial.ownerId === 'string' ? initial.ownerId : '';
    let epoch = validInteger(initial.epoch) ? initial.epoch : 0;
    let revision = validInteger(initial.revision) ? initial.revision : 0;
    let digest = validDigest(initial.digest) ? initial.digest : null;
    let status = initial.status, json = null, source = 'none', legacyRead = false;
    let error = '', lastOutcome = 'bootstrap', application = 'not-applied', applicationFailed = false;
    let storeAllowsWrite = initial.writeAllowed === true, admission = true, pending = 0, verifiedWrites = 0, operationSerial = 0;
    const bootstrapStatus = initial.status || 'error';
    if (!ownerId || typeof invoke !== 'function' || !['ready', 'absent', 'error'].includes(status) ||
        status === 'ready' && (!validJSON(initial.json) || !validDigest(initial.digest) || !validInteger(initial.revision))) {
      status = 'error'; error = 'Invalid canonical genome bootstrap'; storeAllowsWrite = false;
    } else if (status === 'ready') { json = initial.json; source = 'canonical'; }
    else if (status === 'error') { error = String(initial.error || 'Canonical genome unavailable'); storeAllowsWrite = false; }
    const bootstrapBlocked = status === 'error' || !storeAllowsWrite;
    const writable = () => !bootstrapBlocked && storeAllowsWrite && admission && !applicationFailed;
    const failure = (message, outcome = 'failed') => {
      error = String(message).slice(0, 300); lastOutcome = outcome;
      return { status: outcome, persistenceVerified: false, ownerId, epoch, error };
    };
    const stale = (message, atEpoch) => ({ status: 'cancelled', persistenceVerified: false, ownerId, epoch: atEpoch, error: message });
    const current = (serial, atEpoch) => serial === operationSerial && atEpoch === epoch;
    function initialJSON(storage, key) {
      if (status === 'error') return null;
      if (json !== null) return json;
      if (legacyRead) return null;
      legacyRead = true;
      try {
        const legacy = storage?.getItem?.(key);
        if (legacy === null || legacy === undefined || legacy === '') { application = 'absent'; return null; }
        if (!validJSON(legacy)) {
          applicationFailed = true; application = 'rejected'; error = 'Legacy genome is not a valid JSON object';
          lastOutcome = 'application-failed'; return null;
        }
        json = legacy; source = 'legacy'; return json;
      } catch (cause) {
        applicationFailed = true; application = 'rejected'; error = String(cause?.message || cause).slice(0, 300);
        lastOutcome = 'legacy-read-failed'; return null;
      }
    }
    function markApplied(success, details = {}) {
      if (success === true) { application = 'applied'; return true; }
      if (details.hadJSON === true || json !== null) {
        applicationFailed = true; application = 'rejected'; lastOutcome = 'application-failed';
        error = 'Stored genome could not be applied; canonical writes are blocked';
      } else if (!applicationFailed) application = status === 'error' ? 'unavailable' : 'absent';
      return false;
    }
    async function commit(request = {}) {
      if (!writable() || request.epoch !== epoch || !validInteger(request.jobId) || typeof request.json !== 'string') {
        return failure(error || 'Genome write admission is closed or request identity is stale', 'cancelled');
      }
      const sent = { ownerId, epoch, jobId: request.jobId, json: request.json };
      const serial = ++operationSerial;
      pending++;
      try {
        const result = await invoke('alive-genome-commit', sent);
        if (!current(serial, sent.epoch) || !admission) return stale('Genome commit was superseded before acknowledgement', sent.epoch);
        if (result?.status !== 'persisted' || result.persistenceVerified !== true) {
          return failure(result?.error || 'Canonical genome write was not verified',
            ['cancelled', 'failed', 'verification-failed'].includes(result?.status) ? result.status : 'failed');
        }
        if (result.ownerId !== ownerId || result.epoch !== sent.epoch || result.jobId !== sent.jobId ||
            !validInteger(result.revision) || result.revision < revision || !validDigest(result.digest) ||
            result.revision === revision && (result.digest !== digest || sent.json !== json)) {
          return failure('Canonical genome acknowledgement identity or revision mismatch', 'verification-failed');
        }
        json = sent.json; revision = result.revision; digest = result.digest; source = 'canonical'; status = 'ready';
        error = ''; lastOutcome = 'persisted'; verifiedWrites++;
        return { ...result, persistenceVerified: true };
      } catch (cause) { return current(serial, sent.epoch) ? failure(cause?.message || cause) : stale('Superseded genome commit failed', sent.epoch); }
      finally { pending--; }
    }
    async function fence(request = {}) {
      if (!validInteger(request.epoch) || request.epoch < epoch) return { settled: false, ownerId, epoch, error: 'Invalid genome fence epoch' };
      epoch = request.epoch; admission = false; const requestedEpoch = epoch;
      const serial = ++operationSerial;
      pending++;
      try {
        const result = await invoke('alive-genome-fence', { ownerId, epoch: requestedEpoch });
        if (!current(serial, requestedEpoch)) return { settled: false, ownerId, epoch: requestedEpoch, error: 'Genome fence was superseded' };
        const settled = result?.settled === true && result.ownerId === ownerId && result.epoch === requestedEpoch && epoch === requestedEpoch;
        if (!settled) { error = String(result?.error || 'Genome fence acknowledgement mismatch').slice(0, 300); lastOutcome = 'fence-failed'; }
        else { admission = true; if (result.writeAllowed === false) storeAllowsWrite = false; lastOutcome = 'fenced'; }
        return { settled, ownerId, epoch: requestedEpoch, ...(settled ? {} : { error }) };
      } catch (cause) {
        if (!current(serial, requestedEpoch)) return { settled: false, ownerId, epoch: requestedEpoch, error: 'Superseded genome fence failed' };
        error = String(cause?.message || cause).slice(0, 300); lastOutcome = 'fence-failed'; return { settled: false, ownerId, epoch: requestedEpoch, error };
      }
      finally { pending--; }
    }
    async function readFresh() {
      if (!admission) return { status: 'error', json: null, writeAllowed: false, error: 'Genome read admission is fenced' };
      const requestedEpoch = epoch;
      const serial = ++operationSerial;
      pending++;
      try {
        const result = await invoke('alive-genome-read', { ownerId, epoch: requestedEpoch });
        if (!current(serial, requestedEpoch) || !admission) return { status: 'error', json: null, writeAllowed: false, error: 'Genome read was superseded' };
        if (result?.ownerId !== ownerId || result?.epoch !== requestedEpoch) {
          storeAllowsWrite = false; error = 'Genome read acknowledgement identity mismatch'; lastOutcome = 'read-failed';
          return { status: 'error', json: null, writeAllowed: false, error };
        }
        if (result?.status === 'ready' && validJSON(result.json) && validInteger(result.revision) &&
            result.revision >= revision && validDigest(result.digest) &&
            (result.revision !== revision || digest === null || result.digest === digest)) {
          json = result.json; revision = result.revision; digest = result.digest; source = 'canonical'; status = 'ready'; legacyRead = true;
          storeAllowsWrite = result.writeAllowed === true; error = ''; lastOutcome = 'read'; application = 'not-applied';
          return { ...result };
        }
        if (result?.status === 'absent' && revision === 0 && source !== 'canonical') {
          json = null; status = 'absent'; source = 'none'; legacyRead = true;
          storeAllowsWrite = result.writeAllowed === true; lastOutcome = 'read-absent'; return { ...result, json: null };
        }
        storeAllowsWrite = false;
        error = String(result?.error || 'Canonical genome read failed validation').slice(0, 300); lastOutcome = 'read-failed';
        return { status: 'error', json: null, writeAllowed: false, error };
      } catch (cause) {
        if (!current(serial, requestedEpoch)) return { status: 'error', json: null, writeAllowed: false, error: 'Superseded genome read failed' };
        storeAllowsWrite = false; error = String(cause?.message || cause).slice(0, 300); lastOutcome = 'read-failed';
        return { status: 'error', json: null, writeAllowed: false, error };
      } finally { pending--; }
    }
    function snapshot() {
      return { status, bootstrapStatus, source, ownerId, epoch, revision, digest, writeAllowed: writable(),
        application, applicationFailed, legacyRead, pending, verifiedWrites, lastOutcome, error,
        scope: 'Main-process canonical genome; cached JSON changes only after matching verified commit or validated read. No durability claim before acknowledgement.' };
    }
    return Object.freeze({ initialJSON, markApplied, commit, fence, readFresh, snapshot });
  }
  return Object.freeze({ create });
});
