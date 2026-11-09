'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Authority = require('../systems/alive-authority.js');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function action(name, context) {
  let start = source.indexOf('    async function ' + name + '(');
  if (start < 0) start = source.indexOf('    function ' + name + '(');
  const end = source.indexOf('\n    }', start) + 6;
  assert.ok(start >= 0 && end > start, 'actual action exists: ' + name);
  return vm.runInNewContext('(' + source.slice(start, end).trim() + ')', context);
}
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function bodyFixture() {
  const tab = { id: 't1', wv: {}, url: 'https://example.test/same', committedUrl: 'https://example.test/same', domReady: true };
  const token = { sessionId: 's', epoch: 1, revision: 1, tabId: 't1', documentGeneration: 1, documentNonce: 'doc-1', kind: 'automatic', permitId: null };
  let currentToken = token, activeTab = tab, ready = true, response = null, sovereign = null;
  const calls = { sonar: 0, guest: 0, ingest: 0, visited: 0, fallback: 0, fitness: 0, step: 0, requested: [] };
  const h = {
    D_ACT: 2, bodyRecipe: {}, verletPhysics: { jointTorques24: [] }, offspringColony: [], morphogenesis: { totalExperienceXp: 0 }, emotionState: {},
    cognitiveCortex: { lastComparison: {}, lastComprehension: { topConcepts: [] }, lastMeasurement: {} },
    rationalLogicEngine: {}, causalGraph: {}, swarmCollective: {}, feralMorphodynamics: {}, realtimeProceduralWorld: {},
    decursiveSelfDeduplicator: {}, multivectorMetacognitionEngine: { cliffordMultivector16: [] }, neuralSubstrateTelemetry: {}, deepDarkWebSubstrateEngine: {},
    visitedUrlTabooSet: new Set(), clickedAnchorTabooSet: new Set(), pelletsEatenCount: 0,
    semanticMemory: { partnerModel: { pelletsFedByPartner: 0, cursorTrustScore: 0, startleInterruptions: 0 } }, bodyLevels: { level2Expression: {} },
    emitBioAcousticPing(kind) { if (kind === 'sonar') calls.sonar++; }, formatRetroTerminalText() { return ''; },
    synthesizeProprioceptiveFallbackFrame() { calls.fallback++; return { syntheticFallback: true }; },
    recordVisitedUrl() { calls.visited++; }, ingestAndComprehendPageTelemetry() { calls.ingest++; },
    executeSovereignBrowserMasterCommand() { return sovereign?.promise || Promise.resolve(); },
    updateObservedOffspringFitness() { calls.fitness++; }, stepClosedLoop() { calls.step++; }, savePersistentGenome() {}
  };
  const authority = {
    snapshot: () => ({ paused: false }), leaseFor: () => currentToken,
    isCurrent: candidate => !!candidate && Authority.sameToken(candidate, currentToken),
    validateCommand: (command, id) => command?.authority?.tabId === id && Authority.sameToken(command.authority, currentToken)
  };
  const context = { window: { aliveAuthority: authority, AliveAuthority: Authority,
    AlivePageExploration: require('../systems/alive-page-exploration.js'),
    aliveOverdrive: { request(id) { calls.requested.push(id); } },
    AliveGuestExecution: { run(_guest, code, options) { new vm.Script(code); calls.guest++; calls.code = code; calls.token = options.authorityToken; return response?.promise || Promise.resolve(response); } } },
    humunculusRuntime: h, hybridBrainMesh: { viscera: { glc: 0, cortisol: 0 }, nm: { DA: 0, NE: 0 } },
    getActiveTab: () => activeTab, ensureTabDomReady: () => ready?.promise || Promise.resolve(ready),
    isWebviewGuestReady: webview => webview === tab.wv && tab.domReady && !tab.mainFrameNavigating && !tab.frozen,
    superintelligenceOverdrive: false, alienBrainActive: true, document: { getElementById: () => null },
    updateHybridTelemetryBar() {}, safeGetUrl: candidate => candidate.url, splitViewActive: false,
    withFastTimeout: promise => promise, performance: { now: () => 10 }
  };
  context.readAlivePageSourceText = action('readAlivePageSourceText', {});
  const run = action('performWeirdAlienDomExperiment', context);
  context.performWeirdAlienDomExperiment = run;
  return { tab, token, h, calls, context, run: options => run(tab, options),
    revoke() { currentToken = null; }, replaceDocument() { currentToken = { ...token, documentGeneration: 2, documentNonce: 'doc-2' }; },
    setReady(value) { ready = value; }, setResponse(value) { response = value; }, setSovereign(value) { sovereign = value; },
    observation(extra = {}) { return { authority: token, url: tab.url, specimens: [], doors: [], eatenDelta: 0, startleDelta: 0, pendingHostCmds: [], ...extra }; }
  };
}

