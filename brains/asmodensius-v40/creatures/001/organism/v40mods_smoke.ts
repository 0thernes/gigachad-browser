// smoke (dev seed 2007, 1 day per arm): no NaN, each v4.0 module changes behaviour when lesioned, pruned synapses survive a lesion toggle. Not a test.
import { Organism } from "./organism";
const run = (extra: any, days = 1) => { const g: any = new Organism({ seed: 2007, mind: "v40", ...extra }); for (let t = 0; t < 1440 * days && !g.dead; t++) g.step(); const v = g.v40State(); return { foraged: g.foraged, dead: g.dead, sim: v ? +v.self.sim.toFixed(3) : null, kappa: v ? +v.curv.kappa.toFixed(3) : null, surprise: v ? +v.bus.surprise.toFixed(4) : null, neo: v?.neo, gain: v?.bus.gain.map((x: number) => +x.toFixed(2)), nan: !Number.isFinite(g.fat) }; };
const out: any = { full: run({}) }; for (const l of ["bus", "alien", "substrate", "self", "sim", "curv", "neo", "v40all"]) out[l] = run({ v40Lesion: l });
// lesion-toggle bug: grow, force pruning, toggle a lesion, check pruned slots stay masked
const g: any = new Organism({ seed: 2007, mind: "v40", develop: true }); for (let i = 0; i < 40; i++) (g as any).devRefine(); const pr = g.devPruned ? Array.from(g.devPruned as Uint8Array).map((v, k) => (v ? k : -1)).filter((k) => k >= 0) : []; g.lesion("recLesion", true); g.lesion("recLesion", false);
out.toggleBug = { pruned: pr.length, revived: pr.filter((k: number) => g.mask[k] !== 0).length };
console.log(JSON.stringify(out));
