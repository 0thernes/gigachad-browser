'use strict';
// Explicit, isolated browser-semantics probe. This never imports main.js,
// application configuration, a model, or a normal-profile persistence store.
// Run pure checks: node scripts/alive-startup-loader-electron-probe.cjs --self-test
// Coordinated opt-in: GIGACHAD_STARTUP_LOADER_PROBE_RUN=1 node <this file>
// API references:
// https://www.electronjs.org/docs/latest/api/protocol#protocolhandlescheme-handler
// https://www.electronjs.org/docs/latest/api/web-contents#contentsexecutejavascriptcode-usergesture
// https://html.spec.whatwg.org/multipage/scripting.html#execute-the-script-element
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { pathToFileURL, fileURLToPath } = require('node:url');
const { spawnSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const PREFIX = 'gigachad-startup-loader-proof-';
const LOADER = 'systems/alive-startup-loader.js';
const PHASES = Object.freeze(['ready-order', 'cancel-adopt', 'remove-only-control']);
const MODULES = Object.freeze([
  'systems/alife-learning-evidence.js', 'systems/alive-neural-coupling.js',
  'systems/alive-specialist-fusion.js', 'systems/alive-autosave.js',
  'systems/alive-checkpoints.js', 'systems/alive-authority.js',
  'systems/alive-research-policy.js', 'systems/alive-overdrive-adapters.js',
  'systems/alive-workspace-ui.js'
]);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const key = filename => process.platform === 'win32' ? path.resolve(filename).toLowerCase() : path.resolve(filename);
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
const sourceHashes = () => ({ [LOADER]: hash(fs.readFileSync(path.join(ROOT, LOADER))),
  'scripts/alive-startup-loader-electron-probe.cjs': hash(fs.readFileSync(__filename)) });
function within(root, filename) {
  const relative = path.relative(path.resolve(root), path.resolve(filename));
  return Boolean(relative) && !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative);
}
function resolveRequest(url, directory, allowlist) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'file:' || parsed.host && parsed.host !== 'localhost' || parsed.search || parsed.hash) throw Error('Only owned plain file URLs are served');
  const filename = fileURLToPath(parsed);
  if (!within(directory, filename) || !allowlist.has(key(filename))) throw Error('File request is outside the exact fixture allowlist');
  return allowlist.get(key(filename));
}
function assertOwned(contract) {
  if (!contract || typeof contract.nonce !== 'string' || !/^[a-f0-9-]{36}$/.test(contract.nonce) || typeof contract.directory !== 'string') throw Error('Invalid probe ownership contract');
  const directory = path.resolve(contract.directory);
  if (key(path.dirname(directory)) !== key(os.tmpdir()) || !path.basename(directory).startsWith(PREFIX) || fs.lstatSync(directory).isSymbolicLink()) throw Error('Probe directory must be an owned direct temporary child');
  if (key(fs.realpathSync(directory)) !== key(directory)) throw Error('Probe directory resolves outside its declared path');
  const marker = JSON.parse(fs.readFileSync(path.join(directory, 'ownership.json'), 'utf8'));
  if (marker.nonce !== contract.nonce || marker.root !== ROOT) throw Error('Probe ownership marker mismatch');
  for (const name of ['profile', 'session-data', 'logs', 'crashes', 'fixtures']) {
    const candidate = path.join(directory, name);
    if (!within(directory, candidate) || !fs.lstatSync(candidate).isDirectory() || fs.lstatSync(candidate).isSymbolicLink()) throw Error('Invalid owned probe subdirectory');
  }
  return directory;
}

