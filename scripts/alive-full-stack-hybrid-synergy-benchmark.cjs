#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const synergy = require('../systems/alive-full-stack-hybrid-synergy-benchmark.js');

function renderSvg(report) {
  const profiles = report.profileSummaries || [];
  const colors = {
    'clearnet-single-agent-unshielded': '#f43f5e',
    'tor-swarm-without-neurosymbolic-or-shield': '#f59e0b',
    'neurosymbolic-active-inf-without-watchdog-wal': '#38bdf8',
    'full-stack-omega-hybrid-synergy-fabric': '#34d399'
  };
  let rowsSvg = '';
  profiles.forEach((p, idx) => {
    const y = 95 + idx * 54;
    const score = p.compositeSynergyScore.mean;
    const w = Math.round(Math.max(0, Math.min(100, score)) * 4.2);
    const fill = colors[p.profileId] || '#38bdf8';
    rowsSvg += `
      <text x="24" y="${y + 18}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="13">${p.profileId}</text>
      <rect x="345" y="${y}" width="420" height="26" rx="4" fill="#0f172a" stroke="#1e293b"/>
      <rect x="345" y="${y}" width="${w}" height="26" rx="4" fill="${fill}"/>
      <text x="777" y="${y + 18}" fill="#f8fafc" font-family="Consolas, monospace" font-size="12">score=${score.toFixed(2)} | E2E=${p.endToEndMissionSuccessPct.mean.toFixed(1)}% | neuro=${p.neurosymbolicCausalAccuracyPct.mean.toFixed(1)}% | sec=${p.securityByzantineImmunityPct.mean.toFixed(1)}%</text>
    `;
  });

  const s = report.summary;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1190" height="350" viewBox="0 0 1190 350">
    <rect width="1190" height="350" fill="#020617"/>
    <text x="24" y="36" fill="#38bdf8" font-family="Consolas, monospace" font-size="18" font-weight="bold">ALIVE Pass 39 — Full-Stack End-to-End Hybrid Synergy Benchmark (36 Faculties · 14 Brains · 5 Seeds)</text>
    <text x="24" y="62" fill="#94a3b8" font-family="Consolas, monospace" font-size="13">Winner: ${s.winningProfile} | Score: ${s.fullSynergyScoreMean.toFixed(2)} | E2E Mission Success: ${s.endToEndMissionSuccessPctMean.toFixed(1)}% | Latency: ${s.meanPipelineLatencyMs.toFixed(2)}ms | vs Single: +${s.gainVsClearnetSingle.toFixed(2)}</text>
    ${rowsSvg}
  </svg>`;
}

function main() {
  const report = synergy.runFullStackHybridSynergyBenchmark();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-full-stack-hybrid-synergy-benchmark-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-full-stack-hybrid-synergy-benchmark-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(svgPath, renderSvg(report), 'utf8');
  console.log(JSON.stringify(report.summary));
}

main();
