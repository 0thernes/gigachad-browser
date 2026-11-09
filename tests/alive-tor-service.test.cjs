'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const path = require('node:path');
const { createTorService } = require('../systems/alive-tor-service.cjs');

const config = { torPath: path.resolve('fixture', 'tor.exe'), dataDirectory: path.resolve('fixture', 'isolated-data'), socksPort: 19050 };
function harness(options = {}) {
  const calls = [], timers = new Map(), events = [], files = new Map();
  let nextTimer = 0, clock = 1000;
  const makeChild = () => {
    const child = new EventEmitter();
    child.pid = 4000 + calls.length;
    child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.stdin = new EventEmitter();
    child.stdin.end = value => { child.input = value; };
    child.signals = []; child.kill = signal => { child.signals.push(signal); return true; };
    return child;
  };
  const service = createTorService({
    exists: () => true, now: () => clock,
    fs: {
      mkdirSync() {},
      writeFileSync(file, content, opts) { if (files.has(file) && opts.flag === 'wx') { const error = new Error('exists'); error.code = 'EEXIST'; throw error; } files.set(file, content); },
      readFileSync: file => files.get(file),
      statSync: file => ({ isFile: () => files.has(file), size: Buffer.byteLength(files.get(file) || '') })
    },
    spawn: (executable, args, opts) => { const child = makeChild(); calls.push({ executable, args, opts, child }); return child; },
    onStatus: state => events.push(state),
    setTimer: (fn, ms) => { const id = ++nextTimer; timers.set(id, { fn, ms }); return id; },
    clearTimer: id => timers.delete(id), ...options
  });
  return { service, calls, events, timers, files, now: value => { clock = value; },
    child: () => calls.at(-1)?.child,
    fire: ms => { const entry = [...timers].find(([, value]) => value.ms === ms); assert.ok(entry, `timer ${ms}`); timers.delete(entry[0]); entry[1].fn(); } };
}

test('missing, disabled, invalid or absent executable configuration never spawns or throws', () => {
  const h = harness();
  assert.equal(h.service.start().status, 'unavailable');
  assert.equal(h.service.start({ enabled: false }).status, 'disabled');
  assert.equal(h.service.start({ ...config, socksPort: 0 }).status, 'unavailable');
  assert.equal(h.service.start({ ...config, dataDirectory: 'relative/path' }).status, 'unavailable');
  assert.equal(h.calls.length, 0);
  const missing = harness({ exists: () => false });
  assert.equal(missing.service.start(config).status, 'unavailable');
  assert.equal(missing.calls.length, 0);
});

