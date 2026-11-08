import { v30, LEDGER } from "./tests"; import { SEEDS } from "../harness/harness";
const fs = require("fs"), path = require("path"); const tune = process.argv[2] === "tune"; const only = process.argv[3];
const seeds = tune ? Array.from({ length: 16 }, (_, k) => 2000 + k) : SEEDS; const t0 = Date.now(); const items = v30(seeds, only);
for (const it of items) { console.log(`${it.pass ? "PASS" : "FAIL"} ${it.id} ${it.name}${it.note ? " [" + it.note + "]" : ""}`); for (const c of it.cmps) console.log(`   vs ${c.control}: full ${c.full.toPrecision(4)} ctrl ${c.ctrl.toPrecision(4)} d ${Number.isFinite(c.d) ? c.d.toFixed(2) : c.d} t ${Number.isFinite(c.t) ? c.t.toFixed(2) : c.t}`); }
console.log("seconds", (Date.now() - t0) / 1000);
if (!tune && !only) fs.writeFileSync(path.resolve(process.cwd(), "../results/organism_v30.json"), JSON.stringify({ seeds, items, ledgerMax: Math.max(...LEDGER.map((x) => x.err)), runs: LEDGER.length }, null, 1));
