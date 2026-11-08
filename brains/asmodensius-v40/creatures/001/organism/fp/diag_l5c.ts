import { warm, show } from "../tests_v31";
const cor = (x: number[], y: number[]) => { const n = x.length, mx = x.reduce((p, q) => p + q) / n, my = y.reduce((p, q) => p + q) / n; let a = 0, b = 0, c = 0; for (let i = 0; i < n; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; } return a / Math.sqrt(b * c + 1e-12); };
for (const s of [3445, 3446, 3447]) { const g: any = warm(s); const A: number[] = [], B: number[] = [], bas: number[][] = [], api: number[][] = []; let nl = 0;
  for (let t = 0; t < 220; t++) { const a = g.r() < 0.5 ? 1 : 0, b = g.r() < 0.5 ? 1 : 0; const x = new Array(16).fill(0); x[a] = 1; x[4 + b] = 1; for (let k = 0; k < 3; k++) { show(g, x); g.step(); }
    const P = g.l5P[0], tr = g.l5Tr; const own = Array.from(tr.slice(0, 13)), oth = Array.from(tr.slice(13, 26)); const bs: number[] = [], ap: number[] = [];
    for (let u = 0; u < 8; u++) { let p = 0, q = 0; for (let k = 0; k < 13; k++) { p += P.Wb[u * 13 + k] * own[k]; q += P.Wa[u * 13 + k] * oth[k]; } bs.push(p); ap.push(q); } bas.push(bs); api.push(ap); A.push(a); B.push(b); show(g, new Array(16).fill(0)); g.step(); }
  const late = (arr: number[][], y: number[], u: number) => cor(arr.slice(160).map((v) => v[u]), y.slice(160)).toFixed(2);
  console.log(s, "basal~a", [0, 1, 2, 3].map((u) => late(bas, A, u)).join(","), "apical~b", [0, 1, 2, 3].map((u) => late(api, B, u)).join(","), "|Wb0|", Math.hypot(...Array.from(g.l5P[0].Wb.slice(0, 13) as Float64Array)).toFixed(2)); }
