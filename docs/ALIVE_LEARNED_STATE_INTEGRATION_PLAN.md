# Learned-state integration plan

This source-based plan began on 2026-11-09 with an isolated six-tensor adapter.
That subset is now connected to application startup, canonical bootstrap and the
normal serializer. Native startup migration and prepared native import are also
implemented. The original catalog and source inventory below remain historical
planning evidence, not qualification of complete application restore.

Paths under `research_notes/` identify local-only evidence excluded from published source; they are not public download links. See [the release summary](RELEASE_2026-11-09.md) for current release scope.
See [the primary startup contract](ALIVE_PRIMARY_STATE_STARTUP.md) for current integration.

## Evidence and the remaining coverage boundary

The inputs are `research_notes/alive-overdrive-verification/learned-state-continuity/candidate-coverage-v3.json`, `SHARED_ARENA_BOUNDARY.md`, `STARTUP_HYDRATION_AUDIT.md`, the implementation/protocol/edge-review documents in that directory, and the current owning sources named below. The candidate catalog explicitly is not a certified registry. Its 648 constructor views are historical observations, not a fixed mature roster, learned-parameter count or proof of learning quality.

Catalog revision 3 proposes 406 persisted, 96 native-delegated, 76 reconstructed, 65 reset and five unresolved views. It has 56 non-tensor candidates, including unresolved curriculum/history/RNG entries. The sole whole-view classification ambiguity is the mixed HDC arena; its three component ranges are already described. Five imported-asset dispositions remain unresolved. These numbers must not be used as acceptance totals without a current independent inventory and exact descriptor coverage.

The reported candidate view byte sum is 5,469,282; the proposed persisted-view sum is 5,257,669. These are sums of view lengths, not unique backing capacity or a complete serialized size. They omit lazy replay, native scalar/closure representation, research/history records and future metadata. Final wire size, decode work, peak memory and capture time still require measurement. The 32 MiB canonical JSON ceiling remains authoritative; no rounding, truncation or omitted components may be introduced to fit it.

The catalog's native-closure gap predates the current authentic adapter. The current adapter explicitly captures developmental affinity, validates native topology/collections and prepares isolated legacy recovery; the startup migration records missing historical affinity as approximate. That improvement must be incorporated in an updated native component contract and independent oracle. It does not retroactively make an old no-affinity snapshot historically exact, or certify the catalog's 96 enumerated native views as complete by themselves.

## First bounded slice: implemented and connected

`systems/alive-primary-policy-state.js` wraps the trusted generic registry with a static storage/alias contract. It declares six distinct Float32 backing allocations, 718 values and 2,872 raw bytes:

| Semantic ID | Dimensions | Values | Additional same-view alias |
| --- | --- | ---: | --- |
| `W_actor` | `[5,16]` | 80 | `h.deepCortex.W_actor` |
| `W_metamorph` | `[5,6]` | 30 | None |
| `W_critic` | `[16]` | 16 | `h.deepCortex.W_critic` |
| `W_world` | `[16,16]` | 256 | None |
| `W_actor_frozen` | `[5,16]` | 80 | None; a separate retained baseline |
| `W_world_frozen` | `[16,16]` | 256 | None; a separate retained baseline |

The adapter checks the own-data dimension constants `D_OBS=16`, `D_ACT=5`, `D_MORPH=6`. Each descriptor requires finite raw Float32 values, exact shape, zero byte offset, expected standalone backing capacity and the declared alias objects. It does not reconstruct frozen baselines from active weights. Its fingerprint identifies this storage/alias contract; full source hashes remain separate provenance and it makes no whole-model compatibility claim.

API:

```js
const adapter = await AlivePrimaryPolicyState.create({ registry, codec, crypto });
const captured = adapter.capture(h, snapshot, { generation, provenance });
const prepared = adapter.preflight(decodedHandle, h, { generation });
const receipt = adapter.apply(prepared, h, { generation });
```

