'use strict';

// Read-only observation of an already launched normal app. This script never
// launches/pauses/navigates the application, changes providers, or requests jobs.
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const { randomUUID } = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function parseOptions(argv, root = ROOT) {
  const values = {};
  for (const arg of argv) {
    const match = /^--(port|output|duration-ms|interval-ms)=(.+)$/.exec(arg);
    if (!match || Object.hasOwn(values, match[1])) throw new Error('Expected unique --port=N --output=DIR [--duration-ms=N] [--interval-ms=N] arguments');
    values[match[1]] = match[2];
  }
  function integer(name, fallback, min, max) {
    const raw = values[name] ?? String(fallback);
    if (!/^\d+$/.test(raw)) throw new Error(`Invalid ${name}`);
    const n = Number(raw);
    if (!Number.isSafeInteger(n) || n < min || n > max) throw new Error(`${name} must be ${min}..${max}`);
    return n;
  }
  if (!values.port || !values.output || values.output.includes('\0')) throw new Error('Explicit --port and --output are required');
  const output = path.resolve(values.output), evidenceRoot = path.join(root, 'research_notes');
  const relative = path.relative(evidenceRoot, output);
  if (!relative || relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) throw new Error('Output must be a subdirectory of this repository research_notes');
  return { port: integer('port', 0, 1, 65535), output, root, durationMs: integer('duration-ms', 60000, 3000, 120000), intervalMs: integer('interval-ms', 10000, 1000, 10000) };
}

function validateTarget(target, { port, root = ROOT }) {
  if (target?.type !== 'page') return false;
  try {
    const page = new URL(target.url), endpoint = new URL(target.webSocketDebuggerUrl);
    if (page.protocol !== 'file:' || page.search || page.hash) return false;
    const actual = path.resolve(fileURLToPath(page)), expected = path.join(root, 'index.html');
    if ((process.platform === 'win32' ? actual.toLowerCase() !== expected.toLowerCase() : actual !== expected)) return false;
    return endpoint.protocol === 'ws:' && endpoint.hostname === '127.0.0.1' && Number(endpoint.port) === port &&
      !endpoint.username && !endpoint.password && !endpoint.search && !endpoint.hash && /^\/devtools\/page\/[a-z0-9_-]+$/i.test(endpoint.pathname);
  } catch (_) { return false; }
}

function prepareOutput(options) {
  const allowed = fs.realpathSync(path.join(options.root, 'research_notes'));
  let ancestor = options.output;
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  const actual = fs.realpathSync(ancestor), relative = path.relative(allowed, actual);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error('Output resolves outside repository evidence directory');
  fs.mkdirSync(options.output, { recursive: true });
  for (const name of ['report.json', 'application.png']) if (fs.existsSync(path.join(options.output, name))) throw new Error('Observation output already exists; choose a new directory');
}

