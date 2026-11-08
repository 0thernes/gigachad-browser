# Codebase assessment supporting the engineering prompt

Review date: 2026-11-08, America/Los_Angeles. Primary repository: GIGACHAD Browser. Baseline Git HEAD: `283311b62a7d228fc478cde45594251fb482738e`, with pre-existing and concurrently changing working-tree files.

Follow-up revision note: the repository later advanced to `a16f5838820014ba8a1fa76e9c184de154be850f`. Targeted inspection found new FP16 handling, an implicit wavepacket solve, expanded checkpoint state, portal reporting changes, and revised audit checks. Findings below describe the earlier reviewed snapshots and must be reproduced on current source before remediation. The follow-up was not a full functional qualification of those changes. See the refinement log for the maintained prompt's update.

This is the source-grounded assessment used to write [the master prompt](GIGACHAD_ENGINEERING_MASTER_PROMPT.md). It is not a completed remediation program, security qualification, scientific validation, or 500-control audit. The authoring work adds files only under `docs/prompts/`. Application, licensing, and documentation changes elsewhere during the review were not made by this prompt-authoring task.

## Review coverage and limits

The primary repository inventory contained 1,103 tracked files, including 1,034 under `brains/`. The review covered its top-level architecture and documentation, process/preload/IPC boundaries, selected browser UI and persistence paths, sidecar routing and status, configuration, smoke/CI entrypoints, numerical arenas, brain federation, asset hydration, and audit machinery. Three parallel reviewers inspected the imported brains and related donor projects, then reviewed the draft prompt.

All imported brain directories were inventoried. Donor review focused on their owned-source structure, executable entrypoints, numerical contracts, relevant interfaces/tests, provenance, and licensing. Selected original/imported pairs were compared by SHA-256. This was not a semantic review of every line in every donor, build tree, research document, or generated artifact. Coverage is described below so that an implementation run can finish the broader review without inventing prior verification.

The main CQM repository was not broadly audited. CQM inspection was limited to the imported browser dependency: Wasm loading, numerical interfaces, portal/build completeness, and copied native build output.

Small read-only Node probes were run against the checklist summary, FP16 conversion, and federation state export. No Electron UI run, full `npm run smoke`, clean package build, Windows installer test, 60 Hz benchmark, training campaign, or broad security test was performed for this documentation task. An early inventory script encountered a Windows console-encoding error while printing a donor README; that read was repeated with UTF-8 output. This did not affect the repository.

## Findings that materially changed the prompt

### 1. Existing audit scores cannot serve as release evidence

The initial [sop-500-checklist.js](../../systems/sop-500-checklist.js) assigned literal verification flags and fixed success scores. Concurrent edits replaced those values before the evidence snapshot. In the later snapshot, lines 586-588 define `isNonEmptyRule` using rule-text length, a recognized aspect, and a nonempty domain code; line 596 assigns that predicate to `verified`. The percentage and grade are calculated from those metadata flags. The read-only probe still returned 500 total, 500 verified, and A+ without running the browser. The current unresolved issue is that requirement-metadata validity is presented as implementation verification.

In [forensic-25-pass-10-iteration-auditor.js](../../systems/forensic-25-pass-10-iteration-auditor.js), the missing-pantheon path at line 58 returns successful metadata predicates. The case labeled OWASP at line 63 checks brain and precision counts. The advertised 500 points are 25 cases with two predicates, repeated ten times. That represents up to 50 distinct repeated predicates, not 500 distinct security/engineering controls.

The prompt therefore requires direct requirement-to-evidence mappings, an audit of the verifier itself, failure exit codes, explicit unavailable/not-run states, independent oracles, and separate totals for unique controls and executions. Ten prompt revisions and ten engineering cycles are also explicitly separated.

### 2. The mixed numerical substrate is real, but its guarantees need testing

