'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { prepareOutboundMessages, isLoopbackEndpoint } = require('../systems/outbound-privacy-policy');
const { isTrustedChromeSender } = require('../systems/ipc-authorization');
const { normalizeOpenAiBase } = require('../config');

const source = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const marker = "ipcMain.handle('ai-query', ";
const start = source.indexOf(marker) + marker.length;
assert(start >= marker.length, 'AI handler exists');
const handlerSource = source.slice(start, source.indexOf('\n  });', start)) + '\n}';
const historySource = source.slice(source.indexOf('function sanitizeHistory('), source.indexOf('function sanitizeBoard('));
const image = 'data:image/png;base64,aGVsbG8=';
const redact = (text) => ({ redacted_text: text.replace(/[\w.+-]+@[\w.-]+/g, '[REDACTED_EMAIL]'), pii_redacted_count: (text.match(/[\w.+-]+@[\w.-]+/g) || []).length });

function harness(options = {}) {
  const requests = [];
  const checkedTexts = [];
  const sandbox = {
    cfg: {
      piiFirewall: true, allowCloudImages: options.allowCloudImages === true,
      sidecarUrl: 'http://127.0.0.1:1', llmBaseUrl: options.localEndpoint || 'http://127.0.0.1:1/v1',
      localModel: 'fixture-local', openRouterKey: 'fixture-not-a-real-key',
      openRouterModel: 'fixture-cloud', openRouterBaseUrl: 'https://provider.example.test/v1', ...options.config
    },
    SMOKE: false,
    fromChrome: () => true,
    isLoopbackHttp: () => false,
    normalizeOpenAiBase,
    prepareOutboundMessages,
    FREE_OMNI_MODELS: ['fixture-cloud', 'fixture-fallback'],
    NON_CHAT_MODEL_RE: /embed/,
    listLocalModels: async () => ({ models: ['fixture-local'], loadedModel: 'fixture-local' }),
    searchMemoryVault: async () => [{ title: 'Fixture memory', url: 'https://example.test', summary: 'memory@example.test' }],
    fetchJson: async (_url, init) => {
      const text = JSON.parse(init.body).text;
      checkedTexts.push(text);
      if (options.redactor === 'timeout') throw new Error('fixture timeout');
      if (options.redactor === 'http-error') return { ok: false, data: { error: 'unavailable' } };
      if (options.redactor === 'malformed') return { ok: true, data: { pii_redacted_count: 0 } };
      return { ok: true, data: redact(text) };
    },
    fetch: async (url, init) => {
      requests.push({ url, ...init, parsed: JSON.parse(init.body) });
      const fail = options.retry && requests.length === 1;
      return { ok: !fail, status: fail ? 429 : 200, text: async () => JSON.stringify(fail ? { error: 'rate limit' } : { choices: [{ message: { content: 'Fixture response' } }], usage: { prompt_tokens: 10, completion_tokens: 2 } }) };
    },
    mainWindow: null,
    AGENT_SYSTEM_PROMPT: 'Instructions from system@example.test',
    sreTelemetry: { totalAiCalls: 0, failedAiCalls: 0, aiLatenciesMs: [] },
    piiBlockedTotal: 0,
    activeAiAbort: null,
    AbortController, setTimeout, clearTimeout, URL
  };
  vm.createContext(sandbox);
  vm.runInContext(historySource, sandbox);
  const handler = vm.runInContext('(' + handlerSource + ')', sandbox);
  return { requests, checkedTexts, run: (extra = {}) => handler({}, {
    mode: options.mode || 'ultra', prompt: 'task@example.test', pageContext: 'page@example.test',
    history: [{ role: 'user', content: 'history-user@example.test' }, { role: 'assistant', content: 'history-assistant@example.test' }],
    ...extra
  }) };
}

