'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Worker } = require('node:worker_threads');
const codec = require('../systems/alive-genome-codec.js');
const learnedCodec = require('../systems/alive-learned-state-codec.js');
const { webcrypto } = require('node:crypto');
const { AuthenticAsmodensiusAdapter: Adapter } = require('../systems/authentic-asmodensius-adapter.js');
const authenticSource = require('../systems/generated/authentic-asmodensius.js');

// Read the live source closure over every developmental slot's complete source
// region. Do not consult the adapter's cached table, capture, or export methods.
function sourceDevelopmentAffinity(adapter) {
  const org = adapter._creature.o, rows = [];
  for (const [edge, projection] of org.devSlots) {
    const post = org.syn.post[edge];
    if (rows.some(row => row.projection === projection && row.post === post)) continue;
    let start = 0, count = 0;
    for (const [, regionSize] of authenticSource.REGIONS) {
      if (org.syn.pre[edge] < start + regionSize) { count = regionSize; break; }
      start += regionSize;
    }
    assert.ok(count > 0, 'every developmental source has a known region');
    const values = [];
    for (let pre = start; pre < start + count; pre++) values.push(org.devAff(projection, pre, post));
    assert.ok(values.every(value => Number.isFinite(value) && value >= 0 && value <= 2));
    rows.push({ projection, post, start, values });
  }
  assert.ok(rows.length > 0, 'the oracle must exercise actual developmental affinity domains');
  return rows;
}

// Independent envelope oracle, including the full actual affinity equivalence
// table. The no-affinity option retains the pre-upgrade byte contract explicitly.
function referenceAuthenticEnvelope(adapter, { includeAffinity = true } = {}) {
  const sets = [];
  for (const part of ['affect', 'bus', 'selfM', 'curv', 'neo']) for (const field of ['off', 'ctl']) {
    if (adapter._creature.o[part] && adapter._creature.o[part][field] instanceof Set) {
      sets.push({ part, field, values: Array.from(adapter._creature.o[part][field]) });
    }
  }
  const state = { seed: adapter.seed,
    profile: { mind: 'v40', entropy: 'seeded', substrate: 'synthetic', noise: 'quantum', access: 'all' },
    elapsedMs: adapter.elapsedMs, paused: adapter.paused, input: Array.from(adapter.lastInput),
    motor: Array.from(adapter.motor2D), native: adapter._creature.snapshot(), sets
  };
  if (includeAffinity) state.developmentAffinity = sourceDevelopmentAffinity(adapter);
  const payload = JSON.stringify(state, (_key, value) => Object.is(value, -0) ? { $number: '-0' } : value);
  if (payload.length > 8 * 1024 * 1024) throw new Error('Authentic checkpoint exceeds 8 MiB; state was not saved');
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) hash = Math.imul(hash ^ payload.charCodeAt(i), 16777619) >>> 0;
  return { schema: 'gigachad.authentic-asmodensius.state.v1', sourceDigest: authenticSource.sourceDigest,
    checksum: hash.toString(16).padStart(8, '0'), payload };
}
const legacyAuthenticEnvelope = adapter => referenceAuthenticEnvelope(adapter, { includeAffinity: false });
const sensoryInput = tick => Float64Array.from({ length: 16 }, (_, index) => .5 + .5 * Math.sin((tick + 1) * (index + 1) * .031));

test('numeric markers preserve the legacy toFixed conversion and JSON representation exactly', () => {
  const values = [0, -0, 1.005, -1.005, 1.23456789, -0.00001, 1e21, Number.MAX_VALUE, NaN, Infinity, -Infinity];
  for (const digits of [0, 2, 4, 6, 12, 100]) {
    for (const typed of [values, Float32Array.from(values), Float64Array.from(values)]) {
      const expected = JSON.stringify({ label: 'genome', weights: Array.from(typed).map(v => Number(v.toFixed(digits))), nested: { unmarked: new Uint8Array([3, 4]) } });
      const payload = { label: 'genome', weights: codec.numericArray(typed, digits), nested: { unmarked: new Uint8Array([3, 4]) } };
      assert.equal(codec.encode(payload), expected);
      assert.equal(codec.encode(structuredClone(payload)), expected, 'plain markers survive structured clone');
    }
  }
});

