// Neuralese ACDC (research.js acdc: greedily prune nodes whose removal changes the objective < tau) ->
// connectome circuit discovery over part->part couplings, by lesion. Objective = |metric(lesioned) - metric(intact)| averaged over seeds.
import type { Factory } from "../interface";
export function circuitDiscovery(make: Factory, seeds: number[], ticks: number, metric: string, tau: number, minSyn = 5) {
  const run = (cut: string[]) => seeds.map((s) => { const c = make(s); for (const k of cut) c.lesionCoupling(k, 0); c.step(ticks); return c.metrics()[metric]; }).reduce((a, b) => a + b, 0) / seeds.length;
  const all = make(seeds[0]).couplings().filter((c) => c.n >= minSyn).map((c) => c.id).sort();
  const full = run([]), cut: string[] = [], kept: { id: string; delta: number }[] = []; let cur = full;
  for (const id of all) { const v = run([...cut, id]); const d = Math.abs(v - cur); if (d < tau) { cut.push(id); cur = v; } else kept.push({ id, delta: v - cur }); }
  return { metric, tau, intact: full, circuitOnly: cur, faithfulness: full ? cur / full : 0, nCandidates: all.length, kept, pruned: cut };
}
