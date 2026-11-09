"use strict";
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { Controller } = require('../systems/alive-overdrive-runtime.js');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function action(name, context) {
  let start = source.indexOf('    async function ' + name + '(');
  if (start === -1) start = source.indexOf('    function ' + name + '(');
  assert.notEqual(start, -1, 'action exists');
  const end = source.indexOf('\n    }\n', start) + 7;
  assert.ok(end > start, 'action closes');
  return vm.runInNewContext('(' + source.slice(start, end).trim() + ')', context);
}
for (const [name, id] of [
  ['triggerPrimarkDecursiveSelfDeduplicationBurst', 'decursive'],
  ['triggerEldritchZalgoBrowserFuckery', 'zalgo'],
  ['triggerDeity100ApotheosisPulse', 'deity'],
  ['triggerDeepDarkWebExpedition', 'deep-dark-dive'],
  ['triggerNeoMatrixOmnipotenceOverdrive', 'neo'],
  ['spawnAlienRabbitHoleTab', 'portal-jump'],
  ['triggerEmergentConceptDive', 'portal-jump'],
  ['checkpointOrRollbackHumunculus', 'checkpoint']
]) test(name + ' queues one manual action without starting autonomy or mutating directly', async () => {
  const requests = [];
  const context = { window: { aliveOverdrive: { request(id) { requests.push(id); return true; } },
    startAliveOverdrive() { throw new Error('Must not resume autonomous mode for one action'); } } };
  assert.equal(await action(name, context)(true), true);
  assert.deepEqual(requests, [id]);
});

function legacyCheckpointFixture(invoke) {
  const messages = [], requests = [], reasons = [];
  const snapshot = { checkpointCid: 'legacy-snapshot', agentId: 'creature', authorityEpoch: 3, simulationTick: 42,
    bodyCid: 'body', policyCid: 'policy', qrngHex: 'entropy-sample' };
  const context = { window: {}, alienBrainEngramsCount: 0,
    humunculusRuntime: { agentId: 'creature', checkpoints: [],
      saveCheckpoint(reason) { reasons.push(reason); this.checkpoints.push(snapshot); return snapshot; },
      formatRetroTerminalText: () => 'Current numeric snapshot summary' },
    updateAlienBrainKpis() {}, appendAlienMonologue: (...lines) => messages.push(...lines),
    document: { getElementById: () => ({ value: 'http://127.0.0.1:8080' }) },
    ipcRenderer: { invoke: async (channel, payload) => { requests.push({ channel, payload }); return invoke(); } } };
  return { context, messages, requests, reasons, run: action('checkpointOrRollbackHumunculus', context) };
}

test('legacy checkpoint reports a memory acknowledgement without claiming verified tensor persistence', async () => {
  const f = legacyCheckpointFixture(async () => ({ ok: true, count: 7 }));
  const result = await f.run();
  assert.equal(result.status, 'observed');
  assert.equal(result.evidence.snapshotCreated, true);
  assert.equal(result.evidence.memoryAcknowledged, true);
  assert.equal(result.evidence.persistenceVerified, false);
  assert.deepEqual(f.reasons, ['legacy-manual']);
  assert.equal(f.requests[0].channel, 'memory-save');
  assert.equal(f.requests[0].payload.content, 'Current numeric snapshot summary');
  assert.match(f.messages.join('\n'), /acknowledged the summary; durable storage readback was not performed/);
  assert.doesNotMatch(f.messages.join('\n'), /ZERO-LLM|0 tokens|100% deterministic|Checkpoint verified|immutable checkpoint/);
});

for (const [label, invoke, reason] of [
  ['negative response', async () => ({ ok: false, error: 'unauthorized' }), /unauthorized/],
  ['missing acknowledgement', async () => undefined, /did not acknowledge/],
  ['rejected IPC', async () => { throw new Error('memory service unavailable'); }, /unavailable/]
]) test(`legacy checkpoint preserves its local snapshot and exposes ${label}`, async () => {
  const f = legacyCheckpointFixture(invoke);
  const result = await f.run();
  assert.equal(result.status, 'error'); assert.match(result.reason, reason);
  assert.equal(result.evidence.snapshotCreated, true);
  assert.equal(result.evidence.memoryAcknowledged, false);
  assert.equal(result.evidence.persistenceVerified, false);
  assert.equal(f.context.humunculusRuntime.checkpoints.length, 1);
  assert.match(f.messages.join('\n'), /MEMORY SUMMARY FAILED/);
  assert.doesNotMatch(f.messages.join('\n'), /ZERO-LLM|0 tokens|100% deterministic|Checkpoint verified|immutable checkpoint/);
});

