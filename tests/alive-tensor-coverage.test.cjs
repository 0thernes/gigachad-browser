'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const page = fs.readFileSync(require.resolve('../index.html'), 'utf8');
function block(begin, end, args) {
  const start = page.indexOf(begin), stop = page.indexOf(end, start);
  assert(start > page.indexOf('stepDeepCortex185K(domTelemetry'));
  assert(stop > start);
  return vm.runInNewContext(`(function(${args}) { ${page.slice(start, stop)} })`);
}
const moe = block('// BEGIN BOUNDED MOE COVERAGE', '// END BOUNDED MOE COVERAGE', 'dc,h256');
const connectome = block('// BEGIN BOUNDED CONNECTOME COVERAGE', '// END BOUNDED CONNECTOME COVERAGE', 'dc,m,h256,x');
const attention = block('// BEGIN BOUNDED ATTENTION COVERAGE', '// END BOUNDED ATTENTION COVERAGE', 'dc,h128,zPost,rH');
const rssm = block('// BEGIN ROTATING RSSM PROJECTION', '// END ROTATING RSSM PROJECTION', 'dc,Wpri,Wpost,rH,h128,zPri,zPost,pairedColumnPhase');
const master = block('// BEGIN ROTATING MASTER PROJECTION', '// END ROTATING MASTER PROJECTION', 'dc,zPost,pairedColumnPhase');
const actor = block('// BEGIN ROTATING ACTOR PROJECTION', '// END ROTATING ACTOR PROJECTION', 'dc,Wah,zPost,rH,pairedColumnPhase');
const critic = block('// BEGIN ROTATING CRITIC PROJECTION', '// END ROTATING CRITIC PROJECTION', 'dc,Wch,Wco,zPost,pairedColumnPhase');
const gradients = block('// BEGIN ROTATING CORTEX GRADIENTS', '// END ROTATING CORTEX GRADIENTS', 'dc,Wao32,Wdec,actH,zPost,x,tdErr,lr,gradientColumnPhase');
const hopfield = block('// BEGIN BOUNDED HOPFIELD READOUT', '// END BOUNDED HOPFIELD READOUT', 'dc,zPost');

function watchReads(values) {
  const seen = new Uint8Array(values.length);
  let count = 0, unique = 0;
  const proxy = new Proxy(values, { get(target, key) {
    if (typeof key === 'string' && /^(0|[1-9]\d*)$/.test(key)) {
      const index = Number(key); count++;
      if (!seen[index]) { seen[index] = 1; unique++; }
    }
    return Reflect.get(target, key, target);
  } });
  return { proxy, seen, get count() { return count; }, get unique() { return unique; } };
}
function expertFixture() {
  return { W_moe_experts: new Float32Array(524288), attnWeights8: new Float32Array([1, 0, 0, 0, 0, 0, 0, 0]) };
}
function synapseFixture() {
  return { host: { connectome512: { v512: new Float32Array(512), spikes512: new Float32Array(512),
    trace512: new Float32Array(512), stdpUpdatesCount: 0 }, flywireConnectome: { epgCompass: new Float32Array(16) } },
    dc: { W_connectome_synapses: new Float32Array(262144), W_stdp_elig: new Float32Array(262144) },
    mesh: { nm: { DA: .35 } }, h256: new Float32Array(256), x: new Float32Array(64) };
}
function axons(fixture) { connectome.call(fixture.host, fixture.dc, fixture.mesh, fixture.h256, fixture.x); }

