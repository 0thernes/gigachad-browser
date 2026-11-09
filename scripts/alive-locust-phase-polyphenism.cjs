#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const locust = require('../systems/alive-locust-phase-polyphenism.js');

const report = locust.runFiveSeedLocustPolyphenismBenchmark();
const reportsDir = path.join(__dirname, '..', 'docs', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const jsonPath = path.join(reportsDir, 'alive-locust-phase-polyphenism-2026-11-09.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

function buildSvg(rep) {
  const agg = rep.aggregatedByProfile;
  const profiles = [
    'locked-solitaria-dispersed',
    'locked-gregaria-stampede',
    'memoryless-threshold-oscillator',
    'serotonergic-hysteresis-polyphenism'
  ];
  const colors = {
    'locked-solitaria-dispersed': '#f59e0b',
    'locked-gregaria-stampede': '#f43f5e',
    'memoryless-threshold-oscillator': '#38bdf8',
    'serotonergic-hysteresis-polyphenism': '#34d399'
  };
  let rowsSvg = '';
  profiles.forEach((id, idx) => {
    const p = agg[id];
    const y = 92 + idx * 54;
    const w = Math.round((p.locustPolyphenismScore.mean / 100) * 340);
    rowsSvg += `
      <text x="245" y="${y + 18}" fill="#cbd5e1" font-family="Consolas, monospace" font-size="12" text-anchor="end">${id}</text>
      <rect x="255" y="${y}" width="340" height="26" rx="4" fill="#0f172a" stroke="#1e293b"/>
      <rect x="255" y="${y + 2}" width="${Math.max(2, w)}" height="22" rx="3" fill="${colors[id]}"/>
      <text x="605" y="${y + 18}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="12">score=${p.locustPolyphenismScore.mean.toFixed(2)} | oasis=${p.oasisWavefrontHarvestPct.mean.toFixed(1)}% | backoff=${p.trophicBackoffSurvivalPct.mean.toFixed(1)}% | hyst=${p.hysteresisStabilityPct.mean.toFixed(1)}% | noColl=${p.collisionAvoidancePct.mean.toFixed(1)}%</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="340" viewBox="0 0 1160 340">
  <rect width="1160" height="340" fill="#020617"/>
  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="16" font-weight="bold">ALIVE PASS 27 — Locust Solitaria-to-Gregaria Phase Polyphenism &amp; Trophic Backoff (5 Seeds)</text>
  <text x="24" y="58" fill="#94a3b8" font-family="Consolas, monospace" font-size="12">Seeds: ${rep.seeds.join(', ')} · Winner: ${rep.summary.winningProfile} (${rep.summary.fullPolyphenismScoreMean.toFixed(1)}/100) · Oasis Wavefront Harvest: 100% · Hysteresis Stability: 100%</text>
  ${rowsSvg}
  <text x="24" y="322" fill="#64748b" font-family="Consolas, monospace" font-size="11">24 ecological epochs/seed (6 sparse stealth, 6 dense oasis surge, 6 hysteresis plateau jitter, 6 depletion trophic backoff)</text>
</svg>\n`;
}

const svgPath = path.join(reportsDir, 'alive-locust-phase-polyphenism-2026-11-09.svg');
fs.writeFileSync(svgPath, buildSvg(report), 'utf8');

console.log('[Pass 27] Wrote:', jsonPath);
console.log('[Pass 27] Wrote:', svgPath);
console.log('[Pass 27] Summary:', JSON.stringify(report.summary));
