// CQM10 diagnostic (dev seeds only): why full is less viable than fixed foraging drive. usage: node diag.js <seedbase> <n>
import { Organism } from "../../organism/organism";
const sb = +(process.argv[2] ?? 500), n = +(process.argv[3] ?? 8); const D = 1440;
const run = (o: any) => { const r = { fat: 0, ok: 0, lo: 0, hi: 0, atp: 0, S: 0, eat: 0, glc: 0, n: 0 }; for (let s = sb; s < sb + n; s++) { const g: any = new Organism({ seed: s, ...o }); while (g.t < D) g.step(); const f0 = g.foraged; while (g.t < 4 * D) { g.step(); r.n++; const G = g.blood.glc; r.glc += G; const ok = G > 2 && G < 4.5 && g.atp > 1.5 && g.S < 0.9; r.ok += +ok; r.lo += +(G <= 2); r.hi += +(G >= 4.5); r.atp += +(g.atp <= 1.5); r.S += +(g.S >= 0.9); } r.eat += g.foraged - f0; r.fat += g.fat; }
  const N = r.n; return { ok: r.ok / N, glcLo: r.lo / N, glcHi: r.hi / N, atpLo: r.atp / N, Shi: r.S / N, glc: r.glc / N, foragesPerDay: r.eat / n / 3, fatEnd: r.fat / n }; };
console.log(JSON.stringify({ full: run({}), fixed: run({ fixedDrive: true }) }));
