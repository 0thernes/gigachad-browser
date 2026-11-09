'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ProvenanceEval = require('../systems/alive-research-provenance-evaluator.js');

test('Pass 7 research provenance evaluator verifies 100% contradiction recall, 0% hallucination, and 5/5 seed superiority', async () => {
  const report = await ProvenanceEval.run();
  assert.equal(report.benchmark, 'pass-07-research-provenance-contradiction-writing-v1');
  assert.equal(report.status, 'completed');
  assert.equal(report.protocol.seeds.length, 5);
  assert.deepEqual(report.protocol.pipelines, [
    'ungrounded-freeform',
    'naive-concatenator',
    'citation-only-filter',
    'provenance-contradiction-writer'
  ]);

  const s = report.summary;
  assert.equal(s.provBeatCitationSeeds, 5, 'provenance-contradiction-writer must beat citation-only-filter on 5/5 seeds');
  assert.equal(s.provBeatNaiveSeeds, 5, 'provenance-contradiction-writer must beat naive-concatenator on 5/5 seeds');
  assert.equal(s.exactContradictionRecallSeeds, 5, 'provenance-contradiction-writer must achieve 100% contradiction recall on 5/5 seeds');
  assert.equal(s.zeroHallucinationSeeds, 5, 'provenance-contradiction-writer must achieve 0% unsupported/hallucinated claims on 5/5 seeds');

  const prov = s.byPipeline['provenance-contradiction-writer'];
  const citOnly = s.byPipeline['citation-only-filter'];
  const naive = s.byPipeline['naive-concatenator'];

  assert.equal(prov.claimPrecisionPct.mean, 100, '100% grounded claim precision');
  assert.equal(prov.primaryRecallPct.mean, 100, '100% primary proposition recall');
  assert.equal(prov.contradictionRecallPct.mean, 100, '100% contradiction recall');
  assert.equal(prov.hallucinationRatePct.mean, 0, '0% hallucinated claim rate');
  assert.ok(prov.compositeScore.mean > citOnly.compositeScore.mean + 40, 'composite score substantially exceeds citation-only-filter');
  assert.ok(prov.compositeScore.mean > naive.compositeScore.mean + 50, 'composite score substantially exceeds naive-concatenator');

  // Verify each seed's provenance-contradiction-writer run persisted Ghost Write output and detected all 3 contradictions with SHA-256 excerpt receipts
  for (const run of report.runs) {
    const pRun = run.pipelines['provenance-contradiction-writer'];
    assert.equal(pRun.notebookStatus, 'completed');
    assert.ok(pRun.notebookCharacters > 200);
    assert.equal(pRun.detectedContradictionsCount, 3);
    for (const c of pRun.detectedContradictions) {
      assert.equal(typeof c.primaryReceiptSha256, 'string');
      assert.equal(c.primaryReceiptSha256.length, 64);
      assert.equal(typeof c.conflictingReceiptSha256, 'string');
      assert.equal(c.conflictingReceiptSha256.length, 64);
      assert.ok(c.authorityDelta > 0);
    }
  }
});
