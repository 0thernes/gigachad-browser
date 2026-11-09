'use strict';

// Discover the repository's Node test suites without shell glob expansion.
// Tests must remain inert on import: runtime/Electron launchers are separate
// scripts and must never be named *.test.cjs. The SSM parity suite also requires
// Python 3.11+ for its small independent numerical reference.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');

function discover(root = ROOT) {
  const files = [];
  for (const directory of ['tests', 'scripts']) {
    for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      if (!entry.name.endsWith('.test.cjs')) continue;
      if (!entry.isFile()) throw new Error('Test suite must be a regular file: ' + directory + '/' + entry.name);
      files.push(directory + '/' + entry.name);
    }
  }
  if (!files.length) throw new Error('No Node test suites were discovered');
  return files.sort();
}

function options(argv) {
  const result = { list: false, concurrency: 2, reporter: 'spec' }, seen = new Set();
  for (const arg of argv) {
    const match = /^(--list)$|^--(concurrency|reporter)=(.+)$/.exec(arg);
    if (!match) throw new Error('Expected [--list] [--concurrency=1..16] [--reporter=spec|tap|dot]');
    const key = match[1] ? 'list' : match[2];
    if (seen.has(key)) throw new Error('Duplicate option: ' + key);
    seen.add(key);
    if (key === 'list') result.list = true;
    else if (key === 'concurrency') {
      if (!/^(?:[1-9]|1[0-6])$/.test(match[3])) throw new Error('Test concurrency must be 1..16');
      result.concurrency = Number(match[3]);
    } else {
      if (!['spec', 'tap', 'dot'].includes(match[3])) throw new Error('Unsupported test reporter');
      result.reporter = match[3];
    }
  }
  return result;
}

function main(argv = process.argv.slice(2)) {
  if (process.versions.electron) throw new Error('Run the test discovery script with Node, not Electron');
  const selected = options(argv), files = discover();
  if (selected.list) { console.log(files.join('\n')); return 0; }
  console.log(`Running ${files.length} Node test suites (concurrency ${selected.concurrency}); no runtime probe launchers selected.`);
  const env = { ...process.env, GIGACHAD_TEST_MODE: '1' };
  delete env.ELECTRON_RUN_AS_NODE;
  const result = spawnSync(process.execPath, ['--test', '--test-concurrency=' + selected.concurrency,
    '--test-reporter=' + selected.reporter, ...files], { cwd: ROOT, env, stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.signal) { console.error('Node tests terminated by signal ' + result.signal); return 1; }
  return result.status ?? 1;
}

module.exports = { discover, options, main };
if (require.main === module) {
  try { process.exitCode = main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
