'use strict';

// Pure adaptation/observation tests. Importing the probe must not launch Electron.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const { adaptMain, observeHost, replaceOnce, isProbeEntry, waitForRendererStartup, waitForNaturalTrainerCommit,
  capturePausedReplayBoundary, applyLegacySentinels, captureNaturalHubReplay, assessNaturalHubEvolution, assessComponentSnapshotBinding,
  assessNaturalCortexEvolution, assessNaturalReplayPopulation, writeRawEvidence, readRawEvidence, sourceHashes } = require('./alive-persistence-restart-probe.cjs');
const { captureHubHydration } = require('./alive-hub-state-evidence.cjs');
const { captureCortexHydration } = require('./alive-cortex-state-evidence.cjs');

function replayObservation(count = 1, cursor = count < 32 ? count : 0, seed = 0) {
  const tensor = (length, offset) => {
    const bytes = Buffer.alloc(length * 4);
    for (let i = 0; i < length; i++) bytes.writeFloatLE((i + offset + seed) / 32, i * 4);
    return bytes.toString('hex');
  };
  return { schema: 'gigachad.replay-hydration-evidence.v1', ok: true, byteOrder: 'LE', count, cursor, tensorBytes: count * 160,
    entries: Array.from({ length: count }, (_, slot) => {
      const surprise = Buffer.alloc(8); surprise.writeDoubleLE(slot === 0 ? -0 : slot / 64);
      return { slot, z16Hex: tensor(16, slot), a8Hex: tensor(8, slot + 1), zNext16Hex: tensor(16, slot + 2), surpriseHex: surprise.toString('hex') };
    }) };
}

test('paused writer captures cortex then hub and replay before callbacks and retains first observations', () => {
  const trace = [], runtime = { marker: 0 }, raw = replayObservation(), rawHub = { ok: true, directBytes: 'before' },
    rawCortex = { ok: true, dataBase64: 'original' }, copied = value => JSON.parse(JSON.stringify(value));
  const observe = vm.runInNewContext('(' + capturePausedReplayBoundary.toString() + ')');
  const result = observe(runtime, {
    captureReplay(h) { assert.equal(h, runtime); trace.push('direct-replay'); return copied(raw); },
    captureHub(h) { assert.equal(h, runtime); trace.push('direct-hub'); return copied(rawHub); },
    captureCortex(h) { assert.equal(h, runtime); trace.push('direct-cortex'); return copied(rawCortex); },
    legacySentinels(h) { trace.push('historical-sentinels'); h.marker = 1; },
    captureTrainer(h) { trace.push('trainer-read'); assert.equal(h.marker, 1); raw.entries[0].z16Hex = '00'.repeat(64); rawHub.directBytes = 'callback-corruption'; rawCortex.dataBase64 = 'callback-corruption'; return { epoch: 7 }; }
  });
  assert.deepEqual(trace, ['direct-cortex', 'direct-hub', 'direct-replay', 'historical-sentinels', 'direct-cortex', 'direct-hub', 'direct-replay', 'trainer-read']);
  assert.deepEqual(result.replayBeforeSentinels, replayObservation()); assert.deepEqual(result.replayBeforeFlush, replayObservation());
  assert.notEqual(result.replayBeforeSentinels, result.replayBeforeFlush);
  assert.deepEqual(result.hubBeforeSentinels, { ok: true, directBytes: 'before' });
  assert.deepEqual(result.hubBeforeFlush, { ok: true, directBytes: 'before' });
  assert.notEqual(result.hubBeforeSentinels, result.hubBeforeFlush);
  assert.deepEqual(result.cortexBeforeSentinels, { ok: true, dataBase64: 'original' });
  assert.deepEqual(result.cortexBeforeFlush, { ok: true, dataBase64: 'original' });
  assert.notEqual(result.cortexBeforeSentinels, result.cortexBeforeFlush);
  assert.match(result.sentinelScope, /Two historical/); assert.match(result.sentinelScope, /no actor, cortex, hub, replay/);
});

