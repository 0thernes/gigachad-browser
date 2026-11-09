'use strict';

// Verification tooling only. Does not launch/attach to an application, install
// dependencies, change permissions, or mutate any source file/profile.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'user-data', 'research_notes', 'models', 'logs', '__pycache__', '.venv', 'venv', '.pytest_cache', '.mypy_cache', '.ruff_cache', '.cache', '.next', 'dist', 'out', 'build', 'target', 'site-packages', 'gigachadmedia']);
const EXTENSIONS = new Set('.js .cjs .mjs .ts .tsx .jsx .py .ps1 .bat .cmd .sh .html .css .scss .json .jsonl .yaml .yml .toml .md .txt .rst .csv .tsv .xml .xsd .svg .wgsl .glsl .vert .frag .zig .c .h .cpp .hpp .rs .go .java .scm .ss .sld .rkt .vue .svelte .sql .cmake .cff .lock .wasm .ico .png .jpg .jpeg .webp .gif .woff .woff2 .ttf'.split(' '));
const NAMES = new Set(['LICENSE', 'NOTICE', 'VERSION', 'CODEOWNERS', 'Dockerfile', 'Makefile', 'CMakeLists.txt', '.env.example', '.gitignore', '.gitattributes', '.npmrc', '.gitkeep']);
// These six repository assets are a finite exception to the models exclusion:
// main.js reads chaos_emb.f32 and the embedded diffusion portal loads the rest.
const EMBEDDED_MODELS = new Set(['chaos_emb.f32', 'chaos_meta.json', 'chaos_unet.onnx', 'parity.json', 'qrng_presets.json', 'uncond_unet.onnx'].map(n => 'brains/tsotchke-diffusion/models/' + n));
const LIMIT = 16 * 1024 * 1024;
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const portable = value => value.replaceAll('\\', '/');
const inside = (root, target) => { const relative = path.relative(root, target); return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative); };

function relativePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\0') || value.includes('\\') || value.includes(':') || path.isAbsolute(value) || value.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Invalid source-relative path');
  return value;
}

function exclusionReason(relative) {
  relativePath(relative);
  const parts = relative.split('/'), name = parts.at(-1), lower = name.toLowerCase();
  const embedded = EMBEDDED_MODELS.has(relative);
  const excludedDirectory = parts.slice(0, -1).find(p => EXCLUDED_DIRS.has(p.toLowerCase()) && !(embedded && p === 'models'));
  if (excludedDirectory) return 'excluded-directory:' + excludedDirectory;
  if (lower === 'config.json' || lower.endsWith('.ini') || (lower.startsWith('.env') && lower !== '.env.example') || /(?:^|[._-])(?:credentials?|secrets?|tokens?)(?:[._-]|$)/i.test(name) || /\.(?:bak|backup|key|pem|pfx|p12|log|local\.txt)$/i.test(name)) return 'private-configuration-secrets-backups-or-logs';
  if (!embedded && !EXTENSIONS.has(path.extname(name).toLowerCase()) && !NAMES.has(name)) return 'outside-source-and-runtime-asset-allowlist';
  return null;
}

function sourcePath(root, relative) {
  relativePath(relative);
  const resolved = path.resolve(root, relative);
  if (!inside(root, resolved)) throw new Error('Source path escapes root');
  let current = root;
  for (const component of relative.split('/')) {
    current = path.join(current, component);
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Source links are not copied: ' + relative);
  }
  if (!fs.lstatSync(resolved).isFile()) throw new Error('Source is not a regular file: ' + relative);
  return resolved;
}

function stableRead(filename, maxBytes = LIMIT) {
  const fd = fs.openSync(filename, 'r');
  try {
    const before = fs.fstatSync(fd, { bigint: true });
    if (!before.isFile() || before.size > BigInt(maxBytes)) throw new Error('File is not regular or exceeds declared size limit: ' + filename);
    const bytes = fs.readFileSync(fd), after = fs.fstatSync(fd, { bigint: true }), named = fs.statSync(filename, { bigint: true });
    for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs']) if (before[key] !== after[key] || after[key] !== named[key]) throw new Error('Source changed during read: ' + filename);
    if (BigInt(bytes.length) !== after.size) throw new Error('Source read length changed: ' + filename);
    return { bytes, sha256: digest(bytes), size: bytes.length, mtimeNs: String(after.mtimeNs) };
  } finally { fs.closeSync(fd); }
}

