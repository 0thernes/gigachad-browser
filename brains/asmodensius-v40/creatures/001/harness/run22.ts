import { v22Tests } from "./harness";
const res = v22Tests(); for (const it of res) { console.log(`${it.pass ? "PASS" : "FAIL"} ${it.id.padEnd(8)} ${it.name}${it.note ? "  [" + it.note + "]" : ""}`); for (const c of it.cmps) console.log(`     ${c.pass ? "+" : "-"} ${c.control.padEnd(44)} full=${c.full.toFixed(3)} ctrl=${c.ctrl.toFixed(3)} d=${c.d.toFixed(2)} t=${c.t.toFixed(2)}`); }
require("fs").writeFileSync("results_v22.json", JSON.stringify(res, null, 1));
