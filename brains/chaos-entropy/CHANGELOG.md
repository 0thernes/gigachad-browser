# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.5] - 2026-06-12

### Changed
- `README.md`: extensive rewrite to professional/VC/academic grade. Added: thesis
  statement and problem/solution framing; seed-manifest storage inversion as the
  headline insight; expanded quickstart with `--stride`, `--manifest`, `--from-manifest`,
  and benchmark examples; full Mermaid pipeline diagram; module-boundary table; expanded
  throughput table (measured + projected rows); complete documentation index linking all
  13 docs including AUDIT-500, ERD, COMPLEXITY, THROUGHPUT, AESTHETIC-LINEAGE, AUDIT,
  TESTING, OBSERVABILITY, SECURITY-NOTES, ROADMAP, FAQ; roadmap table reflecting that
  Lemire/stride/manifest/Rust-CI have landed; license/provenance section. Precise
  headings and tables throughout; no prose bloat.
- `docs/ARCHITECTURE.md`: deepened significantly. New sections: module boundaries
  (Python PoC vs Rust core as separate engine versions, with RNG stack detail for each);
  determinism contract (what is covered, what constitutes a breaking change, CI
  enforcement); generation-vs-materialization architecture (manifest mode vs render mode);
  Stage 5 sink/sharding table with status column; Stage 3 rasterizer expanded with GPU
  determinism caveat; explicit note on hex-string seed encoding gap; updated throughput
  budget table; cross-reference table to ERD/COMPLEXITY/AUDIT-500/THROUGHPUT.
- `docs/KANBAN.md`: refreshed to reflect all shipped work. T-001 and T-011 explicitly
  moved to Done with version tags. T-020 added as Done (this documentation pass). Four
  new items added: T-016 (hex seed encoding fix, AUDIT-500 2-19), T-017 (DoS guards,
  AUDIT-500 12-09/13-11), T-018 (requirements hash-pinning), T-019 (space_hash
  computation). Done section added with shipping version annotations. Notes section added
  explaining T-004 In Review status and MVP prerequisites.
- `docs/ROADMAP.md`: Phase 0 marked complete with full scope-shipped list (stride,
  manifest IO, Rust CI, 500-point audit, ERD, COMPLEXITY all listed). Phase 1 scope
  expanded with T-016/T-017/T-018/T-019 as explicit deliverables. Phase 1 acceptance
  criteria added for `space_hash` verification and disk-space guard. Phase 2 expanded
  with T-014/T-015 in scope. Beyond-v1 section added Windows CI runner and formal
  platform certification items from AUDIT-500.

### Verified
- `python -m pytest tests/ -q`: 13 passed (no production code modified).
- All four updated documents are consistent with each other and with the current HEAD
  codebase state as documented in AUDIT-500.md.

## [0.1.4] - 2026-06-12

### Added
- `docs/ERD.md`: Entity-Relationship Diagram (Mermaid `erDiagram`) covering
  entities `ENGINE_VERSION`, `SEED_SPACE`, `FONT_SET`, `GLYPH_PARAMS`,
  `IMAGE_PNG`, `MANIFEST_RANGE`, and `RUN_MANIFEST` with attributes and
  crow's-foot cardinality relationships. Includes conceptual ERM section
  (composite PK identity, storage-inversion identity, five invariants) and
  ERP process diagrams: `sequenceDiagram` for the full render pipeline
  (`seed -> params -> raster -> rotate -> composite -> noise -> encode -> sink`),
  `sequenceDiagram` for the generate-vs-materialize CLI flow, and
  `stateDiagram-v2` for the bounded contrast re-roll (8-attempt deterministic
  state machine).
- `docs/COMPLEXITY.md`: Big-O time and space analysis per function and per hot
  path. Covers `splitmix64`, `lemire_reduce`, `SeedSpace::sample` (all O(1));
  `render` stages (all O(N²), with constant-factor breakdown at 256 px);
  `encode_png` O(B) ⊆ O(N²); `build_seeds` O(count); `write/read_manifest`
  O(1). Includes per-image space table (peak ~2.4 MB working set at 256 px),
  Rust-vs-Python constant-factor comparison, and a throughput projection ladder
  (1 Python core → 16 Rust cores → GPU raster → manifest-only sink) that
  cross-links THROUGHPUT.md without duplicating it.
- `README.md`: Architecture Overview paragraph now links `docs/ERD.md` and
  `docs/COMPLEXITY.md`; Quality & Audit table gains two new rows for both docs.

### Verified
- `python -m pytest tests/ -q`: 13 passed (no production code modified).
- New docs are Mermaid-valid (diagrams checked by syntax review against the
  Mermaid erDiagram / sequenceDiagram / stateDiagram-v2 specs).

## [0.1.3] - 2026-06-12

### Added
- `docs/AUDIT-500.md`: 500-point / 25-section deep inspection grounded in the
  actual source files. 25 sections × 20 concrete, checkable, repo-specific items
  each; `[x]` where satisfied (citing the file), `[ ]` where a gap (with severity).
  Ends with a per-section score table (X/20), overall score (248/500), and a
  prioritized Top 10 findings list. Sources read on 2026-06-12 at HEAD [0.1.2].
- `docs/AUDIT.md`: cross-link paragraph pointing to `docs/AUDIT-500.md`.
- `README.md` Quality & Audit table: new row for `docs/AUDIT-500.md`.

### Verified
- `python -m pytest tests/ -q`: 13 passed (unchanged; no production code modified).
- `docs/AUDIT-500.md` overall score: **248 / 500**. Top gap areas: manifest
  schema drift (10-11), missing golden-seed digest fixture (7-11 / 15-11),
  `--count` unbounded DoS (13-11), requirements not hash-pinned (14-10),
  structured logging not wired into render path (23-09).

