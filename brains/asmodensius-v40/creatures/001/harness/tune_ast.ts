// Mechanism tuning for AST on tuning-only seed bases 10000..17000 (disjoint from v1 frozen 1000.. and AST-1R test bases 2000..9000).
import { attnRun, mulberry, compare, setAST, setASTU } from "./harness";
const cfg = JSON.parse(process.argv[2] || "[[0.9,3,0.001]]");
for (const [m, g, a, u = 1] of cfg) { setAST(m, g, a); setASTU(u); let worst = Infinity, tot = 0;
  for (let B = 10000; B <= 17000; B += 1000) { const S = Array.from({ length: 16 }, (_, k) => B + k); const f = (md: string) => S.map((s) => -Math.log10(-attnRun(mulberry(s * 7919 + 11), md, false) + 1e-6)); const F = f("full"); const d = Math.min(compare("", F, f("noschema")).d, compare("", F, f("randschema")).d); worst = Math.min(worst, d); tot += d; }
  console.log(m, g, a, u, "worst d", worst.toFixed(2), "mean d", (tot / 8).toFixed(2)); }
