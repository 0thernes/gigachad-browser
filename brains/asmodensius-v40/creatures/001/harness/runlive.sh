#!/bin/sh
# Runs all 80 v2.3 live runs (16 seeds x {none,hab,circ,circbody,chain}), 4 in parallel; skips finished ones.
cd "$(dirname "$0")"; OUT=../results/live; mkdir -p $OUT; PAGE="file://$(cd .. && pwd)/index.html"
for s in $(seq 1000 1015); do for a in none hab circ circbody chain; do echo "$s $a"; done; done | xargs -P 4 -n 2 sh -c '
  f='"$OUT"'/$0_$1.json; [ -s "$f" ] && grep -q "\"R\"" "$f" && exit 0
  A=$1; [ "$A" = none ] && A=""
  LIVE_TIMEOUT_MS=3600000 timeout 3700 node --experimental-websocket livecdp.mjs "'"$PAGE"'?livetest=1&seed=$0&ablate=$A&frames=480" > "$f.tmp" 2>/dev/null; mv "$f.tmp" "$f"; echo "done $0 $1 $(date +%T)"'
