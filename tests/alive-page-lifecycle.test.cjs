'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createExecutor } = require('../systems/alive-guest-execution.js');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function actualFunction(name) {
  const match = new RegExp('    (?:async )?function ' + name + '\\(').exec(source);
  assert.ok(match, 'Actual renderer function exists: ' + name);
  const end = source.indexOf('\n    }', match.index) + 6;
  assert.ok(end > match.index);
  return source.slice(match.index, end);
}

function fixture() {
  const tabs = [], timers = new Map(), created = [], selected = [], retired = [];
  let timerId = 0, selectedId = null, clock = 0;
  const noWork = new Promise(() => {});
  class Webview {
    constructor() { this.listeners = new Map(); this.attributes = new Map(); this.isConnected = false; this.reloads = 0; this.backs = 0; this.forwards = 0; this.srcWrites = []; }
    addEventListener(name, listener) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(listener); }
    removeEventListener(name, listener) { this.listeners.get(name)?.delete(listener); }
    emit(name, event = {}) { for (const listener of Array.from(this.listeners.get(name) || [])) listener(event); }
    setAttribute(name, value) { this.attributes.set(name, value); }
    getAttribute(name) { return this.attributes.get(name); }
    removeAttribute(name) { this.attributes.delete(name); }
    set src(value) {
      this.srcWrites.push({ value, owned: tabs.some(tab => tab.wv === this), handlers: this.listeners.size });
      this.attributes.set('src', value);
    }
    get src() { return this.attributes.get('src'); }
    getURL() { throw new Error('Synchronous getURL must not be used by lifecycle/readiness'); }
    getWebContentsId() { return 42; }
    reload() { this.reloads++; }
    canGoBack() { return true; }
    canGoForward() { return true; }
    goBack() { this.backs++; }
    goForward() { this.forwards++; }
    executeJavaScript() { return Promise.resolve(12); }
    remove() { this.isConnected = false; }
  }
  const context = vm.createContext({ tabs, Set, Array, URL,
    Date: { now: () => ++clock }, Math,
    newTabUrl: 'about:blank', GUEST_PREFS: 'contextIsolation=yes,nodeIntegration=no', activeWorkspace: 'All', activeTabId: null,
    document: { activeElement: null,
      createElement(name) { assert.equal(name, 'webview'); const wv = new Webview(); created.push(wv); return wv; },
      getElementById(id) { return id === 'webviews-stack' ? { appendChild(wv) { assert.ok(tabs.some(tab => tab.wv === wv)); assert.ok(wv.listeners.has('dom-ready')); wv.isConnected = true; } } : null; }
    },
    window: { selectAliveGuest: async id => selected.push(id), invalidateAliveTransportPage() {}, cancelAliveResearchNavigation() {},
      aliveOverdrive: { running: false, request() {} }, AliveGuestExecution: { retire(wv) { retired.push(wv); } } },
    ipcRenderer: { invoke: () => noWork },
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval() { throw new Error('Readiness must never install a polling interval'); },
    hideError() {}, showError() {}, updateBookmarkStar() {}, updateStatusBar() {}, renderTabs() {}, recordVisit() {}, persistSession() {},
    closeTabContextMenu() {}, updateSplitViewClasses() {}, appendLog() {}, goHomeSpeedDial() {}, requestAlivePageUpdate() {},
    formatUrlForBar: value => value,
    switchTab(id) { selectedId = id; context.activeTabId = id; },
    getActiveTab: () => tabs.find(tab => tab.id === selectedId) || null
  });
  for (const name of ['isWebviewGuestAvailable', 'isWebviewGuestReady', 'settleTabDomReadyWaiters', 'ensureTabDomReady',
    'safeGetUrl', 'resolveDeepDarkWebGatewayUrl', 'safeLoadUrl', 'createTab', 'freezeSingleTab', 'closeTab', 'navBack', 'navForward', 'navReload']) {
    vm.runInContext(actualFunction(name), context);
  }
  const add = (url = 'https://fixture.test/first') => context.createTab(url);
  const commit = (tab, url = tab.url) => tab.wv.emit('did-navigate', { url });
  const ready = tab => { commit(tab); tab.wv.emit('dom-ready'); };
  const fireTimers = () => { for (const [id, timer] of Array.from(timers)) { timers.delete(id); timer.fn(); } };
  return { context, tabs, timers, created, selected, retired, add, commit, ready, fireTimers, select(id) { selectedId = id; context.activeTabId = id; } };
}

