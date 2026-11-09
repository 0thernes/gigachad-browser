'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { createHash, webcrypto } = require('node:crypto');
const A = require('../systems/alive-asset-hydration.js');
const source = fs.readFileSync(path.join(__dirname, '../systems/alive-asset-hydration.js'), 'utf8');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function graph() {
  return { celegansEdgeSrc512: new Uint16Array(512).fill(17), celegansEdgeDst512: new Uint16Array(512).fill(29),
    celegansEdgeWeight512: new Int8Array(512).fill(-70), celegansEdgeType512: new Uint8Array(512).fill(1),
    celegansHubNames64: Array.from({ length: 64 }, (_, i) => 'old-' + i), celegansLoaded: false,
    celegansActiveEdgeCount: 7, celegansTotalEdges: 9000, celegansUniqueNeurons: 128,
    celegansChemicalEdges: 8000, celegansGapJunctionEdges: 1000 };
}
function chaos() { return { chaosEmb12x128: new Float32Array(1536).fill(10), loadedBinaryChaosEmb: false }; }
function stats() { return { totalEdges: 20, uniqueNeurons: 4, chemicalEdges: 16, gapJunctionEdges: 4,
  topHubs: [{ name: 'new-a', weightedDeg: 8 }, { name: 'new-b', weightedDeg: 7 }],
  compactEdges: [[65, -1, 999.5, 1], [3, 4, -999, 0]] }; }
function bytes(value = .25) { const b = Buffer.alloc(6144); for (let i = 0; i < 1536; i++) b.writeFloatLE(value, i * 4); return b; }
function begin(api, target, id, options = {}) { return api.begin(target, id, { sourceKey: 'fixture', ...options }); }
function snapshot(target) {
  return Object.fromEntries(Object.entries(target).map(([k, v]) => [k, ArrayBuffer.isView(v) ? Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString('hex') : Array.isArray(v) ? v.slice() : v]));
}
function delayedBrowser() {
  let release; const gate = new Promise(resolve => { release = resolve; });
  const api = vm.runInNewContext(source + ';AliveAssetHydration', { TextEncoder, crypto: { subtle: {
    digest: async (algorithm, data) => { await gate; return webcrypto.subtle.digest(algorithm, data); }
  } } });
  return { api, release };
}

test('CommonJS sync graph load preserves partial tails, names, mapping and exact coercion', () => {
  const target = graph(), original = snapshot(target);
  const c = A.prepareGraphSync(begin(A, target, A.GRAPH), target, stats());
  assert.ok(c); assert.deepEqual(snapshot(target), original, 'Preparation is not mutation');
  const result = A.commit(c, target); assert.equal(result.ok, true);
  assert.deepEqual(Array.from(target.celegansEdgeSrc512.slice(0, 3)), [1, 3, 17]);
  assert.deepEqual(Array.from(target.celegansEdgeDst512.slice(0, 3)), [63, 4, 29]);
  assert.deepEqual(Array.from(target.celegansEdgeWeight512.slice(0, 3)), [127, -127, -70]);
  assert.deepEqual(Array.from(target.celegansEdgeType512.slice(0, 3)), [1, 0, 1]);
  assert.deepEqual(target.celegansHubNames64.slice(0, 3), ['new-a', 'new-b', 'old-2']);
  assert.equal(target.celegansActiveEdgeCount, 2); assert.equal(target.celegansLoaded, true);
  assert.equal(result.receipt.source.status, 'unverified'); assert.equal(result.receipt.source.sourceDigest, null);
  assert.equal(result.receipt.arrays.celegansEdgeWeight512.sha256, sha(Buffer.from(target.celegansEdgeWeight512.buffer)));
  assert.ok(Object.isFrozen(result.receipt.metadata.celegansHubNames64));
});

test('empty compact edges preserve prior count/bytes; explicit zero statistics follow legacy fallback', () => {
  const target = graph(), before = snapshot(target);
  const c = A.prepareGraphSync(begin(A, target, A.GRAPH), target,
    { totalEdges: 1, uniqueNeurons: 0, chemicalEdges: 0, gapJunctionEdges: 0, compactEdges: [], topHubs: [] });
  assert.equal(A.commit(c, target).ok, true);
  assert.equal(target.celegansActiveEdgeCount, 7);
  for (const key of ['celegansEdgeSrc512', 'celegansEdgeDst512', 'celegansEdgeWeight512', 'celegansEdgeType512', 'celegansHubNames64']) assert.deepEqual(snapshot(target)[key], before[key]);
  assert.equal(target.celegansUniqueNeurons, 302); assert.equal(target.celegansChemicalEdges, 6393); assert.equal(target.celegansGapJunctionEdges, 986);
});

