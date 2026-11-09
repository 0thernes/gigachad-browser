'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { collect, create } = require('../systems/alive-tensor-evidence.js');

test('inspects exact copied values and changed bytes with no invented update count', async () => {
  const weights = Float32Array.of(-2, 0, 2, 4), owner = { weights, alias: weights };
  let yields = 0;
  const inspector = create({ getRoots: () => ({ brain: owner }), sliceValues: 2, yieldTask: async () => { yields++; } });
  const first = await inspector.sample(), row = first.rows[0];
  assert.equal(first.rows.length, 1); assert.equal(row.finite, 4); assert.equal(row.nonzero, 3);
  assert.equal(row.mean, 1); assert.equal(row.rms, Math.sqrt(6)); assert.equal(row.changed, null);
  assert.equal(row.changedValues, null); assert.ok(yields >= 2);
  assert.deepEqual(row.aliases, ['brain.alias']);
  weights[1] = 1;
  const second = await inspector.sample();
  assert.equal(second.rows[0].changed, true); assert.equal(second.rows[0].mean, 1.25);
  assert.equal((await inspector.sample()).rows[0].changed, false);
});

test('capture does not call getters, reports bounds, keeps separate typed interpretations', () => {
  let called = false;
  const f = new Float32Array(4), root = { f, bytes: new Uint8Array(f.buffer), tooLarge: new Float32Array(100) };
  Object.defineProperty(root, 'secret', { get() { called = true; throw Error('getter'); } });
  const capture = collect({ root }, { maxBytes: 64 });
  assert.equal(called, false); assert.equal(capture.tensors.length, 2); assert.equal(capture.omitted, 1);
  f[0] = 3; assert.equal(capture.tensors[0].values[0], 0);
});

test('records nonfinite cells and owns the capture before yielding', async () => {
  const a = Float64Array.of(NaN, Infinity, -1, 3);
  const inspector = create({ getRoots: () => ({ a }), sliceValues: 1, yieldTask: async () => { a.fill(50); } });
  const row = (await inspector.sample()).rows[0];
  assert.equal(row.finite, 2); assert.equal(row.mean, 1); assert.deepEqual(row.sample, ['NaN', 'Infinity', -1, 3]);
});

test('finite Float64 extremes retain representable mean and RMS', async () => {
  const a = Float64Array.of(1e308, 1e308), b = Float64Array.of(-1e308, 1e308);
  const inspector = create({ getRoots: () => ({ a, b }) });
  const rows = (await inspector.sample()).rows;
  assert.equal(rows[0].mean, 1e308); assert.equal(rows[0].rms, 1e308);
  assert.equal(rows[1].mean, 0); assert.equal(rows[1].rms, 1e308);
});

test('typed-array overrides and own getters cannot execute or supply live aliases', () => {
  let callbacks = 0;
  const a = Float32Array.of(1);
  Object.defineProperty(a, 'slice', { value() { callbacks++; return this; } });
  for (const key of ['length', 'buffer', 'byteOffset', 'byteLength', Symbol.toStringTag]) {
    Object.defineProperty(a, key, { get() { callbacks++; throw Error('application getter'); } });
  }
  const captured = collect({ a }); a[0] = 9;
  assert.equal(callbacks, 0); assert.equal(captured.tensors[0].values[0], 1);
  assert.equal(captured.tensors[0].dtype, 'Float32Array');
});

test('large ordinary arrays have bounded descriptor visits and report omissions', () => {
  const list = new Array(200000).fill(0); let lateGetter = false;
  Object.defineProperty(list, 150000, { get() { lateGetter = true; throw Error('late getter'); } });
  const capture = collect({ list, weights: Float32Array.of(3) }, { maxProperties: 32 });
  assert.equal(lateGetter, false); assert.equal(capture.omitted, 1);
  assert.equal(capture.tensors[0].values[0], 3);
});