test('ownership and lifecycle handlers precede initial src/attachment; attachment alone is not DOM readiness', () => {
  const f = fixture(), tab = f.add();
  assert.equal(tab.wv.srcWrites[0].owned, true);
  assert.ok(tab.wv.srcWrites[0].handlers >= 10);
  assert.equal(tab.committedUrl, '');
  assert.equal(f.context.isWebviewGuestAvailable(tab.wv), false);
  tab.wv.emit('did-attach');
  assert.equal(f.context.isWebviewGuestAvailable(tab.wv), true);
  assert.equal(f.context.isWebviewGuestReady(tab.wv), false);
  tab.wv.emit('dom-ready');
  assert.equal(tab.domReady, false, 'uncommitted initial/obsolete DOM event cannot promote readiness');
  f.ready(tab);
  assert.equal(f.context.isWebviewGuestReady(tab.wv), true);
  for (let i = 0; i < 5000; i++) {
    assert.equal(f.context.isWebviewGuestReady(tab.wv), true);
    assert.equal(f.context.safeGetUrl(tab), 'https://fixture.test/first');
  }
});

test('main-frame commit is the URL receipt; requested and failed URLs never become committed URLs', async () => {
  const f = fixture(), tab = f.add(); f.ready(tab);
  const original = tab.committedUrl;
  f.context.safeLoadUrl(tab, 'https://fixture.test/requested');
  assert.equal(tab.committedUrl, original);
  assert.equal(f.context.safeGetUrl(tab), 'https://fixture.test/requested', 'display can reflect requested target');
  assert.equal(f.context.isWebviewGuestReady(tab.wv), false);
  const wait = f.context.ensureTabDomReady(tab, 100);
  tab.wv.emit('did-fail-load', { isMainFrame: true, errorCode: -105, validatedURL: 'https://fixture.test/failed', errorDescription: 'fixture failure' });
  assert.equal(await wait, false);
  assert.equal(tab.url, 'https://fixture.test/failed');
  assert.equal(tab.committedUrl, original);
  f.commit(tab, 'chrome-error://chromewebdata/'); tab.wv.emit('dom-ready');
  assert.equal(f.context.isWebviewGuestReady(tab.wv), false, 'error-page DOM does not turn a failed load into readiness');
  assert.equal(tab.domReadyWaiters.size, 0); assert.equal(f.timers.size, 0);
});

test('subframe start/failure/in-page events do not replace main-frame readiness or URLs', () => {
  const f = fixture(), tab = f.add(); f.ready(tab);
  const original = tab.committedUrl, readyAt = tab.lastDomReadyTs, started = tab.lastNavStartTs;
  tab.wv.emit('did-start-loading');
  assert.equal(tab.isLoading, true); assert.equal(tab.domReady, true);
  tab.wv.emit('did-start-navigation', { isMainFrame: false, url: 'https://frame.test/' });
  tab.wv.emit('did-fail-load', { isMainFrame: false, errorCode: -105, validatedURL: 'https://frame.test/' });
  assert.equal(tab.isLoading, true, 'subframe failure must not clear whole-tab loading');
  tab.wv.emit('did-navigate-in-page', { isMainFrame: false, url: 'https://frame.test/#different' });
  assert.equal(tab.url, original); assert.equal(tab.committedUrl, original);
  tab.wv.emit('did-stop-loading');
  assert.equal(f.context.isWebviewGuestReady(tab.wv), true);
  assert.equal(tab.lastDomReadyTs, readyAt); assert.equal(tab.lastNavStartTs, started);
  tab.wv.emit('did-start-navigation', { isMainFrame: true, isInPlace: true, url: original + '#part' });
  tab.wv.emit('did-navigate-in-page', { isMainFrame: true, url: original + '#part' });
  assert.equal(tab.committedUrl, original + '#part'); assert.equal(tab.domReady, true);
});

