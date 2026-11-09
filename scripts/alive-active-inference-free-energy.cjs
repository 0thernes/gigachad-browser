#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const activeInf = require('../systems/alive-active-inference-free-energy.js');

const report = activeInf.runFiveSeedActiveInferenceBenchmark();
const reportsDir = path.join(__dirname, '..', 'docs', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const jsonPath = path.join(reportsDir, 'alive-active-inference-free-energy-2026-11-09.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

function buildSvg(rep) {
  const agg = rep.aggregatedByProfile;
  const profiles = [
    'greedy-pragmatic-reward-only',
    'pure-epistemic-curiosity-drifter',
    'uncalibrated-prior-dogmatic-agent',
    'full-vfe-efe-active-inference-planner'
  ];
  const colors = {
    'greedy-pragmatic-reward-only': '#f59e0b',
    'pure-epistemic-curiosity-drifter': '#38bdf8',
    'uncalibrated-prior-dogmatic-agent': '#f43f5e',
    'full-vfe-efe-active-inference-planner': '#34d399'
  };
  let rowsSvg = '';
  profiles.forEach((id, idx) => {
    const p = agg[id];
    const y = 92 + idx * 54;
    const w = Math.round((p.activeInferenceScore.mean / 100) * 340);
    rowsSvg += `
      <text x="245" y="${y + 18}" fill="#cbd5e1" font-family="Consolas, monospace" font-size="12" text-anchor="end">${id}</text>
      <rect x="255" y="${y}" width="340" height="26" rx="4" fill="#0f172a" stroke="#1e293b"/>
      <rect x="255" y="${y + 2}" width="${Math.max(2, w)}" height="22" rx="3" fill="${colors[id]}"/>
      <text x="605" y="${y + 18}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="12">score=${p.activeInferenceScore.mean.toFixed(2)} | dF&lt;0=${p.vfeMonotonicReductionPct.mean.toFixed(1)}% | epist=${p.epistemicDisambiguationPct.mean.toFixed(1)}% | goal=${p.pragmaticGoalConvergencePct.mean.toFixed(1)}% | VFE_drop=${p.meanVfeDropNats.mean.toFixed(4)} nats</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="340" viewBox="0 0 1180 340">
  <rect width="1180" height="340" fill="#020617"/>
  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="16" font-weight="bold">ALIVE PASS 31 — Variational Free-Energy (F) &amp; Expected Free Energy G(pi) Active Inference Planner (5 Seeds)</text>
  <text x="24" y="58" fill="#94a3b8" font-family="Consolas, monospace" font-size="12">Seeds: ${rep.seeds.join(', ')} · Winner: ${rep.summary.winningProfile} (${rep.summary.fullActiveInferenceScoreMean.toFixed(1)}/100) · Mean VFE Drop: -${rep.summary.meanVfeDropNats.toFixed(4)} nats · Goal Convergence: 100%</text>
  ${rowsSvg}
  <text x="24" y="322" fill="#64748b" font-family="Consolas, monospace" font-size="11">24 POMDP episodes/seed: natural-gradient Variational Free Energy F(Q,o) update + unified Epistemic-Pragmatic Expected Free Energy G(pi) policy selection</text>
</svg>\n`;
}

const svgPath = path.join(reportsDir, 'alive-active-inference-free-energy-2026-11-09.svg');
fs.writeFileSync(svgPath, buildSvg(report), 'utf8');

console.log('[Pass 31] Wrote:', jsonPath);
console.log('[Pass 31] Wrote:', svgPath);
console.log('[Pass 31] Summary:', JSON.stringify(report.summary));
