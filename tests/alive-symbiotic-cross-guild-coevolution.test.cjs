'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const symbiotic = require('../systems/alive-symbiotic-cross-guild-coevolution.js');

test('Pass 29: computeExactThreeGuildShapley satisfies Shapley Efficiency and Null-Player axioms', () => {
  const res = symbiotic.computeExactThreeGuildShapley();
  assert.equal(res.efficiencySum, 100);
  assert.equal(res.efficiencyGap, 0);
  assert.equal(res.nullPlayerFreeRiderShapley, 0);
  assert.ok(res.corvidShapley > res.locustShapley);
  assert.ok(res.locustShapley > res.fishShapley);
});

test('Pass 29: runFiveSeedSymbioticCoevolutionBenchmark verifies 100.0 composite score and 3/3 guild survival on all 5 seeds', () => {
  const report = symbiotic.runFiveSeedSymbioticCoevolutionBenchmark();
  assert.equal(report.pass, 29);
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'shapley-pareto-symbiotic-coevolution');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.fullCoevolutionScoreMean, 100);
  assert.equal(report.summary.shapleyCreditAccuracyPctMean, 100);
  assert.equal(report.summary.freeRiderRejectionPctMean, 100);
  assert.equal(report.summary.guildLineageSurvivalPctMean, 100);
  assert.equal(report.summary.paretoHypervolumePctMean, 100);
  assert.ok(report.summary.gainVsLastTouchGreedy > 60);
  assert.ok(report.summary.gainVsUniformEqualSplit > 35);
  assert.ok(report.summary.gainVsScalarCollapse > 30);
});
