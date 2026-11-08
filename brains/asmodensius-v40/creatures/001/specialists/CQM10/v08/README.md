# CQM10 v08
Approach: hepatic glucokinase uptake above 3.6 mM
Source: Agius 2008
Substrate: Combo A (ORG_V6=1, M50J {"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}) + flags below. Code lives flag-gated (default off) in organism/organism.ts; this folder is the side specialist spec + runner.
Flags (M50J): "c10":8
Run (dev seeds only): `BUNDLE=<bundle> /tmp/scp/run3.sh c10v8 ORG_V6=1 '{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1,"c10":8}' 500 C10`
Results: see ../README.md
