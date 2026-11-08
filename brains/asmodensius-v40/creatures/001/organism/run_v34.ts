// usage: node run_v34.js <tune|test> <KEY>  -> $V34OUT/<mode>_<KEY>.json. KEY is a v3.1 suite key (run on the v3.4 organism) or a v3.4 key (K1, K2, L1..L5).
import { TESTS, LEDGER } from "./tests_v31";
import { TESTS34 } from "./tests_v34";
const fs = require("fs"), path = require("path"); const mode = process.argv[2], key = process.argv[3];
const seeds = Array.from({ length: 16 }, (_, k) => (mode === "tune" ? 2000 : 1000) + k); const t0 = Date.now(); const f = TESTS34[key] ?? TESTS[key]; const arms = f(seeds);
const dir = path.resolve(__dirname, process.env.V34OUT || "/tmp/w/v34_parts"); fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${mode}_${key}.json`), JSON.stringify({ key, mode, seeds, arms, ledgerMax: LEDGER.length ? Math.max(...LEDGER.map((x) => x.err)) : 0, runs: LEDGER.length, seconds: (Date.now() - t0) / 1000 }));
const m = (a: number[]): string => (a.reduce((s, x) => s + x, 0) / a.length).toPrecision(4); console.log(key, Object.entries(arms).map(([k, v]) => `${k}=${m(v as number[])}`).join("  "), ((Date.now() - t0) / 1000).toFixed(0) + "s");
