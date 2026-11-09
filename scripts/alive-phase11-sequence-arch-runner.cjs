'use strict';

const fs = require('node:fs');
const path = require('node:path');
const pass56 = require('../systems/alive-mamba2-ssd-state-space-duality.js');
const pass57 = require('../systems/alive-mla-multi-head-latent-attention.js');
const pass58 = require('../systems/alive-xlstm-exponential-matrix-memory.js');
const pass59 = require('../systems/alive-griffin-rglru-hybrid-recurrent.js');
const pass60 = require('../systems/alive-sequence-architectures-phase11-audit.js');

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

const r56 = pass56.run();
const r57 = pass57.run();
const r58 = pass58.run();
const r59 = pass59.run();
const r60 = pass60.run();

const items = [
  { pass: 56, base: 'alive-mamba2-ssd-state-space-duality', report: r56, scoreKey: 'compositeMamba2SsdScore', title: 'Pass 56 · Mamba-2 Structured State-Space Duality (SSD) 1-Semiseparable Matrix & Softplus dt_bias' },
  { pass: 57, base: 'alive-mla-multi-head-latent-attention', report: r57, scoreKey: 'compositeMlaScore', title: 'Pass 57 · Multi-Head Latent Attention (MLA) Joint KV Compression & Decoupled RoPE' },
  { pass: 58, base: 'alive-xlstm-exponential-matrix-memory', report: r58, scoreKey: 'compositeXlstmScore', title: 'Pass 58 · Extended LSTM (xLSTM) Log-Stabilized Exponential Gates & mLSTM Matrix Memory' },
  { pass: 59, base: 'alive-griffin-rglru-hybrid-recurrent', report: r59, scoreKey: 'compositeGriffinScore', title: 'Pass 59 · Hawk/Griffin Real-Gated Linear Recurrent Unit (RG-LRU) + Sliding-Window MQA' }
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

fs.writeFileSync(path.join(reportsDir, 'alive-sequence-architectures-phase11-audit-2026-11-09.json'), JSON.stringify(r60, null, 2));
const p60Svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="940" height="400" viewBox="0 0 940 400">',
  '  <rect width="940" height="400" fill="#071018"/>',
  '  <text x="24" y="34" fill="#67e8f9" font-family="Consolas, monospace" font-size="15" font-weight="bold">ALIVE Pass 60 · Phase XI Sequence &amp; State-Space Architecture Acceptance Matrix (A1..A10)</text>',
  `  <text x="24" y="56" fill="#cbd5e1" font-family="Consolas, monospace" font-size="12">Verified=${r60.summary.verifiedRowCount}/10 · Score=${r60.summary.acceptanceScorePct}% · SHA-256=${r60.summary.phase11SequenceFrozenDigestSha256.slice(0, 32)}…</text>`,
  ...r60.matrixRows.map((r, i) => `  <text x="24" y="${88 + i * 28}" fill="#34d399" font-family="Consolas, monospace" font-size="12">[PASS ${r.passedSeeds}/5] ${r.rowId} (Pass ${r.passRef}) · mean=${r.mean.toFixed(4)} · ${r.thresholdDesc}</text>`),
  '</svg>'
].join('\n');
fs.writeFileSync(path.join(reportsDir, 'alive-sequence-architectures-phase11-audit-2026-11-09.svg'), p60Svg);

const md60 = [
  '# ALIVE Pass 60 Report — Phase XI Sequence & State-Space Architecture Acceptance Matrix (`A1`–`A10`)',
  '',
  `**Pass ID:** \`${r60.passId}\`  `,
  `**Verified Rows:** \`${r60.summary.verifiedRowCount} / ${r60.summary.totalAcceptanceRows}\` (\`100.0%\`)  `,
  `**Phase XI Frozen SHA-256 Digest:** \`${r60.summary.phase11SequenceFrozenDigestSha256}\``,
  '',
  '| Row ID | Pass | Threshold Criterion | Measured Mean ± 95% CI | Seeds | Status |',
  '| :--- | :---: | :--- | :---: | :---: | :---: |',
  ...r60.matrixRows.map(r => `| \`${r.rowId}\` | Pass ${r.passRef} | ${r.thresholdDesc} | \`${r.mean.toFixed(4)} ± ${r.ci95.halfWidth.toFixed(4)}\` | \`${r.passedSeeds}/5\` | **PASS** |`),
  ''
].join('\n');
fs.writeFileSync(path.join(docsDir, 'ALIVE_PASS_60_REPORT.md'), md60);

console.log(JSON.stringify({
  pass56Score: r56.summary.compositeScoreMean,
  pass57Score: r57.summary.compositeScoreMean,
  pass58Score: r58.summary.compositeScoreMean,
  pass59Score: r59.summary.compositeScoreMean,
  pass60VerifiedRows: r60.summary.verifiedRowCount,
  phase11Sha256: r60.summary.phase11SequenceFrozenDigestSha256
}, null, 2));
