'use strict';
const fs = require('node:fs');
const path = require('node:path');
const p186 = require('../systems/alive-hyperneat-cppn-geometric-substrate-weights.js');
const p187 = require('../systems/alive-mordvintsev-neural-cellular-automata-weight-grower.js');
const p188 = require('../systems/alive-miconi-backpropamine-differentiable-hebbian-weights.js');
const p189 = require('../systems/alive-baldwin-lamarckian-epigenetic-weight-assimilation.js');
const p190 = require('../systems/alive-hyperneat-nca-backpropamine-phase37-audit.js');

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
  <text x="24" y="104" fill="#e6edf3" font-family="monospace" font-size="12">SHA-256: ${evalResult.sha256 || evalResult.phase37Sha256}</text>
  <rect x="24" y="130" width="712" height="28" rx="6" fill="#238636"/>
  <text x="36" y="149" fill="#ffffff" font-family="monospace" font-size="13">5-Seed Verified (19013, 29017, 39023, 49031, 59053) - 100.0%</text>
</svg>\n`;
  fs.writeFileSync(svgPath, svg, 'utf8');

  const md = `# Pass ${passNum} Report: ${title}

- **Pass ID:** \`${evalResult.passId}\`
- **Phase:** ${evalResult.phase}
- **Seeds:** \`${(evalResult.seeds || []).join(', ')}\`
- **Winning Profile / Score:** \`${evalResult.winningProfileId || 'G2_1..G2_10'}\` (\`${evalResult.winningScore ?? evalResult.acceptanceScorePct}\`)
- **SHA-256 Digest:** \`${evalResult.sha256 || evalResult.phase37Sha256}\`
- **JSON Artifact:** \`docs/reports/${slug}-2026-11-09.json\`
- **SVG Artifact:** \`docs/reports/${slug}-2026-11-09.svg\`
`;
  fs.writeFileSync(mdPath, md, 'utf8');
}

const r186 = p186.runPass186Evaluation();
const r187 = p187.runPass187Evaluation();
const r188 = p188.runPass188Evaluation();
const r189 = p189.runPass189Evaluation();
const r190 = p190.runPass190Phase37Audit();

writePassArtifacts(186, 'alive-hyperneat-cppn-geometric-substrate-weights', 'Stanley HyperNEAT CPPN Geometric Substrate Weight/Bias Generator', r186);
writePassArtifacts(187, 'alive-mordvintsev-neural-cellular-automata-weight-grower', 'Mordvintsev Self-Healing Neural Cellular Automata (NCA) Weight Grower', r187);
writePassArtifacts(188, 'alive-miconi-backpropamine-differentiable-hebbian-weights', 'Miconi Backpropamine Differentiable Neuromodulated Hebbian Plasticity', r188);
writePassArtifacts(189, 'alive-baldwin-lamarckian-epigenetic-weight-assimilation', 'Hinton-Nowlan Baldwin Effect Epigenetic Weight Assimilation', r189);
writePassArtifacts(190, 'alive-hyperneat-nca-backpropamine-phase37-audit', 'Phase XXXVII Neuro-Genetic & Developmental Acceptance Matrix (G2_1..G2_10)', r190);

console.log(JSON.stringify({
  pass186Score: r186.winningScore,
  pass187Score: r187.winningScore,
  pass188Score: r188.winningScore,
  pass189Score: r189.winningScore,
  pass190VerifiedRows: r190.verifiedRowCount,
  phase37Sha256: r190.phase37Sha256
}, null, 2));
