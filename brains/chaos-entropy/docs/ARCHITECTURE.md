# Architecture

## Core principle

The engine is a **pure function**: `render(engine_version, seed) → pixels`. Everything
else — pipelines, manifests, storage, distribution — is built on the consequences of
that purity:

1. **Identity.** A seed *is* an image. Two parties holding the same engine version and
   seed hold the same image, bit for bit, without transferring pixels.
2. **Storage inversion.** Datasets are seed sets, not pixel sets. A contiguous range of
   100 trillion images is `(engine_version, start_seed, count)` — under 32 bytes.
   Curated subsets cost 8 bytes per image. Pixels are a cache, never the source of truth.
3. **Trivial parallelism.** No shared state between seeds means render order, worker
   count, and machine boundaries are all irrelevant to output.

---

## Module boundaries

The engine has two engine-version namespaces, corresponding to two separate implementation
layers. They share the same conceptual combinatoric space and the same manifest format but
do not cross-produce byte-identical output (they are deliberately separate engine versions).

### Python PoC (`poc/`) — engine version `ceae-poc/0.1.0`

| File | Role |
|---|---|
| `poc/glyph_engine.py` | Seeded sampler, rasterizer (Pillow), augmentation (NumPy), PNG encode, manifest IO, benchmark, CLI |
| `poc/logging_config.py` | Structured JSON logger; `emit_run_manifest` event |
| `poc/requirements.txt` | Runtime pins: `pillow>=10.1`, `numpy>=1.26` |

The Python PoC is the **canonical reference renderer**. It owns the determinism contract
and is the authority on what a given seed produces. The test suite (13 tests green) validates
byte-identical output across process runs and manifest round-trips.

**RNG stack (Python PoC):**
- Parameters: `random.Random(seed)` — Mersenne Twister (MT19937), CPython-specified,
  cross-platform identical for a given CPython version.
- Noise: `numpy.random.default_rng(seed ^ NOISE_SALT)` — PCG64, NumPy-specified,
  fully deterministic across platforms.
- Draw order (fixed, documented, part of the engine version): glyph → font → size →
  rotation → fg color → bg color → noise level.

### Rust core (`core/`) — engine version `ceae-core/0.1.0` (future)

| File | Role |
|---|---|
| `core/src/lib.rs` | `SeedSpace` struct, `splitmix64` counter-based RNG, Lemire unbiased reduction, `sample()` |
| `core/src/main.rs` | CLI stub (future fast-path entry point) |
| `core/Cargo.toml` | Zero external dependencies by design |

The Rust core targets ≥ 10,000 img/s aggregate on the dev workstation. It uses
`splitmix64` (Steele/Lea/Flood constants) instead of MT19937 — a separate engine version
namespace. Cross-language byte-identity is explicitly a non-goal (see ADR backlog). The
Rust path must satisfy its own determinism contract across two machines independently.

**RNG stack (Rust core):**
- Parameters: `splitmix64` counter-based generator — O(1), branch-free, zero allocation.
- Bias correction: Lemire multiply-shift reduction replaces all `% n` modulo operations.
  Formula: `((splitmix64(&mut state) as u128 * n as u128) >> 64) as u32`. Bias: < 1 / 2⁶⁴.
- Same draw order as the Python PoC (documented in `lib.rs` docstring).

**CI gate (Rust):** `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test` run
on every push via `.github/workflows/ci.yml` `rust-core` job.

---

## Pipeline stages

```
[1] combinatoric space definition
        │   axes + cardinalities, versioned (any change = new engine version)
        ▼
[2] deterministic seeded sampler
        │   u64 seed → RenderParams via counter-based RNG (no global state)
        ▼
[3] rasterizer
        │   CPU path (Pillow / Rust+tiny-skia)   GPU path (wgpu instanced quads)
        ▼
[4] augmentation
        │   seeded noise, blur, jitter — same determinism contract as [3]
        ▼
[5] sink / sharding
            PNG files | tar/WebDataset shards | manifest-only (seeds, no pixels)
```

