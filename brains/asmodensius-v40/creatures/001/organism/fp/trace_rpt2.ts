// B23 diagnostic: where is a^b lost? RPT2R protocol (T=3), ridge decode 160/60 at each stage; dev seeds 3445-3460 only.
import { warm, show, ctx } from "../tests_v31"; import { R0, RN, MW } from "../organism";
const ridge = (X: number[][], y: number[], lam: number) => { const d = X[0].length + 1; const A = Array.from({ length: d }, () => new Float64Array(d)), b = new Float64Array(d); for (let n = 0; n < X.length; n++) { const x = [...X[n], 1]; for (let i = 0; i < d; i++) { if (!x[i]) continue; b[i] += x[i] * y[n]; for (let j = 0; j < d; j++) A[i][j] += x[i] * x[j]; } } for (let i = 0; i < d; i++) A[i][i] += lam;
  for (let i = 0; i < d; i++) { let p = i; for (let r = i + 1; r < d; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]]; for (let r = 0; r < d; r++) if (r !== i) { const f = A[r][i] / A[i][i]; if (!f) continue; for (let c = i; c < d; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; } } return Array.from(b, (v, i) => v / A[i][i]); };
const ev = (X: number[][], y: number[], lam = 1) => { const w = ridge(X.slice(0, 160), y.slice(0, 160), lam); let ok = 0; for (let n = 160; n < 220; n++) { let z = w[w.length - 1]; for (let i = 0; i < X[n].length; i++) z += w[i] * X[n][i]; ok += +((z > 0.5 ? 1 : 0) === y[n]); } return ok / 60; };
const rng = (g: any, r0: number, n: number) => Array.from({ length: n }, (_, i) => g.rate[r0 + i] as number);
const out: Record<string, number[]> = {}; const add = (k: string, v: number) => (out[k] ??= []).push(v);
const NS = Number(process.env.NS ?? 16);
for (let s = Number(process.env.SB ?? 3445); s < Number(process.env.SB ?? 3445) + NS; s++) { const g: any = warm(s); const st: Record<string, number[][]> = {}; const A: number[] = [], B: number[] = [], X: number[] = []; const push = (k: string, v: number[]) => (st[k] ??= []).push(v);
  for (let t = 0; t < 220; t++) { const a = g.r() < 0.5 ? 1 : 0, b = g.r() < 0.5 ? 1 : 0; const x = new Array(16).fill(0); x[a] = 1; x[4 + b] = 1; const acc = new Array(2 * MW).fill(0);
    for (let k = 0; k < 3; k++) { show(g, x); g.step(); ctx(g, [0, 1]).forEach((v, i) => (acc[i] += v / 3)); }
    push("1 sens", rng(g, R0.SENS, 16)); push("2 thal", rng(g, R0.THAL, 16)); push("3 ctx m0 (a side)", ctx(g, [0])); push("4 ctx m1 (b side)", ctx(g, [1])); push("5 ctx31 m0+m1 (test readout)", ctx(g, [0, 1])); push("6 ctx m0+m1, 3-tick mean", acc);
    push("7 all cortex 64", rng(g, R0.CTX, 64)); push("8 L5 pool m0+m1", Array.from(g.l5?.slice(0, 16) ?? new Float64Array(16))); push("9 whole brain", Array.from(g.rate as Float32Array, (v: number) => v));
    push("10 oracle: ctx31 + a*b", [...ctx(g, [0, 1]), a * b]); A.push(a); B.push(b); X.push(a ^ b); show(g, new Array(16).fill(0)); g.step(); }
  for (const k in st) { const lam = k.startsWith("9") ? 10 : 1; add(k + " | a", ev(st[k], A, lam)); add(k + " | b", ev(st[k], B, lam)); add(k + " | a^b", ev(st[k], X, lam)); } }
const res: Record<string, string> = {}; for (const k of Object.keys(out).sort((p, q) => parseInt(p) - parseInt(q))) res[k] = (out[k].reduce((p, q) => p + q, 0) / out[k].length).toFixed(3);
console.log(JSON.stringify(res, null, 1));
