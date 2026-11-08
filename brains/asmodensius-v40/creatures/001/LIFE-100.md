# LIFE-100: 100 areas of life for Creature 001

Status: roadmap document only (2026-11-02, Asia/Manila). No code changed. Read before writing: DELARP-PLAN.md (Parts I–XV), REARCHITECT.md, /workspace/freak-100.md (FREAK-100).

## Vision (Alex)
Nothing cosmetic. Every part is adaptive, reactive and causally coupled, so dome stimuli and the creature's own state reach every other part. Physical abilities: morph, mimic, expand/contract, extend/shorten, grow, die, mutate, procreate, harvest, nurture, raise young, evolve. A weird body: legs with their own brains, alien eyes, arms and body. Many sensors, emotions, feelings and nerve types. "Psychic", wireless and remote-viewing senses are built as **real simulated mechanisms inside the dome** (fields, channels with cost and noise, validated against shuffle controls), never as claims about real-world ESP. Long-term target: a brain of about 100M parameters / connections / synapses, beyond the fly connectome (FlyWire: ~140k neurons, ~5×10^7 synapses; Dorkenwald et al. 2024, Nature). The dome stays neutral; all balancing happens inside the creature.

## Status key
- **BUILT**: code exists and is wired in; `file:line` given (paths relative to `creatures/001/` unless they start with `lab/`, which is relative to the repo root). BUILT means the mechanism exists, *not* that it has passed a preregistered test. Most v4.0 parts have only n = 1 smoke tests (DELARP Parts XI–XV).
- **PARTIAL**: a fragment exists (e.g. the dome does it rather than the organism, a stand-in variable, synthetic only).
- **PLANNED**: specified in DELARP-PLAN.md, REARCHITECT.md or FREAK-100, not coded.
- **MISSING**: neither code nor plan.

Line numbers are for branch v4.0 at the commit that adds this file. Many organism.ts lines hold several statements; the line is where the mechanism starts.

## Coverage summary (500 attributes)
| Status | Count | Share |
|---|---|---|
| BUILT | 202 | 40% |
| PARTIAL | 27 | 5% |
| PLANNED | 106 | 21% |
| MISSING | 165 | 33% |
| Total | 500 | 100% |

| Group | BUILT | PARTIAL | PLANNED | MISSING |
|---|---|---|---|---|
| I. Body economy | 22 | 2 | 7 | 14 |
| II. Integrity, health, death | 21 | 2 | 4 | 23 |
| III. Sleep and rhythms | 15 | 2 | 4 | 4 |
| IV. Body plan, motion, morphology | 8 | 2 | 8 | 27 |
| V. Senses | 20 | 4 | 12 | 14 |
| VI. Nervous system | 22 | 4 | 20 | 4 |
| VII. Mind and cognition | 33 | 0 | 26 | 16 |
| VIII. Affect | 30 | 3 | 2 | 5 |
| IX. Life cycle and heredity | 13 | 2 | 10 | 20 |
| X. Social and ecological life | 6 | 4 | 5 | 30 |
| XI. Alien and integrative | 12 | 2 | 8 | 8 |
## I. Body economy

### 1. Metabolism
Source: Krebs/oxidative physiology; Sterling 2012 allostasis

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Nutrient pools (gut, blood, liver, fat, muscle) | BUILT | `organism/organism.ts:290` |
| Closed energy ledger (conservation) | BUILT | `organism/organism.ts:419` `energy()` sums all pools |
| Liver glycogen, lipo-, keto-, gluconeogenesis | BUILT | `organism/organism.ts:601` to :608 |
| ATP as currency gating neurons | BUILT | `organism/organism.ts:483` K-ATP on VTA |
| Heritable traits paid in the same currency | PLANNED | DELARP §3 principle 5 |

### 2. Feeding / appetite
Source: Cummings & Overduin 2007; Woods 2004

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Hunger hormones (ghrelin, leptin, insulin) | BUILT | `organism/organism.ts:292` |
| AgRP-like drive inhibited by insulin | BUILT | `organism/organism.ts:556` |
| Foraging act that yields food | BUILT | `organism/organism.ts:558` |
| Satiation cascade over 3 timescales | PLANNED | FREAK-100 #32 |
| Food choice by taste/quality | MISSING |  |

### 3. Digestion
Source: Furness 2012 (ENS)

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Gut contents and absorption | BUILT | `organism/coupling.ts:8` edge Gut→Blood, implemented in organism.ts |
| Enteric nervous system activity | BUILT | `organism/organism.ts:470` |
| Vagal afferents to brainstem | BUILT | `organism/organism.ts:470` |
| Microbiome | PLANNED | FREAK-100 #98 |
| Food toxins/indigestion | MISSING |  |

### 4. Excretion / waste
Source: Urea cycle; nitrogen balance

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Urea from protein catabolism | BUILT | `organism/organism.ts:290` `blood.urea` |
| Excreted mass leaves the ledger | BUILT | `organism/organism.ts:290` `excreted` |
| Waste deposited into the dome (fouling) | MISSING |  |
| Water/salt balance (kidney) | MISSING |  |
| Scent from waste as a signal | MISSING |  |

### 5. Thermoregulation
Source: Cannon & Nedergaard 2004

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Heat produced as a ledger pool | BUILT | `organism/organism.ts:290` `heat` |
| Adaptive thermogenesis on store deficit | BUILT | `organism/organism.ts:613` |
| Ambient temperature sensed | MISSING |  |
| Brown-fat buffer | PLANNED | FREAK-100 #37 |
| Behavioural thermoregulation (seek shade/warmth) | MISSING |  |

### 6. Circulation
Source: Guyton physiology

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Heart rate set by autonomic tone | BUILT | `organism/coupling.ts:5` Autonomic→Heart edge |
| Perfusion limits brain glucose | BUILT | `organism/coupling.ts:9` Heart→Blood |
| Blood composition (glc, FFA, aa, ketones) | BUILT | `organism/organism.ts:290` |
| Vessels/topology of a body plan | MISSING |  |
| Heart as its own pacemaker brain | MISSING |  |

