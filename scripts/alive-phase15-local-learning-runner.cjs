'use strict';

const fs = require('fs');
const path = require('path');

const pass76 = require('../systems/alive-hinton-forward-forward-goodness.js');
const pass77 = require('../systems/alive-equilibrium-propagation-energy-ising.js');
const pass78 = require('../systems/alive-rao-ballard-predictive-coding-net.js');
const pass79 = require('../systems/alive-modern-continuous-hopfield-ramsauer.js');
const pass80 = require('../systems/alive-local-learning-energy-phase15-audit.js');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const REPORTS_DIR = path.join(DOCS_DIR, 'reports');
const DATE_STAMP = '2026-11-09';

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function renderPassSvg(result) {
  const bars = result.evaluations.map((ev, idx) => {
    const y = 78 + idx * 52;
    const score = ev.aggregate.compositeScoreStats.mean;
    const w = Math.max(12, Math.round(score * 4.8));
    const fill = ev.profileId === result.winnerProfileId ? '#10b981' : '#6366f1';
    return `
      <text x="24" y="${y}" fill="#e2e8f0" font-family="monospace" font-size="12">${ev.profileId}</text>
      <rect x="24" y="${y + 8}" width="${w}" height="18" rx="4" fill="${fill}" />
      <text x="${32 + w}" y="${y + 21}" fill="#f8fafc" font-family="monospace" font-size="12">${score.toFixed(2)} (95% CI [${ev.aggregate.compositeScoreStats.ci95[0]}, ${ev.aggregate.compositeScoreStats.ci95[1]}])</text>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="820" height="320" viewBox="0 0 820 320">
  <rect width="820" height="320" fill="#0f172a" />
  <text x="24" y="34" fill="#38bdf8" font-family="monospace" font-size="16" font-weight="bold">ALIVE Pass ${result.passNumber} (${result.passSlice}) — ${result.moduleId}</text>
  <text x="24" y="54" fill="#94a3b8" font-family="monospace" font-size="12">Winner: ${result.winnerProfileId} | Score: ${result.winnerCompositeScore} | t=${result.pairedTTestVsBaseline.tStat}</text>
  ${bars}
</svg>\n`;
}

function renderPassMarkdown(result, jsonRel, svgRel) {
  const rows = result.evaluations.map((ev) => {
    const s = ev.aggregate.compositeScoreStats;
    return `| \`${ev.profileId}\` | ${ev.label} | **${s.mean.toFixed(2)}** | \`[${s.ci95[0]}, ${s.ci95[1]}]\` |`;
  }).join('\n');

  return `# ALIVE Pass ${result.passNumber} Report (${result.passSlice}) — \`${result.moduleId}\`

- **Phase**: ${result.phaseName}
- **Winning Profile**: \`${result.winnerProfileId}\`
- **Composite Score**: **${result.winnerCompositeScore}/100**
- **Paired Student-t vs Baseline (df=4)**: \`t = ${result.pairedTTestVsBaseline.tStat}\` (\`p < 0.05\` significant: \`${result.pairedTTestVsBaseline.statisticallySignificant}\`)
- **Seeds**: \`${result.seeds.join(', ')}\` (\`${result.episodesPerSeed}\` episodes/seed)
- **JSON Telemetry**: [\`${jsonRel}\`](../${jsonRel})
- **SVG Visual**: [\`${svgRel}\`](../${svgRel})

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
${rows}
`;
}

function renderAuditSvg(audit) {
  const rowsSvg = audit.acceptanceMatrix.map((r, idx) => {
    const y = 78 + idx * 26;
    return `<text x="24" y="${y}" fill="#10b981" font-family="monospace" font-size="12">[PASS] ${r.rowId} (Pass ${r.passNumber}): ${r.metric} = ${r.observedValue}</text>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="360" viewBox="0 0 960 360">
  <rect width="960" height="360" fill="#0f172a" />
  <text x="24" y="32" fill="#38bdf8" font-family="monospace" font-size="15" font-weight="bold">ALIVE Pass 80 (80/100) — Phase XV Local Learning &amp; Energy-Based Brains Matrix (L1-L10)</text>
  <text x="24" y="52" fill="#f8fafc" font-family="monospace" font-size="12">Verified: ${audit.verifiedRows}/${audit.totalRows} | Frozen SHA-256: ${audit.phase15Sha256}</text>
  ${rowsSvg}
</svg>\n`;
}

function renderAuditMarkdown(audit, jsonRel, svgRel) {
  const tableRows = audit.acceptanceMatrix.map((r) =>
    `| **${r.rowId}** | Pass ${r.passNumber} | ${r.metric} | \`${r.threshold}\` | \`${r.observedValue}\` | \`[${r.ci95[0]}, ${r.ci95[1]}]\` | **${r.verified ? 'VERIFIED' : 'FAILED'}** |`
  ).join('\n');

  return `# ALIVE Pass 80 Report (80/100) — Phase XV Biologically Plausible Local Learning & Energy-Based Brains Audit

- **Phase**: ${audit.phaseName}
- **Verified Acceptance Rows**: **${audit.verifiedRows}/${audit.totalRows}** (\`L1\`–\`L10\`)
- **Phase XV Frozen SHA-256 Digest**: \`${audit.phase15Sha256}\`
- **Seeds**: \`${audit.seeds.join(', ')}\` (\`${audit.episodesPerSeed}\` episodes/seed)
- **JSON Telemetry**: [\`${jsonRel}\`](../${jsonRel})
- **SVG Visual**: [\`${svgRel}\`](../${svgRel})

## Phase XV Acceptance Matrix (\`L1\`–\`L10\`)

| Row | Pass | Metric | Threshold | Observed | 95% CI | Status |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: |
${tableRows}
`;
}

function main() {
  ensureDir(DOCS_DIR);
  ensureDir(REPORTS_DIR);

  const r76 = pass76.runPass76ForwardForwardBenchmark();
  const r77 = pass77.runPass77EquilibriumPropagationBenchmark();
  const r78 = pass78.runPass78PredictiveCodingBenchmark();
  const r79 = pass79.runPass79ModernHopfieldBenchmark();
  const r80 = pass80.runPass80LocalLearningPhase15Audit();

  for (const res of [r76, r77, r78, r79]) {
    const baseName = `${res.moduleId}-${DATE_STAMP}`;
    const jsonRel = `docs/reports/${baseName}.json`;
    const svgRel = `docs/reports/${baseName}.svg`;
    fs.writeFileSync(path.join(ROOT, jsonRel), JSON.stringify(res, null, 2) + '\n');
    fs.writeFileSync(path.join(ROOT, svgRel), renderPassSvg(res));
    fs.writeFileSync(
      path.join(DOCS_DIR, `ALIVE_PASS_${res.passNumber}_REPORT.md`),
      renderPassMarkdown(res, jsonRel, svgRel)
    );
  }

  const base80 = `${r80.moduleId}-${DATE_STAMP}`;
  const json80Rel = `docs/reports/${base80}.json`;
  const svg80Rel = `docs/reports/${base80}.svg`;
  fs.writeFileSync(path.join(ROOT, json80Rel), JSON.stringify(r80, null, 2) + '\n');
  fs.writeFileSync(path.join(ROOT, svg80Rel), renderAuditSvg(r80));
  fs.writeFileSync(
    path.join(DOCS_DIR, 'ALIVE_PASS_80_REPORT.md'),
    renderAuditMarkdown(r80, json80Rel, svg80Rel)
  );

  console.log(JSON.stringify({
    pass76Score: r76.winnerCompositeScore,
    pass77Score: r77.winnerCompositeScore,
    pass78Score: r78.winnerCompositeScore,
    pass79Score: r79.winnerCompositeScore,
    pass80VerifiedRows: r80.verifiedRows,
    phase15Sha256: r80.phase15Sha256
  }, null, 2));
}

main();
