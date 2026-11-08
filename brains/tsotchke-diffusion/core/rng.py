"""Seed source selection. Honest about what is active.
Order: (1) the real Tsotchke C library (Linux only, assets/libqrng.so), (2) the pure-Python port in qrng_py.py,
(3) plain seeded torch RNG. In all modes the QRNG only *derives integer seeds*; the per-pixel Gaussian noise is
drawn by torch.Generator seeded from it. Nothing here is quantum randomness: tsotchke quantum_rng is a classical
simulation of quantum-measurement-style mixing."""
import ctypes, hashlib, os, sys
from . import qrng_py
HERE = os.path.dirname(os.path.abspath(__file__))
# Known answer: qrng_seed64(b"tsotchke-diffusion-v1") from the Linux C library (runs/real_*/metrics.json)
KAT_SEED, KAT_VAL = b"tsotchke-diffusion-v1", 7012146681782266194
_C = None
if sys.platform.startswith("linux"):
    try:
        _C = ctypes.CDLL(os.path.join(HERE, "assets", "libqrng.so"))
        _C.qrng_init.argtypes = [ctypes.POINTER(ctypes.c_void_p), ctypes.c_char_p, ctypes.c_size_t]
        _C.qrng_bytes.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_size_t]
        _C.qrng_free.argtypes = [ctypes.c_void_p]
    except OSError:
        _C = None

def _c_bytes(seed, n):
    ctx = ctypes.c_void_p(); assert _C.qrng_init(ctypes.byref(ctx), seed, len(seed)) == 0
    buf = ctypes.create_string_buffer(n); assert _C.qrng_bytes(ctx, buf, n) == 0
    _C.qrng_free(ctx); return buf.raw

def _py_bytes(seed, n): return qrng_py.QRNG(seed).bytes(n)
def _torch_bytes(seed, n):  # fallback: SHA-256 counter mode, not Tsotchke at all
    out = b""; i = 0
    while len(out) < n: out += hashlib.sha256(seed + i.to_bytes(4, "little")).digest(); i += 1
    return out[:n]

def _kat(fn):
    try: return (int.from_bytes(fn(KAT_SEED, 8), "little") & ((1 << 63) - 1)) == KAT_VAL
    except Exception: return False

MODES = {}
if _C is not None and _kat(_c_bytes): MODES["tsotchke_c"] = (_c_bytes, "Tsotchke quantum_rng C library (assets/libqrng.so, Linux), seeded deterministic mode. Known-answer test passed.")
_py_ok = _kat(_py_bytes)
MODES["tsotchke_py"] = (_py_bytes, "Tsotchke quantum_rng, pure-Python port of the seeded mode. " + (
    "Known-answer test passed: on this machine it reproduces the Linux C library bit-for-bit." if _py_ok else
    "WARNING: known-answer test FAILED on this machine (the C code calls sin/cos on huge arguments and this math library rounds them differently). It is the same algorithm but the stream is NOT identical to the Linux reference."))
MODES["torch"] = (_torch_bytes, "Plain seeded RNG: SHA-256 of the seed text to make an integer seed for torch.Generator. No Tsotchke code involved.")
DEFAULT = "tsotchke_c" if "tsotchke_c" in MODES else "tsotchke_py"
_active = DEFAULT

def set_mode(m):
    global _active
    _active = m if m in MODES else DEFAULT
def active(): return _active
def describe(m=None): return MODES[m or _active][1]
def seed64(seed: bytes, mode=None) -> int:
    return int.from_bytes(MODES[mode or _active][0](seed, 8), "little") & ((1 << 63) - 1)
