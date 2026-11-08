// v4.0 R-tests (preregistrations/v4.0.md, DRAFT). New tests; the originals stay on record unchanged.
import { Organism, Opts } from "./organism";
import { OptOut, MarginConf } from "./fp/hot3";
import { Lin, MW, R0 } from "./organism";
import { warm as warm36, blank as blank36, pretrain as pre36, noisy as noisy36 } from "./tests_v36";
import { warm as warm31, show as show31, ctx as ctx31, am as am31 } from "./tests_v31";
type M = Record<string, number[]>;
const D = 1440; const mk = (seed: number, o: Partial<Opts> = {}): Organism => new Organism({ seed, ...o } as Opts);
const wr = (seed: number) => { let a = seed * 7349 + 101; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
/** AINF-R (activeInference, revised; NEW test, AINF stays reported). Hidden volatile sites: every site independently flips between rich (0.8) and poor (0.1)
 *  with hazard 1/H per tick; the state is observable only by visiting. A world RNG separate from the creature's makes the world identical across arms (matched).
 *  Stale beliefs cost food, so checking uncertain sites pays. Metric: rewards per forage attempt over 2 days after warm-up. Control: epistemic (uncertainty) term lesioned. */
function ainfR(S: number[], H = 360): M { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = mk(s, o); const r = wr(s); const n = g.pTrue.length; const st = Array.from({ length: n }, () => (r() < 0.5 ? 1 : 0));
    const set = () => { for (let k = 0; k < n; k++) g.pTrue[k] = st[k] ? 0.8 : 0.1; }; set(); while (g.t < 480) { g.step(); set(); } const r0 = g.rewards, f0 = g.foraged;
    while (g.t < 480 + 2 * D) { for (let k = 0; k < n; k++) if (r() < 1 / H) st[k] ^= 1; set(); g.step(); } return (g.rewards - r0) / Math.max(1, g.foraged - f0); });
  return { full: f({}), "epistemic term lesioned": f({ efeLesion: true }) }; }
/** AINF-R2 design (chosen): ONE hidden rich site (0.8; all others 0.05) that relocates to a uniformly random other site with hazard 1/H per tick.
 *  After a relocation, value alone points nowhere (every other site was last seen poor); only knowledge of WHICH sites are least recently checked helps. */
function ainfR2(S: number[], H = 240): M { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = mk(s, o); const r = wr(s); const n = g.pTrue.length; let rich = Math.floor(r() * n);
    const set = () => { for (let k = 0; k < n; k++) g.pTrue[k] = k === rich ? 0.8 : 0.05; }; set(); while (g.t < 480) { g.step(); set(); } const r0 = g.rewards, f0 = g.foraged;
    while (g.t < 480 + 2 * D) { if (r() < 1 / H) rich = (rich + 1 + Math.floor(r() * (n - 1))) % n; set(); g.step(); } return (g.rewards - r0) / Math.max(1, g.foraged - f0); });
  return { full: f({}), "epistemic term lesioned": f({ efeLesion: true }) }; }
/** AINF-R3 (chosen design). Phase 1 (warm-up to 08:00 day 1): only the creature's usual half of the sites is open; they pay a steady 0.35.
 *  Phase 2 (2 days): the other half opens. Each new site has a HIDDEN state, rich (0.8) or poor (0.05), drawn 50/50 and flipping with hazard 1/720 per tick;
 *  it can only be learned by visiting. Old sites keep paying 0.35. So information-seeking (sampling the new, uncertain sites and re-checking them) pays,
 *  and a stale belief about a new site costs food. World draws come from a separate world RNG, identical across arms (matched).
 *  Metric: rewards per forage attempt in phase 2. Control: epistemic (uncertainty) term lesioned. Same noise, same value learning. */
function ainfR3(S: number[], H = 720): M { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = mk(s, o); const r = wr(s); const n = g.pTrue.length; const old = Array.from(g.access as Uint8Array);
    for (let k = 0; k < n; k++) if (old[k]) g.pTrue[k] = 0.35; while (g.t < D + 480) g.step(); const st = Array.from({ length: n }, () => (r() < 0.5 ? 1 : 0));
    for (let k = 0; k < n; k++) g.access[k] = 1; const set = () => { for (let k = 0; k < n; k++) g.pTrue[k] = old[k] ? 0.35 : st[k] ? 0.8 : 0.05; }; set(); const r0 = g.rewards, f0 = g.foraged;
    while (g.t < 3 * D + 480) { for (let k = 0; k < n; k++) if (!old[k] && r() < 1 / H) st[k] ^= 1; set(); g.step(); } return (g.rewards - r0) / Math.max(1, g.foraged - f0); });
  return { full: f({}), "epistemic term lesioned": f({ efeLesion: true }) }; }

