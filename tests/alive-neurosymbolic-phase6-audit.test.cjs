'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const phase6 = require('../systems/alive-neurosymbolic-phase6-audit.js');

test('Phase VI Neuro-Symbolic & Active Inference Acceptance Matrix verifies all 10 rows (N1..N10) across 5 seeds', () => {
  const report = phase6.runNeurosymbolicPhase6Audit();
  assert.equal(report.passId, 'ALIVE-PASS-35-NEUROSYMBOLIC-PHASE6-ACCEPTANCE-MATRIX');
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.verifiedRowCount, 10);
  assert.equal(report.summary.totalAcceptanceRows, 10);
  assert.equal(report.summary.acceptanceScorePct, 100);
  assert.equal(report.summary.phase7OmegaMissionReady, true);
  assert.equal(typeof report.summary.phase6NeurosymbolicFrozenDigestSha256, 'string');
  assert.equal(report.summary.phase6NeurosymbolicFrozenDigestSha256.length, 64);

  for (const row of report.matrixRows) {
    assert.equal(row.verified, true, `Row ${row.rowId} must be verified`);
    assert.equal(row.passedSeeds, 5);
  }
});
