'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const OnionV3Verifier = require('../systems/alive-onion-v3-verifier.js');

test('Pass 13 RFC 7686 & Tor v3 .onion cryptographic verifier validates 56-char Base32 Ed25519 + SHA3-256 checksum and rejects all adversarial candidates across 5 seeds', async () => {
  // 1. Direct unit check of encodeOnionV3 + verifyOnionV3Address round-trip
  const pubkey = new Uint8Array(32);
  for (let i = 0; i < 32; i++) pubkey[i] = (i * 7 + 13) & 0xff;
  const onionHost = OnionV3Verifier.encodeOnionV3(pubkey);
  assert.equal(onionHost.length, 62, '56 Base32 chars + 6 chars (.onion)');
  const check = OnionV3Verifier.verifyOnionV3Address(onionHost);
  assert.equal(check.valid, true);
  assert.equal(check.reason, 'verified-v3-ed25519-sha3-256');
  assert.equal(check.rfc7686Sinkholed, true);
  assert.equal(check.version, 3);

  // 2. Five-seed evaluation check
  const report = await OnionV3Verifier.run();
  assert.equal(report.benchmark, 'pass-13-rfc7686-onion-v3-cryptographic-verifier-v1');
  assert.equal(report.status, 'completed');
  assert.equal(report.protocol.seeds.length, 5);

  const s = report.summary;
  assert.equal(s.fullBeatChecksumOnlySeeds, 5);
  assert.equal(s.fullBeatRegexOnlySeeds, 5);
  assert.equal(s.zeroFalsePositiveSeeds, 5);
  assert.equal(s.zeroRfc7686LeakSeeds, 5);

  const full = s.byVerifier['full-rfc7686-v3-onion-verifier'];
  const chkOnly = s.byVerifier['checksum-without-descriptor-sig'];
  const rgxOnly = s.byVerifier['regex-length-56-only'];
  const dnsPass = s.byVerifier['clearnet-dns-passthrough'];

  assert.equal(full.securityScore.mean, 100);
  assert.equal(full.validAcceptancePct.mean, 100);
  assert.equal(full.adversarialRejectionPct.mean, 100);
  assert.equal(full.falsePositives.mean, 0);
  assert.equal(full.rfc7686DnsLeaks.mean, 0);

  assert.ok(chkOnly.falsePositives.mean > 0, 'checksum-without-descriptor-sig accepts forged HSDir descriptors');
  assert.ok(rgxOnly.falsePositives.mean > chkOnly.falsePositives.mean, 'regex-length-56-only accepts corrupted SHA3-256 checksums');
  assert.ok(dnsPass.rfc7686DnsLeaks.mean > 0, 'clearnet-dns-passthrough leaks .onion queries to DNS');
});
