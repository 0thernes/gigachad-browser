/* Atomic, generation-fenced admission for the two bounded external asset groups. */
(function (root, factory) {
  const cjs = typeof module === 'object' && module.exports;
  const api = factory(root, cjs ? require('node:crypto') : null);
  if (cjs) module.exports = api;
  if (root) root.AliveAssetHydration = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, nodeCrypto) {
  'use strict';
  const GRAPH = 'celegans-reservoir64', CHAOS = 'tsotchke-chaos12x128', MAX_SOURCE_BYTES = 65536;
  const own = Object.getOwnPropertyDescriptor, keys = Reflect.ownKeys, define = Object.defineProperty;
  const freeze = Object.freeze, arrayIsArray = Array.isArray, is = Object.is;
  const TA = Object.getPrototypeOf(Uint8Array.prototype);
  const getBuffer = own(TA, 'buffer').get, getOffset = own(TA, 'byteOffset').get;
  const getLength = own(TA, 'length').get, getBytes = own(TA, 'byteLength').get;
  const getTag = own(TA, Symbol.toStringTag).get, setTyped = TA.set;
  const bufferLength = own(ArrayBuffer.prototype, 'byteLength').get;
  const resizable = own(ArrayBuffer.prototype, 'resizable')?.get;
  const U8 = Uint8Array, U16 = Uint16Array, I8 = Int8Array, F32 = Float32Array;
  const textEncoder = new TextEncoder(), encodeText = TextEncoder.prototype.encode;
  const subtle = root?.crypto?.subtle || nodeCrypto?.webcrypto?.subtle;
  const digest = subtle?.digest;
  const createHash = nodeCrypto?.createHash;
  const owners = new WeakMap(), requests = new WeakMap(), candidates = new WeakMap();
  const graphArrays = [
    ['celegansEdgeSrc512', 'Uint16Array', U16, 512], ['celegansEdgeDst512', 'Uint16Array', U16, 512],
    ['celegansEdgeWeight512', 'Int8Array', I8, 512], ['celegansEdgeType512', 'Uint8Array', U8, 512]
  ];
  const graphScalars = ['celegansLoaded', 'celegansActiveEdgeCount', 'celegansTotalEdges', 'celegansUniqueNeurons', 'celegansChemicalEdges', 'celegansGapJunctionEdges'];
  function fail(message) { throw new Error(message); }
  function targetOK(target) { return target !== null && typeof target === 'object'; }
  function assetOK(id) { return id === GRAPH || id === CHAOS; }
  function data(object, key, required = true) {
    if (!targetOK(object)) fail('Expected data object');
    const d = own(object, key);
    if (!d) { if (required) fail('Missing own field: ' + key); return undefined; }
    if (!Object.hasOwn(d, 'value')) fail('Accessor field: ' + key);
    return d.value;
  }
  function record(value, allowed, label) {
    if (!targetOK(value) || arrayIsArray(value)) fail('Invalid ' + label);
    const names = keys(value);
    if (names.length > allowed.length || names.some(k => typeof k !== 'string' || !allowed.includes(k))) fail('Unexpected ' + label + ' field');
    for (const name of names) data(value, name);
    return value;
  }
  function list(value, max, label) {
    if (!arrayIsArray(value)) fail('Invalid ' + label);
    const n = data(value, 'length');
    if (!Number.isSafeInteger(n) || n < 0 || n > max || keys(value).length !== n + 1) fail('Invalid ' + label + ' length');
    const out = [];
    for (let i = 0; i < n; i++) out.push(data(value, String(i)));
    return out;
  }
  function text(value, max, label, nullable = false) {
    if (nullable && (value === undefined || value === null)) return null;
    if (typeof value !== 'string' || !value.length || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) fail('Invalid ' + label);
    return value;
  }
  function number(value, label) { if (typeof value !== 'number' || !Number.isFinite(value)) fail('Invalid ' + label); return value; }
  function count(value, label) { if (!Number.isSafeInteger(value) || value < 0 || value > 1e9) fail('Invalid ' + label); return value; }
  function hashString(value, nullable = false) {
    if (nullable && (value === undefined || value === null)) return null;
    if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) fail('Invalid source digest');
    return value;
  }
  function deepFreeze(value) {
    if (value && typeof value === 'object') { for (const key of Object.keys(value)) deepFreeze(value[key]); freeze(value); }
    return value;
  }
  function canonical(value) {
    if (arrayIsArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
    return JSON.stringify(value);
  }
  function utf8(value) { return encodeText.call(textEncoder, value); }
  function hex(bytes) { let out = ''; for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0'); return out; }
  function hashSync(bytes) { if (!createHash) fail('Synchronous hashing unavailable'); return createHash('sha256').update(bytes).digest('hex'); }
  async function hashAsync(bytes) { if (!digest) fail('SHA256 unavailable'); return hex(new U8(await digest.call(subtle, 'SHA-256', bytes))); }
  function stateFor(target, id, create = false) {
    if (!targetOK(target) || !assetOK(id)) return null;
    let map = owners.get(target); if (!map && create) { map = new Map(); owners.set(target, map); }
    let state = map?.get(id);
    if (!state && create) { state = { generation: 0, phase: 'cold', reason: null, receipt: null, sourceKey: null, commits: 0 }; map.set(id, state); }
    return state;
  }
  function begin(target, assetId, options = {}) {
    const state = stateFor(target, assetId, true); if (!state) return null;
    if (state.phase === 'canonical-restored') { state.reason = 'Canonical restored asset denies ordinary hydration'; return null; }
    try {
      record(options, ['sourceKey', 'expectedSourceDigest'], 'begin options');
      const sourceKey = text(data(options, 'sourceKey'), 256, 'sourceKey');
      const expectedSourceDigest = hashString(data(options, 'expectedSourceDigest', false), true);
      state.generation++; state.phase = 'hydrating'; state.reason = null; state.sourceKey = sourceKey;
      const handle = freeze(Object.create(null));
      requests.set(handle, { target, assetId, state, generation: state.generation, sourceKey, expectedSourceDigest, used: false });
      return handle;
    } catch (error) { state.reason = error.message; return null; }
  }
  function markRestored(target, assetId) {
    const s = stateFor(target, assetId, true); if (!s) return false;
    s.generation++; s.phase = 'canonical-restored'; s.reason = 'Canonical restored asset'; s.receipt = null; return true;
  }
  function invalidate(target, assetId) {
    const s = stateFor(target, assetId, true); if (!s) return false;
    s.generation++; if (s.phase !== 'canonical-restored') s.phase = 'invalidated'; s.reason = 'Asset requests invalidated'; return true;
  }
  function inspect(target, assetId) {
    const s = stateFor(target, assetId);
    return freeze(s ? { generation: s.generation, phase: s.phase, reason: s.reason, sourceKey: s.sourceKey, commits: s.commits, receipt: s.receipt }
      : { generation: 0, phase: 'cold', reason: null, sourceKey: null, commits: 0, receipt: null });
  }
  function current(request, target) {
    return request && request.target === target && request.state.generation === request.generation && request.state.phase === 'hydrating';
  }
  function isCurrent(handle, target) {
    const request = requests.get(handle);
    return Boolean(request && !request.used && current(request, target));
  }
  function reject(request, reason) {
    if (request && current(request, request.target)) { request.state.phase = 'rejected'; request.state.reason = String(reason).slice(0, 300); }
    return null;
  }
  function descriptor(target, key) {
    const d = own(target, key);
    if (!d || !Object.hasOwn(d, 'value') || !d.writable) fail('Asset field must be own writable data: ' + key);
    return d;
  }
  function ordinaryBuffer(buffer) {
    let n; try { n = bufferLength.call(buffer); } catch (_) { fail('Shared/nonordinary backing storage'); }
    if (resizable?.call(buffer)) fail('Resizable backing storage');
    // A zero-length detached buffer must still fail construction.
    new U8(buffer, 0, 0); return n;
  }
  function viewInfo(view, tag, length) {
    let actualTag; try { actualTag = getTag.call(view); } catch (_) { fail('Invalid typed view'); }
    if (actualTag !== tag || getLength.call(view) !== length) fail('Wrong asset tensor type/length');
    const buffer = getBuffer.call(view), offset = getOffset.call(view), bytes = getBytes.call(view);
    const capacity = ordinaryBuffer(buffer); const copy = new U8(bytes);
    setTyped.call(copy, new U8(buffer, offset, bytes));
    return { view, buffer, offset, bytes, capacity, copy };
  }
  function snapshot(target, assetId) {
    const fields = {}, arrays = {}, values = {};
    for (const [key, tag, Ctor, n] of assetId === GRAPH ? graphArrays : [['chaosEmb12x128', 'Float32Array', F32, 1536]]) {
      fields[key] = descriptor(target, key); arrays[key] = viewInfo(fields[key].value, tag, n);
      values[key] = new Ctor(n); setTyped.call(new U8(getBuffer.call(values[key])), arrays[key].copy);
    }
    const views = Object.values(arrays);
    for (let i = 0; i < views.length; i++) for (let j = i + 1; j < views.length; j++) {
      const a = views[i], b = views[j];
      if (a.buffer === b.buffer && a.offset < b.offset + b.bytes && b.offset < a.offset + a.bytes) fail('Overlapping asset output views');
    }
    for (const key of assetId === GRAPH ? graphScalars : ['loadedBinaryChaosEmb']) {
      fields[key] = descriptor(target, key); values[key] = fields[key].value;
      if (key.endsWith('Loaded') || key === 'loadedBinaryChaosEmb') { if (typeof values[key] !== 'boolean') fail('Invalid loaded flag'); }
      else count(values[key], key);
    }
    if (assetId === GRAPH) {
      if (values.celegansActiveEdgeCount > 512) fail('Invalid active edge count');
      fields.celegansHubNames64 = descriptor(target, 'celegansHubNames64');
      const names = fields.celegansHubNames64.value, copy = list(names, 64, 'hub names');
      if (copy.length !== 64) fail('Expected64 hub names');
      for (let i = 0; i < 64; i++) { text(copy[i], 128, 'hub name'); descriptor(names, String(i)); }
      values.celegansHubNames64 = copy;
      arrays.names = { view: names, copy: copy.slice(), descriptors: copy.map((_, i) => own(names, String(i))) };
    }
    return { fields, arrays, values };
  }
  function provenance(input, request) {
    if (input === undefined || input === null) input = {};
    record(input, ['sourceDigest', 'sourceByteLength', 'sourcePath', 'sourceMode', 'sourceDigestObserved'], 'provenance');
    const sourceDigest = hashString(data(input, 'sourceDigest', false), true);
    const rawLength = data(input, 'sourceByteLength', false), sourceByteLength = rawLength === undefined || rawLength === null ? null : count(rawLength, 'source byte length');
    const sourcePath = text(data(input, 'sourcePath', false), 1024, 'source path', true);
    const sourceMode = text(data(input, 'sourceMode', false), 128, 'source mode', true);
    const observed = data(input, 'sourceDigestObserved', false);
    if (observed !== undefined && typeof observed !== 'boolean') fail('Invalid observed-source flag');
    if (observed && (!sourceDigest || sourceByteLength === null)) fail('Observed source needs digest and byte length');
    if (request.expectedSourceDigest && sourceDigest !== request.expectedSourceDigest) fail('Expected source digest mismatch');
    return { sourceKey: request.sourceKey, sourceDigest, sourceByteLength, sourcePath, sourceMode,
      status: sourceDigest ? observed ? 'reader-attested' : 'provided-unverified' : 'unverified',
      authentication: 'No cryptographic authentication of producer; received-byte checks are separate.' };
  }
  function stageGraph(target, stats) {
    record(stats, ['totalEdges', 'uniqueNeurons', 'chemicalEdges', 'gapJunctionEdges', 'topHubs', 'compactEdges'], 'graph stats');
    const total = count(data(stats, 'totalEdges'), 'total edges'); if (!total) fail('No graph data');
    const numbers = {};
    for (const key of ['uniqueNeurons', 'chemicalEdges', 'gapJunctionEdges']) {
      const v = data(stats, key, false); numbers[key] = v === undefined ? 0 : count(v, key);
    }
    const hubsValue = data(stats, 'topHubs', false), edgesValue = data(stats, 'compactEdges', false);
    const hubs = hubsValue === undefined ? [] : list(hubsValue, 64, 'top hubs');
    const edges = edgesValue === undefined ? [] : list(edgesValue, 512, 'compact edges');
    const cleanHubs = hubs.map(hub => {
      record(hub, ['name', 'weightedDeg'], 'hub'); const name = text(data(hub, 'name'), 128, 'hub name');
      const degree = data(hub, 'weightedDeg', false); if (degree !== undefined) number(degree, 'hub degree'); return name;
    });
    const cleanEdges = edges.map(edge => {
      const e = list(edge, 4, 'edge'); if (e.length < 3) fail('Incomplete edge');
      for (let i = 0; i < 3; i++) number(e[i], 'edge coordinate/weight');
      if (e.length === 4 && !['number', 'boolean'].includes(typeof e[3])) fail('Invalid edge type');
      if (typeof e[3] === 'number') number(e[3], 'edge type'); return e;
    });
    const before = snapshot(target, GRAPH), values = before.values;
    values.celegansLoaded = true; values.celegansTotalEdges = total;
    values.celegansUniqueNeurons = numbers.uniqueNeurons || 302;
    values.celegansChemicalEdges = numbers.chemicalEdges || 6393;
    values.celegansGapJunctionEdges = numbers.gapJunctionEdges || 986;
    for (let i = 0; i < cleanHubs.length; i++) values.celegansHubNames64[i] = cleanHubs[i];
    if (cleanEdges.length) {
      values.celegansActiveEdgeCount = cleanEdges.length;
      for (let i = 0; i < cleanEdges.length; i++) {
        const e = cleanEdges[i]; values.celegansEdgeSrc512[i] = e[0] & 63; values.celegansEdgeDst512[i] = e[1] & 63;
        values.celegansEdgeWeight512[i] = Math.max(-127, Math.min(127, e[2] | 0)); values.celegansEdgeType512[i] = e[3] ? 1 : 0;
      }
    }
    return { before, values, received: null };
  }
  function ownedBytes(value) {
    let buffer, offset, size;
    try { size = bufferLength.call(value); buffer = value; offset = 0; }
    catch (_) { if (getTag.call(value) !== 'Uint8Array') fail('Expected Uint8Array or ArrayBuffer'); buffer = getBuffer.call(value); offset = getOffset.call(value); size = getBytes.call(value); }
    ordinaryBuffer(buffer);
    if (size < 6144 || size > MAX_SOURCE_BYTES) fail('Chaos byte length outside6144..65536');
    const out = new U8(size); setTyped.call(out, new U8(buffer, offset, size)); return out;
  }
  function stageChaos(target, bytes) {
    const received = ownedBytes(bytes), input = new DataView(getBuffer.call(received), 0, 6144);
    let finiteWithin100 = 0; for (let i = 0; i < 1536; i++) { const v = input.getFloat32(i * 4, true); if (Number.isFinite(v) && Math.abs(v) <= 100) finiteWithin100++; }
    if (finiteWithin100 < 1500) fail('Chaos candidate fails finite-value threshold');
    const before = snapshot(target, CHAOS), values = before.values;
    for (let i = 0; i < 1536; i++) {
      const v = input.getFloat32(i * 4, true);
      values.chaosEmb12x128[i] = Number.isFinite(v) ? Math.max(-20, Math.min(20, v)) : Math.sin((i + 1) * 0.70710678) * 0.65;
    }
    values.loadedBinaryChaosEmb = true;
    return { before, values, received, finiteWithin100 };
  }
  function stage(handle, target, assetId, input, source) {
    const request = requests.get(handle);
    if (!request || request.used || request.assetId !== assetId || !current(request, target)) return null;
    request.used = true;
    try {
      const sourceReceipt = provenance(source, request);
      const staged = assetId === GRAPH ? stageGraph(target, input) : stageChaos(target, input);
      return { request, ...staged, source: sourceReceipt };
    } catch (error) { return reject(request, error.message); }
  }
  function receiptWork(staged) {
    const { request, values } = staged, graph = request.assetId === GRAPH;
    const arrays = {}, work = [];
    for (const [key, tag] of graph ? graphArrays : [['chaosEmb12x128', 'Float32Array']]) {
      const view = values[key], bytes = new U8(getBuffer.call(view));
      arrays[key] = { type: tag, length: getLength.call(view), byteLength: bytes.length, byteOrder: 'LE', sha256: null };
      work.push({ bytes, apply: hash => { arrays[key].sha256 = hash; } });
    }
    const metadata = graph ? Object.fromEntries(graphScalars.concat('celegansHubNames64').map(k => [k, values[k]])) : { loadedBinaryChaosEmb: true };
    const receipt = { schema: 'gigachad.asset-receipt.v1', assetId: request.assetId, generation: request.generation,
      transformId: graph ? 'celegans.compact-apply-v1' : 'chaos.first6144-f32le-finite1500-clamp20-v1',
      source: staged.source, arrays, metadata, effectiveSha256: null };
    if (graph) work.push({ bytes: utf8(JSON.stringify(values.celegansHubNames64)), apply: hash => { receipt.mappingSha256 = hash; } });
    else {
      receipt.finiteWithin100 = staged.finiteWithin100;
      receipt.receivedByteLength = staged.received.length;
      work.push({ bytes: staged.received, apply: hash => { receipt.receivedBytesSha256 = hash; } });
      const prefix = new U8(6144); setTyped.call(prefix, new U8(getBuffer.call(staged.received), 0, 6144));
      work.push({ bytes: prefix, apply: hash => { receipt.consumedPrefixSha256 = hash; } });
    }
    return { receipt, work };
  }
  function finish(staged, receipt) {
    if (!current(staged.request, staged.request.target)) return null;
    const s = receipt.source;
    if (staged.received && s.sourceByteLength !== null && s.sourceByteLength < receipt.receivedByteLength) return reject(staged.request, 'Source length smaller than received payload');
    if (staged.received && s.sourceDigest && s.sourceByteLength === receipt.receivedByteLength && s.sourceDigest !== receipt.receivedBytesSha256) return reject(staged.request, 'Received bytes do not match source digest');
    const handle = freeze(Object.create(null)); candidates.set(handle, { ...staged, receipt: deepFreeze(receipt), used: false }); return handle;
  }
  async function prepare(handle, target, assetId, input, source) {
    const staged = stage(handle, target, assetId, input, source); if (!staged) return null;
    try {
      const { receipt, work } = receiptWork(staged);
      await Promise.all(work.map(async item => { item.apply(await hashAsync(item.bytes)); }));
      receipt.effectiveSha256 = assetId === GRAPH ? await hashAsync(utf8('gigachad.asset.celegans.effective.v1\0' + canonical({ arrays: receipt.arrays, metadata: receipt.metadata }))) : receipt.arrays.chaosEmb12x128.sha256;
      return finish(staged, receipt);
    } catch (error) { return reject(staged.request, error.message); }
  }
  function prepareSync(handle, target, assetId, input, source) {
    const staged = stage(handle, target, assetId, input, source); if (!staged) return null;
    try {
      const { receipt, work } = receiptWork(staged); for (const item of work) item.apply(hashSync(item.bytes));
      receipt.effectiveSha256 = assetId === GRAPH ? hashSync(utf8('gigachad.asset.celegans.effective.v1\0' + canonical({ arrays: receipt.arrays, metadata: receipt.metadata }))) : receipt.arrays.chaosEmb12x128.sha256;
      return finish(staged, receipt);
    } catch (error) { return reject(staged.request, error.message); }
  }
  function descriptorEqual(a, b) { return a && Object.hasOwn(a, 'value') && is(a.value, b.value) && a.writable === b.writable && a.configurable === b.configurable && a.enumerable === b.enumerable; }
  function validateCurrent(target, staged) {
    for (const [key, expected] of Object.entries(staged.before.fields)) if (!descriptorEqual(own(target, key), expected)) fail('Target field changed during preparation: ' + key);
    for (const [key, old] of Object.entries(staged.before.arrays)) {
      if (key === 'names') {
        const names = list(old.view, 64, 'hub names'); if (names.length !== 64) fail('Hub names length changed');
        for (let i = 0; i < 64; i++) if (!is(names[i], old.copy[i]) || !descriptorEqual(own(old.view, String(i)), old.descriptors[i])) fail('Hub names changed during preparation');
      } else {
        const now = viewInfo(old.view, getTag.call(old.view), getLength.call(old.view));
        if (now.buffer !== old.buffer || now.offset !== old.offset || now.bytes !== old.bytes || now.capacity !== old.capacity) fail('Asset backing changed');
        for (let i = 0; i < old.copy.length; i++) if (now.copy[i] !== old.copy[i]) fail('Asset bytes changed during preparation: ' + key);
      }
    }
  }
  function commit(handle, target) {
    const staged = candidates.get(handle);
    if (!staged || staged.used) return freeze({ ok: false, status: 'rejected', reason: 'Unknown or consumed candidate' });
    staged.used = true;
    if (!current(staged.request, target)) {
      reject(staged.request, 'Target, generation or phase changed');
      return freeze({ ok: false, status: 'stale', reason: 'Target, generation or phase changed' });
    }
    try { validateCurrent(target, staged); }
    catch (error) { reject(staged.request, error.message); return freeze({ ok: false, status: 'rejected', reason: error.message }); }
    // Trusted ordinary targets, no Proxies; all descriptors, ownership and bytes
    // were checked above. There is no await or user-supplied callback in commit.
    for (const [key, old] of Object.entries(staged.before.arrays)) {
      if (key === 'names') for (let i = 0; i < 64; i++) define(old.view, String(i), { value: staged.values.celegansHubNames64[i] });
      else setTyped.call(old.view, staged.values[key]);
    }
    for (const key of staged.request.assetId === GRAPH ? graphScalars : ['loadedBinaryChaosEmb']) define(target, key, { value: staged.values[key] });
    const state = staged.request.state; state.phase = 'ready'; state.reason = null; state.receipt = staged.receipt; state.commits++;
    return freeze({ ok: true, status: 'applied', receipt: staged.receipt });
  }
  const api = { GRAPH, CHAOS, MAX_SOURCE_BYTES, begin, markRestored, invalidate, inspect, isCurrent, commit,
    prepareGraph: (handle, target, stats, source) => prepare(handle, target, GRAPH, stats, source),
    prepareChaos: (handle, target, bytes, source) => prepare(handle, target, CHAOS, bytes, source) };
  if (nodeCrypto) {
    api.prepareGraphSync = (handle, target, stats, source) => prepareSync(handle, target, GRAPH, stats, source);
    api.prepareChaosSync = (handle, target, bytes, source) => prepareSync(handle, target, CHAOS, bytes, source);
  }
  return freeze(api);
});
