'use strict';

// Opt-in verification only. No application source files are written.
// Run only after the application source freeze:
//   node scripts/alive-live-onion-probe.cjs --live --tor=<absolute Tor executable>
// GIGACHAD_TOR_PATH is also supported, matching the application configuration.
// This uses the production Tor service with a fresh owned data directory.
// The application keeps its isolated SMOKE provider/LLM/network restrictions;
// the sole guest network exception is GET/HEAD to the official Tor Blog origin.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const TARGET = 'http://pzhdfe7jraknpj2qgu5cz2u3i4deuyfwmonvzu5i3nyw4t4bmg7o5pad.onion/';
const TARGET_SOURCE = 'https://onion.torproject.org/';
// Public registry metadata, checked 2026-11-09. Availability is measured only
// during an explicitly requested live run; no historical report is required.
const TARGET_LISTING_CHECKED = '2026-11-09';
const GLOBAL_NAME = '__aliveLiveOnionProbe';
const SOURCE_PATHS = [
  'main.js', 'preload.js', 'index.html', 'config.js', 'package.json',
  'systems/deep-web-transport.js', 'systems/sha3-256.cjs', 'systems/alive-tor-service.cjs',
  'systems/alive-overdrive-runtime.js', 'systems/alive-research-policy.js',
  'systems/cortex-neural-cyber-engine.js',
  'systems/alive-overdrive-adapters.js', 'systems/alive-workspace-ui.js',
  'systems/alive-authority.js', 'systems/alive-guest-execution.js',
  'assets/alive-workspace.css', 'scripts/alive-live-onion-probe.cjs'
];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function sourceHashes() {
  return Object.fromEntries(SOURCE_PATHS.map(file => [file, hash(fs.readFileSync(path.join(ROOT, file)))]));
}
function replaceOnce(source, needle, replacement, label) {
  if (source.split(needle).length !== 2) throw new Error('Live onion probe requires exactly one unchanged ' + label);
  return source.replace(needle, replacement);
}
function adaptMainSource(source) {
  const provider = "const fetch = (...args) => SMOKE\n  ? Promise.reject(new Error('Network providers are disabled in isolated smoke mode.'))";
  const normalized = source.replace(/\r\n/g, '\n');
  if (!normalized.includes(provider)) throw new Error('The SMOKE provider rejection changed');
  if (!normalized.includes("if (SMOKE) return { status: 'unavailable', reason: 'Providers disabled in isolated smoke mode' };")) {
    throw new Error('The SMOKE research-provider rejection changed');
  }
  const portSelection = 'const ports = configuredTorPorts(process.env, cfg.torSocksPort);';
  if (normalized.split(portSelection).length !== 2) {
    throw new Error('Live onion probe requires exactly one unchanged shared SOCKS port selection');
  }
  let adapted = replaceOnce(normalized,
    "const smokeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gigachad-smoke-'));",
    'const smokeDir = globalThis.' + GLOBAL_NAME + '.profile;', 'isolated profile allocation');
  adapted = replaceOnce(adapted, 'const probes = SMOKE ? [] : await Promise.all(ports.map(port => probeSocks5(port)));',
    'const probes = await Promise.all(ports.map(port => probeSocks5(port)));', 'SMOKE SOCKS negotiation block');
  adapted = replaceOnce(adapted, 'if (!ownedLocalAsset) return callback({ cancel: true });',
    'if (!ownedLocalAsset && !globalThis.' + GLOBAL_NAME + '.gate.allow(details)) return callback({ cancel: true });',
    'vault request admission');
  adapted = replaceOnce(adapted,
    'vaultSession.webRequest.onCompleted(details => deepWebNavigation.complete(details));',
    'vaultSession.webRequest.onCompleted(details => { deepWebNavigation.complete(details); globalThis.' + GLOBAL_NAME + '.gate.complete(details); });',
    'production completion callback');
  adapted = replaceOnce(adapted,
    "vaultSession.webRequest.onErrorOccurred(details => deepWebNavigation.complete(details, details.error || 'request_failed'));",
    "vaultSession.webRequest.onErrorOccurred(details => { deepWebNavigation.complete(details, details.error || 'request_failed'); globalThis." + GLOBAL_NAME + ".gate.complete(details, details.error || 'request_failed'); });",
    'production error callback');
  adapted = replaceOnce(adapted, '  if (SMOKE) {\n    const fail = (message) => {',
    '  if (false) {\n    const fail = (message) => {', 'built-in short smoke verifier');
  return { source: adapted, evidence: {
    exactOnceGuards: 7, providerFetchBlockUnchanged: adapted.includes(provider),
    researchProviderBlockUnchanged: true, configurationIsolated: true,
    portSelectionUnchanged: true,
    portSelection: 'Production configuredTorPorts(process.env, cfg.torSocksPort); owned GIGACHAD_TOR_SOCKS_PORT environment override',
    adaptations: ['fresh owned profile', 'real SOCKS negotiation in SMOKE',
      'bounded same-onion-origin GET/HEAD admission', 'observe actual completion after production tracker',
      'observe actual error after production tracker', 'disable built-in 20-second smoke verifier'],
    scope: 'In-memory verification adaptations only; production proxy, tracker, IPC, authority and UI logic retained'
  } };
}

