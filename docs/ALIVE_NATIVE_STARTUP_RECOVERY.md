# Native-state startup recovery

Paths under `research_notes/` identify local-only evidence excluded from published source; they are not public download links. See [the release summary](RELEASE_2026-11-09.md) for current release scope. Private profiles and detailed state captures are not release assets.

Older native-organism envelopes omitted the developmental-affinity closure.
Electron 45's V8 can also generate a different graph from the same seed because
the donor consumes random numbers inside a sorting comparator. Recreating a
fresh graph and copying only same-shaped arrays therefore rejected an otherwise
usable historical snapshot.

Startup recovery runs in the main process after the canonical store initializes
and before IPC bootstrap or a browser window exists. It does not modify an
already running renderer. The adapter prepares and validates an isolated native
candidate that preserves the recorded topology, weights, RNG, collections,
inputs and scheduler state. The absent affinity values are reconstructed from
the current same-seed constructor. This is explicitly **not exact historical
continuation**; future developmental refinement can differ.

The store preserves the original header and payload bytes at the fixed profile
filename `alive-genome-v1.migration-backup.snapshot`. It writes and syncs an
exclusive temporary copy, verifies it, publishes an exclusive hard link of that
copy, then independently verifies the backup and original. It never links the
canonical file itself or replaces a conflicting backup. Unsupported hard links
fail closed.

A backup receipt alone is not a persistence receipt. Migration publication uses
the store's existing physical queue and atomic canonical replacement, with a
store-issued backup capability tied to the owner, epoch and original revision
and SHA-256. The backup is reverified before publication. A newer canonical
revision, owner change, fence, conflicting backup or failed readback blocks the
operation. Preparation and publication failures quarantine writes rather than
replacing saved state with constructor defaults.

Only the native envelope is replaced. Every other existing top-level JSON value
retains its original bytes, including unknown fields, negative zero, numeric
spelling and nested data. The added `nativeStateRecovery` record identifies the
source revision/digest, exact backup digest, runtime versions, adapter provenance
and the reconstruction limitation. The renderer retains this record in future
saves and shows the reconstruction notice beside the native-organism status.

The renderer's normal startup importer consumes the resulting canonical record.
Already current envelopes are not migrated again. This repair does not expand
the older genome serializer into a complete learned-state checkpoint. The
exact-state codec and registry are now connected for six primary policy tensors,
separately from this native migration. Optimizer, replay, hidden state and other
omitted fields still require a complete catalog and cross-component boundary.
See [primary startup](ALIVE_PRIMARY_STATE_STARTUP.md) and
[the foundation scope](ALIVE_LEARNED_STATE_FOUNDATION.md).

Verification uses store fault tests, coordinator tests and
`scripts/alive-native-migration-probe.cjs`. The explicit probe copies a selected
snapshot into a nonce-owned temporary profile, runs actual main-process startup,
observes constructor hydration, verifies autosave and normal close, then starts a
second process against that temporary profile. It checks that the input snapshot
remains byte-identical. This is not a power-loss qualification or a claim that
the missing historical affinity was recovered.

## Historical source-bound qualification - November 9, 2026

The isolated two-process probe passed all 21 checks on Electron 45.2.3. A copy of
revision 128 became revision 129 before renderer bootstrap. Both observed
constructor hydrations matched all 23 declared arrays and 5,182 values, with zero
differences or inconclusive comparisons. Both flushes and normal closes received
verified persistence receipts; the second process loaded its predecessor's
canonical record without repeating migration. The original backup and the input
normal-profile snapshot remained byte-identical. Both probe processes exited.

`npm run smoke` passed on the same source boundary: 604 Node tests, six Python
tests, sidecar/config checks and actual Electron/preload/native replay checks.
The proof and hash manifest are in
`research_notes/alive-autonomy-audit-2026-11-08/native-migration-1794218210842/`.
Private genome snapshots and detailed hydration observations remain in the
nonce-owned temporary profile identified by the report, outside the repository.
The isolated proof did not activate recovery in the already-open normal session.

The subsequent coordinated live-session archive attempt was stopped by the user
through Escape before any pause, drain, export, close or restart. No live archive
was created in that attempt. The normal session and its canonical snapshot were
left untouched by that attempt. This historical record does not establish the
current normal-session state or authorize discarding its in-memory branch.
