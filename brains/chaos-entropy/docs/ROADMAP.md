# Roadmap

Three phases. Each phase has explicit acceptance criteria — a phase is done when every
criterion is demonstrably true, not when the code "feels ready".

---

## Phase 0 — PoC (complete)

**Goal:** prove the two load-bearing claims: (a) seed → byte-identical image on any run,
(b) procedural raster beats the 11.6 img/s target with large margin on CPU alone.

**Scope shipped:**

- `poc/glyph_engine.py` — single-file Pillow renderer, CLI + benchmark mode.
- `poc/logging_config.py` — structured JSON logger, `emit_run_manifest` event.
- `--stride N` lattice sampling; `--manifest` / `--from-manifest` seed-manifest IO.
- `tests/test_determinism.py` — byte-identity across repeated renders and process runs (5 tests).
- `tests/test_manifest.py` — manifest round-trip: write → re-render → byte-identical (5 tests).
- `tests/test_sampler_uniformity.py` — all axes span full range; bucket counts within tolerance (3 tests).
- `core/` Rust skeleton: `splitmix64`, Lemire unbiased reduction, `SeedSpace::sample()`; CI-gated.
- Design docs: ARCHITECTURE, THROUGHPUT, ROADMAP, ERD, COMPLEXITY, AESTHETIC-LINEAGE, AUDIT-500.
- ADR process, KANBAN board, backlog cards (T-001 through T-020).

**Acceptance criteria:**

- [x] `pytest -q tests` green — **13/13 passed** (2026-06-12).
- [x] `--benchmark` reports ≥ 50 img/s at 256px, single process — **measured 90.4 img/s** (7.8× target).
- [x] Same `--seed --count` twice produces byte-identical output (`test_cli_two_runs_byte_identical`).
- [x] Manifest round-trip byte-identical for both sequential and strided seeds.
- [x] Rust CI gate green: `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test`.
- [x] 500-point audit complete; gap map and Top 10 findings documented in `docs/AUDIT-500.md`.
- [ ] Zero hidden entropy: independent external code review confirms all variation flows from the seed (self-review done; external pass is T-012, currently in Ready).

---

## Phase 1 — MVP

**Goal:** 1M materialized images in under 2 hours wall clock on the single-workstation target
(16-core-class CPU; RTX 5070 Ti unused), plus a fully-verified manifest that makes pixels
optional and verifiable.

**Scope:**

- Multiprocess pipeline (T-003): seed-range partitioning across N workers, sharded sinks.
- Sharded sink (T-005): directories of 10k files; optional tar/WebDataset shards.
- Manifest v1 (T-004, completion): class-based API; `space_hash` computation (T-019);
  `picks` field; multi-range JSON Lines format; `seed_start` as hex string (T-016).
- Golden-seed digest test (T-002): SHA-256 of 100 canonical seeds' PNGs pinned in-repo
  to catch dependency drift (a Pillow upgrade that changes resampling must fail CI).
- Resume-after-crash (T-006): re-running a range is idempotent; uses write-to-temp-then-rename
  for atomic PNG writes.
- Input guards (T-017): `--max-count` / `--max-disk-gb` to prevent accidental disk exhaustion.
- Requirements exact-hash pinning (T-018): `requirements-lock.txt` with `--require-hashes`
  for supply-chain integrity on CI.

**Acceptance criteria:**

- [ ] 1,000,000 images at 256px written to NVMe in < 2 h wall clock (≥ 139 img/s aggregate),
      command and timing logged in `docs/benchmarks/` as a reproducible record.
- [ ] Manifest round-trip: write manifest → fresh checkout → re-render 1,000 sampled seeds →
      all byte-identical to originals.
- [ ] Golden-seed digests stable across two different machines (same OS class).
- [ ] `space_hash` is computed and verified; a consumer engine with a mismatched hash refuses
      to render.
- [ ] Kill a run at 50%; resume completes with zero duplicate or corrupt files.
- [ ] `--count 10_000_000_000` is rejected with a user-friendly error when disk space is
      insufficient (pre-flight estimate via `shutil.disk_usage`).
- [ ] `pip install -r requirements-lock.txt` uses `--require-hashes`; CI enforces this.

---

## Phase 2 — v1

**Goal:** the fast path and the product surface — Rust core, layered composition, seeds-only
delivery to a first external consumer.

**Scope:**

- `core/` implemented (T-008): splitmix64 sampler, CPU raster (tiny-skia or ab_glyph),
  rayon parallelism; Python bindings optional.
- GPU experiment (T-009): wgpu texture-atlas instanced rendering; exact-match contract vs
  CPU reference, or a separate engine-version namespace (per ARCHITECTURE decision).
- Layered composition axis (T-010): 2–5 glyph layers with per-layer transforms — pushes the
  parameter space beyond 10⁴⁰.
- Entropy ↔ Order bias parameter (T-014): `--bias` scalar sweeping the noise/order dual.
- Constraint-set sampler masks (T-015): named "banned vocabulary" masks restricting reachable
  regions of the parameter space (structural analog of 0thernes T2 negative-constraint stacking).
- Dataset API (T-013): `ceae render --manifest dataset.jsonl --out shards/` consumer tool.
- One design-partner integration: a real training run consuming a seeds-only dataset.

**Acceptance criteria:**

- [ ] Rust path ≥ 10,000 img/s aggregate at 256px on the dev workstation, benchmarked and
      recorded in `docs/benchmarks/`.
- [ ] Rust output byte-identical to its own determinism contract across two machines (Rust
      path has its own engine version; cross-language identity is explicitly a non-goal).
- [ ] A third party renders a sample from a published manifest and reproduces digests.
- [ ] One external training or evaluation pipeline consumes a seeds-only dataset end to end.

---

## Beyond v1 (unscheduled)

- Perceptual de-duplication tooling (stride/LSH) for "unique art" product claims.
- Additional generators sharing the seed/manifest contract: tilings, flow fields,
  reaction-diffusion — the manifest format is generator-agnostic by design.
- Windows CI runner (complement the existing `ubuntu-latest` runner) to close AUDIT-500
  gap 7-15.
- Hosted render farm and dataset marketplace (seeds are the SKU).
- Formal platform certification procedure for ARM64 macOS and other new render hosts.
