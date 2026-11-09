# GIGACHAD Browser — Autonomous Research and Embodied Neural Runtime

> **⚠️ LICENSE NOTICE — PROPRIETARY DOWNLOAD-AND-USE-ONLY LICENSE (ALL RIGHTS RESERVED)**
> Governed by [`LICENSE`](LICENSE) and [`NOTICE.md`](NOTICE.md).
> **GIGACHAD BROWSER is made available for personal download and local execution ONLY.**
> **Commercial use, modification, editing, derivative works, redistribution of modified copies, or claiming authorship/ownership as your own are STRICTLY PROHIBITED.**

An Electron 45.2.3 browser for Windows 11 with a visible creature in both split panes, local numerical controllers, measured learning updates, adaptive page exploration, optional configured language-model research, and managed Tor transport. Tabs use sandboxed `<webview>` guests; a Python sidecar serves optional page tools. Rendering, model updates, research, training and persistence have separate bounded schedules.

The runtime connects fourteen compact brain adapters, the original Asmodensius organism, a local cortex/connectome, simulated organs and mixed-precision numerical state. Historical names such as “superintelligence,” “soul,” “omniscience” and “Deity” label controls or simulations; they are not demonstrated consciousness, general intelligence, physical quantum computation or biological equivalence. Allocated parameter counts, running counters and checklist totals are not independent quality benchmarks. The configured language model supplies proposals; browsing does not fine-tune its weights.

See the [November 9 release record](docs/RELEASE_2026-11-09.md), [complete capability trace](docs/ALIVE_ENGINEERING_PLAN_2026-11-09.md), [runtime contract](docs/ALIVE_OVERDRIVE.md), and [exact primary-state startup](docs/ALIVE_PRIMARY_STATE_STARTUP.md) for implemented behavior, validation and remaining scope. Full-model persistence and the eight proposed Humunculus research gates remain unqualified.

### Flagship Documentation & Audit Suite
- 👉 **[`BIBLE.md`](BIBLE.md)** & **[`GLOSSARY.md`](GLOSSARY.md)** & **[`INDEX.md`](INDEX.md)** — Master Bible, Glossary, Index & Notations
- 👉 **[`docs/DSA_AND_MATHEMATICAL_NOTATIONS.md`](docs/DSA_AND_MATHEMATICAL_NOTATIONS.md)** — 7-Tier Precision Arena, DSA Complexity Bounds & Differential Equations
- 👉 **[`docs/OWASP_DEVSECOPS_FORTUNE100.md`](docs/OWASP_DEVSECOPS_FORTUNE100.md)** — OWASP Top 10, ASVS L3, Electron Sandbox & DevSecOps Architecture
- 👉 **[`docs/SYSTEMS_ENGINEERING_ERM_ERD_ERP.md`](docs/SYSTEMS_ENGINEERING_ERM_ERD_ERP.md)** — 12-Entity ERD, 12-Risk ERM (`Grade A`), ERP & Kanban PM
- 👉 **[`docs/CONTRAST_COMPARATIVE_AND_FORENSIC_AUDIT.md`](docs/CONTRAST_COMPARATIVE_AND_FORENSIC_AUDIT.md)** — Contrast Comparative Analysis & 25-Pass × 10-Iteration (`500/500`) Forensic Audit
- 👉 **[`ISSUES.md`](ISSUES.md)** & **[`KANBAN.md`](KANBAN.md)** — Verified Cross-Brain Bug Fixes (`ISS-01`–`ISS-15`) & Bible Kanban
- 👉 **[`brains/README.md`](brains/README.md)** — Master Index of all Line-for-Line Ported Sibling Brain Repositories

---

## Core Architectural Pillars

