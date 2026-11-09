'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const TorMatrix = require('../systems/alive-tor-acceptance-matrix.js');

test('Pass 15 verifyOwnedTorDaemonLifecycle validates owned Tor process spawn, --defaults-torrc, ClientOnly 1, 100% bootstrap and SIGTERM stop', () => {
  const res = TorMatrix.verifyOwnedTorDaemonLifecycle(19013);
  assert.equal(res.passed, true);
  assert.equal(res.bootstrapProgress, 100);
  assert.equal(res.statusWhenReady, 'ready');
  assert.equal(res.statusAfterStop, 'stopped');
});

test('Pass 15 run executes all 10 named Tor Hybrid Synergy Mesh acceptance rows (T1..T10) across 5 seeds with 100% verification', async () => {
  const report = await TorMatrix.run();
  assert.equal(report.status, 'completed');
  assert.equal(report.liveRuntimeModified, false);
  assert.equal(report.protocol.seeds.length, 5);
  assert.equal(report.summary.verifiedRowCount, 10);
  assert.equal(report.summary.totalAcceptanceRows, 10);
  assert.equal(report.summary.all10RowsVerifiedOn5Seeds, true);
  assert.equal(report.summary.phase3HyperSwarmReady, true);
  assert.equal(typeof report.summary.phase2TorFrozenDigestSha256, 'string');
  assert.equal(report.summary.phase2TorFrozenDigestSha256.length, 64);

  for (const row of report.summary.matrixRows) {
    assert.equal(row.verified, true, `Expected ${row.rowId} to be verified`);
    assert.equal(row.passedSeeds, 5, `Expected ${row.rowId} to pass on 5/5 seeds`);
    assert.equal(row.evidenceDigestSha256.length, 64);
  }
});

test('Pass 15 run rejects invalid seed arrays', async () => {
  await assert.rejects(() => TorMatrix.run({ seeds: [1, 2, 3] }), /Exactly five distinct seeds/);
});
