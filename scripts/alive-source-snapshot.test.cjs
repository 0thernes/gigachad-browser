'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const snapshot = require('./alive-source-snapshot.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alive-source-snapshot-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (relative, data = relative) => { const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); };
  return { root, put };
}

test('allowlist retains runtime assets and finite embedded model exceptions, excludes profiles and secrets', () => {
  for (const name of ['main.js', 'systems/generated/authentic-asmodensius.js', 'brains/cqm-xylos/cqm_kernels.wasm', 'assets/gigachad.ico', 'brains/asmodensius-v40/celegans_herm_full_edgelist.csv', 'brains/tsotchke-diffusion/models/chaos_emb.f32', '.env.example']) assert.equal(snapshot.exclusionReason(name), null, name);
  for (const name of ['config.json', 'brains/config.json', '.env', '.env.production', 'gigachad-2026.ini', 'user-data/state.json', 'node_modules/test.js', '.git/config', 'research_notes/a.js', 'brains/cache/models/weights.json', 'brains/tsotchke-diffusion/models/new.onnx', 'user-credentials.json', 'key.pem', 'capture.log', 'guide.pdf']) assert.ok(snapshot.exclusionReason(name), name);
  for (const name of ['../main.js', 'x/../main.js', '/absolute.js', 'C:/source.js', 'x\\main.js']) assert.throws(() => snapshot.exclusionReason(name), /Invalid/);
});

test('snapshot destination is a fresh named evidence directory and cannot escape via junction', t => {
  const { root } = fixture(t), allowed = path.join(root, 'research_notes', 'alive-upgrade-2026-11-09');
  fs.mkdirSync(allowed, { recursive: true });
  const output = path.join(allowed, 'source-snapshot-unit');
  assert.equal(snapshot.outputPath(output, root), output);
  assert.throws(() => snapshot.outputPath(path.join(root, 'source-snapshot-unit'), root), /direct child/);
  fs.mkdirSync(output); assert.throws(() => snapshot.outputPath(output, root), /overwrite/);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'alive-snapshot-outside-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  const linkedRoot = path.join(root, 'nested'); fs.mkdirSync(linkedRoot);
  fs.symlinkSync(outside, path.join(linkedRoot, 'research_notes'), 'junction');
  assert.throws(() => snapshot.outputPath(path.join(linkedRoot, 'research_notes', 'alive-upgrade-2026-11-09', 'source-snapshot-unit'), linkedRoot), /outside/);
});

test('copies exact source bytes and checks complete post-copy source and destination hashes', t => {
  const { root, put } = fixture(t); put('main.js', 'console.log("fixture")\r\n'); put('assets/icon.ico', Buffer.from([0, 1, 255]));
  const files = ['assets/icon.ico', 'main.js'], destination = path.join(root, 'copy');
  const records = snapshot.copyVerifiedFiles(root, destination, files, () => files);
  assert.equal(records.length, 2);
  for (const record of records) {
    assert.deepEqual(fs.readFileSync(path.join(root, record.path)), fs.readFileSync(path.join(destination, record.path)));
    assert.equal(record.sha256, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, record.path))).digest('hex'));
  }
  assert.throws(() => snapshot.copyVerifiedFiles(root, destination, files, () => files), /overwrite/);
});

test('concurrent source mutation or added source rejects qualification without deleting either tree', t => {
  const { root, put } = fixture(t); put('main.js', 'original');
  const files = ['main.js'];
  assert.throws(() => snapshot.copyVerifiedFiles(root, path.join(root, 'changed'), files, () => files, () => put('main.js', 'mutation')), /Hash mismatch/);
  assert.equal(fs.readFileSync(path.join(root, 'main.js'), 'utf8'), 'mutation');
  assert.equal(fs.readFileSync(path.join(root, 'changed', 'main.js'), 'utf8'), 'original');
  assert.throws(() => snapshot.copyVerifiedFiles(root, path.join(root, 'added'), files, () => ['extra.js', 'main.js']), /file set changed/);
});

test('source links are rejected and tracked deletions are recorded without resurrection', t => {
  const { root, put } = fixture(t); put('source/main.js'); put('config.json', 'private');
  fs.symlinkSync(path.join(root, 'source'), path.join(root, 'linked'), 'junction');
  assert.throws(() => snapshot.inventory(root, ['linked/main.js']), /links/);
  const result = snapshot.inventory(root, ['source/main.js', 'deleted.js', 'config.json']);
  assert.deepEqual(result.files, ['source/main.js']);
  assert.equal(result.excluded.find(e => e.path === 'deleted.js').reason, 'tracked-but-absent-in-working-tree');
});

test('dependency junction resolves to explicit installation and cannot overwrite a destination', t => {
  const { root, put } = fixture(t); put('installed/package.json', '{}'); fs.mkdirSync(path.join(root, 'app'));
  const link = snapshot.linkDependencies(path.join(root, 'app'), path.join(root, 'installed'));
  assert.equal(fs.realpathSync(link.path), fs.realpathSync(path.join(root, 'installed')));
  assert.throws(() => snapshot.linkDependencies(path.join(root, 'app'), path.join(root, 'installed')), /already exists/);
  // Remove only the link before temporary tree cleanup; never recurse into target.
  fs.unlinkSync(link.path);
  assert.ok(fs.existsSync(path.join(root, 'installed', 'package.json')));
});
