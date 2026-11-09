'use strict';

// Explicit opt-in, read-only canonical recovery proof. The child uses actual
// Electron's embedded Node, without a BrowserWindow, network or normal startup.
// Only metadata evidence is written; the source and candidate stay in memory.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const EXPECTED_ADAPTER = '193f0353be5ecb274a70692183452f23fd4eee088cde62ae5fd3cbf7cc4fd062';
const sourceFiles = [
  'scripts/alive-native-recovery-probe.cjs', 'scripts/alive-native-recovery-evidence.cjs',
  'scripts/alive-genome-durable-evidence.cjs', 'systems/authentic-asmodensius-adapter.js',
  'systems/generated/authentic-asmodensius.js', 'systems/generated/authentic-asmodensius.manifest.json'
];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const sourceHashes = () => Object.fromEntries(sourceFiles.map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
const writeEvidence = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });

function runChild(sourcePath, outputDir) {
  if (!process.versions.electron || process.env.ELECTRON_RUN_AS_NODE !== '1' ||
      process.env.GIGACHAD_NATIVE_RECOVERY_CHILD !== '1') throw new Error('Actual Electron embedded-Node child contract required');
  const before = sourceHashes();
  const report = { startedAt: new Date().toISOString(), pid: process.pid,
    versions: { electron: process.versions.electron, node: process.versions.node, v8: process.versions.v8 },
    executableSha256: hash(fs.readFileSync(process.execPath)), sourceHashes: before,
    canonicalWriteOperations: 0, payloadExported: false, ok: false,
    scope: 'Independent preservation/provenance assessment of an in-memory recovery candidate under actual Electron; no canonical publication, normal-session attachment, startup migration or exact historical-affinity claim' };
  let originalBytes;
  try {
    if (before['systems/authentic-asmodensius-adapter.js'] !== EXPECTED_ADAPTER) throw new Error('Native recovery adapter differs from the reviewed frozen version');
    const { parseRecord } = require('./alive-genome-durable-evidence.cjs');
    const { verifyNativeRecovery } = require('./alive-native-recovery-evidence.cjs');
    const { AuthenticAsmodensiusAdapter } = require('../systems/authentic-asmodensius-adapter.js');
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'systems/generated/authentic-asmodensius.manifest.json'), 'utf8'));
    const stat = fs.statSync(sourcePath);
    if (!stat.isFile() || stat.size > 32 * 1024 * 1024 + 2049) throw new Error('Canonical input is not a bounded ordinary file');
    originalBytes = fs.readFileSync(sourcePath);
    const source = parseRecord(originalBytes);
    if (!source.payload.authenticAsmodensius) throw new Error('Canonical input has no native envelope');
    report.input = { revision: source.header.revision, savedAt: source.header.savedAt,
      payloadSha256: source.header.sha256, recordSha256: hash(originalBytes), recordBytes: originalBytes.length };
    const originalEnvelopeJSON = JSON.stringify(source.payload.authenticAsmodensius);
    const started = performance.now();
    const prepared = AuthenticAsmodensiusAdapter.prepareLegacyRecovery(source.payload.authenticAsmodensius);
    report.prepareMs = performance.now() - started;
    report.independent = verifyNativeRecovery(originalEnvelopeJSON, JSON.stringify(prepared), { expectedSourceDigest: manifest.sourceDigest });
    if (!report.independent.ok) throw new Error('Independent known-state preservation or recovery provenance check failed');
    const destination = new AuthenticAsmodensiusAdapter({ seed: prepared.provenance.seed });
    report.actualImport = { accepted: destination.importState(prepared.envelope) };
    if (!report.actualImport.accepted) throw new Error('Prepared candidate rejected by actual native importer: ' + String(destination.lastError).slice(0, 160));
    const exported = destination.exportState();
    report.actualImport.exactPayload = exported.payload === prepared.envelope.payload;
    report.actualImport.exactEnvelopeIdentity = exported.schema === prepared.envelope.schema &&
      exported.sourceDigest === prepared.envelope.sourceDigest && exported.checksum === prepared.envelope.checksum;
    if (!report.actualImport.exactPayload || !report.actualImport.exactEnvelopeIdentity) throw new Error('Actual native import/export changed prepared state');
    report.reconstruction = { historicalContinuationExact: prepared.provenance.exactHistoricalContinuation,
      kind: prepared.provenance.kind, developmentalAffinity: prepared.provenance.developmentalAffinity,
      nativeTick: prepared.provenance.nativeTick, edges: prepared.provenance.edges, affinityRows: prepared.provenance.affinityRows };
    report.ok = true;
  } catch (error) {
    report.error = String(error?.message || error).slice(0, 400);
  } finally {
    if (originalBytes) {
      try {
        const afterBytes = fs.readFileSync(sourcePath);
        report.canonicalAfter = { recordSha256: hash(afterBytes), recordBytes: afterBytes.length,
          exactOriginalBytesUnchanged: originalBytes.equals(afterBytes) };
        if (!report.canonicalAfter.exactOriginalBytesUnchanged) report.ok = false;
      } catch (error) { report.canonicalReadbackError = String(error.message).slice(0, 160); report.ok = false; }
    }
    report.sourceHashesAtEnd = sourceHashes();
    report.changedSources = sourceFiles.filter(file => before[file] !== report.sourceHashesAtEnd[file]);
    if (report.changedSources.length) report.ok = false;
    report.completedAt = new Date().toISOString();
    writeEvidence(path.join(outputDir, 'report.json'), report);
  }
  process.stdout.write(JSON.stringify({ ok: report.ok, pid: report.pid, versions: report.versions,
    inputRevision: report.input?.revision, independentOK: report.independent?.ok,
    actualImport: report.actualImport, unchanged: report.canonicalAfter?.exactOriginalBytesUnchanged,
    changedSources: report.changedSources, error: report.error }) + '\n');
  if (!report.ok) process.exitCode = 1;
}

