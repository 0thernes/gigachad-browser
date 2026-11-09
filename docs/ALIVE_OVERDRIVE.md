# ALIVE Overdrive runtime

See [adaptive research and real backend integration](ALIVE_AUTONOMY.md) for the learned research frontier, local language specialist, managed Tor client, and current network-evidence requirements.

ALIVE is a shared scheduler for the existing creature model and browser effects.
The **Start overdrive / Pause** control owns its lifecycle. **Controls** contains
the searchable actions; **Inspect** and **Logs** open beside the page. The default
page view contains creatures and visual effects without the repeated control
strips, terminal HUD, or canvas analytics. Canvas analytics are optional.
Normal launches start overdrive automatically. The delayed boot action respects
any earlier explicit Start or Pause instead of overriding the user's choice.

The scheduler keeps the model faculties enabled together, while spreading action
work across time. It does not execute every expensive command on every animation
frame. One mutation runs at a time; repeated requests coalesce, unresolved work
keeps its lock, failures remain visible, and slow operations back off. Rendering
and the continuous neural step have separate cadences. Pause stops autonomous
jobs and continuous neural stepping, and fences stale results. A manually
requested single action can run while autonomy stays paused. An already
dispatched browser navigation cannot be undone.
One visible host colony is rendered against the browser frame clock. Guest
contact, feeding, and offspring simulation continues at up to 20 Hz without
rasterizing a duplicate hidden colony. Raw guest scripts keep their locks after
caller timeouts; a committed document replacement or removed tab retires only
that old guest's work.
Auto-Hop governs creature-initiated navigation, including legacy navigation
paths and forced dwell bypasses. Automatic query synthesis targets search fields
and preserves focused or user-modified values; with Auto-Hop off it does not
dispatch the page's input handler, which could initiate navigation.

All pellet producers enforce the existing limits of 14 host pellets and 12 page
pellets. Trimming removes the oldest excess entries in place, preserving shared
array identity and the order of the newest pellets. Feed still creates three
pellets per realm when page execution is acknowledged; an existing backlog is
repaired even when no creature consumes it. This bounds retained drawing and
contact-search input; it is not a measured frame-time improvement.

Feed counts offered pellets separately from consumed pellets. Offering food no
longer invents two meals, nine experience points, or immediate glucose/ATP gains.
Existing contact handlers own actual consumption and its simulated physiological
effects. A missing or unacknowledged guest contributes no offered-page count.

### Measured exploration and both visible panes

`systems/alive-page-exploration.js` replaces random repeated short scrolling with
a viewport-sized advance influenced by the current motor action. A subsequent
observation must confirm actual movement. Pending smooth scrolls retain their
command identity through fast polls. Two failed commands mark the page blocked;
changing ticker text cannot disguise that failure. Reaching the end of a document
marks exhaustion instead of reversing into a permanent up/down cycle. Fresh user
input or a focused editable control yields scrolling; finite page exploration
receipts feed the research policy's document-bound adaptive dwell decision.

The host renders three principal bodies in the primary pane and two in the
secondary pane. Pane ownership constrains actual position, target selection,
formation leadership and pellet hunting. The secondary pane has its own bounded
DOM observation under an acknowledged auxiliary guest lease. Its real colliders
influence its own leader, while the primary model and shared motor readout remain
common. Secondary observations do not create primary-page arrival or learning
credit. This is one shared model with two visible body groups, not two independent
language-model agents.

`systems/alive-habitat.js` clips measured rectangles into the visible pane. The
shared collider cache prunes revoked, loading, closed, swapped or resized document
geometry before any model or drawing reader can consume it. Empty/currently
unobserved space may use procedural visual targets; those are not page evidence.
The page-effect subsystem no longer adds a competing autonomous micro-scroll.

## Capability connections

