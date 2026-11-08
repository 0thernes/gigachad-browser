// v3.9 tests (preregistrations/v3.9.md). R-variants; the originals stay on record unchanged.
import { Organism, Opts, M38 } from "./organism";
type M = Record<string, number[]>;
const mean = (a: number[]): number => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
const corr = (a: number[], b: number[]): number => { const ma = mean(a), mb = mean(b); let s = 0, sa = 0, sb = 0; for (let k = 0; k < a.length; k++) { s += (a[k] - ma) * (b[k] - mb); sa += (a[k] - ma) ** 2; sb += (b[k] - mb) ** 2; } return sa > 0 && sb > 0 ? s / Math.sqrt(sa * sb) : 0; };
// C01R: CQM01 heredity, same generational design as v3.1 evo() (8 generations x 720 ticks, offspring genomes from the best-balanced half; births do not depend on deaths),
// except founders/offspring start at 0.9 x the v3.8 fat set point instead of fat0=60. Reason: under the v3.8 leptin-like drive, fat0=60 (85% below set point) saturates the
// forage probability at 1 for every genome, so the heritable trait (forage rate) has no variance and corr() is degenerate (control 1.0 = constant-vector artefact).
// Zero-variance guard: corr returns 0 when either vector is constant (v3.1 corr returned NaN->treated inconsistently).
function c01r(S: number[]): M { const out: M = { full: [], "offspring genomes random": [] }; const LIFE = 720, GEN = 8, CAP = 8, REGEN = 160;
  type Ind = { gn: number[]; parent: number };
  const run = (seed: number, randomOff: boolean): number => { const r = (() => { let a = seed * 9973 + 7; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
    const rg = (): number[] => [0, 1, 2, 3].map(() => Math.exp(0.3 * (r() + r() + r() - 1.5) * 2)); let pop: Ind[] = Array.from({ length: 6 }, () => ({ gn: rg(), parent: NaN })); const pool = { food: 300 }; const pairs: [number, number][] = [];
    for (let gen = 0; gen < GEN; gen++) { pool.food += REGEN; const G = pop.map((ind, i) => new Organism({ seed: seed * 100 + gen * 10 + i, genes: ind.gn, pool, fat0: 0.9 * M38.fSet } as Opts));
      for (let t = 0; t < LIFE; t++) for (const g of G) g.step(); const rate = G.map((g) => g.foraged / LIFE); const bal = G.map((g) => { const b = g.energy() - g.E0; return Number.isFinite(b) ? b : -1e3; });
      pop.forEach((ind, i) => { if (!Number.isNaN(ind.parent)) pairs.push([ind.parent, rate[i]]); });
      const order = pop.map((_, i) => i).sort((a, b) => bal[b] - bal[a]); const nb = Math.max(2, Math.min(CAP, Math.round(pop.length * (1 + Math.tanh(mean(bal) / 50))))); const kids: Ind[] = [];
      for (let k = 0; k < nb; k++) { const pi = order[k % Math.max(1, Math.ceil(order.length / 2))] ?? 0; kids.push({ gn: randomOff ? rg() : pop[pi].gn.map((x) => x * Math.exp(0.15 * (r() + r() + r() - 1.5) * 2)), parent: rate[pi] }); } pop = kids; }
    return pairs.length > 3 ? corr(pairs.map((p) => p[0]), pairs.map((p) => p[1])) : 0; };
  for (const s of S) { out.full.push(run(s, false)); out["offspring genomes random"].push(run(s, true)); } return out; }
export const TESTS39: Record<string, (S: number[]) => M> = { C01R: c01r };
