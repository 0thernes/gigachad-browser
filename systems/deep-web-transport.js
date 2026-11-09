'use strict';

// A SOCKS greeting establishes protocol availability, never daemon identity or a
// Tor circuit. Network receipts below are observations, not anonymity guarantees.
const net = require('node:net');
const { sha3_256 } = require('./sha3-256.cjs');

function validateOnionAddress(value) {
  let hostname;
  try {
    const parsed = new URL(String(value).includes('://') ? String(value) : 'http://' + String(value));
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
    hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  } catch (_) { return { valid: false, hostname: '', reason: 'invalid_url' }; }
  const labels = hostname.split('.');
  const address = labels.slice(-2).join('.');
  const label = labels.at(-2);
  if (labels.at(-1) !== 'onion' || !/^[a-z2-7]{56}$/.test(label || '')) return { valid: false, hostname, reason: 'not_v3_onion' };
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  const bytes = [];
  let bits = 0, accumulator = 0;
  for (const char of label) {
    accumulator = (accumulator << 5) | alphabet.indexOf(char); bits += 5;
    if (bits >= 8) { bits -= 8; bytes.push((accumulator >>> bits) & 255); }
  }
  const raw = Buffer.from(bytes);
  const checksum = Buffer.from(sha3_256(Buffer.concat([
    Buffer.from('.onion checksum'), raw.subarray(0, 32), Buffer.from([3])
  ]))).subarray(0, 2);
  const valid = raw.length === 35 && raw[34] === 3 && checksum.equals(raw.subarray(32, 34));
  return { valid, hostname, address, reason: valid ? 'checksum_valid_reachability_unknown' : 'invalid_version_or_checksum' };
}

function isOnionUrl(value) {
  try { return /(^|\.)onion\.?$/i.test(new URL(value).hostname); } catch (_) { return false; }
}

function probeSocks5(port, { timeoutMs = 650, host = '127.0.0.1' } = {}) {
  return new Promise(resolve => {
    const started = Date.now();
    const sock = new net.Socket();
    let settled = false, received = Buffer.alloc(0);
    const finish = (verified, reason) => {
      if (settled) return;
      settled = true; clearTimeout(deadline); sock.destroy();
      resolve({ port, host, verified, reason, checkedAt: Date.now(), elapsedMs: Date.now() - started });
    };
    const deadline = setTimeout(() => finish(false, 'handshake_timeout'), Math.max(10, Math.min(3000, timeoutMs)));
    sock.once('error', err => finish(false, err.code || 'socket_error'));
    sock.once('end', () => finish(false, 'closed_before_handshake'));
    sock.once('close', () => finish(false, 'closed_before_handshake'));
    sock.once('connect', () => sock.write(Buffer.from([5, 1, 0])));
    sock.on('data', chunk => {
      received = Buffer.concat([received, chunk]);
      if (received.length < 2) return;
      finish(received[0] === 5 && received[1] === 0,
        received[0] === 5 && received[1] === 0 ? 'socks5_no_auth_negotiated' : 'unsupported_socks_response');
    });
    if (!Number.isInteger(port) || port < 1 || port > 65535 || !['127.0.0.1', '::1'].includes(host)) finish(false, 'invalid_loopback_endpoint');
    else sock.connect(port, host);
  });
}

function configuredTorPorts(env = process.env, configuredPort) {
  // All session writers must select the same configured transport. An explicit
  // endpoint is exclusive: never silently switch to an unrelated SOCKS daemon.
  const override = String(env.GIGACHAD_TOR_SOCKS_PORT || '').trim();
  const supplied = configuredPort !== undefined && configuredPort !== null && String(configuredPort).trim() !== '';
  if (!override && !supplied) return [9050, 9150];
  const port = Number(override || configuredPort);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? [port] : [];
}

