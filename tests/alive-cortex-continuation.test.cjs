'use strict';
// Complete LOCAL cortex/connectome continuation under an explicit equal sensory
// boundary. The actual allocation and entire production numerical method run
// unchanged. This does not claim persistence of external models, global clocks,
// live hardware entropy, browser/authority state, or asynchronous callbacks.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createHash, webcrypto } = require('node:crypto');
const codec = require('../systems/alive-learned-state-codec.js');
const registry = require('../systems/alive-learned-state-registry.js');
const source = fs.readFileSync(require.resolve('../index.html'), 'utf8');
const ALLOCATION_START = '        const initXavier = (rows, cols) => {';
const ALLOCATION_END = '        // Sovereign Browser Master Controller Telemetry';
const STEP_START = '      stepDeepCortex185K(domTelemetry = {}';
const STEP_END = '      // SENSE -> PREDICT';
function extract(begin, end, maximum) {
  const a = source.indexOf(begin), b = source.indexOf(end, a + begin.length);
  assert(a >= 0 && b > a, 'Production source boundaries exist in order');
  assert.equal(source.indexOf(begin, a + begin.length), -1, 'Unique source start');
  const value = source.slice(a, b);
  assert(value.length < maximum, 'Bounded production source extraction');
  return value;
}
const allocation = extract(ALLOCATION_START, ALLOCATION_END, 16000);
const method = extract(STEP_START, STEP_END, 30000);
const allocate = new Function('hybridQrng', '"use strict";\n' + allocation);
const step = new Function('"use strict";return ({\n' + method + '\n}).stepDeepCortex185K;')();
const raw = value => Buffer.from(value.buffer, value.byteOffset, value.byteLength);
const copyBytes = value => Buffer.from(raw(value));
const hash = value => createHash('sha256').update(value).digest('hex');
const metadata = tick => ({ creatureId: 'complete-local-cortex-fixture', policyId: 'controlled-primary-policy',
  checkpointId: 'controlled-cortex-boundary', logicalTick: tick, modelEpoch: 9,
  capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' });
const options = { crypto: webcrypto };
let adapterPromise;
function adapter() {
  return adapterPromise ||= require('../systems/alive-cortex-state.js').create({ registry, codec, ...options });
}
function vector(length, salt, scale = .25) {
  return Float32Array.from({ length }, (_, i) => (((i * 13 + salt * 7) % 41) - 20) * scale / 20);
}
function externalFixture() {
  return {
    W_actor: vector(80, 1), W_critic: vector(16, 2),
    obsVec: vector(16, 3, .65), hdcPooled16: vector(16, 4, .5), hdcLastCosineSimilarity: .375,
    flywireConnectome: { epgCompass: vector(16, 5, .6) },
    cognitiveCortex: { lastMeasurement: { shannonEntropyBits: 5.125, vocabTtr: .625,
      infoDensity: .8125, domDepth: 11, numbersAndEquations: 7 } },
    causalGraph: { propositions: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }], transitiveSyllogisms: [{ id: 's1' }] },
    verletPhysics: { jointTorques24: vector(24, 6), stanceFeetCount: 5, groundReactionForceN: 18.25, meanJointTorqueNm: .125 },
    personality: { curiosityDrive: .625, analyticalDepth: .75, boldness: .4375 },
    emotionState: { valence: -.125, arousal: .5625 },
    mesh: { nm: { DA: .625 }, viscera: { glc: .75 }, entanglementBits: 2.375, iitPhi: .4375 },
    simulationTick: 200
  };
}
function allocateInto(runtime, initialSeed = 17n, fn = allocate) {
  let seed = initialSeed, draws = 0;
  fn.call(runtime, { u64() { draws++; return seed++; } });
  return draws;
}
function fixture() { const runtime = externalFixture(); allocateInto(runtime); return runtime; }
function aliases(runtime) {
  const dc = runtime.deepCortex, cn = runtime.connectome512;
  assert.equal(dc.W_actor, runtime.W_actor); assert.equal(dc.W_critic, runtime.W_critic);
  assert.equal(cn.synWeights262K, dc.W_connectome_synapses);
  assert.equal(cn.synapticWeights, dc.W_connectome_synapses);
  assert.equal(cn.eligibilityTraces, dc.W_stdp_elig);
}
function compareLocal(actual, expected) {
  aliases(actual); aliases(expected);
  for (const name of ['deepCortex', 'connectome512']) {
    const a = actual[name], e = expected[name];
    assert.deepEqual(Object.keys(a).sort(), Object.keys(e).sort(), name + ' complete own-field set');
    for (const key of Object.keys(e)) {
      const left = a[key], right = e[key], label = name + '.' + key;
      if (ArrayBuffer.isView(right)) {
        assert.equal(left.constructor, right.constructor, label + ' dtype');
        assert.equal(left.length, right.length, label + ' shape');
        assert.equal(left.byteOffset, right.byteOffset, label + ' offset');
        assert.equal(raw(left).equals(raw(right)), true, label + ' exact bytes');
        assert.notEqual(left, right, label + ' independent view');
        assert.notEqual(left.buffer, right.buffer, label + ' independent backing');
      } else if (Array.isArray(right)) {
        assert.deepEqual(left, right, label); assert.notEqual(left, right);
      } else assert.equal(Object.is(left, right), true, label + ' exact primitive');
    }
  }
}
function compareExternal(actual, expected) {
  for (const key of Object.keys(expected)) {
    if (key !== 'deepCortex' && key !== 'connectome512') assert.deepEqual(actual[key], expected[key], 'External boundary ' + key);
  }
}
function advance(runtime) {
  const dc = runtime.deepCortex, oldStep = dc.cortexCoverageStep || 0;
  const oldActor = copyBytes(dc.W_actor_out), oldDecoder = copyBytes(dc.W_dec);
  runtime.simulationTick++;
  const fwStep = { headingAngleRad: .375, pfnSteering: [.125, -.0625] };
  assert.equal(step.call(runtime, { controlledUnusedTelemetry: true }, fwStep), dc);
  assert.equal(dc.cortexCoverageStep, oldStep + 1);
  assert.equal(dc.hopfieldWritePtr, (oldStep + 1) & 127);
  assert.equal(dc.attentionQkvPhase, (oldStep + 1) % 768);
  assert.equal(dc.attentionOutputPhase, (oldStep + 1) % 512);
  assert(dc.attnWeights8.every(v => Number.isFinite(v) && v > 0));
  assert(runtime.verletPhysics.jointTorques24.every(Number.isFinite));
  assert.equal(raw(dc.W_actor_out).equals(oldActor), false, 'Real actor learning occurs');
  assert.equal(raw(dc.W_dec).equals(oldDecoder), false, 'Real reconstruction learning occurs');
}
async function wireRestore(original, target) {
  const component = await adapter(), independentBeforeExport = structuredClone(original);
  const captured = component.capture(original, metadata(original.simulationTick), { generation: 4 });
  const decoded = await codec.decode(await codec.encode(captured, options), options);
  compareLocal(original, independentBeforeExport); compareExternal(original, independentBeforeExport);
  component.validate(decoded);
  const identities = [];
  for (const name of ['deepCortex', 'connectome512']) for (const [key, value] of Object.entries(target[name]))
    if (ArrayBuffer.isView(value)) identities.push({ object: target[name], key, value, buffer: value.buffer });
  const plan = component.preflight(decoded, target, { generation: 12 });
  assert.equal(component.recheck(plan, target, { generation: 12 }).status, 'ready');
  const receipt = component.apply(plan, target, { generation: 12 });
  assert.equal(receipt.status, 'applied'); assert.equal(receipt.readbackVerified, true);
  for (const entry of identities) {
    assert.equal(entry.object[entry.key], entry.value, 'Restore retains actual view identity ' + entry.key);
    assert.equal(entry.object[entry.key].buffer, entry.buffer, 'Restore retains backing identity ' + entry.key);
  }
  compareLocal(target, independentBeforeExport); compareExternal(target, independentBeforeExport);
}

