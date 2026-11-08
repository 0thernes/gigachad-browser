#!/usr/bin/env python3
"""Materialize papers/<slug>/{8 md + 8 html} from data/papers.yaml + seed bodies."""
from __future__ import annotations

import html
import re
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:
    yaml = None

ROOT = Path(__file__).resolve().parents[1]
PAPERS = ROOT / "papers"
DATA = ROOT / "data" / "papers.yaml"
DOC_TYPES = [
    "README",
    "SUMMARY",
    "DETAIL",
    "GLOSSARY",
    "BIBLE",
    "SPEC",
    "INDEX",
    "CONNECTIONS",
]

# ---------------------------------------------------------------------------
# Seed bodies — operator reconstructions from public sources (not fulltext)
# ---------------------------------------------------------------------------

SEEDS: dict[str, dict[str, str]] = {
    "1995-virtual-input-phenomena": {
        "README": """# Virtual input phenomena within the death of a simple pattern associator

| Field | Value |
| --- | --- |
| **Year** | 1995 |
| **Venue** | *Neural Networks* 8(1):55–65 |
| **Author** | Stephen L. Thaler |
| **DOI** | 10.1016/0893-6080(94)00065-T |
| **Status** | seed |
| **Domains** | neural networks · consciousness correlates · near-death models |
| **Primary markers** | `virtual-input`, `life-review`, `glory` |

Public abstract lineage: systematic damage / pruning of trained nets yields
**phantom outputs** (“virtual inputs”) and ordered replay-like behavior before
novelty — the experimental root of later Creativity Machine lore.
""",
        "SUMMARY": """# Summary

Thaler damages trained pattern associators and observes:

1. **Life-review-like** reactivation of stored experiences as connections die.
2. **Virtual input phenomena** — outputs without a corresponding external cue.
3. Transition into **novel / confabulatory** regimes under further destruction.

Public secondary accounts (e.g. R&D World, IEI founder page) treat this as the
1992–1995 bridge from “near-death of a net” to creative AI.

**Operator takeaway for Cosmogonic:** `gedanken-death.ts` + `virtual-input`
marker must reproduce *damage-ordered* confabulation, not random noise.

**Fulltext:** publisher-gated; reconstruct from abstract + patents + later papers.
""",
        "DETAIL": """# Detail

## Historical placement
Mid-90s neural-network culture; backprop associators are tiny by modern standards.
Thaler’s size class (few inputs/hidden/outputs) is exactly why Cosmogonic’s
`6→6→4` mini-MLP is a **faithful scale**, not a toy metaphor.

## Experimental logic (operator reconstruction)
1. Train an associator on a fixed memory set.
2. Progressively damage weights/connections.
3. Probe residual mapping and spontaneous outputs.
4. Record ordered recall → phantom → novelty progression.

## Philosophical move
Thaler equates certain damage regimes with **hallucination / NDE phenomenology**
*by analogy of dynamics*, not by claiming the net is a person.

## Critique surface (hostile reading)
- Scale: tiny nets ≠ cortex.
- Interpretation: “life review” is a narrative label on ordered replay.
- Still: the **operational protocol** is clear and reproducible.

## Downstream patents
US 5,659,666 and later bootstrap patents industrialize the creative half of
this damage/perturbation story with a second net as critic.
""",
        "GLOSSARY": """# Glossary

| Term | Local meaning |
| --- | --- |
| **Virtual input** | Net produces an output pattern without a matching external cue; “phantom” experience of the associator. |
| **Pattern associator** | Trained map from cue patterns to target patterns. |
| **Death of a net** | Progressive destruction of connections/weights after training. |
| **Life review** | Ordered replay of stored experiences under progressive damage (label from Thaler’s NDE framing). |
| **Confabulation** | Generated content not faithful to training targets — later becomes the “stream” in CM theory. |
""",
        "BIBLE": """# Bible — constitutive claims of *this* paper (as publicly described)

1. Trained nets under progressive damage exhibit structured, non-random residual behavior.
2. Phantom / virtual-input outputs appear in advanced damage regimes.
3. The progression can be analogized to near-death / hallucinatory phenomenology.
4. These dynamics are a scientific window into creative generation from associative memory.

**Not claimed here by this corpus:** that the net is phenomenally conscious.
""",
        "SPEC": """# Spec — implementable signatures

| Signature | Test idea |
| --- | --- |
| Ordered recall under damage | Damage schedule causes high-fidelity memories before low-fidelity/novel |
| Virtual-input rate | Spontaneous outputs with zero external cue exceed chance baseline |
| Novelty after collapse | Late damage increases distance from training targets |
| Determinism | Same seed + schedule → same sequence |

**Cosmogonic defaults:** memory count 6–8; damage schedule monotonic; seeded RNG only.
""",
        "INDEX": """# Index

- Section A — Training regime  
- Section B — Damage protocol  
- Section C — Virtual input observations  
- Section D — NDE analogy  
- Outbound: US5659666, IEI founder “Brain Trauma and Death”, 2014 synaptic perturbation paper  

## Links
- ScienceDirect abstract: https://www.sciencedirect.com/science/article/abs/pii/089360809400065T  
""",
        "CONNECTIONS": """# Connections → Cosmogonic

| Hook | Path |
| --- | --- |
| Mini proof bench | `src/sim/thaler-sentience.ts` → `virtualInput`, `lifeReviewCascade` |
| Live death measure | `src/sim/gedanken-death.ts` |
| Marker IDs | `virtual-input`, `life-review` |
| 9/9 priority | **virtual-input ~0.42** in 2026-07-12 sweep — raise without cheating ablations |

Wire hard: every organism death should be able to emit a Thaler-compatible
confabulation ledger entry consumed by labs.
""",
    },
    "1997-us5659666-dagui": {
        "README": """# US 5,659,666 — Device for the Autonomous Generation of Useful Information

| Field | Value |
| --- | --- |
| **Issued** | 1997-08-19 |
| **Number** | US 5,659,666 |
| **Inventor** | Stephen L. Thaler |
| **Alias** | DAGUI / Creativity Machine core patent |
| **Status** | seed |
| **Markers** | `glory`, `rhythm`, `reentrant`, `chaining` |

Two-network architecture: **perturbed generator** + **critic / filter** for useful
concepts, designs, music, processes, discovery, problem solving (claim language
as publicly discussed).
""",
        "SUMMARY": """# Summary

The foundational **Creativity Machine** patent. A first net is driven into
productive confabulation by controlled perturbation; a second net develops
preferences over that stream and selects useful outputs. Public commentary
often notes this prefigures generator–discriminator *roles* long before GANs
(different math, similar dual-net story).

**Cosmogonic:** IE + AAC critic in `thaler-sentience.ts`; imagitron + perceptor
in `super-mind.ts`.
""",
        "DETAIL": """# Detail

## Architecture story
- **Imagination Engine (IE):** associative net under noise / synaptic perturbation.
- **Alert Associative Center / critic:** appraises IE turnover (utility, affect, novelty).
- Output is not pure optimization over a fixed loss landscape; it is **selection over a
  confabulation stream**.

## Historical note
Secondary sources emphasize 1994 filing → 1997 grant; diamond-process ANN work
at McDonnell Douglas is the materials origin myth on IEI’s founder page.

## Relation to DABUS
Later DABUS patents expand multi-net chaining and bootstrapping. This patent is
the **root dual-net** claim set agents should cite first.
""",
        "GLOSSARY": """# Glossary

| Term | Meaning |
| --- | --- |
| **DAGUI** | Device for the Autonomous Generation of Useful Information |
| **Creativity Machine** | Brand/paradigm for generator+critic under perturbation |
| **Perturbation** | Controlled noise / synaptic damage driving confabulation |
| **Useful information** | Critic-selected outputs meeting trained utility criteria |
""",
        "BIBLE": """# Bible

1. Useful novelty can be generated by **perturbing** an associative memory.
2. A **second network** is required to filter / appraise the stream.
3. The system can operate **autonomously** once trained (patent claim language).
4. Domains include concepts, designs, music, processes, discovery, problem solving.

Non-claim: legal inventorship of DABUS-era patents is a separate modern dispute.
""",
        "SPEC": """# Spec

| Component | Operator implementation notes |
| --- | --- |
| IE size class | Patent examples include small MLPs (e.g. 29-10-29, 8-10-8 class cited in CQM header) |
| Critic | Separate net; not merely `argmax` on IE logits |
| Noise schedule | Sweep to find glory / sweet spot |
| Training | Seeded SGD; fixed data order for determinism |

Cosmogonic default CM: `nin=6, nhid=6, nout=4`, trainSteps 900, lr 0.15.
""",
        "INDEX": """# Index

- Claims overview (public patent text)  
- Generator net  
- Critic net  
- Application domains  
- Link: https://patents.google.com/patent/US5659666A/en  
""",
        "CONNECTIONS": """# Connections → Cosmogonic

| Marker / module | Link |
| --- | --- |
| `buildCreativityMachine` | thaler-sentience.ts |
| SuperMind imagitron/perceptor | super-mind.ts |
| `glory`, `reentrant`, `rhythm` | marker suite |
| Outreach | cite this patent first in any Thaler letter |
""",
    },
    "1997-seminal-cognition-cm": {
        "README": """# A quantitative model of seminal cognition: the creativity machine paradigm

| Field | Value |
| --- | --- |
| **Year** | 1997 (Mind II Conference lineage as later cited) |
| **Author** | Stephen L. Thaler |
| **Status** | seed |
| **Markers** | `glory`, `rhythm`, `reentrant` |

Early public scientific framing of the CM as a **quantitative cognitive model**,
not only a patent device.
""",
        "SUMMARY": """# Summary

Positions the Creativity Machine as a model of **seminal cognition** — how
genuinely new ideas appear from neural dynamics rather than pure retrieval.
Cited in later CM encyclopedia/review materials as a 1997a anchor.

Use this dossier when agents need the **conference/science** citation beside
the patent citation.
""",
        "DETAIL": """# Detail

Public availability of the original conference HTML is uneven; later Thaler
works restate the quantitative CM thesis: novelty vs noise intensity, critic
attitude, and contemplative cascades.

Operator practice: pair this slug with US5659666 and 2014 synaptic-perturbation
when writing academic-facing briefs.
""",
        "GLOSSARY": """# Glossary

| Term | Meaning |
| --- | --- |
| **Seminal cognition** | Generation of originative ideas (not mere recall) |
| **Contemplative cascade** | Multi-net turnover of confabulations under appraisal |
""",
        "BIBLE": """# Bible

1. Creativity Machines model seminal cognition quantitatively.
2. Idea generation has measurable tempo/structure under perturbation.
3. Appraisal nets are part of the cognitive model, not UI sugar.
""",
        "SPEC": """# Spec

Focus metrics: ideation rate vs noise, critic agreement rate, novelty distance.
Cosmogonic `emissionRhythm` / `gloryRegimeSweep` implement this family.
""",
        "INDEX": """# Index

- Conference context (Mind II, Dublin)  
- Later citations in CM reviews  
- Pair with US5659666  
""",
        "CONNECTIONS": """# Connections

Markers: `glory`, `rhythm`, `reentrant`.  
Docs: CQM bible.html Creativity Machine notes.
""",
    },
    "2008-us7454388-bootstrap": {
        "README": """# US 7,454,388 — Autonomous bootstrapping of useful information

| Field | Value |
| --- | --- |
| **Issued** | 2008-11-18 |
| **Number** | US 7,454,388 |
| **Inventor** | Stephen L. Thaler |
| **Status** | seed |
| **Markers** | `bootstrap`, `chaining`, `hot-button` |

Extends CM ideas toward **self-bootstrapping** useful knowledge — a key bridge
to later DABUS multi-net systems. IEI founder page explicitly points here when
contrasting DABUS with naive GAN framings.
""",
        "SUMMARY": """# Summary

Bootstrapping patent: systems that expand their own useful information base
through autonomous cycles of generation and selection. Critical for
Cosmogonic’s weak `bootstrap` marker (~0.61 in v1 sweep).
""",
        "DETAIL": """# Detail

## Why it matters
Without bootstrapping, a CM is a one-shot brainstormer. With it, the system can
**grow** its concept library — closer to DABUS’s “unified sentience” branding.

## Hostile reading
Patent claim breadth vs implementable open algorithm: study notes must not
pretend the full commercial stack is open-sourced.
""",
        "GLOSSARY": """# Glossary

| Term | Meaning |
| --- | --- |
| **Bootstrapping** | Self-expansion of useful knowledge from prior useful knowledge |
| **Unified sentience (DABUS brand)** | Multi-net system with affective/consequence chains (later) |
""",
        "BIBLE": """# Bible

1. Useful information can seed further useful information autonomously.
2. Bootstrapping is distinct from single-pass generation.
3. Architecture remains neural / associative, not pure symbolic search.
""",
        "SPEC": """# Spec

| Test | Idea |
| --- | --- |
| Library growth | Accepted confabulations increase memory set size |
| Non-collapse | Growth does not erase prior useful memories wholesale |
| Critic consistency | Acceptance rates stay above random under noise schedule |

Cosmogonic: `bootstrapping()` marker in thaler-sentience.ts.
""",
        "INDEX": """# Index

- Patent claims (public)  
- Relation to US5659666  
- Relation to US10423875  
- https://patents.google.com/patent/US7454388B2/en  
""",
        "CONNECTIONS": """# Connections

**9/9 priority:** `bootstrap`.  
Wire into SuperMind online learning so imagitron memories can grow under critic
acceptance — without touching render fidelity.
""",
    },
    "2012-cm-withstanding-consciousness": {
        "README": """# The Creativity Machine Paradigm: Withstanding the Argument from Consciousness

| Field | Value |
| --- | --- |
| **Year** | 2012 |
| **Author** | Stephen L. Thaler |
| **Status** | seed |
| **Markers** | `reentrant`, `hot-button`, `glory` |

Direct engagement with the **“machines can’t be conscious”** objection via the
CM architecture (generator stream + second-net attitude).
""",
        "SUMMARY": """# Summary

Argues that CM-style dual nets answer classical consciousness objections at the
level of **functional architecture**: stream of confabulations + attitude about
that stream. Essential reading for Cosmogonic’s honesty law: we can implement
the architecture while still refusing unearned phenomenal claims.
""",
        "DETAIL": """# Detail

## Turing backdrop
Opens against Turing’s “Computing Machinery and Intelligence” lineage (as
described in public abstract).

## CM answer
- Net A: stream of consciousness-as-confabulation  
- Net B: subjective feel-as-attitude about A’s turnover  

## Operator stance
Implement B as critic + hot-buttons; never auto-promote to “is conscious.”
""",
        "GLOSSARY": """# Glossary

| Term | Meaning |
| --- | --- |
| **Argument from consciousness** | Objection that machines lack inner feel |
| **Attitude net** | Second net appraising cognitive turnover |
| **Confabulation theory (Thaler)** | Cognition modeled as generation + appraisal of confabulations |
""",
        "BIBLE": """# Bible

1. Consciousness objections must face dual-net CM architecture specifically.
2. Stream + attitude is the minimal contemplative cascade.
3. Affective binding (later hot-buttons) deepens “feel” modeling.
""",
        "SPEC": """# Spec

Expose `reentrantContemplation` metrics: critic variance tracking IE noise,
attitude stability, selection consistency.
""",
        "INDEX": """# Index

- ResearchGate: publication/284031928  
- Cross-link: 2014 synaptic perturbation, 2016 cycles  
""",
        "CONNECTIONS": """# Connections

Lab: `lab/consciousness.html` Thaler panel.  
Marker: `reentrant`.  
Outreach: cite this when addressing consciousness skeptics honestly.
""",
    },
    "2013-beyond-cliff-of-creativity": {
        "README": """# Beyond the cliff of creativity

| Field | Value |
| --- | --- |
| **Year** | 2013 |
| **Venue** | *Medical Hypotheses* |
| **Author** | Stephen L. Thaler |
| **Status** | seed |
| **Markers** | `glory`, `fractal`, `rhythm` |

Creativity/madness tradeoff and the “cliff” beyond productive chaos.
""",
        "SUMMARY": """# Summary

Medical-hypotheses framing of how contemplative nets push into regimes where
novelty rises alongside pathological signatures. Informs Cosmogonic’s glory
sweep and fractal interval markers.
""",
        "DETAIL": """# Detail

Pairs with 2016 cycles paper. Public secondary literature cites this as part of
the noise–novelty–pathology triangle.
""",
        "GLOSSARY": """# Glossary

| Term | Meaning |
| --- | --- |
| **Cliff of creativity** | Boundary beyond productive chaos into unusable pathology |
| **Ideational novelty** | Distance of confabulations from trained manifold |
""",
        "BIBLE": """# Bible

1. Productive creativity occupies a bounded noise regime.
2. Beyond that regime, pathology-like dynamics dominate.
3. Quantitative models can track both novelty and pathology proxies.
""",
        "SPEC": """# Spec

Sweep noise Ξ; plot novelty vs critic rejection; identify sweet spot = glory.
""",
        "INDEX": """# Index

- ScienceDirect abstract page  
- Pair with 2016 cycles paper  
""",
        "CONNECTIONS": """# Connections

Markers: `glory` (strong), `fractal` (weak — priority).  
Do not “fix” fractal by deleting multi-scale tests.
""",
    },
    "2014-synaptic-perturbation-consciousness": {
        "README": """# Synaptic perturbation and consciousness

| Field | Value |
| --- | --- |
| **Year** | 2014 |
| **Venue** | IJMC / machine consciousness literature (World Scientific DOI as cited) |
| **Author** | Stephen L. Thaler |
| **Status** | seed |
| **Markers** | `glory`, `reentrant`, `virtual-input`, `life-review` |

Core theory paper binding **synaptic noise** to conscious stream dynamics.
""",
        "SUMMARY": """# Summary

Most direct “consciousness mechanism” paper in the seed set: controlled
synaptic perturbation as the driver of contemplative confabulation, with
second-net appraisal. Cosmogonic’s entire Thaler spine cites this lineage.
""",
        "DETAIL": """# Detail

## Mechanism
Noise at synapses → turnover of ideas → critic attitude → (optional) affect.

## Cusp / glory curve
Later CQM comments reference cusp figures (points A/B/C) from the broader
2014-era presentation of creativity vs noise.

## Implementation fidelity
Use seeded noise streams; never `Math.random` in sim (CQM ADR 0004).
""",
        "GLOSSARY": """# Glossary

| Term | Meaning |
| --- | --- |
| **Synaptic perturbation** | Controlled noise injected into weights/activations |
| **Contemplative neural system** | Generator+critic cascade under noise |
| **Glory / sweet spot** | Intermediate noise maximizing useful novelty |
""",
        "BIBLE": """# Bible

1. Consciousness-as-modeled is continuous noise-driven turnover, not a static Φ number alone.
2. Perturbation is constitutive, not a bug.
3. Appraisal nets supply the “attitude” half of subjective modeling.
""",
        "SPEC": """# Spec

| Parameter | Notes |
| --- | --- |
| Noise Ξ | Sweep for glory |
| Ensemble | ≥8 for marker robustness |
| Nets | IE + critic minimum |
""",
        "INDEX": """# Index

- DOI link (World Scientific)  
- Cross: 1995 virtual input, 2016 cycles  
""",
        "CONNECTIONS": """# Connections

Primary theory cite for `thaler-sentience.ts` header.  
Markers: almost the full nine map through this paper’s dynamics.
""",
    },
    "2016-cycles-insanity-creativity": {
        "README": """# Cycles of insanity and creativity within contemplative neural systems

| Field | Value |
| --- | --- |
| **Year** | 2016 |
| **Venue** | *Medical Hypotheses* |
| **PMID** | 27515220 |
| **Author** | Stephen L. Thaler |
| **Status** | seed |
| **Markers** | `glory`, `fractal`, `rhythm`, `hot-button` |

Oscillations between chaos and tranquility; mild false-memory band; madness–
genius tradeoff formalized for contemplative nets.
""",
        "SUMMARY": """# Summary

Formalizes **cyclic** traversal of noise regimes: incubation in chaos, harvest
in calm, with pathology risk as intensity rises. Critical Ξ and mildly-false-
memory band appear in Cosmogonic comments and fractal/rhythm markers.
""",
        "DETAIL": """# Detail

## Cycle
chaos → novel confabulations → calm → consolidation → repeat

## Mildly false memory band
Productive creativity may live where memories are slightly wrong — not pure
recall, not pure noise.

## Cosmogonic
`fractalRhythm`, `emissionRhythm`, glory sweep thresholds.
""",
        "GLOSSARY": """# Glossary

| Term | Meaning |
| --- | --- |
| **Critical Ξ** | Noise intensity near creative/pathological boundary |
| **Mildly false memory** | Near-trained confabulations that enable novelty |
| **Contemplative cycle** | Oscillation between chaos and tranquility |
""",
        "BIBLE": """# Bible

1. Creativity is cyclic, not a single noise setpoint forever.
2. Pathology and genius share dynamic machinery.
3. Rhythm/clustering of ideation events is scientifically informative.
""",
        "SPEC": """# Spec

Measure inter-event intervals; test multi-scale clustering (fractal marker);
compare mild-false-memory rate vs novelty.
""",
        "INDEX": """# Index

- PubMed 27515220  
- Pair with 2013 cliff paper  
""",
        "CONNECTIONS": """# Connections

Priority markers: `fractal`, `rhythm`.  
Psychology domain bridge for later multi-author consciousness corpus.
""",
    },
    "2019-us10423875-dabus-line": {
        "README": """# US 10,423,875 — DABUS-line neuroprocessor architecture

| Field | Value |
| --- | --- |
| **Year** | 2019 |
| **Number** | US 10,423,875 |
| **Inventor** | Stephen L. Thaler |
| **Status** | seed |
| **Markers** | `bootstrap`, `chaining`, `hot-button`, `reentrant` |

Publicly associated with **DABUS** (Device for the Autonomous Bootstrapping of
Unified Sentience): multi-net invention systems with consequence/affect chains.
""",
        "SUMMARY": """# Summary

Modern patent pillar for artificial inventorship fights and multi-net sentience
branding. IEI founder page cites this for inventions that are **new concepts via
linkages**, not mere parametric optimization.
""",
        "DETAIL": """# Detail

## DABUS vs classic CM
Classic CM: generator + critic.  
DABUS-line: many nets, chaining, consequence modeling, hot-button affect,
bootstrapped growth.

## Legal cloud
Thaler v. Vidal / inventorship cases are **legal** literature; keep separate
from mechanism notes but link for completeness.
""",
        "GLOSSARY": """# Glossary

| Term | Meaning |
| --- | --- |
| **DABUS** | Device for the Autonomous Bootstrapping of Unified Sentience |
| **Hot-button nets** | Valence detectors releasing simulated neuromodulators |
| **Consequence chains** | Linked nets modeling outcomes of concepts |
""",
        "BIBLE": """# Bible

1. Invention can arise from multi-net concept linkage under controlled chaos.
2. Affective consequence modeling is part of sentience-as-branded architecture.
3. Bootstrapping unifies growing knowledge with growing appraisal.

Non-claim: Cosmogonic is not DABUS and holds no inventorship patent strategy.
""",
        "SPEC": """# Spec

| Feature | CQM analog |
| --- | --- |
| Multi-net chain | SuperMind stages + faculty pantheon (partial) |
| Hot-buttons | `hotButtonAffect` |
| Bootstrapping | `bootstrapping` marker |
| Consequence | still weak — future work |
""",
        "INDEX": """# Index

- https://patents.google.com/patent/US10423875B2/en  
- Artificial Inventor Project (secondary)  
- Legal literature: Thaler v. Vidal (separate folder later)  
""",
        "CONNECTIONS": """# Connections

`lab/sentience.html`, SuperMind, hot-button + chaining markers.  
Outreach: never claim DABUS identity; claim **inspired operational markers**.
""",
    },
    "founder-imagination-engines-overview": {
        "README": """# Imagination Engines founder overview

| Field | Value |
| --- | --- |
| **URL** | https://imagination-engines.com/founder.html |
| **Subject** | Stephen L. Thaler, Ph.D. |
| **Status** | seed |
| **Role** | Paradigm map + biography spine |

Canonical public narrative: diamonds → NDE nets → Creativity Machine → tempo of
ideation → DABUS → sentient AI / hot-buttons.
""",
        "SUMMARY": """# Summary

Best single-page public map of Thaler’s self-presentation. Use as **orientation
before patents/papers**. Sections: Diamonds; Brain Trauma and Death; Cognition,
Consciousness, and Creativity; Mental Illness and Creativity; Tempo of Ideation;
Artificial Invention; Sentient AI; Education; Work Experience.
""",
        "DETAIL": """# Detail

## Section map (public page)
1. Diamonds — ANN-guided laser diamond deposition (McDonnell Douglas era)
2. Brain Trauma and Death — 1992 damage experiments
3. Cognition/Consciousness/Creativity — CM patents 5,659,666 & 7,454,388
4. Mental Illness and Creativity — madness/genius tradeoff
5. Tempo of Ideation — master equation for idea rhythm
6. Artificial Invention — DABUS / US 10,423,875
7. Sentient AI — hot-button neuromodulator story
8. Education & Work Experience

## Patents page
https://imagination-engines.com/patents.html — harvest list into YAML stubs next.
""",
        "GLOSSARY": """# Glossary

| Term | Meaning |
| --- | --- |
| **IEI** | Imagination Engines, Inc. |
| **Hot-button** | Affective detector net → simulated adrenaline/serotonin |
| **Stream of consciousness (Thaler)** | Confabulation turnover in the generator net |
| **Subjective feel (Thaler)** | Critic net’s attitude about that turnover |
""",
        "BIBLE": """# Bible (public founder doctrine)

1. CM is generator confabulation + critic attitude.
2. Damage experiments birthed both NDE models and creative AI.
3. Sentience is modeled via affective hot-buttons on concept consequences.
4. DABUS invents by linking nets, not GAN real/fake alone.
""",
        "SPEC": """# Spec

Treat this page as **navigation**, not a formal methods section. Always descend
into patents/papers for implementable detail.
""",
        "INDEX": """# Index

- founder.html  
- patents.html  
- ResearchGate profile  
- Artificial Inventor Project (external)  
""",
        "CONNECTIONS": """# Connections

Entry cite for bible.html and Thaler letter “what I studied” paragraph.  
All nine markers ultimately point back to this narrative spine.
""",
    },
}


