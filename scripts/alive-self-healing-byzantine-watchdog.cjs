#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const watchdog = require('../systems/alive-self-healing-byzantine-watchdog.js');

function renderSvg(report) {
  const profiles = report.profileSummaries || [];
  const colors = {
    'unprotected-in-place-mutation': '#f43f5e',
    'nan-clamp-only-no-quarantine-no-rollback': '#f59e0b',
    'coarse-periodic-reboot-data-loss': '#38bdf8',
    'cow-shadow-ring-byzantine-quarantine-watchdog': '#34d399'
  };
  let rowsSvg = '';
  profiles.forEach((p, idx) => {
    const y = 95 + idx * 54;
    const score = p.compositeWatchdogScore.mean;
    const w = Math.round(Math.max(0, Math.min(100, score)) * 4.2);
    const fill = colors[p.profileId] || '#38bdf8';
    rowsSvg += `
      <text x="24" y="${y + 18}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="13">${p.profileId}</text>
      <rect x="340" y="${y}" width="420" height="26" rx="4" fill="#0f172a" stroke="#1e293b"/>
      <rect x="340" y="${y}" width="${w}" height="26" rx="4" fill="${fill}"/>
      <text x="772" y="${y + 18}" fill="#f8fafc" font-family="Consolas, monospace" font-size="12">score=${score.toFixed(2)} | int=${p.stateIntegrityPct.mean.toFixed(1)}% | zeroLoss=${p.zeroDataLossPct.mean.toFixed(1)}% | qrn=${p.byzantineQuarantinePct.mean.toFixed(1)}%</text>
    `;
  });

  const s = report.summary;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="350" viewBox="0 0 1180 350">
    <rect width="1180" height="350" fill="#020617"/>
    <text x="24" y="36" fill="#38bdf8" font-family="Consolas, monospace" font-size="18" font-weight="bold">ALIVE Pass 38 — Self-Healing Byzantine Watchdog, CoW Rollback &amp; Zero-Loss Recovery (5 Seeds)</text>
    <text x="24" y="62" fill="#94a3b8" font-family="Consolas, monospace" font-size="13">Winner: ${s.winningProfile} | Score: ${s.fullWatchdogScoreMean.toFixed(2)} | Zero-Data-Loss: ${s.zeroDataLossPctMean.toFixed(1)}% | Latency: ${s.meanRecoveryLatencyMs.toFixed(2)}ms | vs Raw: +${s.gainVsUnprotected.toFixed(2)}</text>
    ${rowsSvg}
  </svg>`;
}

function main() {
  const report = watchdog.runSelfHealingWatchdogBenchmark();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-self-healing-byzantine-watchdog-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-self-healing-byzantine-watchdog-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(svgPath, renderSvg(report), 'utf8');
  console.log(JSON.stringify(report.summary));
}

main();
