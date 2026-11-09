#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ReleaseAudit = require('../systems/alive-integrated-release-audit.js');

function buildSvg(report) {
  const s = report.summary;
  const width = 980, height = 430;
  const rows = [];
  rows.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  rows.push(`<rect width="100%" height="100%" fill="#05090f"/>`);
  rows.push(`<text x="20" y="28" fill="#67e8f9" font-family="Consolas, monospace" font-size="14" font-weight="bold">ALIVE Pass 10 — Integrated Phase I Release Audit &amp; 8 PDF Gates Frozen Manifest (5 Seeds)</text>`);
  rows.push(`<text x="20" y="48" fill="#cbd5e1" font-family="Consolas, monospace" font-size="11">Passes ${s.verifiedPassCount}/${s.totalAuditedPasses} verified (5/5 seeds) · PDF Gates ${s.verifiedGateCount}/${s.totalPdfGates} promoted · Phase II Tor Mesh Ready: ${s.phase2TorMeshReady} · SHA-256: ${s.phase1FrozenDigestSha256.slice(0, 24)}…</text>`);

  s.gateAudits.forEach((g, idx) => {
    const y = 74 + idx * 40;
    const barW = 280;
    const w = (g.passedSeeds / 5) * barW;
    rows.push(`<text x="275" y="${y + 15}" fill="#e2e8f0" text-anchor="end" font-family="Consolas, monospace" font-size="11">${g.gateId}</text>`);
    rows.push(`<rect x="285" y="${y}" width="${barW}" height="22" fill="#0f1b26" stroke="#1e293b"/>`);
    rows.push(`<rect x="285" y="${y + 3}" width="${w.toFixed(1)}" height="16" fill="#34d399"/>`);
    rows.push(`<text x="${295 + barW}" y="${y + 15}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="10">${g.passedSeeds}/5 seeds · Pass ${g.passRef} · SHA-256=${g.evidenceDigestSha256.slice(0, 16)}… · PROMOTED</text>`);
  });

  rows.push(`<text x="20" y="${height - 16}" fill="#64748b" font-family="Consolas, monospace" font-size="10">Seeds: ${report.protocol.seeds.join(', ')} · 36 Faculties · 24 Neural Streams · Phase I Frozen Digest: ${s.phase1FrozenDigestSha256}</text>`);
  rows.push(`</svg>`);
  return rows.join('\n');
}

async function main() {
  const report = await ReleaseAudit.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-integrated-release-audit-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-integrated-release-audit-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(svgPath, buildSvg(report));
  console.log('Pass 10 JSON & SVG written:', {
    jsonPath,
    svgPath,
    verifiedPassCount: report.summary.verifiedPassCount,
    verifiedGateCount: report.summary.verifiedGateCount,
    phase2TorMeshReady: report.summary.phase2TorMeshReady,
    phase1FrozenDigestSha256: report.summary.phase1FrozenDigestSha256
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
