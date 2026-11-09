# Original-organism checkpoint replay on Electron 45

The Electron 45.2.3 smoke run exposed an authentic-adapter import failure:
`Typed array shape mismatch at state.org.syn.pre`. Repeated construction with
the same seed in its embedded V8 produced different sparse-edge counts. The
original donor's developmental wiring uses PRNG calls inside a non-transitive
`Array.sort` comparator (`brains/asmodensius-v40/creatures/001/organism/develop.ts`,
the noisy competition sort). Native sort comparison scheduling is not a stable
serialization contract. The original donor and generated bundle were not edited.

The adapter previously validated saved edge-array shapes against a freshly
constructed organism. This made the new constructor's graph an accidental
prerequisite for restoring the graph that was actually saved. The repair uses
the checkpoint's graph, with explicit bounded edge counts; fixed tensor types;
matching per-edge lengths; finite typed-array values; neuron-range checks;
complete, nonduplicated outgoing/incoming adjacency; and valid developmental
slots. Every non-topology tensor keeps its existing strict shape check. Native
restoration still has to round-trip exactly; the equality check was not weakened.

Sparse tensors alone do not contain all developmental continuation state.
`grow()` also returns an affinity callback closing over a private neuron-jitter
map. Reconstructing that callback from a new constructor could reproduce different
future sprouting even when the visible snapshot matched. New adapter checkpoints
therefore contain a bounded affinity table captured from the actual original
instance: every presynaptic candidate that `devRefine()` can use for each stored
projection and postsynaptic destination. These neurons were already tagged by
the original growth traversal. The capture does not change native state or call
a new random source. It is computed once for the adapter, then copied for export.
Import validates the table's complete domain and finite source range, restores
that callback behavior, and rebuilds the wrapper's derived region-coupling map.
This table covers the implemented refinement contract; it is not an export of
arbitrary functions or a claim that every conceivable future donor API is covered.

The eleven focused Node tests passed. They retain direct equivalence to the
unchanged donor, exact JSON continuation, one-day state, sleeping/pruning
continuation, and input-to-motor causality. Added cases restore a valid graph
whose edge count differs from genesis; execute forced sprouting and compare exact
payloads; reject graph and affinity corruption atomically; and preserve legacy
checkpoint behavior. Wrong non-topology shapes still fail.

The separate actual Electron embedded-Node report is
`research_notes/alive-upgrade-2026-11-09/authentic-electron45-replay.json`.
Electron **45.2.3**, Node **24.22.2**, V8 **15.6.75.27-electron.0** passed exact
import and **120 continuation steps per seed** for seeds 1, 17, and 31, including
**120 actual developmental sprouting operations per seed**. The serialized
payloads were approximately 750–760 thousand characters. The source digest stayed
`d329ae1f35d4a88c8e519a8c21fbae3fe65c1da6c8627fa057b50fd4123aa0f8`.
This test used no windows, network, service startup, or normal user profile.

Legacy checkpoints do not contain the affinity table. Their old payload encoding
and strict constructor-shape gate are retained; a mismatch is rejected without
replacing the adapter's existing state. A successful legacy import is the prior
contract, not new evidence that hidden developmental state can be reconstructed
across all runtime versions. The owning profile loader must surface an import
failure and preserve the old canonical file rather than silently replace it with
a newly initialized original organism. This report does not claim that normal
profile migration or actual renderer smoke has passed; those require their own
observations after this source change.
