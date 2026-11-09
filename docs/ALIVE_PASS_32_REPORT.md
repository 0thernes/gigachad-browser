# ALIVE Pass 32 Report — Hyperbolic Poincaré Ball ($\mathbb{B}^d_c$) Hierarchical Ontology & Deep Citation Tree Embedding Engine

**Date:** 2026-11-09  
**Phase:** Phase VI — Neuro-Symbolic Program Synthesis, Active Inference Free-Energy & Hyperbolic Knowledge Geometry (Pass 32 of 40)  
**Module:** [`systems/alive-hyperbolic-poincare-knowledge-embedder.js`](../systems/alive-hyperbolic-poincare-knowledge-embedder.js)  
**CLI Runner:** [`scripts/alive-hyperbolic-poincare-knowledge-embedder.cjs`](../scripts/alive-hyperbolic-poincare-knowledge-embedder.cjs)  
**Test Suite:** [`tests/alive-hyperbolic-poincare-knowledge-embedder.test.cjs`](../tests/alive-hyperbolic-poincare-knowledge-embedder.test.cjs), [`tests/alive-fabric-visualizer.test.cjs`](../tests/alive-fabric-visualizer.test.cjs)  
**Artifacts:** [`docs/reports/alive-hyperbolic-poincare-knowledge-embedder-2026-11-09.json`](reports/alive-hyperbolic-poincare-knowledge-embedder-2026-11-09.json), [`docs/reports/alive-hyperbolic-poincare-knowledge-embedder-2026-11-09.svg`](reports/alive-hyperbolic-poincare-knowledge-embedder-2026-11-09.svg)

---

## 1. Executive Summary

Pass 32 implements a **Hyperbolic Poincaré Ball ($\mathbb{B}^d_c$) Hierarchical Ontology & Deep Citation Tree Embedding Engine** for representing exponentially branching deep-web and scientific citation hierarchies with ultra-low distortion:

1. **Poincaré Ball Manifold ($\mathbb{B}^d_c = \{x \in \mathbb{R}^d : c\|x\|^2 < 1\}$):**
   - **Geodesic Metric:**
     $$d_{\mathbb{B}^d_c}(u, v) = \frac{1}{\sqrt{c}}\operatorname{arcosh}\!\left(1 + 2c\frac{\|u - v\|^2}{(1 - c\|u\|^2)(1 - c\|v\|^2)}\right)$$
   - **Möbius Gyrovector Addition ($u \oplus_c v$):**
     $$u \oplus_c v = \frac{(1 + 2c\langle u,v\rangle + c\|v\|^2)u + (1 - c\|u\|^2)v}{1 + 2c\langle u,v\rangle + c^2\|u\|^2\|v\|^2}$$
   - **Riemannian Metric Rescaling & Boundary Projection:** Scales Euclidean gradients by $(\lambda^c_x)^{-2} = \frac{(1 - c\|x\|^2)^2}{4}$ and projects onto $\|x\| \le \frac{1-\varepsilon}{\sqrt{c}}$ ($\varepsilon = 10^{-5}$).
2. **5-Seed Statistical Verification (`19013`, `29017`, `39023`, `49031`, `59053`):**
   - Across 40-node ternary citation hierarchies per seed, `poincare-riemannian-gyrovector-b8` achieves **`100.0 ± 0.0` composite score** (`+50.91` over `flat-euclidean-low-dim-r2`, `+35.63` over `flat-euclidean-matched-dim-r8`, `+67.45` over `unprojected-hyperbolic-boundary-overflow`), **`0.1284` mean tree distortion**, **`100.0%` MAP@k**, **`100.0%` radial depth monotonicity**, and **`100.0%` manifold boundary safety**.

---

## 2. 5-Seed Comparative Benchmark Summary

| Geometry Profile | Composite Score (Mean ± 95% CI) | Tree Distortion | Neighborhood `MAP@k` (%) | Depth-Norm Monotonicity (%) | Boundary Safety $c\|x\|^2 < 1$ (%) |
| --- | --- | --- | --- | --- | --- |
| **`poincare-riemannian-gyrovector-b8`** | **`100.00 ± 0.00`** | **`0.1284`** | **`100.00%`** | **`100.00%`** | **`100.00%`** |
| `flat-euclidean-matched-dim-r8` | `64.37 ± 0.00` | `0.3307` | `84.50%` | `33.33%` | `100.00%` |
| `flat-euclidean-low-dim-r2` | `49.09 ± 0.00` | `0.4026` | `58.00%` | `33.33%` | `100.00%` |
| `unprojected-hyperbolic-boundary-overflow` | `32.55 ± 0.00` | `0.8180` | `54.00%` | `33.33%` | `48.50%` |

---

## 3. Verification Commands

```powershell
node --test tests/alive-hyperbolic-poincare-knowledge-embedder.test.cjs tests/alive-fabric-visualizer.test.cjs
node scripts/alive-hyperbolic-poincare-knowledge-embedder.cjs
```