test('body rejects a missing lease before any model or guest work', async () => {
  const f = bodyFixture(); f.revoke();
  assert.equal(await f.run(), null);
  assert.equal(f.calls.guest, 0); assert.equal(f.calls.sonar, 0); assert.equal(f.calls.fallback, 0);
});

test('checkpoint verification fences direct body and manual guest operation entry', async () => {
  const f = bodyFixture(); f.context.window.__aliveCheckpointRestore = true;
  let invoked = false;
  assert.equal(await f.run(), null);
  const result = await action('runAliveGuestOperation', f.context)({}, () => { invoked = true; });
  assert.equal(result.status, 'blocked');
  assert.equal(invoked, false);
  assert.equal(f.calls.guest, 0); assert.equal(f.calls.sonar, 0);
});

test('final persistence fences direct body and manual operation entry without repurposing checkpoint state', async () => {
  const f = bodyFixture(); f.context.window.__alivePersistenceClosing = true;
  assert.equal(await f.run(), null);
  const result = await action('runAliveGuestOperation', f.context)({}, () => assert.fail('No manual mutation during final save'));
  assert.equal(result.status, 'blocked'); assert.match(result.reason, /persistence/);
  assert.equal(f.context.window.__aliveCheckpointRestore, undefined);
  assert.equal(f.calls.guest, 0); assert.equal(f.calls.sonar, 0);
});

test('shutdown during body readiness or guest work cannot commit late model changes', async () => {
  for (const phase of ['readiness', 'guest']) {
    const f = bodyFixture(), gate = deferred();
    if (phase === 'readiness') f.setReady(gate); else f.setResponse(gate);
    const result = f.run(); await settle();
    f.context.window.__alivePersistenceClosing = true;
    gate.resolve(phase === 'readiness' ? true : f.observation({ eatenDelta: 3 }));
    assert.equal(await result, null, phase);
    assert.equal(f.calls.ingest, 0); assert.equal(f.calls.visited, 0); assert.equal(f.calls.step, 0);
    assert.equal(f.h.pelletsEatenCount, 0);
  }
});

test('shutdown during sovereign work blocks later feeding, fitness, commands and neural commits', async () => {
  const f = bodyFixture(), sovereign = deferred();
  f.setResponse(f.observation({ eatenDelta: 3, pendingHostCmds: [{ action: 'mitosis', authority: f.token }] }));
  f.setSovereign(sovereign);
  const result = f.run(); await settle(); assert.equal(f.calls.ingest, 1);
  f.context.window.__alivePersistenceClosing = true; sovereign.resolve();
  assert.equal(await result, null);
  assert.equal(f.h.pelletsEatenCount, 0); assert.equal(f.calls.fitness, 0); assert.equal(f.calls.step, 0);
  assert.deepEqual(f.calls.requested, []);
});

test('an existing manual operation current predicate closes as soon as final persistence begins', async () => {
  const f = bodyFixture(); let current;
  await action('runAliveGuestOperation', f.context)({}, options => { current = options.authorityCurrent; });
  assert.equal(current(), true);
  f.context.window.__alivePersistenceClosing = true;
  assert.equal(current(), false);
});

test('shutdown fences direct guest-script entry and its late result without changing the lease', async () => {
  const f = bodyFixture(), gate = deferred(); f.setResponse(gate);
  const run = action('runAliveGuestScript', f.context);
  const pending = run(f.tab, 'true;', { authorityToken: f.token });
  assert.equal(f.calls.guest, 1);
  f.context.window.__alivePersistenceClosing = true;
  assert.equal(await run(f.tab, 'true;', { authorityToken: f.token }), null);
  gate.resolve(true); assert.equal(await pending, null);
  assert.equal(f.calls.guest, 1);
  assert.equal(f.context.window.aliveAuthority.isCurrent(f.token), true, 'admission flag must not forge lease retirement');
});

test('body checks revocation after readiness before fallback or sensory/model work', async () => {
  const f = bodyFixture(), ready = deferred(); f.setReady(ready);
  const result = f.run(); f.revoke(); ready.resolve(false);
  assert.equal(await result, null);
  assert.equal(f.calls.sonar, 0); assert.equal(f.calls.fallback, 0); assert.equal(f.calls.guest, 0);
});

