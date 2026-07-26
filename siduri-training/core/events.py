"""
Every input source (chat, donation, game, screen) produces an Event.
Every output consumer (LLM, voice, avatar) reacts to an Event.
This is the one shape that connects all of it - keep it stable as you add
new input/output types, don't fork it per-feature.
"""

from dataclasses import dataclass, field
from datetime import datetime


# Priority determines how urgently the reactor should handle this event.
# Higher number = more urgent = jumps the queue.
PRIORITY = {
    "donation": 100,
    "host_speech": 80,
    "chat_direct_mention": 60,
    "game_event": 40,
    "chat_message": 20,
    "screen_change": 10,
}


@dataclass
class Event:
    type: str          # one of the keys in PRIORITY, or a new type you add
    payload: dict       # e.g. {"message": "...", "user": "...", "amount": 5}
    priority: int = field(init=False)
    timestamp: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        self.priority = PRIORITY.get(self.type, 0)
