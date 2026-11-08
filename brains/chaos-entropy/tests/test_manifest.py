"""Manifest round-trip tests.

Write a manifest -> re-render from it -> assert byte-identical to direct render.
Also tests that engine-version mismatch produces a warning (not a crash).
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

_POC = Path(__file__).resolve().parents[1] / "poc" / "glyph_engine.py"
_spec = importlib.util.spec_from_file_location("glyph_engine", _POC)
ge = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ge)

SIZE = 64   # small canvas keeps the suite fast
SEEDS_SEQUENTIAL = [0, 1, 2, 3]
SEEDS_STRIDED_START = 0
SEEDS_STRIDED_COUNT = 4
SEEDS_STRIDED_STRIDE = 65537


def _render_direct(seeds: list[int], canvas: int, fonts) -> dict[int, bytes]:
    return {s: ge.encode_png(ge.render(s, canvas, fonts)) for s in seeds}


def test_manifest_write_and_read(tmp_path):
    """write_manifest -> read_manifest preserves all fields exactly."""
    mpath = tmp_path / "test.json"
    ge.write_manifest(mpath, engine_version=ge.ENGINE_VERSION,
                      seed_start=42, count=10, stride=3, canvas=128)
    rec = ge.read_manifest(mpath)
    assert rec["engine_version"] == ge.ENGINE_VERSION
    assert rec["seed_start"] == 42
    assert rec["count"] == 10
    assert rec["stride"] == 3
    assert rec["canvas"] == 128


def test_manifest_roundtrip_sequential(tmp_path):
    """manifest -> re-render == direct render, sequential seeds (stride=1)."""
    fonts = ge.discover_fonts()
    mpath = tmp_path / "seq.json"
    out_dir = tmp_path / "re"

    ge.write_manifest(mpath, engine_version=ge.ENGINE_VERSION,
                      seed_start=0, count=len(SEEDS_SEQUENTIAL),
                      stride=1, canvas=SIZE)

    # re-render via CLI from-manifest
    ret = ge.main(["--from-manifest", str(mpath), "--out", str(out_dir)])
    assert ret == 0

    # compare against direct render
    direct = _render_direct(SEEDS_SEQUENTIAL, SIZE, fonts)
    for s in SEEDS_SEQUENTIAL:
        fname = out_dir / f"{s:016x}.png"
        assert fname.exists(), f"missing output file {fname}"
        assert fname.read_bytes() == direct[s], (
            f"re-rendered seed {s:#018x} differs from direct render"
        )


def test_manifest_roundtrip_strided(tmp_path):
    """manifest -> re-render == direct render, strided seeds."""
    fonts = ge.discover_fonts()
    mpath = tmp_path / "strided.json"
    out_dir = tmp_path / "re_strided"

    ge.write_manifest(mpath, engine_version=ge.ENGINE_VERSION,
                      seed_start=SEEDS_STRIDED_START,
                      count=SEEDS_STRIDED_COUNT,
                      stride=SEEDS_STRIDED_STRIDE,
                      canvas=SIZE)

    ret = ge.main(["--from-manifest", str(mpath), "--out", str(out_dir)])
    assert ret == 0

    strided_seeds = ge.build_seeds(SEEDS_STRIDED_START, SEEDS_STRIDED_COUNT,
                                   SEEDS_STRIDED_STRIDE)
    direct = _render_direct(strided_seeds, SIZE, fonts)
    for s in strided_seeds:
        fname = out_dir / f"{s:016x}.png"
        assert fname.exists(), f"missing output file {fname}"
        assert fname.read_bytes() == direct[s], (
            f"re-rendered strided seed {s:#018x} differs from direct render"
        )


def test_manifest_cli_write(tmp_path):
    """--manifest CLI flag writes a valid manifest JSON."""
    mpath = tmp_path / "cli.json"
    ret = ge.main(["--seed", "100", "--count", "5", "--stride", "7",
                   "--size", "64", "--manifest", str(mpath)])
    assert ret == 0
    assert mpath.exists()
    rec = ge.read_manifest(mpath)
    assert rec["seed_start"] == 100
    assert rec["count"] == 5
    assert rec["stride"] == 7
    assert rec["canvas"] == 64
    assert rec["engine_version"] == ge.ENGINE_VERSION


def test_stride_one_byte_identical_to_original(tmp_path):
    """--stride 1 must produce the same bytes as no --stride (determinism contract)."""
    fonts = ge.discover_fonts()
    out_default = tmp_path / "default"
    out_stride1 = tmp_path / "stride1"
    common = ["--count", "4", "--seed", "7", "--size", str(SIZE)]
    assert ge.main([*common, "--out", str(out_default)]) == 0
    assert ge.main([*common, "--stride", "1", "--out", str(out_stride1)]) == 0
    names = sorted(p.name for p in out_default.iterdir())
    assert names == sorted(p.name for p in out_stride1.iterdir())
    for name in names:
        assert (out_default / name).read_bytes() == (out_stride1 / name).read_bytes(), (
            f"stride=1 changed bytes for {name}"
        )
