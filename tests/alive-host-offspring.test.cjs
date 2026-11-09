'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Execute the actual reconciliation block without starting models or Electron.
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = source.indexOf('// 5H. Render Procreated Offspring Colony Organisms in Viewport');
const end = source.indexOf('          for (let oi = 0; oi < st.viewportOffspring.length; oi++)', start);
assert.ok(start >= 0 && end > start, 'host offspring reconciliation is present');
const reconcile = new Function('st', 'h', 'alpha', 'Math', source.slice(start, end) + '\nreturn st.viewportOffspring;');
const fixedMath = Object.create(Math);
fixedMath.random = () => 0.75;
const spec = (id, extra = {}) => ({ offspringId: id, bodyCid: `body-${id}`, hue: 120, limbCount: 6, ...extra });
const sync = (state, colony) => reconcile(state, { offspringColony: colony }, { x: 100, y: 200 }, fixedMath);

test('replacement birth at the four-child cap replaces the visible identity', () => {
  const state = { viewportOffspring: [] };
  sync(state, ['a', 'b', 'c', 'd'].map(id => spec(id)));
  const retained = state.viewportOffspring.slice(1);
  const result = sync(state, ['b', 'c', 'd', 'e'].map(id => spec(id)));
  assert.deepEqual(result.map(off => off.id), ['b', 'c', 'd', 'e']);
  retained.forEach((off, i) => assert.equal(result[i], off));
  assert.equal(result[3].bodyCid, 'body-e');
  assert.equal(result[3].x, 122.5);
  assert.equal(result[3].y, 222.5);
  assert.equal(result[3].vx, 0.75);
  assert.equal(result[3].vy, 0.75);
});

test('unchanged identities preserve the array, object, and all motion while morphology updates', () => {
  const state = { viewportOffspring: [] };
  sync(state, [spec('a')]);
  const array = state.viewportOffspring, original = array[0];
  Object.assign(original, { x: 13, y: 17, vx: -2, vy: 3, angle: 2.4 });
  const result = sync(state, [spec('a', { hue: 0, limbCount: 12 })]);
  assert.equal(result, array);
  assert.equal(result[0], original);
  assert.deepEqual(result[0], { id: 'a', bodyCid: 'body-a', x: 13, y: 17, vx: -2, vy: 3, angle: 2.4, hue: 0, limbs: 12 });
});

test('same ID with a different body CID creates a new body rather than reusing stale motion', () => {
  const state = { viewportOffspring: [] };
  sync(state, [spec('a')]);
  const old = state.viewportOffspring[0];
  old.x = 999;
  const [replacement] = sync(state, [spec('a', { bodyCid: 'new-body', hue: 300, limbCount: 10 })]);
  assert.notEqual(replacement, old);
  assert.equal(replacement.bodyCid, 'new-body');
  assert.equal(replacement.x, 122.5);
  assert.equal(replacement.hue, 300);
  assert.equal(replacement.limbs, 10);
});

test('reordering and shrinking follow the live colony while retaining matching motion', () => {
  const state = { viewportOffspring: [] };
  sync(state, ['a', 'b', 'c'].map(id => spec(id)));
  const [a, , c] = state.viewportOffspring;
  assert.deepEqual(sync(state, [spec('c'), spec('a')]), [c, a]);
  assert.deepEqual(sync(state, []), []);
});

test('reconciliation leaves model specifications untouched and gives missing display values defaults', () => {
  const model = Object.freeze({ offspringId: 'a', bodyCid: 'body-a' });
  const state = { viewportOffspring: [] };
  const [body] = sync(state, Object.freeze([model]));
  assert.equal(body.hue, 120);
  assert.equal(body.limbs, 6);
  assert.deepEqual(model, { offspringId: 'a', bodyCid: 'body-a' });
});
