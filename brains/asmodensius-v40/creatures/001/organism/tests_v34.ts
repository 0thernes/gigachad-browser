// v3.4 tests (preregistrations/v3.4.md §C): cortex items K1a..K1e, K2 persistence, and the v3.3 LTC suite re-run with learned / hand-set / fixed arms.
import { Organism, Opts, R0, MW } from "./organism";
import { rpt1 } from "./tests_v31";
type M = Record<string, number[]>;
const at = (g: Organism, t: number): void => { while (g.t < t) g.step(); };
const warm = (s: number, o: Partial<Opts>): Organism => { const g = new Organism({ seed: s, ...o }); at(g, 480); return g; };
const am = (a: ArrayLike<number>): number => { let b = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[b]) b = i; return b; };
const show = (g: Organism, m: number, c: number): void => { g.sens.fill(0); g.sens[m * 4 + c] = 1; };
const blank = (g: Organism, n = 1): void => { for (let k = 0; k < n; k++) { g.sens.fill(0); g.step(); } };
// K1: RPT-1 protocol at zero delay; metric = the Mind's own module-0 classifier accuracy on trials 100..159
export const k1 = (S: number[], o: Partial<Opts>): number[] => S.map((s) => { const g = warm(s, o); let ok = 0; for (let t = 0; t < 160; t++) { const c = Math.floor(g.r() * 4); show(g, 0, c); g.step(); if (t >= 100) ok += +(am(g.mind.post[0]) === c); g.mind.teach(0, c); blank(g); } return ok / 60; });
// K2: RPT-1 protocol (2 blank ticks); metric = nearest-centroid probe (test-owned) on module-0 rates, centroids from all earlier trials
export const k2 = (S: number[], o: Partial<Opts>): number[] => S.map((s) => { const g = warm(s, o); let ok = 0; const cen = [0, 1, 2, 3].map(() => new Array(MW).fill(0)), n = [0, 0, 0, 0];
  for (let t = 0; t < 160; t++) { const c = Math.floor(g.r() * 4); show(g, 0, c); g.step(); blank(g, 2); const v = Array.from(g.rate.slice(R0.CTX, R0.CTX + MW));
    if (t >= 100) { let b = 0, bd = Infinity; for (let k = 0; k < 4; k++) { const d = cen[k].reduce((a, x, j) => a + (x / Math.max(1, n[k]) - v[j]) ** 2, 0); if (d < bd) { bd = d; b = k; } } ok += +(b === c); }
    v.forEach((x, j) => (cen[c][j] += x)); n[c]++; g.mind.teach(0, c); blank(g); } return ok / 60; });
const D = 1440;
const ev = (s: number, o: Partial<Opts>): number => { const g = new Organism({ seed: s, ...o }); at(g, 3 * D + 8 * 60); return g.probe(80).ev; };
const lv = (s: number, o: Partial<Opts>): number => { const one = (l: number): number => { const g = new Organism({ seed: s, ...o }); at(g, 3 * D + 8 * 60); g.o.level = l; g.step(); return g.probe(80).ev; }; return one(4) - one(1); };
const arms3 = (f: (s: number, o: Partial<Opts>) => number) => (S: number[]): M => ({ learned: S.map((s) => f(s, { ltc: "learned" })), handset: S.map((s) => f(s, { ltc: true })), fixed: S.map((s) => f(s, {})) });
export const TESTS34: Record<string, (S: number[]) => M> = {
  K1: (S) => ({ full: k1(S, {}), "v3.1 cortex": k1(S, { cortex: "v31" }), "no developmental waves": k1(S, { devLesion: true }), "no STDP": k1(S, { stdpLesion: true }), "no homeostasis (intrinsic + inhibitory)": k1(S, { homeoLesion: true }), "E/I loops lesioned": k1(S, { eiLesion: true }) }),
  K2: (S) => ({ full: k2(S, {}), "NMDA-like current lesioned": k2(S, { nmdaLesion: true }) }),
  L1: arms3(ev),
  L2: arms3((s, o) => ev(s, o) - ev(s, { ...o, forceWake: true })),
  L3: arms3(lv),
  L4: (S) => ({ learned: rpt1(S, { ltc: "learned" }), handset: rpt1(S, { ltc: true }), fixed: rpt1(S, {}) }),
  L5: arms3((s, o) => { const b = ev(s, o); return (ev(s, { ...o, tauScale: 0.5 }) - b + ev(s, { ...o, tauScale: 2 }) - b) / 2; }),
};
