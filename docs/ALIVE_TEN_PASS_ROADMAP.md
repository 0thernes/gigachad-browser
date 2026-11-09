# Ten-pass creature integration sequence

Requested November 9, 2026. This ledger starts with the current continuous
cognition pass; it does not retroactively count older releases. Each pass is a
separate prompt iteration ending in reviewed results, local commit and GitHub
push. A commit alone does not mark an experiment successful.

| Pass | Intended focus | Status |
| --- | --- | --- |
| 1 | Continuous faculties, actual tensor/synapse participation, shared Ghost research/writing, visual evidence, independent learning seeds | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_01_REPORT.md), [validation](verification/continuous-cognition-2026-11-09.json) |
| 2 | Measure useful behavior on frozen unseen research/navigation tasks; compare heuristic, frozen and learning controllers | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_02_REPORT.md), [benchmark JSON](reports/alive-unseen-task-benchmark-2026-11-09.json), [benchmark SVG](reports/alive-unseen-task-benchmark-2026-11-09.svg) |
| 3 | Architecture ablations across every brain family, reasoning structure and precision route | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_03_REPORT.md), [ablations JSON](reports/alive-architecture-ablations-2026-11-09.json), [ablations SVG](reports/alive-architecture-ablations-2026-11-09.svg) |
| 4 | Complete declared optimizer, recurrent, replay, RNG and curriculum state contracts; restart equivalence | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_04_REPORT.md), [restart equivalence JSON](reports/alive-restart-equivalence-2026-11-09.json), [restart equivalence SVG](reports/alive-restart-equivalence-2026-11-09.svg) |
| 5 | Long-duration learning/retention, morphology transfer and five-seed uncertainty across distinct tasks | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_05_REPORT.md), [continual transfer JSON](reports/alive-continual-morphology-transfer-2026-11-09.json), [continual transfer SVG](reports/alive-continual-morphology-transfer-2026-11-09.svg) |
| 6 | Creature colony differentiation, role assignment, shared versus independent state, resource limits and population fitness | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_06_REPORT.md), [colony fitness JSON](reports/alive-colony-population-fitness-2026-11-09.json), [colony fitness SVG](reports/alive-colony-population-fitness-2026-11-09.svg) |
| 7 | Research provenance, contradiction tracking, source quality and source-grounded writing evaluations | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_07_REPORT.md), [provenance JSON](reports/alive-research-provenance-evaluator-2026-11-09.json), [provenance SVG](reports/alive-research-provenance-evaluator-2026-11-09.svg) |
| 8 | Browser tools, navigation, developer workflows and transport fault recovery on representative sites | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_08_REPORT.md), [fault recovery JSON](reports/alive-browser-fault-recovery-2026-11-09.json), [fault recovery SVG](reports/alive-browser-fault-recovery-2026-11-09.svg) |
| 9 | Sustained performance, failures, recovery, visualization overhead and reproducible package qualification | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_09_REPORT.md), [sustained perf JSON](reports/alive-sustained-performance-qualifier-2026-11-09.json), [sustained perf SVG](reports/alive-sustained-performance-qualifier-2026-11-09.svg) |
| 10 | Integrated release audit; resolve remaining failures and freeze the evidence package for the next architecture phase | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_10_REPORT.md), [release audit JSON](reports/alive-integrated-release-audit-2026-11-09.json), [release audit SVG](reports/alive-integrated-release-audit-2026-11-09.svg) |

The order after pass 1 can change with measured failures and the user's next
prompts. No future pass has been run or passed merely because it appears here.
Pass 1's local correctness and integration checks do not establish improved
open-web user tasks or promote the eight scientific research gates. That task
benefit remains to be measured in the next pass.

## After pass 10: Tor Browser integration (Passes 11–15)

