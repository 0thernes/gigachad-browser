# AUDIT-500 — 500-Point / 25-Section Deep Inspection

**Project:** Chaos Entropy Art Engine (CEAE)
**Auditor:** Claude Sonnet 4.6 (automated deep inspection)
**Date:** 2026-06-12
**Commit HEAD at audit time:** see CHANGELOG.md [0.1.2]
**Sources read:** `poc/glyph_engine.py`, `poc/logging_config.py`, `poc/requirements.txt`,
`core/src/lib.rs`, `core/src/main.rs`, `core/Cargo.toml`,
`tests/test_determinism.py`, `tests/test_manifest.py`, `tests/test_sampler_uniformity.py`,
`docs/ARCHITECTURE.md`, `docs/THROUGHPUT.md`, `docs/TESTING.md`, `docs/OBSERVABILITY.md`,
`docs/SECURITY-NOTES.md`, `docs/ROADMAP.md`, `docs/KANBAN.md`, `docs/AUDIT.md`,
`docs/FAQ.md`, `docs/AESTHETIC-LINEAGE.md`, `docs/adr/0001-…md`,
`docs/backlog/T-001…T-015`, `.github/workflows/ci.yml`, `.github/workflows/codeql.yml`,
`.github/workflows/links.yml`, `.github/dependabot.yml`, `.github/CODEOWNERS`,
`.pre-commit-config.yaml`, `.gitattributes`, `Makefile`, `README.md`, `CHANGELOG.md`,
`CONTRIBUTING.md`, `SECURITY.md`, `LICENSE`

**Severity legend used in gap notes:** CRITICAL · HIGH · MEDIUM · LOW · INFO

---

## Section 1 — Correctness & the Determinism Contract

- [x] **1-01** `ENGINE_VERSION = "ceae-poc/0.1.0"` is defined as a module-level constant in `poc/glyph_engine.py` (line 29) and is the sole version token written into manifests and printed to stdout — no divergent string elsewhere in the PoC path.
- [x] **1-02** `sample_params` draw order (glyph → font → size → rotation → fg → bg → noise) is documented in both `poc/glyph_engine.py` docstring (line 102–103) and `docs/ARCHITECTURE.md` Stage 2 — documents and code agree.
- [x] **1-03** `NOISE_SALT = 0x9E3779B97F4A7C15` is defined once at module scope (`glyph_engine.py` line 31); no other path sets it; the value is also documented in `docs/SECURITY-NOTES.md` §3.
- [x] **1-04** `GLYPHS` is built from the frozen `_GLYPH_RANGES` list (lines 33–41); construction is pure (list comprehension over integer constants) with no runtime state.
- [x] **1-05** `_FONT_CANDIDATES` is a compile-time constant list (lines 44–68); `discover_fonts()` iterates it in declaration order (`[p for p in _FONT_CANDIDATES if Path(p).is_file()]`), so font index is platform-stable for any given available set.
- [x] **1-06** The contrast re-roll loop in `sample_params` (lines 111–114) is bounded: `for _ in range(8)` — cannot run indefinitely on any seed or font configuration.
- [x] **1-07** `encode_png` always uses `compress_level=1, optimize=False` (lines 150–151); no code path overrides these values; they are part of the documented determinism contract.
- [x] **1-08** `render()` uses `random.Random(seed)` (not the global `random` module), so renders are isolated from any global state (line 104).
- [x] **1-09** NumPy noise is seeded with `np.random.default_rng(seed ^ NOISE_SALT)` (line 138) — a fresh PCG64 generator per call, no shared global NumPy state.
- [x] **1-10** The `--from-manifest` path correctly reads `engine_version`, `seed_start`, `count`, `stride`, and `canvas` from the JSON record and warns (not crashes) on version mismatch (lines 212–228).
- [x] **1-11** `build_seeds` uses integer arithmetic with explicit 64-bit mask `0xFFFFFFFFFFFFFFFF` (line 163), preventing Python's arbitrary-precision int from silently generating out-of-range seeds.
- [x] **1-12** Rust `SeedSpace::sample` draw order matches the Python PoC order (glyph, font, size, rotation, fg, bg, noise) per `core/src/lib.rs` lines 86–94 and is documented in the function docstring.
- [x] **1-13** Rust `splitmix64` implementation matches the canonical Steele/Lea/Flood constants (`0x9E3779B97F4A7C15`, `0xBF58476D1CE4E5B9`, `0x94D049BB133111EB`) — lines 114–120 of `lib.rs`.
- [x] **1-14** Rust `lemire_reduce` uses the exact formula `((raw as u128 * n as u128) >> 64) as u32` with no division and no rejection loop — O(1) and bias-free (lines 106–108).
- [x] **1-15** `SeedSpace::POC_V1` cardinality constants (glyphs=518, fonts=50, sizes=32, rotations=360) are documented in the struct constant and crosschecked in `cardinality_exceeds_1e21` test.
- [ ] **1-16** `logging_config.py` duplicates `ENGINE_VERSION = "ceae-poc/0.1.0"` (line 23) without importing it from `glyph_engine.py` — a future version bump must update two files, risking drift. **MEDIUM**
- [ ] **1-17** `glyph_engine.py` main() does not re-emit `ENGINE_VERSION` in the manifest-mode output when `--manifest` is given alongside `--out`; the dual-output use-case (PNG + manifest) is not exercised by any test — the argparse sentinel logic is left ambiguous in comments (lines 253–257). **LOW**
- [ ] **1-18** The glyph count in `SeedSpace::POC_V1` is hardcoded as `glyphs: 518` in `core/src/lib.rs` (line 43); the actual Python `GLYPHS` list produces `len(GLYPHS)` which is never programmatically verified to equal 518 — a manual count mismatch cannot be caught by existing tests. **MEDIUM**
- [ ] **1-19** `_font_cache` is a module-level `dict` (line 70 of `glyph_engine.py`) — correct for a single-process run, but will be duplicated (not shared) across `multiprocessing` workers, so cache warm-up in worker 0 does not help worker 1. **LOW** (noted, not yet a bug since multiprocess pipeline is not yet implemented)
- [ ] **1-20** No assertion or test checks that `discover_fonts()` returns at least one entry on CI; if the DejaVu/Liberation fonts are absent on a runner, `found` would be `[None]` and Pillow's bundled default font is used — which may produce different bytes per Pillow version. **MEDIUM**

**Section 1 score: 15/20**

---

## Section 2 — Algorithms & Data Structures (DSA)

- [x] **2-01** Glyph selection uses `rng.randrange(len(GLYPHS))` → integer index into a Python list — O(1) lookup, correct data structure choice.
- [x] **2-02** Font selection uses the same O(1) list-index pattern on `fonts`; the `discover_fonts()` function returns a list (not a set or dict), guaranteeing stable ordering.
- [x] **2-03** `_font_cache` is a plain `dict` keyed by `(path, size)` tuples — O(1) amortised insert/lookup, appropriate for the bounded key space (≤ `len(fonts) × 32`).
- [x] **2-04** `build_seeds` uses a list comprehension returning a `list[int]` — O(count) time and space, which is the minimal representation for a non-contiguous stride-sampled set.
- [x] **2-05** The contrast re-roll loop is a bounded linear scan (max 8 iterations, O(1) per iteration) — not a data structure issue, but the algorithm is correct and documented.
- [x] **2-06** `GLYPHS` is a list (not a set): index stability is guaranteed, duplicate code-points (none currently) would be retained — correct for a frozen table used by index.
- [x] **2-07** `write_manifest` uses `json.dumps` on a plain dict — O(fields) serialisation, appropriate for the small fixed schema.
- [x] **2-08** Rust `SeedSpace` is a `Copy` struct (line 16 of `lib.rs`) — zero-allocation, correct choice for a frequently passed parameter tuple.
- [x] **2-09** Rust `GlyphParams` is also `Copy` (line 28) — output can be returned by value with no heap allocation.
- [x] **2-10** Lemire reduce uses a single `u128` multiply + shift — O(1), no division, no loop — optimal for unbiased integer reduction.
- [x] **2-11** `splitmix64` is a stateful counter-based generator (`&mut u64` state) — O(1) per call, no allocation; correct choice for the Rust fast path.
- [x] **2-12** NumPy `nrng.standard_normal(arr.shape, dtype=np.float32)` generates the entire noise array in one vectorised call — O(W×H) but avoids Python-loop overhead; correct algorithm.
- [x] **2-13** `np.clip(arr, 0, 255).astype(np.uint8)` is a single-pass vectorised operation — correct and efficient.
- [x] **2-14** `_LOGGING_RESERVED` in `logging_config.py` is a `frozenset` (line 51) — O(1) membership test in the formatter's hot loop, correct choice.
- [ ] **2-15** `GLYPHS` is rebuilt at module import time from `_GLYPH_RANGES` (line 41). For the PoC this is fine, but if `poc/glyph_engine.py` is imported multiple times (e.g., by a multiprocessing spawn), the list is reconstructed in each worker process — a tuple would be marginally safer as an immutable constant. **INFO**
- [ ] **2-16** `read_manifest` calls `json.loads(Path(path).read_text(...))` — loads the entire file into memory before parsing. For the current small manifest format this is fine, but the planned JSON Lines format (multi-range manifests per `docs/ARCHITECTURE.md`) would require streaming/line-by-line parsing. **LOW**
- [ ] **2-17** No heap-size bound is enforced on `seeds` list returned by `build_seeds`; `--count 10_000_000` would allocate ~80 MB of Python int objects before a single render — should be replaced by a lazy generator for large counts. **MEDIUM**
- [ ] **2-18** `_font_cache` has no maximum size cap; while the key space is bounded by axis sizes, a future `--font` flag (planned) accepting arbitrary paths + sizes would make the cache unbounded. **LOW**
- [ ] **2-19** The manifest JSON record stores `seed_start` as a plain integer; seeds near 2^63 are stored correctly in Python's arbitrary-precision JSON but may round-trip incorrectly in environments that parse JSON numbers as IEEE-754 doubles (max safe integer = 2^53 − 1). The schema should mandate hex-string encoding for seeds. **HIGH**
- [ ] **2-20** The `test_sampler_uniformity.py` bucket check allocates a `list[dict]` of 2000 `sample_params` results simultaneously — not an issue at N=2000, but the test comment warns about N being "enough for coarse uniformity"; a chi-square test would be more rigorous. **INFO**

**Section 2 score: 14/20**

---

## Section 3 — Time Complexity Per Hot Path