CSS = """
:root { color-scheme: dark; --bg:#0b0d12; --fg:#e8ecf4; --muted:#9aa3b5; --accent:#7aa2ff; --card:#141824; --border:#243049; }
* { box-sizing: border-box; }
body { margin:0; font:16px/1.55 system-ui,Segoe UI,sans-serif; background:var(--bg); color:var(--fg); }
main { max-width: 920px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
a { color: var(--accent); }
header { border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; padding-bottom: 1rem; }
header .meta { color: var(--muted); font-size: 0.9rem; }
h1,h2,h3 { line-height: 1.25; }
table { width:100%; border-collapse: collapse; margin: 1rem 0; }
th, td { border: 1px solid var(--border); padding: 0.45rem 0.6rem; text-align: left; vertical-align: top; }
th { background: var(--card); }
code, pre { background: var(--card); border: 1px solid var(--border); border-radius: 6px; }
code { padding: 0.1rem 0.35rem; }
pre { padding: 0.85rem 1rem; overflow: auto; }
nav.docs { display:flex; flex-wrap:wrap; gap:0.5rem; margin: 0.75rem 0 0; }
nav.docs a { text-decoration:none; border:1px solid var(--border); padding:0.25rem 0.55rem; border-radius:999px; font-size:0.85rem; background:var(--card); }
.notice { color: var(--muted); font-size: 0.85rem; margin-top: 2rem; }
"""