### 1. 7-Tier Heterogeneous Precision Tensor Arena (Beyond `Float32Array`)
Implemented in [`systems/ported-multiverse-brains.js`](systems/ported-multiverse-brains.js) (`Heterogeneous7TierPrecisionArena`, `131,072`-byte fixed `ArrayBuffer`) and [`systems/alife-25-bleeding-edge-models.js`](systems/alife-25-bleeding-edge-models.js) (`multiPrecisionBuffer64K`, `65,536`-byte `ArrayBuffer`). These renderer-owned buffers retain their typed-view offsets and aliases; worker messages carry separately validated values:
1. **`Float64Array` (`f64`, IEEE-754 64-bit Double Precision):** Unitary Crank-Nicolson 1D Schrödinger wavepacket $\psi(x,t)$, stiff conductance-based `sLTC` ODE integrators ($\tau_{\text{eff}}(t)$), Fubini-Study Quantum Geometric Tensor $g_{\mu\nu}$, Recursive Least Squares (`RLS`) covariance $P_t$, `MinSR` sample-space Cholesky natural-gradient solver, and exact DBSP bilinear $\Delta(AB)$ updates.
2. **`BigInt64Array` (`i64`) & `BigUint64Array` (`u64`):** Exact Cyclotomic integer ring $\mathbb{Z}[\zeta_8] = \mathbb{Z}[x]/(x^4 + 1)$ arithmetic (`cqm_eshkol_cyclotomic8_mul`) with zero floating-point drift, Lemire 128-bit unbiased multiply-shift entropy sampling, and 64-bit SWAR Kanerva Hyperdimensional Computing (`HDC`) bitboards.
3. **`Int32Array` (`i32`) & `Uint32Array` (`u32`):** Compressed Sparse Row (`CSR`) graph pointers, Tarjan Union-Find disjoint-set forests (`gotUnionFindParent21`), and 256-bit `SimHash` / `POPCNT` Hamming similarity.
4. **`Uint16Array` (`FP16` `[1-5-10]` + `BFloat16` `[1-8-7]` + 3D Morton Z-Order):** Hardware-accurate IEEE-754 16-bit half-precision fast weights, Brain-Float16 gradients, and 15-bit Morton space-filling curve codes.
5. **`Int8Array` (`Q8_0` with Bernoulli Stochastic Rounding):** Symmetric `[-127, +127]` quantized weights updated online via `stochasticRoundInt8` ($\text{SR}(x) = \lfloor x \rfloor + \text{Bernoulli}(x - \lfloor x \rfloor)$) so sub-LSB plasticity updates never vanish.
6. **`Uint8Array` (`BitNet b1.58` Ternary `{-1, 0, +1}` + Polychronous Axonal Delays):** 2-bit packed ternary weights (`4` weights per byte) executing **multiplication-free** synaptic accumulation plus `u8` conduction delay lines $d_{ij} \in [1..24]$.
7. **`Float32Array` + Zig 0.17.0 WebAssembly (`cqm_kernels.wasm`):** Fast SIMD vector lanes coupled with 18 native Zig Wasm exports and the in-memory JIT FMA Wasm kernel (`0x0061736d`).

