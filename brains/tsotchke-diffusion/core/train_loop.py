"""Long-run Chaos Mode trainer for free cloud GPUs (Kaggle / Colab), importable from a notebook.

Same model, labels, data stream, noise schedule and loss as core.chaos.train, plus what long runs need:
  - fp16 mixed precision (AMP) on CUDA, EMA weights, LR warmup
  - atomic checkpoint every N steps + automatic resume (Colab disconnects, Kaggle 12h cap)
  - rolling numbered snapshots (keep the last K), preview grid every N steps
  - optional wall-clock budget so the run saves cleanly before a session is killed
Output folder is app-compatible: model.pt = {model, vocab} (EMA weights) + meta.json kind=chaos,
so it can be dropped into the app's models/ folder and loaded by core.chaos.load."""
import glob, json, os, random, shutil, time, numpy as np, torch, torch.nn.functional as F
from . import rng
from .chaos import ChaosUNet, index_folder, Stream, blend, sample as chaos_sample
from .diffusion import schedule, device, to_pil


def _ema_update(ema, net, decay):
    with torch.no_grad():
        for e, p in zip(ema.parameters(), net.parameters()): e.mul_(decay).add_(p.detach(), alpha=1 - decay)
        for e, b in zip(ema.buffers(), net.buffers()): e.copy_(b)


def preview(net, meta, path, n_steps=50, seed=0):
    """Grid: one sample per character (up to 16) + 4 multi-character chaos blends."""
    from .chaos import chaos_string
    V = net.vocab[:16]; conds = [blend(net, c) for c in V]
    conds += [blend(net, chaos_string(net, 3, k), seed=k) for k in range(4)]
    was = net.training; net.eval()
    x, _ = chaos_sample(net, meta, torch.stack(conds), steps=n_steps, seed=seed)
    net.train(was); to_pil(x, nrow=min(8, len(conds)), up=2).save(path); return path


