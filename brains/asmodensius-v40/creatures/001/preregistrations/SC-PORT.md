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