test('known pinned offline graph receipt has exact effective digest and metadata', () => {
  const ref = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/alive-assets-graph-v1.json'), 'utf8'));
  const s = Object.fromEntries(['totalEdges', 'uniqueNeurons', 'chemicalEdges', 'gapJunctionEdges', 'topHubs', 'compactEdges'].map(k => [k, ref.statistics[k]]));
  const target = graph(), r = A.commit(A.prepareGraphSync(begin(A, target, A.GRAPH), target, s), target);
  assert.equal(r.ok, true); assert.equal(r.receipt.effectiveSha256, ref.effective.effectiveSha256);
  assert.equal(r.receipt.mappingSha256, ref.effective.mappingSha256);
  assert.deepEqual(r.receipt.arrays, ref.effective.arrays); assert.deepEqual(r.receipt.metadata, ref.effective.metadata);
});

test('async and sync preparations produce matching effective graph and chaos representations', async () => {
  for (const id of [A.GRAPH, A.CHAOS]) {
    const left = id === A.GRAPH ? graph() : chaos(), right = id === A.GRAPH ? graph() : chaos();
    const input = id === A.GRAPH ? stats() : bytes();
    const sync = id === A.GRAPH ? A.prepareGraphSync : A.prepareChaosSync;
    const async = id === A.GRAPH ? A.prepareGraph : A.prepareChaos;
    const a = A.commit(sync(begin(A, left, id), left, input), left);
    const b = A.commit(await async(begin(A, right, id), right, input), right);
    assert.equal(a.ok, true); assert.equal(b.ok, true); assert.deepEqual(snapshot(left), snapshot(right));
    assert.deepEqual(a.receipt, b.receipt);
  }
});

test('chaos threshold/clamp/nonfinite fallback matches exact Float32 bytes and received digest', () => {
  const target = chaos(), input = bytes(30);
  for (let i = 1500; i < 1536; i++) input.writeFloatLE(NaN, i * 4);
  const p = { sourceDigest: sha(input), sourceByteLength: input.length, sourcePath: 'fixture.bin', sourceMode: 'node-file-read', sourceDigestObserved: true };
  const r = A.commit(A.prepareChaosSync(begin(A, target, A.CHAOS, { expectedSourceDigest: p.sourceDigest }), target, input, p), target);
  assert.equal(r.ok, true); assert.equal(r.receipt.finiteWithin100, 1500); assert.equal(r.receipt.receivedBytesSha256, sha(input));
  assert.equal(r.receipt.source.status, 'reader-attested');
  for (let i = 0; i < 1536; i++) assert.equal(target.chaosEmb12x128[i], i < 1500 ? 20 : Math.fround(Math.sin((i + 1) * .70710678) * .65));
  assert.equal(r.receipt.effectiveSha256, sha(Buffer.from(target.chaosEmb12x128.buffer)));
  const bad = chaos(); input.writeFloatLE(NaN, 0);
  assert.equal(A.prepareChaosSync(begin(A, bad, A.CHAOS), bad, input), null); assert.equal(bad.chaosEmb12x128[0], 10);
});

test('graph and chaos delayed hashing cannot commit after markRestored', async () => {
  for (const kind of ['graph', 'chaos']) {
    const { api, release } = delayedBrowser(), target = kind === 'graph' ? graph() : chaos();
    const id = kind === 'graph' ? api.GRAPH : api.CHAOS;
    const pending = kind === 'graph' ? api.prepareGraph(begin(api, target, id), target, stats()) : api.prepareChaos(begin(api, target, id), target, bytes());
    api.markRestored(target, id); const before = snapshot(target); release();
    assert.equal(await pending, null); assert.deepEqual(snapshot(target), before);
    assert.equal(api.inspect(target, id).phase, 'canonical-restored'); assert.equal(begin(api, target, id), null);
    api.invalidate(target, id); assert.equal(begin(api, target, id), null, 'Invalidate must not reopen restored ownership');
  }
});

