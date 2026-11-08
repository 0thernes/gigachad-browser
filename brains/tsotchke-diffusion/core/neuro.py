"""Neuro-inspired layers. Each is a deliberate, heavy simplification (see README)."""
import torch, torch.nn as nn, torch.nn.functional as F

class LIFGate(nn.Module):
    """Leaky integrate-and-fire style activation: K micro-steps of u <- tau*u + x, soft spike
    s = sigmoid(k(u-theta)), soft reset u <- u - s*theta. Output = mean rate * x (spike-gated)."""
    def __init__(s, ch, K=3, tau=0.6, k=4.0):
        super().__init__(); s.K, s.tau, s.k = K, tau, k
        s.theta = nn.Parameter(torch.full((1, ch, 1, 1), 0.5))
    def forward(s, x):
        u = torch.zeros_like(x); rate = 0
        th = F.softplus(s.theta)
        for _ in range(s.K):
            u = s.tau * u + x
            sp = torch.sigmoid(s.k * (u - th)); rate = rate + sp
            u = u - sp * th
        return x * rate / s.K

class DaleConv(nn.Conv2d):
    """Dale's law: each presynaptic (input) channel is either excitatory (+) or inhibitory (-) for all
    its outgoing weights; 80/20 E:I like cortex. Optional fixed sparse 'connectome' mask on channel pairs."""
    def __init__(s, cin, cout, k, mask_gen=None, density=0.35, ei=0.8, conn=None, **kw):
        super().__init__(cin, cout, k, **kw)
        sign = torch.ones(cin); sign[int(cin * ei):] = -1.0
        s.register_buffer("sign", sign.view(1, cin, 1, 1))
        m = torch.ones(cout, cin, 1, 1)
        if conn is not None:  # tensor-logic Reach relation (Eshkol einsum), indexed by neuron id = channel mod N
            Nn = conn.shape[0]; m = conn[torch.arange(cout)[:, None] % Nn, torch.arange(cin)[None] % Nn].float()[..., None, None]
            m[torch.arange(cout), torch.arange(cout) % cin] = 1.0
        elif mask_gen is not None:
            m = (torch.rand(cout, cin, 1, 1, generator=mask_gen) < density).float()
            m[torch.arange(cout), torch.arange(cout) % cin] = 1.0  # keep each unit wired
        s.register_buffer("mask", m)
        with torch.no_grad(): s.weight.abs_()
    def forward(s, x):
        w = s.weight.abs() * s.sign * s.mask * (1.0 / s.mask.mean().sqrt())
        return F.conv2d(x, w, s.bias, s.stride, s.padding)

class Neuromod(nn.Module):
    """Neurotransmitter-like neuromodulation: a global diffusion-time signal (like a tonic
    dopamine/ACh level) sets per-channel multiplicative gain and threshold shift."""
    def __init__(s, emb, ch):
        super().__init__(); s.f = nn.Linear(emb, 2 * ch)
    def forward(s, h, e):
        g, b = s.f(e).chunk(2, 1)
        return h * (1 + torch.tanh(g))[..., None, None] + b[..., None, None]

class STP(nn.Module):
    """Tsodyks-Markram-like short-term depression across a block: available resources
    x = 1 - U*activity, efficacy = U*x; strong activity depresses transmission."""
    def __init__(s, ch):
        super().__init__(); s.U = nn.Parameter(torch.full((1, ch, 1, 1), 0.0))
    def forward(s, h):
        U = torch.sigmoid(s.U)
        act = torch.sigmoid(h.abs().mean((2, 3), keepdim=True))
        return h * (1 - U * act) * 2
