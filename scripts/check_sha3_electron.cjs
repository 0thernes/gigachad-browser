'use strict';
// Run with the installed Electron executable. No windows, guest navigation,
// service startup, or network requests; verifies the actual embedded runtime.
const { app } = require('electron');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { sha3_256 } = require('../systems/sha3-256.cjs');
const { validateOnionAddress, createNavigationEvidence } = require('../systems/deep-web-transport');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'gigachad-sha3-check-')));
app.disableHardwareAcceleration();
try {
  const vectors = [
    [Buffer.alloc(0), 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a'],
    [Buffer.from('abc'), '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532'],
    [Buffer.alloc(200, 0xa3), '79f38adec5c20307a98ef76e8324afbfd46cfd81b22e3973c65fa1bd9de31787']
  ];
  for (const [input, expected] of vectors) assert.equal(Buffer.from(sha3_256(input)).toString('hex'), expected);
  const official = 'http://pzhdfe7jraknpj2qgu5cz2u3i4deuyfwmonvzu5i3nyw4t4bmg7o5pad.onion/';
  assert.equal(validateOnionAddress(official).valid, true);
  assert.equal(validateOnionAddress('http://' + 'a'.repeat(56) + '.onion').valid, false);
  const receipts = createNavigationEvidence();
  const fixture = { id: 1, webContentsId: 1, url: official, resourceType: 'mainFrame' };
  receipts.begin(fixture, 'SOCKS5 127.0.0.1:9050', true);
  receipts.complete({ ...fixture, statusCode: 200, fromCache: false });
  assert.equal(receipts.read(1, official).networkVerified, true, 'synthetic receipt path computes checksum without a native digest exception');
  let nativeSha3 = false, nativeError = null;
  try { crypto.createHash('sha3-256').update('abc').digest(); nativeSha3 = true; } catch (error) { nativeError = error.message; }
  console.log('SHA3_ELECTRON_OK ' + JSON.stringify({ electron: process.versions.electron, node: process.versions.node,
    openssl: process.versions.openssl, nativeSha3, nativeError, fixedVectors: vectors.length,
    validOnionAccepted: true, corruptOnionRejected: true, syntheticReceiptChecksum: true,
    networkRequests: 0, scope: 'Runtime compatibility and synthetic checksum checks only; no browser navigation or live Tor proof' }));
  app.exit(0);
} catch (error) {
  console.error('SHA3_ELECTRON_FAIL ' + error.stack); app.exit(1);
}