test('main-frame navigation invalidates admission; abort/stop cannot admit obsolete DOM and manual controls remain usable', () => {
  const f = fixture(), tab = f.add(); f.ready(tab);
  tab.wv.emit('did-start-navigation', { isMainFrame: true, isInPlace: false, url: 'https://fixture.test/next' });
  assert.equal(f.context.isWebviewGuestReady(tab.wv), false);
  tab.wv.emit('did-fail-load', { isMainFrame: true, errorCode: -3, validatedURL: tab.url });
  assert.equal(tab.isLoading, true, 'an aborted predecessor must not clear successor loading');
  tab.wv.emit('did-stop-loading'); tab.wv.emit('dom-ready');
  assert.equal(f.context.isWebviewGuestReady(tab.wv), false);
  assert.equal(f.context.isWebviewGuestAvailable(tab.wv), true);
  f.context.navBack(); f.context.navForward(); f.context.navReload();
  assert.equal(tab.wv.backs, 1); assert.equal(tab.wv.forwards, 1); assert.equal(tab.wv.reloads, 1);
  f.commit(tab, 'https://fixture.test/next'); tab.wv.emit('dom-ready');
  assert.equal(f.context.isWebviewGuestReady(tab.wv), true);
});

test('same-src ready navigation reloads using readiness captured before invalidation', () => {
  const f = fixture(), tab = f.add(); f.ready(tab);
  const writes = tab.wv.srcWrites.length;
  f.context.safeLoadUrl(tab, tab.url);
  assert.equal(tab.wv.reloads, 1); assert.equal(tab.wv.srcWrites.length, writes);
  assert.equal(tab.domReady, false); assert.equal(tab.mainFrameNavigating, true);
  assert.equal(tab.committedUrl, tab.url);
});

test('a confirmed exact fragment-only request restores the existing ready document without a new DOM event', async () => {
  for (const [from, target] of [
    ['https://fixture.test/first', 'https://fixture.test/first#part'],
    ['https://fixture.test/first#old', 'https://fixture.test/first#new'],
    ['https://fixture.test/first#old', 'https://fixture.test/first']
  ]) {
    const f = fixture(), tab = f.add(from); f.ready(tab); tab.wv.emit('did-stop-loading');
    const readyAt = tab.lastDomReadyTs, originalDocumentStart = tab.lastNavStartTs;
    tab.lastUserNavTs = 1234;
    f.context.safeLoadUrl(tab, target);
    assert.equal(tab.domReady, false); assert.equal(tab.mainFrameNavigating, true);
    assert.notEqual(tab.lastNavStartTs, originalDocumentStart, 'unconfirmed request is pending');
    assert.equal(tab.committedUrl, from);
    const wait = f.context.ensureTabDomReady(tab, 100);
    tab.wv.emit('did-start-navigation', { isMainFrame: true, isInPlace: true, url: target });
    tab.wv.emit('did-navigate-in-page', { isMainFrame: true, url: target });
    assert.equal(await wait, true);
    assert.equal(f.context.isWebviewGuestReady(tab.wv), true);
    assert.equal(tab.isLoading, false); assert.equal(tab.mainFrameNavigating, false);
    assert.equal(tab.committedUrl, target); assert.equal(f.context.safeGetUrl(tab), target);
    assert.equal(tab.lastDomReadyTs, readyAt, 'same-document arrival does not invent a new DOM-ready timestamp');
    assert.equal(tab.lastNavStartTs, originalDocumentStart, 'same document retains its original transport provenance timestamp');
    assert.equal(tab.lastUserNavTs, 1234, 'user navigation timing remains separate');
    assert.equal(tab.sameDocumentNavigationIntent, null);
    assert.equal(tab.domReadyWaiters.size, 0); assert.equal(f.timers.size, 0);
  }
});

