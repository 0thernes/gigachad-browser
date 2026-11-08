// v3.0 coupling tests (preregistrations/v3.0.md). Seeds passed in: tuning 2000..2015, test 1000..1015 (harness SEEDS).
import { Organism, Opts, SITES } from "./organism";
import { compare, item, Item, Cmp } from "../harness/harness";
const D = 1440; const mean = (a: number[]): number => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
const mk = (seed: number, o: Partial<Opts> = {}): Organism => new Organism({ seed, ...o });
export const LEDGER: { id: string; seed: number; err: number }[] = [];
const led = (id: string, o: Organism): Organism => { LEDGER.push({ id, seed: o.o.seed, err: o.ledgerError() }); return o; };
// standardised value pattern so exploration is measured on identical values in every condition
const standard = (o: Organism): void => { for (let k = 0; k < SITES; k++) o.wSite[k] = 0.1 + 0.6 * o.pTrue[k]; };
const at = (o: Organism, tick: number): void => { while (o.t < tick) o.step(); };
export function v30(seeds: number[], only?: string): Item[] { const P = "Prereg v3.0 (organism)"; const out: Item[] = []; const want = (id: string): boolean => !only || only === id;
  const M = (f: (s: number) => number): number[] => seeds.map(f);
  // C1 starvation -> DA -> exploration
  if (want("C1")) { const dayDA = (o: Organism): number => { const v: number[] = []; while (o.t < 3 * D) { o.step(); if (o.t >= 2 * D && o.stage === 0) v.push(o.nm.DA.E); } return mean(v); };
    const runE = (o: Partial<Opts>) => M((s) => { const g = led("C1", mk(s, o)); at(g, 3 * D + 8 * 60); standard(g); return g.probe(80).entropy; });
    out.push(item("V3-C1a", P, "Starvation lowers tonic dopamine", "mean extracellular DA, awake ticks of day 3", "blood amino acids (tyrosine) x brain fuel (K-ATP) gate VTA firing and DA synthesis", [compare("starved 3 days", M((s) => dayDA(led("C1", mk(s)))), M((s) => dayDA(led("C1", mk(s, { starve: true })))))]));
    const fed = runE({}), st = runE({ starve: true }), cl = runE({ starve: true, daClamp: 0.25 });
    out.push(item("V3-C1b", P, "Starvation lowers exploration", "choice entropy (bits), 80 probe choices on a standardised value map", "DA sets striatal noise amplitude in the spiking race", [compare("starved 3 days", fed, st)]));
    out.push(item("V3-C1c", P, "DA mediates the starvation effect (clamp rescues exploration)", "choice entropy (bits)", "starved + DA clamped at 0.25 vs starved", [compare("starved, DA free", cl, st)])); }
  // C2 sleep -> memory
  if (want("C2")) { const ev = (o: Partial<Opts>) => M((s) => { const g = led("C2", mk(s, o)); at(g, 3 * D + 8 * 60); return g.probe(80).ev; });
    out.push(item("V3-C2", P, "Sleep deprivation degrades memory-guided choice", "expected reward of 80 probe choices on trained sites (day 4, 08:00)", "NREM replay consolidates hippocampal episodes into site-value synapses; adenosine adds decision noise", [compare("sleep-deprived (forced wake)", ev({}), ev({ forceWake: true })), compare("sleep, replay disabled", ev({}), ev({ replay: "none" }))])); }
  // C3 dreams -> generalisation to never-visited sites
  if (want("C3")) { const ev = (o: Partial<Opts>) => M((s) => { const g = led("C3", mk(s, o)); at(g, 3 * D + 8 * 60); return g.probe(80, "novel").ev; }); const full = ev({});
    out.push(item("V3-C3", P, "REM recombination dreams improve later choice among novel sites", "expected reward of 80 probe choices restricted to the 8 never-visited sites", "REM pairs colour of one memory with shape of another and writes the cortical feature-model prediction into the novel site's value", [compare("no replay", full, ev({ replay: "none" })), compare("NREM replay only (no dreams)", full, ev({ replay: "nremOnly" })), compare("dreams with shuffled content", full, ev({ replay: "remShuffle" }))])); }
  // C4 gut-brain axis
  if (want("C4")) { const sup = (o: Partial<Opts>) => M((s) => { const g = led("C4", mk(s, o)); at(g, D + 9 * 60); g.o.starve = true; const f0 = g.foraged; at(g, D + 11 * 60); const pre = g.foraged - f0; g.feed(20); const f1 = g.foraged; at(g, D + 13 * 60); return pre - (g.foraged - f1); });
    out.push(item("V3-C4", P, "Vagotomy (gut-brain axis lesion) blunts post-meal satiety", "forage attempts 2 h before minus 2 h after a 20 kJ meal", "gut fill + ENS activity -> vagal afferent -> hypothalamic satiety neurons", [compare("subdiaphragmatic vagotomy", sup({}), sup({ vagotomy: true }))])); }
  // C5 autonomic/heart
  if (want("C5")) { const dhr = (o: Partial<Opts>, stim: boolean) => M((s) => { const g = led("C5", mk(s, o)); at(g, D + 13 * 60); const h0: number[] = []; while (g.t < D + 14 * 60) { g.step(); h0.push(g.hr); } const h1: number[] = []; while (g.t < D + 14 * 60 + 30) { if (stim) g.stimulate("LC", 0.5); g.step(); h1.push(g.hr); } return mean(h1) - mean(h0); });
    const full = dhr({}, true); out.push(item("V3-C5", P, "Locus coeruleus stimulation drives heart rate through the sympathetic chain", "HR change (bpm), 30 min stim vs preceding hour", "LC rate -> sympathetic tone -> HR -> brain perfusion", [compare("sham stimulation", full, dhr({}, false)), compare("sympathectomy", full, dhr({ sympathectomy: true }, true))])); }
  // C6 SCN
  if (want("C6")) { const rhythm = (o: Partial<Opts>) => M((s) => { const g = led("C6", mk(s, o)); at(g, D); let n = 0, nn = 0, dd = 0, dn = 0; while (g.t < 4 * D) { g.step(); const h = (g.t % D) / 60; if (h < 4 || h >= 22) { nn++; if (g.asleep) n++; } else if (h >= 10 && h < 18) { dn++; if (g.asleep) dd++; } } return n / nn - dd / dn; });
    out.push(item("V3-C6", P, "SCN lesion flattens the sleep-wake rhythm", "night sleep fraction minus day sleep fraction (days 2-4)", "SCN oscillator (light-entrained) supplies process C and melatonin", [compare("SCN lesion", rhythm({}), rhythm({ scnLesion: true }))])); }
  // C7 felt thought curvature
  if (want("C7")) { const felt = (o: Partial<Opts>) => M((s) => { const g = led("C7", mk(s, o)); at(g, D + 7 * 60); const k: number[] = [], ne: number[] = []; while (g.t < D + 21 * 60) { g.step(); const kp = g.kappa; g.step(); if (g.stage === 0) { k.push(kp); ne.push(g.regionRate.LC); } }
      const srt = k.slice().sort((a, b) => a - b), med = srt[srt.length >> 1]; return mean(ne.filter((_, i) => k[i] > med)) - mean(ne.filter((_, i) => k[i] <= med)); });
    const full = felt({}); out.push(item("V3-C7", P, "Thought curvature is felt: high-curvature moments raise LC (noradrenergic) firing", "LC rate at t+1 when kappa(t) above median minus below (awake, day 2)", "trajectory curvature of the latent neural state -> insula -> LC", [compare("insula lesion", full, felt({ insulaLesion: true })), compare("insula fed time-shuffled curvature", full, felt({ kappaShuffle: true }))])); }
  // C8 intelligence level drains energy and buys performance
  if (want("C8")) { const run = (lvl: number) => seeds.map((s) => { const g = led("C8", mk(s, { level: lvl })); at(g, D); const u: number[] = []; while (g.t < 2 * D) { g.step(); if (g.stage === 0) u.push(g.brainUse); } return { use: mean(u) }; });
    // performance: identical organism (same seed, auto level) up to day 4 08:00, then probed at level 4 vs level 1 (within-seed; deterministic twins)
    const perf = (lvl: number) => M((s) => { const g = led("C8", mk(s)); at(g, 3 * D + 8 * 60); g.o.level = lvl; g.step(); return g.probe(80).ev; });
    const hi = run(4), lo = run(1); out.push(item("V3-C8a", P, "Higher intelligence level costs more brain ATP", "brain ATP demand (kJ/min), awake, day 2", "level sets deliberation substeps and per-spike cost", [compare("level 1", hi.map((x) => x.use), lo.map((x) => x.use))]));
    out.push(item("V3-C8b", P, "Higher intelligence level improves choice", "probe expected reward (day 4 08:00, level switched just before the probe)", "more integration steps average out decision noise", [compare("level 1 (same organism state)", perf(4), perf(1))])); }
  // C9 quantum layer: equivalence (no functional advantage expected)
  if (want("C9")) { const ev = (n: "quantum" | "classical") => M((s) => { const g = led("C9", mk(s, { noise: n })); at(g, 3 * D + 8 * 60); return g.probe(80).ev; }); const c = compare("classical noise, same marginals", ev("quantum"), ev("classical"));
    const it = item("V3-C9", P, "Quantum noise source vs classical (equivalence, preregistered expectation |d|<0.5)", "probe expected reward", "Born-rule sampled 3-qubit state vs classical coin", [c]); it.pass = Math.abs(c.d) < 0.5; it.category = it.pass ? "Equivalence held" : "Equivalence violated"; it.note = "pass = |d|<0.5 (no quantum advantage claimed)"; out.push(it); }
  // C10 energy conservation + negative control
  if (want("C10")) { const leak = M((s) => { const g = mk(s, { leakyLedger: true }); at(g, D); return g.ledgerError(); }); const own = LEDGER.length ? LEDGER : M((s) => { const g = led("C10", mk(s)); at(g, 2 * D); return 0; }) && LEDGER;
    const mx = Math.max(...own.map((x) => x.err)); const cmp: Cmp = { control: "deliberately leaky ledger (must be detected > 1e-3)", full: mx, ctrl: Math.min(...leak), d: NaN, t: NaN, pass: mx < 1e-9 && Math.min(...leak) > 1e-3 };
    const it = item("V3-C10", P, "Energy conservation across every run of this suite", "max |E_now - E_0 - eaten| / (E_0 + eaten)", "explicit flux ledger: gut, blood, liver, fat, muscle, brain, ATP, heat, excreta", [cmp]); it.pass = cmp.pass; it.category = it.pass ? "Tolerance test" : "Tolerance violated"; it.note = `max error ${mx.toExponential(2)} over ${own.length} runs; leaky control min ${Math.min(...leak).toExponential(2)}`; out.push(it); }
  // C11 determinism
  if (want("C11")) { const same = seeds.every((s) => { const a = mk(s), b = mk(s); at(a, 600); at(b, 600); return a.hash() === b.hash(); }); const a = mk(seeds[0]), b = mk(seeds[1]); at(a, 600); at(b, 600);
    const it = item("V3-C11", P, "Seeded determinism", "state hash after 600 ticks", "pure seeded RNG; crypto entropy only when explicitly requested", []); it.pass = same && a.hash() !== b.hash(); it.category = it.pass ? "Tolerance test" : "Failed"; it.note = `same-seed identical: ${same}; different seeds differ: ${a.hash() !== b.hash()}`; out.push(it); }
  return out; }
