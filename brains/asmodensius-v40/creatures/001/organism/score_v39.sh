#!/bin/sh
while [ ! -f /tmp/w/r20/qt.done ]; do sleep 30; done
cd /workspace/Asmodensius/creatures/001/organism
python3 viab_eval_v39.py ../results/v39_parts 1016 48 > ../results/v39_parts/viab_eval.json
node /tmp/w/sum39.js > /tmp/w/r20/sum.txt 2>&1
echo SCORED > /tmp/w/r20/scored
