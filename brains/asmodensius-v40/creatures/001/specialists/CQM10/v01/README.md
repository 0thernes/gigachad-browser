# CQM10 v01
Approach: hypothalamic glucose-sensing satiety gate on forage drive
Source: Parton et al. 2007 Nature (POMC glucose sensing)
Substrate: Combo A (ORG_V6=1, M50J {"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}) + flags below. Code lives flag-gated (default off) in organism/organism.ts; this folder is the side specialist spec + runner.
Flags (M50J): "c10":1
Run (dev seeds only): `BUNDLE=<bundle> /tmp/scp/run3.sh c10v1 ORG_V6=1 '{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1,"c10":1}' 500 C10`
Results: see ../README.md
