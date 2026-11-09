'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { install, sourceNames, maxResidual } = require('../systems/alive-specialist-fusion');
const close = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

function fixture() {
  const obsVec = new Float64Array(16);
  obsVec.set([0.25, -0.5, 0.2, 0.2, 0.2, 0.2, 0.2, 0, 0.6, 0.8, 0.3, 0, 0.4, -0.2, 0, 0]);
  const model = { D_OBS: 16, simulationTick: 7, obsVec,
    predObsVec: Float64Array.from(obsVec, value => value + 0.1),
    W_actor: new Float64Array(80) };
  model.W_actor.fill(0.1, 0, 16); model.W_actor.fill(-0.15, 16, 32);
  const fw = { pfnSteering: new Float64Array([0.7, -0.4]) }, api = install(model);
  return { model, fw, api, capture: () => api.capture(model, fw) };
}

test('installation is idempotent and nonenumerable without adding checkpoint tensors or mutating source weights', () => {
  const f = fixture(), keys = Object.keys(f.model), weights = Array.from(f.model.W_actor);
  assert.equal(install(f.model), f.api);
  assert.equal(Object.getOwnPropertyDescriptor(f.model, 'aliveSpecialistFusion').enumerable, false);
  assert.equal(JSON.stringify(f.model).includes('aliveSpecialistFusion'), false);
  assert.equal(Reflect.ownKeys(f.api).length, 4);
  f.capture(); f.api.fuse(sourceNames, [1, 1, 1, 1, 1], 7);
  assert.deepEqual(Object.keys(f.model), keys);
  assert.deepEqual(Array.from(f.model.W_actor), weights);
  const separate = install({});
  assert.equal(separate.capture(f.model, f.fw), true, 'diagnostics can capture a supplied model without modifying it');
});

test('all five readouts use the requested existing numerical sources and exactly two motor rows', () => {
  const f = fixture(); assert.equal(f.capture(), true);
  const reads = f.api.snapshot().sources;
  assert.deepEqual(reads.map(source => source.name), sourceNames);
  assert.ok(reads.every(source => source.available));
  const expected = [[0.1, -0.15], [0.16, -0.24], [0.7, -0.4], [0.02, -0.03], [0.17, -0.255]];
  for (let s = 0; s < 5; s++) for (let axis = 0; axis < 2; axis++) close(reads[s].readout[axis], Math.tanh(expected[s][axis]));
  const before = Array.from(f.model.predObsVec);
  f.api.fuse(sourceNames, [1, 1, 1, 1, 1], 7);
  assert.deepEqual(Array.from(f.model.predObsVec), before);
});

test('finite positive selected scores normalize independently of unselected scores and duplicate names', () => {
  const f = fixture(); f.capture();
  const residual = Array.from(f.api.fuse([sourceNames[0], sourceNames[2], sourceNames[0]], [1, 999, 3, 999, 999], 7));
  const snapshot = f.api.snapshot();
  assert.deepEqual(snapshot.sources.map(source => source.gate), [0.25, 0, 0.75, 0, 0]);
  assert.deepEqual(snapshot.selectedNames, [sourceNames[0], sourceNames[2]]);
  close(residual[0], 0.08 * (0.25 * Math.tanh(0.1) + 0.75 * Math.tanh(0.7)));
  close(residual[1], 0.08 * (0.25 * Math.tanh(-0.15) + 0.75 * Math.tanh(-0.4)));
});

test('each selected source causally changes motor bias; unselected-source perturbations do not enter fusion', () => {
  const changes = [f => { f.model.obsVec[2] += 0.5; }, f => { f.model.predObsVec[0] += 0.5; },
    f => { f.fw.pfnSteering[0] += 0.5; }, f => { f.model.obsVec[12] += 0.5; }, f => { f.model.obsVec[8] += 0.5; }];
  for (let source = 0; source < 5; source++) {
    const f = fixture(); f.capture();
    const before = Array.from(f.api.fuse([sourceNames[source]], [1, 1, 1, 1, 1], 7));
    changes[source](f); f.capture();
    const after = Array.from(f.api.fuse([sourceNames[source]], [1, 1, 1, 1, 1], 7));
    assert.notEqual(after[0], before[0], `source ${source} has a causal residual`);
    assert.notEqual(Math.fround(Math.tanh(0.1 + after[0])), Math.fround(Math.tanh(0.1 + before[0])));
  }
  const f = fixture(); f.capture();
  const flywireOnly = Array.from(f.api.fuse([sourceNames[2]], [1, 1, 1, 1, 1], 7));
  f.model.obsVec.fill(900); f.model.predObsVec.fill(-900); f.model.W_actor.fill(200);
  f.capture();
  assert.deepEqual(Array.from(f.api.fuse([sourceNames[2]], [1, 1, 1, 1, 1], 7)), flywireOnly);
});

