// Mutable v2.6 mechanisms (prereg v2.6). Parameters set on tuning seeds 2000..2015 only.
import { gauss, Rng } from "./harness";
export let BI = { I: 0.5, beta: 1.5, g: 0.6, tau: 10, tauA: 200, noise: 0.08, dt: 1 }; // chosen on tuning seeds 2000..2015 (3 settings scanned; k ~6.7, within reported human range)
export function setBI(p: Partial<typeof BI>) { BI = { ...BI, ...p }; }
const sig = (x: number) => 1 / (1 + Math.exp(-8 * x));
// rivalry: mutual inhibition + slow adaptation + input noise; returns dominance durations
export function rivalry(r: Rng, T: number): number[] { let r1 = 0.6, r2 = 0.1, a1 = 0, a2 = 0, dom = 1, last = -1; const D: number[] = []; const P = BI;
  for (let t = 0; t < T; t++) { const n1 = gauss(r) * P.noise, n2 = gauss(r) * P.noise;
    const f1 = sig(P.I - P.beta * r2 - P.g * a1 + n1), f2 = sig(P.I - P.beta * r1 - P.g * a2 + n2);
    r1 += P.dt / P.tau * (f1 - r1); r2 += P.dt / P.tau * (f2 - r2); a1 += P.dt / P.tauA * (r1 - a1); a2 += P.dt / P.tauA * (r2 - a2);
    const nd = r1 - r2 > 0.1 ? 1 : r2 - r1 > 0.1 ? 2 : dom; if (nd !== dom) { if (last >= 0) D.push(t - last); last = t; dom = nd; } }
  return D; }
// maze world model: perfect DFS maze on N x N cells; walls[c][dir] true = wall. dirs 0:+x 1:-x 2:+y 3:-y
export const MN = 6; const DX = [1, -1, 0, 0], DY = [0, 0, 1, -1];
export function maze(r: Rng): boolean[][] { const N = MN, W = Array.from({ length: N * N }, () => [true, true, true, true]), vis = new Array(N * N).fill(false), st = [0]; vis[0] = true;
  while (st.length) { const c = st[st.length - 1], x = c % N, y = Math.floor(c / N); const opts = [0, 1, 2, 3].filter((d) => { const nx = x + DX[d], ny = y + DY[d]; return nx >= 0 && ny >= 0 && nx < N && ny < N && !vis[ny * N + nx]; });
    if (!opts.length) { st.pop(); continue; } const d = opts[Math.floor(r() * opts.length)], n = (y + DY[d]) * N + x + DX[d]; W[c][d] = false; W[n][d ^ 1] = false; vis[n] = true; st.push(n); }
  return W; }
const move = (c: number, d: number) => { const x = c % MN + DX[d], y = Math.floor(c / MN) + DY[d]; return x < 0 || y < 0 || x >= MN || y >= MN ? -1 : y * MN + x; };
// model: 0 unknown, 1 open, 2 wall
export const newModel = () => Array.from({ length: MN * MN }, () => [0, 0, 0, 0]);
export function explore(W: boolean[][], M: number[][], r: Rng, steps: number) { let c = 0; for (let t = 0; t < steps; t++) { const d = Math.floor(r() * 4), n = move(c, d); if (n < 0) continue; if (W[c][d]) { M[c][d] = 2; } else { M[c][d] = 1; M[n][d ^ 1] = 1; c = n; } } }
function bfs(M: number[][], s: number, g: number): number { const prev = new Array(MN * MN).fill(-1), pd = new Array(MN * MN).fill(-1), q = [s]; prev[s] = s;
  while (q.length) { const c = q.shift()!; if (c === g) break; for (let d = 0; d < 4; d++) { const n = move(c, d); if (n >= 0 && M[c][d] !== 2 && prev[n] < 0) { prev[n] = c; pd[n] = d; q.push(n); } } }
  let c = g; if (prev[g] < 0) return -1; while (prev[c] !== s) c = prev[c]; return pd[c]; }
// goal-directed run: plan on model (unknown = open), blocked moves update model, replan
export function seek(W: boolean[][], M: number[][], goal: number, cap: number): number { let c = 0, t = 0;
  while (c !== goal && t < cap) { let d = bfs(M, c, goal); if (d < 0) { for (const row of M) for (let k = 0; k < 4; k++) if (row[k] === 2) row[k] = 0; d = bfs(M, c, goal); } /* belief revision: no believed path, so forget remembered walls */ t++; if (d < 0) break; if (W[c][d]) { M[c][d] = 2; const n = move(c, d); if (n >= 0) M[n][d ^ 1] = 2; } else { const n = move(c, d); M[c][d] = 1; M[n][d ^ 1] = 1; c = n; } }
  return c === goal ? t : cap; }
