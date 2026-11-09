'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const ColonyFitness = require('../systems/alive-colony-population-fitness.js');

test('AliveColonyPopulationFitness enforces five distinct unsigned 32-bit seeds', async () => {
  await assert.rejects(
    () => ColonyFitness.run({ seeds: [1, 2, 3] }),
    /Exactly five distinct unsigned 32-bit seeds are required/
  );
});

test('AliveColonyPopulationFitness verifies 5-seed role differentiation, shared vs independent state separation, resource caps, and population fitness', async () => {
  const r1 = await ColonyFitness.run();
  const r2 = await ColonyFitness.run();

  assert.deepEqual(r1, r2);
  assert.equal(r1.status, 'completed');
  assert.equal(r1.summary.diffBeatSolitarySeeds, 5);
  assert.equal(r1.summary.diffBeatCloneSeeds, 5);
  assert.equal(r1.summary.diffBeatGreedySeeds, 5);
  assert.equal(r1.summary.allStateAuditsPassed, true);

  assert.ok(r1.summary.pairedDeltas.diffVsSolitaryFitnessGain.ci95[0] > 3.0);
  assert.ok(r1.summary.pairedDeltas.diffVsCloneFitnessGain.ci95[0] > 1.0);
  assert.ok(r1.summary.pairedDeltas.diffVsGreedyFitnessGain.ci95[0] > 3.0);

  for (const seedRun of r1.runs) {
    const sol = seedRun.regimes['solitary-host'];
    const cln = seedRun.regimes['undifferentiated-clone-colony'];
    const grd = seedRun.regimes['unbounded-greedy-colony'];
    const dif = seedRun.regimes['differentiated-role-colony'];

    // Matched compute budget across all 4 regimes
    assert.equal(sol.totalComputeSubstepsUsed, 200);
    assert.equal(cln.totalComputeSubstepsUsed, 200);
    assert.equal(grd.totalComputeSubstepsUsed, 200);
    assert.equal(dif.totalComputeSubstepsUsed, 200);

    // Bounded population cap enforced on greedy mitosis
    assert.equal(grd.populationSize, 5);
    assert.equal(grd.blockedMitosisAttempts, 5);

    // Differentiated colony assigns all 5 distinct COLONY_LENSES roles
    assert.equal(dif.uniqueRolesAssigned, 5);
    assert.equal(dif.metrics.nicheCoveragePct, 100);
    assert.equal(dif.metrics.starvationEvents, 0);
    assert.ok(dif.metrics.populationFitness > cln.metrics.populationFitness);
    assert.ok(dif.metrics.populationFitness > sol.metrics.populationFitness);
    assert.ok(dif.metrics.populationFitness > grd.metrics.populationFitness);
  }
});
