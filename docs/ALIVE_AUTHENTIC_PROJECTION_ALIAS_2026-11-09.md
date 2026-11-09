# Authentic adapter projection and collection follow-up

This follow-up addresses two independently reproduced persistence gaps in the native Asmodensius adapter. It supplements the earlier exact-replay report; it is not a claim that all application state or arbitrary native object aliases have been audited.

## Reproduction and repair

The saved development graph previously determined a projection's source region from its own `syn.pre` entries. A fixture changed every projection-0 source from the donor's SENS region to THAL, updated all outgoing adjacency lists and affinity row starts consistently, and recalculated the envelope checksum. Import returned true. Calling the actual donor refinement path then threw `Developmental affinity lookup outside saved domain`, because the unchanged donor still sampled the fixed source region from its private `CP` table. The original observed failure is preserved in `research_notes/alive-upgrade-2026-11-09/authentic-topology-projection-before.json`.

The adapter now checks each developmental edge's source and target against all 26 authored projection pairs, rejects self-edges (excluded by both donor growth and refinement), and requires the fixed developmental genome shape. These checks also apply to legacy envelopes; legacy sparse tensor dimensions still must match the constructor because those envelopes lack saved affinity data. The donor's private CP table is not exported by the existing generated bundle. A small immutable adapter table therefore mirrors its region pairs, with a test that parses the unchanged donor declaration and compares every ordered pair. No donor, entry point or generated bundle was rewritten.

The second reproduction compared native collection identity before and after import. The donor shares one `off` Set across bus/selfM/curv/neo and one `ctl` Set across bus/selfM/neo. The importer previously constructed one Set per serialized record, losing mutation propagation. It now records the isolated warmed candidate's original Set identities before restoring the checkpoint, recreates one Set per native alias group, and reuses that Set across the corresponding restored fields. Independent collections remain separate. Conflicting values or iteration order for a shared group, and duplicate serialized Set values, fail atomically before replacing the live creature.

## Verification

`node --test tests/authentic-asmodensius.test.cjs` passed all 15 tests in 15.44 seconds. Coverage includes unchanged donor equivalence, prior exact continuation and developmental pruning, the authored table assertion, self-consistent malformed source and target fixtures for new and legacy formats, a self-edge fixture, post-import shared mutation propagation, exact subsequent 20-step continuation, and atomic rejection of inconsistent shared collection records.

The installed Electron 45.2.3 executable also ran `scripts/check_authentic_replay_electron.cjs` with `ELECTRON_RUN_AS_NODE=1`, using embedded Node 24.22.2 and V8 15.6.75.27-electron.0. Seeds 1, 17 and 31 each imported exactly and retained byte-exact payload equality through 120 subsequent steps plus 120 explicitly exercised native developmental sprouts. The new report is `research_notes/alive-upgrade-2026-11-09/authentic-electron45-replay-projection-alias.json`; earlier evidence was not overwritten. Its stdout and stderr are preserved alongside it. This verification creates no renderer windows, browser profiles, services or network requests and makes no renderer performance claim.

`research_notes/alive-upgrade-2026-11-09/authentic-topology-projection-alias-after.json` separately records rejection of the original malformed-source fixture without live-state replacement, shared collection identity and mutation propagation, and continued separation of the affect collection.

Frozen hashes for this result:

- Adapter: `048206df7b32012b57d9f499aff0ae97563e1726090950a068871803e886cc2a`
- Native test file: `6c5249854810eb2bc0f1fcd0125190a2cd1e4e4ec86e54956bb27cff2305b2d5`
- Unchanged generated bundle: `b2bdd297bb14c7e16c4ccfa3e692ff43b5cb9d6b162a4f033071c445b7fbc3cb`
- Unchanged donor source digest: `d329ae1f35d4a88c8e519a8c21fbae3fe65c1da6c8627fa057b50fd4123aa0f8`

This closes the reproduced projection-domain and Set-alias defects for the current fixed source/profile. It does not extend the earlier proof to legacy hidden-affinity recovery, cross-version migration, every possible native alias, whole-application startup restoration, or long-term learning quality.
