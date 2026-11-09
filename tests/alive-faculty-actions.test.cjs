'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function action(name, context) {
  const start = source.indexOf('    async function ' + name + '(');
  const end = source.indexOf('\n    }\n', start) + 7;
  assert.ok(start >= 0 && end > start, name + ' exists');
  return vm.runInNewContext('(' + source.slice(start, end).trim() + ')', context);
}

test('Ghost UI queues shared cognition and opens its evidence without executing legacy browser actions', async () => {
  const calls = [], logs = []; let opened = 0;
  const context = { window: { aliveOverdrive: { request: id => { calls.push(id); return true; } }, aliveFacultyVisuals: { open: () => opened++ } }, appendLog: (...args) => logs.push(args) };
  assert.equal(await action('runGhostSwarm', context)('specific\nresearch topic ' + 'x'.repeat(200)), true);
  assert.equal(context.window.aliveRequestedResearchTopic.length, 120);
  assert.doesNotMatch(context.window.aliveRequestedResearchTopic, /[\r\n]/);
  assert.equal(await action('runInlineGhostwriter', context)(), true);
  assert.deepEqual(calls, ['ghost-swarm', 'ghost-write']); assert.equal(opened, 2);
  assert.ok(logs.every(row => /Queued/.test(row[1])));
  context.window.aliveOverdrive.request = () => false;
  const previous = context.window.aliveRequestedResearchTopic;
  assert.equal(await action('runGhostSwarm', context)('do not replace pending topic'), false);
  assert.equal(context.window.aliveRequestedResearchTopic, previous);
});

test('Warp UI queues the canonical action and explicit desired state uses the guarded hook', async () => {
  const calls = [];
  const context = { window: { aliveOverdrive: { request: id => { calls.push(id); return true; } } }, applyAliveDomWarp: options => options.enabled };
  const run = action('toggleWebpageDomRealityWarp', context);
  assert.equal(await run(), true); assert.deepEqual(calls, ['warp-dom']);
  assert.equal(await run({ enabled: false }), false); assert.deepEqual(calls, ['warp-dom']);
});

// CSS declaration fixture preserves the browser contracts used by Warp:
// longhand identity, absent declarations, value normalization and !important.
// Shorthand writes throw so an accidental transition shorthand regression cannot
// pass by relying on this fixture's deliberately limited CSS parser.
function cssDeclarations(initial = []) {
  const declarations = new Map();
  const keyFor = key => String(key).replace(/[A-Z]/g, char => '-' + char.toLowerCase());
  const api = {
    getPropertyValue(key) {
      if (key === 'transition') {
        const values = ['transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay'].map(name => declarations.get(name));
        if (values.some(value => !value) || new Set(values.map(value => value.priority)).size > 1) return '';
        return values.map(value => value.value).join(' ');
      }
      return declarations.get(key)?.value || '';
    },
    getPropertyPriority: key => declarations.get(key)?.priority || '',
    setProperty(key, value, priority = '') {
      assert.notEqual(key, 'transition', 'Warp must not erase independent transition declarations using shorthand');
      if (!value) { declarations.delete(key); return; }
      if (priority && priority !== 'important') return;
      declarations.set(key, { value: String(value).replace(/,\s*/g, ', '), priority });
    },
    removeProperty(key) { const prior = declarations.get(key)?.value || ''; declarations.delete(key); return prior; },
    snapshot: () => Object.fromEntries([...declarations].sort(([a], [b]) => a.localeCompare(b)))
  };
  for (const [key, value, priority] of initial) api.setProperty(key, value, priority);
  return new Proxy(api, { get: (target, key) => key in target ? target[key] : target.getPropertyValue(keyFor(key)),
    set(target, key, value) { target.setProperty(keyFor(key), value); return true; } });
}

