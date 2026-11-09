# Committed trainer state

The committed trainer component retains the bleeding-edge engine's current
`W_hyper_u` bytes, private committed worker epoch, and timeout configuration.
It is a bounded addition to the learned-state catalog. It does not establish
complete application persistence, learning quality, or consciousness.

The component identifier is `bleeding-committed-trainer`, schema version `1`,
with numerical kernel identifier `bleeding-hyper-worker-v1`.

| Retained value | Representation | Contract |
| --- | --- | --- |
| `W_hyper_u` | 16 Float32 values, 64 bytes | Finite values, exact IEEE754 bytes, standalone fixed backing, preserved destination view identity |
| `committedEpoch` | Safe integer, 0 through `Number.MAX_SAFE_INTEGER` | Authoritative private clock; editable diagnostics are never the source |
| `timeoutMs` | Integer, 50 through 30,000 | Configuration for future jobs |

Signed zero and subnormal weight values survive capture and restore. A terminal
epoch of `Number.MAX_SAFE_INTEGER` remains exhausted; restoration does not reset
it to zero or authorize another job.

## Capture and restore ownership

`captureCommittedTrainerState()` synchronously owns a copy of the current weight
bytes and private clock. It is permitted while training is active or a job is
pending. Capture neither suspends training nor counts pending work as committed.
The wire adapter takes a second owned copy before asynchronous hashing starts.

`new BleedEdge25AlifeEngine({ deferWorkerActivation: true })` allocates the
existing models while leaving the trainer suspended. This option gates the
trainer only; it is not an allocation-only contract for every sibling subsystem.

Restoration uses opaque, single-use engine handles:

```js
const handle = engine.prepareCommittedTrainerRestore(record, {
  expectedGeneration: engine.workerTrainerSnapshot().generation
});
if (!engine.recheckCommittedTrainerRestore(handle)) {
  engine.discardCommittedTrainerRestore(handle);
  throw new Error('Trainer changed during preparation');
}
const receipt = engine.commitCommittedTrainerRestore(handle);
```

Preparation requires no admitted worker, pending job, or worker URL and rejects a
disposed engine. It owns candidate bytes and binds the actual engine, generation,
weight view and backing, destination descriptors and bytes, clock, timeout, and
diagnostic publication slot. Recheck rejects changes before mutation. Commit
preserves the weight view, advances the generation, leaves the trainer suspended,
and creates no worker. Existing operational counters are not fabricated from
saved execution receipts.

The ordinary engine-object commit performs all expected validation and allocation
before writing. Its publication uses prevalidated own-data fields and captured
typed-array intrinsics without an asynchronous boundary or user callback. An
unexpected copy failure attempts and verifies local rollback. This component
contract does not roll back another component that has already committed.

`systems/alive-trainer-state.js` compiles the fixed wire catalog and exposes
`capture`, `validate`, `preflight`, `recheck`, `apply`, and `discard`. Validation
applies decoded, privately verified bytes to detached staging arrays before any
engine mutation. Wire paths describe that detached projection; they are not
public aliases for the private clock.

## Continuation boundary

An actual worker job at epoch `E` uses the captured latent input `v`:

```text
target[i] = tanh(0.92 * v[i] + 0.15 * sin(0.3 * E + i))
delta[i] = Float32(-0.05 * (v[i] - target[i]))
u[i] = Float32(clamp(current_u[i] + delta[i], -1.5, 1.5))
```

The main model also updates `u` synchronously. A worker result intentionally
applies to the current `u`, including intervening model steps. Matching the next
worker result after restoration therefore requires equal next latent input and
equal intervening update order. World latent state, network observations, hub
frame cadence, surrounding model state, and the rest of the learned-state catalog
remain separately owned requirements.

Pending jobs, worker instances, callbacks, timers, job identities, and generations
are not durable model state. Old worker replies cannot publish after retirement.
Network reconnaissance also captures the generation and telemetry owner; an old
response cannot overwrite observations after pause, restore, disposal, close, or
telemetry-owner replacement.

## Verification scope

The committed-state tests execute the actual engine methods and emitted worker
code with controlled transport. Wire tests use the actual codec, registry and
engine transaction. The independent trainer evidence module defines its own
catalog and decodes the wire without importing the production serializer or
trainer adapter.

These checks cover exact bytes and clock/configuration, complete roster and
architecture rejection, stale handles and destinations, malformed final values,
ownership of asynchronous inputs, terminal clock retention, and late response
fencing. An end-to-end numerical test first commits three actual worker updates,
passes that state through the real wire codec, restores another engine, and
compares the next worker delta and final weights after an intervening actual
main-thread update. It supplies equal external latent and network inputs and
controls the event order; the two engines retain different operational counters.

The normal canonical genome now captures the primary policy and trainer in one
synchronous turn with identical snapshot metadata. The serializer owns both
components before asynchronous hashing yields, waits for both seal operations to
settle, and enforces the combined 32 MiB limit. A trainer field without a valid
primary companion is rejected. Startup verifies both components before executing
the main application, constructs the trainer with deferred activation, and applies
the pair inside the unpublished model constructor. A failed application keeps
startup and persistence admission closed. Paired live reload is rejected because
there is no cross-component live rollback contract.

The [qualification record](verification/trainer-state-2026-11-09.json) covers the
isolated integration based on commit `b291cde`, with qualified tree
`9a8685eb6ff8cb4f27933ccf548a1bf3fde559dc`. It excludes later changes to Synaptic
Fabric, cognition, cortex and UI in the shared checkout.

- All 1,068 Node tests passed on Node 25.8.2.
- `npm run smoke` passed 834 selected Node tests, six Python tests and the actual
  Electron 45.2.3 application check. Electron used embedded Node 24.22.2.
- The two-process restart probe passed all 24 checks. The writer naturally
  completed eight worker updates over 11.22 seconds. Its exact 64 weight bytes,
  private epoch 8 and timeout 5,000 ms matched at flush, normal close and immediate
  reader hydration. The reader's trainer was inactive with no pending job.
- The unsigned portable candidate contained 2,092 files and 468,030,926 bytes.
  Its actual executable emitted `SMOKE_OK` and exited 0; all packaged file hashes
  remained unchanged after the run.

The private clock is observed through the engine's explicit read API. Weight
bytes are observed independently before that callback. The restart writer emitted
a guest-frame-disposed message during close, and Electron emitted a callback API
deprecation notice; both processes exited normally and all checks passed. This
qualification does not establish full-model continuation or new frame-rate,
learning-quality, or consciousness claims.

The generic `Checkpoint CID` tensor restore is a separate historical mechanism.
Its tensor-only snapshot does not retain this private trainer epoch. It must not
be presented as exact committed-trainer continuation, even when its tensor
restoration succeeds. The paired canonical genome path is the path under
qualification for this component.
