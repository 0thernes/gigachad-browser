'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const synth = require('../systems/alive-neurosymbolic-program-synthesizer.js');

test('parseNormalizedNumeric canonicalizes currency, thousands (k), millions (M) and basis points (bps)', () => {
  assert.equal(synth.parseNormalizedNumeric('$1,250.5'), 1250.5);
  assert.equal(synth.parseNormalizedNumeric('4.25k'), 4250);
  assert.equal(synth.parseNormalizedNumeric('1.5M'), 1500000);
  assert.equal(synth.parseNormalizedNumeric('250bps'), 2.5);
  assert.ok(Number.isNaN(synth.parseNormalizedNumeric('N/A_NULL')));
});

test('5-seed Neuro-Symbolic Program Synthesis benchmark verifies neurosymbolic-cegis-smt-synthesizer superiority', () => {
  const report = synth.runNeurosymbolicSynthesisBenchmark();
  assert.equal(report.passId, 'ALIVE-PASS-33-NEUROSYMBOLIC-PROGRAM-SYNTHESIZER');
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'neurosymbolic-cegis-smt-synthesizer');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.fullSynthesisScoreMean, 100);
  assert.equal(report.summary.smtInvariantSoundnessPctMean, 100);
  assert.equal(report.summary.mutationHoldoutSurvivalPctMean, 100);
  assert.equal(report.summary.decoyRejectionPctMean, 100);
  assert.ok(report.summary.gainVsRegexScraper > 60);
  assert.ok(report.summary.gainVsNeuralSketchOnly > 40);
  assert.ok(report.summary.gainVsUntypedEnumerative > 30);
});
