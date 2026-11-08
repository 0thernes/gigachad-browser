// v3.8 viability tests (prereg v3.8a §E, replaces the arbitrary "median lifespan >= 30 d" criterion).
// usage: node viability_v38.js steady <seed> [days=12]   -> lab dome, ample food, 5 creatures: daily fat/glycogen, intake, expenditure
//        node viability_v38.js starve <seed> [maxDays=20] -> standalone organism, 1 fed day then no food: stage times + death
//        node viability_v38.js refeed <seed> [refeedDay=3] [days=8] -> as starve, food restored at refeedDay (after ketosis, before death)
// Lab dome imported read-only.
import { make001, Dome } from "../../../lab/src/index";
import { Organism } from "./organism";
const mode = process.argv[2] ?? "steady", seed = +(process.argv[3] ?? 2000);
const out = (o: unknown): void => console.log(JSON.stringify(o));
const spent = (g: any): number => g.heat + g.excreted; // kJ dissipated or excreted (the ledger closes, ledger error printed)
if (mode === "steady") {
  const days = +(process.argv[4] ?? 12); const d: any = new Dome({ seed }, { foodCapScale: 2, growthScale: 3, respawnAfter: 0 }); for (let k = 0; k < 5; k++) d.add("c" + k, make001(seed + k));
  const C = d.pop.map(() => ({ fat: [] as number[], gly: [] as number[], eat: [] as number[], exp: [] as number[] })); const last = d.pop.map((h: any) => ({ e: h.c.o.eaten, x: spent(h.c.o) }));
  for (let t = 1; t <= 1440 * days; t++) { d.step(); if (t % 1440 === 0) d.pop.forEach((h: any, i: number) => { const g = h.c.o; if (h.deathT !== undefined) return; C[i].fat.push(+g.fat.toFixed(2)); C[i].gly.push(+g.liverGly.toFixed(2)); C[i].eat.push(+(g.eaten - last[i].e).toFixed(2)); C[i].exp.push(+(spent(g) - last[i].x).toFixed(2)); last[i] = { e: g.eaten, x: spent(g) }; }); }
  out({ mode, seed, days, deaths: d.deaths, alive: d.pop.map((h: any) => h.deathT === undefined), creatures: C, ledger: d.ledger().worldLedgerError });
} else {
  const refeed = mode === "refeed" ? +(process.argv[4] ?? 3) : -1, days = +(process.argv[mode === "refeed" ? 5 : 4] ?? (mode === "refeed" ? 8 : 20));
  const g: any = new Organism({ seed } as any); let f0 = g.foraged, x0 = spent(g); for (let t = 0; t < 1440; t++) g.step();
  const fedForays = g.foraged - f0, fedExp = spent(g) - x0, fat0 = g.fat, gly0 = g.liverGly, mus0 = g.muscle;
  g.o.starve = true; const S: Record<string, number | null> = { forage: null, glycogen: null, ketosis: null, torpor: null, death: null }; const tr: number[][] = [];
  let fo = g.foraged, x = spent(g), xd = spent(g);
  for (let t = 1; t <= 1440 * days && !g.dead; t++) { if (t === Math.round(1440 * refeed)) g.o.starve = false; g.step(); const day = t / 1440;
    if (g.o.starve) { if (S.glycogen === null && g.liverGly < 0.2 * gly0) S.glycogen = day; if (S.ketosis === null && g.blood.ket > 1) S.ketosis = day; }
    if (t % 360 === 0) { const rate = (spent(g) - x) * 4, fr = (g.foraged - fo) * 4; if (g.o.starve) { if (S.forage === null && fr > 1.5 * fedForays) S.forage = day; }
      if (t % 1440 === 0) { if (g.o.starve && S.torpor === null && spent(g) - xd < 0.85 * fedExp) S.torpor = day; xd = spent(g); }
      tr.push([+day.toFixed(2), +g.fat.toFixed(1), +g.liverGly.toFixed(2), +g.blood.ket.toFixed(2), +g.blood.glc.toFixed(2), +g.muscle.toFixed(1), +rate.toFixed(1), fr]); fo = g.foraged; x = spent(g); } }
  if (g.dead) S.death = +(g.t / 1440 - 1).toFixed(3);
  out({ mode, seed, refeed, fedExp: +fedExp.toFixed(1), fedForays, fat0: +fat0.toFixed(1), gly0: +gly0.toFixed(1), mus0: +mus0.toFixed(1), stages: S, alive: !g.dead, end: { fat: +g.fat.toFixed(1), gly: +g.liverGly.toFixed(2), ket: +g.blood.ket.toFixed(2), mus: +g.muscle.toFixed(1) }, trace: tr });
}
