'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const synergy = require('../systems/alive-full-stack-hybrid-synergy-benchmark.js');

test('5-seed Full-Stack End-to-End Hybrid Synergy Benchmark verifies full-stack-omega-hybrid-synergy-fabric superiority', () => {
  const report = synergy.runFullStackHybridSynergyBenchmark();
  assert.equal(report.passId, 'ALIVE-PASS-39-FULL-STACK-HYBRID-SYNERGY-BENCHMARK');
  assert.equal(report.seeds.length, 5);
  assert.equal(report.facultyCount, 36);
  assert.equal(report.brainCount, 14);
  assert.equal(report.precisionTierCount, 7);
  assert.equal(report.summary.winningProfile, 'full-stack-omega-hybrid-synergy-fabric');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.fullSynergyScoreMean, 100);
  assert.equal(report.summary.endToEndMissionSuccessPctMean, 100);
  assert.equal(report.summary.torSwarmReachabilityPctMean, 100);
  assert.equal(report.summary.neurosymbolicCausalAccuracyPctMean, 100);
  assert.equal(report.summary.securityByzantineImmunityPctMean, 100);
  assert.ok(report.summary.gainVsClearnetSingle === 100);
  assert.ok(report.summary.gainVsTorSwarmOnly >= 70);
  assert.ok(report.summary.gainVsNoWatchdogWal >= 30);
});
