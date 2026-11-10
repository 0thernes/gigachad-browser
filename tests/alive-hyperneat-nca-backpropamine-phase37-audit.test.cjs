'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p186 = require('../systems/alive-hyperneat-cppn-geometric-substrate-weights.js');
const p187 = require('../systems/alive-mordvintsev-neural-cellular-automata-weight-grower.js');
const p188 = require('../systems/alive-miconi-backpropamine-differentiable-hebbian-weights.js');
const p189 = require('../systems/alive-baldwin-lamarckian-epigenetic-weight-assimilation.js');
const p190 = require('../systems/alive-hyperneat-nca-backpropamine-phase37-audit.js');

test('Pass 186 Stanley HyperNEAT CPPN Geometric Substrate Weights achieves 100.0 score across 5 seeds', () => {
  const res = p186.runPass186Evaluation();
  assert.equal(res.winningProfileId, 'hyperneat-cppn-bilateral-radial-resolution-invariant-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 187 Mordvintsev Self-Healing Neural Cellular Automata Weight Grower achieves 100.0 score across 5 seeds', () => {
  const res = p187.runPass187Evaluation();
  assert.equal(res.winningProfileId, 'mordvintsev-attractor-pool-self-healing-nca-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 188 Miconi Backpropamine Differentiable Hebbian Plasticity achieves 100.0 score across 5 seeds', () => {
  const res = p188.runPass188Evaluation();
  assert.equal(res.winningProfileId, 'backpropamine-neuromodulated-oja-hebbian-plastic-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 189 Hinton-Nowlan Baldwin Effect Epigenetic Weight Assimilation achieves 100.0 score across 5 seeds', () => {
  const res = p189.runPass189Evaluation();
  assert.equal(res.winningProfileId, 'baldwin-canalized-plasticity-genetic-assimilation-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 190 Phase XXXVII Neuro-Genetic & Developmental Acceptance Matrix verifies G2_1..G2_10 (10/10 rows)', () => {
  const res = p190.runPass190Phase37Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase37Sha256, 'string');
  assert.equal(res.phase37Sha256.length, 64);
});