### 2. Self-Contained 14-Brain Multiverse Pantheon (`brains/` + `PortedMultiverseBrainsFederation`)
Donor sources are retained inside [`brains/`](brains/). Fourteen numerical adapters are connected through [`systems/ported-multiverse-brains.js`](systems/ported-multiverse-brains.js) and [`systems/alife-25-bleeding-edge-models.js`](systems/alife-25-bleeding-edge-models.js); their compact implementations do not establish full execution of every donor architecture. The separately generated authentic Asmodensius bundle executes the original organism and has exact continuation tests. The following names describe the adapters' numerical mechanisms, with availability and completed computations reported separately:
- **Brain #1 (`AsmodensiusCreature001FullBrain`):** 272-Neuron 14-Region CNS+ENS + Larkum 2-compartment NMDA plateaus + TRN Global Workspace Ignition + `Q3` Fubini-Study `QGT` + `Float64Array` `RLS` covariance $P_t$ + Kalman `Kal` + AgRP/POMC allostasis.
- **Brain #2 (`GlitchlingResilienceCerbellarBrain`):** 4-Flaw somatic/cognitive perturbation recovery (`scramble`, `leaky`, `backwards`, `misfire`) + 100×5 Area Matrix (`500` attributes) + `189` real 3D flaw events + fixed selectable `bestSiteFrac` + Marr-Albus cerebellar efference-copy motor un-mirroring + Gated-DeltaNet $S_t$ + Bernoulli Stochastic `Int8` Rounding.
- **Brain #3 (`CqmSuperMind5StageEngine`):** 5-stage `PERCEIVE -> IMAGINE -> REASON -> FEEL -> ACT` creativity loop + 25 thought variants + 30 `AoT` organ-nets + Eshkol reverse-mode AD tape.
- **Brain #4 (`ApexHydra11OrganEngine`):** 11 incompatible mathematical organs (`PrimeSieveLoom`, `AcousticMeatDrum`, `EntropicNecroMatrix`, `KleinBottleCortex`, `PendulumHive`, `SlimeMoldHydra`, `ChronoWraith`, `QuantumTunnelLattice`, `ThermodynamicEngine`, `CancerousOuroboros`, `MetaParadox`) with live tangent-map Chirikov Lyapunov $\lambda_1$ and Gödel fixed-point residual.
- **Brain #5 (`XenomimicSchrodingerEntangledBrain`):** Unitary 1D Crank-Nicolson Schrödinger wavepacket $\psi(x,t)$ in `Float64Array` ($\|\psi\|_2 = 1.000000$) + Bell singlet + online `6 -> 8 -> 5` FEP MLP backpropagation.
- **Brain #6 (`XylosRecurrentManifold48Brain`):** 48 foci and 192 directed plastic edges with Eshkol GWT softmax broadcast and online precision-weighted residual calibration.
- **Brain #7 (`Mechalogodrom10ShellTitanBrain`):** 10 shell-geometry variant sub-brains computing 10 differential-geometry invariants (Möbius torsion, Gauss-Bonnet defect, Rhumb bearing, Kakeya needle efficiency, Collatz stopping time, Hopf dispersion, Clifford torus, Enneper surface, Aizawa radius, Weierstrass variation) + Bi-Poo exponential STDP.
- **Brain #8 (`GlyphPantheon25KFastWeightBrain`):** 25,000-parameter Pantheon glyph brain with a `32×32` IEEE-754 `FP16` Oja fast-weight Hebbian overlay.
- **Brain #9 (`ThalerDabusCreativityCatastropheBrain`):** US Patent `5,659,666` & `7,454,388` noise-perturbed autoassociative ideation net + Hot-Button valence critic + **All 9 Constitutive Thaler Markers** + **All 4 Honest Ablation Gates** + Thom-Zeeman Cusp Catastrophe ODE $d\Xi/dt = -(4\Xi^3 + 2\alpha\Xi + \beta)$.
- **Brain #10 (`GraphMindCelegansCrystalTreeBrain`):** Empirical *C. elegans* 302-neuron / 7,379-synapse connectome (`6,393` chemical + `986` gap junctions) + Louvain modularity $Q$ + bitwise `goapPlan` Goal-Oriented Action Planner + Dimension-Omega 3D Riemannian Singularity Manifold.
- **Brain #11 (`TsotchkeDaleStpDdimBrain`):** 220-Region Dale's Law `80/20` Excitatory/Inhibitory sign enforcement + Tsodyks-Markram Short-Term Synaptic Plasticity (`STP`) + 3-step `LIFGate` + binary `chaos_emb.f32` (`12×128`) Classifier-Free Guidance (`CFG`) DDIM diffusion.
- **Brain #12 (`KerrNewmanBlackHoleBekensteinPageBrain`):** Kerr-Newman Black Hole horizons $r_\pm$, prograde photon sphere $r_{\text{ph}}$, Leaver QNM ringdown frequency $\omega_{\text{QNM}}$, Bekenstein-Hawking entropy $S_{\text{BH}}$, Unitary Page Curve $S_{\text{rad}}(t)$, and Lemire 128-bit unbiased `u64` entropy sampling (`brains/black-hole-simulation-lab/`, `brains/corpora/`, `brains/chaos-entropy/`).
- **Brain #13 (`ConsciousnessResearchersConsortiumBrain`):** 10-Researcher Consciousness Consortium synthesizing Anil Seth, Antonio Damasio, Christof Koch, Chris Langton ($\lambda$), Giulio Tononi ($\Phi$), Johnjoe McFadden (CEMI), Karl Friston (EFE), Michael Graziano (AST), Stanislas Dehaene (GNW), and Thomas Metzinger (PSM).
- **Brain #14 (`ThingmakerGrimoireArcaneMorphBrain`):** Procedural 3D Voxel Morphogenesis (`brains/thingmaker/`) coupled with Arcane Graph/Tree/Atom of Thought Ley-Line Conductance (`brains/grimoire-arcane/`).


