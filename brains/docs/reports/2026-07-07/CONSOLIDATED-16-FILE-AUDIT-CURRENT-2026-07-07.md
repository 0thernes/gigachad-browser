# Consolidated 16-File Currentness Audit

**Date:** 2026-07-07  
**Scope:** the 16 reports and HTML files named by the user  
**Workspace:** `Z:\[Vibe Coded (AI)]\CLAUDECODE\Cosmogonic Quantum Mechalogodrom`  
**Companion synthesis:** `docs/CONSOLIDATED-16-MASTER-ASSESSMENT-CURRENT-2026-07-07.md`  
**Browser view:** `docs/CONSOLIDATED-16-MASTER-ASSESSMENT-CURRENT-2026-07-07.html`

---

## 0. Bottom Line

The 16-file fleet is valuable, but it is not all equally current.

**Most accurate current spine:**

1. `BRAIN-NEUROLOGY-CONSCIOUSNESS-ENGINEERING-ASSESSMENT-2026-07-06.md`
   for deep source-backed substance.
2. `MEGA-MASTER-BRAIN-NEUROLOGY-CONSCIOUSNESS-SENTIENCE-FINAL-HURRAH-2026-07-07.md`
   for the best narrative capstone.
3. `MEGA-MASTER-BRAIN-NEUROLOGY-CONSCIOUSNESS-SENTIENCE-PASS2-2026-07-06.md`
   for evidence, falsifiers, and publication method.
4. `MEGA-MASTER-BRAIN-NEUROLOGY-CONSCIOUSNESS-SENTIENCE-PASS3-2026-07-06.md`
   for whole-world entity coverage.
5. `MEGA-ULTRATHINK-REPORT-AUDIT-REVIEW-2026-07-07.md` and `.html`
   for the previous consolidated audit.

**Most stale or risky files:**

1. `SUPER-REPORT-OMNISCIENT-OMNICOGNITIVE-ULTIMATE-2026-07-07.html`
   because it has malformed HTML.
2. `SUPER-REPORT-ULTIMATE-MEGA-2026-07-06.md` because it overstates
   Planck/Nobel/Turing readiness.
3. `SUPER-REPORT-3RD-PASS-2026-07-06.md` because it uses literal
   "complete omniscient" language and contains stale counts.
4. `SUPER-REPORT-2ND-PASS-2026-07-06.md` because it still contains the
   `super-mith.ts` path typo.
5. `MASTER-ASSESSMENT-2026-07-07.md` / `.html` are outside the 16-file request
   but present in the worktree; they should not be promoted because they still
   say 2,360 tests and repeat overclaim wording.

---

## 1. Current Gate Reality

These commands were rerun against the live dirty checkout:

| Check                     | Result               | Current Interpretation                                                                                      |
| ------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `bun run typecheck`       | passed               | TypeScript source currently typechecks.                                                                     |
| `bun run lint`            | passed               | Source/tests/scripts lint currently pass.                                                                   |
| `bun run sync:check`      | passed               | Sync-managed canonical surfaces match `v0.21.7`, 2,360-test portable floor, and 84.64/82.21 coverage floor. |
| `bun run verify:receipts` | passed               | Live receipt is now **2,373 pass / 0 fail / 2,866,547 expect calls / 92.02% line / 89.65% function**.       |
| `bun run verify:facts`    | exit 0 with warnings | 9 potential drifts remain, all in `BRAIN-NEUROLOGY...ASSESSMENT`.                                           |
| 16-file Prettier check    | failed               | Several older markdowns are style-stale; one existing HTML file has malformed markup.                       |
| `bun run build`           | failed               | Bun fails on `src/styles/app.css:0` with "Arguments contain a value that is out of range of code points."   |

Correct current statement:

> The code/test gates are materially strong, but the report fleet is not
> publication-clean. Typecheck, lint, sync, and receipts pass. Full build fails.
> Formatting and fact warnings remain in documentation. Therefore no file should
> claim the whole repo is fully green today.

---

## 2. File Inventory

