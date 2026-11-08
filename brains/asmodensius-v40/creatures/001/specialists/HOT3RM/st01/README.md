# HOT3RM st01
Approach: self-trained confidence from forage outcomes, shared monitor weights, scST 1, scCI 1
Source: Kepecs et al. 2008; Fleming & Daw 2017
Substrate: Combo A (ORG_V6=1, M50J {"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}) + flags below. Code lives flag-gated (default off) in organism/organism.ts; this folder is the side specialist spec + runner.
Flags (M50J): "scCI":1,"scST":1
Run (dev seeds only): `BUNDLE=<bundle> /tmp/scp/run3.sh stA ORG_V6=1 '{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1,"scCI":1,"scST":1}' 500 HOT3RM`
Results: see ../README.md