test('ready candidate revoked before commit cannot change restored bytes or flags', () => {
  const target = chaos(), c = A.prepareChaosSync(begin(A, target, A.CHAOS), target, bytes());
  A.markRestored(target, A.CHAOS); target.chaosEmb12x128.fill(9); const before = snapshot(target);
  assert.equal(A.commit(c, target).status, 'stale'); assert.deepEqual(snapshot(target), before);
});

test('new begin supersedes old generation; old async completion cannot change newest status', async () => {
  const { api, release } = delayedBrowser(), target = chaos();
  const old = api.prepareChaos(begin(api, target, api.CHAOS), target, bytes(1));
  const newest = api.prepareChaos(begin(api, target, api.CHAOS), target, bytes(2)); release();
  assert.equal(await old, null); const c = await newest;
  assert.equal(api.commit(c, target).ok, true); assert.equal(target.chaosEmb12x128[0], 2); assert.equal(api.inspect(target, api.CHAOS).commits, 1);
});

test('replacement target, duplicate candidate and duplicate request are rejected', async () => {
  const old = graph(), replacement = graph(), handle = begin(A, old, A.GRAPH);
  const c = await A.prepareGraph(handle, old, stats()); assert.equal(await A.prepareGraph(handle, old, stats()), null);
  const before = snapshot(replacement); assert.equal(A.commit(c, replacement).status, 'stale'); assert.deepEqual(snapshot(replacement), before);
  assert.equal(A.commit(c, old).ok, false, 'Wrong-target attempt consumes the candidate');
  const target = chaos(), candidate = A.prepareChaosSync(begin(A, target, A.CHAOS), target, bytes());
  assert.equal(A.commit(candidate, target).ok, true); assert.equal(A.commit(candidate, target).ok, false);
});

test('aliases sharing an actual target share generation and restored lock', () => {
  const owner = { direct: chaos() }; owner.forwarded = owner.direct;
  const c = A.prepareChaosSync(begin(A, owner.direct, A.CHAOS), owner.direct, bytes());
  A.markRestored(owner.forwarded, A.CHAOS); assert.equal(A.commit(c, owner.direct).ok, false);
  assert.equal(begin(A, owner.direct, A.CHAOS), null); assert.equal(A.inspect(owner.forwarded, A.CHAOS).phase, 'canonical-restored');
});

test('input objects and input bytes are owned before hashing; later caller mutation cannot change candidate', async () => {
  const { api, release } = delayedBrowser(), g = graph(), s = stats(), c = chaos(), input = bytes(.5);
  const gp = api.prepareGraph(begin(api, g, api.GRAPH), g, s), cp = api.prepareChaos(begin(api, c, api.CHAOS), c, input);
  s.compactEdges[0][0] = 42; s.topHubs[0].name = 'tampered'; input.fill(0); release();
  assert.equal(api.commit(await gp, g).ok, true); assert.equal(g.celegansEdgeSrc512[0], 1); assert.equal(g.celegansHubNames64[0], 'new-a');
  assert.equal(api.commit(await cp, c).ok, true); assert.equal(c.chaosEmb12x128[0], .5);
});

test('target byte or metadata changes during hashing cause all-or-none rejection', async () => {
  for (const mutation of [g => { g.celegansEdgeType512[511] = 0; }, g => { g.celegansTotalEdges++; }, g => { g.celegansHubNames64[63] = 'changed'; }]) {
    const { api, release } = delayedBrowser(), target = graph();
    const p = api.prepareGraph(begin(api, target, api.GRAPH), target, stats()); mutation(target); const expected = snapshot(target); release();
    assert.equal(api.commit(await p, target).ok, false); assert.deepEqual(snapshot(target), expected);
  }
});

test('replaced views, detached buffers and nonwritable fields reject before any commit', () => {
  for (const mutation of [g => { g.celegansEdgeDst512 = new Uint16Array(g.celegansEdgeDst512); },
    g => { Object.defineProperty(g, 'celegansGapJunctionEdges', { writable: false }); },
    g => { Object.defineProperty(g.celegansHubNames64, '2', { writable: false }); }]) {
    const target = graph(), c = A.prepareGraphSync(begin(A, target, A.GRAPH), target, stats()); mutation(target); const expected = snapshot(target);
    assert.equal(A.commit(c, target).ok, false); assert.deepEqual(snapshot(target), expected);
  }
  const target = chaos(), c = A.prepareChaosSync(begin(A, target, A.CHAOS), target, bytes());
  structuredClone(target.chaosEmb12x128.buffer, { transfer: [target.chaosEmb12x128.buffer] });
  assert.equal(A.commit(c, target).ok, false); assert.equal(target.loadedBinaryChaosEmb, false);
});