function createOnionGate({ target = TARGET, now = Date.now, maxOutstandingRequests = 512 } = {}) {
  const origin = new URL(target).origin;
  let opened = false, deadline = 0, guestId = null, closed = false;
  const requests = new Map(), mainFrames = [], denied = [];
  const counts = { admitted: 0, denied: 0, completed: 0, errors: 0 };
  return {
    open(webContentsId, durationMs) {
      if (opened) throw new Error('Onion network window may open only once');
      if (!Number.isInteger(webContentsId) || webContentsId <= 0) throw new Error('An actual guest webContents ID is required');
      if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs > 90000) throw new Error('Onion network window must be bounded to 90 seconds');
      opened = true; guestId = webContentsId; deadline = now() + durationMs;
    },
    allow(details) {
      let url;
      try { url = new URL(details.url); } catch (_) {}
      const allowed = opened && !closed && now() < deadline && details.webContentsId === guestId &&
        ['GET', 'HEAD'].includes(details.method) && url?.origin === origin && !url.username && !url.password &&
        requests.size < maxOutstandingRequests;
      if (!allowed) {
        counts.denied++;
        if (denied.length < 40) denied.push({ url: String(details.url).slice(0, 220), webContentsId: details.webContentsId,
          method: details.method, resourceType: details.resourceType, at: now() });
        return false;
      }
      counts.admitted++;
      requests.set(details.id, { id: details.id, url: url.href, webContentsId: guestId,
        resourceType: details.resourceType, admittedAt: now() });
      return true;
    },
    complete(details, error = '') {
      const start = requests.get(details.id);
      if (!start) return;
      requests.delete(details.id); counts.completed++; if (error) counts.errors++;
      if (start.resourceType === 'mainFrame' && mainFrames.length < 16) mainFrames.push({ ...start,
        url: details.url, completedAt: now(), statusCode: details.statusCode || null,
        fromCache: details.fromCache, error: error || null });
    },
    close() { closed = true; },
    snapshot() { return { opened, closed, guestId, deadline, origin, maxOutstandingRequests,
      outstandingRequests: requests.size, counts: { ...counts },
      mainFrames: mainFrames.map(value => ({ ...value })), denied: denied.map(value => ({ ...value })),
      policy: 'Only this actual vault guest; GET/HEAD; exact official onion origin; bounded 90-second window' }; }
  };
}

