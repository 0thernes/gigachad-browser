// v3.3 tests (preregistrations/v3.3.md): spiking LTC neurons (ltc: true) vs fixed-tau LIF, same organism otherwise.
import { Organism, Opts } from "./organism";

const D = 1440; const at = (g: Organism, t: number): void => { while (g.t < t) g.step(); };
const ev = (s: number, o: Partial<Opts>): number => { const g = new Organism({ seed: s, ...o }); at(g, 3 * D + 8 * 60); return g.probe(80).ev; };
const lv = (s: number, o: Partial<Opts>): number => { const one = (l: number): number => { const g = new Organism({ seed: s, ...o }); at(g, 3 * D + 8 * 60); g.o.level = l; g.step(); return g.probe(80).ev; }; return one(4) - one(1); };
type M = Record<string, number[]>;
const arms = (f: (s: number, o: Partial<Opts>) => number) => (S: number[]): M => ({ ltc: S.map((s) => f(s, { ltc: true })), fixed: S.map((s) => f(s, {})) });
export const TESTS33: Record<string, (S: number[]) => M> = {
  L1: arms(ev),
  L2: arms((s, o) => ev(s, o) - ev(s, { ...o, forceWake: true })),
  L3: arms(lv),
  L5: arms((s, o) => { const b = ev(s, o); return (ev(s, { ...o, tauScale: 0.5 }) - b + ev(s, { ...o, tauScale: 2 }) - b) / 2; }),
  L4: (S) => { return { ltc: rpt(S, { ltc: true }), fixed: rpt(S, {}) }; },
};
import { rpt1 as rpt } from "./tests_v31";
