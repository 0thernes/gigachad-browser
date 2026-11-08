// Creature Lab Interface (CLI). Every Asmodensius creature exposes this so one set of instruments works on all 100.
// No tokens, no prompts, no LLM: the "inputs" are stimuli, the "outputs" are motor/behaviour, the "activations" are neural/body state.
export type Vec = Float32Array | Float64Array | number[];
export interface Part { id: string; kind: "region" | "organ" | "modulator" | "module"; size: number; }
export interface Coupling { id: string; from: string; to: string; n: number; }
export interface CreatureLab {
  readonly creatureId: string; readonly seed: number;
  parts(): Part[];                      // named parts (brain regions, organs, modulators)
  couplings(): Coupling[];              // named part->part edges (connectome at part granularity)
  step(n?: number): void;               // advance n ticks (deterministic given seed)
  t(): number;
  readState(part: string, mode?: "slow" | "full"): Float64Array;  // slow = rates+voltages; full = all neuron state + incoming weights + eligibility
  writeState(part: string, x: Vec, mode?: "slow" | "full"): void; // transplant / patching
  motor(): Float64Array;                // the creature's output vector ("motor lens" target)
  metrics(): Record<string, number>;    // scalar behavioural/physiological readouts
  lesionCoupling(id: string, gain: number): void;  // 0 = cut, 1 = intact
  lesionFlag?(flag: string, on: boolean): void;    // creature-specific mechanism lesions
  stimulate(part: string, amount: number): void;   // inject drive (steering)
  feed?(amount: number): void;
  clone?(): CreatureLab;                // fresh copy with same seed/options
  // v0.2 optional lab hooks
  spikes?(): Uint8Array;                // binary spike vector this tick (PCI)
  routing?(): { winner: number; phases: number[]; ignitions: number };   // workspace / attention-schema routing
  noiseSample?(): number;               // last sample of the creature's internal noise/QRNG source
  noiseBits?(): number;                 // bits per noise sample
  hasCoupling?(id: string): boolean;
  // v0.2 biosphere body (see BIOSPHERE.md)
  body?(): BodySpec;
  sense?(w: WorldSense): void;          // world -> creature (food under body, light, touch, temperature)
  act?(): Action;                       // creature -> world (heading, speed, ingest request, emissions)
  exchange?(e: Exchange): void;         // world <-> creature matter/energy transfer
  ledger?(): { energy: number; intake: number; error: number };
  // v0.3 God-panel hooks (all energy-conserving: they move energy between stores, never create it)
  meet?(otherId: string): void; attachSandbox?(mark: (site: number) => boolean): void; readMarks?(m: Float32Array): void; neighbors?(nb: { id: string; dx: number; dy: number }[]): void; persona?(): Record<string, number> | null; // v4.0 social attitudes + lineage
  harm?(x: number): void;               // tissue damage (toxicity, radiation)
  work?(kJ: number): void;              // mechanical work paid from ATP into heat (gravity, drag)
  shiftModulator?(name: string, d: number): void;  // add d to an extracellular neuromodulator level
  rewire?(frac: number, rnd: () => number): number; // silence a random fraction of synapses; returns count
  senseLines?(x: number[]): void;       // v0.4: write the creature's real sensory lines (not current injection)
  drain?(kJ: number): number;           // v0.4: remove energy from the creature (parasite, payoff loss); booked as negative intake
  give?(kJ: number): void;              // v0.4: give food (payoff); booked as intake
  takeWaste?(): number;
  // v0.8 exact state (creature 001 v3.6 organism snapshot()/restore())
  snapshot?(): unknown;                 // complete JSON-safe state; restore() into any instance reproduces the run exactly
  restore?(s: unknown): void;
  alive?(): boolean;                    // v0.9: false once the organism's own death rule has fired (001: 2 h of hypoglycaemia / ATP failure)
  setLight?(x: number | null): void;    // v0.8: world light into the creature (null = its own internal photoperiod)                 // v0.4: hand excreted energy back to the world (recycling); returns kJ
}
export interface BodySpec { radius: number; mass: number; maxSpeed: number; habitat: ("land" | "water" | "air")[]; }
export interface WorldSense { light: number; foodHere: number; temperature: number; touch: number; t: number; }
export interface Action { heading: number; speed: number; forage: boolean; site: number; }
export interface Exchange { foodPatch: { food: number }; }
export type Factory = (seed: number, opts?: Record<string, unknown>) => CreatureLab;
export interface InstrumentResult { instrument: string; creature: string; seeds: number[]; params: Record<string, unknown>; result: unknown; }
