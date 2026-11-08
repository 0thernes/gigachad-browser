// usage: node run_v37.js <tune|test> <KEY>  -> $V37OUT/<mode>_<KEY>.json. KEY is a v3.7 or v3.6 R-variant key, a v3.4 key, or a v3.1 suite key (default Mind v37).
import { TESTS, LEDGER } from "./tests_v31";
import { TESTS34 } from "./tests_v34";
import { TESTS36 } from "./tests_v36";
import { TESTS37 } from "./tests_v37";
const fs = require("fs"), path = require("path"); const mode = process.argv[2], key = process.argv[3];
const seeds = Array.from({ length: 16 }, (_, k) => (process.env.SEEDBASE ? +process.env.SEEDBASE : mode === "tune" ? 2000 : 1000) + k); if (process.env.V37TUNE) { const { M37 } = require("./organism"); const j = JSON.parse(process.env.V37TUNE); for (const k of Object.keys(j)) if (M37[k] !== j[k]) throw new Error("V37TUNE not applied: " + k); console.error("M37", JSON.stringify(M37)); } const t0 = Date.now(); const f = TESTS37[key] ?? TESTS36[key] ?? TESTS34[key] ?? TESTS[key]; const arms = f(seeds);
const dir = path.resolve(__dirname, process.env.V37OUT || "/tmp/w/v37_parts"); fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${mode}_${key}.json`), JSON.stringify({ key, mode, seeds, arms, ledgerMax: LEDGER.length ? Math.max(...LEDGER.map((x) => x.err)) : 0, runs: LEDGER.length, seconds: (Date.now() - t0) / 1000 }));
const m = (a: number[]): string => (a.reduce((s, x) => s + x, 0) / a.length).toPrecision(4); console.log(key, Object.entries(arms).map(([k, v]) => `${k}=${m(v as number[])}`).join("  "), ((Date.now() - t0) / 1000).toFixed(0) + "s");