test('a failed first raw replay observation prevents healing callbacks or observation retry', () => {
  let attempts = 0, callbacks = 0;
  const observe = vm.runInNewContext('(' + capturePausedReplayBoundary.toString() + ')');
  assert.throws(() => observe({}, {
    captureReplay() { attempts++; return attempts === 1 ? { ok: false, reason: 'malformed ring' } : replayObservation(); },
    captureHub() { return { ok: true }; },
    captureCortex() { return { ok: true }; },
    legacySentinels() { callbacks++; }, captureTrainer() { callbacks++; }
  }), /Initial paused replay observation failed/);
  assert.equal(attempts, 1); assert.equal(callbacks, 0);
  assert.throws(() => observe({}, { captureReplay() { throw new Error('Must not run incomplete contract'); } }), /Missing paused replay/);
});

test('failed first hub observation prevents replay, mutation and metadata callbacks without retry', () => {
  let attempts = 0, callbacks = 0;
  const observe = vm.runInNewContext('(' + capturePausedReplayBoundary.toString() + ')');
  assert.throws(() => observe({}, {
    captureHub() { attempts++; return attempts === 1 ? { ok: false, reason: 'wrong arena' } : { ok: true }; },
    captureCortex() { return { ok: true }; },
    captureReplay() { callbacks++; return replayObservation(); }, legacySentinels() { callbacks++; }, captureTrainer() { callbacks++; }
  }), /Initial paused hub observation failed/);
  assert.equal(attempts, 1); assert.equal(callbacks, 0);
});

test('failed first cortex observation prevents every later callback and retry', () => {
  let attempts = 0, callbacks = 0;
  const observe = vm.runInNewContext('(' + capturePausedReplayBoundary.toString() + ')');
  assert.throws(() => observe({}, {
    captureCortex() { attempts++; return attempts === 1 ? { ok: false, reason: 'wrong native alias' } : { ok: true }; },
    captureHub() { callbacks++; }, captureReplay() { callbacks++; }, legacySentinels() { callbacks++; }, captureTrainer() { callbacks++; }
  }), /Initial paused cortex observation failed/);
  assert.equal(attempts, 1); assert.equal(callbacks, 0);
});

test('a failed post-sentinel cortex capture prevents later reads and cannot be healed by trainer metadata', () => {
  let attempts = 0, sentinels = 0, trainers = 0, hubReads = 0, replayReads = 0;
  const observe = vm.runInNewContext('(' + capturePausedReplayBoundary.toString() + ')');
  assert.throws(() => observe({}, {
    captureCortex() { attempts++; return attempts === 1 ? { ok: true } : { ok: false, reason: 'alias changed' }; },
    captureHub() { hubReads++; return { ok: true }; },
    captureReplay() { replayReads++; return replayObservation(); },
    legacySentinels() { sentinels++; }, captureTrainer() { trainers++; return { ok: true }; }
  }), /Cortex observation after legacy sentinels failed/);
  assert.equal(attempts, 2); assert.equal(sentinels, 1); assert.equal(trainers, 0);
  assert.equal(hubReads, 1); assert.equal(replayReads, 1);
});

test('natural baseline directly observes cortex then hub and replay and rejects a failed first result', () => {
  const observe = vm.runInNewContext('(' + captureNaturalHubReplay.toString() + ')'), trace = [];
  const result = observe({}, { captureCortex() { trace.push('cortex'); return { ok: true }; }, captureHub() { trace.push('hub'); return { ok: true }; }, captureReplay() { trace.push('replay'); return replayObservation(); } });
  assert.deepEqual(trace, ['cortex', 'hub', 'replay']); assert.equal(result.cortex.ok, true); assert.equal(result.hub.ok, true); assert.equal(result.replay.count, 1);
  trace.length = 0;
  assert.throws(() => observe({}, { captureCortex() { trace.push('cortex'); return { ok: false }; }, captureHub() { trace.push('hub'); }, captureReplay() { trace.push('replay'); } }), /Initial natural cortex/);
  assert.deepEqual(trace, ['cortex']);
});

