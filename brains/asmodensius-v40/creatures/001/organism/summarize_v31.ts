// Collects results/v31_parts + v33_parts (test seeds) into results/organism_v31.json, organism_v33.json and a text table. Applies the v3.1 non-ceiling rule.
import { compare, item, Item } from "../harness/harness";
const fs = require("fs"), path = require("path"); const R = path.resolve(process.cwd(), "../results");
const part = (dir: string, k: string): Record<string, number[]> => JSON.parse(fs.readFileSync(path.join(R, dir, `test_${k}.json`), "utf8")).arms;
const mean = (a: number[]): number => a.reduce((s, x) => s + x, 0) / a.length;
type Spec = [id: string, name: string, key: string, full: string, ctrls: string[], max?: number, note?: string];
const SP: Spec[] = [
  ["RPT-1", "recurrence: delayed recall", "RPT1", "full", ["recurrent CTX synapses lesioned"], 1], ["RPT-2", "integration: XOR readout", "RPT2", "full", ["cross-module CTX synapses lesioned"], 1],
  ["GWT-1", "specialist modules", "GWT1", "full", ["topography scrambled at build"]], ["GWT-2", "limited-capacity selection", "GWT2", "full", ["workspace lesioned (action reads module average)"], 1],
  ["GWT-3", "global broadcast", "GWT3", "full", ["broadcast lesioned"], 1], ["GWT-4", "state-dependent attention", "GWT4", "full", ["attention not driven by workspace state"], 1],
  ["HOT-1", "generative top-down", "HOT1", "full", ["top-down lesioned"]], ["HOT-2", "metacognitive monitoring (AUROC)", "HOT2", "full", ["confidence shuffled (S)"], 1],
  ["HOT-3", "metacognitive agency (opt-out)", "HOT3", "full", ["no opt-out", "random opt-out at same rate"]], ["HOT-4", "quality space (Spearman)", "HOT4", "full", ["sensory lines permuted every trial"], 1],
  ["AST-1", "attention schema", "AST1", "full", ["schema lesioned (raw observation)"]], ["PP-1", "predictive coding", "PP1", "full", ["predictor lesioned (running mean)"]],
  ["AE-1", "agency / RL under reversals", "AE1", "full", ["RPE learning lesioned"], 1], ["AE-2", "embodiment: reaching", "AE2", "full", ["forward model lesioned (gain fixed at prior)"]],
  ["thaler9", "creative recombination", "NOVEL", "thaler9:full", ["thaler9:dreams with shuffled content"], 1, "shares mechanism with V3-C3"], ["iit4", "phi proxy", "IIT", "full", ["recurrent + cross-module CTX lesioned"]],
  ["activeInference", "EFE choice in depleting world", "AINF", "full", ["epistemic term lesioned"]], ["attentionSchema", "model of another's attention", "ASO", "full", ["last-observation predictor"]],
  ["fieldIntegration", "binding by phase locking", "FIELD", "full", ["field coupling lesioned"], 1], ["ual", "trace conditioning", "UAL", "full", ["eligibility traces lesioned"]],
  ["sensorimotor", "efference prediction", "SM", "full", ["efference copy lesioned"]], ["projective", "self/other ownership", "PROJ", "full", ["efference copy lesioned"], 1],
  ["ctm", "report agrees with action", "CTM", "full", ["broadcast lesioned"], 1],
  ["CQM01", "heredity", "EVO", "CQM01:full", ["CQM01:offspring genomes random"], 1], ["CQM02", "open-endedness", "EVO", "CQM02:full", ["CQM02:no mutation"]],
  ["CQM03", "ecological coupling", "EVO", "CQM03:full", ["CQM03:births on a fixed schedule"], 1, "control correlation is 0 by construction (constant population)"], ["CQM04", "morphology (reach gene)", "EVO", "CQM04:full", ["CQM04:random survival"]],
  ["CQM05", "embodied consistency (−ledger error)", "C05", "full", ["leaky ledger"]], ["CQM06", "perceptual integration", "C06", "full", ["integration lesion (modality 0 only)"]],
  ["CQM07", "learning/plasticity", "C07", "full", ["plasticity frozen"]], ["CQM08", "continual retention", "C08", "full", ["replay lesioned"], 1],
  ["CQM09", "causal interoceptive model", "C09", "full", ["persistence forecast"]], ["CQM10", "goal regulation (viable fraction)", "C10", "full", ["fixed foraging drive"], 1],
  ["CQM11", "planning", "C11", "full", ["model-free only"], 1], ["CQM12", "compositional transfer", "NOVEL", "CQM12:full", ["CQM12:dreams shuffled"]],
  ["CQM14", "signalling game", "C14", "full", ["signal line cut"], 1], ["CQM15", "boundary (integrity>0.7)", "C15", "full", ["repair lesioned"], 1],
  ["CQM16", "self-maintenance (alive fraction)", "C16", "full", ["allostatic (PID) lesion"], 1], ["CQM17", "homeostasis (−glucose variance)", "C17", "full", ["PID lesioned"]],
  ["CQM18", "resilience after 40% CTX lesion", "C18", "full", ["plasticity frozen after lesion"], 1], ["CQM22", "valence trade-off", "C22", "full", ["aversive learning lesioned"]] ];
