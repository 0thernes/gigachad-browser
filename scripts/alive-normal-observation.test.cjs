'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');
const { parseOptions, validateTarget, hostSnapshot, installSampler } = require('./alive-normal-observation.cjs');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'research_notes', 'normal observation fixture');
const args = ['--port=9222', '--output=' + output];

test('normal observation requires explicit port/output and bounds sampling and polling', () => {
  const options = parseOptions(args);
  assert.equal(options.durationMs, 60000); assert.equal(options.intervalMs, 10000);
  assert.equal(options.output, output);
  for (const bad of [[], [args[0]], [args[1]], [...args, '--port=1234'], [...args, '--host=example.com'],
    ['--port=0', args[1]], ['--port=65536', args[1]], ['--port=1e3', args[1]],
    [...args, '--duration-ms=120001'], [...args, '--duration-ms=2999'], [...args, '--interval-ms=999'], [...args, '--interval-ms=10001']]) {
    assert.throws(() => parseOptions(bad));
  }
  assert.equal(parseOptions([...args, '--duration-ms=120000']).durationMs, 120000);
});

test('observation output cannot escape the repository evidence subtree', () => {
  for (const destination of [root, path.join(root, 'research_notes'), path.join(root, 'research_notes', '..', 'user-data'), path.join(root, '..', 'outside')]) {
    assert.throws(() => parseOptions(['--port=9222', '--output=' + destination]), /subdirectory/);
  }
});