[ported-multiverse-brains.js](../../systems/ported-multiverse-brains.js), lines 50-68, allocates a 131,072-byte buffer with Float64, BigInt64, BigUint64, Int32, Uint32, Uint16, Int8, Uint8, and Float32 views. [alife-25-bleeding-edge-models.js](../../systems/alife-25-bleeding-edge-models.js) contains a separate mixed arena. Several donor organisms also use Float64 solver/readout state, integer sparse indexes, and deterministic RNG state.

This supports the user's recollection that the system already goes beyond Float32. It does not establish that every tier is used correctly, that software FP16/BF16 encoding is native hardware arithmetic, or that aligned views imply SIMD/zero-allocation execution.

A direct conversion probe returned `decodeFp16(encodeFp16(0.00001)) === 0`. The encoder flushes this subnormal-scale input rather than providing a complete IEEE half conversion. The current wavepacket code, lines 771-794, performs explicit updates followed by normalization and assigns the reported norm to `1.0`; its Crank-Nicolson/unitarity terminology needs algorithm-level validation.

The prompt preserves justified representations while requiring storage/compute/accumulation contracts, conversion edge cases, exact integer/RNG vectors, independent numerical references, and measured backend performance. It does not ban useful Float32 arrays or prescribe Float64 everywhere.

### 3. Source copying, asset loading, wrappers, and portals are different integrations

The federation instantiates fourteen local JavaScript classes. Its update loop does blend outputs into the host organism, so there is runtime coupling. However, that is not evidence that all copied TypeScript, Python, Rust, or C++ donor engines execute.

The `ported-brains-bridge` handler in [main.js](../../main.js), starting at line 1983, reads CQM Wasm, a C. elegans CSV, and an initial slice of Tsotchke embeddings. It reduces the graph to selected hubs/edges. These source counts and active runtime counts need separate labels. The bridge does not establish the README's claimed live loading of the whole corpus knowledge graph.

The `hybrid-brain-portals` handler can fall back to sibling paths while returning `selfContainedInRepo: true` at line 1959. The imported CQM HTML points directly at TypeScript with bare dependencies, without the matching JavaScript package/bundler setup in that copied root. Other donor portals load remote scripts. A portal file's presence cannot establish a working standalone/offline package.

The prompt requires byte-identical source snapshots, attributable patches, dependency closure, appropriate adapters, actual original-function execution, input/output causality tests, and clean-checkout/package isolation. Research corpora and visualizers receive contracts matching their actual role.

### 4. Rechecking concurrent changes matters

An early read-only probe found that federation export referenced an undefined RLS field and threw. During the assessment, other working-tree edits changed that code. On recheck, `exportLearnedState()` returned successfully, the exported field used `W_rls8x2`, and the chrome contained save/load calls. The earlier exception is therefore not reported as an unresolved current defect.

Similarly, an initially constant-valued ablation routine was replaced during the review by calculations using current weights and synthetic perturbation regimes. That removes the specific earlier constant-only observation; it does not establish task-level, held-out experimental validity. No restart/replay or independent ablation campaign was performed here.

The prompt consequently requires revision-specific evidence, revalidation after edits, complete checkpoint state, independent evaluation criteria, and an explicit distinction between implemented code and verified behavior.

### 5. Security and Windows verification need direct tests

[main.js](../../main.js), lines 464-472, explicitly disables guest Node integration and enables guest isolation, sandboxing, and web security. The chrome renderer separately specifies `sandbox: false` at line 577. `fromChrome()` checks owning webContents at lines 192-194; frame/origin authorization still deserves direct testing. These facts do not establish an exploitable vulnerability by themselves.

The sidecar has loopback binding and size/error checks, and it labels many heuristic backends honestly. Its HTTP handler still needs caller, Host/Origin, malformed-length, concurrency, and timeout assessment. The prompt retains these controls while requiring architecture-specific adversarial tests and exact provider/data-egress behavior.

The current [CI workflow](../../.github/workflows/ci.yml), line 43, sets `GIGACHAD_SKIP_ELECTRON: '1'`. Its inspected steps do not install npm dependencies. This workflow cannot establish Electron/preload startup or packaged Windows operation from a clean environment. The default model ID in [config.js](../../config.js), line 15, and related string assertions also deserve reconciliation with the project's configuration rule.

