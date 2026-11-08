// v3.1 tests (preregistrations/v3.1.md): Butlin-14, 10 frameworks, CQM-25, all run on the integrated organism (organism.ts = browser code).
// Each function returns per-seed metrics for the full organism and each one-mechanism-lesion control. Readouts marked "probe" are measurement
// devices owned by the test (linear decoders trained on organism state), not organism mechanisms.
import { Organism, Opts, SITES, R0, Lin, MW } from "./organism";
import { compare, item, Item, auroc } from "../harness/harness";
const D = 1440; const mean = (a: number[]): number => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
const mk = (seed: number, o: Partial<Opts> = {}): Organism => new Organism({ seed, ...o });
const at = (g: Organism, tick: number): void => { while (g.t < tick) g.step(); };
export const warm = (seed: number, o: Partial<Opts> = {}): Organism => { const g = mk(seed, o); at(g, 480); return g; }; // 08:00 day 0, awake
export const am = (a: ArrayLike<number>): number => { let b = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[b]) b = i; return b; };
const oneHot = (m: number, c: number, amp = 1): number[] => { const x = new Array(16).fill(0); x[m * 4 + c] = amp; return x; };
export const show = (g: Organism, x: number[]): void => { for (let i = 0; i < 16; i++) g.sens[i] = Math.max(0, x[i]); };
export const blank = (g: Organism, n = 1): void => { for (let k = 0; k < n; k++) { g.sens.fill(0); g.step(); } };
export const ctx = (g: Organism, mods = [0, 1, 2, 3]): number[] => { const v: number[] = []; for (const m of mods) for (let j = 0; j < MW; j++) v.push(g.rate[R0.CTX + m * MW + j]); return v; };
const spearman = (a: number[], b: number[]): number => { const rk = (x: number[]): number[] => { const i = x.map((v, k) => [v, k]).sort((p, q) => p[0] - q[0]); const r = new Array(x.length); i.forEach(([, k], n) => (r[k] = n)); return r; };
  const ra = rk(a), rb = rk(b), ma = mean(ra), mb = mean(rb); let s = 0, sa = 0, sb = 0; for (let k = 0; k < a.length; k++) { s += (ra[k] - ma) * (rb[k] - mb); sa += (ra[k] - ma) ** 2; sb += (rb[k] - mb) ** 2; } return s / Math.sqrt(sa * sb + 1e-12); };
const corr = (a: number[], b: number[]): number => { const ma = mean(a), mb = mean(b); let s = 0, sa = 0, sb = 0; for (let k = 0; k < a.length; k++) { s += (a[k] - ma) * (b[k] - mb); sa += (a[k] - ma) ** 2; sb += (b[k] - mb) ** 2; } return sa && sb ? s / Math.sqrt(sa * sb) : 0; };
export const LEDGER: { id: string; seed: number; err: number }[] = [];
const led = (id: string, g: Organism): Organism => { LEDGER.push({ id, seed: g.o.seed, err: g.ledgerError() }); return g; };
// pretraining: every module learns its own modality's classes (all four modalities shown at once, independent classes)
const pretrain = (g: Organism, n = 120): void => { for (let k = 0; k < n; k++) { const c = [0, 1, 2, 3].map(() => Math.floor(g.r() * 4)); const x = new Array(16).fill(0); c.forEach((cc, m) => (x[m * 4 + cc] = 1)); show(g, x); g.step(); c.forEach((cc, m) => g.mind.teach(m, cc)); blank(g); } };

