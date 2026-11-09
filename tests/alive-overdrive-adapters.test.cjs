'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { Controller } = require('../systems/alive-overdrive-runtime');
const AliveNeuralCoupling = require('../systems/alive-neural-coupling');
const AliveAutosave = require('../systems/alive-autosave');
const AliveResearchPolicy = require('../systems/alive-research-policy');
const code = fs.readFileSync(path.join(__dirname, '..', 'systems', 'alive-overdrive-adapters.js'), 'utf8');

function fixture(configure) {
  let active = 0, created = 0, now = 20000;
  const tabs = [{ id: 't1', domReady: true, url: 'https://fixture.invalid/page', committedUrl: 'https://fixture.invalid/page', wv: { executeJavaScript: async () => true } }];
  const h = { simulationTick: 2, policyCid: 'p1', bodyRecipe: { bodyCid: 'body1' }, worldPredError: .3,
    stepTrainableAlifeNeuralHub60Hz() {},
    savePersistentGenome() {},
    cognitiveCortex: { emergentQuery: 'learned concept', lastComprehension: { topConcepts: ['concept'] } },
    isUrlOrAnchorTaboo: () => false, recordVisitedUrl() {}, executeAcknowledgedTabHandoff: () => ({ newEpoch: 2 }),
    consolidateHippocampalDreamReplay: () => ({ status: 'blocked', reason: 'Need observations', replayedEpisodes: 0 }),
    deepDarkWebSubstrateEngine: { localTorSocksActive: true },
    portedMultiverseBrains: { brain1Fixture: { step60Hz() {} }, brain2Fixture: { step60Hz() {} }, precisionArena: { backingBuffer: new ArrayBuffer(64), f32: new Float32Array(4) } }
  };
  const context = {
    humunculusRuntime: h, hybridBrainMesh: { groverSelectDoorIndex: () => ({ doorIdx: 0, prob: 1 }) },
    AliveOverdriveRuntime: { Controller },
    AliveNeuralCoupling,
    AliveAutosave,
    performance: { now: () => now }, Date, ArrayBuffer, Float32Array, Uint8Array, AbortController,
    document: { hidden: false, addEventListener() {}, getElementById() {} },
    dispatchEvent() {}, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    requestAnimationFrame() {}, setInterval() {}, clearTimeout() {}, clearInterval() {},
    tabs, secondaryTabId: null, alienBrainDoorsCount: 0, alienAutoNavigateLinks: true,
    getActiveTab: () => tabs[active], isWebviewGuestReady: wv => tabs.some(tab => tab.wv === wv && tab.domReady && !tab.frozen && !tab.guestUnavailable && !tab.terminalLoadFailure && !tab.mainFrameNavigating && wv.isConnected !== false), safeGetUrl: tab => tab?.url,
    performWeirdAlienDomExperiment: async () => ({ url: tabs[active].url, doors: [{ href: 'https://fixture.invalid/selected', text: 'Selected learned portal' }], specimens: ['article'], domWeirdAction: 'observed' }),
    createTab: (url, options) => { created++; const tab = { id: 't' + (tabs.length + 1), domReady: true, url, committedUrl: url, ...options, wv: tabs[0].wv }; tabs.push(tab); return tab; },
    switchTab: id => { active = tabs.findIndex(tab => tab.id === id); },
    dispatchNonBlockingTabNavigation: (tab, url) => { tab.url = url; return true; },
    buildChaoticPolymathSearchUrl: () => ({ url: 'https://fixture.invalid/search', title: 'Learned concept' }),
    ALIEN_RABBIT_HOLES: [{ url: 'https://fixture.invalid/discovery', title: 'Discovery' }],
    ipcRenderer: { invoke: async () => ({ ok: true, localTorSocksActive: false }) }
  };
  context.window = context;
  configure?.(context);
  vm.runInNewContext(code, context, { filename: 'alive-overdrive-adapters.js' });
  const run = id => context.aliveOverdrive.jobs.get(id).adapter.run({ signal: new AbortController().signal });
  return { context, h, tabs, run, created: () => created, advance: ms => { now += ms; } };
}

test('memory and metacognition expose the shared live stores without advancing or qualifying models', async () => {
  const f = fixture(context => {
    Object.assign(context.humunculusRuntime, {
      workingState: { activeStage: 'B', activeGoal: 'observed goal', shortHorizonPlan: ['sense', 'act'], lastUpdatedTick: 19 },
      episodicMemory: [{ eventId: 'observed-1' }],
      semanticMemory: { domainFacts: { seed: {}, observed: {} }, lineageFacts: [{}] },
      proceduralMemory: { A: { heldOutScorePct: 99 }, B: {} },
      learningEvidence: { recordedTransitions: 8 },
      multivectorMetacognitionEngine: { cliffordMultivector16: new Float32Array(16), cliffordRotor16: new Float32Array(16), bivectorTorqueNorm: .4 },
      stepMultivectorMetacognition60Hz() { throw new Error('observer duplicated a model step'); }
    });
  });
  const before = JSON.stringify(f.h.workingState);
  const memory = await f.run('memory'), meta = await f.run('metacognition');
  assert.equal(memory.status, 'observed');
  assert.equal(memory.evidence.tiersAvailable, 4);
  assert.equal(memory.evidence.working.lastUpdatedTick, 19);
  assert.equal(memory.evidence.episodic.events, 1);
  assert.equal(memory.evidence.semantic.domains, 2);
  assert.equal(memory.evidence.procedural.registeredStages, 2);
  assert.equal(memory.evidence.observedTransitions, 8);
  assert.match(memory.evidence.scope, /seeded entries.*not measured/);
  assert.equal(JSON.stringify(f.h.workingState), before);
  assert.equal(meta.status, 'observed');
  assert.equal(meta.evidence.cliffordBlades, 16);
  assert.equal(meta.evidence.bivectorTorqueNorm, .4);
});

test('missing memory and metacognition do not invent initialized or computed evidence', async () => {
  const f = fixture();
  assert.equal((await f.run('memory')).status, 'unavailable');
  assert.equal((await f.run('metacognition')).status, 'unavailable');
});

for (const [id, hook] of [['warp-dom', 'applyAliveDomWarp'], ['ghost-swarm', 'runAliveGhostSwarm'], ['ghost-write', 'runAliveGhostWrite']]) {
  test(id + ' retains execution receipts and rejects missing or malformed success', async () => {
    let args;
    const receipt = { status: 'completed', evidence: { pageApplied: true, enabled: true, observations: 3 } };
    const f = fixture(context => { context[hook] = async value => { args = value; return receipt; }; });
    assert.equal(await f.run(id), receipt);
    assert.ok(args.signal instanceof AbortSignal);
    if (id === 'warp-dom') assert.equal(args.enabled, true, 'recurring warp enables idempotently instead of toggling');
    f.context[hook] = async () => true;
    assert.equal((await f.run(id)).status, 'error');
    f.context[hook] = async () => ({ status: 'completed' });
    assert.equal((await f.run(id)).status, 'error');
    delete f.context[hook];
    assert.equal((await f.run(id)).status, 'unavailable');
  });
}

test('warp requires a confirmed page effect and cancelled faculties cannot publish success', async () => {
  let resolve;
  const f = fixture(context => {
    context.applyAliveDomWarp = async () => ({ status: 'completed', evidence: { pageApplied: false } });
    context.runAliveGhostSwarm = () => new Promise(done => { resolve = done; });
  });
  assert.equal((await f.run('warp-dom')).status, 'blocked');
  const abort = new AbortController();
  const pending = f.context.aliveOverdrive.jobs.get('ghost-swarm').adapter.run({ signal: abort.signal });
  abort.abort(); resolve({ status: 'completed', evidence: { observations: 2 } });
  assert.equal((await pending).status, 'blocked');
  for (const id of ['ghost-swarm', 'ghost-write']) {
    const task = f.context.aliveOverdrive.jobs.get(id);
    assert.equal(task.group, 'cognition');
    assert.equal(task.manualOnly, false);
    assert.equal(task.timeoutMs, 20000);
  }
});

test('only a fully validated primary observation feeds shared cognitive faculties', async () => {
  const observed = [];
  const f = fixture(context => { context.aliveCognitiveFaculties = { observe: value => observed.push(value) }; });
  assert.equal((await f.run('dom-body')).status, 'completed');
  assert.equal(observed.length, 1);
  assert.equal(observed[0].url, f.tabs[0].url);
  assert.ok(Number.isFinite(observed[0].observedAt));
  f.context.observeAliveSecondaryPane = async () => { f.tabs[0].committedUrl = 'https://fixture.invalid/replaced'; return { status: 'observed' }; };
  assert.equal((await f.run('dom-body')).status, 'blocked');
  assert.equal(observed.length, 1, 'late primary replacement excludes the stale result');
});