The original eight-test `tests/alive-primary-policy-state.test.cjs` qualification exercises the actual allocation fragment, actor calculation, world predictor update and practice-update loops extracted from `index.html`. The comparison explicitly supplies equal omitted observations, prediction history and deterministic mesh inputs; it checks real weight changes, exact restore, the next numerical update and next motor output. It excludes heuristic evaluation/promotion labels. Other cases cover signed zero/subnormals, independently different frozen baselines, exact object aliases, malformed rosters/shapes/dimensions, nonfinite inputs, stale plans and mutable public decode mirrors.

The synthetic interchange fixture is at `research_notes/alive-autonomy-audit-2026-11-08/learned-state-foundation-2026-11-09/primary-policy-fixture-v1/`. It contains compact `payload.json`, six original `.bin` buffers and `expected-source-state.json` with original bytes, values, dimensions and authored alias descriptions. Its six buffers are synthetic and distinct. The independent verifier owns the separate expected application catalog; this fixture's producer expectations are not that independent catalog.

These tests establish the declared tensor subset. They do **not** establish persistence of optimizer state, prediction history, clocks, replay, RNG, curriculum, other models or complete policy continuation.

## Bounded primary activation versus full startup hydration

The connected startup loader compiles the static adapter and validates the exact
primary payload before the trusted classic application script runs. After the
constructor allocates the six arrays and installs cortex aliases,
`loadPersistentGenome` preflights the primary subset before legacy writes and
applies it afterward. Exact primary bytes and independently saved frozen baselines
therefore take precedence over rounded compatibility arrays. The normal serializer
retains those exact bytes. Source/destination binding and failed-admission tests
protect this subset; this is not complete model continuation.

The main classic script now starts from an inert element, retaining its global
lexical environment, followed by dependent modules in order before `boot`.
Decode/compile failures close startup and persistence admission. Focused tests
cover delayed startup and cancellation. The broader full-state requirements below
remain explicit.

Full startup requires a separate owner state such as `pending → allocated → prepared → applied → ready`, with `blocked` and `closing` terminal admission states for the attempt. Each attempt has a monotonically changing model generation. All model-mutating paths and captures consult the same readiness owner, including manual requests while the scheduler is stopped. Browser chrome and user tab navigation can remain usable; their availability is not permission to train or save an incompletely hydrated creature.

The original review identified these full-state gaps. Later worker and asset fences address stale replies, but do not persist the omitted components:

- The runtime constructor calls `loadPersistentGenome`, starts optional disk and bridge requests, then advances Omega and saves an initialization baseline. A full restore must not receive an extra model step or baseline save before its observation boundary.
- Coupling, specialist fusion and autosave are installed later in `alive-overdrive-adapters.js`; research is created after an immediate genome-save request and currently restores its own localStorage state. These destinations and private state owners must exist before full preflight.
- Sibling and federation asset requests now use generation-bound source receipts, and trainer replies have worker/model generation identities. Full restore still needs to declare the retained asset and trainer state, prepare it coherently, and fence all owners together.
- The crawler permits its initial frame under a pause-related condition, and controller manual requests can run while ordinary scheduling is stopped. A fixed delay or a stopped scheduler is not a hydration barrier.

For full startup: construct components without stepping/training/publishing; establish all aliases and component owners; resolve required bootstrap assets into detached or generation-bound state; prepare all validated state; synchronously commit; apply declared authority/scratch resets; expose an observation point; then open learning and ordinary capture admission. A confirmed absent canonical record may follow a documented fresh initialization path. A present incompatible record remains intact and blocks writes.

## Component ownership and decomposition

