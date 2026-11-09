'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const locust = require('../systems/alive-locust-phase-polyphenism.js');

test('Pass 27: stepPolyphenismState preserves GREGARIA across intermediate plateau under hysteresis and reverts on depletion', () => {
  const fullProf = locust.LOCUST_PROFILES[3];
  const s1 = locust.stepPolyphenismState(0.08, 'SOLITARIA', 0.80, 0.05, fullProf);
  assert.equal(s1.phase, 'GREGARIA');
  // Intermediate plateau density = 0.41 (> thetaDown=0.25) -> stays in GREGARIA without chatter
  const s2 = locust.stepPolyphenismState(s1.phi, s1.phase, 0.41, 0.05, fullProf);
  assert.equal(s2.phase, 'GREGARIA');
  assert.equal(s2.switched, false);
  // Depletion + rate-limit pressure -> reverts to SOLITARIA
  const s3 = locust.stepPolyphenismState(s2.phi, s2.phase, 0.18, 0.60, fullProf);
  assert.equal(s3.phase, 'SOLITARIA');
});

test('Pass 27: runFiveSeedLocustPolyphenismBenchmark verifies 100.0 composite score and 0 chatter/collisions on all 5 seeds', () => {
  const report = locust.runFiveSeedLocustPolyphenismBenchmark();
  assert.equal(report.pass, 27);
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'serotonergic-hysteresis-polyphenism');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.fullPolyphenismScoreMean, 100);
  assert.equal(report.summary.oasisWavefrontHarvestPctMean, 100);
  assert.equal(report.summary.trophicBackoffSurvivalPctMean, 100);
  assert.equal(report.summary.hysteresisStabilityPctMean, 100);
  assert.equal(report.summary.collisionAvoidancePctMean, 100);
  assert.ok(report.summary.gainVsLockedSolitaria >= 20);
  assert.ok(report.summary.gainVsLockedGregaria >= 50);
  assert.ok(report.summary.gainVsMemorylessSwitch >= 15);
});
