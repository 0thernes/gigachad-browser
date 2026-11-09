/* Retain raw Electron guest-execution locks after timeout or cancellation.
 * A timeout releases the caller, not the guest script that Electron is running.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveGuestExecution = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function createExecutor(options = {}) {
    const guests = new WeakMap();
    const setTimer = options.setTimer || ((fn, ms) => setTimeout(fn, ms));
    const clearTimer = options.clearTimer || (id => clearTimeout(id));
    const now = options.now || (() => typeof performance !== 'undefined' ? performance.now() : Date.now());
    const maxLanes = 8;
    const active = new Set();
    const lifecycleEvents = [];
    const lifecycleListeners = new Set(), idleWaiters = new Set();
    let authorityProvider = null;
    let nextGuestId = 0;

    function notifyIdle() { for (const check of Array.from(idleWaiters)) check(); }

    function identify(webview) {
      let url = '', webContentsId = null;
      try { url = String(webview.getURL?.() || webview.src || '').slice(0, 1000); } catch (_) {}
      try { webContentsId = webview.getWebContentsId?.() ?? null; } catch (_) {}
      return { elementId: String(webview.id || '').slice(0, 120), url, webContentsId,
        connected: typeof webview.isConnected === 'boolean' ? webview.isConnected : null };
    }
    function invalidate(state, reason, unavailable = false) {
      state.generation++;
      state.unavailable = unavailable;
      const released = state.lanes.size;
      for (const record of Array.from(state.lanes.values())) record.invalidate(reason);
      const event = { guestId: state.id, generation: state.generation, reason, released, at: now(), ...identify(state.webview) };
      state.lastInvalidation = event;
      lifecycleEvents.push(event);
      if (lifecycleEvents.length > 32) lifecycleEvents.shift();
      for (const listener of lifecycleListeners) {
        try { listener({ ...event, webview: state.webview }); } catch (_) {}
      }
    }
    function getGuest(webview) {
      let state = guests.get(webview);
      if (state) return state;
      state = { id: ++nextGuestId, webview, lanes: new Map(), generation: 0, unavailable: false, lastInvalidation: null };
      guests.set(webview, state);
      if (typeof webview.addEventListener === 'function') {
        // did-navigate excludes same-document navigation. A start or failure
        // does not prove that the old document stopped running its scripts.
        webview.addEventListener('did-navigate', () => invalidate(state, 'document-replaced'));
        webview.addEventListener('destroyed', () => invalidate(state, 'guest-destroyed', true));
        webview.addEventListener('render-process-gone', () => invalidate(state, 'renderer-gone', true));
        webview.addEventListener('did-attach', () => { state.unavailable = false; });
      }
      return state;
    }

    function run(webview, code, { timeoutMs = 1350, tag = 'default', signal, authority = true, authorityToken, control = false } = {}) {
      if (!webview || typeof webview.executeJavaScript !== 'function' || typeof code !== 'string' || signal?.aborted) return Promise.resolve(null);
      const state = getGuest(webview);
      if (state.unavailable || webview.isConnected === false) return Promise.resolve(null);
      const provider = authority !== false ? authorityProvider : null;
      const token = provider ? authorityToken || provider.tokenFor(webview) : null;
      const tokenKey = token ? JSON.stringify(token) : null;
      function authorityCurrent() {
        if (authority === false) return true;
        if (authorityProvider !== provider) return false;
        try { return !provider || provider.isCurrent(token, webview); } catch (_) { return false; }
      }
      function rejected() { try { provider?.onRejected?.(); } catch (_) {} return Promise.resolve(null); }
      if (!authorityCurrent()) return rejected();
      const lanes = state.lanes;
      const lane = String(tag).slice(0, 80) || 'default';
      const existing = lanes.get(lane);
      if (existing) {
        // A new epoch/permit must never join an older physical execution, even
        // when the old caller already timed out. Control requests also have
        // distinct acknowledgement identities and cannot share stale results.
        if (existing.provider !== provider || existing.tokenKey !== tokenKey ||
            existing.authorityRequired !== (authority !== false) || (control && existing.code !== code)) return rejected();
        // A caller joining a pending lane can cancel its own wait, but cannot
        // replace the running script or obtain a stale result after its abort.
        if (!signal) return existing.output;
        return new Promise(resolve => {
          const onAbort = () => { signal.removeEventListener('abort', onAbort); resolve(null); };
          signal.addEventListener('abort', onAbort, { once: true });
          existing.output.then(value => { signal.removeEventListener('abort', onAbort); resolve(signal.aborted || !authorityCurrent() ? null : value); });
        });
      }
      // One reserved revocation lane can stop persistent callbacks even when
      // every normal lane is occupied by a timed-out physical guest promise.
      const reservedRevocation = control && lane === 'authority-revoke' && lanes.size < maxLanes + 1;
      if (lanes.size >= maxLanes && !reservedRevocation) return Promise.resolve(null);

      let resolveOutput;
      const record = { tag: lane, guestId: state.id, generation: state.generation, origin: identify(webview),
        startedAt: now(), timedOut: false, cancelled: false, returned: false, invalidated: null,
        provider, authorityRequired: authority !== false, authority: token, tokenKey, code, control,
        state, timer: null, output: new Promise(resolve => { resolveOutput = resolve; }) };
      const onAbort = () => { record.cancelled = true; finish(null); };
      function finish(value) {
        if (record.returned) return;
        record.returned = true;
        if (record.timer !== null) clearTimer(record.timer);
        record.timer = null;
        signal?.removeEventListener('abort', onAbort);
        if (record.cancelled || record.invalidated || signal?.aborted || !authorityCurrent()) {
          if (!authorityCurrent()) try { provider?.onRejected?.(); } catch (_) {}
          resolveOutput(null);
        } else {
          try { resolveOutput(provider?.attachResult ? provider.attachResult(value, token) : value); }
          catch (_) { resolveOutput(null); }
        }
      }
      function release() {
        if (lanes.get(lane) === record) {
          lanes.delete(lane);
          active.delete(record);
          notifyIdle();
        }
      }
      record.invalidate = reason => { record.invalidated = reason; finish(null); release(); };
      lanes.set(lane, record);
      active.add(record);
      signal?.addEventListener('abort', onAbort, { once: true });
      const duration = Number.isFinite(Number(timeoutMs)) ? Math.max(1, Math.min(120000, Number(timeoutMs))) : 1350;
      record.timer = setTimer(() => { record.timedOut = true; finish(null); }, duration);
      let raw;
      try {
        if (signal?.aborted) { record.cancelled = true; finish(null); release(); return record.output; }
        if (!authorityCurrent()) { finish(null); release(); return record.output; }
        raw = webview.executeJavaScript(provider ? provider.wrap(code, token) : code);
      } catch (_) { finish(null); release(); return record.output; }
      Promise.resolve(raw).then(
        value => { finish(value); release(); },
        () => { finish(null); release(); }
      );
      return record.output;
    }

    function describe(record) {
      return { guestId: record.guestId, tag: record.tag, generation: record.generation,
        elapsedMs: Math.max(0, now() - record.startedAt), timedOut: record.timedOut,
        cancelled: record.cancelled, callerReleased: record.returned,
        authority: record.authority ? { ...record.authority } : null, control: record.control,
        origin: record.origin, current: identify(record.state.webview) };
    }
    function snapshot(webview) {
      const state = webview && guests.get(webview);
      return state ? Array.from(state.lanes.values(), describe) : [];
    }
    function retire(webview, reason = 'tab-closed') {
      // The caller must have actually removed this webview first. A timeout,
      // hidden tab, navigation start, or failed navigation cannot retire it.
      if (!webview || webview.isConnected !== false) return false;
      const state = guests.get(webview);
      if (state) invalidate(state, String(reason).slice(0, 80), true);
      return true;
    }
    function documentIdentity(webview) {
      if (!webview || typeof webview.executeJavaScript !== 'function') return { generation: -1, available: false, connected: false };
      const state = getGuest(webview);
      return { guestId: state.id, generation: state.generation, available: !state.unavailable,
        connected: typeof webview.isConnected === 'boolean' ? webview.isConnected : null };
    }
    function waitForIdle(webviews = null, { timeoutMs = 2000, signal } = {}) {
      if (signal?.aborted) return Promise.resolve(false);
      const targets = webviews === null ? null : new Set(webviews);
      const isIdle = () => !Array.from(active).some(record => !targets || targets.has(record.state.webview));
      if (isIdle()) return Promise.resolve(true);
      return new Promise(resolve => {
        let timer = null, settled = false;
        function finish(value) {
          if (settled) return; settled = true;
          idleWaiters.delete(check); if (timer !== null) clearTimer(timer);
          signal?.removeEventListener('abort', onAbort); resolve(value);
        }
        const check = () => { if (isIdle()) finish(true); };
        const onAbort = () => finish(false);
        idleWaiters.add(check); signal?.addEventListener('abort', onAbort, { once: true });
        timer = setTimer(() => finish(false), Math.max(1, Math.min(10000, Number(timeoutMs) || 2000)));
        check();
      });
    }
    function configureAuthority(provider) {
      if (provider !== null && (!provider || typeof provider.tokenFor !== 'function' || typeof provider.isCurrent !== 'function' || typeof provider.wrap !== 'function')) {
        throw new TypeError('Authority provider must supply tokenFor, isCurrent and wrap');
      }
      authorityProvider = provider;
    }
    function subscribeLifecycle(listener) {
      if (typeof listener !== 'function') throw new TypeError('Lifecycle listener required');
      lifecycleListeners.add(listener); return () => lifecycleListeners.delete(listener);
    }
    return { run, runControl: (webview, code, options = {}) => run(webview, code, { ...options, authority: false, control: true }),
      configureAuthority, documentIdentity, waitForIdle, subscribeLifecycle,
      snapshot, retire, pendingCount: () => active.size,
      pendingSnapshot: () => Array.from(active, describe),
      lifecycleSnapshot: () => lifecycleEvents.map(event => ({ ...event })) };
  }
  return { ...createExecutor(), createExecutor };
});
