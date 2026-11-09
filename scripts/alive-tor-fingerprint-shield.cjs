#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const TorShield = require('../systems/alive-tor-fingerprint-shield.js');

function buildSvg(report) {
  const s = report.summary;
  const modes = report.protocol.shields;
  const colors = {
    'unprotected-native-chromium': '#f43f5e',
    'ua-header-spoof-only': '#f59e0b',
    'static-global-noise-injection': '#38bdf8',
    'full-tor-letterbox-fpd-shield': '#34d399'
  };
  const width = 980, height = 390;
  const rows = [];
  rows.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  rows.push(`<rect width="100%" height="100%" fill="#05090f"/>`);
  rows.push(`<text x="20" y="28" fill="#67e8f9" font-family="Consolas, monospace" font-size="14" font-weight="bold">ALIVE Pass 14 — Tor Anti-Fingerprinting &amp; Anonymity Hardening Matrix (5 Seeds)</text>`);
  rows.push(`<text x="20" y="48" fill="#cbd5e1" font-family="Consolas, monospace" font-size="11">full vs global-noise +${s.pairedDeltas.fullVsGlobalNoiseAnonymityGain.mean.toFixed(2)} (${s.fullBeatGlobalNoiseSeeds}/5) · vs native +${s.pairedDeltas.fullVsNativeAnonymityGain.mean.toFixed(2)} (${s.fullBeatNativeSeeds}/5) · 0% cross-origin link (${s.zeroCrossOriginLinkSeeds}/5) · 0.0-bit static entropy (${s.zeroStaticEntropySeeds}/5)</text>`);

  const barMaxW = 340;
  modes.forEach((mode, idx) => {
    const entry = s.byShield[mode];
    const y = 76 + idx * 66;
    const ano = entry.anonymityScore.mean;
    const ci = entry.anonymityScore.ci95;
    const unl = entry.crossOriginUnlinkabilityPct.mean;
    const uni = entry.anonymitySetUniformityPct.mean;
    const ent = entry.staticSurfaceEntropyBits.mean;
    const dst = entry.distinctStaticSurfaces.mean;
    const w = Math.max(2, (ano / 100) * barMaxW);

    rows.push(`<text x="235" y="${y + 16}" fill="#e2e8f0" text-anchor="end" font-family="Consolas, monospace" font-size="11">${mode}</text>`);
    rows.push(`<rect x="245" y="${y}" width="${barMaxW}" height="24" fill="#0f1b26" stroke="#1e293b"/>`);
    rows.push(`<rect x="245" y="${y + 3}" width="${w.toFixed(1)}" height="18" fill="${colors[mode]}"/>`);
    rows.push(`<text x="${253 + barMaxW}" y="${y + 15}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="11">anon=${ano.toFixed(2)} [${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}] · unlink=${unl.toFixed(1)}% · unif=${uni.toFixed(1)}% · entropy=${ent.toFixed(2)}b</text>`);
    rows.push(`<text x="245" y="${y + 40}" fill="#94a3b8" font-family="Consolas, monospace" font-size="10">distinctStaticSurfaces=${dst.toFixed(0)}/6 · crossOriginLinkability=${entry.crossOriginLinkabilityPct.mean.toFixed(1)}%</text>`);
  });

  rows.push(`<text x="20" y="${height - 16}" fill="#64748b" font-family="Consolas, monospace" font-size="10">Seeds: ${report.protocol.seeds.join(', ')} · 24 probes/seed (6 hardware machines × 4 First-Party Domains) · 1000×800@1x letterboxing · 100ms timer · FPD-keyed Canvas</text>`);
  rows.push(`</svg>`);
  return rows.join('\n');
}

async function main() {
  const report = await TorShield.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-tor-fingerprint-shield-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-tor-fingerprint-shield-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(svgPath, buildSvg(report));
  console.log('Pass 14 JSON & SVG written:', {
    jsonPath,
    svgPath,
    fullBeatGlobalNoiseSeeds: report.summary.fullBeatGlobalNoiseSeeds,
    fullBeatNativeSeeds: report.summary.fullBeatNativeSeeds,
    zeroCrossOriginLinkSeeds: report.summary.zeroCrossOriginLinkSeeds,
    zeroStaticEntropySeeds: report.summary.zeroStaticEntropySeeds
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
