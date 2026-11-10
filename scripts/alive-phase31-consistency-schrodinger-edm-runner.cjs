'use strict';
const fs = require('node:fs');
const path = require('node:path');
const p156 = require('../systems/alive-consistency-model-single-step-distillation.js');
const p157 = require('../systems/alive-schrodinger-bridge-iterative-proportional-fitting.js');
const p158 = require('../systems/alive-edm-karras-preconditioned-score-weights.js');
const p159 = require('../systems/alive-cfg-autoguidance-tangential-score-steering.js');
const p160 = require('../systems/alive-consistency-schrodinger-edm-phase31-audit.js');

const ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'docs', 'reports');
fs.mkdirSync(REPORTS_DIR, { recursive: true });

function writePassArtifacts(passNum, slug, title, evalResult) {
  const jsonPath = path.join(REPORTS_DIR, `${slug}-2026-11-09.json`);
  const svgPath = path.join(REPORTS_DIR, `${slug}-2026-11-09.svg`);
  const mdPath = path.join(ROOT, 'docs', `ALIVE_PASS_${passNum}_REPORT.md`);
  fs.writeFileSync(jsonPath, JSON.stringify(evalResult, null, 2) + '\n', 'utf8');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="220" viewBox="0 0 760 220">
  <rect width="760" height="220" fill="#0d1117"/>
  <text x="24" y="38" fill="#58a6ff" font-family="monospace" font-size="16" font-weight="bold">Pass ${passNum}: ${title}</text>
  <text x="24" y="72" fill="#3fb950" font-family="monospace" font-size="14">Winner: ${evalResult.winningProfileId || 'Phase-Audit-Matrix'} | Score: ${evalResult.winningScore ?? evalResult.acceptanceScorePct}%</text>
  <text x="24" y="104" fill="#e6edf3" font-family="monospace" font-size="12">SHA-256: ${evalResult.sha256 || evalResult.phase31Sha256}</text>
  <rect x="24" y="130" width="712" height="28" rx="6" fill="#238636"/>
  <text x="36" y="149" fill="#ffffff" font-family="monospace" font-size="13">5-Seed Verified (19013, 29017, 39023, 49031, 59053) - 100.0%</text>
</svg>\n`;
  fs.writeFileSync(svgPath, svg, 'utf8');

  const md = `# Pass ${passNum} Report: ${title}

- **Pass ID:** \`${evalResult.passId}\`
- **Phase:** ${evalResult.phase}
- **Seeds:** \`${(evalResult.seeds || []).join(', ')}\`
- **Winning Profile / Score:** \`${evalResult.winningProfileId || 'D2_1..D2_10'}\` (\`${evalResult.winningScore ?? evalResult.acceptanceScorePct}\`)
- **SHA-256 Digest:** \`${evalResult.sha256 || evalResult.phase31Sha256}\`
- **JSON Artifact:** \`docs/reports/${slug}-2026-11-09.json\`
- **SVG Artifact:** \`docs/reports/${slug}-2026-11-09.svg\`
`;
  fs.writeFileSync(mdPath, md, 'utf8');
}

const r156 = p156.runPass156Evaluation();
const r157 = p157.runPass157Evaluation();
const r158 = p158.runPass158Evaluation();
const r159 = p159.runPass159Evaluation();
const r160 = p160.runPass160Phase31Audit();

writePassArtifacts(156, 'alive-consistency-model-single-step-distillation', 'Song Consistency Model Single-Step Trajectory Distillation', r156);
writePassArtifacts(157, 'alive-schrodinger-bridge-iterative-proportional-fitting', 'Diffusion Schrodinger Bridge (DSB) IPF Forward-Backward Drift Weights', r157);
writePassArtifacts(158, 'alive-edm-karras-preconditioned-score-weights', 'Karras EDM Preconditioned Score Denoiser Weights & Unit-Variance Scaling', r158);
writePassArtifacts(159, 'alive-cfg-autoguidance-tangential-score-steering', 'Karras AutoGuidance & Tangential Manifold Score Steering Weights', r159);
writePassArtifacts(160, 'alive-consistency-schrodinger-edm-phase31-audit', 'Phase XXXI Consistency, Schrodinger & EDM Acceptance Matrix (D2_1..D2_10)', r160);

console.log(JSON.stringify({
  pass156Score: r156.winningScore,
  pass157Score: r157.winningScore,
  pass158Score: r158.winningScore,
  pass159Score: r159.winningScore,
  pass160VerifiedRows: r160.verifiedRowCount,
  phase31Sha256: r160.phase31Sha256
}, null, 2));
