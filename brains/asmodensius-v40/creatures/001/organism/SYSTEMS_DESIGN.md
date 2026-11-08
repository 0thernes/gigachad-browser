# Creature 001 organism v3.0: systems design

One deterministic, seedable simulation (`organism.ts`) is the organism. The node tests and the browser creature
both import the same code. In the browser, the renderer and the inspector panel read `Organism` state only.
1 tick = 1 simulated minute. Each tick runs 6 spiking substeps; the decision race runs 3 + 5·(level − 1) substeps.

Honesty labels used below:
- **[grounded]**: the structure or sign follows the cited literature.
- **[illustrative]**: the constant is a modelling choice, tuned only on seeds 2000–2015.
- **[speculative]**: the concept has no settled biological meaning; the doc states exactly what was computed.
- **[port]**: re-implemented in TypeScript from a definition or algorithm in a tsotchke repo; the library itself is not run.

## 1. Subsystems

| # | Subsystem | State | Code |
|---|---|---|---|
| N | Spiking CNS: 13 regions, 224 LIF neurons (SENS 16, THAL 16, CTX 64 with 52 E / 12 I, HIP 32, STR 32, HYP 16, VTA 6, RAPHE 6, LC 6, BF 6, INS 8, SCN 8, MOT 8) | v, threshold, spikes, pre/post STDP traces | `step()` neural tick |
| E | Enteric nervous system (myenteric plexus, 48 neurons, 12 inhibitory) | spikes; drives motility | ENS region |
| A | Autonomic: sympathetic and parasympathetic tone | symp, para | autonomic block |
| C | Connectome | 1,850 synapses (seed 2000), 387 plastic E→E | constructor |
| P | Plasticity: DA-gated STDP on cortical E→E (three-factor); RPE learning on hippocampal-site → striatal value synapses; cortical colour/shape feature model | syn.w, wSite[16], featC[4], featS[4] | |
| M | Neuromodulators: DA, 5-HT, NE, ACh, Glu, GABA, eCB | vesicle pool P, extracellular E | `kin()` |
| H | Hormones: insulin, glucagon, cortisol, ghrelin, leptin, melatonin | levels 0..1 | |
| G | Gut | lumen glucose, fat, protein (kJ) | |
| L | Liver | glycogen; gluconeogenesis, ketogenesis, lipogenesis, urea | |
| F | Adipose | fat store (kJ) | |
| U | Muscle | protein store (kJ) | |
| B | Blood / circulation | glucose, FFA, amino acids, ketones, urea; perfusion = HR/70 | |
| K | Heart | HR | |
| X | Cellular energetics | ATP buffer, heat, excreta | ledger |
| Z | Circadian (SCN) + ultradian (90 min BRAC) | scnPhase, ultra | |
| S | Sleep: two-process flip-flop (adenosine S, circadian C); stages WAKE/N1/N2/N3/REM | S, stage | |
| R | Replay and dreams: NREM consolidation, REM generative recombination | episodes buffer | |
| Λ | Latent and liminal: online Oja PCA (3 components) of 12 region rates; liminality = closeness to a sleep/wake switching threshold | pc, z, liminal | |
| Κ | Thought curvature, felt through the insula | kappa | |
| Q | Quantum layer: 3-qubit state vector, Born-rule sampling, QGT, NIST health tests | q, qgtTrace, berry, health | `Q3`, `qgt`, `Health` |
| I | Intelligence level 1..4 (auto: ACh × ATP × brain fuel, or forced) | level | |
| B2 | Behaviour: hunger-gated foraging over 16 sites (4 colours × 4 shapes); half are accessible on days 1–3 | choices, rewards | `choose()` |
| W | 100M GPU network (browser only) | existing procedural 4×5000×5000 + 680,008 learned params | app.tsx |

## 2. Coupling matrix (row → column: "row's output is an input of column")

Every non-empty cell is a line of code in `organism.ts`. Legend: + excites/increases, − inhibits/decreases, m = mass/energy flux, g = gates/scales.

