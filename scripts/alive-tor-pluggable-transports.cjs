#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const TorPt = require('../systems/alive-tor-pluggable-transports.js');

function renderSvg(report) {
  const s = report.summary;
  const modes = ['direct-unguarded-tor', 'vanilla-bridge-no-obfuscation', 'static-obfs4-no-iat-padding', 'adaptive-obfs4-iat-snowflake-mesh'];
  const colors = {
    'direct-unguarded-tor': '#f43f5e',
    'vanilla-bridge-no-obfuscation': '#f59e0b',
    'static-obfs4-no-iat-padding': '#38bdf8',
    'adaptive-obfs4-iat-snowflake-mesh': '#34d399'
  };
  let bars = '';
  modes.forEach((m, idx) => {
    const entry = s.byTransport[m];
    const y = 96 + idx * 50;
    const scr = entry.censorshipResistanceScore.mean;
    const byp = entry.censorshipBypassPct.mean;
    const drp = entry.activeProbeSilentDropPct.mean;
    const iat = entry.iatTimingUniformityPct.mean;
    const ent = entry.wireByteEntropyBits.mean;
    const w = Math.max(2, Math.round(360 * (scr / 100)));
    bars += `
    <text x="230" y="${y + 18}" text-anchor="end" fill="#cbd5e1" font-family="Consolas,monospace" font-size="11">${m}</text>
    <rect x="242" y="${y}" width="360" height="26" rx="3" fill="#0f1b26" stroke="#1e293b"/>
    <rect x="242" y="${y + 2}" width="${w}" height="22" rx="2" fill="${colors[m]}"/>
    <text x="614" y="${y + 18}" fill="#e2e8f0" font-family="Consolas,monospace" font-size="11">res=${scr.toFixed(1)} bypass=${byp.toFixed(1)}% probeDrop=${drp.toFixed(0)}% iat=${iat.toFixed(0)}% ent=${ent.toFixed(2)}b/B</text>`;
  });

  const gSt = s.pairedDeltas.adaptiveVsStaticResistanceGain.mean;
  const gVn = s.pairedDeltas.adaptiveVsVanillaResistanceGain.mean;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="330" viewBox="0 0 980 330">
  <rect width="980" height="330" fill="#05090f"/>
  <text x="24" y="32" fill="#67e8f9" font-family="Consolas,monospace" font-size="15" font-weight="bold">ALIVE Pass 21 — Tor Pluggable Transports: obfs4 Elligator2, iat-mode=2 &amp; Snowflake (5 Seeds)</text>
  <text x="24" y="54" fill="#e2e8f0" font-family="Consolas,monospace" font-size="12">Adaptive vs Static-obfs4: +${gSt.toFixed(2)} (${s.adaptiveBeatStaticSeeds}/5) · vs Vanilla Bridge: +${gVn.toFixed(2)} (${s.adaptiveBeatVanillaSeeds}/5) · 100% Bypass: ${s.exact100BypassSeeds}/5</text>
  <text x="24" y="72" fill="#94a3b8" font-family="Consolas,monospace" font-size="11">24 Censorship Probes/Seed (6 DPI TLS, 6 IP Blocklist, 6 Active-Probing Censor Replay, 6 IAT Burst Classifier)</text>
  ${bars}
  <text x="24" y="312" fill="#64748b" font-family="Consolas,monospace" font-size="11">Seeds: ${report.protocol.seeds.join(', ')} · Elligator2 25519 uniform representative · HMAC-SHA256 ntor cert · Snowflake WebRTC fallback</text>
</svg>\n`;
}

async function main() {
  const report = await TorPt.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-tor-pluggable-transports-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-tor-pluggable-transports-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  fs.writeFileSync(svgPath, renderSvg(report), 'utf8');
  console.log(`Wrote ${jsonPath} and ${svgPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