test('independent five-seed benchmark is separately scheduled without changing live policy', async () => {
  const report = { status: 'completed', scope: 'independent simulated benchmark', seedCount: 5, gateStatus: 'NOT_RUN' };
  const f = fixture(context => { context.AliveLearningFiveSeed = { run: async () => report }; });
  const job = f.context.aliveOverdrive.jobs.get('learning-five-seed');
  assert.equal(job.manualOnly, false);
  assert.equal(job.group, 'diagnostic');
  assert.equal(job.intervalMs, 300000);
  assert.equal((await f.run('learning-five-seed')).evidence, report);
  assert.equal(f.h.lastIndependentLearningReport, report);
  assert.equal(f.h.policyCid, 'p1');
  f.context.AliveLearningFiveSeed.run = async () => ({ status: 'incomplete', runs: [{ status: 'error', error: 'hash failed' }] });
  const failed = await f.run('learning-five-seed');
  assert.equal(failed.status, 'error');
  assert.equal(failed.evidence.runs[0].error, 'hash failed');
  delete f.context.AliveLearningFiveSeed;
  assert.equal((await f.run('learning-five-seed')).status, 'unavailable');
});

test('a cognition intake failure remains visible without discarding the measured page observation', async () => {
  const f = fixture(context => { context.aliveCognitiveFaculties = { observe() { throw new Error('memory rejected the observation'); } }; });
  const result = await f.run('dom-body');
  assert.equal(result.status, 'completed');
  assert.equal(result.evidence.cognition.status, 'error');
  assert.match(result.evidence.cognition.reason, /memory rejected/);
  assert.equal(result.evidence.url, f.tabs[0].url);
});

test('connectome receipts preserve executed tensor coverage through the bounded scheduler serializer', async () => {
  const f = fixture(context => {
    context.humunculusRuntime.connectome512 = { v512: new Float32Array(512), synWeights262K: new Float32Array(262144),
      processedPresynapticSpikes: 12, activeSynapsesTraversed: 6144, synapseVisits: 10000, uniqueSynapsesTraversed: 8192,
      synapseCoveragePct: 3.125, synapseCoverageScope: 'actual source rows traversed' };
    context.humunculusRuntime.deepCortex = { moeParameterVisitsThisStep: 1000, moeUniqueParametersVisited: 2000,
      moeParameterCoveragePct: 12.5, attentionParameterCoveragePct: 25, cortexPairedReadMask: 63, cortexGradientMask: 31 };
  });
  const result = await f.run('connectome');
  f.context.aliveOverdrive.jobs.get('connectome').evidence = result.evidence;
  const evidence = f.context.aliveOverdrive.snapshot(false).jobs.find(row => row.id === 'connectome').evidence;
  assert.equal(evidence.synapseCoverage.activeSynapsesTraversed, 6144);
  assert.equal(evidence.synapseCoverage.synapseCoveragePct, 3.125);
  assert.equal(evidence.cortexCoverage.moeUniqueParametersVisited, 2000);
  assert.equal(evidence.cortexCoverage.cortexPairedReadMask, 63);
  assert.equal(evidence.cortexCoverage.cortexGradientMask, 31);
  assert.match(evidence.cortexCoverage.scope, /alone does not establish task quality/);
});

function authorityFixture() {
  const AliveAuthority = require('../systems/alive-authority');
  const { createExecutor } = require('../systems/alive-guest-execution');
  let executor;
  const listeners = new Map();
  const f = fixture(context => {
    context.AliveAuthority = AliveAuthority;
    executor = context.AliveGuestExecution = createExecutor();
    context.humunculusRuntime.authorityEpoch = 5;
    context.humunculusRuntime.agentId = 'host-model';
    context.humunculusRuntime.lastPolicyStep = { authorityEpoch: 5 };
    context.alienBrainActive = true;
    context.superintelligenceOverdrive = true;
    context.document.addEventListener = (type, callback) => listeners.set(type, callback);
    for (const tab of context.tabs) installGuest(tab);
    context.performWeirdAlienDomExperiment = async (tab, options = {}) => ({ url: tab.url,
      doors: [{ href: 'https://fixture.invalid/door', text: 'Observed door' }], specimens: [],
      domWeirdAction: 'observed', authority: options.authorityToken || context.aliveAuthority.leaseFor(tab.id) });
  });
  function installGuest(tab) {
    if (tab.domReady && tab.committedUrl === undefined) tab.committedUrl = tab.url;
    const guest = { crypto: require('node:crypto').webcrypto, Date, Math };
    guest.window = guest;
    const realm = vm.createContext(guest), listeners = new Map();
    tab.wv = { id: tab.id, isConnected: true, getURL: () => tab.url,
      addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(fn); },
      executeJavaScript: async script => vm.runInContext(script, realm),
      replaceDocument() { for (const fn of listeners.get('did-navigate') || []) fn(); }
    };
    return tab;
  }
  return { ...f, executor, installGuest, authority: f.context.aliveAuthority,
    setHidden(value) { f.context.document.hidden = value; listeners.get('visibilitychange')?.(); } };
}

test('macro evidence exposes actual specialist gates and contributions through the bounded coordinator snapshot', async () => {
  const fusion = require('../systems/alive-specialist-fusion');
  const f = fixture(context => {
    context.AliveSpecialistFusion = fusion;
    context.hybridBrainMesh.macroRate = new Float32Array(14);
    // These are the first twelve scalar fields of the actual mesh constructor.
    // Generic model evidence must not push motor receipts past the 24-key cap.
    Object.assign(context.hybridBrainMesh,{selectedNode:0,zoomTier:1,t:12,isingEnergy:-.64,
      qgtTrace:1.48,berry01:.214,iitPhi:.5,entanglementBits:3.84,renyi2Bits:3.42,
      quantumPurity:.094,coherenceL1:4.82,lastBornCollapse:3});
    context.hybridBrainMesh.gwtWinner = 0;
    Object.assign(context.humunculusRuntime, { D_OBS:16, obsVec:new Float32Array(16).fill(.3),
      predObsVec:new Float32Array(16).fill(.1), W_actor:new Float32Array(32).fill(.2),
      activeSpecialists:fusion.sourceNames.slice(), specialistScores:new Float32Array(5).fill(1) });
  });
  const api=f.h.aliveSpecialistFusion;
  api.capture(f.h,{pfnSteering:[.4,-.2]});
  const residual=api.fuse(f.h.activeSpecialists,f.h.specialistScores,f.h.simulationTick);
  api.recordMotor(0,.2,Math.fround(Math.tanh(.2+residual[0])),f.h.simulationTick);
  api.recordMotor(1,-.1,Math.fround(Math.tanh(-.1+residual[1])),f.h.simulationTick);
  const result=await f.run('macro');
  f.context.aliveOverdrive.jobs.get('macro').evidence=result.evidence;
  const evidence=f.context.aliveOverdrive.snapshot(false).jobs.find(job=>job.id==='macro').evidence;
  assert.equal(evidence.fusionTick,f.h.simulationTick);
  assert.equal(evidence.specialistFusion.length,5);
  assert.ok(evidence.specialistFusion.every(row=>typeof row.gate==='number'&&row.gate===.2));
  assert.ok(evidence.specialistFusion.every(row=>typeof row.contributionX==='number'&&typeof row.readoutY==='number'));
  assert.ok(evidence.specialistFusion.some(row=>row.contributionX!==0));
  assert.equal(evidence.motorBefore[0],Math.fround(Math.tanh(.2)));
  assert.equal(evidence.motorAfter[0],Math.fround(Math.tanh(.2+residual[0])));
  assert.deepEqual(Array.from(evidence.motorMatchesFusion),[true,true]);
  assert.equal(Object.keys(evidence.modelScalars).length,12);
});

test('host handoff commits only an acknowledged guest lease and clears prior page-policy state', async () => {
  const f = authorityFixture();
  const outcome = await f.authority.setPaused(false);
  assert.equal(outcome.status, 'completed');
  assert.equal(f.h.authorityEpoch, 6);
  assert.equal(f.h.activeHostTabId, 't1');
  assert.equal(f.h.lastPolicyStep, null);
  assert.equal(f.h.handoffLedger.length, 1);
  assert.equal(f.h.handoffLedger[0].destinationAcknowledged, true);
  assert.equal(f.h.handoffLedger[0].checkpointCid, null);
  assert.equal(f.h.handoffLedger[0].checkpointTransferred, false);
  assert.equal(f.h.handoffLedger[0].distributedWriterFencing, false);
  const oldToken = f.authority.leaseFor('t1');
  assert.equal((await f.run('dom-body')).status, 'completed');
  f.tabs.push(f.installGuest({ id: 't2', domReady: true, url: f.tabs[0].url }));
  const next = await f.run('epoch-handoff');
  assert.equal(next.status, 'completed');
  assert.equal(next.evidence.destinationAcknowledged, true);
  assert.equal(f.h.activeHostTabId, 't2');
  assert.equal(f.authority.isCurrent(oldToken), false);
  assert.equal((await f.run('grover-collapse')).status, 'blocked');
  await f.authority.dispose();
});