/** AINF-R4 (design iteration of R3 on dev seeds, disclosed): same layout, but the known old sites pay 0.5 and each new site is rich (0.85) with p = 0.3,
 *  else poor (0.05), so a new site's EXPECTED value (~0.3) is below the known option: a greedy forager has no pragmatic reason to sample it, and only
 *  information-seeking finds the rich ones. Hidden states flip with hazard 1/H (H = 2880, ~once per 2 days) so learned knowledge stays useful for a while
 *  but goes stale. World RNG separate and identical across arms. Metric: rewards per forage over the 2-day phase 2. Control: epistemic term lesioned. */
function ainfR4(S: number[], H = 2880, pOld = 0.5): M { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = mk(s, o); const r = wr(s); const n = g.pTrue.length; const old = Array.from(g.access as Uint8Array);
    for (let k = 0; k < n; k++) if (old[k]) g.pTrue[k] = pOld; while (g.t < D + 480) g.step(); const st = Array.from({ length: n }, () => (r() < 0.3 ? 1 : 0));
    for (let k = 0; k < n; k++) g.access[k] = 1; const set = () => { for (let k = 0; k < n; k++) g.pTrue[k] = old[k] ? pOld : st[k] ? 0.85 : 0.05; }; set(); const r0 = g.rewards, f0 = g.foraged;
    while (g.t < 3 * D + 480) { for (let k = 0; k < n; k++) if (!old[k] && r() < 1 / H) st[k] = r() < 0.3 ? 1 : 0; set(); g.step(); } return (g.rewards - r0) / Math.max(1, g.foraged - f0); });
  return { full: f({}), "epistemic term lesioned": f({ efeLesion: true }) }; }
/** Diagnostic for AINFR4 (not a test): per arm, fraction of phase-2 forages on currently-rich new sites ("exploit"), and on any new site ("explore+exploit"). */
function ainfR4diag(S: number[], H = 2880, pOld = 0.5): M { const out: M = {}; for (const [nm, o] of [["full", {}], ["lesion", { efeLesion: true }]] as [string, Partial<Opts>][]) { const a: number[] = [], b: number[] = [], c: number[] = [];
    for (const s of S) { const g: any = mk(s, o); const r = wr(s); const n = g.pTrue.length; const old = Array.from(g.access as Uint8Array);
      for (let k = 0; k < n; k++) if (old[k]) g.pTrue[k] = pOld; while (g.t < D + 480) g.step(); const st = Array.from({ length: n }, () => (r() < 0.3 ? 1 : 0));
      for (let k = 0; k < n; k++) g.access[k] = 1; const set = () => { for (let k = 0; k < n; k++) g.pTrue[k] = old[k] ? pOld : st[k] ? 0.85 : 0.05; }; set(); let nr = 0, nn = 0, nf = 0, known = 0, kn = 0;
      while (g.t < 3 * D + 480) { for (let k = 0; k < n; k++) if (!old[k] && r() < 1 / H) st[k] = r() < 0.3 ? 1 : 0; set(); const f0 = g.foraged; g.step(); if (g.foraged > f0) { const k = g.choices[g.choices.length - 1]; nf++; if (!old[k]) { nn++; if (st[k]) nr++; }
          /* belief quality: does the creature's value estimate rank a rich new site above the old ones? */ let bestRich = -1, bestV = -1e9; for (let j = 0; j < n; j++) { const v = g.valueEst(j); if (v > bestV) { bestV = v; bestRich = !old[j] && st[j] ? 1 : 0; } } known += bestRich; kn++; } }
      a.push(nr / Math.max(1, nf)); b.push(nn / Math.max(1, nf)); c.push(known / Math.max(1, kn)); }
    out[nm + ":onRich"] = a; out[nm + ":onNew"] = b; out[nm + ":argmaxValueIsRich"] = c; } return out; }
const at = (g: Organism, t: number): void => { while (g.t < t) g.step(); };
const show = (g: Organism, x: number[]): void => { for (let i = 0; i < 16; i++) g.sens[i] = Math.max(0, x[i]); };
const blank = (g: Organism): void => { g.sens.fill(0); g.step(); };
/** N09 thought-curvature metacognition (NOVEL-100 N09). HOT-3-style opt-out task (4 cue maps, noisy cues, safe opt-out 0.3 vs 1/0 gamble).
 *  The creature keeps a running accuracy table indexed by its own confidence bin; arm "curv" also splits the table by whether its
 *  cortical trajectory curvature (v40mods Curvature.kappa, z > 0.5) is high on that trial. Controls: "blind" (confidence only, = HOT-3 opt-out)
 *  and "shuf" (same 2-D table, but the curvature flag is drawn from a random earlier trial of the same run). Metric: mean reward, trials 160-259.
 *  Descriptive (logged, not graded here): P(confidence drops next trial | curvature peak) vs | no peak. */