- [x] **3-01** `splitmix64` (Rust): O(1) — three multiply-XOR-shift operations, no loops.
- [x] **3-02** `lemire_reduce` (Rust): O(1) — one multiply + shift.
- [x] **3-03** `SeedSpace::sample` (Rust): O(1) — exactly 7 `splitmix64` calls + 7 `lemire_reduce` calls, no branches on input.
- [x] **3-04** `sample_params` (Python): O(1) amortised — 7 RNG draws + 1 bounded loop (max 8 iterations); no input-size dependency.
- [x] **3-05** `discover_fonts()`: O(|_FONT_CANDIDATES|) = O(20) — fixed constant, not input-dependent; only called once per process.
- [x] **3-06** `_load_font`: O(1) — dict lookup + optional FreeType load (amortised O(1) after warm-up).
- [x] **3-07** `_lattice_color`: O(1) — 3 RNG draws + `hsv_to_rgb` (fixed computation).
- [x] **3-08** `render()` raster work: O(W²) where W = canvas size — glyph draw, bicubic rotate, composite are all proportional to pixel count; correctly documented in `docs/THROUGHPUT.md`.
- [x] **3-09** Noise generation: O(W²) — `standard_normal` and `clip/astype` are all O(W²).
- [x] **3-10** `encode_png`: O(W²) — deflate is O(pixel count × compress_level).
- [x] **3-11** `build_seeds(seed_start, count, stride)`: O(count) time, O(count) space — linear, as expected.
- [x] **3-12** `write_manifest`: O(1) — fixed-size JSON dict serialisation regardless of seed count.
- [x] **3-13** `read_manifest`: O(file_size) — loads the full file; for the current single-record format this is O(1).
- [x] **3-14** Main render loop in `main()`: O(count × W²) — correct; no hidden quadratic.
- [x] **3-15** `emit_run_manifest` (logging): O(1) — fixed field count in the log payload.
- [ ] **3-16** `_JsonFormatter.format` in `logging_config.py` iterates `record.__dict__.items()` (line 44) — O(|record attributes|); Python LogRecord has ~25 reserved attributes, so this is O(1) in practice, but the reservation check (`key not in _LOGGING_RESERVED`) is a frozenset lookup which is O(1) — well-designed; mark as INFO only. **INFO**
- [ ] **3-17** No documented time budget exists for `discover_fonts()` at cold start; on Windows with network-mapped font directories, `Path(p).is_file()` could block — no timeout. **LOW**
- [ ] **3-18** Bicubic rotation (`Image.Resampling.BICUBIC`) on the oversized layer (side = canvas + canvas//2) is O((1.5W)²) rather than O(W²) — 2.25× the pixel work of a same-canvas rotate. This is a deliberate design trade-off (avoids clipping) but is not documented as a complexity cost. **INFO**
- [ ] **3-19** For `--count N` with large N, the benchmark loop `sum(len(encode_png(render(…))) for s in seeds)` holds all `seeds` in memory as a list before iteration begins — the list comprehension in `build_seeds` is O(N) space before any rendering starts. **LOW**
- [ ] **3-20** No complexity analysis document exists for the planned multiprocess pipeline (T-003); partition overhead, IPC cost, and sink contention are undocumented. **LOW**

**Section 3 score: 15/20**

---

## Section 4 — Space Complexity & Memory

- [x] **4-01** `render()` allocates two `Image` objects (oversized layer + final canvas) and one `np.ndarray` (noise); all are released at function return — O(W²) peak, no accumulation.
- [x] **4-02** `encode_png` allocates a single `BytesIO` buffer — O(compressed_size) — and returns `bytes`; the buffer goes out of scope at function return.
- [x] **4-03** `_font_cache` is bounded by `len(fonts) × 32` entries (one per (path, px) pair); at ≤20 fonts × 32 sizes = 640 max entries, each holding one FreeType object. Well-bounded.
- [x] **4-04** `GLYPHS` is a fixed-size list of `len(GLYPHS)` single-character strings (≤ 518 items); occupies ~40 KB — negligible and stable.
- [x] **4-05** `_FONT_CANDIDATES` is a fixed list of 19 strings — negligible and immutable.
- [x] **4-06** Rust `SeedSpace` and `GlyphParams` are `Copy` structs of 7 `u32` fields each — 28 bytes each, stack-allocated, zero heap.
- [x] **4-07** Rust `main.rs` allocates only a `String` (from `std::env::args`) for seed parsing; no unbounded allocation.
- [x] **4-08** `write_manifest` serialises a fixed-field dict and writes to disk — O(1) memory, no accumulation.
- [x] **4-09** `logging_config.py` logger setup allocates one `StreamHandler` + `_JsonFormatter`; the logger is cached by name (lines 60–61) — no repeated allocation on re-import.
- [x] **4-10** The benchmark mode renders each image, computes `len(encode_png(...))`, and discards the bytes immediately (sum expression) — O(W²) peak, not O(count × W²).
- [ ] **4-11** Normal (non-benchmark) render loop in `main()` writes images one-at-a-time but `seeds` list is fully materialized before the loop begins — O(count) peak memory for seeds. For `--count 10_000_000` this is ~80 MB of Python ints. A lazy `range`-based generator would reduce this to O(1). **MEDIUM**
- [ ] **4-12** `test_sampler_uniformity.py` `_collect_params` materializes a list of 2000 dicts simultaneously — each dict has 7 keys. At N=2000 this is ~560 KB; for N=100,000 (realistic stress test) it would be ~28 MB. **INFO**
- [ ] **4-13** `_JsonFormatter.format` in `logging_config.py` constructs a new `dict` payload per log call (line 30) — O(fields) allocation on every log line; in a hot per-image DEBUG loop this would generate GC pressure. No pooling mechanism. **LOW**
- [ ] **4-14** The oversized layer `side = canvas + canvas // 2` adds 2.25× pixel overhead for the rotate operation; for 2048px canvas the layer is 3072×3072 = ~28 MB RGBA — documented in code (line 125) but not as a space-cost warning. **LOW**
- [ ] **4-15** No memory limit flag exists; `--count 1_000_000 --size 2048` could exhaust RAM on systems with <16 GB if workers are added. **MEDIUM**
- [ ] **4-16** `read_manifest` loads the full file into a string before JSON parsing — acceptable now, but the planned JSON Lines format with millions of picks entries would exhaust memory. **MEDIUM** (future risk)
- [ ] **4-17** No test covers memory behaviour (peak RSS) during a large batch; no regression guard exists for memory regressions between versions. **LOW**
- [ ] **4-18** `test_manifest.py` renders up to 4 images at SIZE=64 in multiple test functions — extremely low memory impact, but there is no large-N memory regression test. **INFO**
- [ ] **4-19** The planned GPU path (wgpu texture atlas) would require O(glyphs × fonts × canvas²) texture memory; no memory budget analysis exists in docs yet. **LOW**
- [ ] **4-20** `poc/logging_config.py` does not implement log file rotation or size capping; `docs/OBSERVABILITY.md` defers this to "the caller's responsibility". A long benchmark run with `CEAE_LOG_LEVEL=DEBUG` could generate multi-GB log files. **MEDIUM**

**Section 4 score: 10/20**

---

## Section 5 — Numerical Correctness (HSV/luma/noise/rotation)

- [x] **5-01** `_lattice_color`: `h = rng.randrange(256) / 256.0` produces values in `[0.0, 255/256)` — correct for the 256-hue lattice; hue=1.0 (red wraparound) is deliberately excluded, which is consistent with a 256-step grid.
- [x] **5-02** `_lattice_color`: `s = rng.randrange(64) / 63.0` and `v = rng.randrange(64) / 63.0` produce values in `[0.0, 1.0]` inclusive — correct; both endpoints of the saturation/value range are reachable.
- [x] **5-03** `colorsys.hsv_to_rgb` is the Python stdlib implementation — correctly converts HSV to linear RGB in [0,1]; the subsequent `round(r * 255)` maps to integer [0, 255].
- [x] **5-04** `_luma` formula `0.299*R + 0.587*G + 0.114*B` is the ITU-R BT.601 luma approximation — standard and documented; the threshold 48.0 is a design choice, not a numerical error.
- [x] **5-05** `round(r * 255)` uses Python's banker's rounding (round-half-to-even); the exact midpoint case (e.g., 127.5) rounds to 128 — this is consistent across all CPython platforms.
- [x] **5-06** Noise: `arr += nrng.standard_normal(arr.shape, dtype=np.float32) * (p["noise"] * 1.5)` — Gaussian noise with scale up to 22.5 at noise=15; `np.clip(arr, 0, 255)` correctly bounds the result.
- [x] **5-07** `np.asarray(img, dtype=np.float32)` correctly promotes uint8 to float32 before noise addition, preventing integer overflow/wrap.
- [x] **5-08** `np.clip(arr, 0, 255).astype(np.uint8)` correctly clamps and converts back; no intermediate float rounding error that would differ across platforms (clip is element-wise, deterministic).
- [x] **5-09** Bicubic rotation uses `Image.Resampling.BICUBIC` (Pillow enum, not deprecated integer constant) — correct for the Pillow ≥10.1 requirement.
- [x] **5-10** `px = 12 + round(p["size_step"] * (canvas * 0.7 - 12) / 31)` — at size_step=0 gives px=12; at size_step=31 gives px=round(12 + 31*(canvas*0.7-12)/31) = round(canvas*0.7) — correct linear interpolation. The `max(px, 4)` guard (line 123) prevents a zero/negative font size.
- [x] **5-11** Rust `SeedSpace::POC_V1.cardinality()` uses `u128` arithmetic to avoid u64 overflow — the product `518 * 50 * 32 * 360 * 2^20 * 2^20 * 16 ≈ 3.3e21` exceeds u64::MAX (1.8e19), so u128 is necessary and correct.
- [ ] **5-12** `_lattice_color` `h = rng.randrange(256) / 256.0` — the maximum hue value is `255/256 ≈ 0.996`, not `1.0`. This means pure red (hue=1.0) is never reached. This is a deliberate lattice design, but it is undocumented; a comment explaining the intentional exclusion is missing. **INFO**
- [ ] **5-13** `round(r * 255)` for each channel converts float to int independently; rounding errors can cause the reconstructed RGB from `colorsys.hsv_to_rgb` to differ by ±1 from the "true" lattice color. This is not a bug (colors are sampled from the lattice, not required to round-trip through HSV), but it means `fg_color_idx` in Rust refers to an index while Python computes the actual RGB inline — the two representations are not reconciled. **MEDIUM**
- [ ] **5-14** No unit test verifies the exact RGB output of `_lattice_color` for specific seeds — only that luma contrast is ≥48 (via the re-roll logic). A regression on `colorsys` behaviour would not be caught. **LOW**
- [ ] **5-15** The contrast threshold 48.0 over a 0-255 luma scale is approximately 19% contrast — no reference to a perceptual accessibility standard (WCAG requires 4.5:1 for text, equivalent to a much larger luma difference). The threshold is a design choice, but the basis is undocumented. **INFO**
- [ ] **5-16** Bicubic rotation on an RGBA layer introduces sub-pixel interpolation which may produce fractional alpha values in the rotated layer; `img.paste(crop, (0, 0), crop)` composites using the alpha channel — any sub-pixel fringing near the glyph edges is deterministic but may cause unexpected color bleed. **INFO**
- [ ] **5-17** `nrng.standard_normal(..., dtype=np.float32)` — PCG64's float32 generation path may differ from float64 in subtle ways across NumPy versions; the golden-digest test (T-002, not yet implemented) is the only planned guard. **LOW**
- [ ] **5-18** No test verifies the exact pixel values of a rendered image for known seeds (beyond byte-identity within a process run); per-pixel numerical correctness of the HSV→RGB conversion pipeline is untested cross-platform. **MEDIUM**
- [ ] **5-19** `size_step` range is 0–31 (32 steps) but `(canvas * 0.7 - 12) / 31` uses float division; at canvas=256, px ranges from 12 to `round(179.2) = 179` — a 12-179 px range which differs slightly from the ARCHITECTURE.md claim of "12–200 px" for canvas=256. The documented upper bound is inconsistent. **LOW**
- [ ] **5-20** No test exercises `noise=0` and `rotation=0` simultaneously to confirm those branches are skipped correctly (the `if p["noise"]` and `if p["rotation"]` guards); only composite integration tests confirm byte-identity. **LOW**

**Section 5 score: 11/20**

---

## Section 6 — RNG Quality & Bias (modulo vs Lemire, decorrelation, uniformity)

- [x] **6-01** Python PoC uses `random.Random(seed)` — Mersenne Twister, CPython-specified, platform-identical behaviour across Windows/Linux/macOS for the same CPython version. Documented in `docs/ARCHITECTURE.md` Stage 2.
- [x] **6-02** NumPy noise uses `np.random.default_rng(seed ^ NOISE_SALT)` — PCG64, also cross-platform specified; the XOR with `NOISE_SALT` decorrelates the noise stream from the parameter draw stream. Design is correct.
- [x] **6-03** `NOISE_SALT = 0x9E3779B97F4A7C15` is the golden-ratio-derived constant used in splitmix64 as a mixing constant — a well-chosen decorrelation value that ensures `seed ^ NOISE_SALT ≠ seed` for all seeds.
- [x] **6-04** Rust uses `splitmix64` — a counter-based, period-2^64, well-analysed generator; Steele/Lea/Flood reference cited in `lib.rs` docstring.
- [x] **6-05** Lemire's multiply-shift reduction replaces all `% n` modulo operations in `SeedSpace::sample` — bias-free for all axis cardinalities. Closes the documented TODO. Reference (ACM TOMS 2019) cited in code.
- [x] **6-06** The Lemire formula `((raw as u128 * n as u128) >> 64) as u32` is the base form (not the nearbyint variant) and is correct for `n ≤ 2^32`, which all axis cardinalities satisfy.
- [x] **6-07** `test_sampler_uniformity.py` verifies that all integer axes span their full range (min=0, max=cardinality-1) across 2000 stride-spaced seeds — confirms no axis is structurally stuck.
- [x] **6-08** `test_sampler_uniformity.py` coarse bucket test (±4× tolerance) would catch gross structural bias (e.g., only half the range reachable); the ±50% tolerance in the Rust `lemire_reduce_near_uniform_small_n` test is tighter for n=7.
- [x] **6-09** `build_seeds` with `stride=65537` (a large odd prime) spaces seeds far apart in u64 space — documented rationale (THROUGHPUT §6); avoids correlated adjacent renders when using sequential sampling.
- [x] **6-10** Both `test_sequential_seeds_also_uniform` and `test_stride_samples_roughly_uniform` pass (verified: 13/13 tests green), confirming both sampling strategies produce approximately uniform distributions.
- [ ] **6-11** Python `rng.randrange(n)` for `n` not a power of two uses Mersenne Twister's internal modulo reduction, which has negligible modulo bias for small n relative to 2^32, but this is never formally stated or tested. The Rust path uses Lemire; the Python path does not — the two paths are different engine versions, but this asymmetry is worth documenting. **INFO**
- [ ] **6-12** The Lemire base form (without the "nearly divisionless" correction) has a residual bias of at most 1/(2^64/n) — approximately 1 in 2^64/n. For n=518 (glyphs) this is ~1 in 3.6×10^16, negligible. But this is not stated in the code comment, which claims "removes modulo bias entirely" (line 80). "Removes modulo bias" should read "removes modulo bias to within one ULP" or cite the exact residual. **INFO**
- [ ] **6-13** No statistical test (chi-square, KS test) is run for color axes (fg/bg) — the 2^20 cardinality means the uniformity test at N=2000 has less than 1 expected sample per bucket. Color distribution uniformity is untested. **MEDIUM**
- [ ] **6-14** The contrast re-roll draws additional `bg` samples after the initial draw; this biases `bg` toward higher-luma values (since low-luma pairs that pass the contrast check are kept, but the re-rolls also permit any bg that passes — the distribution of bg is not uniform but is re-roll-weighted). This is a design feature, but it is not documented as a distributional property. **INFO**
- [ ] **6-15** `rng.randrange(360)` for rotation — Mersenne Twister modulo 360; 2^32 mod 360 = 256, so there is a theoretical modulo bias of 256/4,294,967,296 ≈ 6×10^-8, entirely invisible at 2000-sample test scale. Not a practical issue, but the Python path's bias is documented nowhere. **INFO**
- [ ] **6-16** No seeded test covers the edge case `seed=0` for the Rust sampler with an assertion on exact output values — only that the same seed gives the same result (not a specific expected value). A golden-value test for Rust would detect future constant changes. **MEDIUM**
- [ ] **6-17** The `NOISE_SALT` is the same value as the splitmix64 additive constant — using the same constant for a different purpose (XOR decorrelation) is not incorrect but could confuse future maintainers who see the same magic number in two contexts. A comment clarifying the coincidence would prevent misunderstanding. **INFO**
- [ ] **6-18** No test verifies that different seeds produce statistically independent (uncorrelated) noise patterns — only that they produce different bytes. Correlation testing (e.g., autocorrelation of the noise field across adjacent seeds) is not planned. **INFO**
- [ ] **6-19** Rust `lemire_reduce_near_uniform_small_n` uses n=7 with DRAWS=70,000 and ±50% tolerance — this would fail to detect a 10% bias. The test is a coarse smoke check, not a rigorous uniformity test. **LOW**
- [ ] **6-20** The `random.Random` Mersenne Twister period is 2^19937−1, much larger than 2^64; there is no concern about period exhaustion for sequential seeds, but the independence of outputs at seeds spaced by a small stride (e.g., 1) has not been formally verified. The `test_render_order_independence` test provides indirect coverage. **INFO**

**Section 6 score: 10/20**

---

## Section 7 — Reproducibility & Cross-Platform

- [x] **7-01** `random.Random(seed)` uses CPython's Mersenne Twister with platform-identical output for the same seed on Windows, Linux, and macOS — documented in `docs/ARCHITECTURE.md` Stage 2 and confirmed by `docs/FAQ.md`.
- [x] **7-02** `np.random.default_rng(seed ^ NOISE_SALT)` uses PCG64, which is fully specified and cross-platform identical in NumPy ≥1.17 — `poc/requirements.txt` pins `numpy>=1.26`, well above this threshold.
- [x] **7-03** `encode_png` uses fixed `compress_level=1, optimize=False` — zlib deflate output is deterministic for fixed input and parameters; no platform variation.
- [x] **7-04** `render()` contains no calls to `time()`, `datetime`, `os.getpid()`, `os.urandom()`, `secrets`, or `uuid` — confirmed by inspection of `glyph_engine.py`.
- [x] **7-05** `discover_fonts()` returns fonts in the fixed declaration order of `_FONT_CANDIDATES` (not OS directory listing order) — platform-stable font indices.
- [x] **7-06** The CI workflow runs `pytest -q tests` on `ubuntu-latest` on every push — cross-platform Linux coverage is automated.
- [x] **7-07** `docs/TESTING.md` explicitly documents the cross-platform determinism strategy and the role of the (planned) golden-digest test in catching dependency drift.
- [x] **7-08** `docs/OBSERVABILITY.md` provides a `cross-platform run comparison` protocol using `space_hash` + per-seed SHA-256 sampling.
- [x] **7-09** `.gitattributes` marks PNG/webp/tar as `binary` — prevents line-ending normalisation of rendered outputs.
- [x] **7-10** `build_seeds` uses `& MASK` (0xFFFFFFFFFFFFFFFF) to clip seeds to 64-bit — seeds are platform-identical regardless of Python's int width.
- [ ] **7-11** No golden-seed digest fixture (`tests/fixtures/golden_digests.json`) exists yet — T-002 is in the "Ready" column but not implemented. The current suite proves intra-process determinism but not cross-machine bit-identity. **HIGH (gap — named test is the key cross-platform guard)**
- [ ] **7-12** FreeType is a C library; its glyph rasterisation output can vary between versions (subpixel hinting, grid-fitting). Pillow pins FreeType via its own binary wheel, but the exact FreeType version shipped may differ between Pillow 10.x and 11.x. No test pins or checks the FreeType version. **HIGH**
- [ ] **7-13** `poc/requirements.txt` uses minimum-version pins (`pillow>=10.1`, `numpy>=1.26`) rather than exact pins — a `pip install` six months from now may install Pillow 11.x or NumPy 2.x, which could change rendered output without any CI failure (T-002 is the planned guard, but it does not exist yet). **HIGH**
- [ ] **7-14** The CI workflow pins `python-version: "3.12"` but does not pin a specific Pillow or NumPy version — `pip install -r poc/requirements.txt` installs the latest compatible release on every CI run. **HIGH**
- [ ] **7-15** No Windows CI runner exists — the dev workstation is Windows 11, CI runs `ubuntu-latest` only. Cross-OS byte-identity is untested (it is expected to hold, but unconfirmed by automated tests). **MEDIUM**
- [ ] **7-16** `logging_config.py` imports `datetime.now(tz=timezone.utc)` (line 31) — this is in the log formatter, not the render path, so it does not affect reproducibility; but if the logger is accidentally called from inside `render()` in a future refactor, it would introduce hidden entropy. **LOW**
- [ ] **7-17** No test covers the `--from-manifest` re-render path on a different machine — only within the same process. The cross-machine guarantee is claimed but untested. **MEDIUM**
- [ ] **7-18** `core/Cargo.toml` has no `[profile.release]` pinning of `opt-level`, `codegen-units`, or `lto` — release builds across compiler versions may differ in LLVM IR, affecting floating-point results if any float arithmetic is added in the future. Not a current bug (no floats in the Rust sampler). **LOW**
- [ ] **7-19** `space_hash` in the manifest is hardcoded as `"sha256:pending"` in `logging_config.py` (line 91) — the actual hash of axis tables is never computed; manifests currently do not verify axis integrity. **HIGH**
- [ ] **7-20** No procedure exists for formally certifying a new platform (e.g., ARM64 macOS) as a valid render host — the docs describe the comparison protocol but no automated gate enforces it. **LOW**

**Section 7 score: 10/20**

---

## Section 8 — Performance & Throughput

- [x] **8-01** Benchmark mode (`--benchmark`) renders in-memory with no disk I/O — isolates render+encode performance correctly.
- [x] **8-02** Font cache warm-up via `encode_png(render(seeds[0], args.size, fonts))` before the timed loop (line 235) — cache is populated before measurement begins; documented in `docs/AUDIT.md` A-PERF-04.
- [x] **8-03** PNG encode uses `compress_level=1` — speed-optimised as documented in `docs/AUDIT.md` A-PERF-06; not level 0 (uncompressed, larger files, worse for storage) or level 9 (slower encode, minimal compression gain for noisy images).
- [x] **8-04** Noise uses vectorised NumPy (`standard_normal` on a full `arr.shape` array) — not a Python loop over pixels; documented in `docs/AUDIT.md` A-PERF-05.
- [x] **8-05** `docs/THROUGHPUT.md` provides a first-principles per-stage budget (sample, raster, noise, encode, write) with measured numbers from the dev workstation (90.4 img/s at 256px).
- [x] **8-06** The measured 90.4 img/s is 7.8× the 11.6 img/s target — large margin before any parallelism or Rust fast path, consistent with the PoC acceptance criterion.
- [x] **8-07** The benchmark job in CI runs 50 images non-blocking (`continue-on-error: true`) — throughput regression detection exists (non-blocking) without blocking merges on flaky CI infrastructure.
- [x] **8-08** `docs/THROUGHPUT.md` §4 correctly identifies encode + I/O as the future bottleneck once raster is fast (Rust/GPU path), and explains why the manifest-only sink is the architectural answer.
- [x] **8-09** `render()` makes no subprocess calls, network calls, or filesystem reads inside the hot path (confirmed by inspection) — consistent with `docs/AUDIT.md` A-PERF-07.
- [x] **8-10** The oversized-layer strategy (`side = canvas + canvas//2`) avoids clipping artefacts at the cost of 2.25× raster work — the trade-off is documented in the code comment (line 124–125) and is acceptable for the PoC.
- [ ] **8-11** No automated benchmark regression test exists; the benchmark CI job prints a number but does not assert a floor (e.g., ≥ 50 img/s). A regression to 30 img/s would pass CI silently. **MEDIUM**
- [ ] **8-12** No benchmark record file exists under `docs/benchmarks/` — TESTING.md says benchmark output "is committed to `docs/` as a named record whenever a performance change is made", but no such file exists yet. **LOW**
- [ ] **8-13** The benchmark uses `--count 50` in CI (line 65 of `ci.yml`) vs `--count 1000` in `make bench` — the CI sample is too small to be statistically reliable; variance at 50 images can be 10–20%. **LOW**
- [ ] **8-14** The 215.6 img/s figure reported in `CHANGELOG.md [0.1.2]` (128px canvas) is not documented in `docs/THROUGHPUT.md` or `README.md` — only the 90.4 img/s (256px) baseline appears there; throughput docs are out of date. **LOW**
- [ ] **8-15** No multi-core throughput measurement has been performed — the projected 1000–1400 img/s for 16 workers is theoretical, not measured. T-003 (multiprocess pipeline) is still in Backlog. **MEDIUM**
- [ ] **8-16** No profiling data (cProfile or py-spy trace) is committed; THROUGHPUT.md estimates stage costs as "~8.4 ms raster+augment" but no flame graph or per-stage instrument exists. **LOW**
- [ ] **8-17** For the planned Rust fast path, no formal throughput target per core has been measured on the dev workstation yet (≥10,000 img/s aggregate is listed as a v1 acceptance criterion, not a measured baseline). **INFO**
- [ ] **8-18** `encode_png` is called unconditionally even in `--manifest` mode — wait, checking: in `--manifest` mode, `main()` returns at line 257 before the render loop, so PNG encoding is correctly skipped. **INFO** (this is actually fine; note for clarity only)
- [ ] **8-19** The benchmark does not separate sample, raster, and encode timings into per-stage measurements — THROUGHPUT.md lists stage estimates but these are not validated by a per-stage profiling test. **LOW**
- [ ] **8-20** No throughput test for the `--from-manifest` re-render path — it goes through the same render loop but was not measured separately; any overhead from `read_manifest()` is unmeasured. **INFO**

**Section 8 score: 10/20**

---

## Section 9 — Concurrency / Parallelism Readiness

- [x] **9-01** `render()` has no global mutable state — it creates a new `random.Random(seed)` per call (line 104), so it is trivially parallelisable across seeds.
- [x] **9-02** `np.random.default_rng(seed ^ NOISE_SALT)` creates a fresh PCG64 instance per call — no shared NumPy global RNG state.
- [x] **9-03** `_font_cache` is a module-level dict; within a single process it is safely shared across sequential calls. In a `multiprocessing` (spawn) context, each worker gets its own copy — no race condition.
- [x] **9-04** `docs/ARCHITECTURE.md` explicitly states "No shared state between seeds means render order, worker count, and machine boundaries are all irrelevant to output" — the design principle is correctly documented.
- [x] **9-05** Rust `SeedSpace::sample` takes `&self` (shared reference) and a `u64` seed by value — thread-safe, can be called from multiple threads concurrently with no locking.
- [x] **9-06** T-003 (multiprocess pipeline) backlog card correctly specifies `multiprocessing.Pool` or `ProcessPoolExecutor`, acknowledging the Python GIL makes threading useless for CPU-bound rendering.
- [x] **9-07** `docs/OBSERVABILITY.md` addresses multi-worker log files: "each worker writes to its own log file to avoid interleaved JSON" — the concurrency concern for logging is acknowledged.
- [x] **9-08** Seed-range partitioning design (T-003) assigns contiguous sub-ranges to workers — correct, deterministic, and verifiable by comparing single-process vs multi-process output.
- [ ] **9-09** The `_font_cache` module-level dict — while process-safe in `multiprocessing` spawn mode — would be a data race in a `multiprocessing` fork+thread hybrid scenario. No guard or documentation addresses this edge case. **LOW**
- [ ] **9-10** `multiprocessing` on Windows uses the `spawn` start method by default; on Linux it defaults to `fork`. Forked workers inherit the parent's `_font_cache` but spawned workers do not — behaviour differs by OS. T-003 card notes this but no cross-platform start-method test exists. **MEDIUM**
- [ ] **9-11** `poc/logging_config.py` `get_logger` caches the logger by name (line 64); if two threads in a future async/threading scenario call `get_logger` simultaneously, the `if logger.handlers` check is not thread-safe (TOCTOU). **LOW**
- [ ] **9-12** No `concurrent.futures` or `asyncio` infrastructure exists; the render loop is strictly sequential. The multiprocess pipeline is entirely unimplemented. **INFO**
- [ ] **9-13** Sink writes (`(out / f"{s:016x}.png").write_bytes(...)`) are not sharded — all workers would write into the same directory, causing filesystem contention at high worker counts. T-005 (sharded sink) is in Backlog. **MEDIUM**
- [ ] **9-14** No test verifies that multi-process output is byte-identical to single-process output — this is the required acceptance criterion for T-003 but is not yet implemented. **HIGH** (future gate, acknowledged)
- [ ] **9-15** Rust `core/` has no `rayon` parallelism yet; the planned `rayon` parallel iterator for the fast path is not scaffolded even as a TODO in `main.rs`. **INFO**
- [ ] **9-16** No `--workers` CLI flag exists yet; there is no way to invoke multi-process rendering without writing custom pipeline code. **INFO**
- [ ] **9-17** The `encode_png` bottleneck at high worker counts is acknowledged in `docs/THROUGHPUT.md` §4 but no solution (e.g., SIMD deflate, zstd) is in the backlog. **LOW**
- [ ] **9-18** No atomicity guarantee on PNG write — `write_bytes` is not atomic on POSIX; a partial write on crash is possible. The planned resume-after-crash (T-006) should use write-to-temp-then-rename to guarantee atomicity. **MEDIUM**
- [ ] **9-19** The manifest write (`Path(path).write_text(...)`) is also non-atomic — a crash mid-write produces a corrupt manifest with no detection mechanism. **MEDIUM**
- [ ] **9-20** No thread pool or executor is seeded or controlled; if future async I/O is added, the RNG isolation guarantee must be re-verified. **INFO**

**Section 9 score: 8/20**

---

## Section 10 — I/O, Storage & the Seed-Manifest Inversion

- [x] **10-01** `write_manifest` uses `json.dumps(record, indent=2)` with UTF-8 encoding — human-readable, unambiguous encoding, correct.
- [x] **10-02** `read_manifest` uses `Path(path).read_text(encoding="utf-8")` — explicit encoding, no implicit locale-dependent decoding.
- [x] **10-03** Output PNG files are named `{s:016x}.png` — zero-padded 16-char hex, sortable, unique per seed, platform-safe filename.
- [x] **10-04** Output directory is created with `out.mkdir(parents=True, exist_ok=True)` — idempotent, safe for re-runs.
- [x] **10-05** Manifest stores `engine_version`, `seed_start`, `count`, `stride`, `canvas` — sufficient to deterministically reconstruct the exact image set without any pixel data.
- [x] **10-06** `docs/ARCHITECTURE.md` §5 correctly describes the storage inversion: "100 trillion images → one `ranges` entry ≈ 32 bytes vs ~800 PB as PNG".
- [x] **10-07** Benchmark mode explicitly avoids all disk I/O — no files written, no directory created; `--out` argument is documented as "ignored in benchmark mode".
- [x] **10-08** `logs/.gitkeep` is committed; `*.log` files are gitignored — correct separation of log directory scaffold from log content.
- [x] **10-09** `docs/OBSERVABILITY.md` defines a structured JSON log line schema including `seed_start`, `seed_count`, `engine` — the run manifest event provides full accountability without pixel storage.
- [x] **10-10** `test_manifest.py` verifies the full round-trip: write manifest → re-render → byte-identical to direct render, for both sequential and strided seeds.
- [ ] **10-11** The manifest format is a single flat JSON object (not JSON Lines as described in `docs/ARCHITECTURE.md`) — there is a schema mismatch between the documented format (`{"schema": "ceae-manifest/1", …, "ranges": […]}`) and the implemented format (`{"engine_version": …, "seed_start": …, "count": …}`). **HIGH**
- [ ] **10-12** `space_hash` is listed as a mandatory field in the `docs/ARCHITECTURE.md` manifest schema but is absent from the current `write_manifest` implementation. The consumer integrity check described in the docs cannot be performed. **HIGH**
- [ ] **10-13** No `picks` field exists in the current manifest implementation — the "curation ledger" concept from `docs/AESTHETIC-LINEAGE.md` §3 and `docs/ARCHITECTURE.md` is not yet implemented. **MEDIUM**
- [ ] **10-14** `--manifest` and `--out` cannot be combined cleanly — the code comment (lines 253–257) explicitly notes the ambiguity and skips PNG output when `--manifest` is given. This is a UX regression from the documented behavior. **LOW**
- [ ] **10-15** No disk-space pre-check exists before starting a write run — `docs/SECURITY-NOTES.md` §1 lists this as a "planned mitigation" (pre-flight estimate + `shutil.disk_usage`), but it is not implemented. **MEDIUM**
- [ ] **10-16** No sharded directory structure (`dirs of 10k`) is implemented — all output files are written to a single flat directory. For `--count 1_000_000`, a directory with 1M files is a filesystem hazard on most OS. **HIGH**
- [ ] **10-17** No `.tar` / WebDataset shard output exists — T-005 is in Backlog; training pipelines expecting sharded data have no supported path. **MEDIUM**
- [ ] **10-18** `write_bytes` for PNGs is not atomic (see Section 9-18); no temp-file-then-rename pattern is used. **MEDIUM**
- [ ] **10-19** Manifest `seed_start` is stored as a plain JSON integer (line 175 of `glyph_engine.py`); seeds near 2^63 will parse correctly in Python but may lose precision when read by JSON parsers in other languages (see Section 2-19). **HIGH**
- [ ] **10-20** No `--resume` or `--skip-existing` flag exists; a crashed run cannot be resumed without re-rendering all seeds from the beginning. T-006 (resume-after-crash) is in Backlog. **MEDIUM**

**Section 10 score: 10/20**

---

## Section 11 — Error Handling & Edge Cases

- [x] **11-01** `parse_seed` in `core/src/main.rs` handles both decimal and `0x`/`0X`-hex prefixes, returning `None` on parse failure with a clean error message and `process::exit(2)`. **
- [x] **11-02** `_load_font` falls back to `ImageFont.load_default(size=px)` when `path` is `None` — the engine degrades gracefully if no system fonts are found.
- [x] **11-03** `discover_fonts()` returns `[None]` (not an empty list) when no candidates are found — the downstream `rng.randrange(len(fonts))` works correctly (returns 0) and `_load_font(None, px)` uses the Pillow default.
- [x] **11-04** `max(px, 4)` guard in `render()` (line 123) prevents a zero or negative font size from reaching FreeType.
- [x] **11-05** The contrast re-roll is bounded at 8 iterations — the loop always terminates even if no contrast-passing pair is found; the last `bg` is used unconditionally after 8 re-rolls.
- [x] **11-06** `--from-manifest` path checks `engine_version` mismatch and emits a `WARNING` (not a crash) — correct defensive behaviour for forward compatibility.
- [x] **11-07** `read_manifest` uses `json.loads(Path(path).read_text(...))` — `JSONDecodeError` propagates as an unhandled exception with a clear Python traceback; acceptable at PoC stage.
- [x] **11-08** `build_seeds` with `count=0` returns an empty list — no crash, no render loop iteration; consistent behaviour.
- [ ] **11-09** No validation of `--count` as a positive integer — `--count 0` silently produces no output; `--count -1` raises a `range` error inside `build_seeds` at runtime rather than at argument-parse time. **LOW**
- [ ] **11-10** `--size 0` or `--size 1` would be accepted by argparse and passed to `render()`; `canvas=0` would create a 0×0 image and `side=0` causing division behaviour in `margin = (side - canvas) // 2` = 0 — not a crash but produces a 0×0 PNG silently. **LOW**
- [ ] **11-11** `--stride 0` is accepted; `build_seeds(start, count, stride=0)` would produce `[start] * count` — all seeds identical — without any warning. This is arguably valid (same-seed batch) but is almost certainly an error when passed accidentally. **LOW**
- [ ] **11-12** `--seed` argument uses `lambda s: int(s, 0)` — a non-integer string raises `ValueError` from argparse with a message like "invalid int(s, 0) value: 'abc'"; this error message is not user-friendly. **INFO**
- [ ] **11-13** No error is raised if `--from-manifest` points to a non-existent file — `Path(path).read_text()` raises `FileNotFoundError` with a Python traceback. A pre-check with a user-friendly error would improve UX. **LOW**
- [ ] **11-14** Font loading errors (corrupted `.ttf` file) are not caught — `ImageFont.truetype()` raises `OSError`; the engine crashes with a traceback. A try/except with a skip-and-warn fallback to the Pillow default would be more robust. **MEDIUM**
- [ ] **11-15** Disk-full errors during PNG write (`write_bytes`) propagate as unhandled `OSError` — the run aborts mid-way with no partial-run manifest written. **MEDIUM**
- [ ] **11-16** No per-seed error isolation exists — if any single `render()` call raises (e.g., a memory error), the entire run aborts rather than logging the failed seed and continuing. **MEDIUM**
- [ ] **11-17** The `--manifest` path in `main()` returns early (line 257) before any PNGs are written — if the user intended to write both manifest and PNGs, they get only the manifest with no warning. The comment acknowledges this ambiguity but the UX is surprising. **LOW**
- [ ] **11-18** `emit_run_manifest` in `logging_config.py` computes `seed_end = (seed_start + seed_count) & mask` — if `seed_start` is 0 and `seed_count` is 0, `seed_end` is correctly 0; but if `seed_count` is negative (a bug upstream), `seed_end` would underflow with no exception. **INFO**
- [ ] **11-19** No validation that `canvas` in a re-manifest render matches the machine's memory capacity — a manifest specifying `canvas=16384` would allocate ~3 GB for a single image layer. **LOW**
- [ ] **11-20** The `--benchmark` and `--from-manifest` flags are mutually exclusive in practice (benchmark ignores `--from-manifest`; the order of `if` checks in `main()` means `--from-manifest` is processed first) — but this priority is not documented in `--help` output. **INFO**

**Section 11 score: 8/20**

---

## Section 12 — Input Validation & CLI Robustness

- [x] **12-01** `--seed` uses `lambda s: int(s, 0)` — accepts both decimal and `0x`-hex, consistent with the documented "`u64`; decimal or 0x-hex" interface.
- [x] **12-02** `--stride` uses the same `lambda s: int(s, 0)` — consistent with `--seed`.
- [x] **12-03** `argparse` handles missing required arguments and unknown flags with built-in error messages — standard Python CLI safety.
- [x] **12-04** `--out` defaults to `"out"` — a reasonable safe default that does not overwrite existing system directories.
- [x] **12-05** `--size` defaults to 256 — a safe, documented default matching the benchmark and test suite.
- [x] **12-06** `--count` defaults to 10 — conservative default, not a DoS risk at the default.
- [x] **12-07** `--benchmark` is a boolean store-true flag — cannot be set to a dangerous value.
- [x] **12-08** `main()` accepts `argv: list[str] | None = None` — allows CLI args to be injected in tests without subprocess; confirmed used in `test_determinism.py::test_cli_two_runs_byte_identical`.
- [ ] **12-09** No upper bound on `--count` — `--count 10_000_000_000` is accepted; disk exhaustion is the only limit. `docs/SECURITY-NOTES.md` acknowledges this and lists a `--max-disk-gb` flag as a planned mitigation. **HIGH**
- [ ] **12-10** No upper bound on `--size` — `--size 65536` would allocate a 98,304×98,304 RGBA layer (~36 GB); the engine would likely OOM. **HIGH**
- [ ] **12-11** `--stride` accepts 0 (see 11-11) and negative values without error. **LOW**
- [ ] **12-12** `--count` accepts 0 and negative values — `--count -5` produces an empty seeds list silently (no error). **LOW**
- [ ] **12-13** `--manifest` accepts a path that points to an existing directory — `Path(path).write_text(...)` would raise `IsADirectoryError` on POSIX with a raw traceback. **LOW**
- [ ] **12-14** `--from-manifest` does not validate the JSON schema — a manifest missing the `stride` key would raise `KeyError` with a raw traceback rather than a user-friendly error. **LOW**
- [ ] **12-15** `--out` does not validate that the specified directory is writable before starting the render loop — the first file write would fail after potentially thousands of renders. **LOW**
- [ ] **12-16** The `--help` output for `--manifest` says "Use `--out /dev/null` (or omit --out) with `--manifest` to skip PNG output" — `/dev/null` is a POSIX path; on Windows this would create a file named `/dev/null`. **MEDIUM**
- [ ] **12-17** No `--version` flag exists — users cannot check the engine version without running `--benchmark` or `--count 0`. **LOW**
- [ ] **12-18** Error messages from argparse failures (e.g., invalid `--seed`) go to stderr via argparse's default handler — consistent with the tool's structured-log-to-stderr design, but the error is plain text rather than JSON. **INFO**
- [ ] **12-19** The CLI does not validate that `--from-manifest` and `--seed`/`--count`/`--stride`/`--size` are not simultaneously passed; conflicting args are silently ignored (manifest takes precedence). **LOW**
- [ ] **12-20** No `--dry-run` flag exists to estimate output size and time without writing any files — useful for validating large `--count` runs before committing disk space. **INFO**

**Section 12 score: 8/20**

---

## Section 13 — Security & Resource Safety

- [x] **13-01** Font files are loaded only from the frozen `_FONT_CANDIDATES` allow-list — no user-supplied font path is accepted (confirmed by inspection); documented in `docs/SECURITY-NOTES.md` §2.
- [x] **13-02** No network calls anywhere in the render or manifest path — confirmed by inspection of all imports in `glyph_engine.py` (`argparse`, `colorsys`, `io`, `json`, `random`, `time`, `pathlib`, `numpy`, `PIL` — all local).
- [x] **13-03** Seeds are not treated as secrets — `docs/SECURITY-NOTES.md` §6 explicitly documents this design decision and warns against repurposing the sampler as a CSPRNG.
- [x] **13-04** `SECURITY.md` is present with a vulnerability reporting email and 72-hour acknowledgement SLA — correct responsible disclosure process.
- [x] **13-05** All GitHub Actions workflows use `permissions: contents: read` at the top level; no workflow has elevated write permissions except CodeQL which scopes `security-events: write` to that job only.
- [x] **13-06** `CODEOWNERS` ensures every PR requires a review from `@0thernes` — no unreviewed merges.
- [x] **13-07** Dependabot is configured for all three ecosystems (github-actions, pip, cargo) on a weekly schedule.
- [x] **13-08** `make audit` target runs `pip-audit -r poc/requirements.txt` — a CVE check step exists in the developer workflow.
- [x] **13-09** `core/Cargo.toml` has zero dependencies — the Rust core has no supply-chain surface area beyond the Rust standard library.
- [x] **13-10** Generated PNG output is not executed — the engine is a data generator, not a code executor; no eval/exec calls exist.
- [ ] **13-11** `--count` has no upper bound — `--count 1_000_000_000` can be passed without warning, enabling accidental disk exhaustion. **HIGH** (acknowledged; planned `--max-disk-gb` mitigation not yet implemented)
- [ ] **13-12** FreeType supply-chain risk: Pillow bundles FreeType; a compromised PyPI Pillow wheel could deliver a malicious FreeType binary. Hash-pinning (`requirements-lock.txt` with `--hash`) is listed as "planned for production" in `docs/SECURITY-NOTES.md` §4 but is not yet implemented. **HIGH**
- [ ] **13-13** `pip install -r poc/requirements.txt` in CI does not use `--require-hashes` — supply-chain integrity of Pillow and NumPy wheels is unverified on every CI run. **HIGH**
- [ ] **13-14** `pip-audit` is in `make audit` but is not wired into the CI workflow (`ci.yml`) — CVE checks are not automated in CI, only in developer make targets. **MEDIUM**
- [ ] **13-15** `cargo audit` is not wired into the CI workflow either — the Rust audit is only run via `make audit`. **MEDIUM** (low risk currently since `core/` has zero deps, but the pattern should be established)
- [ ] **13-16** The `--out` directory is created with `mkdir(parents=True, exist_ok=True)` using default OS permissions — on shared systems this could create a world-readable output directory containing generated images. **LOW**
- [ ] **13-17** No rate limiting or max-runtime wall-clock guard exists — the engine will run for hours on a large `--count` with no progress indicator or kill-switch. **MEDIUM**
- [ ] **13-18** The `logs/` directory is gitignored for `*.log` files but not for other file types — a future log writer that uses a non-`.log` extension would accidentally commit log files. **INFO**
- [ ] **13-19** `logging_config.py` includes `record.process` (PID) in every log line — PID can be used for process-level side-channel timing attacks in adversarial contexts. For a local art tool this is INFO-level only. **INFO**
- [ ] **13-20** No sandboxing of the render process exists — a malicious FreeType exploit through a corrupted system font would have full process privileges. **LOW** (mitigated by the allow-list; sandboxing is out of scope for a local tool)

**Section 13 score: 10/20**

---

## Section 14 — Dependencies & Supply Chain

- [x] **14-01** Python runtime dependencies are minimal: only `pillow>=10.1` and `numpy>=1.26` in `poc/requirements.txt`.
- [x] **14-02** Rust `core/` has zero dependencies (`[dependencies]` is empty in `Cargo.toml`) — explicitly by design, documented with a comment.
- [x] **14-03** Dependabot is configured for `pip` (directory `/poc`), `cargo` (directory `/core`), and `github-actions` (directory `/`) — full coverage of all three dependency ecosystems.
- [x] **14-04** Both `pillow` and `numpy` are MIT/BSD-licensed — compatible with the project's MIT license.
- [x] **14-05** `make audit` runs `pip-audit` against `poc/requirements.txt` — a CVE-check workflow exists in the developer toolchain.
- [x] **14-06** `Cargo.lock` is committed (confirmed by file listing) — Rust dependency resolution is reproducible.
- [x] **14-07** The CI workflow installs `pip install -r poc/requirements.txt ruff pytest` — test dependencies are co-installed from the canonical requirements file.
- [x] **14-08** Pre-commit hooks include `ruff` and `cargo fmt` — static analysis is wired into the commit workflow.
- [x] **14-09** New Rust dependencies require an ADR per `CONTRIBUTING.md` — governance gate on dependency additions.
- [ ] **14-10** `poc/requirements.txt` uses minimum-version pins (`>=`) not exact-version pins — reproducible builds are not guaranteed; two fresh installs on different dates may yield different Pillow/NumPy versions. **HIGH**
- [ ] **14-11** No `requirements-lock.txt` or `pip-compile` output exists — no lockfile for Python dependencies. **HIGH**
- [ ] **14-12** `pip-audit` is not run in CI — it is only in `make audit`. CVE regressions in Pillow/NumPy are not automatically flagged on every PR. **MEDIUM**
- [ ] **14-13** `pre-commit-config.yaml` pins `pre-commit-hooks` at `v4.6.0` and `ruff-pre-commit` at `v0.4.9` — but these are not automatically updated by Dependabot (pre-commit hooks are not a Dependabot ecosystem). Stale hook versions over time. **LOW**
- [ ] **14-14** The CI workflow uses `actions/checkout@v4` and `actions/setup-python@v5` by commit tag (major version only, not SHA-pinned) — a compromised `@v4` tag could inject malicious code on future runs. **MEDIUM**
- [ ] **14-15** `dtolnay/rust-toolchain@stable` in CI uses the `stable` floating tag — a Rust toolchain upgrade could change compiler behaviour; pinning to a specific stable version would be more reproducible. **LOW**
- [ ] **14-16** No SBOM (Software Bill of Materials) is generated — for a tool producing datasets intended for AI training, an SBOM would support downstream provenance claims. **LOW**
- [ ] **14-17** `colorsys` and `json`, `io`, `argparse` are Python stdlib modules — no version concerns, but they are not listed in `poc/requirements.txt` (correct, as they are stdlib). However, `poc/logging_config.py` is not listed as an installable dependency — it can only be used by relative import from within the repo. **INFO**
- [ ] **14-18** No dependency on a pinned Python version beyond `python-version: "3.12"` in CI — `poc/glyph_engine.py` uses `from __future__ import annotations` and `list[str] | None` syntax (PEP 604) which requires Python 3.10+; a `python_requires = ">=3.10"` in a `pyproject.toml` would make this explicit. **LOW**
- [ ] **14-19** No `pyproject.toml` or `setup.py` exists — the package is not installable as a Python package. A `pyproject.toml` would enable `pip install -e .` and formal dependency declaration. **LOW**
- [ ] **14-20** Font files (Arial, Times New Roman, Consolas, etc.) are Windows-licensed fonts loaded from the system; their licences do not permit redistribution of rendered glyphs in all commercial contexts. `docs/FAQ.md` acknowledges this caveat, but there is no automated check or guardrail. **MEDIUM**

**Section 14 score: 9/20**

---

## Section 15 — Testing Strategy & Coverage

- [x] **15-01** `tests/test_determinism.py` has 5 tests covering: params idempotency, byte-identity within process, render-order independence, different seeds differ, CLI two-run byte-identity — comprehensive for the core contract.
- [x] **15-02** `tests/test_manifest.py` has 5 tests covering: manifest write/read, sequential round-trip, strided round-trip, CLI `--manifest` write, `--stride 1` byte-identity.
- [x] **15-03** `tests/test_sampler_uniformity.py` has 3 tests covering: full range span, rough uniformity (strided), rough uniformity (sequential).
- [x] **15-04** `core/src/lib.rs` has 6 inline `#[cfg(test)]` tests: same-seed-same-params, adjacent-seeds-differ, params-within-bounds, cardinality-exceeds-1e21, lemire-bounds-many-seeds, lemire-near-uniform-small-n.
- [x] **15-05** All 13 Python tests pass on the current HEAD (verified: `pytest -q tests` → `13 passed in 0.63s`).
- [x] **15-06** CI runs the full test suite on every push and PR — automated enforcement.
- [x] **15-07** Tests use `tmp_path` (pytest fixture) for filesystem tests — no pollution of the working directory.
- [x] **15-08** Test seeds cover boundary conditions: 0 (zero), 1 (unit), 42 (nominal), 0xDEADBEEF (hex notable), 2^63+12345 (near-overflow) — documented in `docs/TESTING.md`.
- [x] **15-09** `docs/TESTING.md` provides a test pyramid (unit → determinism → golden-digest → E2E) and explains the rationale at each level.
- [x] **15-10** Mock policy is documented: no mocking of fonts or RNG — real system fonts and real RNG are tested to avoid defeating the determinism purpose.
- [ ] **15-11** No golden-seed digest test (`tests/test_golden_digests.py`) exists — T-002 is in "Ready" but unimplemented. This is the key cross-machine and cross-version determinism guard. **HIGH**
- [ ] **15-12** No `tests/fixtures/` directory exists — the fixture file `golden_digests.json` required by T-002 has not been seeded. **HIGH**
- [ ] **15-13** No code-coverage measurement is automated in CI — `pytest --cov` is mentioned in `docs/TESTING.md` but is not in the CI workflow. Coverage could silently regress. **MEDIUM**
- [ ] **15-14** The `noise=0` and `rotation=0` branches in `render()` (lines 132 and 137) are not explicitly tested in isolation — they are covered incidentally but not as explicit test cases. **LOW**
- [ ] **15-15** No test for the `--size` parameter boundary — `--size 1`, `--size 0`, and large sizes are not covered. **LOW**
- [ ] **15-16** No test for `discover_fonts()` when no system fonts exist (the `[None]` fallback path) — this path is untested in CI where DejaVu fonts are present. **LOW**
- [ ] **15-17** No property-based testing (e.g., Hypothesis) exists — the determinism property `render(s) == render(s)` for all valid s is only tested for 5 hand-picked seeds. **LOW**
- [ ] **15-18** No test for `logging_config.py` — the JSON formatter, field emission, and `emit_run_manifest` function are completely untested. **MEDIUM**
- [ ] **15-19** No test for `--stride 0`, `--count 0`, `--count -1`, or `--size 0` edge cases. **LOW**
- [ ] **15-20** No performance regression test exists — the benchmark CI job is `continue-on-error: true` and prints a number but asserts nothing. A 10× regression would pass CI. **MEDIUM**

**Section 15 score: 10/20**

---

## Section 16 — CI/CD & Quality Gates

- [x] **16-01** `ci.yml` has three jobs: `python` (lint + tests), `rust-core` (fmt + clippy + test), and `benchmark` (non-blocking smoke check) — covers both language stacks.
- [x] **16-02** The `python` job fails on ruff lint errors — `ruff check poc tests` is a blocking gate.
- [x] **16-03** The `rust-core` job runs `cargo fmt --check`, `cargo clippy -- -D warnings`, and `cargo test` — all three are blocking gates.
- [x] **16-04** `codeql.yml` runs GitHub's CodeQL static analysis on Python on every push, PR, and weekly schedule.
- [x] **16-05** `links.yml` runs lychee link checker on all Markdown files weekly and on PRs.
- [x] **16-06** CI uses `concurrency: cancel-in-progress: true` — stale runs on the same ref are automatically cancelled to save runner minutes.
- [x] **16-07** Dependabot is configured for all three ecosystems (github-actions, pip, cargo) on a weekly schedule.
- [x] **16-08** All workflows use `permissions: contents: read` at the top level — least-privilege default.
- [x] **16-09** `dtolnay/rust-toolchain@stable` is used for Rust CI — automatically tracks the latest stable Rust, avoiding stale toolchain issues.
- [x] **16-10** Pre-commit hooks (`trailing-whitespace`, `end-of-file-fixer`, `check-yaml`, `check-json`, `check-toml`, `check-merge-conflict`, `mixed-line-ending`) enforce code hygiene at commit time.
- [ ] **16-11** `pip-audit` is not wired into CI — CVE checks require manual `make audit`. **MEDIUM**
- [ ] **16-12** `cargo audit` is not wired into CI — for a zero-dep crate this is low risk now but should be established as a pattern before dependencies are added. **LOW**
- [ ] **16-13** No `pytest --cov` coverage gate in CI — coverage can silently drop to 0% without failing CI. **MEDIUM**
- [ ] **16-14** The benchmark CI job uses `--count 50` — too small for a statistically reliable throughput reading; variance can be 10–20% at this sample size. **LOW**
- [ ] **16-15** The benchmark CI job is `continue-on-error: true` — a complete benchmark crash (e.g., import error, OOM) would not fail CI. A blocking smoke check with a very low floor (e.g., ≥1 img/s) would catch catastrophic regressions. **LOW**
- [ ] **16-16** No Windows CI runner exists — the dev workstation is Windows 11, CI is `ubuntu-latest` only; cross-OS issues (font paths, line endings, `multiprocessing` spawn) are not CI-gated. **MEDIUM**
- [ ] **16-17** GitHub Actions workflow files are pinned to major version tags (`@v4`, `@v5`, `@v3`) rather than full SHA commits — supply-chain risk if a tag is moved. **MEDIUM**
- [ ] **16-18** No branch protection rules are documented (though `CODEOWNERS` and CI are configured) — it is unclear whether CI passing is required before merging. **LOW**
- [ ] **16-19** The `links.yml` lychee checker excludes `github.com/0thernes/chaos-entropy-art-engine` — if the repo has not yet been created at that slug, all badge links in README fail silently. **INFO**
- [ ] **16-20** No CD (Continuous Deployment) pipeline exists — appropriate for a PoC, but a release tagging workflow and PyPI publication path are not planned even for v1. **INFO**

**Section 16 score: 10/20**

---

## Section 17 — Build/Release & Engine-Version Discipline

- [x] **17-01** `ENGINE_VERSION = "ceae-poc/0.1.0"` is the authoritative version string in `poc/glyph_engine.py`; it is printed on every stdout line and written into manifests.
- [x] **17-02** `CHANGELOG.md` has entries for all three versions (0.1.0, 0.1.1, 0.1.2) with dated, specific change descriptions and verification evidence.
- [x] **17-03** `docs/ARCHITECTURE.md` explicitly states that "changing any table is a breaking change" and bumps the version — the versioning contract is documented.
- [x] **17-04** `docs/CONTRIBUTING.md` states "Any change to the renderer that alters the bytes produced for an existing seed is a **breaking change** and must bump the engine version".
- [x] **17-05** `ADR 0001` documents the ADR process and names three anticipated future ADRs (0002: CPU canonical, 0003: Python/Rust separate versions, 0004: manifest schema v1).
- [x] **17-06** `core/Cargo.toml` version is `0.1.0` — consistent with the project's SemVer stage; the Rust core is its own engine version per the documented design.
- [x] **17-07** The Rust `main.rs` prints `"ceae-core/0.1.0 (skeleton)"` — the "(skeleton)" suffix correctly signals non-functional status; this string is separate from the Python `ENGINE_VERSION`.
- [x] **17-08** `docs/ROADMAP.md` defines clear phase acceptance criteria with `[x]`/`[ ]` checkboxes — version advancement is gated on observable criteria, not vague readiness.
- [ ] **17-09** `ENGINE_VERSION` is duplicated in `poc/logging_config.py` (line 23) without importing from `glyph_engine.py` — a version bump must be applied in two files; no test catches a mismatch. **MEDIUM**
- [ ] **17-10** No automated check verifies that `CHANGELOG.md` has been updated before a merge — a change could ship without a changelog entry. **LOW**
- [ ] **17-11** `SeedSpace::POC_V1.glyphs = 518` is hardcoded in Rust without a programmatic link to the Python `GLYPHS` list — the two can diverge without any test catching it. **MEDIUM**
- [ ] **17-12** No version tag in git exists yet (confirmed: this is a fresh repo); the first `git tag v0.1.0` has not been applied. **LOW**
- [ ] **17-13** No `pyproject.toml` or `setup.cfg` declares the Python package version — the `ENGINE_VERSION` string is the only version artifact; it cannot be queried via `pip show`. **LOW**
- [ ] **17-14** The `space_hash` field in manifests is `"sha256:pending"` — a verifying consumer cannot currently check axis integrity. No mechanism to compute the actual hash exists in the codebase. **HIGH**
- [ ] **17-15** No release workflow (`release.yml`) exists — creating a GitHub Release is a manual process with no automated artefacts (wheel, changelog extraction, tag). **INFO**
- [ ] **17-16** The anticipated ADRs 0002, 0003, 0004 have not been written — they are listed as "to be formalised when touched" but several of the decisions (CPU-is-canonical, Python/Rust separate versions) are already in production and should be recorded. **LOW**
- [ ] **17-17** No migration guide exists for consumers who have manifests from an older engine version — when `ENGINE_VERSION` is bumped, consumers have no documented upgrade path. **MEDIUM**
- [ ] **17-18** `CHANGELOG.md` format follows "Keep a Changelog" but the `[Unreleased]` section is empty — no tracking of in-progress changes against the next release. **INFO**
- [ ] **17-19** No `docs/benchmarks/` directory or benchmark record file exists despite `docs/TESTING.md` stating "benchmark output is committed to `docs/` as a named record whenever a performance change is made". **LOW**
- [ ] **17-20** The `ceae-poc/0.1.0` version string implies a PoC namespace; the migration path to `ceae-core/1.0.0` (when the Rust fast path is production-ready) is undocumented. **INFO**

**Section 17 score: 8/20**

---

## Section 18 — Documentation Completeness

- [x] **18-01** `docs/ARCHITECTURE.md` covers all five pipeline stages, the combinatoric space, the manifest format, and the GPU vs CPU decision rationale — comprehensive for the current implementation.
- [x] **18-02** `docs/THROUGHPUT.md` provides first-principles budget calculations, measured baselines, and projections for multiprocess and Rust paths — well-documented.
- [x] **18-03** `docs/TESTING.md` documents the test pyramid, what is mocked vs real, coverage targets, how to run, and CI gating — complete for the current suite.
- [x] **18-04** `docs/SECURITY-NOTES.md` documents assets, trust boundaries, all risk categories, and planned mitigations — thorough for a PoC.
- [x] **18-05** `docs/OBSERVABILITY.md` specifies the structured JSON log schema, all fields, log levels, file conventions, and cross-platform comparison protocol.
- [x] **18-06** `docs/ROADMAP.md` has three phases with explicit, measurable acceptance criteria and `[x]`/`[ ]` tracking.
- [x] **18-07** `docs/FAQ.md` answers 9 specific questions about the engine's design, claims, and status — good external-facing documentation.
- [x] **18-08** `docs/AESTHETIC-LINEAGE.md` documents the conceptual ancestry from 0thernes's practice with citations to the CC-licensed corpus.
- [x] **18-09** `docs/AUDIT.md` is a self-audit checklist with 7 sections and 37 items specific to this codebase.
- [x] **18-10** `docs/backlog/` has detailed cards for 9 backlog items (T-001 through T-015, minus gaps) with context, acceptance criteria, and estimates.
- [ ] **18-11** `docs/ARCHITECTURE.md` manifest schema section shows the `ceae-manifest/1` JSON Lines format but this differs from the implemented `write_manifest` format — the documentation and implementation are out of sync. **HIGH**
- [ ] **18-12** `README.md` docs index table lists `docs/AUDIT.md` but does not reference `docs/AUDIT-500.md` (this document) — the index will need updating after this audit is committed. **LOW** (being fixed by this task)
- [ ] **18-13** No API reference documentation exists for `poc/glyph_engine.py` public functions — docstrings are present for key functions (`sample_params`, `render`, `encode_png`, etc.) but no rendered HTML/Markdown reference. **LOW**
- [ ] **18-14** `docs/adr/` has only ADR 0001; the anticipated ADRs 0002–0004 are referenced but not written. **LOW**
- [ ] **18-15** No inline code comments exist for the `_lattice_color` hue range exclusion of 1.0 (see 5-12) or the deliberate `h = rng.randrange(256) / 256.0` design choice. **INFO**
- [ ] **18-16** `poc/logging_config.py` has a module-level docstring and function docstrings but the `_JsonFormatter` and `_LOGGING_RESERVED` internals are undocumented. **INFO**
- [ ] **18-17** `docs/THROUGHPUT.md` §3 table references "measured" numbers from the dev workstation but no benchmark record file exists in the repo to independently verify those numbers. **LOW**
- [ ] **18-18** The `docs/KANBAN.md` WIP limit rationale and board are documented, but there is no process document for how items move from Backlog to Ready (acceptance criteria requirements). **INFO**
- [ ] **18-19** No changelog entry policy (e.g., "every PR must update CHANGELOG.md") exists in `CONTRIBUTING.md`. **LOW**
- [ ] **18-20** The `CODE_OF_CONDUCT.md` is present but its content is referenced without quoting — readers must check the file for the actual conduct standards. This is intentional (avoids reproducing copyrighted text), but a link to the Contributor Covenant with a version citation would be clearer. **INFO**

**Section 18 score: 10/20**

---

## Section 19 — API/Interface Design (Python + Rust)

- [x] **19-01** `render(seed, canvas, fonts)` signature is clean — three required arguments, no mutable globals, pure function. Return type is `Image.Image`.
- [x] **19-02** `sample_params(seed, fonts)` returns a plain `dict` — simple, inspectable, serialisable. The contract (draw order = version) is documented in the docstring.
- [x] **19-03** `encode_png(img)` takes a `PIL.Image` and returns `bytes` — minimal, composable interface.
- [x] **19-04** `build_seeds(seed_start, count, stride)` is a standalone reusable helper — correctly separated from the render loop.
- [x] **19-05** `write_manifest` and `read_manifest` use keyword-only arguments (`*`) for all non-path parameters — prevents positional argument confusion.
- [x] **19-06** Rust `SeedSpace::sample(seed: u64) -> GlyphParams` is a pure function on a `Copy` struct — idiomatic Rust, zero allocation, thread-safe.
- [x] **19-07** `SeedSpace::POC_V1` is a `pub const` — consumers can reference it without constructing their own space, and it is clearly named as the versioned space.
- [x] **19-08** `main()` in `glyph_engine.py` accepts `argv: list[str] | None = None` — testable without subprocess, correct Python CLI pattern.
- [x] **19-09** `get_logger` in `logging_config.py` caches by name and is idempotent — safe to call multiple times.
- [x] **19-10** `emit_run_manifest` provides a structured API for the run accountability event rather than requiring callers to construct the dict manually — good encapsulation.
- [ ] **19-11** `sample_params` returns a `dict` with string keys — callers must know the key names by convention (`"glyph"`, `"font"`, `"size_step"`, etc.). A `NamedTuple` or `dataclass` would provide IDE autocomplete, type checking, and `__repr__`. **LOW**
- [ ] **19-12** `discover_fonts()` returns `list[str | None]` — the `None` sentinel for "use Pillow default" is implicit; a `Optional[str]` return type annotation is present but the semantics of `None` are not documented in the function signature. **INFO**
- [ ] **19-13** `render()` and `sample_params()` both take `fonts: list[str | None]` — callers must call `discover_fonts()` themselves; there is no `render_with_seed(seed, canvas)` convenience wrapper that handles font discovery internally. **LOW**
- [ ] **19-14** The Python `_font_cache` is a module-level global — it is implicitly shared across all render calls in the same process. This is correct for the current use case but is not visible to the caller; a `Renderer` class with a font cache as an instance variable would make the statefulness explicit. **LOW**
- [ ] **19-15** Rust `GlyphParams` stores color axes as raw u32 indices rather than resolved RGB values — consumers of the Rust API must separately look up the color from the axis table; the table is not yet accessible from the public API. **MEDIUM**
- [ ] **19-16** No Python bindings for the Rust `SeedSpace` API exist or are planned in the near term — the two engines have no interoperability layer. **INFO**
- [ ] **19-17** `write_manifest` accepts `path: str | Path` but returns `None` — there is no confirmation of successful write (no return of the written bytes or the resolved path). **INFO**
- [ ] **19-18** No `__all__` is defined in `glyph_engine.py` — wildcard imports would expose private names like `_load_font`, `_lattice_color`, `_luma`, `_font_cache`. **INFO**
- [ ] **19-19** The manifest format has no versioned schema field in the current implementation (`engine_version` is present but the schema version `"ceae-manifest/1"` documented in `docs/ARCHITECTURE.md` is absent) — consumers cannot distinguish schema versions. **HIGH**
- [ ] **19-20** No public changelog of breaking API changes is maintained — callers who import `glyph_engine.py` as a library have no way to know when a draw-order change constitutes a breaking API change vs a new feature. **LOW**

**Section 19 score: 10/20**

---

## Section 20 — Code Style / Lint / Formatting

- [x] **20-01** `ruff check poc tests` is run in CI on every push — Python linting is enforced as a blocking CI gate.
- [x] **20-02** `ruff format --check poc tests` is run in `make lint` — Python formatting is enforced in the developer workflow.
- [x] **20-03** `cargo fmt --check` is run in CI and in pre-commit hooks — Rust formatting is enforced.
- [x] **20-04** `cargo clippy -- -D warnings` is run in CI — Rust lint warnings are treated as errors.
- [x] **20-05** `pre-commit-config.yaml` includes `trailing-whitespace`, `end-of-file-fixer`, `mixed-line-ending` — universal hygiene hooks are active.
- [x] **20-06** `poc/glyph_engine.py` uses `from __future__ import annotations` for forward-compatible type annotations — correct for Python 3.10+ compatibility.
- [x] **20-07** Private helpers (`_load_font`, `_lattice_color`, `_luma`, `_font_cache`) use the conventional single-underscore prefix — correct Python style.
- [x] **20-08** Module-level constants use `ALL_CAPS` naming (`ENGINE_VERSION`, `NOISE_SALT`, `GLYPHS`) — correct Python convention.
- [x] **20-09** Rust code uses `#[inline]` on `lemire_reduce` and `splitmix64` — appropriate for hot-path functions that are called from a tight loop.
- [x] **20-10** Rust `#[cfg(test)]` module is at the bottom of `lib.rs` — standard Rust organisation.
- [ ] **20-11** `poc/logging_config.py` imports `time` (line 18) but `time` is never used in the module — a dead import. Ruff should catch this as `F401`; the fact that it does not is suspicious (ruff may be configured to skip it, or the import was added for a planned feature). **LOW**
- [ ] **20-12** No `ruff.toml` or `[tool.ruff]` section in `pyproject.toml` exists — ruff runs with all-default settings. Explicit configuration (target Python version, enabled rule sets) would make lint behaviour reproducible across ruff versions. **LOW**
- [ ] **20-13** `glyph_engine.py` line 205 comment ("To keep the API simple we always skip PNG when `--manifest` is given alone.") contradicts the argparse comment above it about detecting explicit `--out` — the comment is confusing and should be clarified. **INFO**
- [ ] **20-14** The `_LOGGING_RESERVED` frozenset in `logging_config.py` (lines 51–56) has no comment explaining why these specific attributes are excluded — maintainers may wonder if the list is complete or how to update it. **INFO**
- [ ] **20-15** `Makefile` mixes tab-indented recipe lines (correct) with `@echo` calls and `@command -v` checks — consistent style but the `||` fallback pattern for Windows/POSIX venv activation (line 31) is not idiomatic for either shell and may fail in some environments. **LOW**
- [ ] **20-16** No `editorconfig` lint check is in CI — `.editorconfig` is present but is advisory only; divergent editors could silently produce non-conforming files. **INFO**
- [ ] **20-17** Rust `main.rs` uses `std::env::args().nth(1)` — correct, but there is no `clap` or `pico-args` CLI library; for a production CLI this would need to be upgraded. Noted as future tech debt. **INFO**
- [ ] **20-18** `poc/glyph_engine.py` has no explicit `# type: ignore` comments — the code is clean from a type annotation perspective, but `mypy` is not run in CI and strict type checking is unverified. **INFO**
- [ ] **20-19** `pre-commit-config.yaml` pins `ruff-pre-commit` at `v0.4.9` while CI installs ruff via `pip` without version pinning — ruff version in pre-commit and in CI may diverge, causing discrepancies in lint results. **LOW**
- [ ] **20-20** `check-toml` hook in pre-commit would catch malformed `Cargo.toml` — but `check-json` hook scope is not specified; it runs on all `.json` files including test fixture JSON files. If a test writes a non-pretty-printed JSON fixture and pre-commit reformats it, it could silently alter the fixture. **INFO**

**Section 20 score: 10/20**

---

## Section 21 — Architecture & Module Boundaries

- [x] **21-01** The `poc/` and `core/` directories implement separate engine versions with no cross-language import — the boundary is clean and documented.
- [x] **21-02** `poc/glyph_engine.py` is a single-file module; all public functions (`render`, `sample_params`, `encode_png`, `build_seeds`, `write_manifest`, `read_manifest`, `discover_fonts`) are accessible without a package structure — appropriate for PoC scale.
- [x] **21-03** `poc/logging_config.py` is a separate module for structured logging — correct separation of concerns; render logic does not call `get_logger` (confirmed by inspection).
- [x] **21-04** `docs/ARCHITECTURE.md` defines five clearly scoped pipeline stages (space definition, sampler, rasterizer, augmentation, sink) — the architectural decomposition is documented.
- [x] **21-05** `core/src/lib.rs` (library) and `core/src/main.rs` (binary entry point) are correctly separated — the library's public API is `SeedSpace` and `GlyphParams`; the binary is a thin wrapper.
- [x] **21-06** `tests/` is at the repo root (not inside `poc/`) — test isolation from production code is correct.
- [x] **21-07** `.github/` workflows, `docs/`, `poc/`, `core/`, `tests/`, and root-level files are cleanly separated — no cross-directory clutter.
- [x] **21-08** ADR 0001 defines the gate for when architectural decisions require documentation — a governance mechanism for boundary changes is in place.
- [ ] **21-09** `poc/glyph_engine.py` combines the render engine, CLI entrypoint, manifest I/O, and benchmark logic in a single file — as the file grows toward MVP, it should be split into `poc/engine.py`, `poc/cli.py`, `poc/manifest.py`. T-004 partially addresses this (manifest to `poc/manifest.py`). **MEDIUM**
- [ ] **21-10** `logging_config.py` defines its own `ENGINE_VERSION` constant instead of importing it from `glyph_engine.py` — circular import is the likely reason, but the root cause is that `ENGINE_VERSION` belongs in a separate `poc/version.py` module importable by both. **MEDIUM**
- [ ] **21-11** No `poc/__init__.py` exists — `poc/logging_config.py` cannot be imported as `from poc.logging_config import get_logger` from outside the repo root. Tests that import `glyph_engine` use `importlib.util.spec_from_file_location` as a workaround. **LOW**
- [ ] **21-12** The pipeline stage architecture (ARCHITECTURE.md §2) does not correspond 1:1 to source files — stages 1, 2, 4 are all inside `glyph_engine.py`; stage 5 (sink) is also there. No planned module decomposition document exists for the MVP refactor. **LOW**
- [ ] **21-13** `core/` is a Rust crate but there is no workspace-level `Cargo.toml` — if additional Rust crates are added (e.g., a Python FFI crate), they would need to be brought into a workspace manually. **INFO**
- [ ] **21-14** No interface definition document (IDL or formal API contract) exists between the Python PoC and the future Rust bindings — the integration path for pyo3 or cffi is undocumented. **LOW**
- [ ] **21-15** The planned `poc/pipeline.py` (T-003) and `poc/manifest.py` (T-004 remainder) are referenced in backlog cards but do not exist — the architecture as described in docs is partially aspirational. **INFO**
- [ ] **21-16** No separation between the "axis tables" (glyph list, font list, lattice formulas) and the "engine logic" (RNG, rendering) — axis tables are embedded directly in `glyph_engine.py`. A separate `poc/space.py` would allow axis table changes without touching render logic. **MEDIUM**
- [ ] **21-17** The manifest schema in `docs/ARCHITECTURE.md` diverges from the implementation in `glyph_engine.py` (JSON object vs JSON Lines; different field names) — the implementation has overtaken the design doc without a reconciling update. **HIGH**
- [ ] **21-18** No formal service boundary exists between the "generation" role (seeded renderer) and the "curation" role (manifest picks) — both are in the same file; for a future dataset marketplace, these would need to be separate services. **INFO**
- [ ] **21-19** The `core/` Rust crate has no feature flags — future optional features (SIMD, GPU, Python bindings) will need to be managed via Cargo features, but none are set up. **INFO**
- [ ] **21-20** No integration test across the Python PoC and the Rust CLI exists — the two implementations cannot be directly cross-validated by an automated test. **LOW**

**Section 21 score: 8/20**

---

## Section 22 — Data Model (Manifest / ERD) Integrity

- [x] **22-01** The manifest record has a minimal, well-defined schema: `{engine_version, seed_start, count, stride, canvas}` — all required fields are present and typed.
- [x] **22-02** `engine_version` is a string (not an integer) — allows free-form versioning that encodes both the engine namespace and semantic version.
- [x] **22-03** `seed_start` and `stride` are stored as plain integers in the JSON — Python's `json.dumps` and `json.loads` round-trip these exactly for values within Python's arbitrary-precision int range.
- [x] **22-04** `count` is stored as an integer — no ambiguity; non-negative by design (validated in `build_seeds`).
- [x] **22-05** `canvas` is stored as an integer (pixels) — unambiguous, no units field needed.
- [x] **22-06** The `run_manifest` log event in `logging_config.py` stores seeds as hex strings (`"0x{seed:016x}"`) — preventing JSON integer precision loss for seeds > 2^53. This is correctly designed.
- [x] **22-07** `write_manifest` uses `json.dumps(record, indent=2)` — pretty-printed for human readability; appropriate for a reference manifest (not a high-frequency log).
- [x] **22-08** `read_manifest` performs no type coercion — it returns the raw `json.loads` result; callers receive the correct Python types directly.
- [ ] **22-09** `seed_start` in the manifest is stored as a plain integer, not a hex string — for seeds > 2^53, JSON parsers in other languages (JavaScript, Go default JSON) would lose precision. The log schema uses hex strings correctly; the manifest schema should match. **HIGH**
- [ ] **22-10** No schema version field (e.g., `"schema": "ceae-manifest/1"`) in the current manifest — `docs/ARCHITECTURE.md` shows this field but `write_manifest` does not include it. Consumers cannot detect schema version. **HIGH**
- [ ] **22-11** `space_hash` is absent from the manifest — axis-table integrity cannot be verified by consumers. **HIGH**
- [ ] **22-12** No `license` field in the manifest — `docs/ARCHITECTURE.md` manifest example shows `"license": "MIT"` but it is not implemented. **LOW**
- [ ] **22-13** No `created` timestamp field in the manifest — `docs/ARCHITECTURE.md` example shows `"created": "2026-06-11"` but it is not implemented. **LOW**
- [ ] **22-14** No `picks` field in the manifest — the curation ledger feature is completely absent from the implementation. **MEDIUM**
- [ ] **22-15** No `ranges` list field — the manifest stores a single range as top-level fields (`seed_start`, `count`, `stride`) rather than as a list of range objects. This prevents multi-range manifests (needed for curated datasets combining multiple non-contiguous runs). **MEDIUM**
- [ ] **22-16** No validation of the manifest on read — `read_manifest` does not check that required keys are present or that values are of the expected type. A missing `stride` key raises `KeyError` in `main()`. **MEDIUM**
- [ ] **22-17** No migration path between manifest versions — if `write_manifest` output format changes, old manifest files become unreadable without a version-aware reader. **MEDIUM**
- [ ] **22-18** The `--from-manifest` re-render checks `engine_version` but does not check `canvas` against the `--size` argument — if the user passes `--size 512` with a manifest that specifies `canvas=256`, the manifest's canvas silently takes precedence with no warning. **LOW**
- [ ] **22-19** No formal JSON Schema or Pydantic model for the manifest — validation is entirely ad-hoc (key access with implicit `KeyError`). **LOW**
- [ ] **22-20** `stride` is stored in the manifest but `build_seeds` implements `(base + i * stride) & MASK` — if stride is 0, re-rendering produces a batch of identical images. The manifest does not validate or warn on `stride=0`. **LOW**

**Section 22 score: 8/20**

---

## Section 23 — Observability & Logging

- [x] **23-01** `poc/logging_config.py` implements a JSON-per-line structured logger with `ts`, `level`, `engine`, `pid`, and `event` as common fields — matches the schema defined in `docs/OBSERVABILITY.md`.
- [x] **23-02** `emit_run_manifest` is a dedicated helper that constructs and emits the run-accountability log event — the primary accountability record is standardised.
- [x] **23-03** `get_logger` respects `CEAE_LOG_LEVEL` environment variable (default `INFO`) — log verbosity is externally controllable without code changes.
- [x] **23-04** `get_logger` is idempotent (caches by name, checks `if logger.handlers`) — no duplicate handlers from multiple imports.
- [x] **23-05** `docs/OBSERVABILITY.md` defines log levels (DEBUG/INFO/WARNING/ERROR/CRITICAL) with specific guidance on when to use each — the logging contract is documented.
- [x] **23-06** `docs/OBSERVABILITY.md` specifies the `logs/` directory naming convention (`ceae-YYYYMMDD-HHMMSS-<seed_start_hex>.log`) — run log management is documented.
- [x] **23-07** `docs/OBSERVABILITY.md` lists specific metrics to emit (`imgs_per_sec`, `avg_png_kib`, `duration_s`, `seed_count` vs `seeds_written`, `contrast_rerolls`, `font_fallback_count`) — the observability surface is well-specified.
- [x] **23-08** Log output goes to `stderr` (not `stdout`) — correct for a tool whose `stdout` is used for human-readable status lines; `stderr` can be redirected independently.
- [ ] **23-09** `poc/glyph_engine.py` does not call `get_logger` at all — the structured logging infrastructure in `logging_config.py` exists but is not wired into the render pipeline. T-011 (structured JSON logging) is "In Progress" in the Kanban. **HIGH**
- [ ] **23-10** No `run_start` log event is emitted at the beginning of a run — `docs/OBSERVABILITY.md` shows a `run_start` example but it is not implemented. **MEDIUM**
- [ ] **23-11** No `render_error` event is emitted on per-seed failures — errors would propagate as unhandled exceptions with no structured log record. **MEDIUM**
- [ ] **23-12** `contrast_rerolls` counter is documented in `docs/OBSERVABILITY.md` as a key metric but is not tracked in the current implementation. **LOW**
- [ ] **23-13** `font_fallback_count` metric is documented but not tracked — there is no count of how many renders fell back to the Pillow default font. **LOW**
- [ ] **23-14** `seeds_written` vs `seed_count` gap tracking is documented but not implemented — there is no counter of successfully written PNGs vs total seeds attempted. **LOW**
- [ ] **23-15** No progress indicator (e.g., tqdm, periodic log line) is emitted during a long run — a `--count 1000000` run produces no output until completion. **MEDIUM**
- [ ] **23-16** `space_hash` is `"sha256:pending"` in all current log and manifest outputs — the actual axis-table hash is never computed. **HIGH**
- [ ] **23-17** No per-image DEBUG log exists for profiling individual stage timings — `docs/OBSERVABILITY.md` mentions per-image events at DEBUG level but the infrastructure to emit them is missing. **LOW**
- [ ] **23-18** `_JsonFormatter.format` calls `datetime.now(tz=timezone.utc)` on every log line — for high-frequency DEBUG logging this timestamp call adds latency. Caching the format per millisecond or using `time.time()` + `datetime.fromtimestamp` would be faster. **INFO**
- [ ] **23-19** No distributed tracing (OpenTelemetry, etc.) is planned — appropriate for a local batch tool, but worth noting as a future gap for multi-machine distributed datasets. **INFO**
- [ ] **23-20** Log file cleanup ("keep the last 30 run logs") is deferred to "the caller's responsibility" in `docs/OBSERVABILITY.md` — no automated purge or rotation mechanism exists. **LOW**

**Section 23 score: 8/20**

---

## Section 24 — Licensing / Provenance / Attribution

- [x] **24-01** `LICENSE` is the MIT license with copyright `(c) 2026 0thernes` — present, correct year, correct author.
- [x] **24-02** `core/Cargo.toml` declares `license = "MIT"` — consistent with the root LICENSE file.
- [x] **24-03** `README.md` includes an "MIT — see LICENSE" section with a link to the LICENSE file.
- [x] **24-04** `docs/AESTHETIC-LINEAGE.md` provides proper attribution for the two cited prompt excerpts: "Prompts by 0thernes (github.com/0thernes-L-L-C/Prompt-Improvisation, Creative Commons)."
- [x] **24-05** `docs/AESTHETIC-LINEAGE.md` cites the Medium feature article by Carolina Delgado with publication name and date.
- [x] **24-06** `docs/FAQ.md` explicitly warns about system font licence restrictions for rendered output redistribution — the commercial use caveat is documented.
- [x] **24-07** All third-party Python dependencies (Pillow: HPND/MIT-like, NumPy: BSD-3) are permissive — no copyleft dependency that would encumber the MIT distribution model.
- [x] **24-08** `docs/AUDIT.md` A-LIC-03 calls out GPL/LGPL as a gate — copyleft review is built into the audit checklist.
- [x] **24-09** The Rust core has zero external dependencies — no licence review required beyond the Rust standard library (MIT/Apache-2.0 dual).
- [x] **24-10** Dependabot covers the `cargo` ecosystem for licence-drifting dependency additions.
- [ ] **24-11** No SPDX licence identifier header in `poc/glyph_engine.py` or `poc/logging_config.py` — for a tool intended for AI training data provenance, per-file SPDX headers would strengthen the provenance record. **LOW**
- [ ] **24-12** No SPDX identifier in `core/src/lib.rs` or `core/src/main.rs` — Rust convention is to add `// SPDX-License-Identifier: MIT` at the top. **INFO**
- [ ] **24-13** No `pip-licenses` output is committed — there is no machine-readable record of the full transitive dependency licence chain (Pillow pulls in additional wheels with their own licences). **LOW**
- [ ] **24-14** Font licence notices: Arial, Times New Roman, and Consolas are Microsoft-licensed fonts; their licences may prohibit redistribution of rendered output for commercial use. This is acknowledged in `docs/FAQ.md` but not in any machine-readable metadata or warning. **MEDIUM**
- [ ] **24-15** The CC-licensed prompt corpus (github.com/0thernes-L-L-C/Prompt-Improvisation) is referenced but the specific CC sub-licence (CC-BY, CC-BY-SA, etc.) is not stated in `docs/AESTHETIC-LINEAGE.md` — the attribution is incomplete without the licence variant. **LOW**
- [ ] **24-16** No NOTICE or ATTRIBUTION file exists — for future redistribution of the engine as a library, a NOTICE file aggregating upstream attributions is standard practice. **LOW**
- [ ] **24-17** `CODE_OF_CONDUCT.md` is present (confirmed by file listing) but its content is not quoted in any doc — the specific version of the Contributor Covenant referenced is undocumented. **INFO**
- [ ] **24-18** No provenance metadata is embedded in the generated PNG files (e.g., PNG `tEXt` chunk with `engine_version` and `seed`) — for AI training data provenance, embedding the seed and engine version as PNG metadata would create a self-describing artefact. **MEDIUM**
- [ ] **24-19** The `space_hash` mechanism (planned) would create a verifiable axis-table provenance record — but it is not yet implemented (see Section 10-12 and 22-11). **HIGH** (same gap as 10-12, noted for provenance specifically)
- [ ] **24-20** No export-control or data-use restriction statement — for datasets used in AI training, some jurisdictions may require disclosure of the generation methodology; no such statement exists in the documentation. **INFO**

**Section 24 score: 10/20**

---

## Section 25 — Maintainability, DX & Governance

- [x] **25-01** `Makefile` provides `help`, `setup`, `lint`, `test`, `bench`, `audit`, `ci` targets — a new contributor can be productive with `make setup && make ci`.
- [x] **25-02** `CONTRIBUTING.md` covers ground rules, workflow, local setup steps, and performance change policy — clear onboarding documentation.
- [x] **25-03** `docs/KANBAN.md` provides a WIP-limited task board with explicit WIP limits and rationale — structured project management for a solo-founder project.
- [x] **25-04** `docs/backlog/` has detailed backlog cards with context, acceptance criteria, definitions of done, and estimates — T-001 through T-015.
- [x] **25-05** `docs/adr/0001-record-architecture-decisions.md` establishes the ADR process — design decisions have a structured trail.
- [x] **25-06** `CHANGELOG.md` follows Keep a Changelog format with dated entries, verified test counts, and benchmark results — a maintainer can track what changed and when.
- [x] **25-07** `.editorconfig` is present — consistent editor settings for indentation, line endings, and charset reduce style noise.
- [x] **25-08** `CODEOWNERS` assigns all files to `@0thernes` — every PR requires an explicit review.
- [x] **25-09** `SECURITY.md` provides a responsible disclosure path with a contact email and SLA — governance of security reports is in place.
- [x] **25-10** Pre-commit hooks enforce style at commit time — contributors get immediate feedback rather than CI failures.
- [ ] **25-11** `Makefile` `setup` target creates `.venv` but does not check for the correct Python version before doing so — a Python 3.8 environment would appear to set up successfully but fail at import time. **LOW**
- [ ] **25-12** `CONTRIBUTING.md` does not mention updating `CHANGELOG.md` as a required step before merging a PR — changelog discipline depends on individual contributor memory. **LOW**
- [ ] **25-13** No issue triage process is documented for the GitHub issue tracker — `docs/KANBAN.md` tracks planned work but not how incoming GitHub issues are evaluated and promoted to the board. **INFO**
- [ ] **25-14** The anticipated ADRs (0002 CPU-canonical, 0003 separate engine versions, 0004 manifest schema) are not yet written despite the decisions being in production — design rationale is being lost. **MEDIUM**
- [ ] **25-15** No `docs/benchmarks/` directory exists — the TESTING.md commitment to commit benchmark records is not being followed. **LOW**
- [ ] **25-16** `Makefile` `setup` uses a `||` fallback for Windows vs POSIX venv activation scripts (`Scripts/pip` vs `bin/pip`) — this pattern is fragile; a Python wrapper script (`python -m pip`) would be more portable. **LOW**
- [ ] **25-17** The `--from-manifest` UX gap (see 12-19, 11-17) makes the CLI hard to use correctly without reading the source code — a clearer help text and a validation step would improve DX. **LOW**
- [ ] **25-18** No `docs/GLOSSARY.md` exists — terms like "engine version", "seed space", "stride sampling", "space hash", "manifest", and "picks" are used throughout the docs without a canonical definition page. **INFO**
- [ ] **25-19** `docs/ROADMAP.md` Phase 0 has the open criterion "Zero hidden entropy: independent code review confirms…" — T-012 is in "Ready" but external review has not been completed; the Phase 0 criterion is not yet met. **MEDIUM**
- [ ] **25-20** No succession plan or governance document exists for the project — for a solo-founder tool intended for external design partners, the single-CODEOWNER model is a bus-factor risk. **INFO**

**Section 25 score: 10/20**

---

## Per-Section Score Table

| # | Section | Score |
|---|---------|-------|
| 1 | Correctness & the determinism contract | 15/20 |
| 2 | Algorithms & data structures | 14/20 |
| 3 | Time complexity per hot path | 15/20 |
| 4 | Space complexity & memory | 10/20 |
| 5 | Numerical correctness | 11/20 |
| 6 | RNG quality & bias | 10/20 |
| 7 | Reproducibility & cross-platform | 10/20 |
| 8 | Performance & throughput | 10/20 |
| 9 | Concurrency / parallelism readiness | 8/20 |
| 10 | I/O, storage & the seed-manifest inversion | 10/20 |
| 11 | Error handling & edge cases | 8/20 |
| 12 | Input validation & CLI robustness | 8/20 |
| 13 | Security & resource safety | 10/20 |
| 14 | Dependencies & supply chain | 9/20 |
| 15 | Testing strategy & coverage | 10/20 |
| 16 | CI/CD & quality gates | 10/20 |
| 17 | Build/release & engine-version discipline | 8/20 |
| 18 | Documentation completeness | 10/20 |
| 19 | API/interface design | 10/20 |
| 20 | Code style / lint / formatting | 10/20 |
| 21 | Architecture & module boundaries | 8/20 |
| 22 | Data model integrity | 8/20 |
| 23 | Observability & logging | 8/20 |
| 24 | Licensing / provenance / attribution | 10/20 |
| 25 | Maintainability, DX & governance | 10/20 |
| **Total** | | **248/500** |

---

## Overall Score: 248 / 500

The 248/500 score reflects a **well-designed PoC with strong architectural foundations and weak implementation completeness**. The determinism contract is sound and enforced by tests. The core algorithms (splitmix64, Lemire reduction) are correctly implemented. Documentation quality is high. The gap score comes from:

1. Features that are **documented but not yet implemented** (space_hash, structured logging, disk-space guard, manifest schema v1, golden digests)
2. **Missing production-readiness work** that is known and tracked in the backlog (T-002 through T-015)
3. **Security/supply-chain gaps** (no hash-pinned requirements, no pip-audit in CI)
4. **Error handling** that is appropriate for a PoC but not for an MVP

The 248 should be re-scored when T-002, T-003, T-004, T-011 ship; those four items alone would close ~30–40 gap points.

---

## Top 10 Prioritized Findings

| Rank | ID | Severity | Summary | Blocking? |
|------|----|----------|---------|-----------|
| 1 | 7-11 / 15-11 | HIGH | No golden-seed digest fixture (`tests/fixtures/golden_digests.json`) — cross-machine and cross-version byte-identity is unproven. T-002 closes this. | Blocks MVP |
| 2 | 7-13 / 14-10 | HIGH | `poc/requirements.txt` uses minimum-version pins only — a new `pip install` installs the latest Pillow/NumPy, silently changing rendered output. Add a lock file before any external partner integration. | Blocks MVP |
| 3 | 10-11 / 22-10 | HIGH | Manifest implementation diverges from `docs/ARCHITECTURE.md` schema — no `schema` version field, no `space_hash`, no `ranges` list, seeds stored as integers not hex strings. T-004 remainder closes this. | Blocks MVP |
| 4 | 22-09 / 10-19 | HIGH | `seed_start` stored as plain JSON integer in manifests — seeds > 2^53 lose precision in non-Python JSON parsers (JavaScript, Go). Use hex-string encoding for all seed fields. | Blocks interoperability |
| 5 | 23-09 | HIGH | `poc/logging_config.py` is not wired into `glyph_engine.py` — T-011 is "In Progress" but the structured logging infrastructure is completely unused. Runs produce no structured accountability record. | MVP gap |
| 6 | 17-14 / 22-11 | HIGH | `space_hash` is hardcoded as `"sha256:pending"` everywhere — manifests cannot be verified for axis-table integrity. Implement the SHA-256 of the axis tables. | Blocks dataset distribution |
| 7 | 13-11 / 12-09 | HIGH | `--count` has no upper bound — `--count 10_000_000_000` will silently exhaust disk. Add a disk-space pre-check and `--max-disk-gb` flag (per `docs/SECURITY-NOTES.md` planned mitigations). | Safety |
| 8 | 13-12 / 13-13 | HIGH | Pillow/NumPy are not hash-pinned in CI — supply-chain integrity of rendered output is unverified. Add `requirements-lock.txt` with hashes before first external use. | Security |
| 9 | 10-16 | HIGH | No sharded directory structure — a single flat directory with `--count 1_000_000` produces 1M files, a filesystem hazard. Implement T-005 (sharded sink, dirs of 10k). | MVP safety |
| 10 | 1-16 / 17-09 | MEDIUM | `ENGINE_VERSION` is duplicated in `poc/logging_config.py` — a version bump must be applied in two files. Extract to a `poc/version.py` module imported by both. | Correctness risk |

---

*Cross-reference: see [docs/AUDIT.md](AUDIT.md) for the quick self-audit checklist. This document provides the deep 500-point inspection grounded in the actual source files read on 2026-06-12.*
