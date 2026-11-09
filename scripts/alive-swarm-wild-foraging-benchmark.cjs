#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const WildForaging = require('../systems/alive-swarm-wild-foraging-benchmark.js');

function renderSvg(report) {
  const s = report.summary;
  const modes = ['uncoordinated-flock-15', 'centralized-fifo-queue-15', 'solitary-single-agent', 'stigmergic-tor-hybrid-synergy-swarm'];
  const colors = {
    'uncoordinated-flock-15': '#f43f5e',
    'centralized-fifo-queue-15': '#f59e0b',
    'solitary-single-agent': '#38bdf8',
    'stigmergic-tor-hybrid-synergy-swarm': '#34d399'
  };
  let bars = '';
  modes.forEach((m, idx) => {
    const entry = s.byTopology[m];
    const y = 96 + idx * 50;
    const wsc = entry.wildForagingScore.mean;
    const dsc = entry.corroboratedDiscoveryPct.mean;
    const iso = entry.onionCircuitIsolationPct.mean;
    const hny = entry.honeypotContaminationCount.mean;
    const eff = entry.verifiedClaimsPer100Requests.mean;
    const w = Math.max(2, Math.round(360 * (wsc / 100)));
    bars += `
    <text x="230" y="${y + 18}" text-anchor="end" fill="#cbd5e1" font-family="Consolas,monospace" font-size="11">${m}</text>
    <rect x="242" y="${y}" width="360" height="26" rx="3" fill="#0f1b26" stroke="#1e293b"/>
    <rect x="242" y="${y + 2}" width="${w}" height="22" rx="2" fill="${colors[m]}"/>
    <text x="614" y="${y + 18}" fill="#e2e8f0" font-family="Consolas,monospace" font-size="11">score=${wsc.toFixed(1)} disc=${dsc.toFixed(1)}% onionIso=${iso.toFixed(0)}% eff=${eff.toFixed(1)} honey=${hny.toFixed(0)}</text>`;
  });

  const gFif = s.pairedDeltas.hybridVsFifoForagingGain.mean;
  const gSol = s.pairedDeltas.hybridVsSolitaryForagingGain.mean;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="330" viewBox="0 0 980 330">
  <rect width="980" height="330" fill="#05090f"/>
  <text x="24" y="32" fill="#67e8f9" font-family="Consolas,monospace" font-size="15" font-weight="bold">ALIVE Pass 19 — Wild Clearnet + .onion Multi-Guild Foraging Benchmark (5 Seeds)</text>
  <text x="24" y="54" fill="#e2e8f0" font-family="Consolas,monospace" font-size="12">Hybrid vs FIFO: +${gFif.toFixed(2)} (${s.hybridBeatFifoSeeds}/5) · vs Solitary: +${gSol.toFixed(2)} (${s.hybridBeatSolitarySeeds}/5) · 100% Discovery &amp; 0 Honeypots: ${s.exact100DiscoverySeeds}/5</text>
  <text x="24" y="72" fill="#94a3b8" font-family="Consolas,monospace" font-size="11">36 Multi-Hop Nodes/Seed (24 Corroborated Truth, 6 Low-Yield Noise, 6 Honeypot Disinfo) · 3 Clearnet + 3 v3 .onion FPDs</text>
  ${bars}
  <text x="24" y="312" fill="#64748b" font-family="Consolas,monospace" font-size="11">Seeds: ${report.protocol.seeds.join(', ')} · Locust + Raven + Fish + Tor FPD IsolateSOCKSAuth + Token-Bucket Governor + 2f+1 BFT Quorum</text>
</svg>\n`;
}

async function main() {
  const report = await WildForaging.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-swarm-wild-foraging-benchmark-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-swarm-wild-foraging-benchmark-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  fs.writeFileSync(svgPath, renderSvg(report), 'utf8');
  console.log(`Wrote ${jsonPath} and ${svgPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
