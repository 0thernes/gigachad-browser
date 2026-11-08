// dev viability probe (seeds 2000+ only; never test seeds). Condition via V40OPTS / V40TUNE / ORG_MIND env. Prints one JSON line.
import { Organism } from "./organism";
const N = +(process.env.NSEEDS ?? 16), B = +(process.env.SEEDBASE ?? 2000), D = +(process.env.DAYS ?? 3); if (B < 2000) throw new Error("dev seeds only");
const rows: any[] = []; for (let s = B; s < B + N; s++) { const g: any = new Organism({ seed: s, mind: (process.env.ORG_MIND as any) ?? "v40" }); let atp = 0, n = 0; for (let t = 0; t < 1440 * D && !g.dead; t++) { g.step(); if (t % 60 === 0) { atp += g.atp; n++; } }
  const v = g.v40State?.(), a = g.affectState?.(); rows.push({ s, foraged: g.foraged, dead: !!g.dead, t: g.t, atp: atp / n, sim: v?.self.sim, neo: v?.neo?.uses, gain: v?.bus.gain, mood: a?.mood?.val ?? a?.mood, sd: a?.sleepDebt }); }
const m = (k: string) => rows.reduce((s, r) => s + (+r[k] || 0), 0) / rows.length; const sd = (k: string) => { const mu = m(k); return Math.sqrt(rows.reduce((s, r) => s + ((+r[k] || 0) - mu) ** 2, 0) / (rows.length - 1)); };
console.log(JSON.stringify({ tag: process.env.TAG, foraged: m("foraged"), foragedSD: sd("foraged"), dead: rows.filter((r) => r.dead).length, atp: m("atp"), rows }));