| Pass | Intended focus | Status |
| --- | --- | --- |
| 11 | Tor Browser / Chromium / Electron Hybrid Process & Session Partition Architecture (`IsolateSOCKSAuth`, `IsolateFirstPartyDomain`, Ephemeral Partitioned Storage, Zero-Leak DNS/WebRTC/Proxy Policy) | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_11_REPORT.md), [Tor mesh JSON](reports/alive-tor-hybrid-mesh-2026-11-09.json), [Tor mesh SVG](reports/alive-tor-hybrid-mesh-2026-11-09.svg) |
| 12 | Tor ControlPort Protocol, Stream-to-Circuit Observability, `NEWNYM` Identity Rotation & Guard/Middle/Exit Path Verification | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_12_REPORT.md), [Tor circuits JSON](reports/alive-tor-circuit-controller-2026-11-09.json), [Tor circuits SVG](reports/alive-tor-circuit-controller-2026-11-09.svg) |
| 13 | RFC 7686 / Tor Rendezvous Spec v3 `.onion` Address Cryptographic Verification (56-char Base32 Ed25519 Pubkey, `.onion checksum` SHA3-256 validation, Descriptor Auth & Reachability State Machine) | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_13_REPORT.md), [Onion v3 JSON](reports/alive-onion-v3-verifier-2026-11-09.json), [Onion v3 SVG](reports/alive-onion-v3-verifier-2026-11-09.svg) |
| 14 | Anti-Fingerprinting & Anonymity Hardening Matrix (Letterboxing Viewport Quantization, Canvas/WebGL/AudioContext Entropy Bounding, Header/Timer/Font Uniformity & Cross-Origin Unlinkability) | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_14_REPORT.md), [Tor shield JSON](reports/alive-tor-fingerprint-shield-2026-11-09.json), [Tor shield SVG](reports/alive-tor-fingerprint-shield-2026-11-09.svg) |
| 15 | Executed Tor Hybrid Synergy Mesh Acceptance Matrix (Fail-Closed Proxy Kill-Switch, Circuit Recovery Under Relay Failure, Partition Isolation Proof & End-to-End Routing Audit) | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_15_REPORT.md), [Tor matrix JSON](reports/alive-tor-acceptance-matrix-2026-11-09.json), [Tor matrix SVG](reports/alive-tor-acceptance-matrix-2026-11-09.svg) |

The user requests a Chromium/Electron/Tor Browser hybrid as the next phase.
Existing managed Tor transport is not a completed Tor Browser integration.
That phase must first establish the actual process/engine architecture, shared
versus separate browsing state, isolation and anonymity properties, update
ownership, routing observability, recovery and compatibility tests. Its definition
of fully operational must be a named, executed acceptance matrix rather than a
blanket percentage. No Tor Browser replacement or embedded integration is shipped
by pass 1.

## Following phase: larger exploration swarms (Passes 16–20)

| Pass | Intended focus | Status |
| --- | --- | --- |
| 16 | Multi-Entity Exploration Swarm Coordinator (`Raven-Cognition`, `Locust-Forager`, `Fish-School-Consensus` Guilds, Explicit Entity Identity & Independent vs Shared Model Ownership) | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_16_REPORT.md), [hyper swarm JSON](reports/alive-hyper-swarm-coordinator-2026-11-09.json), [hyper swarm SVG](reports/alive-hyper-swarm-coordinator-2026-11-09.svg) |
| 17 | Public-Web & Onion Swarm Resource Governor (Per-Domain Concurrency Semaphores, Token-Bucket Request Budgets, Global Pause/Kill-Switch & Bounded Population Growth) | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_17_REPORT.md), [swarm governor JSON](reports/alive-swarm-budget-governor-2026-11-09.json), [swarm governor SVG](reports/alive-swarm-budget-governor-2026-11-09.svg) |
| 18 | Learned Inter-Entity Cooperation, Stigmergic Pheromone Knowledge Graph, Distributed Frontier Deduplication & Byzantine-Fault-Tolerant Source Consensus | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_18_REPORT.md), [stigmergic mesh JSON](reports/alive-swarm-stigmergic-mesh-2026-11-09.json), [stigmergic mesh SVG](reports/alive-swarm-stigmergic-mesh-2026-11-09.svg) |
| 19 | 5-Seed Multi-Guild Swarm Exploration Benchmark Across Clearnet + `.onion` Topologies (Comparing Solitary, Uncoordinated Flock, Centralized Queue & Stigmergic Hybrid Synergy Swarm) | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_19_REPORT.md), [wild foraging JSON](reports/alive-swarm-wild-foraging-benchmark-2026-11-09.json), [wild foraging SVG](reports/alive-swarm-wild-foraging-benchmark-2026-11-09.svg) |
| 20 | 20-Pass Grand Synthesis & Cryptographic Evidence Package Qualification (Cross-Auditing All 20 Passes, All 36 Capabilities, 14 Brains × 7 Precision, Tor Hybrid Synergy Mesh & Multi-Guild Exploration Swarms) | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_20_REPORT.md), [omega audit JSON](reports/alive-omega-20-pass-auditor-2026-11-09.json), [omega audit SVG](reports/alive-omega-20-pass-auditor-2026-11-09.svg) |

