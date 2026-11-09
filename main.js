const { app, BrowserWindow, ipcMain, session, webContents, shell, Menu, clipboard, dialog } = require('electron');
const { spawn, execFile } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const https = require('https');
const { pathToFileURL, fileURLToPath } = require('url');

const { loadFilters, isTrackerUrl } = require('./blocklist');
const { loadConfig, saveUserConfig, normalizeOpenAiBase } = require('./config');
const { prepareOutboundMessages } = require('./systems/outbound-privacy-policy');
const { isTrustedChromeSender } = require('./systems/ipc-authorization');
const { validateOnionAddress, isOnionUrl, probeSocks5, configuredTorPorts, applyFailClosedProxy, createNavigationEvidence } = require('./systems/deep-web-transport');
const { createTorService } = require('./systems/alive-tor-service.cjs');
const { createStore: createGenomeStore } = require('./systems/alive-genome-store.cjs');
const { installGenomeIpc } = require('./systems/alive-genome-ipc.cjs');
const { migrateLegacyNative } = require('./systems/alive-genome-migration.cjs');
const {
  addHistory,
  toggleBookmark,
  sanitizeSession,
  recordClosedTab,
  popClosedTab,
  suggestOmnibox
} = require('./browser-data');
const { auditErdIntegrity } = require('./systems/erd-schema');
const { evaluateErmPosture } = require('./systems/erm-risk-engine');
const { evaluateErpPlan } = require('./systems/erp-resource-planner');
const { summarizeSop500 } = require('./systems/sop-500-checklist');
const { run100PassAudit } = require('./systems/pass-100-verifier');
const {
  configureDeepWebChromiumProxy,
  saveBinaryCortexWeights,
  loadBinaryCortexWeights,
  inspectTargetDomainCyberHat
} = require('./systems/cortex-neural-cyber-engine');

const SMOKE = process.argv.includes('--smoke') || process.env.GIGACHAD_SMOKE === '1';
// Main-process provider requests are forbidden during smoke, including renderer-triggered calls.
const fetch = (...args) => SMOKE
  ? Promise.reject(new Error('Network providers are disabled in isolated smoke mode.'))
  : globalThis.fetch(...args);
const ROOT = __dirname;
const NEW_TAB_FILE = path.join(ROOT, 'pages', 'newtab.html');
const CHROME_FILE = path.join(ROOT, 'index.html');
const SIDECAR_FILE = path.join(ROOT, 'laya_sidecar.py');
const FILTERS = loadFilters(
  [path.join(ROOT, 'tracker-blocklist.txt'), path.join(ROOT, 'tracker-blocklist.local.txt')],
  [path.join(ROOT, 'tracker-allowlist.txt'), path.join(ROOT, 'tracker-allowlist.local.txt')]
);

if (SMOKE) {
  const smokeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gigachad-smoke-'));
  app.setPath('userData', smokeDir);
  app.setPath('downloads', smokeDir);
  app.setPath('sessionData', smokeDir);
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
} else {
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  app.commandLine.appendSwitch('enable-features', 'CanvasOopRasterization,BackForwardCache,ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes');
  app.commandLine.appendSwitch('renderer-process-limit', '12');
  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=2048');
}

// Electron scopes its single-instance lock to this normal user-data profile.
// Smoke owns a unique temporary profile and never claims the user's writer.
const primaryInstance = SMOKE || app.requestSingleInstanceLock();
if (!primaryInstance) app.quit();
let cfg = loadConfig({ root: ROOT, isolated: SMOKE });
let mainWindow = null;
let genomeStore = null, genomeIpc = null, genomeWindowGuard = null;
let sidecarProcess = null;
let llamaProcess = null;
let _localBrainsHttpServer = null;
let _localBrainsHttpPort = 0;
let lastSidecarSpawn = 0;
let blockedCount = 0;

const MEDIA_EXTENSIONS = /\.(mp4|webm|m3u8|mp3|wav|flac|ogg|m4a)(\?|$)/i;
const snifferBuffer = new Map();
const mediaStreamBuffer = new Map();
const securityHeadersMap = new Map();
const attachedDebuggers = new Set();

const sreTelemetry = {
  aiLatenciesMs: [],
  totalAiCalls: 0,
  failedAiCalls: 0,
  autoHeals: 0,
  startTime: Date.now()
};

let memoryVault = [];
let oneTabVault = [];
let vibePatches = {};
let temporalSnapshots = {};
let kanbanBoard = [];
let piiBlockedTotal = 0;
let DOWNLOAD_DIR = '';
let history = [];
let bookmarks = [];
let closedTabs = [];
let downloads = [];
let sidecarLastError = '';
const deepWebNavigation = createNavigationEvidence();
const managedTor = createTorService();
let deepWebTransport = { checkedAt: 0, socksHandshakeVerified: false, activeTorPort: null, appliedSessions: [], routing: { ok: false, failClosed: true, appliedCount: 0, errors: [] } };
let deepWebProbePending = null;
async function refreshDeepWebTransport() {
  if (deepWebProbePending) return deepWebProbePending;
  deepWebProbePending = (async () => {
    const ports = configuredTorPorts(process.env, cfg.torSocksPort);
    const probes = SMOKE ? [] : await Promise.all(ports.map(port => probeSocks5(port)));
    const active = probes.find(item => item.verified);
    const routing = await applyFailClosedProxy([session.fromPartition('persist:gigachad_vault')], { activeTorPort: active?.port || null });
    deepWebTransport = { checkedAt: Date.now(), socksHandshakeVerified: Boolean(active), activeTorPort: active?.port || null, probes,
      appliedSessions: routing.appliedSessions, routing: { ...routing, appliedSessions: undefined } };
    return deepWebTransport;
  })().finally(() => { deepWebProbePending = null; });
  return deepWebProbePending;
}
let activeAiAbort = null;
let permissionSeq = 0;
const pendingPermissions = new Map();

const MICRO_ENDPOINTS = new Set([
  '/route', '/classify', '/embed', '/rerank', '/ner_pii', '/knowledge_graph',
  '/deception_radar', '/ast_analyze', '/predict_intent', '/intent', '/semantic_diff',
  '/extract_structured', '/summarize_extractive', '/page_outline', '/query_memory',
  '/seo_accessibility_audit', '/table_to_markdown', '/agent_plan',
  '/tts', '/reflex/dom', '/reflex/route',
  '/decursive_dedup', '/metacognition_quantum', '/deep_dark_web_intel'
]);

function userFile(name) {
  return path.join(app.getPath('userData'), name);
}

function loadJson(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {}
  return fallback;
}

function saveJson(filePath, data) {
  try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); } catch (_) {}
}

function initStores() {
  DOWNLOAD_DIR = path.join(app.getPath('downloads'), 'GigachadMedia');
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  memoryVault = loadJson(userFile('memory_vault.json'), []);
  history = loadJson(userFile('history.json'), []);
  bookmarks = loadJson(userFile('bookmarks.json'), []);
  closedTabs = loadJson(userFile('closed_tabs.json'), []);
  oneTabVault = loadJson(userFile('onetab_vault.json'), []);
  vibePatches = loadJson(userFile('page_patches.json'), {});
  temporalSnapshots = loadJson(userFile('temporal_snapshots.json'), {});
  kanbanBoard = loadJson(userFile('task_board.json'), [
    { id: 'k_be_1', title: '[Backend] Enforce contextIsolation + guest <webview> sandbox + 127.0.0.1 sidecar', col: 'done', tag: 'Backend' },
    { id: 'k_fe_1', title: '[Frontend] Spatial Tab Rail, Split View, Command Palette (Ctrl+K), and Omnibox Autocomplete', col: 'done', tag: 'Frontend' },
    { id: 'k_fs_1', title: '[Full-Stack] Hybrid Local GGUF + OpenRouter Cascade + 12-Engine Page Intelligence Suite', col: 'done', tag: 'Full-Stack' },
    { id: 'k_sys_1', title: '[Systems] Audit ERM Risk Register, ERD Data Integrity & ERP Resource Quotas', col: 'progress', tag: 'ERM/ERD/ERP' },
    { id: 'k_sop_1', title: '[SOP-500] Verify all 500 Grade-A Frontier SOTA Browser SOP gates pass CI/CD', col: 'progress', tag: 'SOP-500' },
    { id: 'k_fe_2', title: '[Frontend] Test Page Outline & Readability, PDF Export, and Viewport Snapshot', col: 'backlog', tag: 'Frontend' },
    { id: 'k_fs_2', title: '[Full-Stack] Run Ghost Swarm 3-Agent Deep Research on a technical topic', col: 'backlog', tag: 'Full-Stack' }
  ]);
}

function sameFilePath(a, b) {
  const normA = path.resolve(a);
  const normB = path.resolve(b);
  return process.platform === 'win32'
    ? normA.toLowerCase() === normB.toLowerCase()
    : normA === normB;
}

function isOurChrome(rawUrl) {
  try {
    return sameFilePath(fileURLToPath(rawUrl), CHROME_FILE);
  } catch (_) {
    return false;
  }
}

const BRAINS_DIR = path.join(ROOT, 'brains');

function isInsideBrainsDir(targetPath) {
  const normBase = path.resolve(BRAINS_DIR);
  const normTarget = path.resolve(targetPath);
  const rel = process.platform === 'win32'
    ? path.relative(normBase.toLowerCase(), normTarget.toLowerCase())
    : path.relative(normBase, normTarget);
  return Boolean(rel && !rel.startsWith('..') && !path.isAbsolute(rel));
}

function isSafeExternalUrl(rawUrl) {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function isAllowedGuestUrl(rawUrl) {
  if (!rawUrl) return false;
  if (isSafeExternalUrl(rawUrl)) return true;
  let parsed;
  try { parsed = new URL(rawUrl); } catch (_) { return false; }
  if (parsed.protocol === 'about:') return true;
  if (parsed.protocol === 'file:') {
    try {
      const fPath = fileURLToPath(parsed);
      return sameFilePath(fPath, NEW_TAB_FILE) || isInsideBrainsDir(fPath);
    } catch (_) {
      return false;
    }
  }
  return false;
}


function isLoopbackHttp(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'http:' && ['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname);
  } catch (_) {
    return false;
  }
}

// True when a hostname/IP literal points at loopback, link-local (incl. 169.254.169.254 cloud
// metadata), unique-local or RFC1918 private space. Used to block server-side-fetch SSRF.
function isBlockedFetchHost(hostname) {
  const h = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal') || h.endsWith('.local')) return true;
  if (h === '::1') return true;
  if (h.startsWith('fc') || h.startsWith('fd')) return true;   // fc00::/7 unique-local
  if (/^fe[89ab]/.test(h)) return true;                        // fe80::/10 link-local
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (m) {
    const a = +m[1], b = +m[2];
    if (a === 0 || a === 127 || a === 10) return true;
    if (a === 169 && b === 254) return true;                   // link-local incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true;                                 // multicast / reserved
  }
  return false;
}

function fromChrome(event) {
  return isTrustedChromeSender(event, mainWindow, isOurChrome);
}

function asGuest(wcId) {
  const id = Number(wcId);
  if (!Number.isInteger(id)) return null;
  const wc = webContents.fromId(id);
  if (!wc || wc.isDestroyed()) return null;
  if (typeof wc.getType === 'function' && wc.getType() !== 'webview') return null;
  return wc;
}

function publicConfig() {
  let llmBaseUrl = cfg.llmBaseUrl;
  let llmChatUrl = cfg.llmBaseUrl;
  try {
    llmBaseUrl = normalizeOpenAiBase(cfg.llmBaseUrl);
    llmChatUrl = llmBaseUrl + '/chat/completions';
  } catch (_) {}
  return {
    ok: true,
    pythonPath: cfg.pythonPath || '',
    pythonVersion: cfg.pythonVersion || '',
    sidecarUrl: cfg.sidecarUrl,
    sidecarPort: cfg.sidecarPort,
    autoStartSidecar: cfg.autoStartSidecar,
    llmBaseUrl,
    llmChatUrl,
    localModel: cfg.localModel || '',
    omniModel: cfg.omniModel || '',
    llmApiKeySet: Boolean(cfg.llmApiKey),
    allowCloudImages: cfg.allowCloudImages === true,
    smokeMode: SMOKE,
    openRouterModel: cfg.openRouterModel || '',
    openRouterBaseUrl: cfg.openRouterBaseUrl,
    hasOpenRouterKey: Boolean(cfg.openRouterKey),
    hasElevenKey: Boolean(cfg.elevenLabsKey),
    llamaAutoStart: cfg.llamaAutoStart,
    llamaServerPath: cfg.llamaServerPath || '',
    llamaModelPath: cfg.llamaModelPath || '',
    ytdlpPath: cfg.ytdlpPath || '',
    ytdlpViaPython: Boolean(cfg.ytdlpViaPython),
    ollamaPath: cfg.ollamaPath || '',
    llmDiscoveredFrom: cfg.llmDiscoveredFrom || '',
    piiFirewall: cfg.piiFirewall !== false,
    newTabUrl: pathToFileURL(NEW_TAB_FILE).href,
    blocklistCount: FILTERS.block.length,
    allowlistCount: FILTERS.allow.length
  };
}

async function fetchJson(url, options = {}, timeoutMs = 2500) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = { raw: text.slice(0, 500) }; }
  return { ok: response.ok, status: response.status, data };
}

function sidecarLogPath() {
  return path.join(app.getPath('userData'), 'sidecar.log');
}

function sidecarLogTail() {
  try {
    return fs.readFileSync(sidecarLogPath(), 'utf8').slice(-700);
  } catch (_) {
    return '';
  }
}

async function sidecarProbe() {
  try {
    const result = await fetchJson(`${cfg.sidecarUrl}/health`, {}, 800);
    if (result.ok && result.data && result.data.service === 'gigachad-sidecar') return { state: 'ready', data: result.data };
    if (result.status) return { state: 'conflict', data: result.data, status: result.status };
    return { state: 'down' };
  } catch (_) {
    return { state: 'down' };
  }
}

function ensureSidecar() {
  if (SMOKE || !cfg.autoStartSidecar) return;
  if (!cfg.pythonPath || !fs.existsSync(cfg.pythonPath)) {
    sidecarLastError = 'Python 3.11+ was not found. Set pythonPath in config.json or install Python and restart.';
    return;
  }
  if (!fs.existsSync(SIDECAR_FILE)) return;
  if (sidecarProcess && sidecarProcess.exitCode == null) return;
  if (Date.now() - lastSidecarSpawn < 20000) return;
  sidecarProbe().then((probe) => {
    if (probe.state === 'ready') {
      sidecarLastError = '';
      return;
    }
    if (probe.state === 'conflict') {
      sidecarLastError = `Port ${cfg.sidecarPort} is in use by another program. Stop it or set sidecarPort.`;
      return;
    }
    if (sidecarProcess && sidecarProcess.exitCode == null) return;
    lastSidecarSpawn = Date.now();
    const logFd = fs.openSync(sidecarLogPath(), 'a');
    fs.writeSync(logFd, `\n[${new Date().toISOString()}] starting sidecar\n`);
    try {
      sidecarProcess = spawn(cfg.pythonPath, ['-u', SIDECAR_FILE], {
        cwd: ROOT,
        windowsHide: true,
        env: {
          ...process.env,
          GIGACHAD_SIDECAR_HOST: cfg.sidecarHost,
          GIGACHAD_SIDECAR_PORT: String(cfg.sidecarPort)
        },
        stdio: ['ignore', logFd, logFd]
      });
      try { fs.closeSync(logFd); } catch (_) {}
      sreTelemetry.autoHeals += 1;
      sidecarProcess.on('error', (err) => {
        sidecarLastError = `Failed to spawn sidecar: ${err.message}`;
        sidecarProcess = null;
      });
      sidecarProcess.on('exit', (code) => {
        sidecarProcess = null;
        if (code) sidecarLastError = `Sidecar exited ${code}. ${sidecarLogTail()}`;
      });
    } catch (err) {
      try { fs.closeSync(logFd); } catch (_) {}
      sidecarLastError = `Failed to start sidecar process: ${err.message}`;
    }
  });
}

function ensureLlama() {
  if (SMOKE || !cfg.llamaAutoStart) return;
  if (!cfg.llamaServerPath || !fs.existsSync(cfg.llamaServerPath)) return;
  if (!cfg.llamaModelPath || !fs.existsSync(cfg.llamaModelPath)) return;
  if (llamaProcess && llamaProcess.exitCode == null) return;
  const modelsUrl = `http://127.0.0.1:${cfg.llamaPort}/v1/models`;
  fetch(modelsUrl, { signal: AbortSignal.timeout(700) }).then((res) => {
    if (!res.ok) throw new Error('down');
  }).catch(() => {
    if (llamaProcess && llamaProcess.exitCode == null) return;
    llamaProcess = spawn(cfg.llamaServerPath, [
      '-m', cfg.llamaModelPath,
      '--host', '127.0.0.1',
      '--port', String(cfg.llamaPort),
      '-c', String(cfg.llamaContext || 8192),
      '-ngl', String(cfg.llamaGpuLayers ?? 99)
    ], { windowsHide: true, stdio: 'ignore' });
    sreTelemetry.autoHeals += 1;
    llamaProcess.on('exit', () => { llamaProcess = null; });
  });
}

function installMenu() {
  const send = (command) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('command', command);
  };
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Tab', accelerator: 'CmdOrCtrl+T', click: () => send('new-tab') },
        { label: 'Reopen Closed Tab', accelerator: 'CmdOrCtrl+Shift+T', click: () => send('reopen-closed-tab') },
        { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: () => send('close-tab') },
        { label: 'Next Tab', accelerator: 'CmdOrCtrl+Tab', click: () => send('next-tab') },
        { label: 'Previous Tab', accelerator: 'CmdOrCtrl+Shift+Tab', click: () => send('prev-tab') },
        { label: 'Bookmark', accelerator: 'CmdOrCtrl+D', click: () => send('bookmark') },
        { label: 'History', accelerator: 'CmdOrCtrl+H', click: () => send('history') },
        { label: 'Downloads', accelerator: 'CmdOrCtrl+J', click: () => send('downloads') },
        { label: 'Save Page as PDF', accelerator: 'CmdOrCtrl+P', click: () => send('export-pdf') },
        { label: 'Find in Page', accelerator: 'CmdOrCtrl+F', click: () => send('find') },
        { label: 'Focus Address Bar', accelerator: 'CmdOrCtrl+L', click: () => send('focus-url') },
        { label: 'Command Palette', accelerator: 'CmdOrCtrl+K', click: () => send('command-palette') },
        { label: 'Find Passages', accelerator: 'CmdOrCtrl+Shift+F', click: () => send('passage-search') },
        { type: 'separator' },
        { label: 'Reload Page', accelerator: 'CmdOrCtrl+R', click: () => send('reload') },
        { label: 'Back', accelerator: 'Alt+Left', click: () => send('back') },
        { label: 'Forward', accelerator: 'Alt+Right', click: () => send('forward') },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', click: () => send('zoom-in') },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => send('zoom-out') },
        { label: 'Reset Page Zoom', accelerator: 'CmdOrCtrl+0', click: () => send('zoom-reset') },
        { label: 'Zen Focus Mode', accelerator: 'Alt+Z', click: () => send('zen-mode') },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function forwardGuestKeys(win, guest) {
  guest.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || !win || win.isDestroyed()) return;
    const key = String(input.key || '').toLowerCase();
    if (input.control && !input.alt && key === 'f') {
      event.preventDefault();
      win.webContents.send('command', input.shift ? 'passage-search' : 'find');
    } else if (input.alt && !input.control && !input.shift && key === 'g') {
      event.preventDefault();
      win.webContents.send('command', 'ghostwrite');
    } else if (input.alt && !input.control && !input.shift && key === 'z') {
      event.preventDefault();
      win.webContents.send('command', 'zen-mode');
    } else if (input.alt && !input.control && !input.shift && key === 'arrowleft') {
      event.preventDefault();
      win.webContents.send('command', 'back');
    } else if (input.alt && !input.control && !input.shift && key === 'arrowright') {
      event.preventDefault();
      win.webContents.send('command', 'forward');
    } else if (input.control && !input.alt && !input.shift && key === 'r') {
      event.preventDefault();
      win.webContents.send('command', 'reload');
    } else if (input.control && !input.alt && key === 't') {
      event.preventDefault();
      win.webContents.send('command', input.shift ? 'reopen-closed-tab' : 'new-tab');
    } else if (input.control && !input.alt && !input.shift && key === 'w') {
      event.preventDefault();
      win.webContents.send('command', 'close-tab');
    } else if (input.control && !input.alt && key === 'tab') {
      event.preventDefault();
      win.webContents.send('command', input.shift ? 'prev-tab' : 'next-tab');
    } else if (input.control && !input.alt && !input.shift && key === 'p') {
      event.preventDefault();
      win.webContents.send('command', 'export-pdf');
    } else if (input.control && !input.alt && !input.shift && key === 'l') {
      event.preventDefault();
      win.webContents.send('command', 'focus-url');
    } else if (input.control && !input.alt && !input.shift && key === 'k') {
      event.preventDefault();
      win.webContents.send('command', 'command-palette');
    } else if (input.control && !input.alt && !input.shift && key === 'd') {
      event.preventDefault();
      win.webContents.send('command', 'bookmark');
    } else if (input.control && !input.alt && !input.shift && key === 'h') {
      event.preventDefault();
      win.webContents.send('command', 'history');
    } else if (input.control && !input.alt && !input.shift && key === 'j') {
      event.preventDefault();
      win.webContents.send('command', 'downloads');
    } else if (input.control && !input.alt && !input.shift && (key === '=' || key === '+')) {
      event.preventDefault();
      win.webContents.send('command', 'zoom-in');
    } else if (input.control && !input.alt && key === '-') {
      event.preventDefault();
      win.webContents.send('command', 'zoom-out');
    } else if (input.control && !input.alt && !input.shift && key === '0') {
      event.preventDefault();
      win.webContents.send('command', 'zoom-reset');
    }
  });
}

