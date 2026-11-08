// v0.7 recurrent-processing probe: evoked CTX response to a SENS pulse, split into an early (feedforward, ticks 1-10) and a late
// (sustained, ticks 11-60) window, intact vs a feedback coupling cut. Lamme's RPT predicts that cutting feedback removes the late
// part and spares the early part. Each trial is paired with a sham twin (same seed, no pulse), so values are evoked minus spontaneous.
import type { Factory } from "../interface";
export function rptProbe(make: Factory, seed: number, cut: string, trials = 8, amount = 3) { const res = { intact: { early: 0, late: 0 }, cut: { early: 0, late: 0 } };
  for (const arm of ["intact", "cut"] as const) for (let k = 0; k < trials; k++) { const mk = () => { const c = make(seed + 31 * k); if (arm === "cut") c.lesionCoupling(cut, 0); c.step(300 + 17 * k); return c; };
    const a = mk(), b = mk(); a.stimulate("SENS", amount); for (let t = 1; t <= 60; t++) { a.step(1); b.step(1); const d = (a.metrics().ctxRate - b.metrics().ctxRate) / trials; if (t <= 10) res[arm].early += d / 10; else res[arm].late += d / 50; } }
  return { cut, ...res, lateRatio: res.cut.late / (res.intact.late || 1e-12), earlyRatio: res.cut.early / (res.intact.early || 1e-12) }; }