### 7. Respiration / gas exchange
Source: Oxygen-limited metabolism

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Oxygen as a resource | MISSING |  |
| Breathing rhythm generator | MISSING |  |
| Hypoxia sense | MISSING |  |
| Anaerobic vs aerobic switch | MISSING |  |
| Dome atmosphere field | MISSING |  |

### 8. Homeostasis
Source: Cannon 1932; Yi et al. 2000

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Glucose set-point control | BUILT | `organism/organism.ts:556` feeding/insulin control |
| Interoceptive 30-min glucose forecast | BUILT | `organism/organism.ts:176` |
| Integral feedback zero-error | PARTIAL | `aic` integral per REARCHITECT §3A; forecast tie inert (B29) |
| Rheostasis (moving set-points) | PLANNED | FREAK-100 #33 |
| Antithetic motif | PLANNED | FREAK-100 #31 |

### 9. Allostasis / stress load
Source: McEwen 1998

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| HPA stress integrator with lock-in | BUILT | `organism/affect.ts:40` to :42 |
| Cortisol feedback into body | BUILT | `organism/affect.ts:42` |
| Allostatic load accumulator long-term | PARTIAL | `stress` EMA only, no lifetime load |
| Predictive (pre-deficit) action | PLANNED | REARCHITECT Stage 1 |
| Recovery/hysteresis | BUILT | `organism/affect.ts:41` |


## II. Integrity, health, death

### 10. Injury / damage
Source: Tissue damage physiology

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Tissue pool and integrity | BUILT | `organism/organism.ts:417` |
| Damage feeds pain/insula | BUILT | `organism/coupling.ts:17` |
| Danger in the world causes damage | BUILT | `organism/organism.ts:271` `danger` opt |
| Localised injury per body part | MISSING |  |
| Limb loss | MISSING |  |

### 11. Repair / healing
Source: Wound healing; protein synthesis

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Repair from amino acids costing ATP | BUILT | `organism/organism.ts:588` |
| Lesion to repair | BUILT | `organism/organism.ts:588` `repairLesion` |
| Scarring / lasting change | MISSING |  |
| Regeneration of lost parts | MISSING |  |
| Repair prioritisation by brain | MISSING |  |

### 12. Immunity
Source: Janeway immunobiology; Dantzer 2008 sickness

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Inflammation level | BUILT | `organism/affect.ts:46` |
| Chance infections | BUILT | `organism/affect.ts:46` |
| Sickness behaviour (lethargy, anhedonia) | BUILT | `organism/affect.ts:48` |
| Pathogens as dome entities | MISSING |  |
| Adaptive immune memory | MISSING |  |

### 13. Pain / nociception
Source: Melzack & Wall 1965

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Pain from damage | BUILT | `organism/affect.ts:55` `outcome(pain)` |
| Aversive value learned from damage | BUILT | `organism/organism.ts:491` pain→INS |
| Pain modulates emotion (fear) | BUILT | `organism/affect.ts:29` |
| Nerve types (A-delta/C split) | MISSING |  |
| Descending pain control | MISSING |  |

### 14. Disease / dysregulation
Source: Psychiatric phenotypes as dynamics

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Depressive mood lock-in | BUILT | `organism/affect.ts:33` rumination |
| Incentive sensitisation/addiction | BUILT | `organism/affect.ts:58` |
| Neuromodulator drift | BUILT | `organism/affect.ts:50` |
| Withdrawal | BUILT | `organism/affect.ts:52` |
| Chronic organ disease | MISSING |  |

### 15. Ageing / senescence
Source: Kirkwood 1977 disposable soma

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Age as a state variable | MISSING |  |
| Damage accumulation with age | MISSING |  |
| Declining repair | MISSING |  |
| Heritable lifespan trade-off | MISSING |  |
| Telomere-like clock | MISSING |  |

### 16. Death
Source: Clinical death criteria

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Hypoglycaemic death | BUILT | `organism/organism.ts:622` |
| Muscle-wasting death | BUILT | `organism/organism.ts:622` M39 mDeath |
| Cause of death recorded | BUILT | `organism/organism.ts:371` |
| Death signalled to the dome (corpse) | PARTIAL | dome respawns; no corpse entity |
| Death by predation/injury | MISSING |  |

### 17. Decay / decomposition
Source: Carter et al. 2007

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Corpse persists and rots | MISSING |  |
| Nutrients returned to dome | MISSING |  |
| Scavenging | MISSING |  |
| Smell of death | MISSING |  |
| Ledger hand-off body→dome | MISSING |  |

### 18. Toxicity
Source: Hormesis: Calabrese 2008

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Toxin chemosense | PLANNED | DELARP §26 chemosense |
| World toxicity dial | PLANNED | DELARP §26 world-dial sense |
| Detox cost | MISSING |  |
| Hormesis | PLANNED | FREAK-100 #35 |
| Learned taste aversion | MISSING |  |

### 19. Viability monitoring
Source: Health index

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Runtime health monitor | BUILT | `organism/organism.ts:66` `Health` |
| Body state readable by SELF | BUILT | `organism/v40mods.ts:32` |
| Foresight of energy drop | BUILT | `organism/v40mods.ts:40` |
| Self-preservation priority | PARTIAL | caution scales curiosity only |
| Viability guard in tests | PLANNED | DELARP Part XV next |


## III. Sleep and rhythms

### 20. Circadian clock
Source: Moore & Eichler 1972 (SCN)

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| SCN light entrainment | BUILT | `organism/organism.ts:447` |
| SCN lesion | BUILT | `organism/organism.ts:447` |
| Cortisol/melatonin rhythm | BUILT | `organism/coupling.ts:10` |
| Learn rhythm from host load | PLANNED | DELARP §30 |
| Seasonal rhythm | MISSING |  |

### 21. Sleep
Source: Borbely 1982 two-process

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Process S (adenosine) and C | BUILT | `organism/organism.ts:455` |
| NE opposes sleep onset | BUILT | `organism/organism.ts:455` |
| Sleep stages gate senses | BUILT | `organism/organism.ts:491` |
| Sleep debt | BUILT | `organism/affect.ts:44` |
| Flip-flop switch (Eshkol) | BUILT | `organism/backends.ts:13` |

