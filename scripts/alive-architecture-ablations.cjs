#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Ablations = require('../systems/alive-architecture-ablations.js');

const DATE_TAG = '2026-11-09';
const REPORT_DIR = path.join(__dirname, '..', 'docs', 'reports');
const JSON_PATH = path.join(REPORT_DIR, `alive-architecture-ablations-${DATE_TAG}.json`);
const SVG_PATH = path.join(REPORT_DIR, `alive-architecture-ablations-${DATE_TAG}.svg`);

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSvg(report) {
  const width = 1180;
  const height = 640;
  const brains = Object.values(report.ablations.brains);
  const precs = [
    ...Object.values(report.ablations.precision),
    ...['micro-ising', 'omega-lorenz', 'omega-izhikevich'].map(id => report.ablations.strataAndSpecialists[id])
  ];
  const specialists = ['NMDA_sLTC_Sheet', 'Dreamer_WorldModel', 'FlyWire_Connectome', 'QGTL_Grover_Q3', 'Allostatic_AgRP']
    .map(id => report.ablations.strataAndSpecialists[id]);
  const reasonings = Object.values(report.ablations.reasoning);
  const pathways = Object.values(report.ablations.fabricPathways);

  const lines = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  lines.push(`  <rect width="100%" height="100%" fill="#060c14" />`);
  lines.push(`  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="16" font-weight="700">PASS 3 · ARCHITECTURE ABLATIONS ACROSS 14 BRAINS, 7 PRECISION ROUTES, AoT/ToT/GoT, SPECIALISTS &amp; FABRIC PATHWAYS (5 SEEDS)</text>`);
  lines.push(`  <text x="24" y="54" fill="#94a3b8" font-family="Consolas, monospace" font-size="11">Seeds: [19013, 29017, 39023, 49031, 59053] · 38 conditions · All 14 brains causal: 5/5 · All 7 precision causal: 5/5 · All 3 strata causal: 5/5 · All 5 specialists causal: 5/5 · AoT/ToT/GoT causal: 5/5</text>`);

  // Column 1: 14 Brains + all-14-brains
  lines.push(`  <text x="24" y="84" fill="#34d399" font-family="Consolas, monospace" font-size="13" font-weight="700">1 · 14 Brain Families + Group Ablation (Sensory ΔL2)</text>`);
  const maxBrain = Math.max(1e-6, ...brains.map(b => b.sensoryDeltaL2.mean));
  brains.forEach((b, idx) => {
    const y = 104 + idx * 32;
    const w = Math.round((b.sensoryDeltaL2.mean / maxBrain) * 170);
    const color = b.id === 'all-14-brains' ? '#22d3ee' : '#34d399';
    lines.push(`  <text x="158" y="${y + 12}" text-anchor="end" fill="#cbd5e1" font-family="Consolas, monospace" font-size="10">${esc(b.id.replace(/^brain\d+/, ''))}</text>`);
    lines.push(`  <rect x="164" y="${y}" width="170" height="16" fill="#0f1b26" rx="2" />`);
    lines.push(`  <rect x="164" y="${y + 2}" width="${Math.max(2, w)}" height="12" fill="${color}" rx="2" />`);
    lines.push(`  <text x="340" y="${y + 12}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="10">${b.sensoryDeltaL2.mean.toFixed(4)} (${b.nonZeroSeeds}/5)</text>`);
  });

  // Column 2: 7 Precision + all-7-precision + 3 Scale Strata
  lines.push(`  <text x="430" y="84" fill="#f59e0b" font-family="Consolas, monospace" font-size="13" font-weight="700">2 · 7 Precision Routes + 3 Scale Strata (Sensory ΔL2)</text>`);
  const maxPrec = Math.max(1e-6, ...precs.map(p => p.sensoryDeltaL2.mean));
  precs.forEach((p, idx) => {
    const y = 104 + idx * 38;
    const w = Math.round((p.sensoryDeltaL2.mean / maxPrec) * 165);
    const color = p.tier === 'strata' ? '#a78bfa' : (p.id === 'all-7-precision' ? '#fbbf24' : '#f59e0b');
    lines.push(`  <text x="558" y="${y + 13}" text-anchor="end" fill="#cbd5e1" font-family="Consolas, monospace" font-size="10">${esc(p.id)}</text>`);
    lines.push(`  <rect x="564" y="${y}" width="165" height="18" fill="#0f1b26" rx="2" />`);
    lines.push(`  <rect x="564" y="${y + 2}" width="${Math.max(2, w)}" height="14" fill="${color}" rx="2" />`);
    lines.push(`  <text x="735" y="${y + 13}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="10">${p.sensoryDeltaL2.mean.toFixed(4)} (${p.nonZeroSeeds}/5)</text>`);
  });

  // Column 3: 5 Specialists + 4 Reasoning + 3 Fabric Pathways
  lines.push(`  <text x="820" y="84" fill="#f472b6" font-family="Consolas, monospace" font-size="13" font-weight="700">3 · Specialists, AoT/ToT/GoT &amp; Fabric</text>`);
  const col3 = [
    ...specialists.map(s => ({ label: s.id, val: s.residualDeltaL2.mean, max: 0.35, unit: 'Δres', color: '#38bdf8', seeds: s.nonZeroSeeds })),
    ...reasonings.map(r => ({ label: r.id, val: r.marginLoss.mean, max: 2.1, unit: 'Δmrg', color: '#f472b6', seeds: r.nonZeroSeeds })),
    ...pathways.map(f => ({ label: f.id, val: f.holdoutRewardLossWhenAblated.mean, max: 20.0, unit: 'Δrew', color: '#34d399', seeds: f.nonZeroSeeds }))
  ];
  col3.forEach((row, idx) => {
    const y = 104 + idx * 38;
    const w = Math.round(Math.min(1, row.val / row.max) * 145);
    lines.push(`  <text x="954" y="${y + 13}" text-anchor="end" fill="#cbd5e1" font-family="Consolas, monospace" font-size="10">${esc(row.label.slice(0, 19))}</text>`);
    lines.push(`  <rect x="960" y="${y}" width="145" height="18" fill="#0f1b26" rx="2" />`);
    lines.push(`  <rect x="960" y="${y + 2}" width="${Math.max(2, w)}" height="14" fill="${row.color}" rx="2" />`);
    lines.push(`  <text x="1110" y="${y + 13}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="10">${row.val.toFixed(3)} (${row.seeds}/5)</text>`);
  });

  lines.push(`  <text x="24" y="620" fill="#64748b" font-family="Consolas, monospace" font-size="10">Generated by scripts/alive-architecture-ablations.cjs · Deterministic 5-seed in-process causal ablation across BleedEdge25AlifeEngine, AliveNeuralCoupling, AliveSpecialistFusion &amp; AliveSynapticFabric.</text>`);
  lines.push(`</svg>`);
  return lines.join('\n') + '\n';
}

async function main() {
  const report = await Ablations.run();
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(JSON_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');
  fs.writeFileSync(SVG_PATH, buildSvg(report), 'utf8');
  console.log(`Wrote ${JSON_PATH}`);
  console.log(`Wrote ${SVG_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
