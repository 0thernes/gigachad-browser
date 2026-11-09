'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const corvid = require('../systems/alive-crow-raven-corvid-epistemology.js');

test('Pass 26: computeBackdoorDoEffect recovers exact true causal beta under strong confounder Z', () => {
  const scm = {
    pZ1: 0.5,
    pX1GivenZ0: 0.15,
    pX1GivenZ1: 0.85,
    baseY0: 0.30,
    trueCausalBetaX: -0.18,
    confounderGammaZ: 0.62
  };
  const res = corvid.computeBackdoorDoEffect(scm);
  assert.equal(res.interventionalAteDo, -0.18);
  assert.equal(res.doEstimationError, 0);
  assert.ok(res.naiveObservationalDiff > 0, 'Naive observational correlation is sign-reversed by confounder Z');
  assert.ok(res.naiveConfoundedBias > 0.4);
});

test('Pass 26: runFiveSeedCorvidEpistemologyBenchmark verifies 100.0 composite score and 0.0 ATE error on all 5 seeds', () => {
  const report = corvid.runFiveSeedCorvidEpistemologyBenchmark();
  assert.equal(report.pass, 26);
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'corvid-crow-raven-causal-toolsmith');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.fullCorvidScoreMean, 100);
  assert.equal(report.summary.metaToolSynthesisSuccessPctMean, 100);
  assert.equal(report.summary.causalDoCalculusAccuracyPctMean, 100);
  assert.equal(report.summary.theoryOfMindCacheProtectionPctMean, 100);
  assert.equal(report.summary.deceptiveBaitRejectionPctMean, 100);
  assert.equal(report.summary.meanAteEstimationError, 0);
  assert.ok(report.summary.gainVsAssociativeReflex > 90);
  assert.ok(report.summary.gainVsSingleStepTool > 90);
  assert.ok(report.summary.gainVsCausalRavenOnly > 40);
});