test('same-URL document replacement rejects a late guest result without host observation commits', async () => {
  const f = bodyFixture(), response = deferred(); f.setResponse(response);
  const result = f.run(); await settle();
  assert.equal(f.calls.guest, 1);
  assert.ok(Authority.sameToken(f.calls.token, f.token));
  f.replaceDocument(); response.resolve(f.observation({ eatenDelta: 3 }));
  assert.equal(await result, null);
  assert.equal(f.calls.ingest, 0); assert.equal(f.calls.visited, 0); assert.equal(f.calls.step, 0); assert.equal(f.h.pelletsEatenCount, 0);
});

test('a guest result bearing another document token is rejected even if the URL matches', async () => {
  const f = bodyFixture();
  f.setResponse(f.observation({ authority: { ...f.token, documentNonce: 'other' } }));
  assert.equal(await f.run(), null);
  assert.equal(f.calls.ingest, 0); assert.equal(f.calls.step, 0);
});

test('navigation start rejects a late body receipt before model learning even while its old lease and URL remain current', async () => {
  const f = bodyFixture(), response = deferred(); f.setResponse(response);
  const result = f.run(); await settle();
  f.tab.domReady = false; f.tab.mainFrameNavigating = true;
  response.resolve(f.observation({ eatenDelta: 3 }));
  assert.equal(await result, null);
  assert.equal(f.calls.ingest, 0); assert.equal(f.calls.visited, 0); assert.equal(f.calls.step, 0); assert.equal(f.h.pelletsEatenCount, 0);
});

test('a requested/display URL cannot stand in for the actual committed document in a body receipt', async () => {
  const f = bodyFixture();
  f.tab.url = 'https://example.test/requested';
  f.setResponse(f.observation());
  assert.equal(await f.run(), null);
  assert.equal(f.calls.ingest, 0); assert.equal(f.calls.visited, 0); assert.equal(f.calls.step, 0);
});

test('navigation start during sovereign work blocks later feeding, fitness and neural commits without retiring the lease', async () => {
  const f = bodyFixture(), sovereign = deferred();
  f.setResponse(f.observation({ eatenDelta: 3 })); f.setSovereign(sovereign);
  const result = f.run(); await settle();
  assert.equal(f.calls.ingest, 1);
  f.tab.domReady = false; f.tab.mainFrameNavigating = true; sovereign.resolve();
  assert.equal(await result, null);
  assert.equal(f.h.pelletsEatenCount, 0); assert.equal(f.calls.fitness, 0); assert.equal(f.calls.step, 0);
});

test('revocation during sovereign work blocks later feeding, fitness, command, and neural commits', async () => {
  const f = bodyFixture(), sovereign = deferred();
  f.setResponse(f.observation({ eatenDelta: 3, pendingHostCmds: [{ action: 'mitosis', authority: f.token }] }));
  f.setSovereign(sovereign);
  const result = f.run(); await settle();
  assert.equal(f.calls.ingest, 1);
  f.revoke(); sovereign.resolve();
  assert.equal(await result, null);
  assert.equal(f.h.pelletsEatenCount, 0); assert.equal(f.calls.fitness, 0); assert.equal(f.calls.step, 0);
  assert.deepEqual(f.calls.requested, []);
});

test('current observation accepts tagged commands and rejects legacy strings or stale commands', async () => {
  const f = bodyFixture();
  f.setResponse(f.observation({ pendingHostCmds: ['mitosis', { action: 'morph', authority: { ...f.token, revision: 0 } }, { action: 'mitosis', authority: f.token }] }));
  assert.ok(await f.run());
  assert.deepEqual(f.calls.requested, ['procreate']);
  assert.equal(f.calls.step, 1); assert.equal(f.calls.fitness, 1);
});

test('busy body operation is not reused by another caller', async () => {
  const f = bodyFixture(), response = deferred(); f.setResponse(response);
  const first = f.run(); await settle();
  assert.equal(await f.run(), null);
  assert.equal(f.calls.guest, 1);
  response.resolve(f.observation()); await first;
  assert.equal(f.tab._domExpBusyPromise, null);
});

test('a direct paused body action acquires one permit and passes it through the nested body call', async () => {
  const f = bodyFixture(); let permits = 0;
  f.token.kind = 'manual';
  const authority = f.context.window.aliveAuthority;
  authority.snapshot = () => ({ paused: true });
  authority.withManualLease = async (id, callback) => { permits++; assert.equal(id, f.tab.id); return callback(f.token); };
  f.setResponse(f.observation());
  assert.ok(await f.run());
  assert.equal(permits, 1); assert.equal(f.calls.guest, 1); assert.equal(f.calls.step, 1);
});