test('remaining historical sentinels mutate only world/pellets and preserve actor and all containers', () => {
  const hub = { W_perc_enc: new Float32Array([.125, -.25]), replayRing32: [], replayWritePtr: 0, totalBackpropStepsTrained: 23 };
  const actor = new Float32Array([1, 2]), cortex = { W_actor: actor, W_enc1: new Float32Array([7, 8]) };
  const runtime = { W_actor: actor, deepCortex: cortex, W_world: new Float32Array([3, 4]), pelletsEatenCount: 7, trainableAlifeNeuralHub: hub };
  const before = structuredClone({ actor, cortex, hub }), apply = vm.runInNewContext('(' + applyLegacySentinels.toString() + ')');
  apply(runtime);
  assert.equal(runtime.W_actor, actor); assert.deepEqual(actor, before.actor); assert.deepEqual(cortex, before.cortex);
  assert.equal(runtime.W_world[0], 3); assert.equal(runtime.W_world[1], Math.fround(-.271828)); assert.equal(runtime.pelletsEatenCount, 98765);
  assert.equal(runtime.trainableAlifeNeuralHub, hub); assert.deepEqual(hub, before.hub);
});

test('all five component snapshots must share the complete seven fields and outer saved identity', () => {
  const snapshot = { creatureId: 'fixture', policyId: 'policy', checkpointId: 'checkpoint', logicalTick: 3, modelEpoch: 4,
    capturedAt: '2026-11-10T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' };
  const fields = ['primaryPolicyState', 'trainerCommittedState', 'replayMemoryState', 'hubMemoryState', 'cortexMemoryState'];
  const make = () => ({ simulationTick: 3, policyCid: 'policy', checkpointCid: 'checkpoint', agentId: 'fixture',
    ...Object.fromEntries(fields.map(field => [field, { snapshot: { ...snapshot } }])) });
  assert.equal(assessComponentSnapshotBinding(make()).ok, true);
  for (const field of fields) {
    const missing = make(); delete missing[field]; assert.equal(assessComponentSnapshotBinding(missing).ok, false);
    for (const key of Object.keys(snapshot)) {
      const changed = make(); changed[field].snapshot[key] = typeof snapshot[key] === 'number' ? snapshot[key] + 1 : snapshot[key] + '-other';
      assert.equal(assessComponentSnapshotBinding(changed).ok, false, field + '.' + key);
    }
  }
  for (const key of ['simulationTick', 'policyCid', 'checkpointCid', 'agentId']) {
    const changed = make(); changed[key] = 'wrong'; assert.equal(assessComponentSnapshotBinding(changed).ok, false);
  }
  const extra = make(); extra.hubMemoryState.snapshot.extra = true; assert.equal(assessComponentSnapshotBinding(extra).ok, false);
});

function hubFixture() {
  // Only allocate the actual constructor's local arrays. These synthetic test
  // edits never run in the application probe or count as natural evolution.
  const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const start = source.indexOf('        const mixedArenaBuffer = new ArrayBuffer(8192);');
  const end = source.indexOf('        // 13G.', start);
  assert.ok(start >= 0 && end > start, 'Actual inert hub allocation remains present');
  const runtime = {}; new Function(source.slice(start, end)).call(runtime);
  return runtime;
}

test('natural hub gate uses validated direct backing changes and does not mistake counter-only edits for byte evolution', () => {
  const runtime = hubFixture(), hub = runtime.trainableAlifeNeuralHub, before = captureHubHydration(runtime);
  assert.equal(before.ok, true, before.reason);
  assert.equal(assessNaturalHubEvolution(before, before).ok, false);
  hub.totalBackpropStepsTrained++;
  const counterOnly = assessNaturalHubEvolution(before, captureHubHydration(runtime));
  assert.equal(counterOnly.ok, false); assert.equal(counterOnly.changedBackingBytes, 0);
  assert.ok(counterOnly.changedStateIds.length > 0);
  hub.W_perc_enc[0] += .25;
  const after = captureHubHydration(runtime), evolved = assessNaturalHubEvolution(before, after);
  assert.equal(evolved.ok, true); assert.ok(evolved.changedBackingBytes > 0); assert.ok(evolved.changedStateIds.length > 0);
  assert.match(evolved.scope, /no next-output equivalence/);
  assert.doesNotMatch(JSON.stringify(evolved), /"hex":|"data":/, 'Natural-evolution summary never prints raw model values');
});

