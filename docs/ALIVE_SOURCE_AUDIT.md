# ALIVE runtime and model evidence review

Review date: 2026-11-08 (America/Los_Angeles).

This review follows the shared scheduler, capability UI, model federation,
coupling module, learning evidence overrides, and relevant guest observation
paths. It is a focused source review and regression check, not a claim that every
file in the bundled donor repositories has been independently validated.

## Repairs made in this review

- Structured adapter failures now receive exponential retry backoff, just like
  thrown failures. A provider returning `{status: 'error'}` previously retried at
  the normal cadence despite an increasing error count. A successful outcome
  resets failure backoff.
- Host suspension is sampled even when every execution slot is occupied. A
  stalled operation previously prevented the scheduler's suspended flag from
  reflecting a hidden host. The toolbar now distinguishes running, suspended,
  and paused states.
- Snapshots identify the execution lane, elapsed time, cancellation, timeout,
  and the specific operations holding another capability's lane. Locks remain
  occupied until physical work settles; timeout does not permit duplicate
  mutations. Last successful evidence and current attempt completion have
  separate timestamps.
- Controls show observed versus executed outcomes, waiting dependencies, retry
  delays, and an Attention filter. The research view reports actual frontier,
  page/domain, online-update, and recovery counters. The configured language
  planner joins the scheduler roster as the thirtieth capability.
- The transport badge distinguishes SOCKS readiness from a verified onion load.
  A loaded label requires the backend's successful uncached network evidence,
  an onion destination, the configured SOCKS route, and a matching currently
  active page URL. A historical onion result cannot label a clearweb page as
  current onion browsing. SOCKS negotiation alone does not identify the daemon
  or establish Tor relay identity or anonymity.
- Initialized brain objects now report zero completed brain execution until a
  full fourteen-module step finishes. Snapshots label initialized versus
  computed state and explicitly scope the local JavaScript implementation.
- The feature catalog now exposes its availability count separately from a
  zero verified count and NOT_RUN verification status. Black-hole geometry
  updates have their own numerical counter and no longer inflate the learning
  update counter. The remaining compatibility counter is explicitly labeled as
  learning-rule update attempts, not measured distinct changes or evaluation gains.
- The local organ gradient and consciousness-themed projections now carry
  implementation labels. The latter headline says feature projection rather
  than claiming a measured Phi. Array values and underlying algorithms remain
  intact. Checkpoint metadata no longer invents a first backpropagation step or
  an extra previously saved checkpoint when their real counters are zero.

## Actual model integration found

The follow-up audit found that `activeSpecialists` previously controlled only a
displayed list. `systems/alive-specialist-fusion.js` now makes that selection affect
the two consumed motor logits through a bounded residual of five existing numerical
readouts. Causal tests execute the production closed-loop method and show selected
source influence, exact baseline recovery under full ablation, unchanged engine
call counts and an unchanged checkpoint tensor roster. Gates remain heuristic;
this does not establish learned Option-Critic or independent task advantage.

`systems/ported-multiverse-brains.js` creates fourteen local numerical modules
and steps their states. Several contain real mutable weight arrays and explicit
learning rules. Their federation combines selected outputs into the shared
two-dimensional motor readout.

`systems/alive-neural-coupling.js` additionally projects twenty-four bounded
computed streams into the shared hub. Those streams cover fourteen local brain
modules, seven precision computations, micro Ising state, and two computed
Omega dynamics. The coupling has 384 projection weights, 24 gate logits, and
explicit feedback counters. Constructor seeds are not counted as exercised
federation sources. None of these dimensions establishes the capability implied
by a historical model name.

`systems/alife-learning-evidence.js` supplies measured simulated steering
training with held-out and retention trials, rollback on failed promotion,
observed-transition dream replay, and a signed intact-versus-ablated ring
comparison. The acceptance report preserves NOT_RUN results for missing
independent tests. In particular, simulated steering is not an unseen-webpage
navigation benchmark, and the ring comparison is not a validated full FlyWire
brain simulation.

## Source distinctions and remaining legacy semantics

The following source facts were found during the review. They must not be
promoted to scientific or performance evidence merely because the UI has a
matching control:

