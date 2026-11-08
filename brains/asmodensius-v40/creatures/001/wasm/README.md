# Eshkol and Moonlab in the browser: assessment and build (Round 16)

**Verdict: feasible, and done as a standalone demo.** Both upstream repositories ship their own WebAssembly paths:

- **Eshkol** (tsotchke/eshkol @ 341ac81, MIT). The bytecode VM builds to WASM with `scripts/build-wasm-repl.sh` (emsdk 6.0.13).
  - One local fix was needed: link with `EMCC_CFLAGS=-sDEFAULT_TO_CXX`. Without it the link fails on an undefined `std::length_error` vtable.
  - Output: `eshkol-vm.{js,wasm}` (1.35 MB wasm).
  - Four leaf builtins are aborting stubs upstream: capability_require, linear_solve, qrng_double, qrng_uint64.
  - This is the VM/REPL, not the LLVM native compiler. The LLVM `--wasm` path (eshkol-run --wasm) needs a full native LLVM build of eshkol-run (~1.4 GB tree), which was not attempted.
- **Moonlab** (tsotchke/moonlab @ cd3b234, MIT). `bindings/javascript/packages/core/emscripten` builds with CLAPACK-for-wasm, then CMake.
  - Output: `moonlab.{js,wasm}` (1.47 MB wasm).
  - The WebGPU backend is scaffolding only; the CPU state-vector path runs.

**Verified:**
- In node 22, `smoke.mjs` runs a Bell state H(0)·CNOT(0,1), giving P(q0=1) = P(q1=1) = 0.500 and P(q2=1) = 0.
- In the same run, Eshkol evaluates `(sq 12)` → 144, `(+ 1 2 3)` → 6 and `(map …)` → (2 4 6).
- `index.html` loads both modules in a browser page.

**Not done (on purpose):**
- organism.ts still uses its own seeded 3-qubit TypeScript port (Q3) instead of calling Moonlab. Swapping it in would change every seeded test trajectory and the frozen results. It would also make the creature depend on a 3 MB async WASM load. A future preregistered round could add `noise: "moonlab"` as an opt-in, with an equivalence test against Q3.
