# TODO (later phase): replace console_input.py with this for real streaming.
#
# Should connect to Twitch IRC (e.g. via the `twitchio` library) and, for
# each incoming message, build the same Event shape console_input.py uses:
#
#   from core.events import Event
#   event = Event(type="chat_message", payload={"message": msg, "user": author})
#   on_event(event)
#
# Keep the Event shape identical to console_input.py's so main.py and the
# reactor don't need to change when you swap this in.