### Stage 1 — Combinatoric space definition

The space is the cross product of declared axes. PoC axes and cardinalities:

| Axis | Cardinality | Encoding |
|---|---|---|
| glyph | ~10,000 codepoints (curated printable set; PoC: 518) | index into frozen glyph table |
| font | up to 50 families | index into frozen font table |
| size | 32 steps (12–200 px) | linear lattice |
| rotation | 360 (1° steps) | integer degrees |
| fg color | 2²⁰ ≈ 1.05 M | HSV lattice: 256 hues × 64 sat × 64 val |
| bg color | 2²⁰ ≈ 1.05 M | HSV lattice (re-rolled if ΔE to fg too small) |
| noise | 16 levels | linear lattice |

Total PoC cardinality: 518 × 50 × 32 × 360 × 2²⁰ × 2²⁰ × 16 ≈ **3.3 × 10²¹** distinct images.

The axis tables (glyph list, font list, lattice formulas, draw order, PNG encode parameters)
are all part of the engine version. **Changing any table is a breaking change** and mandates
a version bump — this is what makes "seed = identity" honest across time.

The `space_hash` field in a manifest is a SHA-256 of the axis tables; a consumer engine
refuses to render if its computed hash differs from the manifest's value, preventing silent
dataset drift. (Current status: `space_hash` is stubbed as `"sha256:pending"` — T-002 and
class-based manifest API are the planned gates.)

### Stage 2 — Deterministic seeded sampler

- Input: `u64` seed. Output: fully-populated `RenderParams` struct.
- The PoC uses `random.Random(seed)` (MT19937 — stable, specified, identical across CPython
  platforms) plus `numpy.random.default_rng(seed)` (PCG64, also specified) for array noise.
- The Rust core uses `splitmix64` so `sample()` is branch-free and O(1) with zero allocation.
- The sampler must consume randomness in a **fixed documented order** (glyph, font, size,
  rotation, fg, bg, noise). Reordering draws changes every image — version bump required.
- **Stride sampling (`--stride N`):** `seeds[i] = (base + i * stride) & MASK_U64`. Stride
  spaces seeds far apart in the u64 space (recommended: large primes), reducing correlation
  between adjacent renders in a batch.

### Stage 3 — Rasterizer