The prompt requires isolated services/user data, proof that required checks actually ran, clean dependency installation, development startup, and separate Windows artifact qualification. Electron's own guidance calls for sender validation and controlled renderer boundaries; ASVS supplies versioned verification requirements, not an automatic certification. Sources: [Electron security](https://www.electronjs.org/docs/latest/tutorial/security), [OWASP ASVS](https://asvs.owasp.org/).

## Donor comparison

Paths in this table are relative to the shared workspace parent. Counts use the stated exclusions and are not semantic-review counts. Historical donor test results were inspected as records; their suites were not rerun.

| Source | Evidence inspected | Consequence for the prompt |
|---|---|---|
| `Asmodensius-v40` | Scoped inventory: 296 files, including 163 TS/TSX files. Actual organism, sparse synapses, Float64 Q3/RLS state, lab interface/adapter, snapshot tests, specialists, GPU creature, and MIT license. `.git` points to a missing prior worktree location, so no valid current commit was recovered. | Reuse real organism interfaces and preserve snapshots. Distinguish procedural 100M base weights from 680,008 trainable LoRA/readout parameters. Use verified file hashes where Git provenance is unavailable; evaluate held-out tasks rather than infer general cognition from specialist scorecards. |
| `glitchling-jam` | 147 files; no functioning Git repository or unified package manifest found. Actual organism and synthetic/replay/live substrate, Float64 state, sparse typed arrays, frozen-core handoff, harness, and visualizations. | Preserve actual core, seed/replay semantics and test data. Selected imported core is identical, while harness and visualization data differ; record patches. Default organism configuration is 272 neurons, not an unconditional 336. The inspected harness reads a choice field after the core resets it, so metrics need causal validation. |
| `dimension-omega-singularity` | Six non-Git files, clean revision `947054ec64878530d0f9abdddb9316494a9de34f`. Inline visual simulation, BigInt RNG, Float64 three-qubit simulation and mixed buffers; imported index/studio are identical. | Preserve useful numerical kernels while separating them from scalar proxy scores and large-dimensional labels. Define a simulation clock and address remote script dependencies. No package/test/license surface was discovered in the scoped tree. |
| `tsotchke-pages` | Clean revision `dfbfbcc756b72a7ad2b8c2bdf3c44378745cb390`. ONNX image-diffusion app, Float64 schedule, Float32 tensors, seeded sampler, models, and parity harness. Imported app/sampler are identical. | Integrate actual ONNX runtime/model paths if required. Do not describe this site as the separate Python Dale/STP system. Bundle/disclose remotely loaded runtime assets and establish model/data rights. |
| `tsotchke-diffusion-app/tsotchke-diffusion-app` | Python `LIFGate`, `DaleConv`, STP, UNet, classical QRNG ports/fallbacks, and README validation limits. No whole-project license was discovered in the scoped scan. | Establish the correct nested source root, Windows/backend evidence, and rights. Do not inherit untested Windows/CUDA claims or label classical entropy generation as quantum hardware. |
| `Chaos Entropy Art Engine` | Clean revision `b3a7b141a63c72b0a280ffa0c7ed39b3891ccb20`. Rust u64/u128 RNG/range logic, Python renderer, tests, CI. Imported `lib.rs` is identical. Root license says proprietary while README/Cargo metadata say MIT. | Preserve exact-width arithmetic and source provenance. Review arbitrary-bound sampling claims and rendering dependencies. Resolve contradictory rights records; one copied Rust file is not the complete runnable project. |
| `Thingmaker` | 13 non-Git files, clean revision `735db4ed45008c5bbc6129f2572d1a0c3f590169`. Deterministic `buildThing(seed, category)` producing SVG/JSON/lore, exports, VM self-test and CI. Imported index is identical; tests are absent from the imported subset. | Treat this as procedural generation, not a demonstrated voxel brain. Import relevant tests and assert reported determinism. A local 8-by-8 wrapper does not call this original generator. |
| `GRIMOIRE - Algorithms of the Arcane` | 498 files after output/cache exclusions, clean revision `edca7f8dc2f8bba27402a248301dd30d19ff1781`. Atlas runtime, actual selected native implementations, coverage ledger, verification tools, license and notice. Six site/docs files are imported. | Preserve planned-versus-verified distinctions: its ledger reports 103 verified cells against 50,000 planned cells, not 50,000 running implementations. Separate guest atlas from executable algorithms. Carry code/content terms and notices. |
| `Stephen-Thaler-Corpus` | 284 non-Git/cache files, bibliographic registry, scaffold/verification/RAG scripts, architecture and notice. No committed source revision was available. | Treat as study/retrieval material; it does not provide the researcher's proprietary neural implementation or endorsement. Preserve rights and the corpus's explicit limits on consciousness claims. |
| `Consciousness-Researchers-Corpus` | 323 files, ten researcher dossiers, script/notice, no Git repository found. | Maintain attribution, retrieval provenance, and hypothesis/operational-proxy distinctions. Ten named scores are not ten independently validated consciousness theories. |
| `Black Hole Simulation Lab` | 215 tracked files, clean revision `050455db866d32eb115d0cd1a39f9b90a76fdd6f`. CMake/CI, C++ truth labels, geodesic, adaptive integrator and thermodynamics headers, rights notices; 31 files in the Browser import at inventory time. | Preserve explicit analytic/numerical/visualization/speculative labels and actual C++ dependency/build requirements. Optional upstream integration flags are not implemented adapters. A JS formula wrapper is not execution of these C++ solvers. |
| Two Browser baseline directories | Historical source, configuration, sidecar, preload, tests and security explanations. The pre-harden main process enables renderer Node integration and disables context isolation. | Use historical behavior to investigate regressions; do not restore unsafe settings or obsolete model labels. Current `AGENTS.md` requirements remain controlling. |
| Imported `brains/corpora` | Seven files: three black-hole JSON files and four research Markdown documents. No matching general `corpora` sibling source was resolved. | Preserve the provenance gap and correct inventory claims before describing a full semantic graph or live taxonomy loader. |

