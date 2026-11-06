const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { loadConfig, saveUserConfig, pythonInstallCandidates, llamaServerCandidates, findNamedFile } = require('../config');
const { loadBlocklist, loadFilters, isTrackerUrl } = require('../blocklist');

const root = path.join(__dirname, '..');
const patterns = loadBlocklist(path.join(root, 'tracker-blocklist.txt'));
assert.ok(patterns.length >= 10, 'blocklist should contain patterns');
assert.equal(isTrackerUrl('https://ad.doubleclick.net/pagead', patterns), true);
assert.equal(isTrackerUrl('https://example.com/article', patterns), false);
assert.equal(patterns.includes('googletagmanager.com'), false);
assert.equal(patterns.includes('connect.facebook.net'), false);
assert.equal(isTrackerUrl('https://connect.facebook.net/en_US/fbevents.js', patterns), true);
assert.equal(isTrackerUrl('https://connect.facebook.net/en_US/sdk.js', patterns), false);
assert.equal(isTrackerUrl('https://ad.doubleclick.net/pagead', patterns, ['doubleclick.net']), false);

const filters = loadFilters(
  [path.join(root, 'tracker-blocklist.txt')],
  [path.join(root, 'tracker-allowlist.txt')]
);
assert.ok(filters.block.length >= 20);
assert.ok(Array.isArray(filters.allow));

const localRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gigachad-win-'));
const pyDir = path.join(localRoot, 'Programs', 'Python', 'Python312');
fs.mkdirSync(pyDir, { recursive: true });
fs.writeFileSync(path.join(pyDir, 'python.exe'), '');
const candidates = pythonInstallCandidates({ LOCALAPPDATA: localRoot }, 'win32');
assert.ok(candidates.some((entry) => entry.endsWith(path.join('Python312', 'python.exe'))));
const llamaDir = path.join(localRoot, 'Microsoft', 'WinGet', 'Packages', 'ggml', 'bin');
fs.mkdirSync(llamaDir, { recursive: true });
fs.writeFileSync(path.join(llamaDir, 'llama-server.exe'), '');
const foundLlama = findNamedFile(path.join(localRoot, 'Microsoft', 'WinGet', 'Packages'), 'llama-server.exe', 4);
assert.ok(foundLlama.endsWith('llama-server.exe'));
const llamaHits = llamaServerCandidates({ LOCALAPPDATA: localRoot, USERPROFILE: localRoot }, 'win32');
assert.ok(llamaHits.some((entry) => entry.endsWith('llama-server.exe')));

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gigachad-cfg-'));
fs.copyFileSync(path.join(root, 'config.example.json'), path.join(temp, 'config.example.json'));
const cfg = loadConfig({ root: temp, env: {}, detectBinaries: false, loadEnv: false });
assert.equal(cfg.sidecarHost, '127.0.0.1');
assert.equal(cfg.sidecarPort, 8000);
assert.equal(cfg.llamaAutoStart, false);
assert.equal(cfg.autoStartSidecar, true);
assert.equal(cfg.llmBaseUrl, 'http://127.0.0.1:11434/v1');
assert.ok(!JSON.stringify(cfg).includes('Alexa'));

const withEnv = loadConfig({
  root: temp,
  env: { GIGACHAD_SIDECAR_PORT: '9001', OPENROUTER_API_KEY: 'test-key', GIGACHAD_LLM_BASE_URL: 'http://127.0.0.1:1234/v1' },
  detectBinaries: false,
  loadEnv: false
});
assert.equal(withEnv.sidecarPort, 9001);
assert.equal(withEnv.openRouterKey, 'test-key');
assert.equal(withEnv.llmBaseUrl, 'http://127.0.0.1:1234/v1');

saveUserConfig({ openRouterKey: 'saved-key', localModel: 'demo-model', sidecarHost: 'evil.example' }, { root: temp });
const saved = loadConfig({ root: temp, env: {}, detectBinaries: false, loadEnv: false });
assert.equal(saved.openRouterKey, 'saved-key');
assert.equal(saved.localModel, 'demo-model');
assert.equal(saved.sidecarHost, '127.0.0.1');
assert.equal(saved.llmBaseUrlExplicit, false);
assert.equal(withEnv.llmBaseUrlExplicit, true);

const banned = ['Users\\Alexa', 'Users/Alexa'];
const files = ['main.js', 'config.js', 'preload.js', 'laya_sidecar.py', 'index.html', 'LAUNCH_BROWSER.bat', 'start-gigachad.ps1', 'setup-backends.ps1', 'ci-verify.ps1'];
for (const file of files) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  const body = fs.readFileSync(full, 'utf8');
  for (const needle of banned) {
    if (body.includes(needle)) {
      console.error(file + ' still contains ' + needle);
      process.exit(1);
    }
  }
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const needle of ['EmbeddingGemma', 'MiniCPM', 'nodeIntegration: true', "require('electron')"]) {
  if (html.includes(needle)) {
    console.error('index.html still contains ' + needle);
    process.exit(1);
  }
}
if (!html.includes('contextIsolation=yes, nodeIntegration=no, sandbox=yes')) {
  console.error('guest webview preferences missing');
  process.exit(1);
}

console.log('config and blocklist smoke passed');
