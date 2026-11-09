'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ReleaseAudit = require('../systems/alive-integrated-release-audit.js');

test('Pass 10 integrated release audit verifies Passes 1–9, promotes all 8 PDF Gates, and freezes SHA-256 Phase I manifest across 5 seeds', async () => {
  const report = await ReleaseAudit.run();
  assert.equal(report.benchmark, 'pass-10-integrated-phase1-release-audit-v1');
  assert.equal(report.status, 'completed');
  assert.equal(report.protocol.seeds.length, 5);
  assert.equal(report.protocol.facultiesVerified, 36);
  assert.equal(report.protocol.coupledStreamsVerified, 24);

  const s = report.summary;
  assert.equal(s.verifiedPassCount, 9);
  assert.equal(s.totalAuditedPasses, 9);
  assert.equal(s.verifiedGateCount, 8);
  assert.equal(s.totalPdfGates, 8);
  assert.equal(s.allPassesVerifiedOn5Seeds, true);
  assert.equal(s.all8PdfGatesPromoted, true);
  assert.equal(s.phase2TorMeshReady, true);
  assert.equal(typeof s.phase1FrozenDigestSha256, 'string');
  assert.equal(s.phase1FrozenDigestSha256.length, 64);
  assert.equal(s.auditScore.mean, 100);

  for (const p of s.passAudits) {
    assert.equal(p.passedSeeds, 5, `Pass ${p.pass} (${p.id}) must pass on 5/5 seeds`);
    assert.equal(p.verified, true);
  }
  for (const g of s.gateAudits) {
    assert.equal(g.passedSeeds, 5, `Gate ${g.gateId} must pass on 5/5 seeds`);
    assert.equal(g.verified, true);
    assert.equal(g.evidenceDigestSha256.length, 64);
  }
});
