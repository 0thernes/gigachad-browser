#!/usr/bin/env python3
"""Start the sidecar on a spare port and check that its APIs are honest."""

import json
import os
import queue
import re
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("GIGACHAD_SMOKE_PORT", "0"))
BASE = f"http://127.0.0.1:{PORT}"
BANNED = (
    "EmbeddingGemma",
    "embeddinggemma",
    "GLiNER",
    "BGE-Reranker",
    "DeBERTa",
    "GraphRAG",
    "NuExtract",
    "Tree-sitter",
    "TreeSitter",
    "Paradee",
    "Kokoro-82M",
    "Laya-421",
    "Nemotron",
)


def request(method, path, payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BASE + path,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            body = res.read().decode("utf-8")
            return res.status, json.loads(body)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError:
            parsed = {"raw": body}
        return exc.code, parsed


def assert_honest(payload, where):
    blob = json.dumps(payload)
    for word in BANNED:
        if word in blob:
            raise SystemExit(f"{where} claimed {word}: {blob[:400]}")


def main():
    global PORT, BASE
    env = os.environ.copy()
    env["GIGACHAD_TEST_MODE"] = "1"
    env["GIGACHAD_SIDECAR_PORT"] = str(PORT)
    env["GIGACHAD_SIDECAR_HOST"] = "127.0.0.1"
    env.pop("GIGACHAD_EMBED_MODEL", None)
    env.pop("GIGACHAD_NER_MODEL", None)
    proc = subprocess.Popen(
        [sys.executable, "-I", "-S", os.path.join(ROOT, "laya_sidecar.py")],
        cwd=ROOT,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    startup_lines = queue.Queue()
    def collect_output():
        for line in proc.stdout:
            startup_lines.put(line.rstrip())
    threading.Thread(target=collect_output, daemon=True).start()
    try:
        deadline = time.time() + 8
        health = None
        listening = False
        while time.time() < deadline:
            if proc.poll() is not None:
                raise SystemExit(f"sidecar exited early with code {proc.returncode}")
            try:
                if not listening:
                    line = startup_lines.get(timeout=0.1)
                    match = re.fullmatch(r"gigachad-sidecar listening on http://127\.0\.0\.1:(\d+)/health", line)
                    if not match:
                        continue
                    PORT = int(match.group(1))
                    BASE = f"http://127.0.0.1:{PORT}"
                    listening = True
                status, health = request("GET", "/health")
                if status == 200:
                    break
            except Exception:
                time.sleep(0.1)
        else:
            raise SystemExit("sidecar /health did not come up")

        assert health["status"] == "ok"
        assert health["backends"]["embeddings"]["implementation"] == "hashing-trick"
        assert health["backends"]["embeddings"]["neural"] is False
        assert health["backends"]["embeddings"]["model"] is None
        assert health["backends"]["ner_pii"]["implementation"] == "regex"
        assert health["backends"]["seo_accessibility_audit"]["implementation"] == "wcag-seo-auditor"
        assert health["backends"]["table_to_markdown"]["implementation"] == "table-compiler"
        assert health["backends"]["tts"]["implementation"] in {"none", "windows-sapi", "kokoro"}
        assert_honest(health, "/health")

        status, embed = request("POST", "/embed", {"input": "local smoke"})
        assert status == 200, embed
        assert embed["implementation"] == "hashing-trick"
        assert embed["neural"] is False
        assert len(embed["embedding"]) == 768
        assert_honest(embed, "/embed")

        status, route = request("POST", "/route", {"prompt": "click the search box", "page_length": 20, "allow_cloud": False})
        assert status == 200 and route["target"] == "local", route
        status, visual = request("POST", "/route", {"prompt": "describe this screenshot", "page_length": 20, "allow_cloud": True})
        assert visual["target"] == "omni", visual
        status, cloud = request("POST", "/route", {"prompt": "cross-reference all tabs", "page_length": 20, "allow_cloud": False})
        assert cloud["target"] == "local", cloud
        status, cloud_ok = request("POST", "/route", {"prompt": "cross-reference all tabs", "page_length": 20, "allow_cloud": True})
        assert cloud_ok["target"] == "ultra", cloud_ok

        status, classified = request("POST", "/classify", {"url": "https://example.com", "text": "A short technical note about ports."})
        assert status == 200 and classified["implementation"] == "regex-heuristic", classified
        assert isinstance(classified["signal_score"], int)

        status, pii = request("POST", "/ner_pii", {"text": "Mail ada@example.com about sk-abc1234567890xyzXYZ today."})
        assert status == 200 and pii["implementation"] == "regex", pii
        assert pii["pii_redacted_count"] >= 2
        assert "ada@example.com" not in pii["redacted_text"]
        assert "sk-abc1234567890xyzXYZ" not in pii["redacted_text"]

        # Every recognized match is redacted, including values after the old 25-item cap.
        many_emails = [f"fixture{index}@example.test" for index in range(150)]
        status, many_pii = request("POST", "/ner_pii", {"text": " ".join(many_emails)})
        assert status == 200 and many_pii["pii_redacted_count"] == 150, many_pii
        assert all(value not in many_pii["redacted_text"] for value in many_emails)
        assert len(many_pii["pii_items"]) <= 100 and many_pii["pii_items_truncated"] is True

        status, missing = request("POST", "/not-a-model", {})
        assert status == 404, missing
        status, bad = request("POST", "/route", None)
        # empty object is valid; send broken JSON via a raw call below
        raw = urllib.request.Request(BASE + "/route", data=b"{", method="POST", headers={"Content-Type": "application/json"})
        try:
            urllib.request.urlopen(raw, timeout=5)
            raise SystemExit("invalid JSON should fail")
        except urllib.error.HTTPError as exc:
            assert exc.code == 400

        status, tts = request("POST", "/tts", {"text": "hello"})
        assert status in {200, 503}, tts
        if status == 503:
            assert tts["implementation"] == "none"
        assert_honest(tts, "/tts")

        status, reflex = request("POST", "/reflex/dom", {"candidates": [{"text": "Reject all", "selector": "#r", "x": 1, "y": 2}]})
        assert status == 200 and reflex["recommended_action"]["type"] == "click", reflex

        status, reflex_goal = request("POST", "/reflex/dom", {
            "goal": "search for gpu benchmarks",
            "top_k": 3,
            "elements": [
                {"id": 1, "tag": "button", "label": "Delete Account [DANGER: confirm with user]", "x": 10, "y": 10},
                {"id": 2, "tag": "input", "label": "Search GPU benchmarks and specs", "x": 120, "y": 40},
                {"id": 3, "tag": "a", "label": "About company footer", "x": 100, "y": 800}
            ]
        })
        assert status == 200 and isinstance(reflex_goal.get("candidates"), list) and len(reflex_goal["candidates"]) == 2, reflex_goal
        assert reflex_goal["candidates"][0]["id"] == 2, reflex_goal
        assert all(c["id"] != 1 for c in reflex_goal["candidates"]), reflex_goal

        status, plan_extract = request("POST", "/agent_plan", {
            "goal": "Extract all pricing table rows and copy to clipboard",
            "url": "https://example.com/pricing",
            "title": "Pricing"
        })
        assert status == 200 and plan_extract["archetype"] == "structured_data_harvest" and len(plan_extract["subgoals"]) >= 3, plan_extract
        assert_honest(plan_extract, "/agent_plan")

        status, plan_search = request("POST", "/agent_plan", {
            "goal": "Search for WebGPU specs and open the first result",
            "url": "https://example.com",
            "title": "Home"
        })
        assert status == 200 and plan_search["archetype"] == "web_search_and_synthesize" and len(plan_search["subgoals"]) >= 3, plan_search
        assert_honest(plan_search, "/agent_plan")

        status, summary = request("POST", "/summarize_extractive", {
            "title": "System Architecture",
            "text": "The loopback server binds strictly to 127.0.0.1 for local security. Guests run inside sandboxed webviews with contextIsolation enabled. Tracker blocking filters 50 patterns at the network layer.",
            "max_sentences": 2
        })
        assert status == 200 and summary["implementation"] == "sentence-centrality", summary
        assert len(summary["bullets"]) >= 1 and summary["word_count"] > 10
        assert isinstance(summary.get("reading_level"), str) and isinstance(summary.get("grade_level"), (int, float))
        assert_honest(summary, "/summarize_extractive")

        status, outline = request("POST", "/page_outline", {
            "headings": [{"level": 1, "text": "Overview"}, {"level": 2, "text": "Security"}],
            "codeCount": 3,
            "tableCount": 1,
            "linkCount": 12
        })
        assert status == 200 and outline["heading_count"] == 2 and outline["code_blocks"] == 3, outline
        assert outline["stats"]["h1_count"] == 1 and outline["stats"]["h2_count"] == 1 and outline["stats"]["code_blocks"] == 3, outline
        assert_honest(outline, "/page_outline")

        status, mem = request("POST", "/query_memory", {
            "query": "sandboxed webview",
            "notes": [
                {"id": 1, "title": "Security notes", "url": "https://example.com/sec", "summary": "Every tab is a sandboxed webview guest."},
                {"id": 2, "title": "Cooking recipe", "url": "https://example.com/food", "summary": "Boil water and add pasta."}
            ]
        })
        assert status == 200 and len(mem["results"]) >= 1 and mem["results"][0]["id"] == 1, mem
        assert_honest(mem, "/query_memory")

        status, seo = request("POST", "/seo_accessibility_audit", {
            "title": "Gigachad Enterprise Browser Architecture Specification",
            "metaDescription": "Full-stack AI web browser with context-isolated sandboxing, local sidecar micro-engines, and hybrid LLM routing.",
            "canonical": "https://example.com/spec",
            "lang": "en",
            "og_tags": 3,
            "headings": [{"level": 1, "text": "Spec"}],
            "imagesTotal": 4,
            "imagesMissingAlt": 0,
            "unlabeledControls": 0,
            "emptyLinks": 0,
            "landmarks": 3
        })
        assert status == 200 and seo["grade"] == "A" and seo["seo_score"] == 100 and seo["a11y_score"] == 100, seo
        assert isinstance(seo["seo_issues"], list) and isinstance(seo["a11y_issues"], list) and seo["metrics"]["h1_count"] == 1, seo
        assert_honest(seo, "/seo_accessibility_audit")

        status, tbl = request("POST", "/table_to_markdown", {
            "table_name": "models_bench",
            "tables": [{"headers": ["Model", "Speed"], "rows": [["LFM2.5-1.2B", "132 tok/s"], ["Qwen3.5-4B", "68 tok/s"]]}]
        })
        assert status == 200 and tbl["row_count"] == 2 and "CREATE TABLE models_bench" in tbl["sql"] and "| LFM2.5-1.2B |" in tbl["markdown"], tbl
        assert isinstance(tbl["tables"], list) and len(tbl["tables"]) == 1 and tbl["tables"][0]["row_count"] == 2, tbl
        assert_honest(tbl, "/table_to_markdown")

        status, mq = request("POST", "/metacognition_quantum", {
            "multivector": [0.9, 0.4, -0.3, 0.2, 0.5, 0.7, -0.2, 0.6, 0.3, -0.4, 0.5, 0.2, -0.1, 0.3, 0.4, 0.8],
            "latent_head": [0.5, -0.25, 0.75, 0.1, -0.4, 0.6, 0.3, -0.2],
            "surprise": 0.18,
            "novelty": 0.92,
            "orthogonality": 0.96,
            "dpp_det": 0.88
        })
        assert status == 200 and mq["status"] == "OK" and mq["algebra"] == "Cl(4,0)_R16", mq
        assert mq["bivector_energy"] > 0 and 0.0 <= mq["fmo_exciton_coherence"] <= 1.0, mq
        assert "omniscient_sheaf_pct" in mq.get("six_omni", {}), mq
        assert_honest(mq, "/metacognition_quantum")

        status, ddw = request("POST", "/deep_dark_web_intel", {
            "url": "https://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion/",
            "text": "Tor v3 hidden service Ed25519 SHA3-256 checksum IPFS Merkle DAG cryptography zero-knowledge"
        })
        assert status == 200 and ddw["ok"] is True and ddw["tor_v3_onion_address"].endswith(".onion") and len(ddw["tor_v3_onion_address"]) == 62, ddw
        assert ddw["ipfs_merkle_cid_v1"] is None and ddw["circuit_hops"] == [], ddw
        assert ddw["network_observed"] is False and ddw["neural"] is False, ddw
        status, empty_ddw = request("POST", "/deep_dark_web_intel", {"url": "https://example.com", "text": "ordinary page"})
        assert status == 200 and empty_ddw["tor_v3_onion_address"] is None and empty_ddw["verified_page_onions"] == [], empty_ddw
        assert_honest(ddw, "/deep_dark_web_intel")

        status_413, body_413 = request("POST", "/classify", {"text": "A" * 2_050_000})
        assert status_413 == 413 and body_413.get("error") == "Body too large", (status_413, body_413)

        print("sidecar smoke passed")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    main()
