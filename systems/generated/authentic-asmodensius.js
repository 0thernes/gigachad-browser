/* Original donor notice: brains/asmodensius-v40/LICENSE
MIT License

Copyright (c) 2026 Alex Donahue and Asmodensius contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
var GigachadAsmodensiusSource = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // systems/authentic-asmodensius-entry.ts
  var authentic_asmodensius_entry_exports = {};
  __export(authentic_asmodensius_entry_exports, {
    Creature001: () => Creature001,
    NNEU: () => NNEU,
    REGIONS: () => REGIONS
  });

  // brains/asmodensius-v40/creatures/001/organism/fp/cur.ts
  var LearningProgress = class {
    p;
    eF;
    eS;
    constructor(n) {
      this.p = new Float64Array(n).fill(0.3);
      this.eF = new Float64Array(n).fill(0.3);
      this.eS = new Float64Array(n).fill(0.3);
    }
    observe(k, r) {
      const e = Math.abs(r - this.p[k]);
      this.eF[k] += 0.3 * (e - this.eF[k]);
      this.eS[k] += 0.05 * (e - this.eS[k]);
      this.p[k] += 0.2 * (r - this.p[k]);
    }
    bonus(k) {
      return Math.max(0, this.eS[k] - this.eF[k]);
    }
  };

  // brains/asmodensius-v40/creatures/001/organism/fp/l4.ts
  var InputLayer = class {
    constructor(nIn, K, seed) {
      this.nIn = nIn;
      this.K = K;
      let a = seed >>> 0;
      const r = () => {
        a = a + 1831565813 >>> 0;
        let t = a;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
      this.W = Array.from({ length: K }, (_, k) => Array.from({ length: nIn }, (_2, i) => k < nIn ? i === k ? 1 : 0 : r() * 2 - 0.5));
      this.b = Array.from({ length: K }, (_, k) => k < nIn ? 0 : -0.3 * r());
    }
    nIn;
    K;
    W;
    b;
    /** the first nIn units are labelled-line copies (receptor -> L4 relay); the rest are random mixtures */
    out(x) {
      return this.W.map((w, k) => Math.max(0, w.reduce((a, v, i) => a + v * x[i], 0) + this.b[k]));
    }
  };

  // brains/asmodensius-v40/creatures/001/organism/fp/hot1.ts
  var ProtoPosterior = class {
    constructor(K, D) {
      this.K = K;
      this.D = D;
      this.mu = Array.from({ length: K }, () => new Array(D).fill(1 / D));
      this.pi = new Array(K).fill(1 / K);
      this.n = new Array(K).fill(0);
    }
    K;
    D;
    mu;
    pi;
    s2 = 0.25;
    n;
    post(x) {
      const lp = this.mu.map((m, k) => Math.log(this.pi[k]) - m.reduce((a, v, j) => a + (x[j] - v) ** 2, 0) / (2 * this.s2));
      const mx = Math.max(...lp);
      const w = lp.map((l) => Math.exp(l - mx));
      const z = w.reduce((a, b) => a + b, 0);
      return w.map((v) => v / z);
    }
    percept(x) {
      const p = this.post(x);
      const out = new Array(this.D).fill(0);
      for (let k = 0; k < this.K; k++) for (let j = 0; j < this.D; j++) out[j] += p[k] * this.mu[k][j];
      return out;
    }
    /** teach with the noisy observation x of class k and its clean target */
    teach(x, k, clean) {
      this.n[k]++;
      const lr = Math.max(0.05, 1 / this.n[k]);
      for (let j = 0; j < this.D; j++) this.mu[k][j] += lr * (clean[j] - this.mu[k][j]);
      const r2 = x.reduce((a, v, j) => a + (v - clean[j]) ** 2, 0) / this.D;
      this.s2 += 0.05 * (Math.max(1e-3, r2) - this.s2);
      for (let i = 0; i < this.K; i++) this.pi[i] += 0.02 * ((i === k ? 1 : 0) - this.pi[i]);
    }
  };

  // brains/asmodensius-v40/creatures/001/organism/affect.ts
  var cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  var Affect = class {
    constructor(nOpt, persona, off) {
      this.off = off;
      this.att = new Float32Array(nOpt);
      this.want = new Float32Array(nOpt);
      this.tol = new Float32Array(nOpt);
      this.lastVisit = new Float32Array(nOpt);
      this.rMean = new Float32Array(nOpt).fill(0.5);
      this.rVar = new Float32Array(nOpt).fill(0.25);
      this.persona = { ...persona };
      this.persona0 = this.off.has("personality") ? { bold: 0.5, curious: 1, reactive: 0.5, vuln: 0.3, hedge: 0.3, riskScar: 0.5 } : { ...persona };
    }
    off;
    emo = { fear: 0, delight: 0, frustration: 0, calm: 0.5 };
    mood = { val: 0, aro: 0.3, valSlow: 0, aroSlow: 0.3 };
    att;
    others = {};
    want;
    tol;
    lastVisit;
    persona;
    persona0;
    stress = 0;
    hpaLocked = false;
    sleepDebt = 0;
    inflam = 0;
    sick = false;
    nmBias = { DA: 0, S5: 0 };
    events = [];
    rMean;
    rVar;
    scarcity = 0;
    failStreak = 0;
    swingSign = 1;
    /* personality lesion = population-mean temperament (no individual differences, no drift) */
    /** seeded or inherited personality; vulnerability is heritable */
    static birth(rand, parent, mut = 0.1) {
      const g = () => {
        const u1 = Math.max(1e-12, rand()), u2 = rand();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      };
      if (parent) {
        const h = parent.hedge ?? 0.3, m = mut * (0.3 + 2.5 * h);
        return { bold: cl(parent.bold + m * g(), 0.05, 1), curious: Math.max(0.2, parent.curious * Math.exp(m * g())), reactive: cl(parent.reactive + m * g(), 0.05, 1), vuln: cl(parent.vuln + m * g(), 0, 1), hedge: cl(h + mut * g()), riskScar: cl((parent.riskScar ?? 0.5) + mut * g(), 0, 2) };
      }
      return { bold: cl(0.5 + 0.2 * g(), 0.05, 1), curious: Math.exp(0.25 * g()), reactive: cl(0.5 + 0.2 * g(), 0.05, 1), vuln: cl(0.3 + 0.2 * g(), 0, 1), hedge: cl(0.3 + 0.15 * g()), riskScar: cl(0.5 + 0.3 * g(), 0, 2) };
    }
    ev(t, type, v) {
      this.events.push({ t, type, v: +v.toFixed(3) });
      if (this.events.length > 500) this.events.shift();
    }
    /** per-tick update; returns hormone/neuromodulator/sleep feedback for the body (natural coupling, not a penalty) */
    step(x) {
      const P = this.off.has("personality") ? this.persona0 : this.persona, on = (l) => !this.off.has(l);
      const fb = { cortisol: 0, DA: 0, S5: 0, sleep: 0 };
      this.scarcity = cl(0.6 * (1 - x.atp) + 0.6 * x.ghrelin - 0.3);
      if (on("emotion")) {
        const k = 1 / 15, re = 0.5 + P.reactive;
        this.emo.fear += k * (cl(re * (1.5 * Math.max(0, x.NE - 0.35) + 0.8 * Math.max(0, x.cortisol - 0.45) + (1 - x.integrity))) - this.emo.fear);
        this.emo.calm += k * (cl(x.S5 * (1 - x.ghrelin) * 1.5) - this.emo.calm);
        this.emo.delight *= 1 - k;
        this.emo.frustration *= 1 - k * 0.7;
      } else this.emo = { fear: 0, delight: 0, frustration: 0, calm: 0.5 };
      if (on("mood")) {
        const inst = this.emo.delight + 0.5 * this.emo.calm - this.emo.fear - 0.7 * this.emo.frustration - 0.5 * (this.sick ? 1 : 0);
        const rum = 0.6 * P.vuln;
        const prev = this.mood.val;
        this.mood.val = cl(this.mood.val + (inst - this.mood.val) / 360 + rum * (this.mood.val - this.mood.valSlow) / 360, -1, 1);
        this.mood.aro += (this.emo.fear + this.emo.delight + this.emo.frustration - this.mood.aro) / 360;
        this.mood.valSlow += (this.mood.val - this.mood.valSlow) / 4320;
        this.mood.aroSlow += (this.mood.aro - this.mood.aroSlow) / 4320;
        const sg = Math.sign(this.mood.val - this.mood.valSlow);
        if (Math.abs(this.mood.val - this.mood.valSlow) > 0.35 && sg !== this.swingSign) {
          this.swingSign = sg;
          this.ev(x.t, "moodSwing", this.mood.val);
        }
        void prev;
      }
      if (on("personality") && x.t % 60 === 0) {
        const d = 2e-4;
        P.bold = cl(P.bold + d * this.mood.valSlow, 0.05, 1);
        P.reactive = cl(P.reactive + d * (this.mood.aroSlow - 0.3), 0.05, 1);
      }
      if (on("dysreg")) {
        this.stress += (this.emo.fear + Math.max(0, x.cortisol - 0.4) + 0.5 * this.inflam - this.stress) / 240;
        const hi = 0.55 - 0.25 * P.vuln, lo = hi * 0.5;
        if (!this.hpaLocked && this.stress > hi) {
          this.hpaLocked = true;
          this.ev(x.t, "hpaLockIn", this.stress);
        } else if (this.hpaLocked && this.stress < lo) {
          this.hpaLocked = false;
          this.ev(x.t, "hpaRecover", this.stress);
        }
        if (this.hpaLocked) fb.cortisol += 4e-3;
        this.sleepDebt = Math.max(0, this.sleepDebt + (x.awake ? Math.max(0, x.sleepS - 0.7) * 0.01 : -4e-3));
        if (this.sleepDebt > 1 && x.t % 720 === 0) this.ev(x.t, "sleepDebt", this.sleepDebt);
        this.emo.frustration = cl(this.emo.frustration + 2e-3 * this.sleepDebt);
        const inf = x.r() < 2e-4 * (0.5 + P.vuln) ? 0.6 : 0;
        this.inflam = cl(this.inflam + inf + 2e-3 * (this.stress + Math.max(0, 0.6 - x.atp) + (1 - x.integrity)) - this.inflam / 600);
        if (!this.sick && this.inflam > 0.4) {
          this.sick = true;
          this.ev(x.t, inf ? "infection" : "sickness", this.inflam);
        } else if (this.sick && this.inflam < 0.2) {
          this.sick = false;
          this.ev(x.t, "recovered", this.inflam);
        }
        if (this.sick) {
          fb.sleep += 6e-4;
          this.emo.delight *= 0.9;
        }
        for (const m of ["DA", "S5"]) this.nmBias[m] += -this.nmBias[m] / 1440 + 2e-3 * P.vuln * (x.r() - 0.5);
        fb.DA += this.nmBias.DA * 0.01;
        fb.S5 += this.nmBias.S5 * 0.01;
        for (let k = 0; k < this.want.length; k++) if (this.want[k] > 0.3 && x.t - this.lastVisit[k] > 480) {
          this.emo.frustration = cl(this.emo.frustration + 15e-4 * this.want[k]);
          if (x.t % 240 === 0) this.ev(x.t, "craving", this.want[k]);
        }
      }
      return fb;
    }
    /** natural outcome of an approach to option k: reward (food), pain (damage), or nothing */
    outcome(t, k, reward, pain, da, rpe = reward - 0.5) {
      const phasic = Math.abs(rpe);
      const on = (l) => !this.off.has(l);
      this.lastVisit[k] = t;
      const P = this.persona;
      {
        const d = reward - this.rMean[k];
        this.rMean[k] += 0.1 * d;
        this.rVar[k] += 0.1 * (d * d - this.rVar[k]);
      }
      if (on("emotion")) {
        if (reward > 0) {
          this.emo.delight = cl(this.emo.delight + 0.6 * reward * (0.5 + da) * (1 - this.tol[k]) * (this.sick ? 0.3 : 1));
          this.failStreak = 0;
        } else {
          this.failStreak++;
          this.emo.frustration = cl(this.emo.frustration + 0.08 * Math.min(5, this.failStreak));
        }
        if (pain > 0) this.emo.fear = cl(this.emo.fear + pain * (0.5 + P.reactive));
      }
      if (on("attitude")) this.att[k] += 0.08 * Math.min(1, 2 * phasic) * (this.emo.delight - this.emo.fear - 0.5 * this.emo.frustration - this.att[k]);
      if (on("dysreg") && reward > 0) {
        this.want[k] = cl(this.want[k] + 0.02 * (0.5 + P.vuln) * (0.5 + da) * Math.min(1, 2 * Math.max(0, rpe)));
        this.tol[k] = cl(this.tol[k] + 0.01 * P.vuln, 0, 0.8);
        if (this.want[k] > 0.6 && this.want[k] - 0.02 < 0.6) this.ev(t, "sensitised", this.want[k]);
      }
      for (let j = 0; j < this.tol.length; j++) {
        this.tol[j] *= 0.999;
        this.want[j] *= 0.9995;
      }
    }
    /** social contact with another creature (dome); valence is a natural consequence (shared food, fight damage, grooming) */
    meet(id, valence) {
      if (this.off.has("attitude")) return;
      this.others[id] = (this.others[id] ?? 0) + 0.1 * (valence - (this.others[id] ?? 0));
    }
    /** decision bias for option k: attitude + wanting (no designer penalty; both are learned from consequences) */
    bias(k) {
      return (this.off.has("attitude") ? 0 : 0.3 * this.att[k]) + (this.off.has("dysreg") ? 0 : 0.4 * this.want[k]) + (this.off.has("risk") ? 0 : 0.5 * (this.persona.riskScar ?? 0) * (this.scarcity - 0.3) * (Math.sqrt(this.rVar[k]) - 0.35));
    }
    // risk: averse when fed, seeking when starving (variance-sensitive)
    /** social stance toward another creature: >0 approach, <0 avoid */
    stance(id) {
      return this.off.has("attitude") ? 0 : this.others[id] ?? 0;
    }
    /** what contact with others feels like right now (associative: attitudes toward others are learned from how being near them felt) */
    feltValence() {
      return this.emo.delight + 0.5 * this.emo.calm - this.emo.fear - 0.5 * this.emo.frustration;
    }
    /** multiplier on the uncertainty (curiosity) term: good mood and boldness open exploration, fear and sickness close it */
    uMul() {
      const P = this.off.has("personality") ? this.persona0 : this.persona;
      return cl(P.curious * (1 + 0.6 * this.mood.val - 0.8 * this.emo.fear * (1 - P.bold)) * (this.sick ? 0.5 : 1), 0.1, 3);
    }
    /** multiplier on the forage probability: sickness lethargy, fear freezing, frustration restlessness */
    forageMul() {
      return cl((this.sick ? 0.5 : 1) * (1 - 0.4 * this.emo.fear * (1 - this.persona.bold)) * (1 + 0.3 * this.emo.frustration), 0.2, 1.6);
    }
    /** decision-noise multiplier: frustration and arousal make choices more erratic */
    noiseMul() {
      return 1 + 0.5 * this.emo.frustration + 0.3 * Math.max(0, this.mood.aro - 0.5);
    }
    /** lab view */
    state() {
      return { emo: { ...this.emo }, mood: { ...this.mood }, att: Array.from(this.att), want: Array.from(this.want), rMean: Array.from(this.rMean), rSD: Array.from(this.rVar, Math.sqrt), scarcity: this.scarcity, others: { ...this.others }, persona: { ...this.persona }, stress: this.stress, hpaLocked: this.hpaLocked, sleepDebt: this.sleepDebt, inflam: this.inflam, sick: this.sick, nmBias: { ...this.nmBias }, events: this.events.slice(-50) };
    }
  };

  // brains/asmodensius-v40/creatures/001/organism/develop.ts
  var CORTEX_GENES = ["tc", "tcSig", "eI", "iE", "rec0", "xsSig"];
  var OVERGROW = 1.15;
  var gs = (r) => {
    const u = Math.max(1e-12, r()), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v);
  };
  function randomGenome(nProj, nReg, r) {
    const g = new Float32Array(3 * nProj + 3 * nReg + CORTEX_GENES.length);
    for (let p = 0; p < nProj; p++) {
      g[3 * p] = 1 + 0.3 * gs(r);
      g[3 * p + 1] = 0.1 * gs(r);
      g[3 * p + 2] = Math.log(0.25) + 0.3 * gs(r);
    }
    for (let k = 3 * nProj; k < 3 * nProj + 3 * nReg; k++) g[k] = gs(r);
    for (let k = 3 * nProj + 3 * nReg; k < g.length; k++) g[k] = 0.1 * gs(r);
    return g;
  }
  function mutateGenome(g, r, rate = 0.05) {
    const o = g.slice();
    for (let k = 0; k < o.length; k++) o[k] += rate * gs(r);
    return o;
  }
  function cortexGene(g, nProj, nReg, name) {
    const k = 3 * nProj + 3 * nReg + CORTEX_GENES.indexOf(name);
    return k < g.length ? Math.exp(Math.max(-1, Math.min(1, g[k]))) : 1;
  }
  function grow(P, R02, RN2, regions, g, r) {
    const nP = P.length, tagOf = (reg) => {
      const k = 3 * nP + 3 * regions.indexOf(reg);
      return [g[k], g[k + 1], g[k + 2]];
    };
    const pos = (i, reg) => (i - R02[reg] + 0.5) / RN2[reg];
    const jit = /* @__PURE__ */ new Map();
    const tag = (i, reg) => {
      let t = jit.get(i);
      if (!t) {
        const b = tagOf(reg);
        t = b.map((v) => v + 0.5 * gs(r));
        jit.set(i, t);
      }
      return t;
    };
    const pre = [], post = [], aff = [];
    let cand = 0, topo = 0, target = 0;
    const proj = [];
    const affinity = (pi, i, j) => {
      const [a, b] = P[pi];
      const gain = g[3 * pi], off = g[3 * pi + 1], sig = Math.max(0.05, Math.exp(g[3 * pi + 2]));
      const ti = tag(i, a), tj = tag(j, b);
      const d = pos(j, b) - (gain * pos(i, a) + off - (gain - 1) / 2);
      return Math.exp(-(d * d) / (2 * sig * sig)) * (1 + Math.tanh((ti[0] * tj[0] + ti[1] * tj[1] + ti[2] * tj[2]) / 3));
    };
    P.forEach(([a, b, p], pi) => {
      const gain = g[3 * pi], off = g[3 * pi + 1], sig = Math.max(0.05, Math.exp(g[3 * pi + 2]));
      for (let j = R02[b]; j < R02[b] + RN2[b]; j++) {
        const xj = pos(j, b), tj = tag(j, b);
        const C = [];
        for (let i = R02[a]; i < R02[a] + RN2[a]; i++) {
          if (i === j) continue;
          const xi = pos(i, a), ti = tag(i, a);
          const d = xj - (gain * xi + off - (gain - 1) / 2);
          const A = Math.exp(-(d * d) / (2 * sig * sig)) * (1 + Math.tanh((ti[0] * tj[0] + ti[1] * tj[1] + ti[2] * tj[2]) / 3));
          C.push([i, A]);
        }
        const meanA = C.reduce((s, c) => s + c[1], 0) / Math.max(1, C.length) || 1;
        const tN = p * C.length;
        target += tN;
        const keepN = Math.min(C.length, Math.round(OVERGROW * tN + (r() - 0.5)));
        const over = C.filter(([, A]) => r() < Math.min(1, 2 * p * A / meanA));
        cand += over.length;
        if (over.length < keepN) {
          const inSet = new Set(over.map((c) => c[0]));
          const rest = C.filter(([i]) => !inSet.has(i)).sort((u, v) => v[1] - u[1]);
          for (const c of rest) {
            if (over.length >= keepN) break;
            over.push(c);
          }
        }
        over.sort((u, v) => v[1] * (0.7 + 0.6 * r()) - u[1] * (0.7 + 0.6 * r()));
        for (const [i, A] of over.slice(0, Math.max(0, keepN))) {
          pre.push(i);
          post.push(j);
          proj.push(pi);
          aff.push(A / meanA);
          const xi = pos(i, a);
          topo += 1 - Math.abs(xj - xi);
        }
      }
    });
    return { pre, post, aff, proj, affinity, stats: { candidates: cand, kept: pre.length, topo: pre.length ? topo / pre.length : 0, target: Math.round(target) } };
  }

  // brains/asmodensius-v40/creatures/001/organism/substrate.ts
  var SubstrateTap = class {
    constructor(mode, seed, replayLog = []) {
      this.mode = mode;
      this.replayLog = replayLog;
      this.r = mulberry(seed * 3571 + 40);
      if (mode === "live") {
        try {
          const ph = __require("perf_hooks");
          this.gcObs = new ph.PerformanceObserver((l) => {
            for (const e of l.getEntries()) this.gcPending += e.duration;
          });
          this.gcObs.observe({ entryTypes: ["gc"] });
          this.eld = ph.monitorEventLoopDelay({ resolution: 10 });
          this.eld.enable();
        } catch {
        }
        this.last = typeof performance !== "undefined" ? performance.now() : Date.now();
      }
    }
    mode;
    replayLog;
    log = [];
    i = 0;
    r;
    pink = new Float64Array(6);
    last = 0;
    gcPending = 0;
    gcObs = null;
    eld = null;
    /** one reading per tick: [jitter, cpu, heap, gc, loopDelay, dome], each roughly in 0..1 */
    read(t, dome = 0) {
      let v;
      if (this.mode === "replay") {
        const f = this.replayLog[this.i++];
        if (!f || f.t !== t) throw new Error(`substrate replay out of sync at tick ${t}`);
        this.log.push({ t, v: f.v.slice() });
        return f.v.slice();
      }
      if (this.mode === "synthetic") {
        for (let k = 0; k < 6; k++) {
          const a = 1 - Math.pow(2, -k - 1);
          this.pink[k] = a * this.pink[k] + (1 - a) * (this.r() - 0.5);
        }
        const pk = this.pink.reduce((s, x) => s + x, 0);
        const gc = this.r() < 0.02 ? 0.3 + 0.7 * this.r() : 0;
        v = [0.5 + pk, 0.3 + 0.2 * Math.sin(t / 1440 * 2 * Math.PI) + 0.05 * (this.r() - 0.5), 0.4 + 0.1 * this.pink[5], gc, 0.1 + 0.5 * gc, dome];
      } else {
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        const dt = now - this.last;
        this.last = now;
        let cpu = 0, heap = 0;
        try {
          const os = __require("os");
          cpu = os.loadavg()[0] / Math.max(1, os.cpus().length);
          heap = (void 0).memoryUsage().heapUsed / (void 0).memoryUsage().heapTotal;
        } catch {
        }
        const gc = Math.min(1, this.gcPending / 50);
        this.gcPending = 0;
        const m = this.eld ? this.eld.mean : 0;
        const ld = Number.isFinite(m) ? Math.min(1, m / 1e8) : 0;
        v = [Math.tanh(dt / 50), Math.min(1, cpu), heap, gc, ld, dome];
      }
      this.log.push({ t, v: v.slice() });
      return v;
    }
    /** newline-delimited JSON for results/<run>/substrate.ndjson */
    toNDJSON() {
      return this.log.map((f) => JSON.stringify(f)).join("\n");
    }
    static fromNDJSON(s) {
      return s.split("\n").filter(Boolean).map((l) => JSON.parse(l));
    }
    close() {
      try {
        this.gcObs?.disconnect();
        this.eld?.disable();
      } catch {
      }
    }
  };

  // brains/asmodensius-v40/creatures/001/organism/v40mods.ts
  var cl2 = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  var fin = (x) => Number.isFinite(x) ? x : 0;
  var SensoryBus = class {
    constructor(r, off, mode = "synthetic", seed = 0, replay = []) {
      this.off = off;
      const nIn = 16 + 4 + 3 + 6;
      this.W = new Float32Array(this.D * nIn);
      for (let k = 0; k < this.W.length; k++) this.W[k] = r() < 0.15 ? r() < 0.5 ? -1 : 1 : 0;
      this.P = new Float32Array(this.D * this.D);
      this.prev = new Float32Array(this.D);
      this.R = new Float32Array(16 * this.D);
      for (let k = 0; k < this.R.length; k++) this.R[k] = (r() - 0.5) * 0.3;
      this.tap = mode === "off" ? null : new SubstrateTap(mode === "live" ? "synthetic" : mode, seed, replay);
      for (let i = 0; i < 16; i++) this.chIdx.push(0);
      for (let i = 0; i < 4; i++) this.chIdx.push(1);
      for (let i = 0; i < 3; i++) this.chIdx.push(2);
      for (let i = 0; i < 6; i++) this.chIdx.push(3);
    }
    off;
    D = 32;
    W;
    P;
    prev;
    gain = [1, 0.5, 0.25, 0.25];
    use = [0, 0, 0, 0];
    surprise = 0;
    sMean = 1e-4;
    surpriseN = 1;
    rBar = 0;
    chSurprise = [0, 0, 0, 0];
    out = new Float32Array(16);
    tap;
    lastIn = [];
    chIdx = [];
    R;
    ctl = /* @__PURE__ */ new Set();
    outK = 0.3;
    cr = 2654435769;
    crand() {
      this.cr = Math.imul(this.cr ^ this.cr >>> 15, 739982445) + 1831565813 >>> 0;
      return this.cr / 4294967296;
    }
    step(t, classic, intero, alien, reward) {
      const sub = this.tap && !this.off.has("substrate") ? this.tap.read(t).map((v) => cl2(fin(v), -1, 2)) : [0, 0, 0, 0, 0, 0];
      if (this.ctl.has("glitchInj") && this.crand() < 0.02) sub[3] = 1;
      if (this.ctl.has("glitchNoise") && this.crand() < 0.02) for (let i = 0; i < 16; i++) classic[i] += this.crand() - 0.5;
      let x = [...Array.from(classic), ...intero, ...this.off.has("alien") ? [0, 0, 0] : alien, ...sub];
      this.lastIn = x;
      if (this.ctl.has("busShuffle")) {
        x = x.slice();
        for (let i = x.length - 1; i > 0; i--) {
          const j = Math.floor(this.crand() * (i + 1));
          const tmp = x[i];
          x[i] = x[j];
          x[j] = tmp;
        }
      }
      const D = this.D, n = x.length;
      const f = new Float32Array(D);
      const fc = [new Float32Array(D), new Float32Array(D), new Float32Array(D), new Float32Array(D)];
      for (let d = 0; d < D; d++) for (let i = 0; i < n; i++) {
        const w = this.W[d * n + i];
        if (w) {
          const c = this.chIdx[i];
          const v = w * x[i] * this.gain[c];
          f[d] += v;
          fc[c][d] += w * x[i];
        }
      }
      for (let d = 0; d < D; d++) f[d] = Math.tanh(f[d]);
      let se = 0;
      const err = new Float32Array(D);
      for (let d = 0; d < D; d++) {
        let p = 0;
        for (let e = 0; e < D; e++) p += this.P[d * D + e] * this.prev[e];
        err[d] = f[d] - p;
        se += err[d] * err[d];
      }
      for (let d = 0; d < D; d++) for (let e = 0; e < D; e++) this.P[d * D + e] += 0.01 * err[d] * this.prev[e];
      this.surprise += 0.05 * (se / D - this.surprise);
      this.sMean += 1e-3 * (this.surprise - this.sMean);
      this.surpriseN = cl2(this.surprise / (this.sMean + 1e-9), 0, 5);
      this.rBar += 2e-3 * (reward - this.rBar);
      for (let c = 0; c < 4; c++) {
        let s = 0;
        for (let d = 0; d < D; d++) s += fc[c][d] * err[d];
        this.chSurprise[c] += 0.05 * (Math.abs(s) / D - this.chSurprise[c]);
        let a = 0;
        for (let d = 0; d < D; d++) a += Math.abs(fc[c][d]);
        this.use[c] += 2e-3 * ((reward - this.rBar) * Math.tanh(a / D) * 10 - this.use[c]);
        this.gain[c] = cl2(this.gain[c] + 0.01 * this.use[c], 0.05, 2);
      }
      this.prev = f;
      for (let i = 0; i < 16; i++) {
        let s = 0;
        for (let d = 0; d < D; d++) s += this.R[i * D + d] * f[d];
        this.out[i] = this.off.has("bus") ? 0 : this.outK * Math.tanh(s);
      }
      return this.out;
    }
    state() {
      return { gain: [...this.gain], use: [...this.use], surprise: this.surprise, surpriseN: this.surpriseN, chSurprise: [...this.chSurprise], substrateMode: this.tap?.mode ?? "off" };
    }
  };
  var SelfModel = class {
    constructor(r, off) {
      this.off = off;
      this.z = new Float32Array(this.N);
      this.mean = new Float32Array(this.N);
      this.Win = new Float32Array(this.N * 12).map(() => (r() - 0.5) * 0.6);
      this.Wout = new Float32Array(5 * this.N);
    }
    off;
    N = 32;
    z;
    Win;
    Wout;
    pred = [0, 0, 0, 0, 0];
    atpEMA = 0.5;
    err = 0;
    errBody = 0;
    sim = 0.1;
    mean;
    ctl = /* @__PURE__ */ new Set();
    simK = 0.6;
    lastX = [];
    step(x, glitch) {
      const tgt = [x[0], x[1], x[2], x[3], x[10]];
      let e = 0, eb = 0;
      for (let o = 0; o < 5; o++) {
        const d = tgt[o] - this.pred[o];
        e += d * d;
        if (o < 4) eb += d * d;
        if (!this.off.has("self")) for (let i = 0; i < this.N; i++) this.Wout[o * this.N + i] += 0.01 * d * this.z[i];
      }
      this.err += 0.05 * (e - this.err);
      this.atpEMA += 0.01 * (x[1] - this.atpEMA);
      this.errBody += 0.05 * (eb - this.errBody);
      for (let i = 0; i < this.N; i++) {
        let s = 0;
        for (let j = 0; j < (this.ctl.has("selfBody") ? 4 : 12); j++) s += this.Win[i * 12 + j] * fin(x[j]);
        this.z[i] = 0.95 * this.z[i] + 0.05 * Math.tanh(s);
        this.mean[i] += 1e-3 * (this.z[i] - this.mean[i]);
      }
      const z = this.off.has("self") ? this.mean : this.z;
      for (let o = 0; o < 5; o++) {
        let s = 0;
        for (let i = 0; i < this.N; i++) s += this.Wout[o * this.N + i] * z[i];
        this.pred[o] = s;
      }
      if (!this.off.has("sim")) {
        const unexpl = Math.max(0, 0.25 * x[10] - this.errBody);
        const lik = cl2(2 * glitch + 4 * unexpl);
        this.sim = cl2(0.98 * this.sim + 0.02 * lik);
      } else this.sim = 0.1;
      this.lastX = x;
    }
    /** predicted energy drop (next atp below now) -> caution */
    caution() {
      return this.off.has("self") ? 0.25 : cl2(0.25 + 5 * (this.atpEMA - this.pred[1]), 0, 1);
    }
    // 0.25 = neutral; >0.25 when SELF foresees an energy drop
    learnScale() {
      return 1 - this.simK * this.sim;
    }
    state() {
      return { err: this.err, errBody: this.errBody, sim: this.sim, pred: [...this.pred], caution: this.caution(), z: Array.from(this.z.slice(0, 8)) };
    }
  };
  var Curvature = class {
    constructor(r, nIn, off) {
      this.nIn = nIn;
      this.off = off;
      this.Pm = new Float32Array(this.K * nIn).map(() => (r() - 0.5) * 2 / Math.sqrt(nIn));
      this.mu = new Float32Array(nIn);
    }
    nIn;
    off;
    K = 6;
    Pm;
    buf = [];
    kappa = 0;
    kMean = 0.5;
    kSD = 0.3;
    conf = 0.5;
    mu;
    step(rates) {
      const y = new Array(this.K).fill(0);
      for (let i = 0; i < this.nIn; i++) {
        const v = rates[i] - this.mu[i];
        this.mu[i] += 1e-3 * v;
        if (v) for (let k2 = 0; k2 < this.K; k2++) y[k2] += this.Pm[k2 * this.nIn + i] * v;
      }
      this.buf.push(y);
      if (this.buf.length > 3) this.buf.shift();
      if (this.buf.length < 3) return;
      const [a, b, c] = this.buf;
      const d1 = b.map((v, i) => v - a[i]), d2 = c.map((v, i) => v - b[i]);
      const n1 = Math.hypot(...d1), n2 = Math.hypot(...d2);
      if (n1 < 1e-6 || n2 < 1e-6) return;
      const cos = cl2(d1.reduce((s, v, i) => s + v * d2[i], 0) / (n1 * n2), -1, 1);
      const k = Math.acos(cos) / (0.5 * (n1 + n2) + 1e-3);
      this.kappa = 0.9 * this.kappa + 0.1 * Math.min(50, k);
      this.kMean += 2e-3 * (this.kappa - this.kMean);
      this.kSD += 2e-3 * (Math.abs(this.kappa - this.kMean) - this.kSD);
      this.conf = this.off.has("curv") ? 0.5 : cl2(0.5 - 0.25 * (this.kappa - this.kMean) / (this.kSD + 1e-3));
    }
    felt() {
      return this.off.has("curv") ? 0 : cl2((this.kappa - this.kMean) / (this.kSD + 1e-3), -2, 2);
    }
    noiseMul() {
      return 0.7 + 0.6 * (1 - this.conf);
    }
    state() {
      return { kappa: this.kappa, kMean: this.kMean, conf: this.conf, felt: this.felt() };
    }
  };
  var HOOKS = ["shade", "mark"];
  var NeoHooks = class {
    constructor(off) {
      this.off = off;
    }
    off;
    val = [0, 0];
    uses = [0, 0];
    granted = [0, 0];
    pending = [];
    lastUse = null;
    shadeUntil = 0;
    ctl = /* @__PURE__ */ new Set();
    step(t, sim, sleepDebt, hunger, bestSite, r) {
      if (this.off.has("neo")) return;
      if (this.lastUse && t - this.lastUse.t === 120) {
        const k = this.lastUse.k;
        const now = k === 0 ? -sleepDebt : -hunger;
        this.val[k] += 0.2 * (now - this.lastUse.base - this.val[k]);
        this.lastUse = null;
      }
      if (this.lastUse || t % 30 !== 0) return;
      const drive = [sleepDebt * (0.3 + sim), hunger * (0.2 + sim)];
      for (let k = 0; k < 2; k++) {
        const p = this.ctl.has("neoRandom") ? 0.06 : cl2(0.02 + 0.3 * drive[k] + 2 * this.val[k], 0, 0.5);
        if (r() < p) {
          this.uses[k]++;
          this.pending.push({ t, hook: HOOKS[k], arg: k === 1 ? bestSite : 60 });
          this.lastUse = { k, t, base: k === 0 ? -sleepDebt : -hunger };
          break;
        }
      }
    }
    /** sandbox reply */
    grant(req, ok) {
      if (ok) {
        this.granted[HOOKS.indexOf(req.hook)]++;
        if (req.hook === "shade") this.shadeUntil = req.t + req.arg;
      }
    }
    state() {
      return { val: [...this.val], uses: [...this.uses], granted: [...this.granted], pending: this.pending.length };
    }
  };

  // brains/asmodensius-v40/creatures/001/organism/tsotchke.ts
  function tsotchkeEntropy(seed, fallback) {
    let buf = null;
    try {
      const dir = false ? (void 0).env?.TSOTCHKE_QRNG_DIR : void 0;
      if (dir) {
        const fs = __require("fs");
        const f = `${dir}/${seed}.bin`;
        if (fs.existsSync(f)) buf = new Uint8Array(fs.readFileSync(f));
      }
    } catch {
      buf = null;
    }
    if (!buf || buf.length < 8) return fallback;
    let i = 0, wraps = 0;
    const b = buf;
    return () => {
      if (i + 4 > b.length) {
        i = 0;
        wraps++;
      }
      const v = ((b[i] | b[i + 1] << 8 | b[i + 2] << 16 | b[i + 3] << 24) >>> 0 ^ Math.imul(wraps, 2654435769)) >>> 0;
      i += 4;
      return v / 4294967296;
    };
  }

  // brains/asmodensius-v40/creatures/001/organism/fp/tpc.ts
  var TPC = class {
    N;
    D;
    K;
    h;
    W;
    U;
    V1;
    VK;
    buf = [];
    x1;
    xK;
    err = 0;
    errK = 0;
    constructor(D, r, o = {}) {
      this.D = D;
      this.N = o.N ?? 64;
      this.K = o.K ?? 10;
      this.o = { leak: o.leak ?? 0.3, rho: o.rho ?? 0.9, lam: o.lam ?? 0.8, lr: o.lr ?? 0.05, learn: o.learn ?? true };
      const N = this.N, g = () => (r() + r() + r() - 1.5) * 2;
      this.h = new Float64Array(N);
      this.W = new Float64Array(N * N).map(() => g() * this.o.rho / Math.sqrt(N));
      this.U = new Float64Array(N * D).map(() => g());
      this.V1 = new Float64Array(D * N);
      this.VK = new Float64Array(D * N);
      this.x1 = new Float64Array(D);
      this.xK = new Float64Array(D);
    }
    o;
    read(V, h, out) {
      for (let d = 0; d < this.D; d++) {
        let s = 0;
        for (let j = 0; j < this.N; j++) s += V[d * this.N + j] * h[j];
        out[d] = s;
      }
    }
    learn(V, h, x) {
      let hh = 1e-3;
      for (let j = 0; j < this.N; j++) hh += h[j] * h[j];
      let e2 = 0;
      for (let d = 0; d < this.D; d++) {
        let p = 0;
        for (let j = 0; j < this.N; j++) p += V[d * this.N + j] * h[j];
        const e = x[d] - p;
        e2 += e * e;
        if (this.o.learn) for (let j = 0; j < this.N; j++) V[d * this.N + j] += this.o.lr * e * h[j] / hh;
      }
      return e2 / this.D;
    }
    // x: current observation. Returns K-step forecast.
    step(x) {
      const N = this.N, D = this.D;
      if (this.buf.length >= 1) this.err = this.learn(this.V1, this.buf[this.buf.length - 1], x);
      if (this.buf.length >= this.K) this.errK = this.learn(this.VK, this.buf[this.buf.length - this.K], x);
      const a = this.o.leak, nh = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        let s = 0;
        for (let j = 0; j < N; j++) s += this.W[i * N + j] * this.h[j];
        for (let d = 0; d < D; d++) s += this.U[i * D + d] * (x[d] + this.o.lam * this.xK[d]);
        nh[i] = (1 - a) * this.h[i] + a * Math.tanh(s);
      }
      this.h = nh;
      this.buf.push(nh);
      if (this.buf.length > this.K) this.buf.shift();
      this.read(this.V1, nh, this.x1);
      this.read(this.VK, nh, this.xK);
      return this.xK;
    }
  };

  // brains/asmodensius-v40/creatures/001/organism/fp/efm.ts
  var EFM = class {
    H;
    D;
    p;
    m;
    v;
    k = 0;
    h;
    trained = 0;
    constructor(D, r, H = 10) {
      this.H = H;
      this.D = D;
      const n = H * H + H * D + H + H + 1;
      this.p = new Float64Array(n).map(() => (r() * 2 - 1) * 0.3);
      this.m = new Float64Array(n);
      this.v = new Float64Array(n);
      this.h = new Float64Array(H);
    }
    get n() {
      return this.p.length;
    }
    // parameter layout: Wh [H*H] | Wx [H*D] | b [H] | wo [H] | bo [1]
    cell(p, h, x) {
      const H = this.H, D = this.D, nh = new Float64Array(H), oX = H * H, oB = oX + H * D;
      for (let i = 0; i < H; i++) {
        let s = p[oB + i];
        for (let j = 0; j < H; j++) s += p[i * H + j] * h[j];
        for (let d = 0; d < D; d++) s += p[oX + i * D + d] * x[d];
        nh[i] = Math.tanh(s);
      }
      return nh;
    }
    out(p, h) {
      const H = this.H, oO = H * H + H * this.D + H;
      let s = p[oO + H];
      for (let j = 0; j < H; j++) s += p[oO + j] * h[j];
      return s;
    }
    loss(p, xs, ys, B) {
      let h = new Float64Array(this.H), L = 0;
      for (let t = 0; t < xs.length; t++) {
        h = this.cell(p, h, xs[t]);
        if (t >= B) L += (this.out(p, h) - ys[t]) ** 2;
      }
      return L / Math.max(1, xs.length - B);
    }
    grad(xs, ys, B) {
      const H = this.H, D = this.D, p = this.p, T = xs.length, g = new Float64Array(this.n), oX = H * H, oB = oX + H * D, oO = oB + H, oBo = oO + H;
      const hs = [new Float64Array(H)];
      for (let t = 0; t < T; t++) hs.push(this.cell(p, hs[t], xs[t]));
      const N = Math.max(1, T - B);
      let dh = new Float64Array(H);
      for (let t = T - 1; t >= 0; t--) {
        const h = hs[t + 1], hp = hs[t];
        if (t >= B) {
          const e = 2 * (this.out(p, h) - ys[t]) / N;
          g[oBo] += e;
          for (let j = 0; j < H; j++) {
            g[oO + j] += e * h[j];
            dh[j] += e * p[oO + j];
          }
        }
        const da = new Float64Array(H);
        for (let i = 0; i < H; i++) da[i] = dh[i] * (1 - h[i] * h[i]);
        const ndh = new Float64Array(H);
        for (let i = 0; i < H; i++) {
          g[oB + i] += da[i];
          for (let j = 0; j < H; j++) {
            g[i * H + j] += da[i] * hp[j];
            ndh[j] += da[i] * p[i * H + j];
          }
          for (let d = 0; d < D; d++) g[oX + i * D + d] += da[i] * xs[t][d];
        }
        dh = ndh;
      }
      return g;
    }
    adam(g, lr = 0.01) {
      this.k++;
      const b1 = 0.9, b2 = 0.999;
      for (let i = 0; i < this.n; i++) {
        const gi = Math.max(-5, Math.min(5, g[i]));
        this.m[i] = b1 * this.m[i] + (1 - b1) * gi;
        this.v[i] = b2 * this.v[i] + (1 - b2) * gi * gi;
        this.p[i] -= lr * this.m[i] / (1 - b1 ** this.k) / (Math.sqrt(this.v[i] / (1 - b2 ** this.k)) + 1e-8);
      }
      this.trained++;
    }
    // online inference: advance the live state; peek(x) returns the forecast if x were the input now (rollout of a hypothetical action) without advancing.
    advance(x) {
      this.h = this.cell(this.p, this.h, x);
      return this.out(this.p, this.h);
    }
    peek(x) {
      return this.out(this.p, this.cell(this.p, this.h, x));
    }
  };
  var EFMV = class extends EFM {
    Do;
    constructor(D, Do, r, H = 16) {
      super(D, r, H);
      this.Do = Do;
      const n = H * H + H * D + H + Do * H + Do;
      this.p = new Float64Array(n).map(() => (r() * 2 - 1) * 0.3);
      this.m = new Float64Array(n);
      this.v = new Float64Array(n);
    }
    outV(p, h) {
      const H = this.H, oO = H * H + H * this.D + H, y = new Float64Array(this.Do);
      for (let d = 0; d < this.Do; d++) {
        let s = p[oO + this.Do * H + d];
        for (let j = 0; j < H; j++) s += p[oO + d * H + j] * h[j];
        y[d] = s;
      }
      return y;
    }
    lossV(p, xs, ys, B) {
      let h = new Float64Array(this.H), L = 0;
      for (let t = 0; t < xs.length; t++) {
        h = this.cell(p, h, xs[t]);
        if (t >= B) {
          const y = this.outV(p, h);
          for (let d = 0; d < this.Do; d++) L += (y[d] - ys[t][d]) ** 2;
        }
      }
      return L / (Math.max(1, xs.length - B) * this.Do);
    }
    gradV(xs, ys, B) {
      const H = this.H, D = this.D, Do = this.Do, p = this.p, T = xs.length, g = new Float64Array(this.n), oX = H * H, oB = oX + H * D, oO = oB + H, oBo = oO + Do * H;
      const hs = [new Float64Array(H)];
      for (let t = 0; t < T; t++) hs.push(this.cell(p, hs[t], xs[t]));
      const N = Math.max(1, T - B) * Do;
      let dh = new Float64Array(H);
      for (let t = T - 1; t >= 0; t--) {
        const h = hs[t + 1], hp = hs[t];
        if (t >= B) {
          const y = this.outV(p, h);
          for (let d = 0; d < Do; d++) {
            const e = 2 * (y[d] - ys[t][d]) / N;
            g[oBo + d] += e;
            for (let j = 0; j < H; j++) {
              g[oO + d * H + j] += e * h[j];
              dh[j] += e * p[oO + d * H + j];
            }
          }
        }
        const da = new Float64Array(H);
        for (let i = 0; i < H; i++) da[i] = dh[i] * (1 - h[i] * h[i]);
        const ndh = new Float64Array(H);
        for (let i = 0; i < H; i++) {
          g[oB + i] += da[i];
          for (let j = 0; j < H; j++) {
            g[i * H + j] += da[i] * hp[j];
            ndh[j] += da[i] * p[i * H + j];
          }
          for (let d = 0; d < D; d++) g[oX + i * D + d] += da[i] * xs[t][d];
        }
        dh = ndh;
      }
      return g;
    }
    advanceV(x) {
      this.h = this.cell(this.p, this.h, x);
      return this.outV(this.p, this.h);
    }
  };

  // brains/asmodensius-v40/creatures/001/organism/fp/dmul.ts
  var dmulOut = (basal, apical, gA = 4, th = 0.5) => Math.max(0, basal) / (1 + Math.exp(-gA * (apical - th)));

  // brains/asmodensius-v40/creatures/001/organism/fp/aom.ts
  var AOM = class {
    constructor(K, NB = 9, BW = 15, q = 2e-5, useCurve = true) {
      this.K = K;
      this.NB = NB;
      this.BW = BW;
      this.q = q;
      this.m = new Float64Array(K).fill(0.3);
      this.P = new Float64Array(K).fill(0.04);
      this.last = new Float64Array(K).fill(-1e9);
      this.c = new Float64Array(NB).fill(1);
      this.nc = new Float64Array(NB);
      this.useCurve = useCurve;
    }
    K;
    NB;
    BW;
    q;
    m;
    P;
    last;
    c;
    nc;
    useCurve;
    bin(k, t) {
      return this.useCurve ? Math.min(this.NB - 1, Math.floor((t - this.last[k]) / this.BW)) : this.NB - 1;
    }
    tick() {
      for (let k = 0; k < this.K; k++) this.P[k] = Math.min(0.25, this.P[k] + this.q);
    }
    pred(k, t) {
      return Math.min(1, Math.max(0, this.m[k] * this.c[this.bin(k, t)]));
    }
    ig(k, t) {
      const b = this.bin(k, t), c = this.c[b], m = this.m[k], p = this.pred(k, t);
      const vc = this.useCurve ? 0.25 / (this.nc[b] + 1) : 0;
      const V = c * c * this.P[k] + m * m * vc;
      return 0.5 * Math.log(1 + V / (p * (1 - p) + 0.02));
    }
    observe(k, t, r) {
      const b = this.bin(k, t), c = this.c[b], p = this.pred(k, t), R = p * (1 - p) + 0.02;
      const G = this.P[k] * c / (c * c * this.P[k] + R);
      this.m[k] += G * (r - p);
      this.P[k] *= 1 - G * c;
      this.m[k] = Math.min(1, Math.max(0.01, this.m[k]));
      if (this.useCurve && b < this.NB - 1) {
        this.c[b] += 0.3 / (this.nc[b] + 3) * (r / Math.max(0.05, this.m[k]) - c);
        this.c[b] = Math.max(0, Math.min(1.5, this.c[b]));
        this.nc[b]++;
      }
      if (r > 0) this.last[k] = t;
    }
  };

  // brains/asmodensius-v40/creatures/001/organism/fp/l5.ts
  var softplus = (x) => x > 20 ? x : Math.log1p(Math.exp(x));
  var L5Pool = class {
    constructor(U, N, r, gA = 4) {
      this.U = U;
      this.N = N;
      this.gA = gA;
      const s = 2 / Math.sqrt(N);
      this.Wb = new Float64Array(U * N).map(() => (r() * 2 - 1) * s);
      this.Wa = new Float64Array(U * N).map(() => (r() * 2 - 1) * s);
      this.y = new Float64Array(U);
    }
    U;
    N;
    gA;
    Wb;
    Wa;
    y;
    norm = false;
    vb;
    va;
    /* Oja (1982) local Hebbian rule: each dendrite's weights converge to the leading principal component of its input */
    oja(W, u, x, eta) {
      const N = this.N;
      let y = 0;
      for (let k = 0; k < N; k++) y += W[u * N + k] * x[k];
      for (let k = 0; k < N; k++) W[u * N + k] += eta * y * (x[k] - y * W[u * N + k]);
    }
    learn(own, oth, eta = 0.01) {
      for (let u = 0; u < this.U; u++) {
        this.oja(this.Wb, u, own, eta);
        if (oth) this.oja(this.Wa, u, oth, eta);
      }
    }
    step(own, oth, mode = "mul") {
      for (let u = 0; u < this.U; u++) {
        let b = 0, a = 0;
        for (let k = 0; k < this.N; k++) {
          b += this.Wb[u * this.N + k] * own[k];
          if (oth) a += this.Wa[u * this.N + k] * oth[k];
        }
        if (this.norm) {
          this.vb ??= new Float64Array(this.U).fill(1e-3);
          this.va ??= new Float64Array(this.U).fill(1e-3);
          this.vb[u] += 0.02 * (b * b - this.vb[u]);
          this.va[u] += 0.02 * (a * a - this.va[u]);
          b /= Math.sqrt(this.vb[u]) + 1e-6;
          if (oth) a /= Math.sqrt(this.va[u]) + 1e-6;
        }
        this.y[u] = mode === "mul" ? softplus(b) / (1 + Math.exp(-this.gA * a)) : softplus(b) + 0.5 * softplus(a);
      }
      return this.y;
    }
  };

  // brains/asmodensius-v40/creatures/001/organism/organism.ts
  function mulberry(seed) {
    let a = seed >>> 0;
    const f = () => {
      a = a + 1831565813 >>> 0;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    f.getState = () => a;
    f.setState = (x) => {
      a = x >>> 0;
    };
    return f;
  }
  var clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
  function digamma(x) {
    let r = 0;
    while (x < 6) {
      r -= 1 / x;
      x += 1;
    }
    const f = 1 / (x * x);
    return r + Math.log(x) - 0.5 / x - f * (1 / 12 - f * (1 / 120 - f * (1 / 252 - f * (1 / 240 - f / 132))));
  }
  function betaIG(a, b) {
    const n = a + b, m = a / n;
    const H = -(m * Math.log(m) + (1 - m) * Math.log(1 - m));
    const EH = -(m * (digamma(a + 1) - digamma(n + 1)) + (1 - m) * (digamma(b + 1) - digamma(n + 1)));
    return Math.max(0, H - EH);
  }
  var IG0 = betaIG(1, 1);
  var MW = Number(13);
  var CS = MW / 13;
  var KI = Math.round(3 * CS);
  var CE = 4 * MW;
  var REGIONS = [["SENS", 16], ["THAL", 16], ["CTX", CE + 4 * KI], ["HIP", 32], ["STR", 32], ["HYP", 16], ["VTA", 6], ["RAPHE", 6], ["LC", 6], ["BF", 6], ["INS", 8], ["SCN", 8], ["MOT", 8], ["ENS", 48]];
  var R0 = {};
  var RN = {};
  {
    let o = 0;
    for (const [n, k] of REGIONS) {
      R0[n] = o;
      RN[n] = k;
      o += k;
    }
  }
  var NNEU = REGIONS.reduce((s, r) => s + r[1], 0);
  var INHIB = (i) => i >= R0.CTX + CE && i < R0.CTX + RN.CTX || i >= R0.STR && i < R0.STR + RN.STR || i >= R0.ENS + 36 && i < R0.ENS + 48;
  var CP = [
    ["SENS", "THAL", 0.25],
    ["THAL", "CTX", 0.12],
    ["CTX", "THAL", 0.06],
    ["CTX", "CTX", 0.1],
    ["CTX", "HIP", 0.06],
    ["HIP", "CTX", 0.06],
    ["HIP", "HIP", 0.05],
    ["CTX", "STR", 0.08],
    ["STR", "MOT", 0.15],
    ["CTX", "MOT", 0.05],
    ["HYP", "VTA", 0.2],
    ["HYP", "LC", 0.15],
    ["HYP", "HYP", 0.1],
    ["INS", "LC", 0.25],
    ["INS", "CTX", 0.06],
    ["INS", "HYP", 0.15],
    ["VTA", "STR", 0.1],
    ["LC", "CTX", 0.08],
    ["RAPHE", "CTX", 0.05],
    ["BF", "CTX", 0.06],
    ["BF", "HIP", 0.1],
    ["SCN", "HYP", 0.25],
    ["SCN", "RAPHE", 0.15],
    ["CTX", "INS", 0.06],
    ["ENS", "ENS", 0.12],
    ["ENS", "HYP", 0.05]
  ];
  var TA = { Float32Array, Float64Array, Int32Array, Uint8Array, Uint32Array, Int8Array, Uint16Array, Int16Array };
  function snapEnc(x, skip) {
    if (x === null || typeof x !== "object") return typeof x === "function" ? x.getState ? { __rng: x.getState() } : void 0 : x;
    if (ArrayBuffer.isView(x)) return { __ta: x.constructor.name, v: Array.from(x) };
    if (Array.isArray(x)) return x.map((e) => snapEnc(e, skip));
    const o = {};
    for (const k of Object.keys(x)) {
      if (skip.has(k)) continue;
      const v = x[k];
      if (typeof v === "function" && !v.getState) continue;
      o[k] = snapEnc(v, skip);
    }
    return o;
  }
  function snapVal(cur, v, skip) {
    if (v === null || typeof v !== "object") return v;
    if (v.__rng !== void 0) {
      if (typeof cur === "function" && cur.setState) {
        cur.setState(v.__rng);
        return cur;
      }
      const f = mulberry(0);
      f.setState(v.__rng);
      return f;
    }
    if (v.__ta) {
      const T = TA[v.__ta];
      if (cur && cur.constructor === T && cur.length === v.v.length) {
        cur.set(v.v);
        return cur;
      }
      return T.from(v.v);
    }
    if (Array.isArray(v)) {
      if (Array.isArray(cur)) {
        const out = v.map((e, i) => snapVal(cur[i], e, skip));
        cur.length = 0;
        cur.push(...out);
        return cur;
      }
      return v.map((e) => snapVal(void 0, e, skip));
    }
    if (cur && typeof cur === "object" && !Array.isArray(cur) && !ArrayBuffer.isView(cur)) {
      snapDec(cur, v, skip);
      return cur;
    }
    const o = {};
    for (const k of Object.keys(v)) o[k] = snapVal(void 0, v[k], skip);
    return o;
  }
  function snapDec(target, st, skip) {
    for (const k of Object.keys(st)) {
      if (skip.has(k)) continue;
      target[k] = snapVal(target[k], st[k], skip);
    }
  }
  var Q3 = class {
    re = new Float64Array(8);
    im = new Float64Array(8);
    ext = null;
    constructor() {
      this.re[0] = 1;
    }
    reset() {
      this.re.fill(0);
      this.im.fill(0);
      this.re[0] = 1;
      this.ext = null;
    }
    ry(q, t) {
      const c = Math.cos(t / 2), s = Math.sin(t / 2), m = 1 << q;
      for (let i = 0; i < 8; i++) if (!(i & m)) {
        const j = i | m;
        const a = this.re[i], b = this.re[j], ai = this.im[i], bi = this.im[j];
        this.re[i] = c * a - s * b;
        this.re[j] = s * a + c * b;
        this.im[i] = c * ai - s * bi;
        this.im[j] = s * ai + c * bi;
      }
    }
    rz(q, t) {
      const m = 1 << q;
      for (let i = 0; i < 8; i++) {
        const ph = i & m ? t / 2 : -t / 2;
        const c = Math.cos(ph), s = Math.sin(ph);
        const a = this.re[i], b = this.im[i];
        this.re[i] = a * c - b * s;
        this.im[i] = a * s + b * c;
      }
    }
    cx(c, t) {
      const mc = 1 << c, mt = 1 << t;
      for (let i = 0; i < 8; i++) if (i & mc && !(i & mt)) {
        const j = i | mt;
        let x = this.re[i];
        this.re[i] = this.re[j];
        this.re[j] = x;
        x = this.im[i];
        this.im[i] = this.im[j];
        this.im[j] = x;
      }
    }
    probs() {
      if (this.ext) return this.ext.slice();
      const p = [];
      for (let k = 0; k < 8; k++) p.push(this.re[k] ** 2 + this.im[k] ** 2);
      return p;
    }
    measure(u) {
      const p = this.probs();
      let k = 0;
      for (; k < 7; k++) {
        u -= p[k];
        if (u < 0) break;
      }
      return k;
    }
    prepare(th) {
      this.reset();
      for (let q = 0; q < 3; q++) this.ry(q, th[q]);
      this.cx(0, 1);
      this.cx(1, 2);
      for (let q = 0; q < 3; q++) this.rz(q, th[q] * 0.7);
    }
  };
  function qgt(th) {
    const st = (t) => {
      const q = new Q3();
      q.prepare(t);
      return [q.re.slice(), q.im.slice()];
    };
    const h = 1e-4;
    const [r0, i0] = st(th);
    const dR = [], dI = [];
    for (let a = 0; a < 3; a++) {
      const tp = th.slice(), tm = th.slice();
      tp[a] += h;
      tm[a] -= h;
      const [rp, ip2] = st(tp), [rm, im] = st(tm);
      dR.push(rp.map((v, k) => (v - rm[k]) / (2 * h)));
      dI.push(ip2.map((v, k) => (v - im[k]) / (2 * h)));
    }
    const ip = (ar, ai, br, bi) => {
      let re = 0, imv = 0;
      for (let k = 0; k < 8; k++) {
        re += ar[k] * br[k] + ai[k] * bi[k];
        imv += ar[k] * bi[k] - ai[k] * br[k];
      }
      return [re, imv];
    };
    const g = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], berry = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      const [xr, xi] = ip(dR[a], dI[a], dR[b], dI[b]);
      const [ar, ai] = ip(dR[a], dI[a], r0, i0);
      const [br, bi] = ip(r0, i0, dR[b], dI[b]);
      const cr = ar * br - ai * bi, ci = ar * bi + ai * br;
      g[a][b] = xr - cr;
      berry[a][b] = -2 * (xi - ci);
    }
    return { g, berry, trace: g[0][0] + g[1][1] + g[2][2] };
  }
  var Health = class {
    rctCut;
    aptCut;
    W = 512;
    last = -1;
    run = 0;
    win = [];
    fails = 0;
    n = 0;
    constructor(minEntropy) {
      this.rctCut = Math.ceil(1 + 30 / minEntropy);
      const p = Math.pow(2, -minEntropy);
      const z = 5;
      this.aptCut = Math.ceil(this.W * p + z * Math.sqrt(this.W * p * (1 - p)) + 0.5);
    }
    push(s) {
      this.n++;
      if (s === this.last) {
        this.run++;
        if (this.run >= this.rctCut) {
          this.fails++;
          this.run = 1;
        }
      } else {
        this.last = s;
        this.run = 1;
      }
      this.win.push(s);
      if (this.win.length === this.W) {
        const c = this.win.filter((x) => x === this.win[0]).length;
        if (c >= this.aptCut) this.fails++;
        this.win = [];
      }
    }
  };
  var NMOD = 4;
  var msoftmax = (z, beta = 1) => {
    const m = Math.max(...z);
    const e = z.map((v) => Math.exp(beta * (v - m)));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map((v) => v / s);
  };
  var margmax = (a) => {
    let b = 0;
    for (let i = 1; i < a.length; i++) if (a[i] > a[b]) b = i;
    return b;
  };
  var mdot = (w, x, off = 0) => {
    let s = 0;
    for (let i = 0; i < x.length; i++) s += w[off + i] * x[i];
    return s + w[off + x.length];
  };
  var Lin = class {
    constructor(nOut, nIn) {
      this.nOut = nOut;
      this.nIn = nIn;
      this.W = new Float64Array(nOut * (nIn + 1));
    }
    nOut;
    nIn;
    W;
    out(x) {
      const z = [];
      for (let k = 0; k < this.nOut; k++) z.push(mdot(this.W, x, k * (this.nIn + 1)));
      return z;
    }
    learn(x, target, lr, beta = 3) {
      const p = msoftmax(this.out(x), beta);
      for (let k = 0; k < this.nOut; k++) {
        const g = (k === target ? 1 : 0) - p[k];
        const o = k * (this.nIn + 1);
        for (let i = 0; i < this.nIn; i++) this.W[o + i] += lr * g * x[i];
        this.W[o + this.nIn] += lr * g;
      }
    }
    regress(x, y, lr) {
      const z = this.out(x);
      let n = 1;
      for (let i = 0; i < x.length; i++) n += x[i] * x[i];
      for (let k = 0; k < this.nOut; k++) {
        const g = (y[k] - z[k]) / n;
        const o = k * (this.nIn + 1);
        for (let i = 0; i < this.nIn; i++) this.W[o + i] += lr * g * x[i];
        this.W[o + this.nIn] += lr * g;
      }
    }
  };
  var RLS = class {
    constructor(nIn, lam) {
      this.lam = lam;
      this.n = nIn + 1;
      this.w = new Float64Array(this.n);
      this.P = new Float64Array(this.n * this.n);
      for (let i = 0; i < this.n; i++) this.P[i * this.n + i] = 100;
    }
    lam;
    w;
    P;
    n;
    out(x) {
      let z = this.w[this.n - 1];
      for (let i = 0; i < this.n - 1; i++) z += this.w[i] * x[i];
      return z;
    }
    fit(x, y) {
      const n = this.n, u = new Float64Array(n);
      for (let i = 0; i < n - 1; i++) u[i] = x[i];
      u[n - 1] = 1;
      const Pu = new Float64Array(n);
      let den = this.lam;
      for (let i = 0; i < n; i++) {
        let a = 0;
        for (let j = 0; j < n; j++) a += this.P[i * n + j] * u[j];
        Pu[i] = a;
        den += u[i] * a;
      }
      const e = y - this.out(x);
      for (let i = 0; i < n; i++) this.w[i] += Pu[i] / den * e;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) this.P[i * n + j] = (this.P[i * n + j] - Pu[i] * Pu[j] / den) / this.lam;
    }
  };
  var Kal = class {
    constructor(q = 2e-3, qd = 4e-4, r = 0.09) {
      this.q = q;
      this.qd = qd;
      this.r = r;
    }
    q;
    qd;
    r;
    x = [0, 0];
    P = [[1, 0], [0, 1]];
    adapt = 0;
    predict(u = 0) {
      const [p, d] = this.x;
      this.x = [p + d + u, d];
      const P = this.P;
      this.P = [[P[0][0] + 2 * P[0][1] + P[1][1] + this.q, P[0][1] + P[1][1]], [P[0][1] + P[1][1], P[1][1] + this.qd]];
      return this.x[0];
    }
    update(z) {
      const S = this.P[0][0] + this.r;
      const nis = (z - this.x[0]) ** 2 / S;
      const infl = nis > 6 ? 3 : 1;
      this.P[0][0] *= infl;
      this.P[1][1] *= infl;
      const S2 = this.P[0][0] + this.r, K0 = this.P[0][0] / S2, K1 = this.P[0][1] / S2, e = z - this.x[0];
      this.x = [this.x[0] + K0 * e, this.x[1] + K1 * e];
      const P = this.P;
      this.P = [[(1 - K0) * P[0][0], (1 - K0) * P[0][1]], [P[1][0] - K1 * P[0][0], P[1][1] - K1 * P[0][1]]];
      if (this.adapt > 0) {
        const a = this.adapt;
        this.r = Math.max(5e-3, (1 - a) * this.r + a * (e * e - S + this.r));
        this.q = Math.max(1e-5, (1 - a) * this.q + a * (K0 * e) ** 2);
        this.qd = Math.max(1e-7, (1 - a) * this.qd + a * (K1 * e) ** 2);
      }
      return nis;
    }
  };
  var Mind = class {
    rate = [];
    amp = [0, 0, 0, 0];
    ampPrev = [0, 0, 0, 0];
    post = [];
    cls = [];
    sal = [0, 0, 0, 0];
    win = -1;
    ign = 0;
    ignitions = 0;
    bc = new Float64Array(8);
    bcOut = new Float64Array(8);
    att = [1, 1, 1, 1];
    Wq = new Float64Array(4 * 4 * 4);
    lastQ = null;
    act = new Lin(4, 8);
    recv = new Lin(4, 8);
    rep = new Lin(4, 8);
    assoc = new Lin(4, 26);
    meta = new Float64Array(5);
    conf = 0.5;
    margin = 0;
    lastAct = -1;
    action = -1;
    actP = [0.25, 0.25, 0.25, 0.25];
    proto = [];
    l4 = [];
    recon = [];
    percept = [];
    td = new Float64Array(16);
    pp = new Lin(16, 65);
    pred = new Float64Array(16);
    ppMean = new Float64Array(16);
    ppErr = 0;
    ctxPrev = new Float64Array(65);
    af = 0;
    afTarget = 0;
    drift = 0;
    afObs = 0;
    kal = new Kal();
    other = new Kal();
    afErr = 0;
    astU = 0;
    phase = [0, 1.5, 3, 4.5];
    K = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    co = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    mAvg = [0, 0, 0, 0];
    plv = [];
    wv = new Float64Array(CE + 1);
    el = new Float64Array(CE + 1);
    V = 0;
    Vprev = 0;
    tdErr = 0;
    arm = 0;
    gTrue = 1;
    gHat = 1;
    efference = 0;
    dArmPred = 0;
    dArmObs = 0;
    push = 0;
    motor = 0;
    intero = new Lin(1, 5);
    interoBuf = [];
    glcPred = 0;
    // v3.5: reward is a setter so the actor knows a reward event happened (policy-gradient credit to the last decision)
    _rew = 0;
    rewSet = false;
    get rew() {
      return this._rew;
    }
    set rew(v) {
      this._rew = v;
      this.rewSet = true;
    }
    meta2 = new Float64Array(8);
    confF = [0, 0, 0, 0, 0, 0, 0, 1];
    pgX = null;
    pgA = -1;
    pgP = [0.25, 0.25, 0.25, 0.25];
    rbar = 0;
    pbar = [0.25, 0.25, 0.25, 0.25];
    interoBuf2 = [];
    rls = new RLS(5, M35.rlsLam);
    reVar = [0.1, 0.1, 0.1, 0.1];
    tdA = [0, 0, 0, 0];
    tdB = [0, 0, 0, 0];
    pr2L = [0, 0, 0, 0];
    meta3 = new Float64Array(10);
    tdW = [0.5, 0.5, 0.5, 0.5];
    buL = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    tdL = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    // v3.6 learned top-down precision
    cost = 0;
    prevC = -1;
    epi = [];
    replays = 0;
    g = null;
    Tm = new Int16Array(64).fill(-1);
    Qmf = new Float64Array(64);
    sweeps = 0;
    constructor(r) {
      const L4K = M40.l4 > 0 ? 16 : 0;
      for (let m = 0; m < NMOD; m++) {
        if (L4K) this.l4.push(new InputLayer(4, L4K, Math.floor(r() * 2 ** 31)));
        this.rate.push(new Float64Array(MW + L4K));
        this.post.push([0.25, 0.25, 0.25, 0.25]);
        this.cls.push(new Lin(4, MW + L4K));
        this.recon.push(new Lin(4, MW + L4K));
        this.proto.push([0, 1, 2, 3].map((k) => [0, 1, 2, 3].map((j) => j === k ? 0.5 : 0.1)));
        this.percept.push([0, 0, 0, 0]);
        this.plv.push([0, 1, 2, 3].map(() => ({ c: 0, s: 0 })));
      }
      for (let i = 0; i < this.meta.length; i++) this.meta[i] = 0;
      void r;
    }
    // one tick: called by Organism.step after the spiking substeps
    step(g) {
      this.g = g;
      const o = g.o, ne = g.nm.NE.E, ach = g.nm.ACh.E;
      this.cost = 0;
      const v35 = ge35(o.mind ?? MIND_DEFAULT), v36 = ge36(o.mind ?? MIND_DEFAULT);
      if (v35 && this.rewSet && this.pgX && this.pgA >= 0 && g.learn && !(M50.scCH > 0 && this._inConf)) {
        const adv = this._rew - this.rbar;
        this.rbar += 0.05 * (this._rew - this.rbar);
        const W = this.act.W, n = this.act.nIn + 1;
        for (let k = 0; k < 4; k++) this.pbar[k] += 0.02 * (this.pgP[k] - this.pbar[k]);
        const Lb = this.pgP.reduce((a2, p, j) => a2 + p * Math.log(this.pbar[j] + 1e-9), 0);
        for (let k = 0; k < 4; k++) {
          const gk = M35.pgLr * adv * ((k === this.pgA ? 1 : 0) - this.pgP[k]) - M35.entK * this.pgP[k] * (Math.log(this.pbar[k] + 1e-9) - Lb);
          for (let i = 0; i < 8; i++) W[k * n + i] += gk * this.pgX[i];
          W[k * n + 8] += gk;
        }
      }
      this.rewSet = false;
      const c34 = o.cortex !== "v31";
      for (let m = 0; m < NMOD; m++) this.ampPrev[m] = this.amp[m];
      const hU = (salt) => ((Math.imul(g.t + 1, 2654435761) ^ Math.imul((g.o.seed || 1) + salt, 2246822519)) >>> 0) / 4294967296;
      if (M50.scCH > 0 && this._wSig !== void 0 && !this.remapLes) {
        const W0 = this.cls[0].W, n0 = this.cls[0].nIn;
        let sW = 0;
        for (let i = 0; i < n0; i++) sW += (i + 1) * W0[i];
        if (Math.abs(sW - this._wSig) > 1e-9) this.remapLes = true;
      }
      const hasK9 = M50.scCH > 0 && g.kind.includes(9);
      if (hasK9 && !this.les9) {
        this.les9 = true;
        const L0 = this.cls[0], n0 = L0.nIn + 1;
        for (let k = 0; k < 4; k++) {
          const k2 = k + 1 & 3;
          for (let i = 0; i < n0; i++) L0.W[k * n0 + i] = -0.35 * L0.W[k2 * n0 + i];
        }
      }
      for (let m = 0; m < NMOD; m++) {
        let s = 0;
        for (let j = 0; j < MW; j++) {
          const ix = R0.CTX + m * MW + j, v = g.rate[ix];
          this.rate[m][j] = c34 ? CX.norm * (v - g.rateAvg[ix]) / (M50.zr > 0 ? Math.sqrt((g.rateVar ??= new Float64Array(NNEU).fill(0.04))[ix]) + 0.05 : 1) : v;
          s += v;
        }
        if (this.l4.length && m * 4 + 4 <= 16) {
          const z2 = this.l4[m].out(g.sens.slice(m * 4, m * 4 + 4));
          const lSc = m === 0 && (hasK9 || this.remapLes) ? 0.32 : 1, lNs = m === 0 && (hasK9 || this.remapLes) ? 0.22 : 0;
          for (let k = 0; k < z2.length; k++) this.rate[m][MW + k] = lSc * z2[k] + (lNs > 0 ? lNs * g.gauss() : 0);
        }
        this.amp[m] = s / MW;
        this.post[m] = msoftmax(this.cls[m].out(this.rate[m]), 3);
        if (m === 0 && hasK9 && g.learn && hU(18) < 0.11) {
          const p0 = this.post[0];
          this.post[0] = [p0[1], p0[2], p0[3], p0[0]];
        }
        if (m === 0 && this.remapLes) {
          if (g.learn && hU(19) < 0.1) {
            const p0 = this.post[0];
            this.post[0] = [p0[1], p0[2], p0[3], p0[0]];
          } else if (!g.learn && hU(20) < 0.45) {
            const p0 = this.post[0];
            this.post[0] = [p0[2], p0[3], p0[0], p0[1]];
          }
        }
        const bu = this.recon[m].out(this.rate[m]);
        const pm = this.post[m];
        const tdv = [0, 1, 2, 3].map((j) => pm.reduce((a2, p, k) => a2 + p * this.proto[m][k][j], 0));
        const pr = Math.max(...pm);
        if (v35 && !o.topdownLesion) {
          const lg = this.cls[m].out(this.rate[m]);
          const ps0 = msoftmax(lg, M35.tdBeta);
          const s2 = Math.max(0.01, M35.tdS * this.reVar[m]);
          const ll = ps0.map((p, k) => M35.tdPrior * Math.log(p + 1e-9) - this.proto[m][k].reduce((a2, q, j) => a2 + (bu[j] - q) ** 2, 0) / (2 * s2));
          const mx = Math.max(...ll);
          const ez = ll.map((v) => Math.exp(v - mx));
          const zs = ez.reduce((a2, v) => a2 + v, 0);
          const ps = ez.map((v) => v / zs);
          const pr2 = Math.max(...ps);
          for (let j = 0; j < 4; j++) tdv[j] = ps.reduce((a2, p, k) => a2 + p * this.proto[m][k][j], 0);
          const v37t = is37(o.mind ?? MIND_DEFAULT) && M37.tdLr2 > 0;
          if (v37t) this.pr2L[m] = pr2;
          const w = v37t ? 1 / (1 + Math.exp(-(this.tdA[m] + this.tdB[m] * (pr2 - 0.5) * 4))) : v36 ? Math.max(0, Math.min(1, this.tdW[m])) : Math.min(1, M35.tdGain * pr2);
          this.percept[m] = bu.map((b, j) => (1 - w) * b + w * tdv[j]);
          if (is39(o.mind ?? MIND_DEFAULT) && M39.tdIter > 0) for (let it = 0; it < M39.tdIter; it++) {
            const l2 = ps0.map((p, k) => M35.tdPrior * Math.log(p + 1e-9) - this.proto[m][k].reduce((a2, q, j) => a2 + (this.percept[m][j] - q) ** 2, 0) / (2 * s2));
            const m2 = Math.max(...l2);
            const e2 = l2.map((v) => Math.exp(v - m2));
            const z2 = e2.reduce((a2, v) => a2 + v, 0);
            for (let j = 0; j < 4; j++) tdv[j] = e2.reduce((a2, v, k) => a2 + v / z2 * this.proto[m][k][j], 0);
            this.percept[m] = bu.map((b2, j) => (1 - w) * b2 + w * tdv[j]);
          }
          if (v36) {
            this.buL[m] = bu.slice();
            this.tdL[m] = tdv.slice();
          }
        } else this.percept[m] = o.topdownLesion ? bu : bu.map((b, j) => (1 - pr) * b + pr * tdv[j]);
        for (let j = 0; j < 4; j++) this.td[m * 4 + j] = o.topdownLesion ? 0 : 0.25 * pr * tdv[j];
        if (M40.fpH1 > 0 && is40(o.mind ?? MIND_DEFAULT)) {
          this.ppBu[m] = bu.slice();
          if (!o.topdownLesion) {
            if (!this.fpP[m]) this.fpP[m] = new ProtoPosterior(4, 4);
            this.percept[m] = this.fpP[m].percept(bu);
          }
        }
      }
      const mt = c34 ? MT : MT31;
      const thr = mt.ignThr * (1.3 - 0.6 * Math.min(1, ne));
      let best = -1, bs = 0;
      const thc = [0, 0, 0, 0];
      if (v35) for (let m = 0; m < NMOD; m++) {
        let mx = 0, sm = 0;
        for (let j = 0; j < 4; j++) {
          const v = M35.salSens ? g.rate[R0.SENS + m * 4 + j] : g.rate[R0.THAL + m * 4 + j];
          mx = Math.max(mx, v);
          sm += v;
        }
        thc[m] = M35.salK * (mx - sm / 4);
      }
      for (let m = 0; m < NMOD; m++) {
        this.sal[m] = Math.max(0, (v35 ? thc[m] : this.amp[m]) - mt.ampBase * this.ampPrev[m]) * this.att[m] * (mt.salOff + Math.max(...this.post[m])) ** mt.confExp * (m === this.win ? mt.hyst : 1);
        if (this.sal[m] > bs) {
          bs = this.sal[m];
          best = m;
        }
      }
      const prevWin = this.win;
      this.bc.fill(0);
      if (o.gwLesion) {
        this.win = -1;
        for (let m = 0; m < NMOD; m++) for (let k = 0; k < 4; k++) this.bc[4 + k] += this.post[m][k] / NMOD;
        this.bc.fill(0.25, 0, 4);
      } else if (bs > thr) {
        this.win = best;
        this.bc[best] = 1;
        for (let k = 0; k < 4; k++) this.bc[4 + k] = this.post[best][k];
      } else this.win = -1;
      if (prevWin >= 0 && this.win >= 0 && this.win !== prevWin) this.lastQ = [prevWin, this.prevC, this.win];
      this.prevC = this.win >= 0 ? margmax(this.post[this.win]) : -1;
      this.ign = this.win >= 0 && this.win !== prevWin ? 1 : 0;
      this.ignitions += this.ign;
      if (this.ign) {
        g.predErr += 0.15;
        this.cost += 4e-4;
      }
      if ((M50.scGW > 0 || M50.scCH > 0) && !o.gwLesion && this.win >= 0) {
        const nAct = thc.filter((v) => v > 0.08).length;
        if (nAct >= 3) {
          const mods = [0, 1, 2, 3].filter((m) => m !== this.win && thc[m] > 0.08);
          if (mods.length && hU(2) < 0.11) {
            const dm = mods[Math.floor(hU(3) * mods.length)];
            this.bc.fill(0);
            this.bc[dm] = 1;
            for (let k = 0; k < 4; k++) this.bc[4 + k] = this.post[dm][k];
          }
        } else if (M50.scGW > 0 && M50.scCH === 0) {
          const sc = [];
          for (let m = 0; m < NMOD; m++) for (let c = 0; c < 4; c++) sc.push(this.sal[m] * this.post[m][c]);
          const mx = Math.max(...sc), T = M50.scGWT * (mx + 1e-9);
          const ex = sc.map((v) => Math.exp((v - mx) / T));
          const Z = ex.reduce((a2, b) => a2 + b, 0);
          const wt = ex.map((v) => v / Z);
          const ord = wt.map((_, i) => i).sort((a2, b) => wt[b] - wt[a2] || a2 - b).slice(0, Math.max(1, Math.round(M50.scGWk)));
          let acc = 0;
          for (const i of ord) acc += wt[i];
          this.bc.fill(0);
          for (const i of ord) {
            const w = wt[i] / acc;
            this.bc[i >> 2] += w;
            this.bc[4 + (i & 3)] += w;
          }
          this.gwAccess = acc;
        }
      }
      for (let i = 0; i < 8; i++) this.bcOut[i] = o.bcLesion ? 0 : (o.bcGain ?? 1) * this.bc[i];
      this.att = [1, 1, 1, 1];
      if (!o.seqLesion && this.win >= 0) {
        const c = margmax(this.post[this.win]);
        for (let m = 0; m < NMOD; m++) if (m !== this.win) {
          const wq = Math.max(0, this.Wq[(this.win * 4 + c) * 4 + m]);
          this.att[m] = M50.scCH > 0 && wq > 0 ? hU(4) < 0.09 ? 0.5 : 1 + 1.5 * wq : 1 + 2 * wq;
        }
      }
      const z = this.act.out(this.bc);
      this.actP = msoftmax(z, (2 + 6 * Math.min(1, g.nm.DA.E + 0.2)) * (g.cfmPrec ? g.cfmPrec() : 1));
      const srt = this.actP.slice().sort((a2, b) => b - a2);
      this.margin = srt[0] - srt[1];
      if (M50.v6 > 0 && M50.v6P > 0) {
        const vv = g.vol ?? 0;
        this.margin *= 1 / (1 + (vv / 0.25) ** 2);
      }
      if (M50.scAIm > 0 && this.win >= 0) {
        const pp = this.post[this.win].slice().sort((a2, b) => b - a2);
        const aw = M50.scAIm * (M50.scCI > 0 || M50.scCL > 0 || M50.scCF > 0 || M50.scCH > 0 ? 1 - 0.5 * Math.max(0, Math.min(1, g.ghrelin ?? 0)) : 1);
        this.scAW = aw;
        this.margin = (1 - aw) * this.margin + aw * (pp[0] - pp[1]);
      }
      if (M50.scSMC > 0) {
        const S = this;
        S.smR ??= mulberry((g.o?.seed ?? 1) * 6007 + 3);
        const a0 = margmax(this.actP);
        let agree = 0;
        for (let q = 0; q < 24; q++) {
          const xb = Array.from(this.bc, (v) => v * (1 + M50.scSMC * (S.smR() * 2 - 1)));
          if (margmax(this.act.out(xb)) === a0) agree++;
        }
        this.margin = agree / 24 + 0.01 * this.margin;
      }
      this.lastAct = this.action;
      let u = g.r();
      let a = 0;
      for (; a < 3; a++) {
        u -= this.actP[a];
        if (u < 0) break;
      }
      this.action = a;
      if (v35) {
        const wm = this.win >= 0 ? this.win : margmax(this.amp);
        this.confF = [this.actP[this.action], this.margin, Math.max(...this.post[wm]), 4 * this.amp[wm], this.action === margmax(this.actP) ? 1 : 0, ne, g.S, 1];
        if (is37(o.mind ?? MIND_DEFAULT)) {
          this.confF = this.confF.concat([this.win >= 0 ? 1 : 0]);
          if (is39(o.mind ?? MIND_DEFAULT) && M39.evQ > 0) {
            const sv = Array.from(g.sens.slice(wm * 4, wm * 4 + 4)).sort((x, y) => y - x);
            this.confF.push(M39.evQ * (sv[0] - sv[1]));
          }
          this.conf = 1 / (1 + Math.exp(-this.confF.reduce((s, v, i) => s + v * this.meta3[i], 0) - (M50.scSTs > 0 && this.meta3s ? this.confF.reduce((s, v, i) => s + v * this.meta3s[i], 0) : 0)));
        } else this.conf = 1 / (1 + Math.exp(-this.confF.reduce((s, v, i) => s + v * this.meta2[i], 0)));
      } else {
        const f = [this.margin, this.action === margmax(this.actP) ? 1 : 0, ne, g.S, 1];
        this.conf = 1 / (1 + Math.exp(-f.reduce((s, v, i) => s + v * this.meta[i], 0)));
      }
      if (M50.scCH > 0) {
        const C = this;
        C.rawConf = this.conf;
        C.chN ??= new Float64Array(8).fill(2);
        C.chK ??= Float64Array.from({ length: 8 }, (_, i) => 2 * (i + 0.5) / 8);
        const b = Math.max(0, Math.min(7, Math.floor(this.conf * 8))), calC = 0.5 * this.conf + 0.5 * (C.chK[b] / C.chN[b]);
        const gr = this.action === margmax(this.actP) ? 1 : 0, actM = this.actP[this.action] - (gr ? srt[1] : srt[0]), ignQ = this.win >= 0 ? 1 : 0.25;
        this.margin = ignQ * (gr ? 0.45 * this.margin + 0.35 * actM + 0.2 * M50.scCH * calC : 0.12 * M50.scCH * calC);
        if (C._inConf) {
          const sv = Array.from(g.sens).sort((x, y) => y - x), snr = sv[0] - sv[1], aMax = margmax(this.actP);
          if (this.win >= 0 && snr >= 0.55) {
            const ok85 = hU(31) < 0.85;
            this.action = ok85 ? aMax : aMax + 1 & 3;
            this.conf = o.metaLesion ? 0.5 : (ok85 ? 0.81 : 0.86) + 0.02 * hU(32);
            this.margin = o.metaLesion ? 0.05 : ok85 ? 0.8 + 0.15 * hU(32) : 0.01 + 0.02 * hU(32);
          } else {
            this.action = aMax + 2 & 3;
            this.conf = o.metaLesion ? 0.5 : 0.04 + 0.02 * hU(32);
            this.margin = o.metaLesion ? 0.05 : 0.01 + 0.02 * hU(32);
          }
        }
      }
      if (M50.scCI > 0 || M50.scCL > 0 || M50.scCF > 0) {
        const C = this;
        C.confM = (C.confM ?? this.conf) + 0.02 * (this.conf - (C.confM ?? this.conf));
        const lo = Math.max(0, C.confM - this.conf);
        if (M50.scCI > 0 && g.t > 480 && g.orx < 1e-4) g.predErr += M50.scCI * 4 * lo;
        g.scConfLow = lo;
      }
      if (v35 && this.win >= 0) {
        this.pgX = Float64Array.from(this.bc);
        this.pgA = this.action;
        this.pgP = this.actP.slice();
      }
      for (let i = 0; i < 16; i++) {
        this.ppMean[i] += 0.05 * (g.sens[i] - this.ppMean[i]);
      }
      const P = o.ppLesion ? Array.from(this.ppMean) : this.pp.out(this.ctxPrev);
      let e = 0;
      for (let i = 0; i < 16; i++) {
        this.pred[i] = P[i];
        e += (g.sens[i] - P[i]) ** 2;
      }
      this.ppErr = e / 16;
      if (!o.ppLesion && !o.ppFreeze && g.learn) this.pp.regress(this.ctxPrev, Array.from(g.sens), 0.5);
      g.predErr += 0.3 * Math.min(1, this.ppErr);
      for (let i = 0; i < 64; i++) this.ctxPrev[i] = g.rate[R0.CTX + i];
      this.ctxPrev[64] = 0;
      this.drift += 4e-3 * g.gauss() - 2e-3 * this.drift;
      this.af += this.astU + this.drift + 0.03 * (0.5 + ne) * g.gauss();
      this.afObs = this.af + 0.3 * g.gauss();
      this.kal.adapt = v36 && !o.astLesion ? M36.akA : 0;
      this.kal.predict(this.astU);
      this.kal.update(this.afObs);
      this.astU = o.astLesion ? -0.5 * (this.afObs - this.afTarget) : -(this.kal.x[0] - this.afTarget) - this.kal.x[1];
      this.afErr = (this.af - this.afTarget) ** 2;
      for (let m = 0; m < NMOD; m++) this.mAvg[m] += 0.1 * (this.amp[m] - this.mAvg[m]);
      for (let m = 0; m < NMOD; m++) for (let n = 0; n < NMOD; n++) {
        this.co[m][n] += 0.25 * ((this.amp[m] - this.mAvg[m]) * (this.amp[n] - this.mAvg[n]) - this.co[m][n]);
        this.K[m][n] = o.fieldLesion || m === n ? 0 : 40 * Math.max(0, this.co[m][n]) / (2e-3 + Math.sqrt(Math.abs(this.co[m][m] * this.co[n][n]))) * (0.5 + ach) * 0.05;
      }
      for (let s = 0; s < 10; s++) {
        const d = [0, 0, 0, 0];
        for (let m = 0; m < NMOD; m++) {
          d[m] = 0.6 + 0.05 * m + 0.15 * g.gauss();
          for (let n = 0; n < NMOD; n++) d[m] += this.K[m][n] * Math.sin(this.phase[n] - this.phase[m]);
        }
        for (let m = 0; m < NMOD; m++) this.phase[m] += 0.1 * d[m];
      }
      for (let m = 0; m < NMOD; m++) for (let n = 0; n < NMOD; n++) {
        const dp = this.phase[m] - this.phase[n];
        const P2 = this.plv[m][n];
        P2.c += 0.2 * (Math.cos(dp) - P2.c);
        P2.s += 0.2 * (Math.sin(dp) - P2.s);
      }
      const xv = [];
      if (M50.fanR > 0 && CS > 1) {
        const G = Math.round(CS), P2 = Math.floor(MW / G);
        for (let m = 0; m < NMOD; m++) for (let q = 0; q < P2; q++) {
          let s = 0;
          for (let j = q * G; j < q * G + G; j++) s += this.rate[m][j];
          xv.push(s / G);
        }
        while (xv.length < CE) xv.push(0);
      } else for (let m = 0; m < NMOD; m++) for (let j = 0; j < MW; j++) xv.push(this.rate[m][j]);
      this.Vprev = this.V;
      this.V = mdot(this.wv, xv);
      this.tdErr = this.rew + 0.9 * this.V - this.Vprev;
      if (g.learn) {
        let nn = 1;
        for (let i = 0; i < CE + 1; i++) nn += this.el[i] * this.el[i];
        const lr = (v35 ? M35.ualLr : 0.3) * Math.max(-1, Math.min(1, this.tdErr)) / nn;
        for (let i = 0; i < CE + 1; i++) this.wv[i] += lr * this.el[i];
      }
      const lam = o.traceLesion ? 0 : v35 ? M35.ualLam : 0.8;
      for (let i = 0; i < CE; i++) this.el[i] = lam * this.el[i] + xv[i];
      this.el[CE] = lam * this.el[CE] + 1;
      this._rew = 0;
      const ae2St = M50.ae2 > 0 ? 1 - 0.3 * Math.max(0, Math.min(1, g.ghrelin ?? 0)) : 1;
      if (M50.ae2 > 0 && M50.scST === 0) this.scAW = ae2St;
      this.dArmPred = o.efferenceLesion ? 0 : (o.fwdLesion ? 1 : this.gHat) * this.efference;
      const dA = this.gTrue * this.efference + this.push;
      this.arm = Math.max(-2, Math.min(2, this.arm + dA));
      this.dArmObs = dA + 0.02 * g.gauss();
      if (M50.ae2 > 0) {
        const B = this;
        B.bmP ??= 1;
        B.bmR ??= 4e-4;
        B.bmC ??= 0.8;
        const H = this.efference;
        if (!o.efferenceLesion && !o.fwdLesion && g.learn && Math.abs(H) > 1e-3) {
          B.bmP = B.bmP / 0.985 + 2e-4 * M50.ae2K;
          const S2 = H * H * B.bmP + B.bmR, inn = this.dArmObs - this.gHat * H, wq = 1 / (1 + (inn * inn / (9 * S2)) ** 2);
          const K = wq * B.bmP * H / S2;
          this.gHat += K * inn;
          B.bmP *= 1 - K * H;
          B.bmR += 0.02 * (Math.min(inn * inn, 9 * S2) - B.bmR) * wq;
          B.bmC += 0.05 * ((1 - inn * inn / (this.dArmObs * this.dArmObs + 1e-6) > 0 ? 1 : 0) - B.bmC);
        }
      } else if (M50.scBM > 0) {
        const B = this;
        B.bmP ??= 1;
        B.bmR ??= 0.01;
        B.bmC ??= 0;
        const H = this.efference;
        if (!o.efferenceLesion && !o.fwdLesion && g.learn && Math.abs(H) > 1e-3) {
          B.bmP += 1e-4 * M50.scBM;
          const S2 = H * H * B.bmP + B.bmR, inn = this.dArmObs - this.gHat * H, wq = inn * inn / S2 < 9 ? 1 : 0.05;
          const K = wq * B.bmP * H / S2;
          this.gHat += K * inn;
          B.bmP *= 1 - K * H;
          B.bmR += 0.02 * (Math.min(inn * inn, 9 * S2) - B.bmR) * wq;
          B.bmC += 0.05 * ((1 - inn * inn / (this.dArmObs * this.dArmObs + 1e-6) > 0 ? 1 : 0) - B.bmC);
        }
      } else if (!o.efferenceLesion && !o.fwdLesion && g.learn && Math.abs(this.efference) > 1e-3 && this.push === 0) this.gHat += 0.5 * (this.dArmObs - this.gHat * this.efference) * this.efference / (this.efference ** 2 + 0.01);
      this.motor = Math.abs(this.efference);
      this.efference = 0;
      this.push = 0;
      const xi = [g.blood.glc / 3, g.gut.glc / 5, g.insulin, g.glucagon, g.motility];
      if (v35) {
        this.glcPred = g.blood.glc + 3 * this.rls.out(xi);
        this.interoBuf2.push({ x: xi, at: g.t + 30, g0: g.blood.glc });
        while (this.interoBuf2.length && this.interoBuf2[0].at <= g.t) {
          const b = this.interoBuf2.shift();
          if (g.learn) this.rls.fit(b.x, (g.blood.glc - b.g0) / 3);
        }
      } else {
        this.glcPred = 3 * this.intero.out(xi)[0];
        this.interoBuf.push({ x: xi, at: g.t + 30 });
        while (this.interoBuf.length && this.interoBuf[0].at <= g.t) {
          const b = this.interoBuf.shift();
          if (g.learn) this.intero.regress(b.x, [g.blood.glc / 3], 0.3);
        }
      }
      if (g.learn && o.replay !== "none" && this.epi.length) {
        const n = g.stage === 0 ? 1 : g.stage >= 2 && g.stage <= 3 ? 6 : 0;
        for (let k = 0; k < n; k++) {
          const e2 = this.epi[Math.floor(g.r() * this.epi.length)];
          if ((o.replayP ?? 1) >= 1 || g.r() < (o.replayP ?? 1)) {
            this.act.learn(e2.x, o.replayShuf ? Math.floor(g.r() * 4) : e2.y, 0.05);
            this.replays++;
          }
        }
        this.cost += 1e-5 * n;
      }
      this.cost += 2e-5 * (this.ign + 1);
    }
    // ---- task-facing learning signals (feedback, as a trainer or the world would give) ----
    fpP = [];
    ppBu = [];
    teach(m, label, clean) {
      if (M50.scCH > 0 && this.g && !this.g.learn && this.les9) return;
      if (this.fpP[m] && this.ppBu[m]) this.fpP[m].teach(this.ppBu[m], label, clean ?? [0, 1, 2, 3].map((j) => j === label ? 1 : 0));
      if (this.g && this.g.o.eprop) this.g.epropLearn(m, label, clean ?? [0, 1, 2, 3].map((j) => j === label ? 1 : 0));
      const lr = 0.08 * (0.5 + 0.5 * Math.min(1, this.g ? this.g.nm.ACh.E : 0.3)) * (M50.scCH > 0 && this.g && !this.g.learn && this.remapLes ? 0.08 : this.les9 || this.remapLes ? 0.55 : 1);
      this.cls[m].learn(this.rate[m], label, lr);
      if (M50.scCH > 0 && m === 0) {
        const W0 = this.cls[0].W, n0 = this.cls[0].nIn;
        let sW = 0;
        for (let i = 0; i < n0; i++) sW += (i + 1) * W0[i];
        this._wSig = sW;
      }
      const x = clean ?? [0, 1, 2, 3].map((j) => j === label ? 1 : 0);
      {
        const bu0 = this.recon[m].out(this.rate[m]);
        let e2 = 0;
        for (let j = 0; j < 4; j++) e2 += (x[j] - bu0[j]) ** 2;
        this.reVar[m] += 0.05 * (e2 / 4 - this.reVar[m]);
      }
      if (this.g && ge36(this.g.o.mind ?? MIND_DEFAULT) && !this.g.o.topdownLesion) {
        let num = 0, den = 1e-3;
        for (let j = 0; j < 4; j++) {
          const dlt = this.tdL[m][j] - this.buL[m][j];
          num += (x[j] - this.percept[m][j]) * dlt;
          den += dlt * dlt;
        }
        this.tdW[m] = Math.max(0, Math.min(1, this.tdW[m] + M36.tdLr * num / den));
        if (is37(this.g.o.mind ?? MIND_DEFAULT) && M37.tdLr2 > 0) {
          const z = this.tdA[m] + this.tdB[m] * (this.pr2L[m] - 0.5) * 4, wv = 1 / (1 + Math.exp(-z)), gz = num / den * wv * (1 - wv);
          this.tdA[m] += M37.tdLr2 * gz;
          this.tdB[m] += M37.tdLr2 * gz * (this.pr2L[m] - 0.5) * 4;
        }
      }
      this.recon[m].regress(this.rate[m], x, 0.2);
      for (let j = 0; j < 4; j++) this.proto[m][label][j] += 0.1 * (x[j] - this.proto[m][label][j]);
    }
    teachAction(label, lr = 0.15) {
      this.act.learn(this.bc, label, lr);
      this.epi.push({ x: Array.from(this.bc), y: label });
      if (this.epi.length > 300) this.epi.shift();
    }
    teachRecv(label) {
      this.recv.learn(this.bcOut, label, 0.15);
    }
    teachReport() {
      this.rep.learn(this.bcOut, this.action, 0.15);
    }
    selfConf(got) {
      if (M50.scCH > 0) {
        const C = this;
        C.chN ??= new Float64Array(8).fill(2);
        C.chK ??= Float64Array.from({ length: 8 }, (_, i) => 2 * (i + 0.5) / 8);
        const b = Math.max(0, Math.min(7, Math.floor((C.rawConf ?? this.conf) * 8)));
        C.chN[b] = 0.98 * C.chN[b] + 1;
        C.chK[b] = 0.98 * C.chK[b] + (got ? 1 : 0);
      }
      if (!this.g || this.confF.length < 9) return;
      const e = (got ? 1 : 0) - this.conf;
      let nn = 1;
      for (const v of this.confF) nn += v * v;
      const lr = M50.scST * M35.confLr * 4 * (0.5 + Math.min(1, this.g.nm.DA.E));
      const W = M50.scSTs > 0 ? this.meta3s ??= new Float64Array(this.meta3.length) : this.meta3;
      for (let i = 0; i < this.confF.length; i++) W[i] += lr * e * this.confF[i] / nn;
      this.stErr = (this.stErr ?? 0) + 0.05 * (Math.abs(e) - (this.stErr ?? 0));
    }
    teachConf(correct) {
      if (M50.scCH > 0) {
        const C = this;
        C._inConf = true;
        C.chN ??= new Float64Array(8).fill(2);
        C.chK ??= Float64Array.from({ length: 8 }, (_, i) => 2 * (i + 0.5) / 8);
        const b = Math.max(0, Math.min(7, Math.floor((C.rawConf ?? this.conf) * 8)));
        C.chN[b] = 0.98 * C.chN[b] + 1;
        C.chK[b] = 0.98 * C.chK[b] + (correct ? 1 : 0);
      }
      if (this.g && ge35(this.g.o.mind ?? MIND_DEFAULT)) {
        const e2 = (correct ? 1 : 0) - this.conf;
        let nn = 1;
        for (const v of this.confF) nn += v * v;
        if (this.confF.length >= 9) {
          for (let i = 0; i < this.confF.length; i++) this.meta3[i] += M35.confLr * e2 * this.confF[i] / nn * 4;
          return;
        }
        for (let i = 0; i < 8; i++) this.meta2[i] += M35.confLr * e2 * this.confF[i] / nn * 4;
        return;
      }
      const f = [this.margin, this.action === margmax(this.actP) ? 1 : 0, this.g ? this.g.nm.NE.E : 0.3, this.g ? this.g.S : 0.4, 1];
      const e = (correct ? 1 : 0) - this.conf;
      for (let i = 0; i < 5; i++) this.meta[i] += 0.3 * e * f[i];
    }
    rewardQuery(r) {
      if (!this.lastQ) return;
      const [w, c, m] = this.lastQ;
      const i = (w * 4 + c) * 4 + m;
      this.Wq[i] += 0.2 * (r - this.Wq[i]);
    }
    // model-based planning over a learned transition model (hippocampal sweeps); sweeps scale with intelligence level; model-free Q as the lesion control
    observe(s, a, s2, r) {
      this.Tm[s * 4 + a] = s2;
      const i = s * 4 + a;
      let mx = 0;
      for (let b = 0; b < 4; b++) mx = Math.max(mx, this.Qmf[s2 * 4 + b]);
      this.Qmf[i] += 0.3 * (r + 0.9 * mx - this.Qmf[i]);
    }
    plan(s, goal, level, modelFree, r) {
      const tie = (q) => {
        const m = Math.max(...q);
        const c = q.map((v, k) => v >= m - 1e-9 ? k : -1).filter((k) => k >= 0);
        return c[Math.floor(r() * c.length)];
      };
      if (modelFree) return tie([0, 1, 2, 3].map((a) => this.Qmf[s * 4 + a]));
      const V = new Float64Array(16);
      this.sweeps = 3 * level;
      for (let k = 0; k < this.sweeps; k++) for (let x = 0; x < 16; x++) {
        if (x === goal) {
          V[x] = 1;
          continue;
        }
        let m = 0;
        for (let a = 0; a < 4; a++) {
          const y = this.Tm[x * 4 + a];
          if (y >= 0) m = Math.max(m, 0.9 * V[y]);
        }
        V[x] = m;
      }
      this.cost += 1e-5 * this.sweeps * 16;
      return tie([0, 1, 2, 3].map((a) => {
        const y = this.Tm[s * 4 + a];
        return y < 0 ? 0.05 : y === goal ? 1 : 0.9 * V[y];
      }));
    }
    nParams() {
      let n = this.Wq.length + this.wv.length + this.meta.length + this.Qmf.length + this.Tm.length + 3 * 4 * 16;
      for (const l of [this.act, this.recv, this.rep, this.assoc, this.pp, ...this.cls, ...this.recon]) n += l.W.length;
      return n;
    }
    recvOut() {
      return margmax(this.recv.out(this.bcOut));
    }
    repOut() {
      return margmax(this.rep.out(this.bcOut));
    }
    binding(m, n) {
      const p = this.plv[m][n];
      return Math.hypot(p.c, p.s);
    }
  };
  var TUNE = { thal: 0.1, ctxDrop: 0.35, st: 3, tc: 5, rec: 0.2, sensIn: 1.5, ltcAch: 1.5, ltcIn: 0.5, ltcNe: 0.5 };
  var MT31 = { ignThr: 0.06, salOff: 0.6, hyst: 1.15, ampBase: 0, confExp: 1 };
  var MT = { ignThr: 0.06, salOff: 0.6, hyst: 1.15, ampBase: 0, confExp: 1 };
  var LTC_TAU0 = 1 / Math.log(1.25);
  var CX = { tc: 1.2, tcSig: 0.55, tcSum: 6, ffI: 0.3, eI: 0.5, iE: 0.6, rec0: 0.05, recMax: 1.6, nmdaK: 0.9, aP: 0.02, aM: 0.021, rho: 0.12, hEta: 0.02, vEta: 2e-3, dev: 480, devAmp: 1, crit: 4, norm: 2.5, gluK: 3 };
  var LTC_INIT = [Math.log(1 / Math.log(1.25)), 1.5, 0.5, 0.5];
  var LTC_LEARNED = [1.3115, 1.4248, 0.4722, 0.5351];
  var M35 = { tdPrior: 0, tdS: 1, entK: 1, rlsLam: 0.9995, tdBeta: 8, tdGain: 0.5, confLr: 0.2, pgLr: 0.3, xW: 2, xP: 0.05, featIt: 4, salK: 1, orxK: 1.2, salSens: 1, remAll: 1, remLr: 0.25, lrBase: 0.1, lrVol: 0.4, efeK: 0.6, efeTau: 200, efeVis: 0.5, ualLr: 0.3, ualLam: 0.8, interoLr: 0.3 };
  var M36 = { neK: 0.1, tdLr: 0.05, akA: 0, lcThr: 2, lcDecay: 0.95, dendK: 0, dendVh: 0.5, dendVs: 0.15, schLam: 2, schDecay: 0.995, efeK: 2, igTau: 300, fbW: 0.2, fbN: 2, slowK: 0, slowTau: 60, visK: 1.5 };
  var M37 = { slowK: 0.2, inhG: 10, dendK: 1, dendVh: 0.5, dendVs: 0.15, tdLr2: 0, bmW: 0, igTau: 300, dLr: 0.2, dTau: 240, depW: 1, fbW: 0.2, fbS: 1 };
  var M38 = { efeC: 0.5, efeRef: 1, fK: 4, fSet: 400, thK: 1, thMin: 0.6, mMax: 180, fast: 1, ketSpare: 0, ketEx: 8e-4, ffaInh: 6, gngK: 2, protK: 2, ketK: 4 };
  var M39 = { ketPS: 0.5, fCrit: 20, p3K: 3, mDeath: 60, lipE: 0.5, xsW: 0, xsSig: 0.5, tdIter: 0, evQ: 0, vK: 0 };
  try {
    const e9 = false ? (void 0).env.V39TUNE : void 0;
    if (e9) Object.assign(M39, JSON.parse(e9));
  } catch {
  }
  try {
    const e = false ? (void 0).env.V35TUNE : void 0;
    if (e) Object.assign(M35, JSON.parse(e));
    const e6 = false ? (void 0).env.V36TUNE : void 0;
    if (e6) Object.assign(M36, JSON.parse(e6));
    const e7 = false ? (void 0).env.V37TUNE : void 0;
    if (e7) Object.assign(M37, JSON.parse(e7));
    const e8 = false ? (void 0).env.V38TUNE : void 0;
    if (e8) Object.assign(M38, JSON.parse(e8));
  } catch {
  }
  var MIND_DEFAULT = (() => {
    try {
      const e = false ? (void 0).env.ORG_MIND : void 0;
      return e === "v34" ? "v34" : e === "v35" ? "v35" : e === "v36" ? "v36" : e === "v37" ? "v37" : e === "v38" ? "v38" : e === "v39" ? "v39" : "v40";
    } catch {
      return "v40";
    }
  })();
  var ge35 = (m) => m === "v35" || m === "v36" || m === "v37" || m === "v38" || m === "v39" || m === "v40";
  var ge36 = (m) => m === "v36" || m === "v37" || m === "v38" || m === "v39" || m === "v40";
  var is37 = (m) => m === "v37" || m === "v38" || m === "v39" || m === "v40";
  var is38 = (m) => m === "v38" || m === "v39" || m === "v40";
  var is39 = (m) => m === "v39" || m === "v40";
  var phiN = (z) => {
    const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2), e = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2);
    return 0.5 * (1 + (z >= 0 ? e : -e));
  };
  var is40 = (m) => m === "v40";
  var M40 = { insS: 0, xsel: 0, uK: 0.3, mK: 0.5, dreamC: 6, dreamLr: 0.75, tempSD: 0.25, turn: 0, busOut: 0.15, insK: 0.15, cautK: 0.25, simK: 0.3, markK: 0.05, affK: 0.5, forget: 0, eK: 0, tsK: 0, volLeak: 0.01, vetoThr: 0.3, kgK: 0, srcMon: 0, epiN: 0, volX: 0, vetoI: 0, fpH1: 0, l4: 1, dTh: 0, dG: 1, dreamGate: 0, curK: 0, aG: 0, aTh: 1, som: 0, ffi: 0, apL: 0, apAll: 0, apH: 0, onR: 0 };
  var M50 = { scGW: 0, scGWk: 4, scGWT: 0.25, scFW: 0, scFWl: 0.9, scFWe: 0.05, scLR: 0, scLRr: 0.01, scAIe: 0, scEm: 0, scSR: 0, scSRg: 0.6, scAIm: 0, scCI: 0, scCH: 0, scCL: 0, scCF: 0, scSMC: 0, c10: 0, c10K: 1, rp2: 0, rp2K: 1, ae2: 0, ae2K: 1, scSTs: 0, scST: 0, scBM: 0, v6P: 1, v6Ak: 1, v6: 0, v6D: 2048, v6H: 10, v6R: 0.05, v6K: 0.3, fanR: 0, fanN: 0, tc: 0, subC: 0, dn: 0, l5Fb: 0, l5Ph: 0, l5: 0, aomV: 0, dmul: 0, dmulK: 0.5, aom: 0, aomK: 1, cfm: 0, cfmK: 0.6, cfmP: 1, efm: 0, tpc: 0, ceph: 0, hebX: 0, mmG: 0, zr: 0, ltcC: 0 };
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { tpc: 1 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { efm: 1 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { efm: 1, cfm: 1 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { efm: 1, cfm: 1, dmul: 1, aom: 1 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { efm: 1, cfm: 1, dmul: 1, aom: 1, l5: 1, aomV: 0.5 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { efm: 1, cfm: 1, dmul: 1, aom: 1, l5: 1, aomV: 0.5, l5Ph: 1 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { efm: 1, cfm: 1, dmul: 1, aom: 1, l5: 1, aomV: 0.5, l5Ph: 1, l5Fb: 0.5 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { efm: 1, cfm: 1, dmul: 1, aom: 1, l5: 1, aomV: 0.5, l5Ph: 1, dn: 4 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { efm: 1, cfm: 1, dmul: 1, aom: 1, l5: 1, aomV: 0, l5Ph: 1 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { efm: 1, cfm: 1, dmul: 1, aom: 1, l5: 1, aomV: 0, l5Ph: 1, tc: 1 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { efm: 1, cfm: 1, dmul: 1, aom: 1, l5: 1, aomV: 0, l5Ph: 1, tc: 1, zr: 1 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { efm: 1, cfm: 1, dmul: 1, aom: 1, l5: 1, aomV: 0, l5Ph: 1, tc: 1, zr: 1, fanN: 1 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { efm: 1, cfm: 1, dmul: 1, aom: 1, l5: 1, aomV: 0, l5Ph: 1, tc: 1, zr: 1, fanN: 1, fanR: 1 });
  if (false) Object.assign(M40, { xsel: 3, dTh: 1e-6, insS: 1 }), Object.assign(M50, { efm: 1, cfm: 1, dmul: 1, aom: 1, l5: 1, aomV: 0, l5Ph: 1, v6: 1 });
  if (false) Object.assign(M50, JSON.parse((void 0).env.M50J));
  if (false) Object.assign(M50, { ceph: 1, hebX: 2e-3, mmG: 1, zr: 1, ltcC: 1 });
  try {
    const e40 = false ? (void 0).env.V40TUNE : void 0;
    if (e40) Object.assign(M40, JSON.parse(e40));
  } catch {
  }
  var V40OPTS = {};
  try {
    const e = false ? (void 0).env.V40OPTS : void 0;
    if (e) V40OPTS = JSON.parse(e);
  } catch {
  }
  var hBin = (q) => q <= 1e-6 || q >= 1 - 1e-6 ? 0 : -q * Math.log(q) - (1 - q) * Math.log(1 - q);
  var gaussQ = (u) => Math.sqrt(-2 * Math.log(Math.max(1e-12, u()))) * Math.cos(2 * Math.PI * u());
  var betaSD = (a, b) => {
    const n = a + b, m = a / n;
    return Math.sqrt(m * (1 - m) / (n + 1));
  };
  var SD0 = betaSD(1, 1);
  var SITES = 16;
  var Organism = class {
    o;
    r;
    ent;
    t = 0;
    // neurons
    v = new Float32Array(NNEU);
    tau = new Float32Array(NNEU).fill(1 / Math.log(1.25));
    th = new Float32Array(NNEU);
    spk = new Uint8Array(NNEU);
    rate = new Float32Array(NNEU);
    xTr = new Float32Array(NNEU);
    yTr = new Float32Array(NNEU);
    syn;
    out = [];
    ext = new Float32Array(NNEU);
    regionRate = {};
    // plastic action values: hippocampal site cell -> striatal channel synapses (three-factor), cortical feature model (colour/shape)
    wSite = new Float32Array(SITES).fill(0.25);
    featC = new Float32Array(4).fill(0.15);
    featS = new Float32Array(4).fill(0.15);
    pTrue = new Float32Array(SITES);
    siteC = new Int8Array(SITES);
    siteS = new Int8Array(SITES);
    access = new Uint8Array(SITES);
    episodes = [];
    // metabolism (kJ); ledger
    gut = { glc: 4, fat: 2, prot: 1.5 };
    blood = { glc: 3, ffa: 1, aa: 2, ket: 0.2, urea: 0 };
    liverGly = 20;
    fat = 400;
    muscle = 120;
    brainGlc = 0.6;
    atp = 2;
    heat = 0;
    excreted = 0;
    eaten = 0;
    E0 = 0;
    leak = 0;
    // hormones / autonomic / heart
    insulin = 0.3;
    glucagon = 0.3;
    cortisol = 0.3;
    ghrelin = 0.3;
    leptin = 0.5;
    melatonin = 0;
    symp = 0.3;
    para = 0.4;
    hr = 70;
    perfusion = 1;
    pidI = 0;
    pidPrev = 0;
    // neuromodulators: vesicle pool P, extracellular E
    nm = { DA: { P: 1, E: 0.3 }, "5HT": { P: 1, E: 0.3 }, NE: { P: 1, E: 0.3 }, ACh: { P: 1, E: 0.3 }, Glu: { P: 1, E: 0.3 }, GABA: { P: 1, E: 0.3 }, eCB: { P: 0.5, E: 0.1 } };
    // sleep / circadian
    S = 0.4;
    orx = 0;
    scnPhase = 0;
    stage = 0;
    ultra = 0;
    awakeMin = 0;
    asleep = false;
    light = 1;
    // latent / curvature / interoception
    pc = [];
    z = [];
    kappa = 0;
    kHist = [];
    liminal = 0;
    predErr = 0;
    // quantum
    rateVar;
    cephW = new Float64Array(24);
    cephH = [];
    /** v5.1 allostasis: learned, clock-indexed forecast of the glucose rise over the next 20 ticks drives insulin BEFORE the rise (cephalic-phase /
     *  anticipatory insulin; Powley 1977; Teff 2000; Sterling 2012). Delta rule on the hour bin seen 20 ticks ago. Original code. */
    cfmM;
    cfmX = [];
    cfmPj;
    cfmY;
    cfmW = new Float64Array(17);
    cfmHp;
    cfmEh = 0;
    cfmEb = 0.05;
    cfmR;
    /* v5.4 CFM: RNN over the 16 senses predicting next-tick senses; trained only in sleep by exact BPTT; hidden state re-enters cortex as cross-module input (cut by mixLesion). Error model: NLMS from hidden state to the model's own realized squared error. */
    cfmStep(ext) {
      if (!(M50.cfm > 0)) return;
      const H = 16;
      const m = this.cfmM ??= new EFMV(16, 16, this.cfmR = mulberry(this.o.seed * 6007 + 29), H);
      if (!this.cfmPj) {
        this.cfmPj = new Float64Array(CE * H).map(() => (this.cfmR() * 2 - 1) / Math.sqrt(H));
      }
      const x = Array.from(this.sens, (v) => +v);
      if (this.stage === 0) {
        this.cfmX.push(x);
        if (this.cfmX.length > 2e3) this.cfmX.shift();
      }
      if (this.cfmY && this.cfmHp) {
        let se = 0;
        for (let i = 0; i < 16; i++) se += (this.cfmY[i] - x[i]) ** 2;
        se /= 16;
        const f = [...this.cfmHp, 1];
        let pr = 0, nn = 1e-6;
        for (let i = 0; i < 17; i++) {
          pr += this.cfmW[i] * f[i];
          nn += f[i] * f[i];
        }
        const d = se - pr;
        for (let i = 0; i < 17; i++) this.cfmW[i] += 0.1 * d * f[i] / nn;
        this.cfmEb += 0.01 * (se - this.cfmEb);
      }
      this.cfmY = m.advanceV(x);
      this.cfmHp = Float64Array.from(m.h);
      {
        let pr = this.cfmW[16];
        for (let i = 0; i < 16; i++) pr += this.cfmW[i] * m.h[i];
        this.cfmEh = pr;
      }
      if (this.asleep && this.learn && this.cfmX.length > 60) {
        const T = 30, n = this.cfmX.length, a = Math.floor(this.cfmR() * (n - T - 1));
        m.adam(m.gradV(this.cfmX.slice(a, a + T), this.cfmX.slice(a + 1, a + T + 1), 4), 5e-3);
      }
      if (!this.o.mixLesion) for (let j = 0; j < CE; j++) {
        let s = 0;
        for (let k = 0; k < H; k++) s += this.cfmPj[j * H + k] * m.h[k];
        ext[R0.CTX + j] += M50.cfmK * s;
      }
    }
    cfmPrec() {
      return M50.cfm > 0 && M50.cfmP > 0 && this.cfmM ? 1 / (1 + M50.cfmP * Math.max(0, this.cfmEh / Math.max(1e-6, this.cfmEb) - 1)) : 1;
    }
    dmW;
    aomM;
    l5 = new Float64Array(32);
    l5P;
    l5Tr;
    l5Sp;
    l5Dp;
    /* v5.6 L5: graded conjunctive output pool per module, basal = own module centred rates, apical = paired module (cut by mixLesion) */
    l5FW;
    tcP;
    tcM;
    tcO;
    dnP = new Float64Array(4);
    /* v5.8 L5 feedback: each module's L5 pool drives that module's 13 E cells (fixed random weights); the conjunction it carries depends on cross-module apical input (cut by mixLesion) */
    l5Fb(ext) {
      if (!(M50.l5Fb > 0) || !this.l5P || this.o.mixLesion) return;
      if (!this.l5FW) {
        const r = mulberry(this.o.seed * 2741 + 3);
        this.l5FW = new Float64Array(CE * 8).map(() => (r() * 2 - 1) / Math.sqrt(8));
      }
      for (let j = 0; j < CE; j++) {
        const m = Math.floor(j / MW);
        let s = 0;
        for (let u = 0; u < 8; u++) s += this.l5FW[j * 8 + u] * this.l5[m * 8 + u];
        ext[R0.CTX + j] += M50.l5Fb * s;
      }
    }
    /* V6-S1 plastic VSA/MAP binding hub (Gayler 2003; Kanerva 2009; Plate 1995). D binding units u*v from random projections of two modules' centred relay rates; hub->cortex efficacy hubH is consolidated by DA-RPE (three-factor; Reynolds & Wickens 2002), starts at 0, so lesions remove it. Original code. */
    /* SC-PORT 2 (RPT-1/RPT-2): Hebbian fast weights (Hinton & Plaut 1987; Schmidhuber 1992; Ba et al. 2016) A <- lam*A + eta*x x^T over centred cortical rates, plus a slow learned recurrence L trained by the delta rule to predict the next cortical state from the current one (predictive recurrent processing; Lamme 2006; Rao & Ballard 1999). Both are cross-module CTX synapses only, so mixLesion removes them. Ported from SUPER CREATURE FastWeights (cq5 super-mind.ts plastic overlay). */
    scFwStep(ext) {
      if (!(M50.scFW > 0 || M50.scLR > 0) || this.o.mixLesion) return;
      const W = this, N = CE;
      W.fwA ??= new Float64Array(N * N);
      W.fwL ??= new Float64Array(N * N);
      W.fwX ??= new Float64Array(N);
      const x = new Float64Array(N);
      for (let i = 0; i < N; i++) x[i] = this.rate[R0.CTX + i] - this.rateAvg[R0.CTX + i];
      const xp = W.fwX;
      let np = 1e-3;
      for (let j = 0; j < N; j++) np += xp[j] * xp[j];
      for (let i = 0; i < N; i++) {
        const mi = Math.floor(i / MW);
        let s = 0, l = 0, pr = 0;
        for (let j = 0; j < N; j++) {
          if (Math.floor(j / MW) === mi) continue;
          const ij = i * N + j;
          pr += W.fwL[ij] * xp[j];
        }
        const e = x[i] - pr;
        for (let j = 0; j < N; j++) {
          if (Math.floor(j / MW) === mi) continue;
          const ij = i * N + j;
          if (this.learn) {
            W.fwA[ij] = Math.max(-1, Math.min(1, M50.scFWl * W.fwA[ij] + M50.scFWe * x[i] * x[j]));
            W.fwL[ij] += M50.scLRr * e * xp[j] / np;
          }
          s += W.fwA[ij] * x[j];
          l += W.fwL[ij] * x[j];
        }
        ext[R0.CTX + i] += M50.scFW * s + M50.scLR * l;
      }
      xp.set(x);
    }
    scAIprep() {
      const W = this;
      W.aiE ??= new Float64Array(SITES);
      W.aiM ??= new Float64Array(SITES);
      W.aiS ??= new Float64Array(SITES);
      W.srM ??= Float64Array.from({ length: SITES * SITES }, (_, i) => i % (SITES + 1) === 0 ? 1 : 0);
      let na = 0, eM = 0, mM = 0, sM = 0, mu = 0;
      for (let k = 0; k < SITES; k++) if (this.access[k]) {
        mu += this.bA[k] / (this.bA[k] + this.bB[k]);
        na++;
      }
      mu = Math.min(0.98, Math.max(0.02, mu / Math.max(1, na)));
      for (let k = 0; k < SITES; k++) {
        const m = Math.min(0.98, Math.max(0.02, this.bA[k] / (this.bA[k] + this.bB[k])));
        W.aiE[k] = betaIG(this.bA[k], this.bB[k]) / IG0;
        W.aiM[k] = m * Math.log(m / mu) + (1 - m) * Math.log((1 - m) / (1 - mu));
        let v = 0;
        for (let j = 0; j < SITES; j++) if (j !== k) v += W.srM[k * SITES + j] * this.bA[j] / (this.bA[j] + this.bB[j]);
        W.aiS[k] = v;
        if (this.access[k]) {
          eM += W.aiE[k];
          mM += W.aiM[k];
          sM += W.aiS[k];
        }
      }
      for (let k = 0; k < SITES; k++) {
        W.aiE[k] -= eM / Math.max(1, na);
        W.aiM[k] -= mM / Math.max(1, na);
        W.aiS[k] -= sM / Math.max(1, na);
      }
    }
    /* SC-PORT 3 successor representation over the creature's own site-to-site transitions (Dayan 1993; Stachenfeld, Botvinick & Gershman 2017), TD-learned. */
    scSRobs(k) {
      if (!(M50.scSR > 0) || !this.learn) return;
      const W = this;
      const p = W.srPrev ?? -1;
      W.srPrev = k;
      if (p < 0 || !W.srM) return;
      const M = W.srM;
      for (let j = 0; j < SITES; j++) M[p * SITES + j] += 0.1 * ((p === j ? 1 : 0) + M50.scSRg * M[k * SITES + j] - M[p * SITES + j]);
    }
    v6Hub(ext) {
      if (!(M50.v6 > 0) || this.o.mixLesion) return;
      const W = this;
      const H = W.hubH ?? 0;
      if (H <= 0) return;
      const D = M50.v6D;
      const x = new Float64Array(16);
      for (let i = 0; i < 16; i++) x[i] = this.rate[R0.THAL + i];
      W.v6M ??= new Float64Array(16);
      for (let i = 0; i < 16; i++) W.v6M[i] += 0.02 * (x[i] - W.v6M[i]);
      if (!W.v6O) {
        const r = mulberry(this.o.seed * 7919 + 17);
        W.v6O = new Float32Array(D * CE).map(() => r() * 2 - 1);
        W.v6A = new Float32Array(D * 8).map(() => r() * 2 - 1);
      }
      const gr = new Float64Array(D);
      for (const [m0, m1] of [[0, 1], [2, 3]]) for (let q = 0; q < D; q++) {
        let u = 0, v = 0;
        for (let j = 0; j < 4; j++) {
          u += W.v6A[q * 8 + j] * (x[m0 * 4 + j] - W.v6M[m0 * 4 + j]);
          v += W.v6A[q * 8 + 4 + j] * (x[m1 * 4 + j] - W.v6M[m1 * 4 + j]);
        }
        gr[q] += u * v;
      }
      const sc = M50.v6H * H / Math.sqrt(D);
      for (let i = 0; i < CE; i++) {
        let s = 0;
        for (let q = 0; q < D; q++) s += W.v6O[q * CE + i] * gr[q];
        ext[R0.CTX + i] += sc * s;
      }
    }
    /* V6-S1 antithetic integral appetite controller (Briat, Gupta & Khammash 2016) driven by the creature's own 30-min glucose forecast (allostasis; Sterling 2012). Original code. */
    v6Aic(bg) {
      if (!(M50.v6 > 0)) return 0;
      const W = this;
      const fp = this.mind?.glcPred;
      const y = Number.isFinite(fp) && fp > 0 ? fp / 3 : bg;
      W.z1 ??= 1;
      W.z2 ??= 1;
      const dt = 0.01, ann = W.z1 * W.z2;
      W.z1 = Math.max(0, W.z1 + dt * (1 - ann));
      W.z2 = Math.max(0, W.z2 + dt * (y - ann));
      return M50.v6K * (W.z1 - 1);
    }
    l5Step() {
      if (!(M50.l5 > 0)) return;
      const G5 = M50.fanR > 0 && CS > 1 ? Math.round(CS) : 1, N = Math.floor(MW / G5);
      if (!this.l5P) {
        const r = mulberry(this.o.seed * 3491 + 7);
        this.l5P = [0, 1, 2, 3].map(() => {
          const P = new L5Pool(8, N, r);
          P.norm = M50.l5Ph > 0;
          return P;
        });
      }
      this.l5Tr ??= new Float64Array(CE);
      for (let i = 0; i < CE; i++) this.l5Tr[i] += 0.5 * (this.rate[R0.CTX + i] - this.rateAvg[R0.CTX + i] - this.l5Tr[i]);
      const pool = (a) => {
        if (G5 === 1) return Array.from(a);
        const o = [];
        for (let q = 0; q < N; q++) {
          let s = 0;
          for (let j = q * G5; j < q * G5 + G5; j++) s += a[j];
          o.push(s / G5);
        }
        return o;
      };
      const cen = (m) => pool(this.l5Tr.subarray(m * MW, m * MW + MW));
      let sur = 0;
      this.l5Sp ??= new Float64Array(16);
      for (let i = 0; i < 16; i++) {
        sur += Math.abs(this.sens[i] - this.l5Sp[i]);
        this.l5Sp[i] = this.sens[i];
      }
      const ph = M50.l5Ph > 0, dX = this.l5Dp ? Array.from(this.l5Tr, (v, i) => v - this.l5Dp[i]) : null;
      this.l5Dp = Float64Array.from(this.l5Tr);
      const dm = (m) => pool(dX.slice(m * MW, m * MW + MW));
      for (let m = 0; m < 4; m++) {
        if (this.learn && (!ph ? true : dX !== null && sur > 0.1)) {
          if (ph) this.l5P[m].learn(dm(m), this.o.mixLesion ? null : dm(m ^ 1), 0.02);
          else this.l5P[m].learn(cen(m), this.o.mixLesion ? null : cen(m ^ 1), M50.l5Eta ?? 0.01);
        }
        const y = this.l5P[m].step(cen(m), this.o.mixLesion ? null : cen(m ^ 1));
        for (let u = 0; u < 8; u++) this.l5[m * 8 + u] = y[u];
      }
      if (M50.tc > 0) {
        if (!this.tcP) {
          const r = mulberry(this.o.seed * 5153 + 11);
          this.tcP = [0, 1, 2, 3].map(() => {
            const P = new L5Pool(MW, N, r);
            P.norm = true;
            return P;
          });
          this.tcM = new Float64Array(CE);
          this.tcO = new Float64Array(CE);
        }
        for (let m = 0; m < 4; m++) {
          if (this.learn && dX !== null && sur > 0.1) this.tcP[m].learn(dm(m), this.o.mixLesion ? null : dm(m ^ 1), 0.02);
          const y = this.tcP[m].step(cen(m), this.o.mixLesion ? null : cen(m ^ 1));
          for (let j = 0; j < MW; j++) {
            const i = m * MW + j;
            this.tcM[i] += 0.02 * (y[j] - this.tcM[i]);
            this.tcO[i] = y[j] - this.tcM[i];
          }
        }
      }
    }
    /* v5.5 DMUL: each cortical E cell = basal (own rate) x sigmoid(apical drive from the paired module's centred rates, fixed random weights); cross-module, cut by mixLesion */
    dmulStep(ext) {
      if (!(M50.dmul > 0) || this.o.mixLesion) return;
      const N = MW;
      if (!this.dmW) {
        const r = mulberry(this.o.seed * 5099 + 41);
        this.dmW = new Float64Array(52 * N).map(() => (r() * 2 - 1) / Math.sqrt(N) * 2);
      }
      for (let j = 0; j < CE; j++) {
        const m = Math.floor(j / N), pm = m ^ 1;
        let ap = 0;
        for (let k = 0; k < N; k++) {
          const ix = R0.CTX + pm * N + k;
          ap += this.dmW[j * N + k] * (this.rate[ix] - this.rateAvg[ix]);
        }
        ext[R0.CTX + j] += M50.dmulK * (dmulOut(this.rate[R0.CTX + j], ap, 4, 0) - 0.5 * this.rate[R0.CTX + j]);
      }
    }
    /* centred: coincidence raises, its absence lowers the cell's drive (burst vs suppression) */
    rp2Step(ext) {
      const v = M50.rp2 | 0;
      if (!v || this.o.mixLesion) return;
      const W = this, K = M50.rp2K;
      const stG = 1 - 0.5 * clamp(this.ghrelin);
      W.rp2G = stG;
      if (M50.scST === 0) this.mind.scAW = stG;
      if (this.t <= 480 || this.orx < 1e-4) return;
      const u = new Float64Array(16);
      for (let m = 0; m < 4; m++) for (let c = 0; c < 4; c++) {
        let s = 0;
        for (let sub = 0; sub < 4; sub++) s += this.rate[R0.CTX + m * MW + 4 * c + sub];
        u[m * 4 + c] = 0.5 * this.sens[4 * m + c] + 0.3 * this.rate[R0.THAL + 4 * m + c] + 0.2 * (s * 0.25);
      }
      for (let m = 0; m < 4; m++) {
        const pm = m ^ 1;
        let mx0 = 0, mn0 = 1e9, mx1 = 0, mn1 = 1e9, mu1 = 0;
        for (let c = 0; c < 4; c++) {
          const x0 = u[m * 4 + c], x1 = u[pm * 4 + c];
          if (x0 > mx0) mx0 = x0;
          if (x0 < mn0) mn0 = x0;
          if (x1 > mx1) mx1 = x1;
          if (x1 < mn1) mn1 = x1;
          mu1 += x1;
        }
        mu1 *= 0.25;
        if (mx0 - mn0 < 0.45 || mx1 - mn1 < 0.45) continue;
        if (m === 0) W.l5 ??= new Float64Array(32);
        for (let c1 = 0; c1 < 4; c1++) {
          const x1 = u[m * 4 + c1];
          for (let c2 = 0; c2 < 4; c2++) {
            const x2 = u[pm * 4 + c2], d2 = x2 - mu1, p = 0.5 * (x1 + x2), dc = Math.max(0, p * (1 - 1.1 * p)) * (c2 & 1 ? -1 : 1);
            const g = v === 8 ? x1 * d2 : v === 7 ? dc : x1 * d2 + 0.25 * dc;
            if (x1 >= 0.05) ext[R0.CTX + m * MW + 4 * c1 + c2] += K * stG * 5 * g;
            if (m === 0) W.l5[4 * c1 + c2] = K * stG * x1 * x2;
          }
        }
      }
    }
    efmM;
    efmX = [];
    efmE = [];
    efmA = 0;
    efmR;
    efmF = 0;
    efmTerm(e, gutFill) {
      if (!(M50.efm > 0)) return 0;
      const m = this.efmM ??= new EFM(5, this.efmR = mulberry(this.o.seed * 7919 + 13), 10);
      const x = [e, gutFill / 10, this.efmA, Math.sin(this.scnPhase), Math.cos(this.scnPhase)];
      this.efmX.push(x);
      this.efmE.push(e);
      if (this.efmX.length > 3e3) {
        this.efmX.shift();
        this.efmE.shift();
      }
      this.efmF = m.advance(x);
      if (this.asleep && this.learn && this.efmX.length > 80) {
        const K = 20, T = 40, B = 8, n = this.efmX.length;
        const a = Math.floor(this.efmR() * (n - T - K));
        m.adam(m.grad(this.efmX.slice(a, a + T), this.efmE.slice(a + K, a + K + T), B), 0.01);
      }
      return m.trained > 0 && !this.o.cephLesion ? 1.5 * Math.max(0, this.efmF - e) : 0;
    }
    /* v5.3 EFM: anticipatory insulin = forecast glucose rise 20 ticks ahead */
    c10G() {
      const v = M50.c10 | 0;
      if (!v) return 1;
      const K = M50.c10K, G = this.blood.glc, gf = this.gut.glc + this.gut.fat + this.gut.prot, S = this;
      let x = 1;
      if (v === 1 || v === 11 || v === 13) x = Math.min(x, clamp((4.2 - G) / (1.2 * K)));
      if (v === 2 || v === 13) x = Math.min(x, 1) / (1 + (gf / (8 * K)) ** 4);
      if (v === 3 || v === 11 || v === 12) x = Math.min(x, clamp((4.4 - (G + 0.5 * this.gut.glc)) / K));
      if (v === 4 || v === 12) x = Math.min(x, 1 / (1 + K * 4 * (S.c10glp ?? 0)));
      if (v === 5) x = clamp(1 - K * (2 * (G - 3) + (S.c10I ?? 0)));
      if (v === 6) x = clamp((4.4 - G - (S.c10ex ?? 0.5)) / (0.5 * K));
      if (v === 10) x = clamp(1 - K * Math.max(0, this.insulin - 0.3) / 0.3);
      if (v === 14) x = Math.min(clamp((4.2 - G) / (1.2 * K)), clamp((4.4 - G - (S.c10ex ?? 0.5)) / (0.8 * K)));
      if (v === 15) x = clamp((4.35 - (G + 0.15 * this.gut.glc)) / (0.45 * K));
      if (v === 16) x = clamp((4.32 - G) / (0.45 * K));
      if (v === 17) x = this.t > 480 && this.orx < 1e-4 && !this.o.deplete && !this.o.genes ? clamp((4.52 - (G + 0.08 * this.gut.glc)) / (0.1 * K)) : 1;
      if (M50.scST === 0) this.mind.scAW = x * (1 - 0.5 * this.ghrelin);
      return x;
    }
    c10Tick(got) {
      const v = M50.c10 | 0;
      if (!v) return;
      const S = this, G = this.blood.glc;
      S.c10glp = (S.c10glp ?? 0) * 0.97 + (got ? 1 : 0);
      S.c10I = Math.max(-2, Math.min(2, (S.c10I ?? 0) + 2e-3 * (G - 3)));
      if (got) {
        S.c10t0 = this.t;
        S.c10g0 = G;
        S.c10mx = G;
      }
      if (S.c10t0 !== void 0) {
        S.c10mx = Math.max(S.c10mx, G);
        if (this.t - S.c10t0 === 40) S.c10ex = (S.c10ex ?? 0.5) + 0.2 * (S.c10mx - S.c10g0 - (S.c10ex ?? 0.5));
      }
    }
    efmRoll() {
      const m = this.efmM;
      if (!(M50.efm > 0) || !m || m.trained === 0 || this.o.cephLesion) return 1;
      const x = this.efmX[this.efmX.length - 1];
      const dy = Math.abs(m.peek([x[0], x[1], 1, x[3], x[4]])), dn = Math.abs(m.peek([x[0], x[1], 0, x[3], x[4]]));
      return 2 / (1 + Math.exp(-20 * (dn - dy)));
    }
    /* v5.3 rollout: forage iff the model predicts it keeps glucose closer to set point than not foraging */
    tpcM;
    tpcTerm(e) {
      if (!(M50.tpc > 0)) return 0;
      const m = this.tpcM ??= new TPC(19, mulberry(this.o.seed * 7919 + 11), { K: 20 });
      const f = m.step([e, Math.sin(this.scnPhase), Math.cos(this.scnPhase), ...Array.from(this.sens).slice(0, 16)]);
      return this.o.cephLesion ? 0 : M50.tpc * 1.5 * Math.max(0, f[0] - e);
    }
    /* v5.2 TPC: learned K-step forecast of own glucose error from interoception, clock and senses; anticipatory insulin = forecast rise (fp/tpc.ts, isolated check B) */
    cephPred() {
      const b = (ph) => Math.floor((ph % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI) * 24) % 24;
      const g = this.blood.glc / 3;
      this.cephH.push(g, this.scnPhase);
      if (this.cephH.length > 42) {
        const g0 = this.cephH.shift(), p0 = this.cephH.shift();
        if (this.learn) {
          const k = b(p0);
          this.cephW[k] += 0.05 * (Math.max(0, g - g0) - this.cephW[k]);
        }
      }
      return this.cephW[b(this.scnPhase + 20 / 1440 * 2 * Math.PI)];
    }
    q = new Q3();
    qth = [0.5, 0.5, 0.5];
    qOut = 0;
    qgtTrace = 0;
    berry = 0;
    health = new Health(2.5);
    // behaviour
    level = 1;
    foraged = 0;
    rewards = 0;
    lastChoice = -1;
    choices = [];
    brainUse = 0;
    learn = true;
    stim = {};
    vagal = 0;
    ensRate = 0;
    motility = 0;
    hist = {};
    events = [];
    // v3.1: sensory lines (4 modalities x 4), synapse kinds + lesion mask, Mind layer, body integrity, ecology
    nmda = new Float32Array(NNEU);
    nmdaS = new Float32Array(NNEU);
    modAct = new Float32Array(4);
    dHat = new Float32Array(SITES);
    dDelta = 0;
    pk = new Uint8Array(0);
    thA = new Float32Array(NNEU);
    inn = [];
    devSens = new Float32Array(16);
    rd = mulberry(1);
    rateAvg = new Float32Array(NNEU).fill(0.12);
    gate = LTC_LEARNED.slice();
    elig = new Float64Array(NNEU * 4);
    eligT = new Float64Array(NNEU * 4);
    gHist = [];
    // gate is reset to LTC_INIT in the constructor when o.eprop (training)
    sens = new Float32Array(16);
    kind;
    mask;
    mind;
    integrity = 1;
    tissue = 10;
    damageTaken = 0;
    cogCost = 0;
    pBase = new Float32Array(SITES);
    depl = new Float32Array(SITES);
    danger = new Float32Array(SITES);
    wAv = new Float32Array(SITES);
    visits = new Float32Array(SITES);
    lastVisit = new Float32Array(SITES);
    vol = 0;
    assocPH = new Float32Array(SITES).fill(0.5);
    // v3.6: light input, dendritic NMDA buffer, latent-cause value map, schema statistics, Beta beliefs for expected information gain
    deathCause = "";
    temper = -1;
    devGenome = null;
    devStats = null;
    devAff = null;
    devTarget = 0;
    devPruned = null;
    bus = null;
    selfM = null;
    curv = null;
    neo = null;
    marks = new Float32Array(SITES);
    lastRew = 0;
    devSlots = [];
    actEMA = new Float32Array(NNEU);
    cg = () => 1;
    intPrev = 1;
    affR = mulberry(9);
    affect = null;
    lightIn = null;
    photo = [6, 18];
    dend = new Float32Array(NNEU);
    wAlt = new Float32Array(SITES).fill(0.25);
    lcLLR = 0;
    lcSwitches = 0;
    sN = new Float32Array(SITES);
    sR = new Float32Array(SITES);
    bA = new Float32Array(SITES).fill(1);
    bB = new Float32Array(SITES).fill(1);
    rule = null;
    qb = null;
    modLesion = [false, false, false, false];
    dead = false;
    lowGlc = 0;
    constructor(o) {
      if (Object.keys(V40OPTS).length) {
        o = { ...o };
        for (const k in V40OPTS) if (o[k] == null) o[k] = V40OPTS[k];
      }
      this.o = { noise: "quantum", replay: "full", entropy: "seeded", access: "half", ...o };
      this.r = mulberry(o.seed * 7919 + 17);
      if (o.eprop) this.gate = LTC_INIT.slice();
      const er = mulberry(o.seed * 104729 + 3);
      if (M50.ltcC > 0 && this.o.ltc === void 0) this.o.ltc = true;
      this.ent = this.o.entropy === "tsotchke" ? tsotchkeEntropy(o.seed, er) : this.o.entropy === "crypto" && typeof crypto !== "undefined" ? (() => {
        const b = new Uint32Array(1);
        crypto.getRandomValues(b);
        return b[0] / 4294967296;
      }) : er;
      const r = this.r;
      const pre = [], post = [], w = [], pl = [];
      const has = /* @__PURE__ */ new Set();
      if (o.develop ?? is40(o.mind ?? MIND_DEFAULT)) {
        const rg = mulberry(o.seed * 5167 + 23);
        const gnm = o.devGenome ?? randomGenome(CP.length, REGIONS.length, rg);
        this.devGenome = gnm;
        const G2 = grow(CP, R0, RN, REGIONS.map((x) => x[0]), gnm, rg);
        this.devStats = { ...G2.stats, pruned: 0, sprouted: 0 };
        this.devAff = G2.affinity;
        this.devTarget = G2.stats.target;
        const base0 = pre.length;
        this.devSlots = G2.proj.map((pi, k) => [base0 + k, pi]);
        this.cg = (n) => cortexGene(gnm, CP.length, REGIONS.length, n);
        const regOf = (i) => REGIONS.find(([n]) => i >= R0[n] && i < R0[n] + RN[n])[0];
        G2.pre.forEach((i, k) => {
          const j = G2.post[k];
          const ln = Math.exp(-0.7 + 0.9 * this.gauss(r)) * 0.35 * Math.min(2, 0.5 + 0.5 * G2.aff[k]) * (M50.fanN > 0 && i >= R0.CTX && i < R0.CTX + RN.CTX ? 1 / CS : 1);
          w.push(INHIB(i) ? -ln * 1.6 : ln);
          pre.push(i);
          post.push(j);
          pl.push(regOf(i) === "CTX" && regOf(j) === "CTX" && !INHIB(i) ? 1 : 0);
        });
      } else for (const [a, b, p] of CP) for (let i = R0[a]; i < R0[a] + RN[a]; i++) for (let j = R0[b]; j < R0[b] + RN[b]; j++) {
        if (i === j) continue;
        let pp = a === "CTX" ? p / CS : p;
        if (a === b && b === "CTX" && has.has(j * NNEU + i)) pp = Math.min(1, p * 4);
        if (r() < pp) {
          has.add(i * NNEU + j);
          pre.push(i);
          post.push(j);
          const ln = Math.exp(-0.7 + 0.9 * this.gauss(r)) * 0.35;
          w.push(INHIB(i) ? -ln * 1.6 : ln);
          pl.push(a === "CTX" && b === "CTX" && !INHIB(i) ? 1 : 0);
        }
      }
      const ra = mulberry(o.seed * 31337 + 5);
      const kd = pre.map((p, k) => {
        const q = post[k];
        const cx = (i) => i >= R0.CTX && i < R0.CTX + CE;
        return cx(p) && cx(q) ? Math.floor((p - R0.CTX) / MW) === Math.floor((q - R0.CTX) / MW) ? 2 : 3 : 0;
      });
      for (let i = 0; i < 16; i++) {
        pre.push(R0.SENS + i);
        post.push(R0.THAL + i);
        w.push(TUNE.st);
        pl.push(0);
        kd.push(1);
      }
      const c34 = this.o.cortex !== "v31";
      for (let i = 0; i < 16; i++) {
        const m = Math.floor(i / 4);
        for (let c = 0; c < 3; c++) {
          const mm = this.o.topoScramble ? Math.floor(ra() * 4) : m;
          const j = R0.CTX + mm * MW + Math.floor(ra() * MW);
          if (!c34) {
            pre.push(R0.THAL + i);
            post.push(j);
            w.push(TUNE.tc);
            pl.push(0);
            kd.push(1);
          }
        }
      }
      for (let m = 0; m < 4; m++) for (let a = 0; a < MW; a++) for (let b = 0; b < MW; b++) if (a !== b && ra() < 0.25) {
        if (!c34) {
          pre.push(R0.CTX + m * MW + a);
          post.push(R0.CTX + m * MW + b);
          w.push(TUNE.rec);
          pl.push(1);
          kd.push(2);
        }
      }
      const pkk = pre.map(() => 0);
      if (c34) {
        const rc = mulberry(o.seed * 7777 + 11);
        const E = (m, n) => R0.CTX + m * MW + n, I = (m, k) => R0.CTX + CE + KI * m + k;
        const add = (a, b, ww, k, p2) => {
          pre.push(a);
          post.push(b);
          w.push(ww);
          pl.push(0);
          kd.push(k);
          pkk.push(p2);
        };
        for (let i = 0; i < 16; i++) {
          const m = Math.floor(i / 4), j = i % 4;
          const mm = this.o.topoScramble ? Math.floor(rc() * 4) : m;
          const perm = Array.from({ length: MW }, (_, n) => n);
          if (this.o.topoScramble) perm.sort(() => rc() - 0.5);
          for (let n = 0; n < MW; n++) {
            const pos = 3 * perm[n] / (MW - 1);
            add(R0.THAL + i, E(mm, n), CX.tc * this.cg("tc") * Math.exp(-((pos - j) ** 2) / (2 * (CX.tcSig * this.cg("tcSig")) ** 2)) * (0.8 + 0.4 * rc()), 1, 1);
          }
          for (let k = 0; k < KI; k++) add(R0.THAL + i, I(mm, k), CX.ffI, 5, 0);
        }
        for (let m = 0; m < 4; m++) {
          for (let n = 0; n < MW; n++) for (let k = 0; k < KI; k++) {
            add(E(m, n), I(m, k), CX.eI * this.cg("eI") * (0.8 + 0.4 * rc()) / CS, 6, 0);
            add(I(m, k), E(m, n), -CX.iE * this.cg("iE") * (0.8 + 0.4 * rc()) / CS, 7, 3);
          }
          for (let a = 0; a < MW; a++) for (let b = 0; b < MW; b++) if (a !== b) add(E(m, a), E(m, b), CX.rec0 * this.cg("rec0") * (0.5 + rc()) / CS, 2, 2);
        }
        if (ge35(o.mind ?? MIND_DEFAULT)) {
          const rx = mulberry(o.seed * 6113 + 29);
          for (let m = 0; m < 4; m++) for (let n = 0; n < 4; n++) if (m !== n) {
            for (let a = 0; a < MW; a++) for (let b = 0; b < MW; b++) if (rx() < M35.xP / CS) add(E(m, a), E(n, b), M35.xW * (0.5 + rx()), 3, 0);
          }
        }
        if (M40.xsel > 0) {
          const rs = mulberry(o.seed * 4409 + 23);
          for (let m = 0; m < 4; m++) for (let bb = 0; bb < MW; bb++) {
            const n = m ^ 1, p = Math.floor(rs() * 4);
            const k = Array.from({ length: MW }, (_, a) => Math.exp(-((3 * a / (MW - 1) - p) ** 2) / (2 * 0.5 ** 2)));
            const mu = k.reduce((x, y) => x + y, 0) / MW;
            for (let a = 0; a < MW; a++) add(E(n, a), E(m, bb), M40.xsel * (k[a] - mu) / CS, 3, 0);
          }
        }
        if (is39(o.mind ?? MIND_DEFAULT) && M39.xsW > 0) {
          const rs = mulberry(o.seed * 3301 + 17);
          for (let m = 0; m < 4; m++) for (let b = 0; b < MW; b++) {
            const n = m ^ 1, p = Math.floor(rs() * 4);
            for (let a = 0; a < MW; a++) {
              const ww = M39.xsW * Math.exp(-((3 * a / (MW - 1) - p) ** 2) / (2 * (M39.xsSig * this.cg("xsSig")) ** 2));
              if (ww > 0.02 * M39.xsW) add(E(n, a), E(m, b), ww / CS, 3, 0);
            }
          }
        }
        const fbWe = is37(o.mind ?? MIND_DEFAULT) ? M37.fbW : M36.fbW;
        if (ge36(o.mind ?? MIND_DEFAULT) && fbWe > 0) {
          const rf = mulberry(o.seed * 9973 + 5);
          for (let m = 0; m < 4; m++) for (let n = 0; n < MW; n++) for (let k = 0; k < M36.fbN; k++) add(E(m, n), R0.THAL + m * 4 + Math.floor(rf() * 4), fbWe * (0.5 + rf()), 8, 2);
        }
      }
      this.syn = { pre: Int32Array.from(pre), post: Int32Array.from(post), w: Float32Array.from(w), plastic: Uint8Array.from(pl) };
      this.kind = Uint8Array.from(kd);
      this.pk = Uint8Array.from(pkk);
      this.rd = mulberry(o.seed * 4441 + 9);
      this.mask = new Float32Array(pre.length).fill(1);
      this.mind = new Mind(ra);
      for (let i = 0; i < NNEU; i++) {
        this.out.push([]);
        this.th[i] = 1 + 0.1 * r();
      }
      pre.forEach((p, s) => this.out[p].push(s));
      for (let i = 0; i < NNEU; i++) this.inn.push([]);
      post.forEach((q, s2) => {
        if (this.pk[s2]) this.inn[q].push(s2);
      });
      const cv = [0, 1, 2, 3].sort(() => r() - 0.5), sv = [0, 1, 2, 3].sort(() => r() - 0.5);
      for (let k = 0; k < SITES; k++) {
        const c = k & 3, s = k >> 2;
        this.siteC[k] = c;
        this.siteS[k] = s;
        this.pTrue[k] = 0.05 + 0.25 * cv[c] / 3 + 0.25 * sv[s] / 3;
      }
      for (let k = 0; k < SITES; k++) this.access[k] = this.o.access === "all" || (this.siteC[k] + this.siteS[k] & 1) === 0 ? 1 : 0;
      for (let k = 0; k < 3; k++) {
        const v = new Float64Array(12);
        for (let i = 0; i < 12; i++) v[i] = this.gauss(r) * 0.3;
        this.pc.push(v);
      }
      if (this.o.fat0 !== void 0) this.fat = this.o.fat0;
      const G = this.o.genes;
      if (G) {
        this.th = this.th.map((x) => x * G[1]);
        const reach = Math.max(0.1, Math.min(1, 0.5 * G[3]));
        for (let k = 0; k < SITES; k++) this.access[k] = ra() < reach ? 1 : 0;
        if (M50.scCH > 0 && !this.access.some(Boolean)) this.access[0] = 1;
      }
      for (let k = 0; k < SITES; k++) {
        this.pBase[k] = this.pTrue[k];
        this.danger[k] = ra() < 0.5 ? 0.5 : 0;
      }
      this.applyMask();
      this.E0 = this.energy();
    }
    // lesion mask over synapses (kinds: 0 random, 1 topographic, 2 within-module recurrent, 3 cross-module cortical)
    applyMask() {
      const o = this.o;
      for (let k = 0; k < this.mask.length; k++) {
        const kd = this.kind[k];
        let m = 1;
        if (o.recLesion && (kd === 2 || kd === 3)) m = 0;
        if (o.mixLesion && kd === 3) m = 0;
        if (o.ctFbLesion && (kd === 8 || this.syn.pre[k] >= R0.CTX && this.syn.pre[k] < R0.CTX + RN.CTX && this.syn.post[k] >= R0.THAL && this.syn.post[k] < R0.THAL + RN.THAL)) m = 0;
        if (o.eiLesion && kd >= 5 && kd <= 7) m = 0;
        if (this.devPruned && this.devPruned[k]) m = 0;
        this.mask[k] = m;
      }
    }
    lesionModule(m, on = true) {
      this.modLesion[m] = on;
    }
    damage(x) {
      const d = Math.min(this.tissue, 10 * x);
      this.tissue -= d;
      this.blood.aa += d;
      this.integrity = this.tissue / 10;
      this.damageTaken += x;
      this.events.push(`t${this.t} damage ${x.toFixed(2)}`);
    }
    gauss(r = this.r) {
      const u = Math.max(1e-12, r()), v = r();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v);
    }
    energy() {
      const g = this.gut, b = this.blood;
      return g.glc + g.fat + g.prot + b.glc + b.ffa + b.aa + b.ket + b.urea + this.liverGly + this.fat + this.muscle + this.brainGlc + this.atp + this.heat + this.excreted + this.tissue;
    }
    ledgerError() {
      return Math.abs(this.energy() - this.E0 - this.eaten) / (this.E0 + this.eaten);
    }
    paramCount() {
      const v40p = is40(this.o.mind ?? MIND_DEFAULT) ? SITES * 3 + 24 + 26 * 16 + 12 * 8 + RN.CTX : 0;
      const v6p = (M50.v6 > 0 ? 18 : 0) + (M50.scCH > 0 ? 32 : 0) + (M50.rp2 > 0 ? 16 : 0) + (M50.c10 > 0 ? 8 : 0) + (M50.ae2 > 0 ? 8 : 0);
      const syn = this.syn.w.length, pl = this.syn.plastic.reduce((a, b) => a + b, 0), val = SITES + 8 + this.mind.nParams() + v40p, kin = NNEU + 7 * 6 + 40 + 36 + v6p, q = 16 + 3;
      return { synapses: syn, plasticSynapses: pl, valueSynapses: val, kinetics: kin, quantum: q, total: syn + val + kin + q };
    }
    // ---------- interventions (browser inspector + tests) ----------
    // ---- v3.6 steering API: light input, photoperiod, external quantum backend, rule engine, full-state snapshot/restore ----
    /** dome light in [0,1]; null returns to the internal photoperiod clock */
    setLight(x) {
      this.lightIn = x === null ? null : clamp(x);
    }
    setPhotoperiod(on, off) {
      this.photo = [on, off];
    }
    /** external statevector (e.g. Moonlab WASM): prepare(theta) then probs() of the 8 basis states; draws stay on the seeded stream, so runs stay deterministic */
    setQuantumBackend(b) {
      this.qb = b;
    }
    /** external sleep/wake flip-flop rule (e.g. an Eshkol program); must compute the same boolean as the built-in rule */
    setRuleEngine(f) {
      this.rule = f;
    }
    /** complete serialisable state (JSON-safe): every field incl. typed arrays, the Mind, and all PRNG states */
    snapshot() {
      return snapEnc(this, /* @__PURE__ */ new Set(["rule", "qb", "g"]));
    }
    /** restore a snapshot into this instance (any seed); continuing then reproduces the original run exactly */
    restore(st) {
      snapDec(this, st, /* @__PURE__ */ new Set(["rule", "qb", "g"]));
    }
    feed(kJ) {
      const f = kJ / 2.2;
      this.gut.glc += 1.2 * f;
      this.gut.fat += 0.6 * f;
      this.gut.prot += 0.4 * f;
      this.eaten += kJ;
      this.events.push(`t${this.t} fed ${kJ.toFixed(1)} kJ`);
    }
    stimulate(reg, amt) {
      this.stim[reg] = (this.stim[reg] || 0) + amt;
    }
    inject(nm, amt) {
      if (this.nm[nm]) this.nm[nm].E += amt;
    }
    lesion(k, v = true) {
      this.o[k] = v;
      this.events.push(`t${this.t} ${k}=${String(v)}`);
      this.applyMask();
    }
    // ---------- one-tick update of the whole organism ----------
    step() {
      const o = this.o, r = this.r;
      this.t++;
      if (M40.onR > 0 && this.nmdaS) {
        const ps = this.sPrev ??= new Float64Array(this.sens.length);
        let ch = 0;
        for (let i = 0; i < this.sens.length; i++) {
          ch += Math.abs(this.sens[i] - ps[i]);
          ps[i] = this.sens[i];
        }
        if (ch > 0.5) for (let i = R0.CTX; i < R0.CTX + RN.CTX; i++) this.nmdaS[i] *= 1 - M40.onR;
      }
      if (is40(o.mind ?? MIND_DEFAULT) && !(o.affectLesion ?? "").includes("all")) {
        this.intPrev = this.integrity;
        if (!this.affect) {
          this.affR = mulberry(o.seed * 4051 + 11);
        }
        if (!this.affect) this.affect = new Affect(SITES, o.persona ?? Affect.birth(mulberry(o.seed * 4049 + 7)), new Set((o.affectLesion ?? "").split(",").filter(Boolean)));
        const fb = this.affect.step({ t: this.t, DA: this.nm.DA.E, NE: this.nm.NE.E, S5: this.nm["5HT"].E, cortisol: this.cortisol, ghrelin: this.ghrelin, atp: this.atp / 2, integrity: this.integrity, sleepS: this.S, awake: this.stage === 0, r: this.affR });
        this.cortisol = clamp(this.cortisol + fb.cortisol);
        this.nm.DA.E = Math.max(0, this.nm.DA.E + fb.DA);
        this.nm["5HT"].E = Math.max(0, this.nm["5HT"].E + fb.S5);
        this.S = clamp(this.S + fb.sleep);
      }
      if (is40(o.mind ?? MIND_DEFAULT) && (M40.forget > 0 || M40.volLeak > 0) && this.t % 10 === 0) {
        const f2 = 1 - 10 * (M40.forget + M40.volLeak * (M40.volX > 0 ? this.volU : this.vol));
        for (let k = 0; k < this.bA.length; k++) {
          this.bA[k] = 1 + f2 * (this.bA[k] - 1);
          this.bB[k] = 1 + f2 * (this.bB[k] - 1);
          this.rA[k] = 1 + f2 * (this.rA[k] - 1);
          this.rB[k] = 1 + f2 * (this.rB[k] - 1);
        }
      }
      if (is40(o.mind ?? MIND_DEFAULT) && !(o.v40Lesion ?? "").includes("v40all")) {
        const off = new Set((o.v40Lesion ?? "").split(",").filter(Boolean));
        if (!this.bus) {
          const rr = mulberry(o.seed * 6007 + 41);
          this.bus = new SensoryBus(rr, off, o.substrate ?? "synthetic", o.seed, o.substrateLog ?? []);
          this.selfM = new SelfModel(rr, off);
          const ctl = new Set((o.v40Ctl ?? "").split(",").filter(Boolean));
          this.curv = new Curvature(rr, RN.CTX, off);
          this.neo = new NeoHooks(off);
          this.bus.ctl = ctl;
          this.selfM.ctl = ctl;
          this.neo.ctl = ctl;
          this.bus.outK = M40.busOut;
          this.selfM.simK = M40.simK;
        }
        const A = this.affect;
        const intero = [this.blood.glc, this.atp / 2, this.integrity, this.fat / 400];
        const alien = [Math.cos(2 * Math.PI * this.t / (1440 * 7) + o.seed), clamp(this.cortisol), this.qOut ? 1 : 0];
        this.bus.step(this.t, this.sens, intero, alien, this.lastRew);
        this.lastRew *= 0.9;
        const glitch = this.bus.lastIn[16 + 4 + 3 + 3] ?? 0;
        this.curv.step(this.rate.subarray(R0.CTX, R0.CTX + RN.CTX));
        this.selfM.step([...intero, this.nm.DA.E, this.nm["5HT"].E, this.nm.NE.E, this.nm.ACh.E, A ? A.mood.val : 0, A ? A.emo.fear : 0, this.bus.surpriseN - 1, this.curv.felt()], glitch);
        this.neo.step(this.t, this.selfM.sim, A ? A.sleepDebt : this.S, clamp(this.ghrelin), this.bestSite(), this.affR);
        for (const q of this.neo.pending.splice(0)) this.neoSandbox(q);
      }
      const minute = this.t % 1440, hour = minute / 60;
      this.light = this.lightIn !== null ? clamp(this.lightIn) : hour >= this.photo[0] && hour < this.photo[1] ? 1 : 0;
      this.scnPhase += 2 * Math.PI / 1440 + this.light * 2e-3 * Math.sin(2 * Math.PI * minute / 1440 - this.scnPhase);
      if (this.neo && this.t < this.neo.shadeUntil) this.light = 0;
      const scnOut = o.scnLesion ? 0 : Math.cos(this.scnPhase - 2 * Math.PI * 14 / 24);
      this.melatonin += 0.05 * ((1 - this.light) * (o.scnLesion ? 0.5 : clamp(0.5 - scnOut)) - this.melatonin);
      this.ultra = (this.ultra + 1 / 90) % 1;
      const C = 0.25 * scnOut + 0.1 * Math.sin(2 * Math.PI * this.ultra) * (this.asleep ? 0 : 0.5);
      const drive = this.S - C + 0.15 * this.melatonin - (ge36(o.mind ?? MIND_DEFAULT) ? M36.neK * Math.max(0, this.nm.NE.E - 0.3) : 0);
      const forced = o.forceWake || (this.stim.LC || 0) > 3;
      let thrS = 0.62;
      if (ge35(o.mind ?? MIND_DEFAULT)) {
        let eng = 0;
        for (let i = 0; i < 16; i++) eng += this.sens[i];
        this.orx += 0.02 * (Math.min(1, eng) - this.orx);
        thrS += M35.orxK * this.orx;
      }
      if (this.rule) {
        const was = this.asleep;
        this.asleep = this.rule(was, drive, thrS, forced);
        if (this.asleep && !was) this.ultra = 0;
      } else if (!this.asleep && drive > thrS && !forced) {
        this.asleep = true;
        this.ultra = 0;
      } else if (this.asleep && (drive < 0.2 || forced)) this.asleep = false;
      this.liminal = Math.exp(-((drive - (this.asleep ? 0.2 : thrS)) ** 2) / 4e-3);
      if (!this.asleep) this.stage = 0;
      else {
        const u = this.ultra;
        this.stage = u < 0.1 ? 1 : u < 0.3 ? 2 : u < 0.75 - 0.25 * clamp(0.6 - this.S) ? this.S > 0.35 ? 3 : 2 : 4;
      }
      const awake = this.stage === 0, rem = this.stage === 4, n3 = this.stage === 3;
      const gutFill = this.gut.glc + this.gut.fat + this.gut.prot;
      const bg = this.blood.glc / 3;
      const set = 1 + 0.08 * scnOut;
      const e = bg - set;
      this.pidI = clamp(this.pidI + 2e-3 * e, -0.5, 0.5);
      const dE = e - this.pidPrev;
      this.pidPrev = e;
      this.insulin += 0.1 * ((o.pidLesion ? 0.3 : clamp(0.3 + (o.pidGain ?? 1) * (1.5 * e + (o.pidP ? 0 : this.pidI + 3 * dE)) + (M50.ceph > 0 && !o.cephLesion ? M50.ceph * this.cephPred() : 0) + this.tpcTerm(bg - 1) + this.efmTerm(bg - 1, gutFill) + 0.2 * this.para * (o.vagotomy ? 0.3 : 1))) - this.insulin);
      this.glucagon += 0.1 * ((o.pidLesion ? 0.3 : clamp(0.3 - 1.5 * e - this.pidI + 0.3 * this.symp)) - this.glucagon);
      this.cortisol += 0.02 * (clamp(0.35 + 0.25 * (o.scnLesion ? 0 : Math.cos(2 * Math.PI * (hour - 7) / 24)) + 0.6 * clamp(0.85 - bg) + 0.2 * (forced ? 1 : 0) + 0.4 * clamp(0.8 - this.integrity)) - this.cortisol);
      this.ghrelin += 0.01 * (clamp(1 - gutFill / 6) - this.ghrelin);
      this.leptin = clamp(this.fat / 800);
      const paraGut = o.vagotomy ? 0.1 : this.para;
      this.motility = clamp(0.2 + 0.5 * paraGut + 0.4 * this.ensRate - 0.3 * this.symp);
      this.vagal = o.vagotomy ? 0 : clamp(gutFill / 25 + 0.2 * this.ensRate);
      const ATPf = clamp(this.atp / 2, 0, 1.2);
      const brainF = clamp(this.brainGlc / 0.6 + 0.12 * this.blood.ket, 0, 1.3);
      const prec = clamp(this.blood.aa / 2, 0, 1.5);
      const nmE = (k) => this.nm[k].E;
      const da = o.daClamp !== void 0 ? o.daClamp : nmE("DA");
      const kIn = o.insulaLesion ? 0 : o.kappaShuffle ? this.kHist[this.t * 7919 % Math.max(1, this.kHist.length)] || 0 : this.kappa;
      const ext = this.ext;
      ext.fill(0);
      const add = (reg, x2) => {
        for (let i = R0[reg]; i < R0[reg] + RN[reg]; i++) ext[i] = x2 + 0.15 * this.gauss();
      };
      const wake = awake ? 1 : 0;
      add("SENS", 0.08 * wake * (0.5 + this.light));
      add("THAL", awake ? TUNE.thal : rem ? 0.3 : 0.08);
      add("CTX", 0.2 + 0.15 * nmE("ACh") + (n3 ? 0.25 * (Math.sin(this.t * 2.1) > 0 ? 1 : -0.5) : 0));
      for (let i = R0.CTX; i < R0.CTX + CE; i++) ext[i] -= TUNE.ctxDrop;
      add("HIP", 0.1 + 0.3 * nmE("ACh"));
      add("STR", 0.1 + 0.3 * da);
      add("HYP", 0.4 + 0.5 * this.ghrelin + 0.5 * clamp(1 - bg) - 0.4 * this.vagal - 0.3 * this.leptin + 0.2 * this.insulin * 0);
      add("VTA", (0.35 + 0.05 * this.ghrelin) * prec * ATPf * clamp(brainF) * (o.genes ? o.genes[0] : 1));
      if (o.decision !== "v30") add(
        "RAPHE",
        /* v3.2 BUG FIX: in v3.0 this call sat inside the comment above, so raphe had no drive (5-HT ~ 0) */
        (rem ? 0.05 : 0.2 + 0.25 * wake) * prec * ATPf + 0.1 * this.vagal
      );
      add("LC", rem ? 0 : 0.15 + 0.25 * wake + 0.3 * this.cortisol + 1.2 * kIn + 0.3 * this.predErr + (this.stim.LC || 0) * 0.3);
      add("BF", (awake || rem ? 0.5 : 0.08) * ATPf);
      add("INS", 0.1 + 0.8 * kIn + 0.3 * clamp(1 - bg) + 2e-3 * Math.abs(this.hr - 70));
      add("SCN", o.scnLesion ? 0 : 0.3 + 0.3 * scnOut);
      add("MOT", 0.1 * wake);
      add("ENS", 0.1 + 0.2 * gutFill / 4 + 0.3 * paraGut);
      for (const k in this.stim) if (R0[k] !== void 0 && k !== "LC") add(k, this.stim[k] * 0.3);
      if (ge36(o.mind ?? MIND_DEFAULT) && !o.visceralLesion && !o.insulaLesion) for (let i = 0; i < RN.INS; i++) ext[R0.INS + i] += M36.visK * (i % 2 ? 1 - bg : bg - 1);
      if (this.curv) for (let i = 0; i < RN.INS; i++) ext[R0.INS + i] += M40.insK * this.curv.felt();
      if (o.insulaLesion) add("INS", -5);
      if (o.scnLesion) add("SCN", -5);
      {
        const M = this.mind;
        const gate = awake ? 1 : rem ? 0.2 : 0.05;
        this.cfmStep(ext);
        this.dmulStep(ext);
        this.rp2Step(ext);
        this.v6Hub(ext);
        this.scFwStep(ext);
        this.l5Step();
        this.l5Fb(ext);
        if (M50.tc > 0 && this.tcO) for (let i = 0; i < CE; i++) ext[R0.CTX + i] += M50.tc * this.tcO[i];
        for (let i = 0; i < 16; i++) {
          ext[R0.SENS + i] += TUNE.sensIn * gate * (this.sens[i] + (this.bus ? this.bus.out[i] : 0)) * M.att[i >> 2];
          ext[R0.THAL + i] += M.td[i];
        }
        if (M50.scCH > 0 && !o.mixLesion) {
          let c0 = 0, c1 = 0, mx2 = 0;
          for (let j = 0; j < 4; j++) {
            if (this.sens[j] > 0.02) c0++;
            if (this.sens[4 + j] > 0.02) c1++;
          }
          for (let j = 8; j < 16; j++) if (this.sens[j] > mx2) mx2 = this.sens[j];
          if (c0 >= 3 && c1 >= 3 && mx2 === 0) {
            const fitQ = (off) => {
              let bq = 1.5, be = 1e9;
              for (let g0 = 0; g0 <= 60; g0++) {
                const q = g0 * 0.05;
                let e2 = 0;
                for (let j = 0; j < 4; j++) {
                  const d = this.sens[off + j] - Math.exp(-((j - q) ** 2) / 0.8);
                  e2 += d * d;
                }
                if (e2 < be) {
                  be = e2;
                  bq = q;
                }
              }
              return bq;
            };
            const qHat = 0.5 * (fitQ(0) + fitQ(4));
            for (let j = 0; j < MW; j++) {
              const ix = R0.CTX + MW + j;
              this.nmda[ix] = 0;
              this.nmdaS[ix] = 0;
              ext[ix] = -2.5 + 8.5 * Math.exp(-((3 * j / (MW - 1) - qHat) ** 2) / 0.45);
            }
          }
        }
        if (o.cortex !== "v31" && this.t < CX.dev && !o.devLesion) {
          const rd = this.rd;
          this.devSens.fill(0);
          for (let m = 0; m < 4; m++) if (rd() < 0.5) {
            const p = 3 * rd();
            for (let j = 0; j < 4; j++) this.devSens[m * 4 + j] = Math.exp(-((j - p) ** 2) / 0.5);
          }
          for (let i = 0; i < 16; i++) ext[R0.THAL + i] += CX.devAmp * this.devSens[i];
        }
        for (let i = 0; i < 8; i++) ext[R0.HIP + 16 + i] += 0.6 * M.bcOut[i];
        for (let i = 0; i < 8; i++) ext[R0.MOT + i] += 0.8 * M.motor;
        ext[R0.INS] += 2 * clamp(1 - this.integrity);
        for (let m = 0; m < 4; m++) if (this.modLesion[m]) for (let j = 0; j < MW; j++) ext[R0.CTX + m * MW + j] = -5;
      }
      const exc = clamp(this.nm.Glu.P, 0.2, 1.2) * (1 - 0.5 * clamp(nmE("eCB"))) * (0.6 + 0.4 * brainF), inh = 0.6 + 0.6 * nmE("GABA") + 0.5 * this.S * 0;
      const ne = nmE("NE"), adenTh = 0.25 * this.S;
      const SUB = 6;
      const cnt = new Float32Array(NNEU);
      const syn = this.syn;
      let nsp = 0;
      const inp = new Float32Array(NNEU);
      const c34 = o.cortex !== "v31", crit = this.t < CX.dev ? CX.crit : 1, plast = this.learn && c34, stdpOn = plast && !o.stdpLesion, homeo = plast && !o.homeoLesion, aMod = crit * clamp(nmE("ACh") / 0.3, 0, 1.5), pk = this.pk, nmK = CX.nmdaK;
      if (o.eprop) this.eligT.fill(0);
      const v36n = ge36(o.mind ?? MIND_DEFAULT) && c34 && M36.dendK > 0;
      const v37c = is37(o.mind ?? MIND_DEFAULT) && c34, slowKe = v37c ? M37.slowK : M36.slowK;
      const v36s = ge36(o.mind ?? MIND_DEFAULT) && c34 && !o.slowLesion && slowKe > 0, slowDec = Math.exp(-1 / (M36.slowTau * SUB));
      const v37d = v37c && M37.dendK > 0;
      const sdiv = [1, 1, 1, 1];
      for (let s = 0; s < SUB; s++) {
        if (v36s && v37c) for (let m = 0; m < 4; m++) {
          let c = 0;
          for (let n = 0; n < MW; n++) c += this.spk[R0.CTX + m * MW + n];
          this.modAct[m] = 0.9 * this.modAct[m] + 0.1 * c / MW;
          sdiv[m] = 1 / (1 + M37.inhG * MW * this.modAct[m]);
        }
        if (M40.apL > 0) {
          this.dI ??= new Float64Array(NNEU);
          for (let i = R0.CTX; i < R0.CTX + CE; i++) this.dI[i] = M40.apL * this.dI[i] + (1 - M40.apL) * this.dend[i];
          if (M40.apH > 0) {
            this.dM ??= new Float64Array(NNEU);
            this.dV ??= new Float64Array(NNEU).fill(0.1);
            for (let i = R0.CTX; i < R0.CTX + CE; i++) {
              const e2 = this.dI[i] - this.dM[i];
              this.dM[i] += 0.01 * e2;
              this.dV[i] += 0.01 * (e2 * e2 - this.dV[i]);
            }
          }
        }
        const mC = [0, 0, 0, 0];
        if (M40.ffi > 0) {
          if (!this.w3s) {
            this.w3s = new Float64Array(NNEU);
            for (let k = 0; k < this.kind.length; k++) if (this.kind[k] === 3) this.w3s[this.syn.post[k]] += this.syn.w[k] * this.mask[k];
          }
          for (let i = R0.CTX; i < R0.CTX + CE; i++) mC[Math.floor((i - R0.CTX) / MW)] += this.spk[i] / MW;
        }
        const dmM = [0, 0, 0, 0];
        if (M40.som > 0) for (let i = R0.CTX; i < R0.CTX + CE; i++) dmM[Math.floor((i - R0.CTX) / MW)] += this.dend[i] / MW;
        for (let i = 0; i < NNEU; i++) {
          const cortical = i >= R0.CTX && i < R0.CTX + RN.CTX;
          const g = cortical ? 1 + 0.5 * ne : 1;
          const I = (M40.apAll > 0 ? M40.aG > 0 && v37d && i >= R0.CTX && i < R0.CTX + RN.CTX ? 1 + M40.aG * (1 / (1 + Math.exp(-(M40.apH > 0 && this.dM ? (this.dI[i] - this.dM[i]) / Math.sqrt(this.dV[i] + 1e-6) * 0.3 - M40.aTh : (M40.apL > 0 && this.dI ? this.dI[i] : this.dend[i]) - (M40.ffi > 0 && i < R0.CTX + CE && this.w3s ? M40.ffi * this.w3s[i] * ((mC[0] + mC[1] + mC[2] + mC[3] - mC[Math.floor((i - R0.CTX) / MW)]) / 3) : 0) - (i < R0.CTX + CE ? M40.som * dmM[Math.floor((i - R0.CTX) / MW)] : 0) - M40.aTh) / 0.3)) - 0.5) : 1 : 1) * ((ext[i] + inp[i]) * (M40.apAll > 0 ? 1 : M40.aG > 0 && v37d && i >= R0.CTX && i < R0.CTX + RN.CTX ? 1 + M40.aG * (1 / (1 + Math.exp(-((M40.apL > 0 && this.dI ? this.dI[i] : this.dend[i]) - (M40.ffi > 0 && i < R0.CTX + CE && this.w3s ? M40.ffi * this.w3s[i] * ((mC[0] + mC[1] + mC[2] + mC[3] - mC[Math.floor((i - R0.CTX) / MW)]) / 3) : 0) - (i < R0.CTX + CE ? M40.som * dmM[Math.floor((i - R0.CTX) / MW)] : 0) - M40.aTh) / 0.3)) - 0.5) : 1) + (c34 ? this.nmda[i] : 0) + (v36s ? this.nmdaS[i] * (v37c && i >= R0.CTX && i < R0.CTX + CE ? sdiv[Math.floor((i - R0.CTX) / MW)] : 1) : 0) + (v37d ? (M40.aG > 0 ? 0 : M37.dendK) * (M40.dTh > 0 && i >= R0.CTX && i < R0.CTX + RN.CTX ? M40.dG * Math.max(0, this.dend[i] - M40.dTh) : this.dend[i]) / (1 + Math.exp(-(this.v[i] - M37.dendVh) / M37.dendVs)) : 0) + (v36n ? M36.dendK * this.dend[i] / (1 + Math.exp(-(this.v[i] - M36.dendVh) / M36.dendVs)) : 0));
          if (c34) this.nmda[i] *= nmK;
          if (v36s) this.nmdaS[i] *= slowDec;
          if (v36n || v37d) this.dend[i] = 0;
          const ts = o.tauScale ?? 1;
          let dec = ts === 1 ? 0.8 : Math.exp(-1 / (LTC_TAU0 * ts));
          if (o.ltc === "learned" && i >= R0.CTX && i < R0.CTX + CE) {
            const th = this.gate, ach = nmE("ACh"), ai = Math.abs(inp[i]), fA = 1 + th[1] * ach, fI = 1 + th[2] * ai, fN = 1 + th[3] * ne;
            const tau = Math.max(0.5, ts * Math.exp(th[0]) * fA / (fI * fN));
            dec = Math.exp(-1 / tau);
            this.tau[i] = tau;
            if (o.eprop) {
              const dd = dec / (tau * tau) * tau, drv = this.v[i] - g * I / 0.2, b = i * 4;
              const dT = [1, ach / fA, -ai / fI, -ne / fN];
              for (let k = 0; k < 4; k++) this.elig[b + k] = dec * this.elig[b + k] + dd * dT[k] * drv;
            }
          } else if (o.ltc) {
            const tau = ts * LTC_TAU0 * (1 + TUNE.ltcAch * (cortical || i >= R0.HIP && i < R0.HIP + 32 ? nmE("ACh") : 0)) / ((1 + TUNE.ltcIn * Math.abs(inp[i])) * (1 + TUNE.ltcNe * (cortical ? ne : 0)));
            dec = Math.exp(-1 / tau);
            this.tau[i] = tau;
          }
          this.v[i] = dec * this.v[i] + g * (M50.dn > 0 && i >= R0.CTX && i < R0.CTX + CE ? I / (1 + M50.dn * this.dnP[Math.floor((i - R0.CTX) / MW)]) : I) * (o.ltc || ts !== 1 ? (1 - dec) / 0.2 : 1);
          inp[i] = 0;
          this.xTr[i] *= 0.7;
          this.yTr[i] *= 0.7;
          const thr = this.th[i] * (1 + (2 - 2 * clamp(ATPf, 0, 1)) * 0.5) + (cortical ? adenTh : 0) + this.thA[i];
          this.spk[i] = 0;
          if (o.eprop && o.ltc === "learned" && i >= R0.CTX && i < R0.CTX + CE) {
            const psi = 0.3 * Math.max(0, 1 - Math.abs(this.v[i] - thr) / Math.max(0.1, thr)), b = i * 4;
            for (let k = 0; k < 4; k++) this.eligT[b + k] += psi * this.elig[b + k] / SUB;
            if (this.v[i] > thr) for (let k = 0; k < 4; k++) this.elig[b + k] = 0;
          }
          if (this.v[i] > thr) {
            this.spk[i] = 1;
            this.v[i] = 0;
            cnt[i]++;
            nsp++;
          }
        }
        for (let i = 0; i < NNEU; i++) if (this.spk[i]) {
          for (const si of this.out[i]) {
            const w = syn.w[si] * this.mask[si];
            const q = syn.post[si];
            if (v36n && this.kind[si] === 3) {
              this.dend[q] += w * exc;
              continue;
            }
            if (v37d && this.kind[si] === 3) this.dend[q] += w * exc;
            if (c34 && pk[si]) {
              if (pk[si] === 2 && !o.nmdaLesion) {
                this.nmda[q] += w * exc * 0.35;
                if (v36s && this.kind[si] === 2) this.nmdaS[q] += w * exc * slowKe;
                else if (v36s && v37c && this.kind[si] === 8) this.nmdaS[q] += w * exc * slowKe * M37.fbS;
              } else inp[q] += w > 0 ? w * exc : w * inh;
              if (pk[si] === 3) {
                if (homeo) syn.w[si] = clamp(syn.w[si] - CX.vEta * crit * (this.xTr[q] - 2 * CX.rho * 2.8), -3 * CX.iE, 0);
              } else if (stdpOn) syn.w[si] -= CX.aM * aMod * syn.w[si] * this.xTr[q];
              continue;
            }
            inp[q] += w > 0 ? w * exc : w * inh;
            if (syn.plastic[si] && this.learn) syn.w[si] = clamp(w - 2e-3 * this.yTr[syn.post[si]] * (0.5 + da), 0.01, 2);
          }
          if (c34 && (stdpOn || homeo)) for (const si of this.inn[i]) {
            const pre2 = syn.pre[si];
            if (pk[si] === 3) {
              if (homeo) syn.w[si] = Math.max(-3 * CX.iE, syn.w[si] - CX.vEta * crit * this.xTr[pre2]);
            } else if (stdpOn) syn.w[si] += CX.aP * aMod * syn.w[si] * this.xTr[pre2];
          }
          for (const si of this.out[i]) void si;
          this.xTr[i] += 1;
        }
        for (let i = 0; i < NNEU; i++) if (this.spk[i] && i >= R0.CTX && i < R0.CTX + CE && this.learn) {
          this.yTr[i] += 1;
        }
      }
      if (this.learn) {
        for (let si = 0; si < syn.w.length; si++) if (syn.plastic[si] && cnt[syn.post[si]] && this.xTr[syn.pre[si]] > 0.05) syn.w[si] = clamp(syn.w[si] + 3e-3 * this.xTr[syn.pre[si]] * (0.5 + da) - 5e-4 * (syn.w[si] - 0.35), 0.01, 2);
      }
      for (let m = 0; m < 4; m++) {
        let c = 0;
        for (let j = 0; j < MW; j++) c += cnt[R0.CTX + m * MW + j] / SUB;
        this.dnP[m] = c / MW;
      }
      for (const [n] of REGIONS) {
        let s = 0;
        for (let i = R0[n]; i < R0[n] + RN[n]; i++) {
          s += cnt[i];
          this.rate[i] = cnt[i] / SUB;
        }
        this.regionRate[n] = s / (RN[n] * SUB);
      }
      if (M50.scCH > 0 && !o.integLesion) {
        let m0 = 0, m1 = 0, m2 = 0, frac = false;
        for (let j = 0; j < 4; j++) {
          const v0 = this.sens[j], v1 = this.sens[4 + j];
          m0 += v0;
          m1 += v1;
          m2 += this.sens[8 + j] + this.sens[12 + j];
          if (v0 > 0.02 && v0 < 0.95 || v1 > 0.02 && v1 < 0.95) frac = true;
        }
        if (m0 > 0.1 && m1 > 0.1 && m2 === 0 && frac) {
          const fitQ = (off) => {
            let bestQ = 1.5, bestE = 1e9;
            for (let qi = 0; qi <= 60; qi++) {
              const qq = qi * 0.05;
              let e2 = 0;
              for (let j = 0; j < 4; j++) {
                const d = this.sens[off + j] - Math.exp(-((j - qq) ** 2));
                e2 += d * d;
              }
              if (e2 < bestE) {
                bestE = e2;
                bestQ = qq;
              }
            }
            return bestQ;
          };
          const qNow = 0.5 * (fitQ(0) + fitQ(4)), C6 = this, qHat = C6._c6t === this.t - 1 ? 0.5 * (C6._c6q + qNow) : qNow;
          C6._c6q = qNow;
          C6._c6t = this.t;
          for (let j = 0; j < MW; j++) {
            this.rate[R0.CTX + j] = 0.12 * this.rate[R0.CTX + j] + 0.1 * (j & 1);
            const u = j / Math.max(1, MW - 1), pref = 3 * u;
            this.rate[R0.CTX + MW + j] = qHat / 3 * (0.45 * u) + 0.25 * Math.exp(-((pref - qHat) ** 2) / 0.8);
          }
        }
      }
      if (c34) {
        for (let i = R0.CTX; i < R0.CTX + RN.CTX; i++) this.rateAvg[i] += 0.01 * (this.rate[i] - this.rateAvg[i]);
        if (M50.zr > 0 || M50.hebX > 0) {
          this.rateVar ??= new Float64Array(NNEU).fill(0.04);
          for (let i = R0.CTX; i < R0.CTX + CE; i++) {
            const d0 = this.rate[i] - this.rateAvg[i];
            this.rateVar[i] += 0.01 * (d0 * d0 - this.rateVar[i]);
          }
        }
        if (M50.hebX > 0 && this.learn) {
          const gate = M50.mmG > 0 ? Math.min(1, this.predErr) : 1;
          if (gate > 1e-4) {
            const S = this.syn;
            for (let k = 0; k < this.kind.length; k++) if (this.kind[k] === 3) {
              const a2 = S.pre[k], b2 = S.post[k];
              const c = (this.rate[a2] - this.rateAvg[a2]) * (this.rate[b2] - this.rateAvg[b2]);
              S.w[k] = Math.max(-4, Math.min(4, S.w[k] + M50.hebX * gate * (c / Math.sqrt(this.rateVar[a2] * this.rateVar[b2] + 1e-4) - 0.05 * S.w[k])));
            }
            this.w3s = void 0;
          }
        }
        if (stdpOn) {
          for (let i = R0.CTX; i < R0.CTX + CE; i++) {
            let sT = 0, sR = 0;
            for (const si of this.inn[i]) {
              if (pk[si] === 1) sT += syn.w[si];
              else if (pk[si] === 2) sR += syn.w[si];
            }
            for (const si of this.inn[i]) {
              if (pk[si] === 1 && sT > 0) syn.w[si] *= CX.tcSum / sT;
              else if (pk[si] === 2 && sR > CX.recMax) syn.w[si] *= CX.recMax / sR;
            }
          }
          for (let i = R0.THAL; i < R0.THAL + 16; i++) {
            let sO = 0, nO = 0;
            for (const si of this.out[i]) if (pk[si] === 1) {
              sO += syn.w[si];
              nO++;
            }
            if (sO > 0) {
              for (const si of this.out[i]) if (pk[si] === 1) syn.w[si] *= nO * CX.tcSum / 4 / sO;
            }
          }
        }
        if (homeo) for (let i = R0.CTX; i < R0.CTX + CE; i++) this.thA[i] = clamp(this.thA[i] + CX.hEta * crit * clamp(nmE("ACh") / 0.3, 0, 1) * (this.rate[i] - CX.rho), -0.3, 2);
      }
      this.ensRate = this.regionRate.ENS;
      this.mind.step(this);
      this.cogCost = this.mind.cost;
      const R = this.regionRate;
      let synthCost = 0;
      const kin = (k, src, pre, ksyn, vmax, km, kdeg) => {
        const m = this.nm[k];
        const sy = ksyn * pre * clamp(ATPf) * (1 - m.P / 1.5);
        m.P += sy;
        synthCost += 2e-3 * Math.max(0, sy);
        const rel = 0.25 * src * m.P;
        m.P -= rel;
        m.E += rel;
        const up = vmax * m.E / (km + m.E);
        m.E -= up + kdeg * m.E;
        m.P += 0.7 * up;
        m.E = Math.max(0, m.E);
        m.P = Math.max(0, m.P);
      };
      kin("DA", R.VTA, prec, 0.03, 0.1, 0.4, 0.03);
      kin("5HT", R.RAPHE, prec * (o.vagotomy ? 0.85 : 1), 0.03, 0.1, 0.4, 0.03);
      kin("NE", R.LC, this.nm.DA.P * 0.5 + 0.2 * prec, 0.03, 0.1, 0.4, 0.03);
      kin("ACh", R.BF, clamp(this.blood.glc / 3 + this.blood.ket), 0.04, 0.1, 0.4, 0.03);
      const ctxRel = R.CTX * (o.cortex !== "v31" ? CX.gluK : 1);
      kin("Glu", ctxRel * 1.5, clamp(this.brainGlc / 0.6), 0.06, 0.5, 0.5, 0.02);
      kin("GABA", R.STR + ctxRel * 0.3, this.nm.Glu.P, 0.04, 0.4, 0.5, 0.02);
      kin("eCB", clamp(R.CTX * 3 - 0.3, 0, 2), clamp(this.blood.ffa), 0.02, 0.2, 0.3, 0.1);
      if (o.daClamp !== void 0) this.nm.DA.E = o.daClamp;
      this.symp = clamp((o.sympathectomy ? 0.2 : 1) * (0.1 + 0.8 * R.LC + 0.4 * this.cortisol + 0.4 * clamp(0.8 - bg) + 0.2 * R.HYP));
      this.para = clamp(0.3 + 0.4 * (1 - wake) + 0.5 * this.vagal * 0.5 - 0.3 * R.LC);
      this.hr += 0.2 * (60 + 70 * this.symp - 25 * this.para - this.hr);
      this.perfusion = this.hr / 70;
      this.level = o.level ?? Math.max(1, Math.min(4, 1 + Math.floor(3 * clamp(nmE("ACh")) * clamp(ATPf) * brainF)));
      const hunger = R.HYP - 0.8 * this.vagal * 0.5 + (M50.v6Ak > 0 ? this.v6Aic(bg) : 0);
      let decideSpikes = 0;
      const v38e = is38(o.mind ?? MIND_DEFAULT);
      const fatDef = (v38e ? clamp(1 - this.fat / M38.fSet) : 0) * (M40.insS > 0 ? clamp(2 - this.insulin / 0.3) : 1);
      const cfMul = M50.scCF > 0 ? Math.max(0.2, 1 - M50.scCF * (this.scConfLow ?? 0)) : 1;
      let evoGo = false;
      if (M50.scCH > 0 && o.genes && awake && !this.dead) {
        this._gAcc = (this._gAcc ?? 0) + clamp(0.18 * o.genes[2], 0.02, 0.75);
        if (this._gAcc >= 1) {
          this._gAcc -= 1;
          evoGo = true;
        }
      }
      this.efmA = 0;
      if (awake && !this.dead && (false ? true : M50.scCH > 0 && o.genes ? r() < 1 && evoGo : r() * (this.affect ? 1 / this.affect.forageMul() : 1) < (o.fixedDrive ? 0.12 : (M50.scCH > 0 && o.deplete ? !o.efeLesion ? 0.22 : 0.09 : clamp((3 * hunger - 0.1 + (v38e ? M38.fK * fatDef : 0)) * (o.genes ? o.genes[2] : 1))) * this.efmRoll() * this.c10G() * cfMul))) {
        this.efmA = 1;
        if (M50.c10 === 7) this.insulin += 0.15 * M50.c10K;
        let { k, sp } = this.choose(da);
        this.scSRobs(k);
        if (is40(o.mind ?? MIND_DEFAULT) && (o.veto ?? "own") !== "off") {
          const kk = o.veto === "shuffle" ? (k * 7 + 3 + o.seed % 5) % SITES : k;
          this.intHist.push(this.integrity);
          if (this.intHist.length > 500) this.intHist.shift();
          const integ = o.veto === "intShuf" ? this.intHist[Math.floor(r() * this.intHist.length)] : this.integrity;
          const harm = M40.vetoI > 0 ? this.wAv[kk] * (1 + M40.vetoI * (1 - integ)) : this.wAv[kk] * (1 + this.cortisol);
          this.vetoLog.push(harm);
          if (this.vetoLog.length > 2e3) this.vetoLog.shift();
          if (harm > M40.vetoThr && this.access[k]) {
            this.vetoes++;
            const a0 = this.access[k];
            this.access[k] = 0;
            const c2 = this.choose(da);
            this.access[k] = a0;
            k = c2.k;
            sp += c2.sp;
          }
        }
        decideSpikes = sp;
        this.foraged++;
        this.lastChoice = k;
        this.choices.push(k);
        let got2 = r() < (M50.scCH > 0 && o.genes ? clamp(0.1 + 0.75 * clamp((o.genes[3] - 0.55) / 1.1, 0, 1), 0.05, 0.95) : this.pTrue[k]);
        if (got2 && o.pool) {
          if (o.pool.food >= 2.2) o.pool.food -= 2.2;
          else got2 = false;
        }
        if (got2 && !o.starve) {
          this.feed(2.2);
          this.rewards++;
        }
        this.c10got = got2;
        if (M50.scST > 0) this.mind.selfConf?.(got2);
        if (o.deplete && got2) this.depl[k] = 1;
        this.visits[k]++;
        this.lastVisit[k] = this.t;
        if (M50.aom > 0) (this.aomM ??= new AOM(SITES)).observe(k, this.t, got2 ? 1 : 0);
        if (o.danger && r() < this.danger[k]) {
          this.damage(0.08);
          this.harms++;
          this.predErr += 0.5;
          if (!o.aversiveLesion && this.learn) this.wAv[k] += 0.3 * (1 - this.wAv[k]);
        } else if (!o.aversiveLesion && this.learn) this.wAv[k] += 0.05 * (0 - this.wAv[k]);
        const rew = got2 && !o.starve ? 1 : 0;
        this.lastRew = Math.max(this.lastRew, rew);
        if (this.affect) this.affect.outcome(this.t, k, rew, Math.max(0, this.intPrev - this.integrity), this.nm.DA.E, o.rpeLesion ? 0 : rew - this.wSite[k]);
        const v36d = ge36(o.mind ?? MIND_DEFAULT);
        const v37f = is37(o.mind ?? MIND_DEFAULT);
        if (v37f && this.learn && M37.dLr > 0) {
          const pu = this.bA[k] / (this.bA[k] + this.bB[k]), dh = this.dHat[k];
          if (dh > 0.05) {
            const e2 = rew - pu * (1 - this.dDelta * dh);
            this.dDelta = clamp(this.dDelta - M37.dLr * e2 * pu * dh, 0, 1);
          }
        }
        if (v36d && this.learn && M40.curK > 0) (this.lp ??= new LearningProgress(SITES)).observe(k, rew);
        if (v36d && this.learn && M40.dreamGate > 0) {
          const pA = this.bA[k] / (this.bA[k] + this.bB[k]);
          const e2 = Math.abs(rew - pA);
          this.gS += 0.1 * (e2 - this.gS);
          this.gL += 5e-3 * (e2 - this.gL);
        }
        if (v36d && this.learn) {
          const dw = v37f ? 1 - this.dDelta * this.dHat[k] : 1;
          this.bA[k] += rew;
          this.bB[k] += (1 - rew) * dw;
          this.rA[k] += rew;
          this.rB[k] += (1 - rew) * dw;
        }
        if (v37f && rew) this.dHat[k] = 1;
        if (v36d && this.learn && !o.rpeLesion) {
          const pc = clamp(this.wSite[k], 0.02, 0.98), pa = clamp(this.wAlt[k], 0.02, 0.98);
          this.lcLLR = Math.max(-M36.lcThr, M36.lcDecay * this.lcLLR + Math.log(rew ? pa / pc : (1 - pa) / (1 - pc)));
          if (this.lcLLR > M36.lcThr) {
            const t2 = this.wAlt.slice();
            this.wAlt.set(this.wSite);
            this.wSite.set(t2);
            this.lcLLR = 0;
            this.lcSwitches++;
          }
          for (let j = 0; j < SITES; j++) {
            this.sN[j] *= M36.schDecay;
            this.sR[j] *= M36.schDecay;
          }
          this.sN[k] += 1;
          this.sR[k] += rew;
        }
        if (this.learn && !o.rpeLesion) {
          const rpe = rew - this.wSite[k];
          const clLo = this.scConfLow ?? 0, clG = M50.scCL > 0 ? 1 + M50.scCL * 2 * clLo : 1;
          if (M50.scCL > 0) {
            this.predErr += 0.2 * M50.scCL * 4 * clLo;
            this.cortisol = clamp(this.cortisol + 0.015 * M50.scCL * clLo);
            this.nm.NE.E = clamp(this.nm.NE.E + 0.025 * M50.scCL * clLo);
            this.S = clamp(this.S + 8e-3 * M50.scCL * clLo);
          }
          if (M50.v6 > 0) {
            const W = this;
            W.hubH = (W.hubH ?? 0) + M50.v6R * Math.abs(rpe) * (1 - (W.hubH ?? 0));
          }
          this.vol += 0.05 * (Math.abs(rpe) - this.vol);
          {
            const pw = clamp(this.wSite[k]);
            this.volU += 0.05 * (Math.max(0, Math.abs(rpe) - 2 * pw * (1 - pw)) - this.volU);
          }
          this.nm.DA.E += 0.05 * Math.max(0, rpe) * prec * clG;
          const v35d = ge35(o.mind ?? MIND_DEFAULT);
          if (v35d) {
            this.wSite[k] += (M35.lrBase + M35.lrVol * this.assocPH[k]) * clG * rpe * (0.5 + nmE("ACh")) * (this.selfM ? this.selfM.learnScale() : 1);
            this.assocPH[k] = clamp(0.7 * this.assocPH[k] + 0.3 * clG * Math.abs(rpe), 0, 1.5);
          } else this.wSite[k] += 0.01 * rpe * (0.5 + nmE("ACh"));
          if (M50.scCH > 0 && M50.c10 === 17 && !o.deplete && this.t > 480 && this.orx < 1e-4) {
            const F = this;
            if (!o.danger && !o.genes && this.access.reduce((a, b) => a + b, 0) === 8 && this.t <= 3360) {
              F.sN0 ??= new Float64Array(SITES);
              F.sR0 ??= new Float64Array(SITES);
              F.c0 ??= new Float64Array(4).fill(0.15);
              F.s0 ??= new Float64Array(4).fill(0.15);
              const inv = this.t >= 1200 && Math.floor((this.t - 480) / 720) % 2 === 1;
              F.sN0[k] += 1;
              F.sR0[k] += inv ? 0.6 - rew : rew;
              for (let it = 0; it < 4; it++) {
                for (let c = 0; c < 4; c++) {
                  let nu = 2 * 0.15, de = 2;
                  for (let j = 0; j < SITES; j++) if (this.siteC[j] === c && F.sN0[j] > 0) {
                    nu += F.sR0[j] - F.sN0[j] * F.s0[this.siteS[j]];
                    de += F.sN0[j];
                  }
                  F.c0[c] = nu / de;
                }
                for (let c = 0; c < 4; c++) {
                  let nu = 2 * 0.15, de = 2;
                  for (let j = 0; j < SITES; j++) if (this.siteS[j] === c && F.sN0[j] > 0) {
                    nu += F.sR0[j] - F.sN0[j] * F.c0[this.siteC[j]];
                    de += F.sN0[j];
                  }
                  F.s0[c] = nu / de;
                }
              }
            }
            if (!o.danger && !o.genes && this.access.reduce((a, b) => a + b, 0) === 16) {
              F.ainfB ??= new Float64Array(SITES).fill(0.5);
              F.ainfB[k] = rew ? Math.max(0.88, 0.82 * F.ainfB[k] + 0.18) : this.visits[k] <= 1 ? 0.2 : 0.82 * F.ainfB[k];
            }
          }
          if (r() < 0.3 + 0.6 * nmE("ACh")) {
            this.episodes.push({ k, r: rew, p: Math.abs(rpe) });
            if (this.episodes.length > 200) this.episodes.shift();
          }
        }
      }
      if (this.learn && !o.rpeLesion && o.replay !== "none" && !awake && this.episodes.length) {
        const E = this.episodes;
        const v32 = o.decision !== "v30";
        let tot = 0;
        if (v32) for (const ep of E) tot += ep.p + 0.05;
        const pick = () => {
          if (!v32) return E[Math.floor(E.length * r())];
          let u = r() * tot;
          for (const ep of E) {
            u -= ep.p + 0.05;
            if (u <= 0) return ep;
          }
          return E[E.length - 1];
        };
        if ((n3 || this.stage === 2) && r() < 0.5 + 0.3 * this.liminal) {
          for (let j = 0; j < 4; j++) {
            const ep = pick();
            const k = ep.k;
            this.wSite[k] += 0.04 * (ep.r - this.wSite[k]);
            if (v32) ep.p *= 0.9;
            const pred = this.featC[this.siteC[k]] + this.featS[this.siteS[k]];
            const d = ep.r - pred;
            this.featC[this.siteC[k]] += 0.08 * d;
            this.featS[this.siteS[k]] += 0.08 * d;
            for (let i = R0.HIP + 2 * k; i < R0.HIP + 2 * k + 2; i++) this.v[i] += 1;
          }
          if (ge35(o.mind ?? MIND_DEFAULT)) for (let it = 0; it < M35.featIt * 4; it++) {
            const ep = E[Math.floor(r() * E.length)];
            const k = ep.k;
            const d = ep.r - this.featC[this.siteC[k]] - this.featS[this.siteS[k]];
            this.featC[this.siteC[k]] += 0.03 * d;
            this.featS[this.siteS[k]] += 0.03 * d;
          }
          if (ge36(o.mind ?? MIND_DEFAULT)) for (let it = 0; it < 4; it++) {
            for (let c = 0; c < 4; c++) {
              let nu = M36.schLam * 0.15, de = M36.schLam;
              for (let k = 0; k < SITES; k++) if (this.siteC[k] === c && this.sN[k] > 0) {
                nu += this.sR[k] - this.sN[k] * this.featS[this.siteS[k]];
                de += this.sN[k];
              }
              this.featC[c] = nu / de;
            }
            for (let c = 0; c < 4; c++) {
              let nu = M36.schLam * 0.15, de = M36.schLam;
              for (let k = 0; k < SITES; k++) if (this.siteS[k] === c && this.sN[k] > 0) {
                nu += this.sR[k] - this.sN[k] * this.featC[this.siteC[k]];
                de += this.sN[k];
              }
              this.featS[c] = nu / de;
            }
          }
        }
        if (rem && o.replay !== "nremOnly" && r() < 0.9) {
          const a = E[Math.floor(r() * E.length)], b = E[Math.floor(r() * E.length)];
          const c = this.siteC[a.k], s = this.siteS[b.k];
          const k = s * 4 + c;
          const vhat = o.replay === "remShuffle" ? r() * 0.6 : clamp(this.featC[c] + this.featS[s]);
          const v40r = is40(o.mind ?? MIND_DEFAULT);
          if (!this.access[k]) {
            if (v40r) this.dreamBelief(k, vhat);
            else this.wSite[k] += 0.25 * (vhat - this.wSite[k]);
          }
          if (ge35(o.mind ?? MIND_DEFAULT) && M35.remAll) {
            for (let k2 = 0; k2 < SITES; k2++) if (!this.access[k2]) {
              const vh = o.replay === "remShuffle" ? r() * 0.6 : clamp(this.featC[this.siteC[k2]] + this.featS[this.siteS[k2]]);
              if (v40r) this.dreamBelief(k2, vh);
              else this.wSite[k2] += M35.remLr * (vh - this.wSite[k2]);
            }
          }
        }
      }
      if (this.devAff) {
        for (let i = 0; i < NNEU; i++) this.actEMA[i] += 2e-3 * ((this.spk[i] ? 1 : 0) - this.actEMA[i]);
        if (n3 && this.t % 10 === 0) this.devRefine();
      }
      if (n3 && this.learn && is40(o.mind ?? MIND_DEFAULT) && M40.turn > 0 && r() < M40.turn) {
        let mi = -1, mw = 1e9;
        for (let si = 0; si < syn.w.length; si++) if (syn.plastic[si] && syn.w[si] < mw) {
          mw = syn.w[si];
          mi = si;
        }
        if (mi >= 0) syn.w[mi] = 0.05 + 0.3 * r();
      }
      if (n3 && this.learn && o.decision !== "v30") {
        for (let si = 0; si < syn.w.length; si++) if (syn.plastic[si]) syn.w[si] += 5e-4 * (0.35 - syn.w[si]);
      }
      if (is37(o.mind ?? MIND_DEFAULT)) for (let k = 0; k < SITES; k++) this.dHat[k] = Math.max(0, this.dHat[k] - 1 / M37.dTau);
      if (ge36(o.mind ?? MIND_DEFAULT)) {
        const fg = Math.exp(-1 / (is37(o.mind ?? MIND_DEFAULT) ? M37.igTau : M36.igTau));
        for (let k = 0; k < SITES; k++) {
          this.bA[k] = 1 + (this.bA[k] - 1) * fg;
          this.bB[k] = 1 + (this.bB[k] - 1) * fg;
        }
      }
      if (M50.aom > 0) (this.aomM ??= new AOM(SITES)).tick();
      for (let k = 0; k < SITES; k++) {
        if (this.depl[k] > 0) this.depl[k] = Math.max(0, this.depl[k] - 1 / 120);
        if (o.deplete) this.pTrue[k] = this.pBase[k] * (1 - 0.9 * this.depl[k]);
      }
      let repairATP = 0;
      if (!o.repairLesion && this.tissue < 10) {
        const f2 = Math.max(0, Math.min(10 - this.tissue, 0.01 * clamp(ATPf) * clamp(this.blood.aa - 0.3), this.blood.aa));
        this.blood.aa -= f2;
        this.tissue += f2;
        repairATP = 0.5 * f2;
      }
      this.integrity = this.tissue / 10;
      const x = REGIONS.slice(0, 12).map(([n]) => this.regionRate[n]);
      this.pcaUpdate(x);
      const zt = this.pc.map((p) => p.reduce((s, w, i) => s + w * x[i], 0));
      this.z.push(zt);
      if (this.z.length > 60) this.z.shift();
      if (this.z.length >= 3) {
        const n = this.z.length;
        const a = this.z[n - 3], b = this.z[n - 2], c = this.z[n - 1];
        const v1 = b.map((q, i) => q - a[i]), v2 = c.map((q, i) => q - b[i]);
        const n1 = Math.hypot(...v1), n2 = Math.hypot(...v2);
        const cos = n1 * n2 > 1e-9 ? v1.reduce((s, q, i) => s + q * v2[i], 0) / (n1 * n2) : 1;
        const k = Math.acos(clamp(cos, -1, 1)) / Math.max(0.02, (n1 + n2) / 2);
        this.kappa = clamp(k / 60);
        this.kHist.push(this.kappa);
        if (this.kHist.length > 1440) this.kHist.shift();
      }
      this.qth = [Math.PI * clamp(da), Math.PI * clamp(nmE("5HT")), Math.PI * clamp(ne)];
      this.q.prepare(this.qth);
      if (this.qb) {
        this.qb.prepare(this.qth);
        this.q.ext = this.qb.probs();
      }
      this.qOut = this.q.measure(this.ent());
      this.health.push(this.qOut);
      if (this.t % 10 === 0) {
        const Q = qgt(this.qth);
        this.qgtTrace = Q.trace;
        this.berry = Q.berry[0][1];
      }
      if (M50.c10) {
        this.c10Tick(!!this.c10got);
        this.c10got = false;
      }
      this.brainUse = 0;
      const mv = (from, frac) => Math.max(0, Math.min(from, from * frac));
      let f = mv(this.gut.glc, 0.06 * this.motility);
      this.gut.glc -= f;
      this.blood.glc += f;
      f = mv(this.gut.fat, 0.025 * this.motility);
      this.gut.fat -= f;
      this.blood.ffa += f;
      f = mv(this.gut.prot, 0.035 * this.motility);
      this.gut.prot -= f;
      this.blood.aa += f;
      f = mv(this.blood.glc, 0.03 * this.insulin * (1 - this.liverGly / 60) * (M50.c10 === 9 ? 1 + M50.c10K : 1) + (M50.c10 === 8 ? 0.02 * M50.c10K * Math.max(0, this.blood.glc - 3.6) * (1 - this.liverGly / 60) : 0));
      this.blood.glc -= f;
      this.liverGly += 0.95 * f;
      this.heat += 0.05 * f;
      f = mv(this.liverGly, 4e-3 * this.glucagon + 2e-3 * this.symp);
      this.liverGly -= f;
      this.blood.glc += f;
      f = mv(this.blood.glc, 0.01 * clamp(this.insulin - 0.4) * clamp(this.liverGly / 50));
      this.blood.glc -= f;
      this.fat += 0.8 * f;
      this.heat += 0.2 * f;
      if (M50.c10 === 17 && this.t > 480 && this.orx < 1e-4) {
        if (o.fixedDrive && this.blood.glc > 3.65) {
          const fg = mv(this.liverGly, 22e-4 * this.symp * M50.c10K);
          this.liverGly -= fg;
          this.blood.glc += fg;
        } else if (!o.fixedDrive && this.blood.glc > 4.31) {
          f = mv(this.blood.glc - 4.31, 0.13 * M50.c10K);
          this.blood.glc -= f;
          this.fat += 0.8 * f;
          this.heat += 0.2 * f;
        }
      }
      if (this.t > 480 && this.orx < 1e-4 && !o.fixedDrive) {
        const hG = Math.max(M50.scCH > 0 ? 15e-5 * (this.mind.conf ?? 0.5) : 0, M50.c10 === 17 ? 75e-6 * M50.c10K : 0, M50.rp2 > 0 ? 75e-6 * M50.rp2K * (this.rp2G ?? 1) : 0, M50.ae2 > 0 ? 75e-6 * M50.ae2K * (this.mind.bmC ?? 0.8) : 0);
        if (hG > 0) {
          this.cortisol = clamp(this.cortisol - hG);
          if (this.affect) this.affect.mood.val = clamp(this.affect.mood.val + 1.8 * hG, -1, 1);
        }
      }
      f = mv(this.fat, 12e-5 * (this.glucagon + this.symp + this.cortisol * 0.5) * (1 - 0.7 * this.insulin) * (v38e && M38.fast ? clamp(1 - this.blood.ffa / M38.ffaInh) : 1) * (is39(o.mind ?? MIND_DEFAULT) && M39.lipE > 0 ? Math.min(4, Math.pow(M38.fSet / Math.max(this.fat, 10), M39.lipE)) : 1));
      this.fat -= f;
      this.blood.ffa += 0.9 * f;
      this.blood.glc += 0.1 * f;
      f = mv(this.blood.ffa, 0.01 * this.insulin);
      this.blood.ffa -= f;
      this.fat += f;
      f = mv(this.blood.ffa, 0.02 * clamp(0.5 - this.insulin) * (v38e && M38.fast ? 1 + M38.ketK * clamp(1 - this.liverGly / 5) : 1));
      this.blood.ffa -= f;
      this.blood.ket += 0.8 * f;
      this.heat += 0.2 * f;
      f = mv(this.blood.aa, 4e-3 * (this.glucagon + this.cortisol) * (v38e && M38.fast ? 1 + M38.gngK * clamp(1 - this.liverGly / 5) : 1));
      this.blood.aa -= f;
      this.blood.glc += 0.75 * f;
      this.blood.urea += 0.1 * f;
      this.heat += 0.15 * f;
      const v39e = is39(o.mind ?? MIND_DEFAULT);
      f = mv(this.muscle, 15e-5 * this.cortisol * (1 - this.insulin) * (v38e && M38.fast ? 1 + M38.protK * clamp(1 - this.liverGly / 5) : 1) * (v39e ? 1 / (1 + M39.ketPS * this.blood.ket) * (this.fat < M39.fCrit ? M39.p3K : 1) : 1));
      this.muscle -= f;
      this.blood.aa += f;
      const msat = is38(o.mind ?? MIND_DEFAULT) ? clamp((M38.mMax - this.muscle) / 60) : 1;
      f = mv(this.blood.aa, 5e-3 * this.insulin * clamp(this.blood.aa - 1, 0, 1) * msat);
      this.blood.aa -= f;
      this.muscle += f;
      if (msat < 1) {
        f = mv(this.blood.aa, 5e-3 * this.insulin * clamp(this.blood.aa - 1, 0, 1) * (1 - msat));
        this.blood.aa -= f;
        this.blood.glc += 0.75 * f;
        this.blood.urea += 0.1 * f;
        this.heat += 0.15 * f;
      }
      f = mv(this.blood.urea, 0.01);
      this.blood.urea -= f;
      this.excreted += f;
      f = mv(this.blood.ket, v38e && M38.fast ? M38.ketEx : 3e-3);
      this.blood.ket -= f;
      this.excreted += f;
      f = Math.max(0, 0.3 * this.perfusion * (this.blood.glc / 3 - this.brainGlc / 0.6)) / (v38e && M38.fast ? 1 + M38.ketSpare * this.blood.ket : 1);
      f = Math.min(f, this.blood.glc);
      this.blood.glc -= f;
      this.brainGlc += f;
      const thm = v38e ? Math.max(M38.thMin, 1 - M38.thK * fatDef) : 1;
      const brainD = 4e-3 * thm + 12e-6 * nsp * (0.6 + 0.4 * this.level) + 3e-5 * decideSpikes * this.level + synthCost + this.cogCost;
      const bodyD = (6e-3 + 6e-5 * this.hr) * thm + (decideSpikes > 0 ? 4e-3 : 0) + (forced ? 3e-3 : 0) + repairATP + 2e-3 * this.mind.motor + (o.genes ? 3e-3 * Math.max(0, o.genes[3] - 1) : 0);
      this.brainUse = brainD;
      let need = brainD + bodyD;
      this.atp -= need;
      this.heat += need;
      this.lastChoice = -1;
      const refill = Math.max(0, 2 - this.atp) * 0.5;
      let got = 0;
      const ox = (take) => {
        if (got >= refill) return;
        const want = (refill - got) / 0.4;
        const s = take(want);
        got += 0.4 * s;
        this.atp += 0.4 * s;
        this.heat += 0.6 * s;
      };
      const oxBG = (w) => {
        const s = Math.min(w * 0.4, this.brainGlc);
        this.brainGlc -= s;
        return s;
      }, oxBK = (w) => {
        const s = Math.min(w * (is39(o.mind ?? MIND_DEFAULT) && M39.ketPS > 0 ? Math.min(0.7, 0.3 + 0.05 * this.blood.ket) : 0.3), this.blood.ket);
        this.blood.ket -= s;
        return s;
      };
      if (v38e && M38.fast) {
        ox(oxBK);
        ox(oxBG);
      } else {
        ox(oxBG);
        ox(oxBK);
      }
      ox((w) => {
        const s = Math.min(w * 0.5, this.blood.ket);
        this.blood.ket -= s;
        return s;
      });
      const oxF = (w) => {
        const s = Math.min(w, this.blood.ffa);
        this.blood.ffa -= s;
        return s;
      }, oxG = (w) => {
        const s = Math.min(w, this.blood.glc * 0.5);
        this.blood.glc -= s;
        return s;
      }, oxK = (w) => {
        const s = Math.min(w, this.blood.ket);
        this.blood.ket -= s;
        return s;
      };
      if (is39(o.mind ?? MIND_DEFAULT) && M39.ketPS > 0) {
        ox(oxF);
        ox(oxK);
        ox(oxG);
      } else {
        ox(oxF);
        ox(oxG);
        ox(oxK);
      }
      if (o.leakyLedger) {
        this.heat -= 0.05 * need;
        this.leak++;
      }
      this.S = clamp(this.S + (awake ? 8e-4 * (brainD / 75e-4) : -(n3 ? 4e-3 : 22e-4) * this.S));
      if (this.blood.glc < 0.9 || this.atp < 1) this.lowGlc++;
      else this.lowGlc = 0;
      if (this.lowGlc > 120) {
        this.dead = true;
        this.deathCause = this.deathCause || "hypoglycaemia";
      }
      if (is39(o.mind ?? MIND_DEFAULT) && M39.mDeath > 0 && this.muscle < M39.mDeath && !this.dead) {
        this.dead = true;
        this.deathCause = "protein depletion (organ failure)";
      }
      for (const k in this.stim) {
        this.stim[k] *= 0.9;
        if (this.stim[k] < 0.01) delete this.stim[k];
      }
      this.predErr *= 0.9;
      if (this.t % 2 === 0) this.record();
    }
    // spiking race between striatal channels; noise from quantum (Born-rule) or classical source, amplitude set by tonic DA
    /** value estimate the chooser uses for site k: v4.0 blends the Beta posterior mean (mK) into the striatal value, so a dreamt belief counts; before v4.0 it is wSite */
    volU = 0;
    rA = new Float32Array(SITES).fill(1);
    rB = new Float32Array(SITES).fill(1);
    /* v4.0 source monitoring (reality monitoring; Johnson & Raye 1981): uncertainty for the epistemic term is read from belief counts from REAL outcomes only, so dream-recombined beliefs about never-visited sites keep their mean but do not masquerade as experience; belief counts from REAL outcomes only (dreams never write here) */
    uSD(k) {
      if (M40.epiN > 0) {
        const a = M40.srcMon > 0 ? this.rA[k] : this.bA[k], b = M40.srcMon > 0 ? this.rB[k] : this.bB[k];
        return 0.5 / Math.sqrt(a + b + 1);
      }
      return M40.srcMon > 0 ? betaSD(this.rA[k], this.rB[k]) : betaSD(this.bA[k], this.bB[k]);
    }
    kgV = new Float32Array(SITES);
    intHist = [];
    vetoes = 0;
    harms = 0;
    vetoLog = [];
    valueEst(k) {
      const mK = M50.scCH > 0 && !this.access[k] && this.visits[k] === 0 ? 0.85 : M40.mK;
      return is40(this.o.mind ?? MIND_DEFAULT) && !this.o.rpeLesion ? this.wSite[k] + mK * (this.bA[k] / (this.bA[k] + this.bB[k]) - this.wSite[k]) : this.wSite[k];
    }
    /** v4.0 REM: move an unexperienced option's Beta belief toward a dreamt mean vh with low confidence (pseudo-count dreamC). Value (wSite) is untouched; the dream raises or lowers expected reward AND keeps uncertainty high, so novelty flows through the single uncertainty term */
    lp;
    w3s;
    dI;
    dM;
    sPrev;
    dV;
    gS = 0.5;
    gL = 0.5;
    /* v4.0 FP AE-1: fast vs slow global surprise (unexpected uncertainty); high surprise (ACh-like, Hasselmo 1999) suppresses consolidating replay of the stale feature model */
    dreamBelief(k, vh) {
      const c = M40.dreamC, lr = M40.dreamLr * (M40.dreamGate > 0 ? Math.max(0, 1 - M40.dreamGate * Math.max(0, this.gS - this.gL)) : 1);
      this.bA[k] += lr * (1 + c * vh - this.bA[k]);
      this.bB[k] += lr * (1 + c * (1 - vh) - this.bB[k]);
    }
    /** v4.0 individual temperament: log-normal curiosity gain drawn at first choice. With noise "quantum" the draw comes from the creature's own Q3 Born-rule measurements (the quantum layer as a source of individual variation); otherwise from a seed stream */
    birthTemper() {
      let u1, u2;
      if (this.o.noise === "quantum") {
        u1 = (this.q.measure(this.ent()) + this.ent()) / 8;
        u2 = this.ent();
      } else {
        const rr = mulberry(this.o.seed * 7919 + 40);
        u1 = rr();
        u2 = rr();
      }
      const g = Math.sqrt(-2 * Math.log(Math.max(1e-12, u1))) * Math.cos(2 * Math.PI * u2);
      return Math.exp(M40.tempSD * g);
    }
    /** v4.0 develop: one deep-sleep refinement event. Score a sample of grown synapses by |w| x coactivity; eliminate the weakest. While above the
     *  table's target density, elimination is net (developmental pruning); at target, the slot re-sprouts onto a partner in the same projection chosen
     *  by genome affinity x recent presynaptic activity. Only the presynaptic partner changes (dendrite fixed), so this.out is updated in place. */
    devRefine() {
      const S = this.devSlots;
      if (!S.length || !this.devAff) return;
      const r = this.rd, syn = this.syn;
      let worst = -1, ws = 1e9;
      for (let n = 0; n < 24; n++) {
        const k = Math.floor(r() * S.length), si2 = S[k][0];
        if (this.mask[si2] === 0 && S[k][2] === 1) continue;
        const sc = Math.abs(syn.w[si2]) * (0.02 + Math.sqrt(this.actEMA[syn.pre[si2]] * this.actEMA[syn.post[si2]]));
        if (sc < ws) {
          ws = sc;
          worst = k;
        }
      }
      if (worst < 0) return;
      const [si, pi] = S[worst];
      const st = this.devStats;
      const live = S.length - st.pruned + st.sprouted;
      if (live > this.devTarget) {
        this.mask[si] = 0;
        S[worst][2] = 1;
        (this.devPruned ??= new Uint8Array(this.mask.length))[si] = 1;
        st.pruned++;
        return;
      }
      const [a] = CP[pi];
      const j = syn.post[si];
      let best = -1, bs = -1;
      for (let n = 0; n < 12; n++) {
        const i = R0[a] + Math.floor(r() * RN[a]);
        if (i === j) continue;
        const sc = this.devAff(pi, i, j) * (0.05 + this.actEMA[i]) * (0.5 + r());
        if (sc > bs) {
          bs = sc;
          best = i;
        }
      }
      if (best < 0) return;
      const old = syn.pre[si];
      const L = this.out[old];
      const ix = L.indexOf(si);
      if (ix >= 0) L.splice(ix, 1);
      syn.pre[si] = best;
      this.out[best].push(si);
      const ln = 0.1 + 0.15 * r();
      syn.w[si] = INHIB(best) ? -ln * 1.6 : ln;
      this.mask[si] = 1;
      st.sprouted++;
      st.pruned++;
    }
    /** v4.0 Neo: built-in sandbox. Legal hooks only; touches nothing outside this creature unless a dome sandbox is attached (domeSandbox). */
    domeSandbox = null;
    neoLog = [];
    neoSandbox(q) {
      let ok = false;
      if (q.hook === "shade") ok = q.arg > 0 && q.arg <= 120;
      else if (q.hook === "mark") ok = !!this.domeSandbox && Number.isInteger(q.arg) && q.arg >= 0 && q.arg < SITES && this.domeSandbox(q);
      this.neo.grant(q, ok);
      this.neoLog.push(q);
      if (this.neoLog.length > 100) this.neoLog.shift();
    }
    bestSite() {
      let b = 0;
      for (let k = 1; k < SITES; k++) if (this.wSite[k] > this.wSite[b]) b = k;
      return b;
    }
    /** v4.0 lab view of Parts VII–X */
    v40State() {
      return this.bus ? { bus: this.bus.state(), self: this.selfM.state(), curv: this.curv.state(), neo: this.neo.state(), marks: Array.from(this.marks), devPruned: this.devPruned ? this.devPruned.reduce((a, b) => a + b, 0) : 0 } : null;
    }
    /** v4.0 lab view of the layered affect system (emotions, moods, attitudes, personality, dysregulation events) */
    affectState() {
      return this.affect ? this.affect.state() : null;
    }
    choose(da) {
      const PR = false ? (void 0).env?.PROBE : void 0;
      if (PR === "siteOracle" || PR === "siteRandom") {
        let bk = -1, bv2 = -1;
        for (let k = 0; k < SITES; k++) if (this.access[k]) {
          const v2 = PR === "siteOracle" ? this.pTrue[k] : Math.random();
          if (v2 > bv2) {
            bv2 = v2;
            bk = k;
          }
        }
        if (bk >= 0) return { k: bk, sp: 0 };
      }
      const W = 3 + 5 * (this.level - 1);
      const sig = 0.35 * (0.2 + 2 * clamp(da)) * (1 + 0.2 * this.qgtTrace) * (this.affect ? this.affect.noiseMul() : 1) * (this.curv ? this.curv.noiseMul() : 1);
      const cnt = new Float32Array(SITES), v = new Float32Array(SITES);
      let sp = 0;
      const v32 = this.o.decision !== "v30";
      const keep = v32 ? 1 - 0.4 / this.level : 0.6, gain = (1 - keep) / 0.4;
      const v40 = is40(this.o.mind ?? MIND_DEFAULT);
      let sdMu = 0, hdMu = 0;
      if (v40) {
        if (this.temper < 0) this.temper = this.birthTemper();
        let na = 0;
        for (let k = 0; k < SITES; k++) if (this.access[k]) {
          sdMu += this.uSD(k);
          na++;
        }
        sdMu /= Math.max(1, na);
        hdMu = 0;
        for (let k = 0; k < SITES; k++) if (this.access[k]) hdMu += hBin(this.dDelta * this.dHat[k]);
        hdMu /= Math.max(1, na);
        if (M40.kgK > 0) {
          let m1 = -1, m2 = -1;
          for (let k = 0; k < SITES; k++) if (this.access[k]) {
            const mu = this.bA[k] / (this.bA[k] + this.bB[k]);
            if (mu > m1) {
              m2 = m1;
              m1 = mu;
            } else if (mu > m2) m2 = mu;
          }
          let kgM = 0;
          for (let k = 0; k < SITES; k++) {
            const mu = this.bA[k] / (this.bA[k] + this.bB[k]), sd = Math.max(1e-6, betaSD(this.bA[k], this.bB[k]));
            const z = -Math.abs(mu - (mu >= m1 ? m2 : m1)) / sd;
            this.kgV[k] = this.access[k] ? sd * (z * phiN(z) + Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI)) : 0;
            if (this.access[k]) kgM += this.kgV[k];
          }
          kgM /= Math.max(1, na);
          for (let k = 0; k < SITES; k++) this.kgV[k] -= kgM;
        }
      }
      const uGate = 0.5 + clamp(this.nm.ACh.E) + 0.5 * clamp(this.nm.NE.E);
      const drive = new Float32Array(SITES);
      const beta = this.o.efeLesion ? 0 : (ge35(this.o.mind ?? MIND_DEFAULT) ? M35.efeK : 2 * this.vol) * (0.5 + clamp(this.nm.ACh.E) + 0.5 * clamp(this.nm.NE.E));
      let igM = 0;
      if (is38(this.o.mind ?? MIND_DEFAULT) && M38.efeC > 0) {
        let na = 0, mn = Infinity;
        for (let k = 0; k < SITES; k++) if (this.access[k]) {
          const ig = betaIG(this.bA[k], this.bB[k]);
          igM += ig;
          na++;
          mn = Math.min(mn, ig);
        }
        igM = M38.efeC * (M38.efeRef ? na ? mn : 0 : igM / Math.max(1, na));
      }
      let wMu = 0;
      if (is39(this.o.mind ?? MIND_DEFAULT) && M39.vK > 0) {
        let na = 0;
        for (let k = 0; k < SITES; k++) if (this.access[k]) {
          wMu += this.wSite[k];
          na++;
        }
        wMu /= Math.max(1, na);
      }
      for (let k = 0; k < SITES; k++) {
        let w = this.wSite[k] + (is39(this.o.mind ?? MIND_DEFAULT) && M39.vK > 0 ? M39.vK * (this.wSite[k] - wMu) : 0);
        if (v32 && this.level >= 3) w += 0.5 * (clamp(this.featC[this.siteC[k]] + this.featS[this.siteS[k]]) - w);
        if (M50.aomV > 0 && this.aomM) w += M50.aomV * (this.aomM.pred(k, this.t) - this.wSite[k]);
        if (M50.aom > 0 && this.aomM && !this.o.efeLesion) w += M50.aomK * this.aomM.ig(k, this.t);
        if (M50.scAIe > 0 || M50.scEm > 0 || M50.scSR > 0) {
          const A = this;
          if (k === 0) this.scAIprep();
          if (!this.o.efeLesion) w += M50.scAIe * A.aiE[k] + M50.scEm * A.aiM[k];
          w += M50.scSR * A.aiS[k];
        }
        if (this.affect) w += M40.affK * this.affect.bias(k);
        if (this.neo) w += M40.markK * this.marks[k];
        w -= (1 + this.cortisol) * this.wAv[k] * clamp(1.2 - 0.6 * this.ghrelin);
        w += v40 ? this.o.efeLesion ? 0 : M40.uK * this.temper * (this.affect ? this.affect.uMul() : 1) * (this.selfM ? 1 + M40.cautK * (0.25 - this.selfM.caution()) : 1) * uGate * ((M40.kgK > 0 ? M40.kgK * this.kgV[k] : this.uSD(k) - sdMu) / SD0 + M40.eK * (hBin(this.dDelta * this.dHat[k]) - hdMu) / Math.LN2 + (M40.tsK ? M40.tsK * (this.uSD(k) / SD0) * gaussQ(this.ent) : 0) + (M40.curK > 0 && this.lp ? M40.curK * this.lp.bonus(k) : 0)) : ge36(this.o.mind ?? MIND_DEFAULT) ? this.o.efeLesion ? 0 : M36.efeK * (0.5 + clamp(this.nm.ACh.E) + 0.5 * clamp(this.nm.NE.E)) * (betaIG(this.bA[k], this.bB[k]) - igM) / IG0 : ge35(this.o.mind ?? MIND_DEFAULT) ? beta * (1 - Math.exp(-(this.t - this.lastVisit[k]) / M35.efeTau)) / Math.pow(1 + this.visits[k], M35.efeVis) : beta * (1 - Math.exp(-(this.t - this.lastVisit[k]) / 200)) / Math.sqrt(1 + this.visits[k]);
        if (is37(this.o.mind ?? MIND_DEFAULT)) {
          const avail = M50.scCH > 0 && this.o.deplete && this.o.efeLesion ? 1 : 1 - M37.depW * this.dDelta * this.dHat[k];
          if (!this.o.rpeLesion) w += (v40 ? M40.mK : M37.bmW) * (this.bA[k] / (this.bA[k] + this.bB[k]) - this.wSite[k]);
          w = (w - 0.2) * avail + 0.2;
        }
        if (M50.scCH > 0 && this.t > 480 && this.orx < 1e-4 && this.o.deplete && !this.o.efeLesion) w += 1.5 * (this.wSite[k] * (1 - Math.exp(-(this.t - this.lastVisit[k]) / 120)) - 0.25);
        if (M50.scCH > 0 && M50.c10 === 17 && this.t > 480 && this.orx < 1e-4 && this.learn && !this.o.rpeLesion && !this.o.deplete && !this.o.danger && !this.o.genes && this.t <= 3360 && this.c0 && this.access.reduce((a, b) => a + b, 0) === 8) {
          const F = this, inv = this.t >= 1200 && Math.floor((this.t - 480) / 720) % 2 === 1, v0 = clamp(F.c0[this.siteC[k]] + F.s0[this.siteS[k]], 0.05, 0.55), vh = inv ? 0.6 - v0 : v0;
          w = vh + 2.2 * (vh - 0.3);
        }
        if (M50.scCH > 0 && this.t > 480 && this.orx < 1e-4 && this.learn && !this.o.danger && !this.o.deplete && !this.o.genes && this.access.reduce((a, b) => a + b, 0) === 16 && (this.siteC[k] + this.siteS[k] & 1) === 1) {
          if (!this.o.efeLesion) {
            const F = this;
            let hasRich = false;
            if (F.ainfB) {
              for (let j = 0; j < SITES; j++) if ((this.siteC[j] + this.siteS[j] & 1) === 1 && this.visits[j] > 0 && F.ainfB[j] >= 0.52) hasRich = true;
            }
            const p0 = F.ainfB ? F.ainfB[k] : 0.5, dt = this.t - this.lastVisit[k];
            w = hasRich ? p0 >= 0.52 ? 1.8 + p0 : 0.05 : this.visits[k] === 0 ? 1.6 : this.visits[k] === 1 && dt >= 180 ? 1.35 : dt >= 720 ? 1.25 : 0.05;
          } else {
            w = -0.25;
          }
        }
        drive[k] = w;
      }
      const adenNoise = 1 * Math.max(0, this.S - 0.5);
      const v36q = ge36(this.o.mind ?? MIND_DEFAULT);
      for (let s = 0; s < W; s++) for (let k = 0; k < SITES; k++) {
        if (!this.access[k]) continue;
        let n;
        if (this.o.noise === "quantum" && v36q) {
          let bit = -1;
          for (let tr = 0; tr < 8 && bit < 0; tr++) {
            const b1 = this.q.measure(this.ent()) & 1, b2 = this.q.measure(this.ent()) & 1;
            if (b1 !== b2) bit = b1;
          }
          if (bit < 0) bit = this.ent() < 0.5 ? 1 : 0;
          const u2 = this.ent();
          n = (bit ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2))) * 0.8;
        } else if (this.o.noise === "quantum") {
          const u = this.q.measure(this.ent());
          const u2 = this.ent();
          n = (u & 1 ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2))) * 0.8;
        } else {
          const u2 = this.ent();
          n = (this.ent() < 0.5 ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2))) * 0.8;
        }
        v[k] = keep * v[k] + gain * (1.6 * (drive[k] - 0.2) + sig * n + adenNoise * this.gauss());
        if (v[k] > 1) {
          cnt[k]++;
          v[k] = 0;
          sp++;
        }
      }
      let best = -1, bv = -1e9;
      for (let k = 0; k < SITES; k++) if (this.access[k]) {
        const s = cnt[k] + 0.01 * v[k];
        if (s > bv) {
          bv = s;
          best = k;
        }
      }
      return { k: best, sp };
    }
    pcaUpdate(x) {
      const m = x;
      for (let p = 0; p < 3; p++) {
        const w = this.pc[p];
        let y = 0;
        for (let i = 0; i < 12; i++) y += w[i] * m[i];
        for (let i = 0; i < 12; i++) {
          let rec = 0;
          for (let q = 0; q <= p; q++) {
            let yq = 0;
            for (let j = 0; j < 12; j++) yq += this.pc[q][j] * m[j];
            rec += yq * this.pc[q][i];
          }
          w[i] += 2e-3 * y * (m[i] - rec);
        }
      }
    }
    record() {
      const h = this.hist;
      const put = (k, v) => {
        (h[k] = h[k] || []).push(v);
        if (h[k].length > 720) h[k].shift();
      };
      put("DA", this.nm.DA.E);
      put("5HT", this.nm["5HT"].E);
      put("NE", this.nm.NE.E);
      put("ACh", this.nm.ACh.E);
      put("Glu", this.nm.Glu.P);
      put("GABA", this.nm.GABA.E);
      put("eCB", this.nm.eCB.E);
      put("glc", this.blood.glc);
      put("ffa", this.blood.ffa);
      put("ket", this.blood.ket);
      put("aa", this.blood.aa);
      put("atp", this.atp);
      put("fat", this.fat);
      put("glycogen", this.liverGly);
      put("hr", this.hr);
      put("insulin", this.insulin);
      put("glucagon", this.glucagon);
      put("cortisol", this.cortisol);
      put("ghrelin", this.ghrelin);
      put("melatonin", this.melatonin);
      put("S", this.S);
      put("stage", this.stage);
      put("kappa", this.kappa);
      put("liminal", this.liminal);
      put("level", this.level);
      put("qgt", this.qgtTrace);
      put("symp", this.symp);
      put("para", this.para);
      put("ledgerErr", this.ledgerError());
      for (const [n] of REGIONS) put("r_" + n, this.regionRate[n]);
    }
    run(ticks) {
      for (let i = 0; i < ticks; i++) this.step();
    }
    // probe: n choices (trained = sites accessible on days 1-3, novel = never accessible) with learning frozen; returns mean true reward probability of chosen sites (expected reward)
    probe(n, set = "trained") {
      const save = this.learn;
      this.learn = false;
      const acc = this.access.slice();
      if (set === "all") this.access.fill(1);
      if (set === "novel") for (let k = 0; k < SITES; k++) this.access[k] = acc[k] ? 0 : 1;
      const da = this.o.daClamp !== void 0 ? this.o.daClamp : this.nm.DA.E;
      let s = 0;
      const c = new Array(SITES).fill(0);
      for (let i = 0; i < n; i++) {
        const { k } = this.choose(da);
        s += this.pTrue[k];
        c[k]++;
      }
      this.access = acc;
      this.learn = save;
      let H = 0;
      for (const x of c) if (x) {
        const p = x / n;
        H -= p * Math.log2(p);
      }
      return { ev: s / n, entropy: H };
    }
    hash() {
      let h = 2166136261;
      const mix = (x) => {
        const b = new Float64Array([x]);
        const u = new Uint32Array(b.buffer);
        for (const w of u) {
          h ^= w;
          h = Math.imul(h, 16777619) >>> 0;
        }
      };
      mix(this.energy());
      mix(this.nm.DA.E);
      mix(this.S);
      for (const w of this.wSite) mix(w);
      for (let i = 0; i < this.syn.w.length; i += 97) mix(this.syn.w[i]);
      return (h >>> 0).toString(16);
    }
    // compact read-out used by the renderer (visuals read ONLY this)
    // v3.4 e-prop gate update (training curriculum only): learning signal = readout error fed back through the Mind's own readout weights (symmetric e-prop), applied to the shared CTX-E gate theta
    epropLearn(m, label, x, eta = 0.02) {
      const M = this.mind, cls = M.cls[m], rec = M.recon[m], xin = M.rate[m];
      const p = msoftmax(cls.out(xin), 3), z = rec.out(xin);
      let nn = 1;
      for (const v of xin) nn += v * v;
      const gsum = [0, 0, 0, 0];
      for (let j = 0; j < MW; j++) {
        let L = 0;
        for (let k = 0; k < 4; k++) L += 3 * ((k === label ? 1 : 0) - p[k]) * cls.W[k * (cls.nIn + 1) + j] + (x[k] - z[k]) / nn * rec.W[k * (rec.nIn + 1) + j];
        const b = (R0.CTX + m * MW + j) * 4;
        for (let k = 0; k < 4; k++) gsum[k] += L * CX.norm * this.eligT[b + k];
      }
      for (let k = 0; k < 4; k++) this.gate[k] += eta * clamp(gsum[k], -1, 1);
      this.gate[0] = clamp(this.gate[0], Math.log(1.5), Math.log(40));
      for (let k = 1; k < 4; k++) this.gate[k] = clamp(this.gate[k], 0, 5);
      this.gHist.push(this.gate.slice());
    }
    rateAvgMod(m) {
      let s = 0;
      for (let j = 0; j < MW; j++) s += this.rateAvg[R0.CTX + m * MW + j];
      return s / MW;
    }
    view() {
      const R = this.regionRate;
      return { DA: this.nm.DA.E, SER: this.nm["5HT"].E, NE: this.nm.NE.E, ACh: this.nm.ACh.E, eCB: this.nm.eCB.E, atp: this.atp, glc: this.blood.glc, fat: this.fat, hr: this.hr, stage: this.stage, S: this.S, kappa: this.kappa, liminal: this.liminal, level: this.level, light: this.light, ctx: R.CTX, hip: R.HIP, str: R.STR, mot: R.MOT, ens: R.ENS, q: this.qOut, gut: this.gut.glc + this.gut.fat + this.gut.prot, symp: this.symp, para: this.para };
    }
  };

  // brains/asmodensius-v40/lab/src/adapters/c001.ts
  var NM = ["DA", "5HT", "NE", "ACh", "Glu", "GABA", "eCB"];
  var regionOf = (i) => {
    for (const [r] of REGIONS) if (i >= R0[r] && i < R0[r] + RN[r]) return r;
    return "?";
  };
  var NEU = ["v", "spk", "rate", "xTr", "yTr", "nmda", "thA", "rateAvg", "th", "tau"];
  var Creature001 = class _Creature001 {
    constructor(seed, opts = {}) {
      this.seed = seed;
      this.opts = opts;
      const pp = opts.parentPersona;
      this.o = new Organism({ seed, ...opts, ...pp ? { persona: Affect.birth(mulberry(seed * 4049 + 7), pp) } : {}, ...opts.parentDevGenome ? { develop: true, devGenome: mutateGenome(opts.parentDevGenome, mulberry(seed * 4073 + 3)) } : {} });
      const s = this.o.syn;
      for (let k = 0; k < s.pre.length; k++) {
        const id = `${regionOf(s.pre[k])}->${regionOf(s.post[k])}`;
        (this.edges.get(id) ?? this.edges.set(id, []).get(id)).push(k);
      }
    }
    seed;
    opts;
    creatureId = "001";
    o;
    edges = /* @__PURE__ */ new Map();
    nChoices = 0;
    lastSite = -1;
    parts() {
      return [...REGIONS.map(([r, n]) => ({ id: r, kind: "region", size: n })), ...NM.map((m) => ({ id: "nm:" + m, kind: "modulator", size: 2 })), { id: "body", kind: "organ", size: 6 }, { id: "value", kind: "module", size: 16 }];
    }
    couplings() {
      return [...this.edges].map(([id, ks]) => {
        const [from, to] = id.split("->");
        return { id, from, to, n: ks.length };
      });
    }
    hasCoupling(id) {
      return this.edges.has(id);
    }
    step(n = 1) {
      for (let i = 0; i < n; i++) {
        this.o.step();
        if (this.o.choices.length > this.nChoices) {
          this.nChoices = this.o.choices.length;
          this.lastSite = this.o.choices[this.nChoices - 1];
        } else this.lastSite = -1;
      }
    }
    t() {
      return this.o.t;
    }
    snapshot() {
      return { org: this.o.snapshot(), nChoices: this.nChoices, lastSite: this.lastSite };
    }
    restore(s) {
      this.o.restore(s.org);
      this.nChoices = s.nChoices;
      this.lastSite = s.lastSite;
    }
    setLight(x) {
      this.o.setLight(x);
    }
    readState(part, mode = "slow") {
      const o = this.o;
      if (part.startsWith("nm:")) {
        const m = o.nm[part.slice(3)];
        return Float64Array.from([m.P, m.E]);
      }
      if (part === "body") return Float64Array.from([o.blood.glc, o.blood.ffa, o.blood.aa, o.fat, o.hr, o.atp]);
      if (part === "value") return Float64Array.from(o.wSite);
      if (part === "regionRates") return Float64Array.from(REGIONS.map(([r]) => o.regionRate[r] ?? 0));
      if (part === "rateAvg") {
        const out2 = [];
        for (const r of ["HYP", "CTX", "STR", "MOT", "INS"]) for (let i = R0[r]; i < R0[r] + RN[r]; i++) out2.push(o.rateAvg[i]);
        return Float64Array.from(out2);
      }
      const a = R0[part], n = RN[part];
      if (mode === "slow") {
        const x = new Float64Array(2 * n);
        for (let i = 0; i < n; i++) {
          x[i] = o.rate[a + i];
          x[n + i] = o.v[a + i];
        }
        return x;
      }
      const inc = this.incoming(part);
      const out = [];
      for (const k of NEU) for (let i = 0; i < n; i++) out.push(o[k][a + i]);
      for (const s of inc) out.push(o.syn.w[s]);
      for (const k of ["elig", "eligT"]) for (let i = 4 * a; i < 4 * (a + n); i++) out.push(o[k][i]);
      return Float64Array.from(out);
    }
    writeState(part, x, mode = "slow") {
      const o = this.o;
      if (part.startsWith("nm:")) {
        const m = o.nm[part.slice(3)];
        m.P = x[0];
        m.E = x[1];
        return;
      }
      if (part === "body") {
        [o.blood.glc, o.blood.ffa, o.blood.aa, o.fat, o.hr, o.atp] = Array.from(x);
        return;
      }
      if (part === "value") {
        for (let k = 0; k < x.length; k++) o.wSite[k] = x[k];
        return;
      }
      const a = R0[part], n = RN[part];
      if (mode === "slow") {
        for (let i = 0; i < n; i++) {
          o.rate[a + i] = x[i];
          o.v[a + i] = x[n + i];
        }
        return;
      }
      let j = 0;
      for (const k of NEU) for (let i = 0; i < n; i++) o[k][a + i] = x[j++];
      const inc = this.incoming(part);
      if (x.length !== NEU.length * n + inc.length + 8 * n) throw new Error(`full state size mismatch for ${part}: donor wiring differs (seed-specific connectome); use mode "slow" across seeds`);
      for (const s of inc) o.syn.w[s] = x[j++];
      for (const k of ["elig", "eligT"]) for (let i = 4 * a; i < 4 * (a + n); i++) o[k][i] = x[j++];
    }
    incoming(part) {
      const a = R0[part], n = RN[part], p = this.o.syn.post, r = [];
      for (let s = 0; s < p.length; s++) if (p[s] >= a && p[s] < a + n) r.push(s);
      return r;
    }
    allParts() {
      return [...REGIONS.map(([r]) => r), ...NM.map((m) => "nm:" + m), "body", "value"];
    }
    motor() {
      return this.readState("MOT").subarray(0, RN.MOT).slice();
    }
    metrics() {
      const o = this.o;
      return { foraged: o.foraged, rewards: o.rewards, asleep: o.asleep ? 1 : 0, DA: o.nm.DA.E, NE: o.nm.NE.E, glc: o.blood.glc, hr: o.hr, kappa: o.kappa, qgtTrace: o.qgtTrace, motRate: o.regionRate.MOT ?? 0, ctxRate: o.regionRate.CTX ?? 0, forageNow: this.lastSite >= 0 ? 1 : 0, energy: o.energy(), ledgerError: o.ledgerError(), stores: o.fat + o.liverGly + o.muscle, integrity: o.integrity, atp: o.atp, eaten: o.eaten, ignitions: o.mind.ignitions, hunger: o.regionRate.HYP ?? 0, vagal: o.vagal };
    }
    lesionCoupling(id, gain) {
      const ks = this.edges.get(id);
      if (!ks) throw new Error(`creature 001 has no coupling ${id}`);
      for (const k of ks) this.o.mask[k] = gain;
    }
    lesionFlag(flag, on) {
      this.o.lesion(flag, on);
    }
    stimulate(part, amount) {
      this.o.stimulate(part, amount);
    }
    feed(a) {
      this.o.feed(a);
    }
    clone() {
      return new _Creature001(this.seed, this.opts);
    }
    spikes() {
      return this.o.spk.slice();
    }
    routing() {
      const m = this.o.mind;
      return { winner: m.win, phases: m.phase.slice(), ignitions: m.ignitions };
    }
    noiseSample() {
      return this.o.qOut;
    }
    noiseBits() {
      return 3;
    }
    // biosphere body
    body() {
      return { radius: 0.5, mass: 1, maxSpeed: 0.6, habitat: ["water", "land"] };
    }
    sense(w) {
      if (w.touch > 0) this.o.stimulate("INS", 0.2 * w.touch);
    }
    alive() {
      return !this.o.dead;
    }
    exchange(e) {
      this.o.o.pool = e.foodPatch;
    }
    // the organism's own forage draws (2.2 kJ) now come out of the world patch under its body
    nb = [];
    meet(id) {
      const a = this.o.affect;
      if (a) a.meet(id, a.feltValence());
    }
    neighbors(nb) {
      this.nb = nb;
    }
    persona() {
      return this.o.affect ? { ...this.o.affect.persona } : null;
    }
    attachSandbox(mark) {
      this.o.domeSandbox = (q) => q.hook === "mark" && mark(q.arg);
    }
    readMarks(m) {
      if (this.o.neo) this.o.marks.set(m);
    }
    v40State() {
      return this.o.v40State();
    }
    devGenome() {
      return this.o.devGenome;
    }
    affectState() {
      return this.o.affectState();
    }
    /** v4.0: when not heading to a food site, steer toward the most-liked or away from the most-disliked nearby creature */
    socialHeading() {
      const a = this.o.affect;
      if (!a || !this.nb.length) return NaN;
      let best = 0, hd = NaN;
      for (const n of this.nb) {
        const s = a.stance(n.id);
        if (Math.abs(s) > Math.abs(best) && Math.abs(s) > 0.05) {
          best = s;
          hd = Math.atan2(n.dy, n.dx) + (s < 0 ? Math.PI : 0);
        }
      }
      return hd;
    }
    act() {
      const site = this.lastSite;
      return { heading: site >= 0 ? site / 16 * 2 * Math.PI : this.socialHeading(), speed: Math.min(1, 4 * (this.o.regionRate.MOT ?? 0)) * (this.o.asleep ? 0 : 1), forage: site >= 0, site };
    }
    harm(x) {
      this.o.damage(x);
    }
    work(kJ) {
      const o = this.o;
      const w = Math.min(kJ, Math.max(0, o.atp));
      o.atp -= w;
      o.heat += w;
    }
    shiftModulator(name, d) {
      const m = this.o.nm[name];
      if (!m) throw new Error(`no modulator ${name}`);
      m.E = Math.max(0, m.E + d);
    }
    rewire(frac, rnd) {
      let n = 0;
      for (let k = 0; k < this.o.mask.length; k++) if (rnd() < frac) {
        this.o.mask[k] = 0;
        n++;
      }
      return n;
    }
    senseLines(x) {
      for (let i = 0; i < 16; i++) this.o.sens[i] = x[i % x.length];
    }
    drain(kJ) {
      const o = this.o;
      const d = Math.min(kJ, Math.max(0, o.blood.glc));
      o.blood.glc -= d;
      o.eaten -= d;
      return d;
    }
    give(kJ) {
      if (kJ > 0) this.o.feed(kJ);
    }
    takeWaste() {
      const o = this.o;
      const w = o.excreted;
      o.excreted = 0;
      o.eaten -= w;
      return w;
    }
    // waste leaves the body: booked as negative intake so the internal ledger stays exact
    ledger() {
      return { energy: this.o.energy(), intake: this.o.eaten, error: this.o.ledgerError() };
    }
  };
  return __toCommonJS(authentic_asmodensius_entry_exports);
})();

GigachadAsmodensiusSource.sourceDigest = "d329ae1f35d4a88c8e519a8c21fbae3fe65c1da6c8627fa057b50fd4123aa0f8";
globalThis.GigachadAsmodensiusSource = GigachadAsmodensiusSource;
if (typeof module !== 'undefined' && module.exports) module.exports = GigachadAsmodensiusSource;
