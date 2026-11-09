'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Execute the actual producer code, including Feed's generated guest script.
// These fixtures do not simulate rendering, pellet consumption, or Electron.
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function extract(first, next) {
  const start = source.indexOf(first), end = source.indexOf(next, start + first.length);
  assert.ok(start >= 0 && end > start, `Production boundaries exist: ${first}`);
  assert.equal(source.indexOf(first, start + first.length), -1, `Unique production boundary: ${first}`);
  return source.slice(start, end);
}
const feedSource = extract('    async function feedCreatureFromHabitatBar(options = {}) {',
  '    async function triggerEmergentConceptDive() {');
const hudSource = extract("            if (guestPersistent) guestResources.listen(bar, 'click', (ev) => {",
  '            document.body.appendChild(bar);');
const guestPointerSource = extract("            guestResources.listen(window, 'mousedown', (e) => {",
  "            guestResources.listen(window, 'dblclick', (e) => {");
const hostPointerSource = extract("        wvStack.addEventListener('mousedown', (e) => {",
  "        wvStack.addEventListener('dblclick', (e) => {");
const autoSource = extract('          // 5B. Auto-Spawn Emergent Quantum Glucose / Entropy Orbs on DOM Colliders & Render Pellets',
  '          for (let pi = 0; pi < pellets.length; pi++) {');
const plain = value => JSON.parse(JSON.stringify(value));

function queue(backlog = 0) {
  const values = Array.from({ length: backlog }, (_, insertionId) => ({ insertionId }));
  const produced = values.slice();
  Object.defineProperty(values, 'push', { value(...items) {
    produced.push(...items);
    return Array.prototype.push.apply(this, items);
  } });
  return { values, produced };
}
function assertTail(actual, tracked, cap) {
  assert.equal(actual, tracked.values, 'producer preserves the shared array identity');
  const expected = tracked.produced.slice(-cap);
  assert.equal(actual.length, expected.length, 'queue retains the complete bounded tail');
  for (let i = 0; i < expected.length; i++) assert.equal(actual[i], expected[i], `newest ordered object ${i}`);
}
function assertFinitePellets(pellets) {
  assert.ok(pellets.every(p => ['x', 'y', 'r', 'pulse'].every(key => Number.isFinite(p[key]))));
}

function feedFixture({ mode = 'ready', backlog = 0 } = {}) {
  const host = queue(backlog), guest = queue(backlog);
  const calls = { emotion: 0, audio: 0, telemetry: 0, terminal: 0, guest: 0, scope: 0 };
  const model = { pelletsEatenCount: 0, semanticMemory: { partnerModel: { pelletsFedByPartner: 0, cursorTrustScore: 0 } },
    morphogenesis: { totalExperienceXp: 0 },
    updateEmotionPersonalityAndMorphogenesis() { calls.emotion++; },
    emitBioAcousticPing(kind) { assert.equal(kind, 'pellet'); calls.audio++; } };
  const mesh = { viscera: { glc: 0, atp: 0 }, nm: { DA: 0 } };
  const guestWindow = { innerWidth: 1200, innerHeight: 800, __humunculusPellets: guest.values };
  const guestRealm = vm.createContext({ window: guestWindow });
  const tab = mode === 'no-tab' ? null : { id: 'owned-fixture', wv: mode === 'no-webview' ? null : {} };
  const token = { fixture: true };
  let current = true;
  const options = { authorityToken: token, authorityCurrent: () => current };
  const hostWindow = { innerWidth: 1440, innerHeight: 900, __hostViewportPellets: host.values };
  const context = vm.createContext({ window: hostWindow, humunculusRuntime: model, hybridBrainMesh: mesh,
    document: { getElementById(id) { assert.equal(id, 'host-alife-viewport-canvas'); return { width: 1440, height: 780 }; } },
    updateHybridTelemetryBar() { calls.telemetry++; }, renderRetroTerminalOverlay() { calls.terminal++; },
    getActiveTab: () => tab, isWebviewGuestReady: () => mode !== 'not-ready',
    runAliveGuestOperation(received, callback) { calls.scope++; return callback({ ...received, ...options }); },
    async runAliveGuestScript(target, script, received) {
      assert.equal(target, tab); assert.equal(received.tag, 'feed'); assert.equal(received.authorityToken, token);
      calls.guest++;
      if (mode === 'guest-rejected') return false;
      const result = vm.runInContext(script, guestRealm, { timeout: 1000, filename: 'actual-feed-guest.js' });
      if (mode === 'revoke-after-guest') current = false;
      return result;
    } });
  vm.runInContext(feedSource + '\nglobalThis.feed = feedCreatureFromHabitatBar;', context,
    { timeout: 1000, filename: 'actual-feed-host.js' });
  return { host, guest, calls, model, mesh, hostWindow, guestWindow,
    feed: scoped => context.feed(scoped === false ? {} : options), revoke() { current = false; } };
}

