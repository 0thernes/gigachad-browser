// Neuralese attention heads / head scores -> global-workspace routing: winner occupancy, ignition rate, and pairwise
// phase-locking value (PLV) between cortical modules. Control: PLV after circularly shifting one module's phase series
// by a random lag (destroys the time alignment, keeps each series' own statistics).
import type { CreatureLab } from "../interface";
import { mulberry } from "../rng";
const plv = (a: number[], b: number[]) => { let c = 0, s = 0; for (let i = 0; i < a.length; i++) { c += Math.cos(a[i] - b[i]); s += Math.sin(a[i] - b[i]); } return Math.hypot(c, s) / a.length; };
export function workspaceRouting(c: CreatureLab, ticks = 1500, seed = 1) {
  if (!c.routing) throw new Error("creature has no routing() hook");
  const ph: number[][] = [], win: number[] = []; const ig0 = c.routing().ignitions;
  for (let t = 0; t < ticks; t++) { c.step(1); const r = c.routing(); ph.push(r.phases); win.push(r.winner); }
  const M = ph[0].length, rnd = mulberry(seed), occ = new Array(M + 1).fill(0); for (const w of win) occ[w < 0 ? M : w]++;
  const pairs: { m: number; n: number; plv: number; nullPlv: number }[] = [];
  for (let m = 0; m < M; m++) for (let n = m + 1; n < M; n++) { const a = ph.map((p) => p[m]), b = ph.map((p) => p[n]); let nul = 0; for (let k = 0; k < 20; k++) { const lag = 50 + Math.floor(rnd() * (ticks - 100)); nul += plv(a, b.map((_, i) => b[(i + lag) % ticks])) / 20; } pairs.push({ m, n, plv: plv(a, b), nullPlv: nul }); }
  return { ticks, ignitionsPerHour: ((c.routing().ignitions - ig0) / ticks) * 60, occupancy: occ.map((x) => x / ticks), occupancyLabels: [...Array.from({ length: M }, (_, i) => `module${i}`), "none"], pairs };
}
