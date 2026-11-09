'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const benchmark = require('../systems/alive-learning-five-seed.js');
const ROOT = path.resolve(__dirname, '..');

async function main(argv = process.argv.slice(2)) {
  if (argv.length > 1 || argv[0] && !argv[0].startsWith('--output=')) throw new Error('Usage: node scripts/alive-learning-five-seed.cjs [--output=report.json]');
  const report = await benchmark.run({ crypto: crypto.webcrypto });
  const sourceFiles = ['systems/alife-learning-evidence.js', 'systems/alive-learning-five-seed.js', 'scripts/alive-learning-five-seed.cjs'];
  report.provenance = { generatedAtUtc: new Date().toISOString(), node: process.version, platform: process.platform,
    architecture: process.arch, cpu: os.cpus()[0]?.model || 'unknown',
    sourceFiles: Object.fromEntries(sourceFiles.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex')])) };
  try { report.provenance.baseGitCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8', windowsHide: true }).trim(); }
  catch (_) { report.provenance.baseGitCommit = null; }
  report.provenance.sourceState = 'Source hashes identify the measured working files; baseGitCommit is context, not a claim that these edits were already committed';
  const encoded = JSON.stringify(report, null, 2) + '\n';
  if (argv[0]) {
    const output = path.resolve(argv[0].slice('--output='.length));
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, encoded);
    console.log(JSON.stringify({ output, status: report.status, summary: report.summary, releaseQualified: false }, null, 2));
  } else process.stdout.write(encoded);
  return report.status === 'completed' ? 0 : 1;
}
module.exports = { main };
if (require.main === module) main().then(code => { process.exitCode = code; }, error => { console.error(error.message); process.exitCode = 1; });
