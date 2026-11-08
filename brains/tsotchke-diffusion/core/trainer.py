"""Background DDPM trainer with regular checkpoints and resume."""
import json, os, random, threading, time, numpy as np, torch, torch.nn.functional as F
from .model import UNet
from . import rng, data
from .diffusion import schedule, device, tensorlogic_reach, ROOT

ARMS = {"baseline": dict(neuro=0, mask="random"),
        "neuro": dict(neuro=1, mask="random"),
        "tensorlogic": dict(neuro=1, mask="tensorlogic")}

class Trainer:
    def __init__(s):
        s.thread = None; s.stop_flag = False; s.log = []; s.status = "idle"; s.step = 0; s.total = 0; s.out = None
    def running(s): return s.thread is not None and s.thread.is_alive()
    def stop(s): s.stop_flag = True

    def start(s, folder, arm, steps, res, name, bs=16, lr=2e-4, ckpt_every=100, resume=True, seed="tsotchke-diffusion-v1", T=400, threads=0):
        if s.thread is not None: s.thread.join(timeout=3)  # a finished run may still be exiting
        if s.running(): return "A training run is already going. Stop it first."
        files, imgs = data.load_folder(folder)
        if not imgs: return f"No images found in {folder!r} (png/jpg/jpeg/webp/bmp)."
        s.stop_flag = False; s.log = []; s.step = 0; s.status = "starting"; s.total = int(steps)
        s.out = os.path.join(ROOT, "runs", "".join(c if c.isalnum() or c in "-_" else "_" for c in name) or "run")
        os.makedirs(s.out, exist_ok=True)
        cfg = dict(arm=arm, **ARMS[arm], sched="linear", res=int(res), T=int(T), bs=int(bs), lr=float(lr), seed=seed,
                   data=os.path.abspath(folder), n_images=len(imgs), rng_mode=rng.active(), device=str(device()))
        s.thread = threading.Thread(target=s._run, args=(imgs, cfg, int(steps), int(ckpt_every), resume, threads), daemon=True)
        s.thread.start(); return f"Started: {len(imgs)} images, arm={arm}, {res}px, {steps} steps -> {s.out}"

    def _run(s, imgs, cfg, steps, ckpt_every, resume, threads):
        try:
            torch.set_flush_denormal(True)
            if threads: torch.set_num_threads(threads)
            dev = device(); S = cfg["seed"].encode()
            seed = rng.seed64(S); mask_seed = rng.seed64(S + b"/connectome"); torch.manual_seed(seed)
            conn = tensorlogic_reach(rng.seed64) if cfg["mask"] == "tensorlogic" else None
            net = UNet(neuro=bool(cfg["neuro"]), gen=torch.Generator().manual_seed(mask_seed), conn=conn).to(dev)
            opt = torch.optim.AdamW(net.parameters(), cfg["lr"]); start = 0
            ck = os.path.join(s.out, "ckpt.pt")
            if resume and os.path.exists(ck):
                c = torch.load(ck, map_location=dev, weights_only=False)
                if c["cfg"]["arm"] != cfg["arm"] or c["cfg"]["res"] != cfg["res"]:
                    raise RuntimeError(f"Checkpoint in {s.out} is arm={c['cfg']['arm']} res={c['cfg']['res']}; pick a new run name or matching options.")
                net.load_state_dict(c["model"]); opt.load_state_dict(c["opt"]); start = c["step"]; s.log = c["log"]
                s.status = f"resumed from step {start}"
            s.total = start + steps
            betas, al, ab = [v.to(dev) for v in schedule("linear", cfg["T"])]
            rnd = random.Random(seed + start)  # resumed runs continue with a new (deterministic) augmentation stream
            json.dump(dict(cfg, params=sum(p.numel() for p in net.parameters())), open(os.path.join(s.out, "meta.json"), "w"), indent=1)
            t0 = time.time(); net.train()
            def save(step):
                torch.save(dict(model=net.state_dict(), opt=opt.state_dict(), step=step, log=s.log, cfg=cfg), ck + ".tmp")
                os.replace(ck + ".tmp", ck)
                torch.save(net.state_dict(), os.path.join(s.out, "model.pt"))
                json.dump(s.log, open(os.path.join(s.out, "loss.json"), "w"))
            for it in range(start, start + steps):
                if s.stop_flag: s.status = f"stopped at step {it}"; save(it); return
                x = data.batch(imgs, cfg["bs"], cfg["res"], rnd).to(dev)
                t = torch.randint(0, cfg["T"], (cfg["bs"],), device=dev); n = torch.randn_like(x)
                a = ab[t].sqrt()[:, None, None, None]; xt = a * x + (1 - a ** 2).sqrt() * n
                loss = F.mse_loss(net(xt, t), n)
                opt.zero_grad(); loss.backward(); torch.nn.utils.clip_grad_norm_(net.parameters(), 1.0); opt.step()
                s.log.append(float(loss)); s.step = it + 1
                s.status = f"step {it+1}/{start+steps}  loss(avg100)={np.mean(s.log[-100:]):.4f}  {time.time()-t0:.0f}s  on {dev}"
                if (it + 1) % ckpt_every == 0: save(it + 1)
            save(start + steps); s.status = f"done: {start+steps} steps, saved {s.out}"
        except Exception as e:
            import traceback; traceback.print_exc(); s.status = f"ERROR: {e}"