test('200 real Feed calls cap both queues and count offered food without inventing consumption, energy or experience', async () => {
  const f = feedFixture();
  for (let i = 0; i < 200; i++) {
    assert.deepEqual(plain(await f.feed(i !== 0)), { status: 'completed', localFed: true, pageApplied: true, pagePellets: 3 });
    assertTail(f.hostWindow.__hostViewportPellets, f.host, 14);
    assertTail(f.guestWindow.__humunculusPellets, f.guest, 12);
  }
  assert.equal(f.host.produced.length, 600); assert.equal(f.guest.produced.length, 600);
  assertFinitePellets(f.host.values); assertFinitePellets(f.guest.values);
  assert.deepEqual(f.calls, { emotion: 200, audio: 200, telemetry: 200, terminal: 200, guest: 200, scope: 1 });
  assert.equal(f.model.pelletsEatenCount, 0);
  assert.equal(f.model.semanticMemory.partnerModel.pelletsFedByPartner, 1200);
  assert.equal(f.model.semanticMemory.partnerModel.cursorTrustScore, .99);
  assert.equal(f.model.morphogenesis.totalExperienceXp, 0);
  assert.deepEqual(f.mesh, { viscera: { glc: 0, atp: 0 }, nm: { DA: 0 } });
});

test('one Feed call repairs a preexisting 600-pellet backlog in both realms', async () => {
  const f = feedFixture({ backlog: 600 });
  await f.feed();
  assertTail(f.hostWindow.__hostViewportPellets, f.host, 14);
  assertTail(f.guestWindow.__humunculusPellets, f.guest, 12);
  assert.equal(f.host.produced.length, 603); assert.equal(f.guest.produced.length, 603);
});

test('revoked Feed authority causes no changes; revocation after the guest does not report successful page application', async () => {
  const stale = feedFixture(); stale.revoke();
  assert.deepEqual(plain(await stale.feed()), { status: 'cancelled', reason: 'Guest authority revoked', localFed: false, pageApplied: false });
  assert.equal(stale.host.produced.length, 0); assert.equal(stale.guest.produced.length, 0);
  assert.deepEqual(stale.calls, { emotion: 0, audio: 0, telemetry: 0, terminal: 0, guest: 0, scope: 0 });
  assert.equal(stale.model.pelletsEatenCount, 0); assert.equal(stale.model.morphogenesis.totalExperienceXp, 0);
  const during = feedFixture({ mode: 'revoke-after-guest', backlog: 600 });
  assert.deepEqual(plain(await during.feed()), { status: 'cancelled', reason: 'Guest authority revoked during feeding', localFed: true, pageApplied: false });
  assertTail(during.hostWindow.__hostViewportPellets, during.host, 14);
  assertTail(during.guestWindow.__humunculusPellets, during.guest, 12);
  assert.equal(during.model.pelletsEatenCount, 0); assert.equal(during.calls.guest, 1);
  assert.equal(during.model.semanticMemory.partnerModel.pelletsFedByPartner, 3);
});

test('unavailable or nonacknowledging guests preserve bounded local Feed and report pageApplied false', async () => {
  for (const mode of ['no-tab', 'no-webview', 'not-ready', 'guest-rejected']) {
    const f = feedFixture({ mode, backlog: 600 });
    assert.deepEqual(plain(await f.feed()), { status: 'completed', localFed: true, pageApplied: false, pagePellets: 0 }, mode);
    assertTail(f.hostWindow.__hostViewportPellets, f.host, 14);
    assert.equal(f.guest.values.length, 600, 'an unavailable guest queue is not accessed or replaced');
    assert.equal(f.calls.guest, mode === 'guest-rejected' ? 1 : 0);
    assert.equal(f.model.pelletsEatenCount, 0); assert.equal(f.model.morphogenesis.totalExperienceXp, 0);
    assert.equal(f.model.semanticMemory.partnerModel.pelletsFedByPartner, 3);
  }
});

