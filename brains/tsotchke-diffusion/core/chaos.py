"""Chaos Mode: class-conditional DDPM where every class is ONE Unicode character.
- ChaosUNet = the same tiny UNet + a learned nn.Embedding per character (row 0 = null token for classifier-free guidance).
- Labels: labels.json {filename: char} in the folder, else sub-folder name (one folder per char), else first char of filename stem.
- Streaming: we index file paths only and decode images on demand (small LRU cache), so folders can be far bigger than RAM.
- Growing vocab: new characters append rows to the embedding table; trained rows are copied unchanged.
QRNG = Tsotchke quantum_rng, a CLASSICAL simulation (seeded, deterministic). Not real quantum randomness."""
import json, math, os, random, time, collections, numpy as np, torch, torch.nn as nn, torch.nn.functional as F
from PIL import Image
from .model import UNet, temb
from . import rng, data
from .diffusion import schedule, device, ROOT

IMG_EXT = (".png", ".jpg", ".jpeg", ".webp", ".bmp")

class ChaosUNet(UNet):
    def __init__(s, vocab, ch=32):
        super().__init__(neuro=False, ch=ch); s.vocab = list(vocab)  # vocab[i] -> embedding row i+1; row 0 = null
        s.emb = nn.Embedding(len(s.vocab) + 1, ch * 4); nn.init.normal_(s.emb.weight, std=0.5)
    def idx(s, chars): return [s.vocab.index(c) + 1 for c in chars]
    def forward(s, x, t, c):  # c: (B, E) conditioning vector (already looked up / blended)
        e = s.t(temb(t, s.ch)) + c; h = s.inp(x); hs = []
        for i, b in enumerate(s.down):
            h = b(h, e); hs.append(h)
            if i < 2: h = F.avg_pool2d(h, 2)
        h = s.mid(h, e)
        for i, b in enumerate(s.up):
            h = b(torch.cat([h, hs.pop()], 1), e)
            if i < 2: h = F.interpolate(h, scale_factor=2, mode="nearest")
        return s.out(h)
    def grow(s, new_chars):
        """Add characters without touching existing rows."""
        add = [c for c in dict.fromkeys(new_chars) if c not in s.vocab]
        if not add: return 0
        old = s.emb.weight.data; ne = nn.Embedding(old.shape[0] + len(add), old.shape[1]).to(old.device)
        nn.init.normal_(ne.weight, std=0.5); ne.weight.data[:old.shape[0]] = old
        s.emb = ne; s.vocab += add; return len(add)

# ---------------- labels / dataset ----------------
def index_folder(folder):
    """Return [(path, char)] without decoding any image. Walks sub-folders lazily (os.scandir)."""
    lj = os.path.join(folder, "labels.json"); lab = json.load(open(lj, encoding="utf-8")) if os.path.exists(lj) else {}
    out = []
    def walk(d, sub_char):
        with os.scandir(d) as it:
            for e in sorted(it, key=lambda e: e.name):
                if e.is_dir(): walk(e.path, sub_char or (e.name[0] if e.name else None))
                elif e.name.lower().endswith(IMG_EXT):
                    rel = os.path.relpath(e.path, folder).replace(os.sep, "/")
                    ch = lab.get(rel) or lab.get(e.name) or sub_char or os.path.splitext(e.name)[0][:1]
                    out.append((e.path, ch[0]))
    walk(folder, None); return out

def random_unicode_chars(n, seed=b"chaos/assign", taken=()):
    """n unique printable chars drawn with the active seed source (Tsotchke QRNG simulation by default)."""
    pools = [(0x2190, 0x2BFF), (0x3040, 0x30FF), (0x0400, 0x04FF), (0x0370, 0x03FF), (0x16A0, 0x16F0),
             (0xA000, 0xA48C), (0x1F300, 0x1F5FF), (0x0E00, 0x0E5B), (0x2800, 0x28FF), (0x4E00, 0x9FFF)]
    import unicodedata
    out, k = [], 0
    while len(out) < n:
        v = rng.seed64(seed + b"/" + str(k).encode()); k += 1
        a, b = pools[v % len(pools)]; c = chr(a + (v >> 8) % (b - a))
        if c in out or c in taken or not c.isprintable() or unicodedata.category(c).startswith(("C", "Z", "M")): continue
        out.append(c)
    return out