test('same-URL stale observations cannot update host evidence after document replacement', async () => {
  const f = authorityFixture();
  await f.authority.setPaused(false);
  const token = f.authority.leaseFor('t1');
  let resolve;
  f.context.performWeirdAlienDomExperiment = () => new Promise(r => { resolve = r; });
  const pending = f.run('dom-body');
  f.tabs[0].wv.replaceDocument();
  resolve({ url: f.tabs[0].url, domWeirdAction: 'observed', authority: token, doors: [{ href: 'https://fixture.invalid/stale' }] });
  assert.equal((await pending).status, 'blocked');
  assert.equal((await f.run('grover-collapse')).status, 'blocked');
  await f.authority.dispose();
});

test('paused manual observation completes inside a bounded permit without restarting autonomy', async () => {
  const f = authorityFixture();
  const out = await f.run('dom-body');
  assert.equal(out.status, 'completed');
  assert.equal(out.evidence.authority.kind, 'manual');
  assert.equal(f.authority.snapshot().paused, true);
  assert.equal(f.authority.snapshot().manuals, 0);
  assert.equal(f.authority.leaseFor('t1'), null);
  assert.equal(f.authority.isCurrent(out.evidence.authority), false);
  assert.equal(f.context.aliveOverdrive.running, false);
  await f.authority.dispose();
});

test('hiding the host cancels an already-paused manual observation without resuming on return', async () => {
  const f = authorityFixture();
  let resolve, started, token;
  const entered = new Promise(done => { started = done; });
  f.context.performWeirdAlienDomExperiment = (tab, options) => {
    token = options.authorityToken; started();
    return new Promise(done => { resolve = done; });
  };
  const pending = f.run('dom-body');
  await entered;
  f.setHidden(true);
  assert.equal(f.authority.isCurrent(token), false);
  resolve({ url: f.tabs[0].url, domWeirdAction: 'observed', authority: token, doors: [] });
  assert.notEqual((await pending).status, 'completed');
  f.setHidden(false);
  assert.equal(f.context.aliveOverdrive.running, false);
  assert.equal(f.authority.snapshot().paused, true);
  assert.equal(f.authority.leaseFor('t1'), null);
  await f.authority.dispose();
});

test('portal uses the observed selected door and caps tab creation while respecting Auto-Hop', async () => {
  const f = fixture();
  await f.run('dom-body');
  await f.run('grover-collapse');
  const out = await f.run('portal-jump');
  assert.equal(out.evidence.url, 'https://fixture.invalid/selected');
  assert.equal(f.created(), 1);
  f.context.alienAutoNavigateLinks = false;
  f.advance(20000);
  assert.equal((await f.run('portal-jump')).status, 'blocked');
  assert.equal((await f.run('epoch-handoff')).status, 'blocked');
  assert.equal(f.created(), 1);
  f.context.alienAutoNavigateLinks = true;
  while (f.tabs.length < 4) f.tabs.push({ ...f.tabs[0], id: 'extra' + f.tabs.length });
  await f.run('portal-jump');
  assert.equal(f.tabs.length, 4);
});

test('stale page observations cannot provide Grover targets', async () => {
  const f = fixture();
  await f.run('dom-body');
  f.tabs[0].url = f.tabs[0].committedUrl = 'https://fixture.invalid/changed';
  assert.equal((await f.run('grover-collapse')).status, 'blocked');
});

test('dream prerequisites remain blocked through the adapter rather than appearing completed', async () => {
  const f = fixture();
  const out = await f.run('dream');
  assert.equal(out.status, 'blocked');
  assert.equal(out.reason, 'Need observations');
});

test('brain and precision readouts report instantiated objects rather than expected constants', async () => {
  const f = fixture();
  const out = await f.run('brains-precision');
  assert.equal(out.evidence.brains, 2);
  assert.equal(out.evidence.precisionBytes, 64);
});

test('backend probe cannot reuse a stale simulated Tor-ready flag', async () => {
  const f = fixture();
  assert.equal((await f.run('onion')).status, 'unavailable');
  const out = await f.run('deep-dark-dive');
  assert.equal(out.status, 'unavailable');
  assert.equal(f.h.deepDarkWebSubstrateEngine.localTorSocksActive, false);
  assert.equal((await f.run('onion')).evidence.localTorSocksActive, false);
});

for (const transition of ['tab selection', 'same-URL document replacement']) {
  test(`late onion receipt cannot survive ${transition}`, async () => {
    const f = authorityFixture();
    const onion = 'http://' + 'a'.repeat(56) + '.onion/';
    f.tabs[0].url = f.tabs[0].committedUrl = onion;
    await f.authority.setPaused(false);
    let resolve;
    f.context.ipcRenderer.invoke = () => new Promise(r => { resolve = r; });
    const pending = f.run('deep-dark-dive');
    if (transition === 'tab selection') {
      f.tabs.push(f.installGuest({ id: 't2', domReady: true, url: 'https://public.example/' }));
      f.context.switchTab('t2');
    } else f.tabs[0].wv.replaceDocument();
    resolve({ ok: true, socksHandshakeVerified: true, torPacApplied: true,
      addressValidation: { valid: true, hostname: 'a'.repeat(56) + '.onion' },
      navigation: { networkVerified: true, onion: true, url: onion } });
    const outcome = await pending;
    assert.equal(outcome.evidence.socksHandshakeVerified, true);
    assert.equal(outcome.evidence.navigation, null);
    assert.match(outcome.evidence.pageReceiptStatus, /discarded/);
    assert.equal(f.h.deepDarkWebSubstrateEngine.torV3OnionAddress, '');
    assert.notEqual(f.h.deepDarkWebSubstrateEngine.activeDeepLayerName, 'ONION_DOCUMENT_OBSERVED');
    await f.authority.dispose();
  });
}

test('current onion receipt retains its document-scoped evidence', async () => {
  const f = authorityFixture();
  const onion = 'http://' + 'a'.repeat(56) + '.onion/';
  f.tabs[0].url = f.tabs[0].committedUrl = onion;
  await f.authority.setPaused(false);
  f.context.ipcRenderer.invoke = async () => ({ ok: true, socksHandshakeVerified: true, torPacApplied: true,
    addressValidation: { valid: true, hostname: 'a'.repeat(56) + '.onion' },
    navigation: { networkVerified: true, onion: true, url: onion } });
  const outcome = await f.run('deep-dark-dive');
  assert.equal(outcome.evidence.navigation.url, onion);
  assert.equal(f.h.deepDarkWebSubstrateEngine.activeDeepLayerName, 'ONION_DOCUMENT_OBSERVED');
  f.context.invalidateAliveTransportPage('new navigation');
  assert.equal(outcome.evidence.navigation, null);
  assert.equal(outcome.evidence.socksHandshakeVerified, true);
  assert.equal(f.h.deepDarkWebSubstrateEngine.torV3OnionAddress, '');
  assert.equal(f.h.deepDarkWebSubstrateEngine.activeDeepLayerName, 'SOCKS_ROUTE_READY / PAGE_UNVERIFIED');
  await f.authority.dispose();
});

test('recurring transport evidence reads cached identity without synchronous guest or full model diagnostics', () => {
  const f = fixture();
  const calls = [];
  const forbidden = name => () => { calls.push(name); throw new Error('Unexpected diagnostic: ' + name); };
  f.context.safeGetUrl = forbidden('safeGetUrl');
  f.tabs[0].wv.getURL = forbidden('getURL');
  f.context.AliveGuestExecution = { pendingSnapshot: forbidden('pendingSnapshot'), documentIdentity: forbidden('documentIdentity') };
  f.context.aliveAuthority = { snapshot: forbidden('authority') };
  f.context.aliveResearch = { snapshot: forbidden('research') };
  f.context.aliveAutosave = { snapshot: forbidden('autosave') };
  f.context.aliveOverdrive.snapshot = forbidden('controller');
  f.context.getAliveRuntimeEvidence = forbidden('full runtime');
  for (let i = 0; i < 20; i++) {
    const evidence = f.context.getAliveTransportEvidence();
    assert.deepEqual(Object.keys(evidence).sort(), ['activeLastNavStartTs', 'activeLoading', 'activeReady', 'activeTabId', 'activeUrl', 'lastBackendProbe']);
    assert.equal(evidence.activeUrl, 'https://fixture.invalid/page');
    assert.equal(evidence.activeReady, true);
    assert.equal(evidence.activeLoading, false);
  }
  assert.deepEqual(calls, []);
});

