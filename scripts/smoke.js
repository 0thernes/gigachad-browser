const { spawnSync } = require('child_process');
const path = require('path');
const { loadConfig } = require('../config');

const root = path.join(__dirname, '..');

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', timeout: 60000 });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  if (result.error) {
    console.error(output);
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(output);
    process.exit(result.status || 1);
  }
  if (output.trim()) process.stdout.write(output.endsWith('\n') ? output : output + '\n');
  return output;
}

function pythonCommand() {
  const cfg = loadConfig({ root });
  const venvWin = path.join(root, '.venv', 'Scripts', 'python.exe');
  const venvPosix = path.join(root, '.venv', 'bin', 'python');
  for (const cmd of [process.env.GIGACHAD_PYTHON, venvWin, venvPosix, cfg.pythonPath, 'python3', 'python', 'py']) {
    if (!cmd) continue;
    const probe = spawnSync(cmd, ['-c', 'import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)'], { encoding: 'utf8' });
    if (probe.status === 0) return cmd;
  }
  console.error('Python 3.11+ is required for the sidecar smoke test.');
  process.exit(1);
}

run(process.execPath, ['--check', 'main.js']);
run(process.execPath, ['--check', 'preload.js']);
run(process.execPath, ['--check', 'config.js']);
run(process.execPath, ['--check', 'blocklist.js']);
run(process.execPath, ['--check', 'browser-data.js']);
run(process.execPath, ['--check', 'agent-actions.js']);
run(process.execPath, ['--check', 'alife_neural_cyber_engine.js']);
run(process.execPath, ['--check', 'systems/cortex-neural-cyber-engine.js']);
run(process.execPath, ['--check', 'systems/ported-multiverse-brains.js']);
run(process.execPath, ['--check', 'systems/alife-25-bleeding-edge-models.js']);
run(process.execPath, ['--check', 'systems/forensic-25-pass-10-iteration-auditor.js']);
run(process.execPath, ['--check', 'systems/erd-schema.js']);
run(process.execPath, ['--check', 'systems/erm-risk-engine.js']);
run(process.execPath, ['--check', 'systems/erp-resource-planner.js']);
run(process.execPath, ['--check', 'systems/sop-500-checklist.js']);
run(process.execPath, ['--check', 'systems/pass-100-verifier.js']);
run(process.execPath, ['scripts/smoke_config.js']);
run(process.execPath, ['scripts/smoke_actions.js']);
run(process.execPath, ['scripts/smoke_browser.js']);
run(process.execPath, ['scripts/smoke_systems.js']);
run(process.execPath, ['scripts/smoke_master_audit.js']);
run(process.execPath, ['scripts/smoke_100_passes.js']);

const python = pythonCommand();
run(python, ['-m', 'py_compile', 'laya_sidecar.py', 'laya_router.py']);
run(python, ['scripts/smoke_sidecar.py']);

if (process.env.GIGACHAD_SKIP_ELECTRON === '1') {
  console.log('electron smoke skipped');
  process.exit(0);
}

let electronPath;
try {
  electronPath = require('electron');
} catch (err) {
  console.error('electron is not installed. Run npm install before the Electron smoke test.');
  process.exit(1);
}
if (typeof electronPath !== 'string') {
  console.error('scripts/smoke.js must be run with node, not the electron binary.');
  process.exit(1);
}

const electron = spawnSync(electronPath, ['.', '--smoke'], {
  cwd: root,
  encoding: 'utf8',
  timeout: 45000,
  env: { ...process.env, GIGACHAD_SMOKE: '1' }
});
const electronOut = `${electron.stdout || ''}${electron.stderr || ''}`;
process.stdout.write(electronOut);
if (electron.status !== 0 || !electronOut.includes('SMOKE_OK')) {
  console.error('Electron smoke failed');
  process.exit(electron.status || 1);
}
console.log('smoke passed');
