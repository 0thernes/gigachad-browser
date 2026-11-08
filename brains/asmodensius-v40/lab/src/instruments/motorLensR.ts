// motorLens R (v0.4): same decoder and shuffled control as motorLens, plus an ORACLE ceiling. Creature 001 starts a forage
// with probability h_t = clamp(3*hunger - 0.1) per awake tick (organism.ts line 379), a coin flip on r(). So even a perfect
// readout of h can only predict "forage within lead ticks" up to P = 1-(1-h)^lead. The oracle uses the true h_t (computed from
// the same HYP rate and vagal tone the organism uses) to bound what any state decoder could reach.
import type { CreatureLab } from "../interface";
import { train } from "./decoder";
import { mulberry } from "../rng";
const clamp = (x: number) => Math.max(0, Math.min(1, x));
export function motorLensR(c: CreatureLab, parts: string[], samples = 900, lead = 5, seed = 1) {
  const S: Record<string, number[][]> = {}; for (const p of parts) S[p] = []; const fr: number[] = [], hz: number[] = [];
  for (let i = 0; i < samples + lead; i++) { c.step(1); const m = c.metrics(); for (const p of parts) S[p].push(Array.from(c.readState(p))); fr.push(m.forageNow); hz.push(m.asleep ? 0 : clamp(3 * (m.hunger - 0.4 * m.vagal) - 0.1)); }
  const y = Array.from({ length: samples }, (_, t) => (fr.slice(t + 1, t + 1 + lead).some((x) => x > 0) ? 1 : 0));
  const r = mulberry(seed), idx = y.map((_, i) => i); idx.sort(() => r() - 0.5); const cut = Math.floor(0.7 * samples), tr = idx.slice(0, cut), te = idx.slice(cut);
  const ys = y.slice(); for (let i = ys.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ys[i], ys[j]] = [ys[j], ys[i]]; }
  const bal = (h: (i: number) => number, lab: number[]) => { let tp = 0, p = 0, tn = 0, n = 0; for (const i of te) { const g = h(i); if (lab[i]) { p++; tp += g; } else { n++; tn += 1 - g; } } return 0.5 * (p ? tp / p : 0) + 0.5 * (n ? tn / n : 0); };
  const rows = parts.map((p) => { const X = S[p]; const f = train(tr.map((i) => X[i]), tr.map((i) => y[i]), 2), g = train(tr.map((i) => X[i]), tr.map((i) => ys[i]), 2); return { part: p, balancedAcc: bal((i) => f(X[i]), y), controlShuffled: bal((i) => g(X[i]), ys) }; });
  // oracle: P(forage within lead | future hazards) thresholded at the training-set base rate
  const pr = y.map((_, t) => 1 - hz.slice(t + 1, t + 1 + lead).reduce((a, h) => a * (1 - h), 1)); const base = tr.reduce((a, i) => a + y[i], 0) / tr.length;
  const thr = [...tr.map((i) => pr[i])].sort((a, b) => a - b)[Math.floor((1 - base) * tr.length)] ?? 0.5;
  return { lead, samples, baseRate: y.reduce((a, b) => a + b, 0) / samples, oracleBalancedAcc: bal((i) => (pr[i] >= thr ? 1 : 0), y), rows };
}