## Import size and repository hygiene

The filesystem inventory, including untracked content, found 9,647 files and approximately 1,264.54 MiB under `brains/cqm-xylos`. Its `native/` subtree accounted for 9,280 files and approximately 1,255.45 MiB, dominated by build and fetched-dependency trees. These are snapshot measurements, not a recommendation to delete anything.

The prompt requires inclusion manifests and separation of source, build outputs, dependencies, generated data, and release assets. Faithful source importing should preserve required source/build/test/notice material without turning a developer's build cache into the product source of truth.

## Distribution policy and rights

The user's noncommercial, unmodified-download/use intent is preserved. Existing source notices vary: Asmodensius carries MIT terms; GRIMOIRE states PolyForm Noncommercial code and CC BY-NC-SA content terms; Chaos has conflicting metadata; other sources have missing or proprietary terms. These observations require a component inventory and compatibility decisions, not an assumption that one root license replaces every imported term.

The Open Source Definition requires permissions incompatible with a blanket no-modification/noncommercial policy, so the prompt uses accurate restricted-source terminology. GitHub also states that public repositories permit viewing and platform forking under its terms. The prompt therefore separates hosting mechanics, project-owned rights, upstream obligations, owner-authorized engineering, and end-user restrictions. Sources: [Open Source Definition](https://opensource.org/osd), [GitHub licensing documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).

No license was rewritten, publication initiated, or legal enforceability conclusion reached in this prompt-authoring task.

## Reproducibility and next use

[REVIEW_EVIDENCE.json](REVIEW_EVIDENCE.json) records selected file hashes, import comparisons, tool versions, and limited probe results from the later snapshot. [PROMPT_REFINEMENT_LOG.md](PROMPT_REFINEMENT_LOG.md) records the ten prompt versions and the specific improvements made. The master prompt can be used on its own; this assessment supplies concrete starting hypotheses to recheck before implementation.
