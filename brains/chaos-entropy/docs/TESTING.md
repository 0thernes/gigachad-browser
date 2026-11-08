# Testing Strategy

## Guiding principle

The engine's only correctness invariant is: **`render(engine_version, seed)` is
a pure function**. The entire test strategy flows from defending that invariant
at every level of the stack and catching the specific failure modes that threaten
it (hidden entropy, dependency drift, cross-platform divergence).

## Test pyramid

```
            ┌──────────────────┐
            │  End-to-end CLI  │  (1 test, slow, real filesystem)
            ├──────────────────┤
            │  Golden-digest   │  (100 seeds × SHA-256, catches dep drift)
            ├──────────────────┤
            │  Determinism     │  (5 seeds × 5 properties, fast)
            ├──────────────────┤
            │  Unit / property │  (sampler, color lattice, font discovery)
            └──────────────────┘
```

## Current suite (`tests/`)

### `test_determinism.py` — the non-negotiable layer

| Test | What it checks |
|---|---|
| `test_params_stable_under_repeat` | `sample_params` is idempotent for the same seed |
| `test_same_seed_same_bytes_within_process` | `render` + `encode_png` produce identical bytes within a process |
| `test_render_order_independence` | Rendering seeds in reverse order changes nothing (no cache/global-state leakage) |
| `test_different_seeds_differ` | 5 distinct seeds produce 5 distinct byte strings |
| `test_cli_two_runs_byte_identical` | Two separate CLI invocations with the same args produce identical file sets |

Seeds used: `0, 1, 42, 0xDEADBEEF, 2^63+12345` — chosen to exercise boundary
conditions (zero seed, large seed, prime, hex-notable value, near-overflow).

Canvas: 96px — small enough for fast CI, large enough to exercise the bicubic
rotate and composite code paths.

### Planned: `test_golden_digests.py` (T-002)

SHA-256 of 100 canonical seeds (0–99) at 96px, pinned in
`tests/fixtures/golden_digests.json`. This layer is the **dependency-drift
sentinel**: a Pillow upgrade that changes bicubic resampling will fail this test
before any manifest-consuming code encounters the change. See `T-002` backlog card.

## What is mocked vs. real

| Component | Approach |
|---|---|
| Filesystem (output dir) | `tmp_path` pytest fixture — real FS, cleaned up automatically |
| Fonts | Real system fonts loaded by `discover_fonts()` — no mocking. The frozen candidate list ensures determinism |
| RNG | Not mocked — we test that the real RNG is deterministic, mocking it would defeat the purpose |
| Time / clocks | No render-path code touches the clock; no mocking needed |
| NumPy noise | Real NumPy PCG64 seeded via `seed ^ NOISE_SALT` — tested by determinism suite |

## Coverage targets

| Layer | Target | Rationale |
|---|---|---|
| `sample_params` | 100% branch | All draw-order branches must be exercised |
| `render` | 100% line | Including the `noise == 0` skip and the `rotation == 0` skip |
| `encode_png` | 100% line | Simple; one code path |
| `main` / CLI | Covered by `test_cli_two_runs_byte_identical` | |
| `poc/manifest.py` (future) | ≥ 90% line | Round-trip test covers the main paths |
| `poc/pipeline.py` (future) | Determinism test across workers | |

Coverage is measured with `pytest --cov=poc --cov-report=term-missing`.

## How to run

```bash
# Full suite (fast — < 5 s)
pytest -q tests

# With coverage
pytest --cov=poc --cov-report=term-missing tests

# Single test
pytest -q tests/test_determinism.py::test_same_seed_same_bytes_within_process

# Rust unit tests
cd core && cargo test
```

## CI gating

CI (`.github/workflows/ci.yml`) runs `pytest -q tests` on every push and PR.
A failure blocks merge. The golden-digest test (T-002) will also block merge
once implemented. The benchmark job is non-blocking (`continue-on-error: true`)
to avoid flaky infrastructure affecting merge decisions.

## Cross-platform determinism

The determinism tests run on GitHub Actions `ubuntu-latest`. The golden-digest
fixture is generated on the dev workstation (Windows 11) and must match the Linux
CI result. Any discrepancy indicates a platform-sensitive code path that must be
fixed. See `docs/OBSERVABILITY.md` for how to log and compare cross-platform runs.

## Performance regression testing

The `--benchmark` CLI mode is the primary tool. Performance tests are not in the
automated pytest suite (they are too environment-sensitive for CI assertions).
Instead, benchmark output is committed to `docs/benchmarks/` as a named record
whenever a performance change is made. See `docs/THROUGHPUT.md` for the budget
each stage must respect.
