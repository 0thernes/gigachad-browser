const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULTS = {
  pythonPath: '',
  sidecarHost: '127.0.0.1',
  sidecarPort: 8000,
  autoStartSidecar: true,
  llmBaseUrl: 'http://127.0.0.1:11434/v1',
  llmApiKey: '',
  localModel: '',
  omniModel: '',
  openRouterBaseUrl: 'https://openrouter.ai/api/v1',
  openRouterModel: 'nvidia/nemotron-3.5-super-vl:free',
  openRouterKey: '',
  elevenLabsKey: '',
  llamaAutoStart: false,
  llamaServerPath: '',
  llamaModelPath: '',
  llamaPort: 11434,
  llamaContext: 8192,
  llamaGpuLayers: 99,
  ytdlpPath: '',
  piiFirewall: true,
  stealthCloak: false
};

function readJson(filePath) {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {}
  return null;
}

function loadDotEnv(filePath, env) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (env[key] == null || env[key] === '') env[key] = value;
  }
}

function commandLines(cmd, args, timeout) {
  try {
    const result = spawnSync(cmd, args, {
      encoding: 'utf8',
      timeout: timeout || 8000,
      windowsHide: true
    });
    if (result.status !== 0) return [];
    return String(result.stdout || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !/^info:/i.test(line));
  } catch (_) {
    return [];
  }
}

function commandOk(cmd, args, timeout) {
  return commandLines(cmd, args, timeout).pop() || '';
}

function findNamedFile(root, name, maxDepth) {
  if (!root || !fs.existsSync(root)) return '';
  const wanted = String(name || '').toLowerCase();
  const stack = [{ dir: root, depth: 0 }];
  let visited = 0;
  while (stack.length && visited < 400) {
    const current = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(current.dir, { withFileTypes: true }); } catch (_) { continue; }
    visited += 1;
    for (const entry of entries) {
      const full = path.join(current.dir, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === wanted) return full;
      if (entry.isDirectory() && current.depth < maxDepth) stack.push({ dir: full, depth: current.depth + 1 });
    }
  }
  return '';
}

function pythonInstallCandidates(env, platform) {
  if (platform !== 'win32') return [];
  const local = env.LOCALAPPDATA || (env.USERPROFILE ? path.join(env.USERPROFILE, 'AppData', 'Local') : '');
  if (!local) return [];
  const root = path.join(local, 'Programs', 'Python');
  return ['Python313', 'Python312', 'Python311'].map((name) => path.join(root, name, 'python.exe'));
}

function llamaServerCandidates(env, platform) {
  const local = env.LOCALAPPDATA || (env.USERPROFILE ? path.join(env.USERPROFILE, 'AppData', 'Local') : '');
  const home = env.USERPROFILE || env.HOME || '';
  const exeName = platform === 'win32' ? 'llama-server.exe' : 'llama-server';
  const found = [];
  if (local) {
    const link = path.join(local, 'Microsoft', 'WinGet', 'Links', exeName);
    if (fs.existsSync(link)) found.push(link);
    const walked = findNamedFile(path.join(local, 'Microsoft', 'WinGet', 'Packages'), exeName, 4);
    if (walked) found.push(walked);
  }
  if (home) {
    const studio = findNamedFile(path.join(home, '.lmstudio'), exeName, 6);
    if (studio) found.push(studio);
  }
  return found;
}

function versionOk(exe) {
  const version = commandOk(exe, ['-c', 'import sys; print("%d.%d.%d" % sys.version_info[:3])']);
  const parts = version.split('.').map((n) => parseInt(n, 10));
  if (parts[0] > 3 || (parts[0] === 3 && parts[1] >= 11)) return version;
  return '';
}

function detectPython(platform, env, root) {
  if (root) {
    const venvExe = platform === 'win32'
      ? path.join(root, '.venv', 'Scripts', 'python.exe')
      : path.join(root, '.venv', 'bin', 'python');
    if (fs.existsSync(venvExe)) {
      const version = versionOk(venvExe);
      if (version) return { path: venvExe, version, source: 'venv' };
    }
  }
  const probes = platform === 'win32'
    ? [['py', ['-3']], ['py', []], ['python', []], ['python3', []]]
    : [['python3', []], ['python', []]];
  for (const [cmd, args] of probes) {
    const exe = commandOk(cmd, [...args, '-c', 'import sys; print(sys.executable)']);
    if (!exe) continue;
    const version = versionOk(exe);
    if (version) return { path: exe, version, source: 'path' };
  }
  for (const candidate of pythonInstallCandidates(env || {}, platform)) {
    if (!fs.existsSync(candidate)) continue;
    const version = versionOk(candidate);
    if (version) return { path: candidate, version, source: 'install-dir' };
  }
  return { path: '', version: '', source: '' };
}

