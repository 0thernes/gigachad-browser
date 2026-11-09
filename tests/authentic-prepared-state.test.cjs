'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { AuthenticAsmodensiusAdapter: Adapter } = require('../systems/authentic-asmodensius-adapter.js');

const context = extra => ({ ownerId: 'prepared-state-node', epoch: 4, generation: 7, ...extra });
const destinationFields = ['_creature', '_developmentAffinity', 'seed', 'elapsedMs', 'paused', 'lastInput', 'motor2D', 'status', 'lastError', 'lastStepDurationMs'];
const input = tick => Float64Array.from({ length: 16 }, (_, i) => .5 + .5 * Math.sin((tick + 1) * (i + 1) * .031));
const bytes = view => Buffer.from(view.buffer, view.byteOffset, view.byteLength).toString('hex');
const state = adapter => JSON.stringify(adapter.exportState());
function fixture(seed = 17) {
  const source = new Adapter({ seed }), target = new Adapter({ seed: 999 });
  for (let tick = 0; tick < 3; tick++) source.step(input(tick));
  target.step(input(9));
  return { source, target, envelope: source.exportState(), ctx: context() };
}
function rehash(envelope, edit) {
  const data = JSON.parse(envelope.payload); edit(data);
  const payload = JSON.stringify(data);
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) hash = Math.imul(hash ^ payload.charCodeAt(i), 16777619) >>> 0;
  return { ...envelope, payload, checksum: hash.toString(16).padStart(8, '0') };
}
function diagnostic(value, seen = new Set()) {
  if (value === null || ['undefined', 'string', 'number', 'boolean'].includes(typeof value)) return;
  assert.equal(typeof value, 'object', 'diagnostics cannot expose callbacks');
  assert.equal(ArrayBuffer.isView(value), false, 'diagnostics cannot expose model vectors');
  assert.equal(value instanceof ArrayBuffer, false, 'diagnostics cannot expose model buffers');
  assert.ok(Object.isFrozen(value), 'diagnostic objects must be immutable');
  assert.ok(!seen.has(value), 'diagnostic graph must be bounded acyclic metadata'); seen.add(value);
  assert.equal(Object.getOwnPropertySymbols(value).length, 0, 'no hidden symbol payload');
  for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    assert.ok(Object.hasOwn(desc, 'value'), 'diagnostics cannot expose getters');
    assert.doesNotMatch(key, /^(candidate|creature|_creature|native|payload|developmentAffinity|_developmentAffinity)$/);
    diagnostic(desc.value, seen);
  }
}

test('prepare is opaque, synchronous and read-only; public input mutations cannot change its private candidate', () => {
  const f = fixture(), before = state(f.target), expected = state(f.source);
  const handle = f.target.prepareImportState(f.envelope, f.ctx);
  diagnostic(handle); assert.equal(typeof handle.then, 'undefined');
  assert.equal(state(f.target), before);
  f.envelope.payload = '{}'; f.envelope.checksum = '00000000'; f.envelope.sourceDigest = 'changed';
  const ready = f.target.recheckPrepared(handle, f.ctx);
  diagnostic(ready); assert.equal(ready.status, 'ready'); assert.equal(state(f.target), before);
  const receipt = f.target.commitPrepared(handle, f.ctx);
  diagnostic(receipt); assert.equal(receipt.status, 'applied');
  assert.equal(state(f.target), expected);
  assert.throws(() => f.target.recheckPrepared(handle, f.ctx));
  assert.throws(() => f.target.commitPrepared(handle, f.ctx));
  assert.equal(state(f.target), expected);
});

test('unknown, copied, cloned, proxied and foreign handles reject without writes or hook execution', () => {
  const f = fixture(), handle = f.target.prepareImportState(f.envelope, f.ctx), before = state(f.target);
  const other = new Adapter({ seed: 31 }), otherBefore = state(other);
  let hooks = 0;
  const proxy = new Proxy(handle, { get() { hooks++; throw Error('untrusted handle property'); } });
  const invalid = [undefined, null, {}, { ...handle }, structuredClone(handle), proxy];
  for (const candidate of invalid) {
    assert.throws(() => f.target.recheckPrepared(candidate, f.ctx));
    assert.throws(() => f.target.commitPrepared(candidate, f.ctx));
    assert.equal(f.target.discardPrepared(candidate), false);
    assert.equal(state(f.target), before);
  }
  assert.throws(() => other.recheckPrepared(handle, f.ctx));
  assert.throws(() => other.commitPrepared(handle, f.ctx));
  assert.equal(other.discardPrepared(handle), false);
  assert.equal(state(other), otherBefore); assert.equal(hooks, 0);
  assert.equal(f.target.commitPrepared(handle, f.ctx).status, 'applied', 'invalid attempts must not consume the valid owner plan');
});

