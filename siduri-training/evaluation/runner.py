import glob
import json
import os
import re
import time
from typing import Any, Dict, List, Optional

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Load .env
_env_path = os.path.join(PROJECT_ROOT, ".env")
if os.path.isfile(_env_path):
    with open(_env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

from core.events import Event
from core.reactor import react, reset_history
from core.speaker_parser import parse_incoming_message
from outputs.llm.llm_client import get_reaction, load_reaction_profile, translate_subtitle


def redact_secrets(val: Any) -> Any:
    """Redacts API keys and sensitive environment credentials from logs and output files."""
    if isinstance(val, str):
        # Redact 32+ char hex/alphanumeric API keys
        val = re.sub(r"(?i)(key|secret|token|password)=['\"]?[a-zA-Z0-9.\-_]{20,}['\"]?", r"\1=[REDACTED]", val)
        val = re.sub(r"[a-f0-9]{32}\.[a-zA-Z0-9_\-]{16,}", "[REDACTED_API_KEY]", val)
        val = re.sub(r"sk-[a-zA-Z0-9]{32,}", "[REDACTED_API_KEY]", val)
        return val
    elif isinstance(val, dict):
        return {k: redact_secrets(v) for k, v in val.items() if "key" not in k.lower() and "secret" not in k.lower()}
    elif isinstance(val, list):
        return [redact_secrets(v) for v in val]
    return val


def load_all_cases(suite_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """Loads all test case definitions from evaluation/cases/*.json."""
    cases_dir = os.path.join(PROJECT_ROOT, "evaluation", "cases")
    json_files = glob.glob(os.path.join(cases_dir, "*.json"))
    all_cases = []

    for file_path in sorted(json_files):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        if not suite_filter or item.get("suite") == suite_filter:
                            all_cases.append(item)
        except Exception as e:
            print(f"[EvalRunner Warning] Could not load case file {file_path}: {e}")

    return all_cases


def load_configs(config_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """Loads experimental evaluation configuration matrix."""
    path = config_path or os.path.join(PROJECT_ROOT, "evaluation", "configs.json")
    if not os.path.isfile(path):
        return [
            {
                "id": "config_b",
                "name": "Default Configuration B",
                "model": "glm-4.7-flash",
                "thinking": "disabled",
                "temperature": 0.72,
                "top_p": 0.95,
                "speaker_meta_enabled": True,
            }
        ]

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


class EvalRunner:
    """
    Executes multi-turn conversation simulations against configured GLM models,
    maintaining structured turn roles, checkpointing, and logging safe request data.
    """

    def __init__(self, run_dir: str, mock_mode: bool = False):
        self.run_dir = run_dir
        self.mock_mode = mock_mode
        self.request_log_path = os.path.join(run_dir, "request-log.jsonl")
        self.response_log_path = os.path.join(run_dir, "response-log.jsonl")
        self.checkpoint_path = os.path.join(run_dir, "results_checkpoint.json")

    def _log_jsonl(self, path: str, record: Dict[str, Any]):
        redacted = redact_secrets(record)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(redacted, ensure_ascii=False) + "\n")

    def run_multi_turn_simulation(
        self,
        case: Dict[str, Any],
        config: Dict[str, Any],
        generation_num: int,
        mock_fn=None,
    ) -> Dict[str, Any]:
        """
        Simulates a complete multi-turn conversation for a single test case.
        Preserves assistant API role for earlier Siduri turns and user API role for Master/Viewer turns.
        """
        reset_history()

        turns_spec = case.get("turns", [])
        turn_results = []

        # Override temperature in environment during run
        orig_temp = os.environ.get("LLM_TEMPERATURE")
        os.environ["LLM_TEMPERATURE"] = str(config.get("temperature", 0.72))

        try:
            for turn_idx, turn_spec in enumerate(turns_spec):
                speaker_type = turn_spec.get("speaker_type", "viewer")
                speaker_name = turn_spec.get("speaker_name", "anonymous")
                message = turn_spec.get("message", "")

                # If turn spec provides pre-baked Siduri turn in multi-turn fixture
                if speaker_type == "siduri":
                    # Append preset Siduri turn to history
                    turn_results.append({
                        "role": "assistant",
                        "speaker_type": "siduri",
                        "speaker_name": "Siduri",
                        "message": message,
                        "text_ja": turn_spec.get("text_ja", message),
                        "text_en": turn_spec.get("text_en", message),
                        "emotion": turn_spec.get("emotion", "neutral"),
                    })
                    continue

                t0 = time.time()

                # Log redacted request
                req_record = {
                    "timestamp": time.time(),
                    "case_id": case.get("id"),
                    "config_id": config.get("id"),
                    "generation_num": generation_num,
                    "turn_idx": turn_idx,
                    "speaker_type": speaker_type,
                    "speaker_name": speaker_name,
                    "message": message,
                    "model": config.get("model", "glm-4.7-flash"),
                    "temperature": config.get("temperature", 0.72),
                }
                self._log_jsonl(self.request_log_path, req_record)

                if self.mock_mode or mock_fn:
                    if mock_fn:
                        reaction = mock_fn(message, speaker_type, speaker_name)
                    else:
                        reaction = {
                            "intent": "question",
                            "target": "general",
                            "hostility": "none",
                            "emotion": "neutral",
                            "text": "はい、承知いたしました。[MOCK]",
                            "text_en": "Yes, understood. [MOCK]",
                        }
                else:
                    # Live GLM reaction call with retry handling
                    event = Event(
                        type="chat_message",
                        payload={
                            "message": message,
                            "user": speaker_name,
                            "speaker_role": "master" if speaker_type == "master" else "viewer",
                            "speaker_type": speaker_type,
                        },
                    )
                    reaction = react(event)

                latency_ms = (time.time() - t0) * 1000.0

                resp_record = {
                    "timestamp": time.time(),
                    "case_id": case.get("id"),
                    "config_id": config.get("id"),
                    "generation_num": generation_num,
                    "turn_idx": turn_idx,
                    "reaction": reaction,
                    "latency_ms": latency_ms,
                }
                self._log_jsonl(self.response_log_path, resp_record)

                turn_results.append({
                    "role": "user",
                    "speaker_type": speaker_type,
                    "speaker_name": speaker_name,
                    "message": message,
                    "reaction": reaction,
                    "latency_ms": latency_ms,
                })

            final_rx = turn_results[-1].get("reaction", {}) if turn_results else {}
            return {
                "case_id": case.get("id"),
                "suite": case.get("suite", "general"),
                "config_id": config.get("id"),
                "generation_num": generation_num,
                "turns": turn_results,
                "final_reaction": final_rx,
                "expectations": case.get("expectations", {}),
            }

        finally:
            if orig_temp is not None:
                os.environ["LLM_TEMPERATURE"] = orig_temp
            else:
                os.environ.pop("LLM_TEMPERATURE", None)