| Component | Retained responsibilities | Separate decisions or prerequisites |
| --- | --- | --- |
| Primary policy | The six views above | Full continuation also needs world history, clocks, observation boundary and downstream models. |
| Deep cortex/connectome/world model | Learned matrices, frozen references, recurrent state, STDP traces, memory banks and optimizer arrays | Freeze actual multidimensional layouts and scalar cursors; include `hopfieldWritePtr`; do not infer learning from allocation names. |
| Trainable hub | Learned weights and scalar biases `b_disc2`, `b_aware`; Adam moments; plasticity LR; backprop/dream clocks; retained TD history | Fixed nonshared backing is implemented; full arena state, replay staging and exact scalar ranges remain to be cataloged. Existing rounded export is not an exact-state source. |
| Mesh/DSD/morphology | Retained dynamics, neuromodulators/viscera, simulation phase, memory rings/cursors, morphology state | Audit reconstructed literal/topology arrays and RNG-dependent initialization separately. Preserve chiral parity as recurrent state. |
| Frontier and reasoning | JEPA/Mamba/reasoning weights, recurrent state, scalar value biases and counters | Canonical precedence over optional binary loading; preserve actual engine aliases instead of double counting linked instances. |
| Bleeding-edge/sibling/federation | Their declared matrices, recurrent arrays, precision arenas, PRNG state and numerical clocks | Trainer generation/clock, asset ownership, Wasm resource boundary, mixed HDC reconstruction and fresh execution receipts. |
| Coupling | Weights, learned gate logits and declared eligibility/history | Component-owned closure reset; live gates/presence and computation receipts cannot be restored as current execution evidence. |
| Authentic organism | Source-versioned native envelope including RNG, topology, sets, elapsed state and affinity; recovery provenance | Opaque native preparation is implemented; a combined global commit and explicit current versus legacy-reconstructed continuity tier remain required. |
| Research/evidence/curriculum | Bounded model/maps/sets, retained memories, replay partitions and creature identity/history | Freeze exact field schemas; one canonical revision; clear current-document chains and pending navigation. |

The catalog's alternate federation paths are important: the hub's federation ordinarily aliases `bleedingEdge25Engine.siblingBrainFusion.multiverse10Pantheon`, and all fourteen brains share its arena object. Full integration must prove these relationships directly, including descendant aliases omitted by the historical deduplicating traversal. It must not restore duplicate copies through different paths.

## Arena ownership and asynchronous writers

The construction-only arena change is implemented: the renderer-owned 8,192-byte
hub and 131,072-byte federation arenas use fixed `ArrayBuffer`s, preserving view
layouts and aliases. The sibling 65,536-byte arena remains a separate fixed
allocation. `tests/alive-fixed-arenas.test.cjs` checks layouts and numerical
behavior. These buffers are not shared with the trainer worker, and full arena
persistence remains outside the primary subset.

The trainer now fences replies by generation, worker identity, job identity,
target epoch and committed semantic epoch, validates complete finite results,
and closes admission at shutdown/restore boundaries. Its numerical update remains
separate from the six-tensor primary format. `tests/alive-worker-trainer.test.cjs`
and `tests/alive-worker-lifecycle.test.cjs` exercise this protocol. Complete-state
restore must still persist all trainer-owned state and the last **committed**
epoch, rebase the next target coherently, and explicitly discard old pending work.

The existing autosave `cancelAndDrain` is a physical storage fence, not a trainer fence. Hold both independently. After the final await, recheck model generation, root/view identities, alias topology and writable own-data slots immediately before the synchronous transaction. Serializer completion from an older generation must not publish over a restored model; retain the existing owner/epoch/job receipt checks and physical commit settlement.

## Replay requires detached staged allocation

The live hub starts with `replayRing32: []`, writes a newly allocated record at `replayWritePtr & 31`, advances the pointer modulo 32, and samples existing records by greatest surprise. Each occupied record contains `z16: Float32Array(16)`, `a8: Float32Array(8)`, `zNext16: Float32Array(16)` and a finite `surprise`. The full capacity adds at most 96 views and 5,120 raw bytes. Occupancy is runtime data, not architecture identity.

Do not prefill 32 live dummy records to satisfy the current generic registry. That changes length/occupancy and replay selection semantics. Its current missing-slot rejection is intentional.

