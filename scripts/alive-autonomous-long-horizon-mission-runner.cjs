#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const mission = require('../systems/alive-autonomous-long-horizon-mission-runner.js');

function renderSvg(report) {
  const profiles = report.profileSummaries || [];
  const colors = {
    'stateless-linear-chain-no-checkpoint': '#f43f5e',
    'naive-retry-loop-no-deadlock-detector': '#f59e0b',
    'checkpoint-dag-no-idempotent-wal': '#38bdf8',
    'htn-dag-tarjan-idempotent-wal-runner': '#34d399'
  };
  let rowsSvg = '';
  profiles.forEach((p, idx) => {
    const y = 95 + idx * 54;
    const score = p.compositeMissionScore.mean;
    const w = Math.round(Math.max(0, Math.min(100, score)) * 4.2);
    const fill = colors[p.profileId] || '#38bdf8';
    rowsSvg += `
      <text x="24" y="${y + 18}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="13">${p.profileId}</text>
      <rect x="330" y="${y}" width="420" height="26" rx="4" fill="#0f172a" stroke="#1e293b"/>
      <rect x="330" y="${y}" width="${w}" height="26" rx="4" fill="${fill}"/>
      <text x="762" y="${y + 18}" fill="#f8fafc" font-family="Consolas, monospace" font-size="12">score=${score.toFixed(2)} | done=${p.missionCompletionPct.mean.toFixed(1)}% | dlkRec=${p.deadlockRecoveryPct.mean.toFixed(1)}% | noDup=${p.zeroDuplicateSideEffectPct.mean.toFixed(1)}%</text>
    `;
  });

  const s = report.summary;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="350" viewBox="0 0 1180 350">
    <rect width="1180" height="350" fill="#020617"/>
    <text x="24" y="36" fill="#38bdf8" font-family="Consolas, monospace" font-size="18" font-weight="bold">ALIVE Pass 37 — Long-Horizon Checkpointable Autonomous Research Mission Runner (5 Seeds)</text>
    <text x="24" y="62" fill="#94a3b8" font-family="Consolas, monospace" font-size="13">Winner: ${s.winningProfile} | Score: ${s.fullMissionScoreMean.toFixed(2)} | Completion: ${s.missionCompletionPctMean.toFixed(1)}% | Deadlock Recovery: ${s.deadlockRecoveryPctMean.toFixed(1)}% | vs Stateless: +${s.gainVsStatelessLinear.toFixed(2)}</text>
    ${rowsSvg}
  </svg>`;
}

function main() {
  const report = mission.runLongHorizonMissionBenchmark();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-autonomous-long-horizon-mission-runner-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-autonomous-long-horizon-mission-runner-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(svgPath, renderSvg(report), 'utf8');
  console.log(JSON.stringify(report.summary));
}

main();