test('context mismatches reject without consuming the valid plan, including failed commits', () => {
  const f = fixture(), handle = f.target.prepareImportState(f.envelope, f.ctx), before = state(f.target);
  for (const wrong of [context({ ownerId: 'other-owner' }), context({ epoch: 5 }), context({ generation: 8 }),
    context({ epoch: -1 }), context({ generation: Number.MAX_SAFE_INTEGER + 1 }), {}, undefined]) {
    assert.throws(() => f.target.recheckPrepared(handle, wrong));
    assert.throws(() => f.target.commitPrepared(handle, wrong));
    assert.equal(state(f.target), before);
    assert.equal(f.target.recheckPrepared(handle, f.ctx).status, 'ready');
  }
  assert.equal(f.target.commitPrepared(handle, { ...f.ctx }).status, 'applied');
});

test('prepare rejects invalid context and native payload without altering live state', () => {
  const f = fixture(), before = state(f.target);
  for (const bad of [undefined, {}, context({ ownerId: '' }), context({ ownerId: 7 }), context({ epoch: -1 }),
    context({ epoch: .5 }), context({ generation: NaN }), context({ generation: Number.MAX_SAFE_INTEGER + 1 })]) {
    assert.throws(() => f.target.prepareImportState(f.envelope, bad)); assert.equal(state(f.target), before);
  }
  for (const bad of [{}, { ...f.envelope, sourceDigest: 'foreign-source' }, { ...f.envelope, checksum: '00000000' },
    rehash(f.envelope, data => { data.native.org.syn.pre.v[0] = 9999; })]) {
    assert.throws(() => f.target.prepareImportState(bad, f.ctx)); assert.equal(state(f.target), before);
  }
});

test('rehashed nonnumeric input and motor entries cannot coerce into native vectors through either import API', () => {
  const invalidValues = [{}, [], null, false, '0', 'not-a-number'];
  for (const field of ['input', 'motor']) for (const value of invalidValues) {
    const f = fixture(), before = state(f.target), creature = f.target._creature;
    const inputView = f.target.lastInput, motorView = f.target.motor2D;
    const inputBefore = bytes(inputView), motorBefore = bytes(motorView);
    const malformed = rehash(f.envelope, data => { data[field][0] = value; });
    const label = field + ': ' + JSON.stringify(value);
    const unchanged = () => {
      assert.equal(state(f.target), before, label);
      assert.equal(f.target._creature, creature, label);
      assert.equal(f.target.lastInput, inputView, label); assert.equal(f.target.motor2D, motorView, label);
      assert.equal(bytes(inputView), inputBefore, label); assert.equal(bytes(motorView), motorBefore, label);
    };
    assert.throws(() => f.target.prepareImportState(malformed, f.ctx), label);
    unchanged();
    assert.equal(f.target.importState(malformed), false, label);
    unchanged();
    assert.equal(typeof f.target.lastError, 'string', label);
    assert.ok(f.target.lastError.length > 0, label);
  }
});

test('every supported mutator invalidates earlier plans even when caller context stays unchanged', () => {
  const mutations = [
    ['step', a => a.step(input(4))], ['zero advance', a => a.advance(0, input(4))],
    ['fractional advance', a => a.advance(25, input(4))], ['unchanged pause', a => a.setPaused(false)],
    ['pause', a => a.setPaused(true)], ['successful import', (a, envelope) => assert.equal(a.importState(envelope), true)],
    ['failed import', a => assert.equal(a.importState({}), false)]
  ];
  for (const [label, mutate] of mutations) {
    const f = fixture(), handle = f.target.prepareImportState(f.envelope, f.ctx);
    mutate(f.target, f.envelope); const afterMutation = state(f.target);
    assert.throws(() => f.target.recheckPrepared(handle, f.ctx), label);
    assert.throws(() => f.target.commitPrepared(handle, f.ctx), label);
    assert.equal(state(f.target), afterMutation, label);
    const fresh = f.target.prepareImportState(f.envelope, f.ctx);
    assert.equal(f.target.commitPrepared(fresh, f.ctx).status, 'applied', label);
  }
});