function warpFixture({ eligible = true, rootDeclarations, colliderDeclarations } = {}) {
  let current = true, fail = false, late = false, ready = true;
  const rootElement = { style: cssDeclarations(rootDeclarations || [['transform', 'scale(1.1)'], ['transition-property', 'opacity'],
    ['transition-duration', '1s'], ['transition-timing-function', 'ease'], ['transition-delay', '0s']]) };
  const collider = { style: cssDeclarations(colliderDeclarations || [['box-shadow', '1px 1px black']]), closest: () => null };
  const revoke = [], token = { revision: 1 }, signals = [], messages = [];
  const guest = { location: { href: 'https://source.example/page' }, document: { body: {}, querySelector: () => eligible ? rootElement : null,
    elementsFromPoint: () => eligible ? [collider] : [] }, __humunculusColliders: [{ cx: 10, cy: 20 }] };
  guest.window = guest;
  guest.__aliveAuthority = { executingToken: token, current: candidate => current && candidate === token, onRevoke: (_token, callback) => revoke.push(callback) };
  const realm = vm.createContext(guest);
  const tab = { id: 't1', domReady: true, committedUrl: guest.location.href, lastNavStartTs: 1, wv: {} };
  const h = { deity100Engine: { browserPossessionStats: { domLensingWarpsCount: 0 } }, emitBioAcousticPing: () => signals.push('ping') };
  const context = { window: {}, getActiveTab: () => tab, humunculusRuntime: h, isWebviewGuestReady: () => ready,
    pulseBrowserButtonVisual: (_id, message) => messages.push(message),
    runAliveGuestScript: async (_tab, code) => {
      if (fail) throw new Error('guest failed');
      const result = vm.runInContext(code, realm);
      if (late) tab.lastNavStartTs++;
      return result;
    } };
  const run = action('applyAliveDomWarp', context);
  return { rootElement, collider, guest, tab, h, signals, messages, context,
    run: options => run({ authorityCurrent: () => current, authorityToken: token, ...options }),
    revoke() { current = false; for (const callback of revoke) callback(); },
    setFailure: value => { fail = value; }, setLate: value => { late = value; }, setReady: value => { ready = value; } };
}

test('actual guest Warp applies once despite CSS serialization and restores original author styles', async () => {
  const f = warpFixture();
  const original = f.rootElement.style.snapshot();
  const first = await f.run({ enabled: true });
  assert.equal(first.status, 'completed'); assert.equal(first.evidence.changed, true);
  assert.match(f.rootElement.style.transform, /^scale\(1\.1\).*perspective/);
  assert.match(f.collider.style.boxShadow, /rgba/);
  const second = await f.run({ enabled: true });
  assert.equal(second.status, 'completed'); assert.equal(second.evidence.changed, false);
  assert.equal(f.h.deity100Engine.browserPossessionStats.domLensingWarpsCount, 1);
  assert.equal(f.signals.length, 1);
  const restored = await f.run({ enabled: false });
  assert.equal(restored.status, 'completed'); assert.equal(restored.evidence.enabled, false);
  assert.equal(f.rootElement.style.transform, 'scale(1.1)');
  assert.deepEqual(f.rootElement.style.snapshot(), original);
  assert.equal(f.collider.style.boxShadow, '1px 1px black');
  assert.equal((await f.run({ enabled: false })).evidence.changed, false);
});

test('revoking the document lease restores Warp and preserves styles changed by the page', async () => {
  const f = warpFixture(); await f.run();
  f.collider.style.boxShadow = '2px 2px red';
  f.revoke();
  assert.equal(f.rootElement.style.transform, 'scale(1.1)');
  assert.equal(f.collider.style.boxShadow, '2px 2px red');
  assert.equal(f.guest.__humunculusDomRealityWarp, false);
  assert.equal((await f.run()).status, 'blocked');
});

test('duplicate collider hits and effect-induced hit-test shifts cannot oscillate an enabled Warp', async () => {
  const f = warpFixture();
  const nextCollider = { style: cssDeclarations([['box-shadow', '4px 4px green']]), closest: () => null };
  f.guest.__humunculusColliders = [{ cx: 10, cy: 20 }, { cx: 10, cy: 20 }, { cx: 12, cy: 25 }];
  await f.run();
  const initialShadow = f.collider.style.boxShadow;
  assert.equal((await f.run()).evidence.changed, false, 'duplicate centers do not alternate shadow writes');
  f.guest.document.elementsFromPoint = () => [nextCollider];
  assert.equal((await f.run()).evidence.changed, false, 'an enabled session retains its enrolled elements after its own transform changes hit testing');
  assert.equal(f.collider.style.boxShadow, initialShadow);
  assert.equal(nextCollider.style.boxShadow, '4px 4px green');
  await f.run({ enabled: false });
  assert.equal(f.collider.style.boxShadow, '1px 1px black');
  assert.equal((await f.run()).evidence.changed, true, 'a new enabled session can enroll the current elements');
  assert.match(nextCollider.style.boxShadow, /rgba/);
});

