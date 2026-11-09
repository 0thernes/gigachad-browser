#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const onionPow = require('../systems/alive-onion-pow-client-auth.js');

const report = onionPow.runFiveSeedOnionPowClientAuthBenchmark();
const reportsDir = path.join(__dirname, '..', 'docs', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const jsonPath = path.join(reportsDir, 'alive-onion-pow-client-auth-2026-11-09.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

function buildSvg(rep) {
  const agg = rep.aggregatedByProfile;
  const profiles = [
    'unauthenticated-no-pow',
    'client-auth-only-no-pow',
    'static-low-pow-no-mac-verify',
    'full-equix-pow-x25519-client-auth'
  ];
  const colors = {
    'unauthenticated-no-pow': '#f43f5e',
    'client-auth-only-no-pow': '#f59e0b',
    'static-low-pow-no-mac-verify': '#38bdf8',
    'full-equix-pow-x25519-client-auth': '#34d399'
  };
  let rowsSvg = '';
  profiles.forEach((id, idx) => {
    const p = agg[id];
    const y = 92 + idx * 54;
    const w = Math.round((p.powAuthCompositeScore.mean / 100) * 340);
    rowsSvg += `
      <text x="235" y="${y + 18}" fill="#cbd5e1" font-family="Consolas, monospace" font-size="12" text-anchor="end">${id}</text>
      <rect x="245" y="${y}" width="340" height="26" rx="4" fill="#0f172a" stroke="#1e293b"/>
      <rect x="245" y="${y + 2}" width="${Math.max(2, w)}" height="22" rx="3" fill="${colors[id]}"/>
      <text x="595" y="${y + 18}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="12">score=${p.powAuthCompositeScore.mean.toFixed(2)} | rend=${p.legitimateRendezvousRatePct.mean.toFixed(1)}% | x25519=${p.privateAuthDecryptionRatePct.mean.toFixed(1)}% | ddosQ=${p.ddosQueueAdmissionRatePct.mean.toFixed(1)}% | macRej=${p.tamperedDescriptorRejectionRatePct.mean.toFixed(1)}%</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="340" viewBox="0 0 1080 340">
  <rect width="1080" height="340" fill="#020617"/>
  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="16" font-weight="bold">ALIVE PASS 22 — Tor v3 .onion Equi-X PoW (Proposal 327) &amp; x25519 Client Auth (5 Seeds)</text>
  <text x="24" y="58" fill="#94a3b8" font-family="Consolas, monospace" font-size="12">Seeds: ${rep.seeds.join(', ')} · Winner: ${rep.summary.winningProfile} (${rep.summary.fullPowAuthScoreMean.toFixed(1)}/100) · Mean Equi-X Effort: ${rep.summary.meanEquiXEffort.toFixed(1)} · Mean Solve: ${rep.summary.meanEquiXSolveTimeMs.toFixed(2)} ms</text>
  ${rowsSvg}
  <text x="24" y="322" fill="#64748b" font-family="Consolas, monospace" font-size="11">20 .onion v3 scenarios/seed (5 public normal, 5 public DDoS flood, 5 private x25519 DDoS flood, 5 tampered D_MAC / expired PoW seed)</text>
</svg>\n`;
}

const svgPath = path.join(reportsDir, 'alive-onion-pow-client-auth-2026-11-09.svg');
fs.writeFileSync(svgPath, buildSvg(report), 'utf8');

console.log('[Pass 22] Wrote:', jsonPath);
console.log('[Pass 22] Wrote:', svgPath);
console.log('[Pass 22] Summary:', JSON.stringify(report.summary));
