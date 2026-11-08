// FROZEN v2.6 tests (preregistrations/v2.6.md). Do not edit after first test-seed run.
import { mulberry, SEEDS, compare, item, Item } from "./harness";
import { rivalry, maze, newModel, explore, seek, MN } from "./v26mech";
export function v26Tests(): Item[] { const P = "Prereg v2.6"; const out: Item[] = [];
  { const sch = (t: number, phi: number) => 0.02 + 0.01 * Math.sin(6.283185307 * t / 37 + phi); const T = 10000;
    const run = (mode: string) => SEEDS.map((s) => { const r = mulberry(s * 211 + 2603); const phi = r() * 6.283185307; const E = [1]; for (let t = 0; t < T; t++) E.push(E[t] - sch(t, phi) + (r() < 0.05 ? 0.3 : 0));
      let se = 0, n = 0, jumps = 0; for (let k = 1; k <= 49; k++) if (E[k] - (E[k - 1] - sch(k - 1, phi)) > 0.15) jumps++;
      for (let t = 50; t < T - 20; t++) { if (E[t] - (E[t - 1] - sch(t - 1, phi)) > 0.15) jumps++; const rate = jumps / t; let fc = E[t];
        if (mode === "full") { for (let k = 0; k < 20; k++) fc -= sch(t + k, phi); fc += 20 * 0.3 * rate; } else if (mode === "noeff") fc += -20 * 0.02 + 20 * 0.3 * rate;
        se += (fc - E[t + 20]) ** 2; n++; } return -se / n; });
    const F = run("full"); out.push(item("RM-10R", P, "Interoceptive energy forecast, long-horizon evaluation (roadmap 10; not RM-10)", "−MSE of 20-step energy forecast (T=10000)", "efference copy of the activity schedule + online food-rate estimate", [compare("persistence forecast", F, run("pers")), compare("no efference copy (mean drain)", F, run("noeff"))])); }
  { const durs = SEEDS.map((s) => rivalry(mulberry(s * 241 + 2641), 40000)); const k = (D: number[]) => { const m = D.reduce((a, b) => a + b, 0) / D.length, v = D.reduce((a, b) => a + (b - m) ** 2, 0) / (D.length - 1); return m * m / v; };
    const F = durs.map(k), C = SEEDS.map((s, i) => { const r = mulberry(s * 241 + 2642), D = durs[i], m = D.reduce((a, b) => a + b, 0) / D.length, p = 1 / m; return k(D.map(() => { let n = 1; while (r() > p) n++; return n; })); });
    const it = item("RM-64", P, "Perceptual bistability (roadmap 64)", "gamma shape k of dominance durations", "mutual inhibition + slow adaptation + noise", [compare("memoryless (Poisson) switching, matched mean", F, C)]);
    const few = durs.filter((D) => D.length < 20).length; it.note = `seeds with <20 durations: ${few}; mean durations/seed ${(durs.reduce((a, D) => a + D.length, 0) / 16).toFixed(0)}`; if (few) it.pass = false; out.push(it); }
  { const goal = MN * MN - 1; const run = (mode: string) => SEEDS.map((s) => { const W = maze(mulberry(s * 251 + 2651)), M = newModel();
      if (mode === "full") explore(W, M, mulberry(s * 251 + 2652), 1500); if (mode === "wrong") explore(maze(mulberry((s + 500) * 251 + 2651)), M, mulberry(s * 251 + 2652), 1500);
      return -seek(W, M, goal, 2000); });
    const F = run("full"); out.push(item("RM-83", P, "Latent learning (roadmap 83)", "−steps from start to goal after one rewarded placement", "world model learned during unrewarded exploration + BFS planning", [compare("naive (no exploration)", F, run("naive")), compare("wrong map (explored a different maze)", F, run("wrong"))])); }
  return out; }
