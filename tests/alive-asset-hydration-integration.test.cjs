'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const guardSource = fs.readFileSync(path.join(root, 'systems/alive-asset-hydration.js'), 'utf8');
const portedSource = fs.readFileSync(path.join(root, 'systems/ported-multiverse-brains.js'), 'utf8');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function bytes(value = 0.25, extra = 0) {
  const f = new Float32Array(1536); f.fill(value);
  return Buffer.concat([Buffer.from(f.buffer), Buffer.alloc(extra, 0x5a)]);
}
function payload(value = 0.25) { return { chaosEmbBase64: bytes(value).toString('base64') }; }
function fixture({ commonJS = false, file = null, fileSize = null, guardMissing = false } = {}) {
  let held = false, releaseQueue = [], reads = 0, opens = 0, closes = 0;
  const disk = {
    openSync() { opens++; if (!file) throw Object.assign(Error('fixture file absent'), { code: 'ENOENT' }); return 42; },
    fstatSync() { return { isFile: () => true, size: fileSize ?? file.length }; },
    readSync(_fd, into, offset, length) { const n = Math.min(length, Math.max(0, file.length - reads)); file.copy(into, offset, reads, reads + n); reads += n; return n; },
    closeSync() { closes++; }
  };
  const subtle = { digest(algorithm, input) {
    const copy = Uint8Array.from(input);
    if (held) return new Promise(resolve => releaseQueue.push(() => resolve(crypto.webcrypto.subtle.digest(algorithm, copy))));
    return crypto.webcrypto.subtle.digest(algorithm, copy);
  } };
  let guard;
  const context = vm.createContext({ TextEncoder, crypto: { subtle }, atob: text => Buffer.from(text, 'base64').toString('binary'),
    ...(commonJS ? { Buffer, module: { exports: {} }, __dirname: path.join(root, 'systems'), require(name) {
      if (name === 'node:crypto' || name === 'crypto') return crypto;
      if (name === 'fs') return disk;
      if (name === 'path') return path;
      if (name === './alive-asset-hydration.js' && !guardMissing) return guard;
      throw Error('Unexpected fixture require: ' + name);
    } } : {}) });
  if (!guardMissing) {
    vm.runInContext(guardSource, context, { timeout: 1000 });
    guard = commonJS ? context.module.exports : context.AliveAssetHydration;
  }
  if (commonJS) context.module = { exports: {} };
  const exportAnchor = '  globalScope.Heterogeneous7TierPrecisionArena = Heterogeneous7TierPrecisionArena;';
  assert.equal(portedSource.split(exportAnchor).length - 1, 1);
  vm.runInContext(portedSource.replace(exportAnchor, '  globalScope.__AssetTestBrain = TsotchkeDaleStpDdimBrain;\n' + exportAnchor), context, { timeout: 1000 });
  vm.runInContext(`
    const brain = new __AssetTestBrain({});
    const federation = Object.create(PortedMultiverseBrainsFederation.prototype);
    federation.brain11TsotchkeDale = brain;
    federation.snapshotCalls = 0;
    federation._buildTelemetrySnapshot = function(){this.snapshotCalls++;return {count:this.snapshotCalls};};
    globalThis.subject = {brain,federation,newBrain:()=>new __AssetTestBrain({})};
  `, context, { timeout: 1000 });
  return { ...context.subject, guard, context, io: () => ({ reads, opens, closes }),
    hold: () => { held = true; },
    release: () => { held = false; const queue = releaseQueue; releaseQueue = []; for (const resolve of queue) resolve(); },
    queued: () => releaseQueue.length };
}
const arrayCopy = brain => Array.from(brain.chaosEmb12x128);

test('CommonJS hydration remains synchronous and records exact received/prefix digests', () => {
  const f = fixture({ commonJS: true });
  const data = bytes(0.5, 8), sourceDigest = sha(data);
  const bundle = f.federation.beginAssetHydration({ sourceKey: 'fixture-bridge', expectedSourceDigest: sourceDigest });
  const result = f.federation.hydrateFromBridgePayload({ chaosEmbBase64: data.toString('base64'), assetProvenance: { chaos: {
    sourceDigest, sourceByteLength: data.length, sourcePath: 'fixture.f32', sourceMode: 'fixture' } } }, bundle);
  assert.equal(result, true); assert.equal(typeof result, 'boolean'); assert.equal(f.federation.snapshotCalls, 1);
  assert.ok(f.brain.chaosEmb12x128.every(v => v === 0.5));
  const receipt = f.guard.inspect(f.brain, f.guard.CHAOS).receipt;
  assert.equal(receipt.source.status, 'provided-unverified'); assert.equal(receipt.receivedBytesSha256, sha(data));
  assert.equal(receipt.consumedPrefixSha256, sha(data.subarray(0, 6144)));
  assert.equal(f.federation.hydrateFromBridgePayload(payload(0.8), bundle), false, 'one bundle cannot commit twice');
});

