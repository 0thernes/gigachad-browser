# Complexity Analysis — Big-O Time and Space

> Covers every function in the hot path and the full pipeline for
> `ceae-poc/0.1.0`.  Canvas size in pixels is denoted **N** (e.g., N=256);
> total pixels per image is **N²**.  Output PNG size in bytes is **B**
> (empirically ~8 KB at 256 px, compress_level=1).

---

## 1. Per-function complexity table

| Function / operation | Source | Time | Space | Notes |
|---|---|---|---|---|
| `splitmix64(state)` | `core/src/lib.rs:114` | O(1) | O(1) | 3 multiply+XOR+shift pairs; no branching |
| `lemire_reduce(raw, n)` | `core/src/lib.rs:106` | O(1) | O(1) | one 128-bit multiply + shift; replaces division |
| `SeedSpace::sample(seed)` | `core/src/lib.rs:84` | O(1) | O(1) | 7 splitmix64 + 7 lemire_reduce calls; constant regardless of space cardinality |
| `sample_params(seed, fonts)` | `poc/glyph_engine.py:101` | O(1) amortized | O(1) | Python MT19937; re-roll loop bounded at 8 iterations — O(1) worst case |
| `_lattice_color(rng)` | `poc/glyph_engine.py:88` | O(1) | O(1) | 3 randrange + colorsys.hsv_to_rgb |
| `_luma(c)` | `poc/glyph_engine.py:97` | O(1) | O(1) | 3 multiply + 2 add |
| `discover_fonts()` | `poc/glyph_engine.py:73` | O(F) | O(F) | F = number of font candidates (~19); one `Path.is_file()` stat per candidate; called once per run |
| `_load_font(path, px)` | `poc/glyph_engine.py:79` | O(1) amortized | O(F·S) total cache | LRU keyed `(path, px)`; cache miss pays FreeType parse cost once per (path, size) pair |
| `render()` — bg fill | `poc/glyph_engine.py:135` | O(N²) | O(N²) | `Image.new("RGB", (N,N), color)` fills N² pixels |
| `render()` — oversized layer alloc | `poc/glyph_engine.py:128` | O((1.5N)²) = O(N²) | O(N²) | side = N + N//2; constant-factor 2.25× over canvas |
| `render()` — glyph raster (FreeType) | `poc/glyph_engine.py:129` | O(G) where G = glyph coverage px | O(N²) | G ≤ N² in worst case (filled rect glyph); typically G ~ 0.1–0.3 N² for outline glyphs |
| `render()` — bicubic rotate | `poc/glyph_engine.py:133` | O(N²) | O(N²) | Pillow BICUBIC: 16-tap kernel × N² output pixels = 16 N² MACs; new buffer allocated |
| `render()` — crop + composite | `poc/glyph_engine.py:134–140` | O(N²) | O(N²) | one pass each over N² pixels |
| `render()` — noise generation | `poc/glyph_engine.py:139` | O(N²) | O(N²) | numpy PCG64 draws 3 N² floats (RGB channels); vectorized SIMD but still Θ(N²) work |
| `render()` — noise clip + cast | `poc/glyph_engine.py:140` | O(N²) | O(N²) | `np.clip` + `.astype(uint8)` each scan the N²×3 array |
| `render()` — full function | `poc/glyph_engine.py:120` | O(N²) | O(N²) | all stages are O(N²); constant factors differ (see §3) |
| `encode_png(img)` | `poc/glyph_engine.py:145` | O(B) ⊆ O(N²) | O(B) | Deflate at compress_level=1; input is N²×3 bytes, output B ≤ 3N² bytes; in practice B << 3N² for natural images |
| `build_seeds(start, count, stride)` | `poc/glyph_engine.py:154` | O(count) | O(count) | list comprehension; one multiply + mask per seed |
| `write_manifest(path, ...)` | `poc/glyph_engine.py:167` | O(1) | O(1) | serializes a fixed-field dict; file write is O(1) bytes (~32 bytes) |
| `read_manifest(path)` | `poc/glyph_engine.py:184` | O(1) | O(1) | reads and parses the fixed-size JSON |
| **Full pipeline per image** | all stages | **O(N²)** | **O(N²)** | dominated by raster + noise + encode |

