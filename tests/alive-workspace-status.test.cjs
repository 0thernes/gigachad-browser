'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { describeRuntime, describeGuestCleanup, describeCapability, describeResearch, describeTransport, isVerifiedOnion } = require('../systems/alive-workspace-ui');

test('a hidden running controller is visibly suspended instead of claimed active', () => {
  const text = describeRuntime({ running: true, suspended: true, inFlight: 1, jobs: [{ completedCount: 1, status: 'timeout' }], health: { awaitingSettlement: 1 } });
  assert.match(text, /^Suspended/);
  assert.match(text, /1 awaiting settlement/);
  assert.match(text, /1 need attention/);
  assert.match(describeRuntime({ running: false, suspended: true, jobs: [] }), /^Paused/);
});

test('host pause cannot hide pending or failed guest cleanup', () => {
  assert.equal(describeGuestCleanup({ cleanup: { status: 'pending', attempt: 2, maxAttempts: 3 } }), 'Guest cleanup pending · attempt 2/3');
  assert.match(describeGuestCleanup({ cleanup: { status: 'blocked', unresolved: [{ tabId: 'a' }], rawDrained: true } }), /1 documents unresolved/);
  assert.match(describeGuestCleanup({ cleanup: { status: 'blocked', unresolved: [], rawDrained: false } }), /raw work unsettled/);
  assert.equal(describeGuestCleanup({ cleanup: { status: 'completed', unresolved: [], rawDrained: true } }), '');
});

test('capability display identifies waiting locks and retry delays without inventing successes', () => {
  assert.match(describeCapability({ id: 'a', completedCount: 0, waitingFor: ['backend'], status: 'idle' }, {}), /Waiting for backend · 0 outcomes/);
  assert.match(describeCapability({ id: 'a', status: 'error', completedCount: 0, nextDueAt: 6000 }, { running: true, sampledAt: 2200 }), /retry in 4s/);
  assert.match(describeCapability({ id: 'a' }, { executions: [{ id: 'a', elapsedMs: 15000, timedOut: true }] }), /Timed out · 15.0s · awaiting settlement/);
  assert.match(describeCapability({ status: 'observed', completedCount: 2, mode: 'observe' }, {}), /2 observations/);
});

test('research display reports bounded observed progress and explicit navigation recovery', () => {
  const text = describeResearch({ visitedPages: 4, visitedDomains: 3, frontierCount: 21, modelUpdates: 3, pending: { url: 'https://example.org/new' }, lastReadiness: { recovery: true, reason: 'maximum dwell reached' } });
  assert.match(text, /4 pages · 3 domains · 21 candidates · 3 navigation-ranker updates/);
  assert.match(text, /Opening https:\/\/example.org\/new/);
  assert.match(text, /Recovery: maximum dwell reached/);
});

test('research readiness blockers are visible and pending URL text cannot dominate Controls', () => {
  const text = describeResearch({ modelUpdates: 2, pending: { url: 'https://example.org/' + 'very-long-path'.repeat(150) }, lastReadiness: { ready: false, reason: 'Auto-Hop is off' } });
  assert.match(text, /Waiting: Auto-Hop is off/);
  assert.match(text, /navigation-ranker updates/);
  assert.match(text, /…$/);
  assert.ok(text.length < 400);
});

test('SOCKS readiness is never displayed as verified onion browsing', () => {
  assert.equal(describeTransport({ localTorSocksActive: true }), 'Web · onion unverified');
  assert.equal(describeTransport({ socksHandshakeVerified: true, torPacApplied: true }), 'SOCKS route ready');
  assert.equal(describeTransport({ navigation: { onion: true, networkVerified: false, status: 'loaded', proxyRoute: 'SOCKS5 127.0.0.1:9050' } }), 'Onion · awaiting verified load');
  assert.equal(describeTransport({ navigation: { onion: true, networkVerified: true, status: 'loaded', proxyRoute: 'direct' } }), 'Onion loaded · route unverified');
  assert.equal(describeTransport({ navigation: { onion: true, networkVerified: true, status: 'loaded', proxyRoute: 'SOCKS5 127.0.0.1:9050' } }), 'Onion loaded · SOCKS5');
});