test('actual expert inference reads all 524288 parameter lanes under the unchanged 16384-MAC step budget', () => {
  const dc = expertFixture(), read = watchReads(dc.W_moe_experts), input = new Float32Array(256);
  dc.W_moe_experts = read.proxy;
  const experts = new Set();
  for (let step = 0; step < 56; step++) {
    input.fill(.2); const before = read.count;
    moe(dc, input);
    assert.equal(read.count - before, 16384, 'actual array reads equal the previous two-slice budget');
    assert.equal(dc.moeParameterVisitsThisStep, 16384);
    assert.equal(dc.moeParameterVisits, read.count);
    assert.equal(dc.moeUniqueParametersVisited, read.unique, 'coverage counts observed lanes, not elapsed ticks');
    assert(dc.moeActiveGates.every(value => value >= .05 && value <= .95));
    assert.equal(dc.moeActiveExpertIndices[0], 0, 'highest-gate expert remains active');
    dc.moeActiveExpertIndices.forEach(expert => experts.add(expert));
  }
  assert.equal(experts.size, 8);
  assert.equal(read.unique, 524288);
  assert(read.seen.every(Boolean));
  assert.equal(dc.moeParameterCoveragePct, 100);
});

test('an old permanently omitted expert row/column changes the actual cortex activation on its rotating phase', () => {
  const baseline = expertFixture(), changed = expertFixture();
  baseline.attnWeights8.fill(0); baseline.attnWeights8[7] = 1;
  changed.attnWeights8.set(baseline.attnWeights8);
  changed.W_moe_experts[7 * 65536 + 255 * 256 + 255] = 1;
  const left = new Float32Array(256), right = new Float32Array(256);
  for (let phase = 0; phase < 8; phase++) {
    left.fill(.2); right.fill(.2); moe(baseline, left); moe(changed, right);
    if (phase < 7) assert.deepEqual(right, left, 'the changed lane is not read before its scheduled phase');
  }
  assert(right[255] > left[255] + .01);
  assert.equal(changed.moeCoverageMasks8[7], 255);
});

test('zero-score experts retain a nonzero exploration readout and cannot be counted as merely muted computations', () => {
  const left = expertFixture(), right = expertFixture();
  right.W_moe_experts[7 * 65536] = 1;
  let affected = false;
  for (let step = 0; step < 7; step++) {
    const a = new Float32Array(256).fill(.2), b = new Float32Array(256).fill(.2);
    moe(left, a); moe(right, b);
    if (right.moeActiveExpertIndices.includes(7)) {
      assert.equal(right.moeActiveGates[1], .05);
      affected = b[0] > a[0];
    }
  }
  assert(affected);
});

test('actual spike traversal reaches all 262144 synapses without exceeding 44 by 64 work per step', () => {
  const f = synapseFixture(), cn = f.host.connectome512, read = watchReads(f.dc.W_connectome_synapses);
  f.dc.W_connectome_synapses = read.proxy;
  for (let step = 0; step < 94; step++) {
    cn.v512.fill(1); const before = read.count;
    axons(f);
    assert.equal(cn.activeSpikesCount, 512, 'all actual spikes are distinguished from admitted presynaptic work');
    assert.equal(cn.processedPresynapticSpikes, 44);
    assert.equal(read.count - before, 2816);
    assert.equal(cn.activeSynapsesTraversed, read.count - before, 'no former eightfold overstatement');
    assert.equal(cn.synapseVisits, read.count);
    assert.equal(cn.stdpUpdatesCount, read.count);
    assert.equal(cn.uniqueSynapsesTraversed, read.unique);
  }
  assert.equal(read.unique, 262144);
  assert(read.seen.every(Boolean));
  assert.equal(cn.synapseCoveragePct, 100);
  assert.equal(cn.axonCoverageMasks512[511], 255, 'high-index neurons are not starved by low-index spikes');
});

