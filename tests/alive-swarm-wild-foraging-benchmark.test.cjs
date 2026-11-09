'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const WildForaging = require('../systems/alive-swarm-wild-foraging-benchmark.js');

test('Pass 19 buildWildWebGraph constructs 36 multi-hop clearnet + v3 .onion nodes across 6 FPDs', () => {
  const g = WildForaging.buildWildWebGraph(19013);
  assert.equal(g.length, 36);
  assert.equal(g.filter(n => n.kind === 'corroborated-research-chain').length, 24);
  assert.equal(g.filter(n => n.isOnion).length, 18);
});

test('Pass 19 run proves stigmergic-tor-hybrid-synergy-swarm achieves 100% corroborated discovery, 100% .onion FPD isolation and 0 honeypots across 5 seeds', async () => {
  const report = await WildForaging.run();
  assert.equal(report.status, 'completed');
  assert.equal(report.liveRuntimeModified, false);
  assert.equal(report.protocol.seeds.length, 5);
  assert.equal(report.summary.hybridBeatFifoSeeds, 5);
  assert.equal(report.summary.hybridBeatSolitarySeeds, 5);
  assert.equal(report.summary.hybridBeatFlockSeeds, 5);
  assert.equal(report.summary.exact100DiscoverySeeds, 5);

  const hybrid = report.summary.byTopology['stigmergic-tor-hybrid-synergy-swarm'];
  assert.equal(hybrid.wildForagingScore.mean, 100);
  assert.equal(hybrid.corroboratedDiscoveryPct.mean, 100);
  assert.equal(hybrid.onionCircuitIsolationPct.mean, 100);
  assert.equal(hybrid.honeypotContaminationCount.mean, 0);
  assert.equal(hybrid.throttled429Count.mean, 0);
});

test('Pass 19 run rejects invalid seed arrays', async () => {
  await assert.rejects(() => WildForaging.run({ seeds: [1, 2] }), /Exactly five distinct seeds/);
});