function hashBinary(filename) {
  const fd = fs.openSync(filename, 'r');
  try {
    const before = fs.fstatSync(fd, { bigint: true });
    if (!before.isFile()) throw new Error('Dependency is not a regular file');
    const hash = crypto.createHash('sha256'), buffer = Buffer.alloc(1024 * 1024); let bytes = 0, count;
    while ((count = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) { hash.update(buffer.subarray(0, count)); bytes += count; }
    const after = fs.fstatSync(fd, { bigint: true }), named = fs.statSync(filename, { bigint: true });
    for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs']) if (before[key] !== after[key] || after[key] !== named[key]) throw new Error('Dependency changed during hashing: ' + filename);
    return { path: filename, bytes, sha256: hash.digest('hex') };
  } finally { fs.closeSync(fd); }
}

function gitPaths(root) {
  return [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean))].sort();
}

function inventory(root, candidates = gitPaths(root)) {
  const files = [], excluded = [];
  for (const relative of [...new Set(candidates)].sort()) {
    const reason = exclusionReason(relative);
    if (reason) { excluded.push({ path: relative, reason }); continue; }
    try {
      const filename = sourcePath(root, relative), stat = fs.statSync(filename);
      if (stat.size > LIMIT) throw new Error('Source exceeds sixteen MiB limit: ' + relative);
      files.push(relative);
    } catch (error) {
      if (error.code === 'ENOENT') excluded.push({ path: relative, reason: 'tracked-but-absent-in-working-tree' });
      else throw error;
    }
  }
  return { files, excluded };
}

function outputPath(value, root = ROOT, existing = false) {
  const output = path.resolve(value), allowed = path.join(root, 'research_notes', 'alive-upgrade-2026-11-09');
  if (path.dirname(output) !== allowed || !/^source-snapshot-[a-z0-9][a-z0-9.-]*$/i.test(path.basename(output))) throw new Error('Output must be a named source-snapshot-* direct child of repository research_notes/alive-upgrade-2026-11-09');
  const realRoot = fs.realpathSync(root);
  let ancestor = output;
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  if (!inside(realRoot, fs.realpathSync(ancestor))) throw new Error('Snapshot output resolves outside repository');
  if (!existing && fs.existsSync(output)) throw new Error('Snapshot destination exists; overwrite refused');
  if (existing && !fs.existsSync(output)) throw new Error('Snapshot destination is absent');
  return output;
}

function dependencies(root) {
  const modules = fs.realpathSync(path.join(root, 'node_modules'));
  const electronPackage = path.join(modules, 'electron', 'package.json'), esbuildPackage = path.join(modules, 'esbuild', 'package.json');
  const electron = JSON.parse(stableRead(electronPackage).bytes), esbuild = JSON.parse(stableRead(esbuildPackage).bytes);
  const electronName = stableRead(path.join(modules, 'electron', 'path.txt')).bytes.toString('utf8').trim();
  if (electronName !== 'electron.exe') throw new Error('This verification snapshot requires the installed Windows Electron binary');
  const electronBinary = path.join(modules, 'electron', 'dist', electronName);
  const installedVersion = stableRead(path.join(modules, 'electron', 'dist', 'version')).bytes.toString('utf8').trim();
  const packageJson = JSON.parse(stableRead(path.join(root, 'package.json')).bytes);
  if (electron.version !== installedVersion || packageJson.dependencies?.electron !== installedVersion || packageJson.devDependencies?.esbuild !== esbuild.version) throw new Error('Installed dependency and declared package versions differ');
  const files = [electronPackage, path.join(modules, 'electron', 'path.txt'), path.join(modules, 'electron', 'dist', 'version'), electronBinary,
    esbuildPackage, path.join(modules, '@esbuild', 'win32-x64', 'package.json'), path.join(modules, '@esbuild', 'win32-x64', 'esbuild.exe'), process.execPath].map(hashBinary);
  return { nodeModules: modules, electron: { version: installedVersion, binary: electronBinary }, esbuild: { version: esbuild.version }, node: { version: process.version, binary: process.execPath }, files,
    isolation: 'Source files are copied; installed node_modules is a Windows junction to the existing installation. Dependencies are shared and mutable, not an independent package install; binary/package hashes must be rechecked after verification.' };
}

