/* Exact bounded replay component. No model stepping, storage or browser access.
 * The registry sees a private capacity-32 projection; the live ring is never
 * padded. Publication assumes fenced writers and ordinary non-Proxy objects.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveReplayState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const COMPONENT_ID = 'trainable-hub-replay', SCHEMA_VERSION = 1, CAPACITY = 32;
  const FIELDS = Object.freeze([['z16', 16], ['a8', 8], ['zNext16', 16]]);
  const SCOPE = Object.freeze({ kind: 'declared-dense-replay-subset', completeApplicationCatalog: false,
    includes: 'Dense occupied replay records, three exact Float32 views per record, finite Float64 surprise and insertion cursor',
    excludes: 'Training cadence, dream counter, model weights, learning rate, RNG, observations outside replay, other models and browser authority',
    continuation: 'Replay selection and update also require independently equivalent omitted inputs and state',
    publication: 'Two synchronous own-data slot writes with readback and best-effort verified rollback; not a whole-model transaction',
    inputs: 'Fenced ordinary non-Proxy objects and fixed nonshared native Float32 views only; replay backings are disjoint from direct own-data hub views' });
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const define = Object.defineProperty, descriptor = Object.getOwnPropertyDescriptor;
  const tp = Object.getPrototypeOf(Float32Array.prototype);
  const getters = Object.fromEntries(['buffer', 'byteOffset', 'byteLength', 'length'].map(key => [key, descriptor(tp, key).get]));
  const dtype = descriptor(tp, Symbol.toStringTag).get;
  const bufferBytes = descriptor(ArrayBuffer.prototype, 'byteLength').get;
  const resizable = descriptor(ArrayBuffer.prototype, 'resizable')?.get;
  const fail = message => { throw new TypeError('Replay state: ' + message); };
  const integer = (value, min, max) => Number.isSafeInteger(value) && !Object.is(value, -0) && value >= min && value <= max;
  const plain = value => value && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const equalBytes = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);
  const sameDescriptor = (a, b) => !!a && !!b && own(a, 'value') && own(b, 'value') && Object.is(a.value, b.value) &&
    a.writable === b.writable && a.enumerable === b.enumerable && a.configurable === b.configurable;
  function data(object, key, writable = false) {
    const slot = descriptor(object, key);
    if (!slot || !own(slot, 'value') || writable && slot.writable !== true) fail('expected ' + (writable ? 'writable ' : '') + 'own-data slot ' + key);
    return slot;
  }
  function keys(value, expected, label) {
    const actual = Reflect.ownKeys(value);
    if (actual.length !== expected.length || actual.some(key => typeof key !== 'string' || !expected.includes(key))) fail('unexpected ' + label + ' keys or holes');
  }
  function occupancy(count, cursor, indices) {
    if (!integer(count, 0, CAPACITY) || !integer(cursor, 0, CAPACITY - 1) || count < CAPACITY && cursor !== count) fail('dense replay count/cursor mismatch');
    if (indices !== undefined && (!Array.isArray(indices) || indices.length !== count ||
        indices.some((value, index) => !integer(value, 0, CAPACITY - 1) || value !== index))) fail('occupied indices must be exactly 0 through count minus one');
  }
  function viewInfo(view, length) {
    let buffer, bytes;
    try {
      if (Object.getPrototypeOf(view) !== Float32Array.prototype || dtype.call(view) !== 'Float32Array' ||
          getters.length.call(view) !== length || getters.byteLength.call(view) !== length * 4 || getters.byteOffset.call(view) !== 0) fail('wrong replay tensor shape or prototype');
      buffer = getters.buffer.call(view);
      if (bufferBytes.call(buffer) !== length * 4 || resizable?.call(buffer)) fail('replay tensor requires standalone fixed nonshared backing');
      keys(view, Array.from({ length }, (_, i) => String(i)), 'tensor');
      bytes = new Uint8Array(buffer).slice();
      const values = new Float32Array(bytes.buffer);
      if (values.some(value => !Number.isFinite(value))) fail('nonfinite replay tensor');
    } catch (error) { fail('invalid replay tensor: ' + error.message); }
    return { view, buffer, bytes };
  }
  function inspect(hub) {
    if (!plain(hub)) fail('ordinary hub object required');
    const ringSlot = data(hub, 'replayRing32', true), cursorSlot = data(hub, 'replayWritePtr', true);
    const ring = ringSlot.value;
    if (!Array.isArray(ring) || Object.getPrototypeOf(ring) !== Array.prototype) fail('ordinary replay array required');
    const count = data(ring, 'length').value, cursor = cursorSlot.value;
    occupancy(count, cursor);
    keys(ring, ['length', ...Array.from({ length: count }, (_, i) => String(i))], 'ring');
    const checks = [{ object: ring, key: 'length', slot: descriptor(ring, 'length') }], records = [], views = [], buffers = new Set(), objects = new Set();
    for (let i = 0; i < count; i++) {
      const slot = data(ring, String(i)), record = slot.value;
      checks.push({ object: ring, key: String(i), slot });
      if (!plain(record) || objects.has(record)) fail('replay records must be distinct ordinary objects');
      objects.add(record); records.push(record);
      keys(record, ['z16', 'a8', 'zNext16', 'surprise'], 'record');
      for (const [name, length] of FIELDS) {
        const member = data(record, name), info = viewInfo(member.value, length);
        if (buffers.has(info.buffer)) fail('replay tensor backings must be distinct');
        buffers.add(info.buffer); views.push(info); checks.push({ object: record, key: name, slot: member });
      }
      const surprise = data(record, 'surprise');
      if (typeof surprise.value !== 'number' || !Number.isFinite(surprise.value)) fail('finite surprise required');
      checks.push({ object: record, key: 'surprise', slot: surprise });
    }
    // Fresh replay pushes copy their source latents. Reject a corrupted live
    // alias before projection could erase it; omitted fields need not exist.
    const hubKeys = Reflect.ownKeys(hub);
    if (hubKeys.length > 4096) fail('direct hub field inspection bound exceeded');
    for (const key of hubKeys) {
      const member = descriptor(hub, key);
      if (!own(member, 'value') || !ArrayBuffer.isView(member.value)) continue;
      let backing;
      try { backing = getters.buffer.call(member.value); }
      catch (_) { backing = descriptor(DataView.prototype, 'buffer').get.call(member.value); }
      if (buffers.has(backing)) fail('replay backing aliases a direct hub view');
    }
    return { hub, hubPrototype: Object.getPrototypeOf(hub), ringSlot, cursorSlot, ring, count, cursor, checks, records, views,
      recordPrototypes: records.map(record => Object.getPrototypeOf(record)) };
  }
  function sameRing(before, after) {
    if (before.ring !== after.ring || before.count !== after.count || !Object.is(before.cursor, after.cursor) ||
        before.checks.length !== after.checks.length || before.views.length !== after.views.length) return false;
    return before.checks.every((check, i) => check.object === after.checks[i].object && check.key === after.checks[i].key && sameDescriptor(check.slot, after.checks[i].slot)) &&
      before.recordPrototypes.every((proto, i) => proto === after.recordPrototypes[i]) &&
      before.views.every((info, i) => info.view === after.views[i].view && info.buffer === after.views[i].buffer && equalBytes(info.bytes, after.views[i].bytes));
  }
  function unchanged(before, hub) {
    const after = inspect(hub);
    if (hub !== before.hub || Object.getPrototypeOf(hub) !== before.hubPrototype ||
        !sameDescriptor(before.ringSlot, after.ringSlot) || !sameDescriptor(before.cursorSlot, after.cursorSlot) || !sameRing(before, after)) fail('destination changed since preflight');
    return after;
  }
  function definitionRows() {
    const state = (id, role, schema) => ({ id, componentId: COMPONENT_ID, role,
      paths: [{ root: 'replay', keys: [id] }], schemaVersion: 1, required: true, schema });
    const states = [state('count', 'occupancy', { type: 'i53', min: 0, max: CAPACITY }),
      state('indices', 'occupancy', { type: 'array', items: { type: 'i53', min: 0, max: CAPACITY - 1 }, maxLength: CAPACITY, unique: true }),
      state('cursor', 'insertion-cursor', { type: 'i53', min: 0, max: CAPACITY - 1 })];
    const tensors = FIELDS.map(([id, length]) => ({ id, role: 'replay-memory', paths: [[id]], dtype: 'Float32Array', dimensions: [length],
      backingGroup: id, backingOffset: 0, backingByteLength: length * 4, policy: { format: 'native', finite: true } }));
    const families = [{ id: 'replay', componentId: COMPONENT_ID, capacity: CAPACITY, slotPath: { root: 'replay', keys: ['slots'] },
      countStateId: 'count', indicesStateId: 'indices', cursorStateId: 'cursor', tensors,
      states: [{ id: 'surprise', role: 'replay-priority', paths: [['surprise']], schemaVersion: 1, required: true, schema: { type: 'f64' } }] }];
    return { tensors: [], states, families, resumeRules: [] };
  }
  function projection(count, cursor, source) {
    const slots = new Array(CAPACITY);
    for (let i = 0; i < count; i++) slots[i] = source ? source[i] : { z16: new Float32Array(16), a8: new Float32Array(8), zNext16: new Float32Array(16), surprise: 0 };
    return { replay: { count, indices: Array.from({ length: count }, (_, i) => i), cursor, slots } };
  }
  async function create({ registry, codec, crypto } = {}) {
    if (typeof registry?.compile !== 'function' || typeof codec?.fingerprintDescriptors !== 'function' ||
        typeof codec?.verifiedCopy !== 'function' || typeof codec?.untagValue !== 'function') fail('compatible codec and registry required');
    const rows = definitionRows();
    const implementationDigest = await codec.fingerprintDescriptors({ componentId: COMPONENT_ID, schemaVersion: SCHEMA_VERSION, capacity: CAPACITY, ...rows,
      interpretation: 'Dense physical slots only; partial cursor equals count; full cursor 0..31; exact standalone distinct finite Float32 fields disjoint from direct hub views and finite Float64 surprise; no omitted cadence or model state' }, { crypto });
    const compiled = await registry.compile({ registryVersion: 1,
      components: [{ id: COMPONENT_ID, schemaVersion: SCHEMA_VERSION, implementationDigest, present: true }], ...rows }, { codec, crypto });
    const plans = new WeakMap();
    const generation = value => { if (!integer(value, 0, Number.MAX_SAFE_INTEGER)) fail('valid model generation required'); return value; };
    const summary = (status, count, cursor, gen) => ({ status, ...(gen === undefined ? {} : { generation: gen }), count, cursor,
      tensorCount: count * 3, tensorBytes: count * 160, scope: SCOPE.kind });
    function stage(decoded) {
      // Read ONLY the private decoder capsule. Its exposed mirrors are mutable.
      const verified = codec.verifiedCopy(decoded), values = verified.stateValues;
      const count = codec.untagValue(values.count), cursor = codec.untagValue(values.cursor), indices = codec.untagValue(values.indices);
      occupancy(count, cursor, indices);
      const roots = projection(count, cursor);
      const prepared = compiled.preflight(decoded, roots, { generation: 0 });
      compiled.apply(prepared, roots, { generation: 0 });
      return { roots, count, cursor };
    }
    function planFor(prepared, hub, gen) {
      generation(gen);
      const plan = plans.get(prepared);
      if (!plan || plan.hub !== hub || plan.generation !== gen) fail('stale or foreign replay publication plan');
      return plan;
    }
    function recheck(prepared, hub, { generation: gen } = {}) {
      const plan = planFor(prepared, hub, gen); unchanged(plan.before, hub);
      return summary('ready', plan.staged.count, plan.staged.cursor, gen);
    }
    return Object.freeze({ architecture: compiled.architecture, scope: SCOPE,
      capture(hub, snapshot, { generation: gen, provenance } = {}) {
        generation(gen); const current = inspect(hub);
        return compiled.capture(projection(current.count, current.cursor, current.ring), snapshot, { generation: gen, provenance });
      },
      validate(decoded) { const staged = stage(decoded); return summary('validated', staged.count, staged.cursor); },
      preflight(decoded, hub, { generation: gen } = {}) {
        generation(gen); const before = inspect(hub), staged = stage(decoded); unchanged(before, hub);
        const prepared = Object.freeze(summary('prepared', staged.count, staged.cursor, gen));
        plans.set(prepared, { hub, generation: gen, before, staged }); return prepared;
      }, recheck,
      apply(prepared, hub, { generation: gen } = {}) {
        const plan = planFor(prepared, hub, gen); unchanged(plan.before, hub);
        plans.delete(prepared); // one attempt, including a publication failure
        const candidate = plan.staged.roots.replay.slots, cursor = plan.staged.cursor;
        // Until publication the registry projection retains capacity length.
        candidate.length = plan.staged.count;
        const expected = inspect({ replayRing32: candidate, replayWritePtr: cursor });
        try {
          define(hub, 'replayRing32', { value: candidate });
          define(hub, 'replayWritePtr', { value: cursor });
          const actual = inspect(hub);
          if (!sameRing(expected, actual) || !sameDescriptor({ ...plan.before.ringSlot, value: candidate }, actual.ringSlot) ||
              !sameDescriptor({ ...plan.before.cursorSlot, value: cursor }, actual.cursorSlot)) fail('publication readback failed');
        } catch (error) {
          let rollbackVerified = false;
          try { define(hub, 'replayRing32', plan.before.ringSlot); define(hub, 'replayWritePtr', plan.before.cursorSlot); unchanged(plan.before, hub); rollbackVerified = true; } catch (_) {}
          const failure = new Error('Replay publication failed; rollback ' + (rollbackVerified ? 'verified' : 'unverified') + ': ' + error.message);
          failure.rollbackVerified = rollbackVerified; failure.partialApplication = !rollbackVerified; throw failure;
        }
        return { ...summary('applied', plan.staged.count, cursor, gen), readbackVerified: true };
      },
      discard(prepared) { return plans.delete(prepared); }
    });
  }
  return Object.freeze({ create, COMPONENT_ID, SCHEMA_VERSION, CAPACITY, scope: SCOPE });
});
