'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const helper = require('../scripts/alive-live-onion-probe.cjs');
const { TARGET, adaptMainSource, createOnionGate, evaluateEvidence, createStageJournal, stopRendererWithin, buildChildEnvironment, verifyTransportPreflight } = helper;
const { configuredTorPorts } = require('../systems/deep-web-transport');
const source = fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8');
const helperSource = fs.readFileSync(path.join(__dirname, '../scripts/alive-live-onion-probe.cjs'), 'utf8');

test('live probe uses portable explicit Tor configuration and pinned public metadata', () => {
  const executable = path.resolve('fixtures', 'tor executable');
  assert.equal(helper.resolveTorExecutable({ argv: [], env: { GIGACHAD_TOR_PATH: executable } }), executable);
  assert.equal(helper.resolveTorExecutable({ argv: ['--tor=' + executable], env: { GIGACHAD_TOR_PATH: 'ignored' } }), executable);
  for (const value of ['', 'relative/tor', executable + '\nextra', executable + '\u0000']) {
    assert.throws(() => helper.resolveTorExecutable({ argv: ['--tor=' + value], env: { GIGACHAD_TOR_PATH: executable } }), /absolute executable path/);
  }
  assert.throws(() => helper.resolveTorExecutable({ argv: [], env: {} }), /absolute executable path/);
  assert.throws(() => helper.resolveTorExecutable({ argv: ['--tor=' + executable, '--tor=' + executable], env: {} }), /only once/);
  assert.equal(helper.TARGET_SOURCE, 'https://onion.torproject.org/');
  assert.equal(require('../systems/deep-web-transport').validateOnionAddress(TARGET).valid, true);
  assert.doesNotMatch(helperSource, /live-tor-onion\.json|Z:\\\\Tools/);
});

function runEntry({ electron = false, childOptIn = false, isMain = false } = {}) {
  const calls = { child: 0, launcher: 0 }, moduleObject = { exports: {} };
  const context = { ...helper, module: moduleObject,
    require: { main: isMain ? moduleObject : { id: 'electron/js2c/browser_init' } },
    process: { versions: electron ? { electron: '35.7.5' } : {}, env: childOptIn ? { ALIVE_ONION_PROBE_CHILD: '1' } : {} },
    electronChild() { calls.child++; return Promise.resolve(); },
    launcher() { calls.launcher++; return Promise.resolve(); }
  };
  vm.runInNewContext(helperSource.slice(helperSource.indexOf('module.exports = { TARGET,')), context);
  return calls;
}

