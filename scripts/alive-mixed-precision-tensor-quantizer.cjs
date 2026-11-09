#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const quantizer = require('../systems/alive-mixed-precision-tensor-quantizer.js');

function renderSvg(report) {
  const profiles = report.profileSummaries || [];
  const colors = {
    'uniform-uncompensated-binary-1bit': '#f43f5e',
    'uniform-int4-no-error-feedback': '#f59e0b',
    'static-fp32-uncompressed': '#38bdf8',
    'hessian-nf4-error-feedback-ladder': '#34d399'
  };
  let rowsSvg = '';
  profiles.forEach((p, idx) => {
    const y = 95 + idx * 54;
    const score = p.compositeQuantizerScore.mean;
    const w = Math.round(Math.max(0, Math.min(100, score)) * 4.2);
    const fill = colors[p.profileId] || '#38bdf8';
    rowsSvg += `
      <text x="24" y="${y + 18}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="13">${p.profileId}</text>
      <rect x="330" y="${y}" width="420" height="26" rx="4" fill="#0f172a" stroke="#1e293b"/>
      <rect x="330" y="${y}" width="${w}" height="26" rx="4" fill="${fill}"/>
      <text x="762" y="${y + 18}" fill="#f8fafc" font-family="Consolas, monospace" font-size="12">score=${score.toFixed(2)} | cos=${p.meanCosineSim.mean.toFixed(4)} | comp=${p.meanCompressionRatio.mean.toFixed(2)}x | 7-tier=${p.sevenTierCoveragePct.mean.toFixed(0)}%</text>
    `;
  });

  const s = report.summary;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1140" height="350" viewBox="0 0 1140 350">
    <rect width="1140" height="350" fill="#020617"/>
    <text x="24" y="36" fill="#38bdf8" font-family="Consolas, monospace" font-size="18" font-weight="bold">ALIVE Pass 34 — Dynamic 7-Tier Mixed-Precision Quantization &amp; Error-Feedback (5 Seeds)</text>
    <text x="24" y="62" fill="#94a3b8" font-family="Consolas, monospace" font-size="13">Winner: ${s.winningProfile} | Score: ${s.fullQuantizerScoreMean.toFixed(2)} | Cosine: ${s.meanCosineSimilarity.toFixed(4)} | Compression: ${s.meanCompressionRatioVsFp32.toFixed(2)}x | vs 1-Bit: +${s.gainVsUniformBinary.toFixed(2)}</text>
    ${rowsSvg}
  </svg>`;
}

function main() {
  const report = quantizer.runMixedPrecisionQuantizerBenchmark();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-mixed-precision-tensor-quantizer-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-mixed-precision-tensor-quantizer-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(svgPath, renderSvg(report), 'utf8');
  console.log(JSON.stringify(report.summary));
}

main();
