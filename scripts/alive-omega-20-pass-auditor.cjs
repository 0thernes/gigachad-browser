#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const OmegaAuditor = require('../systems/alive-omega-20-pass-auditor.js');

function renderSvg(report) {
  const s = report.summary;
  let phaseBars = '';
  (s.phaseLedger || []).forEach((p, idx) => {
    const y = 96 + idx * 54;
    const w = Math.round(320 * (p.verifiedPasses / p.totalPasses));
    phaseBars += `
    <text x="240" y="${y + 18}" text-anchor="end" fill="#cbd5e1" font-family="Consolas,monospace" font-size="11">${p.phaseId}</text>
    <rect x="252" y="${y}" width="320" height="26" rx="3" fill="#0f1b26" stroke="#1e293b"/>
    <rect x="252" y="${y + 2}" width="${w}" height="22" rx="2" fill="#34d399"/>
    <text x="584" y="${y + 18}" fill="#e2e8f0" font-family="Consolas,monospace" font-size="11">${p.verifiedPasses}/${p.totalPasses} (${p.passesRange}) · ${p.keyMilestone}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="310" viewBox="0 0 980 310">
  <rect width="980" height="310" fill="#05090f"/>
  <text x="24" y="32" fill="#67e8f9" font-family="Consolas,monospace" font-size="15" font-weight="bold">ALIVE Pass 20 — 20-Pass Grand Omega Synthesis &amp; Cryptographic Evidence Qualification</text>
  <text x="24" y="54" fill="#e2e8f0" font-family="Consolas,monospace" font-size="12">Passes Verified: ${s.verifiedPassesCount}/${s.totalPasses} · PDF Gates: ${s.promotedPdfGatesCount}/8 · Tor Rows: ${s.verifiedTorAcceptanceRowsCount}/10 · Swarm Pillars: ${s.verifiedSwarmPillarsCount}/5</text>
  <text x="24" y="72" fill="#94a3b8" font-family="Consolas,monospace" font-size="11">Omega Grand SHA-256 Root Digest: ${s.omegaGrandManifestSha256}</text>
  ${phaseBars}
  <text x="24" y="292" fill="#64748b" font-family="Consolas,monospace" font-size="11">Seeds: ${report.protocol.seeds.join(', ')} · 36 faculties · 14 brains × 7 precision · Tor Hybrid Synergy Mesh · Multi-Guild Exploration Swarms</text>
</svg>\n`;
}

async function main() {
  const report = await OmegaAuditor.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-omega-20-pass-auditor-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-omega-20-pass-auditor-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  fs.writeFileSync(svgPath, renderSvg(report), 'utf8');
  console.log(`Wrote ${jsonPath} and ${svgPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
