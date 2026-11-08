// Consciousness-indicator scorecard (v0.6). An INDICATOR checklist in the style of Butlin et al. 2023, computed by lab instruments
// with a control per row. It is evidence about functional properties only; it is not, and cannot be, a test of consciousness.
import type { Factory } from "../interface";
import { pci } from "./pci"; import { workspaceRouting } from "./routing"; import { lesionStats } from "./lesionStats"; import { stateDecoder } from "./decoder";
export function scorecard(make: Factory, seed: number) { const rows: { indicator: string; theory: string; value: number; control: number; pass: boolean; note: string }[] = [];
  const P = pci(make, seed, "CTX", 3); rows.push({ indicator: "perturbational complexity", theory: "IIT / PCI (Casali 2013)", value: P.pci, control: P.shuffledUpperBound, pass: P.responseFrac > P.shamResponseFrac && P.pci > 0.3, note: `response ${P.responseFrac.toFixed(3)} vs sham ${P.shamResponseFrac.toFixed(3)}; PCI normalised, shuffled bound shown as control` });
  const c = make(seed); c.step(300); const W = workspaceRouting(c, 1200, seed); const plv = W.pairs.reduce((s, p) => s + p.plv, 0) / W.pairs.length, nul = W.pairs.reduce((s, p) => s + p.nullPlv, 0) / W.pairs.length;
  rows.push({ indicator: "global workspace ignition + broadcast", theory: "GWT (Dehaene)", value: plv, control: nul, pass: W.ignitionsPerHour > 1 && plv > nul + 0.1, note: `${W.ignitionsPerHour.toFixed(1)} ignitions/h; PLV vs lag-shuffled null` });
  const L = lesionStats(make, [seed, seed + 1, seed + 2, seed + 3, seed + 4, seed + 5], ["THAL->CTX", "CTX->THAL"], 400, "ctxRate") as any; const rr = (L.rows ?? L)[1] ?? (L.rows ?? L)[0];
  const eff = Math.abs(rr?.diff ?? rr?.effect ?? 0); rows.push({ indicator: "recurrent processing (CTX->THAL feedback)", theory: "RPT (Lamme)", value: eff, control: 0, pass: (rr?.p ?? 1) < 0.05, note: "lesion of feedback coupling vs intact, 6 seeds paired permutation" });
  const k = make(seed); k.step(300); const D = stateDecoder(k, "INS", () => ((k as any).o.blood.glc > 3 ? 1 : 0), 2, 600, 4, seed) as any;
  rows.push({ indicator: "interoceptive self-model (INS decodes body glucose)", theory: "predictive processing / AST-adjacent", value: D.accuracy, control: D.controlShuffled, pass: (D.accuracy) > (D.controlShuffled) + 0.1, note: "decoder vs shuffled labels" });
  return { seed, rows, score: rows.filter((r) => r.pass).length, of: rows.length, disclaimer: "Indicator properties only; passing rows do not establish consciousness." }; }
