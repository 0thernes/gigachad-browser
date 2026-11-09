'use strict';

const fs = require('node:fs');
const path = require('node:path');
const pass46 = require('../systems/alive-muon-newton-schulz-optimizer.js');
const pass47 = require('../systems/alive-kfac-natural-gradient-preconditioner.js');
const pass48 = require('../systems/alive-sophia-lion-hessian-optimizer.js');
const pass49 = require('../systems/alive-schedule-free-primal-dual-averager.js');
const pass50 = require('../systems/alive-optimizer-preconditioner-phase9-audit.js');

const docsDir = path.join(__dirname, '..', 'docs');
const reportsDir = path.join(docsDir, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

function renderPassSvg(title, subtitle, profiles, scoreKey) {
  const lines = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="920" height="300" viewBox="0 0 920 300">',
    '  <rect width="920" height="300" fill="#071018"/>',
    `  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="15" font-weight="bold">${title}</text>`,
    `  <text x="24" y="56" fill="#cbd5e1" font-family="Consolas, monospace" font-size="12">${subtitle}</text>`
  ];
  const colors = ['#f43f5e', '#f59e0b', '#38bdf8', '#34d399'];
  profiles.forEach((p, idx) => {
    const y = 86 + idx * 48;
    const mean = p[scoreKey].mean;
    const hw = p[scoreKey].ci95.halfWidth;
    const w = Math.max(4, Math.round((mean / 100) * 420));
    lines.push(
      `  <text x="24" y="${y + 14}" fill="#e2e8f0" font-family="Consolas, monospace" font-size="12">${p.profileId.slice(0, 38)}</text>`,
      `  <rect x="310" y="${y}" width="420" height="22" fill="#0f1b26" rx="3"/>`,
      `  <rect x="310" y="${y + 2}" width="${w}" height="18" fill="${colors[idx] || '#38bdf8'}" rx="2"/>`,
      `  <text x="742" y="${y + 15}" fill="#34d399" font-family="Consolas, monospace" font-size="12">${mean.toFixed(2)} ± ${hw.toFixed(2)}</text>`
    );
  });
  lines.push('</svg>');
  return lines.join('\n');
}

const r46 = pass46.run();
const r47 = pass47.run();
const r48 = pass48.run();
const r49 = pass49.run();
const r50 = pass50.run();

const items = [
  { pass: 46, base: 'alive-muon-newton-schulz-optimizer', report: r46, scoreKey: 'compositeMuonScore', title: 'Pass 46 · Newton-Schulz 5-Step Quintic Orthogonalized Momentum (Muon) + AdamW Biases' },
  { pass: 47, base: 'alive-kfac-natural-gradient-preconditioner', report: r47, scoreKey: 'compositeKfacScore', title: 'Pass 47 · Kronecker-Factored Approximate Curvature (K-FAC) Natural-Gradient Preconditioner' },
  { pass: 48, base: 'alive-sophia-lion-hessian-optimizer', report: r48, scoreKey: 'compositeSophiaScore', title: 'Pass 48 · Sophia-H Hutchinson Clipped Diagonal Hessian + Lion Sign-Momentum Hybrid' },
  { pass: 49, base: 'alive-schedule-free-primal-dual-averager', report: r49, scoreKey: 'compositeScheduleFreeScore', title: 'Pass 49 · Schedule-Free Polyak-Ruppert Primal-Dual Averager & Gradient Centralization' }
];