|   # | File                                         | Lines |  Words |   Bytes | Currentness                                            |
| --: | -------------------------------------------- | ----: | -----: | ------: | ------------------------------------------------------ |
|   1 | `VERIFICATION-ANALYTICAL-DATA.md`            |   521 |  5,957 |  53,214 | relevant but receipt counts are no longer latest       |
|   2 | `MEGA-MASTER...FINAL-HURRAH-2026-07-07.md`   |   545 |  4,647 |  44,492 | best narrative capstone, mostly current                |
|   3 | `NHSI-PROGRESS-DASHBOARD-2026-06-26.md`      |   218 |  3,313 |  33,345 | relevant dashboard, rhetorical and floor-based         |
|   4 | `SUPER-REPORT-ULTIMATE-MEGA-2026-07-06.md`   |   231 |  2,296 |  15,996 | useful coverage, overclaim-prone                       |
|   5 | `MEGA-MASTER...PASS3-2026-07-06.md`          |   707 |  5,752 |  57,986 | best world/entity coverage                             |
|   6 | `SUPER-REPORT-3RD-PASS-2026-07-06.md`        |   745 |  4,421 |  31,274 | broad but stale/overclaim-prone                        |
|   7 | `SUPER-REPORT-2ND-PASS-2026-07-06.md`        |   353 |  2,484 |  19,607 | secondary, contains `super-mith.ts` typo               |
|   8 | `MEGA-MASTER...PASS2-2026-07-06.md`          |   536 |  4,527 |  45,629 | best falsifier/evidence method                         |
|   9 | `SUPER-REPORT-2026-07-06.md`                 |   252 |  1,997 |  15,420 | early useful summary, now superseded                   |
|  10 | `MEGA-MASTER...PASS1-2026-07-06.md`          |   565 |  5,048 |  47,670 | good historical foundation                             |
|  11 | `CONTROLS-2026-06-26.md`                     |   116 |  1,043 |   8,408 | current for UI controls only                           |
|  12 | `MEGA-ULTRATHINK...2026-07-07.html`          |   787 |  1,724 |  22,433 | good current browser audit, slightly stale on receipts |
|  13 | `MEGA-ULTRATHINK...2026-07-07.md`            | 1,037 |  6,396 |  57,423 | best previous audit, superseded by this pass           |
|  14 | `BRAIN-NEUROLOGY...ASSESSMENT-2026-07-06.md` | 2,485 | 40,301 | 286,163 | deepest source, but has formatting/fact warnings       |
|  15 | `SUPER-REPORT-OMNISCIENT...2026-07-07.html`  | 1,009 |  4,009 |  56,450 | do not use; malformed HTML                             |
|  16 | `SUPER-REPORT-OMNISCIENT...2026-07-07.md`    | 1,032 |  7,404 |  53,158 | wide draft, overclaim-prone                            |

---

## 3. Trust Tiers

### Tier 1: Use as Current Canonical Inputs

| File                            | Use For                                                                                 | Caveat                                           |
| ------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `BRAIN-NEUROLOGY...ASSESSMENT`  | deepest brain/neuro/consciousness substance                                             | needs formatting cleanup and fact-warning triage |
| `FINAL-HURRAH`                  | final narrative stance and plain-English verdict                                        | line/count details can drift                     |
| `PASS2`                         | claim-to-code-to-test-to-falsifier method                                               | not whole-world complete                         |
| `PASS3`                         | Shoggoths, Puppeteers, Titans, GOD, Temple, plants/flora/fauna, world-neurology closure | must be tied back to evidence spine              |
| `MEGA-ULTRATHINK` markdown/html | previous consolidation and audit posture                                                | receipt count moved from 2,370 to 2,373          |

### Tier 2: Use as Context, Not Canon

| File                           | Use For                                              | Caveat                                         |
| ------------------------------ | ---------------------------------------------------- | ---------------------------------------------- |
| `VERIFICATION-ANALYTICAL-DATA` | canonical receipt floor and verification doctrine    | live receipt now 2,373 tests, not 2,360 latest |
| `NHSI-PROGRESS-DASHBOARD`      | Tsotchke, NHSI, Archons, faculties, Butlin dashboard | stylized language must be translated soberly   |
| `PASS1`                        | original consolidation lineage                       | superseded by later passes                     |
| `SUPER-REPORT-2026-07-06`      | early comparative summary                            | formatting stale and superseded                |
| `CONTROLS`                     | UI controls and deterministic operator interface     | not scientific controls                        |

