"""
The reactor is the traffic controller: given an Event, decide how Siduri responds to it.
Maintains recent conversation memory, irritation state decay, and repetition control.
"""

from typing import Any, Dict, List, Optional
from outputs.llm.llm_client import get_reaction, load_reaction_profile

_profile_cache = None
_history_buffer: List[Dict[str, Any]] = []
_recent_responses: List[str] = []
MAX_HISTORY_TURNS = 8
MAX_RECENT_RESPONSES = 10


class IrritationManager:
    """
    Lightweight state manager for Siduri's irritation level (0: calm, 3: max annoyed).
    Escalates on repeated viewer insults; decays after neutral turns, praise, or Master intervention.
    """

    def __init__(self):
        self.level = 0

    def update(self, speaker_role: str, intent: str, hostility: str, emotion: str):
        if speaker_role in ("viewer", "unknown"):
            if hostility in ("high", "medium") or intent in ("insult", "criticism") or emotion == "annoyed":
                self.level = min(3, self.level + 1)
            elif intent in ("praise", "joke") or hostility == "none":
                self.level = max(0, self.level - 1)
        else:
            # Master speaking or neutral turn decays irritation
            self.level = max(0, self.level - 1)

    def reset(self):
        self.level = 0


irritation_mgr = IrritationManager()
_avoid_phrases: List[str] = []


def _profile():
    global _profile_cache
    if _profile_cache is None:
        _profile_cache = load_reaction_profile("config/reaction_profile.md")
    return _profile_cache


def reset_history():
    """Clears conversation history, irritation state, and repetition buffer (useful for tests)."""
    global _history_buffer, _recent_responses, _avoid_phrases
    _history_buffer = []
    _recent_responses = []
    _avoid_phrases = []
    irritation_mgr.reset()


def _detect_repetition(text_ja: str) -> bool:
    """Detects exact duplicate or repeated canned openings in recent responses."""
    if not text_ja:
        return False

    # Check exact match
    if text_ja in _recent_responses:
        return True

    # Check repeated phrase openings
    canned_phrases = [
        "マスター・ザギンが私を開発しました",
        "私はAIパートナーです",
        "評価を確認しました",
        "プログラムされています",
        "金星の光のもとに生まれた",
    ]
    for phrase in canned_phrases:
        if phrase in text_ja and any(phrase in prev for prev in _recent_responses[-3:]):
            return True

    return False


def react(event) -> Dict[str, Any]:
    """Takes an Event, returns a reaction dict with text, text_en, and emotion."""
    global _history_buffer, _recent_responses, _avoid_phrases

    message = event.payload.get("message", "")
    speaker_role = event.payload.get("speaker_role", event.payload.get("speaker_type", "viewer"))
    if speaker_role == "host":
        speaker_role = "master"
    user = event.payload.get("user", "anonymous")

    # 1. First reaction attempt
    reaction = get_reaction(
        message=message,
        profile_text=_profile(),
        speaker_role=speaker_role,
        user=user,
        history=_history_buffer,
        irritation_level=irritation_mgr.level,
        avoid_phrases=_avoid_phrases,
    )

    text_ja = reaction.get("text", "")

    # 2. Repetition detection & single regeneration retry if repeated phrase detected
    if _detect_repetition(text_ja):
        if text_ja not in _avoid_phrases:
            _avoid_phrases.append(text_ja)
        # Attempt one fresh regeneration using avoid_phrases context
        reaction = get_reaction(
            message=message,
            profile_text=_profile(),
            speaker_role=speaker_role,
            user=user,
            history=_history_buffer,
            irritation_level=irritation_mgr.level,
            avoid_phrases=_avoid_phrases,
        )
        text_ja = reaction.get("text", "")

    # Update recent responses tracking
    if text_ja:
        _recent_responses.append(text_ja)
        if len(_recent_responses) > MAX_RECENT_RESPONSES:
            _recent_responses.pop(0)

    # 3. Update irritation state manager
    irritation_mgr.update(
        speaker_role=speaker_role,
        intent=reaction.get("intent", "unknown"),
        hostility=reaction.get("hostility", "none"),
        emotion=reaction.get("emotion", "neutral"),
    )

    # 4. Append turn record to history buffer
    turn_record = {
        "user": user,
        "speaker_role": speaker_role,
        "message": message,
        "text_ja": text_ja,
        "text": text_ja,
        "text_en": reaction.get("text_en", ""),
        "emotion": reaction.get("emotion", "neutral"),
        "intent": reaction.get("intent", "unknown"),
        "target": reaction.get("target", "general"),
    }
    _history_buffer.append(turn_record)
    if len(_history_buffer) > MAX_HISTORY_TURNS:
        _history_buffer.pop(0)

    return reaction
