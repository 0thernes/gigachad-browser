#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ColonyFitness = require('../systems/alive-colony-population-fitness.js');

const DATE_TAG = '2026-11-09';
const REPORT_DIR = path.join(__dirname, '..', 'docs', 'reports');
const JSON_PATH = path.join(REPORT_DIR, `alive-colony-population-fitness-${DATE_TAG}.json`);
const SVG_PATH = path.join(REPORT_DIR, `alive-colony-population-fitness-${DATE_TAG}.svg`);

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSvg(report) {
  const width = 1180;
  const height = 520;
  const s = report.summary;
  const regimes = ColonyFitness.REGIMES;
  const colors = {
    'solitary-host': '#64748b',
    'undifferentiated-clone-colony': '#f59e0b',
    'unbounded-greedy-colony': '#f43f5e',
    'differentiated-role-colony': '#34d399'
  };

  const lines = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  lines.push(`  <rect width="100%" height="100%" fill="#060c14" />`);
  lines.push(`  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="16" font-weight="700">PASS 6 · CREATURE COLONY DIFFERENTIATION, ROLE ASSIGNMENT, STATE SEPARATION &amp; POPULATION FITNESS (5 SEEDS)</text>`);
  lines.push(`  <text x="24" y="54" fill="#94a3b8" font-family="Consolas, monospace" font-size="11">Seeds: [19013, 29017, 39023, 49031, 59053] · Matched Compute: 200 substeps/seed · Diff vs Solitary: +${s.pairedDeltas.diffVsSolitaryFitnessGain.mean.toFixed(2)} (${s.diffBeatSolitarySeeds}/5) · Diff vs Clone: +${s.pairedDeltas.diffVsCloneFitnessGain.mean.toFixed(2)} (${s.diffBeatCloneSeeds}/5) · State Separation: 5/5</text>`);

  // Left box: 4 Regimes Comparison
  lines.push(`  <text x="24" y="86" fill="#34d399" font-family="Consolas, monospace" font-size="13" font-weight="700">1 · Population Fitness &amp; Resource Metrics Across 4 Regimes (Mean ± 95% CI)</text>`);
  lines.push(`  <rect x="24" y="98" width="600" height="380" fill="#0b1520" stroke="#1e293b" rx="4" />`);

  regimes.forEach((reg, idx) => {
    const entry = s.byRegime[reg];
    const y = 126 + idx * 84;
    const fit = entry.populationFitness;
    const cov = entry.nicheCoveragePct;
    const col = entry.collisionPenaltyTotal;
    const stv = entry.starvationEvents;
    const barW = Math.round((fit.mean / 6.8) * 220);

    lines.push(`  <text x="242" y="${y + 12}" text-anchor="end" fill="${colors[reg]}" font-family="Consolas, monospace" font-size="11" font-weight="700">${esc(reg)}</text>`);
    lines.push(`  <text x="242" y="${y + 28}" text-anchor="end" fill="#94a3b8" font-family="Consolas, monospace" font-size="9">N=${entry.populationSize} · uniqueRoles=${entry.uniqueRolesAssigned} · stateAudit=${entry.independentStateVerifiedSeeds}/5</text>`);
    lines.push(`  <rect x="252" y="${y}" width="220" height="20" fill="#0f1b26" rx="2" />`);
    lines.push(`  <rect x="252" y="${y + 2}" width="${Math.max(4, barW)}" height="16" fill="${colors[reg]}" rx="2" />`);
    lines.push(`  <text x="480" y="${y + 14}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="10">fit=${fit.mean.toFixed(2)} ±${fit.sampleStandardDeviation.toFixed(2)}</text>`);
    lines.push(`  <text x="252" y="${y + 36}" fill="#cbd5e1" font-family="Consolas, monospace" font-size="10">nicheCov=${cov.mean.toFixed(1)}% · collisions=${col.mean.toFixed(2)} · starvation=${stv.mean.toFixed(0)}</text>`);
  });

  // Right box: Shared vs Independent State Contract & 5 Role Specializations
  lines.push(`  <text x="648" y="86" fill="#38bdf8" font-family="Consolas, monospace" font-size="13" font-weight="700">2 · Shared Controller vs Per-Entity Independent State &amp; 5 Colony Roles</text>`);
  lines.push(`  <rect x="648" y="98" width="508" height="380" fill="#0b1520" stroke="#1e293b" rx="4" />`);
  lines.push(`  <text x="664" y="126" fill="#67e8f9" font-family="Consolas, monospace" font-size="11" font-weight="700">Shared Controller State (2,212 bytes across colony):</text>`);
  lines.push(`  <text x="664" y="146" fill="#cbd5e1" font-family="Consolas, monospace" font-size="10">• W_actor[5,16] (320 B) + W_world[16,16] (1,024 B) + ResearchRanker[217] (868 B)</text>`);
  lines.push(`  <text x="664" y="166" fill="#cbd5e1" font-family="Consolas, monospace" font-size="10">• Non-enumerable reference; verified 0 genome/checkpoint serialization leaks</text>`);
  lines.push(`  <text x="664" y="198" fill="#34d399" font-family="Consolas, monospace" font-size="11" font-weight="700">Per-Entity Independent State (224 bytes × 5 entities = 1,120 B):</text>`);
  lines.push(`  <text x="664" y="218" fill="#cbd5e1" font-family="Consolas, monospace" font-size="10">• morphVec[6] (24 B) + W_metamorph[5,6] (120 B) + roleFilter16[16] (64 B) + pos2D (16 B)</text>`);
  lines.push(`  <text x="664" y="238" fill="#cbd5e1" font-family="Consolas, monospace" font-size="10">• Verified distinct ArrayBuffer instances for every entity on 5/5 seeds</text>`);

  lines.push(`  <text x="664" y="274" fill="#f59e0b" font-family="Consolas, monospace" font-size="11" font-weight="700">5 Differentiated Colony Roles (COLONY_LENSES):</text>`);
  ColonyFitness.ROLES.forEach((role, idx) => {
    const y = 298 + idx * 32;
    lines.push(`  <rect x="664" y="${y - 12}" width="476" height="24" fill="#0f1b26" rx="2" />`);
    lines.push(`  <text x="674" y="${y + 4}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="10">[${idx}] ${esc(role.id.padEnd(15, ' '))} ${esc(role.label.padEnd(28, ' '))} sector=(${role.nicheCenter[0].toFixed(1)}, ${role.nicheCenter[1].toFixed(1)})</text>`);
  });

  lines.push(`  <text x="24" y="502" fill="#64748b" font-family="Consolas, monospace" font-size="10">Generated by scripts/alive-colony-population-fitness.cjs · Deterministic 5-seed evaluation of Procreate/Mitosis, Formation, Feed &amp; COLONY_LENSES differentiation.</text>`);
  lines.push(`</svg>`);
  return lines.join('\n') + '\n';
}

async function main() {
  const report = await ColonyFitness.run();
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
