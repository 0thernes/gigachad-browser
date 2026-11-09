# ALIVE SUPERINTELLIGENCE — engineering plan

Status: **superseded historical draft 1** - 2026-11-09

This draft retains an earlier audit and proposed design. Its present-tense
findings, source line numbers, counts and proposed behavior are not current
release assertions. Later work repaired multiple scrolling, split-pane,
telemetry and startup defects and changed the coupling roster to 24 streams /
408 trainable coupling parameters. Some proposed persona/research features remain
separate work; this draft is not a completed implementation checklist.
Use [the release summary](RELEASE_2026-11-09.md),
[the engineering ledger](ALIVE_ENGINEERING_PLAN_2026-11-09.md), and
[the source-bound results](ALIVE_UPGRADE_RESULTS_2026-11-09.md) for current scope.
The eight PDF gates and full-state continuation remain unqualified.
Paths under `research_notes/` identify local-only evidence excluded from published source; they are not public download links. See [the release summary](RELEASE_2026-11-09.md) for current release scope.
Scope: make the creature autonomously, verifiably operational — fast, dual-pane,
model-driven, and free of placeholder claims.

This plan is grounded in a 9-dimension forensic audit of the live tree plus the
three reference PDFs (Humunculus design v0.1, GIGACHAD Deep Dive, Illustrated
Field Guide). Every item below cites the file and line it changes.

---

## 0. What is already real (do not rebuild)

The audit refuted a lot of pessimism. These subsystems are genuine and stay:

| Subsystem | Evidence |
| --- | --- |
| Managed Tor + onion routing | Real `tor.exe` child process, real bootstrap parsing, SOCKS5 handshake probe, fail-closed PAC applied to `persist:gigachad_vault` — the exact partition every tab uses. A real Electron webview loaded `pzhdfe7…onion` HTTP 200 over `SOCKS5 127.0.0.1:16546`, screenshot retained. `systems/alive-tor-service.cjs`, `systems/deep-web-transport.js`, `main.js:118,535,840-852` |
| v3 onion address validation | Full base32 decode + real SHA3-256 checksum. `deep-web-transport.js:18-31` |
| Local language model | gemma-4-E2B-it on `127.0.0.1:18080`, real completions producing research goals/queries. `research_notes/alive-autonomy-audit-2026-11-08/live-local-inference-final.json` |
| Navigation ranker | Online 16×12×1 tanh model with gradient updates, frontier, novelty features, onion gating. `systems/alive-research-policy.js` |
| Neural coupling | 22 streams × 16 features = 374 trainable params, eligibility traces, reward-driven updates. `systems/alive-neural-coupling.js` |
| Specialist fusion | Selection **is** causal here — `selected[source] && available[source]` gates each contribution. `systems/alive-specialist-fusion.js:96` |
| Authority / epoch fencing | Real exclusive primary lease + sanctioned concurrent **auxiliary** leases (up to 8 tabs). `systems/alive-authority.js:137-143,311-329,391-396` |
| Capability scheduler | Real cooperative scheduler with budgets, timeouts, in-flight caps. `systems/alive-overdrive-runtime.js` |
| Autostart | Overdrive genuinely starts 650 ms after boot. `index.html:25524-25534` |

All 30 declared capabilities have a registered adapter with a real `run()` —
verified programmatically against the capability table. Nothing is unregistered.
Swarm formations are real geometry (`index.html:24286-24301` has genuine target
offsets per formation), not labels.

The problem is not that the machinery is fake. It is that the machinery is
**throttled, single-pane, partly unreachable, and in a few places reports
floors instead of measurements.**

### 0.1 The five findings that matter most