Expand from the current shared controller and bounded colony into larger groups
with explicit entity identity, independent or shared model ownership, research
roles, learned cooperation, provenance, resource allocation and actual task
metrics. Public-web exploration should have visible per-domain concurrency and
request budgets, stop/pause control, and bounded population growth. Increasing
the number of tabs or simulated bodies is not evidence of independent cognition.

Every phase should retain live visual evidence: what each entity observed,
computed, learned, delegated, wrote, attempted and completed, including failed
or unavailable operations. The report for each pass records the exact commit,
validation conditions and remaining work.

## Phase IV: Deep Onion Rendezvous, Pluggable Transports, Traffic-Analysis Defense & Cryptographic Provenance (Passes 21–25)

| Pass | Intended focus | Status |
| --- | --- | --- |
| 21 | Pluggable Transports (`obfs4` IAT-2 Polymorphic Framing + `Snowflake` Ephemeral WebRTC/Domain-Fronting Bridge Fallback) & Active-Probing DPI Resistance | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_21_REPORT.md), [PT JSON](reports/alive-tor-pluggable-transports-2026-11-09.json), [PT SVG](reports/alive-tor-pluggable-transports-2026-11-09.svg) |
| 22 | Tor v3 `.onion` Equi-X Proof-of-Work (`rend-spec-v3` §3.4 / Proposal 327) & `x25519` Client Authorization Descriptor Decryption | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_22_REPORT.md), [Onion PoW JSON](reports/alive-onion-pow-client-auth-2026-11-09.json), [Onion PoW SVG](reports/alive-onion-pow-client-auth-2026-11-09.svg) |
| 23 | Website Fingerprinting (`WF`) Defense & Circuit Padding Machines (Adaptive WTF-PAD / RegulaTor Burst Shaping & Inter-Arrival Time Masking) | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_23_REPORT.md), [WF Padding JSON](reports/alive-tor-padding-traffic-defense-2026-11-09.json), [WF Padding SVG](reports/alive-tor-padding-traffic-defense-2026-11-09.svg) |
| 24 | Ed25519 Signed Merkle-DAG Citation & Content-Addressed Archival Ledger across Ephemeral `.onion` & Clearnet Sources | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_24_REPORT.md), [Merkle Ledger JSON](reports/alive-onion-merkle-provenance-ledger-2026-11-09.json), [Merkle Ledger SVG](reports/alive-onion-merkle-provenance-ledger-2026-11-09.svg) |
| 25 | Phase IV Deep-Web & Censorship-Resistance Acceptance Matrix (`D1`–`D10` Executed Audit & Cryptographic SHA-256 Freeze) | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_25_REPORT.md), [Phase IV Audit JSON](reports/alive-tor-deepweb-phase4-audit-2026-11-09.json), [Phase IV Audit SVG](reports/alive-tor-deepweb-phase4-audit-2026-11-09.svg) |

## Phase V: Hyper-Swarm Ecological Intelligence — Corvid Epistemology, Locust Phase Polyphenism & Fish Hydrodynamics (Passes 26–30)

