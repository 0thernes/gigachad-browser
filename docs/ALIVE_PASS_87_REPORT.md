# ALIVE Pass 87 Report (87/100) — `alive-flash-attention-online-softmax-tiler`

- **Phase**: Phase XVII: Hardware-Sympathetic Tensor Systems Engineering
- **Winning Profile**: `flash_attention2_online_softmax_fused_alibi_tiler`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 278.5794` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-flash-attention-online-softmax-tiler-2026-11-09.json`](../docs/reports/alive-flash-attention-online-softmax-tiler-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-flash-attention-online-softmax-tiler-2026-11-09.svg`](../docs/reports/alive-flash-attention-online-softmax-tiler-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `materialized_t2_attention_matrix_baseline` | Standard O(T^2) Materialized Attention Matrix P = softmax(QK^T + B) (Quadratic Memory Allocation) | **44.54** | `[43.9871, 45.0925]` |
| `tiled_attention_without_running_max_overflow_ablation` | Tiled Attention Without Running Maximum Subtraction m_i (Exponential Overflow Risk) | **45.00** | `[45, 45]` |
| `flash_attention_unfused_positional_bias_ablation` | FlashAttention-2 Without In-Register Fused ALiBi Positional Bias | **89.54** | `[88.9871, 90.0925]` |
| `flash_attention2_online_softmax_fused_alibi_tiler` | FlashAttention-2 Online Log-Sum-Exp Tiler (m_i, l_i) + Fused ALiBi Bias (Pass 87 Winner) | **100.00** | `[100, 100]` |