test('Feed uses guarded guest execution and returns confirmed local/page effects', async () => {
  const f = bodyFixture();
  f.h.updateEmotionPersonalityAndMorphogenesis = () => {};
  f.context.hybridBrainMesh.viscera.atp = 0;
  Object.assign(f.context.window, { innerWidth: 1200, innerHeight: 800 });
  f.context.isWebviewGuestReady = () => true;
  f.context.renderRetroTerminalOverlay = () => {};
  f.context.runAliveGuestOperation = action('runAliveGuestOperation', f.context);
  f.context.runAliveGuestScript = action('runAliveGuestScript', f.context);
  const feed = f.context.feedCreatureFromHabitatBar = action('feedCreatureFromHabitatBar', f.context);
  f.setResponse(true);
  const result = await feed();
  assert.equal(result.status, 'completed'); assert.equal(result.localFed, true); assert.equal(result.pageApplied, true); assert.equal(result.pagePellets, 3);
  assert.equal(f.calls.guest, 1); assert.equal(f.h.pelletsEatenCount, 0);
  assert.equal(f.h.semanticMemory.partnerModel.pelletsFedByPartner, 6);
  assert.ok(Authority.sameToken(f.calls.token, f.token));
});

test('operation wrapper keeps a paused manual permit over the whole awaited action', async () => {
  const work = deferred(), events = [], tab = { id: 't1', wv: {} }, token = { tabId: 't1', kind: 'manual' };
  let held = false;
  const authority = { snapshot: () => ({ paused: true }), isCurrent: candidate => held && candidate === token,
    async withManualLease(id, callback) { assert.equal(id, tab.id); held = true; events.push('acquire'); try { return await callback(token); } finally { held = false; events.push('release'); } } };
  const run = action('runAliveGuestOperation', { window: { aliveAuthority: authority }, getActiveTab: () => tab });
  const result = run({}, async options => { assert.ok(options.authorityCurrent()); events.push('guest'); await work.promise; assert.ok(options.authorityCurrent()); events.push('commit'); return 9; });
  await settle(); assert.deepEqual(events, ['acquire', 'guest']);
  work.resolve(); assert.equal(await result, 9);
  assert.deepEqual(events, ['acquire', 'guest', 'commit', 'release']);
});

test('background script obtains its own acknowledged token, and stale source blocks dispatch', async () => {
  const sourceTab = { id: 't1', wv: {} }, background = { id: 't2', wv: {} };
  const sourceToken = { tabId: 't1', kind: 'automatic' }, backgroundToken = { tabId: 't2', kind: 'automatic' };
  let current = true, grant = deferred(), executions = 0;
  const authority = { isCurrent: token => current && (token === sourceToken || token === backgroundToken), leaseFor: () => null,
    grant(id) { assert.equal(id, 't2'); return grant.promise; } };
  const run = action('runAliveGuestScript', { window: { aliveAuthority: authority, AliveGuestExecution: {
    async run(guest, code, options) { executions++; assert.equal(guest, background.wv); assert.equal(code, 'true;'); assert.equal(options.authorityToken, backgroundToken); return true; }
  } }, getActiveTab: () => sourceTab });
  const result = run(background, 'true;', { authorityToken: sourceToken });
  grant.resolve({ status: 'completed', evidence: { token: backgroundToken } });
  assert.equal(await result, true); assert.equal(executions, 1);
  grant = deferred(); const stale = run(background, 'true;', { authorityToken: sourceToken });
  current = false; grant.resolve({ status: 'completed', evidence: { token: backgroundToken } });
  assert.equal(await stale, null); assert.equal(executions, 1);
});

test('manual script cannot obtain a recurring background grant', async () => {
  const sourceToken = { tabId: 't1', kind: 'manual' };
  const run = action('runAliveGuestScript', { window: { aliveAuthority: {
    isCurrent: () => true, leaseFor: () => null, grant() { throw new Error('Unexpected background grant'); }
  } }, getActiveTab: () => ({ id: 't1' }) });
  assert.equal(await run({ id: 't2', wv: {} }, 'true;', { authorityToken: sourceToken }), null);
});

