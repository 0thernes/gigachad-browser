# T-003 — Multiprocess pipeline — seed-range partitioning

**Column:** Backlog | **Priority:** High | **Estimate:** L (3–7 days)

## Context

The PoC renderer runs in a single process and achieves 90.4 img/s. The 1M/day
MVP target (Phase 1) requires ≥ 139 img/s aggregate — comfortably within reach
with multiprocessing because there is **zero shared state** between seeds. The
Python GIL makes threading useless for CPU-bound rendering; `multiprocessing`
partitions the seed range across N worker processes, each calling the existing
`render()` and `encode_png()` functions independently.

Per `docs/THROUGHPUT.md`: "16 workers (multiprocess): ~1,000–1,400 img/s" —
at 256px, the projected 7–10× single-core speedup would put peak at 600–900
img/s, well over target.

## Acceptance Criteria

- [ ] `poc/pipeline.py` (or equivalent) implements `run_parallel(start_seed, count,
      workers, out_dir, size)` using `multiprocessing.Pool` or `ProcessPoolExecutor`.
- [ ] Worker count defaults to `os.cpu_count()` with a `--workers` CLI override.
- [ ] Seed-range partitioning is deterministic: `worker_i` handles the contiguous
      range `[start + i * chunk, start + (i+1) * chunk)`, ensuring no overlap and
      complete coverage.
- [ ] End-to-end test: 1,000 images rendered with 4 workers; file set is byte-
      identical to a single-process run (same seed range).
- [ ] Wall-clock timing printed on completion: `ceae-poc/X.Y.Z | N images in T s = R img/s using W workers`.
- [ ] Benchmark shows ≥ 400 img/s at 256px with 8 workers on the dev workstation
      (a conservative minimum given the 90.4 baseline; record actual result in
      a `docs/` file).

## Definition of Done

- `pytest -q tests` still green (determinism tests unaffected).
- A benchmark run output file committed to `docs/` or the PR description showing
  wall-clock time for 1M images projected.
- `README.md` MVP milestone updated with measured aggregate throughput.

## Estimate

L — the partitioning logic is simple; the effort is correctness testing,
cross-platform `multiprocessing` start-method handling (spawn on Windows,
fork on Linux), and writing the benchmark record.

## Dependencies

None required. T-005 (sharded sink) is a parallel dependency — both can be
developed simultaneously and composed afterwards.
