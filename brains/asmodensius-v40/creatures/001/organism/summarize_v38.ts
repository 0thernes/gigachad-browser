// v3.8 summarizer (clone of v3.7 + VIAB, prereg v3.8 §E). Originally: v3.6 summarizer (prereg v3.6 §C; same rules as v3.4/v3.5 plus the v3.6 R-variant and steering items). Reads $V34DIR (default ../results/v34_parts) files <MODE>_<KEY>.json (MODE=test default).
// Writes results/organism_v38.json + organism_v38.txt only when MODE=test; otherwise prints. Applies the v3.1 non-ceiling rule (bounded metrics: mean > 0.95*max fails).
import { compare, item, Item } from "../harness/harness";
const fs = require("fs"), path = require("path"); const R = path.resolve(process.cwd(), "../results"); const MODE = process.env.MODE || "test"; const DIR = path.resolve(R, process.env.V34DIR || "v38_parts");
const part = (k: string): Record<string, number[]> => JSON.parse(fs.readFileSync(path.join(DIR, `${MODE}_${k}.json`), "utf8")).arms;
const has = (k: string): boolean => fs.existsSync(path.join(DIR, `${MODE}_${k}.json`));
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
const G = "Prereg v3.4 (organism, v3.1 suite)"; const items: Item[] = []; const missing: string[] = [];
const ceil = (it: Item, a: number[], max?: number): Item => { if (max !== undefined && mean(a) > 0.95 * max) { it.pass = false; it.category = "Ceiling"; it.note = (it.note ? it.note + "; " : "") + "fails non-ceiling rule"; } return it; };
const stub = (id: string, name: string, why: string): Item => ({ id, group: G, name, metric: "", mechanism: "", cmps: [], pass: false, category: "Missing", note: why });
for (const [id, name, key, full, ctrls, max, note] of SP) { if (!has(key)) { missing.push(key); items.push(stub(id, name, "not run")); continue; } const a = part(key); items.push(ceil(item(id, G, name, key, "", ctrls.map((c) => compare(c, a[full], a[c])), note), a[full], max)); }
const byId = (id: string): Item => items.find((x) => x.id === id) as Item;
const b14 = items.slice(0, 14); const nb = b14.filter((x) => x.pass).length; items.push({ id: "butlin14", group: G, name: "rollup of 14 Butlin items", metric: "", mechanism: "", cmps: [], pass: nb === 14, category: `${nb}/14 pass`, note: "rollup" });
if (has("C24")) { const c24 = part("C24").identical; items.push({ id: "CQM24", group: G, name: "reproducibility (state hash)", metric: "", mechanism: "", cmps: [], pass: c24.every((x) => x === 1), category: "Tolerance test" }); } else items.push(stub("CQM24", "reproducibility (state hash)", "not run"));
const org = require("./organism"); const pc = new org.Organism({ seed: 1000 }).paramCount(); items.push({ id: "CQM25", group: G, name: "scale (measured parameters)", metric: "", mechanism: "", cmps: [], pass: true, category: "Implementation identified", note: JSON.stringify(pc) });
items.push({ id: "CQM23", group: G, name: "substrate pluralism", metric: "", mechanism: "", cmps: [], pass: false, category: "Not applicable", note: "JS only" });
// rollups
const FW = ["thaler9", "iit4", "activeInference", "attentionSchema", "fieldIntegration", "ual", "sensorimotor", "projective", "ctm", "butlin14"]; const nfw = FW.filter((id) => byId(id).pass).length;
const CQ: [string, string][] = Array.from({ length: 25 }, (_, k) => { const n = k + 1, id = `CQM${String(n).padStart(2, "0")}`; return [id, n === 13 ? "HOT-2" : n === 19 ? "RPT-1" : n === 20 ? "GWT-3" : n === 21 ? "iit4" : id]; });
const ncq = CQ.filter(([, src]) => byId(src)?.pass).length;
// v3.4 items
const V: Item[] = []; const G2 = "Prereg v3.4 (cortex + learned LTC)";
if (has("K1")) { const a = part("K1"); const ks: [string, string][] = [["K1a", "v3.1 cortex"], ["K1b", "no developmental waves"], ["K1c", "no STDP"], ["K1d", "no homeostasis (intrinsic + inhibitory)"], ["K1e", "E/I loops lesioned"]];
  for (const [id, c] of ks) V.push(ceil(item(id, G2, "immediate classification (post[0] acc, trials 100..159)", "K1", "", [compare(c, a.full, a[c])]), a.full, 1)); } else missing.push("K1");
