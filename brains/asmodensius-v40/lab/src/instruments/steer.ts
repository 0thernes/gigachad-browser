// Neuralese STEER / control vectors (analysis.js buildControlVector) -> stimulation steering: dose-response of a metric
// to sustained drive injected into a part, with a zero-dose control on the same seed.
import type { Factory } from "../interface";
export function steer(make: Factory, seed: number, part: string, doses: number[], ticks: number, metric: string, warm = 120) {
  return { part, metric, rows: doses.map((dose) => { const c = make(seed); c.step(warm); const m0 = c.metrics()[metric]; let acc = 0;
    for (let i = 0; i < ticks; i++) { if (dose) c.stimulate(part, dose); c.step(1); acc += c.metrics()[metric]; } return { dose, before: m0, meanDuring: acc / ticks }; }) };
}
