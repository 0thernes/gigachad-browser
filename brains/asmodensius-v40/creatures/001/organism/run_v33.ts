// usage: node run_v31.js <tune|test> <TESTKEY>  -> writes ../results/v31_parts/<mode>_<KEY>.json (per-seed metrics per arm)
import { TESTS33 as TESTS } from "./tests_v33";
const fs = require("fs"), path = require("path"); const mode = process.argv[2], key = process.argv[3];
const seeds = Array.from({ length: 16 }, (_, k) => (mode === "tune" ? 2000 : 1000) + k); const t0 = Date.now(); const arms = TESTS[key](seeds);
const dir = path.resolve(__dirname, process.env.V33OUT || "/tmp/w/v33_parts"); fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${mode}_${key}.json`), JSON.stringify({ key, mode, seeds, arms, ledgerMax: 0, runs: 0, seconds: (Date.now() - t0) / 1000 }));
const m = (a: number[]): string => (a.reduce((s, x) => s + x, 0) / a.length).toPrecision(4); console.log(key, Object.entries(arms).map(([k, v]) => `${k}=${m(v)}`).join("  "), ((Date.now() - t0) / 1000).toFixed(0) + "s");
