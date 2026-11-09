/* Exact committed trainer state, one component of the learned-state catalog.
 * The wire uses an owned projection of the private clock, never its editable
 * telemetry mirror. Publication belongs to the engine's suspended transaction.
 * No model construction, storage, worker activation, or browser authority here.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveTrainerState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const COMPONENT_ID = 'bleeding-committed-trainer';
  const SCHEMA_VERSION = 1;
  const KERNEL_ID = 'bleeding-hyper-worker-v1';
  const scope = Object.freeze({ kind: 'committed-trainer-component', completeApplicationCatalog: false,
    tensorCount: 1, float32Values: 16, tensorBytes: 64, stateCount: 2,
    includes: 'Current hypernetwork u bytes, private committed worker epoch, and validated timeout configuration',
    pendingWork: 'Discard uncommitted jobs; restore no worker, callback, timer, generation, job identity, or execution receipt',
    continuation: 'Exact next worker update requires the same next latent input and intervening main-thread update order',
    externalDependencies: 'World latent, network sensory inputs, hub backprop/frame cadence, and surrounding model state remain separately owned',
    exhaustedClock: 'MAX_SAFE_INTEGER is retained as exhausted; it never silently resets to zero',
    projection: 'Wire paths describe detached committed-state projection, not public aliases of private engine fields' });
  const methodNames = Object.freeze(['captureCommittedTrainerState', 'prepareCommittedTrainerRestore',
    'recheckCommittedTrainerRestore', 'commitCommittedTrainerRestore', 'discardCommittedTrainerRestore']);
  const own = (value, name) => Object.prototype.hasOwnProperty.call(value, name);
  const fail = message => { throw new TypeError('Trainer state: ' + message); };
  function dataRecord(value) {
    const names = ['schemaVersion', 'kernelId', 'weights', 'committedEpoch', 'timeoutMs'];
    if (!value || ![Object.prototype, null].includes(Object.getPrototypeOf(value)) ||
        Reflect.ownKeys(value).length !== names.length) fail('committed state must contain exactly the declared fields');
    const fields = Object.getOwnPropertyDescriptors(value), result = {};
    for (const name of names) {
      if (!fields[name] || !own(fields[name], 'value')) fail('missing or accessor committed field: ' + name);
      result[name] = fields[name].value;
    }
    if (result.schemaVersion !== SCHEMA_VERSION || result.kernelId !== KERNEL_ID) fail('incompatible kernel/schema');
    return result;
  }
  function methods(engine) {
    if (!engine || typeof engine !== 'object') fail('actual engine required');
    const result = {};
    for (const name of methodNames) {
      let parent = engine, descriptor = null;
      for (let depth = 0; parent && depth < 8; depth++, parent = Object.getPrototypeOf(parent)) {
        descriptor = Object.getOwnPropertyDescriptor(parent, name);
        if (descriptor) break;
      }
      if (!descriptor || !own(descriptor, 'value') || typeof descriptor.value !== 'function') fail('missing own-data engine method: ' + name);
      result[name] = descriptor.value;
    }
    return result;
  }
  function definition() {
    return {
      tensors: [{ id: 'W_hyper_u', componentId: COMPONENT_ID, role: 'parameter',
        paths: [{ root: 'trainer', keys: ['W_hyper_u'] }], dtype: 'Float32Array', dimensions: [16],
        backingGroup: 'W_hyper_u', backingOffset: 0, backingByteLength: 64,
        policy: { format: 'native', finite: true } }],
      states: [
        { id: 'committedEpoch', componentId: COMPONENT_ID, role: 'semantic-clock',
          paths: [{ root: 'trainer', keys: ['committedEpoch'] }], schemaVersion: 1, required: true,
          schema: { type: 'i53', min: 0, max: Number.MAX_SAFE_INTEGER } },
        { id: 'timeoutMs', componentId: COMPONENT_ID, role: 'configuration',
          paths: [{ root: 'trainer', keys: ['timeoutMs'] }], schemaVersion: 1, required: true,
          schema: { type: 'i53', min: 50, max: 30000 } }
      ],
      families: [],
      resumeRules: [
        { id: 'worker-authority', action: 'reset', reason: 'Fresh worker, generation, job identity and execution receipts; apply remains suspended', version: 1 },
        { id: 'pending-work', action: 'discard', reason: 'Only committed learning is durable; the next job samples a new input at committedEpoch plus one', version: 1 },
        { id: 'external-inputs', action: 'reobserve', reason: 'World, network and hub cadence belong to separately declared components and current browser authority', version: 1 }
      ]
    };
  }
  async function create({ registry, codec, crypto } = {}) {
    if (typeof registry?.compile !== 'function' || typeof codec?.fingerprintDescriptors !== 'function') fail('learned-state registry and codec required');
    const rows = definition();
    const implementationDigest = await codec.fingerprintDescriptors({ componentId: COMPONENT_ID,
      schemaVersion: SCHEMA_VERSION, kernelId: KERNEL_ID, ...rows,
      interpretation: 'Exact finite Float32 u bytes and private committed epoch with timeout configuration; pending work discarded; inputs and event order external' }, { crypto });
    const compiled = await registry.compile({ registryVersion: 1,
      components: [{ id: COMPONENT_ID, schemaVersion: SCHEMA_VERSION, implementationDigest, present: true }], ...rows }, { codec, crypto });
    const plans = new WeakMap();
    function projection(record) {
      const data = dataRecord(record);
      return { trainer: { W_hyper_u: data.weights, committedEpoch: data.committedEpoch, timeoutMs: data.timeoutMs } };
    }
    function validatedState(decoded) {
      // The registry validates the exact architecture, complete roster, numeric
      // policies, and decoder-owned bytes on an isolated candidate. No real
      // engine array or private clock participates in this validation step.
      const roots = { trainer: { W_hyper_u: new Float32Array(16), committedEpoch: 0, timeoutMs: 5000 } };
      compiled.apply(compiled.preflight(decoded, roots, { generation: 0 }), roots, { generation: 0 });
      return { schemaVersion: SCHEMA_VERSION, kernelId: KERNEL_ID, weights: roots.trainer.W_hyper_u,
        committedEpoch: roots.trainer.committedEpoch, timeoutMs: roots.trainer.timeoutMs };
    }
    function recheck(prepared, engine) {
      const plan = plans.get(prepared);
      if (!plan || plan.used || plan.engine !== engine) return false;
      try {
        const current = methods(engine);
        if (methodNames.some(name => current[name] !== plan.api[name])) return false;
        return plan.api.recheckCommittedTrainerRestore.call(engine, plan.handle) === true;
      } catch (_) { return false; }
    }
    return Object.freeze({ architecture: compiled.architecture, scope,
      capture(engine, snapshot, { provenance } = {}) {
        const api = methods(engine), record = api.captureCommittedTrainerState.call(engine);
        // Engine capture owns its bytes; registry capture owns a second copy.
        // The returned wire input contains no live model references or awaits.
        return compiled.capture(projection(record), snapshot, { generation: 0, provenance });
      },
      validate(decoded) {
        const data = validatedState(decoded);
        return Object.freeze({ componentId: COMPONENT_ID, tensorCount: 1, tensorBytes: 64,
          committedEpoch: data.committedEpoch, timeoutMs: data.timeoutMs,
          exhausted: data.committedEpoch === Number.MAX_SAFE_INTEGER });
      },
      preflight(decoded, engine, { expectedGeneration } = {}) {
        const data = validatedState(decoded), api = methods(engine);
        const handle = api.prepareCommittedTrainerRestore.call(engine, data, { expectedGeneration });
        const prepared = Object.freeze({ componentId: COMPONENT_ID, tensorCount: 1, stateCount: 2, expectedGeneration });
        plans.set(prepared, { engine, api, handle, used: false });
        return prepared;
      },
      recheck,
      apply(prepared, engine) {
        if (!recheck(prepared, engine)) fail('stale, foreign, or changed prepared component');
        const plan = plans.get(prepared); plan.used = true;
        return plan.api.commitCommittedTrainerRestore.call(engine, plan.handle);
      },
      discard(prepared, engine) {
        const plan = plans.get(prepared);
        if (!plan || plan.used || plan.engine !== engine) return false;
        plan.used = true;
        return plan.api.discardCommittedTrainerRestore.call(engine, plan.handle) === true;
      }
    });
  }
  return Object.freeze({ create, COMPONENT_ID, SCHEMA_VERSION, KERNEL_ID, scope });
});
