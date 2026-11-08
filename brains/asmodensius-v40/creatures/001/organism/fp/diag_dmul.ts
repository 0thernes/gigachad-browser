import { warm, show, ctx } from "../tests_v31"; import { M50 } from "../organism";
for (const K of [0, 0.5, 3]) { M50.dmulK = K; const g: any = warm(3285); const R: number[] = [], A: number[] = []; let inj = 0;
  for (let t = 0; t < 40; t++) { const a = t & 1, b = (t >> 1) & 1; const x = new Array(16).fill(0); x[a] = 1; x[4 + b] = 1; for (let k = 0; k < 3; k++) { show(g, x); g.step(); } const v = ctx(g, [0, 1]); R.push(v.reduce((p, q) => p + q, 0) / 26); A.push(Math.max(...v)); show(g, new Array(16).fill(0)); g.step(); }
  const e = new Float32Array(1000); g.dmulStep?.(e); for (let j = 0; j < 1000; j++) inj = Math.max(inj, Math.abs(e[j]));
  console.log("K", K, "mean rate", (R.reduce((p, q) => p + q) / R.length).toFixed(3), "max", Math.max(...A).toFixed(3), "max inj", inj.toFixed(3)); }