### Constant factors for the dominant O(N²) operations (256×256 image)

| Stage | Approx. pixel-ops per N² | Measured latency | Constant k (ns/px) |
|---|---|---|---|
| Bicubic rotate | 16 MACs × N² | ~1–1.5 ms | ~0.25 |
| Noise (NumPy) | 3 draws + 2 ops × N² | ~0.5–1 ms | ~0.1 |
| PNG encode (Deflate) | ~5 byte-ops × 3N² | ~1.5–2.6 ms | ~0.15 |
| Glyph raster (FreeType) | ~G ≤ N² scanline ops | ~0.3–1 ms | ~0.05 |
| Composite / bg fill | 2 passes × N² | ~0.2 ms | ~0.05 |

At N=256 the total constant factor is roughly **11 ms/image** (measured 11.1 ms).
At N=512 the same code would take ~4× longer (~44 ms) because every stage scales
as N² — the 256-px budget does not extrapolate linearly to larger canvases.

---

## 2. Hot-path breakdown (single image, single core)

```
seed (u64)
  │
  ├─ sample_params()              O(1) time, O(1) space    ~0.01 ms
  │   ├─ 7 × splitmix64            O(1) each
  │   ├─ 7 × lemire_reduce         O(1) each
  │   └─ contrast re-roll (≤8)     O(1) worst case
  │
  ├─ _load_font()                 O(1) amortized (cache hit)
  │
  ├─ render()                     O(N²) time, O(N²) space  ~8.4 ms
  │   ├─ Image.new RGBA (1.5N)²    O(N²) alloc
  │   ├─ glyph raster (FreeType)   O(N²) worst
  │   ├─ layer.rotate (BICUBIC)    O(N²) × 16-tap kernel
  │   ├─ layer.crop                O(N²)
  │   ├─ Image.new RGB bg          O(N²) alloc
  │   ├─ img.paste + alpha         O(N²)
  │   └─ noise (numpy vectorized)  O(N²) × 3 channels
  │
  └─ encode_png()                 O(B) ≤ O(N²) time        ~2.6 ms
      └─ Deflate compress_level=1  O(N²) input bytes → B bytes output
```

**Bottleneck identification:**
- At the Python PoC level: raster+noise (~8.4 ms) and encode (~2.6 ms) dominate.
  `sample_params` is negligible (<0.1% of wall time).
- As the Rust fast path is introduced, raster cost collapses to ~0.2–0.6 ms/image,
  making encode the new bottleneck at ~1.5 ms/image.
- At 16-core scale with the Rust path, the encode ceiling becomes ~10,600 img/s
  (see §4 and THROUGHPUT.md §4).

---

## 3. Space complexity notes

Every intermediate buffer in the pipeline is proportional to N²:

| Buffer | Size expression | At N=256 |
|---|---|---|
| Oversized RGBA layer | 4 × (1.5N)² bytes | ~590 KB |
| Rotated RGBA layer (new alloc) | 4 × (1.5N)² bytes | ~590 KB |
| RGB background image | 3 × N² bytes | ~196 KB |
| NumPy float32 noise array | 4 × 3 × N² bytes | ~786 KB |
| uint8 result array | 3 × N² bytes | ~196 KB |
| PNG output buffer (BytesIO) | B bytes ≤ 3 × N² | ~8 KB typical |
| **Peak working set per image** | **~2.4 MB** | **~2.4 MB** |

The working set is O(N²) and is fully released after `encode_png` returns.
Peak RSS for a single-process run is dominated by Python interpreter + NumPy
overhead (~80–120 MB), not by the per-image buffers.

With 16 parallel workers each holding one image in-flight:
- Peak image memory: 16 × 2.4 MB ≈ 38 MB — negligible on a modern workstation.
- The O(N²) per-image scaling means moving to N=512 quadruples both time and memory.

