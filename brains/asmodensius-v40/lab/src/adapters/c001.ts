// Read-only adapter for creature 001 (imports organism.ts, never modifies it).
import { Organism, REGIONS, R0, RN, NNEU, mulberry } from "../../../creatures/001/organism/organism";
import { Affect } from "../../../creatures/001/organism/affect";
import { mutateGenome } from "../../../creatures/001/organism/develop";
import type { CreatureLab, Part, Coupling, Vec, BodySpec, WorldSense, Action, Exchange } from "../interface";
const NM = ["DA", "5HT", "NE", "ACh", "Glu", "GABA", "eCB"];
const regionOf = (i: number) => { for (const [r] of REGIONS) if (i >= R0[r] && i < R0[r] + RN[r]) return r; return "?"; };
// per-neuron arrays that make up the full dynamical state of a neuron (spiking + adaptation + traces)
const NEU = ["v", "spk", "rate", "xTr", "yTr", "nmda", "thA", "rateAvg", "th", "tau"] as const;
export type StateMode = "slow" | "full";
export class Creature001 implements CreatureLab {
  readonly creatureId = "001"; o: Organism; private edges = new Map<string, number[]>(); private nChoices = 0; private lastSite = -1;
  constructor(readonly seed: number, readonly opts: Record<string, unknown> = {}) {
    const pp = opts.parentPersona as any; this.o = new Organism({ seed, ...opts, ...(pp ? { persona: Affect.birth(mulberry(seed * 4049 + 7), pp) } : {}), ...(opts.parentDevGenome ? { develop: true, devGenome: mutateGenome(opts.parentDevGenome as Float32Array, mulberry(seed * 4073 + 3)) } : {}) } as any); /* v4.0: inherited personality with mutation + bet-hedging scatter */
    const s = this.o.syn; for (let k = 0; k < s.pre.length; k++) { const id = `${regionOf(s.pre[k])}->${regionOf(s.post[k])}`; (this.edges.get(id) ?? this.edges.set(id, []).get(id)!).push(k); }
  }
  parts(): Part[] { return [...REGIONS.map(([r, n]) => ({ id: r, kind: "region" as const, size: n })), ...NM.map((m) => ({ id: "nm:" + m, kind: "modulator" as const, size: 2 })), { id: "body", kind: "organ", size: 6 }, { id: "value", kind: "module", size: 16 }]; }
  couplings(): Coupling[] { return [...this.edges].map(([id, ks]) => { const [from, to] = id.split("->"); return { id, from, to, n: ks.length }; }); }
  hasCoupling(id: string) { return this.edges.has(id); }
  step(n = 1) { for (let i = 0; i < n; i++) { this.o.step(); if (this.o.choices.length > this.nChoices) { this.nChoices = this.o.choices.length; this.lastSite = this.o.choices[this.nChoices - 1]; } else this.lastSite = -1; } }
  t() { return this.o.t; }
  snapshot() { return { org: (this.o as any).snapshot(), nChoices: this.nChoices, lastSite: this.lastSite }; }
  restore(s: any) { (this.o as any).restore(s.org); this.nChoices = s.nChoices; this.lastSite = s.lastSite; }
  setLight(x: number | null) { (this.o as any).setLight(x); }
  readState(part: string, mode: StateMode = "slow"): Float64Array { const o = this.o as any;
    if (part.startsWith("nm:")) { const m = o.nm[part.slice(3)]; return Float64Array.from([m.P, m.E]); }
    if (part === "body") return Float64Array.from([o.blood.glc, o.blood.ffa, o.blood.aa, o.fat, o.hr, o.atp]);
    if (part === "value") return Float64Array.from(o.wSite);
    if (part === "regionRates") return Float64Array.from(REGIONS.map(([r]) => o.regionRate[r] ?? 0)); // v0.5: smoothed per-region firing rates (what HYP hunger is computed from)
    if (part === "rateAvg") { const out: number[] = []; for (const r of ["HYP", "CTX", "STR", "MOT", "INS"]) for (let i = R0[r]; i < R0[r] + RN[r]; i++) out.push(o.rateAvg[i]); return Float64Array.from(out); } // v0.5: slow per-neuron rates
    const a = R0[part], n = RN[part];
    if (mode === "slow") { const x = new Float64Array(2 * n); for (let i = 0; i < n; i++) { x[i] = o.rate[a + i]; x[n + i] = o.v[a + i]; } return x; }
    // full: every per-neuron array, plus plasticity: incoming synaptic weights and e-prop eligibility traces
    const inc = this.incoming(part); const out: number[] = [];
    for (const k of NEU) for (let i = 0; i < n; i++) out.push(o[k][a + i]);
    for (const s of inc) out.push(o.syn.w[s]);
    for (const k of ["elig", "eligT"]) for (let i = 4 * a; i < 4 * (a + n); i++) out.push(o[k][i]);
    return Float64Array.from(out); }
  writeState(part: string, x: Vec, mode: StateMode = "slow") { const o = this.o as any;
    if (part.startsWith("nm:")) { const m = o.nm[part.slice(3)]; m.P = x[0]; m.E = x[1]; return; }
    if (part === "body") { [o.blood.glc, o.blood.ffa, o.blood.aa, o.fat, o.hr, o.atp] = Array.from(x); return; }
    if (part === "value") { for (let k = 0; k < x.length; k++) o.wSite[k] = x[k]; return; }
    const a = R0[part], n = RN[part];
    if (mode === "slow") { for (let i = 0; i < n; i++) { o.rate[a + i] = x[i]; o.v[a + i] = x[n + i]; } return; }
    let j = 0; for (const k of NEU) for (let i = 0; i < n; i++) o[k][a + i] = x[j++];
    const inc = this.incoming(part); if (x.length !== NEU.length * n + inc.length + 8 * n) throw new Error(`full state size mismatch for ${part}: donor wiring differs (seed-specific connectome); use mode "slow" across seeds`);
    for (const s of inc) o.syn.w[s] = x[j++]; for (const k of ["elig", "eligT"]) for (let i = 4 * a; i < 4 * (a + n); i++) o[k][i] = x[j++]; }
  private incoming(part: string) { const a = R0[part], n = RN[part], p = this.o.syn.post, r: number[] = []; for (let s = 0; s < p.length; s++) if (p[s] >= a && p[s] < a + n) r.push(s); return r; }
  allParts() { return [...REGIONS.map(([r]) => r), ...NM.map((m) => "nm:" + m), "body", "value"]; }
  motor() { return this.readState("MOT").subarray(0, RN.MOT).slice(); }
  metrics() { const o = this.o; return { foraged: o.foraged, rewards: o.rewards, asleep: o.asleep ? 1 : 0, DA: o.nm.DA.E, NE: o.nm.NE.E, glc: o.blood.glc, hr: o.hr, kappa: o.kappa, qgtTrace: o.qgtTrace, motRate: o.regionRate.MOT ?? 0, ctxRate: o.regionRate.CTX ?? 0, forageNow: this.lastSite >= 0 ? 1 : 0, energy: o.energy(), ledgerError: o.ledgerError(), stores: o.fat + o.liverGly + o.muscle, integrity: o.integrity, atp: o.atp, eaten: o.eaten, ignitions: (o.mind as any).ignitions, hunger: o.regionRate.HYP ?? 0, vagal: o.vagal }; }
  lesionCoupling(id: string, gain: number) { const ks = this.edges.get(id); if (!ks) throw new Error(`creature 001 has no coupling ${id}`); for (const k of ks) this.o.mask[k] = gain; }
  lesionFlag(flag: string, on: boolean) { this.o.lesion(flag as any, on); }
  stimulate(part: string, amount: number) { this.o.stimulate(part, amount); }
  feed(a: number) { this.o.feed(a); }
  clone() { return new Creature001(this.seed, this.opts); }
  spikes() { return this.o.spk.slice(); }
  routing() { const m = this.o.mind as any; return { winner: m.win, phases: m.phase.slice(), ignitions: m.ignitions }; }
  noiseSample() { return this.o.qOut; } noiseBits() { return 3; }
  // biosphere body
  body(): BodySpec { return { radius: 0.5, mass: 1, maxSpeed: 0.6, habitat: ["water", "land"] }; }
  sense(w: WorldSense) { if (w.touch > 0) this.o.stimulate("INS", 0.2 * w.touch); }
  alive() { return !this.o.dead; }
  exchange(e: Exchange) { (this.o.o as any).pool = e.foodPatch; } // the organism's own forage draws (2.2 kJ) now come out of the world patch under its body
  private nb: { id: string; dx: number; dy: number }[] = [];
  meet(id: string) { const a = this.o.affect; if (a) a.meet(id, a.feltValence()); }
  neighbors(nb: { id: string; dx: number; dy: number }[]) { this.nb = nb; }
  persona() { return this.o.affect ? { ...this.o.affect.persona } as Record<string, number> : null; }
  attachSandbox(mark: (site: number) => boolean) { (this.o as any).domeSandbox = (q: any) => q.hook === "mark" && mark(q.arg); }
  readMarks(m: Float32Array) { if ((this.o as any).neo) (this.o as any).marks.set(m); }
  v40State() { return (this.o as any).v40State(); }
  devGenome() { return (this.o as any).devGenome as Float32Array | null; }
  affectState() { return this.o.affectState(); }
  /** v4.0: when not heading to a food site, steer toward the most-liked or away from the most-disliked nearby creature */
  private socialHeading(): number { const a = this.o.affect; if (!a || !this.nb.length) return NaN; let best = 0, hd = NaN; for (const n of this.nb) { const s = a.stance(n.id); if (Math.abs(s) > Math.abs(best) && Math.abs(s) > 0.05) { best = s; hd = Math.atan2(n.dy, n.dx) + (s < 0 ? Math.PI : 0); } } return hd; }
  act(): Action { const site = this.lastSite; return { heading: site >= 0 ? (site / 16) * 2 * Math.PI : this.socialHeading(), speed: Math.min(1, 4 * (this.o.regionRate.MOT ?? 0)) * (this.o.asleep ? 0 : 1), forage: site >= 0, site }; }
  harm(x: number) { this.o.damage(x); }
  work(kJ: number) { const o = this.o; const w = Math.min(kJ, Math.max(0, o.atp)); o.atp -= w; o.heat += w; }
  shiftModulator(name: string, d: number) { const m = this.o.nm[name]; if (!m) throw new Error(`no modulator ${name}`); m.E = Math.max(0, m.E + d); }
  rewire(frac: number, rnd: () => number) { let n = 0; for (let k = 0; k < this.o.mask.length; k++) if (rnd() < frac) { this.o.mask[k] = 0; n++; } return n; }
  senseLines(x: number[]) { for (let i = 0; i < 16; i++) this.o.sens[i] = x[i % x.length]; }
  drain(kJ: number) { const o = this.o; const d = Math.min(kJ, Math.max(0, o.blood.glc)); o.blood.glc -= d; o.eaten -= d; return d; }
  give(kJ: number) { if (kJ > 0) this.o.feed(kJ); }
  takeWaste() { const o = this.o; const w = o.excreted; o.excreted = 0; o.eaten -= w; return w; } // waste leaves the body: booked as negative intake so the internal ledger stays exact
  ledger() { return { energy: this.o.energy(), intake: this.o.eaten, error: this.o.ledgerError() }; }
}
export const make001 = (seed: number, opts?: Record<string, unknown>) => new Creature001(seed, opts);
export const N001 = NNEU;
