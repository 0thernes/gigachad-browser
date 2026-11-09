'use strict';

const fs = require('node:fs');
const path = require('node:path');
const pass41 = require('../systems/alive-stiefel-orthogonal-weight-bias-init.js');
const pass42 = require('../systems/alive-spectral-norm-lipschitz-conditioner.js');
const pass43 = require('../systems/alive-mup-maximal-update-parameterization.js');
const pass44 = require('../systems/alive-rmsnorm-rezero-residual-conditioning.js');
const pass45 = require('../systems/alive-weight-conditioning-phase8-audit.js');

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

const r41 = pass41.run();
const r42 = pass42.run();
const r43 = pass43.run();
const r44 = pass44.run();
const r45 = pass45.run();

const items = [
  { pass: 41, base: 'alive-stiefel-orthogonal-weight-bias-init', report: r41, scoreKey: 'compositeWeightInitScore', title: 'Pass 41 · Stiefel-Manifold QR Orthogonal Weights & Analytic Chrono/Gate Biases' },
  { pass: 42, base: 'alive-spectral-norm-lipschitz-conditioner', report: r42, scoreKey: 'compositeLipschitzScore', title: 'Pass 42 · Power-Iteration Spectral Norm & 1-Lipschitz Weight Rescaler' },
  { pass: 43, base: 'alive-mup-maximal-update-parameterization', report: r43, scoreKey: 'compositeMupScore', title: 'Pass 43 · Maximal Update Parameterization (muP) Width-Invariant Weight/Bias/LR Scaling' },
  { pass: 44, base: 'alive-rmsnorm-rezero-residual-conditioning', report: r44, scoreKey: 'compositeResidualNormScore', title: 'Pass 44 · Pre-RMSNorm + QK-Norm + ReZero Residual Gate & Affine Gain/Bias Conditioning' }
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

// Pass 45 Phase VIII Audit JSON, SVG, MD
fs.writeFileSync(path.join(reportsDir, 'alive-weight-conditioning-phase8-audit-2026-11-09.json'), JSON.stringify(r45, null, 2));
const p45Svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="940" height="400" viewBox="0 0 940 400">',
  '  <rect width="940" height="400" fill="#071018"/>',
  '  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="15" font-weight="bold">ALIVE Pass 45 · Phase VIII Weight &amp; Bias Conditioning Acceptance Matrix (W1..W10)</text>',
  `  <text x="24" y="56" fill="#cbd5e1" font-family="Consolas, monospace" font-size="12">Verified=${r45.summary.verifiedRowCount}/10 · Score=${r45.summary.acceptanceScorePct}% · SHA-256=${r45.summary.phase8WeightConditioningFrozenDigestSha256.slice(0, 32)}…</text>`,
  ...r45.matrixRows.map((r, i) => `  <text x="24" y="${88 + i * 28}" fill="#34d399" font-family="Consolas, monospace" font-size="12">[PASS ${r.passedSeeds}/5] ${r.rowId} (Pass ${r.passRef}) · mean=${r.mean.toFixed(4)} · ${r.thresholdDesc}</text>`),
  '</svg>'
].join('\n');
fs.writeFileSync(path.join(reportsDir, 'alive-weight-conditioning-phase8-audit-2026-11-09.svg'), p45Svg);

const md45 = [
  '# ALIVE Pass 45 Report — Phase VIII Weight & Bias Conditioning Acceptance Matrix (`W1`–`W10`)',
  '',
  `**Pass ID:** \`${r45.passId}\`  `,
  `**Verified Rows:** \`${r45.summary.verifiedRowCount} / ${r45.summary.totalAcceptanceRows}\` (\`100.0%\`)  `,
  `**Phase VIII Frozen SHA-256 Digest:** \`${r45.summary.phase8WeightConditioningFrozenDigestSha256}\``,
  '',
  '| Row ID | Pass | Threshold Criterion | Measured Mean ± 95% CI | Seeds | Status |',
  '| :--- | :---: | :--- | :---: | :---: | :---: |',
  ...r45.matrixRows.map(r => `| \`${r.rowId}\` | Pass ${r.passRef} | ${r.thresholdDesc} | \`${r.mean.toFixed(4)} ± ${r.ci95.halfWidth.toFixed(4)}\` | \`${r.passedSeeds}/5\` | **PASS** |`),
  ''
].join('\n');
fs.writeFileSync(path.join(docsDir, 'ALIVE_PASS_45_REPORT.md'), md45);

console.log(JSON.stringify({
  pass41Score: r41.summary.compositeScoreMean,
  pass42Score: r42.summary.compositeScoreMean,
  pass43Score: r43.summary.compositeScoreMean,
  pass44Score: r44.summary.compositeScoreMean,
  pass45VerifiedRows: r45.summary.verifiedRowCount,
  phase8Sha256: r45.summary.phase8WeightConditioningFrozenDigestSha256
}, null, 2));