function buildFailClosedPac({ activeTorPort, i2pHttp4444 = false } = {}) {
  const port = Number.isInteger(activeTorPort) && activeTorPort > 0 && activeTorPort <= 65535 ? activeTorPort : 9;
  return `function FindProxyForURL(url, host) {
    var h = (host || '').toLowerCase().replace(/\\.$/, '');
    if (h === 'onion' || shExpMatch(h, '*.onion')) return 'SOCKS5 127.0.0.1:${port}';
    if (h === 'i2p' || shExpMatch(h, '*.i2p')) return 'PROXY 127.0.0.1:${i2pHttp4444 ? 4444 : 9}';
    return 'DIRECT';
  }`;
}

async function applyFailClosedProxy(sessions, status, mode = 'auto') {
  const pac = 'data:application/x-ns-proxy-autoconfig;base64,' + Buffer.from(buildFailClosedPac(status)).toString('base64');
  const errors = [], appliedSessions = [];
  for (const sess of sessions) {
    try {
      if (!sess || typeof sess.setProxy !== 'function') throw new Error('Session cannot configure proxy');
      const all = mode === 'tor_all';
      await sess.setProxy(all ? { mode: 'fixed_servers', proxyRules: 'socks5://127.0.0.1:' + (status.activeTorPort || 9), proxyBypassRules: '<-loopback>' }
        : { mode: 'pac_script', pacScript: pac });
      const expected = `SOCKS5 127.0.0.1:${status.activeTorPort || 9}`;
      // Synthetic DNS name is only passed to the proxy resolver; no request is sent.
      const route = await sess.resolveProxy('http://' + 'a'.repeat(56) + '.onion/');
      if (route !== expected) throw new Error('Onion route did not resolve exclusively to expected SOCKS5 endpoint');
      appliedSessions.push(sess);
    } catch (error) { errors.push(String(error.message || error)); }
  }
  return { ok: sessions.length > 0 && appliedSessions.length === sessions.length, mode, failClosed: true,
    appliedCount: appliedSessions.length, errors, appliedSessions };
}

function createNavigationEvidence() {
  const pending = new Map(), latest = new Map();
  const put = (id, value) => { latest.delete(id); latest.set(id, value); while (latest.size > 64) latest.delete(latest.keys().next().value); };
  return {
    begin(details, proxyRoute, verified) {
      if (details.resourceType !== 'mainFrame') return;
      // Every main-frame request replaces the old receipt, including clearnet.
      put(details.webContentsId, { requestId: details.id, url: details.url, status: 'loading', onion: isOnionUrl(details.url), observedAt: Date.now(), networkVerified: false });
      pending.set(details.id, { webContentsId: details.webContentsId, url: details.url, proxyRoute, verified });
      while (pending.size > 128) pending.delete(pending.keys().next().value);
    },
    complete(details, error = '') {
      const start = pending.get(details.id); pending.delete(details.id);
      if (!start || latest.get(start.webContentsId)?.requestId !== details.id) return;
      const valid = validateOnionAddress(details.url).valid;
      const loaded = !error && details.statusCode >= 200 && details.statusCode < 400;
      put(start.webContentsId, { requestId: details.id, url: details.url, status: loaded ? 'loaded' : 'failed', onion: isOnionUrl(details.url),
        observedAt: Date.now(), httpStatus: details.statusCode || null, error: error || null,
        proxyRoute: start.proxyRoute || null, fromCache: typeof details.fromCache === 'boolean' ? details.fromCache : null,
        networkVerified: loaded && valid && start.verified && details.fromCache === false });
    },
    read(wcId, currentUrl) {
      const value = latest.get(wcId);
      if (!value) return null;
      try {
        // Fragments are client-side document locations and do not appear in the
        // HTTP request receipt. Preserve its evidence across an anchor jump,
        // while requiring the same origin, path and query. New main-frame
        // requests still replace the receipt in begin(), including reloads.
        const recorded = new URL(value.url), current = new URL(currentUrl);
        recorded.hash = ''; current.hash = '';
        return recorded.href === current.href ? { ...value } : null;
      } catch (_) { return null; }
    }
  };
}

module.exports = { validateOnionAddress, isOnionUrl, probeSocks5, configuredTorPorts, buildFailClosedPac, applyFailClosedProxy, createNavigationEvidence };
