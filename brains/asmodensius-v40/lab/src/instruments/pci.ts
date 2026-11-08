// Neuralese FRONTIER pci -> perturbational complexity index (Casali et al. 2013 style, simplified):
// two clones with the same seed, one gets a TMS-like pulse into `part` at tick T; the binary matrix of spike differences
// (neurons x window) is compressed with Lempel-Ziv (LZ76) and normalised by its source entropy.
// Controls: (1) sham (amount 0) must give 0 response; (2) the same matrix with columns shuffled across neurons and time (upper bound).
import type { Factory } from "../interface";
import { mulberry } from "../rng";
export function lz76(s: Uint8Array) { const n = s.length; if (!n) return 0; let c = 1, l = 1, i = 0, k = 1, kmax = 1; for (;;) { if (s[i + k - 1] === s[l + k - 1]) { k++; if (l + k > n) { c++; break; } } else { if (k > kmax) kmax = k; i++; if (i === l) { c++; l += kmax; if (l + 1 > n) break; i = 0; k = 1; kmax = 1; } else k = 1; } } return c; }
const norm = (s: Uint8Array) => { const n = s.length, p = s.reduce((a, b) => a + b, 0) / n; if (p === 0 || p === 1) return 0; const H = -p * Math.log2(p) - (1 - p) * Math.log2(1 - p); return (lz76(s) * Math.log2(n)) / (n * H); };
export function pci(make: Factory, seed: number, part: string, amount: number, warm = 300, window = 60, rs = 1) {
  const run = (amt: number) => { const a = make(seed), b = make(seed); a.step(warm); b.step(warm); if (amt) b.stimulate(part, amt); const D: number[][] = [];
    for (let t = 0; t < window; t++) { a.step(1); b.step(1); const sa = a.spikes!(), sb = b.spikes!(); D.push(Array.from(sa, (x, i) => (x !== sb[i] ? 1 : 0))); } return D; };
  const flat = (D: number[][]) => { const N = D[0].length, out = new Uint8Array(N * D.length); let j = 0; for (let i = 0; i < N; i++) for (let t = 0; t < D.length; t++) out[j++] = D[t][i]; return out; };
  const D = run(amount), S = run(0), f = flat(D), r = mulberry(rs), g = f.slice(); for (let i = g.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [g[i], g[j]] = [g[j], g[i]]; }
  return { part, amount, window, responseFrac: f.reduce((a, b) => a + b, 0) / f.length, pci: norm(f), shamResponseFrac: flat(S).reduce((a, b) => a + b, 0) / f.length, shuffledUpperBound: norm(g) };
}