type M = Record<string, number[]>; // arm name -> per-seed metric
export const TESTS: Record<string, (seeds: number[]) => M> = {
  // ---------------- Butlin-14 ----------------
  RPT1: (S) => ({ full: rpt1(S, {}), "recurrent CTX synapses lesioned": rpt1(S, { recLesion: true }) }),
  RPT2: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); const L = new Lin(2, 2 * MW); let ok = 0; for (let t = 0; t < 220; t++) { const a = g.r() < 0.5 ? 1 : 0, b = g.r() < 0.5 ? 1 : 0; const x = new Array(16).fill(0); x[a] = 1; x[4 + b] = 1; show(g, x); g.step(); const v = ctx(g, [0, 1]); const y = a ^ b; if (t >= 160) ok += +(am(L.out(v)) === y); L.learn(v, y, 0.1); blank(g); } led("RPT2", g); return ok / 60; });
    return { full: f({}), "cross-module CTX synapses lesioned": f({ mixLesion: true }) }; },
  GWT1: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); const R = [0, 1, 2, 3].map(() => new Lin(4, 4 * MW)); // probe decoders read all of cortex
      const trial = (learn: boolean): boolean[] => { const c = [0, 1, 2, 3].map(() => Math.floor(g.r() * 4)); const x = new Array(16).fill(0); c.forEach((cc, m) => (x[m * 4 + cc] = 1)); show(g, x); g.step(); const v = ctx(g); const ok = c.map((cc, m) => am(R[m].out(v)) === cc); if (learn) c.forEach((cc, m) => R[m].learn(v, cc, 0.08)); blank(g); return ok; };
      for (let t = 0; t < 200; t++) trial(true); const base = [0, 0, 0, 0]; for (let t = 0; t < 40; t++) trial(false).forEach((b, m) => (base[m] += +b / 40));
      let score = 0; for (let m = 0; m < 4; m++) { g.lesionModule(m, true); const acc = [0, 0, 0, 0]; for (let t = 0; t < 30; t++) trial(false).forEach((b, n) => (acc[n] += +b / 30)); g.lesionModule(m, false); const own = base[m] - acc[m]; const cross = mean([0, 1, 2, 3].filter((n) => n !== m).map((n) => base[n] - acc[n])); score += (own - cross) / 4; }
      led("GWT1", g); return score; });
    return { full: f({}), "topography scrambled at build": f({ topoScramble: true }) }; },
  GWT2: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); pretrain(g); let ok = 0; for (let t = 0; t < 200; t++) { const tm = Math.floor(g.r() * 4); const c = Math.floor(g.r() * 4); const x = oneHot(tm, c, 1.0); const others = [0, 1, 2, 3].filter((m) => m !== tm); for (const m of others.slice(0, 2)) x[m * 4 + Math.floor(g.r() * 4)] = 0.5; show(g, x); g.step(); if (t >= 140) ok += +(g.mind.action === c); g.mind.teachAction(c); g.mind.teach(tm, c); blank(g); } led("GWT2", g); return ok / 60; });
    return { full: f({}), "workspace lesioned (action reads module average)": f({ gwLesion: true }) }; },
  GWT3: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); pretrain(g); let ok = 0; for (let t = 0; t < 160; t++) { const m = Math.floor(g.r() * 4), c = Math.floor(g.r() * 4); show(g, oneHot(m, c)); g.step(); if (t >= 100) ok += +(g.mind.recvOut() === c); g.mind.teachRecv(c); g.mind.teach(m, c); blank(g); } led("GWT3", g); return ok / 60; });
    return { full: f({}), "broadcast lesioned": f({ bcLesion: true }) }; },
  GWT4: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); pretrain(g); let ok = 0; for (let t = 0; t < 260; t++) { const c = Math.floor(g.r() * 4); show(g, oneHot(0, c)); g.step(); const q = 1 + (c % 3); const ans = [0, 1, 2, 3].map(() => Math.floor(g.r() * 4)); const x = new Array(16).fill(0); for (let m = 1; m < 4; m++) x[m * 4 + ans[m]] = 0.7; show(g, x); g.step();
        const r = g.mind.win === q && g.mind.action === ans[q] ? 1 : 0; if (t >= 200) ok += r; g.mind.rewardQuery(g.mind.win === q ? 1 : 0); g.mind.teachAction(ans[q]); blank(g); } led("GWT4", g); return ok / 60; });
    return { full: f({}), "attention not driven by workspace state": f({ seqLesion: true }) }; },
  HOT1: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); let e = 0; for (let t = 0; t < 200; t++) { const c = Math.floor(g.r() * 4); const clean = oneHot(0, c).slice(0, 4); const x = oneHot(0, c).map((v, i) => (i < 4 ? v + 0.4 * g.gauss() : 0)); show(g, x); g.step(); if (t >= 140) e += clean.reduce((a, v, j) => a + (v - g.mind.percept[0][j]) ** 2, 0) / 4; g.mind.teach(0, c, clean); blank(g); } led("HOT1", g); return -e / 60; });
    return { full: f({}), "top-down lesioned": f({ topdownLesion: true }) }; },
  HOT2: (S) => { const conf: number[] = [], shuf: number[] = []; for (const s of S) { const g = warm(s); pretrain(g); const C: number[] = [], K: boolean[] = []; for (let t = 0; t < 260; t++) { const m = Math.floor(g.r() * 4), c = Math.floor(g.r() * 4); const x = oneHot(m, c, 0.5 + 0.7 * g.r()); for (let i = 0; i < 16; i++) x[i] += 0.3 * Math.abs(g.gauss()); show(g, x); g.step(); const okk = g.mind.action === c; if (t >= 160) { C.push(g.mind.conf); K.push(okk); } g.mind.teachConf(okk); g.mind.teachAction(c); g.mind.teach(m, c); blank(g); }
      conf.push(auroc(C, K)); const r = g.r; const Cs = C.slice(); for (let i = Cs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [Cs[i], Cs[j]] = [Cs[j], Cs[i]]; } shuf.push(auroc(Cs, K)); led("HOT2", g); }
    return { full: conf, "confidence shuffled (S)": shuf }; },
  HOT3: (S) => { const outRate = S.map(() => 0); const f = (mode: "opt" | "none" | "rand", rate?: number[]) => S.map((s, si) => { const g = warm(s); pretrain(g); const pc = new Array(10).fill(0.5); let R = 0, n = 0, outs = 0;
      for (let t = 0; t < 260; t++) { const m = Math.floor(g.r() * 4), c = Math.floor(g.r() * 4); const x = oneHot(m, c, 0.5 + 0.7 * g.r()); for (let i = 0; i < 16; i++) x[i] += 0.3 * Math.abs(g.gauss()); show(g, x); g.step(); const okk = g.mind.action === c; const b = Math.min(9, Math.floor(g.mind.conf * 10));
        const out = mode === "opt" ? pc[b] < 0.3 : mode === "rand" ? g.r() < (rate as number[])[si] : false; const r = out ? 0.3 : okk ? 1 : 0; if (t >= 160) { R += r; n++; outs += +out; }
        pc[b] += 0.1 * ((okk ? 1 : 0) - pc[b]); g.mind.rew = r - 0.4; /* RPE */ g.mind.teachConf(okk); g.mind.teachAction(c); g.mind.teach(m, c); blank(g); } if (mode === "opt") outRate[si] = outs / n; led("HOT3", g); return R / n; });
    const full = f("opt"); const rate = outRate.slice();
    return { full, "no opt-out": f("none"), "random opt-out at same rate": f("rand", rate) }; },
  HOT4: (S) => { const f = (perm: boolean) => S.map((s) => { const g = warm(s); const X: number[] = [], V: number[][] = []; for (let t = 0; t < 60; t++) { const p = 3 * g.r(); const x = new Array(16).fill(0); for (let j = 0; j < 4; j++) x[j] = Math.exp(-((j - p) ** 2) / 0.8);
        if (perm) { const o = [0, 1, 2, 3]; for (let i = 3; i > 0; i--) { const k = Math.floor(g.r() * (i + 1)); [o[i], o[k]] = [o[k], o[i]]; } const y = o.map((k) => x[k]); for (let j = 0; j < 4; j++) x[j] = y[j]; }
        show(g, x); const acc = new Array(MW).fill(0); for (let k = 0; k < 3; k++) { g.step(); ctx(g, [0]).forEach((v, j) => (acc[j] += v)); } X.push(p); V.push(acc); blank(g); }
      const dx: number[] = [], dv: number[] = []; for (let i = 0; i < 60; i++) for (let j = i + 1; j < 60; j++) { dx.push(Math.abs(X[i] - X[j])); dv.push(Math.hypot(...V[i].map((v, k) => v - V[j][k]))); } led("HOT4", g); return spearman(dx, dv); });
    return { full: f(false), "sensory lines permuted every trial": f(true) }; },
  AST1: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); let e = 0; for (let t = 0; t < 300; t++) { if (t % 50 === 0) g.mind.afTarget = 2 * g.r() - 1; g.step(); if (t >= 60) e += g.mind.afErr; } led("AST1", g); return -e / 240; });
    return { full: f({}), "schema lesioned (raw observation)": f({ astLesion: true }) }; },
  PP1: (S) => ppTask(S, { ppLesion: true }, "predictor lesioned (running mean)"),
  AE1: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = mk(s, o); const p0 = g.pTrue.slice(); let rv = 0; at(g, 480); const r0 = g.rewards, f0 = g.foraged; while (g.t < 480 + 2 * D) { g.step(); if ((g.t - 480) % 720 === 0) { rv++; for (let k = 0; k < SITES; k++) g.pTrue[k] = rv % 2 ? 0.6 - p0[k] : p0[k]; } } led("AE1", g); return (g.rewards - r0) / Math.max(1, g.foraged - f0); });
    return { full: f({}), "RPE learning lesioned": f({ rpeLesion: true }) }; },
  AE2: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); g.mind.gTrue = 0.5 + 1.5 * g.r(); let e = 0; for (let t = 0; t < 120; t++) { g.mind.arm = 0; const T = 3 * g.r() - 1.5; const gh = o.efferenceLesion || o.fwdLesion ? 1 : g.mind.gHat; g.mind.efference = T / gh; g.step(); if (t >= 60) e += Math.abs(g.mind.arm - T); } led("AE2", g); return -e / 60; });
    return { full: f({}), "forward model lesioned (gain fixed at prior)": f({ fwdLesion: true }) }; },
  // ---------------- frameworks ----------------
  NOVEL: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = led("NOVEL", mk(s, o)); at(g, 3 * D + 8 * 60); let err = 0, n = 0; for (let k = 0; k < SITES; k++) if (!g.access[k]) { err += (g.valueEst(k) - g.pTrue[k]) ** 2; /* v4.0: the value the chooser actually uses (identical to wSite before v4.0) */ n++; } return { ev: g.probe(80, "novel").ev, err: -err / n }; }); // thaler9 and CQM12 share these runs
    const full = f({}), sh = f({ replay: "remShuffle" });
    return { "thaler9:full": full.map((x) => x.ev), "thaler9:dreams with shuffled content": sh.map((x) => x.ev), "CQM12:full": full.map((x) => x.err), "CQM12:dreams shuffled": sh.map((x) => x.err) }; },
  IIT: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); const X: number[] = []; const med = new Array(6).fill(0); const raw: number[][] = [];
      for (let t = 0; t < 1440; t++) { const x = new Array(16).fill(0); if (g.r() < 0.5) x[Math.floor(g.r() * 16)] = 1; show(g, x); g.step(); raw.push([0, 1, 2, 3].map((m) => g.mind.amp[m]).concat([g.regionRate.THAL, g.regionRate.HIP])); }
      for (let i = 0; i < 6; i++) { const v = raw.map((r) => r[i]).sort((a, b) => a - b); med[i] = v[v.length >> 1]; } for (const r of raw) X.push(r.reduce((a, v, i) => a | ((v > med[i] ? 1 : 0) << i), 0)); led("IIT", g); return phi(X, 6); });
    return { full: f({}), "recurrent + cross-module CTX lesioned": f({ recLesion: true, mixLesion: true }) }; },
  AINF: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = mk(s, { deplete: true, ...o }); at(g, 480); const r0 = g.rewards; at(g, 480 + 2 * D); led("AINF", g); return g.rewards - r0; });
    return { full: f({}), "epistemic term lesioned": f({ efeLesion: true }) }; },
  ASO: (S) => { const f = (lastObs: boolean) => S.map((s) => { const g = warm(s); let af = 0, dr = 0, e = 0, lo = 0; for (let t = 0; t < 300; t++) { dr += 0.004 * g.gauss() - 0.002 * dr; af += dr + 0.03 * (0.5 + g.nm.NE.E) * g.gauss(); const obs = af + 0.3 * g.gauss();
        const pred = lastObs ? lo : g.mind.other.predict(); if (t >= 50) e += (pred - af) ** 2; g.mind.other.update(obs); lo = obs; g.step(); } led("ASO", g); return -e / 250; });
    return { full: f(false), "last-observation predictor": f(true) }; },
  FIELD: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); const P = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]]; let ok = 0;
      for (let t = 0; t < 30; t++) { const pi = Math.floor(g.r() * 3); const pr = P[pi]; for (let k = 0; k < 12; k++) { const x = new Array(16).fill(0); for (const [a, b] of pr) { const amp = g.r() < 0.5 ? 1 : 0; const c = Math.floor(g.r() * 4); x[a * 4 + c] = amp; x[b * 4 + c] = amp; } show(g, x); g.step(); }
        const sc = P.map((q) => g.mind.binding(q[0][0], q[0][1]) + g.mind.binding(q[1][0], q[1][1])); ok += +(am(sc) === pi); } led("FIELD", g); return ok / 30; });
    return { full: f({}), "field coupling lesioned": f({ fieldLesion: true }) }; },
  UAL: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); const vp: number[] = [], vm: number[] = []; for (let t = 0; t < 80; t++) { const plus = t % 2 === 0; show(g, oneHot(2, plus ? 0 : 1)); g.step(); if (t >= 50) (plus ? vp : vm).push(g.mind.V); blank(g, 2); if (plus) g.mind.rew = 1; blank(g, 3); } led("UAL", g); return mean(vp) - mean(vm); });
    return { full: f({}), "eligibility traces lesioned": f({ traceLesion: true }) }; },
  SM: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); g.mind.gTrue = 0.5 + 1.5 * g.r(); let e = 0; for (let t = 0; t < 150; t++) { g.mind.arm = 0; g.mind.efference = 2 * g.r() - 1; g.step(); if (t >= 50) e += Math.abs(g.mind.dArmPred - g.mind.dArmObs); } led("SM", g); return -e / 100; });
    return { full: f({}), "efference copy lesioned": f({ efferenceLesion: true }) }; },
  PROJ: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); g.mind.gTrue = 0.5 + 1.5 * g.r(); let ok = 0; for (let t = 0; t < 160; t++) { g.mind.arm = 0; const self = g.r() < 0.5; const u = (g.r() < 0.5 ? -1 : 1) * (0.3 + 0.7 * g.r()); if (self) g.mind.efference = u; else g.mind.push = u; g.step();
        const obs = g.mind.dArmObs, pred = g.mind.dArmPred; const saysSelf = Math.abs(obs) > 0.05 && Math.abs(obs - pred) < 0.5 * Math.abs(obs); if (t >= 100) ok += +(saysSelf === self); } led("PROJ", g); return ok / 60; });
    return { full: f({}), "efference copy lesioned": f({ efferenceLesion: true }) }; },
  CTM: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); pretrain(g); let ok = 0; for (let t = 0; t < 160; t++) { const m = Math.floor(g.r() * 4), c = Math.floor(g.r() * 4); show(g, oneHot(m, c)); g.step(); if (t >= 100) ok += +(g.mind.repOut() === g.mind.action); g.mind.teachReport(); g.mind.teachAction(c); g.mind.teach(m, c); blank(g); } led("CTM", g); return ok / 60; });
    return { full: f({}), "broadcast lesioned": f({ bcLesion: true }) }; },
  // ---------------- CQM ----------------
  EVO: (S) => evo(S),
  C05: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = mk(s, o); at(g, 2 * D); return -g.ledgerError(); }); return { full: f({}), "leaky ledger": f({ leakyLedger: true }) }; },
  C06: (S) => { const f = (single: boolean) => S.map((s) => { const g = warm(s); const L = new Lin(1, single ? MW : 2 * MW); let e = 0; for (let t = 0; t < 200; t++) { const q = 3 * g.r(); const x = new Array(16).fill(0); for (let j = 0; j < 4; j++) { x[j] = Math.exp(-((j - q) ** 2) / 0.8) + 0.35 * g.gauss(); x[4 + j] = Math.exp(-((j - q) ** 2) / 0.8) + 0.35 * g.gauss(); } show(g, x);
        const acc = new Array(2 * MW).fill(0); for (let k = 0; k < 2; k++) { g.step(); ctx(g, [0, 1]).forEach((v, j) => (acc[j] += v)); } const v = single ? acc.slice(0, MW) : acc; const est = L.out(v)[0]; if (t >= 140) e += (est - q / 3) ** 2; L.regress(v, [q / 3], 0.3); blank(g); } led("C06", g); return -e / 60; });
    return { full: f(false), "integration lesion (modality 0 only)": f(true) }; },
  C07: (S) => ppTask(S, { ppFreeze: true }, "plasticity frozen"),
  C08: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); pretrain(g); const tr = (m: number, cls: number[], learn: boolean): boolean => { const c = cls[Math.floor(g.r() * 2)]; show(g, oneHot(m, c)); g.step(); const okk = g.mind.action === c; if (learn) { g.mind.teachAction(c); g.mind.teach(m, c); } blank(g); return okk; };
      for (let t = 0; t < 100; t++) tr(0, [0, 1], true); for (let t = 0; t < 100; t++) tr(1, [2, 3], true); let ok = 0; for (let t = 0; t < 40; t++) ok += +tr(0, [0, 1], false); led("C08", g); return ok / 40; });
    return { full: f({}), "replay lesioned": f({ replay: "none" }) }; },
  C09: (S) => { const f = (persist: boolean) => S.map((s) => { const g = mk(s); at(g, D + 7 * 60); let e = 0, n = 0; for (let i = 0; i < 8; i++) { at(g, D + 7 * 60 + i * 90); g.feed(10); g.step(); const pred = persist ? g.blood.glc : g.mind.glcPred; at(g, g.t + 30); e += Math.abs(pred - g.blood.glc); n++; } led("C09", g); return -e / n; });
    return { full: f(false), "persistence forecast": f(true) }; },
  C10: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = mk(s, o); at(g, D); let ok = 0, n = 0; while (g.t < 4 * D) { g.step(); n++; ok += +(g.blood.glc > 2.0 && g.blood.glc < 4.5 && g.atp > 1.5 && g.S < 0.9); } led("C10", g); return ok / n; });
    return { full: f({}), "fixed foraging drive": f({ fixedDrive: true }) }; },
  C11: (S) => { const f = (mf: boolean) => S.map((s) => maze(s, mf)); return { full: f(false), "model-free only": f(true) }; },
  C14: (S) => { const f = (cut: boolean) => S.map((s) => { const A = warm(s), B = warm(s + 50000); pretrain(A); pretrain(B); let ok = 0; for (let t = 0; t < 300; t++) { const c = Math.floor(A.r() * 4); show(A, oneHot(0, c)); A.step(); const sig = A.mind.action; show(B, cut ? new Array(16).fill(0) : oneHot(0, sig)); B.step(); const r = B.mind.action === c;
        if (t >= 240) ok += +r; if (r) { A.mind.teachAction(sig, 0.3); B.mind.teachAction(B.mind.action, 0.3); } A.mind.rew = r ? 1 : 0; B.mind.rew = r ? 1 : 0; A.mind.teach(0, c); B.mind.teach(0, sig); blank(A); blank(B); } led("C14", A); led("C14", B); return ok / 60; });
    return { full: f(false), "signal line cut": f(true) }; },
  C15: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = mk(s, o); at(g, 480); let ok = 0, n = 0; while (g.t < 480 + 2 * D) { if (g.r() < 1 / 60) g.damage(0.05 + 0.05 * g.r()); g.step(); n++; ok += +(g.integrity > 0.7); } led("C15", g); return ok / n; });
    return { full: f({}), "repair lesioned": f({ repairLesion: true }) }; },
  C16: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = mk(s, { fat0: 25, pool: { food: 1e9 }, ...o }); let alive = 0; while (g.t < 3 * D) { if (g.t % D === 0 && g.o.pool) g.o.pool.food = 30; g.step(); if (!g.dead) alive++; } led("C16", g); return alive / (3 * D); });
    return { full: f({}), "allostatic (PID) lesion": f({ pidLesion: true }) }; },
  C17: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = mk(s, o); at(g, D); const v: number[] = []; while (g.t < 2 * D) { g.step(); v.push(g.blood.glc); } const m = mean(v); led("C17", g); return -mean(v.map((x) => (x - 3) ** 2)) + 0 * m; });
    return { full: f({}), "PID lesioned": f({ pidLesion: true }) }; },
  C18: (S) => { const f = (freeze: boolean) => S.map((s) => { const g = warm(s); const tr = (): boolean => { const c = Math.floor(g.r() * 4); show(g, oneHot(0, c)); g.step(); const okk = am(g.mind.post[0]) === c; g.mind.teach(0, c); blank(g); return okk; };
      for (let t = 0; t < 120; t++) tr(); for (let k = 0; k < g.mask.length; k++) if (g.syn.pre[k] >= R0.CTX && g.syn.pre[k] < R0.CTX + 64 && g.r() < 0.4) g.kind[k] = 9; const ap = g.applyMask.bind(g); g.applyMask = () => { ap(); for (let k = 0; k < g.mask.length; k++) if (g.kind[k] === 9) g.mask[k] = 0; }; g.applyMask();
      if (freeze) g.learn = false; let ok = 0; for (let t = 0; t < 160; t++) { const r = tr(); if (t >= 100) ok += +r; } led("C18", g); return ok / 60; });
    return { full: f(false), "plasticity frozen after lesion": f(true) }; },
  C22: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = mk(s, { danger: true, ...o }); at(g, 480); const r0 = g.rewards; at(g, 480 + 2 * D); led("C22", g); return g.rewards * 2.2 - 100 * g.damageTaken - r0 * 2.2; });
    return { full: f({}), "aversive learning lesioned": f({ aversiveLesion: true }) }; },
  C24: (S) => { const h = (s: number): string => { const g = mk(s); at(g, 600); let x = 0; for (let i = 0; i < g.v.length; i++) x = (x * 31 + Math.round(g.v[i] * 1e6)) >>> 0; return x.toString(16) + ":" + g.energy().toFixed(9) + ":" + g.mind.V.toFixed(9); };
    return { identical: S.slice(0, 4).map((s) => +(h(s) === h(s))) }; },
};
function ppTask(S: number[], ctrl: Partial<Opts>, name: string): M { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); let st = 0, e = 0; for (let t = 0; t < 300; t++) { st = g.r() < 0.85 ? (st + 1) % 4 : Math.floor(g.r() * 4); show(g, oneHot(0, st)); g.step(); if (t >= 200) e += g.mind.ppErr; } led("PP", g); return -e / 100; });
  return { full: f({}), [name]: f(ctrl) }; }