| Pass | Intended focus | Status |
| --- | --- | --- |
| 26 | Corvid (`Crow` + `Raven`) Episodic Tool-Making, Multi-Hop Counterfactual Causal Graph Construction ($do(X)$) & Deceptive-Bait Rejection | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_26_REPORT.md), [Corvid JSON](reports/alive-crow-raven-corvid-epistemology-2026-11-09.json), [Corvid SVG](reports/alive-crow-raven-corvid-epistemology-2026-11-09.svg) |
| 27 | Locust Solitaria-to-Gregaria Phase Polyphenism, Density-Dependent Frontier Wavefront Expansion & Adaptive Trophic Backoff | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_27_REPORT.md), [Locust JSON](reports/alive-locust-phase-polyphenism-2026-11-09.json), [Locust SVG](reports/alive-locust-phase-polyphenism-2026-11-09.svg) |
| 28 | Fish-School Lateral-Line Hydrodynamic Coupling, Kuramoto Phase Synchronization & Sub-Tick Anomaly Evasion Wave | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_28_REPORT.md), [Fish Hydro JSON](reports/alive-fish-lateral-line-hydrodynamics-2026-11-09.json), [Fish Hydro SVG](reports/alive-fish-lateral-line-hydrodynamics-2026-11-09.svg) |
| 29 | Symbiotic Cross-Guild Co-Evolution, Shapley Counterfactual Credit Assignment & Pareto Archive Speciation Across `Raven` + `Locust` + `Fish` Lineages | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_29_REPORT.md), [Symbiotic JSON](reports/alive-symbiotic-cross-guild-coevolution-2026-11-09.json), [Symbiotic SVG](reports/alive-symbiotic-cross-guild-coevolution-2026-11-09.svg) |
| 30 | Phase V Hyper-Swarm Ecological Intelligence Acceptance Matrix (`E1`–`E10` Executed Audit & Cryptographic SHA-256 Freeze) | Implemented and locally verified in the containing release commit; [report](ALIVE_PASS_30_REPORT.md), [Phase V Audit JSON](reports/alive-hyper-swarm-phase5-audit-2026-11-09.json), [Phase V Audit SVG](reports/alive-hyper-swarm-phase5-audit-2026-11-09.svg) |

## Phase VI: Neuro-Symbolic Program Synthesis, Active Inference Free-Energy & Hyperbolic Knowledge Geometry (Passes 31–35)

| Pass | Intended focus | Status |
| --- | --- | --- |
| 31 | Variational Free-Energy Minimization ($\mathcal{F}$) & Epistemic-Pragmatic Expected Free Energy ($\mathcal{G}(\pi)$) Planner | Planned (Pass 31) |
| 32 | Hyperbolic Poincaré Ball ($\mathbb{B}^d_c$) Hierarchical Ontology & Deep Citation Tree Embedding Engine | Planned (Pass 32) |
| 33 | Neuro-Symbolic DOM/API Extractor Program Synthesis & SMT-Style Invariant Verification | Planned (Pass 33) |
| 34 | Dynamic Mixed-Precision Tensor Quantization (`FP64`/`FP32`/`BF16`/`INT8`/`INT4`/`NF4`/`Binary`) & Spectral Error-Feedback Compensation | Planned (Pass 34) |
| 35 | Phase VI Neuro-Symbolic & Active Inference Acceptance Matrix (`N1`–`N10` Executed Audit & Cryptographic SHA-256 Freeze) | Planned (Pass 35) |

## Phase VII: Adversarial Immunity, Long-Horizon Autonomous Missions & 40-Pass Grand Omega Qualification (Passes 36–40)

| Pass | Intended focus | Status |
| --- | --- | --- |
| 36 | Adversarial Indirect Prompt-Injection, Hidden-DOM Cloaking & Cross-Origin Exfiltration Immunity Shield | Planned (Pass 36) |
| 37 | Long-Horizon Multi-Day Checkpointable Autonomous Research Mission Runner with Subgoal Decomposition & Deadlock Recovery | Planned (Pass 37) |
| 38 | Self-Healing Runtime Watchdog, Deterministic State Rollback, Corrupt-Adapter Quarantine & Zero-Data-Loss Recovery | Planned (Pass 38) |
| 39 | Full-Stack End-to-End Hybrid Synergy Benchmark (36 Faculties + 14 Brains + Tor v3 Pluggable Mesh + 3-Guild Co-Evolving Swarms + Active Inference + Adversarial Shield) | Planned (Pass 39) |
| 40 | 40-Pass Grand Omega Synthesis & Cryptographic Evidence Package Qualification (Cross-Auditing All 40 Passes, Phases I–VII, All SHA-256 Manifests & Startup Loader Registration) | Planned (Pass 40) |
