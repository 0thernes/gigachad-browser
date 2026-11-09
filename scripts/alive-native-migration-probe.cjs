'use strict';
// Explicit opt-in verification. Only an owned temporary copy of the source
// profile is written. Production startup/import/autosave/close remain active.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const crypto = require('node:crypto'), { spawnSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const root = path.resolve(__dirname, '..');
const { adaptMain, observeHost, assertOwned, isProbeEntry } = require('./alive-persistence-restart-probe.cjs');
const { readRecord } = require('./alive-genome-durable-evidence.cjs');
const { captureGenomeHydration, captureGenomeInitialState, assessGenomeHydration } = require('./alive-genome-hydration-evidence.cjs');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));
const files = ['main.js', 'index.html', 'preload.js', 'systems/alive-genome-migration.cjs',
  'systems/alive-primary-policy-state.js', 'systems/alive-primary-policy-bootstrap.js',
  'systems/alive-learned-state-codec.js', 'systems/alive-learned-state-registry.js', 'systems/alive-startup-loader.js',
  'systems/alive-genome-store.cjs', 'systems/alive-genome-ipc.cjs', 'systems/alive-genome-persistence.js',
  'systems/alive-genome-codec.js', 'systems/alive-autosave.js', 'systems/authentic-asmodensius-adapter.js',
  'systems/generated/authentic-asmodensius.js', 'scripts/alive-native-migration-probe.cjs',
  'scripts/alive-persistence-restart-probe.cjs', 'scripts/alive-genome-durable-evidence.cjs',
  'scripts/alive-genome-hydration-evidence.cjs', 'scripts/alive-primary-policy-evidence.cjs',
  'scripts/alive-learned-state-wire-evidence.cjs', 'scripts/alive-model-state-evidence.cjs',
  'scripts/alive-public-navigation-probe.cjs',
  'systems/alive-asset-hydration.js', 'systems/alife-25-bleeding-edge-models.js',
  'systems/ported-multiverse-brains.js', 'alife_neural_cyber_engine.js'];
const hashes = () => Object.fromEntries(files.map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));