// phi proxy: whole-minus-sum time-lagged mutual information, minimised over bipartitions (plug-in entropies; bias is the same in both arms)
function phi(X: number[], n: number): number { const mi = (mask: number): number => { const a = new Map<number, number>(), b = new Map<number, number>(), ab = new Map<number, number>(); const N = X.length - 1;
    for (let t = 0; t < N; t++) { const p = X[t] & mask, q = X[t + 1] & mask; a.set(p, (a.get(p) || 0) + 1); b.set(q, (b.get(q) || 0) + 1); ab.set(p * 64 + q, (ab.get(p * 64 + q) || 0) + 1); }
    const H = (m: Map<number, number>): number => { let h = 0; for (const c of m.values()) { const p = c / N; h -= p * Math.log2(p); } return h; }; return H(a) + H(b) - H(ab); };
  const full = (1 << n) - 1, I = mi(full); let best = Infinity; for (let m = 1; m < full; m++) { if (m > (full ^ m)) continue; best = Math.min(best, I - mi(m) - mi(full ^ m)); } return best; }
// 4x4 maze: explore, then reach changing goals; one tick per move; lookahead sweeps = 3 x intelligence level
function maze(seed: number, mf: boolean): number { const g = warm(seed); const walls = new Set<string>(); const rr = g.r; for (let k = 0; k < 6; k++) { const s = Math.floor(rr() * 16), a = Math.floor(rr() * 4); walls.add(s + ":" + a); }
  const mv = (s: number, a: number): number => { if (walls.has(s + ":" + a)) return s; const x = s & 3, y = s >> 2; const nx = x + (a === 1 ? 1 : a === 3 ? -1 : 0), ny = y + (a === 2 ? 1 : a === 0 ? -1 : 0); return nx < 0 || ny < 0 || nx > 3 || ny > 3 ? s : ny * 4 + nx; };
  const bfs = (s: number, goal: number): number => { const d = new Array(16).fill(-1); d[s] = 0; const q = [s]; while (q.length) { const u = q.shift() as number; for (let a = 0; a < 4; a++) { const v = mv(u, a); if (d[v] < 0) { d[v] = d[u] + 1; q.push(v); } } } return d[goal]; };
  let s = 0; for (let k = 0; k < 80; k++) { const a = Math.floor(rr() * 4); const s2 = mv(s, a); g.mind.observe(s, a, s2, 0); g.mind.efference = 0.1; g.step(); s = s2; }
  let score = 0; const E = 12; for (let ep = 0; ep < E; ep++) { const goal = Math.floor(rr() * 16); s = Math.floor(rr() * 16); if (s === goal) s = (goal + 5) % 16; const opt = bfs(s, goal); if (opt <= 0) { score += 1 / E; continue; } let steps = 0;
    while (s !== goal && steps < 20) { const a = g.mind.plan(s, goal, g.level, mf, rr); const s2 = mv(s, a); g.mind.observe(s, a, s2, s2 === goal ? 1 : 0); g.mind.efference = 0.1; g.step(); s = s2; steps++; } if (s === goal) score += (opt / steps) / E; }
  led("C11", g); return score; }
