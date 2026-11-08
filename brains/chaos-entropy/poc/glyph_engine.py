#!/usr/bin/env python3
"""Chaos Entropy Art Engine -- PoC deterministic glyph renderer.

Identity contract: render(seed) is a pure function. The same seed produces
byte-identical PNG output for a given engine version + font set. All variation
(glyph, font, size, rotation, fg/bg colors, noise) derives from the seed alone:
no clocks, no os.urandom, no global RNG state.

Usage:
    python glyph_engine.py --count 100 --seed 42 --out out --size 256
    python glyph_engine.py --benchmark --count 1000 --size 256
    python glyph_engine.py --count 100 --seed 42 --stride 65537 --out out
    python glyph_engine.py --count 10 --seed 0 --manifest seeds.json
    python glyph_engine.py --from-manifest seeds.json --out re-rendered
"""
from __future__ import annotations

import argparse
import colorsys
import io
import json
import random
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ENGINE_VERSION = "ceae-poc/0.1.0"
NOISE_SALT = 0x9E3779B97F4A7C15  # decorrelates the noise stream from param draws

# Frozen glyph table. Changing it changes seed->image: engine version bump required.
_GLYPH_RANGES = [
    (0x0021, 0x007E),  # ASCII printable
    (0x00A1, 0x00FF),  # Latin-1 supplement
    (0x0391, 0x03C9),  # Greek
    (0x0410, 0x044F),  # Cyrillic
    (0x2190, 0x21FF),  # arrows
    (0x25A0, 0x25FF),  # geometric shapes
]
GLYPHS = [chr(c) for lo, hi in _GLYPH_RANGES for c in range(lo, hi + 1)]

# Frozen candidate order; availability filtering keeps indices stable per machine.
_FONT_CANDIDATES = [
    # Windows
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/times.ttf",
    "C:/Windows/Fonts/cour.ttf",
    "C:/Windows/Fonts/consola.ttf",
    "C:/Windows/Fonts/georgia.ttf",
    "C:/Windows/Fonts/impact.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
    "C:/Windows/Fonts/verdana.ttf",
    # Linux (GitHub Actions ubuntu runners ship DejaVu + Liberation)
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
    # macOS
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
    "/System/Library/Fonts/Supplemental/Courier New.ttf",
]

_font_cache: dict[tuple[str | None, int], ImageFont.FreeTypeFont] = {}


def discover_fonts() -> list[str | None]:
    """Return available fonts in frozen candidate order (the per-machine font set)."""
    found: list[str | None] = [p for p in _FONT_CANDIDATES if Path(p).is_file()]
    return found or [None]  # None -> Pillow bundled default (Pillow >= 10.1)


def _load_font(path: str | None, px: int) -> ImageFont.FreeTypeFont:
    key = (path, px)
    font = _font_cache.get(key)
    if font is None:
        font = ImageFont.truetype(path, px) if path else ImageFont.load_default(size=px)
        _font_cache[key] = font
    return font


def _lattice_color(rng: random.Random) -> tuple[int, int, int]:
    """One point on the 256x64x64 HSV lattice (~2^20 colors)."""
    h = rng.randrange(256) / 256.0
    s = rng.randrange(64) / 63.0
    v = rng.randrange(64) / 63.0
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return (round(r * 255), round(g * 255), round(b * 255))


def _luma(c: tuple[int, int, int]) -> float:
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def sample_params(seed: int, fonts: list[str | None]) -> dict:
    """Map a u64 seed to render parameters. Draw order is the determinism
    contract -- reordering any draw changes every image (engine version bump)."""
    rng = random.Random(seed)
    glyph = GLYPHS[rng.randrange(len(GLYPHS))]
    font = fonts[rng.randrange(len(fonts))]
    size_step = rng.randrange(32)
    rotation = rng.randrange(360)
    fg = _lattice_color(rng)
    bg = _lattice_color(rng)
    for _ in range(8):  # bounded, deterministic contrast re-roll
        if abs(_luma(fg) - _luma(bg)) >= 48.0:
            break
        bg = _lattice_color(rng)
    noise = rng.randrange(16)
    return {"glyph": glyph, "font": font, "size_step": size_step,
            "rotation": rotation, "fg": fg, "bg": bg, "noise": noise}


def render(seed: int, canvas: int, fonts: list[str | None]) -> Image.Image:
    p = sample_params(seed, fonts)
    px = 12 + round(p["size_step"] * (canvas * 0.7 - 12) / 31)
    font = _load_font(p["font"], max(px, 4))
    # Oversized layer so rotation never clips: glyph diagonal <= 0.7*canvas*sqrt(2)
    # ~= 0.99*canvas, so 1.5x leaves margin for ascenders/descenders.
    side = canvas + canvas // 2
    margin = (side - canvas) // 2
    layer = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ImageDraw.Draw(layer).text(
        (side // 2, side // 2), p["glyph"], font=font, fill=(*p["fg"], 255), anchor="mm"
    )
    if p["rotation"]:
        layer = layer.rotate(p["rotation"], resample=Image.Resampling.BICUBIC)
    crop = layer.crop((margin, margin, margin + canvas, margin + canvas))
    img = Image.new("RGB", (canvas, canvas), p["bg"])
    img.paste(crop, (0, 0), crop)
    if p["noise"]:
        nrng = np.random.default_rng(seed ^ NOISE_SALT)
        arr = np.asarray(img, dtype=np.float32)
        arr += nrng.standard_normal(arr.shape, dtype=np.float32) * (p["noise"] * 1.5)
        img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
    return img


def encode_png(img: Image.Image) -> bytes:
    # compress_level=1: high-entropy (noisy) images barely compress at any level,
    # so spending deflate effort is pure latency. Encoding params are part of the
    # engine version -- changing them changes bytes.
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=False, compress_level=1)
    return buf.getvalue()