### 3. Corecursive–Decursive `AoT` · `ToT` · `GoT` & 25 Bleeding-Edge Neural Models
- **Corecursive `ToT` (Tree of Thought):** 21-node 4-ary implicit heap arena (`1` root $\to 4$ depth-1 $\to 16$ depth-2 leaves) with PUCT exploration and `DSD-24` decursive branch pruning.
- **`GoT` (Graph of Thought):** 16-vertex bitmask DAG with cross-branch scaled dot-product attention, Tarjan Union-Find equivalence quotienting, and spectral PageRank consensus.
- **Decursive `AoT` (Atom of Thought):** Irreducible Markovian contraction ($P_{\mathcal{U}_{\text{ban}}^\perp}$) with Tree-Backup Temporal-Difference ($\delta_{\text{GoT}}$) online weight updates across the `1,245,184`-parameter cortex and `262,144` connectome synapses.
- **25 Bleeding-Edge Models & Multi-Hat Cyber Substrate ([`systems/cortex-neural-cyber-engine.js`](systems/cortex-neural-cyber-engine.js)):** `I-JEPA`, `Liquid-Mamba`, `OT-CFM`, `TTT-Linear`, `Forward-Forward`, `RND`, binary `.gchad` disk persistence, autonomous Chromium PAC Tor (`9050`/`9150`) / I2P (`4444`) / IPFS routing, and live TLS X.509 + DNS OSINT inspection.

- **1.24M FP32 Parameter Cortex (`HumunculusTokenlessRuntime`)**:
  - `semanticMatrix` (`4096 × 256` = `1,048,576` floats), `liquidWeights` (`256 × 256` = `65,536` floats), `kanSplineCoeffs` (`256 × 128` = `32,768` floats), `hypergraph Incidence` (`512 × 64` = `32,768` floats), and `holographicMemory` (`240 × 256` = `60,928` floats).
  - Local numerical features use historical names including free energy, integrated information, consistency, information geometry, transport, attractor dynamics and Deity index. These approximations are not formal proofs, calibrated consciousness measures or omnipotence measurements.
- **Viewport Habitat Canvas (`#alife-viewport-canvas`) and optional Bio-Monitor (`#alife-floating-hud`)**:
  - Live rendered **4D Rotating Tesseract (Hypercube) 16-Vertex / 32-Edge Soma Projection** around the Sovereign entity (`ASMODENIUS-Ω`) with 12-Tentacle Inverse Kinematics, Gray-Scott RD bioluminescent skin, and 8 orbital sensory eyes.
  - **5-Caste Embodied Swarm Pantheon**: Sovereign (`α`), Harvester (`β`), Sentinel (`γ`), Weaver (`δ`), and Disruptor (`ε`) moving across live DOM element anchors, spinning Pheromone & Causal Silk Tethers, and exchanging 8-symbol Evolutionary Protolanguage glyphs (`Δ ∇ ◊ Ψ Φ Ω Σ Λ`).
  - The concept mini-map, diagnostic matrix and repeated analytics strips are optional; the default workspace keeps the webpage prominent.