test('DSD slash command aliases use the coordinator while autonomy is paused', async () => {
  for (const command of ['/dsd', '/decursive', '/quantum', '/metacognition']) {
    const requests = [], input = { value: command };
    const context = { window: { aliveOverdrive: { request(id) { requests.push(id); return true; } } },
      document: { getElementById() { return input; } } };
    assert.equal(await action('startTask', context)(), true);
    assert.deepEqual(requests, ['decursive']);
    assert.equal(input.value, '');
  }
});


test('SoM passes generated grounding code and cancellation to the guest helper and consumes its actual result', async () => {
  const calls = [], abort = new AbortController();
  const markMap = { 1: { x: 20, y: 30, tag: 'button', text: 'Open' } };
  let captures = 0;
  const webview = { capturePage: async () => { captures++; return { toDataURL: () => 'data:image/png;base64,fixture' }; } };
  const context = { window: { AliveGuestExecution: { run: async (guest, code, options) => {
    calls.push({ guest, code, options });
    return options.tag === 'som' ? { markMap, contextText: 'grounded fixture' } : null;
  } } }, tabs: [{ id: 't1', title: 'Fixture' }], activeTabId: 't1', safeGetUrl: () => 'https://fixture.test/', lastMarkMap: {} };
  const result = await action('buildSoMContext', context)(webview, false, true, { signal: abort.signal });
  assert.equal(calls[0].guest, webview);
  assert.equal(calls[0].options.tag, 'som');
  assert.equal(calls[0].options.signal, abort.signal);
  assert.equal(calls[0].options.authority, false, 'explicit browser grounding remains usable while creature autonomy is paused');
  assert.match(calls[0].code, /__gigachad_som/);
  assert.match(calls[0].code, /markMap\[id\] = \{ x: cx, y: cy/);
  assert.equal(context.lastMarkMap, markMap);
  assert.match(result.contextText, /grounded fixture$/);
  assert.equal(result.screenshotBase64, 'data:image/png;base64,fixture');
  assert.equal(captures, 1);
  assert.equal(calls[1].options.tag, 'som-cleanup');
  assert.equal(calls[1].options.authority, false);
});

test('creature SoM forwards its lease to both marking and cleanup', async () => {
  const calls = [], token = { tabId: 't1', revision: 2 }, wv = {};
  const context = { window: {
    aliveAuthority: { isCurrent: value => value === token },
    AliveGuestExecution: { run: async (guest, code, options) => {
      calls.push({ guest, options });
      return options.tag === 'som' ? { markMap: { current: true }, contextText: 'current page', authority: token } : null;
    } }
  }, tabs: [], activeTabId: 't1', getActiveTab: () => ({ id: 't1', wv }), safeGetUrl() {}, lastMarkMap: {} };
  await action('buildSoMContext', context)(wv, false, true, { authorityToken: token });
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.notEqual(call.options.authority, false);
    assert.equal(call.options.authorityToken, token);
  }
});

test('creature SoM rejects a late revoked lease before replacing host marks', async () => {
  let valid = true, resolve, captures = 0;
  const token = { tabId: 't1', revision: 2 }, original = { retained: true };
  const wv = { capturePage() { captures++; } };
  const context = { window: {
    aliveAuthority: { isCurrent: value => valid && value === token },
    AliveGuestExecution: { run: () => new Promise(done => { resolve = done; }) }
  }, tabs: [], activeTabId: 't1', getActiveTab: () => ({ id: 't1', wv }), safeGetUrl() {}, lastMarkMap: original };
  const pending = action('buildSoMContext', context)(wv, false, true, { authorityToken: token });
  valid = false;
  resolve({ markMap: { stale: true }, contextText: 'old page', authority: token });
  assert.equal(await pending, null);
  assert.equal(context.lastMarkMap, original);
  assert.equal(captures, 0);
});

