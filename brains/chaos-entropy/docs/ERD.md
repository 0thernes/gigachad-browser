# Entity-Relationship, Conceptual Model, and Process Diagrams

> Covers the data model (ERD), the conceptual ERM, and the process/state
> diagrams (ERP) for the Chaos Entropy Art Engine at `ceae-poc/0.1.0`.

---

## 1. ERD — Entity-Relationship Diagram (Mermaid `erDiagram`)

The diagram uses crow's-foot notation.  Attributes match the actual fields in
`core/src/lib.rs` (`SeedSpace`, `GlyphParams`) and `poc/glyph_engine.py`
(`sample_params`, `write_manifest`, `render`, `encode_png`).

```mermaid
erDiagram

    ENGINE_VERSION {
        string  id              PK  "e.g. ceae-poc/0.1.0"
        string  rng_algorithm       "splitmix64 (Rust) / MT19937 (Python)"
        string  noise_rng           "PCG64 via numpy.random.default_rng"
        u64     noise_salt          "0x9E3779B97F4A7C15 (decorrelates streams)"
        int     compress_level      "PNG deflate level (part of identity)"
        string  created_date
    }

    SEED_SPACE {
        string  engine_version  FK  "governs this space"
        u32     glyphs              "cardinality of glyph axis (PoC: 518)"
        u32     fonts               "cardinality of font axis (PoC: up to 50)"
        u32     sizes               "cardinality of size axis (PoC: 32)"
        u32     rotations           "cardinality of rotation axis (PoC: 360)"
        u32     fg_colors           "cardinality of fg axis (PoC: 2^20)"
        u32     bg_colors           "cardinality of bg axis (PoC: 2^20)"
        u32     noise_levels        "cardinality of noise axis (PoC: 16)"
        u128    cardinality         "product of all axes (~3.3e21 for PoC)"
    }

    FONT_SET {
        string  engine_version  FK  "frozen to this engine version"
        int     slot_index      PK  "position in frozen candidate list"
        string  path                "absolute filesystem path or NULL"
        string  family_name         "resolved PostScript name"
        bool    available           "true if Path(path).is_file()"
    }

    GLYPH_PARAMS {
        u64     seed            PK  "u64 seed (half of composite PK)"
        string  engine_version  PK  "other half of composite PK"
        u32     glyph_idx           "index into frozen glyph table"
        u32     font_idx            "index into FONT_SET.slot_index"
        u32     size_step           "0-31; px = 12 + step*(0.7*canvas-12)/31"
        u32     rotation_deg        "0-359 integer degrees"
        u32     fg_color_idx        "index on 256x64x64 HSV lattice"
        u32     bg_color_idx        "index on 256x64x64 HSV lattice"
        u32     noise_level         "0-15; sigma = noise_level * 1.5"
    }

    IMAGE_PNG {
        u64     seed            PK  "identifies this render"
        string  engine_version  PK  "paired with seed = unique identity"
        int     canvas_px           "square canvas size in pixels"
        int     byte_size           "encoded PNG size in bytes"
        string  filename            "seed:016x .png"
        bytes   content             "pixel bytes (materialized cache)"
    }

    MANIFEST_RANGE {
        string  id              PK  "engine_version + ':' + seed_start"
        string  engine_version  FK
        u64     seed_start
        int     count
        int     stride              "seeds[i] = (start + i*stride) & MASK_U64"
        int     canvas_px
        string  created_date
    }

    RUN_MANIFEST {
        string  path            PK  "filesystem path of the JSON file"
        string  engine_version  FK
        u64     seed_start
        int     count
        int     stride
        int     canvas
    }

    ENGINE_VERSION ||--|| SEED_SPACE        : "defines"
    ENGINE_VERSION ||--o{ FONT_SET          : "pins"
    ENGINE_VERSION ||--o{ GLYPH_PARAMS      : "governs"
    ENGINE_VERSION ||--o{ IMAGE_PNG         : "governs"
    ENGINE_VERSION ||--o{ MANIFEST_RANGE    : "governs"
    ENGINE_VERSION ||--o{ RUN_MANIFEST      : "governs"

    SEED_SPACE     ||--o{ GLYPH_PARAMS      : "sample(seed) maps into"
    FONT_SET       ||--o{ GLYPH_PARAMS      : "font_idx references"

    GLYPH_PARAMS   ||--||  IMAGE_PNG        : "renders into"

    MANIFEST_RANGE ||--|{  IMAGE_PNG        : "materializes (lazy)"
    RUN_MANIFEST   ||--|{  IMAGE_PNG        : "re-renders exactly"
    MANIFEST_RANGE ||--||  RUN_MANIFEST     : "persisted as"
```

### Reading the diagram