### 22. Dreaming
Source: Hobson; generative replay

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| NREM consolidation replay | BUILT | `organism/organism.ts:568` |
| REM dreamt beliefs write uncertainty | BUILT | `organism/organism.ts:632` |
| Awake ripples | BUILT | `organism/organism.ts:180` |
| Nightmares from fear | MISSING |  |
| Dream content observable | PARTIAL | replay counts only |

### 23. Synaptic downscaling
Source: Tononi & Cirelli 2014

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Sleep pruning of weak synapses | BUILT | `organism/organism.ts:642` |
| Hebbian re-sprouting | BUILT | `organism/organism.ts:642` |
| Global SHY downscaling | PLANNED | FREAK-100 #47 |
| Microglial pruning | PLANNED | FREAK-100 #46 |
| Glymphatic clearance | MISSING |  |

### 24. Ultradian / interval timing
Source: Buhusi & Meck 2005

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Time sense on bus | PLANNED | DELARP §26 time sense |
| Interval timers | MISSING |  |
| LTC time constants | BUILT | `organism/organism.ts:211` opt-in |
| Substrate timing jitter sense | BUILT | `organism/v40mods.ts:19` |
| Anticipation of feeding times | PARTIAL | glucose forecast only |


## IV. Body plan, motion, morphology

### 25. Body schema
Source: Head & Holmes 1911; Wolpert 1998

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Arm with efference copy | BUILT | `organism/organism.ts:110` |
| Learned forward model (NLMS) | BUILT | `organism/organism.ts:170` |
| Body-change retargeting (CQM04) | PLANNED | REARCHITECT Stage 2 |
| Full 3D body | MISSING |  |
| Body schema latent | PLANNED | REARCHITECT §3A |

### 26. Locomotion
Source: Grillner CPGs

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Movement between sites | PARTIAL | site choice; no kinematics |
| Central pattern generators | MISSING |  |
| Gait | MISSING |  |
| Motor energy cost | BUILT | `organism/coupling.ts:12` |
| Terrain/gravity effects | PLANNED | DELARP §26 world-dial |

### 27. Legs with their own brains
Source: Hochner 2012 octopus arms

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Per-leg ganglion | PLANNED | FREAK-100 #84 |
| Local reflex arcs | MISSING |  |
| Leg-central negotiation | MISSING |  |
| Leg learning | MISSING |  |
| Leg-level senses | MISSING |  |

### 28. Arms / manipulation
Source: Primate grasp

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Arm actuator | BUILT | `organism/organism.ts:110` |
| External pushes learned | BUILT | `organism/organism.ts:110` |
| Grasp/carry objects | MISSING |  |
| Tool use | MISSING |  |
| Alien arm morphology | MISSING |  |

### 29. Eyes / vision
Source: Land & Nilsson 2012 animal eyes

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Vision from own render (retina) | PLANNED | DELARP §26 |
| Visual sense lines (classic 16) | PARTIAL | sense lines abstract; `organism.ts:368` |
| Alien eye structure (compound/log-polar) | PLANNED | DELARP §26 fovea |
| Eye movements | MISSING |  |
| Light sense (dome light cycle) | BUILT | `lab/src/biosphere/dome.ts:16` |

### 30. Morphing / shape change
Source: Levin 2014 bioelectric

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Body shape variable | MISSING |  |
| Expand/contract | MISSING |  |
| Extend/shorten limbs | MISSING |  |
| Morphology as inference | PLANNED | FREAK-100 #100 |
| Cost of morphing | MISSING |  |

### 31. Mimicry / camouflage
Source: Hanlon 2007 cephalopods

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Skin pattern state | MISSING |  |
| Copy another creature | MISSING |  |
| Background matching | MISSING |  |
| Deceptive signals | MISSING |  |
| Learned mimicry value | MISSING |  |

### 32. Growth
Source: Allometry; West 2001

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Brain wiring grown from genome | BUILT | `organism/develop.ts:23` |
| Body mass growth | MISSING |  |
| Growth stages | MISSING |  |
| Allometric scaling | MISSING |  |
| Nutrient-limited growth | MISSING |  |

### 33. Skin / surface
Source: Integument

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Touch on shell/arm | PLANNED | DELARP §26 touch |
| Social touch contact | BUILT | `lab/src/biosphere/dome.ts:36` `meet` in dome loop |
| Colour/chromatophores | MISSING |  |
| Barrier vs infection | MISSING |  |
| Surface temperature | MISSING |  |


## V. Senses

### 34. Sensory bus
Source: Ernst & Banks 2002

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Many channels on one bus | BUILT | `organism/v40mods.ts:13` |
| Sparse random expansion | BUILT | `organism/v40mods.ts:22` |
| Predictive encoder surprise | BUILT | `organism/v40mods.ts:23` |
| Learned fusion gains | BUILT | `organism/v40mods.ts:25` |
| Evolvable sensorium | PLANNED | DELARP §27.5 |

### 35. Interoception
Source: Craig 2002; Seth 2013

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Intero channel on bus | BUILT | `organism/v40mods.ts:17` |
| Insula path | BUILT | `organism/organism.ts:477` |
| Visceral afferent lesion | BUILT | `organism/organism.ts:269` |
| Felt curvature into insula | BUILT | `organism/organism.ts:477` |
| Interoceptive precision | PLANNED | FREAK-100 #29 |

### 36. Chemosense / smell
Source: Gradient chemotaxis

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Food odour gradients | PLANNED | DELARP §26 |
| Pheromone field | PLANNED | DELARP §26 |
| Scent marks read by others | BUILT | `lab/src/biosphere/dome.ts:37` `readMarks` |
| Olfactory receptor diversity | MISSING |  |
| Taste | MISSING |  |

### 37. Hearing
Source: Cochlear filterbank

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Dome audio field | PLANNED | DELARP §26 |
| 32-band cochlea | PLANNED | DELARP §26 |
| Calls of others | PLANNED | DELARP §26 |
| Sonification exists (viewer) | PARTIAL | `src/app.tsx:154` audio is output, not a sense |
| Sound localisation | MISSING |  |

### 38. Touch / proprioception
Source: Proske & Gandevia 2012

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Contact touch with others | BUILT | `lab/src/biosphere/dome.ts:36` |
| Joint angles | PLANNED | DELARP §26 |
| Arm proprio via efference | BUILT | `organism/organism.ts:170` |
| Pressure map | MISSING |  |
| Vibration | MISSING |  |

