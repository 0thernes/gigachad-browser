/* Acknowledged leases for app-issued writes to guests of one browser host.
 * The model stays in the host. This is not a distributed lock or page security boundary.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveAuthority = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const tokenKeys = ['sessionId', 'epoch', 'revision', 'tabId', 'documentGeneration', 'documentNonce', 'kind', 'permitId'];
  const sameToken = (a, b) => !!a && !!b && tokenKeys.every(key => a[key] === b[key]);

  // This function is serialized verbatim into the guest. Keep it self-contained.
  function bootstrapGuest(sessionId) {
    if (window.__aliveAuthority) return window.__aliveAuthority;
    const nonce = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    const keys = ['sessionId', 'epoch', 'revision', 'tabId', 'documentGeneration', 'documentNonce', 'kind', 'permitId'];
    const equal = (a, b) => !!a && !!b && keys.every(key => a[key] === b[key]);
    let revision = -1, lease = null;
    const manual = new Map(), cleanups = new Set();
    function clear() {
      lease = null; manual.clear();
      for (const entry of Array.from(cleanups)) {
        cleanups.delete(entry);
        try { entry.cleanup(); } catch (_) {}
      }
    }
    const api = {
      sessionId, documentNonce: nonce, executingToken: null,
      current(token, persistent = false) {
        if (!token || token.sessionId !== sessionId || token.documentNonce !== nonce || token.revision !== revision) return false;
        if (token.kind === 'manual') return !persistent && equal(manual.get(token.permitId), token);
        return equal(lease, token);
      },
      guard(token, callback) {
        return function (...args) { if (api.current(token, true)) return callback.apply(this, args); };
      },
      onRevoke(token, cleanup) {
        if (typeof cleanup !== 'function' || !api.current(token, true)) return () => {};
        const entry = { token, cleanup };
        cleanups.add(entry);
        return () => cleanups.delete(entry);
      },
      command(action, token = api.executingToken) {
        return api.current(token) && typeof action === 'string' ? { action, authority: { ...token } } : null;
      },
      control(request) {
        const ack = { sessionId, documentNonce: nonce, requestId: request.requestId, operation: request.operation, revision };
        if (request.sessionId !== sessionId) return { ...ack, ok: false, reason: 'session-mismatch' };
        if (request.operation === 'probe') return { ...ack, ok: true };
        if (request.documentNonce !== nonce) return { ...ack, ok: false, reason: 'document-mismatch' };
        if (!Number.isSafeInteger(request.revision) || request.revision < revision) return { ...ack, ok: false, reason: 'stale-revision' };
        if (request.operation === 'revoke') {
          revision = request.revision; clear();
          return { ...ack, revision, ok: true };
        }
        const token = request.token;
        if (!token || token.sessionId !== sessionId || token.documentNonce !== nonce || token.revision !== request.revision) {
          return { ...ack, ok: false, reason: 'token-mismatch' };
        }
        if (request.operation === 'release-manual') {
          if (equal(manual.get(token.permitId), token)) manual.delete(token.permitId);
          return { ...ack, ok: true, token: { ...token } };
        }
        if (request.operation !== 'install') return { ...ack, ok: false, reason: 'unknown-operation' };
        if (request.revision > revision) { clear(); revision = request.revision; }
        if (token.kind === 'manual') {
          if (manual.size && !manual.has(token.permitId)) return { ...ack, revision, ok: false, reason: 'manual-permit-busy' };
          manual.set(token.permitId, { ...token });
        } else {
          if (!equal(lease, token)) { clear(); lease = { ...token }; }
        }
        return { ...ack, revision, ok: true, token: { ...token } };
      }
    };
    window.__aliveAuthority = api;
    return api;
  }

  function controlScript(sessionId, request) {
    return `(() => { const authority = (${bootstrapGuest.toString()})(${JSON.stringify(sessionId)}); return authority.control(${JSON.stringify(request)}); })()`;
  }
  function guardedScript(code, token) {
    const literal = JSON.stringify(token);
    // Preserve Script completion values, including boolean and object results,
    // without eval/Function or rewriting the supplied app-owned script body.
    return `if (window.__aliveAuthority && window.__aliveAuthority.current(${literal})) { window.__aliveAuthority.executingToken = ${literal};\n${code}\n} else { null; }`;
  }

  function create(options = {}) {
    const executor = options.executor;
    if (!executor || typeof executor.runControl !== 'function' || typeof executor.waitForIdle !== 'function' ||
        typeof executor.documentIdentity !== 'function' || typeof executor.configureAuthority !== 'function') {
      throw new TypeError('Authority requires an authority-aware guest executor');
    }
    if (typeof options.resolveGuest !== 'function') throw new TypeError('resolveGuest(tabId) required');
    const now = options.now || (() => typeof performance !== 'undefined' ? performance.now() : Date.now());
    const setTimer = options.setTimer || ((fn, ms) => setTimeout(fn, ms));
    const clearTimer = options.clearTimer || (id => clearTimeout(id));
    const timeoutMs = Math.max(25, Math.min(10000, Number(options.timeoutMs) || 2000));
    const revocationAttempts = Math.max(1, Math.min(4, Math.floor(Number(options.revocationAttempts) || 3)));
    const revocationRetryMs = Math.max(0, Math.min(1000, Number.isFinite(options.revocationRetryMs) ? options.revocationRetryMs : 100));
    const maxGuests = Math.max(1, Math.min(128, Number(options.maxGuests) || 32));
    const sessionId = String(options.sessionId || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const records = new Map(), manuals = new Map(), auxiliary = new Map(), events = [];
    let revision = 0, epoch = Math.max(0, Number(options.getEpoch?.()) || 0), nextRequest = 0;
    let paused = options.paused !== false, disposed = false, owner = null, desired = null, active = null, pending = null;
    let cleanup = { revision, status: 'idle', attempt: 0, maxAttempts: revocationAttempts, nextRetryAt: null,
      unresolved: [], revoked: [], rawDrained: false, reason: '' };
    const metrics = { acknowledged: 0, blocked: 0, cancelled: 0, staleRejected: 0, revokedGuests: 0, manualRuns: 0 };
    const result = (status, reason, evidence) => ({ status, reason: reason || '', evidence: evidence || {} });
    function emit(type, detail = {}) {
      const event = { type, at: now(), ...detail }; events.push(event);
      if (events.length > 40) events.shift();
      try { options.onEvent?.(event); } catch (_) {}
    }
    function selected(id) { return !options.getSelectedTabId || options.getSelectedTabId() === id; }
    function documentCurrent(record) {
      const identity = executor.documentIdentity(record.webview);
      return options.resolveGuest(record.tabId) === record.webview && identity.available !== false &&
        identity.connected !== false && identity.generation === record.documentGeneration;
    }
    function recordFor(tabId) {
      const webview = options.resolveGuest(tabId);
      if (!webview) return null;
      const identity = executor.documentIdentity(webview);
      if (identity.available === false || identity.connected === false || options.isGuestReady?.(tabId, webview) === false) return null;
      let record = records.get(tabId);
      if (!record || record.webview !== webview || record.documentGeneration !== identity.generation) {
        if (!record && records.size >= maxGuests) return null;
        record = { tabId, webview, documentGeneration: identity.generation, documentNonce: null, lease: null, remoteGranted: false };
        records.set(tabId, record);
      }
      return record;
    }
    function isCurrent(token, webview) {
      const record = token && records.get(token.tabId);
      if (disposed || !record || token.sessionId !== sessionId || token.revision !== revision ||
          token.documentGeneration !== record.documentGeneration || token.documentNonce !== record.documentNonce ||
          (webview && record.webview !== webview) || !documentCurrent(record)) return false;
      if (token.kind === 'manual') return sameToken(manuals.get(token.permitId)?.token, token);
      return !paused && !active && !pending && sameToken(record.lease, token);
    }
    function leaseFor(tabId) { const lease = records.get(tabId)?.lease; return isCurrent(lease) ? lease : null; }
    function tokenFor(webview) {
      for (const record of records.values()) if (record.webview === webview) return leaseFor(record.tabId);
      return null;
    }
    const provider = { tokenFor, isCurrent, wrap: guardedScript,
      attachResult(value, token) {
        if (value && typeof value === 'object') value.authority = { ...token };
        return value;
      },
      onRejected() { metrics.staleRejected++; }
    };
    executor.configureAuthority(provider);

    function makeRequest(kind, tabId, reason, signal) {
      const abort = new AbortController();
      let resolve;
      const request = { kind, tabId, reason, id: `${sessionId}:${++nextRequest}`, revision,
        epoch, abort, startedAt: now(), deadline: now() + timeoutMs, promise: new Promise(r => { resolve = r; }), resolve };
      request.resolve = resolve;
      const onAbort = () => abort.abort();
      if (signal?.aborted) abort.abort();
      else signal?.addEventListener('abort', onAbort, { once: true });
      request.cleanup = () => signal?.removeEventListener('abort', onAbort);
      return request;
    }
    function validRequest(request, requireSelection = false) {
      return !disposed && !request.abort.signal.aborted && request.revision === revision &&
        (request.kind === 'revoke' || request.kind === 'manual' || !paused) && (!requireSelection || selected(request.tabId));
    }
    function remaining(request) { return Math.max(1, request.deadline - now()); }
    function settle(request, outcome) {
      request.cleanup();
      if (outcome.status === 'blocked') metrics.blocked++;
      if (outcome.status === 'cancelled') metrics.cancelled++;
      emit(outcome.status, { requestId: request.id, tabId: request.tabId, reason: outcome.reason });
      request.resolve(outcome);
    }
    function cancelOutcome(request) { return result('cancelled', 'Authority request superseded, paused, or cancelled', { requestId: request.id }); }
    async function control(record, request, operation, token) {
      const failed = (reason, mismatch = false) => {
        if (!request.controlFailures) request.controlFailures = new Map();
        request.controlFailures.set(record, { reason, mismatch });
        return null;
      };
      if (!validRequest(request)) return failed('Authority request cancelled or superseded');
      if (!documentCurrent(record)) return failed('Document identity is no longer current');
      const command = { operation, sessionId, requestId: request.id, revision: request.revision,
        documentNonce: record.documentNonce, ...(token ? { token } : {}) };
      let ack;
      try {
        ack = await executor.runControl(record.webview, controlScript(sessionId, command), {
          tag: operation === 'revoke' ? 'authority-revoke' : 'authority-control', timeoutMs: remaining(request), signal: request.abort.signal
        });
      } catch (error) { return failed(`Control execution failed: ${String(error?.message || error).slice(0, 160)}`); }
      if (!validRequest(request)) return failed('Authority request cancelled or superseded');
      if (!documentCurrent(record)) return failed('Document identity changed during acknowledgement');
      if (!ack) return failed('Missing control acknowledgement');
      if (ack.sessionId !== sessionId || ack.requestId !== request.id || ack.operation !== operation) return failed('Acknowledgement session/request/operation mismatch');
      if (typeof ack.documentNonce !== 'string' || !ack.documentNonce) return failed('Acknowledgement document nonce missing');
      if (ack.ok !== true) return failed(`Guest rejected ${operation}: ${String(ack.reason || 'unknown reason').slice(0, 120)}`,
        ack.ok === false && ack.reason === 'document-mismatch' && ack.documentNonce !== record.documentNonce);
      if (operation !== 'probe' && (ack.documentNonce !== record.documentNonce || ack.revision !== request.revision)) return failed('Acknowledgement document nonce/revision mismatch');
      if (token && !sameToken(ack.token, token)) return failed('Acknowledgement token mismatch');
      request.controlFailures?.delete(record);
      return ack;
    }
    async function probe(record, request) {
      const ack = await control(record, request, 'probe');
      if (!ack) return false;
      if (record.documentNonce && record.documentNonce !== ack.documentNonce) return false;
      record.documentNonce = ack.documentNonce;
      return true;
    }
    async function drain(recordsToDrain, request) {
      const unique = Array.from(new Set(recordsToDrain.filter(documentCurrent).map(record => record.webview)));
      const idle = await executor.waitForIdle(unique, { timeoutMs: remaining(request), signal: request.abort.signal });
      return idle && validRequest(request);
    }
    async function revokeKnown(request) {
      request.revocations ||= [];
      request.unresolvedRevocations = [];
      const existing = Array.from(records.values()).filter(record => record.documentNonce && documentCurrent(record));
      await Promise.all(existing.map(async record => {
        if (request.revocations.some(item => item.tabId === record.tabId && item.documentGeneration === record.documentGeneration && item.documentNonce === record.documentNonce)) return;
        let ack = await control(record, request, 'revoke');
        // A committed error document can have a new nonce before Electron emits
        // the expected lifecycle event. Reconcile only cleanup, using a fresh
        // exact probe followed by nonce-scoped revoke. This does not retire raw
        // scripts, infer a generation change, or create a new lease.
        if (!ack && request.kind === 'revoke' && request.controlFailures?.get(record)?.mismatch && validRequest(request)) {
          const mismatchReason = request.controlFailures.get(record).reason;
          const fresh = await control(record, request, 'probe');
          if (fresh) {
            request.reconciliations ||= new Map();
            const previousDocumentNonce = request.reconciliations.get(record)?.previousDocumentNonce || record.documentNonce;
            request.reconciliations.set(record, { previousDocumentNonce, reconciliationReason: mismatchReason, freshProbeAcknowledged: true });
            record.documentNonce = fresh.documentNonce;
            emit('revocation-document-reconciled', { tabId: record.tabId, revision: request.revision,
              previousDocumentNonce, documentNonce: fresh.documentNonce, reason: mismatchReason });
            ack = await control(record, request, 'revoke');
          }
        }
        if (!ack) {
          request.unresolvedRevocations.push({ tabId: record.tabId, documentGeneration: record.documentGeneration,
            documentNonce: record.documentNonce, reason: request.controlFailures?.get(record)?.reason || 'Revocation acknowledgement unavailable' });
          return;
        }
        record.remoteGranted = false; metrics.revokedGuests++;
        request.revocations.push({ tabId: record.tabId, documentGeneration: record.documentGeneration,
          documentNonce: record.documentNonce, revision: request.revision, acknowledged: true,
          ...(request.reconciliations?.get(record) || {}) });
      }));
      // Revoke callback permissions first using a distinct retained control
      // lane: an unresolved async raw promise must not leave an old rAF alive.
      // Still drain ALL physical scripts before any new grant can commit,
      // including installs with lost ACKs and pre-configuration/unscoped work.
      try { request.rawDrained = !!await executor.waitForIdle(null, { timeoutMs: remaining(request), signal: request.abort.signal }) && validRequest(request); }
      catch (error) { request.rawDrained = false; request.drainError = String(error?.message || error).slice(0, 160); }
      return request.unresolvedRevocations.length === 0 && request.rawDrained;
    }
    function cleanupSnapshot() {
      return { ...cleanup, unresolved: cleanup.unresolved.map(item => ({ ...item })), revoked: cleanup.revoked.map(item => ({ ...item })) };
    }
    function waitForRetry(request) {
      if (!validRequest(request)) return Promise.resolve();
      return new Promise(resolve => {
        let timer;
        const finish = () => { clearTimer(timer); request.abort.signal.removeEventListener('abort', finish); resolve(); };
        request.abort.signal.addEventListener('abort', finish, { once: true });
        timer = setTimer(finish, revocationRetryMs);
      });
    }
    async function revokeWithRetries(request) {
      for (let attempt = 1; attempt <= revocationAttempts && validRequest(request); attempt++) {
        request.deadline = now() + timeoutMs;
        cleanup = { revision: request.revision, status: 'pending', attempt, maxAttempts: revocationAttempts,
          nextRetryAt: null, unresolved: request.unresolvedRevocations || [], revoked: request.revocations || [], rawDrained: false, reason: '' };
        const complete = await revokeKnown(request);
        if (!validRequest(request)) return false;
        const reason = complete ? '' : request.unresolvedRevocations.length
          ? 'Guest revocation acknowledgements remain unresolved' : `Physical guest writers did not settle${request.drainError ? ': ' + request.drainError : ''}`;
        cleanup = { ...cleanup, status: complete ? 'completed' : attempt === revocationAttempts ? 'blocked' : 'pending',
          unresolved: request.unresolvedRevocations, revoked: request.revocations, rawDrained: request.rawDrained === true, reason };
        if (complete) return true;
        if (attempt < revocationAttempts) {
          cleanup.nextRetryAt = now() + revocationRetryMs;
          emit('revocation-retry', { attempt, revision: request.revision, unresolved: cleanup.unresolved.map(item => item.tabId), rawDrained: cleanup.rawDrained });
          await waitForRetry(request);
        }
      }
      request.cleanupExhausted = validRequest(request);
      return false;
    }
    function token(record, request, kind, permitId = '') {
      return Object.freeze({ sessionId, epoch: request.epoch, revision: request.revision, tabId: record.tabId,
        documentGeneration: record.documentGeneration, documentNonce: record.documentNonce, kind, permitId });
    }
    async function establish(record, request, kind) {
      if (!await drain([record], request) || !await probe(record, request)) return null;
      const lease = token(record, request, kind, kind === 'manual' ? request.id : '');
      const ack = await control(record, request, 'install', lease);
      if (!ack) return null;
      record.remoteGranted = true;
      return { lease, ack };
    }
    async function transition(request) {
      if (!validRequest(request, request.kind === 'select')) return cancelOutcome(request);
      if (!await revokeWithRetries(request)) return validRequest(request) ? result('blocked', cleanup.reason, { cleanup: cleanupSnapshot() }) : cancelOutcome(request);
      if (request.kind === 'revoke') return result('completed', '', { revoked: true, revision: request.revision, cleanup: cleanupSnapshot() });
      const destination = recordFor(request.tabId);
      if (!destination) return result('blocked', 'Destination document is not ready');
      const installed = await establish(destination, request, 'primary');
      if (!installed || !validRequest(request, true)) return validRequest(request) ? result('blocked', 'Destination lease acknowledgement unavailable or stale') : cancelOutcome(request);
      const record = { transferId: request.id, fromTabId: owner?.tabId || null, toTabId: request.tabId,
        prevEpoch: owner?.epoch ?? (Number(options.getEpoch?.()) || 0), newEpoch: request.epoch,
        reason: request.reason, status: 'GUEST_LEASE_ACKNOWLEDGED', destinationAcknowledged: true,
        scope: 'single browser host; app-issued guest execution leases; shared host model',
        documentNonce: installed.lease.documentNonce, documentGeneration: installed.lease.documentGeneration,
        sessionId, revision: request.revision, elapsedMs: Math.max(0, now() - request.startedAt),
        rawDrained: request.rawDrained === true, revokedDocuments: request.revocations || [],
        distributedWriterFencing: false, checkpointTransferred: false };
      try { options.onCommit?.(record); }
      catch (error) { return result('blocked', `Host authority commit failed: ${String(error?.message || error).slice(0, 180)}`); }
      destination.lease = installed.lease; owner = installed.lease; metrics.acknowledged++;
      return result('completed', '', record);
    }
    function pump() {
      if (active || !pending || disposed) return;
      const request = active = pending; pending = null;
      Promise.resolve().then(() => transition(request)).catch(error => result('blocked', String(error?.message || error).slice(0, 220)))
        .then(outcome => {
          if (active === request) active = null;
          // External cancellation may arrive before the first revocation. If
          // there is no newer selection, finish the fence with a fresh bounded
          // cleanup request; never let a cancelled signal suppress revocation.
          if (request.kind === 'select' && outcome.status !== 'completed' && request.revision === revision && !pending && !disposed) {
            pending = makeRequest('revoke', null, 'incomplete-handoff-cleanup');
            cleanup = { ...cleanup, revision, status: 'pending', nextRetryAt: null, reason: 'Incomplete handoff cleanup pending' };
          }
          settle(request, outcome); pump();
        });
    }
    function fence(reason) {
      revision++;
      cleanup = { revision, status: 'pending', attempt: 0, maxAttempts: revocationAttempts, nextRetryAt: null,
        unresolved: [], revoked: [], rawDrained: false, reason };
      for (const record of records.values()) record.lease = null;
      for (const entry of manuals.values()) entry.request.abort.abort();
      manuals.clear();
      for (const request of auxiliary.values()) request.abort.abort();
      active?.abort.abort();
      if (pending) { pending.abort.abort(); settle(pending, cancelOutcome(pending)); pending = null; }
      emit('fenced', { reason, revision });
    }
    function enqueue(request) { pending = request; pump(); return request.promise; }
    function select(tabId, { reason = 'tab-selected', signal } = {}) {
      if (disposed) return Promise.resolve(result('blocked', 'Authority disposed'));
      if (signal?.aborted) return Promise.resolve(result('cancelled', 'Authority request cancelled'));
      const previousDesired = desired;
      desired = tabId;
      if (paused) {
        // UI selection still changes authority while paused: an A -> B -> A
        // round trip must not revive an outstanding one-shot permit from A.
        const differentManual = Array.from(manuals.values()).some(entry => entry.request.tabId !== tabId);
        if (previousDesired !== tabId || differentManual) {
          return invalidate('paused-tab-selected').then(() => result('blocked', 'Autonomy paused; browser selection retained'));
        }
        return Promise.resolve(result('blocked', 'Autonomy paused; browser selection retained'));
      }
      if (leaseFor(tabId)?.kind === 'primary' && selected(tabId)) return Promise.resolve(result('completed', '', { unchanged: true, newEpoch: owner.epoch, toTabId: tabId, destinationAcknowledged: true }));
      if (active?.kind === 'select' && active.tabId === tabId && !active.abort.signal.aborted) return active.promise;
      fence(reason); epoch = Math.max(epoch, Number(options.getEpoch?.()) || 0) + 1;
      return enqueue(makeRequest('select', tabId, reason, signal));
    }
    function invalidate(reason = 'invalidated') {
      if (disposed) return Promise.resolve(result('blocked', 'Authority disposed'));
      fence(reason);
      return enqueue(makeRequest('revoke', null, reason));
    }
    function setPaused(value) {
      paused = Boolean(value);
      if (paused) return invalidate('paused');
      const target = options.getSelectedTabId?.() || desired;
      return target ? select(target, { reason: 'resumed' }) : Promise.resolve(result('blocked', 'No selected document'));
    }
    function grant(tabId, { signal } = {}) {
      if (disposed || paused || active || pending || !owner || !leaseFor(owner.tabId)) return Promise.resolve(result('blocked', 'Primary authority is not ready'));
      const current = leaseFor(tabId);
      if (current) return Promise.resolve(result('completed', '', { token: current, destinationAcknowledged: true }));
      if (auxiliary.has(tabId)) return auxiliary.get(tabId).promise;
      if (auxiliary.size >= 8) return Promise.resolve(result('blocked', 'Auxiliary grant limit reached'));
      const request = makeRequest('grant', tabId, 'explicit-cross-tab-grant', signal);
      auxiliary.set(tabId, request);
      (async () => {
        const destination = recordFor(tabId);
        const installed = destination && await establish(destination, request, 'auxiliary');
        if (!installed || !validRequest(request)) return validRequest(request) ? result('blocked', 'Auxiliary document did not acknowledge') : cancelOutcome(request);
        destination.lease = installed.lease;
        return result('completed', '', { token: installed.lease, destinationAcknowledged: true });
      })().catch(error => result('blocked', String(error?.message || error).slice(0, 220))).then(outcome => {
        if (auxiliary.get(tabId) === request) auxiliary.delete(tabId);
        settle(request, outcome);
      });
      return request.promise;
    }
    async function withManualLease(tabId, callback, { signal } = {}) {
      if (disposed || typeof callback !== 'function' || active || pending || manuals.size || cleanup.status === 'blocked' || cleanup.status === 'pending') return result('blocked', 'Manual guest transaction is unavailable or busy; unresolved cleanup must finish first');
      const request = makeRequest('manual', tabId, 'explicit-manual-action', signal);
      const destination = recordFor(tabId);
      if (!destination) { request.cleanup(); return result('blocked', 'Manual destination document is not ready'); }
      // Reserve the bounded permit before awaiting so concurrent callers cannot
      // both pass admission. Automatic tokenFor never exposes this permit.
      const entry = { request, token: null }; manuals.set(request.id, entry);
      let timer, onAbort;
      try {
        const installed = await establish(destination, request, 'manual');
        if (!installed || !validRequest(request)) return result('blocked', 'Manual document did not acknowledge');
        entry.token = installed.lease; metrics.manualRuns++;
        const stopped = new Promise(resolve => {
          onAbort = () => resolve(result('cancelled', 'Manual lease cancelled'));
          request.abort.signal.addEventListener('abort', onAbort, { once: true });
          timer = setTimer(() => { request.abort.abort(); resolve(result('blocked', 'Manual lease timed out')); }, remaining(request));
        });
        const work = Promise.resolve().then(() => callback(installed.lease));
        const value = await Promise.race([work, stopped]);
        return validRequest(request) ? value : cancelOutcome(request);
      } catch (error) { return result('blocked', String(error?.message || error).slice(0, 220)); }
      finally {
        clearTimer(timer); if (onAbort) request.abort.signal.removeEventListener('abort', onAbort);
        manuals.delete(request.id); request.cleanup();
        // Host admission is already fenced even if this raw control script
        // cannot finish. Later transitions still drain the physical raw lock.
        if (entry.token && request.revision === revision && documentCurrent(destination)) {
          const cleanup = makeRequest('manual', tabId, 'manual-permit-release');
          await control(destination, cleanup, 'release-manual', entry.token).catch(() => null);
          cleanup.cleanup();
        }
      }
    }
    function validateCommand(command, tabId) {
      const valid = !!command && typeof command.action === 'string' && command.authority?.tabId === tabId && isCurrent(command.authority);
      if (!valid) metrics.staleRejected++;
      return valid;
    }
    const unsubscribe = executor.subscribeLifecycle?.(event => {
      const affected = Array.from(records.values()).filter(record => record.webview === event.webview);
      if (!affected.length) return;
      for (const record of affected) { record.lease = null; record.documentNonce = null; record.remoteGranted = false; }
      if (['tab-closed', 'guest-destroyed', 'renderer-gone'].includes(event.reason)) {
        for (const record of affected) records.delete(record.tabId);
      }
      if (affected.some(record => record.tabId === owner?.tabId || record.tabId === active?.tabId)) invalidate('guest-' + event.reason);
    });
    function snapshot() {
      return { sessionId, revision, epoch, paused, disposed, owner: owner ? { ...owner } : null,
        desiredTabId: desired, transitioning: !!(active || pending), pendingTarget: pending?.tabId || active?.tabId || null,
        leases: Array.from(records.values()).filter(record => isCurrent(record.lease)).map(record => ({ ...record.lease })),
        manuals: manuals.size, cleanup: cleanupSnapshot(), metrics: { ...metrics }, events: events.map(event => ({ ...event })) };
    }
    async function dispose() {
      if (disposed) return;
      await invalidate('disposed'); disposed = true; unsubscribe?.();
      // Keep admission fail-closed after disposal. An explicit executor
      // reconfiguration is required to return to legacy unguarded operation.
      records.clear();
    }
    return { select, grant, leaseFor, isCurrent, validateCommand, withManualLease, setPaused, invalidate, snapshot, dispose };
  }
  return { create, controlScript, guardedScript, sameToken };
});