function verifyRecords(root, records) {
  for (const record of records) {
    const current = stableRead(sourcePath(root, record.path));
    if (current.size !== record.bytes || current.sha256 !== record.sha256) throw new Error('Hash mismatch: ' + record.path);
  }
}

function copyVerifiedFiles(root, destination, planned, currentPaths = () => inventory(root).files, afterCopy = () => {}) {
  const records = [];
  if (fs.existsSync(destination)) throw new Error('Copy destination exists; overwrite refused');
  fs.mkdirSync(destination);
  for (const relative of planned) {
    const source = stableRead(sourcePath(root, relative)), target = path.join(destination, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, source.bytes, { flag: 'wx' });
    records.push({ path: relative, bytes: source.size, sha256: source.sha256, sourceMtimeNs: source.mtimeNs });
  }
  afterCopy();
  if (JSON.stringify(currentPaths()) !== JSON.stringify(planned)) throw new Error('Included source file set changed during capture');
  verifyRecords(root, records);
  verifyRecords(destination, records);
  if (JSON.stringify(currentPaths()) !== JSON.stringify(planned)) throw new Error('Included source file set changed during verification');
  return records;
}

function linkDependencies(app, modules) {
  const target = path.join(app, 'node_modules'), real = fs.realpathSync(modules);
  if (fs.existsSync(target)) throw new Error('Snapshot dependency destination already exists');
  if (!fs.statSync(real).isDirectory()) throw new Error('Installed dependencies are not a directory');
  fs.symlinkSync(real, target, 'junction');
  if (!fs.lstatSync(target).isSymbolicLink() || fs.realpathSync(target) !== real) throw new Error('Dependency junction did not resolve to selected installation');
  return { path: target, target: real, type: 'junction' };
}

function verifySnapshot(output, root = ROOT) {
  const directory = outputPath(output, root, true), manifest = JSON.parse(stableRead(path.join(directory, 'manifest.json')).bytes);
  if (manifest.schema !== 'gigachad.verification-source-snapshot.v1' || manifest.status !== 'verified' || manifest.sourceRoot !== fs.realpathSync(root) || manifest.appRoot !== path.join(directory, 'app')) throw new Error('Snapshot manifest identity mismatch');
  verifyRecords(manifest.appRoot, manifest.files); verifyRecords(root, manifest.files);
  if (JSON.stringify(inventory(root).files) !== JSON.stringify(manifest.files.map(f => f.path))) throw new Error('Included source set differs from snapshot');
  if (!fs.lstatSync(path.join(manifest.appRoot, 'node_modules')).isSymbolicLink() || fs.realpathSync(path.join(manifest.appRoot, 'node_modules')) !== manifest.dependencies.nodeModules) throw new Error('Dependency junction changed');
  for (const record of manifest.dependencies.files) {
    const current = hashBinary(record.path);
    if (current.sha256 !== record.sha256 || current.bytes !== record.bytes) throw new Error('Shared dependency changed: ' + record.path);
  }
  return { status: 'verified', checkedAt: new Date().toISOString(), files: manifest.files.length, appRoot: manifest.appRoot, manifestSha256: digest(fs.readFileSync(path.join(directory, 'manifest.json'))) };
}

