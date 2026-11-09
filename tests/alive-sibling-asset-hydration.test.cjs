'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const sourcePaths = ['systems/alive-asset-hydration.js', 'systems/ported-multiverse-brains.js', 'systems/alife-25-bleeding-edge-models.js', 'index.html'];
const sources = Object.fromEntries(sourcePaths.map(p => [p, fs.readFileSync(path.join(root, p), 'utf8')]));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sourceHashes = Object.fromEntries(sourcePaths.map(p => [p, sha(sources[p])]));
function assetPayload(value = 0.25) {
  const f32 = new Float32Array(1536); f32.fill(value);
  return { ok: true, chaosEmbBase64: Buffer.from(f32.buffer).toString('base64'), celegansStats: {
    totalEdges: 7379, uniqueNeurons: 302, chemicalEdges: 6393, gapJunctionEdges: 986,
    topHubs: Array.from({ length: 4 }, (_, i) => ({ name: 'asset-hub-' + i, weightedDeg: 100 - i })),
    compactEdges: [[1, 2, 3, 1], [4, 5, -6, 0], [8, 9, 10, 1], [12, 13, -14, 0]] } };
}
function hostStatement() {
  const source = sources['index.html'], startToken = '          const bleedingAtRequest = this.bleedingEdge25Engine;';
  assert.equal(source.split(startToken).length - 1, 1);
  const start = source.indexOf(startToken), close = '          }).catch(() => {});', end = source.indexOf(close, start) + close.length;
  assert.ok(start >= 0 && end > start);
  return source.slice(start, end);
}
function createFixture({ commonJS = false, nodeCsv = null, bridgeEnabled = true } = {}) {
  let hold = false, waiters = [], resolveIPC, requests = 0, dispatchState = null, guard;
  let fileReads = 0, fileOffset = 0, fileOpens = 0, fileCloses = 0;
  const fakeFS = {
    existsSync: filename => Boolean(nodeCsv && filename.endsWith('celegans_herm_full_edgelist.csv')),
    openSync(filename) { assert.ok(filename.endsWith('celegans_herm_full_edgelist.csv')); fileOpens++; return 42; },
    fstatSync(fd) { assert.equal(fd, 42); return { size: nodeCsv.size ?? nodeCsv.bytes.length }; },
    readSync(fd, into, offset, length) {
      assert.equal(fd, 42); fileReads++;
      const count = Math.min(length, 23, Math.max(0, nodeCsv.bytes.length - fileOffset));
      nodeCsv.bytes.copy(into, offset, fileOffset, fileOffset + count); fileOffset += count; return count;
    },
    closeSync(fd) { assert.equal(fd, 42); fileCloses++; }
  };
  const pending = new Promise(resolve => { resolveIPC = resolve; });
  const bridge = { invoke(channel) {
    assert.equal(channel, 'ported-brains-bridge'); requests++;
    dispatchState = { graph: guard.inspect(context.subject.sibling, guard.GRAPH), chaos: guard.inspect(context.subject.brain, guard.CHAOS) };
    return pending;
  } };
  const subtle = { digest(algorithm, data) {
    const bytes = Uint8Array.from(data);
    if (hold) return new Promise(resolve => waiters.push(() => resolve(crypto.webcrypto.subtle.digest(algorithm, bytes))));
    return crypto.webcrypto.subtle.digest(algorithm, bytes);
  } };
  const context = vm.createContext({ TextEncoder, crypto: { subtle }, gigachad: bridgeEnabled ? bridge : undefined, ipcRenderer: bridge,
    atob: text => Buffer.from(text, 'base64').toString('binary'),
    ...(commonJS ? { Buffer, module: { exports: {} }, __dirname: path.join(root, 'systems'), require(name) {
      if (name === 'node:crypto' || name === 'crypto') return crypto;
      if (name === './alive-asset-hydration.js') return guard;
      if (name === 'fs') return fakeFS;
      if (name === 'path') return path;
      throw Error('Unexpected fixture import ' + name);
    } } : {}) });
  vm.runInContext('globalThis.window=globalThis;', context, { timeout: 1000 });
  vm.runInContext(sources[sourcePaths[0]], context, { timeout: 1000 });
  guard = context.AliveAssetHydration;
  if (commonJS) context.module = { exports: {} };
  const marker = '  globalScope.Heterogeneous7TierPrecisionArena = Heterogeneous7TierPrecisionArena;';
  assert.equal(sources[sourcePaths[1]].split(marker).length - 1, 1);
  vm.runInContext(sources[sourcePaths[1]].replace(marker, '  globalScope.__SiblingTestBrain = TsotchkeDaleStpDdimBrain;\n' + marker), context, { timeout: 1000 });
  if (commonJS) context.module = { exports: {} };
  vm.runInContext(sources[sourcePaths[2]], context, { timeout: 1000 });
  vm.runInContext(`
    function makeFederation(){
      const brain=Object.create(__SiblingTestBrain.prototype);
      brain.chaosEmb12x128=new Float32Array(1536).fill(10);brain.loadedBinaryChaosEmb=false;
      const federation=Object.create(PortedMultiverseBrainsFederation.prototype);
      federation.brain11TsotchkeDale=brain;federation.telemetryCalls=0;
      federation._buildTelemetrySnapshot=function(){this.telemetryCalls++;return {fixtureTelemetry:true};};
      return {brain,federation};
    }
    const {brain,federation}=makeFederation();
    const sibling=Object.create(SiblingBrainFusionEngine.prototype);
    Object.assign(sibling,{multiverse10Pantheon:federation,cqmWasmLoaded:false,
      celegansLoaded:false,celegansTotalEdges:9000,celegansUniqueNeurons:128,
      celegansChemicalEdges:8000,celegansGapJunctionEdges:1000,celegansActiveEdgeCount:7,
      celegansEdgeSrc512:new Uint16Array(512).fill(17),celegansEdgeDst512:new Uint16Array(512).fill(29),
      celegansEdgeWeight512:new Int8Array(512).fill(-70),celegansEdgeType512:new Uint8Array(512),
      celegansHubNames64:Array.from({length:64},(_,i)=>'restored-hub-'+i),celegansVoltage64:new Float64Array(64)});
    const originalHydrate=sibling.hydrateFromBridgePayload;
    sibling.hydrateFromBridgePayload=function(...args){globalThis.lastHydration=originalHydrate.apply(this,args);return globalThis.lastHydration;};
    const host={bleedingEdge25Engine:{siblingBrainFusion:sibling},portedMultiverseBrains:federation};
    function capture(){return JSON.stringify({
      src:Array.from(sibling.celegansEdgeSrc512),dst:Array.from(sibling.celegansEdgeDst512),
      weights:Array.from(sibling.celegansEdgeWeight512),types:Array.from(sibling.celegansEdgeType512),
      names:sibling.celegansHubNames64,loaded:sibling.celegansLoaded,total:sibling.celegansTotalEdges,
      neurons:sibling.celegansUniqueNeurons,chemical:sibling.celegansChemicalEdges,gap:sibling.celegansGapJunctionEdges,
      count:sibling.celegansActiveEdgeCount,chaos:Array.from(brain.chaosEmb12x128),chaosLoaded:brain.loadedBinaryChaosEmb});}
    globalThis.subject={sibling,brain,federation,host,makeFederation,capture};
  `, context, { timeout: 1000 });
  return { ...context.subject, guard, context, requests: () => requests, dispatch: () => dispatchState,
    fileIO: () => ({ reads: fileReads, bytes: fileOffset, opens: fileOpens, closes: fileCloses }),
    startConstructor: () => context.subject.sibling._initPortedBrainsFromNodeOrIpc(),
    startHost: () => vm.runInContext('(function(){' + hostStatement() + '}).call(subject.host)', context, { timeout: 1000 }),
    deliver: async value => { resolveIPC(value); await Promise.resolve(); await Promise.resolve(); return await context.lastHydration; },
    hold: () => { hold = true; }, pendingHashes: () => waiters.length,
    release: () => { hold = false; const saved = waiters; waiters = []; for (const resolve of saved) resolve(); } };
}
function restore(f) {
  f.guard.markRestored(f.sibling, f.guard.GRAPH); f.guard.markRestored(f.brain, f.guard.CHAOS);
  f.sibling.celegansEdgeWeight512.fill(-99); f.sibling.celegansActiveEdgeCount = 9;
  f.sibling.celegansHubNames64[0] = 'canonical-restored-hub'; f.brain.chaosEmb12x128.fill(12.5);
}
function checkCommitted(f, value = 0.25) {
  assert.equal(f.sibling.celegansActiveEdgeCount, 4); assert.equal(f.sibling.celegansLoaded, true);
  assert.deepEqual(Array.from(f.sibling.celegansEdgeSrc512.subarray(0, 4)), [1, 4, 8, 12]);
  assert.equal(f.sibling.celegansHubNames64[0], 'asset-hub-0'); assert.equal(f.sibling.celegansHubNames64[4], 'restored-hub-4');
  assert.ok(f.brain.chaosEmb12x128.every(v => v === value)); assert.equal(f.brain.loadedBinaryChaosEmb, true);
  assert.equal(f.guard.inspect(f.sibling, f.guard.GRAPH).commits, 1); assert.equal(f.guard.inspect(f.brain, f.guard.CHAOS).commits, 1);
}
function registerTests() {
test('constructor dispatch captures leases before IPC and restored state survives late response', async () => {
  const f = createFixture(); f.startConstructor(); assert.equal(f.requests(), 1);
  assert.ok(f.dispatch().graph.generation > 0); assert.ok(f.dispatch().chaos.generation > 0);
  restore(f); const before = f.capture(); assert.equal(await f.deliver(assetPayload()), false); assert.equal(f.capture(), before);
});
test('fresh browser response commits both assets and has explicitly unverified bridge provenance', async () => {
  const f = createFixture(); f.startConstructor(); assert.equal(await f.deliver(assetPayload()), true); checkCommitted(f);
  assert.equal(f.guard.inspect(f.sibling, f.guard.GRAPH).receipt.source.status, 'unverified');
  assert.equal(f.guard.inspect(f.brain, f.guard.CHAOS).receipt.source.status, 'unverified');
});
test('malformed graph preserves its complete arrays, mapping and metadata atomically', async () => {
  const f = createFixture(), before = f.capture(), p = assetPayload(); p.celegansStats.compactEdges[2] = [1, 2];
  const request = f.sibling.beginAssetHydration();
  assert.equal(await f.sibling.hydrateFromBridgePayload({ celegansStats: p.celegansStats }, request), false);
  assert.equal(f.capture(), before); assert.equal(f.guard.inspect(f.sibling, f.guard.GRAPH).commits, 0);
});
test('explicit null and consumed sibling bundles cannot reacquire or duplicate commits', async () => {
  const f = createFixture(), before = f.capture();
  assert.equal(await f.sibling.hydrateFromBridgePayload(assetPayload(), null), false); assert.equal(f.capture(), before);
  const request = f.sibling.beginAssetHydration(); assert.equal(await f.sibling.hydrateFromBridgePayload(assetPayload(), request), true);
  const after = f.capture(); assert.equal(await f.sibling.hydrateFromBridgePayload(assetPayload(0.75), request), false);
  assert.equal(f.capture(), after); checkCommitted(f);
});
test('revoked or superseded bundles cannot instantiate an otherwise valid WASM payload', async () => {
  for (const revoke of ['restored', 'superseded', 'chaos-only-restored']) {
    const f = createFixture(); let wasmCalls = 0;
    f.sibling._instantiateCqmWasmFromBuffer = function(){wasmCalls++;this.cqmWasmLoaded=true;return true;};
    const request = f.sibling.beginAssetHydration(), p = assetPayload(); p.wasmBase64 = Buffer.alloc(128, 1).toString('base64');
    if (revoke === 'restored') { f.guard.markRestored(f.sibling, f.guard.GRAPH); f.guard.markRestored(f.brain, f.guard.CHAOS); }
    else if (revoke === 'chaos-only-restored') f.guard.markRestored(f.brain, f.guard.CHAOS);
    else f.sibling.beginAssetHydration();
    const before = f.capture(); assert.equal(await f.sibling.hydrateFromBridgePayload(p, request), false);
    assert.equal(wasmCalls, 0); assert.equal(f.sibling.cqmWasmLoaded, false); assert.equal(f.capture(), before);
  }
});
test('replacing the sibling federation before delivery rejects both graph and old federation writes', async () => {
  const f = createFixture(); f.startConstructor(); const before = f.capture();
  const replacement = f.makeFederation(); f.sibling.multiverse10Pantheon = replacement.federation;
  assert.equal(await f.deliver(assetPayload()), false); assert.equal(f.capture(), before);
  assert.ok(replacement.brain.chaosEmb12x128.every(v => v === 10));
});
test('replacing the sibling federation DURING awaited hashing rejects both pending commits', async () => {
  const f = createFixture(); f.hold(); const before = f.capture(), request = f.sibling.beginAssetHydration();
  const pending = f.sibling.hydrateFromBridgePayload(assetPayload(), request); assert.ok(f.pendingHashes() > 0);
  const replacement = f.makeFederation(); f.sibling.multiverse10Pantheon = replacement.federation;
  f.release(); assert.equal(await pending, false); assert.equal(f.capture(), before);
  assert.equal(f.guard.inspect(f.sibling, f.guard.GRAPH).commits, 0); assert.equal(f.guard.inspect(f.brain, f.guard.CHAOS).commits, 0);
  assert.ok(replacement.brain.chaosEmb12x128.every(v => v === 10));
});
test('newer sibling request supersedes an older asynchronous request for both asset groups', async () => {
  const f = createFixture(); f.hold(); const first = f.sibling.beginAssetHydration();
  const old = f.sibling.hydrateFromBridgePayload(assetPayload(0.25), first);
  const fresh = f.sibling.beginAssetHydration(), next = f.sibling.hydrateFromBridgePayload(assetPayload(0.75), fresh);
  f.release(); assert.equal(await old, false); assert.equal(await next, true); checkCommitted(f, 0.75);
});
test('source receipts retain each producer identity and independently check chaos received bytes', async () => {
  const f = createFixture(), p = assetPayload(), bytes = Buffer.from(p.chaosEmbBase64, 'base64');
  p.assetProvenance = { celegans: { sourceDigest: 'b'.repeat(64), sourceByteLength: 245463, sourcePath: 'fixture.csv', sourceMode: 'fixture-graph' },
    chaos: { sourceDigest: sha(bytes), sourceByteLength: bytes.length, sourcePath: 'fixture.f32', sourceMode: 'fixture-chaos' } };
  assert.equal(await f.sibling.hydrateFromBridgePayload(p, f.sibling.beginAssetHydration()), true);
  const graph = f.guard.inspect(f.sibling, f.guard.GRAPH).receipt, chaos = f.guard.inspect(f.brain, f.guard.CHAOS).receipt;
  assert.equal(graph.source.sourceDigest, 'b'.repeat(64)); assert.equal(graph.source.status, 'provided-unverified');
  assert.equal(chaos.source.sourceDigest, sha(bytes)); assert.equal(chaos.receivedBytesSha256, sha(bytes));
});
test('actual host callback deduplicates a shared federation and preserves restored state', async () => {
  const fresh = createFixture(); fresh.startHost(); assert.equal(await fresh.deliver(assetPayload()), true); checkCommitted(fresh);
  assert.equal(fresh.federation.telemetryCalls, 1);
  const restored = createFixture(); restored.startHost(); restore(restored); const before = restored.capture();
  assert.equal(await restored.deliver(assetPayload()), false); assert.equal(restored.capture(), before);
});
test('actual host ownership and close predicates remain checked while hashes are pending', async () => {
  for (const change of ['replace-host-owner', 'closing']) {
    const f = createFixture(); f.hold(); f.startHost(); const before = f.capture();
    const delivery = f.deliver(assetPayload()); await Promise.resolve(); await Promise.resolve(); assert.ok(f.pendingHashes() > 0);
    if (change === 'closing') f.context.__alivePersistenceClosing = true;
    else f.host.bleedingEdge25Engine = { siblingBrainFusion: f.sibling };
    f.release(); assert.equal(await delivery, false); assert.equal(f.capture(), before);
  }
});
test('constructor request cannot apply delayed assets after final persistence starts closing', async () => {
  const f = createFixture(); f.startConstructor(); const before = f.capture();
  f.context.__alivePersistenceClosing = true;
  assert.equal(await f.deliver(assetPayload()), false); assert.equal(f.capture(), before);
});
test('CommonJS sibling hydration retains synchronous boolean compatibility', () => {
  const f = createFixture({ commonJS: true }), request = f.sibling.beginAssetHydration();
  const result = f.sibling.hydrateFromBridgePayload(assetPayload(), request);
  assert.equal(result, true); assert.equal(typeof result, 'boolean'); checkCommitted(f);
  assert.equal(f.sibling.hydrateFromBridgePayload(assetPayload(), request), false);
});
test('Node CSV loader uses bounded same-handle reads, exact source digest and no partial writes on size drift', () => {
  const csv = Buffer.from('source,target,weight,type\nA,B,3,chemical\nB,C,4,gap\nC,D,5,chemical\nD,A,6,electrical\n');
  const fresh = createFixture({ commonJS: true, bridgeEnabled: false, nodeCsv: { bytes: csv } });
  fresh.startConstructor(); assert.equal(fresh.sibling.celegansLoaded, true); assert.equal(fresh.sibling.celegansActiveEdgeCount, 4);
  const receipt = fresh.guard.inspect(fresh.sibling, fresh.guard.GRAPH).receipt;
  assert.equal(receipt.source.status, 'reader-attested'); assert.equal(receipt.source.sourceDigest, sha(csv));
  assert.equal(receipt.source.sourceByteLength, csv.length); assert.equal(fresh.fileIO().bytes, csv.length);
  assert.equal(fresh.fileIO().opens, 1); assert.equal(fresh.fileIO().closes, 1); assert.ok(fresh.fileIO().reads > 2);
  for (const size of [2 * 1024 * 1024 + 1, csv.length + 5, csv.length - 1]) {
    const f = createFixture({ commonJS: true, bridgeEnabled: false, nodeCsv: { bytes: csv, size } }), before = f.capture();
    f.startConstructor(); assert.equal(f.capture(), before); assert.equal(f.fileIO().opens, 1); assert.equal(f.fileIO().closes, 1);
    if (size > 2 * 1024 * 1024) assert.equal(f.fileIO().reads, 0);
  }
});
}
if (require.main === module) registerTests();
module.exports = { createFixture, assetPayload, restore, checkCommitted, sourceHashes, sourcePaths };