test('captured native typed writes bypass shadow methods; target accessors never execute', () => {
  const target = graph(); target.celegansEdgeSrc512.set = () => { throw Error('shadow set executed'); };
  const c = A.prepareGraphSync(begin(A, target, A.GRAPH), target, stats()); assert.equal(A.commit(c, target).ok, true);
  const bad = graph(); let reads = 0; Object.defineProperty(bad, 'celegansTotalEdges', { get() { reads++; return 9; } });
  assert.equal(A.prepareGraphSync(begin(A, bad, A.GRAPH), bad, stats()), null); assert.equal(reads, 0);
});

test('malformed graph, no-op graph and accessor inputs never partially write', () => {
  const target = graph(), before = snapshot(target);
  for (const s of [{ ...stats(), compactEdges: [[1, 2, 3], [4]] }, { ...stats(), compactEdges: [[1, 2, Infinity]] },
    { ...stats(), topHubs: [{ name: 'good' }, { name: 9 }] }, { ...stats(), totalEdges: 0 }, { ...stats(), totalEdges: -1 }]) {
    assert.equal(A.prepareGraphSync(begin(A, target, A.GRAPH), target, s), null); assert.deepEqual(snapshot(target), before);
  }
  let reads = 0; const s = stats(); Object.defineProperty(s, 'compactEdges', { get() { reads++; return []; } });
  assert.equal(A.prepareGraphSync(begin(A, target, A.GRAPH), target, s), null); assert.equal(reads, 0);
});

test('expected source mismatch and false full-source hash fail closed', () => {
  const target = chaos(), input = bytes(), before = snapshot(target);
  assert.equal(A.prepareChaosSync(begin(A, target, A.CHAOS, { expectedSourceDigest: '0'.repeat(64) }), target, input, { sourceDigest: sha(input) }), null);
  assert.equal(A.prepareChaosSync(begin(A, target, A.CHAOS), target, input, { sourceDigest: '0'.repeat(64), sourceByteLength: 6144, sourceDigestObserved: true }), null);
  assert.deepEqual(snapshot(target), before);
  const p = { sourceDigest: '0'.repeat(64), sourceByteLength: 8000, sourceDigestObserved: true };
  const r = A.commit(A.prepareChaosSync(begin(A, target, A.CHAOS), target, input, p), target);
  assert.equal(r.ok, true); assert.equal(r.receipt.source.status, 'reader-attested'); assert.equal(r.receipt.receivedBytesSha256, sha(input));
  assert.notEqual(r.receipt.source.sourceDigest, r.receipt.receivedBytesSha256, 'Prefix receipt must not pretend to verify whole file');
});

test('input/output shared buffers, resizable buffers and overlapping output views reject', () => {
  const target = chaos();
  if (typeof SharedArrayBuffer === 'function') {
    assert.equal(A.prepareChaosSync(begin(A, target, A.CHAOS), target, new Uint8Array(new SharedArrayBuffer(6144))), null);
    target.chaosEmb12x128 = new Float32Array(new SharedArrayBuffer(6144));
    assert.equal(A.prepareChaosSync(begin(A, target, A.CHAOS), target, bytes()), null);
  }
  if (Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')) {
    const resizable = new ArrayBuffer(6144, { maxByteLength: 12288 }), ordinary = chaos();
    assert.equal(A.prepareChaosSync(begin(A, ordinary, A.CHAOS), ordinary, resizable), null);
    assert.match(A.inspect(ordinary, A.CHAOS).reason, /Resizable/);
  }
  const g = graph(); g.celegansEdgeDst512 = g.celegansEdgeSrc512;
  assert.equal(A.prepareGraphSync(begin(A, g, A.GRAPH), g, stats()), null);
});