function main(argv = process.argv.slice(2)) {
  const flags = new Map();
  for (const arg of argv) {
    const match = /^--(plan|capture)$|^--(output|verify)=(.+)$/.exec(arg);
    if (!match || flags.has(match[1] || match[2])) throw new Error('Expected --plan|--capture --output=DIR, or --verify=DIR');
    flags.set(match[1] || match[2], match[3] || true);
  }
  if (flags.has('verify')) {
    if (flags.size !== 1) throw new Error('--verify must be used alone');
    const result = verifySnapshot(flags.get('verify')); console.log(JSON.stringify(result)); return result;
  }
  if (flags.size !== 2 || !flags.has('output') || flags.has('plan') === flags.has('capture')) throw new Error('Explicit --plan or --capture and --output are required');
  const root = fs.realpathSync(ROOT), output = outputPath(flags.get('output'), root), plan = inventory(root);
  const required = ['main.js', 'index.html', 'preload.js', 'package.json', 'package-lock.json', 'systems/generated/authentic-asmodensius.js', 'systems/generated/authentic-asmodensius.manifest.json', 'brains/cqm-xylos/cqm_kernels.wasm', 'brains/tsotchke-diffusion/models/chaos_emb.f32'];
  if (required.some(name => !plan.files.includes(name))) throw new Error('Required application/embedded runtime asset is missing from snapshot plan');
  if (flags.has('plan')) { const result = { status: 'plan-only-no-files-written', output, files: plan.files.length, excluded: plan.excluded.length, embeddedModelExceptions: [...EMBEDDED_MODELS], required }; console.log(JSON.stringify(result)); return result; }
  const startedAt = new Date().toISOString(), dep = dependencies(root);
  const gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true }).trim();
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.mkdirSync(output);
  try {
    const appRoot = path.join(output, 'app'), files = copyVerifiedFiles(root, appRoot, plan.files);
    const junction = linkDependencies(appRoot, dep.nodeModules);
    for (const before of dep.files) if (hashBinary(before.path).sha256 !== before.sha256) throw new Error('Dependency changed during capture: ' + before.path);
    const manifest = { schema: 'gigachad.verification-source-snapshot.v1', status: 'verified', startedAt, verifiedAt: new Date().toISOString(), sourceRoot: root, appRoot, gitHead,
      scope: 'Actual tracked and untracked nonignored working-tree application/test/document/runtime asset bytes, not a commit checkout. Every copied file hash equals a stable source read, a complete post-copy source re-read, and destination re-read. Included file set checked before/after. This is not an atomic filesystem snapshot or an assurance against changes after verification. No ACL/read-only permission changes; no application launched.',
      exclusions: { directoryNamesAtAnyDepth: [...EXCLUDED_DIRS].sort(), allowedExtensions: [...EXTENSIONS].sort(), allowedNames: [...NAMES].sort(), maxFileBytes: LIMIT, embeddedModelExceptions: [...EMBEDDED_MODELS],
        ignoredFiles: 'git ls-files --cached --others --exclude-standard omits untracked ignored files; .git, node_modules, live profiles, local configuration, model stores, logs, research evidence and caches are not traversed/copied. Tracked files are still subject to the explicit rules.',
        privateFiles: 'config.json, all .ini, .env* except .env.example, credential/secret/token filename components, backups, private keys, logs and *.local.txt; links are rejected; PDF/archive/spreadsheet artifacts and unspecified extensions excluded.', listed: plan.excluded },
      dependencies: dep, junction, files, totals: { files: files.length, bytes: files.reduce((n, f) => n + f.bytes, 0) },
      verificationCommands: { smoke: 'node scripts/smoke.js (cwd appRoot)', build: 'node scripts/build-authentic-asmodensius.js --check (cwd appRoot)', probe: 'Use existing scripts/alive-overdrive-probe.cjs with GIGACHAD_PROBE_MS=60000 and GIGACHAD_PROBE_OUTPUT pointing to the original repository evidence directory; launch only on parent authorization.', postCheck: 'node scripts/alive-source-snapshot.cjs --verify=' + output } };
    fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ status: manifest.status, output, appRoot, files: files.length, bytes: manifest.totals.bytes, electron: dep.electron.version, manifestSha256: digest(fs.readFileSync(path.join(output, 'manifest.json'))) }));
    return manifest;
  } catch (error) {
    fs.writeFileSync(path.join(output, 'capture-failed.json'), JSON.stringify({ status: 'invalid-partial-snapshot-do-not-run', error: String(error.message || error), at: new Date().toISOString() }, null, 2) + '\n', { flag: 'wx' });
    throw error;
  }
}

module.exports = { exclusionReason, sourcePath, stableRead, inventory, outputPath, copyVerifiedFiles, linkDependencies, verifyRecords, main };
if (require.main === module) try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