test('browser success is asynchronous, captures provenance, and refreshes telemetry only after commit', async () => {
  const f = fixture(); f.hold(); const before = arrayCopy(f.brain), p = payload(0.125);
  const bundle = f.federation.beginAssetHydration({ sourceKey: 'browser-fixture' });
  const pending = f.federation.hydrateFromBridgePayload(p, bundle);
  assert.equal(typeof pending.then, 'function'); assert.ok(f.queued() > 0);
  assert.deepEqual(arrayCopy(f.brain), before); assert.equal(f.federation.snapshotCalls, 0);
  p.chaosEmbBase64 = bytes(0.75).toString('base64');
  f.release(); assert.equal(await pending, true);
  assert.ok(f.brain.chaosEmb12x128.every(v => v === 0.125)); assert.equal(f.federation.snapshotCalls, 1);
  assert.equal(f.guard.inspect(f.brain, f.guard.CHAOS).receipt.source.status, 'unverified');
});

test('replacing the actual brain target before prepare rejects a captured bundle', async () => {
  const f = fixture(), old = f.brain, before = arrayCopy(old), bundle = f.federation.beginAssetHydration();
  const replacement = f.newBrain(); f.federation.brain11TsotchkeDale = replacement;
  const replacementBefore = arrayCopy(replacement);
  assert.equal(await f.federation.hydrateFromBridgePayload(payload(), bundle), false);
  assert.deepEqual(arrayCopy(old), before); assert.deepEqual(arrayCopy(replacement), replacementBefore);
  assert.equal(f.federation.snapshotCalls, 0);
});

test('replacing the actual brain target during async preparation prevents both old and new target writes', async () => {
  const f = fixture(); f.hold(); const before = arrayCopy(f.brain), bundle = f.federation.beginAssetHydration();
  const pending = f.federation.hydrateFromBridgePayload(payload(), bundle); assert.ok(f.queued() > 0);
  const replacement = f.newBrain(), replacementBefore = arrayCopy(replacement); f.federation.brain11TsotchkeDale = replacement;
  f.release(); assert.equal(await pending, false); assert.deepEqual(arrayCopy(f.brain), before);
  assert.deepEqual(arrayCopy(replacement), replacementBefore); assert.equal(f.federation.snapshotCalls, 0);
});

test('restore revokes an already dispatched response and denies fresh hydration and fallback reseeding', async () => {
  const f = fixture(); f.hold(); const bundle = f.federation.beginAssetHydration();
  const pending = f.federation.hydrateFromBridgePayload(payload(), bundle); assert.ok(f.queued() > 0);
  f.guard.markRestored(f.brain, f.guard.CHAOS); f.brain.chaosEmb12x128.fill(3.25); f.brain.loadedBinaryChaosEmb = true;
  f.release(); assert.equal(await pending, false); assert.equal(f.federation.beginAssetHydration(), null);
  assert.equal(await f.federation.hydrateFromBridgePayload(payload()), false);
  assert.equal(await f.brain.hydrateChaosEmbFromBase64(payload().chaosEmbBase64), false);
  assert.equal(f.brain._loadChaosEmbFromDiskOrSeed(), false);
  assert.ok(f.brain.chaosEmb12x128.every(v => v === 3.25)); assert.equal(f.federation.snapshotCalls, 0);
});

test('newer request supersedes old pending request and telemetry counts only the accepted commit', async () => {
  const f = fixture(); f.hold(); const first = f.federation.beginAssetHydration();
  const oldPending = f.federation.hydrateFromBridgePayload(payload(0.25), first);
  const second = f.federation.beginAssetHydration(), newPending = f.federation.hydrateFromBridgePayload(payload(0.75), second);
  f.release(); assert.equal(await oldPending, false); assert.equal(await newPending, true);
  assert.ok(f.brain.chaosEmb12x128.every(v => v === 0.75)); assert.equal(f.federation.snapshotCalls, 1);
});

test('target byte changes during preparation prevent overwrite without claiming a commit', async () => {
  const f = fixture(); f.hold(); const pending = f.federation.hydrateFromBridgePayload(payload(), f.federation.beginAssetHydration());
  f.brain.chaosEmb12x128[17] = 4.5; const changed = arrayCopy(f.brain);
  f.release(); assert.equal(await pending, false); assert.deepEqual(arrayCopy(f.brain), changed);
  assert.equal(f.federation.snapshotCalls, 0);
});