def train(folder, out, total_steps, res=64, bs=32, lr=2e-4, ch=32, p_uncond=0.15, T=400, amp=True, ema_decay=0.9995,
          warmup=1000, ckpt_every=1000, keep_snapshots=5, preview_every=5000, preview_steps=50, log_every=100,
          time_budget_min=None, init_from=None, workers_cache=2048, status=print):
    """Train until `total_steps` TOTAL steps (resume-safe: re-running continues where the last checkpoint stopped)."""
    dev = device(); cuda = dev.type == "cuda"; amp = bool(amp and cuda)
    if cuda: torch.backends.cudnn.benchmark = True
    items = index_folder(folder); assert items, f"no images in {folder}"
    chars = sorted(set(c for _, c in items)); os.makedirs(out, exist_ok=True)
    ck = os.path.join(out, "ckpt.pt"); snapdir = os.path.join(out, "snapshots"); prevdir = os.path.join(out, "previews")
    os.makedirs(snapdir, exist_ok=True); os.makedirs(prevdir, exist_ok=True)
    start, log, c = 0, [], None
    if not os.path.exists(ck):  # fall back to the newest snapshot if the main checkpoint is missing/corrupt
        snaps = sorted(glob.glob(os.path.join(snapdir, "step_*.pt")))
        if snaps: ck_src = snaps[-1]
        else: ck_src = None
    else: ck_src = ck
    if ck_src:
        c = torch.load(ck_src, map_location=dev, weights_only=False)
        if c["cfg"].get("res") != res or c["cfg"].get("ch", 32) != ch:
            raise RuntimeError(f"Checkpoint in {out} was trained at res={c['cfg'].get('res')} ch={c['cfg'].get('ch', 32)}. "
                               "Use the same settings, or a new RUN_NAME.")
        net = ChaosUNet(c["vocab"], ch=ch).to(dev); net.load_state_dict(c["model"])
    else:
        torch.manual_seed(rng.seed64(b"chaos/init")); net = ChaosUNet(chars, ch=ch).to(dev)
        if init_from:
            sd = torch.load(os.path.join(init_from, "model.pt"), map_location=dev, weights_only=False); sd = sd.get("model", sd)
            sd = {k: v for k, v in sd.items() if not k.startswith("emb.")}
            net.load_state_dict(sd, strict=False); status(f"warm start from {init_from}")
    grew = net.grow(chars)
    ema = ChaosUNet(net.vocab, ch=ch).to(dev); ema.load_state_dict(net.state_dict()); ema.requires_grad_(False)
    opt = torch.optim.AdamW(net.parameters(), lr); scaler = torch.amp.GradScaler("cuda", enabled=amp)
    if c is not None:
        start, log = c["step"], c["log"]
        if c.get("ema") and not grew: ema.load_state_dict(c["ema"])
        if not grew:
            opt.load_state_dict(c["opt"])
            if c.get("scaler") and amp: scaler.load_state_dict(c["scaler"])
        status(f"RESUMED from {os.path.basename(ck_src)} at step {start} (+{grew} new chars, vocab={len(net.vocab)})")
    else:
        status(f"fresh run: {len(items)} images, {len(chars)} characters, {sum(p.numel() for p in net.parameters())/1e6:.2f}M params, device={dev}, amp={amp}")
    cfg = dict(kind="chaos", init_from=init_from, res=res, T=T, bs=bs, lr=lr, ch=ch, p_uncond=p_uncond, amp=amp,
               ema_decay=ema_decay, data=os.path.abspath(folder), n_images=len(items), rng_mode=rng.active())
    betas, al, ab = [v.to(dev) for v in schedule("linear", T)]
    st = Stream(items, cache=workers_cache); rnd = random.Random(rng.seed64(b"chaos/aug") + start)
    t0 = time.time(); net.train()

    def save(step):
        meta = dict(cfg, vocab=net.vocab, steps=step, params=sum(p.numel() for p in net.parameters()),
                    loss_avg100=float(np.mean(log[-100:])) if log else None, weights="ema")
        blob = dict(model=net.state_dict(), ema=ema.state_dict(), opt=opt.state_dict(), scaler=scaler.state_dict(),
                    step=step, log=log, cfg=cfg, vocab=net.vocab)
        torch.save(blob, ck + ".tmp"); os.replace(ck + ".tmp", ck)
        if keep_snapshots:
            shutil.copyfile(ck, os.path.join(snapdir, f"step_{step:07d}.pt"))
            for old in sorted(glob.glob(os.path.join(snapdir, "step_*.pt")))[:-keep_snapshots]: os.remove(old)
        torch.save(dict(model=ema.state_dict(), vocab=net.vocab), os.path.join(out, "model.pt.tmp"))
        os.replace(os.path.join(out, "model.pt.tmp"), os.path.join(out, "model.pt"))
        json.dump(meta, open(os.path.join(out, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        json.dump(log, open(os.path.join(out, "loss.json"), "w"))
        return meta

    if start >= total_steps:
        status(f"already at step {start} >= {total_steps}; raise TOTAL_STEPS to train more."); return ema, save(start)
    meta = None
    for it in range(start, total_steps):
        if time_budget_min and time.time() - t0 > time_budget_min * 60:
            status(f"time budget reached at step {it}; saved. Re-run to continue."); return ema, save(it)
        for g in opt.param_groups: g["lr"] = lr * min(1.0, (it + 1) / max(1, warmup))
        x, labs = st.batch(bs, res, rnd); x = x.to(dev, non_blocking=True)
        idx = torch.tensor(net.idx(labs), device=dev)
        idx = torch.where(torch.rand(bs, device=dev) < p_uncond, torch.zeros_like(idx), idx)
        t = torch.randint(0, T, (bs,), device=dev); n = torch.randn_like(x)
        a = ab[t].sqrt()[:, None, None, None]; xt = a * x + (1 - a ** 2).sqrt() * n
        with torch.autocast("cuda", dtype=torch.float16, enabled=amp):
            loss = F.mse_loss(net(xt, t, net.emb(idx)).float(), n)
        opt.zero_grad(set_to_none=True); scaler.scale(loss).backward(); scaler.unscale_(opt)
        torch.nn.utils.clip_grad_norm_(net.parameters(), 1.0); scaler.step(opt); scaler.update()
        _ema_update(ema, net, min(ema_decay, (1 + it) / (10 + it)))
        log.append(loss.item())
        s = it + 1
        if s % log_every == 0:
            el = time.time() - t0; rate = (s - start) / max(el, 1e-9)
            status(f"step {s}/{total_steps}  loss(avg100)={np.mean(log[-100:]):.4f}  {rate:.1f} it/s  ETA {(total_steps-s)/max(rate,1e-9)/60:.0f} min")
        if s % ckpt_every == 0 or s == total_steps: meta = save(s); status(f"  checkpoint saved @ {s}")
        if preview_every and s % preview_every == 0:
            p = preview(ema, meta or save(s), os.path.join(prevdir, f"step_{s:07d}.png"), preview_steps); status(f"  preview -> {p}")
    return ema, meta or save(total_steps)
