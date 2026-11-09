# Pass 4 Report — Complete Declared Optimizer, Recurrent, Replay, RNG & Curriculum State Contracts; Restart Equivalence

## 1. Scope & Objective

Pass 4 of [`docs/ALIVE_TEN_PASS_ROADMAP.md`](ALIVE_TEN_PASS_ROADMAP.md) completes and verifies the **6-domain state contract** (`optimizer`, `recurrent`, `replay`, `rng`, `curriculum`, `synapticFabric`) so that a creature checkpointed mid-trajectory ($T_1 = 6$ warmup steps), serialized with SHA-256 domain digests, and hydrated into a freshly initialized creature instance continues across $T_2 = 6$ post-checkpoint steps with **bit-exact SHA-256 state equivalence (`0.0` L2 state drift, `0.0` max absolute error, `0.0` motor trajectory drift)** across 5 independent seeds (`[19013, 29017, 39023, 49031, 59053]`), while proving via **leave-one-domain-out partial restores** that omitting any single domain causes immediate post-restore trajectory divergence on `5/5` seeds.

---

## 2. Code & Artifacts Delivered

1. **6-Domain State Contract & Split-Horizon Equivalence Harness**: [`systems/alive-restart-equivalence.js`](../systems/alive-restart-equivalence.js)
   - Defines `CONTRACT_DOMAINS = ['optimizer', 'recurrent', 'replay', 'rng', 'curriculum', 'synapticFabric']`, `CURRICULUM_STAGES = ['A', 'B', 'C', 'D', 'E', 'F']`, and `TRAINING_SEEDS = [19013, 29017, 39023, 49031, 59053]`.
   - Validates primary policy tensors and replay buffer schema against [`systems/alive-primary-policy-state.js`](../systems/alive-primary-policy-state.js) (`AlivePrimaryPolicyState`) and [`systems/alive-replay-state.js`](../systems/alive-replay-state.js) (`AliveReplayState`).
   - Captures and restores all 6 state domains:
     - **`optimizer`**: `W_actor`, `W_metamorph`, `W_critic`, `W_world`, `W_actor_frozen`, `W_world_frozen`, `trainerCommitted.u` (`Float32Array(24)`), `f64AdamFirstMoment64` (`Float64Array(64)`), `f64AdamSecondMoment64` (`Float64Array(64)`), `f64LossHistory16` (`Float64Array(16)`), `adaptivePlasticityLr`, `totalBackpropStepsTrained`, `AliveNeuralCoupling` weights/gates/eligibility/counters, and `AliveResearchPolicy` MLP parameters (`w1`, `b1`, `w2`, `b2`, `outputWeights`, `outputBias`, `lastInput`, `lastHidden`).
     - **`recurrent`**: `obsVec`, `predObsVec`, `continuousWorldModel.latentZ64`, `zPerc16`, `zPrev16`, `zPrevPrev16`, `hDyn16`, `hDiff16`, `hGen16`, `f64TrajectoryCurr16/Prev16/Prev2_16`, `u64SpikeTrainLanes8` (`BigUint64Array(8)`), `learnedMotorThrust2D`, `deepCortex` (`W_connectome_synapses`, `W_stdp_elig`, `hopfieldMemory`, `hopfieldWritePtr`), `icmCuriosityReward`, `worldDynamicsLossMse`, `spatialExplorationCoveragePct`, `tdAdvantageDelta`, the 4,096-byte WebAssembly linear memory Hebbian arena slice (`cqmWasmInstance.exports.memory.buffer[32768..36864)`), `BleedEdge25AlifeEngine` subtree (14 brains + `AotTotGotCorecursiveDecursiveEngine`), and `Omega100Engine` Lorenz/Izhikevich state.
     - **`replay`**: `replayWritePtr` and dense `replayRing32` records (`z16`, `a8`, `zNext16`, `surprise`), verified through `AliveReplayState.capture`.
     - **`rng`**: Deterministic 64-bit SplitMix64 + XorShift128+ PRNG state (`s0`, `s1`, `draws`) driving stochastic replay sampling, exploration perturbations, and Ising thermal flips.
     - **`curriculum`**: Stages `A` through `F` (`stageIndex`, `stageId`, `stageProgress`, `stageMasteryScores6`, `episodesInStage`, `totalTransitions`), 56-spin Ising state (`ising56`), neuromodulators (`nm.da`, `nm.sht`, `nm.ne`, `nm.ach`), viscera homeostasis (`glc`, `atp`, `hr`, `temp`, `cort`), `iitPhi`, `entanglementBits`, and `DecursiveSelfDeduplicator` (`banishedBasis8x64`, `writePtr`, `deflationCount`).
     - **`synapticFabric`**: `SynapticFabric` node utilities, digests, excitation counters, pending windows, edge weights/potentiations/depressions, job schedule timestamps, and `AliveResearchPolicy` bandit statistics/URL histories.
2. **Live Synaptic Fabric Visualizer Integration (Section 10)**: [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js)
   - Added `Run restart check` button in the panel header (`runRestartEquivalence()`).
   - Added Section 10 (`10 · State contracts & restart equivalence — optimizer · recurrent · replay · RNG · curriculum · fabric`, `#alive-fabric-restart-eq`) rendering per-seed SHA-256 equivalence status on the left and leave-one-domain-out state/motor drift bars on the right.
