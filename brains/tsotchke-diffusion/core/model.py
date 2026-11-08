import math, torch, torch.nn as nn, torch.nn.functional as F
from .neuro import LIFGate, DaleConv, Neuromod, STP

def temb(t, d):
    h = d // 2; f = torch.exp(-math.log(10000) * torch.arange(h) / h)
    a = t.float()[:, None] * f[None]; return torch.cat([a.sin(), a.cos()], 1)

class Block(nn.Module):
    def __init__(s, cin, cout, emb, neuro, gen, conn=None):
        super().__init__(); s.neuro = neuro
        s.n1, s.n2 = nn.GroupNorm(8, cin), nn.GroupNorm(8, cout)
        if neuro:
            s.c1 = DaleConv(cin, cout, 3, mask_gen=gen, conn=conn, padding=1)
            s.a1, s.a2 = LIFGate(cin), LIFGate(cout)
            s.mod, s.stp = Neuromod(emb, cout), STP(cout)
        else:
            s.c1 = nn.Conv2d(cin, cout, 3, padding=1); s.a1 = s.a2 = nn.SiLU()
            s.e = nn.Linear(emb, cout)
        s.c2 = nn.Conv2d(cout, cout, 3, padding=1)
        s.skip = nn.Conv2d(cin, cout, 1) if cin != cout else nn.Identity()
    def forward(s, x, e):
        h = s.c1(s.a1(s.n1(x)))
        h = s.mod(h, e) if s.neuro else h + s.e(e)[..., None, None]
        h = s.c2(s.a2(s.n2(h)))
        if s.neuro: h = s.stp(h)
        return h + s.skip(x)

class UNet(nn.Module):
    def __init__(s, neuro=False, ch=32, gen=None, conn=None):
        super().__init__(); E = ch * 4; s.ch = ch
        s.t = nn.Sequential(nn.Linear(ch, E), nn.SiLU(), nn.Linear(E, E))
        s.inp = nn.Conv2d(3, ch, 3, padding=1)
        cs = [ch, ch * 2, ch * 4]
        s.down = nn.ModuleList([Block(cs[0], cs[0], E, neuro, gen, conn), Block(cs[0], cs[1], E, neuro, gen, conn), Block(cs[1], cs[2], E, neuro, gen, conn)])
        s.mid = Block(cs[2], cs[2], E, neuro, gen, conn)
        s.up = nn.ModuleList([Block(cs[2] * 2, cs[1], E, neuro, gen, conn), Block(cs[1] * 2, cs[0], E, neuro, gen, conn), Block(cs[0] * 2, cs[0], E, neuro, gen, conn)])
        s.out = nn.Sequential(nn.GroupNorm(8, ch), nn.SiLU(), nn.Conv2d(ch, 3, 3, padding=1))
    def forward(s, x, t):
        e = s.t(temb(t, s.ch)); h = s.inp(x); hs = []
        for i, b in enumerate(s.down):
            h = b(h, e); hs.append(h)
            if i < 2: h = F.avg_pool2d(h, 2)
        h = s.mid(h, e)
        for i, b in enumerate(s.up):
            h = b(torch.cat([h, hs.pop()], 1), e)
            if i < 2: h = F.interpolate(h, scale_factor=2, mode="nearest")
        return s.out(h)
