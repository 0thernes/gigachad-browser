'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const benchmark = require('../systems/alive-unseen-task-benchmark.js');

const ROOT = path.resolve(__dirname, '..');

function renderSvg(report) {
  const s = report.summary;
  const modes = ['heuristic', 'frozen', 'learning', 'fabric-coupled'];
  const colors = {
    heuristic: '#64748b',
    frozen: '#f59e0b',
    learning: '#22d3ee',
    'fabric-coupled': '#34d399'
  };
  const width = 920, height = 420;
  const minR = -8, maxR = 16, barLeft = 170, barWidth = 340;
  const xOf = v => barLeft + Math.max(0, Math.min(1, (v - minR) / (maxR - minR))) * barWidth;
  const zeroX = xOf(0);

  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#05090f;font-family:Consolas,monospace;font-size:12px">`,
    `  <rect width="${width}" height="${height}" fill="#05090f"/>`,
    `  <text x="20" y="28" fill="#67e8f9" font-weight="700" font-size="14">PASS 2 · Unseen Research &amp; Navigation Task Benchmark (5 Seeds, Matched Budget)</text>`,
    `  <text x="20" y="48" fill="#94a3b8" font-size="11">Seeds: ${report.protocol.seeds.join(', ')} · 3 unseen holdout tasks × 8 steps · Two-sided Student-t 95% CI (df=4)</text>`,
    `  <line x1="${zeroX.toFixed(1)}" y1="70" x2="${zeroX.toFixed(1)}" y2="250" stroke="#334155" stroke-dasharray="3,3"/>`
  ];

  modes.forEach((mode, idx) => {
    const entry = s.byController[mode];
    const y = 80 + idx * 44;
    const mean = entry.unseenHoldoutReward.mean;
    const [lo, hi] = entry.unseenHoldoutReward.ci95;
    const xMean = xOf(mean), xLo = xOf(lo), xHi = xOf(hi);
    const rx = Math.min(zeroX, xMean), rw = Math.max(2, Math.abs(xMean - zeroX));
    const recall = (entry.unseenTargetRecall.mean * 100).toFixed(1);
    const avoid = (entry.unseenTrapAvoidance.mean * 100).toFixed(1);
    const mse = entry.heldOutMSE.mean.toFixed(4);

    lines.push(
      `  <text x="158" y="${y + 15}" fill="#e2e8f0" text-anchor="end">${mode}</text>`,
      `  <rect x="${barLeft}" y="${y}" width="${barWidth}" height="22" fill="#0f1b26" rx="3"/>`,
      `  <rect x="${rx.toFixed(1)}" y="${y + 3}" width="${rw.toFixed(1)}" height="16" fill="${colors[mode]}" rx="2"/>`,
      `  <line x1="${xLo.toFixed(1)}" y1="${y + 11}" x2="${xHi.toFixed(1)}" y2="${y + 11}" stroke="#f8fafc" stroke-width="1.5"/>`,
      `  <line x1="${xLo.toFixed(1)}" y1="${y + 6}" x2="${xLo.toFixed(1)}" y2="${y + 16}" stroke="#f8fafc" stroke-width="1.5"/>`,
      `  <line x1="${xHi.toFixed(1)}" y1="${y + 6}" x2="${xHi.toFixed(1)}" y2="${y + 16}" stroke="#f8fafc" stroke-width="1.5"/>`,
      `  <text x="${barLeft + barWidth + 14}" y="${y + 15}" fill="#cbd5e1" font-size="11">reward ${mean.toFixed(2)} [${lo.toFixed(2)}, ${hi.toFixed(2)}] · recall ${recall}% · avoid ${avoid}% · MSE ${mse}</text>`
    );
  });

  // Paired delta summary box
  const dLearn = s.pairedDeltas.learningVsFrozenReward;
  const dFab = s.pairedDeltas.fabricVsLearningReward;
  const dRec = s.pairedDeltas.learningVsFrozenRecall;
  const dRet = s.pairedDeltas.retentionVsFrozenDelta;
  lines.push(
    `  <rect x="20" y="272" width="880" height="126" fill="#09131c" stroke="#155e75" rx="6"/>`,
    `  <text x="36" y="296" fill="#67e8f9" font-weight="700">Paired Multi-Seed Comparisons (Unseen Holdout &amp; Retention Suites)</text>`,
    `  <text x="36" y="320" fill="#e2e8f0">1. Learning vs Frozen Holdout Reward Δ: +${dLearn.mean.toFixed(3)} (95% CI [+${dLearn.ci95[0].toFixed(3)}, +${dLearn.ci95[1].toFixed(3)}], ${s.learningBeatFrozenSeeds}/5 seeds)</text>`,
    `  <text x="36" y="340" fill="#e2e8f0">2. Fabric-Coupled vs Learning Holdout Reward Δ: +${dFab.mean.toFixed(3)} (95% CI [+${dFab.ci95[0].toFixed(3)}, +${dFab.ci95[1].toFixed(3)}], ${s.fabricBeatLearningSeeds}/5 seeds)</text>`,
    `  <text x="36" y="360" fill="#e2e8f0">3. Learning vs Frozen Target Concept Recall Δ: +${(dRec.mean * 100).toFixed(1)}% (95% CI [+${(dRec.ci95[0] * 100).toFixed(1)}%, +${(dRec.ci95[1] * 100).toFixed(1)}%]) · Retention Reward Δ: +${dRet.mean.toFixed(3)}</text>`,
    `  <text x="36" y="382" fill="#64748b" font-size="10">Scope: Measured on production AliveResearchPolicy (16x12x1 tanh ranker) + AliveCognitiveFaculties (3-role Ghost Swarm) + AliveSynapticFabric.</text>`,
    `</svg>\n`
  );
  return lines.join('\n');
}

