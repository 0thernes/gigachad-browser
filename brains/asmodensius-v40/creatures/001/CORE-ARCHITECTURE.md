# CORE-ARCHITECTURE: one general brain for creature 001 (v5-core)
Status: design + minimal flagged build (`ORG_V5=1`), 2026-10-31 PT. Original design by this project. Tsotchke and Alex Donahue's own work (SUPER CREATURE, CQM) are credited as such. No claim of phenomenal consciousness.

## Principle
One learning rule family and one circuit motif, repeated, instead of one module per test. Every test property should **follow from** the architecture. If a test passes only through a dedicated patch, treat that as a design smell.

## 1. Cortex: one predictive-learning sheet
- **Unit: two-compartment pyramidal neuron.**
  - Basal dendrites carry feedforward evidence. Apical dendrites carry context and prediction from other areas and the thalamus.
  - An NMDA plateau multiplies basal drive only when apical input is net-depolarising (Larkum 2013; Schiller et al. 2000).
  - Inhibition is signed and selective: disynaptic, so SOM targets apical dendrites and PV targets the soma (Pouille & Scanziani 2001; Silberberg & Markram 2007).
- **Learning: local prediction error.**
  - Each area predicts its basal input from apical context.
  - Plasticity is gated by the mismatch between apical and basal input (burst-dependent plasticity; Payeur et al. 2021). This is the same rule everywhere: no per-test learning rules.
- **Cross-area wiring is learned, not hand-set.**
  - Start sparse and random (Rigotti et al. 2013 mixed selectivity), then grow or prune by co-activity, which gives like-to-like structure (Ko et al. 2011).
  - Consequence: mixed selectivity (RPT-2) emerges where tasks need conjunctions.
- **Thalamic loop.**
  - Each area has a matrix-thalamus partner that gates apical input (Halassa & Kastner 2017).
  - The pulvinar computes salience as relay contrast (already in v3.5).
- **Global workspace: one broadcast, not one per test.**
  - Areas compete through the thalamic reticular nucleus. One winner's state is broadcast to all apical compartments, with ignition all-or-none (Dehaene & Changeux 2011).
  - Everything that needs "global availability" reads this one channel.
- **Fast online readouts.**
  - Every readout is a normalised delta rule on divisively normalised rates (Carandini & Heeger 2012).
  - Rates are z-scored by each cell's own running mean and variance (intrinsic homeostasis; Turrigiano 2008), so a single-pass readout is well conditioned.
- **Time constants are conductance-based.**
  - τ falls with total synaptic conductance (Koch, Rapp & Segev 1996), giving liquid time constants for free, as in the LTC idea of Hasani et al. 2021.

## 2. Body and drive layer (sets goals; the cortex never sets its own goals)
- **Interoception:** glucose, fat/leptin, insulin, ghrelin, cortisol, temperature and sleep pressure.
- **Hypothalamic drives are opponent pairs.** AgRP feeding is inhibited by insulin and leptin, POMC by the reverse (Woods 1979; Könner 2007). There is a sleep homeostat (Borbély 1982).
- **Allostasis:** drives act on predicted deficits, so the cortex's own forecast of interoceptive state feeds back into the hypothalamus (Sterling 2012).
- **Affect** = valence and arousal read from the drive state. Neuromodulators (DA = reward prediction error, NE = surprise, ACh = expected uncertainty; Yu & Dayan 2005) set cortical gain and learning rate globally.
- **Substrate senses stay read-only.**

## 3. Compute and randomness engine (Tsotchke)
- **Eshkol:** the numeric core (tensor ops for the sheet).
- **Moonlab:** simulation and visual-lab host.
- **QGTL:** geometry and graph tooling for wiring growth.
- **QRNG:** the single entropy source for exploration noise, mutation and stochastic spikes, so that all randomness is seeded through one interface (deterministic in dev, QRNG-backed in demo runs).
- Integration is an adapter layer only. The brain's equations do not depend on the engine.

## 4. Scaling path (~100M parameters)
| Stage | Areas × cells | Synapses (params) | Engine |
|---|---|---|---|
| v5-core (now) | 4 × 13 E | ~10^3 | JS |
| v5.1 | 8 × 256 | ~10^6 | Eshkol tensors, sparse |
| v5.2 | 16 × 2k | ~10^7 | block-sparse, event-driven |
| v5.3 | 32 × 8k | ~10^8 | GPU / Moonlab batch, local rules only |

Local learning rules keep it embarrassingly parallel. The broadcast is O(areas), not O(cells).

## 5. Property → test map (each test is a consequence, not a patch)
| Property | Tests it should satisfy |
|---|---|
| Two-compartment conjunction + learned cross wiring | RPT-2, RPT-1, mixed-selectivity N-items |
| Single broadcast workspace with ignition | GWT-1/2/3(R), CTM, global availability |
| Apical prediction + mismatch | HOT-1 (generative percept), PROJ(R) (efference = apical prediction), AINF |
| Normalised fast readouts + confidence = readout margin | HOT-2/3(R), metacognitive opt-out |
| DA-RPE + NE-surprise learning rate | AE-1(R), UAL, thaler9 |
| Hippocampal replay into the same readouts | CQM08(R), CQM12 |
| Opponent hypothalamic drives + allostasis | CQM10, CQM16, viability |
| Conductance-based τ | LTC |
| Energy-gated reproduction with heritable genome → body | CQM01, CQM03R, CQM04 (EVO-S) |

## 6. Minimal build (v5-core, `ORG_V5=1`)
This is a first step only. It turns on the parts of this design that already exist as validated pieces:
- signed selective cross-area apical input (`xsel` 3);
- NMDA rectification (`dTh` → 0+);
- the insulin-gated AgRP drive (`insS`).

Not yet built: learned wiring growth, mismatch-gated plasticity, z-scored readouts, the conductance τ in the creature, and the Tsotchke adapter. The comparison against v4.0 is in DISCOVERIES.md.