test('partial transition longhands and important declarations survive enable, repeat, disable and lease cleanup', async () => {
  for (const cleanup of ['disable', 'revoke']) {
    const f = warpFixture({ rootDeclarations: [['transform', 'translateX(3px)', 'important'], ['transition-duration', '2s']],
      colliderDeclarations: [['box-shadow', '1px 1px black', 'important']] });
    const original = f.rootElement.style.snapshot(), originalCollider = f.collider.style.snapshot();
    assert.equal(f.rootElement.style.transition, '', 'partial longhands cannot be serialized as a complete shorthand');
    assert.equal((await f.run()).status, 'completed');
    assert.equal(f.rootElement.style.getPropertyPriority('transform'), 'important');
    assert.equal(f.collider.style.getPropertyPriority('box-shadow'), 'important');
    assert.equal((await f.run()).evidence.changed, false);
    if (cleanup === 'disable') await f.run({ enabled: false }); else f.revoke();
    assert.deepEqual(f.rootElement.style.snapshot(), original, cleanup);
    assert.deepEqual(f.collider.style.snapshot(), originalCollider, cleanup);
  }
});

test('mixed-priority transition longhands restore independently without touching transition behavior', async () => {
  const f = warpFixture({ rootDeclarations: [['transform', 'translateY(2px)'], ['transition-property', 'opacity', 'important'],
    ['transition-duration', '2s'], ['transition-timing-function', 'linear', 'important'], ['transition-delay', '.3s'],
    ['transition-behavior', 'allow-discrete', 'important']] });
  const original = f.rootElement.style.snapshot();
  assert.equal(f.rootElement.style.transition, '', 'mixed priorities cannot be represented by one shorthand declaration');
  await f.run();
  assert.equal(f.rootElement.style.getPropertyPriority('transition-property'), 'important');
  assert.equal(f.rootElement.style.getPropertyPriority('transition-duration'), '');
  assert.equal(f.rootElement.style.getPropertyValue('transition-behavior'), 'allow-discrete');
  await f.run({ enabled: false });
  assert.deepEqual(f.rootElement.style.snapshot(), original);
});

test('same-value priority edits and independent longhand edits made by a page survive cleanup', async () => {
  for (const repeat of [false, true]) {
    const f = warpFixture(); await f.run();
    const appliedTransform = f.rootElement.style.getPropertyValue('transform');
    f.rootElement.style.setProperty('transform', appliedTransform, 'important');
    f.rootElement.style.setProperty('transition-duration', '9s', 'important');
    const appliedShadow = f.collider.style.getPropertyValue('box-shadow');
    f.collider.style.setProperty('box-shadow', appliedShadow, 'important');
    if (repeat) {
      await f.run(); await f.run();
      assert.equal(f.rootElement.style.getPropertyValue('transform'), appliedTransform, 'priority-only edits do not append duplicate warp transforms');
    }
    await f.run({ enabled: false });
    assert.equal(f.rootElement.style.getPropertyValue('transform'), appliedTransform);
    assert.equal(f.rootElement.style.getPropertyPriority('transform'), 'important');
    assert.equal(f.rootElement.style.getPropertyValue('transition-duration'), '9s');
    assert.equal(f.rootElement.style.getPropertyPriority('transition-duration'), 'important');
    assert.equal(f.rootElement.style.getPropertyValue('transition-property'), 'opacity');
    assert.equal(f.collider.style.getPropertyValue('box-shadow'), appliedShadow);
    assert.equal(f.collider.style.getPropertyPriority('box-shadow'), 'important');
  }
});

test('unready, failed, empty and replaced guest documents cannot claim a Warp success', async () => {
  for (const condition of ['unready', 'failed', 'empty', 'replaced']) {
    const f = warpFixture({ eligible: condition !== 'empty' });
    if (condition === 'unready') f.setReady(false);
    if (condition === 'failed') f.setFailure(true);
    if (condition === 'replaced') f.setLate(true);
    const result = await f.run();
    assert.equal(result.status, 'blocked', condition); assert.equal(result.evidence.pageApplied, false);
    assert.equal(f.h.deity100Engine.browserPossessionStats.domLensingWarpsCount, 0);
    assert.equal(f.messages.length, 0);
  }
});

test('Warp obtains the existing bounded guest operation permit before running', async () => {
  const calls = [];
  const context = { window: {}, runAliveGuestOperation: async (options, callback) => { calls.push({ options, callback }); return { status: 'blocked', reason: 'fixture paused' }; } };
  const result = await action('applyAliveDomWarp', context)({ enabled: true });
  assert.equal(result.status, 'blocked'); assert.equal(calls.length, 1); assert.equal(calls[0].options.enabled, true);
});
