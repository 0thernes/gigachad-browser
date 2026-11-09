'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const vm = require('node:vm');
const { validateOnionAddress, probeSocks5, configuredTorPorts, buildFailClosedPac, applyFailClosedProxy, createNavigationEvidence } = require('../systems/deep-web-transport');
const { configureDeepWebChromiumProxy, inspectTargetDomainCyberHat } = require('../systems/cortex-neural-cyber-engine');
const onion = 'duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion';
const url = 'https://' + onion + '/';

async function server(t, onSocket) {
  const sockets = new Set();
  const srv = net.createServer(sock => { sockets.add(sock); sock.once('close', () => sockets.delete(sock)); onSocket(sock); });
  await new Promise(resolve => srv.listen(0, '127.0.0.1', resolve));
  t.after(() => { for (const sock of sockets) sock.destroy(); return new Promise(resolve => srv.close(resolve)); });
  return srv.address().port;
}

test('checks real v3 checksums, versions, subdomains, and credential rejection', () => {
  assert.equal(validateOnionAddress(url).valid, true);
  assert.equal(validateOnionAddress('https://sub.' + onion + '/article').valid, true);
  assert.equal(validateOnionAddress('https://user:secret@' + onion).valid, false);
  assert.equal(validateOnionAddress('https://' + 'a'.repeat(56) + '.onion').valid, false);
  assert.equal(validateOnionAddress('javascript:' + onion).valid, false);
  assert.equal(validateOnionAddress('https://' + onion + '.example.com').valid, false);
});

test('all three Tor specification address vectors validate without native SHA3', () => {
  const examples = [
    'pg6mmjiyjmcrsslvykfwnntlaru7p5svn6y2ymmju6nubxndf4pscryd.onion',
    'sp3k262uwy4r2k3ycr5awluarykdpag6a7y33jxop4cs2lu5uz5sseqd.onion',
    'xa4r2iadxm55fbnqgwwi5mymqdcofiu3w6rpbtqn7b2dyn7mgwj64jyd.onion'
  ];
  for (const hostname of examples) {
    assert.equal(validateOnionAddress(hostname).valid, true, hostname);
    assert.equal(validateOnionAddress(hostname.toUpperCase() + '.').valid, true);
    assert.equal(validateOnionAddress((hostname[0] === 'a' ? 'b' : 'a') + hostname.slice(1)).valid, false);
  }
});

test('open TCP and HTTP sockets do not count as SOCKS5', async t => {
  const port = await server(t, sock => sock.once('data', () => sock.end('HTTP/1.1 200 OK\r\n\r\n')));
  const probe = await probeSocks5(port);
  assert.equal(probe.verified, false);
  assert.equal(probe.reason, 'unsupported_socks_response');
});

test('fragmented SOCKS greeting verifies only the no-auth protocol', async t => {
  const port = await server(t, sock => sock.once('data', greeting => {
    assert.deepEqual(greeting, Buffer.from([5, 1, 0]));
    sock.write(Buffer.from([5]));
    setTimeout(() => { if (!sock.destroyed) sock.write(Buffer.from([0])); }, 5);
  }));
  assert.equal((await probeSocks5(port)).verified, true);
});

test('silent and authentication-only sockets terminate without a false positive', async t => {
  const silent = await server(t, () => {});
  assert.equal((await probeSocks5(silent, { timeoutMs: 20 })).reason, 'handshake_timeout');
  const auth = await server(t, sock => sock.once('data', () => sock.end(Buffer.from([5, 2]))));
  assert.equal((await probeSocks5(auth)).verified, false);
  assert.equal((await probeSocks5(0)).reason, 'invalid_loopback_endpoint');
});

