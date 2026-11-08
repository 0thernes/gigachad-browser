# OFFICIAL Round 21 preregistration (FROZEN)

**Status: FROZEN, 2026-11-01 ~09:58 PT, approved by Alex Donahue.** Committed before any test-seed run. Nothing below may change after a test result is seen. Previous official scores (Round 20, v3.9, seeds 1016-1063): Butlin 9/14, frameworks 7/10, CQM 17/25.

## 1. Arms, versions and commits
| Arm | Role | Version | Source (pinned) | Env |
|---|---|---|---|---|
| A | primary | v5.7b = v5.7 + aomV 0, EFM kept (B25) | branch v4.0, commit 9e4ff04 (built from `git archive`) | `ORG_V5=11 ORG_MIND=v40 V40TUNE='{}'` |
| D | second preregistered arm | v5.7d = v5.7b + vsa 10 + vrpe 0.05 (B30/B31) | branch wild-arch, commit 4bc5c03 (built from `git archive`) | `ORG_V5=16 ORG_MIND=v40 V40TUNE='{}'` |
- The v5.7d flag was NOT ported into the v4.0 tree: in v4.0, ORG_V5=15 is already v6.2 and the V6-S1 code edits the same lines (step order, hunger, RPE update) and uses the same field name `hubH`, so a port is not clean. Arm D runs from the pinned wild-arch commit.
- Builds: `bun build creatures/001/organism/run_v39.ts` and `viability_v39.ts` from each archive -> /tmp/r21/run_{v40,wild}.js, /tmp/r21/via_{v40,wild}.js.
- Pre-run checks (disclosed; dev seeds only, never test seeds): seed 5000 C24 smoke (v4.0 build); seed 5001 HOT1 at ORG_V5=11 is byte-identical between the two builds (arm D's base equals arm A).
- B31's full dev suite for v5.7d (dev 4461-4492) was still running at freeze. Its result does not change this plan.

## 2. Seeds
- **Test seeds 1064-1111 (n = 48)**, both arms, every test. Never used by any earlier round or dev run (1016-1063 retired after R20).
- **AE1 is scored pooled over all 48 test seeds** (meets the >= 48-seed rule).
- Viability: steady 1064-1069 (12 days), starve and refeed 1064-1111 (as R20).

## 3. Pass rule (per item)
- **PASS:** d >= 0.8 AND Welch t >= 2.75 against **every** control listed, plus the non-ceiling rule (bounded metric with full-arm mean > 0.95·max fails).
- **PARTIAL:** the item does not pass, but either (a) it passes the rule against at least one of its controls but not all, or (b) the original fails while its disclosed R variant passes (section 5).
- **FAIL:** otherwise.
- Totals count PASS only. Partials are listed separately.

## 4. Tests and controls (all items, scored by summarize_v39 rules, unchanged from R20)
Keys run (each on 48 seeds, both arms): AE1 AE2 AINF ASO AST1 C01R C03R C05 C06 C07 C08 C08R C09 C10 C11 C14 C15 C16 C17 C18 C22 C24 CTM CTMR EVO FIELD GWT1 GWT2 GWT3 GWT3R GWT4 HOT1 HOT2 HOT3 HOT4 IIT INSGLC K1 K1R K2 L1 L2 L3 L4 L5 LIGHT NOISESIGN NOVEL PP1 PROJ RPT1 RPT2 RPTLATE SM SNAP UAL.
- **Butlin 14:** RPT-1 (recurrent CTX lesioned), RPT-2 (cross-module CTX lesioned), GWT-1 (topography scrambled), GWT-2 (workspace lesioned), GWT-3 (broadcast lesioned), GWT-4 (attention not workspace-driven), HOT-1 (top-down lesioned), HOT-2 (confidence shuffled), HOT-3 (no opt-out; random opt-out at same rate), HOT-4 (sensory lines permuted), AST-1 (schema lesioned), PP-1 (predictor lesioned), AE-1 (RPE learning lesioned), AE-2 (forward model lesioned).
- **Frameworks 10:** thaler9 (dreams shuffled), iit4 (recurrent+cross CTX lesioned), activeInference (epistemic term lesioned), attentionSchema (last-observation predictor), fieldIntegration (field coupling lesioned), ual (eligibility traces lesioned), sensorimotor (efference copy lesioned), projective (efference copy lesioned), ctm (broadcast lesioned), butlin14 rollup (passes only if 14/14).
- **CQM 25:** CQM01 (offspring genomes random), 02 (no mutation), 03 (births fixed schedule), 04 (random survival), 05 (leaky ledger), 06 (integration lesion), 07 (plasticity frozen), 08 (replay lesioned), 09 (persistence forecast), 10 (fixed foraging drive), 11 (model-free only), 12 (dreams shuffled), 13 = HOT-2, 14 (signal line cut), 15 (repair lesioned), 16 (allostatic PID lesion), 17 (PID lesioned), 18 (plasticity frozen after lesion), 19 = RPT-1, 20 = GWT-3, 21 = iit4, 22 (aversive learning lesioned), 23 substrate pluralism (not applicable, JS only: FAIL), 24 reproducibility (state hash, tolerance), 25 scale (measured parameters).
- Also reported, outside the three lists: K1/K1R/K2, V3.4-L1..L5, steering/v3.6-v3.9 extras (LIGHT, NOISESIGN, INSGLC, SNAP, RPTLATE) and viability.

## 5. Disclosed R variants (originals are ALWAYS reported and are what the official totals use)
| Original | R variant (key) | Control(s) |
|---|---|---|
| RPT-2 | RPT2R (stimulus held 3 ticks); RPT2RL5 | cross-module lesion; arm D also shuffled pairing (`M50J={"vshuf":1}`) |
| HOT-3 | HOT3RM (MarginConf opt-out); HOT3RM-P (paired by seed, dz >= 0.8 and paired t >= 2.75) | confidence shuffled |
| GWT-3 | GWT3R (degraded stimuli) | broadcast lesioned |
| AE-1 | AE1R (adaptation-window scoring) | RPE learning lesioned |
| projective | PROJR | efference copy lesioned |
| CQM16 | C16R | allostatic lesion |
| CQM18 | CQM18R | plasticity frozen after lesion; afferent-remap lesion |
| CQM08 | C08R | replay lesioned |
| CQM03 | C03R | births random in number |
| CQM01 | C01R | offspring genomes random |
| ctm | CTMR | broadcast lesioned |
| K1 | K1R | as K1 |
Two totals are reported per arm: **official (originals only)** and **with disclosed R variants substituted**. AINFR4 / N09 are not run (no confirmed dev pass).

## 6. NOVEL-100
Status carried unchanged: 0 done, 2 partial. It changes only if a test result in this round is direct evidence for a NOVEL-100 item.

## 7. Execution
- Max 3 concurrent jobs, `nice -n 15`, detached with `setsid`; jobs skip outputs already present, so a restart resumes.
- A self-committing loop copies /tmp/r21/out_* into creatures/001/results/official-r21/ and commits every ~5 min. No push.
- No parameter, metric or control is changed after any test output exists. Any deviation is disclosed in SCORECARD.md.