| from \ to | N(CNS) | E(ENS) | A | M | H | G | L | F | B | K | X(ATP) | S | R | Κ | Q | I | B2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **N** CNS |  recurrent | | +LC→symp, −LC→para | release ∝ nucleus spikes | | | | | | | m spikes cost ATP | +adenosine via ATP turnover | HIP cells reactivated | trajectory | | | STR race, HYP hunger |
| **E** ENS | +ENS→HYP | recurrent | | | | g motility | | | | | | | | | | | |
| **A** autonomic | | +para→ENS | | | +para→insulin, +symp→glucagon | g motility | g glycogenolysis | +lipolysis | | HR | m heart cost | | | | | | |
| **M** modulators | g NE cortical gain, g Glu/GABA/eCB synaptic scale, DA→STR drive, ACh→HIP/CTX | | | DA pool→NE synthesis, Glu→GABA | | | | | | | m synthesis cost | | ACh gates encoding | | angles θ = π·(DA, 5HT, NE) | ACh sets level | DA sets noise σ, RPE learning |
| **H** hormones | ghrelin, leptin→HYP; cortisol→LC; melatonin→sleep | | cortisol→symp | | PID loops | | insulin/glucagon/cortisol fluxes | insulin/glucagon/cortisol | | | | melatonin +drive | | | | | |
| **G** gut | vagal afferent→HYP, RAPHE | fill→ENS | vagal→para | | ghrelin | | | | m absorption | | | | | | | | satiety ↓ forage |
| **L** liver | | | | | | | | m lipogenesis | m glucose, ketones, urea | | m heat | | | | | | |
| **F** adipose | leptin | | | eCB precursor (FFA) | leptin | | | | m FFA, glycerol | | | | | | | | |
| **B** blood | brain fuel g thresholds, aa→precursors | | hypoglycaemia→symp | precursor gating | glucose→insulin/glucagon | | m | m | | | m oxidation | | | | | | |
| **K** heart | perfusion → brain glucose | | | | | | | | perfusion | | m cost | | | | | | |
| **X** ATP | g thresholds (K-ATP), g VTA, g BF | | | g synthesis | | | | | | | | | | | | g level | |
| **Z/S** clock+sleep | stage-specific drives (thalamic gating, N3 slow oscillation, REM: LC off, ACh on) | | sleep→para | | cortisol rhythm, melatonin | | | | | | | | stage gates replay | | | | wake gates forage |
| **R** replay | HIP depolarisation | | | | | | | | | | | | | | | | writes wSite, feat |
| **Λ** liminal | | | | | | | | | | | | | +replay probability | | | | |
| **Κ** curvature | INS, LC drive | | via LC→symp | | | | | | | | | | | | | | |
| **Q** quantum | | | | | | | | | | | | | | | | | noise sign, QGT trace scales σ |
| **I** level | spike cost ×level | | | | | | | | | | m drain | via ATP→S | | | | | integration steps |
| **B2** behaviour | RPE→DA burst | | | | | food→gut | | | | | m motor cost | | episodes stored | | | | |
| **W** GPU net (browser) | predErr→LC | | | | | | | | | | | | | | | | |

Diagram: `docs/systems.html` draws the same matrix as a graph, built from `COUPLING` in `organism/coupling.ts`.

## 3. Feedback loops (main ones)
1. **Glucose homeostasis (−):** blood glucose → PID insulin/glucagon → liver glycogen / gluconeogenesis → glucose. The setpoint shifts with the SCN (allostasis). [grounded structure, illustrative gains]
2. **Feeding (−):** low glucose + ghrelin → HYP → forage → gut fill → vagal afferent → HYP satiety. Vagotomy opens the fast arm. [grounded]
3. **Sleep homeostasis (−):** brain ATP turnover → adenosine S ↑ → sleep → S cleared (fastest in N3) (Borbély 1982 two-process). [grounded]
4. **Reward learning (−):** choice → outcome → RPE → DA burst + value update → choice.
5. **Arousal (+ then −):** LC → NE → cortical gain → state-trajectory curvature → insula → LC; it is limited by NE reuptake and by ATP cost.
6. **Fuel-limited cognition (−):** level ↑ → ATP drain ↑ → ATP/brain fuel ↓ → level ↓ and DA ↓.
7. **Starvation → motivation (−, slow):** no food → amino acids ↓ and brain glucose ↓ (ketones partly substitute) → VTA firing and DA synthesis ↓ → noise ↓ → exploration ↓.
8. **Heart–brain (+):** LC/stress → sympathetic tone → HR → perfusion → brain glucose transport.
9. **Lipid → endocannabinoid (−):** FFA availability + cortical overactivity → eCB → suppresses excitatory release (CB1 retrograde). [grounded sign]

