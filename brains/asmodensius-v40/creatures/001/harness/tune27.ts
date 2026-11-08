// Run v2.7 on disjoint tuning seeds 2000..2015 only (sanity / timing; prereg forbids tuning CAP-C).
import { SEEDS } from "./harness"; import { v27Tests } from "./v27tests"; import { setUNK } from "./v27mech";
for (let k = 0; k < 16; k++) SEEDS[k] = 2000 + k; const t0 = Date.now();
for (const u of JSON.parse(process.argv[3] || "[3]")) { setUNK(u); console.log("UNK", u); for (const it of v27Tests(require("path").join(process.cwd(), "../data"), process.argv[2])) console.log(it.id, it.pass, it.note || "", it.cmps.map((c: any) => `${c.full.toFixed(3)}/${c.ctrl.toFixed(3)} d${c.d.toFixed(2)} t${c.t.toFixed(2)}`).join(" | ")); }
console.log("ms", Date.now() - t0);
