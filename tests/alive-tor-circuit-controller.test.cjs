'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const TorCircuitController = require('../systems/alive-tor-circuit-controller.js');

test('Pass 12 Tor ControlPort circuit controller verifies 100% stream attribution, 100% sybil /16 & ASN path rejection, and 0 post-NEWNYM dirty reuse across 5 seeds', async () => {
  const report = await TorCircuitController.run();
  assert.equal(report.benchmark, 'pass-12-tor-controlport-circuit-observability-v1');
  assert.equal(report.status, 'completed');
  assert.equal(report.protocol.seeds.length, 5);
  assert.deepEqual(report.protocol.controllers, [
    'unmonitored-blind-socks',
    'passive-controlport-observer',
    'newnym-without-path-diversity',
    'full-controlport-circuit-governor'
  ]);

  const s = report.summary;
  assert.equal(s.fullBeatNewnymOnlySeeds, 5);
  assert.equal(s.fullBeatPassiveSeeds, 5);
  assert.equal(s.exact100AttributionSeeds, 5);
  assert.equal(s.zeroSybilPathSeeds, 5);
  assert.equal(s.zeroDirtyReuseSeeds, 5);

  const full = s.byController['full-controlport-circuit-governor'];
  const newnymOnly = s.byController['newnym-without-path-diversity'];
  const passive = s.byController['passive-controlport-observer'];

  assert.equal(full.observabilityScore.mean, 100);
  assert.equal(full.streamAttributionPct.mean, 100);
  assert.equal(full.sybilRejectionPct.mean, 100);
  assert.equal(full.newnymCleanlinessPct.mean, 100);
  assert.equal(full.sybilPathsUsed.mean, 0);
  assert.equal(full.dirtyCircuitReusesAfterNewnym.mean, 0);

  assert.ok(newnymOnly.sybilPathsUsed.mean > 0, 'newnym-without-path-diversity uses colocated sybil paths');
  assert.ok(passive.dirtyCircuitReusesAfterNewnym.mean > 0, 'passive-controlport-observer reuses dirty circuits after NEWNYM');
});
