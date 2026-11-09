'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const builder = require('./build-portable.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gigachad-portable-fixture-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (relative, value) => { const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); };
  const pkg = { name: 'fixture', version: '2.0.0', main: 'main.js', dependencies: { electron: '45.2.3' } };
  const sources = ['package.json', 'main.js', 'preload.js', 'index.html', 'config.js', 'config.example.json', 'laya_sidecar.py', 'LICENSE', 'NOTICE.md',
    'systems/generated/authentic-asmodensius.js', 'systems/generated/authentic-asmodensius.manifest.json', 'brains/cqm-xylos/cqm_kernels.wasm', 'brains/tsotchke-diffusion/models/chaos_emb.f32',
    'docs/RELEASE.md', 'assets/icon.ico', 'config.json', 'nested/config.json', '.env', '.env.example', 'research_notes/private.json', 'tests/example.test.cjs', 'gigachad-2026.ini'];
  for (const source of sources) put(source, source === 'package.json' ? JSON.stringify(pkg) + '\n' : source + '\n');
  // An actual temporary Git index verifies clean staged-source admission. No
  // operation targets the application repository, remote or user's Git profile.
  const empty = path.join(root, 'empty-git-template'); fs.mkdirSync(empty);
  const gitEnv = { ...process.env };
  for (const key of Object.keys(gitEnv)) if (key.startsWith('GIT_')) delete gitEnv[key];
  gitEnv.GIT_CONFIG_NOSYSTEM = '1'; gitEnv.GIT_CONFIG_GLOBAL = path.join(empty, 'empty-config');
  fs.writeFileSync(gitEnv.GIT_CONFIG_GLOBAL, '');
  const git = args => execFileSync('git', args, { cwd: root, env: gitEnv, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  git(['init', '--template=' + empty]); git(['config', 'core.autocrlf', 'false']); git(['add', '--', ...sources]);
  git(['-c', 'user.name=Portable fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=' + empty, 'commit', '-m', 'Synthetic fixture only']);
  put('untracked-private.js', 'MUST NOT SHIP');
  const electron = 'node_modules/electron/';
  put(electron + 'package.json', JSON.stringify({ version: '45.2.3' })); put(electron + 'path.txt', 'electron.exe');
  const binary = Buffer.alloc(128); binary.write('MZ', 0); binary.writeUInt32LE(64, 60); binary.write('PE\0\0', 64); binary.writeUInt16LE(0x8664, 68);
  put(electron + 'dist/electron.exe', binary);
  for (const [name, value] of Object.entries({ 'electron_wer.dll': 'fixture crash DLL', LICENSE: 'Electron runtime license', 'LICENSES.chromium.html': 'Chromium notices', version: '45.2.3', 'resources/default_app.asar': 'fixture archive', 'locales/en-US.pak': 'fixture locale' })) put(electron + 'dist/' + name, value);
  return { root, put, pkg, git, output: path.join(root, 'dist', 'fixture-win32-x64') };
}

test('portable builder packages only staged release files, renames executable/crash DLL and verifies every copy', t => {
  const f = fixture(t), result = builder.build({ root: f.root, output: f.output });
  assert.equal(result.executable, path.join(fs.realpathSync.native(f.root), 'dist', 'fixture-win32-x64', 'GIGACHAD.exe'));
  assert.ok(fs.existsSync(path.join(f.output, 'GIGACHAD_wer.dll')));
  assert.equal(fs.existsSync(path.join(f.output, 'electron.exe')), false);
  const manifest = JSON.parse(fs.readFileSync(result.manifest, 'utf8'));
  assert.equal(manifest.electronVersion, '45.2.3'); assert.equal(manifest.status, 'verified-file-copy');
  for (const row of manifest.files) {
    const bytes = fs.readFileSync(path.join(f.output, row.destination));
    assert.equal(bytes.length, row.bytes); assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), row.sha256);
  }
  for (const required of ['LICENSE', 'NOTICE.md', '.env.example', 'docs/RELEASE.md', 'brains/cqm-xylos/cqm_kernels.wasm', 'brains/tsotchke-diffusion/models/chaos_emb.f32']) assert.ok(fs.existsSync(path.join(f.output, 'resources', 'app', required)), required);
  for (const absent of ['config.json', 'nested/config.json', '.env', 'gigachad-2026.ini', 'research_notes/private.json', 'tests/example.test.cjs', 'untracked-private.js', 'node_modules']) assert.equal(fs.existsSync(path.join(f.output, 'resources', 'app', absent)), false, absent);
  assert.equal(fs.readFileSync(path.join(f.output, 'LICENSE'), 'utf8'), 'Electron runtime license');
  assert.equal(fs.readFileSync(path.join(f.output, 'LICENSES.chromium.html'), 'utf8'), 'Chromium notices');
  assert.throws(() => builder.build({ root: f.root, output: f.output }), /overwrite refused/);
});