| Requested control or architecture | Coordinator ID | Connection |
| --- | --- | --- |
| 14 Brain × 7 Precision | `brains-precision` | Ported model federation and computed precision kernels feed the shared neural hub through bounded learned gates |
| Checkpoint CID | `checkpoint` | Coherent tensor copies, SHA-256 hashes, CIDv1 manifest, IndexedDB persistence |
| 9D Soul Surge | `soul-surge` | Shared mesh torsion, neuromodulation, and rejection damper |
| Grover Collapse | `grover-collapse` | Classical amplitude simulation selects a fresh observed page door |
| Portal Jump / Concept Dive | `portal-jump` | Uses that selected door or current concept query; navigation guard, dwell time, and tab bound; legacy shortcuts use the same coordinator |
| Spawn DOM Body | `dom-body` | Page perception, articulated body, effects, closed-loop model update |
| AoT / ToT / GoT | `reasoning` | Shared existing reasoning engine, stepped through the model |
| Decursive DSD-24 | `decursive` | Existing deduplication and weight/DOM intervention |
| Feed | `feed` | Habitat pellets and model glucose/dopamine |
| Formation | `formation` | Shared swarm formation |
| Procreate / Mitosis Split | `procreate` | Shared offspring colony, capped at four autonomous offspring; zero birth fitness, morphology selection after observed pellet contacts |
| Eldritch Morph / Mutate Body | `morph` | Actual morphology and controller conditioning |
| Dream SWS / Dream Replay | `dream` | Bounded recorded state-transition replay, measured held-out error |
| Deity 100 | `deity` | Existing local numerical feature and browser-effect model |
| Zalgo Fuckery | `zalgo` | Existing page glyph and wireframe effects |
| Neo Matrix | `neo` | Existing neural intent puppeteer; expensive actions share the coordinator |
| Train Policy | `train-policy` | Deterministic simulated steering training and separate evaluation seeds |
| FlyWire A/B | `flywire` | Matched-capacity intact/ablated ring simulations |
| Epoch Handoff | `epoch-handoff` | Destination-acknowledged guest execution leases within one browser host; the model remains shared in the host, with no distributed writer-fencing claim |
| 8 PDF Gates | `acceptance-gates` | Full acceptance requirements remain NOT_RUN; partial timing and single-candidate learning diagnostics are separate |
| Onion | `onion` | Fresh SOCKS negotiation and applied route; document-scoped onion HTTP evidence reported separately |
| Omega 100 | `omega` | Existing local numerical feature model |
| Deep Dark Dive | `deep-dark-dive` | Fresh backend probe; unavailable backend is reported explicitly |
| Macro: 14 Regions / RIM Router | `macro` | Shared mesh regions and specialist routing |
| Meso: 112 sLTC × SSM / Apical NMDA | `meso` | Actual mesh column and eligibility arrays |
| Micro: Moonlab Q3, QGTL, QRNG, Eshkol, FlyWire Ising | `micro` | Local numerical model state and declared implementation scope |
| Body + Curriculum: Stages A–F + Viscera | `body-curriculum` | Current stage in the sequential six-stage curriculum, morphology, and allostatic state |
| 512-CONN × 262K-SYN × sLTC / SSM × Onion | `connectome` | Tensor dimensions, STDP updates, and neural-hub training counters |
| DSD-24 × Cl(4,0) × Millennium | `millennium` | Shared mathematical feature and metacognition state |

The thirtieth job, `research-plan`, invokes the configured local language model for research goals and queries; observed navigation outcomes train the separate small ranker.

Aliases refer to the same shared action, rather than launching duplicate loops.
Model observations report in-process state; observing a field is not independent
validation of the scientific claim suggested by its historical name.

## Guest execution authority

The authority coordinator reserves an epoch and closes admission before changing
the selected creature document. It revokes prior leases through a reserved control
lane so guarded callbacks stop even if a normal script's promise remains pending.
It then waits for physical guest executions to settle and requires the destination to acknowledge its session,
revision, document nonce, document generation, and epoch. Only then does the host
commit the handoff and admit new creature work. Browser tab selection itself stays
immediate. A failed or superseded handshake leaves creature admission closed;
the observation job can retry once the document is ready.

The executor checks authority before dispatch and before accepting a result.
Creature callbacks use the guest guard and register their own cleanup on
revocation. Pause and document replacement invalidate prior authority. Returning
to the same tab or URL does not restore an earlier token. A bounded manual permit
can execute one requested transaction while autonomy remains paused; it does not
authorize recurring callbacks or become available to automatic jobs. Explicit
auxiliary grants support effects across multiple ready tabs in the same epoch.

This protocol coordinates app-issued guest work in a single browser process
tree. It is not a security boundary against hostile page JavaScript, a transfer
of model tensors between machines, or proof of distributed split-brain freedom.
The handoff record names an actual persisted checkpoint only when one exists.

## Learning and persistence