test('requested, failed, frozen, and unavailable pages cannot be reported as ready committed onion documents', async () => {
  const onion = 'http://' + 'a'.repeat(56) + '.onion/';
  for (const state of [{ domReady: false, committedUrl: '', mainFrameNavigating: true },
    { terminalLoadFailure: true }, { frozen: true }, { guestUnavailable: true }, { domReady: false }]) {
    const f = fixture();
    Object.assign(f.tabs[0], { url: onion, committedUrl: onion, isLoading: false }, state);
    let requestedOnion;
    f.context.ipcRenderer.invoke = async (_channel, payload) => {
      requestedOnion = payload.onion;
      return { ok: true, socksHandshakeVerified: true, torPacApplied: true,
        navigation: { url: onion, onion: true, networkVerified: true, status: 'loaded' } };
    };
    const result = await f.run('deep-dark-dive');
    const evidence = f.context.getAliveTransportEvidence();
    assert.equal(evidence.activeReady, false);
    assert.equal(evidence.activeLoading, Boolean(state.mainFrameNavigating), 'unavailable/frozen is not an active load');
    assert.equal(evidence.activeUrl, state.committedUrl ?? onion);
    assert.equal(requestedOnion, '');
    assert.equal(result.evidence.navigation, null);
    assert.equal((await f.run('dom-body')).status, 'blocked');
  }
  const f = fixture();
  f.tabs[0].url = onion; // A proposal without a main-frame commit is not provenance.
  assert.equal(f.context.getAliveTransportEvidence().activeUrl, 'https://fixture.invalid/page');
  assert.equal((await f.run('dom-body')).status, 'blocked', 'guest URL must match actual committed document');
});

test('late backend receipt is discarded during a same-URL pending navigation', async () => {
  const f = fixture();
  f.tabs[0].url = f.tabs[0].committedUrl = 'http://' + 'a'.repeat(56) + '.onion/';
  let resolve;
  f.context.ipcRenderer.invoke = () => new Promise(done => { resolve = done; });
  const pending = f.run('deep-dark-dive');
  Object.assign(f.tabs[0], { domReady: false, mainFrameNavigating: true, isLoading: false });
  resolve({ ok: true, socksHandshakeVerified: true, torPacApplied: true,
    navigation: { url: f.tabs[0].url, onion: true, networkVerified: true, status: 'loaded' } });
  const result = await pending;
  assert.equal(result.evidence.socksHandshakeVerified, true, 'transport facts remain independent');
  assert.equal(result.evidence.navigation, null, 'document facts are discarded');
});

test('declined portal navigation cannot claim completion or mark an unvisited target visited', async () => {
  const f = fixture();
  while (f.tabs.length < 4) f.tabs.push({ ...f.tabs[0], id: 'extra' + f.tabs.length });
  let recorded = 0;
  f.h.recordVisitedUrl = () => { recorded++; };
  f.context.dispatchNonBlockingTabNavigation = () => false;
  const result = await f.run('portal-jump');
  assert.equal(result.status, 'blocked');
  assert.equal(recorded, 0);
  assert.equal(f.context.alienBrainDoorsCount, 0);
});


test('DSD reports local mutation separately when every guest result is unconfirmed', async () => {
  const f = fixture();
  f.context.triggerPrimarkDecursiveSelfDeduplicationBurst = async () => ({ totalSelfDeduplicationsCount: 7,
    lastDomOutcome: { attempted: 2, confirmed: 0, quotients: 0 } });
  const result = await f.run('decursive');
  assert.equal(result.status, 'completed');
  assert.equal(result.evidence.localMutation, true);
  assert.equal(result.evidence.guest.confirmed, 0);
  assert.equal(result.evidence.guest.quotients, 0);
});

test('Zalgo cannot claim page application from a local-only mutation', async () => {
  const f = fixture();
  f.context.triggerEldritchZalgoBrowserFuckery = async () => ({ ok: true, localMutation: true, pageApplied: false,
    reason: 'Local morphology changed; page effect was not confirmed' });
  const result = await f.run('zalgo');
  assert.equal(result.status, 'completed');
  assert.equal(result.evidence.pageApplied, false);
  assert.match(result.evidence.effect, /unconfirmed/);
  f.context.triggerEldritchZalgoBrowserFuckery = async () => null;
  assert.equal((await f.run('zalgo')).status, 'blocked');
});

test('Neo records delegated requests and missing guest confirmations as observations', async () => {
  const f = fixture();
  f.context.stepNeoMatrixBrowserPuppeteer = async () => ({ ok: true, queued: ['dream'], requested: ['dream'] });
  assert.equal((await f.run('neo')).status, 'observed');
  f.context.stepNeoMatrixBrowserPuppeteer = async () => ({ ok: true, pageEffectsAttempted: 2, pageEffectsConfirmed: 0 });
  assert.equal((await f.run('neo')).status, 'observed');
  f.context.stepNeoMatrixBrowserPuppeteer = async () => ({ ok: true, pageEffectsAttempted: 2, pageEffectsConfirmed: 2 });
  assert.equal((await f.run('neo')).status, 'completed');
});

test('blocked guest permits remain blocked through DSD, Zalgo, and Neo adapters', async () => {
  const f = fixture();
  for (const [id, method] of [['decursive', 'triggerPrimarkDecursiveSelfDeduplicationBurst'],
    ['zalgo', 'triggerEldritchZalgoBrowserFuckery'], ['neo', 'stepNeoMatrixBrowserPuppeteer']]) {
    f.context[method] = async () => ({ status: 'blocked', reason: 'Guest lease is not current' });
    const out = await f.run(id);
    assert.equal(out.status, 'blocked');
    assert.equal(out.reason, 'Guest lease is not current');
  }
});

function restoreFixture(failure, configure) {
  const f = fixture(configure), events = [];
  Object.assign(f.h, { agentId: 'restore-fixture', authorityEpoch: 5, stageIdx: 1,
    checkpointCid: 'old-cid', W_actor: new Float32Array([1, 2, 3]) });
  const record = { cid: 'verified-cid', manifest: {
    metadata: { agentId: 'restore-fixture', body: { bodyCid: 'restored-body', limbs: [3, 5, 8] },
      policyCid: 'restored-policy', stageIdx: 4, authorityEpoch: 8 }, scope: 'fixture tensors'
  } };
  const db = {
    transaction(name, mode) {
      assert.equal(name, 'snapshots'); assert.equal(mode, 'readonly');
      return { objectStore(storeName) {
        assert.equal(storeName, 'snapshots');
        return { get(key) {
          assert.equal(key, 'latest');
          const request = { result: record };
          queueMicrotask(() => request.onsuccess());
          return request;
        } };
      } };
    },
    close() { events.push('database-closed'); }
  };
  f.context.structuredClone = structuredClone;
  f.context.indexedDB = { open(name, version) {
    assert.equal(name, 'gigachad-alive-checkpoints'); assert.equal(version, 1);
    const request = { result: db };
    queueMicrotask(() => request.onsuccess());
    return request;
  } };
  let yieldedAfterApply = false, saves = 0, cancels = 0;
  const inspect = () => ({ weights: [...f.h.W_actor], body: structuredClone(f.h.bodyRecipe),
    policy: f.h.policyCid, stage: f.h.stageIdx, epoch: f.h.authorityEpoch, cid: f.h.checkpointCid });
  const expected = { weights: [9, 8, 7], body: structuredClone(record.manifest.metadata.body),
    policy: 'restored-policy', stage: 4, epoch: 9, cid: 'verified-cid' };
  f.context.AliveCheckpoints = {
    async verify(value) {
      assert.equal(value, record); events.push('verify');
      if (failure === 'verification') throw new Error('Checkpoint verification failed');
      return { cid: value.cid, tensorCount: 1 };
    },
    applyVerified(value, roots) {
      assert.equal(value, record); assert.equal(roots.policy, f.h); events.push('apply');
      if (failure === 'shape') throw new Error('Checkpoint tensor shape mismatch');
      roots.policy.W_actor.set([9, 8, 7]);
      queueMicrotask(() => { yieldedAfterApply = true; });
      return { applied: 1 };
    }
  };
  f.context.aliveAutosave = { cancel() {
    cancels++; events.push('cancel');
    assert.deepEqual(inspect(), expected, 'autosave fencing must see the fully restored model and identity');
    assert.equal(yieldedAfterApply, false, 'no old worker callback may interleave between apply and cancel');
  } };
  f.h.savePersistentGenome = () => {
    saves++; events.push('save');
    assert.equal(cancels, 1, 'prior background serialization is fenced before requesting the restored save');
    assert.deepEqual(inspect(), expected);
    assert.equal(yieldedAfterApply, false, 'the restored save request belongs to the same synchronous apply block');
  };
  return { ...f, record, events, inspect, expected, saves: () => saves, cancels: () => cancels };
}

test('verified restore fences prior autosave only after complete state application and requests one new save', async () => {
  const f = restoreFixture();
  const result = await f.context.restoreAliveCheckpoint();
  assert.equal(result.status, 'completed');
  assert.deepEqual(f.inspect(), f.expected);
  assert.notEqual(f.h.bodyRecipe, f.record.manifest.metadata.body, 'restored body is cloned');
  assert.deepEqual(f.events, ['database-closed', 'verify', 'apply', 'cancel', 'save']);
  assert.equal(f.cancels(), 1); assert.equal(f.saves(), 1);
  assert.equal(f.context.__aliveCheckpointRestore, false);
});