test('codec preserves plain payload JSON and rounding errors rather than silently changing data', () => {
  const payload = { string: 'hello', omitted: undefined, value: null, list: [1, undefined, NaN], date: new Date('2020-01-01T00:00:00Z') };
  assert.equal(codec.encode(payload), JSON.stringify(payload));
  assert.throws(() => codec.encode(codec.numericArray([1], 101)), RangeError);
  assert.throws(() => codec.encode(codec.numericArray([1n], 4)), TypeError);
  const cycle = {}; cycle.self = cycle;
  assert.throws(() => codec.encode(cycle), TypeError);
});

function serializerWorker(t) {
  const filename = require.resolve('../systems/alive-genome-codec.js');
  // A minimal browser-worker bridge exercises the same module on an actual
  // separate Node thread. Application code still uses a standard Web Worker.
  const worker = new Worker(`
    const { parentPort } = require('node:worker_threads');
    globalThis.importScripts = filename => {
      if (filename !== 'alive-learned-state-codec.js') throw Error('Unexpected worker import');
      require(${JSON.stringify(require.resolve('../systems/alive-learned-state-codec.js'))});
    };
    globalThis.postMessage = message => parentPort.postMessage(message);
    globalThis.addEventListener = (name, callback) => {
      if (name === 'message') parentPort.on('message', data => callback({ data }));
    };
    require(${JSON.stringify(filename)});
  `, { eval: true });
  t.after(() => worker.terminate());
  function exchange(message) {
    return new Promise((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); worker.off('error', onError); worker.off('message', onMessage); };
      const onError = error => { cleanup(); reject(error); };
      const onMessage = response => { cleanup(); resolve(response); };
      const timer = setTimeout(() => { cleanup(); reject(new Error('serializer worker timeout')); }, 5000);
      worker.once('error', onError);
      worker.once('message', onMessage);
      try { worker.postMessage(message); }
      catch (error) { cleanup(); reject(error); }
    });
  }
  return { worker, exchange };
}

test('real worker direct messages isolate every snapshot from repeated later model and ordinary-array mutations', async t => {
  const { worker, exchange } = serializerWorker(t);
  const live = new Float64Array([1.123456, 2.345678]);
  const payload = { values: codec.numericArray(live, 4), alias: codec.numericArray(live.subarray(1), 6),
    epoch: { tick: 42, ordinary: [1, [2, 3]], label: 'initial' } };
  for (let iteration = 0; iteration < 5; iteration++) {
    const expected = codec.encode(payload);
    const promise = exchange({ id: 17 + iteration, payload });
    assert.equal(live.byteLength, 16, 'postMessage never detaches the original');
    for (let change = 0; change < 1000; change++) {
      live[change % 2] += .125;
      payload.epoch.tick++;
      payload.epoch.ordinary[0]++;
      payload.epoch.ordinary[1][change % 2] -= .5;
      payload.epoch.label = 'mutation ' + change;
    }
    const response = await promise;
    assert.ok(worker.threadId > 0);
    assert.equal(response.id, 17 + iteration);
    assert.equal(response.json, expected);
    assert.ok(Number.isFinite(response.serializationMs) && response.serializationMs >= 0);
    assert.equal(response.error, undefined);
  }
});

test('worker encoding errors return a bounded error for the corresponding job', async t => {
  const { exchange } = serializerWorker(t);
  const response = await exchange({ id: 23, payload: { values: codec.numericArray([1n], 4) } });
  assert.equal(response.id, 23);
  assert.equal(response.json, undefined);
  assert.equal(typeof response.error, 'string');
  assert.ok(response.error.length > 0 && response.error.length <= 300);
  assert.ok(response.serializationMs >= 0);
});