// Serialized trusted fixture code: deliberately stubbed storage and model APIs.
// It exposes observations, not application/model data or real persistence.
function browserSetup(nonce, phase) {
  const state = window.__startupProbeState = { phase, events: [], moduleOrder: [], mainRuns: 0,
    bootCalls: 0, bootValue: null, receipts: [], fenceCalls: 0, blocked: false, controlExecuted: false };
  const emit = value => window.startupProbe.emit({ nonce, phase, ...value });
  const closeListeners = new Set(); let epoch = 0;
  window.gigachad = {
    on(channel, listener) {
      if (channel !== 'alive-genome-close-request') throw Error('Unexpected fixture subscription');
      closeListeners.add(listener); return () => closeListeners.delete(listener);
    },
    async invoke(channel, payload) {
      if (channel !== 'alive-genome-close-result') throw Error('Unexpected fixture invocation');
      state.receipts.push(payload);
      emit({ type: 'close-ack', result: payload.result, pending: state.pending });
      return { status: 'acknowledged' };
    }
  };
  window.aliveGenomePersistence = {
    initialJSON() { state.events.push('initialJSON'); return null; },
    snapshot() { return { status: 'absent', writeAllowed: !state.blocked, applicationFailed: state.blocked, ownerId: 'isolated-startup-fixture', epoch }; },
    markApplied(value, details) { if (value !== false || details.hadJSON !== true) throw Error('Unexpected fixture persistence transition'); state.blocked = true; },
    async fence(request) { state.fenceCalls++; epoch = request.epoch; state.events.push('fence'); return { settled: true, ownerId: 'isolated-startup-fixture', epoch }; }
  };
  window.AlivePrimaryPolicyState = {}; window.AliveLearnedStateRegistry = {}; window.AliveLearnedStateCodec = {};
  window.AlivePrimaryPolicyBootstrap = { async prepare() {
    state.events.push('prepare'); return Object.freeze({ preflight() {}, apply() {}, capture() {}, snapshot() {} });
  } };
  window.__startupProbeEmit = emit;
  window.startupProbe.onCommand(command => {
    if (command.nonce !== nonce || command.phase !== phase) return;
    try {
      if (command.action === 'cancel') {
        const pending = [...document.querySelectorAll('script[data-alive-startup="post"]')].at(-1);
        if (!pending) throw Error('No pending production-loader script');
        for (const listener of [...closeListeners]) listener({ requestId: 'isolated-close' });
        state.pending = { disconnected: !pending.isConnected, ownerDocumentChanged: pending.ownerDocument !== document,
          detachedDocument: pending.ownerDocument.defaultView === null };
        emit({ type: 'cancelled', pending: state.pending, startup: window.aliveStartup.snapshot() });
      } else if (command.action === 'remove-control') {
        const pending = window.__startupProbeControl;
        if (!pending) throw Error('Control script is missing');
        pending.remove();
        state.pending = { disconnected: !pending.isConnected, ownerDocumentChanged: pending.ownerDocument !== document };
        emit({ type: 'control-detached', pending: state.pending });
      } else throw Error('Unknown fixture command');
    } catch (error) { emit({ type: 'fixture-error', error: String(error.message || error) }); }
  });
  addEventListener('load', () => emit({ type: 'document-loaded' }), { once: true });
  emit({ type: 'fixture-installed' });
}
function html(nonce, phase) {
  if (!PHASES.includes(phase)) throw Error('Unknown probe phase');
  const setup = '(' + browserSetup.toString() + ')(' + JSON.stringify(nonce) + ',' + JSON.stringify(phase) + ');';
  const activation = phase === 'remove-only-control'
    ? `<script>const pending=document.createElement('script');pending.src='systems/control.js';pending.async=false;window.__startupProbeControl=pending;document.head.appendChild(pending);</script>`
    : `<script id="gigachad-main-source" type="application/x-gigachad-main">const primaryGlobalLexical=40;window.__startupProbeState.mainRuns++;
      function boot(){const state=window.__startupProbeState;state.bootCalls++;state.bootValue=primaryGlobalLexical+postGlobalLexical+postOrder8;state.globalLexicalIsWindowProperty=Object.hasOwn(window,'primaryGlobalLexical');state.events.push('boot');window.__startupProbeEmit({type:'boot'});}
      window.__aliveStartupRegister(boot);</script><script src="${LOADER}"></script>`;
  return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'self\' \'unsafe-inline\' file:"><title>Isolated startup probe</title><script>' + setup + '</script></head><body>' + activation + '</body></html>';
}
function moduleSource(index) {
  if (!Number.isInteger(index) || index < 0 || index >= MODULES.length) throw Error('Unknown fixture module');
  return `${index === 0 ? 'const postGlobalLexical=2;' : ''}const postOrder${index}=${index};
    window.__startupProbeState.moduleOrder.push(${index});window.__startupProbeEmit({type:'module-executed',index:${index}});
    ${index === 7 ? `window.aliveAutosave={cancelAndDrain:async(reason)=>{window.__startupProbeState.events.push('drain:'+reason);return{settled:true};},resume:()=>{window.__startupProbeState.events.push('resume');return true;},request:(reason)=>{window.__startupProbeState.events.push('request:'+reason);return true;}};window.aliveStartupAutosaveDrain=window.aliveAutosave.cancelAndDrain('startup-hydration');` : ''}`;
}
const PRELOAD = `'use strict';const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('startupProbe',{emit:value=>ipcRenderer.send('startup-loader-probe-event',value),onCommand:listener=>{const handler=(_event,value)=>listener(value);ipcRenderer.on('startup-loader-probe-command',handler);return()=>ipcRenderer.removeListener('startup-loader-probe-command',handler);}});`;
function prepareFixtures(directory, nonce, loaderBytes) {
  fs.writeFileSync(path.join(directory, 'preload.cjs'), PRELOAD, { flag: 'wx' });
  const manifest = {};
  for (const phase of PHASES) {
    const base = path.join(directory, 'fixtures', phase); fs.mkdirSync(path.join(base, 'systems'), { recursive: true });
    const files = { 'index.html': html(nonce, phase), [LOADER]: loaderBytes,
      'systems/control.js': "window.__startupProbeState.controlExecuted=true;window.__startupProbeEmit({type:'control-executed'});" };
    MODULES.forEach((name, index) => { files[name] = moduleSource(index); });
    for (const [name, content] of Object.entries(files)) {
      const filename = path.join(base, name); fs.writeFileSync(filename, content, { flag: 'wx' });
      manifest[path.relative(directory, filename).split(path.sep).join('/')] = hash(fs.readFileSync(filename));
    }
  }
  manifest['preload.cjs'] = hash(fs.readFileSync(path.join(directory, 'preload.cjs')));
  return manifest;
}
function bounded(promise, label, milliseconds = 10000) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error(label + ' timed out')), milliseconds); })]).finally(() => clearTimeout(timer));
}