test('actual complete cortex/connectome allocation has the declared local ownership and no hidden borrowed primary bytes', () => {
  const runtime = fixture(), dc = runtime.deepCortex, cn = runtime.connectome512;
  assert.equal(Object.keys(dc).length, 74); assert.equal(Object.keys(cn).length, 21);
  const paths = [...Object.values(dc), ...Object.values(cn)].filter(ArrayBuffer.isView);
  assert.equal(paths.length, 52);
  const owned = new Set(paths.filter(view => view !== runtime.W_actor && view !== runtime.W_critic));
  assert.equal(owned.size, 47);
  assert.equal(new Set([...owned].map(view => view.buffer)).size, 47, 'All local owned backings are distinct');
  assert.equal([...owned].reduce((sum, view) => sum + view.byteLength, 0), 4994760);
  for (const view of owned) { assert.equal(view.byteOffset, 0); assert.equal(view.byteLength, view.buffer.byteLength); }
  aliases(runtime);
});

test('eager cold fields consume no new entropy and preserve the actual legacy-lazy first numerical steps', () => {
  const legacyAllocation = allocation.replace(/        \/\/ BEGIN ALIVE CORTEX COLD STATE[\s\S]*?        \/\/ END ALIVE CORTEX COLD STATE\r?\n\r?\n/, '');
  assert.notEqual(legacyAllocation, allocation, 'Only the explicitly marked eager block is removed');
  assert.equal(hash(legacyAllocation), 'c2315ae19e641c3ef2520d46fff2977da7d234d5ea62caf20b18cd418804c8ad',
    'Remaining actual allocation equals the audited 22912bc allocation bytes');
  const legacyAllocate = new Function('hybridQrng', '"use strict";\n' + legacyAllocation);
  const eager = externalFixture(), lazy = externalFixture();
  assert.equal(allocateInto(eager), allocateInto(lazy, 17n, legacyAllocate), 'Identical exact initialization QRNG consumption');
  const eagerViews = [];
  for (const owner of [eager.deepCortex, eager.connectome512]) for (const [key, view] of Object.entries(owner))
    if (ArrayBuffer.isView(view)) eagerViews.push({ owner, key, view });
  for (let i = 0; i < 9; i++) {
    // Both use the corrected production attention bounds. The old 4096/8192
    // defect has its own independent negative control in the boundary suite.
    advance(eager); advance(lazy); compareLocal(eager, lazy); compareExternal(eager, lazy);
    for (const binding of eagerViews) assert.equal(binding.owner[binding.key], binding.view, 'First-use path keeps the preallocated view ' + binding.key);
  }
});