test('a successful commit invalidates competing plans and discard is own-handle idempotent', () => {
  const f = fixture(), first = f.target.prepareImportState(f.envelope, f.ctx);
  const second = f.target.prepareImportState(f.envelope, f.ctx);
  assert.equal(f.target.commitPrepared(first, f.ctx).status, 'applied');
  const applied = state(f.target);
  assert.throws(() => f.target.recheckPrepared(second, f.ctx));
  assert.throws(() => f.target.commitPrepared(second, f.ctx)); assert.equal(state(f.target), applied);
  assert.equal(f.target.discardPrepared(first), false);
  const disposable = f.target.prepareImportState(f.envelope, f.ctx);
  assert.equal(f.target.discardPrepared(disposable), true);
  assert.equal(f.target.discardPrepared(disposable), false);
  assert.throws(() => f.target.recheckPrepared(disposable, f.ctx));
  assert.throws(() => f.target.commitPrepared(disposable, f.ctx)); assert.equal(state(f.target), applied);
});

test('commit preserves both public vector identities, backing aliases and exact negative-zero bits', () => {
  const f = fixture(); f.source.lastInput[0] = -0; f.source.motor2D[1] = -0;
  const inputView = f.target.lastInput, motorView = f.target.motor2D;
  const inputAlias = inputView.subarray(0, 2), motorAlias = new DataView(motorView.buffer, motorView.byteOffset, motorView.byteLength);
  const inputBuffer = inputView.buffer, motorBuffer = motorView.buffer;
  const handle = f.target.prepareImportState(f.source.exportState(), f.ctx);
  assert.equal(f.target.commitPrepared(handle, f.ctx).status, 'applied');
  assert.equal(f.target.lastInput, inputView); assert.equal(f.target.motor2D, motorView);
  assert.equal(inputView.buffer, inputBuffer); assert.equal(motorView.buffer, motorBuffer);
  assert.equal(bytes(inputView), bytes(f.source.lastInput)); assert.equal(bytes(motorView), bytes(f.source.motor2D));
  assert.ok(Object.is(inputAlias[0], -0));
  assert.equal(Buffer.from(motorAlias.buffer, motorAlias.byteOffset, motorAlias.byteLength).toString('hex'), bytes(f.source.motor2D));
  assert.ok(Object.is(motorView[1], -0));
});

test('shadowed vector set methods never execute during prepared commit', () => {
  const f = fixture(), handle = f.target.prepareImportState(f.envelope, f.ctx);
  let hooks = 0;
  f.target.lastInput.set = f.target.motor2D.set = () => { hooks++; throw Error('shadow set must not run'); };
  assert.equal(f.target.commitPrepared(handle, f.ctx).status, 'applied');
  assert.equal(hooks, 0); assert.equal(state(f.target), state(f.source));
});

test('ready and applied receipts use the privately prepared digest without reading mutable source exports', () => {
  const source = require('../systems/generated/authentic-asmodensius.js');
  const descriptor = Object.getOwnPropertyDescriptor(source, 'sourceDigest');
  const f = fixture(), expected = state(f.source), handle = f.target.prepareImportState(f.envelope, f.ctx);
  let getters = 0;
  try {
    Object.defineProperty(source, 'sourceDigest', { configurable: true, enumerable: descriptor.enumerable,
      get() { getters++; f.target.seed = 123456; throw Error('public source digest must not execute during commit'); } });
    const ready = f.target.recheckPrepared(handle, f.ctx);
    const applied = f.target.commitPrepared(handle, f.ctx);
    assert.equal(ready.status, 'ready'); assert.equal(applied.status, 'applied');
    assert.equal(getters, 0);
  } finally {
    Object.defineProperty(source, 'sourceDigest', descriptor);
  }
  assert.equal(state(f.target), expected);
});

