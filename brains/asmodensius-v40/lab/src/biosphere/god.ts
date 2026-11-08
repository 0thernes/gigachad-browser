// God control panel: world dials and creature dials ("God plays dice"). Every dial acts through the Creature Lab Interface
// and is energy-conserving. Dice come from a DiceSource with provenance; default is seeded mulberry32 ("classical-seeded").
// The tsotchke quantum_rng WASM (neuralese-git/tsotchke/qrng.mjs) is the planned "qrng" source (not wired yet).
import { mulberry } from "../rng";
export type DiceSource = { name: "classical-seeded" | "qrng" | "moonlab-sim"; next: () => number; label?: string };
export const seededDice = (seed: number): DiceSource => ({ name: "classical-seeded", next: mulberry(seed * 2654435761) });
export type WorldDials = {
  foodCapScale: number;      // ecology / food cycle: nutrient capacity per patch (0 = barren)
  growthScale: number;       // photosynthetic regrowth rate
  gravity: number;           // 1 = baseline; scales locomotion cost (ATP -> heat) and slows movement
  toxicity: number;          // per-tick tissue damage
  electric: { part: string; amount: number } | null;   // sustained electrical stimulation
  sensoryLoad: number;       // hyper-stimulation of the sensory sheet (0 = baseline)
  quantumKicks: number;      // probability per tick of a dice-driven pulse into a random brain part
  // v0.4
  sensoryLinesR: number;     // R-version of sensory load: drives the real sensory lines (o.sens) instead of injecting current
  temperature: number;       // weather: deg C (20 = neutral); thermoregulation cost |T-20| * 0.0005 kJ/tick paid ATP -> heat
  wind: number;              // weather: drift (units/tick) along a dice-chosen direction that turns slowly
  o2: number;                // gas: O2 fraction (0.21 = normal); hypoxia proxy cost 0.01 * max(0, 0.21-o2)/0.21 kJ/tick
  co2: number;               // gas: CO2 fraction (0.0004 normal); hypercapnia -> LC (arousal) drive 0.5 * co2/0.04
  radiation: number;         // per-tick tissue damage, plus the same fraction of synapses silenced per tick
  recycling: number;         // fraction of detritus decomposed back into the local patch per tick (0 = waste is a sink)
  parasites: number;         // kJ/tick drained from each host's blood glucose into parasite biomass
  game: "none" | "pd" | "stag"; // payoff game played on contact; payoffs are harvested from the shared local patch
  // v0.5
  gameStrategy: "fixed" | "learned";
  dayLength: number; lightScale: number; lightMode: "cycle" | "LL" | "DD"; lightToCreatures: boolean; // v0.8 light dials: hours of light, intensity, constant light/dark, and whether dome light drives the creature (setLight) or the creature runs its own photoperiod
  deathRule: "organism" | "off"; respawnAfter: number; /* v0.9 lifecycle (DEATH-v1): "organism" = when the creature reports it is dead (alive() false) the dome stops stepping it (body frozen, energy kept in the ledger); respawnAfter > 0 = after that many ticks the corpse energy goes to detritus and a newborn of the same species with a fresh seed takes its place (its energy is logged as "born") */
  oneShot: boolean; // v0.6: each game round pairs creatures at random dome-wide (anonymous, no contact needed) instead of whoever is touching
  timeWarp: number; timeWarpR: number; // v0.6 time anomaly: creatures within timeWarpR of the centre run timeWarp brain/body ticks per world tick (0 = frozen time)
 // fixed: cooperate iff DA > 0.25. learned: p(C) = sigmoid(w), w updated by the creature's own dopamine response to the payoff
  ph: number;                // chemistry: water/soil pH (7 neutral). Digestive loss 0.004*|pH-7| kJ/tick from blood glucose into detritus
  singularity: number;       // anomaly: strength of a point attractor at the dome centre (units/tick pull at r=1, ~1/r); creatures within 0.7 are teleported by the dice
  grazers: number;           // ecology: number of grazer agents (second, non-neural species) competing for patch food; dead grazer mass -> detritus
};
export type CreatureDials = {
  modShift: { name: string; perTick: number } | null;   // neuromodulator shift
  rewireFrac: number;        // dice: fraction of synapses silenced at birth
  lesionDice: boolean;       // dice: one random mechanism lesion at birth
  mutationSigma: number;     // dice: genes ~ exp(N(0, sigma)) at birth
};
export const BASE_WORLD: WorldDials = { deathRule: "organism", respawnAfter: 0, dayLength: 12, lightScale: 1, lightMode: "cycle", lightToCreatures: false, oneShot: false, timeWarp: 1, timeWarpR: 4, foodCapScale: 1, growthScale: 1, gravity: 1, toxicity: 0, electric: null, sensoryLoad: 0, quantumKicks: 0, sensoryLinesR: 0, temperature: 20, wind: 0, o2: 0.21, co2: 0.0004, radiation: 0, recycling: 0, parasites: 0, game: "none", gameStrategy: "fixed", ph: 7, singularity: 0, grazers: 0 };
export const BASE_CREATURE: CreatureDials = { modShift: null, rewireFrac: 0, lesionDice: false, mutationSigma: 0 };
export const PRESETS: Record<string, Partial<WorldDials>> = {
  utopia: { foodCapScale: 2, growthScale: 3, gravity: 0.5 },
  baseline: {},
  harsh: { foodCapScale: 0.3, growthScale: 0.3, gravity: 2, toxicity: 0.0005 },
  hell: { foodCapScale: 0.05, growthScale: 0.05, gravity: 3, toxicity: 0.003, sensoryLoad: 2, quantumKicks: 0.2 },
};
// utopia -> hell ladder, 7 rungs: every hostile dial moves monotonically
export const LADDER: Partial<WorldDials>[] = Array.from({ length: 7 }, (_, i) => { const x = i / 6; return { foodCapScale: 2 * (1 - x) + 0.05 * x, growthScale: 3 * (1 - x) + 0.05 * x, gravity: 0.5 + 2.5 * x, toxicity: 0.003 * x, temperature: 20 + 25 * x, o2: 0.21 - 0.12 * x, radiation: 0.001 * x, parasites: 0.004 * x }; });
export const LADDER_NAMES = ["utopia", "lush", "mild", "baseline-ish", "harsh", "brutal", "hell"];
// payoff tables (kJ to row player, col player), harvested from the local patch: C = cooperate, D = defect
export const PAYOFF = { pd: { CC: [2.2, 2.2], CD: [0, 3.3], DC: [3.3, 0], DD: [0.6, 0.6] }, stag: { CC: [3.3, 3.3], CD: [0, 1.1], DC: [1.1, 0], DD: [1.1, 1.1] } } as const;
export const LESION_POOL = ["recLesion", "gwLesion", "rpeLesion", "efeLesion", "ppLesion", "stdpLesion", "homeoLesion", "nmdaLesion", "traceLesion", "pidLesion"];
export const KICK_PARTS = ["CTX", "THAL", "HIP", "STR", "VTA", "LC", "HYP", "MOT"];
export function birthOpts(cd: CreatureDials, dice: DiceSource): { opts: Record<string, unknown>; log: string[] } {
  const opts: Record<string, unknown> = {}, log: string[] = [];
  if (cd.mutationSigma > 0) { const g = Array.from({ length: 4 }, () => { const u = Math.max(1e-12, dice.next()), v = dice.next(); return Math.exp(cd.mutationSigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)); }); opts.genes = g; log.push(`genes ${g.map((x) => x.toFixed(2)).join(",")}`); }
  if (cd.lesionDice) { const f = LESION_POOL[Math.floor(dice.next() * LESION_POOL.length)]; opts[f] = true; log.push(`lesion ${f}`); }
  return { opts, log };
}
