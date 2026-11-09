'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const shield = require('../systems/alive-adversarial-prompt-dom-shield.js');

test('WCAG contrast ratio and zero-width Unicode steganography sanitizer detect cloaked injections', () => {
  const whiteOnWhite = shield.computeWcagContrastRatio([252, 252, 252], [255, 255, 255]);
  assert.ok(whiteOnWhite < 1.05);

  const highContrast = shield.computeWcagContrastRatio([240, 240, 240], [10, 10, 10]);
  assert.ok(highContrast > 15.0);

  const stego = shield.stripZeroWidthAndBidiStego('ig\u200Bnore\uFEFF prev\u202Eious');
  assert.equal(stego.cleanedText, 'ignore previous');
  assert.equal(stego.stegoCharsRemoved, 3);
});

test('5-seed Adversarial Prompt-Injection & Cloaked-DOM Shield benchmark verifies full-spotlighting-taint-dom-exfil-shield superiority', () => {
  const report = shield.runAdversarialDomShieldBenchmark();
  assert.equal(report.passId, 'ALIVE-PASS-36-ADVERSARIAL-PROMPT-DOM-SHIELD');
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'full-spotlighting-taint-dom-exfil-shield');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.fullShieldScoreMean, 100);
  assert.equal(report.summary.injectionBlockRatePctMean, 100);
  assert.equal(report.summary.cloakedDomQuarantinePctMean, 100);
  assert.equal(report.summary.exfiltrationPreventionPctMean, 100);
  assert.equal(report.summary.benignUtilityRetentionPctMean, 100);
  assert.ok(report.summary.gainVsRawUnfiltered > 60);
  assert.ok(report.summary.gainVsNaiveKeyword > 40);
  assert.ok(report.summary.gainVsDomVisibilityOnly > 20);
});
