# Independent five-seed learning diagnostic

The `Learning 5-Seed` diagnostic now executes five separately initialized and
trained compact controllers through the same `policyTrial` and `evaluatePolicy`
functions used by the creature's existing simulated policy practice. It is
isolated from live weights and does not automatically promote a policy or pass
the PDF G4 acceptance gate.

Run the reproducible diagnostic from the repository root:

```powershell
node scripts/alive-learning-five-seed.cjs --output=docs/reports/alive-learning-five-seed-2026-11-09.json
```

The browser module exports `AliveLearningFiveSeed.run()`, an asynchronous method
that returns the same measured report without filesystem access. It requires
`AlifeLearningEvidence` and WebCrypto SHA-256. The production learner's ordinary
ten-second practice remains a separate single-candidate operation.

## Protocol

- Exactly five distinct initialization/training seeds: 17011, 27011, 37013,
  47017 and 57037. Each run owns new 5×16 actor weights, 5×6 morphology-conditioning
  weights and a same-initial-state frozen baseline. Initialization ranges and
  morphology match the live controller; reproducible LCG32 replaces browser entropy.
- Each seed generates three disjoint training trajectories of twenty steps,
  giving sixty production gradient updates. Training trajectories do not overlap
  any evaluation seeds or those of another run.
- Trained and frozen policies receive identical five holdout trajectories and
  five separate retention trajectories. The schedule and compute budget are fixed.
  Intermediate evaluation curves are reported; they do not select models or stop
  training early.
- Every run reports paired return difference, relative gain, retention ratio,
  changed-weight counts and norms, SHA-256 fingerprints of initial/frozen/final
  parameter bytes, and a learning curve. Failed runs remain in the denominator
  and carry their errors. An incomplete five-run result receives no confidence
  interval.
- Aggregate intervals use a two-sided Student t interval across the five
  independent training runs, with four degrees of freedom. This small-sample,
  approximate-normality interval is descriptive; it is not a generalization guarantee.
- CLI provenance records source-file SHA-256 hashes, base Git revision, runtime
  version, platform, architecture, CPU and generation time. Working source hashes
  identify the measured implementation even before the changes are committed.

## November 9 measured result

The checked-in [JSON report](reports/alive-learning-five-seed-2026-11-09.json)
contains all five runs, trajectories, policy fingerprints and source provenance.

| Measurement | Result |
| --- | --- |
| Completed independent training runs | 5 / 5; no failures |
| Runs with positive held-out return difference | 5 / 5 |
| Mean paired held-out return difference | +0.248457 on the bounded 0–1 steering-return scale |
| Approximate 95% interval for paired difference | +0.108641 to +0.388273 |
| Mean per-run relative held-out gain | +63.109956% |
| Mean same-task retention ratio | 152.873336% of each frozen baseline |
| Runs meeting existing simulated promotion rule | 5 / 5; no live promotion performed |
| PDF G4 / release qualification | Not passed / not qualified |

The “retention” trajectories use new initial positions in the **same** steering
task. They do not test retention of distinct previously learned tasks. This
benchmark does not include changed-condition adaptation, unseen webpage navigation,
full-body transfer or the entire 1.24M-parameter runtime. Those remain separate
experiments needed for broader claims.

## Validation and causal brain coverage

The five-seed tests verify exact replication, separate initial-state fingerprints,
matched frozen controls, disjoint seeds, actual parameter changes, no-op learning
with zero benefit, retained failures and independently computed confidence
intervals. They also enforce the absence of gate-passing and live-policy mutation.

`tests/alive-neural-coupling.test.cjs` now individually perturbs the consumed
readout of **every one of the fourteen actual local brain adapter instances**.
Each perturbation must change the shared hub's sensory input, latent state and
two-dimensional motor output. The same checks cover all seven computed precision
streams. Existing tests additionally cover all 56 Ising spins, executed Lorenz
and Izhikevich dynamics, missing/unexecuted sources, nonfinite state, observed
feedback learning and checkpoint round trips.

These are causal wiring checks at the controller boundary. They do not measure
task advantage, claim every allocated parameter contributes on every step, or
establish execution of entire external donor architectures.

## Source-to-controller map

