'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { createExpectedPrimaryCatalog, capturePrimaryPolicyEvidence, assessPrimaryPolicyEvidence } = require('./alive-primary-policy-evidence.cjs');
const fixture = path.join(__dirname, '../tests/fixtures/alive-primary-policy-v1');
const sealed = JSON.parse(fs.readFileSync(path.join(fixture, 'payload.json'), 'utf8'));
function source() {
  const h = { deepCortex: {} };
  for (const row of createExpectedPrimaryCatalog().tensors) {
    h[row.id] = new Float32Array(row.length);
    new Uint8Array(h[row.id].buffer).set(fs.readFileSync(path.join(fixture, row.id + '.bin')));
  }
  h.deepCortex.W_actor = h.W_actor; h.deepCortex.W_critic = h.W_critic;
  return h;
}
test('independently pinned catalog equals earlier source-derived catalog and original fixture bytes', () => {
  const earlier = JSON.parse(fs.readFileSync(path.join(fixture, 'expected-catalog.json'), 'utf8'));
  assert.deepEqual(createExpectedPrimaryCatalog(), earlier);
  const h = source(), capture = capturePrimaryPolicyEvidence(h), result = assessPrimaryPolicyEvidence(sealed, capture);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.arraysChecked, 6); assert.equal(result.elementsChecked, 718); assert.equal(result.exactComparison.bytesCompared, 2872);
  assert(Object.is(h.W_actor[0], -0)); assert.equal(h.W_actor[1], 2 ** -149);
  assert.notDeepEqual(h.W_actor, h.W_actor_frozen); assert.notDeepEqual(h.W_world, h.W_world_frozen);
  assert.equal(JSON.stringify(result).includes('dataBase64'), false);
});
test('serialized capture remains synchronous, cross-realm and owns exact snapshot bytes', () => {
  const h = source(), context = vm.createContext({ h, btoa });
  const capture = JSON.parse(JSON.stringify(vm.runInContext('(' + capturePrimaryPolicyEvidence.toString() + ')(h)', context)));
  assert.equal(assessPrimaryPolicyEvidence(sealed, capture).ok, true);
  h.W_actor.fill(99);
  assert.equal(assessPrimaryPolicyEvidence(sealed, capture).ok, true, 'later source mutation cannot alter capture');
});
test('one raw bit, regenerated baselines and same-value broken aliases are rejected', () => {
  const h = source(); new Uint8Array(h.W_actor.buffer)[0] ^= 1;
  let result = assessPrimaryPolicyEvidence(sealed, capturePrimaryPolicyEvidence(h));
  assert.equal(result.ok, false); assert.equal(result.elementsDifferent, 1);
  const b = source(); b.W_actor_frozen.set(b.W_actor); b.W_world_frozen.set(b.W_world);
  result = assessPrimaryPolicyEvidence(sealed, capturePrimaryPolicyEvidence(b));
  assert.equal(result.ok, false);
  assert.deepEqual(result.differences.filter(row => row.kind === 'value-bits').map(row => row.id).sort(), ['W_actor_frozen', 'W_world_frozen']);
  const alias = source(); alias.deepCortex.W_actor = new Float32Array(alias.W_actor);
  assert.throws(() => capturePrimaryPolicyEvidence(alias), error => error.code === 'ALIAS');
});
test('missing evidence, incompatible architecture, damaged wire and changed shape fail closed', () => {
  assert.equal(assessPrimaryPolicyEvidence(sealed, null).ok, false);
  for (const alter of [wire => { wire.architecture.fingerprint = '0'.repeat(64); },
    wire => { wire.tensorBlob.sha256 = '0'.repeat(64); },
    wire => { wire.tensorManifest.find(row => row.id === 'W_actor').dimensions = [80]; }]) {
    const bad = structuredClone(sealed); alter(bad);
    assert.equal(assessPrimaryPolicyEvidence(bad, capturePrimaryPolicyEvidence(source())).status, 'invalid-primary-wire');
  }
});
test('finite-only primary contract rejects nonfinite bytes even with every wire checksum repaired', () => {
  const bad = structuredClone(sealed), bytes = Buffer.from(bad.tensorBlob.data, 'base64');
  const actor = bad.tensorManifest.find(row => row.id === 'W_actor');
  bytes.writeUInt32LE(0x7fc00000, actor.blobOffset);
  const hash = value => createHash('sha256').update(value).digest('hex');
  bad.tensorBlob.data = bytes.toString('base64'); bad.tensorBlob.sha256 = hash(bytes);
  actor.sha256 = hash(bytes.subarray(actor.blobOffset, actor.blobOffset + actor.byteLength));
  const h = source(); new Uint32Array(h.W_actor.buffer)[0] = 0x7fc00000;
  const result = assessPrimaryPolicyEvidence(bad, capturePrimaryPolicyEvidence(h));
  assert.equal(result.ok, false); assert.equal(result.status, 'invalid-primary-wire'); assert.match(result.reason, /Nonfinite primary/);
});
