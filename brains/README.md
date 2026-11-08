# Ported Multiverse Brains Repository (`brains/`)

> **License Notice:** Download and Personal Use Only. Commercial use, modification, editing, derivative works, or claiming ownership are strictly prohibited. See [`/LICENSE`](../LICENSE).

This directory contains the **607 line-for-line fork-ported source files, empirical connectome datasets, and Zig 0.17.0 WebAssembly binaries** from the four sibling Artificial Life (A-Life) and Quantum Neural Manifold repositories, hard-wired at **60Hz** into Gigachad Browser via [`systems/ported-multiverse-brains.js`](../systems/ported-multiverse-brains.js) and [`systems/alife-25-bleeding-edge-models.js`](../systems/alife-25-bleeding-edge-models.js).

---

## 1. Directory Topology (`607` Files)

| Subdirectory | Source Repository | Files | Primary Artifacts & Neural Engines |
| :--- | :--- | :---: | :--- |
| [`brains/asmodensius-v40/`](./asmodensius-v40/) | `Asmodensius-v40` | `236` | Creature `#001` (`creatures/001/organism/organism.ts`, `affect.ts`, `develop.ts`, `v40mods.ts`), Larkum 2-Compartment Pyramidal NMDA Sheet, TRN Global Workspace Ignition, Hypothalamic AgRP/POMC Allostasis, 3-Qubit `Q3` Fubini-Study `QGT`, `RLS`, Kalman Attention Schema, and Empirical *C. elegans* 302-Neuron / 7,379-Synapse Connectome (`celegans_herm_full_edgelist.csv`). |
| [`brains/cqm-xylos/`](./cqm-xylos/) | `Cosmogonic Quantum Mechalogodrom` | `362` | Zig 0.17.0 Native WebAssembly Kernel (`cqm_kernels.wasm`, `root.zig`, `build.zig` with 18 exports), `super-mind.ts`, `apex-brain.ts` (11 Incompatible Organs), `xenomimic-brain.ts` (Crank-Nicolson 1D Schrödinger PDE), `xylos-mind.ts` (48-Foci Manifold), `mechalogodrom-brain.ts` (10 Shell-Geometry Sub-Brains), `glyph-brain.ts` (25K Fast-Weight Pantheon), `thaler-sentience.ts` (DABUS + Cusp Catastrophe $\Xi$), `graph-mind.ts`, `tree-creature-brain.ts`, `bible.html`, `specs.html`, `docs.html`. |
| [`brains/glitchling/`](./glitchling/) | `glitchling-jam` | `6` | `glitchling.ts`, `brain.ts`, `BRAINS.md`, `index.html`, `verify.mjs` — 4-Flaw Somatic/Cognitive Perturbation (`scramble`, `leaky`, `backwards`, `misfire`), Marr-Albus Cerebellar Forward-Inverse Motor Un-Mirroring, Gated-DeltaNet Fast Weights, and Bernoulli Stochastic `Int8` Rounding. |
| [`brains/dimension-omega-singularity/`](./dimension-omega-singularity/) | `dimension-omega-singularity` | `2` | `index.html`, `README.md` — Standalone 3D Raymarched Riemannian Quantum Geometric Singularity Manifold ($g_{\mu\nu}$, Fubini-Study Metric, Berry Curvature $\Omega_{\mu\nu}$, Geodesic Flow). |
| [`brains/quantum_neural_manifold_3d.html`](./quantum_neural_manifold_3d.html) | `quantum_neural_manifold_3d.html` | `1` | Standalone Interactive 3D Quantum Neural Manifold Portal launched via `openHybridPortalTab('manifold3d')`. |

---

## 2. How Every Ported Brain Is Hard-Wired & Trained Online at 60Hz

In the original sibling repositories, several experimental modules noted in their internal audit logs that certain weights were initialized randomly and held static (`apex-brain.ts` Audits `#104, #106, #107, #108`, `mechalogodrom-brain.ts` Audits `#120, #121`, `thaler-sentience.ts` Audit `#179`, `xenomimic-brain.ts` Audit `#181`, `xylos-mind.ts` Audit `#185`, `glyph-brain.ts` Audit `#187`).

