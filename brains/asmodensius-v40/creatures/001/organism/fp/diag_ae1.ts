// AE-1 diagnostic: per reversal block, learning curve (mean pTrue of chosen site, by forage bins since reversal), chance/best, choice entropy, value-pTrue correlation
import { Organism } from "/workspace/Asmodensius-v40/creatures/001/organism/organism";
const B = Number(process.env.SEEDBASE), N = Number(process.env.NSEEDS ?? 8), D = 1440;
const corr = (x: number[], y: number[]) => { const mx = x.reduce((a, b) => a + b) / x.length, my = y.reduce((a, b) => a + b) / y.length; let sxy = 0, sx = 0, sy = 0; x.forEach((v, i) => { sxy += (v - mx) * (y[i] - my); sx += (v - mx) ** 2; sy += (y[i] - my) ** 2; }); return sxy / Math.sqrt(sx * sy + 1e-12); };
for (const les of [false, true]) { const acc: Record<string, number[]> = {}; const put = (k: string, v: number) => (acc[k] ??= []).push(v);
  for (let s = B; s < B + N; s++) { const g: any = new Organism({ seed: s, rpeLesion: les } as any); const p0 = g.pTrue.slice(); while (g.t < 480) g.step(); let rv = 0, blk = 0, nf = 0, ch: number[] = [];
    const endBlock = () => { const acs = [...Array(16).keys()].filter((k) => g.access[k]); const pt = acs.map((k) => g.pTrue[k]); put(`b${blk} chance`, pt.reduce((a, b) => a + b, 0) / Math.max(1, pt.length)); put(`b${blk} best`, Math.max(...pt)); put(`b${blk} nAccess`, acs.length);
      const cnt = new Array(16).fill(0); ch.forEach((c) => cnt[c]++); const H = -cnt.filter((c) => c).reduce((a, c) => a + (c / ch.length) * Math.log2(c / ch.length), 0); put(`b${blk} entropy`, H); put(`b${blk} nForage`, ch.length);
      if (acs.length > 2) { put(`b${blk} r(value,pTrue)`, corr(acs.map((k) => g.valueEst(k)), pt)); put(`b${blk} r(wSite,pTrue)`, corr(acs.map((k) => g.wSite[k]), pt)); put(`b${blk} r(betaMean,pTrue)`, corr(acs.map((k) => g.bA[k] / (g.bA[k] + g.bB[k])), pt)); } ch = []; nf = 0; };
    while (g.t < 480 + 2 * D) { const pf = g.foraged; g.step(); if (g.foraged > pf) { const c = g.choices[g.choices.length - 1]; ch.push(c); put(`b${blk} pChosen f${Math.min(3, Math.floor(nf / 10))}`, g.pTrue[c]); nf++; }
      if ((g.t - 480) % 720 === 0) { endBlock(); blk++; rv++; for (let k = 0; k < 16; k++) g.pTrue[k] = rv % 2 ? 0.6 - p0[k] : p0[k]; } } }
  console.log(les ? '== rpeLesion' : '== full'); for (const k of Object.keys(acc).sort()) console.log(k.padEnd(24), (acc[k].reduce((a, b) => a + b, 0) / acc[k].length).toFixed(3), 'n', acc[k].length); }
