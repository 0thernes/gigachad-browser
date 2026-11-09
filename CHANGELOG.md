# Changelog (`CHANGELOG.md`)

All notable architectural, mathematical, and security milestones for **GIGACHAD BROWSER** are documented in this file.

## [Unreleased] — 2026-11-09 · Wild clearnet + .onion multi-guild foraging benchmark pass 19

- Added the 5-seed Multi-Guild Swarm Exploration Benchmark across 36-node Clearnet + RFC 7686 v3 `.onion` topologies ([`systems/alive-swarm-wild-foraging-benchmark.js`](systems/alive-swarm-wild-foraging-benchmark.js), [`scripts/alive-swarm-wild-foraging-benchmark.cjs`](scripts/alive-swarm-wild-foraging-benchmark.cjs)) comparing `solitary-single-agent`, `uncoordinated-flock-15`, `centralized-fifo-queue-15`, and `stigmergic-tor-hybrid-synergy-swarm`.
- Verified on `5/5` seeds that `stigmergic-tor-hybrid-synergy-swarm` achieves `100.0` wild foraging score (`+60.25` over `centralized-fifo-queue-15`, `+28.13` over `solitary-single-agent`, `+100.0` over `uncoordinated-flock-15`), `100.0%` corroborated truth discovery across depths `1..4`, `100.0%` `.onion` FPD circuit isolation, `0` rate-limit `429` throttles, and `0` honeypot contaminations.
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 25 (`#alive-fabric-swarm-foraging`, `Run wild foraging` button, and `runSwarmForaging()`).
- Added [Pass 19 report](docs/ALIVE_PASS_19_REPORT.md), [JSON report](docs/reports/alive-swarm-wild-foraging-benchmark-2026-11-09.json), [SVG chart](docs/reports/alive-swarm-wild-foraging-benchmark-2026-11-09.svg) and unit tests (`tests/alive-swarm-wild-foraging-benchmark.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Stigmergic pheromone knowledge graph, frontier deduplication & BFT consensus pass 18

- Added the 5-seed Stigmergic Pheromone Knowledge Graph, Canonical SHA-256 Frontier Deduplicator, and $2f+1$ Byzantine-Fault-Tolerant (`BFT`) `Fish-School-Consensus` quorum ([`systems/alive-swarm-stigmergic-mesh.js`](systems/alive-swarm-stigmergic-mesh.js), [`scripts/alive-swarm-stigmergic-mesh.cjs`](scripts/alive-swarm-stigmergic-mesh.cjs)) comparing `isolated-no-pheromone-no-bft`, `dedup-only-no-pheromone-no-bft`, `pheromone-without-bft-quorum`, and `full-stigmergic-bft-consensus-mesh` across 24 knowledge-graph nodes per seed.
- Verified on `5/5` seeds that `full-stigmergic-bft-consensus-mesh` achieves `100.0` mesh score, `100.0%` corroborated truth acceptance, `100.0%` Byzantine Sybil poison rejection (`0` poisoned claims in graph), `0` duplicate canonical URL fetches, and `0` dead-end trap follow-ups.
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 24 (`#alive-fabric-stigmergic-mesh`, `Run stigmergic mesh` button, and `runStigmergicMesh()`).
- Added [Pass 18 report](docs/ALIVE_PASS_18_REPORT.md), [JSON report](docs/reports/alive-swarm-stigmergic-mesh-2026-11-09.json), [SVG chart](docs/reports/alive-swarm-stigmergic-mesh-2026-11-09.svg) and unit tests (`tests/alive-swarm-stigmergic-mesh.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Public-web & .onion swarm resource governor pass 17

- Added the 5-seed Public-Web & Onion Swarm Resource Governor ([`systems/alive-swarm-budget-governor.js`](systems/alive-swarm-budget-governor.js), [`scripts/alive-swarm-budget-governor.cjs`](scripts/alive-swarm-budget-governor.cjs)) comparing `ungoverned-locust-flood`, `global-cap-no-per-domain-bucket`, `per-domain-bucket-no-killswitch`, and `full-token-bucket-swarm-governor` across 6 target domains (`3` clearnet `maxConcurrent=2`, `3` `.onion` v3 `maxConcurrent=1`) over 40 burst exploration steps per seed.
- Verified on `5/5` seeds that `full-token-bucket-swarm-governor` achieves `100.0` compliance score, `0` domain concurrency violations, `0` token-bucket overruns, `0` population ceiling breaches (`peakPopulation = 15`), and `0` kill-switch leaks during emergency `PAUSE` and `KILL_SWITCH` windows.
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 23 (`#alive-fabric-swarm-governor`, `Run swarm governor` button, and `runSwarmGovernor()`).
- Added [Pass 17 report](docs/ALIVE_PASS_17_REPORT.md), [JSON report](docs/reports/alive-swarm-budget-governor-2026-11-09.json), [SVG chart](docs/reports/alive-swarm-budget-governor-2026-11-09.svg) and unit tests (`tests/alive-swarm-budget-governor.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Multi-entity exploration swarm coordinator pass 16

- Added the 5-seed 15-entity Tri-Guild Exploration Swarm Coordinator ([`systems/alive-hyper-swarm-coordinator.js`](systems/alive-hyper-swarm-coordinator.js), [`scripts/alive-hyper-swarm-coordinator.cjs`](scripts/alive-hyper-swarm-coordinator.cjs)) comparing `cloned-tab-flock`, `homogeneous-single-guild`, `uncoordinated-independent-swarm`, and `tri-guild-hybrid-synergy-swarm` (`5 Locust-Foragers`, `5 Raven-Cognition`, `5 Fish-School-Consensus`) across 30 multi-stage tasks per seed.
- Verified on `5/5` seeds that `tri-guild-hybrid-synergy-swarm` achieves `100.0` synergy score (`+99.0` over `cloned-tab-flock`, `+73.87` over `uncoordinated-independent-swarm`), `100.0%` multi-stage pipeline completion, `1.5850` bits of guild role specialization JSD, `0.2633` pairwise inter-entity weight cosine distance, and `0.0%` redundant stage collisions.
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 22 (`#alive-fabric-hyper-swarm`, `Run hyper swarm` button, and `runHyperSwarm()`).
- Added [Pass 16 report](docs/ALIVE_PASS_16_REPORT.md), [JSON report](docs/reports/alive-hyper-swarm-coordinator-2026-11-09.json), [SVG chart](docs/reports/alive-hyper-swarm-coordinator-2026-11-09.svg) and unit tests (`tests/alive-hyper-swarm-coordinator.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Executed Tor Hybrid Synergy Mesh acceptance matrix pass 15

- Added the 5-seed executed 10-row Tor Hybrid Synergy Mesh acceptance matrix ([`systems/alive-tor-acceptance-matrix.js`](systems/alive-tor-acceptance-matrix.js), [`scripts/alive-tor-acceptance-matrix.cjs`](scripts/alive-tor-acceptance-matrix.cjs)) auditing [`systems/alive-tor-service.cjs`](systems/alive-tor-service.cjs) (`T1`) and Passes 11–14 (`T2`–`T10`).
- Verified `10/10` acceptance rows (`T1-Owned-Tor-Daemon-Lifecycle` through `T10-Letterbox-FPD-Unlinkability-Shield`) across `5/5` seeds (`100.0` acceptance score), freezing the Phase II cryptographic `SHA-256` manifest (`0f6fe620d1b3c9e3d91528848b326255afa53ede89970d25756f4c9be050c942`) and qualifying entry into Phase III (`Passes 16–20`: Multi-Guild Exploration Swarms).
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 21 (`#alive-fabric-tor-acceptance`, `Run Tor matrix` button, and `runTorAcceptance()`).
- Added [Pass 15 report](docs/ALIVE_PASS_15_REPORT.md), [JSON report](docs/reports/alive-tor-acceptance-matrix-2026-11-09.json), [SVG chart](docs/reports/alive-tor-acceptance-matrix-2026-11-09.svg) and unit tests (`tests/alive-tor-acceptance-matrix.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Tor anti-fingerprinting & anonymity hardening matrix pass 14

- Added the 5-seed Tor Browser-grade anti-fingerprinting and cross-origin unlinkability shield ([`systems/alive-tor-fingerprint-shield.js`](systems/alive-tor-fingerprint-shield.js), [`scripts/alive-tor-fingerprint-shield.cjs`](scripts/alive-tor-fingerprint-shield.cjs)) comparing `unprotected-native-chromium`, `ua-header-spoof-only`, `static-global-noise-injection`, and `full-tor-letterbox-fpd-shield` across 24 probes per seed (`6` hardware machines $\times$ `4` First-Party Domains).
- Verified on `5/5` seeds that `full-tor-letterbox-fpd-shield` (`1000×800@1.0x` letterboxing, `100ms` timer coarsening, uniform Navigator/WebGL/Header profile, and FPD-keyed Canvas/Audio perturbation) achieves `0.00` bits of static surface entropy (`1/6` uniform surface), `100.0%` cross-origin unlinkability (`0.0%` tracker linkability), and `100.0` anonymity score.
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 20 (`#alive-fabric-tor-shield`, `Run Tor shield` button, and `runTorShield()`).
- Added [Pass 14 report](docs/ALIVE_PASS_14_REPORT.md), [JSON report](docs/reports/alive-tor-fingerprint-shield-2026-11-09.json), [SVG chart](docs/reports/alive-tor-fingerprint-shield-2026-11-09.svg) and unit tests (`tests/alive-tor-fingerprint-shield.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · RFC 7686 & Tor Rendezvous v3 (.onion) cryptographic verifier pass 13

- Added the 5-seed RFC 7686 and Tor Rendezvous Spec v3 (`rend-spec-v3.txt` §6) `.onion` cryptographic codec and verifier ([`systems/alive-onion-v3-verifier.js`](systems/alive-onion-v3-verifier.js), [`scripts/alive-onion-v3-verifier.cjs`](scripts/alive-onion-v3-verifier.cjs)) comparing `clearnet-dns-passthrough`, `regex-length-56-only`, `checksum-without-descriptor-sig`, and `full-rfc7686-v3-onion-verifier` across 20 `.onion` candidates per seed.
- Verified on `5/5` seeds that `full-rfc7686-v3-onion-verifier` (`56`-char Base32 `Ed25519` pubkey + `SHA3-256(".onion checksum" || PUBKEY || 0x03)` + `VERSION == 0x03` + HSDir `Ed25519` descriptor signature check) achieves `100.0%` valid v3 acceptance, `100.0%` adversarial rejection (`0` false positives), `0` RFC 7686 DNS leaks, and `100.0` security score.
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 19 (`#alive-fabric-onion-v3`, `Run .onion v3` button, and `runOnionV3Verifier()`).
- Added [Pass 13 report](docs/ALIVE_PASS_13_REPORT.md), [JSON report](docs/reports/alive-onion-v3-verifier-2026-11-09.json), [SVG chart](docs/reports/alive-onion-v3-verifier-2026-11-09.svg) and unit tests (`tests/alive-onion-v3-verifier.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Tor ControlPort protocol, stream attribution, NEWNYM & path diversity pass 12

- Added the 5-seed Tor ControlPort protocol parser, stream-to-circuit attribution, `SIGNAL NEWNYM` clean-slate rotation, and 3-hop Guard/Middle/Exit `/16` subnet + ASN path diversity governor ([`systems/alive-tor-circuit-controller.js`](systems/alive-tor-circuit-controller.js), [`scripts/alive-tor-circuit-controller.cjs`](scripts/alive-tor-circuit-controller.cjs)) comparing `unmonitored-blind-socks`, `passive-controlport-observer`, `newnym-without-path-diversity`, and `full-controlport-circuit-governor`.
- Verified on `5/5` seeds that `full-controlport-circuit-governor` achieves `100.0%` stream attribution, `100.0%` sybil `/16` & ASN path rejection (`0` sybil paths used), `100.0%` `NEWNYM` cleanliness (`0` dirty circuit reuses), and `100.0` observability score.
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 18 (`#alive-fabric-tor-circuits`, `Run Tor circuits` button, and `runTorCircuits()`).
- Added [Pass 12 report](docs/ALIVE_PASS_12_REPORT.md), [JSON report](docs/reports/alive-tor-circuit-controller-2026-11-09.json), [SVG chart](docs/reports/alive-tor-circuit-controller-2026-11-09.svg) and unit tests (`tests/alive-tor-circuit-controller.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Tor Hybrid Synergy Mesh process & session partition architecture pass 11

- Added the 5-seed Chromium / Electron / Tor Browser Hybrid Synergy Mesh session partitioner and `IsolateSOCKSAuth` credential router ([`systems/alive-tor-hybrid-mesh.js`](systems/alive-tor-hybrid-mesh.js), [`scripts/alive-tor-hybrid-mesh.cjs`](scripts/alive-tor-hybrid-mesh.cjs)) comparing `shared-session-direct`, `naive-socks-proxy-only`, `partitioned-storage-no-socks-auth`, and `full-tor-hybrid-synergy-mesh` across 20 security probes per seed.
- Verified on `5/5` seeds that `full-tor-hybrid-synergy-mesh` achieves `100.0%` First-Party-Domain (`FPD`) isolation (`5` distinct Tor circuits for `5` distinct FPDs), `0` DNS leaks (`MAP * ~NOTFOUND`), `0` WebRTC UDP leaks (`disable_non_proxied_udp`), `0` cross-origin storage leaks, and `100.0%` fail-closed blocking on Tor daemon drop.
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 17 (`#alive-fabric-tor-mesh`, `Run Tor mesh` button, and `runTorHybridMesh()`).
- Added [Pass 11 report](docs/ALIVE_PASS_11_REPORT.md), [JSON report](docs/reports/alive-tor-hybrid-mesh-2026-11-09.json), [SVG chart](docs/reports/alive-tor-hybrid-mesh-2026-11-09.svg) and unit tests (`tests/alive-tor-hybrid-mesh.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Integrated Phase I release audit & 8 PDF Gates evidence freeze pass 10

- Added the 5-seed Phase I integrated release audit ([`systems/alive-integrated-release-audit.js`](systems/alive-integrated-release-audit.js), [`scripts/alive-integrated-release-audit.cjs`](scripts/alive-integrated-release-audit.cjs)) cross-verifying Passes 1 through 9, all 36 faculties, all 24 coupled neural streams, and all 8 Scientific PDF Gates (`G1`–`G8`) with cryptographic `SHA-256` manifest digest (`820789b8bc108dbd3a53733ab8f5f8294872c842ce5e732a2cecaa2b6e799c41`).
- Verified `9/9` Passes and `8/8` PDF Gates on `5/5` seeds (`100.0` audit score), qualifying entry into Phase II (`Passes 11–15`: Chromium / Electron / Tor Browser Hybrid Synergy Mesh).
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 16 (`#alive-fabric-release-audit`, `Run audit` button, and `runReleaseAudit()`).
- Added [Pass 10 report](docs/ALIVE_PASS_10_REPORT.md), [JSON report](docs/reports/alive-integrated-release-audit-2026-11-09.json), [SVG chart](docs/reports/alive-integrated-release-audit-2026-11-09.svg) and unit tests (`tests/alive-integrated-release-audit.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Sustained 60Hz performance, memory bounds, visualizer overhead & package qualification pass 9

- Added the 5-seed sustained 60Hz performance, memory ring-buffer eviction, visualizer overhead, and adapter timeout recovery qualifier ([`systems/alive-sustained-performance-qualifier.js`](systems/alive-sustained-performance-qualifier.js), [`scripts/alive-sustained-performance-qualifier.cjs`](scripts/alive-sustained-performance-qualifier.cjs)) comparing `unbounded-eager-all-lanes`, `unbounded-history-no-eviction`, `no-adapter-timeout-guard`, and `bounded-phase-ordered-60hz` over 240 sustained ticks per seed.
- Verified on `5/5` seeds that `bounded-phase-ordered-60hz` achieves `p50 = 3.94 ms`, `p95 = 4.13 ms`, `p99 = 5.34 ms` (`100.0%` compliance with the `16.67 ms` 60Hz frame budget), `0.0` post-warmup memory growth, `0` hidden-panel draw calls, `100.0%` hung-adapter timeout recovery, and `100.0` qualification score.
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 15 (`#alive-fabric-sustained-perf`, `Run perf` button, and `runSustainedPerf()`).
- Added [Pass 9 report](docs/ALIVE_PASS_09_REPORT.md), [JSON report](docs/reports/alive-sustained-performance-qualifier-2026-11-09.json), [SVG chart](docs/reports/alive-sustained-performance-qualifier-2026-11-09.svg) and unit tests (`tests/alive-sustained-performance-qualifier.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Browser tools, navigation, developer workflows & transport fault recovery pass 8

- Added the 5-seed browser navigation, developer workflows, and transport fault recovery suite ([`systems/alive-browser-fault-recovery.js`](systems/alive-browser-fault-recovery.js), [`scripts/alive-browser-fault-recovery.cjs`](scripts/alive-browser-fault-recovery.cjs)) comparing `unbuffered-naive-nav`, `retry-without-backoff`, `circuit-breaker-only`, and `full-fault-tolerant-navigator` across 16-task representative workflows with 14 injected faults per seed (`ERR_NAME_NOT_RESOLVED`, `HTTP_503_SERVICE_UNAVAILABLE`, `HTTP_429_RATE_LIMITED`, `ERR_CONNECTION_TIMED_OUT`, `STALE_TAB_DISCONNECTED`, `DUPLICATE_WARP_DOM_MUTATION`).
- Verified on `5/5` seeds that `full-fault-tolerant-navigator` achieves `100.0%` workflow completion, `100.0%` fault recovery, `0` duplicate `Warp DOM` mutations, `0` rate-limit violations, `0` unhandled tab crashes, and `100.0` reliability score (`+89.14` over `circuit-breaker-only`).
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 14 (`#alive-fabric-fault-recovery`, `Run fault recovery` button, and `runFaultRecovery()`).
- Added [Pass 8 report](docs/ALIVE_PASS_08_REPORT.md), [JSON report](docs/reports/alive-browser-fault-recovery-2026-11-09.json), [SVG chart](docs/reports/alive-browser-fault-recovery-2026-11-09.svg) and unit tests (`tests/alive-browser-fault-recovery.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Research provenance, contradiction tracking & source-grounded writing pass 7

- Added the 5-seed research provenance, contradiction tracking, source quality, and source-grounded writing evaluation suite ([`systems/alive-research-provenance-evaluator.js`](systems/alive-research-provenance-evaluator.js), [`scripts/alive-research-provenance-evaluator.cjs`](scripts/alive-research-provenance-evaluator.cjs)) comparing `ungrounded-freeform`, `naive-concatenator`, `citation-only-filter`, and `provenance-contradiction-writer` across 9-document multi-tier corpora with SHA-256 excerpt receipts.
- Verified on `5/5` seeds that `provenance-contradiction-writer` achieves `100.0%` grounded claim precision, `100.0%` primary proposition recall, `100.0%` contradiction recall, `0.0%` hallucination rate, and `99.72 ± 0.02` composite score (`+62.28` over `citation-only-filter` and `+74.15` over `naive-concatenator`).
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 13 (`#alive-fabric-provenance`, `Run provenance` button, and `runProvenanceEval()`).
- Added [Pass 7 report](docs/ALIVE_PASS_07_REPORT.md), [JSON report](docs/reports/alive-research-provenance-evaluator-2026-11-09.json), [SVG chart](docs/reports/alive-research-provenance-evaluator-2026-11-09.svg) and unit tests (`tests/alive-research-provenance-evaluator.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Creature colony differentiation, state separation & population fitness pass 6

- Added the 5-seed creature colony differentiation, role assignment, state separation, and population fitness suite ([`systems/alive-colony-population-fitness.js`](systems/alive-colony-population-fitness.js), [`scripts/alive-colony-population-fitness.cjs`](scripts/alive-colony-population-fitness.cjs)) evaluating `solitary-host`, `undifferentiated-clone-colony`, `unbounded-greedy-colony`, and `differentiated-role-colony` under an identical 200-substep compute budget and bounded `maxPopulation = 5` / `totalAtpBudgetPerTick = 2.50` limits.
- Verified on `5/5` seeds that `differentiated-role-colony` (`5` distinct `COLONY_LENSES` roles + `Formation` spatial deconfliction + `Feed` homeostatic ATP allocation) achieves `100.0%` niche coverage, `0.0` collision penalty, `0` starvation events, and `6.1919 ± 0.0423` fitness (`+3.7921` over `solitary-host`, `+1.6843` over `undifferentiated-clone-colony`, `+3.6122` over `unbounded-greedy-colony`).
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 12 (`#alive-fabric-colony-fitness`, `Run colony` button, and `runColonyFitness()`).
- Added [Pass 6 report](docs/ALIVE_PASS_06_REPORT.md), [JSON report](docs/reports/alive-colony-population-fitness-2026-11-09.json), [SVG chart](docs/reports/alive-colony-population-fitness-2026-11-09.svg) and unit tests (`tests/alive-colony-population-fitness.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Continual learning, distinct-task retention & morphology transfer pass 5

- Added the 5-seed, 4-phase continual learning, distinct-task retention, and body morphology transfer suite ([`systems/alive-continual-morphology-transfer.js`](systems/alive-continual-morphology-transfer.js), [`scripts/alive-continual-morphology-transfer.cjs`](scripts/alive-continual-morphology-transfer.cjs)) evaluating `frozen-baseline`, `naive-continual`, `metamorph-transfer-only`, and `full-continual-living` across 4 distinct tasks (`T1..T4`), 4 body morphologies (`biped-scanner`, `octo-crawler`, `arachnid-weaver`, `eldritch-tentacle-swarm`), and an unseen 5th holdout morphology (`hexapod-strider-holdout`).
- Verified on `5/5` seeds that `full-continual-living` (`W_metamorph` + `FlyWire` ring compass + `Dream SWS / Dream Replay` + `Memory 4 Tier` Hopfield anchor + `SynapticFabric`) improves prior-task retention (`95.39%` vs `71.67%`, paired `+23.72%`, 95% CI `[+17.22%, +30.21%]`), reduces catastrophic forgetting by `81.1%` (`0.0402` vs `0.2131`), and transfers to unseen holdout morphology (`0.6516` vs `0.5009`).
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 11 (`#alive-fabric-continual-transfer`, `Run continual` button, and `runContinualTransfer()`).
- Added [Pass 5 report](docs/ALIVE_PASS_05_REPORT.md), [JSON report](docs/reports/alive-continual-morphology-transfer-2026-11-09.json), [SVG chart](docs/reports/alive-continual-morphology-transfer-2026-11-09.svg) and unit tests (`tests/alive-continual-morphology-transfer.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · State contracts & split-horizon restart equivalence pass 4

- Added the 6-domain state contract and split-horizon restart equivalence verifier ([`systems/alive-restart-equivalence.js`](systems/alive-restart-equivalence.js), [`scripts/alive-restart-equivalence.cjs`](scripts/alive-restart-equivalence.cjs)) covering `optimizer`, `recurrent`, `replay`, `rng`, `curriculum`, and `synapticFabric` across 5 independent seeds (`[19013, 29017, 39023, 49031, 59053]`).
- Verified bit-exact SHA-256 restart equivalence (`5/5` seeds, `0.0` state L2 drift, `0.0` max abs error, `0.0` motor trajectory drift) across `T1 = 6` warmup steps $\to$ checkpoint & fresh creature hydration $\to$ `T2 = 6` post-checkpoint steps, and verified leave-one-domain-out necessity (`5/5` seeds diverge when any single domain is omitted).
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 10 (`#alive-fabric-restart-eq`, `Run restart check` button, and `runRestartEquivalence()`).
- Added [Pass 4 report](docs/ALIVE_PASS_04_REPORT.md), [JSON report](docs/reports/alive-restart-equivalence-2026-11-09.json), [SVG chart](docs/reports/alive-restart-equivalence-2026-11-09.svg) and unit tests (`tests/alive-restart-equivalence.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Architecture ablations pass 3

- Extended [`systems/alive-neural-coupling.js`](systems/alive-neural-coupling.js) with runtime source ablation (`setAblatedSources`, `clearAblations`), `ablatedCount`, `diagnosticallyAblated` flags, and per-stream L2 `contributionNorm` telemetry across all 24 coupled streams (`14 brains + 7 precision routes + Ising-56 + Omega Lorenz + Omega Izhikevich`).
- Added the 38-condition, 5-seed architecture ablation suite ([`systems/alive-architecture-ablations.js`](systems/alive-architecture-ablations.js), [`scripts/alive-architecture-ablations.cjs`](scripts/alive-architecture-ablations.cjs)) verifying non-zero causal impact on 5/5 seeds across all 14 brain families, 7 precision routes, 3 scale strata, 5 specialist fusion readouts, AoT/ToT/GoT reasoning components, and Synaptic Fabric pathways.
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 9 (`#alive-fabric-ablations`, `Run ablations` button, and `runAblations()`) and added `systems/alive-architecture-ablations.js` to [`systems/alive-startup-loader.js`](systems/alive-startup-loader.js).
- Added [Pass 3 report](docs/ALIVE_PASS_03_REPORT.md), [JSON report](docs/reports/alive-architecture-ablations-2026-11-09.json), [SVG chart](docs/reports/alive-architecture-ablations-2026-11-09.svg) and unit tests (`tests/alive-architecture-ablations.test.cjs`, `tests/alive-neural-coupling.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Unseen research/navigation benchmark & colony lenses pass 2

- Added the five-seed unseen research and navigation task benchmark ([`systems/alive-unseen-task-benchmark.js`](systems/alive-unseen-task-benchmark.js), [`scripts/alive-unseen-task-benchmark.cjs`](scripts/alive-unseen-task-benchmark.cjs)) comparing `heuristic`, `frozen`, `learning` and `fabric-coupled` controllers on disjoint multi-domain holdout and retention task graphs using the production `AliveResearchPolicy`, `AliveCognitiveFaculties` and `AliveSynapticFabric` modules.
- Extended [`systems/alive-synaptic-fabric.js`](systems/alive-synaptic-fabric.js) with runtime node/edge ablation controls (`setAblation`, `clearAblations`) and per-creature specialized role lenses (`COLONY_LENSES`, `creatureLenses`).
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 8 (`#alive-fabric-benchmark` and `Run benchmark` control) plotting 5-seed unseen holdout reward + 95% Student-$t$ CIs, target concept recall, trap avoidance, and colony role lens activations.
- Added [Pass 2 report](docs/ALIVE_PASS_02_REPORT.md), [JSON report](docs/reports/alive-unseen-task-benchmark-2026-11-09.json), [SVG chart](docs/reports/alive-unseen-task-benchmark-2026-11-09.svg) and unit tests (`tests/alive-unseen-task-benchmark.test.cjs`).

## [Unreleased] — 2026-11-09 · Continuous cognition pass 1

- Added six coordinated capabilities for a total of 36, shared source-grounded Ghost research/writing, explicit memory/metacognition evidence, idempotent acknowledged DOM Warp, and independent five-training-seed diagnostics.
- Repaired permanently omitted expert, connectome, projection, attention, memory-readout and gradient lanes using bounded rotating sparse computation. Added actual coverage counters and all-fourteen-brain/seven-precision causal wiring checks.
- Added docked Brain evidence with source receipts, actual task timelines, notebook text, tensor statistics and numeric histories. Corrected Fabric event identity, simultaneous-concurrency measurement, elapsed-time rates and hidden-panel sampling.
- Integrated exact committed trainer bytes/private epoch/timeout with primary-policy startup persistence and independent two-process verification. This is a bounded component contract, not full-model continuity.
- Added the [pass report](docs/ALIVE_PASS_01_REPORT.md), [research review](docs/ALIVE_CONTINUOUS_RESEARCH_2026-11-09.md), [learning measurements](docs/ALIVE_LEARNING_FIVE_SEED.md) and [ten-pass roadmap](docs/ALIVE_TEN_PASS_ROADMAP.md).

## [Unreleased] — 2026-11-09 · Synaptic Fabric

### Added
- **Synaptic Fabric (`systems/alive-synaptic-fabric.js`)**: a plastic coupling graph between every ALIVE faculty, including brain observers, body actions, ghost faculties and diagnostics. When a faculty produces new evidence, the faculties it feeds become due earlier (excitation), within refractory limits. Hebbian credit strengthens an edge when the excited faculty's next outcome is new and weakens it when that outcome blocks or fails. A per-faculty utility moving average scales cadence between 0.5× and 2×. Navigation, storage, language-model and diagnostic faculties keep their own pacing. Weights persist to `localStorage` with readback verification. The fabric observes the runtime event stream; it never invokes adapters or bypasses readiness, lanes, Pause, backoff or manual-only status. See [`docs/ALIVE_SYNAPTIC_FABRIC.md`](docs/ALIVE_SYNAPTIC_FABRIC.md).
- **Synaptic Fabric visualizer (`systems/alive-fabric-visualizer.js`)**: a live analytics panel that draws only data, opened from the **Fabric** button in the ALIVE bar. It shows the coupling graph, a 60 s concurrency raster, a 24-stream brain/precision gate heatmap, a utility/cadence table, runtime/learning/plasticity time series, neural-substrate sparklines and a ghost-faculty/creature/fabric log.
- Tests: `tests/alive-synaptic-fabric.test.cjs` (10) and `tests/alive-fabric-visualizer.test.cjs` (4).

## [4.0.0-OMEGA] — 2026-11-08

### Added
- **14-Brain Multiverse Pantheon Federation (`systems/ported-multiverse-brains.js`):**
  - Full line-for-line fork-port and 60Hz online learning integration of `Asmodensius v40`, `Glitchling Resilience`, `CQM SuperMind`, `Apex Hydra 11-Organ`, `Xenomimic Schrödinger`, `Xylos 48-Foci Manifold`, `Mechalogodrom 10-Shell Titan`, `Glyph Pantheon 25K`, `Stephen Thaler DABUS + 9 Constitutive Markers + 4 Honest Ablations`, `GraphMind C. elegans + GOAP`, `Tsotchke Diffusion (Dale 80/20 E:I + STP + DDIM)`, `Kerr-Newman Black Hole Horizon + Page Curve`, `10-Researcher Consciousness Consortium`, and `Thingmaker Voxel Morphogenesis + GRIMOIRE Arcane GoT`.
- **7-Tier Heterogeneous Precision Tensor Arena (`Heterogeneous7TierPrecisionArena`):**
  - Replaced single-type `Float32Array` storage with a `131,072`-byte (`128 KB`) contiguous multi-precision `ArrayBuffer` spanning `Float64Array`, `BigInt64Array`/`BigUint64Array` (`Q32.32` & 1,024-bit `HDC`), `Int32Array`/`Uint32Array` (`Q16.16` & `CSR`), `Uint16Array` (`FP16`/`BF16`), `Int8Array` (Stochastic-Rounded `Q8_0`), `Uint8Array` (BitNet `b1.58` Ternary), and `Float32Array` + Zig/C WebAssembly.
- **25-Pass × 10-Iteration (`250` Pass Executions / `500`-Point) Forensic Auditor (`systems/forensic-25-pass-10-iteration-auditor.js`):**
  - Automated verification suite (`npm run audit:25x10`) achieving `500/500` (`100.00%`).
- **Fortune 100 GitHub Governance & Documentation Suite:**
  - Added root `ARCHITECTURE.md`, `BIBLE.md`, `GLOSSARY.md`, `INDEX.md`, `KANBAN.md`, `ISSUES.md`, `LICENSE` (Proprietary Download-and-Use-Only), `CITATION.cff`, `AUTHORS.md`, `CODEOWNERS`, and `VERSION`.

### Fixed
- **Glitchling `bestSiteFrac` Selectable-Site Metric (`ISS-01`):** Fixed `brains/glitchling/glitchling.ts` and live engine to filter by even-parity accessible sites (`access[k] === 1`) after `backwards` motor mirroring.
- **Glitchling `brain-viz/data.js` Real Flaw Events (`ISS-02`):** Restored all **189 real flaw events** (`motor_reversal`, `misfire`, `sensor_shuffle`, `motor_wiring`) from `results/activations_allflaws_seed1.json`.
- **CQM-Xylos Forensic Audits (`#104, #106, #107, #108, #120, #121, #179, #181, #185, #187`):** Wired online plasticity, exact tangent-map Lyapunov $\lambda_1$, Gödel fixed-point contraction, Bi-Poo STDP, stochastic Int8 rounding, unitary `Float64Array` Schrödinger evolution, residual calibration, and `FP16` fast-weight overlays.