test('changed destination identities and accessors reject before any live installation and without getters', () => {
  for (const field of destinationFields) {
    const f = fixture(), handle = f.target.prepareImportState(f.envelope, f.ctx), before = state(f.target);
    const descriptor = Object.getOwnPropertyDescriptor(f.target, field), creature = f.target._creature;
    const inputView = f.target.lastInput, motorView = f.target.motor2D, inputBefore = bytes(inputView), motorBefore = bytes(motorView);
    let getters = 0;
    Object.defineProperty(f.target, field, { configurable: true, enumerable: descriptor.enumerable,
      get() { getters++; throw Error('destination accessor'); } });
    assert.throws(() => f.target.recheckPrepared(handle, f.ctx), field);
    assert.throws(() => f.target.commitPrepared(handle, f.ctx), field);
    assert.equal(getters, 0, field);
    if (field !== '_creature') assert.equal(f.target._creature, creature, field);
    assert.equal(bytes(inputView), inputBefore, field); assert.equal(bytes(motorView), motorBefore, field);
    Object.defineProperty(f.target, field, descriptor);
    assert.equal(state(f.target), before, field);
    assert.equal(f.target.commitPrepared(handle, f.ctx).status, 'applied', 'failed checks do not consume the plan: ' + field);
  }
  for (const field of ['lastInput', 'motor2D']) {
    const f = fixture(), handle = f.target.prepareImportState(f.envelope, f.ctx), creature = f.target._creature;
    f.target[field] = f.target[field].slice(); const before = state(f.target);
    assert.throws(() => f.target.commitPrepared(handle, f.ctx));
    assert.equal(f.target._creature, creature); assert.equal(state(f.target), before);
  }
});

test('in-place public vector changes reject without consuming the plan and restoring exact bytes permits retry', () => {
  for (const field of ['lastInput', 'motor2D']) {
    const f = fixture(), handle = f.target.prepareImportState(f.envelope, f.ctx), creature = f.target._creature;
    const view = f.target[field], original = new Uint8Array(view.buffer, view.byteOffset, view.byteLength).slice();
    view[0] = Object.is(view[0], -0) ? 0 : -0;
    const changed = state(f.target);
    assert.throws(() => f.target.recheckPrepared(handle, f.ctx));
    assert.throws(() => f.target.commitPrepared(handle, f.ctx));
    assert.equal(f.target._creature, creature); assert.equal(state(f.target), changed);
    new Uint8Array(view.buffer, view.byteOffset, view.byteLength).set(original);
    assert.equal(f.target.recheckPrepared(handle, f.ctx).status, 'ready');
    assert.equal(f.target.commitPrepared(handle, f.ctx).status, 'applied');
    assert.equal(f.target[field], view); assert.equal(state(f.target), state(f.source));
  }
});

test('overlapping input and motor destinations reject while disjoint shared backing preserves every alias', () => {
  const rejected = fixture(), overlappingBuffer = new ArrayBuffer(144);
  rejected.target.lastInput = new Float64Array(overlappingBuffer, 0, 16);
  rejected.target.motor2D = new Float64Array(overlappingBuffer, 120, 2);
  const before = state(rejected.target), creature = rejected.target._creature;
  assert.throws(() => rejected.target.prepareImportState(rejected.envelope, rejected.ctx));
  assert.equal(rejected.target._creature, creature); assert.equal(state(rejected.target), before);

  const f = fixture(), buffer = new ArrayBuffer(160), all = new Float64Array(buffer);
  all.fill(.125); all[19] = .8125;
  const inputView = f.target.lastInput = new Float64Array(buffer, 0, 16);
  const motorView = f.target.motor2D = new Float64Array(buffer, 128, 2);
  const inputAlias = inputView.subarray(), motorAlias = new Float64Array(buffer, 128, 2);
  const handle = f.target.prepareImportState(f.envelope, f.ctx);
  assert.equal(f.target.commitPrepared(handle, f.ctx).status, 'applied');
  assert.equal(f.target.lastInput, inputView); assert.equal(f.target.motor2D, motorView);
  assert.equal(inputView.buffer, buffer); assert.equal(motorView.buffer, buffer);
  assert.equal(bytes(inputAlias), bytes(f.source.lastInput)); assert.equal(bytes(motorAlias), bytes(f.source.motor2D));
  assert.equal(all[18], .125); assert.equal(all[19], .8125, 'unrelated backing bytes remain unchanged');
  assert.equal(state(f.target), state(f.source));
});