test('a prior onion navigation cannot label the currently active clearweb or another onion page', () => {
  const probe = { navigation: { url: 'http://fixture.onion/article', onion: true, networkVerified: true, status: 'loaded', proxyRoute: 'SOCKS5 127.0.0.1:9050' } };
  assert.equal(describeTransport(probe, 'https://example.org/'), 'Web · no current onion load');
  assert.equal(describeTransport(probe, 'http://different.onion/'), 'Onion · awaiting verified load');
  assert.equal(describeTransport(probe, 'http://fixture.onion/article#contents'), 'Onion loaded · SOCKS5');
  assert.equal(describeTransport(probe, ''), 'Web · no current onion load');
});

test('same-URL reloads require a new successful document receipt', () => {
  const url = 'http://fixture.onion/article';
  const probe = { navigation: { url, observedAt: 1000, onion: true, networkVerified: true, status: 'loaded', proxyRoute: 'SOCKS5 127.0.0.1:9050' } };
  assert.equal(describeTransport(probe, url, { activeLoading: true, activeLastNavStartTs: 900 }), 'Onion · awaiting verified load');
  assert.equal(describeTransport(probe, url, { activeLoading: false, activeLastNavStartTs: 1500 }), 'Onion · awaiting verified load');
  assert.equal(describeTransport(probe, url, { activeLoading: false, activeLastNavStartTs: 900 }), 'Onion loaded · SOCKS5');
});

test('managed bootstrap progress and failures are visible without claiming an onion load', () => {
  assert.equal(describeTransport({ managedTor: { status: 'bootstrapping', bootstrapProgress: 50, bootstrapped: false } }, 'https://example.org/'),
    'Tor bootstrap 50% · Web · no current onion load');
  const error = describeTransport({ managedTor: { status: 'error', bootstrapProgress: 80, bootstrapped: false, lastError: 'SOCKS address already in use' } });
  assert.match(error, /^Tor client error: SOCKS address already in use/);
  assert.doesNotMatch(error, /Onion loaded/);
  const timeout = describeTransport({ managedTor: { status: 'timeout', bootstrapProgress: 50, lastError: 'Bootstrap deadline expired' } });
  assert.match(timeout, /^Tor bootstrap timeout: Bootstrap deadline expired/);
  assert.match(describeTransport({ managedTor: { status: 'disabled' } }), /^Tor client disabled/);
});

test('managed readiness cannot bypass current-page and document-lifetime receipt checks', () => {
  const url = 'http://fixture.onion/article';
  const probe = { managedTor: { status: 'ready', bootstrapProgress: 100, bootstrapped: true },
    navigation: { url, observedAt: 1000, onion: true, networkVerified: true, status: 'loaded', proxyRoute: 'SOCKS5 127.0.0.1:9050' } };
  assert.equal(describeTransport(probe, 'https://example.org/'), 'Web · no current onion load');
  assert.equal(describeTransport(probe, url, { activeLoading: true }), 'Onion · awaiting verified load');
  assert.equal(describeTransport(probe, url, { activeLastNavStartTs: 1500 }), 'Onion · awaiting verified load');
  assert.equal(describeTransport(probe, url, { activeLastNavStartTs: 900 }), 'Onion loaded · SOCKS5');
  assert.equal(describeTransport({ managedTor: probe.managedTor }, url), 'Onion · awaiting verified load');
});

