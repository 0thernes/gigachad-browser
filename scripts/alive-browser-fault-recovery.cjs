#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const FaultRecovery = require('../systems/alive-browser-fault-recovery.js');

function buildSvg(report) {
  const s = report.summary;
  const modes = report.protocol.controllers;
  const colors = {
    'unbuffered-naive-nav': '#f43f5e',
    'retry-without-backoff': '#f59e0b',
    'circuit-breaker-only': '#38bdf8',
    'full-fault-tolerant-navigator': '#34d399'
  };
  const width = 980, height = 390;
  const rows = [];
  rows.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  rows.push(`<rect width="100%" height="100%" fill="#05090f"/>`);
  rows.push(`<text x="20" y="28" fill="#67e8f9" font-family="Consolas, monospace" font-size="14" font-weight="bold">ALIVE Pass 8 — Browser Tools, Navigation, Developer Workflows &amp; Transport Fault Recovery (5 Seeds)</text>`);
  rows.push(`<text x="20" y="48" fill="#cbd5e1" font-family="Consolas, monospace" font-size="11">full vs circuit +${s.pairedDeltas.fullVsCircuitReliabilityGain.mean.toFixed(2)} (${s.fullBeatCircuitSeeds}/5) · full vs naive +${s.pairedDeltas.fullVsNaiveReliabilityGain.mean.toFixed(2)} (${s.fullBeatNaiveSeeds}/5) · 100% completion (${s.exact100CompletionSeeds}/5) · 0 dup DOM (${s.zeroDuplicateDomSeeds}/5)</text>`);

  const barMaxW = 350;
  modes.forEach((mode, idx) => {
    const entry = s.byController[mode];
    const y = 76 + idx * 66;
    const rel = entry.reliabilityScore.mean;
    const ci = entry.reliabilityScore.ci95;
    const cmp = entry.workflowCompletionPct.mean;
    const rec = entry.faultRecoveryPct.mean;
    const dup = entry.duplicateDomMutations.mean;
    const wst = entry.wastedRetryRequests.mean;
    const lat = entry.meanLatencyMs.mean;
    const w = Math.max(2, (rel / 100) * barMaxW);

    rows.push(`<text x="225" y="${y + 16}" fill="#e2e8f0" text-anchor="end" font-family="Consolas, monospace" font-size="11">${mode}</text>`);
    rows.push(`<rect x="235" y="${y}" width="${barMaxW}" height="24" fill="#0f1b26" stroke="#1e293b"/>`);
    rows.push(`<rect x="235" y="${y + 3}" width="${w.toFixed(1)}" height="18" fill="${colors[mode]}"/>`);
    rows.push(`<text x="${243 + barMaxW}" y="${y + 15}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="11">rel=${rel.toFixed(2)} [${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}] · cmp=${cmp.toFixed(1)}% · rec=${rec.toFixed(1)}% · dupDOM=${dup.toFixed(0)} · waste=${wst.toFixed(0)}</text>`);
    rows.push(`<text x="235" y="${y + 40}" fill="#94a3b8" font-family="Consolas, monospace" font-size="10">meanLatency=${lat.toFixed(1)}ms · unhandledTabCrashes=${entry.unhandledTabCrashes.mean.toFixed(0)} · rateLimitViolations=${entry.rateLimitViolations.mean.toFixed(0)}</text>`);
  });

  rows.push(`<text x="20" y="${height - 16}" fill="#64748b" font-family="Consolas, monospace" font-size="10">Seeds: ${report.protocol.seeds.join(', ')} · 16 workflow tasks/seed (14 injected faults: DNS, 503, 429 Retry-After, timeout, stale-tab, duplicate Warp DOM)</text>`);
  rows.push(`</svg>`);
  return rows.join('\n');
}

async function main() {
  const report = await FaultRecovery.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-browser-fault-recovery-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-browser-fault-recovery-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(svgPath, buildSvg(report));
  console.log('Pass 8 JSON & SVG written:', {
    jsonPath,
    svgPath,
    fullBeatCircuitSeeds: report.summary.fullBeatCircuitSeeds,
    fullBeatNaiveSeeds: report.summary.fullBeatNaiveSeeds,
    exact100CompletionSeeds: report.summary.exact100CompletionSeeds,
    zeroDuplicateDomSeeds: report.summary.zeroDuplicateDomSeeds
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
