'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p121 = require('../systems/alive-triplet-stdp-dopamine-modulated-weights.js');
const p122 = require('../systems/alive-arctangent-fast-sigmoid-surrogate-spiking.js');
const p123 = require('../systems/alive-dendritic-apical-basal-compartment-weights.js');
const p124 = require('../systems/alive-theta-gamma-phase-precession-oscillator-weights.js');
const p125 = require('../systems/alive-spiking-dendritic-neuromorphic-phase24-audit.js');

test('Pass 121 Triplet STDP + Dopamine RPE & Homeostatic Threshold Biases achieves 100.0 score across 5 seeds', () => {
  const res = p121.runPass121Evaluation();
  assert.equal(res.winningProfileId, 'triplet-stdp-dopamine-rpe-homeostatic-bias');
  assert.equal(res.winningScore, 100);
});

test('Pass 122 ALIF Adaptive Threshold Bias & Arctan Surrogate Gradient BPTT achieves 100.0 score across 5 seeds', () => {
  const res = p122.runPass122Evaluation();
  assert.equal(res.winningProfileId, 'alif-adaptive-threshold-bias-arctan-surrogate');
  assert.equal(res.winningScore, 100);
});

test('Pass 123 Pyramidal 3-Compartment Apical/Basal & NMDA Plateau Biases achieves 100.0 score across 5 seeds', () => {
  const res = p123.runPass123Evaluation();
  assert.equal(res.winningProfileId, 'three-compartment-apical-basal-nmda-plateau-bias');
  assert.equal(res.winningScore, 100);
});

test('Pass 124 Hippocampal Theta-Gamma PAC Oscillator & Precession Biases achieves 100.0 score across 5 seeds', () => {
  const res = p124.runPass124Evaluation();
  assert.equal(res.winningProfileId, 'theta-gamma-7slot-phase-precession-oscillator');
  assert.equal(res.winningScore, 100);
});

test('Pass 125 Phase XXIV Spiking & Dendritic Acceptance Matrix verifies V1..V10 (10/10 rows)', () => {
  const res = p125.runPass125Phase24Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase24Sha256, 'string');
  assert.equal(res.phase24Sha256.length, 64);
});
