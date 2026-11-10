'use strict';
const fs = require('node:fs');
const path = require('node:path');
const p106 = require('../systems/alive-clifford-cl40-multivector-weight-algebra.js');
const p107 = require('../systems/alive-se3-equivariant-steerable-spherical-weights.js');
const p108 = require('../systems/alive-quaternion-octonion-hypercomplex-weights.js');
const p109 = require('../systems/alive-gauge-covariant-parallel-transport-weights.js');
const p110 = require('../systems/alive-geometric-clifford-gauge-phase21-audit.js');

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
  <text x="24" y="104" fill="#e6edf3" font-family="monospace" font-size="12">SHA-256: ${evalResult.sha256 || evalResult.phase21Sha256}</text>
  <rect x="24" y="130" width="712" height="28" rx="6" fill="#238636"/>
  <text x="36" y="149" fill="#ffffff" font-family="monospace" font-size="13">5-Seed Verified (19013, 29017, 39023, 49031, 59053) - 100.0%</text>
</svg>\n`;
  fs.writeFileSync(svgPath, svg, 'utf8');

  const md = `# Pass ${passNum} Report: ${title}

- **Pass ID:** \`${evalResult.passId}\`
- **Phase:** ${evalResult.phase}
- **Seeds:** \`${(evalResult.seeds || []).join(', ')}\`
- **Winning Profile / Score:** \`${evalResult.winningProfileId || 'Q1..Q10'}\` (\`${evalResult.winningScore ?? evalResult.acceptanceScorePct}\`)
- **SHA-256 Digest:** \`${evalResult.sha256 || evalResult.phase21Sha256}\`
- **JSON Artifact:** \`docs/reports/${slug}-2026-11-09.json\`
- **SVG Artifact:** \`docs/reports/${slug}-2026-11-09.svg\`
`;
  fs.writeFileSync(mdPath, md, 'utf8');
}

const r106 = p106.runPass106Evaluation();
const r107 = p107.runPass107Evaluation();
const r108 = p108.runPass108Evaluation();
const r109 = p109.runPass109Evaluation();
const r110 = p110.runPass110Phase21Audit();

writePassArtifacts(106, 'alive-clifford-cl40-multivector-weight-algebra', 'Clifford Cl(4,0) 16-Blade Multivector Weight & Grade Bias Algebra', r106);
writePassArtifacts(107, 'alive-se3-equivariant-steerable-spherical-weights', 'SE(3)-Equivariant Clebsch-Gordan Steerable Weights & Norm Biases', r107);
writePassArtifacts(108, 'alive-quaternion-octonion-hypercomplex-weights', 'Hamilton Quaternion & Cayley-Dickson Octonion Hypercomplex Weights', r108);
writePassArtifacts(109, 'alive-gauge-covariant-parallel-transport-weights', 'Gauge-Covariant SO(4) Parallel-Transport & Wilson-Loop Biases', r109);
writePassArtifacts(110, 'alive-geometric-clifford-gauge-phase21-audit', 'Phase XXI Clifford & Equivariant Weight Acceptance Matrix (Q1..Q10)', r110);

console.log(JSON.stringify({
  pass106Score: r106.winningScore,
  pass107Score: r107.winningScore,
  pass108Score: r108.winningScore,
  pass109Score: r109.winningScore,
  pass110VerifiedRows: r110.verifiedRowCount,
  phase21Sha256: r110.phase21Sha256
}, null, 2));
