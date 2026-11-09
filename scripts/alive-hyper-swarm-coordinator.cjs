#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const HyperSwarm = require('../systems/alive-hyper-swarm-coordinator.js');

function renderSvg(report) {
  const s = report.summary;
  const modes = ['cloned-tab-flock', 'homogeneous-single-guild', 'uncoordinated-independent-swarm', 'tri-guild-hybrid-synergy-swarm'];
  const colors = {
    'cloned-tab-flock': '#f43f5e',
    'homogeneous-single-guild': '#f59e0b',
    'uncoordinated-independent-swarm': '#38bdf8',
    'tri-guild-hybrid-synergy-swarm': '#34d399'
  };
  let bars = '';
  modes.forEach((m, idx) => {
    const entry = s.byMode[m];
    const y = 96 + idx * 50;
    const syn = entry.swarmSynergyScore.mean;
    const pip = entry.pipelineCompletionPct.mean;
    const jsd = entry.guildRoleSpecializationJsd.mean;
    const wDist = entry.interEntityWeightDistance.mean;
    const red = entry.redundantWorkPct.mean;
    const w = Math.max(2, Math.round(360 * (syn / 100)));
    bars += `
    <text x="230" y="${y + 18}" text-anchor="end" fill="#cbd5e1" font-family="Consolas,monospace" font-size="11">${m}</text>
    <rect x="242" y="${y}" width="360" height="26" rx="3" fill="#0f1b26" stroke="#1e293b"/>
    <rect x="242" y="${y + 2}" width="${w}" height="22" rx="2" fill="${colors[m]}"/>
    <text x="614" y="${y + 18}" fill="#e2e8f0" font-family="Consolas,monospace" font-size="11">syn=${syn.toFixed(1)} pipe=${pip.toFixed(0)}% JSD=${jsd.toFixed(2)} wDist=${wDist.toFixed(3)} red=${red.toFixed(1)}%</text>`;
  });

  const gCln = s.pairedDeltas.triVsClonedSynergyGain.mean;
  const gUnc = s.pairedDeltas.triVsUncoordSynergyGain.mean;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="330" viewBox="0 0 980 330">
  <rect width="980" height="330" fill="#05090f"/>
  <text x="24" y="32" fill="#67e8f9" font-family="Consolas,monospace" font-size="15" font-weight="bold">ALIVE Pass 16 — Multi-Entity Exploration Swarm Coordinator (5 Seeds, 15 Entities/Seed)</text>
  <text x="24" y="54" fill="#e2e8f0" font-family="Consolas,monospace" font-size="12">Tri-Guild vs Cloned: +${gCln.toFixed(2)} (${s.triBeatClonedSeeds}/5) · vs Uncoord: +${gUnc.toFixed(2)} (${s.triBeatUncoordSeeds}/5) · Zero Redundancy: ${s.zeroRedundancySeeds}/5</text>
  <text x="24" y="72" fill="#94a3b8" font-family="Consolas,monospace" font-size="11">Guilds: 5 Locust-Foragers (Frontier) · 5 Raven-Cognition (Causal AoT/ToT/GoT) · 5 Fish-School-Consensus (BFT Quorum)</text>
  ${bars}
  <text x="24" y="312" fill="#64748b" font-family="Consolas,monospace" font-size="11">Seeds: ${report.protocol.seeds.join(', ')} · 30 multi-stage clearnet + .onion tasks/seed · Explicit entity identity &amp; independent parameter tensors</text>
</svg>\n`;
}

async function main() {
  const report = await HyperSwarm.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-hyper-swarm-coordinator-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-hyper-swarm-coordinator-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  fs.writeFileSync(svgPath, renderSvg(report), 'utf8');
  console.log(`Wrote ${jsonPath} and ${svgPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
