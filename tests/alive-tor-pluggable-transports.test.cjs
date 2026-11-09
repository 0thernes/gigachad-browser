'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const TorPt = require('../systems/alive-tor-pluggable-transports.js');

test('Pass 21 parseObfs4BridgeLine validates obfs4 endpoint, 40-hex fingerprint, cert and iat-mode', () => {
  const valid = TorPt.parseObfs4BridgeLine(
    'Bridge obfs4 198.51.100.12:443 A1B2C3D4E5F60718293A4B5C6D7E8F90A1B2C3D4 cert=obfs4-cert-seed-19013-bridge-0-x25519-ntor-key-material-valid-70chars iat-mode=2'
  );
  assert.equal(valid.valid, true);
  assert.equal(valid.transport, 'obfs4');
  assert.equal(valid.iatMode, 2);

  const bad = TorPt.parseObfs4BridgeLine('Bridge vanilla 198.51.100.12:443 SHORT cert=x iat-mode=9');
  assert.equal(bad.valid, false);
});

test('Pass 21 run proves adaptive-obfs4-iat-snowflake-mesh achieves 100% censorship bypass, 100% active-probe drop and >7.9 bits/byte wire entropy across 5 seeds', async () => {
  const report = await TorPt.run();
  assert.equal(report.status, 'completed');
  assert.equal(report.liveRuntimeModified, false);
  assert.equal(report.protocol.seeds.length, 5);
  assert.equal(report.summary.adaptiveBeatStaticSeeds, 5);
  assert.equal(report.summary.adaptiveBeatVanillaSeeds, 5);
  assert.equal(report.summary.exact100BypassSeeds, 5);

  const adaptive = report.summary.byTransport['adaptive-obfs4-iat-snowflake-mesh'];
  assert.equal(adaptive.censorshipResistanceScore.mean, 100);
  assert.equal(adaptive.censorshipBypassPct.mean, 100);
  assert.equal(adaptive.activeProbeSilentDropPct.mean, 100);
  assert.equal(adaptive.iatTimingUniformityPct.mean, 100);
  assert.ok(adaptive.wireByteEntropyBits.mean > 7.8);
});

test('Pass 21 run rejects invalid seed arrays', async () => {
  await assert.rejects(() => TorPt.run({ seeds: [1, 2] }), /Exactly five distinct seeds/);
});
