#!/bin/sh
# V2.1-24 cross-process check: run the full harness in two separate node processes and compare results.json SHA-256
set -e; cd "$(dirname "$0")"
npx esbuild run.ts --bundle --platform=node --outfile=/tmp/run_bundle.js --log-level=error
node /tmp/run_bundle.js > run6.txt; cp results.json /tmp/results_a.json
node /tmp/run_bundle.js > /tmp/run6b.txt; cp results.json /tmp/results_b.json
A=$(sha256sum /tmp/results_a.json | cut -d' ' -f1); B=$(sha256sum /tmp/results_b.json | cut -d' ' -f1)
echo "run A sha256 $A"; echo "run B sha256 $B"; [ "$A" = "$B" ] && echo "REPRO PASS: byte-identical" || { echo "REPRO FAIL"; exit 1; }