test('natural hub gate rejects malformed raw evidence instead of accepting different-looking JSON', () => {
  const before = captureHubHydration(hubFixture());
  for (const change of [
    value => { value.ok = false; }, value => { value.totals.uniqueBytes--; },
    value => { value.backings[0].hex = 'bad'; }, value => { value.views.pop(); }
  ]) {
    const after = structuredClone(before); change(after);
    assert.equal(assessNaturalHubEvolution(before, after).ok, false);
  }
});

function cortexFixture() {
  // Actual allocation and eager cold state only. The fixed constructor RNG is
  // a unit-test fixture; the real process probe never injects model values.
  const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const start = source.indexOf('        const initXavier = (rows, cols) => {');
  const end = source.indexOf('        // Sovereign Browser Master Controller Telemetry', start);
  assert.ok(start >= 0 && end > start);
  const runtime = { W_actor: new Float32Array(80), W_critic: new Float32Array(16) };
  new Function('hybridQrng', source.slice(start, end)).call(runtime, { u64: () => 1n });
  return runtime;
}

test('natural cortex gate separates trained matrix bytes from scratch buffers and counters', () => {
  const runtime = cortexFixture(), before = captureCortexHydration(runtime);
  assert.equal(before.ok, true, before.reason);
  assert.equal(assessNaturalCortexEvolution(before, before).ok, false);
  runtime.deepCortex.cortexCoverageStep++;
  let result = assessNaturalCortexEvolution(before, captureCortexHydration(runtime));
  assert.equal(result.ok, false); assert.equal(result.changedLearnedMatrixBytes, 0); assert.ok(result.changedStateIds.length);
  runtime.deepCortex.x64[0] = .25;
  result = assessNaturalCortexEvolution(before, captureCortexHydration(runtime));
  assert.equal(result.ok, false); assert.ok(result.changedScratchBytes > 0); assert.equal(result.changedLearnedMatrixBytes, 0);
  runtime.deepCortex.M_hopfield[0] += .0625;
  result = assessNaturalCortexEvolution(before, captureCortexHydration(runtime));
  assert.equal(result.ok, false); assert.ok(result.changedScratchIds.includes('dc.M_hopfield'));
  assert.equal(result.changedLearnedMatrixBytes, 0, 'associative memory alone is insufficient for this conservative matrix gate');
  runtime.deepCortex.W_dec[0] += .125;
  result = assessNaturalCortexEvolution(before, captureCortexHydration(runtime));
  assert.equal(result.ok, true); assert.ok(result.changedLearnedMatrixBytes > 0); assert.ok(result.changedLearnedMatrixIds.length);
  assert.ok(result.changedScratchBytes > 0); assert.ok(result.changedStateIds.length);
  assert.deepEqual(result.changedLearnedMatrixIds, ['dc.W_dec']);
  assert.doesNotMatch(JSON.stringify(result), /"dataBase64":|"hex":/, 'natural evolution reports metadata only');
  assert.match(result.scope, /learning-quality or next-output equivalence/);
});

test('natural cortex gate rejects malformed observations and lost primary/connectome aliases', () => {
  const runtime = cortexFixture(), before = captureCortexHydration(runtime);
  for (const mutate of [
    value => { value.ok = false; }, value => { value.totals.uniqueBytes--; },
    value => { value.backings[0].dataBase64 = 'bad'; }, value => { value.views.pop(); }, value => { value.aliases.pop(); }
  ]) {
    const after = structuredClone(before); mutate(after);
    assert.equal(assessNaturalCortexEvolution(before, after).ok, false);
  }
  runtime.deepCortex.W_actor = new Float32Array(runtime.W_actor);
  assert.equal(assessNaturalCortexEvolution(before, captureCortexHydration(runtime)).ok, false);
});

function withEvidenceProfile(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'alive-cortex-proof-test-'));
  try { return run(directory); }
  finally {
    const target = path.resolve(directory), parent = path.resolve(os.tmpdir());
    assert.equal(path.dirname(target), parent); assert.ok(path.basename(target).startsWith('alive-cortex-proof-test-'));
    fs.rmSync(target, { recursive: true, force: true });
  }
}