test('every destination own-data descriptor flag is fenced before writes, including timing diagnostics', () => {
  for (const field of destinationFields) for (const flag of ['writable', 'enumerable', 'configurable']) {
    const f = fixture(), handle = f.target.prepareImportState(f.envelope, f.ctx), before = state(f.target);
    const descriptors = Object.fromEntries(destinationFields.map(name => [name, Object.getOwnPropertyDescriptor(f.target, name)]));
    Object.defineProperty(f.target, field, { ...descriptors[field], [flag]: !descriptors[field][flag] });
    assert.throws(() => f.target.recheckPrepared(handle, f.ctx), field + '.' + flag);
    assert.throws(() => f.target.commitPrepared(handle, f.ctx), field + '.' + flag);
    assert.equal(state(f.target), before, field + '.' + flag);
    for (const name of destinationFields) {
      const after = Object.getOwnPropertyDescriptor(f.target, name);
      assert.equal(after.value, descriptors[name].value, name + ' must not be replaced');
      for (const property of ['writable', 'enumerable', 'configurable']) {
        const expected = name === field && property === flag ? !descriptors[name][property] : descriptors[name][property];
        assert.equal(after[property], expected, 'commit cannot repair or otherwise alter caller descriptors');
      }
    }
  }
});

test('transaction context and envelope accessors reject without executing getters or consuming a valid plan', () => {
  const f = fixture(), handle = f.target.prepareImportState(f.envelope, f.ctx), before = state(f.target);
  let getters = 0;
  for (const field of ['ownerId', 'epoch', 'generation']) {
    const bad = { ...f.ctx };
    Object.defineProperty(bad, field, { get() { getters++; throw Error('context getter'); } });
    assert.throws(() => f.target.prepareImportState(f.envelope, bad));
    assert.throws(() => f.target.recheckPrepared(handle, bad));
    assert.throws(() => f.target.commitPrepared(handle, bad));
    assert.equal(getters, 0); assert.equal(state(f.target), before);
  }
  for (const field of ['schema', 'sourceDigest', 'checksum', 'payload']) {
    const bad = { ...f.envelope };
    Object.defineProperty(bad, field, { get() { getters++; throw Error('envelope getter'); } });
    assert.throws(() => f.target.prepareImportState(bad, f.ctx));
    assert.equal(getters, 0); assert.equal(state(f.target), before);
  }
  assert.equal(f.target.commitPrepared(handle, f.ctx).status, 'applied');
});

test('legacy boolean import rejects invalid motor destinations or lastError setters before any model replacement', () => {
  const scenarios = [
    a => { a.motor2D = new Float64Array(1); },
    a => { a.motor2D = new Float64Array(new SharedArrayBuffer(16)); },
    a => { structuredClone(a.motor2D.buffer, { transfer: [a.motor2D.buffer] }); },
    (a, hook) => { Object.defineProperty(a, 'lastError', { configurable: true, enumerable: true, set: hook }); }
  ];
  for (const alter of scenarios) {
    const f = fixture(), creature = f.target._creature, nativeBefore = JSON.stringify(creature.snapshot());
    const inputView = f.target.lastInput, inputBefore = bytes(inputView), seed = f.target.seed, elapsed = f.target.elapsedMs;
    let setters = 0;
    alter(f.target, () => { setters++; throw Error('lastError setter must not run'); });
    const motor = Object.getOwnPropertyDescriptor(f.target, 'motor2D').value;
    assert.equal(f.target.importState(f.envelope), false);
    assert.equal(setters, 0);
    assert.equal(f.target._creature, creature); assert.equal(JSON.stringify(creature.snapshot()), nativeBefore);
    assert.equal(f.target.lastInput, inputView); assert.equal(bytes(inputView), inputBefore);
    assert.equal(f.target.motor2D, motor); assert.equal(f.target.seed, seed); assert.equal(f.target.elapsedMs, elapsed);
  }
});