function evaluateEvidence({ target = TARGET, guestId, network, document, receipt, badge, exclusiveRoute, port }) {
  const expectedRoute = 'SOCKS5 127.0.0.1:' + port;
  const response = network?.mainFrames?.find(item => item.webContentsId === guestId && item.url === target &&
    item.statusCode === 200 && item.fromCache === false && !item.error);
  const checks = {
    actualUncachedMainFrame200: Boolean(response),
    exclusiveOwnedSocksRoute: exclusiveRoute === expectedRoute,
    actualTorBlogDocument: document?.url === target && /Tor Blog/i.test(document.title || '') &&
      /Tor/i.test(document.bodyExcerpt || '') && document.bodyLength > 200 && document.readyState === 'complete',
    currentGuestTrackerReceipt: Boolean(response && receipt?.requestId === response.id && receipt.url === target &&
      receipt.status === 'loaded' && receipt.httpStatus === 200 && receipt.networkVerified === true &&
      receipt.fromCache === false && receipt.proxyRoute === expectedRoute),
    visibleVerifiedBadge: Boolean(badge?.visible && badge?.verified === true &&
      /Onion loaded\s*·\s*SOCKS5/.test(badge.text || '') && badge.activeUrl === target && badge.guestId === guestId)
  };
  return { checks, passed: Object.values(checks).every(Boolean) };
}

async function reservePort() {
  const net = require('node:net');
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port; // Tor must successfully bind; an occupied/raced port is never adopted.
}
async function until(fn, timeoutMs, label) {
  const end = Date.now() + timeoutMs;
  let latest;
  do { latest = await fn(); if (latest) return latest; await sleep(250); } while (Date.now() < end);
  throw new Error(label + ' timed out');
}
function writeJSON(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2)); }
function createStageJournal(output, options = {}) {
  const stages = [], maxEntries = 64;
  let dropped = 0;
  const write = options.write || (value => writeJSON(path.join(output, 'electron-stages.json'), value));
  const emit = options.emit || (value => console.log('ALIVE_ONION_STAGE ' + JSON.stringify(value)));
  const now = options.now || Date.now;
  const snapshot = () => ({ maxEntries, dropped, stages: stages.map(entry => ({ ...entry })) });
  return {
    record(stage, details = {}) {
      const entry = { at: now(), stage: String(stage).slice(0, 100), ...details };
      stages.push(entry);
      if (stages.length > maxEntries) { stages.shift(); dropped++; }
      // Logging failure must not prevent app startup or the real report path.
      try { write(snapshot()); } catch (error) { entry.journalWriteError = String(error.message).slice(0, 300); }
      emit(entry);
      return entry;
    },
    snapshot
  };
}
async function stopRendererWithin(win, timeoutMs = 1500) {
  if (!win || win.isDestroyed()) return { status: 'not-needed' };
  let timer;
  try {
    await Promise.race([
      Promise.resolve().then(() => win.webContents.executeJavaScript('stopAlienBrainAutonomy(); true')),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Renderer stop exceeded ' + timeoutMs + ' ms')), timeoutMs); })
    ]);
    return { status: 'completed', timeoutMs };
  } catch (error) { return { status: 'unconfirmed', timeoutMs, reason: String(error.message || error).slice(0, 300) }; }
  finally { clearTimeout(timer); }
}
function dispatchEntry({ isElectron, childOptIn, isMain, startChild, startLauncher }) {
  // Electron loads script entries through its own bootstrap module; its
  // require.main can legitimately differ from this script's module.
  if (isElectron && childOptIn) return startChild();
  if (!isMain) return null;
  if (isElectron) return Promise.reject(new Error('Electron entry requires the explicit owned launcher'));
  return startLauncher();
}
function buildChildEnvironment({ baseEnv = process.env, profile, output, port, executable }) {
  if (!Number.isInteger(port) || port <= 0 || port > 65535) throw new Error('Invalid owned SOCKS port');
  const env = { ...baseEnv, GIGACHAD_SMOKE: '1', GIGACHAD_TEST_MODE: '1',
    GIGACHAD_TOR_SOCKS_PORT: String(port),
    ALIVE_ONION_PROBE_CHILD: '1', ALIVE_ONION_PROBE_PROFILE: profile, ALIVE_ONION_PROBE_OUTPUT: output,
    ALIVE_ONION_PROBE_PORT: String(port), ALIVE_ONION_PROBE_EXECUTABLE: executable };
  delete env.ELECTRON_RUN_AS_NODE; delete env.NODE_OPTIONS;
  return env;
}
function verifyTransportPreflight(probe, route, port) {
  const expectedRoute = 'SOCKS5 127.0.0.1:' + port;
  if (route !== expectedRoute) throw new Error('Owned SOCKS route preflight failed: expected ' + expectedRoute + ', observed ' + route);
  if (probe?.ok !== true || probe.socksHandshakeVerified !== true || probe.socksPort !== port || probe.torPacApplied !== true) {
    throw new Error('Production deep-dark-web-probe did not confirm the owned SOCKS port and applied route');
  }
  return true;
}

