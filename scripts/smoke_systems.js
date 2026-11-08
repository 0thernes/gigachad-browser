const assert = require('assert');
const { ERD_ENTITIES, ERD_RELATIONSHIPS, auditErdIntegrity } = require('../systems/erd-schema');
const { ERM_RISK_REGISTER, evaluateErmPosture } = require('../systems/erm-risk-engine');
const { ERP_RESOURCE_QUOTAS, evaluateErpPlan } = require('../systems/erp-resource-planner');
const { SOP_DOMAINS, SOP_500_ITEMS, summarizeSop500 } = require('../systems/sop-500-checklist');

// 1. ERD Schema & Referential Integrity Tests
assert.strictEqual(Object.keys(ERD_ENTITIES).length, 12, 'ERD must define 12 core entities');
assert.strictEqual(ERD_RELATIONSHIPS.length, 9, 'ERD must define 9 entity relationships');

const cleanAudit = auditErdIntegrity({
  tabSessions: [{ id: 'tab_1', url: 'https://example.com', title: 'Example' }],
  historyRecords: [{ url: 'https://example.com', title: 'Example', at: '2026-11-02T00:00:00Z' }],
  bookmarkItems: [{ url: 'https://example.com', title: 'Example', at: '2026-11-02T00:00:00Z' }],
  closedTabStack: [{ url: 'https://news.ycombinator.com', title: 'HN', closedAt: '2026-11-02T00:00:00Z' }],
  memoryVaultNotes: [{ id: 'm_1', url: 'https://example.com', title: 'Note', summary: 'Summary', embedding: [0.1, 0.2] }],
  oneTabGroups: [{ id: 'ot_1', timestamp: 'now', tabs: [{ url: 'https://example.com', title: 'Ex' }] }],
  vibeSitePatches: { 'example.com': { css: 'body {}', js: '', updated: 'now' } },
  temporalSnapshots: { 'https://example.com': { text: 'hello', timestamp: 123 } },
  kanbanCards: [{ id: 'k_1', title: 'Test', col: 'backlog', tag: 'Backend' }],
  downloadsList: [{ id: 'd_1', filename: 'file.pdf', url: 'https://example.com/a.pdf', state: 'completed' }]
});
assert.strictEqual(cleanAudit.ok, true, 'Clean ERD store audit must pass with 0 violations');
assert.strictEqual(cleanAudit.violationCount, 0);

const badAudit = auditErdIntegrity({
  historyRecords: [{ url: 'javascript:alert(1)', title: 'Bad' }],
  kanbanCards: [{ id: 'k_bad', title: 'Invalid col', col: 'invalid_col' }]
});
assert.strictEqual(badAudit.ok, false, 'Malformed ERD store must flag violations');
assert.ok(badAudit.violationCount >= 2);

// 2. ERM Enterprise Risk Management Engine Tests
assert.strictEqual(ERM_RISK_REGISTER.length, 12, 'ERM register must contain 12 enterprise risks');
const ermReport = evaluateErmPosture({ piiScrubEnabled: true, sidecarHealthy: true, failedAiCalls: 0 });
assert.strictEqual(ermReport.grade, 'A', 'Default mitigated ERM posture must achieve Grade A');
assert.ok(ermReport.reductionPct >= 65, 'ERM controls must reduce inherent risk by at least 65%');
assert.strictEqual(ermReport.byAspect.Backend.count, 4);
assert.strictEqual(ermReport.byAspect.Frontend.count, 4);
assert.strictEqual(ermReport.byAspect['Full-Stack'].count, 4);
assert.ok(ermReport.risks.every((r) => typeof r.ownerModule === 'string' && r.ownerModule.length > 0), 'Every ERM risk must have a non-empty ownerModule');

const ermDegraded = evaluateErmPosture({ piiScrubEnabled: false, sidecarHealthy: false, failedAiCalls: 2 });
assert.ok(ermDegraded.avgResidualScore > ermReport.avgResidualScore, 'Disabling PII scrub or sidecar health must increase residual ERM risk score');