test('port configuration is bounded, explicit, and loopback only', () => {
  assert.deepEqual(configuredTorPorts({}), [9050, 9150]);
  assert.deepEqual(configuredTorPorts({ GIGACHAD_TOR_SOCKS_PORT: '19950' }), [19950]);
  assert.deepEqual(configuredTorPorts({ GIGACHAD_TOR_SOCKS_PORT: 'http://evil.test:9000' }), []);
  assert.deepEqual(configuredTorPorts({}, 19951), [19951]);
  assert.deepEqual(configuredTorPorts({}, 9050), [9050]);
  assert.deepEqual(configuredTorPorts({ GIGACHAD_TOR_SOCKS_PORT: '19950' }, 19951), [19950]);
  assert.deepEqual(configuredTorPorts({ GIGACHAD_TOR_SOCKS_PORT: 'bad' }, 19951), []);
  for (const invalid of [0, -1, 65536, 1.5, 'not-a-port']) assert.deepEqual(configuredTorPorts({}, invalid), []);
});

test('legacy proxy writer and recon share the explicit custom SOCKS port', async t => {
  let negotiations = 0;
  const port = await server(t, sock => sock.once('data', greeting => {
    assert.deepEqual(greeting, Buffer.from([5, 1, 0]));
    negotiations++;
    sock.end(Buffer.from([5, 0]));
  }));
  const expected = 'SOCKS5 127.0.0.1:' + port;
  const applied = [];
  const sess = {
    setProxy: async config => {
      const pac = Buffer.from(config.pacScript.split(',')[1], 'base64').toString();
      const sandbox = { shExpMatch: (host, expression) => host.endsWith(expression.slice(1)) };
      vm.runInNewContext(pac, sandbox);
      applied.push(sandbox.FindProxyForURL(url, onion));
    },
    resolveProxy: async () => applied.at(-1)
  };
  await applyFailClosedProxy([sess], { activeTorPort: port });
  const legacy = await configureDeepWebChromiumProxy([sess], 'auto', { socksPort: port, env: {} });
  assert.equal(legacy.ok, true);
  assert.equal(legacy.daemonStatus.activeTorPort, port);
  assert.deepEqual(Array.from(legacy.daemonStatus.probes, probe => probe.port), [port]);
  assert.deepEqual(applied, [expected, expected], 'second session writer must preserve configured endpoint');
  const recon = await inspectTargetDomainCyberHat('http://localhost', { socksPort: port, env: {} });
  assert.equal(recon.deepWebDaemons.activeTorPort, port);
  assert.equal(negotiations, 2);
});

test('PAC never falls back DIRECT for onion/I2P even when no proxy exists', () => {
  for (const status of [{}, { activeTorPort: 9150, i2pHttp4444: true }]) {
    const sandbox = { shExpMatch: (host, expression) => host.endsWith(expression.slice(1)) };
    vm.runInNewContext(buildFailClosedPac(status), sandbox);
    for (const host of [onion, onion.toUpperCase(), onion + '.', 'onion']) {
      const route = sandbox.FindProxyForURL('https://' + host, host);
      assert.equal(route, 'SOCKS5 127.0.0.1:' + (status.activeTorPort || 9));
      assert.ok(!route.includes('DIRECT'));
    }
    assert.equal(sandbox.FindProxyForURL('http://example.i2p', 'example.i2p'), 'PROXY 127.0.0.1:' + (status.i2pHttp4444 ? 4444 : 9));
    assert.equal(sandbox.FindProxyForURL('https://example.com', 'example.com'), 'DIRECT');
  }
});

test('proxy application surfaces setProxy and resolution errors instead of claiming success', async () => {
  const throws = { setProxy: async () => { throw new Error('fixture failure'); } };
  const direct = { setProxy: async () => {}, resolveProxy: async () => 'DIRECT' };
  const good = { setProxy: async cfg => assert.equal(cfg.mode, 'pac_script'), resolveProxy: async () => 'SOCKS5 127.0.0.1:9050' };
  const result = await applyFailClosedProxy([throws, direct, good], { activeTorPort: 9050 });
  assert.equal(result.ok, false);
  assert.equal(result.appliedCount, 1);
  assert.equal(result.errors.length, 2);
  assert.equal((await applyFailClosedProxy([good], { activeTorPort: 9050 })).ok, true);
});

