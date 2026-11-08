# Round 20 status (narrowed scope)

- Freeze committed: prereg v3.9 (4f0061c). Mechanisms for RPT-2, HOT-1, HOT-3 and AE-1 ship OFF and are deferred to Round 21.
- Test suite: 48 fresh seeds (1016–1063). It is running under nohup with at most 3 jobs.
  - Queue: /tmp/w/r20/qt
  - Output: results/v39_parts
  - When the queue finishes it writes /tmp/w/r20/qt.done.
- Automatic scoring runs under nohup (/tmp/w/r20/score.sh). It writes:
  - results/v39_parts/viab_eval.json
  - results/organism_v39.{json,txt}
- Resume after an interruption: rerun `nohup /tmp/w/r19/runq.sh /tmp/w/r20/qt &`. Jobs skip outputs that already exist. Then rerun score.sh.