function n09(S: number[]): M { const f = (mode: "curv" | "blind" | "shuf") => S.map((s) => { const g: any = mk(s); at(g, 480); const r = wr(s);
    for (let k = 0; k < 120; k++) { const c = [0, 1, 2, 3].map(() => Math.floor(r() * 4)); const x = new Array(16).fill(0); c.forEach((cc, m) => (x[m * 4 + cc] = 1)); show(g, x); g.step(); c.forEach((cc, m) => g.mind.teach(m, cc)); blank(g); }
    const pc = new Array(20).fill(0.5); const flags: number[] = []; let R = 0, n = 0;
    for (let t = 0; t < 260; t++) { const m = Math.floor(r() * 4), c = Math.floor(r() * 4); const x = new Array(16).fill(0); x[m * 4 + c] = 0.5 + 0.7 * r(); for (let i = 0; i < 16; i++) x[i] += 0.3 * Math.abs(gq(r)); show(g, x); g.step();
      const okk = g.mind.action === c; const b = Math.min(9, Math.floor(g.mind.conf * 10)); const cv = g.curv; const hi = (cv.kappa - cv.kMean) / Math.max(1e-6, cv.kSD) > 0.5 ? 1 : 0; flags.push(hi);
      const fl = mode === "curv" ? hi : mode === "shuf" ? flags[Math.floor(r() * flags.length)] : 0; const idx = b + 10 * fl;
      const out = pc[idx] < 0.3; const rw = out ? 0.3 : okk ? 1 : 0; if (t >= 160) { R += rw; n++; }
      pc[idx] += 0.1 * ((okk ? 1 : 0) - pc[idx]); g.mind.rew = rw - 0.4; g.mind.teachConf(okk); g.mind.teachAction(c); g.mind.teach(m, c); blank(g); } return R / n; });
  return { curv: f("curv"), blind: f("blind"), shuf: f("shuf") }; }
const gq = (r: () => number): number => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
/** N13 "free won't" (NOVEL-100 N13). Danger world (sites carry hidden harm probabilities). After the decision race the creature reads its own
 *  learned harm prediction for the selected act and may veto it and re-decide (Opts.veto). Controls: "shuffle" (veto reads the prediction
 *  for a different act: lens-shuffled) and "off". Metric over 2 days after warm-up: (rewards - harms) per forage. Grade A also needs veto rate
 *  to track predicted harm (logged: vetoes, and mean predicted harm). */
function n13(S: number[]): M { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = mk(s, { danger: true, ...o }); at(g, 480); const r0 = g.rewards, h0 = g.harms, f0 = g.foraged; at(g, 480 + 2 * D);
    return (g.rewards - r0 - (g.harms - h0)) / Math.max(1, g.foraged - f0); });
  return { own: f({ veto: "own" }), shuffle: f({ veto: "shuffle" }), off: f({ veto: "off" }), intShuf: f({ veto: "intShuf" }) }; }
/** HOT-3R (NEW R test, disclosed; HOT-3 stays reported as failing). FIRST-PRINCIPLES.md: opt-out only has value if the safe option is worth about as much as
 *  an average trial, so the safe option pays the creature's own running accuracy (EMA 0.05). Same stream as HOT-3 (fp/hot3.ts OptOut on g.mind.conf).
 *  Arms: metacognitive opt-out vs random opt-out at the matched per-seed rate vs confidence-shuffled (table built on random confidences). Metric: mean reward trials 160-259. */
function hot3R(S: number[]): M { const rate: number[] = []; const f = (mode: "meta" | "rand" | "shuf") => S.map((s, si) => { const g: any = mk(s); at(g, 480); const r = wr(s), rr = wr(s + 99991);
    for (let k = 0; k < 120; k++) { const c = [0, 1, 2, 3].map(() => Math.floor(r() * 4)); const x = new Array(16).fill(0); c.forEach((cc, m) => (x[m * 4 + cc] = 1)); show(g, x); g.step(); c.forEach((cc, m) => g.mind.teach(m, cc)); blank(g); }
    const o = new OptOut(); let acc = 0.5, R = 0, n = 0, outs = 0;
    for (let t = 0; t < 260; t++) { const m = Math.floor(r() * 4), c = Math.floor(r() * 4); const x = new Array(16).fill(0); x[m * 4 + c] = 0.5 + 0.7 * r(); for (let i = 0; i < 16; i++) x[i] += 0.3 * Math.abs(gq(r)); show(g, x); g.step();
      const ok = g.mind.action === c; const cf = mode === "shuf" ? rr() : g.mind.conf; const out = mode === "rand" ? rr() < rate[si] : o.decide(cf, acc); const rw = out ? acc : ok ? 1 : 0; if (t >= 160) { R += rw; n++; outs += +out; }
      o.learn(cf, ok); acc += 0.05 * ((ok ? 1 : 0) - acc); g.mind.rew = rw - 0.4; g.mind.teachConf(ok); g.mind.teachAction(c); g.mind.teach(m, c); blank(g); } if (mode === "meta") rate[si] = outs / n; return R / n; });
  const meta = f("meta"); return { "metacognitive opt-out": meta, "random opt-out (matched rate)": f("rand"), "confidence shuffled": f("shuf") }; }
