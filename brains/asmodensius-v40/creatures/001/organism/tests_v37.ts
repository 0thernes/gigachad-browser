// v3.7 tests (preregistrations/v3.7.md §C). R-variants for items that fail only through the v3.1 non-ceiling rule; the originals stay on record unchanged.
import { Organism, Opts } from "./organism";
type M = Record<string, number[]>;
const mean = (a: number[]): number => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
const corr = (a: number[], b: number[]): number => { const ma = mean(a), mb = mean(b); let s = 0, sa = 0, sb = 0; for (let k = 0; k < a.length; k++) { s += (a[k] - ma) * (b[k] - mb); sa += (a[k] - ma) ** 2; sb += (b[k] - mb) ** 2; } return sa > 0 && sb > 0 ? s / Math.sqrt(sa * sb) : 0; };
const am = (a: ArrayLike<number>): number => { let b = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[b]) b = i; return b; };
const warm = (s: number, o: Partial<Opts>): Organism => { const g = new Organism({ seed: s, ...o }); while (g.t < 480) g.step(); return g; };
// K1R: the K1 protocol with the HOT-2 degraded stimulus (amplitude 0.5+0.7u on the line, plus 0.3|gauss| on all 4 lines of module 0), same arms as K1.
const k1r = (S: number[], o: Partial<Opts>): number[] => S.map((s) => { const g = warm(s, o); let ok = 0; for (let t = 0; t < 160; t++) { const c = Math.floor(g.r() * 4); g.sens.fill(0); g.sens[c] = 0.5 + 0.7 * g.r(); for (let j = 0; j < 4; j++) g.sens[j] += 0.3 * Math.abs(g.gauss()); g.step(); if (t >= 100) ok += +(am(g.mind.post[0]) === c); g.mind.teach(0, c); g.sens.fill(0); g.step(); } return ok / 60; });
// CQM03R: the EVO population model, but the coupling metric is |corr(food pool at generation g, population at g+1)| at ONE preregistered lag (no max over 4 lags, which inflates |r| on 8 points),
// and the control draws a random number of births (2..8) per generation instead of a constant 6 (whose correlation is 0 by construction).
function evoR(S: number[]): M { const out: M = { full: [], "births random in number": [] }; const LIFE = 720, GEN = 8, CAP = 8, REGEN = 160; type Ind = { gn: number[] };
  const run = (seed: number, mode: "full" | "randomBirths"): number => { const r = (() => { let a = seed * 9973 + 7; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
    const rg = (): number[] => [0, 1, 2, 3].map(() => Math.exp(0.3 * (r() + r() + r() - 1.5) * 2)); let pop: Ind[] = Array.from({ length: 6 }, () => ({ gn: rg() })); const pool = { food: 300 }; const N: number[] = [], F: number[] = [];
    for (let gen = 0; gen < GEN; gen++) { pool.food += REGEN; const G = pop.map((ind, i) => new Organism({ seed: seed * 100 + gen * 10 + i, genes: ind.gn, pool, fat0: 60 } as Opts)); for (let t = 0; t < LIFE; t++) for (const g of G) g.step();
      const bal = G.map((g) => { const b = g.energy() - g.E0; return Number.isFinite(b) ? b : -1e3; }); N.push(pop.length); F.push(pool.food); const order = pop.map((_, i) => i).sort((a, b) => bal[b] - bal[a]);
      const nb = mode === "randomBirths" ? 2 + Math.floor(r() * 7) : Math.max(2, Math.min(CAP, Math.round(pop.length * (1 + Math.tanh(mean(bal) / 50))))); const kids: Ind[] = [];
      for (let k = 0; k < nb; k++) { const pi = order[k % Math.max(1, Math.ceil(order.length / 2))] ?? 0; kids.push({ gn: pop[pi].gn.map((x) => x * Math.exp(0.15 * (r() + r() + r() - 1.5) * 2)) }); } pop = kids; }
    return Math.abs(corr(F.slice(0, GEN - 1), N.slice(1))); };
  for (const s of S) { out.full.push(run(s, "full")); out["births random in number"].push(run(s, "randomBirths")); } return out; }
export const TESTS37: Record<string, (S: number[]) => M> = {
  K1R: (S) => ({ full: k1r(S, {}), "v3.1 cortex": k1r(S, { cortex: "v31" }), "no developmental waves": k1r(S, { devLesion: true }), "no STDP": k1r(S, { stdpLesion: true }), "no homeostasis (intrinsic + inhibitory)": k1r(S, { homeoLesion: true }), "E/I loops lesioned": k1r(S, { eiLesion: true }) }),
  C03R: evoR,
};