test('actual entry dispatch starts an explicitly owned Electron child when require.main is another bootstrap module', () => {
  assert.deepEqual(runEntry({ electron: true, childOptIn: true, isMain: false }), { child: 1, launcher: 0 });
});
test('actual entry dispatch keeps normal imports inert and starts only the Node main launcher', () => {
  assert.deepEqual(runEntry(), { child: 0, launcher: 0 });
  assert.deepEqual(runEntry({ electron: true }), { child: 0, launcher: 0 });
  assert.deepEqual(runEntry({ childOptIn: true }), { child: 0, launcher: 0 });
  assert.deepEqual(runEntry({ isMain: true }), { child: 0, launcher: 1 });
});
test('child environment maps both production Tor discovery paths to only the owned ephemeral port', () => {
  const baseEnv = { GIGACHAD_TOR_SOCKS_PORT: '9050', ELECTRON_RUN_AS_NODE: '1', NODE_OPTIONS: '--inspect', TEST_SENTINEL: 'retained' };
  const env = buildChildEnvironment({ baseEnv, port: 10977, profile: '/owned/profile', output: '/owned/output', executable: '/owned/electron' });
  assert.deepEqual(configuredTorPorts(env), [10977]);
  assert.deepEqual(configuredTorPorts(env, 9050), [10977], 'production shared selector honors owned environment over isolated cfg9050');
  assert.equal(env.ALIVE_ONION_PROBE_PORT, '10977');
  assert.equal(env.GIGACHAD_SMOKE, '1'); assert.equal(env.ALIVE_ONION_PROBE_CHILD, '1');
  assert.equal(env.ELECTRON_RUN_AS_NODE, undefined); assert.equal(env.NODE_OPTIONS, undefined);
  assert.equal(env.TEST_SENTINEL, 'retained'); assert.equal(baseEnv.GIGACHAD_TOR_SOCKS_PORT, '9050');
  assert.throws(() => buildChildEnvironment({ port: 0 }), /Invalid owned/);
});
test('production shared selector honors explicit configuration and fails closed on an invalid override', () => {
  assert.deepEqual(configuredTorPorts({}, 19050), [19050]);
  assert.deepEqual(configuredTorPorts({}), [9050, 9150]);
  assert.deepEqual(configuredTorPorts({ GIGACHAD_TOR_SOCKS_PORT: 'invalid' }, 9050), []);
  assert.deepEqual(configuredTorPorts({}, 70000), []);
});
test('transport preflight immediately rejects port9, DIRECT, or unverified production transport', () => {
  const probe = { ok: true, socksHandshakeVerified: true, socksPort: 10977, torPacApplied: true };
  assert.equal(verifyTransportPreflight(probe, 'SOCKS5 127.0.0.1:10977', 10977), true);
  assert.throws(() => verifyTransportPreflight(probe, 'SOCKS5 127.0.0.1:9', 10977), /route preflight failed/);
  assert.throws(() => verifyTransportPreflight(probe, 'DIRECT', 10977), /route preflight failed/);
  assert.throws(() => verifyTransportPreflight({ ...probe, socksPort: 9050 }, 'SOCKS5 127.0.0.1:10977', 10977), /did not confirm/);
  assert.throws(() => verifyTransportPreflight({ ...probe, socksHandshakeVerified: false }, 'SOCKS5 127.0.0.1:10977', 10977), /did not confirm/);
});
test('stage journal is bounded, records the entry marker synchronously, and survives a diagnostic write failure', () => {
  const writes = [], emitted = [];
  const journal = createStageJournal('/fixture', { now: () => 42, write: value => writes.push(value), emit: value => emitted.push(value) });
  journal.record('child-entered', { requireMainMatches: false });
  assert.equal(writes[0].stages[0].stage, 'child-entered');
  assert.equal(writes[0].stages[0].requireMainMatches, false);
  for (let i = 0; i < 100; i++) journal.record('stage-' + i);
  assert.equal(journal.snapshot().stages.length, 64);
  assert.equal(journal.snapshot().dropped, 37);
  assert.equal(emitted.length, 101);
  const failing = createStageJournal('/fixture', { write() { throw new Error('read-only diagnostic path'); }, emit: value => emitted.push(value) });
  assert.doesNotThrow(() => failing.record('child-entered'));
  assert.match(emitted.at(-1).journalWriteError, /read-only/);
});
test('renderer stop is bounded when executeJavaScript never settles and preserves actual rejection', async () => {
  let requests = 0;
  const blocked = { isDestroyed: () => false, webContents: { executeJavaScript() { requests++; return new Promise(() => {}); } } };
  const result = await stopRendererWithin(blocked, 15);
  assert.equal(result.status, 'unconfirmed'); assert.match(result.reason, /exceeded 15 ms/); assert.equal(requests, 1);
  const failed = await stopRendererWithin({ isDestroyed: () => false, webContents: { executeJavaScript: () => Promise.reject(new Error('renderer gone')) } }, 15);
  assert.match(failed.reason, /renderer gone/);
  assert.equal((await stopRendererWithin(null, 15)).status, 'not-needed');
});
test('actual finish writes a failing report before exiting even when renderer stop never settles', async () => {
  const start = helperSource.indexOf('async function finish(error) {');
  const end = helperSource.indexOf('  try {\n    const appPath', start);
  assert.ok(start > 0 && end > start);
  const calls = [], report = { sourceStart: {}, verdict: { passed: true } };
  const context = { finishing: false, timeout: null, clearTimeout, gate: { close() { calls.push('gate-closed'); }, snapshot: () => ({ closed: true }) },
    win: { isDestroyed: () => false, webContents: { executeJavaScript: () => new Promise(() => {}) } },
    stopRendererWithin: win => stopRendererWithin(win, 15), sourceHashes: () => ({}), report,
    journal: { record() {}, snapshot: () => ({ stages: [] }) }, path, output: '/fixture',
    writeJSON(file, value) { calls.push('report-written'); assert.equal(value.stop.status, 'unconfirmed'); assert.equal(value.verdict.passed, false); },
    console: { log() {} }, app: { exit(code) { calls.push('exit-' + code); } }
  };
  await vm.runInNewContext(helperSource.slice(start, end) + '\nfinish(new Error("test timeout"));', context);
  assert.deepEqual(calls, ['gate-closed', 'report-written', 'exit-1']);
});