test('fragment restoration requires prior readiness and exact base, source, target and main-frame identity', () => {
  for (const variant of ['new-path', 'new-query', 'new-origin', 'same-url', 'unready', 'wrong-target', 'wrong-source', 'subframe', 'different-inplace-start']) {
    const f = fixture(), tab = f.add(); f.ready(tab);
    const from = tab.committedUrl;
    let target = from + '#part';
    if (variant === 'new-path') target = 'https://fixture.test/second#part';
    if (variant === 'new-query') target = from + '?query=changed#part';
    if (variant === 'new-origin') target = 'https://other.test/first#part';
    if (variant === 'same-url') target = from;
    if (variant === 'unready') tab.domReady = false;
    f.context.safeLoadUrl(tab, target);
    if (variant === 'wrong-source') tab.committedUrl = from + '#other';
    if (variant === 'different-inplace-start') tab.wv.emit('did-start-navigation', { isMainFrame: true, isInPlace: true, url: from + '#unrelated' });
    tab.wv.emit('did-navigate-in-page', { isMainFrame: variant !== 'subframe', url: variant === 'wrong-target' ? from + '#unrelated' : target });
    assert.equal(f.context.isWebviewGuestReady(tab.wv), false, variant);
    if (variant !== 'subframe') assert.equal(tab.sameDocumentNavigationIntent, null, variant);
  }
});

test('fragment recovery preserves newer loading events instead of restoring stale spinner state', () => {
  for (const newerEvent of ['did-start-loading', 'did-stop-loading']) {
    const f = fixture(), tab = f.add(); f.ready(tab);
    tab.isLoading = newerEvent === 'did-stop-loading';
    const target = tab.committedUrl + '#part';
    f.context.safeLoadUrl(tab, target);
    tab.wv.emit(newerEvent);
    tab.wv.emit('did-navigate-in-page', { isMainFrame: true, url: target });
    assert.equal(f.context.isWebviewGuestReady(tab.wv), true, newerEvent);
    assert.equal(tab.isLoading, newerEvent === 'did-start-loading', newerEvent);
  }
});

test('superseding navigation, redirect, failure and manual controls discard fragment restoration intent', () => {
  for (const variant of ['new-request', 'full-start', 'full-commit', 'redirect', 'abort', 'failure', 'back', 'forward', 'reload', 'attach', 'crash']) {
    const f = fixture(), tab = f.add(); f.ready(tab);
    const target = tab.committedUrl + '#part', originalDocumentStart = tab.lastNavStartTs;
    f.context.safeLoadUrl(tab, target);
    assert.ok(tab.sameDocumentNavigationIntent, variant);
    if (variant === 'new-request') f.context.safeLoadUrl(tab, target + '-newer');
    if (variant === 'full-start') tab.wv.emit('did-start-navigation', { isMainFrame: true, isInPlace: false, url: target });
    if (variant === 'full-commit') f.commit(tab, target);
    if (variant === 'redirect') tab.wv.emit('did-redirect-navigation', { isMainFrame: true, url: target });
    if (variant === 'abort' || variant === 'failure') tab.wv.emit('did-fail-load', { isMainFrame: true, errorCode: variant === 'abort' ? -3 : -105, validatedURL: target });
    if (variant === 'back') f.context.navBack();
    if (variant === 'forward') f.context.navForward();
    if (variant === 'reload') f.context.navReload();
    if (variant === 'attach') tab.wv.emit('did-attach');
    if (variant === 'crash') tab.wv.emit('render-process-gone', { reason: 'crashed' });
    assert.equal(tab.sameDocumentNavigationIntent, null, variant);
    tab.wv.emit('did-navigate-in-page', { isMainFrame: true, url: target });
    assert.equal(f.context.isWebviewGuestReady(tab.wv), false, variant);
    assert.notEqual(tab.lastNavStartTs, originalDocumentStart, variant + ' cannot restore an older document timestamp');
  }
});