(async () => {
  for (const local of ['http://127.0.0.1:1234/v1', 'http://127.1:1234/v1', 'http://localhost:1234/v1', 'http://[::1]:1234/v1']) assert.equal(isLoopbackEndpoint(local), true);
  for (const remote of ['https://localhost.example.test/v1', 'https://example.test/v1']) assert.equal(isLoopbackEndpoint(remote), false);
  assert.throws(() => isLoopbackEndpoint('file:///tmp/model'), { code: 'OUTBOUND_ENDPOINT_INVALID' });

  const normal = harness({ retry: true });
  assert.equal((await normal.run()).success, true);
  assert.equal(normal.requests.length, 2, 'provider retry is exercised');
  for (const request of normal.requests) {
    assert.equal(request.redirect, 'error', 'redirects cannot bypass destination classification');
    assert.equal(request.body.includes('@example.test'), false, 'system, history, page, task and memory are redacted on every attempt');
    assert.equal(request.parsed.messages.length, 4);
  }
  assert.equal(normal.checkedTexts.length, 4, 'same protected payload reused on model retry');

  for (const failure of ['timeout', 'http-error', 'malformed']) {
    const blocked = harness({ redactor: failure });
    const result = await blocked.run();
    assert.equal(result.success, false);
    assert.match(result.errorCode, /^PII_REDACTION_/);
    assert.equal(blocked.requests.length, 0, 'failed PII service never reaches a provider');
  }

  const remoteLocal = harness({ mode: 'local', localEndpoint: 'https://provider.example.test/v1', redactor: 'timeout' });
  assert.equal((await remoteLocal.run()).success, false);
  assert.equal(remoteLocal.requests.length, 0, 'remote endpoint cannot bypass protection through local UI mode');

  const local = harness({ mode: 'local', redactor: 'timeout' });
  assert.equal((await local.run()).success, true);
  assert.equal(local.checkedTexts.length, 0, 'loopback inference remains available without PII service');

  const deniedImage = harness();
  const rejected = await deniedImage.run({ screenshotBase64: image, includeScreenshot: true });
  assert.equal(rejected.errorCode, 'CLOUD_IMAGE_CONSENT_REQUIRED');
  assert.equal(deniedImage.requests.length, 0);
  assert.equal(deniedImage.checkedTexts.length, 0);
  const allowed = await deniedImage.run({ screenshotBase64: image, includeScreenshot: true, allowUnredactedImages: true });
  assert.equal(allowed.success, true, 'request can retry with explicit image consent');
  assert.equal(allowed.privacy.unredactedImagesAllowed, true);
  assert.equal(deniedImage.requests[0].parsed.messages.at(-1).content[1].image_url.url, image);
  const remembered = harness({ allowCloudImages: true, retry: true });
  assert.equal((await remembered.run({ screenshotBase64: image, includeScreenshot: true })).success, true);
  assert.equal(remembered.requests.length, 2);
  assert.equal(remembered.requests[1].body.includes('@example.test'), false);
  const disabledText = harness({ config: { piiFirewall: false }, redactor: 'timeout' });
  assert.equal((await disabledText.run()).success, true, 'explicit text-firewall disable remains supported');
  assert.equal((await disabledText.run({ screenshotBase64: image, includeScreenshot: true })).errorCode, 'CLOUD_IMAGE_CONSENT_REQUIRED', 'text opt-out is not image consent');

  await assert.rejects(() => prepareOutboundMessages({ endpoint: 'https://example.test', messages: [{ role: 'user', content: [{ type: 'audio', data: 'private' }] }], redactText: async (s) => redact(s) }), { code: 'OUTBOUND_MESSAGES_INVALID' });
  const pristine = [{ role: 'user', content: [{ type: 'text', text: 'fixture@example.test' }, { type: 'image_url', image_url: { url: image } }] }];
  const original = JSON.stringify(pristine);
  await prepareOutboundMessages({ endpoint: 'https://example.test', messages: pristine, allowUnredactedImages: true, redactText: async (s) => redact(s) });
  assert.equal(JSON.stringify(pristine), original, 'policy does not mutate application history');

  const frame = { url: 'app://chrome/index.html', parent: null };
  const contents = { mainFrame: frame, getURL: () => frame.url, isDestroyed: () => false };
  const window = { webContents: contents, isDestroyed: () => false };
  const trusted = (url) => url === 'app://chrome/index.html';
  const event = { sender: contents, senderFrame: frame };
  assert.equal(isTrustedChromeSender(event, window, trusted), true);
  for (const badEvent of [{ sender: {}, senderFrame: frame }, { sender: contents }, { sender: contents, senderFrame: { url: frame.url, parent: frame } }, { sender: contents, senderFrame: { url: 'https://attacker.example.test' } }]) assert.equal(isTrustedChromeSender(badEvent, window, trusted), false);
  frame.url = 'https://attacker.example.test';
  assert.equal(isTrustedChromeSender(event, window, trusted), false);
  frame.url = 'app://chrome/index.html'; frame.detached = true;
  assert.equal(isTrustedChromeSender(event, window, trusted), false);

  // Execute the actual quit callback with an owned server and child processes.
  const quitSource = source.slice(source.indexOf("app.on('will-quit',"));
  let serverClosed = false, childrenKilled = 0;
  const quitContext = { _localBrainsHttpServer: { close: () => { serverClosed = true; } }, sidecarProcess: { exitCode: null, kill: () => childrenKilled++ }, llamaProcess: { exitCode: null, kill: () => childrenKilled++ }, app: { on: (_event, fn) => fn() } };
  vm.runInNewContext(quitSource, quitContext);
  assert.equal(serverClosed, true);
  assert.equal(childrenKilled, 2);
  const registerStart = source.indexOf('function registerIpc()');
  assert(source.indexOf('let _localBrainsHttpServer = null;') < registerStart, 'quit-owned server is declared in module scope');

  // The isolated configuration branch must not inspect disk, environment getters or executables.
  const configSource = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');
  const blockedIo = new Proxy({}, { get: () => { throw new Error('Unexpected I/O in isolated config'); } });
  const configSandbox = { module: { exports: {} }, require: (name) => name === 'path' ? path : name === 'child_process' ? { spawnSync: () => { throw new Error('Unexpected process spawn'); } } : blockedIo };
  vm.runInNewContext(configSource, configSandbox);
  const isolatedOptions = { isolated: true, get root() { throw new Error('Disk root consulted'); }, get env() { throw new Error('Environment consulted'); } };
  const isolated = configSandbox.module.exports.loadConfig(isolatedOptions);
  assert.equal(isolated.autoStartSidecar, false);
  assert.equal(isolated.llamaAutoStart, false);
  assert.equal(isolated.openRouterKey, '');
  assert.equal(isolated.llmApiKey, '');
  assert.equal(isolated.allowCloudImages, false);
  assert.throws(() => configSandbox.module.exports.saveUserConfig({ openRouterKey: 'fixture' }, isolatedOptions), /disabled in isolated smoke/);
  const fetchStart = source.indexOf('const fetch = (...args) =>');
  const fetchEnd = source.indexOf('\n', source.indexOf(': globalThis.fetch(...args);', fetchStart));
  let unexpectedNetwork = 0;
  const smokeFetch = vm.runInNewContext(source.slice(fetchStart, fetchEnd) + '\nfetch;', { SMOKE: true, globalThis: { fetch: () => { unexpectedNetwork++; } } });
  await assert.rejects(() => smokeFetch('https://provider.example.test'), /disabled in isolated smoke/);
  assert.equal(unexpectedNetwork, 0);
  console.log('privacy, IPC authorization and shutdown smoke passed (mocked providers only)');
})().catch((error) => { console.error(error); process.exitCode = 1; });
