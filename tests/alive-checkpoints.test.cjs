'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const codec = require('../systems/alive-checkpoints.js');

function fixture() {
  const cortex = { weights: new Float32Array([1, 2, 3]) };
  const mesh = { rows: [new Float32Array([4, 5]), new Float32Array([6, 7])], nested: { indices: new Int32Array([8, 9]) } };
  const roots = { policy: { cortex, mesh, actor: new Float32Array([.1, .2]) }, cortex, mesh };
  return { roots, metadata: { agentId: 'fixture', body: { limbs: 4 }, policyCid: 'p1' } };
}

test('capture includes direct policy tensors and nested cortex/mesh rows without duplicate objects', () => {
  const { roots, metadata } = fixture();
  const snap = codec.capture(roots, metadata);
  assert.equal(snap.tensors.length, 5);
  assert.deepEqual(snap.tensors.map(item => [item.group, item.path.join('.')]), [
    ['policy', 'actor'], ['cortex', 'weights'], ['mesh', 'rows.0'], ['mesh', 'rows.1'], ['mesh', 'nested.indices']
  ]);
});

test('asynchronous sealing hashes one coherent copied state despite subsequent live model mutations', async () => {
  const { roots, metadata } = fixture();
  const snap = codec.capture(roots, metadata);
  const sealing = codec.seal(snap);
  roots.policy.actor.fill(9); roots.cortex.weights.fill(9); roots.mesh.rows[0].fill(9);
  metadata.body.limbs = 99;
  const record = await sealing;
  const verified = await codec.verify(record);
  assert.equal(verified.tensorCount, 5);
  assert.equal(record.manifest.metadata.body.limbs, 4);
  codec.applyVerified(record, roots);
  assert.deepEqual(Array.from(roots.cortex.weights), [1, 2, 3]);
  assert.deepEqual(Array.from(roots.mesh.rows[0]), [4, 5]);
  assert.ok(Math.abs(roots.policy.actor[0] - .1) < 1e-6);
});

test('same exact content creates same CID and modified tensor content fails verification', async () => {
  const { roots, metadata } = fixture();
  const a = await codec.seal(codec.capture(roots, metadata));
  const b = await codec.seal(codec.capture(roots, metadata));
  assert.equal(a.cid, b.cid);
  assert.match(a.cid, /^b[a-z2-7]+$/);
  new Uint8Array(b.tensors[1].buffer)[0] ^= 1;
  await assert.rejects(codec.verify(b), /hash mismatch/);
  b.manifest.metadata.agentId = 'tampered';
  await assert.rejects(codec.verify(b), /CID mismatch/);
});

test('restore checks every destination before changing any tensor', async () => {
  const { roots, metadata } = fixture();
  const record = await codec.seal(codec.capture(roots, metadata));
  await codec.verify(record);
  roots.policy.actor.fill(99);
  roots.mesh.nested.indices = new Int32Array(4);
  assert.throws(() => codec.applyVerified(record, roots), /shape mismatch/);
  assert.deepEqual(Array.from(roots.policy.actor), [99, 99]);
});

test('snapshot size bounds and cancellation fail without producing a valid checkpoint', async () => {
  const { roots, metadata } = fixture();
  assert.throws(() => codec.capture(roots, metadata, { maxBytes: 4 }), /bounded capacity/);
  const abort = new AbortController(); abort.abort();
  await assert.rejects(codec.seal(codec.capture(roots, metadata), { signal: abort.signal }), /cancelled/);
});

test('restore preflight validates every destination without applying tensors before a storage fence', async () => {
  const { roots, metadata } = fixture();
  const record = await codec.seal(codec.capture(roots, metadata));
  roots.policy.actor.fill(99);
  assert.equal(codec.preflight(record, roots).tensorCount, 5);
  assert.deepEqual(Array.from(roots.policy.actor), [99, 99]);
  roots.mesh.nested.indices = new Int32Array(4);
  assert.throws(() => codec.preflight(record, roots), /shape mismatch/);
  assert.deepEqual(Array.from(roots.policy.actor), [99, 99]);
});
