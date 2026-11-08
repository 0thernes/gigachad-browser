// v2.3 LIVE scoring, exactly per preregistrations/v2.3.md. Reads results/live/<seed>_<ablate>.json (ablate "none" = full).
// Frame f (1-based, as in the app's frame counter) is index f-1 of the R/ar/th arrays.
import { SEEDS, compare, item, Item, Cmp } from "./harness";
const fs = require("fs"), path = require("path"); const DIR = path.join(process.env.HARNESS_DIR || process.cwd(), "../results/live");
const load = (s: number, a: string): any => { const p = path.join(DIR, `${s}_${a}.json`); if (!fs.existsSync(p)) return null; try { const j = JSON.parse(fs.readFileSync(p, "utf8")); return j && Array.isArray(j.R) && j.R.length >= 480 ? j : null; } catch { return null; } };
const mean = (a: number[]) => a.reduce((p, x) => p + x, 0) / a.length;
const fk = Array.from({ length: 20 }, (_, k) => 40 + 4 * k);
const D = (j: any, f: number) => j.R[f + 3 - 1] - j.R[f - 1 - 1];
const hab80 = (j: any) => mean(fk.slice(0, 3).map((f) => D(j, f))) - mean(fk.slice(17, 20).map((f) => D(j, f)));
const spec81 = (j: any) => D(j, 124) - mean(fk.slice(17, 20).map((f) => D(j, f)));
const plv28 = (j: any) => { let c = 0, s = 0, n = 0; for (let f = 240; f <= 480; f++) { const p = j.th[f - 1] - 2 * Math.PI * f / 24; c += Math.cos(p); s += Math.sin(p); n++; } return Math.hypot(c / n, s / n); };
const corr28B = (j: any) => { const x: number[] = [], y: number[] = []; for (let f = 130; f <= 480; f++) { x.push(j.ar[f - 1]); y.push(j.R[f - 1]); } const mx = mean(x), my = mean(y); let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; } return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0; };
const tamper47 = (j: any) => j.tamper;
const T: [string, string, (j: any) => number, string][] = [["LIVE-80", "Habituation in the body", hab80, "hab"], ["LIVE-81", "Stimulus-specific habituation", spec81, "hab"], ["LIVE-28", "Circadian entrainment (PLV)", plv28, "circ"], ["LIVE-28B", "Circadian drives the body", corr28B, "circbody"], ["LIVE-47", "Tamper-evident lineage", tamper47, "chain"]];
export function v23Score(): Item[] { return T.map(([id, name, f, abl]) => { const F = SEEDS.map((s) => load(s, "none")), C = SEEDS.map((s) => load(s, abl));
  if (F.some((x) => !x) || C.some((x) => !x)) { const n = F.filter(Boolean).length + C.filter(Boolean).length; return { ...item(id, "Prereg v2.3", name, "live creature", "rendered creature (index.html) in headless Chrome", [{ control: `NOT RUN (${n}/32 runs present)`, full: 0, ctrl: 0, d: 0, t: 0, pass: false } as Cmp]), pass: false, note: "NOT RUN" }; }
  return item(id, "Prereg v2.3", name, "live creature", "rendered creature (index.html) in headless Chrome", [compare(`ablate=${abl}`, F.map(f), C.map(f))]); }); }
if (require.main === module) { const R = v23Score(); for (const it of R) { console.log(`${it.note === "NOT RUN" ? "NOT RUN" : it.pass ? "PASS" : "FAIL"} ${it.id}`); for (const c of it.cmps) console.log(`   ${c.control} full=${c.full.toFixed(4)} ctrl=${c.ctrl.toFixed(4)} d=${c.d.toFixed(2)} t=${c.t.toFixed(2)}`); }
  fs.writeFileSync(path.join(DIR, "../v23_scores.json"), JSON.stringify(R, null, 1)); }
