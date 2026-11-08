// is XOR information present in CTX m0+m1 at tick k? offline logistic decoder (many epochs) + per-unit a×b interaction
import { M40 } from "/workspace/Asmodensius-v40/creatures/001/organism/organism";
import { warm, show, ctx } from "/workspace/Asmodensius-v40/creatures/001/organism/tests_v31";
Object.assign(M40, JSON.parse(process.env.TUNE ?? "{}"));
const g: any = warm(Number(process.env.S ?? 2689), {}); const X: number[][][] = [[], [], []], Y: number[][] = [];
for (let t = 0; t < 600; t++) { const a = Math.random() < 0.5 ? 1 : 0, b = Math.random() < 0.5 ? 1 : 0; const x = new Array(16).fill(0); x[a] = 1; x[4 + b] = 1; for (let k = 0; k < 3; k++) { show(g, x); g.step(); X[k].push(ctx(g, [0, 1])); } Y.push([a, b, a ^ b]); show(g, new Array(16).fill(0)); g.step(); }
const fit = (F: number[][], y: number[]) => { const n = F[0].length; const W = new Array(n + 1).fill(0); for (let ep = 0; ep < 200; ep++) for (let i = 0; i < 400; i++) { const f = [...F[i], 1]; const p = 1 / (1 + Math.exp(-f.reduce((s, v, j) => s + v * W[j], 0))); for (let j = 0; j <= n; j++) W[j] += 0.05 * (y[i] - p) * f[j]; } let ok = 0; for (let i = 400; i < 600; i++) { const f = [...F[i], 1]; ok += +((f.reduce((s, v, j) => s + v * W[j], 0) > 0 ? 1 : 0) === y[i]); } return ok / 200; };
for (let k = 0; k < 3; k++) { const acc = [0, 1, 2].map((c) => fit(X[k], Y.map((r) => r[c])).toFixed(2)); const cell = (a: number, b: number, i: number) => { const v = X[k].filter((_, n) => Y[n][0] === a && Y[n][1] === b).map((r) => r[i]); return v.reduce((s, x) => s + x, 0) / v.length; };
  const inter = Array.from({ length: 26 }, (_, i) => Math.abs(cell(1, 1, i) - cell(1, 0, i) - cell(0, 1, i) + cell(0, 0, i))).sort((p, q) => q - p);
  console.log(`k${k + 1} decode a/b/xor`, acc.join(' '), 'interaction top3', inter.slice(0, 3).map((x) => x.toFixed(3)).join(' ')); }
