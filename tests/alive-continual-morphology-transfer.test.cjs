'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const ContinualTransfer = require('../systems/alive-continual-morphology-transfer.js');

test('AliveContinualMorphologyTransfer enforces five distinct unsigned 32-bit seeds', async () => {
  await assert.rejects(
    () => ContinualTransfer.run({ seeds: [1, 2, 3, 4] }),
    /Exactly five distinct unsigned 32-bit seeds are required/
  );
  await assert.rejects(
    () => ContinualTransfer.run({ seeds: [1, 2, 3, 4, 4] }),
    /Exactly five distinct unsigned 32-bit seeds are required/
  );
});

test('AliveContinualMorphologyTransfer proves 5-seed distinct-task retention, forgetting reduction, and morphology transfer across 4 phases + unseen holdout morphology', async () => {
  const r1 = await ContinualTransfer.run();
  const r2 = await ContinualTransfer.run();

  // Exact deterministic replication across runs
  assert.deepEqual(r1, r2);
  assert.equal(r1.status, 'completed');
  assert.equal(r1.liveRuntimeModified, false);
  assert.equal(r1.summary.fullBeatNaiveRetentionSeeds, 5);
  assert.equal(r1.summary.fullReducedForgettingSeeds, 5);
  assert.equal(r1.summary.metamorphBeatNaiveTransferSeeds, 5);
  assert.equal(r1.summary.fullBeatFrozenAllSeeds, 5);

  // Verify 95% Student-t CIs strictly above zero for paired improvements
  assert.ok(r1.summary.pairedDeltas.fullVsNaiveRetentionGainPct.ci95[0] > 10.0);
  assert.ok(r1.summary.pairedDeltas.fullVsNaiveForgettingReduction.ci95[0] > 0.05);
  assert.ok(r1.summary.pairedDeltas.metamorphVsNaiveUnseenMorphGain.ci95[0] > 0.005);
  assert.ok(r1.summary.pairedDeltas.fullVsFrozenFinalGain.ci95[0] > 0.20);

  // Per-seed invariants
  for (const seedRun of r1.runs) {
    const frozen = seedRun.controllers['frozen-baseline'];
    const naive = seedRun.controllers['naive-continual'];
    const metamorph = seedRun.controllers['metamorph-transfer-only'];
    const full = seedRun.controllers['full-continual-living'];

    // Frozen baseline never mutates weights
    assert.equal(frozen.initialSha256, frozen.finalSha256);
    assert.equal(frozen.parameterDeltas.actor.changed, 0);
    assert.equal(frozen.parameterDeltas.metamorph.changed, 0);

    // Naive continual updates actor weights but never updates W_metamorph
    assert.notEqual(naive.initialSha256, naive.finalSha256);
    assert.ok(naive.parameterDeltas.actor.changed > 0);
    assert.equal(naive.parameterDeltas.metamorph.changed, 0);

    // Metamorph-transfer-only updates both actor and W_metamorph
    assert.ok(metamorph.parameterDeltas.actor.changed > 0);
    assert.ok(metamorph.parameterDeltas.metamorph.changed > 0);
    assert.ok(metamorph.metrics.unseenMorphMeanReturn > naive.metrics.unseenMorphMeanReturn);
    assert.ok(metamorph.metrics.meanZeroShotMorphTransferReturn > naive.metrics.meanZeroShotMorphTransferReturn);

    // Full continual living improves prior-task retention and reduces catastrophic forgetting on every seed
    assert.ok(full.dreamReplaySteps > 0);
    assert.ok(full.metrics.meanPriorTaskRetentionPct > naive.metrics.meanPriorTaskRetentionPct);
    assert.ok(full.metrics.meanCatastrophicForgetting < naive.metrics.meanCatastrophicForgetting);
    assert.ok(full.metrics.finalAllTasksMeanReturn > naive.metrics.finalAllTasksMeanReturn);
    assert.ok(full.metrics.unseenMorphMeanReturn > metamorph.metrics.unseenMorphMeanReturn);
  }
});
