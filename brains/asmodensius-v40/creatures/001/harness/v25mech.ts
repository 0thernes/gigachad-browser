// Mutable v2.5 mechanism: the network the creature builds for CQM-21R.
// v2.5a: after creatureNet(seed) is built, a developmental phase of local plasticity runs on the creature's own
// experience (random stimuli, its own stream, salt 2200; never the test stream): Hebbian feed-forward learning from
// driven units to hidden units, plus anti-Hebbian lateral decorrelation between hidden units (Foldiak 1990).
// The rule sees only pre/post activity, never the stimulus label or the CQM-21R metric.
import { creatureNet, Net6, mulberry } from "./harness";
export let DEV = { on: true, steps: 3000, eta: 0.01, etaL: 0.02, wmax: 3 };
export function setDev(d: Partial<typeof DEV>) { DEV = { ...DEV, ...d }; }
export function develop(net: Net6, seed: number): Net6 { const W = net.W.map((r) => r.slice()), b = net.b, n = 6, r = mulberry(seed * 1009 + 2200), H = [1, 3, 5], D = [0, 2, 4];
  let st = new Array(n).fill(0), stim = 0; const m = new Array(n).fill(0);
  for (let t = 0; t < DEV.steps; t++) { if (t % 25 === 0) stim = Math.floor(r() * 8); const inp = [0, 0, 0, 0, 0, 0]; inp[0] = stim & 1 ? 1 : -1; inp[2] = stim & 2 ? 1 : -1; inp[4] = stim & 4 ? 1 : -1;
    st = st.map((_, i) => { let h = b[i] + inp[i]; for (let j = 0; j < n; j++) h += W[i][j] * (st[j] * 2 - 1); return r() < 1 / (1 + Math.exp(-2 * h)) ? 1 : 0; });
    const y = st.map((x) => x * 2 - 1); for (let i = 0; i < n; i++) m[i] = 0.99 * m[i] + 0.01 * y[i]; const c = y.map((v, i) => v - m[i]);
    for (const i of H) { for (const j of D) W[i][j] = Math.max(-DEV.wmax, Math.min(DEV.wmax, W[i][j] + DEV.eta * c[i] * c[j])); for (const k of H) if (k !== i) W[i][k] = Math.max(-DEV.wmax, Math.min(DEV.wmax, W[i][k] - DEV.etaL * c[i] * c[k])); } }
  return { W, b }; }
export function cqm21rNet(seed: number): Net6 { const n = creatureNet(seed); return DEV.on ? develop(n, seed) : n; }