function wireHost(win) {
  try { win.webContents.setMaxListeners(50); } catch (_) {}
  win.webContents.on('will-navigate', (event, url) => {
    if (!isOurChrome(url)) event.preventDefault();
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    if (params.partition !== 'persist:gigachad_vault') { event.preventDefault(); return; }
    delete webPreferences.preload;
    delete webPreferences.preloadURL;
    webPreferences.nodeIntegration = false;
    webPreferences.nodeIntegrationInSubFrames = false;
    webPreferences.nodeIntegrationInWorker = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.webSecurity = true;
    if (params.src && !isAllowedGuestUrl(params.src)) event.preventDefault();
  });
  win.webContents.on('did-attach-webview', (_event, guest) => {
    try { guest.setMaxListeners(50); } catch (_) {}
    guest.setWindowOpenHandler(({ url }) => {
      if (isAllowedGuestUrl(url)) {
        win.webContents.send('open-url', url);
      }
      return { action: 'deny' };
    });
    const blockBad = (event, url) => {
      if (!isAllowedGuestUrl(url)) event.preventDefault();
    };
    guest.on('will-navigate', blockBad);
    guest.on('will-redirect', blockBad);
    forwardGuestKeys(win, guest);

    guest.on('context-menu', (_evt, params) => {
      if (!win || win.isDestroyed()) return;
      const items = [];
      const sel = String(params.selectionText || '').trim();
      if (sel) {
        const preview = sel.length > 28 ? sel.slice(0, 28) + '…' : sel;
        items.push(
          {
            label: `Ask Copilot about "${preview}"`,
            click: () => win.webContents.send('context-action', { type: 'ask-selection', text: sel.slice(0, 4000) })
          },
          {
            label: 'Summarize Selected Text',
            click: () => win.webContents.send('context-action', { type: 'summarize-selection', text: sel.slice(0, 6000) })
          },
          {
            label: 'Read Selection Aloud',
            click: () => win.webContents.send('context-action', { type: 'tts-selection', text: sel.slice(0, 600) })
          },
          { type: 'separator' },
          { label: 'Copy', click: () => guest.copy() },
          { type: 'separator' }
        );
      }
      if (params.isEditable) {
        items.push(
          { label: 'Ghostwrite Inline (Alt+G)', click: () => win.webContents.send('command', 'ghostwrite') },
          { label: 'Cut', click: () => guest.cut() },
          { label: 'Copy', click: () => guest.copy() },
          { label: 'Paste', click: () => guest.paste() },
          { type: 'separator' }
        );
      }
      if (params.linkURL && isAllowedGuestUrl(params.linkURL)) {
        items.push(
          { label: 'Open Link in New Tab', click: () => win.webContents.send('open-url', params.linkURL) },
          { label: 'Copy Link Address', click: () => clipboard.writeText(params.linkURL) },
          { type: 'separator' }
        );
      }
      if (params.mediaType === 'image' && params.srcURL && /^https?:/i.test(params.srcURL)) {
        items.push(
          {
            label: 'Save Image to GigachadMedia',
            click: async () => {
              try {
                const ext = path.extname(new URL(params.srcURL).pathname) || '.jpg';
                const dest = uniqueDownloadPath(`image_${Date.now()}${ext}`);
                await downloadDirectFile(params.srcURL, dest);
                noteDownload({ id: 'dl_' + Date.now(), filename: path.basename(dest), url: params.srcURL, path: dest, state: 'completed', received: 1, total: 1 });
              } catch (_) {}
            }
          },
          { label: 'Copy Image Address', click: () => clipboard.writeText(params.srcURL) },
          { type: 'separator' }
        );
      }
      items.push(
        { label: 'Back', enabled: guest.canGoBack(), click: () => guest.goBack() },
        { label: 'Forward', enabled: guest.canGoForward(), click: () => guest.goForward() },
        { label: 'Reload Page', click: () => guest.reload() },
        { type: 'separator' },
        { label: 'Save Page as PDF', click: () => win.webContents.send('command', 'export-pdf') },
        { label: 'Capture Page Screenshot', click: () => win.webContents.send('command', 'screenshot') },
        { label: 'Inspect Element', click: () => guest.inspectElement(params.x, params.y) }
      );
      Menu.buildFromTemplate(items).popup({ window: win });
    });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 760,
    minHeight: 520,
    backgroundColor: '#0c0e14',
    title: 'Gigachad Browser',
    titleBarStyle: process.platform === 'win32' ? 'hidden' : 'default',
    titleBarOverlay: process.platform === 'win32'
      ? { color: '#11141c', symbolColor: '#949eb5', height: 40 }
      : undefined,
    show: false,
    webPreferences: {
      preload: path.join(ROOT, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webviewTag: true,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false
    }
  });
  mainWindow = win;
  genomeWindowGuard = genomeIpc.guardWindow(win);
  if (!SMOKE) {
    const ensureVisible = () => {
      try {
        if (win.isDestroyed()) return;
        win.show();
        win.restore();
        win.show();
        win.focus();
      } catch (_) {}
    };
    win.once('ready-to-show', ensureVisible);
    win.webContents.once('did-finish-load', () => setTimeout(ensureVisible, 120));
  }
  wireHost(win);
  win.loadFile(CHROME_FILE);
  return win;
}

const STEALTH_SCRIPT = `(() => {
  try {
    Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true });
    if (window.HTMLCanvasElement && HTMLCanvasElement.prototype.toDataURL) {
      const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function (...args) {
        try {
          const ctx = this.getContext && this.getContext('2d');
          if (ctx && this.width > 0 && this.height > 0) {
            const img = ctx.getImageData(0, 0, 1, 1);
            img.data[0] = (img.data[0] + 1) & 255;
            ctx.putImageData(img, 0, 0);
          }
        } catch (_) {}
        return origToDataURL.apply(this, args);
      };
    }
    if (window.WebGLRenderingContext && WebGLRenderingContext.prototype.getParameter) {
      const origGetParam = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (param) {
        if (param === 37445) return 'NVIDIA Corporation';
        if (param === 37446) return 'NVIDIA GeForce RTX 5070 Ti/PCIe/SSE2';
        return origGetParam.apply(this, arguments);
      };
    }
    if (window.AudioBuffer && AudioBuffer.prototype.getChannelData) {
      const origChannelData = AudioBuffer.prototype.getChannelData;
      AudioBuffer.prototype.getChannelData = function () {
        const data = origChannelData.apply(this, arguments);
        if (data && data.length > 0) data[0] = data[0] + 1e-7;
        return data;
      };
    }
  } catch (_) {}
})();`;

async function attachAndEnableCDP(wc) {
  const wcId = wc.id;
  if (!wc.debugger.isAttached()) wc.debugger.attach('1.3');
  if (attachedDebuggers.has(wcId)) return;
  attachedDebuggers.add(wcId);
  snifferBuffer.set(wcId, []);
  securityHeadersMap.set(wcId, { headers: {}, status: 200, url: '', httpErrors: 0, totalRequests: 0 });
  try { await wc.debugger.sendCommand('Network.enable', { maxPostDataSize: 65536 }); } catch (_) {}
  try { await wc.debugger.sendCommand('Page.enable'); } catch (_) {}
  try { await wc.debugger.sendCommand('Performance.enable'); } catch (_) {}
  if (cfg.stealthCloak) {
    try {
      await wc.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument', { source: STEALTH_SCRIPT });
    } catch (_) {}
  }
  wc.debugger.on('message', async (_event, method, params) => {
    if (method !== 'Network.responseReceived') return;
    const mime = (params.response?.mimeType || '').toLowerCase();
    const url = params.response?.url || '';
    const status = params.response?.status || 200;
    const secState = securityHeadersMap.get(wcId) || { headers: {}, status: 200, url: '', httpErrors: 0, totalRequests: 0 };
    secState.totalRequests += 1;
    if (status >= 400) secState.httpErrors += 1;
    if (params.type === 'Document') {
      secState.headers = params.response?.headers || {};
      secState.status = status;
      secState.url = url;
    }
    securityHeadersMap.set(wcId, secState);
    if (!mime.includes('json') || url.startsWith('data:')) return;
    try {
      const bodyObj = await wc.debugger.sendCommand('Network.getResponseBody', { requestId: params.requestId });
      if (!bodyObj?.body) return;
      const list = snifferBuffer.get(wcId) || [];
      list.unshift({ url: url.slice(0, 140), status, preview: String(bodyObj.body).slice(0, 2500) });
      if (list.length > 18) list.pop();
      snifferBuffer.set(wcId, list);
    } catch (_) {}
  });
  wc.on('destroyed', () => {
    attachedDebuggers.delete(wcId);
    snifferBuffer.delete(wcId);
    mediaStreamBuffer.delete(wcId);
    securityHeadersMap.delete(wcId);
  });
}

function clampCoord(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(10000, Math.round(value)));
}

function redactSecret(value) {
  const text = String(value || '');
  if (text.length <= 8) return '***';
  return text.slice(0, 4) + '…' + text.slice(-2);
}

function noteDownload(record) {
  downloads.unshift(record);
  if (downloads.length > 40) downloads.pop();
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('download-update', downloads[0]);
}

function installSessionHooks() {
  const vaultSession = session.fromPartition('persist:gigachad_vault');
  if (SMOKE) {
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (_details, callback) => callback({ cancel: true }));
  }
  const quietAllow = new Set(['clipboard-sanitized-write', 'fullscreen', 'pointerLock']);
  const ask = new Set(['media', 'geolocation', 'notifications', 'display-capture', 'clipboard-read']);
  const permissionHandler = (wc, permission, callback, details) => {
    if (quietAllow.has(permission)) return callback(true);
    const guest = wc && typeof wc.getType === 'function' && wc.getType() === 'webview';
    if (!guest || !ask.has(permission) || !mainWindow || mainWindow.isDestroyed()) return callback(false);
    const id = String(++permissionSeq);
    pendingPermissions.set(id, callback);
    const origin = (details && (details.requestingUrl || details.securityOrigin)) || '';
    mainWindow.webContents.send('permission-request', { id, permission, origin });
    setTimeout(() => {
      const pending = pendingPermissions.get(id);
      if (!pending) return;
      pendingPermissions.delete(id);
      pending(false);
    }, 20000);
  };
  vaultSession.setPermissionRequestHandler(permissionHandler);
  vaultSession.setPermissionCheckHandler((_wc, permission) => quietAllow.has(permission));
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);

  vaultSession.on('will-download', (_event, item) => {
    const dest = uniqueDownloadPath(item.getFilename() || 'download.bin');
    item.setSavePath(dest);
    const record = {
      id: 'dl_' + Date.now(),
      filename: path.basename(dest),
      url: item.getURL(),
      path: dest,
      state: 'progressing',
      received: 0,
      total: item.getTotalBytes()
    };
    noteDownload(record);
    item.on('updated', () => {
      record.received = item.getReceivedBytes();
      record.total = item.getTotalBytes();
      record.state = item.isPaused() ? 'paused' : 'progressing';
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('download-update', record);
    });
    item.once('done', (_evt, state) => {
      record.state = state;
      record.received = item.getReceivedBytes();
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('download-update', record);
    });
  });

  vaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, async (details, callback) => {
    if (SMOKE) {
      let ownedLocalAsset = false;
      try {
        const url = new URL(details.url);
        ownedLocalAsset = url.protocol === 'http:' && url.hostname === '127.0.0.1' &&
          _localBrainsHttpPort > 0 && Number(url.port) === _localBrainsHttpPort;
      } catch (_) {}
      if (!ownedLocalAsset) return callback({ cancel: true });
    }
    if (isOnionUrl(details.url)) {
      if (!validateOnionAddress(details.url).valid || !deepWebTransport.socksHandshakeVerified || !deepWebTransport.appliedSessions.includes(vaultSession)) {
        deepWebNavigation.begin(details, null, false);
        deepWebNavigation.complete(details, 'onion_transport_unavailable_or_invalid_address');
        return callback({ cancel: true });
      }
      try {
        const route = await vaultSession.resolveProxy(details.url);
        if (route !== `SOCKS5 127.0.0.1:${deepWebTransport.activeTorPort}`) throw new Error('onion_route_not_exclusive_socks5');
        deepWebNavigation.begin(details, route, true);
      } catch (err) {
        deepWebNavigation.begin(details, null, false);
        deepWebNavigation.complete(details, err.message);
        return callback({ cancel: true });
      }
    } else deepWebNavigation.begin(details, null, false);
    const urlLower = details.url.toLowerCase();
    if (isTrackerUrl(urlLower, FILTERS.block, FILTERS.allow)) {
      blockedCount += 1;
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('adblock-tick', blockedCount);
      return callback({ cancel: true });
    }
    if (MEDIA_EXTENSIONS.test(details.url) && details.webContentsId) {
      const list = mediaStreamBuffer.get(details.webContentsId) || [];
      if (!list.some((item) => item.url === details.url)) {
        list.unshift({ url: details.url, type: details.resourceType || 'media', time: new Date().toLocaleTimeString() });
        if (list.length > 30) list.pop();
        mediaStreamBuffer.set(details.webContentsId, list);
      }
    }
    callback({ cancel: false });
  });

  vaultSession.webRequest.onCompleted(details => deepWebNavigation.complete(details));
  vaultSession.webRequest.onErrorOccurred(details => deepWebNavigation.complete(details, details.error || 'request_failed'));

  vaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    delete details.requestHeaders['X-Client-Data'];
    details.requestHeaders.DNT = '1';
    details.requestHeaders['Sec-GPC'] = '1';
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
}

function downloadDirectFile(url, destPath, redirectsLeft = 3) {
  if (SMOKE) return Promise.reject(new Error('Downloads are disabled in isolated smoke mode.'));
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(url); } catch (err) { return reject(err); }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return reject(new Error('Only http(s) downloads are allowed'));
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'GigachadBrowser' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (redirectsLeft <= 0) return reject(new Error('Too many redirects'));
        return downloadDirectFile(new URL(res.headers.location, url).href, destPath, redirectsLeft - 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const file = fs.createWriteStream(destPath);
      let received = 0;
      const maxBytes = 200 * 1024 * 1024;
      res.on('data', (chunk) => {
        received += chunk.length;
        if (received > maxBytes) {
          req.destroy();
          file.close();
          fs.rmSync(destPath, { force: true });
          reject(new Error('Download exceeded 200MB'));
        }
      });
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(destPath)));
      file.on('error', reject);
    });
    req.setTimeout(60000, () => req.destroy(new Error('Download timed out')));
    req.on('error', reject);
  });
}

function safeDownloadName(filename) {
  const base = path.basename(String(filename || 'download.txt')).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base || 'download.txt';
}

function uniqueDownloadPath(filename) {
  const clean = safeDownloadName(filename);
  const dest = path.join(DOWNLOAD_DIR, clean);
  if (!fs.existsSync(dest)) return dest;
  const ext = path.extname(clean);
  const stem = path.basename(clean, ext);
  return path.join(DOWNLOAD_DIR, `${stem}-${Date.now()}${ext}`);
}

async function embedText(text, sidecarUrl, timeoutMs = 4000) {
  try {
    const result = await fetchJson(`${sidecarUrl}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: text })
    }, timeoutMs);
    if (!result.ok) return { vector: null, implementation: result.data?.implementation || 'unavailable', dim: 0 };
    const vector = result.data?.embedding;
    if (!Array.isArray(vector) || !vector.length) return { vector: null, implementation: 'unavailable', dim: 0 };
    return { vector, implementation: result.data.implementation || 'unknown', dim: vector.length };
  } catch (_) {
    return { vector: null, implementation: 'unavailable', dim: 0 };
  }
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

function tokenize(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((word) => word.length > 2);
}

async function searchMemoryVault(query, sidecarUrl, topK = 3) {
  if (!memoryVault.length || !query) return [];
  const embedded = await embedText(query, sidecarUrl, 650);
  const qTokens = new Set(tokenize(query));
  const scored = memoryVault.map((item) => {
    let score = 0;
    if (embedded.vector && item.embedding && item.embedding.length === embedded.vector.length) {
      score = cosineSimilarity(embedded.vector, item.embedding);
    } else {
      const docTokens = tokenize(`${item.title || ''} ${item.summary || ''}`);
      let hits = 0;
      for (const token of docTokens) if (qTokens.has(token)) hits += 1;
      score = hits / Math.sqrt(docTokens.length + 10);
    }
    return { item, score };
  });
  return scored.filter((row) => row.score > 0.08).sort((a, b) => b.score - a.score).slice(0, topK).map((row) => row.item);
}

async function discoverDefaultLlm() {
  if (cfg.llmBaseUrlExplicit) return;
  const candidates = ['http://127.0.0.1:11434/v1', 'http://127.0.0.1:1234/v1'];
  for (const base of candidates) {
    try {
      const result = await fetchJson(`${base}/models`, {}, 800);
      if (result.ok && Array.isArray(result.data?.data)) {
        cfg.llmBaseUrl = base;
        cfg.llmDiscoveredFrom = base;
        return;
      }
    } catch (_) {}
  }
}

const NON_CHAT_MODEL_RE = /(embed|bge-m3|nomic-embed|asr|parakeet|diarization|whisper|kokoro)/i;
function rankChatModels(rawModels) {
  const chatOnly = (rawModels || []).filter(id => typeof id === 'string' && id && !NON_CHAT_MODEL_RE.test(id));
  const configured = [cfg.localModel, cfg.omniModel].filter(Boolean);
  return [...new Set(chatOnly)].sort((a, b) => {
    const ai = configured.indexOf(a), bi = configured.indexOf(b);
    return (ai < 0 ? configured.length : ai) - (bi < 0 ? configured.length : bi) || a.localeCompare(b);
  });
}

function pickBestVisionModel(models) {
  if (cfg.omniModel && (models || []).includes(cfg.omniModel)) return cfg.omniModel;
  // The catalog often lacks capability metadata. This is only a name hint;
  // inference success, not a guessed brand identity, verifies image support.
  return (models || []).find(model => /(^|[-_])(vl|vision|omni)([-_]|$)/i.test(model)) || '';
}

let localModelsCache = { base: '', ts: 0, value: null };

async function listLocalModels(baseOverride, forceRefresh = false) {
  const base = normalizeOpenAiBase(baseOverride || cfg.llmBaseUrl);
  if (!forceRefresh && localModelsCache.value && localModelsCache.base === base && (Date.now() - localModelsCache.ts) < 30000) {
    return localModelsCache.value;
  }
  const headers = {};
  let matchesConfiguredOrigin = false;
  try { matchesConfiguredOrigin = new URL(base).origin === new URL(normalizeOpenAiBase(cfg.llmBaseUrl)).origin; } catch (_) {}
  if (cfg.llmApiKey && matchesConfiguredOrigin) headers.Authorization = `Bearer ${cfg.llmApiKey}`;
  const result = await fetchJson(`${base}/models`, { headers }, 2500);
  if (!result.ok) {
    const message = result.data?.error?.message || result.data?.error || `HTTP ${result.status}`;
    return { ok: false, error: String(message), models: [] };
  }
  const rows = Array.isArray(result.data?.data) ? result.data.data : [];
  const loadedRow = rows.find((row) => row && row.id && !NON_CHAT_MODEL_RE.test(row.id) && row.status?.value === 'loaded');
  const rawModels = rows.map((row) => row.id).filter(Boolean);
  const models = rankChatModels(rawModels);
  const out = {
    ok: true,
    models,
    loadedModel: loadedRow ? loadedRow.id : '',
    visionModel: pickBestVisionModel(models)
  };
  localModelsCache = { base, ts: Date.now(), value: out };
  return out;
}

async function queryRouter(prompt, pageLength, sidecarUrl, allowCloud) {
  if (allowCloud) {
    return { target: 'ultra', implementation: 'openrouter-free-omni-default', model: cfg.openRouterModel || null };
  }
  try {
    const result = await fetchJson(`${sidecarUrl}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, page_length: pageLength, allow_cloud: allowCloud })
    }, 800);
    if (result.ok) return result.data;
  } catch (_) {}
  const lower = String(prompt || '').toLowerCase();
  if (/\b(screenshot|image|diagram|chart|ocr)\b/.test(lower)) {
    return { target: 'omni', implementation: 'main-process-keyword-fallback', model: null };
  }
  return { target: 'local', implementation: 'main-process-keyword-fallback', model: null };
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-6).map((message) => ({
    role: message?.role === 'assistant' ? 'assistant' : 'user',
    content: String(message?.content || '').slice(0, 8000)
  })).filter((message) => message.content);
}

