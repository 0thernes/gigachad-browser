#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const phase6 = require('../systems/alive-neurosymbolic-phase6-audit.js');

function renderSvg(report) {
  const rows = report.matrixRows || [];
  let rowsSvg = '';
  rows.forEach((r, idx) => {
    const y = 92 + idx * 34;
    const fill = r.verified ? '#10b981' : '#f43f5e';
    rowsSvg += `
      <rect x="24" y="${y}" width="18" height="22" rx="3" fill="${fill}"/>
      <text x="52" y="${y + 16}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="13">${r.rowId} (Pass ${r.passRef})</text>
      <text x="580" y="${y + 16}" fill="#34d399" font-family="Consolas, monospace" font-size="13">${r.passedSeeds}/${r.totalSeeds} seeds PASS</text>
      <text x="730" y="${y + 16}" fill="#94a3b8" font-family="Consolas, monospace" font-size="12">${r.description.slice(0, 56)}</text>
    `;
  });

  const s = report.summary;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="460" viewBox="0 0 1180 460">
    <rect width="1180" height="460" fill="#020617"/>
    <text x="24" y="36" fill="#38bdf8" font-family="Consolas, monospace" font-size="18" font-weight="bold">ALIVE Pass 35 — Phase VI Neuro-Symbolic &amp; Active Inference Acceptance Matrix (N1..N10)</text>
    <text x="24" y="62" fill="#94a3b8" font-family="Consolas, monospace" font-size="13">Verified: ${s.verifiedRowCount}/${s.totalAcceptanceRows} (${s.acceptanceScorePct.toFixed(1)}%) | Phase VII Ready: ${s.phase7OmegaMissionReady} | SHA-256: ${s.phase6NeurosymbolicFrozenDigestSha256}</text>
    ${rowsSvg}
  </svg>`;
}

function main() {
  const report = phase6.runNeurosymbolicPhase6Audit();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-neurosymbolic-phase6-audit-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-neurosymbolic-phase6-audit-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(svgPath, renderSvg(report), 'utf8');
  console.log(JSON.stringify({
    verifiedRowCount: report.summary.verifiedRowCount,
    totalAcceptanceRows: report.summary.totalAcceptanceRows,
    acceptanceScorePct: report.summary.acceptanceScorePct,
    phase7OmegaMissionReady: report.summary.phase7OmegaMissionReady,
    phase6NeurosymbolicFrozenDigestSha256: report.summary.phase6NeurosymbolicFrozenDigestSha256
  }));
}

main();
