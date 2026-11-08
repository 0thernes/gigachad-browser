// Held-out robustness check for AST-1 (not a preregistered test; diagnostic only). Seed bases other than the frozen 1000.
import { attnRun, mulberry, compare } from "./harness";
const bases = (process.argv[2] || "2000,3000,4000,5000,6000,7000,8000,9000").split(",").map(Number);
let worst = Infinity;
for (const b of bases) { const S = Array.from({ length: 16 }, (_, k) => b + k); const rs = (m: string) => S.map((s) => attnRun(mulberry(s * 7919 + 11), m, false));
  const f = rs("full"), a = compare("abl", f, rs("noschema")), c = compare("rand", f, rs("randschema")); worst = Math.min(worst, a.d, c.d);
  console.log(`base ${b}: vs ablation d ${a.d.toFixed(2)} t ${a.t.toFixed(2)} | vs random d ${c.d.toFixed(2)} t ${c.t.toFixed(2)} ${a.pass && c.pass ? "PASS" : "FAIL"}  minFull ${Math.min(...f).toFixed(2)}`); }
console.log("worst d", worst.toFixed(2));
