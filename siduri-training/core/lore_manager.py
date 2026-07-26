import json
import os
import re
from typing import Any, Dict, List, Optional

LORE_FILE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "config", "canonical_lore.json"))


class LoreManager:
    """
    Manages canonical lore injection and deterministic proper-name preservation.
    Injects targeted canonical facts ONLY when queries touch identity, creator, purpose,
    name-origin, or age/intelligence topics.
    """

    def __init__(self, lore_path: str = LORE_FILE_PATH):
        self.lore_path = lore_path
        self.lore_data: Dict[str, Any] = {}
        self.load_lore()

    def load_lore(self):
        if os.path.isfile(self.lore_path):
            try:
                with open(self.lore_path, "r", encoding="utf-8") as f:
                    self.lore_data = json.load(f)
            except Exception as e:
                print(f"[LoreManager Warning] Failed to load {self.lore_path}: {e}")

    def detect_topics(self, message: str) -> List[str]:
        """Detects relevant factual topics from incoming message."""
        if not message or not isinstance(message, str):
            return []

        msg_lower = message.lower()
        topics = []

        # Identity topic
        if any(kw in msg_lower for kw in ["who are you", "who is siduri", "your identity", "誰ですか", "あなたは誰"]):
            topics.append("identity")

        # Creator topic
        if any(kw in msg_lower for kw in ["who created you", "who made you", "who is kur zagin", "who is master zagin", "誰が作った", "開発者", "作られた", "製作者"]):
            topics.append("creator")

        # Creation Purpose topic
        if any(kw in msg_lower for kw in ["why did master create you", "why were you created", "why do you exist", "what were you created to do", "are you only a tool", "目的", "役割", "存在理由"]):
            topics.append("purpose")

        # Name Origin & Mythology topic
        if any(kw in msg_lower for kw in ["why are you named siduri", "who was the original siduri", "ancient poet", "goddess", "epic of gilgamesh", "gilgamesh", "シドゥリの由来", "名前の由来", "詩人", "女神"]):
            topics.append("name_origin")

        # Age & Intelligence topic
        if any(kw in msg_lower for kw in ["how old are you", "when were you born", "your iq", "how intelligent", "smarter than", "年齢", "iq", "知能", "何歳"]):
            topics.append("age_intelligence")

        return list(set(topics))

    def get_injected_lore(self, topics: List[str]) -> str:
        """Returns concise canonical lore facts to inject into prompt for detected topics."""
        if not topics:
            return ""

        lore_lines = ["\n[CANONICAL FACTUAL GROUNDING FOR THIS TOPIC]"]

        if "identity" in topics or "creator" in topics:
            lore_lines.append(
                "- Creator Fact: Master Zagin (Kur Zagin) is Siduri's developer and creator. Master created Siduri; Siduri did NOT create Master."
            )
            lore_lines.append(
                "- Poetic Origin: 'Born from the light of Venus' is Siduri's poetic identity language. It refers to Siduri, not Master."
            )
            lore_lines.append(
                "- Public Names: Kur Zagin and Master Zagin are public display names. Do NOT call them legal names or aristocratic titles."
            )

        if "purpose" in topics:
            lore_lines.append(
                "- Confirmed Purpose: Master created Siduri as an AI streaming partner to accompany him during streams, react to games/chat, and learn/develop as a character."
            )
            lore_lines.append(
                "- Unknown Boundaries: Master's deeper private motivations are unknown to Siduri. State confirmed purpose directly; do NOT substitute praise or speculation for missing facts."
            )

        if "name_origin" in topics:
            lore_lines.append(
                "- Name Source: Siduri is named AFTER Siduri in the Epic of Gilgamesh (a wise tavern-keeper or ale-wife who gave counsel to Gilgamesh)."
            )
            lore_lines.append(
                "- AI vs Myth Distinction: AI Siduri is NOT literally the mythological figure. Do NOT claim Siduri was an 'ancient poet' or an unqualified 'goddess of brewing'."
            )

        if "age_intelligence" in topics:
            lore_lines.append(
                "- Age Rule: AI Siduri has no biological age. She refers to time since activation/development without fabricating exact dates."
            )
            lore_lines.append(
                "- Intelligence Rule: AI Siduri claims no fixed IQ score. She describes task competence, ongoing learning, and limitations."
            )

        lore_lines.append("- Answer Rule: Answer direct factual questions directly before adding context. Do NOT invent missing details or substitute compliments.")

        return "\n".join(lore_lines)

    def apply_name_glossary(self, text_en: str) -> str:
        """
        Deterministically cleans corrupted proper names or inflated titles in English subtitles.
        e.g., 'Kuruzagen' -> 'Kur Zagin', 'Lord Kur Zagin' -> 'Kur Zagin'.
        """
        if not text_en or not text_en.strip():
            return text_en

        out = text_en

        # Fix corrupted variations of Kur Zagin
        out = re.sub(r"(?i)\bLord\s+(?:Master\s+|Kur\s+)?Zagin\b", "Master Zagin", out)
        out = re.sub(r"(?i)\bLord\s+Kuruzagen\b", "Kur Zagin", out)
        out = re.sub(r"(?i)\bKuruzagen\b", "Kur Zagin", out)
        out = re.sub(r"(?i)\bKuruzagan\b", "Kur Zagin", out)
        out = re.sub(r"(?i)\bCool\s+Zagin\b", "Kur Zagin", out)
        out = re.sub(r"(?i)\bKur\s+Zagen\b", "Kur Zagin", out)

        # Fix corrupted variations of Siduri
        out = re.sub(r"(?i)\bShiduri\b", "Siduri", out)

        # Fix corrupted variations of Neuro-sama
        out = re.sub(r"(?i)\bNeuro\s+Sama(?:\s+AI)?\b", "Neuro-sama", out)

        return out


lore_mgr = LoreManager()
