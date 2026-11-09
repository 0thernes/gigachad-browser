'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const OmegaAuditor = require('../systems/alive-omega-20-pass-auditor.js');

test('Pass 20 run cross-audits all 20 passes, 8 PDF Gates, 10 Tor rows and 5 Swarm pillars across 5 seeds with cryptographic SHA-256 manifest', async () => {
  const report = await OmegaAuditor.run();
  assert.equal(report.status, 'completed');
  assert.equal(report.liveRuntimeModified, false);
  assert.equal(report.protocol.seeds.length, 5);
  assert.equal(report.summary.verifiedPassesCount, 20);
  assert.equal(report.summary.totalPasses, 20);
  assert.equal(report.summary.all20PassesVerified, true);
  assert.equal(report.summary.promotedPdfGatesCount, 8);
  assert.equal(report.summary.verifiedTorAcceptanceRowsCount, 10);
  assert.equal(report.summary.verifiedSwarmPillarsCount, 5);
  assert.equal(report.summary.omegaQualificationScore.mean, 100);
  assert.equal(typeof report.summary.omegaGrandManifestSha256, 'string');
  assert.equal(report.summary.omegaGrandManifestSha256.length, 64);

  for (const phase of report.summary.phaseLedger) {
    assert.equal(phase.verified, true, `Expected ${phase.phaseId} to be verified`);
  }
  for (const pillar of report.summary.swarmPillars) {
    assert.equal(pillar.verified, true, `Expected ${pillar.pillarId} to be verified`);
    assert.equal(pillar.passedSeeds, 5);
  }
});

test('Pass 20 run rejects invalid seed arrays', async () => {
  await assert.rejects(() => OmegaAuditor.run({ seeds: [1, 2] }), /Exactly five distinct seeds/);
});
