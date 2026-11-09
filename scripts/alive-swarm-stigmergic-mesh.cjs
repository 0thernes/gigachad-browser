#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const StigmergicMesh = require('../systems/alive-swarm-stigmergic-mesh.js');

function renderSvg(report) {
  const s = report.summary;
  const modes = ['isolated-no-pheromone-no-bft', 'dedup-only-no-pheromone-no-bft', 'pheromone-without-bft-quorum', 'full-stigmergic-bft-consensus-mesh'];
  const colors = {
    'isolated-no-pheromone-no-bft': '#f43f5e',
    'dedup-only-no-pheromone-no-bft': '#f59e0b',
    'pheromone-without-bft-quorum': '#38bdf8',
    'full-stigmergic-bft-consensus-mesh': '#34d399'
  };
  let bars = '';
  modes.forEach((m, idx) => {
    const entry = s.byMesh[m];
    const y = 96 + idx * 50;
    const msc = entry.stigmergicMeshScore.mean;
    const byz = entry.byzantineRejectionPct.mean;
    const dup = entry.duplicateFrontierFetches.mean;
    const trp = entry.deadEndTrapFollowups.mean;
    const psn = entry.poisonedClaimsInGraph.mean;
    const w = Math.max(2, Math.round(360 * (msc / 100)));
    bars += `
    <text x="230" y="${y + 18}" text-anchor="end" fill="#cbd5e1" font-family="Consolas,monospace" font-size="11">${m}</text>
    <rect x="242" y="${y}" width="360" height="26" rx="3" fill="#0f1b26" stroke="#1e293b"/>
    <rect x="242" y="${y + 2}" width="${w}" height="22" rx="2" fill="${colors[m]}"/>
    <text x="614" y="${y + 18}" fill="#e2e8f0" font-family="Consolas,monospace" font-size="11">mesh=${msc.toFixed(1)} bftRej=${byz.toFixed(0)}% dup=${dup.toFixed(0)} traps=${trp.toFixed(0)} poison=${psn.toFixed(0)}</text>`;
  });

  const gBft = s.pairedDeltas.fullVsNoBftMeshGain.mean;
  const gDed = s.pairedDeltas.fullVsDedupOnlyMeshGain.mean;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="330" viewBox="0 0 980 330">
  <rect width="980" height="330" fill="#05090f"/>
  <text x="24" y="32" fill="#67e8f9" font-family="Consolas,monospace" font-size="15" font-weight="bold">ALIVE Pass 18 — Stigmergic Pheromone Knowledge Graph &amp; BFT Consensus (5 Seeds)</text>
  <text x="24" y="54" fill="#e2e8f0" font-family="Consolas,monospace" font-size="12">Full vs No-BFT: +${gBft.toFixed(2)} (${s.fullBeatNoBftSeeds}/5) · vs Dedup-Only: +${gDed.toFixed(2)} (${s.fullBeatDedupOnlySeeds}/5) · Zero Poison: ${s.zeroByzantinePoisonSeeds}/5</text>
  <text x="24" y="72" fill="#94a3b8" font-family="Consolas,monospace" font-size="11">24 Graph Nodes/Seed (12 Truth, 6 Dead-End Traps, 6 Byzantine Sybil Poison) · rho=0.15 Evaporation · 2f+1 Fish Quorum</text>
  ${bars}
  <text x="24" y="312" fill="#64748b" font-family="Consolas,monospace" font-size="11">Seeds: ${report.protocol.seeds.join(', ')} · Canonical SHA-256 URL deduplication · 0 duplicate fetches &amp; 0 trap followups (${s.zeroDuplicateFetchSeeds}/5)</text>
</svg>\n`;
}

async function main() {
  const report = await StigmergicMesh.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-swarm-stigmergic-mesh-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-swarm-stigmergic-mesh-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  fs.writeFileSync(svgPath, renderSvg(report), 'utf8');
  console.log(`Wrote ${jsonPath} and ${svgPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
