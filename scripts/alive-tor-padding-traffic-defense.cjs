#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const wfPad = require('../systems/alive-tor-padding-traffic-defense.js');

const report = wfPad.runFiveSeedTorPaddingDefenseBenchmark();
const reportsDir = path.join(__dirname, '..', 'docs', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const jsonPath = path.join(reportsDir, 'alive-tor-padding-traffic-defense-2026-11-09.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

function buildSvg(rep) {
  const agg = rep.aggregatedByProfile;
  const profiles = [
    'unpadded-tor-cells',
    'naive-random-chaff-10pct',
    'constant-rate-tamaraw-heavy',
    'adaptive-wtfpad-regulator-hybrid'
  ];
  const colors = {
    'unpadded-tor-cells': '#f43f5e',
    'naive-random-chaff-10pct': '#f59e0b',
    'constant-rate-tamaraw-heavy': '#38bdf8',
    'adaptive-wtfpad-regulator-hybrid': '#34d399'
  };
  let rowsSvg = '';
  profiles.forEach((id, idx) => {
    const p = agg[id];
    const y = 92 + idx * 54;
    const w = Math.round((p.wfDefenseCompositeScore.mean / 100) * 340);
    rowsSvg += `
      <text x="235" y="${y + 18}" fill="#cbd5e1" font-family="Consolas, monospace" font-size="12" text-anchor="end">${id}</text>
      <rect x="245" y="${y}" width="340" height="26" rx="4" fill="#0f172a" stroke="#1e293b"/>
      <rect x="245" y="${y + 2}" width="${Math.max(2, w)}" height="22" rx="3" fill="${colors[id]}"/>
      <text x="595" y="${y + 18}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="12">score=${p.wfDefenseCompositeScore.mean.toFixed(2)} | evade=${p.wfEvasionScorePct.mean.toFixed(1)}% | wfAcc=${p.wfClassifierAccuracyPct.mean.toFixed(1)}% | bw=+${p.bandwidthOverheadPct.mean.toFixed(1)}% | lat=+${p.addedLatencyMs.mean.toFixed(1)}ms | KL=${p.iatKlDivergenceBits.mean.toFixed(4)}b</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="340" viewBox="0 0 1120 340">
  <rect width="1120" height="340" fill="#020617"/>
  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="16" font-weight="bold">ALIVE PASS 23 — Tor Website Fingerprinting (WF) Defense &amp; Circuit Padding Machines (5 Seeds)</text>
  <text x="24" y="58" fill="#94a3b8" font-family="Consolas, monospace" font-size="12">Seeds: ${rep.seeds.join(', ')} · Winner: ${rep.summary.winningProfile} (${rep.summary.adaptiveCompositeScoreMean.toFixed(1)}/100) · WF Acc: ${rep.summary.adaptiveClassifierAccuracyPctMean.toFixed(1)}% (Chance=12.5%) · BW Overhead: +${rep.summary.adaptiveBandwidthOverheadPctMean.toFixed(2)}%</text>
  ${rowsSvg}
  <text x="24" y="322" fill="#64748b" font-family="Consolas, monospace" font-size="11">24 traces/seed across 8 monitored .onion &amp; clearnet page archetypes (Adaptive WTF-PAD IAT histogram + RegulaTor quantized burst shaping)</text>
</svg>\n`;
}

const svgPath = path.join(reportsDir, 'alive-tor-padding-traffic-defense-2026-11-09.svg');
fs.writeFileSync(svgPath, buildSvg(report), 'utf8');

console.log('[Pass 23] Wrote:', jsonPath);
console.log('[Pass 23] Wrote:', svgPath);
console.log('[Pass 23] Summary:', JSON.stringify(report.summary));
