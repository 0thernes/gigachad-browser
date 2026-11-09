"""Backend evidence must distinguish configuration, loading, and network observation."""
import importlib.util
import os
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("sidecar_under_test", Path(__file__).resolve().parents[1] / "laya_sidecar.py")
sidecar = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sidecar)


class BackendTruthTests(unittest.TestCase):
    def test_configured_but_unloaded_embeddings_are_not_a_loaded_model(self):
        with patch.dict(os.environ, {"GIGACHAD_EMBED_MODEL": "fixture/unavailable"}), patch.object(sidecar, "_embedder", None):
            for result in (sidecar.embed_status(), sidecar.embed_texts(["hello"])):
                self.assertIsNone(result["model"])
                self.assertFalse(result["neural"])
                self.assertEqual(result["requested_model"], "fixture/unavailable")

    def test_configured_but_unloaded_ner_is_not_a_loaded_model(self):
        with patch.dict(os.environ, {"GIGACHAD_NER_MODEL": "fixture/unavailable"}), patch.object(sidecar, "_ner_model", None):
            for result in (sidecar.ner_status(), sidecar.evaluate_ner_pii({"text": "hello"})):
                self.assertIsNone(result["model"])
                self.assertFalse(result["neural"])

    def test_tts_health_does_not_load_packages_or_claim_unloaded_neural_voice(self):
        with patch.object(sidecar, "TEST_MODE", False), patch.object(sidecar, "_kokoro", None), patch.object(sidecar, "_try_import", side_effect=AssertionError("health imported model")):
            status = sidecar.tts_status()
            self.assertIsNone(status["model"])
            self.assertFalse(status["neural"])

    def test_unconfigured_tts_does_not_import_or_download_an_implicit_model(self):
        with patch.dict(os.environ, {"GIGACHAD_KOKORO_MODEL": "", "GIGACHAD_KOKORO_VOICE": ""}), patch.object(sidecar, "_try_import", side_effect=AssertionError("unconfigured import")):
            self.assertIsNone(sidecar._wav_b64_from_kokoro("hello"))

    def test_ordinary_pages_never_invent_onion_services_or_circuits(self):
        result = sidecar.evaluate_deep_dark_web_intel({"url": "https://example.com", "text": "Tor onion cryptography"})
        self.assertIsNone(result["tor_v3_onion_address"])
        self.assertIsNone(result["ipfs_merkle_cid_v1"])
        self.assertEqual(result["circuit_hops"], [])
        self.assertFalse(result["network_observed"])

    def test_valid_observed_onion_is_not_reachability_proof_and_corruption_is_rejected(self):
        valid = "duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion"
        invalid = "a" * 56 + ".onion"
        result = sidecar.evaluate_deep_dark_web_intel({"url": "http://" + valid, "text": invalid + " " + valid})
        self.assertEqual(result["tor_v3_onion_address"], valid)
        self.assertEqual(len(result["verified_page_onions"]), 2)
        self.assertTrue(result["verified_page_onions"][0]["checksum_valid"])
        self.assertFalse(result["verified_page_onions"][1]["checksum_valid"])
        self.assertEqual(result["verified_page_onions"][0]["reachability"], "not_checked")


if __name__ == "__main__":
    unittest.main()
