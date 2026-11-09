'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { PortedMultiverseBrainsFederation } = require('../systems/ported-multiverse-brains');
require('../alife_neural_cyber_engine');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const indexSource = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const observatorySource = indexSource.slice(indexSource.indexOf('    function recordBrowserObservatory('), indexSource.indexOf('    class HumunculusTokenlessRuntime'));
const recordBrowserObservatory = vm.runInNewContext(`(${observatorySource.trim()})`);

function observatoryFixture() {
  return { browserPossessionStats: { domMutationsObserved: 0, domSelectionsTelekinesis: 0, domLensingWarpsCount: 0,
    networkLatencyMs: null, jsHeapUsedMb: null }, domains10: { d04_superAlienObservableness: { mutationObserverHz: null } } };
}

test('allocation does not claim executed brains or independent feature verification', () => {
  const model = new PortedMultiverseBrainsFederation();
  assert.equal(model.latestSnapshot.activeBrainsCount, 0);
  assert.equal(model.latestSnapshot.totalPantheonBrainsCount, 14);
  assert.equal(model.latestSnapshot.stateOrigin, 'initialized');
  assert.equal(model.latestSnapshot.completedStepCount, 0);
  const cyber = new globalThis.GigachadAlifeNeuralCyberEngine();
  assert.equal(cyber.availableFeatureCount, 25);
  assert.equal(cyber.verified25Count, 0);
  assert.equal(cyber.featureVerificationStatus, 'NOT_RUN');
});

test('completed numerical steps are visible without claiming scientific metrics or geometry training', () => {
  const model = new PortedMultiverseBrainsFederation();
  const runtime = { trainableAlifeNeuralHub: { zPerc16: new Float32Array(16).fill(0.2), tdAdvantageDelta: 0.1, adaptivePlasticityLr: 0.001, learnedMotorThrust2D: new Float32Array(2) } };
  model.step60Hz(runtime);
  assert.equal(model.latestSnapshot.activeBrainsCount, 14);
  assert.equal(model.latestSnapshot.completedStepCount, 1);
  assert.equal(model.latestSnapshot.stateOrigin, 'computed');
  assert.equal(model.brain12BlackHolePage.plasticUpdatesCount, 0);
  assert.equal(model.brain12BlackHolePage.numericalUpdatesCount, 12);
  assert.match(model.latestSnapshot.consciousnessConsortium.measurementScope, /not IIT Phi/);
  assert.match(model.latestSnapshot.cqmSuperMind.gradientImplementation, /external Eshkol not used/);
  assert.match(model.latestSnapshot.onlineUpdateCounterScope, /not verified/);
  assert.ok(runtime.trainableAlifeNeuralHub.learnedMotorThrust2D.some(value => value !== 0));
});

test('an interrupted federation step cannot claim that all models completed', () => {
  const model = new PortedMultiverseBrainsFederation();
  model.brain3CqmSuperMind.step60Hz = () => { throw new Error('fault injection'); };
  assert.throws(() => model.step60Hz({}), /fault injection/);
  assert.equal(model._buildTelemetrySnapshot().completedStepCount, 0);
  assert.equal(model._buildTelemetrySnapshot().activeBrainsCount, 0);
});

test('a reused guest sample counts effects once and calculates rate from the measured interval', () => {
  const dt = observatoryFixture();
  const sample = { sampleId: 'document-a:100', observedAt: 100, url: 'https://example.test/',
    domMutationsObserved: 8, mutationIntervalMs: 2000, networkLatencyMs: 0, jsHeapUsedMb: 0,
    scriptsCount: 0, stylesheetsCount: 0, selectionTelekinesisFired: true, domLensingWarped: true };
  assert.equal(recordBrowserObservatory(dt, sample), true);
  assert.equal(recordBrowserObservatory(dt, sample), false);
  assert.equal(recordBrowserObservatory(dt, { ...sample }), false);
  assert.equal(dt.browserPossessionStats.domMutationsObserved, 8);
  assert.equal(dt.browserPossessionStats.domSelectionsTelekinesis, 1);
  assert.equal(dt.browserPossessionStats.domLensingWarpsCount, 1);
  assert.equal(dt.domains10.d04_superAlienObservableness.mutationObserverHz, 4);
  assert.equal(dt.browserPossessionStats.networkLatencyMs, 0);
  assert.equal(dt.browserPossessionStats.jsHeapUsedMb, 0);
  assert.equal(dt.browserPossessionStats.scriptsCount, 0);
  assert.equal(recordBrowserObservatory(dt, { ...sample, sampleId: 'document-a:101', domMutationsObserved: 2, mutationIntervalMs: 1000 }), true);
  assert.equal(dt.browserPossessionStats.domMutationsObserved, 10);
  assert.equal(dt.domains10.d04_superAlienObservableness.mutationObserverHz, 2);
});

