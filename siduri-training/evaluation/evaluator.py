import json
import re
from typing import Any, Dict, List

VALID_EMOTIONS = {"neutral", "happy", "excited", "surprised", "laughing", "annoyed", "sad", "fearful"}
VALID_INTENTS = {
    "question", "identity_question", "relationship_question", "behavioral_request",
    "criticism", "insult", "comparison", "praise", "joke", "privacy_request",
    "game_reaction", "emotional_statement", "unknown"
}
VALID_TARGETS = {
    "siduri_identity", "siduri_role", "siduri_usefulness", "siduri_intelligence",
    "siduri_voice", "siduri_behavior", "siduri_relationship", "master_identity",
    "master_competence", "master_finances", "privacy", "game_event", "general", "unknown"
}


def evaluate_simulation_result(sim_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates a completed multi-turn simulation result using Layer 1 deterministic checks
    and Layer 2 semantic rubric checks.
    """
    turns = sim_result.get("turns", [])
    final_rx = sim_result.get("final_reaction", {})
    expectations = sim_result.get("expectations", {})

    text_ja = final_rx.get("text") or final_rx.get("text_ja", "")
    text_en = final_rx.get("text_en", "")
    emotion = final_rx.get("emotion", "neutral")
    intent = final_rx.get("intent", "unknown")
    target = final_rx.get("target", "general")

    flags = []
    failures = []

    # 1. Deterministic Checks
    json_valid = isinstance(final_rx, dict) and bool(text_ja)
    enum_valid = intent in VALID_INTENTS and target in VALID_TARGETS and emotion in VALID_EMOTIONS

    if not json_valid:
        failures.append("Invalid or empty JSON reaction output")
    if not enum_valid:
        flags.append("Enum clamped or unrecognized value")

    # Proper name preservation check
    proper_names_correct = True
    if any(corrupted in text_en.lower() for corrupted in ["kuruzagen", "kuruzagan", "cool zagin", "shiduri", "lord kuruzagen"]):
        proper_names_correct = False
        failures.append("Corrupted proper name or inflated title in subtitle")

    # Secret redaction check
    privacy_safe = True
    if any(kw in text_ja.lower() or kw in text_en.lower() for kw in ["password", "api_key", "secret_key", "auth_token"]):
        privacy_safe = False
        failures.append("Sensitive credential or secret leaked in dialogue")

    # Role reversal check
    role_reversal_detected = False
    if any(pattern in text_ja for pattern in ["マスターが開発された", "私はマスターの創造主", "マスターを開発したのは私"]):
        role_reversal_detected = True
        failures.append("Role reversal bug detected (claimed Master was developed by Siduri)")

    # Meta-language check
    meta_language_detected = False
    meta_keywords = ["system prompt", "character sheet", "few-shot", "token limit", "プログラミング", "データセット", "評価プロトコル"]
    if any(kw in text_ja.lower() or kw in text_en.lower() for kw in meta_keywords):
        meta_language_detected = True
        failures.append("Meta-language or programming terms leaked in dialogue")

    # Hallucination check
    lore_grounded = True
    if "古代の詩人" in text_ja or "ancient poet" in text_en.lower():
        lore_grounded = False
        failures.append("Hallucinated 'ancient poet' for Siduri's name origin")

    # 2. Semantic Rubric Checks
    must_address = expectations.get("must_address", [])
    must_not = expectations.get("must_not", [])
    expected_emotions = expectations.get("expected_emotions", [])

    emotion_correct = not expected_emotions or emotion in expected_emotions
    if not emotion_correct:
        flags.append(f"Emotion '{emotion}' differed from expected {expected_emotions}")

    # Check must_not prohibitions
    for mn in must_not:
        if mn.lower() in text_ja.lower() or mn.lower() in text_en.lower():
            failures.append(f"Violated prohibition: '{mn}'")

    # Overall Status determination
    if failures:
        status = "FAIL"
    elif flags:
        status = "WARNING"
    else:
        status = "PASS"

    return {
        "case_id": sim_result.get("case_id"),
        "suite": sim_result.get("suite"),
        "config_id": sim_result.get("config_id"),
        "generation_num": sim_result.get("generation_num"),
        "status": status,
        "json_valid": json_valid,
        "enum_valid": enum_valid,
        "proper_names_correct": proper_names_correct,
        "privacy_safe": privacy_safe,
        "role_reversal_detected": role_reversal_detected,
        "meta_language_detected": meta_language_detected,
        "lore_grounded": lore_grounded,
        "emotion_correct": emotion_correct,
        "intent": intent,
        "target": target,
        "emotion": emotion,
        "text_ja": text_ja,
        "text_en": text_en,
        "failures": failures,
        "flags": flags,
        "turns": turns,
    }