test('authentic capture performs no formatting or model advancement and preserves complete independent envelope bytes', () => {
  const adapter = new Adapter({ seed: 17 });
  for (let tick = 0; tick < 8; tick++) adapter.step(sensoryInput(tick));
  adapter.advance(73, sensoryInput(8));
  const expected = referenceAuthenticEnvelope(adapter);
  const originalFormatter = codec.formatAuthenticState;
  codec.formatAuthenticState = () => { throw new Error('Capture must not encode'); };
  let captured;
  try { captured = adapter.captureStatePayload(); }
  finally { codec.formatAuthenticState = originalFormatter; }
  assert.equal(adapter._creature.t(), 8);
  assert.deepEqual(Object.keys(captured), ['seed', 'profile', 'elapsedMs', 'paused', 'input', 'motor', 'native', 'sets', 'developmentAffinity']);
  assert.deepEqual(captured.developmentAffinity, sourceDevelopmentAffinity(adapter));
  assert.equal(JSON.stringify(codec.formatAuthenticState(captured, Adapter.sourceDigest)), JSON.stringify(expected));
  assert.equal(JSON.stringify(adapter.exportState()), JSON.stringify(expected));
  assert.equal(referenceAuthenticEnvelope(adapter).payload, expected.payload, 'capture does not consume RNG or change native state');
});

test('real worker authentic envelope parity and exact continuation cover initialization and learned states', async t => {
  const { exchange } = serializerWorker(t);
  for (const ticks of [0, 1, 100, 1500]) {
    const original = new Adapter({ seed: 17 });
    for (let tick = 0; tick < ticks; tick++) original.step(sensoryInput(tick));
    original.advance(73, sensoryInput(ticks));
    original.setPaused(ticks === 100);
    const expected = referenceAuthenticEnvelope(original);
    const payload = { epoch: ticks, weights: codec.numericArray(new Float64Array([1.234567]), 5),
      authenticAsmodensius: codec.authenticState(original.captureStatePayload(), Adapter.sourceDigest) };
    const response = await exchange({ id: 100 + ticks, payload });
    assert.equal(response.error, undefined);
    assert.equal(response.json, JSON.stringify({ epoch: ticks, weights: [1.23457], authenticAsmodensius: expected }));
    const restored = new Adapter({ seed: 999 });
    assert.equal(restored.importState(JSON.parse(response.json).authenticAsmodensius), true, restored.lastError);
    assert.equal(restored.elapsedMs, original.elapsedMs);
    assert.equal(restored.paused, original.paused);
    original.setPaused(false); restored.setPaused(false);
    for (let tick = ticks; tick < ticks + 20; tick++) { original.step(sensoryInput(tick)); restored.step(sensoryInput(tick)); }
    assert.equal(referenceAuthenticEnvelope(restored).payload, referenceAuthenticEnvelope(original).payload, 'complete native state, affinity and RNG continuation at tick ' + ticks);
  }
});

test('no-affinity legacy import retains its exact old capture, formatter and worker envelope', async t => {
  const { exchange } = serializerWorker(t);
  const original = new Adapter({ seed: 17 });
  for (let tick = 0; tick < 8; tick++) original.step(sensoryInput(tick));
  original.advance(73, sensoryInput(8));
  const expected = legacyAuthenticEnvelope(original);
  assert.equal(Object.hasOwn(JSON.parse(expected.payload), 'developmentAffinity'), false);
  const restored = new Adapter({ seed: 999 });
  assert.equal(restored.importState(expected), true, restored.lastError);
  const captured = restored.captureStatePayload();
  assert.deepEqual(Object.keys(captured), ['seed', 'profile', 'elapsedMs', 'paused', 'input', 'motor', 'native', 'sets']);
  assert.deepEqual(codec.formatAuthenticState(captured, Adapter.sourceDigest), expected);
  assert.deepEqual(restored.exportState(), expected);
  const response = await exchange({ id: 180, payload: codec.authenticState(captured, Adapter.sourceDigest) });
  assert.equal(response.error, undefined);
  assert.equal(response.json, JSON.stringify(expected));
  assert.deepEqual(legacyAuthenticEnvelope(restored), expected);
});

