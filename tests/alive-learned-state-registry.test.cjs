'use strict';

// Generic descriptor fixtures only: no claim about the application's catalog,
// replay cold-start allocation, native imports, startup or process continuity.
const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const codec = require('../systems/alive-learned-state-codec.js');
const moduleUnderTest = require('../systems/alive-learned-state-registry.js');
const options = { codec, crypto: webcrypto };
const path = name => ({ root: 'model', keys: [name] });
const scalar = (id, schema = { type: 'f64' }) => ({ id, componentId: 'core', role: 'state', paths: [path(id)], schemaVersion: 1, required: true, schema });
const tensor = (id, dtype = 'Float32Array', n = 2) => ({ id, componentId: 'core', role: 'parameter', paths: [path(id)], dtype, dimensions: [n], backingGroup: id, backingOffset: 0, backingByteLength: n * globalThis[dtype].BYTES_PER_ELEMENT, policy: { format: 'native', finite: true } });
function definition() {
  const weight = tensor('weights'); weight.paths.push(path('alias'));
  return { registryVersion: 1, components: [{ id: 'core', schemaVersion: 1, implementationDigest: 'a'.repeat(64), present: true }],
    tensors: [weight, tensor('moments', 'Float64Array')], states: [scalar('bias'), scalar('step', { type: 'i53', min: 0 })], families: [],
    resumeRules: [{ id: 'authority', action: 'reset', reason: 'Fresh browser authority', version: 1 }] };
}
const snapshot = () => ({ creatureId: 'fixture', policyId: 'policy', checkpointId: 'checkpoint', logicalTick: 19, modelEpoch: 7, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' });
function roots(source = false) {
  const weights = new Float32Array(source ? [-0, 1.401298464324817e-45] : [3, 4]);
  return { model: { weights, alias: weights, moments: new Float64Array(source ? [-0, Number.MIN_VALUE] : [5, 6]), bias: source ? -0 : 8, step: source ? 42 : 0 } };
}
const hex = view => Buffer.from(view.buffer, view.byteOffset, view.byteLength).toString('hex');
const state = r => ({ weights: hex(r.model.weights), moments: hex(r.model.moments), bias: r.model.bias, step: r.model.step });
const roundtrip = captured => codec.encode(captured, options).then(json => codec.decode(json, options));
async function fixture(def = definition(), source = roots(true)) {
  const registry = await moduleUnderTest.compile(def, options);
  const captured = registry.capture(source, snapshot(), { generation: 2 });
  return { registry, source, captured, decoded: await roundtrip(captured) };
}
function restore(f, target, generation = 2) {
  const prepared = f.registry.preflight(f.decoded, target, { generation });
  return f.registry.apply(prepared, target, { generation });
}
function replayDefinition() {
  const d = definition();
  d.states.push(scalar('count', { type: 'i53', min: 0, max: 3 }), scalar('indices', { type: 'array', items: { type: 'i53', min: 0, max: 2 }, maxLength: 3, unique: true }), scalar('cursor', { type: 'i53', min: 0, max: 2 }));
  const obs = tensor('obs'); delete obs.componentId; obs.paths = [['obs']];
  const reward = scalar('reward'); delete reward.componentId; reward.paths = [['reward']];
  d.families.push({ id: 'replay', componentId: 'core', capacity: 3, slotPath: path('slots'), countStateId: 'count', indicesStateId: 'indices', cursorStateId: 'cursor', tensors: [obs], states: [reward] });
  return d;
}
function replayRoots(source = false, indices = [2, 0]) {
  const r = roots(source);
  Object.assign(r.model, { count: indices.length, indices: indices.slice(), cursor: 1, slots: Array.from({ length: 3 }, (_, i) => ({ obs: new Float32Array(source ? [i + 0.25, -i] : [8, 9]), reward: source ? i / 3 : -4 })) });
  return r;
}

test('exact typed bits, aliases, negative zero and optimizer scalars restore with readback', async () => {
  const f = await fixture(), target = roots(), view = target.model.weights, moments = target.model.moments;
  assert.equal(restore(f, target).readbackVerified, true);
  assert.deepEqual(state(target), state(f.source));
  assert.equal(target.model.weights, view); assert.equal(target.model.alias, view); assert.equal(target.model.moments, moments);
  assert.ok(Object.is(target.model.bias, -0)); assert.ok(Object.is(target.model.weights[0], -0));
});

test('capture owns bytes and scalar tags before asynchronous encoding', async () => {
  const registry = await moduleUnderTest.compile(definition(), options), source = roots(true), expected = state(source);
  const captured = registry.capture(source, snapshot(), { generation: 2 });
  source.model.weights.fill(11); source.model.moments.fill(12); source.model.bias = 13; source.model.step = 14;
  const decoded = await roundtrip(captured), target = roots(); restore({ registry, decoded }, target);
  assert.deepEqual(state(target), expected);
});

test('fingerprint covers static family schemas and not empty, partial or wrapped occupancy', async () => {
  const registry = await moduleUnderTest.compile(replayDefinition(), options);
  const captures = [[], [0], [2, 0], [1, 2, 0]].map(indices => registry.capture(replayRoots(true, indices), snapshot(), { generation: 2 }));
  assert.equal(new Set(captures.map(c => c.architecture.fingerprint)).size, 1);
  assert.deepEqual(captures.map(c => c.tensors.length), [2, 3, 4, 5]);
  assert.deepEqual(captures[2].tensors.map(r => r.id), ['moments', 'replay/0/obs', 'replay/2/obs', 'weights']);
  const changed = replayDefinition(); changed.families[0].capacity = 4;
  assert.notEqual((await moduleUnderTest.compile(changed, options)).architecture.fingerprint, registry.architecture.fingerprint);
  const order = replayDefinition(); order.tensors.reverse(); order.states.reverse();
  assert.equal((await moduleUnderTest.compile(order, options)).architecture.fingerprint, registry.architecture.fingerprint);
});

test('preallocated replay restore follows declared indices and preserves unoccupied slots', async () => {
  const f = await fixture(replayDefinition(), replayRoots(true)), target = replayRoots(false, []), untouched = hex(target.model.slots[1].obs), original = target.model.slots[2].obs;
  restore(f, target);
  assert.deepEqual(target.model.indices, [2, 0]); assert.equal(target.model.count, 2); assert.equal(target.model.cursor, 1);
  for (const i of [0, 2]) { assert.equal(hex(target.model.slots[i].obs), hex(f.source.model.slots[i].obs)); assert.equal(target.model.slots[i].reward, f.source.model.slots[i].reward); }
  assert.equal(target.model.slots[2].obs, original); assert.equal(hex(target.model.slots[1].obs), untouched);
});

test('missing replay slots reject explicitly before any parameter or scalar write', async () => {
  const f = await fixture(replayDefinition(), replayRoots(true)), target = replayRoots(false, []), before = state(target);
  delete target.model.slots[2];
  assert.throws(() => f.registry.preflight(f.decoded, target, { generation: 2 }), /unsupported-allocation/);
  assert.deepEqual(state(target), before); assert.deepEqual(target.model.indices, []);
});

test('inconsistent count, duplicate indices and out-of-range cursor cannot capture', async () => {
  const registry = await moduleUnderTest.compile(replayDefinition(), options);
  for (const change of [r => r.model.count++, r => r.model.indices = [0, 0], r => r.model.cursor = 3]) {
    const r = replayRoots(true); change(r);
    assert.throws(() => registry.capture(r, snapshot(), { generation: 2 }));
  }
});

test('validly rehashed incomplete or excessive instance rosters reject without writes', async () => {
  const f = await fixture(replayDefinition(), replayRoots(true)), target = replayRoots(false, []), before = state(target);
  const missing = { ...f.captured, tensors: f.captured.tensors.filter(t => t.id !== 'replay/2/obs') };
  const missingDecoded = await roundtrip(missing);
  assert.throws(() => f.registry.preflight(missingDecoded, target, { generation: 2 }), /roster/);
  const empty = f.registry.capture(replayRoots(true, []), snapshot(), { generation: 2 });
  const excessive = { ...empty, tensors: f.captured.tensors };
  const excessiveDecoded = await roundtrip(excessive);
  assert.throws(() => f.registry.preflight(excessiveDecoded, target, { generation: 2 }), /roster/);
  assert.deepEqual(state(target), before);
});

test('private decoded capsule and prepared plan ignore public mirror mutation', async () => {
  const f = await fixture(), target = roots(), expected = state(f.source);
  new Uint8Array(f.decoded.tensors[0].bytes).fill(0xff); f.decoded.stateValues.bias = codec.float64(900);
  const prepared = f.registry.preflight(f.decoded, target, { generation: 2 });
  for (const t of f.decoded.tensors) new Uint8Array(t.bytes).fill(0);
  f.decoded.stateValues.step = codec.integer(123);
  assert.ok(Object.isFrozen(prepared)); assert.throws(() => prepared.generation = 999, TypeError);
  f.registry.apply(prepared, target, { generation: 2 }); assert.deepEqual(state(target), expected);
  assert.throws(() => f.registry.apply(prepared, target, { generation: 2 }), /stale/);
  assert.throws(() => f.registry.preflight({ ...f.decoded }, target, { generation: 2 }), /verified|decode|handle/i);
});

test('generation, root, equal-shape view and own-data descriptor replacement all reject before writes', async () => {
  const f = await fixture();
  for (const mode of ['generation', 'root', 'view', 'accessor', 'nested-root']) {
    const target = roots(), prepared = f.registry.preflight(f.decoded, target, { generation: 2 }); let calls = 0;
    if (mode === 'view') target.model.weights = target.model.alias = new Float32Array([7, 8]);
    if (mode === 'nested-root') target.model = { ...target.model };
    if (mode === 'accessor') Object.defineProperty(target.model, 'bias', { configurable: true, get() { calls++; return 8; } });
    const beforeWeights = hex(target.model.weights), beforeMoments = hex(target.model.moments), beforeStep = target.model.step;
    assert.throws(() => f.registry.apply(prepared, mode === 'root' ? { model: target.model } : target, { generation: mode === 'generation' ? 3 : 2 }), /stale/);
    assert.equal(hex(target.model.weights), beforeWeights); assert.equal(hex(target.model.moments), beforeMoments); assert.equal(target.model.step, beforeStep); assert.equal(calls, 0);
  }
});

test('numeric target changes after preflight are rejected rather than overwritten', async () => {
  const f = await fixture(), target = roots(), prepared = f.registry.preflight(f.decoded, target, { generation: 2 });
  target.model.weights[1] = 27; const before = state(target);
  assert.throws(() => f.registry.apply(prepared, target, { generation: 2 }), /changed since preflight/); assert.deepEqual(state(target), before);
});

test('declared object aliases and tensor references preserve identity; nested edits invalidate plans', async () => {
  const d = definition(), s = scalar('memory', { type: 'object', fields: { previous: { type: 'f64' }, weights: { type: 'tensor', id: 'weights' } } });
  s.paths.push(path('memoryAlias')); d.states.push(s);
  const source = roots(true); source.model.memory = source.model.memoryAlias = { previous: -0, weights: source.model.weights };
  const f = await fixture(d, source), target = roots(); target.model.memory = target.model.memoryAlias = { previous: 2, weights: target.model.weights };
  const prepared = f.registry.preflight(f.decoded, target, { generation: 2 });
  target.model.memory.previous = 3; const before = state(target);
  assert.throws(() => f.registry.apply(prepared, target, { generation: 2 }), /changed since preflight/); assert.deepEqual(state(target), before);
  restore(f, target); assert.equal(target.model.memory, target.model.memoryAlias); assert.equal(target.model.memory.weights, target.model.weights); assert.ok(Object.is(target.model.memory.previous, -0));
});

test('unregistered shared state objects and nested cycles are explicitly rejected', async () => {
  const d = definition(), schema = { type: 'object', fields: { x: { type: 'f64' } } }; d.states.push(scalar('a', schema), scalar('b', schema));
  const registry = await moduleUnderTest.compile(d, options), r = roots(); r.model.a = r.model.b = { x: 1 };
  assert.throws(() => registry.capture(r, snapshot(), { generation: 2 }), /alias or cycle/);
});

test('own getters and collection size shadows are never invoked', async () => {
  let calls = 0; const d = definition(); d.states.push(scalar('history', { type: 'map', keys: { type: 'string', maxLength: 20 }, values: { type: 'f64' }, maxEntries: 4 }));
  const registry = await moduleUnderTest.compile(d, options), r = roots(); r.model.history = new Map([['x', 1]]);
  Object.defineProperty(r.model.history, 'size', { get() { calls++; return 1; } });
  assert.throws(() => registry.capture(r, snapshot(), { generation: 2 }), /map bound/); assert.equal(calls, 0);
  r.model.history = new Map(); Object.defineProperty(r.model, 'bias', { get() { calls++; return 1; } });
  assert.throws(() => registry.capture(r, snapshot(), { generation: 2 }), /accessor/); assert.equal(calls, 0);
});

test('Map, Set and bounded BigInt scalars round trip without numeric coercion', async () => {
  const d = definition(); d.states.push(scalar('history', { type: 'map', keys: { type: 'string', maxLength: 20 }, values: { type: 'f64' }, maxEntries: 4 }), scalar('flags', { type: 'set', items: { type: 'i53' }, maxEntries: 4 }), scalar('rng', { type: 'bigint', signed: false, bits: 64 }));
  const source = roots(true); Object.assign(source.model, { history: new Map([['b', -0], ['a', 0.25]]), flags: new Set([2, 1]), rng: 0xffffffffffffffffn });
  const f = await fixture(d, source), target = roots(); Object.assign(target.model, { history: new Map(), flags: new Set(), rng: 0n }); restore(f, target);
  assert.deepEqual([...target.model.history], [...source.model.history]); assert.ok(Object.is(target.model.history.get('b'), -0)); assert.deepEqual([...target.model.flags], [2, 1]); assert.equal(target.model.rng, source.model.rng);
});

test('declared overlapping views restore a consistent backing and reject contradictory payloads', async () => {
  const d = definition(); d.tensors = [tensor('left'), tensor('right')];
  for (const row of d.tensors) { row.backingGroup = 'shared'; row.backingByteLength = 12; }
  d.tensors[1].backingOffset = 4;
  function shared(values) { const full = new Float32Array(values); return { model: { left: new Float32Array(full.buffer, 0, 2), right: new Float32Array(full.buffer, 4, 2), bias: 0, step: 0 } }; }
  const f = await fixture(d, shared([1, 2, 3])), target = shared([8, 9, 10]); restore(f, target);
  assert.deepEqual([...target.model.left], [1, 2]); assert.deepEqual([...target.model.right], [2, 3]);
  const invalid = f.registry.capture(f.source, snapshot(), { generation: 2 }); new Float32Array(invalid.tensors.find(t => t.id === 'right').bytes)[0] = 99;
  const before = hex(target.model.left);
  await assert.rejects(roundtrip(invalid), /inconsistent overlapping tensor bytes/); assert.equal(hex(target.model.left), before);
  const detached = shared([1, 2, 3]); detached.model.right = new Float32Array(new ArrayBuffer(12), 4, 2);
  assert.throws(() => f.registry.preflight(f.decoded, detached, { generation: 2 }), /backing alias topology/);
});

test('Float16 and BFloat16 bit policies reject encoded NaN/Infinity while preserving subnormal and negative zero', async () => {
  for (const format of ['f16', 'bf16']) {
    const d = definition(); d.tensors = [tensor('half', 'Uint16Array', 3)]; d.tensors[0].policy = { format, finite: true };
    const source = { model: { half: new Uint16Array([0x8000, 1, format === 'f16' ? 0x3c00 : 0x3f80]), bias: 0, step: 0 } };
    const f = await fixture(d, source), target = { model: { half: new Uint16Array(3), bias: 1, step: 1 } }; restore(f, target); assert.equal(hex(target.model.half), hex(source.model.half));
    for (const bits of format === 'f16' ? [0x7c00, 0x7e00] : [0x7f80, 0x7fc0]) {
      source.model.half[0] = bits; assert.throws(() => f.registry.capture(source, snapshot(), { generation: 2 }), /numeric policy/);
    }
    d.tensors[0].policy.finite = false; const permissive = await moduleUnderTest.compile(d, options);
    assert.doesNotThrow(() => permissive.capture(source, snapshot(), { generation: 2 }));
    d.tensors[0].policy.min = 0; const ranged = await moduleUnderTest.compile(d, options);
    assert.throws(() => ranged.capture(source, snapshot(), { generation: 2 }), /numeric policy/);
  }
});

test('64-bit integer tensor bounds use BigInt and preserve all bits', async () => {
  const d = definition(); d.tensors = [tensor('rng', 'BigUint64Array')]; d.tensors[0].policy = { format: 'native', finite: true, min: '0', max: '18446744073709551615' };
  const source = { model: { rng: new BigUint64Array([0xffffffffffffffffn, 0x8000000000000001n]), bias: 0, step: 0 } }, f = await fixture(d, source), target = { model: { rng: new BigUint64Array(2), bias: 0, step: 0 } };
  restore(f, target); assert.equal(hex(target.model.rng), hex(source.model.rng));
});

test('wrong scalar tags and negative-zero integer metadata reject without application', async () => {
  const f = await fixture(), wrong = { ...f.captured, stateValues: { ...f.captured.stateValues, step: codec.float64(42) }, stateManifest: f.captured.stateManifest.map(r => r.id === 'step' ? { ...r, valueType: 'f64' } : r) };
  const decoded = await roundtrip(wrong), target = roots(), before = state(target);
  assert.throws(() => f.registry.preflight(decoded, target, { generation: 2 }), /roster/); assert.deepEqual(state(target), before);
  target.model.step = -0; assert.throws(() => f.registry.capture(target, snapshot(), { generation: 2 }), /integer scalar/);
});

test('trusted compiler rejects callbacks, accessors, parent-container conflicts and unsafe shape declarations', async () => {
  const cases = [d => d.importState = () => {}, d => d.tensors[0].dimensions = [0, Number.MAX_SAFE_INTEGER], d => d.states.push(scalar('parent', { type: 'object', fields: {} })), d => d.tensors[0].paths[0].keys = ['constructor']];
  for (let i = 0; i < cases.length; i++) {
    const d = definition(); cases[i](d);
    if (i === 2) { d.states.at(-1).paths = [path('box')]; d.tensors[0].paths = [{ root: 'model', keys: ['box', 'weights'] }]; }
    await assert.rejects(moduleUnderTest.compile(d, options), i === 2 ? /overlapping state\/container paths/ : undefined);
  }
  let calls = 0; const d = definition(); Object.defineProperty(d, 'tensors', { get() { calls++; return []; } });
  await assert.rejects(moduleUnderTest.compile(d, options), /accessor/); assert.equal(calls, 0);
});

test('exported limitations prevent fixture qualification from claiming full application restore', () => {
  assert.equal(moduleUnderTest.scope.completeApplicationCatalog, false); assert.match(moduleUnderTest.scope.missingFamilySlots, /unsupported-allocation/);
  assert.match(moduleUnderTest.scope.nativeImports, /unsupported/); assert.match(moduleUnderTest.scope.resume, /not executed/);
});

test('custom array prototypes and overridden methods are rejected without running hooks', async () => {
  let calls = 0; const d = definition();
  const custom = Object.create(Array.prototype); custom.map = () => { calls++; throw new Error('hook'); };
  Object.setPrototypeOf(d.tensors, custom);
  await assert.rejects(moduleUnderTest.compile(d, options), /custom metadata array prototype/); assert.equal(calls, 0);
  const ownMethod = definition(); ownMethod.tensors.map = () => { calls++; };
  await assert.rejects(moduleUnderTest.compile(ownMethod, options), /sparse\/custom metadata arrays/); assert.equal(calls, 0);
  const registry = await moduleUnderTest.compile(replayDefinition(), options), source = replayRoots();
  Object.setPrototypeOf(source.model.slots, custom);
  assert.throws(() => registry.capture(source, snapshot(), { generation: 2 }), /unsupported-allocation/); assert.equal(calls, 0);
});

test('compiler copies caller descriptors before hashing and retains no mutable definition arrays', async () => {
  const d = definition(), pending = moduleUnderTest.compile(d, options);
  d.tensors[0].dimensions[0] = 100; d.states[0].schema.type = 'boolean'; d.resumeRules[0].reason = 'changed';
  const registry = await pending, target = roots();
  const capture = registry.capture(roots(true), snapshot(), { generation: 2 });
  assert.equal(capture.tensors.find(t => t.id === 'weights').length, 2); assert.equal(capture.resumeRules[0].reason, 'Fresh browser authority');
  restore({ registry, decoded: await roundtrip(capture) }, target); assert.equal(target.model.step, 42);
});

test('literal tensor-shaped objects remain data and cannot authorize a tensor reference', async () => {
  const d = definition();
  d.states.push(scalar('memory', { type: 'object', fields: { ref: { type: 'tensor', id: 'weights' } } }));
  const source = roots(true); source.model.memory = { ref: source.model.weights };
  const f = await fixture(d, source), target = roots(); target.model.memory = { ref: target.model.weights };
  const spoof = { ...f.captured, stateValues: { ...f.captured.stateValues,
    memory: codec.tagValue({ ref: { $type: 'tensor', id: 'weights' } }) } };
  const decodedSpoof = await roundtrip(spoof), before = state(target), beforeMemory = target.model.memory;
  assert.throws(() => f.registry.preflight(decodedSpoof, target, { generation: 2 }), /tag\/schema mismatch/);
  assert.deepEqual(state(target), before); assert.equal(target.model.memory, beforeMemory);
  restore(f, target); assert.equal(target.model.memory.ref, target.model.weights);

  const literalDefinition = definition(); literalDefinition.states.push(scalar('literal', { type: 'object', fields: { $type: { type: 'string', maxLength: 10 }, id: { type: 'string', maxLength: 20 } } }));
  const literalSource = roots(true); literalSource.model.literal = { $type: 'tensor', id: 'weights' };
  const literal = await fixture(literalDefinition, literalSource), literalTarget = roots(); literalTarget.model.literal = { $type: '', id: '' };
  restore(literal, literalTarget); assert.deepEqual(literalTarget.model.literal, literalSource.model.literal); assert.notEqual(literalTarget.model.literal, literalTarget.model.weights);
});
