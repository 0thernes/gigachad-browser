#!/bin/bash
cd /tmp/scp; while [ ! -e s1.done ]; do sleep 120; done
C1='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}'; C2='{"v6P":0,"v6Ak":0,"scAIe":1,"scEm":1,"scSR":1,"scAIm":0.5,"scBM":1}'
for B in 500 540; do for T in HOT3RM RPT2R AE1 AE2 RPT1 RPT2RL5 UAL GWT2 AINF C10 C16R; do
  printf "comboA ORG_V6=1 '%s' %s %s '{}'\ncomboB ORG_V6=1 '%s' %s %s '{}'\n" "$C1" $B $T "$C2" $B $T; done; done > jobs_combo.txt
for B in 540; do for T in HOT3RM RPT2R AE1 AE2 RPT1 RPT2RL5 UAL GWT2 AINF C10 C16R; do printf "base ORG_V5=11 '{}' %s %s '{}'\nv6hub ORG_V6=1 '{\"v6P\":0,\"v6Ak\":0}' %s %s '{}'\n" $B $T $B $T; done; done >> jobs_combo.txt
xargs -P 2 -L 1 bash -c 'BUNDLE=/tmp/scp/sc3.js /tmp/scp/run3.sh "$0" "$1" "$2" "$3" "$4" "$5"' < jobs_combo.txt; touch combo.done
