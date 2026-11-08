# Original Asmodensius integration

The browser now runs the copied original Asmodensius `Creature001` and `Organism` source through a separate adapter. The older `PortedMultiverseBrainsFederation` remains an independent approximation implementation. Adding this original source path does not establish completion of its other thirteen advertised brain integrations.

The original source retains its MIT copyright and permission notice in `brains/asmodensius-v40/LICENSE`. The generated bundle embeds that notice. It does not inherit a blanket replacement license from the browser root.

## Build and source identity

Run `npm run build:brains` after changing the entry point or imported source, and `node scripts/build-authentic-asmodensius.js --check` to verify exact generated output. The pinned esbuild dependency compiles the local TypeScript closure into `systems/generated/authentic-asmodensius.js`. The adjacent manifest records every runtime build input, SHA-256 hashes, compiler version, exact source digest, transformations, output hash and original license text. No runtime downloading or cloud model is involved.

The source entry imports `brains/asmodensius-v40/lab/src/adapters/c001.ts`, which imports the original organism and its local dependencies. Fifteen donor implementation files plus the host entry are compiled. The source snapshot's lab interface is retained alongside the adapter, although its TypeScript-only declarations produce no runtime bundle code. The donor files remain unchanged. The default v40 seeded profile has environment overrides disabled in the bundle: `process` is compiled as undefined. File-backed entropy, live Node substrate probes and external rule/statevector hooks are not selected by this adapter profile.

## Runtime contract

`AuthenticAsmodensiusAdapter.observeChrome` encodes sixteen bounded scalar observations in this order:

| Index | Observation |
|---|---|
| 0–1 | Actual viewport width/3840 and height/2160, clipped to [0,1] |
| 2–5 | Crawler x/width, y/height, and their complements |
| 6–7 | Crawler x/y velocity encoded as (1+tanh(v/10))/2 |
| 8–10 | Tab count/16, window focus and active-tab loading flag |
| 11 | Crawler speed/20 |
| 12–13 | Normalized distance to nearest horizontal/vertical viewport edge |
| 14–15 | Landscape viewport flag and constant sensory bias |

The adapter passes those values to the original `Creature001.senseLines`, then calls its original `step`. The eight original MOT neuron rates are preserved in the readout. A bounded projection computes two motion biases: `tanh(3*(m0+m1-m2-m3)/2)` and `tanh(3*(m4+m5-m6-m7)/2)`. The existing viewport crawler consumes each axis with gain0.15 in its velocity update. The original source receives no privileged IPC, navigation, shell or provider capability.

One original organism tick represents **one simulated minute**. The host schedules at most one tick each250ms of active animation time (at most four simulated minutes per wall-clock second). Hidden documents do not advance this integration. An individual elapsed-time contribution is capped at100ms, so stalls do not produce catch-up bursts. This is a simulation acceleration policy, not a measured60Hz biological update or whole-application frame-rate guarantee. The remaining fraction is checkpointed. Pausing stops both simulation and its motion contribution.

## Checkpoint correction and limits

The original generic snapshot serializer preserves typed arrays and seeded PRNG values, but restoring into a newly constructed original organism fails after lazy initialization because class methods are lost. Its Set values are also not represented. The host adapter corrects this without changing copied donor bytes:

1. Require its schema, exact source digest, fixed source profile, corruption checksum, structural limits, typed-array shapes, finite values, integer widths and original options.
2. Construct an isolated candidate with the recorded seed; execute one discarded initialization tick to establish original class prototypes.
3. Remove initialized fields absent from the saved state, restore the original complete snapshot, and restore explicitly recorded Sets.
4. Require an exact native-state roundtrip before atomically replacing the live creature. Reject errors while leaving live state unchanged.

The checksum detects accidental corruption; it is not authentication. Negative zero is encoded explicitly. The saved scheduler fraction, paused flag, input vector and projected motor output accompany the original state. State from a changed source digest is rejected; migration is not silently assumed. The browser includes this checkpoint in its existing persistent-genome record, and save failures now report a warning while retaining the previously stored record.

The original synthetic substrate log and choice/event history can grow during long runs. The adapter imposes an8MiB payload-size guard, and browser localStorage can reach its own quota first. A bounded-history or IndexedDB storage migration remains required for long-running release qualification; checkpoint-size errors are reported, not called successful saves. The older approximation federation's incomplete continuation checkpoint is a separate unresolved defect.

## Evidence and remaining scope

`npm run test:brains` verifies the reproducible source build and notice, identical complete source state under direct original execution at three seeds, observed-input causality, bounded motor consumption in the actual renderer velocity expression, exact JSON continuation at0/1/100/1500ticks, a4000tick sleep/developmental-pruning run, Set state, malformed checkpoint rejection without mutation, scheduler pause/restart and a browser VM with no Node integration.

The focused Node benchmark and current-source comparison are recorded in `research_notes/Gigachad engineering execution baseline/brains-authentic-evidence.json`. That benchmark is CPU step timing for this adapter/profile and excludes full Electron rendering, IPC and the other engines. The test seeds and tasks demonstrate integration and continuation, not held-out task competence, general intelligence, consciousness or quantum-hardware execution.

Still required: the remaining authentic donor adapters and reproducible builds, full mixed-precision/learning verification, original-source experiment review, the old federation's continuation repair, longer soak/storage work, Windows packaged-artifact qualification and the full program's release gates.
