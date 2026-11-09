'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const wfPad = require('../systems/alive-tor-padding-traffic-defense.js');

test('Pass 23: computeKlDivergenceBits returns 0 for identical distributions and positive for skewed distributions', () => {
  const zeroKl = wfPad.computeKlDivergenceBits(wfPad.CANONICAL_IAT_HIST, wfPad.CANONICAL_IAT_HIST);
  assert.equal(zeroKl, 0);
  const skewedKl = wfPad.computeKlDivergenceBits([0.75, 0.05, 0.05, 0.05, 0.05, 0.05], wfPad.CANONICAL_IAT_HIST);
  assert.ok(skewedKl > 0.5);
});

test('Pass 23: runFiveSeedTorPaddingDefenseBenchmark verifies 100.0 composite score and <=12.5% WF classifier accuracy on all 5 seeds', () => {
  const report = wfPad.runFiveSeedTorPaddingDefenseBenchmark();
  assert.equal(report.pass, 23);
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'adaptive-wtfpad-regulator-hybrid');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.adaptiveCompositeScoreMean, 100);
  assert.equal(report.summary.adaptiveWfEvasionPctMean, 100);
  assert.equal(report.summary.adaptiveClassifierAccuracyPctMean, 12.5);
  assert.ok(report.summary.adaptiveBandwidthOverheadPctMean <= 35);
  assert.ok(report.summary.adaptiveAddedLatencyMsMean <= 12);
  assert.ok(report.summary.adaptiveIatKlDivergenceBitsMean <= 0.015);
  assert.ok(report.summary.gainVsUnpaddedCells > 40);
  assert.ok(report.summary.gainVsNaiveRandomChaff > 40);
  assert.ok(report.summary.gainVsConstantRateHeavy > 20);
});
