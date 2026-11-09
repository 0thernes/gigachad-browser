# ALIVE Synaptic Fabric

The Synaptic Fabric connects the ALIVE faculties to each other, so that every
capability's outcome can change when the others run. Faculties include the
14-brain/7-precision federation, Macro/Meso/Micro, the connectome, AoT/ToT/GoT,
memory, metacognition, body, curriculum, ghost faculties, Tor and diagnostics.
It turns the coordinator's independent timers into one adaptive schedule.

## Mechanism

| Element | Rule |
| --- | --- |
| Node | Every registered capability in `window.aliveOverdrive.jobs` |
| Synapse | Declared `[from, to, weight]` edge (`DEFAULT_EDGES`, ~100 edges). Every faculty has an output synapse, and every unpaced faculty has at least one input synapse |
| Novelty | FNV-1a digest of the outcome evidence. Numbers are quantized to two significant digits, and clock-like keys (`tick`, `at`, `ageMs`, …) are ignored. Repeating the same evidence or drifting slightly is not novelty |
| Utility | EWMA (rate 0.2) of +1 for novel success, −0.35 for repeated success, −0.2 for blocked/unavailable and −0.8 for error/timeout |
| Adaptive cadence | After a success, the remaining delay is scaled by `2^(−utility)`, clamped to [0.5, 2]. Error backoff is untouched |
| Excitation | A novel success pulls each target's `nextDueAt` earlier by `weight × effectiveInterval`. The earliest allowed time is `lastStartedAt + max(400 ms, 0.2 × interval)` |
| Eligibility | Excitation applies only when the runtime is running and not suspended, and the target has an adapter, is not manual-only, is not in flight and has no consecutive errors |
| Paced targets | `portal-jump`, `epoch-handoff`, `research-plan`, `deep-dark-dive`, `checkpoint`, `flywire`, `acceptance-gates` and `learning-five-seed` can excite others but are never pulled earlier or sped up. Their pacing belongs to dwell, storage, model or diagnostic policies |
| Hebbian credit | When an excited target settles within `2 × effectiveInterval`, each edge that excited it changes by `Δw = 0.05 · signal · room`. Weights are bounded to [0.02, 0.95] |
| Synaptic scaling | After a potentiation, a source's total outgoing weight is held at or below 1.5 × its declared total by proportional scaling, so sibling synapses compete. This prevents runaway saturation |
| Foreign events | The controller privately authenticates its frozen event objects. Execution spans match capability, operation ID and generation. Copies, stale receipts and authority events sharing a capability name cannot earn scheduling credit |
| Persistence | `gigachad_alive_fabric_v1` in `localStorage`, saved on Pause and every 30 s with readback. Import validates everything before applying anything and never creates undeclared edges |

The fabric only changes schedule times. Readiness checks, execution lanes,
`maxInFlight`, Pause/suspend, generation fencing and failure backoff remain the
runtime's responsibility. A strong learned edge means that the target faculty
produced new evidence after being advanced. It is not causal attribution
between the scientific models named by the capabilities.

## Visualizer

Open it with **Fabric** in the ALIVE bar or `toggleAliveFabricPanel()`. It docks
beside the webpage and shares exclusivity with Brain evidence, Inspect, Logs and
Controls. Every chart draws data:

1. **Coupling graph**: node size is utility, node color is last status, edge width is the learned weight, green/red marks potentiated/depressed edges, and cyan marks excitation within the last 1.5 s.
2. **Concurrency raster**: execution spans for every faculty over the last 60 s, with true simultaneous peak concurrency computed by interval sweep. Sequential spans in one bucket do not count as concurrent; no executions reports zero.
3. **Brain gates**: availability and learned gate value of the 24 coupling streams (14 brains, 7 precision kernels, Ising, Omega Lorenz/Izhikevich), plus a 120 s gate heatmap.
4. **Utility and cadence**: utility EWMA, cadence factor, effective interval, novel/repeated/failed counts and excitation count.
5. **Time series (at most 1 Hz, 240 samples)**: completions/s, in-flight, excitations/s, potentiations/s, mean weight and utility, coupling updates and reward, hub backprop/s, STDP/s, world prediction error, research ranker loss. Rates use actual elapsed monotonic seconds; first observations, missing sources and reset counters remain unmeasured.
6. **Neural substrate**: sparklines for the numeric fields of `neuralSubstrateTelemetry`.
7. **Tables**: ghost-swarm, ghost-write, memory, metacognition and five-seed job evidence, the creature colony, and the fabric event log.

Missing sources are drawn as missing (`—`, "not installed"). They are never
replaced with zero or placeholder values. Sampling and drawing run at most once
per second while the panel is open and visible. Closing or hiding the panel
stops its timers. Disposal removes owned listeners and timers. Chart timestamps
reflect sample time rather than assuming uniform browser timer intervals.

## Verification

- `node --test tests/alive-synaptic-fabric.test.cjs`: roster connectivity, digest novelty, excitation with refractory limits, rejection of repeated evidence, bounded potentiation/depression, eligibility exclusions, foreign events, adaptive cadence, validated import/export, bounded spans and real concurrency.
- `node --test tests/alive-fabric-visualizer.test.cjs`: mounts without `innerHTML`, plots only measured numbers, reports missing sources as missing, bounded sampling, drawing only while open.