test('changing only selection changes the applied motor result while empty and fully ablated fusion recover baseline exactly', () => {
  const f = fixture(); f.capture();
  const a = Array.from(f.api.fuse([sourceNames[0]], [1, 1, 1, 1, 1], 7));
  const b = Array.from(f.api.fuse([sourceNames[2]], [1, 1, 1, 1, 1], 7));
  assert.notDeepEqual(a, b);
  const logits = [0.23, -0.47];
  for (const [names, scores, mask] of [[[], [1, 1, 1, 1, 1]], [sourceNames, [0, 0, 0, 0, 0]],
    [sourceNames, [1, 1, 1, 1, 1], [false, false, false, false, false]]]) {
    const result = f.api.fuse(names, scores, 7, mask);
    assert.deepEqual(Array.from(result), [0, 0]);
    for (let axis = 0; axis < 2; axis++) assert.equal(Math.fround(Math.tanh(logits[axis] + result[axis])), Math.fround(Math.tanh(logits[axis])));
  }
});

test('diagnostic ablation removes exactly one contribution without changing gates or other sources', () => {
  const f = fixture(); f.capture();
  f.api.fuse(sourceNames, [1, 2, 3, 4, 5], 7);
  const before = f.api.snapshot();
  const mask = [true, true, false, true, true];
  f.api.fuse(sourceNames, [1, 2, 3, 4, 5], 7, mask);
  const after = f.api.snapshot();
  assert.deepEqual(after.sources.map(source => source.gate), before.sources.map(source => source.gate));
  assert.deepEqual(after.sources[2].contribution, [0, 0]);
  assert.equal(after.sources[2].diagnosticallyAblated, true);
  for (let axis = 0; axis < 2; axis++) close(before.sum[axis] - after.sum[axis], before.sources[2].contribution[axis]);
  for (let s = 0; s < 5; s++) if (s !== 2) assert.deepEqual(after.sources[s], before.sources[s]);
  f.api.fuse(sourceNames, [1, 2, 3, 4, 5], 7);
  assert.deepEqual(f.api.snapshot().sum, before.sum, 'diagnostic mask does not persist into ordinary fusion');
});

test('invalid and overflowing readouts are unavailable and cannot dilute valid selected gates', () => {
  const f = fixture();
  f.model.obsVec[2] = NaN; f.model.obsVec[12] = Infinity; f.fw.pfnSteering[1] = NaN;
  f.capture(); f.api.fuse(sourceNames, [1, 1, 1, 1, 1], 7);
  let snapshot = f.api.snapshot();
  assert.deepEqual(snapshot.sources.map(source => source.available), [false, false, false, false, true]);
  assert.deepEqual(snapshot.sources.map(source => source.gate), [0, 0, 0, 0, 1]);
  assert.ok(snapshot.sources.filter(source => !source.available).every(source => source.readout.every(value => value === 0)));
  f.model.obsVec.fill(Number.MAX_VALUE); f.model.W_actor.fill(Number.MAX_VALUE);
  assert.equal(f.capture(), false);
  assert.deepEqual(Array.from(f.api.fuse(sourceNames, [1, 1, 1, 1, 1], 7)), [0, 0]);
  const partial = install({});
  assert.equal(partial.capture({ simulationTick: 1 }, { pfnSteering: [0.2, -0.2] }), true);
  partial.fuse(sourceNames, [1, 1, 1, 1, 1], 1);
  assert.deepEqual(partial.snapshot().sources.map(source => source.gate), [0, 0, 1, 0, 0]);
});