| Relationship | Cardinality | Meaning |
|---|---|---|
| `ENGINE_VERSION` governs `GLYPH_PARAMS` | one-to-many | Same seed under two engine versions produces different params |
| `SEED_SPACE` sample → `GLYPH_PARAMS` | one-to-many | One space definition maps every u64 seed to exactly one param tuple |
| `FONT_SET` referenced by `GLYPH_PARAMS` | one-to-many | Many renders share a single font slot |
| `GLYPH_PARAMS` renders into `IMAGE_PNG` | one-to-one | One param tuple produces exactly one PNG |
| `MANIFEST_RANGE` materializes `IMAGE_PNG` | one-to-many | A range record is a compact stand-in for up to 2^64 pixel rows |
| `RUN_MANIFEST` re-renders `IMAGE_PNG` | one-to-many | Reading the JSON and calling render() produces the same bytes |

---

## 2. ERM — Entity-Relationship Model (Conceptual)

### 2.1 Entities and identity

| Entity | Identity (primary key) | Notes |
|---|---|---|
| `ENGINE_VERSION` | `id` string | Semantic-version string, e.g. `ceae-poc/0.1.0`; bumped on any axis-table or draw-order change |
| `SEED_SPACE` | `engine_version` | One-to-one with ENGINE_VERSION; the cardinality product is `~3.3×10²¹` for PoC |
| `FONT_SET` row | `(engine_version, slot_index)` | Frozen candidate list order is part of the identity contract; availability filtering is local but the slot numbering is global |
| `GLYPH_PARAMS` | `(seed, engine_version)` | Composite key; the same u64 seed under a different engine version is a different identity |
| `IMAGE_PNG` | `(seed, engine_version)` | Same composite key as GLYPH_PARAMS; PNG bytes are a deterministic function of these two values plus `canvas_px` |
| `MANIFEST_RANGE` / `RUN_MANIFEST` | `engine_version + seed_start` | A range record is the canonical compact representation of a set of IMAGE_PNG rows |

### 2.2 Cardinalities

```
ENGINE_VERSION (1) ──── (1) SEED_SPACE
ENGINE_VERSION (1) ──── (N) FONT_SET rows
ENGINE_VERSION (1) ──── (∞) GLYPH_PARAMS   [one per u64 seed, up to 2^64]
ENGINE_VERSION (1) ──── (∞) IMAGE_PNG
SEED_SPACE     (1) ──── (∞) GLYPH_PARAMS   [sample() is a total function on u64]
FONT_SET row   (1) ──── (N) GLYPH_PARAMS   [many seeds map to the same font slot]
GLYPH_PARAMS   (1) ──── (1) IMAGE_PNG      [bijection: determinism contract]
MANIFEST_RANGE (1) ──── (N) IMAGE_PNG      [one record compresses N pixel rows]
```

### 2.3 The storage-inversion identity

The engine's key architectural insight is a **storage inversion**:

```
IMAGE_PNG.content  ≡  render(seed, engine_version, canvas_px)
```

`IMAGE_PNG.content` is never the source of truth — it is a materialized cache.
The source of truth is the triple `(seed, engine_version, canvas_px)`.
This collapses dataset storage from O(pixels) to O(seeds):

| Representation | Storage per image | 10^14 images |
|---|---|---|
| PNG files | ~8 KB | ~800 PB |
| Seed list | 8 bytes | 800 GB |
| Contiguous range record | ~32 bytes total | ~32 bytes total |

### 2.4 Constraints and invariants

1. **Determinism**: `render(seed, engine_version, canvas_px)` is a pure function.
   Same inputs → byte-identical PNG on any conforming implementation.
2. **Composite PK uniqueness**: No two `(seed, engine_version)` pairs can share
   a pixel identity.  The seed is a coordinate, not a filename.
3. **Axis-table freeze**: Any change to `SEED_SPACE` cardinalities, `FONT_SET`
   slot order, or draw order in `sample()` mandates an `ENGINE_VERSION` bump.
   Failing to bump makes the PK constraint a lie.
4. **Contrast re-roll is bounded**: The background color re-roll loop runs at most
   8 times.  It is deterministic (same draws consumed regardless of how many rolls
   execute before the luma threshold is met) so the re-roll count is part of the
   `GLYPH_PARAMS` identity without being an explicit field.
5. **Font availability locality**: `FONT_SET.available` is machine-local.
   A seed that maps to an unavailable font on one machine uses Pillow's bundled
   default — this is a cross-machine non-determinism risk flagged in the audit.
   The Rust core's `FONT_SET` is expected to be fully pinned via embedded assets.

---

## 3. ERP — Entity-Relationship Process (Mermaid sequence + state diagrams)

### 3.1 Render pipeline: `seed -> PNG bytes`

