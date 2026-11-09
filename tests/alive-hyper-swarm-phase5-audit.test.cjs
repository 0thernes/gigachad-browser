'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const phase5Audit = require('../systems/alive-hyper-swarm-phase5-audit.js');

test('Pass 30: runFiveSeedPhase5SwarmAudit verifies all 10 Phase V rows (E1..E10) across 5 seeds and freezes SHA-256 digest', async () => {
  const report = await phase5Audit.runFiveSeedPhase5SwarmAudit();
  assert.equal(report.pass, 30);
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.verifiedRowCount, 10);
  assert.equal(report.summary.totalAcceptanceRows, 10);
  assert.equal(report.summary.acceptanceScorePct, 100);
  assert.equal(report.summary.all10RowsVerifiedOn5Seeds, true);
  assert.equal(report.summary.phase6NeurosymbolicReady, true);
  assert.equal(typeof report.summary.phase5SwarmFrozenDigestSha256, 'string');
  assert.equal(report.summary.phase5SwarmFrozenDigestSha256.length, 64);

  for (const row of report.summary.matrixRows) {
    assert.equal(row.verified, true, `Row ${row.rowId} must be verified`);
    assert.equal(row.passedSeeds, 5, `Row ${row.rowId} must pass all 5 seeds`);
  }
});
