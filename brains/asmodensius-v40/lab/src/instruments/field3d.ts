// 3D neural activity field (v0.6). Each neuron gets a fixed 3D position: its region's anatomical centroid (a coarse layout of
// the 14 regions) plus deterministic jitter. The field is the rate of every neuron sampled over time. Measured: spatial
// autocorrelation (Moran's I with inverse-distance weights) of the time-averaged activity; control: the same rates on
// shuffled neuron positions (Moran's I should be ~0). Also exports frames for the viewer.
import { REGIONS, R0, RN } from "../../../creatures/001/organism/organism";
import { mulberry } from "../rng";
const CENT: Record<string, [number, number, number]> = { SENS: [-3, 0, 2], THAL: [0, 0, 0], CTX: [0, 0, 3], HIP: [-2, -1, 0.5], STR: [1.5, 0, 1], HYP: [0, -1, -1.5], VTA: [0.5, -0.5, -2.5], RAPHE: [0, 0.5, -3], LC: [-0.5, 1, -3], BF: [1, -1, 0], INS: [2.5, 0, 1.5], SCN: [0, -1.5, -1.8], MOT: [2, 1, 2.5], ENS: [0, -3, -4] };
export function positions(seed = 1) { const r = mulberry(seed), P: [number, number, number][] = []; for (const [reg] of REGIONS) { const c = CENT[reg] ?? [0, 0, 0]; for (let i = 0; i < RN[reg]; i++) P.push([c[0] + 0.6 * (r() - 0.5), c[1] + 0.6 * (r() - 0.5), c[2] + 0.6 * (r() - 0.5)]); } return P; }
function moran(x: number[], P: [number, number, number][]) { const n = x.length, m = x.reduce((a, b) => a + b, 0) / n; let num = 0, W = 0, den = 0; for (let i = 0; i < n; i++) { den += (x[i] - m) ** 2; for (let j = 0; j < n; j++) if (i !== j) { const d = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1], P[i][2] - P[j][2]); const w = 1 / (d + 0.3); W += w; num += w * (x[i] - m) * (x[j] - m); } } return (n / W) * (num / den); }
export function field3d(c: any, ticks = 600, every = 10, seed = 1) { const o = c.o, P = positions(seed), n = P.length; const avg = new Array(n).fill(0); const frames: number[][] = [];
  for (let t = 0; t < ticks; t++) { c.step(1); for (let i = 0; i < n; i++) avg[i] += o.rate[i] / ticks; if (t % every === 0) frames.push(Array.from(o.rate.slice(0, n), (v: number) => +v.toFixed(3))); }
  const r = mulberry(seed + 9), Q = P.slice(); for (let i = Q.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [Q[i], Q[j]] = [Q[j], Q[i]]; }
  const shuf = Array.from({ length: 10 }, (_, k) => { const rr = mulberry(seed + 100 + k), S = P.slice(); for (let i = S.length - 1; i > 0; i--) { const j = Math.floor(rr() * (i + 1)); [S[i], S[j]] = [S[j], S[i]]; } return moran(avg, S); });
  return { neurons: n, moranI: moran(avg, P), shuffledMoranI: shuf, shuffledMax: Math.max(...shuf), positions: P.map((p) => p.map((v) => +v.toFixed(2))), frames, regions: REGIONS.map(([r2]) => [r2, R0[r2], RN[r2]]) }; }
