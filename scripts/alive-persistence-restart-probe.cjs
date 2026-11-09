'use strict';

// Independent actual-application restart verifier. Execution is explicitly
// opt-in and must be serialized with the coordinated application's workload.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const { readRecord } = require('./alive-genome-durable-evidence.cjs');
const { capturePauseDiagnostics, assessPauseEvidence } = require('./alive-public-navigation-probe.cjs');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const sourcePaths = ['index.html', 'main.js', 'preload.js', 'config.js', 'alife_neural_cyber_engine.js',
  'systems/alive-autosave.js', 'systems/alive-genome-codec.js', 'systems/alive-genome-store.cjs', 'systems/alive-genome-ipc.cjs',
  'systems/alive-overdrive-adapters.js', 'systems/alive-checkpoints.js', 'systems/alive-authority.js',
  'systems/alive-neural-coupling.js', 'systems/alive-specialist-fusion.js',
  'systems/authentic-asmodensius-adapter.js', 'systems/generated/authentic-asmodensius.js',
  'systems/ported-multiverse-brains.js', 'systems/alife-25-bleeding-edge-models.js',
  'systems/alive-asset-hydration.js', 'systems/alive-startup-loader.js',
  'systems/alive-primary-policy-state.js', 'systems/alive-primary-policy-bootstrap.js',
  'systems/alive-learned-state-codec.js', 'systems/alive-learned-state-registry.js',
  'scripts/alive-primary-policy-evidence.cjs', 'scripts/alive-learned-state-wire-evidence.cjs',
  'scripts/alive-model-state-evidence.cjs', 'scripts/alive-persistence-restart-probe.cjs',
  'scripts/alive-genome-durable-evidence.cjs', 'scripts/alive-genome-hydration-evidence.cjs', 'scripts/alive-public-navigation-probe.cjs'];