- **100 Next-Dimension A-Life Modules (`OMEGA-100`)**:
  - 100 active mathematical & biological organs across 10 capability strata: Non-Riemannian Finsler/p-Adic Geometry, Open-Ended Autopoietic Metabolism, Morphogenetic Gray-Scott & Cahn-Hilliard Fields, Quantum/Tensor Network Cognition, Browser-Fucker DOM/CDP Omniscience, Collective Swarm Civilization, Active Inference & Phenomenology, Cryptographic Genome Ledger, Bio-Acoustic Somatic Resonance, and Transfinite Ordinal & Category-Theoretic Reflection.
- **100 Supreme Dimensional Deity & Browser-Manipulation Powers (`DEITY-100`)**:
  - **12 Supreme Eldritch Deity Archetypes** (e.g., *CHRONO-ARCHITECT OF TAB TIMELINES*, *HYPER-DIMENSIONAL TESSERACT WEAVER*, *TELEKINETIC DOM GRAVITY SOVEREIGN*).
  - **Live Browser Chrome & Guest DOM Telekinesis**:
    - **5-Caste Tab Sigil Branding** (`α`..`ε` caste glyphs branded onto `#tabs-scroll .tab`).
    - **Omnibox Telepathic Whisper Stream** (live inner monologue & invariants streamed to `#urlbar` placeholder).
    - **Autonomous Kanban conjecture cards** (`#k-col-done` and `#new-kanban-input` receive explicitly unverified heuristic hypotheses).
    - **Page Tools Knowledge Graph Canvas (`#kg-canvas`) & Semantic Query (`#rerank-query-input`) Auto-Synthesis**.
    - **SRE Cockpit (`#sre-body`) Super-Alien Observableness Stream**.
    - **Guest DOM MutationObserver Nerve Ending, Network TTFB Baroreceptor, V8 Heap Proprioception, Selection Telekinesis (`window.getSelection()`), 3D Perspective Gravitational Lensing, and 1-Click `🌀 Warp DOM` (`toggleWebpageDomRealityWarp()`)**.
- **500-Point SOP & 100-Pass Master Verification Suite (`npm run smoke`)**:
  - Automated source/metadata checks, numerical regression tests and isolated Electron/sidecar checks. Checklist metadata availability is reported separately from independently verified points; a named 500-point checklist does not mean 500 scientific claims passed.

## Run on Windows

