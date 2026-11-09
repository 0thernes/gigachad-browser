'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { run, TRAINING_SEEDS, CONTROLLERS, DIMENSIONS } = require('../systems/alive-unseen-task-benchmark.js');

test('benchmark enforces five distinct unsigned 32-bit seeds and WebCrypto SHA-256 provenance', async () => {
  assert.deepEqual(TRAINING_SEEDS, [19013, 29017, 39023, 49031, 59053]);
  assert.deepEqual(CONTROLLERS, ['heuristic', 'frozen', 'learning', 'fabric-coupled']);
  assert.deepEqual(DIMENSIONS, { input: 16, hidden: 12, parameters: 217 });

  await assert.rejects(() => run({ seeds: [1, 2, 3, 4] }), /five distinct unsigned 32-bit seeds/i);
  await assert.rejects(() => run({ seeds: [1, 2, 3, 4, 4] }), /five distinct unsigned 32-bit seeds/i);
  await assert.rejects(() => run({ seeds: [-1, 2, 3, 4, 5] }), /five distinct unsigned 32-bit seeds/i);
  await assert.rejects(() => run({ crypto: {} }), /SHA-256 WebCrypto/i);
});

test('benchmark is deterministic and preserves frozen ranker weights while learning and fabric-coupled improve unseen holdout performance across all 5 seeds', async () => {
  const first = await run();
  const second = await run();
  assert.deepEqual(first, second, 'repeated five-seed benchmark runs must be bit-identical');

  assert.equal(first.status, 'completed');
  assert.equal(first.livePolicyModified, false);
  assert.equal(first.runs.length, 5);

  for (const seedRun of first.runs) {
    const { heuristic, frozen, learning, 'fabric-coupled': fabric } = seedRun.controllers;
    assert.equal(frozen.optimizerUpdates, 0);
    assert.equal(frozen.initialStateSha256, frozen.finalStateSha256, 'frozen baseline ranker must not mutate weights');
    assert.equal(frozen.parameterDelta.l2, 0);

    assert.equal(heuristic.optimizerUpdates, 0);
    assert.equal(heuristic.parameterDelta.l2, 0);

    assert(learning.optimizerUpdates > 0, 'online learning controller must apply gradient updates during training');
    assert.notEqual(learning.initialStateSha256, learning.finalStateSha256);
    assert(learning.parameterDelta.l2 > 0);

    assert(fabric.optimizerUpdates > 0, 'fabric-coupled controller must apply gradient updates during training');
    assert(fabric.unseenHoldout.roleHits > 0, 'fabric-coupled controller must record Ghost Swarm role door hits');

    assert(learning.unseenHoldout.cumulativeReward > frozen.unseenHoldout.cumulativeReward, `seed ${seedRun.seed}: learning beats frozen on unseen holdouts`);
    assert(learning.unseenHoldout.cumulativeReward > heuristic.unseenHoldout.cumulativeReward, `seed ${seedRun.seed}: learning beats heuristic on unseen holdouts`);
    assert(fabric.unseenHoldout.cumulativeReward > learning.unseenHoldout.cumulativeReward, `seed ${seedRun.seed}: fabric-coupled beats isolated learning on unseen holdouts`);
    assert(learning.unseenHoldout.targetConceptRecall > frozen.unseenHoldout.targetConceptRecall, `seed ${seedRun.seed}: learning improves unseen target concept recall`);
    assert(fabric.unseenHoldout.targetConceptRecall >= learning.unseenHoldout.targetConceptRecall, `seed ${seedRun.seed}: fabric-coupled matches or exceeds learning recall`);
    assert(learning.unseenHoldout.trapSelectionRate < frozen.unseenHoldout.trapSelectionRate, `seed ${seedRun.seed}: learning reduces trap selection rate`);
    assert.equal(fabric.unseenHoldout.trapAvoidanceRate, 1, `seed ${seedRun.seed}: fabric-coupled avoids all holdout traps`);
  }

  const s = first.summary;
  assert.equal(s.learningBeatFrozenSeeds, 5);
  assert.equal(s.learningBeatHeuristicSeeds, 5);
  assert.equal(s.fabricBeatLearningSeeds, 5);
  assert.equal(s.fabricBeatHeuristicSeeds, 5);

  assert(s.pairedDeltas.learningVsFrozenReward.ci95[0] > 0, '95% CI lower bound for learning vs frozen reward must exceed zero');
  assert(s.pairedDeltas.fabricVsLearningReward.ci95[0] > 0, '95% CI lower bound for fabric-coupled vs learning reward must exceed zero');
  assert(s.pairedDeltas.learningVsFrozenRecall.ci95[0] > 0, '95% CI lower bound for learning vs frozen recall must exceed zero');
  assert(s.pairedDeltas.learningVsFrozenTrapReduction.ci95[0] > 0, '95% CI lower bound for trap reduction must exceed zero');
  assert(s.pairedDeltas.retentionVsFrozenDelta.ci95[0] > 0, '95% CI lower bound for retention suite advantage must exceed zero');
  assert(s.byController.learning.heldOutMSE.mean < s.byController.frozen.heldOutMSE.mean, 'trained ranker reduces held-out utility MSE');
});
