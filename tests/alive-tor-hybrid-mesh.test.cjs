'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const TorHybridMesh = require('../systems/alive-tor-hybrid-mesh.js');

test('Pass 11 Tor Hybrid Synergy Mesh verifies IsolateSOCKSAuth per-FPD circuits, zero leaks, and 100% fail-closed daemon drop protection across 5 seeds', async () => {
  const report = await TorHybridMesh.run();
  assert.equal(report.benchmark, 'pass-11-tor-hybrid-mesh-session-isolation-v1');
  assert.equal(report.status, 'completed');
  assert.equal(report.protocol.seeds.length, 5);
  assert.deepEqual(report.protocol.architectures, [
    'shared-session-direct',
    'naive-socks-proxy-only',
    'partitioned-storage-no-socks-auth',
    'full-tor-hybrid-synergy-mesh'
  ]);

  const s = report.summary;
  assert.equal(s.fullBeatPartitionedSeeds, 5);
  assert.equal(s.fullBeatNaiveSocksSeeds, 5);
  assert.equal(s.zeroLeakSeeds, 5);
  assert.equal(s.exactFailClosedSeeds, 5);

  const full = s.byArchitecture['full-tor-hybrid-synergy-mesh'];
  const part = s.byArchitecture['partitioned-storage-no-socks-auth'];
  const naive = s.byArchitecture['naive-socks-proxy-only'];

  assert.equal(full.isolationScore.mean, 100);
  assert.equal(full.fpdIsolationPct.mean, 100);
  assert.equal(full.failClosedPct.mean, 100);
  assert.equal(full.totalLeaks.mean, 0);
  assert.equal(full.dnsLeaks.mean, 0);
  assert.equal(full.webrtcLeaks.mean, 0);
  assert.equal(full.directIpLeaks.mean, 0);
  assert.equal(full.crossOriginStorageLeaks.mean, 0);
  assert.equal(full.crossFpdCircuitCollusions.mean, 0);
  assert.equal(full.distinctFpdCircuits.mean, 5, '5 distinct Tor circuits allocated across 5 First-Party Domains via IsolateSOCKSAuth');

  assert.ok(part.crossFpdCircuitCollusions.mean > 0, 'partitioned-storage-no-socks-auth shares circuits across FPDs');
  assert.ok(naive.dnsLeaks.mean > 0, 'naive-socks-proxy-only leaks local DNS without MAP * ~NOTFOUND');
  assert.ok(naive.webrtcLeaks.mean > 0, 'naive-socks-proxy-only leaks WebRTC STUN UDP');
});
