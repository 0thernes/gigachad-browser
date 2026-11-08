import { v24Tests } from "./v24tests";
import { v25Tests } from "./v25tests";
import { v26Tests } from "./v26tests";
import { v27Tests } from "./v27tests";
import { runAll, runV2, v21Tests, v22Tests, setGpuRecord } from "./harness";
const fs = require("fs"); const RES = require("path").join(__dirname0(), "../results"); if (fs.existsSync(RES + "/gpu_record.json")) setGpuRecord(JSON.parse(fs.readFileSync(RES + "/gpu_record.json", "utf8"))); else throw new Error("results/gpu_record.json missing");
function __dirname0(): string { return process.env.HARNESS_DIR || process.cwd(); }
const pr = (res: any[]) => { for (const it of res) { console.log(`${it.pass ? "PASS" : (it.category === "Implementation identified" ? "IMPL" : "FAIL")} ${it.id.padEnd(16)} ${it.name.slice(0, 50)}`); for (const c of it.cmps) console.log(`     ${c.pass ? "+" : "-"} ${c.control.slice(0, 60).padEnd(60)} full=${c.full.toFixed(3)} ctrl=${c.ctrl.toFixed(3)} d=${c.d.toFixed(2)} t=${c.t.toFixed(2)}`); } };
const t0 = Date.now(); const v1 = runAll(); console.log("=== PREREGISTRATION v1 ==="); pr(v1); const v2 = runV2(); console.log("=== PREREGISTRATION v2 ==="); pr(v2); const v21 = v21Tests(); console.log("=== PREREGISTRATION v2.1 ==="); pr(v21); const v22 = v22Tests(); console.log("=== PREREGISTRATION v2.2 ==="); pr(v22); const v24 = v24Tests(); console.log("=== PREREGISTRATION v2.4 ==="); pr(v24); const v25 = v25Tests(); console.log("=== PREREGISTRATION v2.5 (CQM-21R, mechanism per addendum v2.5a) ==="); pr(v25); const v26 = v26Tests(); console.log("=== PREREGISTRATION v2.6 (RM-10R, RM-64, RM-83) ==="); pr(v26); const v27 = v27Tests(require("path").join(__dirname0(), "../data")); console.log("=== PREREGISTRATION v2.7 (+v2.7a) CAP-B/S/R/C ==="); pr(v27);
console.log("ms", Date.now() - t0); require("fs").writeFileSync(RES + "/results.json", JSON.stringify({ v1, v2, v21, v22, v24, v25, v26, v27 }, null, 1));
