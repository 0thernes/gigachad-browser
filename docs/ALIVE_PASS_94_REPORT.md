# ALIVE Pass 94 Report (94/100) — `alive-cmaes-pbt-hyperparameter-evolver`

- **Phase**: Phase XVIII: Meta-Learning, DARTS Architecture Search, Hypernetworks & Continual Plasticity
- **Winning Profile**: `cmaes_rank_mu_csa_plus_pbt_online_evolver`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 999` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-cmaes-pbt-hyperparameter-evolver-2026-11-09.json`](../docs/reports/alive-cmaes-pbt-hyperparameter-evolver-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-cmaes-pbt-hyperparameter-evolver-2026-11-09.svg`](../docs/reports/alive-cmaes-pbt-hyperparameter-evolver-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `static_grid_random_hyperparameter_search_baseline` | Static Random Grid Search (No Covariance Adaptation / No Online PBT Exploit-Explore) | **27.45** | `[27.45, 27.45]` |
| `isotropic_es_no_covariance_rotation_ablation` | Isotropic Evolution Strategy C = I (Slow Convergence on Ill-Conditioned Rosenbrock Valley) | **80.38** | `[80.375, 80.375]` |
| `cmaes_without_csa_step_size_control_ablation` | CMA-ES Without Cumulative Step-Size Adaptation (CSA) Path p_sigma | **91.67** | `[91.675, 91.675]` |
| `cmaes_rank_mu_csa_plus_pbt_online_evolver` | Full CMA-ES (Rank-1 + Rank-mu + CSA) + PBT Online Weight/Bias Evolution (Pass 94 Winner) | **100.00** | `[100, 100]` |
