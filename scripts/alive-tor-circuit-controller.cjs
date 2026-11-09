#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const TorCircuitController = require('../systems/alive-tor-circuit-controller.js');

function buildSvg(report) {
  const s = report.summary;
  const modes = report.protocol.controllers;
  const colors = {
    'unmonitored-blind-socks': '#f43f5e',
    'passive-controlport-observer': '#f59e0b',
    'newnym-without-path-diversity': '#38bdf8',
    'full-controlport-circuit-governor': '#34d399'
  };
  const width = 980, height = 390;
  const rows = [];
  rows.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  rows.push(`<rect width="100%" height="100%" fill="#05090f"/>`);
  rows.push(`<text x="20" y="28" fill="#67e8f9" font-family="Consolas, monospace" font-size="14" font-weight="bold">ALIVE Pass 12 — Tor ControlPort Protocol, Stream Attribution, NEWNYM &amp; Path Diversity (5 Seeds)</text>`);
  rows.push(`<text x="20" y="48" fill="#cbd5e1" font-family="Consolas, monospace" font-size="11">full vs newnym-only +${s.pairedDeltas.fullVsNewnymOnlyObservabilityGain.mean.toFixed(2)} (${s.fullBeatNewnymOnlySeeds}/5) · vs passive +${s.pairedDeltas.fullVsPassiveObservabilityGain.mean.toFixed(2)} (${s.fullBeatPassiveSeeds}/5) · 100% attribution (${s.exact100AttributionSeeds}/5) · 0 sybil paths (${s.zeroSybilPathSeeds}/5)</text>`);

  const barMaxW = 340;
  modes.forEach((mode, idx) => {
    const entry = s.byController[mode];
    const y = 76 + idx * 66;
    const obs = entry.observabilityScore.mean;
    const ci = entry.observabilityScore.ci95;
    const att = entry.streamAttributionPct.mean;
    const syb = entry.sybilRejectionPct.mean;
    const cln = entry.newnymCleanlinessPct.mean;
    const drt = entry.dirtyCircuitReusesAfterNewnym.mean;
    const w = Math.max(2, (obs / 100) * barMaxW);

    rows.push(`<text x="235" y="${y + 16}" fill="#e2e8f0" text-anchor="end" font-family="Consolas, monospace" font-size="11">${mode}</text>`);
    rows.push(`<rect x="245" y="${y}" width="${barMaxW}" height="24" fill="#0f1b26" stroke="#1e293b"/>`);
    rows.push(`<rect x="245" y="${y + 3}" width="${w.toFixed(1)}" height="18" fill="${colors[mode]}"/>`);
    rows.push(`<text x="${253 + barMaxW}" y="${y + 15}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="11">score=${obs.toFixed(2)} [${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}] · attr=${att.toFixed(1)}% · sybRej=${syb.toFixed(1)}% · newnymClean=${cln.toFixed(1)}%</text>`);
    rows.push(`<text x="245" y="${y + 40}" fill="#94a3b8" font-family="Consolas, monospace" font-size="10">sybilPathsUsed=${entry.sybilPathsUsed.mean.toFixed(0)} · dirtyCircuitReusesAfterNewnym=${drt.toFixed(0)}</text>`);
  });

  rows.push(`<text x="20" y="${height - 16}" fill="#64748b" font-family="Consolas, monospace" font-size="10">Seeds: ${report.protocol.seeds.join(', ')} · 18 streams/seed · 650 CIRC/STREAM framing · /16 &amp; ASN 3-hop Guard/Middle/Exit verification · SIGNAL NEWNYM</text>`);
  rows.push(`</svg>`);
  return rows.join('\n');
}

async function main() {
  const report = await TorCircuitController.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-tor-circuit-controller-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-tor-circuit-controller-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(svgPath, buildSvg(report));
  console.log('Pass 12 JSON & SVG written:', {
    jsonPath,
    svgPath,
    fullBeatNewnymOnlySeeds: report.summary.fullBeatNewnymOnlySeeds,
    fullBeatPassiveSeeds: report.summary.fullBeatPassiveSeeds,
    exact100AttributionSeeds: report.summary.exact100AttributionSeeds,
    zeroSybilPathSeeds: report.summary.zeroSybilPathSeeds,
    zeroDirtyReuseSeeds: report.summary.zeroDirtyReuseSeeds
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
