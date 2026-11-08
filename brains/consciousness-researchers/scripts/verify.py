#!/usr/bin/env python3
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]
DOCS = ["README","SUMMARY","DETAIL","GLOSSARY","BIBLE","SPEC","INDEX","CONNECTIONS"]
base = ROOT / "researchers"
bad = 0
folders = sorted(p for p in base.iterdir() if p.is_dir())
if len(folders) < 10:
    print(f"FAIL: expected >=10 researchers, got {len(folders)}")
    sys.exit(1)
for folder in folders:
    for d in DOCS:
        for ext in (".md", ".html"):
            p = folder / f"{d}{ext}"
            if not p.is_file() or p.stat().st_size < 20:
                print("FAIL", p)
                bad += 1
    papers = folder / "papers"
    if papers.is_dir():
        for paper in sorted(papers.iterdir()):
            if not paper.is_dir():
                continue
            for d in DOCS:
                for ext in (".md", ".html"):
                    p = paper / f"{d}{ext}"
                    if not p.is_file() or p.stat().st_size < 20:
                        print("FAIL", p)
                        bad += 1
            print("ok-paper", folder.name, paper.name)
    print("ok", folder.name)
if bad:
    print("FAILED", bad)
    sys.exit(1)
print(f"PASS {len(folders)} researchers (+ paper packs) × 16 files each root")