A staged replay adapter should validate capacity, actual array length, occupied indices, cursor, record keys, shapes and priorities before allocating. Build a detached candidate container with exactly the declared occupied slots and typed buffers. Validate/populate that container through the codec/registry, then prepare publication of the live own-data `replayRing32` slot and cursor as part of the same synchronous transaction as the rest of the model. Preserve holes only if the explicit source contract permits them; ordinary sequential growth appears dense before wrapping, so do not admit arbitrary sparse states without a decision. Audit whether any callback retains the old ring/record references before choosing replacement semantics.

The architecture hashes capacity and record templates, not present record count. Exact expected instance IDs are derived from the validated occupancy metadata. Tests must cover empty, partial, full and wrapped rings, a nonzero cursor, changed priorities, missing/extra instances, allocation failure, target replacement during an await, and unchanged next replay selection/update. A failure must leave the old live container and every already-existing model byte unchanged.

## Native, closure and asset publication

The generic registry deliberately supports neither arbitrary native import callbacks nor replacement of a registered state parent containing another registered leaf. A full coordinator must not invoke an unproven importer after writing ordinary tensors and call that atomic.

Prepare each native/research/closure candidate in isolation. Freeze the exact adapter contract for validated source, privately owned prepared state, generation/binding checks, synchronous publication and rollback evidence. Audit every reference that would continue pointing at an old instance. Research is currently retained in adapter-local closures, so replacing only a global property would not replace its actual owner. Prefer component-owned prepared publication of private state with validated nonthrowing assignments. Unexpected commit/rollback failure must keep admission closed and report partial application honestly.

The full native wire mapping also needs an explicit decision before implementation. The generic registry currently bounds an individual string schema at 65,536 characters and has no native-import path; the existing native envelope can be much larger. Do not silently squeeze it into that schema, drop fields, or add unknown keys to the frozen wire format. Freeze bounded component state IDs/representation and extend the trusted component coordinator accordingly. An auxiliary legacy section may remain for compatibility only with explicit authority/equality rules. Native, research, ordinary tensors and identity must commit in the same canonical revision, not independently racing files.

For coupling, retain declared learned weights/logits and whichever optimizer history the component contract explicitly approves. Rebase feedback authority and clear baseline validity before accepting a new-document reward delta. `previousObservation` is same-call scratch; `computedOmega`, gates/presence and bleeding-edge WeakSet memberships are execution receipts. Fresh model computation must establish them. The eight-value coupling counter view mixes history and current-baseline fields, so a whole-view “persisted” label alone does not define its resume behavior. Freeze a field-level reset/retain policy and test that the first feedback after restore establishes a baseline without a spurious update.

The five asset rows should remain unresolved until their effective bytes and provenance are observed and owned:

- C. elegans source/destination/weight/type arrays must be coupled to active edge count, hub-name mapping, loaded mode, transform version and source/effective digests. Constructor fallback, Node CSV and renderer IPC transforms are not assumed equivalent.
- `chaosEmb12x128` must be coupled to source mode, source digest, finite fallback/clamp transform, effective Float32 digest and loaded flag. The first 6,144 file bytes alone do not describe the effective transformed values.

Persisting actual effective asset values is the conservative proposal. Any reconstruction needs proved source+transform equivalence. Canonical state wins over a late asset response, and every duplicated bridge callback must check generation/ownership immediately before writing. A timed-out callback cannot later replace a restored asset. Wasm/GPU handles are fresh resources; their scratch/execution validity is not serialized neural state.

The mixed HDC view has fixed codebook elements `[0,128)`, generated scratch `[128,136)` and unused reserve `[136,256)`. Preserve those distinct semantics in the component reconstruction/reset specification. Do not label the entire view learned, and do not resurrect a “kernel completed” receipt from restored values.

## Qualification sequence and unresolved verifier needs

