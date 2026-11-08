// Tuning on disjoint seeds 2000..2015 only (not the test seeds).
import { SEEDS } from "./harness"; import { setDev } from "./v25mech"; import { v25Tests } from "./v25tests";
const orig = SEEDS.slice(); for (let k = 0; k < 16; k++) SEEDS[k] = 2000 + k;
for (const [eta, etaL, steps] of JSON.parse(process.argv[2])) { setDev({ eta, etaL, steps }); const c = v25Tests()[0].cmps; console.log(eta, etaL, steps, c.map((x) => `${x.full.toFixed(2)}/${x.ctrl.toFixed(2)} d${x.d.toFixed(2)} t${x.t.toFixed(2)}`).join(" | ")); }
