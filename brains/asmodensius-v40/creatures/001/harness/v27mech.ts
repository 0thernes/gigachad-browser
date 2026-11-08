// Mutable v2.7 mechanisms (prereg v2.7). Parameters fixed in the prereg; nothing tuned on test seeds.
import { Rng, mulberry, gauss, creatureNet } from "./harness";
import { cqm21rNet } from "./v25mech";
// CAP-B (copied worm body plan) retired 2026-10-31 under the originality rule; archived in archive/history/cap-b/.
// ---- CAP-R: self-description, noisy channel, majority-vote repair ----
export function stateOf(seed: number): Float32Array { const net = cqm21rNet(seed), r = mulberry(seed * 263 + 2710); const v: number[] = []; net.W.forEach((row) => v.push(...row)); v.push(...net.b); v.push(r() * 6.283185307, r(), (r() * 4294967296) >>> 0); return Float32Array.from(v); }
export function transmit(desc: Uint8Array, r: Rng, p: number): Uint8Array { const o = desc.slice(); for (let i = 0; i < o.length * 8; i++) if (r() < p) o[i >> 3] ^= 1 << (i & 7); return o; }
export function reproduce(parent: Float32Array, r: Rng, repair: boolean): Float32Array { const b = new Uint8Array(parent.buffer.slice(0)); const L = b.length;
  if (!repair) return new Float32Array(transmit(b, r, 1e-3).buffer); const d = new Uint8Array(3 * L); d.set(b); d.set(b, L); d.set(b, 2 * L); const rx = transmit(d, r, 1e-3); const out = new Uint8Array(L);
  for (let i = 0; i < L; i++) { const a = rx[i], c = rx[L + i], e = rx[2 * L + i]; out[i] = (a & c) | (a & e) | (c & e); } return new Float32Array(out.buffer); }
// CAP-C (C. elegans connectome rate model) retired 2026-10-31 under the originality rule; archived in archive/history/cap-c/.
// ---- CAP-S (v2.7a): uncertainty-aware planner. Known-open edges cost 1, unknown edges cost UNK; walls impassable. Same replanning loop as v2.6.
import { MN } from "./v26mech";
export let UNK = 20; export function setUNK(v: number) { UNK = v; }
const DX7 = [1, -1, 0, 0], DY7 = [0, 0, 1, -1]; const mv7 = (c: number, d: number) => { const x = c % MN + DX7[d], y = Math.floor(c / MN) + DY7[d]; return x < 0 || y < 0 || x >= MN || y >= MN ? -1 : y * MN + x; };
function dij(M: number[][], s: number, g: number): number { const N = MN * MN, dist = new Array(N).fill(Infinity), first = new Array(N).fill(-1), done = new Array(N).fill(false); dist[s] = 0;
  for (;;) { let u = -1; for (let i = 0; i < N; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i; if (u < 0 || u === g) break; done[u] = true;
    for (let d = 0; d < 4; d++) { const n = mv7(u, d); if (n < 0 || M[u][d] === 2) continue; const nd = dist[u] + (M[u][d] === 1 ? 1 : UNK); if (nd < dist[n]) { dist[n] = nd; first[n] = u === s ? d : first[u]; } } }
  return first[g]; }
export function seekPref(W: boolean[][], M: number[][], goal: number, cap: number): number { let c = 0, t = 0;
  while (c !== goal && t < cap) { let d = dij(M, c, goal); if (d < 0) { for (const row of M) for (let k = 0; k < 4; k++) if (row[k] === 2) row[k] = 0; d = dij(M, c, goal); } t++; if (d < 0) break; const n = mv7(c, d);
    if (W[c][d]) { M[c][d] = 2; if (n >= 0) M[n][d ^ 1] = 2; } else { M[c][d] = 1; M[n][d ^ 1] = 1; c = n; } }
  return c === goal ? t : cap; }
