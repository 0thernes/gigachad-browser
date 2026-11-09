'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const SustainedPerf = require('../systems/alive-sustained-performance-qualifier.js');

test('Pass 9 sustained performance qualifier verifies 60Hz p99 budget compliance, zero post-warmup memory growth, and zero hidden draw overhead across 5 seeds', async () => {
  const report = await SustainedPerf.run();
  assert.equal(report.benchmark, 'pass-09-sustained-performance-qualification-v1');
  assert.equal(report.status, 'completed');
  assert.equal(report.protocol.seeds.length, 5);
  assert.deepEqual(report.protocol.regimes, [
    'unbounded-eager-all-lanes',
    'unbounded-history-no-eviction',
    'no-adapter-timeout-guard',
    'bounded-phase-ordered-60hz'
  ]);

  const s = report.summary;
  assert.equal(s.boundedBeatEagerSeeds, 5);
  assert.equal(s.boundedBeatNoTimeoutSeeds, 5);
  assert.equal(s.sub16msP99Seeds, 5);
  assert.equal(s.zeroPostWarmupGrowthSeeds, 5);
  assert.equal(s.zeroHiddenOverheadSeeds, 5);

  const bounded = s.byRegime['bounded-phase-ordered-60hz'];
  const eager = s.byRegime['unbounded-eager-all-lanes'];
  const noEvict = s.byRegime['unbounded-history-no-eviction'];
  const noTimeout = s.byRegime['no-adapter-timeout-guard'];

  assert.equal(bounded.qualificationScore.mean, 100);
  assert.ok(bounded.p99Ms.mean < 6.0, 'p99 tick latency well under 16.67ms 60Hz budget');
  assert.equal(bounded.budgetCompliancePct.mean, 100);
  assert.equal(bounded.postWarmupMemoryGrowthEntries.mean, 0);
  assert.equal(bounded.hiddenPanelDrawCalls.mean, 0);
  assert.equal(bounded.adapterRecoveryPct.mean, 100);
  assert.equal(bounded.stalledTicksFromHungAdapter.mean, 0);

  assert.ok(eager.p99Ms.mean > 25.0, 'unbounded-eager-all-lanes breaches 60Hz budget');
  assert.ok(noEvict.postWarmupMemoryGrowthEntries.mean > 200, 'unbounded-history-no-eviction leaks memory linearly');
  assert.ok(noTimeout.stalledTicksFromHungAdapter.mean > 100, 'no-adapter-timeout-guard stalls lanes');
});
