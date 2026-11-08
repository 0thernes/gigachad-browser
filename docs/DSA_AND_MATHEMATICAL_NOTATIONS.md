# Data Structures, Algorithms (DSA) & Mathematical Notations Reference

> **License Notice:** Download and Personal Use Only. Commercial use, modification, editing, derivative works, or claiming ownership are strictly prohibited. See [`/LICENSE`](../LICENSE).

---

## 1. The 7-Tier Heterogeneous Precision Tensor Arena (`Heterogeneous7TierPrecisionArena`)

Rather than relying on `Float32Array` alone, [`systems/ported-multiverse-brains.js`](../systems/ported-multiverse-brains.js) and [`systems/alife-25-bleeding-edge-models.js`](../systems/alife-25-bleeding-edge-models.js) partition contiguous `SharedArrayBuffer` / `ArrayBuffer` arenas (`131,072` bytes + `65,536` bytes = `196,608` bytes cache-line aligned) into **7 hardware-specialized numerical representations**:

| Tier | TypedArray View | Bit Width & Format | Mathematical Role & Algorithmic Purpose | Time / Space Complexity |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `Float64Array` | 64-Bit IEEE-754 (`1-11-52`) | Unitary Crank-Nicolson 1D Schrödinger wavepacket $\psi(x,t)$, 3-Qubit/6-Qubit statevectors, Fubini-Study metric $g_{ab}$, Berry curvature $\Omega_{ab}$, Frenet-Serret $(\kappa, \tau)$, and Recursive Least Squares (`RLS`) covariance $P_t$. | $O(N)$ Thomas solver, zero norm drift ($\|\psi\|_2 = 1.000000$) |
| **2** | `BigInt64Array` / `BigUint64Array` | 64-Bit Exact Integer & SWAR Bitboard | Exact Cyclotomic ring $\mathbb{Z}[\zeta_8] / (\zeta_8^4 + 1)$ multiplication (`N(u) = 1` with zero floating-point rounding) and 64-bit SWAR Kanerva Hyperdimensional Computing (`HDC`) with `XOR` binding and `POPCNT` Hamming similarity. | $O(1)$ bitwise `XOR` + SWAR `POPCNT` (64 bits/instruction) |
| **3** | `Int32Array` / `Uint32Array` | 32-Bit Signed / Unsigned Integer | Compressed Sparse Row (`CSR`) graph row/column pointers, Tarjan Union-Find disjoint-set forests with path compression (`gotUnionFindParent21`), and 32-bit FNV-1a / SplitMix32 locality-sensitive `SimHash`. | $O(\alpha(V))$ amortized Union-Find equivalence quotienting |
| **4** | `Uint16Array` | 16-Bit IEEE-754 `FP16` (`1-5-10`) & `BFloat16` (`1-8-7`) + Morton Z-Code | `32×32` Oja-normalized Fast-Weight Hebbian overlays (`u16Fp16FastWeights`), `BFloat16` gradient buffers with round-to-nearest-even, and 15-bit 3D Morton Z-order spatial hashing ($5\times 3$ bit interleaving). | $2\times$ memory bandwidth reduction vs. FP32 |
| **5** | `Int8Array` | 8-Bit Symmetric `Q8_0` (`[-127..+127]`) | Quantized synaptic matrices updated online via **Bernoulli Stochastic Rounding** (`stochasticRoundInt8`): $\text{SR}(x) = \lfloor x \rfloor + \text{Bernoulli}(x - \lfloor x \rfloor)$, ensuring sub-LSB updates ($|\Delta w| \ll 0.5$) have exact unbiased expectation $\mathbb{E}[\text{SR}(x)] = x$. | $4\times$ density vs. FP32, unbiased sub-LSB plasticity |
| **6** | `Uint8Array` | 2-Bit Packed Ternary `BitNet b1.58` $\{-1,0,+1\}$ + `u8` Delays | Packs 4 ternary weights per byte (`00` $\to 0$, `01` $\to +1$, `10` $\to -1$) for **multiplication-free** matrix-vector products (pure addition/subtraction) plus polychronous axonal delay lines $d_{ij} \in [1..24]$. | $16\times$ compression vs. FP32, $0$ floating-point multiplies |
| **7** | `Float32Array` + `WebAssembly` | 32-Bit IEEE-754 + Zig 0.17.0 Native Wasm | Fast SIMD activation lanes coupled directly with [`brains/cqm-xylos/cqm_kernels.wasm`](../brains/cqm-xylos/cqm_kernels.wasm) (18 compiled Zig exports) and the in-memory JIT FMA Wasm kernel (`0x0061736d`). | Native JIT speed, `< 1.8 ms` p95 per 60Hz frame |

---

## 2. Core Data Structures & Asymptotic Complexity Table

