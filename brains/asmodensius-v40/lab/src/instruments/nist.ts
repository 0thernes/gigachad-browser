// Neuralese tsotchke/nist.js -> NIST SP 800-22 style tests on a creature's internal noise/QRNG stream:
// monobit frequency, block frequency (M=128), runs, and a chi-square on symbol counts. Controls: a mulberry32 PRNG stream (should pass)
// and a biased stream (p=0.6, should fail).
import type { CreatureLab } from "../interface";
import { mulberry } from "../rng";
function erfc(x: number) { const z = Math.abs(x), t = 1 / (1 + 0.5 * z); const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? r : 2 - r; }
function igamc(a: number, x: number) { // upper regularised incomplete gamma (series/continued fraction)
  const gln = (z: number) => { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = z, t = z + 5.5; t -= (z + 0.5) * Math.log(t); let s = 1.000000000190015; for (const cc of c) s += cc / ++y; return -t + Math.log(2.5066282746310005 * s / z); };
  if (x < a + 1) { let s = 1 / a, d = s, ap = a; for (let n = 0; n < 200; n++) { d *= x / ++ap; s += d; } return 1 - s * Math.exp(-x + a * Math.log(x) - gln(a)); }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d; for (let i = 1; i < 200; i++) { const an = -i * (i - a); b += 2; d = an * d + b; d = 1 / d; c = b + an / c; h *= d * c; } return Math.exp(-x + a * Math.log(x) - gln(a)) * h; }
export function nistBits(bits: Uint8Array) { const n = bits.length; let s = 0; for (const b of bits) s += b ? 1 : -1;
  const monobit = erfc(Math.abs(s) / Math.sqrt(n) / Math.SQRT2);
  const M = 128, N = Math.floor(n / M); let chi = 0; for (let i = 0; i < N; i++) { let o = 0; for (let j = 0; j < M; j++) o += bits[i * M + j]; chi += (o / M - 0.5) ** 2; } chi *= 4 * M; const block = igamc(N / 2, chi / 2);
  const pi = bits.reduce((a, b) => a + b, 0) / n; let v = 1; for (let i = 1; i < n; i++) if (bits[i] !== bits[i - 1]) v++; const runs = Math.abs(pi - 0.5) >= 2 / Math.sqrt(n) ? 0 : erfc(Math.abs(v - 2 * n * pi * (1 - pi)) / (2 * Math.sqrt(2 * n) * pi * (1 - pi)));
  const p = { monobit, blockFrequency: block, runs }; return { n, ones: pi, p, pass: Object.values(p).every((x) => x >= 0.01) }; }
export function symbolChi2(sym: number[], K: number) { const c = new Array(K).fill(0); for (const s of sym) c[s]++; const e = sym.length / K; const chi = c.reduce((a, x) => a + (x - e) ** 2 / e, 0); return { counts: c, chi2: chi, p: igamc((K - 1) / 2, chi / 2) }; }
export function nistOnCreature(c: CreatureLab, samples = 20000) {
  if (!c.noiseSample || !c.noiseBits) throw new Error("creature exposes no noise stream");
  const nb = c.noiseBits(), sym: number[] = []; for (let i = 0; i < samples; i++) { c.step(1); sym.push(c.noiseSample()); }
  const bits = new Uint8Array(samples * nb); sym.forEach((s, i) => { for (let b = 0; b < nb; b++) bits[i * nb + b] = (s >> b) & 1; });
  const lsb = Uint8Array.from(sym, (s) => s & 1); const r = mulberry(12345), ctl = Uint8Array.from({ length: bits.length }, () => (r() < 0.5 ? 1 : 0)), bias = Uint8Array.from({ length: bits.length }, () => (r() < 0.6 ? 1 : 0));
  return { samples, bitsPerSample: nb, creatureAllBits: nistBits(bits), creatureLsbOnly: nistBits(lsb), symbolUniformity: symbolChi2(sym, 1 << nb), controlPRNG: nistBits(ctl), controlBiased: nistBits(bias) };
}
