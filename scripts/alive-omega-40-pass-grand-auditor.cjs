'use strict';

const fs = require('node:fs');
const path = require('node:path');
const omega40 = require('../systems/alive-omega-40-pass-grand-auditor.js');

(async () => {
  const report = await omega40.runOmega40PassGrandAudit();
  const outDir = path.join(__dirname, '..', 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, 'alive-omega-40-pass-grand-auditor-2026-11-09.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const rows = report.matrixRows;
  const s = report.summary;
  const svgLines = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="980" height="440" viewBox="0 0 980 440">',
    '  <rect width="980" height="440" fill="#071018"/>',
    '  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="16" font-weight="bold">ALIVE Pass 40 · 40-Pass Grand Omega Synthesis &amp; Cryptographic Evidence Freeze (Phases I–VII · 63/63 Gates)</text>',
    `  <text x="24" y="58" fill="#cbd5e1" font-family="Consolas, monospace" font-size="13">Omega 40-Pass=${s.omega40PassQualified ? 'QUALIFIED' : 'FAIL'} · Total Gates=${s.totalVerifiedGatesAcross7Phases}/${s.totalGatesAcross7Phases} · Phase VII Rows=${s.verifiedPhase7Rows}/${s.totalPhase7Rows} · Master SHA-256=${s.omega40PassFrozenDigestSha256.slice(0, 32)}…</text>`,
    `  <text x="24" y="76" fill="#94a3b8" font-family="Consolas, monospace" font-size="11">PhI=${s.phase1DigestSha256.slice(0, 10)} · PhII=${s.phase2DigestSha256.slice(0, 10)} · PhIII=${s.phase3DigestSha256.slice(0, 10)} · PhIV=${s.phase4DigestSha256.slice(0, 10)} · PhV=${s.phase5DigestSha256.slice(0, 10)} · PhVI=${s.phase6DigestSha256.slice(0, 10)} · PhVII=${s.phase7DigestSha256.slice(0, 10)}</text>`
  ];

  rows.forEach((row, idx) => {
    const y = 100 + idx * 30;
    const color = row.verified ? '#10b981' : '#f43f5e';
    svgLines.push(
      `  <rect x="24" y="${y - 13}" width="14" height="16" fill="${color}" rx="2"/>`,
      `  <text x="48" y="${y}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="12">${row.rowId} (Pass ${row.passRef})</text>`,
      `  <text x="490" y="${y}" fill="#34d399" font-family="Consolas, monospace" font-size="12">mean=${row.mean.toFixed(4)} ± ${row.ci95.halfWidth.toFixed(4)} (${row.passedSeeds}/5 seeds · ${row.thresholdDesc})</text>`
    );
  });

  svgLines.push(
    `  <text x="24" y="422" fill="#64748b" font-family="Consolas, monospace" font-size="11">Full Master SHA-256: ${s.omega40PassFrozenDigestSha256}</text>`,
    '</svg>'
  );

  const svgPath = path.join(outDir, 'alive-omega-40-pass-grand-auditor-2026-11-09.svg');
  fs.writeFileSync(svgPath, svgLines.join('\n'));
  console.log(JSON.stringify({
    omega40PassQualified: s.omega40PassQualified,
    totalVerifiedGatesAcross7Phases: s.totalVerifiedGatesAcross7Phases,
    totalGatesAcross7Phases: s.totalGatesAcross7Phases,
    verifiedPhase7Rows: s.verifiedPhase7Rows,
    phase1DigestSha256: s.phase1DigestSha256,
    phase2DigestSha256: s.phase2DigestSha256,
    phase3DigestSha256: s.phase3DigestSha256,
    phase4DigestSha256: s.phase4DigestSha256,
    phase5DigestSha256: s.phase5DigestSha256,
    phase6DigestSha256: s.phase6DigestSha256,
    phase7DigestSha256: s.phase7DigestSha256,
    omega40PassFrozenDigestSha256: s.omega40PassFrozenDigestSha256
  }, null, 2));
})();