async function child() {
  const contract = JSON.parse(process.env.GIGACHAD_STARTUP_LOADER_PROBE_CHILD || 'null');
  const directory = assertOwned(contract), reportFile = path.join(directory, 'child-report.json');
  const { app, BrowserWindow, session, ipcMain } = require('electron');
  app.setPath('userData', path.join(directory, 'profile')); app.setPath('sessionData', path.join(directory, 'session-data'));
  app.setPath('crashDumps', path.join(directory, 'crashes')); app.setAppLogsPath(path.join(directory, 'logs'));
  app.disableHardwareAcceleration(); app.commandLine.appendSwitch('disable-background-networking');
  const report = { startedAt: new Date().toISOString(), pid: process.pid, versions: process.versions,
    scope: 'Actual production startup loader and Chromium DOM; isolated fixture main/postmodules and stubbed preparation/storage/close bridge. No application/model/persistence qualification.',
    sourceHashes: sourceHashes(), fixtures: contract.fixtures, phases: [], checks: [], completed: false };
  const save = () => write(reportFile, report);
  const fatal = error => {
    report.error = String(error?.stack || error); report.completed = false;
    try { save(); } catch (_) {}
    app.exit(1);
  };
  process.on('uncaughtException', fatal); process.on('unhandledRejection', fatal);
  const check = (name, passed, evidence = {}) => { report.checks.push({ name, passed: Boolean(passed), evidence }); save(); if (!passed) throw Error(name); };
  const deadline = setTimeout(() => { report.error = 'Probe exceeded 45-second hard deadline'; save(); app.exit(1); }, 45000);
  app.on('window-all-closed', () => {});
  try {
    check('source-hashes-match-parent', JSON.stringify(report.sourceHashes) === JSON.stringify(contract.sourceHashes));
    for (const [relative, digest] of Object.entries(contract.fixtures)) {
      const filename = path.join(directory, relative);
      if (!within(directory, filename) || fs.lstatSync(filename).isSymbolicLink() || key(fs.realpathSync(filename)) !== key(filename) || hash(fs.readFileSync(filename)) !== digest) throw Error('Fixture integrity mismatch');
    }
    await app.whenReady();
    check('owned-user-data-and-session-paths', key(app.getPath('userData')) === key(path.join(directory, 'profile')) && key(app.getPath('sessionData')) === key(path.join(directory, 'session-data')));
    for (const phase of PHASES) {
      const base = path.join(directory, 'fixtures', phase), files = new Map();
      for (const relative of Object.keys(contract.fixtures)) {
        const filename = path.join(directory, relative); if (within(base, filename)) files.set(key(filename), filename);
      }
      const holdPath = phase === 'cancel-adopt' ? path.join(base, MODULES[7]) : phase === 'remove-only-control' ? path.join(base, 'systems/control.js') : null;
      const entered = deferred(), release = deferred(), events = [], waiters = [];
      let sequence = 0, responseReturned = false, held = false;
      const caseReport = { phase, events, requests: [], deniedRequests: 0, networkRequestsBlocked: 0 }; report.phases.push(caseReport);
      const notify = data => {
        const event = { order: ++sequence, ...data }; events.push(event);
        if (events.length > 128) throw Error('Probe event limit exceeded');
        for (const waiter of [...waiters]) if (waiter.type === event.type) { waiters.splice(waiters.indexOf(waiter), 1); waiter.resolve(event); }
      };
      const waitEvent = type => {
        const existing = events.find(event => event.type === type); if (existing) return Promise.resolve(existing);
        return bounded(new Promise(resolve => waiters.push({ type, resolve })), phase + ':' + type);
      };
      const ses = session.fromPartition('startup-loader-' + contract.nonce + '-' + phase, { cache: false });
      ses.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
      ses.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (_details, callback) => { caseReport.networkRequestsBlocked++; callback({ cancel: true }); });
      ses.protocol.handle('file', async request => {
        try {
          if (caseReport.requests.length >= 64) throw Error('Probe request limit exceeded');
          const filename = resolveRequest(request.url, base, files);
          if (fs.lstatSync(filename).isSymbolicLink() || key(fs.realpathSync(filename)) !== key(filename)) throw Error('Fixture file must not redirect through a symbolic link');
          caseReport.requests.push(path.relative(base, filename).split(path.sep).join('/'));
          if (holdPath && key(filename) === key(holdPath)) {
            if (held) throw Error('Held resource requested twice'); held = true;
            notify({ type: 'held-response-entered' }); entered.resolve(); await release.promise;
            responseReturned = true; notify({ type: 'held-response-returned' });
          }
          return new Response(fs.readFileSync(filename), { headers: { 'content-type': filename.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8', 'cache-control': 'no-store' } });
        } catch (error) { caseReport.deniedRequests++; caseReport.protocolError = String(error.message || error); return new Response('Fixture request refused', { status: 403 }); }
      });
      const win = new BrowserWindow({ show: false, focusable: false, skipTaskbar: true, webPreferences: {
        session: ses, preload: path.join(directory, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, backgroundThrottling: false } });
      const listener = (event, value) => {
        if (event.sender !== win.webContents || !value || value.nonce !== contract.nonce || value.phase !== phase) return;
        const { nonce, ...safe } = value; notify(safe);
      };
      ipcMain.on('startup-loader-probe-event', listener);
      win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      win.webContents.on('will-navigate', (event, url) => { if (url !== pathToFileURL(path.join(base, 'index.html')).href) event.preventDefault(); });
      try {
        const loading = win.loadURL(pathToFileURL(path.join(base, 'index.html')).href);
        // Observe rejection immediately while the held script delays load.
        loading.catch(() => {});
        if (holdPath) {
          await bounded(entered.promise, phase + ':held request');
          check(phase + '-response-held-before-command', !responseReturned);
          win.webContents.send('startup-loader-probe-command', { nonce: contract.nonce, phase,
            action: phase === 'cancel-adopt' ? 'cancel' : 'remove-control' });
          if (phase === 'cancel-adopt') {
            const cancelled = await waitEvent('cancelled'), acknowledged = await waitEvent('close-ack');
            check('cancel-changed-script-document-before-response', cancelled.pending?.ownerDocumentChanged === true && cancelled.pending?.disconnected === true && cancelled.pending?.detachedDocument === true && !responseReturned);
            check('early-close-explicitly-unverified', acknowledged.result?.status === 'unverified' && acknowledged.result.persistenceVerified === false && acknowledged.result.settled === true);
          } else {
            const removed = await waitEvent('control-detached');
            check('control-removed-without-document-change', removed.pending?.disconnected === true && removed.pending.ownerDocumentChanged === false && !responseReturned);
          }
          notify({ type: 'held-response-release' }); release.resolve();
        }
        await bounded(loading, phase + ':page load'); await waitEvent('document-loaded');
        // executeJavaScript is used only after loading. Close commands above
        // travel through the preload bridge because execution can wait for load.
        const observed = await bounded(win.webContents.executeJavaScript(`(async()=>{if(window.aliveStartup)await window.aliveStartup.ready;return {state:window.__startupProbeState,startup:window.aliveStartup?.snapshot(),inert:document.body.inert,visible:document.visibilityState};})()`), phase + ':final observation');
        caseReport.observed = observed;
        check(phase + '-hidden-window', win.isVisible() === false);
        check(phase + '-only-allowlisted-fixture-files', caseReport.deniedRequests === 0 && caseReport.networkRequestsBlocked === 0, { requested: caseReport.requests.length });
        if (phase === 'ready-order') {
          check('production-loader-ready', observed.startup?.phase === 'ready' && observed.startup.loadedModules === 9 && observed.startup.closeOwned === false && observed.inert === false);
          check('exact-postmodule-order', JSON.stringify(observed.state.moduleOrder) === JSON.stringify(MODULES.map((_, index) => index)));
          check('classic-global-lexical-scope-and-single-boot', observed.state.mainRuns === 1 && observed.state.bootCalls === 1 && observed.state.bootValue === 50 && observed.state.globalLexicalIsWindowProperty === false);
          check('autosave-resumed-and-requested-after-modules', observed.state.events.slice(-3).join('|') === 'resume|request:startup-ready|boot');
        } else if (phase === 'cancel-adopt') {
          check('late-response-arrived-after-cancel-ack', responseReturned && events.find(e => e.type === 'held-response-returned').order > events.find(e => e.type === 'close-ack').order);
          check('cancelled-script-never-executed', observed.startup?.phase === 'cancelled' && observed.startup.loadedModules === 7 && observed.state.moduleOrder.length === 7 && !events.some(e => e.type === 'module-executed' && e.index >= 7));
          check('cancelled-startup-never-booted-or-resumed', observed.state.mainRuns === 1 && observed.state.bootCalls === 0 && observed.state.fenceCalls === 1 && observed.state.blocked === true && observed.inert === true && !observed.state.events.includes('resume'));
        } else {
          check('removed-prepared-control-really-executed', responseReturned && observed.state.controlExecuted === true && events.some(e => e.type === 'control-executed'));
        }
      } finally {
        release.resolve(); ipcMain.removeListener('startup-loader-probe-event', listener);
        if (!win.isDestroyed()) win.destroy(); ses.protocol.unhandle('file');
      }
    }
    report.sourceHashesAfter = sourceHashes();
    check('source-stable-through-probe', JSON.stringify(report.sourceHashes) === JSON.stringify(report.sourceHashesAfter));
    report.completed = true;
  } catch (error) { report.error = String(error.stack || error); }
  finally {
    clearTimeout(deadline); report.finishedAt = new Date().toISOString(); save();
    for (const win of BrowserWindow.getAllWindows()) if (!win.isDestroyed()) win.destroy();
    app.exit(report.completed && !report.error ? 0 : 1);
  }
}

function parent() {
  if (process.env.GIGACHAD_STARTUP_LOADER_PROBE_RUN !== '1') throw Error('Explicit coordinated probe opt-in required');
  const before = sourceHashes(), directory = fs.mkdtempSync(path.join(os.tmpdir(), PREFIX)), nonce = crypto.randomUUID();
  for (const name of ['profile', 'session-data', 'logs', 'crashes', 'fixtures']) fs.mkdirSync(path.join(directory, name));
  write(path.join(directory, 'ownership.json'), { nonce, root: ROOT });
  const contract = { directory, nonce, sourceHashes: before }; assertOwned(contract);
  contract.fixtures = prepareFixtures(directory, nonce, fs.readFileSync(path.join(ROOT, LOADER)));
  const env = { ...process.env, GIGACHAD_STARTUP_LOADER_PROBE_CHILD: JSON.stringify(contract) };
  for (const name of Object.keys(env)) if (name !== 'GIGACHAD_STARTUP_LOADER_PROBE_CHILD' &&
    (/^GIGACHAD_/.test(name) || /API_KEY|ACCESS_TOKEN|SECRET/.test(name) || ['ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS'].includes(name))) delete env[name];
  const executable = path.resolve(require('electron'));
  const run = spawnSync(executable, [__filename], { cwd: ROOT, env, windowsHide: true, timeout: 60000, encoding: 'utf8', maxBuffer: 1024 * 1024 });
  const childFile = path.join(directory, 'child-report.json');
  const childReport = fs.existsSync(childFile) ? JSON.parse(fs.readFileSync(childFile, 'utf8')) : null;
  const report = { directory, executable, sourceHashes: before, sourceHashesAfter: sourceHashes(),
    run: { pid: run.pid, exitCode: run.status, signal: run.signal, error: run.error?.message || null,
      stdout: run.stdout?.slice(-4000), stderr: run.stderr?.slice(-4000) }, childReport,
    completed: Boolean(run.status === 0 && childReport?.completed === true && !childReport.error && childReport.checks.every(item => item.passed === true)) };
  if (JSON.stringify(before) !== JSON.stringify(report.sourceHashesAfter)) { report.completed = false; report.error = 'Source changed during probe'; }
  const output = path.join(directory, 'report.json'); write(output, report);
  console.log(JSON.stringify({ report: output, completed: report.completed, checks: childReport?.checks.length || 0 }));
  if (!report.completed) process.exitCode = 1;
}
function selfTest() {
  const { POST_MODULES } = require('../systems/alive-startup-loader.js');
  assert.deepEqual([...POST_MODULES], [...MODULES]);
  const base = path.join(os.tmpdir(), PREFIX + 'self-test'), file = path.join(base, 'systems', 'known.js'), allow = new Map([[key(file), file]]);
  assert.equal(resolveRequest(pathToFileURL(file).href, base, allow), file);
  for (const url of ['https://example.test/script.js', pathToFileURL(file).href + '?query=1', pathToFileURL(file).href + '#fragment',
    pathToFileURL(path.join(base + '-other', 'systems', 'known.js')).href, pathToFileURL(path.join(base, 'systems', 'unknown.js')).href,
    pathToFileURL(path.join(base, '..', 'outside.js')).href]) assert.throws(() => resolveRequest(url, base, allow));
  assert.equal(within(base, base), false); assert.equal(within(base, path.join(base, 'profile')), true);
  let scripts = 0;
  for (const phase of PHASES) {
    const text = html('00000000-0000-0000-0000-000000000000', phase);
    for (const match of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) if (match[1]) { new vm.Script(match[1]); scripts++; }
    assert.equal((text.match(/id="gigachad-main-source"/g) || []).length, phase === 'remove-only-control' ? 0 : 1);
  }
  for (let i = 0; i < 9; i++) new vm.Script(moduleSource(i));
  new vm.Script(PRELOAD);
  assert.throws(() => moduleSource(-1)); assert.throws(() => html('nonce', 'unexpected'));
  console.log(JSON.stringify({ passed: true, scope: 'Pure path/allowlist/fixture syntax checks only; Electron has not been launched', fixtureInlineScriptsParsed: scripts, fixedModules: 9, sourceHashes: sourceHashes() }));
}
module.exports = { within, resolveRequest, assertOwned, html, moduleSource, selfTest };
const electronEntry = Boolean(process.versions.electron && process.argv[1] && key(process.argv[1]) === key(__filename));
if (electronEntry) child().catch(error => { console.error(error.stack || error); require('electron').app.exit(1); });
else if (require.main === module) {
  try { process.argv.includes('--self-test') ? selfTest() : parent(); }
  catch (error) { console.error(error.stack || error); process.exitCode = 1; }
}
