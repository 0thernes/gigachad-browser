// Neuralese activation patching (analysis.js patchResid) -> neural state transplant. A part's state is copied from a donor
// (different seed, or same seed under a different condition) into a recipient at tick T, then we measure how far the recipient's
// motor/metric trajectory moves toward the donor's. effect 1 = the part fully carries the difference, 0 = none.
// mode "full" copies spiking state (v, spk, traces, adaptation, thresholds), incoming synaptic weights and eligibility traces;
// it requires identical wiring, i.e. the same seed (donor differs by condition via donorOpts or a pre-transplant stimulus).
import type { Factory, CreatureLab } from "../interface";
const dist = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0));
export type TransplantSpec = { recipientSeed: number; donorSeed: number; donorOpts?: Record<string, unknown>; donorPrep?: (d: CreatureLab) => void; parts: string[]; warm: number; horizon: number; metricKeys: string[]; mode?: "slow" | "full" };
export function transplant(make: Factory, s: TransplantSpec) { const mode = s.mode ?? "slow";
  const donor = () => { const d = make(s.donorSeed, s.donorOpts); if (s.donorPrep) s.donorPrep(d); d.step(s.warm); return d; };
  const roll = (c: CreatureLab) => { const out: number[] = []; for (let h = 0; h < s.horizon; h++) { c.step(1); const m = c.metrics(); out.push(...Array.from(c.motor()), ...s.metricKeys.map((k) => m[k])); } return out; };
  const recBase = () => { const c = make(s.recipientSeed); c.step(s.warm); return c; };
  const rec = roll(recBase()), don = roll(donor()), gap = dist(rec, don);
  const put = (c: CreatureLab, d: CreatureLab, p: string) => { if (p === "@snapshot") { if (!c.restore || !d.snapshot) throw new Error("creature has no snapshot/restore"); c.restore(JSON.parse(JSON.stringify(d.snapshot()))); return; } // v0.8 full-state transplant
    const ps = p === "*" ? (c as any).allParts() : [p]; for (const q of ps) c.writeState(q, d.readState(q, mode), mode); };
  const rows = s.parts.map((p) => { const c = recBase(); put(c, donor(), p); const x = roll(c); return { part: p, movedFromRecipient: dist(x, rec), effect: gap ? (gap - dist(x, don)) / gap : 0 }; });
  // control: transplant the recipient's own state into itself (must be a no-op: effect 0, moved 0)
  const self = (() => { const c = recBase(); const p = s.parts[0]; if (p === "@snapshot") put(c, c, p); else c.writeState(p, c.readState(p, mode), mode); return dist(roll(c), rec); })();
  return { mode, gap, selfControlMoved: self, rows };
}