function durableRestoreFixture() {
  const f = restoreFixture(), waits = {};
  for (const key of ['drain', 'save']) waits[key] = {};
  for (const item of Object.values(waits)) item.promise = new Promise(resolve => { item.resolve = resolve; });
  let settled = false;
  f.context.aliveGenomePersistence = {};
  f.context.AliveCheckpoints.preflight = () => f.events.push('preflight');
  f.context.aliveAutosave = {
    async cancelAndDrain() { f.events.push('drain'); const result = await waits.drain.promise; settled = result.settled; return result; },
    resume() { f.events.push('resume'); return settled; },
    async flush(reason) { assert.equal(reason, 'checkpoint-restored'); f.events.push('durable-save'); assert.deepEqual(f.inspect(), f.expected); return waits.save.promise; }
  };
  return { ...f, waits, settle: async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); } };
}

test('durable restore waits for physical fence before apply and verified restored publication before completion', async () => {
  const f = durableRestoreFixture(), before = f.inspect();
  const result = f.context.restoreAliveCheckpoint(); await f.settle();
  assert.deepEqual(f.inspect(), before); assert.equal(f.events.at(-1), 'drain');
  f.waits.drain.resolve({ settled: true }); await f.settle();
  assert.deepEqual(f.inspect(), f.expected); assert.equal(f.events.at(-1), 'durable-save');
  assert.equal(f.context.__aliveCheckpointRestore, true);
  f.waits.save.resolve({ status: 'persisted', persistenceVerified: true });
  assert.equal((await result).status, 'completed');
  assert.equal(f.context.__aliveCheckpointRestore, false);
  assert.ok(f.events.indexOf('drain') < f.events.indexOf('apply'));
});

test('failed durable fence or new guest work after fence cannot apply checkpoint state', async () => {
  for (const mode of ['failed-fence', 'new-guest']) {
    const f = durableRestoreFixture(), before = f.inspect();
    const result = f.context.restoreAliveCheckpoint(); await f.settle();
    if (mode === 'new-guest') f.context.AliveGuestExecution = { pendingCount: () => 1 };
    f.waits.drain.resolve({ settled: mode !== 'failed-fence' });
    assert.equal((await result).status, 'blocked'); assert.deepEqual(f.inspect(), before);
    assert.equal(f.events.includes('apply'), false); assert.equal(f.events.includes('durable-save'), false);
  }
});

test('durable restore shape preflight fails before storage fencing or model mutation', async () => {
  const f = durableRestoreFixture(), before = f.inspect();
  f.context.AliveCheckpoints.preflight = () => { throw new Error('fixture shape mismatch'); };
  await assert.rejects(f.context.restoreAliveCheckpoint(), /shape mismatch/);
  assert.deepEqual(f.inspect(), before); assert.equal(f.events.includes('drain'), false);
});

test('restored model with failed durable publication reports the distinction instead of verified completion', async () => {
  const f = durableRestoreFixture(), result = f.context.restoreAliveCheckpoint(); await f.settle();
  f.waits.drain.resolve({ settled: true }); await f.settle();
  f.waits.save.resolve({ status: 'failed', persistenceVerified: false, error: 'fixture disk full' });
  const outcome = await result;
  assert.equal(outcome.status, 'error'); assert.equal(outcome.evidence.modelRestored, true);
  assert.deepEqual(f.inspect(), f.expected); assert.equal(outcome.evidence.genomePersistence.persistenceVerified, false);
});

test('shutdown during restore drainage cannot apply the checkpoint or reopen save admission', async () => {
  const f = durableRestoreFixture(), before = f.inspect();
  const result = f.context.restoreAliveCheckpoint(); await f.settle();
  f.context.__alivePersistenceClosing = true;
  f.waits.drain.resolve({ settled: true });
  assert.equal((await result).status, 'blocked'); assert.deepEqual(f.inspect(), before);
  assert.equal(f.events.includes('resume'), false); assert.equal(f.events.includes('apply'), false);
  assert.equal((await f.context.restoreAliveCheckpoint()).status, 'blocked');
});

test('restore rechecks guest work after asynchronous verification before applying any tensor', async () => {
  const f = restoreFixture(), before = f.inspect();
  let pending = 0;
  f.context.AliveGuestExecution = { pendingCount: () => pending };
  const originalVerify = f.context.AliveCheckpoints.verify;
  f.context.AliveCheckpoints.verify = async value => {
    const verified = await originalVerify(value);
    pending = 1;
    return verified;
  };
  const result = await f.context.restoreAliveCheckpoint();
  assert.equal(result.status, 'blocked');
  assert.deepEqual(f.inspect(), before);
  assert.equal(f.events.includes('apply'), false);
  assert.equal(f.cancels(), 0);
  assert.equal(f.saves(), 0);
  assert.equal(f.context.__aliveCheckpointRestore, false);
});

for (const timing of ['initial admission', 'after verification']) {
  for (const cleanup of [{ status: 'pending', unresolved: [] }, { status: 'blocked', unresolved: [] }, { status: 'completed', unresolved: [{ tabId: 'unacknowledged' }] }]) {
    test(`checkpoint restore rejects ${cleanup.status} cleanup at ${timing}`, async () => {
      let snapshot = { paused: true, transitioning: false, manuals: 0, cleanup: { status: 'idle', unresolved: [] } };
      const f = restoreFixture(undefined, context => { context.AliveAuthority = { create: () => ({ snapshot: () => snapshot }) }; });
      const before = f.inspect();
      if (timing === 'initial admission') snapshot = { ...snapshot, cleanup };
      else {
        const verify = f.context.AliveCheckpoints.verify;
        f.context.AliveCheckpoints.verify = async value => { const result = await verify(value); snapshot = { ...snapshot, cleanup }; return result; };
      }
      const result = await f.context.restoreAliveCheckpoint();
      assert.equal(result.status, 'blocked');
      assert.deepEqual(f.inspect(), before);
      assert.equal(f.events.includes('apply'), false);
      assert.equal(f.cancels(), 0); assert.equal(f.saves(), 0);
    });
  }
}

for (const failure of ['verification', 'shape']) test(`${failure} failure leaves live model and storage scheduling untouched`, async () => {
  const f = restoreFixture(failure), before = f.inspect(), bodyReference = f.h.bodyRecipe;
  await assert.rejects(f.context.restoreAliveCheckpoint(), failure === 'verification' ? /verification failed/ : /shape mismatch/);
  assert.deepEqual(f.inspect(), before);
  assert.equal(f.h.bodyRecipe, bodyReference);
  assert.equal(f.cancels(), 0); assert.equal(f.saves(), 0);
  assert.deepEqual(f.events, failure === 'verification'
    ? ['database-closed', 'verify'] : ['database-closed', 'verify', 'apply']);
  assert.equal(f.context.__aliveCheckpointRestore, false, 'failed restores release the restore fence');
});

function researchFixture(configure) {
  let wallNow = 100000, stops = 0;
  const saved = new Map(), events = [], navigations = [];
  const f = fixture(context => {
    context.Date = class extends Date { static now() { return wallNow; } };
    context.AliveResearchPolicy = { ...AliveResearchPolicy, create: options => AliveResearchPolicy.create({ ...options, now: () => wallNow }) };
    context.localStorage = { getItem: key => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) };
    context.chromeCrawlerState = {};
    context.dispatchEvent = event => events.push(event.detail);
    context.ALIEN_RABBIT_HOLES = [];
    context.POLYMATH_SEARCH_ENGINES = [];
    Object.assign(context.tabs[0], { url: 'https://origin.example/start', committedUrl: 'https://origin.example/start', isLoading: false,
      lastNavStartTs: wallNow - 30000, lastDomReadyTs: wallNow - 20000 });
    context.tabs[0].wv.stop = () => { stops++; };
    context.performWeirdAlienDomExperiment = async tab => ({ url: tab.url,
      title: 'Archival manuscripts and cryptographic puzzles',
      doors: [{ href: 'https://discovery.example/manuscript', text: 'Previously unknown manuscript archive', score: 9 }],
      specimens: ['Researchers catalogue handwritten ciphers and cultural archives.'],
      researchExcerpt: 'Public archival research text with recorded provenance.', domWeirdAction: 'observed' });
    const create = context.createTab;
    context.createTab = (url, options) => {
      const tab = create(url, options);
      Object.assign(tab, { committedUrl: '', domReady: false, isLoading: true, lastNavStartTs: wallNow, lastDomReadyTs: 0 });
      return tab;
    };
    context.dispatchNonBlockingTabNavigation = (tab, url) => {
      navigations.push({ tabId: tab.id, url });
      Object.assign(tab, { url, domReady: false, isLoading: true, lastNavStartTs: wallNow, lastDomReadyTs: 0 });
      return true;
    };
    configure?.(context);
  });
  return { ...f, saved, events, navigations, stops: () => stops, now: () => wallNow,
    advance: ms => { wallNow += ms; f.advance(ms); },
    ready: () => { const tab = f.context.getActiveTab(); Object.assign(tab, { committedUrl: tab.url, domReady: true, mainFrameNavigating: false, isLoading: false, lastDomReadyTs: wallNow }); return tab; } };
}

