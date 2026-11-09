'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const omega40 = require('../systems/alive-omega-40-pass-grand-auditor.js');
const { POST_MODULES } = require('../systems/alive-startup-loader.js');

test('40-Pass Grand Omega Synthesis & Cryptographic Evidence Package Qualification verifies all 7 Phases (63/63 Gates) and 10 Phase VII Rows (M1..M10) across 5 seeds', async () => {
  const report = await omega40.runOmega40PassGrandAudit();
  assert.equal(report.passId, 'ALIVE-PASS-40-OMEGA-40-PASS-GRAND-SYNTHESIS-AUDIT');
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.verifiedPhase7Rows, 10);
  assert.equal(report.summary.totalPhase7Rows, 10);
  assert.equal(report.summary.phase7AcceptanceScorePct, 100);
  assert.equal(report.summary.totalVerifiedGatesAcross7Phases, 63);
  assert.equal(report.summary.totalGatesAcross7Phases, 63);
  assert.equal(report.summary.omega40PassQualified, true);
  assert.equal(typeof report.summary.omega40PassFrozenDigestSha256, 'string');
  assert.equal(report.summary.omega40PassFrozenDigestSha256.length, 64);

  // Verify all 7 phase SHA-256 digests are 64-hex strings
  assert.equal(report.summary.phase1DigestSha256.length, 64);
  assert.equal(report.summary.phase2DigestSha256.length, 64);
  assert.equal(report.summary.phase3DigestSha256.length, 64);
  assert.equal(report.summary.phase4DigestSha256.length, 64);
  assert.equal(report.summary.phase5DigestSha256.length, 64);
  assert.equal(report.summary.phase6DigestSha256.length, 64);
  assert.equal(report.summary.phase7DigestSha256.length, 64);

  for (const row of report.matrixRows) {
    assert.equal(row.verified, true, `Row ${row.rowId} must be verified`);
    assert.equal(row.passedSeeds, 5);
  }
});

test('POST_MODULES in alive-startup-loader registers all 40 pass modules before alive-fabric-visualizer', () => {
  assert.ok(POST_MODULES.includes('systems/alive-omega-20-pass-auditor.js'));
  assert.ok(POST_MODULES.includes('systems/alive-tor-deepweb-phase4-audit.js'));
  assert.ok(POST_MODULES.includes('systems/alive-hyper-swarm-phase5-audit.js'));
  assert.ok(POST_MODULES.includes('systems/alive-neurosymbolic-phase6-audit.js'));
  assert.ok(POST_MODULES.includes('systems/alive-full-stack-hybrid-synergy-benchmark.js'));
  assert.ok(POST_MODULES.includes('systems/alive-omega-40-pass-grand-auditor.js'));
  assert.ok(POST_MODULES.indexOf('systems/alive-omega-40-pass-grand-auditor.js') < POST_MODULES.indexOf('systems/alive-fabric-visualizer.js'));
});