test('adversarial scores stay bounded and finite with no invented score fallback', () => {
  const f = fixture(); f.capture();
  for (const scores of [[NaN, Infinity, -1, '3', null], null, {}, new Float64Array(5),
    [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE], [1e-320, 0, 0, 0, 1e308]]) {
    const result = f.api.fuse(sourceNames, scores, 7);
    assert.ok(Array.from(result).every(value => Number.isFinite(value) && Math.abs(value) <= maxResidual));
    assert.ok(f.api.snapshot().sources.every(source => Number.isFinite(source.gate) && source.gate >= 0 && source.gate <= 1));
  }
  assert.deepEqual(Array.from(f.api.fuse(sourceNames, [NaN, Infinity, -1, '3', null], 7)), [0, 0]);
  f.api.fuse(sourceNames, new Float64Array(5).fill(Number.MAX_VALUE), 7);
  for (const source of f.api.snapshot().sources) close(source.gate, 0.2);
  assert.deepEqual(Array.from(f.api.fuse(['unknown', null, {}, 1], [1, 1, 1, 1, 1], 7)), [0, 0]);
});

test('stale or missing captures and invalid masks fail closed and clear prior motor attribution', () => {
  const f = fixture();
  assert.deepEqual(Array.from(f.api.fuse(sourceNames, [1, 1, 1, 1, 1], 7)), [0, 0]);
  f.capture();
  const residual = f.api.fuse(sourceNames, [1, 1, 1, 1, 1], 7);
  f.api.recordMotor(0, 0.2, Math.fround(Math.tanh(0.2 + residual[0])), 7);
  assert.equal(f.api.snapshot().appliedMotor.recorded[0], true);
  assert.deepEqual(Array.from(f.api.fuse(sourceNames, [1, 1, 1, 1, 1], 8)), [0, 0]);
  assert.equal(f.api.snapshot().tick, null);
  assert.deepEqual(f.api.snapshot().appliedMotor.recorded, [false, false]);
  assert.deepEqual(Array.from(f.api.fuse(sourceNames, [1, 1, 1, 1, 1], 7, [true])), [0, 0]);
  assert.equal(f.api.capture({ simulationTick: NaN }, {}), false);
  assert.equal(f.api.snapshot().capturedTick, null);
  assert.ok(f.api.snapshot().rejections >= 4);
});

test('snapshot copies cannot mutate private readouts, gates, contributions or motor receipts; output storage is reused', () => {
  const f = fixture(); f.capture();
  const output = f.api.fuse(sourceNames, [1, 1, 1, 1, 1], 7);
  const original = f.api.snapshot();
  const copy = f.api.snapshot();
  copy.sources[0].readout[0] = 100; copy.sources[0].gate = 100; copy.sources[0].contribution[0] = 100;
  copy.sources[0].available = false; copy.selectedNames.length = 0; copy.residual[0] = 100; copy.sum[1] = 100;
  copy.appliedMotor.actions[0] = 100; copy.appliedMotor.recorded[0] = true;
  assert.deepEqual(f.api.snapshot(), original);
  output.fill(100);
  assert.equal(f.api.fuse(sourceNames, [1, 1, 1, 1, 1], 7), output);
  assert.deepEqual(f.api.snapshot().residual, original.residual);
});

test('motor receipts record actual Float32 results with same-tick baseline and expose mismatches honestly', () => {
  const f = fixture(); f.capture();
  const residual = f.api.fuse(sourceNames, [1, 1, 1, 1, 1], 7);
  const logits = [0.17, -0.21], actions = new Float32Array(2);
  for (let axis = 0; axis < 2; axis++) {
    actions[axis] = Math.tanh(logits[axis] + residual[axis]);
    assert.equal(f.api.recordMotor(axis, logits[axis], actions[axis], 7), true);
  }
  const receipt = f.api.snapshot().appliedMotor;
  assert.equal(receipt.tick, 7);
  assert.deepEqual(receipt.actions, Array.from(actions));
  assert.deepEqual(receipt.baselineActions, logits.map(value => Math.fround(Math.tanh(value))));
  assert.deepEqual(receipt.recorded, [true, true]); assert.deepEqual(receipt.matchesFusion, [true, true]);
  assert.equal(f.api.recordMotor(2, 0, 0, 7), false);
  assert.equal(f.api.recordMotor(0, 0, 0, 8), false);
  assert.equal(f.api.recordMotor(0, NaN, 0, 7), false);
  assert.equal(f.api.recordMotor(0, 0, 2, 7), false);
  assert.equal(f.api.recordMotor(0, 0, 0, 7), true);
  assert.equal(f.api.snapshot().appliedMotor.matchesFusion[0], false);
  f.capture();
  assert.equal(f.api.snapshot().appliedMotor.tick, null);
  assert.deepEqual(f.api.snapshot().appliedMotor.recorded, [false, false]);
});