test('research adapter credits real destination observation and persists learned weights, not a dispatched tab', async () => {
  const f = researchFixture();
  assert.equal((await f.run('dom-body')).status, 'completed');
  assert.equal(f.context.aliveResearch.snapshot().visitedPages, 1);
  const dispatched = await f.run('portal-jump');
  assert.equal(dispatched.status, 'completed');
  assert.equal(dispatched.evidence.navigation, 'dispatched; page load not yet verified');
  assert.equal(f.context.aliveResearch.snapshot().visitedPages, 1);
  assert.equal(f.context.aliveResearch.snapshot().modelUpdates, 0);
  assert.equal(f.context.aliveResearch.snapshot().pending.url, dispatched.evidence.url);
  f.ready();
  const arrived = await f.run('dom-body');
  assert.equal(arrived.evidence.research.learned, true);
  assert.equal(f.context.aliveResearch.snapshot().visitedPages, 2);
  assert.equal(f.context.aliveResearch.snapshot().modelUpdates, 1);
  assert.equal(f.context.aliveResearch.snapshot().pending, null);
  const saved = JSON.parse(f.saved.get('gigachad_alive_research_v1'));
  assert.equal(saved.model.counters[0], 1);
  assert.equal(saved.visits.find(page => page.url === dispatched.evidence.url).excerpt, 'Public archival research text with recorded provenance.');
  assert.ok(f.events.some(event => event.type === 'arrival-observed'));
  await f.run('dom-body');
  assert.equal(f.context.aliveResearch.snapshot().modelUpdates, 1, 'repeated observation cannot create another arrival reward');
});

test('research admission follows verified settled content rather than a fixed fifteen-second wait', async () => {
  const f = researchFixture(context => { Object.assign(context.tabs[0], { lastNavStartTs: 100000, lastDomReadyTs: 100000 }); });
  const adapter = f.context.aliveOverdrive.jobs.get('portal-jump').adapter;
  await f.run('dom-body');
  f.advance(2000); await f.run('dom-body');
  // One unchanged observation is not settled evidence; the 5 s reading floor holds.
  assert.notEqual(adapter.ready(), true);
  f.advance(2000); await f.run('dom-body');
  // Two unchanged observations over 3.5 s settle the page; the fast forager leaves
  // after its 2.5 s settled dwell instead of the former six-second hold.
  assert.equal(adapter.ready(), true);
  assert.equal((await f.run('portal-jump')).status, 'completed');
  assert.equal(f.created(), 1);
  assert.equal(f.context.aliveResearch.snapshot().observations, 1);
  assert.equal(f.context.aliveResearch.snapshot().modelUpdates, 0);
});

test('redirect timeout recovery survives scheduler preflight and dispatch recheck', async () => {
  const f = researchFixture();
  await f.run('dom-body');
  const first = await f.run('portal-jump');
  assert.equal(first.status, 'completed');
  f.advance(26000);
  const target = f.context.getActiveTab();
  target.wv.stop = () => {};
  Object.assign(target, { url: 'https://discovery.example/redirect-loop', lastNavStartTs: f.now() - 100 });
  f.context.aliveResearch.enqueue([{ url: 'https://recovery.example/archive', title: 'Other archive' }]);
  const adapter = f.context.aliveOverdrive.jobs.get('portal-jump').adapter;
  assert.equal(adapter.ready(), true);
  const result = await f.run('portal-jump');
  assert.equal(result.status, 'completed'); assert.equal(result.evidence.recovery, true);
  assert.equal(result.evidence.url, 'https://recovery.example/archive');
  assert.equal(f.created(), 1, 'reuses the stalled tab');
  assert.equal(f.navigations.length, 1);
  assert.equal(f.context.aliveResearch.snapshot().modelUpdates, 1);
  assert.equal(f.context.aliveResearch.snapshot().lastReward, -.75);
});

test('split-pane observation has separate evidence without crediting secondary content to primary research', async () => {
  const calls = [];
  const f = researchFixture(context => {
    context.observeAliveSecondaryPane = async options => { calls.push(options); return { status: 'observed',
      url: 'https://secondary.example/', colliders: 5, researchExcerpt: 'A different page.' }; };
  });
  const result = await f.run('dom-body');
  assert.equal(result.status, 'completed');
  assert.equal(result.evidence.secondary.url, 'https://secondary.example/');
  assert.equal(calls.length, 1); assert.ok(calls[0].signal);
  assert.equal(f.context.aliveResearch.snapshot().visitedPages, 1);
  assert.equal(f.context.aliveResearch.snapshot().recentPages[0].url, f.context.getActiveTab().url);
  assert.equal(f.context.aliveResearch.snapshot().modelUpdates, 0);
});

test('unavailable split-pane observation preserves the verified primary result', async () => {
  const f = researchFixture(context => { context.observeAliveSecondaryPane = async () => { throw new Error('Secondary page replaced'); }; });
  const result = await f.run('dom-body');
  assert.equal(result.status, 'completed');
  assert.equal(result.evidence.secondary.status, 'unavailable');
  assert.match(result.evidence.secondary.reason, /replaced/);
  assert.equal(f.context.aliveResearch.snapshot().visitedPages, 1);
});

test('primary navigation during split observation fences the delayed primary reward', async () => {
  let finish, began;
  const started = new Promise(resolve => { began = resolve; });
  const f = researchFixture(context => { context.observeAliveSecondaryPane = () => { began(); return new Promise(resolve => { finish = resolve; }); }; });
  const pending = f.run('dom-body');
  await started;
  f.context.getActiveTab().lastNavStartTs++;
  finish({ status: 'observed', url: 'https://secondary.example/' });
  const result = await pending;
  assert.equal(result.status, 'blocked');
  assert.equal(result.reward, undefined);
  assert.equal(f.context.aliveResearch.snapshot().modelUpdates, 0);
});

test('research adapter escapes a stalled load in the same tab only with Auto-Hop enabled', async () => {
  const f = researchFixture(context => {
    context.ALIEN_RABBIT_HOLES = [{ url: 'https://recovery.example/archive', title: 'Recovery archive' }];
    Object.assign(context.tabs[0], { url: 'https://stalled.example/', domReady: false, isLoading: true,
      lastNavStartTs: 70000, lastDomReadyTs: 0 });
    context.alienAutoNavigateLinks = false;
  });
  assert.equal((await f.run('portal-jump')).status, 'blocked');
  assert.equal(f.stops(), 0); assert.equal(f.created(), 0); assert.equal(f.navigations.length, 0);
  f.context.alienAutoNavigateLinks = true;
  const result = await f.run('portal-jump');
  assert.equal(result.status, 'completed'); assert.equal(result.evidence.recovery, true);
  assert.equal(f.stops(), 1); assert.equal(f.created(), 0);
  assert.equal(f.navigations.length, 1); assert.equal(f.navigations[0].tabId, 't1');
  assert.equal(f.context.aliveResearch.snapshot().visitedPages, 0);
});

test('aborted loading without a new DOM cannot reuse observations but recovers after its bounded deadline', async () => {
  const f = researchFixture();
  await f.run('dom-body');
  const tab = f.tabs[0], adapter = f.context.aliveOverdrive.jobs.get('portal-jump').adapter;
  Object.assign(tab, { domReady: false, mainFrameNavigating: true, isLoading: false, lastNavStartTs: f.now() });
  assert.equal((await f.run('grover-collapse')).status, 'blocked');
  assert.equal((await f.run('research-plan')).status, 'blocked');
  assert.notEqual(adapter.ready(), true);
  f.advance(25001);
  tab.lastUserNavTs = f.now();
  assert.notEqual(adapter.ready(), true, 'recent user navigation retains its grace period');
  tab.lastUserNavTs = f.now() - 15001;
  tab.pinned = true;
  assert.notEqual(adapter.ready(), true, 'protected pages remain protected');
  tab.pinned = false;
  f.context.alienAutoNavigateLinks = false;
  assert.notEqual(adapter.ready(), true, 'Auto-Hop off remains authoritative');
  f.context.alienAutoNavigateLinks = true;
  assert.equal(adapter.ready(), true);
  const result = await f.run('portal-jump');
  assert.equal(result.status, 'completed'); assert.equal(result.evidence.recovery, true);
  assert.equal(f.navigations.length, 1); assert.equal(f.navigations[0].tabId, tab.id);
  assert.equal(f.created(), 0); assert.equal(f.stops(), 0, 'already stopped guest needs no extra stop');
  assert.equal(f.context.aliveResearch.snapshot().visitedPages, 1);
});

