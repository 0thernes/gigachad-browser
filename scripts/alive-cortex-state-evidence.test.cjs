'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const evidence = require('./alive-cortex-state-evidence.cjs');
const independent = require('./alive-learned-state-wire-evidence.cjs');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const begin = source.indexOf('        this.deepCortex = {');
const end = source.indexOf('// END ALIVE CORTEX COLD STATE', begin);
assert(begin >= 0 && end > begin, 'Actual inert cortex/connectome allocation markers');
const allocation = source.slice(begin, end);
const initXavier = (rows, cols) => new Float32Array(rows * cols).fill(0.03125);
function fixture() {
  const runtime = { W_actor: new Float32Array(80), W_critic: new Float32Array(16) };
  new Function('initXavier', allocation).call(runtime, initXavier);
  new Uint32Array(runtime.deepCortex.W_dec.buffer).set([0x80000000, 1, 0x80000001, 0x7f7fffff, 0xff7fffff]);
  runtime.deepCortex.imaginedHorizon5Return = -0;
  return runtime;
}
const snapshot = { creatureId: 'cortex-oracle-fixture', policyId: 'policy-fixture', checkpointId: 'checkpoint-fixture',
  logicalTick: 37, modelEpoch: 2, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' };
const observe = runtime => evidence.captureCortexHydration(runtime);
const brief = value => JSON.stringify({ ok: value.ok, code: value.code, reason: value.reason, totals: value.totals, differences: value.differences });
const f64 = value => { const b = Buffer.alloc(8); b.writeDoubleLE(value); return { $type: 'f64', hex: b.toString('hex') }; };
function tag(value, schema) {
  if (schema.type === 'i53') return { $type: 'i53', value };
  if (schema.type === 'f64') return f64(value);
  if (schema.type === 'array') return { $type: 'array', items: value.map(item => tag(item, schema.items)) };
  return value;
}
function resolve(runtime, entry) {
  const roots = { dc: runtime.deepCortex, cn: runtime.connectome512, h: runtime };
  return entry.keys.reduce((value, key) => Object.getOwnPropertyDescriptor(value, key).value, roots[entry.root]);
}
// Manual wire assembly uses actual constructor allocations and direct bytes.
// The trusted independent static catalog supplies only path/layout metadata;
// production exporters, registry, codec and model stepping are never executed.
function manualWire(runtime = fixture()) {
  const catalog = evidence.createExpectedCortexCatalog(), parts = new Map();
  const tensorManifest = catalog.tensors.map(row => {
    const view = resolve(runtime, row.paths[0]);
    assert.equal(view.byteLength, row.byteLength); assert.equal(view.length, row.length);
    parts.set(row.id, Buffer.from(new Uint8Array(view.buffer, view.byteOffset, view.byteLength)));
    return structuredClone(row);
  });
  const stateValues = {};
  for (const row of catalog.descriptorDefinition.states) stateValues[row.id] = tag(resolve(runtime, row.paths[0]), row.schema);
  const record = { schema: 'gigachad.learned-state.v1', architecture: catalog.architecture, snapshot: { ...snapshot },
    tensorManifest, tensorBlob: {}, stateManifest: catalog.states, stateValues, resumeRules: [] };
  reseal(record, parts); return record;
}
function reseal(record, parts) {
  if (!parts) {
    const bytes = Buffer.from(record.tensorBlob.data, 'base64');
    parts = new Map(record.tensorManifest.map(row => [row.id, bytes.subarray(row.blobOffset, row.blobOffset + row.byteLength)]));
  }
  record.tensorManifest.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  let offset = 0;
  const bytes = Buffer.concat(record.tensorManifest.map(row => { const b = parts.get(row.id); row.blobOffset = offset; offset += b.length; row.sha256 = hash(b); return b; }));
  record.tensorBlob = { encoding: 'base64', byteLength: bytes.length, sha256: hash(bytes), data: bytes.toString('base64') };
}
function mutateBytes(record, id, mutate) {
  const bytes = Buffer.from(record.tensorBlob.data, 'base64'), row = record.tensorManifest.find(row => row.id === id);
  mutate(bytes.subarray(row.blobOffset, row.blobOffset + row.byteLength));
  record.tensorBlob.data = bytes.toString('base64'); record.tensorBlob.sha256 = hash(bytes);
  for (const item of record.tensorManifest) item.sha256 = hash(bytes.subarray(item.blobOffset, item.blobOffset + item.byteLength));
}
const decode = record => evidence.decodeCortexStateEvidence(JSON.stringify(record));
const assess = (record, raw, options) => evidence.assessCortexStateEvidence(JSON.stringify(record), raw, options);
const tensorId = field => evidence.createExpectedCortexCatalog().tensors.find(row => row.paths[0].keys.at(-1) === field).id;
const stateId = field => evidence.createExpectedCortexCatalog().descriptorDefinition.states.find(row => row.paths[0].keys.at(-1) === field).id;
function updateCoverageReceipts(runtime) {
  const dc = runtime.deepCortex, cn = runtime.connectome512;
  const popcount = value => value.toString(2).split('1').length - 1;
  dc.moeUniqueParametersVisited = Array.from(dc.moeCoverageMasks8).reduce((sum, mask) => sum + popcount(mask) * 8192, 0);
  dc.moeParameterCoveragePct = dc.moeUniqueParametersVisited * 100 / 524288;
  cn.uniqueSynapsesTraversed = Array.from(cn.axonCoverageMasks512).reduce((sum, mask) => sum + popcount(mask) * 64, 0);
  cn.synapseCoveragePct = cn.uniqueSynapsesTraversed * 100 / 262144;
  dc.attentionQkvUniqueParameters = Array.from(dc.attentionQkvCoverage768).filter(Boolean).length * 16;
  dc.attentionOutputUniqueParameters = Array.from(dc.attentionOutputCoverage512).filter(Boolean).length * 8;
  dc.attentionParameterCoveragePct = (dc.attentionQkvUniqueParameters + dc.attentionOutputUniqueParameters) * 100 / 16384;
}

test('actual constructor inventory and independently fingerprinted catalog agree without producer imports', () => {
  const runtime = fixture(), catalog = evidence.createExpectedCortexCatalog();
  assert.equal(Reflect.ownKeys(runtime.deepCortex).length, 74); assert.equal(Reflect.ownKeys(runtime.connectome512).length, 21);
  assert.equal(catalog.tensors.length, 47); assert.equal(catalog.states.length, 43);
  assert.equal(catalog.tensors.reduce((n, row) => n + row.byteLength, 0), 4994760);
  assert.equal(catalog.architecture.fingerprint, independent.fingerprintDescriptorDefinition(catalog.descriptorDefinition));
  const unique = new Set();
  for (const row of catalog.tensors) {
    const value = resolve(runtime, row.paths[0]); unique.add(value.buffer);
    for (const alias of row.paths) assert.equal(resolve(runtime, alias), value);
  }
  assert.equal(unique.size, 47); assert.equal(runtime.deepCortex.W_attn_out.length, 4096);
  assert.equal(runtime.deepCortex.attentionOutputCoverage512.length, 512);
});

test('manual wire and first direct capture preserve every cortex byte/state and five actual aliases', () => {
  const runtime = fixture(), raw = observe(runtime); assert.equal(raw.ok, true, brief(raw));
  const result = assess(manualWire(runtime), raw, { expectedSnapshot: snapshot });
  assert.equal(result.ok, true, brief(result));
  assert.equal(result.arraysChecked, 47); assert.equal(result.actualNativeViews, 47); assert.equal(result.comparedBytes, 4994760);
  assert.equal(result.comparedStates, 43); assert.equal(result.elementsDifferent, 0); assert.equal(result.validatedAliasCount, 5);
  assert.equal(result.snapshotMatched, true); assert.equal(result.completeApplicationCatalog, false);
  assert.equal(JSON.stringify(result).includes('dataBase64'), false);
  const decoded = decode(manualWire(runtime)), bytes = decoded.backings.get(tensorId('W_dec'));
  assert.equal(bytes.readUInt32LE(0), 0x80000000); assert.equal(bytes.readUInt32LE(4), 1);
  assert.equal(bytes.readUInt32LE(8), 0x80000001); assert.equal(bytes.readUInt32LE(12), 0x7f7fffff);
  assert.equal(decoded.states[stateId('imaginedHorizon5Return')].hex, '0000000000000080');
});

test('observer is self-contained and retains bytes before later mutation/detachment', () => {
  const context = vm.createContext({ btoa });
  vm.runInContext('var runtime={W_actor:new Float32Array(80),W_critic:new Float32Array(16)}; (function(initXavier){' + allocation + '}).call(runtime,(a,b)=>new Float32Array(a*b)); var raw=(' + evidence.captureCortexHydration.toString() + ')(runtime);', context);
  const raw = JSON.parse(vm.runInContext('JSON.stringify(raw)', context));
  assert.equal(raw.ok, true); assert.equal(evidence.compareCortexHydration(raw, raw).ok, true);
  const runtime = fixture(), before = observe(runtime), record = manualWire(runtime);
  runtime.deepCortex.W_dec.fill(7); runtime.deepCortex.topMoEExperts[0] = 'modified'; runtime.connectome512.meanSynapticWeight = 4;
  structuredClone(runtime.deepCortex.W_moe_experts.buffer, { transfer: [runtime.deepCortex.W_moe_experts.buffer] });
  assert.equal(assess(record, before).ok, true);
});

test('native view/buffer expandos are ignored without getters, iterators or typed-index enumeration', () => {
  const runtime = fixture(); let called = 0;
  const trap = { get() { called++; throw new Error('must not read metadata'); }, configurable: true };
  for (const target of [runtime.deepCortex.W_moe_experts, runtime.deepCortex.W_moe_experts.buffer]) {
    for (const key of ['buffer', 'length', 'byteLength', 'toJSON', 'slice', 'extra']) Object.defineProperty(target, key, trap);
    Object.defineProperty(target, Symbol.iterator, trap);
  }
  const raw = observe(runtime); assert.equal(raw.ok, true, brief(raw)); assert.equal(called, 0);
  assert.equal(evidence.compareCortexHydration(raw, raw).ok, true);
});

test('wrong own fields and getters fail before callbacks and failed first capture cannot be healed', () => {
  let called = 0;
  const mutations = [r => { r.deepCortex.extra = 1; }, r => { delete r.deepCortex.h128; }, r => { r.connectome512[Symbol('extra')] = 1; },
    r => Object.defineProperty(r.deepCortex, 'W_dec', { get() { called++; return new Float32Array(8192); } }),
    r => Object.defineProperty(r, 'deepCortex', { get() { called++; return {}; } }),
    r => Object.defineProperty(r.connectome512, 'meanSynapticWeight', { writable: false }),
    r => Object.defineProperty(r.deepCortex.topMoEExperts, '0', { get() { called++; return 'heal'; } })];
  for (const mutate of mutations) { const runtime = fixture(); mutate(runtime); const raw = observe(runtime); assert.equal(raw.ok, false); assert.equal(called, 0); }
  const runtime = fixture(), original = runtime.deepCortex.W_dec;
  runtime.deepCortex.W_dec = new Float32Array(3); const first = observe(runtime); runtime.deepCortex.W_dec = original;
  const result = assess(manualWire(runtime), first); assert.equal(result.ok, false); assert.equal(result.code, 'CORTEX_CAPTURE_FAILED');
});

test('all declared aliases and unexpected backing/view aliases are checked by identity', () => {
  const mutations = [r => { r.deepCortex.W_actor = new Float32Array(r.W_actor); }, r => { r.deepCortex.W_critic = new Float32Array(r.W_critic); },
    r => { r.connectome512.synWeights262K = new Float32Array(r.deepCortex.W_connectome_synapses); },
    r => { r.connectome512.synapticWeights = new Float32Array(r.deepCortex.W_connectome_synapses.buffer); },
    r => { r.connectome512.eligibilityTraces = r.deepCortex.W_connectome_synapses; },
    r => { r.deepCortex.rssmH = r.deepCortex.h128; }, r => { r.deepCortex.rssmH = new Float32Array(r.deepCortex.h128.buffer); },
    r => { r.W_critic = r.deepCortex.W_critic = new Float32Array(r.W_actor.buffer, 0, 16); }];
  for (const mutate of mutations) { const runtime = fixture(); mutate(runtime); assert.equal(observe(runtime).ok, false, mutate.toString()); }
});

test('fixed standalone geometry rejects shared, resizable, detached, offset and custom-prototype views', () => {
  const mutations = [r => { r.deepCortex.W_dec = new Float32Array(new SharedArrayBuffer(32768)); },
    r => { r.deepCortex.W_dec = new Float32Array(new ArrayBuffer(32768, { maxByteLength: 65536 })); },
    r => { structuredClone(r.deepCortex.W_dec.buffer, { transfer: [r.deepCortex.W_dec.buffer] }); },
    r => { r.deepCortex.W_dec = new Float32Array(new ArrayBuffer(32772), 4, 8192); },
    r => { r.deepCortex.W_dec = new Float64Array(8192); },
    r => { Object.setPrototypeOf(r.deepCortex.W_dec, Object.create(Float32Array.prototype)); },
    r => { Object.setPrototypeOf(r.deepCortex, {}); }];
  for (const mutate of mutations) { const runtime = fixture(); mutate(runtime); assert.equal(observe(runtime).ok, false); }
});

test('comparison requires actual learned matrix evolution, not counters, activations or associative memory', () => {
  const runtime = fixture(), original = observe(runtime);
  runtime.deepCortex.cortexCoverageStep++; runtime.deepCortex.h128[0] += .5; runtime.deepCortex.M_hopfield[0] += .25;
  let result = evidence.compareCortexHydration(original, observe(runtime));
  assert.equal(result.ok, true); assert(result.changedBackingBytes > 0); assert(result.changedScratchBytes > 0);
  assert.equal(result.changedLearnedMatrixBytes, 0); assert(result.changedStateIds.length > 0);
  runtime.deepCortex.W_dec[6] += .125;
  result = evidence.compareCortexHydration(original, observe(runtime));
  assert(result.changedLearnedMatrixBytes > 0); assert.deepEqual(result.changedLearnedMatrixIds, [tensorId('W_dec')]);
});

test('each of47 backing regions is compared exactly including last bytes of largest matrices', () => {
  const runtime = fixture(), raw = observe(runtime), saved = manualWire(runtime);
  for (const row of evidence.createExpectedCortexCatalog().tensors) {
    const view = resolve(runtime, row.paths[0]);
    if (view instanceof Float32Array) { const words = new Uint32Array(view.buffer); words[words.length - 1] ^= 1; }
    else view[view.length - 1] ^= 1;
  }
  updateCoverageReceipts(runtime);
  const next = observe(runtime); assert.equal(next.ok, true, brief(next));
  const result = assess(saved, next); assert.equal(result.ok, false); assert.equal(result.changedBackingIds.length, 47);
  assert.equal(result.elementsDifferent, 47); assert.equal(result.changedBackingBytes, 47);
  assert.equal(assess(saved, raw).ok, true);
});

test('present primary, trainer, hub and replay storage cannot alias cortex even when bytes match', () => {
  const mutations = [r => { r.W_world = r.deepCortex.h256; },
    r => { r.bleedingEdge25Engine = { W_hyper_u: r.deepCortex.W_critic_out }; },
    r => { r.trainableAlifeNeuralHub = { visionDomGrid8x8: r.deepCortex.W_critic_out }; },
    r => { r.trainableAlifeNeuralHub = { mixedArenaBuffer: r.deepCortex.W_dec.buffer }; },
    r => { r.trainableAlifeNeuralHub = { replayRing32: [{ z16: r.deepCortex.W_critic_out, a8: new Float32Array(8), zNext16: new Float32Array(16) }] }; },
    r => { r.trainableAlifeNeuralHub = { replayRing32: new Array(33) }; }];
  for (const mutate of mutations) { const runtime = fixture(); mutate(runtime); assert.equal(observe(runtime).ok, false); }
  const runtime = fixture();
  runtime.bleedingEdge25Engine = { W_hyper_u: new Float32Array(16) };
  runtime.trainableAlifeNeuralHub = { visionDomGrid8x8: new Float32Array(64), replayRing32: [] };
  assert.equal(observe(runtime).ok, true);
});

test('every floating backing rejects nonfinite values and Uint8 phases/flags enforce source-proved domains', () => {
  const runtime = fixture();
  for (const row of evidence.createExpectedCortexCatalog().tensors) {
    const view = resolve(runtime, row.paths[0]);
    if (!(view instanceof Float32Array)) continue;
    const old = view[view.length - 1]; view[view.length - 1] = NaN;
    assert.equal(observe(runtime).ok, false, row.id); view[view.length - 1] = old;
  }
  for (const [root, field, value] of [['deepCortex', 'moeCoveragePhases8', 8], ['deepCortex', 'attentionQkvCoverage768', 2],
    ['deepCortex', 'attentionOutputCoverage512', 2], ['connectome512', 'spikes512', 2], ['connectome512', 'axonCoveragePhases512', 8]]) {
    const runtime = fixture(); runtime[root][field][0] = value; assert.equal(observe(runtime).ok, false, field);
  }
});

test('valid-hash wire cannot hide nonfinite tensor data or impossible phase/flag domains', () => {
  for (const [field, mutate] of [['W_dec', bytes => bytes.writeUInt32LE(0x7fc00001)],
    ['W_moe_experts', bytes => bytes.writeUInt32LE(0x7f800000, bytes.length - 4)],
    ['moeCoveragePhases8', bytes => { bytes[0] = 8; }], ['attentionOutputCoverage512', bytes => { bytes[0] = 2; }],
    ['spikes512', bytes => { bytes[0] = 2; }]]) {
    const record = manualWire(); mutateBytes(record, tensorId(field), mutate);
    assert.throws(() => decode(record), error => error.code === 'CORTEX_DOMAIN');
  }
});

test('state policies reject counter negativezero/fraction, wrong domains, extended/holey arrays and oversize strings', () => {
  const cases = [r => { r.deepCortex.cortexCoverageStep = -0; }, r => { r.deepCortex.cortexCoverageStep = .5; },
    r => { r.deepCortex.attentionOutputPhase = 512; }, r => { r.deepCortex.attentionQkvPhase = 768; },
    r => { r.deepCortex.hopfieldWritePtr = 128; }, r => { r.connectome512.axonalPresynapticCursor = 512; },
    r => { r.deepCortex.rssmKlDivergence = -1; }, r => { r.deepCortex.gradNormL2 = -1; },
    r => { r.deepCortex.moeCoverageScope = 'x'.repeat(2049); }, r => { delete r.deepCortex.topMoEExperts[0]; },
    r => { r.deepCortex.topMoEExperts.extra = 'bad'; }, r => { r.connectome512.neuropilNames[0] = 'incorrect'; },
    r => { r.deepCortex.moeActiveExpertIndices = [1, 1]; }, r => { r.deepCortex.moeActiveGates = [NaN, .5]; }];
  for (const mutate of cases) { const runtime = fixture(); mutate(runtime); assert.equal(observe(runtime).ok, false, mutate.toString()); }
  for (const [field, value] of [['attentionOutputPhase', { $type: 'i53', value: 512 }], ['rssmKlDivergence', f64(-1)],
    ['cortexCoverageStep', { $type: 'i53', value: .5 }], ['moeCoverageScope', 'x'.repeat(2049)]]) {
    const record = manualWire(); record.stateValues[stateId(field)] = value; assert.throws(() => decode(record));
  }
});

test('numeric arrays preserve Float64 bits but saved nested tags must match the declared i53/f64 schema', () => {
  const runtime = fixture(); runtime.deepCortex.moeActiveExpertIndices = [1, 2]; runtime.deepCortex.moeActiveGates = [.75, .25];
  runtime.deepCortex.topMoEExperts = ['EXP1:FLYWIRE_RING', 'EXP2:HIPPOCAMPAL_MEM'];
  const raw = observe(runtime), record = manualWire(runtime);
  assert.equal(raw.ok, true, brief(raw)); assert.equal(assess(record, raw).ok, true);
  const indices = stateId('moeActiveExpertIndices'), gates = stateId('moeActiveGates');
  record.stateValues[indices].items[0] = f64(1);
  assert.throws(() => decode(record), error => error.code === 'CORTEX_STATE');
  record.stateValues[indices].items[0] = { $type: 'i53', value: 1 };
  record.stateValues[gates].items[0] = { $type: 'i53', value: 0 };
  assert.throws(() => decode(record), error => error.code === 'CORTEX_STATE');
});

test('coverage counts/percentages and expert selection receipts are independently enforced on raw and valid-hash wire', () => {
  for (const mutate of [r => { r.deepCortex.moeCoverageMasks8[0] = 1; }, r => { r.connectome512.axonCoverageMasks512[0] = 1; },
    r => { r.deepCortex.attentionOutputCoverage512[0] = 1; }, r => { r.deepCortex.attentionQkvCoverage768[0] = 1; },
    r => { r.deepCortex.topMoEExperts[0] = 'unknown'; }, r => { r.deepCortex.moeActiveExpertIndices = [1]; r.deepCortex.moeActiveGates = [.5]; },
    r => { r.deepCortex.moeActiveExpertIndices = [1, 2]; r.deepCortex.moeActiveGates = [.75, .25]; }, // Valid labels/gates separately, incorrect label-index relation.
    r => { r.deepCortex.moeActiveExpertIndices = [0, 4]; r.deepCortex.moeActiveGates = [.5, .25]; }]) {
    const runtime = fixture(); mutate(runtime); assert.equal(observe(runtime).ok, false);
    assert.throws(() => decode(manualWire(runtime)), error => error.code === 'CORTEX_RECEIPT');
  }
  const runtime = fixture(); runtime.deepCortex.moeCoverageMasks8[2] = 255; runtime.connectome512.axonCoverageMasks512[3] = 129;
  runtime.deepCortex.attentionQkvCoverage768[767] = 1; runtime.deepCortex.attentionOutputCoverage512[511] = 1;
  updateCoverageReceipts(runtime);
  assert.equal(assess(manualWire(runtime), observe(runtime)).ok, true);
});

test('strict architecture/roster/alias/shape/padding and digest checks reject independently resealed wire corruption', () => {
  const changes = [r => { r.architecture.fingerprint = '0'.repeat(64); },
    r => { r.architecture.components[0].implementationDigest = '0'.repeat(64); },
    r => { r.tensorManifest[0].backingOffset = 4; r.tensorManifest[0].backingByteLength += 4; },
    r => { r.tensorManifest[0].backingByteLength = 32 * 1024 * 1024; },
    r => { const row = r.tensorManifest.find(row => row.paths.length > 1); row.paths.pop(); },
    r => { const row = r.tensorManifest.find(row => row.length === 4096); row.dimensions = [4096]; },
    r => { r.tensorManifest.pop(); reseal(r); },
    r => { r.stateManifest.pop(); },
    r => { r.stateManifest.reverse(); },
    r => { r.stateValues.extra = f64(0); },
    r => { const b = Buffer.from(r.tensorBlob.data, 'base64'); b[0] ^= 1; r.tensorBlob.data = b.toString('base64'); },
    r => { r.tensorBlob.data += 'AAAA'; }];
  for (const mutate of changes) { const record = manualWire(); mutate(record); assert.throws(() => decode(record), mutate.toString()); }
});

test('malformed serialized observations and snapshot mismatches cannot qualify', () => {
  const runtime = fixture(), record = manualWire(runtime), raw = observe(runtime);
  const mutations = [r => { r.backings[0].dataBase64 = r.backings[0].dataBase64.slice(1); },
    r => { r.backings[1].id = r.backings[0].id; }, r => { r.views[0].backingId = r.views[1].backingId; },
    r => { r.aliases[0].targetId = 'fake'; }, r => { r.totals.uniqueBytes--; },
    r => { delete r.states[stateId('cortexCoverageStep')]; }, r => { r.states[stateId('cortexCoverageStep')] = { $type: 'f64', hex: '0000000000000080' }; }];
  for (const mutate of mutations) {
    const bad = structuredClone(raw); mutate(bad);
    assert.equal(assess(record, bad).ok, false); assert.equal(evidence.compareCortexHydration(bad, raw).ok, false);
  }
  const result = assess(record, raw, { expectedSnapshot: { ...snapshot, logicalTick: 38 } });
  assert.equal(result.ok, false); assert.equal(result.snapshotMatched, false);
  assert(result.differences.some(row => row.id === 'snapshot.logicalTick'));
  const json = JSON.stringify(record);
  assert.throws(() => evidence.decodeCortexStateEvidence(json.replace('"logicalTick":37', '"logicalTick":37,"logicalTick":37')));
  assert.throws(() => evidence.decodeCortexStateEvidence(' ' + json));
  assert.throws(() => evidence.decodeCortexStateEvidence(' '.repeat(32 * 1024 * 1024 + 1)));
});