## 4. Timescales
- Spikes: substep, ~1/6 of a tick.
- Neuromodulator release and reuptake: minutes.
- Absorption: ~20–60 min.
- Hormones: ~10–100 min.
- Ultradian cycle: 90 min.
- Adenosine: ~hours (clearance τ ≈ 450 min, 250 min in N3).
- Circadian: 24 h.
- Fat store: days.
- Value synapses: from minutes (RPE) to nights (replay).

## 5. Conservation law
Total energy E = gut(glc+fat+prot) + blood(glc+ffa+aa+ket+urea) + liver glycogen + fat + muscle + brain glucose + ATP + cumulative heat + cumulative excreta.
Every flux is written as a move between these terms, and every inefficiency goes to heat. Hence E(t) = E(0) + eaten, exactly up to floating point.
Test V3-C10 checks this on every run of the suite. A deliberately leaky ledger serves as a negative control and must be detected.
Neuromodulator molecules are not mass-tracked; only their ATP synthesis cost is. Water, O2/CO2 and temperature are not modelled.

## 6. Grounding sources
- FlyWire whole adult *Drosophila* brain: 139,255 neurons, 54.5 M chemical synapses (Dorkenwald et al. 2024, *Nature* 634:124, doi:10.1038/s41586-024-07558-y). Used for the sparse, region-structured (projectome-like) connectivity and per-region connection probabilities in the 10⁻²–10⁻¹ range. These are illustrative choices; FlyWire neurons are not imported.
- Rodent cortical motifs: reciprocal connections about 4× over-represented relative to random, and log-normal EPSP weights (Song, Sjöström, Reigl, Nelson, Chklovskii 2005, *PLoS Biol* 3:e68). Both are implemented in CTX→CTX wiring.
- Two-process sleep regulation (Borbély 1982); adenosine as a sleep-pressure signal (Porkka-Heiskanen et al. 1997).
- Hippocampal replay during NREM supports consolidation (Wilson & McNaughton 1994; Girardeau et al. 2009, ripple disruption impairs learning). REM recombination as generative "dreaming" is a hypothesis (e.g. Lewis, Knoblich & Poe 2018, *TICS*). **[speculative]**
- K-ATP channels make midbrain DA neurons metabolically sensitive (Liss et al. 2005, *Nat Neurosci*). In biology, acute hunger *raises* DA-driven foraging (ghrelin → VTA; Abizaid et al. 2006). The model includes a weak ghrelin boost, and the test is about a 3-day fast.
- Vagal afferents carry gut satiety signals; subdiaphragmatic vagotomy alters meal-related satiation (e.g. Schwartz 2000).
- Most gut 5-HT is enteric. Modelled only as a vagal contribution to raphe drive.
- C. elegans CAP-C (v2.7) failed with the reversed direction. It is not re-used here, and no sign was flipped.