## [0.1.2] - 2026-06-12

### Added
- `poc/glyph_engine.py`: `--stride N` CLI option (default 1) for lattice sampling
  (THROUGHPUT §6). `seeds[i] = (base + i*stride) & MASK_U64`. Single-seed output
  bytes are unchanged when stride=1 — determinism contract preserved.
- `poc/glyph_engine.py`: `build_seeds(seed_start, count, stride)` helper extracted
  as a reusable public function.
- `poc/glyph_engine.py`: seed-manifest IO (THROUGHPUT §5 storage inversion):
  - `write_manifest(path, *, engine_version, seed_start, count, stride, canvas)`
    writes a stdlib-`json` range record — 32 bytes representing any seed range.
  - `read_manifest(path)` reads it back.
  - `--manifest PATH` CLI flag writes the manifest (skips PNG output).
  - `--from-manifest PATH` CLI flag re-renders exactly from a manifest.
- `tests/test_sampler_uniformity.py`: sampler uniformity/bias tests — stride and
  sequential seeds; asserts every axis spans its full range and coarse bucket
  counts stay within a 4× tolerance band.
- `tests/test_manifest.py`: manifest round-trip tests — write manifest, re-render
  via `--from-manifest`, assert byte-identical to direct render for both
  sequential (stride=1) and strided seeds. Also tests `--stride 1` is byte-for-byte
  identical to the pre-stride default.
- `core/src/lib.rs`: Lemire's unbiased multiply-shift reduction replaces all `% n`
  modulo reductions in `SeedSpace::sample()`. Formula:
  `((splitmix64(&mut state) as u128 * n as u128) >> 64) as u32`. Closes the
  documented TODO; removes modulo bias and the integer division. New unit tests:
  `lemire_reduce_bounds_many_seeds` (10 000 seeds, all axes in-bounds) and
  `lemire_reduce_near_uniform_small_n` (70 000 draws at n=7, ±50% tolerance).
- `.github/workflows/ci.yml`: new `rust-core` CI job — `dtolnay/rust-toolchain@stable`
  with `rustfmt` + `clippy` components; runs `cargo fmt --check`,
  `cargo clippy -- -D warnings`, and `cargo test`, all via
  `--manifest-path core/Cargo.toml`. Closes the CI gap (Rust core was previously
  not built or tested in CI).

### Changed
- `docs/backlog/T-001-rust-splitmix64-sampler.md`: status updated to Done.
- `docs/backlog/T-004-manifest-v1-writer-reader.md`: status updated to In Review
  (core storage-inversion capability shipped; class-based API + space_hash
  verification remain for a follow-up).
- `docs/KANBAN.md`: T-001 moved to Done, T-004 moved to In Review.

### Verified
- `python -m pytest tests/ -q`: 13 passed (includes 5 determinism, 3 uniformity,
  5 manifest round-trip tests).
- `python poc/glyph_engine.py --benchmark --count 200 --size 128`:
  215.6 imgs/sec (projects to 18.6 M imgs/day on one core).
- `cargo check --manifest-path core/Cargo.toml`: clean.
- `cargo clippy --manifest-path core/Cargo.toml -- -D warnings`: clean.
- Note: `cargo test` links correctly on Linux CI; on this Windows host the MSVC
  linker's `@`-file argument expansion fails on the `[ ]` brackets in the repo
  path (pre-existing infrastructure issue unrelated to this commit's code).

## [0.1.1] - 2026-06-12

### Added
- `docs/AESTHETIC-LINEAGE.md`: grounds the engine in the documented entropy practice of
  artist 0thernes — maps his aesthetic axes (entropy/order dual, decentralization/no
  center point, banned-vocabulary constraint sets, Kakeya/all-orientations framing,
  game-theory move model, curator model) to engine parameters and sampler-space
  dimensions. Includes two verbatim excerpts from the CC-licensed prompt corpus with
  attribution.
- `docs/backlog/T-014-entropy-order-bias-parameter.md`: backlog card for a dedicated
  `entropy_order_bias` scalar parameter sweeping the entropy ↔ order axis.
- `docs/backlog/T-015-banned-vocabulary-sampler-masks.md`: backlog card for named
  constraint-set sampler masks (analog of T2 negative-constraint stacking in the
  0thernes prompting technique taxonomy).

### Changed
- `docs/ARCHITECTURE.md`: added "Aesthetic axes → parameter space" subsection with
  summary mapping table, cross-linking `AESTHETIC-LINEAGE.md`.
- `README.md`: added "Aesthetic Lineage" paragraph under Architecture Overview.
- `docs/KANBAN.md`: added T-014 and T-015 to backlog.

### Planned
- Multiprocess render pipeline (MVP phase).
- Dataset manifest v1 writer/reader.
- Rust fast-path implementation behind the `core/` skeleton.

## [0.1.0] - 2026-06-11

### Added
- Repository scaffold: README, LICENSE (MIT), CONTRIBUTING, SECURITY, CI workflow.
- `poc/glyph_engine.py`: deterministic seeded glyph renderer (Pillow + NumPy) with
  CLI (`--count`, `--seed`, `--out`, `--size`) and `--benchmark` mode reporting imgs/sec.
- `core/`: Rust skeleton for the future fast path (`SeedSpace`, `sample()` stub, minimal CLI).
- `tests/test_determinism.py`: same seed must produce byte-identical PNG output.
- Design documentation: `docs/ARCHITECTURE.md`, `docs/THROUGHPUT.md`, `docs/ROADMAP.md`,
  ADR 0001 (record architecture decisions).