---

## 4. Throughput projection ladder

This table projects throughput from the measured single-core Python baseline
using the Big-O constants from §1 and §2.  Full derivation: [THROUGHPUT.md](THROUGHPUT.md).

| Configuration | img/s (est.) | img/day | Bottleneck | Notes |
|---|---|---|---|---|
| Python PoC, 1 core (measured) | **90.4** | **7.8 M** | raster (FreeType + BICUBIC) | Measured: `--benchmark --count 1000 --size 256` |
| Python PoC, 16 workers | ~1,000–1,400 | ~90–120 M | GIL-free multiprocess; encode/IO begins to bind | `multiprocessing.Pool`, each worker is single-threaded Python |
| Rust rewrite, 1 core | ~450–1,800 | ~40–155 M | encode (Deflate at compress_level=1) | 5–20× per-core over Pillow bicubic; Deflate is ~same C speed |
| Rust rewrite, 16 cores | ~7,000–28,000 | ~600M–2.4B | encode ceiling at ~10,600 img/s with 1.5 ms/encode | PNG encode becomes the hard wall |
| Rust + manifest-only sink | effectively unbounded | limited by RNG throughput (~10⁹/s) | RNG / CPU memory bandwidth | No encode, no I/O; only `seed -> params`; O(1) per image |
| GPU raster (wgpu atlas) + CPU encode | ~10,000–50,000 | ~860M–4.3B | PCIe readback + PNG encode | Raster moves to GPU; encode stays CPU-bound |
| GPU raster + manifest-only sink | ~10⁵–10⁶ per batch | ~8.6B–86B | PCIe readback if any; otherwise GPU throughput | "100-trillion image dataset in an email" scenario |

### Why encode is the hard ceiling (not raster)

At compress_level=1 and N=256, PNG encode costs ~1.5 ms on a fast CPU core.
This is a **per-image constant** independent of the raster method:

```
16 cores × (1 / 1.5 ms) = ~10,600 img/s absolute ceiling (encode-bound)
```

The architectural escape is the **manifest-only sink**: skip encode entirely.
The consumer re-renders locally at their own O(N²) cost, paying only for the
images their training run actually reads (a small fraction of the addressable space).
This is why the storage-inversion insight (THROUGHPUT.md §5) is not just a storage
optimization — it also removes the throughput ceiling for the producer.

---

## 5. Complexity of the Rust core vs. Python PoC

Both implementations share the same asymptotic class — the difference is in
constant factors, not in Big-O order.

| Operation | Python PoC (O) | Rust core (O) | Constant-factor ratio |
|---|---|---|---|
| `sample` / `sample_params` | O(1) | O(1) | ~100–500× faster in Rust (no interpreter, no MT19937 object) |
| Raster + rotate | O(N²) | O(N²) | ~5–20× faster (no GIL, SIMD, no Python object overhead) |
| Noise | O(N²) | O(N²) | ~2–5× faster (Rust PRNG + SIMD vs. NumPy PCG64) |
| PNG encode | O(B) | O(B) | ~1–2× (both call C-level Deflate; miniz vs. libz) |
| Manifest write/read | O(1) | O(1) | ~same (I/O bound, not CPU bound) |

The Rust core's `SeedSpace::sample` is particularly notable: 7 splitmix64 calls
plus 7 Lemire reductions compile to ~35 arithmetic instructions with zero branches,
zero allocation, and zero memory indirection — achieving ~20 ns vs. ~10 µs in
Python, a ~500× speedup for the only O(1) stage in the pipeline.

---

## 6. Cross-references

| Topic | Document |
|---|---|
| Throughput math from first principles | [THROUGHPUT.md](THROUGHPUT.md) |
| Stage budget table (budget vs. measured vs. Rust expected) | [ARCHITECTURE.md](ARCHITECTURE.md) §Throughput budget |
| Data model (what entities drive the pipeline) | [ERD.md](ERD.md) |
| Acceptance numbers and benchmark commands | [THROUGHPUT.md](THROUGHPUT.md) §7 |
