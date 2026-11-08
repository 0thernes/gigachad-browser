# CQM10 v05
Approach: set-point PI (integral) controller on glucose
Source: Cannon 1932; hypothalamic integral control
Substrate: Combo A (ORG_V6=1, M50J {"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}) + flags below. Code lives flag-gated (default off) in organism/organism.ts; this folder is the side specialist spec + runner.
Flags (M50J): "c10":5
Run (dev seeds only): `BUNDLE=<bundle> /tmp/scp/run3.sh c10v5 ORG_V6=1 '{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1,"c10":5}' 500 C10`
Results: see ../README.md