test('SoM ignores a late guest result after cancellation without replacing marks or capturing a screenshot', async () => {
  let resolve, calls = 0, captures = 0;
  const abort = new AbortController(), initialMarks = { retained: true };
  const context = { window: { AliveGuestExecution: { run: () => { calls++; return new Promise(done => { resolve = done; }); } } },
    tabs: [], activeTabId: 't1', safeGetUrl() {}, lastMarkMap: initialMarks };
  const build = action('buildSoMContext', context);
  const result = build({ capturePage() { captures++; } }, false, true, { signal: abort.signal });
  abort.abort();
  resolve({ markMap: { stale: true }, contextText: 'stale' });
  assert.equal(await result, null);
  assert.equal(context.lastMarkMap, initialMarks);
  assert.equal(captures, 0);
  assert.equal(await build({}, false, false, { signal: abort.signal }), null);
  assert.equal(calls, 1);
});


function neoFixture({ count = 5, autoHop = false, selected = 4 } = {}) {
  const effects = { created: [], closed: [], navigated: [], zoomed: [], selectedCounts: [] };
  const tabs = Array.from({ length: count }, (_, i) => ({ id: 't' + i, domReady: true, title: 'Fixture ' + i,
    wv: { setZoomFactor(value) { effects.zoomed.push(value); } } }));
  const context = {
    window: { alienAutoNavigateLinks: autoHop, __lastNeoTabSpawnTs: 0,
      __chaoticAttractorState: { lx: 1, ly: 2, lz: 3, rx: 1, ry: 2, rz: 3, chirikovTheta: 0, externalBrainsState: { lastLayaVerdict: 'fixture' } } },
    document: { querySelectorAll: () => [], getElementById: () => null },
    humunculusRuntime: { isUrlOrAnchorTaboo: () => false }, hybridBrainMesh: {},
    neoMatrixPuppeteerStepCount: 0, tabs, activeTabId: 't0', secondaryTabId: 't1', splitViewActive: true, splitRatioPct: 50,
    hybridQrng: { u64: () => 0n, uniform: () => 0 }, ALIEN_RABBIT_HOLES: [{ title: 'Fixture next', url: 'https://fixture.test/next' }],
    sampleChaoticNeuralIntent(length) { effects.selectedCounts.push(length); return selected; },
    getTab: id => tabs.find(tab => tab.id === id), isWebviewGuestReady: () => true,
    createTab(url) { effects.created.push(url); return { id: 'new' }; },
    closeTab(id) { effects.closed.push(id); }, switchTab() {}, updateSplitViewClasses() {}, applySplitRatioWidths() {},
    dispatchNonBlockingTabNavigation(tab, url) { effects.navigated.push(url); },
    possessAllOpenTabsSimultaneously: async () => tabs.length,
    runAliveGuestScript: async () => true
  };
  return { context, effects, run: options => action('stepNeoMatrixBrowserPuppeteer', context)(false,
    { authorityCurrent: () => true, authorityToken: { tabId: 't0' }, ...options }) };
}

test('Auto-Hop off blocks legacy Neo tab creation and pruning while other Neo effects still run', async () => {
  const one = neoFixture({ count: 1, selected: 0 });
  const first = await one.run();
  assert.equal(first.intentId, 0);
  assert.deepEqual(one.effects.created, []);
  for (const coordinated of [false, true]) {
    const f = neoFixture();
    const result = await f.run({ coordinated });
    assert.equal(result.intentId, 8, 'filtered intent executes optical zoom, not tab recycling');
    assert.equal(f.effects.zoomed.length, 5);
    assert.deepEqual(f.effects.created, []);
    assert.deepEqual(f.effects.closed, []);
    assert.deepEqual(f.effects.navigated, []);
    assert.deepEqual(f.effects.selectedCounts, [14]);
  }
});

test('Auto-Hop on retains the legacy Neo tab-recycling capability', async () => {
  const f = neoFixture({ autoHop: true });
  const result = await f.run();
  assert.equal(result.intentId, 4);
  assert.deepEqual(f.effects.closed, ['t2']);
  assert.deepEqual(f.effects.selectedCounts, [18]);
});