async function main(argv = process.argv.slice(2)) {
  let outputJson = null, outputSvg = null;
  for (const arg of argv) {
    if (arg.startsWith('--output=')) outputJson = path.resolve(arg.slice('--output='.length));
    else if (arg.startsWith('--svg=')) outputSvg = path.resolve(arg.slice('--svg='.length));
    else throw new Error('Usage: node scripts/alive-unseen-task-benchmark.cjs [--output=report.json] [--svg=report.svg]');
  }

  const report = await benchmark.run({ crypto: crypto.webcrypto });
  const sourceFiles = [
    'systems/alive-research-policy.js',
    'systems/alive-cognitive-faculties.js',
    'systems/alive-synaptic-fabric.js',
    'systems/alive-unseen-task-benchmark.js',
    'scripts/alive-unseen-task-benchmark.cjs'
  ];
  report.provenance = {
    generatedAtUtc: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    cpu: os.cpus()[0]?.model || 'unknown',
    sourceFiles: Object.fromEntries(
      sourceFiles.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex')])
    )
  };
  try {
    report.provenance.baseGitCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8', windowsHide: true }).trim();
  } catch (_) {
    report.provenance.baseGitCommit = null;
  }
  report.provenance.sourceState = 'Source hashes identify the measured working files; baseGitCommit is context, not a claim that these edits were already committed';

  const encoded = JSON.stringify(report, null, 2) + '\n';
  if (outputJson) {
    fs.mkdirSync(path.dirname(outputJson), { recursive: true });
    fs.writeFileSync(outputJson, encoded);
  }
  if (outputSvg) {
    fs.mkdirSync(path.dirname(outputSvg), { recursive: true });
    fs.writeFileSync(outputSvg, renderSvg(report));
  }
  if (outputJson || outputSvg) {
    console.log(JSON.stringify({ outputJson, outputSvg, status: report.status, summary: report.summary }, null, 2));
  } else {
    process.stdout.write(encoded);
  }
  return report.status === 'completed' ? 0 : 1;
}

module.exports = { main, renderSvg };
if (require.main === module) {
  main().then(code => { process.exitCode = code; }, error => { console.error(error.message); process.exitCode = 1; });
}
