import { Fragment, useEffect, useRef, useState, Button, Toggle, useGrokTheme } from "grok/canvas";
// ===== Creature #1 evaluation harness: seeded functional tests with ablations and controls =====
function gauss(r: Rng): number { const u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v); }
const mean = (a: number[]): number => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a: number[]): number => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
type Cmp = { control: string; full: number; ctrl: number; d: number; t: number; pass: boolean };
function compare(name: string, full: number[], ctrl: number[], higherBetter = true): Cmp {
  const s = higherBetter ? 1 : -1; const m1 = mean(full), m2 = mean(ctrl); const diff = s * (m1 - m2);
  const s1 = sd(full), s2 = sd(ctrl); const sp = Math.sqrt((s1 * s1 + s2 * s2) / 2); const se = Math.sqrt(s1 * s1 / full.length + s2 * s2 / ctrl.length);
  const d = sp > 1e-12 ? diff / sp : (diff > 0 ? Infinity : 0); const t = se > 1e-12 ? diff / se : (diff > 0 ? Infinity : 0);
  return { control: name, full: m1, ctrl: m2, d, t, pass: d >= 0.8 && t >= 2.75 };
}
const SEEDS = Array.from({ length: 16 }, (_, k) => 1000 + k);
const runSeeds = (f: (r: Rng, seed: number) => number, salt: number): number[] => SEEDS.map((s) => f(mulberry(s * 7919 + salt), s));
type Item = { id: string; group: string; name: string; metric: string; mechanism: string; cmps: Cmp[]; pass: boolean; category?: string; note?: string };
function item(id: string, group: string, name: string, metric: string, mechanism: string, cmps: Cmp[], note?: string): Item {
  const pass = cmps.length > 0 && cmps.every((c) => c.pass); const any = cmps.some((c) => c.pass);
  const category = cmps.length === 0 ? "Implementation identified" : pass ? "Bounded test evidence" : any ? "Mixed or restricted" : "Not established";
  return { id, group, name, metric, mechanism, cmps, pass, category, note };
}

// ---------- linear algebra ----------
function ridge(X: number[][], y: number[], lam = 1e-2): number[] {
  const n = X[0].length; const A = Array.from({ length: n }, () => new Float64Array(n + 1));
  for (let r = 0; r < X.length; r++) { const x = X[r]; for (let i = 0; i < n; i++) { A[i][n] += x[i] * y[r]; for (let j = 0; j < n; j++) A[i][j] += x[i] * x[j]; } }
  for (let i = 0; i < n; i++) A[i][i] += lam;
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]];
    const v = A[c][c] || 1e-12; for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / v; if (f) for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; } }
  return Array.from({ length: n }, (_, i) => A[i][n] / (A[i][i] || 1e-12));
}
const dot = (a: number[], b: number[]): number => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
function shuffle<X>(a: X[], r: Rng): X[] { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

// ---------- Reservoir (recurrent module shared by the creature's core) ----------
class Reservoir { n: number; W: number[][]; U: number[][]; h: number[]; bias: number[];
  constructor(n: number, nin: number, r: Rng, rho = 0.9, mask?: (i: number, j: number) => boolean, inMask?: (i: number, k: number) => boolean) {
    this.n = n; this.W = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (mask && !mask(i, j)) ? 0 : gauss(r) * rho / Math.sqrt(n)));
    this.U = Array.from({ length: n }, (_, i) => Array.from({ length: nin }, (_, k) => (inMask && !inMask(i, k)) ? 0 : gauss(r))); this.h = new Array(n).fill(0); this.bias = Array.from({ length: n }, () => gauss(r) * 0.8); }
  reset(): void { this.h.fill(0); }
  step(x: number[]): number[] { const h2 = new Array(this.n); for (let i = 0; i < this.n; i++) h2[i] = Math.tanh(dot(this.W[i], this.h) + dot(this.U[i], x) + this.bias[i]); this.h = h2; return h2; }
}
const feat = (h: number[]): number[] => [...h, 1];
function classifyAcc(trainX: number[][], trainY: number[], testX: number[][], testY: number[]): number { const w = ridge(trainX, trainY, 0.1); let c = 0; for (let i = 0; i < testX.length; i++) if (Math.sign(dot(w, testX[i])) === testY[i]) c++; return c / testX.length; }

// ===== Butlin et al. 2023 indicators =====
function rpt1(): Item { // algorithmic recurrence: delayed recall over 6 noisy steps
  const run = (abl: string) => (r: Rng): number => { const res = new Reservoir(40, 1, r, abl === "norec" ? 0 : 0.95);
    const make = (N: number): [number[][], number[]] => { const X: number[][] = [], Y: number[] = []; for (let k = 0; k < N; k++) { res.reset(); const s = r() < 0.5 ? -1 : 1; let h = res.step([s]); for (let t = 0; t < 6; t++) h = res.step([gauss(r) * 0.3]); X.push(feat(h)); Y.push(s); } return [X, Y]; };
    const [a, b] = make(300); const [c, d] = make(200); return classifyAcc(a, abl === "shuffle" ? shuffle(b, r) : b, c, d); };
  const full = runSeeds(run("full"), 1);
  return item("RPT-1", "Butlin", "Algorithmic recurrence", "delayed-recall accuracy", "recurrent reservoir (ρ=0.95) + ridge readout",
    [compare("recurrence ablated (W=0)", full, runSeeds(run("norec"), 1)), compare("random control: shuffled labels", full, runSeeds(run("shuffle"), 1))]);
}
function rpt2(): Item { // integrated perceptual representations: XOR binding of two channels
  const run = (abl: string) => (r: Rng): number => { const blk = abl === "split"; const res = new Reservoir(40, 2, r, 0.8, blk ? (i, j) => (i < 20) === (j < 20) : undefined, blk ? (i, k) => (i < 20) === (k === 0) : undefined);
    const make = (N: number): [number[][], number[]] => { const X: number[][] = [], Y: number[] = []; for (let k = 0; k < N; k++) { res.reset(); const a = r() < 0.5 ? -1 : 1, b = r() < 0.5 ? -1 : 1; let h: number[] = []; for (let t = 0; t < 3; t++) h = res.step([a + gauss(r) * 0.2, b + gauss(r) * 0.2]); X.push(feat(h)); Y.push(a * b); } return [X, Y]; };
    const [a, b] = make(300); const [c, d] = make(200); return classifyAcc(a, abl === "shuffle" ? shuffle(b, r) : b, c, d); };
  const full = runSeeds(run("full"), 2);
  return item("RPT-2", "Butlin", "Integrated perceptual representations", "feature-binding (XOR) accuracy", "mixed recurrent representation of two channels",
    [compare("ablation: channels segregated (block-diagonal)", full, runSeeds(run("split"), 2)), compare("random control: shuffled labels", full, runSeeds(run("shuffle"), 2))]);
}
// specialist modules: module m is tuned to modality m (template matching on its own channel)
function modulesOut(x: number[][], perm: number[] | null): number[] { return [0, 1, 2].map((m) => { const src = perm ? x[perm[m]] : x[m]; const tpl = [1, -1, 1, -1].map((v, i) => v * (m + 1 === 3 && i > 1 ? -1 : 1)); return dot(src, tpl) / 4; }); }
function gwt1(): Item { // specialization: lesioning module m selectively hurts task m
  const run = (ctrl: boolean) => (r: Rng): number => { const perm = ctrl ? null : null; let own = 0, cross = 0; const N = 200;
    for (let m = 0; m < 3; m++) { let accOwn = 0, accCross = 0;
      for (let k = 0; k < N; k++) { const lab = [0, 1, 2].map(() => (r() < 0.5 ? -1 : 1)); const x = lab.map((l, mm) => { const tpl = [1, -1, 1, -1].map((v, i) => v * (mm + 1 === 3 && i > 1 ? -1 : 1)); return tpl.map((v) => v * l + gauss(r) * 0.8); });
        let out: number[];
        if (ctrl) { // control: one undifferentiated module pool, every unit reads a random mixture of channels
          const mix = [0, 1, 2].map(() => [r(), r(), r()]); out = [0, 1, 2].map((j) => { const tpl = [1, -1, 1, -1].map((v, i) => v * (j + 1 === 3 && i > 1 ? -1 : 1)); return mix[j].reduce((s, w, c) => s + w * dot(x[c], tpl) / 4, 0); }); }
        else out = modulesOut(x, perm);
        const les = out.slice(); les[m] = 0; // lesion module m
        accOwn += (Math.sign(les[m]) === lab[m] ? 1 : 0) - (Math.sign(out[m]) === lab[m] ? 1 : 0);
        const o2 = (m + 1) % 3; accCross += (Math.sign(les[o2]) === lab[o2] ? 1 : 0) - (Math.sign(out[o2]) === lab[o2] ? 1 : 0); }
      own += -accOwn / N; cross += -accCross / N; }
    return (own - cross) / 3; };
  const full = runSeeds(run(false), 3);
  // causal ablation: remove modular wiring -> mixture pool
  return item("GWT-1", "Butlin", "Specialized parallel modules", "selective lesion deficit (own − cross)", "3 modality-tuned specialist modules",
    [compare("random control: unspecialized mixed pool", full, runSeeds(run(true), 3))]);
}
function gwt2(): Item { // limited-capacity workspace with salience competition
  const run = (mode: string) => (r: Rng): number => { let c = 0; const N = 300; for (let k = 0; k < N; k++) { const rel = Math.floor(r() * 4); const lab = r() < 0.5 ? -1 : 1;
      const sig = [0, 1, 2, 3].map((m) => m === rel ? lab * 2 + gauss(r) * 0.5 : (r() < 0.5 ? -1 : 1) * 0.9 + gauss(r) * 0.5);
      const sal = sig.map((s) => Math.abs(s)); let ws: number;
      if (mode === "full") ws = sig[sal.indexOf(Math.max(...sal))]; else if (mode === "nobottleneck") ws = mean(sig); else ws = sig[Math.floor(r() * 4)];
      if (Math.sign(ws) === lab) c++; } return c / N; };
  const full = runSeeds(run("full"), 4);
  return item("GWT-2", "Butlin", "Limited-capacity workspace with selection", "action accuracy amid distractors", "1-slot workspace, salience competition",
    [compare("ablation: no bottleneck (average all modules)", full, runSeeds(run("nobottleneck"), 4)), compare("random control: random module enters workspace", full, runSeeds(run("random"), 4))]);
}
function gwt3(): Item { // global broadcast: module B acts on info only module A perceives
  const run = (mode: string) => (r: Rng): number => { let c = 0; const N = 300; for (let k = 0; k < N; k++) { const cue = r() < 0.5 ? -1 : 1; const aOut = cue + gauss(r) * 0.4;
      const bcast = mode === "full" ? aOut : mode === "off" ? 0 : gauss(r); const bAct = Math.sign(bcast + gauss(r) * 0.05) || (r() < 0.5 ? 1 : -1); if (bAct === cue) c++; } return c / N; };
  const full = runSeeds(run("full"), 5);
  return item("GWT-3", "Butlin", "Global broadcast", "accuracy of a module that only receives broadcast", "workspace content broadcast to all modules",
    [compare("ablation: broadcast cut", full, runSeeds(run("off"), 5)), compare("random control: random broadcast", full, runSeeds(run("rand"), 5))]);
}
function gwt4(): Item { // state-dependent attention for sequential querying
  const run = (mode: string) => (r: Rng): number => { let c = 0; const N = 300; for (let k = 0; k < N; k++) { const v = [0, 1, 2].map(() => (r() < 0.5 ? -1 : 1)); const target = v[0] > 0 ? v[1] : v[2];
      const read1 = v[0] + gauss(r) * 0.3; let q: number; if (mode === "full") q = read1 > 0 ? 1 : 2; else if (mode === "fixed") q = 1; else q = 1 + Math.floor(r() * 2);
      if (Math.sign(v[q] + gauss(r) * 0.3) === target) c++; } return c / N; };
  const full = runSeeds(run("full"), 6);
  return item("GWT-4", "Butlin", "State-dependent attention (sequential queries)", "two-step query accuracy", "workspace state chooses the next module to query",
    [compare("ablation: fixed attention", full, runSeeds(run("fixed"), 6)), compare("random control: random attention", full, runSeeds(run("rand"), 6))]);
}
function protos(r: Rng, K: number, D: number): number[][] { return Array.from({ length: K }, () => Array.from({ length: D }, () => (r() < 0.5 ? -1 : 1))); }
function hot1(): Item { // generative top-down perception: iterative inference with learned prototypes
  const run = (mode: string) => (r: Rng): number => { const D = 16, K = 6; const P = protos(r, K, D);
    // learn prototypes from noisy samples (online mean)
    const L = P.map(() => new Array(D).fill(0)); for (let k = 0; k < 300; k++) { const c = Math.floor(r() * K); for (let i = 0; i < D; i++) L[c][i] += (P[c][i] + gauss(r) * 0.8 - L[c][i]) * 0.05; }
    const model = mode === "randprior" ? protos(r, K, D) : L; let err = 0; const N = 200;
    for (let k = 0; k < N; k++) { const c = Math.floor(r() * K); const x = P[c].map((v) => v + gauss(r) * 1.0); let est = x.slice();
      if (mode !== "bottomup") for (let it = 0; it < 5; it++) { const sims = model.map((p) => dot(p, est)); const mx = Math.max(...sims); const w = sims.map((s) => Math.exp((s - mx) * 0.5)); const z = w.reduce((a, b) => a + b, 0);
        const prior = new Array(D).fill(0); model.forEach((p, j) => p.forEach((v, i) => prior[i] += v * w[j] / z)); est = est.map((v, i) => 0.3 * x[i] + 0.7 * prior[i]); }
      err += P[c].reduce((s, v, i) => s + (v - est[i]) ** 2, 0) / D; } return -err / N; };
  const full = runSeeds(run("full"), 7);
  return item("HOT-1", "Butlin", "Generative, top-down / noisy perception", "−reconstruction MSE", "learned generative prototypes refine noisy input",
    [compare("ablation: bottom-up only", full, runSeeds(run("bottomup"), 7)), compare("random control: random generative prior", full, runSeeds(run("randprior"), 7))]);
}
function auroc(conf: number[], correct: boolean[]): number { let n1 = 0, n0 = 0, s = 0; const idx = conf.map((c, i) => [c, i]).sort((a, b) => a[0] - b[0]); idx.forEach(([, i], rank) => { if (correct[i]) { n1++; s += rank + 1; } else n0++; }); return n1 && n0 ? (s - n1 * (n1 + 1) / 2) / (n1 * n0) : 0.5; }
function firstOrder(r: Rng, N: number) { const out: { conf: number; ok: boolean; margin: number }[] = []; for (let k = 0; k < N; k++) { const lab = r() < 0.5 ? -1 : 1; const noise = 0.3 + r() * 2; const x = lab * 0.8 + gauss(r) * noise; const est = Math.sign(x) || 1;
    // second-order monitor: learned reliability = |x| scaled by estimated noise of the trial (observed via a second sample)
    const x2 = lab * 0.8 + gauss(r) * noise; const conf = Math.abs(x + x2) / (Math.abs(x - x2) + 0.3); out.push({ conf, ok: est === lab, margin: x }); } return out; }
function hot2(): Item { const run = (mode: string) => (r: Rng): number => { const t = firstOrder(r, 400); const conf = mode === "full" ? t.map((o) => o.conf) : mode === "const" ? t.map(() => 1) : shuffle(t.map((o) => o.conf), r); return auroc(conf, t.map((o) => o.ok)); };
  const full = runSeeds(run("full"), 8);
  return item("HOT-2", "Butlin", "Metacognitive monitoring", "type-2 AUROC", "second-order monitor estimates reliability from sample consistency",
    [compare("ablation: monitor removed (constant confidence)", full, runSeeds(run("const"), 8)), compare("random control: shuffled confidence", full, runSeeds(run("shuf"), 8))]); }
function hot3(): Item { const run = (mode: string) => (r: Rng): number => { const train = firstOrder(r, 300); const test = firstOrder(r, 300);
    // belief-guided policy: learn threshold that maximizes reward on train (opt-out pays 0.2)
    let best = 0, bestR = -1e9; for (const th of [0.2, 0.4, 0.6, 0.8, 1, 1.3, 1.6, 2, 2.5, 3]) { const R = train.reduce((s, o) => s + (o.conf < th ? 0.2 : o.ok ? 1 : -1), 0); if (R > bestR) { bestR = R; best = th; } }
    const optRate = train.filter((o) => o.conf < best).length / train.length;
    return test.reduce((s, o) => s + (mode === "full" ? (o.conf < best ? 0.2 : o.ok ? 1 : -1) : mode === "never" ? (o.ok ? 1 : -1) : (r() < optRate ? 0.2 : o.ok ? 1 : -1)), 0) / test.length; };
  const full = runSeeds(run("full"), 9);
  return item("HOT-3", "Butlin", "Agency guided by metacognitive belief", "reward per trial with opt-out", "confidence-gated action selection (learned threshold)",
    [compare("ablation: no metacognitive gating", full, runSeeds(run("never"), 9)), compare("random control: random opt-out at same rate", full, runSeeds(run("rand"), 9))]); }
function spearman(a: number[], b: number[]): number { const rk = (v: number[]) => { const o = v.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]); const rr = new Array(v.length); o.forEach(([, i], k) => rr[i] = k); return rr; }; const x = rk(a), y = rk(b); const mx = mean(x), my = mean(y); let s = 0, sx = 0, sy = 0; for (let i = 0; i < x.length; i++) { s += (x[i] - mx) * (y[i] - my); sx += (x[i] - mx) ** 2; sy += (y[i] - my) ** 2; } return s / Math.sqrt(sx * sy); }
function hot4(): Item { const run = (mode: string) => (r: Rng): number => { const M = 64, k = 8; const C = Array.from({ length: M }, () => [r() * 2 - 1, r() * 2 - 1]);
    const enc = (p: number[]): number[] => { if (mode === "hash") { const rr = mulberry(Math.floor((p[0] + 2) * 1e6) ^ Math.floor((p[1] + 2) * 1e3)); const v = new Array(M).fill(0); for (let i = 0; i < k; i++) v[Math.floor(rr() * M)] = 1; return v; }
      const a = C.map((c) => Math.exp(-((c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2) / 0.08)); const th = a.slice().sort((x, y) => y - x)[k - 1]; return a.map((v) => (v >= th ? v : 0)); };
    const pts = Array.from({ length: 40 }, () => [r() * 1.6 - 0.8, r() * 1.6 - 0.8]); const E = pts.map(enc); const di: number[] = [], dr: number[] = [];
    for (let i = 0; i < 40; i++) for (let j = i + 1; j < 40; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d > 0.6) continue; di.push(d); const ni = Math.hypot(...E[i]) || 1, nj = Math.hypot(...E[j]) || 1; dr.push(1 - dot(E[i], E[j]) / (ni * nj)); }
    return spearman(di, dr); };
  const full = runSeeds(run("full"), 10);
  return item("HOT-4", "Butlin", "Sparse and smooth coding (quality space)", "Spearman ρ(stimulus distance, code distance)", "k-WTA sparse RBF population code (8 of 64 active)",
    [compare("random control: sparse random hash code", full, runSeeds(run("hash"), 10))]); }
// attention schema: Kalman model of own attention + hidden drift
let ASTU = 1; export function setASTU(v: number) { ASTU = v; }
let ASTM = 0.9, ASTG = 3, ASTA = 0.001; export function setAST(m: number, g: number, a = ASTA) { ASTM = m; ASTG = g; ASTA = a; }
function attnRunTrace(r: Rng, rec: number[]): number { return attnRun(r, "full", false, rec); }
function attnRun(r: Rng, mode: string, social: boolean, rec?: number[]): number { let a = 0, d = 0; let ea = 0, ed = 0; let P00 = 1, P01 = 0, P11 = 1; let err = 0; const T = 300; const Rn = 0.5, Qd = 0.0064; let infl = 1;
  const phi = mode === "randschema" ? r() * 0.5 : 0.98; const fa = social ? 0.9 : 1;
  for (let t = 0; t < T; t++) { const obs = a + gauss(r) * Math.sqrt(Rn);
    // schema update with observation (state [a, d])
    const S = P00 + Rn; const inn = obs - ea; infl = Math.max(1, ASTM * infl + (1 - ASTM) * inn * inn / S); /* schema monitors its own surprise (normalized innovation) */ const K0 = P00 / S, K1 = P01 / S; ea += K0 * inn; ed += K1 * inn; const n00 = (1 - K0) * P00, n01 = (1 - K0) * P01, n11 = P11 - K1 * P01; P00 = n00; P01 = n01; P11 = n11;
    let u = 0; if (!social) { u = mode === "noschema" ? -0.5 * obs : -(ea + (mode === "full" ? ASTU : 1) * ed); u = Math.max(-1, Math.min(1, u)); }
    if (social) err += mode === "noschema" ? (obs - a) ** 2 : (ea - a) ** 2;
    d = 0.98 * d + gauss(r) * 0.08; a = fa * a + u + d; if (!social) err += a * a; if (rec) rec.push(err);
    // schema predict: a' = fa*a + u + phi*d ; d' = phi*d
    ea = fa * ea + u + phi * ed; ed = phi * ed; const p00 = fa * fa * P00 + 2 * fa * phi * P01 + phi * phi * P11, p01 = fa * phi * P01 + phi * phi * P11, p11 = phi * phi * P11 + Qd; P00 = p00 + 1e-4 + ASTA * (infl - 1); P01 = p01; P11 = p11 + ASTG * Qd * (infl - 1); /* surprise inflates drift uncertainty and the schema's uncertainty about its own focus */ }
  return -err / T; }
function ast1(): Item { const run = (mode: string) => (r: Rng): number => attnRun(r, mode, false); const full = runSeeds(run("full"), 11);
  return item("AST-1", "Butlin", "Predictive model of attention (attention schema)", "−attention tracking error", "Kalman attention schema estimates focus + hidden drift, monitors its own surprise (NIS) to inflate both focus and drift uncertainty, and steers attention",
    [compare("ablation: schema removed (raw reactive control)", full, runSeeds(run("noschema"), 11)), compare("random control: random schema parameters", full, runSeeds(run("randschema"), 11))]); }
function pp1(): Item { const run = (mode: string) => (r: Rng): number => { const N = 600; const x: number[] = [0, 0]; for (let t = 2; t < N; t++) x.push(1.6 * x[t - 1] - 0.8 * x[t - 2] + gauss(r) * 0.3);
    const seq = mode === "shufftime" ? shuffle(x, r) : x; let w = [0, 0, 0]; for (let t = 2; t < N; t++) { const f = [seq[t - 1], seq[t - 2], 1]; const e = seq[t] - dot(w, f); if (mode !== "frozen") w = w.map((v, i) => v + 0.01 * e * f[i] / (1 + dot(f, f))); }
    let err = 0; for (let t = N - 200; t < N; t++) { const f = [x[t - 1], x[t - 2], 1]; err += (x[t] - dot(w, f)) ** 2; } return -err / 200; };
  const full = runSeeds(run("full"), 12);
  return item("PP-1", "Butlin", "Predictive coding input module", "−next-input prediction MSE", "prediction-error-driven (NLMS) sensory predictor",
    [compare("ablation: prediction errors not used (frozen)", full, runSeeds(run("frozen"), 12)), compare("random control: trained on time-shuffled input", full, runSeeds(run("shufftime"), 12))]); }
function ae1(): Item { const run = (mode: string) => (r: Rng): number => { let p = [0.8, 0.5, 0.2]; const Q = [0, 0, 0]; let tot = 0; const T = 600;
    for (let t = 0; t < T; t++) { if (t % 150 === 149) p = shuffle(p, r); let a: number; if (mode === "random") a = Math.floor(r() * 3); else { const z = Q.map((q) => Math.exp(q * 6)); const s = z.reduce((x, y) => x + y, 0); let u = r() * s; a = 0; while (u > z[a] && a < 2) { u -= z[a]; a++; } }
      const rew = r() < p[a] ? 1 : 0; tot += rew; const fb = mode === "shuffbf" ? (r() < 0.5 ? 1 : 0) : rew; Q[a] += 0.15 * (fb - Q[a]); } return tot / T; };
  const full = runSeeds(run("full"), 13);
  return item("AE-1", "Butlin", "Agency: learning from feedback to pursue goals", "reward rate under reversals", "Q-learning with softmax selection",
    [compare("ablation: feedback replaced by noise", full, runSeeds(run("shuffbf"), 13)), compare("random control: random policy", full, runSeeds(run("random"), 13))]); }
// embodiment / sensorimotor contingencies
function smRun(r: Rng, mode: string, measure: "reach" | "percept" | "adapt" | "plan"): number { const G = [[0.8 + r() * 0.6, (r() - 0.5) * 0.6], [(r() - 0.5) * 0.6, 0.8 + r() * 0.6]]; let Gh = [[0.1, 0], [0, 0.1]];
  let pos = [0, 0]; let err = 0; let cnt = 0; const T = 400;
  for (let t = 0; t < T; t++) { if (measure === "adapt" && t === 200) { G[0][0] *= -1; G[1][1] *= -1; }
    const tgt = [Math.sin(t * 0.07) * 0.8, Math.cos(t * 0.05) * 0.8]; const det = Gh[0][0] * Gh[1][1] - Gh[0][1] * Gh[1][0];
    let u = [(tgt[0] - pos[0]), (tgt[1] - pos[1])]; if (Math.abs(det) > 1e-3) { const inv = [[Gh[1][1] / det, -Gh[0][1] / det], [-Gh[1][0] / det, Gh[0][0] / det]]; u = [inv[0][0] * u[0] + inv[0][1] * u[1], inv[1][0] * u[0] + inv[1][1] * u[1]]; }
    u = u.map((v) => Math.max(-0.5, Math.min(0.5, v)) + gauss(r) * 0.05); const realDelta = [G[0][0] * u[0] + G[0][1] * u[1], G[1][0] * u[0] + G[1][1] * u[1]];
    pos = [pos[0] + realDelta[0], pos[1] + realDelta[1]].map((v) => Math.max(-2, Math.min(2, v)));
    const sensed = mode === "scrambled" ? [gauss(r) * 0.3, gauss(r) * 0.3] : realDelta.map((v) => v + gauss(r) * 0.02);
    const pred = [Gh[0][0] * u[0] + Gh[0][1] * u[1], Gh[1][0] * u[0] + Gh[1][1] * u[1]]; const e = [sensed[0] - pred[0], sensed[1] - pred[1]]; const nu = dot(u, u) + 0.01;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) Gh[i][j] += 0.3 * e[i] * u[j] / nu;
    if (measure === "percept") { err += (realDelta[0] - pred[0]) ** 2 + (realDelta[1] - pred[1]) ** 2; cnt++; }
    else if (measure === "adapt") { if (t >= 200 && t < 260) { err += (tgt[0] - pos[0]) ** 2 + (tgt[1] - pos[1]) ** 2; cnt++; } }
    else if (t > T / 2) { err += (tgt[0] - pos[0]) ** 2 + (tgt[1] - pos[1]) ** 2; cnt++; } }
  if (measure === "plan") { // multi-step planning: reach a far goal in 6 steps using the learned model only (open loop)
    const goal = [1.2, -0.9]; let p = [0, 0]; const det = Gh[0][0] * Gh[1][1] - Gh[0][1] * Gh[1][0];
    for (let s = 0; s < 6; s++) { let u = [(goal[0] - p[0]) / (6 - s), (goal[1] - p[1]) / (6 - s)]; if (Math.abs(det) > 1e-3) { const inv = [[Gh[1][1] / det, -Gh[0][1] / det], [-Gh[1][0] / det, Gh[0][0] / det]]; u = [inv[0][0] * u[0] + inv[0][1] * u[1], inv[1][0] * u[0] + inv[1][1] * u[1]]; }
      u = u.map((v) => Math.max(-0.5, Math.min(0.5, v))); p = [p[0] + G[0][0] * u[0] + G[0][1] * u[1], p[1] + G[1][0] * u[0] + G[1][1] * u[1]]; }
    return -Math.hypot(goal[0] - p[0], goal[1] - p[1]); }
  return -err / cnt; }
function ae2(): Item { const run = (mode: string) => (r: Rng): number => smRun(r, mode, "reach"); const full = runSeeds(run("full"), 14);
  return item("AE-2", "Butlin", "Embodiment: modelling output→input contingencies", "−reaching error", "learned forward model of motor→sensory gain, inverted for control",
    [compare("ablation: action-sensory contingency scrambled", full, runSeeds(run("scrambled"), 14))]); }

// ===== Frameworks =====
function thaler(): Item { // creativity machine: perturbed generator + critic
  const score = (r: Rng, noise: number): number => { const D = 6; const good = Array.from({ length: D }, () => r() * 2 - 1); const train = Array.from({ length: 20 }, () => good.map((g) => g * 0.3 + gauss(r) * 0.2));
    const W = Array.from({ length: D }, () => Array.from({ length: D }, () => gauss(r) * 0.4)); let tot = 0; const N = 200;
    for (let k = 0; k < N; k++) { const base = train[Math.floor(r() * train.length)]; const Wn = W.map((row) => row.map((w) => w + gauss(r) * noise)); const idea = base.map((b, i) => Math.tanh(b + dot(Wn[i], base) * noise * 2));
      const novelty = Math.min(...train.map((t) => Math.hypot(...t.map((v, i) => v - idea[i])))); const useful = Math.exp(-(Math.hypot(...good.map((g, i) => g - idea[i])) ** 2) / 2); tot += novelty * useful; } return tot / N; };
  const lo = runSeeds((r) => score(r, 0.0), 20), mid = runSeeds((r) => score(r, 0.35), 20), hi = runSeeds((r) => score(r, 3.0), 20);
  const learn = (mode: string) => (r: Rng): number => { const D = 6; const good = Array.from({ length: D }, () => r() * 2 - 1); let mu = new Array(D).fill(0); const vals: number[] = [];
    for (let it = 0; it < 300; it++) { const idea = mu.map((m) => m + gauss(r) * 0.4); const val = -Math.hypot(...good.map((g, i) => g - idea[i])); vals.push(val);
      const v = mode === "shuf" ? vals[Math.floor(r() * vals.length)] : val; const base = mean(vals.slice(-30)); mu = mu.map((m, i) => m + 0.05 * (v - base) * (idea[i] - m)); }
    return -Math.hypot(...good.map((g, i) => g - mu[i])); };
  const vf = runSeeds(learn("full"), 21);
  return item("thaler9", "Framework", "Thaler creativity machine (DABUS-style)", "novelty×usefulness; −distance to valued region", "noise-perturbed generator + critic; critic valence gates reinforcement",
    [compare("inverted-U: mid noise vs low noise", mid, lo), compare("inverted-U: mid noise vs high noise", mid, hi), compare("valence-steered learning vs shuffled valence", vf, runSeeds(learn("shuf"), 21))]); }
// IIT phi proxy on a 6-node stochastic binary network (coarse-grained subsystem).
// v3 mechanism: units have thresholds (bias), and the recurrent weights are shaped by plasticity
// (stochastic hill-climbing on XOR decodability of a training stream). The partition ablation cuts the trained net.
const IN = 6;
function iitStep(W: number[][], st: number[], inp: number[], r: Rng): number[] { return st.map((_, i) => { let h = 0; for (let j = 0; j < IN; j++) h += i === j ? W[i][i] : W[i][j] * (st[j] * 2 - 1); h += i === 0 ? (inp[0] * 2 - 1) * 1.5 : i === 3 ? (inp[1] * 2 - 1) * 1.5 : 0; return r() < 1 / (1 + Math.exp(-2 * h)) ? 1 : 0; }); }
function iitXor(W: number[][], r: Rng, N: number): number { const X: number[][] = [], Y: number[] = []; let st = new Array(IN).fill(0); for (let t = 0; t < N; t++) { const inp = [r() < 0.5 ? 1 : 0, r() < 0.5 ? 1 : 0]; for (let rep = 0; rep < 2; rep++) st = iitStep(W, st, inp, r); X.push([...st.map((v) => v * 2 - 1), 1]); Y.push(inp[0] === inp[1] ? 1 : -1); }
  const k = Math.floor(N * 2 / 3); return classifyAcc(X.slice(0, k), Y.slice(0, k), X.slice(k), Y.slice(k)); }
function iitPhi(W: number[][], r: Rng, T = 6000): number { let s: number[] = Array.from({ length: IN }, () => (r() < 0.5 ? 1 : 0)); const pairs: [number, number][] = []; const code = (v: number[]) => v.reduce((a, b, i) => a | (b << i), 0);
  for (let t = 0; t < T; t++) { const inp = [r() < 0.5 ? 1 : 0, r() < 0.5 ? 1 : 0]; const s2 = iitStep(W, s, inp, r); pairs.push([code(s), code(s2)]); s = s2; }
  const mi = (mask: number): number => { const m = new Map<number, number>(), ma = new Map<number, number>(), mb = new Map<number, number>(); for (const [a, b] of pairs) { const x = a & mask, y = b & mask; m.set(x * 64 + y, (m.get(x * 64 + y) || 0) + 1); ma.set(x, (ma.get(x) || 0) + 1); mb.set(y, (mb.get(y) || 0) + 1); }
    let I = 0; const N = pairs.length; m.forEach((c, k) => { const x = Math.floor(k / 64), y = k % 64; I += c / N * Math.log2(c * N / ((ma.get(x) as number) * (mb.get(y) as number))); }); return I; };
  const whole = mi(63); let mn = Infinity; for (let mask = 1; mask < 32; mask++) mn = Math.min(mn, whole - mi(mask) - mi(63 ^ mask)); return Math.max(0, mn); }
let IITA = 0.1; export function setIITA(a: number) { IITA = a; }
const iitCache = new Map<number, { pf: number; pc: number; bf: number; bc: number }>();
function phiProxy(seed: number): { pf: number; pc: number; bf: number; bc: number } { const hit = iitCache.get(seed); if (hit) return hit; const r = mulberry(seed * 31 + 1);
  let W = Array.from({ length: IN }, (_, i) => Array.from({ length: IN }, (_, j) => (i === j ? 0 : (r() < 0.6 ? (r() < 0.5 ? -1 : 1) * (1 + r()) : 0))));
  const fit = (w: number[][]) => iitXor(w, r, 600) + IITA * iitPhi(w, r, 1500); /* plasticity rewards both task decoding and integration */ let best = fit(W); for (let it = 0; it < 400; it++) { const W2 = W.map((row) => row.map((v) => Math.max(-4, Math.min(4, v + (r() < 0.3 ? gauss(r) * 0.8 : 0))))); const a = fit(W2); if (a > best) { best = 0.5 * (a + fit(W2)); W = W2; } }
  const Wc = W.map((row, i) => row.map((v, j) => ((i < 3) !== (j < 3) ? 0 : v)));
  const res = { pf: iitPhi(W, r), pc: iitPhi(Wc, r), bf: iitXor(W, r, 1500), bc: iitXor(Wc, r, 1500) }; iitCache.set(seed, res); return res; }
function iit(): Item { const R = SEEDS.map(phiProxy);
  return item("iit4", "Framework", "IIT 4.0 (phi proxy, coarse-grained 6-node subsystem)", "min-bipartition integration (bits); XOR decoding", "stochastic recurrent binary network with thresholds; weights shaped by plasticity; MIP over bipartitions",
    [compare("partition reduces integration (cut vs intact)", R.map((x) => x.pf), R.map((x) => x.pc)), compare("partition reduces behavior (XOR decoding)", R.map((x) => x.bf), R.map((x) => x.bc))],
    "phi proxy = I(whole_t;whole_t+1) − min over bipartitions of Σ I(part_t;part_t+1); not IIT 4.0's full Φ. Partition = trained network with cross-half edges removed"); }
// expected free energy by depth-limited expectimax over beliefs: G = −P(food found) + λ·E[surprise]
function efePlan(b: number[], e: number, depth: number, lam: number): { v: number; act: ["look" | "go", number] } {
  const nz = (v: number[]) => { const z = v.reduce((s, p) => s + p, 0); return v.map((p) => p / z); }; const leaf = (bb: number[], ee: number) => { const k = Math.floor(ee / 1.5 + 1e-9); return bb.slice().sort((x, y) => y - x).slice(0, k).reduce((s, p) => s + p, 0); };
  let best = { v: -Infinity, act: ["go", 0] as ["look" | "go", number] };
  for (let loc = 0; loc < 4; loc++) {
    if (e >= 1.5 - 1e-9 && b[loc] > 0) { const pf = b[loc]; let v = pf; const sGo = -(pf > 0 ? pf * Math.log(pf) : 0) - (1 - pf > 1e-12 ? (1 - pf) * Math.log(1 - pf) : 0);
      if (1 - pf > 1e-9) { const b2 = nz(b.map((p, i) => (i === loc ? 0 : p))); v += (1 - pf) * (depth > 1 ? efePlan(b2, e - 1.5, depth - 1, lam).v : leaf(b2, e - 1.5)); }
      v -= lam * sGo; if (v > best.v) best = { v, act: ["go", loc] }; }
    if (e >= 0.5 && depth > 1) { const pPos = b[loc] * 0.9 + (1 - b[loc]) * 0.1; let v = 0, H = 0;
      for (const o of [true, false]) { const po = o ? pPos : 1 - pPos; if (po < 1e-9) continue; H -= po * Math.log(po); v += po * efePlan(nz(b.map((p, i) => p * ((i === loc) === o ? 0.9 : 0.1))), e - 0.5, depth - 1, lam).v; }
      v -= lam * H; if (v > best.v) best = { v, act: ["look", loc] }; } }
  if (best.v === -Infinity) return { v: leaf(b, e), act: ["go", b.indexOf(Math.max(...b))] }; return best; }
function activeInf(): Item { const run = (mode: string, metric: string) => (r: Rng): number => { let survive = 0, pe = 0; const E = 60;
    for (let ep = 0; ep < E; ep++) { const food = Math.floor(r() * 4); let b = [0.4, 0.3, 0.2, 0.1]; let energy = 6; let found = false;
      while (energy > 0 && !found) { let act: "look" | "go"; let loc: number;
        if (mode === "random") { act = r() < 0.5 ? "look" : "go"; loc = Math.floor(r() * 4); }
        else if (mode === "passive") { act = "go"; loc = b.indexOf(Math.max(...b)); }
        else { [act, loc] = efePlan(b, energy, 4, 0.02).act; } // expected free energy: pragmatic (P found) + epistemic/surprise terms, 4-step lookahead
        energy -= act === "look" ? 0.5 : 1.5;
        if (act === "look") { const o = (loc === food) !== (r() < 0.1); const lik = b.map((_, i) => ((i === loc) === o ? 0.9 : 0.1)); const z = b.reduce((s, p, i) => s + p * lik[i], 0); pe += -Math.log(z); b = b.map((p, i) => p * lik[i] / z); }
        else { if (loc === food) found = true; else { pe += -Math.log(Math.max(1e-3, 1 - b[loc])); b = b.map((p, i) => (i === loc ? 0 : p)); const z = b.reduce((s, p) => s + p, 0); b = b.map((p) => p / z); } } }
      if (found) survive++; pe += -Math.log(Math.max(1e-3, b[food])); }
    return metric === "viab" ? survive / E : -pe / E; };
  const fv = runSeeds(run("full", "viab"), 30), fp = runSeeds(run("full", "pe"), 30);
  return item("activeInference", "Framework", "Free energy / active inference", "viability (food found); −surprise", "Bayesian belief + expected-free-energy planner (4-step expectimax over beliefs, info gain and surprise terms)",
    [compare("viability vs random policy", fv, runSeeds(run("random", "viab"), 30)), compare("viability vs passive policy", fv, runSeeds(run("passive", "viab"), 30)),
     compare("prediction error vs random policy", fp, runSeeds(run("random", "pe"), 30)), compare("prediction error vs passive policy", fp, runSeeds(run("passive", "pe"), 30))]); }
function astFw(): Item { const ctl = (m: string) => (r: Rng): number => attnRun(r, m, false), soc = (m: string) => (r: Rng): number => attnRun(r, m, true);
  return item("attentionSchema", "Framework", "Attention Schema Theory", "−attention control error; −error predicting another agent's attention", "same Kalman schema applied to self and to another agent",
    [compare("control: schema removed, attention kept", runSeeds(ctl("full"), 40), runSeeds(ctl("noschema"), 40)), compare("social: schema removed", runSeeds(soc("full"), 41), runSeeds(soc("noschema"), 41))]); }
function cemi(): Item { const run = (mode: string, K: number) => (r: Rng): number => { let c = 0; const N = 80;
    for (let k = 0; k < N; k++) { // 2 objects x 2 features (color, shape); 4 oscillators; coupling within object
      const swap = r() < 0.5; const obj = swap ? [0, 1, 1, 0] : [0, 1, 0, 1]; // osc 0,1 colors; 2,3 shapes
      const th = [0, 1, 2, 3].map(() => r() * 6.283); const w = [0, 1, 2, 3].map(() => 1 + gauss(r) * 0.1);
      for (let t = 0; t < 200; t++) { const d = th.map((ti, i) => w[i] + th.reduce((s, tj, j) => s + (i !== j && obj[i] === obj[j] ? K * Math.sin(tj - ti) : 0), 0) + gauss(r) * 0.15); for (let i = 0; i < 4; i++) th[i] += d[i] * 0.05; }
      const ph = mode === "shuffle" ? th.map(() => r() * 6.283) : th; const sim = (a: number, b: number) => Math.cos(ph[a] - ph[b]);
      const guessSwap = sim(0, 3) + sim(1, 2) > sim(0, 2) + sim(1, 3); if (guessSwap === swap) c++; } return c / N; };
  const full = runSeeds(run("full", 1.5), 50);
  const coh = (r: Rng): number => { const Ks = [0, 0.2, 0.5, 1, 1.5]; const acc = Ks.map((K) => run("full", K)(r)); return spearman(Ks, acc); };
  return item("fieldIntegration", "Framework", "CEMI field integration (oscillator-field model)", "feature-binding accuracy; ρ(coherence, accuracy)", "Kuramoto field; binding read out from phase synchrony",
    [compare("phase-shuffled field", full, runSeeds(run("shuffle", 1.5), 50)), compare("coherence alters behavior: ρ(coupling→coherence, accuracy) vs 0", runSeeds(coh, 51), SEEDS.map(() => 0))],
    "a simulated oscillator field, not an electromagnetic field"); }
function ual(): Item { // compound (negative patterning), trace (delayed), flexible (serial reversal)
  const np = (mode: string) => (r: Rng): number => { const stim = [[1, 0], [0, 1], [1, 1], [0, 0]]; const y = [1, 1, 0, 0]; const conf = (s: number[]) => mode === "ual" ? [s[0], s[1], s[0] * s[1], 1] : [s[0], s[1], 1]; let w = new Array(mode === "ual" ? 4 : 3).fill(0);
    for (let k = 0; k < 600; k++) { const i = Math.floor(r() * 4); const f = conf(stim[i]); const e = y[i] - dot(w, f); w = w.map((v, j) => v + 0.1 * e * f[j]); }
    return stim.reduce((s, st, i) => s + ((dot(w, conf(st)) > 0.5 ? 1 : 0) === y[i] ? 1 : 0), 0) / 4; };
  const trace = (mode: string) => (r: Rng): number => { let w = [0, 0]; let acc = 0; for (let k = 0; k < 300; k++) { const cs = r() < 0.5 ? 1 : 0; let tr = 0; for (let t = 0; t < 4; t++) tr = mode === "ual" ? (t === 0 ? cs : tr * 0.8) : (t === 0 ? cs : 0);
      const f = [tr, 1]; const us = cs; const p = dot(w, f); if (k >= 200) acc += ((p > 0.5 ? 1 : 0) === us ? 1 : 0); w = w.map((v, j) => v + 0.1 * (us - p) * f[j]); } return acc / 100; };
  const rev = (mode: string) => (r: Rng): number => { const w = [0.5, 0.5]; let errs = 0, n = 0; let good = 0;
    // Bayesian latent-cause learner: 2 latent contexts, Beta counts per (context, action), belief bc = P(context 0), hazard prior 0.05
    const A = [[1, 1], [1, 1]], B = [[1, 1], [1, 1]]; let bc = 1; const hz = 0.05; const m = (c: number, x: number) => A[c][x] / (A[c][x] + B[c][x]);
    for (let k = 0; k < 800; k++) { if (k % 80 === 0 && k) good = 1 - good; let a: number;
      if (mode === "ual") { const v0 = bc * m(0, 0) + (1 - bc) * m(1, 0), v1 = bc * m(0, 1) + (1 - bc) * m(1, 1); a = v0 === v1 ? Math.floor(r() * 2) : (v0 > v1 ? 0 : 1); }
      else a = w[0] === w[1] ? Math.floor(r() * 2) : (w[0] > w[1] ? 0 : 1);
      const rew = a === good ? (r() < 0.9 ? 1 : 0) : (r() < 0.1 ? 1 : 0); if (k >= 400 && k % 80 < 15) { errs += a !== good ? 1 : 0; n++; }
      if (mode === "ual") { const l0 = rew ? m(0, a) : 1 - m(0, a), l1 = rew ? m(1, a) : 1 - m(1, a); const post = bc * l0 / (bc * l0 + (1 - bc) * l1);
        if (rew) { A[0][a] += post; A[1][a] += 1 - post; } else { B[0][a] += post; B[1][a] += 1 - post; } bc = post * (1 - hz) + (1 - post) * hz; }
      else w[a] += 0.2 * (rew - w[a]); } return -errs / n; };
  return item("ual", "Framework", "Unlimited Associative Learning", "compound / trace / reversal performance", "configural units + eligibility traces + Bayesian latent-cause inference (2 contexts, Beta value counts)",
    [compare("compound (negative patterning) vs simple conditioning (Rescorla–Wagner)", runSeeds(np("ual"), 60), runSeeds(np("rw"), 60)),
     compare("trace (delayed) conditioning vs simple conditioning", runSeeds(trace("ual"), 61), runSeeds(trace("rw"), 61)),
     compare("serial reversal errors vs simple conditioning", runSeeds(rev("ual"), 62), runSeeds(rev("rw"), 62))]); }
function sensorimotor(): Item { const f = (m: string, me: "percept" | "plan" | "adapt") => (r: Rng): number => smRun(r, m, me);
  return item("sensorimotor", "Framework", "Sensorimotor enactivism", "−perception / planning / adaptation error", "learned sensorimotor contingency model",
    [compare("perception: scrambled laws", runSeeds(f("full", "percept"), 70), runSeeds(f("scrambled", "percept"), 70)), compare("planning: scrambled laws", runSeeds(f("full", "plan"), 71), runSeeds(f("scrambled", "plan"), 71)),
     compare("adaptation after gain reversal: scrambled laws", runSeeds(f("full", "adapt"), 72), runSeeds(f("scrambled", "adapt"), 72))]); }
function projective(): Item { const persp = (mode: string) => (r: Rng): number => { let c = 0; for (let k = 0; k < 200; k++) { const th = r() * 6.283; const ox = r() * 2 - 1, oy = r() * 2 - 1; const qx = r() * 2 - 1, qy = r() * 2 - 1;
      const dx = qx - ox, dy = qy - oy; const truth = Math.sign(Math.cos(th) * dy - Math.sin(th) * dx); // left(+) in other's frame
      const ans = mode === "proj" ? Math.sign(Math.cos(th) * dy - Math.sin(th) * dx + gauss(r) * 0.05) : Math.sign(dy); if (ans === truth) c++; } return c / 200; };
  const own = (mode: string) => (r: Rng): number => { let c = 0; for (let k = 0; k < 200; k++) { const self = r() < 0.5; const u = gauss(r); const ext = gauss(r); const s = self ? 0.9 * u + gauss(r) * 0.2 : ext; const pred = 0.9 * u;
      const guess = mode === "proj" ? Math.abs(s - pred) < 0.45 : Math.abs(s) < 0.7; if (guess === self) c++; } return c / 200; };
  return item("projective", "Framework", "Projective Consciousness Model", "perspective-taking accuracy; ownership accuracy", "projective transform into other's frame; efference-copy ownership",
    [compare("perspective: projective frame vs flat egocentric", runSeeds(persp("proj"), 80), runSeeds(persp("flat"), 80)), compare("ownership: projective efference model vs flat magnitude", runSeeds(own("proj"), 81), runSeeds(own("flat"), 81))]); }
function ctm(): Item { const run = (mode: string, metric: string) => (r: Rng): number => { let rep = 0, coh = 0; const T = 300; let prev = -1; const ctxW = [0, 0, 0, 0, 0, 0];
    for (let t = 0; t < T; t++) { const chunks = [0, 1, 2, 3, 4, 5].map((i) => ({ i, v: (r() < 0.5 ? -1 : 1), w: Math.abs(gauss(r)) + ctxW[i] }));
      let winner: { i: number; v: number; w: number }; let action: number;
      if (mode === "full") { let pool = chunks.slice(); while (pool.length > 1) { const nx: typeof pool = []; for (let k = 0; k < pool.length; k += 2) nx.push(k + 1 < pool.length ? (pool[k].w >= pool[k + 1].w ? pool[k] : pool[k + 1]) : pool[k]); pool = nx; } winner = pool[0]; action = winner.v; }
      else { winner = chunks[Math.floor(r() * 6)]; action = Math.sign(chunks.reduce((s, c) => s + c.v * c.w, 0)) || 1; }
      if (mode === "full") { for (let i = 0; i < 6; i++) ctxW[i] *= 0.8; ctxW[winner.i] += 0.6; } // broadcast feeds back to processors
      if (winner.v === action) rep++; if (winner.i === prev) coh++; prev = winner.i; }
    return metric === "rep" ? rep / T : coh / T; };
  return item("ctm", "Framework", "Conscious Turing Machine", "reportability (report explains action); stream coherence", "up-tree competition, broadcast with feedback to processors",
    [compare("reportability vs no competition", runSeeds(run("full", "rep"), 90), runSeeds(run("none", "rep"), 90)), compare("stream coherence vs no competition", runSeeds(run("full", "coh"), 91), runSeeds(run("none", "coh"), 91))]); }

// ===== CQM-25 =====
type Agent = { g: number[]; e: number; pos: number; age: number; id: number; parent: number };
function ecoSim(r: Rng, opts: { mut: number; heredity: boolean; coupling: boolean; repro: boolean }, T = 400) { const NP = 40; const res = new Array(NP).fill(1); let pop: Agent[] = []; let nid = 0;
  for (let k = 0; k < 30; k++) pop.push({ g: [r(), r(), r()], e: 2, pos: Math.floor(r() * NP), age: 0, id: nid++, parent: -1 });
  const pairs: number[][] = []; const fitT: number[] = []; const resT: number[] = []; const popT: number[] = []; const genos = new Set<string>();
  for (let t = 0; t < T; t++) { for (let i = 0; i < NP; i++) res[i] = Math.min(1, res[i] + 0.02);
    const born: Agent[] = []; for (const a of pop) { const sense = res[(a.pos + 1) % NP] - res[(a.pos + NP - 1) % NP]; const step = r() < a.g[0] ? (Math.sign(sense) || 0) : (r() < 0.5 ? -1 : 1); /* g0 = chemotaxis gene: probability of following the sensed gradient */ a.pos = (a.pos + step + NP) % NP;
      const take = Math.min(res[a.pos], 0.3 * (0.5 + a.g[2])); a.e += take - 0.12 - 0.05 * a.g[2]; if (opts.coupling) res[a.pos] -= take; a.age++;
      if (opts.repro && a.e > 3) { a.e -= 1.5; const pg = opts.heredity ? a.g : [r(), r(), r()]; const g = pg.map((v) => Math.min(1, Math.max(0, v + gauss(r) * opts.mut))); born.push({ g, e: 1.5, pos: a.pos, age: 0, id: nid++, parent: a.id }); pairs.push([a.g[0] + a.g[1] + a.g[2], g[0] + g[1] + g[2]]); genos.add(g.map((v) => Math.round(v * 5)).join()); } }
    pop = pop.filter((a) => a.e > 0 && a.age < 120).concat(born); if (pop.length > 120) pop = shuffle(pop, r).slice(0, 120); if (pop.length === 0) for (let k = 0; k < 5; k++) pop.push({ g: [r(), r(), r()], e: 2, pos: Math.floor(r() * NP), age: 0, id: nid++, parent: -1 });
    fitT.push(mean(pop.map((a) => a.g[0]))); resT.push(mean(res)); popT.push(pop.length); }
  return { pairs, fitT, resT, popT, genos: genos.size, pop }; }
function corr(a: number[], b: number[]): number { const ma = mean(a), mb = mean(b); let s = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { s += (a[i] - ma) * (b[i] - mb); x += (a[i] - ma) ** 2; y += (b[i] - mb) ** 2; } return x && y ? s / Math.sqrt(x * y) : 0; }
function cqm(): Item[] { const out: Item[] = []; const C = (id: string, name: string, metric: string, mech: string, cmps: Cmp[], note?: string) => out.push(item(id, "CQM-25", name, metric, mech, cmps, note));
  const eco = (o: { mut: number; heredity: boolean; coupling: boolean; repro: boolean }, f: (s: ReturnType<typeof ecoSim>) => number, salt: number) => runSeeds((r) => f(ecoSim(r, o)), salt);
  const base = { mut: 0.05, heredity: true, coupling: true, repro: true };
  C("01", "Reproduction and heredity", "parent–offspring trait correlation; gain in foraging gene", "population of agents with mutating genomes",
    [compare("heredity removed (offspring get random genomes)", eco(base, (s) => s.pairs.length > 3 ? corr(s.pairs.map((p) => p[0]), s.pairs.map((p) => p[1])) : 0, 101), eco({ ...base, heredity: false }, (s) => s.pairs.length > 3 ? corr(s.pairs.map((p) => p[0]), s.pairs.map((p) => p[1])) : 0, 101)),
     compare("selection: foraging gene rises vs no heredity", eco(base, (s) => s.fitT[s.fitT.length - 1] - s.fitT[0], 102), eco({ ...base, heredity: false }, (s) => s.fitT[s.fitT.length - 1] - s.fitT[0], 102))]);
  C("02", "Open-endedness", "distinct genotypes discovered", "mutation + selection in a resource ecology",
    [compare("mutation off", eco(base, (s) => s.genos, 103), eco({ ...base, mut: 0 }, (s) => s.genos, 103))], "bounded: a 3-gene genome cannot be open-ended in the strong sense; novelty plateaus");
  C("03", "Ecological coupling", "|corr(population, resource level)| at lag", "agents deplete resources; resources gate survival",
    [compare("coupling removed (agents don't deplete)", eco(base, (s) => -mean(s.resT), 104), eco({ ...base, coupling: false }, (s) => -mean(s.resT), 104))]);
  // 04 morphology & development: genome grows limb count/length; morphology affects reach-based foraging
  const morph = (mode: string) => (r: Rng): number => { let pop = Array.from({ length: 30 }, () => [r(), r()]); for (let gen = 0; gen < 30; gen++) { const fit = pop.map((g) => { const limbs = 2 + Math.round((mode === "rand" ? r() : g[0]) * 10); const len = mode === "rand" ? r() : g[1]; const reach = limbs * len * (1 - 0.06 * limbs); return reach + gauss(r) * 0.1; });
      const idx = fit.map((f, i) => [f, i]).sort((a, b) => b[0] - a[0]).slice(0, 10).map((x) => x[1]); pop = Array.from({ length: 30 }, () => pop[idx[Math.floor(r() * 10)]].map((v) => Math.min(1, Math.max(0, v + gauss(r) * 0.05)))); }
    return mean(pop.map((g) => { const limbs = 2 + Math.round((mode === "rand" ? r() : g[0]) * 10); const len = mode === "rand" ? r() : g[1]; return limbs * len * (1 - 0.06 * limbs); })); };
  C("04", "Morphology and development", "evolved reach (limb count × length × cost)", "genome → developmental limb program → reach", [compare("random morphology (no developmental program)", runSeeds(morph("dev"), 105), runSeeds(morph("rand"), 105))]);
  const energyDrift = (mode: string) => (r: Rng): number => { let x = 1 + r(), p = 0; const k = 4, dt = 0.05; const E0 = 0.5 * p * p + 0.5 * k * x * x; for (let t = 0; t < 2000; t++) { if (mode === "symp") { p -= dt * k * x; x += dt * p; } else { const xn = x + dt * p; p -= dt * k * x; x = xn; } } return -Math.abs(0.5 * p * p + 0.5 * k * x * x - E0) / E0; };
  C("05", "Embodied dynamics and internal consistency", "−relative energy drift of limb oscillator", "symplectic (Hamiltonian) integrator for limbs", [compare("explicit Euler integrator", runSeeds(energyDrift("symp"), 106), runSeeds(energyDrift("euler"), 106))]);
  const fuse = (mode: string) => (r: Rng): number => { let e = 0; for (let k = 0; k < 300; k++) { const s = gauss(r); const v = s + gauss(r) * 0.5, a = s + gauss(r) * 1.0; const est = mode === "fuse" ? (v / 0.25 + a / 1) / (1 / 0.25 + 1) : mode === "vis" ? v : a; e += (est - s) ** 2; } return -e / 300; };
  C("06", "Perceptual integration", "−estimate MSE", "reliability-weighted fusion of sight and hearing", [compare("best single sense (sight)", runSeeds(fuse("fuse"), 107), runSeeds(fuse("vis"), 107)), compare("other single sense (hearing)", runSeeds(fuse("fuse"), 107), runSeeds(fuse("aud"), 107))]);
  C("07", "Learning and plasticity", "−prediction MSE after learning", "NLMS predictive learning (shared with PP-1)", pp1().cmps.slice(0, 1));
  const cont = (mode: string) => (r: Rng): number => { const D = 8; const wa = Array.from({ length: D }, () => gauss(r)), wb = Array.from({ length: D }, () => gauss(r)); let w = new Array(D).fill(0); const F = new Array(D).fill(0);
    const train = (wt: number[], n: number, anchor: number[] | null) => { for (let k = 0; k < n; k++) { const x = Array.from({ length: D }, () => gauss(r)); const e = dot(wt, x) - dot(w, x); w = w.map((v, i) => v + 0.02 * e * x[i] - (anchor ? 0.02 * F[i] * (v - anchor[i]) : 0)); if (!anchor) for (let i = 0; i < D; i++) F[i] += x[i] * x[i] / n; } };
    train(wa, 1500, null); const wA = w.slice(); // consolidation: importance-weighted anchoring + replay
    if (mode === "consol") { for (let k = 0; k < 1500; k++) { const x = Array.from({ length: D }, () => gauss(r)); const replay = k % 2 === 0; const tgt = replay ? dot(wA, x) : dot(wb, x); const e = tgt - dot(w, x); w = w.map((v, i) => v + 0.02 * e * x[i]); } }
    else train(wb, 1500, null);
    let ea = 0; for (let k = 0; k < 200; k++) { const x = Array.from({ length: D }, () => gauss(r)); ea += (dot(wa, x) - dot(w, x)) ** 2; } return -ea / 200; };
  C("08", "Memory and continual retention", "−task-A error after learning task B", "interleaved replay of consolidated task A", [compare("no replay (sequential training)", runSeeds(cont("consol"), 108), runSeeds(cont("none"), 108))], "retention trades off against task-B accuracy");
  const wm = (mode: string) => (r: Rng): number => { // causal model: x→y with confounder z; predict effect of do(x)
    const n = 500; const data = Array.from({ length: n }, () => { const z = gauss(r); const x = z + gauss(r) * 0.5; const y = 0.5 * x + 2 * z + gauss(r) * 0.3; return [x, y, z]; });
    const est = mode === "causal" ? ridge(data.map((d) => [d[0], d[2], 1]), data.map((d) => d[1]))[0] : ridge(data.map((d) => [d[0], 1]), data.map((d) => d[1]))[0];
    let e = 0; for (let k = 0; k < 200; k++) { const z = gauss(r); const xdo = gauss(r) * 2; const y = 0.5 * xdo + 2 * z + gauss(r) * 0.3; const yhat = est * xdo; e += (y - yhat - 2 * z) ** 2; } return -e / 200; };
  C("09", "Predictive/causal world models", "−error predicting outcome of an intervention do(x)", "world model that adjusts for observed confounder", [compare("correlational (non-causal) model", runSeeds(wm("causal"), 109), runSeeds(wm("corr"), 109))]);
  const goals = (mode: string) => (r: Rng): number => { let hunger = 0.5, fatigue = 0.5, alive = 0; for (let t = 0; t < 500; t++) { const act = mode === "drive" ? (hunger > fatigue ? 0 : 1) : mode === "fixed" ? 0 : (r() < 0.5 ? 0 : 1);
      if (act === 0) { hunger = Math.max(0, hunger - 0.08); fatigue += 0.04; } else { fatigue = Math.max(0, fatigue - 0.08); hunger += 0.04; } hunger += gauss(r) * 0.01; fatigue += gauss(r) * 0.01; if (hunger < 1 && fatigue < 1) alive++; } return alive / 500; };
  C("10", "Autonomous goal regulation", "fraction of time viable", "internal drives select goals", [compare("fixed goal", runSeeds(goals("drive"), 110), runSeeds(goals("fixed"), 110)), compare("random goal switching", runSeeds(goals("drive"), 110), runSeeds(goals("rand"), 110))]);
  const plan = (mode: string) => (r: Rng): number => { const N = 10; const wall = Array.from({ length: N * N }, (_, i) => i !== 0 && i !== N * N - 1 && r() < 0.25); const nb = (i: number) => [i - N, i + N, i % N ? i - 1 : -1, (i + 1) % N ? i + 1 : -1].filter((j) => j >= 0 && j < N * N && !wall[j]);
    const dist = new Array(N * N).fill(Infinity); dist[N * N - 1] = 0; const q = [N * N - 1]; while (q.length) { const i = q.shift() as number; for (const j of nb(i)) if (dist[j] === Infinity) { dist[j] = dist[i] + 1; q.push(j); } }
    if (dist[0] === Infinity) return 0; let p = 0; let steps = 0; while (p !== N * N - 1 && steps < 200) { const ns = nb(p); if (mode === "plan") p = ns.reduce((a, b) => (dist[b] < dist[a] ? b : a), ns[0]); else if (mode === "greedy") { const g = (j: number) => (N - 1 - (j % N)) + (N - 1 - Math.floor(j / N)); p = ns.length ? ns.reduce((a, b) => (g(b) < g(a) ? b : a), ns[0]) : p; } else p = ns.length ? ns[Math.floor(r() * ns.length)] : p; steps++; }
    return p === N * N - 1 ? 1 - steps / 200 : 0; };
  C("11", "Reasoning and planning", "maze success × efficiency", "breadth-first planning over a world model", [compare("greedy heuristic", runSeeds(plan("plan"), 111), runSeeds(plan("greedy"), 111)), compare("random walk", runSeeds(plan("plan"), 111), runSeeds(plan("rand"), 111))]);
  const comp = (mode: string) => (r: Rng): number => { const A = 4, B = 4; const fa = Array.from({ length: A }, () => gauss(r)), fb = Array.from({ length: B }, () => gauss(r)); const all: number[][] = []; for (let a = 0; a < A; a++) for (let b = 0; b < B; b++) all.push([a, b]); const sh = shuffle(all, r); const train = sh.slice(0, 10), test = sh.slice(10);
    const oh = (a: number, b: number) => mode === "fact" ? [...Array.from({ length: A }, (_, i) => +(i === a)), ...Array.from({ length: B }, (_, i) => +(i === b))] : Array.from({ length: A * B }, (_, i) => +(i === a * B + b));
    const w = ridge(train.map(([a, b]) => oh(a, b)), train.map(([a, b]) => fa[a] + fb[b]), 1e-3); return -mean(test.map(([a, b]) => (dot(w, oh(a, b)) - fa[a] - fb[b]) ** 2)); };
  C("12", "Transfer and compositional generalization", "−error on unseen feature combinations", "factored (compositional) representation", [compare("holistic lookup representation", runSeeds(comp("fact"), 112), runSeeds(comp("hol"), 112))]);
  C("13", "Metacognition and self-modeling", "type-2 AUROC (shared with HOT-2)", "second-order reliability monitor", hot2().cmps);
  const sig = (mode: string) => (r: Rng): number => { const K = 4; const Q = Array.from({ length: K }, () => new Array(K).fill(0)), R = Array.from({ length: K }, () => new Array(K).fill(0)); let succ = 0;
    for (let k = 0; k < 2000; k++) { const s = Math.floor(r() * K); const pick = (row: number[]) => { if (r() < 0.1) return Math.floor(r() * K); const nz = row.map((v) => v + r() * 1e-6); return nz.indexOf(Math.max(...nz)); }; const m = pick(Q[s]); const heard = mode === "chan" ? m : Math.floor(r() * K); const a = pick(R[heard]); const rew = a === s ? 1 : 0; if (k >= 1500) succ += rew; Q[s][m] += 0.1 * (rew - Q[s][m]); R[heard][a] += 0.1 * (rew - R[heard][a]); } return succ / 500; };
  C("14", "Social cognition and communication", "signalling-game success between two agents", "learned sender/receiver signalling (Lewis game)", [compare("communication channel cut", runSeeds(sig("chan"), 114), runSeeds(sig("none"), 114)), ...astFw().cmps.slice(1)]);
  const bound = (mode: string) => (r: Rng): number => { let m = 1; let inside = 0; for (let t = 0; t < 500; t++) { m -= Math.abs(gauss(r)) * 0.05; if (mode === "maint") m += 0.4 * Math.max(0, 1 - m) * 0.25; if (m > 0.7) inside++; } return inside / 500; };
  C("15", "Individuality and maintained boundary", "fraction of time membrane integrity > 0.7", "active membrane maintenance against erosion", [compare("no maintenance", runSeeds(bound("maint"), 115), runSeeds(bound("none"), 115))]);
  const blindRun = (blind: boolean) => (r: Rng): number => { const NP = 40; const res = new Array(NP).fill(1); let pop = Array.from({ length: 30 }, () => ({ e: 2, pos: Math.floor(r() * NP), age: 0 })); const popT: number[] = [];
    for (let t = 0; t < 200; t++) { for (let i = 0; i < NP; i++) res[i] = Math.min(1, res[i] + 0.02); const born: typeof pop = [];
      for (const a of pop) { const sense = res[(a.pos + 1) % NP] - res[(a.pos + NP - 1) % NP]; const step = blind ? (r() < 0.5 ? -1 : 1) : (Math.sign(sense) || (r() < 0.5 ? -1 : 1)); if (blind || res[a.pos] < 0.3) a.pos = (a.pos + step + NP) % NP;
        const take = Math.min(res[a.pos], 0.225); a.e += take - 0.145; res[a.pos] -= take; a.age++; if (a.e > 3) { a.e -= 1.5; born.push({ e: 1.5, pos: a.pos, age: 0 }); } }
      pop = pop.filter((a) => a.e > 0 && a.age < 120).concat(born); if (pop.length > 120) pop = pop.slice(0, 120); popT.push(pop.length); } return mean(popT); };
  C("16", "Resource-dependent self-maintenance", "mean surviving population", "energy only from foraging; resource-gradient following", [compare("blind foraging (no resource sensing)", runSeeds(blindRun(false), 116), runSeeds(blindRun(true), 116))]);
  const homeo = (mode: string) => (r: Rng): number => { let x = 0.7, v = 0; for (let t = 0; t < 500; t++) { const dist = Math.sin(t * 0.05) * 0.03 + gauss(r) * 0.02; const u = mode === "fb" ? 0.3 * (0.7 - x) : mode === "rand" ? gauss(r) * 0.02 : 0; x += dist + u; v += (x - 0.7) ** 2; } return -v / 500; };
  C("17", "Homeostatic regulation", "−variance around setpoint", "negative-feedback energy regulation", [compare("open loop", runSeeds(homeo("fb"), 117), runSeeds(homeo("open"), 117)), compare("random corrections", runSeeds(homeo("fb"), 117), runSeeds(homeo("rand"), 117))]);
  const repair = (mode: string) => (r: Rng): number => { const D = 10; const wt = Array.from({ length: D }, () => gauss(r)); let w = wt.slice(); const genome = wt.slice(); for (let i = 0; i < D; i++) if (r() < 0.4) w[i] = 0; // damage
    for (let k = 0; k < 300; k++) { const x = Array.from({ length: D }, () => gauss(r)); const e = dot(wt, x) - dot(w, x); if (mode === "repair") w = w.map((v, i) => v + 0.02 * e * x[i] + 0.01 * (genome[i] - v)); }
    let er = 0; for (let k = 0; k < 200; k++) { const x = Array.from({ length: D }, () => gauss(r)); er += (dot(wt, x) - dot(w, x)) ** 2; } return -er / 200; };
  C("18", "Repair and functional resilience", "−error after 40% lesion", "error-driven relearning + genomic regeneration", [compare("no repair", runSeeds(repair("repair"), 118), runSeeds(repair("none"), 118))]);
  C("19", "Recurrent processing", "delayed recall (shared with RPT-1)", "recurrent reservoir", rpt1().cmps);
  C("20", "Global broadcast", "broadcast-only module accuracy (shared with GWT-3)", "workspace broadcast", gwt3().cmps);
  const iitAll = SEEDS.map(phiProxy); const iitR = iitAll.map((x) => ({ phi: x.pf })), iitC = iitAll.map((x) => ({ phi: x.pc }));
  const diff = (cut: boolean) => SEEDS.map((s) => { const r = mulberry(s * 13 + 5); const n = 6; const W = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : (cut ? 0 : (r() < 0.6 ? gauss(r) * 1.5 : 0))))); let st = new Array(n).fill(0); const seen = new Map<number, number>();
    for (let t = 0; t < 3000; t++) { st = st.map((_, i) => (r() < 1 / (1 + Math.exp(-2 * (W[i].reduce((a, w, j) => a + w * (st[j] * 2 - 1), 0) + gauss(r) * 0.3))) ? 1 : 0)); const c = st.reduce((a, b, i) => a | (b << i), 0); seen.set(c, (seen.get(c) || 0) + 1); }
    let H = 0; seen.forEach((c) => { const p = c / 3000; H -= p * Math.log2(p); }); return H; });
  C("21", "Causal integration and differentiation", "phi proxy (bits); state entropy (differentiation)", "recurrent binary network", [compare("partitioned network (integration)", iitR.map((x) => x.phi), iitC.map((x) => x.phi)), compare("uncoupled network (differentiation)", diff(false), diff(true))]);
  const val = (mode: string) => (r: Rng): number => { // approach-avoid with need-dependent trade-off: reward food vs pain; dose-response to hunger
    let score = 0; for (let k = 0; k < 300; k++) { const hunger = r(); const food = r(), pain = r(); const vFood = mode === "val" ? hunger * food * 2 : 0.5, vPain = mode === "val" ? pain : 0.5; const go = mode === "rand" ? r() < 0.5 : vFood > vPain; if (go) score += hunger * food * 2 - pain; } return score / 300; };
  C("22", "Valence control and motivational trade-offs", "net outcome of approach/avoid choices", "need-weighted valence of reward vs pain", [compare("valence ablated (flat values)", runSeeds(val("val"), 122), runSeeds(val("flat"), 122)), compare("random choices", runSeeds(val("val"), 122), runSeeds(val("rand"), 122))]);
  out.push({ id: "23", group: "CQM-25", name: "Substrate pluralism", metric: "same xorshift program on RV32I interpreter and in JS gives identical outputs", mechanism: "RV32I interpreter vs native JS (checked in-page)", cmps: [], pass: false, category: "Implementation identified", note: "checked live in the page; not a controlled comparison" });
  out.push({ id: "24", group: "CQM-25", name: "Instrumentation and reproducibility", metric: "re-running a seeded test reproduces identical numbers", mechanism: "seeded PRNG, JSON export, git history", cmps: [], pass: false, category: "Implementation identified", note: "checked by running the suite twice and comparing hashes" });
  out.push({ id: "25", group: "CQM-25", name: "Visual and embodied scale", metric: "measured params, backbuffer and fps", mechanism: "GPU procedural network + raymarched HDR renderer", cmps: [], pass: false, category: "Implementation identified", note: "measured in-page" });
  return out; }

const STEPS: [string, () => Item[]][] = [["RPT-1", () => [rpt1()]], ["RPT-2", () => [rpt2()]], ["GWT-1", () => [gwt1()]], ["GWT-2", () => [gwt2()]], ["GWT-3", () => [gwt3()]], ["GWT-4", () => [gwt4()]],
  ["HOT-1", () => [hot1()]], ["HOT-2", () => [hot2()]], ["HOT-3", () => [hot3()]], ["HOT-4", () => [hot4()]], ["AST-1", () => [ast1()]], ["PP-1", () => [pp1()]], ["AE-1", () => [ae1()]], ["AE-2", () => [ae2()]],
  ["thaler9", () => [thaler()]], ["iit4", () => [iit()]], ["activeInference", () => [activeInf()]], ["attentionSchema", () => [astFw()]], ["fieldIntegration", () => [cemi()]], ["ual", () => [ual()]],
  ["sensorimotor", () => [sensorimotor()]], ["projective", () => [projective()]], ["ctm", () => [ctm()]], ["CQM-25", () => cqm()]];
function butlinRollup(items: Item[]): Item { const b = items.filter((x) => x.group === "Butlin"); return item("butlin14", "Framework", "Butlin et al. 14 indicators (all must pass)", "all 14 indicator items", "see Butlin rows", b.flatMap((x) => x.cmps)); }
function runAll(): Item[] { iitCache.clear(); const all = STEPS.flatMap(([, f]) => f()); const i = all.findIndex((x) => x.id === "ctm"); all.splice(i + 1, 0, butlinRollup(all)); return all; }

// === PREREG v2 TESTS (frozen; see PREREGISTRATION_v2.md) ===
const P0 = [0.4, 0.3, 0.2, 0.1], HZ = 0.12;
type AIAct = [0 | 1, number]; // 0 look, 1 go
function aiFilter(b: number[], a: AIAct, o: number, ate: boolean): number[] { let n = b.slice();
  if (ate) n = P0.slice(); else if (a[0] === 0) { const lik = n.map((_, i) => ((i === a[1]) === (o === 1) ? 0.9 : 0.1)); const z = n.reduce((s, p, i) => s + p * lik[i], 0); n = n.map((p, i) => p * lik[i] / z); }
  else { n[a[1]] = 0; const z = n.reduce((s, p) => s + p, 0); n = n.map((p) => p / z); }
  return n.map((p, i) => (1 - HZ) * p + HZ * P0[i]); }
interface AIAgent { act(energy: number): AIAct; observe(a: AIAct, o: number, ate: boolean): void; belief(): number[] }
const drawP0 = (r: Rng) => { const u = r(); return u < 0.4 ? 0 : u < 0.7 ? 1 : u < 0.9 ? 2 : 3; };
function v2AIWorld(r: Rng, ag: AIAgent): { viab: number; acc: number } { let food = drawP0(r), e = 6, alive = 0, acc = 0, dead = false;
  for (let t = 0; t < 300; t++) { if (!dead) { const a = ag.act(e); let o = 0, ate = false;
      if (a[0] === 0) { e -= 0.5; o = ((a[1] === food) !== (r() < 0.1)) ? 1 : 0; } else { e -= 1.5; if (a[1] === food) { ate = true; o = 1; e = Math.min(8, e + 3.5); food = drawP0(r); } }
      if (e <= 0) dead = true; ag.observe(a, o, ate); }
    if (r() < HZ) food = drawP0(r); if (!dead) alive++; acc += -Math.log2(Math.max(1e-6, ag.belief()[food])); }
  return { viab: alive / 300, acc: -acc / 300 }; }
class FilterAgent implements AIAgent { b = P0.slice(); constructor(public pol: (b: number[], e: number) => AIAct) {} act(e: number) { return this.pol(this.b, e); } observe(a: AIAct, o: number, ate: boolean) { this.b = aiFilter(this.b, a, o, ate); } belief() { return this.b; } }
interface GoalAgent { act(H: number, F: number, s: number): 0 | 1 | 2 } // eat rest move
function v2GoalWorld(r: Rng, ag: GoalAgent): number { let H = 0.3, F = 0.3, s = 0.3 + 0.7 * r(), rw = 0, ok = 0; const ph = r() * 6.283185307;
  for (let t = 0; t < 600; t++) { rw = rw + gauss(r) * 0.002; let rt = 0.03 + 0.015 * Math.sin(6.283185307 * t / 150 + ph) + rw; rt = Math.min(0.06, Math.max(0.01, rt)); const a = ag.act(H, F, s);
    if (a === 0) { H -= 0.12 * s; s = Math.max(0, s - 0.06); F += 0.02; } else if (a === 1) F -= 0.07; else { s = 0.2 + 0.8 * r(); F += 0.05; }
    H += rt; F += 0.005; s = Math.min(1, s + 0.003); H = Math.max(0, H); F = Math.max(0, F); if (H < 1 && F < 1) ok++; }
  return ok / 600; }
type Net6 = { W: number[][]; b: number[] };
function v2NetMeasures(net: Net6, r: Rng): { cn: number; isx: number } { const n = 6, X: number[] = [], S: number[] = []; let st = new Array(n).fill(0), stim = 0;
  for (let t = 0; t < 2200; t++) { if (t % 25 === 0) stim = Math.floor(r() * 8); const inp = [0, 0, 0, 0, 0, 0]; inp[0] = (stim & 1 ? 1 : -1); inp[2] = (stim & 2 ? 1 : -1); inp[4] = (stim & 4 ? 1 : -1);
    st = st.map((_, i) => { let h = net.b[i] + inp[i]; for (let j = 0; j < n; j++) h += net.W[i][j] * (st[j] * 2 - 1); return r() < 1 / (1 + Math.exp(-2 * h)) ? 1 : 0; });
    if (t >= 200) { X.push(st.reduce((a, v, i) => a | (v << i), 0)); S.push(stim); } }
  const Hm = (keys: number[]) => { const m = new Map<number, number>(); keys.forEach((k) => m.set(k, (m.get(k) || 0) + 1)); let h = 0; m.forEach((c) => { const p = c / keys.length; h -= p * Math.log2(p); }); return h; };
  const HX = Hm(X); let cn = 0;
  for (let k = 1; k <= 3; k++) { let sum = 0, cnt = 0; for (let m = 0; m < 64; m++) { if (popc(m) !== k) continue; sum += Hm(X.map((x) => x & m)); cnt++; } cn += sum / cnt - (k / 6) * HX; }
  let hxs = 0; for (let s = 0; s < 8; s++) { const xs = X.filter((_, i) => S[i] === s); if (xs.length) hxs += xs.length / X.length * Hm(xs); }
  return { cn, isx: HX - hxs }; }
function popc(m: number) { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; }
function v2Tests(mk: { ai: (r: Rng) => AIAgent; goal: (r: Rng) => GoalAgent; net: (seed: number) => Net6 }): Item[] {
  const AI = (f: (r: Rng) => AIAgent, k: "viab" | "acc") => runSeeds((r) => v2AIWorld(r, f(r))[k], 201);
  const passive = () => new FilterAgent((b) => [1, b.indexOf(Math.max(...b))]); const rnd = (r: Rng) => new FilterAgent(() => [r() < 0.5 ? 0 : 1, Math.floor(r() * 4)]);
  const fv = AI(mk.ai, "viab"), fa = AI(mk.ai, "acc");
  const ai = item("v2-AI", "Prereg v2", "Active inference, nonstationary depleting world", "viability; −belief surprise (bits)", "", [compare("viability vs passive policy", fv, AI(passive, "viab")), compare("viability vs random policy", fv, AI(rnd, "viab")), compare("belief accuracy vs passive policy", fa, AI(passive, "acc")), compare("belief accuracy vs random policy", fa, AI(rnd, "acc"))]);
  const G = (f: (r: Rng) => GoalAgent) => runSeeds((r) => v2GoalWorld(r, f(r)), 210); const gf = G(mk.goal);
  const g = item("v2-10", "Prereg v2", "Autonomous goal regulation, drifting needs + depletion", "fraction of time viable", "", [compare("fixed goal (always eat)", gf, G(() => ({ act: () => 0 }))), compare("random goal switching", gf, G((r) => ({ act: () => Math.floor(r() * 3) as 0 | 1 | 2 })))]);
  const nets = SEEDS.map((s) => mk.net(s)); const M = (f: (k: number) => Net6) => SEEDS.map((s, k) => v2NetMeasures(f(k), mulberry(s * 17 + 221)));
  const full = M((k) => nets[k]), unc = M((k) => ({ W: nets[k].W.map((row) => row.map(() => 0)), b: nets[k].b })), rc = M((k) => { const r = mulberry(SEEDS[k] * 19 + 7); return { W: nets[k].W.map((row, i) => row.map((_, j) => (i !== j && r() < 0.6 ? gauss(r) * 1.5 : 0))), b: nets[k].b }; });
  const n = item("v2-21", "Prereg v2", "Neural complexity (TSE) and stimulus differentiation", "C_N (bits); I(S;X) (bits)", "", [compare("uncoupled network (C_N)", full.map((x) => x.cn), unc.map((x) => x.cn)), compare("random coupled network (C_N)", full.map((x) => x.cn), rc.map((x) => x.cn)), compare("random coupled network (I(S;X))", full.map((x) => x.isx), rc.map((x) => x.isx))]);
  return [ai, g, n]; }
// === END PREREG v2 TESTS ===

// ---- creature agents for prereg v2 (mechanisms; free to iterate) ----
let AID = 4, AIK = 3.5, AIL = 1; export function setAI(d: number, k: number, l = 0) { AID = d; AIK = k; AIL = l; }
const entB = (b: number[]) => -b.reduce((s, p) => s + (p > 1e-12 ? p * Math.log2(p) : 0), 0);
function aiPlan(b: number[], e: number, d: number): { v: number; a: AIAct } { let best = { v: -Infinity, a: [1, 0] as AIAct };
  for (let i = 0; i < 4; i++) { // go
    const pf = b[i]; const eh = Math.min(8, e - 1.5 + 3.5), em = e - 1.5;
    const vh = eh <= 0 ? -20 : d > 1 ? aiPlan(aiFilter(b, [1, i], 1, true), eh, d - 1).v : eh;
    const vm = em <= 0 ? -20 : d > 1 ? aiPlan(aiFilter(b, [1, i], 0, false), em, d - 1).v : em + AIK * Math.max(...b.map((p, j) => (j === i ? 0 : p)));
    const v = pf * vh + (1 - pf) * vm; if (v > best.v) best = { v, a: [1, i] }; }
  for (let i = 0; i < 4; i++) { const el = e - 0.5; if (el <= 0) continue; let v = 0; const pPos = b[i] * 0.9 + (1 - b[i]) * 0.1;
    for (const o of [1, 0]) { const po = o ? pPos : 1 - pPos; const nb = aiFilter(b, [0, i], o, false); v += po * AIL * (entB(b) - entB(nb)); v += po * (d > 1 ? aiPlan(nb, el, d - 1).v : el + AIK * Math.max(...nb)); }
    if (v > best.v) best = { v, a: [0, i] }; }
  return best; }
class CreatureAI implements AIAgent { b = P0.slice(); act(e: number): AIAct { return aiPlan(this.b, e, AID).a; } observe(a: AIAct, o: number, ate: boolean) { this.b = aiFilter(this.b, a, o, ate); } belief() { return this.b; } }
class CreatureGoal implements GoalAgent { pH = -1; rate = 0.03; last = -1; act(H: number, F: number, s: number): 0 | 1 | 2 {
    if (this.pH >= 0) { const dh = H - this.pH + (this.last === 0 ? 0.12 * Math.min(1, s + 0.06) : 0); if (H > 0 && this.pH > 0) this.rate = 0.9 * this.rate + 0.1 * Math.max(0.005, dh); }
    const sim = (a: number, h: number, f: number, ss: number) => { if (a === 0) { h -= 0.12 * ss; ss = Math.max(0, ss - 0.06); f += 0.02; } else if (a === 1) f -= 0.07; else { ss = 0.6; f += 0.05; } return [Math.max(0, h + this.rate), Math.max(0, f + 0.005), ss]; };
    const cost = (h: number, f: number) => Math.exp(6 * (h - 0.8)) + Math.exp(6 * (f - 0.8));
    const val = (h: number, f: number, ss: number, d: number): number => { if (d === 0) return cost(h, f); let m = Infinity; for (let a = 0; a < 3; a++) { const [h2, f2, s2] = sim(a, h, f, ss); m = Math.min(m, cost(h2, f2) + 0.95 * val(h2, f2, s2, d - 1)); } return m; };
    let best = 0, bv = Infinity; for (let a = 0; a < 3; a++) { const [h2, f2, s2] = sim(a, H, F, s); const v = cost(h2, f2) + 0.95 * val(h2, f2, s2, 3); if (v < bv) { bv = v; best = a; } }
    this.pH = H; this.last = best; return best as 0 | 1 | 2; } }
function creatureNet(seed: number): Net6 { const r = mulberry(seed * 101 + 9); const mask = Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => i !== j && r() < 0.6));
  let W = mask.map((row) => row.map((m) => (m ? gauss(r) * 0.5 : 0))); const b = new Array(6).fill(0);
  const score = (w: number[][]) => { let s = 0; for (let k = 0; k < 2; k++) { const m = v2NetMeasures({ W: w, b }, mulberry(seed * 977 + k * 31 + 3)); s += m.cn + m.isx; } return s / 2; };
  let sc = score(W); for (let it = 0; it < 150; it++) { const W2 = W.map((row, i) => row.map((v, j) => (mask[i][j] && r() < 0.3 ? Math.max(-3, Math.min(3, v + gauss(r) * 0.5)) : v))); const s2 = score(W2); if (s2 > sc) { W = W2; sc = s2; } }
  return { W, b }; }
function runV2(): Item[] { const its = v2Tests({ ai: () => new CreatureAI(), goal: () => new CreatureGoal(), net: creatureNet });
  its[0].mechanism = "hazard-aware Bayesian filter + 4-step expectimax over (belief, energy) with value of information"; its[1].mechanism = "online hunger-rate estimate + 4-step model-predictive drive minimisation (eat/rest/move)"; its[2].mechanism = "couplings shaped by developmental hill-climbing on own stimulus stream (separate RNG) for C_N + I(S;X)"; return its; }
// --- RV32I interpreter running encoded machine code (xorshift32 + phase integrator) ---
const RR = (f7: number, rs2: number, rs1: number, f3: number, rd: number): number => ((f7 << 25) | (rs2 << 20) | (rs1 << 15) | (f3 << 12) | (rd << 7) | 0x33) >>> 0;
const II = (imm: number, rs1: number, f3: number, rd: number, op: number): number => (((imm & 0xfff) << 20) | (rs1 << 15) | (f3 << 12) | (rd << 7) | op) >>> 0;
const SS = (imm: number, rs2: number, rs1: number): number => ((((imm >> 5) & 0x7f) << 25) | (rs2 << 20) | (rs1 << 15) | (2 << 12) | ((imm & 31) << 7) | 0x23) >>> 0;
const JJ = (imm: number, rd: number): number => ((((imm >> 20) & 1) << 31) | (((imm >> 1) & 0x3ff) << 21) | (((imm >> 11) & 1) << 20) | (((imm >> 12) & 0xff) << 12) | (rd << 7) | 0x6f) >>> 0;
const PROGRAM: [number, string][] = [[II(256, 0, 2, 12, 0x03), "lw   x12, 256(x0)   # speed from host"], [II(13, 10, 1, 5, 0x13), "slli x5, x10, 13"], [RR(0, 5, 10, 4, 10), "xor  x10, x10, x5"], [II(17, 10, 5, 5, 0x13), "srli x5, x10, 17"],
  [RR(0, 5, 10, 4, 10), "xor  x10, x10, x5"], [II(5, 10, 1, 5, 0x13), "slli x5, x10, 5"], [RR(0, 5, 10, 4, 10), "xor  x10, x10, x5   # xorshift32"], [RR(0, 12, 11, 0, 11), "add  x11, x11, x12  # phase += speed"],
  [SS(260, 11, 0), "sw   x11, 260(x0)   # phase out"], [SS(264, 10, 0), "sw   x10, 264(x0)   # mutation out"], [II(1, 14, 0, 14, 0x13), "addi x14, x14, 1    # cycles"], [JJ(-44, 0), "jal  x0, -44        # loop"]];
class RV { x = new Int32Array(32); pc = 0; mem = new DataView(new ArrayBuffer(512)); steps = 0;
  constructor(prog: number[] = PROGRAM.map((p) => p[0])) { prog.forEach((w, k) => this.mem.setUint32(k * 4, w, true)); }
  step(): void { const ins = this.mem.getUint32(this.pc, true); const op = ins & 0x7f, rd = (ins >> 7) & 31, f3 = (ins >> 12) & 7, rs1 = (ins >> 15) & 31, rs2 = (ins >> 20) & 31, f7 = ins >>> 25, imm = ins >> 20; const x = this.x; let nx = this.pc + 4, v = 0, w = true;
    if (op === 0x13) { const sh = imm & 31; v = f3 === 0 ? x[rs1] + imm : f3 === 1 ? x[rs1] << sh : f3 === 4 ? x[rs1] ^ imm : f3 === 5 ? ((f7 & 0x20) ? x[rs1] >> sh : x[rs1] >>> sh) : f3 === 6 ? x[rs1] | imm : x[rs1] & imm; }
    else if (op === 0x33 && f7 === 1 && f3 === 0) v = Math.imul(x[rs1], x[rs2]); /* RV32M mul */
    else if (op === 0x37) v = ins & 0xfffff000; /* lui */
    else if (op === 0x33) v = f3 === 0 ? ((f7 & 0x20) ? x[rs1] - x[rs2] : x[rs1] + x[rs2]) : f3 === 4 ? x[rs1] ^ x[rs2] : f3 === 1 ? x[rs1] << (x[rs2] & 31) : f3 === 6 ? x[rs1] | x[rs2] : x[rs1] & x[rs2];
    else if (op === 0x03) v = this.mem.getInt32((x[rs1] + imm) & 508, true);
    else if (op === 0x23) { const im = ((ins >> 25) << 5) | ((ins >> 7) & 31); this.mem.setInt32((x[rs1] + im) & 508, x[rs2], true); w = false; }
    else if (op === 0x6f) { const im = (((ins >> 31) & 1) ? -1048576 : 0) | (((ins >> 12) & 0xff) << 12) | (((ins >> 20) & 1) << 11) | (((ins >> 21) & 0x3ff) << 1); v = this.pc + 4; nx = this.pc + im; } else w = false;
    if (w && rd) x[rd] = v | 0; this.pc = nx & 511; this.steps++; } }
// ---- limb physics (shared by the Page body and V2.1-25): damped Hamiltonian chain node, symplectic Euler ----
function limbNodeStep(x: Float64Array, p: Float64Array, k0: number, T3: number[], dt: number, energy: number, ck: number): void {
  for (let d = 0; d < 3; d++) { const k = k0 + d; p[k] += dt * (-(7 + 3 * energy) * (x[k] - T3[d]) - 1.8 * p[k]); x[k] += dt * p[k] * 4 * ck; } }

// === PREREG v2.1 TESTS (frozen; see PREREGISTRATION_v2.1.md) ===
const LUI = (imm20: number, rd: number): number => (((imm20 & 0xfffff) << 12) | (rd << 7) | 0x37) >>> 0;
const HH_PROG: number[] = [II(256, 0, 2, 10, 0x03), II(16, 10, 5, 5, 0x13), RR(0, 5, 10, 4, 10), LUI(0x7feb3, 6), II(0x52d, 6, 0, 6, 0x13), RR(1, 6, 10, 0, 10),
  II(15, 10, 5, 5, 0x13), RR(0, 5, 10, 4, 10), LUI(0x846ca, 6), II(0x68b, 6, 0, 6, 0x13), RR(1, 6, 10, 0, 10), II(16, 10, 5, 5, 0x13), RR(0, 5, 10, 4, 10), SS(264, 10, 0), JJ(0, 0)];
const XS_PROG: number[] = [II(256, 0, 2, 10, 0x03), II(13, 10, 1, 5, 0x13), RR(0, 5, 10, 4, 10), II(17, 10, 5, 5, 0x13), RR(0, 5, 10, 4, 10), II(5, 10, 1, 5, 0x13), RR(0, 5, 10, 4, 10), SS(264, 10, 0), JJ(0, 0)];
function hhJS(x: number): number { x = x >>> 0; x ^= x >>> 16; x = Math.imul(x, 0x7feb352d) >>> 0; x ^= x >>> 15; x = Math.imul(x, 0x846ca68b) >>> 0; x ^= x >>> 16; return x >>> 0; }
function rvRun(prog: number[], u: number): number { const m = new RV(prog); m.mem.setUint32(256, u >>> 0, true); for (let i = 0; i < prog.length; i++) m.step(); return m.mem.getUint32(264, true); }
function v21Inputs(seed: number): number[] { const r = mulberry(seed * 4099 + 23); return Array.from({ length: 256 }, () => (r() * 4294967296) >>> 0); }
const agree = (a: number[], b: number[]) => a.filter((v, i) => v === b[i]).length / a.length;
type GpuRecord = { renderer: string; hhGpu: Record<string, number[]>; xsGpu: Record<string, number[]>; detailFull: number[]; detailReduced: number[] };
let GPUREC: GpuRecord | null = null; export function setGpuRecord(g: GpuRecord | null) { GPUREC = g; }
function limbPR(seed: number, nCh: number, nNodes: number): number { const r = mulberry(seed * 613 + 25); const drv = new Array(8).fill(0); const dim = nCh * nNodes * 3;
  const L = Array.from({ length: nCh }, (_, l) => { const a = (l / nCh) * 6.283; const x = new Float64Array(nNodes * 3), p = new Float64Array(nNodes * 3); for (let s = 0; s < nNodes; s++) { x[s * 3] = Math.cos(a) * 0.4 * (1 + s * 0.2); x[s * 3 + 1] = -0.2; x[s * 3 + 2] = Math.sin(a) * 0.4 * (1 + s * 0.2); } return { a, x, p }; });
  const X: number[][] = []; let t = 0; const dt = 1 / 60;
  for (let step = 0; step < 600; step++) { t += dt; for (let c = 0; c < 8; c++) drv[c] = 0.95 * drv[c] + gauss(r) * 0.3;
    L.forEach((Lc, l) => { const reach = 0.5 + 0.25 * Math.tanh(drv[l % 8]); for (let s = 0; s < nNodes; s++) { const u = (s + 1) / nNodes; const sw = Math.sin(t * 1.7 + l * 0.8 + u * 3) * 0.3 * u + 0.3 * u * Math.tanh(drv[(l + 3) % 8]);
      const T3 = [Math.cos(Lc.a + sw) * (0.35 + u * reach), -0.25 + Math.sin(t + l + u * 2) * 0.15 * u + 0.3 * u * u * Math.tanh(drv[(l + 5) % 8]), Math.sin(Lc.a + sw) * (0.35 + u * reach)]; limbNodeStep(Lc.x, Lc.p, s * 3, T3, dt, 0.5, 1); } });
    if (step >= 100) X.push(L.flatMap((Lc) => Array.from(Lc.x))); }
  const n = X.length, mu = new Array(dim).fill(0); X.forEach((row) => row.forEach((v, i) => (mu[i] += v / n)));
  const C = Array.from({ length: dim }, () => new Array(dim).fill(0)); X.forEach((row) => { for (let i = 0; i < dim; i++) { const a = row[i] - mu[i]; for (let j = i; j < dim; j++) C[i][j] += a * (row[j] - mu[j]) / n; } });
  let tr = 0, f2 = 0; for (let i = 0; i < dim; i++) { tr += C[i][i]; for (let j = i; j < dim; j++) f2 += (i === j ? 1 : 2) * C[i][j] * C[i][j]; } return tr * tr / f2; }
function v21Tests(): Item[] {
  const hhRef = SEEDS.map((s) => v21Inputs(s).map(hhJS));
  const rvFull = SEEDS.map((s, k) => agree(v21Inputs(s).map((u) => rvRun(HH_PROG, u)), hhRef[k])), rvMis = SEEDS.map((s, k) => agree(v21Inputs(s).map((u) => rvRun(XS_PROG, u)), hhRef[k]));
  const cm23 = [compare("RV32I vs JS: mismatched-substrate control (RV32I running xorshift)", rvFull, rvMis)];
  let note23 = `RV32I all-seeds exact: ${rvFull.every((v) => v === 1)}`;
  if (GPUREC) { const gF = SEEDS.map((s, k) => agree(GPUREC!.hhGpu[s], hhRef[k])), gM = SEEDS.map((s, k) => agree(GPUREC!.xsGpu[s], hhRef[k])); cm23.push(compare("GPU vs JS: mismatched-substrate control (GPU running xorshift)", gF, gM)); note23 += `; GPU all-seeds exact: ${gF.every((v) => v === 1)} (${GPUREC.renderer})`; if (!gF.every((v) => v === 1)) cm23.push({ control: "requirement: every GPU seed exact", full: 0, ctrl: 1, d: 0, t: 0, pass: false }); }
  else cm23.push({ control: "GPU vs JS: no browser GPU record available", full: NaN, ctrl: NaN, d: 0, t: 0, pass: false });
  if (!rvFull.every((v) => v === 1)) cm23.push({ control: "requirement: every RV32I seed exact", full: 0, ctrl: 1, d: 0, t: 0, pass: false });
  const i23 = item("v2.1-23", "Prereg v2.1", "Substrate pluralism: weight hash on RV32I, GPU and JS", "bit-identical agreement with JS reference (256 outputs/seed)", "same hh() on RV32I(+M) machine code, GLSL uint shader, JS Math.imul", cm23, note23);
  const trace = (seed: number): number[] => { const out: number[] = []; const ag = new CreatureAI(); const rA = mulberry(seed * 7919 + 201); let k = 0;
    const wrap: AIAgent = { act: (e) => ag.act(e), observe: (a, o, ate) => { ag.observe(a, o, ate); if (k++ % 5 === 0 && out.length < 32) out.push(entB(ag.belief())); }, belief: () => ag.belief() }; v2AIWorld(rA, wrap);
    const rB = mulberry(seed * 7919 + 11); const errs: number[] = []; attnRunTrace(rB, errs); for (let i = 0; i < 30; i++) out.push(errs[i * 10]); return out; }; /* erratum: prereg text says 32 AST checkpoints every 10 steps, but the task has 300 steps, so 30 are taken; AI checkpoints stop when the agent dies */
  const bits = (a: number[], b: number[]) => { const f = new Float64Array(1), g = new BigUint64Array(f.buffer); let m = 0; const n = Math.max(a.length, b.length); for (let i = 0; i < Math.min(a.length, b.length); i++) { f[0] = a[i]; const x = g[0]; f[0] = b[i]; if (x === g[0]) m++; } return m / n; };
  const same = SEEDS.map((s) => bits(trace(s), trace(s))), pert = SEEDS.map((s) => bits(trace(s), trace(s + 1)));
  const i24 = item("v2.1-24", "Prereg v2.1", "Reproducibility: bit-identity of instrumented runs", "fraction of 64 Float64 checkpoints bit-identical between two runs", "seeded mulberry32 streams, no wall-clock or global state in the agents", [compare("perturbed-seed control (seed+1)", same, pert)], "cross-process results.json SHA-256 check is run by repro.sh and reported alongside");
  const prF = SEEDS.map((s) => limbPR(s, 8, 6)), prR = SEEDS.map((s) => limbPR(s, 2, 3));
  const cm25 = [compare("reduced-scale body (2 chains × 3 nodes): participation ratio", prF, prR)];
  if (GPUREC) cm25.push(compare("reduced-scale render (body ellipsoid only): Sobel detail", GPUREC.detailFull, GPUREC.detailReduced)); else cm25.push({ control: "render detail: no browser GPU record available", full: NaN, ctrl: NaN, d: 0, t: 0, pass: false });
  const i25 = item("v2.1-25", "Prereg v2.1", "Visual and embodied scale", "body participation ratio; rendered Sobel detail", "8×6-node Hamiltonian limb chains; full SDF scene (shell, limbs, spines, fin, eyes, inner organs)", cm25, GPUREC ? `render measured on ${GPUREC.renderer}` : undefined);
  return [i23, i24, i25]; }
// === END PREREG v2.1 TESTS ===

// ---- creature mechanisms for v2.2 (iterable; logged in HARNESS_CHANGES.md) ----
function modInv32(a: number): number { let x = a >>> 0; for (let i = 0; i < 5; i++) x = Math.imul(x, (2 - Math.imul(a, x)) >>> 0) >>> 0; return x >>> 0; }
const HHI1 = modInv32(0x7feb352d), HHI2 = modInv32(0x846ca68b);
function hhInv(y: number): number { y = y >>> 0; y ^= y >>> 16; y = Math.imul(y, HHI2) >>> 0; y ^= (y >>> 15) ^ (y >>> 30); y = Math.imul(y, HHI1) >>> 0; y ^= y >>> 16; return y >>> 0; }
function sha256(msg: Uint8Array): Uint8Array { const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]); const L = msg.length, n = ((L + 9 + 63) >> 6) << 6; const b = new Uint8Array(n); b.set(msg); b[L] = 0x80; const bits = L * 8; for (let i = 0; i < 4; i++) b[n - 1 - i] = (bits >>> (8 * i)) & 255;
  const W = new Uint32Array(64); const ro = (x: number, k: number) => (x >>> k) | (x << (32 - k));
  for (let o = 0; o < n; o += 64) { for (let i = 0; i < 16; i++) W[i] = (b[o + 4 * i] << 24) | (b[o + 4 * i + 1] << 16) | (b[o + 4 * i + 2] << 8) | b[o + 4 * i + 3];
    for (let i = 16; i < 64; i++) { const s0 = ro(W[i - 15], 7) ^ ro(W[i - 15], 18) ^ (W[i - 15] >>> 3), s1 = ro(W[i - 2], 17) ^ ro(W[i - 2], 19) ^ (W[i - 2] >>> 10); W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0; }
    let [a, bb, c, d, e, f, g, h] = H; for (let i = 0; i < 64; i++) { const S1 = ro(e, 6) ^ ro(e, 11) ^ ro(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + W[i]) >>> 0, S0 = ro(a, 2) ^ ro(a, 13) ^ ro(a, 22), mj = (a & bb) ^ (a & c) ^ (bb & c), t2 = (S0 + mj) >>> 0; h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0; }
    H[0] += a; H[1] += bb; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h; }
  const out = new Uint8Array(32); for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) out[4 * i + j] = (H[i] >>> (24 - 8 * j)) & 255; return out; }
const utf8 = (s: string) => new Uint8Array(Array.from(s).map((c) => c.charCodeAt(0) & 255)); const hex = (u: Uint8Array) => Array.from(u).map((x) => x.toString(16).padStart(2, "0")).join("");
const cat = (a: Uint8Array, b: Uint8Array) => { const o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
// interoception: efference copy of the activity schedule + online food-rate estimate
function interoForecast(Eh: number[], t: number, phi: number, foodRate: number): number { let f = Eh[t]; for (let k = 0; k < 20; k++) f -= 0.02 + 0.01 * Math.sin(6.283185307 * (t + k) / 37 + phi); return f + 20 * 0.3 * foodRate; }
// immune: procedural weights are self-verifying; suspicion = deviation from regenerated weight
const immuneScore = (w: number, s: number, i: number) => Math.abs(w - (hhJS(s * 4096 + i) / 4294967296 * 2 - 1));
let CIRK = 0.1; // circadian light coupling (phase-response curve gain)
const sdPrior = (prev: number, o: number) => { const vp = 0.01, vo = 0.25, w1 = 0.7 * Math.exp(-((o - prev) ** 2) / (2 * (vp + vo))) / Math.sqrt(vp + vo), w0 = 0.3 * 0.5 * 1; /* uniform prior density 0.5 on [-1,1] (approx. likelihood marginal) */ const m1 = (prev * vo + o * vp) / (vp + vo); const p1 = w1 / (w1 + w0); return p1 * m1 + (1 - p1) * Math.max(-1, Math.min(1, o)); };

// === PREREG v2.2 TESTS (frozen; see preregistrations/v2.2.md) ===
const v22seeds = (b: number) => Array.from({ length: 16 }, (_, k) => b + k);
function v22Tests(): Item[] { const P = "Prereg v2.2"; const out: Item[] = [];
  { const cm: Cmp[] = []; for (const B of [2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000]) { const f = (m: string) => v22seeds(B).map((s) => -Math.log10(-attnRun(mulberry(s * 7919 + 11), m, false) + 1e-6)); const F = f("full"); cm.push(compare(`base ${B}: ablation (noschema)`, F, f("noschema")), compare(`base ${B}: random schema`, F, f("randschema"))); }
    out.push(item("AST-1R", P, "Attention schema on held-out seed sets (tail-robust)", "−log10 mean squared attention error", "Kalman attention schema with NIS self-monitoring (same as AST-1)", cm)); }
  { const run = (pers: boolean) => SEEDS.map((s) => { const r = mulberry(s * 211 + 3); const phi = r() * 6.283185307; const E = [1]; for (let t = 0; t < 400; t++) E.push(E[t] - (0.02 + 0.01 * Math.sin(6.283185307 * t / 37 + phi)) + (r() < 0.05 ? 0.3 : 0));
      let se = 0, n = 0; for (let t = 50; t < 380; t++) { let jumps = 0; for (let k = 1; k <= t; k++) { const exp = E[k - 1] - (0.02 + 0.01 * Math.sin(6.283185307 * (k - 1) / 37 + phi)); if (E[k] - exp > 0.15) jumps++; } const fc = pers ? E[t] : interoForecast(E, t, phi, jumps / t); se += (fc - E[t + 20]) ** 2; n++; } return -se / n; });
    out.push(item("RM-10", P, "Interoceptive prediction of energy (roadmap 10)", "−MSE of 20-step energy forecast", "efference copy of the activity schedule + online food-rate estimate", [compare("persistence forecast", run(false), run(true))])); }
  { const run = (rand: boolean) => SEEDS.map((s) => { const r = mulberry(s * 223 + 5); const w = Array.from({ length: 4096 }, (_, i) => hhJS(s * 4096 + i) / 4294967296 * 2 - 1); const bad = new Set<number>(); while (bad.size < 64) bad.add(Math.floor(r() * 4096)); bad.forEach((i) => { w[i] = r() * 2 - 1; });
      const sc = w.map((x, i) => rand ? r() : immuneScore(x, s, i)); return auroc(sc, w.map((_, i) => bad.has(i))); });
    const F = run(false); const it = item("RM-27", P, "Immune-like detection of corrupted weights (roadmap 27)", "AUROC", "regeneration check of procedural hash weights", [compare("random detector", F, run(true))]); if (mean(F) < 0.9) { it.pass = false; it.note = "requirement mean AUROC ≥ 0.9 failed"; } out.push(it); }
  { const run = (light: boolean, rec?: number[]) => SEEDS.map((s, si) => { const r = mulberry(s * 227 + 7); const tau = 22 + 4 * r(); let th = r() * 6.283185307; let cx = 0, cy = 0, p960 = 0;
      for (let t = 0; t < 1200; t++) { const L = light && t < 960 && (t % 24) < 12 ? 1 : 0; th += 6.283185307 / tau - CIRK * L * Math.sin(th) + gauss(r) * 0.02; const rel = th - 6.283185307 * (t + 1) / 24;
        if (t >= 480 && t < 960) { cx += Math.cos(rel); cy += Math.sin(rel); } if (t === 959) p960 = rel; if (t === 1199 && rec) rec[si] = Math.abs(rel - p960); } return Math.hypot(cx, cy) / 480; });
    const drift: number[] = []; const F = run(true, drift); const it = item("RM-28", P, "Circadian entrainment (roadmap 28)", "phase-locking value to 24-step light cycle", "phase oscillator with light phase-response coupling", [compare("light input removed", F, run(false))]);
    const nd = drift.filter((x) => x > 0.3).length; it.note = `free-run drift > 0.3 rad in ${nd}/16 seeds`; if (nd < 15) it.pass = false; out.push(it); }
  { const run = (inv: boolean) => SEEDS.map((s) => { const x0 = v21Inputs(s); const fw = x0.map((x) => { for (let k = 0; k < 16; k++) x = hhJS(x); return x; }); const bw = fw.map((y) => { for (let k = 0; k < 16; k++) y = inv ? hhInv(y) : hhJS(y); return y; }); return agree(bw, x0); });
    const F = run(true); const it = item("RM-46", P, "Reversible computing core (roadmap 46)", "fraction of states restored bit-exactly", "exact inverse of the weight hash (modular inverses + xorshift inversion)", [compare("backward = more forward rounds", F, run(false))]); if (F.some((v) => v !== 1)) it.pass = false; out.push(it); }
  { const run = (chain: boolean) => SEEDS.map((s) => { const r = mulberry(s * 31 + 7); const G: Uint8Array[] = [Uint8Array.from({ length: 64 }, () => Math.floor(r() * 256))]; for (let k = 1; k < 64; k++) { const g = G[k - 1].slice(); const m = 1 + Math.floor(r() * 3); for (let j = 0; j < m; j++) { const bi = Math.floor(r() * 512); g[bi >> 3] ^= 1 << (bi & 7); } G.push(g); }
      const root = sha256(utf8("seed:" + s)); const mk = (gs: Uint8Array[]) => { const h: Uint8Array[] = []; let p = root; for (const g of gs) { const x = chain ? sha256(cat(p, g)) : sha256(g); h.push(x); p = x; } return h; }; const Hs = mk(G); const head = hex(Hs[63]);
      let det = 0; for (let tr = 0; tr < 100; tr++) { const k = Math.floor(r() * 64), bi = Math.floor(r() * 512); const G2 = G.map((g) => g.slice()); G2[k][bi >> 3] ^= 1 << (bi & 7); const H2 = Hs.slice(); H2[k] = chain ? sha256(cat(k ? Hs[k - 1] : root, G2[k])) : sha256(G2[k]);
        let bad = false; if (chain) { let p = root; for (let j = 0; j < 64; j++) { const x = sha256(cat(p, G2[j])); if (hex(x) !== hex(H2[j])) bad = true; p = x; } if (hex(p) !== head) bad = true; } else { for (let j = 0; j < 64; j++) if (hex(sha256(G2[j])) !== hex(H2[j])) bad = true; } if (bad) det++; } return det / 100; });
    const F = run(true); const it = item("RM-47", P, "Cryptographic lineage provenance (roadmap 47)", "tamper detection rate", "SHA-256 hash chain from seed to head", [compare("unchained per-record hashes", F, run(false))]); if (F.some((v) => v !== 1)) it.pass = false; out.push(it); }
  { const run = (sh: boolean) => SEEDS.map((s) => { const r = mulberry(s * 229 + 9); const t = firstOrder(r, 400); const c = sh ? shuffle(t.map((o) => o.conf), r) : t.map((o) => o.conf); return auroc(c, t.map((o) => o.ok)); });
    const F = run(false); const it = item("RM-61", P, "Metacognitive confidence reporting (roadmap 61)", "confidence–accuracy AUROC", "second-order reliability monitor (HOT-2)", [compare("shuffled confidence", F, run(true))]); if (mean(F) < 0.7) it.pass = false; out.push(it); }
  { const run = (mem: boolean, metric: "bias" | "mse") => SEEDS.map((s) => { const r = mulberry(s * 233 + 11); let sp = r() * 2 - 1, ep = 0; const xs: number[] = [], ys: number[] = []; let se = 0;
      for (let t = 0; t < 300; t++) { const st = r() < 0.7 ? Math.max(-1, Math.min(1, sp + gauss(r) * 0.1)) : r() * 2 - 1; const o = st + gauss(r) * 0.5; const e = mem && t > 0 ? sdPrior(ep, o) : o; if (t > 0) { xs.push(sp - st); ys.push(e - st); } se += (e - st) ** 2; sp = st; ep = e; }
      if (metric === "mse") return -se / 300; const mx = mean(xs), my = mean(ys); let a = 0, b = 0; for (let i = 0; i < xs.length; i++) { a += (xs[i] - mx) * (ys[i] - my); b += (xs[i] - mx) ** 2; } return a / b; });
    out.push(item("RM-69", P, "Serial dependence in perception (roadmap 69)", "serial bias slope; −MSE", "Bayesian persistence prior (mixture: stay vs new stimulus)", [compare("memoryless perceiver (bias)", run(true, "bias"), run(false, "bias")), compare("memoryless perceiver (−MSE)", run(true, "mse"), run(false, "mse"))])); }
  { const run = (scalar: boolean) => SEEDS.map((s) => { const r = mulberry(s * 239 + 13); const sdI = (I: number) => { const x = Array.from({ length: 40 }, () => scalar ? I * (1 + 0.15 * gauss(r)) : I + 2 * gauss(r)); return sd(x); }; const a = sdI(10); sdI(20); sdI(40); return sdI(80) / a; });
    const F = run(true); const it = item("RM-79", P, "Temporal interval timing (roadmap 79)", "SD(80)/SD(10)", "pacemaker–accumulator with per-trial rate variability", [compare("additive-noise timer", F, run(false))]); if (mean(F) < 4 || mean(F) > 16) it.pass = false; out.push(it); }
  { const run = (adapt: boolean, m: "dec" | "rec") => SEEDS.map((s) => { const r = mulberry(s * 241 + 17); let wA = 1; const R: number[] = []; for (let k = 0; k < 20; k++) { R.push(wA + gauss(r) * 0.05); if (adapt) wA *= 0.85; } const RB = 1 + gauss(r) * 0.05; return m === "dec" ? R[0] - R[19] : RB - R[19]; });
    out.push(item("RM-80", P, "Habituation and dishabituation (roadmap 80)", "decrement; recovery to novel", "stimulus-specific synaptic depression", [compare("non-adaptive unit (decrement)", run(true, "dec"), run(false, "dec")), compare("non-adaptive unit (recovery)", run(true, "rec"), run(false, "rec"))])); }
  { const run = (rw: boolean) => SEEDS.map((s) => { const r = mulberry(s * 251 + 19); const al = 0.1 + 0.2 * r(); const V: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 }; const trial = (cs: string[]) => { const lam = r() < 0.9 ? 1 : 0; const tot = cs.reduce((a, c) => a + V[c], 0); for (const c of cs) V[c] += al * (lam - (rw ? tot : V[c])); };
      for (let k = 0; k < 30; k++) trial(["A"]); for (let k = 0; k < 30; k++) trial(["A", "B"]); for (let k = 0; k < 30; k++) trial(["C", "D"]); return V.D - V.B; });
    out.push(item("RM-81", P, "Classical conditioning with blocking (roadmap 81)", "blocking index V_D − V_B", "Rescorla–Wagner shared prediction error", [compare("associative-only learner", run(true), run(false))])); }
  return out; }
// === END PREREG v2.2 TESTS ===

// ---- live organs (round 8): roadmap mechanisms wired into the rendered creature's loop (src/app.tsx) ----
class Organs { th: number; tau: number; r: Rng; ab: Set<string>; hab = new Map<string, number>(); root: Uint8Array; genome: Uint8Array; G: Uint8Array[] = []; H: Uint8Array[] = []; arousal = 0.5;
  constructor(seed: number, ablate: string[] = []) { this.r = mulberry(seed * 227 + 7); this.tau = 22 + 4 * this.r(); this.th = this.r() * 6.283185307; this.ab = new Set(ablate); this.root = sha256(utf8("seed:" + seed)); const g = mulberry(seed * 31 + 7); this.genome = Uint8Array.from({ length: 64 }, () => Math.floor(g() * 256)); }
  /* circadian: one organ step per frame; light from the scene's day/night cycle; returns arousal in [0,1] */
  circ(light: number): number { this.th += 6.283185307 / this.tau - (this.ab.has("circ") ? 0 : CIRK) * light * Math.sin(this.th) + gauss(this.r) * 0.02; this.arousal = 0.5 + 0.5 * Math.cos(this.th); return this.arousal; }
  /* habituation: stimulus-specific synaptic depression; slow recovery each frame */
  poke(stim: string): number { const w = this.hab.get(stim) ?? 1; if (!this.ab.has("hab")) this.hab.set(stim, w * 0.85); return w; }
  recover(): void { this.hab.forEach((w, k) => this.hab.set(k, w + (1 - w) * 0.002)); }
  /* lineage: the RV32I core's mutation word mutates the genome; every generation is appended to a SHA-256 chain */
  mutate(word: number): void { const g = this.genome.slice(); const m = 1 + (word & 3) % 3; for (let j = 0; j < m; j++) { const bi = (word >>> (2 + 9 * j)) & 511; g[bi >> 3] ^= 1 << (bi & 7); } this.genome = g; const p = this.H.length ? this.H[this.H.length - 1] : this.root; this.G.push(g); this.H.push(this.ab.has("chain") ? sha256(g) : sha256(cat(p, g))); }
  head(): string { return this.H.length ? hex(this.H[this.H.length - 1]) : hex(this.root); }
  verify(G: Uint8Array[], H: Uint8Array[], head: string): boolean { if (this.ab.has("chain")) { for (let j = 0; j < G.length; j++) if (hex(sha256(G[j])) !== hex(H[j])) return false; return true; } let p = this.root; for (let j = 0; j < G.length; j++) { const x = sha256(cat(p, G[j])); if (hex(x) !== hex(H[j])) return false; p = x; } return hex(p) === head; }
  /* tamper audit: flip one bit in a random generation; adversary recomputes that record's own hash field */
  tamperAudit(n: number, r: Rng): number { if (this.G.length < 2) return 0; const head = this.head(); let det = 0; for (let tr = 0; tr < n; tr++) { const k = Math.floor(r() * this.G.length), bi = Math.floor(r() * 512); const G2 = this.G.map((g) => g.slice()); G2[k][bi >> 3] ^= 1 << (bi & 7); const H2 = this.H.slice();
      H2[k] = this.ab.has("chain") ? sha256(G2[k]) : sha256(cat(k ? this.H[k - 1] : this.root, G2[k])); if (!this.verify(G2, H2, head)) det++; } return det / n; } }
import { LearningProgress } from "./fp/cur";
import { InputLayer } from "./fp/l4";
import { ProtoPosterior } from "./fp/hot1";
import { Affect, type Persona } from "./affect";
import { grow, randomGenome, cortexGene, type DevGenome } from "./develop";
import { SensoryBus, SelfModel, Curvature, NeoHooks, type HookReq } from "./v40mods";
// ===== Creature 001 organism v3.2 (v3.0 core + v3.1 Mind layer + v3.2 decision/replay fixes): one coupled, deterministic, seedable living-system simulation =====
// Runs headless in node (tests) and in the browser (app.tsx drives rendering + inspector from this state only).
// 1 tick = 1 simulated minute. Spiking substeps inside each tick. Every number labelled "illustrative" in
// SYSTEMS_DESIGN.md is a modelling choice, not a measured biological constant.
type Rng = (() => number) & { getState?: () => number; setState?: (a: number) => void };
function mulberry(seed: number): Rng { let a = seed >>> 0; const f: Rng = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; f.getState = () => a; f.setState = (x: number) => { a = x >>> 0; }; return f; } // v3.6: state accessors for snapshot()/restore()
const clamp = (x: number, a = 0, b = 1): number => (x < a ? a : x > b ? b : x);
const sig = (x: number): number => 1 / (1 + Math.exp(-x));
function digamma(x: number): number { let r = 0; while (x < 6) { r -= 1 / x; x += 1; } const f = 1 / (x * x); return r + Math.log(x) - 0.5 / x - f * (1 / 12 - f * (1 / 120 - f * (1 / 252 - f * (1 / 240 - f / 132)))); }
/** v3.6: I(y; p) for y ~ Bernoulli(p), p ~ Beta(a, b): H[Bern(mean)] - E_p H[Bern(p)] (nats) */
function betaIG(a: number, b: number): number { const n = a + b, m = a / n; const H = -(m * Math.log(m) + (1 - m) * Math.log(1 - m)); const EH = -(m * (digamma(a + 1) - digamma(n + 1)) + (1 - m) * (digamma(b + 1) - digamma(n + 1))); return Math.max(0, H - EH); }
const IG0 = betaIG(1, 1);

// ---------------- regions (central nervous system) + enteric nervous system ----------------
const REGIONS = [["SENS", 16], ["THAL", 16], ["CTX", 64], ["HIP", 32], ["STR", 32], ["HYP", 16], ["VTA", 6], ["RAPHE", 6], ["LC", 6], ["BF", 6], ["INS", 8], ["SCN", 8], ["MOT", 8], ["ENS", 48]] as const;
type Region = typeof REGIONS[number][0];
const R0: Record<string, number> = {}; export const RN: Record<string, number> = {};
{ let o = 0; for (const [n, k] of REGIONS) { R0[n] = o; RN[n] = k; o += k; } }
const NNEU = REGIONS.reduce((s, r) => s + r[1], 0);
const INHIB = (i: number): boolean => (i >= R0.CTX + 52 && i < R0.CTX + 64) || (i >= R0.STR && i < R0.STR + RN.STR) || (i >= R0.ENS + 36 && i < R0.ENS + 48); // cortical interneurons, striatal MSNs (GABAergic), ENS inhibitory motor neurons
// region->region connection probability (illustrative; sparsity in the FlyWire range ~1e-3..1e-1 within neuropils, see design doc)
const CP: [Region, Region, number][] = [["SENS", "THAL", 0.25], ["THAL", "CTX", 0.12], ["CTX", "THAL", 0.06], ["CTX", "CTX", 0.1], ["CTX", "HIP", 0.06], ["HIP", "CTX", 0.06], ["HIP", "HIP", 0.05],
  ["CTX", "STR", 0.08], ["STR", "MOT", 0.15], ["CTX", "MOT", 0.05], ["HYP", "VTA", 0.2], ["HYP", "LC", 0.15], ["HYP", "HYP", 0.1], ["INS", "LC", 0.25], ["INS", "CTX", 0.06], ["INS", "HYP", 0.15],
  ["VTA", "STR", 0.1], ["LC", "CTX", 0.08], ["RAPHE", "CTX", 0.05], ["BF", "CTX", 0.06], ["BF", "HIP", 0.1], ["SCN", "HYP", 0.25], ["SCN", "RAPHE", 0.15], ["CTX", "INS", 0.06], ["ENS", "ENS", 0.12], ["ENS", "HYP", 0.05]];
type Syn = { pre: Int32Array; post: Int32Array; w: Float32Array; plastic: Uint8Array };

// ---------------- quantum layer: 3-qubit state vector (port of the Moonlab gate idea; Born-rule sampling) ----------------
// v3.6 snapshot codec: typed arrays -> {__ta, v}; PRNG closures -> {__rng}; other functions and back-references skipped
const TA: Record<string, any> = { Float32Array, Float64Array, Int32Array, Uint8Array, Uint32Array, Int8Array, Uint16Array, Int16Array };
function snapEnc(x: any, skip: Set<string>): unknown { if (x === null || typeof x !== "object") return typeof x === "function" ? (x.getState ? { __rng: x.getState() } : undefined) : x;
  if (ArrayBuffer.isView(x)) return { __ta: x.constructor.name, v: Array.from(x as any) }; if (Array.isArray(x)) return x.map((e) => snapEnc(e, skip));
  const o: Record<string, unknown> = {}; for (const k of Object.keys(x)) { if (skip.has(k)) continue; const v = x[k]; if (typeof v === "function" && !v.getState) continue; o[k] = snapEnc(v, skip); } return o; }
function snapVal(cur: any, v: any, skip: Set<string>): any { if (v === null || typeof v !== "object") return v; if (v.__rng !== undefined) { if (typeof cur === "function" && cur.setState) { cur.setState(v.__rng); return cur; } const f = mulberry(0); f.setState!(v.__rng); return f; }
  if (v.__ta) { const T = TA[v.__ta]; if (cur && cur.constructor === T && cur.length === v.v.length) { cur.set(v.v); return cur; } return T.from(v.v); }
  if (Array.isArray(v)) { if (Array.isArray(cur)) { const out = v.map((e, i) => snapVal(cur[i], e, skip)); cur.length = 0; cur.push(...out); return cur; } return v.map((e) => snapVal(undefined, e, skip)); }
  if (cur && typeof cur === "object" && !Array.isArray(cur) && !ArrayBuffer.isView(cur)) { snapDec(cur, v, skip); return cur; } const o: any = {}; for (const k of Object.keys(v)) o[k] = snapVal(undefined, v[k], skip); return o; }
function snapDec(target: any, st: any, skip: Set<string>): void { for (const k of Object.keys(st)) { if (skip.has(k)) continue; target[k] = snapVal(target[k], st[k], skip); } }
class Q3 { re = new Float64Array(8); im = new Float64Array(8); ext: number[] | null = null /* v3.6: probabilities supplied by an external statevector backend */; constructor() { this.re[0] = 1; }
  reset(): void { this.re.fill(0); this.im.fill(0); this.re[0] = 1; this.ext = null; }
  ry(q: number, t: number): void { const c = Math.cos(t / 2), s = Math.sin(t / 2), m = 1 << q; for (let i = 0; i < 8; i++) if (!(i & m)) { const j = i | m; const a = this.re[i], b = this.re[j], ai = this.im[i], bi = this.im[j]; this.re[i] = c * a - s * b; this.re[j] = s * a + c * b; this.im[i] = c * ai - s * bi; this.im[j] = s * ai + c * bi; } }
  rz(q: number, t: number): void { const m = 1 << q; for (let i = 0; i < 8; i++) { const ph = (i & m) ? t / 2 : -t / 2; const c = Math.cos(ph), s = Math.sin(ph); const a = this.re[i], b = this.im[i]; this.re[i] = a * c - b * s; this.im[i] = a * s + b * c; } }
  cx(c: number, t: number): void { const mc = 1 << c, mt = 1 << t; for (let i = 0; i < 8; i++) if ((i & mc) && !(i & mt)) { const j = i | mt; let x = this.re[i]; this.re[i] = this.re[j]; this.re[j] = x; x = this.im[i]; this.im[i] = this.im[j]; this.im[j] = x; } }
  probs(): number[] { if (this.ext) return this.ext.slice(); const p: number[] = []; for (let k = 0; k < 8; k++) p.push(this.re[k] ** 2 + this.im[k] ** 2); return p; }
  measure(u: number): number { const p = this.probs(); let k = 0; for (; k < 7; k++) { u -= p[k]; if (u < 0) break; } return k; }
  prepare(th: number[]): void { this.reset(); for (let q = 0; q < 3; q++) this.ry(q, th[q]); this.cx(0, 1); this.cx(1, 2); for (let q = 0; q < 3; q++) this.rz(q, th[q] * 0.7); } }
// Quantum geometric tensor of |psi(theta)> by central differences: Q_ij = <d_i psi|d_j psi> - <d_i psi|psi><psi|d_j psi>.
// Re Q = Fubini-Study metric, -2 Im Q = Berry curvature (definitions as in tsotchke/quantum_geometric_tensor; this is a small TS port of the definition, not that library).
function qgt(th: number[]): { g: number[][]; berry: number[][]; trace: number } {
  const st = (t: number[]): [Float64Array, Float64Array] => { const q = new Q3(); q.prepare(t); return [q.re.slice(), q.im.slice()]; };
  const h = 1e-4; const [r0, i0] = st(th); const dR: Float64Array[] = [], dI: Float64Array[] = [];
  for (let a = 0; a < 3; a++) { const tp = th.slice(), tm = th.slice(); tp[a] += h; tm[a] -= h; const [rp, ip] = st(tp), [rm, im] = st(tm); dR.push(rp.map((v, k) => (v - rm[k]) / (2 * h))); dI.push(ip.map((v, k) => (v - im[k]) / (2 * h))); }
  const ip = (ar: Float64Array, ai: Float64Array, br: Float64Array, bi: Float64Array): [number, number] => { let re = 0, imv = 0; for (let k = 0; k < 8; k++) { re += ar[k] * br[k] + ai[k] * bi[k]; imv += ar[k] * bi[k] - ai[k] * br[k]; } return [re, imv]; };
  const g = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], berry = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const [xr, xi] = ip(dR[a], dI[a], dR[b], dI[b]); const [ar, ai] = ip(dR[a], dI[a], r0, i0); const [br, bi] = ip(r0, i0, dR[b], dI[b]);
    const cr = ar * br - ai * bi, ci = ar * bi + ai * br; g[a][b] = xr - cr; berry[a][b] = -2 * (xi - ci); }
  return { g, berry, trace: g[0][0] + g[1][1] + g[2][2] }; }
// NIST SP 800-90B continuous health tests (repetition count + adaptive proportion), cutoff formulas ported from tsotchke/quantum_rng src/health/health_tests.c
class Health { rctCut: number; aptCut: number; W = 512; last = -1; run = 0; win: number[] = []; fails = 0; n = 0;
  constructor(minEntropy: number) { this.rctCut = Math.ceil(1 + 30 / minEntropy); const p = Math.pow(2, -minEntropy); const z = 5.0; /* ~2^-30 false alarm */ this.aptCut = Math.ceil(this.W * p + z * Math.sqrt(this.W * p * (1 - p)) + 0.5); }
  push(s: number): void { this.n++; if (s === this.last) { this.run++; if (this.run >= this.rctCut) { this.fails++; this.run = 1; } } else { this.last = s; this.run = 1; }
    this.win.push(s); if (this.win.length === this.W) { const c = this.win.filter((x) => x === this.win[0]).length; if (c >= this.aptCut) this.fails++; this.win = []; } } }

// ---------------- v3.1 Mind layer: workspace, attention, metacognition, prediction, agency, binding, planning ----------------
// Operates on the spiking CNS every tick (reads CTX module rates, NE/ACh/DA, adenosine), writes back neural drive (broadcast -> HIP,
// attention -> thalamic gain, top-down -> THAL, motor -> MOT), LC bursts (ignition, prediction error) and an ATP cost. Each mechanism has a lesion.
const NMOD = 4, MW = 13; // 4 cortical modules x 13 excitatory neurons (CTX 0..51); CTX 52..63 are interneurons
const msoftmax = (z: number[], beta = 1): number[] => { const m = Math.max(...z); const e = z.map((v) => Math.exp(beta * (v - m))); const s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); };
const margmax = (a: ArrayLike<number>): number => { let b = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[b]) b = i; return b; };
const mdot = (w: Float64Array, x: ArrayLike<number>, off = 0): number => { let s = 0; for (let i = 0; i < x.length; i++) s += w[off + i] * x[i]; return s + w[off + x.length]; };
// linear softmax readout with delta rule (cross-entropy gradient)
import { tsotchkeEntropy } from "./tsotchke";
import { TPC } from "./fp/tpc";
class Lin { W: Float64Array; constructor(public nOut: number, public nIn: number) { this.W = new Float64Array(nOut * (nIn + 1)); }
  out(x: ArrayLike<number>): number[] { const z: number[] = []; for (let k = 0; k < this.nOut; k++) z.push(mdot(this.W, x, k * (this.nIn + 1))); return z; }
  learn(x: ArrayLike<number>, target: number, lr: number, beta = 3): void { const p = msoftmax(this.out(x), beta); for (let k = 0; k < this.nOut; k++) { const g = (k === target ? 1 : 0) - p[k]; const o = k * (this.nIn + 1); for (let i = 0; i < this.nIn; i++) this.W[o + i] += lr * g * x[i]; this.W[o + this.nIn] += lr * g; } }
  regress(x: ArrayLike<number>, y: number[], lr: number): void { const z = this.out(x); let n = 1; for (let i = 0; i < x.length; i++) n += x[i] * x[i]; for (let k = 0; k < this.nOut; k++) { const g = (y[k] - z[k]) / n; const o = k * (this.nIn + 1); for (let i = 0; i < this.nIn; i++) this.W[o + i] += lr * g * x[i]; this.W[o + this.nIn] += lr * g; } } }
/** v3.5: recursive least squares (exponentially forgetting) for the insula's causal glucose model: converges to the least-squares solution instead of NLMS's noisy steps */
class RLS { w: Float64Array; P: Float64Array; n: number; constructor(nIn: number, public lam: number) { this.n = nIn + 1; this.w = new Float64Array(this.n); this.P = new Float64Array(this.n * this.n); for (let i = 0; i < this.n; i++) this.P[i * this.n + i] = 100; }
  out(x: ArrayLike<number>): number { let z = this.w[this.n - 1]; for (let i = 0; i < this.n - 1; i++) z += this.w[i] * x[i]; return z; }
  fit(x: ArrayLike<number>, y: number): void { const n = this.n, u = new Float64Array(n); for (let i = 0; i < n - 1; i++) u[i] = x[i]; u[n - 1] = 1; const Pu = new Float64Array(n); let den = this.lam; for (let i = 0; i < n; i++) { let a = 0; for (let j = 0; j < n; j++) a += this.P[i * n + j] * u[j]; Pu[i] = a; den += u[i] * a; } const e = y - this.out(x); for (let i = 0; i < n; i++) this.w[i] += (Pu[i] / den) * e; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) this.P[i * n + j] = (this.P[i * n + j] - (Pu[i] * Pu[j]) / den) / this.lam; } }
// Kalman attention schema over [focus, drift] (shared for self and for modelling another agent)
class Kal { x = [0, 0]; P = [[1, 0], [0, 1]]; adapt = 0; constructor(public q = 0.002, public qd = 0.0004, public r = 0.09) {}
  predict(u = 0): number { const [p, d] = this.x; this.x = [p + d + u, d]; const P = this.P; this.P = [[P[0][0] + 2 * P[0][1] + P[1][1] + this.q, P[0][1] + P[1][1]], [P[0][1] + P[1][1], P[1][1] + this.qd]]; return this.x[0]; }
  update(z: number): number { const S = this.P[0][0] + this.r; const nis = (z - this.x[0]) ** 2 / S; const infl = nis > 6 ? 3 : 1; /* surprise (NIS) inflates uncertainty */ this.P[0][0] *= infl; this.P[1][1] *= infl;
    const S2 = this.P[0][0] + this.r, K0 = this.P[0][0] / S2, K1 = this.P[0][1] / S2, e = z - this.x[0]; this.x = [this.x[0] + K0 * e, this.x[1] + K1 * e];
    const P = this.P; this.P = [[(1 - K0) * P[0][0], (1 - K0) * P[0][1]], [P[1][0] - K1 * P[0][0], P[1][1] - K1 * P[0][1]]];
    if (this.adapt > 0) { /* v3.6: innovation-based adaptive estimation of the noise covariances (covariance matching; Mehra 1972, Mohamed & Schwarz 1999): the schema learns how noisy its own attention and self-observation are */ const a = this.adapt; this.r = Math.max(0.005, (1 - a) * this.r + a * (e * e - S + this.r)); this.q = Math.max(1e-5, (1 - a) * this.q + a * (K0 * e) ** 2); this.qd = Math.max(1e-7, (1 - a) * this.qd + a * (K1 * e) ** 2); }
    return nis; } }
class Mind {
  rate: Float64Array[] = []; amp = [0, 0, 0, 0]; ampPrev = [0, 0, 0, 0]; post: number[][] = []; cls: Lin[] = []; sal = [0, 0, 0, 0];
  win = -1; ign = 0; ignitions = 0; bc = new Float64Array(8); bcOut = new Float64Array(8); att = [1, 1, 1, 1]; Wq = new Float64Array(4 * 4 * 4); lastQ: [number, number, number] | null = null;
  act = new Lin(4, 8); recv = new Lin(4, 8); rep = new Lin(4, 8); assoc = new Lin(4, 26); meta = new Float64Array(5); conf = 0.5; margin = 0; lastAct = -1; action = -1; actP: number[] = [0.25, 0.25, 0.25, 0.25];
  proto: number[][][] = []; l4: InputLayer[] = []; recon: Lin[] = []; percept: number[][] = []; td = new Float64Array(16);
  pp = new Lin(16, 65); pred = new Float64Array(16); ppMean = new Float64Array(16); ppErr = 0; ctxPrev = new Float64Array(65);
  af = 0; afTarget = 0; drift = 0; afObs = 0; kal = new Kal(); other = new Kal(); afErr = 0; astU = 0;
  phase = [0, 1.5, 3, 4.5]; K = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; co = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; mAvg = [0, 0, 0, 0]; plv: { c: number; s: number }[][] = [];
  wv = new Float64Array(53); el = new Float64Array(53); V = 0; Vprev = 0; tdErr = 0;
  arm = 0; gTrue = 1; gHat = 1; efference = 0; dArmPred = 0; dArmObs = 0; push = 0; motor = 0;
  intero = new Lin(1, 5); interoBuf: { x: number[]; at: number }[] = []; glcPred = 0;
  // v3.5: reward is a setter so the actor knows a reward event happened (policy-gradient credit to the last decision)
  _rew = 0; rewSet = false; get rew(): number { return this._rew; } set rew(v: number) { this._rew = v; this.rewSet = true; }
  meta2 = new Float64Array(8); confF: number[] = [0, 0, 0, 0, 0, 0, 0, 1]; pgX: Float64Array | null = null; pgA = -1; pgP: number[] = [0.25, 0.25, 0.25, 0.25]; rbar = 0; pbar = [0.25, 0.25, 0.25, 0.25]; interoBuf2: { x: number[]; at: number; g0: number }[] = []; rls = new RLS(5, M35.rlsLam); reVar = [0.1, 0.1, 0.1, 0.1];
  tdA = [0, 0, 0, 0]; tdB = [0, 0, 0, 0]; pr2L = [0, 0, 0, 0] /* v3.7 confidence-gated top-down precision */; meta3 = new Float64Array(10) /* v3.7 monitor weights (adds workspace ignition) */; tdW = [0.5, 0.5, 0.5, 0.5]; buL: number[][] = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; tdL: number[][] = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; // v3.6 learned top-down precision
  cost = 0; prevC = -1; epi: { x: number[]; y: number }[] = []; replays = 0; g: Organism | null = null; Tm = new Int16Array(64).fill(-1); Qmf = new Float64Array(64); sweeps = 0;
  constructor(r: () => number) { const L4K = M40.l4 > 0 ? 16 : 0; for (let m = 0; m < NMOD; m++) { if (L4K) this.l4.push(new InputLayer(4, L4K, Math.floor(r() * 2 ** 31))); this.rate.push(new Float64Array(MW + L4K)); this.post.push([0.25, 0.25, 0.25, 0.25]); this.cls.push(new Lin(4, MW + L4K)); this.recon.push(new Lin(4, MW + L4K)); this.proto.push([0, 1, 2, 3].map((k) => [0, 1, 2, 3].map((j) => (j === k ? 0.5 : 0.1)))); this.percept.push([0, 0, 0, 0]); this.plv.push([0, 1, 2, 3].map(() => ({ c: 0, s: 0 }))); }
    for (let i = 0; i < this.meta.length; i++) this.meta[i] = 0; void r; }
  // one tick: called by Organism.step after the spiking substeps
  step(g: Organism): void { this.g = g; const o = g.o, ne = g.nm.NE.E, ach = g.nm.ACh.E; this.cost = 0; const v35 = ge35(o.mind ?? MIND_DEFAULT), v36 = ge36(o.mind ?? MIND_DEFAULT);
    // v3.5 actor: a reward event credits the previous decision (REINFORCE with a running-average baseline; Williams 1992), so action mappings are learned from outcomes, not only from labels
    if (v35 && this.rewSet && this.pgX && this.pgA >= 0 && g.learn) { const adv = this._rew - this.rbar; this.rbar += 0.05 * (this._rew - this.rbar); const W = this.act.W, n = this.act.nIn + 1;
      for (let k = 0; k < 4; k++) this.pbar[k] += 0.02 * (this.pgP[k] - this.pbar[k]); const Lb = this.pgP.reduce((a, p, j) => a + p * Math.log(this.pbar[j] + 1e-9), 0); for (let k = 0; k < 4; k++) { const gk = M35.pgLr * adv * ((k === this.pgA ? 1 : 0) - this.pgP[k]) - M35.entK * this.pgP[k] * (Math.log(this.pbar[k] + 1e-9) - Lb); /* marginal-entropy (action-diversity) regulariser: penalises collapse onto one stimulus-independent action without flattening stimulus-specific choices */ for (let i = 0; i < 8; i++) W[k * n + i] += gk * this.pgX[i]; W[k * n + 8] += gk; } }
    this.rewSet = false;
    const c34 = o.cortex !== "v31"; for (let m = 0; m < NMOD; m++) this.ampPrev[m] = this.amp[m]; // v3.4: previous-tick amplitude (onset salience)
    for (let m = 0; m < NMOD; m++) { let s = 0; for (let j = 0; j < MW; j++) { const ix = R0.CTX + m * MW + j, v = g.rate[ix]; this.rate[m][j] = c34 ? CX.norm * (v - g.rateAvg[ix]) / (M50.zr > 0 ? Math.sqrt((g.rateVar ??= new Float64Array(NNEU).fill(0.04))[ix]) + 0.05 : 1) : v; /* v5.1 zr: z-scored rates for fast single-pass readouts (divisive normalisation; Carandini & Heeger 2012) */ s += v; } if (this.l4.length && m * 4 + 4 <= 16) { const z = this.l4[m].out(g.sens.slice(m * 4, m * 4 + 4)); for (let k = 0; k < z.length; k++) this.rate[m][MW + k] = z[k]; } /* v4.0 FIRST-PRINCIPLES cue encoding (fp/l4.ts): the read-outs also see a static L4-like input layer of the module's own receptor channels */ this.amp[m] = s / MW; // v3.4: readouts see adaptation-normalised rates
      this.post[m] = msoftmax(this.cls[m].out(this.rate[m]), 3);
      // perception: bottom-up linear reconstruction of the 4 sensory lines; top-down: precision-weighted generative prototype (HOT-1)
      const bu = this.recon[m].out(this.rate[m]); const pm = this.post[m]; const tdv = [0, 1, 2, 3].map((j) => pm.reduce((a, p, k) => a + p * this.proto[m][k][j], 0)); const pr = Math.max(...pm);
      if (v35 && !o.topdownLesion) { /* v3.5: precision-weighted generative top-down: sharpened posterior selects the learned prototype; weight = posterior precision */ const lg = this.cls[m].out(this.rate[m]); const ps0 = msoftmax(lg, M35.tdBeta); const s2 = Math.max(0.01, M35.tdS * this.reVar[m]); const ll = ps0.map((p, k) => M35.tdPrior * Math.log(p + 1e-9) - this.proto[m][k].reduce((a, q, j) => a + (bu[j] - q) ** 2, 0) / (2 * s2)); const mx = Math.max(...ll); const ez = ll.map((v) => Math.exp(v - mx)); const zs = ez.reduce((a, v) => a + v, 0); const ps = ez.map((v) => v / zs); /* Bayesian fusion: cortical class prior x Gaussian likelihood of the bottom-up reconstruction under each learned prototype, noise variance = learned recon error */ const pr2 = Math.max(...ps); for (let j = 0; j < 4; j++) tdv[j] = ps.reduce((a, p, k) => a + p * this.proto[m][k][j], 0); const v37t = is37(o.mind ?? MIND_DEFAULT) && M37.tdLr2 > 0; if (v37t) this.pr2L[m] = pr2; const w = v37t ? 1 / (1 + Math.exp(-(this.tdA[m] + this.tdB[m] * (pr2 - 0.5) * 4))) /* v3.7: top-down precision is a learned function of posterior confidence (a sharp posterior means the prototype is a reliable prediction; Feldman & Friston 2010 precision as confidence) */ : v36 ? Math.max(0, Math.min(1, this.tdW[m])) : Math.min(1, M35.tdGain * pr2); this.percept[m] = bu.map((b, j) => (1 - w) * b + w * tdv[j]); if (is39(o.mind ?? MIND_DEFAULT) && M39.tdIter > 0) for (let it = 0; it < M39.tdIter; it++) { /* v3.9: recurrent settling (predictive-coding inference iterates bottom-up/top-down exchange; Rao & Ballard 1999): the class posterior is re-evaluated on the current fused percept, the prototype re-selected and re-fused */ const l2 = ps0.map((p, k) => M35.tdPrior * Math.log(p + 1e-9) - this.proto[m][k].reduce((a2, q, j) => a2 + (this.percept[m][j] - q) ** 2, 0) / (2 * s2)); const m2 = Math.max(...l2); const e2 = l2.map((v) => Math.exp(v - m2)); const z2 = e2.reduce((a2, v) => a2 + v, 0); for (let j = 0; j < 4; j++) tdv[j] = e2.reduce((a2, v, k) => a2 + (v / z2) * this.proto[m][k][j], 0); this.percept[m] = bu.map((b2, j) => (1 - w) * b2 + w * tdv[j]); } if (v36) { this.buL[m] = bu.slice(); this.tdL[m] = tdv.slice(); } /* v3.6: the top-down weight is a learned precision (below, in teach) */ }
      else this.percept[m] = o.topdownLesion ? bu : bu.map((b, j) => (1 - pr) * b + pr * tdv[j]); for (let j = 0; j < 4; j++) this.td[m * 4 + j] = o.topdownLesion ? 0 : 0.25 * pr * tdv[j]; if (M40.fpH1 > 0 && is40(o.mind ?? MIND_DEFAULT)) { this.ppBu[m] = bu.slice(); if (!o.topdownLesion) { if (!this.fpP[m]) this.fpP[m] = new ProtoPosterior(4, 4); this.percept[m] = this.fpP[m].percept(bu); } } /* v4.0 FIRST-PRINCIPLES HOT-1: percept = Bayes posterior mean under learned prototypes + noise (fp/hot1.ts) */ }
    // global workspace: salience competition, NE lowers the ignition threshold, incumbent hysteresis; 1 slot
    const mt = c34 ? MT : MT31; const thr = mt.ignThr * (1.3 - 0.6 * Math.min(1, ne)); let best = -1, bs = 0; // v3.4: workspace constants re-tuned on seeds 2000+ (v3.1 values kept for cortex "v31")
    const thc = [0, 0, 0, 0]; if (v35) for (let m = 0; m < NMOD; m++) { /* v3.5: salience = thalamic input contrast (pulvinar-like bottom-up salience: peak minus mean of the module's 4 relay lines), not the adaptation-normalised cortical amplitude */ let mx = 0, sm = 0; for (let j = 0; j < 4; j++) { const v = M35.salSens ? g.rate[R0.SENS + m * 4 + j] : g.rate[R0.THAL + m * 4 + j]; mx = Math.max(mx, v); sm += v; } thc[m] = M35.salK * (mx - sm / 4); }
    for (let m = 0; m < NMOD; m++) { this.sal[m] = Math.max(0, (v35 ? thc[m] : this.amp[m]) - mt.ampBase * this.ampPrev[m]) * this.att[m] * (mt.salOff + Math.max(...this.post[m])) ** mt.confExp * (m === this.win ? mt.hyst : 1); if (this.sal[m] > bs) { bs = this.sal[m]; best = m; } }
    const prevWin = this.win; this.bc.fill(0);
    if (o.gwLesion) { this.win = -1; for (let m = 0; m < NMOD; m++) for (let k = 0; k < 4; k++) this.bc[4 + k] += this.post[m][k] / NMOD; this.bc.fill(0.25, 0, 4); }
    else if (bs > thr) { this.win = best; this.bc[best] = 1; for (let k = 0; k < 4; k++) this.bc[4 + k] = this.post[best][k]; } else this.win = -1;
    if (prevWin >= 0 && this.win >= 0 && this.win !== prevWin) this.lastQ = [prevWin, this.prevC, this.win]; this.prevC = this.win >= 0 ? margmax(this.post[this.win]) : -1;
    this.ign = this.win >= 0 && this.win !== prevWin ? 1 : 0; this.ignitions += this.ign; if (this.ign) { g.predErr += 0.15; this.cost += 0.0004; } // ignition: LC burst + metabolic cost
    for (let i = 0; i < 8; i++) this.bcOut[i] = o.bcLesion ? 0 : (o.bcGain ?? 1) * this.bc[i]; /* v4.0 audit: graded broadcast lesion */
    // state-dependent attention: workspace content (winner module, its class) sets thalamic gain of other modules next tick (learned by RPE)
    this.att = [1, 1, 1, 1]; if (!o.seqLesion && this.win >= 0) { const c = margmax(this.post[this.win]); for (let m = 0; m < NMOD; m++) if (m !== this.win) this.att[m] = 1 + 2 * Math.max(0, this.Wq[(this.win * 4 + c) * 4 + m]); }
    // action readout from workspace content; stochastic selection with DA-set temperature
    const z = this.act.out(this.bc); this.actP = msoftmax(z, 2 + 6 * Math.min(1, g.nm.DA.E + 0.2)); const srt = this.actP.slice().sort((a, b) => b - a); this.margin = srt[0] - srt[1];
    this.lastAct = this.action; let u = g.r(); let a = 0; for (; a < 3; a++) { u -= this.actP[a]; if (u < 0) break; } this.action = a;
    // metacognition: second-order monitor on margin, consistency, NE, adenosine
    if (v35) { /* v3.5 higher-order monitor: reads first-order states (chosen-action probability, margin, winner posterior, evidence amplitude, greedy flag, NE, adenosine) */ const wm = this.win >= 0 ? this.win : margmax(this.amp); this.confF = [this.actP[this.action], this.margin, Math.max(...this.post[wm]), 4 * this.amp[wm], this.action === margmax(this.actP) ? 1 : 0, ne, g.S, 1]; if (is37(o.mind ?? MIND_DEFAULT)) { this.confF = this.confF.concat([this.win >= 0 ? 1 : 0]); if (is39(o.mind ?? MIND_DEFAULT) && M39.evQ > 0) { const sv = Array.from(g.sens.slice(wm * 4, wm * 4 + 4)).sort((x, y) => y - x); this.confF.push(M39.evQ * (sv[0] - sv[1])); } /* v3.9: the monitor also reads early sensory evidence strength (top-minus-second line in the winning module), a first-order quality cue that metacognition uses (Fleming & Daw 2017 second-order model) */ /* v3.7: the monitor also reads whether the content reached the workspace (no ignition = no access = guess; Dehaene 2014) */ this.conf = 1 / (1 + Math.exp(-this.confF.reduce((s, v, i) => s + v * this.meta3[i], 0))); } else this.conf = 1 / (1 + Math.exp(-this.confF.reduce((s, v, i) => s + v * this.meta2[i], 0))); }
    else { const f = [this.margin, this.action === margmax(this.actP) ? 1 : 0, ne, g.S, 1]; this.conf = 1 / (1 + Math.exp(-f.reduce((s, v, i) => s + v * this.meta[i], 0))); }
    if (v35 && this.win >= 0) { this.pgX = Float64Array.from(this.bc); this.pgA = this.action; this.pgP = this.actP.slice(); }
    // predictive coding: predict this tick's sensory lines from last tick's cortex; error -> LC
    for (let i = 0; i < 16; i++) { this.ppMean[i] += 0.05 * (g.sens[i] - this.ppMean[i]); } const P = o.ppLesion ? Array.from(this.ppMean) : this.pp.out(this.ctxPrev); let e = 0; for (let i = 0; i < 16; i++) { this.pred[i] = P[i]; e += (g.sens[i] - P[i]) ** 2; } this.ppErr = e / 16;
    if (!o.ppLesion && !o.ppFreeze && g.learn) this.pp.regress(this.ctxPrev, Array.from(g.sens), 0.5); g.predErr += 0.3 * Math.min(1, this.ppErr);
    for (let i = 0; i < 64; i++) this.ctxPrev[i] = g.rate[R0.CTX + i]; this.ctxPrev[64] = 0;
    // attention schema (self): true focus drifts with NE-scaled noise; noisy self-observation; Kalman schema estimates focus+drift and steers
    this.drift += 0.004 * g.gauss() - 0.002 * this.drift; this.af += this.astU + this.drift + 0.03 * (0.5 + ne) * g.gauss(); this.afObs = this.af + 0.3 * g.gauss();
    this.kal.adapt = v36 && !o.astLesion ? M36.akA : 0; this.kal.predict(this.astU); this.kal.update(this.afObs); this.astU = o.astLesion ? -0.5 * (this.afObs - this.afTarget) : -(this.kal.x[0] - this.afTarget) - this.kal.x[1]; this.afErr = (this.af - this.afTarget) ** 2;
    // binding field: module oscillators (Kuramoto), coupling learned fast from co-activation fluctuations, ACh gain
    for (let m = 0; m < NMOD; m++) this.mAvg[m] += 0.1 * (this.amp[m] - this.mAvg[m]);
    for (let m = 0; m < NMOD; m++) for (let n = 0; n < NMOD; n++) { this.co[m][n] += 0.25 * ((this.amp[m] - this.mAvg[m]) * (this.amp[n] - this.mAvg[n]) - this.co[m][n]); this.K[m][n] = o.fieldLesion || m === n ? 0 : 40 * Math.max(0, this.co[m][n]) / (0.002 + Math.sqrt(Math.abs(this.co[m][m] * this.co[n][n]))) * (0.5 + ach) * 0.05; }
    for (let s = 0; s < 10; s++) { const d = [0, 0, 0, 0]; for (let m = 0; m < NMOD; m++) { d[m] = 0.6 + 0.05 * m + 0.15 * g.gauss(); for (let n = 0; n < NMOD; n++) d[m] += this.K[m][n] * Math.sin(this.phase[n] - this.phase[m]); } for (let m = 0; m < NMOD; m++) this.phase[m] += 0.1 * d[m]; }
    for (let m = 0; m < NMOD; m++) for (let n = 0; n < NMOD; n++) { const dp = this.phase[m] - this.phase[n]; const P2 = this.plv[m][n]; P2.c += 0.2 * (Math.cos(dp) - P2.c); P2.s += 0.2 * (Math.sin(dp) - P2.s); }
    // TD value with eligibility traces over cortical module neurons (UAL); TD error -> DA
    const xv: number[] = []; for (let m = 0; m < NMOD; m++) for (let j = 0; j < MW; j++) xv.push(this.rate[m][j]); this.Vprev = this.V; this.V = mdot(this.wv, xv); this.tdErr = this.rew + 0.9 * this.V - this.Vprev;
    if (g.learn) { let nn = 1; for (let i = 0; i < 53; i++) nn += this.el[i] * this.el[i]; const lr = (v35 ? M35.ualLr : 0.3) * Math.max(-1, Math.min(1, this.tdErr)) / nn; for (let i = 0; i < 53; i++) this.wv[i] += lr * this.el[i]; } // normalised TD (NLMS) step; v3.1 tuning fix: the unnormalised step diverged on seeds 2000+ g.nm.DA.E += 0.05 * Math.max(0, this.tdErr);
    const lam = o.traceLesion ? 0 : v35 ? M35.ualLam : 0.8; for (let i = 0; i < 52; i++) this.el[i] = lam * this.el[i] + xv[i]; this.el[52] = lam * this.el[52] + 1; this._rew = 0;
    // body: arm moved by motor command (efference copy) with unknown gain; external pushes; forward model learned (NLMS) and inverted
    this.dArmPred = o.efferenceLesion ? 0 : (o.fwdLesion ? 1 : this.gHat) * this.efference; const dA = this.gTrue * this.efference + this.push; this.arm = Math.max(-2, Math.min(2, this.arm + dA)); this.dArmObs = dA + 0.02 * g.gauss();
    if (!o.efferenceLesion && !o.fwdLesion && g.learn && Math.abs(this.efference) > 1e-3 && this.push === 0) this.gHat += 0.5 * (this.dArmObs - this.gHat * this.efference) * this.efference / (this.efference ** 2 + 0.01);
    this.motor = Math.abs(this.efference); this.efference = 0; this.push = 0;
    // interoceptive causal model: predict blood glucose 30 min ahead from current physiology (insula); trained online
    const xi = [g.blood.glc / 3, g.gut.glc / 5, g.insulin, g.glucagon, g.motility];
    if (v35) { /* v3.5: the causal model predicts the CHANGE in glucose over 30 min from gut load and hormones (residual on persistence) */ this.glcPred = g.blood.glc + 3 * this.rls.out(xi); this.interoBuf2.push({ x: xi, at: g.t + 30, g0: g.blood.glc }); while (this.interoBuf2.length && this.interoBuf2[0].at <= g.t) { const b = this.interoBuf2.shift() as { x: number[]; at: number; g0: number }; if (g.learn) this.rls.fit(b.x, (g.blood.glc - b.g0) / 3); } } else {
    this.glcPred = 3 * this.intero.out(xi)[0]; this.interoBuf.push({ x: xi, at: g.t + 30 }); while (this.interoBuf.length && this.interoBuf[0].at <= g.t) { const b = this.interoBuf.shift() as { x: number[]; at: number }; if (g.learn) this.intero.regress(b.x, [g.blood.glc / 3], 0.3); } }
    // hippocampal replay of stored action episodes into the action readout (awake ripples: 1/tick; NREM: 6/tick); lesioned with o.replay = "none"
    if (g.learn && o.replay !== "none" && this.epi.length) { const n = g.stage === 0 ? 1 : g.stage >= 2 && g.stage <= 3 ? 6 : 0; for (let k = 0; k < n; k++) { const e = this.epi[Math.floor(g.r() * this.epi.length)]; if ((o.replayP ?? 1) >= 1 || g.r() < (o.replayP ?? 1)) { /* no extra RNG draw at default */ /* v4.0 audit: graded replay rate; matched-count replay with wrong labels */ this.act.learn(e.x, o.replayShuf ? Math.floor(g.r() * 4) : e.y, 0.05); this.replays++; } } this.cost += 0.00001 * n; }
    this.cost += 0.00002 * (this.ign + 1); }
  // ---- task-facing learning signals (feedback, as a trainer or the world would give) ----
  fpP: ProtoPosterior[] = []; ppBu: number[][] = [];
  teach(m: number, label: number, clean?: number[]): void { if (this.fpP[m] && this.ppBu[m]) this.fpP[m].teach(this.ppBu[m], label, clean ?? [0, 1, 2, 3].map((j) => (j === label ? 1 : 0))); if (this.g && this.g.o.eprop) this.g.epropLearn(m, label, clean ?? [0, 1, 2, 3].map((j) => (j === label ? 1 : 0))); const lr = 0.08 * (0.5 + 0.5 * Math.min(1, (this.g ? this.g.nm.ACh.E : 0.3))); this.cls[m].learn(this.rate[m], label, lr); const x = clean ?? [0, 1, 2, 3].map((j) => (j === label ? 1 : 0));
    { const bu0 = this.recon[m].out(this.rate[m]); let e2 = 0; for (let j = 0; j < 4; j++) e2 += (x[j] - bu0[j]) ** 2; this.reVar[m] += 0.05 * (e2 / 4 - this.reVar[m]); }
    if (this.g && ge36(this.g.o.mind ?? MIND_DEFAULT) && !this.g.o.topdownLesion) { /* v3.6: learned top-down precision: the weight given to the generative prediction is fitted (normalised LMS) to how well prediction vs bottom-up evidence matched the teaching signal */ let num = 0, den = 1e-3; for (let j = 0; j < 4; j++) { const dlt = this.tdL[m][j] - this.buL[m][j]; num += (x[j] - this.percept[m][j]) * dlt; den += dlt * dlt; } this.tdW[m] = Math.max(0, Math.min(1, this.tdW[m] + M36.tdLr * num / den));
      if (is37(this.g.o.mind ?? MIND_DEFAULT) && M37.tdLr2 > 0) { const z = this.tdA[m] + this.tdB[m] * (this.pr2L[m] - 0.5) * 4, wv = 1 / (1 + Math.exp(-z)), gz = num / den * wv * (1 - wv); this.tdA[m] += M37.tdLr2 * gz; this.tdB[m] += M37.tdLr2 * gz * (this.pr2L[m] - 0.5) * 4; } }
    this.recon[m].regress(this.rate[m], x, 0.2); for (let j = 0; j < 4; j++) this.proto[m][label][j] += 0.1 * (x[j] - this.proto[m][label][j]); }
  teachAction(label: number, lr = 0.15): void { this.act.learn(this.bc, label, lr); this.epi.push({ x: Array.from(this.bc), y: label }); if (this.epi.length > 300) this.epi.shift(); }
  teachRecv(label: number): void { this.recv.learn(this.bcOut, label, 0.15); }
  teachReport(): void { this.rep.learn(this.bcOut, this.action, 0.15); }
  teachConf(correct: boolean): void { if (this.g && ge35(this.g.o.mind ?? MIND_DEFAULT)) { const e = (correct ? 1 : 0) - this.conf; let nn = 1; for (const v of this.confF) nn += v * v; if (this.confF.length >= 9) { for (let i = 0; i < this.confF.length; i++) this.meta3[i] += M35.confLr * e * this.confF[i] / nn * 4; return; } for (let i = 0; i < 8; i++) this.meta2[i] += M35.confLr * e * this.confF[i] / nn * 4; return; } const f = [this.margin, this.action === margmax(this.actP) ? 1 : 0, (this.g ? this.g.nm.NE.E : 0.3), (this.g ? this.g.S : 0.4), 1]; const e = (correct ? 1 : 0) - this.conf; for (let i = 0; i < 5; i++) this.meta[i] += 0.3 * e * f[i]; }
  rewardQuery(r: number): void { if (!this.lastQ) return; const [w, c, m] = this.lastQ; const i = (w * 4 + c) * 4 + m; this.Wq[i] += 0.2 * (r - this.Wq[i]); }
  // model-based planning over a learned transition model (hippocampal sweeps); sweeps scale with intelligence level; model-free Q as the lesion control
  observe(s: number, a: number, s2: number, r: number): void { this.Tm[s * 4 + a] = s2; const i = s * 4 + a; let mx = 0; for (let b = 0; b < 4; b++) mx = Math.max(mx, this.Qmf[s2 * 4 + b]); this.Qmf[i] += 0.3 * (r + 0.9 * mx - this.Qmf[i]); }
  plan(s: number, goal: number, level: number, modelFree: boolean, r: () => number): number { const tie = (q: number[]): number => { const m = Math.max(...q); const c = q.map((v, k) => (v >= m - 1e-9 ? k : -1)).filter((k) => k >= 0); return c[Math.floor(r() * c.length)]; };
    if (modelFree) return tie([0, 1, 2, 3].map((a) => this.Qmf[s * 4 + a]));
    const V = new Float64Array(16); this.sweeps = 3 * level; for (let k = 0; k < this.sweeps; k++) for (let x = 0; x < 16; x++) { if (x === goal) { V[x] = 1; continue; } let m = 0; for (let a = 0; a < 4; a++) { const y = this.Tm[x * 4 + a]; if (y >= 0) m = Math.max(m, 0.9 * V[y]); } V[x] = m; }
    this.cost += 0.00001 * this.sweeps * 16; return tie([0, 1, 2, 3].map((a) => { const y = this.Tm[s * 4 + a]; return y < 0 ? 0.05 : y === goal ? 1 : 0.9 * V[y]; })); }
  nParams(): number { let n = this.Wq.length + this.wv.length + this.meta.length + this.Qmf.length + this.Tm.length + 3 * 4 * 16; for (const l of [this.act, this.recv, this.rep, this.assoc, this.pp, ...this.cls, ...this.recon]) n += l.W.length; return n; }
  recvOut(): number { return margmax(this.recv.out(this.bcOut)); }
  repOut(): number { return margmax(this.rep.out(this.bcOut)); }
  binding(m: number, n: number): number { const p = this.plv[m][n]; return Math.hypot(p.c, p.s); }
}

// v3.1 sensory-pathway constants (set on tuning seeds; frozen in prereg v3.1 §F)
const TUNE = { thal: 0.1, ctxDrop: 0.35, st: 3, tc: 5, rec: 0.2, sensIn: 1.5, ltcAch: 1.5, ltcIn: 0.5, ltcNe: 0.5 };
const MT31 = { ignThr: 0.06, salOff: 0.6, hyst: 1.15, ampBase: 0, confExp: 1 };
const MT = { ignThr: 0.06, salOff: 0.6, hyst: 1.15, ampBase: 0, confExp: 1 }; // v3.4 workspace constants (tuned on seeds 2000..2015)
const LTC_TAU0 = 1 / Math.log(1.25);
// v3.4 cortex constants (tuned on seeds 2000..2015 only; frozen in prereg v3.4 §F)
const CX = { tc: 1.2, tcSig: 0.55, tcSum: 6.0, ffI: 0.3, eI: 0.5, iE: 0.6, rec0: 0.05, recMax: 1.6, nmdaK: 0.9, aP: 0.02, aM: 0.021, rho: 0.12, hEta: 0.02, vEta: 0.002, dev: 480, devAmp: 1.0, crit: 4, norm: 2.5, gluK: 3.0 };
// v3.4 learned LTC gates for CTX-E [log tau0, aACh, bIn, cNE] (e-prop on tuning seeds; frozen in prereg v3.4 §F). Initialised to the v3.3 hand-set values until training.
const LTC_INIT = [Math.log(1 / Math.log(1.25)), 1.5, 0.5, 0.5]; // e-prop starting point = fixed-tau decay 0.8 per substep when gates are closed
// Frozen 2026-10-29: mean theta after train_eprop.ts 16 tuning seeds (2000-2015) x 3 epochs, eta 0.02 (results/v34_tuning/eprop_training.json). SD 0.099 0.021 0.054 0.009.
const LTC_LEARNED = [1.3115, 1.4248, 0.4722, 0.5351];
// v3.5 Mind/decision constants (tuned on seeds 2000..2015 only; frozen in prereg v3.5 §F). V35TUNE env (JSON) overrides are for tuning runs only.
const M35: Record<string, number> = { tdPrior: 0, tdS: 1, entK: 1, rlsLam: 0.9995, tdBeta: 8, tdGain: 0.5, confLr: 0.2, pgLr: 0.3, xW: 2, xP: 0.05, featIt: 4, salK: 1, orxK: 1.2, salSens: 1, remAll: 1, remLr: 0.25, lrBase: 0.1, lrVol: 0.4, efeK: 0.6, efeTau: 200, efeVis: 0.5, ualLr: 0.3, ualLam: 0.8, interoLr: 0.3 };
// v3.6 parameters, tuned on seeds 2000..2015 only (frozen in prereg v3.6 §F). akA=0 and dendK=0: adaptive Kalman and dendritic gating were tested in tuning and made AST-1 / RPT-2 worse, so they ship switched off. V36TUNE env (JSON) is for tuning runs only.
const M36: Record<string, number> = { neK: 0.1, tdLr: 0.05, akA: 0, lcThr: 2, lcDecay: 0.95, dendK: 0, dendVh: 0.5, dendVs: 0.15, schLam: 2, schDecay: 0.995, efeK: 2, igTau: 300, fbW: 0.2, fbN: 2, slowK: 0, slowTau: 60, visK: 1.5 };
// v3.7 parameters, tuned on seeds 2000..2015 only (frozen in prereg v3.7 §F). V37TUNE env (JSON) is for tuning runs only.
const M37: Record<string, number> = { slowK: 0.2, inhG: 10, dendK: 1, dendVh: 0.5, dendVs: 0.15, tdLr2: 0, bmW: 0, igTau: 300, dLr: 0.2, dTau: 240, depW: 1, fbW: 0.2, fbS: 1 };
declare const process: { env: Record<string, string | undefined> } | undefined;
const M38: Record<string, number> = { efeC: 0.5, efeRef: 1, fK: 4, fSet: 400, thK: 1, thMin: 0.6, mMax: 180, fast: 1, ketSpare: 0, ketEx: 0.0008, ffaInh: 6, gngK: 2, protK: 2, ketK: 4 };
// v3.9 parameters (Round 20; tuned on pooled dev seeds 2000..2031 only, frozen in prereg v3.9). V39TUNE env (JSON) is for tuning runs only.
const M39: Record<string, number> = { ketPS: 0.5, fCrit: 20, p3K: 3, mDeath: 60, lipE: 0.5, xsW: 0, xsSig: 0.5, tdIter: 0, evQ: 0, vK: 0 };
try { const e9 = typeof process !== "undefined" ? process.env.V39TUNE : undefined; if (e9) Object.assign(M39, JSON.parse(e9)); } catch { /* ignore */ }
try { const e = typeof process !== "undefined" ? process.env.V35TUNE : undefined; if (e) Object.assign(M35, JSON.parse(e)); const e6 = typeof process !== "undefined" ? process.env.V36TUNE : undefined; if (e6) Object.assign(M36, JSON.parse(e6)); const e7 = typeof process !== "undefined" ? process.env.V37TUNE : undefined; if (e7) Object.assign(M37, JSON.parse(e7)); const e8 = typeof process !== "undefined" ? process.env.V38TUNE : undefined; if (e8) Object.assign(M38, JSON.parse(e8)); } catch { /* browser */ }
// default Mind version: "v38" (Round 19); ORG_MIND=v37 reproduces v3.7; ORG_MIND=v36 reproduces v3.6 bit-for-bit; ORG_MIND=v35 reproduces v3.5 bit-for-bit; ORG_MIND=v34 (node) reproduces the v3.4 organism bit-for-bit. LTC stays OFF by default (opt-in via o.ltc; it hurt delayed recall in v3.3/v3.4).
const MIND_DEFAULT: "v34" | "v35" | "v36" | "v37" | "v38" | "v39" | "v40" = (() => { try { const e = typeof process !== "undefined" ? process.env.ORG_MIND : undefined; return e === "v34" ? "v34" : e === "v35" ? "v35" : e === "v36" ? "v36" : e === "v37" ? "v37" : e === "v38" ? "v38" : e === "v39" ? "v39" : "v40"; } catch { return "v40"; } })(); // v4.0 branch: default Mind v40; ORG_MIND=v39 reproduces v3.9
/** v3.5 mechanisms stay on in v3.6 (v3.6 adds to them) */ export const ge35 = (m: string): boolean => m === "v35" || m === "v36" || m === "v37" || m === "v38" || m === "v39" || m === "v40";
/** v3.6 mechanisms stay on in v3.7 */ export const ge36 = (m: string): boolean => m === "v36" || m === "v37" || m === "v38" || m === "v39" || m === "v40"; /** v3.7 mechanisms stay on in v3.8 */ export const is37 = (m: string): boolean => m === "v37" || m === "v38" || m === "v39" || m === "v40"; export const is38 = (m: string): boolean => m === "v38" || m === "v39" || m === "v40"; /** v3.9 (Round 20) */ export const is39 = (m: string): boolean => m === "v39" || m === "v40"; /** v4.0 (DELARP consolidation) */ export const phiN = (z: number): number => { const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2), e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2); return 0.5 * (1 + (z >= 0 ? e : -e)); }; /* normal CDF via Abramowitz & Stegun 7.1.26 */
const is40 = (m: string): boolean => m === "v40";
const LTC_DEFAULT = false;
/** v4.0 parameters (dev-tuned on seeds 2000+ only; not frozen). uK: weight of the single uncertainty term; mK: blend of the Beta posterior mean into value; dreamC: pseudo-count a REM dream writes into an unexperienced option's belief; dreamLr: step toward the dreamt belief; tempSD: log-SD of per-individual temperament (curiosity gain) */
const M40: Record<string, number> = { insS: 0, xsel: 0 /* v4.0 RPT-2 candidate, off */, uK: 0.3 /* 2026-10-31 3:48 PM PT: AE-1 exploitation diagnosis; dev 2577, held-out 2593 + 2609 */, mK: 0.5, dreamC: 6, dreamLr: 0.75, tempSD: 0.25, turn: 0, busOut: 0.15, insK: 0.15, cautK: 0.25, simK: 0.3, markK: 0.05, affK: 0.5, forget: 0, eK: 0, tsK: 0, volLeak: 0.01, vetoThr: 0.3, kgK: 0, srcMon: 0, epiN: 0, volX: 0, vetoI: 0, fpH1: 0, l4: 1, dTh: 0, dG: 1, dreamGate: 0, curK: 0, aG: 0, aTh: 1, som: 0, ffi: 0, apL: 0, apAll: 0, apH: 0, onR: 0 };
// v5-core flag (ORG_V5=1): one coherent configuration of the general mechanisms (CORE-ARCHITECTURE.md): signed selective apical cross-area input + dendritic NMDA rectification (cortex), insulin-gated drive (body layer). Off by default.
const M50: Record<string, number> = { tpc: 0 /* v5.2 temporal predictive core */, ceph: 0, hebX: 0, mmG: 0, zr: 0, ltcC: 0 };
/* v5.1 (ORG_V5=2): v5-core + the missing core pieces of CORE-ARCHITECTURE.md */
if (typeof process !== "undefined" && (process.env?.ORG_V5 === "1" || process.env?.ORG_V5 === "2")) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 });
if (typeof process !== "undefined" && process.env?.ORG_V5 === "3") Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { tpc: 1 }); /* v5.2 = v5-core + TPC (prereg B18) */
if (typeof process !== "undefined" && process.env?.ORG_V5 === "2") Object.assign(M50, { ceph: 1, hebX: 0.002, mmG: 1, zr: 1, ltcC: 1 });
 /* dev-tuned 2026-10-31 on seeds 2000-2015 (run C2): dreamC 2->4, module gains halved */
try { const e40 = typeof process !== "undefined" ? process.env.V40TUNE : undefined; if (e40) Object.assign(M40, JSON.parse(e40)); } catch { /* browser */ }
/** v4.0 dev controls: V40OPTS (JSON) fills Opts fields a caller left unset (affectLesion, v40Lesion, develop, v40Ctl) so population runs can apply a per-module control to every test */
let V40OPTS: Record<string, any> = {}; try { const e = typeof process !== "undefined" ? process.env.V40OPTS : undefined; if (e) V40OPTS = JSON.parse(e); } catch { /* browser */ }
const hBin = (q: number): number => (q <= 1e-6 || q >= 1 - 1e-6 ? 0 : -q * Math.log(q) - (1 - q) * Math.log(1 - q)); /* binary entropy (nats) */
const gaussQ = (u: () => number): number => Math.sqrt(-2 * Math.log(Math.max(1e-12, u()))) * Math.cos(2 * Math.PI * u()); /* posterior-sampling draw from the creature's entropy source (Born-rule Q3 measurements / QRNG when noise = quantum) */
const betaSD = (a: number, b: number): number => { const n = a + b, m = a / n; return Math.sqrt(m * (1 - m) / (n + 1)); }; const SD0 = betaSD(1, 1);
// ---------------- options: lesions, clamps, conditions ----------------
type Opts = { seed: number; entropy?: "seeded" | "crypto" | "tsotchke"; noise?: "quantum" | "classical"; starve?: boolean; vagotomy?: boolean; scnLesion?: boolean; insulaLesion?: boolean; kappaShuffle?: boolean;
  sympathectomy?: boolean; replay?: "full" | "none" | "nremOnly" | "remShuffle"; forceWake?: boolean; daClamp?: number; level?: number; leakyLedger?: boolean; access?: "half" | "all";
  // v3.1 mechanism lesions / conditions
  recLesion?: boolean; mixLesion?: boolean; ctFbLesion?: boolean /* v3.6: cut all CTX->THAL synapses */; slowLesion?: boolean /* v3.6: remove the slow cortical NMDA current */; visceralLesion?: boolean /* v3.6: cut the visceral glucose afferent to INS */; topoScramble?: boolean; gwLesion?: boolean; bcLesion?: boolean; bcGain?: number; replayP?: number; replayShuf?: boolean; seqLesion?: boolean; topdownLesion?: boolean; astLesion?: boolean; ppLesion?: boolean; ppFreeze?: boolean;
  veto?: "own" | "shuffle" | "off" | "intShuf" /* v4.0 N13 free won't */; v40Ctl?: string /* v4.0 dev controls: busShuffle,selfBody,glitchInj,glitchNoise,neoRandom */; v40Lesion?: string /* v4.0: comma list of bus,alien,substrate,self,sim,curv,neo (or v40all) */; substrate?: "synthetic" | "replay" | "off"; substrateLog?: { t: number; v: number[] }[]; develop?: boolean /* v4.0: grow the random layer from developmental rules (develop.ts) instead of i.i.d. draws */; devGenome?: DevGenome /* v4.0: inherited developmental genome */;  affectLesion?: string /* v4.0: comma list of emotion,mood,attitude,personality,dysreg */; persona?: Persona /* v4.0: inherited personality */; rpeLesion?: boolean; fwdLesion?: boolean; efeLesion?: boolean; fieldLesion?: boolean; traceLesion?: boolean; efferenceLesion?: boolean; repairLesion?: boolean; pidLesion?: boolean; pidGain?: number /* v4.0 audit: graded */; cephLesion?: boolean /* v5.1 CQM16R: remove learned anticipatory (cephalic-phase) insulin */; pidP?: boolean /* v4.0 audit: proportional-only (no integral/derivative) */; fixedDrive?: boolean; aversiveLesion?: boolean;
  genes?: number[] /* [vtaGain, thrScale, forageGain, reach] each ~1 */; fat0?: number; deplete?: boolean; danger?: boolean; pool?: { food: number } /* shared ecological food pool */;
  // v3.2: set to "v30" to run the v3.0 decision/replay rules (for comparison only)
  decision?: "v32" | "v30"; ltc?: boolean | "learned" /* v3.3 liquid time-constant neurons; v3.4 "learned": CTX-E gates from e-prop training (LTC_LEARNED) */; tauScale?: number /* v3.3 robustness: multiplies every neuron's base time constant */;
  // v3.4 cortex: "v34" (default) = topographic TC fan + module E/I loops + STDP + homeostasis + NMDA-like recurrent persistence + developmental waves; "v31" reproduces the v3.1 cortex bit-for-bit
  cortex?: "v31" | "v34"; devLesion?: boolean; stdpLesion?: boolean; homeoLesion?: boolean; eiLesion?: boolean; nmdaLesion?: boolean; eprop?: boolean /* v3.4: run the e-prop gate learning online (training curriculum only) */;
  // v3.5: Mind/decision version ("v35" default; "v34" reproduces v3.4)
  mind?: "v34" | "v35" | "v36" | "v37" | "v38" | "v39" };
const SITES = 16; // 4 colours x 4 shapes; reward p = 0.05 + 0.25 cv[c] + 0.25 sv[s]
const STAGES = ["WAKE", "N1", "N2", "N3", "REM"] as const;

class Organism {
  o: Opts; r: Rng; ent: () => number; t = 0;
  // neurons
  v = new Float32Array(NNEU); tau = new Float32Array(NNEU).fill(1 / Math.log(1.25)); th = new Float32Array(NNEU); spk = new Uint8Array(NNEU); rate = new Float32Array(NNEU); xTr = new Float32Array(NNEU); yTr = new Float32Array(NNEU);
  syn: Syn; out: number[][] = []; ext = new Float32Array(NNEU); regionRate: Record<string, number> = {};
  // plastic action values: hippocampal site cell -> striatal channel synapses (three-factor), cortical feature model (colour/shape)
  wSite = new Float32Array(SITES).fill(0.25); featC = new Float32Array(4).fill(0.15); featS = new Float32Array(4).fill(0.15); pTrue = new Float32Array(SITES); siteC = new Int8Array(SITES); siteS = new Int8Array(SITES);
  access = new Uint8Array(SITES); episodes: { k: number; r: number; p: number }[] = [];
  // metabolism (kJ); ledger
  gut = { glc: 4, fat: 2, prot: 1.5 }; blood = { glc: 3, ffa: 1, aa: 2, ket: 0.2, urea: 0 }; liverGly = 20; fat = 400; muscle = 120; brainGlc = 0.6; atp = 2; heat = 0; excreted = 0; eaten = 0; E0 = 0; leak = 0;
  // hormones / autonomic / heart
  insulin = 0.3; glucagon = 0.3; cortisol = 0.3; ghrelin = 0.3; leptin = 0.5; melatonin = 0; symp = 0.3; para = 0.4; hr = 70; perfusion = 1; pidI = 0; pidPrev = 0;
  // neuromodulators: vesicle pool P, extracellular E
  nm: Record<string, { P: number; E: number }> = { DA: { P: 1, E: 0.3 }, "5HT": { P: 1, E: 0.3 }, NE: { P: 1, E: 0.3 }, ACh: { P: 1, E: 0.3 }, Glu: { P: 1, E: 0.3 }, GABA: { P: 1, E: 0.3 }, eCB: { P: 0.5, E: 0.1 } };
  // sleep / circadian
  S = 0.4; orx = 0; scnPhase = 0 /* radians, 0 = midnight */; stage = 0; ultra = 0; awakeMin = 0; asleep = false; light = 1;
  // latent / curvature / interoception
  pc: Float64Array[] = []; z: number[][] = []; kappa = 0; kHist: number[] = []; liminal = 0; predErr = 0;
  // quantum
  rateVar?: Float64Array; cephW = new Float64Array(24); cephH: number[] = [];
  /** v5.1 allostasis: learned, clock-indexed forecast of the glucose rise over the next 20 ticks drives insulin BEFORE the rise (cephalic-phase /
   *  anticipatory insulin; Powley 1977; Teff 2000; Sterling 2012). Delta rule on the hour bin seen 20 ticks ago. Original code. */
  tpcM?: TPC; tpcTerm(e: number): number { if (!(M50.tpc > 0)) return 0; const m = (this.tpcM ??= new TPC(19, mulberry(this.o.seed * 7919 + 11), { K: 20 })); const f = m.step([e, Math.sin(this.scnPhase), Math.cos(this.scnPhase), ...Array.from(this.sens).slice(0, 16)]); return this.o.cephLesion ? 0 : M50.tpc * 1.5 * Math.max(0, f[0] - e); } /* v5.2 TPC: learned K-step forecast of own glucose error from interoception, clock and senses; anticipatory insulin = forecast rise (fp/tpc.ts, isolated check B) */
  cephPred(): number { const b = (ph: number) => Math.floor((((ph % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * 24) % 24; const g = this.blood.glc / 3;
    this.cephH.push(g, this.scnPhase); if (this.cephH.length > 42) { const g0 = this.cephH.shift()!, p0 = this.cephH.shift()!; if (this.learn) { const k = b(p0); this.cephW[k] += 0.05 * (Math.max(0, g - g0) - this.cephW[k]); } }
    return this.cephW[b(this.scnPhase + (20 / 1440) * 2 * Math.PI)]; }
  q = new Q3(); qth = [0.5, 0.5, 0.5]; qOut = 0; qgtTrace = 0; berry = 0; health = new Health(2.5);
  // behaviour
  level = 1; foraged = 0; rewards = 0; lastChoice = -1; choices: number[] = []; brainUse = 0; learn = true; stim: Record<string, number> = {}; vagal = 0; ensRate = 0; motility = 0;
  hist: Record<string, number[]> = {}; events: string[] = [];
  // v3.1: sensory lines (4 modalities x 4), synapse kinds + lesion mask, Mind layer, body integrity, ecology
  nmda = new Float32Array(NNEU); nmdaS = new Float32Array(NNEU) /* v3.6 slow cortical NMDA current */; modAct = new Float32Array(4) /* v3.7 module E activity for divisive inhibition */; dHat = new Float32Array(SITES) /* v3.7 believed depletion of each site */; dDelta = 0 /* v3.7 learned depletion strength */; pk: Uint8Array = new Uint8Array(0); thA = new Float32Array(NNEU); inn: number[][] = []; devSens = new Float32Array(16); rd: Rng = mulberry(1); rateAvg = new Float32Array(NNEU).fill(0.12);
  gate: number[] = LTC_LEARNED.slice(); elig = new Float64Array(NNEU * 4); eligT = new Float64Array(NNEU * 4); gHist: number[][] = []; // gate is reset to LTC_INIT in the constructor when o.eprop (training)
  sens = new Float32Array(16); kind: Uint8Array; mask: Float32Array; mind: Mind; integrity = 1; tissue = 10; damageTaken = 0; cogCost = 0; pBase = new Float32Array(SITES); depl = new Float32Array(SITES);
  danger = new Float32Array(SITES); wAv = new Float32Array(SITES); visits = new Float32Array(SITES); lastVisit = new Float32Array(SITES); vol = 0; assocPH = new Float32Array(SITES).fill(0.5);
  // v3.6: light input, dendritic NMDA buffer, latent-cause value map, schema statistics, Beta beliefs for expected information gain
  deathCause = ""; temper = -1; devGenome: DevGenome | null = null; devStats: { candidates: number; kept: number; topo: number; target: number; pruned: number; sprouted: number } | null = null; devAff: ((pi: number, i: number, j: number) => number) | null = null; devTarget = 0; devPruned: Uint8Array | null = null; bus: SensoryBus | null = null; selfM: SelfModel | null = null; curv: Curvature | null = null; neo: NeoHooks | null = null; marks = new Float32Array(SITES); lastRew = 0; devSlots: number[][] = []; actEMA = new Float32Array(NNEU); cg: (n: any) => number = () => 1; intPrev = 1; affR: () => number = mulberry(9); affect: Affect | null = null /* v4.0 layered affect */; lightIn: number | null = null; photo: [number, number] = [6, 18]; dend = new Float32Array(NNEU); wAlt = new Float32Array(SITES).fill(0.25); lcLLR = 0; lcSwitches = 0; sN = new Float32Array(SITES); sR = new Float32Array(SITES); bA = new Float32Array(SITES).fill(1); bB = new Float32Array(SITES).fill(1); rule: ((asleep: boolean, drive: number, thrS: number, forced: boolean) => boolean) | null = null; qb: { prepare(th: number[]): void; probs(): number[] } | null = null; modLesion = [false, false, false, false]; dead = false; lowGlc = 0;
  constructor(o: Opts) { if (Object.keys(V40OPTS).length) { o = { ...o }; for (const k in V40OPTS) if ((o as any)[k] == null) (o as any)[k] = V40OPTS[k]; } this.o = { noise: "quantum", replay: "full", entropy: "seeded", access: "half", ...o }; this.r = mulberry(o.seed * 7919 + 17); if (o.eprop) this.gate = LTC_INIT.slice();
    const er = mulberry(o.seed * 104729 + 3); if (M50.ltcC > 0 && this.o.ltc === undefined) (this.o as any).ltc = true; /* v5.1: conductance-based tau (Koch, Rapp & Segev 1996) on by default */ this.ent = this.o.entropy === "tsotchke" ? tsotchkeEntropy(o.seed, er) : this.o.entropy === "crypto" && typeof crypto !== "undefined" ? (() => { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] / 4294967296; }) : er;
    const r = this.r; const pre: number[] = [], post: number[] = [], w: number[] = [], pl: number[] = []; const has = new Set<number>();
    if (o.develop ?? is40(o.mind ?? MIND_DEFAULT)) { /* v4.0: grown wiring is the default (develop:false gives the i.i.d. control) */ const rg = mulberry(o.seed * 5167 + 23); const gnm = o.devGenome ?? randomGenome(CP.length, REGIONS.length, rg); this.devGenome = gnm; const G = grow(CP as any, R0, RN, REGIONS.map((x) => x[0]), gnm, rg); this.devStats = { ...G.stats, pruned: 0, sprouted: 0 }; this.devAff = G.affinity; this.devTarget = G.stats.target; const base0 = pre.length; this.devSlots = G.proj.map((pi, k) => [base0 + k, pi]);
      this.cg = (n) => cortexGene(gnm, CP.length, REGIONS.length, n);
      const regOf = (i: number) => REGIONS.find(([n]) => i >= R0[n] && i < R0[n] + RN[n])![0];
      G.pre.forEach((i, k) => { const j = G.post[k]; const ln = Math.exp(-0.7 + 0.9 * this.gauss(r)) * 0.35 * Math.min(2, 0.5 + 0.5 * G.aff[k]); w.push(INHIB(i) ? -ln * 1.6 : ln); pre.push(i); post.push(j); pl.push(regOf(i) === "CTX" && regOf(j) === "CTX" && !INHIB(i) ? 1 : 0); }); }
    else     for (const [a, b, p] of CP) for (let i = R0[a]; i < R0[a] + RN[a]; i++) for (let j = R0[b]; j < R0[b] + RN[b]; j++) { if (i === j) continue;
      let pp = p; if (a === b && b === "CTX" && has.has(j * NNEU + i)) pp = Math.min(1, p * 4); // reciprocal over-representation ~4x (Song et al. 2005)
      if (r() < pp) { has.add(i * NNEU + j); pre.push(i); post.push(j); const ln = Math.exp(-0.7 + 0.9 * this.gauss(r)) * 0.35; w.push(INHIB(i) ? -ln * 1.6 : ln); pl.push(a === "CTX" && b === "CTX" && !INHIB(i) ? 1 : 0); } }
    // v3.1 topographic pathways (separate RNG stream so the v3.0 random wiring is unchanged): SENS line i -> THAL i; THAL modality m -> 3 neurons of CTX module m; within-module recurrence
    const ra = mulberry(o.seed * 31337 + 5); const kd: number[] = pre.map((p, k) => { const q = post[k]; const cx = (i: number) => i >= R0.CTX && i < R0.CTX + 52; return cx(p) && cx(q) ? (Math.floor((p - R0.CTX) / 13) === Math.floor((q - R0.CTX) / 13) ? 2 : 3) : 0; });
    for (let i = 0; i < 16; i++) { pre.push(R0.SENS + i); post.push(R0.THAL + i); w.push(TUNE.st); pl.push(0); kd.push(1); }
    const c34 = this.o.cortex !== "v31"; // v3.4: the v3.1 TC picks and recurrent synapses are still drawn (so the ra stream is unchanged) but only wired in the v3.1 cortex
    for (let i = 0; i < 16; i++) { const m = Math.floor(i / 4); for (let c = 0; c < 3; c++) { const mm = this.o.topoScramble ? Math.floor(ra() * 4) : m; const j = R0.CTX + mm * 13 + Math.floor(ra() * 13); if (!c34) { pre.push(R0.THAL + i); post.push(j); w.push(TUNE.tc); pl.push(0); kd.push(1); } } }
    for (let m = 0; m < 4; m++) for (let a = 0; a < 13; a++) for (let b = 0; b < 13; b++) if (a !== b && ra() < 0.25) { if (!c34) { pre.push(R0.CTX + m * 13 + a); post.push(R0.CTX + m * 13 + b); w.push(TUNE.rec); pl.push(1); kd.push(2); } }
    const pkk: number[] = pre.map(() => 0);
    if (c34) { const rc = mulberry(o.seed * 7777 + 11); const E = (m: number, n: number): number => R0.CTX + m * 13 + n, I = (m: number, k: number): number => R0.CTX + 52 + 3 * m + k;
      const add = (a: number, b: number, ww: number, k: number, p2: number): void => { pre.push(a); post.push(b); w.push(ww); pl.push(0); kd.push(k); pkk.push(p2); };
      // (1) topographic thalamocortical fan: THAL line (m, j) -> every E neuron n of module m, Gaussian over preferred position 3n/12 (scrambled: random module + random positions)
      for (let i = 0; i < 16; i++) { const m = Math.floor(i / 4), j = i % 4; const mm = this.o.topoScramble ? Math.floor(rc() * 4) : m; const perm = Array.from({ length: 13 }, (_, n) => n); if (this.o.topoScramble) perm.sort(() => rc() - 0.5);
        for (let n = 0; n < 13; n++) { const pos = (3 * perm[n]) / 12; add(R0.THAL + i, E(mm, n), CX.tc * this.cg("tc") * Math.exp(-((pos - j) ** 2) / (2 * (CX.tcSig * this.cg("tcSig")) ** 2)) * (0.8 + 0.4 * rc()), 1, 1); }
        for (let k = 0; k < 3; k++) add(R0.THAL + i, I(mm, k), CX.ffI, 5, 0); } // feedforward inhibition
      for (let m = 0; m < 4; m++) { for (let n = 0; n < 13; n++) for (let k = 0; k < 3; k++) { add(E(m, n), I(m, k), CX.eI * this.cg("eI") * (0.8 + 0.4 * rc()), 6, 0); add(I(m, k), E(m, n), -CX.iE * this.cg("iE") * (0.8 + 0.4 * rc()), 7, 3); } // E/I loop; I->E plastic (Vogels 2011)
        for (let a = 0; a < 13; a++) for (let b = 0; b < 13; b++) if (a !== b) add(E(m, a), E(m, b), CX.rec0 * this.cg("rec0") * (0.5 + rc()), 2, 2); }
      if (ge35(o.mind ?? MIND_DEFAULT)) { const rx = mulberry(o.seed * 6113 + 29); /* v3.5: sparse cross-module E->E synapses (kind 3) onto coincidence-detecting E cells: a cell fires strongly only when its own TC input and the cross input coincide -> conjunctive (mixed-selectivity) codes */
        for (let m = 0; m < 4; m++) for (let n = 0; n < 4; n++) if (m !== n) for (let a = 0; a < 13; a++) for (let b = 0; b < 13; b++) if (rx() < M35.xP) add(E(m, a), E(n, b), M35.xW * (0.5 + rx()), 3, 0); }
      if (M40.xsel > 0) { const rs = mulberry(o.seed * 4409 + 23); /* v4.0 RPT-2 fix candidate: dense, feature-selective, SIGNED cross-module input. Each E cell of module m gets input from all 13 E cells of the paired module (m^1), weighted by a tuning kernel around one randomly assigned preferred position MINUS its mean, so the net drive is zero-mean (no non-specific part for E/I balance to cancel) and depends on WHICH b is present. The negative part stands for disynaptic feedforward inhibition (Pouille & Scanziani 2001); like-to-like long-range selectivity (Ko et al. 2011; Gilbert & Wiesel 1989); random selective conjunctive fan-in (Rigotti et al. 2013). Original code. */
        for (let m = 0; m < 4; m++) for (let bb = 0; bb < 13; bb++) { const n = m ^ 1, p = Math.floor(rs() * 4); const k = Array.from({ length: 13 }, (_, a) => Math.exp(-(((3 * a) / 12 - p) ** 2) / (2 * 0.5 ** 2))); const mu = k.reduce((x, y) => x + y, 0) / 13; for (let a = 0; a < 13; a++) add(E(n, a), E(m, bb), M40.xsel * (k[a] - mu), 3, 0); } }
      if (is39(o.mind ?? MIND_DEFAULT) && M39.xsW > 0) { const rs = mulberry(o.seed * 3301 + 17); /* v3.9: patchy, target-specific long-range cortico-cortical axons (Gilbert & Wiesel 1989; Bosking 1997): each E cell of module m receives cross input from the cells of the paired module (0<->1, 2<->3) that prefer ONE randomly assigned position; with the soma-gated dendritic plateau this gives each cell a specific (own feature x partner feature) conjunction = random mixed selectivity (Rigotti et al. 2013) */
        for (let m = 0; m < 4; m++) for (let b = 0; b < 13; b++) { const n = m ^ 1, p = Math.floor(rs() * 4); for (let a = 0; a < 13; a++) { const ww = M39.xsW * Math.exp(-(((3 * a) / 12 - p) ** 2) / (2 * (M39.xsSig * this.cg("xsSig")) ** 2)); if (ww > 0.02 * M39.xsW) add(E(n, a), E(m, b), ww, 3, 0); } } }
      const fbWe = is37(o.mind ?? MIND_DEFAULT) ? M37.fbW : M36.fbW; if (ge36(o.mind ?? MIND_DEFAULT) && fbWe > 0) { const rf = mulberry(o.seed * 9973 + 5); /* v3.6 (lab handoff R17 #1): L6-like corticothalamic feedback. Every E cell of module m projects to fbN relay lines of its own module's thalamic sector through the slow NMDA-like current: modulatory gain on the relay rather than fast drive (Sherman & Guillery 2002). CTX->THAL fan-out now exceeds THAL->CTX. */
        for (let m = 0; m < 4; m++) for (let n = 0; n < 13; n++) for (let k = 0; k < M36.fbN; k++) add(E(m, n), R0.THAL + m * 4 + Math.floor(rf() * 4), fbWe * (0.5 + rf()), 8, 2); } } // within-module recurrent, NMDA-like, STDP (assemblies)
    this.syn = { pre: Int32Array.from(pre), post: Int32Array.from(post), w: Float32Array.from(w), plastic: Uint8Array.from(pl) }; this.kind = Uint8Array.from(kd); this.pk = Uint8Array.from(pkk); this.rd = mulberry(o.seed * 4441 + 9); this.mask = new Float32Array(pre.length).fill(1); this.mind = new Mind(ra);
    for (let i = 0; i < NNEU; i++) { this.out.push([]); this.th[i] = 1 + 0.1 * r(); } pre.forEach((p, s) => this.out[p].push(s)); for (let i = 0; i < NNEU; i++) this.inn.push([]); post.forEach((q, s2) => { if (this.pk[s2]) this.inn[q].push(s2); });
    const cv = [0, 1, 2, 3].sort(() => r() - 0.5), sv = [0, 1, 2, 3].sort(() => r() - 0.5);
    for (let k = 0; k < SITES; k++) { const c = k & 3, s = k >> 2; this.siteC[k] = c; this.siteS[k] = s; this.pTrue[k] = 0.05 + 0.25 * cv[c] / 3 + 0.25 * sv[s] / 3; }
    // half the sites accessible on days 1-3 (a Latin pattern so every colour and shape is seen twice)
    for (let k = 0; k < SITES; k++) this.access[k] = this.o.access === "all" || ((this.siteC[k] + this.siteS[k]) & 1) === 0 ? 1 : 0;
    for (let k = 0; k < 3; k++) { const v = new Float64Array(12); for (let i = 0; i < 12; i++) v[i] = this.gauss(r) * 0.3; this.pc.push(v); }
    if (this.o.fat0 !== undefined) this.fat = this.o.fat0; const G = this.o.genes; if (G) { this.th = this.th.map((x) => x * G[1]); const reach = Math.max(0.1, Math.min(1, 0.5 * G[3])); for (let k = 0; k < SITES; k++) this.access[k] = ra() < reach ? 1 : 0; }
    for (let k = 0; k < SITES; k++) { this.pBase[k] = this.pTrue[k]; this.danger[k] = ra() < 0.5 ? 0.5 : 0; } this.applyMask(); this.E0 = this.energy(); }
  // lesion mask over synapses (kinds: 0 random, 1 topographic, 2 within-module recurrent, 3 cross-module cortical)
  applyMask(): void { const o = this.o; for (let k = 0; k < this.mask.length; k++) { const kd = this.kind[k]; let m = 1; if (o.recLesion && (kd === 2 || kd === 3)) m = 0; if (o.mixLesion && kd === 3) m = 0; if (o.ctFbLesion && (kd === 8 || (this.syn.pre[k] >= R0.CTX && this.syn.pre[k] < R0.CTX + RN.CTX && this.syn.post[k] >= R0.THAL && this.syn.post[k] < R0.THAL + RN.THAL))) m = 0; if (o.eiLesion && kd >= 5 && kd <= 7) m = 0; if (this.devPruned && this.devPruned[k]) m = 0; /* v4.0: pruned synapses stay pruned across lesion toggles */ this.mask[k] = m; } }
  lesionModule(m: number, on = true): void { this.modLesion[m] = on; }
  damage(x: number): void { const d = Math.min(this.tissue, 10 * x); this.tissue -= d; this.blood.aa += d; this.integrity = this.tissue / 10; this.damageTaken += x; this.events.push(`t${this.t} damage ${x.toFixed(2)}`); }
  gauss(r: Rng = this.r): number { const u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v); }
  energy(): number { const g = this.gut, b = this.blood; return g.glc + g.fat + g.prot + b.glc + b.ffa + b.aa + b.ket + b.urea + this.liverGly + this.fat + this.muscle + this.brainGlc + this.atp + this.heat + this.excreted + this.tissue; }
  ledgerError(): number { return Math.abs(this.energy() - this.E0 - this.eaten) / (this.E0 + this.eaten); }
  paramCount(): { synapses: number; plasticSynapses: number; valueSynapses: number; kinetics: number; quantum: number; total: number } {
    const syn = this.syn.w.length, pl = this.syn.plastic.reduce((a, b) => a + b, 0), val = SITES + 8 + this.mind.nParams(), kin = NNEU /* thresholds */ + 7 * 6 /* NM kinetics */ + 40 /* metabolic/hormone rate constants */ + 36 /* latent PCA */, q = 16 + 3;
    return { synapses: syn, plasticSynapses: pl, valueSynapses: val, kinetics: kin, quantum: q, total: syn + val + kin + q }; }
  // ---------- interventions (browser inspector + tests) ----------
  // ---- v3.6 steering API: light input, photoperiod, external quantum backend, rule engine, full-state snapshot/restore ----
  /** dome light in [0,1]; null returns to the internal photoperiod clock */ setLight(x: number | null): void { this.lightIn = x === null ? null : clamp(x); }
  setPhotoperiod(on: number, off: number): void { this.photo = [on, off]; }
  /** external statevector (e.g. Moonlab WASM): prepare(theta) then probs() of the 8 basis states; draws stay on the seeded stream, so runs stay deterministic */ setQuantumBackend(b: { prepare(th: number[]): void; probs(): number[] } | null): void { this.qb = b; }
  /** external sleep/wake flip-flop rule (e.g. an Eshkol program); must compute the same boolean as the built-in rule */ setRuleEngine(f: ((asleep: boolean, drive: number, thrS: number, forced: boolean) => boolean) | null): void { this.rule = f; }
  /** complete serialisable state (JSON-safe): every field incl. typed arrays, the Mind, and all PRNG states */ snapshot(): Record<string, unknown> { return snapEnc(this, new Set(["rule", "qb", "g"])) as Record<string, unknown>; }
  /** restore a snapshot into this instance (any seed); continuing then reproduces the original run exactly */ restore(st: Record<string, unknown>): void { snapDec(this, st, new Set(["rule", "qb", "g"])); }
  feed(kJ: number): void { const f = kJ / 2.2; this.gut.glc += 1.2 * f; this.gut.fat += 0.6 * f; this.gut.prot += 0.4 * f; this.eaten += kJ; this.events.push(`t${this.t} fed ${kJ.toFixed(1)} kJ`); }
  stimulate(reg: string, amt: number): void { this.stim[reg] = (this.stim[reg] || 0) + amt; }
  inject(nm: string, amt: number): void { if (this.nm[nm]) this.nm[nm].E += amt; }
  lesion(k: keyof Opts, v: unknown = true): void { (this.o as Record<string, unknown>)[k] = v; this.events.push(`t${this.t} ${k}=${String(v)}`); this.applyMask(); }
  // ---------- one-tick update of the whole organism ----------
  step(): void { const o = this.o, r = this.r; this.t++; if (M40.onR > 0 && this.nmdaS) { const ps = (this.sPrev ??= new Float64Array(this.sens.length)); let ch = 0; for (let i = 0; i < this.sens.length; i++) { ch += Math.abs(this.sens[i] - ps[i]); ps[i] = this.sens[i]; } if (ch > 0.5) for (let i = R0.CTX; i < R0.CTX + RN.CTX; i++) this.nmdaS[i] *= 1 - M40.onR; } /* v4.0 FP RPT-2: a sensory onset transient recruits fast-spiking (PV) inhibition that truncates slow NMDA persistent activity, so each new stimulus starts from a fresh state (Gutkin, Laing et al. 2001 J Comput Neurosci 11:121; Cardin et al. 2009 Nature 459:663); original code */
    if (is40(o.mind ?? MIND_DEFAULT) && !(o.affectLesion ?? "").includes("all")) { this.intPrev = this.integrity; if (!this.affect) { this.affR = mulberry(o.seed * 4051 + 11); } if (!this.affect) this.affect = new Affect(SITES, o.persona ?? Affect.birth(mulberry(o.seed * 4049 + 7)), new Set((o.affectLesion ?? "").split(",").filter(Boolean))); const fb = this.affect.step({ t: this.t, DA: this.nm.DA.E, NE: this.nm.NE.E, S5: this.nm["5HT"].E, cortisol: this.cortisol, ghrelin: this.ghrelin, atp: this.atp / 2, integrity: this.integrity, sleepS: this.S, awake: this.stage === 0, r: this.affR }); this.cortisol = clamp(this.cortisol + fb.cortisol); this.nm.DA.E = Math.max(0, this.nm.DA.E + fb.DA); this.nm["5HT"].E = Math.max(0, this.nm["5HT"].E + fb.S5); this.S = clamp(this.S + fb.sleep); } /* v4.0 affect: body/brain -> emotions -> mood -> HPA, sleep, neuromodulator feedback (natural coupling only) */
    if (is40(o.mind ?? MIND_DEFAULT) && (M40.forget > 0 || M40.volLeak > 0) && this.t % 10 === 0) { const f = 1 - 10 * (M40.forget + M40.volLeak * (M40.volX > 0 ? this.volU : this.vol)); /* volLeak: the leak rate follows the volatility learned from unsigned RPEs (Behrens et al. 2007), so beliefs forget fast in a reversing world and slowly in a stable one */ for (let k = 0; k < this.bA.length; k++) { this.bA[k] = 1 + f * (this.bA[k] - 1); this.bB[k] = 1 + f * (this.bB[k] - 1); this.rA[k] = 1 + f * (this.rA[k] - 1); this.rB[k] = 1 + f * (this.rB[k] - 1); } } /* v4.0: beliefs leak toward the prior between observations (assumed volatility; Behrens et al. 2007), so uncertainty about an unvisited option regrows with time and the single uncertainty term re-drives visits in a changing world */
    if (is40(o.mind ?? MIND_DEFAULT) && !(o.v40Lesion ?? "").includes("v40all")) { const off = new Set((o.v40Lesion ?? "").split(",").filter(Boolean)); if (!this.bus) { const rr = mulberry(o.seed * 6007 + 41); this.bus = new SensoryBus(rr, off, o.substrate ?? "synthetic", o.seed, o.substrateLog ?? []); this.selfM = new SelfModel(rr, off); const ctl = new Set((o.v40Ctl ?? "").split(",").filter(Boolean)); this.curv = new Curvature(rr, RN.CTX, off); this.neo = new NeoHooks(off); this.bus.ctl = ctl; this.selfM.ctl = ctl; this.neo.ctl = ctl; this.bus.outK = M40.busOut; this.selfM.simK = M40.simK; }
      const A = this.affect; const intero = [this.blood.glc, this.atp / 2, this.integrity, this.fat / 400]; const alien = [Math.cos((2 * Math.PI * this.t) / (1440 * 7) + o.seed), clamp(this.cortisol), this.qOut ? 1 : 0]; /* alien: slow magnetic-like field, electric-like threat field, quantum-click sense */
      this.bus.step(this.t, this.sens, intero, alien, this.lastRew); this.lastRew *= 0.9; const glitch = this.bus.lastIn[16 + 4 + 3 + 3] ?? 0;
      this.curv.step(this.rate.subarray(R0.CTX, R0.CTX + RN.CTX));
      this.selfM.step([...intero, this.nm.DA.E, this.nm["5HT"].E, this.nm.NE.E, this.nm.ACh.E, A ? A.mood.val : 0, A ? A.emo.fear : 0, this.bus.surpriseN - 1, this.curv.felt()], glitch);
      this.neo.step(this.t, this.selfM.sim, A ? A.sleepDebt : this.S, clamp(this.ghrelin), this.bestSite(), this.affR);
      for (const q of this.neo.pending.splice(0)) this.neoSandbox(q); } /* v4.0 Parts VII–X: sensory bus, SELF/SIM, thought curvature, Neo hooks */ const minute = this.t % 1440, hour = minute / 60;
    // circadian: lights 06-18; SCN entrains to light (phase-response), SCN lesion removes rhythm
    this.light = this.lightIn !== null ? clamp(this.lightIn) : hour >= this.photo[0] && hour < this.photo[1] ? 1 : 0; /* v3.6: external light input (dome) or photoperiod; graded light scales SCN entrainment and melatonin suppression */ this.scnPhase += 2 * Math.PI / 1440 + this.light * 0.002 * Math.sin(2 * Math.PI * minute / 1440 - this.scnPhase); // light phase-response entrainment
    if (this.neo && this.t < this.neo.shadeUntil) this.light = 0; /* v4.0 Neo: granted "shade" hook (own sensory light only) */
    const scnOut = o.scnLesion ? 0 : Math.cos(this.scnPhase - 2 * Math.PI * 14 / 24); // peaks ~14:00 when entrained
    this.melatonin += 0.05 * ((1 - this.light) * (o.scnLesion ? 0.5 : clamp(0.5 - scnOut)) - this.melatonin);
    this.ultra = (this.ultra + 1 / 90) % 1; // ultradian ~90 min (BRAC)
    // sleep: two-process (S adenosine, C circadian) flip-flop
    const C = 0.25 * scnOut + 0.1 * Math.sin(2 * Math.PI * this.ultra) * (this.asleep ? 0 : 0.5);
    const drive = this.S - C + 0.15 * this.melatonin - (ge36(o.mind ?? MIND_DEFAULT) ? M36.neK * Math.max(0, this.nm.NE.E - 0.3) : 0) /* v3.6: LC noradrenaline inhibits VLPO sleep-active neurons (Chou et al. 2002; Saper et al. 2005), opposing sleep onset */; const forced = o.forceWake || (this.stim.LC || 0) > 3;
    let thrS = 0.62; if (ge35(o.mind ?? MIND_DEFAULT)) { /* v3.5: orexin-like arousal: sustained sensory engagement (task stimulation) holds the sleep/wake flip-flop in wake (Saper et al. 2010); S keeps accumulating, so the debt is paid later */ let eng = 0; for (let i = 0; i < 16; i++) eng += this.sens[i]; this.orx += 0.02 * (Math.min(1, eng) - this.orx); thrS += M35.orxK * this.orx; }
    if (this.rule) { const was = this.asleep; this.asleep = this.rule(was, drive, thrS, forced); if (this.asleep && !was) this.ultra = 0; } /* v3.6: optional external rule engine (Eshkol program) for the flip-flop; must equal the TS rule */
    else if (!this.asleep && drive > thrS && !forced) { this.asleep = true; this.ultra = 0; } else if (this.asleep && (drive < 0.2 || forced)) this.asleep = false;
    this.liminal = Math.exp(-((drive - (this.asleep ? 0.2 : thrS)) ** 2) / 0.004);
    if (!this.asleep) this.stage = 0; else { const u = this.ultra; this.stage = u < 0.1 ? 1 : u < 0.3 ? 2 : u < 0.75 - 0.25 * clamp(0.6 - this.S) ? (this.S > 0.35 ? 3 : 2) : 4; }
    const awake = this.stage === 0, rem = this.stage === 4, n3 = this.stage === 3;
    // hormones
    const gutFill = this.gut.glc + this.gut.fat + this.gut.prot; const bg = this.blood.glc / 3; // ~1 = setpoint
    // allostatic setpoint anticipates morning activity; PID on glucose
    const set = 1 + 0.08 * scnOut; const e = bg - set; this.pidI = clamp(this.pidI + 0.002 * e, -0.5, 0.5); const dE = e - this.pidPrev; this.pidPrev = e;
    this.insulin += 0.1 * ((o.pidLesion ? 0.3 : clamp(0.3 + (o.pidGain ?? 1) * (1.5 * e + (o.pidP ? 0 : this.pidI + 3 * dE)) + (M50.ceph > 0 && !o.cephLesion ? M50.ceph * this.cephPred() : 0) + this.tpcTerm(bg - 1) + 0.2 * this.para * (o.vagotomy ? 0.3 : 1))) - this.insulin);
    this.glucagon += 0.1 * ((o.pidLesion ? 0.3 : clamp(0.3 - 1.5 * e - this.pidI + 0.3 * this.symp)) - this.glucagon);
    this.cortisol += 0.02 * (clamp(0.35 + 0.25 * (o.scnLesion ? 0 : Math.cos(2 * Math.PI * (hour - 7) / 24)) + 0.6 * clamp(0.85 - bg) + 0.2 * (forced ? 1 : 0) + 0.4 * clamp(0.8 - this.integrity)) - this.cortisol); // tissue damage is a stressor
    this.ghrelin += 0.01 * (clamp(1 - gutFill / 6) - this.ghrelin); this.leptin = clamp(this.fat / 800);
    // ENS (myenteric) activity driven by gut contents and parasympathetic efferents; vagal afferent signals fill+nutrients to brainstem/hypothalamus
    const paraGut = o.vagotomy ? 0.1 : this.para; this.motility = clamp(0.2 + 0.5 * paraGut + 0.4 * this.ensRate - 0.3 * this.symp);
    this.vagal = o.vagotomy ? 0 : clamp(gutFill / 25 + 0.2 * this.ensRate);
    // ---------- neural tick ----------
    const ATPf = clamp(this.atp / 2, 0, 1.2); const brainF = clamp(this.brainGlc / 0.6 + 0.12 * this.blood.ket, 0, 1.3); // ketones partially substitute for glucose in brain
    const prec = clamp(this.blood.aa / 2, 0, 1.5); // tyrosine/tryptophan availability from blood amino acids
    const nmE = (k: string): number => this.nm[k].E; const da = o.daClamp !== undefined ? o.daClamp : nmE("DA");
    const kIn = o.insulaLesion ? 0 : o.kappaShuffle ? this.kHist[(this.t * 7919) % Math.max(1, this.kHist.length)] || 0 : this.kappa;
    const ext = this.ext; ext.fill(0); const add = (reg: string, x: number): void => { for (let i = R0[reg]; i < R0[reg] + RN[reg]; i++) ext[i] = x + 0.15 * this.gauss(); };
    const wake = awake ? 1 : 0;
    add("SENS", 0.08 * wake * (0.5 + this.light)); add("THAL", (awake ? TUNE.thal : rem ? 0.3 : 0.08)); add("CTX", 0.2 + 0.15 * nmE("ACh") + (n3 ? 0.25 * (Math.sin(this.t * 2.1) > 0 ? 1 : -0.5) : 0));
    for (let i = R0.CTX; i < R0.CTX + 52; i++) ext[i] -= TUNE.ctxDrop; // v3.1: excitatory cortex sits nearer threshold so topographic input can be expressed (v3.0 cortex was saturated)
    add("HIP", 0.1 + 0.3 * nmE("ACh")); add("STR", 0.1 + 0.3 * da); add("HYP", 0.4 + 0.5 * this.ghrelin + 0.5 * clamp(1 - bg) - 0.4 * this.vagal - 0.3 * this.leptin + 0.2 * this.insulin * 0);
    add("VTA", (0.35 + 0.05 * this.ghrelin) * prec * ATPf * clamp(brainF) * (o.genes ? o.genes[0] : 1)); // K-ATP channels make DA neurons fuel-sensitive (Liss et al. 2005)
    if (o.decision !== "v30") add("RAPHE", /* v3.2 BUG FIX: in v3.0 this call sat inside the comment above, so raphe had no drive (5-HT ~ 0) */ (rem ? 0.05 : 0.2 + 0.25 * wake) * prec * ATPf + 0.1 * this.vagal);
    add("LC", rem ? 0 : 0.15 + 0.25 * wake + 0.3 * this.cortisol + 1.2 * kIn + 0.3 * this.predErr + (this.stim.LC || 0) * 0.3); add("BF", (awake || rem ? 0.5 : 0.08) * ATPf);
    add("INS", 0.1 + 0.8 * kIn + 0.3 * clamp(1 - bg) + 0.002 * Math.abs(this.hr - 70)); add("SCN", o.scnLesion ? 0 : 0.3 + 0.3 * scnOut); add("MOT", 0.1 * wake);
    add("ENS", 0.1 + 0.2 * gutFill / 4 + 0.3 * paraGut); for (const k in this.stim) if (R0[k] !== undefined && k !== "LC") add(k, this.stim[k] * 0.3);
    if (ge36(o.mind ?? MIND_DEFAULT) && !o.visceralLesion && !o.insulaLesion) for (let i = 0; i < RN.INS; i++) ext[R0.INS + i] += M36.visK * (i % 2 ? 1 - bg : bg - 1); /* v3.6 (handoff #1 interoception): vagal/NTS-like visceral glucose afferent with opponent glucose-on / glucose-off INS cells (Craig 2002; glucose-sensing vagal afferents), signed so it does not saturate above setpoint */
    if (this.curv) for (let i = 0; i < RN.INS; i++) ext[R0.INS + i] += M40.insK * this.curv.felt(); /* v4.0: felt thought curvature */
    if (o.insulaLesion) add("INS", -5); if (o.scnLesion) add("SCN", -5);
    { const M = this.mind; const gate = awake ? 1 : rem ? 0.2 : 0.05; // thalamic sensory gating by sleep stage; attention gain per modality; top-down prediction into THAL; broadcast -> HIP; motor -> MOT; pain -> INS
      for (let i = 0; i < 16; i++) { ext[R0.SENS + i] += TUNE.sensIn * gate * (this.sens[i] + (this.bus ? this.bus.out[i] : 0)) * M.att[i >> 2]; ext[R0.THAL + i] += M.td[i]; }
      if (o.cortex !== "v31" && this.t < CX.dev && !o.devLesion) { const rd = this.rd; this.devSens.fill(0); for (let m = 0; m < 4; m++) if (rd() < 0.5) { const p = 3 * rd(); for (let j = 0; j < 4; j++) this.devSens[m * 4 + j] = Math.exp(-((j - p) ** 2) / 0.5); }
        for (let i = 0; i < 16; i++) ext[R0.THAL + i] += CX.devAmp * this.devSens[i]; } // v3.4 developmental spontaneous waves injected at the thalamic relay (retinogeniculate-wave analogue, not sleep-gated), ticks 0..CX.dev-1
      for (let i = 0; i < 8; i++) ext[R0.HIP + 16 + i] += 0.6 * M.bcOut[i]; for (let i = 0; i < 8; i++) ext[R0.MOT + i] += 0.8 * M.motor;
      ext[R0.INS] += 2 * clamp(1 - this.integrity); for (let m = 0; m < 4; m++) if (this.modLesion[m]) for (let j = 0; j < 13; j++) ext[R0.CTX + m * 13 + j] = -5; }
    const exc = clamp(this.nm.Glu.P, 0.2, 1.2) * (1 - 0.5 * clamp(nmE("eCB"))) * (0.6 + 0.4 * brainF), inh = 0.6 + 0.6 * nmE("GABA") + 0.5 * this.S * 0;
    const ne = nmE("NE"), adenTh = 0.25 * this.S; // adenosine raises thresholds (A1 receptors)
    const SUB = 6; const cnt = new Float32Array(NNEU); const syn = this.syn; let nsp = 0;
    const inp = new Float32Array(NNEU);
    const c34 = o.cortex !== "v31", crit = this.t < CX.dev ? CX.crit : 1, plast = this.learn && c34, stdpOn = plast && !o.stdpLesion, homeo = plast && !o.homeoLesion, aMod = crit * clamp(nmE("ACh") / 0.3, 0, 1.5), pk = this.pk, nmK = CX.nmdaK;
    if (o.eprop) this.eligT.fill(0); const v36n = ge36(o.mind ?? MIND_DEFAULT) && c34 && M36.dendK > 0; const v37c = is37(o.mind ?? MIND_DEFAULT) && c34, slowKe = v37c ? M37.slowK : M36.slowK; const v36s = ge36(o.mind ?? MIND_DEFAULT) && c34 && !o.slowLesion && slowKe > 0, slowDec = Math.exp(-1 / (M36.slowTau * SUB)); const v37d = v37c && M37.dendK > 0; const sdiv = [1, 1, 1, 1]; /* v3.6 (handoff #2): within-module CTX->CTX assembly synapses also drive a slow NMDA-like current (tau slowTau ticks; NMDA decay ~50-100 ms, Wang 1999/2001) so evoked activity can reverberate */
    for (let s = 0; s < SUB; s++) { if (v36s && v37c) for (let m = 0; m < 4; m++) { let c = 0; for (let n = 0; n < 13; n++) c += this.spk[R0.CTX + m * 13 + n]; this.modAct[m] = 0.9 * this.modAct[m] + 0.1 * c / 13; sdiv[m] = 1 / (1 + M37.inhG * 13 * this.modAct[m]); } /* v3.7: inhibition-stabilised reverberation: the slow NMDA current is divided by the module's recent E activity (shunting feedback inhibition; Ozeki et al. 2009, Wang 2001) so it sustains activity without runaway */
      if (M40.apL > 0) { this.dI ??= new Float64Array(NNEU); for (let i = R0.CTX; i < R0.CTX + 52; i++) this.dI[i] = M40.apL * this.dI[i] + (1 - M40.apL) * this.dend[i];  if (M40.apH > 0) { this.dM ??= new Float64Array(NNEU); this.dV ??= new Float64Array(NNEU).fill(0.1); for (let i = R0.CTX; i < R0.CTX + 52; i++) { const e = this.dI[i] - this.dM[i]; this.dM[i] += 0.01 * e; this.dV[i] += 0.01 * (e * e - this.dV[i]); } } /* apH: homeostatic intrinsic plasticity of the apical compartment centres and scales each unit's own gate (Triesch 2005; Desai et al. 1999) */ } /* v4.0 FP RPT-2: apical Ca/NMDA plateau integrates cross-module input over ticks (Larkum 1999; Schiller 2000 plateau ~50-100 ms), so single-tick spike sampling noise no longer swamps feature selectivity; original code */ const mC = [0, 0, 0, 0]; if (M40.ffi > 0) { if (!this.w3s) { this.w3s = new Float64Array(NNEU); for (let k = 0; k < this.kind.length; k++) if (this.kind[k] === 3) this.w3s[this.syn.post[k]] += this.syn.w[k] * this.mask[k]; } for (let i = R0.CTX; i < R0.CTX + 52; i++) mC[Math.floor((i - R0.CTX) / 13)] += this.spk[i] / 13; } /* v4.0 FP RPT-2: feedforward inhibition centres the apical drive on the source population mean, so all-excitatory cross synapses carry a signed, feature-selective signal (Pouille & Scanziani 2001; Isaacson & Scanziani 2011); original code */ const dmM = [0, 0, 0, 0]; if (M40.som > 0) for (let i = R0.CTX; i < R0.CTX + 52; i++) dmM[Math.floor((i - R0.CTX) / 13)] += this.dend[i] / 13; /* v4.0 FP RPT-2: SOM-like dendrite-targeting inhibition subtracts the module-mean apical drive (Murayama et al. 2009; Silberberg & Markram 2007) */ for (let i = 0; i < NNEU; i++) { const cortical = i >= R0.CTX && i < R0.CTX + 64; const g = cortical ? 1 + 0.5 * ne : 1;
        const I = (M40.apAll > 0 ? (M40.aG > 0 && v37d && i >= R0.CTX && i < R0.CTX + RN.CTX ? 1 + M40.aG * (1 / (1 + Math.exp(-(M40.apH > 0 && this.dM ? (this.dI[i] - this.dM[i]) / Math.sqrt(this.dV[i] + 1e-6) * 0.3 - M40.aTh : (M40.apL > 0 && this.dI ? this.dI[i] : this.dend[i]) - (M40.ffi > 0 && i < R0.CTX + 52 && this.w3s ? M40.ffi * this.w3s[i] * ((mC[0] + mC[1] + mC[2] + mC[3] - mC[Math.floor((i - R0.CTX) / 13)]) / 3) : 0) - (i < R0.CTX + 52 ? M40.som * dmM[Math.floor((i - R0.CTX) / 13)] : 0) - M40.aTh) / 0.3)) - 0.5) : 1) : 1) * ((ext[i] + inp[i]) * (M40.apAll > 0 ? 1 : (M40.aG > 0 && v37d && i >= R0.CTX && i < R0.CTX + RN.CTX ? 1 + M40.aG * (1 / (1 + Math.exp(-((M40.apL > 0 && this.dI ? this.dI[i] : this.dend[i]) - (M40.ffi > 0 && i < R0.CTX + 52 && this.w3s ? M40.ffi * this.w3s[i] * ((mC[0] + mC[1] + mC[2] + mC[3] - mC[Math.floor((i - R0.CTX) / 13)]) / 3) : 0) - (i < R0.CTX + 52 ? M40.som * dmM[Math.floor((i - R0.CTX) / 13)] : 0) - M40.aTh) / 0.3)) - 0.5) : 1)) /* v4.0 FP RPT-2: apical (cross-module) input multiplies drive, BAC-style (Larkum 1999); apAll: gain multiplies the TOTAL somatic drive incl. slow NMDA, since nmdaS dominates CTX current (~9 vs 0.15); original code */ + (c34 ? this.nmda[i] : 0) + (v36s ? this.nmdaS[i] * (v37c && i >= R0.CTX && i < R0.CTX + 52 ? sdiv[Math.floor((i - R0.CTX) / 13)] : 1) : 0) + (v37d ? (M40.aG > 0 ? 0 : M37.dendK) * (M40.dTh > 0 && i >= R0.CTX && i < R0.CTX + RN.CTX ? M40.dG * Math.max(0, this.dend[i] - M40.dTh) /* v4.0 FP RPT-2: local NMDA-spike threshold on the cross-module dendrite (Schiller 2000) */ : this.dend[i]) / (1 + Math.exp(-(this.v[i] - M37.dendVh) / M37.dendVs)) : 0) + (v36n ? M36.dendK * this.dend[i] / (1 + Math.exp(-(this.v[i] - M36.dendVh) / M36.dendVs)) : 0)); if (c34) this.nmda[i] *= nmK; if (v36s) this.nmdaS[i] *= slowDec; if (v36n || v37d) this.dend[i] = 0; /* v3.6: cross-module input lands on NMDA-rich distal dendrites; Mg2+ block makes it count only when the cell is already depolarised by its own input (Jahr & Stevens 1990; Larkum 2013) -> conjunctive codes */
        // v3.3 (opt-in): spiking liquid time-constant neuron (Hasani et al. 2021 LTC; Yin, Corradi & Bohte 2023 LTC-SN; Vanhalle & Gielen 2025 sLTC):
        // conductance-like gating makes tau input-dependent (strong synaptic drive shortens tau) and neuromodulator-dependent (ACh lengthens cortical/hippocampal tau, NE shortens it)
        const ts = o.tauScale ?? 1; let dec = ts === 1 ? 0.8 : Math.exp(-1 / (LTC_TAU0 * ts)); if (o.ltc === "learned" && i >= R0.CTX && i < R0.CTX + 52) { // v3.4 learned-gate LTC (CTX-E only): theta = [log tau0, aACh, bIn, cNE], learned by e-prop (Bellec et al. 2020) on tuning seeds, then frozen in LTC_LEARNED
          const th = this.gate, ach = nmE("ACh"), ai = Math.abs(inp[i]), fA = 1 + th[1] * ach, fI = 1 + th[2] * ai, fN = 1 + th[3] * ne; const tau = Math.max(0.5, ts * Math.exp(th[0]) * fA / (fI * fN)); dec = Math.exp(-1 / tau); this.tau[i] = tau;
          if (o.eprop) { const dd = (dec / (tau * tau)) * tau, drv = this.v[i] - g * I / 0.2, b = i * 4; const dT = [1, ach / fA, -ai / fI, -ne / fN]; // d tau/d theta_k / tau
            for (let k = 0; k < 4; k++) this.elig[b + k] = dec * this.elig[b + k] + dd * dT[k] * drv; } }
        else if (o.ltc) { const tau = ts * LTC_TAU0 * (1 + TUNE.ltcAch * (cortical || (i >= R0.HIP && i < R0.HIP + 32) ? nmE("ACh") : 0)) / ((1 + TUNE.ltcIn * Math.abs(inp[i])) * (1 + TUNE.ltcNe * (cortical ? ne : 0))); dec = Math.exp(-1 / tau); this.tau[i] = tau; }
        this.v[i] = dec * this.v[i] + g * I * (o.ltc || ts !== 1 ? (1 - dec) / 0.2 : 1); inp[i] = 0; this.xTr[i] *= 0.7; this.yTr[i] *= 0.7;
        const thr = this.th[i] * (1 + (2 - 2 * clamp(ATPf, 0, 1)) * 0.5) + (cortical ? adenTh : 0) + this.thA[i]; this.spk[i] = 0;
        if (o.eprop && o.ltc === "learned" && i >= R0.CTX && i < R0.CTX + 52) { const psi = 0.3 * Math.max(0, 1 - Math.abs(this.v[i] - thr) / Math.max(0.1, thr)), b = i * 4; for (let k = 0; k < 4; k++) this.eligT[b + k] += psi * this.elig[b + k] / SUB; if (this.v[i] > thr) for (let k = 0; k < 4; k++) this.elig[b + k] = 0; } // e-prop eligibility: pseudo-derivative x d v/d theta (reset cuts the trace)
        if (this.v[i] > thr) { this.spk[i] = 1; this.v[i] = 0; cnt[i]++; nsp++; } }
      for (let i = 0; i < NNEU; i++) if (this.spk[i]) { for (const si of this.out[i]) { const w = syn.w[si] * this.mask[si]; const q = syn.post[si]; if (v36n && this.kind[si] === 3) { this.dend[q] += w * exc; continue; } if (v37d && this.kind[si] === 3) this.dend[q] += w * exc; /* v3.7: cross-module input ALSO drives an NMDA dendritic plateau that only counts when the soma is depolarised (added to, not diverted from, the somatic input) */
            if (c34 && pk[si]) { if (pk[si] === 2 && !o.nmdaLesion) { this.nmda[q] += w * exc * 0.35; if (v36s && this.kind[si] === 2) this.nmdaS[q] += w * exc * slowKe; else if (v36s && v37c && this.kind[si] === 8) this.nmdaS[q] += w * exc * slowKe * M37.fbS; /* v3.7: the corticothalamic loop also carries the slow NMDA component (L6 -> relay synapses are NMDA-rich; Sherman & Guillery 2002) */ } else inp[q] += w > 0 ? w * exc : w * inh; // v3.4: assembly synapses act through a slow NMDA-like current
              if (pk[si] === 3) { if (homeo) syn.w[si] = clamp(syn.w[si] - CX.vEta * crit * (this.xTr[q] - 2 * CX.rho * 2.8), -3 * CX.iE, 0); } // Vogels iSTDP (pre spike): |w| += eta (post trace - alpha)
              else if (stdpOn) syn.w[si] -= CX.aM * aMod * syn.w[si] * this.xTr[q]; // multiplicative STDP depression (post-before-pre)
              continue; }
            inp[q] += w > 0 ? w * exc : w * inh; if (syn.plastic[si] && this.learn) syn.w[si] = clamp(w - 0.002 * this.yTr[syn.post[si]] * (0.5 + da), 0.01, 2); }
          if (c34 && (stdpOn || homeo)) for (const si of this.inn[i]) { const pre2 = syn.pre[si]; if (pk[si] === 3) { if (homeo) syn.w[si] = Math.max(-3 * CX.iE, syn.w[si] - CX.vEta * crit * this.xTr[pre2]); } else if (stdpOn) syn.w[si] += CX.aP * aMod * syn.w[si] * this.xTr[pre2]; } // STDP potentiation (pre-before-post); iSTDP on post spike
          for (const si of this.out[i]) void si; this.xTr[i] += 1; }
      for (let i = 0; i < NNEU; i++) if (this.spk[i] && i >= R0.CTX && i < R0.CTX + 52 && this.learn) { // STDP potentiation of incoming plastic synapses, DA-gated (three-factor)
          this.yTr[i] += 1; } }
    if (this.learn) for (let si = 0; si < syn.w.length; si++) if (syn.plastic[si] && cnt[syn.post[si]] && this.xTr[syn.pre[si]] > 0.05) syn.w[si] = clamp(syn.w[si] + 0.003 * this.xTr[syn.pre[si]] * (0.5 + da) - 0.0005 * (syn.w[si] - 0.35), 0.01, 2);
    for (const [n] of REGIONS) { let s = 0; for (let i = R0[n]; i < R0[n] + RN[n]; i++) { s += cnt[i]; this.rate[i] = cnt[i] / SUB; } this.regionRate[n] = s / (RN[n] * SUB); }
    if (c34) { for (let i = R0.CTX; i < R0.CTX + 64; i++) this.rateAvg[i] += 0.01 * (this.rate[i] - this.rateAvg[i]); if (M50.zr > 0 || M50.hebX > 0) { this.rateVar ??= new Float64Array(NNEU).fill(0.04); for (let i = R0.CTX; i < R0.CTX + 52; i++) { const d0 = this.rate[i] - this.rateAvg[i]; this.rateVar[i] += 0.01 * (d0 * d0 - this.rateVar[i]); } }
      if (M50.hebX > 0 && this.learn) { /* v5.1 learned like-to-like cross-area wiring: covariance rule (Sejnowski 1977) on cross-module E->E synapses, so cells that co-vary wire together (Ko et al. 2011); gated by global prediction mismatch (mmG; burst/mismatch-gated plasticity, Payeur et al. 2021); weight decay bounds it. Original code. */
        const gate = M50.mmG > 0 ? Math.min(1, this.predErr) : 1; if (gate > 1e-4) { const S = this.syn; for (let k = 0; k < this.kind.length; k++) if (this.kind[k] === 3) { const a2 = S.pre[k], b2 = S.post[k]; const c = (this.rate[a2] - this.rateAvg[a2]) * (this.rate[b2] - this.rateAvg[b2]); S.w[k] = Math.max(-4, Math.min(4, S.w[k] + M50.hebX * gate * (c / Math.sqrt(this.rateVar![a2] * this.rateVar![b2] + 1e-4) - 0.05 * S.w[k]))); } this.w3s = undefined as any; } }
      if (stdpOn) { // competitive normalisation: each E neuron's TC input sum and each THAL line's TC output sum are held fixed (one Sinkhorn step per tick), recurrent input capped
        for (let i = R0.CTX; i < R0.CTX + 52; i++) { let sT = 0, sR = 0; for (const si of this.inn[i]) { if (pk[si] === 1) sT += syn.w[si]; else if (pk[si] === 2) sR += syn.w[si]; }
          for (const si of this.inn[i]) { if (pk[si] === 1 && sT > 0) syn.w[si] *= CX.tcSum / sT; else if (pk[si] === 2 && sR > CX.recMax) syn.w[si] *= CX.recMax / sR; } }
        for (let i = R0.THAL; i < R0.THAL + 16; i++) { let sO = 0, nO = 0; for (const si of this.out[i]) if (pk[si] === 1) { sO += syn.w[si]; nO++; } if (sO > 0) for (const si of this.out[i]) if (pk[si] === 1) syn.w[si] *= (nO * CX.tcSum / 4) / sO; } }
      if (homeo) for (let i = R0.CTX; i < R0.CTX + 52; i++) this.thA[i] = clamp(this.thA[i] + CX.hEta * crit * clamp(nmE("ACh") / 0.3, 0, 1) * (this.rate[i] - CX.rho), -0.3, 2); } // intrinsic homeostatic plasticity
    this.ensRate = this.regionRate.ENS; this.mind.step(this); this.cogCost = this.mind.cost;
    // neuromodulator kinetics: synthesis (precursor x ATP x enzyme), release (nucleus spikes x pool), Michaelis-Menten reuptake, degradation
    const R = this.regionRate; let synthCost = 0;
    const kin = (k: string, src: number, pre: number, ksyn: number, vmax: number, km: number, kdeg: number): void => { const m = this.nm[k]; const sy = ksyn * pre * clamp(ATPf) * (1 - m.P / 1.5); m.P += sy; synthCost += 0.002 * Math.max(0, sy);
      const rel = 0.25 * src * m.P; m.P -= rel; m.E += rel; const up = vmax * m.E / (km + m.E); m.E -= up + kdeg * m.E; m.P += 0.7 * up; m.E = Math.max(0, m.E); m.P = Math.max(0, m.P); };
    kin("DA", R.VTA, prec, 0.03, 0.1, 0.4, 0.03); kin("5HT", R.RAPHE, prec * (o.vagotomy ? 0.85 : 1), 0.03, 0.1, 0.4, 0.03); kin("NE", R.LC, this.nm.DA.P * 0.5 + 0.2 * prec, 0.03, 0.1, 0.4, 0.03);
    kin("ACh", R.BF, clamp(this.blood.glc / 3 + this.blood.ket), 0.04, 0.1, 0.4, 0.03); const ctxRel = R.CTX * (o.cortex !== "v31" ? CX.gluK : 1); // v3.4: release calibration so the sparser v3.4 cortex leaves the global Glu/GABA pools where v3.1 had them (tuned on seeds 2000..2002)
    kin("Glu", ctxRel * 1.5, clamp(this.brainGlc / 0.6), 0.06, 0.5, 0.5, 0.02); kin("GABA", R.STR + ctxRel * 0.3, this.nm.Glu.P, 0.04, 0.4, 0.5, 0.02);
    kin("eCB", clamp(R.CTX * 3 - 0.3, 0, 2), clamp(this.blood.ffa), 0.02, 0.2, 0.3, 0.1); // endocannabinoids made on demand from membrane lipids (fatty acids)
    if (o.daClamp !== undefined) this.nm.DA.E = o.daClamp;
    // ---------- autonomic + heart ----------
    this.symp = clamp((o.sympathectomy ? 0.2 : 1) * (0.1 + 0.8 * R.LC + 0.4 * this.cortisol + 0.4 * clamp(0.8 - bg) + 0.2 * R.HYP));
    this.para = clamp(0.3 + 0.4 * (1 - wake) + 0.5 * this.vagal * 0.5 - 0.3 * R.LC);
    this.hr += 0.2 * (60 + 70 * this.symp - 25 * this.para - this.hr); this.perfusion = this.hr / 70;
    // ---------- action selection: spiking striatal race, value in hippocampal-site->striatal synapses ----------
    this.level = o.level ?? Math.max(1, Math.min(4, 1 + Math.floor(3 * clamp(nmE("ACh")) * clamp(ATPf) * brainF)));
    const hunger = R.HYP - 0.8 * this.vagal * 0.5; let decideSpikes = 0;
    const v38e = is38(o.mind ?? MIND_DEFAULT); const fatDef = (v38e ? clamp(1 - this.fat / M38.fSet) : 0) * (M40.insS > 0 ? clamp(2 - this.insulin / 0.3) : 1); /* v4.0 CQM10: central insulin inhibits AgRP (leptin-deficit) feeding drive, full suppression at 2x basal insulin (Woods et al. 1979; Könner et al. 2007) */ /* v3.8 energy budget: adiposity (leptin-like) deficit signal; fat below the defended set point lowers leptin, which disinhibits AgRP feeding drive and lowers thyroid-driven thermogenesis (Ahima et al. 1996; Leibel et al. 1995) */
    if (awake && !this.dead && r() * (this.affect ? 1 / this.affect.forageMul() : 1) < (o.fixedDrive ? 0.12 : clamp((3 * hunger - 0.1 + (v38e ? M38.fK * fatDef : 0)) * (o.genes ? o.genes[2] : 1)))) { let { k, sp } = this.choose(da); if (is40(o.mind ?? MIND_DEFAULT) && (o.veto ?? "own") !== "off") { const kk = o.veto === "shuffle" ? (k * 7 + 3 + (o.seed % 5)) % SITES : k; this.intHist.push(this.integrity); if (this.intHist.length > 500) this.intHist.shift(); const integ = o.veto === "intShuf" ? this.intHist[Math.floor(r() * this.intHist.length)] : this.integrity; const harm = M40.vetoI > 0 ? this.wAv[kk] * (1 + M40.vetoI * (1 - integ)) : this.wAv[kk] * (1 + this.cortisol); /* v4.0 N13b: the veto reads current bodily integrity (interoception), which the decision race does not use: the same predicted harm is vetoed more when the body is already damaged. Control "intShuf": integrity read from a random earlier moment */ this.vetoLog.push(harm); if (this.vetoLog.length > 2000) this.vetoLog.shift(); if (harm > M40.vetoThr && this.access[k]) { this.vetoes++; const a0 = this.access[k]; this.access[k] = 0; const c2 = this.choose(da); this.access[k] = a0; k = c2.k; sp += c2.sp; } } /* v4.0 N13 "free won't": after the decision race, the creature reads its own learned harm prediction for the selected act and can cancel it and re-decide (veto). Control "shuffle": the veto reads the prediction for a different act (lens-shuffled) */ decideSpikes = sp; this.foraged++; this.lastChoice = k; this.choices.push(k);
      let got = r() < this.pTrue[k]; if (got && o.pool) { if (o.pool.food >= 2.2) o.pool.food -= 2.2; else got = false; } if (got && !o.starve) { this.feed(2.2); this.rewards++; }
      if (o.deplete && got) this.depl[k] = 1; this.visits[k]++; this.lastVisit[k] = this.t;
      if (o.danger && r() < this.danger[k]) { this.damage(0.08); this.harms++; this.predErr += 0.5; if (!o.aversiveLesion && this.learn) this.wAv[k] += 0.3 * (1 - this.wAv[k]); } else if (!o.aversiveLesion && this.learn) this.wAv[k] += 0.05 * (0 - this.wAv[k]);
      const rew = got && !o.starve ? 1 : 0; this.lastRew = Math.max(this.lastRew, rew); if (this.affect) this.affect.outcome(this.t, k, rew, Math.max(0, this.intPrev - this.integrity), this.nm.DA.E, o.rpeLesion ? 0 : rew - this.wSite[k]); /* v4.0 AE-1 fix: affective value caches learn through the phasic RPE, so an RPE lesion removes them too */ const v36d = ge36(o.mind ?? MIND_DEFAULT); const v37f = is37(o.mind ?? MIND_DEFAULT); if (v37f && this.learn && M37.dLr > 0) { /* v3.7 forward model of self-caused depletion: success at a site depletes it (efference copy of the own harvest); depletion strength is learned by regression of outcomes on believed depletion */ const pu = this.bA[k] / (this.bA[k] + this.bB[k]), dh = this.dHat[k]; if (dh > 0.05) { const e = rew - pu * (1 - this.dDelta * dh); this.dDelta = clamp(this.dDelta - M37.dLr * e * pu * dh, 0, 1); } }
      if (v36d && this.learn && M40.curK > 0) (this.lp ??= new LearningProgress(SITES)).observe(k, rew); if (v36d && this.learn && M40.dreamGate > 0) { const pA = this.bA[k] / (this.bA[k] + this.bB[k]); const e = Math.abs(rew - pA); this.gS += 0.1 * (e - this.gS); this.gL += 0.005 * (e - this.gL); } if (v36d && this.learn) { const dw = v37f ? 1 - this.dDelta * this.dHat[k] : 1; this.bA[k] += rew; this.bB[k] += (1 - rew) * dw; this.rA[k] += rew; this.rB[k] += (1 - rew) * dw; /* v3.7: a failure at a site believed depleted is weak evidence about its base rate */ } if (v37f && rew) this.dHat[k] = 1;
      if (v36d && this.learn && !o.rpeLesion) { /* v3.6 latent-cause inference (Gershman, Blei & Niv 2010; Wilson et al. 2014 OFC state): two value maps; a leaky log-likelihood ratio of outcomes under the stored vs the active map; crossing threshold swaps maps, so a reversed world is recognised rather than relearned */
        const pc = clamp(this.wSite[k], 0.02, 0.98), pa = clamp(this.wAlt[k], 0.02, 0.98); this.lcLLR = Math.max(-M36.lcThr, M36.lcDecay * this.lcLLR + Math.log(rew ? pa / pc : (1 - pa) / (1 - pc))); if (this.lcLLR > M36.lcThr) { const t2 = this.wAlt.slice(); this.wAlt.set(this.wSite); this.wSite.set(t2); this.lcLLR = 0; this.lcSwitches++; }
        for (let j = 0; j < SITES; j++) { this.sN[j] *= M36.schDecay; this.sR[j] *= M36.schDecay; } this.sN[k] += 1; this.sR[k] += rew; }
      if (this.learn && !o.rpeLesion) { const rpe = rew - this.wSite[k]; this.vol += 0.05 * (Math.abs(rpe) - this.vol); { const pw = clamp(this.wSite[k]); this.volU += 0.05 * (Math.max(0, Math.abs(rpe) - 2 * pw * (1 - pw)) - this.volU); } /* v4.0 unexpected uncertainty: |RPE| in excess of what outcome noise predicts for a Bernoulli site with mean w (E|r-w| = 2w(1-w)); Yu & Dayan 2005, Behrens et al. 2007 separate expected from unexpected uncertainty */ this.nm.DA.E += 0.05 * Math.max(0, rpe) * prec; const v35d = ge35(o.mind ?? MIND_DEFAULT); if (v35d) { /* v3.5: Pearce-Hall associability: per-site learning rate tracks recent unsigned RPE, so learning speeds up after reversals */ this.wSite[k] += (M35.lrBase + M35.lrVol * this.assocPH[k]) * rpe * (0.5 + nmE("ACh")) * (this.selfM ? this.selfM.learnScale() : 1); /* v4.0 SIM: learn less from suspected artefacts */ this.assocPH[k] = 0.7 * this.assocPH[k] + 0.3 * Math.abs(rpe); } else this.wSite[k] += 0.01 * rpe * (0.5 + nmE("ACh")); // slow striatal learning; hippocampus stores the episode (complementary learning systems)
        if (r() < 0.3 + 0.6 * nmE("ACh")) { this.episodes.push({ k, r: rew, p: Math.abs(rpe) }); if (this.episodes.length > 200) this.episodes.shift(); } } }
    // ---------- sleep replay (NREM: consolidation) and dreams (REM: generative recombination) ----------
    if (this.learn && !o.rpeLesion && o.replay !== "none" && !awake && this.episodes.length) { const E = this.episodes; const v32 = o.decision !== "v30"; let tot = 0; if (v32) for (const ep of E) tot += ep.p + 0.05;
      const pick = (): { k: number; r: number; p: number } => { if (!v32) return E[Math.floor(E.length * r())]; let u = r() * tot; for (const ep of E) { u -= ep.p + 0.05; if (u <= 0) return ep; } return E[E.length - 1]; }; // prioritised replay (Mattar & Daw 2018)
      if ((n3 || this.stage === 2) && r() < 0.5 + 0.3 * this.liminal) { for (let j = 0; j < 4; j++) { const ep = pick(); const k = ep.k;
          this.wSite[k] += 0.04 * (ep.r - this.wSite[k]); if (v32) ep.p *= 0.9; /* replayed memories lose priority */ const pred = this.featC[this.siteC[k]] + this.featS[this.siteS[k]]; const d = ep.r - pred; this.featC[this.siteC[k]] += 0.08 * d; this.featS[this.siteS[k]] += 0.08 * d;
          for (let i = R0.HIP + 2 * k; i < R0.HIP + 2 * k + 2; i++) this.v[i] += 1; }
        if (ge35(o.mind ?? MIND_DEFAULT)) for (let it = 0; it < M35.featIt * 4; it++) { /* v3.5: NREM schema consolidation: extra passes fitting the colour+shape factor model to stored episodes */ const ep = E[Math.floor(r() * E.length)]; const k = ep.k; const d = ep.r - this.featC[this.siteC[k]] - this.featS[this.siteS[k]]; this.featC[this.siteC[k]] += 0.03 * d; this.featS[this.siteS[k]] += 0.03 * d; }
        if (ge36(o.mind ?? MIND_DEFAULT)) for (let it = 0; it < 4; it++) { /* v3.6: schema extraction (Tse et al. 2007; McClelland 2013): the colour+shape factor model is fitted by weighted least squares (alternating, shrunk to the prior 0.15) to the hippocampus' per-site outcome statistics, not to single noisy episodes */
          for (let c = 0; c < 4; c++) { let nu = M36.schLam * 0.15, de = M36.schLam; for (let k = 0; k < SITES; k++) if (this.siteC[k] === c && this.sN[k] > 0) { nu += this.sR[k] - this.sN[k] * this.featS[this.siteS[k]]; de += this.sN[k]; } this.featC[c] = nu / de; }
          for (let c = 0; c < 4; c++) { let nu = M36.schLam * 0.15, de = M36.schLam; for (let k = 0; k < SITES; k++) if (this.siteS[k] === c && this.sN[k] > 0) { nu += this.sR[k] - this.sN[k] * this.featC[this.siteC[k]]; de += this.sN[k]; } this.featS[c] = nu / de; } } }
      if (rem && o.replay !== "nremOnly" && r() < 0.9) { const a = E[Math.floor(r() * E.length)], b = E[Math.floor(r() * E.length)]; const c = this.siteC[a.k], s = this.siteS[b.k]; const k = s * 4 + c;
        const vhat = o.replay === "remShuffle" ? r() * 0.6 : clamp(this.featC[c] + this.featS[s]); const v40r = is40(o.mind ?? MIND_DEFAULT); if (!this.access[k]) { if (v40r) this.dreamBelief(k, vhat); else this.wSite[k] += 0.25 * (vhat - this.wSite[k]); }
        if (ge35(o.mind ?? MIND_DEFAULT) && M35.remAll) for (let k2 = 0; k2 < SITES; k2++) if (!this.access[k2]) { /* v3.5: each dream recombines every unexperienced colour x shape pair */ const vh = o.replay === "remShuffle" ? r() * 0.6 : clamp(this.featC[this.siteC[k2]] + this.featS[this.siteS[k2]]); if (v40r) this.dreamBelief(k2, vh); /* v4.0: the dream writes a low-confidence BELIEF (mean vh, pseudo-count dreamC), never the learned value */ else this.wSite[k2] += M35.remLr * (vh - this.wSite[k2]); } } }
    if (this.devAff) { for (let i = 0; i < NNEU; i++) this.actEMA[i] += 0.002 * ((this.spk[i] ? 1 : 0) - this.actEMA[i]);
      if (n3 && this.t % 10 === 0) this.devRefine(); } /* v4.0 develop: activity-dependent refinement + pruning in deep sleep */
    if (n3 && this.learn && is40(o.mind ?? MIND_DEFAULT) && M40.turn > 0 && r() < M40.turn) { /* v4.0 EXPLORATORY (off by default): sleep-time synaptic turnover. The weakest plastic E->E synapse is pruned and a fresh spine regrows at a random small weight (spine turnover; Holtmaat & Svoboda 2009). Topology stays fixed; this is functional rewiring */ let mi = -1, mw = 1e9; for (let si = 0; si < syn.w.length; si++) if (syn.plastic[si] && syn.w[si] < mw) { mw = syn.w[si]; mi = si; } if (mi >= 0) syn.w[mi] = 0.05 + 0.3 * r(); }
    if (n3 && this.learn && o.decision !== "v30") for (let si = 0; si < syn.w.length; si++) if (syn.plastic[si]) syn.w[si] += 0.0005 * (0.35 - syn.w[si]); // synaptic homeostasis: N3 down-scaling (Tononi & Cirelli 2014)
    if (is37(o.mind ?? MIND_DEFAULT)) for (let k = 0; k < SITES; k++) this.dHat[k] = Math.max(0, this.dHat[k] - 1 / M37.dTau);
    if (ge36(o.mind ?? MIND_DEFAULT)) { const fg = Math.exp(-1 / (is37(o.mind ?? MIND_DEFAULT) ? M37.igTau : M36.igTau)); for (let k = 0; k < SITES; k++) { this.bA[k] = 1 + (this.bA[k] - 1) * fg; this.bB[k] = 1 + (this.bB[k] - 1) * fg; } } // v3.6: beliefs decay toward the prior (non-stationary world)
    for (let k = 0; k < SITES; k++) { if (this.depl[k] > 0) this.depl[k] = Math.max(0, this.depl[k] - 1 / 120); if (o.deplete) this.pTrue[k] = this.pBase[k] * (1 - 0.9 * this.depl[k]); }
    let repairATP = 0; if (!o.repairLesion && this.tissue < 10) { const f2 = Math.max(0, Math.min(10 - this.tissue, 0.01 * clamp(ATPf) * clamp(this.blood.aa - 0.3), this.blood.aa)); this.blood.aa -= f2; this.tissue += f2; repairATP = 0.5 * f2; } this.integrity = this.tissue / 10;
    // ---------- latent state (online Oja PCA of 12 region rates), liminality, thought curvature ----------
    const x = REGIONS.slice(0, 12).map(([n]) => this.regionRate[n]); this.pcaUpdate(x); const zt = this.pc.map((p) => p.reduce((s, w, i) => s + w * x[i], 0)); this.z.push(zt); if (this.z.length > 60) this.z.shift();
    if (this.z.length >= 3) { const n = this.z.length; const a = this.z[n - 3], b = this.z[n - 2], c = this.z[n - 1]; const v1 = b.map((q, i) => q - a[i]), v2 = c.map((q, i) => q - b[i]);
      const n1 = Math.hypot(...v1), n2 = Math.hypot(...v2); const cos = n1 * n2 > 1e-9 ? v1.reduce((s, q, i) => s + q * v2[i], 0) / (n1 * n2) : 1; const k = Math.acos(clamp(cos, -1, 1)) / Math.max(0.02, (n1 + n2) / 2);
      this.kappa = clamp(k / 60); this.kHist.push(this.kappa); if (this.kHist.length > 1440) this.kHist.shift(); }
    // ---------- quantum layer: angles set by neuromodulators; measurement feeds striatal noise sign; QGT trace scales noise ----------
    this.qth = [Math.PI * clamp(da), Math.PI * clamp(nmE("5HT")), Math.PI * clamp(ne)]; this.q.prepare(this.qth); if (this.qb) { this.qb.prepare(this.qth); this.q.ext = this.qb.probs(); } /* v3.6: optional external statevector backend (Moonlab WASM); measurement draws stay on the seeded stream */ this.qOut = this.q.measure(this.ent()); this.health.push(this.qOut);
    if (this.t % 10 === 0) { const Q = qgt(this.qth); this.qgtTrace = Q.trace; this.berry = Q.berry[0][1]; }
    // ---------- metabolism with exact energy ledger (kJ) ----------
    this.brainUse = 0; const mv = (from: number, frac: number): number => Math.max(0, Math.min(from, from * frac));
    // absorption gut -> blood (ENS/vagal motility)
    let f = mv(this.gut.glc, 0.06 * this.motility); this.gut.glc -= f; this.blood.glc += f; f = mv(this.gut.fat, 0.025 * this.motility); this.gut.fat -= f; this.blood.ffa += f; f = mv(this.gut.prot, 0.035 * this.motility); this.gut.prot -= f; this.blood.aa += f;
    // liver: glycogen in/out, lipogenesis, ketogenesis, gluconeogenesis (+urea); adipose lipolysis; muscle protein turnover
    f = mv(this.blood.glc, 0.03 * this.insulin * (1 - this.liverGly / 60)); this.blood.glc -= f; this.liverGly += 0.95 * f; this.heat += 0.05 * f;
    f = mv(this.liverGly, 0.004 * this.glucagon + 0.002 * this.symp); this.liverGly -= f; this.blood.glc += f;
    f = mv(this.blood.glc, 0.01 * clamp(this.insulin - 0.4) * clamp(this.liverGly / 50)); this.blood.glc -= f; this.fat += 0.8 * f; this.heat += 0.2 * f;
    f = mv(this.fat, 0.00012 * (this.glucagon + this.symp + this.cortisol * 0.5) * (1 - 0.7 * this.insulin) * (v38e && M38.fast ? clamp(1 - this.blood.ffa / M38.ffaInh) : 1) * (is39(o.mind ?? MIND_DEFAULT) && M39.lipE > 0 ? Math.min(4, Math.pow(M38.fSet / Math.max(this.fat, 10), M39.lipE)) : 1)); /* v3.9: fractional lipolysis rises as adipocytes shrink (ATGL/HSL induction in prolonged fasting), so fat can be mobilised to near exhaustion */ /* v3.8 fasting: FFA product inhibition of lipolysis (FFA re-esterification / ATGL feedback) so fat release tracks demand */ this.fat -= f; this.blood.ffa += 0.9 * f; this.blood.glc += 0.1 * f /* glycerol -> gluconeogenesis */; f = mv(this.blood.ffa, 0.01 * this.insulin); this.blood.ffa -= f; this.fat += f;
    f = mv(this.blood.ffa, 0.02 * clamp(0.5 - this.insulin) * (v38e && M38.fast ? 1 + M38.ketK * clamp(1 - this.liverGly / 5) : 1)); /* v3.8 fasting: glucagon-driven CPT1 disinhibition (malonyl-CoA falls) raises hepatic ketogenesis once glycogen is depleted */ this.blood.ffa -= f; this.blood.ket += 0.8 * f; this.heat += 0.2 * f;
    f = mv(this.blood.aa, 0.004 * (this.glucagon + this.cortisol) * (v38e && M38.fast ? 1 + M38.gngK * clamp(1 - this.liverGly / 5) : 1)); /* v3.8 fasting: glucagon/cortisol induction of hepatic PEPCK once glycogen is depleted raises gluconeogenic flux */ this.blood.aa -= f; this.blood.glc += 0.75 * f; this.blood.urea += 0.1 * f; this.heat += 0.15 * f;
    const v39e = is39(o.mind ?? MIND_DEFAULT); f = mv(this.muscle, 0.00015 * this.cortisol * (1 - this.insulin) * (v38e && M38.fast ? 1 + M38.protK * clamp(1 - this.liverGly / 5) : 1) * (v39e ? (1 / (1 + M39.ketPS * this.blood.ket)) * (this.fat < M39.fCrit ? M39.p3K : 1) : 1)); /* v3.9: ketone protein sparing in phase II (Sherwin 1975; Cahill 2006) and the phase-III rise in proteolysis once fat is exhausted */ /* v3.8 fasting: glucocorticoid-driven muscle proteolysis rises once glycogen is gone, supplying gluconeogenic amino acids (phase II of starvation) */ this.muscle -= f; this.blood.aa += f; const msat = is38(o.mind ?? MIND_DEFAULT) ? clamp((M38.mMax - this.muscle) / 60) : 1; f = mv(this.blood.aa, 0.005 * this.insulin * clamp(this.blood.aa - 1, 0, 1) * msat); this.blood.aa -= f; this.muscle += f; if (msat < 1) { f = mv(this.blood.aa, 0.005 * this.insulin * clamp(this.blood.aa - 1, 0, 1) * (1 - msat)); this.blood.aa -= f; this.blood.glc += 0.75 * f; this.blood.urea += 0.1 * f; this.heat += 0.15 * f; } /* v3.8: muscle protein accretion saturates near a set mass; surplus amino acids are deaminated (urea) and their carbon goes to gluconeogenesis */
    f = mv(this.blood.urea, 0.01); this.blood.urea -= f; this.excreted += f; f = mv(this.blood.ket, v38e && M38.fast ? M38.ketEx : 0.003); this.blood.ket -= f; /* v3.8 fasting: renal ketone reabsorption, urinary loss <10% of production */ this.excreted += f; // renal urea + ketone loss
    // circulation: blood -> brain glucose by perfusion-limited transport
    f = Math.max(0, 0.3 * this.perfusion * (this.blood.glc / 3 - this.brainGlc / 0.6)) / (v38e && M38.fast ? 1 + M38.ketSpare * this.blood.ket : 1); /* v3.8 fasting: ketone sparing of brain glucose uptake (MCT1 up, Owen 1967: ketones supply ~2/3 of brain fuel in prolonged fasting) */ f = Math.min(f, this.blood.glc); this.blood.glc -= f; this.brainGlc += f;
    // ATP demand (kJ/min): basal, brain (per spike, x intelligence level), decision spikes, heart, motor, NM synthesis, forced wake
    const thm = v38e ? Math.max(M38.thMin, 1 - M38.thK * fatDef) : 1; /* v3.8: adaptive thermogenesis: basal (non-signalling) brain and body costs and the cardiac cost scale down in proportion to the store deficit */ const brainD = 0.004 * thm + 0.000012 * nsp * (0.6 + 0.4 * this.level) + 0.00003 * decideSpikes * this.level + synthCost + this.cogCost; const bodyD = (0.006 + 0.00006 * this.hr) * thm + (decideSpikes > 0 ? 0.004 : 0) + (forced ? 0.003 : 0) + repairATP + 0.002 * this.mind.motor + (o.genes ? 0.003 * Math.max(0, o.genes[3] - 1) : 0);
    this.brainUse = brainD; let need = brainD + bodyD; this.atp -= need; this.heat += need; this.lastChoice = -1;
    // oxidative phosphorylation: substrates -> ATP (40%) + heat (60%), brain uses glucose then ketones, body uses FFA then glucose then ketones
    const refill = Math.max(0, 2 - this.atp) * 0.5; let got = 0; const ox = (take: (x: number) => number): void => { if (got >= refill) return; const want = (refill - got) / 0.4; const s = take(want); got += 0.4 * s; this.atp += 0.4 * s; this.heat += 0.6 * s; };
    const oxBG = (w: number): number => { const s = Math.min(w * 0.4, this.brainGlc); this.brainGlc -= s; return s; }, oxBK = (w: number): number => { const s = Math.min(w * (is39(o.mind ?? MIND_DEFAULT) && M39.ketPS > 0 ? Math.min(0.7, 0.3 + 0.05 * this.blood.ket) : 0.3), this.blood.ket); /* v3.9: ketone share of brain fuel rises with ketonaemia (MCT1 induction) up to ~2/3 (Owen 1967) */ this.blood.ket -= s; return s; }; if (v38e && M38.fast) { ox(oxBK); ox(oxBG); } else { ox(oxBG); ox(oxBK); } /* v3.8 fasting: brain oxidises available ketones before glucose (substrate competition; Owen 1967) */ ox((w) => { const s = Math.min(w * 0.5, this.blood.ket); this.blood.ket -= s; return s; });
    const oxF = (w: number): number => { const s = Math.min(w, this.blood.ffa); this.blood.ffa -= s; return s; }, oxG = (w: number): number => { const s = Math.min(w, this.blood.glc * 0.5); this.blood.glc -= s; return s; }, oxK = (w: number): number => { const s = Math.min(w, this.blood.ket); this.blood.ket -= s; return s; }; if (is39(o.mind ?? MIND_DEFAULT) && M39.ketPS > 0) { ox(oxF); ox(oxK); ox(oxG); } else { ox(oxF); ox(oxG); ox(oxK); } /* v3.9 (with protein sparing): Randle glucose-fatty acid cycle: muscle oxidises FFA and ketones before glucose in fasting */
    if (o.leakyLedger) { this.heat -= 0.05 * need; this.leak++; } // negative control: deliberately broken accounting
    // adenosine (process S): rises with brain ATP turnover awake, cleared in sleep (fastest in N3)
    this.S = clamp(this.S + (awake ? 0.0008 * (brainD / 0.0075) : -(n3 ? 0.004 : 0.0022) * this.S));
    if (this.blood.glc < 0.9 || this.atp < 1.0) this.lowGlc++; else this.lowGlc = 0; if (this.lowGlc > 120) { this.dead = true; this.deathCause = this.deathCause || "hypoglycaemia"; } if (is39(o.mind ?? MIND_DEFAULT) && M39.mDeath > 0 && this.muscle < M39.mDeath && !this.dead) { this.dead = true; this.deathCause = "protein depletion (organ failure)"; } /* v3.9: death from loss of structural protein (cardiac/respiratory muscle), the terminal event of phase-III starvation */ // death: 2 h of hypoglycaemia / ATP failure
    for (const k in this.stim) { this.stim[k] *= 0.9; if (this.stim[k] < 0.01) delete this.stim[k]; }
    this.predErr *= 0.9;
    if (this.t % 2 === 0) this.record(); }
  // spiking race between striatal channels; noise from quantum (Born-rule) or classical source, amplitude set by tonic DA
  /** value estimate the chooser uses for site k: v4.0 blends the Beta posterior mean (mK) into the striatal value, so a dreamt belief counts; before v4.0 it is wSite */
  volU = 0; rA = new Float32Array(SITES).fill(1); rB = new Float32Array(SITES).fill(1); /* v4.0 source monitoring (reality monitoring; Johnson & Raye 1981): uncertainty for the epistemic term is read from belief counts from REAL outcomes only, so dream-recombined beliefs about never-visited sites keep their mean but do not masquerade as experience; belief counts from REAL outcomes only (dreams never write here) */
  uSD(k: number): number { if (M40.epiN > 0) { const a = M40.srcMon > 0 ? this.rA[k] : this.bA[k], b = M40.srcMon > 0 ? this.rB[k] : this.bB[k]; return 0.5 / Math.sqrt(a + b + 1); } /* v4.0 epistemic, not aleatoric: Beta SD conflates ignorance with outcome variance (a 0.5 site always looks more 'uncertain' than a 0.85 site at equal evidence), which made the bonus risk-seeking; the evidence-count form 0.5/sqrt(n+1) measures only how little has been seen (cf. Wilson et al. 2014 information bonus; Hullermeier & Waegeman 2021 aleatoric vs epistemic) */ return M40.srcMon > 0 ? betaSD(this.rA[k], this.rB[k]) : betaSD(this.bA[k], this.bB[k]); }
  kgV = new Float32Array(SITES); intHist: number[] = []; vetoes = 0; harms = 0; vetoLog: number[] = [];
  valueEst(k: number): number { return is40(this.o.mind ?? MIND_DEFAULT) && !this.o.rpeLesion ? this.wSite[k] + M40.mK * (this.bA[k] / (this.bA[k] + this.bB[k]) - this.wSite[k]) : this.wSite[k]; }
  /** v4.0 REM: move an unexperienced option's Beta belief toward a dreamt mean vh with low confidence (pseudo-count dreamC). Value (wSite) is untouched; the dream raises or lowers expected reward AND keeps uncertainty high, so novelty flows through the single uncertainty term */
  lp?: LearningProgress; w3s?: Float64Array; dI?: Float64Array; dM?: Float64Array; sPrev?: Float64Array; dV?: Float64Array; gS = 0.5; gL = 0.5; /* v4.0 FP AE-1: fast vs slow global surprise (unexpected uncertainty); high surprise (ACh-like, Hasselmo 1999) suppresses consolidating replay of the stale feature model */
  dreamBelief(k: number, vh: number): void { const c = M40.dreamC, lr = M40.dreamLr * (M40.dreamGate > 0 ? Math.max(0, 1 - M40.dreamGate * Math.max(0, this.gS - this.gL)) : 1); this.bA[k] += lr * (1 + c * vh - this.bA[k]); this.bB[k] += lr * (1 + c * (1 - vh) - this.bB[k]); }
  /** v4.0 individual temperament: log-normal curiosity gain drawn at first choice. With noise "quantum" the draw comes from the creature's own Q3 Born-rule measurements (the quantum layer as a source of individual variation); otherwise from a seed stream */
  birthTemper(): number { let u1: number, u2: number; if (this.o.noise === "quantum") { u1 = (this.q.measure(this.ent()) + this.ent()) / 8; u2 = this.ent(); } else { const rr = mulberry(this.o.seed * 7919 + 40); u1 = rr(); u2 = rr(); } const g = Math.sqrt(-2 * Math.log(Math.max(1e-12, u1))) * Math.cos(2 * Math.PI * u2); return Math.exp(M40.tempSD * g); }
  /** v4.0 develop: one deep-sleep refinement event. Score a sample of grown synapses by |w| x coactivity; eliminate the weakest. While above the
   *  table's target density, elimination is net (developmental pruning); at target, the slot re-sprouts onto a partner in the same projection chosen
   *  by genome affinity x recent presynaptic activity. Only the presynaptic partner changes (dendrite fixed), so this.out is updated in place. */
  private devRefine(): void { const S = this.devSlots; if (!S.length || !this.devAff) return; const r = this.rd, syn = this.syn; let worst = -1, ws = 1e9;
    for (let n = 0; n < 24; n++) { const k = Math.floor(r() * S.length), si = S[k][0]; if (this.mask[si] === 0 && S[k][2] === 1) continue; const sc = Math.abs(syn.w[si]) * (0.02 + Math.sqrt(this.actEMA[syn.pre[si]] * this.actEMA[syn.post[si]])); if (sc < ws) { ws = sc; worst = k; } }
    if (worst < 0) return; const [si, pi] = S[worst]; const st = this.devStats!; const live = S.length - st.pruned + st.sprouted;
    if (live > this.devTarget) { this.mask[si] = 0; S[worst][2] = 1; (this.devPruned ??= new Uint8Array(this.mask.length))[si] = 1; st.pruned++; return; } // net pruning toward target density
    const [a] = (CP as any)[pi] as [string, string, number]; const j = syn.post[si]; let best = -1, bs = -1; for (let n = 0; n < 12; n++) { const i = R0[a] + Math.floor(r() * RN[a]); if (i === j) continue; const sc = this.devAff(pi, i, j) * (0.05 + this.actEMA[i]) * (0.5 + r()); if (sc > bs) { bs = sc; best = i; } }
    if (best < 0) return; const old = syn.pre[si]; const L = this.out[old]; const ix = L.indexOf(si); if (ix >= 0) L.splice(ix, 1); syn.pre[si] = best; this.out[best].push(si);
    const ln = 0.1 + 0.15 * r(); syn.w[si] = INHIB(best) ? -ln * 1.6 : ln; this.mask[si] = 1; st.sprouted++; st.pruned++; }
  /** v4.0 Neo: built-in sandbox. Legal hooks only; touches nothing outside this creature unless a dome sandbox is attached (domeSandbox). */
  domeSandbox: ((q: HookReq) => boolean) | null = null; neoLog: HookReq[] = [];
  private neoSandbox(q: HookReq): void { let ok = false; if (q.hook === "shade") ok = q.arg > 0 && q.arg <= 120; else if (q.hook === "mark") ok = !!this.domeSandbox && Number.isInteger(q.arg) && q.arg >= 0 && q.arg < SITES && this.domeSandbox(q); this.neo!.grant(q, ok); this.neoLog.push(q); if (this.neoLog.length > 100) this.neoLog.shift(); }
  private bestSite(): number { let b = 0; for (let k = 1; k < SITES; k++) if (this.wSite[k] > this.wSite[b]) b = k; return b; }
  /** v4.0 lab view of Parts VII–X */
  v40State() { return this.bus ? { bus: this.bus.state(), self: this.selfM!.state(), curv: this.curv!.state(), neo: this.neo!.state(), marks: Array.from(this.marks), devPruned: this.devPruned ? this.devPruned.reduce((a, b) => a + b, 0) : 0 } : null; }
  /** v4.0 lab view of the layered affect system (emotions, moods, attitudes, personality, dysregulation events) */
  affectState(): ReturnType<Affect["state"]> | null { return this.affect ? this.affect.state() : null; }
  choose(da: number): { k: number; sp: number } { const W = 3 + 5 * (this.level - 1); const sig = 0.35 * (0.2 + 2 * clamp(da)) * (1 + 0.2 * this.qgtTrace) * (this.affect ? this.affect.noiseMul() : 1) * (this.curv ? this.curv.noiseMul() : 1); const cnt = new Float32Array(SITES), v = new Float32Array(SITES); let sp = 0;
    const v32 = this.o.decision !== "v30"; const keep = v32 ? 1 - 0.4 / this.level : 0.6, gain = (1 - keep) / 0.4; // v3.2: integration time constant grows with level
    const v40 = is40(this.o.mind ?? MIND_DEFAULT); let sdMu = 0, hdMu = 0; if (v40) { if (this.temper < 0) this.temper = this.birthTemper(); let na = 0; for (let k = 0; k < SITES; k++) if (this.access[k]) { sdMu += this.uSD(k); na++; } sdMu /= Math.max(1, na); hdMu = 0; for (let k = 0; k < SITES; k++) if (this.access[k]) hdMu += hBin(this.dDelta * this.dHat[k]); hdMu /= Math.max(1, na); if (M40.kgK > 0) { let m1 = -1, m2 = -1; for (let k = 0; k < SITES; k++) if (this.access[k]) { const mu = this.bA[k] / (this.bA[k] + this.bB[k]); if (mu > m1) { m2 = m1; m1 = mu; } else if (mu > m2) m2 = mu; } let kgM = 0; for (let k = 0; k < SITES; k++) { const mu = this.bA[k] / (this.bA[k] + this.bB[k]), sd = Math.max(1e-6, betaSD(this.bA[k], this.bB[k])); const z = -Math.abs(mu - (mu >= m1 ? m2 : m1)) / sd; this.kgV[k] = this.access[k] ? sd * (z * phiN(z) + Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI)) : 0; if (this.access[k]) kgM += this.kgV[k]; } kgM /= Math.max(1, na); for (let k = 0; k < SITES; k++) this.kgV[k] -= kgM; } /* v4.0 knowledge gradient (Frazier, Powell & Dayanik 2008; value of information, Howard 1966): a site's uncertainty is worth resolving only insofar as resolving it could change which site is best, so uncertainty about a clearly poor site earns little */ } const uGate = 0.5 + clamp(this.nm.ACh.E) + 0.5 * clamp(this.nm.NE.E); /* v4.0: ACh = expected uncertainty, NE = unexpected uncertainty (Yu & Dayan 2005) gate the single uncertainty term */
    const drive = new Float32Array(SITES); const beta = this.o.efeLesion ? 0 : (ge35(this.o.mind ?? MIND_DEFAULT) ? M35.efeK : 2.0 * this.vol) * (0.5 + clamp(this.nm.ACh.E) + 0.5 * clamp(this.nm.NE.E)); // v3.5: epistemic weight no longer collapses with low volatility
    let igM = 0; if (is38(this.o.mind ?? MIND_DEFAULT) && M38.efeC > 0) { let na = 0, mn = Infinity; for (let k = 0; k < SITES; k++) if (this.access[k]) { const ig = betaIG(this.bA[k], this.bB[k]); igM += ig; na++; mn = Math.min(mn, ig); } igM = M38.efeC * (M38.efeRef ? (na ? mn : 0) : igM / Math.max(1, na)); } /* v3.8: centred epistemic value: information gain enters relative to the mean over available options (reference-dependent value coding; Louie & Glimcher 2012), so a uniform uncertainty bonus cannot saturate the evidence race */
    let wMu = 0; if (is39(this.o.mind ?? MIND_DEFAULT) && M39.vK > 0) { let na = 0; for (let k = 0; k < SITES; k++) if (this.access[k]) { wMu += this.wSite[k]; na++; } wMu /= Math.max(1, na); } /* v3.9: D1-pathway gain on learned value differences, centred on the mean of available options (Collins & Frank 2014 OpAL; centring keeps a uniform value from saturating the race) */
    for (let k = 0; k < SITES; k++) { let w = this.wSite[k] + (is39(this.o.mind ?? MIND_DEFAULT) && M39.vK > 0 ? M39.vK * (this.wSite[k] - wMu) : 0); if (v32 && this.level >= 3) w += 0.5 * (clamp(this.featC[this.siteC[k]] + this.featS[this.siteS[k]]) - w); // deliberation: model-based feature prior
      if (this.affect) w += M40.affK * this.affect.bias(k); if (this.neo) w += M40.markK * this.marks[k]; /* v4.0: dome marks left via Neo hooks */ /* v4.0 learned attitude + wanting */ w -= (1 + this.cortisol) * this.wAv[k] * clamp(1.2 - 0.6 * this.ghrelin); // learned aversive value traded against hunger
      w += v40 ? (this.o.efeLesion ? 0 : M40.uK * this.temper * (this.affect ? this.affect.uMul() : 1) * (this.selfM ? 1 + M40.cautK * (0.25 - this.selfM.caution()) : 1) * uGate * ((M40.kgK > 0 ? M40.kgK * this.kgV[k] : this.uSD(k) - sdMu) / SD0 + M40.eK * (hBin(this.dDelta * this.dHat[k]) - hdMu) / Math.LN2 + (M40.tsK ? M40.tsK * (this.uSD(k) / SD0) * gaussQ(this.ent) : 0) + (M40.curK > 0 && this.lp ? M40.curK * this.lp.bonus(k) : 0))) /* v4.0 EFE split (after the pragmatic/epistemic split of expected free energy in Eshkol's active-inference primitives): the epistemic part also includes the entropy of the hidden depleted/recovered state of each site, so a site whose recovery is most uncertain is worth checking */ /* v4.0: ONE value-plus-uncertainty term replaces the v3.5 time-since-visit, v3.6 info-gain, v3.8 centring and v3.9 vK drives: centred posterior SD (directed exploration; Wilson et al. 2014), scaled by an individual temperament */ : ge36(this.o.mind ?? MIND_DEFAULT) ? (this.o.efeLesion ? 0 : M36.efeK * (0.5 + clamp(this.nm.ACh.E) + 0.5 * clamp(this.nm.NE.E)) * (betaIG(this.bA[k], this.bB[k]) - igM) / IG0) /* v3.6: expected information gain (mutual information between the next outcome and the site's reward probability under its Beta belief) = epistemic part of expected free energy (Friston et al. 2015) */ : ge35(this.o.mind ?? MIND_DEFAULT) ? beta * (1 - Math.exp(-(this.t - this.lastVisit[k]) / M35.efeTau)) / Math.pow(1 + this.visits[k], M35.efeVis) /* v3.5: uncertainty about a site regrows with time since the last look (non-stationary world); visit-count discount exponent efeVis */ : beta * (1 - Math.exp(-(this.t - this.lastVisit[k]) / 200)) / Math.sqrt(1 + this.visits[k]); if (is37(this.o.mind ?? MIND_DEFAULT)) { const avail = 1 - M37.depW * this.dDelta * this.dHat[k]; if (!this.o.rpeLesion) w += (v40 ? M40.mK : M37.bmW) * (this.bA[k] / (this.bA[k] + this.bB[k]) - this.wSite[k]); /* v3.7 expected free energy: pragmatic value = posterior-mean reward under the Beta belief, blended with the striatal value; both pragmatic and epistemic terms scaled by the believed availability of the site (depletion forward model) */ w = (w - 0.2) * avail + 0.2; } drive[k] = w; } // epistemic value
    const adenNoise = 1.0 * Math.max(0, this.S - 0.5); const v36q = ge36(this.o.mind ?? MIND_DEFAULT);
    for (let s = 0; s < W; s++) for (let k = 0; k < SITES; k++) { if (!this.access[k]) continue; let n: number;
      if (this.o.noise === "quantum" && v36q) { /* v3.6: von Neumann debiasing of the Born-rule bit (pairs 01 -> 0, 10 -> 1, 00/11 discarded): the sign is exactly unbiased whatever the qubit bias; after 8 failed pairs fall back to the seeded stream */ let bit = -1; for (let tr = 0; tr < 8 && bit < 0; tr++) { const b1 = this.q.measure(this.ent()) & 1, b2 = this.q.measure(this.ent()) & 1; if (b1 !== b2) bit = b1; } if (bit < 0) bit = this.ent() < 0.5 ? 1 : 0; const u2 = this.ent(); n = ((bit ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2)))) * 0.8; }
      else if (this.o.noise === "quantum") { const u = this.q.measure(this.ent()); const u2 = this.ent(); n = (((u & 1) ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2)))) * 0.8; } else { const u2 = this.ent(); n = ((this.ent() < 0.5 ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2)))) * 0.8; }
      v[k] = keep * v[k] + gain * (1.6 * (drive[k] - 0.2) + sig * n + adenNoise * this.gauss()); if (v[k] > 1.0) { cnt[k]++; v[k] = 0; sp++; } }
    let best = -1, bv = -1e9; for (let k = 0; k < SITES; k++) if (this.access[k]) { const s = cnt[k] + 0.01 * v[k]; if (s > bv) { bv = s; best = k; } } return { k: best, sp }; }
  pcaUpdate(x: number[]): void { const m = x; for (let p = 0; p < 3; p++) { const w = this.pc[p]; let y = 0; for (let i = 0; i < 12; i++) y += w[i] * m[i]; for (let i = 0; i < 12; i++) { let rec = 0; for (let q = 0; q <= p; q++) { let yq = 0; for (let j = 0; j < 12; j++) yq += this.pc[q][j] * m[j]; rec += yq * this.pc[q][i]; } w[i] += 0.002 * y * (m[i] - rec); } } }
  record(): void { const h = this.hist; const put = (k: string, v: number): void => { (h[k] = h[k] || []).push(v); if (h[k].length > 720) h[k].shift(); };
    put("DA", this.nm.DA.E); put("5HT", this.nm["5HT"].E); put("NE", this.nm.NE.E); put("ACh", this.nm.ACh.E); put("Glu", this.nm.Glu.P); put("GABA", this.nm.GABA.E); put("eCB", this.nm.eCB.E);
    put("glc", this.blood.glc); put("ffa", this.blood.ffa); put("ket", this.blood.ket); put("aa", this.blood.aa); put("atp", this.atp); put("fat", this.fat); put("glycogen", this.liverGly); put("hr", this.hr);
    put("insulin", this.insulin); put("glucagon", this.glucagon); put("cortisol", this.cortisol); put("ghrelin", this.ghrelin); put("melatonin", this.melatonin); put("S", this.S); put("stage", this.stage);
    put("kappa", this.kappa); put("liminal", this.liminal); put("level", this.level); put("qgt", this.qgtTrace); put("symp", this.symp); put("para", this.para); put("ledgerErr", this.ledgerError());
    for (const [n] of REGIONS) put("r_" + n, this.regionRate[n]); }
  run(ticks: number): void { for (let i = 0; i < ticks; i++) this.step(); }
  // probe: n choices (trained = sites accessible on days 1-3, novel = never accessible) with learning frozen; returns mean true reward probability of chosen sites (expected reward)
  probe(n: number, set: "trained" | "all" | "novel" = "trained"): { ev: number; entropy: number } { const save = this.learn; this.learn = false; const acc = this.access.slice(); if (set === "all") this.access.fill(1); if (set === "novel") for (let k = 0; k < SITES; k++) this.access[k] = acc[k] ? 0 : 1;
    const da = this.o.daClamp !== undefined ? this.o.daClamp : this.nm.DA.E; let s = 0; const c = new Array(SITES).fill(0); for (let i = 0; i < n; i++) { const { k } = this.choose(da); s += this.pTrue[k]; c[k]++; }
    this.access = acc; this.learn = save; let H = 0; for (const x of c) if (x) { const p = x / n; H -= p * Math.log2(p); } return { ev: s / n, entropy: H }; }
  hash(): string { let h = 2166136261; const mix = (x: number): void => { const b = new Float64Array([x]); const u = new Uint32Array(b.buffer); for (const w of u) { h ^= w; h = Math.imul(h, 16777619) >>> 0; } };
    mix(this.energy()); mix(this.nm.DA.E); mix(this.S); for (const w of this.wSite) mix(w); for (let i = 0; i < this.syn.w.length; i += 97) mix(this.syn.w[i]); return (h >>> 0).toString(16); }
  // compact read-out used by the renderer (visuals read ONLY this)
  // v3.4 e-prop gate update (training curriculum only): learning signal = readout error fed back through the Mind's own readout weights (symmetric e-prop), applied to the shared CTX-E gate theta
  epropLearn(m: number, label: number, x: number[], eta = 0.02): void { const M = this.mind, cls = M.cls[m], rec = M.recon[m], xin = M.rate[m]; const p = msoftmax(cls.out(xin), 3), z = rec.out(xin); let nn = 1; for (const v of xin) nn += v * v;
    const gsum = [0, 0, 0, 0]; for (let j = 0; j < MW; j++) { let L = 0; for (let k = 0; k < 4; k++) L += 3 * ((k === label ? 1 : 0) - p[k]) * cls.W[k * (cls.nIn + 1) + j] + ((x[k] - z[k]) / nn) * rec.W[k * (rec.nIn + 1) + j]; const b = (R0.CTX + m * MW + j) * 4; for (let k = 0; k < 4; k++) gsum[k] += L * CX.norm * this.eligT[b + k]; }
    for (let k = 0; k < 4; k++) this.gate[k] += eta * clamp(gsum[k], -1, 1); this.gate[0] = clamp(this.gate[0], Math.log(1.5), Math.log(40)); for (let k = 1; k < 4; k++) this.gate[k] = clamp(this.gate[k], 0, 5); this.gHist.push(this.gate.slice()); }
  rateAvgMod(m: number): number { let s = 0; for (let j = 0; j < MW; j++) s += this.rateAvg[R0.CTX + m * MW + j]; return s / MW; }
  view(): Record<string, number> { const R = this.regionRate; return { DA: this.nm.DA.E, SER: this.nm["5HT"].E, NE: this.nm.NE.E, ACh: this.nm.ACh.E, eCB: this.nm.eCB.E, atp: this.atp, glc: this.blood.glc, fat: this.fat, hr: this.hr, stage: this.stage, S: this.S, kappa: this.kappa, liminal: this.liminal, level: this.level, light: this.light, ctx: R.CTX, hip: R.HIP, str: R.STR, mot: R.MOT, ens: R.ENS, q: this.qOut, gut: this.gut.glc + this.gut.fat + this.gut.prot, symp: this.symp, para: this.para }; }
}
// Coupling graph of the organism (each edge corresponds to code in organism.ts). Used by the inspector and the site diagram.
const PARTS = ["CNS spiking", "ENS", "Autonomic", "Neuromodulators", "Hormones", "Gut", "Liver", "Adipose", "Muscle", "Blood", "Heart", "ATP/energy", "Circadian", "Sleep", "Replay/dreams", "Latent/liminal", "Curvature", "Quantum", "Level", "Behaviour", "Plasticity", "GPU 100M net", "Senses", "Workspace/attention", "Metacognition", "Prediction", "Body/arm", "Integrity", "LTC neurons"] as const;
const COUPLING: [string, string, string][] = [
  ["CNS spiking", "Neuromodulators", "nucleus spikes release DA/5HT/NE/ACh/Glu/GABA/eCB"], ["CNS spiking", "Autonomic", "LC→symp, −LC→para"], ["CNS spiking", "ATP/energy", "spike cost"], ["CNS spiking", "Sleep", "ATP turnover→adenosine"], ["CNS spiking", "Latent/liminal", "region rates→PCA"], ["CNS spiking", "Behaviour", "HYP hunger, STR race"],
  ["ENS", "CNS spiking", "ENS→HYP"], ["ENS", "Gut", "motility"], ["Autonomic", "ENS", "para→ENS"], ["Autonomic", "Hormones", "para→insulin, symp→glucagon"], ["Autonomic", "Heart", "HR"], ["Autonomic", "Liver", "glycogenolysis"], ["Autonomic", "Adipose", "lipolysis"], ["Autonomic", "Gut", "motility"],
  ["Neuromodulators", "CNS spiking", "NE gain, Glu/GABA/eCB synaptic scale"], ["Neuromodulators", "Quantum", "qubit angles"], ["Neuromodulators", "Level", "ACh"], ["Neuromodulators", "Behaviour", "DA noise σ, RPE"], ["Neuromodulators", "Plasticity", "DA-gated STDP"], ["Neuromodulators", "Replay/dreams", "ACh encoding gate"], ["Neuromodulators", "ATP/energy", "synthesis cost"],
  ["Hormones", "CNS spiking", "ghrelin/leptin→HYP, cortisol→LC"], ["Hormones", "Liver", "insulin/glucagon/cortisol"], ["Hormones", "Adipose", "lipolysis/storage"], ["Hormones", "Muscle", "proteolysis/synthesis"], ["Hormones", "Sleep", "melatonin"], ["Hormones", "Autonomic", "cortisol→symp"],
  ["Gut", "Blood", "absorption"], ["Gut", "CNS spiking", "vagal afferent→HYP/RAPHE"], ["Gut", "ENS", "fill"], ["Gut", "Hormones", "ghrelin"], ["Liver", "Blood", "glucose, ketones, urea"], ["Liver", "Adipose", "lipogenesis"], ["Adipose", "Blood", "FFA, glycerol"], ["Adipose", "Hormones", "leptin"], ["Muscle", "Blood", "amino acids"],
  ["Blood", "CNS spiking", "brain fuel, amino-acid precursors"], ["Blood", "Neuromodulators", "precursor + fuel gating"], ["Blood", "Hormones", "glucose→PID"], ["Blood", "ATP/energy", "oxidation"], ["Blood", "Autonomic", "hypoglycaemia→symp"], ["Heart", "Blood", "perfusion→brain glucose"], ["Heart", "ATP/energy", "cardiac cost"],
  ["ATP/energy", "CNS spiking", "K-ATP thresholds, VTA/BF drive"], ["ATP/energy", "Level", "fuel gating"], ["Circadian", "Sleep", "process C"], ["Circadian", "Hormones", "cortisol, melatonin"], ["Circadian", "Blood", "allostatic setpoint"], ["Sleep", "CNS spiking", "stage drives"], ["Sleep", "Replay/dreams", "N2/N3/REM gates"], ["Sleep", "Behaviour", "wake gates foraging"], ["Sleep", "Autonomic", "sleep→para"],
  ["Replay/dreams", "Plasticity", "consolidation, recombination"], ["Latent/liminal", "Curvature", "trajectory"], ["Latent/liminal", "Replay/dreams", "liminality→replay"], ["Curvature", "CNS spiking", "insula→LC"], ["Quantum", "Behaviour", "noise sign, QGT trace→σ"], ["Level", "ATP/energy", "drain"], ["Level", "Behaviour", "integration steps"],
  ["Behaviour", "Gut", "food"], ["Behaviour", "Neuromodulators", "RPE→DA burst"], ["Behaviour", "Replay/dreams", "episodes"], ["Behaviour", "ATP/energy", "motor cost"], ["Plasticity", "Behaviour", "site values"], ["GPU 100M net", "CNS spiking", "prediction error→LC (browser only)"], ["CNS spiking", "GPU 100M net", "organism state in senses (browser only)"],
  ["Senses", "CNS spiking", "16 lines → SENS → THAL → CTX module (topographic), sleep-gated"], ["CNS spiking", "Workspace/attention", "CTX module rates → posteriors → salience"], ["Neuromodulators", "Workspace/attention", "NE lowers ignition threshold"],
  ["Workspace/attention", "CNS spiking", "broadcast → HIP; attention gain → SENS; top-down → THAL"], ["Workspace/attention", "Neuromodulators", "ignition → LC (predErr)"], ["Workspace/attention", "ATP/energy", "ignition cost"],
  ["Workspace/attention", "Metacognition", "margin, consistency"], ["Neuromodulators", "Metacognition", "NE"], ["Sleep", "Metacognition", "adenosine S"],
  ["CNS spiking", "Prediction", "CTX → next-SENS predictor; TD value"], ["Prediction", "Neuromodulators", "prediction error → LC; TD error → DA"], ["Blood", "Prediction", "interoceptive glucose forecaster"],
  ["Body/arm", "CNS spiking", "motor → MOT"], ["Prediction", "Body/arm", "forward model (efference copy)"], ["Integrity", "CNS spiking", "damage → INS"], ["Integrity", "Hormones", "damage → cortisol"], ["Blood", "Integrity", "repair from amino acids"], ["Integrity", "ATP/energy", "repair ATP"],
  ["Neuromodulators", "LTC neurons", "ACh lengthens, NE shortens τ"], ["LTC neurons", "CNS spiking", "input-dependent membrane τ (opt-in)"]];
// ---- Lab tab: queries the live dome viewer's inspector API (lab/viewer/README.md: GET /inspect?id=<creature>&tool=state|motorLens|pci|qrng) ----
const LAB_TOOLS = ["state", "motorLens", "pci", "qrng"] as const;
function LabTab({ mono }: { mono: Record<string, unknown> }) {
  const [base, setBase] = useState("http://localhost:8787"); const [id, setId] = useState("c0"); const [res, setRes] = useState<Record<string, string>>({}); const [busy, setBusy] = useState<string | null>(null);
  const run = async (tool: string) => { setBusy(tool); try { const r = await fetch(`${base.replace(/\/$/, "")}/inspect?id=${encodeURIComponent(id)}&tool=${tool}`); const t = await r.text(); let out = t; try { out = JSON.stringify(JSON.parse(t), null, 2); } catch { /* not JSON */ } setRes((x) => ({ ...x, [tool]: r.ok ? out : `HTTP ${r.status}: ${out}` })); } catch (e) { setRes((x) => ({ ...x, [tool]: `request failed: ${String(e)} (is the dome viewer running? PORT=8787 node out/server.js. If it is, the browser blocked a cross-origin read: lab/viewer/server.ts sends no Access-Control-Allow-Origin header, so this tab works only when the Page is served from the viewer origin, until the viewer adds that header)` })); } finally { setBusy(null); } };
  return <div><div style={mono}>Dome viewer inspector. state reads the live creature; motorLens, pci and qrng run on a fresh clone of it.</div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><input value={base} onChange={(e) => setBase(e.target.value)} style={{ width: 200 }} /><input value={id} onChange={(e) => setId(e.target.value)} style={{ width: 50 }} />
      {LAB_TOOLS.map((t) => <Button key={t} label={busy === t ? `${t}…` : t} onClick={() => run(t)} />)}<Button label="run all" onClick={async () => { for (const t of LAB_TOOLS) await run(t); }} /></div>
    {LAB_TOOLS.filter((t) => res[t] !== undefined).map((t) => <div key={t}><div style={{ ...mono, fontWeight: 600 }}>{t}</div><pre style={{ ...mono, maxHeight: 220, overflow: "auto", margin: 0, background: "rgba(127,127,127,0.06)", padding: 6 }}>{res[t]}</pre></div>)}</div>;
}
// ---- Organism inspector: every panel reads the live Organism instance; controls call its public methods ----
function Inspector({ org, theme, speed, setSpeed }: { org: Organism; theme: any; speed: number; setSpeed: (n: number) => void }) {
  const [, setTick] = useState(0); const [part, setPart] = useState<string>("CNS spiking"); const [reg, setReg] = useState("LC"); const [nmSel, setNm] = useState("DA");
  const lesioned = useRef<Record<string, Float32Array>>({}); const cref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => { const id = setInterval(() => setTick((x) => x + 1), 300); return () => clearInterval(id); }, []);
  const H = org.hist, col = theme.dataviz.categorical, mono = { fontFamily: theme.font.mono, fontSize: 11, lineHeight: "15px", color: theme.text.secondary } as const;
  const panel = { border: `1px solid ${theme.border.default}`, borderRadius: 12, padding: 10, minWidth: 0 } as const;
  const chart = (keys: string[], title: string, h = 60) => { const series = keys.map((k) => H[k] || []); const all = series.flat(); const mn = Math.min(0, ...all), mx = Math.max(1e-9, ...all);
    return <div style={{ marginBottom: 6 }}><div style={mono}>{title} · {keys.map((k, i) => <span key={k} style={{ color: col[i % col.length] }}>{k}={((H[k] || [0]).slice(-1)[0] ?? 0).toPrecision(3)} </span>)} [{mn.toPrecision(2)}…{mx.toPrecision(2)}]</div>
      <svg width="100%" height={h} viewBox={`0 0 720 ${h}`} preserveAspectRatio="none" style={{ background: "rgba(127,127,127,0.06)" }}>{series.map((a, i) => <polyline key={i} fill="none" stroke={col[i % col.length]} strokeWidth="1.5" vectorEffect="non-scaling-stroke" points={a.map((v, j) => `${j + 720 - a.length},${(h - 2) - ((v - mn) / (mx - mn)) * (h - 4)}`).join(" ")} />)}</svg></div>; };
  const bar = (label: string, v: number, max: number, c = col[0]) => <div key={label} style={{ ...mono, display: "flex", gap: 6, alignItems: "center" }}><span style={{ width: 80 }}>{label}</span><div style={{ flex: 1, height: 8, background: "rgba(127,127,127,0.15)" }}><div style={{ width: `${Math.min(100, (100 * v) / max)}%`, height: 8, background: c }} /></div><span style={{ width: 60, textAlign: "right" }}>{v.toPrecision(3)}</span></div>;
  // connectome canvas: neurons on a ring grouped by region; synapses coloured by sign/weight; node brightness = live rate
  useEffect(() => { const c = cref.current; if (!c || part !== "CNS spiking") return; const g = c.getContext("2d"); if (!g) return; const W = c.width = 520, Hh = c.height = 520; g.fillStyle = "#08070c"; g.fillRect(0, 0, W, Hh);
    const pos = (i: number) => { const a = (i / NNEU) * Math.PI * 2; return [W / 2 + Math.cos(a) * 225, Hh / 2 + Math.sin(a) * 225]; }; const s = org.syn; const hi = reg;
    for (let k = 0; k < s.w.length; k++) { const a = pos(s.pre[k]), b = pos(s.post[k]); const inReg = (i: number) => i >= R0[hi] && i < R0[hi] + RN[hi]; const sel = inReg(s.pre[k]) || inReg(s.post[k]); const w = s.w[k];
      g.strokeStyle = w >= 0 ? `rgba(255,120,80,${sel ? 0.5 : Math.min(0.25, Math.abs(w) * 0.15)})` : `rgba(80,140,255,${sel ? 0.5 : Math.min(0.25, Math.abs(w) * 0.15)})`; g.lineWidth = sel ? 1 : 0.5; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(W / 2, Hh / 2, b[0], b[1]); g.stroke(); }
    for (let i = 0; i < NNEU; i++) { const [x, y] = pos(i); const r = org.rate[i]; g.fillStyle = org.spk[i] ? "#fff" : `rgba(255,${200 * Math.min(1, r * 4)},60,${0.3 + Math.min(0.7, r * 4)})`; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
    g.font = "11px monospace"; for (const [n] of REGIONS) { const [x, y] = pos(R0[n] + RN[n] / 2); g.fillStyle = lesioned.current[n] ? "#f55" : n === hi ? "#ff0" : "#aaa"; g.fillText(`${n} ${(org.regionRate[n] ?? 0).toFixed(2)}`, W / 2 + (x - W / 2) * 0.82 - 20, Hh / 2 + (y - Hh / 2) * 0.82); } });
  const lesionRegion = (n: string) => { const L = lesioned.current; if (L[n]) { org.th.set(L[n], R0[n]); delete L[n]; org.events.push(`t${org.t} restore ${n}`); } else { L[n] = org.th.slice(R0[n], R0[n] + RN[n]); for (let i = R0[n]; i < R0[n] + RN[n]; i++) org.th[i] = 1e9; org.events.push(`t${org.t} lesion ${n} (thresholds→∞)`); } };
  const O = org.o as Record<string, unknown>; const tog = (k: string, on: unknown = true) => <Button key={k} label={`${O[k] ? "undo " : ""}${k}`} onClick={() => org.lesion(k as any, O[k] ? undefined : on)} />;
  const edges = COUPLING; const P = PARTS as readonly string[]; const cx = (i: number) => 300 + 250 * Math.cos((i / P.length) * 6.283 - 1.57), cy = (i: number) => 270 + 240 * Math.sin((i / P.length) * 6.283 - 1.57);
  const probs = org.q.probs(); const pc = org.paramCount(); const v = org.view();
  const body: Record<string, JSX.Element> = {
    "CNS spiking": <div><canvas ref={cref} style={{ width: "100%", maxWidth: 520, aspectRatio: "1" }} />{chart(["r_CTX", "r_HIP", "r_STR", "r_LC", "r_VTA"], "region rates")}{chart(["r_SENS", "r_THAL", "r_HYP", "r_INS", "r_MOT"], "region rates")}
      <div style={mono}>{NNEU} LIF neurons · {pc.synapses} synapses ({pc.plasticSynapses} plastic) · highlighted region: {reg}</div></div>,
    "ENS": <div>{chart(["r_ENS"], "ENS rate")}{chart(["para"], "parasympathetic drive")}{bar("gut contents", v.gut, 20)}</div>,
    "Autonomic": <div>{chart(["symp", "para"], "sympathetic / parasympathetic")}{chart(["hr"], "heart rate")}</div>, "Heart": <div>{chart(["hr"], "heart rate (bpm)")}{chart(["symp", "para"], "autonomic input")}</div>,
    "Neuromodulators": <div>{Object.entries(org.nm).map(([k, m], i) => <div key={k}>{bar(k + " extracell.", m.E, 2, col[i % col.length])}{bar(k + " pool", m.P, 1.5, col[(i + 3) % col.length])}</div>)}{chart(["DA", "5HT", "NE", "ACh"], "extracellular")}{chart(["GABA", "eCB", "Glu"], "")}</div>,
    "Hormones": <div>{chart(["insulin", "glucagon"], "pancreas")}{chart(["cortisol", "melatonin", "ghrelin"], "")}</div>,
    "Gut": <div>{bar("gut glucose", org.gut.glc, 10)}{bar("gut fat", org.gut.fat, 10)}{bar("gut protein", org.gut.prot, 10)}{bar("eaten kJ", org.eaten, Math.max(1, org.eaten))}</div>,
    "Liver": <div>{chart(["glycogen"], "liver glycogen")}{chart(["glc", "ket"], "blood glucose / ketones")}</div>, "Adipose": <div>{chart(["fat"], "fat store")}{chart(["ffa"], "blood FFA")}</div>,
    "Muscle": <div>{bar("muscle protein", org.muscle, 150)}{chart(["aa"], "blood amino acids")}</div>, "Blood": <div>{chart(["glc", "ffa", "ket", "aa"], "blood")}</div>,
    "ATP/energy": <div>{chart(["atp"], "brain ATP")}{chart(["ledgerErr"], "energy-ledger error (kJ, conservation check)")}<div style={mono}>total energy {org.energy().toFixed(3)} kJ · eaten {org.eaten.toFixed(1)} · heat {org.heat.toFixed(2)} · excreted {org.excreted.toFixed(2)} · ledger error {org.ledgerError().toExponential(2)}</div></div>,
    "Circadian": <div>{chart(["melatonin", "cortisol"], "circadian hormones")}<div style={mono}>SCN phase {(org.scnPhase / 6.283 * 24).toFixed(1)} h · light {org.light.toFixed(2)}</div></div>,
    "Sleep": <div>{chart(["stage"], "hypnogram (0 wake 1 N1 2 N2 3 N3 4 REM)")}{chart(["S"], "process S (adenosine)")}<div style={mono}>stage {STAGES[org.stage]} · asleep {String(org.asleep)}</div></div>,
    "Replay/dreams": <div>{chart(["stage"], "stage (replay N2/N3, recombination REM)")}{chart(["liminal"], "liminality")}<div style={mono}>episodes stored {org.episodes.length} · {org.stage === 4 ? "REM: recombining episodes now" : org.stage >= 2 ? "NREM: replaying episodes now" : "no replay (not in N2/N3/REM)"}</div></div>,
    "Latent/liminal": <div>{chart(["liminal"], "liminality")}{chart(["kappa"], "latent curvature κ")}</div>, "Curvature": <div>{chart(["kappa"], "κ")}{chart(["r_INS", "r_LC"], "insula → LC")}</div>,
    "Quantum": <div>{probs.map((p, i) => bar("|" + i.toString(2).padStart(3, "0") + "⟩", p, 1, col[i % col.length]))}{chart(["qgt"], "QGT trace (Fubini–Study)")}<div style={mono}>Berry curvature F01 {org.berry.toFixed(4)} · last measurement {org.qOut} · health fails {org.health.fails}/{org.health.n} (RCT cut {org.health.rctCut}, APT cut {org.health.aptCut})</div></div>,
    "Level": <div>{chart(["level"], "intelligence level")}<div style={{ display: "flex", gap: 6 }}>{[1, 2, 3, 4].map((l) => <Button key={l} label={`force level ${l}`} onClick={() => org.lesion("level" as any, l)} />)}<Button label="level: auto (ACh·ATP·fuel)" onClick={() => org.lesion("level" as any, undefined)} /></div></div>,
    "Behaviour": <div><div style={mono}>site values (learned) vs true reward probability</div>{Array.from(org.wSite).map((w, k) => bar(`site ${k}${org.access[k] ? "" : " ·"}`, w, 1, col[k % col.length]))}<div style={mono}>true: {Array.from(org.pTrue, (p) => p.toFixed(2)).join(" ")}</div></div>,
    "Plasticity": <div>{chart(["DA"], "DA gating STDP")}<div style={mono}>plastic synapses {pc.plasticSynapses} · mean |w| {(org.syn.w.reduce((a, b) => a + Math.abs(b), 0) / org.syn.w.length).toFixed(4)}</div></div>,
    "Senses": <div><div style={mono}>sensory lines (4 modalities × 4): {Array.from(org.sens, (x) => x.toFixed(1)).join(" ")} · attention gain {org.mind.att.map((x) => x.toFixed(2)).join(" ")}</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{[0, 1, 2, 3].map((m) => <Button key={m} label={`show class ${m} on modality ${m}`} onClick={() => { org.sens.fill(0); org.sens[m * 4 + m] = 1; }} />)}<Button label="clear senses" onClick={() => org.sens.fill(0)} /></div>{chart(["r_SENS", "r_THAL"], "SENS / THAL rate")}</div>,
    "Workspace/attention": <div>{org.mind.sal.map((x, m) => bar(`salience m${m}`, x, 1, col[m]))}<div style={mono}>winner {org.mind.win} · ignitions {org.mind.ignitions} · broadcast {Array.from(org.mind.bcOut, (x) => x.toFixed(2)).join(" ")} · action {org.mind.action} · binding PLV 0-1 {org.mind.binding(0, 1).toFixed(2)} 2-3 {org.mind.binding(2, 3).toFixed(2)}</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{tog("gwLesion")}{tog("bcLesion")}{tog("seqLesion")}{tog("topdownLesion")}{tog("fieldLesion")}{tog("recLesion")}{tog("mixLesion")}</div></div>,
    "Metacognition": <div>{bar("confidence", org.mind.conf, 1)}{bar("margin", org.mind.margin, 1)}<div style={mono}>monitor weights {Array.from(org.mind.meta, (x) => x.toFixed(2)).join(" ")} · attention schema focus {org.mind.kal.x[0].toFixed(2)} (true {org.mind.af.toFixed(2)}, target {org.mind.afTarget.toFixed(2)})</div>{tog("astLesion")}</div>,
    "Prediction": <div>{bar("sensory pred. error", org.mind.ppErr, 0.5)}<div style={mono}>TD value V {org.mind.V.toFixed(3)} · TD error {org.mind.tdErr.toFixed(3)} · glucose in 30 min forecast {org.mind.glcPred.toFixed(2)} (now {org.blood.glc.toFixed(2)})</div>{tog("ppLesion")}{tog("traceLesion")}</div>,
    "Body/arm": <div><div style={mono}>arm {org.mind.arm.toFixed(2)} · true gain {org.mind.gTrue.toFixed(2)} · learned gain {org.mind.gHat.toFixed(2)} · predicted Δ {org.mind.dArmPred.toFixed(3)} observed Δ {org.mind.dArmObs.toFixed(3)}</div><Button label="move arm +0.5" onClick={() => { org.mind.efference = 0.5; }} /><Button label="push arm (external)" onClick={() => { org.mind.push = 0.5; }} />{tog("efferenceLesion")}{tog("fwdLesion")}</div>,
    "Integrity": <div>{bar("integrity", org.integrity, 1)}<div style={mono}>tissue {org.tissue.toFixed(2)} kJ (in ledger) · damage taken {org.damageTaken.toFixed(2)} · dead {String(org.dead)}</div><Button label="damage 0.1" onClick={() => org.damage(0.1)} />{tog("repairLesion")}{tog("danger")}{tog("pidLesion")}</div>,
    "LTC neurons": <div><div style={mono}>{O.ltc ? "LTC on" : "fixed τ (LIF)"} · mean CTX τ {(Array.from(org.tau.slice(R0.CTX, R0.CTX + 64)).reduce((a, b) => a + b, 0) / 64).toFixed(2)} substeps · mean HIP τ {(Array.from(org.tau.slice(R0.HIP, R0.HIP + 32)).reduce((a, b) => a + b, 0) / 32).toFixed(2)}</div>{tog("ltc")}</div>,
    "Lab": <LabTab mono={mono} />,
    "GPU 100M net": <div style={mono}>prediction error of the 100M procedural net + 680,008 learned params, fed to LC: {org.predErr.toFixed(4)}. The net itself runs on the GPU; see the parameter-engine panel.</div> };
  return <div style={{ ...panel, display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ fontSize: 13, fontWeight: 600 }}>Organism inspector (live; every value read from the running simulation) · t={org.t} · {STAGES[org.stage]} · seed {org.o.seed} · {pc.total} organism params</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      <Button label="Feed 20 kJ" onClick={() => org.feed(20)} /><select value={reg} onChange={(e) => setReg(e.target.value)}>{REGIONS.map(([n]) => <option key={n}>{n}</option>)}</select>
      <Button label={`Stimulate ${reg}`} onClick={() => org.stimulate(reg, 3)} /><Button label={`${lesioned.current[reg] ? "Restore" : "Lesion"} ${reg}`} onClick={() => lesionRegion(reg)} />
      <select value={nmSel} onChange={(e) => setNm(e.target.value)}>{Object.keys(org.nm).map((k) => <option key={k}>{k}</option>)}</select><Button label={`Inject ${nmSel}`} onClick={() => org.inject(nmSel, 0.5)} />
      {tog("vagotomy")}{tog("scnLesion")}{tog("insulaLesion")}{tog("sympathectomy")}{tog("forceWake")}{tog("starve")}<Button label={`replay: ${String(O.replay ?? "full")}`} onClick={() => org.lesion("replay" as any, O.replay === "none" ? "full" : "none")} />
      <Button label={part === "Lab" ? "Lab (open)" : "Lab"} onClick={() => setPart("Lab")} /><span style={mono}>speed {speed} ticks/frame</span><input type="range" min={0} max={20} value={speed} onChange={(e) => setSpeed(+e.target.value)} /></div>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) minmax(300px, 1.2fr)", gap: 10 }}>
      <svg viewBox="0 0 600 540" style={{ width: "100%" }}>{edges.map(([a, b, l], k) => { const i = P.indexOf(a), j = P.indexOf(b); const on = a === part || b === part; return <line key={k} x1={cx(i)} y1={cy(i)} x2={cx(j)} y2={cy(j)} stroke={on ? (a === part ? col[1] : col[2]) : "rgba(127,127,127,0.18)"} strokeWidth={on ? 2 : 1}><title>{a} → {b}: {l}</title></line>; })}
        {P.map((p, i) => <g key={p} onClick={() => setPart(p)} style={{ cursor: "pointer" }}><circle cx={cx(i)} cy={cy(i)} r={p === part ? 11 : 7} fill={p === part ? col[0] : "#888"} /><text x={cx(i)} y={cy(i) - 13} fontSize="12" textAnchor="middle" fill={theme.text.primary}>{p}</text></g>)}</svg>
      <div><div style={{ fontSize: 12, fontWeight: 600 }}>{part} (click a node to isolate it; orange = outputs, green = inputs)</div><div style={mono}>{edges.filter(([a, b]) => a === part || b === part).map(([a, b, l]) => `${a === part ? "→ " + b : "← " + a}: ${l}`).join(" · ")}</div>{body[part]}</div></div>
    <div style={{ ...mono, maxHeight: 80, overflow: "auto" }}>events: {org.events.slice(-12).join(" · ")}</div></div>;
}
// ===================== Creature #1 v3: GPU brain, HDR raymarched body, evaluation panel =====================
// --- entropy + Moonlab-style 2-qubit state vector with CHSH-gated randomness (TypeScript port, not Moonlab itself) ---
function osU32(): number { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0]; }
class QSim { re = new Float64Array(4); im = new Float64Array(4);
  reset(): void { this.re.fill(0); this.im.fill(0); this.re[0] = 1; }
  ry(q: number, t: number): void { const c = Math.cos(t / 2), s = Math.sin(t / 2), m = 1 << q; for (let i = 0; i < 4; i++) if (!(i & m)) { const j = i | m; const a = this.re[i], b = this.re[j], ai = this.im[i], bi = this.im[j]; this.re[i] = c * a - s * b; this.re[j] = s * a + c * b; this.im[i] = c * ai - s * bi; this.im[j] = s * ai + c * bi; } }
  h(q: number): void { const s = Math.SQRT1_2, m = 1 << q; for (let i = 0; i < 4; i++) if (!(i & m)) { const j = i | m; const a = this.re[i], b = this.re[j], ai = this.im[i], bi = this.im[j]; this.re[i] = s * (a + b); this.re[j] = s * (a - b); this.im[i] = s * (ai + bi); this.im[j] = s * (ai - bi); } }
  cx(): void { let x = this.re[1]; this.re[1] = this.re[3]; this.re[3] = x; x = this.im[1]; this.im[1] = this.im[3]; this.im[3] = x; }
  probs(): number[] { return [0, 1, 2, 3].map((k) => this.re[k] ** 2 + this.im[k] ** 2); }
  measure(u: number): number { const p = this.probs(); let k = 0; for (; k < 3; k++) { u -= p[k]; if (u < 0) break; } return k; } }
function chsh(shots: number): number { const q = new QSim(); const A = [0, Math.PI / 2], B = [Math.PI / 4, -Math.PI / 4]; let S = 0;
  for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) { let e = 0; for (let s = 0; s < shots; s++) { q.reset(); q.h(0); q.cx(); q.ry(0, -A[x]); q.ry(1, -B[y]); const k = q.measure(osU32() / 4294967296); e += ((k & 1) ^ (k >> 1)) ? -1 : 1; } e /= shots; S += x && y ? -e : e; } return Math.abs(S); }

function substrateCheck(): { ok: boolean; n: number } { const rv = new RV(); rv.x[10] = 0x1234567; let js = 0x1234567 | 0; let ok = true; const n = 500;
  for (let k = 0; k < n; k++) { for (let i = 0; i < PROGRAM.length; i++) rv.step(); js ^= js << 13; js ^= js >>> 17; js ^= js << 5; if ((rv.mem.getInt32(264, true) | 0) !== (js | 0)) ok = false; } return { ok, n }; }

// --- reverse-mode autodiff tape: trains the readout of the GPU network online ---
class Tn { v: Float32Array; g: Float32Array; back: (() => void) | null = null; par: Tn[] = []; constructor(n: number) { this.v = new Float32Array(n); this.g = new Float32Array(n); } }
function linT(x: Tn, W: Tn, b: Tn, ni: number, no: number): Tn { const y = new Tn(no); for (let o = 0; o < no; o++) { let s = b.v[o]; const off = o * ni; for (let i = 0; i < ni; i++) s += W.v[off + i] * x.v[i]; y.v[o] = s; }
  y.par = [x, W, b]; y.back = () => { for (let o = 0; o < no; o++) { const g = y.g[o]; if (!g) continue; b.g[o] += g; const off = o * ni; for (let i = 0; i < ni; i++) { W.g[off + i] += g * x.v[i]; x.g[i] += g * W.v[off + i]; } } }; return y; }
function tanhTn(x: Tn): Tn { const y = new Tn(x.v.length); for (let i = 0; i < y.v.length; i++) y.v[i] = Math.tanh(x.v[i]); y.par = [x]; y.back = () => { for (let i = 0; i < y.v.length; i++) x.g[i] += y.g[i] * (1 - y.v[i] ** 2); }; return y; }
function mseTn(x: Tn, t: number[]): Tn { const y = new Tn(1); let s = 0; for (let i = 0; i < t.length; i++) s += (x.v[i] - t[i]) ** 2; y.v[0] = s / t.length; y.par = [x]; y.back = () => { for (let i = 0; i < t.length; i++) x.g[i] += y.g[0] * 2 * (x.v[i] - t[i]) / t.length; }; return y; }
function backwardTn(root: Tn): void { const ord: Tn[] = []; const seen = new Set<Tn>(); const vis = (t: Tn): void => { if (seen.has(t)) return; seen.add(t); t.par.forEach(vis); ord.push(t); }; vis(root); root.g[0] = 1; for (let i = ord.length - 1; i >= 0; i--) { const b = ord[i].back; if (b) b(); } }

// --- GPU parameter engine: 4 dense tanh layers of 5000x5000 procedural weights = 100,000,000 inference weights ---
const NN = 5000, NL = 4, NOUT = 8;
const HASH_GLSL = `uint hh(uint x){x^=x>>16;x*=0x7feb352du;x^=x>>15;x*=0x846ca68bu;x^=x>>16;return x;}`;
const HASH_WGSL = `fn hh(xi:u32)->u32{var x=xi;x^=x>>16u;x*=0x7feb352du;x^=x>>15u;x*=0x846ca68bu;x^=x>>16u;return x;}`;
// fwd: y[o] = tanh(0.0245·Σ_i w(l,o,i)·x[i] + add[o]) for o < rows (else 0).  bwd: y[i] = Σ_{o<rows} w(l,o,i)·g[o]  (exact transpose, for LoRA backprop)
type Engine = { kind: string; info: string; fwd: (l: number, x: Float32Array, rows: number, add: Float32Array) => Promise<Float32Array>; bwd: (l: number, g: Float32Array, rows: number) => Promise<Float32Array> };
async function makeWebGPU(): Promise<Engine | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any; if (!nav.gpu) return null; const ad = await nav.gpu.requestAdapter(); if (!ad) return null; const dev = await ad.requestDevice();
  const code = `${HASH_WGSL}
@group(0) @binding(0) var<storage,read> xin: array<f32>; @group(0) @binding(1) var<storage,read_write> yout: array<f32>; @group(0) @binding(2) var<uniform> P: vec4<u32>; @group(0) @binding(3) var<storage,read> addv: array<f32>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id: vec3<u32>) { let o = id.x; if (o >= ${NN}u) { return; } var s = 0.0;
  if (P.w == 0u) { if (o >= P.y) { yout[o] = 0.0; return; } let base = P.x * ${NN}u * ${NN}u + o * ${NN}u;
    for (var i = 0u; i < ${NN}u; i++) { let w = f32(hh(base + i) ^ P.z) * 2.3283064e-10 * 2.0 - 1.0; s += w * xin[i]; } yout[o] = tanh(s * 0.0245 + addv[o]); }
  else { let base = P.x * ${NN}u * ${NN}u + o; for (var r = 0u; r < P.y; r++) { let w = f32(hh(base + r * ${NN}u) ^ P.z) * 2.3283064e-10 * 2.0 - 1.0; s += w * xin[r]; } yout[o] = s; } }`;
  const pipe = dev.createComputePipeline({ layout: "auto", compute: { module: dev.createShaderModule({ code }), entryPoint: "main" } });
  const mk = (): unknown => dev.createBuffer({ size: NN * 4, usage: 0x80 | 0x8 | 0x4 }); const bin = mk(), bout = mk(), badd = mk();
  const ub = dev.createBuffer({ size: 16, usage: 0x40 | 0x8 }); const rb = dev.createBuffer({ size: NN * 4, usage: 0x1 | 0x8 });
  const bg = dev.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: bin } }, { binding: 1, resource: { buffer: bout } }, { binding: 2, resource: { buffer: ub } }, { binding: 3, resource: { buffer: badd } }] });
  const call = async (l: number, x: Float32Array, rows: number, add: Float32Array | null, mode: number): Promise<Float32Array> => {
    dev.queue.writeBuffer(bin, 0, x); if (add) dev.queue.writeBuffer(badd, 0, add); dev.queue.writeBuffer(ub, 0, new Uint32Array([l, rows, 0x9e3779b9, mode]));
    const enc = dev.createCommandEncoder(); const p = enc.beginComputePass(); p.setPipeline(pipe); p.setBindGroup(0, bg); p.dispatchWorkgroups(Math.ceil(NN / 64)); p.end();
    enc.copyBufferToBuffer(bout, 0, rb, 0, NN * 4); dev.queue.submit([enc.finish()]); await rb.mapAsync(1); const out = new Float32Array(rb.getMappedRange().slice(0)); rb.unmap(); return out; };
  return { kind: "WebGPU compute", info: ad.info ? String(ad.info.vendor || "") + " " + String(ad.info.architecture || "") : "", fwd: (l, x, rows, add) => call(l, x, rows, add, 0), bwd: (l, g, rows) => call(l, g, rows, null, 1) };
}
function makeWebGL2Engine(): Engine | null { const c = document.createElement("canvas"); c.width = NN; c.height = 1; const gl = c.getContext("webgl2"); if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;
  const vs = `#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
  const fs = `#version 300 es\nprecision highp float; precision highp int; uniform highp sampler2D X; uniform highp sampler2D A; uniform uint L; uniform int rows; uniform int mode; out vec4 o; ${HASH_GLSL}
void main(){ int oi = int(gl_FragCoord.x); float s = 0.;
  if (mode == 0) { if (oi >= rows) { o = vec4(0.); return; } uint base = L*${NN}u*${NN}u + uint(oi)*${NN}u;
    for (int i = 0; i < ${NN}; i++) { float w = float(hh(base + uint(i)) ^ 0x9e3779b9u) * 2.3283064e-10 * 2.0 - 1.0; s += w * texelFetch(X, ivec2(i,0), 0).r; } o = vec4(tanh(s*0.0245 + texelFetch(A, ivec2(oi,0), 0).r),0.,0.,1.); }
  else { uint base = L*${NN}u*${NN}u + uint(oi); for (int r = 0; r < ${NN}; r++) { if (r >= rows) break; float w = float(hh(base + uint(r)*${NN}u) ^ 0x9e3779b9u) * 2.3283064e-10 * 2.0 - 1.0; s += w * texelFetch(X, ivec2(r,0), 0).r; } o = vec4(s,0.,0.,1.); } }`;
  const prog = linkProg(gl, vs, fs); if (!prog) return null; quad(gl, prog);
  const mkT = (): WebGLTexture => { const t = gl.createTexture() as WebGLTexture; gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, NN, 1, 0, gl.RGBA, gl.FLOAT, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); return t; };
  const tx = mkT(), ta = mkT(), to = mkT(); const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, to, 0);
  const up = new Float32Array(NN * 4); const rd = new Float32Array(NN * 4);
  const upl = (t: WebGLTexture, v: Float32Array): void => { for (let i = 0; i < NN; i++) up[i * 4] = v[i]; gl.bindTexture(gl.TEXTURE_2D, t); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NN, 1, gl.RGBA, gl.FLOAT, up); };
  const call = async (l: number, x: Float32Array, rows: number, add: Float32Array | null, mode: number): Promise<Float32Array> => {
    upl(tx, x); if (add) upl(ta, add); gl.useProgram(prog); gl.viewport(0, 0, NN, 1); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tx); gl.uniform1i(gl.getUniformLocation(prog, "X"), 0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, ta); gl.uniform1i(gl.getUniformLocation(prog, "A"), 1); gl.activeTexture(gl.TEXTURE0);
    gl.uniform1ui(gl.getUniformLocation(prog, "L"), l); gl.uniform1i(gl.getUniformLocation(prog, "rows"), rows); gl.uniform1i(gl.getUniformLocation(prog, "mode"), mode); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.readPixels(0, 0, NN, 1, gl.RGBA, gl.FLOAT, rd); const out = new Float32Array(NN); for (let i = 0; i < NN; i++) out[i] = rd[i * 4]; return out; };
  return { kind: "WebGL2 fragment-shader fallback", info: String(gl.getParameter(gl.RENDERER)), fwd: (l, x, rows, add) => call(l, x, rows, add, 0), bwd: (l, g, rows) => call(l, g, rows, null, 1) }; }
// --- LoRA adapters into all 4 body layers: W_l + A_l·B_l, rank 16. Exact backprop through the procedural weights via the transpose kernel ---
const RK = 16;
class Lora { A: Float32Array[]; B: Float32Array[]; constructor() { this.A = Array.from({ length: NL }, () => new Float32Array(NN * RK)); this.B = Array.from({ length: NL }, () => { const b = new Float32Array(RK * NN); for (let i = 0; i < b.length; i++) b[i] = ((osU32() / 4294967296) * 2 - 1) * 0.02; return b; }); }
  count(): number { return NL * 2 * NN * RK; }
  z(l: number, h: Float32Array): Float32Array { const z = new Float32Array(RK), B = this.B[l]; for (let k = 0; k < RK; k++) { let s = 0; const off = k * NN; for (let i = 0; i < NN; i++) s += B[off + i] * h[i]; z[k] = s; } return z; }
  add(l: number, z: Float32Array, rows: number): Float32Array { const a = new Float32Array(NN), A = this.A[l]; for (let o = 0; o < rows; o++) { let s = 0; const off = o * RK; for (let k = 0; k < RK; k++) s += A[off + k] * z[k]; a[o] = s; } return a; } }
function linkProg(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram | null { const mk = (t: number, s: string): WebGLShader | null => { const sh = gl.createShader(t); if (!sh) return null; gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; } return sh; };
  const a = mk(gl.VERTEX_SHADER, vs), b = mk(gl.FRAGMENT_SHADER, fs); if (!a || !b) return null; const p = gl.createProgram(); if (!p) return null; gl.attachShader(p, a); gl.attachShader(p, b); gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; } return p; }
function quad(gl: WebGL2RenderingContext, _p: WebGLProgram): void { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); }

// --- HDR renderer: raymarched SDF body, iridescent thin-film + subsurface skin, bloom, ACES, chromatic aberration ---
const VS = `#version 300 es\nin vec2 p; out vec2 uv; void main(){ uv = p*.5+.5; gl_Position = vec4(p,0.,1.); }`;
const SCENE_FS = `#version 300 es
precision highp float; precision highp int; in vec2 uv; out vec4 o; uniform vec2 R; uniform float T; uniform vec3 Lp[48]; uniform vec4 N; uniform vec4 N2; uniform vec4 Q; uniform vec2 M; uniform float calm; uniform vec4 W4;
uniform highp sampler2D ACT; uniform uint RG[16]; uniform vec4 QP; uniform float EN; uniform float WS; uniform vec4 CUT; uniform float SIG;
// Body plan: short asymmetric hollow shell (cutaway) with spines, membrane fin, red eye cluster and limbs outside;
// inside: 4 nested activation shells (real 100M-net activations), a second brain lobe, RV32I register die, 2-qubit core, energy organ, signal fibers.
float smin(float a,float b,float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
float cap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float capH(vec3 p, vec3 a, vec3 b){ vec3 pa=p-a, ba=b-a; return clamp(dot(pa,ba)/dot(ba,ba),0.,1.); }
float box(vec3 p, vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.); }
vec3 rot4(vec3 p){ vec4 q=vec4(p, W4.x); float c=cos(W4.y), s=sin(W4.y); q.xw=mat2(c,-s,s,c)*q.xw; c=cos(W4.z); s=sin(W4.z); q.yw=mat2(c,-s,s,c)*q.yw; return q.xyz/(1.6-q.w*.35); }
const vec3 C0=vec3(0.,.02,0.), C2=vec3(.2,.13,-.07), CPU=vec3(-.15,-.13,.04), QA=vec3(.05,-.17,.12), QB=vec3(.12,-.15,.07), ORG=vec3(-.13,.1,-.13);
float body(vec3 p){ vec3 bp=rot4(p)*1.6; float n=sin(bp.x*9.+T*.5*(1.-calm*.6))*sin(bp.y*7.-T*.4)*sin(bp.z*8.+T*.3);
  float d=length(p*vec3(1.,1.12,.95))-(.36+.03*N.x); d=smin(d, length(p-vec3(.21,.12,-.07))-.22, .1); d=smin(d, length(p-vec3(-.17,-.11,.1))-.19, .1); d=smin(d, length(p-vec3(.02,-.2,-.12))-.15, .08);
  return d + n*(.018+.025*N.y); }
float shellD(vec3 p){ float d=abs(body(p))-.018; float cut=dot(p,CUT.xyz)-CUT.w; return max(d, cut); }
vec2 opU(vec2 a, vec2 b){ return a.x<b.x?a:b; }
vec2 outer(vec3 p){ vec2 r=vec2(shellD(p),0.);
  // limbs: 5 of the 8 simulated chains, shortened and of unequal thickness
  float dl=1e9; for(int l=0;l<8;l++){ if(l==2||l==5||l==7) continue; float th=.03+.012*float(l%3); for(int s=0;s<5;s++){ int k=l*6+s; vec3 a=Lp[k]*.62, b=Lp[k+1]*.62; dl=smin(dl, cap(p,a,b, th*(1.-float(s)/6.)+.006), .05); } } r=opU(r, vec2(dl,1.));
  // dorsal spines, unequal
  float ds=1e9; for(int i=0;i<7;i++){ float a=-.9+float(i)*.32; vec3 b=vec3(sin(a)*.3, .26+.04*sin(float(i)*2.1), cos(a)*.18-.05); vec3 tip=b+normalize(b-vec3(0.,-.1,0.))*(.12+.1*fract(sin(float(i)*12.9)*437.))+vec3(0.,.02*sin(T*.6+float(i)),0.); ds=min(ds, cap(p,b,tip,.012*(1.+float(i%2)))); } r=opU(r, vec2(ds,1.));
  // membrane fin between two limbs (thin, perforated)
  vec3 q=p-vec3(-.34,.02,-.05); float dm=max(abs(q.z+.15*q.x*q.x)-.004, length(q.xy)-.2); dm=max(dm, -(length(fract(q.xy*16.)-.5)-.18)); r=opU(r, vec2(dm,3.));
  // eye cluster: 7 red eyes of different sizes on the right-front
  float de=1e9; for(int e=0;e<7;e++){ float a=float(e)*2.4; vec3 c=vec3(.26+.05*cos(a), .05+.07*sin(a), .26+.03*cos(a*1.7)); de=min(de, length(p-c)-(.02+.012*fract(float(e)*.37))); } r=opU(r, vec2(de,2.));
  return r; }
vec2 inner(vec3 p){ vec3 q=p-C0; float rr=length(q); vec2 r=vec2(1e9,0.);
  for(int l=0;l<4;l++){ float R0=.07+.032*float(l); float d=abs(rr-R0)-.004; vec3 g=abs(fract(q*28.)-.5); d=max(d, -(min(g.x,min(g.y,g.z))-.12)); r=opU(r, vec2(d,10.+float(l))); }
  r=opU(r, vec2(length(p-C2)-.06+.006*sin(p.x*70.)*sin(p.y*60.), 20.));
  r=opU(r, vec2(box(p-CPU, vec3(.07,.012,.045)), 21.));
  r=opU(r, vec2(min(length(p-QA), length(p-QB))-.026, 22.));
  r=opU(r, vec2(length((p-ORG)*vec3(1.,1.3,1.))-(.05+.012*EN*sin(T*1.6)), 23.));
  float df=1e9; df=min(df, cap(p,C0,C2,.006)); df=min(df, cap(p,C0,CPU,.006)); df=min(df, cap(p,C0,(QA+QB)*.5,.006)); df=min(df, cap(p,C0,ORG,.006)); df=min(df, cap(p,C0,vec3(.26,.05,.26),.005)); r=opU(r, vec2(df,24.));
  return r; }
vec2 map(vec3 p){ return opU(outer(p), inner(p)); }
vec3 nrm(vec3 p){ vec2 e=vec2(.0012,0); return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x, map(p+e.yxy).x-map(p-e.yxy).x, map(p+e.yyx).x-map(p-e.yyx).x)); }
vec3 film(float c, float th){ vec3 l=vec3(650.,530.,440.); return .5+.5*cos(6.2832*(2.*1.33*th*c)/l); }
vec3 hue(float h){ return .5+.5*cos(6.2832*(h+vec3(0.,.33,.67))); }
float act(int l, vec3 q){ float u=atan(q.z,q.x)/6.2832+.5, v=acos(clamp(q.y/max(length(q),1e-4),-1.,1.))/3.1416; return texelFetch(ACT, ivec2(clamp(int(u*100.),0,99), l*50+clamp(int(v*50.),0,49)), 0).r; }
vec3 shade(vec3 p, vec3 rd, float id, out float alpha){ vec3 n=nrm(p), v=-rd, L=normalize(vec3(.5,.8,.4)); float c=max(dot(n,v),0.), dif=max(dot(n,L),0.), fr=pow(1.-c,3.); float spec=pow(max(dot(reflect(-L,n),v),0.),60.); alpha=1.;
  if(id<.5){ // hollow shell: moss base, iridescent thin film, neon glitch bands, fresnel transparency
    vec3 moss=vec3(.05,.16,.04); vec3 ir=film(c, 260.+240.*N.w); float band=step(.86, fract(p.y*14.+floor(T*.5)*.37))*(1.-calm);
    alpha=mix(.06,.5,fr); return moss*(.15+.6*dif)+ir*fr*.55+hue(p.y*2.+T*.03)*band*.5+spec*vec3(.9)+vec3(1.,.15,.1)*N2.x*.6; }
  if(id<1.5){ float tip=smoothstep(.35,.0,length(p)-.42); vec3 base=mix(vec3(.003,.003,.004),vec3(.05,.16,.04),smoothstep(.2,.5,length(p))); return base*(.25+dif)+film(c,300.+200.*sin(p.y*9.))*fr*.7+hue(length(p)*3.+T*.02)*(1.-tip)*.35*(1.-calm*.5)+spec*vec3(.6); }
  if(id<2.5){ vec3 look=normalize(vec3(M*.6,1.)); float pupil=smoothstep(.85,.97,dot(n,look)); return mix(vec3(1.6,.05,.03)*(1.+Q.x), vec3(0.), pupil)+vec3(2.)*spec; }
  if(id<3.5){ alpha=.55; return film(c,200.+300.*N.z)*.9+vec3(.9,.35,.05)*.2; }
  if(id<14.){ int l=int(id-10.+.5); float a=act(l, p-C0); return hue(.6+a*.35+float(l)*.08)*(.15+1.6*abs(a))*(1.-.4*calm); }
  if(id<20.5) return vec3(.5,.2,.6)*(.2+dif)+vec3(.9,.3,1.)*.5*abs(N.z)*(.5+.5*sin(p.x*80.+p.y*70.));
  if(id<21.5){ vec2 cell=(p.xz-CPU.xz)/vec2(.14,.09)+.5; int ci=clamp(int(cell.x*8.),0,7)+8*clamp(int(cell.y*2.),0,1); uint w=RG[ci]; int bit=clamp(int(fract(cell.x*8.)*4.)+4*int(fract(cell.y*2.)*2.),0,7);
    float on=float((w>>uint(bit*4+int(fract(cell.y*8.)*1.)))&1u); return n.y>.5 ? mix(vec3(.02,.03,.02), vec3(.1,1.4,.3), on) : vec3(.03)*(.3+dif); }
  if(id<22.5){ vec3 b=normalize(vec3(QP.y-QP.z, QP.x-QP.w, QP.y+QP.z-.5)); float ax=pow(max(dot(n,b),0.),20.); return vec3(.2,.5,1.4)*(.3+dif)+vec3(1.4,1.2,.3)*ax*2.; }
  if(id<23.5) return vec3(.15,.8,.12)*(.2+1.2*EN)+vec3(1.,.4,.05)*fr;
  float s=.5+.5*sin(length(p-C0)*60.-T*SIG); return vec3(1.,.45,.05)*(.1+1.6*s*s); }
void main(){ vec2 q=(uv*R*2.-R)/R.y; float yaw=M.x*.7+T*.05*(1.-calm*.7), pit=M.y*.4; vec3 ro=vec3(sin(yaw)*1.55, pit+.1, cos(yaw)*1.55); vec3 f=normalize(-ro), r=normalize(cross(vec3(0,1,0),f)), u=cross(f,r);
  vec3 rd=normalize(f*1.6+r*q.x+u*q.y);
  vec3 bg=vec3(.004,.002,.006)+.012*vec3(.05,.2,.05)*(1.-length(q)*.5);
  // orange spores drifting in the dark
  vec2 sg=q*9.+vec2(0.,T*.05); vec2 cid=floor(sg); float hsh=fract(sin(dot(cid,vec2(12.9,78.2)))*43758.5); if(hsh>.86){ vec2 c=fract(sg)-.5-.3*vec2(sin(hsh*40.),cos(hsh*30.)); bg+=vec3(1.2,.4,.04)*smoothstep(.06,0.,length(c))*(.4+.6*hsh); }
  vec3 acc=vec3(0.); float tr=1.; float t=0.; int layers=0;
  for(int i=0;i<110;i++){ vec3 p=ro+rd*t; vec2 h=map(p); if(t>4.) break;
    if(h.x<.0012){ float a; vec3 c=shade(p,rd,h.y,a); acc+=tr*a*c; tr*=1.-a; layers++; if(tr<.03||layers>4) break; t+=.03; continue; }
    t+=max(h.x*.8,.002); }
  vec3 col=acc+tr*bg; o=vec4(col,1.); }`;
const BRIGHT_FS = `#version 300 es\nprecision highp float; in vec2 uv; out vec4 o; uniform sampler2D S; void main(){ vec3 c=texture(S,uv).rgb; o=vec4(max(c-vec3(.9),0.),1.); }`;
const BLUR_FS = `#version 300 es\nprecision highp float; in vec2 uv; out vec4 o; uniform sampler2D S; uniform vec2 D; void main(){ vec3 c=texture(S,uv).rgb*.227; float w[4]=float[](.194,.121,.054,.016); for(int i=1;i<5;i++){ c+=(texture(S,uv+D*float(i)).rgb+texture(S,uv-D*float(i)).rgb)*w[i-1]; } o=vec4(c,1.); }`;
const COMP_FS = `#version 300 es\nprecision highp float; in vec2 uv; out vec4 o; uniform sampler2D S; uniform sampler2D B; uniform float ca; uniform float bloom; uniform float expo;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
void main(){ vec2 d=(uv-.5)*ca; vec3 c=vec3(texture(S,uv+d).r, texture(S,uv).g, texture(S,uv-d).b); c+=texture(B,uv).rgb*bloom; c=aces(c*expo); c=pow(c,vec3(1./2.2)); float vg=1.-.35*dot(uv-.5,uv-.5)*2.; o=vec4(c*vg,1.); }`;
type RT = { fb: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number };
function mkRT(gl: WebGL2RenderingContext, w: number, h: number): RT { const tex = gl.createTexture() as WebGLTexture; gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const fb = gl.createFramebuffer() as WebGLFramebuffer; gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); return { fb, tex, w, h }; }

type Hud = { arousal?: number; light?: number; gens?: number; head?: string; loraSteps: number; loraLoss: number; backend: string; gpu: string; inferParams: number; rowsActive: number; learned: number; fps: number; passHz: number; bw: number; bh: number; scale: number; loss: number[]; energy: number; integrity: number; conf: number; ws: string; att: number; probs: number[]; S: number; regs: number[]; pc: number; steps: number; saved: string; mood: string };
const MODS = ["gaze", "sound", "hunger", "novelty"];
const MOODS = ["|00> drift", "|01> hunt", "|10> recoil", "|11> elsewhere"];
const fmt = (n: number): string => n.toLocaleString("en-US");

export default function Creature() {
  const theme = useGrokTheme();
  const cv = useRef<HTMLCanvasElement>(null);
  const LTQ = new URLSearchParams(typeof location !== "undefined" ? location.search : ""); const LIVE = LTQ.get("livetest") === "1"; const [started, setStarted] = useState(LIVE); const [calm, setCalm] = useState(false); const [muted, setMuted] = useState(false);
  const [hud, setHud] = useState<Hud | null>(null); const [glErr, setGlErr] = useState("");
  const [evalItems, setEvalItems] = useState<Item[]>([]); const [evalRun, setEvalRun] = useState(""); const [showJson, setShowJson] = useState(false); const [jsonUrl, setJsonUrl] = useState("");
  const ctl = useRef({ calm: false, muted: false, power: [0, 0, 0, 0] as number[], sound: false, damage: 0 });
  ctl.current.calm = calm; ctl.current.muted = muted;
  const audio = useRef<{ master: GainNode } | null>(null);
  const hudRef = useRef<Hud | null>(null); const orgRef = useRef<Organism | null>(null); const [orgReady, setOrgReady] = useState(false); const [speed, setSpeedS] = useState(2); const speedRef = useRef(2);
  useEffect(() => { if (audio.current) audio.current.master.gain.value = muted ? 0 : 0.12; }, [muted]);

  useEffect(() => {
    if (!started) return; const canvas = cv.current; if (!canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false }); if (!gl || !gl.getExtension("EXT_color_buffer_float")) { setGlErr("WebGL2 with float render targets is not available in this browser, so the body cannot render."); return; }
    const progs = { scene: linkProg(gl, VS, SCENE_FS), bright: linkProg(gl, VS, BRIGHT_FS), blur: linkProg(gl, VS, BLUR_FS), comp: linkProg(gl, VS, COMP_FS) };
    if (!progs.scene || !progs.bright || !progs.blur || !progs.comp) { setGlErr("A shader failed to compile on this GPU."); return; }
    quad(gl, progs.scene);
    const actTex = gl.createTexture() as WebGLTexture; gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, actTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 100, 200, 0, gl.RED, gl.FLOAT, new Float32Array(20000)); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.activeTexture(gl.TEXTURE0); let actShown: Float32Array[] = [];
    let alive = true; let engine: Engine | null = null; let busy = false; let passes = 0, passT = performance.now(), passHz = 0; let rows = NN;
    void (async () => { try { engine = await makeWebGPU(); } catch { engine = null; } if (!engine) engine = makeWebGL2Engine(); })();
    // learned readout 5000 -> 8 (trained by the autodiff tape), persisted
    const Wr = new Tn(NN * NOUT), br = new Tn(NOUT); for (let i = 0; i < Wr.v.length; i++) Wr.v[i] = ((osU32() / 4294967296) * 2 - 1) * 0.02; let saved = "new life";
    try { const s = localStorage.getItem("creature1.v2.readout"); if (s) { const b = atob(s); const f = new Float32Array(new Uint8Array(Array.from(b, (c) => c.charCodeAt(0))).buffer); if (f.length === Wr.v.length + NOUT) { Wr.v.set(f.subarray(0, Wr.v.length)); br.v.set(f.subarray(Wr.v.length)); saved = "resumed learned readout from a previous visit"; } } } catch { saved = "storage unavailable; this session only"; }
    const save = (): void => { try { const f = new Float32Array(Wr.v.length + NOUT); f.set(Wr.v); f.set(br.v, Wr.v.length); const u = new Uint8Array(f.buffer); let s = ""; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...Array.from(u.subarray(i, i + 8192))); localStorage.setItem("creature1.v2.readout", btoa(s)); saved = "learned readout saved " + new Date().toLocaleTimeString(); } catch { /* sandbox */ } };
    let feat: Float32Array = new Float32Array(NN); let out: Float32Array = new Float32Array(NOUT); let lastPredT: Tn | null = null; const lossH: number[] = []; const lora = new Lora(); let layerActs: Float32Array[] = []; let loraLoss = 0, loraSteps = 0; let passMs = 0; let lastTarget: number[] = [0, 0, 0, 0];
    const proj = Array.from({ length: NN }, (_, i) => [i % 24, ((Math.imul(i + 1, 2654435761) >>> 0) % 2) ? 1 : -1]);
    // body, metabolism, workspace, attention schema, metacognition
    const limbs = Array.from({ length: 8 }, (_, l) => ({ a: (l / 8) * 6.283, x: new Float64Array(18), p: new Float64Array(18) }));
    for (const L of limbs) for (let s = 0; s < 6; s++) { L.x[s * 3] = Math.cos(L.a) * 0.4 * (1 + s * 0.2); L.x[s * 3 + 1] = -0.2; L.x[s * 3 + 2] = Math.sin(L.a) * 0.4 * (1 + s * 0.2); }
    let energy = 0.8, integrity = 1, conf = 0.5, t = 0; const att = { ea: 0, ed: 0, P: 1 }; let wsIdx = 0; let curiosity = 0;
    const qs = new QSim(); let S = chsh(160); let collapsed = -1, collapseT = 0; let mood = 0;
    const rv = new RV(); rv.x[10] = osU32() | 1;
    const ABL = (LTQ.get("ablate") || "").split(",").filter(Boolean); const organs = new Organs(Number(LTQ.get("seed")) || (osU32() % 100000), ABL); (window as any).__organs = organs; const org = new Organism({ seed: Number(LTQ.get("seed")) || (osU32() % 100000), entropy: "crypto" }); orgRef.current = org; (window as any).__org = org; setOrgReady(true); let ov = org.view(); let frame = 0, startle = 0, arousal = 0.5, light = 0; const LR: { R: number; ar: number; th: number }[] = []; const FR = Number(LTQ.get("frames")) || 480;
    const m = { x: 0, y: 0, vx: 0, vy: 0, in: false, click: 0 };
    const onMove = (e: PointerEvent): void => { const r = canvas.getBoundingClientRect(); const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -(((e.clientY - r.top) / r.height) * 2 - 1); m.vx = nx - m.x; m.vy = ny - m.y; m.x = nx; m.y = ny; m.in = true; };
    const onLeave = (): void => { m.in = false; }; const onDown = (): void => { m.click = 1; startle = Math.max(startle, organs.poke((m.x > 0 ? "R" : "L") + (m.y > 0 ? "U" : "D"))); /* habituation organ */ };
    canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerleave", onLeave); canvas.addEventListener("pointerdown", onDown);
    let A: { ac: AudioContext; master: GainNode; shep: { o: OscillatorNode; g: GainNode }[]; bl: OscillatorNode; br: OscillatorNode; voice: OscillatorNode; f1: BiquadFilterNode; pan: PannerNode; an: AnalyserNode | null } | null = null;
    if (ctl.current.sound) { try { const ac = new AudioContext(); const master = ac.createGain(); master.gain.value = ctl.current.muted ? 0 : 0.12; const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
      const shep = Array.from({ length: 8 }, () => { const o = ac.createOscillator(); const g = ac.createGain(); g.gain.value = 0; o.connect(g); g.connect(master); o.start(); return { o, g }; });
      const mg = ac.createChannelMerger(2); const bl = ac.createOscillator(), brr = ac.createOscillator(); const bg = ac.createGain(); bg.gain.value = 0.2; bl.frequency.value = 110; brr.frequency.value = 116; bl.connect(mg, 0, 0); brr.connect(mg, 0, 1); mg.connect(bg); bg.connect(master); bl.start(); brr.start();
      const voice = ac.createOscillator(); voice.type = "sawtooth"; const f1 = ac.createBiquadFilter(); f1.type = "bandpass"; f1.Q.value = 10; const vg = ac.createGain(); vg.gain.value = 0.25; const pan = ac.createPanner(); pan.panningModel = "HRTF"; pan.positionZ.value = -1.5; voice.connect(f1); f1.connect(vg); vg.connect(pan); pan.connect(master); voice.start();
      A = { ac, master, shep, bl, br: brr, voice, f1, pan, an: null }; audio.current = { master }; } catch { A = null; } }
    (window as unknown as { __c1mic?: () => void }).__c1mic = () => { if (!A) return; const a = A; void navigator.mediaDevices.getUserMedia({ audio: true }).then((st) => { const an = a.ac.createAnalyser(); an.fftSize = 512; a.ac.createMediaStreamSource(st).connect(an); a.an = an; }).catch(() => undefined); };
    // render targets with adaptive resolution (backbuffer capped at 3840 px wide)
    let scale = Math.min(2, devicePixelRatio || 1); let rts: RT[] = []; let bw = 0, bh = 0; const fpsH: number[] = [];
    const resize = (): void => { const cw = canvas.clientWidth, ch = canvas.clientHeight; const s = Math.min(scale, 3840 / Math.max(1, cw)); bw = Math.max(64, Math.floor(cw * s)); bh = Math.max(64, Math.floor(ch * s)); canvas.width = bw; canvas.height = bh;
      rts = [mkRT(gl, bw, bh), mkRT(gl, bw >> 2, bh >> 2), mkRT(gl, bw >> 2, bh >> 2)]; };
    resize(); const ro = new ResizeObserver(resize); ro.observe(canvas);
    const U = (p: WebGLProgram, n: string): WebGLUniformLocation | null => gl.getUniformLocation(p, n);
    const lpArr = new Float32Array(48 * 3);
    let raf = 0, prev = performance.now(), lastHud = 0, lastSave = performance.now(), lastAdapt = performance.now();
    const loop = (now: number): void => { if (!alive) return; raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (now - prev) / 1000); fpsH.push((now - prev) / 1000); prev = now; /* raw frame time: v2 pushed the clamped dt, which overstated fps */ if (fpsH.length > 60) fpsH.shift(); const C = ctl.current; const ck = C.calm ? 0.4 : 1; t += dt * ck;
      const fps = fpsH.length / fpsH.reduce((a, b) => a + b, 0);
      if (now - lastAdapt > 1500 && fpsH.length > 30) { lastAdapt = now; const ns = fps < 40 ? Math.max(0.5, scale * 0.8) : fps > 57 ? Math.min(Math.min(4, (devicePixelRatio || 1) * 2), scale * 1.15) : scale; if (Math.abs(ns - scale) > 0.02) { scale = ns; resize(); } }
      let mic = 0; if (A && A.an) { const b = new Uint8Array(A.an.fftSize); A.an.getByteTimeDomainData(b); let s = 0; for (const v of b) s += (v - 128) ** 2; mic = Math.min(1, Math.sqrt(s / b.length) / 30); }
      const gx = m.in ? m.x : Math.sin(t * 0.21) * 0.6, gy = m.in ? m.y : Math.cos(t * 0.13) * 0.4;
      // RV32I core: 8 loop iterations per frame
      rv.mem.setInt32(256, Math.floor(1 + 600 * Math.hypot(m.vx, m.vy)), true); for (let i = 0; i < PROGRAM.length * 8; i++) rv.step(); const phase = rv.mem.getInt32(260, true) * 0.002, mut = rv.mem.getUint32(264, true);
      frame++; light = (frame % 24) < 12 ? 1 : 0; organs.circ(light); /* legacy v2.3 oscillator kept for the lineage chain; arousal/light now come from the organism */ for (let k = 0; k < speedRef.current; k++) org.step(); ov = org.view(); light = ov.light; arousal = Math.max(0, Math.min(1, ov.NE / 0.6)); organs.recover(); startle *= 0.8; if (frame % 30 === 0) organs.mutate(mut); /* live organs: circadian, habituation, lineage */
      // attention schema (Kalman model of where its own attention is; noisy observation = gaze)
      { const obs = gx + (((mut >>> 8) & 255) / 255 - 0.5) * 0.3; const Kg = att.P / (att.P + 0.3); att.ea += Kg * (obs - att.ea) + att.ed; att.ed = 0.95 * att.ed + 0.05 * Kg * (obs - att.ea); att.P = (1 - Kg) * att.P + 0.02; }
      // workspace: 4 modules compete by salience, winner broadcast
      const salience = [Math.hypot(m.vx, m.vy) * 40 + (m.in ? 0.3 : 0), mic * 2, Math.max(0, 0.6 - energy) * 3, curiosity * 8];
      wsIdx = salience.indexOf(Math.max(...salience));
      const senses = [gx, gy, m.vx * 20, m.vy * 20, m.click, mic, energy * 2 - 1, integrity * 2 - 1, conf, curiosity * 4, ...qs.probs(), Math.sin(phase), Math.cos(phase), wsIdx / 3, att.ea, att.ed * 10, ov.DA, ov.kappa, /* organism state into the 100M net's senses (replaced two clock sinusoids) */ ((mut >>> 4) & 255) / 128 - 1, C.power[0] > 0 ? 1 : 0, C.power[1] > 0 ? 1 : 0];
      // GPU brain: asynchronous forward pass of the 100M procedural network; readout learns online
      if (engine && !busy) { busy = true; const x = new Float32Array(NN); for (let i = 0; i < NN; i++) x[i] = senses[proj[i][0]] * proj[i][1] * (1 - C.damage * ((i * 7919) % 100 < 40 ? 1 : 0));
        const eng = engine; const tgt = lastTarget.slice(); const pStart = performance.now(); void (async () => { const hs: Float32Array[] = [x]; const zs: Float32Array[] = []; const ro = (l: number): number => (l === NL - 1 ? NN : rows);
          for (let l = 0; l < NL; l++) { const z = lora.z(l, hs[l]); zs.push(z); hs.push(await eng.fwd(l, hs[l], ro(l), lora.add(l, z, ro(l)))); }
          feat = hs[NL]; layerActs = hs.slice(1);
          // LoRA training: exact gradient of the readout loss through all 4 layers (transpose kernel on the GPU for W_lᵀδ)
          let g: Float32Array = new Float32Array(NN); { const pr = new Float32Array(NOUT); for (let o = 0; o < NOUT; o++) { let s = br.v[o]; const off = o * NN; for (let i = 0; i < NN; i++) s += Wr.v[off + i] * feat[i]; pr[o] = Math.tanh(s); }
            let L = 0; for (let o = 0; o < tgt.length; o++) { const e = pr[o] - tgt[o]; L += e * e / tgt.length; const gp = 2 * e / tgt.length * (1 - pr[o] * pr[o]); const off = o * NN; for (let i = 0; i < NN; i++) g[i] += gp * Wr.v[off + i]; } loraLoss = L; }
          const lr = 0.002 * (0.3 + energy);
          for (let l = NL - 1; l >= 0; l--) { const h = hs[l + 1], R = ro(l); const d = new Float32Array(NN); for (let o = 0; o < R; o++) d[o] = g[o] * (1 - h[o] * h[o]);
            const A = lora.A[l], B = lora.B[l], z = zs[l]; const at = new Float32Array(RK); for (let o = 0; o < R; o++) { const dv = d[o]; if (!dv) continue; const off = o * RK; for (let k = 0; k < RK; k++) at[k] += A[off + k] * dv; }
            let gn: Float32Array | null = l > 0 ? await eng.bwd(l, d, R) : null; if (gn) { for (let i = 0; i < NN; i++) { let s = 0; for (let k = 0; k < RK; k++) s += B[k * NN + i] * at[k]; gn[i] = gn[i] * 0.0245 + s; } }
            const cl = (v: number): number => Math.max(-0.05, Math.min(0.05, v)); const hp = hs[l];
            for (let o = 0; o < R; o++) { const dv = d[o]; if (!dv) continue; const off = o * RK; for (let k = 0; k < RK; k++) A[off + k] -= lr * cl(dv * z[k]); }
            for (let k = 0; k < RK; k++) { const ak = at[k]; if (!ak) continue; const off = k * NN; for (let i = 0; i < NN; i++) B[off + i] -= lr * cl(ak * hp[i]); }
            if (gn) g = gn; }
          loraSteps++; passes++; const pd = performance.now() - pStart; passMs = passMs ? passMs * 0.7 + pd * 0.3 : pd; })().catch(() => { /* lost GPU */ }).finally(() => { busy = false; }); }
      if (now - passT > 1000) { passHz = passMs ? 1000 / passMs : 0; passes = 0; passT = now; /* from measured pass duration (forward + LoRA backward) */ if (passHz < 2 && rows > 1250) rows = Math.floor(rows * 0.75); else if (passHz > 20 && rows < NN) rows = Math.min(NN, Math.floor(rows * 1.25)); }
      const target = [gx, gy, energy * 2 - 1, integrity * 2 - 1]; lastTarget = target;
      if (lastPredT) { const Ls = mseTn(lastPredT, target); backwardTn(Ls); const lr = 0.0006 * (0.3 + energy) * (integrity > 0.3 ? 1 : 0.3); for (const P of [Wr, br]) { for (let k = 0; k < P.v.length; k++) P.v[k] -= lr * Math.max(-1, Math.min(1, P.g[k])); P.g.fill(0); }
        curiosity = curiosity * 0.95 + Ls.v[0] * 0.05; org.predErr = Math.max(org.predErr, Math.min(1, Ls.v[0])); /* GPU net prediction error → LC */ conf = conf * 0.95 + 0.05 * Math.exp(-Ls.v[0] * 4); lossH.push(Ls.v[0]); if (lossH.length > 120) lossH.shift(); }
      const xin = new Tn(NN); xin.v.set(feat); const pred = tanhTn(linT(xin, Wr, br, NN, NOUT)); lastPredT = pred; out = pred.v;
      // metabolism, homeostasis, damage & repair
      const activity = Math.abs(out[4]) * 0.4 + C.power.reduce((a, b) => a + (b > 0 ? 0.5 : 0), 0) + m.click;
      void activity; energy = Math.max(0, Math.min(1, 0.5 * Math.min(1, ov.atp / 2) + 0.5 * Math.min(1, ov.glc / 5))); /* energy = organism brain ATP + blood glucose */
      if (C.damage > 0) { integrity = Math.max(0, integrity - dt * 0.4); C.damage = Math.max(0, C.damage - dt * 0.05 * energy); } else integrity = Math.min(1, integrity + dt * 0.05 * energy);
      // quantum mood
      qs.reset(); qs.ry(0, (out[5] + 1) * 1.57 + curiosity * 2); qs.ry(1, (out[6] + 1) * 1.57 * energy + m.click); qs.cx(); const probs = qs.probs();
      if (collapseT > 0) collapseT -= dt; else collapsed = -1; if (m.click && collapsed < 0) { collapsed = qs.measure(osU32() / 4294967296); collapseT = 2.5; }
      { const am = probs.indexOf(Math.max(...probs)); mood = collapsed >= 0 ? collapsed : probs[am] > probs[mood] + 0.08 ? am : mood; }
      if (Math.floor(now / 30000) !== Math.floor((now - dt * 1000) / 30000)) S = chsh(160);
      // limbs: damped Hamiltonian chains, symplectic Euler, driven by network outputs and the broadcast module
      for (let l = 0; l < 8; l++) { const L = limbs[l]; const reach = (0.5 + 0.25 * out[l % NOUT] + 0.15 * Math.sin(t * 1.3 + l + phase)) * (0.4 + 0.6 * integrity) * (C.power[0] > 0 ? 1.4 : 1) * (ABL.includes("circbody") ? 1 : 0.7 + 0.6 * arousal) * (1 + 1.2 * startle);
        for (let s = 0; s < 6; s++) { const u = (s + 1) / 6; const sw = Math.sin(t * 1.7 + l * 0.8 + u * 3) * 0.3 * u + (wsIdx === 0 ? 0.3 * u : 0) * Math.sign(gx - Math.cos(L.a));
          const tx = Math.cos(L.a + sw) * (0.35 + u * reach) + gx * u * u * (mood === 1 ? 0.5 : 0.2), ty = -0.25 + Math.sin(t + l + u * 2) * 0.15 * u + gy * u * u * 0.3 - (C.power[2] > 0 ? 0.3 * u : 0), tz = Math.sin(L.a + sw) * (0.35 + u * reach);
          limbNodeStep(L.x, L.p, s * 3, [tx, ty, tz], dt, energy, ck); /* shared with V2.1-25 scale test */ }
        lpArr.set([0, 0, 0], (l * 6) * 3); for (let s = 0; s < 5; s++) lpArr.set([L.x[s * 3], L.x[s * 3 + 1], L.x[s * 3 + 2]], (l * 6 + s + 1) * 3); }
      if (LIVE) LR.push({ R: limbs.reduce((a, L) => a + Math.hypot(L.x[15], L.x[17]), 0) / 8, ar: arousal, th: organs.th });
      if (LIVE) { const poke = (fx: number, fy: number): void => { const r = canvas.getBoundingClientRect(); const o = { clientX: r.left + fx * r.width, clientY: r.top + fy * r.height }; canvas.dispatchEvent(new PointerEvent("pointermove", o)); canvas.dispatchEvent(new PointerEvent("pointerdown", o)); };
        if (frame >= 40 && frame <= 116 && (frame - 40) % 4 === 0) poke(0.75, 0.25); if (frame === 124) poke(0.25, 0.75);
        if (frame === FR) { const ta = organs.tamperAudit(100, mulberry((Number(LTQ.get("seed")) || 0) * 53 + 1)); const el = document.createElement("pre"); el.id = "livetest"; el.textContent = JSON.stringify({ R: LR.map((x) => +x.R.toFixed(5)), ar: LR.map((x) => +x.ar.toFixed(4)), th: LR.map((x) => +x.th.toFixed(4)), tamper: ta, gens: organs.G.length, head: organs.head() }); document.body.appendChild(el); } }
      for (let k = 0; k < 4; k++) C.power[k] = Math.max(0, C.power[k] - dt);
      if (A) { const ac = A.ac; const sp = (t * 0.03 * (C.power[1] > 0 ? -3 : 1) + out[7] * 0.2) % 1; const ph = sp < 0 ? sp + 1 : sp;
        A.shep.forEach((s, k) => { const f = 30 * Math.pow(2, k + ph); const lg = Math.log2(f / 300); s.o.frequency.setTargetAtTime(f, ac.currentTime, 0.05); s.g.gain.setTargetAtTime(Math.exp(-lg * lg / 2.5) * 0.05 * (0.4 + energy), ac.currentTime, 0.1); });
        A.br.frequency.setTargetAtTime(114 + 4 * out[3] + curiosity * 15, ac.currentTime, 0.3); A.voice.frequency.setTargetAtTime(70 + 40 * (out[2] + 1) + mic * 50, ac.currentTime, 0.2); A.f1.frequency.setTargetAtTime(400 + 900 * (out[1] + 1), ac.currentTime, 0.15);
        A.pan.positionX.setTargetAtTime(Math.sin(t * 0.15) * 1.2, ac.currentTime, 0.5); }
      if (now - lastSave > 20000) { save(); lastSave = now; }
      m.click = 0; m.vx *= 0.8; m.vy *= 0.8;
      // ---- render ----
      const sp = progs.scene as WebGLProgram; gl.bindFramebuffer(gl.FRAMEBUFFER, rts[0].fb); gl.viewport(0, 0, bw, bh); gl.useProgram(sp);
      gl.uniform2f(U(sp, "R"), bw, bh); gl.uniform1f(U(sp, "T"), t); gl.uniform3fv(U(sp, "Lp"), lpArr); gl.uniform4f(U(sp, "N"), out[0], out[1], out[2], out[3]); gl.uniform4f(U(sp, "N2"), integrity < 0.7 ? 1 - integrity : 0, C.calm || ov.stage > 0 ? 0 : Math.max(0, out[4]) * 0.5, Math.min(1, ov.kappa), wsIdx === 1 ? 1 : 0.2);
      gl.uniform4f(U(sp, "Q"), collapsed >= 0 ? 1 : probs[3], probs[1] + (C.power[3] > 0 ? 1 : 0), 0, 0); gl.uniform2f(U(sp, "M"), att.ea, gy); gl.uniform1f(U(sp, "calm"), C.calm ? 1 : ov.stage > 0 ? 0.7 : 0); /* asleep → calm visuals */
      gl.uniform4f(U(sp, "W4"), 0.3 * out[5], t * 0.11 * ck + (C.power[0] > 0 ? t * 0.5 : 0), t * 0.07 * ck + out[6] * 0.5, 0); if (layerActs.length === NL && layerActs !== actShown) { actShown = layerActs; const a = new Float32Array(100 * 200); for (let l = 0; l < NL; l++) a.set(layerActs[l].subarray(0, 5000), l * 5000); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, actTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 100, 200, gl.RED, gl.FLOAT, a); }
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, actTex); gl.uniform1i(U(sp, "ACT"), 2); gl.activeTexture(gl.TEXTURE0);
      gl.uniform1uiv(U(sp, "RG"), new Uint32Array(Array.from(rv.x.slice(0, 16), (v) => v >>> 0))); gl.uniform4f(U(sp, "QP"), probs[0], probs[1], probs[2], probs[3]); gl.uniform1f(U(sp, "EN"), energy); gl.uniform1f(U(sp, "WS"), wsIdx);
      { const yaw = att.ea * 0.7 + t * 0.05 * (C.calm ? 0.3 : 1) + 0.6; const nx = Math.sin(yaw), nz = Math.cos(yaw), ny = 0.25, nl = Math.hypot(nx, ny, nz); gl.uniform4f(U(sp, "CUT"), nx / nl, ny / nl, nz / nl, 0.04 + 0.08 * Math.sin(t * 0.1)); }
      gl.uniform1f(U(sp, "SIG"), (4 + 6 * Math.min(1, ov.ctx * 4)) * (C.calm ? 0.5 : 1)); /* fiber pulse ≤ 10 rad/s = 1.6 Hz at any pixel, below the 3 Hz limit */
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      const bp = progs.bright as WebGLProgram, bl = progs.blur as WebGLProgram, cp = progs.comp as WebGLProgram;
      gl.bindFramebuffer(gl.FRAMEBUFFER, rts[1].fb); gl.viewport(0, 0, rts[1].w, rts[1].h); gl.useProgram(bp); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rts[0].tex); gl.uniform1i(U(bp, "S"), 0); gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.useProgram(bl); for (const [src, dst, dx, dy] of [[1, 2, 1, 0], [2, 1, 0, 1], [1, 2, 2, 0], [2, 1, 0, 2]] as const) { gl.bindFramebuffer(gl.FRAMEBUFFER, rts[dst].fb); gl.bindTexture(gl.TEXTURE_2D, rts[src].tex); gl.uniform1i(U(bl, "S"), 0); gl.uniform2f(U(bl, "D"), dx / rts[1].w, dy / rts[1].h); gl.drawArrays(gl.TRIANGLES, 0, 6); }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, bw, bh); gl.useProgram(cp); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rts[0].tex); gl.uniform1i(U(cp, "S"), 0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, rts[1].tex); gl.uniform1i(U(cp, "B"), 1);
      gl.uniform1f(U(cp, "ca"), C.calm ? 0.002 : 0.006 + 0.02 * curiosity + (C.power[3] > 0 ? 0.012 : 0)); gl.uniform1f(U(cp, "bloom"), C.calm ? 0.5 : 1.1 + 0.6 * Math.max(0, out[3])); gl.uniform1f(U(cp, "expo"), 1.1 + 0.3 * energy); gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (now - lastHud > 250) { lastHud = now; const h: Hud = { backend: engine ? engine.kind : "starting…", gpu: engine ? engine.info : "", inferParams: (NL - 1) * rows * NN + NN * NN, rowsActive: rows, learned: NN * NOUT + NOUT + lora.count(), loraSteps, loraLoss, fps, passHz, bw, bh, scale, loss: lossH.slice(), energy, integrity, conf,
        arousal, light, gens: organs.G.length, head: organs.head(), ws: MODS[wsIdx], att: att.ea, probs, S, regs: Array.from(rv.x.slice(0, 16)), pc: rv.pc, steps: rv.steps, saved, mood: collapsed >= 0 ? "collapsed → " + MOODS[collapsed] : "superposed, leaning " + MOODS[mood] }; hudRef.current = h; setHud(h); } };
    const onKey = (e: globalThis.KeyboardEvent): void => { const k = "1234".indexOf(e.key); if (k >= 0) ctl.current.power[k] = 3; };
    window.addEventListener("keydown", onKey); raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); save(); window.removeEventListener("keydown", onKey); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerleave", onLeave); canvas.removeEventListener("pointerdown", onDown); if (A) void A.ac.close(); audio.current = null; };
  }, [started]);

  const runEval = (): void => { setEvalItems([]); const acc: Item[] = []; let i = 0; const t0 = performance.now(); const STEPS2: [string, () => Item[]][] = [...STEPS, ["Prereg v2", runV2], ["Prereg v2.1", v21Tests]];
    const next = (): void => { if (i < STEPS2.length) { setEvalRun(`running ${STEPS2[i][0]} (${i + 1}/${STEPS2.length})…`); const f = STEPS2[i][1]; setTimeout(() => { acc.push(...f()); i++; setEvalItems(acc.slice()); next(); }, 10); return; }
      const ci = acc.findIndex((x) => x.id === "ctm"); acc.splice(ci + 1, 0, butlinRollup(acc));
      const sc = substrateCheck(); const a1 = JSON.stringify(rpt1()), a2 = JSON.stringify(rpt1()); const h = hudRef.current;
      for (const it of acc) { if (it.id === "23") it.note = `RV32I machine code vs native JS xorshift32: ${sc.n} outputs ${sc.ok ? "identical" : "MISMATCH"}`; if (it.id === "24") it.note = `RPT-1 re-run with same seeds: ${a1 === a2 ? "bit-identical" : "DIFFERENT"}`;
        if (it.id === "25") it.note = h ? `${fmt(h.inferParams)} inference weights (${h.backend}), ${h.bw}×${h.bh} HDR backbuffer, ${h.fps.toFixed(0)} fps, ${h.passHz.toFixed(1)} brain passes/s` : "start the creature to measure"; }
      setEvalItems(acc.slice()); setEvalRun(`done in ${((performance.now() - t0) / 1000).toFixed(1)} s · 16 seeds per condition`);
      try { const blob = new Blob([JSON.stringify({ disclaimer: "Functional indicator tests on the creature's core mechanisms in seeded toy tasks. Not evidence of consciousness. No aggregate score.", criteria: "pass iff Cohen's d >= 0.8 and Welch t >= 2.75 vs every control, 16 seeds", items: acc }, null, 1)], { type: "application/json" }); setJsonUrl(URL.createObjectURL(blob)); } catch { setJsonUrl(""); } };
    next(); };

  const mono = { fontFamily: theme.font.mono, fontSize: 11, lineHeight: "15px", color: theme.text.secondary } as const;
  const panel = { border: `1px solid ${theme.border.default}`, borderRadius: 12, padding: 12, minWidth: 0 } as const;
  const h = (s: string) => <div style={{ fontSize: 12, fontWeight: 600, color: theme.text.primary, marginBottom: 6 }}>{s}</div>;
  const spark = (a: number[]) => { const mx = Math.max(1e-6, ...a); return <svg width="100%" height="36" viewBox="0 0 120 36" preserveAspectRatio="none"><polyline fill="none" stroke={theme.dataviz.categorical[0]} strokeWidth="1.5" points={a.map((v, i) => `${(i / Math.max(1, a.length - 1)) * 120},${34 - (v / mx) * 32}`).join(" ")} /></svg>; };
  const fx = (v: number): string => (Number.isFinite(v) ? (Math.abs(v) >= 1000 ? v.toExponential(1) : v.toFixed(2)) : "∞");
  const ok = theme.dataviz.categorical[2], bad = theme.dataviz.categorical[1];
  const row = (it: Item) => <div key={it.id + it.group} style={{ borderTop: `1px solid ${theme.border.default}`, padding: "6px 0" }}>
    <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}><span style={{ fontFamily: theme.font.mono, fontSize: 11, fontWeight: 700, color: it.category === "Implementation identified" ? theme.text.secondary : it.pass ? ok : bad, minWidth: 40 }}>{it.category === "Implementation identified" ? "IMPL" : it.pass ? "PASS" : "FAIL"}</span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{it.id} · {it.name}</span>{it.group === "CQM-25" && <span style={{ ...mono }}>[{it.category}]</span>}</div>
    <div style={mono}>{it.metric} · {it.mechanism}{it.note ? ` · ${it.note}` : ""}</div>
    {it.cmps.map((c, k) => <div key={k} style={{ ...mono, paddingLeft: 48 }}>{c.pass ? "✓" : "✗"} vs {c.control}: full {fx(c.full)} vs {fx(c.ctrl)} · d={fx(c.d)} · t={fx(c.t)}</div>)}</div>;
  const groups: [string, string][] = [["Butlin", "(a) Butlin et al. 14 indicators"], ["Framework", "(b) 10 frameworks and their falsifiers"], ["CQM-25", "(c) CQM-25 dimensions"], ["Prereg v2", "(d) Pre-registration v2: new non-ceiling tests for active inference, CQM-10, CQM-21 (v1 results above stay as they are)"], ["Prereg v2.1", "(e) Pre-registration v2.1: substrate pluralism, reproducibility, scale (the GPU comparisons need a GPU record from measure_gpu.ts; without one they show as failed in the page)"]];
  const RN = ["zero", "ra", "sp", "gp", "tp", "t0", "t1", "t2", "s0", "s1", "a0", "a1", "a2", "a3", "a4", "a5"];
  return (
    <div style={{ color: theme.text.primary, fontFamily: theme.font.family, display: "flex", flexDirection: "column", gap: 12, padding: 8 }}>
      <div style={{ fontSize: 22, fontWeight: 600 }}>Creature #1 · v3</div>
      <div style={{ color: theme.text.secondary, fontSize: 13 }}>A promptless artificial organism. Its brain is a 4-layer, 100,000,000-weight network evaluated on the GPU every pass, with weights regenerated procedurally from a seed instead of stored. Rank-16 LoRA adapters inside all four layers plus a readout (680,008 parameters) learn online through reverse-mode autodiff. The body is a raymarched signed-distance creature rendered in HDR, and every visual and sound parameter comes from network state. The Evaluate panel runs seeded experiments against ablations and controls.</div>
      {!started ? (
        <div style={{ ...panel, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontWeight: 600 }}>Photosensitivity note: read before it wakes</div>
          <div style={{ fontSize: 13, color: theme.text.secondary }}>This contains slow color shifts, bloom glow, chromatic fringing, moving iridescent surfaces, and Shepard, binaural and spatial audio. Nothing strobes or flashes, and all brightness changes are smooth and slower than 3 Hz. Calm mode slows motion and reduces glow and fringing. Mute is always visible. If you are sensitive to moving patterns, start in calm mode or skip it. Audio works best on headphones at low volume.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Button variant="primary" label="Wake it (with sound)" onClick={() => { ctl.current.sound = true; setStarted(true); }} />
            <Button label="Wake it silently" onClick={() => { ctl.current.sound = false; setStarted(true); }} />
            <Toggle label="Start in calm mode" value={calm} onChange={setCalm} />
          </div>
        </div>) : (
        <Fragment>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Button label="1 Reach" onClick={() => { ctl.current.power[0] = 3; }} /><Button label="2 Reverse Shepard" onClick={() => { ctl.current.power[1] = 3; }} /><Button label="3 Crouch" onClick={() => { ctl.current.power[2] = 3; }} /><Button label="4 Shimmer" onClick={() => { ctl.current.power[3] = 3; }} />
            <Toggle label="Calm mode" value={calm} onChange={setCalm} /><Toggle label="Mute" value={muted} onChange={setMuted} />
            <Button label="Let it hear (mic)" onClick={() => { const f = (window as unknown as { __c1mic?: () => void }).__c1mic; if (f) f(); }} />
            <Button label="Injure it (silences 40% of brain inputs)" onClick={() => { ctl.current.damage = 1; }} />
            <Button label="Forget learned readout" onClick={() => { try { localStorage.removeItem("creature1.v2.readout"); } catch { /* none */ } }} />
          </div>
          {glErr ? <div style={{ ...panel, color: theme.text.secondary }}>{glErr}</div> : <canvas ref={cv} style={{ width: "100%", height: 600, borderRadius: 12, background: "#020104", cursor: "crosshair", touchAction: "none" }} />}
          {orgReady && orgRef.current && <Inspector org={orgRef.current} theme={theme} speed={speed} setSpeed={(n) => { speedRef.current = n; setSpeedS(n); }} />}
          {hud && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
            <div style={panel}>{h("Parameter engine (measured)")}<div style={mono}>backend: {hud.backend} {hud.gpu}<br />inference weights used per pass: {fmt(hud.inferParams)}{hud.rowsActive < NN ? ` (adaptive: ${fmt(hud.rowsActive)}/${fmt(NN)} rows in layers 1–3)` : " (all 4×5000×5000)"}<br />weights: procedural hash(seed, layer, row, col), not stored, fp32 math<br />updated by learning: {fmt(hud.learned)} = 40,008 readout + {fmt(hud.learned - 40008)} LoRA (rank 16 into all 4 layers)<br />LoRA steps {fmt(hud.loraSteps)} · loss {hud.loraLoss.toFixed(3)} · effective weights W+AB per pass also add {fmt(NL * 2 * NN * RK)} adapter MACs<br />brain passes/s: {hud.passHz.toFixed(1)} · render {hud.fps.toFixed(0)} fps<br />backbuffer {hud.bw}×{hud.bh} RGBA16F (scale {hud.scale.toFixed(2)})</div></div>
            <div style={panel}>{h("Life signs")}<div style={mono}>energy {(hud.energy * 100).toFixed(0)}% · integrity {(hud.integrity * 100).toFixed(0)}%<br />confidence (metacognitive) {hud.conf.toFixed(2)}<br />organs: arousal {(hud.arousal ?? 0).toFixed(2)} ({hud.light ? "day" : "night"}) · lineage {hud.gens ?? 0} gens, head {String(hud.head ?? "").slice(0, 10)}<br />workspace broadcast: {hud.ws} · attention schema x̂ {hud.att.toFixed(2)}<br />mood {hud.mood}<br />{hud.saved}</div>{h("Surprise loss (online autodiff)")}{spark(hud.loss)}</div>
            <div style={panel}>{h("Quantum mood (2-qubit state vector, port)")}<div style={mono}>{hud.probs.map((p, i) => <div key={i}>{MOODS[i].padEnd(14, " ")} {"█".repeat(Math.round(p * 20))} {p.toFixed(3)}</div>)}CHSH S = {hud.S.toFixed(3)} (classical ≤ 2)</div></div>
            <div style={panel}>{h(`RV32I · pc=0x${hud.pc.toString(16)} · ${fmt(hud.steps)} instr`)}<div style={{ ...mono, display: "grid", gridTemplateColumns: "repeat(2, 1fr)" }}>{hud.regs.map((r, i) => <div key={i}>x{i} {RN[i].padEnd(4, " ")} {(r >>> 0).toString(16).padStart(8, "0")}</div>)}</div></div>
          </div>}
        </Fragment>)}
      <div style={panel}>
        {h("Evaluate")}
        <div style={{ fontSize: 12, color: theme.text.secondary, marginBottom: 8 }}>These are functional indicator tests of the creature's core mechanisms, run in small seeded tasks. They are not evidence of consciousness, and no aggregate consciousness score is computed. Criteria were fixed before the first run: an item passes only if, against every control, Cohen's d ≥ 0.8 and Welch t ≥ 2.75 over 16 seeds. Failures are shown as they came out.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}><Button variant="primary" label="Run all experiments" onClick={runEval} />
          {jsonUrl && <a href={jsonUrl} download="creature1-eval.json" style={{ color: theme.text.primary, fontSize: 12 }}>Download JSON</a>}
          {evalItems.length > 0 && <Button label={showJson ? "Hide JSON" : "Show JSON"} onClick={() => setShowJson(!showJson)} />}<span style={mono}>{evalRun}</span></div>
        {groups.map(([g, title]) => { const its = evalItems.filter((x) => x.group === g); return its.length ? <div key={g} style={{ marginTop: 10 }}>{h(title + ` · ${its.filter((x) => x.pass).length} pass / ${its.filter((x) => !x.pass && x.category !== "Implementation identified").length} fail${g === "CQM-25" ? ` / ${its.filter((x) => x.category === "Implementation identified").length} implementation-only` : ""}`)}{its.map(row)}</div> : null; })}
        {showJson && <pre style={{ ...mono, whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto" }}>{JSON.stringify(evalItems, null, 1)}</pre>}
      </div>
      <div style={panel}>{h("Wiring map")}<div style={{ ...mono, whiteSpace: "pre-wrap" }}>{`Senses → 26 features: gaze, cursor velocity, click, mic level, energy, integrity, confidence, curiosity, qubit probabilities, RV32I phase, workspace winner, attention-schema state, keys. These are projected to 5000 inputs.
GPU brain: four dense tanh layers of 5000×5000 = 100,000,000 weights, w = hash(seed, layer, row, col), computed in a WebGPU compute shader (or a WebGL2 fragment shader). If the GPU is slow, layers 1–3 evaluate fewer rows, and the count shown is the true one.
Learning: 680,008 parameters. Rank-16 LoRA adapters (A·B) on all four 5000×5000 layers (640,000 params) are trained once per brain pass by exact backprop through the procedural weights (a GPU transpose kernel computes Wᵀδ). The 5000→8 tanh readout (40,008 params) is trained every frame by the reverse-mode autodiff tape to predict the next [gaze x, gaze y, energy, integrity]. The loss is surprise and drives curiosity; confidence comes from recent loss.
Outputs 0–3 → body radius, surface noise, skin hue, thin-film thickness, bloom; 4 → banding; 5–6 → qubit angles and 4D rotation; 7 → Shepard drift; 0–7 → limb reach.
Workspace: gaze, sound, hunger and novelty modules compete by salience. The winner is broadcast (gaze bends the limbs, sound lights the background).
Attention schema: a Kalman model of its own attention aims the eyes and the camera.
Metabolism: energy drains with activity and recovers toward a 0.7 setpoint. Injury silences 40% of brain inputs; integrity falls, then repairs at a rate scaled by energy.
Limbs: damped Hamiltonian chains integrated with symplectic Euler and fed to the SDF as capsules. The body SDF is 4D-rotated (xw, yw) before projection.
Body: a short, asymmetric, hollow shell (SDF shell 0.036 thick, fresnel transparency, a slowly rotating section cut) with unequal spines, a perforated membrane fin, a cluster of 7 red eyes and 5 limbs from the physics chains. Inside, all driven by live state: 4 nested shells colored by the actual activations of the 4 network layers (5000 units each, texture updated every brain pass), a second brain lobe (readout output), an RV32I die whose cells light from the live register bits, a 2-qubit core whose glowing axis follows the state-vector probabilities, an energy organ that swells with metabolism, and fibers whose pulse speed follows brain passes/s (≤1.6 Hz at any pixel). Orange spores drift in the dark.
Renderer: raymarched SDF → RGBA16F HDR → bright pass → 4× separable blur → ACES tone map + chromatic aberration + vignette. The backbuffer adapts between 0.5× and 4× DPR, capped at 3840 px wide.
RV32I: encoded machine code (xorshift32 + phase) runs 96 instructions per frame and sets limb phase.`}</div></div>
      <div style={panel}>{h("Prior-art check (quick search, Oct 2026; novel means not found, not proven)")}<div style={{ ...mono, whiteSpace: "pre-wrap" }}>{"LoRA on a seed-regenerated random backbone | Established | closest: LottaLoRA, arXiv 2604.08749\nIn-browser WebGPU LoRA backward | Established | closest: Emberglass (GitHub maceip)\nHash weights recomputed per MAC in-shader + exact transpose kernel so LoRA trains through them live (WebGPU and WebGL2) | New combination | closest: the two above\nExecutable Butlin harness with ablations | Established | closest: tlcdv/the_consciousness_ai; symthaea\nPreregistered d and t vs every control across Butlin 14 + 10 frameworks + CQM-25, no aggregate score | New combination | closest: the above\nAttention schema that inflates its own uncertainty from its surprise (NIS) | New combination | closest: adaptive-inflation EnKF (arXiv 1507.08319, 2604.17343)\nBayesian latent-cause reversal learning | Established | closest: latent-cause models (Gershman et al.)\nExpected-free-energy expectimax over beliefs | Established | closest: active-inference literature\nPlasticity-shaped thresholded binary net scored on a phi proxy and partition-sensitive behavior | New combination | closest: none found\nHollow cutaway raymarched creature showing live 100M-net activations, RV32I registers and a qubit core | Novel as far as found | closest: arogozhnikov/3d_nn; tobis.vision Critters"}</div></div>
      <div style={panel}>{h("What runs here vs what is ported")}<div style={{ ...mono, whiteSpace: "pre-wrap" }}>{`Runs here for real: the 100M-weight GPU forward pass (procedural weights; about 100M multiply-adds per pass), the online autodiff readout, the HDR raymarcher and bloom, the RV32I interpreter, the 2-qubit simulator and CHSH test, every evaluation experiment, Web Audio and localStorage.
Ported (TypeScript re-implementations, not the originals): Eshkol-style reverse-mode AD; Moonlab-style state vector and Bell-gated randomness. Neither Eshkol's WASM VM nor Moonlab's C library is executed, because a Page cannot load them.
Stand-in: crypto.getRandomValues replaces Moonlab's hardware entropy.
Not done: the 100M base weights stay fixed (procedural); 680,008 parameters learn (0.68% of the body). Adapters are session-only (not saved); the readout is saved. fp16 is used for render targets only.`}</div></div>
    </div>
  );
}
