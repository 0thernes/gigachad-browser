'use strict';
// Complete LOCAL hub continuation under an explicitly equal external boundary.
// The constructor allocation and whole numerical method are extracted unchanged
// from production. This does not launch the application or prove continuation
// of its external models, live hardware entropy, browser frames, or authority.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { webcrypto } = require('node:crypto');
const codec = require('../systems/alive-learned-state-codec.js');
const registry = require('../systems/alive-learned-state-registry.js');
const replayState = require('../systems/alive-replay-state.js');
const hubState = require('../systems/alive-hub-state.js');
const source = fs.readFileSync(require.resolve('../index.html'), 'utf8');
const ALLOCATION_START = '        const mixedArenaBuffer = new ArrayBuffer(8192);';
const ALLOCATION_END = '        // 13G. External Frontier Neural';
const STEP_START = '      stepTrainableAlifeNeuralHub60Hz(dt = 0.01667) {';
const STEP_END = '      // Hard-wired DSD-16 + Clifford Multivector';
function extract(text, start, end, maximum) {
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, 'Production source boundaries must exist in order');
  assert.equal(text.indexOf(start, a + start.length), -1, 'Unique source start');
  assert.equal(text.indexOf(end, b + end.length), -1, 'Unique source end');
  const result = text.slice(a, b);
  assert.ok(result.length < maximum, 'Bounded production source extraction');
  return result;
}
const allocation = extract(source, ALLOCATION_START, ALLOCATION_END, 16000);
const method = extract(source, STEP_START, STEP_END, 48000);
// No line replacement or fragment simplification: the final three optional
// engine calls remain in the real method. A same-realm Function preserves the
// production ordinary-object/native-view contracts required by both adapters.
const allocateHub = new Function('"use strict";\n' + allocation + '\nreturn this.trainableAlifeNeuralHub;');
function actualStep(qrng, browser, ipc) {
  return new Function('hybridQrng', 'window', 'ipcRenderer', '"use strict"; return ({\n' + method + '\n}).stepTrainableAlifeNeuralHub60Hz;')(qrng, browser, ipc);
}
const options = { crypto: webcrypto };
const adaptersPromise = Promise.all([
  hubState.create({ registry, codec, ...options }),
  replayState.create({ registry, codec, ...options })
]);
const raw = value => value instanceof ArrayBuffer ? Buffer.from(value) : Buffer.from(value.buffer, value.byteOffset, value.byteLength);
const cloneBytes = value => Buffer.from(raw(value));
const bytesEqual = (a, b, label) => assert.equal(raw(a).equals(raw(b)), true, label);
const metadata = tick => ({ creatureId: 'complete-local-hub-fixture', policyId: 'controlled-policy',
  checkpointId: 'controlled-checkpoint', logicalTick: tick, modelEpoch: 9,
  capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' });

function vector(length, salt, scale = .125) {
  return Float32Array.from({ length }, (_, i) => ((i * 13 + salt * 7) % 41 - 20) * scale / 20);
}
function externalFixture() {
  // Full physical arrays for every cortex field directly used by the local
  // method. Other cortex/engine fields are not simulated or claimed restored.
  const W_actor = vector(80, 1), W_critic = vector(16, 2);
  return {
    W_actor, W_critic,
    deepCortex: { W_enc1: vector(16384, 3), W_moe_experts: vector(524288, 4),
      W_body_genome: vector(3264, 5), W_actor, W_critic, criticValue: .39125 },
    continuousWorldModel: { rawFloatStream64: vector(64, 6, .9), latentZ64: vector(64, 7, .6) },
    obsVec: vector(16, 8, .7),
    deepWebAndSltcConnectomeEngine: {
      sltcSpikes64: Uint8Array.from({ length: 64 }, (_, i) => i % 3 === 0 ? 1 : 0),
      sltcActiveSpikesCount: 22, sltcSurrogateGradNorm: 1.625
    },
    decursiveSelfDeduplicator: { banishedBasis8x64: vector(512, 9) },
    mesh: { nm: { DA: .46 }, viscera: { glc: .63 } },
    rationalLogicEngine: { epistemicConsistencyPct: 87.125 },
    multivectorMetacognitionEngine: { metacognitiveDepthCoherence: .7125 },
    verletPhysics: { jointTorques24: vector(24, 10, .4) },
    emotionState: { valence: -.125, arousal: .36 }, simulationTick: 200,
    // Null is a supported real-method external boundary, not a rewritten step.
    frontierNeuralCyberEngine: null, bleedingEdge25Engine: null, aotTotGotEngine: null
  };
}
function browserFixture() {
  return { innerWidth: 1137, innerHeight: 793,
    __hostLastDomColliders: [{ cx: 71, cy: 129 }, { cx: 935, cy: 694 }, { cx: 577, cy: 307 }, { cx: 0, cy: 0 }] };
}
function fixture() {
  const runtime = externalFixture(); allocateHub.call(runtime);
  // Renderer-derived observations are local retained input at a capture
  // boundary; the crawler is not running during this isolated numerical test.
  runtime.trainableAlifeNeuralHub.samSpatialAffordance16.set(vector(16, 11, .7));
  runtime.trainableAlifeNeuralHub.samBestSectorIdx = 6;
  runtime.trainableAlifeNeuralHub.predictedFuturePos2D.set([371, 289]);
  return runtime;
}
function randomTape(frame) {
  // Explicit identical exogenous u64 stream. The production method consumes
  // exactly 32 values; it does not imply a replayable live hardware QRNG seed.
  const values = Array.from({ length: 32 }, (_, i) =>
    (BigInt(frame + 31) * 0x9e3779b97f4a7c15n + BigInt(i + 1) * 0xbf58476d1ce4e5b9n) & 0xffffffffffffffffn);
  let cursor = 0;
  return { values, get consumed() { return cursor; }, u64() {
    assert.ok(cursor < values.length, 'Unexpected additional production QRNG draw');
    return values[cursor++];
  } };
}
function advance(runtime, browser = browserFixture(), ipc) {
  const hub = runtime.trainableAlifeNeuralHub, frame = hub.totalBackpropStepsTrained + 1;
  const tape = randomTape(frame), oldDreams = hub.dreamConsolidationSteps, oldIdeas = hub.ideasSynthesizedCount;
  const oldMorphs = hub.recursiveMorphismsCount, oldCount = hub.replayRing32.length, oldCursor = hub.replayWritePtr;
  const oldPerception = cloneBytes(hub.W_perc_enc), oldMoe = cloneBytes(runtime.deepCortex.W_moe_experts);
  actualStep(tape, browser, ipc).call(runtime, .023);
  assert.equal(tape.consumed, 32, 'Actual full local step consumes two QRNG draws per lane');
  assert.equal(hub.totalBackpropStepsTrained, frame);
  assert.equal(hub.dreamConsolidationSteps, oldDreams + (frame % 4 === 0 ? 1 : 0));
  assert.equal(hub.ideasSynthesizedCount, oldIdeas + (frame % 12 === 0 ? 1 : 0));
  assert.equal(hub.recursiveMorphismsCount, oldMorphs + 1);
  assert.equal(hub.replayRing32.length, Math.min(32, oldCount + 1));
  assert.equal(hub.replayWritePtr, (oldCursor + 1) & 31);
  // At the initial step hDyn16 is zero, so the real W_dyn2 gradient can be
  // exactly zero. Require actual perception learning without inventing a
  // nonzero dynamics update; all dynamics bytes are compared independently.
  assert.equal(raw(hub.W_perc_enc).equals(oldPerception), false, 'Real local perception learning occurred');
  assert.equal(raw(runtime.deepCortex.W_moe_experts).equals(oldMoe), false, 'Real external MoE learning occurred');
  return tape.values;
}
function compareHub(actual, expected) {
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), 'Complete own-field set');
  const actualBuffers = new Set(), expectedBuffers = new Set();
  for (const name of Object.keys(expected)) {
    const a = actual[name], e = expected[name];
    if (name === 'replayRing32') {
      assert.equal(a.length, e.length);
      for (let i = 0; i < e.length; i++) {
        assert.deepEqual(Object.keys(a[i]).sort(), Object.keys(e[i]).sort());
        assert.equal(Object.is(a[i].surprise, e[i].surprise), true, `replay ${i} surprise`);
        for (const field of ['z16', 'a8', 'zNext16']) {
          bytesEqual(a[i][field], e[i][field], `replay ${i}/${field}`);
          assert.notEqual(a[i][field].buffer, e[i][field].buffer);
        }
      }
    } else if (ArrayBuffer.isView(e)) {
      assert.equal(a.constructor, e.constructor, name + ' dtype');
      assert.equal(a.length, e.length, name + ' shape');
      assert.equal(a.byteOffset, e.byteOffset, name + ' offset');
      bytesEqual(a, e, name);
      assert.notEqual(a, e); assert.notEqual(a.buffer, e.buffer);
      actualBuffers.add(a.buffer); expectedBuffers.add(e.buffer);
      assert.equal(a.buffer === actual.mixedArenaBuffer, e.buffer === expected.mixedArenaBuffer, name + ' arena alias');
    } else if (e instanceof ArrayBuffer) {
      bytesEqual(a, e, name + ' complete backing including reserved tail'); assert.notEqual(a, e);
    } else if (Array.isArray(e)) {
      assert.deepEqual(a, e, name); assert.notEqual(a, e);
    } else {
      assert.equal(Object.is(a, e), true, name + ' exact primitive, including signed zero');
    }
  }
  assert.equal(actualBuffers.size, 46); assert.equal(expectedBuffers.size, 46);
}
function compareExternal(actual, expected) {
  // Check every supplied external field, including untouched tails and read-
  // only inputs. structuredClone preserves the two real primary weight aliases.
  for (const key of Object.keys(expected)) {
    if (key === 'trainableAlifeNeuralHub') continue;
    assert.deepEqual(actual[key], expected[key], 'External complete fixture field ' + key);
  }
  assert.equal(actual.deepCortex.W_actor, actual.W_actor);
  assert.equal(actual.deepCortex.W_critic, actual.W_critic);
  assert.notEqual(actual.W_actor.buffer, expected.W_actor.buffer);
}
async function restorePair(original, target) {
  const [hubAdapter, replayAdapter] = await adaptersPromise, snapshot = metadata(original.simulationTick);
  const independentBeforeCapture = structuredClone(original.trainableAlifeNeuralHub);
  // Both captures occur synchronously at one boundary before either seal awaits.
  const capturedHub = hubAdapter.capture(original.trainableAlifeNeuralHub, snapshot, { generation: 4 });
  const capturedReplay = replayAdapter.capture(original.trainableAlifeNeuralHub, snapshot, { generation: 4 });
  const [decodedHub, decodedReplay] = await Promise.all([capturedHub, capturedReplay].map(async captured =>
    codec.decode(await codec.encode(captured, options), options)));
  compareHub(original.trainableAlifeNeuralHub, independentBeforeCapture);
  hubAdapter.validate(decodedHub); replayAdapter.validate(decodedReplay);
  const hub = target.trainableAlifeNeuralHub;
  const identities = new Map(Object.entries(hub).filter(([, value]) => ArrayBuffer.isView(value)));
  const backing = hub.mixedArenaBuffer;
  const hubPlan = hubAdapter.preflight(decodedHub, hub, { generation: 12 });
  const replayPlan = replayAdapter.preflight(decodedReplay, hub, { generation: 12 });
  assert.equal(hubAdapter.recheck(hubPlan, hub, { generation: 12 }).status, 'ready');
  assert.equal(replayAdapter.recheck(replayPlan, hub, { generation: 12 }).status, 'ready');
  const hubReceipt = hubAdapter.apply(hubPlan, hub, { generation: 12 });
  const replayReceipt = replayAdapter.apply(replayPlan, hub, { generation: 12 });
  for (const receipt of [hubReceipt, replayReceipt]) {
    assert.equal(receipt.status, 'applied'); assert.equal(receipt.readbackVerified, true);
  }
  assert.equal(hub.mixedArenaBuffer, backing, 'Restore preserves live arena identity');
  for (const [key, value] of identities) assert.equal(hub[key], value, 'Restore preserves real view ' + key);
  compareHub(hub, original.trainableAlifeNeuralHub);
}

