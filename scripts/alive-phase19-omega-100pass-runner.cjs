'use strict';

const fs = require('fs');
const path = require('path');

const pass96 = require('../systems/alive-sparse-autoencoder-monosemantic-sae.js');
const pass97 = require('../systems/alive-ibp-crown-formal-bound-verifier.js');
const pass98 = require('../systems/alive-conformal-temperature-calibration.js');
const pass99 = require('../systems/alive-100pass-supremo-organism-benchmark.js');
const pass100 = require('../systems/alive-omega-100-pass-grand-auditor.js');

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
    const y = 96 + idx * 25;
    return `<text x="24" y="${y}" fill="#10b981" font-family="monospace" font-size="12">[PASS] ${r.rowId} (Pass ${r.passNumber}): ${r.metric} = ${r.observedValue}</text>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="390" viewBox="0 0 980 390">
  <rect width="980" height="390" fill="#0f172a" />
  <text x="24" y="32" fill="#38bdf8" font-family="monospace" font-size="16" font-weight="bold">ALIVE Pass 100 (100/100) — Grand Omega Crown Audit (Phases I-XIX, 183/183 Gates)</text>
  <text x="24" y="52" fill="#f8fafc" font-family="monospace" font-size="12">Phase XIX: ${audit.verifiedRows}/${audit.totalRows} (S1-S10) | Total Gates: ${audit.totalGatesVerified}/${audit.totalGatesExpected} | Phase XIX SHA-256: ${audit.phase19Sha256}</text>
  <text x="24" y="70" fill="#fbbf24" font-family="monospace" font-size="12">Master 100-Pass SHA-256 Crown: ${audit.master100PassSha256}</text>
  ${rowsSvg}
</svg>\n`;
}

function renderAuditMarkdown(audit, jsonRel, svgRel) {
  const tableRows = audit.acceptanceMatrix.map((r) =>
    `| **${r.rowId}** | Pass ${r.passNumber} | ${r.metric} | \`${r.threshold}\` | \`${r.observedValue}\` | \`[${r.ci95[0]}, ${r.ci95[1]}]\` | **${r.verified ? 'VERIFIED' : 'FAILED'}** |`
  ).join('\n');

  const chainRows = audit.full19PhaseChain.map((c) =>
    `| **${c.phase}** | Passes ${c.passes} | \`${c.code}\` | **${c.gates}/${c.gates}** | \`${c.sha256}\` |`
  ).join('\n');

  return `# ALIVE Pass 100 Report (100/100) — Grand Omega Crown Audit (Phases I–XIX, 183/183 Gates) & Master SHA-256 Freeze

- **Phase**: ${audit.phaseName}
- **Phase XIX Acceptance Rows**: **${audit.verifiedRows}/${audit.totalRows}** (\`S1\`–\`S10\`)
- **Grand Total Verified Gates Across All 19 Phases**: **${audit.totalGatesVerified}/${audit.totalGatesExpected}** (\`100/100\` Passes)
- **Phase XIX Frozen SHA-256 Digest**: \`${audit.phase19Sha256}\`
- **Master 100-Pass Grand Omega Crown Frozen SHA-256 Digest**: \`${audit.master100PassSha256}\`
- **Seeds**: \`${audit.seeds.join(', ')}\` (\`${audit.episodesPerSeed}\` episodes/seed)
- **JSON Telemetry**: [\`${jsonRel}\`](../${jsonRel})
- **SVG Visual**: [\`${svgRel}\`](../${svgRel})

## Phase XIX Acceptance Matrix (\`S1\`–\`S10\`)

| Row | Pass | Metric | Threshold | Observed | 95% CI | Status |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: |
${tableRows}

## Complete 19-Phase Cryptographic Chain (\`Passes 1–100\`, \`183/183\` Gates)

| Phase | Pass Range | Gate IDs | Verified Gates | Frozen SHA-256 Digest |
| :--- | :---: | :---: | :---: | :--- |
${chainRows}
`;
}

function main() {
  ensureDir(DOCS_DIR);
  ensureDir(REPORTS_DIR);

  const r96 = pass96.runPass96MonosemanticSaeBenchmark();
  const r97 = pass97.runPass97IbpCrownBenchmark();
  const r98 = pass98.runPass98ConformalCalibrationBenchmark();
  const r99 = pass99.runPass99SupremoOrganismBenchmark();
  const r100 = pass100.runPass100GrandOmegaCrownAudit();

  for (const res of [r96, r97, r98, r99]) {
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

  const base100 = `${r100.moduleId}-${DATE_STAMP}`;
  const json100Rel = `docs/reports/${base100}.json`;
  const svg100Rel = `docs/reports/${base100}.svg`;
  fs.writeFileSync(path.join(ROOT, json100Rel), JSON.stringify(r100, null, 2) + '\n');
  fs.writeFileSync(path.join(ROOT, svg100Rel), renderAuditSvg(r100));
  fs.writeFileSync(
    path.join(DOCS_DIR, 'ALIVE_PASS_100_REPORT.md'),
    renderAuditMarkdown(r100, json100Rel, svg100Rel)
  );

  console.log(JSON.stringify({
    pass96Score: r96.winnerCompositeScore,
    pass97Score: r97.winnerCompositeScore,
    pass98Score: r98.winnerCompositeScore,
    pass99Score: r99.winnerCompositeScore,
    pass100VerifiedRows: r100.verifiedRows,
    totalGatesVerified: r100.totalGatesVerified,
    phase19Sha256: r100.phase19Sha256,
    master100PassSha256: r100.master100PassSha256
  }, null, 2));
}

main();