function detectYtDlp(pythonPath, platform, env) {
  const lookup = platform === 'win32' ? 'where' : 'which';
  const fromPath = commandLines(lookup, ['yt-dlp']).find((entry) => fs.existsSync(entry));
  if (fromPath) return { path: fromPath, viaPython: false };
  const local = (env && env.LOCALAPPDATA) || '';
  if (platform === 'win32' && local) {
    const winget = path.join(local, 'Microsoft', 'WinGet', 'Links', 'yt-dlp.exe');
    if (fs.existsSync(winget)) return { path: winget, viaPython: false };
  }
  if (pythonPath) {
    const scripts = platform === 'win32'
      ? path.join(path.dirname(pythonPath), 'Scripts', 'yt-dlp.exe')
      : path.join(path.dirname(pythonPath), 'yt-dlp');
    if (fs.existsSync(scripts)) return { path: scripts, viaPython: false };
    const moduleProbe = commandOk(pythonPath, ['-c', 'import yt_dlp,sys; print("ok")']);
    if (moduleProbe === 'ok') return { path: pythonPath, viaPython: true };
  }
  return { path: '', viaPython: false };
}

function detectLlamaServer(platform, env) {
  const name = platform === 'win32' ? 'llama-server.exe' : 'llama-server';
  const lookup = platform === 'win32' ? 'where' : 'which';
  const fromPath = commandLines(lookup, [name]).find((entry) => fs.existsSync(entry));
  if (fromPath) return fromPath;
  return llamaServerCandidates(env || {}, platform)[0] || '';
}

function detectOllama(platform, env) {
  const lookup = platform === 'win32' ? 'where' : 'which';
  const name = platform === 'win32' ? 'ollama.exe' : 'ollama';
  const fromPath = commandLines(lookup, [name]).find((entry) => fs.existsSync(entry));
  if (fromPath) return fromPath;
  const local = (env && env.LOCALAPPDATA) || '';
  if (platform === 'win32' && local) {
    const installed = path.join(local, 'Programs', 'Ollama', 'ollama.exe');
    if (fs.existsSync(installed)) return installed;
  }
  return '';
}

