#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const TorHybridMesh = require('../systems/alive-tor-hybrid-mesh.js');

function buildSvg(report) {
  const s = report.summary;
  const modes = report.protocol.architectures;
  const colors = {
    'shared-session-direct': '#f43f5e',
    'naive-socks-proxy-only': '#f59e0b',
    'partitioned-storage-no-socks-auth': '#38bdf8',
    'full-tor-hybrid-synergy-mesh': '#34d399'
  };
  const width = 980, height = 390;
  const rows = [];
  rows.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  rows.push(`<rect width="100%" height="100%" fill="#05090f"/>`);
  rows.push(`<text x="20" y="28" fill="#67e8f9" font-family="Consolas, monospace" font-size="14" font-weight="bold">ALIVE Pass 11 — Tor Hybrid Synergy Mesh: IsolateSOCKSAuth, FPD Partitions &amp; Zero-Leak Policy (5 Seeds)</text>`);
  rows.push(`<text x="20" y="48" fill="#cbd5e1" font-family="Consolas, monospace" font-size="11">full vs partitioned +${s.pairedDeltas.fullVsPartitionedIsolationGain.mean.toFixed(2)} (${s.fullBeatPartitionedSeeds}/5) · vs naive SOCKS +${s.pairedDeltas.fullVsNaiveSocksIsolationGain.mean.toFixed(2)} (${s.fullBeatNaiveSocksSeeds}/5) · 0 leaks (${s.zeroLeakSeeds}/5) · 100% fail-closed (${s.exactFailClosedSeeds}/5)</text>`);

  const barMaxW = 340;
  modes.forEach((mode, idx) => {
    const entry = s.byArchitecture[mode];
    const y = 76 + idx * 66;
    const iso = entry.isolationScore.mean;
    const ci = entry.isolationScore.ci95;
    const fpd = entry.fpdIsolationPct.mean;
    const lks = entry.totalLeaks.mean;
    const cir = entry.distinctFpdCircuits.mean;
    const fcl = entry.failClosedPct.mean;
    const w = Math.max(2, (iso / 100) * barMaxW);

    rows.push(`<text x="235" y="${y + 16}" fill="#e2e8f0" text-anchor="end" font-family="Consolas, monospace" font-size="11">${mode}</text>`);
    rows.push(`<rect x="245" y="${y}" width="${barMaxW}" height="24" fill="#0f1b26" stroke="#1e293b"/>`);
    rows.push(`<rect x="245" y="${y + 3}" width="${w.toFixed(1)}" height="18" fill="${colors[mode]}"/>`);
    rows.push(`<text x="${253 + barMaxW}" y="${y + 15}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="11">iso=${iso.toFixed(2)} [${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}] · fpdIso=${fpd.toFixed(1)}% · leaks=${lks.toFixed(0)} · circuits=${cir.toFixed(0)} · failClosed=${fcl.toFixed(1)}%</text>`);
    rows.push(`<text x="245" y="${y + 40}" fill="#94a3b8" font-family="Consolas, monospace" font-size="10">dnsLeaks=${entry.dnsLeaks.mean.toFixed(0)} · webrtcLeaks=${entry.webrtcLeaks.mean.toFixed(0)} · directIpLeaks=${entry.directIpLeaks.mean.toFixed(0)} · storageLeaks=${entry.crossOriginStorageLeaks.mean.toFixed(0)} · circuitCollusions=${entry.crossFpdCircuitCollusions.mean.toFixed(0)}</text>`);
  });

  rows.push(`<text x="20" y="${height - 16}" fill="#64748b" font-family="Consolas, monospace" font-size="10">Seeds: ${report.protocol.seeds.join(', ')} · 20 probes/seed across 5 First-Party Domains (.onion + clearnet) · MAP * ~NOTFOUND · disable_non_proxied_udp</text>`);
  rows.push(`</svg>`);
  return rows.join('\n');
}

async function main() {
  const report = await TorHybridMesh.run();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'alive-tor-hybrid-mesh-2026-11-09.json');
  const svgPath = path.join(outDir, 'alive-tor-hybrid-mesh-2026-11-09.svg');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(svgPath, buildSvg(report));
  console.log('Pass 11 JSON & SVG written:', {
    jsonPath,
    svgPath,
    fullBeatPartitionedSeeds: report.summary.fullBeatPartitionedSeeds,
    fullBeatNaiveSocksSeeds: report.summary.fullBeatNaiveSocksSeeds,
    zeroLeakSeeds: report.summary.zeroLeakSeeds,
    exactFailClosedSeeds: report.summary.exactFailClosedSeeds
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