test('previously omitted synapse from neuron 511 to neuron 0 causes actual postsynaptic voltage on its next phase', () => {
  const base = synapseFixture(), changed = synapseFixture();
  changed.dc.W_connectome_synapses[511 * 512] = 1;
  for (let phase = 0; phase < 2; phase++) {
    base.host.connectome512.v512.fill(0); changed.host.connectome512.v512.fill(0);
    base.host.connectome512.v512[511] = changed.host.connectome512.v512[511] = 1;
    axons(base); axons(changed);
    if (phase === 0) assert.equal(changed.host.connectome512.v512[0], 0);
  }
  assert.equal(base.host.connectome512.v512[0], 0);
  assert.ok(Math.abs(changed.host.connectome512.v512[0] - .14) < 1e-6);
  assert.equal(changed.host.connectome512.activeSynapsesTraversed, 64);
  assert.equal(changed.host.connectome512.uniqueSynapsesTraversed, 128);
});

test('silent neurons claim no synapse execution or coverage and the sparse phases resume when a spike arrives', () => {
  const f = synapseFixture(), cn = f.host.connectome512;
  for (let i = 0; i < 10; i++) axons(f);
  assert.equal(cn.activeSpikesCount, 0);
  assert.equal(cn.activeSynapsesTraversed, 0);
  assert.equal(cn.uniqueSynapsesTraversed, 0);
  assert.equal(cn.synapseCoveragePct, 0);
  cn.v512[400] = 1; axons(f);
  assert.equal(cn.activeSpikesCount, 1);
  assert.equal(cn.processedPresynapticSpikes, 1);
  assert.equal(cn.activeSynapsesTraversed, 64);
  assert.equal(cn.uniqueSynapsesTraversed, 64);
});

function declaredCortexMatrix(name) {
  const start = page.indexOf('        this.deepCortex = {'), end = page.indexOf('        this.deepCortex.totalParams =', start);
  assert(start > 0 && end > start);
  const matches = [...page.slice(start, end).matchAll(new RegExp('\\b' + name + ':\\s*(initXavier\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\))', 'g'))];
  assert.equal(matches.length, 1, 'one actual constructor allocation for ' + name);
  return vm.runInNewContext(matches[0][1], { initXavier: (rows, columns) => new Float32Array(rows * columns) });
}
function attentionFixture() { return { W_attn_qkv: declaredCortexMatrix('W_attn_qkv'), W_attn_out: declaredCortexMatrix('W_attn_out'), attnWeights8: new Float32Array(8) }; }
test('bounded attention consumes all Q/K/V and output coefficients with the original 16 plus 8 reads per step', () => {
  const dc = attentionFixture(), qkv = watchReads(dc.W_attn_qkv), out = watchReads(dc.W_attn_out);
  dc.W_attn_qkv = qkv.proxy; dc.W_attn_out = out.proxy;
  const latent = new Float32Array(128).fill(.2);
  for (let step = 0; step < 1024; step++) {
    const oldQ = qkv.count, oldO = out.count;
    attention(dc, latent, latent, latent);
    assert.equal(qkv.count - oldQ, 16); assert.equal(out.count - oldO, 8);
    assert.equal(dc.attentionQkvUniqueParameters, qkv.unique);
    assert.equal(dc.attentionOutputUniqueParameters, out.unique);
    assert.equal(dc.attentionParameterVisits, qkv.count + out.count);
    assert(dc.attnWeights8.every(value => Number.isFinite(value) && value > 0));
    if (step === 767) assert.equal(qkv.unique, 12288);
  }
  assert.equal(qkv.unique, 12288); assert.equal(out.unique, 4096);
  assert(qkv.seen.every(Boolean)); assert(out.seen.every(Boolean));
  assert.equal(dc.attentionParameterCoveragePct, 100);
});

for (const field of ['W_attn_qkv', 'W_attn_out']) test(`the last previously unused ${field} coefficient changes actual expert gates`, () => {
  const base = attentionFixture(), changed = attentionFixture(), latent = new Float32Array(128).fill(.2);
  attention(base, latent, latent, latent); attention(changed, latent, latent, latent);
  base.attentionQkvPhase = changed.attentionQkvPhase = 767;
  base.attentionOutputPhase = changed.attentionOutputPhase = 511;
  changed[field][changed[field].length - 1] = 2;
  attention(base, latent, latent, latent); attention(changed, latent, latent, latent);
  assert(changed.attnWeights8[7] > base.attnWeights8[7]);
});

