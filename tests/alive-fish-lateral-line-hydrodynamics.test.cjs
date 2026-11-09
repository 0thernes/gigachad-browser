'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fishHydro = require('../systems/alive-fish-lateral-line-hydrodynamics.js');

test('Pass 28: computeKuramotoOrderParameter returns 1.0 for identical phases and near 0 for opposite phases', () => {
  const syncR = fishHydro.computeKuramotoOrderParameter([0.5, 0.5, 0.5, 0.5]);
  assert.equal(syncR, 1);
  const cancelR = fishHydro.computeKuramotoOrderParameter([0, Math.PI, 0, Math.PI]);
  assert.equal(cancelR, 0);
});

test('Pass 28: runFiveSeedFishHydrodynamicsBenchmark verifies 100.0 composite score, healthy Kuramoto R and sub-tick evasion on all 5 seeds', () => {
  const report = fishHydro.runFiveSeedFishHydrodynamicsBenchmark();
  assert.equal(report.pass, 28);
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'lateral-line-kuramoto-cstart-school');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.fullHydroScoreMean, 100);
  assert.equal(report.summary.kuramotoSyncHealthPctMean, 100);
  assert.equal(report.summary.cStartEvasionSurvivalPctMean, 100);
  assert.equal(report.summary.byzantineGlitchImmunityPctMean, 100);
  assert.ok(report.summary.meanKuramotoR >= 0.95 && report.summary.meanKuramotoR <= 0.995);
  assert.ok(report.summary.meanEvasionWaveLatencyMs <= 2.5);
  assert.ok(report.summary.gainVsUncoupledDrifters > 90);
  assert.ok(report.summary.gainVsSlowCascade > 60);
  assert.ok(report.summary.gainVsRigidEchoChamber > 60);
});
