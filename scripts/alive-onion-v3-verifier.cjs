#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const OnionV3Verifier = require('../systems/alive-onion-v3-verifier.js');

function buildSvg(report) {
  const s = report.summary;
  const modes = report.protocol.verifiers;
  const colors = {
    'clearnet-dns-passthrough': '#f43f5e',
    'regex-length-56-only': '#f59e0b',
    'checksum-without-descriptor-sig': '#38bdf8',
    'full-rfc7686-v3-onion-verifier': '#34d399'
  };
  const width = 980, height = 390;
  const rows = [];
  rows.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  rows.push(`<rect width="100%" height="100%" fill="#05090f"/>`);
  rows.push(`<text x="20" y="28" fill="#67e8f9" font-family="Consolas, monospace" font-size="14" font-weight="bold">ALIVE Pass 13 — RFC 7686 &amp; Tor Rendezvous v3 (.onion) Cryptographic Verifier (5 Seeds)</text>`);
  rows.push(`<text x="20" y="48" fill="#cbd5e1" font-family="Consolas, monospace" font-size="11">full vs checksum-only +${s.pairedDeltas.fullVsChecksumOnlySecurityGain.mean.toFixed(2)} (${s.fullBeatChecksumOnlySeeds}/5) · vs regex-only +${s.pairedDeltas.fullVsRegexOnlySecurityGain.mean.toFixed(2)} (${s.fullBeatRegexOnlySeeds}/5) · 0 false positives (${s.zeroFalsePositiveSeeds}/5) · 0 RFC 7686 DNS leaks (${s.zeroRfc7686LeakSeeds}/5)</text>`);

  const barMaxW = 340;
  modes.forEach((mode, idx) => {
    const entry = s.byVerifier[mode];
    const y = 76 + idx * 66;
    const sec = entry.securityScore.mean;
    const ci = entry.securityScore.ci95;
    const val = entry.validAcceptancePct.mean;
    const rej = entry.adversarialRejectionPct.mean;
    const fp = entry.falsePositives.mean;
    const lks = entry.rfc7686DnsLeaks.mean;
    const w = Math.max(2, (sec / 100) * barMaxW);

    rows.push(`<text x="235" y="${y + 16}" fill="#e2e8f0" text-anchor="end" font-family="Consolas, monospace" font-size="11">${mode}</text>`);
    rows.push(`<rect x="245" y="${y}" width="${barMaxW}" height="24" fill="#0f1b26" stroke="#1e293b"/>`);
    rows.push(`<rect x="245" y="${y + 3}" width="${w.toFixed(1)}" height="18" fill="${colors[mode]}"/>`);
    rows.push(`<text x="${253 + barMaxW}" y="${y + 15}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="11">sec=${sec.toFixed(2)} [${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}] · validAcc=${val.toFixed(1)}% · advRej=${rej.toFixed(1)}% · falsePos=${fp.toFixed(0)}</text>`);
    rows.push(`<text x="245" y="${y + 40}" fill="#94a3b8" font-family="Consolas, monospace" font-size="10">rfc7686DnsLeaks=${lks.toFixed(0)} · 56-char Base32 Ed25519 + SHA3-256(&quot;.onion checksum&quot;||PUBKEY||0x03)</text>`);
  });

  rows.push(`<text x="20" y="${height - 16}" fill="#64748b" font-family="Consolas, monospace" font-size="10">Seeds: ${report.protocol.seeds.join(', ')} · 20 candidates/seed (8 valid v3, 4 bad SHA3-256 checksum, 4 deprecated v2, 4 forged HSDir Ed25519 descriptor)</text>`);
  rows.push(`</svg>`);
  return rows.join('\n');
}

async function main() {
  const report = await OnionV3Verifier.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-onion-v3-verifier-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-onion-v3-verifier-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(svgPath, buildSvg(report));
  console.log('Pass 13 JSON & SVG written:', {
    jsonPath,
    svgPath,
    fullBeatChecksumOnlySeeds: report.summary.fullBeatChecksumOnlySeeds,
    fullBeatRegexOnlySeeds: report.summary.fullBeatRegexOnlySeeds,
    zeroFalsePositiveSeeds: report.summary.zeroFalsePositiveSeeds,
    zeroRfc7686LeakSeeds: report.summary.zeroRfc7686LeakSeeds
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