function asBool(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === '1' || value.toLowerCase() === 'true') return true;
    if (value === '0' || value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

function asPort(value, fallback) {
  const n = parseInt(value, 10);
  if (!Number.isInteger(n) || n < 1 || n > 65535) return fallback;
  return n;
}

function loopbackHost(value, fallback) {
  const host = String(value || fallback || '127.0.0.1');
  if (host === '127.0.0.1' || host === 'localhost' || host === '::1') return host;
  return '127.0.0.1';
}

function loadConfig(options = {}) {
  const root = options.root || __dirname;
  const env = options.env || process.env;
  const platform = options.platform || process.platform;
  const detect = options.detectBinaries !== false;

  if (options.loadEnv !== false && env === process.env) {
    loadDotEnv(path.join(root, '.env'), env);
    loadDotEnv(path.join(root, '..', '.env'), env);
  }

  const example = readJson(path.join(root, 'config.example.json')) || {};
  const user = readJson(path.join(root, 'config.json')) || {};
  const cfg = { ...DEFAULTS, ...example, ...user };

  cfg.sidecarHost = loopbackHost(cfg.sidecarHost, DEFAULTS.sidecarHost);
  cfg.sidecarPort = asPort(cfg.sidecarPort, DEFAULTS.sidecarPort);
  cfg.llamaPort = asPort(cfg.llamaPort, DEFAULTS.llamaPort);
  cfg.llamaContext = asPort(cfg.llamaContext, DEFAULTS.llamaContext);
  cfg.autoStartSidecar = asBool(cfg.autoStartSidecar, true);
  cfg.llamaAutoStart = asBool(cfg.llamaAutoStart, false);
  cfg.piiFirewall = asBool(cfg.piiFirewall, true);
  cfg.stealthCloak = asBool(cfg.stealthCloak, false);
  cfg.llamaGpuLayers = Number.isFinite(Number(cfg.llamaGpuLayers)) ? Number(cfg.llamaGpuLayers) : 99;

  const set = (key, value) => {
    if (value != null && String(value).trim() !== '') cfg[key] = String(value).trim();
  };
  set('pythonPath', env.GIGACHAD_PYTHON);
  if (env.GIGACHAD_SIDECAR_PORT) cfg.sidecarPort = asPort(env.GIGACHAD_SIDECAR_PORT, cfg.sidecarPort);
  if (env.GIGACHAD_SIDECAR_HOST) cfg.sidecarHost = loopbackHost(env.GIGACHAD_SIDECAR_HOST, cfg.sidecarHost);
  set('llmBaseUrl', env.GIGACHAD_LLM_BASE_URL);
  set('llmApiKey', env.GIGACHAD_LLM_API_KEY);
  set('localModel', env.GIGACHAD_LOCAL_MODEL);
  set('omniModel', env.GIGACHAD_OMNI_MODEL);
  set('openRouterModel', env.GIGACHAD_OPENROUTER_MODEL);
  set('openRouterKey', env.OPENROUTER_API_KEY);
  set('elevenLabsKey', env.ELEVENLABS_API_KEY);
  set('llamaServerPath', env.GIGACHAD_LLAMA_SERVER);
  set('llamaModelPath', env.GIGACHAD_LLAMA_MODEL);
  set('ytdlpPath', env.GIGACHAD_YTDLP);
  if (env.GIGACHAD_LLAMA_AUTOSTART != null && env.GIGACHAD_LLAMA_AUTOSTART !== '') {
    cfg.llamaAutoStart = asBool(env.GIGACHAD_LLAMA_AUTOSTART, cfg.llamaAutoStart);
  }
  if (env.GIGACHAD_AUTO_SIDECAR != null && env.GIGACHAD_AUTO_SIDECAR !== '') {
    cfg.autoStartSidecar = asBool(env.GIGACHAD_AUTO_SIDECAR, cfg.autoStartSidecar);
  }

  cfg.pythonVersion = '';
  if (detect) {
    if (cfg.pythonPath && fs.existsSync(cfg.pythonPath)) {
      cfg.pythonVersion = commandOk(cfg.pythonPath, ['-c', 'import sys; print("%d.%d.%d" % sys.version_info[:3])']);
      cfg.pythonSource = 'config';
    } else if (!cfg.pythonPath) {
      const found = detectPython(platform, env, root);
      cfg.pythonPath = found.path;
      cfg.pythonVersion = found.version;
      cfg.pythonSource = found.source;
    }
    if (!cfg.ytdlpPath) {
      const ytdlp = detectYtDlp(cfg.pythonPath, platform, env);
      cfg.ytdlpPath = ytdlp.path;
      cfg.ytdlpViaPython = ytdlp.viaPython;
    } else {
      cfg.ytdlpViaPython = false;
    }
    if (!cfg.llamaServerPath) cfg.llamaServerPath = detectLlamaServer(platform, env);
    cfg.ollamaPath = detectOllama(platform, env);
  } else {
    cfg.ytdlpViaPython = false;
    cfg.ollamaPath = '';
    cfg.pythonSource = '';
  }
  cfg.llmBaseUrlExplicit = Boolean(String(user.llmBaseUrl || '').trim() || String(env.GIGACHAD_LLM_BASE_URL || '').trim());

  cfg.sidecarUrl = `http://${cfg.sidecarHost}:${cfg.sidecarPort}`;
  return cfg;
}

const EDITABLE_KEYS = [
  'pythonPath', 'sidecarHost', 'sidecarPort', 'autoStartSidecar',
  'llmBaseUrl', 'llmApiKey', 'localModel', 'omniModel',
  'openRouterBaseUrl', 'openRouterModel', 'openRouterKey', 'elevenLabsKey',
  'llamaAutoStart', 'llamaServerPath', 'llamaModelPath', 'llamaPort',
  'llamaContext', 'llamaGpuLayers', 'ytdlpPath', 'piiFirewall', 'stealthCloak'
];

function saveUserConfig(partial, options = {}) {
  const root = options.root || __dirname;
  const filePath = path.join(root, 'config.json');
  const current = readJson(filePath) || {};
  const next = { ...current };
  for (const key of EDITABLE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(partial, key)) continue;
    let value = partial[key];
    if (typeof value === 'string') value = value.trim();
    if (value === '' && ['openRouterKey', 'elevenLabsKey', 'llmApiKey', 'pythonPath', 'ytdlpPath', 'llamaServerPath', 'llamaModelPath'].includes(key)) continue;
    next[key] = value;
  }
  if (next.sidecarHost) next.sidecarHost = loopbackHost(next.sidecarHost, '127.0.0.1');
  if (next.sidecarPort) next.sidecarPort = asPort(next.sidecarPort, 8000);
  if (next.llamaPort) next.llamaPort = asPort(next.llamaPort, 11434);
  fs.writeFileSync(filePath, JSON.stringify(next, null, 2), { encoding: 'utf8', mode: 0o600 });
  try { fs.chmodSync(filePath, 0o600); } catch (_) {}
  return next;
}

function normalizeOpenAiBase(raw) {
  const u = new URL(String(raw || '').trim());
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('LLM base URL must be http or https');
  }
  let pathname = u.pathname.replace(/\/+$/, '');
  pathname = pathname.replace(/\/chat\/completions$/, '').replace(/\/models$/, '');
  if (!pathname) pathname = '/v1';
  return `${u.origin}${pathname}`;
}

module.exports = {
  DEFAULTS,
  EDITABLE_KEYS,
  loadConfig,
  saveUserConfig,
  normalizeOpenAiBase,
  loadDotEnv,
  pythonInstallCandidates,
  llamaServerCandidates,
  findNamedFile
};
