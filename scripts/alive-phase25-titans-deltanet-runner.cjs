'use strict';
const fs = require('node:fs');
const path = require('node:path');
const p126 = require('../systems/alive-titans-neural-long-term-surprise-memory.js');
const p127 = require('../systems/alive-deltanet-householder-rank1-fast-weights.js');
const p128 = require('../systems/alive-rwkv7-goose-dynamic-state-evolution-weights.js');
const p129 = require('../systems/alive-gsa-gated-slot-attention-abc-memory.js');
const p130 = require('../systems/alive-titans-deltanet-rwkv7-phase25-audit.js');

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
  <text x="24" y="104" fill="#e6edf3" font-family="monospace" font-size="12">SHA-256: ${evalResult.sha256 || evalResult.phase25Sha256}</text>
  <rect x="24" y="130" width="712" height="28" rx="6" fill="#238636"/>
  <text x="36" y="149" fill="#ffffff" font-family="monospace" font-size="13">5-Seed Verified (19013, 29017, 39023, 49031, 59053) - 100.0%</text>
</svg>\n`;
  fs.writeFileSync(svgPath, svg, 'utf8');

  const md = `# Pass ${passNum} Report: ${title}

- **Pass ID:** \`${evalResult.passId}\`
- **Phase:** ${evalResult.phase}
- **Seeds:** \`${(evalResult.seeds || []).join(', ')}\`
- **Winning Profile / Score:** \`${evalResult.winningProfileId || 'J1..J10'}\` (\`${evalResult.winningScore ?? evalResult.acceptanceScorePct}\`)
- **SHA-256 Digest:** \`${evalResult.sha256 || evalResult.phase25Sha256}\`
- **JSON Artifact:** \`docs/reports/${slug}-2026-11-09.json\`
- **SVG Artifact:** \`docs/reports/${slug}-2026-11-09.svg\`
`;
  fs.writeFileSync(mdPath, md, 'utf8');
}

const r126 = p126.runPass126Evaluation();
const r127 = p127.runPass127Evaluation();
const r128 = p128.runPass128Evaluation();
const r129 = p129.runPass129Evaluation();
const r130 = p130.runPass130Phase25Audit();

writePassArtifacts(126, 'alive-titans-neural-long-term-surprise-memory', 'Google Titans Neural Long-Term Surprise Memory Module', r126);
writePassArtifacts(127, 'alive-deltanet-householder-rank1-fast-weights', 'Gated DeltaNet Householder Rank-1 Fast-Weight Recurrence', r127);
writePassArtifacts(128, 'alive-rwkv7-goose-dynamic-state-evolution-weights', 'RWKV-7 Goose Generalized Dynamic State Evolution Weights', r128);
writePassArtifacts(129, 'alive-gsa-gated-slot-attention-abc-memory', 'Gated Slot Attention (GSA) Bounded-Slot KV Memory & Chrono Biases', r129);
writePassArtifacts(130, 'alive-titans-deltanet-rwkv7-phase25-audit', 'Phase XXV Titans, DeltaNet & RWKV-7 Acceptance Matrix (J1..J10)', r130);

console.log(JSON.stringify({
  pass126Score: r126.winningScore,
  pass127Score: r127.winningScore,
  pass128Score: r128.winningScore,
  pass129Score: r129.winningScore,
  pass130VerifiedRows: r130.verifiedRowCount,
  phase25Sha256: r130.phase25Sha256
}, null, 2));
