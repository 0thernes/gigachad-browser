// smoke: developmental wiring grows, matches density, is topographic, inherits; short life runs. Not a test.
import { Organism } from "./organism"; import { mutateGenome } from "./develop"; import { mulberry } from "./organism";
const base = new Organism({ seed: 2005, mind: "v40" } as any), dev = new Organism({ seed: 2005, mind: "v40", develop: true } as any);
const child = new Organism({ seed: 2006, mind: "v40", develop: true, devGenome: mutateGenome(dev.devGenome!, mulberry(1)) } as any);
for (const g of [base, dev, child]) for (let t = 0; t < 2880 && !g.dead; t++) g.step();
console.log(JSON.stringify({ synBase: base.syn.w.length, synDev: dev.syn.w.length, devStats: dev.devStats, childStats: child.devStats, live: dev.mask.reduce((a: number, b: number) => a + (b > 0 ? 1 : 0), 0), foraged: [base.foraged, dev.foraged, child.foraged], dead: [base.dead, dev.dead, child.dead], fat: [base.fat, dev.fat, child.fat].map((x) => +x.toFixed(1)) }));
