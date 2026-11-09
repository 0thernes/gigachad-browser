'use strict';
// Actual numerical fragments with explicitly controlled omitted inputs. These
// tests do not execute the application or establish full-policy continuation.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const codec = require('../systems/alive-learned-state-codec.js');
const registry = require('../systems/alive-learned-state-registry.js');
const primary = require('../systems/alive-primary-policy-state.js');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
function fragment(start, end) {
  const from = html.indexOf(start), to = html.indexOf(end, from);
  assert.ok(from >= 0 && to > from, 'actual production fragment anchors must exist');
  return html.slice(from, to);
}
const actorSource = fragment('        const act = new Float32Array(this.D_ACT);', '        const dtMs = Math.max(0.15, performance.now() - t0);');
const actor = new vm.Script('(function(m,fwStep,specialistMotorBias){' + actorSource + '\nreturn act;})').runInThisContext();
const practiceSource = fragment('        let rolloutReturn = 0;', '        // Held-Out Evaluation across 5 unseen deterministic seeds');
const practice = new vm.Script('(function(m){const N_HYB_MACRO=14,N_HYB_MESO=8;' + practiceSource + '\nreturn rolloutReturn;})').runInThisContext();
const worldSource = fragment('        let sqErr = 0;\n        for (let i = 0; i < this.D_OBS; i++) {', '        // 4. Heuristic specialist selection');
const world = new vm.Script('(function(){' + worldSource + '\nreturn rawMse;})').runInThisContext();
const constructorSource = fragment('        this.D_OBS = 16;', '        this.W_world_frozen = new Float32Array(this.W_world);') + '        this.W_world_frozen = new Float32Array(this.W_world);';
const allocate = new vm.Script('(function(hybridQrng){' + constructorSource + '})').runInThisContext();
const keys = ['W_actor', 'W_metamorph', 'W_critic', 'W_world', 'W_actor_frozen', 'W_world_frozen'];
const snapshot = () => ({ creatureId: 'primary-fixture', policyId: 'policy-fixture', checkpointId: 'checkpoint-fixture', logicalTick: 31, modelEpoch: 4, capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' });
const hex = view => Buffer.from(view.buffer, view.byteOffset, view.byteLength).toString('hex');
const bytes = h => Object.fromEntries(keys.map(key => [key, hex(h[key])]));
const decode = captured => codec.encode(captured, { crypto: webcrypto }).then(json => codec.decode(json, { crypto: webcrypto }));
async function create() { return primary.create({ registry, codec, crypto: webcrypto }); }
function model(seed = 1) {
  const h = { D_MORPH: 6 }; let rng = seed >>> 0;
  allocate.call(h, { uniform() { rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0; return rng / 4294967296; } });
  // These are the two aliases assigned by the real constructor later.
  h.deepCortex = { W_actor: h.W_actor, W_critic: h.W_critic };
  Object.assign(h, { obsVec: Float32Array.from({ length: 16 }, (_, i) => Math.sin(i + 0.125) * 0.4),
    morphVec: Float32Array.from([0.2, 0.7, -0.3, 0.5, -0.15, 0.9]), predObsVec: new Float32Array(16),
    simulationTick: 31, stageIdx: 2, worldPredError: 0.3, worldPredErrorEMA: 0.25, learningProgress: 0.01 });
  return h;
}
function mesh() {
  let tick = 0;
  const m = { macroRate: Float32Array.from({ length: 14 }, (_, i) => i / 20), viscera: { glc: 0.6, sim: 0.2 }, nm: { DA: 1.1 }, criticalitySigma: 1,
    mesoElig: Array.from({ length: 14 }, (_, r) => Float32Array.from({ length: 8 }, (_, c) => (r - c) / 40)) };
  m.step = () => { tick++; m.viscera.glc = 0.6 + 0.1 * Math.sin(tick / 7); m.criticalitySigma = 1 + 0.05 * Math.cos(tick / 9); };
  return m;
}
const motor = h => actor.call(h, mesh(), { pfnSteering: [0.12, -0.07] }, null);

test('static adapter describes exactly six constructor views, 718 Float32 values and known cortex aliases', async () => {
  const adapter = await create(), h = model(), captured = adapter.capture(h, snapshot(), { generation: 3 });
  assert.equal(captured.tensors.length, 6); assert.equal(captured.tensors.reduce((n, t) => n + t.length, 0), 718);
  assert.equal(captured.tensors.reduce((n, t) => n + t.byteLength, 0), 2872);
  assert.deepEqual(captured.stateManifest, []); assert.deepEqual(captured.stateValues, {});
  const rows = Object.fromEntries(captured.tensors.map(row => [row.id, row]));
  assert.deepEqual(rows.W_actor.dimensions, [5, 16]); assert.deepEqual(rows.W_metamorph.dimensions, [5, 6]); assert.deepEqual(rows.W_critic.dimensions, [16]);
  assert.deepEqual(rows.W_world.dimensions, [16, 16]); assert.equal(rows.W_actor.paths.length, 2); assert.equal(rows.W_critic.paths.length, 2);
  assert.deepEqual(rows.W_actor.paths[1], { root: 'h', keys: ['deepCortex', 'W_actor'] });
  assert.match(html, /this\.deepCortex\.W_actor = this\.W_actor;/); assert.match(html, /this\.deepCortex\.W_critic = this\.W_critic;/);
  assert.equal(adapter.scope.completeApplicationCatalog, false); assert.match(adapter.scope.excludes, /Optimizer/);
});

test('round trip preserves raw Float32 bits, distinct baselines and existing target objects', async () => {
  const adapter = await create(), source = model(7), target = model(99);
  source.W_actor[0] = -0; source.W_world[1] = 1.401298464324817e-45;
  source.W_actor_frozen[4] = 0.123456789; source.W_world_frozen[9] = -0.987654321;
  const original = Object.fromEntries(keys.map(key => [key, target[key]])), expected = bytes(source);
  const decoded = await decode(adapter.capture(source, snapshot(), { generation: 3 }));
  const plan = adapter.preflight(decoded, target, { generation: 3 }); assert.equal(adapter.apply(plan, target, { generation: 3 }).readbackVerified, true);
  assert.deepEqual(bytes(target), expected);
  for (const key of keys) assert.equal(target[key], original[key]);
  assert.equal(target.deepCortex.W_actor, target.W_actor); assert.equal(target.deepCortex.W_critic, target.W_critic);
  assert.notEqual(hex(target.W_actor), hex(target.W_actor_frozen)); assert.notEqual(hex(target.W_world), hex(target.W_world_frozen));
  assert.ok(Object.is(target.W_actor[0], -0));
});

test('actual production actor, world update and practice update agree after restore under equal omitted state', async () => {
  const adapter = await create(), source = model(17), target = model(91), initialSource = bytes(source), initialTargetMotor = Array.from(motor(target));
  // Execute the actual selected kernels before capture, making this more than
  // a constructor/default serialization test. Evaluation labels are excluded.
  world.call(source); practice.call(source, mesh());
  assert.notEqual(hex(source.W_actor), initialSource.W_actor); assert.notEqual(hex(source.W_critic), initialSource.W_critic);
  assert.notEqual(hex(source.W_metamorph), initialSource.W_metamorph); assert.notEqual(hex(source.W_world), initialSource.W_world);
  const captured = adapter.capture(source, snapshot(), { generation: 3 }), decoded = await decode(captured);
  adapter.apply(adapter.preflight(decoded, target, { generation: 3 }), target, { generation: 3 });
  assert.deepEqual(bytes(target), bytes(source)); assert.deepEqual(Array.from(motor(target)), Array.from(motor(source)));
  assert.notDeepEqual(Array.from(motor(target)), initialTargetMotor);
  // This adapter deliberately does not restore prediction history. Supply the
  // same controlled omitted state explicitly before comparing the next update.
  target.predObsVec.set(source.predObsVec);
  for (const key of ['worldPredError', 'worldPredErrorEMA', 'learningProgress']) target[key] = source[key];
  assert.equal(world.call(target), world.call(source));
  assert.equal(practice.call(target, mesh()), practice.call(source, mesh()));
  assert.deepEqual(bytes(target), bytes(source)); assert.deepEqual(Array.from(motor(target)), Array.from(motor(source)));
  assert.deepEqual([...target.predObsVec], [...source.predObsVec]);
  assert.equal(hex(target.W_actor_frozen), initialSource.W_actor_frozen); assert.equal(hex(target.W_world_frozen), initialSource.W_world_frozen);
});

test('source mutation after capture and decoded mirror mutations cannot alter the restored subset', async () => {
  const adapter = await create(), source = model(17), target = model(), expected = bytes(source), captured = adapter.capture(source, snapshot(), { generation: 3 });
  for (const key of keys) source[key].fill(1);
  const decoded = await decode(captured); new Uint8Array(decoded.tensors[0].bytes).fill(255);
  const plan = adapter.preflight(decoded, target, { generation: 3 }); new Uint8Array(decoded.tensors[1].bytes).fill(0);
  adapter.apply(plan, target, { generation: 3 }); assert.deepEqual(bytes(target), expected);
});

test('wrong dimensions, shape, aliases, nonfinite tensors and missing fields fail closed', async () => {
  const adapter = await create(), source = model(), decoded = await decode(adapter.capture(source, snapshot(), { generation: 3 }));
  for (const damage of [h => h.D_ACT = 6, h => h.W_world = new Float32Array(255), h => h.deepCortex.W_actor = new Float32Array(h.W_actor), h => delete h.W_metamorph]) {
    const target = model(17); damage(target); const untouched = hex(target.W_critic);
    assert.throws(() => adapter.preflight(decoded, target, { generation: 3 })); assert.equal(hex(target.W_critic), untouched);
  }
  const invalid = model(); invalid.W_actor[0] = NaN; assert.throws(() => adapter.capture(invalid, snapshot(), { generation: 3 }), /numeric policy/);
  let reads = 0; const accessor = model(); Object.defineProperty(accessor, 'D_OBS', { get() { reads++; return 16; } });
  assert.throws(() => adapter.capture(accessor, snapshot(), { generation: 3 }), /dimension contract/); assert.equal(reads, 0);
});

test('validly rehashed missing tensors or descriptor substitutions cannot bypass the static roster', async () => {
  const adapter = await create(), source = model(), captured = adapter.capture(source, snapshot(), { generation: 3 }), target = model(17), before = bytes(target);
  const missing = await decode({ ...captured, tensors: captured.tensors.filter(t => t.id !== 'W_world_frozen') });
  assert.throws(() => adapter.preflight(missing, target, { generation: 3 }), /roster/); assert.deepEqual(bytes(target), before);
  const changed = { ...captured, tensors: captured.tensors.map(t => t.id === 'W_actor_frozen' ? { ...t, dimensions: [80] } : t) };
  assert.throws(() => adapter.preflight(changed, target, { generation: 3 }), /handle|decoded|verified/i);
  const changedDecoded = await decode(changed); assert.throws(() => adapter.preflight(changedDecoded, target, { generation: 3 }), /descriptor/); assert.deepEqual(bytes(target), before);
});

test('generation, equal-shape view replacement and different runtime targets reject before writes', async () => {
  const adapter = await create(), source = model(), decoded = await decode(adapter.capture(source, snapshot(), { generation: 3 }));
  for (const mode of ['generation', 'view', 'runtime', 'dimension']) {
    const target = model(17), plan = adapter.preflight(decoded, target, { generation: 3 });
    if (mode === 'view') target.W_world = new Float32Array(target.W_world);
    if (mode === 'dimension') target.D_MORPH = 7;
    const before = bytes(target);
    assert.throws(() => adapter.apply(plan, mode === 'runtime' ? { ...target } : target, { generation: mode === 'generation' ? 4 : 3 })); assert.deepEqual(bytes(target), before);
  }
});

test('adapter has stable static architecture across independent compilation', async () => {
  const a = await create(), b = await create(); assert.equal(a.architecture.fingerprint, b.architecture.fingerprint);
  assert.equal(primary.scope.tensorCount, 6); assert.equal(primary.scope.float32Values, 718); assert.equal(primary.scope.tensorBytes, 2872);
  assert.match(primary.scope.activation, /Requires explicit host startup/); assert.match(primary.scope.continuation, /omitted state/);
});