### 39. EM / magnetic sense
Source: Wiltschko 2005 magnetoreception

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Magnetic-like heading field | BUILT | `organism/v40mods.ts:8` alien ch |
| Electric-like danger field | BUILT | `organism/v40mods.ts:8` |
| Others' spike E-fields | PLANNED | DELARP §26 |
| Electrolocation active sense | MISSING |  |
| Learned use of field | BUILT | `organism/v40mods.ts:25` via fusion gain |

### 40. Quantum sense
Source: Tsotchke Moonlab [A]

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Q3 click sense | BUILT | `organism/v40mods.ts:9` |
| QGT/Berry readout | BUILT | `organism/organism.ts:56` |
| Neuromod → qubit angles | BUILT | `organism/organism.ts:595` |
| Moonlab backend | BUILT | `organism/backends.ts:7` |
| Behavioural advantage shown | PLANNED | FREAK-100 #68 expected null |

### 41. Substrate senses
Source: DELARP §30

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| SubstrateTap synthetic/replay | BUILT | `organism/substrate.ts:8` |
| Live mode sandboxed | PARTIAL | downgraded to synthetic `organism/v40mods.ts:16` |
| GC/CPU/memory counters | PARTIAL | synthetic stats |
| Dome-internal counters | PLANNED | DELARP §30 |
| Shuffle control | BUILT | `organism/v40mods.ts:21` busShuffle |

### 42. Remote viewing (sim)
Source: Sci-fi sense, simulated

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Read another place's state at distance | MISSING |  |
| Noisy, costly channel | MISSING |  |
| Accuracy learned and validated | MISSING |  |
| Bandwidth limits | MISSING |  |
| Shuffle control vs chance | MISSING |  |

### 43. Wireless / 'psychic' link
Source: Sci-fi; modelled on volume transmission (Bargmann 2012)

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Broadcast field between creatures | PARTIAL | scent marks only `lab/src/biosphere/dome.ts:19` |
| Emotion contagion over field | MISSING |  |
| Shared-signal sync | PLANNED | DELARP §30 synchronise |
| Encoding learned, not hand-set | MISSING |  |
| Energy cost | MISSING |  |


## VI. Nervous system

### 44. Spiking cortex
Source: Izhikevich; Douglas & Martin

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| E/I spiking sheet | BUILT | `organism/organism.ts:28` |
| STDP | BUILT | `organism/organism.ts:274` |
| NMDA persistence | BUILT | `organism/organism.ts:274` |
| Topographic TC fan | BUILT | `organism/organism.ts:274` |
| Scale to 1e5 units | PLANNED | REARCHITECT Stage 2 |

### 45. Thalamus / gating
Source: Sherman & Guillery

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Sleep-stage gating | BUILT | `organism/organism.ts:491` |
| Attention gain | BUILT | `organism/organism.ts:145` |
| CT feedback lesion | BUILT | `organism/organism.ts:269` |
| Top-down prediction | BUILT | `organism/organism.ts:491` |
| Precision gate | PLANNED | REARCHITECT §3A |

### 46. Basal ganglia / action selection
Source: Redgrave et al. 1999

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Spiking striatal race | BUILT | `organism/organism.ts:553` |
| Three-factor value learning | BUILT | `organism/organism.ts:286` |
| RPE lesion | BUILT | `organism/organism.ts:566` |
| Free won't veto | BUILT | `organism/organism.ts:270` |
| Sub-brain auction | PLANNED | REARCHITECT §3B |

### 47. Hippocampus / memory
Source: O'Keefe; Wilson & McNaughton 1994

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Site cells | BUILT | `organism/organism.ts:286` |
| Episode replay | BUILT | `organism/organism.ts:180` |
| Place/grid maps | MISSING |  |
| Sequence buffer | PLANNED | REARCHITECT §3A |
| BTSP one-shot | PLANNED | FREAK-100 #49 |

### 48. Neuromodulation
Source: Doya 2002; Yu & Dayan 2005

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| DA/5HT/NE/ACh release | BUILT | `organism/coupling.ts:4` |
| NE lowers ignition | BUILT | `organism/organism.ts:133` |
| ACh/NE uncertainty | PARTIAL | FREAK #43 'already present'; partial |
| Neuropeptide mood bus | PLANNED | FREAK-100 #45 |
| Oxytocin-like social peptide | MISSING |  |

### 49. Nerve types
Source: Sherrington; fibre classes

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Excitatory/inhibitory classes | BUILT | `organism/organism.ts:28` |
| ENS neurons | BUILT | `organism/organism.ts:28` |
| Autonomic symp/para | BUILT | `organism/coupling.ts:5` |
| Sensory fibre types | MISSING |  |
| Gap junctions | PLANNED | FREAK-100 #95 |

### 50. Glia
Source: Araque 1999

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Astrocyte gate | PLANNED | FREAK-100 #39 |
| Astrocyte WM | PLANNED | FREAK-100 #40 |
| Lactate shuttle | PLANNED | FREAK-100 #38 |
| Microglia | PLANNED | FREAK-100 #46 |
| Myelin plasticity | PLANNED | FREAK-100 #94 |

### 51. Plasticity / learning
Source: Gerstner 2018

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| DA-gated STDP | BUILT | `organism/coupling.ts:6` |
| Volatility-scaled learning | BUILT | `organism/organism.ts:566` |
| Eligibility traces at scale | PLANNED | FREAK-100 #50 |
| Meta-learned rules (Eshkol) | PLANNED | FREAK-100 #48 |
| Consolidation cascade | PLANNED | FREAK-100 #54 |

### 52. Brain scale (100M)
Source: Dorkenwald et al. 2024 FlyWire (~140k neurons, ~5e7 synapses)

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Current scale ~thousands synapses | PARTIAL | 3470 synapses, DELARP Part XIV |
| GPU 100M net | PARTIAL | browser only, PE→LC `organism/coupling.ts:12` |
| Sparse expansion to 100M params | PLANNED | DELARP §27.1 |
| Brains-of-brains wrapper | PLANNED | REARCHITECT Stage 3 |
| Connectome growth to 1e8 | MISSING |  |