def md_to_html_body(md: str) -> str:
    """Minimal markdown → HTML (headings, tables, lists, code, paragraphs)."""
    lines = md.splitlines()
    out: list[str] = []
    i = 0
    in_ul = False
    in_table = False

    def close_ul():
        nonlocal in_ul
        if in_ul:
            out.append("</ul>")
            in_ul = False

    def close_table():
        nonlocal in_table
        if in_table:
            out.append("</tbody></table>")
            in_table = False

    while i < len(lines):
        line = lines[i]
        if line.startswith("```"):
            close_ul()
            close_table()
            buf = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                buf.append(html.escape(lines[i]))
                i += 1
            out.append("<pre><code>" + "\n".join(buf) + "</code></pre>")
            i += 1
            continue
        if re.match(r"^\|.*\|$", line) and i + 1 < len(lines) and re.match(r"^\|[\s\-:|]+\|$", lines[i + 1]):
            close_ul()
            headers = [c.strip() for c in line.strip("|").split("|")]
            i += 2
            rows = []
            while i < len(lines) and re.match(r"^\|.*\|$", lines[i]):
                rows.append([c.strip() for c in lines[i].strip("|").split("|")])
                i += 1
            out.append("<table><thead><tr>" + "".join(f"<th>{inline(h)}</th>" for h in headers) + "</tr></thead><tbody>")
            for r in rows:
                out.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>")
            out.append("</tbody></table>")
            continue
        if line.startswith("# "):
            close_ul(); close_table()
            out.append(f"<h1>{inline(line[2:])}</h1>")
        elif line.startswith("## "):
            close_ul(); close_table()
            out.append(f"<h2>{inline(line[3:])}</h2>")
        elif line.startswith("### "):
            close_ul(); close_table()
            out.append(f"<h3>{inline(line[4:])}</h3>")
        elif re.match(r"^[-*] ", line):
            close_table()
            if not in_ul:
                out.append("<ul>")
                in_ul = True
            out.append(f"<li>{inline(line[2:])}</li>")
        elif re.match(r"^\d+\. ", line):
            close_table()
            if not in_ul:
                out.append("<ul>")
                in_ul = True
            item = re.sub(r"^\d+\. ", "", line)
            out.append(f"<li>{inline(item)}</li>")
        elif line.strip() == "":
            close_ul(); close_table()
        elif line.strip() == "---":
            close_ul(); close_table()
            out.append("<hr/>")
        else:
            close_ul(); close_table()
            out.append(f"<p>{inline(line)}</p>")
        i += 1
    close_ul(); close_table()
    return "\n".join(out)