test('owned raw evidence files preserve the first snapshot with metadata-only immutable receipts', () => withEvidenceProfile(profile => {
  const raw = { schema: 'gigachad.cortex-hydration-evidence.v1', ok: true, backings: [{ dataBase64: 'AQID' }] };
  const receipt = writeRawEvidence(profile, 'cortexBeforeNatural', raw);
  assert.deepEqual(Object.keys(receipt).sort(), ['byteLength', 'file', 'schema', 'sha256']);
  assert.doesNotMatch(JSON.stringify(receipt), /AQID|dataBase64/);
  raw.backings[0].dataBase64 = 'changed';
  assert.equal(readRawEvidence(profile, 'cortexBeforeNatural', receipt).backings[0].dataBase64, 'AQID');
  assert.throws(() => writeRawEvidence(profile, 'cortexBeforeNatural', raw), /EEXIST/);
  const boot = { beforeBaseline: true, snapshot: { cortexEvidence: { ok: false, reason: 'first failure' } } };
  const bootReceipt = writeRawEvidence(profile, 'readerBoot', boot);
  boot.snapshot.cortexEvidence.ok = true;
  const observed = readRawEvidence(profile, 'readerBoot', bootReceipt);
  assert.equal(observed.snapshot.cortexEvidence.ok, false); assert.equal(observed.schema, 'gigachad.persistence-boot-observation.v1');
}));

test('raw evidence rejects traversal, wrong receipts, missing/truncated/tampered files and schema substitutions', () => withEvidenceProfile(profile => {
  const raw = { schema: 'gigachad.cortex-hydration-evidence.v1', ok: true };
  const receipt = writeRawEvidence(profile, 'cortexBeforeNatural', raw), file = path.join(profile, receipt.file), original = fs.readFileSync(file);
  for (const bad of [{ ...receipt, file: '../outside.json' }, { ...receipt, byteLength: 16 * 1024 * 1024 + 1 },
    { ...receipt, sha256: '0'.repeat(64) }, { ...receipt, schema: 'wrong' }]) assert.throws(() => readRawEvidence(profile, 'cortexBeforeNatural', bad));
  assert.throws(() => writeRawEvidence(profile, '../outside', raw), /path\/key/);
  assert.throws(() => writeRawEvidence('relative', 'cortexBeforeNatural', raw), /path\/key/);
  assert.throws(() => readRawEvidence(profile, 'cortexBeforeFlush', receipt));
  fs.writeFileSync(file, original.subarray(0, original.length - 1)); assert.throws(() => readRawEvidence(profile, 'cortexBeforeNatural', receipt), /truncated/);
  const tampered = Buffer.from(original); tampered[0] ^= 1; fs.writeFileSync(file, tampered);
  assert.throws(() => readRawEvidence(profile, 'cortexBeforeNatural', receipt), /hash mismatch/);
  const wrongSchema = Buffer.from(JSON.stringify({ schema: 'wrong' })); fs.writeFileSync(file, wrongSchema);
  assert.throws(() => readRawEvidence(profile, 'cortexBeforeNatural', { ...receipt, byteLength: wrongSchema.length,
    sha256: createHash('sha256').update(wrongSchema).digest('hex') }), /schema mismatch/);
  fs.unlinkSync(file); assert.throws(() => readRawEvidence(profile, 'cortexBeforeNatural', receipt), /ENOENT/);
  fs.mkdirSync(file); assert.throws(() => readRawEvidence(profile, 'cortexBeforeNatural', receipt), /missing or replaced/);
}));

test('natural replay assessment requires nonempty changed physical state and never accepts display-only progress', () => {
  const empty = replayObservation(0), partial = replayObservation(2), full = replayObservation(32, 7);
  assert.equal(assessNaturalReplayPopulation(empty, partial).ok, true);
  assert.equal(assessNaturalReplayPopulation(full, replayObservation(32, 8)).ok, true);
  assert.equal(assessNaturalReplayPopulation(full, replayObservation(32, 7, 1)).ok, true);
  assert.equal(assessNaturalReplayPopulation(empty, empty).ok, false);
  assert.equal(assessNaturalReplayPopulation(partial, { ...partial, observedAt: 99 }).ok, false);
  const result = assessNaturalReplayPopulation(empty, partial);
  assert.equal(result.count, 2); assert.equal(result.tensorBytes, 320); assert.equal(result.beforeCount, 0);
  assert.equal(Object.hasOwn(result, 'entries'), false); assert.match(result.scope, /no claim of next-update equivalence/);
});