test('missing or invalid guest measurements remain unmeasured and sample memory is bounded', () => {
  const dt = observatoryFixture();
  assert.equal(recordBrowserObservatory(dt, { domMutationsObserved: 7, networkLatencyMs: 34 }), false);
  assert.equal(dt.browserPossessionStats.domMutationsObserved, 0);
  for (let i = 0; i < 40; i++) recordBrowserObservatory(dt, { sampleId: `missing-${i}`, observedAt: i,
    domMutationsObserved: null, mutationIntervalMs: 0, networkLatencyMs: NaN, jsHeapUsedMb: -1 });
  assert.equal(dt.browserPossessionStats.networkLatencyMs, null);
  assert.equal(dt.browserPossessionStats.jsHeapUsedMb, null);
  assert.equal(dt.domains10.d04_superAlienObservableness.mutationObserverHz, null);
  assert.equal(dt.observatorySampleIds.length, 32);
});

test('early acceptance report cannot fabricate independent qualification before evidence installation', () => {
  const start = indexSource.indexOf('      evaluateAcceptanceGates() {');
  const end = indexSource.indexOf('      // RESILIENT PROPRIOCEPTIVE', start);
  const method = vm.runInNewContext(`({${indexSource.slice(start, end)}}).evaluateAcceptanceGates`);
  const report = method.call({ simulationTick: 0 });
  assert.equal(report.passedCount, 0);
  assert.equal(report.totalCount, 8);
  assert.equal(report.releaseQualified, false);
  assert.ok(report.gates.every(gate => gate.status === 'NOT_RUN' && !gate.passed));
});

