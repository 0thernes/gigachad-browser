#!/bin/sh
# Full harness re-run. Reads results/gpu_record.json; writes only to results/ (results.json + run log).
set -e; cd "$(dirname "$0")"; N=${1:-latest}
npx esbuild run.ts --bundle --platform=node --outfile=/tmp/run_harness.js --log-level=error
HARNESS_DIR="$PWD" node /tmp/run_harness.js > ../results/run$N.txt 2>&1
