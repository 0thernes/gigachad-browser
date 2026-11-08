// trace b (sens[4+b]) through the creature: module-1 ext, module-1 spikes, module-0 dend (kind-3 arrivals), module-0 spikes, per stimulus tick
import { M40 } from "/workspace/Asmodensius-v40/creatures/001/organism/organism";
import { warm, show } from "/workspace/Asmodensius-v40/creatures/001/organism/tests_v31";
const g: any = warm(Number(process.env.S ?? 2689), {}); const C = (g.constructor as any); void C; void M40;
const R: Record<string, number[][][]> = {}; const rec = (k: string, b: number, v: ArrayLike<number>) => { ((R[k] ??= [[], []])[b]).push(Array.from(v)); };
const base = 0; void base; const CTX = (globalThis as any).R0CTX ?? g.R0?.CTX;
let c0 = -1; for (let i = 0; i < g.rate.length; i++) {} // find CTX start via ctx helper semantics
import { ctx } from "/workspace/Asmodensius-v40/creatures/001/organism/tests_v31";
for (let t = 0; t < 300; t++) { const b = t & 1, a = (t >> 1) & 1; const x = new Array(16).fill(0); x[a] = 1; x[4 + b] = 1;
  for (let k = 1; k <= 3; k++) { show(g, x); g.step(); const v = ctx(g, [0, 1]); rec(`k${k} m0 rate`, b, v.slice(0, 13)); rec(`k${k} m1 rate`, b, v.slice(13, 26)); }
  show(g, new Array(16).fill(0)); g.step(); }
const dp = (A: number[][], B: number[][]) => { const n = A[0].length, out: number[] = []; for (let i = 0; i < n; i++) { const m = (X: number[][]) => X.reduce((s, r) => s + r[i], 0) / X.length; const v = (X: number[][], mu: number) => X.reduce((s, r) => s + (r[i] - mu) ** 2, 0) / X.length; const ma = m(A), mb = m(B); out.push(Math.abs(ma - mb) / (Math.sqrt((v(A, ma) + v(B, mb)) / 2) + 1e-9)); } return out.sort((p, q) => q - p); };
for (const k of Object.keys(R)) { const d = dp(R[k][0], R[k][1]); console.log(k.padEnd(14), 'max', d[0].toFixed(2), 'top3', d.slice(0, 3).map((x) => x.toFixed(2)).join(' '), 'median', d[d.length >> 1].toFixed(2), 'meanAct', (R[k][0].flat().reduce((s, x) => s + x, 0) / R[k][0].flat().length).toFixed(3)); }
console.log(CTX, c0);