function resolveTorExecutable({ argv = process.argv, env = process.env } = {}) {
  const supplied = argv.filter(arg => arg.startsWith('--tor='));
  if (supplied.length > 1) throw new Error('Supply --tor only once');
  const value = supplied.length ? supplied[0].slice(6) : env.GIGACHAD_TOR_PATH;
  const executable = typeof value === 'string' ? value.trim() : '';
  if (!executable || !path.isAbsolute(executable) || /[\r\n\u0000]/.test(executable)) {
    throw new Error('Set --tor=<absolute Tor executable> or GIGACHAD_TOR_PATH to an absolute executable path');
  }
  return executable;
}

async function launcher() {
  if (!process.argv.includes('--live')) throw new Error('Explicit --live is required; this opt-in script contacts Tor Blog over Tor.');
  const { createTorService } = require('../systems/alive-tor-service.cjs');
  const { validateOnionAddress, probeSocks5 } = require('../systems/deep-web-transport');
  const { spawn } = require('node:child_process');
  const os = require('node:os');
  if (!validateOnionAddress(TARGET).valid) throw new Error('Pinned Tor Blog target failed its v3 checksum');
  const torPath = resolveTorExecutable();
  const torExecutableSha256 = hash(fs.readFileSync(torPath));
  const adaptation = adaptMainSource(fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8')).evidence;
  const ownedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gigachad-live-onion-'));
  const profile = path.join(ownedRoot, 'profile'), torData = path.join(ownedRoot, 'tor');
  fs.mkdirSync(profile); fs.mkdirSync(torData);
  const outputArg = process.argv.find(arg => arg.startsWith('--output='));
  const output = outputArg ? path.resolve(outputArg.slice(9)) :
    path.join(ROOT, 'research_notes', 'alive-live-onion-' + new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(output, { recursive: true });
  const electronArg = process.argv.find(arg => arg.startsWith('--electron='));
  const executable = electronArg ? path.resolve(electronArg.slice(11)) : require('electron');
  const report = { probe: 'actual-electron-official-onion-document', startedAt: new Date().toISOString(), target: TARGET,
    officialSource: TARGET_SOURCE, targetListingChecked: TARGET_LISTING_CHECKED,
    profile, torData, output, sourceStart: sourceHashes(), adaptation, bootstrapTimeoutMs: 180000,
    diagnosticRetention: { retained: true, ownedRoot, profile, torData,
      reason: 'Fresh temporary browser profile and owned Tor data directory are retained for diagnosis; no user profile is reused or deleted.' },
    torExecutable: torPath, torExecutableSha256, electronExecutable: executable,
    scope: 'Live Tor Blog document and displayed app transport evidence only; no anonymity, relay identity, or general reachability claim',
    events: [], appManagedTorNote: 'Tor is owned by this launcher using the production service; the app internal managedTor instance remains idle.' };
  const reportFile = path.join(output, 'report.json');
  let child = null, cancelled = false, lastProgress = -1;
  const service = createTorService({ onStatus(state) {
    if (state.bootstrapProgress !== lastProgress) {
      lastProgress = state.bootstrapProgress;
      const event = { status: state.status, progress: state.bootstrapProgress, pid: state.pid, at: Date.now() };
      report.events.push(event); console.log('ALIVE_ONION_TOR ' + JSON.stringify(event));
    }
  } });
  const cancel = () => { cancelled = true; if (child && child.exitCode === null) child.kill('SIGTERM'); service.stop(); };
  process.once('SIGINT', cancel); process.once('SIGTERM', cancel);
  const heartbeat = setInterval(() => console.log('ALIVE_ONION_HEARTBEAT ' + JSON.stringify({
    at: Date.now(), tor: service.snapshot().status, progress: service.snapshot().bootstrapProgress, electronPid: child?.pid || null
  })), 15000);
  try {
    report.port = await reservePort();
    service.start({ torPath, dataDirectory: torData, socksPort: report.port, enabled: true, startupTimeoutMs: 180000 });
    report.bootstrap = await until(() => {
      const state = service.snapshot();
      if (cancelled || ['error', 'timeout', 'unavailable', 'stopped'].includes(state.status)) throw new Error(state.lastError || 'Tor did not bootstrap');
      return state.status === 'ready' && state.bootstrapped ? state : null;
    }, 180000, 'Owned Tor bootstrap');
    report.socks = await probeSocks5(report.port);
    if (!report.socks.verified) throw new Error('Owned Tor did not negotiate SOCKS5');
    // Both the main refresh path and the production cortex route writer must
    // discover this same owned port; neither may fall back to user Tor ports.
    const env = buildChildEnvironment({ profile, output, port: report.port, executable });
    let stdout = '', stderr = '', timedOut = false;
    report.electron = await new Promise((resolve, reject) => {
      child = spawn(executable, [__filename, '--electron-child'], { cwd: ROOT, env, windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
      report.electronPid = child.pid; writeJSON(reportFile, report);
      child.stdout.on('data', bytes => { const text = bytes.toString(); stdout = (stdout + text).slice(-64000); process.stdout.write(text); });
      child.stderr.on('data', bytes => { stderr = (stderr + bytes.toString()).slice(-32000); });
      const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 150000);
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('close', (code, signal) => { clearTimeout(timer); resolve({ code, signal, timedOut, stdout, stderr }); });
    });
    const childFile = path.join(output, 'electron-report.json');
    if (fs.existsSync(childFile)) report.browser = JSON.parse(fs.readFileSync(childFile, 'utf8'));
    report.passed = report.electron.code === 0 && report.browser?.verdict?.passed === true && !cancelled;
  } catch (error) { report.error = String(error.stack || error); report.passed = false; }
  finally {
    service.stop();
    try { report.shutdown = await until(() => {
      const state = service.snapshot(); return !state.running && !state.owned ? state : null;
    }, 7500, 'Owned Tor shutdown'); } catch (error) { report.shutdown = service.snapshot(); report.shutdownError = error.message; }
    clearInterval(heartbeat); process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel);
    report.sourceEnd = sourceHashes();
    report.sourceUnchanged = Object.keys(report.sourceStart).every(file => report.sourceStart[file] === report.sourceEnd[file]);
    report.passed = Boolean(report.passed && report.sourceUnchanged && !report.shutdown.running && !report.shutdown.owned);
    report.endedAt = new Date().toISOString(); writeJSON(reportFile, report);
    console.log('ALIVE_ONION_RESULT ' + JSON.stringify({ passed: report.passed, report: reportFile, shutdown: report.shutdown.status, sourceUnchanged: report.sourceUnchanged }));
    process.exitCode = report.passed ? 0 : 1;
  }
}

async function rendererPrepare() {
  stopAlienBrainAutonomy();
  window.alienAutoNavigateLinks = false;
  const auto = document.getElementById('habitat-autonav-chk'); if (auto) auto.checked = false;
  window.aliveWorkspace.closePanels();
  const tab = getActiveTab();
  if (!tab || !tab.domReady) return null;
  return { tabId: tab.id, guestId: tab.wv.getWebContentsId() };
}
async function rendererReadDocument() {
  const tab = getActiveTab();
  if (!tab?.domReady || tab.isLoading) return null;
  return tab.wv.executeJavaScript('({url:location.href,title:document.title,readyState:document.readyState,bodyLength:(document.body?.innerText||"").length,bodyExcerpt:(document.body?.innerText||"").slice(0,1800)})');
}
function rendererReadEvidence() {
  const tab = getActiveTab(), badge = document.getElementById('alive-transport-status');
  const rect = badge?.getBoundingClientRect(), style = badge && getComputedStyle(badge);
  const evidence = window.getAliveRuntimeEvidence();
  return { badge: { text: badge?.textContent || '', verified: badge?.dataset.verified === 'true',
    visible: Boolean(rect && rect.width > 0 && rect.height > 0 && rect.x >= 0 && rect.y >= 0 &&
      rect.right <= innerWidth && rect.bottom <= innerHeight && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0),
    rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
    textClipped: Boolean(badge && badge.scrollWidth > badge.clientWidth), title: badge?.title || '',
    activeUrl: evidence.activeUrl, guestId: tab?.wv?.getWebContentsId() },
    probe: evidence.lastBackendProbe, authority: window.aliveAuthority.snapshot(),
    job: window.aliveOverdrive.snapshot(false).jobs.find(job => job.id === 'deep-dark-dive') };
}

async function electronChild() {
  const output = process.env.ALIVE_ONION_PROBE_OUTPUT, profile = process.env.ALIVE_ONION_PROBE_PROFILE;
  const journal = createStageJournal(output);
  journal.record('child-entered', { pid: process.pid, electron: process.versions.electron, requireMainMatches: require.main === module });
  if (process.env.ALIVE_ONION_PROBE_CHILD !== '1') throw new Error('Electron child requires the explicit owned launcher');
  const { app, BrowserWindow, session, webContents } = require('electron');
  journal.record('electron-module-loaded');
  const Module = require('node:module');
  const port = Number(process.env.ALIVE_ONION_PROBE_PORT);
  if (!path.isAbsolute(profile || '') || !path.isAbsolute(output || '') || !Number.isInteger(port) || port <= 0 || port > 65535) throw new Error('Invalid isolated launcher parameters');
  journal.record('launcher-parameters-validated', { port });
  const gate = createOnionGate();
  globalThis[GLOBAL_NAME] = { profile, socksPort: port, gate };
  const report = { startedAt: new Date().toISOString(), sourceStart: sourceHashes(),
    runtime: { versions: { ...process.versions }, execPath: process.execPath, requestedExecutable: process.env.ALIVE_ONION_PROBE_EXECUTABLE,
      executableMatchesLauncher: path.resolve(process.execPath).toLowerCase() === path.resolve(process.env.ALIVE_ONION_PROBE_EXECUTABLE || '').toLowerCase(),
      platform: process.platform, arch: process.arch },
    limitations: ['Software rendering retained from isolated SMOKE; this is not an FPS benchmark.',
      'Only the official onion origin is admitted; unrelated third-party page assets remain blocked.',
      'Provider fetch, language-model planner, sidecar and persistent user configuration remain disabled.'],
    errors: [] };
  journal.record('source-hashes-recorded');
  let win, finishing = false;
  const timeout = setTimeout(() => finish(new Error('Electron live onion phase exceeded 140 seconds')), 140000);
  async function finish(error) {
    if (finishing) return; finishing = true; clearTimeout(timeout); gate.close();
    if (error) report.error = String(error.stack || error);
    journal.record('finishing', { error: report.error?.slice(0, 500) || null });
    report.stop = await stopRendererWithin(win);
    journal.record('renderer-stop-finished', report.stop);
    report.network = gate.snapshot(); report.sourceEnd = sourceHashes();
    report.sourceUnchanged = Object.keys(report.sourceStart).every(file => report.sourceStart[file] === report.sourceEnd[file]);
    if (error || !report.sourceUnchanged || report.stop.status === 'unconfirmed') report.verdict = { ...(report.verdict || {}), passed: false };
    report.stages = journal.snapshot();
    report.endedAt = new Date().toISOString(); writeJSON(path.join(output, 'electron-report.json'), report);
    journal.record('report-written', { passed: report.verdict?.passed === true });
    console.log('ALIVE_ONION_ELECTRON ' + JSON.stringify({ passed: report.verdict?.passed === true, error: report.error || null }));
    app.exit(report.verdict?.passed ? 0 : 1);
  }
  try {
    const appPath = path.join(ROOT, 'main.js'), adapted = adaptMainSource(fs.readFileSync(appPath, 'utf8'));
    report.adaptation = adapted.evidence;
    const application = new Module(appPath, module);
    application.filename = appPath; application.paths = Module._nodeModulePaths(ROOT);
    journal.record('application-compile-started');
    application._compile(adapted.source, appPath);
    journal.record('application-compiled');
    await app.whenReady();
    journal.record('electron-ready');
    win = await until(() => BrowserWindow.getAllWindows()[0], 15000, 'Application window');
    journal.record('application-window-created', { id: win.id });
    win.webContents.on('console-message', event => { if (event.level === 'error' && report.errors.length < 40) report.errors.push(String(event.message).slice(0, 1000)); });
    win.setFocusable(false); win.setIgnoreMouseEvents(true); win.showInactive();
    win.setTitle('GIGACHAD - isolated live onion verification (closes automatically)');
    win.webContents.setBackgroundThrottling(false);
    report.window = { id: win.id, visible: win.isVisible(), focusable: win.isFocusable(), inputIgnored: true };
    const evaluate = (fn, arg) => win.webContents.executeJavaScript('(' + fn.toString() + ')(' + (arg === undefined ? '' : JSON.stringify(arg)) + ')', true);
    await until(async () => {
      try { return await win.webContents.executeJavaScript('Boolean(window.aliveWorkspace && window.aliveOverdrive && window.aliveAuthority && typeof getActiveTab === "function" && getActiveTab()?.domReady)'); } catch (_) { return false; }
    }, 35000, 'Real renderer and default guest readiness');
    journal.record('renderer-and-guest-ready');
    const identity = await evaluate(rendererPrepare);
    if (!identity) throw new Error('No actual ready guest');
    report.identity = identity; report.profile = app.getPath('userData');
    report.vaultPartition = 'persist:gigachad_vault';
    report.transportPreflight = await evaluate(async target => {
      const tab = getActiveTab();
      return ipcRenderer.invoke('deep-dark-web-probe', { wcId: tab.wv.getWebContentsId(), onion: target });
    }, TARGET);
    report.exclusiveRoute = await session.fromPartition(report.vaultPartition).resolveProxy(TARGET);
    journal.record('owned-route-observed', { route: report.exclusiveRoute, guestId: identity.guestId,
      productionProbeOk: report.transportPreflight.ok, productionSocksPort: report.transportPreflight.socksPort });
    verifyTransportPreflight(report.transportPreflight, report.exclusiveRoute, port);
    gate.open(identity.guestId, 90000);
    await evaluate(target => { document.getElementById('urlbar').value = target; navigate(); return true; }, TARGET);
    journal.record('onion-navigation-dispatched');
    report.document = await until(async () => {
      try {
        const document = await evaluate(rendererReadDocument);
        return document?.url === TARGET && document.readyState === 'complete' && document.bodyLength > 200 ? document : null;
      } catch (_) { return null; }
    }, 65000, 'Actual Tor Blog document');
    journal.record('onion-document-observed', { title: report.document.title, bodyLength: report.document.bodyLength });
    // Real start/guest handshake produces the lease required by deepDarkProbe;
    // no token or tracker receipt is synthesized by this harness.
    await evaluate(() => { startAliveOverdrive(); return true; });
    await until(async () => evaluate(() => {
      const tab = getActiveTab(); return Boolean(window.aliveAuthority.leaseFor(tab?.id));
    }), 10000, 'Real selected-document authority acknowledgement');
    journal.record('real-guest-authority-acknowledged');
    await evaluate(() => window.aliveOverdrive.request('deep-dark-dive'));
    report.display = await until(async () => {
      const state = await evaluate(rendererReadEvidence);
      return state.probe?.navigation?.url === TARGET && state.probe.navigation.status === 'loaded' ? state : null;
    }, 15000, 'Production adapter current-document receipt');
    journal.record('production-receipt-observed');
    // Let the ordinary 500-ms UI refresh consume its own backend evidence.
    await sleep(750);
    report.display = await evaluate(rendererReadEvidence);
    report.receipt = report.display.probe?.navigation || null;
    report.directIpc = await evaluate(async () => {
      const tab = getActiveTab();
      return ipcRenderer.invoke('deep-dark-web-probe', { wcId: tab.wv.getWebContentsId(), onion: safeGetUrl(tab) });
    });
    report.network = gate.snapshot();
    report.verdict = evaluateEvidence({ guestId: identity.guestId, port, exclusiveRoute: report.exclusiveRoute,
      network: report.network, document: report.document, receipt: report.receipt, badge: report.display.badge });
    const guest = webContents.fromId(identity.guestId);
    report.guest = { id: guest?.id, url: guest?.getURL(), type: guest?.getType(), partitionMatches: guest?.session === session.fromPartition(report.vaultPartition) };
    if (!report.runtime.executableMatchesLauncher || !report.window.visible || !report.guest.partitionMatches || report.profile !== profile || !report.directIpc?.navigation ||
      report.directIpc.navigation.requestId !== report.receipt?.requestId) report.verdict.passed = false;
    const screenshot = path.join(output, 'actual-app-onion-badge.png');
    fs.writeFileSync(screenshot, (await win.capturePage()).toPNG()); report.screenshot = screenshot;
    if (guest && !guest.isDestroyed()) {
      const guestScreenshot = path.join(output, 'actual-onion-document.png');
      fs.writeFileSync(guestScreenshot, (await guest.capturePage()).toPNG()); report.guestScreenshot = guestScreenshot;
    }
    journal.record('screenshots-written');
    await finish();
  } catch (error) { await finish(error); }
}

module.exports = { TARGET, TARGET_SOURCE, TARGET_LISTING_CHECKED, SOURCE_PATHS, adaptMainSource, createOnionGate, evaluateEvidence, createStageJournal, stopRendererWithin, dispatchEntry, buildChildEnvironment, verifyTransportPreflight, resolveTorExecutable };
const entryTask = dispatchEntry({
  isElectron: Boolean(process.versions.electron), childOptIn: process.env.ALIVE_ONION_PROBE_CHILD === '1',
  isMain: require.main === module, startChild: electronChild, startLauncher: launcher
});
if (entryTask) {
  Promise.resolve(entryTask).catch(error => {
    console.error(error.stack || error);
    if (process.versions.electron && process.env.ALIVE_ONION_PROBE_CHILD === '1') {
      try { writeJSON(path.join(process.env.ALIVE_ONION_PROBE_OUTPUT, 'electron-startup-error.json'), { at: Date.now(), error: String(error.stack || error) }); } catch (_) {}
      try { require('electron').app.exit(1); } catch (_) { process.exitCode = 1; }
    } else process.exitCode = 1;
  });
}