test('client starts hidden without a shell, reads isolated stdin config, and opens only localhost SOCKS', () => {
  const h = harness(); const status = h.service.start(config);
  assert.equal(status.status, 'starting'); assert.equal(status.owned, true); assert.equal(status.bootstrapped, false);
  const { executable, args, opts, child } = h.calls[0];
  const value = key => args[args.indexOf(key) + 1];
  assert.equal(executable, config.torPath);
  assert.equal(opts.windowsHide, true); assert.equal(opts.shell, false); assert.equal(opts.detached, false);
  assert.deepEqual(opts.stdio, ['pipe', 'pipe', 'pipe']);
  assert.equal(value('-f'), '-'); assert.match(child.input, /^# Isolated GIGACHAD/);
  const defaults = value('--defaults-torrc');
  assert.equal(path.dirname(defaults), config.dataDirectory);
  assert.equal(h.files.get(defaults), '# Managed GIGACHAD empty Tor defaults.\n');
  assert.equal(value('--ClientOnly'), '1'); assert.equal(value('--SocksPort'), '127.0.0.1:19050');
  assert.equal(value('--DataDirectory'), config.dataDirectory);
  for (const flag of ['--ORPort', '--DirPort', '--ControlPort', '--DNSPort', '--TransPort', '--HTTPTunnelPort']) assert.equal(value(flag), '0');
  assert.equal(value('--__OwningControllerProcess'), String(process.pid));
  assert.equal(value('--Log'), 'notice stdout');
  assert.equal(h.timers.size, 1);
});

test('only a complete Tor bootstrap notice marks readiness; fragmented messages are assembled', () => {
  const h = harness(); h.service.start(config);
  const child = h.child();
  child.stdout.emit('data', '[notice] Opening Socks listener on 127.0.0.1:19050\n');
  child.stdout.emit('data', '[warn] Failed request contains Bootstrapped 100%\n');
  assert.equal(h.service.status().bootstrapped, false);
  child.stdout.emit('data', '[notice] Bootstrapped 45% (requesting_descriptors): Downloading descriptors\n');
  assert.equal(h.service.status().bootstrapProgress, 45); assert.equal(h.service.status().status, 'bootstrapping');
  child.stdout.emit('data', '[notice] Bootstrap');
  child.stdout.emit('data', 'ped 100% (done): Done\n');
  assert.equal(h.service.status().status, 'ready'); assert.equal(h.service.status().bootstrapped, true);
  assert.equal(h.service.status().readyAt, 1000); assert.equal(h.timers.size, 0);
  assert.match(h.service.status().scope, /separate evidence/);
});

test('start is idempotent while a process or its shutdown remains owned', () => {
  const h = harness(); h.service.start(config); h.service.start(config);
  assert.equal(h.calls.length, 1);
  h.service.stop(); h.service.start(config);
  assert.equal(h.calls.length, 1); assert.equal(h.service.status().status, 'stopping');
  h.child().emit('close', 0, null);
  assert.equal(h.service.status().status, 'stopped'); assert.equal(h.service.status().owned, false);
  h.service.start(config); assert.equal(h.calls.length, 2);
});

test('bootstrap deadline kills only the owned handle and cannot claim a stopped process before close', () => {
  const h = harness(); h.service.start({ ...config, startupTimeoutMs: 2000 });
  h.fire(2000);
  assert.equal(h.service.status().status, 'timeout'); assert.equal(h.service.status().owned, true);
  assert.equal(h.service.status().bootstrapped, false); assert.deepEqual(h.child().signals, ['SIGTERM']);
  h.fire(5000); assert.deepEqual(h.child().signals, ['SIGTERM', 'SIGKILL']);
  h.child().emit('close', null, 'SIGKILL');
  assert.equal(h.service.status().owned, false); assert.equal(h.service.status().status, 'timeout');
  assert.equal(h.timers.size, 0);
});

test('stop never terminates unowned processes and a later old event cannot alter a new owner', () => {
  const h = harness(); h.service.stop(); assert.equal(h.calls.length, 0);
  h.service.start(config); const first = h.child(); h.service.stop(); first.emit('close', 0, null);
  h.service.start(config); const second = h.child();
  first.stdout.emit('data', '[notice] Bootstrapped 100% (done): Done\n');
  first.emit('error', new Error('stale')); first.emit('close', 1, null);
  assert.equal(h.service.status().pid, second.pid); assert.equal(h.service.status().status, 'starting');
  assert.equal(second.signals.length, 0);
});

test('startup failures are visible without claiming process or network availability', () => {
  const h = harness({ spawn: () => { throw new Error('executable rejected'); } });
  const result = h.service.start(config);
  assert.equal(result.status, 'error'); assert.equal(result.lastError, 'executable rejected'); assert.equal(result.owned, false);
  const async = harness(); async.service.start(config); async.child().pid = undefined;
  async.child().emit('error', new Error('ENOENT'));
  assert.equal(async.service.status().status, 'error'); assert.equal(async.service.status().lastError, 'ENOENT');
  assert.equal(async.service.status().owned, false); assert.equal(async.timers.size, 0);
});

test('unexpected exit revokes ready status and retains diagnostics', () => {
  const h = harness(); h.service.start(config);
  h.child().stdout.emit('data', '[notice] Bootstrapped 100% (done): Done\n');
  h.child().stderr.emit('data', '[err] listener failed');
  h.child().emit('close', 1, null);
  const state = h.service.status();
  assert.equal(state.status, 'error'); assert.equal(state.bootstrapped, false); assert.equal(state.running, false);
  assert.equal(state.exitCode, 1); assert.match(state.lastError, /listener failed/);
});

test('logs and unfinished output are bounded and snapshots cannot mutate the ledger', () => {
  const h = harness({ logLimit: 10 }); h.service.start(config);
  for (let i = 0; i < 100; i++) h.child().stdout.emit('data', `[notice] diagnostic ${i}\n`);
  h.child().stderr.emit('data', 'x'.repeat(1000000));
  assert.equal(h.service.status().logs.length, 10);
  const snap = h.service.status(); snap.logs[0].line = 'tampered';
  assert.notEqual(h.service.status().logs[0].line, 'tampered');
  h.child().emit('close', 1, null);
  assert.ok(h.service.status().logs.every(entry => entry.line.length <= 1200));
});

test('disabling a running owned client requests shutdown without a replacement process', () => {
  const h = harness(); h.service.start(config);
  h.service.start({ enabled: false });
  assert.equal(h.service.status().status, 'stopping'); assert.equal(h.calls.length, 1);
  assert.deepEqual(h.child().signals, ['SIGTERM']);
  h.child().emit('close', 0, null);
  assert.equal(h.service.status().status, 'disabled'); assert.equal(h.service.status().owned, false);
});

test('a late bootstrap message after stop or timeout cannot revive readiness', () => {
  const h = harness(); h.service.start(config); h.service.stop();
  h.child().stdout.emit('data', '[notice] Bootstrapped 100% (done): Done\n');
  assert.equal(h.service.status().bootstrapped, false); assert.equal(h.service.status().status, 'stopping');
});

test('managed defaults are reused only if unchanged and existing user content is never overwritten', () => {
  const h = harness(); const file = path.join(config.dataDirectory, 'gigachad-managed-defaults.torrc');
  h.files.set(file, 'ORPort 9001\n');
  const result = h.service.start(config);
  assert.equal(result.status, 'error'); assert.match(result.lastError, /unexpected content/);
  assert.equal(h.files.get(file), 'ORPort 9001\n'); assert.equal(h.calls.length, 0);
});

test('data-directory or defaults write failures are visible and do not launch a process', () => {
  const h = harness({ fs: { mkdirSync() { throw new Error('data directory access denied'); } } });
  const result = h.service.start(config);
  assert.equal(result.status, 'error'); assert.match(result.lastError, /access denied/); assert.equal(h.calls.length, 0);
});
