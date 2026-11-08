import { createRequire } from "module"; const require = createRequire(import.meta.url);
const ML = require("./moonlab.js"); const m = await (ML.default || ML)();
const st = m._malloc(4096); console.log("init", m._quantum_state_init(st, 3));
m._gate_hadamard(st, 0); m._gate_cnot(st, 0, 1);
console.log("moonlab P1(q0)", m._measurement_probability_one(st, 0).toFixed(3), "P1(q1)", m._measurement_probability_one(st, 1).toFixed(3), "P1(q2)", m._measurement_probability_one(st, 2).toFixed(3));
const ES = require("./eshkol-vm.js"); const e = await (ES.default || ES)();
const ev = e.cwrap("repl_eval", "string", ["string"]); try { e.cwrap("repl_init", null, [])(); } catch (x) { console.log("init err", x.message); }
console.log("eshkol:", ev("(define (sq x) (* x x)) (sq 12)"), "|", ev("(+ 1 2 3)"), "|", ev("(map (lambda (x) (* 2 x)) (list 1 2 3))"));
