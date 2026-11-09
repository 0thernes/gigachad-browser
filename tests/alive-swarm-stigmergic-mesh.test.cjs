'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const StigmergicMesh = require('../systems/alive-swarm-stigmergic-mesh.js');

test('Pass 18 canonicalizeFrontierUrl strips cosmetic tracking parameters and normalizes parameter order', () => {
  const a = StigmergicMesh.canonicalizeFrontierUrl('https://ArXiv.org/paper/123/?tier=1&topic=swarm&utm_source=locust_99&ref=flock');
  const b = StigmergicMesh.canonicalizeFrontierUrl('https://arxiv.org/paper/123?topic=swarm&tier=1&fbclid=xyz');
  assert.equal(a.canonicalUrl, b.canonicalUrl);
  assert.equal(a.canonicalDigestSha256, b.canonicalDigestSha256);
});

test('Pass 18 run proves full-stigmergic-bft-consensus-mesh achieves 100% truth acceptance, 100% Byzantine rejection, 0 duplicate fetches and 0 dead-end followups across 5 seeds', async () => {
  const report = await StigmergicMesh.run();
  assert.equal(report.status, 'completed');
  assert.equal(report.liveRuntimeModified, false);
  assert.equal(report.protocol.seeds.length, 5);
  assert.equal(report.summary.fullBeatNoBftSeeds, 5);
  assert.equal(report.summary.fullBeatDedupOnlySeeds, 5);
  assert.equal(report.summary.zeroByzantinePoisonSeeds, 5);
  assert.equal(report.summary.zeroDuplicateFetchSeeds, 5);

  const full = report.summary.byMesh['full-stigmergic-bft-consensus-mesh'];
  assert.equal(full.stigmergicMeshScore.mean, 100);
  assert.equal(full.truthAcceptancePct.mean, 100);
  assert.equal(full.byzantineRejectionPct.mean, 100);
  assert.equal(full.duplicateFrontierFetches.mean, 0);
  assert.equal(full.deadEndTrapFollowups.mean, 0);
  assert.equal(full.poisonedClaimsInGraph.mean, 0);
});

test('Pass 18 run rejects invalid seed arrays', async () => {
  await assert.rejects(() => StigmergicMesh.run({ seeds: [1] }), /Exactly five distinct seeds/);
});
