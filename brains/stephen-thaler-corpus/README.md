# Stephen L. Thaler — Study & RAG Corpus

**Independent research atlas** of Dr. Stephen Thaler’s work on Creativity Machines,
confabulation, synaptic perturbation, consciousness/sentience models, DABUS, and
related neural invention systems.

Built for **humans + LLM harnesses** the same way Tsotchke is the quantum substrate
corpus and Unresolved Math Problems is the open-math atlas.

| Field | Value |
| --- | --- |
| **Operator** | Alexander Donahue · 0thernes · `0_0@0thernes.art` |
| **Sibling project** | [Cosmogonic Quantum Mechalogodrom](../Cosmogonic%20Quantum%20Mechalogodrom/) |
| **Status** | v0.1.0 scaffold · Thaler-first · other consciousness authors later |
| **Endorsement** | **None claimed** by Dr. Thaler / Imagination Engines |
| **Claim class** | Study notes + operational reimplementation maps only |

> **Law:** This is a **study repo**. Full publisher PDFs are **not** mirrored.
> See [NOTICE.md](./NOTICE.md).

---

## Why this exists

1. **Fascination** — Thaler’s generator/critic + noise + hot-button valence is one of
   the few compact, measurable accounts of ideation/sentience *as mechanism*.
2. **Cosmogonic wiring** — CQM already ships `thaler-sentience.ts`, SuperMind
   imagitron/perceptor, and gedanken-death. This corpus is the **source study layer**
   so agents stop vibing and start citing.
3. **9/9 marker campaign** — hard-wire all nine constitutive markers into the live
   A-life stack (see [docs/NINE-MARKERS.md](./docs/NINE-MARKERS.md)).
4. **Recognition path** — honest technical brief + outreach drafts live in CQM
   `docs/reports/2026-07-12-THALER-*` (may be stashed as `wip-thaler-all`); this
   repo is the **paper bible** behind that package.

---

## Layout (Tsotchke / Math-Atlas pattern)

```
Stephen-Thaler-Corpus/
  README.md                 ← you are here
  NOTICE.md                 ← copyright / non-endorsement
  PHILOSOPHY.md             ← study doctrine
  ARCHITECTURE.md           ← dossier + RAG shape
  data/papers.yaml          ← single source of truth registry
  papers/<slug>/            ← one folder per paper/patent
    README.{md,html}        ← identity card
    SUMMARY.{md,html}       ← executive
    DETAIL.{md,html}        ← deep dive
    GLOSSARY.{md,html}      ← terms
    BIBLE.{md,html}         ← binding claims of the work
    SPEC.{md,html}          ← methods / architecture / params
    INDEX.{md,html}         ← sections + cross-links
    CONNECTIONS.{md,html}   ← Cosmogonic wire map + 9/9 hooks
  rag/                      ← retrieval corpus
  scripts/                  ← scaffold + build
  docs/                     ← meta indexes, 9-marker bible, agenda
```

**8 Markdown + 8 HTML per paper** — always. No orphan MD without HTML twin.

---

## Master index (seed registry)

| # | Slug | Year | Kind | Title (short) |
|---:| --- | ---:| --- | --- |
| 1 | `1995-virtual-input-phenomena` | 1995 | paper | Virtual input phenomena… (*Neural Networks*) |
| 2 | `1997-us5659666-dagui` | 1997 | patent | US 5,659,666 — Device for Autonomous Generation of Useful Information |
| 3 | `1997-seminal-cognition-cm` | 1997 | paper/talk | Quantitative model of seminal cognition (Creativity Machine) |
| 4 | `2008-us7454388-bootstrap` | 2008 | patent | US 7,454,388 — Autonomous bootstrapping of useful information |
| 5 | `2012-cm-withstanding-consciousness` | 2012 | paper | Creativity Machine Paradigm: Withstanding the Argument from Consciousness |
| 6 | `2013-beyond-cliff-of-creativity` | 2013 | paper | Beyond the cliff of creativity (*Medical Hypotheses*) |
| 7 | `2014-synaptic-perturbation-consciousness` | 2014 | paper | Synaptic perturbation and consciousness |
| 8 | `2016-cycles-insanity-creativity` | 2016 | paper | Cycles of insanity and creativity within contemplative neural systems |
| 9 | `2019-us10423875-dabus-line` | 2019 | patent | US 10,423,875 — DABUS-line autonomous invention architecture |
| 10 | `founder-imagination-engines-overview` | n/a | web | Imagination Engines founder / paradigm overview |

More titles (ResearchGate lists **~90** papers + **~25** patents) are stubbed in
`data/papers.yaml` as `status: stub` and get full 8×8 packs as we harvest.

---

## Commands

```bash
# from this repo root
python scripts/scaffold.py          # (re)build paper folders + HTML twins from YAML + seeds
python scripts/build_rag.py         # emit rag/corpus.jsonl for harness retrieval
python scripts/verify.py            # every paper has 8 md + 8 html
```

---

## Relationship to Cosmogonic

| Cosmogonic surface | Role |
| --- | --- |
| `src/sim/thaler-sentience.ts` | Mini CM proof bench (6→6→4) |
| `src/sim/super-mind.ts` | Live imagitron + perceptor |
| `src/sim/gedanken-death.ts` | Death confabulation measurement |
| `lab/consciousness.html` / `sentience.html` | Public labs |
| `docs/reports/2026-07-12-THALER-*` | Wiring map + outreach (CQM) |
| **This repo** | Paper-level RAG / study bible |

---

## Agenda (Thaler-first)

1. ✅ Scaffold corpus + 10 seed dossiers  
2. ☐ Restore CQM Thaler package from `stash@{0}: wip-thaler-all`  
3. ☐ Drive markers from ~7.2/9 → **robust 9/9** without lying (ablations stay honest)  
4. ☐ Expand registry toward full public bibliography  
5. ☐ Later: other consciousness programs (IIT, GNW, FEP, AST, …) as **sibling** corpora  

---

## Quality / compute note (sibling CQM law)

Cosmogonic **must never** lower image/video/render/shader/skin/intelligence quality
for “perf.” See CQM `src/core/quality.ts`:

> lower tiers may carry fewer entities, but they **must not lower visual fidelity**.  
> DPR, shadows, instancing, color/post-FX and simulation cadence stay full-fidelity.

Compute improvements = **workers / pools / hybrid CPU·GPU·NPU·DRAM spread** only —
invisible under the same fidelity. This study repo does not touch CQM graphics.