test('whole local production allocation and full method extraction fail closed at changed boundaries', () => {
  assert.equal(source.includes(allocation), true); assert.equal(source.includes(method), true);
  for (const [start, end, bound] of [[ALLOCATION_START, ALLOCATION_END, 16000], [STEP_START, STEP_END, 48000]]) {
    assert.throws(() => extract(source.replace(start, '// missing'), start, end, bound));
    assert.throws(() => extract(source + '\n' + start, start, end, bound));
    assert.throws(() => extract(source.replace(end, '// missing'), start, end, bound));
  }
  const hub = fixture().trainableAlifeNeuralHub, views = Object.values(hub).filter(ArrayBuffer.isView);
  assert.equal(Object.keys(hub).length, 105); assert.equal(views.length, 58);
  assert.equal(views.filter(value => value.buffer === hub.mixedArenaBuffer).length, 13);
  assert.equal(views.reduce((sum, value) => sum + value.byteLength, 0), 18104);
  assert.equal(new Set(views.map(value => value.buffer)).size, 46);
  assert.equal(hub.mixedArenaBuffer.byteLength, 8192);
  assert.equal(hub.facultyDrives16.byteOffset + hub.facultyDrives16.byteLength, 4928);
});

for (const item of [
  { name: 'empty ring and initial local history', warmup: 0, steps: 13 },
  { name: 'partial ring and retained predictions/optimizer state', warmup: 3, steps: 10 },
  { name: 'last partial slot becomes full', warmup: 31, steps: 6 },
  { name: 'full ring overwrites its first physical slots', warmup: 32, steps: 5 },
  { name: 'wrapped cursor and frame64 history/cadence boundary', warmup: 63, steps: 9 }
]) test('complete local hub + replay wire continuation: ' + item.name, async () => {
  const original = fixture(), browser = browserFixture();
  for (let i = 0; i < item.warmup; i++) advance(original, browser);
  const hub = original.trainableAlifeNeuralHub;
  // Opaque arena bytes are part of exact local storage even where no current
  // view reads them. Persist raw words rather than reinterpreting FP16 labels.
  new Uint8Array(hub.mixedArenaBuffer, 4928).set(Uint8Array.from({ length: 3264 }, (_, i) => (i * 29 + 7) & 255));
  // This legacy field stores native Uint16 words. These bit patterns must not
  // be rejected, rounded, or canonicalized as half-float NaN/Infinity values.
  hub.fp16PersistentWeights256.set([0x7c00, 0x7e01, 0xfc01, 0x8000, 0xffff]);
  // Inactive Adam lanes still belong to the complete arena; preserve their
  // exact finite bits without pretending they currently train the encoder.
  hub.f64AdamFirstMoment64[63] = -0;
  hub.f64AdamSecondMoment64[63] = Number.MIN_VALUE;
  hub.persistentWeightCheckpointsSaved = 7;
  const target = structuredClone(original), freshHub = allocateHub.call(target);
  assert.notEqual(freshHub, hub);
  if (item.warmup) assert.notDeepEqual(freshHub.W_dyn2, hub.W_dyn2, 'Destination is a fresh, unlearned hub');
  await restorePair(original, target);
  const browserTarget = structuredClone(browser);
  for (let i = 0; i < item.steps; i++) {
    const originalDraws = advance(original, browser), restoredDraws = advance(target, browserTarget);
    assert.deepEqual(restoredDraws, originalDraws, 'Exactly matching exogenous random inputs');
    compareHub(target.trainableAlifeNeuralHub, original.trainableAlifeNeuralHub);
    compareExternal(target, original);
    assert.deepEqual(browserTarget, browser, 'No fixture browser mutation');
  }
});

