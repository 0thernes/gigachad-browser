#!/usr/bin/env python3
"""Every paper folder must have exactly 8 MD + 8 HTML named DOC_TYPES."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAPERS = ROOT / "papers"
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


def main() -> int:
    if not PAPERS.exists():
        print("FAIL: papers/ missing — run scripts/scaffold.py")
        return 1
    bad = 0
    folders = sorted(p for p in PAPERS.iterdir() if p.is_dir())
    if not folders:
        print("FAIL: no paper folders")
        return 1
    for folder in folders:
        for d in DOC_TYPES:
            for ext in (".md", ".html"):
                path = folder / f"{d}{ext}"
                if not path.is_file() or path.stat().st_size < 20:
                    print(f"FAIL: {path.relative_to(ROOT)}")
                    bad += 1
        print(f"ok {folder.name}")
    if bad:
        print(f"FAILED {bad} missing/empty files")
        return 1
    print(f"PASS {len(folders)} papers × 16 files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
