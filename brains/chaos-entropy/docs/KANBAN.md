# Kanban Board

## WIP limits

| Column | WIP limit | Rationale |
|---|---|---|
| Backlog | unlimited | Capture ideas freely; prioritize in Ready |
| Ready | 8 | Only pull items here once they have clear acceptance criteria |
| In Progress | 2 | Limit context-switching; this is a solo-founder project |
| In Review | 3 | Review lag is the bottleneck — keep small to surface it |
| Done | unlimited | Archive of shipped work |

**WIP-limit rationale:** for a solo contributor project with a strict determinism constraint,
the highest risk is starting too many threads at once and shipping a half-baked engine-version
bump. Keeping "In Progress" at 2 forces full completion before pulling new work. "In Review"
at 3 means external reviews do not pile up silently before blocking the next merge.

---

## Board

| ID | Title | Column | Priority | Estimate |
|---|---|---|---|---|
| T-001 | Rust splitmix64 seeded sampler + Lemire unbiased reduction | **Done** | High | M |
| T-002 | Golden-seed digest test (MVP CI gate) | Ready | High | S |
| T-003 | Multiprocess pipeline — seed-range partitioning | Backlog | High | L |
| T-004 | Manifest v1 writer + verifying reader | In Review | High | M |
| T-005 | Sharded sink writer (directories of 10k + tar/WebDataset) | Backlog | High | M |
| T-006 | Resume-after-crash (idempotent re-render) | Backlog | Medium | S |
| T-007 | 1M/24h validation run — record wall-clock proof | Backlog | Medium | S |
| T-008 | Rust SIMD raster path (tiny-skia / ab_glyph, rayon) | Backlog | Medium | XL |
| T-009 | GPU raster spike — wgpu texture-atlas instanced quads | Backlog | Low | XL |
| T-010 | Layered composition axis (2–5 glyph layers) | Backlog | Low | L |
| T-011 | Structured JSON logging via poc/logging_config.py | **Done** | Medium | S |
| T-012 | External code review: zero-hidden-entropy audit | Ready | High | S |
| T-013 | Dataset API CLI (ceae render --manifest) | Backlog | Low | M |
| T-014 | Entropy ↔ Order bias parameter (`--bias`) | Backlog | Medium | M |
| T-015 | Constraint-set "banned vocabulary" sampler masks | Backlog | Medium | M |
| T-016 | Fix seed JSON integer encoding (hex strings, AUDIT-500 2-19) | Ready | High | S |
| T-017 | Add `--max-count` / `--max-disk-gb` DoS guards (AUDIT-500 12-09, 13-11) | Backlog | High | S |
| T-018 | Pin requirements to exact hashes (`requirements-lock.txt`) | Backlog | High | S |
| T-019 | Implement `space_hash` computation in manifest writer | Backlog | High | M |
| T-020 | Docs: 500-point audit, ERD, COMPLEXITY, README/arch refresh | **Done** | High | L |

---

## Done (shipped items)

| ID | Title | Shipped in |
|---|---|---|
| T-001 | Rust splitmix64 sampler + Lemire reduction; Rust CI gate | v0.1.2 |
| T-011 | Structured JSON logging (`poc/logging_config.py`) | v0.1.0 |
| T-020 | 500-point audit (AUDIT-500.md), ERD.md, COMPLEXITY.md, README + ARCHITECTURE + KANBAN + ROADMAP refresh | v0.1.4 |
| — | `--stride` lattice sampling; manifest IO (`--manifest` / `--from-manifest`); sampler uniformity tests | v0.1.2 |
| — | Aesthetic lineage docs (AESTHETIC-LINEAGE.md); T-014/T-015 backlog cards | v0.1.1 |
| — | Repository scaffold; PoC renderer; determinism tests; ARCHITECTURE/THROUGHPUT/ROADMAP docs | v0.1.0 |

---

## Notes

- T-004 is In Review: the core storage-inversion capability is shipped (`--manifest` / `--from-manifest`
  round-trip, byte-identical). Remaining: class-based manifest API, `space_hash` computation,
  `picks` field, JSON Lines multi-range format.
- T-016 and T-019 are prerequisites for a fully-verifiable manifest (MVP phase).
- T-002 (golden-seed digest) is the key cross-machine reproducibility gate and should be
  completed before any claim of "verified cross-platform bit-identical" is made publicly.
- T-003 + T-005 + T-006 + T-007 together constitute the MVP milestone exit criteria.

Backlog card details: [docs/backlog/](backlog/)