In [`systems/ported-multiverse-brains.js`](../systems/ported-multiverse-brains.js), **100% of those historical audit items are resolved** so that all 10 brains train online every `16.67 ms` (`60 Hz`) over the **7-Tier Heterogeneous Precision Tensor Arena (`Heterogeneous7TierPrecisionArena`)**:

1. **Brain 1 (`AsmodensiusCreature001FullBrain`):** Online `Float64Array` Recursive Least Squares (`RLS`) covariance $P_t$ update, online `Q3` Fubini-Study natural gradient, online Kalman innovation variance matching, and Payeur et al. (2021) burst-gated apical-basal mismatch plasticity.
2. **Brain 2 (`GlitchlingResilienceCerbellarBrain`):** Online Marr-Albus cerebellar climbing-fiber LMS calibration (un-mirroring the `backwards` motor inversion flaw), Gated-DeltaNet fast-weight rule $S_t = \alpha S_{t-1} - \beta(S_{t-1}k_t - v_t)k_t^\top$, and Bernoulli **Stochastic `Int8` Rounding** (`stochasticRoundInt8`) so sub-LSB plasticity updates never vanish.
3. **Brain 3 (`CqmSuperMind5StageEngine`):** Full 5-stage `PERCEIVE -> IMAGINE -> REASON -> FEEL -> ACT` cycle with Eshkol reverse-mode AD tape updating the 30 `AoT` organ-nets online.
4. **Brain 4 (`ApexHydra11OrganEngine`):** All 11 incompatible organs (`PrimeSieveLoom`, `AcousticMeatDrum`, `EntropicNecroMatrix`, `KleinBottleCortex`, `PendulumHive`, `SlimeMoldHydra`, `ChronoWraith`, `QuantumTunnelLattice`, `ThermodynamicEngine`, `CancerousOuroboros`, `MetaParadox`) compute live tangent-map Chirikov Lyapunov exponents $\lambda_1$, live Gödel fixed-point contraction residuals, and online readout plasticity.
5. **Brain 5 (`XenomimicSchrodingerEntangledBrain`):** Exact norm-conserving 1D Schrödinger wavepacket evolution in `Float64Array` coupled with online backpropagation across the 101-parameter `6 -> 8 -> 5` MLP and double-well `mimicBasin` tilting.
6. **Brain 6 (`XylosRecurrentManifold48Brain`):** 48 foci and 192 directed plastic edges with Eshkol Global Workspace Theory (GWT) softmax broadcast and online precision-weighted residual slope/intercept calibration.
7. **Brain 7 (`Mechalogodrom10ShellTitanBrain`):** 10 differential-geometry shell invariants (Möbius torsion, Gauss-Bonnet defect, Rhumb bearing, Kakeya needle efficiency, Collatz stopping time, Hopf dispersion, Clifford torus inflation, Enneper minimal surface, Aizawa attractor radius, Weierstrass fractal variation) coupled with Bi-Poo exponential STDP.
8. **Brain 8 (`GlyphPantheon25KFastWeightBrain`):** 25,000-parameter Pantheon architecture with a `32×32` (`1,024`-entry) IEEE-754 `FP16` (`Uint16Array`) Oja-normalized Hebbian fast-weight overlay.
9. **Brain 9 (`ThalerDabusCreativityCatastropheBrain`):** US Patent `5,659,666` & `7,454,388` noise-perturbed autoassociative ideation net + Hot-Button affective valence critic governed by the Thom-Zeeman Cusp Catastrophe differential equation $d\Xi/dt = -(4\Xi^3 + 2\alpha\Xi + \beta)$.
10. **Brain 10 (`GraphMindCelegansCrystalTreeBrain`):** Empirical *C. elegans* 302-neuron / 7,379-synapse connectome (6,393 directed chemical synapses + 986 symmetric electrical gap junctions) coupled with Louvain modularity $Q$ and bitwise `goapPlan` Goal-Oriented Action Planning.
