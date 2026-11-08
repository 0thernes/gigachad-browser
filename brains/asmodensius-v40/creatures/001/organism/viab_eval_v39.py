#!/usr/bin/env python3
"""v3.9 viability evaluation (prereg v3.9 section A; v3.8a rules plus fat-exhaustion stage and death cause). usage: viab_eval_v39.py DIR [seed0 nseeds]
Reads DIR/{steady,starve,refeed}_<seed>.json from viability_v39.ts; prints JSON verdicts."""
import json, sys, os, statistics as st, math
D = sys.argv[1]; s0 = int(sys.argv[2]) if len(sys.argv) > 2 else 1000; n = int(sys.argv[3]) if len(sys.argv) > 3 else 16
L = lambda m, s: json.load(open(os.path.join(D, f"{m}_{s}.json")))
def slope(y):
    x = list(range(len(y))); mx, my = st.mean(x), st.mean(y); return sum((a - mx) * (b - my) for a, b in zip(x, y)) / sum((a - mx) ** 2 for a in x)
def ci(v):  # 95% t CI of the mean
    m, se = st.mean(v), st.stdev(v) / math.sqrt(len(v)); tq = {29: 2.045, 15: 2.131, 5: 2.571, 24: 2.064}.get(len(v) - 1, 2.0); return m, m - tq * se, m + tq * se
R = {}
# (a) steady state with ample food: last 6 of 12 days
fs, gs, bal, deaths = [], [], [], 0
for s in range(s0, s0 + min(n, 6)):
    d = L("steady", s); deaths += d["deaths"]
    for c in d["creatures"]:
        if len(c["fat"]) < 12: continue
        fs.append(slope(c["fat"][-6:])); gs.append(slope(c["gly"][-6:])); e, x = sum(c["eat"][-6:]), sum(c["exp"][-6:]); bal.append(abs(e - x) / x)
fm, flo, fhi = ci(fs); gm, glo, ghi = ci(gs)
R["a_steady"] = dict(n=len(fs), deaths=deaths, fatSlope=[round(fm, 2), round(flo, 2), round(fhi, 2)], glySlope=[round(gm, 3), round(glo, 3), round(ghi, 3)], meanAbsImbalance=round(st.mean(bal), 3),
    pass_=deaths == 0 and fhi >= 0 and flo > -2.0 and ghi >= 0 and glo > -0.5 and st.mean(bal) < 0.10)
# (b) starvation stages + reserve-scaled window
ok, rows = 0, []
for s in range(s0, s0 + n):
    d = L("starve", s); S = d["stages"]; Rw = (d["fat0"] + d["gly0"] + 0.5 * d["mus0"]) / d["fedExp"]
    seq = all(S[k] is not None for k in S) and S["forage"] <= min(S["ketosis"], S["torpor"]) and S["glycogen"] <= S["ketosis"] and max(S["ketosis"], S["torpor"]) < S["death"] and S["ketosis"] <= S["fatExhaustion"] <= S["death"] and d.get("deathCause", "").startswith("protein depletion")
    win = S["death"] is not None and 0.5 * Rw <= S["death"] <= 1.5 * Rw; ok += seq and win; rows.append(dict(seed=s, R=round(Rw, 2), **S, ordered=seq, inWindow=win, cause=d.get("deathCause")))
R["b_starve"] = dict(nOK=ok, n=n, pass_=ok >= n - 1, rows=rows)
# (c) refeed at day 3 vs no refeed (same seeds)
rec, lifeR, lifeS = 0, [], []
for s in range(s0, s0 + n):
    r, d = L("refeed", s), L("starve", s); lifeR.append(8.0 if r["alive"] else r["stages"]["death"]); lifeS.append(min(8.0, d["stages"]["death"] or 8.0))
    fmin = min(t[1] for t in r["trace"]); rec += r["alive"] and r["end"]["gly"] >= 0.5 * r["gly0"] and r["end"]["ket"] < 0.5 and r["end"]["fat"] - fmin >= 0.5 * (r["fat0"] - fmin)  # regained >= half the fat lost
dd = st.mean(lifeR) - st.mean(lifeS); sp = math.sqrt((st.pvariance(lifeR) + st.pvariance(lifeS)) / 2) or 1e-9; se = math.sqrt(st.variance(lifeR) / n + st.variance(lifeS) / n) or 1e-9
R["c_refeed"] = dict(nRecovered=rec, n=n, lifeRefeed=round(st.mean(lifeR), 2), lifeNoRefeed=round(st.mean(lifeS), 2), d=round(dd / sp, 2), t=round(dd / se, 2), pass_=rec >= n - 1)
print(json.dumps(R, indent=1))
