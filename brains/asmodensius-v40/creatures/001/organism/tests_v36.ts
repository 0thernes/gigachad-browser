// v3.6 tests (preregistrations/v3.6.md). New R-variants of three v3.1 items that sat on the ceiling, plus steering-API checks.
// R-variants use the HOT-2 degraded stimulus (amplitude 0.5+0.7u, plus 0.3|gauss| on every line) so the bounded metric can move off the ceiling.
// The v3.1 originals (GWT-3, ctm, CQM08) stay on record unchanged in tests_v31.ts.
import { Organism, Opts, Lin, R0, RN } from "./organism";
const mean = (a: number[]): number => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
const mk = (seed: number, o: Partial<Opts> = {}): Organism => new Organism({ seed, ...o });
export const warm = (seed: number, o: Partial<Opts> = {}): Organism => { const g = mk(seed, o); while (g.t < 480) g.step(); return g; };
const show = (g: Organism, x: number[]): void => { for (let i = 0; i < 16; i++) g.sens[i] = Math.max(0, x[i]); };
export const blank = (g: Organism): void => { g.sens.fill(0); g.step(); };
export const pretrain = (g: Organism, n = 120): void => { for (let k = 0; k < n; k++) { const c = [0, 1, 2, 3].map(() => Math.floor(g.r() * 4)); const x = new Array(16).fill(0); c.forEach((cc, m) => (x[m * 4 + cc] = 1)); show(g, x); g.step(); c.forEach((cc, m) => g.mind.teach(m, cc)); blank(g); } };
export const noisy = (g: Organism, m: number, c: number): number[] => { const x = new Array(16).fill(0); x[m * 4 + c] = 0.5 + 0.7 * g.r(); for (let i = 0; i < 16; i++) x[i] += 0.3 * Math.abs(g.gauss()); return x; };
type M = Record<string, number[]>;
export const TESTS36: Record<string, (seeds: number[]) => M> = {
  GWT3R: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); pretrain(g); let ok = 0; for (let t = 0; t < 160; t++) { const m = Math.floor(g.r() * 4), c = Math.floor(g.r() * 4); show(g, noisy(g, m, c)); g.step(); if (t >= 100) ok += +(g.mind.recvOut() === c); g.mind.teachRecv(c); g.mind.teach(m, c); blank(g); } return ok / 60; });
    return { full: f({}), "broadcast lesioned": f({ bcLesion: true }) }; },
  CTMR: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); pretrain(g); let ok = 0; for (let t = 0; t < 160; t++) { const m = Math.floor(g.r() * 4), c = Math.floor(g.r() * 4); show(g, noisy(g, m, c)); g.step(); if (t >= 100) ok += +(g.mind.repOut() === g.mind.action); g.mind.teachReport(); g.mind.teachAction(c); g.mind.teach(m, c); blank(g); } return ok / 60; });
    return { full: f({}), "broadcast lesioned": f({ bcLesion: true }) }; },
  C08R: (S) => { const f = (o: Partial<Opts>) => S.map((s) => { const g = warm(s, o); pretrain(g); const tr = (m: number, cls: number[], learn: boolean): boolean => { const c = cls[Math.floor(g.r() * 2)]; show(g, noisy(g, m, c)); g.step(); const okk = g.mind.action === c; if (learn) { g.mind.teachAction(c); g.mind.teach(m, c); } blank(g); return okk; };
      for (let t = 0; t < 100; t++) tr(0, [0, 1], true); for (let t = 0; t < 100; t++) tr(1, [2, 3], true); let ok = 0; for (let t = 0; t < 40; t++) ok += +tr(0, [0, 1], false); return ok / 40; });
    return { full: f({}), "replay lesioned": f({ replay: "none" }) }; },
  // steering API (tolerance tests, not d/t items)
  SNAP: (S) => ({ identical: S.map((s) => { const a = mk(s, { noise: "quantum" }); for (let i = 0; i < 1500; i++) a.step(); const st = JSON.parse(JSON.stringify(a.snapshot())); for (let i = 0; i < 1500; i++) a.step();
    const b = mk(s + 777, { noise: "quantum" }); b.restore(st); for (let i = 0; i < 1500; i++) b.step(); return +(JSON.stringify(a.snapshot()) === JSON.stringify(b.snapshot())); }) }),
  NOISESIGN: (S) => { const f = (mind: "v35" | "v36") => S.map((s) => { const g = warm(s, { noise: "quantum", mind }); let pos = 0, n = 0; for (let t = 0; t < 400; t++) { g.q.prepare([2.2, 0.4, 1.0]); /* a fixed, strongly biased state: P(bit0=1) = 0.79 */
      if (mind === "v36") { let bit = -1; for (let tr = 0; tr < 8 && bit < 0; tr++) { const b1 = g.q.measure(g.ent()) & 1, b2 = g.q.measure(g.ent()) & 1; if (b1 !== b2) bit = b1; } if (bit < 0) bit = g.ent() < 0.5 ? 1 : 0; pos += bit; } else pos += g.q.measure(g.ent()) & 1; n++; } return Math.abs(pos / n - 0.5); });
    return { "v36 |P(+)-0.5|": f("v36"), "v35 |P(+)-0.5|": f("v35") }; },
  LIGHT: (S) => ({ "melatonin at midnight, dome dark minus lit": S.map((s) => { const a = mk(s), b = mk(s); a.setLight(0); b.setLight(1); while (a.t < 2880) { a.step(); b.step(); } return a.melatonin - b.melatonin; }) }),
  // lab handoff R17 acceptance tests (preregistered in v3.6 §C2)
  // RPTLATE: evoked minus sham twin (snapshot/restore) CTX rate after a 1-tick SENS pulse; early = ticks 1-10, late = 11-60; 6 probes per seed, 100 ticks apart.
  RPTLATE: (S) => { const f = (o: Partial<Opts>) => { const E: number[] = [], L: number[] = []; for (const s of S) { const g = warm(s, o); let e = 0, l = 0;
      for (let p = 0; p < 6; p++) { for (let k = 0; k < 40; k++) blank(g); const tw = mk(s + 1, o); tw.restore(g.snapshot()); const x = new Array(16).fill(0); for (let m = 0; m < 4; m++) x[m * 4 + p % 4] = 1; show(g, x); g.step(); tw.sens.fill(0); tw.step();
        for (let k = 1; k <= 60; k++) { blank(g); blank(tw); const d = g.regionRate.CTX - tw.regionRate.CTX; if (k <= 10) e += d / 10; else l += d / 50; } } E.push(e / 6); L.push(l / 6); } return { E, L }; };
    const F = f({}), T = f({ ctFbLesion: true }), N = f({ slowLesion: true }), R = f({ recLesion: true });
    return { "late:full": F.L, "late:CTX->THAL cut": T.L, "late:slow NMDA lesioned": N.L, "late:CTX->CTX cut": R.L, "early:full": F.E, "early:CTX->THAL cut": T.E, "early:slow NMDA lesioned": N.E, "early:CTX->CTX cut": R.E }; },
  // INSGLC: balanced accuracy decoding blood glucose > median from INS rates (decoder trained on day-1 first half, tested on second half)
  INSGLC: (S) => { const f = (o: Partial<Opts>, shuffle = false) => S.map((s) => { const g = warm(s, o); const X: number[][] = [], Y: number[] = []; for (let t = 0; t < 1440; t++) { g.step(); const v: number[] = []; for (let i = 0; i < RN.INS; i++) v.push(g.rate[R0.INS + i] * 10); X.push(v); Y.push(g.blood.glc); }
      const med = Y.slice().sort((a, b) => a - b)[720]; let lab = Y.map((y) => (y > med ? 1 : 0)); if (shuffle) { const r = g.r; for (let i = lab.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [lab[i], lab[j]] = [lab[j], lab[i]]; } }
      const D = new Lin(2, RN.INS); for (let ep = 0; ep < 5; ep++) for (let i = 0; i < 720; i++) D.learn(X[i], lab[i], 0.05); const hit = [0, 0], n = [0, 0]; for (let i = 720; i < 1440; i++) { const o2 = D.out(X[i]); const pr = o2[1] > o2[0] ? 1 : 0; n[lab[i]]++; hit[lab[i]] += +(pr === lab[i]); }
      return 0.5 * (hit[0] / Math.max(1, n[0]) + hit[1] / Math.max(1, n[1])); });
    return { full: f({}), "visceral afferent cut": f({ visceralLesion: true }), "labels shuffled": f({}, true) }; },
};
void mean;