async function parent() {
  if (process.env.GIGACHAD_NATIVE_MIGRATION_PROBE_RUN !== '1') throw Error('Explicit coordinated probe opt-in required');
  const source = path.resolve(process.env.GIGACHAD_NATIVE_MIGRATION_SOURCE || '');
  if (!process.env.GIGACHAD_NATIVE_MIGRATION_SOURCE) throw Error('An explicit source snapshot is required');
  const originalBytes = fs.readFileSync(source), original = readRecord(source);
  const originalPayload = JSON.parse(original.payloadJSON);
  if (!originalPayload.authenticAsmodensius || JSON.parse(originalPayload.authenticAsmodensius.payload).developmentAffinity) throw Error('Source must be a legacy native snapshot');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gigachad-native-migration-proof-'));
  const nonce = crypto.randomUUID(), profile = path.join(directory, 'profile');
  const fixture = path.join(root, `.alive-persistence-${nonce}.html`);
  const output = path.resolve(process.env.GIGACHAD_NATIVE_MIGRATION_OUTPUT || path.join(root, 'research_notes/alive-autonomy-audit-2026-11-08', `native-migration-${Date.now()}`));
  if (fs.existsSync(output)) throw Error('Refusing to overwrite evidence output');
  fs.mkdirSync(output, { recursive: true }); fs.mkdirSync(profile);
  const paths = { directory, profile, fixture, nonce };
  write(path.join(directory, 'ownership.json'), { nonce, root }); assertOwned(paths);
  const canonical = path.join(profile, 'alive-genome-v1.snapshot');
  fs.writeFileSync(canonical, originalBytes, { flag: 'wx' });
  const report = { startedAt: new Date().toISOString(), scope: 'Actual isolated main-startup recovery, renderer hydration, verified close and second-process restart; no normal-profile writes or full-model continuity claim',
    source, sourceFileSHA256: hash(originalBytes), sourceRevision: original.header.revision, output, paths,
    sourceHashes: hashes(), cases: [], runs: [] };
  const reportFile = path.join(output, 'report.json');
  const check = (name, passed, evidence) => { report.cases.push({ name, passed: Boolean(passed), evidence }); write(reportFile, report); if (!passed) throw Error(name); };
  let previous = null;
  try {
    fs.writeFileSync(fixture, observeHost(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), captureGenomeHydration, captureGenomeInitialState), { flag: 'wx' });
    for (const phase of ['migration', 'restart']) {
      const phaseOutput = path.join(output, phase); fs.mkdirSync(phaseOutput);
      const env = { ...process.env, GIGACHAD_SMOKE: '1', GIGACHAD_TEST_MODE: '1',
        GIGACHAD_NATIVE_MIGRATION_CHILD: JSON.stringify({ ...paths, output: phaseOutput, phase }) };
      for (const key of Object.keys(env)) if (/^GIGACHAD_PROBE_/.test(key) || ['ELECTRON_RUN_AS_NODE','OPENROUTER_API_KEY','ELEVENLABS_API_KEY','GIGACHAD_LLM_API_KEY','GIGACHAD_PERSISTENCE_PROBE_CHILD'].includes(key)) delete env[key];
      const run = spawnSync(path.resolve(require('electron')), [__filename], { cwd: root, env, windowsHide: true, timeout: 60000, encoding: 'utf8', maxBuffer: 1024 * 1024 });
      report.runs.push({ phase, pid: run.pid, status: run.status, error: run.error?.message || null, stdout: run.stdout?.slice(-6000), stderr: run.stderr?.slice(-3000) });
      check(phase + '-exited', run.status === 0, report.runs.at(-1));
      const child = JSON.parse(fs.readFileSync(path.join(phaseOutput, 'report.json'), 'utf8'));
      check(phase + '-completed', child.completed === true && !child.error, { error: child.error, versions: child.versions });
      check(phase + '-source-stable', isDeepStrictEqual(report.sourceHashes, child.sourceHashesAfter), {});
      const boot = JSON.parse(fs.readFileSync(path.join(profile, 'probe-boot-' + phase + '.json'), 'utf8'));
      const expected = boot.bootstrap.json, recovered = JSON.parse(expected);
      const hydration = assessGenomeHydration(expected, boot.snapshot, { initialState: boot.initialState });
      write(path.join(profile, 'probe-hydration-' + phase + '.json'), hydration);
      check(phase + '-hydrated', hydration.ok, { differenceCount: hydration.differenceCount, inconclusive: hydration.inconclusive, arraysChecked: hydration.arraysChecked, elementsChecked: hydration.elementsChecked });
      check(phase + '-recovery-provenance-exposed-and-writable', child.status.recovery?.provenance?.exactHistoricalContinuation === false && child.status.persistence.application === 'applied' && child.status.persistence.writeAllowed === true,
        { persistence: child.status.persistence, recovery: child.status.recovery });
      check(phase + '-verified-flush', child.flush.persistenceVerified === true, child.flush);
      const backup = path.join(profile, 'alive-genome-v1.migration-backup.snapshot');
      check(phase + '-exact-original-backup', fs.existsSync(backup) && fs.readFileSync(backup).equals(originalBytes), { originalSHA256: hash(originalBytes), backupSHA256: fs.existsSync(backup) ? hash(fs.readFileSync(backup)) : null });
      if (phase === 'migration') {
        const unaffected = Object.keys(originalPayload).filter(key => key !== 'authenticAsmodensius');
        check('original-outer-fields-preserved', unaffected.every(key => isDeepStrictEqual(originalPayload[key], recovered[key])), { fields: unaffected.length });
        const priorNative = JSON.parse(originalPayload.authenticAsmodensius.payload), recoveredNative = JSON.parse(recovered.authenticAsmodensius.payload);
        check('original-native-fields-preserved', Object.keys(priorNative).every(key => isDeepStrictEqual(priorNative[key], recoveredNative[key])), { fields: Object.keys(priorNative), affinityRows: recoveredNative.developmentAffinity?.length });
        check('single-startup-migration-revision', boot.bootstrap.revision === original.header.revision + 1, { source: original.header.revision, bootstrap: boot.bootstrap.revision });
      } else {
        check('restart-exact-primary-present-and-hydrated', Object.hasOwn(recovered, 'primaryPolicyState') &&
          hydration.primaryPolicy?.ok === true && hydration.primaryPolicy.arraysChecked === 6 &&
          hydration.primaryPolicy.elementsChecked === 718 && hydration.primaryPolicy.elementsDifferent === 0 &&
          hydration.primaryPolicy.exactComparison?.ok === true,
          hydration.primaryPolicy);
        check('restart-loads-previous-canonical-without-remigration', boot.bootstrap.json === previous.payloadJSON && boot.bootstrap.revision === previous.header.revision,
          { previousRevision: previous.header.revision, bootstrapRevision: boot.bootstrap.revision });
      }
      previous = readRecord(canonical);
      const shutdown = JSON.parse(fs.readFileSync(path.join(profile, 'alive-genome-shutdown.json'), 'utf8'));
      check(phase + '-verified-close', shutdown.status === 'persisted-and-drained' && shutdown.persistenceVerified === true &&
        shutdown.renderer?.revision === previous.header.revision && shutdown.renderer?.digest === previous.evidence.payloadSha256 &&
        shutdown.renderer?.ownerId === child.flush.ownerId && shutdown.drain?.settled === true &&
        Number.isFinite(shutdown.at) && shutdown.at >= Date.parse(child.startedAt), shutdown);
    }
    report.completed = true;
  } catch (error) { report.error = String(error.stack || error); process.exitCode = 1; }
  finally {
    try {
      const after = fs.readFileSync(source), passed = after.equals(originalBytes);
      report.cases.push({ name: 'normal-source-byte-identical', passed, evidence: { sourceFileSHA256: hash(after) } });
      if (!passed) throw Error('Normal source changed during isolated qualification');
    } catch (error) { report.error = report.error || String(error.stack || error); report.completed = false; process.exitCode = 1; }
    finally {
      try { assertOwned(paths); if (fs.existsSync(fixture)) fs.unlinkSync(fixture); }
      catch (error) { report.error = report.error || String(error.stack || error); report.completed = false; process.exitCode = 1; }
      report.sourceHashesAfter = hashes(); report.finishedAt = new Date().toISOString(); write(reportFile, report);
    }
    console.log(JSON.stringify({ report: reportFile, completed: report.completed === true, cases: report.cases.length, error: report.error || null }));
  }
}

