'use strict';

const fs = require('fs');
const path = require('path');

const pass91 = require('../systems/alive-darts-bilevel-architecture-search.js');
const pass92 = require('../systems/alive-kronecker-hypernetwork-weight-generator.js');
const pass93 = require('../systems/alive-ewc-synaptic-intelligence-continual.js');
const pass94 = require('../systems/alive-cmaes-pbt-hyperparameter-evolver.js');
const pass95 = require('../systems/alive-meta-hypernet-continual-phase18-audit.js');

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
  <text x="24" y="32" fill="#38bdf8" font-family="monospace" font-size="15" font-weight="bold">ALIVE Pass 95 (95/100) — Phase XVIII Meta-Learning, Hypernetworks &amp; Continual Matrix (H1-H10)</text>
  <text x="24" y="52" fill="#f8fafc" font-family="monospace" font-size="12">Verified: ${audit.verifiedRows}/${audit.totalRows} | Frozen SHA-256: ${audit.phase18Sha256}</text>
  ${rowsSvg}
</svg>\n`;
}

function renderAuditMarkdown(audit, jsonRel, svgRel) {
  const tableRows = audit.acceptanceMatrix.map((r) =>
    `| **${r.rowId}** | Pass ${r.passNumber} | ${r.metric} | \`${r.threshold}\` | \`${r.observedValue}\` | \`[${r.ci95[0]}, ${r.ci95[1]}]\` | **${r.verified ? 'VERIFIED' : 'FAILED'}** |`
  ).join('\n');

  return `# ALIVE Pass 95 Report (95/100) — Phase XVIII Meta-Learning, DARTS, Kronecker Hypernetworks & Continual Audit

- **Phase**: ${audit.phaseName}
- **Verified Acceptance Rows**: **${audit.verifiedRows}/${audit.totalRows}** (\`H1\`–\`H10\`)
- **Phase XVIII Frozen SHA-256 Digest**: \`${audit.phase18Sha256}\`
- **Seeds**: \`${audit.seeds.join(', ')}\` (\`${audit.episodesPerSeed}\` episodes/seed)
- **JSON Telemetry**: [\`${jsonRel}\`](../${jsonRel})
- **SVG Visual**: [\`${svgRel}\`](../${svgRel})

## Phase XVIII Acceptance Matrix (\`H1\`–\`H10\`)

| Row | Pass | Metric | Threshold | Observed | 95% CI | Status |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: |
${tableRows}
`;
}

function main() {
  ensureDir(DOCS_DIR);
  ensureDir(REPORTS_DIR);

  const r91 = pass91.runPass91DartsBilevelBenchmark();
  const r92 = pass92.runPass92KroneckerHypernetworkBenchmark();
  const r93 = pass93.runPass93ContinualEwcSiBenchmark();
  const r94 = pass94.runPass94CmaesPbtBenchmark();
  const r95 = pass95.runPass95MetaHypernetContinualPhase18Audit();

  for (const res of [r91, r92, r93, r94]) {
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

  const base95 = `${r95.moduleId}-${DATE_STAMP}`;
  const json95Rel = `docs/reports/${base95}.json`;
  const svg95Rel = `docs/reports/${base95}.svg`;
  fs.writeFileSync(path.join(ROOT, json95Rel), JSON.stringify(r95, null, 2) + '\n');
  fs.writeFileSync(path.join(ROOT, svg95Rel), renderAuditSvg(r95));
  fs.writeFileSync(
    path.join(DOCS_DIR, 'ALIVE_PASS_95_REPORT.md'),
    renderAuditMarkdown(r95, json95Rel, svg95Rel)
  );

  console.log(JSON.stringify({
    pass91Score: r91.winnerCompositeScore,
    pass92Score: r92.winnerCompositeScore,
    pass93Score: r93.winnerCompositeScore,
    pass94Score: r94.winnerCompositeScore,
    pass95VerifiedRows: r95.verifiedRows,
    phase18Sha256: r95.phase18Sha256
  }, null, 2));
}

main();
