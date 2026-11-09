#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ContinualTransfer = require('../systems/alive-continual-morphology-transfer.js');

const DATE_TAG = '2026-11-09';
const REPORT_DIR = path.join(__dirname, '..', 'docs', 'reports');
const JSON_PATH = path.join(REPORT_DIR, `alive-continual-morphology-transfer-${DATE_TAG}.json`);
const SVG_PATH = path.join(REPORT_DIR, `alive-continual-morphology-transfer-${DATE_TAG}.svg`);

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSvg(report) {
  const width = 1180;
  const height = 580;
  const s = report.summary;
  const modes = ContinualTransfer.CONTROLLERS;
  const colors = {
    'frozen-baseline': '#64748b',
    'naive-continual': '#f59e0b',
    'metamorph-transfer-only': '#38bdf8',
    'full-continual-living': '#34d399'
  };

  const lines = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  lines.push(`  <rect width="100%" height="100%" fill="#060c14" />`);
  lines.push(`  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="16" font-weight="700">PASS 5 · LONG-DURATION CONTINUAL LEARNING, DISTINCT-TASK RETENTION &amp; MORPHOLOGY TRANSFER (5 SEEDS)</text>`);
  lines.push(`  <text x="24" y="54" fill="#94a3b8" font-family="Consolas, monospace" font-size="11">Seeds: [19013, 29017, 39023, 49031, 59053] · 4 Sequential Task×Morph Phases (1,200 steps/seed) + Unseen Morph E · Retention Gain: +${s.pairedDeltas.fullVsNaiveRetentionGainPct.mean.toFixed(2)}% (${s.fullBeatNaiveRetentionSeeds}/5) · Forgetting Reduced: ${s.fullReducedForgettingSeeds}/5 · Morph Transfer: ${s.metamorphBeatNaiveTransferSeeds}/5</text>`);

  // Panel 1: 4-Controller Summary Bars (Final All-Task Return, Prior-Task Retention %, Forgetting, Unseen Morph E)
  lines.push(`  <text x="24" y="86" fill="#34d399" font-family="Consolas, monospace" font-size="13" font-weight="700">1 · 5-Seed Controller Comparison (Mean ± 95% Student-t CI, df=4)</text>`);
  lines.push(`  <rect x="24" y="98" width="550" height="236" fill="#0b1520" stroke="#1e293b" rx="4" />`);

  modes.forEach((mode, idx) => {
    const entry = s.byController[mode];
    const y = 118 + idx * 54;
    const allRet = entry.finalAllTasksMeanReturn;
    const retPct = entry.priorTaskRetentionPct;
    const forg = entry.catastrophicForgetting;
    const unseen = entry.unseenMorphHoldoutReturn;
    const barW = Math.round((allRet.mean / 0.85) * 180);

    lines.push(`  <text x="190" y="${y + 12}" text-anchor="end" fill="${colors[mode]}" font-family="Consolas, monospace" font-size="11" font-weight="700">${esc(mode)}</text>`);
    lines.push(`  <text x="190" y="${y + 28}" text-anchor="end" fill="#94a3b8" font-family="Consolas, monospace" font-size="9">ret=${retPct.mean.toFixed(1)}% · frg=${forg.mean.toFixed(3)}</text>`);
    lines.push(`  <rect x="200" y="${y + 2}" width="180" height="18" fill="#0f1b26" rx="2" />`);
    lines.push(`  <rect x="200" y="${y + 4}" width="${Math.max(4, barW)}" height="14" fill="${colors[mode]}" rx="2" />`);
    lines.push(`  <text x="388" y="${y + 14}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="10">all=${allRet.mean.toFixed(3)} [${allRet.ci95[0].toFixed(2)},${allRet.ci95[1].toFixed(2)}]</text>`);
    lines.push(`  <text x="388" y="${y + 28}" fill="#cbd5e1" font-family="Consolas, monospace" font-size="9">unseen MorphE=${unseen.mean.toFixed(3)} · zeroShot=${entry.zeroShotMorphTransferReturn.mean.toFixed(3)}</text>`);
  });

  // Panel 2: Per-Seed SHA-256 & Retention Breakdown Table
  lines.push(`  <text x="24" y="362" fill="#38bdf8" font-family="Consolas, monospace" font-size="13" font-weight="700">2 · Per-Seed Full-Continual vs Naive-Continual Retention &amp; SHA-256 Provenance</text>`);
  lines.push(`  <rect x="24" y="374" width="550" height="162" fill="#0b1520" stroke="#1e293b" rx="4" />`);
  lines.push(`  <text x="36" y="396" fill="#94a3b8" font-family="Consolas, monospace" font-size="10">SEED    NAIVE RET%   FULL RET%   NAIVE FRG   FULL FRG   MORPH-E   FINAL SHA-256 (FULL)</text>`);
  report.runs.forEach((sr, idx) => {
    const y = 418 + idx * 23;
    const naive = sr.controllers['naive-continual'];
    const full = sr.controllers['full-continual-living'];
    lines.push(`  <text x="36" y="${y}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="10">${sr.seed}   ${naive.metrics.meanPriorTaskRetentionPct.toFixed(2)}%      ${full.metrics.meanPriorTaskRetentionPct.toFixed(2)}%     ${naive.metrics.meanCatastrophicForgetting.toFixed(4)}      ${full.metrics.meanCatastrophicForgetting.toFixed(4)}     ${full.metrics.unseenMorphMeanReturn.toFixed(3)}     ${esc(full.finalSha256.slice(0, 16))}..</text>`);
  });

  // Panel 3: 4-Phase Continual Learning & Retention Trajectory Chart
  lines.push(`  <text x="600" y="86" fill="#f472b6" font-family="Consolas, monospace" font-size="13" font-weight="700">3 · 4-Phase Continual All-Task Return Trajectory (Phase 1 -&gt; Phase 4)</text>`);
  lines.push(`  <rect x="600" y="98" width="556" height="438" fill="#0b1520" stroke="#1e293b" rx="4" />`);

  const cx = 660, cy = 130, cw = 460, ch = 310;
  lines.push(`  <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="#070e17" stroke="#1e293b" />`);
  const minY = 0.35, maxY = 0.78;
  for (let g = 0; g <= 4; g++) {
    const val = minY + (g / 4) * (maxY - minY);
    const py = cy + ch - (g / 4) * ch;
    lines.push(`  <line x1="${cx}" y1="${py}" x2="${cx + cw}" y2="${py}" stroke="#13232f" stroke-dasharray="3,3" />`);
    lines.push(`  <text x="${cx - 8}" y="${py + 4}" text-anchor="end" fill="#64748b" font-family="Consolas, monospace" font-size="10">${val.toFixed(2)}</text>`);
  }

  const phaseLabels = ['P1: T1/Biped', 'P2: T2/Octo', 'P3: T3/Arachnid', 'P4: T4/Eldritch'];
  phaseLabels.forEach((lbl, idx) => {
    const px = cx + (idx / 3) * cw;
    lines.push(`  <line x1="${px}" y1="${cy}" x2="${px}" y2="${cy + ch}" stroke="#13232f" />`);
    lines.push(`  <text x="${px}" y="${cy + ch + 18}" text-anchor="middle" fill="#cbd5e1" font-family="Consolas, monospace" font-size="10">${esc(lbl)}</text>`);
  });

  modes.forEach(mode => {
    const curves = s.byController[mode].phaseCurves;
    const pts = curves.map((pt, idx) => {
      const px = cx + (idx / 3) * cw;
      const py = cy + ch - ((pt.meanAllTasksReturn.mean - minY) / (maxY - minY)) * ch;
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    });
    lines.push(`  <polyline fill="none" stroke="${colors[mode]}" stroke-width="2.5" points="${pts.join(' ')}" />`);
    curves.forEach((pt, idx) => {
      const px = cx + (idx / 3) * cw;
      const py = cy + ch - ((pt.meanAllTasksReturn.mean - minY) / (maxY - minY)) * ch;
      lines.push(`  <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="${colors[mode]}" />`);
    });
  });

  // Legend inside Panel 3
  modes.forEach((mode, idx) => {
    const lx = 630 + (idx % 2) * 260;
    const ly = 482 + Math.floor(idx / 2) * 24;
    lines.push(`  <rect x="${lx}" y="${ly - 9}" width="14" height="10" fill="${colors[mode]}" rx="2" />`);
    lines.push(`  <text x="${lx + 20}" y="${ly}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="10">${esc(mode)} (final=${s.byController[mode].finalAllTasksMeanReturn.mean.toFixed(3)})</text>`);
  });

  lines.push(`  <text x="24" y="560" fill="#64748b" font-family="Consolas, monospace" font-size="10">Generated by scripts/alive-continual-morphology-transfer.cjs · Deterministic 5-seed 4-phase continual learning, distinct-task retention &amp; morphology transfer verification.</text>`);
  lines.push(`</svg>`);
  return lines.join('\n') + '\n';
}

async function main() {
  const report = await ContinualTransfer.run();
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
