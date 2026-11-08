// v3.4 learned-gate LTC: e-prop training curriculum on TUNING seeds 2000..2015 only (prereg v3.4 §B).
// usage: node train_eprop.js [nSeeds=16] [epochs=3] [eta=0.02]  -> prints per-seed theta and the population mean to freeze into LTC_LEARNED
import { Organism, LTC_INIT as LTC_LEARNED, mulberry } from "./organism";
const nS = +(process.argv[2] || 16), EP = +(process.argv[3] || 3), eta = +(process.argv[4] || 0.02);
const fs = require("fs");
const show = (g: Organism, m: number, c: number): void => { g.sens.fill(0); g.sens[m * 4 + c] = 1; };
const thetas: number[][] = []; const log: Record<string, unknown>[] = [];
for (let k = 0; k < nS; k++) { const seed = 2000 + k; const g = new Organism({ seed, ltc: "learned", eprop: true }); const rr = mulberry(seed * 31 + 7); // curriculum RNG separate from the organism's
  const lr = (n: number): number => Math.floor(rr() * n);
  // patch the learning rate used by epropLearn through teach(): Organism.epropLearn default eta is overridden here
  const orig = g.epropLearn.bind(g); g.epropLearn = (m: number, l: number, x: number[]) => orig(m, l, x, eta);
  g.learn = true; while (g.t < 480) g.step(); const th0 = g.gate.slice(); const acc: number[] = [];
  for (let ep = 0; ep < EP; ep++) { let ok = 0, n = 0;
    for (let t = 0; t < 160; t++) { const m = lr(4), c = lr(4); show(g, m, c); g.step(); ok += +(g.mind.post[m].indexOf(Math.max(...g.mind.post[m])) === c); n++; g.mind.teach(m, c); g.sens.fill(0); g.step(); } // immediate
    for (let t = 0; t < 160; t++) { const m = lr(4), c = lr(4); show(g, m, c); g.step(); g.sens.fill(0); g.step(); ok += +(g.mind.post[m].indexOf(Math.max(...g.mind.post[m])) === c); n++; g.mind.teach(m, c); g.step(); } // delay 1
    acc.push(ok / n); }
  thetas.push(g.gate.slice()); log.push({ seed, theta0: th0, theta: g.gate.slice(), acc, steps: g.gHist.length });
  console.log(seed, "theta", g.gate.map((x) => x.toFixed(4)).join(" "), "tau0", Math.exp(g.gate[0]).toFixed(3), "acc/epoch", acc.map((x) => x.toFixed(2)).join(" ")); }
const mean = [0, 1, 2, 3].map((i) => thetas.reduce((a, t) => a + t[i], 0) / thetas.length); const sd = [0, 1, 2, 3].map((i) => Math.sqrt(thetas.reduce((a, t) => a + (t[i] - mean[i]) ** 2, 0) / thetas.length));
console.log("initial (hand-set equivalent)", LTC_LEARNED.map((x) => x.toFixed(4)).join(" ")); console.log("MEAN", mean.map((x) => x.toFixed(4)).join(" "), "SD", sd.map((x) => x.toFixed(4)).join(" "));
if (process.env.EPOUT) fs.writeFileSync(process.env.EPOUT, JSON.stringify({ nSeeds: nS, epochs: EP, eta, initial: LTC_LEARNED, mean, sd, seeds: log }, null, 1));
