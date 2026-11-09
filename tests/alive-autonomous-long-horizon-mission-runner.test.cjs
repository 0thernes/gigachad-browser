'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const mission = require('../systems/alive-autonomous-long-horizon-mission-runner.js');

test('Tarjan SCC cycle detector identifies circular wait-for subgoal dependencies', () => {
  const cyclicGraph = {
    'SG-0': [],
    'SG-1': ['SG-0'],
    'SG-2': ['SG-3'],
    'SG-3': ['SG-2']
  };
  const cycles = mission.detectDependencyCyclesTarjan(cyclicGraph);
  assert.equal(cycles.length, 1);
  assert.equal(cycles[0].length, 2);

  const acyclicGraph = {
    'SG-0': [],
    'SG-1': ['SG-0'],
    'SG-2': ['SG-1']
  };
  assert.equal(mission.detectDependencyCyclesTarjan(acyclicGraph).length, 0);
});

test('5-seed Long-Horizon Checkpointable Mission Runner benchmark verifies htn-dag-tarjan-idempotent-wal-runner superiority', () => {
  const report = mission.runLongHorizonMissionBenchmark();
  assert.equal(report.passId, 'ALIVE-PASS-37-AUTONOMOUS-LONG-HORIZON-MISSION-RUNNER');
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'htn-dag-tarjan-idempotent-wal-runner');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.fullMissionScoreMean, 100);
  assert.equal(report.summary.missionCompletionPctMean, 100);
  assert.equal(report.summary.deadlockRecoveryPctMean, 100);
  assert.equal(report.summary.crashResumeEquivalencePctMean, 100);
  assert.equal(report.summary.zeroDuplicateSideEffectPctMean, 100);
  assert.ok(report.summary.gainVsStatelessLinear === 100);
  assert.ok(report.summary.gainVsNaiveRetry === 100);
  assert.ok(report.summary.gainVsNoIdempotentWal >= 20);
});
