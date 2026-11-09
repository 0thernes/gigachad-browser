'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const watchdog = require('../systems/alive-self-healing-byzantine-watchdog.js');

test('inspectAdapterUpdateForFault detects IEEE-754 NaN/Inf, Frobenius norm explosion and CRC page bitrot', () => {
  const nanCheck = watchdog.inspectAdapterUpdateForFault({ deltaWeights: [0.1, NaN, 0.2] }, 10.0);
  assert.equal(nanCheck.isFaulty, true);
  assert.equal(nanCheck.reasons.hasNonFinite, true);

  const normCheck = watchdog.inspectAdapterUpdateForFault({ deltaWeights: [15.0, -12.0, 0.1] }, 10.0);
  assert.equal(normCheck.isFaulty, true);
  assert.equal(normCheck.reasons.normExploded, true);

  const cleanCheck = watchdog.inspectAdapterUpdateForFault({ deltaWeights: [0.1, -0.2, 0.05] }, 10.0);
  assert.equal(cleanCheck.isFaulty, false);
});

test('5-seed Self-Healing Byzantine Watchdog benchmark verifies cow-shadow-ring-byzantine-quarantine-watchdog superiority', () => {
  const report = watchdog.runSelfHealingWatchdogBenchmark();
  assert.equal(report.passId, 'ALIVE-PASS-38-SELF-HEALING-BYZANTINE-WATCHDOG');
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'cow-shadow-ring-byzantine-quarantine-watchdog');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.fullWatchdogScoreMean, 100);
  assert.equal(report.summary.stateIntegrityPctMean, 100);
  assert.equal(report.summary.zeroDataLossPctMean, 100);
  assert.equal(report.summary.byzantineQuarantinePctMean, 100);
  assert.ok(report.summary.meanRecoveryLatencyMs < 2.0);
  assert.ok(report.summary.gainVsUnprotected >= 60);
  assert.ok(report.summary.gainVsNanClampOnly >= 50);
  assert.ok(report.summary.gainVsCoarseReboot >= 35);
});
