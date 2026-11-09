# Explicit legacy native recovery preparation

`AuthenticAsmodensiusAdapter.prepareLegacyRecovery(envelope)` prepares a supported candidate for an old authentic envelope that contains serialized native state but lacks `developmentAffinity`. It does not change an existing adapter, activate a candidate, write a profile, or modify the ordinary exact-import path. Invalid envelopes and current envelopes with an affinity field throw explicit errors rather than producing a fresh organism.

The return value is deeply frozen:

```js
{
  schema: 'gigachad.authentic-asmodensius.legacy-recovery.v1',
  envelope: { schema, sourceDigest, checksum, payload },
  provenance: {
    kind: 'legacy-missing-development-affinity-recovery',
    sourceDigest,
    sourceEnvelopeChecksum,
    preparedEnvelopeChecksum,
    checksumAlgorithm: 'fnv1a32-accidental-corruption-only',
    constructorStateChecksum,
    seed, profile, nativeTick, edges, affinityRows,
    preservedKnownState: true,
    knownStateComparison: 'exact-serialized-known-fields',
    developmentalAffinity: 'reinitialized-from-current-seeded-constructor',
    exactHistoricalContinuation: false,
    limitations: [/* explicit recovery and publication limits */]
  }
}
```

The API validates the envelope checksum and donor digest, exact legacy fields, saved graph tensors/adjacency, authored projection endpoints, native structures, and shared Set consistency. It enumerates the missing affinity domain from the validated saved development slots and reads values from an isolated current same-seed, default-profile donor constructor. An isolated adapter then imports the candidate through the unchanged normal validation path. Every original known field—native graph/state/RNG, genome, collections, sensory/motor vectors and scheduler state—must compare exactly before preparation succeeds. Only the missing affinity table is added.

Historical affinity/jitter was not serialized and cannot be recovered exactly. The current constructor's RNG consumption can vary with V8 sorting; its recorded state checksum identifies this preparation's constructor state but does not establish cross-runtime reproducibility. Saved state, including its genome, remains unchanged; the reconstructed affinity comes from the current default constructor and can differ from the missing historical closure. Future developmental behavior is explicitly approximate relative to that history. The envelope's existing FNV checksum detects accidental corruption and is not authentication. A publication owner must independently bind a verified backup, source revision/digest and candidate SHA-256 before writing canonical state.

## Validation on 2026-11-09

All 17 focused adapter tests passed in 16.68 seconds. The two recovery tests cover an otherwise incompatible graph size, preservation of every known field, immutable input/output, explicit approximation metadata, subsequent callable refinement, and rejection of malformed/current/source-mismatched envelopes. Existing exact continuation, projection validation and Set alias tests continue to pass.

The current adapter also passed actual Electron 45.2.3 embedded-Node replay for seeds 1, 17 and 31, each with 120 exact subsequent steps and 120 native developmental sprouts. Evidence: `research_notes/alive-upgrade-2026-11-09/authentic-electron45-replay-legacy-api.json` and its stdout/stderr logs. The ordinary exact path was not weakened.

A separate read-only dry run decoded the real canonical profile record using the independent durable evidence decoder. It read revision 128, payload SHA-256 `180e71b8210f4ade5e44293186ac7fd26c49184a5f7a48530f35b78d2ceedc63`. Ordinary legacy import correctly failed with `Typed array shape mismatch at state.org.syn.pre`. Explicit recovery preparation preserved native tick 51,370 and 3,480 saved edges, added 645 affinity rows, imported/exported exactly, and executed 30 subsequent native refinement sprouts with finite motor output. This does not establish exact historical future behavior.

Canonical record SHA-256 remained `ccfe36dcc39510eb9f0c64a8757e30b81ec52a2b1cbbf0b7ffb123bf390294c1` before and after. Profile writes: zero. Candidate payload exports: zero; the candidate lived only in memory. Only metadata was written to `research_notes/alive-upgrade-2026-11-09/authentic-legacy-recovery-dry-run.json` and its stdout/stderr logs. The running normal app was not restarted or changed by this task.

Frozen adapter SHA-256: `193f0353be5ecb274a70692183452f23fd4eee088cde62ae5fd3cbf7cc4fd062`. The donor source digest remains `d329ae1f35d4a88c8e519a8c21fbae3fe65c1da6c8627fa057b50fd4123aa0f8`, and the generated bundle remains unchanged. Startup integration, backup verification and canonical publication belong to the persistence owner and are not performed or claimed by this API/dry run.