1. **The visible creature's limbs run on a sine clock, not the cortex.**
   `index.html:24775-24796` drives every limb from `gaitPhase = st.tick * 3.2`
   with zero neural terms. The cortex's 24 joint torques (`act32[0..23]` →
   `verletPhysics.jointTorques24`) reach only the **guest** creature — which is
   permanently invisible, because `host-alife-viewport-canvas` is static markup so
   `__aliveRenderInHost` is always true, the guest canvas is `display:none`, and
   its 2D context is swapped for no-op stubs. There are **zero** occurrences of
   `jointTorques` / `act32[` / `masterCmd64` anywhere after `index.html:23943`
   (the host renderer). This is the single biggest reason the creature does not
   feel neurally alive.

2. **The coordinator's mere existence deleted the entire chaotic 60 Hz layer.**
   `window.aliveOverdrive` is assigned at module load, so every
   `!window.aliveOverdrive` guard is permanently false. That silently disables the
   four chaotic strange-attractor pulses (whose own comment reads "zero fixed
   metronome!"), the 14-frame closed loop, the 90-frame ambient DOM step, and the
   whole autonomy watchdog (`startAutonomyWatchdogAndSelfHealer` returns
   immediately on every boot). Guards at `index.html:23754, 23767, 25037, 25049,
   25061, 25073, 20122, 19791`. **This is what the user remembers losing** — "it
   blasted through pages like a psychopath" — the wild layer is still in the
   source and simply unreachable.

3. **`dream` fabricates a learning improvement and injects it into the live
   reward.** `index.html:16662-16664` assigns
   `this.worldPredError = Math.max(0.024, this.worldPredError * 0.65)` — a
   hardcoded 35 % improvement — then reports the "before → after" delta it just
   invented. `worldPredError` is the actual reward term
   (`index.html:17251`, `17092`), and `neo` fans out to `dream`, so this
   fabricated number propagates into live learning. Most consequential defect found.

4. **Cadence is a metronome by construction.** Simulated against the real
   capability table: `dom-body` runs at **0.52 Hz** (mean gap 1922 ms, start times
   100, 1950, 3800, 5650, 7500, 9350 ms). Three compounding causes —
   `nextDueAt` is set from *completion* so the real period is `intervalMs +
   runDuration`; `budgetMs: 5` is reused as a per-adapter throttle *divisor* so a
   20 ms synchronous prefix multiplies the interval 4× (measured collapse to
   0.15 Hz); and **19 of 30 capabilities share one `mutation` lane**, so speeding
   up any sibling starves `dom-body`. Raising `maxInFlight`/`maxStartsPerTick`/the
   tick to their clamp maxima moved it only 0.407 → 0.435 Hz, so those knobs are
   *not* the bottleneck.

5. **Destination diversity is structurally tiny.** The 57-entry catalogue is
   **38 en.wikipedia.org (66.7 %)** and 42 wikipedia + arxiv (73.7 %), across only
   16 distinct hosts. Live selection is `research.choose()` — a deterministic
   argmax with a lexicographic tiebreak — and every chaotic sampler is unreachable
   because `window.aliveResearch` always exists. That is "same shit same pages",
   quantified.

---

## 1. Defects confirmed by audit (with line numbers)

### 1.1 The three the user reported

**(a) "timed loop scrolls short distances"**
- `systems/alive-page-exploration.js` stride is ~0.78–1.22 viewports, which is fine,
  but it is issued at most once per `dom-body` tick (**1400 ms**,
  `alive-overdrive-runtime.js:12`) and each command then blocks for a **650 ms**
  `awaiting-scroll` settle window (`alive-page-exploration.js:45`).
- At `phase: 'exhausted'` / `'blocked'` the policy returns and **nothing requests a
  departure** — it idles until a separate dwell timer expires.
- Net: roughly one viewport every 1.4–2 s, then stall. Reads as a timed loop.

**(b) "creature is only in 1 tab not both split tabs"** — three stacked causes:
1. `performWeirdAlienDomExperiment` has an unconditional active-tab guard:
   `t.id === getActiveTab()?.id` (`index.html:20580`). The dedicated split-pane
   call at `index.html:23441` is therefore **dead code** — it returns `null` on
   every invocation.
2. `__aliveRenderInHost` is always true because the host canvas is static markup
   (`index.html:1953 → 20787`), so every guest creature canvas is forced
   `display:none` and its 2D context swapped for no-ops. Injecting into the second
   webview alone would still draw nothing.
3. The creature proper — ALPHA (`vSwarm[0]`, carrier of `bodyRecipe`, policy action,
   16-ray vision, offspring colony) — is hard-pinned to the left pane by
   `bounds(..., ei > 2)` at `index.html:24260`. Only DELTA/EPSILON (plain dots)
   cross the divider.

**(c) "spends too much time in a web page and is slow"** — stacked dwell gates:
- `alive-research-policy.js:104-107`: `minDwellMs 15000`, `maxDwellMs 45000`,
  `settledDwellMs 6000`, `loadTimeoutMs 25000`.
- `index.html:18916` `dispatchNonBlockingTabNavigation`: `minDwellMs` **5200** (2600
  for newtab), plus `isLoading && sinceStart < 7500` and `!domReady && sinceStart < 5500`.
- Best case ~6 s on a page; typical 15 s; worst 45 s.

### 1.2 Placeholder claims to eliminate ("no BS, no fraud")

| # | Site | What it does | Action |
| --- | --- | --- | --- |
| 0 | `index.html:16662-16664` | **`dream` assigns `worldPredError *= 0.65`** instead of measuring it, and `worldPredError` is the live reward term | Delete the assignment; recompute through the normal measurement path after the `W_world` update. Drop the `Math.max` floor on `learningProgress` |
| 1 | `index.html:17314` | `heldOutDeltaPct: Math.max(1.2, deltaPct)` — held-out improvement **floored at +1.2 %**, can never report a regression | Report the measured delta, sign included |
| 1b | `index.html:17291-17293` | `deltaPct = measured + 11.4` — an unconditional 11.4-point thumb on the promotion gate, so `promoted = deltaPct >= 0` is always true and the rollback branch is unreachable | Delete the bias; require a positive measured delta plus a margin |
| 1c | `index.html:17275-17315` | `retentionPct = 97.4 + 2.2 * confidence` — fabricated, range 97.4–99.6 | Measure retention on the held-out seeds |
| 2 | `index.html:17302` | `heldOutScorePct: min(99.4, 88.0 + max(1.2,delta)*0.65)` — same floor | Report measured score |
| 2b | `index.html:16184, 16191-16193, 16202` | **`flywire` A/B**: the "ablated control" is `Math.sin(t*0.07)*0.9` (no model is ablated), the advantage is floored at `Math.max(14.5, …)`, and the verdict is hardcoded `KEEP_SPECIALIST` | Build a real control: clone the connectome, shuffle the Δ7 ring / zero the P-EN shift, run the identical 48-step protocol. Remove the floor; derive the verdict |
| 2c | `index.html:16217-16226` | `acceptance-gates` returns 8 hardcoded `NOT_RUN` — honest, but evaluates nothing | Implement the gates against evidence that already exists (`lastEvalReport`, `state.lastCheckpoint`, the authority epoch) |
| 2d | `index.html:10904-10907` | `llmCalls: 0`, `tokensUsed: 0` are **literals**, so the "Zero-LLM" audit claim is unfalsifiable — they would read 0 while the planner calls the model every 45 s | Make them real counters, or delete them |
| 2e | `index.html:16858` | `activeSynapsesTraversed` multiplies by 512 and overstates traversal **8×**; the correct count (`stdpCount`) is computed on the next line | Use `stdpCount` |
| 3 | `index.html:17118-17121` | Overdrive hard-pins `iitPhi = 0.9999`, `qgtTrace ≥ 3.48`, `DA ≥ 1.18`, `ACh ≥ 1.12` | Stop pinning Φ; compute it. Keep neuromodulator floors (they are a real drive change) but label them as set-points, not measurements |
| 4 | `index.html:12087-12093` | Hardcoded fake 3-hop circuit `GUARD:0x9F4A_ZURICH / MIDDLE:0x3C8E_REYKJAVIK / EXIT:0xE71B_PANAMA` with invented fingerprints | Delete. No Tor control port is opened anywhere, so real circuit identities are unobtainable by design |
| 5 | `index.html:17839` | Dead circuit-hop render with a shape mismatch that would print `undefined` | Delete |
| 6 | `index.html:19242` | Dead branch reading `torV3OnionAddress`, a field the IPC never returns | Fix to read `addressValidation.hostname` |
| 7 | `index.html:19243` vs label at `17845` | "confirmed onion observations" counter increments on **any** successful transport probe, including plain clearnet browsing | Gate on a verified onion receipt |
| 8 | `index.html:1446-1447, 1863-1864` | `maximum_joker` and `hellraiser_evaluator` are pure labels — **zero** occurrences outside `<option>` tags | Implement both (§3.6) |
| 9 | `index.html:17107, 17132` | `jester_evaluator` has no branch either — it is only the `\|\|` fallback, so **3 of 6** menu entries share one path | Give the default an explicit named branch |
| 10 | `index.html:18675, 19690` | Zalgo/Neo "puppeteer" scrambles the visible toolbar dropdown's `selectedIndex` with no change event — the label lies about the active mode | Route through `syncCreaturePersonaMode` or stop writing it |

### 1.3 Bugs found that the user did not report

| # | Site | Bug |
| --- | --- | --- |
| 11 | `index.html:25531` | Boot autostart sets `superintelligenceOverdrive = true` raw, while both dropdowns still read `jester_evaluator`. The app runs in Overdrive while the UI claims otherwise |
| 12 | `index.html:23448` vs `25219` | Sticky-overdrive latch: stopping autonomy clears the flag but leaves the dropdown set, and 4 of 5 `isOverdrive` sites read the **DOM**, so overdrive geometry persists after stop |
| 13 | `index.html:25219-25220`, `alive-overdrive-adapters.js:485` | Two dropdowns desynchronize because 2 of 4 writers bypass `syncCreaturePersonaMode` |
| 14 | `index.html:17364` | `mutateBodyMorphology` clobbers the stage pin set by `xeno_scientist` / `9d_parasite_soul` |
| 15 | `index.html:18247` | `ALIEN_RABBIT_HOLES[(alienBrainCyclesCount + 1) % length]` — a deterministic modulo round-robin, in a function whose own comment claims "ZERO MODULO LOOPS" |
| 16 | `index.html:25272-25273` | `/joker`, `/xeno`, `/9d` slash commands all collapse to one call that sets no persona |
| 17 | known (`PERFORMANCE_DIAGNOSTIC_PLAN.md`) | Feed and the guest HUD append pellets without the nominal 14-host/12-guest bound; nearest-pellet scans then scale with the backlog |
| 18 | `index.html:24183` | Host overlay `splitX` is computed from the ratio and ignores the 6 px resizer + flex shrink, so clamps sit ~3 px off the real seam |
| 19 | `tests/alive-authority-integration.test.cjs:41-50` | **`node scripts/smoke.js` fails today (exit 1)**: 11 of 378 tests fail on a missing `AlivePageExploration` fixture stub, and because smoke aborts there, the Electron launch smoke at the bottom never runs. `npm run smoke` and `npm run ci` are red |
| 20 | `.github/workflows/ci.yml:36-45` | CI sets `GIGACHAD_SKIP_ELECTRON=1`, so **no automated path has ever launched Electron** |
| 21 | `index.html:20793-20797, 21198-21209` | On any site with a strict `style-src`, both injected stylesheets are refused — the HUD-hiding rule and all wireframe/zalgo styling are silently inert there |
| 22 | `main.js:3055-3076` | `app.whenReady().then(...)` has no `.catch`, and `createWindow()` sits downstream of three awaits — a rejection means no window and no diagnostic |
| 23 | `systems/alive-overdrive-adapters.js:296, 377` | `state.planner` never expires, so a stale model preference keeps biasing every 1.5 s portal-jump indefinitely, across pages and tabs |
| 24 | `index.html:19253, 19265-19267` vs `16708, 16718` | Sidecar and CDP values written into cortex channels `x64[48..55]` / `[56..58]` are **overwritten in the same synchronous step before they are read** — "External Brain #1/#2 feeds the 1.24M cortex" is dead |
| 25 | `index.html:16783-16790, 14229` | The MoE's **training indices do not match the forward layout** (`rOff = r*16`, indices 0–255; forward reads `r*256 + c`), so the weights that are trained are not the weights consumed. 0.39 % trainable, 3.1 % read per tick |
| 26 | `index.html:24780, 24953` | The host renderer writes `verletPhysics.stanceFeetCount` from its procedural gait, racing the real Verlet solver that owns it — so the cortex's proprioception reads an animation |
| 27 | `index.html:15528` | `omega` silently re-runs the entire `deity` tab-strip DOM actuation, so two scheduler lanes overlap |
| 28 | `systems/alive-overdrive-runtime.js:34` vs `adapters.js:437` | `portal-jump` declares 30000 ms and runs at 1500 ms — a 20× contract/behaviour gap the panel reports wrongly |
| 29 | `systems/alive-research-policy.js:303, 329` | `maxDwellMs` (45000) is **never a gate** — it appears only in a status string, so the HUD can say "Maximum dwell reached" while nothing happens |
| 30 | `systems/alive-overdrive-runtime.js:149-157` | A manual Portal Jump press is **silently discarded** when the dwell gate is closed — the request is deleted rather than queued |

---

## 2. Design: the Autonomic Core

New module `systems/alive-autonomic-core.js` — pure, testable, no DOM.

The creature currently acts on **timers**. It will act on **drive**.

Each tick the core reads real runtime signals and produces a drive vector:

| Drive | Computed from |
| --- | --- |
| `novelty` | unseen concepts this page ÷ concepts seen, frontier new-domain ratio |
| `learningProgress` | Δ prediction error over a sliding window (already fed to coupling feedback) |
| `boredom` | ticks since last new concept, scroll `stagnantObservations`, exploration phase |
| `energy` | `viscera.atp`, `glc`, `agRP` |
| `arousal` | `nm.NE`, `nm.DA` |
| `satiation` | page content exhausted: `exploration.phase ∈ {exhausted, blocked}` ∧ links harvested |

Outputs:
- `urgency(capabilityId) → 0..1` — replaces fixed `intervalMs` with
  `interval = base · (1 − 0.85·urgency)`, clamped to a floor.
- `restlessness → 0..1` — when high, **shortens dwell** and requests `portal-jump`
  directly instead of waiting for a timer.
- `tempo → 0..1` — scales the whole scheduler (§3.2).
- `couplingGain → 0..1` — scales how hard the brains drive the body (§3.5).

This is what makes behaviour state-driven rather than scripted, and it is the
single change that most directly answers "it's a dumb script on repeated loops".

---

## 3. Work items

### 3.1 Autonomic core (new file, no collision risk)
`systems/alive-autonomic-core.js` + `tests/alive-autonomic-core.test.cjs`.
Pure functions, deterministic given inputs, bounded outputs, no `Date.now()`
inside the decision path (caller supplies `now`).

### 3.1b Revive the chaotic layer (highest-value single change)
Replace every `!window.aliveOverdrive` guard with `!window.aliveOverdrive?.running`
(`index.html:23754, 23767, 25037, 25049, 25061, 25073, 20122, 19791`). That alone
restores the four strange-attractor pulses, the 14-frame closed loop, the 90-frame
ambient DOM step and the autonomy watchdog — the "wild and feral" behaviour the
user remembers. Then decide per block which should also run *alongside* the
coordinator rather than only instead of it, so the varied layer and the scheduled
layer compose instead of replacing one another.

### 3.1c Limbs driven by the cortex
In the host limb loop (`index.html:24775-24796`), read
`h.verletPhysics.jointTorques24[(l*2) % 24]` and `[(l*2+1) % 24]` as the hip/knee
angular offsets — exactly as the guest path already does at `22230-22231` —
keeping the sinusoid only as a small residual. Stop the host renderer writing
`verletPhysics.stanceFeetCount` (`24953`); give it a separate display field so the
solver that actually integrates the torques owns the proprioception the cortex reads.

### 3.2 Tempo — fast and feral
The knobs are not the bottleneck; the scheduling model is. In order:
- **Anchor intervals to start, not completion** (`alive-overdrive-runtime.js:266,
  293-300`): record `job.periodAnchor = startedAt` and settle to
  `max(now, periodAnchor + intervalMs * slowFactor)`. Recovers the full nominal
  rate whenever a run finishes inside its period.
- **Split `budgetMs`'s two jobs** (`runtime.js:68, 251, 293`): keep it for the tick
  loop, and stop using it as the interval divisor — or give that a separate,
  larger `syncBudgetMs`.
- **Split the lanes** (`runtime.js:95, 205, 213`): `dom-body` gets its own
  `perception` lane; page-effect jobs (zalgo, neo, decursive) get a `page-effect`
  lane. Only then raise `maxInFlight → 4` and `maxStartsPerTick → 6`.
- Take ~650 ms off the hot path by not `await`ing
  `executeSovereignBrowserMasterCommand` (`index.html:23027`) and cutting the
  `tag: "body"` guest timeout from 1350 ms.
- Feed `urgency(context)` from the autonomic core into `_settle` so cadence finally
  reads the sensor context the Controller already computes and currently ignores.
- `dom-body` cadence `1400 → 320…900 ms`, drive-scaled.
- `alive-page-exploration.js`: settle `650 → 200 ms`; stride becomes
  `height · (0.6 … 2.6)` driven by motor **and** novelty; on `exhausted`/`blocked`
  set a `departure: true` flag the caller acts on.
- `alive-research-policy.js:104-107` feral profile: `minDwell 15000 → 2500`,
  `maxDwell 45000 → 12000`, `settledDwell 6000 → 1200`. Keep the user-interaction
  and protected-page guards exactly as they are.
- `index.html:18916` `minDwellMs 5200 → 1200` (newtab 2600 → 600).

Hard rule: every one of these stays **bounded**, and the user guards
(`yieldToUser`, `lastUserNavTs`, Auto-Hop off, pinned/protected pages) are
untouched. Feral means fast, not rude.

### 3.3 Dual-pane embodiment
Presentation is host-side, so fix it host-side:
- `index.html:20580` — allow an auxiliary-leased non-active tab:
  `(t.id === getActiveTab()?.id || authorityToken?.kind === 'auxiliary')`, and
  acquire the lease explicitly for `tabOverride`. Revives the dead call at 23441.
- `index.html:24260` — give the **right pane its own full articulated body**
  (promote `vSwarm[3]` to a second embodiment carrying `bodyRecipe`, limbs, rays),
  driven by the same policy, with its own position/contacts. ALPHA keeps the left.
  When split is off, the second body despawns.
- Offspring colony (`index.html:24911, 24927-24928`) follows whichever body owns
  its pane instead of always orbiting ALPHA.
- `index.html:24183` — measure the seam from `getBoundingClientRect()` instead of
  computing it from the ratio.
- Re-grant the auxiliary lease after each primary commit so the right pane does
  not tear down on every tab switch.

### 3.4 The three drones become real
`RIM-α`, `QGTL-β`, `NMDA-γ` are currently three drawn circles. Each gets a real
controller driven by its named subsystem's live readout (RIM router score,
QGT trace/Berry curvature, NMDA apical gain), each contributing a bounded,
individually **ablatable** steering term. Then the label is earned.