function sourceHashes() {
  const candidates = [...sourcePaths, 'systems/alive-genome-persistence.js'];
  return Object.fromEntries(candidates.filter(file => fs.existsSync(path.join(root, file)))
    .map(file => [file, sha(fs.readFileSync(path.join(root, file)))]));
}
function replaceOnce(source, target, replacement, label) {
  const count = source.split(target).length - 1;
  if (count !== 1) throw new Error(`${label} expected one exact location, found ${count}`);
  return source.replace(target, replacement);
}
// Serializable read-only observation. The real startup loader remains the sole
// owner of activation; waiting for it must never call boot/start a second time.
async function waitForRendererStartup({ timeoutMs = 20000, required = false } = {}) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) throw new Error('Invalid startup observation deadline');
  const startup = window.aliveStartup;
  if (!startup) {
    if (required) throw new Error('Required renderer startup barrier is missing');
    return { phase: 'legacy-no-barrier' };
  }
  if (!startup.ready || typeof startup.ready.then !== 'function') throw new Error('Renderer startup readiness promise is missing');
  let timer;
  try {
    const result = await Promise.race([startup.ready, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Renderer startup exceeded observation deadline')), timeoutMs);
    })]);
    if (!result || result.phase !== 'ready') throw new Error('Renderer startup did not reach ready: ' + String(result?.phase || 'unknown'));
    return result;
  } finally { clearTimeout(timer); }
}
function adaptMain(source) {
  source = replaceOnce(source,
    "const smokeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gigachad-smoke-'));",
    'const smokeDir = globalThis.__alivePersistenceProbe.profile;', 'isolated profile');
  source = replaceOnce(source, "const CHROME_FILE = path.join(ROOT, 'index.html');",
    'const CHROME_FILE = globalThis.__alivePersistenceProbe.fixture;', 'owned observed host');
  const legacy = /  if \(SMOKE\) \{\r?\n    const fail = \(message\) => \{/;
  if ((source.match(new RegExp(legacy.source, 'g')) || []).length !== 1) throw new Error('Smoke audit bootstrap changed');
  return source.replace(legacy, '  if (false) {\n    const fail = (message) => {');
}
function observeHost(source, capture, captureInitial) {
  const observe = `const __alivePersistenceInitialState = ${captureInitial ? `(${captureInitial.toString()})(this)` : 'null'};\n        this.loadPersistentGenome();\n        window.__alivePersistenceBootObservation = { snapshot: (${capture.toString()})(this), initialState: __alivePersistenceInitialState, bootstrap: window.gigachad?.genomeBootstrap, at: performance.now(), beforeBaseline: true };`;
  source = replaceOnce(source, 'this.loadPersistentGenome();', observe, 'constructor observation');
  return replaceOnce(source, '<head>', `<head><script>
  window.__alivePersistenceStorageEvents=[];
  for(const name of ['setItem','removeItem']) {
    const original=Storage.prototype[name];
    Storage.prototype[name]=function(key,...args){
      if(String(key)==='humunculus_persistent_genome_v1')window.__alivePersistenceStorageEvents.push({method:name,at:performance.now(),codeUnits:typeof args[0]==='string'?args[0].length:null});
      return original.call(this,key,...args);
    };
  }
  </script>`, 'early storage observation');
}
function assertOwned(paths) {
  const directory = path.resolve(paths.directory);
  const marker = JSON.parse(fs.readFileSync(path.join(directory, 'ownership.json'), 'utf8'));
  if (marker.nonce !== paths.nonce || marker.root !== root) throw new Error('Owned-profile nonce/root mismatch');
  if (path.resolve(paths.profile) !== path.join(directory, 'profile')) throw new Error('Unexpected profile path');
  if (path.dirname(path.resolve(paths.fixture)) !== root || path.basename(paths.fixture) !== `.alive-persistence-${paths.nonce}.html`) throw new Error('Unexpected fixture path');
  return marker;
}
function writeJSON(filename, value) { fs.writeFileSync(filename, JSON.stringify(value, null, 2)); }
function isProbeEntry({ electron, childContract, entryPath, isMain }, filename) {
  // Electron's default entry loader does not set require.main in installed35.
  // Require our explicit child contract AND exact entry file instead.
  return electron ? Boolean(childContract && entryPath && path.resolve(entryPath) === path.resolve(filename)) : isMain === true;
}

async function runParent() {
  if (process.env.GIGACHAD_PERSISTENCE_PROBE_RUN !== '1') throw new Error('Set GIGACHAD_PERSISTENCE_PROBE_RUN=1 only after coordinated workload release');
  const { captureGenomeHydration, captureGenomeInitialState, assessGenomeHydration } = require('./alive-genome-hydration-evidence.cjs');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gigachad-persistence-proof-'));
  const nonce = crypto.randomUUID(), profile = path.join(directory, 'profile');
  const fixture = path.join(root, `.alive-persistence-${nonce}.html`);
  const paths = { directory, profile, fixture, nonce };
  fs.mkdirSync(profile);
  writeJSON(path.join(directory, 'ownership.json'), { nonce, root, createdAt: new Date().toISOString() });
  assertOwned(paths);
  const output = path.resolve(process.env.GIGACHAD_PERSISTENCE_PROBE_OUTPUT || path.join(root, 'research_notes/alive-overdrive-verification', `persistence-restart-${Date.now()}`));
  if (fs.existsSync(output)) throw new Error('Refusing to overwrite an existing evidence directory');
  fs.mkdirSync(output, { recursive: true });
  const before = sourceHashes();
  const report = { startedAt: new Date().toISOString(), output, paths, sourceHashes: before, cases: [], runs: [],
    scope: 'Actual isolated application process restart and observed constructor restoration; not power-loss or full-model persistence proof',
    requestedPhases: ['normal-worker-commit', 'normal-close', 'two-process-restart', 'constructor-hydration', 'no-recurring-legacy-write'],
    notRun: ['legacy-migration', 'corrupt-bootstrap', 'delayed-bootstrap', 'in-flight-checkpoint-fence', 'write-failure', 'late-acknowledgement'] };
  const reportPath = path.join(output, 'report.json');
  writeJSON(reportPath, report);
  const record = (id, ok, evidence) => { report.cases.push({ id, ok: Boolean(ok), evidence }); writeJSON(reportPath, report); if (!ok) throw new Error(id); };
  try {
    const original = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const observed = observeHost(original, captureGenomeHydration, captureGenomeInitialState);
    fs.writeFileSync(fixture, observed, { flag: 'wx' });
    report.adaptation = { observedHostPath: fixture, originalSHA256: sha(original), observedSHA256: sha(observed),
      scope: 'Only early Storage call observation and a snapshot immediately after actual constructor load; importer/model steps unchanged. Main host allowlist uses this exact owned fixture path.' };
    fs.writeFileSync(path.join(output, 'observed-host.html'), observed);
    const executable = path.resolve(require('electron'));
    report.executable = executable;
    let priorPayload = null, priorRecord = null;
    for (const phase of ['writer', 'reader']) {
      const phaseOutput = path.join(output, phase); fs.mkdirSync(phaseOutput);
      const env = { ...process.env, GIGACHAD_SMOKE: '1', GIGACHAD_TEST_MODE: '1',
        GIGACHAD_PERSISTENCE_PROBE_CHILD: JSON.stringify({ ...paths, output: phaseOutput, phase }) };
      for (const key of Object.keys(env)) if (/^GIGACHAD_PROBE_/.test(key) || ['ELECTRON_RUN_AS_NODE', 'OPENROUTER_API_KEY', 'ELEVENLABS_API_KEY', 'GIGACHAD_LLM_API_KEY'].includes(key)) delete env[key];
      if (phase === 'reader') {
        const independent = readRecord(path.join(profile, 'alive-genome-v1.snapshot'));
        priorPayload = independent.payloadJSON; priorRecord = independent.evidence;
        fs.copyFileSync(path.join(profile, 'alive-genome-v1.snapshot'), path.join(output, 'before-reader.snapshot'));
        writeJSON(path.join(output, 'before-reader-independent.json'), independent.evidence);
      }
      const started = Date.now();
      const child = spawnSync(executable, [__filename], { cwd: root, env, windowsHide: true, encoding: 'utf8', timeout: 90000, maxBuffer: 1024 * 1024 });
      const run = { phase, pid: child.pid, status: child.status, signal: child.signal, elapsedMs: Date.now() - started,
        error: child.error?.message || null, stdout: (child.stdout || '').slice(-4000), stderr: (child.stderr || '').slice(-4000) };
      report.runs.push(run); writeJSON(reportPath, report);
      const childReportPath = path.join(phaseOutput, 'report.json');
      record(`${phase}-child-report-present`, fs.existsSync(childReportPath), run);
      const childReport = JSON.parse(fs.readFileSync(childReportPath, 'utf8'));
      record(`${phase}-process`, child.status === 0 && childReport.completed === true && !childReport.error,
        { pid: child.pid, versions: childReport.versions, userData: childReport.userData, error: childReport.error || null });
      record(`${phase}-source-stability`, JSON.stringify(before) === JSON.stringify(childReport.sourceHashesAfter), { changed: Object.keys(before).filter(key => before[key] !== childReport.sourceHashesAfter?.[key]) });
      const final = readRecord(path.join(profile, 'alive-genome-v1.snapshot'));
      fs.copyFileSync(path.join(profile, 'alive-genome-v1.snapshot'), path.join(phaseOutput, 'after-exit.snapshot'));
      record(`${phase}-all-commits-settled`, childReport.commits.every(item => item.result && !item.error && Number.isSafeInteger(item.replyOrder)),
        { observed: childReport.commits.length, unsettled: childReport.commits.filter(item => !item.result || item.error || !Number.isSafeInteger(item.replyOrder)).map(item => ({ jobId: item.jobId, error: item.error })) });
      const commits = childReport.commits.filter(item => item.result?.persistenceVerified === true).sort((a,b) => a.replyOrder - b.replyOrder);
      const last = commits.at(-1);
      const ordered = commits.every((item,index) => Number.isSafeInteger(item.result.revision) && item.result.revision > (index ? commits[index-1].result.revision : 0));
      record(`${phase}-latest-acknowledged-revision`, Boolean(last) && ordered && last.result.revision === final.header.revision,
        { revision: final.header.revision, acknowledgedRevisions: commits.map(item => item.result.revision) });
      const submitted = fs.readFileSync(path.join(phaseOutput, last.payloadFile), 'utf8');
      const verified = readRecord(path.join(profile, 'alive-genome-v1.snapshot'), { expectedJSON: submitted, expectedRevision: last.result.revision });
      writeJSON(path.join(phaseOutput, 'independent-durable.json'), verified.evidence);
      const shutdown = JSON.parse(fs.readFileSync(path.join(profile, 'alive-genome-shutdown.json'), 'utf8'));
      writeJSON(path.join(phaseOutput, 'shutdown-receipt.json'), shutdown);
      const events = childReport.lifecycle;
      const closeAt = events.findIndex(event => event.name === 'normal-window-close-request');
      const closedAt = events.findIndex(event => event.name === 'window-closed' && event.requested);
      const quitAt = events.findIndex(event => event.name === 'will-quit');
      record(`${phase}-verified-normal-close`, shutdown.status === 'persisted-and-drained' && shutdown.persistenceVerified === true && shutdown.drain?.settled === true &&
        shutdown.renderer?.revision === final.header.revision && closeAt >= 0 && closedAt > closeAt && quitAt > closedAt,
        { shutdown, closeAt, closedAt, quitAt });
      const markersMatch = payload => payload.W_actor?.[0] === 0.31416 && payload.W_world?.at(-1) === -0.27183 && payload.trainableHub?.W_perc_enc?.[0] === 0.4375 && payload.pelletsEatenCount === 98765;
      record(`${phase}-committed-sentinels`, markersMatch(final.payload), { actor: final.payload.W_actor?.[0], worldTail: final.payload.W_world?.at(-1), perception: final.payload.trainableHub?.W_perc_enc?.[0], pellets: final.payload.pelletsEatenCount });
      if (phase === 'writer') {
        const explicit = commits.find(item => item.result.revision === childReport.flush?.revision && item.ownerId === childReport.flush?.ownerId && item.epoch === childReport.flush?.epoch && item.jobId === childReport.flush?.jobId);
        const explicitPayload = explicit ? JSON.parse(fs.readFileSync(path.join(phaseOutput, explicit.payloadFile), 'utf8')) : null;
        record('explicit-worker-flush', Boolean(explicit) && markersMatch(explicitPayload) && childReport.workerAfterFlush?.workerMode === 'worker' && childReport.workerAfterFlush?.fallbackCount === 0 && childReport.workerAfterFlush?.storageMode === 'async-main',
          { revision: childReport.flush?.revision, observedCommit: Boolean(explicit), worker: childReport.workerAfterFlush });
        const natural = childReport.natural;
        record('no-recurring-legacy-write', natural?.durationMs >= 10000 && natural?.legacyWrites?.length === 0 && natural?.verifiedCommitDelta >= 2, natural);
      } else {
        record('distinct-processes', report.runs[0].pid !== child.pid && report.runs[0].status === 0, report.runs.map(({ phase, pid, status }) => ({ phase, pid, status })));
        const boot = JSON.parse(fs.readFileSync(path.join(phaseOutput, 'boot-observation.json'), 'utf8'));
        record('canonical-bootstrap', boot.beforeBaseline && boot.bootstrap?.status === 'ready' && boot.bootstrap?.json === priorPayload && boot.bootstrap?.revision === priorRecord.revision,
          { status: boot.bootstrap?.status, revision: boot.bootstrap?.revision, expected: priorRecord.revision });
        const hydration = assessGenomeHydration(priorPayload, boot.snapshot, { initialState: boot.initialState });
        writeJSON(path.join(phaseOutput, 'hydration-assessment.json'), hydration);
        record('actual-constructor-hydration', hydration.ok, hydration);
        record('monotonic-durable-revision', final.header.revision > priorRecord.revision, { before: priorRecord.revision, after: final.header.revision });
      }
    }
    report.completed = true;
  } catch (error) { report.error = String(error.stack || error); process.exitCode = 1; }
  finally {
    report.sourceHashesAfter = sourceHashes();
    report.changedSources = Object.keys(before).filter(key => before[key] !== report.sourceHashesAfter[key]);
    assertOwned(paths);
    if (fs.existsSync(fixture)) fs.unlinkSync(fixture);
    report.cleanup = { fixtureRemoved: !fs.existsSync(fixture), isolatedProfileRetained: profile };
    report.finishedAt = new Date().toISOString();
    report.ok = report.completed === true && !report.error && report.changedSources.length === 0 && report.cases.every(item => item.ok);
    if (!report.ok) process.exitCode = 1;
    writeJSON(reportPath, report);
    console.log(JSON.stringify({ output, ok: report.ok, cases: report.cases.map(({ id, ok }) => ({ id, ok })), error: report.error || null }));
  }
}

async function runChild() {
  const contract = JSON.parse(process.env.GIGACHAD_PERSISTENCE_PROBE_CHILD || 'null');
  if (!contract) throw new Error('Missing isolated child contract');
  assertOwned(contract);
  globalThis.__alivePersistenceProbe = contract;
  const { app, BrowserWindow, ipcMain } = require('electron');
  const report = { phase: contract.phase, pid: process.pid, startedAt: new Date().toISOString(), versions: process.versions,
    commits: [], lifecycle: [], console: [], loadFailures: [], processFailures: [], sourceHashes: sourceHashes() };
  const reportPath = path.join(contract.output, 'report.json');
  let finishing = false, closeRequested = false, completionOrder = 0, retainedPayloadBytes = 0;
  const save = () => {
    report.sourceHashesAfter = sourceHashes();
    writeJSON(reportPath, report);
  };
  const handle = ipcMain.handle.bind(ipcMain);
  ipcMain.handle = (channel, listener) => handle(channel, async (event, ...args) => {
    if (channel !== 'alive-genome-commit') return listener(event, ...args);
    const payload = args[0], entry = { receivedAt: Date.now(), ownerId: payload?.ownerId, epoch: payload?.epoch, jobId: payload?.jobId };
    if (typeof payload?.json !== 'string' || Buffer.byteLength(payload.json, 'utf8') > 32 * 1024 * 1024) throw new Error('Unexpected observed commit payload');
    retainedPayloadBytes += Buffer.byteLength(payload.json, 'utf8');
    if (report.commits.length >= 32 || retainedPayloadBytes > 192 * 1024 * 1024) throw new Error('Verification payload retention bound exceeded');
    const filename = `commit-${report.commits.length + 1}.json`;
    // Retain the exact unmodified argument before invoking production. These
    // diagnostic file writes are outside any performance qualification.
    fs.writeFileSync(path.join(contract.output, filename), payload.json, { flag: 'wx' });
    entry.payloadFile = filename; entry.payloadSha256 = sha(Buffer.from(payload.json, 'utf8'));
    report.commits.push(entry);
    try { entry.result = await listener(event, ...args); entry.repliedAt = Date.now(); entry.replyOrder = ++completionOrder; return entry.result; }
    catch (error) { entry.error = String(error.message || error); throw error; }
  });
  for (const name of ['before-quit', 'will-quit', 'window-all-closed']) app.on(name, () => report.lifecycle.push({ name, at: Date.now() }));
  process.on('exit', code => { report.exitCode = code; report.exitedAt = new Date().toISOString(); try { save(); } catch (_) {} });
  const fatal = error => { report.error = String(error?.stack || error).slice(0, 4000); save(); app.exit(1); };
  process.on('uncaughtException', fatal); process.on('unhandledRejection', fatal);
  save();
  const watchdog = setTimeout(() => { report.error = 'Actual child exceeded 75-second bound'; save(); app.exit(1); }, 75000);
  app.on('browser-window-created', (_event, win) => {
    report.lifecycle.push({ name: 'browser-window-created', at: Date.now(), id: win.id }); save();
    win.setFocusable(false); win.setIgnoreMouseEvents(true);
    win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      if (report.console.length < 80 && level >= 2) report.console.push({ at: Date.now(), level, message: String(message).slice(0, 500), line, sourceId });
    });
    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (report.loadFailures.length < 20) report.loadFailures.push({ at: Date.now(), errorCode, errorDescription, validatedURL, isMainFrame }); save();
    });
    win.webContents.on('render-process-gone', (_event, details) => { report.processFailures.push({ at: Date.now(), ...details }); save(); });
    win.on('closed', () => { report.lifecycle.push({ name: 'window-closed', at: Date.now(), requested: closeRequested }); });
    win.webContents.once('did-finish-load', async () => {
      if (finishing) return; finishing = true;
      const evaluate = code => win.webContents.executeJavaScript(code, true);
      try {
        report.userData = app.getPath('userData'); report.hostURL = win.webContents.getURL();
        if (path.resolve(report.userData) !== path.resolve(contract.profile)) throw new Error('Actual profile differs from owned contract');
        const required = fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('systems/alive-startup-loader.js');
        report.startup = await evaluate('(' + waitForRendererStartup.toString() + ')(' + JSON.stringify({ required }) + ')');
        const boot = await evaluate('window.__alivePersistenceBootObservation');
        if (!boot?.snapshot || !boot.beforeBaseline) throw new Error('Constructor observation missing');
        writeJSON(path.join(contract.output, 'boot-observation.json'), boot);
        if (contract.phase === 'writer') {
          win.showInactive();
          await evaluate('window.alienAutoNavigateLinks=false; window.startAliveOverdrive(); true');
          const at = performance.now(), start = report.commits.filter(item => item.result?.persistenceVerified).length;
          const beginEvents = await evaluate('window.__alivePersistenceStorageEvents.length');
          await sleep(11000);
          const legacyWrites = await evaluate(`window.__alivePersistenceStorageEvents.slice(${beginEvents})`);
          report.natural = { durationMs: performance.now() - at, legacyWrites,
            verifiedCommitDelta: report.commits.filter(item => item.result?.persistenceVerified).length - start };
          report.pause = await evaluate('(' + capturePauseDiagnostics.toString() + ')({label:"persistence-sentinel-pause"})');
          report.pauseAssessment = assessPauseEvidence(report.pause);
          if (!report.pauseAssessment.ok) throw new Error('Guest authority did not settle before sentinel snapshot: ' + report.pauseAssessment.reasons.join('; '));
          await evaluate(`(()=>{const h=humunculusRuntime;h.W_actor[0]=0.314159;h.W_world[h.W_world.length-1]=-0.271828;h.trainableAlifeNeuralHub.W_perc_enc[0]=0.4375;h.pelletsEatenCount=98765;return true;})()`);
          report.flush = await evaluate("Promise.resolve(window.aliveAutosave.flush('independent-durability-proof'))");
          if (report.flush?.persistenceVerified !== true) throw new Error('Explicit production flush was not verified');
          report.workerAfterFlush = await evaluate('window.aliveAutosave.snapshot()');
        } else if (contract.phase === 'reader') {
          await sleep(1000);
          report.readerStatus = await evaluate('({autosave:window.aliveAutosave.snapshot(),running:window.aliveOverdrive.running,simulationTick:humunculusRuntime.simulationTick})');
        } else throw new Error('Unsupported child phase');
        report.completed = true; save(); closeRequested = true;
        report.lifecycle.push({ name: 'normal-window-close-request', at: Date.now() });
        win.close();
        clearTimeout(watchdog);
        setTimeout(() => { report.error = 'Normal close did not finish within 15 seconds'; save(); app.exit(1); }, 15000).unref();
      } catch (error) { report.error = String(error.stack || error); save(); app.exit(1); }
    });
  });
  const Module = require('node:module'), filename = path.join(root, 'main.js');
  const original = fs.readFileSync(filename, 'utf8'), adapted = adaptMain(original);
  report.mainAdaptation = { originalSHA256: sha(original), adaptedSHA256: sha(adapted) };
  const compiled = new Module(filename, module); compiled.filename = filename; compiled.paths = Module._nodeModulePaths(root);
  compiled._compile(adapted, filename);
}

module.exports = { adaptMain, observeHost, replaceOnce, assertOwned, isProbeEntry, waitForRendererStartup };
if (isProbeEntry({ electron: process.versions.electron, childContract: process.env.GIGACHAD_PERSISTENCE_PROBE_CHILD,
  entryPath: process.argv[1], isMain: require.main === module }, __filename)) {
  (process.versions.electron ? runChild() : runParent()).catch(error => { console.error(error.stack || error); process.exitCode = 1; });
}
