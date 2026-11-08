// determinism check: synthetic is seed-stable; live -> replay reproduces bit-exactly
import { SubstrateTap } from "./substrate";
const a = new SubstrateTap("synthetic", 2000), b = new SubstrateTap("synthetic", 2000); for (let t = 0; t < 500; t++) { a.read(t); b.read(t); }
const synthOk = a.toNDJSON() === b.toNDJSON();
const live = new SubstrateTap("live", 2000); for (let t = 0; t < 200; t++) { live.read(t); for (let j = 0; j < 2e4; j++) Math.sqrt(j); } live.close();
const rep = new SubstrateTap("replay", 2000, SubstrateTap.fromNDJSON(live.toNDJSON())); for (let t = 0; t < 200; t++) rep.read(t);
console.log(JSON.stringify({ synthOk, replayOk: rep.toNDJSON() === live.toNDJSON(), liveSample: live.log[100].v.map((x) => +x.toFixed(3)) }));
