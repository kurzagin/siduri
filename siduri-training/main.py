import os
import sys

# Ensure UTF-8 output on Windows terminal
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Load .env file (if present) before any project imports, so env vars
# are available when llm_client.py initializes at import time.
_env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.isfile(_env_path):
    with open(_env_path, encoding="utf-8") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _, _val = _line.partition("=")
                os.environ.setdefault(_key.strip(), _val.strip())

from inputs.chat.console_input import console_chat_loop
from core.reactor import react
from outputs.voice.tts_client import speak


def handle_event(event):
    reaction = react(event)
    speak(
        text=reaction.get("text", ""),
        text_en=reaction.get("text_en", ""),
        emotion=reaction.get("emotion", "neutral"),
    )
    # Later: also call outputs/avatar/avatar_client.trigger_expression(reaction["emotion"])


def main():
    console_chat_loop(on_event=handle_event)


if __name__ == "__main__":
    main()