test('freeze, close, and webview replacement cannot reuse a prior fragment restoration intent', async () => {
  for (const variant of ['freeze', 'close', 'replacement']) {
    const f = fixture(), tab = f.add(); f.ready(tab); f.add('https://fixture.test/other');
    const target = tab.committedUrl + '#part', original = tab.wv;
    f.context.safeLoadUrl(tab, target);
    const wait = f.context.ensureTabDomReady(tab, 100);
    if (variant === 'freeze') assert.equal(await f.context.freezeSingleTab(tab.id), true);
    if (variant === 'close') f.context.closeTab(tab.id);
    if (variant === 'replacement') tab.wv = { isConnected: true };
    original.emit('did-navigate-in-page', { isMainFrame: true, url: target });
    assert.equal(f.context.isWebviewGuestReady(original), false, variant);
    if (variant !== 'replacement') assert.equal(tab.sameDocumentNavigationIntent, null, variant);
    f.fireTimers(); assert.equal(await wait, false, variant);
  }
});

test('confirmed fragment-only recovery preserves the physical execution and document generation', async () => {
  const f = fixture(), tab = f.add(); f.ready(tab);
  const executor = createExecutor();
  let finish;
  tab.wv.getURL = () => tab.committedUrl;
  tab.wv.executeJavaScript = () => new Promise(resolve => { finish = resolve; });
  const result = executor.run(tab.wv, 'pending', { timeoutMs: 10000 });
  const generation = executor.documentIdentity(tab.wv).generation, target = tab.committedUrl + '#part';
  f.context.safeLoadUrl(tab, target);
  tab.wv.emit('did-start-navigation', { isMainFrame: true, isInPlace: true, url: target });
  tab.wv.emit('did-navigate-in-page', { isMainFrame: true, url: target });
  assert.equal(f.context.isWebviewGuestReady(tab.wv), true);
  assert.equal(executor.documentIdentity(tab.wv).generation, generation);
  assert.equal(executor.pendingCount(), 1);
  finish('same-document result'); assert.equal(await result, 'same-document result');
  assert.equal(executor.pendingCount(), 0);
});

test('DOM readiness waits settle from lifecycle only and remove deadline/callback state', async () => {
  const f = fixture(), tab = f.add();
  const first = f.context.ensureTabDomReady(tab, 100), second = f.context.ensureTabDomReady(tab, 200);
  assert.equal(tab.domReadyWaiters.size, 2); assert.equal(f.timers.size, 2);
  f.ready(tab);
  assert.equal(await first, true); assert.equal(await second, true);
  assert.equal(tab.domReadyWaiters.size, 0); assert.equal(f.timers.size, 0);
  f.context.safeLoadUrl(tab, 'https://fixture.test/timeout');
  const timeout = f.context.ensureTabDomReady(tab, 10);
  f.fireTimers();
  assert.equal(await timeout, false); assert.equal(tab.domReadyWaiters.size, 0); assert.equal(f.timers.size, 0);
  assert.equal(tab.domReady, false);
});

test('freeze placeholder never acquires readiness; wake waits for the restored document commit and DOM', async () => {
  const f = fixture(), tab = f.add(); f.ready(tab); f.add('https://fixture.test/active');
  assert.equal(await f.context.freezeSingleTab(tab.id), true);
  f.commit(tab, 'about:blank'); tab.wv.emit('dom-ready');
  assert.equal(tab.url, 'https://fixture.test/first'); assert.equal(tab.committedUrl, 'about:blank');
  assert.equal(tab.domReady, false); assert.equal(f.context.isWebviewGuestAvailable(tab.wv), false);
  const wake = f.context.ensureTabDomReady(tab, 100);
  assert.equal(tab.frozen, false); assert.equal(tab.mainFrameNavigating, true);
  tab.wv.emit('dom-ready');
  assert.equal(tab.domReady, false, 'late placeholder DOM does not promote restored document');
  f.ready(tab);
  assert.equal(await wake, true); assert.equal(tab.committedUrl, 'https://fixture.test/first');
});