test('prior/posterior, master, actor and critic projections cover all 65536 weights in two bounded phases', () => {
  const weights = { prior: watchReads(new Float32Array(16384)), post: watchReads(new Float32Array(16384)),
    master: watchReads(new Float32Array(8192)), actor: watchReads(new Float32Array(16384)), critic: watchReads(new Float32Array(8192)) };
  const latent = new Float32Array(128).fill(.2), zero = new Float32Array(128), dc = {
    W_browser_master: weights.master.proxy, masterCmd64: new Float32Array(64), actH: new Float32Array(128), criticValue: 0 };
  for (const phase of [0, 2]) {
    rssm(dc, weights.prior.proxy, weights.post.proxy, latent, latent, new Float32Array(128), zero, phase);
    master(dc, latent, phase); actor(dc, weights.actor.proxy, latent, latent, phase);
    critic(dc, weights.critic.proxy, new Float32Array(64).fill(.2), latent, phase);
  }
  for (const [name, read] of Object.entries(weights)) {
    assert.equal(read.count, read.seen.length, name + ' retains half-matrix work per call');
    assert.equal(read.unique, read.seen.length, name + ' covers its entire matrix');
  }
});

test('last odd column weights causally change prior, posterior, master, actor and critic readouts', () => {
  const latent = new Float32Array(128).fill(.2), pri = new Float32Array(16384), post = new Float32Array(16384);
  pri[16383] = post[16383] = 1;
  const zPri = new Float32Array(128), zPost = new Float32Array(128), dc = {
    W_browser_master: new Float32Array(8192), masterCmd64: new Float32Array(64), actH: new Float32Array(128), criticValue: 0 };
  rssm(dc, pri, post, latent, latent, zPri, zPost, 0);
  assert.equal(zPri[127], 0); assert.equal(zPost[127], 0);
  rssm(dc, pri, post, latent, latent, zPri, zPost, 2);
  assert(zPri[127] > 0); assert(zPost[127] > 0);
  dc.W_browser_master[8191] = 1;
  master(dc, latent, 0); assert.equal(dc.masterCmd64[63], 0);
  master(dc, latent, 2); assert(dc.masterCmd64[63] > 0);
  actor(dc, pri, latent, latent, 0); assert.equal(dc.actH[127], 0);
  actor(dc, pri, latent, latent, 2); assert(dc.actH[127] > 0);
  const wco = new Float32Array(64).fill(.2);
  critic(dc, dc.W_browser_master, wco, latent, 0); assert.equal(dc.criticValue, 0);
  critic(dc, dc.W_browser_master, wco, latent, 2); assert(dc.criticValue > 0);
});

test('sparse production gradients update every actor output and decoder lane over eight phases with unchanged budgets', () => {
  const output = new Float32Array(4096), decoder = new Float32Array(8192), a = watchReads(output), d = watchReads(decoder);
  const latent = new Float32Array(128).fill(.2), x = new Float32Array(64).fill(.3);
  const dc = { act32: new Float32Array(32), decX64: new Float32Array(64) };
  for (let phase = 0; phase < 8; phase++) {
    const oldA = a.count, oldD = d.count;
    gradients(dc, a.proxy, d.proxy, latent, latent, x, .5, .01, phase);
    assert.equal(a.count - oldA, 512); assert.equal(d.count - oldD, 1024);
  }
  assert.equal(a.unique, 4096); assert.equal(d.unique, 8192);
  assert(output.every(value => value > 0)); assert(decoder.every(value => value > 0));
  assert(output[4095] > 0); assert(decoder[8191] > 0);
});

