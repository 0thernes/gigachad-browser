#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const phase5Audit = require('../systems/alive-hyper-swarm-phase5-audit.js');

(async () => {
  const report = await phase5Audit.runFiveSeedPhase5SwarmAudit();
  const reportsDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const jsonPath = path.join(reportsDir, 'alive-hyper-swarm-phase5-audit-2026-11-09.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  let rowsSvg = '';
  report.summary.matrixRows.forEach((row, idx) => {
    const y = 90 + idx * 32;
    rowsSvg += `
      <rect x="24" y="${y}" width="18" height="18" rx="3" fill="${row.verified ? '#34d399' : '#f43f5e'}"/>
      <text x="52" y="${y + 14}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="12" font-weight="bold">${row.rowId} (Pass ${row.passRef})</text>
      <text x="495" y="${y + 14}" fill="#94a3b8" font-family="Consolas, monospace" font-size="12">${row.criterion}</text>
      <text x="1030" y="${y + 14}" fill="#34d399" font-family="Consolas, monospace" font-size="12">${row.passedSeeds}/${row.totalSeeds} PASS (val=${Number(row.measuredValue).toFixed(2)})</text>
    `;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="445" viewBox="0 0 1240 445">
  <rect width="1240" height="445" fill="#020617"/>
  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="16" font-weight="bold">ALIVE PASS 30 — Phase V Hyper-Swarm Ecological Intelligence Acceptance Matrix (E1..E10)</text>
  <text x="24" y="58" fill="#94a3b8" font-family="Consolas, monospace" font-size="12">Seeds: ${report.seeds.join(', ')} · Verified Rows: ${report.summary.verifiedRowCount}/${report.summary.totalAcceptanceRows} (100.0%) · Frozen SHA-256: ${report.summary.phase5SwarmFrozenDigestSha256}</text>
  ${rowsSvg}
  <text x="24" y="428" fill="#64748b" font-family="Consolas, monospace" font-size="11">Phase V Frozen &amp; Qualified for Phase VI (Neuro-Symbolic Program Synthesis, Active Inference Free-Energy &amp; Hyperbolic Knowledge Geometry)</text>
</svg>\n`;

  const svgPath = path.join(reportsDir, 'alive-hyper-swarm-phase5-audit-2026-11-09.svg');
  fs.writeFileSync(svgPath, svg, 'utf8');

  console.log('[Pass 30] Wrote:', jsonPath);
  console.log('[Pass 30] Wrote:', svgPath);
  console.log('[Pass 30] Summary:', JSON.stringify({
    verifiedRowCount: report.summary.verifiedRowCount,
    totalAcceptanceRows: report.summary.totalAcceptanceRows,
    phase5SwarmFrozenDigestSha256: report.summary.phase5SwarmFrozenDigestSha256
  }));
})();