test('natural population rejects invalid bounds, holes, order, malformed bytes and nonfinite surprises', () => {
  const before = replayObservation(0);
  for (const change of [
    observation => { observation.ok = false; }, observation => { observation.count = 33; },
    observation => { observation.count = -0; }, observation => { observation.cursor = -0; },
    observation => { observation.cursor = 0; }, observation => { observation.tensorBytes = 0; },
    observation => { delete observation.entries[0]; }, observation => { observation.entries[0].slot = 1; },
    observation => { observation.entries[0].z16Hex = 'gg'.repeat(64); },
    observation => { observation.entries[0].a8Hex = '0000807f' + '00'.repeat(28); },
    observation => { observation.entries[0].surpriseHex = '000000000000f87f'; }
  ]) {
    const after = replayObservation(1); change(after);
    assert.equal(assessNaturalReplayPopulation(before, after).ok, false);
  }
  assert.equal(assessNaturalReplayPopulation({ ok: false }, replayObservation()).ok, false);
});

test('proof source hashes include replay/hub/cortex production and independent oracle dependencies', () => {
  const hashes = sourceHashes();
  for (const name of ['systems/alive-replay-state.js', 'scripts/alive-replay-state-evidence.cjs',
    'systems/alive-hub-state.js', 'scripts/alive-hub-state-evidence.cjs',
    'systems/alive-cortex-state.js', 'scripts/alive-cortex-state-evidence.cjs',
    'scripts/alive-genome-hydration-evidence.cjs', 'scripts/alive-persistence-restart-probe.cjs']) assert.match(hashes[name] || '', /^[0-9a-f]{64}$/, name);
});

test('startup observation waits for the real barrier without invoking activation', async () => {
  let resolve, starts = 0;
  const ready = new Promise(done => { resolve = done; });
  const context = { window: { aliveStartup: { ready, start() { starts++; } } }, setTimeout, clearTimeout };
  const observe = vm.runInNewContext('(' + waitForRendererStartup.toString() + ')', context);
  let settled = false;
  const result = observe({ required: true }).then(value => { settled = true; return value; });
  await Promise.resolve(); assert.equal(settled, false);
  resolve({ phase: 'ready', loadedModules: 9 });
  assert.equal((await result).phase, 'ready'); assert.equal(starts, 0);
});

test('startup observation rejects failure, cancellation, missing required barrier and timeout', async () => {
  const make = startup => vm.runInNewContext('(' + waitForRendererStartup.toString() + ')', {
    window: { aliveStartup: startup }, setTimeout, clearTimeout
  });
  for (const phase of ['failed', 'cancelled', 'preparing']) {
    await assert.rejects(make({ ready: Promise.resolve({ phase }) })({ required: true }), /did not reach ready/);
  }
  await assert.rejects(make(null)({ required: true }), /barrier is missing/);
  await assert.rejects(make({})({ required: true }), /promise is missing/);
  await assert.rejects(make({ ready: new Promise(() => {}) })({ required: true, timeoutMs: 5 }), /deadline/);
  assert.equal((await make(null)()).phase, 'legacy-no-barrier');
});

