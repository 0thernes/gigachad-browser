/* Application adapter for six declared primary policy tensors only.
 * No constructor execution, model stepping, storage, workers or browser access.
 * This establishes a storage/alias contract, not complete policy continuation.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AlivePrimaryPolicyState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const COMPONENT_ID = 'primary-policy-tensors';
  const SCHEMA_VERSION = 1;
  const DIMENSIONS = Object.freeze({ D_OBS: 16, D_ACT: 5, D_MORPH: 6 });
  const SCOPE = Object.freeze({ kind: 'declared-primary-tensor-subset', completeApplicationCatalog: false,
    tensorCount: 6, float32Values: 718, tensorBytes: 2872, aliasPaths: 2,
    includes: 'Actor, morphology, critic, world predictor and separately retained actor/world frozen baselines',
    excludes: 'Optimizer, recurrent state, observations, RNG, clocks, replay, curriculum, native models, coupling, assets and browser authority',
    continuation: 'Exact declared tensor bytes only; next outputs require independently equivalent inputs and all omitted state',
    activation: 'Requires explicit host startup/hydration and writer fencing; this module performs no automatic storage',
    compatibility: 'Versioned storage and alias descriptor identity; not a digest or compatibility claim for the whole application' });
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const entries = [
    { key: 'W_actor', shape: [5, 16], role: 'parameter', alias: ['deepCortex', 'W_actor'] },
    { key: 'W_metamorph', shape: [5, 6], role: 'parameter' },
    { key: 'W_critic', shape: [16], role: 'parameter', alias: ['deepCortex', 'W_critic'] },
    { key: 'W_world', shape: [16, 16], role: 'parameter' },
    { key: 'W_actor_frozen', shape: [5, 16], role: 'frozen-baseline' },
    { key: 'W_world_frozen', shape: [16, 16], role: 'frozen-baseline' }
  ];
  // All six arrays are distinct allocations in the inspected constructor. The
  // two cortex aliases point to their existing actor/critic view objects.
  function descriptors() {
    return entries.map(entry => {
      const paths = [{ root: 'h', keys: [entry.key] }];
      if (entry.alias) paths.push({ root: 'h', keys: entry.alias.slice() });
      return { id: entry.key, componentId: COMPONENT_ID, role: entry.role, paths,
        dtype: 'Float32Array', dimensions: entry.shape.slice(), backingGroup: entry.key,
        backingOffset: 0, backingByteLength: entry.shape.reduce((size, n) => size * n, 4),
        policy: { format: 'native', finite: true } };
    });
  }
  function validateDimensions(h) {
    if (!h || typeof h !== 'object' || Array.isArray(h)) throw new TypeError('Primary policy runtime object required');
    for (const [key, expected] of Object.entries(DIMENSIONS)) {
      const descriptor = Object.getOwnPropertyDescriptor(h, key);
      if (!descriptor || !own(descriptor, 'value') || descriptor.value !== expected) {
        throw new TypeError('Primary policy dimension contract mismatch: ' + key);
      }
    }
  }
  async function create({ registry, codec, crypto } = {}) {
    if (typeof registry?.compile !== 'function' || typeof codec?.fingerprintDescriptors !== 'function') {
      throw new TypeError('Learned-state registry and codec are required');
    }
    const tensors = descriptors();
    // A semantic storage contract digest is intentionally independent of UI
    // source formatting. Actual build/source hashes belong in provenance.
    const implementationDigest = await codec.fingerprintDescriptors({ componentId: COMPONENT_ID,
      schemaVersion: SCHEMA_VERSION, dimensions: DIMENSIONS, tensors,
      interpretation: 'six finite Float32 parameter/baseline views; raw IEEE754 bytes; no rounding or baseline regeneration' }, { crypto });
    const compiled = await registry.compile({ registryVersion: 1,
      components: [{ id: COMPONENT_ID, schemaVersion: SCHEMA_VERSION, implementationDigest, present: true }],
      tensors, states: [], families: [], resumeRules: [] }, { codec, crypto });
    const bindings = new WeakMap();
    function roots(h) {
      validateDimensions(h);
      let bound = bindings.get(h);
      if (!bound) { bound = Object.freeze({ h }); bindings.set(h, bound); }
      return bound;
    }
    return Object.freeze({ architecture: compiled.architecture, scope: SCOPE,
      capture(h, snapshot, options) { return compiled.capture(roots(h), snapshot, options); },
      preflight(decoded, h, options) { return compiled.preflight(decoded, roots(h), options); },
      apply(prepared, h, options) { return compiled.apply(prepared, roots(h), options); } });
  }
  return Object.freeze({ create, COMPONENT_ID, SCHEMA_VERSION, DIMENSIONS, scope: SCOPE });
});
