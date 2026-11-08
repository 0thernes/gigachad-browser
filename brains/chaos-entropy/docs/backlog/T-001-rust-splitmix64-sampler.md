# T-001 — Rust splitmix64 seeded sampler

**Column:** Done | **Priority:** High | **Estimate:** M (1–3 days)
**Status (2026-06-12):** SHIPPED — splitmix64 was already in place; this commit
closes the documented TODO by replacing all `% n` modulo reductions with
Lemire's unbiased multiply-shift `((raw as u128 * n as u128) >> 64) as u32`.
Two new unit tests added: `lemire_reduce_bounds_many_seeds` (10 000 seeds, all
axes in-bounds) and `lemire_reduce_near_uniform_small_n` (70 000 draws, n=7,
±50 % bucket tolerance). `cargo check` and `cargo clippy -D warnings` green.

## Context

The Python PoC uses `random.Random(seed)` (Mersenne Twister) for parameter
draws. The Rust core is its own engine version and will use splitmix64 — a
counter-based, branch-free, zero-allocation generator that maps a `u64` seed
directly to a sequence of pseudo-random u64s in ~2 ns/call. This unlocks the
planned `core/` fast path without incurring the Python/Pillow overhead.

Per `docs/ARCHITECTURE.md`: "The Rust core will use a counter-based generator
(splitmix64 over `seed`) so `sample()` is branch-free and O(1) with zero
allocation." The draw order (glyph → font → size → rotation → fg → bg → noise)
must be documented and frozen — changing it is an engine version bump.

## Acceptance Criteria

- [ ] `SeedSpace::sample(seed: u64) -> GlyphParams` implemented in `core/src/lib.rs`
      using splitmix64 with the draw order matching ARCHITECTURE.md.
- [ ] `cargo test` includes a unit test confirming the same seed returns the
      same `GlyphParams` on repeated calls.
- [ ] A cross-seed smoke test confirms 5 seeds produce 5 distinct `GlyphParams`
      structs (mirrors `test_different_seeds_differ` in the Python suite).
- [ ] Draw order is documented in a docstring and in an updated ADR or
      `docs/ARCHITECTURE.md` note.
- [ ] No new crate dependencies — splitmix64 is implementable in ~10 lines of
      `std`-only Rust.

## Definition of Done

- `cargo check --all-targets` passes.
- `cargo test` green.
- `docs/ARCHITECTURE.md` updated with the Rust sampler's draw order and RNG spec.

## Estimate

M — approximately 1 day for the implementation + tests; 0.5 days for docs update.

## Dependencies

None (this is the foundation block for T-008 Rust SIMD raster path).