// 3. ERP Enterprise Resource Planner Tests
assert.ok(ERP_RESOURCE_QUOTAS.compute.vramMaxRecommendedMb === 7168);
const erpReport = evaluateErpPlan({
  vramUsedMb: 1450,
  vramTotalMb: 8192,
  historyCount: 25,
  bookmarkCount: 10,
  closedTabCount: 3,
  memoryVaultCount: 12,
  kanbanCount: 7,
  aiP50Ms: 65,
  aiP95Ms: 180,
  totalAiCalls: 10,
  failedAiCalls: 0,
  autoHeals: 0,
  blockedTrackers: 42,
  uptimeSec: 360
});
assert.strictEqual(erpReport.ok, true);
assert.strictEqual(erpReport.compute.vramStatus, 'OPTIMAL');
assert.strictEqual(erpReport.sla.p50Status, 'PASS');
assert.strictEqual(erpReport.sla.p95Status, 'PASS');

// 4. 500-Point Grade-A SOP Frontier Browser Checklist Tests
assert.strictEqual(SOP_DOMAINS.length, 10, 'SOP must have 10 engineering domains');
assert.strictEqual(SOP_500_ITEMS.length, 500, `Expected exact 500 SOP items, got ${SOP_500_ITEMS.length}`);
const sopSummary = summarizeSop500();
assert.strictEqual(sopSummary.totalItems, 500);
assert.strictEqual(sopSummary.metadataValidCount, 500);
assert.strictEqual(sopSummary.verifiedCount, 0);
assert.strictEqual(sopSummary.statusCounts.NOT_RUN, 500);
assert.strictEqual(sopSummary.byAspect.Backend, 150, 'Backend must have 150 SOP items (DOM-01..03)');
assert.strictEqual(sopSummary.byAspect.Frontend, 150, 'Frontend must have 150 SOP items (DOM-04..06)');
assert.strictEqual(sopSummary.byAspect['Full-Stack'], 200, 'Full-Stack must have 200 SOP items (DOM-07..10)');
assert.strictEqual(SOP_500_ITEMS[0].id, 'SOP-001');
assert.strictEqual(SOP_500_ITEMS[499].id, 'SOP-500');

const seenIds = new Set();
const seenReqs = new Set();
for (const item of SOP_500_ITEMS) {
  assert.ok(!seenIds.has(item.id), `Duplicate SOP ID: ${item.id}`);
  assert.ok(item.requirement && item.requirement.length >= 15, `SOP requirement too short: ${item.id}`);
  seenIds.add(item.id);
  seenReqs.add(item.requirement);
}
assert.strictEqual(seenIds.size, 500);
assert.strictEqual(seenReqs.size, 500, 'All 500 SOP requirement descriptions must be unique');

// 5. Adversarial Null-Safety & Edge-Case Regression Tests across ERD, ERM, and ERP
const nullErd = auditErdIntegrity(null);
assert.strictEqual(nullErd.ok, true, 'auditErdIntegrity(null) must not throw and should return clean empty report');
const nonArrayErd = auditErdIntegrity({ history: 'not-an-array', bookmarks: 123, kanbanBoard: {} });
assert.strictEqual(nonArrayErd.ok, true, 'auditErdIntegrity with non-array fields must not throw');

const nullErm = evaluateErmPosture(null);
assert.strictEqual(nullErm.ok, true, 'evaluateErmPosture(null) must not throw');
const ermAiFailures = evaluateErmPosture({ piiScrubEnabled: true, sidecarHealthy: true, failedAiCalls: 6 });
assert.ok(ermAiFailures.avgResidualScore > ermReport.avgResidualScore, 'failedAiCalls > 0 must elevate ERM-FS-03 residual risk');

const nullErp = evaluateErpPlan(null, null);
assert.strictEqual(nullErp.ok, true, 'evaluateErpPlan(null, null) must not throw');
const p95DegradedErp = evaluateErpPlan({ aiP50Ms: 400, aiP95Ms: 9000 });
assert.strictEqual(p95DegradedErp.sla.p95Status, 'WARN', 'High p95 latency must trigger p95Status WARN');
assert.strictEqual(p95DegradedErp.sla.slaStatus, 'DEGRADED', 'High p95 latency must degrade overall slaStatus even when p50 is low');

console.log('smoke_systems ok (ERD=12 entities, ERM=Grade A, ERP=OPTIMAL, SOP=500 candidate definitions; product requirements NOT_RUN)');
