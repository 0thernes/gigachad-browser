'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const FaultRecovery = require('../systems/alive-browser-fault-recovery.js');

test('Pass 8 browser fault recovery verifies 100% workflow completion, 100% fault recovery, and 0 duplicate DOM mutations across 5 seeds', async () => {
  const report = await FaultRecovery.run();
  assert.equal(report.benchmark, 'pass-08-browser-fault-recovery-v1');
  assert.equal(report.status, 'completed');
  assert.equal(report.protocol.seeds.length, 5);
  assert.deepEqual(report.protocol.controllers, [
    'unbuffered-naive-nav',
    'retry-without-backoff',
    'circuit-breaker-only',
    'full-fault-tolerant-navigator'
  ]);

  const s = report.summary;
  assert.equal(s.fullBeatCircuitSeeds, 5, 'full-fault-tolerant-navigator must beat circuit-breaker-only on 5/5 seeds');
  assert.equal(s.fullBeatNaiveSeeds, 5, 'full-fault-tolerant-navigator must beat unbuffered-naive-nav on 5/5 seeds');
  assert.equal(s.exact100CompletionSeeds, 5, 'full-fault-tolerant-navigator must achieve 100% completion on 5/5 seeds');
  assert.equal(s.zeroDuplicateDomSeeds, 5, 'full-fault-tolerant-navigator must achieve 0 duplicate DOM mutations on 5/5 seeds');

  const full = s.byController['full-fault-tolerant-navigator'];
  const circuit = s.byController['circuit-breaker-only'];
  const retry = s.byController['retry-without-backoff'];
  const naive = s.byController['unbuffered-naive-nav'];

  assert.equal(full.workflowCompletionPct.mean, 100);
  assert.equal(full.faultRecoveryPct.mean, 100);
  assert.equal(full.duplicateDomMutations.mean, 0);
  assert.equal(full.unhandledTabCrashes.mean, 0);
  assert.equal(full.rateLimitViolations.mean, 0);
  assert.equal(full.wastedRetryRequests.mean, 0);
  assert.equal(full.reliabilityScore.mean, 100);

  assert.ok(full.reliabilityScore.mean > circuit.reliabilityScore.mean + 40);
  assert.ok(full.reliabilityScore.mean > retry.reliabilityScore.mean + 60);
  assert.ok(full.reliabilityScore.mean > naive.reliabilityScore.mean + 80);
});