function guestListenerFixture(code, type, backlog = 600, persistent = true) {
  const tracked = queue(backlog), listeners = new Map(), bar = {};
  const window = { innerWidth: 1200, innerHeight: 800, __humunculusPellets: tracked.values };
  vm.runInNewContext(code, { window, bar, guestPersistent: persistent,
    guestResources: { listen(target, event, callback) {
      assert.equal(target, type === 'click' ? bar : window); assert.equal(event, type); listeners.set(event, callback);
    } } }, { timeout: 1000, filename: 'actual-guest-pellet-listener.js' });
  return { tracked, window, listener: listeners.get(type) };
}

test('persistent guest HUD Feed caps repeated batches and repairs an oversized queue without replacing it', () => {
  const f = guestListenerFixture(hudSource, 'click');
  let stopped = 0;
  const event = { target: { closest(selector) {
    assert.equal(selector, 'button[data-hact]'); return { getAttribute: () => 'feed' };
  } }, stopPropagation() { stopped++; } };
  for (let i = 0; i < 200; i++) {
    f.listener(event);
    assertTail(f.window.__humunculusPellets, f.tracked, 12);
  }
  assert.equal(stopped, 200); assert.equal(f.tracked.produced.length, 1200);
  assertFinitePellets(f.tracked.values);
  assert.equal(guestListenerFixture(hudSource, 'click', 0, false).listener, undefined);
  f.listener({ target: { closest: () => null }, stopPropagation() { assert.fail('non-button click is ignored'); } });
  assert.equal(f.tracked.produced.length, 1200);
});

test('actual guest pointer producer repairs 600 queued pellets and ignores HUD clicks', () => {
  const f = guestListenerFixture(guestPointerSource, 'mousedown');
  f.listener({ clientX: 45, clientY: 65, target: { closest: () => true } });
  assert.equal(f.tracked.values.length, 600); assert.equal(f.tracked.produced.length, 600);
  for (let i = 0; i < 30; i++) {
    f.listener({ clientX: 45 + i, clientY: 65 + i, target: { closest: () => null } });
    assertTail(f.window.__humunculusPellets, f.tracked, 12);
  }
  assert.deepEqual(plain(f.tracked.values.at(-1)), { x: 74, y: 94, r: 8, pulse: 0 });
});

test('actual host pointer producer repairs 600 queued pellets, keeps relative coordinates, and ignores HUD clicks', () => {
  const tracked = queue(600), window = { __hostViewportPellets: tracked.values };
  let listener;
  const wvStack = { getBoundingClientRect: () => ({ left: 10, top: 20 }),
    addEventListener(type, callback) { assert.equal(type, 'mousedown'); listener = callback; } };
  vm.runInNewContext(hostPointerSource, { window, wvStack }, { timeout: 1000 });
  listener({ clientX: 80, clientY: 90, target: { closest: () => true } });
  assert.equal(tracked.values.length, 600); assert.equal(tracked.produced.length, 600);
  for (let i = 0; i < 30; i++) {
    listener({ clientX: 80 + i, clientY: 90 + i, target: { closest: () => null } });
    assertTail(window.__hostViewportPellets, tracked, 14);
  }
  assert.deepEqual(plain(tracked.values.at(-1)), { x: 99, y: 99, r: 8.5, pulse: 0 });
});

test('actual host auto producer keeps its spawn cadence and repairs backlog even when spawning is skipped', () => {
  const tracked = queue(), context = vm.createContext({ pellets: tracked.values,
    st: { frameCount: 84 }, cols: [{ cx: 200, cy: 150 }], sw: 900, sh: 600 });
  const run = () => vm.runInContext(autoSource, context, { timeout: 1000 });
  run(); assert.equal(tracked.values.length, 0, 'no spawn off cadence');
  context.st.frameCount = 85;
  for (let i = 0; i < 5; i++) run();
  assert.equal(tracked.values.length, 4, 'existing less-than-four condition is preserved');
  assert.equal(tracked.produced.length, 4); assertFinitePellets(tracked.values);
  const oversized = queue(600);
  context.pellets = oversized.values; context.st.frameCount = 86; context.cols = [];
  run();
  assertTail(context.pellets, oversized, 14);
  assert.equal(oversized.produced.length, 600, 'cleanup does not manufacture a pellet');
});
