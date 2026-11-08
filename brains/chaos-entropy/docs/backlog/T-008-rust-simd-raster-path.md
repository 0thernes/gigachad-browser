# T-008 — Rust SIMD raster path (tiny-skia / ab_glyph, rayon)

**Column:** Backlog | **Priority:** Medium | **Estimate:** XL (> 1 week)

## Context

The Python/Pillow PoC benchmarks at 90.4 img/s single-core. The bottleneck
breakdown (from `docs/THROUGHPUT.md`) is: raster+augmentation ~8.4 ms/img
(Python/Pillow bicubic rotate), PNG encode ~2.6 ms/img. The Rust fast path
removes the Python interpreter overhead and replaces Pillow's generalized
bicubic with a path-specific rasterizer.

Projected: "Rust rewrite (5–20×/core): 450–1,800 img/s/core before threading."
With rayon parallelism across all cores, the 10,000 img/s aggregate target for
Phase 2 (v1) becomes achievable on a 16-core machine.

This is the Rust core's first functional milestone beyond the skeleton.

## Acceptance Criteria

- [ ] `core/` implements `render_batch(seeds: &[u64], canvas: u32) -> Vec<Vec<u8>>`
      (PNG bytes per seed) using a rasterization crate (`tiny-skia` or `ab_glyph`).
- [ ] Rayon parallel iterator over the seed slice (`seeds.par_iter()`).
- [ ] Determinism contract: `render_batch(&[seed], canvas)` returns the same bytes
      on repeated calls and on two different machines (same OS). Cross-language
      byte-identity with the Python PoC is explicitly a non-goal (see ADR).
- [ ] `cargo test` includes determinism tests mirroring `tests/test_determinism.py`.
- [ ] The binary `ceae` supports `--benchmark --count N` and prints a comparable
      `imgs/sec` line to the Python PoC's format.
- [ ] Benchmark shows ≥ 10,000 img/s aggregate at 256px on the dev workstation
      using all available cores; result committed to `docs/benchmarks/`.
- [ ] An ADR documents the rasterization crate choice (tiny-skia vs ab_glyph vs
      other) and any deviations from the Python reference renderer.

## Definition of Done

- `cargo check --all-targets` and `cargo test` pass.
- Benchmark record committed in `docs/benchmarks/rust-path-YYYYMMDD.txt`.
- `README.md` v1 milestone row updated with the measured throughput.
- `docs/ARCHITECTURE.md` Stage 3 CPU-fast-path section updated.

## Estimate

XL — selecting the rasterization crate, handling glyph-table font loading in
pure Rust, and meeting the determinism contract across machines is non-trivial.
Budget 2–3 weeks for initial working implementation + benchmarks.

## Dependencies

T-001 (Rust splitmix64 sampler) must be complete — the sampler is the foundation
the raster path calls.
