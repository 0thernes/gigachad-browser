# Native prepared-state transaction API

This source-only change gives the original Asmodensius adapter a private,
single-use restore preparation API. It does not activate a normal-browser
restore or establish atomicity with the separate learned-state registry.
The normal browser and its profile were not accessed for this qualification.

## API and ownership

```js
const context = { ownerId: 'restore-controller', epoch: 4, generation: 7 };
const handle = adapter.prepareImportState(envelope, context);
adapter.recheckPrepared(handle, context);
const receipt = adapter.commitPrepared(handle, context);
// An abandoned pending handle can instead be released:
adapter.discardPrepared(handle);
```

- `ownerId` is a nonempty string of at most 128 characters. `epoch` and
  `generation` are nonnegative safe integers, excluding negative zero. These
  three context properties must be own data properties. Identity is compared by
  value, so a fresh ordinary context record with the same values is accepted.
- Preparation validates an isolated donor instance, topology, developmental
  affinity, shared collection identities, scheduler, vectors and exact native
  round trip. It does not change the active adapter or its error field. No
  candidate pointer, closure, native tensor or serialized payload is exposed.
- The returned frozen handle has only a primitive `kind` label. A private
  `WeakMap` binds its identity to the actual adapter instance, context, native
  revision, candidate and destination admission record. Copying, serializing,
  cloning or proxying the handle does not duplicate that capability.
- `recheckPrepared` returns a frozen receipt with `status: 'ready'` after
  nonmutating admission. `commitPrepared` repeats admission synchronously and
  returns `status: 'applied'`. Both receipts also contain `ownerId`, `epoch`,
  `generation`, `revision`, `sourceDigest` and `checksum`. The reported revision
  is the admitted revision; a successful commit advances the private revision.
- Unknown, foreign, discarded, consumed, context-mismatched or stale handles
  throw before any active-state write. A failed check does not consume a pending
  handle. A caller may repair an external descriptor change and retry, but a
  supported model mutation permanently invalidates that preparation's revision.
- `discardPrepared` releases an own pending plan and returns `true`. It returns
  `false` for unknown, foreign, consumed or already-discarded handles. It does
  not change the active model or invalidate another pending plan.

## Publication boundary

The adapter object, `lastInput` and `motor2D` views, and their backing buffers
retain their identities. The native creature and its derived affinity state are
replaced only after admission; references into the previous creature are not
updated. Vector values, including negative zero, are installed through a
captured native typed-array intrinsic. Overridden vector `.set` methods do not
execute. Receipt metadata and intrinsic argument arrays are prepared before
the first write. The installation calls no donor method, public metadata getter,
external callback, importer or asynchronous operation.

Admission checks all adapter-owned destination fields for their original own
data values, writability, enumerability and configurability. It checks both
vectors using native getters for Float64 type, length, offset, byte length and
fixed nonshared backing, then compares their 144 baseline bytes. Detached,
shared, resizable and mutually overlapping destinations reject. Disjoint views
of the same fixed buffer are supported. Normal aliases into either view remain
valid and observe the restored values.

The private revision advances before supported state mutation: unpaused valid
`step`, unpaused `advance` including fractional/zero accumulation, every
`setPaused` call, successful imports and legacy-wrapper error updates. Paused
`step`/`advance` calls do not change model state. Direct scalar/reference changes
are caught when their descriptor values differ at admission; direct public
vector changes are caught by the small byte comparison. Arbitrary nested writes
through `_creature`, `_developmentAffinity`, or other externally retained model
references are **not** revision-tracked. No full-model hash is calculated during
admission. The caller must fence those writers.

The supported environment is a trusted ordinary adapter and standard native
JavaScript intrinsics. Proxy contexts/envelopes, hostile global intrinsic
replacement, shared-memory concurrency and process termination/out-of-memory
are outside the atomicity contract. Accessor properties on ordinary contexts,
envelopes and adapter destination fields reject without executing their getter
or setter.

`importState` retains its existing boolean/error interface and uses the same
preparation and commit implementation. Rejection changes only its diagnostic
`lastError` when that field remains writable own data, and invalidates prior
plans. A replaced `lastError` accessor is never called. Explicit
`prepareLegacyRecovery` remains separate: ordinary preparation does not silently
reconstruct missing historical developmental affinity or alter recovery
provenance.

## Application integration requirements

The application owns its writer/admission fence, transaction owner, epoch and
generation. It must validate all participants before the first write and keep
the operation synchronous and uninterrupted. The generic registry must exclude
native adapter-owned fields/vectors; applying another component must not alter
native readiness or invoke callbacks between readiness and native commit.

The generic registry currently exposes no rollback after a successful `apply`.
Its successful receipt followed by a native exception would be a partial
transaction. This API alone does not prove that the application's ordering,
component catalog and writer fence prevent that outcome. Combined failure
injection, complete state readback and restart/continued-learning tests are
separate qualification work. No normal profile migration was run here.

## Evidence

The prior adapter and original tests were preserved byte-for-byte under
`research_notes/alive-upgrade-2026-11-09/native-transaction-api/frozen-193f0353/`.
That manifest links the earlier Electron 45 qualification; those results do not
automatically qualify this changed adapter in Electron.

The new tests in `tests/authentic-prepared-state.test.cjs` cover opaque ownership,
stale/context failures, descriptor and buffer interference, non-consuming
rejection, discard, aliases, intrinsic writes and exact forced developmental
continuation for seeds 1, 17 and 31. The unchanged original native suite retains
the donor reproducibility, longer learning, topology and explicit legacy
recovery checks. The qualification directory records current source hashes,
command, Node runtime, test counts and log; its scope is pure Node, not an
Electron launch or an application-wide atomic restore.