### 53. Distributed brains
Source: Hochner 2012; Furness ENS

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| ENS as second brain | BUILT | `organism/organism.ts:470` |
| Leg ganglia | PLANNED | FREAK-100 #84 |
| Two-hemisphere consensus | PLANNED | FREAK-100 #82 |
| Column voting | PLANNED | FREAK-100 #80 |
| Organ brains (heart, gut) | PARTIAL | ENS only |


## VII. Mind and cognition

### 54. Prediction / world model
Source: Rao & Ballard 1999; Friston 2005

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Next-sense predictor | BUILT | `organism/coupling.ts:16` |
| Bus predictive encoder | BUILT | `organism/v40mods.ts:23` |
| Single generative model M | PLANNED | REARCHITECT §3A |
| Hierarchical PC | PLANNED | FREAK-100 #23 |
| VSA latents | PLANNED | FREAK-100 #2 |

### 55. Global workspace
Source: Dehaene & Changeux 2011

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Ignition threshold | BUILT | `organism/organism.ts:133` |
| Broadcast to HIP | BUILT | `organism/organism.ts:491` |
| Ignition cost | BUILT | `organism/coupling.ts:14` |
| Unconscious reservoir | PLANNED | FREAK-100 #81 |
| Recurrent workspace | PLANNED | DELARP §3.3 |

### 56. Attention
Source: Desimone & Duncan 1995

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| State-dependent attention | BUILT | `organism/organism.ts:145` |
| Attention as precision | PLANNED | DELARP §27.4 |
| Attention schema learned | PLANNED | DELARP §3.3 |
| Onset salience | BUILT | `organism/organism.ts:125` |
| Covert vs overt | MISSING |  |

### 57. Metacognition
Source: Fleming & Daw 2017

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| HOT monitor | BUILT | `organism/organism.ts:151` |
| Confidence from curvature | BUILT | `organism/v40mods.ts:53` |
| Opt-out behaviour | MISSING |  |
| Precision as confidence | PLANNED | FREAK-100 #24 |
| Calibrated bids | PLANNED | REARCHITECT §3B |

### 58. Decision making
Source: Drift-diffusion; Thompson sampling

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Value + uncertainty bonus | BUILT | `organism/organism.ts:666` |
| Posterior sampling | BUILT | `organism/organism.ts:263` |
| Quantum noise source | BUILT | `organism/organism.ts:595` |
| EFE planning | PLANNED | REARCHITECT Stage 1 |
| Risk sensitivity | BUILT | `organism/affect.ts:64` |

### 59. Curiosity / exploration
Source: Aston-Jones & Cohen 2005

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Uncertainty drive | BUILT | `organism/organism.ts:666` |
| Mood/boldness gate | BUILT | `organism/affect.ts:70` |
| Lévy flights | PLANNED | FREAK-100 #70 |
| Chaotic itinerancy | PLANNED | FREAK-100 #73 |
| Info gain (AINF-H) | PLANNED | REARCHITECT §2.3 |

### 60. Self-model
Source: Metzinger; DELARP §31

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| SELF recurrent state | BUILT | `organism/v40mods.ts:32` |
| Predicts body | BUILT | `organism/v40mods.ts:38` |
| Caution from foresight | BUILT | `organism/v40mods.ts:40` |
| Self/other distinction | MISSING |  |
| Persistent narrative self | MISSING |  |

### 61. Simulation insight / Neo
Source: DELARP Parts VIII, X

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| SIM artefact belief | BUILT | `organism/v40mods.ts:39` |
| Down-weights learning | BUILT | `organism/v40mods.ts:41` |
| Legal hooks (shade, mark) | BUILT | `organism/v40mods.ts:61` |
| Dome sandbox | BUILT | `lab/src/biosphere/dome.ts:20` |
| Hidden-cause typing (6 causes) | PLANNED | DELARP §38.2 |

### 62. Thought geometry
Source: DELARP Part IX

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Curvature κ | BUILT | `organism/v40mods.ts:49` |
| Felt κ | BUILT | `organism/v40mods.ts:54` |
| Learned manifold metric | PLANNED | DELARP §35.1 |
| Geodesic deviation | PLANNED | DELARP §35.3 |
| QGT cross-link | PLANNED | DELARP §35.4 |

### 63. Imagination / creativity
Source: Thaler 1997

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| REM recombination | BUILT | `organism/organism.ts:632` |
| Creativity machine | PLANNED | FREAK-100 #76 |
| Planning by simulation | MISSING |  |
| Novel behaviour generation | MISSING |  |
| Play | MISSING |  |

### 64. Associative learning
Source: Bronfman et al. 2016 UAL

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Site value learning | BUILT | `organism/organism.ts:566` |
| Feature model (colour/shape) | BUILT | `organism/organism.ts:286` |
| Trace conditioning | PLANNED | REARCHITECT §1 UAL |
| Second-order conditioning | PLANNED | REARCHITECT §1 |
| Compositional binding | PLANNED | FREAK-100 #1-2 |

### 65. Working memory
Source: Goldman-Rakic

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| NMDA persistence | BUILT | `organism/organism.ts:274` |
| Slow current lesion | BUILT | `organism/organism.ts:269` |
| Theta-gamma code | PLANNED | FREAK-100 #5 |
| Capacity limit measured | MISSING |  |
| Astrocyte integrator | PLANNED | FREAK-100 #40 |

### 66. Agency
Source: Haggard 2017

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Action→outcome model | BUILT | `organism/organism.ts:170` arm forward model |
| AE1 paired test | PLANNED | REARCHITECT §2.3 |
| Free won't | BUILT | `organism/organism.ts:270` |
| Sense of agency readout | MISSING |  |
| Intentional binding | MISSING |  |

### 67. Language-free communication
Source: Tokenless signals

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Scent marks | BUILT | `lab/src/biosphere/dome.ts:19` |
| Calls/sound | PLANNED | DELARP §26 |
| Signal meaning learned | MISSING |  |
| Honest vs deceptive signals | MISSING |  |
| Dialect drift | MISSING |  |

