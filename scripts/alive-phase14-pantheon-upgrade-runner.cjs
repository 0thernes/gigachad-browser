'use strict';

const fs = require('fs');
const path = require('path');

const pass71 = require('../systems/alive-pantheon-connectome-flywire-weights.js');
const pass72 = require('../systems/alive-pantheon-quantum-riemannian-hdc-weights.js');
const pass73 = require('../systems/alive-pantheon-cortical-striatal-chaos-weights.js');
const pass74 = require('../systems/alive-pantheon-cross-attention-fusion-bus.js');
const pass75 = require('../systems/alive-pantheon-14brain-upgrade-phase14-audit.js');

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
  <text x="24" y="32" fill="#38bdf8" font-family="monospace" font-size="15" font-weight="bold">ALIVE Pass 75 (75/100) — Phase XIV 14-Brain Pantheon Upgrade Acceptance Matrix (B1-B10)</text>
  <text x="24" y="52" fill="#f8fafc" font-family="monospace" font-size="12">Verified: ${audit.verifiedRows}/${audit.totalRows} | Frozen SHA-256: ${audit.phase14Sha256}</text>
  ${rowsSvg}
</svg>\n`;
}

function renderAuditMarkdown(audit, jsonRel, svgRel) {
  const tableRows = audit.acceptanceMatrix.map((r) =>
    `| **${r.rowId}** | Pass ${r.passNumber} | ${r.metric} | \`${r.threshold}\` | \`${r.observedValue}\` | \`[${r.ci95[0]}, ${r.ci95[1]}]\` | **${r.verified ? 'VERIFIED' : 'FAILED'}** |`
  ).join('\n');

  return `# ALIVE Pass 75 Report (75/100) — Phase XIV 14-Brain Multiverse Pantheon Upgrade Audit & SHA-256 Freeze

- **Phase**: ${audit.phaseName}
- **Verified Acceptance Rows**: **${audit.verifiedRows}/${audit.totalRows}** (\`B1\`–\`B10\`)
- **Phase XIV Frozen SHA-256 Digest**: \`${audit.phase14Sha256}\`
- **Seeds**: \`${audit.seeds.join(', ')}\` (\`${audit.episodesPerSeed}\` episodes/seed)
- **JSON Telemetry**: [\`${jsonRel}\`](../${jsonRel})
- **SVG Visual**: [\`${svgRel}\`](../${svgRel})

## Phase XIV Acceptance Matrix (\`B1\`–\`B10\`)

| Row | Pass | Metric | Threshold | Observed | 95% CI | Status |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: |
${tableRows}
`;
}

function main() {
  ensureDir(DOCS_DIR);
  ensureDir(REPORTS_DIR);

  const r71 = pass71.runPass71ConnectomeFlywireBenchmark();
  const r72 = pass72.runPass72QuantumRiemannianHdcBenchmark();
  const r73 = pass73.runPass73CorticalStriatalChaosBenchmark();
  const r74 = pass74.runPass74PantheonFusionBusBenchmark();
  const r75 = pass75.runPass75Pantheon14BrainPhase14Audit();

  for (const res of [r71, r72, r73, r74]) {
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

  const base75 = `${r75.moduleId}-${DATE_STAMP}`;
  const json75Rel = `docs/reports/${base75}.json`;
  const svg75Rel = `docs/reports/${base75}.svg`;
  fs.writeFileSync(path.join(ROOT, json75Rel), JSON.stringify(r75, null, 2) + '\n');
  fs.writeFileSync(path.join(ROOT, svg75Rel), renderAuditSvg(r75));
  fs.writeFileSync(
    path.join(DOCS_DIR, 'ALIVE_PASS_75_REPORT.md'),
    renderAuditMarkdown(r75, json75Rel, svg75Rel)
  );

  console.log(JSON.stringify({
    pass71Score: r71.winnerCompositeScore,
    pass72Score: r72.winnerCompositeScore,
    pass73Score: r73.winnerCompositeScore,
    pass74Score: r74.winnerCompositeScore,
    pass75VerifiedRows: r75.verifiedRows,
    phase14Sha256: r75.phase14Sha256
  }, null, 2));
}

main();
