'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const codec = require('../systems/alive-learned-state-codec.js');
const registry = require('../systems/alive-learned-state-registry.js');
const replay = require('../systems/alive-replay-state.js');
const options = { crypto: webcrypto };
const adapterPromise = replay.create({ registry, codec, ...options });
const snapshot = { creatureId: 'replay-test', policyId: 'policy', checkpointId: 'checkpoint', logicalTick: 19,
  modelEpoch: 3, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' };
const fields = [['z16', 16], ['a8', 8], ['zNext16', 16]];
function record(seed) {
  return { z16: Float32Array.from({ length: 16 }, (_, i) => seed + i / 32),
    a8: Float32Array.from({ length: 8 }, (_, i) => seed - i / 16),
    zNext16: Float32Array.from({ length: 16 }, (_, i) => seed + i / 64), surprise: seed + .123456789012345 };
}
function hub(count, cursor = count % 32, seed = 1) {
  return { replayRing32: Array.from({ length: count }, (_, i) => record(seed + i)), replayWritePtr: cursor, unrelated: 8 };
}
function bits(value) { return Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('hex'); }
function float64(value) { const bytes = Buffer.alloc(8); bytes.writeDoubleLE(value); return bytes.toString('hex'); }
function evidence(value) {
  return { count: value.replayRing32.length, cursor: value.replayWritePtr,
    slots: value.replayRing32.map(item => ({ tensors: fields.map(([name]) => bits(item[name])), surprise: float64(item.surprise) })) };
}
async function decoded(adapter, source) {
  return codec.decode(await codec.encode(adapter.capture(source, snapshot, { generation: 7 }), options), options);
}
async function wireFromCapture(capture) { return codec.decode(await codec.encode(capture, options), options); }

test('static family architecture supports empty, partial, full and wrapped occupancy without dummy rows', async () => {
  const adapter = await adapterPromise, fingerprints = [];
  for (const [count, cursor] of [[0, 0], [1, 1], [17, 17], [32, 0], [32, 23]]) {
    const source = hub(count, cursor), ring = source.replayRing32;
    const captured = adapter.capture(source, snapshot, { generation: 7 });
    fingerprints.push(captured.architecture.fingerprint);
    assert.equal(captured.tensors.length, count * 3); assert.equal(captured.stateManifest.length, count + 3);
    assert.equal(captured.tensors.reduce((sum, item) => sum + item.bytes.byteLength, 0), count * 160);
    assert.equal(source.replayRing32, ring); assert.equal(ring.length, count);
    const actual = await wireFromCapture(captured), validation = adapter.validate(actual);
    assert.equal(validation.count, count); assert.equal(validation.cursor, cursor); assert.equal(validation.tensorBytes, count * 160);
    assert.deepEqual(codec.untagValue(actual.stateValues.indices), Array.from({ length: count }, (_, i) => i));
  }
  assert.equal(new Set(fingerprints).size, 1);
  assert.equal(adapter.scope.completeApplicationCatalog, false);
  assert.equal(replay.CAPACITY, 32);
});

test('capture owns exact signed-zero/subnormal bytes and Float64 priority before caller mutation', async () => {
  const adapter = await adapterPromise, source = hub(2);
  new Uint32Array(source.replayRing32[0].z16.buffer).set([0x80000000, 1, 0x80000001]);
  source.replayRing32[0].surprise = -0; source.replayRing32[1].surprise = -2.125;
  const expected = evidence(source), captured = adapter.capture(source, snapshot, { generation: 7 });
  source.replayRing32[0].z16.fill(99); source.replayRing32[0].surprise = 99; source.replayRing32.length = 0; source.replayWritePtr = 0;
  const target = hub(0), handle = await wireFromCapture(captured), plan = adapter.preflight(handle, target, { generation: 7 });
  adapter.apply(plan, target, { generation: 7 });
  assert.deepEqual(evidence(target), expected); assert.ok(Object.is(target.replayRing32[0].surprise, -0));
});

test('detached preparation never pads or changes the live ring across empty/partial/full transitions', async () => {
  const adapter = await adapterPromise;
  for (const [from, to, cursor] of [[0, 0, 0], [0, 32, 5], [32, 0, 0], [3, 19, 19], [32, 4, 4], [2, 32, 31]]) {
    const source = hub(to, cursor), target = hub(from, from % 32, -20), before = evidence(target), old = target.replayRing32;
    const handle = await decoded(adapter, source), plan = adapter.preflight(handle, target, { generation: 7 });
    assert.ok(Object.isFrozen(plan)); assert.equal(target.replayRing32, old); assert.deepEqual(evidence(target), before);
    assert.equal(adapter.recheck(plan, target, { generation: 7 }).status, 'ready');
    const receipt = adapter.apply(plan, target, { generation: 7 });
    assert.equal(receipt.status, 'applied'); assert.equal(receipt.readbackVerified, true);
    assert.equal(receipt.count, to); assert.equal(receipt.cursor, cursor); assert.equal(receipt.tensorBytes, to * 160);
    assert.notEqual(target.replayRing32, old); assert.deepEqual(evidence(target), evidence(source));
    assert.equal(target.replayRing32.length, to); assert.equal(Object.keys(target.replayRing32).length, to);
    assert.equal(old.length, from, 'even the retained old ring remains untouched');
    for (let i = 0; i < to; i++) for (const [name] of fields) assert.notEqual(target.replayRing32[i][name], source.replayRing32[i][name]);
  }
});

test('capture rejects holes, invalid cursor, extra fields, accessors and invalid own-data targets without invoking getters', async () => {
  const adapter = await adapterPromise;
  const cases = [h => { h.replayWritePtr = 1; }, h => { h.replayWritePtr = -0; }, h => { delete h.replayRing32[0]; },
    h => { h.replayRing32.length = 33; }, h => { h.replayRing32.extra = true; }, h => { h.replayRing32[0].extra = true; },
    h => { h.replayRing32[0].surprise = Infinity; }, h => { h.replayRing32[0].surprise = '1'; },
    h => { Object.defineProperty(h, 'replayWritePtr', { writable: false }); }, h => { Object.setPrototypeOf(h.replayRing32, null); }];
  for (const mutate of cases) { const target = hub(2); mutate(target); assert.throws(() => adapter.capture(target, snapshot, { generation: 7 }), /Replay state/); }
  let calls = 0;
  for (const where of ['hub', 'index', 'field']) {
    const target = hub(2), accessor = { configurable: true, get() { calls++; throw Error('must not run'); } };
    if (where === 'hub') Object.defineProperty(target, 'replayRing32', accessor);
    if (where === 'index') Object.defineProperty(target.replayRing32, '0', accessor);
    if (where === 'field') Object.defineProperty(target.replayRing32[0], 'z16', accessor);
    assert.throws(() => adapter.capture(target, snapshot, { generation: 7 }), /own-data/);
  }
  assert.equal(calls, 0);
});

test('actual source records reject duplicate objects, duplicated/overlapping backings and unsupported tensors before projection', async () => {
  const adapter = await adapterPromise;
  const bad = [h => { h.replayRing32[1] = h.replayRing32[0]; },
    h => { h.replayRing32[1].z16 = h.replayRing32[0].z16; },
    h => { h.replayRing32[1].z16 = new Float32Array(h.replayRing32[0].z16.buffer); },
    h => { h.replayRing32[0].a8 = new Float32Array(h.replayRing32[0].z16.buffer, 0, 8); },
    h => { h.replayRing32[0].z16 = new Float32Array(new SharedArrayBuffer(64)); },
    h => { h.replayRing32[0].z16 = new Float32Array(new ArrayBuffer(64, { maxByteLength: 128 })); },
    h => { const view = h.replayRing32[0].z16; structuredClone(view.buffer, { transfer: [view.buffer] }); },
    h => { h.replayRing32[0].z16 = new Float64Array(16); }, h => { h.replayRing32[0].z16[0] = NaN; },
    h => { h.replayRing32[0].z16.custom = true; },
    h => { h.zPrev16 = h.replayRing32[0].z16; },
    h => { h.lastAction8 = new Float32Array(h.replayRing32[0].a8.buffer); },
    h => { h.directDataView = new DataView(h.replayRing32[0].zNext16.buffer); }];
  for (const mutate of bad) { const source = hub(2); mutate(source); assert.throws(() => adapter.capture(source, snapshot, { generation: 7 }), /Replay state/); }
});

test('self-consistent but incomplete/excessive/altered instance rosters and occupancy fail before live writes', async () => {
  const adapter = await adapterPromise;
  const variants = [c => { c.tensors.pop(); }, c => { c.stateManifest.pop(); delete c.stateValues['replay/1/surprise']; },
    c => { c.stateValues.count = codec.integer(1); c.stateValues.indices = codec.tagValue([0]); },
    c => { c.stateValues.cursor = codec.integer(1); }, c => { c.stateValues.indices = codec.tagValue([1, 0]); },
    c => { c.stateValues.count = codec.float64(2); c.stateManifest.find(row => row.id === 'count').valueType = 'f64'; },
    c => { const row = c.tensors[0]; c.tensors.push({ ...row, id: 'replay/9/a8', backingGroup: 'replay/9/a8', paths: [{ root: 'replay', keys: ['slots', '9', 'a8'] }], bytes: row.bytes.slice(0) }); },
    c => { c.tensors[0].dimensions = [2, 4]; }];
  for (const mutate of variants) {
    const captured = adapter.capture(hub(2), snapshot, { generation: 7 }); mutate(captured);
    const target = hub(1), old = target.replayRing32, before = evidence(target);
    const handle = await wireFromCapture(captured);
    assert.throws(() => adapter.preflight(handle, target, { generation: 7 }));
    assert.equal(target.replayRing32, old); assert.deepEqual(evidence(target), before);
  }
});

test('private verified capsule controls occupancy and bytes despite mutable public mirrors', async () => {
  const adapter = await adapterPromise, source = hub(3), expected = evidence(source), handle = await decoded(adapter, source);
  handle.stateValues.count = codec.integer(32); handle.stateValues.cursor = codec.integer(31); handle.stateValues.indices = codec.tagValue([31]);
  handle.architecture.fingerprint = '0'.repeat(64); handle.stateManifest.length = 0;
  handle.tensors.forEach(row => new Uint8Array(row.bytes).fill(255)); handle.tensors.length = 0;
  assert.equal(adapter.validate(handle).count, 3);
  const target = hub(0), plan = adapter.preflight(handle, target, { generation: 7 });
  adapter.apply(plan, target, { generation: 7 }); assert.deepEqual(evidence(target), expected);
  for (const forged of [{ ...handle }, {}, JSON.parse(JSON.stringify(handle))]) assert.throws(() => adapter.validate(forged), /decoder-issued/);
});

test('all destination identities, descriptor attributes and original bytes/scalars are rechecked before publication', async () => {
  const adapter = await adapterPromise, handle = await decoded(adapter, hub(3));
  const mutations = [h => { h.replayRing32 = h.replayRing32.slice(); }, h => { h.replayRing32[0] = { ...h.replayRing32[0] }; },
    h => { h.replayRing32[0].z16 = h.replayRing32[0].z16.slice(); }, h => { h.replayRing32[0].z16[2] += .5; },
    h => { h.replayRing32[0].surprise += .5; }, h => { Object.defineProperty(h.replayRing32[0], 'surprise', { enumerable: false }); },
    h => { Object.defineProperty(h, 'replayRing32', { enumerable: false }); }, h => { h.replayRing32.push(record(100)); h.replayWritePtr = 3; },
    h => { Object.setPrototypeOf(h.replayRing32[0], null); }];
  for (const mutate of mutations) {
    const target = hub(2), plan = adapter.preflight(handle, target, { generation: 7 }); mutate(target);
    const before = evidence(target), ring = target.replayRing32;
    assert.throws(() => adapter.apply(plan, target, { generation: 7 }), /changed since preflight/);
    assert.equal(target.replayRing32, ring); assert.deepEqual(evidence(target), before);
  }
  const target = hub(2), plan = adapter.preflight(handle, target, { generation: 7 });
  target.unrelated = 19;
  assert.throws(() => adapter.recheck(plan, { ...target }, { generation: 7 }), /stale or foreign/);
  assert.throws(() => adapter.apply(plan, target, { generation: 8 }), /stale or foreign/);
  assert.equal(adapter.recheck(plan, target, { generation: 7 }).status, 'ready');
  adapter.apply(plan, target, { generation: 7 }); assert.equal(target.unrelated, 19);
});

test('prepared records are private, disposable and single-use', async () => {
  const adapter = await adapterPromise, target = hub(0), handle = await decoded(adapter, hub(1));
  const discarded = adapter.preflight(handle, target, { generation: 7 });
  assert.equal(Object.hasOwn(discarded, 'candidate'), false); assert.equal(adapter.discard(discarded), true);
  assert.equal(adapter.discard(discarded), false); assert.throws(() => adapter.apply(discarded, target, { generation: 7 }), /stale or foreign/);
  const plan = adapter.preflight(handle, target, { generation: 7 });
  assert.throws(() => { plan.count = 31; }, TypeError);
  adapter.apply(plan, target, { generation: 7 });
  assert.equal(adapter.discard(plan), false); assert.throws(() => adapter.recheck(plan, target, { generation: 7 }), /stale or foreign/);
  assert.throws(() => adapter.preflight(handle, target, { generation: -0 }), /generation/);
});

test('unexpected second-slot publication failure reports verified rollback; failed rollback is explicit partial application', async () => {
  // Proxy targets are outside the admitted contract. These traps are solely
  // fault injection into otherwise unthrowing own-data publication/rollback.
  const adapter = await adapterPromise, handle = await decoded(adapter, hub(3));
  for (const breakRollback of [false, true]) {
    const target = hub(1), old = target.replayRing32, before = evidence(target);
    let armed = false, cursorFailed = false;
    const injected = new Proxy(target, { defineProperty(object, key, value) {
      if (armed && key === 'replayWritePtr' && !cursorFailed) { cursorFailed = true; throw Error('injected publication failure'); }
      if (armed && breakRollback && cursorFailed && key === 'replayRing32') throw Error('injected rollback failure');
      return Reflect.defineProperty(object, key, value);
    } });
    const plan = adapter.preflight(handle, injected, { generation: 7 }); armed = true;
    assert.throws(() => adapter.apply(plan, injected, { generation: 7 }), error => error.rollbackVerified === !breakRollback && error.partialApplication === breakRollback);
    if (!breakRollback) { assert.equal(target.replayRing32, old); assert.deepEqual(evidence(target), before); }
    else assert.notEqual(target.replayRing32, old);
    assert.throws(() => adapter.apply(plan, injected, { generation: 7 }), /stale or foreign/);
  }
});
