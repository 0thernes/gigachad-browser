# Self-Audit Checklist

This checklist supports pre-release and periodic reviews of the Chaos Entropy Art
Engine. Each item is specific to this project's design and constraints. Items are
checkable in-place; a completed audit should be recorded as a dated entry in
`CHANGELOG.md`.

For the deep 500-point / 25-section inspection (2026-06-12), see
**[docs/AUDIT-500.md](AUDIT-500.md)**.

---

## A — Correctness

- [ ] **A-CORR-01** `ENGINE_VERSION` constant in `poc/glyph_engine.py` matches the
  version recorded in any published manifests and benchmark logs.
- [ ] **A-CORR-02** The RNG draw order in `sample_params` (glyph → font → size →
  rotation → fg → bg → noise) matches the documented contract in `docs/ARCHITECTURE.md`.
- [ ] **A-CORR-03** `NOISE_SALT` in `poc/glyph_engine.py` is unchanged from the
  value in the last engine version bump; any change must trigger a bump.
- [ ] **A-CORR-04** `GLYPHS` list and `_GLYPH_RANGES` are frozen (no dynamic
  construction that depends on runtime state); verified by inspection.
- [ ] **A-CORR-05** `_FONT_CANDIDATES` list is in frozen candidate order; the
  `discover_fonts()` function returns found fonts in that fixed order regardless
  of OS directory listing order.
- [ ] **A-CORR-06** The contrast re-roll loop is bounded (currently 8 iterations);
  verify the loop cannot run indefinitely even in adversarial seed ranges.
- [ ] **A-CORR-07** `encode_png` uses fixed `compress_level=1` and `optimize=False`;
  these are part of the determinism contract — verify no code path sets different
  values.

---

## B — Reproducibility (seed determinism)

- [ ] **A-REPR-01** `pytest -q tests` passes on the current commit on the dev
  workstation.
- [ ] **A-REPR-02** `pytest -q tests` passes on GitHub Actions (ubuntu-latest CI).
- [ ] **A-REPR-03** No call to `time()`, `datetime.now()`, `os.urandom()`,
  `secrets`, or bare `random` (global state) anywhere in `poc/glyph_engine.py`.
- [ ] **A-REPR-04** No use of `os.getpid()`, environment variables, or locale
  settings inside the render path.
- [ ] **A-REPR-05** `numpy.random.default_rng(seed ^ NOISE_SALT)` is the only
  NumPy RNG used; no `np.random.*` calls with global state.
- [ ] **A-REPR-06** Dict and set objects whose iteration order could influence
  render output do not exist in the render path (verify by inspection).
- [ ] **A-REPR-07** The golden-seed digest fixture (`tests/fixtures/golden_digests.json`)
  is present and produces a passing test on both Windows (dev) and Linux (CI) —
  confirming cross-platform identity. *(Prerequisite: T-002 complete.)*
- [ ] **A-REPR-08** A Pillow version bump was tested against the golden-digest
  fixture before merging the dependency update.
- [ ] **A-REPR-09** A NumPy version bump was tested against the golden-digest
  fixture before merging.
- [ ] **A-REPR-10** The `space_hash` value in any published manifest has been
  independently verified by rendering a 10-seed sample on a separate machine and
  confirming digests match.

---

## C — Performance

- [ ] **A-PERF-01** `--benchmark --count 1000 --size 256` reports ≥ 50 img/s on
  the dev workstation (floor from Phase 0 acceptance criteria).
- [ ] **A-PERF-02** `--benchmark --count 1000 --size 256` reports ≥ 80 img/s
  (the measured 90.4 baseline; a regression below this triggers investigation).
- [ ] **A-PERF-03** Per-image stage profile matches THROUGHPUT.md estimates:
  sample < 0.1 ms, raster+augment < 15 ms, encode < 5 ms at 256px.
- [ ] **A-PERF-04** Font cache (`_font_cache`) is populated during warm-up; no
  repeated `ImageFont.truetype` calls for the same (path, size) pair in a benchmark.
- [ ] **A-PERF-05** Noise computation uses vectorized NumPy (`standard_normal` on
  a full array), not a Python loop over pixels.
- [ ] **A-PERF-06** PNG encode uses `compress_level=1` (speed-optimised) — not 0
  (uncompressed, no filesystem benefit) or higher levels (wasted CPU).
- [ ] **A-PERF-07** No subprocess calls, network calls, or filesystem reads inside
  the `render()` hot path.