test('CDP target must be the exact repository host on the same loopback port', () => {
  const options = parseOptions(args), target = { type: 'page', url: pathToFileURL(path.join(root, 'index.html')).href,
    webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/ABC-123' };
  assert.equal(validateTarget(target, options), true);
  for (const changed of [
    { type: 'webview' }, { url: 'https://example.com/index.html' },
    { url: pathToFileURL(path.join(root, '..', 'other', 'index.html')).href },
    { url: target.url + '?probe=1' },
    { webSocketDebuggerUrl: 'ws://example.com:9222/devtools/page/ABC' },
    { webSocketDebuggerUrl: 'ws://127.0.0.1:9223/devtools/page/ABC' },
    { webSocketDebuggerUrl: 'ws://user:secret@127.0.0.1:9222/devtools/page/ABC' },
    { webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/browser/ABC' },
    { webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/ABC?redirect=other' }
  ]) assert.equal(validateTarget({ ...target, ...changed }, options), false);
});

test('runtime snapshot is read-only, redacts URL credentials/query and omits provider secrets', () => {
  const page = pathToFileURL(path.join(root, 'index.html')).href;
  const privateUrl = 'https://user:password@example.com/article?token=secret#part';
  const controller = { snapshot: () => ({ running: true, jobs: [{ id: 'research-plan', status: 'completed', runCount: 2 }], health: { state: 'running' } }),
    request() { throw new Error('Must not request capabilities'); }, stop() { throw new Error('Must not pause'); } };
  const context = { location: { href: page }, URL, Date, ArrayBuffer, Uint8Array, navigator: { userAgent: 'Electron fixture' },
    document: { visibilityState: 'visible', hasFocus: () => false },
    humunculusRuntime: { simulationTick: 42, W_actor: new Float32Array([.1, .2]) },
    chromeCrawlerState: { frameCount: 60 }, tabs: [{ id: 'a', committedUrl: privateUrl, domReady: true }],
    aliveOverdrive: controller, alienAutoNavigateLinks: true,
    getAliveTransportEvidence: () => ({ activeUrl: privateUrl, activeReady: true }),
    getAliveRuntimeEvidence: () => ({ planner: { status: 'completed', model: 'loaded-model', apiKey: 'DO_NOT_COPY', proposal: { secret: 'DO_NOT_COPY' } } }) };
  context.window = context;
  const result = vm.runInNewContext('(' + hostSnapshot.toString() + ')(' + JSON.stringify(page) + ')', context);
  assert.equal(result.activeUrl, 'https://example.com/article');
  assert.equal(result.tabs[0].url, 'https://example.com/article');
  assert.equal(result.localModel.model, 'loaded-model');
  assert.equal(result.neural.tensors.actor.length, 2);
  assert.doesNotMatch(JSON.stringify(result), /password|token=secret|DO_NOT_COPY/);
  context.location.href = 'https://another.example/';
  assert.throws(() => vm.runInNewContext('(' + hostSnapshot.toString() + ')(' + JSON.stringify(page) + ')', context), /target changed/);
});

test('observer fields match production research, coupling, persistence and job snapshot contracts', () => {
  const research = require('../systems/alive-research-policy.js').create({ now: () => 100000 });
  research.ingest({ url: 'https://archive.example/read', title: 'Research archive', researchExcerpt: 'Observed source',
    doors: [{ href: 'https://next.example/', text: 'A new source' }] }, { verified: true, tabId: 'a' });
  const h = { simulationTick: 12, W_actor: new Float32Array(80), W_world: new Float32Array(256), W_critic: new Float32Array(16),
    stepTrainableAlifeNeuralHub60Hz() {}, savePersistentGenome() {},
    trainableAlifeNeuralHub: { W_perc_enc: new Float32Array(256), W_dyn1: new Float32Array(512), totalBackpropStepsTrained: 7 },
    authenticAsmodensius: { status: 'ready', lastError: 'Invalid, incompatible or corrupted authentic checkpoint' } };
  require('../systems/alive-neural-coupling.js').install(h, {});
  const autosave = require('../systems/alive-autosave.js').install(h);
  let ipcCalls = 0;
  const genome = require('../systems/alive-genome-persistence.js').create({
    bootstrap: { status: 'absent', ownerId: 'fixture-owner', epoch: 1, revision: 0, writeAllowed: true },
    invoke() { ipcCalls++; throw new Error('Observer must not call storage IPC'); } });
  genome.initialJSON({ getItem: () => '{"legacy":true}' }, 'fixture');
  genome.markApplied(false, { hadJSON: true });
  const Controller = require('../systems/alive-overdrive-runtime.js').Controller;
  const controller = new Controller({ adapters: {} });
  const context = { URL, Date, ArrayBuffer, Uint8Array, humunculusRuntime: h, aliveResearch: research,
    aliveAutosave: autosave, aliveGenomePersistence: genome, aliveOverdrive: controller,
    navigator: { userAgent: 'Electron fixture' }, document: { visibilityState: 'visible', hasFocus: () => false }, tabs: [],
    getAliveRuntimeEvidence: () => ({ autosave: autosave.snapshot(), researchPersistence: { status: 'saved', at: 99999, bytes: 456 },
      planner: { status: 'timeout', model: 'actual-model', reason: 'Local research inference exceeded its deadline or was cancelled', durationMs: 12000 } }),
    getAliveTransportEvidence: () => ({ activeUrl: 'https://archive.example/read', lastBackendProbe: { checkedAt: 99999,
      navigation: { status: 'loaded', httpStatus: 200, url: 'https://archive.example/read', fromCache: false, networkVerified: false } } }) };
  context.window = context;
  const before = JSON.stringify(research.exportState());
  const result = vm.runInNewContext('(' + hostSnapshot.toString() + ')()', context);
  assert.equal(result.research.frontierCount, 1); assert.equal(result.research.visitedPages, 1); assert.equal(result.research.visitedDomains, 1);
  const expected = { actor: 80, world: 256, critic: 16, coupling: 384, couplingGates: 24,
    researchInput: 192, researchHiddenBias: 12, researchOutput: 12, researchOutputBias: 1, hubPerception: 256, hubDynamics: 512 };
  for (const [name, length] of Object.entries(expected)) {
    assert.equal(result.neural.tensors[name].length, length, name);
    assert.equal(result.neural.tensors[name].nonfinite, 0, name);
    assert.match(result.neural.tensors[name].byteHash32, /^[a-f0-9]+$/);
  }
  assert.equal(result.neural.coupling.sources.length, 24);
  assert.equal(result.localModel.status, 'timeout'); assert.match(result.localModel.reason, /deadline/);
  assert.equal(result.persistence.autosave.lastOutcome, 'not-run'); assert.equal(result.persistence.pending, false); assert.equal(result.persistence.inFlight, false);
  assert.equal(result.persistence.genome.source, 'legacy'); assert.equal(result.persistence.genome.application, 'rejected');
  assert.equal(result.persistence.genome.applicationFailed, true); assert.equal(result.persistence.genome.writeAllowed, false);
  assert.match(result.persistence.genome.error, /could not be applied/);
  assert.match(result.persistence.nativeOrganism.lastError, /corrupted authentic checkpoint/);
  assert.equal(result.persistence.restore, null); assert.equal(result.persistence.research.status, 'saved');
  assert.equal(result.transport.navigation.httpStatus, 200); assert.equal(result.transport.navigation.statusCode, 200);
  assert.ok(result.jobs.length > 0); assert.equal(result.jobs[0].runCount, 0);
  assert.equal(ipcCalls, 0); assert.equal(JSON.stringify(research.exportState()), before);
});

test('temporary renderer instrumentation is bounded, observes real counters and cleans listeners/timers', () => {
  let now = 0, nextId = 0;
  const rafs = new Map(), timers = new Map(), listeners = new Map();
  const context = { performance: { now: () => now }, Date,
    chromeCrawlerState: { frameCount: 10, presentationIntervals: [] },
    requestAnimationFrame(callback) { const id = ++nextId; rafs.set(id, callback); return id; },
    cancelAnimationFrame(id) { rafs.delete(id); },
    setTimeout(callback, duration) { const id = ++nextId; timers.set(id, { callback, duration }); return id; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(name, callback) { listeners.set(name, callback); }, removeEventListener(name) { listeners.delete(name); } };
  context.window = context; vm.createContext(context);
  const run = ms => vm.runInContext('(' + installSampler.toString() + ')(' + JSON.stringify('sample') + ',' + ms + ')', context);
  assert.throws(() => run(120001), /duration/); assert.equal(context.sample, undefined);
  run(60000); assert.equal(timers.values().next().value.duration, 60000);
  assert.throws(() => run(60000), /already exists/);
  context.chromeCrawlerState.frameCount = 12; context.chromeCrawlerState.presentationIntervals = [16, 17]; now = 33;
  const [id, callback] = rafs.entries().next().value; rafs.delete(id); callback(now);
  listeners.get('error')({ type: 'error', message: 'Observed test error' });
  now = 100;
  const result = context.sample.finish();
  assert.equal(result.frames, 2); assert.equal(result.presentation.samples, 2);
  assert.equal(result.errors[0].message, 'Observed test error');
  assert.equal(context.sample.finish(), result);
  assert.equal(rafs.size, 0); assert.equal(timers.size, 0); assert.equal(listeners.size, 0);
});