test('verified styling uses current network facts independently of managed-client label prefixes', () => {
  const url = 'http://fixture.onion/article';
  const probe = { managedTor: { status: 'idle', bootstrapProgress: 0, bootstrapped: false },
    navigation: { url, observedAt: 1000, onion: true, networkVerified: true, status: 'loaded', proxyRoute: 'SOCKS5 127.0.0.1:9050' } };
  assert.match(describeTransport(probe, url), /^Tor client idle/);
  assert.equal(isVerifiedOnion(probe, url, { activeLastNavStartTs: 900 }), true);
  assert.equal(isVerifiedOnion(probe, 'https://example.org/'), false);
  assert.equal(isVerifiedOnion(probe, url, { activeLoading: true }), false);
  assert.equal(isVerifiedOnion(probe, url, { activeLastNavStartTs: 1500 }), false);
  assert.equal(isVerifiedOnion({ ...probe, navigation: { ...probe.navigation, proxyRoute: 'DIRECT' } }, url), false);
  assert.equal(isVerifiedOnion({ ...probe, navigation: { ...probe.navigation, networkVerified: false } }, url), false);
});

test('an unready cached document cannot reuse a verified onion receipt even when it is not loading', () => {
  const url = 'http://fixture.onion/article';
  const probe = { navigation: { url, observedAt: 1000, onion: true, networkVerified: true, status: 'loaded', proxyRoute: 'SOCKS5 127.0.0.1:9050' } };
  const state = { activeReady: false, activeLoading: false, activeLastNavStartTs: 900 };
  assert.equal(isVerifiedOnion(probe, url, state), false);
  assert.doesNotMatch(describeTransport(probe, url, state), /Onion loaded|currently loading/);
  assert.match(describeTransport(probe, url, state), /awaiting verified load/);
  assert.equal(isVerifiedOnion(probe, url, { ...state, activeReady: true }), true);
});

function transportUIFixture(withLightweightGetter = true) {
  const url = 'http://fixture.onion/article';
  const probe = { navigation: { url, observedAt: 1000, onion: true, networkVerified: true, status: 'loaded', proxyRoute: 'SOCKS5 127.0.0.1:9050' } };
  const evidence = { lastBackendProbe: probe, activeUrl: url, activeReady: true, activeLoading: false, activeLastNavStartTs: 900 };
  const elements = new Map(['alive-runtime-status', 'alive-run-button', 'alive-transport-status'].map(id => [id, { dataset: {}, setAttribute() {} }]));
  elements.set('alive-controls-panel', { hidden: true });
  const calls = { full: 0, light: 0, guest: 0, controller: 0 };
  const context = { URL, document: { readyState: 'loading', addEventListener() {}, getElementById: id => elements.get(id) },
    getAliveRuntimeEvidence() { calls.full++; return evidence; },
    AliveGuestExecution: { pendingSnapshot() { calls.guest++; throw Error('Unexpected guest identity diagnostics'); } },
    aliveOverdrive: { snapshot() { calls.controller++; throw Error('Unexpected controller diagnostics'); } }
  };
  if (withLightweightGetter) context.getAliveTransportEvidence = () => { calls.light++; return evidence; };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'systems', 'alive-workspace-ui.js'), 'utf8'), context);
  return { context, calls, evidence, transport: elements.get('alive-transport-status'), update: () => context.aliveWorkspace.updateStatus({ running: false, jobs: [] }) };
}

test('actual recurring status updates use only the lightweight transport getter for the badge', () => {
  const f = transportUIFixture();
  for (let i = 0; i < 20; i++) f.update();
  assert.deepEqual(f.calls, { full: 0, light: 20, guest: 0, controller: 0 });
  assert.equal(f.transport.dataset.verified, 'true');
  assert.match(f.transport.textContent, /^Onion loaded/);
  f.evidence.activeReady = false;
  f.update();
  assert.equal(f.transport.dataset.verified, 'false');
  assert.doesNotMatch(f.transport.textContent, /Onion loaded/);
});

test('missing lightweight getter fails closed without falling back to full runtime evidence', () => {
  const f = transportUIFixture(false);
  f.update();
  assert.deepEqual(f.calls, { full: 0, light: 0, guest: 0, controller: 0 });
  assert.equal(f.transport.dataset.verified, 'false');
  assert.doesNotMatch(f.transport.textContent, /Onion loaded/);
});