test('network evidence requires uncached successful HTTP completion on the verified route', () => {
  const receipts = createNavigationEvidence();
  const start = { id: 1, webContentsId: 7, resourceType: 'mainFrame', url };
  receipts.begin(start, 'SOCKS5 127.0.0.1:9050', true);
  assert.equal(receipts.read(7, url).networkVerified, false);
  receipts.complete({ ...start, statusCode: 200, fromCache: false });
  assert.equal(receipts.read(7, url).networkVerified, true);
  assert.equal(receipts.read(7, 'https://example.com'), null);
  receipts.begin({ ...start, id: 2 }, 'SOCKS5 127.0.0.1:9050', true);
  receipts.complete({ ...start, id: 2, statusCode: 200, fromCache: true });
  assert.equal(receipts.read(7, url).networkVerified, false);
  receipts.begin({ ...start, id: 3 }, 'SOCKS5 127.0.0.1:9050', true);
  receipts.complete({ ...start, id: 3, statusCode: 503 });
  assert.equal(receipts.read(7, url).status, 'failed');
  assert.equal(receipts.read(7, url).networkVerified, false);
  receipts.begin({ ...start, id: 4 }, null, false);
  receipts.complete({ ...start, id: 4 }, 'net::ERR_PROXY_CONNECTION_FAILED');
  assert.equal(receipts.read(7, url).networkVerified, false);
});

test('new clearnet navigation and competing documents cannot retain old onion receipts', () => {
  const receipts = createNavigationEvidence();
  const onionReq = { id: 10, webContentsId: 4, resourceType: 'mainFrame', url };
  const publicReq = { ...onionReq, id: 11, url: 'https://example.com' };
  receipts.begin(onionReq, 'SOCKS5 127.0.0.1:9050', true);
  receipts.begin(publicReq, null, false);
  receipts.complete({ ...onionReq, statusCode: 200 });
  assert.equal(receipts.read(4, url), null);
  receipts.complete({ ...publicReq, statusCode: 200 });
  assert.equal(receipts.read(4, publicReq.url).onion, false);
  assert.equal(receipts.read(4, publicReq.url).networkVerified, false);
});

test('same-document anchors preserve onion evidence but new documents and reloads do not', () => {
  const receipts = createNavigationEvidence();
  const start = { id: 20, webContentsId: 7, resourceType: 'mainFrame', url: url + '?topic=art' };
  receipts.begin(start, 'SOCKS5 127.0.0.1:9050', true);
  receipts.complete({ ...start, statusCode: 200, fromCache: false });
  for (const fragment of ['#section', '#other', '#']) {
    assert.equal(receipts.read(7, start.url + fragment).networkVerified, true);
    assert.equal(receipts.read(7, start.url + fragment).url, start.url);
  }
  for (const other of [url + 'different?topic=art#section', url + '?topic=science#section',
    start.url.replace('https:', 'http:'), 'https://example.com/#section', 'not a URL']) {
    assert.equal(receipts.read(7, other), null, other);
  }
  assert.equal(receipts.read(8, start.url + '#section'), null);
  receipts.begin({ ...start, id: 21 }, 'SOCKS5 127.0.0.1:9050', true);
  assert.equal(receipts.read(7, start.url + '#section').status, 'loading');
  assert.equal(receipts.read(7, start.url + '#section').networkVerified, false);
  receipts.complete({ ...start, statusCode: 200, fromCache: false });
  assert.equal(receipts.read(7, start.url + '#section').networkVerified, false,
    'a late receipt for the old document cannot verify the reload');
  receipts.complete({ ...start, id: 21, statusCode: 200, fromCache: true });
  assert.equal(receipts.read(7, start.url + '#section').networkVerified, false,
    'a cached reload does not establish new network evidence');
});