if (has("K2")) { const a = part("K2"); V.push(ceil(item("K2", G2, "persistence: centroid probe 2 blank ticks after stimulus", "K2", "", [compare("NMDA-like current lesioned", a.full, a["NMDA-like current lesioned"])]), a.full, 1)); } else missing.push("K2");
for (const [k, n] of [["L1", "memory-guided choice (C2 metric)"], ["L2", "sleep effect (sleep − forced wake)"], ["L3", "level benefit (C8b metric)"], ["L4", "delayed recall (RPT-1)"], ["L5", "robustness to tau scale x0.5/x2"]]) { if (!has(k)) { missing.push(k); continue; } const a = part(k);
  for (const [arm, tag] of [["learned", "a"], ["handset", "b"]]) { const c = compare("fixed-tau LIF", a[arm], a.fixed); const it = item(`V3.4-${k}${tag}`, G2, `${n} — ${arm === "learned" ? "learned-gate LTC" : "hand-set LTC"} vs fixed`, k, "", [c]); if (c.d <= -0.8 && c.t <= -2.75) it.category = "LTC hurts"; V.push(it); } }
// v3.6 items: R-variants (degraded stimuli; originals stay on record above) and steering-API tolerance checks
const V6: Item[] = []; const G6 = "Prereg v3.6 (R-variants + steering API)";
for (const [id, name, key, ctrl] of [["GWT-3R", "global broadcast, degraded stimuli", "GWT3R", "broadcast lesioned"], ["ctm-R", "report agrees with action, degraded stimuli", "CTMR", "broadcast lesioned"], ["CQM08R", "continual retention, degraded stimuli", "C08R", "replay lesioned"]] as [string, string, string, string][]) {
  if (!has(key)) { missing.push(key); V6.push(stub(id, name, "not run")); continue; } const a = part(key); V6.push(ceil(item(id, G6, name, key, "", [compare(ctrl, a.full, a[ctrl])]), a.full, 1)); }
if (has("SNAP")) { const a = part("SNAP").identical; V6.push({ id: "SNAP", group: G6, name: "snapshot()/restore() into a different-seed organism reproduces the run (JSON round trip)", metric: "", mechanism: "", cmps: [], pass: a.every((x) => x === 1), category: `Tolerance test ${a.filter((x) => x === 1).length}/${a.length}` }); } else missing.push("SNAP");
if (has("NOISESIGN")) { const a = part("NOISESIGN"); const b6 = mean(a["v36 |P(+)-0.5|"]), b5 = mean(a["v35 |P(+)-0.5|"]); V6.push({ id: "NOISESIGN", group: G6, name: "decision-noise sign bias on a biased qubit state, |P(+)-0.5|", metric: "", mechanism: "", cmps: [compare("v3.5 raw bit (lower is better)", a["v36 |P(+)-0.5|"], a["v35 |P(+)-0.5|"], false)], pass: b6 < 0.05, category: `v3.6 ${b6.toFixed(3)} vs v3.5 ${b5.toFixed(3)} (tolerance 0.05)` }); } else missing.push("NOISESIGN");
if (has("LIGHT")) { const a = part("LIGHT")["melatonin at midnight, dome dark minus lit"]; V6.push({ id: "LIGHT", group: G6, name: "dome light input suppresses night melatonin", metric: "", mechanism: "", cmps: [compare("zero difference", a, a.map(() => 0))], pass: mean(a) > 0, category: "Steering check" }); } else missing.push("LIGHT");
// lab handoff R17 acceptance tests
if (has("INSGLC")) { const a = part("INSGLC"); V6.push(ceil(item("INSGLC", G6, "INS decodes blood glucose > median (balanced acc.; acceptance >= 0.75)", "INSGLC", "", ["visceral afferent cut", "labels shuffled"].map((c) => compare(c, a.full, a[c]))), a.full, 1)); const it = V6[V6.length - 1]; if (mean(a.full) < 0.75) { it.pass = false; it.note = "below 0.75 acceptance"; } } else missing.push("INSGLC");
if (has("RPTLATE")) { const a = part("RPTLATE"); const lf = mean(a["late:full"]), ef = mean(a["early:full"]); const red = (c: string): number => 1 - mean(a["late:" + c]) / lf, ech = (c: string): number => Math.abs(mean(a["early:" + c]) - ef) / Math.max(1e-9, Math.abs(ef));
  const ok = lf > 0 && ((red("CTX->THAL cut") >= 0.5 && ech("CTX->THAL cut") < 0.2) || (red("CTX->CTX cut") >= 0.5 && ech("CTX->CTX cut") < 0.2));
  V6.push({ id: "RPTLATE", group: G6, name: "late (11-60 tick) evoked CTX response carried by feedback (handoff acceptance)", metric: "", mechanism: "", cmps: ["CTX->THAL cut", "CTX->CTX cut", "slow NMDA lesioned"].map((c) => compare(c, a["late:full"], a["late:" + c])), pass: ok, category: `late ${lf.toExponential(2)}, early ${ef.toExponential(2)}; late reduction CTX->THAL ${red("CTX->THAL cut").toFixed(2)}, CTX->CTX ${red("CTX->CTX cut").toFixed(2)}; early change ${ech("CTX->THAL cut").toFixed(2)} / ${ech("CTX->CTX cut").toFixed(2)}` }); } else missing.push("RPTLATE");
