# RAG layer

## Build

```bash
python scripts/scaffold.py
python scripts/build_rag.py
```

Emits `corpus.jsonl` — one JSON object per heading chunk:

```json
{
  "id": "1995-virtual-input-phenomena:SUMMARY:0",
  "slug": "1995-virtual-input-phenomena",
  "doc_type": "SUMMARY",
  "heading": "preface",
  "text": "...",
  "source_path": "papers/1995-virtual-input-phenomena/SUMMARY.md"
}
```

## Harness use

- Prefer `doc_type` in {`BIBLE`,`SPEC`,`SUMMARY`,`CONNECTIONS`} for implementation agents.
- Prefer `DETAIL` + `INDEX` for literature surveys.
- Always surface `NOTICE.md` non-endorsement when quoting.

## Embeddings

Optional offline embeddings can be added later (`embed_index.py`). Chunk JSONL is
the stable interchange format.
