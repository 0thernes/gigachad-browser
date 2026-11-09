'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { validateFixtureUrls, splitHabitatExpression, assessSplitHabitat } = require('./alive-split-habitat-probe.cjs');
const urls = ['http://127.0.0.1:32123/.alive-probe-123/habitat.html', 'http://127.0.0.1:32123/.alive-probe-123/habitat-second.html'];

test('split probe admits only both exact fixtures on one owned loopback server', () => {
  assert.deepEqual(validateFixtureUrls(urls), urls);
  for (const values of [null, [], [urls[0]], [urls[1], urls[0]],
    [urls[0], urls[1].replace('32123', '32124')], [urls[0], urls[1].replace('probe-123', 'probe-124')],
    [urls[0], urls[1] + '#fragment'], [urls[0], urls[1] + '?replacement=1'],
    urls.map(url => url.replace('127.0.0.1', 'example.com')),
    urls.map(url => url.replace('http:', 'file:')), urls.map(url => url.replace('127.0.0.1', 'user:secret@127.0.0.1')),
    urls.map(url => url.replace('.alive-probe-123', 'ordinary-user-page'))]) {
    assert.throws(() => validateFixtureUrls(values), undefined, JSON.stringify(values));
    assert.throws(() => splitHabitatExpression({ fixtureUrls: values }), undefined, JSON.stringify(values));
  }
});

test('the self-contained actual-host expression compiles without launching Electron', () => {
  const expression = splitHabitatExpression({ fixtureUrls: urls });
  assert.doesNotThrow(() => new vm.Script(expression));
});

function evidence() {
  const ids = ['ratio-25', 'ratio-50', 'ratio-75', 'secondary-cache-invalidated', 'secondary-observation-rebound', 'pause-stops-exploration', 'no-runtime-errors'];
  const guest = { scrollY: 800, exploration: { scrollCommands: 2, observations: 3 }, secondarySensorAuthorized: false, primaryResourcesPresent: false };
  const paused = { left: structuredClone(guest), right: structuredClone(guest), bodyRuns: 4 };
  return { completed: true, screenshotReady: true, tabs: { left: 'left-id', right: 'right-id' },
    cases: ids.map(id => ({ id, passed: true })),
    ratios: [25, 50, 75].map(ratio => {
      const sample = frame => ({ frame, ratio, width: 1000, height: 600,
        bodies: Array.from({ length: 5 }, (_, i) => ({ x: i < 3 ? ratio * 5 : ratio * 10 + (1000 - ratio * 10) / 2, y: 300 })) });
      return { ratio, before: { left: { scrollY: 0 }, right: { scrollY: 0 } },
        after: { left: { scrollY: 700 }, right: { scrollY: 700 } }, samples: [sample(10), sample(20)],
        secondaryToken: { kind: 'auxiliary', tabId: 'right-id' },
        receipt: { evidence: { secondary: { status: 'observed', tabId: 'right-id' } } },
        colliders: [{ pane: 'left', tabId: 'left-id' }, { pane: 'right', tabId: 'right-id' }] };
    }),
    pause: { before: structuredClone(paused), after: structuredClone(paused) },
    final: { running: false, authority: { paused: true, transitioning: false, leases: [] }, pending: [] } };
}

test('passing labels cannot substitute for actual ratio, movement and pause observations', () => {
  const valid = evidence(); assert.equal(assessSplitHabitat(valid).ok, true);
  for (const alter of [
    result => { result.ratios = []; },
    result => { result.ratios[1].samples[1].bodies[4].x = 100; },
    result => { result.ratios[0].after.right.scrollY = 0; },
    result => { result.ratios[2].receipt.evidence.secondary.tabId = 'left-id'; },
    result => { result.pause.after.right.exploration.scrollCommands++; },
    result => { result.pause.after.right.secondarySensorAuthorized = true; },
    result => { result.final.pending = [{ tag: 'body' }]; },
    result => { result.final.authority.leases = [{ tabId: 'right-id' }]; },
    result => { result.cases[0].passed = false; },
    result => { result.cleanupError = 'Guest work did not drain'; }
  ]) {
    const result = evidence(); alter(result);
    assert.equal(assessSplitHabitat(result).ok, false);
  }
  assert.equal(assessSplitHabitat(undefined).ok, false);
});
