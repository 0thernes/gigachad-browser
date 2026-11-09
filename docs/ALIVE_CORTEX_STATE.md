# Cortex and connectome continuity

`cortexMemoryState` retains the local `deepCortex` and `connectome512` graphs.
This includes the large expert matrices, recurrent state, attention gates,
Hopfield bank, body and browser projections, synaptic weights and eligibility,
voltages, spike traces, traversal phases and coverage history. External sensory
inputs, other engines and browser state remain separate components.

## Complete local storage and shared ownership

The mature direct-field inventory contains 74 cortex fields and 21 connectome
fields. Together they own 47 standalone typed buffers totaling 4,994,760 bytes:
40 Float32 views and seven Uint8 views. Forty-three additional state rows hold
scalars and ordinary arrays. The original constructor's accounting fields
`totalParams=1245184` and `totalBytes=4980736` exclude activation vectors and
later traversal state; their names do not establish that every counted value
is a learned parameter.

Two cortex fields belong to the primary component:

- `deepCortex.W_actor === runtime.W_actor`
- `deepCortex.W_critic === runtime.W_critic`

Their view and descriptor identities must remain intact. The cortex component
does not serialize or write their bytes again, and its preparation must permit
the primary component to update those bytes before cortex publication.

Three connectome paths share cortex-owned views:

- `connectome512.synWeights262K` and `connectome512.synapticWeights` both refer
  to `deepCortex.W_connectome_synapses`.
- `connectome512.eligibilityTraces` refers to `deepCortex.W_stdp_elig`.

Each backing is stored once with all its alias paths declared. Other owned
backings are distinct, fixed, nonshared, and at byte offset zero. Unknown fields
on the two model records require an explicit catalog revision.

Native typed-buffer storage is the model state. Custom JavaScript properties
attached to typed views or their buffers are excluded metadata and are never
read by this adapter. Inspection uses intrinsic geometry and byte access, not
enumeration of millions of numeric JavaScript property names. This keeps the
work bounded by the declared bytes rather than a quadratic key comparison.

## Retained state exists before restoration

Previously, the first cortex step allocated expert/attention traversal buffers
and the connectome's axonal traversal state. Their phases and cursors affect
which coefficients are read next; preserving only constructor-time weights
would therefore fail to preserve the next update.

The explicit `ALIVE CORTEX COLD STATE` constructor block allocates those fixed
buffers and zero histories after connectome aliases exist, before canonical
loading. It performs no inference, learning or random draw. Empty active-expert
and gate arrays and empty scope strings denote no observation yet. Existing
constructor telemetry is preserved as constructor data, not reclassified as
observed execution. The numerical equivalence test compares this eager state
with the previous lazy initialization under the same corrected numerical step.

## Attention range correction

The real output projection is `W_attn_out[64,64]`, or 4,096 values. Reading eight
coefficients per call requires 512 output phases. The former 1,024-phase
rotation read indices 4,096 through 4,103 on its 513th call and could write NaN
expert gates. The old coverage fixture incorrectly allocated 8,192 values and
therefore hid the defect.

Output coverage now has 512 entries and wraps from phase 511 to zero. The
coverage denominator uses the actual Q/K/V and output lengths, totaling 16,384
coefficients. Tests derive matrix allocations from the production constructor,
exercise repeated wraps, verify the final valid coefficient's influence, and
retain a control that reproduces the old out-of-bounds failure. This remains a
sparse rotating projection, not a dense attention implementation.

## Canonical transaction

The pending marker is `__alive_genome_cortex_state_v1__`. Cortex-bearing records
require primary, committed-trainer, hub and replay components. All five share
snapshot metadata bound to the outer identity, tick, policy and checkpoint.
Historical records without cortex remain readable; their missing cortex history
is not reconstructed as exact previous learning.

All captured bytes are owned before asynchronous sealing. Every started seal
must settle, including on rejection or cancellation. The combined canonical
record remains bounded at 32 MiB. The cortex's raw base64 alone occupies
6,659,680 characters; its own size is not proof that every possible combination
of native and model payloads will fit.

Startup validates all declared components and preflights all destinations before
the synchronous publication sequence: primary, trainer, hub, cortex, replay.
Actual object/view identities and expected aliases are rechecked. Unexpected
failure after publication begins closes startup and further capture, with an
explicit partial-application result. It does not claim global rollback.

## Evidence boundary

Controlled continuation uses the complete production cortex method with equal
external observations, neuromodulation, physical state and simulation tick.
It must cover attention and expert rotation, Hopfield wrap and gradient phases,
compare retained state before export, and compare resulting local state and
downstream motor outputs. Other engines also modify cortex arrays, so this local
method proof alone cannot establish whole-creature continuation.

The independent restart observer captures cortex bytes and alias relationships
before production exporters or diagnostics. It distinguishes naturally changed
weight matrices from activation/counter changes. The old actor sentinel is
removed because it aliases cortex state; remaining legacy world/pellet markers
must leave cortex, hub and replay unchanged.

Qualification must record the tested source, actual process results, wire size,
capture and startup costs, and observed rendering behavior. Tests and schemas
being present are not release evidence. See the
[broader learned-state integration plan](ALIVE_LEARNED_STATE_INTEGRATION_PLAN.md)
for remaining model, curriculum, research, native and RNG responsibilities.
