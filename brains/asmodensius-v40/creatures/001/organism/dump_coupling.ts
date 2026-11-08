import { PARTS, COUPLING } from "./coupling"; import { Organism } from "./organism";
const o = new Organism({ seed: 2000 }); require("fs").writeFileSync(process.argv[2], JSON.stringify({ parts: PARTS, edges: COUPLING, params: o.paramCount() }, null, 1));