test('legacy displays identify schematic transport and source inventory without invented measurements', () => {
  assert.doesNotMatch(indexSource, /OPERATIONAL PASS|country \|\| 'IS'|3-HOP TOR CIRCUIT|100\/100 ACTIVE|100\/100 LIVE/);
  assert.doesNotMatch(indexSource, /verified(?:Modules|DeityPowers)Count:\s*100/);
  assert.doesNotMatch(indexSource, /let networkLatencyMs = 28|let jsHeapUsedMb = 48|domMutationsObserved % 19/);
  assert.match(indexSource, /RELAY SCHEMATIC \(NO CIRCUIT DATA\)/);
  assert.match(indexSource, /SOURCE BRANCHES FOUND/);
  assert.match(indexSource, /const sourceBranchIds = new Set/);
  assert.match(indexSource, /https:\/\/onion\.torproject\.org\//);
});

test('inline source keeps LF extraction boundaries and all embedded host scripts parse', () => {
  assert.equal(indexSource.includes('\r\n'), false);
  let count = 0;
  for (const match of indexSource.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    new vm.Script(match[1], { filename: `index.html#${++count}` });
  }
  assert.ok(count > 0);
});

test('transport receipt is invalidated for active main-frame navigation, not background or in-page events', () => {
  const start = indexSource.indexOf("      wv.addEventListener('did-start-navigation',");
  const end = indexSource.indexOf("      wv.addEventListener('did-navigate-in-page',", start);
  let callback;
  let invalidations = 0;
  const context = { id: 'active', activeTabId: 'active', tabObj: {}, ownsGuest: () => true,
    wv: { addEventListener: (_event, listener) => { callback = listener; } },
    window: { invalidateAliveTransportPage: () => { invalidations++; } } };
  vm.runInNewContext(indexSource.slice(start, end), context);
  callback({ isMainFrame: false });
  callback({ isMainFrame: true, isInPlace: true });
  assert.equal(invalidations, 0);
  context.activeTabId = 'background';
  callback({ isMainFrame: true });
  assert.equal(invalidations, 0);
  context.activeTabId = 'active';
  callback({ isMainFrame: true });
  assert.equal(invalidations, 1);
  context.ownsGuest = () => false;
  callback({ isMainFrame: true });
  assert.equal(invalidations, 1, 'detached or replaced guest events cannot invalidate the current page');
});

function webgpuFixture(navigatorValue) {
  const start = indexSource.indexOf('      async initWebGpuWorldModelShader() {');
  const end = indexSource.indexOf('\n      // =====================================================================', start);
  assert.ok(start > 0 && end > start, 'actual WebGPU initializer can be extracted');
  const context = navigatorValue === undefined ? {} : { navigator: navigatorValue };
  const initialize = vm.runInNewContext(`({${indexSource.slice(start, end)}}).initWebGpuWorldModelShader`, context);
  const state = { cpuState: new Float32Array([0.25, -0.5, 0.75]) };
  return { state, initialize: () => initialize.call({ continuousWorldModel: state }) };
}

test('creating the real initializer shader module does not claim compilation, GPU dispatch, or readback', async () => {
  const calls = [];
  const device = {
    createShaderModule({ code }) { calls.push('module'); assert.match(code, /@compute @workgroup_size\(64\)/); return {}; },
    createComputePipeline() { throw Error('Unexpected pipeline creation'); },
    createCommandEncoder() { throw Error('Unexpected GPU commands'); },
    createBuffer() { throw Error('Unexpected GPU storage'); },
    queue: { submit() { throw Error('Unexpected GPU submission'); } }
  };
  const f = webgpuFixture({ gpu: { async requestAdapter() {
    calls.push('adapter'); return { async requestDevice() { calls.push('device'); return device; } };
  } } });
  assert.equal(await f.initialize(), 'MODULE_CREATED_UNVALIDATED');
  assert.deepEqual(calls, ['adapter', 'device', 'module']);
  assert.equal(f.state.webgpuShaderModuleCreated, true);
  assert.equal(f.state.webgpuShaderCompilationStatus, 'NOT_CHECKED');
  assert.equal(f.state.webgpuShaderReady, false);
  assert.equal(f.state.webgpuPipelineCreated, false);
  assert.equal(f.state.webgpuDispatchCount, 0);
  assert.equal(f.state.webgpuReadbackCount, 0);
  assert.equal(f.state.webgpuComputeTopology, 'CPU_JS_FP32; WGSL_MODULE_CREATED_NOT_DISPATCHED');
  assert.deepEqual([...f.state.cpuState], [0.25, -0.5, 0.75]);
});

test('missing WebGPU API or adapter reports unavailable while preserving CPU state', async () => {
  for (const navigatorValue of [undefined, {}, { gpu: { requestAdapter: async () => null } }]) {
    const f = webgpuFixture(navigatorValue);
    assert.equal(await f.initialize(), 'UNAVAILABLE');
    assert.equal(f.state.webgpuShaderReady, false);
    assert.equal(f.state.webgpuShaderModuleCreated, false);
    assert.equal(f.state.webgpuDispatchCount, 0);
    assert.match(f.state.webgpuInitializationReason, /unavailable|No WebGPU adapter/);
    assert.equal(f.state.webgpuComputeTopology, 'CPU_JS_FP32; WEBGPU_UNAVAILABLE');
    assert.deepEqual([...f.state.cpuState], [0.25, -0.5, 0.75]);
  }
});

test('adapter, device, and shader creation failures are reported without unhandled rejection or GPU execution', async () => {
  const fail = () => { throw Error('fixture initialization failure'); };
  for (const requestAdapter of [fail, async () => ({ requestDevice: fail }),
    async () => ({ requestDevice: async () => ({ createShaderModule: fail }) })]) {
    const f = webgpuFixture({ gpu: { requestAdapter } });
    assert.equal(await f.initialize(), 'FAILED');
    assert.equal(f.state.webgpuInitializationReason, 'fixture initialization failure');
    assert.equal(f.state.webgpuShaderReady, false);
    assert.equal(f.state.webgpuShaderModuleCreated, false);
    assert.equal(f.state.webgpuPipelineCreated, false);
    assert.equal(f.state.webgpuDispatchCount, 0);
    assert.equal(f.state.webgpuReadbackCount, 0);
    assert.equal(f.state.webgpuComputeTopology, 'CPU_JS_FP32; WEBGPU_INITIALIZATION_FAILED');
    assert.deepEqual([...f.state.cpuState], [0.25, -0.5, 0.75]);
  }
});

test('an unresolved adapter request exposes pending initialization rather than active GPU compute', async () => {
  let finish;
  const adapter = new Promise(resolve => { finish = resolve; });
  const f = webgpuFixture({ gpu: { requestAdapter: () => adapter } });
  const initializing = f.initialize();
  assert.equal(f.state.webgpuInitializationStatus, 'REQUESTING_ADAPTER');
  assert.equal(f.state.webgpuShaderReady, false);
  assert.equal(f.state.webgpuShaderModuleCreated, false);
  assert.equal(f.state.webgpuDispatchCount, 0);
  finish(null);
  assert.equal(await initializing, 'UNAVAILABLE');
});