test('same next full step is sensitive to retained prediction/Adam/history rather than weights alone', () => {
  const control = fixture(); for (let i = 0; i < 5; i++) advance(control);
  for (const name of ['hDyn16', 'zPredNext16', 'lastAction8', 'diffusedIdeaVec16', 'f64AdamFirstMoment64']) {
    const intact = structuredClone(control), erased = structuredClone(control);
    erased.trainableAlifeNeuralHub[name].fill(0);
    advance(intact); advance(erased);
    const a = intact.trainableAlifeNeuralHub, b = erased.trainableAlifeNeuralHub;
    const divergentWeights = ['W_perc_enc', 'W_dyn1', 'W_dyn2', 'W_diff1', 'W_gen1', 'W_robot_actor']
      .some(field => !raw(a[field]).equals(raw(b[field])));
    assert.equal(divergentWeights, true, name + ' is a necessary retained numerical input');
  }
});

test('full method retains callback chronology and post-increment frame arguments at the declared engine boundary', () => {
  const runtime = fixture(), hub = runtime.trainableAlifeNeuralHub, events = [];
  hub.totalBackpropStepsTrained = 11; runtime.simulationTick = 0;
  const ipc = { tag: 'controlled-ipc' };
  runtime.frontierNeuralCyberEngine = {
    stepFrontierModels60Hz(value) {
      assert.equal(value, runtime); assert.equal(hub.totalBackpropStepsTrained, 12);
      events.push('frontier'); hub.bestReasoningAction8[0] = .125;
    },
    syncWeightsToDisk(value, bridge) {
      assert.equal(value, runtime); assert.equal(bridge, ipc);
      assert.equal(hub.bestReasoningAction8[0], .125); events.push('frontier-save'); return Promise.resolve();
    }
  };
  runtime.bleedingEdge25Engine = { step60Hz(value, tick, frame) {
    assert.equal(value, runtime); assert.equal(tick, 12); assert.equal(frame, 12);
    assert.equal(hub.bestReasoningAction8[0], .125); events.push('bleeding'); hub.learnedMotorThrust2D[0] = .25;
  } };
  runtime.aotTotGotEngine = { step60Hz(value, tick, frame) {
    assert.equal(value, runtime); assert.equal(tick, 12); assert.equal(frame, 12);
    assert.equal(hub.learnedMotorThrust2D[0], .25); events.push('aot'); hub.learnedMotorThrust2D[0] = .5;
  } };
  advance(runtime, browserFixture(), ipc);
  assert.deepEqual(events, ['frontier', 'frontier-save', 'bleeding', 'aot']);
  assert.equal(hub.learnedMotorThrust2D[0], .5);
  // These explicitly labelled boundary callbacks verify ordering/arguments only;
  // their external model computation and asynchronous persistence are omitted.
});
