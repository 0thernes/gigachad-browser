'use strict';

// Owns only the client process it spawns. Bootstrap is a Tor log observation,
// not proof that a browser request used this client or reached an onion site.
// Stdin configuration follows Tor Project's Stem launcher (-f -):
// https://stem.torproject.org/_modules/stem/process.html
const path = require('node:path');
const fs = require('node:fs');
const { spawn: nativeSpawn } = require('node:child_process');

function createTorService(options = {}) {
  const spawn = options.spawn || nativeSpawn;
  const fileSystem = options.fs || fs;
  const exists = options.exists || (file => { try { return fileSystem.statSync(file).isFile(); } catch (_) { return false; } });
  const now = options.now || Date.now;
  const setTimer = options.setTimer || setTimeout;
  const clearTimer = options.clearTimer || clearTimeout;
  const limit = Math.max(10, Math.min(200, Number(options.logLimit) || 80));
  let owned = null, bootstrapTimer = null, terminateTimer = null;
  let state = {
    status: 'idle', bootstrapProgress: 0, bootstrapped: false, pid: null,
    startedAt: null, readyAt: null, stoppedAt: null, lastError: '', lastWarning: '',
    exitCode: null, exitSignal: null, socksPort: null, torPath: '', dataDirectory: '', logs: [],
    scope: 'Owned Tor client process and self-reported bootstrap only; browser routing, onion reachability, and anonymity require separate evidence'
  };
  const clean = value => String(value || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').slice(0, 1200);
  function snapshot() {
    return { ...state, owned: Boolean(owned), running: Boolean(owned && !owned.exited && owned.process.pid),
      pid: owned?.process.pid || null, logs: state.logs.map(entry => ({ ...entry })) };
  }
  function publish() {
    const result = snapshot();
    try { options.onStatus?.(result); } catch (_) { /* presentation cannot break process ownership */ }
    return result;
  }
  function cancelTimer(which) {
    const timer = which === 'bootstrap' ? bootstrapTimer : terminateTimer;
    if (timer !== null) clearTimer(timer);
    if (which === 'bootstrap') bootstrapTimer = null; else terminateTimer = null;
  }
  function log(stream, raw) {
    const line = clean(raw).trim(); if (!line) return;
    state.logs.push({ at: now(), stream, line });
    if (state.logs.length > limit) state.logs.splice(0, state.logs.length - limit);
    if (/\[(?:warn|err)\]/i.test(line)) state.lastWarning = line;
  }
  function consume(token, stream, chunk, flush = false) {
    if (owned !== token) return;
    // Bound both retained history and incomplete/unframed output.
    const bytes = Buffer.isBuffer(chunk) ? chunk.subarray(Math.max(0, chunk.length - 16384)).toString('utf8') : String(chunk || '').slice(-16384);
    const parts = (token.buffers[stream] + bytes).split(/\r?\n/);
    token.buffers[stream] = flush ? '' : parts.pop().slice(-4096);
    for (const raw of parts) {
      log(stream, raw);
      const match = stream === 'stdout' && /\[notice\]\s+Bootstrapped\s+(\d{1,3})%(?:\s|$)/.exec(raw);
      // The percentage is followed by whitespace in normal Tor output; no
      // ready state is inferred from generic connection or SOCKS messages.
      const progress = match ? Number(match[1]) : null;
      if (!token.stopping && progress !== null && progress >= 0 && progress <= 100) {
        state.bootstrapProgress = Math.max(state.bootstrapProgress, progress);
        state.bootstrapped = progress === 100 || state.bootstrapped;
        state.status = state.bootstrapped ? 'ready' : 'bootstrapping';
        if (state.bootstrapped) { state.readyAt ??= now(); cancelTimer('bootstrap'); }
      }
    }
    publish();
  }
  function terminate(token, finalStatus) {
    if (!token || owned !== token || token.exited) return;
    token.stopping = true; token.finalStatus = finalStatus;
    state.bootstrapped = false;
    cancelTimer('bootstrap');
    if (!['error', 'timeout'].includes(state.status)) state.status = 'stopping';
    try {
      if (!token.process.kill('SIGTERM')) state.lastError = 'Owned Tor client did not accept termination; waiting for exit';
    } catch (error) { state.lastError = clean(error.message); }
    // Only the exact owned ChildProcess handle may be terminated. Never use
    // taskkill, executable-name matching, or a PID discovered on the SOCKS port.
    if (owned === token && !token.exited && terminateTimer === null) {
      terminateTimer = setTimer(() => {
        terminateTimer = null;
        if (owned !== token || token.exited) return;
        try { if (!token.process.kill('SIGKILL')) state.lastError = 'Owned Tor client has not acknowledged forced termination'; }
        catch (error) { state.lastError = clean(error.message); }
        publish();
      }, 5000);
      terminateTimer?.unref?.();
    }
  }
  function stop() {
    if (owned) terminate(owned, 'stopped');
    else { state.status = 'stopped'; state.bootstrapped = false; state.stoppedAt = now(); }
    return publish();
  }
  function start(config = {}) {
    if (config.enabled === false) {
      if (owned) terminate(owned, 'disabled'); else state.status = 'disabled';
      state.bootstrapped = false;
      return publish();
    }
    // An unresolved exit retains ownership, even after error or timeout.
    if (owned) return snapshot();
    const torPath = typeof config.torPath === 'string' ? config.torPath.trim() : '';
    const dataDirectory = typeof config.dataDirectory === 'string' ? config.dataDirectory.trim() : '';
    const socksPort = config.socksPort === undefined ? 9050 : Number(config.socksPort);
    const absolute = value => path.isAbsolute(value) || path.win32.isAbsolute(value);
    let reason = '';
    if (!torPath || !dataDirectory) reason = 'Configure a Tor executable and an isolated client data directory';
    else if (!absolute(torPath) || !absolute(dataDirectory) || /[\r\n\u0000]/.test(torPath + dataDirectory)) reason = 'Tor executable and data directory must be absolute paths';
    else if (!Number.isInteger(socksPort) || socksPort < 1 || socksPort > 65535) reason = 'Invalid Tor SOCKS port';
    else { try { if (!exists(torPath)) reason = 'Configured Tor executable does not exist'; } catch (error) { reason = clean(error.message); } }
    if (reason) { state.status = 'unavailable'; state.lastError = reason; state.bootstrapped = false; return publish(); }
    state = { ...state, status: 'starting', bootstrapProgress: 0, bootstrapped: false, pid: null,
      startedAt: now(), readyAt: null, stoppedAt: null, lastError: '', lastWarning: '', exitCode: null, exitSignal: null,
      torPath, dataDirectory, socksPort, logs: [] };
    // Windows Tor canonicalizes NUL into \\.\NUL and cannot read it as a
    // torrc. Use a real owned empty-defaults file instead. Never overwrite an
    // existing nonmatching file or inherit a user's global Tor configuration.
    const defaultsFile = path.join(dataDirectory, 'gigachad-managed-defaults.torrc');
    const defaultsText = '# Managed GIGACHAD empty Tor defaults.\n';
    try {
      fileSystem.mkdirSync(dataDirectory, { recursive: true });
      try { fileSystem.writeFileSync(defaultsFile, defaultsText, { encoding: 'utf8', flag: 'wx' }); }
      catch (error) {
        if (error.code !== 'EEXIST') throw error;
        const stat = fileSystem.statSync(defaultsFile);
        if (!stat.isFile() || stat.size > 1024 || fileSystem.readFileSync(defaultsFile, 'utf8') !== defaultsText) {
          throw new Error('Managed Tor defaults path already contains unexpected content');
        }
      }
    } catch (error) { state.status = 'error'; state.lastError = clean(error.message); return publish(); }
    const args = ['--defaults-torrc', defaultsFile, '-f', '-',
      '--ClientOnly', '1', '--SocksPort', `127.0.0.1:${socksPort}`, '--DataDirectory', dataDirectory,
      '--ORPort', '0', '--DirPort', '0', '--ControlPort', '0', '--DNSPort', '0', '--TransPort', '0',
      '--HTTPTunnelPort', '0', '--RunAsDaemon', '0', '--Log', 'notice stdout',
      '--__OwningControllerProcess', String(process.pid)];
    let child;
    try {
      child = spawn(torPath, args, { windowsHide: true, shell: false, detached: false,
        cwd: path.dirname(torPath), stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (error) { state.status = 'error'; state.lastError = clean(error.message); return publish(); }
    const token = owned = { process: child, stopping: false, exited: false, finalStatus: null, buffers: { stdout: '', stderr: '' } };
    child.stdout?.on('data', chunk => consume(token, 'stdout', chunk));
    child.stderr?.on('data', chunk => consume(token, 'stderr', chunk));
    child.on('error', error => {
      if (owned !== token) return;
      state.status = 'error'; state.lastError = clean(error.message); state.bootstrapped = false;
      cancelTimer('bootstrap');
      if (!child.pid) { token.exited = true; owned = null; state.stoppedAt = now(); }
      else if (!token.stopping) terminate(token, 'error');
      publish();
    });
    child.once('close', (code, signal) => {
      if (owned !== token) return;
      consume(token, 'stdout', '', true); consume(token, 'stderr', '', true);
      token.exited = true; owned = null; cancelTimer('bootstrap'); cancelTimer('terminate');
      state.exitCode = code; state.exitSignal = signal; state.stoppedAt = now(); state.bootstrapped = false;
      state.status = token.finalStatus || 'error';
      if (!token.stopping && !state.lastError) state.lastError = state.lastWarning || `Tor client exited before shutdown (code ${code}, signal ${signal || 'none'})`;
      publish();
    });
    child.stdin?.on('error', error => {
      if (owned !== token || token.stopping) return;
      state.status = 'error'; state.lastError = clean(error.message); terminate(token, 'error'); publish();
    });
    try { child.stdin?.end('# Isolated GIGACHAD client; all options are supplied explicitly.\n'); }
    catch (error) { state.status = 'error'; state.lastError = clean(error.message); terminate(token, 'error'); return publish(); }
    if (owned !== token || token.stopping || token.exited || state.bootstrapped) return publish();
    const timeoutMs = Math.max(1000, Math.min(180000, Number(config.startupTimeoutMs) || 90000));
    bootstrapTimer = setTimer(() => {
      bootstrapTimer = null;
      if (owned !== token || token.exited || state.bootstrapped) return;
      state.status = 'timeout'; state.lastError = `Tor bootstrap did not reach 100% within ${timeoutMs} ms`;
      terminate(token, 'timeout'); publish();
    }, timeoutMs);
    bootstrapTimer?.unref?.();
    return publish();
  }
  return Object.freeze({ start, stop, snapshot, status: snapshot });
}

module.exports = { createTorService };
