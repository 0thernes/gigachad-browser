"""Sampler uniformity / bias test.

Draw a large number of seeds and assert:
  1. Every parameter axis spans its full range (min == 0, max == cardinality-1).
  2. Samples are roughly uniform via coarse bucket counts with a generous
     tolerance (the test must be deterministic and fast, not a rigorous
     chi-square gate).
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

_POC = Path(__file__).resolve().parents[1] / "poc" / "glyph_engine.py"
_spec = importlib.util.spec_from_file_location("glyph_engine", _POC)
ge = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ge)

# Use a fixed stride so the sample set is deterministic and reproducible.
N = 2000          # enough for coarse uniformity; keeps the suite fast
STRIDE = 65537    # large odd prime — spaces seeds far apart in u64 space
BUCKETS = 8       # coarse bucket count; each axis divided into this many bins
# Allow a factor-of-4 deviation from the expected bucket count.
# Genuine bias (modulo-N over a small axis) would produce a visible skew;
# natural statistical noise on N=2000 samples is well within ×2.
TOLERANCE_FACTOR = 4.0


def _collect_params(n: int, stride: int) -> list[dict]:
    fonts = ge.discover_fonts()
    seeds = ge.build_seeds(0, n, stride)
    return [ge.sample_params(s, fonts) for s in seeds]


def test_stride_samples_span_full_range():
    """Every axis must hit both 0 and its maximum value across N stride-spaced seeds."""
    params = _collect_params(N, STRIDE)
    fonts = ge.discover_fonts()

    # Collect observed min/max for integer axes that are 0-indexed.
    size_steps   = [p["size_step"]   for p in params]
    rotations    = [p["rotation"]    for p in params]
    noise_levels = [p["noise"]       for p in params]

    # size_step: randrange(32) -> 0..31
    assert min(size_steps) == 0,  "size_step never hit 0"
    assert max(size_steps) == 31, "size_step never hit max"

    # rotation: randrange(360) -> 0..359
    assert min(rotations) == 0,   "rotation never hit 0"
    assert max(rotations) == 359, "rotation never hit max"

    # noise: randrange(16) -> 0..15
    assert min(noise_levels) == 0,  "noise never hit 0"
    assert max(noise_levels) == 15, "noise never hit max"


def test_stride_samples_roughly_uniform():
    """Coarse bucket counts must not deviate more than TOLERANCE_FACTOR from expected."""
    params = _collect_params(N, STRIDE)
    expected_per_bucket = N / BUCKETS

    def check_axis(values: list[int], cardinality: int, name: str) -> None:
        counts = [0] * BUCKETS
        for v in values:
            bucket = int(v * BUCKETS / cardinality)
            counts[min(bucket, BUCKETS - 1)] += 1
        for i, c in enumerate(counts):
            assert c >= expected_per_bucket / TOLERANCE_FACTOR, (
                f"{name} bucket {i}: count {c} is below lower bound "
                f"{expected_per_bucket / TOLERANCE_FACTOR:.1f}"
            )
            assert c <= expected_per_bucket * TOLERANCE_FACTOR, (
                f"{name} bucket {i}: count {c} exceeds upper bound "
                f"{expected_per_bucket * TOLERANCE_FACTOR:.1f}"
            )

    check_axis([p["size_step"] for p in params],   32,  "size_step")
    check_axis([p["rotation"]  for p in params],   360, "rotation")
    check_axis([p["noise"]     for p in params],   16,  "noise")


def test_sequential_seeds_also_uniform():
    """Stride=1 (sequential seeds) must pass the same uniformity checks."""
    params = _collect_params(N, 1)
    expected_per_bucket = N / BUCKETS

    def check_axis(values: list[int], cardinality: int, name: str) -> None:
        counts = [0] * BUCKETS
        for v in values:
            bucket = int(v * BUCKETS / cardinality)
            counts[min(bucket, BUCKETS - 1)] += 1
        for i, c in enumerate(counts):
            assert c >= expected_per_bucket / TOLERANCE_FACTOR, (
                f"sequential {name} bucket {i}: count {c} below lower bound"
            )
            assert c <= expected_per_bucket * TOLERANCE_FACTOR, (
                f"sequential {name} bucket {i}: count {c} above upper bound"
            )

    check_axis([p["size_step"] for p in params],   32,  "size_step")
    check_axis([p["rotation"]  for p in params],   360, "rotation")
    check_axis([p["noise"]     for p in params],   16,  "noise")