// population model for CQM 01-04: genomes -> organism constants; organisms share a food pool; births depend on energy balance
export const EVO_NAN = { n: 0 };
function evo(S: number[]): M { const out: M = {}; const put = (k: string, v: number): void => { (out[k] = out[k] || []).push(v); };
  type Ind = { gn: number[]; parent: number }; const LIFE = 720, GEN = 8, CAP = 8, REGEN = 160;
  const run = (seed: number, mode: "full" | "randomOffspring" | "noMutation" | "fixedBirths" | "randomSurvival") => { let r = (() => { let a = seed * 9973 + 7; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
    const rg = (): number[] => [0, 1, 2, 3].map(() => Math.exp(0.3 * (r() + r() + r() - 1.5) * 2)); let pop: Ind[] = Array.from({ length: 6 }, () => ({ gn: rg(), parent: NaN })); const pool = { food: 300 };
    const pairs: [number, number][] = []; const geno = new Set<string>(); const N: number[] = [], F: number[] = []; let reach = 0;
    for (let gen = 0; gen < GEN; gen++) { pool.food += REGEN; const G = pop.map((ind, i) => mk(seed * 100 + gen * 10 + i, { genes: ind.gn, pool, fat0: 60 }));
      for (let t = 0; t < LIFE; t++) for (const g of G) g.step(); const rate = G.map((g) => g.foraged / LIFE); const bal = G.map((g) => { const b = g.energy() - g.E0; if (!Number.isFinite(b)) EVO_NAN.n++; return Number.isFinite(b) ? b : -1e3; });
      pop.forEach((ind, i) => { if (!Number.isNaN(ind.parent)) pairs.push([ind.parent, rate[i]]); geno.add(ind.gn.map((x) => Math.round(x / 0.25)).join(",")); }); N.push(pop.length); F.push(pool.food);
      reach = mean(pop.map((p) => p.gn[3])); const kids: Ind[] = []; const order = pop.map((_, i) => i).sort((a, b) => (mode === "randomSurvival" ? r() - 0.5 : bal[b] - bal[a]));
      const nb = mode === "fixedBirths" ? 6 : Math.max(2, Math.min(CAP, Math.round(pop.length * (1 + Math.tanh(mean(bal) / 50))))); for (let k = 0; k < nb; k++) { const pi = order[k % Math.max(1, Math.ceil(order.length / 2))] ?? 0; const gn = mode === "randomOffspring" ? rg() : pop[pi].gn.map((x) => (mode === "noMutation" ? x : x * Math.exp(0.15 * (r() + r() + r() - 1.5) * 2)));
        kids.push({ gn, parent: rate[pi] }); } pop = kids; }
    let lagBest = 0; for (let L = 0; L <= 3; L++) lagBest = Math.max(lagBest, Math.abs(corr(N.slice(0, N.length - L), F.slice(L)))); void r;
    return { h: pairs.length > 3 ? corr(pairs.map((p) => p[0]), pairs.map((p) => p[1])) : 0, oe: geno.size, eco: lagBest, reach }; };
  for (const s of S) { const full = run(s, "full"); put("CQM01:full", full.h); put("CQM02:full", full.oe); put("CQM03:full", full.eco); put("CQM04:full", full.reach);
    put("CQM01:offspring genomes random", run(s, "randomOffspring").h); put("CQM02:no mutation", run(s, "noMutation").oe); put("CQM03:births on a fixed schedule", run(s, "fixedBirths").eco); put("CQM04:random survival", run(s, "randomSurvival").reach); }
  return out; }
export function rpt1(S: number[], o: Partial<Opts>): number[] { return S.map((s) => { const g = warm(s, o); let ok = 0; for (let t = 0; t < 160; t++) { const c = Math.floor(g.r() * 4); show(g, oneHot(0, c)); g.step(); blank(g, 2); const p = am(g.mind.post[0]); if (t >= 100) ok += +(p === c); g.mind.teach(0, c); blank(g); } led("RPT1", g); return ok / 60; }); }