async function child() {
  const contract = JSON.parse(process.env.GIGACHAD_NATIVE_MIGRATION_CHILD); assertOwned(contract);
  globalThis.__alivePersistenceProbe = contract;
  const { app } = require('electron');
  const report = { phase: contract.phase, pid: process.pid, versions: process.versions, startedAt: new Date().toISOString() };
  const reportFile = path.join(contract.output, 'report.json');
  const save = () => { report.sourceHashesAfter = hashes(); write(reportFile, report); };
  const fail = error => { report.error = String(error.stack || error); save(); app.exit(1); };
  process.on('uncaughtException', fail); process.on('unhandledRejection', fail);
  process.on('exit', code => { report.exitCode = code; save(); });
  const deadline = setTimeout(() => fail(Error('Migration app probe exceeded 45 seconds')), 45000);
  app.on('browser-window-created', (_event, win) => {
    win.setFocusable(false); win.setIgnoreMouseEvents(true);
    win.webContents.once('did-finish-load', async () => {
      try {
        if (path.resolve(app.getPath('userData')) !== path.resolve(contract.profile)) throw Error('Wrong profile');
        const evaluate = code => win.webContents.executeJavaScript(code);
        report.startup = await evaluate('(async()=>{if(!window.aliveStartup)throw new Error("Startup controller missing");const state=await window.aliveStartup.ready;if(state.phase!=="ready")throw new Error("Startup failed: "+state.error);return state})()');
        const boot = await evaluate('window.__alivePersistenceBootObservation');
        if (!boot?.beforeBaseline || !boot?.snapshot) throw Error('Missing constructor observation');
        // Private genome/URL payloads stay in the owned temporary profile.
        write(path.join(contract.profile, 'probe-boot-' + contract.phase + '.json'), boot);
        await evaluate('window.stopAlienBrainAutonomy(); true');
        report.status = await evaluate('({recovery:humunculusRuntime.nativeStateRecovery,persistence:window.aliveGenomePersistence.snapshot(),restore:humunculusRuntime.persistentGenomeRestore})');
        report.flush = await evaluate('Promise.resolve(window.aliveAutosave.flush("native-migration-proof"))');
        report.completed = true; save(); win.close(); clearTimeout(deadline);
        setTimeout(() => fail(Error('Normal close exceeded 12 seconds')), 12000).unref();
      } catch (error) { fail(error); }
    });
  });
  const Module = require('node:module'), filename = path.join(root, 'main.js');
  const compiled = new Module(filename, module); compiled.filename = filename; compiled.paths = Module._nodeModulePaths(root);
  compiled._compile(adaptMain(fs.readFileSync(filename, 'utf8')), filename);
}
if (isProbeEntry({ electron: process.versions.electron, childContract: process.env.GIGACHAD_NATIVE_MIGRATION_CHILD,
  entryPath: process.argv[1], isMain: require.main === module }, __filename)) {
  (process.versions.electron ? child() : parent()).catch(error => { console.error(error.stack || error); process.exitCode = 1; });
}