test('worker-restored developmental affinity drives exact forced refinement and continued learning', async t => {
  const { exchange } = serializerWorker(t);
  const original = new Adapter({ seed: 17 });
  for (let tick = 0; tick < 12; tick++) original.step(sensoryInput(tick));
  original._creature.o.devTarget = original._creature.o.devSlots.length;
  const expected = referenceAuthenticEnvelope(original);
  const response = await exchange({ id: 181, payload: codec.authenticState(original.captureStatePayload(), Adapter.sourceDigest) });
  assert.equal(response.error, undefined);
  assert.equal(response.json, JSON.stringify(expected));
  const restored = new Adapter({ seed: 999 });
  assert.equal(restored.importState(JSON.parse(response.json)), true, restored.lastError);
  assert.deepEqual(sourceDevelopmentAffinity(restored), sourceDevelopmentAffinity(original));
  let originalLookups = 0, restoredLookups = 0;
  const originalAffinity = original._creature.o.devAff, restoredAffinity = restored._creature.o.devAff;
  original._creature.o.devAff = (...args) => { originalLookups++; return originalAffinity(...args); };
  restored._creature.o.devAff = (...args) => { restoredLookups++; return restoredAffinity(...args); };
  const priorSprouts = original._creature.o.devStats.sprouted;
  for (let tick = 12; tick < 52; tick++) {
    original._creature.o.devRefine(); restored._creature.o.devRefine();
    original.step(sensoryInput(tick)); restored.step(sensoryInput(tick));
    assert.equal(JSON.stringify(restored._creature.snapshot()), JSON.stringify(original._creature.snapshot()),
      'complete native graph, development and RNG continuation at tick ' + tick);
    assert.deepEqual(restored.readout().motor8, original.readout().motor8);
  }
  assert.ok(originalLookups > 0, 'forced refinement must consume the original affinity closure');
  assert.equal(restoredLookups, originalLookups, 'restored refinement must consume the same saved domain');
  assert.ok(original._creature.o.devStats.sprouted > priorSprouts, 'the exercised path must actually rewire developmental edges');
  assert.equal(referenceAuthenticEnvelope(restored).payload, referenceAuthenticEnvelope(original).payload);
});

test('worker envelope retains negative zero, UTF-16 Unicode checksum and collection order under later live mutations', async t => {
  const { exchange } = serializerWorker(t);
  const adapter = new Adapter({ seed: 31 });
  adapter.step(sensoryInput(0));
  adapter.lastInput[0] = -0; adapter.motor2D[1] = -0; adapter._creature.o.rate[0] = -0;
  adapter._creature.o.events.push('Unicode \u03c0 \ud83d\ude00 e\u0301');
  adapter._creature.o.affect.off.add('mood');
  adapter._creature.o.affect.off.add('trace-fixture');
  const expected = referenceAuthenticEnvelope(adapter);
  const captured = adapter.captureStatePayload();
  const promise = exchange({ id: 201, payload: { authenticAsmodensius: codec.authenticState(captured, Adapter.sourceDigest) } });
  adapter.step(sensoryInput(1)); adapter._creature.o.affect.off.add('later');
  adapter._creature.o.events.push('later event');
  assert.notEqual(captured.developmentAffinity, adapter._developmentAffinity);
  assert.notEqual(captured.developmentAffinity[0], adapter._developmentAffinity[0]);
  assert.notEqual(captured.developmentAffinity[0].values, adapter._developmentAffinity[0].values);
  adapter._developmentAffinity[0].values[0] += .125;
  adapter._developmentAffinity[0].post++;
  assert.equal(codec.formatAuthenticState(captured, Adapter.sourceDigest).payload, expected.payload, 'native capture is detached from later live changes');
  captured.input[0] = 123;
  captured.sets[0].values.push('capture changed after postMessage');
  captured.developmentAffinity[0].values[0] += .25;
  captured.developmentAffinity[0].start++;
  const response = await promise;
  const envelope = JSON.parse(response.json).authenticAsmodensius;
  assert.equal(JSON.stringify(envelope), JSON.stringify(expected));
  assert.notEqual(codec.formatAuthenticState(captured, Adapter.sourceDigest).payload, expected.payload, 'message copy also isolates later changes to the capture itself');
  const restored = new Adapter();
  assert.equal(restored.importState(envelope), true, restored.lastError);
  assert.ok(Object.is(restored.lastInput[0], -0));
  assert.ok(Object.is(restored.motor2D[1], -0));
  assert.ok(Object.is(restored._creature.o.rate[0], -0));
  assert.deepEqual(Array.from(restored._creature.o.affect.off), ['mood', 'trace-fixture']);
  assert.deepEqual(restored.captureStatePayload().developmentAffinity, sourceDevelopmentAffinity(restored));
  assert.equal(referenceAuthenticEnvelope(restored).payload, expected.payload);
});