**CPU path (PoC, `poc/glyph_engine.py`):** Pillow draws the glyph onto an oversized
transparent layer (side = canvas + canvas//2, to avoid clipping at large rotations),
rotates it with bicubic resampling, and composites over the background color. Measured:
**90.4 img/s at 256 px on one core** — 7.8× the 11.6 img/s target before any parallelism.

**CPU fast path (planned, `core/`):** Rust + rasterization crate (tiny-skia or ab_glyph),
rayon parallelism across cores, no GIL, no per-image interpreter overhead. Expected 5–20×
per-core over Pillow, yielding ≥ 10,000 img/s aggregate.

**GPU path (planned, v1):** Glyphs pre-rendered once into a texture atlas per font; each
image is one instanced textured quad with per-instance rotation/scale/color uniforms; wgpu
renders thousands of images per batch into a tiled render target. Raster ceases to be the
bottleneck — encode and I/O dominate, which is exactly why the manifest-only sink exists.

**GPU determinism caveat:** GPU floating-point behavior varies by vendor. The GPU path will
either use only integer lattice coordinates (guaranteeing exact cross-vendor match) or ship
under its own engine-version namespace (non-matching output is expected and documented).
The CPU path remains the canonical reference.

### Stage 4 — Augmentation

Seeded Gaussian noise (NumPy, vectorized) in the PoC; blur/jitter/elastic deformation
planned. Rule: augmentation draws come from the same seeded stream, *after* the raster draws,
so adding a new optional augmentation at the end of the draw order can be non-breaking when
disabled.

### Stage 5 — Sink / sharding

| Mode | Description | Status |
|---|---|---|
| **Files** | One PNG per seed, named `<seed:016x>.png`, sharded into directories of 10k | PoC: flat dir; sharding is T-005 |
| **Shards** | tar archives of 10k images (WebDataset-compatible) for training pipelines | Planned (T-005) |
| **Manifest-only** | Ship seeds only; consumers render lazily — flagship mode | Shipped (`--manifest` / `--from-manifest`) |

---

## Determinism contract

**Contract:** given the same `ENGINE_VERSION` string and the same `u64` seed, the output
PNG bytes must be bit-for-bit identical on any machine, now and in the future.

**What the contract covers:**

1. `random.Random(seed)` draw order (fixed: glyph, font, size, rotation, fg, bg, noise).
2. PNG encode parameters: `compress_level=1, optimize=False` (part of the engine version).
3. Axis tables: frozen `_GLYPH_RANGES`, `_FONT_CANDIDATES`, HSV lattice formulas.
4. FreeType version: Pillow bundles FreeType; a Pillow upgrade that changes its bundled
   FreeType version is a breaking change requiring a version bump.
5. NumPy PCG64 for noise (specified behavior since NumPy 1.17).

**What can break the contract (= engine version bump):**

- Reordering or adding RNG draws in `sample_params`.
- Changing any axis table (glyph list, font list, lattice formula, cardinality).
- Changing `compress_level` or `optimize` in `encode_png`.
- Upgrading Pillow to a version that changes bicubic resampling behavior or FreeType.
- Changing the `NOISE_SALT` constant.

**CI enforcement:** `tests/test_determinism.py` verifies byte-identity within a process
run (5 tests). The planned T-002 golden-seed digest test (`tests/fixtures/golden_digests.json`)
will catch cross-machine drift and dependency upgrades automatically.

---

## Generation vs. materialization architecture

The engine cleanly separates two modes:

**Generation (manifest mode):** The engine records `(engine_version, seed_start, count, stride, canvas)`
as a JSON record — a complete specification of any dataset in O(1) bytes. No pixels are written.
100 trillion images = one 32-byte manifest entry. The manifest is the dataset.

**Materialization (render mode):** The engine reads a manifest and renders exactly the
specified seeds to PNG files. The materialization is idempotent — re-rendering the same seed
range always produces the same files; a crashed run can resume safely.

This architecture separates *curation* from *storage*. A curator selects seeds by taste (the
`picks` field in a manifest holds individual 8-byte seeds); the consumer decides whether to
materialize pixels or re-render on demand. Pixels are never the source of truth.

The manifest format (v1 draft):

```json
{"schema": "ceae-manifest/1", "engine": "ceae-core 0.1.0", "space_hash": "sha256:<hash>",
 "size": 256, "ranges": [{"start": "0x0000000000000000", "count": 100000000000000}],
 "picks": ["0x00000000deadbeef", "0x0000000000c0ffee"],
 "created": "2026-06-12", "license": "MIT"}
```

Note: seed values should be hex-string encoded (not plain JSON integers) to avoid
IEEE-754 double precision loss for seeds near 2⁶³. The current PoC uses plain integers
(a known gap: AUDIT-500 item 2-19).

---

## Throughput budget (per image, 256×256 RGB, single CPU core)

Target: 1M / 24 h = 11.6 img/s sustained ⇒ a budget of **86 ms/image**.

| Stage | Budget | Measured (Python PoC) | Expected (Rust core) | Notes |
|---|---|---|---|---|
| sample (seed→params) | 1 ms | ~9 µs | ~20 ns | negligible by design |
| raster + augmentation | 55 ms | ~8.4 ms | 0.2–0.6 ms | glyph draw + bicubic rotate + composite + noise |
| encode (PNG) | 20 ms | ~2.6 ms | 0.5 ms | skipped entirely in manifest-only mode |
| sink (write, amortized) | 10 ms | ~0.3 ms | ~0.3 ms | sequential writes, sharded dirs |
| **Total** | **86 ms** | **11.1 ms (90.4 img/s)** | **< 1.5 ms** | **7.8× margin single core, measured** |

Full first-principles derivation: [THROUGHPUT.md](THROUGHPUT.md).
Big-O analysis per function: [COMPLEXITY.md](COMPLEXITY.md).

---

## GPU vs CPU raster paths — decision rationale

| Criterion | CPU (Pillow → Rust) | GPU (wgpu atlas) |
|---|---|---|
| imgs/sec @ 256px | 10²–10³ per core | 10⁵–10⁶ per batch |
| Determinism | exact, easy | requires care: fixed driver-independent sampling math, integer atlas coords, no fp blending variance across vendors |
| Portability | everywhere | needs Vulkan/DX12/Metal |
| Where it bottlenecks | raster | encode + PCIe readback |

**Decision:** CPU is the canonical reference renderer (determinism is the product; GPU float
behavior varies by vendor). The GPU path is an *accelerator* whose output must match the
reference within an exact-match contract on integer color lattices — if exactness across
vendors proves impractical, GPU output gets its own engine-version namespace. The 1M/day
target never depends on the GPU; the RTX 5070 Ti is upside.

---

## Dataset manifest format (v1 draft)

JSON Lines; one record per seed range. Seed = reproducible image identity, so the
manifest **is** the dataset:

- `space_hash` pins the axis tables; a consumer refuses to render if their engine's
  hash differs (prevents silent dataset drift).
- `ranges` express bulk data in O(1) bytes; `picks` hold curated / 8-byte-per-image sets.
- 100 trillion images ⇒ one `ranges` entry. The same dataset as PNGs would be ~800 PB.

---

## Aesthetic axes → parameter space

The engine's combinatoric axes are not arbitrary — they are grounded in the documented
practice of artist 0thernes, whose published entropy prompts (CC-licensed corpus at
github.com/0thernes-L-L-C/Prompt-Improvisation) are the conceptual ancestors of this
engine. Full lineage: [AESTHETIC-LINEAGE.md](AESTHETIC-LINEAGE.md).

| Aesthetic axis (0thernes practice) | Engine parameter |
|---|---|
| Entropy ↔ Order dual (T7 inverse) | `noise` level; planned `entropy_order_bias` (T-014) |
| Decentralization / no center point | `placement` axis — offset / tiled / uniform |
| Banned-vocabulary constraint sets (T2) | Named sampler masks on axis tables (T-015) |
| Kakeya / all-orientations framing | `rotation` axis — all 360 steps present in space |
| Curator model (generate at scale, select by taste) | Manifest `picks` field = curation ledger |

The sampler mask mechanism (T-015) is the structural analog of 0thernes's negative-constraint
stacking: rather than banning tokens in a diffusion model's decode path, a mask restricts
which regions of the parameter space are reachable from a given seed, without post-render
rejection, preserving the determinism contract.

---

## Failure & integrity model

- Renders are idempotent: a crashed run resumes by re-rendering the same seed range.
- Shards carry a checksum of `(engine version, seed list)`; pixel checksums optional
  since pixels are derivable.
- CI runs the determinism test on every push; a golden-seed digest test (T-002) is added
  at MVP to catch dependency-version drift (e.g., a Pillow upgrade changing rotation
  resampling — which would mandate an engine version bump).

---

## Cross-references

| Document | What it adds |
|---|---|
| [ERD.md](ERD.md) | Entity-relationship diagram, conceptual ERM with five invariants, pipeline sequence diagrams, re-roll state machine |
| [COMPLEXITY.md](COMPLEXITY.md) | Big-O time and space per function; constant-factor table at 256 px; throughput projection ladder |
| [AUDIT-500.md](AUDIT-500.md) | 500-point deep inspection; gap map identifying open risks in this design |
| [THROUGHPUT.md](THROUGHPUT.md) | Detailed per-stage time budget from first principles |