test('immediate creature navigation cannot bypass Auto-Hop while allowed navigation still dispatches', () => {
  const events = [], navigations = [], visited = [];
  const tab = { id: 't1', domReady: true, wv: { addEventListener(name) { events.push(name); }, removeEventListener() {} } };
  const context = { window: { alienAutoNavigateLinks: false }, Date,
    safeGetUrl: () => 'https://fixture.test/current', safeLoadUrl: (tab, url) => navigations.push(url),
    humunculusRuntime: { recordVisitedUrl: url => visited.push(url) }, renderTabs() {} };
  const dispatch = action('dispatchNonBlockingTabNavigation', context);
  assert.equal(dispatch(tab, 'https://fixture.test/next', '', true), false);
  assert.deepEqual(navigations, []);
  assert.deepEqual(visited, []);
  context.window.alienAutoNavigateLinks = true;
  assert.equal(dispatch(tab, 'https://fixture.test/next', '', true), true);
  assert.deepEqual(navigations, ['https://fixture.test/next']);
  assert.deepEqual(visited, ['https://fixture.test/next']);
  assert.deepEqual(events, ['dom-ready']);
});

function presentationScheduler() {
  const crawler = source.indexOf('const stepChromeCrawler = (frameTime) => {');
  const start = source.indexOf('const presentationNow = performance.now();', crawler);
  const end = source.indexOf('if (!chromeCrawlerState.presentationIntervals)', start);
  assert.ok(crawler >= 0 && start > crawler && end > start, 'actual crawler timing block exists');
  const state = { nextNeuralStepAt: 12345, lastNeuralStepMs: 7 };
  const run = vm.runInNewContext('(function(frameTime, arrivalTime) {' +
    'const performance = { now: () => arrivalTime };' + source.slice(start, end) +
    'return true; })', { chromeCrawlerState: state });
  return { state, render: (frameTime, arrivalTime = frameTime) => run(frameTime, arrivalTime) === true };
}

test('legacy portal cannot navigate with Auto-Hop disabled even without the coordinator', async () => {
  assert.equal(await action('spawnAlienRabbitHoleTab', { window: { alienAutoNavigateLinks: false } })('fixture'), null);
});

test('selecting the forensic view never runs a training audit against the live model', () => {
  let renders = 0;
  const h = { forensic25x10Auditor: { runFull25PassBy10IterationAudit() { throw new Error('inspection mutated live model'); } },
    renderRetroTerminalOverlay() { renders++; } };
  action('setHumunculusTerminalView', { humunculusRuntime: h, getActiveTab: () => null, document: { getElementById: () => null } })('forensic25x10');
  assert.equal(h.terminalViewMode, 'forensic25x10');
  assert.equal(renders, 1);
  const start = source.indexOf("        if (mode === 'forensic25x10') {");
  const end = source.indexOf("        if (mode === 'metacognition') {", start);
  const render = vm.runInNewContext('(function() {' + source.slice(start, end) + '})', { mode: 'forensic25x10' });
  assert.match(render.call(h), /NOT_RUN/);
});

function runtimeMethod(name, context = {}) {
  let start = source.indexOf('      ' + name + '(');
  if (start < 0) start = source.indexOf('      async ' + name + '(');
  const end = source.indexOf('\n      }', start) + 8;
  assert.ok(start >= 0 && end > start, 'actual runtime method exists: ' + name);
  return vm.runInNewContext('({' + source.slice(start, end) + '})', context)[name];
}

test('formation UI reports the actual runtime string receipt across a complete cycle', () => {
  const messages = [], pings = [];
  const formations = ['PENTAGRAM_SYNAPSE', 'FREE_FORAGE', 'PINCER_ENCIRCLE', 'PHALANX_SWEEP', 'VORTEX_ORBIT'];
  const h = { SWARM_FORMATIONS: formations, swarmCollective: { formationMode: formations[0] },
    emitBioAcousticPing: value => pings.push(value), renderRetroTerminalOverlay() {} };
  h.cycleSwarmFormation = runtimeMethod('cycleSwarmFormation');
  const run = action('cycleCreatureSwarmFormation', { humunculusRuntime: h,
    renderRetroTerminalOverlay() {}, updateHybridTelemetryBar() {},
    pulseBrowserButtonVisual: (_button, message) => messages.push(message) });
  for (const expected of [...formations.slice(1), formations[0]]) {
    assert.equal(run(), expected);
    assert.equal(h.swarmCollective.formationMode, expected);
    assert.equal(messages.at(-1), 'Swarm Formation → ' + expected);
  }
  assert.equal(messages.length, 5);
  assert.equal(pings.length, 10);
  assert.doesNotMatch(messages.join('\n'), /undefined/);
});

