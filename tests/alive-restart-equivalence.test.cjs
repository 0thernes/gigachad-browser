const test = require('node:test');
const assert = require('node:assert/strict');
const RestartEq = require('../systems/alive-restart-equivalence.js');

test('AliveRestartEquivalence enforces five distinct unsigned 32-bit seeds', async () => {
  await assert.rejects(() => RestartEq.run({ seeds: [1, 2, 3, 4] }), /five distinct unsigned 32-bit seeds/i);
  await assert.rejects(() => RestartEq.run({ seeds: [1, 1, 2, 3, 4] }), /five distinct unsigned 32-bit seeds/i);
  await assert.rejects(() => RestartEq.run({ seeds: [-1, 2, 3, 4, 5] }), /five distinct unsigned 32-bit seeds/i);
});

test('AliveRestartEquivalence achieves bit-exact split-horizon restart equivalence across all 5 seeds and proves leave-one-domain-out necessity for all 6 declared state domains', async () => {
  const reportA = await RestartEq.run();
  const reportB = await RestartEq.run();

  assert.equal(reportA.status, 'completed');
  assert.equal(reportA.liveRuntimeModified, false);
  assert.equal(reportA.protocol.liveRuntimeModified, false);
  assert.deepEqual(reportA.protocol.seeds, [19013, 29017, 39023, 49031, 59053]);
  assert.deepEqual(reportA.protocol.contractDomains, [
    'optimizer',
    'recurrent',
    'replay',
    'rng',
    'curriculum',
    'synapticFabric'
  ]);

  // Determinism across repeated runs
  assert.equal(reportA.runs[0].finalReferenceDigestSha256, reportB.runs[0].finalReferenceDigestSha256);
  assert.equal(reportA.runs[4].finalRestoredDigestSha256, reportB.runs[4].finalRestoredDigestSha256);

  // Full 6-domain restore achieves exact equivalence (0.0 drift and matching SHA-256 digests) on 5/5 seeds
  assert.equal(reportA.summary.exactRestartEquivalenceSeeds, 5);
  assert.equal(reportA.summary.fullRestoreStateL2Drift.mean, 0);
  assert.equal(reportA.summary.fullRestoreMaxAbsError.mean, 0);
  assert.equal(reportA.summary.fullRestoreMotorL2Drift.mean, 0);

  for (const run of reportA.runs) {
    assert.equal(run.midDigestMatch, true, `Seed ${run.seed} mid-horizon digest should match`);
    assert.equal(run.finalDigestMatch, true, `Seed ${run.seed} final post-restore digest should match`);
    assert.equal(run.finalRestoredDigestSha256, run.finalReferenceDigestSha256);
    assert.equal(run.fullRestoreL2Drift, 0);
    assert.equal(run.fullRestoreMaxAbsError, 0);
    assert.equal(run.fullRestoreMotorL2Drift, 0);
    assert.equal(run.finalReplayOccupancy, 12);
    assert.equal(run.finalCurriculumStage, 'F');
    for (const dom of RestartEq.CONTRACT_DOMAINS) {
      assert.equal(run.domainDigestMatches[dom], true, `Seed ${run.seed} domain ${dom} digest should match`);
    }
  }

  // Omitting any single state domain causes trajectory divergence on 5/5 seeds
  assert.equal(reportA.summary.all6DomainsNecessaryOn5Seeds, true);
  for (const dom of RestartEq.CONTRACT_DOMAINS) {
    const entry = reportA.summary.domainNecessity[dom];
    assert.ok(entry, `Missing domain necessity entry for ${dom}`);
    assert.equal(entry.divergingSeeds, 5, `Omitting ${dom} must diverge on 5/5 seeds`);
    assert.equal(entry.exactMatchWhenIncludedSeeds, 5, `Including ${dom} must match on 5/5 seeds`);
    assert(entry.stateL2DriftWhenOmitted.mean > 0, `Omitting ${dom} must produce positive state L2 drift`);
    assert(entry.motorL2DriftWhenOmitted.mean > 0, `Omitting ${dom} must produce positive motor L2 drift`);
  }
});
