// v0.8 "moonlab-sim" dice. HONEST LABEL: simulated quantum, not a hardware QRNG. A 3-qubit statevector runs in the Moonlab WASM
// simulator (tsotchke/moonlab, built in creatures/001/wasm). Each qubit gets RY(theta) (theta = pi/2 gives a uniform superposition,
// other angles a God-chosen Born bias). Moonlab returns the Born probabilities; the outcome is then drawn from them with a seeded
// classical stream, so runs are reproducible. The entropy is therefore classical-seeded; only the outcome distribution is quantum-simulated.
import { mulberry } from "../rng"; import type { DiceSource } from "./god";
export async function loadMoonlabSim(path = require("path").resolve(__dirname, "../../creatures/001/wasm/moonlab.js")) { const ML = require(path); return (ML.default || ML)(); }
export function moonlabDice(m: any, seed: number, theta = Math.PI / 2): DiceSource & { probs: number[]; calls: number } {
  const st = m._malloc(4096); if (m._quantum_state_init(st, 3) !== 0) throw new Error("moonlab init failed"); m._quantum_state_reset(st); for (let q = 0; q < 3; q++) m._gate_ry(st, q, theta);
  const probs: number[] = []; for (let k = 0; k < 8; k++) probs.push(m._quantum_state_get_probability(st, BigInt(k))); const cdf = probs.map((_, i) => probs.slice(0, i + 1).reduce((a, b) => a + b, 0));
  const u = mulberry(seed * 2654435761 + 17); const self: any = { name: "moonlab-sim", label: "simulated quantum (Moonlab WASM statevector, Born outcomes drawn with a seeded stream); not hardware QRNG", probs, calls: 0 };
  const draw3 = () => { const x = u() * cdf[7]; let k = 0; while (k < 7 && x >= cdf[k]) k++; return k; };
  const next: any = () => { self.calls++; let v = 0; for (let i = 0; i < 8; i++) v = v * 8 + draw3(); return v / 16777216; }; next.getState = () => (u as any).getState(); next.setState = (x: number) => (u as any).setState(x); self.next = next; return self as DiceSource & { probs: number[]; calls: number }; }
