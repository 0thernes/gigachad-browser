#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const SwarmGovernor = require('../systems/alive-swarm-budget-governor.js');

function renderSvg(report) {
  const s = report.summary;
  const modes = ['ungoverned-locust-flood', 'global-cap-no-per-domain-bucket', 'per-domain-bucket-no-killswitch', 'full-token-bucket-swarm-governor'];
  const colors = {
    'ungoverned-locust-flood': '#f43f5e',
    'global-cap-no-per-domain-bucket': '#f59e0b',
    'per-domain-bucket-no-killswitch': '#38bdf8',
    'full-token-bucket-swarm-governor': '#34d399'
  };
  let bars = '';
  modes.forEach((m, idx) => {
    const entry = s.byGovernor[m];
    const y = 96 + idx * 50;
    const cmp = entry.governanceComplianceScore.mean;
    const dViol = entry.domainConcurrencyViolations.mean;
    const tOvr = entry.tokenBucketOverruns.mean;
    const kLeak = entry.killSwitchLeakCount.mean;
    const pop = entry.peakPopulation.mean;
    const w = Math.max(2, Math.round(360 * (cmp / 100)));
    bars += `
    <text x="230" y="${y + 18}" text-anchor="end" fill="#cbd5e1" font-family="Consolas,monospace" font-size="11">${m}</text>
    <rect x="242" y="${y}" width="360" height="26" rx="3" fill="#0f1b26" stroke="#1e293b"/>
    <rect x="242" y="${y + 2}" width="${w}" height="22" rx="2" fill="${colors[m]}"/>
    <text x="614" y="${y + 18}" fill="#e2e8f0" font-family="Consolas,monospace" font-size="11">comp=${cmp.toFixed(1)} domViol=${dViol.toFixed(0)} tokOvr=${tOvr.toFixed(0)} killLeak=${kLeak.toFixed(0)} peakPop=${pop.toFixed(0)}</text>`;
  });

  const gNok = s.pairedDeltas.fullVsNoKillComplianceGain.mean;
  const gGlb = s.pairedDeltas.fullVsGlobalOnlyComplianceGain.mean;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="330" viewBox="0 0 980 330">
  <rect width="980" height="330" fill="#05090f"/>
  <text x="24" y="32" fill="#67e8f9" font-family="Consolas,monospace" font-size="15" font-weight="bold">ALIVE Pass 17 — Public-Web &amp; Onion Swarm Resource Governor (5 Seeds)</text>
  <text x="24" y="54" fill="#e2e8f0" font-family="Consolas,monospace" font-size="12">Full vs No-Kill: +${gNok.toFixed(2)} (${s.fullBeatNoKillSeeds}/5) · vs Global-Only: +${gGlb.toFixed(2)} (${s.fullBeatGlobalOnlySeeds}/5) · 0 Domain Violations: ${s.zeroDomainViolationSeeds}/5</text>
  <text x="24" y="72" fill="#94a3b8" font-family="Consolas,monospace" font-size="11">6 Target Domains (3 Clearnet maxConcurrent=2, 3 .onion v3 maxConcurrent=1) · Hard Ceiling maxEntities=15 · PAUSE/KILL_SWITCH</text>
  ${bars}
  <text x="24" y="312" fill="#64748b" font-family="Consolas,monospace" font-size="11">Seeds: ${report.protocol.seeds.join(', ')} · 40 burst steps/seed · Token-bucket refill accounting · 0 kill-switch leaks (${s.zeroKillSwitchLeakSeeds}/5)</text>
</svg>\n`;
}

async function main() {
  const report = await SwarmGovernor.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-swarm-budget-governor-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-swarm-budget-governor-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  fs.writeFileSync(svgPath, renderSvg(report), 'utf8');
  console.log(`Wrote ${jsonPath} and ${svgPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
