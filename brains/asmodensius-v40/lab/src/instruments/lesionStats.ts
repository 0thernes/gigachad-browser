// Neuralese STATS tab (per-head ablation significance) -> per-coupling lesion significance across seeds.
import type { Factory } from "../interface";
import { permPaired, cohenDPaired, holm, bh, bootCI } from "./stats";
export function lesionStats(make: Factory, seeds: number[], couplings: string[], ticks: number, metric: string) {
  const base = seeds.map((s) => { const c = make(s); c.step(ticks); return c.metrics()[metric]; });
  const rows = couplings.map((id) => { const v = seeds.map((s) => { const c = make(s); c.lesionCoupling(id, 0); c.step(ticks); return c.metrics()[metric]; });
    const t = permPaired(v, base, 2000, 7); return { coupling: id, meanLesioned: v.reduce((a, b) => a + b, 0) / v.length, diff: t.diff, p: t.p, dz: cohenDPaired(v, base), ci: bootCI(v.map((x, i) => x - base[i]), 1000, 3) }; });
  const ph = holm(rows.map((r) => r.p)), pb = bh(rows.map((r) => r.p));
  return { metric, ticks, baseline: base, rows: rows.map((r, i) => ({ ...r, pHolm: ph[i], pBH: pb[i] })) };
}