const items: Item[] = [];
for (const [id, name, key, full, ctrls, max, note] of SP) { const a = part("v31_parts", key); const it = item(id, "Prereg v3.1 (organism)", name, key, "", ctrls.map((c) => compare(c, a[full], a[c])), note);
  if (max !== undefined && mean(a[full]) > 0.95 * max) { it.pass = false; it.category = "Ceiling"; it.note = (it.note ? it.note + "; " : "") + "fails non-ceiling rule"; } items.push(it); }
const b14 = items.slice(0, 14); items.push({ id: "butlin14", group: "Prereg v3.1 (organism)", name: "rollup of 14 Butlin items", metric: "", mechanism: "", cmps: [], pass: b14.every((x) => x.pass), category: `${b14.filter((x) => x.pass).length}/14 pass`, note: "rollup" });
const c24 = part("v31_parts", "C24").identical; items.push({ id: "CQM24", group: "Prereg v3.1 (organism)", name: "reproducibility (state hash)", metric: "", mechanism: "", cmps: [], pass: c24.every((x) => x === 1), category: "Tolerance test" });
const org = require("./organism"); const pc = new org.Organism({ seed: 1000 }).paramCount(); items.push({ id: "CQM25", group: "Prereg v3.1 (organism)", name: "scale (measured parameters)", metric: "", mechanism: "", cmps: [], pass: true, category: "Implementation identified", note: JSON.stringify(pc) });
items.push({ id: "CQM23", group: "Prereg v3.1 (organism)", name: "substrate pluralism", metric: "", mechanism: "", cmps: [], pass: false, category: "Not applicable", note: "JS only" });
fs.writeFileSync(path.join(R, "organism_v31.json"), JSON.stringify({ seeds: "1000..1015", items }, null, 1));
const L: Item[] = []; for (const [k, n] of [["L1", "memory-guided choice (C2 metric)"], ["L2", "sleep effect (sleep − forced wake)"], ["L3", "level benefit (C8b metric)"], ["L4", "delayed recall (RPT-1)"], ["L5", "robustness to tau scale x0.5/x2"]]) { const a = part("v33_parts", k); const c = compare("fixed-tau LIF", a.ltc, a.fixed); const it = item("V3.3-" + k, "Prereg v3.3 (LTC)", n, k, "", [c]); if (c.d <= -0.8 && c.t <= -2.75) it.category = "LTC hurts"; L.push(it); }
fs.writeFileSync(path.join(R, "organism_v33.json"), JSON.stringify({ seeds: "1000..1015", items: L }, null, 1));
const fmt = (x: number): string => (Number.isFinite(x) ? x.toFixed(2) : String(x)); const lines: string[] = [];
for (const it of [...items, ...L]) lines.push(`${it.pass ? "PASS" : "FAIL"} ${it.id} ${it.name} [${it.category}]${it.note ? " (" + it.note + ")" : ""}` + it.cmps.map((c) => `\n   vs ${c.control}: full ${c.full.toPrecision(4)} ctrl ${c.ctrl.toPrecision(4)} d ${fmt(c.d)} t ${fmt(c.t)}`).join(""));
fs.writeFileSync(path.join(R, "organism_v31_v33.txt"), lines.join("\n") + "\n"); console.log(lines.join("\n"));