test('actual main adaptation compiles and retains provider, proxy, tracker and isolated-config protections', () => {
  const adapted = adaptMainSource(source);
  assert.doesNotThrow(() => new vm.Script(adapted.source));
  assert.equal(adapted.evidence.exactOnceGuards, 7);
  assert.equal(adapted.evidence.providerFetchBlockUnchanged, true);
  assert.equal(adapted.evidence.portSelectionUnchanged, true);
  assert.match(adapted.source, /const ports = configuredTorPorts\(process\.env, cfg\.torSocksPort\);/);
  assert.match(adapted.source, /loadConfig\(\{ root: ROOT, isolated: SMOKE \}\)/);
  assert.match(adapted.source, /if \(SMOKE\) return \{ status: 'unavailable', reason: 'Providers disabled in isolated smoke mode' \};/);
  assert.match(adapted.source, /await vaultSession\.resolveProxy\(details\.url\)/);
  assert.match(adapted.source, /if \(!SMOKE && cfg\.torAutoStart\) managedTor\.start/);
});

test('adaptation fails closed on changed or duplicated request guards, or changed provider isolation', () => {
  const guard = 'if (!ownedLocalAsset) return callback({ cancel: true });';
  assert.throws(() => adaptMainSource(source.replace(guard, '/* changed guard */')), /exactly one/);
  assert.throws(() => adaptMainSource(source + '\n' + guard), /exactly one/);
  assert.throws(() => adaptMainSource(source.replace('Network providers are disabled in isolated smoke mode.', 'Changed provider behavior')), /provider rejection/);
  const portSelection = 'const ports = configuredTorPorts(process.env, cfg.torSocksPort);';
  assert.throws(() => adaptMainSource(source.replace(portSelection, 'const ports = [9050];')), /shared SOCKS port selection/);
  assert.throws(() => adaptMainSource(source + '\n' + portSelection), /shared SOCKS port selection/);
});

test('adapted completion observer invokes real tracker first and records actual details without inventing a receipt', () => {
  const adapted = adaptMainSource(source).source;
  const calls = [], callbacks = {};
  const lines = adapted.split('\n').filter(line => line.includes('vaultSession.webRequest.onCompleted(') || line.includes('vaultSession.webRequest.onErrorOccurred(')).join('\n');
  vm.runInNewContext(lines, {
    vaultSession: { webRequest: { onCompleted(fn) { callbacks.complete = fn; }, onErrorOccurred(fn) { callbacks.error = fn; } } },
    deepWebNavigation: { complete(details, error) { calls.push(['production', details, error]); } },
    __aliveLiveOnionProbe: { gate: { complete(details, error) { calls.push(['probe', details, error]); } } }
  });
  const details = { id: 41, webContentsId: 7, statusCode: 200, fromCache: false, url: TARGET };
  callbacks.complete(details);
  assert.deepEqual(calls.map(row => row[0]), ['production', 'probe']);
  assert.equal(calls[0][1], details); assert.equal(calls[1][1], details);
  callbacks.error({ ...details, error: 'net::ERR_ABORTED' });
  assert.equal(calls[2][2], 'net::ERR_ABORTED'); assert.equal(calls[3][2], 'net::ERR_ABORTED');
});