test('formation UI does not invent a completed formation when its runtime receipt is absent', () => {
  const messages = [];
  const run = action('cycleCreatureSwarmFormation', {
    humunculusRuntime: { cycleSwarmFormation() {}, emitBioAcousticPing() {} },
    renderRetroTerminalOverlay() {}, updateHybridTelemetryBar() {},
    pulseBrowserButtonVisual: (_button, message) => messages.push(message) });
  assert.equal(run(), undefined);
  assert.deepEqual(messages, ['Swarm Formation unavailable: no runtime receipt']);
});

test('visible inspector refreshes actual runtime ticks and scopes legacy portal attempts on every paint', () => {
  const kpi = {}, drawer = { style: { display: 'flex' } };
  const document = { body: { classList: { contains: () => true } },
    getElementById: id => id === 'alien-kpi-cycles' ? kpi : id === 'alien-brain-drawer' ? drawer : null };
  let now = 1000;
  const context = { document, alienBrainDoorsCount: 0, performance: { now: () => now } };
  context.updateAlienBrainActivityEvidence = action('updateAlienBrainActivityEvidence', context);
  const h = { simulationTick: 47, formatRetroTerminalText: () => 'fixture' };
  const render = runtimeMethod('renderRetroTerminalOverlay', context);
  render.call(h);
  assert.equal(kpi.textContent, '47 ticks · 0 legacy portal attempts');
  assert.match(kpi.title, /exclude coordinated research navigation/);
  assert.match(kpi.title, /do not confirm page loads/);
  now += 300; h.simulationTick = 91; context.alienBrainDoorsCount = 2;
  render.call(h);
  assert.equal(kpi.textContent, '91 ticks · 2 legacy portal attempts');
  now += 300; h.simulationTick = NaN; context.alienBrainDoorsCount = undefined;
  render.call(h);
  assert.equal(kpi.textContent, 'unmeasured ticks · unmeasured legacy portal attempts');
});

test('broad habitat and inspector labels allow configured research inference without contradicting local controls', () => {
  const shell = source.slice(source.indexOf('<!-- BROWSER-WIDE A-LIFE HABITAT:'), source.indexOf('    const ipcRenderer ='));
  assert.match(shell, /LOCAL NEURAL CONTROLLER \+ OPTIONAL CONFIGURED RESEARCH MODEL/);
  assert.doesNotMatch(shell, /ZERO-LLM|0-LLM|0 TOKENS|No language model\. No tokens/);
  const banner = source.slice(source.indexOf('        const modeBanner = isSuper'), source.indexOf("        if (mode === 'memory')"));
  assert.match(banner, /LOCAL NEURAL \+ OPTIONAL RESEARCH MODEL/);
  assert.doesNotMatch(banner, /0-LLM|ZERO-LLM/);
  assert.match(source, /Updated Actor\/Critic.*\(0 LLM calls, 0 tokens\)/, 'method-specific local rollout facts remain scoped to that operation');
});

function offspringFixture() {
  let serial = 0;
  const h = { bodyRecipe: { limbCount: 8, hue: 120, rayRange: 100, bodyCid: 'parent' }, offspringColony: [],
    authorityEpoch: 3, simulationTick: 7, horizontalTransfersCount: 0, W_actor: Float32Array.of(0.2, 0.3),
    semanticMemory: { lineageFacts: [] }, mintCid: prefix => prefix + (++serial), updateMorphologyVector() {},
    emitBioAcousticPing() {}, saveCheckpoint() {}, savePersistentGenome() {}, renderRetroTerminalOverlay() {} };
  h.spawnMitosisOffspring = runtimeMethod('spawnMitosisOffspring', { hybridQrng: { u64: () => 4n, uniform: () => 0.9 } });
  h.updateObservedOffspringFitness = runtimeMethod('updateObservedOffspringFitness');
  return h;
}