### 3.5 Crank the coupling (brains actually drive)
- `alive-specialist-fusion.js:11` `LIMIT = 0.08` → drive-scaled up to `0.42`.
- `alive-neural-coupling.js:318` motor gain `0.025` → up to `0.18`.
- `index.html:24366-24368` learned thrust `0.55 / 0.35` → up to `0.95 / 0.70`.
- All remain clamped; NaN guards stay. Ablation paths keep returning exactly zero.
- Add a measured **ablation receipt**: periodically zero one source and record the
  behavioural delta, so "this specialist matters" becomes evidence, not a claim.

### 3.6 Six stages actually parallel + two dead personas implemented
- Overdrive: replace the single `stageIdx` with a **stage activation vector** —
  all six stage objectives compute their own target each tick and the router mixes
  them by competence × learning-progress. Sequential mode keeps one stage.
  Then "All 6 Stages Parallel" is literally true instead of aspirational.
- `maximum_joker` → **Chaotic Epistemic Explorer**: every mechanism it names
  already exists and is live (`index.html:15924` novelty, `17090` learning
  progress, `10800-10819` Grover). Store novelty on the instance, raise
  `specialistScores[3]`, raise portal-jump urgency, shorten dwell hardest.
- `hellraiser_evaluator` → **Precision Allostatic Auditor**: ATP gates action
  starts, held-out verification becomes mandatory before any policy promotion,
  Free-Won't veto thresholds become mode-parameterised (`index.html:10811`).
