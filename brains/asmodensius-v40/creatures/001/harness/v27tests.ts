// FROZEN v2.7 tests (preregistrations/v2.7.md). Do not edit after first test-seed run.
import { mulberry, SEEDS, compare, item, Item, auroc } from "./harness";
import { maze, newModel, MN } from "./v26mech";
import { seekPref, stateOf, reproduce } from "./v27mech";
const fs = require("fs"), path = require("path");
export function v27Tests(dataDir: string, only?: string): Item[] { const want = (id: string) => !only || only === id; const P = "Prereg v2.7"; const out: Item[] = [];
  /* CAP-B retired 2026-10-31 (originality rule): see archive/history/cap-b/; historical v2.7 outcome kept in results */
  if (want("CAP-S")) { const goal = MN * MN - 1, DX = [1, -1, 0, 0], DY = [0, 0, 1, -1]; const mv = (c: number, d: number) => { const x = c % MN + DX[d], y = Math.floor(c / MN) + DY[d]; return x < 0 || y < 0 || x >= MN || y >= MN ? -1 : y * MN + x; };
    const run = (mode: string) => SEEDS.map((s) => { const W = maze(mulberry(s * 251 + 2751)); const truth = newModel(); W.forEach((w, c) => w.forEach((wall, d) => { truth[c][d] = wall ? 2 : 1; })); const pm = newModel(); W.forEach((w, c) => w.forEach((wall, d) => { if (wall) pm[c][d] = 2; }));
      // trained peer: shortest path using the true map
      const path: [number, number][] = []; { const M = truth.map((r) => r.slice()); let c = 0; const prev = new Array(MN * MN).fill(-1), pd = new Array(MN * MN).fill(-1), q = [0]; prev[0] = 0; while (q.length) { const u = q.shift()!; for (let d = 0; d < 4; d++) { const n = mv(u, d); if (n >= 0 && M[u][d] === 1 && prev[n] < 0) { prev[n] = u; pd[n] = d; q.push(n); } } } const st: [number, number][] = []; c = goal; while (c !== 0) { st.push([prev[c], pd[c]]); c = prev[c]; } path.push(...st.reverse()); }
      const M = newModel(); const see = (c: number, d: number) => { const n = mv(c, d); M[c][d] = 1; M[n][d ^ 1] = 1; };
      if (mode === "trained") path.forEach(([c, d]) => see(c, d)); if (mode === "random") { const r = mulberry(s * 251 + 2752); let c = 0, k = 0; while (k < path.length) { const d = Math.floor(r() * 4), n = mv(c, d); if (n < 0) continue; k++; if (!W[c][d]) { see(c, d); c = n; } } }
      return -seekPref(W, M, goal, 2000); });
    const F = run("trained"); out.push(item("CAP-S", P, "Social learning by observing a second creature (class S; roadmap 13)", "−observer steps to goal", "observer adds the peer's observed transitions to its world model, then plans", [compare("random peer (same number of moves)", F, run("random")), compare("no peer", F, run("none"))])); }
  if (want("CAP-R")) { const run = (mode: string) => SEEDS.map((s) => { const p = stateOf(s); const c = mode === "rand" ? stateOf(s + 7777) : reproduce(p, mulberry(s * 263 + 2711), mode === "full"); let k = 0; for (let i = 0; i < p.length; i++) if (Object.is(p[i], c[i])) k++; return k / p.length; });
    const F = run("full"); const it = item("CAP-R", P, "Self-reproduction of the full creature state (class R; roadmap 4)", "fraction of state entries copied bit-exactly", "self-description (developed weights + organ state), triple redundancy + majority-vote repair", [compare("random-init child", F, run("rand")), compare("single-copy description (no repair)", F, run("norep"))]);
    const m = F.reduce((a, b) => a + b, 0) / 16; it.note = `mean fidelity ${m.toFixed(4)}`; if (m < 0.99) it.pass = false; out.push(it); }
  /* CAP-C retired 2026-10-31 (originality rule): see archive/history/cap-c/; historical v2.7 outcome kept in results */
  return out; }
