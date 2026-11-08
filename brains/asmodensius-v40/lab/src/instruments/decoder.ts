// Neuralese PROBES (linear probe + control task, research.js trainProbe) -> state decoder: decode a creature variable
// (e.g. sleep stage) from a part's state, with a shuffled-label control. Softmax regression, standardised inputs.
import type { CreatureLab } from "../interface";
import { mulberry } from "../rng";
export function train(X: number[][], y: number[], K: number, epochs = 150, lr = 0.5) { const n = X.length, d = X[0].length, mu = new Float64Array(d), sd = new Float64Array(d);
  for (const x of X) for (let i = 0; i < d; i++) mu[i] += x[i] / n; for (const x of X) for (let i = 0; i < d; i++) sd[i] += (x[i] - mu[i]) ** 2 / n; for (let i = 0; i < d; i++) sd[i] = Math.sqrt(sd[i]) || 1;
  const W = Array.from({ length: K }, () => new Float64Array(d + 1)); const z = (x: number[]) => x.map((v, i) => (v - mu[i]) / sd[i]);
  const P = (zz: number[]) => { const l = W.map((w) => { let a = w[d]; for (let i = 0; i < d; i++) a += w[i] * zz[i]; return a; }), m = Math.max(...l), e = l.map((v) => Math.exp(v - m)), S = e.reduce((a, b) => a + b, 0); return e.map((v) => v / S); };
  const Z = X.map(z); for (let ep = 0; ep < epochs; ep++) { const G = W.map(() => new Float64Array(d + 1)); for (let k = 0; k < n; k++) { const p = P(Z[k]); for (let c = 0; c < K; c++) { const g = p[c] - (y[k] === c ? 1 : 0); for (let i = 0; i < d; i++) G[c][i] += g * Z[k][i] / n; G[c][d] += g / n; } } for (let c = 0; c < K; c++) for (let i = 0; i <= d; i++) W[c][i] -= lr * (G[c][i] + 1e-3 * (i < d ? W[c][i] : 0)); }
  return (x: number[]) => { const p = P(z(x)); return p.indexOf(Math.max(...p)); }; }
export function stateDecoder(c: CreatureLab, part: string, label: () => number, K: number, samples = 600, every = 4, seed = 1) {
  const X: number[][] = [], y: number[] = []; for (let i = 0; i < samples; i++) { c.step(every); X.push(Array.from(c.readState(part))); y.push(label()); }
  const r = mulberry(seed), idx = X.map((_, i) => i).sort(() => r() - 0.5), cut = Math.floor(0.7 * samples), tr = idx.slice(0, cut), te = idx.slice(cut);
  const acc = (lab: number[]) => { const f = train(tr.map((i) => X[i]), tr.map((i) => lab[i]), K); return te.filter((i) => f(X[i]) === lab[i]).length / te.length; };
  const ys = y.slice(); for (let i = ys.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ys[i], ys[j]] = [ys[j], ys[i]]; }
  const counts = new Array(K).fill(0); te.forEach((i) => counts[y[i]]++);
  return { part, K, samples, accuracy: acc(y), controlShuffled: acc(ys), majority: Math.max(...counts) / te.length, selectivity: 0 };
}
