"""Image folder loading and augmentation in plain PIL/numpy (no torchvision, so installs stay small and version-safe).
Same recipe as the original train.py: rotation 25 deg, random resized crop scale 0.08-1 ratio 0.6-1.6, h-flip, v-flip p=0.2, colour jitter 0.1."""
import glob, math, os, random, numpy as np, torch
from PIL import Image, ImageEnhance
EXT = ("*.png", "*.jpg", "*.jpeg", "*.webp", "*.bmp")

def load_folder(folder, short=256):
    files = sorted(sum([glob.glob(os.path.join(folder, e)) + glob.glob(os.path.join(folder, e.upper())) for e in EXT], []))
    files = sorted(set(files)); imgs = []
    for f in files:
        try:
            im = Image.open(f).convert("RGB"); s = short / min(im.size)
            imgs.append(im.resize((round(im.size[0] * s), round(im.size[1] * s)), Image.LANCZOS) if s < 1 else im)
        except Exception as e:
            print("skip", f, e)
    return files, imgs

def aug(im, res, rnd):
    im = im.rotate(rnd.uniform(-25, 25), resample=Image.NEAREST)
    W, H = im.size; area = W * H
    for _ in range(10):
        a = area * rnd.uniform(0.08, 1.0); r = math.exp(rnd.uniform(math.log(0.6), math.log(1.6)))
        w, h = int(round(math.sqrt(a * r))), int(round(math.sqrt(a / r)))
        if 0 < w <= W and 0 < h <= H:
            x, y = rnd.randint(0, W - w), rnd.randint(0, H - h); break
    else:
        w = h = min(W, H); x, y = (W - w) // 2, (H - h) // 2
    im = im.resize((res, res), Image.BILINEAR, box=(x, y, x + w, y + h))
    if rnd.random() < 0.5: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    if rnd.random() < 0.2: im = im.transpose(Image.FLIP_TOP_BOTTOM)
    for E in (ImageEnhance.Brightness, ImageEnhance.Contrast, ImageEnhance.Color):
        im = E(im).enhance(rnd.uniform(0.9, 1.1))
    return torch.from_numpy(np.asarray(im, dtype=np.float32) / 127.5 - 1).permute(2, 0, 1)

def batch(imgs, n, res, rnd):
    return torch.stack([aug(imgs[rnd.randrange(len(imgs))], res, rnd) for _ in range(n)])
