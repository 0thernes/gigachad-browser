# ALIVE Pass 63 Report — Pass 63 · Symplectic Stormer-Verlet Port-Hamiltonian Neural ODE (J=-J^T, Cholesky PSD)

**Pass ID:** `ALIVE-PASS-63-PORT-HAMILTONIAN-SYMPLECTIC-ODE`  
**Phase:** Phase XII — Kolmogorov-Arnold Networks (KAN), Liquid Time-Constant (sLTC) & Continuous-Depth Neural ODEs  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `symplectic-stormer-verlet-port-hamiltonian-cholesky` (`score = 100.00`, `+76.84` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `unconstrained-neural-ode-energy-drift` | `23.1562 ± 0.3092` | Baseline/Ablation |
| `hamiltonian-rk4-non-symplectic-drift` | `67.9085 ± 0.2577` | Baseline/Ablation |
| `symplectic-without-psd-cholesky-dissipation` | `88.3835 ± 0.1204` | Baseline/Ablation |
| `symplectic-stormer-verlet-port-hamiltonian-cholesky` | `100.0000 ± 0.0000` | **WINNING** |