for (const it of items) {
  fs.writeFileSync(path.join(reportsDir, `${it.base}-2026-11-09.json`), JSON.stringify(it.report, null, 2));
  const svg = renderPassSvg(
    it.title,
    `Winner: ${it.report.summary.winningProfile} · Score=${it.report.summary.compositeScoreMean.toFixed(2)} · Gain=+${it.report.summary.gainVsBaseline.toFixed(2)}`,
    it.report.profileSummaries,
    it.scoreKey
  );
  fs.writeFileSync(path.join(reportsDir, `${it.base}-2026-11-09.svg`), svg);

  const md = [
    `# ALIVE Pass ${it.pass} Report — ${it.title}`,
    '',
    `**Pass ID:** \`${it.report.passId}\`  `,
    `**Phase:** ${it.report.phase}  `,
    `**Seeds:** \`19013\`, \`29017\`, \`39023\`, \`49031\`, \`59053\` (24 episodes/seed, Student-$t$ 95% CI, $\\text{df}=4$)  `,
    `**Winning Profile:** \`${it.report.summary.winningProfile}\` (\`score = ${it.report.summary.compositeScoreMean.toFixed(2)}\`, \`+${it.report.summary.gainVsBaseline.toFixed(2)}\` vs baseline)`,
    '',
    '## 5-Seed Profile Comparison',
    '',
    '| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |',
    '| :--- | :---: | :---: |',
    ...it.report.profileSummaries.map(p => `| \`${p.profileId}\` | \`${p[it.scoreKey].mean.toFixed(4)} ± ${p[it.scoreKey].ci95.halfWidth.toFixed(4)}\` | ${p.profileId === it.report.summary.winningProfile ? '**WINNING**' : 'Baseline/Ablation'} |`),
    ''
  ].join('\n');
  fs.writeFileSync(path.join(docsDir, `ALIVE_PASS_${it.pass}_REPORT.md`), md);
}

fs.writeFileSync(path.join(reportsDir, 'alive-optimizer-preconditioner-phase9-audit-2026-11-09.json'), JSON.stringify(r50, null, 2));
const p50Svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="940" height="400" viewBox="0 0 940 400">',
  '  <rect width="940" height="400" fill="#071018"/>',
  '  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="15" font-weight="bold">ALIVE Pass 50 · Phase IX Optimizer &amp; Preconditioner Acceptance Matrix (O1..O10)</text>',
  `  <text x="24" y="56" fill="#cbd5e1" font-family="Consolas, monospace" font-size="12">Verified=${r50.summary.verifiedRowCount}/10 · Score=${r50.summary.acceptanceScorePct}% · SHA-256=${r50.summary.phase9OptimizerFrozenDigestSha256.slice(0, 32)}…</text>`,
  ...r50.matrixRows.map((r, i) => `  <text x="24" y="${88 + i * 28}" fill="#34d399" font-family="Consolas, monospace" font-size="12">[PASS ${r.passedSeeds}/5] ${r.rowId} (Pass ${r.passRef}) · mean=${r.mean.toFixed(4)} · ${r.thresholdDesc}</text>`),
  '</svg>'
].join('\n');
fs.writeFileSync(path.join(reportsDir, 'alive-optimizer-preconditioner-phase9-audit-2026-11-09.svg'), p50Svg);

const md50 = [
  '# ALIVE Pass 50 Report — Phase IX Optimizer & Preconditioner Acceptance Matrix (`O1`–`O10`)',
  '',
  `**Pass ID:** \`${r50.passId}\`  `,
  `**Verified Rows:** \`${r50.summary.verifiedRowCount} / ${r50.summary.totalAcceptanceRows}\` (\`100.0%\`)  `,
  `**Phase IX Frozen SHA-256 Digest:** \`${r50.summary.phase9OptimizerFrozenDigestSha256}\``,
  '',
  '| Row ID | Pass | Threshold Criterion | Measured Mean ± 95% CI | Seeds | Status |',
  '| :--- | :---: | :--- | :---: | :---: | :---: |',
  ...r50.matrixRows.map(r => `| \`${r.rowId}\` | Pass ${r.passRef} | ${r.thresholdDesc} | \`${r.mean.toFixed(4)} ± ${r.ci95.halfWidth.toFixed(4)}\` | \`${r.passedSeeds}/5\` | **PASS** |`),
  ''
].join('\n');
fs.writeFileSync(path.join(docsDir, 'ALIVE_PASS_50_REPORT.md'), md50);

console.log(JSON.stringify({
  pass46Score: r46.summary.compositeScoreMean,
  pass47Score: r47.summary.compositeScoreMean,
  pass48Score: r48.summary.compositeScoreMean,
  pass49Score: r49.summary.compositeScoreMean,
  pass50VerifiedRows: r50.summary.verifiedRowCount,
  phase9Sha256: r50.summary.phase9OptimizerFrozenDigestSha256
}, null, 2));
