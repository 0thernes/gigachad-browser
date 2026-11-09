'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const SwarmGovernor = require('../systems/alive-swarm-budget-governor.js');

test('Pass 17 createSwarmBudgetGovernor enforces per-domain concurrency semaphores, token buckets, population ceiling and pause/kill-switch', () => {
  const gov = SwarmGovernor.createSwarmBudgetGovernor();
  const onionHost = SwarmGovernor.TARGET_DOMAINS.find(d => d.isOnion).host;

  // .onion maxConcurrent is 1
  const r1 = gov.tryAcquireRequest(onionHost);
  const r2 = gov.tryAcquireRequest(onionHost);
  assert.equal(r1.allowed, true);
  assert.equal(r2.allowed, false);
  assert.equal(r2.reason, 'DOMAIN_CONCURRENCY_SEMAPHORE_FULL');

  // Population ceiling is 15
  const sp = gov.requestSpawn(2);
  assert.equal(sp.spawned, false);
  assert.equal(sp.activePopulation, 15);

  // Pause blocks dispatches synchronously
  gov.refillStep();
  gov.pause();
  const rPaused = gov.tryAcquireRequest(onionHost);
  assert.equal(rPaused.allowed, false);
  assert.equal(rPaused.reason, 'GOVERNOR_PAUSED');

  gov.resume();
  const rResumed = gov.tryAcquireRequest(onionHost);
  assert.equal(rResumed.allowed, true);
});

test('Pass 17 run proves full-token-bucket-swarm-governor achieves 0 domain violations, 0 population breaches and 0 kill-switch leaks across 5 seeds', async () => {
  const report = await SwarmGovernor.run();
  assert.equal(report.status, 'completed');
  assert.equal(report.liveRuntimeModified, false);
  assert.equal(report.protocol.seeds.length, 5);
  assert.equal(report.summary.fullBeatNoKillSeeds, 5);
  assert.equal(report.summary.fullBeatGlobalOnlySeeds, 5);
  assert.equal(report.summary.zeroDomainViolationSeeds, 5);
  assert.equal(report.summary.zeroKillSwitchLeakSeeds, 5);

  const full = report.summary.byGovernor['full-token-bucket-swarm-governor'];
  assert.equal(full.domainConcurrencyViolations.mean, 0);
  assert.equal(full.tokenBucketOverruns.mean, 0);
  assert.equal(full.populationCapBreaches.mean, 0);
  assert.equal(full.killSwitchLeakCount.mean, 0);
  assert.equal(full.peakPopulation.mean, 15);
  assert.equal(full.governanceComplianceScore.mean, 100);
});

test('Pass 17 run rejects invalid seed arrays', async () => {
  await assert.rejects(() => SwarmGovernor.run({ seeds: [1] }), /Exactly five distinct seeds/);
});
