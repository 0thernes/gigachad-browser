'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const start = source.indexOf('    async function boot() {');
const end = source.indexOf('    window.__aliveStartupRegister(boot);', start);
assert.ok(start >= 0 && end > start, 'Execute the actual registered production boot function');
const bootSource = source.slice(start, end);
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const tick = () => new Promise(resolve => setImmediate(resolve));

function fixture({ controller = true, closing = false } = {}) {
  const calls = [], writes = [], timers = [], elements = new Map();
  const pending = { config: deferred(), session: deferred(), models: deferred(), health: deferred() };
  const tabs = [], window = { __alivePersistenceClosing: closing, alienAutoNavigateLinks: false };
  if (controller) { window.aliveOverdrive = { generation: 0 }; window.startAliveOverdrive = () => calls.push('overdrive-start'); }
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const item = {}, style = {};
    for (const key of ['checked', 'value', 'placeholder', 'textContent']) {
      let value = '';
      Object.defineProperty(item, key, { get() { return value; }, set(next) { value = next; writes.push({ id, key, value: next }); } });
    }
    let display = '';
    Object.defineProperty(style, 'display', { get() { return display; }, set(next) { display = next; writes.push({ id, key: 'style.display', value: next }); } });
    item.style = style; elements.set(id, item); return item;
  }
  const context = vm.createContext({ window, tabs, activeTabId: 'primary', splitViewActive: false, newTabUrl: 'https://initial.example/',
    alienBrainCycleRunning: false, alienBrainActive: false, superintelligenceOverdrive: false, abortAutopilot: true,
    ALIEN_RABBIT_HOLES: [], document: { getElementById: element },
    localStorage: { getItem() { calls.push('theme-read'); return null; } },
    ipcRenderer: { invoke(channel) {
      calls.push('ipc:' + channel);
      if (channel === 'config-get') return pending.config.promise;
      if (channel === 'session-load') return pending.session.promise;
      if (channel === 'sidecar-health') return pending.health.promise;
      throw new Error('Unexpected boot IPC: ' + channel);
    } },
    createTab(url, saved) { calls.push('tab:' + url); tabs.push({ url, saved }); },
    switchTab(id) { calls.push('switch:' + id); }, toggleSplitView() { calls.push('split'); context.splitViewActive = true; },
    applyTheme() { calls.push('theme-apply'); }, fillModelSelect() { calls.push('model-select'); },
    updateOpenRouterKeyBadge() { calls.push('key-badge'); }, renderBookmarksBar() { calls.push('bookmarks'); },
    updateStatusBar() { calls.push('status-bar'); }, filterWishlistCatalog() { calls.push('wishlist'); },
    updateHybridTelemetryBar() { calls.push('telemetry'); }, startBrowserHabitatLifeLoop() { calls.push('life-loop'); },
    appendLeftOmniEventLog() { calls.push('event-log'); }, requestAlivePageUpdate() { calls.push('page-request'); },
    performWeirdAlienDomExperiment() { calls.push('dom-fallback'); return Promise.resolve(); },
    startAutonomyWatchdogAndSelfHealer() { calls.push('watchdog'); }, updateAlienBrainKpis() { calls.push('brain-kpis'); },
    runOneAlienBrainCycle() { calls.push('brain-fallback'); return Promise.resolve(); },
    refreshLocalModels() { calls.push('models-request'); return pending.models.promise; },
    setTimeout(fn, delay) { timers.push({ fn, delay }); return timers.length; }, console });
  const boot = vm.runInContext(bootSource + '\nboot', context);
  const config = () => pending.config.resolve({ smokeMode: false, newTabUrl: 'https://configured.example/' });
  const session = value => pending.session.resolve(value || { tabs: [] });
  const models = () => pending.models.resolve(['fixture-model']);
  const health = () => pending.health.resolve({ ok: true, data: { backends: { embeddings: { implementation: 'fixture' } } } });
  const close = () => { window.__alivePersistenceClosing = true; };
  const fire = delay => { const timer = timers.find(item => item.delay === delay); assert.ok(timer, 'Expected startup timer ' + delay); timer.fn(); };
  async function toSession() { const run = boot(); config(); await tick(); assert.ok(calls.includes('ipc:session-load')); return { run }; }
  async function toHealth() { const { run } = await toSession(); session(); await tick(); assert.ok(calls.includes('ipc:sidecar-health')); assert.ok(calls.includes('models-request')); return { run }; }
  async function finish() { const { run } = await toHealth(); models(); health(); await run; return run; }
  return { calls, writes, timers, tabs, window, context, pending, boot, config, session, models, health, close, fire, toSession, toHealth, finish };
}

test('boot entered after close performs no IPC, theme access, UI write, tab creation or startup work', async () => {
  const f = fixture({ closing: true }); await f.boot();
  assert.deepEqual(f.calls, []); assert.deepEqual(f.writes, []); assert.deepEqual(f.tabs, []); assert.deepEqual(f.timers, []);
});

test('late config completion after close cannot apply config, request a session or start the habitat', async () => {
  const f = fixture(), run = f.boot(); assert.ok(f.calls.includes('ipc:config-get'));
  const before = f.calls.slice(); f.close(); f.config(); await run;
  assert.deepEqual(f.calls, before); assert.deepEqual(f.writes, []); assert.equal(f.tabs.length, 0); assert.equal(f.timers.length, 0);
});