test('non-native, wrong-length, shared, resizable and detached public vectors cannot be prepared', () => {
  const cases = [() => new Float32Array(16), () => new Float64Array(15), () => Array(16).fill(0),
    () => new Float64Array(new SharedArrayBuffer(128)),
    () => { const view = new Float64Array(16); structuredClone(view.buffer, { transfer: [view.buffer] }); return view; }];
  if (typeof ArrayBuffer.prototype.resize === 'function') cases.push(() => new Float64Array(new ArrayBuffer(128, { maxByteLength: 256 })));
  for (const make of cases) {
    const f = fixture(), creature = f.target._creature, nativeBefore = JSON.stringify(creature.snapshot());
    f.target.lastInput = make();
    assert.throws(() => f.target.prepareImportState(f.envelope, f.ctx));
    assert.equal(f.target._creature, creature); assert.equal(JSON.stringify(creature.snapshot()), nativeBefore);
  }
});

test('detachment after preparation rejects before replacing the native creature or changing the other vector', () => {
  for (const field of ['lastInput', 'motor2D']) {
    const f = fixture(), handle = f.target.prepareImportState(f.envelope, f.ctx), creature = f.target._creature;
    const other = field === 'lastInput' ? f.target.motor2D : f.target.lastInput, before = bytes(other);
    structuredClone(f.target[field].buffer, { transfer: [f.target[field].buffer] });
    assert.throws(() => f.target.recheckPrepared(handle, f.ctx));
    assert.throws(() => f.target.commitPrepared(handle, f.ctx));
    assert.equal(f.target._creature, creature); assert.equal(bytes(other), before);
  }
});

test('successful prepared imports retain exact multi-seed replay and forced developmental affinity use', () => {
  for (const seed of [1, 17, 31]) {
    const f = fixture(seed);
    for (let tick = 3; tick < 25; tick++) f.source.step(input(tick));
    f.source.advance(73, input(25));
    f.source._creature.o.devTarget = f.source._creature.o.devSlots.length;
    const handle = f.target.prepareImportState(f.source.exportState(), f.ctx);
    assert.equal(f.target.commitPrepared(handle, f.ctx).status, 'applied');
    assert.equal(state(f.target), state(f.source));
    let lookups = 0;
    const affinity = f.target._creature.o.devAff;
    f.target._creature.o.devAff = (...args) => { lookups++; return affinity(...args); };
    const priorSprouts = f.source._creature.o.devStats.sprouted;
    for (let tick = 25; tick < 65; tick++) {
      f.source._creature.o.devRefine(); f.target._creature.o.devRefine();
      f.source.step(input(tick)); f.target.step(input(tick));
      assert.equal(state(f.target), state(f.source), 'exact source state, RNG and affinity replay: seed ' + seed + ', tick ' + tick);
      assert.deepEqual(f.target.readout().motor8, f.source.readout().motor8);
    }
    assert.ok(lookups > 0); assert.ok(f.source._creature.o.devStats.sprouted > priorSprouts);
  }
});

test('legacy preparation preserves old bytes and never silently reconstructs incompatible affinity state', () => {
  const f = fixture(), legacy = rehash(f.envelope, data => { delete data.developmentAffinity; });
  const handle = f.target.prepareImportState(legacy, f.ctx);
  assert.equal(f.target.commitPrepared(handle, f.ctx).status, 'applied');
  assert.equal(f.target.exportState().payload, legacy.payload);
  assert.equal(Object.hasOwn(f.target.captureStatePayload(), 'developmentAffinity'), false);
  const incompatible = rehash(legacy, data => {
    const org = data.native.org, edge = org.syn.pre.v.length;
    org.syn.pre.v.push(0); org.syn.post.v.push(16); org.syn.w.v.push(.25); org.syn.plastic.v.push(0);
    org.kind.v.push(0); org.pk.v.push(0); org.mask.v.push(1); org.out[0].push(edge);
    if (org.devPruned) org.devPruned.v.push(0);
  });
  const before = state(f.target);
  assert.throws(() => f.target.prepareImportState(incompatible, f.ctx));
  assert.equal(state(f.target), before);
});
