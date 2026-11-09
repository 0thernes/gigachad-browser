# Replay memory continuity

The `trainable-hub-replay` component preserves the occupied experience memories
that influence the neural hub's dream-training updates. It adds exact replay
container persistence to the primary-policy and committed-trainer components;
it does not establish complete learned-state or whole-model continuation.

## Retained state

The current producer writes a new transition before selecting a dream memory.
It replaces the physical slot at `replayWritePtr & 31`, then advances the cursor
modulo 32. On each eligible frame, the strict `>` surprise comparison selects
the lowest physical index among tied maxima above its initial `-1` threshold;
if no score exceeds that threshold, selection retains index zero. The current
producer derives surprise from nonnegative losses. Restoring chronological order in
place of physical order would therefore change subsequent training.

| Value | Retained representation |
| --- | --- |
| Occupied records | Dense physical indices `0..count-1`, with `count` from 0 through 32 |
| Write cursor | Integer 0 through 31; equals `count` while the ring is partial |
| `z16` | 16 finite Float32 values, exact 64 bytes |
| `a8` | 8 finite Float32 values, exact 32 bytes |
| `zNext16` | 16 finite Float32 values, exact 64 bytes |
| `surprise` | Finite Float64 scalar using the exact tagged representation |

Every occupied record owns three distinct, fixed, nonshared backing allocations,
also distinct from direct native typed views on its hub. That topology check
reads own data descriptors without invoking getters and bounds the hub inventory
at 4,096 fields.
Capture rejects holes, extra fields, accessors, duplicate records/backings,
nonfinite values, and inconsistent cursor/occupancy. Signed zero and subnormal
Float32 values are retained. A full ring has 96 tensor views and 5,120 tensor
bytes, plus the priority and occupancy metadata. `a8` remains part of the
experience record even though the current dream gradient does not consume it.

## Detached staging and publication

`systems/alive-replay-state.js` uses a static capacity-32 registry family. Its
architecture fingerprint is independent of occupancy. Only occupied slots have
records in a private capacity-length projection; no dummy records are inserted
into the live ring, and the live array is never padded during validation.

Decode obtains occupancy from the codec's private verified capsule. Mutable
public decoder mirrors cannot supply replacement metadata or bytes. The adapter
allocates and validates a detached candidate through the existing registry, then
publishes a ring of the original logical length and its cursor together.

The adapter exposes `create`, `capture`, `validate`, `preflight`, `recheck`,
`apply`, and `discard`. Preflight binds the hub, caller generation, original
ring/cursor property descriptors, occupied record identities/descriptors, and
all original bytes/scalars. Recheck rejects a changed destination. Plans are
private and single-use. Publication performs two synchronous own-data writes,
checks the result, and attempts verified component-local rollback if an
unexpected write/readback failure occurs. This contract assumes ordinary
non-Proxy objects and fenced model writers; it is not cross-component rollback.

## Canonical startup and saving

The canonical field is `replayMemoryState`; pending captures use
`__alive_genome_replay_state_v1__`. Replay-bearing records require both
`primaryPolicyState` and `trainerCommittedState`. All three exact components
must have identical snapshot metadata bound to the outer creature, tick,
policy, and checkpoint. Malformed reserved replay data cannot downgrade into
legacy JSON. Historical records without replay remain readable and begin with
the constructor's empty replay buffer; missing history is not reconstructed.

All captures own their bytes synchronously before hashing. The serializer starts
every component seal before awaiting, waits for all physical sealing work even
when one fails, and enforces the existing combined 32 MiB canonical limit.

Startup authenticates and validates all declared components before executing
the main application. The unpublished constructor applies replay after legacy
assignments and before the initial model step. Replay-bearing live reload is
unsupported. Unexpected failure after another component has written closes
startup and capture admission and reports partial application honestly.

## Continuation limits and verification

Exact replay memory does not preserve the surrounding world model, MoE weights,
GAN latent, prediction state, frame, learning rate, RNG, or browser observations.
The current replay gradient also depends on those values and on the transition
inserted immediately before selection. The continuation test therefore runs the
actual production push/selection/gradient fragment with explicitly equal omitted
state; this is evidence for the replay component, not full-world determinism.

The independent restart observer owns raw replay bytes and priority/cursor
values before production exporters or diagnostic callbacks. The restart probe
requires naturally populated replay, compares the paused model with both the
flushed and normal-close canonical records, and observes the new process
immediately after load, before its initialization baseline. Qualification
results must identify the frozen source revision and actual executed cases;
merely including the probe is not evidence that a candidate passed it.

The broader remaining catalog and component requirements are recorded in
[the learned-state integration plan](ALIVE_LEARNED_STATE_INTEGRATION_PLAN.md).
