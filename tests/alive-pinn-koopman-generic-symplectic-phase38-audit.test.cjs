'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p191 = require('../systems/alive-pinn-ntk-adaptive-collocation-pde-weights.js');
const p192 = require('../systems/alive-koopman-autoencoder-companion-eigenweights.js');
const p193 = require('../systems/alive-generic-poisson-onsager-thermodynamic-weights.js');
const p194 = require('../systems/alive-storer-symplectic-euler-verlet-recurrent-weights.js');
const p195 = require('../systems/alive-pinn-koopman-generic-symplectic-phase38-audit.js');

test('Pass 191 Raissi-Wang PINN NTK-Balanced & Divergence-Free PDE Weights achieves 100.0 score across 5 seeds', () => {
  const res = p191.runPass191Evaluation();
  assert.equal(res.winningProfileId, 'pinn-ntk-trace-balanced-curl-potential-pde-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 192 Deep Koopman Operator Block-Diagonal Modal Eigenweights achieves 100.0 score across 5 seeds', () => {
  const res = p192.runPass192Evaluation();
  assert.equal(res.winningProfileId, 'deep-koopman-hurwitz-block-modal-eigenweights');
  assert.equal(res.winningScore, 100);
});

test('Pass 193 GENERIC Skew-Poisson & PSD-Onsager Thermodynamic Weights achieves 100.0 score across 5 seeds', () => {
  const res = p193.runPass193Evaluation();
  assert.equal(res.winningProfileId, 'generic-skew-poisson-psd-onsager-degeneracy-projected-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 194 Stormer-Verlet Symplectic Recurrent Neural Network (SRNN) Weights achieves 100.0 score across 5 seeds', () => {
  const res = p194.runPass194Evaluation();
  assert.equal(res.winningProfileId, 'stormer-verlet-leapfrog-symplectic-srnn-weights');
  assert.equal(res.winningScore, 100);
});

test('Pass 195 Phase XXXVIII Physics-Informed Neural Networks Acceptance Matrix verifies C2_1..C2_10 (10/10 rows)', () => {
  const res = p195.runPass195Phase38Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase38Sha256, 'string');
  assert.equal(res.phase38Sha256.length, 64);
});
