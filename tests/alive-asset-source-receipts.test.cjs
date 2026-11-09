'use strict';

// Execute only the production asset IPC handler with a bounded in-memory file
// reader. No Electron, real IPC, models, profiles or external files are used.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const start = "  ipcMain.handle('ported-brains-bridge', (event) => {";
const end = "  ipcMain.handle('deep-dark-web-probe', async (event, payload = {}) => {";
assert.equal(source.split(start).length, 2); assert.equal(source.split(end).length, 2);
const handlerSource = source.slice(source.indexOf(start), source.indexOf(end));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function fixture({ declaredChaosSize, truncateChaos = false, growChaos = false } = {}) {
  const csv = Buffer.from('source,target,weight,type\nA,B,2,chemical\nB,A,3,electrical\n');
  const chaos = Buffer.alloc(8192, 0); chaos.writeFloatLE(0.25, 0); chaos[8191] = 7;
  const files = new Map([['celegans_herm_full_edgelist.csv', csv], ['chaos_emb.f32', chaos]]);
  const open = new Map(); let next = 1, opens = 0, reads = 0, closes = 0, handler;
  const fileReader = {
    existsSync(filename) { return files.has(path.basename(filename)); },
    openSync(filename) { const key = path.basename(filename), id = next++; opens++; open.set(id, { key, bytes: files.get(key), offset: 0 }); return id; },
    fstatSync(id) { const file = open.get(id); return { size: file.key === 'chaos_emb.f32' && declaredChaosSize !== undefined ? declaredChaosSize : file.bytes.length }; },
    readSync(id, output, offset, length) {
      const file = open.get(id); reads++;
      if (file.key === 'chaos_emb.f32' && truncateChaos) return 0;
      if (file.key === 'chaos_emb.f32' && growChaos && file.offset === file.bytes.length) { output[offset] = 1; file.offset++; return 1; }
      const count = Math.min(length, file.bytes.length - file.offset);
      if (count <= 0) return 0;
      file.bytes.copy(output, offset, file.offset, file.offset + count); file.offset += count; return count;
    },
    closeSync(id) { closes++; open.delete(id); }
  };
  const context = { fs: fileReader, path, crypto, Buffer, __dirname: '/synthetic-app',
    _cachedPortedBrainsPayload: null, fromChrome: event => event?.trusted === true,
    ipcMain: { handle(name, callback) { assert.equal(name, 'ported-brains-bridge'); handler = callback; } } };
  vm.runInNewContext(handlerSource, context);
  return { get: () => handler({ trusted: true }), untrusted: () => handler({ trusted: false }), files, csv, chaos,
    counts: () => ({ opens, reads, closes, outstanding: open.size }) };
}

test('asset receipts bind the exact parsed CSV and complete source bytes behind a truncated chaos transport', () => {
  const f = fixture(), result = f.get();
  assert.equal(result.ok, true);
  assert.equal(result.celegansStats.totalEdges, 2);
  assert.equal(result.celegansStats.chemicalEdges, 1);
  assert.equal(result.celegansStats.gapJunctionEdges, 1);
  assert.equal(result.assetProvenance.celegans.sourceDigest, hash(f.csv));
  assert.equal(result.assetProvenance.celegans.sourceByteLength, f.csv.length);
  assert.equal(result.assetProvenance.celegans.sourceDigestObserved, true);
  assert.equal(result.assetProvenance.chaos.sourceDigest, hash(f.chaos));
  assert.equal(result.assetProvenance.chaos.sourceByteLength, 8192);
  const transported = Buffer.from(result.chaosEmbBase64, 'base64');
  assert.equal(transported.length, 6144); assert.deepEqual(transported, f.chaos.subarray(0, 6144));
  assert.notEqual(hash(transported), result.assetProvenance.chaos.sourceDigest);
  assert.equal(f.counts().outstanding, 0);
});

test('cached receipts continue to identify cached parsed bytes after source replacement', () => {
  const f = fixture(), before = f.get(), counts = f.counts();
  f.files.set('celegans_herm_full_edgelist.csv', Buffer.from('unrelated replacement'));
  f.files.set('chaos_emb.f32', Buffer.alloc(6144, 255));
  const after = f.get();
  assert.equal(after, before);
  assert.equal(after.assetProvenance.celegans.sourceDigest, hash(f.csv));
  assert.equal(after.assetProvenance.chaos.sourceDigest, hash(f.chaos));
  assert.deepEqual(f.counts(), counts);
});

test('oversize, shrinking and growing sources reject without cached success or leaked descriptor', () => {
  for (const options of [{ declaredChaosSize: 65537 }, { truncateChaos: true }, { growChaos: true }]) {
    const f = fixture(options), result = f.get();
    assert.equal(result.ok, false); assert.match(result.error, /bound|changed|grew/);
    assert.equal(f.counts().outstanding, 0);
    assert.equal(f.counts().opens, f.counts().closes);
    if (options.declaredChaosSize) assert.equal(f.counts().reads, 0);
  }
});

test('untrusted callers cannot cause an asset read', () => {
  const f = fixture(); assert.equal(f.untrusted().ok, false);
  assert.equal(f.counts().opens, 0); assert.equal(f.counts().reads, 0);
});
