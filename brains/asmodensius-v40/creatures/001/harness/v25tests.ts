// FROZEN v2.5 tests (preregistrations/v2.5.md). Do not edit after first run.
import { mulberry, SEEDS, compare, item, Item, Net6 } from "./harness";
import { cqm21rNet } from "./v25mech";
type Mode = "full" | "shuf" | "lesion" | "iid";
function run(net: Net6, seed: number, mode: Mode, rates?: number[]): { mi: number; rates: number[] } {
  const r = mulberry(seed * 1009 + 2101), rn = mulberry(seed * 1009 + 2103), n = 6, H = [1, 3, 5];
  let W = net.W.map((row) => row.slice());
  if (mode === "shuf") { const rs = mulberry(seed * 1009 + 2102); const pos: [number, number][] = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) pos.push([i, j]); const v = pos.map(([i, j]) => W[i][j]); for (let k = v.length - 1; k > 0; k--) { const m = Math.floor(rs() * (k + 1)); [v[k], v[m]] = [v[m], v[k]]; } pos.forEach(([i, j], k) => (W[i][j] = v[k])); }
  if (mode === "lesion") W = W.map((row) => row.map(() => 0));
  let st = new Array(n).fill(0); const step = (stim: number) => { const inp = [0, 0, 0, 0, 0, 0]; inp[0] = stim & 1 ? 1 : -1; inp[2] = stim & 2 ? 1 : -1; inp[4] = stim & 4 ? 1 : -1;
    st = st.map((_, i) => { let h = net.b[i] + inp[i]; for (let j = 0; j < n; j++) h += W[i][j] * (st[j] * 2 - 1); return r() < 1 / (1 + Math.exp(-2 * h)) ? 1 : 0; }); };
  let ws = 0; for (let t = 0; t < 200; t++) { if (t % 25 === 0) ws = Math.floor(r() * 8); step(ws); }
  const S: number[] = [], X: number[][] = []; const tot = [0, 0, 0]; let cnt = 0;
  for (let e = 0; e < 400; e++) { const s = Math.floor(r() * 8); const c = [0, 0, 0]; for (let k = 0; k < 25; k++) { step(s); if (k >= 5) H.forEach((u, q) => { const x = mode === "iid" ? (rn() < rates![q] ? 1 : 0) : st[u]; c[q] += x; tot[q] += x; }); if (k >= 5) cnt++; } S.push(s); X.push(c); }
  const cen = Array.from({ length: 8 }, () => [0, 0, 0]), nc = new Array(8).fill(0);
  for (let e = 0; e < 200; e++) { nc[S[e]]++; for (let q = 0; q < 3; q++) cen[S[e]][q] += X[e][q]; } for (let s = 0; s < 8; s++) if (nc[s]) for (let q = 0; q < 3; q++) cen[s][q] /= nc[s];
  const C = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let e = 200; e < 400; e++) { let best = 0, bd = Infinity; for (let s = 0; s < 8; s++) { const d = cen[s].reduce((a, v, q) => a + (v - X[e][q]) ** 2, 0); if (d < bd) { bd = d; best = s; } } C[S[e]][best]++; }
  const N = 200, pr = C.map((row) => row.reduce((a, b) => a + b, 0) / N), pc = C[0].map((_, j) => C.reduce((a, row) => a + row[j], 0) / N); let mi = 0;
  C.forEach((row, i) => row.forEach((c, j) => { if (c) { const p = c / N; mi += p * Math.log2(p / (pr[i] * pc[j])); } }));
  return { mi, rates: tot.map((x) => x / cnt) }; }
export function v25Tests(): Item[] {
  const F = SEEDS.map((s) => run(cqm21rNet(s), s, "full")); const net = (k: number) => cqm21rNet(SEEDS[k]);
  const full = F.map((x) => x.mi), shuf = SEEDS.map((s, k) => run(net(k), s, "shuf").mi), les = SEEDS.map((s, k) => run(net(k), s, "lesion").mi), iid = SEEDS.map((s, k) => run(net(k), s, "iid", F[k].rates).mi);
  return [item("CQM-21R", "Prereg v2.5", "Differentiation of the creature's own network (not CQM-21)", "cross-validated I(S; hidden-unit repertoire) (bits)", "creature 6-unit stochastic recurrent network (cqm21rNet)",
    [compare("shuffled weights", full, shuf), compare("lesioned recurrence (W=0)", full, les), compare("iid noise matched in rate/variance", full, iid)])]; }
