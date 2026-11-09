'use strict';
// Independent numerical continuation evidence for the replay-memory component.
// Execute the owning production fragment unchanged, including insertion before
// selection. No application constructor, Electron, native Worker or network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { webcrypto } = require('node:crypto');
const codec = require('../systems/alive-learned-state-codec.js');
const registry = require('../systems/alive-learned-state-registry.js');
const replayState = require('../systems/alive-replay-state.js');
const source = fs.readFileSync(require.resolve('../index.html'), 'utf8');
const START = '        // Push current transition into Prioritized Experience Replay Ring Buffer (32 slots)';
const END = '        // Self-Recursive Morphisms: apply endofunctorial state-to-body transformation';
function extractReplay(text) {
  const begin = text.indexOf(START), end = text.indexOf(END);
  assert.ok(begin >= 0 && end > begin, 'Current production replay boundaries must exist in order');
  assert.equal(text.indexOf(START, begin + START.length), -1, 'Replay start must be unique');
  assert.equal(text.indexOf(END, end + END.length), -1, 'Replay end must be unique');
  const fragment = text.slice(begin, end);
  assert.ok(fragment.length < 8192, 'Bounded replay-only source extraction');
  return fragment;
}
const fragment = extractReplay(source);
// Function construction keeps the actual object literals and typed arrays in
// the same realm as the real registry. The fragment itself is not rewritten.
const runReplay = new Function('hub', 'dc', 'frame', 'lr', '"use strict"; const Wmoe=dc.W_moe_experts;\n' + fragment);
const raw = view => Buffer.from(view.buffer, view.byteOffset, view.byteLength);
const sameBytes = (a, b, message) => assert.equal(raw(a).equals(raw(b)), true, message);
const snapshot = () => ({ creatureId: 'replay-controlled-creature', policyId: 'replay-controlled-policy',
  checkpointId: 'replay-controlled-checkpoint', logicalTick: 129, modelEpoch: 8,
  capturedAt: '2026-11-09T00:00:00.000Z', resumeBoundary: 'fresh-browser-authority' });
function fixture() {
  return { hub: {
    replayRing32: [], replayWritePtr: 0, dreamConsolidationSteps: 11,
    zPrev16: new Float32Array(16), lastAction8: new Float32Array(8), zPerc16: new Float32Array(16),
    worldDynamicsLossMse: .125, perceptionLossMse: .125,
    ganSyntheticLatent16: Float32Array.from({ length: 16 }, (_, i) => (i - 5) / 32),
    zPredNext16: Float32Array.from({ length: 16 }, (_, i) => (i - 7) / 24),
    W_dyn2: Float32Array.from({ length: 256 }, (_, i) => (i % 19 - 9) / 64)
  }, dc: { W_moe_experts: new Float32Array(8 * 65536).fill(.125) } };
}
function inputs(hub, transition, priority) {
  for (let i = 0; i < 16; i++) {
    hub.zPrev16[i] = ((transition + 1) * 3 + i - 24) / 128;
    hub.zPerc16[i] = ((transition + 1) * 2 - i + 5) / 128;
  }
  for (let i = 0; i < 8; i++) hub.lastAction8[i] = ((transition % 11) - i) / 16;
  // Negative finite priorities are a permitted wire input even though ordinary
  // nonnegative MSE values do not generate them. Preserve the actual selector.
  hub.worldDynamicsLossMse = priority;
  hub.perceptionLossMse = Object.is(priority, -0) ? -0 : 0;
}
function populate(f, pushes, priorityAt = () => .25) {
  for (let i = 0; i < pushes; i++) {
    inputs(f.hub, i, priorityAt(i & 31, i));
    runReplay(f.hub, f.dc, i + 1, .015625);
  }
  return f;
}
function compareRing(actual, expected) {
  assert.equal(actual.replayWritePtr, expected.replayWritePtr);
  assert.equal(actual.replayRing32.length, expected.replayRing32.length);
  for (let i = 0; i < expected.replayRing32.length; i++) {
    const a = actual.replayRing32[i], e = expected.replayRing32[i];
    assert.deepEqual(Object.keys(a).sort(), ['a8', 'surprise', 'z16', 'zNext16']);
    assert.equal(Object.is(a.surprise, e.surprise), true, `surprise ${i}, including signed zero`);
    for (const key of ['z16', 'a8', 'zNext16']) {
      sameBytes(a[key], e[key], `${i}/${key}`);
      assert.notEqual(a[key], e[key], `${i}/${key} must belong to the restored instance`);
      assert.notEqual(a[key].buffer, e[key].buffer, `${i}/${key} must own independent restored backing`);
    }
  }
}
function gradientExpectation(hub, dc, frame, lr, selected) {
  // Secondary arithmetic check for a DECLARED expected slot. The numerical
  // continuation oracle is the actual fragment executed on both instances.
  const dyn = new Float32Array(hub.W_dyn2), base = 458752 + ((frame * 256) & 65279);
  const moe = new Float32Array(dc.W_moe_experts.subarray(base, base + 256));
  for (let r = 0; r < 16; r++) {
    const target = .7 * selected.zNext16[r] + .3 * hub.ganSyntheticLatent16[r];
    const error = (hub.zPredNext16[r] - target) * .5;
    for (let c = 0; c < 16; c++) {
      const index = r * 16 + c, delta = lr * .5 * error * selected.z16[c];
      dyn[index] = Math.max(-2, Math.min(2, dyn[index] - delta));
      moe[index] = Math.max(-1.8, Math.min(1.8, moe[index] - delta));
    }
  }
  return { dyn, moe, base };
}