test('birth initializes zero observed fitness and cannot promote random parent weights', () => {
  const h = offspringFixture(), before = Array.from(h.W_actor), body = { ...h.bodyRecipe };
  const result = h.spawnMitosisOffspring();
  assert.equal(result.offspring.harvestScore, 0);
  assert.equal(result.offspring.harvestObservations, 0);
  assert.equal(result.hgtOccurred, false);
  assert.equal(h.horizontalTransfersCount, 0);
  assert.deepEqual(h.bodyRecipe, body);
  assert.deepEqual(Array.from(h.W_actor), before);
});

test('offspring selection needs observed contacts, ignores invalid scores, and does not invent policy inheritance', () => {
  const h = offspringFixture(), child = h.spawnMitosisOffspring().offspring, before = Array.from(h.W_actor);
  // Migrated legacy checkpoints may contain optimistic random birth fitness.
  child.harvestScore = 9;
  assert.equal(h.updateObservedOffspringFitness([{ id: child.offspringId, bodyCid: child.bodyCid, score: NaN }, { id: 'unknown', score: 100 }]), null);
  assert.equal(h.updateObservedOffspringFitness([{ id: child.offspringId, bodyCid: 'different-body', score: 100 }]), null);
  assert.equal(h.updateObservedOffspringFitness([{ id: child.offspringId, bodyCid: child.bodyCid, score: 0.35 }]), null);
  assert.equal(child.harvestScore, 0.35);
  assert.equal(h.horizontalTransfersCount, 0);
  assert.equal(h.updateObservedOffspringFitness([{ id: child.offspringId, bodyCid: child.bodyCid, score: 2.1 }]), child);
  assert.equal(h.bodyRecipe.bodyCid, child.bodyCid);
  assert.equal(h.horizontalTransfersCount, 1);
  assert.equal(h.updateObservedOffspringFitness([{ id: child.offspringId, bodyCid: child.bodyCid, score: 2.1 }]), null);
  assert.deepEqual(Array.from(h.W_actor), before);
  assert.match(h.semanticMemory.lineageFacts[0].claim, /no policy inheritance or parent comparison measured/);
});

test('replacement offspring retain distinct identities and retired bodies cannot donate fitness', () => {
  const h = offspringFixture(), children = Array.from({ length: 9 }, () => h.spawnMitosisOffspring().offspring);
  assert.equal(new Set(children.map(child => child.offspringId)).size, 9);
  assert.equal(h.offspringColony.length, 4);
  assert.equal(h.updateObservedOffspringFitness([{ id: children[0].offspringId, bodyCid: children[0].bodyCid, score: 100 }]), null);
  assert.equal(h.horizontalTransfersCount, 0);
});

test('handoff waits for the selected guest outcome without fabricating local epochs or checkpoints', async () => {
  let resolve;
  const calls = [], h = { authorityEpoch: 3, lastPolicyStep: { authorityEpoch: 3 },
    saveCheckpoint() { throw new Error('Must not mint a checkpoint for a tab selection'); } };
  const handoff = runtimeMethod('executeAcknowledgedTabHandoff', { window: {
    selectAliveGuest(id, options) { calls.push({ id, reason: options.reason }); return new Promise(done => { resolve = done; }); }
  } });
  const pending = handoff.call(h, 'one', 'two', 'test-handoff');
  assert.equal(h.authorityEpoch, 3);
  assert.deepEqual(h.lastPolicyStep, { authorityEpoch: 3 });
  assert.deepEqual(calls, [{ id: 'two', reason: 'test-handoff' }]);
  resolve({ status: 'completed', evidence: { newEpoch: 4, destinationAcknowledged: true,
    distributedWriterFencing: false, checkpointTransferred: false } });
  const result = await pending;
  assert.equal(result.status, 'completed');
  assert.equal(result.newEpoch, 4);
  assert.equal(result.destinationAcknowledged, true);
  assert.equal(result.distributedWriterFencing, false);
  assert.equal(result.checkpointTransferred, false);
  assert.equal(h.authorityEpoch, 3, 'authority onCommit owns model changes, not the action wrapper');
});