### Tier 3: Mine for Coverage Only

| File                             | Use For                       | Do Not Use For                           |
| -------------------------------- | ----------------------------- | ---------------------------------------- |
| `SUPER-REPORT-2ND-PASS`          | compact second-pass inventory | exact path authority due `super-mith.ts` |
| `SUPER-REPORT-3RD-PASS`          | broad named-entity list       | literal "complete omniscient" claims     |
| `SUPER-REPORT-ULTIMATE-MEGA`     | scoring/matrix seed           | Planck/Nobel/Turing readiness            |
| `SUPER-REPORT-OMNISCIENT...md`   | broad weird-ideas coverage    | final truth or academic readiness        |
| `SUPER-REPORT-OMNISCIENT...html` | do not promote                | browser publication; markup is malformed |

---

## 4. Specific Currentness Problems

### 4.1 Verification and Receipt Drift

Several reports still say the latest local receipt is around:

- 2,360 tests,
- 2,866,429 expect calls,
- 84.64% line / 82.21% function as if it is the current live run.

Correct current interpretation:

- **2,360 / 84.64 / 82.21** is the portable canonical floor.
- The current observed receipt run is **2,373 / 2,866,547 / 92.02 / 89.65**.
- Both can be true if the report distinguishes floor from latest local run.

### 4.2 Format and HTML Validity Drift

The 16-file Prettier check reported style drift in:

- `SUPER-REPORT-ULTIMATE-MEGA-2026-07-06.md`
- `SUPER-REPORT-3RD-PASS-2026-07-06.md`
- `SUPER-REPORT-2ND-PASS-2026-07-06.md`
- `SUPER-REPORT-2026-07-06.md`
- `BRAIN-NEUROLOGY-CONSCIOUSNESS-ENGINEERING-ASSESSMENT-2026-07-06.md`
- `SUPER-REPORT-OMNISCIENT-OMNICOGNITIVE-ULTIMATE-2026-07-07.md`

It also found a fatal malformed tag in:

- `SUPER-REPORT-OMNISCIENT-OMNICOGNITIVE-ULTIMATE-2026-07-07.html`

Specific HTML issue:

```html
<h4>Build Paths:</h3>
```

Correct form:

```html
<h4>Build Paths:</h4>
```

### 4.3 Build Failure

`bun run build` currently fails after generators run:

```text
error: Arguments contain a value that is out of range of code points
    at src/styles/app.css:0
```

This is not caused by the 16-file report consolidation, but it blocks any claim
that the current checkout is fully build-green.

### 4.4 Fact-Audit Warnings

`verify:facts` reports 9 potential drifts, all in
`BRAIN-NEUROLOGY-CONSCIOUSNESS-ENGINEERING-ASSESSMENT-2026-07-06.md`.

They are mostly around:

- `0/14` and `14/14` adjacency in Butlin explanations,
- `100/144 faculties` wording,
- other numeric patterns the fact script treats conservatively.

This does not make the brain assessment worthless. It means it is the deepest
source and also the file most in need of careful final copyedit.

### 4.5 Count and Path Drift

Current source facts:

| Source Fact                         |   Current Value |
| ----------------------------------- | --------------: |
| `src/sim/super-mind.ts`             |     1,928 lines |
| `src/sim/apex-brain.ts`             |     2,110 lines |
| `src/sim/consciousness-kernel.ts`   |       870 lines |
| `src/sim/titans.ts`                 |     1,547 lines |
| `TITAN_COUNT`                       |              20 |
| `PANTHEON_SIZE`                     |              25 |
| `APEX_INDIVIDUATED`                 |               5 |
| Sentience feed `claim`              | `indicatorOnly` |
| Sentience feed `meanNullGap`        |               0 |
| Sentience feed `meanConvergenceGap` |        0.062741 |
| Sentience feed `meanRewardGap`      |        0.111229 |