The neural coupling module samples numeric state from all fourteen local brain
instances, seven computed precision families, the micro Ising state, and two
Omega streams containing computed Lorenz and Izhikevich state. It
feeds bounded contributions into hub sensory input, world latent state, and motor
thrust. Its trainable weights and gate logits are model tensors included in the
checkpoint. Gate updates use prediction-error change after successful page
observations. This is a local reward-modulated learning rule, not independent
causal attribution or evidence of a scientific claim implied by a model name.
The seven sources come from computed kernels; allocating a precision arena by
itself is not reported as seven active neural backends.
Private execution receipts now admit each precision computation only after it
has actually completed on that engine instance. Seeded or restored hub counters,
early returns and failed kernel calls cannot activate those streams. Float32
Mamba has its own completion receipt. A guest-authority change or checkpoint
restore establishes a fresh coupling-reward baseline before any gate update.
Omega's two streams become available only after their numerical states have been
stepped. Seeded constants, confidence percentages, and status strings are excluded.
The resulting 24 streams use 384 projection weights and 24 learned gate logits.
The canonical type families are Float64, 64-bit integer, 32-bit integer, 16-bit
float, Int8, packed ternary Uint8, and Float32. The current 16-bit path uses FP16;
this does not establish use of the separate BF16-gradient, CSR, or external Zig
paths named elsewhere in the original models.

The policy evaluation uses disjoint training, test, and retention seeds in a
bounded simulated steering environment. Reported deltas come from executed
trajectories. A rejected candidate restores its weights. This does not establish
general intelligence or success on unseen websites.

Dream replay requires explicitly tagged, timestamped observations from a successful
current-page commit. Placeholder and proprioceptive ticks cannot enter its replay
buffer. The body uses the preceding measured policy action until the next page
observation arrives, avoiding the former extra fabricated training tick.
Tab or authority-epoch changes break replay continuity, preserving the earlier
valid episodes without inventing a transition between unrelated guest contexts.
Each transition keeps its original training or heldout membership as the bounded
window advances; an earlier holdout cannot later enter replay gradients. These
temporally correlated, repeatedly evaluated observations remain a local diagnostic,
not an independent generalization benchmark.
It compares prediction error on
held-out transitions and can reject an update. FlyWire A/B reports the measured
signed difference; a positive advantage is not guaranteed. Policy latency is a
sample percentile without the previous artificial ceiling. It excludes frame
rendering time, which is measured separately by the browser probe.

Offspring begin with zero observed fitness. Guest pellet contacts supply their
cumulative score; after six contacts (2.1 score units), the runtime can select
that offspring's morphology. This does not assert superiority to a parent or
inherit policy weights: the earlier random parent-weight perturbation has been
removed. Opening the forensic Inspect view only displays a cached diagnostic or
NOT_RUN. The detached `npm run audit:25x10` command remains available separately.

Checkpoint capture includes policy, cortex, neural hub, connectome, world, mesh,
FlyWire, DSD, metacognition, sLTC, reasoning, and ported brain tensors. The **Restore
latest checkpoint** control requires a paused and settled runtime. It verifies
the manifest and every tensor, validates destination shapes before writing,
reads the applied bytes back, and advances the authority epoch. This is a model
tensor/body checkpoint, not an exact replay of all runtime scalars or browser
history. Capture traverses explicit roots with bounded depth and deduplicates
objects; it is not an exhaustive learned-state registry. Tensor count depends on
the arrays present at capture time, including replay contents. The observed
560-tensor test snapshot is therefore not a fixed schema or proof that all nested
engines and learning-continuation state are covered. Only the latest persisted
snapshot is retained. The original organism
adapter has its own separately tested complete-state checkpoint contract.
Checkpoints from the earlier 22-stream coupling have incompatible tensor shapes
and are rejected before writing; capture a new checkpoint for the 24-stream model.
The legacy persistent-genome JSON contract is unchanged.

The last bounded scheduler event history is saved locally. Logs distinguish
`completed`, `observed`, `blocked`, `unavailable`, `error`, and `timeout`.
Legacy genome autosaves coalesce repeated requests and capture a coherent copy
of the latest state during an idle opportunity, with a capture deadline two
seconds after the first pending request (host blocking can delay timer delivery).
A dedicated worker performs decimal formatting and JSON serialization, including
the original organism envelope's negative-zero encoding and UTF-16 checksum.
Native organism snapshot capture remains synchronous because it reads RNG closures
and the donor's snapshot rules. The public synchronous export and import contracts,
saved schema, and generated donor digest are preserved. Capture and worker
dispatch share one synchronous call stack. `postMessage` copies the payload
before returning, without an additional explicit clone or transfer list; the
model keeps its live arrays. The worker rejects shared backing stores before
encoding, so accepted asynchronous snapshots have isolated memory. The existing
JSON payload is preserved. The main process asynchronously writes it to a
same-directory temporary file, syncs that file, renames it to
`alive-genome-v1.snapshot` in Electron's user-data directory, and independently
reads back its header, UTF-8 length, SHA-256 digest and exact payload. The bounded
header includes a monotonic revision. Recurring genome saves no longer write the
large payload to renderer `localStorage`. This rounded genome subset is separate
from the broader explicit-root tensor checkpoint; neither format establishes
complete runtime learned-state continuity.

