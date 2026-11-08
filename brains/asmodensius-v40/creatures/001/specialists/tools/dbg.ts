import { Organism } from "/workspace/Asmodensius-v40/creatures/001/organism/organism";
const g: any = new Organism({ seed: 600 } as any); let lo = 0, cs: number[] = []; for (let t = 0; t < 900; t++) { g.step(); lo += g.scConfLow ?? -1; if (t % 100 == 0) cs.push(g.mind.conf, g.mind.margin, g.mind.win); } console.log(lo, cs.map(x=>+x.toFixed(3)).join(" "));
