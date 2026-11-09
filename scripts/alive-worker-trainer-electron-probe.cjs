'use strict';
// Pure checks: node scripts/alive-worker-trainer-electron-probe.cjs --self-test
// Coordinated native run only: GIGACHAD_WORKER_TRAINER_PROBE_RUN=1 node <this file>
// Runs no app entry point, engine constructor, model assets or normal profile.
// The transport fixture holds a REAL computed Worker message callback. Its
// later direct release does not claim Chromium delivers messages after terminate.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { pathToFileURL, fileURLToPath } = require('node:url');
const { spawnSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const PREFIX = 'gigachad-worker-trainer-proof-';
const ENGINE = 'systems/alife-25-bleeding-edge-models.js';
const SCRIPT = 'scripts/alive-worker-trainer-electron-probe.cjs';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const key = filename => process.platform === 'win32' ? path.resolve(filename).toLowerCase() : path.resolve(filename);
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
const sourceHashes = () => ({ [ENGINE]: hash(fs.readFileSync(path.join(ROOT, ENGINE))), [SCRIPT]: hash(fs.readFileSync(__filename)) });
function within(root, filename) {
  const relative = path.relative(path.resolve(root), path.resolve(filename));
  return Boolean(relative) && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}
function resolveRequest(url, directory, allowlist) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'file:' || parsed.host && parsed.host !== 'localhost' || parsed.search || parsed.hash) throw Error('Only plain owned file URLs are served');
  const filename = fileURLToPath(parsed);
  if (!within(directory, filename) || !allowlist.has(key(filename))) throw Error('File is outside the exact fixture allowlist');
  return allowlist.get(key(filename));
}
function assertOwned(contract) {
  if (!contract || typeof contract.directory !== 'string' || !/^[a-f0-9-]{36}$/.test(contract.nonce || '')) throw Error('Invalid ownership contract');
  const directory = path.resolve(contract.directory);
  if (key(path.dirname(directory)) !== key(os.tmpdir()) || !path.basename(directory).startsWith(PREFIX) ||
      fs.lstatSync(directory).isSymbolicLink() || key(fs.realpathSync(directory)) !== key(directory)) throw Error('Probe requires a direct owned temporary directory');
  const marker = JSON.parse(fs.readFileSync(path.join(directory, 'ownership.json'), 'utf8'));
  if (marker.nonce !== contract.nonce || marker.root !== ROOT) throw Error('Probe ownership marker mismatch');
  for (const name of ['profile', 'session-data', 'logs', 'crashes', 'fixtures']) {
    const candidate = path.join(directory, name);
    if (!within(directory, candidate) || !fs.lstatSync(candidate).isDirectory() || fs.lstatSync(candidate).isSymbolicLink() ||
        key(fs.realpathSync(candidate)) !== key(candidate)) throw Error('Invalid owned probe subdirectory');
  }
  return directory;
}
function bounded(promise, label, milliseconds = 10000) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error(label + ' timed out')), milliseconds); })])
    .finally(() => clearTimeout(timer));
}