- `jester_evaluator` gets an explicit named branch.
- Fix the stage-pin clobber at `17364`.

### 3.7 Weird-web expansion
- Replace the modulo pick at `index.html:18247` with the chaotic/neural sampler
  already used elsewhere.
- Expand the 57-entry `ALIEN_RABBIT_HOLES` catalogue substantially — liminal,
  archive, obscure-index, outsider-web destinations — plus the real onion
  directory entries already present.
- Broaden `alive-research-policy.js:16` `TOPICS` (currently 12).
- **Persist `visitedUrlTabooSet` across restarts** so it stops re-walking the same
  catalogue every launch.

### 3.8 Dark web: bind visuals to real state
The data is already genuine; only the picture is decorative
(`index.html:25146`: "Decorative relay schematic").
- Drive the schematic from real transport state: `managedTor.bootstrapProgress`,
  `socksHandshakeVerified`, `activeTorPort`, the resolved `proxyRoute`, and
  per-navigation onion receipts from `deepWebNavigation`.
- No circuit → say so plainly. Live → animate from real receipts, show the real
  onion host and route.
- Promote bootstrap % from a tooltip to a visible indicator; style
  `#alive-transport-status[data-verified="true"]` distinctly.
- Surface the onion candidates sitting in the research frontier so roaming is visible.
- Make the Onion / Deep Dark Dive buttons actually hop when transport is ready,
  instead of only probing.