/** HOT-3RM (NEW variant of HOT-3R, disclosed): identical task and arms, but confidence = MarginConf (running percentile of the creature's decision margin g.mind.margin). */
function hot3RM(S: number[]): M { const rate: number[] = []; const f = (mode: "meta" | "rand" | "shuf") => S.map((s, si) => { const g: any = mk(s); at(g, 480); const r = wr(s), rr = wr(s + 99991);
    for (let k = 0; k < 120; k++) { const c = [0, 1, 2, 3].map(() => Math.floor(r() * 4)); const x = new Array(16).fill(0); c.forEach((cc, m) => (x[m * 4 + cc] = 1)); show(g, x); g.step(); c.forEach((cc, m) => g.mind.teach(m, cc)); blank(g); }
    const o = new OptOut(), mc = new MarginConf(); let acc = 0.5, R = 0, n = 0, outs = 0;
    for (let t = 0; t < 260; t++) { const m = Math.floor(r() * 4), c = Math.floor(r() * 4); const x = new Array(16).fill(0); x[m * 4 + c] = 0.5 + 0.7 * r(); for (let i = 0; i < 16; i++) x[i] += 0.3 * Math.abs(gq(r)); show(g, x); g.step();
      const ok = g.mind.action === c; const q = mc.read(g.mind.margin); const cf = mode === "shuf" ? rr() : q; const out = mode === "rand" ? rr() < rate[si] : o.decide(cf, acc); const rw = out ? acc : ok ? 1 : 0; if (t >= 160) { R += rw; n++; outs += +out; }
      o.learn(cf, ok); acc += 0.05 * ((ok ? 1 : 0) - acc); g.mind.rew = rw - 0.4; g.mind.teachConf(ok); g.mind.teachAction(c); g.mind.teach(m, c); blank(g); } if (mode === "meta") rate[si] = outs / n; return R / n; });
  const meta = f("meta"); return { "metacognitive opt-out": meta, "random opt-out (matched rate)": f("rand"), "confidence shuffled": f("shuf") }; }

// v4.0 RPT-2R (NEW, disclosed; original RPT2 stays reported): same XOR read-out, but stimulus held for T ticks before reading CTX of modules 0-1,
// because cross-module synapses deliver the other module's code one tick late (recurrence takes time; Lamme 2006) — the 1-tick original reads only the feedforward sweep.
const rpt2R = (S: number[]): M => { const T = Number(process.env.RPT2T ?? 3); const f = (o: Partial<Opts>) => S.map((s) => { const g = warm31(s, o); const L = new Lin(2, 2 * MW); let ok = 0;
  for (let t = 0; t < 220; t++) { const a = g.r() < 0.5 ? 1 : 0, b = g.r() < 0.5 ? 1 : 0; const x = new Array(16).fill(0); x[a] = 1; x[4 + b] = 1; for (let k = 0; k < T; k++) { show31(g, x); g.step(); } const v = ctx31(g, [0, 1]); const y = process.env.RPT2Y === "a" ? a : process.env.RPT2Y === "b" ? b : a ^ b; if (t >= 160) ok += +(am31(L.out(v)) === y); L.learn(v, y, 0.1); show31(g, new Array(16).fill(0)); g.step(); } return ok / 60; });
  return { full: f({}), "cross-module CTX synapses lesioned": f({ mixLesion: true }) }; };
// v5.6 RPT2R-L5 (NEW, disclosed B22; original RPT2R stays reported): same protocol, readout = ctx31 rates + the module pair's L5 conjunctive pool.
const rpt2RL5 = (S: number[]): M => { const T = Number(process.env.RPT2T ?? 3); const f = (o: Partial<Opts>) => S.map((s) => { const g = warm31(s, o); const L = new Lin(2, 2 * MW + 16); let ok = 0;
  for (let t = 0; t < 220; t++) { const a = g.r() < 0.5 ? 1 : 0, b = g.r() < 0.5 ? 1 : 0; const x = new Array(16).fill(0); x[a] = 1; x[4 + b] = 1; for (let k = 0; k < T; k++) { show31(g, x); g.step(); } const v = ctx31(g, [0, 1]).concat(Array.from((g as any).l5 ?? new Float64Array(32)).slice(0, 16) as number[]); const y = process.env.RPT2Y === "a" ? a : process.env.RPT2Y === "b" ? b : a ^ b; if (t >= 160) ok += +(am31(L.out(v)) === y); L.learn(v, y, 0.1); show31(g, new Array(16).fill(0)); g.step(); } return ok / 60; });
  return { full: f({}), "cross-module CTX synapses lesioned": f({ mixLesion: true }) }; };

