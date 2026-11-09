#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ProvenanceEval = require('../systems/alive-research-provenance-evaluator.js');

function buildSvg(report) {
  const s = report.summary;
  const modes = report.protocol.pipelines;
  const colors = {
    'ungrounded-freeform': '#f43f5e',
    'naive-concatenator': '#f59e0b',
    'citation-only-filter': '#38bdf8',
    'provenance-contradiction-writer': '#34d399'
  };
  const width = 980, height = 390;
  const rows = [];
  rows.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  rows.push(`<rect width="100%" height="100%" fill="#05090f"/>`);
  rows.push(`<text x="20" y="28" fill="#67e8f9" font-family="Consolas, monospace" font-size="14" font-weight="bold">ALIVE Pass 7 — Research Provenance, Contradiction Tracking &amp; Source-Grounded Writing (5 Seeds)</text>`);
  rows.push(`<text x="20" y="48" fill="#cbd5e1" font-family="Consolas, monospace" font-size="11">prov vs citation +${s.pairedDeltas.provVsCitationScoreGain.mean.toFixed(2)} (${s.provBeatCitationSeeds}/5) · prov vs naive +${s.pairedDeltas.provVsNaiveScoreGain.mean.toFixed(2)} (${s.provBeatNaiveSeeds}/5) · 100% contradiction recall (${s.exactContradictionRecallSeeds}/5) · 0% hallucination (${s.zeroHallucinationSeeds}/5)</text>`);

  const barMaxW = 360;
  modes.forEach((mode, idx) => {
    const entry = s.byPipeline[mode];
    const y = 76 + idx * 66;
    const comp = entry.compositeScore.mean;
    const ci = entry.compositeScore.ci95;
    const clmP = entry.claimPrecisionPct.mean;
    const conR = entry.contradictionRecallPct.mean;
    const halR = entry.hallucinationRatePct.mean;
    const srcQ = entry.meanSourceQuality.mean;
    const w = Math.max(2, (comp / 100) * barMaxW);

    rows.push(`<text x="220" y="${y + 16}" fill="#e2e8f0" text-anchor="end" font-family="Consolas, monospace" font-size="11">${mode}</text>`);
    rows.push(`<rect x="230" y="${y}" width="${barMaxW}" height="24" fill="#0f1b26" stroke="#1e293b"/>`);
    rows.push(`<rect x="230" y="${y + 3}" width="${w.toFixed(1)}" height="18" fill="${colors[mode]}"/>`);
    rows.push(`<text x="${238 + barMaxW}" y="${y + 15}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="11">score=${comp.toFixed(2)} [${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}] · clmP=${clmP.toFixed(1)}% · conR=${conR.toFixed(1)}% · hal=${halR.toFixed(1)}% · srcQ=${srcQ.toFixed(3)}</text>`);
    rows.push(`<text x="230" y="${y + 40}" fill="#94a3b8" font-family="Consolas, monospace" font-size="10">primaryRecall=${entry.primaryRecallPct.mean.toFixed(1)}% · compositeScoreSD=${entry.compositeScore.sampleStandardDeviation.toFixed(3)}</text>`);
  });

  rows.push(`<text x="20" y="${height - 16}" fill="#64748b" font-family="Consolas, monospace" font-size="10">Seeds: ${report.protocol.seeds.join(', ')} · 9 documents/seed (3 primary, 3 conflicting, 2 hallucination probes, 1 corroborative) with SHA-256 excerpt receipts</text>`);
  rows.push(`</svg>`);
  return rows.join('\n');
}

async function main() {
  const report = await ProvenanceEval.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-research-provenance-evaluator-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-research-provenance-evaluator-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(svgPath, buildSvg(report));
  console.log('Pass 7 JSON & SVG written:', {
    jsonPath,
    svgPath,
    provBeatCitationSeeds: report.summary.provBeatCitationSeeds,
    provBeatNaiveSeeds: report.summary.provBeatNaiveSeeds,
    exactContradictionRecallSeeds: report.summary.exactContradictionRecallSeeds,
    zeroHallucinationSeeds: report.summary.zeroHallucinationSeeds
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
