'use strict';

// Manual Windows distribution, following Electron's application-distribution
// guide. Uses only the staged file roster and installed Electron; no downloads,
// installs, profile reads, app launches, source mutations or output deletion.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const EXE = 'GIGACHAD.exe', WER = 'GIGACHAD_wer.dll';
const EXCLUDED = new Set(['.git', '.github', 'node_modules', 'research_notes', 'tests', 'dist', 'out', 'build', 'target', 'user-data', 'profiles', 'logs', 'snapshots', '__pycache__', '.venv', 'venv', '.cache', '.pytest_cache', '.mypy_cache', '.ruff_cache', '.next', 'gigachadmedia']);
const EXTENSIONS = new Set('.js .cjs .mjs .ts .tsx .jsx .py .ps1 .bat .cmd .sh .html .css .scss .json .jsonl .yaml .yml .toml .md .txt .rst .csv .tsv .xml .xsd .svg .wgsl .glsl .vert .frag .zig .c .h .cpp .hpp .rs .go .java .scm .ss .sld .rkt .sql .cmake .cff .lock .wasm .ico .png .jpg .jpeg .webp .gif .woff .woff2 .ttf'.split(' '));
const NAMES = new Set(['LICENSE', 'NOTICE', 'VERSION', 'CODEOWNERS', 'Dockerfile', 'Makefile', 'CMakeLists.txt', '.env.example', '.gitignore', '.gitattributes', '.npmrc', '.gitkeep']);
const MODELS = new Set(['chaos_emb.f32', 'chaos_meta.json', 'chaos_unet.onnx', 'parity.json', 'qrng_presets.json', 'uncond_unet.onnx'].map(n => 'brains/tsotchke-diffusion/models/' + n));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const inside = (root, file) => { const rel = path.relative(root, file); return rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel); };
function directoryIdentity(directory) {
  // Ordinary realpath preserves caller case/8.3 spelling on Windows. Native
  // canonicalization and filesystem identity compare directories, not spellings.
  const canonical = fs.realpathSync.native(directory), stat = fs.statSync(canonical, { bigint: true });
  if (!stat.isDirectory()) throw new Error('Release directory must be an existing directory');
  return { canonical, dev: stat.dev, ino: stat.ino };
}
function sameDirectory(first, second) {
  const a = directoryIdentity(first), b = directoryIdentity(second);
  if (a.ino !== 0n && b.ino !== 0n) return a.dev === b.dev && a.ino === b.ino;
  // Some filesystems do not supply inode identities. Exact native canonical
  // paths remain safe; never case-fold distinct case-sensitive directories.
  return a.canonical === b.canonical;
}
function git(root, args) {
  const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
  // A caller's temporary worktree/index routing must not redirect release input.
  for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_EXTERNAL_DIFF', 'GIT_DIFF_OPTS']) delete env[key];
  return execFileSync('git', args, { cwd: root, env, encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
}

function safeRelative(value) {
  if (typeof value !== 'string' || !value || /[\x00-\x1f\\:]/.test(value) || path.isAbsolute(value) || value.split('/').some(p => !p || p === '.' || p === '..' || /[. ]$/.test(p))) throw new Error('Unsafe release-relative path');
  return value;
}
function exclude(relative) {
  safeRelative(relative);
  const parts = relative.split('/'), name = parts.at(-1), lower = name.toLowerCase();
  if (parts.slice(0, -1).some(p => EXCLUDED.has(p.toLowerCase()))) return 'excluded-private-generated-or-development-directory';
  if (lower === 'config.json' || lower.endsWith('.ini') || lower.endsWith('.test.cjs') || lower.startsWith('.env') && lower !== '.env.example' ||
      /(?:^|[._-])(?:credentials?|secrets?|tokens?)(?:[._-]|$)/i.test(name) || /\.(?:key|pem|pfx|p12|bak|backup|snapshot|log|local\.txt)$/i.test(name)) return 'local-configuration-secrets-log-or-test';
  if (parts.slice(0, -1).some(p => p.toLowerCase() === 'models') && !MODELS.has(relative)) return 'external-model-store';
  if (!MODELS.has(relative) && !EXTENSIONS.has(path.extname(name).toLowerCase()) && !NAMES.has(name)) return 'outside-runtime-source-document-asset-allowlist';
  return null;
}
function sourceFile(root, relative) {
  safeRelative(relative); let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Release source link refused: ' + relative);
  }
  if (!inside(root, current) || !fs.statSync(current).isFile()) throw new Error('Release source must be an internal regular file: ' + relative);
  return current;
}
function fingerprint(filename) {
  const fd = fs.openSync(filename, 'r');
  try {
    const before = fs.fstatSync(fd, { bigint: true });
    if (!before.isFile()) throw new Error('Cannot hash a non-file');
    const digest = crypto.createHash('sha256'), buffer = Buffer.alloc(1024 * 1024); let bytes = 0, count;
    while ((count = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) { digest.update(buffer.subarray(0, count)); bytes += count; }
    const after = fs.fstatSync(fd, { bigint: true }), named = fs.statSync(filename, { bigint: true });
    for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs']) if (before[key] !== after[key] || after[key] !== named[key]) throw new Error('Source changed while hashing: ' + filename);
    return { bytes, sha256: digest.digest('hex') };
  } finally { fs.closeSync(fd); }
}
function indexFiles(root) {
  const top = git(root, ['rev-parse', '--show-toplevel']).trim();
  if (!sameDirectory(top, root)) throw new Error('Release root must be the Git working-tree root');
  const raw = git(root, ['ls-files', '--stage', '-z']), rows = [], excluded = [], names = new Set();
  for (const entry of raw.split('\0').filter(Boolean)) {
    const match = /^(\d{6}) ([a-f0-9]{40,64}) (\d)\t([\s\S]+)$/.exec(entry);
    if (!match) throw new Error('Unrecognized Git index entry');
    const [, mode, objectId, stage, relative] = match, reason = exclude(relative);
    if (reason) { excluded.push({ path: relative, reason }); continue; }
    if (stage !== '0' || !['100644', '100755'].includes(mode)) throw new Error('Unmerged, linked or non-file staged source: ' + relative);
    if (names.has(relative.toLowerCase())) throw new Error('Case-colliding Windows source paths');
    names.add(relative.toLowerCase()); sourceFile(root, relative); rows.push({ path: relative, mode, objectId });
  }
  rows.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const changed = git(root, ['diff-files', '--name-only', '-z']).split('\0').filter(Boolean);
  if (changed.some(file => rows.some(row => row.path === file))) throw new Error('Included source has unstaged changes; stage the release before building');
  return { rows, excluded, fingerprint: hash(Buffer.from(JSON.stringify(rows))) };
}
function outputPath(root, value) {
  root = directoryIdentity(root).canonical;
  const requested = path.resolve(value), requestedParent = path.dirname(requested), dist = path.join(root, 'dist');
  if (path.basename(requestedParent) !== 'dist' || !/^[a-z0-9][a-z0-9._+-]*$/i.test(path.basename(requested)) ||
      !sameDirectory(path.dirname(requestedParent), root)) throw new Error('Output must be a named direct child of this repository dist directory');
  // Write through the canonical admitted root, including when --output used a
  // Windows short-name or case alias. The dist component itself may not be a link.
  const output = path.join(dist, path.basename(requested));
  if (fs.existsSync(output)) throw new Error('Portable output already exists; overwrite refused');
  if (fs.existsSync(dist) && fs.lstatSync(dist).isSymbolicLink()) throw new Error('Linked dist directory refused');
  return output;
}
function runtimeFiles(root) {
  const rows = [];
  function walk(relative) {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((a,b) => a.name < b.name ? -1 : 1)) {
      const name = relative ? relative + '/' + entry.name : entry.name; safeRelative(name);
      if (entry.isSymbolicLink()) throw new Error('Installed runtime link refused: ' + name);
      if (entry.isDirectory()) walk(name);
      else if (entry.isFile()) rows.push(name);
      else throw new Error('Installed runtime contains a nonregular entry');
    }
  }
  walk(''); return rows;
}
function validateRuntime(root, pkg) {
  const modules = path.join(root, 'node_modules'), electronRoot = path.join(modules, 'electron'), dist = path.join(electronRoot, 'dist');
  const packagePath = sourceFile(root, 'node_modules/electron/package.json'), installed = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const version = fs.readFileSync(sourceFile(root, 'node_modules/electron/dist/version'), 'utf8').trim();
  if (pkg.dependencies?.electron !== version || installed.version !== version || !/^\d+\.\d+\.\d+(?:[-+][a-z0-9.-]+)?$/i.test(version)) throw new Error('Pinned, installed and runtime Electron versions must match exactly');
  if (fs.readFileSync(sourceFile(root, 'node_modules/electron/path.txt'), 'utf8').trim() !== 'electron.exe') throw new Error('Installed runtime is not Windows Electron');
  const executable = sourceFile(dist, 'electron.exe'), fd = fs.openSync(executable, 'r');
  try {
    const dos = Buffer.alloc(64); if (fs.readSync(fd, dos, 0, 64, 0) !== 64 || dos.toString('ascii', 0, 2) !== 'MZ') throw new Error('Electron executable lacks DOS header');
    const offset = dos.readUInt32LE(60), pe = Buffer.alloc(6);
    if (offset < 64 || offset > 1024 * 1024 || fs.readSync(fd, pe, 0, 6, offset) !== 6 || pe.toString('hex', 0, 4) !== '50450000' || pe.readUInt16LE(4) !== 0x8664) throw new Error('Electron executable is not PE Windows x64');
  } finally { fs.closeSync(fd); }
  const files = runtimeFiles(dist);
  for (const required of ['electron.exe', 'electron_wer.dll', 'LICENSE', 'LICENSES.chromium.html', 'version']) if (!files.includes(required)) throw new Error('Installed Electron runtime file missing: ' + required);
  if (files.some(file => file === EXE || file === WER || file === 'portable-manifest.json' || /^resources\/app(?:\.asar|\/|$)/i.test(file))) throw new Error('Installed Electron distribution already contains an application or output collision');
  return { dist, version, files, packageMetadata: { path: 'node_modules/electron/package.json', ...fingerprint(packagePath) } };
}
function copyChecked(source, destination) {
  const before = fingerprint(source); fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
  const after = fingerprint(source), copied = fingerprint(destination);
  if (before.sha256 !== after.sha256 || before.sha256 !== copied.sha256 || before.bytes !== copied.bytes) throw new Error('Copy source/readback mismatch: ' + source);
  return before;
}
function build({ root = ROOT, output } = {}) {
  root = directoryIdentity(root).canonical;
  const index = indexFiles(root), paths = new Set(index.rows.map(row => row.path));
  for (const required of ['package.json', 'main.js', 'preload.js', 'index.html', 'config.js', 'config.example.json', 'laya_sidecar.py', 'LICENSE', 'NOTICE.md', 'systems/generated/authentic-asmodensius.js', 'systems/generated/authentic-asmodensius.manifest.json', 'brains/cqm-xylos/cqm_kernels.wasm', 'brains/tsotchke-diffusion/models/chaos_emb.f32']) if (!paths.has(required)) throw new Error('Required runtime source is not staged: ' + required);
  const pkg = JSON.parse(fs.readFileSync(sourceFile(root, 'package.json'), 'utf8'));
  if (!/^\d+\.\d+\.\d+(?:[-+][a-z0-9.-]+)?$/i.test(pkg.version)) throw new Error('Invalid application version');
  if (Object.keys(pkg.dependencies || {}).some(name => name !== 'electron')) throw new Error('Runtime external dependencies need explicit packaging; only Electron is currently supported');
  const commit = git(root, ['rev-parse', '--verify', 'HEAD']).trim();
  if (!/^[a-f0-9]{40,64}$/.test(commit)) throw new Error('Release requires a Git commit');
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  output = outputPath(root, output || path.join(root, 'dist', `${pkg.version}-${commit.slice(0, 12)}-win32-x64-${timestamp}`));
  const runtime = validateRuntime(root, pkg), records = [], startedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.mkdirSync(output);
  try {
    for (const relative of runtime.files) {
      const details = copyChecked(sourceFile(runtime.dist, relative), path.join(output, relative));
      records.push({ kind: 'electron-runtime', source: relative, destination: relative === 'electron.exe' ? EXE : relative === 'electron_wer.dll' ? WER : relative, ...details });
    }
    fs.renameSync(path.join(output, 'electron.exe'), path.join(output, EXE));
    fs.renameSync(path.join(output, 'electron_wer.dll'), path.join(output, WER));
    for (const row of index.rows) {
      const destination = 'resources/app/' + row.path, details = copyChecked(sourceFile(root, row.path), path.join(output, destination));
      records.push({ kind: 'application', source: row.path, destination, indexObjectId: row.objectId, ...details });
    }
    if (indexFiles(root).fingerprint !== index.fingerprint) throw new Error('Included Git index changed during packaging');
    for (const row of records) {
      const current = fingerprint(sourceFile(row.kind === 'application' ? root : runtime.dist, row.source)), copied = fingerprint(sourceFile(output, row.destination));
      if (current.sha256 !== row.sha256 || copied.sha256 !== row.sha256 || current.bytes !== row.bytes || copied.bytes !== row.bytes) throw new Error('Final source/destination verification failed: ' + row.source);
    }
    const manifest = { schema: 'gigachad.windows-portable.v1', status: 'verified-file-copy', startedAt, verifiedAt: new Date().toISOString(),
      applicationVersion: pkg.version, electronVersion: runtime.version, platform: 'win32', architecture: 'x64', executable: EXE,
      headCommitAtBuild: commit, indexFingerprint: index.fingerprint, sourceRoot: root,
      scope: 'Git index file roster, requiring included working-tree files to match the index under Git attributes; copied bytes and source readbacks individually SHA-256 verified. Untracked files are never selected. This is a portable unsigned directory, not an installer, startup test or self-contained Python/model distribution.',
      prerequisites: ['Windows x64', 'Python 3.11+ for the sidecar; configured model services and Tor are optional external prerequisites'],
      reference: 'https://www.electronjs.org/docs/latest/tutorial/application-distribution',
      runtimePackageMetadata: runtime.packageMetadata, exclusions: { directoryNamesAtAnyDepth: [...EXCLUDED].sort(), embeddedModelExceptions: [...MODELS],
        rule: 'Local config.json at every depth; .ini, .env except example, credentials/secrets/token filenames, keys/backups/logs, local tracker lists, tests, unlisted extensions and external models are excluded.', listed: index.excluded },
      files: records, totals: { files: records.length, bytes: records.reduce((n, row) => n + row.bytes, 0) } };
    fs.writeFileSync(path.join(output, 'portable-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    return { output, executable: path.join(output, EXE), manifest: path.join(output, 'portable-manifest.json'), files: records.length, bytes: manifest.totals.bytes };
  } catch (error) {
    fs.writeFileSync(path.join(output, 'BUILD_FAILED.txt'), 'Incomplete distribution; do not ship.\n' + error.message + '\n', { flag: 'wx' });
    throw error;
  }
}
function main(argv = process.argv.slice(2)) {
  if (argv.length > 1 || argv.length && !/^--output=.+$/.test(argv[0])) throw new Error('Expected optional --output=PATH (new direct child of repository dist)');
  const result = build({ output: argv.length ? argv[0].slice('--output='.length) : undefined }); console.log(JSON.stringify(result)); return result;
}
module.exports = { exclude, safeRelative, sourceFile, outputPath, indexFiles, validateRuntime, sameDirectory, build, main };
if (require.main === module) try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
