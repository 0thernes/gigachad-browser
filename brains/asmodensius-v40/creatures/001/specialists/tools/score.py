import json,glob,os,math,statistics as S,sys
blk=sys.argv[1] if len(sys.argv)>1 else '500'
def dt(a,b):
    ma,mb=S.mean(a),S.mean(b); va,vb=S.variance(a),S.variance(b); sp=math.sqrt((va+vb)/2) or 1e-12
    return (ma-mb)/sp,(ma-mb)/(math.sqrt(va/len(a)+vb/len(b)) or 1e-12)
R={}
for f in glob.glob(f'/tmp/scp/out/*_{blk}/tune_*.json'):
    arm=os.path.basename(os.path.dirname(f)).rsplit('_',1)[0]; j=json.load(open(f)); A=j['arms']; fk=list(A)[0]
    R[(arm,j['key'])]=A
arms=sorted({a for a,_ in R}, key=lambda a:(a!='base',a)); tests=sorted({t for _,t in R})
print(f"# block {blk} (16 seeds each). Cell: PASS/fail, weakest within-test control d/t; [vs base full: d]")
print("| arm | "+" | ".join(tests)+" |"); print("|---"*(len(tests)+1)+"|")
for a in arms:
    row=[]
    for t in tests:
        if (a,t) not in R: row.append('.'); continue
        A=R[(a,t)]; fk=list(A)[0]; cs=[dt(A[fk],v) for k,v in A.items() if k!=fk]
        ok=all(d>=0.8 and tt>=2.75 for d,tt in cs); d,tt=min(cs,key=lambda x:x[0])
        s=f"{'PASS' if ok else 'fail'} {d:.2f}/{tt:.1f}"
        if a!='base' and ('base',t) in R: s+=f" [{dt(A[fk],R[('base',t)][fk])[0]:+.2f}]"
        row.append(s)
    print(f"| {a} | "+" | ".join(row)+" |")