// v3.7 items: R-variants with non-ceiling metrics (originals stay on record above)
const V7: Item[] = []; const G7 = "Prereg v3.7 (R-variants)";
if (has("K1R")) { const a = part("K1R"); for (const [id, c] of [["K1aR", "v3.1 cortex"], ["K1cR", "no STDP"]]) V7.push(ceil(item(id, G7, "immediate classification, degraded stimulus (K1 protocol)", "K1R", "", [compare(c, a.full, a[c])]), a.full, 1)); } else missing.push("K1R");
if (has("C03R")) { const a = part("C03R"); V7.push(ceil(item("CQM03R", G7, "ecological coupling |corr(food, next births)|, control: random birth counts", "C03R", "", [compare("births random in number", a.full, a["births random in number"])]), a.full, 1)); } else missing.push("C03R");
// v3.8a VIAB (prereg v3.8a §E): reads v38_parts/viab_eval.json written by viab_eval_v38.py
const V8: Item[] = []; const G8 = "Prereg v3.8 (viability)";
{ const f = path.join(DIR, "viab_eval.json"); if (fs.existsSync(f)) { const v = JSON.parse(fs.readFileSync(f, "utf8")); const a = v.a_steady, b = v.b_starve, c = v.c_refeed;
  V8.push({ id: "VIAB-a", group: G8, name: "steady state with ample food: fat/glycogen slopes days 7-12 not negative (CI) + intake ~= expenditure", metric: "", mechanism: "", cmps: [], pass: a.pass_, category: `fat slope ${a.fatSlope[0]} [${a.fatSlope[1]}, ${a.fatSlope[2]}]/d, glycogen ${a.glySlope[0]} [${a.glySlope[1]}, ${a.glySlope[2]}]/d, |imbalance| ${a.meanAbsImbalance}, deaths ${a.deaths}/${a.n}` });
  V8.push({ id: "VIAB-b", group: G8, name: "starvation: ordered stages (forage up, glycogen, ketosis, torpor) then death in reserve-scaled window", metric: "", mechanism: "", cmps: [], pass: b.pass_, category: `${b.nOK}/${b.n} seeds ordered and in window` });
  V8.push({ id: "VIAB-c", group: G8, name: "recovery when food restored at day 3", metric: "", mechanism: "", cmps: [], pass: c.pass_, category: `${c.nRecovered}/${c.n} recovered; life (censored 8 d) ${c.lifeRefeed} vs no-refeed ${c.lifeNoRefeed}, d ${c.d} t ${c.t}` });
} else missing.push("VIAB"); }
const fmt = (x: number): string => (Number.isFinite(x) ? x.toFixed(2) : String(x)); const lines: string[] = [];
for (const it of [...items, ...V, ...V6, ...V7, ...V8]) lines.push(`${it.pass ? "PASS" : "FAIL"} ${it.id} ${it.name} [${it.category}]${it.note ? " (" + it.note + ")" : ""}` + it.cmps.map((c) => `\n   vs ${c.control}: full ${c.full.toPrecision(4)} ctrl ${c.ctrl.toPrecision(4)} d ${fmt(c.d)} t ${fmt(c.t)}`).join(""));
lines.push(`ROLLUPS: Butlin ${nb}/14, frameworks ${nfw}/10, CQM ${ncq}/25; K items ${V.filter((x) => x.id.startsWith("K") && x.pass).length}/${V.filter((x) => x.id.startsWith("K")).length}; LTC learned-vs-fixed passes ${V.filter((x) => x.id.startsWith("V3.4-") && x.id.endsWith("a") && x.pass).length}/5, hand-set-vs-fixed ${V.filter((x) => x.id.startsWith("V3.4-") && x.id.endsWith("b") && x.pass).length}/5` + `; v3.6 items ${V6.filter((x) => x.pass).length}/${V6.length}; v3.7 items ${V7.filter((x) => x.pass).length}/${V7.length}; v3.8 items ${V8.filter((x) => x.pass).length}/${V8.length}` + (missing.length ? `; MISSING ${missing.join(",")}` : ""));
if (MODE === "test" && !process.env.NOWRITE) { fs.writeFileSync(path.join(R, "organism_v38.json"), JSON.stringify({ seeds: "1000..1015", rollups: { butlin: `${nb}/14`, frameworks: `${nfw}/10`, cqm: `${ncq}/25` }, items, v34: V, v36: V6, v37: V7, v38: V8, missing }, null, 1)); fs.writeFileSync(path.join(R, "organism_v38.txt"), lines.join("\n") + "\n"); }
console.log(lines.join("\n"));
