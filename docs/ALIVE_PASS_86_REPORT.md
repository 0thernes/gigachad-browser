# ALIVE Pass 86 Report (86/100) — `alive-cache-tiled-gemm-fused-epilogue`

- **Phase**: Phase XVII: Hardware-Sympathetic Tensor Systems Engineering
- **Winning Profile**: `cache_tiled_4x4_gemm_fused_bias_silu_zero_alloc`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 999` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-cache-tiled-gemm-fused-epilogue-2026-11-09.json`](../docs/reports/alive-cache-tiled-gemm-fused-epilogue-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-cache-tiled-gemm-fused-epilogue-2026-11-09.svg`](../docs/reports/alive-cache-tiled-gemm-fused-epilogue-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `naive_3pass_unfused_gemm_bias_act_baseline` | Naive 3-Pass Unfused GEMM + Separate Bias Pass + Separate SiLU Pass (3x Memory Traffic) | **54.02** | `[54.0227, 54.0227]` |
| `tiled_gemm_unfused_epilogue_ablation` | 4x4 Cache-Tiled GEMM Without Fused Bias+SiLU Epilogue (Extra Intermediate Write) | **73.71** | `[73.7102, 73.7102]` |
| `fused_epilogue_without_cache_tiling_ablation` | Fused Bias+SiLU Epilogue Without 4x4 Register/Cache Tiling | **71.95** | `[71.9523, 71.9523]` |
| `cache_tiled_4x4_gemm_fused_bias_silu_zero_alloc` | 4x4 Cache-Tiled GEMM + Fused Bias-Add & SiLU/SwiGLU Epilogue + Zero-Alloc Arena (Pass 86 Winner) | **100.00** | `[100, 100]` |