### 68. Spatial cognition
Source: Tolman 1948

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Site map (16 sites) | BUILT | `organism/organism.ts:368` |
| Path integration | MISSING |  |
| Cognitive map | MISSING |  |
| TEM-like structure | PLANNED | FREAK-100 #90 |
| Landmarks | MISSING |  |


## VIII. Affect

### 69. Emotions
Source: Panksepp 1998; Anderson & Adolphs 2014

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Fear | BUILT | `organism/affect.ts:29` |
| Delight | BUILT | `organism/affect.ts:56` |
| Frustration | BUILT | `organism/affect.ts:56` |
| Calm | BUILT | `organism/affect.ts:30` |
| Disgust, anger, grief, play, care | MISSING |  |

### 70. Mood
Source: Russell 1980 circumplex

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Valence/arousal fast | BUILT | `organism/affect.ts:34` |
| Slow baselines | BUILT | `organism/affect.ts:35` |
| Mood swings | BUILT | `organism/affect.ts:36` |
| Mood scales curiosity | BUILT | `organism/affect.ts:70` |
| Mood from microbiome | PLANNED | FREAK-100 #98 |

### 71. Feelings (felt body)
Source: Damasio 1999

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Felt curvature | BUILT | `organism/v40mods.ts:54` |
| Felt valence of contact | BUILT | `organism/affect.ts:68` |
| Interoceptive feeling map | PARTIAL | insula inputs only |
| Feeling reports/readouts | BUILT | `organism/affect.ts:76` `state()` |
| Hunger felt as error | PLANNED | FREAK-100 #25 |

### 72. Motivation / wanting
Source: Berridge & Robinson 1998

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Wanting | BUILT | `organism/affect.ts:59` |
| Liking tolerance | BUILT | `organism/affect.ts:59` |
| Orexin/arousal | BUILT | `organism/organism.ts:219` orxK |
| Goal hierarchy | MISSING |  |
| Craving | BUILT | `organism/affect.ts:52` |

### 73. Personality
Source: Réale et al. 2007

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Bold/curious/reactive/vuln | BUILT | `organism/affect.ts:23` |
| Lifetime drift | BUILT | `organism/affect.ts:37` |
| Heritable | BUILT | `organism/affect.ts:22` |
| Birth temperament (quantum) | BUILT | `organism/organism.ts:636` |
| Bet-hedging | BUILT | `organism/affect.ts:21` |

### 74. Stress response
Source: Sapolsky

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Cortisol | BUILT | `organism/affect.ts:40` |
| Sympathetic arousal | BUILT | `organism/coupling.ts:7` |
| Freeze | BUILT | `organism/affect.ts:72` |
| Fight/flight action | MISSING |  |
| Coping strategies | MISSING |  |

### 75. Attitudes
Source: Associative valuation

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Per-option attitude | BUILT | `organism/affect.ts:57` |
| DA-gated learning | BUILT | `organism/affect.ts:57` |
| Toward others | BUILT | `organism/affect.ts:62` |
| Approach/avoid stance | BUILT | `organism/affect.ts:66` |
| Attitude revision by evidence | PARTIAL | EMA only |

### 76. Reward system
Source: Schultz 1997

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| RPE | BUILT | `organism/organism.ts:566` |
| DA burst from behaviour | BUILT | `organism/coupling.ts:12` |
| Tonic DA temperature | BUILT | `organism/organism.ts:147` |
| Reward from social | MISSING |  |
| Reward from novelty itself | PARTIAL | via uncertainty bonus |


## IX. Life cycle and heredity

### 77. Reproduction
Source: Smith & Fretwell 1974

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Births in dome | BUILT | `lab/src/biosphere/dome.ts:33` |
| Energy-gated birth decision by organism | PLANNED | REARCHITECT §2.2 C03R-organism |
| Maternal provisioning | PLANNED | FREAK-100 #62 |
| Density-dependent fecundity | PLANNED | FREAK-100 #61 |
| Sexual recombination | MISSING |  |

### 78. Heredity / genome
Source: Zador 2019

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Developmental genome | BUILT | `organism/develop.ts:17` |
| Personality genes | BUILT | `organism/affect.ts:20` |
| Behaviour genes | BUILT | `organism/organism.ts:271` |
| Genome bottleneck | PLANNED | FREAK-100 #64 |
| GRN | PLANNED | FREAK-100 #59 |

### 79. Mutation
Source: Drake 1998

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Genome mutation | BUILT | `organism/develop.ts:19` |
| Personality mutation | BUILT | `organism/affect.ts:22` |
| Mutation rate evolvable | PARTIAL | hedge widens scatter |
| Structural mutation (add sense/organ) | PLANNED | DELARP §27.5 |
| Quantum-sourced mutation | MISSING |  |

### 80. Development / ontogeny
Source: Wolpert 'Principles of Development'

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Neural wiring growth | BUILT | `organism/develop.ts:23` |
| Over-produce then prune | BUILT | `organism/organism.ts:642` |
| Developmental waves | BUILT | `organism/organism.ts:274` |
| Body development | MISSING |  |
| Critical periods | MISSING |  |

### 81. Evolution / selection
Source: Darwin; Hinton & Nowlan 1987

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Survival-only selection | BUILT | `lab/src/biosphere/dome.ts:33` respawn from living kin |
| Lineage tracking | PARTIAL | births counter |
| Baldwin effect | PLANNED | FREAK-100 #60 |
| Speciation | MISSING |  |
| Neutral-drift baseline | PLANNED | DELARP §19.4 |

### 82. Epigenetics
Source: Heijmans et al. 2008

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Parental starvation memory | PLANNED | FREAK-100 #67 |
| Methylation-like switches | MISSING |  |
| Stress-driven expression | PLANNED | FREAK-100 #35 |
| Transgenerational effects | MISSING |  |
| Reversibility | MISSING |  |

### 83. Parenting / nurture
Source: Clutton-Brock 1991

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Feeding young | MISSING |  |
| Protecting young | MISSING |  |
| Teaching | MISSING |  |
| Parent-offspring conflict | MISSING |  |
| Recognition of own young | MISSING |  |

