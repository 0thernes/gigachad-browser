// Neuralese science.js cka / spectral / participation -> representational geometry of creature state.
// linear CKA between two state series sampled at the same ticks; control: CKA after time-shuffling one series.
import type { CreatureLab, Factory } from "../interface";
import { mulberry } from "../rng";
function center(X: number[][]) { const n = X.length, d = X[0].length, m = new Array(d).fill(0); for (const x of X) for (let i = 0; i < d; i++) m[i] += x[i] / n; return X.map((x) => x.map((v, i) => v - m[i])); }
function gram(X: number[][]) { const n = X.length, K = Array.from({ length: n }, () => new Float64Array(n)); for (let a = 0; a < n; a++) for (let b = a; b < n; b++) { let s = 0; for (let i = 0; i < X[a].length; i++) s += X[a][i] * X[b][i]; K[a][b] = K[b][a] = s; } return K; }
export function cka(X: number[][], Y: number[][]) { const K = gram(center(X)), L = gram(center(Y)); let kl = 0, kk = 0, ll = 0; for (let a = 0; a < K.length; a++) for (let b = 0; b < K.length; b++) { kl += K[a][b] * L[a][b]; kk += K[a][b] ** 2; ll += L[a][b] ** 2; } return kk && ll ? kl / Math.sqrt(kk * ll) : 0; }
export function participationRatio(X: number[][]) { const Z = center(X), d = Z[0].length, C = Array.from({ length: d }, () => new Float64Array(d)); for (const z of Z) for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) C[i][j] += z[i] * z[j]; let tr = 0, tr2 = 0; for (let i = 0; i < d; i++) { tr += C[i][i]; for (let j = 0; j < d; j++) tr2 += C[i][j] ** 2; } return tr2 ? tr * tr / tr2 : 0; }
const series = (c: CreatureLab, parts: string[], ticks: number, every: number) => { const S: Record<string, number[][]> = {}; for (const p of parts) S[p] = []; for (let t = 0; t < ticks; t++) { c.step(every); for (const p of parts) S[p].push(Array.from(c.readState(p))); } return S; };
export function geometry(make: Factory, seedA: number, seedB: number, parts: string[], ticks = 240, every = 6, seed = 1) {
  const A = series(make(seedA), parts, ticks, every), B = series(make(seedB), parts, ticks, every), r = mulberry(seed);
  const shuf = (X: number[][]) => { const Y = X.slice(); for (let i = Y.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [Y[i], Y[j]] = [Y[j], Y[i]]; } return Y; };
  return { ticks, every, rows: parts.map((p) => ({ part: p, ckaAcrossSeeds: cka(A[p], B[p]), ckaShuffledControl: cka(A[p], shuf(B[p])), participationRatio: participationRatio(A[p]) })),
    withinCreature: parts.length > 1 ? { pair: `${parts[0]}~${parts[1]}`, cka: cka(A[parts[0]], A[parts[1]]), control: cka(A[parts[0]], shuf(A[parts[1]])) } : null };
}