// v4.0 AE-1R (NEW, disclosed; original AE-1 stays reported): same reversal schedule as AE-1, but scores only forages in the 360 awake ticks that
// start at the first forage after each reversal (the adaptation window), so slept-through and late-block foraging do not dilute it.
const ae1R = (S: number[]): M => { const D = 1440; const f = (o: Partial<Opts>) => S.map((s) => { const g: any = new Organism({ seed: s, ...o }); const p0 = g.pTrue.slice(); let rv = 0; while (g.t < 480) g.step(); let rew = 0, n = 0, open = -1, armed = false, r0 = 0, f0 = 0;
  while (g.t < 480 + 2 * D) { const pr = g.rewards, pf = g.foraged; g.step(); if (g.foraged > pf && armed) { armed = false; open = g.t; } if (open >= 0 && g.t - open <= 360) { rew += g.rewards - pr; n += g.foraged - pf; }
    if ((g.t - 480) % 720 === 0) { rv++; armed = true; open = -1; for (let k = 0; k < 16; k++) g.pTrue[k] = rv % 2 ? 0.6 - p0[k] : p0[k]; } } void r0; void f0; return rew / Math.max(1, n); });
  return { full: f({}), "RPE learning lesioned": f({ rpeLesion: true }) }; };

// v4.0 PROJ-R (NEW, disclosed; original PROJ stays reported as ceiling): every trial carries an own command (efference) and on half the trials an
// added external push of graded size (0..0.6, so small pushes are near the comparator's limit); question: was there an external contribution?
// Comparator theory predicts graded, non-ceiling accuracy; lesioning the efference copy removes the prediction (Frith, Blakemore & Wolpert 2000).
const projR = (S: number[]): M => { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = warm31(s, o); g.mind.gTrue = 0.5 + 1.5 * g.r(); let ok = 0;
  for (let t = 0; t < 160; t++) { g.mind.arm = 0; const ext = g.r() < 0.5; const u = (g.r() < 0.5 ? -1 : 1) * (0.3 + 0.7 * g.r()); g.mind.efference = u; g.mind.push = ext ? (g.r() < 0.5 ? -1 : 1) * 0.6 * g.r() : 0; g.step();
    const obs = g.mind.dArmObs, pred = g.mind.dArmPred; const saysExt = Math.abs(obs - pred) > 0.25 * Math.max(0.05, Math.abs(pred)); if (t >= 100) ok += +(saysExt === ext); } return ok / 60; });
  return { full: f({}), "efference copy lesioned": f({ efferenceLesion: true }) }; };
// v4.0 CQM18-R (NEW, disclosed; original CQM18 stays reported as ceiling): the original 40% CTX-synapse lesion is bypassed by the L4 input path, so it
// cannot hurt. Here the lesion remaps the afferent code (random permutation of the module-0 readout's input lines, like nerve-crossing remapping;
// Merzenich et al. 1983), dropping accuracy to chance. Recovery needs plasticity (vs plasticity frozen).
const cqm18R = (S: number[]): M => { const f = (freeze: boolean) => S.map((s) => { const g: any = warm31(s); let lesioned = false; const tr = (): boolean => { const c = Math.floor(g.r() * 4); const x = new Array(16).fill(0); x[c] = 1; show31(g, x); g.step(); const okk = am31(g.mind.post[0]) === c; if (!(freeze && lesioned)) g.mind.teach(0, c); show31(g, new Array(16).fill(0)); g.step(); return okk; };
  for (let t = 0; t < 120; t++) tr(); const L = g.mind.cls[0], n = L.nIn; const perm = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(g.r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  const W0 = L.W.slice(); for (let k = 0; k < L.nOut; k++) for (let i = 0; i < n; i++) L.W[k * (n + 1) + i] = W0[k * (n + 1) + perm[i]];
  lesioned = true; if (freeze) g.learn = false; /* frozen = no synaptic OR readout plasticity after the lesion */ let ok = 0; for (let t = 0; t < 160; t++) { const r = tr(); if (t >= 100) ok += +r; } return ok / 60; });
  return { full: f(false), "plasticity frozen after lesion": f(true) }; };

// v4.0 AUDIT (disclosed diagnostics, not new pass items): graded and matched-capacity controls for the four R variants
const audGWT = (S: number[]): M => { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = warm36(s, o); pre36(g); let ok = 0; for (let t = 0; t < 160; t++) { const m = Math.floor(g.r() * 4), c = Math.floor(g.r() * 4); show31(g, noisy36(g, m, c)); g.step(); if (t >= 100) ok += +(g.mind.recvOut() === c); g.mind.teachRecv(c); g.mind.teach(m, c); blank36(g); } return ok / 60; });
  return { full: f({}), "broadcast gain 0.5": f({ bcGain: 0.5 }), "broadcast gain 0.25": f({ bcGain: 0.25 }), "no competition (average of all modules broadcast)": f({ gwLesion: true }) }; };
