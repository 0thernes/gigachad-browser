# paired comparison of probe_integ outputs: python3 integ_ab.py on.json off.json ; "moves" = paired |t|>=2.75
import json,sys,math,statistics as S
a,b=[json.load(open(f)) for f in sys.argv[1:3]]; skip={'awSated','awHungry','conf','confLow'}; mv=[]
for k in a:
    d=[x-y for x,y in zip(a[k],b[k])]; m=S.mean(d); sd=S.stdev(d) if len(d)>1 else 0
    t=m/(sd/math.sqrt(len(d))) if sd>0 else (0 if m==0 else float('inf')); dz=m/sd if sd>0 else 0
    flag=abs(t)>=2.75 and k not in skip; mv+= [k] if flag else []
    print(f"{k:12s} on {S.mean(a[k]):.4f} off {S.mean(b[k]):.4f} dz {dz:+.2f} t {t:+.2f} {'MOVES' if flag else ''}")
print("subsystems moved:",len(mv),mv,"-> (a)", "PASS" if len(mv)>=2 else "FAIL")