- [ ] **A-PERF-08** For multiprocess pipeline runs (T-003 onwards): worker count
  matches `os.cpu_count()` by default; no over-subscription above physical cores.

---

## D — Resource Safety

- [ ] **A-RES-01** `--count` is validated as a positive integer before the render
  loop begins; a huge accidental count (e.g., `--count 1000000000`) does not silently
  exhaust disk before the user can interrupt.
- [ ] **A-RES-02** A disk-space pre-check (or at minimum a warning) is emitted when
  estimated PNG output size exceeds a configurable threshold (default: 10 GB).
- [ ] **A-RES-03** The font cache is bounded — it cannot grow unboundedly because
  the number of distinct (path, size) pairs is at most `len(fonts) × 32` (fixed axes).
- [ ] **A-RES-04** Image objects returned by `render()` are not accumulated in a
  list for long runs; the caller encodes and writes immediately, then releases.
- [ ] **A-RES-05** Temporary `BytesIO` buffers in `encode_png` are garbage-collected
  promptly (no long-lived references).

---

## E — Security

- [ ] **A-SEC-01** Font files are loaded only from the frozen `_FONT_CANDIDATES`
  list; no user-supplied font path is accepted without explicit `--font` flag and
  a corresponding risk note in documentation.
- [ ] **A-SEC-02** Seeds are not treated as secrets; no seed value is logged at a
  reduced verbosity level or withheld from manifests to "hide" an image.
- [ ] **A-SEC-03** The `--out` directory is created with standard permissions; no
  world-writable directory is created by default.
- [ ] **A-SEC-04** No network access in the render path; all dependencies operate
  offline.
- [ ] **A-SEC-05** `pip-audit -r poc/requirements.txt` reports no known
  vulnerabilities in Pillow or NumPy at the current pinned versions.
- [ ] **A-SEC-06** `cargo audit` in `core/` reports no known vulnerabilities
  (even though there are currently zero dependencies).

---

## F — Documentation

- [ ] **A-DOC-01** `docs/ARCHITECTURE.md` RNG draw order section matches the
  current implementation in `poc/glyph_engine.py`.
- [ ] **A-DOC-02** `README.md` benchmark figure (`90.4 img/s`) is updated after
  any performance change.
- [ ] **A-DOC-03** `docs/THROUGHPUT.md` measured numbers match the most recent
  benchmark run committed to `docs/benchmarks/`.
- [ ] **A-DOC-04** `docs/ROADMAP.md` acceptance criterion checkboxes reflect the
  current state of the codebase (no checked items that are actually incomplete).
- [ ] **A-DOC-05** `CHANGELOG.md` has an entry for every merge to `main`.
- [ ] **A-DOC-06** Every ADR in `docs/adr/` has a status line (Proposed / Accepted
  / Superseded / Deprecated).

---

## G — Tests & Developer Experience

- [ ] **A-DX-01** `make setup` completes without error on a fresh clone on Windows
  (Git Bash) and Linux.
- [ ] **A-DX-02** `make lint test` completes without error.
- [ ] **A-DX-03** `make bench` prints an `imgs/sec` line matching the README claim.
- [ ] **A-DX-04** `pre-commit run --all-files` passes with no changes needed.
- [ ] **A-DX-05** `pytest -q tests` completes in under 30 seconds on the dev
  workstation.
- [ ] **A-DX-06** CI passes on a fresh branch within 5 minutes.
- [ ] **A-DX-07** A new contributor following `CONTRIBUTING.md` can run the PoC
  and pass all tests without additional guidance.

---

## H — Licensing & Dependency Provenance

- [ ] **A-LIC-01** All third-party dependencies (Pillow, NumPy) are MIT/BSD/Apache-
  compatible licences; verify with `pip show pillow numpy` and `pip-licenses`.
- [ ] **A-LIC-02** `LICENSE` file is present and accurate (MIT, year 2026, author).
- [ ] **A-LIC-03** No GPL or LGPL dependencies are introduced without explicit
  review and sign-off (copyleft would encumber the permissive distribution model).
- [ ] **A-LIC-04** Font files referenced in `_FONT_CANDIDATES` are system fonts;
  no font file is bundled in the repo that has a non-distributable licence.
- [ ] **A-LIC-05** Dependabot is configured for all three ecosystems (github-actions,
  pip, cargo) and dependency update PRs are reviewed promptly.