## 7. Speculative pieces, stated exactly
- **Thought curvature:** discrete curvature (turning angle / mean step length) of the 3-D latent trajectory z_t, where z = online-PCA projection of region rates. This is the extrinsic curvature of a curve in Euclidean latent space. **It is not the Riemann tensor of a state manifold**; that is not computed. It is "felt" in a functional sense only: it drives insula → LC.
- **Liminal state:** a Gaussian bump on the distance of sleep drive from the switching threshold. It raises replay probability (a hypnagogic analogue).
- **Quantum layer:** a classical simulation of a 3-qubit state vector (Ry/Rz/CNOT gates, as in Moonlab's gate model). Measurements are Born-rule draws using a classical uniform: the seeded PRNG in tests, `crypto.getRandomValues` in the browser when `entropy: "crypto"`. **That is not a physical QRNG.** The randomness is only as good as the classical source. The quantum geometric tensor (Fubini–Study metric and Berry curvature) of the parameterised state is computed by finite differences, following the definitions used in tsotchke/quantum_geometric_tensor [port of the definition]. NIST SP 800-90B repetition-count and adaptive-proportion cutoffs are ported from tsotchke/quantum_rng `src/health/health_tests.c` [port]. Health failures are expected and real: when DA/5HT/NE collapse the state toward |000⟩, min-entropy falls below the assumed 2.5 bits. Test V3-C9 preregisters that the quantum source gives **no** behavioural advantage over a classical coin (equivalence). "Quantum GTL" in the request is read as QGTL, the Quantum Geometric Tensor Library. Eshkol (a Scheme-like language with autodiff) is not ported; the existing creature already has its own autodiff tape.
- **Intelligence levels:** these are deliberation depth (integration substeps) with a per-spike ATP price, not general intelligence.

## 8. Parameter accounting (honest)
- Browser creature: 100,000,000 procedural hash weights (fixed, regenerated per MAC in the GPU shader) + 680,008 learned (LoRA + readout). This is the existing work, integrated rather than duplicated.
- Organism module: about 2.3 k parameters for seed 2000 (`paramCount()`): synapses, value/feature synapses, thresholds, kinetic and metabolic constants, PCA weights, quantum angles.
- Total in the browser ≈ 100.68 M. In node tests the 100M GPU network is **not** run (no GPU, too slow on CPU per tick). Its only coupling into the organism is predErr → LC, which is zero in node. So the preregistered tests measure the organism module without the 100M network.

## 9. Shared mechanism code: plan for v3.1 (not done in this round)
The audit (`MECHANISM_AUDIT.tsv`) found that 76 of 85 frozen indicator tests run on self-contained harness models. v3.1 should re-run CQM-25 / Butlin-14 / 10-framework tests with the organism as the system under test:
- workspace = winner among region populations broadcast through THAL;
- attention schema = the existing Kalman model, moved into the organism;
- recurrence = CTX→THAL→CTX loop with lesion controls;
- predictive model = feature model + GPU readout;
- agency = efference copy from MOT.

Each should be preregistered before code, with organism lesions as controls. This round moves the metabolic, sleep, neuromodulatory and behavioural mechanisms into code shared by browser and node. It does **not** yet migrate the workspace, attention-schema, RV32I or LoRA code, which stay in app.tsx.

## v3.0 outcome (test seeds 1000–1015)
10/12 pass. C2 fails: sleep beats forced wake (d 1.98, t 5.60), but against sleep with replay disabled d is 0.93 and t is 2.63 (< 2.75). C8b fails (d 0.22, t 0.61), as it already did on tuning seeds. Full table: `results/organism_v30_run.txt`, `docs/systems.html`.

## Round 14 additions (v3.1–v3.3)
- **Mind layer** (class Mind, holding a reference to its Organism): workspace competition with an NE-lowered ignition threshold; broadcast to HIP; attention gain on SENS; top-down input to THAL; a confidence monitor; a Kalman attention schema; an NLMS next-sense predictor; Kuramoto phase binding; TD(λ) with normalized updates; an arm forward model fed by an efference copy; a glucose forecaster; and a planner. Cognitive cost is charged to brain ATP, so the ledger stays exact.
- **Integrity**: tissue kJ is part of the ledger. Damage raises cortisol and INS drive. Repair uses amino acids and ATP.
- **LTC option**: τ = τ0(1+1.5·ACh)/((1+0.5|I|)(1+0.5·NE)). The gains are hand-set, not learned as in Hasani et al. On preregistered tests it gave no benefit (v3.3, 0/5).
- **Caveats**: the cortex does not decode the stimulus (F ≈ 0.09), so the workspace and metacognition items fail. Several CQM items reuse the same mechanism. The CQM03 control is degenerate. The raphe fix is applied only to decision v32.