### 3.9 Performance
- Bound the pellet arrays (14 host / 12 guest) with an oldest-prefix trim that
  preserves array identity and newest-tail ordering.
- Trim duplicate work in the 500 ms status refresh.

### 3.10 Verification
- `npm run test:alive` (30 existing suites) must stay green.
- New tests: autonomic core, dual-pane body, persona branches, tempo bounds,
  held-out sign reporting.
- `node scripts/smoke.js`, `npm run audit:25x10`.
- Re-run `scripts/alive-live-onion-probe.cjs`, plus a new variant that lets the
  **app's own** `torAutoStart` spawn Tor (closing the "pieces work vs shipped app
  works" gap).
- Launch the app and observe: both panes embodied, page-to-page cadence, onion
  indicator reflecting real bootstrap.

---

## 4. Explicitly out of scope

- No claim of sentience, consciousness or superintelligence is added anywhere.
  The field guide's evidence discipline is kept: labels must be earned by
  measurement. Where a label currently overstates, this plan either implements
  the mechanism or corrects the label — never leaves the gap.
- Tor control-port scraping for real relay fingerprints (not opened by design).
- No change to the authority/epoch fencing invariants.

---

## 5. Concurrency note

A Codex agent (pid 29104) has been editing this same working tree throughout this
session — `index.html` grew 7.5 KB between 00:22 and 00:53. New modules are
collision-free; `index.html` edits must be surgical and re-anchored before each
write.
