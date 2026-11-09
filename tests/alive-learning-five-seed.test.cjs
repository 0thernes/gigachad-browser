'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const learning = require('../systems/alife-learning-evidence.js');
const benchmark = require('../systems/alive-learning-five-seed.js');

test('five independently initialized training runs use disjoint training and fixed matched evaluation trajectories', async () => {
  const report = await benchmark.run();
  assert.equal(report.status, 'completed');
  assert.equal(report.summary.completedRuns, 5);
  assert.equal(report.summary.failedRuns, 0);
  assert.equal(new Set(report.runs.map(run => run.initialStateSha256)).size, 5);
  const evaluation = [...report.protocol.holdoutSeeds, ...report.protocol.retentionSeeds];
  const training = report.runs.flatMap(run => run.trajectorySeeds);
  assert.equal(new Set([...evaluation, ...training]).size, evaluation.length + training.length);
  for (const run of report.runs) {
    assert.equal(run.optimizerUpdates, 60);
    assert.equal(run.learningCurve.length, 4);
    assert.equal(run.initialStateSha256, run.frozenStateSha256, 'each frozen clone remains byte-identical');
    assert.notEqual(run.initialStateSha256, run.candidateStateSha256, 'production training actually changes parameter bytes');
    assert.match(run.candidateStateSha256, /^[a-f0-9]{64}$/);
    assert.ok(run.parameterDelta.actor.changed > 0);
    assert.ok(run.parameterDelta.morphologyConditioning.changed > 0);
    assert.deepEqual(run.candidate.holdout.seeds, run.frozen.holdout.seeds);
    assert.deepEqual(run.candidate.retention.seeds, run.frozen.retention.seeds);
    assert.equal(run.holdoutDelta, run.candidate.holdout.meanReturn - run.frozen.holdout.meanReturn);
    assert.equal(run.wouldPromoteUnderProductionRule, run.heldOutDeltaPct > 0 && run.retentionPct >= 95);
  }
  assert.equal(report.livePolicyModified, false);
  assert.equal(report.releaseQualified, false);
  assert.equal(report.gateG4Passed, false);
  assert.equal(report.protocol.changedConditionSuite, false);
  assert.match(report.protocol.retentionScope, /same steering task/);
});

test('identical protocol reproduces all measured values and hashes; changing a training seed changes its independent run only', async () => {
  const first = await benchmark.run(), second = await benchmark.run();
  assert.deepEqual(second, first);
  const changed = benchmark.TRAINING_SEEDS.slice(); changed[2]++;
  const third = await benchmark.run({ trainingSeeds: changed });
  for (let i = 0; i < 5; i++) {
    if (i === 2) {
      assert.notEqual(third.runs[i].initialStateSha256, first.runs[i].initialStateSha256);
      assert.notEqual(third.runs[i].candidateStateSha256, first.runs[i].candidateStateSha256);
    } else assert.deepEqual(third.runs[i], first.runs[i]);
  }
});

function withLearning(substitute) {
  const context = vm.createContext({ AlifeLearningEvidence: substitute, crypto: crypto.webcrypto,
    TextEncoder, Float32Array, Uint8Array, DataView });
  vm.runInContext(fs.readFileSync(require.resolve('../systems/alive-learning-five-seed.js'), 'utf8'), context);
  return context.AliveLearningFiveSeed;
}

test('each run really executes production update methods; no-op learning produces zero benefit and no promotion', async () => {
  let calls = 0;
  const api = withLearning({ ...learning, policyTrial(actor, morph, body, dimensions, seed) {
    calls++;
    return learning.policyTrial(actor, morph, body, dimensions, seed, false);
  } });
  const report = await api.run();
  assert.equal(calls, 15);
  assert.equal(report.summary.positiveHoldoutRuns, 0);
  assert.equal(report.summary.productionRulePassRuns, 0);
  for (const run of report.runs) {
    assert.equal(run.holdoutDelta, 0);
    assert.equal(run.parameterDelta.actor.changed, 0);
    assert.equal(run.initialStateSha256, run.candidateStateSha256);
  }
});

test('failed and nonfinite runs remain in the report and cannot inflate the denominator or generate a five-run confidence interval', async () => {
  let calls = 0;
  const api = withLearning({ ...learning, policyTrial(...args) {
    calls++;
    if (calls === 1) throw new Error('Injected numerical failure');
    if (calls === 2) return NaN;
    return learning.policyTrial(...args);
  } });
  const report = await api.run();
  assert.equal(report.status, 'incomplete');
  assert.equal(report.runs.length, 5);
  assert.equal(report.summary.failedRuns, 2);
  assert.equal(report.summary.completedRuns, 3);
  assert.match(report.runs[0].error, /Injected numerical failure/);
  assert.match(report.runs[1].error, /Nonfinite/);
  assert.equal(report.summary.holdoutDelta.ci95, null);
  assert.equal(report.summary.holdoutDelta.count, 3);
  assert.equal(report.gateG4Passed, false);
});

test('confidence interval uses independent training runs, not pooled evaluation episodes', async () => {
  const report = await benchmark.run();
  const values = report.runs.map(run => run.holdoutDelta), average = values.reduce((a, b) => a + b) / 5;
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / 4;
  const halfWidth = 2.7764451051977987 * Math.sqrt(variance / 5);
  const summary = report.summary.holdoutDelta;
  assert.equal(summary.count, 5);
  assert.equal(summary.mean, average);
  assert.ok(Math.abs(summary.ci95[0] - (average - halfWidth)) < 1e-12);
  assert.ok(Math.abs(summary.ci95[1] - (average + halfWidth)) < 1e-12);
});

test('invalid protocols fail before training and unavailable fingerprints cannot become a successful report', async () => {
  for (const trainingSeeds of [[], [1, 2, 3, 4], [1, 2, 3, 4, 4], [1, 2, 3, 4, -1], [1, 2, 3, 4, 2 ** 32], [1, 2, 3, 4, NaN]])
    await assert.rejects(benchmark.run({ trainingSeeds }), /five distinct/);
  await assert.rejects(benchmark.run({ crypto: {} }), /WebCrypto/);
  const report = await benchmark.run({ crypto: { subtle: { async digest() { throw new Error('Hash unavailable'); } } } });
  assert.equal(report.status, 'incomplete');
  assert.equal(report.summary.completedRuns, 0);
  assert.equal(report.summary.failedRuns, 5);
  assert.equal(report.summary.holdoutDelta.mean, null);
});