test('complete cortex/connectome wire restore continues the whole production method through retained phase boundaries', async t => {
  const original = fixture();
  // Finite bit patterns in an otherwise untouched tail must survive, including
  // signed zero and the smallest positive Float32 subnormal.
  original.deepCortex.W_body_genome[3262] = -0;
  new Uint32Array(original.deepCortex.W_body_genome.buffer)[3263] = 1;
  for (const boundary of [0, 7, 127, 511, 767, 1023]) {
    while (original.deepCortex.cortexCoverageStep < boundary) advance(original);
    await t.test('snapshot before local step ' + boundary, async () => {
      const target = structuredClone(original);
      allocateInto(target, 73n);
      assert.equal(raw(target.deepCortex.W_enc1).equals(raw(original.deepCortex.W_enc1)), false, 'Destination was independently initialized');
      await wireRestore(original, target);
      for (let i = 0; i < 5; i++) {
        advance(original); advance(target);
        compareLocal(target, original); compareExternal(target, original);
      }
    });
  }
  const dc = original.deepCortex;
  assert.equal(dc.attentionQkvUniqueParameters, 12288);
  assert.equal(dc.attentionOutputUniqueParameters, 4096);
  assert.equal(dc.attentionParameterCoveragePct, 100);
  assert.equal(dc.moeUniqueParametersVisited, 524288);
  assert.equal(dc.cortexPairedReadMask, 3); assert.equal(dc.cortexGradientMask, 255);
});

test('retained recurrent, selection, memory, critic and eligibility state causally changes the actual next numerical result', () => {
  const baseline = fixture(); for (let i = 0; i < 17; i++) advance(baseline);
  baseline.connectome512.v512.fill(1); // Equal explicit spike-producing boundary.
  const changes = {
    recurrent: h => h.deepCortex.rssmH.fill(.75),
    previousGates: h => { h.deepCortex.attnWeights8.fill(.01); h.deepCortex.attnWeights8[7] = .93; },
    expertPhase: h => { for (let i = 0; i < 8; i++) h.deepCortex.moeCoveragePhases8[i] = (h.deepCortex.moeCoveragePhases8[i] + 1) & 7; },
    expertCursor: h => { h.deepCortex.moeExplorationCursor = (h.deepCortex.moeExplorationCursor + 3) & 7; },
    hopfieldMemory: h => h.deepCortex.M_hopfield.fill(.5),
    previousCritic: h => { h.deepCortex.criticValue = -.75; },
    spikeTrace: h => h.connectome512.trace512.fill(0),
    eligibility: h => h.deepCortex.W_stdp_elig.fill(.5),
    presynapticCursor: h => { h.connectome512.axonalPresynapticCursor = (h.connectome512.axonalPresynapticCursor + 127) & 511; }
  };
  for (const [name, change] of Object.entries(changes)) {
    const intact = structuredClone(baseline), changed = structuredClone(baseline);
    change(changed); advance(intact); advance(changed);
    assert(['W_actor_out', 'W_dec', 'W_connectome_synapses'].some(field =>
      !raw(intact.deepCortex[field]).equals(raw(changed.deepCortex[field]))), name + ' changes actual learned weight bytes');
  }
});