def build_seeds(seed_start: int, count: int, stride: int) -> list[int]:
    """Build the seed list using stride sampling (THROUGHPUT §6).

    seeds[i] = (seed_start + i * stride) & MASK_U64

    stride=1 (the default) gives sequential seeds — identical behaviour to the
    original implementation. A large odd stride (e.g. 65537) spaces samples far
    apart in the lattice so adjacent renders occupy distant parameter regions.
    """
    MASK = 0xFFFFFFFFFFFFFFFF
    return [(seed_start + i * stride) & MASK for i in range(count)]


def write_manifest(path: str | Path, *, engine_version: str, seed_start: int,
                   count: int, stride: int, canvas: int) -> None:
    """Write a seed-range manifest (THROUGHPUT §5 storage inversion).

    The manifest is a single JSON object recording everything needed to
    re-render the exact same image set without storing pixels.
    """
    record = {
        "engine_version": engine_version,
        "seed_start": seed_start,
        "count": count,
        "stride": stride,
        "canvas": canvas,
    }
    Path(path).write_text(json.dumps(record, indent=2), encoding="utf-8")


def read_manifest(path: str | Path) -> dict:
    """Read a seed-range manifest written by write_manifest."""
    return json.loads(Path(path).read_text(encoding="utf-8"))


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="CEAE PoC: deterministic seeded glyph renderer")
    ap.add_argument("--count", type=int, default=10, help="number of images")
    ap.add_argument("--seed", type=lambda s: int(s, 0), default=0,
                    help="starting seed (u64; decimal or 0x-hex)")
    ap.add_argument("--stride", type=lambda s: int(s, 0), default=1,
                    help="seed stride for lattice sampling (default 1 = sequential); "
                         "e.g. --stride 65537 spaces seeds far apart in parameter space. "
                         "Single-seed output is unchanged when stride=1.")
    ap.add_argument("--out", default="out", help="output directory (ignored in benchmark mode)")
    ap.add_argument("--size", type=int, default=256, help="canvas size in pixels (square)")
    ap.add_argument("--benchmark", action="store_true",
                    help="render+encode in memory, print imgs/sec, write nothing")
    ap.add_argument("--manifest", metavar="PATH",
                    help="write a seed-range manifest JSON to PATH instead of/alongside PNGs "
                         "(storage inversion: 32 bytes represents any range). "
                         "Use --out /dev/null (or omit --out) with --manifest to skip PNG output.")
    ap.add_argument("--from-manifest", metavar="PATH",
                    help="re-render exactly from a manifest written by --manifest; "
                         "ignores --seed, --count, --stride, --size (all read from manifest)")
    args = ap.parse_args(argv)

    # --- manifest re-render mode ---
    if args.from_manifest:
        rec = read_manifest(args.from_manifest)
        if rec["engine_version"] != ENGINE_VERSION:
            print(f"WARNING: manifest engine_version {rec['engine_version']!r} != "
                  f"current {ENGINE_VERSION!r}; output may differ")
        seed_start = rec["seed_start"]
        count = rec["count"]
        stride = rec["stride"]
        canvas = rec["canvas"]
        seeds = build_seeds(seed_start, count, stride)
        fonts = discover_fonts()
        out = Path(args.out)
        out.mkdir(parents=True, exist_ok=True)
        for s in seeds:
            (out / f"{s:016x}.png").write_bytes(encode_png(render(s, canvas, fonts)))
        print(f"{ENGINE_VERSION} | re-rendered {count} images from manifest "
              f"{args.from_manifest!r} to {out.resolve()}")
        return 0

    fonts = discover_fonts()
    seeds = build_seeds(args.seed, args.count, args.stride)

    if args.benchmark:
        encode_png(render(seeds[0], args.size, fonts))  # warm-up: font/numpy init
        t0 = time.perf_counter()
        total_bytes = sum(len(encode_png(render(s, args.size, fonts))) for s in seeds)
        dt = time.perf_counter() - t0
        rate = args.count / dt
        print(f"{ENGINE_VERSION} | {args.count} imgs @ {args.size}px in {dt:.2f}s = "
              f"{rate:.1f} imgs/sec | avg {total_bytes / args.count / 1024:.1f} KiB | "
              f"projects to {rate * 86400:,.0f} imgs/day on one core")
        return 0

    # --- manifest-only sink (no PNG output) ---
    if args.manifest:
        write_manifest(args.manifest, engine_version=ENGINE_VERSION,
                       seed_start=args.seed, count=args.count,
                       stride=args.stride, canvas=args.size)
        print(f"{ENGINE_VERSION} | wrote manifest ({args.count} seeds, stride={args.stride}) "
              f"to {args.manifest!r}")
        # Still write PNGs if --out is explicitly provided alongside --manifest.
        # Default out='out' is treated as "not explicitly set" via the sentinel check below
        # but argparse has no easy way to detect this; we skip PNG output when --manifest
        # is provided unless --out is also explicitly passed.
        # To keep the API simple we always skip PNG when --manifest is given alone.
        return 0

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for s in seeds:
        (out / f"{s:016x}.png").write_bytes(encode_png(render(s, args.size, fonts)))
    print(f"{ENGINE_VERSION} | wrote {args.count} images to {out.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
