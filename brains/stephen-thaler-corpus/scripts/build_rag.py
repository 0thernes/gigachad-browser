#!/usr/bin/env python3
"""Build rag/corpus.jsonl from papers/**/*.md for harness retrieval."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAPERS = ROOT / "papers"
OUT = ROOT / "rag" / "corpus.jsonl"


def chunk_md(text: str, source: str, slug: str, doc_type: str) -> list[dict]:
    parts = re.split(r"(?m)^(## .+)$", text)
    chunks: list[dict] = []
    # preface before first H2
    if parts and parts[0].strip():
        chunks.append(
            {
                "id": f"{slug}:{doc_type}:0",
                "slug": slug,
                "doc_type": doc_type,
                "heading": "preface",
                "text": parts[0].strip(),
                "source_path": source,
            }
        )
    i = 1
    n = 1
    while i < len(parts):
        heading = parts[i].lstrip("# ").strip()
        body = parts[i + 1].strip() if i + 1 < len(parts) else ""
        if body:
            chunks.append(
                {
                    "id": f"{slug}:{doc_type}:{n}",
                    "slug": slug,
                    "doc_type": doc_type,
                    "heading": heading,
                    "text": f"{heading}\n\n{body}",
                    "source_path": source,
                }
            )
            n += 1
        i += 2
    return chunks


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    rows: list[dict] = []
    for md in sorted(PAPERS.glob("*/*.md")):
        if md.name == "metadata.yaml":
            continue
        slug = md.parent.name
        doc_type = md.stem
        text = md.read_text(encoding="utf-8")
        rel = str(md.relative_to(ROOT)).replace("\\", "/")
        rows.extend(chunk_md(text, rel, slug, doc_type))
    with OUT.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"wrote {len(rows)} chunks → {OUT}")


if __name__ == "__main__":
    main()
