'use strict';
// Actual Chromium transport test against a loopback SOCKS fixture. This never
// contacts an onion service and does not claim a live Tor circuit.
const { app, session } = require('electron');
const assert = require('node:assert/strict');
const net = require('node:net');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { applyFailClosedProxy, probeSocks5 } = require('../systems/deep-web-transport');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'gigachad-tor-fixture-')));
app.disableHardwareAcceleration();
const host = 'duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion';
const sockets = new Set(), connected = [];
let server;
const timer = setTimeout(() => { console.error('SOCKS_CHROMIUM_TIMEOUT'); app.exit(1); }, 15000);
app.whenReady().then(async () => {
  server = net.createServer(sock => {
    sockets.add(sock); sock.on('error', () => {}); sock.once('close', () => sockets.delete(sock));
    let phase = 'greeting', buffer = Buffer.alloc(0);
    sock.on('data', data => {
      buffer = Buffer.concat([buffer, data]);
      if (phase === 'greeting') {
        if (buffer.length < 2 || buffer.length < 2 + buffer[1]) return;
        assert.equal(buffer[0], 5);
        buffer = buffer.subarray(2 + buffer[1]); phase = 'connect';
        sock.write(Buffer.from([5, 0]));
      }
      if (phase === 'connect' && buffer.length >= 5) {
        assert.equal(buffer[3], 3, 'Chromium must pass domain to SOCKS, not resolve onion locally');
        const size = buffer[4]; if (buffer.length < size + 7) return;
        const hostname = buffer.subarray(5, size + 5).toString();
        assert.equal(hostname, host); connected.push(hostname);
        buffer = buffer.subarray(size + 7); phase = 'http';
        sock.write(Buffer.from([5, 0, 0, 1, 127, 0, 0, 1, 0, 80]));
      }
      if (phase === 'http' && buffer.includes('\r\n\r\n')) {
        phase = 'done';
        sock.end('HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 19\r\nConnection: close\r\n\r\nloopback fixture OK');
      }
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  assert.equal((await probeSocks5(port)).verified, true);
  const sess = session.fromPartition('deep-web-loopback-test', { cache: false });
  const setup = await applyFailClosedProxy([sess], { activeTorPort: port });
  assert.equal(setup.ok, true, JSON.stringify(setup.errors));
  const route = await sess.resolveProxy('http://' + host + '/');
  assert.equal(route, `SOCKS5 127.0.0.1:${port}`);
  const response = await sess.fetch('http://' + host + '/fixture', { cache: 'no-store' });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'loopback fixture OK');
  assert.equal(connected.length, 1);
  const absent = await applyFailClosedProxy([sess], {});
  assert.equal(absent.ok, true);
  assert.equal(await sess.resolveProxy('http://' + host + '/'), 'SOCKS5 127.0.0.1:9');
  console.log('SOCKS_CHROMIUM_OK ' + JSON.stringify({ route, remoteHostnameForwarded: connected[0], liveTor: false, externalNetwork: false }));
  clearTimeout(timer); app.exit(0);
}).catch(error => { console.error(error.stack); clearTimeout(timer); app.exit(1); });
app.on('will-quit', () => { for (const sock of sockets) sock.destroy(); if (server) server.close(); });
