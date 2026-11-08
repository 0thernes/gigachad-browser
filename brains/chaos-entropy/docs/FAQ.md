# Frequently Asked Questions

## What is the Chaos Entropy Art Engine?

A deterministic procedural image generator. It renders Unicode glyphs across a
combinatoric space of fonts, sizes, rotations, and colors. Every image is a pure
function of a 64-bit seed — no model, no GPU required, and the same seed produces
the same bytes on any machine. The addressable space is approximately 3.3 × 10²¹
distinct single-glyph images.

## Why not use a diffusion model for synthetic data?

Diffusion models top out at roughly 10 img/s on a consumer GPU, saturating the
hardware in the process. The engine's PoC Python renderer already achieves 90 img/s
on a single CPU core — 9× faster before any parallelism or the planned Rust fast
path. More importantly, diffusion models cannot provide an 8-byte-per-image storage
model or a uniqueness-by-construction guarantee. Those three properties (throughput,
storage, uniqueness) are the product.

## Is the 1,000,000 images per 24 hours claim realistic?

Yes — on the current Python/Pillow PoC at 90.4 img/s single-core, 16 workers
would project to ≥ 1,400 img/s, materialising 1M images in roughly 12 minutes
of wall-clock time. The 24-hour headline is stated as a *sustained* rate because
the 1M/day target is for continuous production pipelines, not burst runs. Full
first-principles derivation: `docs/THROUGHPUT.md`.

## What exactly does "deterministic" mean here?

Given the same engine version string and seed, the renderer produces byte-identical
PNG output on any machine, operating system, and Python version. "Engine version"
includes the glyph table, font table, lattice formulas, RNG draw order, and PNG
encode parameters. Any change to any of those constitutes a breaking change and
requires a version bump. The project's CI suite enforces this on every commit.

## Are the seeds a form of cryptographic identity?

No. Seeds are dataset coordinates, not secrets. A seed does not hide information;
it is a deterministic index into a parameter space. Do not repurpose the seeded
sampler as a CSPRNG. Manifests distribute seeds openly; that openness is a feature.

## How does cross-platform determinism work in practice?

The Python PoC uses `random.Random(seed)` (Mersenne Twister) and
`numpy.random.default_rng(seed ^ NOISE_SALT)` (PCG64), both with specified,
platform-identical behaviour. Font rendering relies on FreeType via Pillow;
FreeType output can vary across versions, which is why Pillow and NumPy upgrades
are gated by the golden-seed digest test (see `docs/TESTING.md` and T-002).

## Can I use this for commercial training data?

The engine output is MIT-licensed. However, note two caveats: (1) system fonts
used for rendering (Arial, Times New Roman, etc.) may carry their own licence
restrictions for redistribution of rendered output — check the font licences for
your specific use case; (2) the uniqueness guarantee is *parameter-distinct*, not
*perceptually unique* — adjacent lattice points produce visually similar images,
which may or may not matter for your training objective.

## What is the Rust `core/` directory for?

It is the skeleton for a planned fast-path renderer that will replace the
Python/Pillow implementation for high-throughput production use. The Rust path
targets ≥ 10,000 img/s aggregate at 256px with rayon parallelism. It is its own
engine version — byte-identity with the Python PoC output is explicitly a non-goal.
See `docs/ARCHITECTURE.md` and `docs/backlog/T-001-rust-splitmix64-sampler.md`.

## How do I contribute?

Read `CONTRIBUTING.md`. The most important rules: determinism is the product
(never weaken `tests/test_determinism.py`), and performance changes require
benchmark numbers (before/after, same machine). Open an issue using the task
template for planned work, or a bug report for regressions.

## What is the project status?

`v0.1.0` PoC — working renderer with determinism tests passing, benchmark
confirmed (90.4 img/s). Pre-seed stage; seeking design partners in OCR, captcha
robustness, font classification, and augmentation pretraining. The multiprocess
pipeline (Phase 1/MVP) and Rust fast path (Phase 2/v1) are planned but not yet
implemented.

## Where can I follow progress?

The Kanban board (`docs/KANBAN.md`) and Roadmap (`docs/ROADMAP.md`) are the
ground truth. The changelog (`CHANGELOG.md`) records every notable merge.
For design discussions, use GitHub Discussions.