// This whole function becomes the browser fixture. The production engine file
// is loaded unchanged before it; only native message delivery is instrumented.
async function browserProbe(nonce) {
  const checks = [], events = [], workers = [], createdURLs = [], revokedURLs = [];
  let engine, failure;
  const NativeWorker = window.Worker;
  const createURL = URL.createObjectURL.bind(URL), revokeURL = URL.revokeObjectURL.bind(URL);
  const check = (name, passed, evidence = {}) => {
    checks.push({ name, passed: Boolean(passed), evidence });
    if (!passed) throw Error(name);
  };
  const rawHex = view => Array.from(new Uint8Array(view.buffer, view.byteOffset, view.byteLength), byte => byte.toString(16).padStart(2, '0')).join('');
  const digest = async view => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
    new Uint8Array(view.buffer, view.byteOffset, view.byteLength))), byte => byte.toString(16).padStart(2, '0')).join('');
  const expected = (input, before, epoch) => {
    const deltas = new Float32Array(16), next = new Float32Array(16); let squared = 0;
    for (let i = 0; i < 16; i++) {
      const v = Number(input[i] || 0), target = Math.tanh(v * 0.92 + Math.sin(epoch * 0.3 + i) * 0.15);
      const gradient = (v - target) * 0.05;
      deltas[i] = -gradient; squared += gradient * gradient;
      next[i] = Math.max(-1.5, Math.min(1.5, before[i] + deltas[i]));
    }
    return { next, norm: Number(Math.sqrt(squared).toFixed(5)) };
  };
  class NativeTransportFixture {
    constructor(url) {
      this.native = new NativeWorker(url);
      this.nativeIdentity = this.native instanceof NativeWorker;
      this.terminated = false; this.onmessage = this.onerror = this.onmessageerror = null;
      this.expectation = null; this.held = null; this.received = 0;
      workers.push(this);
      this.native.addEventListener('message', event => {
        const expectation = this.expectation; this.expectation = null; this.received++;
        if (!expectation) { failure = 'Unexpected native worker result'; return; }
        try {
          const callback = this.onmessage;
          if (typeof callback !== 'function') throw Error('Production message callback missing');
          if (expectation.hold) this.held = { callback, event };
          else callback.call(this, event);
          events.push({ type: 'actual-native-result', trusted: event.isTrusted, held: expectation.hold,
            generation: event.data.generation, jobId: event.data.jobId, targetEpoch: event.data.targetEpoch });
          expectation.resolve({ trusted: event.isTrusted, data: event.data });
        } catch (error) { expectation.reject(error); }
      });
      this.native.addEventListener('error', event => {
        this.onerror?.(event); this.expectation?.reject(Error(event.message || 'Native worker failed')); this.expectation = null;
      });
      this.native.addEventListener('messageerror', event => {
        this.onmessageerror?.(event); this.expectation?.reject(Error('Native worker result decode failed')); this.expectation = null;
      });
    }
    expect(hold) {
      if (this.expectation || this.held) throw Error('Fixture permits exactly one outstanding result');
      let timer;
      const promise = new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(Error('Native worker result timed out')), 6000);
        this.expectation = { hold, resolve, reject };
      });
      return promise.finally(() => clearTimeout(timer));
    }
    releaseHeld() {
      const held = this.held; this.held = null;
      if (!held) throw Error('No actual computed callback is held');
      held.callback.call(this, held.event);
      events.push({ type: 'fixture-released-old-callback', afterTerminate: this.terminated });
    }
    postMessage(...args) { return this.native.postMessage(...args); }
    terminate() { this.terminated = true; this.native.terminate(); }
  }
  const observed = { scope: 'Actual production methods and native Blob Worker. Held callback release is a transport fixture, not native post-terminate delivery.',
    checks, events, phases: [], constructorInvoked: false, nativeWorkers: 0, nativeResults: 0, final: null };
  try {
    check('native-worker-and-production-prototype-available', typeof NativeWorker === 'function' && typeof window.BleedEdge25AlifeEngine === 'function');
    window.Worker = NativeTransportFixture;
    URL.createObjectURL = blob => { const url = createURL(blob); createdURLs.push(url); return url; };
    URL.revokeObjectURL = url => { revokedURLs.push(url); return revokeURL(url); };
    engine = Object.create(window.BleedEdge25AlifeEngine.prototype);
    engine.W_hyper_u = Float32Array.from({ length: 16 }, (_, i) => (i - 8) / 20);
    const input = Float32Array.from({ length: 16 }, (_, i) => (i - 7) / 11);
    const originalField = engine.W_hyper_u, originalBuffer = originalField.buffer;
    const apply = async name => {
      const worker = workers.at(-1), before = new Float32Array(engine.W_hyper_u), epoch = engine.workerTrainerSnapshot().committedEpoch;
      const arrival = worker.expect(false), job = engine.dispatchWorkerTrainer(input);
      check(name + '-submitted', job.status === 'submitted' && job.targetEpoch === epoch + 1);
      const result = await arrival, oracle = expected(input, before, epoch + 1), snapshot = engine.workerTrainerSnapshot();
      check(name + '-actual-native-equation-and-epoch', result.trusted === true && rawHex(engine.W_hyper_u) === rawHex(oracle.next) &&
        snapshot.committedEpoch === epoch + 1 && snapshot.lastReplayGradNorm === oracle.norm && snapshot.pendingJobId === null,
        { committedEpoch: snapshot.committedEpoch, targetBytes: engine.W_hyper_u.byteLength, targetDigest: await digest(engine.W_hyper_u) });
      return snapshot;
    };
    check('production-resume-ready', engine.resumeWorkerTrainer().status === 'ready');
    await apply('initial');
    for (const [name, flag] of [['pause', null], ['restore', '__aliveCheckpointRestore'], ['close', '__alivePersistenceClosing']]) {
      const worker = workers.at(-1), before = rawHex(engine.W_hyper_u), state = engine.workerTrainerSnapshot();
      const arrival = worker.expect(true), job = engine.dispatchWorkerTrainer(input);
      check(name + '-real-job-submitted', job.status === 'submitted');
      const result = await arrival;
      check(name + '-native-computation-held-before-application', result.trusted === true && rawHex(engine.W_hyper_u) === before &&
        engine.workerTrainerSnapshot().committedEpoch === state.committedEpoch && typeof worker.held?.callback === 'function');
      if (flag) window[flag] = true;
      const suspended = engine.suspendWorkerTrainer(name === 'pause' ? 'paused' : name === 'restore' ? 'checkpoint-restore' : 'shutdown');
      check(name + '-production-suspend-retires-worker', suspended.phase === 'suspended' && suspended.active === false &&
        suspended.pendingJobId === null && suspended.generation > state.generation && worker.terminated &&
        worker.onmessage === null && worker.onerror === null && worker.onmessageerror === null);
      check(name + '-submission-remains-blocked', engine.dispatchWorkerTrainer(input).status === 'blocked');
      if (flag) check(name + '-flag-blocks-resume', engine.resumeWorkerTrainer().status === 'blocked');
      worker.releaseHeld();
      const after = engine.workerTrainerSnapshot();
      check(name + '-old-computed-callback-cannot-mutate', rawHex(engine.W_hyper_u) === before && after.committedEpoch === state.committedEpoch &&
        after.pendingJobId === null && after.discarded === state.discarded + 1 && after.rejectedReplies === state.rejectedReplies + 1);
      observed.phases.push({ name, heldNativeResult: true, oldCallbackReleasedAfterTerminate: true, committedEpochBefore: state.committedEpoch,
        committedEpochAfterOldCallback: after.committedEpoch, cancelledGeneration: state.generation, retiredGeneration: suspended.generation,
        unchangedTargetDigest: await digest(engine.W_hyper_u) });
      // Each case is an isolated synthetic lifecycle. The fixture explicitly
      // clears its flag for recovery; actual shutdown never gets reopened here.
      if (flag) window[flag] = false;
      const resumed = engine.resumeWorkerTrainer({ expectedGeneration: suspended.generation });
      check(name + '-new-generation-resume', resumed.status === 'ready' && resumed.generation > suspended.generation && workers.at(-1) !== worker);
      await apply(name + '-recovery');
    }
    check('target-allocation-never-replaced', engine.W_hyper_u === originalField && engine.W_hyper_u.buffer === originalBuffer);
    check('exact-actual-computation-and-commit-counts', events.filter(event => event.type === 'actual-native-result').length === 7 &&
      engine.workerTrainerSnapshot().applied === 4 && engine.workerTrainerSnapshot().committedEpoch === 4 && engine.workerTrainerSnapshot().discarded === 3);
  } catch (error) { observed.error = String(error.stack || error); }
  finally {
    window.__aliveCheckpointRestore = window.__alivePersistenceClosing = false;
    if (engine) observed.final = engine.disposeWorkerTrainer('probe-cleanup');
    observed.nativeWorkers = workers.length; observed.nativeResults = workers.reduce((total, worker) => total + worker.received, 0);
    const clean = workers.every(worker => worker.nativeIdentity && worker.terminated && worker.onmessage === null &&
      worker.onerror === null && worker.onmessageerror === null && !worker.held) && createdURLs.length === revokedURLs.length &&
      new Set(createdURLs).size === createdURLs.length && createdURLs.every(url => revokedURLs.filter(revoked => revoked === url).length === 1);
    checks.push({ name: 'all-owned-native-workers-and-blob-urls-retired', passed: clean,
      evidence: { nativeWorkers: workers.length, createdURLs: createdURLs.length, revokedURLs: revokedURLs.length } });
    // Best-effort cleanup even when a check fails; never leave a probe worker live.
    for (const worker of workers) { worker.held = null; worker.native.terminate(); }
    for (const url of createdURLs) if (!revokedURLs.includes(url)) revokeURL(url);
    window.Worker = NativeWorker; URL.createObjectURL = createURL; URL.revokeObjectURL = revokeURL;
  }
  if (failure) observed.error = failure;
  observed.completed = !observed.error && checks.every(check => check.passed);
  window.workerTrainerProbe.finish({ nonce, observed });
}
const PRELOAD = `'use strict';const {contextBridge,ipcRenderer}=require('electron');contextBridge.exposeInMainWorld('workerTrainerProbe',{finish:value=>ipcRenderer.send('worker-trainer-probe-finished',value)});`;
function prepareFixtures(directory, nonce) {
  const base = path.join(directory, 'fixtures');
  const files = {
    'index.html': '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'self\' file:; worker-src blob:"><title>Isolated native Worker proof</title></head><body><script src="engine.js"></script><script src="fixture.js"></script></body></html>',
    'engine.js': fs.readFileSync(path.join(ROOT, ENGINE)),
    'fixture.js': '(' + browserProbe.toString() + ')(' + JSON.stringify(nonce) + ');'
  };
  const manifest = {};
  for (const [name, content] of Object.entries(files)) {
    const filename = path.join(base, name); fs.writeFileSync(filename, content, { flag: 'wx' });
    manifest['fixtures/' + name] = hash(fs.readFileSync(filename));
  }
  fs.writeFileSync(path.join(directory, 'preload.cjs'), PRELOAD, { flag: 'wx' });
  manifest['preload.cjs'] = hash(fs.readFileSync(path.join(directory, 'preload.cjs')));
  return manifest;
}
async function child() {
  const contract = JSON.parse(process.env.GIGACHAD_WORKER_TRAINER_PROBE_CHILD || 'null');
  const directory = assertOwned(contract), output = path.join(directory, 'child-report.json');
  const { app, BrowserWindow, session, ipcMain } = require('electron');
  app.setPath('userData', path.join(directory, 'profile')); app.setPath('sessionData', path.join(directory, 'session-data'));
  app.setPath('crashDumps', path.join(directory, 'crashes')); app.setAppLogsPath(path.join(directory, 'logs'));
  app.disableHardwareAcceleration(); app.commandLine.appendSwitch('disable-background-networking');
  const report = { startedAt: new Date().toISOString(), pid: process.pid, versions: process.versions,
    scope: 'Native Blob Worker with copied production engine methods on prototype-only synthetic engine. No constructor, app, assets, profile, persistence, full-model or continuity qualification.',
    sourceHashes: sourceHashes(), fixtures: contract.fixtures, checks: [], requests: [], networkRequestsBlocked: 0, deniedRequests: 0, completed: false };
  const save = () => write(output, report);
  const check = (name, passed, evidence = {}) => { report.checks.push({ name, passed: Boolean(passed), evidence }); save(); if (!passed) throw Error(name); };
  const fatal = error => { report.error = String(error.stack || error); report.completed = false; try { save(); } catch (_) {} app.exit(1); };
  process.on('uncaughtException', fatal); process.on('unhandledRejection', fatal);
  const deadline = setTimeout(() => fatal(Error('Probe exceeded 45-second hard deadline')), 45000);
  app.on('window-all-closed', () => {});
  let win, ses, listener;
  try {
    check('source-hashes-match-parent', JSON.stringify(report.sourceHashes) === JSON.stringify(contract.sourceHashes));
    for (const [relative, digest] of Object.entries(contract.fixtures)) {
      const filename = path.join(directory, relative);
      if (!within(directory, filename) || fs.lstatSync(filename).isSymbolicLink() || key(fs.realpathSync(filename)) !== key(filename) || hash(fs.readFileSync(filename)) !== digest) throw Error('Fixture integrity mismatch');
    }
    check('exact-production-engine-copy', contract.fixtures['fixtures/engine.js'] === report.sourceHashes[ENGINE]);
    await app.whenReady();
    check('owned-profile-and-session-directories', key(app.getPath('userData')) === key(path.join(directory, 'profile')) && key(app.getPath('sessionData')) === key(path.join(directory, 'session-data')));
    const base = path.join(directory, 'fixtures'), files = new Map();
    for (const relative of Object.keys(contract.fixtures)) {
      const filename = path.join(directory, relative); if (within(base, filename)) files.set(key(filename), filename);
    }
    ses = session.fromPartition('worker-trainer-' + contract.nonce, { cache: false });
    ses.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    ses.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (_details, callback) => { report.networkRequestsBlocked++; callback({ cancel: true }); });
    ses.protocol.handle('file', request => {
      try {
        if (report.requests.length >= 8) throw Error('Fixture request bound exceeded');
        const filename = resolveRequest(request.url, base, files);
        if (fs.lstatSync(filename).isSymbolicLink() || key(fs.realpathSync(filename)) !== key(filename)) throw Error('Fixture path changed');
        report.requests.push(path.relative(base, filename));
        return new Response(fs.readFileSync(filename), { headers: { 'content-type': filename.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8', 'cache-control': 'no-store' } });
      } catch (error) { report.deniedRequests++; report.protocolError = String(error.message || error); return new Response('Refused', { status: 403 }); }
    });
    win = new BrowserWindow({ show: false, focusable: false, skipTaskbar: true, webPreferences: {
      session: ses, preload: path.join(directory, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true,
      webSecurity: true, backgroundThrottling: false } });
    const completed = new Promise(resolve => {
      listener = (event, value) => { if (event.sender === win.webContents && value?.nonce === contract.nonce) resolve(value.observed); };
      ipcMain.on('worker-trainer-probe-finished', listener);
    });
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', event => event.preventDefault());
    await bounded(win.loadURL(pathToFileURL(path.join(base, 'index.html')).href), 'Fixture page load');
    report.observed = await bounded(completed, 'Native worker proof', 30000);
    check('hidden-isolated-window', !win.isVisible());
    check('fixture-reported-complete', report.observed?.completed === true, { checks: report.observed?.checks?.length, error: report.observed?.error || null });
    check('all-native-worker-checks-pass', Array.isArray(report.observed.checks) && report.observed.checks.length >= 30 && report.observed.checks.every(item => item.passed === true));
    check('expected-native-result-count', report.observed.nativeResults === 7 && report.observed.nativeWorkers === 4 && report.observed.final?.phase === 'disposed' && report.observed.final.committedEpoch === 4);
    check('only-owned-files-no-network', report.deniedRequests === 0 && report.networkRequestsBlocked === 0 && report.requests.length === 3);
    report.sourceHashesAfter = sourceHashes();
    check('source-hashes-stable', JSON.stringify(report.sourceHashesAfter) === JSON.stringify(report.sourceHashes));
    report.completed = true;
  } catch (error) { report.error = String(error.stack || error); }
  finally {
    clearTimeout(deadline); if (listener) ipcMain.removeListener('worker-trainer-probe-finished', listener);
    if (win && !win.isDestroyed()) win.destroy(); if (ses) ses.protocol.unhandle('file');
    report.finishedAt = new Date().toISOString(); save(); app.exit(report.completed ? 0 : 1);
  }
}
function parent() {
  if (process.env.GIGACHAD_WORKER_TRAINER_PROBE_RUN !== '1') throw Error('Explicit coordinated probe opt-in required');
  const before = sourceHashes(), directory = fs.mkdtempSync(path.join(os.tmpdir(), PREFIX)), nonce = crypto.randomUUID();
  for (const name of ['profile', 'session-data', 'logs', 'crashes', 'fixtures']) fs.mkdirSync(path.join(directory, name));
  write(path.join(directory, 'ownership.json'), { nonce, root: ROOT });
  const contract = { directory, nonce, sourceHashes: before }; assertOwned(contract);
  contract.fixtures = prepareFixtures(directory, nonce);
  const env = { ...process.env, GIGACHAD_WORKER_TRAINER_PROBE_CHILD: JSON.stringify(contract) };
  for (const name of Object.keys(env)) if (name !== 'GIGACHAD_WORKER_TRAINER_PROBE_CHILD' &&
    (/^GIGACHAD_/.test(name) || /API_KEY|ACCESS_TOKEN|SECRET/.test(name) || ['ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS'].includes(name))) delete env[name];
  const executable = path.resolve(require('electron'));
  const run = spawnSync(executable, [__filename], { cwd: ROOT, env, windowsHide: true, timeout: 60000, encoding: 'utf8', maxBuffer: 1024 * 1024 });
  const childFile = path.join(directory, 'child-report.json'), childReport = fs.existsSync(childFile) ? JSON.parse(fs.readFileSync(childFile, 'utf8')) : null;
  const report = { directory, executable, sourceHashes: before, sourceHashesAfter: sourceHashes(),
    run: { pid: run.pid, exitCode: run.status, signal: run.signal, error: run.error?.message || null,
      stdout: run.stdout?.slice(-2000), stderr: run.stderr?.slice(-2000) }, childReport,
    completed: Boolean(run.status === 0 && childReport?.completed === true && !childReport.error && childReport.checks.every(item => item.passed === true)) };
  if (JSON.stringify(before) !== JSON.stringify(report.sourceHashesAfter)) { report.completed = false; report.error = 'Source changed during probe'; }
  const output = path.join(directory, 'report.json'); write(output, report);
  console.log(JSON.stringify({ report: output, completed: report.completed, hostChecks: childReport?.checks.length || 0, nativeChecks: childReport?.observed?.checks?.length || 0 }));
  if (!report.completed) process.exitCode = 1;
}
function selfTest() {
  const base = path.join(os.tmpdir(), PREFIX + 'self-test'), file = path.join(base, 'engine.js'), allow = new Map([[key(file), file]]);
  assert.equal(resolveRequest(pathToFileURL(file).href, base, allow), file);
  for (const url of ['https://example.test/engine.js', pathToFileURL(file).href + '?x=1', pathToFileURL(file).href + '#x',
    pathToFileURL(path.join(base + '-other', 'engine.js')).href, pathToFileURL(path.join(base, 'other.js')).href,
    pathToFileURL(path.join(base, '..', 'outside.js')).href]) assert.throws(() => resolveRequest(url, base, allow));
  assert.equal(within(base, base), false); assert.equal(within(base, path.join(base, 'profile')), true);
  new vm.Script('(' + browserProbe.toString() + ')("00000000-0000-0000-0000-000000000000");');
  new vm.Script(PRELOAD); new vm.Script(fs.readFileSync(path.join(ROOT, ENGINE), 'utf8'));
  console.log(JSON.stringify({ passed: true, scope: 'Pure syntax and path/allowlist checks only; no Electron or Worker launched', sourceHashes: sourceHashes() }));
}
module.exports = { within, resolveRequest, assertOwned, browserProbe, selfTest };
const electronEntry = Boolean(process.versions.electron && process.argv[1] && key(process.argv[1]) === key(__filename));
if (electronEntry) child().catch(error => { console.error(error.stack || error); require('electron').app.exit(1); });
else if (require.main === module) {
  try { process.argv.includes('--self-test') ? selfTest() : parent(); }
  catch (error) { console.error(error.stack || error); process.exitCode = 1; }
}
