# ALIVE Pass 71 Report (71/100) — `alive-pantheon-connectome-flywire-weights`

- **Phase**: Phase XIV: 14-Brain Multiverse Pantheon Deep Weight-and-Bias Upgrade
- **Winning Profile**: `programmed_connectome_flywire_ca3_dales_law_brains_1to4`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 65.1848` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-pantheon-connectome-flywire-weights-2026-11-09.json`](../docs/reports/alive-pantheon-connectome-flywire-weights-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-pantheon-connectome-flywire-weights-2026-11-09.svg`](../docs/reports/alive-pantheon-connectome-flywire-weights-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `unconstrained_random_brains_1to4_baseline` | Unconstrained Random Gaussian Brains 1-4 (No Dale Law / No Ring Attractor) | **56.97** | `[55.1394, 58.8048]` |
| `connectome_only_no_ring_attractor_ablation` | C. elegans Connectome Only (No FlyWire Cosine Ring Attractor) | **95.90** | `[95.3449, 96.4515]` |
| `unsigned_synapses_no_dales_law_ablation` | Unsigned Synapses Without Dale's Law Excitatory/Inhibitory Sign Mask | **70.00** | `[70, 70]` |
| `programmed_connectome_flywire_ca3_dales_law_brains_1to4` | Programmed Connectome + FlyWire Ring Attractor + CA3-CA1 Theta + Dale's Law (Pass 71 Winner) | **100.00** | `[100, 100]` |
