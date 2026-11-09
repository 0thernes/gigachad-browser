'use strict';
// Verification-only independent catalog. Physical dimensions/paths/backings
// were pinned before the adapter existed in primary-policy-source-contract-
// 20261109.json (SHA256 0be36f0b805c5da02fec5ed3aaf576cc6fbe02230fda7b29ba029ffdf29a64db).
// Semantic naming/version constants were reviewed against the frozen adapter.
// No production codec, registry, adapter or model constructor is imported.
const { createHash } = require('node:crypto');
const wire = require('./alive-learned-state-wire-evidence.cjs');
const model = require('./alive-model-state-evidence.cjs');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const COMPONENT_ID = 'primary-policy-tensors';
const PHYSICAL = [
  ['W_actor', [5, 16], 'parameter', ['deepCortex', 'W_actor']],
  ['W_metamorph', [5, 6], 'parameter'],
  ['W_critic', [16], 'parameter', ['deepCortex', 'W_critic']],
  ['W_world', [16, 16], 'parameter'],
  ['W_actor_frozen', [5, 16], 'frozen-baseline'],
  ['W_world_frozen', [16, 16], 'frozen-baseline']
];
function createExpectedPrimaryCatalog() {
  const tensors = PHYSICAL.map(([id, dimensions, role, alias]) => ({ id, componentId: COMPONENT_ID, role,
    paths: [{ root: 'h', keys: [id] }, ...(alias ? [{ root: 'h', keys: alias.slice() }] : [])],
    dtype: 'Float32Array', dimensions: dimensions.slice(), backingGroup: id, backingOffset: 0,
    backingByteLength: dimensions.reduce((a, b) => a * b, 4), policy: { format: 'native', finite: true } }));
  const implementationDigest = wire.fingerprintDescriptorDefinition({ componentId: COMPONENT_ID, schemaVersion: 1,
    dimensions: { D_OBS: 16, D_ACT: 5, D_MORPH: 6 }, tensors,
    interpretation: 'six finite Float32 parameter/baseline views; raw IEEE754 bytes; no rounding or baseline regeneration' });
  const definition = { registryVersion: 1, components: [{ id: COMPONENT_ID, schemaVersion: 1, implementationDigest, present: true }],
    tensors: tensors.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0), states: [], families: [], resumeRules: [] };
  const fingerprint = wire.fingerprintDescriptorDefinition(definition);
  if (implementationDigest !== '32e975a5bf7554047e1c624ba606ba26d0a04b3fafd111fc3071e7c9cec90e2c' ||
      fingerprint !== '7ae0ef95ce0a5709d994dd20578979f0135813f4fea572271d6297517743ee68') {
    throw new Error('Independent primary catalog changed; explicit contract review required');
  }
  return { descriptorDefinition: definition,
    architecture: { registryVersion: 1, fingerprint, components: definition.components },
    tensors: definition.tensors.map(row => ({ id: row.id, componentId: row.componentId, role: row.role, paths: row.paths,
      dtype: row.dtype, dimensions: row.dimensions, length: row.dimensions.reduce((a, b) => a * b, 1),
      byteLength: row.backingByteLength, byteOrder: 'LE', backingGroup: row.backingGroup, backingOffset: 0,
      backingByteLength: row.backingByteLength })), states: [], resumeRules: [] };
}
const descriptors = createExpectedPrimaryCatalog().tensors.map(({ id, componentId, role, paths, dtype, dimensions }) =>
  ({ id, componentId, role, paths, dtype, dimensions }));
// Embed the independent observer, rather than require a host global or copy its
// implementation. The resulting function remains synchronous and self-contained
// when serialized into a fresh renderer/VM with .toString().
const capturePrimaryPolicy = new Function('return function capturePrimaryPolicy(runtime) {\n' +
  'const observe = (' + model.observeModelState.toString() + ');\n' +
  'return observe({h:runtime},' + JSON.stringify(descriptors) + ',{maxEntries:6,maxPaths:8,maxRawBytes:2872});\n}');
const capturePrimaryPolicyEvidence = capturePrimaryPolicy();

function assessPrimaryPolicyEvidence(sealedWire, actualEvidence) {
  let decoded;
  try {
    if (!sealedWire || typeof sealedWire !== 'object' || Array.isArray(sealedWire)) throw new Error('Exact primary wire object required');
    decoded = wire.decodeLearnedStateWire(JSON.stringify(sealedWire), { expectedCatalog: createExpectedPrimaryCatalog() });
    // The generic wire oracle intentionally makes no semantic-policy claim.
    // This separately audited primary catalog explicitly requires finite F32.
    for (const tensor of decoded.tensors) for (let offset = 0; offset < tensor.byteLength; offset += 4) {
      if (!Number.isFinite(tensor.bytes.readFloatLE(offset))) throw new Error('Nonfinite primary tensor: ' + tensor.id);
    }
  } catch (error) {
    return { ok: false, status: 'invalid-primary-wire', reason: String(error.message), code: error.code || null,
      differences: [{ path: 'primaryPolicyState', kind: 'invalid-primary-wire' }], comparisons: [], arraysChecked: 0,
      elementsChecked: 0, elementsDifferent: 0 };
  }
  const expectedEvidence = wire.toModelStateEvidence(decoded);
  const exact = model.compareModelState(expectedEvidence, actualEvidence);
  let actual;
  try { actual = model.validateEvidence(actualEvidence); } catch (_) { actual = null; }
  // validateEvidence returns normalized data; do not read an unvalidated graph.
  const actualEntries = actual ? actual.entries : new Map();
  let arraysChecked = 0, elementsChecked = 0, elementsDifferent = 0;
  const comparisons = [];
  for (const tensor of decoded.tensors) {
    const parsed = actualEntries.get(tensor.id), row = parsed?.entry;
    if (!row || row.dtype !== 'Float32Array' || row.byteLength !== tensor.byteLength) continue;
    const bytes = parsed.bytes;
    let changed = 0;
    for (let i = 0; i < tensor.length; i++) if (!bytes.subarray(i * 4, i * 4 + 4).equals(tensor.bytes.subarray(i * 4, i * 4 + 4))) changed++;
    arraysChecked++; elementsChecked += tensor.length; elementsDifferent += changed;
    comparisons.push({ path: tensor.id, ok: changed === 0, length: tensor.length, elementsCompared: tensor.length,
      differingElements: changed, expectedBytesSHA256: sha(tensor.bytes), actualBytesSHA256: sha(bytes),
      rule: 'Authoritative exact primary wire IEEE754 bytes, including separately stored frozen baselines; no clamp or rounding' });
  }
  return { ok: exact.ok, status: exact.ok ? 'passed-primary-subset' : 'primary-mismatch',
    arraysChecked, elementsChecked, elementsDifferent, comparisons,
    differences: exact.differences.map(row => ({ ...row, path: row.id || 'primaryPolicyState' })),
    exactComparison: exact, architectureFingerprint: decoded.architecture.fingerprint,
    scope: 'Six declared primary tensors and eight paths only; full runtime continuity not established' };
}
module.exports = { createExpectedPrimaryCatalog, capturePrimaryPolicyEvidence, assessPrimaryPolicyEvidence };
