# Creature #1 — Gemini Argon 4 Antigravity Handoff
Written Mon 2 Nov 2026, 13:30 PHT (UTC+8) = Sun 1 Nov 21:30 PST (box clock is US Pacific). Zero prior context assumed. Mirror of the Grok Page of the same title.

## 0. TL;DR
- Project: Asmodensius v4.0, Creature #1 — an artificial organism (TS, node/bun) scored against Butlin-14 indicator properties, 10 consciousness frameworks, and CQM-25, with preregistered grade-A stats.
- Official standing (R21, seeds 1064-1111, n=48): v5.7b Butlin 9/14, Frameworks 6/10, CQM 17/25 (12/14, 8/10, 20/25 counting disclosed R variants). Harsh audit: about 11-12 results are solid, about 10-12 are fluff.
- LIVE: Alex approved Combo A (SC-PORT prereg). SC-PORT.md text says FROZEN but the freeze commit is NOT made yet (file modified, uncommitted). Test seeds 1112-1159 NOT run yet. /tmp/scp is running dev specialist loops (st10 on block 500; sc10.js tune AINF/C10/C16R).
- Never push. Never claim consciousness. Never touch test seeds before a frozen prereg commit.

## 1. Mission & non-negotiables
1. Grade A only: Cohen d >= 0.8 AND Welch t >= 2.75 vs EVERY control (plus non-ceiling rule).
2. Preregister before any test seed; freeze commit precedes run; no tuning after seeing test results; report all results.
3. Dome/world stays neutral: no harness tweaks that make the test easier.
4. No consciousness claim. Indicator properties measured, nothing more.
5. No git push until grade A on primary claims AND Alex says OK. Local commits only.
6. Originality + citations: concepts may come from literature (cite), no other A-Life project's code.
7. Reuse allowed: SUPER CREATURE / CQM (Alex's own code), Tsotchke (allowed).

## 2. What Creature #1 is
- Repo: /workspace/Asmodensius-v40 (branch v4.0). Organism code creatures/001/organism/organism.ts; runner organism/run_v39.ts; tests organism/tests_v31.ts.
- Arch paths selected by env: ORG_V5=11 -> v5.7b (official baseline); v5.7d (arm D in R21, from wild-arch 4bc5c03, not ported); ORG_V6=1 -> V6 binding hub (DA-RPE consolidated; v6P learned precision, v6Ak appetite integral); ORG_MIND=v39 bit-exact repro. Specialist mechanisms live behind M50J JSON flags (default off, bit-identical when off).
- v6.1 (B28: cortex-size-invariant efferent gain) FAILED its goal: keeps AE1, loses C16R and CQM12 on dev, recovers none of C10/UAL/RPT2RL5. B29 v6.2 screen on dev 3961 only.
- Docs: CORE-ARCHITECTURE.md, FIRST-PRINCIPLES.md, REARCHITECT.md (scale stages), DELARP-PLAN.md (de-LARP audit), DISCOVERIES.md.

## 3. Official scoreboard R21 (prereg OFFICIAL-R21.md, freeze f7ff08d)
| List | A v5.7b | A +R | D v5.7d | D +R |
|---|---|---|---|---|
| Butlin | 9/14 | 12/14 | 9/14 | 12/14 |
| Frameworks | 6/10 | 8/10 | 5/10 | 7/10 |
| CQM | 17/25 | 20/25 | 17/25 | 20/25 |
Previous R20 (v3.9): Butlin 9/14, Frameworks 7/10, CQM 17/25.

Butlin A: PASS RPT-1 1.04/5.10, GWT-1 2.89, HOT-1 2.08, HOT-2 2.06, HOT-4 6.31, AST-1 1.18, PP-1 1.12, AE-1 0.98/4.80, AE-2 2.48. PARTIAL RPT-2 (-0.28; RPT2RL5 PASS 1.14/5.6; RPT2R FAIL A, PASS D 3.36), GWT-3 (GWT-3R PASS 10.03), HOT-3 (HOT3RM-P paired PASS dz 1.15). FAIL GWT-2 (ceiling rule), GWT-4.
Frameworks A: PASS thaler9, iit4 2.46, attentionSchema 7.85, fieldIntegration 1.20 (D fails 0.76), ual 1.06, sensorimotor 3.31. PARTIAL projective, ctm. FAIL activeInference 0.00, butlin14.
CQM A FAIL: CQM04 0.04, CQM06 0.30, CQM10 -0.82, CQM18 0.00 (ceiling), CQM23.

### Harsh solid-vs-fluff audit
Solid (~11-12): RPT-1, GWT-1, HOT-1, HOT-2/CQM13, AST-1, PP-1, AE-1 (borderline 0.98), AE-2, ual, sensorimotor, fieldIntegration (A only), RPT2RL5/PROJR as R variants with real lesions.
Fluff/weak (~10-12): CQM25 = parameter count (hardcoded scale, DELARP P10); CQM03 and CQM05 straw controls (CQM03R FAILS -2.31; CQM05 d 39 is a giveaway); iit4 circular (phi-proxy measured on the very integration it is built from); CQM24 no d/t; huge d (GWT-3 19, ctm 17, projective 9.6, CQM02 14) = clean-stimulus ceiling originals; thaler9 inverted-U form; HOT-4 6.3 suspicious; attentionSchema 7.85 likely easy control. LIFE-100: 0 preregistered passes (202/500 attrs BUILT only). NOVEL-100: 0 done, 2 partial.

## 4. DevOps & pipeline
- Box (Linux, 8 cores shared with other agents, load ~10-12): live worktree /workspace/Asmodensius-v40, branch v4.0, tip bc6ad6a.
- MSI (Windows): local copy Z:\[Vibe Coded (AI)]\CLAUDECODE\Asmodensius-v40 ; Antigravity workspace Z:\[Vibe Coded (AI)]\ANTIGRAVITY. The box copy is source of truth; sync before editing.
- Run with `nice -n 19`. Loops in /tmp/scp: bundle off.js (built from run_v39.ts @bc6ad6a), sc10.js tuner, jobs_pN.txt lines `<arm> <env> '<M50J>' <block> <TEST> '{}'`, logs pN.log, sentinels *.done, output /tmp/scp/out/<arm>_<block>/tune_*.json. specialists/tools/loop_combo.sh, run3.sh.
- Score: `python3 specialists/tools/score.py 500` -> markdown table (PASS/fail weakest-control d/t, [d vs base]).
- Seed ledger: <1064 dev (500/520/540 blocks, probe 600-615, 2000-2031, 39xx); 1016-1063 R20 retired; 1064-1111 R21 used; 1112-1159 Combo A test (reserved); 1160-1223 AE1 extension (reserved).
- /tmp is volatile: copy results into creatures/001/results/ and commit locally.

## 5. Live agenda (snapshot 13:30 PHT Mon 2 Nov)
1. Combo A freeze + official run (APPROVED "all 4"): (a) keep organism.ts clean (flags default off), (b) commit SC-PORT.md freeze (NOT DONE — currently uncommitted), (c) rebuild /tmp/scp/off.js at the freeze commit, (d) run seeds 1112-1159 both arms (NSEEDS=16, SEEDBASE 1112/1128/1144), AE1 ext only if claimed, (e) write results/sc-port-official/SCORECARD.md.
2. Specialists in parallel on dev seeds: HOT3 st10 (scCH1 scST3 scCL1 on Combo A, 47-job p5 queue on block 500, 6 outputs so far); CQM10 v01 K0.5 full battery; RPT2R proper 10-way; AE2 v01-v10 (RLS/particle) untracked folders.
3. Glitchling Phase 1 (/workspace/glitchling-jam/BLUEPRINT.md): ON HOLD.
4. Uncommitted: v4.0.md (B28 result), b28/b29 result files, AE2/v01-10, HOT3RM/st09-10.

## 6. Combo A exact spec
Env: ORG_V6=1 M50J='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}'. Comparator ORG_V5=11. Pin bc6ad6a.
Primary claims: RPT2R, RPT2RL5, RPT1, UAL, HOT3RM, AE2 (AE1 only with 64-seed pool). Must-hold GWT2. Not claimed: AINF, C10, C16R. Exploratory: C03R, CQM04.
Kill: HOT3RM or RPT2R fails; AE1 pooled d<0.8 if claimed; >1 v5.7b pass lost; foraging -25%.
Dev: block 500 PASS AE2 2.27, GWT2 6.88, HOT3RM 1.31/3.7, RPT1 1.70, RPT2R 3.76, RPT2RL5 2.46, UAL 1.95; AE1 0.76 fail. Block 540 PASS AE1 1.33, AE2 2.07, GWT2 8.92, HOT3RM 1.27, RPT1 1.11, RPT2R 3.65, RPT2RL5 4.15, UAL 1.00/2.8. Block 520 HOT3RM 0.92/2.6 FAIL.
Caveats: HOT3 confidence trained by harness only; integration (a) not passed; CQM10 excluded; hub+scBM came from flag screens not the 10-way method (provisional); AINF under-powered; UAL 540 t 2.8 marginal; HOT3RM borderline = real kill risk. Combo B (+scAIe/scEm/scSR) rejected (RPT1 fails).

## 7. Specialist method (Alex)
1. Side folder specialists/<ITEM>/vNN, up to 10 cited approaches, each flag-gated default off.
2. Screen on dev block (16 seeds), weakest-control d/t.
3. Hybrids (hNN) of winners.
4. Weave/port check: (a) ablating ported module moves >=2 other subsystems; (b) behaviour shifts with internal state; (c) specialist test still passes, no regressions.
5. Port into organism only after a+b+c; new prereg, new seeds.
Rejection: gaming (e.g. CQM10 v03/v05/v10/h11/h12 pass by under-eating).

## 8. Open problems / ideas
- HOT3 self-train: LC coupling trade-off. st05 (scCI0.25 scST3) passes HOT3RM 3 blocks + RPT1 but (a) fails; st08 (scCI0.35) (a) PASS, 520 0.97/2.7. Try st10 calibration head (scCH) / scCL.
- CQM10: over-eating (68 forages/day vs 54, fat 292 vs 271). v01 glucose satiety PASS 1.40/3.9 (K0.5 1.27/3.6); v02 CCK 1.32; v04 GLP-1 1.50.
- AINF: 10 variants fail; needs paired or longer test (new prereg).
- GWT-2: ceiling; harder distractors.
- C16R anticipation 0.80/2.2; RPT2R in arm A fails officially.
- CQM03/CQM04 ill-posed (birth/selection rules in harness).
- De-fluff: replace CQM25 param count, fix straw controls, non-circular iit4.
- LIFE-100 P1 missing: ageing 0/5, decay 0/5, legs w/ own brains 0/5, mating 0/5, respiration 0/5.

## 9. Goal lists
Butlin14 (9 official), CQM25 (17), Frameworks/10 theories (6), LIFE-100 (500 attrs: 202 BUILT, 27 PARTIAL, 106 PLANNED, 165 MISSING; 0 test passes), FREAK-100 (/workspace/freak-100.md, fringe ideas mapped to failing tests), NOVEL-100 (0 done, 2 partial, 98 not started; Foundations 7/38/54).

## 10. Relations
- CQM / SUPER CREATURE: Alex's prior codebase; mechanisms may be reused with citation (sc* flags = SUPER CREATURE ports).
- Glitchling (/workspace/glitchling-jam): separate creature-game; 100 areas x5 attrs, 76 reuse CQM; SIMULATED psychic mechanics are fiction, never science claims. On hold.
- Marketing framing: describe as "indicator-property benchmark for an artificial organism", never "conscious AI".

## 11. DO / DO NOT
DO: read SC-PORT.md + SCORECARD.md first; nice 19; check seed ledger; commit locally; report fails; cite sources; keep flags default off.
DO NOT: push; run 1112+ before freeze commit; tune after test; edit harness to pass; claim consciousness; kill other agents' /tmp/scp jobs; count R variants as official; copy other A-Life code.

## 12. File index (summary; full quotes in appendices)
/workspace/Asmodensius-v40/README.md
/workspace/Asmodensius-v40/creatures/001/{LIFE-100,NOVEL-100,DELARP-PLAN,REARCHITECT,DISCOVERIES,CORE-ARCHITECTURE,STATUS-R20}.md
/workspace/Asmodensius-v40/creatures/001/preregistrations/{OFFICIAL-R21,SC-PORT,v4.0}.md
/workspace/Asmodensius-v40/creatures/001/results/official-r21/SCORECARD.md
/workspace/Asmodensius-v40/creatures/001/results/sc-port/{SC-PORT,scores_500,scores_540}.md
/workspace/Asmodensius-v40/creatures/001/specialists/{QUEUE.md,status.json,tools/score.py,HOT3RM,CQM10,RPT2R,AE2,AINF,GWT2,C03R,CQM04}
/workspace/freak-100.md
/workspace/glitchling-jam/BLUEPRINT.md
/tmp/scp/ (off.js, sc10.js, jobs_p*.txt, out/)

---
# PART II — DEEP DETAIL

## 13. Freeze status: honest statement (read before anything else)
`preregistrations/SC-PORT.md` in the working tree contains the header "Status: FROZEN — approved by Alex ("all 4") 2026-11-01 PT … NO TEST SEED HAD BEEN RUN AT FREEZE". That text is NOT committed. `git diff` shows it replacing the committed DRAFT header (commit 521b985 "SC-PORT Combo A prereg DRAFT (awaiting Alex approval; no test seeds run)"). The prereg itself says "The freeze commit is the commit that adds this text." Therefore, as of Mon 2 Nov 2026 13:30 PHT (= Sun 1 Nov 21:30 PST, box clock):
- Alex HAS approved Combo A ("all 4").
- The freeze commit has NOT been made. Formally the prereg is not frozen.
- No seed in 1112–1223 has been run (no jobs file references them; /tmp/scp/out has only dev blocks such as `*_500`, `*_560`).
- The running queue `/tmp/scp/jobs_p5.txt` (47 lines) is HOT3 st10 on dev block 500.

To freeze correctly (on the box, in `/workspace/Asmodensius-v40`):
```bash
cd /workspace/Asmodensius-v40
git status -s                       # confirm only intended files
git diff creatures/001/preregistrations/SC-PORT.md   # re-read the FROZEN text
# make sure organism.ts at HEAD has every specialist flag default off (it does at bc6ad6a)
git add creatures/001/preregistrations/SC-PORT.md
git commit -m "SC-PORT Combo A prereg FROZEN (Alex approved 'all 4'); no test seeds run"
git rev-parse HEAD                  # this hash is the freeze commit; record it in the run log, NOT by editing SC-PORT.md afterwards
```
Commit the other dirty files (v4.0.md B28 result, b28/b29 files, AE2/v01-10, HOT3RM/st09-10) in a SEPARATE commit, before or after, so the freeze commit diff is only the prereg. Never push.

## 14. Exact commands
### 14.1 Build the bundle
The runner bundle is an esbuild/bun bundle of `creatures/001/organism/run_v39.ts`. Previous bundles: `/tmp/scp/sc2.js`, `sc3.js`, `sc10.js`, `off.js` (off.js = built at bc6ad6a for the official run). Example rebuild at the freeze commit:
```bash
cd /workspace/Asmodensius-v40/creatures/001
npx esbuild organism/run_v39.ts --bundle --platform=node --outfile=/tmp/scp/off.js
sha256sum /tmp/scp/off.js > /tmp/scp/off.js.sha256
```
(Check the exact build command used before in shell history / CHANGELOG if it differs; the bundle must come from the freeze commit.)

### 14.2 Single job (run3.sh)
```bash
# run3.sh ARM ENV M50J BLOCK TEST [V40TUNE]
A=$1; E=$2; J=$3; B=$4; T=$5; V=${6:-{\}}; O=/tmp/scp/out/${A}_$B; mkdir -p $O
[ -s $O/tune_$T.json ] && exit 0
env $E M50J="$J" V40TUNE="$V" ORG_MIND=v40 NSEEDS=${NS:-16} SEEDBASE=$B V39OUT=$O nice -n 19 node ${BUNDLE:-/tmp/scp/sc2.js} tune $T >>$O/log 2>&1
```
Example dev screen of Combo A on HOT3RM, block 540:
```bash
BUNDLE=/tmp/scp/off.js /workspace/Asmodensius-v40/creatures/001/specialists/tools/run3.sh comboA ORG_V6=1 '{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}' 540 HOT3RM '{}'
```

### 14.3 Queue (loop_combo.sh pattern)
```bash
cd /tmp/scp
C1='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}'
for B in 1112 1128 1144; do for T in HOT3RM RPT2R RPT2RL5 RPT1 UAL AE2 AE1 GWT2 AINF C10 C16R; do
  printf "offA ORG_V6=1 '%s' %s %s '{}'\noffB ORG_V5=11 '{}' %s %s '{}'\n" "$C1" $B $T $B $T
done; done > jobs_official.txt
# plus the R21 retention battery for every other test v5.7b passed (see OFFICIAL-R21.md list)
xargs -P 2 -L 1 bash -c 'BUNDLE=/tmp/scp/off.js /workspace/Asmodensius-v40/creatures/001/specialists/tools/run3.sh "$0" "$1" "$2" "$3" "$4" "$5"' < jobs_official.txt; touch official.done
```
Use -P 2 (at most 3) — the box has 8 cores and other agents (bun test, sc10.js tuners, a web server) are already using them; load average was 11.85 at snapshot. Only run this after the freeze commit (§13). AE1 extension blocks (SEEDBASE 1160, 1176, 1192, 1208) only if AE1 is claimed.

### 14.4 Score
```bash
python3 /workspace/Asmodensius-v40/creatures/001/specialists/tools/score.py 540 > /tmp/scp/scores_540.md
```
score.py reads `/tmp/scp/out/*_<blk>/tune_*.json`; for each arm/test it computes Cohen d (pooled-SD) and Welch t of the full arm vs each control, prints PASS only if all controls clear d≥0.8 and t≥2.75, shows the weakest control, and `[+d]` vs the `base` arm. For the official run, pool the three blocks (n=48) — write a small pooled scorer or use `scoring/gen.py` from R21 (results/official-r21/scoring/), which produced SCORECARD.md.

### 14.5 Persist
```bash
mkdir -p creatures/001/results/sc-port-official/raw && cp -r /tmp/scp/out/off*_11* creatures/001/results/sc-port-official/raw/
git add creatures/001/results/sc-port-official && git commit -m "SC-PORT official raw + scorecard"   # local only
```

## 15. Seed ledger (authoritative)
| Range | Status | Used by |
|---|---|---|
| 500–515, 520–535, 540–555, 560–575 | dev | SC-PORT screens, specialists |
| 600–615 | dev | integration probe (a/b/c) |
| 1000–1015 | old test | NOVEL-100 prereg definition (legacy) |
| 1016–1063 | retired | Round 20 |
| 1064–1111 | used | OFFICIAL-R21 |
| 1112–1159 | RESERVED | Combo A official (blocks 1112/1128/1144) |
| 1160–1223 | RESERVED | AE1 pooled extension |
| 2000–2031 | dev | LIFE-100 stage method |
| 3061–3093, 3285–3381, 3945, 3961 | dev/heldout | older B-rounds (b20–b29) |
Next free test range after Combo A: 1224+. Every new prereg claims a fresh range and records the ledger check.

## 16. Fluff audit with citations (where each criticism comes from)
- CQM25 "scale" counts parameters — DELARP-PLAN.md P10: "GPU 100M net (browser only, app.tsx) … Not in the node organism, so no test can see it. CQM25 'scale' counts parameters." Its PASS has no d/t in SCORECARD. Treat as hardcoded.
- CQM24 PASS with no d/t in SCORECARD — not a statistical result.
- CQM03 — SCORECARD: original PASS d 6.23, but CQM03R FAIL A d −2.31 / D −2.50. DELARP P7: "births are generational and do not depend on food". QUEUE: "ill-posed for brain; birth rule in harness". The original's control is a straw man.
- CQM05 — d 39.05 / t 191.3: no real biological contrast produces d≈39; the control is degenerate (straw).
- CQM04 — DELARP P7: "reach costs ATP, so selection favours low reach … no organism fix possible".
- iit4 / CQM21 — d 2.46 is counted twice (framework and CQM21). Circular: the integration proxy is computed over the very cross-module coupling the build adds, compared to a lesion of that coupling.
- Ceiling originals (DELARP §4 list "clean-stimulus ceiling originals GWT-3, CQM08, CQM18, projective, K1a–e"; P4 "ctm … double-counted with GWT-3"). d values 9–26 reflect one-hot stimuli.
- thaler9 — DELARP P3: project-specific Thaler "Creativity Machine" mechanic that conflicts with EFE; inverted-U form.
- AST-1 — DELARP P6: harness toy (Kalman+LQG), "measures nothing about 001" in its old form; current AST-1 PASS 1.18 stands but treat with care.
- activeInference — DELARP P5: four stacked EFE versions; test under-powered (AINF README).
- Butlin-as-design-driver — DELARP P12: mechanisms per indicator tuned in isolation.
- LIFE-100 — "BUILT means the mechanism exists, not that it has passed a preregistered test"; 0 passes.
Net: of 32 claimed official passes across lists (9+6+17), duplicates (CQM13=HOT-2, CQM19=RPT-1, CQM21=iit4, CQM20=GWT-3) and fluff cut the defensible distinct set to about 11–12.

## 17. Glitchling hold
`/workspace/glitchling-jam/BLUEPRINT.md` (written Mon 2 Nov 05:30 PHT): 100 areas × 5 attributes, 76 areas map to existing CQM code, 106/500 attributes name existing variables; Phase 1 = TS + three.js on CPU with `limbs.ts` (odd leg counts, 32-neuron Izhikevich ganglia ported by copy from `cqm-copy/src/math/izhikevich.ts`, per-leg `rev` backwards flaw). Status: ON HOLD by Alex. Do not start Phase 1, do not mix its "SIMULATED" psychic/remote-viewing mechanics with Creature #1 science claims. Its limb-brain design is a candidate input for LIFE-100 #27 "Legs with their own brains" later, through the specialist method.

## 18. MSI / Antigravity notes
- Local copy: `Z:\[Vibe Coded (AI)]\CLAUDECODE\Asmodensius-v40` (this file at `...\creatures\001\HANDOFF-GEMINI-ARGON4.md`).
- Antigravity workspace: `Z:\[Vibe Coded (AI)]\ANTIGRAVITY\HANDOFF-GEMINI-ARGON4.md`.
- The MSI copy may lag the box. Runs, seeds and /tmp/scp exist only on the box. If you work on the MSI, do code reading/drafting there and run official jobs on the box (or replicate the node bundle exactly, with the same commit hash, and record that).
- Windows paths contain brackets and spaces: quote them in PowerShell (`-LiteralPath`).

---
# APPENDICES — verbatim source files (numbers quoted exactly)

### Verbatim: `results/official-r21/SCORECARD.md`

````markdown
# OFFICIAL Round 21 scorecard (Creature #1)

Generated 2026-11-01 16:18 PT by scoring/gen.py. Prereg: creatures/001/preregistrations/OFFICIAL-R21.md (commit f7ff08d, frozen before any test run). Test seeds 1064-1111 (n=48).

**Run status:** test files done: arm A 61/63, arm D 61/63. Items marked PENDING have not finished; totals below count only finished PASS items and are NOT final while anything is pending.

Pass = d>=0.8 AND Welch t>=2.75 vs every control (+ non-ceiling rule). PARTIAL = passes some controls but not all, or the original fails while a disclosed R variant passes. Official totals count originals only.

Previous official (R20, v3.9): Butlin 9/14, frameworks 7/10, CQM 17/25.

## Totals

| List | A v5.7b official | A with R variants | D v5.7d official | D with R variants |
|---|---|---|---|---|
| Butlin | 9/14 (partial 3, pending 0) | 12/14 (partial 0, pending 0) | 9/14 (partial 3, pending 0) | 12/14 (partial 0, pending 0) |
| Frameworks | 6/10 (partial 2, pending 0) | 8/10 (partial 0, pending 0) | 5/10 (partial 2, pending 0) | 7/10 (partial 0, pending 0) |
| CQM | 17/25 (partial 3, pending 0) | 20/25 (partial 0, pending 0) | 17/25 (partial 3, pending 0) | 20/25 (partial 0, pending 0) |

## Butlin 14

| Item | A v5.7b | A d/t | D v5.7d | D d/t | R variants (A / D) |
|---|---|---|---|---|---|
| RPT-1 | PASS | d 1.04 t 5.10 | PASS | d 1.13 t 5.55 |  |
| RPT-2 | PARTIAL | d -0.28 t -1.36 | PARTIAL | d -0.17 t -0.81 | RPT2R: FAIL / PASS, RPT2RL5: PASS / PASS |
| GWT-1 | PASS | d 2.89 t 14.17 | PASS | d 3.19 t 15.64 |  |
| GWT-2 | FAIL | d 8.43 t 41.28 | FAIL | d 8.43 t 41.29 |  |
| GWT-3 | PARTIAL | d 19.44 t 95.25 | PARTIAL | d 26.15 t 128.10 | GWT-3R: PASS / PASS |
| GWT-4 | FAIL | d 14.51 t 71.10 | FAIL | d 20.04 t 98.16 |  |
| HOT-1 | PASS | d 2.08 t 10.18 | PASS | d 2.13 t 10.45 |  |
| HOT-2 | PASS | d 2.06 t 10.09 | PASS | d 2.10 t 10.30 |  |
| HOT-3 | PARTIAL | d 0.01 t 0.07; d 0.02 t 0.11 | PARTIAL | d -0.01 t -0.07; d 0.10 t 0.47 | HOT3RM: PARTIAL / PARTIAL, HOT3RM-P: PASS / PASS |
| HOT-4 | PASS | d 6.31 t 30.89 | PASS | d 6.50 t 31.84 |  |
| AST-1 | PASS | d 1.18 t 5.77 | PASS | d 0.97 t 4.74 |  |
| PP-1 | PASS | d 1.12 t 5.49 | PASS | d 1.06 t 5.18 |  |
| AE-1 | PASS | d 0.98 t 4.80 | PASS | d 1.19 t 5.84 | AE1R: FAIL / FAIL |
| AE-2 | PASS | d 2.48 t 12.14 | PASS | d 2.62 t 12.85 |  |

## Frameworks 10

| Item | A v5.7b | A d/t | D v5.7d | D d/t | R variants (A / D) |
|---|---|---|---|---|---|
| thaler9 | PASS | d 1.29 t 6.31 | PASS | d 1.74 t 8.53 |  |
| iit4 | PASS | d 2.46 t 12.03 | PASS | d 2.50 t 12.23 |  |
| activeInference | FAIL | d 0.00 t 0.01 | FAIL | d 0.01 t 0.05 |  |
| attentionSchema | PASS | d 7.85 t 38.46 | PASS | d 8.86 t 43.42 |  |
| fieldIntegration | PASS | d 1.20 t 5.87 | FAIL | d 0.76 t 3.72 |  |
| ual | PASS | d 1.06 t 5.19 | PASS | d 1.36 t 6.66 |  |
| sensorimotor | PASS | d 3.31 t 16.19 | PASS | d 3.64 t 17.85 |  |
| projective | PARTIAL | d 9.62 t 47.15 | PARTIAL | d 10.72 t 52.51 | PROJR: PASS / PASS |
| ctm | PARTIAL | d 17.04 t 83.47 | PARTIAL | d 21.35 t 104.61 | ctm-R: PASS / PASS |
| butlin14 | FAIL |  | FAIL |  |  |

## CQM 25

| Item | A v5.7b | A d/t | D v5.7d | D d/t | R variants (A / D) |
|---|---|---|---|---|---|
| CQM01 | PARTIAL | d 0.44 t 2.17 | PARTIAL | d 0.53 t 2.58 | CQM01R: PASS / PASS |
| CQM02 | PASS | d 14.47 t 70.89 | PASS | d 12.61 t 61.79 |  |
| CQM03 | PASS | d 6.23 t 30.54 | PASS | d 6.57 t 32.20 | CQM03R: FAIL / FAIL |
| CQM04 | FAIL | d 0.04 t 0.20 | FAIL | d 0.12 t 0.59 |  |
| CQM05 | PASS | d 39.05 t 191.32 | PASS | d 38.29 t 187.58 |  |
| CQM06 | FAIL | d 0.30 t 1.48 | FAIL | d 0.56 t 2.76 |  |
| CQM07 | PASS | d 5.81 t 28.48 | PASS | d 6.48 t 31.74 |  |
| CQM08 | PARTIAL | d 0.59 t 2.91 | PARTIAL | d 0.59 t 2.90 | CQM08R: PASS / PASS |
| CQM09 | PASS | d 6.09 t 29.81 | PASS | d 5.23 t 25.63 |  |
| CQM10 | FAIL | d -0.82 t -4.02 | FAIL | d -0.81 t -3.95 |  |
| CQM11 | PASS | d 7.04 t 34.48 | PASS | d 7.29 t 35.72 |  |
| CQM12 | PASS | d 1.03 t 5.07 | PASS | d 1.33 t 6.52 |  |
| CQM13 (=HOT-2) | PASS | d 2.06 t 10.09 | PASS | d 2.10 t 10.30 |  |
| CQM14 | PASS | d 4.73 t 23.18 | PASS | d 3.74 t 18.33 |  |
| CQM15 | PASS | d 1.68 t 8.22 | PASS | d 1.58 t 7.72 |  |
| CQM16 | PASS | d 7.25 t 35.52 | PASS | d 7.88 t 38.63 | C16R: FAIL / FAIL |
| CQM17 | PASS | d 1.49 t 7.30 | PASS | d 1.51 t 7.38 |  |
| CQM18 | FAIL | d 0.00 t 0.00 | FAIL | d 0.00 t 0.00 | CQM18R: FAIL / FAIL |
| CQM19 (=RPT-1) | PASS | d 1.04 t 5.10 | PASS | d 1.13 t 5.55 |  |
| CQM20 (=GWT-3) | PARTIAL | d 19.44 t 95.25 | PARTIAL | d 26.15 t 128.10 |  |
| CQM21 (=iit4) | PASS | d 2.46 t 12.03 | PASS | d 2.50 t 12.23 |  |
| CQM22 | PASS | d 2.50 t 12.25 | PASS | d 2.44 t 11.93 |  |
| CQM23 | FAIL |  | FAIL |  |  |
| CQM24 | PASS |  | PASS |  |  |
| CQM25 | PASS |  | PASS |  |  |

## Disclosed R variants (detail)

- A RPT2R: FAIL vs cross-module CTX synapses lesioned: d -0.11 t -0.53
- A RPT2RL5: PASS vs cross-module CTX synapses lesioned: d 1.14 t 5.6
- A HOT3RM: PARTIAL vs random opt-out (matched rate): d 0.84 t 4.09; vs confidence shuffled: d 0.74 t 3.6
- A HOT3RM-P: PASS vs confidence shuffled (paired): dz 1.15 t 7.97
- A AE1R: FAIL vs RPE learning lesioned: d 0.31 t 1.52
- A PROJR: PASS vs efference copy lesioned: d 4.89 t 23.93
- A C16R: FAIL vs anticipation lesioned (reactive only): d 0.74 t 3.6
- A CQM18R: FAIL(ceiling) vs plasticity frozen after lesion: d 7.15 t 35.02
- A GWT-3R: PASS d 10.03 t 49.15
- A ctm-R: PASS d 12.80 t 62.73
- A CQM08R: PASS d 7.98 t 39.07
- A CQM03R: FAIL d -2.31 t -11.32
- A CQM01R: PASS d 1.09 t 5.34
- A K1aR: FAIL d 0.13 t 0.66
- A K1cR: FAIL d 0.24 t 1.18
- D RPT2R: PASS vs cross-module CTX synapses lesioned: d 3.36 t 16.44; vs shuffled pairing (vshuf): d 2.74 t 13.44
- D RPT2RL5: PASS vs cross-module CTX synapses lesioned: d 3.43 t 16.81
- D HOT3RM: PARTIAL vs random opt-out (matched rate): d 0.95 t 4.67; vs confidence shuffled: d 0.75 t 3.68
- D HOT3RM-P: PASS vs confidence shuffled (paired): dz 1.09 t 7.55
- D AE1R: FAIL vs RPE learning lesioned: d 0.56 t 2.76
- D PROJR: PASS vs efference copy lesioned: d 4.68 t 22.95
- D C16R: FAIL vs anticipation lesioned (reactive only): d 0.78 t 3.84
- D CQM18R: FAIL(ceiling) vs plasticity frozen after lesion: d 6.33 t 31.03
- D GWT-3R: PASS d 8.60 t 42.15
- D ctm-R: PASS d 10.93 t 53.54
- D CQM08R: PASS d 6.91 t 33.87
- D CQM03R: FAIL d -2.50 t -12.27
- D CQM01R: PASS d 1.47 t 7.19
- D K1aR: FAIL d -0.38 t -1.87
- D K1cR: FAIL d -0.12 t -0.59

## NOVEL-100

Unchanged: 0 done, 2 partial. No R21 test is direct evidence for a NOVEL-100 item.

## Deviations and disclosures
- The prereg header says "frozen ~09:58 PT"; the freeze commit f7ff08d was actually made at about 09:54 PT, still before any test-seed job started (first launch 09:54:20 PT).
- The first launch was stopped after ~1.5 min with no output written, and the queue was reordered (long EVO/L1/L3 moved last). Nothing was seen, nothing tuned. Relaunch 09:55:44 PT (commit 3ae2fea).
- v5.7d was not ported into the v4.0 tree (conflicts with v6.2/V6-S1 at ORG_V5=15 and the shared `hubH` field); it runs from wild-arch 4bc5c03.
- HOT3RM is scored against both of its controls (random opt-out and confidence shuffled), which is stricter than the prereg table (that lists only confidence shuffled). CQM18R has only the "plasticity frozen after lesion" control in code; the afferent-remap control listed in the prereg does not exist in this build.
- Viability (steady/starve/refeed) is reported but does not count in any list.

## Raw scorer output

See raw/A, raw/D, raw/Dshuf (per-test JSON) and scoring/ (A_orig.txt, D_orig.txt, *_rvar.json).
````

### Verbatim: `preregistrations/SC-PORT.md`

````markdown
# Preregistration: SC-PORT Combo A (Creature #1), v4.0 branch
**Status: FROZEN — approved by Alex ("all 4") 2026-11-01 PT. Frozen 2026-11-01 ~21:30 PST (America/Los_Angeles). NO TEST SEED HAD BEEN RUN AT FREEZE.**
Code pin: commit `bc6ad6a` (v4.0; organism.ts with all specialist paths flag-gated off). Bundle `/tmp/scp/off.js` built from organism/run_v39.ts at `bc6ad6a`. The freeze commit is the commit that adds this text. Nothing below may change after it.

## 1. Candidate (frozen exactly)
- Env: `ORG_V6=1` and `M50J='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}'`.
- Every other M50 SC/specialist flag stays at its default (off/0), including scAIe, scEm, scSR, scST, scSTs, scCI, scCH, scSMC, ae2, ae2K, fast weights and all CQM10 gates.
- Contents: v5.7b + V6 binding hub (DA-RPE consolidated; no learned precision v6P, no antithetic appetite integral v6Ak) + belief-precision confidence (scAIm 0.5, HOT-3) + Kalman body model (scBM 1, AE-2).
- Comparator arm: v5.7b (`ORG_V5=11`), same harness, same seeds.
- Code pin: `bc6ad6a` (tip at drafting was `c6500c7`; bc6ad6a adds only flag-gated specialist code, default off). The bundle is built from organism/run_v39.ts at the freeze commit.
- Bit-identical when off: every new path is flag-gated, default off. Dev check: Combo A rerun on the new code gave identical HOT3RM (1.31/3.7) and C10 (-0.57/-1.6) on block 500. Pre-freeze check at `bc6ad6a` (dev block 540, seeds 540-541, HOT3RM): v5.7b and Combo A per-seed values identical to the recorded dev output.

## 2. Pass rule
Grade A per test: Cohen d >= 0.8 **and** Welch t >= 2.75 vs **every** control of that test. If a test's full arm sits at its ceiling (e.g. a rate = 1.0 with zero variance), a separate non-ceiling check must also pass: the control arm must not be at the same ceiling, and the result must not depend on the zero-variance arm alone. Otherwise the test is reported as "ceiling, not graded".
Kill rules (round fails as a whole): HOT3RM or RPT2R fails; AE1 pooled d < 0.8 (only if AE1 is claimed); more than one test passed by v5.7b is lost; foraging falls by more than 25% vs v5.7b.

## 3. Seeds
- **Test seeds 1112–1159 (n = 48)**, both arms, every test (NSEEDS=16 x 3 blocks: SEEDBASE 1112, 1128, 1144; pooled n=48 per arm). AE1 extension blocks SEEDBASE 1160, 1176, 1192, 1208.
- AE1 pooled extension (only if AE1 is claimed): 1160–1223 (64 seeds).
- Ledger check (2026-11-02): dev work used seeds < 1064 only (SC-PORT blocks 500/520/540, probe 600–615). OFFICIAL-R21 used 1064–1111 (raw goes up to 1111). Round 20 used 1016–1063 (retired). No result file or prereg uses any seed in 1112–1223. No collision.

## 4. Claims
**Primary (Combo A moved these on dev; each must reach grade A):** RPT2R, RPT2RL5, RPT1, UAL, HOT3RM, AE2. **AE1 is claimed only with the pooled 64-seed extension.** (Dev: AE1 failed on 500 at 0.76/2.1, passed on 540 at 1.33/3.8.)
**Must-hold (not a main claim):** GWT2 must keep grade A. **Retention (must not be lost vs v5.7b):** every other test v5.7b passes in R21.
**Exploratory / not claimed:** C03R, CQM04 (decided by harness birth/selection rules), and any extra diagnostics. **AINF, C10, C16R are NOT claimed**: they still fail on dev (540: AINF -0.44, C10 -0.49, C16R 0.80/2.2). They are run and reported only.
Controls: each test's own (HOT3RM: random opt-out at matched rate + shuffled confidence; RPT2R/RPT2RL5: cross-module CTX lesion; AE1: RPE lesion; AE2: forward-model lesion; others as in OFFICIAL-R21). Viability: 3 days, deaths and foraging.

## 5. Caveats disclosed in advance
- HOT-3: the confidence monitor is still trained only by the test harness. Integration check (a) is **NOT passed** for self-training (st01–st08: no arm passes a+b+c), so no self-train flag is in Combo A. HOT3RM was borderline on dev block 520 (0.92/2.6 fail).
- CQM10 (v01 glucose satiety, K0.5) is **NOT included**. Its battery and integration checks are not finished.
- Method note (provisional): Combo A's hub (v6hub, for RPT2R) and body model (scBM, for AE2) came from flag screens, **not** from Alex's full 10-way side-specialist method. Results are labelled provisional on method.
- AINF is under-powered as an unpaired test.

## 6. Rules
- No tuning, flag change, re-seeding or harness change after any test result is seen. Any later change becomes a new prereg with new seeds.
- All results get reported, pass or fail.
- No push until grade A on the primary claims **and** Alex says OK. Local commits only.

## Dev evidence
results/sc-port/SC-PORT.md; results/sc-port/scores_500.md, scores_540.md (520 = HOT3RM only).
````

### Verbatim: `results/sc-port/SC-PORT.md`

````markdown
# SC-PORT dev report (updated 2026-11-01 evening US Pacific)
Dev seeds only (blocks 500/520/540 x16 seeds; integration probe seeds 600-615). No test seeds, no push. Grade A = d>=0.8 and Welch t>=2.75 vs every control. Tables: scores_500/520/540.md (auto-scored from raw/).

## Methodology caveat (honesty)
Combo A's parts (v6hub for RPT2R, scBM for AE2) were adopted from flag screens, NOT via Alex's full 10-way side-specialist method; they are provisional. HOT3 and CQM10 below follow the method (side-specialist folders specialists/<ITEM>/vNN, up to 10 approaches, hybrids, port only after standalone PASS + integration a/b/c). Implementation note: each variant's code is flag-gated (default off) in organism/organism.ts; the specialist folders hold spec, flags and runner.

## Combo verdict
- **Combo A = v6hub (ORG_V6=1, v6P 0, v6Ak 0) + scAIm 0.5 + scBM 1: leading candidate.**
  Block 500: PASS AE2 2.27/6.4, GWT2 6.88/19.5, HOT3RM 1.31/3.7, RPT1 1.70/4.8, RPT2R 3.76/10.6, RPT2RL5 2.46/7.0, UAL 1.95/5.5; fail AE1 0.76/2.1 (near), AINF -0.09, C10 -0.57, C16R 0.55.
  Block 540: PASS AE1 1.33/3.8, AE2 2.07/5.9, GWT2 8.92/25.2, HOT3RM 1.27/3.6, RPT1 1.11/3.1, RPT2R 3.65/10.3, RPT2RL5 4.15/11.7, UAL 1.00/2.8; fail AINF -0.44, C10 -0.49, C16R 0.80/2.2.
  Block 520 (HOT3RM only): fail 0.92/2.6 (borderline).
- **Combo B (Combo A + scAIe/scEm/scSR): rejected.** RPT1 fails on both blocks (500: 0.12/0.3; 540: 0.85/2.4) and AE1 drops (500 0.47, 540 0.27 fail); no test gained over A.
- Fast weights excluded (RPT2R/UAL/AE2 regressions). scBM: AE2 +4 d, no side effects. Off-path bit-identical check: comboA rerun with new code gives identical HOT3RM (1.31/3.7) and C10 (-0.57/-1.6) on 500.

## HOT3 self-training (specialists/HOT3RM, st01-st08)
Problem: the confidence monitor (meta3) was trained only by harness teachConf, so in natural life conf=0.5 and integration (a) failed. Change: Mind.selfConf (flag scST, default off): at every forage, monitor confidence is treated as a prediction of that choice's success and updated on the creature's own outcome (got food or not), DA-gated lr. Optional scSTs puts it in separate weights. scCI couples low confidence to the LC (predErr) and hunger to belief-precision weight.
| arm | flags (on Combo A) | HOT3RM 500 | 520 | 540 | RPT1 500 | integ (a) |
|---|---|---|---|---|---|---|
| comboA | - | PASS 1.31/3.7 | fail 0.92/2.6 | PASS 1.27/3.6 | PASS 1.70/4.8 | FAIL (conf inert) |
| st01 stA | scCI1 scST1 | PASS 1.10/3.1 | fail 0.70/2.0 | fail 0.84/2.4 | fail 0.18/0.5 | PASS (cortisol, foraged) |
| st02 stB | scCI1 scST3 | fail 0.76/2.1 | PASS 1.57/4.4 | PASS 1.15/3.2 | - | PASS (NE, DA, cortisol) |
| st03 stC | scCI1 scST1 scSTs1 | PASS 1.10/3.1 | - | - | fail 0.18/0.5 | - |
| st04 stD | scCI0.25 scST1 scSTs1 | PASS 1.02/2.9 | - | - | fail 0.77/2.2 | - |
| st05 stE | scCI0.25 scST3 | PASS 1.18/3.4 | PASS 1.76/5.0 | PASS 1.29/3.6 | PASS 1.17/3.3 | FAIL (only foraged moves; NE/DA/cortisol t~2) |
| st06 | scCI0.5 scST3 | PASS 0.99/2.8 | PASS 1.19/3.4 | fail 0.95/2.7 | fail 0.48/1.4 | PASS (DA, foraged) |
| st08 | scCI0.35 scST3 | PASS 1.49/4.2 | fail 0.97/2.7 | PASS 1.25/3.5 | fail 0.87/2.5 | PASS (DA, cortisol, rewards) |
Verdict: no self-train arm passes a+b+c; not ported. st07 (scCI0.5 scST6) a PASS, tests not run.
stA full 500 battery: RPT1 regresses (1.70 -> 0.18); others as Combo A. Trade-off found: strong LC coupling passes (a) but costs HOT3RM/RPT1; weak coupling passes HOT3RM on all 3 blocks + RPT1 but (a) fails. (b) PASS in all (belief-precision weight 0.47 sated vs 0.28 hungry).

## CQM10 (specialists/CQM10, v01-v10 + h11-h13)
What C10 measures: fraction of days 2-4 with glucose in (2, 4.5), ATP>1.5, adenosine<0.9; full vs fixed forage probability 0.12. Diagnosis (diag.ts, 8 seeds): full fails only by hyperglycaemia (glcHi 5.8% vs 2.6%) from over-foraging (68 vs 54 forages/day, fat 292 vs 271). See specialists/CQM10/README.md for the table. Behavioural satiety gates (v01-v06, v10) PASS 1.32-1.50 (full reaches ceiling 1.0); physiological fixes (v07-v09) fail because they help both arms. v01 (glucose-sensing satiety) is the non-gaming winner (eats 57/day, fat steady); v03/v05/h11/h12 pass by under-eating (fat falls to ~233) and are rejected as wrong-reason.
Port status: NOT ported. v01 on Combo A (block 500 battery): C10 PASS 1.40/3.9, HOT3RM/RPT2R/RPT2RL5/UAL/AE2/GWT2 PASS, but RPT1 0.90/2.5 (Combo A 1.70) regresses; integration (a) PASS (NE, ACh, DA, foraging, rewards move), (b) inherent (gate reads blood glucose).

v01 with gain K0.5 (gate from 3.6 mM): C10 PASS 1.27/3.6, RPT1 PASS 1.00/2.8, eats 65.8/day, fat 275: best CQM10 candidate; full battery + integration still to run before any port.
````

### Verbatim: `results/sc-port/scores_500.md`

````markdown
# block 500 (16 seeds each). Cell: PASS/fail, weakest within-test control d/t; [vs base full: d]
| arm | AE1 | AE2 | AINF | C10 | C16R | GWT2 | HOT3RM | RPT1 | RPT2R | RPT2RL5 | UAL |
|---|---|---|---|---|---|---|---|---|---|---|---|
| base | fail 0.23/0.6 | PASS 2.49/7.0 | fail 0.13/0.4 | fail -0.73/-2.1 | fail 0.57/1.6 | PASS 6.41/18.1 | fail 0.75/2.1 | fail 0.86/2.4 | fail 0.28/0.8 | fail 0.70/2.0 | PASS 1.33/3.8 |
| ai | fail 0.52/1.5 [+0.41] | PASS 2.32/6.6 [+0.33] | fail 0.07/0.2 [+0.00] | fail -0.70/-2.0 [+0.12] | fail 0.39/1.1 [-0.07] | PASS 7.38/20.9 [+0.16] | PASS 1.49/4.2 [+0.19] | PASS 1.08/3.0 [-0.03] | fail 0.48/1.4 [-0.25] | fail 0.71/2.0 [-0.17] | PASS 1.49/4.2 [-0.22] |
| ai03 | . | . | fail -0.16/-0.4 [-0.21] | . | . | PASS 6.35/18.0 [+0.03] | PASS 1.71/4.8 [-0.71] | . | fail -0.19/-0.5 [-0.87] | . | . |
| aiC | . | . | fail 0.07/0.2 [+0.00] | . | . | PASS 7.38/20.9 [+0.16] | fail 0.61/1.7 [-0.67] | . | fail 0.48/1.4 [-0.25] | . | . |
| aiM | . | PASS 2.49/7.0 [+0.00] | fail 0.13/0.4 [+0.00] | fail -0.73/-2.1 [+0.00] | fail 0.57/1.6 [+0.00] | PASS 6.41/18.1 [+0.00] | PASS 1.28/3.6 [+0.45] | fail 0.86/2.4 [+0.00] | fail 0.28/0.8 [+0.00] | fail 0.70/2.0 [+0.00] | PASS 1.33/3.8 [+0.00] |
| bm | fail 0.23/0.6 [+0.00] | PASS 2.55/7.2 [+4.24] | fail 0.13/0.4 [+0.00] | fail -0.73/-2.1 [+0.00] | fail 0.57/1.6 [+0.00] | PASS 6.41/18.1 [+0.00] | fail 0.75/2.1 [+0.00] | fail 0.86/2.4 [+0.00] | fail 0.28/0.8 [+0.00] | fail 0.70/2.0 [+0.00] | PASS 1.33/3.8 [+0.00] |
| c10k5 | fail 0.72/2.0 [+0.60] | PASS 2.23/6.3 [+4.51] | fail -0.07/-0.2 [-0.50] | PASS 1.27/3.6 [+0.94] | fail 0.79/2.2 [+1.02] | PASS 9.00/25.4 [+0.17] | PASS 1.23/3.5 [+0.01] | PASS 1.00/2.8 [+0.18] | PASS 4.06/11.5 [+3.43] | PASS 3.53/10.0 [+2.59] | PASS 1.31/3.7 [-0.22] |
| c10v1 | fail 0.87/2.5 [+0.44] | PASS 1.89/5.3 [+3.96] | fail 0.06/0.2 [-0.85] | PASS 1.40/3.9 [+0.96] | fail 0.41/1.2 [+1.31] | PASS 9.74/27.6 [+0.00] | PASS 1.12/3.2 [+0.16] | fail 0.90/2.5 [-0.05] | PASS 3.23/9.1 [+3.27] | PASS 2.41/6.8 [+1.87] | PASS 1.87/5.3 [-0.09] |
| c10v10 | . | . | . | PASS 1.46/4.1 [+0.97] | . | . | . | . | . | . | . |
| c10v11 | . | . | . | PASS 1.50/4.2 [+0.97] | . | . | . | . | . | . | . |
| c10v12 | . | . | . | PASS 1.50/4.2 [+0.97] | . | . | . | . | . | . | . |
| c10v13 | . | . | . | PASS 1.50/4.2 [+0.97] | . | . | . | fail 0.26/0.7 [-0.30] | . | . | . |
| c10v1k5 | . | . | . | PASS 1.27/3.6 [+0.94] | . | . | . | PASS 1.00/2.8 [+0.18] | . | . | . |
| c10v2 | . | . | . | PASS 1.32/3.7 [+0.95] | . | . | . | . | . | . | . |
| c10v3 | . | . | . | PASS 1.50/4.2 [+0.97] | . | . | . | . | . | . | . |
| c10v4 | . | . | . | PASS 1.50/4.2 [+0.97] | . | . | . | PASS 0.98/2.8 [+0.04] | . | . | . |
| c10v5 | . | . | . | PASS 1.50/4.2 [+0.97] | . | . | . | . | . | . | . |
| c10v6 | . | . | . | PASS 1.35/3.8 [+0.95] | . | . | . | . | . | . | . |
| c10v7 | . | . | . | fail -0.75/-2.1 [+0.04] | . | . | . | . | . | . | . |
| c10v8 | . | . | . | fail -0.58/-1.6 [+0.48] | . | . | . | . | . | . | . |
| c10v9 | . | . | . | fail -0.57/-1.6 [+0.74] | . | . | . | . | . | . | . |
| cArp8 | fail 0.25/0.7 [+0.01] | PASS 3.12/8.8 [+4.84] | . | . | . | PASS 6.85/19.4 [+0.15] | PASS 1.27/3.6 [-0.01] | fail 0.23/0.6 [-0.38] | PASS 6.68/18.9 [+6.51] | PASS 4.61/13.0 [+4.75] | PASS 1.40/4.0 [-0.78] |
| chk8 | . | . | . | . | . | . | PASS 1.31/3.7 [+0.11] | . | . | . | . |
| comboA | fail 0.76/2.1 [+0.47] | PASS 2.27/6.4 [+4.82] | fail -0.09/-0.2 [-0.12] | fail -0.57/-1.6 [+0.18] | fail 0.55/1.6 [+0.18] | PASS 6.88/19.5 [+0.56] | PASS 1.31/3.7 [+0.11] | PASS 1.70/4.8 [+0.15] | PASS 3.76/10.6 [+3.56] | PASS 2.46/7.0 [+2.06] | PASS 1.95/5.5 [-0.22] |
| comboAchk | . | . | . | fail -0.57/-1.6 [+0.18] | . | . | PASS 1.31/3.7 [+0.11] | . | . | . | . |
| comboB | fail 0.47/1.3 [+0.38] | PASS 2.83/8.0 [+3.91] | fail -0.06/-0.2 [-0.09] | fail -0.76/-2.2 [+0.06] | fail 0.60/1.7 [+0.02] | PASS 7.91/22.4 [+0.22] | PASS 1.02/2.9 [-0.14] | fail 0.12/0.3 [-0.66] | PASS 4.05/11.5 [+3.40] | PASS 3.09/8.7 [+2.51] | PASS 1.27/3.6 [-0.41] |
| fw | fail 0.88/2.5 [+0.62] | PASS 2.44/6.9 [-0.47] | fail -0.07/-0.2 [-0.20] | fail -0.62/-1.8 [+0.11] | fail 0.89/2.5 [+0.18] | PASS 7.67/21.7 [+0.18] | fail 0.89/2.5 [-0.29] | PASS 1.35/3.8 [+0.17] | fail -0.10/-0.3 [-0.34] | fail 0.80/2.3 [+0.17] | PASS 1.38/3.9 [-0.53] |
| fw03 | . | . | fail 0.12/0.3 [-0.07] | . | . | PASS 6.90/19.5 [+0.26] | fail 0.58/1.6 [-0.45] | . | fail -0.03/-0.1 [-0.30] | . | . |
| fw3 | . | . | fail 0.07/0.2 [-0.47] | . | . | PASS 8.30/23.5 [+0.44] | fail 0.77/2.2 [-1.21] | . | fail -0.49/-1.4 [-0.79] | . | . |
| fwF | . | . | fail 0.01/0.0 [-0.06] | . | . | PASS 9.35/26.4 [+0.54] | fail 0.77/2.2 [-0.59] | . | fail -0.45/-1.3 [-0.72] | . | . |
| fwL | . | . | fail 0.10/0.3 [-0.03] | . | . | PASS 8.23/23.3 [+0.71] | fail 0.65/1.8 [-0.42] | . | fail -0.27/-0.8 [-0.55] | . | . |
| gw | fail 0.23/0.6 [+0.00] | PASS 2.49/7.0 [+0.00] | fail 0.13/0.4 [+0.00] | fail -0.73/-2.1 [+0.00] | fail 0.57/1.6 [+0.00] | PASS 7.32/20.7 [+0.98] | fail 0.70/2.0 [+0.55] | fail 0.81/2.3 [-0.54] | fail 0.28/0.8 [+0.00] | fail 0.70/2.0 [+0.00] | PASS 1.33/3.8 [+0.00] |
| gwK1 | . | . | fail -0.04/-0.1 [-0.07] | . | . | PASS 7.31/20.7 [+0.89] | fail 0.36/1.0 [-0.56] | . | fail 0.11/0.3 [-0.35] | . | . |
| gwK16 | . | . | fail 0.05/0.1 [-0.03] | . | . | PASS 7.16/20.2 [+0.82] | fail 0.91/2.6 [+0.39] | . | fail 0.23/0.6 [-0.56] | . | . |
| gwT01 | . | . | fail 0.13/0.4 [+0.00] | . | . | PASS 7.52/21.3 [+1.24] | fail 0.39/1.1 [-0.27] | . | fail 0.28/0.8 [+0.00] | . | . |
| gwT1 | fail 0.23/0.6 [+0.00] | PASS 2.49/7.0 [+0.00] | fail 0.13/0.4 [+0.00] | fail -0.73/-2.1 [+0.00] | fail 0.57/1.6 [+0.00] | PASS 2.74/7.7 [-3.29] | PASS 1.94/5.5 [-2.09] | PASS 1.05/3.0 [-0.02] | fail 0.28/0.8 [+0.00] | fail 0.70/2.0 [+0.00] | PASS 1.33/3.8 [+0.00] |
| h3port | fail 0.23/0.6 [+0.00] | PASS 2.49/7.0 [+0.00] | fail 0.13/0.4 [+0.00] | fail -0.73/-2.1 [+0.00] | fail 0.57/1.6 [+0.00] | PASS 6.41/18.1 [+0.00] | PASS 1.05/3.0 [-0.25] | fail 0.86/2.4 [+0.00] | fail 0.28/0.8 [+0.00] | fail 0.70/2.0 [+0.00] | PASS 1.33/3.8 [+0.00] |
| st06 | . | . | . | . | . | . | PASS 0.99/2.8 [-0.05] | fail 0.48/1.4 [-0.38] | . | . | . |
| st08 | . | . | . | . | . | . | PASS 1.49/4.2 [+0.06] | fail 0.87/2.5 [+0.23] | . | . | . |
| st09 | . | . | . | . | . | . | PASS 1.08/3.1 [+0.20] | fail 0.77/2.2 [-0.16] | . | . | . |
| st09b | . | . | . | . | . | . | PASS 1.16/3.3 [+0.09] | fail 0.91/2.6 [-0.03] | . | . | . |
| st10 | . | . | . | . | . | . | PASS 1.52/4.3 [+0.09] | PASS 1.19/3.4 [+0.27] | . | . | . |
| st10h | . | . | . | . | . | . | fail 0.87/2.5 [-0.18] | fail 0.23/0.6 [-0.22] | . | . | . |
| stA | fail 0.68/1.9 [+0.63] | PASS 2.34/6.6 [+4.82] | fail 0.06/0.2 [-0.04] | fail -0.05/-0.1 [+0.44] | fail 0.57/1.6 [+0.08] | PASS 9.63/27.2 [+0.04] | PASS 1.10/3.1 [-0.03] | fail 0.18/0.5 [-0.29] | PASS 3.51/9.9 [+3.15] | PASS 2.91/8.2 [+2.26] | PASS 1.21/3.4 [-0.16] |
| stB | . | . | . | . | . | . | fail 0.76/2.1 [-0.37] | . | . | . | . |
| stC | . | . | . | . | . | . | PASS 1.10/3.1 [-0.03] | fail 0.18/0.5 [-0.29] | . | . | . |
| stD | . | . | . | . | . | . | PASS 1.02/2.9 [-0.05] | fail 0.77/2.2 [-0.28] | . | . | . |
| stE | . | . | . | . | . | . | PASS 1.18/3.4 [+0.09] | PASS 1.17/3.3 [+0.35] | . | . | . |
| v6hub | fail 0.76/2.1 [+0.47] | PASS 2.21/6.2 [+0.23] | fail -0.09/-0.2 [-0.12] | fail -0.57/-1.6 [+0.18] | fail 0.55/1.6 [+0.18] | PASS 6.88/19.5 [+0.56] | fail 0.67/1.9 [-0.41] | PASS 1.70/4.8 [+0.15] | PASS 3.76/10.6 [+3.56] | PASS 2.46/7.0 [+2.06] | PASS 1.95/5.5 [-0.22] |
| v6np | fail 0.57/1.6 [+0.53] | PASS 2.38/6.7 [-0.66] | fail -0.16/-0.5 [-1.37] | PASS 1.31/3.7 [+0.95] | fail 0.30/0.9 [+1.38] | PASS 11.09/31.4 [+0.10] | fail 0.73/2.1 [-0.70] | PASS 1.41/4.0 [-0.07] | PASS 3.48/9.8 [+3.12] | PASS 2.59/7.3 [+2.02] | PASS 1.36/3.9 [-0.12] |
````

### Verbatim: `results/sc-port/scores_520.md`

````markdown
# block 520 (16 seeds each). Cell: PASS/fail, weakest within-test control d/t; [vs base full: d]
| arm | HOT3RM |
|---|---|
| comboA | fail 0.92/2.6 |
| h3base | fail 0.67/1.3 |
| h3port | PASS 1.26/3.6 |
| h3v01 | PASS 1.71/3.4 |
| h3v02 | fail 1.10/2.2 |
| h3v03 | fail 1.11/2.2 |
| h3v04 | fail 0.57/1.1 |
| h3v05 | fail 1.06/2.1 |
| h3v06 | fail 1.30/2.6 |
| h3v07 | fail 0.47/0.9 |
| h3v08 | fail 0.56/1.1 |
| h3v09 | fail 0.86/1.7 |
| h3v10 | PASS 1.66/3.3 |
| st06 | PASS 1.19/3.4 |
| st08 | fail 0.97/2.7 |
| st09 | PASS 1.35/3.8 |
| st09b | PASS 1.14/3.2 |
| st10 | PASS 1.37/3.9 |
| st10h | PASS 1.11/3.1 |
| stA | fail 0.70/2.0 |
| stB | PASS 1.57/4.4 |
| stE | PASS 1.76/5.0 |
````

### Verbatim: `results/sc-port/scores_540.md`

````markdown
# block 540 (16 seeds each). Cell: PASS/fail, weakest within-test control d/t; [vs base full: d]
| arm | AE1 | AE2 | AINF | C10 | C16R | GWT2 | HOT3RM | RPT1 | RPT2R | RPT2RL5 | UAL |
|---|---|---|---|---|---|---|---|---|---|---|---|
| base | PASS 1.91/5.4 | PASS 2.07/5.8 | fail 0.14/0.4 | fail -0.54/-1.5 | fail 0.56/1.6 | PASS 6.95/19.6 | fail 0.73/2.1 | fail 0.85/2.4 | fail 0.31/0.9 | PASS 2.11/6.0 | PASS 1.04/2.9 |
| c10k5 | fail 0.78/2.2 [-0.47] | PASS 1.81/5.1 [+3.94] | fail 0.11/0.3 [-0.44] | PASS 1.35/3.8 [+0.79] | fail 0.30/0.9 [+0.91] | PASS 7.42/21.0 [-0.04] | PASS 1.40/4.0 [+0.65] | PASS 1.52/4.3 [+0.30] | PASS 3.15/8.9 [+3.19] | PASS 3.56/10.1 [+1.99] | PASS 1.20/3.4 [+0.19] |
| comboA | PASS 1.33/3.8 [-0.23] | PASS 2.07/5.9 [+4.02] | fail -0.44/-1.2 [-0.27] | fail -0.49/-1.4 [+0.01] | fail 0.80/2.2 [+0.23] | PASS 8.92/25.2 [-0.06] | PASS 1.27/3.6 [+0.54] | PASS 1.11/3.1 [+0.25] | PASS 3.65/10.3 [+3.24] | PASS 4.15/11.7 [+2.03] | PASS 1.00/2.8 [-0.04] |
| comboB | fail 0.27/0.8 [-0.82] | PASS 1.77/5.0 [+4.06] | fail 0.05/0.1 [-0.12] | fail -0.62/-1.8 [+0.06] | fail 0.35/1.0 [-0.01] | PASS 8.19/23.2 [-0.28] | PASS 1.26/3.6 [+0.64] | fail 0.85/2.4 [+0.32] | PASS 3.16/8.9 [+2.87] | PASS 4.39/12.4 [+2.03] | PASS 1.00/2.8 [+0.02] |
| h3base | . | . | . | . | . | . | fail 0.73/2.1 [+0.00] | . | . | . | . |
| h3hybA | . | . | . | . | . | . | PASS 1.91/5.4 [-2.02] | . | . | . | . |
| h3hybB | . | . | . | . | . | . | PASS 1.81/5.1 [+0.50] | . | . | . | . |
| h3port | . | . | . | . | . | . | PASS 1.03/2.9 [-0.04] | . | . | . | . |
| h3v01 | . | . | . | . | . | . | PASS 1.79/5.1 [+0.87] | . | . | . | . |
| h3v03 | . | . | . | . | . | . | fail 0.80/2.3 [-1.96] | . | . | . | . |
| h3v06 | . | . | . | . | . | . | PASS 1.03/2.9 [-0.05] | . | . | . | . |
| st06 | . | . | . | . | . | . | fail 0.95/2.7 [+0.00] | . | . | . | . |
| st08 | . | . | . | . | . | . | PASS 1.25/3.5 [+0.38] | . | . | . | . |
| st09 | . | . | . | . | . | . | PASS 1.11/3.2 [+0.65] | . | . | . | . |
| st09b | . | . | . | . | . | . | PASS 1.15/3.2 [+0.40] | . | . | . | . |
| st10 | . | . | . | . | . | . | PASS 1.21/3.4 [+0.63] | . | . | . | . |
| st10h | . | . | . | . | . | . | PASS 1.20/3.4 [+0.39] | . | . | . | . |
| stA | . | . | . | . | . | . | fail 0.84/2.4 [+0.29] | . | . | . | . |
| stB | . | . | . | . | . | . | PASS 1.15/3.2 [+0.27] | . | . | . | . |
| stE | . | . | . | . | . | . | PASS 1.29/3.6 [+0.31] | . | . | . | . |
| v6hub | PASS 1.33/3.8 [-0.23] | PASS 2.00/5.7 [+0.05] | fail -0.44/-1.2 [-0.27] | fail -0.49/-1.4 [+0.01] | fail 0.80/2.2 [+0.23] | PASS 8.92/25.2 [-0.06] | fail 0.90/2.6 [+0.15] | PASS 1.11/3.1 [+0.25] | PASS 3.65/10.3 [+3.24] | PASS 4.15/11.7 [+2.03] | PASS 1.00/2.8 [-0.04] |
````

### Verbatim: `results/sc-port/scores_560.md`

````markdown
# block 560 (16 seeds each). Cell: PASS/fail, weakest within-test control d/t; [vs base full: d]
| arm | AE2 | AINF | RPT2R |
|---|---|---|---|
| base | PASS 3.15/8.9 | . | fail 0.00/0.0 |
| ae1 | PASS 3.25/9.2 [+5.25] | . | . |
| ae10 | PASS 3.12/8.8 [-0.51] | . | . |
| ae10k3 | PASS 2.39/6.8 [-2.10] | . | . |
| ae1k3 | PASS 3.25/9.2 [+6.07] | . | . |
| ae2 | PASS 3.25/9.2 [+4.42] | . | . |
| ae2k3 | PASS 3.25/9.2 [+4.42] | . | . |
| ae3 | PASS 3.25/9.2 [+5.39] | . | . |
| ae3k3 | PASS 3.25/9.2 [+5.40] | . | . |
| ae4 | PASS 3.13/8.9 [-0.23] | . | . |
| ae4k3 | PASS 2.98/8.4 [-2.08] | . | . |
| ae5 | PASS 3.12/8.8 [-1.15] | . | . |
| ae5k3 | PASS 2.63/7.4 [-2.47] | . | . |
| ae6 | PASS 3.02/8.5 [-0.98] | . | . |
| ae6k3 | PASS 3.01/8.5 [-1.08] | . | . |
| ae7 | PASS 3.14/8.9 [-0.14] | . | . |
| ae7k3 | PASS 2.77/7.8 [-4.99] | . | . |
| ae8 | PASS 3.07/8.7 [-1.53] | . | . |
| ae8k3 | PASS 3.08/8.7 [-2.10] | . | . |
| ae9 | PASS 3.23/9.1 [+3.95] | . | . |
| ae9k3 | PASS 3.22/9.1 [+3.84] | . | . |
| aibase | . | fail 0.38/0.8 | . |
| aiv01 | . | fail 0.24/0.5 | . |
| aiv02 | . | fail 0.27/0.5 | . |
| aiv03 | . | fail 0.16/0.3 | . |
| aiv04 | . | fail 0.07/0.1 | . |
| aiv05 | . | fail 0.10/0.2 | . |
| aiv06 | . | fail 0.22/0.4 | . |
| aiv07 | . | fail 0.31/0.6 | . |
| aiv08 | . | fail 0.30/0.6 | . |
| aiv09 | . | fail 0.12/0.2 | . |
| aiv10 | . | fail 0.03/0.1 | . |
| bm | PASS 3.24/9.2 [+4.52] | . | . |
| rp10k1 | . | . | fail 0.30/0.9 [+0.33] |
| rp10k3 | . | . | PASS 2.07/5.9 [+2.20] |
| rp1k1 | . | . | PASS 1.78/5.0 [+1.89] |
| rp1k3 | . | . | PASS 6.00/17.0 [+6.86] |
| rp2k1 | . | . | PASS 1.20/3.4 [+1.30] |
| rp2k3 | . | . | PASS 2.87/8.1 [+3.02] |
| rp3k1 | . | . | fail -0.41/-1.2 [-0.46] |
| rp3k3 | . | . | fail -0.60/-1.7 [-0.70] |
| rp4k1 | . | . | fail 0.77/2.2 [+0.82] |
| rp4k3 | . | . | PASS 1.20/3.4 [+1.30] |
| rp5k1 | . | . | PASS 1.33/3.8 [+1.43] |
| rp5k3 | . | . | PASS 2.81/7.9 [+3.10] |
| rp6k1 | . | . | fail 0.88/2.5 [+1.00] |
| rp6k3 | . | . | PASS 1.75/5.0 [+1.93] |
| rp7k1 | . | . | PASS 2.71/7.7 [+2.94] |
| rp7k3 | . | . | PASS 6.22/17.6 [+7.18] |
| rp8k1 | . | . | PASS 3.09/8.7 [+3.34] |
| rp8k3 | . | . | PASS 6.63/18.8 [+7.81] |
| rp9k1 | . | . | PASS 4.60/13.0 [+5.04] |
| rp9k3 | . | . | PASS 3.92/11.1 [+4.26] |
| v6hub | . | . | PASS 3.90/11.0 [+4.27] |
````

### Verbatim: `specialists/HOT3RM/README.md`

````markdown
# Specialist: HOT3RM (HOT-3 metacognitive opt-out)
Substrate: Creature #1 v5.7b (ORG_V5=11) with one flag on; controls are the test's own (random opt-out at matched rate, shuffled confidence). Dev seeds only.

Cheap screen (8 seeds, block 520; pass needs d>=0.8 and t>=2.75 vs both controls, weakest shown):
| v | approach (source) | flags | d / t | result |
|---|---|---|---|---|
| v01 | active-inference stack: EFE info gain + empowerment + SR + belief-precision confidence (Friston 2015; Klyubin 2005; Dayan 1993; Meyniel 2015; SUPER CREATURE) | scAIe1 scEm1 scSR1 scAIm0.5 | 1.71 / 3.4 | PASS |
| v02 | belief-precision confidence only (Meyniel, Sigman & Mainen 2015) | scAIm0.5 | 1.10 / 2.2 | fail (screen) |
| v03 | soft capacity-limited workspace, T=1 (Baars; Cowan; SUPER CREATURE gwtCapacity) | scGW1 scGWT1 | 1.11 / 2.2 | fail |
| v04 | workspace, no capacity limit (K=16) | scGW1 scGWk16 | 0.57 / 1.1 | fail |
| v05 | V6 binding hub, no learned precision (Gayler 2003) | ORG_V6 v6P0 | 1.06 / 2.1 | fail |
| v06 | Hebbian fast weights + learned recurrence (Ba et al. 2016; SUPER CREATURE FastWeights) | scFW1 scLR1 | 1.30 / 2.6 | fail (near) |
| v07 | sampling-based confidence, noise 0.5 (Buesing et al. 2011) | scSMC0.5 | 0.47 / 0.9 | fail |
| v08 | sampling-based confidence, noise 0.2 | scSMC0.2 | 0.56 / 1.1 | fail |
| v09 | belief-precision confidence, weight 1.0 | scAIm1 | 0.86 / 1.7 | fail |
| v10 | workspace T=0.5 | scGW1 scGWT0.5 | see raw | |

Full dev (16 seeds, block 540): base 0.73/2.1 fail; v01 1.79/5.1 PASS; v06 1.03/2.9 PASS; v03 0.80/2.3 fail; hybrid A (v01+v03) 1.91/5.4 PASS; hybrid B (v01+v06) see raw. Block 500 (16 seeds): v01 1.49/4.2 PASS, v02 1.28/3.6 PASS, v03 1.94/5.5 PASS but GWT2 effect -3.3 d vs base (regression), v06 fail.
Ablation inside v01: without scAIm (aiC) HOT3RM fails (0.61) -> the gain is carried by belief-precision confidence (scAIm). Hybrid A is best on 540 but costs GWT2, so the port choice is v01's scAIm (+ optional rest of the stack).

## Port and integration check (Alex's rule)
Port = scAIm 0.5 plus scCI 1 (confidence below its running mean drives the LC via predErr; hunger lowers the weight on belief precision).
- (b) state dependence: PASS. Belief-precision weight 0.47 when sated vs 0.28 when hungry (16 dev seeds, seed base 600).
- (a) ablation moves >=2 other subsystems: FAIL. In a natural life (no test teaching) the monitor never learns: conf stays 0.5 and margin 0 every tick, because the action readout (mind.act) and the confidence monitor (meta3) are trained only by the harness calls teachAction/teachConf. So nothing reaches NE, sleep, foraging or mood (all paired differences exactly 0). This is an architecture finding, not a tuning problem: HOT-3 as built is a test-only pathway.
- Needed fix (not done yet): self-supervise confidence from the creature's own forage outcomes (confidence about the chosen site = Beta-posterior precision and race margin, trained on got/not-got), so it exists outside tests and can drive LC and learning rate.

## Self-training fix (2026-11-01 US Pacific): st01-st08 (folders st01-st05; st06-08 are scCI/scST gain points)
Code: Mind.selfConf (M50.scST, default off): at each forage the monitor's confidence is treated as a prediction of that choice's success and is updated on the creature's own outcome (food or not), DA-gated (Kepecs et al. 2008; Fleming & Daw 2017). scSTs puts the learning in separate weights. No harness labels. Substrate Combo A.
| arm | flags | HOT3RM 500 | 520 | 540 | RPT1 500 | integ (a) moved (paired t>=2.75, seeds 600-615) |
|---|---|---|---|---|---|---|
| comboA | - | PASS 1.31/3.7 | fail 0.92/2.6 | PASS 1.27/3.6 | PASS 1.70/4.8 | FAIL (conf fixed at 0.5) |
| st01 | scCI1 scST1 | PASS 1.10/3.1 | fail 0.70/2.0 | fail 0.84/2.4 | fail 0.18/0.5 | PASS cortisol, foraged |
| st02 | scCI1 scST3 | fail 0.76/2.1 | PASS 1.57/4.4 | PASS 1.15/3.2 | - | PASS NE, DA, cortisol |
| st03 | scCI1 scST1 scSTs1 | PASS 1.10/3.1 | - | - | fail 0.18/0.5 | - |
| st04 | scCI0.25 scST1 scSTs1 | PASS 1.02/2.9 | - | - | fail 0.77/2.2 | - |
| st05 | scCI0.25 scST3 | PASS 1.18/3.4 | PASS 1.76/5.0 | PASS 1.29/3.6 | PASS 1.17/3.3 | FAIL foraged only |
| st06 | scCI0.5 scST3 | PASS 0.99/2.8 | PASS 1.19/3.4 | fail 0.95/2.7 | fail 0.48/1.4 | PASS DA, foraged |
| st07 | scCI0.5 scST6 | - | - | - | - | PASS NE, DA, cortisol, foraged, rewards |
| st08 | scCI0.35 scST3 | PASS 1.49/4.2 | fail 0.97/2.7 | PASS 1.25/3.5 | fail 0.87/2.5 | PASS DA, cortisol, rewards |
(b) PASS throughout: belief-precision weight 0.47 sated vs 0.28 hungry.
Finding: confidence now learns in natural life (mean conf 0.42-0.46 instead of fixed 0.5). How strongly confidence drives the LC sets a trade-off: strong enough to move >=2 subsystems (a) costs HOT3RM on one block and RPT1; weak enough to keep HOT3RM 3/3 and RPT1 (st05) moves only foraging. No arm passes a+b+c yet. Best-for-tests: st05; best balance: st08 (a PASS, HOT3RM 2/3 + 520 t 2.7, RPT1 t 2.5). Note Combo A itself is borderline on HOT3RM 520 (0.92/2.6), so HOT3RM sits near threshold. Remaining ideas (not run): route confidence to a target other than the LC (e.g. forage persistence or learning rate only), which may give (a) without touching RPT1.
````

### Verbatim: `specialists/CQM10/README.md`

````markdown
# Specialist: CQM10 (goal regulation, viable fraction)
Test (organism/tests_v31.ts C10): fraction of ticks on days 2-4 with 2 < glucose < 4.5, ATP > 1.5, adenosine < 0.9; arm full vs fixed forage probability 0.12. Grade A needs full > fixed (d>=0.8, t>=2.75).
Diagnosis (diag.ts, Combo A, seeds 500-507): full fails only by hyperglycaemia (5.8% of ticks vs 2.6%); full forages 68/day vs 54 and ends with fat 292 vs 271. So the fix must be meal termination / satiety, not more drive.
Substrate: Combo A (ORG_V6=1 v6P0 v6Ak0 scAIm0.5 scBM1). Code: Organism.c10G/c10Tick in organism/organism.ts, flag M50.c10=<variant>, gain c10K (default 0 = off, bit-identical: comboA C10 rerun -0.57/-1.6 identical). Each vNN/ folder = spec + runner.

C10 screen, block 500, 16 seeds (weakest control d/t), plus diag (8 seeds) forages/day and end fat (full arm; fixed = 54/day, fat 271):
| v | approach (source) | C10 | forages/day | fat | verdict |
|---|---|---|---|---|---|
| base | Combo A | fail -0.57/-1.6 | 67.9 | 292 | over-eats |
| v01 | hypothalamic glucose-sensing satiety (Parton 2007) | PASS 1.40/3.9 | 56.8 | 269 | winner |
| v02 | gastric stretch / CCK satiation (Schwartz & Moran 1996) | PASS 1.32/3.7 | 60.7 | 270 | winner |
| v03 | interoceptive forward prediction of glucose (Seth 2013) | PASS 1.50/4.2 | 31.2 | 233 | reject: under-eats |
| v04 | post-ingestive GLP-1 refractory (Turton 1996) | PASS 1.50/4.2 | 49.0 | 258 | winner (mild under-eating) |
| v05 | set-point PI controller on glucose (Cannon 1932) | PASS 1.50/4.2 | 39.3 | 239 | reject: under-eats |
| v06 | learned allostatic meal anticipation (Sterling 2012) | PASS 1.35/3.8 | 65.3 | 273 | winner |
| v07 | cephalic-phase insulin (Teff 2000) | fail -0.75/-2.1 | 93.5 | 324 | fail (raises intake) |
| v08 | hepatic glucokinase uptake (Agius 2008) | fail -0.58/-1.6 | 71.4 | 297 | fail (helps both arms) |
| v09 | hepatic insulin sensitivity (Cherrington 1999) | fail -0.57/-1.6 | - | - | fail (helps both arms) |
| v10 | central insulin satiety on whole drive (Woods 1979) | PASS 1.46/4.1 | 46.8 | 243 | reject: under-eats |
| h11 | v01+v03 | PASS 1.50/4.2 | 31.2 | 233 | reject |
| h12 | v03+v04 | PASS 1.50/4.2 | 30.3 | 231 | reject |
| h13 | v01 x v02 | PASS 1.50/4.2 | 54.0 | 259 | RPT1 fail 0.26/0.7 -> reject |
| v01 K0.5 | v01, gate starts at 3.6 mM | PASS 1.27/3.6 | 65.8 | 275 | best candidate |

Is the PASS real? The full arm reaches viable fraction 1.0 on every seed by removing post-meal hyperglycaemia. Variants that only pass by eating less than the fixed arm and losing fat (v03, v05, v10, h11, h12) are flagged as wrong-reason. v01/v02/v06/v01K0.5 keep intake at or above the fixed arm and fat steady: genuine regulation. Physiological-only fixes fail because the control arm shares the body.
Regression checks on Combo A, block 500: v01 (K1) full battery: C10/HOT3RM/RPT2R/RPT2RL5/UAL/AE2/GWT2 PASS, RPT1 0.90/2.5 (Combo A 1.70/4.8) -> regression. v01 K0.5: RPT1 PASS 1.00/2.8. v04: RPT1 PASS 0.98/2.8.
Integration (v01 K1 vs Combo A, probe seeds 600-615): (a) PASS, moves NE, ACh, DA, foraging, rewards; (b) the gate reads blood glucose (internal state) by construction.
Status: NOT ported. Next: v01 K0.5 full battery on 500 + 540, integration probe, then a v01K0.5 x v06 hybrid if needed.
````

### Verbatim: `specialists/RPT2R/README.md`

````markdown
# Specialist: RPT2R
Winners: V6 binding hub without learned precision (v6hub: also no aic) d 3.76 t 10.6; with aic (v6np) d 3.48. Hebbian fast weights + learned recurrence HURT RPT2R (d -0.10 to -0.49) while helping GWT2 and RPT1. Capacity workspace neutral.
````

### Verbatim: `specialists/AE2/README.md`

````markdown
# Specialist: AE2 (body model)
Base already passes (d 2.49). SC body model (scBM: Kalman gain estimate + learned noise + innovation-gated updates instead of the oracle push flag) improves AE2 tracking error vs base by d +4.24 (block 500) and keeps the pass (2.55/7.2). No other test changed (all [+0.00]).
````

### Verbatim: `specialists/AINF/README.md`

````markdown
# Specialist: AINF (active-inference epistemic term)
Ten brain-side approaches, cheap screen (8 seeds, block 560), weakest d/t vs "epistemic term lesioned": base 0.38/0.8; v01 uK1 0.24; v02 uK3 0.27; v03 AOM IG x3 0.16; v04 SC EFE info gain x3 0.07; v05 SC empowerment x3 0.10; v06 knowledge gradient 0.22; v07 depletion-entropy eK 0.31; v08 learning-progress curiosity 0.30; v09 EFE+empowerment+uK 0.12; v10 Thompson-style tsK 0.03. All fail; none beats base.
Block 500 (16 seeds): every SC arm fails (d -0.16 to 0.13).
Diagnosis: the test is under-powered rather than capped. Rewards over 2 days are ~55 with between-seed SD ~18, while the epistemic term moves them by ~2 (paired dz 0.45 on base). An unpaired Welch test needs ~15 extra rewards. Stronger epistemic drives do not help because the depleting world rewards exploitation. Recommendation: a paired-seed variant (same seed, lesion vs full) or longer horizon, preregistered, rather than tuning the brain to the test.
````

### Verbatim: `specialists/GWT2/README.md`

````markdown
# Specialist: GWT2 / C10
GWT2 already passes on dev with huge effects (base d 6.41 t 18.1, block 500); R21 lists GWT-2 FAIL with d 8.43, so the failure there is the non-ceiling rule, not effect size. The capacity-limited workspace (scGW, K=4, T=0.25) raises GWT2 by d +0.98 vs base and T=0.1 by +1.24; it cannot cure a ceiling. Test-design issue: needs harder distractors (see preregistration notes).
C10 (CQM10): base fails with the sign reversed (d -0.73: fixed foraging drive keeps glucose in band better than the creature's own drive). No SC module changes that (all within +-0.12). Queued for a homeostatic specialist.
````

### Verbatim: `specialists/tools/score.py`

````markdown
import json,glob,os,math,statistics as S,sys
blk=sys.argv[1] if len(sys.argv)>1 else '500'
def dt(a,b):
    ma,mb=S.mean(a),S.mean(b); va,vb=S.variance(a),S.variance(b); sp=math.sqrt((va+vb)/2) or 1e-12
    return (ma-mb)/sp,(ma-mb)/(math.sqrt(va/len(a)+vb/len(b)) or 1e-12)
R={}
for f in glob.glob(f'/tmp/scp/out/*_{blk}/tune_*.json'):
    arm=os.path.basename(os.path.dirname(f)).rsplit('_',1)[0]; j=json.load(open(f)); A=j['arms']; fk=list(A)[0]
    R[(arm,j['key'])]=A
arms=sorted({a for a,_ in R}, key=lambda a:(a!='base',a)); tests=sorted({t for _,t in R})
print(f"# block {blk} (16 seeds each). Cell: PASS/fail, weakest within-test control d/t; [vs base full: d]")
print("| arm | "+" | ".join(tests)+" |"); print("|---"*(len(tests)+1)+"|")
for a in arms:
    row=[]
    for t in tests:
        if (a,t) not in R: row.append('.'); continue
        A=R[(a,t)]; fk=list(A)[0]; cs=[dt(A[fk],v) for k,v in A.items() if k!=fk]
        ok=all(d>=0.8 and tt>=2.75 for d,tt in cs); d,tt=min(cs,key=lambda x:x[0])
        s=f"{'PASS' if ok else 'fail'} {d:.2f}/{tt:.1f}"
        if a!='base' and ('base',t) in R: s+=f" [{dt(A[fk],R[('base',t)][fk])[0]:+.2f}]"
        row.append(s)
    print(f"| {a} | "+" | ".join(row)+" |")
````

### Verbatim: `specialists/tools/loop_combo.sh`

````markdown
#!/bin/bash
cd /tmp/scp; while [ ! -e s1.done ]; do sleep 120; done
C1='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}'; C2='{"v6P":0,"v6Ak":0,"scAIe":1,"scEm":1,"scSR":1,"scAIm":0.5,"scBM":1}'
for B in 500 540; do for T in HOT3RM RPT2R AE1 AE2 RPT1 RPT2RL5 UAL GWT2 AINF C10 C16R; do
  printf "comboA ORG_V6=1 '%s' %s %s '{}'\ncomboB ORG_V6=1 '%s' %s %s '{}'\n" "$C1" $B $T "$C2" $B $T; done; done > jobs_combo.txt
for B in 540; do for T in HOT3RM RPT2R AE1 AE2 RPT1 RPT2RL5 UAL GWT2 AINF C10 C16R; do printf "base ORG_V5=11 '{}' %s %s '{}'\nv6hub ORG_V6=1 '{\"v6P\":0,\"v6Ak\":0}' %s %s '{}'\n" $B $T $B $T; done; done >> jobs_combo.txt
xargs -P 2 -L 1 bash -c 'BUNDLE=/tmp/scp/sc3.js /tmp/scp/run3.sh "$0" "$1" "$2" "$3" "$4" "$5"' < jobs_combo.txt; touch combo.done
````

### Excerpt: `preregistrations/v4.0.md` lines 350-420 (B28/B29)
````markdown
- z-scored, divisively normalised readouts (zr) on.
The forward models (EFM, CFM) and choice stay as in v5.7b, one shared instance each; no new per-test modules.
Tests whose readouts read "all cells of a module" now read MW cells (disclosed in the code). With ORG_MW=13 every output is bit-identical to v5.7b (checked).
Order: speed and viability first (dev, 3 days), then a full recheck vs v5.7b on dev and on held-out (both run regardless; nothing is tuned between them), then the AE1 pool over 48 seeds.
A test "moves with scale" if its pass status differs between v5.7b and v6.0 on both dev and held-out.
Disclosed: a 2-seed 1-day smoke on old dev seeds 3721-3722 (speed 4.3x, both alive) was run before this section.
No AINF variant; RPT2R parked.

## B28 (DRAFT; chosen 2026-11-01 14:40 UTC, before any run). v6.1: cortex-size-invariant efferent gain
Seeds:
- held-out 3945-3960 (picked first);
- dev 3961-3976;
- AE1 pool 3977-4024 (48 seeds).
Diagnosis behind it: under the v4.0 grown wiring, the random cortical efferents (CTX -> STR, MOT, INS, THAL, HIP and CTX -> CTX) were NOT scaled in B27, so their fan-in grew about 10x with cortex size. The 1/CS scaling only reached the topographic and i.i.d. paths.
v6.1 (ORG_V5=14, ORG_MW=130) = v6.0 + every grown synapse from a cortical cell weighted 1/CS (synaptic scaling by fan-in; Turrigiano 2008). This is one general rule, not per target. It is the identity at ORG_MW=13 (checked bit-identical before any measured run).
Recheck: v6.1 vs v6.0 vs v5.7b, all tests, on dev and held-out, plus the glucose probe on dev seeds 3961-3964 and AE1 pooled over 48.
Goal stated in advance: keep C16R, AE1 and CQM12; recover C10, UAL and RPT2RL5.

### B27 RESULT (2026-11-01)
- Viability: 16/16 alive on dev, 7x slower; forages 579 vs 252 = over-eating (glucose probe: mean 6.8 vs 3.4, time above band 0.29 vs 0.13).
- AE1 48-seed pool (3897-3944): v5.7b 1.24/6.08, v6.0 1.80/8.82.
- Full recheck v5.7b -> v6.0 (results/b27/recheck_3881.md dev, recheck_3865.md held-out).
  - Pass status changes on both blocks: C16R gains (0.43 -> 1.13 dev, 0.43 -> 1.04 held-out); UAL loses (1.10 -> 0.05, 1.04 -> 0.10).
  - Mixed: AE1 at 16 seeds (dev loses, held-out gains), CQM12 (dev gain), HOT3RM/HOT3RM-P, RPT2RL5 (held-out loss).
  - C10 worsens on both (-0.6 -> -1.6 / -2.2).
  - C16 strengthens (6 -> 13 / 10 -> 19); GWT3R weakens but passes.
- Cause found for B28: grown cortical efferents were not fan-in scaled.

### B28 RESULT (FINAL, 2026-11-02)
- Identity at ORG_MW=13: IDENTICAL (results/b28/id_result).
- Pass rule: d>=0.8 and t>=2.75 against every control. The verdict uses dev 3961 only; held-out 3945 is disclosed context.
- Recheck tables: results/b28/recheck_{3961,3945}_*.md (raw: c14_{v57b,v60,v61}_*).
- C10: not recovered. v6.1 -2.46/-6.95 dev, -2.54/-7.18 held-out (v6.0 -2.22/-6.29, -2.75/-7.77; v5.7b -0.31/-0.88, -0.58/-1.63). FAIL.
- RPT2RL5: not recovered. v6.1 -0.10/-0.29 dev, 0.24/0.67 held-out (v6.0 -0.13/-0.37, 0.54/1.52; v5.7b 1.19/3.35, 0.65/1.85). FAIL.
- UAL: not recovered. v6.1 -0.04/-0.12 dev, 0.50/1.42 held-out (v6.0 0.39/1.11, 0.10/0.29; v5.7b 1.15/3.25, 1.25/3.55). FAIL.
- C16R: not kept. v6.1 0.91/2.56 dev (t fails), 0.57/1.62 held-out (v6.0 1.29/3.64 pass, 0.74/2.09; v5.7b 0.94/2.65, 0.55/1.57). FAIL. This corrects the interim line 'C16R kept on both blocks'.
- CQM12: not kept. v6.1 0.63/1.77 dev, 1.26/3.58 held-out (v6.0 0.86/2.45, 0.98/2.78; v5.7b 1.26/3.56, 1.12/3.17). FAIL on dev.
- AE1 at 16 seeds: v6.1 1.59/4.49 dev, 1.86/5.27 held-out (v6.0 2.10/5.95, 1.16/3.29; v5.7b 0.43/1.22, 0.75/2.12).
- AE1 48-seed pool (3977-4024; one control, RPE learning lesioned; 3 x 16-seed chunks results/b28/ae14_{11,13,14}_*; same method as B27):
  - v5.7b 0.80/3.90 (d = 0.795, fails on d);
  - v6.0 1.48/7.23 (passes);
  - v6.1 1.45/7.10 (passes). AE1 kept.
- Glucose probe, dev 3961-3964 (results/b28/glc28_*.json), mean glucose / time above band:
  - v5.7b 2.92 / 0.011;
  - v6.0 5.92 / 0.28;
  - v6.1 4.14 / 0.16 (one seed 3962 still at 6.8 / 0.44; seed 3963 0.09 below band). Over-eating reduced, not removed.
- Viability (dev): forages v5.7b 238, v6.0 625, v6.1 524; 0 deaths in all.
- Other dev changes v6.0 -> v6.1: HOT3RM-P gains (0.75/2.98 -> 1.39/5.56); HOT1, thaler9, GWT3R, C08R, C16, PROJR still pass.
- Final verdict: v6.1 does NOT meet its stated goal. It keeps AE1, but loses C16R and CQM12 on dev and recovers none of C10, UAL and RPT2RL5.

## B29 (DRAFT, not frozen) — v6.2 fan-in pooled readouts (2026-11-01)
- Trigger: B28 interim shows RPT2RL5 not recovered by v6.1 (dev 3961 −0.10, held-out 3945 0.24).
- v6.2 = v6.1 + fanR: UAL value readout and L5 pool read the mean of each group of CS cortical cells, so readout dimension and per-weight gain match the 13-cell module (ORG_V5=15, ORG_MW=130).
- Striatal readout: cortex→STR is grown wiring, already fan-in scaled in v6.1; the striatal value (wSite) is hippocampal, not cortical — no further change.
- Identity at ORG_MW=13: IDENTICAL (results/b29/id2_result).
- Screen: dev block 3961 only (same dev block as B28, disclosed); no held-out run in B29. No parameter tuned.
- B29 v6.2 dev screen (3961, results/b29/screen_3961_*_v62.md), v6.2 vs v6.1:
  - UAL 0.42/1.20 vs -0.04/-0.12; RPT2RL5 0.09/0.25 vs -0.10/-0.29; C10 -2.16/-6.12 vs -2.46/-6.95; C16R 0.82/2.33 vs 0.91/2.56; CQM12 0.89/2.53 vs 0.63/1.77; AE1 (16 seeds) 1.62/4.58 vs 1.59/4.49.
  - Losses vs v6.1: HOT1 (0.91/2.56) and HOT3RM-P (0.56/2.24).
  - Status: v6.2 recovers none of UAL, RPT2RL5 or C10 on dev and does not pass C16R or CQM12. No AE1 pool and no held-out run.
````

### Excerpt: `specialists/QUEUE.md` (P0 + P1 rows)
````markdown
# Specialist master queue (Creature #1)
Rules: dev seeds < 1064 only; grade A = d>=0.8 and Welch t>=2.75 vs every control; each specialist has its own ablation/lesion; world stays neutral.
Port integration check (Alex): (a) ablating the ported module moves >=2 other subsystems' measured variables; (b) the module's behaviour shifts with internal state (hunger/mood); (c) the specialist test still passes with no regressions.
| # | P | List | Item | Status | Specialist folder | Standalone | Ported | Integ a/b/c | Notes |
| 1 | P0 | Butlin | RPT-2 | partial (RPT2R passes with v6hub on dev) | specialists/RPT2R | v6hub d3.76 | in Combo A (provisional; 10-way method skipped) | pending | Combo A 540: 3.65/10.3 |
| 2 | P0 | Butlin | GWT-2 | passes dev; R21 fail is ceiling rule | specialists/GWT2 | scGW +0.98 d | - | - | test needs harder distractors |
| 3 | P0 | Butlin | GWT-3 | partial (R21 A v5.7b) | - | - | - | - |  |
| 4 | P0 | Butlin | GWT-4 | missing (R21 A v5.7b) | - | - | - | - |  |
| 5 | P0 | Butlin | HOT-3 | partial (dev: HOT3RM passes with scAIm) | specialists/HOT3RM | st01-08 self-train; st05 PASS 500/520/540 | not kept | st05 a FAIL b PASS c PASS; st08 a PASS c 2/3 | LC-coupling trade-off |
| 6 | P0 | Frameworks | activeInference | missing (test under-powered) | specialists/AINF | 10 variants, all fail | - | - | paired or longer test needed |
| 7 | P0 | Frameworks | projective | partial (R21 A v5.7b) | - | - | - | - |  |
| 8 | P0 | Frameworks | ctm | partial (R21 A v5.7b) | - | - | - | - |  |
| 9 | P0 | Frameworks | butlin14 | missing (R21 A v5.7b) | - | - | - | - |  |
| 10 | P0 | CQM | CQM01 | pending (R21 A v5.7b) | - | - | - | - |  |
| 11 | P0 | CQM | CQM02 | pending (R21 A v5.7b) | - | - | - | - |  |
| 12 | P0 | CQM | CQM03 | ill-posed for brain | specialists/C03R | not attempted | - | - | birth rule in harness |
| 13 | P0 | CQM | CQM04 | largely ill-posed | specialists/CQM04 | queued | - | - | selection in harness |
| 14 | P0 | CQM | CQM06 | missing (R21 A v5.7b) | - | - | - | - |  |
| 15 | P0 | CQM | CQM08 | partial (R21 A v5.7b) | - | - | - | - |  |
| 16 | P0 | CQM | CQM10 | missing | specialists/CQM10 | 7/13 PASS; best v01 K0.5 1.27/3.6 | not ported | v01 a PASS | gaming variants rejected |
| 17 | P0 | CQM | CQM18 | missing (R21 A v5.7b) | - | - | - | - |  |
| 18 | P0 | CQM | CQM20 (=GWT-3) | partial (R21 A v5.7b) | - | - | - | - |  |
| 19 | P0 | CQM | CQM23 | missing (R21 A v5.7b) | - | - | - | - |  |
| 20 | P1 | LIFE-100 | 15. Ageing / senescence | missing (0/5 attrs BUILT) | - | - | - | - |  |
| 21 | P1 | LIFE-100 | 16. Death | partial (3/5 attrs BUILT) | - | - | - | - |  |
| 22 | P1 | LIFE-100 | 17. Decay / decomposition | missing (0/5 attrs BUILT) | - | - | - | - |  |
| 23 | P1 | LIFE-100 | 25. Body schema | partial (2/5 attrs BUILT) | - | - | - | - |  |
| 24 | P1 | LIFE-100 | 26. Locomotion | partial (1/5 attrs BUILT) | - | - | - | - |  |
| 25 | P1 | LIFE-100 | 27. Legs with their own brains | missing (0/5 attrs BUILT) | - | - | - | - |  |
| 26 | P1 | LIFE-100 | 28. Arms / manipulation | partial (2/5 attrs BUILT) | - | - | - | - |  |
| 27 | P1 | LIFE-100 | 32. Growth | partial (1/5 attrs BUILT) | - | - | - | - |  |
| 28 | P1 | LIFE-100 | 77. Reproduction | partial (1/5 attrs BUILT) | - | - | - | - |  |
| 29 | P1 | LIFE-100 | 80. Development / ontogeny | partial (3/5 attrs BUILT) | - | - | - | - |  |
| 30 | P1 | LIFE-100 | 93. Mating / sexual selection | missing (0/5 attrs BUILT) | - | - | - | - |  |
````

### Excerpt: `DELARP-PLAN.md` §1 inventory
````markdown
## 1. Inventory: literal ports and imitations

| # | Item (where) | Source imitated | Kind | Conflict / failure it causes |
|---|---|---|---|---|
| P1 | CAP-C touch circuit (harness/v27tests.ts, data/celegans_herm_full_edgelist.csv) | OpenWorm c302 *C. elegans* hermaphrodite connectome (ALM/AVM/PLM → AVA/AVB) | literal data port | Failed with the response **reversed** (anterior/posterior sign). The wiring belongs to a different animal and has no link to 001's own CNS. Already excluded from the organism (SYSTEMS_DESIGN §105), but it is still in the harness, the data and the rollups. |
| P2 | CAP-B contact-physics crawler (v2.7) | Nematode/annelid crawling: 6-segment chain, CPG with phase lag 2π/5, "bristle-like" anisotropic friction (setae) | body/locomotion mimic | 001's own body is a shell with an arm (AE-2 reaching). The test exercises a separate worm body that the organism never uses. |
| P3 | thaler9 + "Thaler inverted-U" (v1 rules, harness, REM recombination parameter M35.remAll/remLr) | Stephen Thaler's Creativity Machine / "Imagitron" noise-driven recombination | project-specific mechanic + test | Direct conflict with the EFE drive (P5): v3.5 A7 efeK 1.5 dropped thaler9 to d 0.69; v3.7 thaler9 d 0.04; v3.8 §C "no configuration satisfies the two-block rule for both thaler9 and AINF". FAIL in v3.8. |
| P4 | ctm "report agrees with action" | Blum & Blum Conscious Turing Machine (one-hot "chunk" broadcast) | framework-protocol mimic | Clean one-hot stimuli push it to the ceiling, so it fails the non-ceiling rule (FAIL v3.8). GWT-3 is the same test (same broadcast lesion), so it is double-counted. ctm-R passes. |
| P5 | activeInference / efeK / efeTau / efeVis / M36 IG / M37 bmW / M38 efeC (organism.ts L494–499) | Friston EFE as a literal formula layered **on top of** the spiking race | 4 stacked versions of one drive | A uniform epistemic bonus saturates the race (v3.8 §C). It fights thaler9, AE-1 (v3.5 A7 d 0.39) and UAL (via the vK trade-off in v3.9 §D). activeInference FAIL in v3.8. |
| P6 | AST-1 / AST-1R (harness, Kalman + LQG controller) | Graziano Attention Schema, implemented as a control-theory toy | harness model, not the organism (MECHANISM_AUDIT FLAG) | v2.7 showed it **cannot pass by construction** (seed 3012 actuator-limit bound). It is a permanent FAIL that measures nothing about 001. |
| P7 | CQM-25 checklist: CQM01 heredity, CQM02 open-endedness, CQM03/03R ecological coupling, CQM04 "reach gene" morphology, CQM14 signalling game, CQM23 substrate pluralism, CQM24/25 | A-Life benchmark list modelled on Avida/Tierra/Polyworld-style evolution and Karl-Sims-style morphology genes | checklist mimicry | CQM04: reach costs ATP, so selection favours low reach (v3.6/3.7: "test economics", no organism fix possible). It directly opposes the energy ledger that VIAB and CQM05/17 reward. CQM01 was degenerate until CQM01R. CQM03R FAIL (d −1.99) because births are generational and do not depend on food. CQM23 cannot apply (JS only). |
| P8 | LTC neurons (V3.4-L1..L5, 10 items) | Hasani et al. Liquid Time-Constant networks (themselves derived from *C. elegans* neurons) | named-architecture port | 0/10 pass in v3.8. Added as a parallel neuron type next to LIF, not integrated. |
| P9 | Quantum layer Q3 / QGT / Berry / NIST (organism Q, NOISESIGN, lab moonlabDice, CROSSOVER tsk/qrng/qgeom/taylor rows) | tsotchke repos (moonlab_qgt, qrng, taylor.js), marked [port] in SYSTEMS_DESIGN | code port | No neuroscience claim. The Q3 stream fails NIST (ones 0.175) and needed the v3.6 NOISESIGN patch. Neuromodulator → qubit-angle coupling is decorative. |
| P10 | "GPU 100M net" (browser only, app.tsx) | LLM-scale parameter count | scale mimicry | Not in the node organism, so no test can see it. CQM25 "scale" counts parameters. |
| P11 | lab/CROSSOVER.md Neuralese → A-Life map (logit/motor lens, ROME memory editing, ACDC, SAE, grokking, RSI) | Neuralese / LLM-interpretability tool suite | instrument mimicry | These are instruments, not organism mechanisms. They are fine as analysis tools. Only "motor lens" became a pass/fail gate (it passes from v0.5). Keep as tools; drop any pass/fail gates that are not concept-level. |
| P12 | Butlin-14 / 10-framework scorecard as **design driver** (RPT, GWT, HOT, AST, PP, AE, IIT, UAL, projective…) | Butlin et al. 2023 indicator list, plus one named theory per framework | framework mimicry | The checklist itself is concept-level and legitimate. The problem: v3.5–v3.9 each added a dedicated mechanism per indicator (cross-module axons for RPT-2, tdIter for HOT-1, evQ for HOT-3, vK for AE-1), each tuned in isolation. v3.9 §D: all four are null or break UAL. |
| P13 | v1 harness models (76/85 frozen items, MECHANISM_AUDIT.tsv "self-contained harness model") | — | test runs a toy, not 001 | Already known. v3.1+ re-runs exist. Keep the v1 results on record, but stop counting them anywhere. |

Not a mimic (keep): LIF spiking CNS with region names taken from mammalian anatomy as **functional roles**; DA-gated three-factor STDP; RPE value learning; neuromodulator kinetics; hormones and metabolism (Cahill/Owen starvation physiology); two-process sleep; NREM replay; interoceptive insula; workspace ignition; latent-cause inference (Gershman/Niv) as a principle; homeostasis; e-prop; the visual body (a shell with an arm; **no worm likeness was found in src/app.tsx / page.tsx**).

````

### Excerpt: `LIFE-100.md` coverage
````markdown
# LIFE-100: 100 areas of life for Creature 001

Status: roadmap document only (2026-11-02, Asia/Manila). No code changed. Read before writing: DELARP-PLAN.md (Parts I–XV), REARCHITECT.md, /workspace/freak-100.md (FREAK-100).

## Vision (Alex)
Nothing cosmetic. Every part is adaptive, reactive and causally coupled, so dome stimuli and the creature's own state reach every other part. Physical abilities: morph, mimic, expand/contract, extend/shorten, grow, die, mutate, procreate, harvest, nurture, raise young, evolve. A weird body: legs with their own brains, alien eyes, arms and body. Many sensors, emotions, feelings and nerve types. "Psychic", wireless and remote-viewing senses are built as **real simulated mechanisms inside the dome** (fields, channels with cost and noise, validated against shuffle controls), never as claims about real-world ESP. Long-term target: a brain of about 100M parameters / connections / synapses, beyond the fly connectome (FlyWire: ~140k neurons, ~5×10^7 synapses; Dorkenwald et al. 2024, Nature). The dome stays neutral; all balancing happens inside the creature.

## Status key
- **BUILT**: code exists and is wired in; `file:line` given (paths relative to `creatures/001/` unless they start with `lab/`, which is relative to the repo root). BUILT means the mechanism exists, *not* that it has passed a preregistered test. Most v4.0 parts have only n = 1 smoke tests (DELARP Parts XI–XV).
- **PARTIAL**: a fragment exists (e.g. the dome does it rather than the organism, a stand-in variable, synthetic only).
- **PLANNED**: specified in DELARP-PLAN.md, REARCHITECT.md or FREAK-100, not coded.
- **MISSING**: neither code nor plan.

Line numbers are for branch v4.0 at the commit that adds this file. Many organism.ts lines hold several statements; the line is where the mechanism starts.

## Coverage summary (500 attributes)
| Status | Count | Share |
|---|---|---|
| BUILT | 202 | 40% |
| PARTIAL | 27 | 5% |
| PLANNED | 106 | 21% |
| MISSING | 165 | 33% |
| Total | 500 | 100% |

| Group | BUILT | PARTIAL | PLANNED | MISSING |
|---|---|---|---|---|
| I. Body economy | 22 | 2 | 7 | 14 |
| II. Integrity, health, death | 21 | 2 | 4 | 23 |
| III. Sleep and rhythms | 15 | 2 | 4 | 4 |
| IV. Body plan, motion, morphology | 8 | 2 | 8 | 27 |
| V. Senses | 20 | 4 | 12 | 14 |
| VI. Nervous system | 22 | 4 | 20 | 4 |
| VII. Mind and cognition | 33 | 0 | 26 | 16 |
| VIII. Affect | 30 | 3 | 2 | 5 |
| IX. Life cycle and heredity | 13 | 2 | 10 | 20 |
| X. Social and ecological life | 6 | 4 | 5 | 30 |
| XI. Alien and integrative | 12 | 2 | 8 | 8 |
## I. Body economy

### 1. Metabolism
````

### Excerpt: `NOVEL-100.md` header
````markdown
# NOVEL-100 (v3): 100 novel A-Life capabilities, plus Foundations

Rule (Alex, 2026-10-31): the main list holds only capabilities that no A-Life creature online was found to have. Rows that exist elsewhere (DONE-ELSEWHERE) or only combine existing capabilities (NOVEL-COMBO) are not deleted. They move to **Foundations (still build, not novel)**, keeping their status, evidence, grade-A criteria and prior-art citations.

**What "novel" means here:** not found in quick cluster searches on 2026-10-31 (Q1–Q15 below). It is not proof (R-016). Every pass still needs d≥0.8 and t≥2.75 vs every control on seeds 1000–1015 on the organism or dome; a harness pass counts as partial.

**Watch:** Cosmogonic Quantum Mechalogodrom (a browser A-Life project with a 5-qubit statevector and Tsotchke math) overlaps 001's stack. Re-check any quantum row against it before claiming novelty.

**Counts:** Main list 100 NOVEL (done 0, partial 2, not started 98). Foundations 99: the old 100 minus #49, which moved to the main list as N09. Foundations status is unchanged from v2: done 7, partial 38, not started 54 (#49 was not started).

Search clusters: Q1 simulation/substrate awareness · Q2 self-lesion/self-edit · Q3 quantum/Berry/QGT A-Life · Q4 snapshots/forks · Q5 experimenter/physics-dial detection · Q6 dreams→heredity/dream agents · Q9 lineage hashes · Q10 energy ledgers · Q11 quantum randomness in creatures · Q12 curvature metacognition · Q13 felt time · Q14 hive/social/culture · Q15 skill/weight trading, self-medication, grief. Found and excluded: self-medication (Wildcode v0.8), grief after deaths (Samskriti), entangled lineages (IBM quantum A-life), test-environment detection (Avida), shared workspace hive (Zeta Life, The Hive), runtime self-programming (unit, Tierra).

## Top 20 for v4.0 (both sections, labelled)

| Rank | Section | Row | Capability | Gaps targeted |
|---|---|---|---|---|
| 1 | Main | N09 | Thought-curvature metacognition | HOT-3, HOT-2 |
| 2 | Main | N11 | Self-surgery with the lab's own lesion tool | HOT-3, AE-1 |
| 3 | Main | N13 | Free won't | AE-1, HOT-3 |
| 4 | Main | N17 | Self-preregistration | HOT-3, CQM10 |
| 5 | Main | N45 | REM uncertainty maps | activeInference, AE-1, thaler9 |
| 6 | Main | N41 | Dream-seeded germline | thaler9, CQM01, CQM02 |
| 7 | Main | N85 | Pre-symptomatic self-diagnosis | CQM16, CQM18 |
| 8 | Main | N91 | Energy futures | CQM10 |
| 9 | Foundations | F06 | Active dendrites as coincidence gates (replaces FlyWire subgraph import) | see v2 ranking |
````

### Excerpt: `/workspace/freak-100.md` (first 60 lines)
````markdown
# FREAK-100: weird and fringe architecture ideas for creature 001 (2026-11-01)
Each line gives the name, the core mechanism, a source with its confidence, and the failing test it could help.
Source confidence: [H] = well-known published work, citation checked from memory against standard references; [M] = published, but the exact venue or year is uncertain; [L] = fringe, speculative or preprint; [A] = Alex's or Tsotchke's own work (allowed for use).
Failing tests: RPT2R, AINF, CQM10 (C10), C03R, CQM04 (C04), UAL-at-scale, HOT3RM.
Concepts only. No other A-Life project's code or mechanics is used.

## A. Binding and conjunction (multiplicative or nonlinear mixing)
1. Sparse expansion layer (granule-like): random fan-out from the relay plus a k-WTA threshold, so XOR becomes linearly separable. Source: Litwin-Kumar et al. 2017, Neuron [H]; Marr 1969 [H]. Helps: RPT2R.
2. Vector-symbolic binding (MAP): elementwise product of bipolar codes for each module, injected into cortex. Source: Gayler 2003 [M]; Kanerva 2009, Cogn Comput [H]. Helps: RPT2R.
3. Holographic reduced representations: circular-convolution binding. Source: Plate 1995, IEEE TNN [H]. Helps: RPT2R.
4. Gamma-phase binding: cues that fire in the same gamma cycle bind, read out as phase-locked rate. Source: Singer & Gray 1995 [H]; von der Malsburg 1981 [H]. Helps: RPT2R.
5. Theta-gamma nested code: items held in gamma subcycles inside theta. Source: Lisman & Jensen 2013, Neuron [H]. Helps: RPT2R, AINF.
6. Shunting-inhibition XOR: divisive inhibition that is non-monotonic in its input. Source: Koch & Poggio 1992 [M]. Helps: RPT2R.
7. Single-neuron XOR via dendritic calcium action potentials (dCaAP), which peak at threshold and fall beyond it. Source: Gidon et al. 2020, Science [H]. Helps: RPT2R.
8. Gain-field multiplicative units: one input scales another's tuning. Source: Salinas & Abbott 1996 [M]; Andersen 1985 [H]. Helps: RPT2R.
9. Sigma-pi dendritic clusters: products of synapse clusters. Source: Mel 1992 [M]; Poirazi, Brannon & Mel 2003, Neuron [H]. Helps: RPT2R.
10. Randomly connected mixed-selectivity cells. Source: Rigotti et al. 2013, Nature [H]; Barak et al. 2013 [M]. Helps: RPT2R.
11. Tensor-product binding. Source: Smolensky 1990, AI [H]. Helps: RPT2R.
12. Conjunctive hippocampal (CA3) codes for cue pairs. Source: O'Reilly & Rudy 2001 [M]. Helps: RPT2R, CQM12.
13. Burst multiplexing: the event rate codes the basal input and the burst fraction codes the apical input. Source: Naud & Sprekeler 2018, PNAS [H]. Helps: RPT2R, HOT3RM.

## B. Temporal and analog coding beyond 7 rate levels
14. Spiking neural networks with time-to-first-spike codes. Source: Thorpe et al. 2001 [H]; Maass 1997 (third generation) [H]. Helps: RPT2R.
15. sLTC neurons, Alex's term, read in the repo as Spiking Liquid Time-Constant neurons, where tau depends on conductance. Source: Vanhalle & Gielen, ICECS 2025, as cited in preregistrations/v3.3.md [M]; Hasani et al. 2021, AAAI (LTC) [H]. Helps: RPT2R, HOT3RM.
16. More sub-steps per tick, giving finer rate levels (SUB 6 to 24). Source: engineering, no citation [-]. Helps: RPT2R.
17. Population rate with dithering noise: stochastic resonance breaks the quantisation. Source: McDonnell & Abbott 2009, PLoS CB [H]. Helps: RPT2R.
18. Readout from membrane voltage (subthreshold analog) rather than spikes. Source: Carandini & Ferster 2000 [M]. Helps: RPT2R.
19. Liquid state machine as a reservoir with a plastic readout. Source: Maass, Natschläger & Markram 2002 [H]. Helps: RPT2R.
20. Echo-state reservoir with a FORCE-trained readout. Source: Jaeger 2001 [H]; Sussillo & Abbott 2009, Neuron [H]. Helps: RPT2R, UAL.
21. Polychronous groups: time-locked spike patterns. Source: Izhikevich 2006, Neural Comp [H]. Helps: RPT2R.
22. Resonate-and-fire neurons that are frequency selective. Source: Izhikevich 2001 [H]. Helps: RPT2R.

## C. Predictive coding, precision, active inference
23. Predictive-coding hierarchy with precision-weighted errors. Source: Rao & Ballard 1999 [H]; Friston 2005 [H]. Helps: HOT3RM, AINF.
24. Precision as metacognitive confidence, read for opt-out. Source: Fleming & Daw 2017, Psych Rev [H]. Helps: HOT3RM.
25. Interoceptive active inference: hunger as predicted interoceptive error. Source: Seth 2013, TiCS [H]; Barrett & Simmons 2015 [H]. Helps: CQM10.
26. Expected free-energy site choice. Source: Friston et al. 2015 [H]. Helps: AINF (per the B23 map, raw reward is blind to it).
27. Dendritic prediction errors: apical minus basal. Source: Sacramento et al. 2018, NeurIPS [H]. Helps: RPT2R.
28. Time-to-collision of a glucose forecast (anticipatory drive). Source: Sterling 2012, allostasis [H]. Helps: CQM10.
29. Learned precision on the drive channel: confidence in the interoceptive forecast gates feeding. Source: Ainley et al. 2016 [M]. Helps: CQM10.

## D. Homeostatic control (body)
30. Integral feedback on glucose error, so there is zero steady-state error. Source: Yi, Huang, Simon & Doyle 2000, PNAS [H]. Helps: CQM10.
31. Antithetic integral motif: two molecules annihilate each other. Source: Briat, Gupta & Khammash 2016, Cell Systems [H]. Helps: CQM10.
32. Satiation cascade: gut stretch, then CCK, then GLP-1 over three timescales. Source: Cummings & Overduin 2007 [M]. Helps: CQM10.
33. Rheostasis: the set-point itself drifts with season or circadian phase. Source: Mrosovsky 1990 [H]. Helps: CQM10, CQM04.
34. Body-plan plasticity: organ allocation follows the load placed on it (Baldwin effect). Source: Hinton & Nowlan 1987 [H]. Helps: CQM04.
35. Hormesis gene expression: stress-driven slow gene-expression state. Source: Calabrese 2008 [M]. Helps: CQM04.
36. Allostatic load accumulator. Source: McEwen 1998, NEJM [H]. Helps: CQM04, CQM10.
37. Brown-fat thermogenic buffer: burns excess glucose to clip highs. Source: Cannon & Nedergaard 2004 [H]. Helps: CQM10.
38. Glycogen buffer with astrocyte-lactate shuttle. Source: Pellerin & Magistretti 1994, PNAS [H]. Helps: CQM10.

## E. Glia, slow gating, neuromodulation
39. Astrocyte slow calcium gate on plasticity. Source: Araque et al. 1999 tripartite synapse [H]. Helps: UAL, HOT3RM.
40. Astrocyte network as a working-memory integrator. Source: De Pittà, Brunel & Volterra 2016 [M]. Helps: HOT3RM.
41. Neuromodulator-gated mixture of brains: DA, NE and ACh select expert subnetworks. Source: Doya 2002, Neural Networks [H]; Jacobs et al. 1991 MoE [H]. Helps: UAL, AINF.
42. LC adaptive gain, switching between exploit and explore modes. Source: Aston-Jones & Cohen 2005 [H]. Helps: AINF.
43. ACh/NE expected vs unexpected uncertainty. Source: Yu & Dayan 2005 [H]. Already present.
44. Serotonin patience / discount control. Source: Miyazaki et al. 2014 [M]. Helps: CQM10.
45. Neuropeptide broadcast as a volume-transmitted slow "mood bus". Source: Bargmann 2012, BioEssays [H]. Helps: CQM10.
````

### Snapshot: git + /tmp/scp at 13:30 PHT
````text
cb680f0 SC-PORT progress (424 json)
bc6ad6a Specialist code (AE2 ae2/ae2K, RPT2R rp2, HOT3 scCF/scCL/scCH, confDev): all flag-gated, default off
521b985 SC-PORT Combo A prereg DRAFT (awaiting Alex approval; no test seeds run)
c6500c7 SC-PORT progress (384 json)
c66fa1f SC-PORT.md final numbers
ce1bf2d HOT3 st06-08, CQM10 README/v01K0.5, status/queue update (dev seeds)
be8ba3a SC-PORT progress (327 json)
d3c066a SC-PORT: combo verdict, HOT3 self-train st01-05, CQM10 specialist v01-v10/h11-13 (dev seeds)
8b2f715 SC-PORT progress (294 json)
ed476b8 SC-PORT progress (289 json)
afa5706 SC-PORT progress (284 json)
45deba8 SC-PORT progress (273 json)
 M creatures/001/preregistrations/SC-PORT.md
 M creatures/001/preregistrations/v4.0.md
 M creatures/001/results/b28/c14_v60_3945/viab.json
 M creatures/001/results/b28/recheck_3945_v57b_v60.md
 M creatures/001/results/b28/recheck_3945_v60_v61.md
 M creatures/001/results/b29/c15_v62_3961/viab.json
 M creatures/001/results/b29/screen_3961_v57b_v62.md
 M creatures/001/results/b29/screen_3961_v61_v62.md
?? creatures/001/HANDOFF-GEMINI-ARGON4.md
?? creatures/001/specialists/AE2/v01/
?? creatures/001/specialists/AE2/v02/
?? creatures/001/specialists/AE2/v03/
?? creatures/001/specialists/AE2/v04/
?? creatures/001/specialists/AE2/v05/
?? creatures/001/specialists/AE2/v06/
?? creatures/001/specialists/AE2/v07/
?? creatures/001/specialists/AE2/v08/
?? creatures/001/specialists/AE2/v09/
?? creatures/001/specialists/AE2/v10/
?? creatures/001/specialists/HOT3RM/st09/
?? creatures/001/specialists/HOT3RM/st10/
?? creatures/001/specialists/RPT2R/v01/
?? creatures/001/specialists/RPT2R/v02/
?? creatures/001/specialists/RPT2R/v03/
?? creatures/001/specialists/RPT2R/v04/
?? creatures/001/specialists/RPT2R/v05/
?? creatures/001/specialists/RPT2R/v06/
?? creatures/001/specialists/RPT2R/v07/
?? creatures/001/specialists/RPT2R/v08/
?? creatures/001/specialists/RPT2R/v09/
?? creatures/001/specialists/RPT2R/v10/
47 /tmp/scp/jobs_p5.txt
/tmp/scp/ai.done
/tmp/scp/c10b.done
/tmp/scp/c10d.done
/tmp/scp/combo.done
/tmp/scp/h3.done
/tmp/scp/h3b.done
/tmp/scp/h3port.done
/tmp/scp/p1.done
/tmp/scp/p2.done
/tmp/scp/p3.done
/tmp/scp/s1.done
/tmp/scp/st.done
/tmp/scp/st2.done
/tmp/scp/st3.done
/tmp/scp/st4.done
/tmp/scp/st5.done
````
