# Architecture

## Single source of truth

`data/papers.yaml` lists every paper/patent. `scripts/scaffold.py` materializes
`papers/<slug>/` dossiers. Never hand-edit registry tables in README long-term —
regenerate from YAML.

## Per-paper dossier (8 + 8)

| File | Role | RAG weight |
| --- | --- | --- |
| `README` | Identity card, citation, status | high |
| `SUMMARY` | Executive reconstruction | highest |
| `DETAIL` | Deep dive, chronology, critique | high |
| `GLOSSARY` | Local terms | medium |
| `BIBLE` | Constitutive claims of *this* work | highest |
| `SPEC` | Architecture, params, signatures | highest for implementers |
| `INDEX` | Sections, outbound links | medium |
| `CONNECTIONS` | CQM wire + 9-marker hooks | highest for Cosmogonic agents |

Each exists as `.md` and twin `.html` (same body, shared CSS template).

## Status ladder

| Status | Meaning |
| --- | --- |
| `seed` | Full 8×8 with operator notes from public sources |
| `deep` | Seed + multi-source cross-check + Cosmogonic ablations linked |
| `stub` | Folder + README only; body pending harvest |
| `blocked` | Fulltext unavailable and public abstracts insufficient |

## RAG pipeline

1. `scripts/build_rag.py` walks `papers/**/*.{md}`  
2. Chunks by heading (H2) into `rag/corpus.jsonl`  
3. Each chunk carries: `slug`, `doc_type`, `year`, `kind`, `markers[]`, `source_path`  
4. Optional: embed offline later (no cloud dependency required)

## Relationship to CQM quality law

This repo is **read-mostly study**. It does not alter Cosmogonic shaders, skins,
entity intelligence ceilings, or render fidelity. Any CQM compute work remains
**invisible** (workers/pools/hybrid placement only).
