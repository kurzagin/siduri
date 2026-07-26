import os
import re
from dataclasses import dataclass
from typing import List, Literal, Optional

# Default configurable Master aliases (lowercased for matching)
DEFAULT_MASTER_ALIASES = ["kur zagin", "master zagin", "zagin", "master"]


@dataclass
class IncomingMessage:
    """
    Normalized incoming message metadata.
    Guarantees raw input prefixes are stripped and speaker role is accurately resolved.
    """

    speaker_type: Literal["master", "viewer", "system", "unknown"]
    speaker_name: str
    message: str
    source: Literal["terminal", "twitch", "youtube", "internal"] = "terminal"


def _get_master_aliases(custom_aliases: Optional[List[str]] = None) -> List[str]:
    if custom_aliases:
        return [a.strip().lower() for a in custom_aliases if a.strip()]

    env_aliases = os.environ.get("MASTER_ALIASES", "")
    if env_aliases:
        return [a.strip().lower() for a in env_aliases.split(",") if a.strip()]

    return DEFAULT_MASTER_ALIASES


def parse_incoming_message(
    raw_input: str,
    source: Literal["terminal", "twitch", "youtube", "internal"] = "terminal",
    master_aliases: Optional[List[str]] = None,
) -> Optional[IncomingMessage]:
    """
    Parses and normalizes raw terminal or chat stream input into a structured IncomingMessage.
    Strips raw terminal prompt decorations (chat>, chat:) and resolves speaker identity.
    """
    if not raw_input or not isinstance(raw_input, str):
        return None

    line = raw_input.strip()

    # Strip repeated leading prompt decorations (e.g. "chat>", ">")
    while True:
        prev = line
        line = re.sub(r"^(?:chat\s*>\s*|>)+", "", line, flags=re.IGNORECASE).strip()
        if line == prev:
            break

    if not line:
        return None

    aliases = _get_master_aliases(master_aliases)

    # Check for colon-separated speaker format: "chat username: message", "username: message", or "chat: message"
    if ":" in line:
        parts = line.split(":", 1)
        prefix = parts[0].strip()
        body = parts[1].strip()

        if not body:
            return None

        prefix_lower = prefix.lower()
        if prefix_lower == "chat":
            # "chat: message" -> anonymous viewer
            return IncomingMessage(
                speaker_type="viewer",
                speaker_name="anonymous",
                message=body,
                source=source,
            )

        # Strip leading "chat " from prefix if present (e.g., "chat Kur Zagin" -> "Kur Zagin")
        clean_name = re.sub(r"^chat\s+", "", prefix, flags=re.IGNORECASE).strip()
        clean_name_lower = clean_name.lower()

        if clean_name_lower in aliases:
            return IncomingMessage(
                speaker_type="master",
                speaker_name=clean_name if clean_name else "Kur Zagin",
                message=body,
                source=source,
            )
        else:
            return IncomingMessage(
                speaker_type="viewer",
                speaker_name=clean_name if clean_name else "anonymous",
                message=body,
                source=source,
            )

    # Terminal default: un-prefixed lines typed by solo host are from Master (Kur Zagin)
    if source == "terminal":
        return IncomingMessage(
            speaker_type="master",
            speaker_name="Kur Zagin",
            message=line,
            source=source,
        )

    # External source without explicit colon speaker tag -> viewer
    return IncomingMessage(
        speaker_type="viewer",
        speaker_name="anonymous",
        message=line,
        source=source,
    )
