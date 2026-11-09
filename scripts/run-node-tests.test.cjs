'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { discover, options } = require('./run-node-tests.cjs');

test('discovery includes both suite directories in stable order and excludes runtime launchers and fixtures', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alive-test-discovery-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const directory of ['tests', 'scripts', 'tests/fixtures']) fs.mkdirSync(path.join(root, directory), { recursive: true });
  for (const relative of ['tests/z.test.cjs', 'tests/a name.test.cjs', 'scripts/evidence.test.cjs',
    'scripts/alive-overdrive-probe.cjs', 'tests/fixtures/nested.test.cjs', 'scripts/smoke.js']) fs.writeFileSync(path.join(root, relative), '');
  assert.deepEqual(discover(root), ['scripts/evidence.test.cjs', 'tests/a name.test.cjs', 'tests/z.test.cjs']);
  fs.mkdirSync(path.join(root, 'scripts', 'not-a-file.test.cjs'));
  assert.throws(() => discover(root), /regular file/);
});

test('runner options are bounded and cannot inject Node flags or paths', () => {
  assert.deepEqual(options([]), { list: false, concurrency: 2, reporter: 'spec' });
  assert.deepEqual(options(['--list', '--concurrency=4', '--reporter=dot']), { list: true, concurrency: 4, reporter: 'dot' });
  for (const args of [['--concurrency=0'], ['--concurrency=17'], ['--concurrency=1.5'], ['--reporter=./custom.cjs'],
    ['--list', '--list'], ['--concurrency=2', '--concurrency=4'], ['--require=launch.cjs'], ['other.test.cjs']]) assert.throws(() => options(args));
});

test('actual discovery retains newer persistence, startup, native and evidence suites', () => {
  const files = discover();
  for (const relative of ['tests/authentic-prepared-state.test.cjs', 'tests/alive-learned-state-codec.test.cjs',
    'tests/alive-primary-policy-bootstrap.test.cjs', 'tests/alive-startup-loader.test.cjs', 'tests/alive-asset-hydration.test.cjs',
    'scripts/alive-primary-policy-evidence.test.cjs', 'scripts/alive-learned-state-wire-evidence.test.cjs']) assert.ok(files.includes(relative), relative);
  assert.equal(new Set(files).size, files.length);
  assert.ok(files.every(file => /^(?:tests|scripts)\/[^/]+\.test\.cjs$/.test(file)));
});