1. Independently compare the six-tensor fixture against expected IDs, dimensions, raw bytes and alias identities; retain its explicit subset scope. Then qualify the narrow startup predecode/apply path with actual first-observation evidence, stale bootstrap rejection and exact re-save.
2. Freeze component descriptors and mutation-site ownership from current sources. Reconcile all live/lazy paths, scalar fields, Map/Set/closure state and alternate aliases against a separately generated mature census. Unclassified or unresolved entries block a full claim.
3. Add isolated replay staging and worker generation/clock helpers with failure injection. Test a delayed old reply after restore/shutdown and the exact next target epoch after restart.
4. Qualify allocation-only component construction, the common startup/restore barrier and every late writer. Attempt Start, manual operations, first crawler frame, autosave and shutdown during delayed decode/assets/worker settlement; no model step, partial capture or default overwrite may escape.
5. Verify full transaction rejection for a bad final component, native preparation failure, changed root/alias, missing occupied replay slot, incompatible source/schema and failed publication. Compare raw live state and canonical hashes before/after. Exercise unexpected commit failure and verified rollback, or explicitly report blocked partial application.
6. Run the independently owned two-process writer/reader oracle only after source freeze and explicit runtime-slot release. Observe restored state before the first resumed update, compare the complete roster/scalars/aliases/native envelopes and durable receipt, then compare a controlled next update. No historical count or producer-generated manifest substitutes for that independent expected catalog.
7. Measure payload bounds, synchronous capture/application cost, decode/hash work and peak memory separately from storage latency. Keep actual render scheduling and hardware entropy limitations explicit; full browser/network determinism and learning-quality improvement are separate claims.

Unresolved decisions include complete curriculum/practice/evaluation schemas, evidence partition history, RNG stream ownership and nonreplayable hardware entropy; native component wire mapping; field-level coupling resets; replay hole semantics and detached publication; actual asset receipts; and independently enumerated mature aliases. The native migration's explicit approximate historical tier must survive later full saves.

## Source anchors and provenance

These historical hashes describe the original planning slice, not the current connected build. Later application changes have separate evidence; recheck current source hashes and named symbols before relying on old anchors.

| File | SHA-256 |
| --- | --- |
| `index.html` | `a9c0baf307965f1a8eb6373c1625f337f5d6f577bb5459a3b51d17cbef2c2a05` |
| `systems/alife-25-bleeding-edge-models.js` | `01f25a840f8c6e5c67333f424b2a77affdd491c86aa58fc94d3b511484a75432` |
| `systems/ported-multiverse-brains.js` | `524b45441c2a8830407dca7868b0f019363712c29a1e0afa6128db5f38476677` |
| `systems/alive-neural-coupling.js` | `7f859b453e9e6168559497ccfc82edd71e6127b65d537f4f18643f33ac754571` |
| `systems/authentic-asmodensius-adapter.js` | `193f0353be5ecb274a70692183452f23fd4eee088cde62ae5fd3cbf7cc4fd062` |
| `systems/alive-overdrive-adapters.js` | `a6ab4f64f17e525e4f7766703332e1e640ac80fd0951b35d7ef5f8baa5f0630c` |
| New `systems/alive-primary-policy-state.js` | `72ba1dd24517b280faf958516d61863eccde9f46397af0d65d10c476ece4b595` |
| New `tests/alive-primary-policy-state.test.cjs` | `9cd0ceb6747eca158cc7e576a08375061d31e96db9b08414abfdf3c55a560e3b` |

Historical source anchors were the primary allocation and cortex alias assignments around index 10972–11071; hub arena and replay allocation around 12109–12241; constructor restore/bridge tail around 12290–12313; replay update around 14557–14577; `loadPersistentGenome`/capture around 16268–16520; `stepClosedLoop` and practice kernels around 17054–17322; coupling installation/closure fields in `alive-neural-coupling.js`; worker code/reply handler around bleeding-edge 433–472 and dispatch around 713–719; and `loadWeightsFromDisk` around frontier 808–854. Line numbers may shift; the named methods and source hashes define the review boundary.
