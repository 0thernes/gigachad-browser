#!/bin/sh
# Concatenate harness + organism (the SAME organism.ts that node tests run) + inspector + app into the single-module Page source
{ echo 'import { Fragment, useEffect, useRef, useState, Button, Toggle, useGrokTheme } from "grok/canvas";'
  sed -e "s/^export //" -e "/^type Rng = /d" -e "/^function mulberry(/d" ../harness/harness.ts # v3.7: keep organism's snapshot-capable mulberry (same sequence, plus getState/setState) so snapshot() in the Page carries RNG states
  sed "s/^export //" ../organism/organism.ts
  sed -e "s/^export //" ../organism/coupling.ts
  cat inspector.tsx app.tsx; } > page.tsx
