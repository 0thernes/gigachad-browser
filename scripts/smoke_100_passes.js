const assert = require('assert');
const { run100PassAudit } = require('../systems/pass-100-verifier');

const report = run100PassAudit();

if (!report.ok) {
  console.error('100-Pass Audit failed:');
  for (const f of [...report.failedPasses, ...report.failedFixtureChecks]) {
    console.error(`  [FAIL] ${f.id} (${f.aspect} · ${f.domain}): ${f.title} -> ${f.error}`);
  }
  process.exit(1);
}

assert.strictEqual(report.totalPasses, 100, 'Expected exactly 100 passes');
assert.strictEqual(report.passedCount, 100, 'Expected 100/100 passes to succeed');
assert.strictEqual(report.failedCount, 0, 'Expected 0 failed passes');
assert.strictEqual(report.sopTotal, 500, 'Expected 500 total SOP checklist items');
assert.strictEqual(report.sopVerified, 0, 'Diagnostic checks must not certify SOP requirements');
assert.strictEqual(report.releaseVerified, false);
assert.strictEqual(report.releaseStatus, 'NOT_RUN');
assert.ok(report.passes.every((check) => check.sopIds.length === 0 && check.requirementStatus === 'NOT_RUN'));
assert.strictEqual(report.byAspect.Backend.total, 30, 'Expected 30 Backend passes');
assert.strictEqual(report.byAspect.Frontend.total, 30, 'Expected 30 Frontend passes');
assert.strictEqual(report.byAspect['Full-Stack'].total, 40, 'Expected 40 Full-Stack passes');

for (let d = 1; d <= 10; d++) {
  const code = `DOM-${String(d).padStart(2, '0')}`;
  assert.ok(report.byDomain[code], `Missing domain ${code}`);
  assert.strictEqual(report.byDomain[code].total, 10, `Expected 10 passes for ${code}`);
  assert.strictEqual(report.byDomain[code].passed, 10, `Expected 10/10 passes for ${code}`);
}

console.log(
  `100 scoped diagnostics passed (${report.passedCount}/${report.totalPasses} passes · ${report.sopVerified}/${report.sopTotal} SOP requirements verified (release NOT_RUN) · BE:${report.byAspect.Backend.passed}/30 FE:${report.byAspect.Frontend.passed}/30 FS:${report.byAspect['Full-Stack'].passed}/40 · ${report.durationMs}ms)`
);
