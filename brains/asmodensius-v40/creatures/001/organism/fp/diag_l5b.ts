// Diagnostic only: is a^b linearly present (ridge, 160 train/60 test) in raw ctx rates vs L5 pool vs both?
import { warm, show, ctx } from "../tests_v31";
const ridge = (X: number[][], y: number[], lam = 1) => { const d = X[0].length + 1; const A = Array.from({ length: d }, () => new Float64Array(d)), b = new Float64Array(d); for (let n = 0; n < X.length; n++) { const x = [...X[n], 1]; for (let i = 0; i < d; i++) { b[i] += x[i] * y[n]; for (let j = 0; j < d; j++) A[i][j] += x[i] * x[j]; } } for (let i = 0; i < d; i++) A[i][i] += lam;
  for (let i = 0; i < d; i++) { let p = i; for (let r = i + 1; r < d; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]]; for (let r = 0; r < d; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let c = i; c < d; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; } } return Array.from(b, (v, i) => v / A[i][i]); };
const acc: any = { raw: [], l5: [], both: [], a: [] };
for (let s = 3365; s < 3373; s++) { const g: any = warm(s); const R: number[][] = [], L: number[][] = [], Y: number[] = [], YA: number[] = [];
  for (let t = 0; t < 220; t++) { const a = g.r() < 0.5 ? 1 : 0, b = g.r() < 0.5 ? 1 : 0; const x = new Array(16).fill(0); x[a] = 1; x[4 + b] = 1; for (let k = 0; k < 3; k++) { show(g, x); g.step(); } R.push(ctx(g, [0, 1])); L.push(Array.from(g.l5.slice(0, 16))); Y.push(a ^ b); YA.push(a); show(g, new Array(16).fill(0)); g.step(); }
  const ev = (X: number[][], y: number[]) => { const w = ridge(X.slice(0, 160), y.slice(0, 160)); let ok = 0; for (let n = 160; n < 220; n++) { let z = w[w.length - 1]; for (let i = 0; i < X[n].length; i++) z += w[i] * X[n][i]; ok += +((z > 0.5 ? 1 : 0) === y[n]); } return ok / 60; };
  acc.raw.push(ev(R, Y)); acc.l5.push(ev(L, Y)); acc.both.push(ev(R.map((r, i) => [...r, ...L[i]]), Y)); acc.a.push(ev(R, YA)); }
for (const k in acc) console.log(k, (acc[k].reduce((p: number, q: number) => p + q) / acc[k].length).toFixed(3));