test('trusted parent ownership predicate fences stale relationships and rejects thrown or non-boolean outcomes', async () => {
  const f = fixture(); let current = true; f.hold();
  const bundle = f.federation.beginAssetHydration({ isCurrent: () => current });
  const before = arrayCopy(f.brain), pending = f.federation.hydrateFromBridgePayload(payload(), bundle);
  current = false; f.release(); assert.equal(await pending, false);
  assert.deepEqual(arrayCopy(f.brain), before); assert.equal(f.federation.snapshotCalls, 0);
  for (const isCurrent of [() => { throw Error('owner unavailable'); }, () => 1, () => Promise.resolve(true)]) {
    const token = f.federation.beginAssetHydration({ isCurrent });
    assert.equal(await f.federation.hydrateFromBridgePayload(payload(), token), false);
    assert.deepEqual(arrayCopy(f.brain), before);
  }
  assert.equal(f.federation.beginAssetHydration({ isCurrent: true }), null);
});

test('read-only bundle admission rejects superseded, consumed, restored and stale-parent leases', async () => {
  const f = fixture(); let current = true;
  const old = f.federation.beginAssetHydration(); assert.equal(f.federation.isAssetHydrationCurrent(old), true);
  const next = f.federation.beginAssetHydration({ isCurrent: () => current });
  assert.equal(f.federation.isAssetHydrationCurrent(old), false); assert.equal(f.federation.isAssetHydrationCurrent(next), true);
  current = false; assert.equal(f.federation.isAssetHydrationCurrent(next), false);
  current = true; f.hold(); const pending = f.federation.hydrateFromBridgePayload(payload(), next);
  assert.equal(f.federation.isAssetHydrationCurrent(next), false); f.release(); assert.equal(await pending, true);
  const restorable = f.federation.beginAssetHydration(); f.guard.markRestored(f.brain, f.guard.CHAOS);
  assert.equal(f.federation.isAssetHydrationCurrent(restorable), false);
});

test('bounded malformed, oversized, and nonfinite payloads cannot change live bytes or telemetry', async () => {
  for (const text of ['%', 'A'.repeat(87388), Buffer.alloc(6144, 0xff).toString('base64'), '////'.repeat(2048)]) {
    const f = fixture(), before = arrayCopy(f.brain);
    assert.equal(await f.federation.hydrateFromBridgePayload({ chaosEmbBase64: text }, f.federation.beginAssetHydration()), false);
    assert.deepEqual(arrayCopy(f.brain), before); assert.equal(f.brain.loadedBinaryChaosEmb, false); assert.equal(f.federation.snapshotCalls, 0);
  }
});

test('Node constructor reads only a bounded actual file, records reader attestation, and never reseeds later', () => {
  const data = bytes(0.375, 12), f = fixture({ commonJS: true, file: data });
  assert.ok(f.brain.chaosEmb12x128.every(v => v === 0.375)); assert.equal(f.brain.loadedBinaryChaosEmb, true);
  assert.deepEqual(f.io(), { reads: data.length, opens: 1, closes: 1 });
  const receipt = f.guard.inspect(f.brain, f.guard.CHAOS).receipt;
  assert.equal(receipt.source.status, 'reader-attested'); assert.equal(receipt.source.sourceDigest, sha(data));
  assert.equal(receipt.receivedBytesSha256, sha(data)); assert.equal(receipt.consumedPrefixSha256, sha(data.subarray(0, 6144)));
  f.brain.chaosEmb12x128.fill(7); assert.equal(f.brain._loadChaosEmbFromDiskOrSeed(), false);
  assert.ok(f.brain.chaosEmb12x128.every(v => v === 7)); assert.equal(f.io().opens, 1);
  const oversized = fixture({ commonJS: true, file: data, fileSize: 65537 });
  assert.equal(oversized.io().reads, 0); assert.equal(oversized.io().closes, 1); assert.equal(oversized.brain.loadedBinaryChaosEmb, false);
});

test('missing guard fails closed for hydration while allowing one constructor fallback', async () => {
  for (const commonJS of [false, true]) {
    const f = fixture({ commonJS, guardMissing: true, file: bytes(0.5) }), before = arrayCopy(f.brain);
    assert.equal(f.federation.beginAssetHydration(), null);
    assert.equal(await f.federation.hydrateFromBridgePayload(payload()), false);
    assert.equal(await f.brain.hydrateChaosEmbFromBase64(payload().chaosEmbBase64), false);
    assert.deepEqual(arrayCopy(f.brain), before); assert.equal(f.brain.loadedBinaryChaosEmb, false);
    f.brain.chaosEmb12x128.fill(9); assert.equal(f.brain._loadChaosEmbFromDiskOrSeed(), false);
    assert.ok(f.brain.chaosEmb12x128.every(v => v === 9));
  }
});
