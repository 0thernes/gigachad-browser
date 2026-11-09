const test = require('node:test');
const assert = require('node:assert/strict');
const Ablations = require('../systems/alive-architecture-ablations.js');

test('AliveArchitectureAblations enforces five distinct 32-bit seeds', async () => {
  await assert.rejects(() => Ablations.run({ seeds: [1, 2, 3, 4] }), /five distinct unsigned 32-bit seeds/i);
  await assert.rejects(() => Ablations.run({ seeds: [1, 1, 2, 3, 4] }), /five distinct unsigned 32-bit seeds/i);
  await assert.rejects(() => Ablations.run({ seeds: [-1, 2, 3, 4, 5] }), /five distinct unsigned 32-bit seeds/i);
});

test('AliveArchitectureAblations is deterministic across 5 seeds and verifies causal contributions across all 14 brains, 7 precision routes, 3 strata, 5 specialists, AoT/ToT/GoT, and fabric pathways', async () => {
  const reportA = await Ablations.run();
  const reportB = await Ablations.run();

  assert.equal(reportA.status, 'completed');
  assert.equal(reportA.protocol.liveRuntimeModified, false);
  assert.equal(reportA.protocol.totalConditions, 38);
  assert.deepEqual(reportA.protocol.seeds, [19013, 29017, 39023, 49031, 59053]);

  // Determinism check
  assert.equal(
    reportA.summary.all14BrainsGroupDelta.mean,
    reportB.summary.all14BrainsGroupDelta.mean
  );
  assert.equal(
    reportA.summary.all7PrecisionGroupDelta.mean,
    reportB.summary.all7PrecisionGroupDelta.mean
  );
  assert.equal(
    reportA.summary.allReasoningGroupMarginLoss.mean,
    reportB.summary.allReasoningGroupMarginLoss.mean
  );

  // All 14 brains + group ablation are causal on 5/5 seeds
  assert.equal(reportA.summary.all14BrainsCausalOn5Seeds, true);
  for (const id of [...Ablations.BRAIN_SOURCES, 'all-14-brains']) {
    const entry = reportA.brains[id];
    assert.ok(entry, `Missing brain ablation entry: ${id}`);
    assert.equal(entry.nonZeroSeeds, 5, `${id} should have nonZeroSeeds=5`);
    assert(entry.sensoryDeltaL2.mean > 0, `${id} sensoryDeltaL2 should be positive`);
    assert(entry.latentDeltaL2.mean > 0, `${id} latentDeltaL2 should be positive`);
    assert(entry.motorDeltaL2.mean > 0, `${id} motorDeltaL2 should be positive`);
    assert(entry.contributionNorm.mean > 0, `${id} contributionNorm should be positive`);
  }

  // Group ablation of all 14 brains produces a strictly larger sensory delta than any individual brain
  const groupBrainDelta = reportA.brains['all-14-brains'].sensoryDeltaL2.mean;
  for (const id of Ablations.BRAIN_SOURCES) {
    assert(groupBrainDelta > reportA.brains[id].sensoryDeltaL2.mean);
  }

  // All 7 precision routes + group ablation are causal on 5/5 seeds
  assert.equal(reportA.summary.all7PrecisionRoutesCausalOn5Seeds, true);
  for (const id of [...Ablations.PRECISION_SOURCES, 'all-7-precision']) {
    const entry = reportA.precision[id];
    assert.ok(entry, `Missing precision ablation entry: ${id}`);
    assert.equal(entry.nonZeroSeeds, 5, `${id} should have nonZeroSeeds=5`);
    assert(entry.sensoryDeltaL2.mean > 0);
    assert(entry.latentDeltaL2.mean > 0);
    assert(entry.motorDeltaL2.mean > 0);
  }
  const groupPrecisionDelta = reportA.precision['all-7-precision'].sensoryDeltaL2.mean;
  for (const id of Ablations.PRECISION_SOURCES) {
    assert(groupPrecisionDelta > reportA.precision[id].sensoryDeltaL2.mean);
  }

  // All 3 scale strata and 5 specialist fusion readouts are causal on 5/5 seeds
  assert.equal(reportA.summary.all3StrataCausalOn5Seeds, true);
  for (const id of Ablations.STRATA_SOURCES) {
    const entry = reportA.strataAndSpecialists[id];
    assert.ok(entry, `Missing stratum entry: ${id}`);
    assert.equal(entry.nonZeroSeeds, 5);
    assert(entry.sensoryDeltaL2.mean > 0);
  }
  assert.equal(reportA.summary.all5SpecialistsCausalOn5Seeds, true);
  for (const id of Ablations.SPECIALIST_NAMES) {
    const entry = reportA.strataAndSpecialists[id];
    assert.ok(entry, `Missing specialist entry: ${id}`);
    assert.equal(entry.nonZeroSeeds, 5);
    assert(entry.residualDeltaL2.mean > 0);
  }

  // AoT, ToT, GoT and combined reasoning ablations are causal on 5/5 seeds
  assert.equal(reportA.summary.allReasoningComponentsCausalOn5Seeds, true);
  for (const id of Ablations.REASONING_COMPONENTS) {
    const entry = reportA.reasoning[id];
    assert.ok(entry, `Missing reasoning entry: ${id}`);
    assert.equal(entry.nonZeroSeeds, 5);
    assert(entry.marginLoss.mean > 0);
  }
  assert(reportA.reasoning['all-aot-tot-got'].marginLoss.mean > reportA.reasoning['AoT-contractor'].marginLoss.mean);
  assert(reportA.reasoning['all-aot-tot-got'].marginLoss.mean > reportA.reasoning['ToT-puct-tree'].marginLoss.mean);
  assert(reportA.reasoning['all-aot-tot-got'].marginLoss.mean > reportA.reasoning['GoT-dag-pagerank'].marginLoss.mean);

  // Fabric pathway ablations show positive holdout reward loss on 5/5 seeds
  for (const id of ['ghost-swarm-role-coupling', 'online-ranker-plasticity', 'full-fabric-plus-plasticity']) {
    const entry = reportA.fabricPathways[id];
    assert.ok(entry, `Missing fabric pathway entry: ${id}`);
    assert.equal(entry.nonZeroSeeds, 5);
    assert(entry.holdoutRewardLossWhenAblated.mean > 0);
    assert(entry.holdoutRewardLossWhenAblated.ci95[0] > 0);
  }
});
