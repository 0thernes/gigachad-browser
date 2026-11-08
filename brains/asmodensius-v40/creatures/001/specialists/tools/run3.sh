#!/bin/bash
# run3.sh ARM ENVV5 M50J BLOCK TEST V40TUNE
A=$1; E=$2; J=$3; B=$4; T=$5; V=${6:-{\}}; O=/tmp/scp/out/${A}_$B; mkdir -p $O
[ -s $O/tune_$T.json ] && exit 0
env $E M50J="$J" V40TUNE="$V" ORG_MIND=v40 NSEEDS=${NS:-16} SEEDBASE=$B V39OUT=$O nice -n 19 node ${BUNDLE:-/tmp/scp/sc2.js} tune $T >>$O/log 2>&1
