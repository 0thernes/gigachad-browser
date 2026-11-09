'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const activeInf = require('../systems/alive-active-inference-free-energy.js');

test('Pass 31: computeVariationalFreeEnergyUpdate strictly reduces Variational Free Energy F(Q,o)', () => {
  const prior = [0.25, 0.25, 0.25, 0.25];
  const likelihood = [0.85, 0.05, 0.05, 0.05];
  const res = activeInf.computeVariationalFreeEnergyUpdate(prior, likelihood, prior);
  assert.equal(res.monotonicDecrease, true);
  assert.ok(res.vfeDrop > 0.5);
  assert.ok(res.posteriorQ[0] > 0.80);
});

test('Pass 31: runFiveSeedActiveInferenceBenchmark verifies 100.0 composite score and monotonic VFE drop on all 5 seeds', () => {
  const report = activeInf.runFiveSeedActiveInferenceBenchmark();
  assert.equal(report.pass, 31);
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'full-vfe-efe-active-inference-planner');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.fullActiveInferenceScoreMean, 100);
  assert.equal(report.summary.vfeMonotonicReductionPctMean, 100);
  assert.equal(report.summary.epistemicDisambiguationPctMean, 100);
  assert.equal(report.summary.pragmaticGoalConvergencePctMean, 100);
  assert.ok(report.summary.meanVfeDropNats > 0.5);
  assert.ok(report.summary.gainVsGreedyPragmatic >= 65);
  assert.ok(report.summary.gainVsPureCuriosity >= 65);
  assert.ok(report.summary.gainVsDogmaticPrior === 100);
});
