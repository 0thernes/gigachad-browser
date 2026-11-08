import { warm, show } from "../tests_v31";
const g: any = warm(3365); for (let t = 0; t < 8; t++) { const a = t & 1, b = (t >> 1) & 1; const x = new Array(16).fill(0); x[a] = 1; x[4 + b] = 1; for (let k = 0; k < 3; k++) { show(g, x); g.step(); } console.log(a, b, Array.from(g.l5.slice(0, 16) as Float64Array).map((v) => v.toFixed(2)).join(" ")); show(g, new Array(16).fill(0)); g.step(); }
