/* Coalesce genome saves and serialize coherent snapshots outside the renderer. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveAutosave = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const installed = new WeakMap();

  function install(runtime, options = {}) {
    if (!runtime || typeof runtime.savePersistentGenome !== 'function') throw new TypeError('Genome save function required');
    if (installed.has(runtime)) return installed.get(runtime);
    const original = runtime.savePersistentGenome;
    const now = options.now || (() => root.performance?.now?.() ?? Date.now());
    const setTimer = options.setTimer || ((fn, ms) => setTimeout(fn, ms));
    const clearTimer = options.clearTimer || (id => clearTimeout(id));
    const requestIdle = options.requestIdleCallback === undefined ? root.requestIdleCallback?.bind(root) : options.requestIdleCallback;
    const cancelIdle = options.cancelIdleCallback === undefined ? root.cancelIdleCallback?.bind(root) : options.cancelIdleCallback;
    const windowTarget = options.window || root;
    const documentTarget = options.document || root.document;
    const codec = options.codec || root.AliveGenomeCodec;
    const durable = options.durableStorage;
    if (durable && (typeof durable.commit !== 'function' || typeof durable.fence !== 'function' ||
        typeof options.capture !== 'function' || typeof codec?.encode !== 'function')) {
      throw new TypeError('Durable autosave requires commit, fence, capture, and codec contracts');
    }
    const payloadMode = typeof options.capture === 'function' && typeof codec?.encode === 'function' &&
      (durable || typeof options.storage?.setItem === 'function' && typeof options.storage?.getItem === 'function' &&
      typeof options.storageKey === 'string' && options.storageKey.length > 0);
    const createWorker = options.createWorker || (typeof root.Worker === 'function' ? url => new root.Worker(url) : null);
    const workerCapable = payloadMode && createWorker && options.workerURL;
    const workerTimeoutMs = Math.max(50, Math.min(10000, Number(options.workerTimeoutMs) || 3000));
    const maxDelayMs = Math.max(1, Math.min(2000, Number(options.maxDelayMs) || 2000));
    const debounceMs = Math.max(0, Math.min(maxDelayMs, Number.isFinite(options.debounceMs) ? options.debounceMs : 750));
    const stats = { requests: 0, coalescedRequests: 0, flushAttempts: 0, cancellations: 0,
      lastDurationMs: 0, totalDurationMs: 0, maxDurationMs: 0, lastFlushAt: null,
      lastOutcome: 'not-run', lastError: '', lastReason: '', persistenceVerified: false,
      verifiedWrites: 0, workerFlushes: 0, fallbackCount: 0, lastFallbackReason: '',
      lastCaptureMs: 0, totalCaptureMs: 0, lastCommitMs: 0, totalCommitMs: 0,
      lastCommitDispatchMs: 0, totalCommitDispatchMs: 0, lastAsyncCommitLatencyMs: 0, totalAsyncCommitLatencyMs: 0,
      lastDispatchMs: 0, totalDispatchMs: 0,
      lastSerializationMs: 0, totalSerializationMs: 0, lastRoundTripMs: 0,
      workerMode: workerCapable ? 'worker' : payloadMode ? 'sync' : 'legacy',
      storageMode: durable ? 'async-main' : payloadMode ? 'sync' : 'legacy' };
    let pending = false, flushing = false, disposed = false, firstRequestAt = null, latestArgs = [];
    let debounceTimer = null, deadlineTimer = null, idleHandle = null;
    let generation = 0, idleGeneration = 0;
    let writeGeneration = 0, nextJobId = 0, activeJob = null, worker = null, workerFailed = false;
    let admissionClosed = false, draining = false, drainPromise = null, lastDrain = null, disposing = false, disposePromise = null;

    function clearScheduled() {
      generation++;
      idleGeneration++;
      if (debounceTimer !== null) clearTimer(debounceTimer);
      if (deadlineTimer !== null) clearTimer(deadlineTimer);
      if (idleHandle !== null && cancelIdle) cancelIdle(idleHandle);
      debounceTimer = deadlineTimer = idleHandle = null;
    }
    function snapshot() {
      return { ...stats, pending, flushing, disposed, inFlightId: activeJob?.id ?? null,
        phase: activeJob?.phase || null, epoch: writeGeneration, admissionClosed, draining, disposing,
        lastDrain: lastDrain && { ...lastDrain },
        deadlineAt: firstRequestAt === null ? null : firstRequestAt + maxDelayMs };
    }
    function schedule() {
      if (!pending || flushing || disposed || admissionClosed || disposing) return;
      if (debounceTimer !== null) clearTimer(debounceTimer);
      if (idleHandle !== null && cancelIdle) cancelIdle(idleHandle);
      idleHandle = null;
      const batch = generation, scheduledIdle = ++idleGeneration;
      const remaining = Math.max(0, firstRequestAt + maxDelayMs - now());
      // This timer is never moved by another request, even if idle callbacks
      // are starved. Main-thread blocking can still delay delivery by the host.
      if (deadlineTimer === null) deadlineTimer = setTimer(() => { if (batch === generation && pending && !disposed) flush('deadline'); }, remaining);
      debounceTimer = setTimer(() => {
        debounceTimer = null;
        if (batch !== generation || scheduledIdle !== idleGeneration || !pending || disposed) return;
        if (typeof requestIdle !== 'function') { flush('debounce'); return; }
        idleHandle = requestIdle(deadline => {
          idleHandle = null;
          if (batch !== generation || scheduledIdle !== idleGeneration || !pending || disposed) return;
          if (!deadline || deadline.didTimeout || typeof deadline.timeRemaining !== 'function' || deadline.timeRemaining() >= 4) flush('idle');
          // If there is no useful idle time, the original deadline still wins.
        }, { timeout: Math.max(1, firstRequestAt + maxDelayMs - now()) });
      }, Math.min(debounceMs, remaining));
    }
    function request(...args) {
      if (disposed || admissionClosed || disposing) return false;
      stats.requests++;
      if (pending) stats.coalescedRequests++;
      else { pending = true; firstRequestAt = now(); }
      latestArgs = args;
      schedule();
      return true;
    }
    function begin(reason) {
      clearScheduled();
      const args = latestArgs;
      latestArgs = [];
      pending = false;
      firstRequestAt = null;
      flushing = true;
      stats.flushAttempts++;
      stats.lastReason = String(reason).slice(0, 80);
      stats.lastError = '';
      stats.lastOutcome = 'pending';
      stats.persistenceVerified = false;
      return { id: ++nextJobId, generation: writeGeneration, args, startedAt: now(),
        phase: 'serializing', hostMs: 0, captureMs: 0, commitMs: 0, commitDispatchMs: 0, asyncCommitLatencyMs: 0,
        dispatchMs: 0, serializationMs: 0, roundTripMs: 0, timer: null };
    }
    function measure(job, field, fn) {
      const started = now();
      try {
        return fn();
      } finally {
        const duration = Math.max(0, now() - started);
        job[field] += duration;
        job.hostMs += duration;
      }
    }
    function finish(job, result) {
      // Async storage may settle after cancellation. Only its current owner can
      // publish UI state or release the writer; the drain owns cancelled jobs.
      if (durable && (activeJob !== job || job.generation !== writeGeneration || disposed)) return result;
      if (job.timer !== null) clearTimer(job.timer);
      job.phase = 'settled';
      if (activeJob === job) activeJob = null;
      flushing = false;
      stats.lastOutcome = result.status;
      stats.lastError = result.error || '';
      stats.persistenceVerified = result.persistenceVerified === true;
      stats.lastDurationMs = job.hostMs;
      stats.totalDurationMs += job.hostMs;
      stats.maxDurationMs = Math.max(stats.maxDurationMs, job.hostMs);
      stats.lastCaptureMs = job.captureMs; stats.totalCaptureMs += job.captureMs;
      stats.lastCommitMs = job.commitMs; stats.totalCommitMs += job.commitMs;
      stats.lastCommitDispatchMs = job.commitDispatchMs; stats.totalCommitDispatchMs += job.commitDispatchMs;
      stats.lastAsyncCommitLatencyMs = job.asyncCommitLatencyMs; stats.totalAsyncCommitLatencyMs += job.asyncCommitLatencyMs;
      stats.lastDispatchMs = job.dispatchMs; stats.totalDispatchMs += job.dispatchMs;
      stats.lastSerializationMs = job.serializationMs; stats.totalSerializationMs += job.serializationMs;
      stats.lastRoundTripMs = job.roundTripMs;
      stats.lastFlushAt = now();
      const outcome = { ...result, durationMs: job.hostMs, captureMs: job.captureMs,
        commitMs: job.commitMs, commitDispatchMs: job.commitDispatchMs, asyncCommitLatencyMs: job.asyncCommitLatencyMs,
        dispatchMs: job.dispatchMs, serializationMs: job.serializationMs, roundTripMs: job.roundTripMs };
      job.resolve?.(outcome);
      if (pending && !disposed) schedule();
      return outcome;
    }
    function failure(error) {
      return { status: 'failed', persistenceVerified: false, error: String(error?.message || error).slice(0, 300) };
    }
    function capture(job) {
      return measure(job, 'captureMs', () => options.capture.apply(runtime, job.args));
    }
    function commit(job, json) {
      if (job.generation !== writeGeneration || disposed) return { status: 'cancelled', persistenceVerified: false };
      if (typeof json !== 'string') throw new TypeError('Genome serializer did not return JSON text');
      return measure(job, 'commitMs', () => {
        options.storage.setItem(options.storageKey, json);
        if (options.storage.getItem(options.storageKey) !== json) {
          return { status: 'verification-failed', persistenceVerified: false, error: 'Stored genome readback differs from serialized snapshot' };
        }
        stats.verifiedWrites++;
        return { status: 'persisted', persistenceVerified: true };
      });
    }
    function commitDurably(job, json) {
      if (activeJob !== job || job.generation !== writeGeneration || disposed || job.phase !== 'serializing') return job.promise;
      if (typeof json !== 'string') return finish(job, failure(new TypeError('Genome serializer did not return JSON text')));
      // A serializer timeout/error cannot restart serialization once storage owns
      // the immutable text. Keep this job locked through physical readback.
      if (job.timer !== null) { clearTimer(job.timer); job.timer = null; }
      job.phase = 'committing';
      const started = now();
      let operation;
      try { operation = measure(job, 'commitDispatchMs', () => durable.commit({ epoch: job.generation, jobId: job.id, json })); }
      catch (error) { operation = Promise.reject(error); }
      job.commitPromise = Promise.resolve(operation).then(result => {
        job.asyncCommitLatencyMs = Math.max(0, now() - started);
        if (activeJob !== job || job.generation !== writeGeneration || disposed) return { status: 'cancelled', persistenceVerified: false };
        const matches = (result?.epoch === undefined || result.epoch === job.generation) && (result?.jobId === undefined || result.jobId === job.id);
        let outcome;
        if (!matches) outcome = { status: 'verification-failed', persistenceVerified: false, error: 'Durable storage returned a different snapshot identity' };
        else if (result?.status === 'persisted' && result.persistenceVerified === true) {
          stats.verifiedWrites++;
          outcome = { ...result, status: 'persisted', persistenceVerified: true };
        } else outcome = { status: ['failed', 'verification-failed', 'cancelled'].includes(result?.status) ? result.status : 'failed',
          persistenceVerified: false, error: String(result?.error || 'Durable storage did not verify this snapshot').slice(0, 300) };
        return finish(job, outcome);
      }, error => {
        job.asyncCommitLatencyMs = Math.max(0, now() - started);
        return finish(job, failure(error));
      });
      return job.promise;
    }
    function saveSynchronously(job) {
      try {
        if (payloadMode) {
          const payload = capture(job);
          if (durable && (codec.hasAsyncState ? codec.hasAsyncState(payload) : codec.hasPrimaryState?.(payload))) {
            if (typeof codec.encodeAsync !== 'function') throw new TypeError('Exact learned state requires an asynchronous codec');
            stats.workerMode = workerFailed ? 'failed-async' : 'async';
            const started = now();
            job.encodingAbort = new AbortController();
            const operation = measure(job, 'serializationMs', () => codec.encodeAsync(payload, { signal: job.encodingAbort.signal }));
            // Track only physical encoding settlement here, not job.promise or
            // commit completion: a cancellation drain must not await itself.
            job.encodingPromise = Promise.resolve(operation).then(
              json => ({ ok: true, json }), error => ({ ok: false, error }));
            job.encodingPromise.then(result => {
              job.serializationMs = Math.max(job.serializationMs, Math.max(0, now() - started));
              if (activeJob !== job || job.generation !== writeGeneration || disposed || admissionClosed) return;
              if (result.ok) commitDurably(job, result.json); else finish(job, failure(result.error));
            });
            return job.promise;
          }
          const json = measure(job, 'serializationMs', () => codec.encode(payload));
          return durable ? commitDurably(job, json) : finish(job, commit(job, json));
        }
        // Preserve legacy callers when no capture/storage contract is installed.
        // A swallowed storage failure cannot be promoted to verified success.
        const result = measure(job, 'serializationMs', () => original.apply(runtime, job.args));
        return finish(job, { status: result === false || result?.ok === false ? 'reported-failure' : 'returned-unverified', persistenceVerified: false });
      } catch (error) { return finish(job, failure(error)); }
    }
    function terminateWorker() {
      const old = worker;
      worker = null;
      if (old) {
        old.onmessage = old.onerror = old.onmessageerror = null;
        try { old.terminate(); } catch (_) { /* Already terminated. */ }
      }
    }
    function invalidate(reason) {
      writeGeneration++;
      const job = activeJob;
      activeJob = null;
      if (job) {
        job.encodingAbort?.abort();
        if (job.timer !== null) clearTimer(job.timer);
        // Termination bounds physical work as well as fencing late messages.
        terminateWorker();
        job.resolve?.({ status: 'cancelled', reason, persistenceVerified: false });
        flushing = false;
      }
    }
    function fallback(job, error) {
      if (activeJob !== job || job.generation !== writeGeneration || disposed || job.phase !== 'serializing') return;
      workerFailed = true;
      stats.workerMode = 'failed-sync';
      stats.fallbackCount++;
      stats.lastFallbackReason = String(error?.message || error).slice(0, 300);
      terminateWorker();
      if (job.timer !== null) { clearTimer(job.timer); job.timer = null; }
      job.roundTripMs = Math.max(0, now() - job.startedAt);
      // Failure may arrive after the model changed. Capture current state again
      // for the single fallback; paired exact-state encoding remains async.
      saveSynchronously(job);
    }
    function getWorker() {
      if (worker) return worker;
      const instance = createWorker(options.workerURL);
      worker = instance;
      instance.onmessage = event => {
        const job = activeJob, message = event.data || {};
        if (worker !== instance || !job || message.id !== job.id || job.generation !== writeGeneration || disposed || job.phase !== 'serializing') return;
        if (typeof message.error === 'string') { fallback(job, new Error(message.error)); return; }
        if (typeof message.json !== 'string' || !Number.isFinite(message.serializationMs) || message.serializationMs < 0) {
          fallback(job, new Error('Invalid genome worker response')); return;
        }
        job.serializationMs = message.serializationMs;
        job.roundTripMs = Math.max(0, now() - job.startedAt);
        try { if (durable) commitDurably(job, message.json); else finish(job, commit(job, message.json)); }
        catch (error) { finish(job, failure(error)); }
      };
      instance.onerror = instance.onmessageerror = event => {
        event?.preventDefault?.();
        if (worker === instance && activeJob) fallback(activeJob, new Error(event?.message || 'Genome worker failed'));
      };
      return instance;
    }
    function flushSync(reason = 'manual-sync') {
      if (disposed) return { status: 'disposed', persistenceVerified: false };
      // Async storage has no truthful synchronous durability path. In particular,
      // lifecycle callbacks must never fall back to writing the legacy key.
      if (durable) return { status: 'async-required', persistenceVerified: false, promise: Promise.resolve(flush(reason)) };
      // A legacy synchronous saver may reenter; retain a single later request.
      if (flushing && !activeJob) {
        if (!pending) { pending = true; firstRequestAt = now(); }
        return { status: 'deferred-reentrant', persistenceVerified: false };
      }
      invalidate(reason);
      return saveSynchronously(begin(reason));
    }
    function flush(reason = 'manual', continuation = false) {
      if (disposed) return { status: 'disposed', persistenceVerified: false };
      if (admissionClosed || disposing && !continuation) return { status: 'blocked', persistenceVerified: false, reason: 'Autosave admission is closed until storage drains and resumes' };
      if (!durable && ['pagehide', 'beforeunload', 'visibility-hidden', 'dispose'].includes(reason)) return flushSync(reason);
      if (flushing) {
        if (!pending) { pending = true; firstRequestAt = now(); }
        const job = activeJob;
        if (!job) return { status: 'deferred-reentrant', persistenceVerified: false };
        // Explicit callers can await the latest requested save, not merely the
        // older snapshot that happened to already be in flight.
        const requestedGeneration = writeGeneration;
        return job.promise.then(result => {
          if (disposed || admissionClosed || requestedGeneration !== writeGeneration) return { status: 'cancelled', persistenceVerified: false };
          if (activeJob) return activeJob.promise;
          return pending ? flush(reason, true) : result;
        }).catch(error => failure(error));
      }
      const job = begin(reason);
      // All async failures resolve with evidence. Timer-triggered saves never
      // leave an unhandled rejected promise behind.
      if (durable || workerCapable && !workerFailed) {
        activeJob = job;
        job.promise = new Promise(resolve => { job.resolve = resolve; });
      }
      if (!workerCapable || workerFailed) return saveSynchronously(job);
      try {
        const payload = capture(job);
        measure(job, 'dispatchMs', () => {
          const instance = getWorker();
          job.timer = setTimer(() => fallback(job, new Error('Genome worker timed out')), workerTimeoutMs);
          // postMessage synchronously copies the entire graph before returning.
          // No yield separates capture and dispatch, and no live buffer is
          // transferred or detached. The worker rejects shared backing stores.
          instance.postMessage({ id: job.id, payload });
          stats.workerFlushes++;
        });
      } catch (error) { fallback(job, error); }
      return job.promise;
    }
    function cancel(reason = 'cancelled') {
      if (durable) return cancelAndDrain(reason);
      clearScheduled();
      if (pending || activeJob) stats.cancellations++;
      invalidate(reason);
      pending = false;
      firstRequestAt = null;
      latestArgs = [];
    }
    function cancelAndDrain(reason = 'cancelled') {
      if (!durable) { cancel(reason); return Promise.resolve({ status: 'cancelled', settled: true, epoch: writeGeneration }); }
      if (drainPromise) return drainPromise;
      if (disposed) return Promise.resolve({ status: 'disposed', settled: true, epoch: writeGeneration });
      clearScheduled();
      admissionClosed = true;
      draining = true;
      if (pending || activeJob) stats.cancellations++;
      pending = false; firstRequestAt = null; latestArgs = [];
      const epoch = ++writeGeneration, job = activeJob;
      job?.encodingAbort?.abort();
      lastDrain = { status: 'pending', settled: false, epoch, reason };
      if (job?.timer !== null && job?.timer !== undefined) { clearTimer(job.timer); job.timer = null; }
      terminateWorker();
      stats.lastOutcome = 'cancelling'; stats.persistenceVerified = false;
      // A dispatched commit keeps its physical writer lock until both the
      // storage fence and the actual commit promise settle. No timeout releases it.
      let fenced;
      try { fenced = durable.fence({ epoch }); } catch (error) { fenced = Promise.reject(error); }
      const fenceResult = Promise.resolve(fenced).catch(error => ({ settled: false, error: String(error?.message || error).slice(0, 300) }));
      drainPromise = Promise.all([fenceResult, job?.commitPromise || Promise.resolve(), job?.encodingPromise || Promise.resolve()]).then(([result]) => {
        const settled = result?.settled === true && (result.epoch === undefined || result.epoch === epoch);
        const outcome = { status: settled ? 'cancelled' : 'blocked', settled, epoch, reason,
          ...(settled ? {} : { error: String(result?.error || 'Storage fence did not confirm physical settlement').slice(0, 300) }) };
        if (activeJob === job) activeJob = null;
        flushing = false; draining = false;
        lastDrain = outcome;
        if (!settled) drainPromise = null; // A later explicit call may retry the fence; never retry automatically.
        stats.lastOutcome = settled ? 'cancelled' : 'failed';
        stats.lastError = outcome.error || '';
        job?.resolve?.({ status: 'cancelled', persistenceVerified: false, reason });
        return { ...outcome };
      });
      return drainPromise;
    }
    function resume() {
      if (disposed || disposing || draining || lastDrain?.settled === false) return false;
      admissionClosed = false;
      drainPromise = null;
      if (pending) schedule();
      return true;
    }
    const lifecycleFlush = reason => durable ? flush(reason) : flushSync(reason);
    const onPageHide = () => lifecycleFlush('pagehide');
    const onBeforeUnload = () => lifecycleFlush('beforeunload');
    const onVisibility = () => { if (documentTarget?.hidden) lifecycleFlush('visibility-hidden'); };
    function wrappedSave(...args) { request(...args); }
    function release() {
      terminateWorker();
      disposed = true;
      windowTarget?.removeEventListener?.('pagehide', onPageHide);
      windowTarget?.removeEventListener?.('beforeunload', onBeforeUnload);
      documentTarget?.removeEventListener?.('visibilitychange', onVisibility);
      if (runtime.savePersistentGenome === wrappedSave) runtime.savePersistentGenome = original;
      installed.delete(runtime);
    }
    function dispose({ flushPending = true } = {}) {
      if (disposed) return;
      if (durable) {
        if (disposePromise) return disposePromise;
        // Start the final save before closing external request admission. When
        // one is already in flight, flush also waits for the latest snapshot.
        const save = flushPending && !admissionClosed ? flush('dispose') : null;
        disposing = true;
        disposePromise = Promise.resolve(save).then(async result => {
          const drain = await cancelAndDrain('dispose');
          if (!drain.settled) {
            disposing = false; disposePromise = null;
            return { status: 'blocked', persistenceVerified: false, error: drain.error };
          }
          release();
          return result || { status: 'disposed', persistenceVerified: false };
        });
        return disposePromise;
      }
      if (flushPending) flushSync('dispose');
      cancel();
      release();
    }
    const api = { request, flush, flushSync, cancel, cancelAndDrain, resume, dispose, snapshot };
    installed.set(runtime, api);
    runtime.savePersistentGenome = wrappedSave;
    windowTarget?.addEventListener?.('pagehide', onPageHide);
    windowTarget?.addEventListener?.('beforeunload', onBeforeUnload);
    documentTarget?.addEventListener?.('visibilitychange', onVisibility);
    return api;
  }
  return { install };
});
