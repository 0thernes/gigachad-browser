"use strict";
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const auditorPath = path.join(root, 'systems', 'forensic-25-pass-10-iteration-auditor.js');
const source = fs.readFileSync(auditorPath, 'utf8');
const sopSource = fs.readFileSync(path.join(root, 'systems', 'sop-500-checklist.js'), 'utf8');

function loadVm(code, overrides = {}) {
  const context = { module: { exports: {} }, __dirname: path.join(root, 'systems'), console: { log() {} }, ...overrides };
  vm.runInNewContext(code, context, { filename: auditorPath, timeout: 10000 });
  return context;
}

for (const mode of ['browser', 'browser-metadata', 'filesystem-denied']) {
  test(`unavailable source cannot certify a requirement (${mode})`, () => {
    const overrides = mode === 'filesystem-denied'
      ? { require() { throw Object.assign(new Error('fixture access denied'), { code: 'EACCES' }); } }
      : mode === 'browser-metadata' ? {
        gigachad: { invoke() {} }, document: { querySelector() { return {}; } },
        PortedMultiverseBrainsFederation() {}, BleedEdge25AlifeEngine() {},
        PORTED_10_BRAINS_CATALOG: Array.from({ length: 14 }, (_, id) => ({ id }))
      } : {};
    const ctx = loadVm(source, overrides);
    const Auditor = ctx.module.exports.Forensic25Pass10IterationAuditor;
    const result = new Auditor()._getCodebaseVerificationCache();
    assert.equal(result.status, mode === 'filesystem-denied' ? 'FAIL' : 'NOT_RUN');
    for (const key of ['owaspOk', 'sandboxIpcOk', 'cspPrivacyOk', 'enterpriseDocsOk', 'licenseTextOk']) assert.equal(result[key], false);
    assert.equal(result.requirementStatus, 'NOT_RUN');
    const sop = loadVm(sopSource, overrides).module.exports.summarizeSop500();
    assert.equal(sop.verifiedCount, 0);
    assert.equal(sop.statusCounts.NOT_RUN, 500);
    assert.notEqual(sop.sourceAvailability.status, 'AVAILABLE');
  });
}

test('SOP metadata, unique requirement strings and search do not create behavioral evidence', () => {
  const { SOP_500_ITEMS, summarizeSop500 } = require('../systems/sop-500-checklist');
  const summary = summarizeSop500();
  assert.equal(summary.metadataValidCount, 500);
  assert.equal(new Set(SOP_500_ITEMS.map((item) => item.id)).size, 500);
  assert.equal(new Set(SOP_500_ITEMS.map((item) => item.requirement)).size, 500);
  assert.equal(summary.acceptedDistinctControlCount, 0);
  assert.equal(summary.verifiedPoints, 0);
  assert.equal(summary.grade, 'UNVERIFIED');
  assert.equal(summary.releaseVerified, false);
  assert.equal(summary.sourceAvailability.status, 'AVAILABLE');
  assert.ok(summarizeSop500('SOP-001').items.some((item) => item.id === 'SOP-001'));
  assert.equal(summarizeSop500('', 'Backend').matchedCount, 150);
  assert.ok(summary.items.every((item) => item.status === 'NOT_RUN' && !item.verified && item.evidence.length === 0));
});

test('missing required files fail closed; a refreshed run invalidates cached source evidence', () => {
  let missing = false;
  const scopedRequire = (id) => id === 'fs' ? {
    ...fs,
    readFileSync(file, ...args) {
      if (missing && path.basename(file) === 'main.js') throw Object.assign(new Error('fixture missing source'), { code: 'ENOENT' });
      return fs.readFileSync(file, ...args);
    }
  } : require(id);
  const ctx = loadVm(source, { require: scopedRequire });
  const auditor = new ctx.module.exports.Forensic25Pass10IterationAuditor();
  assert.equal(auditor._getCodebaseVerificationCache().status, 'PASS');
  missing = true;
  const refreshed = auditor._getCodebaseVerificationCache(true);
  assert.equal(refreshed.status, 'FAIL');
  assert.equal(refreshed.owaspOk, false);
  assert.equal(refreshed.error, 'ENOENT');
});

test('explicitly unavailable required engines do not construct replacements or invent telemetry', () => {
  const { Forensic25Pass10IterationAuditor } = require('../systems/forensic-25-pass-10-iteration-auditor');
  const report = new Forensic25Pass10IterationAuditor().runFull10Iteration25PassAudit({ pantheon: null, bleedingEdge: null });
  assert.equal(report.ok, false);
  assert.equal(report.releaseVerified, false);
  assert.equal(report.diagnosticExecutionCount, 0);
  assert.equal(report.iterationsCompleted, 0);
  assert.equal(report.diagnosticStatusCounts.BLOCKED, 500);
  assert.equal(report.totalAtomicAuditPointsPassed, 0);
  assert.ok(report.iterationReports.every((entry) => entry.totalOnlinePlasticUpdates === null && entry.stochasticInt8Updates === null));
});