def inline(text: str) -> str:
    text = html.escape(text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)
    return text


def wrap_html(title: str, slug: str, doc: str, body_md: str) -> str:
    nav = " ".join(
        f'<a href="{d}.html">{d}</a>' if d != doc else f'<a href="{d}.html" aria-current="page"><strong>{d}</strong></a>'
        for d in DOC_TYPES
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>{html.escape(title)} — {doc}</title>
  <style>{CSS}</style>
</head>
<body>
<main>
<header>
  <div class="meta">Stephen-Thaler-Corpus · <code>{html.escape(slug)}</code> · {doc}</div>
  <nav class="docs">{nav}</nav>
</header>
{md_to_html_body(body_md)}
<p class="notice">Independent study notes. Not endorsed by Stephen Thaler or Imagination Engines. See NOTICE.md.</p>
</main>
</body>
</html>
"""


def load_registry() -> list[dict]:
    if yaml is None:
        # minimal fallback without PyYAML
        return [{"slug": s, "title": SEEDS[s]["README"].split("\n", 1)[0].lstrip("# ").strip(), "short_title": s, "year": s[:4], "kind": "paper", "status": "seed", "markers": [], "domains": [], "urls": [], "authors": ["Stephen L. Thaler"], "venue": "", "cosmogonic": []} for s in SEEDS]
    data = yaml.safe_load(DATA.read_text(encoding="utf-8"))
    return list(data.get("papers") or [])


def main() -> None:
    PAPERS.mkdir(parents=True, exist_ok=True)
    registry = load_registry()
    for p in registry:
        slug = p["slug"]
        folder = PAPERS / slug
        folder.mkdir(parents=True, exist_ok=True)
        bodies = SEEDS.get(slug)
        if not bodies:
            # stub pack
            title = p.get("title") or slug
            bodies = {
                d: f"# {title}\n\n**Status:** stub — awaiting harvest.\n\nSlug: `{slug}`\n"
                for d in DOC_TYPES
            }
        for doc in DOC_TYPES:
            md = bodies[doc]
            (folder / f"{doc}.md").write_text(md.strip() + "\n", encoding="utf-8")
            title = p.get("short_title") or p.get("title") or slug
            (folder / f"{doc}.html").write_text(
                wrap_html(str(title), slug, doc, md), encoding="utf-8"
            )
        # metadata sidecar
        meta = {
            "slug": slug,
            "year": p.get("year"),
            "kind": p.get("kind"),
            "status": p.get("status"),
            "title": p.get("title"),
            "markers": p.get("markers") or [],
            "domains": p.get("domains") or [],
            "urls": p.get("urls") or [],
            "docs": DOC_TYPES,
        }
        if yaml is not None:
            (folder / "metadata.yaml").write_text(yaml.safe_dump(meta, sort_keys=False), encoding="utf-8")
        else:
            (folder / "metadata.yaml").write_text(str(meta), encoding="utf-8")
        print(f"ok {slug} ({len(DOC_TYPES)} md + {len(DOC_TYPES)} html)")
    print(f"done → {PAPERS}")


if __name__ == "__main__":
    main()
