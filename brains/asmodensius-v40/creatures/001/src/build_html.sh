#!/bin/sh
# page.tsx -> self-contained HTML (React 18 + grok/canvas shim). Usage: sh build_html.sh OUT.html  (needs react/react-dom in /tmp/cb/node_modules)
set -e; OUT=${1:-../index.html}; D=/tmp/cb3; mkdir -p $D; ln -sfn /tmp/cb/node_modules $D/node_modules
sh build.sh; cp page.tsx $D/creature.tsx; cp /tmp/cb/main.tsx $D/main.tsx; cp shim/canvas.js $D/canvas.js
npx --prefix /tmp/cb esbuild $D/main.tsx --bundle --minify --format=iife --target=es2020 --alias:grok/canvas=$D/canvas.js --define:process.env.NODE_ENV='"production"' --outfile=$D/out.js --jsx=automatic --log-level=warning
{ printf '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Creature #001</title><style>body{margin:0;background:#09111c;color:#d9e2ee;font-family:system-ui,sans-serif}</style></head><body><div id="r"></div><script>'; cat $D/out.js; printf '</script></body></html>\n'; } > $OUT
echo "built $OUT $(wc -c < $OUT) bytes"
