'use strict';

// Pure adaptation/observation tests. Importing the probe must not launch Electron.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { adaptMain, observeHost, replaceOnce, isProbeEntry, waitForRendererStartup, waitForNaturalTrainerCommit,
  capturePausedReplayBoundary, assessNaturalReplayPopulation, sourceHashes } = require('./alive-persistence-restart-probe.cjs');

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

test('paused writer captures replay before callbacks and retains both direct observations separately', () => {
  const trace = [], runtime = { marker: 0 }, raw = replayObservation(), copied = value => JSON.parse(JSON.stringify(value));
  const observe = vm.runInNewContext('(' + capturePausedReplayBoundary.toString() + ')');
  const result = observe(runtime, {
    captureReplay(h) { assert.equal(h, runtime); trace.push('direct-replay'); return copied(raw); },
    legacySentinels(h) { trace.push('historical-sentinels'); h.marker = 1; },
    captureTrainer(h) { trace.push('trainer-read'); assert.equal(h.marker, 1); raw.entries[0].z16Hex = '00'.repeat(64); return { epoch: 7 }; }
  });
  assert.deepEqual(trace, ['direct-replay', 'historical-sentinels', 'direct-replay', 'trainer-read']);
  assert.deepEqual(result.replayBeforeSentinels, replayObservation()); assert.deepEqual(result.replayBeforeFlush, replayObservation());
  assert.notEqual(result.replayBeforeSentinels, result.replayBeforeFlush);
  assert.match(result.sentinelScope, /no replay record, cursor, trainer clock/);
});

test('a failed first raw replay observation prevents healing callbacks or observation retry', () => {
  let attempts = 0, callbacks = 0;
  const observe = vm.runInNewContext('(' + capturePausedReplayBoundary.toString() + ')');
  assert.throws(() => observe({}, {
    captureReplay() { attempts++; return attempts === 1 ? { ok: false, reason: 'malformed ring' } : replayObservation(); },
    legacySentinels() { callbacks++; }, captureTrainer() { callbacks++; }
  }), /Initial paused replay observation failed/);
  assert.equal(attempts, 1); assert.equal(callbacks, 0);
  assert.throws(() => observe({}, { captureReplay() { throw new Error('Must not run incomplete contract'); } }), /Missing paused replay/);
});

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

test('proof source hashes include replay production and independent oracle dependencies', () => {
  const hashes = sourceHashes();
  for (const name of ['systems/alive-replay-state.js', 'scripts/alive-replay-state-evidence.cjs',
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