function runParent(sourceArg, outputArg) {
  if (!sourceArg || !outputArg) throw new Error('Pass the existing canonical source file and a new evidence output directory');
  const sourcePath = fs.realpathSync(path.resolve(sourceArg));
  const outputDir = path.resolve(outputArg);
  if (fs.existsSync(outputDir)) throw new Error('Evidence output already exists; preserve prior results');
  const allowed = path.resolve(root, 'research_notes/alive-overdrive-verification');
  const relative = path.relative(allowed, outputDir);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Evidence output must be a new directory under the independent verification notes');
  // A fresh checkout has no local research tree. Reject linked ancestors before
  // creating the validated evidence hierarchy; never follow one outside it.
  let ancestor = root;
  for (const part of path.relative(root, path.dirname(outputDir)).split(path.sep)) {
    ancestor = path.join(ancestor, part);
    if (fs.existsSync(ancestor) && (fs.lstatSync(ancestor).isSymbolicLink() || !fs.statSync(ancestor).isDirectory())) {
      throw new Error('Evidence parent must be an ordinary repository directory');
    }
  }
  fs.mkdirSync(path.dirname(outputDir), { recursive: true });
  fs.mkdirSync(outputDir);
  const started = Date.now();
  const child = spawnSync(require('electron'), [__filename, '--child', sourcePath, outputDir], {
    cwd: root, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', GIGACHAD_NATIVE_RECOVERY_CHILD: '1' },
    windowsHide: true, encoding: 'utf8', timeout: 90000, maxBuffer: 1024 * 1024
  });
  writeEvidence(path.join(outputDir, 'launcher.json'), { startedAt: new Date(started).toISOString(),
    completedAt: new Date().toISOString(), durationMs: Date.now() - started, pid: child.pid,
    status: child.status, signal: child.signal, error: child.error?.message || null,
    stdoutBytes: Buffer.byteLength(child.stdout || ''), stderrBytes: Buffer.byteLength(child.stderr || ''),
    outputPolicy: 'Only parsed metadata report is printed; child streams and source/candidate payloads are not exported' });
  const reportPath = path.join(outputDir, 'report.json');
  const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf8')) : null;
  process.stdout.write(JSON.stringify({ ok: child.status === 0 && report?.ok === true,
    pid: child.pid, childExit: child.status, error: report?.error || child.error?.message,
    version: report?.versions, inputRevision: report?.input?.revision,
    independentOK: report?.independent?.ok, actualImport: report?.actualImport,
    unchanged: report?.canonicalAfter?.exactOriginalBytesUnchanged, changedSources: report?.changedSources,
    report: reportPath }) + '\n');
  if (child.status !== 0 || report?.ok !== true) process.exitCode = 1;
}

module.exports = { runChild, runParent };
if (process.env.GIGACHAD_NATIVE_RECOVERY_PROBE_RUN === '1' &&
    process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  if (process.argv[2] === '--child') runChild(process.argv[3], process.argv[4]);
  else runParent(process.argv[2], process.argv[3]);
}
