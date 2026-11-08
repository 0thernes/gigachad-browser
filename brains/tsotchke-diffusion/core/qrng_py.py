"""Pure-Python port of tsotchke/quantum_rng seeded mode (src/quantum_rng/quantum_rng.c @1a77e77, MIT).
Only the deterministic (seeded) path is ported: qrng_init(seed) + qrng_bytes. It is a *classical* PRNG that
simulates quantum-measurement-flavoured mixing; it is not a source of quantum randomness.
Bit-exactness vs the C library was verified on Linux/glibc (see tests). The C code calls sin/cos on very large
arguments; different math libraries (e.g. Windows' CRT) may round those differently, so the Windows stream is
'the same algorithm' but is not guaranteed byte-identical to the Linux .so. The app checks this at startup."""
import math
M = (1 << 64) - 1
U64MAX_D = float(M)  # == 2**64 as a double, like (double)UINT64_MAX in C
FINE, PLANCK, RYD, EG, GOLD, SQRT2 = 0x7297352743776A1B, 0x6955927086495225, 0x9E3779B97F4A7C15, 0x2B992DDFA232945, 0x9E3779B97F4A7C15, 0x6A09E667F3BCC908
HEIS, SCHR, PX, PY, PZ = 0xC13FA9A902A6328F, 0x91E10DA5C79E7B1D, 0x4C957F2D8A1E6B3C, 0xD3E99E3B6C1A4F78, 0x8F142FC07892A5B6
FINE_D, PLANCK_D = float(FINE), float(PLANCK)
NQ, BUF, ROUNDS = 8, 128, 4

def qnoise(x):
    n = math.sin(x * math.pi) * math.cos(x * math.e); n = abs(n)
    mo = math.cos(n * FINE_D); po = math.sin(n * PLANCK_D)
    n = (mo * mo + po * po) * 0.5
    n = math.sqrt(n * (1.0 - n))
    return n - math.floor(n)

def sm(x):
    x ^= x >> 30; x = (x * 0xbf58476d1ce4e5b9) & M; x ^= x >> 27; x = (x * 0x94d049bb133111eb) & M
    x ^= x >> 31; x = (x * HEIS) & M; x ^= x >> 29; return x

def hmix(x):
    x = sm(x); x ^= (PX * (x >> 12)) & M; x = (x * FINE) & M; x ^= (PY * (x >> 25)) & M
    x = (x * PLANCK) & M; x ^= (PZ * (x >> 27)) & M; x = (x * SCHR) & M; x ^= x >> 13; return x

def d2u(d): return int(d * U64MAX_D) & M
def u2d(u): return float(u) / U64MAX_D

def hgate(x):
    x &= M; st = qnoise(u2d(x)); s = hmix(d2u(st) ^ x)
    ph = qnoise(st + 0.5); s ^= d2u(ph); return hmix(s)

def pgate(x, ang):
    ph = qnoise(u2d(ang & M)); m = hmix((d2u(ph) * RYD) & M)
    m ^= (PX * (m >> 17)) & M; m = (m * HEIS) & M; m ^= (PY * (m >> 23)) & M; m = (m * SCHR) & M
    return x ^ m

def absorb(seed):
    h = SQRT2 ^ sm((len(seed) + GOLD) & M)
    for b in seed:
        h ^= (b + GOLD + ((h << 6) & M) + (h >> 2)) & M; h = hmix(h)
    return h ^ sm(len(seed))

class QRNG:
    def __init__(s, seed: bytes):
        assert seed
        s.phase = [0] * NQ; s.ent = [0] * NQ; s.qs = [0.0] * NQ; s.last = [0] * NQ
        s.words = [0] * (BUF // 8); s.pos = 0; s.counter = 0; s.pool = [0.0] * 16; s.pidx = 0
        s.sys = absorb(seed); s.uid = sm(s.sys); s.pmix = HEIS ^ s.uid; s.rt = 0
        for i in range(16): s.pool[i] = qnoise(u2d(s.sys >> i) + 0.0 + 0.0 + 0.0)
        mixer = GOLD ^ s.sys; L = len(seed)
        for i in range(NQ):
            mixer = sm(mixer ^ seed[i % L])
            s.phase[i] = hgate(seed[i % L] ^ mixer ^ s.uid)
            s.qs[i] = qnoise(u2d(s.phase[i] ^ s.sys) + s.pool[i % 16] + 0.0)
            s.last[i] = s.measure(s.qs[i], seed[((L - 1 - i) & M) % L])  # size_t wraparound like C
            s.ent[i] = pgate(s.last[i], seed[i % L] ^ mixer)
        for _ in range(ROUNDS * 2): s.step()

    def measure(s, q, last):
        col = qnoise(q + 0.0)
        s.pool[s.pidx] = qnoise(s.pool[s.pidx] + col + 0.0); s.pidx = (s.pidx + 1) & 15
        s.pmix = hmix(s.pmix ^ d2u(s.pool[s.pidx]))
        r = d2u(col); r = hmix(r ^ ((last * EG) & M))
        r ^= (PX * (s.pmix >> 29)) & M; r = (r * HEIS) & M; r ^= (PY * (r >> 31)) & M
        r = (r * SCHR) & M; r ^= (PZ * (r >> 27)) & M; return r

    def step(s):
        s.counter = (s.counter + 1) & M; mixer = sm((s.counter * GOLD) & M)
        for rnd in range(ROUNDS):
            mixer = hmix(mixer ^ s.pmix)
            for i in range(NQ):
                s.phase[i] = hgate((s.counter + mixer + i + rnd) & M)
                s.qs[i] = qnoise(u2d(s.phase[i]) + s.pool[i & 15] + 0.0)
                me = s.measure(s.qs[i], s.last[i])
                s.ent[i] = pgate(me, s.counter ^ mixer); s.last[i] = me
                if i > 0:
                    s.ent[i] ^= hmix(s.ent[i - 1] ^ mixer)
                    s.qs[i] = qnoise(s.qs[i] + s.qs[i - 1] + 0.0)
                mixer = sm(mixer ^ me ^ s.pmix)
        prev = mixer
        for i in range(BUF // 8):
            c = s.measure(s.qs[i % NQ], s.ent[i % NQ])
            c = hmix(c ^ prev ^ s.pmix); c ^= (PX * (c >> 29)) & M; c = (c * HEIS) & M
            c ^= (PY * (c >> 31)) & M; c = (c * SCHR) & M
            s.words[i] = c; prev = c
        s.pos = 0

    def bytes(s, n):
        out = bytearray()
        while n > 0:
            if s.pos >= BUF: s.step()
            buf = b"".join(w.to_bytes(8, "little") for w in s.words)
            k = min(BUF - s.pos, n); out += buf[s.pos:s.pos + k]; s.pos += k; n -= k
        return bytes(out)