test('unstaged application edits fail before creating output', t => {
  const f = fixture(t); f.put('main.js', 'unstaged change');
  assert.throws(() => builder.build({ root: f.root, output: f.output }), /unstaged changes/);
  assert.equal(fs.existsSync(f.output), false);
});

test('installed version, Windows executable identity and x64 architecture are required', t => {
  const f = fixture(t);
  assert.equal(builder.validateRuntime(f.root, f.pkg).version, '45.2.3');
  f.put('node_modules/electron/dist/version', '45.2.4'); assert.throws(() => builder.validateRuntime(f.root, f.pkg), /versions must match/);
  f.put('node_modules/electron/dist/version', '45.2.3'); f.put('node_modules/electron/path.txt', 'electron'); assert.throws(() => builder.validateRuntime(f.root, f.pkg), /Windows Electron/);
  f.put('node_modules/electron/path.txt', 'electron.exe'); f.put('node_modules/electron/dist/electron.exe', Buffer.alloc(128)); assert.throws(() => builder.validateRuntime(f.root, f.pkg), /DOS header/);
});

test('source links, destination links, escapes and unreviewed runtime external dependencies reject', t => {
  const f = fixture(t), other = path.join(f.root, 'other'); fs.mkdirSync(other);
  fs.symlinkSync(other, path.join(f.root, 'linked'), 'junction');
  f.put('other/file.js', 'fixture'); assert.throws(() => builder.sourceFile(f.root, 'linked/file.js'), /link refused/);
  assert.throws(() => builder.sourceFile(f.root, '../escape.js'), /Unsafe/);
  assert.throws(() => builder.outputPath(f.root, path.join(f.root, 'outside')), /direct child/);
  fs.symlinkSync(other, path.join(f.root, 'dist'), 'junction');
  assert.throws(() => builder.outputPath(f.root, f.output), /Linked dist/); fs.unlinkSync(path.join(f.root, 'dist'));
  f.pkg.dependencies.other = '1.0.0'; f.put('package.json', JSON.stringify(f.pkg)); f.git(['add', 'package.json']);
  assert.throws(() => builder.build({ root: f.root, output: f.output }), /external dependencies/);
  fs.unlinkSync(path.join(f.root, 'linked'));
});

test('file exclusion rules retain runtime assets and reject secrets at any depth', () => {
  for (const file of ['main.js', 'systems/generated/runtime.js', 'assets/icon.ico', 'brains/source.ts', 'LICENSE', 'NOTICE.md', '.env.example']) assert.equal(builder.exclude(file), null, file);
  for (const file of ['nested/config.json', '.env.production', 'docs/private.key', 'secrets.json', 'tracker-allowlist.local.txt', 'profiles/state.json', 'models/model.onnx', 'docs/report.pdf']) assert.ok(builder.exclude(file), file);
  for (const file of ['a/../b.js', 'C:/private.js', '/file.js', 'a\\b.js', 'folder./x.js']) assert.throws(() => builder.safeRelative(file));
});

test('Windows directory spelling aliases admit the same Git root and canonical output', { skip: process.platform !== 'win32' }, t => {
  const f = fixture(t), alias = path.join(path.dirname(f.root), path.basename(f.root).toUpperCase());
  if (!fs.existsSync(alias)) { t.skip('Temporary directory is case-sensitive; a spelling alias does not exist'); return; }
  assert.notEqual(fs.realpathSync(alias), fs.realpathSync(f.root), 'ordinary realpath retains the alias that triggered CI failure');
  assert.equal(builder.sameDirectory(alias, f.root), true);
  assert.equal(builder.indexFiles(alias).fingerprint, builder.indexFiles(f.root).fingerprint);
  const result = builder.build({ root: alias, output: path.join(alias, 'dist', 'alias-win32-x64') });
  assert.equal(result.output, path.join(fs.realpathSync.native(f.root), 'dist', 'alias-win32-x64'));
  assert.ok(fs.existsSync(result.manifest));
  assert.throws(() => builder.indexFiles(path.join(alias, 'docs')), /working-tree root/);
});

test('directory identity rejects other roots and distinct case-sensitive directories', t => {
  const f = fixture(t), other = path.join(f.root, 'Other'), distinctCase = path.join(f.root, 'other');
  fs.mkdirSync(other);
  assert.equal(builder.sameDirectory(f.root, other), false);
  assert.throws(() => builder.outputPath(f.root, path.join(other, 'dist', 'release')), /direct child/);
  if (!fs.existsSync(distinctCase)) {
    fs.mkdirSync(distinctCase);
    assert.equal(builder.sameDirectory(other, distinctCase), false, 'case-folding must not identify different directories');
  }
  assert.throws(() => builder.sameDirectory(f.root, path.join(f.root, 'main.js')), /existing directory/);
});