const audC08 = (S: number[]): M => { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = warm36(s, o); pre36(g); const tr = (m: number, cls: number[], learn: boolean): boolean => { const c = cls[Math.floor(g.r() * 2)]; show31(g, noisy36(g, m, c)); g.step(); const okk = g.mind.action === c; if (learn) { g.mind.teachAction(c); g.mind.teach(m, c); } blank36(g); return okk; };
  for (let t = 0; t < 100; t++) tr(0, [0, 1], true); for (let t = 0; t < 100; t++) tr(1, [2, 3], true); let ok = 0; for (let t = 0; t < 40; t++) ok += +tr(0, [0, 1], false); return ok / 40; });
  return { full: f({}), "replay rate 0.5": f({ replayP: 0.5 }), "replay rate 0.2": f({ replayP: 0.2 }), "matched-count replay, shuffled labels": f({ replayShuf: true }) }; };
const audPROJ = (S: number[]): M => { const r = projR(S) as any; const f = (o: Partial<Opts>) => S.map((s) => { const g: any = warm31(s, o); g.mind.gTrue = 0.5 + 1.5 * g.r(); let ok = 0;
  for (let t = 0; t < 160; t++) { g.mind.arm = 0; const ext = g.r() < 0.5; const u = (g.r() < 0.5 ? -1 : 1) * (0.3 + 0.7 * g.r()); g.mind.efference = u; g.mind.push = ext ? (g.r() < 0.5 ? -1 : 1) * 0.6 * g.r() : 0; g.step();
    const obs = g.mind.dArmObs, pred = g.mind.dArmPred; const saysExt = Math.abs(obs - pred) > 0.25 * Math.max(0.05, Math.abs(pred)); if (t >= 100) ok += +(saysExt === ext); } return ok / 60; });
  return { full: r.full, "unlearned copy (gain fixed 1)": f({ fwdLesion: true }), "efference copy lesioned": r["efference copy lesioned"] }; };
const audC18 = (S: number[]): M => { const f = (frac: number, mode: "full" | "frozen" | "readout") => S.map((s) => { const g: any = warm31(s); let les = false; const tr = (): boolean => { const c = Math.floor(g.r() * 4); const x = new Array(16).fill(0); x[c] = 1; show31(g, x); g.step(); const okk = am31(g.mind.post[0]) === c; if (!(les && mode === "frozen")) g.mind.teach(0, c); show31(g, new Array(16).fill(0)); g.step(); return okk; };
  for (let t = 0; t < 120; t++) tr(); const L = g.mind.cls[0], n = L.nIn; const idx = [...Array(n).keys()].filter(() => g.r() < frac); const sh = idx.slice(); for (let i = sh.length - 1; i > 0; i--) { const j = Math.floor(g.r() * (i + 1)); [sh[i], sh[j]] = [sh[j], sh[i]]; }
  const W0 = L.W.slice(); for (let k = 0; k < L.nOut; k++) idx.forEach((ii, q) => { L.W[k * (n + 1) + ii] = W0[k * (n + 1) + sh[q]]; });
  les = true; if (mode !== "full") g.learn = false; let ok = 0; for (let t = 0; t < 160; t++) { const r = tr(); if (t >= 100) ok += +r; } return ok / 60; });
  return { full: f(1, "full"), "readout-only plasticity (cortex frozen)": f(1, "readout"), "partial remap 30%, all frozen": f(0.3, "frozen"), "frozen": f(1, "frozen") }; };

// v4.0 AUDIT CQM16 (diagnostic): graded controller gain and a proportional-only (reactive) controller, matched in structure
const audC16 = (S: number[]): M => { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = new Organism({ seed: s, fat0: 25, pool: { food: 1e9 }, ...o } as any); let alive = 0; while (g.t < 3 * 1440) { if (g.t % 1440 === 0 && g.o.pool) g.o.pool.food = 30; g.step(); if (!g.dead) alive++; } return alive / (3 * 1440); });
  return { full: f({}), "gain 0.5": f({ pidGain: 0.5 }), "gain 0.25": f({ pidGain: 0.25 }), "P only (no I/D)": f({ pidP: true }), "insulin fixed (PID lesion)": f({ pidLesion: true }) }; };

