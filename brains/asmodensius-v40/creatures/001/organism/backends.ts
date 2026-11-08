// v3.6 optional WASM backends (Round 17). Both are opt-in and keep runs deterministic:
//  - Moonlab (tsotchke/moonlab, WASM): a real 3-qubit statevector runs the organism's circuit (RY per qubit, CNOT 0->1, CNOT 1->2, RZ(0.7*theta)).
//    Only the Born probabilities come from Moonlab; every measurement draw still uses the organism's seeded stream, so the run is reproducible.
//  - Eshkol (tsotchke/eshkol bytecode VM, WASM): the sleep/wake flip-flop rule is an Eshkol program evaluated every tick.
// Usage (node): const ml = await loadMoonlab(); org.setQuantumBackend(moonlabBackend(ml)); const es = await loadEshkol(); org.setRuleEngine(eshkolFlipFlop(es));
export const FLIPFLOP_SRC = "(define (flipflop asleep drive thr forced) (if asleep (if (or (< drive 0.2) forced) 0 1) (if (and (> drive thr) (not forced)) 1 0)))";
export function moonlabBackend(m: any): { prepare(th: number[]): void; probs(): number[]; free(): void } {
  const st = m._malloc(4096); let ok = m._quantum_state_init(st, 3); if (ok !== 0) throw new Error("moonlab init " + ok);
  return { prepare(th: number[]) { m._quantum_state_reset(st); for (let q = 0; q < 3; q++) m._gate_ry(st, q, th[q]); m._gate_cnot(st, 0, 1); m._gate_cnot(st, 1, 2); for (let q = 0; q < 3; q++) m._gate_rz(st, q, th[q] * 0.7); },
    probs() { const p: number[] = []; for (let k = 0; k < 8; k++) p.push(m._quantum_state_get_probability(st, BigInt(k))); return p; }, free() { m._quantum_state_free(st); m._free(st); } };
}
/** decisions are booleans: thresholds are passed with 17 significant digits so the comparison is the same IEEE-754 comparison as the TS rule */
export function eshkolFlipFlop(e: any): (asleep: boolean, drive: number, thr: number, forced: boolean) => boolean {
  const ev = e.cwrap("repl_eval", "string", ["string"]); try { e.cwrap("repl_init", null, [])(); } catch { /* optional */ } if (!e.__out) throw new Error("load the VM with loadEshkol() so its output is captured"); ev(FLIPFLOP_SRC);
  return (a, d, t, f) => { const out: string[] = e.__out; out.length = 0; ev(`(flipflop ${a ? "#t" : "#f"} ${d.toPrecision(17)} ${t.toPrecision(17)} ${f ? "#t" : "#f"})`); const r = (out[out.length - 1] ?? "").trim(); if (r !== "0" && r !== "1") throw new Error("eshkol: [" + JSON.stringify(r) + "]"); return r === "1"; };
}
export async function loadMoonlab(dir = "../wasm"): Promise<any> { const ML = require(dir + "/moonlab.js"); return (ML.default || ML)(); }
/** the VM prints results to stdout; the loader captures them into m.__out */
export async function loadEshkol(dir = "../wasm"): Promise<any> { const ES = require(dir + "/eshkol-vm.js"); const out: string[] = []; const m = await (ES.default || ES)({ print: (s: string) => out.push(s), printErr: (s: string) => out.push("ERR " + s) }); m.__out = out; return m; }