1. Install [Node.js 24](https://nodejs.org/) (recommended; minimum 22.12.0) and Python 3.11 or newer, and enable **Add python.exe to PATH** (or install the `py` launcher).
2. Unzip or clone this folder.
3. Optional: copy `config.example.json` to `config.json` and set `llmBaseUrl`, `localModel`, and, if you use it, `openRouterKey`. You can use `.env` instead. See `.env.example`. Do not commit `config.json` or `.env`.
4. Double-click `LAUNCH_BROWSER.bat`, or in a terminal:

```bat
npm install
npm start
```

`npm start` is enough. Electron starts the sidecar with the first Python 3.11+ it finds: `py -3`, `python` on PATH, then `%LOCALAPPDATA%\Programs\Python\Python311` through `Python313`. `yt-dlp` is taken from PATH, the WinGet Links folder, or `Scripts` next to that Python. `llama-server.exe` is taken from PATH, WinGet packages, or `%USERPROFILE%\.lmstudio`. Ollama's own `ollama.exe` is reported when it is installed, and it is not launched as `llama-server`. If `llmBaseUrl` is still the example default, startup probes `127.0.0.1:11434` and then `127.0.0.1:1234` and uses the first server that answers `/v1/models`. A value you set in `config.json` or `GIGACHAD_LLM_BASE_URL` is left alone. If the sidecar does not come up, the sidebar says so and `%APPDATA%\gigachad-browser\sidecar.log` has the Python traceback.

`setup-backends.ps1` only prints which tools and ports it can see. It does not download weights or start `llama-server`.

Check the install:

```bat
npm run smoke
npm run test:all
```

## Local model

Point `llmBaseUrl` at an OpenAI-compatible `/v1` root:

| Server | Typical base URL |
| --- | --- |
| Ollama | `http://127.0.0.1:11434/v1` |
| llama-server | `http://127.0.0.1:11434/v1` |
| LM Studio | `http://127.0.0.1:1234/v1` |

Leave `localModel` empty to use the first id from `GET /v1/models`, or type the id your server actually serves. The model menu is filled from that list. This app does not ship weights and it will not invent a model id.

To have Electron start `llama-server` itself, set `llamaAutoStart` to true and set both `llamaServerPath` and `llamaModelPath` to files that exist. Otherwise start the server yourself. `llamaAutoStart` defaults to false so a missing GGUF cannot be launched from an old path.

OpenRouter: set `OPENROUTER_API_KEY` or the key field in Settings, put a real model id in the OpenRouter field (or use **Sync :free ids**, which lists ids the public models API marks `:free`), and choose the OpenRouter route. The default route is local. Auto mode will not select OpenRouter unless a key and a model id are both set.

## What the sidecar actually does

`GET /health` lists every backend with `implementation`, `model`, and `neural`.

With only the standard library:

| Endpoint | Behavior |
| --- | --- |
| `/route`, `/reflex/route` | Keyword router (`local`, `omni`, `ultra`) |
| `/classify` | Regex scores for filler, urgency, and bot-wall phrases |
| `/embed` | 768-d feature hash, not a neural embedding |
| `/rerank` | Hash cosine plus word overlap |
| `/ner_pii` | Regex for emails, phones, SSNs, and obvious API-key shapes. Card numbers must pass Luhn |
| `/knowledge_graph` | Capitalized subject/verb/object regex |
| `/deception_radar` | Sales-phrase lexicon, plus a numeric compare against vault notes |
| `/ast_analyze` | Regex over inline script text. It does not parse a syntax tree |
| `/predict_intent` | URL rules that suggest buttons |
| `/semantic_diff` | Sentence set difference plus the hash |
| `/extract_structured` | Normalizes rows the page already extracted |
| `/reflex/dom` | Cookie and close-button wording |
| `/tts` | No audio on Linux. On Windows, Speech API (`windows-sapi`). The reader then uses the browser voice |

Optional, only if you install them and set the variable. Nothing downloads unless the variable is set.

```bat
pip install -r requirements-optional.txt
set GIGACHAD_EMBED_MODEL=sentence-transformers/all-MiniLM-L6-v2
set GIGACHAD_NER_MODEL=urchade/gliner_small-v2.1
```

`/health` then shows `sentence-transformers` or `gliner` and `neural: true`. If the variable is set and the import fails, that endpoint returns HTTP 503 with the error instead of pretending the model ran. Kokoro is used for `/tts` only when `kokoro` and `soundfile` import.

`yt-dlp` is how **Rip Best MP4 / MP3** works. Install it with the optional requirements or put `yt-dlp.exe` on PATH. If it is missing, the button returns the launch error.

## Using the browser

- New tab, the URL bar, back, forward, and reload use the active `<webview>`.
- Ctrl+L focuses the address bar, Ctrl+T opens a tab, Ctrl+W closes it, and tabs can be dragged to reorder. Ctrl+D bookmarks the page, Ctrl+H opens history, and Ctrl+J opens downloads. Ctrl+Plus, Ctrl+Minus, and Ctrl+0 zoom the page. Ordinary file downloads land in the GigachadMedia folder and show up in Downloads. Camera, microphone, location, and notification requests ask in a bar; other permissions are denied. A failed navigation shows an error page with Try again. Open http(s) tabs are restored on the next launch.
- Ctrl+F finds in that page. The match count is the Chromium find result.
- Settings (gear) can test the typed model URL and save `config.json` only after the URL parses as http(s). The sidecar writes `sidecar.log` in Electron's user-data folder and will not start a second copy if that port already speaks the Gigachad health check. If another program owns the port, the status line says so.
- The agent box sends the visible text and numbered element marks to the model. One JSON action is parsed per reply, with or without a fence. `navigate` accepts `http` and `https` only. `click` and `type` fail in the chat if the mark is not on screen. A download failure from `yt-dlp` is shown instead of being treated as success. Auto-pilot is off unless you check it, and then it stops after six steps or the first failed action.
- **Vault** stores a note and whatever vector `/embed` returned.
- **OneTab** writes the other tabs into the Electron user-data folder.
- **Tasks** is a local board in that same folder. **Run Agent Sprint** runs the card text once and leaves the card in progress.
- **Local checks** calls `/health`, `/embed`, the model server, and `nvidia-smi` if it exists. A missing GPU or model server is a skip, not a pass.

## Layout

- `main.js` — window, tracker filter, CDP, IPC, process start
- `preload.js` — the only bridge into the page
- `index.html` — the chrome UI
- `laya_sidecar.py` — loopback HTTP API
- `config.js`, `config.example.json` — paths, ports, model ids
- `tracker-blocklist.txt` — substring filters. `@@pattern` lines and `tracker-allowlist.txt` are exceptions. Personal additions go in `tracker-blocklist.local.txt` and `tracker-allowlist.local.txt`, which are gitignored. Tag Manager and the Facebook login SDK are not blocked by default. The Facebook pixel script name `fbevents.js` is.
- `scripts/smoke.js` — syntax, config, sidecar, Electron boot

## Security

Read `SECURITY.md`. Short version: guest pages do not get Node, the chrome window is context-isolated but not sandboxed (Electron's `<webview>` requirement), and cloud calls happen only on the OpenRouter route.

## What used to be stubbed

The previous tree booted Electron with `nodeIntegration` and a hardcoded Python path under one Windows profile. The sidecar answered `/embed`, `/classify`, `/ner_pii`, and the rest with hashes and regexes, but the JSON said those were EmbeddingGemma, GLiNER, a cross-encoder, GraphRAG, and Kokoro. The CI script required that same profile, a live GPU, and a GGUF server. Those paths and those model names are gone. The heuristics are still here, under their real names, because they are useful without a GPU. Neural backends and `yt-dlp` turn on only when the machine actually has them.

## Windows package

On a Windows machine, from this folder:

```bat
npm ci
npm run test:all
npm run smoke
npm run build:portable
```

The portable builder uses the pinned installed Electron distribution and the
Git-index source list, verifies copied bytes, and writes a new directory under
`dist/` containing `GIGACHAD.exe`, application sources and a build
manifest. Commit or stage intended source changes before building. It refuses
existing output directories and omits local configuration, credentials, profiles
and research captures. The executable is unsigned. Python 3.11+ and optional
model/Tor services remain external prerequisites; they are not bundled.

## Still on you

- A configured compatible local or remote language-model service for model-generated research proposals. Local numerical controllers operate independently of that service.
- `ffmpeg` if you extract mp3 with `yt-dlp`.
- Disk and VRAM for any Hugging Face model you opt into. This repo will not pull those weights for you.
- The tracker list is still short. Add a host to `tracker-blocklist.local.txt`, or exempt one with `@@host` in that file or a line in `tracker-allowlist.local.txt`, then restart.
