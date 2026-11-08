import { Organism, M40 } from "/workspace/Asmodensius-v40/creatures/001/organism/organism";
import { warm, show } from "/workspace/Asmodensius-v40/creatures/001/organism/tests_v31";
M40.aG = 0; const g: any = warm(2545, {}); const R0c = 0; const rec: number[][][] = [[], []]; let neg = 0, n3 = 0; for (let k = 0; k < g.kind.length; k++) if (g.kind[k] === 3) { n3++; if (g.syn.w[k] < 0) neg++; }
// capture dend before it is cleared: wrap step to snapshot dend after spikes propagate (dend accumulates during step, cleared at next integration)
for (let t = 0; t < 200; t++) { const b = t % 2; const x = new Array(16).fill(0); x[0] = 1; x[4 + b] = 1; for (let k = 0; k < 3; k++) { show(g, x); g.step(); } rec[b].push(Array.from(g.dend as Float64Array)); show(g, new Array(16).fill(0)); g.step(); }
const N = rec[0][0].length; let ds: number[] = []; for (let i = 0; i < N; i++) { const m = (b: number) => rec[b].reduce((s, v) => s + v[i], 0) / rec[b].length; const v = (b: number) => rec[b].reduce((s, r) => s + (r[i] - m(b)) ** 2, 0) / rec[b].length; const sd = Math.sqrt((v(0) + v(1)) / 2) || 1e-9; if (m(0) + m(1) > 0) ds.push(Math.abs(m(1) - m(0)) / sd); }
ds.sort((a, b) => b - a); console.log('kind3', n3, 'neg', neg, 'units w/ dend', ds.length, 'top dprime', ds.slice(0, 8).map((x) => x.toFixed(2)).join(' '), 'median', ds[ds.length >> 1]?.toFixed(2));
