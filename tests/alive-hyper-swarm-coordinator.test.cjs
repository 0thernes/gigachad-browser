'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const HyperSwarm = require('../systems/alive-hyper-swarm-coordinator.js');

test('Pass 16 createSwarmPopulation assigns explicit identity and independent vs shared model ownership across 15 entities', () => {
  const cloned = HyperSwarm.createSwarmPopulation(19013, 'cloned-tab-flock');
  const triGuild = HyperSwarm.createSwarmPopulation(19013, 'tri-guild-hybrid-synergy-swarm');

  assert.equal(cloned.length, 15);
  assert.equal(triGuild.length, 15);
  assert.equal(cloned[0].weights, cloned[14].weights, 'cloned-tab-flock shares identical weight reference');
  assert.notEqual(triGuild[0].weights, triGuild[1].weights, 'tri-guild entities own independent weight vectors');
  assert.equal(new Set(triGuild.map(e => e.identityDigestSha256)).size, 15, 'all 15 entities have distinct identity digests');
});

test('Pass 16 run proves tri-guild-hybrid-synergy-swarm beats cloned-tab-flock, uncoordinated, and homogeneous swarms on 5/5 seeds', async () => {
  const report = await HyperSwarm.run();
  assert.equal(report.status, 'completed');
  assert.equal(report.liveRuntimeModified, false);
  assert.equal(report.protocol.seeds.length, 5);
  assert.equal(report.protocol.entitiesPerSeed, 15);
  assert.equal(report.summary.triBeatClonedSeeds, 5);
  assert.equal(report.summary.triBeatUncoordSeeds, 5);
  assert.equal(report.summary.triBeatHomogeneousSeeds, 5);
  assert.equal(report.summary.zeroRedundancySeeds, 5);

  const tri = report.summary.byMode['tri-guild-hybrid-synergy-swarm'];
  const cloned = report.summary.byMode['cloned-tab-flock'];
  assert.equal(tri.pipelineCompletionPct.mean, 100);
  assert.equal(tri.redundantWorkPct.mean, 0);
  assert.ok(tri.guildRoleSpecializationJsd.mean > 0.95);
  assert.ok(tri.interEntityWeightDistance.mean > 0.15);
  assert.equal(cloned.interEntityWeightDistance.mean, 0);
  assert.equal(cloned.guildRoleSpecializationJsd.mean, 0);
});

test('Pass 16 run rejects invalid seed arrays', async () => {
  await assert.rejects(() => HyperSwarm.run({ seeds: [1, 2] }), /Exactly five distinct seeds/);
});