```mermaid
sequenceDiagram
    autonumber
    participant Caller
    participant SeedSampler  as "sample_params / SeedSpace::sample"
    participant FontCache
    participant Rasterizer
    participant Augmenter
    participant Encoder

    Caller->>SeedSampler: seed (u64)
    note over SeedSampler: splitmix64 draws (fixed order):<br/>glyph_idx, font_idx, size_step,<br/>rotation_deg, fg_color_idx,<br/>bg_color_idx [+re-roll], noise_level
    SeedSampler-->>Caller: GlyphParams

    Caller->>FontCache: load_font(font_path, px)
    note over FontCache: LRU cache keyed (path, px).<br/>Cache miss: ImageFont.truetype()
    FontCache-->>Caller: FreeTypeFont handle

    Caller->>Rasterizer: render(params, canvas, font)
    note over Rasterizer: 1. new RGBA layer (side = canvas * 1.5)<br/>2. draw glyph at layer center (anchor=mm)<br/>3. rotate layer bicubic if rotation != 0<br/>4. crop center canvas×canvas region<br/>5. new RGB image filled with bg_color<br/>6. paste RGBA crop over bg
    Rasterizer-->>Caller: PIL.Image (RGB, canvas×canvas)

    alt noise_level > 0
        Caller->>Augmenter: add_noise(image, seed, noise_level)
        note over Augmenter: numpy PCG64 seeded (seed XOR NOISE_SALT)<br/>Gaussian σ = noise_level * 1.5<br/>clip [0, 255], cast uint8
        Augmenter-->>Caller: PIL.Image (noisy)
    end

    Caller->>Encoder: encode_png(image)
    note over Encoder: PIL save to BytesIO<br/>compress_level=1, optimize=False
    Encoder-->>Caller: bytes (PNG)
```

### 3.2 Generate vs. Materialize flow

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant CLI
    participant Engine
    participant Sink

    User->>CLI: --count N --seed S [--stride K] [--manifest M] [--out DIR]

    alt manifest-only mode (--manifest provided, no --out)
        CLI->>Engine: build_seeds(S, N, K)
        Engine-->>CLI: seed list (in memory only — not rendered)
        CLI->>Sink: write_manifest(M, engine_version, S, N, K, canvas)
        note over Sink: 32-byte JSON record<br/>Represents N images with zero pixel I/O
        Sink-->>User: manifest file written
    else from-manifest mode (--from-manifest provided)
        CLI->>Sink: read_manifest(M)
        Sink-->>CLI: {engine_version, seed_start, count, stride, canvas}
        note over CLI: Version check: warn if engine_version mismatch
        loop for each seed in build_seeds(seed_start, count, stride)
            CLI->>Engine: render(seed, canvas, fonts)
            Engine-->>CLI: PIL.Image
            CLI->>Sink: encode_png + write file
        end
        Sink-->>User: PNG files written (byte-identical to original run)
    else normal render mode
        loop for each seed in build_seeds(S, N, K)
            CLI->>Engine: render(seed, canvas, fonts)
            Engine-->>CLI: PIL.Image
            CLI->>Sink: encode_png + write <seed:016x>.png
        end
        Sink-->>User: PNG files written
    end
```

### 3.3 Bounded contrast re-roll — state machine

The re-roll is a deterministic sub-process inside `sample_params`.  It is bounded
at 8 attempts, so it always terminates and always consumes a predictable number of
RNG draws, preserving the determinism contract.

```mermaid
stateDiagram-v2
    [*] --> DrawFG : enter sample_params

    DrawFG     : Draw fg from HSV lattice\n(3 rng.randrange calls)
    DrawBG     : Draw bg from HSV lattice\n(3 rng.randrange calls)
    CheckLuma  : |luma(fg) - luma(bg)| >= 48.0 ?
    Accept     : Accept fg + bg pair
    ReRoll     : Re-roll bg\n(3 more rng.randrange calls)
    Exhaust    : Exhausted (8 re-rolls);\naccept current bg regardless

    DrawFG --> DrawBG
    DrawBG --> CheckLuma

    CheckLuma --> Accept  : yes
    CheckLuma --> ReRoll  : no AND attempt < 8
    CheckLuma --> Exhaust : no AND attempt == 8

    ReRoll --> CheckLuma : attempt++

    Accept  --> [*] : continue to noise draw
    Exhaust --> [*] : continue to noise draw
```

**Key properties of the re-roll:**
- Maximum RNG draws consumed by fg+bg: `3 (fg) + 8×3 (bg re-rolls) = 27`
- Minimum: `3 + 3 = 6` (first bg passes luma check)
- The loop variable is not stored in `GLYPH_PARAMS`; its effect is captured by
  whichever `bg_color_idx` ends up accepted.
- Because the RNG stream is sequential and the re-roll count varies per seed,
  seeds where re-rolling occurs advance the RNG state further before the noise
  draw — this is intentional and part of the determinism contract.

---

## 4. Cross-references

| Topic | Document |
|---|---|
| Throughput math and encode/IO ceiling | [THROUGHPUT.md](THROUGHPUT.md) |
| Stage-by-stage architecture rationale | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Big-O per function and projection ladder | [COMPLEXITY.md](COMPLEXITY.md) |
| Source entities (Rust structs) | `core/src/lib.rs` — `SeedSpace`, `GlyphParams` |
| Source entities (Python) | `poc/glyph_engine.py` — `sample_params`, `render`, `write_manifest` |
