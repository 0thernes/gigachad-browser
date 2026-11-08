# HOT3RM st05
Approach: shared weights scST 3, LC coupling scCI 0.25
Source: Kepecs 2008 + Yu & Dayan 2005
Substrate: Combo A (ORG_V6=1, M50J {"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}) + flags below. Code lives flag-gated (default off) in organism/organism.ts; this folder is the side specialist spec + runner.
Flags (M50J): "scCI":0.25,"scST":3
Run (dev seeds only): `BUNDLE=<bundle> /tmp/scp/run3.sh stE ORG_V6=1 '{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1,"scCI":0.25,"scST":3}' 500 HOT3RM`
Results: see ../README.md
