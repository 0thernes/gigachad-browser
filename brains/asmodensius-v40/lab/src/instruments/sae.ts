// Neuralese sae.js -> sparse autoencoder on population activity (rates of a part over time). ReLU encoder, linear decoder, L1 on codes.
// Control: the same SAE trained on a neuron-wise time-shuffled copy (keeps each neuron's marginal, destroys co-activation).
import type { CreatureLab } from "../interface";
import { mulberry } from "../rng";
export function fitSAE(X: number[][], k: number, { epochs = 60, lr = 0.02, l1 = 1e-3, seed = 1 } = {}) {
  const n = X.length, d = X[0].length, r = mulberry(seed), g = () => (r() - 0.5) * 0.2;
  const mu = new Array(d).fill(0); for (const x of X) for (let i = 0; i < d; i++) mu[i] += x[i] / n; const Z = X.map((x) => x.map((v, i) => v - mu[i]));
  const We = Array.from({ length: k }, () => Array.from({ length: d }, g)), be = new Array(k).fill(0), Wd = Array.from({ length: d }, () => Array.from({ length: k }, g));
  const enc = (x: number[]) => We.map((w, j) => Math.max(0, w.reduce((s, wi, i) => s + wi * x[i], be[j])));
  for (let e = 0; e < epochs; e++) for (const x of Z) { const h = enc(x); const xh = Wd.map((w) => w.reduce((s, wi, j) => s + wi * h[j], 0)); const err = xh.map((v, i) => v - x[i]);
    const gh = h.map((hj, j) => (hj > 0 ? err.reduce((s, ei, i) => s + ei * Wd[i][j], 0) + l1 : 0));
    for (let i = 0; i < d; i++) for (let j = 0; j < k; j++) Wd[i][j] -= lr * err[i] * h[j];
    for (let j = 0; j < k; j++) { if (!gh[j]) continue; for (let i = 0; i < d; i++) We[j][i] -= lr * gh[j] * x[i]; be[j] -= lr * gh[j]; } }
  let se = 0, st = 0, act = 0; for (const x of Z) { const h = enc(x); act += h.filter((v) => v > 0).length / k; const xh = Wd.map((w) => w.reduce((s, wi, j) => s + wi * h[j], 0)); for (let i = 0; i < d; i++) { se += (xh[i] - x[i]) ** 2; st += x[i] ** 2; } }
  return { explainedVar: st ? 1 - se / st : 0, meanActiveFrac: act / n, We };
}
export function saeOnPart(c: CreatureLab, part: string, ticks = 600, k = 16, seed = 1) {
  const X: number[][] = []; for (let t = 0; t < ticks; t++) { c.step(1); const s = c.readState(part); X.push(Array.from(s.subarray(0, s.length / 2))); }
  const r = mulberry(seed + 9), d = X[0].length, Xs = X.map((x) => x.slice()); for (let i = 0; i < d; i++) for (let t = ticks - 1; t > 0; t--) { const j = Math.floor(r() * (t + 1)); [Xs[t][i], Xs[j][i]] = [Xs[j][i], Xs[t][i]]; }
  const real = fitSAE(X, k, { seed }), ctrl = fitSAE(Xs, k, { seed });
  return { part, ticks, k, dims: d, real: { explainedVar: real.explainedVar, activeFrac: real.meanActiveFrac }, shuffledControl: { explainedVar: ctrl.explainedVar, activeFrac: ctrl.meanActiveFrac } };
}