test('handoff reports missing or failed authority without claiming an acknowledgement', async () => {
  const missing = await runtimeMethod('executeAcknowledgedTabHandoff', { window: {} }).call({}, 'one', 'two');
  assert.equal(missing.status, 'unavailable');
  const failed = await runtimeMethod('executeAcknowledgedTabHandoff', { window: {
    selectAliveGuest: async () => ({ status: 'blocked', reason: 'Destination document is not ready', evidence: {} })
  } }).call({}, 'one', 'two');
  assert.equal(failed.status, 'blocked');
  assert.equal(failed.destinationAcknowledged, undefined);
});

test('actual presentation scheduler keeps a 60 Hz phase on 120 and 144 Hz callback sequences', () => {
  for (const refresh of [120, 144]) {
    const scheduler = presentationScheduler(), rendered = [];
    for (let i = 0; i < refresh * 2; i++) {
      const timestamp = 1000 + i * 1000 / refresh;
      if (scheduler.render(timestamp)) rendered.push(timestamp);
    }
    assert.equal(rendered.length, 120, refresh + ' Hz delivery preserves 120 presentations over two seconds');
    const intervals = rendered.slice(1).map((time, i) => time - rendered[i]);
    assert.ok(Math.min(...intervals) >= 1000 / refresh * 2 - 0.001);
    assert.ok(Math.max(...intervals) <= 1000 / refresh * 3 + 0.001);
    assert.equal(scheduler.state.nextNeuralStepAt, 12345);
    assert.equal(scheduler.state.lastNeuralStepMs, 7);
  }
});

test('early callbacks respect tolerance without moving the phase to callback arrival time', () => {
  const scheduler = presentationScheduler();
  assert.equal(scheduler.render(1000, 1008), true);
  const due = scheduler.state.nextPresentationAt;
  assert.equal(scheduler.render(due - 0.6, due + 10), false);
  assert.equal(scheduler.state.nextPresentationAt, due);
  assert.equal(scheduler.render(due - 0.4, due + 12), true);
  assert.ok(Math.abs(scheduler.state.nextPresentationAt - (due + 1000 / 60)) < 1e-8);
  const steady = presentationScheduler(), jittery = presentationScheduler();
  for (let i = 0; i < 240; i++) {
    const timestamp = 1000 + i * 1000 / 120;
    assert.equal(jittery.render(timestamp, timestamp + (i % 9) * 1.3), steady.render(timestamp));
    assert.equal(jittery.state.nextPresentationAt, steady.state.nextPresentationAt);
  }
});

test('delayed callbacks discard expired deadlines instead of requesting an immediate catch-up draw', () => {
  const scheduler = presentationScheduler();
  scheduler.render(1000);
  assert.equal(scheduler.render(1100), true);
  assert.ok(scheduler.state.nextPresentationAt > 1100);
  assert.equal(scheduler.render(1100 + 1000 / 120), false, 'no extra catch-up presentation at the next half-rate callback');
  assert.equal(scheduler.render(1100 + 1000 / 60), true);
  const due = scheduler.state.nextPresentationAt;
  assert.equal(scheduler.render(1100 + 1000 / 60), false, 'the same timestamp cannot render twice');
  assert.equal(scheduler.state.nextPresentationAt, due);
});

test('large frame gaps advance directly to one future slot and preserve the timing fallback', () => {
  const scheduler = presentationScheduler();
  assert.equal(scheduler.render(undefined, 1000), true);
  for (const timestamp of [10000, 61000, 3601000, 3601000 + 1000 / 60]) {
    assert.equal(scheduler.render(timestamp), true);
    assert.ok(scheduler.state.nextPresentationAt > timestamp, 'next deadline is strictly in the future');
    assert.ok(scheduler.state.nextPresentationAt <= timestamp + 1000 / 60 + 1e-7);
    assert.equal(scheduler.render(timestamp), false);
  }
});