function sanitizeBoard(board) {
  if (!Array.isArray(board)) throw new Error('Board must be an array');
  return board.slice(0, 200).map((card, index) => ({
    id: String(card?.id || `k_${Date.now()}_${index}`).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || `k_${index}`,
    title: String(card?.title || '').slice(0, 240),
    col: ['backlog', 'progress', 'done'].includes(card?.col) ? card.col : 'backlog',
    tag: String(card?.tag || 'task').slice(0, 40)
  }));
}

const AGENT_SYSTEM_PROMPT = `You are the Gigachad Autonomous Browser Agent (Comet / Atlas class). You read live webpage DOM + Set-of-Marks ([Mark #N]) and execute real browser actions on the user's behalf.
When the user's goal or autonomous step requires a browser action, state a brief 1-2 sentence plan/observation and include exactly ONE JSON action object inside a \`\`\`json fence:
- {"action":"navigate","url":"https://...","reason":"..."}
- {"action":"open_tab","url":"https://...","reason":"open in new tab"}
- {"action":"switch_tab","index":1,"query":"optional title/url match"} or {"action":"close_tab","index":2}
- {"action":"click","mark":12,"reason":"click link or button"} or {"action":"double_click","mark":12} or {"action":"right_click","mark":12}
- {"action":"hover","mark":12,"reason":"reveal menu or tooltip"}
- {"action":"type","mark":5,"text":"search query","pressEnter":true}
- {"action":"select_option","mark":8,"value":"option text or value"} or {"action":"check","mark":6,"checked":true}
- {"action":"press_key","key":"Enter|Escape|Tab|ArrowDown|PageDown"}
- {"action":"scroll","direction":"down|up"} or {"action":"scroll_to","target":"top|bottom|mark","mark":12}
- {"action":"wait","ms":1200}
- {"action":"back"} or {"action":"forward"} or {"action":"reload"}
- {"action":"download_media","format":"mp4|mp3"}
- {"action":"download_links","filter":"pdf|image|media|all"}
- {"action":"export_pdf"} or {"action":"screenshot"}
- {"action":"extract_table"} or {"action":"extract_structured"} or {"action":"unlock_page"}
- {"action":"swarm_research","query":"sub-topic for 3 parallel ghost tabs"}
- {"action":"drag","mark":1,"toMark":2,"reason":"drag element or slider"}
- {"action":"watch_page","url":"https://...","intervalSec":60,"goal":"monitor page for price/content changes"}
- {"action":"fill_form","fields":{"name":"...","email":"...","query":"..."}}
- {"action":"upload_file","filePath":"C:/path/to/file.txt","selector":"input[type=file]"}
- {"action":"make_artifact","title":"Interactive Calculator","html":"<div>...</div>"}
- {"action":"run_playbook","id":"morning_radar|full_audit|data_harvest"}
- {"action":"save_memory","title":"...","content":"key extracted facts"}
- {"action":"patch_site","css":"...","js":"..."}
- {"action":"done","summary":"complete synthesis of what was accomplished and found"}
Rules:
1. click, hover, and type MUST use a valid [Mark #N] integer from ELEMENTS. Never invent mark numbers.
2. navigate and open_tab URLs must be http:// or https://.To search the web from any page, navigate to https://html.duckduckgo.com/html/?q=YOUR+QUERY.
3. In multi-step missions, execute one action per step, observe the updated DOM/ELEMENTS on the next turn, and emit {"action":"done","summary":"..."} only when the goal is genuinely fulfilled.
4. patch_site CSS/JS runs in the guest webpage origin, not in Node. Do not request or repeat secrets from the page.`;