test('byte input bounds and detached inputs reject without invoking loaders or mutating target', () => {
  const target = chaos(), before = snapshot(target);
  for (const input of [new Uint8Array(6143), new Uint8Array(65537), new DataView(new ArrayBuffer(6144))]) {
    assert.equal(A.prepareChaosSync(begin(A, target, A.CHAOS), target, input), null);
    assert.deepEqual(snapshot(target), before);
  }
  const detached = new ArrayBuffer(6144); structuredClone(detached, { transfer: [detached] });
  assert.equal(A.prepareChaosSync(begin(A, target, A.CHAOS), target, detached), null);
  assert.deepEqual(snapshot(target), before);
  const large = Buffer.alloc(65536); bytes(.75).copy(large);
  const r = A.commit(A.prepareChaosSync(begin(A, target, A.CHAOS), target, large,
    { sourceDigest: sha(large), sourceByteLength: large.length, sourceDigestObserved: true }), target);
  assert.equal(r.ok, true); assert.equal(r.receipt.receivedByteLength, 65536);
  assert.equal(target.chaosEmb12x128[0], .75); assert.equal(r.receipt.consumedPrefixSha256, sha(large.subarray(0, 6144)));
});

test('asset fields may share nonoverlapping backing ranges without losing view identities', () => {
  const target = graph(), buffer = new ArrayBuffer(3072);
  target.celegansEdgeSrc512 = new Uint16Array(buffer, 0, 512); target.celegansEdgeDst512 = new Uint16Array(buffer, 1024, 512);
  target.celegansEdgeWeight512 = new Int8Array(buffer, 2048, 512); target.celegansEdgeType512 = new Uint8Array(buffer, 2560, 512);
  const views = [target.celegansEdgeSrc512, target.celegansEdgeDst512, target.celegansEdgeWeight512, target.celegansEdgeType512];
  assert.equal(A.commit(A.prepareGraphSync(begin(A, target, A.GRAPH), target, stats()), target).ok, true);
  assert.equal(target.celegansEdgeSrc512, views[0]); assert.equal(target.celegansEdgeDst512, views[1]);
  assert.equal(target.celegansEdgeWeight512, views[2]); assert.equal(target.celegansEdgeType512, views[3]);
});

test('browser API has no sync fallback and opaque handles cannot be forged', async () => {
  const { api, release } = delayedBrowser(), target = chaos();
  assert.equal(api.prepareChaosSync, undefined); assert.equal(api.prepareGraphSync, undefined);
  assert.equal(await api.prepareChaos({}, target, api.CHAOS, bytes()), null);
  assert.equal(api.commit({}, target).ok, false);
  const handle = begin(api, target, api.CHAOS); assert.deepEqual(Object.keys(handle), []); assert.ok(Object.isFrozen(handle));
  const p = api.prepareChaos(handle, target, bytes()); release(); assert.equal(api.commit(await p, target).ok, true);
});

test('hashing failure leaves all target fields intact and reports a bounded rejection', async () => {
  const api = vm.runInNewContext(source + ';AliveAssetHydration', { TextEncoder, crypto: { subtle: { digest: async () => { throw Error('hash unavailable'); } } } });
  const target = graph(), before = snapshot(target);
  assert.equal(await api.prepareGraph(begin(api, target, api.GRAPH), target, stats()), null);
  assert.deepEqual(snapshot(target), before); assert.equal(api.inspect(target, api.GRAPH).phase, 'rejected');
  assert.match(api.inspect(target, api.GRAPH).reason, /hash unavailable/);
});

test('isCurrent exposes only read-only admission for an unconsumed exact-target request', () => {
  const target = chaos(), other = chaos(), first = begin(A, target, A.CHAOS);
  const before = A.inspect(target, A.CHAOS);
  assert.equal(A.isCurrent(first, target), true);
  assert.equal(A.isCurrent(first, other), false);
  assert.equal(A.isCurrent({}, target), false);
  assert.equal(A.isCurrent(null, target), false);
  assert.deepEqual(A.inspect(target, A.CHAOS), before, 'Checks do not change request state');
  const second = begin(A, target, A.CHAOS);
  assert.equal(A.isCurrent(first, target), false, 'Superseded request');
  assert.equal(A.isCurrent(second, target), true);
  const candidate = A.prepareChaosSync(second, target, bytes());
  assert.ok(candidate); assert.equal(A.isCurrent(second, target), false, 'Preparation consumes request');
  assert.equal(A.isCurrent(candidate, target), false, 'Candidate cannot impersonate request');
  assert.equal(A.commit(candidate, target).ok, true, 'Read-only check does not consume candidate');
  const third = begin(A, target, A.CHAOS); A.markRestored(target, A.CHAOS);
  assert.equal(A.isCurrent(third, target), false);
  assert.equal(A.isCurrent(first, target), false);
});
