// B25 diagnostic: fraction of m0+m1 cortical rates at 0 or 1 (saturated/silent) during RPT2R cues; dev seeds only.
import { warm, show, ctx } from "../tests_v31";
let n = 0, hi = 0, lo = 0, lv = new Set<number>(); const SB = Number(process.env.SB ?? 3721);
for (let s = SB; s < SB + 4; s++) { const g: any = warm(s); for (let t = 0; t < 60; t++) { const a = g.r() < 0.5 ? 1 : 0, b = g.r() < 0.5 ? 1 : 0; const x = new Array(16).fill(0); x[a] = 1; x[4 + b] = 1; for (let k = 0; k < 3; k++) { show(g, x); g.step(); } for (const v of ctx(g, [0, 1]).slice(0, 26)) { n++; if (v >= 0.999) hi++; if (v <= 0.001) lo++; lv.add(Math.round(v * 1000)); } show(g, new Array(16).fill(0)); g.step(); } }
console.log(JSON.stringify({ sat: (hi / n).toFixed(3), silent: (lo / n).toFixed(3), levels: lv.size }));