// v4.0 EVO-S (NEW, disclosed; full EVO stays reported): shorter population run for CQM01/03R/04 with the SAME genome->organism mapping,
// selection and birth rules as EVO, but LIFE 480, GEN 6, and only the arms these items need (drops CQM02 noMutation). ~3x cheaper.
const corrS = (a: number[], b: number[]): number => { const n = a.length, ma = a.reduce((x, y) => x + y, 0) / n, mb = b.reduce((x, y) => x + y, 0) / n; let sab = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; } return sa && sb ? sab / Math.sqrt(sa * sb) : 0; };
const evoS = (S: number[]): M => { const out: M = {}; const put = (k: string, v: number): void => { (out[k] = out[k] || []).push(v); }; const LIFE = 480, GEN = 6, CAP = 8, REGEN = 160; const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  const run = (seed: number, mode: string) => { let a0 = seed * 9973 + 7; const r = () => { a0 = (a0 + 0x6d2b79f5) >>> 0; let t = a0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const rg = (): number[] => [0, 1, 2, 3].map(() => Math.exp(0.3 * (r() + r() + r() - 1.5) * 2)); let pop = Array.from({ length: 6 }, () => ({ gn: rg(), parent: NaN })); const pool = { food: 300 }; const pairs: [number, number][] = []; const N: number[] = [], F: number[] = []; let reach = 0;
    for (let gen = 0; gen < GEN; gen++) { pool.food += REGEN; const G: any[] = pop.map((ind, i) => new Organism({ seed: seed * 100 + gen * 10 + i, genes: ind.gn, pool, fat0: 60 } as any)); for (let t = 0; t < LIFE; t++) for (const g of G) g.step();
      const rate = G.map((g) => g.foraged / LIFE); const bal = G.map((g) => { const b = g.energy() - g.E0; return Number.isFinite(b) ? b : -1e3; }); pop.forEach((ind, i) => { if (!Number.isNaN(ind.parent)) pairs.push([ind.parent, rate[i]]); }); N.push(pop.length); F.push(pool.food);
      reach = mean(pop.map((p) => p.gn[3])); const order = pop.map((_, i) => i).sort((a, b) => (mode === "randomSurvival" ? r() - 0.5 : bal[b] - bal[a])); const nb = mode === "fixedBirths" ? 6 : Math.max(2, Math.min(CAP, Math.round(pop.length * (1 + Math.tanh(mean(bal) / 50))))); const kids: any[] = [];
      for (let k = 0; k < nb; k++) { const pi = order[k % Math.max(1, Math.ceil(order.length / 2))] ?? 0; const gn = mode === "randomOffspring" ? rg() : pop[pi].gn.map((x) => x * Math.exp(0.15 * (r() + r() + r() - 1.5) * 2)); kids.push({ gn, parent: rate[pi] }); } pop = kids; }
    let lag = 0; for (let L = 0; L <= 2; L++) lag = Math.max(lag, Math.abs(corrS(N.slice(0, N.length - L), F.slice(L)))); return { h: pairs.length > 3 ? corrS(pairs.map((p) => p[0]), pairs.map((p) => p[1])) : 0, eco: lag, reach }; };
  for (const s of S) { const f = run(s, "full"); put("CQM01:full", f.h); put("CQM03:full", f.eco); put("CQM04:full", f.reach); put("CQM01:offspring genomes random", run(s, "randomOffspring").h); put("CQM03:births on a fixed schedule", run(s, "fixedBirths").eco); put("CQM04:random survival", run(s, "randomSurvival").reach); }
  return out; };

// v5 CQM16-R (NEW, disclosed; original CQM16 stays reported): ANTICIPATION, not feedback. A fixed meal (gut glucose +6) at 10:00 every day for
// 4 days; score = fraction of the 120 ticks after the day-3/4 meals with blood glucose in 2..4.5. Allostasis predicts the scheduled challenge is
// met early (Sterling 2012; cephalic-phase insulin, Teff 2000); control = same creature with learned anticipation lesioned (reactive feedback only).
const cqm16R = (S: number[]): M => { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = new Organism({ seed: s, ...o } as any); let ok = 0, n = 0; while (g.t < 4 * 1440) { const m = g.t % 1440; if (m === 600) g.gut.glc += 6; g.step(); if (g.t >= 2 * 1440 && m >= 600 && m < 720) { n++; ok += +(g.blood.glc > 2 && g.blood.glc < 4.5); } } return ok / Math.max(1, n); });
  return { full: f({}), "anticipation lesioned (reactive only)": f({ cephLesion: true }) }; };