test('research adapter learns a browser navigation failure once and never records it as a visited page', async () => {
  const f = researchFixture();
  await f.run('dom-body');
  const result = await f.run('portal-jump');
  const failure = { tabId: result.evidence.tab, url: result.evidence.url, reason: 'ERR_NAME_NOT_RESOLVED' };
  assert.equal(f.context.aliveResearchNavigationFailed(failure).status, 'failed');
  assert.equal(f.context.aliveResearchNavigationFailed(failure).status, 'ignored');
  const snapshot = f.context.aliveResearch.snapshot();
  assert.equal(snapshot.visitedPages, 1); assert.equal(snapshot.modelUpdates, 1); assert.equal(snapshot.lastReward, -.75);
  assert.equal(snapshot.pending, null);
  assert.equal(f.events.filter(event => event.type === 'arrival-failed').length, 1);
  assert.equal(JSON.parse(f.saved.get('gigachad_alive_research_v1')).model.counters[0], 1);
});

test('research adapter accepts a local planner proposal as candidate data without navigation or fabricated learning', async () => {
  const calls = [];
  const f = researchFixture(context => {
    context.POLYMATH_SEARCH_ENGINES = [{ name: 'Archive search', buildUrl: q => 'https://search.example/?q=' + encodeURIComponent(q) }];
    context.ipcRenderer.invoke = async (channel, payload) => {
      calls.push({ channel, payload });
      return { status: 'completed', model: 'fixture-local-model', backend: 'local', durationMs: 7,
        proposal: { goal: 'Compare archival ciphers', hypothesis: 'Symbols may repeat across manuscripts', queries: ['manuscript symbol inventories'], preferredUrl: payload.candidates[0].url }, scope: 'Model-generated proposal grounded in observed page data' };
    };
  });
  await f.run('dom-body');
  const before = f.context.aliveResearch.snapshot().frontierCount;
  const result = await f.run('research-plan');
  assert.equal(result.status, 'completed'); assert.equal(result.evidence.candidatesAdded, 1);
  assert.equal(calls[0].channel, 'alive-research-plan');
  assert.equal(calls[0].payload.observation.url, 'https://origin.example/start');
  assert.equal(calls[0].payload.observation.excerpt, 'Public archival research text with recorded provenance.');
  assert.equal(f.context.aliveResearch.snapshot().frontierCount, before + 1);
  assert.equal(f.context.aliveResearch.snapshot().modelUpdates, 0);
  assert.equal(f.created(), 0); assert.equal(f.navigations.length, 0);
  assert.equal(f.context.getAliveRuntimeEvidence().planner.proposal.hypothesis, 'Symbols may repeat across manuscripts');
});

test('research adapter rejects planner output after the source page changed or cancellation arrived', async () => {
  for (const change of ['navigation', 'same-URL pending', 'same-URL completed', 'abort']) {
    let resolve;
    const f = researchFixture(context => {
      context.POLYMATH_SEARCH_ENGINES = [{ name: 'Archive search', buildUrl: q => 'https://search.example/?q=' + encodeURIComponent(q) }];
      context.ipcRenderer.invoke = async () => new Promise(done => { resolve = done; });
    });
    await f.run('dom-body');
    const before = f.context.aliveResearch.snapshot().frontierCount, abort = new AbortController();
    const pending = f.context.aliveOverdrive.jobs.get('research-plan').adapter.run({ signal: abort.signal });
    if (change === 'navigation') Object.assign(f.context.getActiveTab(), { url: 'https://different.example/', domReady: false, mainFrameNavigating: true });
    else if (change === 'same-URL pending') Object.assign(f.context.getActiveTab(), { domReady: false, mainFrameNavigating: true });
    else if (change === 'same-URL completed') f.context.getActiveTab().lastNavStartTs = f.now();
    else abort.abort();
    resolve({ status: 'completed', proposal: { goal: 'Stale goal', hypothesis: 'Stale hypothesis', queries: ['stale query'] } });
    const result = await pending;
    assert.equal(result.status, 'blocked');
    assert.equal(f.context.aliveResearch.snapshot().frontierCount, before);
    assert.equal(f.context.getAliveRuntimeEvidence().planner, undefined);
  }
});

test('onion research dispatch requires fresh handshake and applied route evidence beyond legacy flags', async () => {
  const onion = 'http://' + 'a'.repeat(56) + '.onion/archive';
  const f = researchFixture(context => { context.ALIEN_RABBIT_HOLES = [{ url: onion, title: 'Publisher onion archive' }]; });
  f.context.ipcRenderer.invoke = async () => ({ ok: true, localTorSocksActive: true, torPacApplied: true });
  assert.equal((await f.run('deep-dark-dive')).status, 'unavailable');
  assert.equal((await f.run('portal-jump')).status, 'blocked');
  f.context.ipcRenderer.invoke = async () => ({ ok: true, socksHandshakeVerified: true, torPacApplied: true, checkedAt: f.now(),
    managedTor: { status: 'bootstrapping', bootstrapProgress: 50, bootstrapped: false } });
  assert.equal((await f.run('deep-dark-dive')).status, 'completed', 'SOCKS route is independently verified');
  assert.equal((await f.run('portal-jump')).status, 'blocked', 'onion research waits for the owned client to bootstrap');
  f.context.ipcRenderer.invoke = async () => ({ ok: true, socksHandshakeVerified: true, localTorSocksActive: true, torPacApplied: false, checkedAt: f.now() });
  assert.equal((await f.run('deep-dark-dive')).status, 'unavailable');
  assert.equal((await f.run('portal-jump')).status, 'blocked');
  f.context.ipcRenderer.invoke = async () => ({ ok: true, socksHandshakeVerified: true, torPacApplied: true, checkedAt: f.now() });
  assert.equal((await f.run('deep-dark-dive')).status, 'completed');
  const result = await f.run('portal-jump');
  assert.equal(result.status, 'completed'); assert.equal(result.evidence.url, onion);
  assert.equal(f.context.aliveResearch.snapshot().visitedPages, 0, 'proxy routing and dispatched tab do not prove onion arrival');
});

test('research ingestion retains the existing stale-document fence before memory or tensor updates', async () => {
  let resolve;
  const f = researchFixture(context => { context.performWeirdAlienDomExperiment = () => new Promise(done => { resolve = done; }); });
  const pending = f.run('dom-body');
  Object.assign(f.tabs[0], { url: 'https://replacement.example/', domReady: false, mainFrameNavigating: true });
  resolve({ url: 'https://origin.example/start', title: 'Old document', specimens: ['old data'], doors: [], domWeirdAction: 'observed' });
  assert.equal((await pending).status, 'blocked');
  assert.equal(f.context.aliveResearch.snapshot().observations, 0);
  assert.equal(f.context.aliveResearch.snapshot().modelUpdates, 0);
});

test('pausing coordinated research cancels pending navigation credit and persists without a fabricated reward', async () => {
  const f = researchFixture();
  await f.run('dom-body'); await f.run('portal-jump');
  assert.ok(f.context.aliveResearch.snapshot().pending);
  f.context.aliveOverdrive.stop();
  assert.equal(f.context.aliveResearch.snapshot().pending, null);
  assert.equal(f.context.aliveResearch.snapshot().modelUpdates, 0);
  assert.ok(f.saved.has('gigachad_alive_research_v1'));
});

test('research adapter acknowledges a host-attested redirect to existing content rather than timing it out', async () => {
  const f = researchFixture();
  await f.run('dom-body');
  const dispatched = await f.run('portal-jump'), target = f.context.getActiveTab();
  target.aliveRedirectFrom = dispatched.evidence.url;
  target.url = 'https://origin.example/start';
  target.aliveRedirectTarget = target.url;
  f.ready();
  const result = await f.run('dom-body');
  assert.equal(result.evidence.research.status, 'duplicate');
  assert.equal(result.evidence.research.learned, true);
  assert.equal(f.context.aliveResearch.snapshot().pending, null);
  assert.equal(f.context.aliveResearch.snapshot().visitedPages, 1);
  assert.equal(f.context.aliveResearch.snapshot().lastReward, -.25);
  assert.equal(JSON.parse(f.saved.get('gigachad_alive_research_v1')).model.counters[0], 1);
});

test('research adapter cannot credit a claimed redirect source when the attested target differs', async () => {
  const f = researchFixture();
  await f.run('dom-body');
  const dispatched = await f.run('portal-jump'), target = f.context.getActiveTab();
  target.aliveRedirectFrom = dispatched.evidence.url;
  target.aliveRedirectTarget = 'https://attested.example/other';
  target.url = 'https://unrelated.example/page'; f.ready();
  const result = await f.run('dom-body');
  assert.equal(result.evidence.research.learned, false);
  assert.equal(f.context.aliveResearch.snapshot().modelUpdates, 0);
  assert.equal(f.context.aliveResearch.snapshot().pending.url, dispatched.evidence.url);
});

