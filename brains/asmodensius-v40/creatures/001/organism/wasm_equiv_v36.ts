// v3.6 WASM equivalence check (prereg v3.6 §C3): Moonlab statevector vs the TS Q3 circuit, Eshkol flip-flop vs the TS rule, and whole-organism
// determinism with both backends plugged in. Writes ../results/wasm_equiv_v36.json. Usage: node wasm_equiv_v36.js [wasmDir]
import { Organism, Q3 } from "./organism";
import { moonlabBackend, eshkolFlipFlop, loadMoonlab, loadEshkol } from "./backends";
const fs = require("fs"), path = require("path");
(async () => { const W = process.argv[2] || path.resolve(process.cwd(), "../wasm"); const ml = await loadMoonlab(W), es = await loadEshkol(W); const b = moonlabBackend(ml), rule = eshkolFlipFlop(es);
  let r = 1; const rnd = (): number => { r = (r * 16807) % 2147483647; return r / 2147483647; }; const q = new Q3(); let maxDp = 0;
  for (let i = 0; i < 5000; i++) { const th = [Math.PI * rnd(), Math.PI * rnd(), Math.PI * rnd()]; q.prepare(th); b.prepare(th); const a = q.probs(), c = b.probs(); for (let k = 0; k < 8; k++) maxDp = Math.max(maxDp, Math.abs(a[k] - c[k])); }
  let bad = 0; for (let i = 0; i < 2000; i++) { const a = rnd() < 0.5, d = rnd(), t = rnd(), f = rnd() < 0.1; if (rule(a, d, t, f) !== (a ? !(d < 0.2 || f) : d > t && !f)) bad++; }
  const st = (o: Organism): string => { const s: any = o.snapshot(); s.q.ext = null; return JSON.stringify(s); }; const runs: { seed: number; identical: boolean }[] = [];
  for (const seed of [1000, 1001, 1002, 1003]) { const A = new Organism({ seed, noise: "quantum" }), B = new Organism({ seed, noise: "quantum" }); B.setQuantumBackend(b); B.setRuleEngine(rule); for (let i = 0; i < 2880; i++) { A.step(); B.step(); } runs.push({ seed, identical: st(A) === st(B) }); }
  const out = { moonlabMaxAbsProbDiff: maxDp, moonlabCircuits: 5000, eshkolRuleMismatches: bad, eshkolCases: 2000, twoDayFullStateIdentical: runs, pass: maxDp < 1e-12 && bad === 0 && runs.every((x) => x.identical) };
  fs.writeFileSync(path.resolve(process.cwd(), "../results/wasm_equiv_v36.json"), JSON.stringify(out, null, 1)); console.log(JSON.stringify(out)); })();