test('every episodic memory slot is read into the posterior, including the final lane, rather than being write-only state', () => {
  const dc = { M_hopfield: new Float32Array(16384).fill(.5), hopfieldWritePtr: 0 }, read = watchReads(dc.M_hopfield);
  dc.M_hopfield = read.proxy;
  const posterior = new Float32Array(128);
  for (let slot = 0; slot < 128; slot++) {
    posterior.fill(0); hopfield(dc, posterior);
    assert(posterior.every(value => value > 0 && value < .04));
  }
  assert.equal(read.count, 16384); assert.equal(read.unique, 16384);
  assert(read.seen[16383]); assert(posterior[127] > 0);
  assert.equal(dc.hopfieldWritePtr, 0);
});

test('the entire production cortex method composes the rotated paths and publishes finite downstream joint commands', () => {
  const start = page.indexOf('      stepDeepCortex185K(domTelemetry = {}'), end = page.indexOf('\n      // SENSE -> PREDICT', start);
  assert(start > 0 && end > start);
  const step = vm.runInNewContext('({' + page.slice(start, end) + '}).stepDeepCortex185K');
  const f = synapseFixture(), dc = f.dc;
  const sizes = { x64: 64, W_enc1: 16384, b_enc1: 256, ln1_g: 256, h256: 256,
    W_enc2: 32768, b_enc2: 128, ln2_g: 128, h128: 128, W_moe_experts: 524288, attnWeights8: 8,
    W_rssm_rec: 16384, W_rssm_in: 16384, W_prior: 16384, W_post: 16384, W_dec: 8192,
    rssmH: 128, rssmZPrior: 128, rssmZPost: 128, nextRH: 128, decX64: 64,
    W_attn_qkv: declaredCortexMatrix('W_attn_qkv').length, W_attn_out: declaredCortexMatrix('W_attn_out').length, M_hopfield: 16384, W_browser_master: 8192, masterCmd64: 64,
    W_actor_h: 16384, W_actor_out: 4096, W_critic_h: 8192, W_critic_out: 64, actH: 128, act32: 32 };
  for (const [key, length] of Object.entries(sizes)) dc[key] = Float32Array.from({ length }, (_, i) => .002 + .001 * Math.sin(i));
  dc.ln1_g.fill(1); dc.ln2_g.fill(1); dc.hopfieldWritePtr = 0; dc.criticValue = 0;
  f.host.connectome512.neuropilRates6 = new Float32Array(6);
  Object.assign(f.host, { deepCortex: dc, mesh: { nm: { DA: .5 }, viscera: { glc: .8 }, entanglementBits: 1, iitPhi: .3 },
    obsVec: new Float32Array(16).fill(.2), hdcPooled16: new Float32Array(16).fill(.1),
    cognitiveCortex: { lastMeasurement: {} }, causalGraph: { propositions: [], transitiveSyllogisms: [] },
    verletPhysics: { jointTorques24: new Float32Array(24) }, personality: { curiosityDrive: .5, analyticalDepth: .5, boldness: .5 },
    emotionState: { valence: .3, arousal: .4 }, simulationTick: 0 });
  for (let tick = 0; tick < 8; tick++) {
    f.host.simulationTick++;
    assert.equal(step.call(f.host), dc);
    for (const name of ['x64', 'h256', 'h128', 'rssmH', 'rssmZPrior', 'rssmZPost', 'masterCmd64', 'attnWeights8', 'actH', 'act32'])
      assert(dc[name].every(Number.isFinite), name + ' remains finite through the composed production path');
  }
  assert.equal(dc.cortexCoverageStep, 8);
  assert.equal(dc.cortexPairedReadMask, 3);
  assert.equal(dc.cortexGradientMask, 255);
  assert.equal(dc.cortexPairedWeightVisitsThisStep, 32768);
  assert.equal(dc.cortexGradientUpdatesThisStep, 1536);
  assert(f.host.verletPhysics.jointTorques24.some(value => Math.abs(value) > .001));
});