test('supersession cancellation helper only cancels the matching research tab without training', async () => {
  const f = researchFixture();
  await f.run('dom-body');
  const dispatched = await f.run('portal-jump');
  f.context.cancelAliveResearchNavigation('unrelated-tab', 'Different tab changed');
  assert.equal(f.context.aliveResearch.snapshot().pending.url, dispatched.evidence.url);
  const target = f.context.getActiveTab();
  target.aliveRedirectFrom = dispatched.evidence.url; target.aliveRedirectTarget = 'https://redirect.example/';
  f.context.cancelAliveResearchNavigation(dispatched.evidence.tab, 'User navigation replaced the request');
  assert.equal(f.context.aliveResearch.snapshot().pending, null);
  assert.equal(f.context.aliveResearch.snapshot().modelUpdates, 0);
  assert.equal(target.aliveRedirectFrom, null); assert.equal(target.aliveRedirectTarget, null);
  f.context.cancelAliveResearchNavigation(dispatched.evidence.tab, 'Repeated cancellation');
  assert.equal(f.context.aliveResearch.snapshot().modelUpdates, 0);
});

const browserSource = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function browserResearchEvents() {
  let pending = { url: 'https://requested.example/start', tabId: 'research-tab' };
  const handlers = new Map(), cancelled = [], failures = [], requests = [], errors = [];
  const tabObj = { id: 'research-tab', url: pending.url, isLoading: true, aliveRedirectFrom: null, aliveRedirectTarget: null };
  const context = { tabObj, id: tabObj.id, activeTabId: tabObj.id, Date,
    ownsGuest: () => true, settleTabDomReadyWaiters() {},
    document: { getElementById: () => null },
    wv: { addEventListener: (name, fn) => handlers.set(name, fn) },
    showError: (...args) => errors.push(args),
    AliveResearchPolicy,
    aliveResearch: { snapshot: () => ({ pending }) },
    cancelAliveResearchNavigation: (tabId, reason) => { cancelled.push({ tabId, reason }); if (pending?.tabId === tabId) pending = null; },
    aliveResearchNavigationFailed: failure => failures.push(failure),
    aliveOverdrive: { running: true, request: id => requests.push(id) }
  };
  context.window = context;
  for (const name of ['did-start-loading', 'did-redirect-navigation', 'did-start-navigation', 'did-fail-load']) {
    const start = browserSource.indexOf(`      wv.addEventListener('${name}',`, browserSource.indexOf('    function createTab('));
    assert.ok(start >= 0, name + ' handler exists');
    const end = browserSource.indexOf('\n      });', start);
    assert.ok(end > start, name + ' handler closes');
    vm.runInNewContext(browserSource.slice(start, end + '\n      });'.length), context, { filename: 'index-' + name + '.js' });
  }
  return { context, tabObj, cancelled, failures, requests, errors, pending: () => pending,
    emit: (name, event = {}) => handlers.get(name)(event) };
}

test('real browser redirect handler ignores wrong-source and non-main-frame events but accepts the matching chain', () => {
  const f = browserResearchEvents();
  f.emit('did-redirect-navigation', { isMainFrame: false, url: 'https://subframe.example/' });
  f.emit('did-redirect-navigation', { url: 'https://unknown-frame.example/' });
  assert.equal(f.tabObj.aliveRedirectFrom, null);
  f.tabObj.url = 'https://manual.example/replacement';
  f.emit('did-redirect-navigation', { isMainFrame: true, url: 'https://manual.example/final' });
  assert.equal(f.tabObj.aliveRedirectFrom, null, 'same tab is not proof of the original request');
  f.tabObj.url = 'https://requested.example/start';
  f.emit('did-redirect-navigation', { isMainFrame: true, url: 'https://intermediate.example/path#fragment' });
  assert.equal(f.tabObj.aliveRedirectFrom, f.pending().url);
  assert.equal(f.tabObj.aliveRedirectTarget, 'https://intermediate.example/path');
  f.tabObj.url = 'https://intermediate.example/path';
  f.emit('did-redirect-navigation', { isMainFrame: true, url: 'https://final.example/document' });
  assert.equal(f.tabObj.aliveRedirectFrom, f.pending().url);
  assert.equal(f.tabObj.aliveRedirectTarget, 'https://final.example/document');
});

test('real browser navigation-start handler cancels replacement documents while retaining matching requests and redirects', () => {
  const f = browserResearchEvents();
  f.emit('did-start-navigation', { isMainFrame: true, url: f.pending().url });
  f.emit('did-redirect-navigation', { isMainFrame: true, url: 'https://final.example/document' });
  f.emit('did-start-navigation', { isMainFrame: true, url: 'https://final.example/document' });
  f.emit('did-start-navigation', { isMainFrame: false, url: 'https://subframe.example/' });
  f.emit('did-start-navigation', { isMainFrame: true, isInPlace: true, url: 'https://different.example/' });
  assert.equal(f.cancelled.length, 0);
  f.emit('did-start-navigation', { isMainFrame: true, url: 'https://manual.example/replacement' });
  assert.equal(f.cancelled.length, 1); assert.equal(f.pending(), null);
});

test('real browser loading-start handler clears redirect provenance without inventing a main-frame start', () => {
  const f = browserResearchEvents();
  f.emit('did-redirect-navigation', { isMainFrame: true, url: 'https://old-final.example/' });
  assert.ok(f.tabObj.aliveRedirectFrom);
  f.emit('did-start-loading');
  assert.equal(f.tabObj.aliveRedirectFrom, null); assert.equal(f.tabObj.aliveRedirectTarget, null);
  assert.equal(f.tabObj.isLoading, true); assert.equal(f.tabObj.lastNavStartTs, undefined);
});

test('real browser load-failure handler attributes only matched redirects and ignores aborted or child-frame failures', () => {
  const f = browserResearchEvents();
  f.emit('did-redirect-navigation', { isMainFrame: true, url: 'https://final.example/document' });
  f.emit('did-fail-load', { isMainFrame: false, errorCode: -105, validatedURL: 'https://child.example/' });
  f.emit('did-fail-load', { isMainFrame: true, errorCode: -3, validatedURL: 'https://final.example/document' });
  assert.equal(f.failures.length, 0);
  f.emit('did-fail-load', { isMainFrame: true, errorCode: -105, validatedURL: 'https://final.example/document', errorDescription: 'ERR_NAME_NOT_RESOLVED' });
  assert.equal(f.failures[0].url, 'https://requested.example/start');
  assert.equal(f.tabObj.aliveRedirectFrom, null); assert.equal(f.tabObj.aliveRedirectTarget, null);
  assert.deepEqual(f.requests, ['portal-jump']);
  const unmatched = browserResearchEvents();
  unmatched.emit('did-redirect-navigation', { isMainFrame: true, url: 'https://attested.example/final' });
  unmatched.context.activeTabId = 'other-tab';
  unmatched.emit('did-fail-load', { isMainFrame: true, errorCode: -105, validatedURL: 'https://unrelated.example/failure' });
  assert.equal(unmatched.failures[0].url, 'https://unrelated.example/failure');
  assert.equal(unmatched.requests.length, 0, 'background failures cannot force active-tab navigation');
});

test('split portal opens the destination on the left and rotates the explored page into the right pane', async () => {
  const f = fixture(context => { context.splitViewActive = true; });
  const result = await f.run('portal-jump');
  assert.equal(result.status, 'completed');
  assert.equal(f.created(), 1);
  assert.equal(f.context.getActiveTab().id, 't2', 'new destination becomes the primary pane');
  assert.equal(f.context.secondaryTabId, 't1', 'the page just explored stays visible in the secondary pane');
});

test('split portal at the tab limit reuses a spare hidden tab instead of overwriting either visible pane', async () => {
  const navigations = [];
  const f = fixture(context => {
    context.splitViewActive = true;
    const wv = context.tabs[0].wv;
    context.tabs[0].lastDomReadyTs = 4000;
    context.tabs.push({ id: 't2', domReady: true, url: 'https://right.invalid/', committedUrl: 'https://right.invalid/', wv, lastDomReadyTs: 1000 },
      { id: 't3', domReady: true, url: 'https://spare-new.invalid/', committedUrl: 'https://spare-new.invalid/', wv, lastDomReadyTs: 3000 },
      { id: 't4', domReady: true, url: 'https://spare-old.invalid/', committedUrl: 'https://spare-old.invalid/', wv, lastDomReadyTs: 2000 });
    context.secondaryTabId = 't2';
    context.dispatchNonBlockingTabNavigation = (tab, url) => { navigations.push(tab.id); tab.url = url; return true; };
  });
  const result = await f.run('portal-jump');
  assert.equal(result.status, 'completed');
  assert.equal(f.created(), 0, 'the four-tab habitat bound is kept');
  assert.deepEqual(navigations, ['t4'], 'the oldest spare tab is reused');
  assert.equal(f.context.getActiveTab().id, 't4');
  assert.equal(f.context.secondaryTabId, 't1');
  assert.equal(f.tabs.find(tab => tab.id === 't2').url, 'https://right.invalid/', 'the former right pane is not overwritten');
});

test('single-pane portal leaves split state untouched', async () => {
  const f = fixture(context => { context.splitViewActive = false; });
  assert.equal((await f.run('portal-jump')).status, 'completed');
  assert.equal(f.context.secondaryTabId, null);
});
