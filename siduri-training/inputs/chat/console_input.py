"""
Phase 1 chat source: typed terminal input loop.
Normalizes incoming raw strings using parse_incoming_message to guarantee
structured speaker metadata before building Events.
"""

from core.events import Event
from core.speaker_parser import parse_incoming_message


def console_chat_loop(on_event):
    """on_event: a callback that takes an Event and handles it."""
    print("Siduri is ready. Type a message and press Enter (Ctrl+C to quit).")
    print("  Lines are from Master by default.")
    print("  Prefix with 'chat:' or 'chat username:' to simulate a viewer.\n")
    while True:
        try:
            raw = input("chat> ").strip()
            if not raw:
                continue

            incoming = parse_incoming_message(raw, source="terminal")
            if not incoming or not incoming.message:
                continue

            event = Event(
                type="chat_message",
                payload={
                    "message": incoming.message,
                    "user": incoming.speaker_name,
                    "speaker_role": incoming.speaker_type if incoming.speaker_type in ("master", "viewer") else ("host" if incoming.speaker_type == "master" else "viewer"),
                    "speaker_type": incoming.speaker_type,
                    "source": incoming.source,
                },
            )

            on_event(event)
        except KeyboardInterrupt:
            print("\nBye!")
            break