test('config rejection after close cannot execute catch fallback or write an error into closing UI', async () => {
  const f = fixture(), run = f.boot(); f.close(); const before = f.calls.slice(); f.pending.config.reject(new Error('late config failure')); await run;
  assert.deepEqual(f.calls, before); assert.deepEqual(f.writes, []); assert.equal(f.tabs.length, 0);
});

test('session completion after close cannot restore tabs, create a fallback tab or schedule startup timers', async () => {
  const f = fixture(), { run } = await f.toSession(), before = f.calls.slice(), writes = f.writes.slice();
  f.close(); f.session({ tabs: [{ url: 'https://must-not-open.example/' }] }); await run;
  assert.deepEqual(f.calls, before); assert.deepEqual(f.writes, writes); assert.equal(f.tabs.length, 0); assert.equal(f.timers.length, 0);
});

test('swallowed session rejection after close still prevents default-tab and habitat startup', async () => {
  const f = fixture(), { run } = await f.toSession(), before = f.calls.slice(), writes = f.writes.slice();
  f.close(); f.pending.session.reject(new Error('late session failure')); await run;
  assert.deepEqual(f.calls, before); assert.deepEqual(f.writes, writes); assert.equal(f.tabs.length, 0); assert.equal(f.timers.length, 0);
});

for (const last of ['models', 'health']) {
  test('closing while Promise.all awaits ' + last + ' prevents late status writes and queued autonomy', async () => {
    const f = fixture(), { run } = await f.toHealth();
    if (last === 'models') f.health(); else f.models();
    await tick(); const before = f.calls.slice(), writes = f.writes.slice(), tabs = f.tabs.slice();
    f.close(); if (last === 'models') f.models(); else f.health(); await run;
    f.fire(600); f.fire(650); await tick();
    assert.deepEqual(f.calls, before); assert.deepEqual(f.writes, writes); assert.deepEqual(f.tabs, tabs);
    assert.equal(f.context.alienBrainActive, false); assert.equal(f.context.superintelligenceOverdrive, false); assert.equal(f.context.abortAutopilot, true);
  });
}

test('Promise.all rejection after close cannot run catch recovery or change backend status', async () => {
  const f = fixture(), { run } = await f.toHealth(), before = f.calls.slice(), writes = f.writes.slice();
  f.close(); f.pending.models.reject(new Error('late model failure')); f.health(); await run;
  assert.deepEqual(f.calls, before); assert.deepEqual(f.writes, writes); f.fire(600); f.fire(650); assert.deepEqual(f.calls, before);
});

for (const controller of [true, false]) {
  test('close after successful boot fences both startup timers with ' + (controller ? 'controller' : 'legacy fallback'), async () => {
    const f = fixture({ controller }); await f.finish();
    assert.ok(f.calls.includes('life-loop')); assert.equal(f.timers.length, 2);
    const before = f.calls.slice(), writes = f.writes.slice(); f.close(); f.fire(600); f.fire(650); await tick();
    assert.deepEqual(f.calls, before); assert.deepEqual(f.writes, writes);
    assert.equal(f.context.alienBrainActive, false); assert.equal(f.context.superintelligenceOverdrive, false); assert.equal(f.context.abortAutopilot, true);
  });
}

test('an allowed page update before close does not authorize the later autonomy timer', async () => {
  const f = fixture(); await f.finish(); f.fire(600); assert.equal(f.calls.filter(call => call === 'page-request').length, 1);
  const before = f.calls.slice(); f.close(); f.fire(650); assert.deepEqual(f.calls, before); assert.equal(f.context.alienBrainActive, false);
});

test('live startup retains normal configured tabs, status, page update and autonomy behavior', async () => {
  const f = fixture(); await f.finish();
  assert.equal(f.tabs.length, 1); assert.equal(f.tabs[0].url, 'https://configured.example/'); assert.equal(f.calls.filter(call => call === 'life-loop').length, 1);
  assert.ok(f.writes.some(write => write.id === 'backend-status' && /Sidecar ready/.test(write.value)));
  assert.ok(f.writes.some(write => write.id === 'discovered-tools'));
  f.fire(600); f.fire(650);
  assert.ok(f.calls.includes('page-request')); assert.ok(f.calls.includes('watchdog')); assert.ok(f.calls.includes('overdrive-start'));
  assert.equal(f.context.alienBrainActive, true); assert.equal(f.context.superintelligenceOverdrive, true); assert.equal(f.context.abortAutopilot, false);
});

test('a live config failure still reports its error and opens the ordinary fallback tab', async () => {
  const f = fixture(), run = f.boot(); f.pending.config.reject(new Error('fixture config error')); await run;
  assert.equal(f.tabs.length, 1); assert.equal(f.tabs[0].url, 'https://initial.example/');
  assert.ok(f.writes.some(write => write.id === 'backend-status' && /fixture config error/.test(write.value)));
  assert.ok(!f.calls.includes('life-loop')); assert.equal(f.timers.length, 0);
});