function bootAutostartFixture({ coordinated = true } = {}) {
  const boot = source.indexOf('    async function boot() {');
  const opening = '        if (!cfg.smokeMode) setTimeout(() => {';
  const end = source.indexOf('\n        }, 650);', boot);
  const start = source.lastIndexOf(opening, end);
  assert.ok(boot >= 0 && start > boot && end > start, 'actual delayed boot callback exists');
  const events = { started: 0, legacyCycles: 0, kpis: 0 };
  const controller = coordinated ? new Controller({ capabilities: [], adapters: {},
    clock: () => 0, setTimer: () => 1, clearTimer() {} }) : null;
  const context = { window: {}, alienBrainActive: false, superintelligenceOverdrive: false, abortAutopilot: true,
    startAutonomyWatchdogAndSelfHealer() {}, updateAlienBrainKpis() { events.kpis++; },
    runOneAlienBrainCycle() { events.legacyCycles++; return Promise.resolve(); }
  };
  if (controller) {
    context.window.aliveOverdrive = controller;
    context.window.startAliveOverdrive = () => {
      events.started++;
      context.alienBrainActive = true;
      context.superintelligenceOverdrive = true;
      context.abortAutopilot = false;
      return controller.start();
    };
  }
  // The timer closes over boot's production cancellation predicate. Preserve
  // that lexical environment when exercising this callback in isolation.
  const bootStart = source.indexOf('async function boot() {');
  const currentPredicate = source.slice(bootStart, start).match(/const current = [^;]+;/)?.[0];
  assert.ok(currentPredicate, 'actual boot cancellation predicate is present');
  const callback = vm.runInNewContext('(() => {' + currentPredicate + '\nreturn () => {' + source.slice(start + opening.length, end) + '\n};})()', context);
  return { controller, context, events, callback,
    start: () => context.window.startAliveOverdrive(),
    pause() {
      context.alienBrainActive = false;
      context.superintelligenceOverdrive = false;
      context.abortAutopilot = true;
      controller.stop();
    }
  };
}

test('delayed boot callback starts an untouched coordinator normally', () => {
  const f = bootAutostartFixture();
  assert.equal(f.controller.generation, 0);
  f.callback();
  assert.equal(f.controller.running, true);
  assert.equal(f.controller.generation, 1);
  assert.equal(f.events.started, 1);
  assert.equal(f.context.alienBrainActive, true);
  assert.equal(f.context.superintelligenceOverdrive, true);
  assert.equal(f.context.abortAutopilot, false);
  f.controller.stop();
});

test('delayed boot callback does not duplicate a manual Start', () => {
  const f = bootAutostartFixture();
  f.start();
  f.callback();
  assert.equal(f.events.started, 1);
  assert.equal(f.controller.generation, 1);
  assert.equal(f.controller.running, true);
  assert.equal(f.events.kpis, 0);
  f.controller.stop();
});

for (const startedFirst of [false, true]) {
  test('delayed boot callback preserves ' + (startedFirst ? 'Start then Pause' : 'Pause before first Start'), () => {
    const f = bootAutostartFixture();
    if (startedFirst) f.start();
    f.pause();
    const pausedGeneration = f.controller.generation;
    assert.equal(pausedGeneration, startedFirst ? 2 : 1, 'real Controller records explicit stop even before start');
    f.callback();
    assert.equal(f.controller.running, false, 'delayed startup must not undo Pause');
    assert.equal(f.controller.generation, pausedGeneration);
    assert.equal(f.events.started, startedFirst ? 1 : 0);
    assert.equal(f.context.alienBrainActive, false);
    assert.equal(f.context.superintelligenceOverdrive, false);
    assert.equal(f.context.abortAutopilot, true);
    assert.equal(f.events.kpis, 0);
    assert.equal(f.events.legacyCycles, 0);
  });
}

test('delayed boot callback retains the legacy startup fallback without a coordinator', () => {
  const f = bootAutostartFixture({ coordinated: false });
  f.callback();
  assert.equal(f.events.legacyCycles, 1);
  assert.equal(f.context.alienBrainActive, true);
  assert.equal(f.context.superintelligenceOverdrive, true);
  assert.equal(f.context.abortAutopilot, false);
  f.callback();
  assert.equal(f.events.legacyCycles, 1);
});