def assign_labels(folder, seed=b"chaos/assign"):
    """Give every unlabeled image in `folder` a random unique Unicode char, written to labels.json (files are not renamed)."""
    lj = os.path.join(folder, "labels.json"); lab = json.load(open(lj, encoding="utf-8")) if os.path.exists(lj) else {}
    files = sorted(f for f in os.listdir(folder) if f.lower().endswith(IMG_EXT) and f not in lab)
    new = random_unicode_chars(len(files), seed, taken=set(lab.values()))
    lab.update(zip(files, new)); json.dump(lab, open(lj, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return lab

class Stream:
    """On-demand image decoding with an LRU cache of `cache` images (short side resized to `short`)."""
    def __init__(s, items, short=256, cache=512):
        s.items, s.short, s.cache, s.c = items, short, cache, collections.OrderedDict()
    def get(s, i):
        if i in s.c: s.c.move_to_end(i); return s.c[i]
        im = Image.open(s.items[i][0]).convert("RGB"); f = s.short / min(im.size)
        if f < 1: im = im.resize((round(im.size[0] * f), round(im.size[1] * f)), Image.LANCZOS)
        s.c[i] = im
        if len(s.c) > s.cache: s.c.popitem(last=False)
        return im
    def batch(s, n, res, rnd):
        ids = [rnd.randrange(len(s.items)) for _ in range(n)]
        return torch.stack([data.aug(s.get(i), res, rnd) for i in ids]), [s.items[i][1] for i in ids]

# ---------------- training ----------------
def train(folder, out, steps, init_from=None, res=64, bs=16, lr=2e-4, p_uncond=0.15, T=400, ckpt_every=250, threads=0, log_every=100, stop=lambda: False, status=print):
    torch.set_flush_denormal(True)
    if threads: torch.set_num_threads(threads)
    dev = device(); items = index_folder(folder)
    assert items, f"no images in {folder}"
    os.makedirs(out, exist_ok=True); ck = os.path.join(out, "ckpt.pt")
    chars = sorted(set(c for _, c in items)); start, log = 0, []
    if os.path.exists(ck):
        c = torch.load(ck, map_location=dev, weights_only=False)
        assert c["cfg"]["res"] == res or True
        net = ChaosUNet(c["vocab"]).to(dev); net.load_state_dict(c["model"])
        grew = net.grow(chars); opt = torch.optim.AdamW(net.parameters(), lr)
        if not grew: opt.load_state_dict(c["opt"])  # optimizer state no longer matches if the table grew
        start, log = c["step"], c["log"]; status(f"resumed at step {start}, +{grew} new chars, vocab={len(net.vocab)}")
    else:
        torch.manual_seed(rng.seed64(b"chaos/init")); net = ChaosUNet(chars).to(dev)
        if init_from:  # warm-start the shared UNet weights from an unconditional checkpoint (embedding table stays fresh)
            sd = torch.load(os.path.join(init_from, "model.pt"), map_location=dev, weights_only=True); sd = sd.get("model", sd)
            miss = net.load_state_dict(sd, strict=False); status(f"warm start from {init_from}; new params: {miss.missing_keys}")
        cfg_init = init_from; opt = torch.optim.AdamW(net.parameters(), lr)
    cfg = dict(kind="chaos", init_from=locals().get('cfg_init'), res=res, T=T, bs=bs, lr=lr, p_uncond=p_uncond, data=os.path.abspath(folder), n_images=len(items), rng_mode=rng.active())
    betas, al, ab = [v.to(dev) for v in schedule("linear", T)]
    st = Stream(items); rnd = random.Random(rng.seed64(b"chaos/aug") + start); t0 = time.time(); net.train()
    def save(step):
        meta = dict(cfg, vocab=net.vocab, steps=step, params=sum(p.numel() for p in net.parameters()), loss_avg100=float(np.mean(log[-100:])) if log else None)
        torch.save(dict(model=net.state_dict(), opt=opt.state_dict(), step=step, log=log, cfg=cfg, vocab=net.vocab), ck + ".tmp"); os.replace(ck + ".tmp", ck)
        torch.save(dict(model=net.state_dict(), vocab=net.vocab), os.path.join(out, "model.pt"))
        json.dump(meta, open(os.path.join(out, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        json.dump(log, open(os.path.join(out, "loss.json"), "w"))
    for it in range(start, start + steps):
        if stop(): save(it); return net
        x, labs = st.batch(bs, res, rnd); x = x.to(dev)
        idx = torch.tensor(net.idx(labs), device=dev)
        idx = torch.where(torch.rand(bs, device=dev) < p_uncond, torch.zeros_like(idx), idx)  # label dropout -> null token
        t = torch.randint(0, T, (bs,), device=dev); n = torch.randn_like(x)
        a = ab[t].sqrt()[:, None, None, None]; xt = a * x + (1 - a ** 2).sqrt() * n
        loss = F.mse_loss(net(xt, t, net.emb(idx)), n)
        opt.zero_grad(); loss.backward(); torch.nn.utils.clip_grad_norm_(net.parameters(), 1.0); opt.step()
        log.append(loss.item())
        if (it + 1) % log_every == 0: status(f"step {it+1}/{start+steps} loss(avg100)={np.mean(log[-100:]):.4f} {time.time()-t0:.0f}s")
        if (it + 1) % ckpt_every == 0: save(it + 1)
    save(start + steps); return net

def load(path):
    sd = torch.load(os.path.join(path, "model.pt"), map_location="cpu", weights_only=False)
    meta = json.load(open(os.path.join(path, "meta.json"), encoding="utf-8"))
    net = ChaosUNet(sd["vocab"], ch=int(meta.get("ch", 32))); net.load_state_dict(sd["model"]); net.eval().to(device()); return net, meta

def list_models():
    import glob
    return {os.path.basename(d): d for d in sorted(glob.glob(os.path.join(ROOT, "runs", "*")) + glob.glob(os.path.join(ROOT, "models", "*")))
            if os.path.exists(os.path.join(d, "meta.json")) and json.load(open(os.path.join(d, "meta.json"), encoding="utf-8")).get("kind") == "chaos"}

# ---------------- generation ----------------
def chaos_string(net, n, seed):
    """QRNG-picked string of n chars from the trained vocab (repeats allowed)."""
    return "".join(net.vocab[rng.seed64(f"chaos/str/{seed}/{k}".encode()) % len(net.vocab)] for k in range(int(n)))

def blend(net, s, mode="mean", qweights=False, seed=0, noise=0.0, extrap=1.0):
    """Turn a string into one conditioning vector. Unknown chars become a QRNG-seeded random mix of known embeddings."""
    W = net.emb.weight.detach(); known = W[1:]; vecs = []
    for c in s:
        if c in net.vocab: vecs.append(W[net.vocab.index(c) + 1])
        else:
            g = torch.Generator().manual_seed(rng.seed64(("chaos/unk/" + c).encode()))
            w = torch.randn(len(known), generator=g).softmax(0).to(W.device); vecs.append(w @ known * math.sqrt(len(known)))
    V = torch.stack(vecs) if vecs else W[:1]
    w = torch.ones(len(V), device=W.device)
    if qweights: w = torch.tensor([rng.seed64(f"chaos/w/{seed}/{k}".encode()) / 2 ** 63 for k in range(len(V))], device=W.device) * 2
    v = (w[:, None] * V).sum(0) / (w.sum() if mode == "mean" else 1.0)
    v = W[0] + extrap * (v - W[0])  # extrapolate away from the null token (>1 = beyond anything seen)
    if noise:
        g = torch.Generator().manual_seed(rng.seed64(f"chaos/noise/{seed}".encode()))
        v = v + noise * known.std() * torch.randn(v.shape, generator=g).to(W.device)
    return v

@torch.no_grad()
def sample(net, meta, conds, steps=100, guidance=3.0, seed=0, eta=1.0, progress=None, res=None):
    """DDIM/DDPM with classifier-free guidance: eps = eps_null + w * (eps_cond - eps_null). conds: (n, E)."""
    dev = device(); T = int(meta["T"]); res = int(res or meta["res"]); n = len(conds)
    betas, al, ab = [v.to(dev) for v in schedule("linear", T)]
    steps = int(min(max(steps, 2), T)); g = torch.Generator(device=dev).manual_seed(int(seed))
    x = torch.randn(n, 3, res, res, generator=g, device=dev)
    ts = [int(v) for v in np.linspace(T - 1, 0, steps).round()]
    null = net.emb.weight[0][None].expand(n, -1); C = torch.cat([conds.to(dev), null])
    frames = [x.clone()]
    for k, i in enumerate(ts):
        t = torch.full((2 * n,), i, device=dev); e = net(torch.cat([x, x]), t, C)
        eps = e[n:] + guidance * (e[:n] - e[n:])
        x0 = ((x - (1 - ab[i]).sqrt() * eps) / ab[i].sqrt()).clamp(-1, 1)
        j = ts[k + 1] if k + 1 < len(ts) else -1
        abp = ab[j] if j >= 0 else torch.tensor(1.0, device=dev)
        eps_c = (x - ab[i].sqrt() * x0) / (1 - ab[i]).sqrt()
        sig = eta * ((1 - abp) / (1 - ab[i]) * (1 - ab[i] / abp)).clamp(min=0).sqrt()
        x = abp.sqrt() * x0 + (1 - abp - sig ** 2).clamp(min=0).sqrt() * eps_c
        if j >= 0: x = x + sig * torch.randn(x.shape, generator=g, device=dev)
        if k % max(1, len(ts) // 40) == 0 or k == len(ts) - 1: frames.append(x.clone())
        if progress: progress((k + 1) / len(ts))
    return x.clamp(-1, 1), frames
