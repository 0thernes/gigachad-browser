const { spawnSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const smokeEnv = { ...process.env, GIGACHAD_TEST_MODE: '1' };
for (const key of ['ELECTRON_RUN_AS_NODE', 'OPENROUTER_API_KEY', 'ELEVENLABS_API_KEY', 'GIGACHAD_LLM_API_KEY', 'GIGACHAD_EMBED_MODEL', 'GIGACHAD_NER_MODEL']) delete smokeEnv[key];

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, env: smokeEnv, windowsHide: true, encoding: 'utf8', timeout: 60000 });
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
  const venvWin = path.join(root, '.venv', 'Scripts', 'python.exe');
  const venvPosix = path.join(root, '.venv', 'bin', 'python');
  const localAppData = smokeEnv.LOCALAPPDATA || (smokeEnv.USERPROFILE ? path.join(smokeEnv.USERPROFILE, 'AppData', 'Local') : '');
  const winInstalls = process.platform === 'win32' && localAppData
    ? ['Python313', 'Python312', 'Python311'].map((name) => path.join(localAppData, 'Programs', 'Python', name, 'python.exe'))
    : [];
  for (const cmd of [process.env.GIGACHAD_PYTHON, venvWin, venvPosix, 'python3', 'python', 'py', ...winInstalls]) {
    if (!cmd) continue;
    const probe = spawnSync(cmd, ['-I', '-S', '-c', 'import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)'], { env: smokeEnv, windowsHide: true, encoding: 'utf8', timeout: 8000 });
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
for (const name of ['alive-page-exploration', 'alive-habitat', 'alive-overdrive-runtime', 'alive-overdrive-adapters', 'alive-autosave', 'alive-genome-codec', 'alive-genome-persistence', 'alive-checkpoints', 'alive-guest-execution', 'alive-authority', 'alive-neural-coupling', 'alive-specialist-fusion', 'alive-workspace-ui', 'alife-learning-evidence']) {
  run(process.execPath, ['--check', `systems/${name}.js`]);
}
for (const name of ['alive-genome-store', 'alive-genome-ipc', 'alive-genome-migration']) run(process.execPath, ['--check', `systems/${name}.cjs`]);
for (const name of ['alive-primary-policy-state', 'alive-primary-policy-bootstrap', 'alive-trainer-state', 'alive-replay-state', 'alive-hub-state', 'alive-cortex-state', 'alive-startup-loader', 'alive-asset-hydration']) run(process.execPath, ['--check', `systems/${name}.js`]);
run(process.execPath, ['--test', 'tests/alive-primary-policy-state.test.cjs', 'tests/alive-primary-policy-bootstrap.test.cjs', 'tests/alive-startup-loader.test.cjs', 'tests/alive-boot-cancellation.test.cjs']);
run(process.execPath, ['scripts/alive-startup-loader-electron-probe.cjs', '--self-test']);
run(process.execPath, ['--test', 'tests/alive-asset-hydration.test.cjs', 'tests/alive-asset-hydration-integration.test.cjs', 'tests/alive-asset-source-receipts.test.cjs', 'tests/authentic-prepared-state.test.cjs']);
run(process.execPath, ['--test', 'tests/alive-fixed-arenas.test.cjs', 'tests/alive-worker-trainer.test.cjs', 'tests/alive-worker-lifecycle.test.cjs']);
run(process.execPath, ['--test', 'tests/alive-trainer-committed-state.test.cjs', 'tests/alive-trainer-state.test.cjs', 'tests/alive-trainer-state-evidence.test.cjs']);
run(process.execPath, ['--test', 'tests/alive-replay-state.test.cjs', 'tests/alive-replay-continuation.test.cjs', 'tests/alive-replay-integration.test.cjs']);
run(process.execPath, ['--test', 'tests/alive-hub-state.test.cjs', 'tests/alive-hub-continuation.test.cjs', 'tests/alive-hub-integration.test.cjs', 'tests/alive-hub-disk-fence.test.cjs']);
run(process.execPath, ['--test', 'scripts/alive-hub-state-evidence.test.cjs']);
run(process.execPath, ['--test', 'tests/alive-cortex-state.test.cjs', 'tests/alive-cortex-continuation.test.cjs', 'tests/alive-cortex-integration.test.cjs', 'tests/alive-cortex-attention-boundary.test.cjs', 'tests/alive-tensor-coverage.test.cjs']);
run(process.execPath, ['--test', 'scripts/alive-cortex-state-evidence.test.cjs']);
run(process.execPath, ['--test', 'scripts/alive-replay-state-evidence.test.cjs', 'scripts/alive-genome-hydration-evidence.test.cjs', 'scripts/alive-persistence-restart-probe.test.cjs']);
run(process.execPath, ['--test', 'tests/alive-genome-migration.test.cjs', 'tests/alive-learned-state-codec.test.cjs', 'tests/alive-learned-state-registry.test.cjs', 'tests/alive-learned-state-integration.test.cjs']);
run(process.execPath, ['--test', 'tests/alive-reasoning-evidence.test.cjs', 'tests/alive-inspector-evidence.test.cjs', 'tests/alive-page-exploration.test.cjs', 'tests/alive-habitat.test.cjs', 'tests/alive-overdrive-runtime.test.cjs', 'tests/alive-overdrive-adapters.test.cjs', 'tests/alive-action-routing.test.cjs', 'tests/alive-host-offspring.test.cjs', 'tests/alive-pellet-bounds.test.cjs', 'tests/alive-page-lifecycle.test.cjs', 'tests/alive-viewport-geometry.test.cjs', 'tests/alive-autosave.test.cjs', 'tests/alive-genome-codec.test.cjs', 'tests/alive-genome-store.test.cjs', 'tests/alive-genome-ipc.test.cjs', 'tests/alive-genome-persistence.test.cjs', 'tests/alive-genome-bootstrap.test.cjs', 'tests/alive-genome-payload.test.cjs', 'tests/alive-checkpoints.test.cjs', 'tests/alive-guest-execution.test.cjs', 'tests/alive-authority.test.cjs', 'tests/alive-authority-integration.test.cjs', 'tests/alive-neural-coupling.test.cjs', 'tests/alive-specialist-fusion.test.cjs', 'tests/alive-specialist-integration.test.cjs', 'tests/alife-learning-evidence.test.cjs']);
run(process.execPath, ['--check', 'systems/cortex-neural-cyber-engine.js']);
run(process.execPath, ['--check', 'systems/ported-multiverse-brains.js']);
run(process.execPath, ['--check', 'systems/alife-25-bleeding-edge-models.js']);
run(process.execPath, ['--check', 'systems/forensic-25-pass-10-iteration-auditor.js']);
run(process.execPath, ['--check', 'systems/erd-schema.js']);
run(process.execPath, ['--check', 'systems/erm-risk-engine.js']);
run(process.execPath, ['--check', 'systems/erp-resource-planner.js']);
run(process.execPath, ['--check', 'systems/sop-500-checklist.js']);
run(process.execPath, ['--check', 'systems/pass-100-verifier.js']);
run(process.execPath, ['--test', 'tests/alive-research-policy.test.cjs', 'tests/alive-research-planner.test.cjs', 'tests/deep-web-transport.test.cjs', 'tests/sha3-256.test.cjs', 'tests/alive-workspace-status.test.cjs', 'tests/alive-model-claims.test.cjs', 'tests/alive-tor-service.test.cjs', 'tests/backend-model-routing.test.cjs']);
run(process.execPath, ['scripts/smoke_config.js']);
run(process.execPath, ['scripts/smoke_actions.js']);
run(process.execPath, ['scripts/smoke_browser.js']);
run(process.execPath, ['scripts/smoke_privacy.js']);
run(process.execPath, ['scripts/smoke_systems.js']);
run(process.execPath, ['scripts/smoke_master_audit.js']);
run(process.execPath, ['scripts/smoke_100_passes.js']);

const python = pythonCommand();
run(python, ['-I', '-S', '-c', 'from pathlib import Path; [compile(Path(name).read_text(encoding="utf-8-sig"), name, "exec") for name in ("laya_sidecar.py", "laya_router.py")]']);
run(python, ['-I', '-S', 'scripts/smoke_sidecar.py']);
run(python, ['-I', '-S', 'tests/test_sidecar_backend_truth.py']);

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

run(electronPath, ['scripts/check_sha3_electron.cjs']);

const electron = spawnSync(electronPath, ['.', '--smoke'], {
  cwd: root,
  encoding: 'utf8',
  timeout: 45000,
  env: { ...smokeEnv, GIGACHAD_SMOKE: '1' },
  windowsHide: true
});
const electronOut = `${electron.stdout || ''}${electron.stderr || ''}`;
process.stdout.write(electronOut);
if (electron.status !== 0 || !electronOut.includes('SMOKE_OK')) {
  console.error('Electron smoke failed');
  process.exit(electron.status || 1);
}
console.log('smoke passed');
