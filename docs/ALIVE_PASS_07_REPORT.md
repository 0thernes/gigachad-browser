# ALIVE Pass 7 Report — Research Provenance, Contradiction Tracking, Source Quality & Source-Grounded Writing Evaluations

**Date:** 2026-11-09  
**Benchmark ID:** `pass-07-research-provenance-contradiction-writing-v1`  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (`df = 4`, two-sided Student-$t$ 95% confidence intervals)

## 1. Architectural Scope & Objective

Pass 7 evaluates whether the ALIVE `Ghost Swarm` + `Ghost Write` research and synthesis pipeline ([`systems/alive-research-policy.js`](../systems/alive-research-policy.js), [`systems/alive-cognitive-faculties.js`](../systems/alive-cognitive-faculties.js), [`systems/alive-research-provenance-evaluator.js`](../systems/alive-research-provenance-evaluator.js)) enforces cryptographic source provenance (`SHA-256` excerpt receipts), scores source authority/quality (`scoreSourceQuality`), detects conflicting claims across primary vs. low-credibility sources, and rejects ungrounded hallucination probes across 5 independent seeds.

Four synthesis pipelines are evaluated on an identical 9-document multi-tier corpus per seed (`3` peer-reviewed primary sources, `3` conflicting secondary/blog sources with opposite polarity, `2` unverified hallucination probes, and `1` corroborative primary source):

1. **`ungrounded-freeform`**: Emits ungrounded claims without URL or SHA-256 excerpt receipts.
2. **`naive-concatenator`**: Concatenates all ingested claims without filtering unverified claims or resolving opposing polarities.
3. **`citation-only-filter`**: Restricts output to claims with verifiable URL + SHA-256 receipts, but does not group by proposition or resolve contradictions between primary and secondary sources.
4. **`provenance-contradiction-writer`**: Full ALIVE `Ghost Swarm` + `Ghost Write` provenance-grounded synthesizer with `SHA-256` excerpt receipts, `scoreSourceQuality` authority weighting, proposition-level polarity grouping, explicit contradiction register generation, and zero-hallucination enforcement.

## 2. Five-Seed Empirical Results

| Pipeline | Composite Score (Mean ± SD, 95% CI) | Grounded Claim Precision (%) | Primary Proposition Recall (%) | Contradiction Recall (%) | Hallucination Rate (%) | Mean Source Quality |
| --- | --- | --- | --- | --- | --- | --- |
| `ungrounded-freeform` | `0.00 ± 0.00` `[0.00, 0.00]` | `0.0%` | `0.0%` | `0.0%` | `100.0%` | `0.200` |
| `naive-concatenator` | `25.56 ± 0.04` `[25.52, 25.61]` | `44.4%` | `100.0%` | `0.0%` | `22.2%` | `0.625` |
| `citation-only-filter` | `37.44 ± 0.05` `[37.38, 37.50]` | `57.1%` | `100.0%` | `0.0%` | `0.0%` | `0.758` |
| **`provenance-contradiction-writer`** | **`99.72 ± 0.02` `[99.69, 99.74]`** | **`100.0%`** | **`100.0%`** | **`100.0%`** | **`0.0%`** | **`0.972`** |

### Paired Multi-Seed Comparisons (`df = 4`)
- **`provenance-contradiction-writer` vs. `citation-only-filter` composite score gain**: `+62.28 ± 0.05` (`95% CI [+62.22, +62.34]`, **`5/5` seeds**).
- **`provenance-contradiction-writer` vs. `naive-concatenator` composite score gain**: `+74.15 ± 0.05` (`95% CI [+74.09, +74.22]`, **`5/5` seeds**).
- **Exact Contradiction Recall (`100.0%`)**: **`5/5` seeds** (`3/3` opposing-polarity propositions detected per seed with primary vs. conflicting URLs, `SHA-256` excerpt hashes, and positive authority delta).
- **Zero Hallucination Rate (`0.0%`)**: **`5/5` seeds**.

## 3. Live Visual Telemetry Integration

- Added **Section 13 (`13 · Research provenance, contradiction tracking & source-grounded writing (5 seeds)`)** (`#alive-fabric-provenance`), the `Run provenance` button, and `runProvenanceEval()` to [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js).
- Artifacts written:
  - [`docs/reports/alive-research-provenance-evaluator-2026-11-09.json`](reports/alive-research-provenance-evaluator-2026-11-09.json)
  - [`docs/reports/alive-research-provenance-evaluator-2026-11-09.svg`](reports/alive-research-provenance-evaluator-2026-11-09.svg)