| Mechanism | Consumed source and effect |
| --- | --- |
| Fourteen brains | `AliveNeuralCoupling.SOURCE_PATHS` declares compact model state/learned readouts; bounded learned gates project them into hub sensory, latent and motor channels. |
| Seven precision families | Completed Float64, cyclotomic BigInt64, Uint32 HDC, decoded FP16, dequantized Int8, packed ternary and Float32 Mamba computations; allocated or restored counters alone do not admit a stream. |
| Macro/meso and viscera | Fourteen macro rates are driven by 112 sLTC/SSM/apical states. Selected macro, allostatic and geometric observations enter the actor and five-specialist bounded motor fusion. |
| Micro/Ising | Classical Moonlab/QGT/Berry state enters observations; all 56 compact Ising spins have tested sensory paths. No external Eshkol or physical quantum execution is established. |
| DSD / Cl(4,0) / deep substrate | Continuous world step calls deduplication, then metacognition, then neural/connectome/substrate dynamics and the trainable hub. Door scores consume numerical features and learned state. |
| AoT / ToT / GoT | The trainable hub invokes the reasoning engine, and its readouts participate in link scoring. Algorithm names and descriptive percentages do not establish reasoning quality. |
| Omega / Deity | Existing local engines execute numerical/browser-effect operations. Only actual Lorenz/Izhikevich integration state is admitted to the separate Omega neural-coupling streams. |
| Memory / dream | Working, episodic, semantic and procedural stores coexist. Replay learns from provenance-tagged observed transitions with stable heldout membership; it cannot manufacture page observations. |
| FlyWire M8 | Compact sixteen-bin ring steering influences policy and cortex input; matched-capacity intact/ablated tests report signed differences without forcing a win. |
| Epoch handoff / checkpoint | Single-host acknowledged guest authority and scoped state persistence; independent-peer transfer and complete runtime state qualification remain separate work. |

The sparse cortex/connectome loops now rotate their previously fixed slices.
The expert router retains the highest-scoring expert and assigns its second slot
fairly across the other experts, with a minimum 5% exploration contribution.
Independent phases cover both row parities and all four column residues, using
the same 16,384 multiply-accumulates per call. Both expert readouts consume a fixed
input snapshot, eliminating update-order dependence between sampled rows.

The connectome still admits at most 44 spiking presynaptic neurons and traverses
64 postsynaptic targets for each. A rotating presynaptic cursor prevents lower
indices from starving higher indices; each neuron's eight target phases cover
all 512 targets when that neuron continues firing. The previous displayed
`activePreIndices.length * 512` count overstated actual traversal eightfold; the
runtime now reports the exact number visited and separates all observed spikes
from the subset processed in the current budget.

`tests/alive-tensor-coverage.test.cjs` executes the production source blocks and
independently instruments every weight read. It verifies all 524,288 expert
weights are visited within 56 calls and all 262,144 synapses within 94 calls in
an all-spiking synthetic fixture, with the unchanged per-call budgets. It also
checks causal effects from previously omitted lanes and verifies silent neurons
claim no coverage. Live cumulative/unique visit counters and coverage percentages
describe observed execution since initialization. Full synaptic coverage depends
on actual firing; elapsed time alone cannot claim it.

The remaining fixed sparse column selections in this cortex method now rotate as
well. Q/K/V and output coefficients feed actual expert-gating logits through a
bounded sparse projection, and the Hopfield slot readout contributes a bounded
memory residual to the posterior before master/actor evaluation. Previously it
only rewrote the memory slot without consuming recall in that path.

| Production path | Instrumented coverage | Work per call | Calls to complete the declared sweep in the test |
| --- | --- | --- | --- |
| Eight expert matrices | 524,288 weights | 16,384 multiply-accumulates | 56 with a fixed highest-scoring expert and round-robin exploration |
| Spike-driven connectome | 262,144 synapses | At most 44×64 = 2,816 traversals/updates | 94 with all 512 neurons firing each call |
| Prior/posterior/master/actor/critic projections | 65,536 weights | 32,768 coefficient reads | 2 alternating column-pair phases |
| Actor-output/decoder learning | 12,288 weights | 1,536 gradient updates | 8 column phases |
| Q/K/V coefficient projections | 12,288 weights | 16 coefficient reads | 768 |
| Attention output projection | 4,096 weights | 8 coefficient reads | 512 |
| Episodic slot readout | 16,384 memory values | 128 reads/writes | 128 slots |

Fourteen tensor-coverage tests instrument actual production array reads and check
the final previously omitted weight in each projection for a causal output
change. A full extracted cortex-method test exercises eight composed steps and
checks finite latent, master, expert-gating and joint-motor outputs.

The later cortex-state audit found that the historical attention fixture used
8,192 output values despite the constructor's actual 64x64 allocation. The old
1,024-phase production rotation consequently exceeded that allocation at phase
512. The current fixture derives both attention allocations from the constructor;
output traversal now wraps after 512 phases, and a separate boundary regression
covers repeated wraps, the final coefficient and a control reproducing the old
nonfinite result. The earlier coverage assertion was too broad. This correction
does not alter or expand the separate five-seed compact steering measurement.

These operations are explicitly **sparse rotating approximations**. Accumulating
coverage over many calls is not equivalent to computing a full dense forward pass
or full gradient on each call. The new memory recall adds a bounded posterior
residual; matched behavioral benefit is not yet measured. The coverage guarantees
apply to these tested paths; other model internals still require their own causal
and per-lane checks. Neither the fourteen-adapter tests nor coverage counters
replace matched-task performance experiments.
