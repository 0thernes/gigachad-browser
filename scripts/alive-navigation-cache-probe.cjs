'use strict';

// Verification only. Serialize this function into an already running isolated
// host after its existing Pause checks. This module never launches or attaches.
async function verifyNavigationCache(options = {}) {
  const began = performance.now();
  const result = {
    requested: true,
    scope: 'Actual owned offline guest: safeLoadUrl, native navigation events, event-cached readiness and production document identity. No model or authority execution claim.',
    startedAt: began, cases: [], events: [], cleanup: {},
    apiContract: ['createTab', 'safeLoadUrl', 'ensureTabDomReady', 'isWebviewGuestReady',
      'switchTab', 'closeTab', 'getActiveTab', 'AliveGuestExecution.documentIdentity']
  };
  const timeoutMs = Math.max(250, Math.min(10000, Number(options.timeoutMs) || 6500));
  const deadline = began + timeoutMs * 3 + 2000;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const controller = window.aliveOverdrive, authority = window.aliveAuthority;
  const executor = window.AliveGuestExecution;
  let owned = null, original = null, phase = 'preflight', listeners = [];
  const failures = [];
  const fail = reason => { failures.push(reason); throw new Error(reason); };
  const paused = () => {
    const a = authority?.snapshot?.(), c = controller?.snapshot?.();
    return { authorityPaused: a?.paused === true, coordinatorRunning: c?.running,
      coordinatorGeneration: c?.generation, transitioning: a?.transitioning,
      manuals: a?.manuals, leases: a?.leases?.length,
      autoHop: window.alienAutoNavigateLinks === true,
      alienBrainActive: typeof alienBrainActive === 'undefined' ? null : Boolean(alienBrainActive),
      pendingGuestExecutions: executor?.pendingCount?.() ?? null };
  };
  const isPaused = state => state.authorityPaused && state.coordinatorRunning === false &&
    state.transitioning === false && state.manuals === 0 && state.leases === 0 &&
    state.autoHop === false && state.alienBrainActive !== true && state.pendingGuestExecutions === 0;
  const state = tab => {
    let nativeUrl = null, nativeUrlError = null, identity = null;
    try { nativeUrl = tab.wv.getURL(); } catch (error) { nativeUrlError = String(error.message || error); }
    try { identity = executor.documentIdentity(tab.wv); } catch (error) { identity = { error: String(error.message || error) }; }
    return { tabId: tab.id, nativeUrl, nativeUrlError, identity,
      src: tab.wv.getAttribute('src'), requestedUrl: tab.url, committedUrl: tab.committedUrl,
      domReady: tab.domReady, cachedReady: isWebviewGuestReady(tab.wv),
      mainFrameNavigating: tab.mainFrameNavigating, isLoading: tab.isLoading,
      sameDocumentIntentPending: Boolean(tab.sameDocumentNavigationIntent),
      guestAttached: tab.guestAttached, guestUnavailable: tab.guestUnavailable,
      terminalLoadFailure: tab.terminalLoadFailure, frozen: Boolean(tab.frozen),
      waiterCount: tab.domReadyWaiters?.size || 0,
      connected: tab.wv.isConnected };
  };
  const validIdentity = s => Number.isInteger(s?.identity?.guestId) && s.identity.guestId > 0 &&
    Number.isInteger(s.identity.generation) && s.identity.generation >= 0 &&
    s.identity.available === true && s.identity.connected === true && s.connected === true;
  const ready = (s, url) => validIdentity(s) && s.nativeUrl === url && s.committedUrl === url &&
    s.cachedReady === true && s.domReady === true && s.mainFrameNavigating === false &&
    s.isLoading === false && s.guestUnavailable === false && s.terminalLoadFailure === false &&
    s.sameDocumentIntentPending === false &&
    s.frozen === false && s.waiterCount === 0;
  async function waitUntil(predicate, label, budget = timeoutMs) {
    const until = Math.min(deadline, performance.now() + budget);
    do { if (predicate()) return true; await sleep(20); } while (performance.now() < until);
    fail('Timed out: ' + label);
  }
  function record(id, passed, evidence) {
    result.cases.push({ id, passed: Boolean(passed), evidence });
    if (!passed) fail('Navigation cache assertion failed: ' + id);
  }
  function listen(tab) {
    for (const type of ['did-attach', 'did-start-loading', 'did-stop-loading', 'did-start-navigation',
      'did-navigate', 'did-navigate-in-page', 'dom-ready', 'did-fail-load', 'render-process-gone', 'destroyed']) {
      const handler = event => {
        if (result.events.length >= 96) { result.eventsDropped = (result.eventsDropped || 0) + 1; return; }
        result.events.push({ at: performance.now() - began, phase, type,
          url: typeof event.url === 'string' ? event.url : null,
          isMainFrame: typeof event.isMainFrame === 'boolean' ? event.isMainFrame : null,
          isInPlace: typeof event.isInPlace === 'boolean' ? event.isInPlace : null,
          errorCode: Number.isFinite(event.errorCode) ? event.errorCode : null,
          errorDescription: typeof event.errorDescription === 'string' ? event.errorDescription.slice(0, 200) : null });
      };
      tab.wv.addEventListener(type, handler); listeners.push([tab.wv, type, handler]);
    }
  }
  try {
    const supplied = new URL(String(options.fixtureUrl || ''));
    const allowed = Array.isArray(options.ownedFixtureUrls) ? options.ownedFixtureUrls.map(value => new URL(value).href) : [];
    if (!['http:', 'https:'].includes(supplied.protocol) ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(supplied.hostname) ||
      supplied.username || supplied.password || supplied.hash || !allowed.includes(supplied.href)) {
      fail('Requires an exact allowlisted owned loopback HTTP(S) fixture URL without a fragment');
    }
    const fixtureUrl = supplied.href;
    if (!controller || !authority || typeof executor?.documentIdentity !== 'function' ||
      typeof executor.pendingCount !== 'function' || typeof createTab !== 'function' ||
      typeof safeLoadUrl !== 'function' || typeof ensureTabDomReady !== 'function' ||
      typeof isWebviewGuestReady !== 'function' || typeof switchTab !== 'function' ||
      typeof closeTab !== 'function' || typeof getActiveTab !== 'function' || !Array.isArray(tabs)) {
      fail('Required actual host APIs are unavailable');
    }
    original = getActiveTab();
    result.before = { selectedTabId: original?.id, tabIds: tabs.map(tab => tab.id), paused: paused() };
    if (!original || !tabs.includes(original) || original.frozen || !original.wv?.isConnected) {
      fail('Original selected tab must remain connected and unfrozen for navigation-free restoration');
    }
    if (tabs.length >= 4) fail('Owned navigation fixture would exceed the four-tab cap');
    if (!isPaused(result.before.paused)) fail('Navigation cache verification requires fully paused host, no raw executions and Auto-Hop off');
    phase = 'initial';
    owned = createTab(fixtureUrl, { title: 'Navigation cache verification fixture' });
    if (!owned || owned === original || result.before.tabIds.includes(owned.id)) fail('createTab did not return a new owned tab');
    listen(owned);
    // Establish the production generation listener before later native commits.
    result.initialIdentity = executor.documentIdentity(owned.wv);
    if (!await ensureTabDomReady(owned, timeoutMs)) fail('Initial owned fixture did not become ready');
    await waitUntil(() => ready(state(owned), fixtureUrl), 'initial native fixture readiness');
    await sleep(100);
    const initial = state(owned);
    record('initial-ready', ready(initial, fixtureUrl), initial);

    phase = 'fragment';
    const fragmentUrl = fixtureUrl + '#alive-navigation-cache-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    const fragmentBegin = result.events.length;
    safeLoadUrl(owned, fragmentUrl);
    result.fragmentDispatch = state(owned);
    const fragmentEnsure = await ensureTabDomReady(owned, timeoutMs);
    await waitUntil(() => result.events.slice(fragmentBegin).some(event =>
      event.type === 'did-navigate-in-page' && event.isMainFrame === true && event.url === fragmentUrl),
    'native main-frame fragment commit');
    await waitUntil(() => !owned.isLoading, 'fragment load settled');
    await sleep(100);
    const fragment = state(owned), fragmentEvents = result.events.slice(fragmentBegin);
    record('same-document-fragment', fragmentEnsure === true && ready(fragment, fragmentUrl) &&
      fragment.identity.guestId === initial.identity.guestId && fragment.identity.generation === initial.identity.generation &&
      !fragmentEvents.some(event => ['did-navigate', 'dom-ready', 'render-process-gone', 'destroyed'].includes(event.type)) &&
      !fragmentEvents.some(event => event.type === 'did-fail-load' && event.isMainFrame === true),
    { requestedUrl: fragmentUrl, ensureReady: fragmentEnsure, before: initial, after: fragment, events: fragmentEvents });

    phase = 'reload';
    const reloadBegin = result.events.length;
    safeLoadUrl(owned, fragmentUrl);
    result.reloadDispatch = state(owned);
    const reloadEnsure = await ensureTabDomReady(owned, timeoutMs);
    await waitUntil(() => {
      const current = state(owned);
      return ready(current, fragmentUrl) && current.identity.generation > fragment.identity.generation;
    }, 'same-URL document replacement and readiness');
    await sleep(100);
    const reloaded = state(owned), reloadEvents = result.events.slice(reloadBegin);
    record('same-url-reload', reloadEnsure === true && ready(reloaded, fragmentUrl) &&
      reloaded.identity.guestId === fragment.identity.guestId && reloaded.identity.generation > fragment.identity.generation &&
      reloadEvents.some(event => event.type === 'did-navigate' && event.url === fragmentUrl) &&
      reloadEvents.some(event => event.type === 'dom-ready') &&
      !reloadEvents.some(event => event.type === 'did-fail-load' && event.isMainFrame === true),
    { requestedUrl: fragmentUrl, ensureReady: reloadEnsure, before: fragment, after: reloaded, events: reloadEvents });
    result.completed = true;
  } catch (error) {
    result.error = String(error?.stack || error).slice(0, 2400);
  } finally {
    phase = 'cleanup';
    try {
      // Restore first so closeTab cannot select and wake an unrelated fallback.
      if (original) {
        if (!tabs.includes(original) || !original.wv?.isConnected || original.frozen) throw new Error('Original tab became unavailable; refusing recovery navigation');
        if (getActiveTab()?.id !== original.id) switchTab(original.id);
        result.cleanup.originalTabRestored = getActiveTab()?.id === original.id;
      }
      if (owned && !result.before?.tabIds.includes(owned.id) && typeof tabs !== 'undefined' && tabs.includes(owned)) {
        if (tabs.length <= 1) throw new Error('Refusing last-tab close, which would navigate instead of removing the owned tab');
        closeTab(owned.id);
        result.cleanup.ownedTabClosed = !tabs.includes(owned) && owned.wv.isConnected === false;
      } else result.cleanup.ownedTabClosed = owned === null;
      if (result.before) {
        await waitUntil(() => !authority.snapshot().transitioning && executor.pendingCount() === 0, 'cleanup authority settled', 1500);
        result.after = { selectedTabId: getActiveTab()?.id, tabIds: tabs.map(tab => tab.id), paused: paused() };
        result.cleanup.pausedPreserved = isPaused(result.after.paused) &&
          result.after.paused.coordinatorGeneration === result.before.paused.coordinatorGeneration;
        result.cleanup.originalTabsPreserved = result.before.tabIds.length === result.after.tabIds.length &&
          result.before.tabIds.every((id, index) => id === result.after.tabIds[index]);
      }
    } catch (error) { result.cleanup.error = String(error.message || error).slice(0, 1200); }
    for (const [target, type, handler] of listeners) target.removeEventListener(type, handler);
    result.durationMs = performance.now() - began;
    result.failures = failures;
    result.ok = result.completed === true && !result.error && !result.cleanup.error &&
      result.cases.length === 3 && result.cases.every(item => item.passed) && !result.eventsDropped &&
      result.cleanup.ownedTabClosed === true && result.cleanup.originalTabRestored === true &&
      result.cleanup.pausedPreserved === true && result.cleanup.originalTabsPreserved === true;
  }
  return result;
}

function navigationCacheExpression(options) {
  return '(' + verifyNavigationCache.toString() + ')(' + JSON.stringify(options) + ')';
}

module.exports = { verifyNavigationCache, navigationCacheExpression };
