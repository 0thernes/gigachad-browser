"""Memorization check: nearest training crop (RMS in pixel space) for each sample, vs a held-out-crop reference."""
import random, numpy as np, torch
from PIL import Image, ImageDraw
from . import data

def check(samples, imgs, res, bank_n=2000, ref_n=64, seed=999):
    rnd = random.Random(seed)
    bank = torch.cat([data.batch(imgs, 100, res, rnd) for _ in range(bank_n // 100)])
    ref = data.batch(imgs, ref_n, res, random.Random(seed + 1))
    D = samples[0].numel() ** .5
    def nn(q):
        d = torch.cdist(q.flatten(1).float().cpu(), bank.flatten(1)); v, i = d.min(1); return v / D, i
    ds, idx = nn(samples); dr, _ = nn(ref)
    med, p5 = float(dr.median()), float(dr.quantile(0.05))
    return ds, bank[idx], med, p5

def pairs_image(samples, nearest, ds, p5, up=4):
    n, _, h, w = samples.shape; W = 2 * w * up + 12; H = h * up + 18
    canvas = Image.new("RGB", (W * min(n, 4), H * ((n + 3) // 4)), "white"); dr = ImageDraw.Draw(canvas)
    to = lambda x: Image.fromarray(((x.clamp(-1, 1) + 1) * 127.5).round().byte().permute(1, 2, 0).cpu().numpy()).resize((w * up, h * up), Image.NEAREST)
    for k in range(n):
        r, c = divmod(k, 4); X, Y = c * W, r * H
        canvas.paste(to(samples[k]), (X, Y)); canvas.paste(to(nearest[k]), (X + w * up + 4, Y))
        flag = "NEAR-COPY?" if ds[k] < p5 else ""
        dr.text((X + 2, Y + h * up + 3), f"#{k} RMS {ds[k]:.3f} {flag}", fill="red" if flag else "black")
    return canvas