test('engine exception is a failed diagnostic and restores supplied sensory inputs', () => {
  const { Forensic25Pass10IterationAuditor } = require('../systems/forensic-25-pass-10-iteration-auditor');
  const runtime = { continuousWorldModel: { latentZ64: new Float32Array(64).fill(0.25) }, trainableAlifeNeuralHub: { zPerc16: new Float32Array(16).fill(0.5), tdAdvantageDelta: 0.75 } };
  const before = Array.from(runtime.continuousWorldModel.latentZ64);
  const report = new Forensic25Pass10IterationAuditor().runFull10Iteration25PassAudit({ runtime, pantheon: { step60Hz() { throw new Error('fixture step failure'); } }, bleedingEdge: {} });
  assert.equal(report.ok, false);
  assert.equal(report.diagnosticExecutionCount, 0);
  assert.equal(report.iterationsCompleted, 0);
  assert.equal(report.errors[0].error, 'fixture step failure');
  assert.deepEqual(Array.from(runtime.continuousWorldModel.latentZ64), before);
  assert.ok(runtime.trainableAlifeNeuralHub.zPerc16.every((value) => value === 0.5));
  assert.equal(runtime.trainableAlifeNeuralHub.tdAdvantageDelta, 0.75);
});

test('bounded real fixture reports 50 unique checks and 500 executions, never 500 verified controls', () => {
  const { Forensic25Pass10IterationAuditor } = require('../systems/forensic-25-pass-10-iteration-auditor');
  const report = new Forensic25Pass10IterationAuditor().runFull10Iteration25PassAudit();
  assert.equal(report.ok, true, JSON.stringify(report.checkExecutions.filter((check) => check.status !== 'PASS')));
  assert.equal(report.uniqueDiagnosticChecks, 50);
  assert.equal(new Set(report.checkExecutions.map((check) => check.id)).size, 50);
  assert.equal(report.diagnosticExecutionCount, 500);
  assert.equal(report.verifiedControlCount, 0);
  assert.equal(report.engineeringCyclesCompleted, 0);
  assert.equal(report.releaseStatus, 'NOT_RUN');
  assert.ok(report.checkExecutions.every((check) => check.requirementStatus === 'NOT_RUN'));
});

test('required failures propagate a nonzero CLI exit with JSON diagnostic output', () => {
  const module = { exports: {} };
  let exitCode = null;
  let output = '';
  const scopedRequire = () => { throw new Error('required dependency unavailable'); };
  scopedRequire.main = module;
  loadVm(source, { module, require: scopedRequire, process: { exit(code) { exitCode = code; } }, console: { log(text) { output += text; } } });
  assert.equal(exitCode, 1);
  const report = JSON.parse(output);
  assert.equal(report.ok, false);
  assert.equal(report.releaseVerified, false);
  assert.equal(report.diagnosticStatusCounts.BLOCKED, 500);
});

test('100 source and fixture diagnostics have no manufactured positional SOP mapping', () => {
  const report = require('../systems/pass-100-verifier').run100PassAudit();
  assert.equal(report.ok, true, JSON.stringify(report.failedPasses));
  assert.equal(report.sopVerified, 0);
  assert.equal(report.verifiedControlCount, 0);
  assert.equal(report.releaseStatus, 'NOT_RUN');
  assert.equal(report.uniqueDiagnosticChecks, 125);
  assert.equal(report.diagnosticExecutionCount, 125);
  assert.ok(report.byEvidenceKind.SOURCE_INSPECTION.total > 0);
  assert.ok(report.byEvidenceKind.UNIT_TEST.total > 0);
  assert.ok(report.passes.every((check) => check.sopIds.length === 0 && check.sopCount === 0 && check.sopRange === null));
});


test('browser fixture can pass runtime diagnostics while source inspection stays NOT_RUN', () => {
  const ctx = loadVm(source, {
    PortedMultiverseBrainsFederation: require('../systems/ported-multiverse-brains').PortedMultiverseBrainsFederation,
    BleedEdge25AlifeEngine: require('../systems/alife-25-bleeding-edge-models').BleedEdge25AlifeEngine,
    Float32Array, Float64Array, BigUint64Array, Int32Array, Uint16Array, Int8Array, Uint8Array
  });
  const report = new ctx.module.exports.Forensic25Pass10IterationAuditor().runFull10Iteration25PassAudit();
  assert.equal(report.ok, false);
  assert.equal(report.runtimeDiagnosticsOk, true);
  assert.equal(report.diagnosticStatusCounts.PASS, 450);
  assert.equal(report.diagnosticStatusCounts.NOT_RUN, 50);
  assert.equal(report.diagnosticExecutionCount, 450);
  assert.equal(report.sourceInspection.status, 'NOT_RUN');
  assert.equal(report.releaseVerified, false);
});
