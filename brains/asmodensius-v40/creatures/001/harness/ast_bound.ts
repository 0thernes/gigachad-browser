// AST-1R bound (see prereg v2.7): clairvoyant constrained controller on seed 3012 drift path. Output: greedy perfect 13.413, clairvoyant 6.127.
import { mulberry, gauss } from "./harness";
const r = mulberry(3012 * 7919 + 11); let d = 0; const D: number[] = []; for (let t = 0; t < 300; t++) { gauss(r); d = 0.98 * d + gauss(r) * 0.08; D.push(d); }
// greedy (deadbeat with perfect info)
let a = 0, e = 0; for (const x of D) { const u = Math.max(-1, Math.min(1, -(a + x))); a = a + u + x; e += a * a; } console.log("greedy perfect", (e / 300).toFixed(3));
// clairvoyant QP projected gradient
const u = new Array(300).fill(0); const cost = () => { let a = 0, e = 0; for (let t = 0; t < 300; t++) { a += u[t] + D[t]; e += a * a; } return e / 300; };
for (let it = 0; it < 200000; it++) { const A: number[] = []; let s = 0; for (let t = 0; t < 300; t++) { s += u[t] + D[t]; A.push(s); } let g = 0; for (let t = 299; t >= 0; t--) { g += 2 * A[t]; u[t] = Math.max(-1, Math.min(1, u[t] - 2e-6 * g)); } }
console.log("clairvoyant", cost().toFixed(3));
