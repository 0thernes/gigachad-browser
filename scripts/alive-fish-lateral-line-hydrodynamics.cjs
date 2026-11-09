#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const fishHydro = require('../systems/alive-fish-lateral-line-hydrodynamics.js');

const report = fishHydro.runFiveSeedFishHydrodynamicsBenchmark();
const reportsDir = path.join(__dirname, '..', 'docs', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const jsonPath = path.join(reportsDir, 'alive-fish-lateral-line-hydrodynamics-2026-11-09.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

function buildSvg(rep) {
  const agg = rep.aggregatedByProfile;
  const profiles = [
    'uncoupled-random-drifters',
    'nearest-neighbor-slow-cascade',
    'rigid-global-lock-echo-chamber',
    'lateral-line-kuramoto-cstart-school'
  ];
  const colors = {
    'uncoupled-random-drifters': '#f43f5e',
    'nearest-neighbor-slow-cascade': '#f59e0b',
    'rigid-global-lock-echo-chamber': '#38bdf8',
    'lateral-line-kuramoto-cstart-school': '#34d399'
  };
  let rowsSvg = '';
  profiles.forEach((id, idx) => {
    const p = agg[id];
    const y = 92 + idx * 54;
    const w = Math.round((p.fishHydroCompositeScore.mean / 100) * 340);
    rowsSvg += `
      <text x="245" y="${y + 18}" fill="#cbd5e1" font-family="Consolas, monospace" font-size="12" text-anchor="end">${id}</text>
      <rect x="255" y="${y}" width="340" height="26" rx="4" fill="#0f172a" stroke="#1e293b"/>
      <rect x="255" y="${y + 2}" width="${Math.max(2, w)}" height="22" rx="3" fill="${colors[id]}"/>
      <text x="605" y="${y + 18}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="12">score=${p.fishHydroCompositeScore.mean.toFixed(2)} | sync=${p.kuramotoSyncHealthPct.mean.toFixed(1)}% | evade=${p.cStartEvasionSurvivalPct.mean.toFixed(1)}% | glitchImm=${p.byzantineGlitchImmunityPct.mean.toFixed(1)}% | R=${p.meanKuramotoR.mean.toFixed(4)} | lat=${p.meanEvasionWaveLatencyMs.mean.toFixed(2)}ms</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="340" viewBox="0 0 1180 340">
  <rect width="1180" height="340" fill="#020617"/>
  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="16" font-weight="bold">ALIVE PASS 28 — Fish-School Lateral-Line Hydrodynamics &amp; Kuramoto Phase Synchronization (5 Seeds)</text>
  <text x="24" y="58" fill="#94a3b8" font-family="Consolas, monospace" font-size="12">Seeds: ${rep.seeds.join(', ')} · Winner: ${rep.summary.winningProfile} (${rep.summary.fullHydroScoreMean.toFixed(1)}/100) · Kuramoto R: ${rep.summary.meanKuramotoR.toFixed(4)} · C-Start Wave Latency: ${rep.summary.meanEvasionWaveLatencyMs.toFixed(2)} ms</text>
  ${rowsSvg}
  <text x="24" y="322" fill="#64748b" font-family="Consolas, monospace" font-size="11">24 hydrodynamic scenarios/seed (6 Kuramoto stream sync, 6 predator C-start evasion, 6 Byzantine neuromast glitch, 6 vortex shear recovery)</text>
</svg>\n`;
}

const svgPath = path.join(reportsDir, 'alive-fish-lateral-line-hydrodynamics-2026-11-09.svg');
fs.writeFileSync(svgPath, buildSvg(report), 'utf8');

console.log('[Pass 28] Wrote:', jsonPath);
console.log('[Pass 28] Wrote:', svgPath);
console.log('[Pass 28] Summary:', JSON.stringify(report.summary));
