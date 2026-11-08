# Throughput: the math from first principles

## 1. The target, restated in budgets

1,000,000 images / 24 h:

```
1,000,000 / 86,400 s  =  11.574 img/s sustained
⇒ per-image budget    =  86.4 ms          (single worker)
⇒ per-image budget    =  1.38 s           (16 workers, typical desktop CPU)
```

86 ms is an eternity. For calibration: a 256×256 RGB image is 196,608 bytes; at
11.6 img/s the entire pipeline moves **2.3 MB/s** of pixels — about 0.1% of one
DDR5 channel and well under 1% of a SATA SSD's sequential write rate. The target is
not hardware-bound; it is *architecture*-bound. The thesis of this project is that
diffusion-style generation spends its budget on the model, and that for combinatoric
imagery the model can be removed entirely.

## 2. Why diffusion cannot hit this on one machine

A 20-step SDXL-class sample at 1024px runs ~1–3 s/image on a 12 GB consumer GPU;
even turbo/few-step distillates at 512px reach only ~2–10 img/s and saturate the GPU
doing it. Best case:

```
diffusion:   ~10 img/s  × 86,400 s = ~0.9M/day — at 100% GPU duty, zero headroom
procedural:  see below — 100–400× the target on CPU alone, GPU left free
```

Diffusion *can* graze 1M/day; it cannot do so with margin, with determinism, or with
8-byte storage. Those three properties are the product.

## 3. Procedural raster cost, from the pixels up

Per 256×256 image, CPU single core, the work is:

| Operation | Work | Cost estimate |
|---|---|---|
| seed → params | ~10 RNG draws + table lookups | ~2 µs (Python), ~20 ns (Rust) |
| glyph raster | FreeType outline → ~10⁴ coverage px | ~0.3–1 ms |
| rotate (bicubic) | 16 taps × 65,536 px ≈ 10⁶ MACs | ~0.5–1.5 ms |
| composite + bg fill | 2 passes × 65,536 px | ~0.2 ms |
| noise (NumPy, vectorized) | 65,536 gaussians + add + clip | ~0.5–1 ms |
| PNG encode (zlib) | deflate ~200 KB | ~1–2 ms |
| write (amortized, sharded dirs) | 8–80 KB sequential | ~0.3 ms |
| **Total (theoretical floor)** | | **3–7 ms ⇒ 150–330 img/s/core** |

Python overhead roughly halves the floor in practice — see measured numbers below.

**Measured** (dev workstation, Windows 11, single process, 1,000 images @256px,
`python poc/glyph_engine.py --benchmark --count 1000`):

```
ceae-poc/0.1.0:  90.4 img/s  =  11.1 ms/img  =  7.8× target  =  7.8M imgs/day, one core
profile:         sample ~0.01 ms | raster+augment ~8.4 ms | PNG encode ~2.6 ms
```

The Python interpreter and Pillow's generalized bicubic rotate dominate — both are
exactly what the Rust fast path removes. Projections from the measured baseline:

```
16 workers (multiprocess):   ~1,000–1,400 img/s  =  90–120× target  =  ~100M/day
Rust rewrite (5–20×/core):   450–1,800 img/s/core before threading
```

## 4. Where the ceiling actually is

As raster gets cheap, the pipeline inverts: **encode + I/O become the bottleneck.**

```
PNG encode at 1.5 ms/img, 16 cores  →  ~10,600 img/s ceiling
disk at 8 KB/img PNG, 10,600 img/s  →  ~85 MB/s sustained writes (fine on NVMe)
1M imgs/day as PNG                  →  ~8 GB/day of derivable bytes
```

GPU raster (texture-atlas instanced quads, wgpu) pushes raster to 10⁵–10⁶ img/s per
batch, at which point PCIe readback + PNG encode dominate by an order of magnitude.
The architectural answer is not faster encoding — it is **not encoding**:

## 5. The storage inversion (the key insight)

The renderer is a pure function of `(engine_version, seed)`. Therefore:

```
1 image     = 8 bytes        (one u64 seed)
1M images   = 8 MB/day       vs ~8 GB/day as PNG      (1,000× reduction)
10¹⁴ images = a single range record: (engine_version, start, count) ≈ 32 bytes
              vs ~800 PB as PNG — a number that does not fit on hardware at all
```

A "100-trillion-image dataset" is deliverable in an email. The consumer re-renders
locally at 10³–10⁴ img/s, paying render cost only for the images actually consumed
(e.g., the minibatches a training run touches), which for most training jobs is a
vanishingly small fraction of the addressable space.

This also reframes the 1M/day headline: it is the **materialization** rate for
consumers who want pixels. The **generation** rate — minting new valid image
identities — is the rate at which you can enumerate u64s: effectively unbounded.

## 6. Combinatoric space: is uniqueness real?

```
glyphs × fonts × sizes × rotations × fg × bg × noise
10,000 × 50 × 32 × 360 × 2²⁰ × 2²⁰ × 16  ≈  3.3 × 10²¹ parameter tuples
```

Two caveats handled in the design:

1. **Near-duplicates.** Adjacent lattice points (e.g., 1° rotation apart) are visually
   close. For training-data use this is a feature (dense augmentation coverage); for
   "unique art" claims we quote *parameter-distinct* counts and offer stride sampling
   (e.g., step seeds by a large odd constant) to space samples far apart in the lattice.
2. **Collisions.** Distinct tuples can rarely rasterize identically (e.g., a '.' glyph
   at two rotations). Uniqueness claims attach to the tuple, not the bitmap; the
   manifest records tuples. Layered composition (v1) multiplies the space beyond 10⁴⁰,
   making bitmap collisions statistically irrelevant.

## 7. Acceptance numbers

| Claim | Verification |
|---|---|
| ≥ 50 img/s single process @256px (measured: 90.4) | `python poc/glyph_engine.py --benchmark --count 1000` |
| 1M images < 2 h on workstation (MVP) | multiprocess run, wall-clock timed |
| seed → identical bytes | `pytest tests/test_determinism.py` in CI on every push |
| 8 bytes/image storage | manifest-only sink ships seeds; renders verified spot-check |
