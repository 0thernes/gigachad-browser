// Quantum geometry (v0.6): the quantum geometric tensor Q_ij = <d_i psi|d_j psi> - <d_i psi|psi><psi|d_j psi> of the creature's
// live 3-qubit state |psi(theta)>, theta = pi*clamp(DA, 5HT, NE). Computed lab-side from a fresh Q3 by central differences, then
// checked against (a) the organism's own qgt() trace, (b) positive semidefiniteness of the metric g = Re Q, (c) a control: a
// product state (no entangling CNOTs) whose metric is analytically diag(1/4) and whose Berry curvature is 0; and a Berry phase
// (discrete Wilson loop) around a small loop in (theta_DA, theta_5HT).
import { Q3, qgt } from "../../../creatures/001/organism/organism";
type C = [number, number];
const state = (th: number[], entangle = true) => { const q = new Q3(); if (entangle) q.prepare(th); else { q.reset(); for (let k = 0; k < 3; k++) q.ry(k, th[k]); for (let k = 0; k < 3; k++) q.rz(k, th[k] * 0.7); } return Array.from({ length: 8 }, (_, i) => [q.re[i], q.im[i]] as C); };
const ip = (a: C[], b: C[]): C => a.reduce((s, x, i) => [s[0] + x[0] * b[i][0] + x[1] * b[i][1], s[1] + x[0] * b[i][1] - x[1] * b[i][0]], [0, 0] as C); // <a|b>
export function tensor(th: number[], entangle = true, h = 1e-4) { const p = state(th, entangle), d = [0, 1, 2].map((i) => { const a = th.slice(), b = th.slice(); a[i] += h; b[i] -= h; const A = state(a, entangle), B = state(b, entangle); return A.map((x, k) => [(x[0] - B[k][0]) / (2 * h), (x[1] - B[k][1]) / (2 * h)] as C); });
  const g: number[][] = [], F: number[][] = []; for (let i = 0; i < 3; i++) { g.push([]); F.push([]); for (let j = 0; j < 3; j++) { const a = ip(d[i], d[j]), b = ip(d[i], p), c = ip(p, d[j]); const q: C = [a[0] - (b[0] * c[0] - b[1] * c[1]), a[1] - (b[0] * c[1] + b[1] * c[0])]; g[i].push(q[0]); F[i].push(-2 * q[1]); } }
  return { g, berryCurvature: F, trace: g[0][0] + g[1][1] + g[2][2] }; }
const det3 = (m: number[][]) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
export function berryPhase(th: number[], r = 0.05, n = 64, entangle = true) { const pts = Array.from({ length: n }, (_, k) => state([th[0] + r * Math.cos((2 * Math.PI * k) / n), th[1] + r * Math.sin((2 * Math.PI * k) / n), th[2]], entangle)); let re = 1, im = 0; for (let k = 0; k < n; k++) { const z = ip(pts[k], pts[(k + 1) % n]); [re, im] = [re * z[0] - im * z[1], re * z[1] + im * z[0]]; } return -Math.atan2(im, re); }
export function quantumGeometry(c: any) { const o = c.o; const th: number[] = o.qth.slice(); const T = tensor(th), P = tensor(th, false), ref = qgt(th);
  const minors = [T.g[0][0], T.g[0][0] * T.g[1][1] - T.g[0][1] ** 2, det3(T.g)];
  const bp = berryPhase(th), bpProd = berryPhase(th, 0.05, 64, false), area = Math.PI * 0.05 ** 2;
  return { theta: th, g: T.g, berryCurvature: T.berryCurvature, trace: T.trace, organismTrace: ref.trace, traceRelErr: Math.abs(T.trace - ref.trace) / Math.max(1e-12, ref.trace), psd: minors.every((m) => m > -1e-9),
    control: { productTrace: P.trace, productTraceExpected: 0.75 + 0.49 * [0, 1, 2].reduce((s, k) => s + Math.sin(th[k]) ** 2 / 4, 0), productBerry01: P.berryCurvature[0][1] },
    berryPhaseLoop: bp, berryPhaseFromCurvature: T.berryCurvature[0][1] * area * 0.5, productBerryPhaseLoop: bpProd }; }