function hostSnapshot(expectedUrl) {
  if (expectedUrl && location.href !== expectedUrl) throw new Error('Host target changed during observation');
  const h = typeof humunculusRuntime === 'undefined' ? null : humunculusRuntime;
  if (!h || !window.aliveOverdrive?.snapshot) throw new Error('ALIVE host runtime is not initialized');
  const short = (v, n = 240) => typeof v === 'string' ? v.slice(0, n) : null;
  const finite = v => Number.isFinite(v) ? v : null;
  const url = raw => { try { const u = new URL(raw); u.username = ''; u.password = ''; u.hash = ''; u.search = ''; return u.href.slice(0, 2048); } catch (_) { return null; } };
  const tensor = v => {
    if (!ArrayBuffer.isView(v) || typeof v.length !== 'number' || v.length > 8192) return null;
    let sum = 0, squared = 0, nonfinite = 0, hash = 2166136261;
    for (let i = 0; i < v.length; i++) { const x = Number(v[i]); if (!Number.isFinite(x)) nonfinite++; else { sum += x; squared += x * x; } }
    for (const byte of new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) hash = Math.imul(hash ^ byte, 16777619);
    return { length: v.length, sum, squared, nonfinite, byteHash32: (hash >>> 0).toString(16), scope: 'Bounded sampled tensor fingerprint; not a quality benchmark' };
  };
  const c = window.aliveOverdrive.snapshot(false), r = window.aliveResearch?.snapshot?.();
  const state = window.getAliveRuntimeEvidence?.() || {}, transport = window.getAliveTransportEvidence?.() || {};
  const planner = state.planner, probe = transport.lastBackendProbe, nav = probe?.navigation;
  const coupling = h.aliveNeuralCoupling?.snapshot?.();
  const autosave = state.autosave || window.aliveAutosave?.snapshot?.();
  const genome = window.aliveGenomePersistence?.snapshot?.(), restore = h.persistentGenomeRestore;
  return { at: Date.now(), runtimeUserAgent: short(navigator.userAgent, 500), running: c.running, suspended: c.suspended,
    health: c.health, autoHop: window.alienAutoNavigateLinks === true, visibility: document.visibilityState, focused: document.hasFocus(),
    jobs: (c.jobs || []).slice(0, 64).map(j => ({ id: j.id, status: j.status, runCount: finite(j.runCount),
      completedCount: finite(j.completedCount), errorCount: finite(j.errorCount), lastStartedAt: finite(j.lastStartedAt),
      lastCompletedAt: finite(j.lastCompletedAt), lastSuccessfulAt: finite(j.lastSuccessfulAt), lastDurationMs: finite(j.lastDurationMs),
      evidenceAt: finite(j.evidenceAt), nextDueAt: finite(j.nextDueAt), group: short(j.group), lastError: short(j.lastError) })),
    research: r ? { frontierCount: r.frontierCount, visitedPages: r.visitedPages, visitedDomains: r.visitedDomains,
      observations: r.observations, modelUpdates: r.modelUpdates, lastReward: r.lastReward, lastLoss: r.lastLoss,
      pending: r.pending ? { tabId: r.pending.tabId, url: url(r.pending.url), dispatchedAt: r.pending.dispatchedAt } : null,
      lastReadiness: r.lastReadiness, recentPages: (r.recentPages || []).map(p => ({ url: url(p.url), at: p.at })),
      lastDecision: r.lastDecision ? { url: url(r.lastDecision.url), at: r.lastDecision.at, score: r.lastDecision.score } : null } : null,
    localModel: planner ? { status: planner.status, model: short(planner.model), requestedModel: short(planner.requestedModel),
      backend: short(planner.backend), durationMs: finite(planner.durationMs), sourceUrl: url(planner.sourceUrl),
      observedAt: finite(planner.observedAt), reason: short(planner.reason), scope: 'Cached actual planner outcome; no provider request made by observer' } : null,
    transport: { activeUrl: url(transport.activeUrl), activeTabId: transport.activeTabId, activeReady: transport.activeReady,
      checkedAt: probe?.checkedAt ?? null, socksHandshakeVerified: probe?.socksHandshakeVerified === true,
      torPacApplied: probe?.torPacApplied === true, managedTor: probe?.managedTor ? { status: probe.managedTor.status,
        bootstrapProgress: probe.managedTor.bootstrapProgress, bootstrapped: probe.managedTor.bootstrapped } : null,
      navigation: nav ? { url: url(nav.url), onion: nav.onion, networkVerified: nav.networkVerified,
        status: nav.status, httpStatus: finite(nav.httpStatus), statusCode: finite(nav.httpStatus), fromCache: nav.fromCache, observedAt: nav.observedAt } : null },
    neural: { simulationTick: h.simulationTick, backprop: h.trainableAlifeNeuralHub?.totalBackpropStepsTrained,
      stdpUpdates: h.connectome512?.stdpUpdatesCount, worldPredictionError: finite(h.worldPredError),
      coupling: coupling ? { steps: coupling.steps, feedbackUpdates: coupling.feedbackUpdates, sourceCount: coupling.sourceCount,
        lastPredictionError: coupling.lastPredictionError, lastReward: coupling.lastReward,
        sources: coupling.sources?.map(s => ({ id: s.id, available: s.available, gate: s.gate })) } : null,
      tensors: { actor: tensor(h.W_actor), world: tensor(h.W_world), critic: tensor(h.W_critic), coupling: tensor(h.aliveCouplingWeights),
        couplingGates: tensor(h.aliveCouplingGateLogits), researchInput: tensor(window.aliveResearch?.model?.inputWeights),
        researchHiddenBias: tensor(window.aliveResearch?.model?.hiddenBias), researchOutput: tensor(window.aliveResearch?.model?.outputWeights),
        researchOutputBias: tensor(window.aliveResearch?.model?.outputBias), hubPerception: tensor(h.trainableAlifeNeuralHub?.W_perc_enc),
        hubDynamics: tensor(h.trainableAlifeNeuralHub?.W_dyn1) } },
    persistence: autosave || genome || restore || h.authenticAsmodensius ? { status: genome?.status || autosave?.lastOutcome || 'restore-only',
      pending: autosave?.pending ?? null, inFlight: autosave ? autosave.flushing === true || autosave.inFlightId != null : null,
      autosave: autosave ? { lastOutcome: short(autosave.lastOutcome), lastError: short(autosave.lastError), lastReason: short(autosave.lastReason),
        pending: autosave.pending, flushing: autosave.flushing, inFlightId: autosave.inFlightId, phase: autosave.phase,
        storageMode: autosave.storageMode, workerMode: autosave.workerMode, admissionClosed: autosave.admissionClosed,
        draining: autosave.draining, persistenceVerified: autosave.persistenceVerified, verifiedWrites: autosave.verifiedWrites,
        flushAttempts: autosave.flushAttempts, workerFlushes: autosave.workerFlushes, fallbackCount: autosave.fallbackCount,
        lastFlushAt: autosave.lastFlushAt, lastCaptureMs: autosave.lastCaptureMs, lastAsyncCommitLatencyMs: autosave.lastAsyncCommitLatencyMs } : null,
      genome: genome ? { status: genome.status, bootstrapStatus: genome.bootstrapStatus, source: genome.source,
        writeAllowed: genome.writeAllowed, application: genome.application, applicationFailed: genome.applicationFailed,
        legacyRead: genome.legacyRead, pending: genome.pending, verifiedWrites: genome.verifiedWrites, revision: genome.revision,
        lastOutcome: genome.lastOutcome, error: short(genome.error, 300) } : null,
      restore: restore ? { applied: restore.applied, restoredTensorCount: finite(restore.restoredTensorCount), generation: finite(restore.generation),
        source: short(restore.source), simulationTick: finite(restore.simulationTick), error: short(restore.error), reason: short(restore.reason) } : null,
      nativeOrganism: h.authenticAsmodensius ? { status: short(h.authenticAsmodensius.status), lastError: short(h.authenticAsmodensius.lastError, 300) } : null,
      research: state.researchPersistence ? { status: state.researchPersistence.status, at: finite(state.researchPersistence.at),
        bytes: finite(state.researchPersistence.bytes), reason: short(state.researchPersistence.reason) } : null } : null,
    acceptance: h.lastAcceptanceReport ? { releaseQualified: h.lastAcceptanceReport.releaseQualified,
      passedCount: h.lastAcceptanceReport.passedCount, gates: h.lastAcceptanceReport.gates?.map(g => ({ id: g.id, status: g.status })) } : null,
    tabs: (typeof tabs === 'undefined' ? [] : tabs).slice(0, 32).map(t => ({ id: t.id, url: url(t.committedUrl || t.url), ready: t.domReady, isLoading: t.isLoading })),
    activeUrl: url(transport.activeUrl), canvasFrame: typeof chromeCrawlerState === 'undefined' ? null : chromeCrawlerState.frameCount };
}

