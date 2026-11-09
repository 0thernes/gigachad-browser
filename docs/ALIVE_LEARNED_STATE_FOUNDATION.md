# Declared learned-state persistence foundation

The initial isolated foundation passed 53 focused and cross-layer tests on Node
25.8.2 with unchanged source hashes during that run. Subsequent application work
now imports the codec and registry through the six-tensor primary policy adapter,
ordered startup bootstrap and normal serializer. The complete component catalog
is still unfinished. The original 53-test result is historical module evidence,
not the final application release result.

Paths under `research_notes/` identify local-only evidence excluded from published source; they are not public download links. See [the release summary](RELEASE_2026-11-09.md) for current release scope.
See [exact primary startup](ALIVE_PRIMARY_STATE_STARTUP.md) for the connected subset.

The corrected reference review and the independent continuity inventory found a
concrete gap: ordinary genome saves omit learned biases, optimizer moments,
replay/curriculum state and several model families. Counting typed arrays or
copying the current checkpoint record does not define complete learning state.

## Module boundaries

`systems/alive-learned-state-codec.js` owns the versioned
`gigachad.learned-state.v1` inner JSON format. It preserves typed-array bytes and
explicit scalar tags, validates lengths/types/hashes/shared-buffer overlap,
and enforces parser and resource bounds. The existing main-owned atomic store
is unchanged. `seal`, `encode`, and `decode` do not resolve application objects
or certify catalog completeness.

`systems/alive-learned-state-registry.js` compiles trusted semantic descriptors.
It captures declared values, checks the complete expected instance set and
live destinations, and prepares a synchronous application into existing views
and writable own-data fields. It preserves declared array aliases and backing
relationships. It rejects stale generations, replaced roots/views, accessors,
incompatible shapes, and mismatched state before applying a prepared plan.

The registry consumes a private decoder-issued snapshot through `verifiedCopy`.
Public decode fields are diagnostic copies; changing them must not change what
gets restored. Prepared plans similarly keep their data private. A fabricated
object with similar fields does not become a verified restore request.

## Representation and limits

The wire record contains architecture/component descriptors, snapshot metadata,
tensor and state manifests, a single exact-byte base64 blob, tagged state values,
and declared resume rules. Architecture fingerprints describe static semantic
types, dimensions, policies and family templates. Valid replay occupancy does
not change the architecture fingerprint.

Floating scalars use exact little-endian Float64 tags, including signed zero.
Counters use explicit safe-integer tags. Fixed-width signed/unsigned BigInts,
ordered data objects, arrays, scalar-keyed maps/sets, and tensor references have
separate tags. A field's trusted schema decides whether it is a float, counter,
half-precision bit field, or raw integer representation. Values are not rounded
or globally clamped to fit a save.

The canonical store's 32 MiB UTF-8 payload limit remains authoritative. The codec
also bounds raw tensor bytes, tensor/state/alias counts, dimensions, identifier
lengths, nesting, and total data nodes. A raw-data allowance is not permission to
exceed the complete JSON limit. Oversized state must fail; fields, precision and
replay entries cannot be silently dropped.

Wire strings must match the codec's compact `JSON.stringify` normalization.
This rejects duplicate object members and alternate numeric/escape spellings.
It does not claim that arbitrary JSON property order is canonical; recursively
sorted descriptor keys and semantic ordering define the architecture fingerprint.

## Limits beyond the connected primary subset

- The current generic replay-family contract requires preallocated destination
  slots/views. Missing slots reject without writes. Actual empty-ring restoration
  needs a staged container adapter; pre-filling the live ring could change the
  model's existing learning behavior and is not an acceptable shortcut.
- The native organism now has an opaque prepared-import API with revision,
  context and destination checks, plus separate continuation tests. Other private
  owners and a combined transaction still need explicit contracts. Calling an
  arbitrary importer after copying ordinary tensors is not atomic.
- Shared or resizable memory remains rejected. Renderer-owned hub and federation
  arenas now use fixed nonshared buffers while retaining their views. This does
  not establish full-model quiescence or complete arena persistence. No field
  may be omitted merely to make a test pass.
- The real descriptor catalog still has unresolved classifications and component
  state. The registry is not an unbounded object walker and does not infer that
  every weight-like name is trained or every random initializer is reproducible.
- Ordered primary startup, generation-bound trainer replies, native prepared
  import and backed-up native recovery are implemented boundaries. A complete
  cross-component restore, staged replay allocation, full trainer persistence and
  fresh browser-authority resets remain integration work. See
  [native startup recovery](ALIVE_NATIVE_STARTUP_RECOVERY.md). Neither native
  recovery nor the primary wire makes the legacy payload complete.

## Qualification

The focused command is:

```text
node --test tests/alive-learned-state-codec.test.cjs tests/alive-learned-state-registry.test.cjs tests/alive-learned-state-integration.test.cjs
```

These tests qualify fixtures and module contracts. They do not establish actual
application restart fidelity, a mature model roster, continued learning after a
restart, performance under the normal profile, or any scientific PDF gate.

The frozen combined report and source hashes (local-only artifact: `research_notes/alive-autonomy-audit-2026-11-08/learned-state-foundation-2026-11-09/2026-11-09T09-36-12-475Z/report.json`)
and adjacent `tests.log` record 20 codec, 23 registry, and 10 cross-layer tests.
Independent codec review found and resolved caller-array ownership escapes before
the final freeze. Tensor-reference resolution is checked against verified raw
tags and the trusted field schema, including an ordinary-object ambiguity test.

Complete-state application qualification additionally requires a frozen audited component
catalog, an independent complete state observation, a two-process durable restart
before the first model step, late-loader/failure/migration cases, and a controlled
continued-update comparison. Browser permissions, document receipts, pending jobs,
wall-clock schedules and active navigation always require fresh runtime authority.