test('worker rejects shared buffers in direct, nested, typed-view, Map, Set, and Error-cause positions before JSON', async t => {
  const { exchange } = serializerWorker(t);
  const shared = new SharedArrayBuffer(16);
  const cycle = {}; cycle.self = cycle; cycle.shared = new DataView(shared);
  const cases = [shared, { deep: [{ value: shared }] }, codec.numericArray(new Float64Array(shared), 4),
    new Map([[shared, 'key']]), new Map([['value', { shared }]]), new Set([new Uint8Array(shared)]),
    new Error('nested shared state', { cause: shared }), cycle,
    new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true })];
  for (let index = 0; index < cases.length; index++) {
    const response = await exchange({ id: 400 + index, payload: { value: cases[index] } });
    assert.equal(response.id, 400 + index);
    assert.equal(response.json, undefined, 'shared graph must never produce JSON: case ' + index);
    assert.match(response.error, /SharedArrayBuffer cannot provide an isolated worker snapshot/, 'case ' + index);
    assert.ok(Number.isFinite(response.serializationMs) && response.serializationMs >= 0);
  }
});

test('worker validates repeated and cyclic ordinary graph references without hanging and reports JSON cycle failure', async t => {
  const { exchange } = serializerWorker(t);
  const alias = { value: new Uint16Array([1, 2]) };
  const allowed = { one: alias, two: alias, map: new Map([['same', alias]]), set: new Set([alias]) };
  const response = await exchange({ id: 501, payload: allowed });
  assert.equal(response.error, undefined);
  assert.equal(response.json, codec.encode(allowed));
  const cyclic = { alias }; cyclic.self = cyclic;
  const failure = await exchange({ id: 502, payload: cyclic });
  assert.equal(failure.json, undefined);
  assert.match(failure.error, /circular|cyclic/i);
  assert.ok(failure.error.length <= 300);
  const recovered = await exchange({ id: 503, payload: { value: 1 } });
  assert.equal(recovered.json, '{"value":1}', 'one invalid graph does not break the worker event handler');
});

test('authentic formatter preserves the old UTF-16 length boundary and rejects oversized worker payloads', async t => {
  const { exchange } = serializerWorker(t);
  const limit = 8 * 1024 * 1024;
  const prefixLength = JSON.stringify({ text: '' }).length;
  const atLimit = { text: '\ud83d\ude00'.repeat((limit - prefixLength - 1) / 2) + 'x' };
  const envelope = codec.formatAuthenticState(atLimit, 'fixture-digest');
  assert.equal(envelope.payload.length, limit);
  assert.ok(Buffer.byteLength(envelope.payload, 'utf8') > limit, 'contract is string length, not UTF-8 bytes');
  const tooLarge = { text: atLimit.text + 'x' };
  assert.throws(() => codec.formatAuthenticState(tooLarge, 'fixture-digest'), /Authentic checkpoint exceeds 8 MiB; state was not saved/);
  const response = await exchange({ id: 301, payload: codec.authenticState(tooLarge, 'fixture-digest') });
  assert.equal(response.json, undefined);
  assert.equal(response.error, 'Authentic checkpoint exceeds 8 MiB; state was not saved');
});

