'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const poincare = require('../systems/alive-hyperbolic-poincare-knowledge-embedder.js');

test('Poincaré distance and Möbius gyrovector addition satisfy hyperbolic manifold invariants', () => {
  const origin = [0, 0, 0, 0];
  const u = [0.3, 0.2, -0.1, 0.0];
  const v = [-0.2, 0.25, 0.15, -0.1];

  const d0 = poincare.computePoincareDistance(u, u, 1.0);
  assert.ok(Math.abs(d0) < 1e-9);

  const duv = poincare.computePoincareDistance(u, v, 1.0);
  const dvu = poincare.computePoincareDistance(v, u, 1.0);
  assert.ok(Math.abs(duv - dvu) < 1e-9);
  assert.ok(duv > 0);

  // Möbius addition with origin is identity
  const uPlus0 = poincare.mobiusAdd(u, origin, 1.0);
  for (let i = 0; i < u.length; i++) {
    assert.ok(Math.abs(uPlus0[i] - u[i]) < 1e-9);
  }

  // exp_0 and log_0 are inverses
  const expV = poincare.expMapZero(u, 1.0);
  const recovered = poincare.logMapZero(expV, 1.0);
  for (let i = 0; i < u.length; i++) {
    assert.ok(Math.abs(recovered[i] - u[i]) < 1e-6);
  }
});

test('5-seed Hyperbolic Poincaré Ball benchmark verifies poincare-riemannian-gyrovector-b8 superiority', () => {
  const report = poincare.runHyperbolicPoincareBenchmark();
  assert.equal(report.passId, 'ALIVE-PASS-32-HYPERBOLIC-POINCARE-KNOWLEDGE-EMBEDDER');
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'poincare-riemannian-gyrovector-b8');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.poincareCompositeScoreMean, 100);
  assert.equal(report.summary.poincareMapAtKPctMean, 100);
  assert.equal(report.summary.poincareDepthSpearmanPctMean, 100);
  assert.equal(report.summary.poincareBoundarySafetyPctMean, 100);
  assert.ok(report.summary.gainVsFlatR2 > 15);
  assert.ok(report.summary.gainVsFlatR8 > 5);
  assert.ok(report.summary.gainVsUnprojectedHyperbolic > 20);
});