function naturalFixture(capture) {
  let clock = 0, calls = 0;
  const runtime = { dispatchWorkerTrainer() { throw Error('Verifier must never dispatch'); } };
  const observe = vm.runInNewContext('(' + waitForNaturalTrainerCommit.toString() + ')', {
    performance: { now: () => clock }, humunculusRuntime: runtime,
    setTimeout(resolve, delay) { clock += delay; Promise.resolve().then(resolve); }
  });
  return options => observe({ capture: target => { assert.equal(target, runtime); calls++; return capture(clock, calls); },
    before: { committedEpoch: 0, applied: 0 }, timeoutMs: 500, minDurationMs: 200, intervalMs: 50, ...options });
}
test('natural trainer wait requires a real epoch and applied increment plus observation dwell, with no dispatch', async () => {
  const result = await naturalFixture(time => ({ committedEpoch: time >= 50 ? 1 : 0, applied: time >= 50 ? 1 : 0 }))();
  assert.equal(result.durationMs, 200); assert.equal(result.committedEpochDelta, 1); assert.equal(result.appliedDelta, 1);
});
test('natural trainer wait times out on idle or invented epoch-only progress and rejects regression', async () => {
  for (const state of [{ committedEpoch: 0, applied: 0 }, { committedEpoch: 1, applied: 0 }]) {
    await assert.rejects(naturalFixture(() => state)(), /No natural trainer commit/);
  }
  await assert.rejects(naturalFixture(() => ({ committedEpoch: 0, applied: 0 }))({ before: { committedEpoch: 1, applied: 1 } }), /regressed/);
  await assert.rejects(naturalFixture(() => ({ committedEpoch: 1, applied: 1 }))({ timeoutMs: 45001 }), /Invalid/);
});

test('Electron entry uses explicit owned contract and exact path even when require.main is absent', () => {
  const input = { electron: '35.7.5', childContract: '{}', entryPath: __filename, isMain: false };
  assert.equal(isProbeEntry(input, __filename), true);
  assert.equal(isProbeEntry({ ...input, childContract: undefined }, __filename), false);
  assert.equal(isProbeEntry({ ...input, entryPath: __filename + '.other' }, __filename), false);
  assert.equal(isProbeEntry({ ...input, entryPath: undefined }, __filename), false);
  assert.equal(isProbeEntry({ ...input, childContract: undefined, isMain: true }, __filename), false);
  assert.equal(isProbeEntry({ electron: undefined, isMain: false }, __filename), false);
  assert.equal(isProbeEntry({ electron: undefined, isMain: true }, __filename), true);
});

const profileMarker = "const smokeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gigachad-smoke-'));";
const hostMarker = "const CHROME_FILE = path.join(ROOT, 'index.html');";
const smokeMarker = '  if (SMOKE) {\n    const fail = (message) => {';
const mainFixture = () => `// unrelated provider guard remains\nconst fetch = (...args) => SMOKE ? Promise.reject(new Error('blocked')) : globalThis.fetch(...args);\n${profileMarker}\n${hostMarker}\n${smokeMarker}\n      throw new Error(message);\n    };\n  }\n// other startup code remains\n`;

test('main adaptation changes exactly the owned profile/host and legacy smoke runner', () => {
  const original = mainFixture(), adapted = adaptMain(original);
  const expected = original.replace(profileMarker, 'const smokeDir = globalThis.__alivePersistenceProbe.profile;')
    .replace(hostMarker, 'const CHROME_FILE = globalThis.__alivePersistenceProbe.fixture;')
    .replace(smokeMarker, '  if (false) {\n    const fail = (message) => {');
  assert.equal(adapted, expected);
  assert.match(adapted, /SMOKE \? Promise\.reject\(new Error\('blocked'\)\)/);
  assert.match(adapted, /other startup code remains/);
  assert.doesNotThrow(() => new vm.Script(adapted));
});

test('main adaptation rejects missing, altered and duplicate exact locations', () => {
  for (const marker of [profileMarker, hostMarker, smokeMarker]) {
    assert.throws(() => adaptMain(mainFixture().replace(marker, '/* missing marker */')));
    assert.throws(() => adaptMain(mainFixture() + '\n' + marker));
  }
  assert.throws(() => adaptMain(mainFixture().replace(profileMarker, profileMarker.replace('const smokeDir', 'const smokeDirectory'))));
  assert.throws(() => adaptMain(mainFixture().replace(hostMarker, hostMarker.replace('index.html', 'different.html'))));
  assert.doesNotThrow(() => new vm.Script(adaptMain(mainFixture().replace(/\n/g, '\r\n'))));
});