Only one serialization or commit owns the save slot at a time. Renderer-owner,
epoch and job identities fence stale results. Checkpoint restore preflights shapes,
awaits physical storage drainage, rechecks runtime and guest admission, applies the
checkpoint, then awaits a verified publication. A storage failure after model
application is reported as an in-memory restore with unverified persistence.

Startup uses one restricted preload bootstrap before the synchronous constructor
restore. Legacy local storage is read once only when the canonical file is absent
and is retained as a migration backup. A corrupt or unreadable canonical file
blocks replacement writes. Delayed seed-weight loading cannot overwrite restored
or subsequently changed learned tensors. One normal application instance owns the
profile; smoke runs use isolated profiles.

Page hide and unload request asynchronous saves. Normal window close stops new
model work, awaits the final save and a held storage fence, then acknowledges its
receipt. The main process matches that acknowledgement to its own verified commit,
drains physical I/O and records `alive-genome-shutdown.json`. An eight-second
deadline reports an unverified close rather than claiming the newest state saved.
This protocol does not establish survival of an operating-system or power failure.
Durable-mode `flushSync()` reports `async-required` with an awaitable promise.

An unavailable or failed worker uses a fresh synchronous encoding fallback followed
by the same asynchronous file commit; its mode and reason remain visible. Logs
separate host capture/dispatch time, worker serialization, asynchronous commit
latency, round-trip delay, verified writes, and failures. File I/O elapsed latency
is not reported as renderer blocking time.
Worker serialization time includes received-graph validation. A rejected shared
graph uses the same fallback; synchronous saving does not add a cross-thread
atomicity guarantee for models using shared memory.
The host duration total adds phases separated by the worker boundary; it is not
a measurement of one continuous blocking callback.
Storage failures also appear in the compact status bar. This does not change
the explicit verified IndexedDB checkpoint operation. Callers without the new
capture/storage contract retain the original legacy saver, whose swallowed
errors cannot be promoted to verified persistence.

## Verification

- `npm run test:alive`: scheduling, concurrency, pause, cancellation, adapters,
  raw guest lifecycle, neural coupling, checkpoint verification, measured
  learning, and diagnostic evidence tests.
- `npm run probe:alive`: isolated actual-Electron run and JSON/screenshots under
  `research_notes/alive-overdrive-verification/`.
- `npm run smoke`: existing application checks.

The probe supports `GIGACHAD_PROBE_VISIBLE=1` for a visible isolated test window,
`GIGACHAD_PROBE_GPU=1` to preserve normal GPU availability, and
`GIGACHAD_PROBE_MS` for the sample duration. Hidden windows and software rendering
must be identified when interpreting frame measurements. The probe disables
external providers; unavailable services in that run are not proof about the
user's configured live services.
For visible loopback-fixture measurements, `GIGACHAD_PROBE_INPUT_ISOLATION=1`
with `GIGACHAD_PROBE_FIXTURE=1` and `GIGACHAD_PROBE_FOCUS=0` makes the temporary
window non-focusable and mouse-transparent before showing it. The report records
that configuration and rejects observed input or focus that violates it.
This option affects only the verification window. It prevents desktop interaction
from accidentally changing the measured workload; it is not an interaction test.
The local verification readout at
`research_notes/alive-overdrive-verification/READOUT.md` retains exact historical
source snapshots, frame measurements and limits. Raw captures remain local; see
the public [release record](RELEASE_2026-11-09.md) for the shipped validation scope.

Sentience, consciousness, omniscience, omnipotence, physical quantum execution,
and external Eshkol execution are not established by this integration. A Tor
SOCKS port probe does not prove a usable Tor circuit or onion reachability. The
eight acceptance gates retain their independent evidence requirements; wiring
the gate runner is not the same as passing all eight.

The five-name Macro specialist selection now gates bounded numeric contributions
to the two consumed motor channels through `alive-specialist-fusion.js`. Existing
NMDA/macro, world residual, FlyWire steering, QGT/Berry and allostatic readouts feed
the fusion; Overdrive can use all five. The Macro evidence exposes actual gates,
contributions and before/after motor receipts. This is heuristic selected-readout
fusion, with no new learned parameters or checkpoint tensors; it does not establish
trained Option-Critic routing or the pending matched-baseline G5 advantage.
