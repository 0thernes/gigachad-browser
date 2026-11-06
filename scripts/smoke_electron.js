'use strict';

/**
 * Standalone Electron Live Smoke Runner (`node scripts/smoke_electron.js`)
 * Launches Electron with `--smoke` and verifies `SMOKE_OK` JSON output.
 */

const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const electronBin = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const res = spawnSync(electronBin, ['.', '--smoke'], {
  cwd: root,
  env,
  encoding: 'utf8',
  timeout: 45000
});

const out = `${res.stdout || ''}\n${res.stderr || ''}`;
console.log(out.trim());

if (res.status !== 0 || !out.includes('SMOKE_OK')) {
  process.exit(1);
}