Current stale/risky claims:

- `SUPER-REPORT-2ND-PASS` says `src/sim/super-mith.ts`; correct is
  `src/sim/super-mind.ts`.
- Some surfaces still mention 10 Titans; current source creates 20 Titans.
- Some current summaries say "2,360 tests" without saying it is the floor.
- Some master drafts call the system "complete omniscient omnicognitive"; keep
  that as user-style rhetoric only, not a scientific statement.

---

## 5. File-by-File Verdict

### 5.1 `VERIFICATION-ANALYTICAL-DATA.md`

**Verdict:** relevant but stale as "latest."

Keep it as the source for:

- canonical floor,
- verification doctrine,
- fact/sync language,
- historical receipt baseline.

Do not treat it as current latest receipt without updating:

- live receipt is now 2,373 pass,
- build currently fails,
- fact warnings remain.

### 5.2 `FINAL-HURRAH`

**Verdict:** still one of the best human-readable master reports.

Keep:

- "not sentient, not fake" posture,
- all major world systems coverage,
- academic benchmark humility,
- final verdict language.

Update before publication:

- current receipt count,
- any source line count details,
- build/gate status.

### 5.3 `NHSI-PROGRESS-DASHBOARD`

**Verdict:** relevant dashboard, not final academic prose.

Keep:

- Tsotchke classification,
- 25 Archons,
- 100 faculties / about 30 deep-wired distinction,
- 8 met and 6 partial Butlin doctrine,
- final report links.

Translate:

- "BRUTAL GOD TIER" and manifesto language into sober terms for papers.

### 5.4 `SUPER-REPORT-ULTIMATE-MEGA`

**Verdict:** useful as a hype/inventory draft only.

Keep:

- matrix idea,
- broad category reminders,
- weird/future build themes.

Do not keep:

- Planck/Nobel/Turing checkmark inflation,
- literal "complete omniscient omnicognitive",
- roadmap claims without budget/benchmarks.

### 5.5 `PASS3`

**Verdict:** strong whole-world inventory source.

Keep:

- Shoggoths,
- Puppeteers/Puppet Masters,
- Titans,
- flora/fauna/wildlife,
- GOD/GodColossus,
- Temple,
- Pantheons,
- Apex Abomination / SuperCreature coverage.

Add:

- evidence spine from Pass 2,
- current source counts,
- browser-surface validation.

### 5.6 `SUPER-REPORT-3RD-PASS`

**Verdict:** broad but not canonical.

Keep:

- named entity coverage.

Demote:

- "No system is omitted",
- "complete omniscient inventory",
- stale line counts,
- final overclaim sentence.

### 5.7 `SUPER-REPORT-2ND-PASS`

**Verdict:** secondary and stale.

Keep:

- concise second-pass structure.

Fix before citing:

- `super-mith.ts` typo,
- formatting,
- current gate wording.

### 5.8 `PASS2`

**Verdict:** methodologically strongest pass.

Keep:

- claim -> code -> test -> falsifier,
- benchmark-card idea,
- null-control honesty,
- Tsotchke ablation path.

Needs:

- folded into current gate numbers.

### 5.9 `SUPER-REPORT-2026-07-06`

**Verdict:** early summary, superseded.

Keep:

- historical comparison and initial grades.

Do not use as current:

- latest receipt,
- final canonical report.

### 5.10 `PASS1`

**Verdict:** good historical foundation.

Keep:

- first consolidation lineage,
- source-reconciliation framing.

Superseded by:

- Pass 2,
- Pass 3,
- Final Hurrah,
- Mega Ultrathink,
- this current audit.

### 5.11 `CONTROLS`

**Verdict:** current for UI controls only.

Use for:

- keyboard/mouse/touch/control mapping,
- deterministic operator interactions.

Do not use for:

- scientific controls,
- null controls,
- consciousness validation.

### 5.12 `MEGA-ULTRATHINK HTML`

**Verdict:** good browser artifact, superseded by current receipt pass.

Keep:

- truth boundary,
- audit structure,
- direct browser readability.

Update:

- receipt count,
- new finding that the Omni HTML has malformed markup,
- current build failure.