| Subsystem | Core Data Structure | Algorithm | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :---: | :---: |
| **Atom of Thought (`AoT`)** | Hash-Consed Flyweight Arena (`aotArenaVectors16x16` + `aotSimHashTable16`) | Decursive Markovian Contraction $C_\psi(a_0, z_{\text{GoT}}^*)$ & FNV-1a SimHash Deduplication | $O(D^2)$ where $D=16$ | $O(K \cdot D)$ fixed ($K=16$) |
| **Tree of Thought (`ToT`)** | Flat-Array 4-Ary Tree (`totLatentArena21x16`, $1+4+16=21$ nodes) | Corecursive Anamorphic Unfolding + PUCT Selection + Cosine/Hamming Decursive Pruning | $O(N_{\text{tree}} \cdot D^2)$ ($N_{\text{tree}}=21$) | $O(N_{\text{tree}} \cdot D)$ (`336` floats) |
| **Graph of Thought (`GoT`)** | 16-Vertex DAG (`gotAdjMatrix16x16`) + Union-Find (`gotUnionFindParent21`) | Cross-Branch Attention Merge + Cycle-Breaking Topological Guard + 2-Step Spectral PageRank | $O(V^2 + V \cdot D^2)$ ($V=16$) | $O(V^2 + V \cdot D)$ (`512` floats) |
| **Decursive Self-Deduplicator (`DSD-24`)** | Orthonormal Banished Basis (`banishedBasis8x64`) + Bloom/SimHash Rings | Power-Iteration SVD + Modified Gram-Schmidt Nullspace Projection $P_\perp = I - U_{\text{ban}} U_{\text{ban}}^\top$ | $O(R \cdot D)$ ($R=8, D=64$) | $O(R \cdot D)$ (`512` floats) |
| **Empirical *C. elegans* Connectome** | Edge-List CSR (`celegansEdgeSrc512`, `celegansEdgeDst512`, `celegansEdgeWeight512`) | Separate Directed Chemical Synapses ($w_{ij}\tanh(V_i)$) + Symmetric Gap Junctions ($g_{ij}(V_i - V_j)$) | $O(|E|)$ ($|E|=512$ active hubs from $7,379$ edges) | $O(|V| + |E|)$ (`2.5 KB`) |
| **Recursive Least Squares (`RLS`)** | Symmetric Positive-Definite Covariance Matrix (`P_rls8x8` in `Float64Array`) | Sherman-Morrison-Woodbury Rank-1 Inverse Update with Forgetting Factor $\lambda = 0.995$ | $O(d^2)$ ($d=8$) | $O(d^2)$ (`64` doubles) |
| **Gated-DeltaNet Fast Weights** | Associative Fast-Weight Matrix (`deltaNetFastS8x8`) | $S_t = \alpha_t S_{t-1} - \beta_t (S_{t-1} k_t - v_t) k_t^\top$ + Stochastic `Int8` Rounding | $O(d^2)$ ($d=8$) | $O(d^2)$ (`64` floats + `64` int8) |

---

## 3. Master Mathematical Notations

1. **Spiking Liquid Time-Constant (`sLTC`) Conductance-Shortened ODE:**
   $$\tau_{\text{eff}, i}(t) = \frac{\tau_{0,i}}{1 + \tau_{0,i}\,\sigma(W_{\text{gate}}\,x(t))}, \qquad \frac{dv_i}{dt} = -\frac{v_i(t) - E_{\text{leak}}}{\tau_{\text{eff},i}(t)} + \sum_j g_{ij}(t)\,(E_{\text{rev},j} - v_i(t))$$

2. **Selective State-Space (`Mamba-SSM`) Zero-Order Hold Discretization:**
   $$\Delta_t = \text{softplus}(W_\Delta x_t + b_\Delta), \qquad \bar{A}_t = \exp(\Delta_t A), \qquad \bar{B}_t = (\Delta_t A)^{-1}(\exp(\Delta_t A) - I)\,\Delta_t B_t, \qquad h_t = \bar{A}_t h_{t-1} + \bar{B}_t x_t$$

3. **Fubini-Study Quantum Geometric Tensor (`QGT`) & Berry Curvature (`cqm_qgtl_full_tensor_2d`):**
   $$Q_{\mu\nu} = \langle \partial_\mu \psi \mid (I - |\psi\rangle\langle\psi|) \mid \partial_\nu \psi \rangle = g_{\mu\nu} - \frac{i}{2}\,\Omega_{\mu\nu}$$

4. **Frenet-Serret Thought Curvature $\kappa(t)$ & Torsion $\tau(t)$ in `Float64Array`:**
   $$\kappa(t) = \frac{\|\dot{\mathbf{z}}(t) \times \ddot{\mathbf{z}}(t)\|}{\|\dot{\mathbf{z}}(t)\|^3 + \varepsilon}, \qquad \tau(t) = \frac{\det([\dot{\mathbf{z}}(t),\, \ddot{\mathbf{z}}(t),\, \dddot{\mathbf{z}}(t)])}{\|\dot{\mathbf{z}}(t) \times \ddot{\mathbf{z}}(t)\|^2 + \varepsilon}$$

5. **Thom-Zeeman Cusp Catastrophe Ideation Regulator (`ThalerDabusCreativityCatastropheBrain`):**
   $$\frac{d\Xi}{dt} = -\frac{\partial V(\Xi; \alpha, \beta)}{\partial \Xi} = -\left(4\Xi^3 + 2\alpha\Xi + \beta\right), \qquad \Delta_{\text{cusp}} = 8\alpha^3 + 27\beta^2$$
