'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { decide } = require('../systems/alive-page-exploration.js');
const input = (overrides = {}) => ({ now: 0, scrollY: 0, viewportHeight: 800, scrollHeight: 4000, signature: 'article', motor: 0, ...overrides });

test('exploration uses viewport and actual motor, advances to end and never oscillates', () => {
  let state = null, y = 0;
  for (let i = 0; i < 10; i++) {
    state = decide(input({ now: i * 1400, scrollY: y }), state);
    assert.ok(state.requestedDelta >= 0);
    if (state.kind === 'scroll') { assert.ok(state.requestedDelta >= 600 || state.target === state.maxScroll); y = state.target; }
  }
  assert.equal(y, 3200); assert.equal(state.phase, 'exhausted'); assert.equal(state.kind, 'hold');
  assert.ok(decide(input({ motor: 1 })).target > decide(input({ motor: -1 })).target);
});
test('quick polls and partially settled smooth scrolling preserve one command', () => {
  let state = decide(input()), target = state.target;
  for (const [now, y] of [[50, 0], [100, 0], [200, 80], [400, 160], [649, 200]]) {
    state = decide(input({ now, scrollY: y }), state);
    assert.equal(state.phase, 'exploring'); assert.equal(state.kind, 'hold');
    assert.equal(state.pending, true); assert.equal(state.target, target);
    assert.equal(state.commandFromY, 0); assert.equal(state.scrollCommands, 1); assert.equal(state.stagnantObservations, 0);
  }
  state = decide(input({ now: 1400, scrollY: target }), state);
  assert.equal(state.kind, 'scroll'); assert.equal(state.stagnantObservations, 0);
});
test('failed scrolls block even when animation changes content; actual movement or growth can recover', () => {
  let state = null;
  for (let i = 0; i < 10; i++) state = decide(input({ now: i * 1400, signature: 'ticker ' + i }), state);
  assert.equal(state.phase, 'blocked'); assert.equal(state.scrollCommands, 2);
  assert.ok(state.stagnantObservations >= 2);
  assert.equal(decide(input({ now: 15000, scrollY: 200 }), state).phase, 'exploring');
  assert.equal(decide(input({ now: 15000, scrollHeight: 5200 }), state).phase, 'exploring');
});
test('user input and editable focus yield; one-screen pages exhaust without a fake scroll', () => {
  for (const flag of ['yieldToUser', 'editableFocused']) {
    const state = decide(input({ [flag]: true }));
    assert.equal(state.phase, 'yielding'); assert.equal(state.scrollCommands, 0);
  }
  const state = decide(input({ scrollHeight: 700 }));
  assert.equal(state.phase, 'exhausted'); assert.equal(state.scrollCommands, 0); assert.equal(state.maxScroll, 0);
});
test('serialized guest function has no host closure dependencies and malformed state remains finite', () => {
  const guest = vm.runInNewContext('(' + decide.toString() + ')');
  const state = guest(input(), { version: 1, pending: true, stagnantObservations: NaN, observations: Infinity, scrollCommands: 'oops' });
  for (const key of ['actualDelta', 'observations', 'stagnantObservations', 'scrollCommands', 'target', 'requestedDelta']) assert.ok(Number.isFinite(state[key]), key);
});
