// Neuralese logit lens / tuned lens -> motor-output lens: from each part's state at tick t, decode whether the creature
// forages within the next `lead` ticks. Control: the same decoder on time-shuffled labels.
import type { CreatureLab } from "../interface";
import { train } from "./decoder";
import { mulberry } from "../rng";
export function motorLens(c: CreatureLab, parts: string[], samples = 900, lead = 5, seed = 1) {
  const S: Record<string, number[][]> = {}; for (const p of parts) S[p] = []; const fr: number[] = [];
  for (let i = 0; i < samples + lead; i++) { c.step(1); for (const p of parts) S[p].push(Array.from(c.readState(p))); fr.push(c.metrics().forageNow); }
  const y = Array.from({ length: samples }, (_, t) => (fr.slice(t + 1, t + 1 + lead).some((x) => x > 0) ? 1 : 0));
  const r = mulberry(seed), idx = y.map((_, i) => i), cut = Math.floor(0.7 * samples); idx.sort(() => r() - 0.5); const tr = idx.slice(0, cut), te = idx.slice(cut);
  const ys = y.slice(); for (let i = ys.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ys[i], ys[j]] = [ys[j], ys[i]]; }
  const bal = (f: (x: number[]) => number, X: number[][], lab: number[]) => { let tp = 0, p = 0, tn = 0, n = 0; for (const i of te) { const h = f(X[i]); if (lab[i]) { p++; tp += h; } else { n++; tn += 1 - h; } } return 0.5 * (p ? tp / p : 0) + 0.5 * (n ? tn / n : 0); };
  const rows = parts.map((p) => { const X = S[p]; const f = train(tr.map((i) => X[i]), tr.map((i) => y[i]), 2); const g = train(tr.map((i) => X[i]), tr.map((i) => ys[i]), 2); return { part: p, balancedAcc: bal(f, X, y), controlShuffled: bal(g, X, ys) }; });
  return { lead, samples, baseRate: y.reduce((a, b) => a + b, 0) / samples, rows };
}