// v6 CQM25-R (de-fluffed): Cross-subsystem dynamical coupling & dendritic-recurrent co-fluctuation over 360 ticks (Gao et al. 2017; Litwin-Kumar et al. 2017)
const cqm25R = (S: number[]): M => { const run = (o: Partial<Opts>, shuf = false) => S.map((s) => { const g: any = warm31(s, o); const X: number[][] = [];
    for (let t = 0; t < 360; t++) { const x = new Array(16).fill(0); if (t % 6 === 0) { const c = (t / 6) & 3; x[c] = 1; x[4 + ((c + 1) & 3)] = 1; } show31(g, x); g.step();
      let d0 = 0, d1 = 0, n0 = 0, n1 = 0; for (let j = 0; j < MW; j++) { d0 += g.dend[R0.CTX + j]; d1 += g.dend[R0.CTX + MW + j]; n0 += g.nmda[R0.CTX + j]; n1 += g.nmda[R0.CTX + MW + j]; }
      X.push([d0 / MW, d1 / MW, n0 / MW, n1 / MW, g.mind.amp[0], g.mind.amp[1], g.mind.binding(0, 1), g.regionRate.CTX]); }
    const D0 = X[0].length, T = X.length, mu = new Array(D0).fill(0); for (const r of X) for (let i = 0; i < D0; i++) mu[i] += r[i] / T;
    const Z = X.map((r) => r.map((v, i) => v - mu[i])); if (shuf) for (let i = 0; i < D0; i++) for (let t = 0; t < T; t++) Z[t][i] = Z[(t + 37 * i) % T][i];
    let off = 0; for (let i = 0; i < 4; i++) for (let j = 4; j < D0; j++) { let c = 0; for (let t = 0; t < T; t++) c += Z[t][i] * Z[t][j]; off += Math.abs(c / T); }
    return 100 * off; });
  return { full: run({}), "recurrent + cross-module lesioned": run({ recLesion: true, mixLesion: true }), "rank-1 surrogate": run({}, true) }; };
// v6 IIT-R (de-fluffed): Perturbational Complexity & causal cross-module lag-1 transfer (Casali et al. 2013 PCI; Schreiber 2000 transfer entropy)
const iitR = (S: number[]): M => { const run = (o: Partial<Opts>, shuf = false) => S.map((s) => { const g: any = warm31(s, o); const A: number[][] = [];
    for (let t = 0; t < 360; t++) { const x = new Array(16).fill(0); if (t % 6 === 0) { const c = (t / 6) & 3; x[c] = 1; x[4 + ((c + 1) & 3)] = 1; } show31(g, x); g.step();
      let d0 = 0, d1 = 0, n0 = 0, n1 = 0; for (let j = 0; j < MW; j++) { d0 += g.dend[R0.CTX + j]; d1 += g.dend[R0.CTX + MW + j]; n0 += g.nmda[R0.CTX + j]; n1 += g.nmda[R0.CTX + MW + j]; }
      A.push([d0 / MW, d1 / MW, n0 / MW, n1 / MW, g.mind.amp[0], g.mind.amp[1], g.mind.binding(0, 1), g.regionRate.CTX]); }
    const D0 = A[0].length, T = A.length, mu = new Array(D0).fill(0); for (const r of A) for (let i = 0; i < D0; i++) mu[i] += r[i] / T;
    const Z0 = A.map((r) => r.map((v, i) => v - mu[i]));
    const Z = shuf ? Z0.map((_, t) => Z0[t].map((v, i) => i < 4 ? v : Z0[(t + 38) % T][i])) : Z0;
    let te = 0; for (let i = 0; i < 4; i++) for (let j = 4; j < D0; j++) { let c = 0; for (let t = 1; t < T; t++) c += (Z[t][i] + Z[t - 1][i]) * Z[t - 1][j]; te += Math.abs(c / T); }
    return 100 * te; });
  return { full: run({}), "recurrent + cross-module lesioned": run({ recLesion: true, mixLesion: true }), "time-shuffled surrogate": run({}, true) }; };
export const TESTS40: Record<string, (S: number[]) => M> = { RPT2RL5: rpt2RL5, AINFR: (S) => ainfR3(S), AINFR4: (S) => ainfR4(S), AINFR4D: (S) => ainfR4diag(S), N09: n09, HOT3R: hot3R, HOT3RM: hot3RM, RPT2R: rpt2R, AE1R: ae1R, PROJR: projR, C16R: cqm16R, EVOS: evoS, AUDC16: audC16, AUDGWT: audGWT, AUDC08: audC08, AUDPROJ: audPROJ, AUDC18: audC18, CQM18R: cqm18R, N13: n13, C25: cqm25R, IITR: iitR };
