# Continuous creature faculties: research and implementation contract

Research date: November 9, 2026 (America/Los_Angeles).

The requested behavior is one continuously coordinated creature runtime: model
state informs actions, observed outcomes update declared learning state, memory
and replay retain useful experience, and the visible bodies express that shared
state. Continuous availability does not require every expensive operation to
execute on every rendering frame. A scheduled operation, a completed computation,
a measured effect and an independently qualified capability are different facts.

This document records the primary-source research used for this integration, the
source audit, the resulting engineering decisions and the remaining experiments.
It is not a claim to have read every file in the bundled donor projects or to have
established consciousness, general intelligence or biological equivalence.

## Research findings and design decisions

| Primary research | Finding relevant to this project | Engineering consequence |
| --- | --- | --- |
| [Goyal et al., Recurrent Independent Mechanisms](https://arxiv.org/abs/1909.10893) | Independent recurrent mechanisms communicate through sparse attention and update when relevant. | Keep a shared context and bounded communication between modules, with relevance-sensitive cadences. Executing a heuristic top-k selection is not evidence of a trained RIM or Option-Critic controller. |
| [Hasani et al., Liquid Time-constant Networks](https://arxiv.org/abs/2006.04439) | State-dependent continuous dynamics are evaluated with numerical differential-equation solvers. | Preserve timestep bounds and finite-state checks. Test long pauses, irregular frame intervals and restore boundaries. Similar variable names do not establish reference-model parity. |
| [Gu and Dao, Mamba](https://arxiv.org/abs/2312.00752) | Selective state-space parameters depend on inputs; the proposed model includes a specific architecture and hardware-aware computation. | Declare the actual local recurrence and trainable arrays. Do not transfer Mamba benchmark or throughput claims to a compact browser SSM. |
| [Rolnick et al., Experience Replay for Continual Learning](https://arxiv.org/abs/1811.11682) | Fresh experience and replay can be mixed to learn new tasks while reducing forgetting; bounded buffers can retain utility. | Replay accepted observations with provenance, retain older experience, and evaluate retained tasks before promoting a candidate. Dream counters are not evidence that parameters changed or performance improved. |
| [Agarwal et al., Deep Reinforcement Learning at the Edge of the Statistical Precipice](https://arxiv.org/abs/2108.13264) | Small numbers of training runs create substantial statistical uncertainty; interval estimates and robust aggregate metrics can change apparent algorithm rankings. | Keep independent training seeds distinct from evaluation trajectory seeds. Report raw failures, retained-task loss, confidence intervals and comparison against frozen/heuristic baselines. |
| [Dorkenwald et al., Neuronal wiring diagram of an adult brain](https://www.nature.com/articles/s41586-024-07558-y) and [Schlegel et al., Whole-brain annotation](https://www.nature.com/articles/s41586-024-07686-5) | The FlyWire adult female connectome comprises 139,255 neurons and approximately 54.5 million synapses, with extensive cell annotations. | A local ring, selected reservoir or allocated 512×512 matrix is a separate compact model. Declare dataset version, mapping, executed dimensions, physiology assumptions and the tested subcircuit. |
| [Grover, A fast quantum mechanical algorithm for database search](https://arxiv.org/abs/quant-ph/9605043) | The search result concerns quantum oracle-query complexity. | Classical amplitude simulation is a valid implementation label. Normalization, oracle definition and observed sampling frequencies are testable; quantum speedup or hardware execution is not inferred. |
| [Electron security documentation](https://www.electronjs.org/docs/latest/tutorial/security) | Remote content must remain isolated from native authority; IPC sender validation and restricted capabilities are essential. | Keep remote pages in isolated guests with Node integration disabled. Shared cognition receives observations and proposes declared actions; it does not grant guest content native code access. |
| [Tor address specification](https://spec.torproject.org/address-spec) | Version-3 onion names encode the service public key, checksum and version. | Validate names, require configured fail-closed routing, and distinguish SOCKS negotiation from a successful current-document onion response. An address or port alone is not a navigation receipt or anonymity guarantee. |

The scheduling and UI recommendations in the right column are engineering
inferences from the papers and the source audit. The papers do not evaluate
GIGACHAD. The research was checked through primary publications and official
specifications; a blocked publisher page was replaced with the authors' arXiv
paper where available.

## Requested capability families

| User-facing names | Operational interpretation and evidence |
| --- | --- |
| Step Episode; Train Policy; Learning 5-Seed | A declared control transition, candidate update, evaluation and optional independent seeded experiment. Keep observed outcomes, accepted updates and comparison results separate. |
| Mutate Body / Eldritch Morph; Body Metamorph; Body + Curriculum A–F / Viscera | Body recipe/state changes and declared stage progression. A morphology change needs an actual state receipt; a curriculum advantage needs a matched baseline. |
| Procreate / Mitosis; Spawn DOM Body; Formation; Feed | Bounded offspring, acknowledged guest embodiment, current formation and metabolic/contact outcomes. Additional visible bodies do not imply independently trained language models. |
| Dream SWS / Dream Replay; Memory 4 Tier | Replay from accepted observations and bounded working, episodic, semantic and procedural stores. Report actual stored entries, updates, provenance and retention. |
| FlyWire A/B; FlyWire M8; 8 PDF Gates / P.22 | Compact intact/ablated experiments and separate qualification reports. A runner can execute while the research gate remains NOT_RUN. |
| Epoch Handoff / m6; Checkpoint CID | Acknowledged authority transfer and declared persisted state with verified hashes/readback. A local hash is not IPFS publication, and a same-host handoff is not independent-peer continuity. |
| 9D Soul Surge; Grover Collapse; CI / Cl(4,0) Metacognition | Actual numerical state transformations. Preserve historical labels while displaying the local mathematical implementation and measured outputs. |
| Portal Jump / Concept Drive; Onion / Deep Dark Drive | Context-bound URL proposals, admission gates, dispatched navigation and matched arrival/failure receipts. Keep network/backend availability explicit. |
| Omega 100; Deity 100; Decursive DSD-24; Millennium; Deep Dark Substrate | Existing local feature computations and declared DOM/body operations. A roster, constructor or scheduled pulse does not verify every named scientific capability. |
| AoT / ToT / GoT; Macro 14 Regions / RIM Router | Bounded search/graph state, region readouts and the actual selection/fusion mechanism. Display which sources affected the action rather than only their names. |
| Meso 112 sLTC × SSM / Apical NMDA; Micro Moonlab Q3 / QGTL / QRNG / Eshkol / FlyWire Ising | Declared numerical recurrent, compartment, geometric and sampling computations. Distinguish local JavaScript/Wasm execution, configured external backends and absent backends. |
| 14 Brain × 7 Precision; 512-CONN × 262K-SYN × sLTC / SSM | Actual executed adapters and typed-array state. Separate allocated length, finite values, sampled/full inspection, numerical updates and independently measured learning. |
| Zalgo Fuckery; Neo Matrix; Warp DOM | Concrete, bounded guest/body effects with current-document receipts. A requested effect and a confirmed applied effect remain separate. |
| Ghost Swarm; Ghost Write; developer tools and web research | Bounded delegated research roles, observed source excerpts, proposed queries and source-bound drafts. Writing a draft is separate from inserting into a field or submitting a message. |

## Source-audit findings and integration plan

The existing scheduler already coordinated thirty capabilities before this
change. The architecture observation jobs exposed bounded receipts; numerical
engines continued on their existing stepping paths. The two Ghost tools were
separate UI workflows:

1. `runGhostSwarm` created three real search tabs, then visibly scanned them in
   sequence. It had no shared in-flight cap or topic deduplication and did not
   participate in the creature's lifecycle authority. Its memory-save result and
   model-synthesis success were not both required before the UI reported a
   completed research operation. Three query roles are not three independent
   trained agents.
2. `runInlineGhostwriter` captured a webview and focused input, awaited inference,
   then used CDP `insert_only`. It did not use its captured `hasFocus` flag, did not
   verify that the original document and field still owned the insertion, and
   ignored the IPC result before logging success. Repeated automatic insertion
   through that helper would produce stale-field writes.
3. `visuallyScanAndExtractFromTab` limited returned matches after inspecting all
   matching elements. Bounds must apply before text and layout inspection.
4. The existing `deep-dark-web-probe` already separated SOCKS negotiation,
   configured routing, onion address validation and current-document navigation
   evidence. Integrating it should preserve those distinctions.

The implementation contract is therefore:

- A shared adaptive coordinator uses actual current model/body/context signals
  to select bounded cadences. It retains per-lane exclusion, physical-operation
  settlement, pause, cancellation and backoff behavior.
- Ghost research consumes accepted observations, exposes delegated task status,
  records source URLs/excerpts and queues bounded research queries. Inference
  failures, missing services and stale observations remain visible outcomes.
- Continuous Ghost Write produces a source-bound draft. Explicit insertion uses
  a separate action with exact current-document/field validation and acknowledged
  success. Draft generation does not submit forms or messages.
- All model/body/tool operations use real outcome evidence. Training, replay,
  birth, morphology, persistence and transport retain their own acceptance
  conditions, even when they share context.
- Live visualization reads snapshots; opening an inspector never starts training,
  changes weights, reruns a gate or mutates a webpage.

## Live visual evidence interface

`systems/alive-faculty-visuals.js` installs a **Brain evidence** button in the
existing runtime toolbar. Its panel is initially closed. It samples once per
second while open and visible, cancels its timer when closed or the host is
hidden, and does not run a render animation. **Clear view** and Escape close it.

The panel displays:

- Actual scheduler capability/outcome counts, active execution/queue state and
  explicit missing-provider/error states.
- A graphical sixty-second timeline made from retained scheduler and faculty
  event timestamps. Scheduler monotonic timestamps are converted using the
  paired snapshot clock; they are not compared directly to epoch timestamps.
- Ghost delegated task status, queries, results, accepted source provenance and
  the produced draft. Model and task details preserve expansion during refresh.
- Expandable evidence for every exposed capability, with current lane, waiting
  dependencies, evidence age, call duration and the bounded receipt fields.
- A selectable history chart for each finite numeric field. Histories retain
  at most sixty display samples; zero, false and unavailable stay distinct.
- Optional tensor-owner statistics and excerpts through
  `window.getAliveTensorEvidence()`. Each row declares its typed-array length and
  full/sampled inspection scope. Hash changes must not be relabeled as an exact
  count of changed weights. All returned rows are reachable through pagination;
  search filters before the 256-row page limit. Collection omissions and an
  in-progress scan remain visible.
- Current health, authority, persistence and acceptance evidence, plus an actual
  retained event log. All untrusted source/model text is assigned as text content.

The module consumes `aliveOverdrive.snapshot()`,
`aliveCognitiveFaculties.snapshot()`, `getAliveRuntimeEvidence()` and the optional
tensor-inspection hook. It exposes `aliveFacultyVisuals.open()`, `.close()`,
`.sample()`, `.snapshot()` and `.destroy()` for integration and inspection.
No method executes a capability. Display bounds are exported as `LIMITS`.

This view deliberately distinguishes full tensor statistics from a bounded
excerpt. A miniature graph of a few values is not a rendering of every model
parameter, nor proof that every allocated parameter participates in learning.

The companion Fabric analytics panel now computes its concurrency histogram by
sweeping actual execution intervals inside each time bin. Serialized operations
inside one bin have peak concurrency one, an empty bin displays zero, and an end
at the same timestamp as another start does not invent overlap. Counter rates
divide by measured monotonic elapsed seconds. First observations, missing values,
counter resets and invalid timestamps produce missing rates instead of a made-up
zero. Sample timestamps position the history, including gaps while hidden.

Both evidence panels use the existing workspace inspector layout, with one
inspector open at a time and the guest webpage beside it. Sampling is bounded to
once per second while its panel is open and the document visible; closing,
hiding or disposing a panel clears its owned sampler. Fabric draws after a new
sample or visible layout change. These are measured displays, without an
independent animation loop or fabricated activity.

## Eight research gates remain separate

The original Humunculus proposal's page-22 gate ledger is retained in
[`ALIVE_ENGINEERING_PLAN_2026-11-09.md`](ALIVE_ENGINEERING_PLAN_2026-11-09.md).
Continuous execution does not remove its independent evidence requirements:

| Gate | Required next experiment |
| --- | --- |
| G1 Neural execution | Independent backend tensor/sequence parity with declared precision, model version and accepted tolerances. |
| G2 Responsive control | Complete policy-call and scheduling latency, p95, deadline misses at a declared control rate, queues and memory under representative rendering load. |
| G3 Useful navigation | Versioned unseen tasks, fixed episodes and rewards, failures/collisions/stuck time, matched frozen and heuristic baselines. |
| G4 Learning/adaptation | Independently trained seeds, changed-condition advantage, retained-task limits, parameter/optimizer provenance and uncertainty intervals. |
| G5 Curriculum/router | Matched-compute curriculum and routing comparisons, relevant ablations and sample-efficiency costs. |
| G6 Persistent entity | Declared identity/memory/body/recurrent/learned state across restart and acknowledged independent-peer handoff. |
| G7 Speech | Versioned clean/noisy clips, recognition error, turn latency, intelligibility and interruption behavior. |
| G8 Body/FlyWire transfer | Versioned subcircuits/morphologies/tasks, intact/ablated controls, native reproduction and browser parity. |

Keep unrun gates NOT_RUN. A local successful promotion, displayed feature,
scheduled report or working service connection cannot silently pass a full gate.

## Validation and next measurements

The visual module's focused test file,
`tests/alive-faculty-visuals.test.cjs`, executes the production UI with a minimal
DOM fixture and verifies: closed/hidden polling exclusion, one timer, safe source
text, preservation of expansion, actual numeric traces, bounded history, clock
conversion, missing data, error reporting, cleanup and focus restoration. The
integration report records the final test count and browser result after the
owning startup loader includes the module.

The final isolated production-Electron probe completed on November 9 with **18/18
checks passing** on Electron 45.2.3 / Chromium 156.0.8078.80 / Node 24.22.2,
Windows x64. It loaded all 36 capabilities, passed a real acknowledged fixture
observation into shared faculties, populated ten architecture readouts, executed
three Ghost roles, and queued six frontier candidates (90 to 96). The resulting
1,439-character notebook passed exact local-storage readback; the fixture input
remained unchanged. Repeating enabled DOM warp was idempotent, the guest
acknowledged it, and disabling restored the transform. Actual Chromium
CSSStyleDeclaration cases also preserved an important transform with a lone
transition duration, mixed longhand priorities and untouched transition behavior,
and page-authored value/priority changes made during an enabled warp.

The probe held a real memory execution and dispatched two same-ID terminal
events over the renderer's event channel, including a clone carrying matching
scheduler markers. Fabric rejected both, retained the open execution span and
unchanged learning credit, then accepted the real adapter outcome after release.
The existing inspector, Brain evidence and Fabric panels were mutually exclusive.
Both new panels occupied a 690-pixel dock beside the 750-pixel guest in a
1,440-pixel CSS viewport, with no overlap. Pause drained coordinator and guest
work to zero pending operations.

The same run inspected 726 returned tensors containing 1,406,015 numeric values
(5,494,212 copied bytes); all returned tensors had finite values. Its collector
reported 53 traversal omissions under its object/depth/size bounds. This is not
a whole-application parameter census. The general evidence panel, an expanded
tensor panel and the Fabric analytics panel were captured and visually inspected.
The native test
window was transparent, non-focusable and ignored mouse input; production smoke
mode used an isolated temporary profile, disabled inference providers/downloads,
and allowed only the owned loopback fixture. No public-web or neural-language
inference quality was tested. Raw final captures and exact inspected source
hashes are retained in `research_notes/continuous-cognition-final/`. All 13
recorded source files remained unchanged during the successful run; later changes
must be checked against that source record before reusing these results as
final-build evidence.

The earlier failed browser report is preserved separately in
`research_notes/continuous-cognition/`. It caught repeat-enable warp changes
caused by repeated collider hit-testing. The corrected implementation enrolls
unique target elements before applying geometry and retains that enrollment for
the enabled session. The final browser run verified the correction as well as
the CSS declaration restoration cases.

The focused visual suite passed **8/8 tests**, including reachability of tensor
rows beyond the first page. The companion Fabric visual suite passed **8/8
tests**, including elapsed-time rates, real concurrency, hidden/closed lifecycle
and disposal. The isolated probe command is:

```text
node scripts/alive-continuous-cognition-probe.cjs
```

The next useful measurements are an actual browser session with every new
capability producing either a receipt or an explicit blocker; unseen navigation
and retention benchmarks; controlled fusion/router ablations; and independent
backend/restore parity. More visual labels or larger allocated buffers are not
substitutes for those measurements.