test('crash cancels waits and explicit Reload recovers only after real commit+DOM without did-attach', async () => {
  const f = fixture(), tab = f.add(); f.ready(tab);
  f.context.safeLoadUrl(tab, 'https://fixture.test/recover');
  const wait = f.context.ensureTabDomReady(tab, 100);
  tab.wv.emit('render-process-gone', { reason: 'crashed' });
  assert.equal(await wait, false); assert.equal(f.timers.size, 0);
  tab.wv.emit('dom-ready');
  assert.equal(f.context.isWebviewGuestReady(tab.wv), false);
  const writes = tab.wv.srcWrites.length;
  f.context.navReload();
  assert.equal(tab.wv.srcWrites.length, writes + 1);
  assert.equal(f.context.isWebviewGuestReady(tab.wv), false);
  f.commit(tab); tab.wv.emit('dom-ready');
  assert.equal(f.context.isWebviewGuestReady(tab.wv), true);
  assert.equal(tab.guestUnavailable, false);
});

test('destroy/close/detachment/ownership replacement deny stale readiness and clean waiting callers', async () => {
  for (const terminal of ['destroyed', 'close']) {
    const f = fixture(), tab = f.add(); f.add('https://fixture.test/other');
    const wait = f.context.ensureTabDomReady(tab, 100);
    if (terminal === 'close') f.context.closeTab(tab.id); else tab.wv.emit('destroyed');
    assert.equal(await wait, false); assert.equal(f.timers.size, 0);
    tab.wv.emit('dom-ready'); assert.equal(f.context.isWebviewGuestReady(tab.wv), false);
    if (terminal === 'close') assert.deepEqual(f.retired, [tab.wv]);
  }
  const f = fixture(), tab = f.add(); f.ready(tab);
  tab.wv.isConnected = false;
  assert.equal(f.context.isWebviewGuestReady(tab.wv), false);
  tab.wv.isConnected = true;
  const old = tab.wv; tab.domReady = false;
  const wait = f.context.ensureTabDomReady(tab, 10);
  tab.wv = { isConnected: true }; old.emit('dom-ready');
  assert.equal(tab.domReady, false);
  f.fireTimers(); assert.equal(await wait, false); assert.equal(tab.domReadyWaiters.size, 0);
  assert.equal(f.context.isWebviewGuestReady(old), false);
});

test('cached denial on start/failure/freeze never retires raw guest executions; only actual replacement does', async () => {
  const f = fixture(), tab = f.add(); f.ready(tab);
  const executor = createExecutor();
  let finish;
  tab.wv.getURL = () => tab.committedUrl; // executor diagnostics are separately request-driven
  tab.wv.executeJavaScript = () => new Promise(resolve => { finish = resolve; });
  const result = executor.run(tab.wv, 'pending', { timeoutMs: 10000 });
  const generation = executor.documentIdentity(tab.wv).generation;
  tab.wv.emit('did-start-navigation', { isMainFrame: true, isInPlace: false, url: 'https://fixture.test/next' });
  tab.wv.emit('did-fail-load', { isMainFrame: true, errorCode: -3 });
  tab.frozen = true; tab.domReady = false;
  assert.equal(executor.pendingCount(), 1); assert.equal(executor.documentIdentity(tab.wv).generation, generation);
  f.commit(tab, 'about:blank');
  assert.equal(await result, null); assert.equal(executor.pendingCount(), 0);
  assert.equal(executor.documentIdentity(tab.wv).generation, generation + 1);
  finish('obsolete');
});

test('late post-navigation callback only requests work for centrally confirmed readiness', () => {
  const start = source.indexOf('        const onPostNavReady = () => {');
  const end = source.indexOf('\n        };', start) + 11;
  assert.ok(start > 0 && end > start);
  const f = fixture(), tab = f.add();
  f.context.tabObj = tab;
  vm.runInContext(source.slice(start, end) + '\nglobalThis.postNavReady = onPostNavReady;', f.context);
  f.context.postNavReady();
  assert.equal(tab.domReady, false);
  f.ready(tab); tab.frozen = true; tab.domReady = false;
  f.context.postNavReady(); assert.equal(tab.domReady, false);
});