3. **Artifact Generator & Report Data**:
   - [`scripts/alive-restart-equivalence.cjs`](../scripts/alive-restart-equivalence.cjs)
   - [`docs/reports/alive-restart-equivalence-2026-11-09.json`](reports/alive-restart-equivalence-2026-11-09.json)
   - [`docs/reports/alive-restart-equivalence-2026-11-09.svg`](reports/alive-restart-equivalence-2026-11-09.svg)
4. **Automated Tests**:
   - [`tests/alive-restart-equivalence.test.cjs`](../tests/alive-restart-equivalence.test.cjs)
   - [`tests/alive-fabric-visualizer.test.cjs`](../tests/alive-fabric-visualizer.test.cjs)

---

## 3. Measured 5-Seed Split-Horizon Equivalence Results

### 3.1 Full 6-Domain Restore vs Uninterrupted Reference (`T1 = 6` -> Checkpoint -> Hydrate -> `T2 = 6`)

| Seed | Checkpoint SHA-256 (`t = 6`) | Final Reference SHA-256 (`t = 12`) | Final Restored SHA-256 (`t = 12`) | State $\Delta L_2$ | Max Abs Error | Motor $\Delta L_2$ | Final Stage | Replay Ring | PRNG Draws |
| ---: | :--- | :--- | :--- | ---: | ---: | ---: | :---: | :---: | ---: |
| `19013` | `0fa92e004332c483…` | `24e4ee93d4d3e3fa…` | `24e4ee93d4d3e3fa…` | `0.000000` | `0.000000` | `0.000000` | `F` | `12/32` | `228` |
| `29017` | `e1c8721ac50aa57c…` | `63687d822c3f86a1…` | `63687d822c3f86a1…` | `0.000000` | `0.000000` | `0.000000` | `F` | `12/32` | `228` |
| `39023` | `8f0daafa7149152c…` | `2f83fd2aab078b1d…` | `2f83fd2aab078b1d…` | `0.000000` | `0.000000` | `0.000000` | `F` | `12/32` | `228` |
| `49031` | `e997695e94b5a195…` | `7446c8189ffafa41…` | `7446c8189ffafa41…` | `0.000000` | `0.000000` | `0.000000` | `F` | `12/32` | `228` |
| `59053` | `2fa1f37673a85ddf…` | `e2f2ce7b0c6719dd…` | `e2f2ce7b0c6719dd…` | `0.000000` | `0.000000` | `0.000000` | `F` | `12/32` | `228` |

- **Exact SHA-256 Restart Equivalence Seeds**: `5 / 5` (`100%`)
- **All 6 Domain Digests Match on Every Seed**: `5 / 5` (`optimizer`, `recurrent`, `replay`, `rng`, `curriculum`, `synapticFabric`)

### 3.2 Leave-One-Domain-Out Causal Necessity (`5` Seeds, Two-Sided Student-$t$ 95% CI, $\text{df}=4$)

| Omitted Domain | State $\Delta L_2$ Mean $\pm$ SD | State $\Delta L_2$ 95% CI | Motor $\Delta L_2$ Mean $\pm$ SD | Motor $\Delta L_2$ 95% CI | Diverging Seeds | Included Match Seeds |
| :--- | ---: | :--- | ---: | :--- | :---: | :---: |
| **`curriculum`** | `2.533151 ± 0.005603` | `[2.526194, 2.540108]` | `0.909875 ± 0.005659` | `[0.902849, 0.916901]` | `5/5` | `5/5` |
| **`optimizer`** | `0.401297 ± 0.001814` | `[0.399044, 0.403549]` | `0.044986 ± 0.003856` | `[0.040198, 0.049774]` | `5/5` | `5/5` |
| **`recurrent`** | `0.219802 ± 0.017205` | `[0.198439, 0.241165]` | `0.013094 ± 0.002485` | `[0.010008, 0.016180]` | `5/5` | `5/5` |
| **`rng`** | `0.180905 ± 0.054677` | `[0.113014, 0.248796]` | `0.013302 ± 0.005544` | `[0.006419, 0.020186]` | `5/5` | `5/5` |
| **`synapticFabric`** | `0.047257 ± 0.000019` | `[0.047234, 0.047280]` | `0.094744 ± 0.000350` | `[0.094309, 0.095179]` | `5/5` | `5/5` |
| **`replay`** | `0.003593 ± 0.000423` | `[0.003068, 0.004119]` | `0.000055 ± 0.000030` | `[0.000017, 0.000093]` | `5/5` | `5/5` |

---

## 4. Verification Commands

```powershell
node scripts/alive-restart-equivalence.cjs
node --test tests/alive-restart-equivalence.test.cjs tests/alive-architecture-ablations.test.cjs tests/alive-unseen-task-benchmark.test.cjs tests/alive-fabric-visualizer.test.cjs tests/alive-synaptic-fabric.test.cjs
```

---

## 5. Next Pass Recommendation (Pass 5 of 10)

Proceed to **Pass 5**: *Long-duration learning/retention, morphology transfer and five-seed uncertainty across distinct tasks* (measuring catastrophic forgetting vs retention across sequential task switches, transfer of learned representations across body morphology mutations / Eldritch Morph / Body Metamorph, and 5-seed Student-$t$ 95% confidence intervals across distinct task families).
