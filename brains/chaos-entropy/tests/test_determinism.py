"""Determinism contract tests: same seed -> byte-identical image.

If any test here fails, either hidden entropy entered the render path or a
dependency upgrade changed rendering behavior. Both are breaking changes that
demand an engine version bump -- never weaken these tests to make them pass.
"""
import importlib.util
from pathlib import Path

_POC = Path(__file__).resolve().parents[1] / "poc" / "glyph_engine.py"
_spec = importlib.util.spec_from_file_location("glyph_engine", _POC)
ge = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ge)

SIZE = 96  # small canvas keeps the suite fast; the contract is size-independent
SEEDS = [0, 1, 42, 0xDEADBEEF, 2**63 + 12345]


def _render_bytes(seed: int, fonts) -> bytes:
    return ge.encode_png(ge.render(seed, SIZE, fonts))


def test_params_stable_under_repeat():
    fonts = ge.discover_fonts()
    for seed in SEEDS:
        assert ge.sample_params(seed, fonts) == ge.sample_params(seed, fonts)


def test_same_seed_same_bytes_within_process():
    fonts = ge.discover_fonts()
    for seed in SEEDS:
        assert _render_bytes(seed, fonts) == _render_bytes(seed, fonts)


def test_render_order_independence():
    """Rendering seeds in a different order must not change any image
    (catches cache/global-state leakage between renders)."""
    fonts = ge.discover_fonts()
    forward = {s: _render_bytes(s, fonts) for s in SEEDS}
    backward = {s: _render_bytes(s, fonts) for s in reversed(SEEDS)}
    assert forward == backward


def test_different_seeds_differ():
    fonts = ge.discover_fonts()
    blobs = {_render_bytes(s, fonts) for s in SEEDS}
    assert len(blobs) == len(SEEDS)


def test_cli_two_runs_byte_identical(tmp_path):
    """End-to-end: two CLI runs with identical args produce identical files."""
    run_a, run_b = tmp_path / "a", tmp_path / "b"
    common = ["--count", "4", "--seed", "7", "--size", str(SIZE)]
    assert ge.main([*common, "--out", str(run_a)]) == 0
    assert ge.main([*common, "--out", str(run_b)]) == 0
    names = sorted(p.name for p in run_a.iterdir())
    assert names == sorted(p.name for p in run_b.iterdir())
    assert len(names) == 4
    for name in names:
        assert (run_a / name).read_bytes() == (run_b / name).read_bytes()
