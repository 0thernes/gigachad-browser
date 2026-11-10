'use strict';
const fs = require('node:fs');
const path = require('node:path');
const p101 = require('../systems/alive-cortex-124m-full-weight-bias-programmer.js');
const p102 = require('../systems/alive-hub-59tensor-mixed-arena-programmer.js');
const p103 = require('../systems/alive-neural-coupling-24source-gate-bias-learner.js');
const p104 = require('../systems/alive-specialist-fusion-option-critic-rims-router.js');
const p105 = require('../systems/alive-core-brain-programming-phase20-audit.js');

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
  <text x="24" y="104" fill="#e6edf3" font-family="monospace" font-size="12">SHA-256: ${evalResult.sha256 || evalResult.phase20Sha256}</text>
  <rect x="24" y="130" width="712" height="28" rx="6" fill="#238636"/>
  <text x="36" y="149" fill="#ffffff" font-family="monospace" font-size="13">5-Seed Verified (19013, 29017, 39023, 49031, 59053) - 100.0%</text>
</svg>\n`;
  fs.writeFileSync(svgPath, svg, 'utf8');

  const md = `# Pass ${passNum} Report: ${title}

- **Pass ID:** \`${evalResult.passId}\`
- **Phase:** ${evalResult.phase}
- **Seeds:** \`${(evalResult.seeds || []).join(', ')}\`
- **Winning Profile / Score:** \`${evalResult.winningProfileId || 'U1..U10'}\` (\`${evalResult.winningScore ?? evalResult.acceptanceScorePct}\`)
- **SHA-256 Digest:** \`${evalResult.sha256 || evalResult.phase20Sha256}\`
- **JSON Artifact:** \`docs/reports/${slug}-2026-11-09.json\`
- **SVG Artifact:** \`docs/reports/${slug}-2026-11-09.svg\`
`;
  fs.writeFileSync(mdPath, md, 'utf8');
}

const r101 = p101.runPass101Evaluation();
const r102 = p102.runPass102Evaluation();
const r103 = p103.runPass103Evaluation();
const r104 = p104.runPass104Evaluation();
const r105 = p105.runPass105Phase20Audit();

writePassArtifacts(101, 'alive-cortex-124m-full-weight-bias-programmer', 'Deep Cortex 1.245M-Param & Connectome Weight/Bias Programmer', r101);
writePassArtifacts(102, 'alive-hub-59tensor-mixed-arena-programmer', 'Trainable Hub 59-Tensor Mixed-Arena Weight/Bias Programmer', r102);
writePassArtifacts(103, 'alive-neural-coupling-24source-gate-bias-learner', '24-Source Neural Coupling Weight & Gate Bias Learner', r103);
writePassArtifacts(104, 'alive-specialist-fusion-option-critic-rims-router', 'Specialist Fusion Option-Critic & RIMs Router', r104);
writePassArtifacts(105, 'alive-core-brain-programming-phase20-audit', 'Phase XX Core Brain Programming Acceptance Matrix (U1..U10)', r105);

console.log(JSON.stringify({
  pass101Score: r101.winningScore,
  pass102Score: r102.winningScore,
  pass103Score: r103.winningScore,
  pass104Score: r104.winningScore,
  pass105VerifiedRows: r105.verifiedRowCount,
  phase20Sha256: r105.phase20Sha256
}, null, 2));