function installSampler(key, durationMs) {
  if (!Number.isSafeInteger(durationMs) || durationMs < 3000 || durationMs > 120000) throw new Error('Sampler duration must be 3000..120000 ms');
  if (Object.hasOwn(window, key)) throw new Error('Observer key already exists');
  const crawler = typeof chromeCrawlerState === 'undefined' ? null : chromeCrawlerState;
  if (!crawler) throw new Error('Host renderer is not initialized');
  const start = performance.now(), startFrame = crawler.frameCount;
  const raf = [], presentation = [], errors = [], longTasks = [];
  let rafId, timer, lastRaf, lastFrame = startFrame, missed = 0, observer, active = true, counterReset = false;
  const failure = e => { if (errors.length < 50) errors.push({ type: e.type, message: String(e.message || e.reason || 'unknown').slice(0, 300) }); };
  const capture = () => { const count = crawler.frameCount - lastFrame; if (count > 0) {
    const ring = crawler.presentationIntervals || [], available = Math.min(count, ring.length);
    missed += count - available;
    for (const value of ring.slice(-available)) if (presentation.length < 12000 && Number.isFinite(value)) presentation.push(value);
    lastFrame = crawler.frameCount;
  } else if (count < 0) { counterReset = true; lastFrame = crawler.frameCount; } };
  const distribution = values => { const sorted = values.filter(Number.isFinite).sort((a, b) => a - b); return {
    samples: sorted.length, p50: sorted[Math.floor(sorted.length * .5)] ?? null,
    p95: sorted[Math.floor(sorted.length * .95)] ?? null, p99: sorted[Math.floor(sorted.length * .99)] ?? null, max: sorted.at(-1) ?? null }; };
  const state = window[key] = { active: true, finish() {
    if (!active) return state.result;
    active = state.active = false; cancelAnimationFrame(rafId); clearTimeout(timer); capture();
    if (observer) {
      try { for (const e of observer.takeRecords()) if (e.startTime >= start && longTasks.length < 1000) longTasks.push({ start: e.startTime - start, duration: e.duration }); }
      catch (error) { if (errors.length < 50) errors.push({ type: 'observer-drain', message: String(error.message || error).slice(0, 300) }); }
      finally { observer.disconnect(); }
    }
    window.removeEventListener('error', failure); window.removeEventListener('unhandledrejection', failure);
    const elapsedMs = performance.now() - start, frames = crawler.frameCount - startFrame;
    return state.result = { elapsedMs, frames, averageFps: counterReset || frames < 0 ? null : frames * 1000 / elapsedMs, counterReset,
      presentation: distribution(presentation), rawRaf: distribution(raf), missedPresentationSamples: missed,
      longTaskObserverInstalled: Boolean(observer), longTasks, errors,
      scope: 'Observed host canvas counter and interval ring; raw RAF separate, not GPU/pixel presentation or future performance guarantee' };
  } };
  window.addEventListener('error', failure); window.addEventListener('unhandledrejection', failure);
  try { observer = new PerformanceObserver(list => { for (const e of list.getEntries()) if (active && e.startTime >= start && longTasks.length < 1000) longTasks.push({ start: e.startTime - start, duration: e.duration }); }); observer.observe({ type: 'longtask' }); }
  catch (_) { observer?.disconnect(); observer = null; }
  function tick(now) { if (!active) return; if (lastRaf !== undefined && raf.length < 30000) raf.push(now - lastRaf); lastRaf = now; capture(); rafId = requestAnimationFrame(tick); }
  rafId = requestAnimationFrame(tick); timer = setTimeout(state.finish, durationMs);
  return { startedAt: Date.now(), requestedMs: durationMs, startFrame };
}

