# CQM10 v10
Approach: central insulin satiety gate on whole drive
Source: Woods et al. 1979; Brüning et al. 2000
Substrate: Combo A (ORG_V6=1, M50J {"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}) + flags below. Code lives flag-gated (default off) in organism/organism.ts; this folder is the side specialist spec + runner.
Flags (M50J): "c10":10
Run (dev seeds only): `BUNDLE=<bundle> /tmp/scp/run3.sh c10v10 ORG_V6=1 '{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1,"c10":10}' 500 C10`
Results: see ../README.md
