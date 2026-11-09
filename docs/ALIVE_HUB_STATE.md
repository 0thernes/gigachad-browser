# Local neural hub continuity

The `hubMemoryState` canonical component retains the complete direct state of
`trainableAlifeNeuralHub`, except its replay ring and cursor, which remain owned
by `replayMemoryState`. It preserves learned parameters, retained intermediate
values, optimizer history, clocks, configuration and observable outputs. Those
categories are deliberately distinct: the number of stored values is not a
learned-parameter count or a measure of intelligence.

## Current source inventory

The constructor allocates 105 own fields: 58 typed views, one mixed arena
backing buffer, 43 primitives, two name arrays, and one replay ring. Excluding
the separately owned ring and cursor leaves 42 primitive fields (36 numbers and
six strings), two name arrays, the backing buffer, and all 58 views.

| Storage | Representation | Unique backing bytes |
| --- | --- | ---: |
| Mixed arena | 13 views sharing one fixed 8,192-byte allocation | 8,192 |
| Standalone arrays | 45 distinct Float32 allocations | 13,176 |
| Replay | Separate dense ring component; up to 96 arrays | Up to 5,120 |

The hub component declares 59 wire tensors: the 58 actual typed views and a
synthetic Uint8 view preserving the arena's unused bytes `[4928,8192)`. Its
44 state rows cover all nonreplay primitives and both name arrays. It retains
21,368 unique backing bytes across 46 allocations. The 24 standalone parameter
and bias views contain 2,922 Float32 values; two additional scalar biases are
also retained. Other stored views contain mixed history, configuration, sensor
inputs and derived outputs.

The arena contains three Float64 trajectories, two Float64 Adam moment arrays,
a Float64 loss ring, Int8 quantized and ternary arrays, eight BigUint64 spike
lanes, Uint16 legacy packed words, the 16-by-16 Float64 coupling matrix, and
two Float64 faculty vectors. The field named `fp16PersistentWeights256` uses
the application's existing magnitude-based integer packing. Persistence keeps
those native Uint16 words exactly; it does not qualify them as IEEE half-precision
floating-point weights or change their encoding.

The adapter binds actual view identities, offsets, lengths, native types,
backing capacity and shared-arena topology. It preserves the entire reserved
tail rather than reconstructing it. Unknown own fields require an explicit
catalog revision. Configuration names and labels are versioned data, not
evidence of the capabilities they name.

Validation also rejects negative Adam second moments, diffusion schedule values
outside `[0,1]`, and negative values in the four retained EMA mean-square
losses. These domains follow from the current producer; accepting merely finite
values would allow restored data to produce invalid square roots on the next
update. Signed zero remains exact for floating-point fields.

## Save and startup contract

Pending captures use `__alive_genome_hub_state_v1__`. Hub-bearing records require
primary, committed-trainer and replay components with identical snapshot
metadata and matching outer creature, tick, policy and checkpoint identities.
Historical records without this component retain their earlier compatibility
behavior; missing historical hub state is not reconstructed as exact learning.

Every component owns its captured bytes before asynchronous hashing begins.
All seals are started before awaiting settlement, and every seal is drained
even when one fails. The combined canonical JSON ceiling remains 32 MiB.
Startup validates every declared component before activating the main script,
then preflights destinations before any exact-component publication. Commit
order is primary, committed trainer, hub, then replay. The hub writes into its
existing views; replay publishes its detached ring through its own adapter.

An unexpected failure after publication begins closes startup and capture
admission and reports partial application. This is not a claim of global
rollback. Primary's six-tensor receipt remains intact so the older optional
binary bootstrap continues to yield to canonical state.

The legacy disk-save method also fences late completion against shutdown,
checkpoint restoration, changed runtime/engine owners, restore generation and
authority epoch. An accepted reply may increment the hub checkpoint clock while
ordinary learning advances. A stale reply cannot publish counters or status
into the replaced model. This fence cannot undo an external disk write that
already completed.

## Numerical and process evidence boundaries

`tests/alive-hub-continuation.test.cjs` extracts the actual constructor allocation
and complete local hub step from the application source. It supplies equal
external cortex/world/body/emotion state, browser observations and an explicit
32-value `hybridQrng.u64()` tape per step. It checks all hub fields, native raw
bytes, aliases, replay state and the local method's external outputs across
empty, partial, full and wrapped replay histories. Optional engines are tested
for callback order separately; their numerical state is outside this component.

The independent process observer captures raw hub state before production
exporters or diagnostics. The restart probe compares naturally trained state
with explicit flush, normal-close storage and the reader's first post-load
observation. It must not inject hub weights or training counters to produce a
passing result. A release receipt must identify the executed candidate and
results; the existence of these tests alone does not qualify a release.

The surrounding cortex, frontier engines, research state, coupling state,
curriculum, native assets and RNG stream are broader persistence work. Browser
events and hardware entropy are not replayed by this component. Exact local
continuation with controlled external inputs is not whole-creature determinism,
learning-quality improvement, or evidence of sentience.

See [the complete learned-state integration plan](ALIVE_LEARNED_STATE_INTEGRATION_PLAN.md)
for the remaining catalog and transaction requirements.