### 84. Raising young / juvenile
Source: Life-history theory

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Juvenile stage | MISSING |  |
| Dependency period | MISSING |  |
| Play learning | MISSING |  |
| Weaning | MISSING |  |
| Juvenile mortality | MISSING |  |

### 85. Harvesting / resource use
Source: Optimal foraging; Charnov 1976

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Forage from sites | BUILT | `organism/organism.ts:558` |
| Shared ecological pool | BUILT | `organism/organism.ts:271` |
| Site depletion | BUILT | `organism/organism.ts:368` `depl` |
| Storing/caching food | MISSING |  |
| Cultivation | MISSING |  |


## X. Social and ecological life

### 86. Social life
Source: Hamilton 1964; Dunbar

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Contact and meet | BUILT | `lab/src/adapters/c001.ts:66` |
| Neighbour approach/avoid | PARTIAL | DELARP Part XII; dome-side |
| Kin recognition | PARTIAL | dome picks kin parent |
| Cooperation | MISSING |  |
| Hierarchy/dominance | MISSING |  |

### 87. Communication
Source: Bradbury & Vehrencamp

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Marks | BUILT | `lab/src/biosphere/dome.ts:19` |
| Calls | PLANNED | DELARP §26 |
| Emotional display | MISSING |  |
| Alarm signals | MISSING |  |
| Mimetic signals | MISSING |  |

### 88. Competition
Source: Lotka-Volterra

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Shared food pool | BUILT | `organism/organism.ts:558` |
| Fights / damage | MISSING |  |
| Territory | MISSING |  |
| Resource defence | MISSING |  |
| Interference | MISSING |  |

### 89. Predation / prey
Source: Lima & Dill 1990

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Danger field | BUILT | `organism/v40mods.ts:8` |
| Predators in dome | MISSING |  |
| Escape behaviour | PLANNED | DELARP Part XIV 'grown approach/escape circuit' |
| Hunting | MISSING |  |
| Arms race | MISSING |  |

### 90. Ecology / niche
Source: Hutchinson 1957

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Neutral dome | BUILT | `lab/src/biosphere/dome.ts:26` |
| Light cycle | BUILT | `lab/src/biosphere/dome.ts:16` |
| World dials | PLANNED | DELARP §26 |
| Niche construction (marks) | PARTIAL | marks only |
| Population dynamics | PLANNED | DELARP Part XII runs |

### 91. Culture / social learning
Source: Laland 2004

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Observational learning | MISSING |  |
| Copying others' choices | PARTIAL | marks bias value `lab/src/biosphere/dome.ts:37` |
| Traditions | MISSING |  |
| Innovation spread | MISSING |  |
| Teaching | MISSING |  |

### 92. Empathy / contagion
Source: de Waal 2008

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Feel others' state | MISSING |  |
| Emotional contagion | MISSING |  |
| Helping | MISSING |  |
| Consolation | MISSING |  |
| Shared affect fields | MISSING |  |

### 93. Mating / sexual selection
Source: Andersson 1994

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Sexes | MISSING |  |
| Courtship | MISSING |  |
| Mate choice | MISSING |  |
| Display traits | MISSING |  |
| Recombination | MISSING |  |

### 94. Group / swarm
Source: Couzin 2002

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Collective motion | MISSING |  |
| Group decisions | MISSING |  |
| Synchrony via substrate | PLANNED | DELARP §30 |
| Division of labour | MISSING |  |
| Superorganism | MISSING |  |


## XI. Alien and integrative

### 95. Causal interconnection
Source: Nothing cosmetic rule

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Coupling graph of parts | BUILT | `organism/coupling.ts:3` |
| Every v4.0 module lesionable | BUILT | `organism/organism.ts:270` |
| C-NC conformance check | PLANNED | DELARP §10.4 |
| Lesion → metric change measured | PARTIAL | n=1 smoke, DELARP Part XV |
| No fixed-weight helpers audit | PLANNED | REARCHITECT §2.3 |

### 96. Chance / chaos
Source: DELARP §17

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| QRNG/quantum entropy | BUILT | `organism/organism.ts:263` |
| Seeded reproducibility | BUILT | `organism/organism.ts:12` |
| Snapshot/restore | BUILT | `organism/organism.ts:431` |
| Criticality homeostasis | PLANNED | FREAK-100 #96 |
| Drift baselines | PLANNED | DELARP §19.4 |

### 97. Alien biology
Source: Sci-fi grounded in real mechanisms

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Alien senses | BUILT | `organism/v40mods.ts:8` |
| Quantum layer organ | BUILT | `organism/organism.ts:361` |
| Alien eyes/arms/body plan | MISSING |  |
| Novel organ evolution | MISSING |  |
| Non-carbon metabolism analogue | MISSING |  |

### 98. Expansion / contraction
Source: Hydrostatic skeletons

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Volume state | MISSING |  |
| Inflate to deter | MISSING |  |
| Squeeze through gaps | MISSING |  |
| Energy/pressure cost | MISSING |  |
| Sensed size | MISSING |  |

### 99. Rule bending (Neo)
Source: DELARP Part X

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Anomaly detection | BUILT | `organism/v40mods.ts:39` |
| Hook value learning | BUILT | `organism/v40mods.ts:65` |
| Rate-limited sandbox | BUILT | `lab/src/biosphere/dome.ts:20` |
| Audit log | PARTIAL | grant/deny counts only |
| Predict interventions | PLANNED | DELARP §38.2 |

### 100. Lab method / reproducibility
Source: Preregistration

| Attribute | Status | Evidence / plan ref |
|---|---|---|
| Frozen preregs | BUILT | `preregistrations/` (frozen prereg files) |
| Bit-exact replay | BUILT | `organism/organism.ts:431` |
| Dev/test seed split | PLANNED | DELARP §5 |
| CI pipeline | PLANNED | DELARP §10.1-2 |
| Paired 64-seed pools | PLANNED | REARCHITECT Stage 0 |

