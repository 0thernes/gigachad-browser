#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const poincare = require('../systems/alive-hyperbolic-poincare-knowledge-embedder.js');

function renderSvg(report) {
  const profiles = report.profileSummaries || [];
  const colors = {
    'flat-euclidean-low-dim-r2': '#f59e0b',
    'flat-euclidean-matched-dim-r8': '#38bdf8',
    'unprojected-hyperbolic-boundary-overflow': '#f43f5e',
    'poincare-riemannian-gyrovector-b8': '#34d399'
  };
  let rowsSvg = '';
  profiles.forEach((p, idx) => {
    const y = 95 + idx * 54;
    const score = p.compositePoincareScore.mean;
    const w = Math.round(Math.max(0, Math.min(100, score)) * 4.2);
    const fill = colors[p.profileId] || '#38bdf8';
    rowsSvg += `
      <text x="24" y="${y + 18}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="13">${p.profileId}</text>
      <rect x="330" y="${y}" width="420" height="26" rx="4" fill="#0f172a" stroke="#1e293b"/>
      <rect x="330" y="${y}" width="${w}" height="26" rx="4" fill="${fill}"/>
      <text x="762" y="${y + 18}" fill="#f8fafc" font-family="Consolas, monospace" font-size="12">score=${score.toFixed(2)} | dist=${p.meanTreeDistortion.mean.toFixed(3)} | MAP=${p.mapAtKScorePct.mean.toFixed(1)}% | safe=${p.manifoldBoundarySafetyPct.mean.toFixed(1)}%</text>
    `;
  });

  const s = report.summary;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1140" height="350" viewBox="0 0 1140 350">
    <rect width="1140" height="350" fill="#020617"/>
    <text x="24" y="36" fill="#38bdf8" font-family="Consolas, monospace" font-size="18" font-weight="bold">ALIVE Pass 32 — Hyperbolic Poincaré Ball (B^d_c) Hierarchical Knowledge Embedder (5 Seeds)</text>
    <text x="24" y="62" fill="#94a3b8" font-family="Consolas, monospace" font-size="13">Winner: ${s.winningProfile} | Score: ${s.poincareCompositeScoreMean.toFixed(2)} | Distortion: ${s.poincareTreeDistortionMean.toFixed(4)} | MAP@k: ${s.poincareMapAtKPctMean.toFixed(1)}% | vs R^2: +${s.gainVsFlatR2.toFixed(2)}</text>
    ${rowsSvg}
  </svg>`;
}

function main() {
  const report = poincare.runHyperbolicPoincareBenchmark();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-hyperbolic-poincare-knowledge-embedder-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-hyperbolic-poincare-knowledge-embedder-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(svgPath, renderSvg(report), 'utf8');
  console.log(JSON.stringify(report.summary));
}

main();
