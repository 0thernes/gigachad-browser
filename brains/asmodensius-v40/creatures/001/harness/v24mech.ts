// v2.4 creature mechanisms (mutable; changes logged in HARNESS_CHANGES.md)
import { Rng, gauss } from "./harness";
// RM-9: PI thermostat on internal variable
export function homeoCtl() { let I = 0; return (x: number) => { I += x; return -(0.9 * x + 0.02 * I); }; }
// RM-29: context-dependent gating (Masse 2018): task id selects a separate readout head
export function gatedLearner() { const W: Record<number, number[]> = { 0: new Array(8).fill(0), 1: new Array(8).fill(0) };
  return { pred: (x: number[], k: number) => x.reduce((s, v, i) => s + v * W[k][i], 0), train(x: number[], k: number, y: number) { const e = y - this.pred(x, k); for (let i = 0; i < 8; i++) W[k][i] += 0.05 * e * x[i]; } }; }
// RM-36: dopamine-like reward-prediction-error gate
export function daGate() { let base = 0.5; return (r: number) => { const g = r - base; base += 0.05 * (r - base); return g; }; }
// RM-42: choose larger-later iff energy budget covers the wait
export const delayChoice = (E: number, D: number) => E > 0.1 * D * 1.1;
// RM-53: run-and-tumble temporal-comparison circuit
export const tumbleP = (dc: number) => (dc > 0 ? 0.02 : dc < 0 ? 0.6 : 0.3);
// RM-73: energy-budget rule (Stephens 1981): risk-prone when safe option cannot reach requirement 1
export const riskChoice = (E: number) => E + 0.5 < 1;
// RM-78: log-scale (Dehaene) numerosity code
export const numEst = (n: number, r: Rng) => Math.exp(Math.log(n) + 0.15 * gauss(r));
// RM-82: two-process (Bouton): excitatory memory + context-dependent inhibitory memory that decays with time
export function bouton() { let V = 0, I = 0; return { trial(us: number) { const e = us - (V - I); if (us > 0) V += 0.15 * e; else I += 0.15 * -e; }, wait(n: number) { I *= Math.pow(0.99, n); }, resp: () => Math.max(0, V - I) }; }
// RM-96: triple-modular redundancy with majority-vote scrubbing
export const tmr = { encode: (g: number[]) => [...g, ...g, ...g], repair(s: number[]) { const n = s.length / 3; for (let i = 0; i < n; i++) { const m = s[i] + s[i + n] + s[i + 2 * n] >= 2 ? 1 : 0; s[i] = s[i + n] = s[i + 2 * n] = m; } }, decode: (s: number[]) => s.slice(0, s.length / 3) };
// RM-97: cryptobiosis switch
export function dormancy() { let noFood = 0; return (food: boolean): boolean => { noFood = food ? 0 : noFood + 1; return noFood > 20; }; }
// RM-52: distributed population code (cosine tuning, decoded with surviving units only)
export const popCode = { enc: (s: number) => Array.from({ length: 64 }, (_, i) => Math.cos(i * 2.399) * s), dec(a: number[], alive: boolean[]) { let num = 0, den = 0; for (let i = 0; i < 64; i++) if (alive[i]) { const w = Math.cos(i * 2.399); num += w * a[i]; den += w * w; } return den > 0 ? num / den : 0; } };