test('replay extraction fails closed if the real insertion/selection/gradient boundary changes', () => {
  assert.equal(source.includes(fragment), true);
  for (const marker of [START, END]) {
    assert.throws(() => extractReplay(source.replace(marker, '// absent')));
    assert.throws(() => extractReplay(source + '\n' + marker));
  }
});

const cases = [
  { name: 'empty restored memory admits its first record before replay', pushes: 0, frame: 4, nextPriority: .5, winner: 0 },
  { name: 'partial memory selects the retained highest-surprise record', pushes: 3, frame: 4,
    priorityAt: index => [1, 4, 2][index], nextPriority: .5, winner: 1 },
  { name: 'partial ties select the lowest physical slot rather than the new record', pushes: 3, frame: 4,
    priorityAt: index => index === 1 ? .25 : 4, nextPriority: 4, winner: 0 },
  { name: 'last partial slot becomes full and the new record can immediately win', pushes: 31, frame: 32,
    priorityAt: index => index === 10 ? 5 : .25, nextPriority: 9, winner: 31 },
  { name: 'full memory overwrites its old maximum before selection', pushes: 32, frame: 36,
    priorityAt: index => index === 0 ? 9 : index === 17 ? 5 : .25, nextPriority: .5, winner: 17 },
  { name: 'wrapped memory retains physical ordering for equal priorities', pushes: 39, frame: 40,
    priorityAt: index => index === 3 ? 5 : .25, nextPriority: 5, winner: 3 },
  { name: 'wrapped cursor31 becomes0 without sorting or rotating retained records', pushes: 63, frame: 64,
    priorityAt: index => index === 31 ? 9 : index === 6 ? 5 : .25, nextPriority: .5, winner: 6 },
  { name: 'a non-replay frame inserts and advances only the ring', pushes: 32, frame: 33,
    nextPriority: 9, winner: null },
  { name: 'finite priorities below selector threshold preserve the real default-slot behavior', pushes: 3, frame: 4,
    priorityAt: index => [-3, -1.25, -2][index], nextPriority: -1.5, winner: 0 }
];
for (const item of cases) test('wire continuation: ' + item.name, async () => {
  const adapter = await replayState.create({ registry, codec, crypto: webcrypto });
  const original = populate(fixture(), item.pushes, item.priorityAt);
  const restored = populate(fixture(), 2, () => 99);
  const oldTargetRing = restored.hub.replayRing32;
  const captured = adapter.capture(original.hub, snapshot(), { generation: 4 });
  const wire = await codec.encode(captured, { crypto: webcrypto });
  const decoded = await codec.decode(wire, { crypto: webcrypto });
  adapter.validate(decoded);
  const plan = adapter.preflight(decoded, restored.hub, { generation: 9 });
  const ready = adapter.recheck(plan, restored.hub, { generation: 9 });
  assert.equal(ready.status, 'ready'); assert.equal(ready.generation, 9);
  assert.equal(ready.count, original.hub.replayRing32.length); assert.equal(ready.cursor, original.hub.replayWritePtr);
  const receipt = adapter.apply(plan, restored.hub, { generation: 9 });
  assert.equal(receipt.status, 'applied'); assert.equal(receipt.readbackVerified, true);
  assert.notEqual(restored.hub.replayRing32, oldTargetRing, 'Publish the privately staged ring');
  compareRing(restored.hub, original.hub);

  // Explicit omitted-state boundary: the replay adapter owns only records and
  // cursor. We supply equal current model weights, GAN/prediction latents,
  // consolidation counter, next transition, already-computed lr and frame.
  // This is NOT whole-hub/RNG/environment or application-restart equivalence.
  restored.hub.W_dyn2.set(original.hub.W_dyn2);
  restored.dc.W_moe_experts.set(original.dc.W_moe_experts);
  restored.hub.ganSyntheticLatent16.set(original.hub.ganSyntheticLatent16);
  restored.hub.zPredNext16.set(original.hub.zPredNext16);
  restored.hub.dreamConsolidationSteps = original.hub.dreamConsolidationSteps;
  const beforeDreams = original.hub.dreamConsolidationSteps;
  const originalCursor = original.hub.replayWritePtr, originalLength = original.hub.replayRing32.length;
  inputs(original.hub, 77, item.nextPriority); inputs(restored.hub, 77, item.nextPriority);
  const lr = .015625, frame = item.frame;
  const selected = item.winner === originalCursor
    ? { z16: original.hub.zPrev16, zNext16: original.hub.zPerc16 }
    : original.hub.replayRing32[item.winner];
  const expected = item.winner === null ? null : gradientExpectation(original.hub, original.dc, frame, lr, selected);
  const unchangedDyn = expected ? null : new Float32Array(original.hub.W_dyn2);
  const unchangedMoe = expected ? null : new Float32Array(original.dc.W_moe_experts);
  runReplay(original.hub, original.dc, frame, lr);
  runReplay(restored.hub, restored.dc, frame, lr);
  compareRing(restored.hub, original.hub);
  assert.equal(original.hub.replayRing32.length, Math.min(32, originalLength + 1));
  assert.equal(original.hub.replayWritePtr, (originalCursor + 1) & 31);
  sameBytes(restored.hub.W_dyn2, original.hub.W_dyn2, 'Exact next world-dynamics update');
  sameBytes(restored.dc.W_moe_experts, original.dc.W_moe_experts, 'Exact whole MoE bytes, including selected expert7 slice');
  assert.equal(restored.hub.dreamConsolidationSteps, original.hub.dreamConsolidationSteps);
  assert.equal(original.hub.dreamConsolidationSteps, beforeDreams + (expected ? 1 : 0));
  if (expected) {
    sameBytes(original.hub.W_dyn2, expected.dyn, `Actual gradient must use declared physical slot ${item.winner}`);
    sameBytes(original.dc.W_moe_experts.subarray(expected.base, expected.base + 256), expected.moe, 'Actual frame-indexed expert7 slice');
  } else {
    sameBytes(original.hub.W_dyn2, unchangedDyn, 'No world-dynamics replay update off cadence');
    sameBytes(original.dc.W_moe_experts, unchangedMoe, 'No MoE replay update off cadence');
  }
});

test('actual transition copies own their record buffers; the wire preserves unused action history and signed-zero priority', async () => {
  const f = fixture(); inputs(f.hub, 3, -0); runReplay(f.hub, f.dc, 1, .015625);
  const record = f.hub.replayRing32[0];
  assert.equal(Object.is(record.surprise, -0), true);
  for (const [key, current] of [['z16', 'zPrev16'], ['a8', 'lastAction8'], ['zNext16', 'zPerc16']]) {
    assert.notEqual(record[key].buffer, f.hub[current].buffer);
  }
  const actionBytes = Buffer.from(raw(record.a8)); f.hub.lastAction8.fill(7);
  assert.equal(raw(record.a8).equals(actionBytes), true);
  const adapter = await replayState.create({ registry, codec, crypto: webcrypto }), target = fixture();
  const decoded = await codec.decode(await codec.encode(adapter.capture(f.hub, snapshot(), { generation: 0 }), { crypto: webcrypto }), { crypto: webcrypto });
  adapter.apply(adapter.preflight(decoded, target.hub, { generation: 0 }), target.hub, { generation: 0 });
  compareRing(target.hub, f.hub);
  assert.equal(Object.is(target.hub.replayRing32[0].surprise, -0), true);
});
