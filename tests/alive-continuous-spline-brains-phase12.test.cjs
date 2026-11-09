'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const pass61 = require('../systems/alive-kan-kolmogorov-arnold-spline-net.js');
const pass62 = require('../systems/alive-cfc-sltc-liquid-time-constant.js');
const pass63 = require('../systems/alive-port-hamiltonian-symplectic-ode.js');
const pass64 = require('../systems/alive-deq-deep-equilibrium-implicit-layer.js');
const pass65 = require('../systems/alive-continuous-spline-brains-phase12-audit.js');

test('Pass 61 Kolmogorov-Arnold Chebyshev/B-Spline Network achieves 100.0 score across 5 seeds', () => {
  const r = pass61.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 62 Closed-Form CfC + Spiking sLTC Liquid Brain achieves 100.0 score across 5 seeds', () => {
  const r = pass62.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 63 Symplectic Port-Hamiltonian Neural ODE achieves 100.0 score across 5 seeds', () => {
  const r = pass63.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 64 Anderson-Accelerated Contractive DEQ Implicit Layer achieves 100.0 score across 5 seeds', () => {
  const r = pass64.run();
  assert.equal(r.summary.allSeedsVerified, true);
  assert.equal(r.summary.compositeScoreMean, 100);
});

test('Pass 65 Phase XII Continuous-Depth & Spline Acceptance Matrix verifies C1..C10 across 5 seeds', () => {
  const r = pass65.run();
  assert.equal(r.summary.verifiedRowCount, 10);
  assert.equal(r.summary.acceptanceScorePct, 100);
  assert.equal(r.summary.phase12ContinuousSplineFrozenDigestSha256.length, 64);
  for (const row of r.matrixRows) {
    assert.equal(row.verified, true, row.rowId);
    assert.equal(row.passedSeeds, 5);
  }
});
