'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const phase4Audit = require('../systems/alive-tor-deepweb-phase4-audit.js');

test('Pass 25: runFiveSeedPhase4DeepWebAudit verifies all 10 Phase IV rows (D1..D10) across 5 seeds and freezes SHA-256 digest', async () => {
  const report = await phase4Audit.runFiveSeedPhase4DeepWebAudit();
  assert.equal(report.pass, 25);
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.verifiedRowCount, 10);
  assert.equal(report.summary.totalAcceptanceRows, 10);
  assert.equal(report.summary.acceptanceScorePct, 100);
  assert.equal(report.summary.all10RowsVerifiedOn5Seeds, true);
  assert.equal(report.summary.phase5EcologicalSwarmReady, true);
  assert.equal(typeof report.summary.phase4DeepWebFrozenDigestSha256, 'string');
  assert.equal(report.summary.phase4DeepWebFrozenDigestSha256.length, 64);

  for (const row of report.summary.matrixRows) {
    assert.equal(row.verified, true, `Row ${row.rowId} must be verified`);
    assert.equal(row.passedSeeds, 5, `Row ${row.rowId} must pass all 5 seeds`);
  }
});