const resourceStart = source.indexOf('          const guestAuthority = window.__aliveAuthority;');
const resourceEnd = source.indexOf('          const bodyCfg = ', resourceStart);
assert.ok(resourceStart > 0 && resourceEnd > resourceStart);
const resourceSetup = new vm.Script('(() => { ' + source.slice(resourceStart, resourceEnd) + '\nreturn {guestResources,guestPersistent,queueHostCommand}; })()');
function guestFixture(kind = 'automatic') {
  const frames = new Map(), timers = new Map(), listeners = new Map(), observers = [], cleanups = [];
  let id = 0, removedBar = 0;
  const window = { __humunculusPendingHostCmds: [], __humunculusAnimRunning: true, __humunculusMouseBound: true,
    addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(callback); },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); }
  };
  const context = vm.createContext({ window, crypto: { randomUUID: () => 'nonce' },
    document: { getElementById: () => ({ remove() { removedBar++; } }) },
    requestAnimationFrame(callback) { frames.set(++id, callback); return id; }, cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(callback) { timers.set(++id, callback); return id; }, clearTimeout(id) { timers.delete(id); },
    MutationObserver: class { constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } }
  });
  const control = request => vm.runInContext(Authority.controlScript('session', { sessionId: 'session', requestId: 'r', ...request }), context);
  const probe = control({ operation: 'probe' });
  let token = { sessionId: 'session', epoch: 1, revision: 1, tabId: 't1', documentGeneration: 1, documentNonce: probe.documentNonce, kind, permitId: kind === 'manual' ? 'permit' : null };
  control({ operation: 'install', revision: 1, documentNonce: probe.documentNonce, token });
  window.__aliveAuthority.executingToken = token;
  const setup = () => resourceSetup.runInContext(context);
  const api = setup();
  return { ...api, setup, window, frames, timers, listeners, observers, context, control, token,
    get removedBar() { return removedBar; }, revoke() { return control({ operation: 'revoke', revision: 2, documentNonce: probe.documentNonce }); },
    regrant() { token = { ...token, revision: 3, epoch: 2 }; control({ operation: 'install', revision: 3, documentNonce: probe.documentNonce, token }); window.__aliveAuthority.executingToken = token; return setup(); }
  };
}

test('guest owns callbacks and revocation cancels/removes them without touching page resources', () => {
  const f = guestFixture(); let calls = 0;
  const pageListener = () => {}; f.window.addEventListener('click', pageListener);
  f.frames.set(999, pageListener); f.timers.set(999, pageListener);
  const r = f.guestResources;
  r.frame(() => calls++); r.timeout(() => calls++, 20); r.listen(f.window, 'click', () => calls++); r.observe(() => calls++, {}, {});
  const staleFrame = [...f.frames].find(([id]) => id !== 999)[1];
  const staleTimer = [...f.timers].find(([id]) => id !== 999)[1];
  const staleListener = [...f.listeners.get('click')].find(callback => callback !== pageListener);
  f.queueHostCommand('mitosis');
  assert.equal(f.window.__humunculusPendingHostCmds[0].authority.documentNonce, f.token.documentNonce);
  f.revoke(); staleFrame(); staleTimer(); staleListener(); f.observers[0].callback([]);
  assert.equal(calls, 0); assert.deepEqual([...f.frames.keys()], [999]); assert.deepEqual([...f.timers.keys()], [999]);
  assert.deepEqual([...f.listeners.get('click')], [pageListener]); assert.equal(f.observers[0].disconnected, true);
  assert.equal(f.window.__alivePaused, true); assert.equal(f.window.__humunculusAnimRunning, false); assert.equal(f.window.__humunculusMouseBound, false);
  assert.equal(f.window.__humunculusPendingHostCmds.length, 0); assert.equal(f.removedBar, 1);
});

test('repeated body observations reuse one callback owner; a new lease creates a fresh owner', () => {
  const f = guestFixture(), original = f.guestResources;
  assert.equal(f.setup().guestResources, original);
  f.revoke(); const fresh = f.regrant().guestResources;
  assert.notEqual(fresh, original); assert.equal(original.current(), false); assert.equal(fresh.current(), true);
  let calls = 0; fresh.frame(() => calls++); [...f.frames.values()][0](5); assert.equal(calls, 1);
});

test('manual body setup cannot install persistent animation, listener, or observer owners', () => {
  const f = guestFixture('manual');
  assert.equal(f.guestPersistent, false); assert.equal(f.guestResources, undefined);
  assert.equal(f.frames.size, 0); assert.equal(f.timers.size, 0); assert.equal(f.listeners.size, 0); assert.equal(f.observers.length, 0);
});