async function connect(url) {
  if (typeof WebSocket !== 'function') throw new Error('A Node runtime with native WebSocket is required');
  const ws = new WebSocket(url), pending = new Map(); let sequence = 0;
  await new Promise((resolve, reject) => { const timer = setTimeout(() => { ws.close(); reject(new Error('CDP connection timed out')); }, 5000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP connection failed')); }, { once: true }); });
  const fail = reason => { for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(new Error(reason)); } pending.clear(); };
  ws.addEventListener('close', () => fail('CDP connection closed'));
  ws.addEventListener('message', e => { let message; try { message = JSON.parse(e.data); } catch (_) { return; }
    const entry = pending.get(message.id); if (!entry) return; pending.delete(message.id); clearTimeout(entry.timer);
    message.error ? entry.reject(new Error(message.error.message || 'CDP command failed')) : entry.resolve(message.result); });
  return { call(method, params = {}) { return new Promise((resolve, reject) => { const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(method + ' timed out')); }, 10000);
    pending.set(id, { resolve, reject, timer });
    try { ws.send(JSON.stringify({ id, method, params })); } catch (error) { clearTimeout(timer); pending.delete(id); reject(error); }
  }); }, close() { fail('Observer finished'); ws.close(); } };
}

async function main(argv = process.argv.slice(2)) {
  const options = parseOptions(argv); prepareOutput(options);
  const response = await fetch(`http://127.0.0.1:${options.port}/json/list`, { signal: AbortSignal.timeout(5000), redirect: 'error' });
  if (!response.ok) throw new Error('CDP target list unavailable');
  const targets = await response.json();
  const matches = Array.isArray(targets) ? targets.filter(target => validateTarget(target, options)) : [];
  if (matches.length !== 1) throw new Error('Expected exactly one current-repository file index.html target on the requested loopback CDP port');
  const cdp = await connect(matches[0].webSocketDebuggerUrl), key = '__aliveNormalObservation_' + randomUUID().replaceAll('-', '');
  const evaluate = async expression => { const result = await cdp.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Host expression failed'); return result.result?.value; };
  const report = { scope: 'Read-only normal-app observation: no navigation, manual jobs, Pause, fixture/provider overrides, config or credential reads. Temporary performance/error instrumentation only.',
    startedAt: new Date().toISOString(), requestedMs: options.durationMs, targetUrl: matches[0].url, port: options.port,
    urlScope: 'Observed page URLs omit userinfo, query strings and fragments; full page contents and config are not collected', observations: [] };
  let instrumented = false;
  const snapshotExpression = '(' + hostSnapshot.toString() + ')(' + JSON.stringify(matches[0].url) + ')';
  try {
    report.before = await evaluate(snapshotExpression);
    instrumented = true;
    report.sampleStart = await evaluate('(' + installSampler.toString() + ')(' + JSON.stringify(key) + ',' + options.durationMs + ')');
    const deadline = performance.now() + options.durationMs;
    while (performance.now() < deadline) {
      await sleep(Math.min(options.intervalMs, Math.max(1, deadline - performance.now())));
      const sample = await evaluate(snapshotExpression); report.observations.push(sample);
      console.log(JSON.stringify({ elapsedSeconds: Math.round((Date.now() - report.sampleStart.startedAt) / 1000), running: sample.running,
        url: sample.activeUrl, visitedPages: sample.research?.visitedPages, modelUpdates: sample.research?.modelUpdates,
        plannerStatus: sample.localModel?.status, torStatus: sample.transport.managedTor?.status, backprop: sample.neural.backprop }));
    }
    report.after = report.observations.at(-1);
    const screenshot = await cdp.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    if (typeof screenshot.data !== 'string' || screenshot.data.length > 32 * 1024 * 1024) throw new Error('Screenshot missing or oversized');
    fs.writeFileSync(path.join(options.output, 'application.png'), Buffer.from(screenshot.data, 'base64'), { flag: 'wx' });
    report.screenshot = 'application.png'; report.status = 'observed';
  } catch (error) { report.status = 'error'; report.error = String(error.message || error).slice(0, 300); throw error; }
  finally {
    if (instrumented) try { report.rendering = await evaluate(`(() => { const s=window[${JSON.stringify(key)}]; const result=s?.finish?.(); delete window[${JSON.stringify(key)}]; return result; })()`); report.instrumentationCleaned = true; }
    catch (error) { report.cleanupError = String(error.message || error).slice(0, 300); report.instrumentationCleaned = false; }
    report.endedAt = new Date().toISOString();
    try { fs.writeFileSync(path.join(options.output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' }); } finally { cdp.close(); }
  }
  console.log(JSON.stringify({ report: path.join(options.output, 'report.json'), status: report.status,
    averageFps: report.rendering?.averageFps, presentationP95Ms: report.rendering?.presentation?.p95,
    longTasks: report.rendering?.longTasks?.length, errors: report.rendering?.errors?.length, instrumentationCleaned: report.instrumentationCleaned }));
  return report;
}

module.exports = { parseOptions, validateTarget, prepareOutput, hostSnapshot, installSampler, main };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
