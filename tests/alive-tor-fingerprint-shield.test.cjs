'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const TorShield = require('../systems/alive-tor-fingerprint-shield.js');

test('Pass 14 Tor anti-fingerprinting shield verifies 0% cross-origin linkability, 0.0-bit static surface entropy, and 100% anonymity uniformity across 5 seeds', async () => {
  const report = await TorShield.run();
  assert.equal(report.benchmark, 'pass-14-tor-anti-fingerprinting-shield-v1');
  assert.equal(report.status, 'completed');
  assert.equal(report.protocol.seeds.length, 5);
  assert.deepEqual(report.protocol.shields, [
    'unprotected-native-chromium',
    'ua-header-spoof-only',
    'static-global-noise-injection',
    'full-tor-letterbox-fpd-shield'
  ]);

  const s = report.summary;
  assert.equal(s.fullBeatGlobalNoiseSeeds, 5);
  assert.equal(s.fullBeatNativeSeeds, 5);
  assert.equal(s.zeroCrossOriginLinkSeeds, 5);
  assert.equal(s.zeroStaticEntropySeeds, 5);

  const full = s.byShield['full-tor-letterbox-fpd-shield'];
  const globalNoise = s.byShield['static-global-noise-injection'];
  const native = s.byShield['unprotected-native-chromium'];

  assert.equal(full.anonymityScore.mean, 100);
  assert.equal(full.crossOriginUnlinkabilityPct.mean, 100);
  assert.equal(full.crossOriginLinkabilityPct.mean, 0);
  assert.equal(full.anonymitySetUniformityPct.mean, 100);
  assert.equal(full.staticSurfaceEntropyBits.mean, 0);
  assert.equal(full.distinctStaticSurfaces.mean, 1);

  assert.equal(globalNoise.crossOriginLinkabilityPct.mean, 100, 'static-global-noise-injection is 100% linkable across FPDs within the session');
  assert.ok(native.staticSurfaceEntropyBits.mean > 2.5, 'unprotected-native-chromium exposes hardware entropy');
});