### 5.13 `MEGA-ULTRATHINK Markdown`

**Verdict:** strongest previous audit.

Keep:

- critic synthesis,
- tiering,
- corrected academic stance,
- "measure the gods" final doctrine.

Superseded by:

- `CONSOLIDATED-16-MASTER-ASSESSMENT-CURRENT-2026-07-07.md`.

### 5.14 `BRAIN-NEUROLOGY...ASSESSMENT`

**Verdict:** deepest source, but needs cleanup.

Keep:

- 2,485-line depth,
- source-backed neuroscience/consciousness assessment,
- honesty boundary,
- adversarial ledger,
- paper path.

Fix:

- Prettier formatting,
- 9 fact-warning sites,
- any current receipt wording.

### 5.15 `SUPER-REPORT-OMNISCIENT...html`

**Verdict:** do not use as browser canonical.

Reason:

- malformed closing tag,
- overclaim language,
- stale floor-based receipts.

### 5.16 `SUPER-REPORT-OMNISCIENT...md`

**Verdict:** wide draft, not canonical.

Keep:

- broad coverage,
- reasoning systems,
- scoring systems,
- weird ideas list.

Demote:

- literal omniscience,
- overstrong Planck/Nobel/Turing statements,
- "complete all 14" phrasing without promotion protocol.

---

## 6. The Accurate Current Composite

The most accurate current reading of all 16 is:

> Cosmogonic Quantum Mechalogodrom v0.21.7 is a deterministic Bun/TypeScript/WebGL
> artificial-life and consciousness-indicator platform. It has a strong test
> culture, broad multi-layer cognition architecture, real Tsotchke substrate
> wiring, and a rich world inventory spanning SuperMind, ApexBrain, EntityBrain,
> GlyphBrain, MechalogodromBrain, ConsciousnessKernel, TsotchkeBrainIntake,
> Shoggoths, Puppet Masters, Titans, SuperCreatures, Archons, GOD/GodColossus,
> Temple, flora, fauna, and ecology systems. It is not sentient. It is not a
> solved hard-problem artifact. Its strongest scientific path is a falsifiable
> methods paper with ablations, null controls, real-connectome experiments, and
> external replication.

Current scoring:

| Axis                            |    Score | Current Basis                                               |
| ------------------------------- | -------: | ----------------------------------------------------------- |
| Engineering/source depth        | 8.8 / 10 | typecheck/lint/receipts pass, many systems in source        |
| Report fleet coherence          | 6.8 / 10 | strong convergence but many stale drafts                    |
| Scientific defensibility        | 6.6 / 10 | indicator-only posture works; controls need more            |
| Browser/public report readiness | 6.4 / 10 | new HTMLs exist, but one old HTML malformed and build fails |
| Sentience proof                 | 0.0 / 10 | explicitly absent                                           |
| Publication readiness           | 6.5 / 10 | credible methods seed, not clean paper yet                  |

---

## 7. Consolidation Recommendation

Promote these:

1. `CONSOLIDATED-16-MASTER-ASSESSMENT-CURRENT-2026-07-07.md`
2. `CONSOLIDATED-16-MASTER-ASSESSMENT-CURRENT-2026-07-07.html`
3. `CONSOLIDATED-16-FILE-AUDIT-CURRENT-2026-07-07.md`
4. `BRAIN-NEUROLOGY...ASSESSMENT` after formatting/fact cleanup
5. `FINAL-HURRAH` after receipt refresh

Archive or mark historical:

- `SUPER-REPORT-2026-07-06.md`
- `SUPER-REPORT-2ND-PASS-2026-07-06.md`
- `SUPER-REPORT-3RD-PASS-2026-07-06.md`
- `SUPER-REPORT-ULTIMATE-MEGA-2026-07-06.md`
- `SUPER-REPORT-OMNISCIENT...md`
- `SUPER-REPORT-OMNISCIENT...html`
- stale `MASTER-ASSESSMENT-2026-07-07.*` files already present in the worktree

Do not delete anything automatically. The existing reports are useful historical
evidence; they just should not be treated as the current court of record.
