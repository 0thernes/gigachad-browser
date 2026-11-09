#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const SustainedPerf = require('../systems/alive-sustained-performance-qualifier.js');

function buildSvg(report) {
  const s = report.summary;
  const modes = report.protocol.regimes;
  const colors = {
    'unbounded-eager-all-lanes': '#f43f5e',
    'unbounded-history-no-eviction': '#f59e0b',
    'no-adapter-timeout-guard': '#38bdf8',
    'bounded-phase-ordered-60hz': '#34d399'
  };
  const width = 980, height = 390;
  const rows = [];
  rows.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  rows.push(`<rect width="100%" height="100%" fill="#05090f"/>`);
  rows.push(`<text x="20" y="28" fill="#67e8f9" font-family="Consolas, monospace" font-size="14" font-weight="bold">ALIVE Pass 9 — Sustained 60Hz Performance, Memory Bounds &amp; Package Qualification (5 Seeds)</text>`);
  rows.push(`<text x="20" y="48" fill="#cbd5e1" font-family="Consolas, monospace" font-size="11">bounded vs eager +${s.pairedDeltas.boundedVsEagerQualificationGain.mean.toFixed(2)} (${s.boundedBeatEagerSeeds}/5) · p99&lt;=16.67ms (${s.sub16msP99Seeds}/5) · 0 post-warmup mem growth (${s.zeroPostWarmupGrowthSeeds}/5) · 0 hidden draw overhead (${s.zeroHiddenOverheadSeeds}/5)</text>`);

  const barMaxW = 340;
  modes.forEach((mode, idx) => {
    const entry = s.byRegime[mode];
    const y = 76 + idx * 66;
    const q = entry.qualificationScore.mean;
    const ci = entry.qualificationScore.ci95;
    const p50 = entry.p50Ms.mean;
    const p95 = entry.p95Ms.mean;
    const p99 = entry.p99Ms.mean;
    const mem = entry.postWarmupMemoryGrowthEntries.mean;
    const hid = entry.hiddenPanelDrawCalls.mean;
    const w = Math.max(2, (q / 100) * barMaxW);

    rows.push(`<text x="230" y="${y + 16}" fill="#e2e8f0" text-anchor="end" font-family="Consolas, monospace" font-size="11">${mode}</text>`);
    rows.push(`<rect x="240" y="${y}" width="${barMaxW}" height="24" fill="#0f1b26" stroke="#1e293b"/>`);
    rows.push(`<rect x="240" y="${y + 3}" width="${w.toFixed(1)}" height="18" fill="${colors[mode]}"/>`);
    rows.push(`<text x="${248 + barMaxW}" y="${y + 15}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="11">qual=${q.toFixed(2)} [${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}] · p50=${p50.toFixed(2)}ms · p95=${p95.toFixed(2)}ms · p99=${p99.toFixed(2)}ms</text>`);
    rows.push(`<text x="240" y="${y + 40}" fill="#94a3b8" font-family="Consolas, monospace" font-size="10">60HzCompliance=${entry.budgetCompliancePct.mean.toFixed(1)}% · postWarmupMemGrowth=${mem.toFixed(0)} · hiddenDraws=${hid.toFixed(0)} · adapterRecovery=${entry.adapterRecoveryPct.mean.toFixed(1)}%</text>`);
  });

  rows.push(`<text x="20" y="${height - 16}" fill="#64748b" font-family="Consolas, monospace" font-size="10">Seeds: ${report.protocol.seeds.join(', ')} · 240 sustained ticks/seed (120 open panel, 120 hidden panel, 6 injected adapter timeout faults)</text>`);
  rows.push(`</svg>`);
  return rows.join('\n');
}

async function main() {
  const report = await SustainedPerf.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-sustained-performance-qualifier-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-sustained-performance-qualifier-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(svgPath, buildSvg(report));
  console.log('Pass 9 JSON & SVG written:', {
    jsonPath,
    svgPath,
    boundedBeatEagerSeeds: report.summary.boundedBeatEagerSeeds,
    sub16msP99Seeds: report.summary.sub16msP99Seeds,
    zeroPostWarmupGrowthSeeds: report.summary.zeroPostWarmupGrowthSeeds,
    zeroHiddenOverheadSeeds: report.summary.zeroHiddenOverheadSeeds
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