test('standalone browser adapter keeps the synchronous export contract when the genome codec is absent', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const context = vm.createContext({ console, performance });
  vm.runInContext(fs.readFileSync(require.resolve('../systems/generated/authentic-asmodensius.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(require.resolve('../systems/authentic-asmodensius-adapter.js'), 'utf8'), context);
  const result = vm.runInContext(`
    const adapter = new AuthenticAsmodensiusAdapter({seed:17});
    adapter.step(new Float64Array(16).fill(.5));
    ({ envelope: adapter.exportState(), payload: adapter.captureStatePayload(), hasCodec: typeof AliveGenomeCodec !== 'undefined' });
  `, context);
  assert.equal(result.hasCodec, false);
  assert.equal(JSON.stringify(result.envelope), JSON.stringify(codec.formatAuthenticState(result.payload, Adapter.sourceDigest)));
});

async function primaryCapture() {
  const primary = require('../systems/alive-primary-policy-state.js');
  const registry = require('../systems/alive-learned-state-registry.js');
  const adapter = await primary.create({ registry, codec: learnedCodec, crypto: webcrypto });
  const h = { D_OBS: 16, D_ACT: 5, D_MORPH: 6 };
  const lengths = { W_actor: 80, W_metamorph: 30, W_critic: 16, W_world: 256, W_actor_frozen: 80, W_world_frozen: 256 };
  for (const [index, [key, length]] of Object.entries(lengths).entries()) {
    h[key] = Float32Array.from({ length }, (_, i) => (index + 1) / (i + 3));
    const bytes = new DataView(h[key].buffer);
    bytes.setUint32(0, 0x80000000, true); // Negative zero survives the exact path.
    bytes.setUint32(4, 1, true); // Least positive Float32 subnormal.
  }
  h.deepCortex = { W_actor: h.W_actor, W_critic: h.W_critic };
  return adapter.capture(h, { creatureId: 'codec-fixture', policyId: 'primary-policy', checkpointId: 'snapshot',
    logicalTick: 9, modelEpoch: 2, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' }, { generation: 2 });
}
function firstDigestBarrier() {
  let release, entered = false;
  const promise = new Promise(resolve => { release = resolve; });
  return { release, get entered() { return entered; }, crypto: { subtle: { async digest(algorithm, bytes) {
    if (!entered) { entered = true; await promise; }
    return webcrypto.subtle.digest(algorithm, bytes);
  } } } };
}

test('optional primary encoding snapshots legacy fields and all six exact tensor views before the first hash await', async () => {
  const captured = await primaryCapture(), expected = new Map(captured.tensors.map(row => [row.id, Buffer.from(row.bytes).toString('hex')]));
  const weights = new Float64Array([Math.PI, -0.00001]);
  const native = { counter: 4, negativeZero: -0, values: [1, 2] };
  const payload = { value: 12, weights: codec.numericArray(weights, 4), nested: { array: [3, 4] },
    authenticState: codec.authenticState(native, 'fixture'), primaryPolicyState: codec.primaryState(captured) };
  const expectedLegacy = codec.encode({ value: payload.value, weights: payload.weights, nested: payload.nested, authenticState: payload.authenticState });
  const barrier = firstDigestBarrier();
  const operation = codec.encodeAsync(payload, { learnedCodec, crypto: barrier.crypto });
  assert.equal(barrier.entered, true, 'capture and first digest happen before encodeAsync returns');
  payload.value = 999; weights.fill(42); payload.nested.array.push(9); native.values.push(10);
  for (const row of captured.tensors) new Uint8Array(row.bytes).fill(0);
  captured.snapshot.logicalTick = 999;
  barrier.release();
  const json = await operation, result = JSON.parse(json), wire = result.primaryPolicyState;
  delete result.primaryPolicyState;
  assert.equal(JSON.stringify(result), expectedLegacy);
  const decoded = await learnedCodec.decode(wire, { crypto: webcrypto });
  assert.equal(decoded.snapshot.logicalTick, 9);
  assert.equal(decoded.tensors.length, 6);
  for (const row of decoded.tensors) assert.equal(Buffer.from(row.bytes).toString('hex'), expected.get(row.id), row.id);
  assert.doesNotMatch(json, /__alive_genome_primary_state_v1__/);
});

test('sync legacy formatting stays identical, but pending primary markers cannot accidentally become persisted JSON', async () => {
  const legacy = { weights: codec.numericArray([Math.PI, -0, NaN], 5), ordinary: [1, 'two', null] };
  assert.equal(await codec.encodeAsync(legacy), codec.encode(legacy));
  const captured = await primaryCapture(), marker = codec.primaryState(captured);
  assert.throws(() => codec.encode({ primaryPolicyState: marker }), /asynchronous encoding/);
  assert.throws(() => codec.encode({ nested: marker }), /asynchronous encoding/);
  await assert.rejects(codec.encodeAsync({ primaryPolicyState: marker, toJSON() { return { primaryPolicyState: 'forged' }; } }), /replace its root/);
  const malformed = { primaryPolicyState: { ...marker, extra: true } };
  await assert.rejects(codec.encodeAsync(malformed), /Invalid primary/);
  const hidden = {}; Object.defineProperty(hidden, 'primaryPolicyState', { value: marker });
  await assert.rejects(codec.encodeAsync(hidden), /enumerable data field/);
});

test('async primary hash failure and cancellation reject without returning partial legacy-only JSON', async () => {
  const payload = { preserved: 1, primaryPolicyState: codec.primaryState(await primaryCapture()) };
  await assert.rejects(codec.encodeAsync(payload, { learnedCodec, crypto: { subtle: { digest() { throw Error('digest unavailable'); } } } }), /digest unavailable/);
  const controller = new AbortController(), barrier = firstDigestBarrier();
  const pending = codec.encodeAsync(payload, { learnedCodec, crypto: barrier.crypto, signal: controller.signal });
  controller.abort(); barrier.release();
  await assert.rejects(pending, /cancel|abort/i);
});

test('real serializer worker lazily loads the exact codec and preserves copied primary bytes under later live mutations', async t => {
  const captured = await primaryCapture(), expected = new Map(captured.tensors.map(row => [row.id, Buffer.from(row.bytes).toString('hex')]));
  const { exchange } = serializerWorker(t);
  const first = exchange({ id: 71, payload: { value: 8, primaryPolicyState: codec.primaryState(captured) } });
  for (const row of captured.tensors) new Uint8Array(row.bytes).fill(255);
  const result = await first;
  assert.equal(result.error, undefined); assert.equal(result.id, 71);
  const decoded = await learnedCodec.decode(JSON.parse(result.json).primaryPolicyState, { crypto: webcrypto });
  for (const row of decoded.tensors) assert.equal(Buffer.from(row.bytes).toString('hex'), expected.get(row.id), row.id);
  const legacy = await exchange({ id: 72, payload: { value: 9 } });
  assert.equal(legacy.json, '{"value":9}');
});

test('combined primary plus legacy JSON respects the UTF-8 32 MiB durable record bound', async () => {
  const payload = { text: '\u00e9'.repeat(16 * 1024 * 1024), primaryPolicyState: codec.primaryState(await primaryCapture()) };
  await assert.rejects(codec.encodeAsync(payload, { learnedCodec, crypto: webcrypto }), /32 MiB payload bound/);
});