## The 10 biggest gaps
Ranked by how much of Alex's vision each one blocks and how many other areas depend on it.
1. **No physical body plan or morphology.** No 3D body, shape, size, volume or skin state, so morphing, expand/contract, extend/shorten, mimicry, camouflage and body growth (areas 25–33, 98) have nothing to act on. Everything else in group IV depends on this.
2. **Legs with their own brains.** Only FREAK-100 #84 (octopus arm ganglia, Hochner 2012). No limbs, CPGs, local reflexes or leg-central negotiation.
3. **Reproduction lives in the dome, not the organism.** Births are dome respawns from living kin (`lab/src/biosphere/dome.ts:33`). There is no energy-gated mating decision, no sexes or recombination, no gestation or provisioning (REARCHITECT §2.2 plans only the energy-gated decision).
4. **No parenting, juveniles or raising young.** All 10 attributes of areas 83–84 are MISSING; there is no juvenile stage, no dependency and no care.
5. **No ageing or life history.** There is no age variable, senescence or growth-vs-reproduction trade-off, so death is only by starvation or wasting (`organism/organism.ts:622`).
6. **Death leaves nothing behind.** No corpse, decay, nutrient return or scavenging (area 17 is fully MISSING), so there is no closed nutrient cycle in the dome.
7. **Brain scale.** About 3.5k synapses today (DELARP Part XIV) against the 10^8 target. The GPU net runs only in the browser and only feeds prediction error to LC. The planned path is the sparse expansion layer (DELARP §27.1), then 10^5 units on Eshkol (REARCHITECT Stage 2), then brains of brains (Stage 3). Nothing plans connectome growth past 10^5.
8. **Remote viewing and a wireless/"psychic" link.** Remote viewing is fully MISSING. The only creature-to-creature channel is scent marks (`dome.ts:19`). There is no field for broadcasting emotion or state, and no costed, noisy, shuffle-controlled channel.
9. **Thin social, ecological life.** No predators, fights, territory, cooperation, empathy, culture or mate choice. Attitudes toward others exist (`organism/affect.ts:62`), but there is almost nothing to have attitudes *about*.
10. **Narrow emotion and nerve repertoire, and unbuilt senses.** Four emotions only (no disgust, anger, grief, care or play), no sensory fibre types, no oxytocin-like peptide. Vision, hearing, chemosense and joint proprioception are all only planned (DELARP §26). The 16 classic sense lines are abstract.

Also note: respiration/oxygen (area 7) and ageing (area 15) are fully MISSING, and the "nothing cosmetic" rule has a coupling graph but no C-NC lesion check yet (DELARP §10.4).

## Proposed build order (iterate → freeze → test → lock in)
Each stage follows the lab method: **iterate** on dev seeds 2000–2031 (two-block rule); **freeze** parameters and a preregistration commit before any test seed; **test** on fresh seeds against lesion and non-mechanistic controls (d ≥ 0.8, t ≥ 2.75; paired 64-seed pools where REARCHITECT §2.3 asks for them); **lock in** with a viability guard, a no-lost-pass regression run, the bit-exact `ORG_MIND=v39` reproduction check and a C-NC lesion check showing every new part moves a metric. A stage that loses more than one earlier pass is reverted, not tuned around.

| Stage | Contents (area numbers) | Depends on | Lock-in evidence |
|---|---|---|---|
| **S0 Battery + hygiene** | REARCHITECT Stage 0 (AINF-H, C16R forecast-only lesion, C03R-organism, paired pools); C-NC check (DELARP §10.4); CI pipeline (§10.1–2); age variable stub | none | CI green, prereg v6 frozen |
| **S1 Core world model** | REARCHITECT Stage 1 PWM: precision economy, EFE action, interoceptive forecast that actually drives action (8, 9, 54, 58, 59, 66) | S0 | AE1, CQM10 + C16R both blocks, HOT3RM stable |
| **S2 Body plan v1** | Physical body: volume, shape, skin state, limbs as actuators with a muscle cost; body schema latent and CQM04 retargeting (25, 26, 28, 32, 33, 98); respiration/oxygen pool (7); localised injury (10) | S1 | body-change retarget test; ledger still closes |
| **S3 Distributed nervous system** | Leg ganglia with local CPG/reflex and own plasticity, negotiating with the central brain (27, 53); sensory fibre types (49); glia gate (50); heart/gut organ brains | S2 | lesion one leg brain → gait/foraging change vs matched control |
| **S4 Sensorium** | DELARP §26/§29 order: chemosense, touch/proprio, hearing, vision from render; evolvable sensorium with per-sense cost (29, 34, 36–38) | S1, S2 | bus fusion vs shuffled channels |
| **S5 Shape abilities** | Morph, expand/contract, extend/shorten, mimicry/camouflage, all costed in ATP and valued by the world model (30, 31, 98) | S2, S4 | mimicry/morph use rises when it pays (dose–response vs random-morph control) |
| **S6 Life cycle** | Organism-side reproduction decision, sexes/recombination, maternal provisioning, juvenile stage, parenting, ageing/senescence, life-history genes, corpse + decay + nutrient return (15–17, 77, 80, 83, 84, 93) | S1, S2 | population dev runs: births track stored energy; neutral-drift baseline |
| **S7 Affect + social breadth** | More emotions (disgust, anger, grief, care, play), oxytocin-like peptide, emotional contagion, cooperation, competition/fights, predators, communication by calls (69, 86–89, 92) | S4, S6 | social lesions change group outcomes vs shuffled partners |
| **S8 Alien links** | Wireless state field and remote viewing as costed, noisy dome channels; hidden-cause Neo model (6 causes); learned manifold geometry (42, 43, 61, 62) | S4, S7 | above-chance use vs shuffle/random-channel controls; no host access (sandbox audit) |
| **S9 Scale** | Sparse expansion → 10^5 units (REARCHITECT Stage 2) → brains-of-brains auction (Stage 3) → GPU 10^8 parameters wired in-organism; outer-loop evolution of plasticity rules (51–53) | all | full battery re-run at fixed protocol; no lost passes at scale |

Stages S2–S5 and S6–S7 can iterate in parallel branches but are frozen and locked in one at a time, so a regression can be traced to one stage.

## Is this in the DevOps pipeline?
Not yet. DELARP §10 proposes CI (`harness.yml` conformance + organism smoke + reproducibility hash), a `pipeline/` queue/score layer and a prereg template. §11 lists these as awaiting approval. LIFE-100 itself is a document and is not wired into any pipeline. Stage S0 above is where it would enter.
