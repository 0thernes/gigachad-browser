# ADR 0001: Record architecture decisions

- Status: accepted
- Date: 2026-06-11
- Deciders: 0thernes

## Context

This project's value rests on a small number of sharp, easily-eroded invariants —
chiefly that `(engine_version, seed)` identifies an image bit-for-bit, forever. Such
invariants die by a thousand well-meaning cuts: a dependency upgrade that changes
resampling, a "harmless" reordering of RNG draws, a GPU path that is *almost* exact.
A solo-founder codebase headed toward external contributors and investor diligence
needs the reasoning behind these constraints written down where the code lives.

## Decision

We record significant architecture decisions as Architecture Decision Records (ADRs)
in `docs/adr/`, following Michael Nygard's format: **Context, Decision, Consequences**,
plus Status and Date. Files are named `NNNN-short-title.md` with a monotonically
increasing number. ADRs are immutable once accepted; a change of mind produces a new
ADR that supersedes the old one (the old ADR's status becomes "superseded by NNNN").

A change requires an ADR when it (a) alters the determinism contract or draw order,
(b) adds a dependency to `core/`, (c) changes the manifest schema, or (d) commits us
to a platform (GPU API, OS, distribution channel).

## Consequences

- Design rationale survives context loss (future contributors, future self, diligence).
- Breaking-change discipline gets a paper trail: every engine-version bump should be
  traceable to an ADR or a CHANGELOG entry.
- Slight overhead per significant decision — acceptable; trivial decisions explicitly
  do not need ADRs.

## Decisions already implied by the scaffold (to be formalized as ADRs when touched)

- 0002 (anticipated): CPU renderer is the canonical reference; GPU output must be
  exact-match or live in its own engine-version namespace.
- 0003 (anticipated): Python PoC and Rust core are **separate engine versions**;
  cross-language byte-identity is a non-goal.
- 0004 (anticipated): manifest schema v1 (`ceae-manifest/1`) field semantics.
