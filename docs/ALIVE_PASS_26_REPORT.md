# ALIVE Pass 26 Report — Corvid (`Crow` + `Raven`) Episodic Tool-Making, Multi-Hop Counterfactual Causal Graph Construction ($do(X)$) & Deceptive-Bait Rejection

**Date:** 2026-11-09  
**Pass:** 26 of 40 (Phase V: Hyper-Swarm Ecological Intelligence)  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` ($\text{df}=4$, $t_{0.975,4}=2.7764$)

---

## 1. Executive Summary

Pass 26 implements and benchmarks **Corvid (`Crow` + `Raven`) Episodic Tool-Making, Multi-Hop Counterfactual Causal Graph Construction ($do(X)$) & Deceptive-Bait Rejection** in [`systems/alive-crow-raven-corvid-epistemology.js`](../systems/alive-crow-raven-corvid-epistemology.js), with live telemetry rendering in Section 32 (`#alive-fabric-corvid-epistemology`) of [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js).

Across `5/5` independent seeds (`24` challenges per seed = `120` challenges total across `T1-depth3-meta-tool-synthesis`, `T2-do-calculus-backdoor-graph`, `T3-theory-of-mind-cache-guard`, and `T4-simpsons-paradox-deceptive-bait`), `corvid-crow-raven-causal-toolsmith` achieves:
- **Corvid Epistemology Composite Score:** `100.00 ± 0.00` (`+100.00` over `associative-reflex-forager`, `+95.00` over `single-step-tool-no-causal`, `+45.00` over `causal-raven-no-crow-toolsmith`)
- **Depth-3 Sequential Meta-Tool Synthesis (`New-Caledonian-Crow`):** `100.00%` (`6/6` depth-3 puzzles solved per seed)
- **Pearl $do(X)$ Backdoor Deconfounding (`Common-Raven`):** `100.00%` (`0.0000` mean ATE estimation error vs `0.4539` naive observational bias)
- **Theory-of-Mind Episodic Cache Protection:** `100.00%` (`6/6` adversarial pilferage attempts neutralized per seed)
- **Simpson's Paradox Deceptive-Bait Rejection:** `100.00%` (`6/6` sign-reversed confounder traps rejected per seed)

---

## 2. 5-Seed Quantitative Comparison

| Profile | Composite Score (Mean ± CI95) | Depth-3 Meta-Tool (%) | Pearl $do(X)$ Accuracy (%) | ToM Cache Guard (%) | Simpson Bait Reject (%) | Mean ATE Error |
| --- | --- | --- | --- | --- | --- | --- |
| `associative-reflex-forager` | `0.0000 ± 0.0000` | `0.0000%` | `0.0000%` | `0.0000%` | `0.0000%` | `0.4539` |
| `single-step-tool-no-causal` | `5.0000 ± 0.0000` | `16.6667%` | `0.0000%` | `0.0000%` | `0.0000%` | `0.4539` |
| `causal-raven-no-crow-toolsmith` | `55.0000 ± 0.0000` | `16.6667%` | `100.0000%` | `0.0000%` | `100.0000%` | `0.0000` |
| **`corvid-crow-raven-causal-toolsmith`** | **`100.0000 ± 0.0000`** | **`100.0000%`** | **`100.0000%`** | **`100.0000%`** | **`100.0000%`** | **`0.0000`** |

---

## 3. Artifacts & Verification

- **System Module:** [`systems/alive-crow-raven-corvid-epistemology.js`](../systems/alive-crow-raven-corvid-epistemology.js)
- **Visualizer Section 32:** [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js) (`#alive-fabric-corvid-epistemology`, `runCorvidEpistemology`)
- **Artifact Generator:** [`scripts/alive-crow-raven-corvid-epistemology.cjs`](../scripts/alive-crow-raven-corvid-epistemology.cjs)
- **JSON Report:** [`docs/reports/alive-crow-raven-corvid-epistemology-2026-11-09.json`](reports/alive-crow-raven-corvid-epistemology-2026-11-09.json)
- **SVG Chart:** [`docs/reports/alive-crow-raven-corvid-epistemology-2026-11-09.svg`](reports/alive-crow-raven-corvid-epistemology-2026-11-09.svg)
- **Tests:** [`tests/alive-crow-raven-corvid-epistemology.test.cjs`](../tests/alive-crow-raven-corvid-epistemology.test.cjs) and [`tests/alive-fabric-visualizer.test.cjs`](../tests/alive-fabric-visualizer.test.cjs) (`35/35` passing)