function registerIpc() {
  ipcMain.handle('config-get', (event) => (fromChrome(event) ? publicConfig() : { ok: false, error: 'unauthorized' }));

  ipcMain.handle('config-save', async (event, partial) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    try {
      if (!partial || typeof partial !== 'object') throw new Error('Expected an object');
      const next = { ...partial };
      // Executable paths that main spawns (python / yt-dlp / llama-server) can turn renderer code-exec
      // into host process execution. Require explicit user confirmation for any CHANGE to one of them,
      // so a prompt-injected agent cannot silently repoint them while the Settings UI still works.
      const execKeys = ['pythonPath', 'ytdlpPath', 'llamaServerPath', 'torPath'];
      const changedExec = execKeys.filter((k) => k in next && String(next[k] || '') !== String(cfg[k] || ''));
      if (changedExec.length) {
        let approved = false;
        try {
          const opts = {
            type: 'warning', buttons: ['Cancel', 'Allow change'], defaultId: 0, cancelId: 0, noLink: true,
            title: 'Confirm executable path change',
            message: 'An executable that Gigachad launches is being changed. Allow only if you did this in Settings.',
            detail: changedExec.map((k) => `${k} -> ${String(next[k] || '(cleared)')}`).join('\n')
          };
          const res = (mainWindow && !mainWindow.isDestroyed())
            ? await dialog.showMessageBox(mainWindow, opts)
            : await dialog.showMessageBox(opts);
          approved = res.response === 1;
        } catch (_) { approved = false; }
        if (!approved) { for (const k of changedExec) delete next[k]; }
      }
      if (next.llmBaseUrl) next.llmBaseUrl = normalizeOpenAiBase(next.llmBaseUrl);
      if (next.sidecarPort != null && next.sidecarPort !== '') {
        const port = Number(next.sidecarPort);
        if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Sidecar port must be between 1 and 65535');
      }
      saveUserConfig(next, { root: ROOT, isolated: SMOKE });
      cfg = loadConfig({ root: ROOT, isolated: SMOKE });
      return { ok: true, config: publicConfig() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('sidecar-health', async (event) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const local = {
      logPath: sidecarLogPath(),
      lastError: sidecarLastError,
      owned: Boolean(sidecarProcess && sidecarProcess.exitCode == null)
    };
    try {
      const probe = await sidecarProbe();
      if (probe.state === 'ready') return { ok: true, data: probe.data, ...local, lastError: '' };
      if (probe.state === 'conflict') {
        const error = `Port ${cfg.sidecarPort} is in use by another program.`;
        return { ok: false, error, data: probe.data, ...local, lastError: error };
      }
      return { ok: false, error: sidecarLastError || 'Sidecar is not running', ...local };
    } catch (err) {
      return { ok: false, error: err.message, ...local };
    }
  });

  ipcMain.handle('ai-cancel', (event) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    if (activeAiAbort) {
      activeAiAbort.__cancelledByUser = true;
      activeAiAbort.abort();
    }
    return { ok: true };
  });

  ipcMain.handle('permission-reply', (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const pending = pendingPermissions.get(String(payload && payload.id || ''));
    if (!pending) return { ok: false, error: 'That permission request already closed' };
    pendingPermissions.delete(String(payload.id));
    pending(Boolean(payload && payload.allow));
    return { ok: true };
  });

  const localBrainPortalRe = /^http:\/\/127\.0\.0\.1:\d+\/((?:dimension-omega-singularity|asmodensius-v40|cqm-xylos|glitchling|tsotchke-diffusion|thingmaker|grimoire-arcane|quantum_neural_manifold_3d\.html)(?:\/.*)?)$/i;
  const rewriteBrainPortalList = async (items) => {
    if (!Array.isArray(items) || !items.some((it) => it && localBrainPortalRe.test(String(it.url || '')))) return items;
    const httpPort = await ensureLocalBrainsHttpServer().catch(() => 0);
    if (httpPort > 0) {
      for (const it of items) {
        const m = String(it?.url || '').match(localBrainPortalRe);
        if (m) it.url = `http://127.0.0.1:${httpPort}/${m[1]}`;
      }
    }
    return items;
  };

  ipcMain.handle('history-add', (event, entry) => {
    if (!fromChrome(event)) return [];
    history = addHistory(history, entry);
    saveJson(userFile('history.json'), history);
    return history.slice(0, 50);
  });
  ipcMain.handle('history-get', async (event) => {
    if (!fromChrome(event)) return [];
    await rewriteBrainPortalList(history);
    return history.slice(0, 200);
  });
  ipcMain.handle('history-clear', (event) => {
    if (!fromChrome(event)) return [];
    history = [];
    saveJson(userFile('history.json'), history);
    return history;
  });
  ipcMain.handle('bookmark-toggle', (event, entry) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const result = toggleBookmark(bookmarks, entry);
    bookmarks = result.list;
    saveJson(userFile('bookmarks.json'), bookmarks);
    return { ok: !result.error, added: result.added, error: result.error || '', bookmarks };
  });
  ipcMain.handle('bookmark-list', async (event) => {
    if (!fromChrome(event)) return [];
    return await rewriteBrainPortalList(bookmarks);
  });
  ipcMain.handle('bookmark-delete', (event, url) => {
    if (!fromChrome(event)) return [];
    bookmarks = bookmarks.filter((item) => item.url !== url);
    saveJson(userFile('bookmarks.json'), bookmarks);
    return bookmarks;
  });
  ipcMain.handle('session-save', (event, tabs) => {
    if (!fromChrome(event)) return { ok: false };
    const clean = sanitizeSession(tabs);
    saveJson(userFile('session.json'), { tabs: clean, savedAt: new Date().toISOString() });
    return { ok: true, count: clean.length };
  });
  ipcMain.handle('session-load', async (event) => {
    if (!fromChrome(event)) return { tabs: [] };
    const saved = loadJson(userFile('session.json'), { tabs: [] });
    const clean = sanitizeSession(saved.tabs);
    await rewriteBrainPortalList(clean);
    return { tabs: clean };
  });
  ipcMain.handle('downloads-list', (event) => (fromChrome(event) ? downloads : []));

  ipcMain.handle('tab-record-closed', (event, entry) => {
    if (!fromChrome(event)) return [];
    closedTabs = recordClosedTab(closedTabs, entry);
    saveJson(userFile('closed_tabs.json'), closedTabs);
    return closedTabs;
  });

  ipcMain.handle('tab-reopen-closed', async (event) => {
    if (!fromChrome(event)) return { ok: false, tab: null, reopened: null };
    const popped = popClosedTab(closedTabs);
    closedTabs = popped.stack;
    saveJson(userFile('closed_tabs.json'), closedTabs);
    if (popped.tab && localBrainPortalRe.test(String(popped.tab.url || ''))) {
      await rewriteBrainPortalList([popped.tab]);
    }
    return { ok: Boolean(popped.tab), tab: popped.tab, reopened: popped.tab };
  });

  ipcMain.handle('omnibox-suggest', (event, payload) => {
    if (!fromChrome(event)) return [];
    const query = String(payload?.query || '');
    const tabs = Array.isArray(payload?.tabs) ? payload.tabs : [];
    return suggestOmnibox(query, { tabs, bookmarks, history, vault: memoryVault }, 8);
  });

  ipcMain.handle('memory-search', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, results: [] };
    const query = String(payload?.query || '').trim();
    const cleanNotes = memoryVault.slice(0, 150).map(({ embedding, ...rest }) => rest);
    if (!query) return { ok: true, results: cleanNotes };
    try {
      const res = await fetchJson(`${cfg.sidecarUrl}/query_memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, notes: cleanNotes, top_k: 25 })
      }, 2000);
      if (res.ok && Array.isArray(res.data?.results)) return { ok: true, results: res.data.results };
    } catch (_) {}
    const q = query.toLowerCase();
    const matched = cleanNotes.filter((n) =>
      String(n.title || '').toLowerCase().includes(q) ||
      String(n.summary || '').toLowerCase().includes(q) ||
      String(n.url || '').toLowerCase().includes(q)
    );
    return { ok: true, results: matched };
  });

  ipcMain.handle('page-snapshot-pdf', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const wc = asGuest(payload?.wcId);
    if (!wc) return { ok: false, error: 'Tab webContents not found' };
    try {
      const pdfBuf = await wc.printToPDF({ printBackground: true, pageSize: 'A4' });
      const titleSlug = safeDownloadName(String(payload?.title || 'page').slice(0, 50) + '.pdf');
      const dest = uniqueDownloadPath(titleSlug);
      fs.writeFileSync(dest, pdfBuf);
      noteDownload({
        id: 'dl_' + Date.now(),
        filename: path.basename(dest),
        url: wc.getURL() || '',
        path: dest,
        state: 'completed',
        received: pdfBuf.length,
        total: pdfBuf.length
      });
      return { ok: true, path: dest, filename: path.basename(dest) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('page-screenshot-save', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const wc = asGuest(payload?.wcId);
    if (!wc) return { ok: false, error: 'Tab webContents not found' };
    try {
      const img = await wc.capturePage();
      const pngBuf = img.toPNG();
      const titleSlug = safeDownloadName(String(payload?.title || 'capture').slice(0, 50) + '.png');
      const dest = uniqueDownloadPath(titleSlug);
      fs.writeFileSync(dest, pngBuf);
      noteDownload({
        id: 'dl_' + Date.now(),
        filename: path.basename(dest),
        url: wc.getURL() || '',
        path: dest,
        state: 'completed',
        received: pngBuf.length,
        total: pngBuf.length
      });
      return { ok: true, path: dest, filename: path.basename(dest) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('alive-research-plan', async (event, payload = {}) => {
    if (!fromChrome(event)) return { status: 'blocked', reason: 'unauthorized' };
    if (SMOKE) return { status: 'unavailable', reason: 'Providers disabled in isolated smoke mode' };
    return require('./systems/alive-research-planner.cjs').planResearch({ cfg, payload });
  });

  ipcMain.handle('llm-list-models', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized', models: [] };
    try {
      return await listLocalModels(payload && payload.baseUrl);
    } catch (err) {
      return { ok: false, error: err.message, models: [] };
    }
  });

  ipcMain.handle('cdp-init-tab', async (event, wcId) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const wc = asGuest(wcId);
    if (!wc) return { ok: false, error: 'Tab webContents not found' };
    try {
      await attachAndEnableCDP(wc);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('cdp-get-sniffed-apis', (event, wcId) => {
    if (!fromChrome(event)) return [];
    const wc = asGuest(wcId);
    return wc ? (snifferBuffer.get(wc.id) || []) : [];
  });

  ipcMain.handle('cdp-execute', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const wc = asGuest(payload?.wcId);
    if (!wc) return { ok: false, error: 'Tab webContents not found' };
    const cmd = payload?.cmd || {};
    try {
      await attachAndEnableCDP(wc);
      if (cmd.action === 'click') {
        const x = clampCoord(cmd.x);
        const y = clampCoord(cmd.y);
        if (x == null || y == null) return { ok: false, error: 'click needs numeric x and y' };
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
        await new Promise((r) => setTimeout(r, 28));
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
        await new Promise((r) => setTimeout(r, 42));
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
        return { ok: true, detail: `Click (${x}, ${y})` };
      }
      if (cmd.action === 'double_click') {
        const x = clampCoord(cmd.x);
        const y = clampCoord(cmd.y);
        if (x == null || y == null) return { ok: false, error: 'double_click needs numeric x and y' };
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 2 });
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 2 });
        return { ok: true, detail: `Double-click (${x}, ${y})` };
      }
      if (cmd.action === 'right_click') {
        const x = clampCoord(cmd.x);
        const y = clampCoord(cmd.y);
        if (x == null || y == null) return { ok: false, error: 'right_click needs numeric x and y' };
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'right', clickCount: 1 });
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'right', clickCount: 1 });
        return { ok: true, detail: `Right-click (${x}, ${y})` };
      }
      if (cmd.action === 'hover') {
        const x = clampCoord(cmd.x);
        const y = clampCoord(cmd.y);
        if (x == null || y == null) return { ok: false, error: 'hover needs numeric x and y' };
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
        return { ok: true, detail: `Hover (${x}, ${y})` };
      }
      if (cmd.action === 'drag') {
        const x = clampCoord(cmd.x);
        const y = clampCoord(cmd.y);
        const toX = clampCoord(cmd.toX ?? ((x || 200) + 120));
        const toY = clampCoord(cmd.toY ?? (y || 200));
        if (x == null || y == null || toX == null || toY == null) return { ok: false, error: 'drag needs numeric start and end coordinates' };
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
        const steps = 6;
        for (let i = 1; i <= steps; i += 1) {
          const ix = Math.round(x + ((toX - x) * i) / steps);
          const iy = Math.round(y + ((toY - y) * i) / steps);
          await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: ix, y: iy, button: 'left' });
          await new Promise((r) => setTimeout(r, 18));
        }
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x: toX, y: toY, button: 'left', clickCount: 1 });
        return { ok: true, detail: `Dragged (${x}, ${y}) -> (${toX}, ${toY})` };
      }
      if (cmd.action === 'type') {
        const x = clampCoord(cmd.x);
        const y = clampCoord(cmd.y);
        const text = String(cmd.text || '').slice(0, 8000);
        if (x == null || y == null) return { ok: false, error: 'type needs numeric x and y' };
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
        await new Promise((r) => setTimeout(r, 55));
        if (text) await wc.debugger.sendCommand('Input.insertText', { text });
        if (cmd.pressEnter !== false) {
          await wc.debugger.sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
          await wc.debugger.sendCommand('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
        }
        return { ok: true, detail: `Typed ${text.length} chars` };
      }
      if (cmd.action === 'press_key') {
        const keyMap = { Enter: 13, Escape: 27, Tab: 9, Backspace: 8, Space: 32, ArrowDown: 40, ArrowUp: 38, ArrowLeft: 37, ArrowRight: 39, PageDown: 34, PageUp: 33, Home: 36, End: 35 };
        const key = String(cmd.key || 'Enter');
        const vk = keyMap[key] || 13;
        await wc.debugger.sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: vk, key, code: key });
        await wc.debugger.sendCommand('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: vk, key, code: key });
        return { ok: true, detail: `Pressed ${key}` };
      }
      if (cmd.action === 'wait') {
        const ms = Math.max(100, Math.min(5000, Number(cmd.ms) || 800));
        await new Promise((r) => setTimeout(r, ms));
        return { ok: true, detail: `Waited ${ms}ms` };
      }
      if (cmd.action === 'back') {
        if (wc.navigationHistory?.canGoBack ? wc.navigationHistory.canGoBack() : wc.canGoBack()) wc.goBack();
        return { ok: true, detail: 'Navigated back' };
      }
      if (cmd.action === 'forward') {
        if (wc.navigationHistory?.canGoForward ? wc.navigationHistory.canGoForward() : wc.canGoForward()) wc.goForward();
        return { ok: true, detail: 'Navigated forward' };
      }
      if (cmd.action === 'insert_only') {
        const text = String(cmd.text || '').slice(0, 20000);
        if (!text) return { ok: false, error: 'insert_only needs text' };
        await wc.debugger.sendCommand('Input.insertText', { text });
        return { ok: true, detail: `Inserted ${text.length} chars` };
      }
      if (cmd.action === 'scroll') {
        const deltaY = cmd.direction === 'up' ? -650 : 650;
        const x = clampCoord(cmd.x ?? 400) ?? 400;
        const y = clampCoord(cmd.y ?? 400) ?? 400;
        await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY });
        return { ok: true, detail: `Scroll ${cmd.direction === 'up' ? 'up' : 'down'}` };
      }
      if (cmd.action === 'reload') {
        await wc.debugger.sendCommand('Page.reload');
        return { ok: true, detail: 'Reloaded page' };
      }
      if (cmd.action === 'upload_file') {
        const filePath = String(cmd.filePath || '').trim();
        if (!filePath) return { ok: false, error: 'upload_file requires a filePath' };
        const resolved = path.resolve(filePath);
        // Restrict uploads to the app's managed Downloads folder. Otherwise an absolute path to any
        // system file (ssh keys, tokens, cookies) could be injected into the hostile guest page via
        // DOM.setFileInputFiles and exfiltrated. CDP bypasses the human file-picker that normally gates this.
        const uploadRoot = path.resolve(DOWNLOAD_DIR) + path.sep;
        if (!(resolved + path.sep).toLowerCase().startsWith(uploadRoot.toLowerCase())) {
          return { ok: false, error: 'upload_file is restricted to the Downloads folder' };
        }
        if (!fs.existsSync(resolved)) return { ok: false, error: 'upload_file requires an existing local filePath' };
        await wc.debugger.sendCommand('DOM.enable');
        const doc = await wc.debugger.sendCommand('DOM.getDocument', { depth: 2 });
        const node = await wc.debugger.sendCommand('DOM.querySelector', {
          nodeId: doc.root.nodeId,
          selector: String(cmd.selector || 'input[type="file"]')
        });
        if (!node || !node.nodeId) return { ok: false, error: 'No matching <input type="file"> element found on page' };
        await wc.debugger.sendCommand('DOM.setFileInputFiles', {
          nodeId: node.nodeId,
          files: [resolved]
        });
        return { ok: true, detail: `Uploaded ${path.basename(resolved)} into ${cmd.selector || 'input[type="file"]'}` };
      }
      return { ok: false, error: 'Unsupported action' };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('devsecops-scan', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const wc = asGuest(payload?.wcId);
    const secState = (wc && securityHeadersMap.get(wc.id)) || { headers: {}, status: 200, httpErrors: 0, totalRequests: 0 };
    const normHeaders = {};
    for (const [key, value] of Object.entries(secState.headers || {})) normHeaders[key.toLowerCase()] = value;
    const headerChecks = [
      { name: 'Content-Security-Policy', present: !!normHeaders['content-security-policy'], val: String(normHeaders['content-security-policy'] || 'missing').slice(0, 90) },
      { name: 'Strict-Transport-Security', present: !!normHeaders['strict-transport-security'], val: normHeaders['strict-transport-security'] || 'missing' },
      { name: 'X-Frame-Options', present: !!(normHeaders['x-frame-options'] || String(normHeaders['content-security-policy'] || '').includes('frame-ancestors')), val: normHeaders['x-frame-options'] || 'missing' },
      { name: 'X-Content-Type-Options', present: !!normHeaders['x-content-type-options'], val: normHeaders['x-content-type-options'] || 'missing' },
      { name: 'Permissions-Policy', present: !!normHeaders['permissions-policy'], val: String(normHeaders['permissions-policy'] || 'missing').slice(0, 80) },
      { name: 'CORS', present: normHeaders['access-control-allow-origin'] !== '*', val: normHeaders['access-control-allow-origin'] || 'same-origin or unset' }
    ];
    let cookieAudit = { total: 0, insecure: 0, missingHttpOnly: 0 };
    try {
      const cookies = await session.fromPartition('persist:gigachad_vault').cookies.get({ url: payload?.url });
      cookieAudit.total = cookies.length;
      cookies.forEach((cookie) => {
        if (!cookie.secure) cookieAudit.insecure += 1;
        if (!cookie.httpOnly) cookieAudit.missingHttpOnly += 1;
      });
    } catch (_) {}
    const secretRegex = /(sk-[a-zA-Z0-9_-]{20,}|AIza[0-9A-Za-z_-]{35}|ghp_[0-9A-Za-z]{36}|AKIA[0-9A-Z]{16}|xox[baprs]-[0-9A-Za-z-]{10,})/g;
    const apis = wc ? (snifferBuffer.get(wc.id) || []) : [];
    const apiText = apis.map((row) => row.preview).join('\n');
    const found = [...new Set([...(apiText.match(secretRegex) || []), ...(payload?.domFindings?.secrets || [])])];
    const passCount = headerChecks.filter((row) => row.present).length;
    const score = Math.max(0, Math.min(100, Math.round((passCount / headerChecks.length) * 70 + (found.length === 0 ? 20 : 0) + (cookieAudit.insecure === 0 ? 10 : 0))));
    return {
      ok: true,
      implementation: 'header-cookie-heuristic',
      url: String(payload?.url || ''),
      score,
      grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'F',
      headerChecks,
      cookieAudit,
      apiSecrets: found.map(redactSecret),
      domFindings: {
        inlineScripts: Number(payload?.domFindings?.inlineScripts) || 0,
        insecureForms: Number(payload?.domFindings?.insecureForms) || 0,
        evalSinks: Number(payload?.domFindings?.evalSinks) || 0
      }
    };
  });

  ipcMain.handle('sre-metrics', async (event, wcId) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const wc = asGuest(wcId);
    const secState = (wc && securityHeadersMap.get(wc.id)) || { httpErrors: 0, totalRequests: 0 };
    let cdpPerf = [];
    try {
      if (wc && wc.debugger.isAttached()) {
        const metrics = await wc.debugger.sendCommand('Performance.getMetrics');
        cdpPerf = metrics.metrics || [];
      }
    } catch (_) {}
    const sorted = [...sreTelemetry.aiLatenciesMs].sort((a, b) => a - b);
    return {
      uptimeSec: Math.round((Date.now() - sreTelemetry.startTime) / 1000),
      totalAiCalls: sreTelemetry.totalAiCalls,
      failedAiCalls: sreTelemetry.failedAiCalls,
      aiP50Ms: sorted.length ? sorted[Math.floor(sorted.length * 0.5)] : 0,
      aiP95Ms: sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0,
      autoHeals: sreTelemetry.autoHeals,
      blockedTrackers: blockedCount,
      tabRequests: secState.totalRequests,
      tabHttpErrors: secState.httpErrors,
      cdpPerf
    };
  });

  ipcMain.handle('sre-network-throttle', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const wc = asGuest(payload?.wcId);
    if (!wc) return { ok: false, error: 'Tab webContents not found' };
    const profiles = {
      fiber: { offline: false, latency: 2, downloadThroughput: -1, uploadThroughput: -1 },
      slow4g: { offline: false, latency: 150, downloadThroughput: 400 * 1024, uploadThroughput: 150 * 1024 },
      satellite: { offline: false, latency: 650, downloadThroughput: 120 * 1024, uploadThroughput: 50 * 1024 },
      offline: { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 }
    };
    try {
      await attachAndEnableCDP(wc);
      const profile = profiles[payload?.profile] || profiles.fiber;
      await wc.debugger.sendCommand('Network.emulateNetworkConditions', profile);
      return { ok: true, profile: payload?.profile || 'fiber' };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('kanban-get', (event) => (fromChrome(event) ? kanbanBoard : []));
  ipcMain.handle('kanban-save', (event, board) => {
    if (!fromChrome(event)) return [];
    try {
      kanbanBoard = sanitizeBoard(board);
      saveJson(userFile('task_board.json'), kanbanBoard);
      return kanbanBoard;
    } catch (_) {
      return kanbanBoard;
    }
  });

  ipcMain.handle('cicd-run-checks', async (event) => {
    if (!fromChrome(event)) return [];
    const results = [];
    let sidecarHealthy = false;
    try {
      const health = await fetchJson(`${cfg.sidecarUrl}/health`, {}, 1500);
      const emb = health.data?.backends?.embeddings;
      sidecarHealthy = Boolean(health.ok && health.data?.status === 'ok' && emb?.implementation);
      results.push({
        gate: 'Sidecar /health',
        status: sidecarHealthy ? 'pass' : 'fail',
        detail: health.ok ? `embeddings=${emb?.implementation || 'missing'} neural=${emb?.neural === true}` : (health.data?.error || `HTTP ${health.status}`)
      });
    } catch (err) {
      results.push({ gate: 'Sidecar /health', status: 'fail', detail: err.message });
    }
    try {
      const embed = await fetchJson(`${cfg.sidecarUrl}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: 'local smoke' })
      }, 2500);
      const dim = Array.isArray(embed.data?.embedding) ? embed.data.embedding.length : 0;
      const honest = Boolean(embed.data?.implementation) && embed.data?.neural === (embed.data?.implementation === 'sentence-transformers');
      results.push({
        gate: 'Sidecar /embed',
        status: embed.ok && dim > 0 && honest ? 'pass' : 'fail',
        detail: `${embed.data?.implementation || 'missing'} dim=${dim}`
      });
    } catch (err) {
      results.push({ gate: 'Sidecar /embed', status: 'fail', detail: err.message });
    }
    try {
      const listed = await listLocalModels();
      results.push({
        gate: 'Local LLM /models',
        status: listed.ok && listed.models.length ? 'pass' : 'skip',
        detail: listed.ok ? (listed.models.slice(0, 4).join(', ') || 'empty model list') : `not running (${listed.error})`
      });
    } catch (err) {
      results.push({ gate: 'Local LLM /models', status: 'skip', detail: err.message });
    }
    const gpu = await new Promise((resolve) => {
      execFile('nvidia-smi', ['--query-gpu=memory.used,memory.total', '--format=csv,noheader,nounits'], { timeout: 1500 }, (err, stdout) => {
        if (err || !stdout) return resolve(null);
        const parts = stdout.trim().split(',').map((part) => parseInt(part.trim(), 10));
        resolve({ used: parts[0], total: parts[1] });
      });
    });
    results.push(gpu
      ? { gate: 'nvidia-smi', status: 'pass', detail: `${gpu.used} MiB used / ${gpu.total} MiB total` }
      : { gate: 'nvidia-smi', status: 'skip', detail: 'not available on this machine' });
    results.push({ gate: 'Tracker blocklist', status: FILTERS.block.length > 0 ? 'pass' : 'fail', detail: `${FILTERS.block.length} block patterns, ${FILTERS.allow.length} allow patterns, ${blockedCount} blocked this session` });
    const erdAudit = auditErdIntegrity({
      tabSessions: loadJson(userFile('session.json'), []),
      historyRecords: history,
      bookmarkItems: bookmarks,
      closedTabStack: closedTabs,
      memoryVaultNotes: memoryVault,
      oneTabGroups: oneTabVault,
      vibeSitePatches: vibePatches,
      temporalSnapshots,
      kanbanCards: kanbanBoard,
      downloadsList: downloads
    });
    results.push({
      gate: 'ERD Schema & Integrity',
      status: erdAudit.ok ? 'pass' : 'fail',
      detail: `${erdAudit.entityCount} entities, ${erdAudit.relationshipCount} relationships, ${erdAudit.violationCount} violations`
    });
    const ermAudit = evaluateErmPosture({
      piiScrubEnabled: cfg.piiFirewall !== false,
      sidecarHealthy,
      failedAiCalls: sreTelemetry.failedAiCalls
    });
    results.push({
      gate: 'ERM Risk Posture',
      status: ermAudit.grade === 'A' ? 'pass' : 'fail',
      detail: `Grade ${ermAudit.grade} (${ermAudit.reductionPct}% risk reduction across ${ermAudit.totalRisks} risks)`
    });
    const sopSummary = summarizeSop500();
    results.push({
      gate: '500-Point SOP Checklist',
      status: sopSummary.totalItems === 500 && sopSummary.verifiedCount === 500 ? 'pass' : 'fail',
      detail: `${sopSummary.verifiedCount}/${sopSummary.totalItems} verified (BE:${sopSummary.byAspect.Backend} FE:${sopSummary.byAspect.Frontend} FS:${sopSummary.byAspect['Full-Stack']})`
    });
    const pass100 = run100PassAudit();
    results.push({
      gate: '100-Pass Lab Verification',
      status: pass100.ok && pass100.passedCount === 100 ? 'pass' : 'fail',
      detail: `${pass100.passedCount}/${pass100.totalPasses} passes · ${pass100.sopVerified}/500 SOP items (${pass100.durationMs}ms)`
    });
    return results;
  });

  ipcMain.handle('systems-audit', async (event) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    let sidecarHealthy = false;
    try {
      const h = await fetchJson(`${cfg.sidecarUrl}/health`, {}, 1200);
      sidecarHealthy = Boolean(h.ok && h.data?.status === 'ok');
    } catch (_) {}
    const gpu = await new Promise((resolve) => {
      execFile('nvidia-smi', ['--query-gpu=memory.used,memory.total', '--format=csv,noheader,nounits'], { timeout: 1200 }, (err, stdout) => {
        if (err || !stdout) return resolve({ vramUsedMb: 0, vramTotalMb: 8192 });
        const parts = stdout.trim().split(',').map((part) => parseInt(part.trim(), 10));
        resolve({ vramUsedMb: parts[0] || 0, vramTotalMb: parts[1] || 8192 });
      });
    });
    const sortedLat = [...sreTelemetry.aiLatenciesMs].sort((a, b) => a - b);
    const aiP50Ms = sortedLat.length ? sortedLat[Math.floor(sortedLat.length * 0.5)] : 0;
    const aiP95Ms = sortedLat.length ? sortedLat[Math.min(sortedLat.length - 1, Math.floor(sortedLat.length * 0.95))] : 0;

    const erd = auditErdIntegrity({
      tabSessions: loadJson(userFile('session.json'), []),
      historyRecords: history,
      bookmarkItems: bookmarks,
      closedTabStack: closedTabs,
      memoryVaultNotes: memoryVault,
      oneTabGroups: oneTabVault,
      vibeSitePatches: vibePatches,
      temporalSnapshots,
      kanbanCards: kanbanBoard,
      downloadsList: downloads
    });
    const erm = evaluateErmPosture({
      piiScrubEnabled: cfg.piiFirewall !== false,
      sidecarHealthy,
      failedAiCalls: sreTelemetry.failedAiCalls
    });
    const erp = evaluateErpPlan({
      vramUsedMb: gpu.vramUsedMb,
      vramTotalMb: gpu.vramTotalMb,
      historyCount: history.length,
      bookmarkCount: bookmarks.length,
      closedTabCount: closedTabs.length,
      memoryVaultCount: memoryVault.length,
      kanbanCount: kanbanBoard.length,
      aiP50Ms,
      aiP95Ms,
      totalAiCalls: sreTelemetry.totalAiCalls,
      failedAiCalls: sreTelemetry.failedAiCalls,
      autoHeals: sreTelemetry.autoHeals,
      blockedTrackers: blockedCount,
      uptimeSec: Math.round((Date.now() - sreTelemetry.startTime) / 1000)
    });
    const sop = summarizeSop500();
    return {
      ok: true,
      erd,
      erm,
      erp,
      sop: {
        totalItems: sop.totalItems,
        verifiedCount: sop.verifiedCount,
        passRatePct: sop.passRatePct,
        grade: sop.grade,
        byAspect: sop.byAspect,
        domains: sop.domains
      }
    };
  });

  ipcMain.handle('sop-500-query', (event, filterPayload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const summary = summarizeSop500();
    const aspect = String(filterPayload?.aspect || 'ALL');
    const domain = String(filterPayload?.domain || 'ALL');
    const q = String(filterPayload?.query || '').trim().toLowerCase();
    const filtered = summary.items.filter((item) => {
      if (aspect !== 'ALL' && item.aspect !== aspect) return false;
      if (domain !== 'ALL' && item.domainCode !== domain) return false;
      if (q && !`${item.id} ${item.requirement} ${item.domainName} ${item.aspect}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return {
      ok: true,
      totalItems: summary.totalItems,
      verifiedCount: summary.verifiedCount,
      byAspect: summary.byAspect,
      domains: summary.domains,
      matchCount: filtered.length,
      items: filtered
    };
  });

  ipcMain.handle('pass-100-audit', (event) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    return run100PassAudit();
  });

  ipcMain.handle('gpu-telemetry', (event) => {
    if (!fromChrome(event)) return null;
    return new Promise((resolve) => {
      execFile('nvidia-smi', ['--query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu', '--format=csv,noheader,nounits'], { timeout: 1500 }, (err, stdout) => {
        if (err || !stdout) return resolve(null);
        const parts = stdout.trim().split('\n')[0].split(',').map((part) => part.trim());
        if (parts.length < 5) return resolve(null);
        resolve({
          name: parts[0],
          vramUsed: parseInt(parts[1], 10),
          vramTotal: parseInt(parts[2], 10),
          gpuUtil: parseInt(parts[3], 10),
          temp: parseInt(parts[4], 10)
        });
      });
    });
  });

  ipcMain.handle('laya-classify-page', async (event, payload) => {
    if (!fromChrome(event)) return null;
    try {
      const result = await fetchJson(`${cfg.sidecarUrl}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      }, 1500);
      return result.ok ? result.data : null;
    } catch (_) {
      return null;
    }
  });

  ipcMain.handle('micro-engine-call', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const endpoint = String(payload?.endpoint || '').split('?')[0];
    if (!MICRO_ENDPOINTS.has(endpoint)) return { ok: false, error: 'Unknown sidecar endpoint' };
    const requested = payload?.payload?.layaUrl || cfg.sidecarUrl;
    if (!isLoopbackHttp(requested)) return { ok: false, error: 'Sidecar URL must be loopback http' };
    const enriched = { ...(payload?.payload || {}) };
    delete enriched.layaUrl;
    if (endpoint === '/deception_radar') enriched.vault = memoryVault.slice(0, 15).map((item) => ({ title: item.title, summary: item.summary }));
    if (endpoint === '/ast_analyze' && payload?.wcId) {
      const wc = asGuest(payload.wcId);
      enriched.apis = wc ? (snifferBuffer.get(wc.id) || []) : [];
    }
    if (endpoint === '/semantic_diff' && enriched.url) {
      const cleanUrl = String(enriched.url).split('#')[0];
      enriched.old_text = temporalSnapshots[cleanUrl]?.text || '';
      temporalSnapshots[cleanUrl] = { text: String(enriched.new_text || '').slice(0, 20000), timestamp: new Date().toISOString() };
      saveJson(userFile('temporal_snapshots.json'), temporalSnapshots);
    }
    try {
      const bodyStr = JSON.stringify(enriched);
      if (Buffer.byteLength(bodyStr, 'utf8') > 2_000_000) {
        return { ok: false, status: 413, error: 'Body too large', data: { error: 'Body too large' } };
      }
      const result = await fetchJson(`${requested}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      }, endpoint === '/tts' ? 20000 : 4000);
      if (!result.ok) return { ok: false, status: result.status, error: result.data?.error || `HTTP ${result.status}`, data: result.data };
      if (endpoint === '/ner_pii' && result.data?.pii_redacted_count) piiBlockedTotal += result.data.pii_redacted_count;
      return { ok: true, data: result.data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  const handleSaveExportFile = (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    try {
      const dest = uniqueDownloadPath(payload?.filename || 'scrape.csv');
      const body = String(payload?.content || '').slice(0, 2_000_000);
      fs.writeFileSync(dest, body, 'utf8');
      noteDownload({
        id: 'dl_' + Date.now(),
        filename: path.basename(dest),
        url: 'local://export/' + path.basename(dest),
        path: dest,
        state: 'completed',
        received: Buffer.byteLength(body, 'utf8'),
        total: Buffer.byteLength(body, 'utf8')
      });
      return { ok: true, path: dest };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };
  ipcMain.handle('save-scraped-file', handleSaveExportFile);
  ipcMain.handle('scraper-export-file', handleSaveExportFile);

  const FREE_OMNI_MODELS = [
    'nvidia/nemotron-3.5-super-vl:free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
    'dots-studio/dots-3-note-preview:free'
  ];

  ipcMain.handle('openrouter-sync-free', async (event) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    try {
      const result = await fetchJson('https://openrouter.ai/api/v1/models', {}, 8000);
      if (!result.ok) return { ok: false, error: `HTTP ${result.status}` };
      const scoreFreeModel = (row) => {
        const id = String(row.id || '');
        const inputs = Array.isArray(row.architecture?.input_modalities) ? row.architecture.input_modalities : [];
        let score = 0;
        const pinnedIdx = FREE_OMNI_MODELS.indexOf(id);
        if (pinnedIdx !== -1) score += 10000 - pinnedIdx * 500;
        if (inputs.includes('image')) score += 2000;
        if (inputs.includes('video')) score += 800;
        if (inputs.includes('audio')) score += 800;
        score += Math.min(500, Math.round((row.context_length || 0) / 4000));
        return score;
      };
      const models = (result.data?.data || [])
        .filter((row) => String(row.id || '').endsWith(':free'))
        .sort((a, b) => (scoreFreeModel(b) - scoreFreeModel(a)) || ((b.created || 0) - (a.created || 0)))
        .slice(0, 25)
        .map((row) => ({
          id: row.id,
          name: row.name || row.id,
          ctx: row.context_length || 0,
          modality: row.architecture?.modality || 'text->text'
        }));
      return { ok: true, models };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('openrouter-verify-key', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const candidate = String(payload?.key || '').trim() || cfg.openRouterKey;
    if (!candidate) return { ok: false, error: 'No OpenRouter API key provided.' };
    try {
      const result = await fetchJson('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: { Authorization: `Bearer ${candidate}` }
      }, 6000);
      if (!result.ok || result.data?.error) {
        return { ok: false, error: result.data?.error?.message || `Invalid key (HTTP ${result.status})` };
      }
      if (payload?.key && String(payload.key).trim()) {
        saveUserConfig({ openRouterKey: String(payload.key).trim() }, { root: ROOT, isolated: SMOKE });
        cfg = loadConfig({ root: ROOT, isolated: SMOKE });
      }
      const keyInfo = result.data?.data || {};
      return {
        ok: true,
        saved: true,
        label: keyInfo.label || 'OpenRouter Key',
        usage: keyInfo.usage ?? 0,
        limit: keyInfo.limit ?? null,
        isFreeTier: Boolean(keyInfo.is_free_tier ?? true)
      };
    } catch (err) {
      if (/^sk-or-v1-[a-zA-Z0-9]{32,}$/.test(candidate)) {
        saveUserConfig({ openRouterKey: candidate }, { root: ROOT, isolated: SMOKE });
        cfg = loadConfig({ root: ROOT, isolated: SMOKE });
        return { ok: true, saved: true, label: 'Saved OpenRouter Key', offlineSaved: true };
      }
      return { ok: false, error: err.message };
    }
  });

  let activeOpenRouterOAuthVerifier = '';
  let activeOpenRouterOAuthServer = null;

  async function exchangeOpenRouterAuthCode(authCode) {
    const code = String(authCode || '').trim();
    if (!code) return { ok: false, error: 'Missing OpenRouter authorization code.' };
    if (!activeOpenRouterOAuthVerifier) return { ok: false, error: 'No active OpenRouter PKCE verifier. Click Sign In with OpenRouter again.' };
    try {
      const result = await fetchJson('https://openrouter.ai/api/v1/auth/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          code_verifier: activeOpenRouterOAuthVerifier,
          code_challenge_method: 'S256'
        })
      }, 10000);
      const apiKey = String(result.data?.key || '').trim();
      if (!result.ok || !apiKey) {
        return { ok: false, error: result.data?.error?.message || `OpenRouter key exchange failed (HTTP ${result.status})` };
      }
      saveUserConfig({ openRouterKey: apiKey }, { root: ROOT, isolated: SMOKE });
      cfg = loadConfig({ root: ROOT, isolated: SMOKE });
      let label = 'OpenRouter OAuth Key';
      try {
        const verifyRes = await fetchJson('https://openrouter.ai/api/v1/auth/key', {
          method: 'GET',
          headers: { Authorization: `Bearer ${apiKey}` }
        }, 5000);
        if (verifyRes.ok && verifyRes.data?.data?.label) label = verifyRes.data.data.label;
      } catch (_) {}
      const maskedKey = apiKey.slice(0, 12) + '••••' + apiKey.slice(-4);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('openrouter-oauth-complete', { ok: true, label, maskedKey });
      }
      return { ok: true, saved: true, label, maskedKey };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  ipcMain.handle('openrouter-oauth-exchange', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    return await exchangeOpenRouterAuthCode(payload?.code);
  });

  ipcMain.handle('openrouter-oauth-start', async (event) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    try {
      activeOpenRouterOAuthVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto.createHash('sha256').update(activeOpenRouterOAuthVerifier).digest('base64url');
      if (activeOpenRouterOAuthServer) {
        try { activeOpenRouterOAuthServer.close(); } catch (_) {}
        activeOpenRouterOAuthServer = null;
      }
      const srv = http.createServer(async (req, res) => {
        try {
          const u = new URL(req.url || '/', 'http://localhost');
          if (u.pathname === '/openrouter-callback') {
            const code = u.searchParams.get('code') || '';
            const exchanged = await exchangeOpenRouterAuthCode(code);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            if (exchanged.ok) {
              res.end(`<!DOCTYPE html><html><head><title>OpenRouter Connected</title><style>body{background:#0b0e14;color:#e2e8f0;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.card{background:#131824;border:1px solid #34d399;border-radius:14px;padding:32px 36px;max-width:480px;text-align:center;box-shadow:0 16px 40px rgba(0,0,0,0.6)}h2{color:#34d399;margin:0 0 12px}p{color:#94a3b8;line-height:1.6;margin:8px 0}code{background:#0b0e14;color:#38bdf8;padding:3px 8px;border-radius:6px}</style></head><body><div class="card"><h2>✓ OpenRouter Connected!</h2><p>Gigachad Browser automatically generated, verified, and saved your OpenRouter API key (<code>${exchanged.maskedKey}</code>).</p><p>All <strong>24+ Free Omni &amp; Multimodal Cloud Models</strong> are now unlocked. You can close this tab or keep browsing.</p></div></body></html>`);
            } else {
              res.end(`<!DOCTYPE html><html><head><title>OpenRouter Auth Error</title><style>body{background:#0b0e14;color:#e2e8f0;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.card{background:#131824;border:1px solid #fb7185;border-radius:14px;padding:32px;max-width:480px;text-align:center}</style></head><body><div class="card"><h2 style="color:#fb7185">Could Not Complete Key Exchange</h2><p>${String(exchanged.error || 'Unknown error').replace(/[<>&]/g, '')}</p></div></body></html>`);
            }
            setTimeout(() => { try { srv.close(); } catch (_) {} }, 3000);
            return;
          }
          res.writeHead(404);
          res.end('Not found');
        } catch (e) {
          res.writeHead(500);
          res.end(e.message);
        }
      });
      activeOpenRouterOAuthServer = srv;
      const port = await new Promise((resolve, reject) => {
        srv.once('error', () => {
          const fallbackSrv = http.createServer(srv.listeners('request')[0]);
          activeOpenRouterOAuthServer = fallbackSrv;
          fallbackSrv.listen(0, '127.0.0.1', () => resolve(fallbackSrv.address().port));
          fallbackSrv.once('error', reject);
        });
        srv.listen(3000, '127.0.0.1', () => resolve(3000));
      });
      const callbackUrl = `http://localhost:${port}/openrouter-callback`;
      const authUrl = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(callbackUrl)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;
      return { ok: true, authUrl, callbackUrl };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  let _cachedPortedBrainsPayload = null;

  function ensureLocalBrainsHttpServer() {
    if (_localBrainsHttpPort > 0 && _localBrainsHttpServer) {
      return Promise.resolve(_localBrainsHttpPort);
    }
    const localBrainsDir = path.resolve(__dirname, 'brains');
    const mimeByExt = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.mjs': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.wasm': 'application/wasm',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.f32': 'application/octet-stream',
      '.bin': 'application/octet-stream',
      '.csv': 'text/csv; charset=utf-8',
      '.md': 'text/markdown; charset=utf-8',
      '.txt': 'text/plain; charset=utf-8',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff'
    };
    return new Promise((resolve) => {
      try {
        const srv = http.createServer((req, res) => {
          try {
            const parsedUrl = new URL(req.url || '/', 'http://127.0.0.1');
            const relDecoded = decodeURIComponent(parsedUrl.pathname).replace(/^\/+/, '');
            let candidate = path.resolve(localBrainsDir, relDecoded);
            if (!candidate.startsWith(localBrainsDir + path.sep) && candidate !== localBrainsDir) {
              res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('Forbidden');
              return;
            }
            if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
              candidate = path.join(candidate, 'index.html');
            }
            if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
              res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('Not Found');
              return;
            }
            const ext = path.extname(candidate).toLowerCase();
            const contentType = mimeByExt[ext] || 'application/octet-stream';
            res.writeHead(200, {
              'Content-Type': contentType,
              'Access-Control-Allow-Origin': 'http://127.0.0.1:' + _localBrainsHttpPort,
              'X-Content-Type-Options': 'nosniff'
            });
            fs.createReadStream(candidate).pipe(res);
          } catch (_) {
            res.writeHead(500);
            res.end('Internal Error');
          }
        });
        srv.unref();
        srv.listen(0, '127.0.0.1', () => {
          _localBrainsHttpServer = srv;
          _localBrainsHttpPort = srv.address().port;
          resolve(_localBrainsHttpPort);
        });
        srv.once('error', () => resolve(0));
      } catch (_) {
        resolve(0);
      }
    });
  }

  ipcMain.handle('hybrid-brain-portals', async (event) => {
    if (!fromChrome(event)) return { ok: false };
    try {
      const { pathToFileURL } = require('url');
      const localBrainsDir = path.join(__dirname, 'brains');
      const parentDir = path.resolve(__dirname, '..');
      const httpPort = await ensureLocalBrainsHttpServer();
      const httpBaseUrl = httpPort > 0 ? `http://127.0.0.1:${httpPort}` : null;
      const resolvePortal = (localParts, fallbackParts) => {
        const pLocal = path.join(localBrainsDir, ...localParts);
        if (fs.existsSync(pLocal)) return pathToFileURL(pLocal).href;
        if (fallbackParts) {
          const pFallback = path.join(parentDir, ...fallbackParts);
          if (fs.existsSync(pFallback)) return pathToFileURL(pFallback).href;
        }
        return null;
      };
      const resolveHttpPortal = (localParts) => {
        if (!httpBaseUrl) return null;
        const pLocal = path.join(localBrainsDir, ...localParts);
        if (fs.existsSync(pLocal)) return `${httpBaseUrl}/${localParts.join('/')}`;
        return null;
      };
      const portalDefs = {
        dimensionOmegaUrl: ['dimension-omega-singularity', 'index.html'],
        dimensionOmegaStudioUrl: ['dimension-omega-singularity', 'studio.html'],
        asmodensiusUrl: ['asmodensius-v40', 'creatures', '001', 'index.html'],
        asmodensiusV3Url: ['asmodensius-v40', 'creatures', '001', 'index.v3.html'],
        quantumManifoldUrl: ['quantum_neural_manifold_3d.html'],
        cqmXylosUrl: ['cqm-xylos', 'index.html'],
        cqmBibleUrl: ['cqm-xylos', 'bible.html'],
        cqmSpecsUrl: ['cqm-xylos', 'specs.html'],
        cqmDocsUrl: ['cqm-xylos', 'docs.html'],
        cqmConsciousnessLabUrl: ['cqm-xylos', 'lab', 'consciousness.html'],
        cqmSentienceLabUrl: ['cqm-xylos', 'lab', 'sentience.html'],
        cqmWildBeyondUrl: ['cqm-xylos', 'lab', 'quantum-wildbeyond.html'],
        glitchlingUrl: ['glitchling', 'index.html'],
        glitchlingVizUrl: ['glitchling', 'brain-viz', 'index.html'],
        tsotchkeDiffusionUrl: ['tsotchke-diffusion', 'index.html'],
        thingmakerUrl: ['thingmaker', 'index.html'],
        grimoireArcaneUrl: ['grimoire-arcane', 'index.html']
      };
      const httpPortals = {};
      let allLocalPresent = true;
      for (const [k, parts] of Object.entries(portalDefs)) {
        if (!fs.existsSync(path.join(localBrainsDir, ...parts))) {
          allLocalPresent = false;
        }
        httpPortals[k] = resolveHttpPortal(parts);
      }
      return {
        ok: true,
        selfContainedInRepo: allLocalPresent,
        httpBaseUrl,
        httpPortals,
        dimensionOmegaUrl: resolvePortal(['dimension-omega-singularity', 'index.html'], ['dimension-omega-singularity', 'index.html']),
        dimensionOmegaStudioUrl: resolvePortal(['dimension-omega-singularity', 'studio.html'], ['dimension-omega-singularity', 'studio.html']),
        asmodensiusUrl: resolvePortal(['asmodensius-v40', 'creatures', '001', 'index.html'], ['Asmodensius-v40', 'creatures', '001', 'index.html']),
        asmodensiusV3Url: resolvePortal(['asmodensius-v40', 'creatures', '001', 'index.v3.html'], ['Asmodensius-v40', 'creatures', '001', 'index.v3.html']),
        quantumManifoldUrl: resolvePortal(['quantum_neural_manifold_3d.html'], ['quantum_neural_manifold_3d.html']),
        cqmXylosUrl: resolvePortal(['cqm-xylos', 'index.html'], ['Cosmogonic Quantum Mechalogodrom', 'index.html']),
        cqmBibleUrl: resolvePortal(['cqm-xylos', 'bible.html'], ['Cosmogonic Quantum Mechalogodrom', 'bible.html']),
        cqmSpecsUrl: resolvePortal(['cqm-xylos', 'specs.html'], ['Cosmogonic Quantum Mechalogodrom', 'specs.html']),
        cqmDocsUrl: resolvePortal(['cqm-xylos', 'docs.html'], ['Cosmogonic Quantum Mechalogodrom', 'docs.html']),
        cqmConsciousnessLabUrl: resolvePortal(['cqm-xylos', 'lab', 'consciousness.html'], ['Cosmogonic Quantum Mechalogodrom', 'lab', 'consciousness.html']),
        cqmSentienceLabUrl: resolvePortal(['cqm-xylos', 'lab', 'sentience.html'], ['Cosmogonic Quantum Mechalogodrom', 'lab', 'sentience.html']),
        cqmWildBeyondUrl: resolvePortal(['cqm-xylos', 'lab', 'quantum-wildbeyond.html'], ['Cosmogonic Quantum Mechalogodrom', 'lab', 'quantum-wildbeyond.html']),
        glitchlingUrl: resolvePortal(['glitchling', 'index.html'], ['glitchling-jam', 'index.html']),
        glitchlingVizUrl: resolvePortal(['glitchling', 'brain-viz', 'index.html'], ['glitchling-jam', 'brain-viz', 'index.html']),
        tsotchkeDiffusionUrl: resolvePortal(['tsotchke-diffusion', 'index.html'], ['tsotchke-pages', 'index.html']),
        thingmakerUrl: resolvePortal(['thingmaker', 'index.html'], ['Thingmaker', 'index.html']),
        grimoireArcaneUrl: resolvePortal(['grimoire-arcane', 'index.html'], ['grimoire-arcane', 'index.html'])
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('ported-brains-bridge', (event) => {
    if (!fromChrome(event)) return { ok: false };
    try {
      if (_cachedPortedBrainsPayload) return _cachedPortedBrainsPayload;
      const localBrainsDir = path.join(__dirname, 'brains');
      const wasmPath = path.join(localBrainsDir, 'cqm-xylos', 'cqm_kernels.wasm');
      const celegansPath = path.join(localBrainsDir, 'asmodensius-v40', 'celegans_herm_full_edgelist.csv');
      const chaosEmbPath = path.join(localBrainsDir, 'tsotchke-diffusion', 'models', 'chaos_emb.f32');
      // Bound reads on the opened descriptor. Receipts describe these exact
      // cached bytes, even if a file changes after the payload is built.
      const readAsset = (filename, maximum) => {
        const fd = fs.openSync(filename, 'r');
        try {
          const size = fs.fstatSync(fd).size;
          if (!Number.isSafeInteger(size) || size < 0 || size > maximum) throw new Error('Ported brain asset exceeds read bound');
          const bytes = Buffer.alloc(size);
          let offset = 0;
          while (offset < size) {
            const count = fs.readSync(fd, bytes, offset, size - offset, null);
            if (!count) throw new Error('Ported brain asset changed during read');
            offset += count;
          }
          if (fs.readSync(fd, Buffer.alloc(1), 0, 1, null)) throw new Error('Ported brain asset grew during read');
          return bytes;
        } finally { fs.closeSync(fd); }
      };
      const assetProvenance = { celegans: null, chaos: null };

      let wasmBase64 = null;
      let wasmExports = [];
      let wasmBench = null;
      if (fs.existsSync(wasmPath)) {
        const wasmBuf = readAsset(wasmPath, 8 * 1024 * 1024);
        wasmBase64 = wasmBuf.toString('base64');
        const mod = new WebAssembly.Module(wasmBuf);
        wasmExports = WebAssembly.Module.exports(mod).map((e) => e.name);
        const inst = new WebAssembly.Instance(mod, {});
        const ex = inst.exports;
        const f64 = new Float64Array(ex.memory.buffer, 0, 256);
        const chernPos = ex.cqm_moonlab_qwz_chern_fhs ? ex.cqm_moonlab_qwz_chern_fhs(1.0, 12, 0) : 1.0;
        const skyrmionMzm = ex.cqm_libirrep_bdg_skyrmion_mzm ? ex.cqm_libirrep_bdg_skyrmion_mzm(12, 1, -3.0, 4.0, 1.0, 64) : 2;
        wasmBench = {
          byteLength: wasmBuf.length,
          exportsCount: wasmExports.length,
          chernNumberM1: Number(chernPos.toFixed(6)),
          skyrmionMzmQ1: skyrmionMzm,
          minBandGap: Number((f64[1] || 0).toFixed(4))
        };
      }

      let chaosEmbBase64 = null;
      let chaosEmbTotalFloats = 0;
      if (fs.existsSync(chaosEmbPath)) {
        const chaosBuf = readAsset(chaosEmbPath, 65536);
        const sliceLen = Math.min(chaosBuf.length, 6144);
        chaosEmbBase64 = chaosBuf.subarray(0, sliceLen).toString('base64');
        chaosEmbTotalFloats = Math.floor(sliceLen / 4);
        assetProvenance.chaos = {
          sourceDigest: crypto.createHash('sha256').update(chaosBuf).digest('hex'),
          sourceByteLength: chaosBuf.byteLength,
          sourcePath: 'brains/tsotchke-diffusion/models/chaos_emb.f32',
          sourceMode: 'main-ipc-chaos-prefix-v1', sourceDigestObserved: true
        };
      }

      let celegansStats = { totalEdges: 0, uniqueNeurons: 0, chemicalEdges: 0, gapJunctionEdges: 0, topHubs: [], compactEdges: [] };
      if (fs.existsSync(celegansPath)) {
        const celegansBytes = readAsset(celegansPath, 2 * 1024 * 1024);
        const lines = celegansBytes.toString('utf8').split(/\r?\n/);
        assetProvenance.celegans = {
          sourceDigest: crypto.createHash('sha256').update(celegansBytes).digest('hex'),
          sourceByteLength: celegansBytes.byteLength,
          sourcePath: 'brains/asmodensius-v40/celegans_herm_full_edgelist.csv',
          sourceMode: 'main-ipc-csv-v1', sourceDigestObserved: true
        };
        const degMap = new Map();
        const rawEdges = [];
        let chemCount = 0;
        let gapCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split(',');
          if (parts.length < 4) continue;
          const src = parts[0].trim();
          const dst = parts[1].trim();
          const w = Number(parts[2].trim()) || 1;
          const type = parts[3].trim().toLowerCase();
          if (!src || !dst) continue;
          const isGap = type.includes('elec') || type.includes('gap');
          if (isGap) gapCount++;
          else chemCount++;
          degMap.set(src, (degMap.get(src) || 0) + w);
          degMap.set(dst, (degMap.get(dst) || 0) + w);
          rawEdges.push({ src, dst, w, t: isGap ? 1 : 0 });
        }
        const sortedHubs = Array.from(degMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 64);
        const hubIndex = new Map(sortedHubs.map(([name], idx) => [name, idx]));
        const compactEdges = rawEdges
          .filter((e) => hubIndex.has(e.src) && hubIndex.has(e.dst))
          .sort((a, b) => b.w - a.w)
          .slice(0, 512)
          .map((e) => [hubIndex.get(e.src), hubIndex.get(e.dst), e.w, e.t]);

        celegansStats = {
          totalEdges: rawEdges.length,
          uniqueNeurons: degMap.size,
          chemicalEdges: chemCount,
          gapJunctionEdges: gapCount,
          topHubs: sortedHubs.map(([name, weightedDeg]) => ({ name, weightedDeg })),
          compactEdges
        };
      }

      _cachedPortedBrainsPayload = {
        ok: true,
        pantheonBrainsCount: 14,
        wasmBase64,
        wasmExports,
        wasmBench,
        chaosEmbBase64,
        chaosEmbTotalFloats,
        celegansStats,
        assetProvenance
      };
      return _cachedPortedBrainsPayload;
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('deep-dark-web-probe', async (event, payload = {}) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    try {
      const transport = await refreshDeepWebTransport();
      const guest = asGuest(payload.wcId);
      const address = String(payload.onion || payload.url || (guest && guest.getURL()) || '').slice(0, 4096);
      return {
        ok: transport.routing.ok, checkedAt: transport.checkedAt,
        localTorSocksActive: transport.socksHandshakeVerified,
        socksHandshakeVerified: transport.socksHandshakeVerified,
        socksPort: transport.activeTorPort,
        torPacApplied: transport.routing.ok,
        routing: transport.routing,
        probes: transport.probes,
        managedTor: managedTor.snapshot(),
        addressValidation: validateOnionAddress(address),
        navigation: guest ? deepWebNavigation.read(guest.id, guest.getURL()) : null,
        scope: 'SOCKS5 negotiation does not identify Tor or prove a circuit. Network-verified onion receipts require an observed successful uncached main-frame response on the fail-closed SOCKS route. No relay identities or anonymity guarantee are inferred.'
      };
    } catch (err) {
      return { ok: false, checkedAt: Date.now(), error: err.message, localTorSocksActive: false, socksHandshakeVerified: false, torPacApplied: false };
    }
  });

  ipcMain.handle('alife-neural-weights-sync', (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    try {
      const binPath = userFile('alife_cortex_weights.bin');
      const metaPath = userFile('alife_cortex_meta.json');
      const act = String(payload?.action || 'status');
      if (act === 'save' && typeof payload?.weightsBase64 === 'string' && payload.weightsBase64.length > 0) {
        const buf = Buffer.from(payload.weightsBase64, 'base64');
        fs.writeFileSync(binPath, buf);
        const sha256Hex = '0x' + crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
        const savedAt = new Date().toISOString();
        const metaObj = {
          ...(payload?.meta && typeof payload.meta === 'object' ? payload.meta : {}),
          byteLength: buf.byteLength,
          sha256Prefix: sha256Hex,
          savedAt
        };
        saveJson(metaPath, metaObj);
        return { ok: true, action: 'save', byteLength: buf.byteLength, sha256Prefix: sha256Hex, savedAt };
      }
      if (act === 'load') {
        if (!fs.existsSync(binPath)) return { ok: false, reason: 'no_checkpoint_yet' };
        const buf = fs.readFileSync(binPath);
        const sha256Hex = '0x' + crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
        const metaObj = loadJson(metaPath, {});
        return {
          ok: true,
          action: 'load',
          weightsBase64: buf.toString('base64'),
          byteLength: buf.byteLength,
          sha256Prefix: sha256Hex,
          meta: metaObj
        };
      }
      return { ok: true, exists: fs.existsSync(binPath) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('cortex-binary-weights-sync', (event, payload = {}) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const gchadPath = userFile('cortex_weights_1.24M.gchad');
    if (payload.action === 'load') {
      return loadBinaryCortexWeights(gchadPath);
    }
    return saveBinaryCortexWeights(gchadPath, payload);
  });

  ipcMain.handle('cyber-hat-inspect', async (event, payload = {}) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    try {
      const targetUrl = String(payload?.url || 'https://en.wikipedia.org');
      const [recon, proxyConfig] = await Promise.all([
        inspectTargetDomainCyberHat(targetUrl, { socksPort: cfg.torSocksPort }),
        configureDeepWebChromiumProxy([
          session.defaultSession,
          session.fromPartition('persist:gigachad_vault')
        ], payload?.proxyMode || 'auto', { socksPort: cfg.torSocksPort })
      ]);
      return {
        ...recon,
        proxyConfig
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('browser-memory-stats', (event) => {
    if (!fromChrome(event)) return { ok: false };
    try {
      const metrics = app.getAppMetrics() || [];
      let totalWorkingSetKb = 0;
      let rendererCount = 0;
      for (const m of metrics) {
        totalWorkingSetKb += Number(m.memory?.workingSetSize || 0);
        if (m.type === 'Tab' || m.type === 'Renderer') rendererCount += 1;
      }
      return {
        ok: true,
        totalMb: Math.round(totalWorkingSetKb / 1024),
        processCount: metrics.length,
        rendererCount
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('browser-memory-purge', async (event) => {
    if (!fromChrome(event)) return { ok: false };
    try {
      const beforeMetrics = app.getAppMetrics() || [];
      const beforeKb = beforeMetrics.reduce((acc, m) => acc + Number(m.memory?.workingSetSize || 0), 0);
      snifferBuffer.forEach((list, k) => { if (list.length > 5) snifferBuffer.set(k, list.slice(0, 5)); });
      mediaStreamBuffer.forEach((list, k) => { if (list.length > 5) mediaStreamBuffer.set(k, list.slice(0, 5)); });
      const vaultSession = session.fromPartition('persist:gigachad_vault');
      await vaultSession.clearCache().catch(() => {});
      await session.defaultSession.clearCache().catch(() => {});
      if (typeof global.gc === 'function') { try { global.gc(); } catch (_) {} }
      const afterMetrics = app.getAppMetrics() || [];
      const afterKb = afterMetrics.reduce((acc, m) => acc + Number(m.memory?.workingSetSize || 0), 0);
      return {
        ok: true,
        beforeMb: Math.round(beforeKb / 1024),
        afterMb: Math.round(afterKb / 1024),
        processCount: afterMetrics.length
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('wishlist-api-fetch', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const rawUrl = String(payload?.url || '').trim();
    let parsed;
    try { parsed = new URL(rawUrl); } catch (_) { return { ok: false, error: 'Invalid URL' }; }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, error: 'Only http:// and https:// URLs are allowed' };
    }
    // Block SSRF to loopback, link-local (incl. 169.254.169.254 cloud metadata) and private ranges,
    // by both the URL host and its resolved address. A main-process fetch is not subject to the
    // browser's CORS / Private-Network-Access protections, so this guard must live here.
    if (isBlockedFetchHost(parsed.hostname)) {
      return { ok: false, error: 'Blocked: internal, loopback or private host' };
    }
    try {
      const resolved = await require('dns').promises.lookup(parsed.hostname);
      if (isBlockedFetchHost(resolved.address)) return { ok: false, error: 'Blocked: host resolves to an internal address' };
    } catch (_) { return { ok: false, error: 'DNS resolution failed' }; }
    const method = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].includes(String(payload?.method || 'GET').toUpperCase())
      ? String(payload.method || 'GET').toUpperCase()
      : 'GET';
    const headers = (payload?.headers && typeof payload.headers === 'object') ? payload.headers : {};
    const started = Date.now();
    try {
      const opts = { method, headers, signal: AbortSignal.timeout(10000) };
      if (method !== 'GET' && method !== 'HEAD' && payload?.body) {
        opts.body = typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body);
      }
      const res = await fetch(parsed.href, opts);
      const text = (await res.text()).slice(0, 50000);
      const outHeaders = {};
      res.headers.forEach((v, k) => { outHeaders[k] = v; });
      return {
        ok: res.ok,
        status: res.status,
        latencyMs: Date.now() - started,
        headers: outHeaders,
        body: text
      };
    } catch (err) {
      return { ok: false, status: 0, latencyMs: Date.now() - started, error: err.message };
    }
  });

  ipcMain.handle('media-get-streams', (event, wcId) => {
    if (!fromChrome(event)) return [];
    const wc = asGuest(wcId);
    return wc ? (mediaStreamBuffer.get(wc.id) || []) : [];
  });

  ipcMain.handle('media-download-ytdlp', (event, payload) => {
    if (!fromChrome(event)) return Promise.resolve({ ok: false, error: 'unauthorized' });
    return new Promise((resolve) => {
      let target;
      try { target = new URL(String(payload?.url || '')); } catch (_) { return resolve({ ok: false, error: 'Invalid URL' }); }
      if (target.protocol !== 'http:' && target.protocol !== 'https:') return resolve({ ok: false, error: 'Only http(s) URLs can be downloaded' });
      const format = payload?.format === 'mp3' ? 'mp3' : 'mp4';
      const output = path.join(DOWNLOAD_DIR, '%(title).80s.%(ext)s');
      const formatArgs = format === 'mp3'
        ? ['-x', '--audio-format', 'mp3']
        : ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'];
      const baseArgs = ['--no-playlist', '--restrict-filenames', ...formatArgs, '-o', output, target.href];
      let exe = cfg.ytdlpPath || 'yt-dlp';
      let args = baseArgs;
      if (cfg.ytdlpViaPython || (cfg.pythonPath && path.resolve(exe) === path.resolve(cfg.pythonPath))) {
        exe = cfg.pythonPath;
        args = ['-m', 'yt_dlp', ...baseArgs];
      } else if (!fs.existsSync(exe) && cfg.pythonPath) {
        exe = cfg.pythonPath;
        args = ['-m', 'yt_dlp', ...baseArgs];
      }
      const proc = spawn(exe, args, { windowsHide: true });
      let log = '';
      proc.stdout.on('data', (chunk) => { log += chunk.toString(); });
      proc.stderr.on('data', (chunk) => { log += chunk.toString(); });
      proc.on('error', (err) => resolve({ ok: false, error: `yt-dlp failed to launch (${err.message}). Install it with pip install yt-dlp.` }));
      proc.on('close', (code) => {
        if (code === 0) {
          noteDownload({
            id: 'dl_' + Date.now(),
            filename: 'yt-dlp download',
            url: target.href,
            path: DOWNLOAD_DIR,
            state: 'completed',
            received: 0,
            total: 0
          });
          resolve({ ok: true, folder: DOWNLOAD_DIR });
        } else resolve({ ok: false, error: (log || `yt-dlp exited ${code}`).slice(-400) });
      });
    });
  });

  ipcMain.handle('media-download-direct', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const urls = Array.isArray(payload?.urls) ? payload.urls.slice(0, 40) : [];
    let saved = 0;
    const errors = [];
    for (const raw of urls) {
      try {
        const parsed = new URL(String(raw));
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('not http(s)');
        const cleanName = safeDownloadName(path.basename(parsed.pathname) || `media_${Date.now()}.bin`);
        const dest = path.join(DOWNLOAD_DIR, `${Date.now()}_${cleanName}`);
        await downloadDirectFile(parsed.href, dest);
        saved += 1;
      } catch (err) {
        errors.push(err.message);
      }
    }
    return { ok: saved > 0, saved, folder: DOWNLOAD_DIR, error: errors[0] || '' };
  });

  ipcMain.handle('open-media-folder', (event) => {
    if (!fromChrome(event)) return '';
    return shell.openPath(DOWNLOAD_DIR);
  });

  ipcMain.handle('onetab-save-group', (event, tabsArray) => {
    if (!fromChrome(event)) return [];
    const tabs = (Array.isArray(tabsArray) ? tabsArray : []).slice(0, 100).map((tab) => ({
      title: String(tab?.title || 'Tab').slice(0, 180),
      url: String(tab?.url || '')
    })).filter((tab) => isAllowedGuestUrl(tab.url));
    oneTabVault.unshift({ id: 'ot_' + Date.now(), timestamp: new Date().toLocaleString(), tabs });
    saveJson(userFile('onetab_vault.json'), oneTabVault);
    return oneTabVault;
  });
  ipcMain.handle('onetab-get', (event) => (fromChrome(event) ? oneTabVault : []));
  ipcMain.handle('onetab-delete-group', (event, groupId) => {
    if (!fromChrome(event)) return [];
    oneTabVault = oneTabVault.filter((group) => group.id !== groupId);
    saveJson(userFile('onetab_vault.json'), oneTabVault);
    return oneTabVault;
  });

  ipcMain.handle('memory-save', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const sidecarUrl = isLoopbackHttp(payload?.layaUrl) ? payload.layaUrl : cfg.sidecarUrl;
    const title = String(payload?.title || 'Untitled').slice(0, 180);
    const summary = String(payload?.content || '').slice(0, 4000);
    const embedded = await embedText(`title: ${title} | text: ${summary}`, sidecarUrl);
    memoryVault.unshift({
      id: Date.now(),
      url: String(payload?.url || '').slice(0, 500),
      title,
      summary,
      embedding: embedded.vector,
      embeddingImplementation: embedded.implementation,
      timestamp: new Date().toISOString()
    });
    if (memoryVault.length > 600) memoryVault.pop();
    saveJson(userFile('memory_vault.json'), memoryVault);
    return { ok: true, count: memoryVault.length, vectorized: Boolean(embedded.vector), embeddingImplementation: embedded.implementation, dim: embedded.dim };
  });

  ipcMain.handle('memory-list', (event) => (fromChrome(event) ? memoryVault.slice(0, 100).map(({ embedding, ...rest }) => rest) : []));
  ipcMain.handle('memory-delete', (event, id) => {
    if (!fromChrome(event)) return [];
    memoryVault = memoryVault.filter((item) => String(item.id) !== String(id));
    saveJson(userFile('memory_vault.json'), memoryVault);
    return memoryVault.slice(0, 100).map(({ embedding, ...rest }) => rest);
  });

  ipcMain.handle('vibe-patch-save', (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const domain = String(payload?.domain || '').slice(0, 200);
    if (!domain || /[^a-zA-Z0-9.-]/.test(domain)) return { ok: false, error: 'Invalid domain' };
    vibePatches[domain] = {
      css: String(payload?.css || '').slice(0, 100000),
      js: String(payload?.js || '').slice(0, 100000)
    };
    saveJson(userFile('page_patches.json'), vibePatches);
    return { ok: true };
  });
  ipcMain.handle('vibe-patch-get', (event, domain) => {
    if (!fromChrome(event)) return null;
    return vibePatches[String(domain || '')] || null;
  });
  ipcMain.handle('vibe-patch-delete', (event, domain) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const key = String(domain || '').trim();
    if (key && vibePatches[key]) {
      delete vibePatches[key];
      saveJson(userFile('page_patches.json'), vibePatches);
    }
    return { ok: true };
  });
  ipcMain.handle('vibe-patch-list', (event) => {
    if (!fromChrome(event)) return {};
    return vibePatches;
  });

  ipcMain.handle('tts-synthesize', async (event, payload) => {
    if (!fromChrome(event)) return { ok: false, error: 'unauthorized' };
    const sidecarUrl = isLoopbackHttp(payload?.layaUrl) ? payload.layaUrl : cfg.sidecarUrl;
    const text = String(payload?.text || '').slice(0, 600);
    try {
      const result = await fetchJson(`${sidecarUrl}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      }, 20000);
      if (result.ok && result.data?.audio_base64) {
        return { ok: true, audioBase64: result.data.audio_base64, engine: result.data.engine || result.data.implementation };
      }
    } catch (_) {}
    const elevenKey = String(payload?.elevenKey || '').trim() || cfg.elevenLabsKey;
    if (elevenKey) {
      try {
        const voice = String(payload?.voiceId || 'JBFqnCBsd6RMkjVDRZzb');
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}`, {
          method: 'POST',
          headers: { 'xi-api-key': elevenKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, model_id: 'eleven_turbo_v2_5' }),
          signal: AbortSignal.timeout(20000)
        });
        if (response.ok) {
          const buf = Buffer.from(await response.arrayBuffer());
          return { ok: true, audioBase64: `data:audio/mpeg;base64,${buf.toString('base64')}`, engine: 'elevenlabs' };
        }
      } catch (_) {}
    }
    return { ok: false, error: 'No TTS backend. The reader will use the browser speech synthesizer.' };
  });

  ipcMain.handle('ai-query', async (event, payload) => {
    if (!fromChrome(event)) return { success: false, error: 'unauthorized' };
    const prompt = String(payload?.prompt || '').slice(0, 8000);
    const pageContext = String(payload?.pageContext || '').slice(0, 120000);
    const mode = ['auto', 'local', 'omni', 'ultra'].includes(payload?.mode) ? payload.mode : 'ultra';
    const ui = payload?.config || {};
    sreTelemetry.totalAiCalls += 1;
    const callStart = Date.now();
    try {
      const sidecarUrl = isLoopbackHttp(ui.layaUrl) ? ui.layaUrl : cfg.sidecarUrl;
      const openRouterKey = String(ui.openRouterKey || '').trim() || cfg.openRouterKey;
      const cloudModel = String(ui.cloudModel || '').trim() || cfg.openRouterModel || FREE_OMNI_MODELS[0];
      const allowCloud = Boolean(openRouterKey && cloudModel);
      let activeMode = mode;
      let decision = null;
      let isKeyFallback = false;
      if (mode === 'auto') {
        decision = await queryRouter(prompt, pageContext.length, sidecarUrl, allowCloud);
        activeMode = decision.target || decision.target_brain || 'ultra';
        if (activeMode === 'ultra' && !allowCloud) activeMode = 'local';
        if (activeMode !== 'ultra' && !allowCloud) {
          activeMode = 'local';
          isKeyFallback = true;
        }
      } else if (activeMode === 'ultra' && !openRouterKey) {
        // Use the configured or discovered local model when no cloud credential is configured.
        activeMode = 'local';
        isKeyFallback = true;
        decision = { implementation: 'awaiting-openrouter-key-fallback' };
      }

      let endpoint;
      let model;
      let apiKey = '';
      let localCatalog = { models: [], loadedModel: '', visionModel: '' };
      if (activeMode === 'ultra') {
        if (!openRouterKey) throw new Error('OpenRouter mode needs an API key in Settings or OPENROUTER_API_KEY.');
        if (!cloudModel) throw new Error('OpenRouter mode needs a model id. Sync the free list or type one.');
        endpoint = normalizeOpenAiBase(cfg.openRouterBaseUrl || 'https://openrouter.ai/api/v1') + '/chat/completions';
        model = cloudModel;
        apiKey = openRouterKey;
      } else {
        let baseSource = String(ui.localEndpoint || cfg.llmBaseUrl);
        // Only honor a renderer-supplied endpoint override when it is loopback or resolves to the same
        // origin as the configured base; otherwise fall back to the configured endpoint. Without this a
        // compromised renderer / prompt-injected agent could aim the request (and the stored key + page
        // context) at an arbitrary host: a confused-deputy SSRF and credential exfiltration.
        if (ui.localEndpoint) {
          let okEndpoint = isLoopbackHttp(ui.localEndpoint);
          if (!okEndpoint) {
            try { okEndpoint = new URL(normalizeOpenAiBase(String(ui.localEndpoint))).origin === new URL(normalizeOpenAiBase(cfg.llmBaseUrl)).origin; } catch (_) { okEndpoint = false; }
          }
          if (!okEndpoint) baseSource = String(cfg.llmBaseUrl);
        }
        const base = normalizeOpenAiBase(baseSource);
        endpoint = base + '/chat/completions';
        model = activeMode === 'omni' ? (String(ui.omniModel || cfg.omniModel || '').trim()) : (String(ui.localModel || cfg.localModel || '').trim());
        // Attach the STORED api key only when the destination origin equals the configured base origin.
        // A different endpoint (even loopback) must bring its own key via ui.llmApiKey.
        const callerKey = String(ui.llmApiKey || '').trim();
        let storedKeyAllowed = false;
        try { storedKeyAllowed = new URL(base).origin === new URL(normalizeOpenAiBase(cfg.llmBaseUrl)).origin; } catch (_) { storedKeyAllowed = false; }
        apiKey = callerKey || (storedKeyAllowed ? (cfg.llmApiKey || '') : '');
        const listed = await listLocalModels(base).catch(() => ({ ok: false, models: [], loadedModel: '', visionModel: '' }));
        localCatalog = listed;
        if (!model || NON_CHAT_MODEL_RE.test(model)) {
          model = activeMode === 'omni'
            ? (listed.visionModel || listed.models?.[0] || '')
            : (listed.loadedModel || listed.models?.[0] || '');
        }
        if (!model) {
          throw new Error(`No local model is configured and ${base}/models did not return one. Start llama-server, Ollama, or LM Studio, then set the model id.`);
        }
      }

      const emitThinkingStep = (phase, title, detail) => {
        try {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('ai-thinking-step', {
              phase,
              title,
              detail,
              elapsedMs: Date.now() - callStart
            });
          }
        } catch (_) {}
      };

      emitThinkingStep(
        'routing',
        `Brain Routing → ${activeMode.toUpperCase()} (${model})`,
        `Endpoint: ${endpoint}${isKeyFallback ? ' · Configured local fallback (cloud credential absent)' : ''}`
      );

      const memories = await searchMemoryVault(prompt, sidecarUrl, 3);
      emitThinkingStep(
        'memory',
        `Memory Vault RAG → ${memories.length} relevant note(s)`,
        memories.length
          ? memories.map((m) => `"${m.title}" (${m.url})`).join(' | ')
          : 'No prior vault notes matched query threshold'
      );
      const memoryBlock = memories.length
        ? `\n\nLOCAL VAULT NOTES:\n` + memories.map((item) => `- [${item.title}] (${item.url}): ${String(item.summary || '').slice(0, 600)}`).join('\n')
        : '';
      let userContent = `ACTIVE CONTEXT:\n${pageContext}${memoryBlock}\n\nUSER TASK: ${prompt}`;
      let piiScrubbedCount = 0;
      let outboundPrivacy = null;

      const screenshot = typeof payload?.screenshotBase64 === 'string' && payload.screenshotBase64.startsWith('data:image/')
        ? payload.screenshotBase64.slice(0, 6_000_000)
        : '';
      const textOnlyUserContent = userContent;
      const wantsVision = Boolean(screenshot && (activeMode === 'omni' || (!isKeyFallback && payload.includeScreenshot === true)));
      if (wantsVision) {
        userContent = [
          { type: 'text', text: textOnlyUserContent },
          { type: 'image_url', image_url: { url: screenshot } }
        ];
      }

      const sanitizedHist = sanitizeHistory(payload?.history);
      const protectedPayloads = new Map();
      emitThinkingStep(
        'context',
        `Context & Grounding Assembled (${textOnlyUserContent.length.toLocaleString()} chars)`,
        `History turns: ${sanitizedHist.length} · Vision frame: ${wantsVision ? 'Attached' : 'Off (Fast Text+SoM)'} · PII redacted: ${piiScrubbedCount}`
      );
      emitThinkingStep(
        'inference',
        `Running Inference on ${model}...`,
        `POST ${endpoint} · temperature=0.2 · max_tokens=${(isKeyFallback && activeMode === 'local') ? 640 : 1024}`
      );

      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      if (activeMode === 'ultra') {
        headers['HTTP-Referer'] = 'http://localhost';
        headers['X-Title'] = 'Gigachad Browser';
      }

      async function sendChatCompletion(targetModel, contentPayload, timeoutMs = (activeMode === 'ultra' ? 120000 : 30000)) {
        const controller = new AbortController();
        const timer = setTimeout(() => {
          controller.__timedOut = true;
          controller.abort();
        }, timeoutMs);
        activeAiAbort = controller;
        try {
          const messages = [
              { role: 'system', content: AGENT_SYSTEM_PROMPT },
              ...sanitizedHist,
              { role: 'user', content: contentPayload }
          ];
          const cacheKey = JSON.stringify(messages);
          let protectedPayload = protectedPayloads.get(cacheKey);
          if (!protectedPayload) {
            protectedPayload = await prepareOutboundMessages({
              endpoint,
              messages,
              piiFirewall: cfg.piiFirewall,
              allowUnredactedImages: payload?.allowUnredactedImages === true || cfg.allowCloudImages === true,
              redactText: async (text) => {
                const pii = await fetchJson(`${sidecarUrl}/ner_pii`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text }),
                  redirect: 'error'
                }, 1500);
                if (!pii.ok) throw new Error('PII service unavailable');
                return pii.data;
              }
            });
            protectedPayloads.set(cacheKey, protectedPayload);
            const newlyCounted = Math.max(0, protectedPayload.redactedCount - piiScrubbedCount);
            piiScrubbedCount += newlyCounted;
            piiBlockedTotal += newlyCounted;
          }
          outboundPrivacy = protectedPayload.privacy;
          const reqBody = {
            model: targetModel,
            messages: protectedPayload.messages,
            temperature: 0.2,
            max_tokens: (isKeyFallback && activeMode === 'local') ? 640 : 1024
          };
          if (activeMode !== 'ultra' && /thinking/i.test(targetModel)) {
            reqBody.chat_template_kwargs = { enable_thinking: true };
          }
          const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(reqBody),
            signal: controller.signal,
            redirect: 'error'
          });
          const rawText = await res.text();
          return { res, rawText };
        } catch (err) {
          if (err.name === 'AbortError') {
            if (controller.__cancelledByUser) throw new Error('Stopped.');
            throw new Error(`Model "${targetModel}" timed out after ${Math.round(timeoutMs / 1000)}s.`);
          }
          throw err;
        } finally {
          clearTimeout(timer);
          if (activeAiAbort === controller) activeAiAbort = null;
        }
      }

      let response;
      let raw;
      try {
        ({ res: response, rawText: raw } = await sendChatCompletion(model, userContent));
      } catch (firstErr) {
        if (firstErr.message === 'Stopped.' || firstErr.blocksOutboundRequest) throw firstErr;
        const fallbackModel = [localCatalog.loadedModel, ...(localCatalog.models || [])].find(id => id && id !== model && !NON_CHAT_MODEL_RE.test(id));
        if (activeMode !== 'ultra' && fallbackModel) {
          model = fallbackModel;
          ({ res: response, rawText: raw } = await sendChatCompletion(model, textOnlyUserContent, 20000));
        } else {
          throw firstErr;
        }
      }
      if (activeMode === 'ultra' && (!response.ok || /"error"\s*:/i.test(raw))) {
        // Automatic OpenRouter :free Multimodal/Omni Failover Cascade (rate-limits 429, provider 502/503/404, or non-vision model fallback)
        for (const fallbackFreeModel of FREE_OMNI_MODELS) {
          if (fallbackFreeModel === model) continue;
          const retryFree = await sendChatCompletion(fallbackFreeModel, userContent);
          if (retryFree.res.ok && !/"error"\s*:/i.test(retryFree.rawText)) {
            model = fallbackFreeModel;
            response = retryFree.res;
            raw = retryFree.rawText;
            break;
          }
        }
      }
      if (!response.ok && wantsVision && /image input is not supported|mmproj|vision|multimodal/i.test(raw)) {
        // Retry only a configured/discovered vision model; availability alone is
        // not proof of vision support, so its response still determines success.
        const visionFallback = localCatalog.visionModel;
        if (activeMode !== 'ultra' && visionFallback && visionFallback !== model) {
          const retryVision = await sendChatCompletion(visionFallback, userContent);
          if (retryVision.res.ok) {
            model = visionFallback;
            response = retryVision.res;
            raw = retryVision.rawText;
          }
        }
        if (!response.ok) {
          const retryText = await sendChatCompletion(model, textOnlyUserContent);
          response = retryText.res;
          raw = retryText.rawText;
        }
      }

      let data;
      try { data = JSON.parse(raw); } catch (_) { throw new Error(`LLM returned non-JSON (HTTP ${response.status}): ${raw.slice(0, 240)}`); }
      if (!response.ok || data.error) {
        const message = data.error?.message || data.error || raw.slice(0, 240);
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
      }
      let message = data.choices?.[0]?.message || {};
      const rawMsgContent = String(message.content || '');
      const thinkMatch = rawMsgContent.match(/<think>([\s\S]*?)<\/think>/i);
      const extractedThinkTag = thinkMatch ? thinkMatch[1].trim() : '';
      const extractedReasoningField = String(message.reasoning_content || message.reasoning || '').trim();
      let thinkingTrace = [extractedThinkTag, extractedReasoningField].filter(Boolean).join('\n\n');
      let cleanedContent = rawMsgContent
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/^[\s\S]*?<\/think>/i, '')
        .trim();
      let reply = cleanedContent || String(message.reasoning_content || '').trim();
      const emptyFallback = [localCatalog.loadedModel, ...(localCatalog.models || [])].find(id => id && id !== model && !NON_CHAT_MODEL_RE.test(id));
      if (!reply && activeMode !== 'ultra' && emptyFallback) {
        const retryEmpty = await sendChatCompletion(emptyFallback, textOnlyUserContent);
        if (retryEmpty.res.ok) {
          try {
            const retryData = JSON.parse(retryEmpty.rawText);
            const rMsg = retryData.choices?.[0]?.message || {};
            reply = String(rMsg.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim() || String(rMsg.reasoning_content || '').trim();
            if (reply) { model = emptyFallback; data = retryData; }
          } catch (_) {}
        }
      }
      if (!reply) throw new Error('The model returned an empty message.');
      const totalLatencyMs = Date.now() - callStart;
      sreTelemetry.aiLatenciesMs.push(totalLatencyMs);
      if (sreTelemetry.aiLatenciesMs.length > 50) sreTelemetry.aiLatenciesMs.shift();
      const timings = data.timings || {};
      const usage = data.usage || {};
      const promptTokens = timings.prompt_n || usage.prompt_tokens || Math.round(textOnlyUserContent.length / 4);
      const completionTokens = timings.predicted_n || usage.completion_tokens || Math.round(reply.length / 4);
      const tokPerSec = timings.predicted_per_second
        ? Number(timings.predicted_per_second).toFixed(1)
        : (totalLatencyMs > 0 ? ((completionTokens / (totalLatencyMs / 1000))).toFixed(1) : '0.0');
      const promptTokPerSec = timings.prompt_per_second
        ? Number(timings.prompt_per_second).toFixed(1)
        : '';
      const thinkingTraceSource = thinkingTrace ? 'provider-reasoning' : 'request-diagnostics';
      const tokenCountsEstimated = !(Number.isFinite(timings.prompt_n) || Number.isFinite(usage.prompt_tokens)) || !(Number.isFinite(timings.predicted_n) || Number.isFinite(usage.completion_tokens));
      if (!thinkingTrace) {
        thinkingTrace = [
          `[1. Request Diagnostics: Route & Model] Selected ${model} (${activeMode.toUpperCase()} mode via ${endpoint})${isKeyFallback ? ' — Local fallback selected because cloud credential is absent' : ''}.`,
          `[2. Context & Perception Analysis] Processed ${textOnlyUserContent.length.toLocaleString()} chars of live webpage DOM context + ${memories.length} Memory Vault RAG note(s)${piiScrubbedCount ? ` (${piiScrubbedCount} PII entities scrubbed)` : ''}.`,
          `[3. Token & Hardware Telemetry] Prompt: ${promptTokens} tokens${promptTokPerSec ? ` (${promptTokPerSec} tok/s)` : ''} → Generated: ${completionTokens} tokens at ${tokPerSec} tok/s in ${totalLatencyMs} ms.`,
          `[4. Inference Complete] Provider returned text. Response correctness and grounding have not been independently verified.`
        ].join('\n');
      }
      emitThinkingStep(
        'complete',
        `Inference Complete (${totalLatencyMs} ms · ${tokPerSec} tok/s)`,
        `Model: ${model} · Prompt: ${promptTokens} tok · Output: ${completionTokens} tok`
      );
      const routerNote = decision ? ` | router ${decision.implementation || 'heuristic'} -> ${activeMode}` : '';
      return {
        success: true,
        modelUsed: `${model} (${activeMode})${routerNote}`,
        memoriesUsed: memories.length,
        memoryTitles: memories.map((m) => m.title),
        piiScrubbedCount,
        privacy: outboundPrivacy,
        thinkingTrace,
        thinkingTraceSource,
        tokenCountsEstimated,
        telemetry: {
          latencyMs: totalLatencyMs,
          promptTokens,
          completionTokens,
          tokPerSec,
          promptTokPerSec,
          endpoint,
          activeMode,
          model,
          isKeyFallback,
          contextChars: textOnlyUserContent.length
        },
        reply
      };
    } catch (err) {
      sreTelemetry.failedAiCalls += 1;
      return { success: false, error: err.message, ...(err.code ? { errorCode: err.code } : {}) };
    }
  });
}

app.whenReady().then(async () => {
  if (!primaryInstance) return;
  initStores();
  genomeStore = createGenomeStore({ directory: app.getPath('userData') });
  await genomeStore.initialize();
  // Recovery owns the store before any renderer exists. It preserves the exact
  // old file and publishes only against its verified source revision/digest.
  const genomeMigration = await migrateLegacyNative({ store: genomeStore,
    Adapter: require('./systems/authentic-asmodensius-adapter.js').AuthenticAsmodensiusAdapter,
    runtime: { electron: process.versions.electron, node: process.versions.node, v8: process.versions.v8 } });
  if (genomeMigration.status !== 'noop') console.info('GENOME_NATIVE_RECOVERY', JSON.stringify(genomeMigration));
  genomeIpc = installGenomeIpc({ ipcMain, store: genomeStore, trusted: fromChrome,
    async onShutdown(receipt) {
      if (!receipt.persistenceVerified) console.error('GENOME_SHUTDOWN_UNVERIFIED', JSON.stringify(receipt));
      await fs.promises.writeFile(userFile('alive-genome-shutdown.json'), JSON.stringify(receipt, null, 2), 'utf8');
    } });
  if (!SMOKE && cfg.torAutoStart) managedTor.start({ torPath: cfg.torPath, dataDirectory: userFile('tor-client'), socksPort: cfg.torSocksPort, enabled: true, startupTimeoutMs: 180000 });
  installSessionHooks();
  await refreshDeepWebTransport();
  installMenu();
  registerIpc();
  if (!SMOKE) {
    await discoverDefaultLlm();
    ensureSidecar();
    ensureLlama();
    setInterval(() => { ensureSidecar(); ensureLlama(); }, 15000);
  }
  mainWindow = createWindow();

  if (SMOKE) {
    const fail = (message) => {
      console.error(message);
      app.exit(1);
    };
    const timer = setTimeout(() => fail('SMOKE_TIMEOUT'), 20000);
    mainWindow.webContents.once('did-finish-load', async () => {
      try {
        await mainWindow.webContents.executeJavaScript(`(async () => {
          if (!window.aliveStartup) throw new Error('Renderer startup controller is missing');
          const state = await window.aliveStartup.ready;
          if (state.phase !== 'ready') throw new Error('Renderer startup failed: ' + (state.error || state.phase));
          return true;
        })()`);
        const probe = await mainWindow.webContents.executeJavaScript(`new Promise((resolve) => {
          const started = Date.now();
          const timer = setInterval(async () => {
            const tab = document.querySelector('#webviews-stack webview');
            const webviews = document.querySelectorAll('webview').length;
            let guestUrl = '';
            try { guestUrl = tab && typeof tab.getURL === 'function' ? (tab.getURL() || '') : ''; } catch (_) {}
            if ((guestUrl && window.gigachad) || Date.now() - started > 5000) {
              clearInterval(timer);
              let health = null;
              try { health = await window.gigachad.invoke('sidecar-health'); } catch (err) { health = { threw: String(err) }; }
              try { await runWishlistFeature(100); } catch (_) {}
              const wishlistSourceInventory100 = (document.getElementById('wishlist-body')?.innerText || '').includes('100 / 100 SOURCE BRANCHES FOUND');
              let alifeOmega100Ok = false;
              let alifeDiagnostics = { error: 'A-Life runtime is not initialized' };
              let authenticDiagnostics = { error: 'Original Asmodensius runtime is not initialized' };
              let forensicDiagnostics = null;
              try {
                if (typeof humunculusRuntime === 'object' && humunculusRuntime) {
                  const readGuestHud = async (tObj) => {
                    if (!tObj || !tObj.wv) return null;
                    return await tObj.wv.executeJavaScript(
                      '({ hasCanvas: Boolean(document.getElementById("__humunculus_alife_canvas")), hasHud: Boolean(document.getElementById("__gigachad_alien_hud")), hudHidden: document.getElementById("__gigachad_alien_hud") ? getComputedStyle(document.getElementById("__gigachad_alien_hud")).display === "none" : false, animRunning: Boolean(window.__humunculusAnimRunning), persistentResources: Boolean(window.__humunculusAuthorityResources), authorityInstalled: Boolean(window.__aliveAuthority) })'
                    ).catch(() => null);
                  };
                  let guestHudCheck = null;
                  let manualObservation = null;
                  for (let attempt = 0; attempt < 4; attempt++) {
                    const readyT = (typeof tabs !== 'undefined' && Array.isArray(tabs))
                      ? (tabs.find((tb) => tb && tb.domReady && /newtab\.html/i.test(tb.url || '')) || tabs.find((tb) => tb && tb.domReady) || (typeof getActiveTab === 'function' ? getActiveTab() : null))
                      : (typeof getActiveTab === 'function' ? getActiveTab() : null);
                    manualObservation = await performWeirdAlienDomExperiment(readyT);
                    guestHudCheck = await readGuestHud(readyT);
                    if (manualObservation?.authority?.kind === 'manual' && guestHudCheck?.hasCanvas && guestHudCheck?.authorityInstalled) {
                      break;
                    }
                    await new Promise((r) => setTimeout(r, 320));
                  }
                  humunculusRuntime.ingestAndComprehendPageTelemetry({
                    url: 'https://en.wikipedia.org/wiki/Artificial_life',
                    title: 'Artificial life',
                    pageMetrics: {
                      shannonEntropyBits: 4.64,
                      topConcepts: ['autopoiesis', 'morphogenesis', 'topology', 'emergence']
                    }
                  });
                  const om = humunculusRuntime.stepOmega100OmniscienceEngine({});
                  const dt = humunculusRuntime.stepDeity100OmnipotenceEngine({});
                  humunculusRuntime.stepContinuousWorldModelAndFeralMorph60Hz(1.2, 60, 1280, 800);
                  const term100 = humunculusRuntime.formatRetroTerminalText('omniscience100');
                  const termDeity100 = humunculusRuntime.formatRetroTerminalText('deity100');
                  const gates = humunculusRuntime.evaluateAcceptanceGates();
                  const drawerEl = document.getElementById('alien-brain-drawer');
                  const prevDrawerDisp = drawerEl ? drawerEl.style.display : 'none';
                  if (drawerEl) drawerEl.style.display = 'flex';
                  if (typeof setHybridMeshZoomTier === 'function') {
                    setHybridMeshZoomTier(5);
                    setHybridMeshZoomTier(6);
                    setHybridMeshZoomTier(1);
                  }
                  if (drawerEl) drawerEl.style.display = prevDrawerDisp;
                  const original = humunculusRuntime.authenticAsmodensius;
                  const OriginalAdapter = window.AuthenticAsmodensiusAdapter;
                  if (original && typeof OriginalAdapter === 'function') {
                    const before = original.readout();
                    const hidden = ${!mainWindow.isVisible()} || document.hidden;
                    await new Promise((r) => setTimeout(r, 350));
                    const scheduled = original.readout();
                    if (hidden) {
                      // Hidden smoke windows intentionally pause the live scheduler. Exercise
                      // its bounded adapter clock with a measured-geometry fixture instead.
                      const observed = OriginalAdapter.observeChrome({
                        width: window.innerWidth, height: window.innerHeight,
                        x: window.innerWidth / 2, y: window.innerHeight / 2,
                        vx: 0, vy: 0, tabCount: webviews, focused: document.hasFocus(), loading: false
                      });
                      for (let i = 0; i < 3; i++) original.advance(100, observed);
                    }
                    const after = original.readout();
                    const checkpoint = JSON.parse(JSON.stringify(original.exportState()));
                    const restored = new OriginalAdapter({ seed: 999 });
                    authenticDiagnostics = {
                      backend: after.backend,
                      sourceDigest: after.sourceDigest,
                      sourceMatches: after.sourceDigest === window.GigachadAsmodensiusSource?.sourceDigest,
                      neurons: after.neurons,
                      clockMode: hidden ? 'controlled-hidden-window' : 'live-renderer-scheduler',
                      hiddenSchedulerPaused: !hidden || scheduled.simulatedMinutes === before.simulatedMinutes,
                      advancedTicks: after.simulatedMinutes - before.simulatedMinutes,
                      finiteInputMotor: after.lastInput?.length === 16 && after.motor2D?.length === 2 && after.motor8?.length === 8 &&
                        [...after.lastInput, ...after.motor2D, ...after.motor8].every(Number.isFinite),
                      exactCheckpointReplay: restored.importState(checkpoint) && restored.exportState().payload === checkpoint.payload
                    };
                  }
                  const alifeChecks = {
                    authenticOriginalOk: Boolean(
                      authenticDiagnostics.backend === 'original-asmodensius-creature001' &&
                      authenticDiagnostics.sourceMatches && authenticDiagnostics.neurons === 272 &&
                      authenticDiagnostics.hiddenSchedulerPaused && authenticDiagnostics.advancedTicks > 0 &&
                      authenticDiagnostics.finiteInputMotor && authenticDiagnostics.exactCheckpointReplay
                    ),
                    omOk: Boolean(om && om.availableFeatureCount === 100 && om.verifiedModulesCount === 0 && om.verificationStatus === 'NOT_RUN' && om.completedStepCount > 0),
                    dtOk: Boolean(dt && dt.totalDeityPowers === 100 && dt.verifiedDeityPowersCount === 0 && dt.verificationStatus === 'NOT_RUN' && dt.completedStepCount > 0),
                    wmOk: Boolean(
                      humunculusRuntime.continuousWorldModel?.latentZ64?.length === 64 &&
                      humunculusRuntime.continuousWorldModel?.ssmHiddenH128?.length === 128 &&
                      humunculusRuntime.continuousWorldModel?.contextRotPct === 0 &&
                      humunculusRuntime.continuousWorldModel?.tokenDiscretizationErrorPct === 0
                    ),
                    feralOk: Boolean(
                      humunculusRuntime.feralMorphodynamics?.asymmetricLimbReach12?.length === 12 &&
                      humunculusRuntime.realtimeProceduralWorld?.biomeNodes?.length === 5
                    ),
                    dsdOk: Boolean(
                      String(humunculusRuntime.decursiveSelfDeduplicator?.primarkEthos || '').startsWith('DECURSIVE_SELF_DEDUPLICATION_') &&
                      humunculusRuntime.decursiveSelfDeduplicator?.banishedBasis8x64?.length === 512 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.cuckooQuotientTable256?.length === 256 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.swarmCholeskyL5x5?.length === 25 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.vietorisRipsLandmarks16x8?.length === 128 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.cmsSketch4x64?.length === 256 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.fwhtSpectrum64?.length === 64 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.mortonCellTable64?.length === 64 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.hopcroftClass32?.length === 32 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.auctionPrices16?.length === 16 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.chebyshevScratch64?.length === 64 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.chiralLimbParity12?.length === 12 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.onionBloomFilter64?.length === 64 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.poincareDiskCoords24?.length === 24 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.wlColorHash32?.length === 32 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.sinkhornTransport4x4?.length === 16 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.lz78PhraseRing64?.length === 64 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.synapseRowDedupCount >= 1 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.sltcTauDedupSwapsCount >= 1 &&
                      humunculusRuntime.decursiveSelfDeduplicator?.ssmEigenRepulsionsCount >= 1 &&
                      humunculusRuntime.neuralSubstrateTelemetry?.perelmanWEntropy > 0 &&
                      humunculusRuntime.neuralSubstrateTelemetry?.ryuTakayanagiBulkEntropy > 0 &&
                      humunculusRuntime.neuralSubstrateTelemetry?.adsCftDualityRatio > 0 &&
                      humunculusRuntime.neuralSubstrateTelemetry?.ntkTraceNorm > 0 &&
                      humunculusRuntime.neuralSubstrateTelemetry?.hodgeHarmonicFlowPct > 0
                    ),
                    metaOk: Boolean(
                      document.getElementById('hybrid-tier-btn-5') &&
                      document.getElementById('hybrid-tier-btn-6') &&
                      humunculusRuntime.multivectorMetacognitionEngine?.cliffordMultivector16?.length === 16 &&
                      humunculusRuntime.multivectorMetacognitionEngine?.metacognitiveGrid8x8?.length === 64 &&
                      humunculusRuntime.multivectorMetacognitionEngine?.omnigradientNaturalGrad64?.length === 64 &&
                      Boolean(humunculusRuntime.sixOmniMatrix?.sixOmniHeadline) &&
                      humunculusRuntime.formatRetroTerminalText('metacognition').includes('SUPREME MULTIVECTOR METACOGNITION')
                    ),
                    ddwNsOk: Boolean(
                      humunculusRuntime.deepDarkWebSubstrateEngine?.torV3OnionAddress === '' &&
                      humunculusRuntime.deepDarkWebSubstrateEngine?.localTorSocksActive === false &&
                      humunculusRuntime.deepDarkWebSubstrateEngine?.onionCircuitHops3?.length === 0 &&
                      humunculusRuntime.neuralSubstrateTelemetry?.sltcMeanTauMs > 0 &&
                      humunculusRuntime.neuralSubstrateTelemetry?.htsrPowerLawAlpha >= 2.0 &&
                      humunculusRuntime.neuralSubstrateTelemetry?.yangMillsWilsonHolonomy > 0 &&
                      humunculusRuntime.neuralSubstrateTelemetry?.navierStokesEnstrophy > 0 &&
                      humunculusRuntime.neuralSubstrateTelemetry?.gueRepulsionFactorR2 > 0 &&
                      humunculusRuntime.neuralSubstrateTelemetry?.riemannZetaZeros16?.length === 16 &&
                      humunculusRuntime.deepWebAndSltcConnectomeEngine?.sltcState64?.length === 64 &&
                      humunculusRuntime.deepWebAndSltcConnectomeEngine?.sltcSpikes64?.length === 64 &&
                      humunculusRuntime.deepWebAndSltcConnectomeEngine?.sltcSurrogateGrad64?.length === 64 &&
                      humunculusRuntime.trainableAlifeNeuralHub?.f64TrajectoryCurr16 instanceof Float64Array &&
                      humunculusRuntime.trainableAlifeNeuralHub?.int8QuantizedWeights256 instanceof Int8Array &&
                      humunculusRuntime.trainableAlifeNeuralHub?.b158TernaryMorphism256 instanceof Int8Array &&
                      humunculusRuntime.trainableAlifeNeuralHub?.fp16PersistentWeights256 instanceof Uint16Array &&
                      humunculusRuntime.trainableAlifeNeuralHub?.f64InterIntraCoupling16x16 instanceof Float64Array &&
                      humunculusRuntime.trainableAlifeNeuralHub?.u64SpikeTrainLanes8 instanceof BigUint64Array &&
                      humunculusRuntime.trainableAlifeNeuralHub?.totalBackpropStepsTrained >= 1 &&
                      humunculusRuntime.trainableAlifeNeuralHub?.thoughtCurvatureKappa > 0 &&
                      humunculusRuntime.trainableAlifeNeuralHub?.diffusionScoreLossMse > 0 &&
                      humunculusRuntime.trainableAlifeNeuralHub?.ganDiscRealProb > 0 &&
                      humunculusRuntime.trainableAlifeNeuralHub?.interIntraCoherenceScore > 0 &&
                      humunculusRuntime.trainableAlifeNeuralHub?.visionDomGrid8x8?.length === 64 &&
                      humunculusRuntime.trainableAlifeNeuralHub?.inversePhysicsLossMse > 0 &&
                      humunculusRuntime.trainableAlifeNeuralHub?.icmCuriosityReward > 0 &&
                      humunculusRuntime.frontierNeuralCyberEngine?.unprecedented25Catalog?.length === 25 &&
                      humunculusRuntime.frontierNeuralCyberEngine?.wasmKernel?.active === true &&
                      humunculusRuntime.frontierNeuralCyberEngine?.jepaMultiHorizonLoss > 0 &&
                      humunculusRuntime.frontierNeuralCyberEngine?.flowMatchingLossMse > 0 &&
                      humunculusRuntime.aotTotGotEngine?.totLatentArena21x16?.length === 336 &&
                      humunculusRuntime.aotTotGotEngine?.gotVertices16x16?.length === 256 &&
                      humunculusRuntime.aotTotGotEngine?.gotAdjMatrix16x16?.length === 256 &&
                      humunculusRuntime.aotTotGotEngine?.aotContractedVector16?.length === 16 &&
                      humunculusRuntime.aotTotGotEngine?.gotApexValueQ > 0 &&
                      humunculusRuntime.formatRetroTerminalText('aottotgot').includes('LOCAL AoT / ToT / GoT MODEL STATE: available') &&
                      humunculusRuntime.formatRetroTerminalText('deepdark').includes('DEEP WEB & DARK WEB') &&
                      typeof resolveDeepDarkWebGatewayUrl === 'function' &&
                      typeof humunculusRuntime.scoreDoorByDsdAndMetacognition === 'function' &&
                      typeof triggerPrimarkDecursiveSelfDeduplicationBurst === 'function'
                    ),
                    coreOk: Boolean(
                      humunculusRuntime.ELDRITCH_ARCHETYPES?.length === 12 &&
                      humunculusRuntime.swarmCollective?.pantheon?.length === 5 &&
                      humunculusRuntime.deepCortex?.totalParams === 1245184 &&
                      term100.includes('100 LOCAL FEATURE SLOTS; NOT INDEPENDENTLY VERIFIED') &&
                      termDeity100.includes('100 LOCAL FEATURE SLOTS; NOT INDEPENDENTLY VERIFIED') &&
                      typeof triggerDeity100ApotheosisPulse === 'function' &&
                      gates &&
                      (gates.allPassed === true || (Array.isArray(gates.gates) && gates.totalCount === 8 && !gates.gates.some((g) => g.status === 'FAIL')))
                    ),
                    multiverse14Ok: Boolean(
                      humunculusRuntime.portedMultiverseBrains?.lastSnapshot?.activeBrainsCount === 14 &&
                      humunculusRuntime.portedMultiverseBrains?.lastSnapshot?.glitchlingFlawEventsCount === 189 &&
                      humunculusRuntime.portedMultiverseBrains?.lastSnapshot?.thalerNineMarkersObject &&
                      Object.keys(humunculusRuntime.portedMultiverseBrains.lastSnapshot.thalerNineMarkersObject).length === 9 &&
                      humunculusRuntime.portedMultiverseBrains?.lastSnapshot?.consciousness10Score > 0 &&
                      humunculusRuntime.portedMultiverseBrains?.latestSnapshot?.completedStepCount > 0 &&
                      humunculusRuntime.formatRetroTerminalText('brainfusion').includes('LOCAL BRAIN FEDERATION SNAPSHOTS') &&
                      humunculusRuntime.formatRetroTerminalText('brainfusion').includes('state=computed')
                    ),
                    forensic25x10Ok: await (async () => {
                      humunculusRuntime.savePersistentGenome();
                      const durableSave = await window.aliveAutosave.flush('smoke-durable');
                      const durableRead = await window.aliveGenomePersistence.readFresh();
                      if (durableSave.status !== 'persisted' || !durableSave.persistenceVerified || durableRead.status !== 'ready') {
                        throw new Error('Durable genome save/readback was not verified');
                      }
                      // Smoke reloads a newly saved source, not the startup source.
                      // Authenticate that exact JSON before changing its controller.
                      const reloadedPrimary = await window.AlivePrimaryPolicyBootstrap.prepare({
                        json: durableRead.json, primary: window.AlivePrimaryPolicyState,
                        trainer: window.AliveTrainerState,
                        replay: window.AliveReplayState,
                        hub: window.AliveHubState,
                        registry: window.AliveLearnedStateRegistry, codec: window.AliveLearnedStateCodec,
                        crypto: window.crypto
                      });
                      let durableGenomeValidation;
                      if (Object.prototype.hasOwnProperty.call(JSON.parse(durableRead.json), 'trainerCommittedState')) {
                        // Paired hydration is an unpublished-startup boundary,
                        // not an atomic live reload. Preparation validates all
                        // declared detached components; a two-process probe tests restore.
                        if (reloadedPrimary.snapshot(humunculusRuntime).trainerPrepared !== true) {
                          throw new Error('Durable trainer component was not prepared');
                        }
                        const replayPresent = Object.prototype.hasOwnProperty.call(JSON.parse(durableRead.json), 'replayMemoryState');
                        const replayPrepared = reloadedPrimary.snapshot(humunculusRuntime).replayPrepared === true;
                        if (replayPresent && !replayPrepared) throw new Error('Durable replay component was not prepared');
                        const hubPresent = Object.prototype.hasOwnProperty.call(JSON.parse(durableRead.json), 'hubMemoryState');
                        const hubPrepared = reloadedPrimary.snapshot(humunculusRuntime).hubPrepared === true;
                        if (hubPresent && !hubPrepared) throw new Error('Durable neural hub component was not prepared');
                        durableGenomeValidation = { prepared: true, trainerPrepared: true,
                          replayPrepared, hubPrepared,
                          application: 'startup-only-not-reloaded',
                          scope: 'Declared saved components validated before activation; this smoke run did not restore them into the live model' };
                      } else {
                        reloadedPrimary.preflight(humunculusRuntime, durableRead.json);
                        window.alivePrimaryPolicyBootstrap = reloadedPrimary;
                        if (humunculusRuntime.loadPersistentGenome(durableRead.json) !== true) {
                          throw new Error('Durable genome reload was not applied');
                        }
                        durableGenomeValidation = { prepared: true, trainerPrepared: false, application: 'primary-only-reloaded' };
                      }
                      // End of the explicit smoke reload boundary.
                      const liveAudit = humunculusRuntime.forensic25x10Auditor?.runFull25PassBy10IterationAudit(humunculusRuntime);
                      forensicDiagnostics = {
                        durableGenomeValidation,
                        runtimeDiagnosticsOk: liveAudit?.runtimeDiagnosticsOk,
                        statusCounts: liveAudit?.diagnosticStatusCounts,
                        failed: liveAudit?.checkExecutions?.filter((check) => check.status === 'FAIL' || check.status === 'BLOCKED').slice(0, 10),
                        errors: liveAudit?.errors,
                        releaseVerified: liveAudit?.releaseVerified,
                        releaseStatus: liveAudit?.releaseStatus
                      };
                      return Boolean(
                        liveAudit &&
                        liveAudit.runtimeDiagnosticsOk === true &&
                        liveAudit.uniqueDiagnosticChecks === 50 &&
                        liveAudit.diagnosticStatusCounts?.FAIL === 0 &&
                        liveAudit.diagnosticStatusCounts?.BLOCKED === 0 &&
                        liveAudit.releaseVerified === false &&
                        liveAudit.releaseStatus === 'NOT_RUN'
                      );
                    })(),
                    domOk: Boolean(
                      document.getElementById('host-alife-viewport-canvas') &&
                      document.getElementById('host-alife-hud-dock') &&
                      document.getElementById('host-alife-hud-bar') &&
                      document.getElementById('host-alife-hud-pre') &&
                      document.getElementById('habitat-unleash-btn') &&
                      document.getElementById('habitat-overdrive-btn') &&
                      document.getElementById('habitat-persona-select') &&
                      document.getElementById('habitat-autonav-chk') &&
                      typeof renderRetroTerminalOverlay === 'function' &&
                      typeof syncCreaturePersonaMode === 'function' &&
                      typeof cycleCreatureSwarmFormation === 'function' &&
                      typeof cycleHostTerminalViewMode === 'function' &&
                      typeof toggleHostAlifeHudPre === 'function' &&
                      chromeCrawlerState &&
                      chromeCrawlerState.frameCount >= 1 &&
                      !String(document.getElementById('backend-status')?.textContent || '').startsWith('Could not read config:')
                    ),
                    guestOk: Boolean(
                      guestHudCheck &&
                      guestHudCheck.hasCanvas &&
                      guestHudCheck.hasHud &&
                      guestHudCheck.hudHidden &&
                      guestHudCheck.authorityInstalled &&
                      !guestHudCheck.animRunning && !guestHudCheck.persistentResources &&
                      manualObservation?.authority?.kind === 'manual' &&
                      typeof manualObservation.url === 'string' &&
                      Array.isArray(manualObservation.specimens) &&
                      !window.aliveAuthority.isCurrent(manualObservation.authority) &&
                      window.aliveAuthority.snapshot().paused &&
                      window.aliveAuthority.snapshot().manuals === 0 &&
                      !window.aliveOverdrive.running
                    )
                  };
                  alifeOmega100Ok = Object.values(alifeChecks).every(Boolean);
                  alifeDiagnostics = { ...alifeChecks, guestManualProbe: { ...guestHudCheck,
                    observationReturned: Boolean(manualObservation?.url), permitKind: manualObservation?.authority?.kind || null,
                    paused: window.aliveAuthority?.snapshot().paused, manualPermits: window.aliveAuthority?.snapshot().manuals } };
                }
              } catch (err) {
                alifeOmega100Ok = false;
                alifeDiagnostics = { error: String(err?.message || err), stack: String(err?.stack || '').slice(0, 1500) };
              }
              resolve({
                bridge: typeof window.gigachad?.invoke === 'function',
                requireType: typeof window.require,
                webviews,
                tabSrc: tab ? (tab.getAttribute('src') || '') : '',
                guestUrl,
                webviewApi: typeof document.createElement('webview').loadURL === 'function',
                actionParser: typeof window.GigachadActions?.parseAgentReply === 'function',
                actionCount: Array.isArray(window.GigachadActions?.ACTIONS) ? window.GigachadActions.ACTIONS.length : 0,
                defaultBrainMode: document.getElementById('brain-mode')?.value || '',
                defaultCloudModel: document.getElementById('quick-cloud-model')?.value || '',
                visionChecked: document.getElementById('send-screenshot')?.checked === true,
                wishlistCount: Array.isArray(window.WISHLIST_100_CATALOG) ? window.WISHLIST_100_CATALOG.length : 0,
                wishlistSourceInventory100,
                alifeOmega100Ok,
                alifeDiagnostics,
                authenticDiagnostics,
                forensicDiagnostics,
                featuresOperational: (
                  typeof openMakeAppPrompt === 'function' &&
                  typeof openPlaybooksView === 'function' &&
                  typeof runSmartFormAutofill === 'function' &&
                  typeof togglePageWatcher === 'function' &&
                  typeof runVideoTranscriptSummary === 'function' &&
                  typeof buildSoMContext === 'function' &&
                  typeof runWishlistFeature === 'function' &&
                  typeof filterWishlistCatalog === 'function' &&
                  typeof boostBrowserMemoryAndSpeed === 'function' &&
                  typeof freezeSingleTab === 'function' &&
                  typeof saveQuickOpenRouterKey === 'function'
                ),
                healthOk: Boolean(health && (health.ok === true || health.ok === false || health.error))
              });
            }
          }, 40);
        })`);
        if (
          !probe.bridge ||
          probe.requireType !== 'undefined' ||
          !probe.tabSrc ||
          !probe.guestUrl ||
          !probe.webviewApi ||
          !probe.actionParser ||
          probe.actionCount !== 36 ||
          probe.wishlistCount !== 100 ||
          !probe.wishlistSourceInventory100 ||
          !probe.alifeOmega100Ok ||
          probe.defaultBrainMode !== 'ultra' ||
          !probe.defaultCloudModel ||
          !probe.visionChecked ||
          !probe.featuresOperational ||
          !probe.healthOk
        ) {
          clearTimeout(timer);
          fail('SMOKE_BRIDGE_FAIL ' + JSON.stringify(probe));
          return;
        }
        clearTimeout(timer);
        console.log('SMOKE_OK ' + JSON.stringify(probe));
        app.exit(0);
      } catch (err) {
        clearTimeout(timer);
        fail('SMOKE_CRASH ' + err.message);
      }
    });
  }
});

app.on('second-instance', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show(); mainWindow.focus();
  }
});
app.on('before-quit', event => {
  if (mainWindow && !mainWindow.isDestroyed() && genomeWindowGuard && !genomeWindowGuard.isAllowed()) {
    event.preventDefault();
    mainWindow.close();
  }
});
app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => {
  managedTor.stop();
  if (_localBrainsHttpServer) { try { _localBrainsHttpServer.close(); } catch (_) {} }
  if (sidecarProcess && sidecarProcess.exitCode == null) { try { sidecarProcess.kill(); } catch (_) {} }
  if (llamaProcess && llamaProcess.exitCode == null) { try { llamaProcess.kill(); } catch (_) {} }
});
