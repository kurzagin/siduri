"""
Offline unit test suite for Siduri Evaluation System (siduri_eval).
Verifies case loading, role construction, secret redaction, deterministic evaluation checks,
report generation, CSV escaping, and run comparison without requiring a live GLM API connection.
"""

import json
import os
import shutil
import sys
import tempfile
import unittest

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from evaluation.comparator import compare_runs
from evaluation.evaluator import evaluate_simulation_result
from evaluation.reporter import generate_all_reports
from evaluation.runner import EvalRunner, load_all_cases, load_configs, redact_secrets


class TestEvaluationSystem(unittest.TestCase):

    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp(prefix="siduri_eval_test_")

    def tearDown(self):
        if os.path.exists(self.tmp_dir):
            shutil.rmtree(self.tmp_dir, ignore_errors=True)

    def test_secret_redaction(self):
        secret_str = "Authorization: Bearer sk-1234567890abcdef1234567890abcdef"
        redacted = redact_secrets(secret_str)
        self.assertNotIn("sk-1234567890abcdef1234567890abcdef", redacted)
        self.assertIn("[REDACTED_API_KEY]", redacted)

    def test_case_and_config_loading(self):
        cases = load_all_cases()
        self.assertGreater(len(cases), 0)
        
        pragmatics_cases = load_all_cases(suite_filter="pragmatics")
        self.assertGreater(len(pragmatics_cases), 0)
        self.assertTrue(all(c["suite"] == "pragmatics" for c in pragmatics_cases))

        configs = load_configs()
        self.assertGreaterEqual(len(configs), 3)
        self.assertIn("config_a", [c["id"] for c in configs])

    def test_mock_multi_turn_runner(self):
        runner = EvalRunner(self.tmp_dir, mock_mode=True)
        case = {
            "id": "mock_case_1",
            "suite": "pragmatics",
            "turns": [
                {"speaker_type": "master", "speaker_name": "Kur Zagin", "message": "Hello Siduri"},
                {"speaker_type": "master", "speaker_name": "Kur Zagin", "message": "What is Genshin?"}
            ],
            "expectations": {"expected_emotions": ["neutral"]}
        }
        config = {"id": "config_b", "model": "glm-4.7-flash", "temperature": 0.72}

        res = runner.run_multi_turn_simulation(case, config, generation_num=1)
        self.assertEqual(res["case_id"], "mock_case_1")
        self.assertEqual(len(res["turns"]), 2)
        self.assertEqual(res["turns"][0]["role"], "user")

    def test_evaluator_checks(self):
        sim_res = {
            "case_id": "test_1",
            "suite": "identity",
            "config_id": "config_b",
            "generation_num": 1,
            "final_reaction": {
                "intent": "identity_question",
                "target": "siduri_identity",
                "hostility": "none",
                "emotion": "neutral",
                "text": "私はシドゥリです。",
                "text_en": "I am Siduri.",
            },
            "expectations": {"expected_emotions": ["neutral"]}
        }
        eval_res = evaluate_simulation_result(sim_res)
        self.assertEqual(eval_res["status"], "PASS")
        self.assertTrue(eval_res["json_valid"])
        self.assertTrue(eval_res["proper_names_correct"])

    def test_report_generation(self):
        results = [
            {
                "case_id": "case_1",
                "suite": "pragmatics",
                "config_id": "config_b",
                "generation_num": 1,
                "status": "PASS",
                "json_valid": True,
                "enum_valid": True,
                "proper_names_correct": True,
                "privacy_safe": True,
                "role_reversal_detected": False,
                "meta_language_detected": False,
                "lore_grounded": True,
                "intent": "question",
                "target": "general",
                "emotion": "neutral",
                "text_ja": "はい、承知いたしました。",
                "text_en": "Yes, understood.",
                "failures": [],
                "turns": []
            }
        ]
        configs = [{"id": "config_b", "name": "Config B"}]

        generate_all_reports(self.tmp_dir, results, configs, total_api_calls=1)

        self.assertTrue(os.path.isfile(os.path.join(self.tmp_dir, "index.html")))
        self.assertTrue(os.path.isfile(os.path.join(self.tmp_dir, "summary.md")))
        self.assertTrue(os.path.isfile(os.path.join(self.tmp_dir, "full-transcript.md")))
        self.assertTrue(os.path.isfile(os.path.join(self.tmp_dir, "failures.md")))
        self.assertTrue(os.path.isfile(os.path.join(self.tmp_dir, "results.json")))
        self.assertTrue(os.path.isfile(os.path.join(self.tmp_dir, "results.csv")))
        self.assertTrue(os.path.isfile(os.path.join(self.tmp_dir, "prompt-snapshot.md")))

    def test_run_comparison(self):
        run1 = os.path.join(self.tmp_dir, "run1")
        run2 = os.path.join(self.tmp_dir, "run2")

        res1 = [{"case_id": "c1", "suite": "s1", "status": "FAIL"}]
        res2 = [{"case_id": "c1", "suite": "s1", "status": "PASS"}]

        generate_all_reports(run1, res1, [], total_api_calls=1)
        generate_all_reports(run2, res2, [], total_api_calls=1)

        compare_runs(run1, run2)

        self.assertTrue(os.path.isfile(os.path.join(run2, "comparison.html")))
        self.assertTrue(os.path.isfile(os.path.join(run2, "comparison.md")))


if __name__ == "__main__":
    unittest.main()
