// Tuning on disjoint seeds 2000..2015 only.
import { SEEDS } from "./harness"; import { setBI } from "./v26mech"; import { v26Tests } from "./v26tests";
for (let k = 0; k < 16; k++) SEEDS[k] = 2000 + k;
for (const p of JSON.parse(process.argv[2] || "[{}]")) { setBI(p); for (const it of v26Tests()) console.log(JSON.stringify(p), it.id, it.pass, it.note || "", it.cmps.map((c: any) => `${c.full.toFixed(3)}/${c.ctrl.toFixed(3)} d${c.d.toFixed(2)} t${c.t.toFixed(2)}`).join(" | ")); }
