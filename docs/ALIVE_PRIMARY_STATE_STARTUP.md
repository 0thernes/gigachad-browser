# Exact primary policy state and ordered startup

The application now connects the exact learned-state codec and registry to the
six primary policy arrays. This is a bounded persistence improvement, not a full
model-state checkpoint or a claim of consciousness or general intelligence.

New canonical saves also pair this subset with the committed trainer's exact
weight bytes, private epoch and timeout. See [the trainer contract and measured
restart qualification](ALIVE_TRAINER_STATE.md). Paired restoration is restricted
to unpublished startup construction; primary-only historical records remain
supported. The scope below describes the six primary arrays specifically.

## Application path

`index.html` loads the primary adapter and bootstrap before its main classic
script. The main source is inert until `alive-startup-loader.js` has validated
the canonical JSON and asynchronously authenticated any exact primary state.
The loader inserts that trusted source as a real classic script, retaining the
global lexical bindings required by the existing browser controls and adapters.
It then loads dependent modules in their declared order, waits for the
startup autosave fence, transfers close ownership, and invokes the real `boot()`.

The constructor preflights the exact primary state before legacy writes and
applies it after those writes. Exact primary bytes take precedence over rounded
compatibility arrays. The late binary-weight initializer also respects an exact
primary-only restore. The saved primary metadata must agree with the surrounding
genome's simulation tick, policy and checkpoint identities.

The retained views are `W_actor[5,16]`, `W_metamorph[5,6]`, `W_critic[16]`,
`W_world[16,16]`, `W_actor_frozen[5,16]` and `W_world_frozen[16,16]`: 718 finite
Float32 values and 2,872 raw bytes. The actor and critic cortex aliases retain
their existing view identities. Both frozen baselines remain separate arrays;
they are not regenerated from the active weights. Signed zero and finite
subnormal values are retained exactly.

The normal worker serializer seals an owned primary capture alongside the
existing legacy genome. The asynchronous fallback owns both the legacy JSON and
primary bytes before yielding. Autosave tracks that encoding operation through
coalescing, cancellation, physical storage fencing and shutdown. A failed or
incompatible restore blocks canonical writes instead of saving constructor
defaults over the existing record.

## Close and asset races

Early close invalidates startup, blocks saving, and settles the active storage
fence. Its receipt explicitly says no final model snapshot was verified. A pending
external script is adopted into a detached inert document: ordinary removal of a
prepared script does not guarantee cancellation. Startup checks both the changed
document identity and disconnection before reporting settlement.

After close ownership transfers, the actual `boot()` checks closing state after
config/session/model-health awaits, in its error fallback and inside its delayed
autonomy callbacks. Late replies cannot create a new habitat or restart autonomy.

External graph and chaos asset requests carry private generation handles and
source receipts. Host predicates are checked around asynchronous preparation so
replacing the owning sibling/federation reference or beginning shutdown prevents
an old reply from committing. Alias-equivalent federation targets are hydrated
once. These mechanisms prepare the asset boundary for a future complete state
restore; this six-tensor primary format does not persist those external assets.

## Evidence scope

Focused tests cover real production allocation/update fragments, exact primary
restore, independently different frozen baselines, delayed encoding, malformed
state, startup sequencing and close races. The independent hydration observer
must copy raw arrays and metadata before calling a production exporter, so an
exporter cannot conceal a failed restore by repairing the observed state.

The initial connected-source snapshot passed the actual Electron 45.2.3
two-process restart proof, 22/22 checks. The second process was required to load
the exact primary field and match all six arrays, 718 values, backing relationships
and declared aliases. Both close receipts were bound to the current process
owner, independently decoded canonical digest/revision and settled storage
drain. The original normal-profile source stayed byte-identical. Evidence:
`research_notes/alive-autonomy-audit-2026-11-08/primary-state-startup-2026-11-09/snapshot-restart/`.

A separate actual Electron loader probe passed 22/22 checks, including delayed
script delivery after cancellation and a removal-only control that really did
execute. Its synthetic model/storage fixtures test browser startup semantics,
not model learning. The initial full smoke attempts stopped on an excluded public
test fixture and a legacy callback fixture missing its enclosing predicate;
those failures remain recorded, and the live test fixtures have been corrected.
Final combined qualification, including the later worker/arena changes, is
recorded in [the release evidence](verification/release-2026-11-09.json).
All reports qualify their recorded source hashes only. The already-open
normal application and its profile have not been restarted or migrated by this
integration work.

## Background trainer and renderer arenas

The background trainer now admits one job at a time and binds replies to the
worker, job, model generation, target view/backing and next committed training
epoch. It validates all sixteen finite input/result lanes, stages the complete
Float32 update, then applies it once. Discarded work cannot advance the semantic
clock. Pause, document hiding, checkpoint restoration and shutdown revoke
admission, discard pending work and terminate the owned worker. Resume creates a
new generation without resetting the committed clock. Worker errors and the
bounded stall timeout remain visible and require deliberate resume for recovery.

The existing target equation is unchanged. The new paired canonical component
retains the host-owned committed clock with the weight bytes. The low-level
worker status still reports `semanticClockPersisted: false`: that owner does not
certify storage, and durable persistence is established by the canonical save
and startup receipts described in the trainer contract. A successful engine
restore exposes `committedStateRestored`. Restoring only weight arrays through
the separate generic checkpoint path does not establish trainer continuation.

The 8,192-byte hub arena and 131,072-byte federation arena now use fixed
`ArrayBuffer` backing. Their offsets, lengths, aliases and numerical kernels are
unchanged. These arenas have no inspected cross-worker consumers, so shared
backing was unnecessary and prevented the exact codec from admitting them.
Allocation and selected real-kernel parity tests cover environments with and
without `SharedArrayBuffer`; this is not a claim of full arena persistence.

An earlier connected-source Node selection passed 970 tests, including
fifteen trainer tests, ten application lifecycle tests and six arena tests.
The log is `primary-state-startup-2026-11-09/combined-node-tests-v2.log` beneath
the audit evidence directory above. Final release qualification must identify its
own frozen source and include any later packaging changes.

## Remaining complete-state work

The primary wire deliberately excludes optimizer state, recurrent dynamics,
observations, replay buffers, curriculum, RNG streams, clocks, neural coupling,
other model families and browser authority. The native adapter has its own
validated state envelope and prepared-import API; legacy native recovery retains
its explicit reconstructed-affinity provenance. Neither that envelope nor the
primary wire alone establishes complete application continuation.

Separate subsequent components retain the [committed trainer's exact weights
and private epoch](ALIVE_TRAINER_STATE.md) and the [dense replay memory and
insertion cursor](ALIVE_REPLAY_STATE.md). Their explicit component contracts and
qualification scopes do not expand the six-tensor primary wire's own coverage.

The [local neural hub component](ALIVE_HUB_STATE.md) also retains all direct hub
views, primitive state and complete mixed arena. Hub-bearing snapshots require
all four exact components to agree on snapshot identity. The serializer owns
all component bytes before hashing, and startup validates them before activation.
Numerical continuation of the local hub is tested with controlled external
inputs and entropy; this does not establish full application continuation.

The independent candidate catalog records proposed dispositions for 648 observed
constructor views, not a certified mature-state registry. Lazy allocations,
private closures, aliases and non-tensor fields still need explicit ownership.
The complete integration still requires the remaining components' semantic
clocks and state, a common no-learning restore boundary across the entire model,
and a cross-component transaction with verified rejection or rollback. The
implemented trainer clock and detached replay publication cover their declared
components; unexpected failure after another component writes still closes
startup and reports partial application instead of claiming global rollback.
