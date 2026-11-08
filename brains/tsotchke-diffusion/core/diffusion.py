"""Model loading + DDPM/DDIM sampling with frame capture (for the 'watch it hallucinate' GIF)."""
import glob, json, os, torch, numpy as np
from PIL import Image
from .model import UNet
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get("TSOTCHKE_HOME") or os.path.dirname(HERE)  # the desktop .exe points this at the folder next to the exe

def device():
    return torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")

def schedule(sched="linear", T=400):
    if sched == "eshkol_cosine":  # alphabar(t) computed earlier by the Eshkol compiler; shipped as a text table
        abc = torch.tensor([float(l.split()[1]) for l in open(os.path.join(HERE, "assets", "schedule_eshkol.txt"))])
        betas = (1 - abc[1:] / abc[:-1]).clamp(max=0.999).float()
    else:
        betas = torch.linspace(1e-4, 0.02 * 1000 / T, T)
    al = 1 - betas; return betas, al, torch.cumprod(al, 0)

def tensorlogic_reach(seed64_fn):
    """Reach = H(Syn + Syn@Syn), the tensor-logic connectome rule, computed in torch (Eshkol not needed)."""
    from . import rng
    N, DENS = 64, 0.06
    b = torch.tensor(list(rng.MODES[rng.active()][0](b"tsotchke-diffusion-v1/syn", N * N)), dtype=torch.float64).view(N, N)
    S = (b < 256 * DENS).double()
    return ((S + torch.einsum("ij,jk->ik", S, S)) > 0).float()

def list_models():
    out = {}
    for d in sorted(glob.glob(os.path.join(ROOT, "models", "*")) + glob.glob(os.path.join(ROOT, "runs", "*"))):
        mj = os.path.join(d, "meta.json")
        if os.path.exists(mj) and json.load(open(mj, encoding="utf-8")).get("kind") == "chaos": continue  # Chaos Mode tab only
        if os.path.exists(os.path.join(d, "model.pt")):
            tag = "bundled" if os.sep + "models" + os.sep in d + os.sep else "yours"
            out[f"{os.path.basename(d)} ({tag})"] = d
    return out

def load(path):
    meta = {}
    for f in ("meta.json", "metrics.json"):
        p = os.path.join(path, f)
        if os.path.exists(p): meta = json.load(open(p)); break
    sd = torch.load(os.path.join(path, "model.pt"), map_location="cpu", weights_only=True)
    if "model" in sd and isinstance(sd["model"], dict): sd = sd["model"]
    neuro = bool(meta.get("neuro", any(".mask" in k for k in sd)))
    net = UNet(neuro=neuro, gen=torch.Generator().manual_seed(0) if neuro else None)
    net.load_state_dict(sd)  # masks/signs are buffers, so they come back exactly from the checkpoint
    net.eval().to(device())
    meta.setdefault("res", 64); meta.setdefault("T", 400); meta.setdefault("sched", "linear")
    return net, meta

def to_pil(x, nrow, up=4):
    x = ((x.clamp(-1, 1) + 1) * 127.5).round().byte().cpu().permute(0, 2, 3, 1).numpy()
    n, h, w, _ = x.shape; ncol = min(nrow, n); nr = (n + ncol - 1) // ncol
    grid = np.full((nr * (h + 2) + 2, ncol * (w + 2) + 2, 3), 255, np.uint8)
    for i in range(n):
        r, c = divmod(i, ncol); grid[2 + r * (h + 2):2 + r * (h + 2) + h, 2 + c * (w + 2):2 + c * (w + 2) + w] = x[i]
    im = Image.fromarray(grid)
    return im.resize((im.width * up, im.height * up), Image.NEAREST if up >= 4 else Image.LANCZOS) if up > 1 else im

@torch.no_grad()
def sample(net, meta, n=4, steps=None, seed=0, n_frames=40, progress=None, eta=1.0):
    """steps == T  -> original DDPM ancestral sampler (as in train.py).
    steps <  T  -> DDIM with a strided timestep subset (eta=1 is DDPM-like stochastic, 0 is deterministic)."""
    dev = device(); T = int(meta["T"]); res = int(meta["res"])
    betas, al, ab = [v.to(dev) for v in schedule(meta["sched"], T)]
    steps = int(min(max(steps or T, 2), T))
    g = torch.Generator(device=dev).manual_seed(int(seed))
    x = torch.randn(n, 3, res, res, generator=g, device=dev)
    ts = list(reversed(range(T))) if steps == T else [int(v) for v in np.linspace(T - 1, 0, steps).round()]
    frames = [x.clone()]; every = max(1, len(ts) // n_frames)
    for k, i in enumerate(ts):
        t = torch.full((n,), i, device=dev); eps = net(x, t)
        x0 = ((x - (1 - ab[i]).sqrt() * eps) / ab[i].sqrt()).clamp(-1, 1)
        if steps == T:
            abp = ab[i - 1] if i else torch.tensor(1.0, device=dev)
            mean = (abp.sqrt() * betas[i] / (1 - ab[i])) * x0 + (al[i].sqrt() * (1 - abp) / (1 - ab[i])) * x
            x = mean + ((((1 - abp) / (1 - ab[i]) * betas[i]).sqrt() * torch.randn(x.shape, generator=g, device=dev)) if i else 0)
        else:
            j = ts[k + 1] if k + 1 < len(ts) else -1
            abp = ab[j] if j >= 0 else torch.tensor(1.0, device=dev)
            eps_c = (x - ab[i].sqrt() * x0) / (1 - ab[i]).sqrt()  # eps consistent with the clipped x0
            sig = eta * ((1 - abp) / (1 - ab[i]) * (1 - ab[i] / abp)).clamp(min=0).sqrt()
            x = abp.sqrt() * x0 + (1 - abp - sig ** 2).clamp(min=0).sqrt() * eps_c
            if j >= 0: x = x + sig * torch.randn(x.shape, generator=g, device=dev)
        if k % every == 0 or k == len(ts) - 1: frames.append(x.clone())
        if progress: progress((k + 1) / len(ts))
    return x.clamp(-1, 1), frames