test('replaceOnce cannot quietly adapt zero or more than one anchor', () => {
  assert.equal(replaceOnce('a ONE b', 'ONE', 'TWO', 'test'), 'a TWO b');
  assert.throws(() => replaceOnce('a b', 'ONE', 'TWO', 'test'), /found 0/);
  assert.throws(() => replaceOnce('ONE ONE', 'ONE', 'TWO', 'test'), /found 2/);
});

function capture(runtime) {
  trace.push('capture');
  return { phase: runtime.phase, restored: runtime.restored };
}
const hostFixture = () => `<!DOCTYPE html><html><head><title>Fixture</title></head><body><script>
class Creature {
  constructor() {
    this.phase='initial';
    this.loadPersistentGenome();
    this.phase='baseline'; trace.push('baseline');
  }
  loadPersistentGenome() { trace.push('load'); this.phase='loaded'; this.restored='from-real-fixture-loader'; }
}
window.creature = new Creature();
</script></body></html>`;

test('serialized observation runs after the unchanged loader and before later baseline code', () => {
  const html = observeHost(hostFixture(), capture), trace = [];
  class Storage {
    constructor() { this.values = new Map(); }
    setItem(key, value) { this.values.set(key, value); return 'set-result'; }
    removeItem(key) { this.values.delete(key); return 'remove-result'; }
  }
  const context = { trace, Storage, performance: { now: () => 42 }, gigachad: { genomeBootstrap: { status: 'ready', revision: 7 } } };
  context.window = context;
  vm.createContext(context);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  assert.equal(scripts.length, 2);
  for (const source of scripts) vm.runInContext(source, context);
  assert.deepEqual(trace, ['load', 'capture', 'baseline']);
  const observed = JSON.parse(JSON.stringify(context.__alivePersistenceBootObservation));
  assert.deepEqual(observed.snapshot, { phase: 'loaded', restored: 'from-real-fixture-loader' });
  assert.equal(observed.beforeBaseline, true);
  assert.equal(observed.bootstrap.revision, 7);
  assert.equal(context.creature.phase, 'baseline');
});

test('counter initializer observation runs before load and is retained separately from post-load state', () => {
  function initial(runtime) { trace.push('initial'); return { phase: runtime.phase }; }
  const html = observeHost(hostFixture(), capture, initial), trace = [];
  const context = { trace, Storage: class Storage { setItem() {} removeItem() {} }, performance: { now: () => 12 } };
  context.window = context;
  vm.createContext(context);
  for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(match[1], context);
  assert.deepEqual(trace, ['initial', 'load', 'capture', 'baseline']);
  const observed = JSON.parse(JSON.stringify(context.__alivePersistenceBootObservation));
  assert.deepEqual(observed.initialState, { phase: 'initial' });
  assert.equal(observed.snapshot.phase, 'loaded');
});

test('early Storage observation records only the genome key and delegates return values/errors', () => {
  const calls = [];
  class Storage {
    setItem(...args) { calls.push(['setItem', ...args]); if (args[1] === 'throw') throw new Error('native failure'); return 17; }
    removeItem(...args) { calls.push(['removeItem', ...args]); return 19; }
  }
  const context = { Storage, performance: { now: () => 12 } }; context.window = context;
  vm.createContext(context);
  const script = observeHost(hostFixture(), capture).match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInContext(script, context);
  const storage = new Storage(), key = 'humunculus_persistent_genome_v1';
  assert.equal(storage.setItem('unrelated', 'value'), 17);
  assert.equal(storage.setItem(key, '{}'), 17);
  assert.equal(storage.removeItem(key), 19);
  assert.throws(() => storage.setItem(key, 'throw'), /native failure/);
  const events = JSON.parse(JSON.stringify(context.__alivePersistenceStorageEvents));
  assert.equal(events.length, 3);
  assert.deepEqual(events.map(event => event.method), ['setItem', 'removeItem', 'setItem']);
  assert.deepEqual(events.map(event => event.codeUnits), [2, null, 5]);
  assert.equal(calls.length, 4);
});

test('host observation rejects missing or duplicate loader/head markers', () => {
  for (const marker of ['this.loadPersistentGenome();', '<head>']) {
    assert.throws(() => observeHost(hostFixture().replace(marker, '/* absent */'), capture));
    assert.throws(() => observeHost(hostFixture() + marker, capture));
  }
});