test('network admission requires exact owned guest, onion origin, read-only method and unexpired one-shot window', () => {
  let clock = 1000;
  const gate = createOnionGate({ now: () => clock });
  const request = { id: 1, webContentsId: 7, url: TARGET, method: 'GET', resourceType: 'mainFrame' };
  assert.equal(gate.allow(request), false);
  gate.open(7, 1000);
  assert.throws(() => gate.open(7, 1000), /only once/);
  for (const mutation of [{ webContentsId: 8 }, { method: 'POST' }, { url: 'https://example.org/' },
    { url: TARGET.replace('http:', 'https:') }, { url: TARGET.replace('http://', 'http://name:secret@') }]) {
    assert.equal(gate.allow({ ...request, ...mutation }), false);
  }
  assert.equal(gate.allow(request), true);
  gate.complete({ ...request, statusCode: 200, fromCache: false });
  assert.equal(gate.snapshot().mainFrames[0].statusCode, 200);
  clock = 2000;
  assert.equal(gate.allow({ ...request, id: 2 }), false);
  gate.close(); assert.equal(gate.snapshot().closed, true);
});

test('gate ignores synthetic/unadmitted completion and preserves actual network failure', () => {
  const gate = createOnionGate();
  gate.open(7, 1000);
  const details = { id: 1, webContentsId: 7, url: TARGET, method: 'GET', resourceType: 'mainFrame' };
  gate.complete(details);
  assert.equal(gate.snapshot().mainFrames.length, 0);
  gate.allow(details); gate.complete(details, 'net::ERR_PROXY_CONNECTION_FAILED');
  assert.equal(gate.snapshot().mainFrames[0].error, 'net::ERR_PROXY_CONNECTION_FAILED');
});

function validEvidence() {
  return { guestId: 7, port: 12345, exclusiveRoute: 'SOCKS5 127.0.0.1:12345',
    network: { mainFrames: [{ id: 9, webContentsId: 7, url: TARGET, statusCode: 200, fromCache: false, error: null }] },
    document: { url: TARGET, title: 'Tor Blog | The Tor Project', bodyExcerpt: 'Welcome to the Tor Blog', bodyLength: 1200, readyState: 'complete' },
    receipt: { requestId: 9, url: TARGET, status: 'loaded', httpStatus: 200, networkVerified: true, fromCache: false, proxyRoute: 'SOCKS5 127.0.0.1:12345' },
    badge: { text: 'Tor client idle · Onion loaded · SOCKS5', visible: true, verified: true, activeUrl: TARGET, guestId: 7 } };
}
test('success requires actual HTTP response, document, correlated receipt and visible current badge together', () => {
  assert.equal(evaluateEvidence(validEvidence()).passed, true);
  for (const [key, patch] of [
    ['document', { bodyLength: 0 }], ['document', { title: 'Connection failed' }],
    ['receipt', { networkVerified: false }], ['receipt', { requestId: 10 }], ['receipt', { fromCache: true }],
    ['badge', { visible: false }], ['badge', { verified: false }], ['badge', { guestId: 8 }],
    ['badge', { activeUrl: 'https://example.org/' }]
  ]) {
    const evidence = validEvidence(); evidence[key] = { ...evidence[key], ...patch };
    assert.equal(evaluateEvidence(evidence).passed, false, key + ' ' + JSON.stringify(patch));
  }
  const cached = validEvidence(); cached.network.mainFrames[0].fromCache = true;
  assert.equal(evaluateEvidence(cached).passed, false);
  const direct = validEvidence(); direct.exclusiveRoute = 'DIRECT';
  assert.equal(evaluateEvidence(direct).passed, false);
});