| Source area | What executes | Limit on the historical name or number |
| --- | --- | --- |
| `CqmSuperMind5StageEngine` in the federation | Hand-written JavaScript derivatives update a 240-element organ-weight array | The catalog and telemetry now state that external Eshkol is not used; legacy internal property names are retained for compatibility |
| `ConsciousnessResearchersConsortiumBrain` | Ten projections of an 80-element weight array produce bounded feature scores | `tononiIntegratedPhi` remains a compatibility property for a projection score; telemetry explicitly says this is not IIT Phi or a consciousness test. Other legacy inspector labels may still use the older name |
| `KerrNewmanBlackHoleBekensteinPageBrain` | Geometry and entropy scalars are recomputed, with an evaporation clock | These updates now increment `numericalUpdatesCount`, not `plasticUpdatesCount` |
| Federation constructor and telemetry | Fourteen objects are allocated; later stepping executes their numerical updates | `activeBrainsCount` remains zero until a full step completes; the initialized headline no longer claims measured 60 Hz training |
| `SiblingBrainFusionEngine` | At most 64 selected neurons and 512 selected edges are stepped in its compact C. elegans reservoir | Corpus source counts of 302 neurons and 7,379 edges are not the executed reservoir dimensions |
| `AlifeNeuralCyberEngine` constructor | Registers a 25-item feature catalog | Availability is now 25, verified count is zero, and independent verification status is NOT_RUN |
| Repeated guest observation/effect scripts in `index.html` | DOM candidates are selected and inspected, then bounded result sets are returned | A `.slice()` after mapping or layout inspection does not bound the preceding traversal cost |

For the DOM paths, bound candidate inspection before layout and text extraction,
not only the returned result. JavaScript timeouts cannot preempt a synchronous
DOM traversal already executing in the guest.

For model claims, retain raw algorithm/state evidence and distinguish initialized
values, executed updates, successful held-out promotion, and independent
validation. Current numerical integration can be functional without establishing
sentience, omniscience, physical quantum computation, or universal intelligence.

## Focused regression checks

Run:

```text
node --test tests/alive-overdrive-runtime.test.cjs tests/alive-workspace-status.test.cjs tests/alive-model-claims.test.cjs
node scripts/smoke_master_audit.js
```

The checks cover retry timing and recovery, occupied-slot suspension, retained
execution locks, evidence timestamps, status presentation, observed exploration
counts, and rejection of stale or unverified onion labels, alongside the
existing runtime concurrency, fairness, cancellation, and bounded-log cases.
All 28 focused tests and the master smoke audit passed during this review.
Model-claim tests also inject a failed federation step and distinguish allocated
models, completed execution, numerical updates, and independent verification.
An actual Electron probe remains necessary to assess full-page rendering,
provider availability, and end-to-end network behavior.

## 2026-11-09 reasoning-evidence follow-up

The live metacognition formatter previously advertised roughly 99% omniscience
from an affine numerical feature and incremented a purported theorem count every
thirty frames. It now labels the output as local numerical features and generated
unverified hypotheses. The independently proved theorem count starts at zero and
does not increase on a timer. The local motor-impulse count increases only when
that method actually applies an impulse to the host creature. Existing tensor,
gradient, joint-torque and feature calculations remain intact. The compatibility
field `omniscientSheafPct` remains an affine coherence feature; it is not a measured
percentage of knowledge or calibrated certainty.

The encoded-CNF solver still executes its satisfiability calculation. Its previous
prose formatter claimed a deductive proof even for disconnected rules or an UNSAT
result, and described unsatisfied clauses as a resolved MaxSAT problem. The report
now preserves SAT versus UNSAT, identifies the assumed root premise and synthetic
fallback rules, and explicitly leaves source-text truth and deductive entailment
unverified. The returned assignment's clause-satisfaction ratio is not a MaxSAT
optimum. Startup distinguishes unexecuted CNF checks from the legacy numerical
control prior. This is a correction of evidence labels and counters, not a new
proof assistant or an independent validation of the inherited equations.

`tests/alive-reasoning-evidence.test.cjs` executes the production metacognition and
CNF methods, checks contradictory and disconnected rules, verifies synthetic-rule
provenance, and confirms that neural/motor state still changes while narrative
counters cannot change those computations. The focused reasoning, model-claims,
and specialist-integration run passed all 25 tests, including preservation of the
computed geometry/integration features when Overdrive is enabled.

The follow-up also removed invented missing-snapshot values from brain-federation,
AoT/ToT/GoT, DSD and learning displays. Precision summaries require a successful
kernel receipt; absent or partial snapshots show unavailable/unmeasured while
real zero and false values remain visible. Missing DSD clone histories cannot
invent a clone. The policy and FlyWire benchmark displays read measured learning
evidence instead of constructor-seeded promotions or ablation wins. Missing
metacognition is explicitly unavailable. Every direct Deity-composite display
identifies a local simulation feature, and opening its inspector cannot start a
missing model. Its numerical formula is unchanged and remains unvalidated as a
scientific or intelligence measurement. Ten executed-formatter regression cases
cover missing snapshots, partial state, actual zero values, read-only inspection,
and measured negative benchmark outcomes.
