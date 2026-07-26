# Siduri

## Folder structure

```
siduri/
  config/
    reaction_profile.md   <- her personality, edit this a lot
  core/
    events.py              <- the Event shape every input/output shares
    reactor.py              <- decides how Siduri handles an event
  inputs/                  <- things that PRODUCE events
    chat/
      console_input.py      <- Phase 1: typed chat (working now)
      twitch_listener.py     <- Phase 2: real Twitch chat (stub)
    donation/
      donation_listener.py   <- Phase 4: donation alerts (stub)
    game/
      game_state.py           <- Phase 5: game knowledge (stub)
    screen/
      screen_watcher.py        <- Phase 5: screen knowledge (stub)
  outputs/                  <- things that CONSUME a reaction
    llm/
      llm_client.py            <- generates {text, emotion}
    voice/
      tts_client.py             <- speaks it (working now)
    avatar/
      avatar_client.py           <- Phase 2: expression triggers (stub)
  main.py
  requirements.txt
```

## Why it's shaped this way

Every input source turns whatever happens (a chat message, a donation, a
game moment) into the same `Event` object from `core/events.py`. The
`reactor` decides what to do with an event. Every output just renders
whatever reaction comes out.

This means adding a feature is almost always "add one file in `inputs/` or
`outputs/`", not "rewire the whole pipeline":
- Real Twitch chat → fill in `inputs/chat/twitch_listener.py`, swap the
  import in `main.py`. Nothing else changes.
- Donations → fill in `inputs/donation/donation_listener.py`, run it
  alongside the chat listener, feed events into the same `handle_event`.
- Avatar → fill in `outputs/avatar/avatar_client.py`, call it from
  `handle_event` in `main.py` next to `speak()`.
- Micro-reactions vs full LLM replies → that split happens entirely inside
  `core/reactor.py`. Inputs and outputs never need to know it exists.

## Setup

1. `pip install -r requirements.txt`
2. `export ANTHROPIC_API_KEY=your_key_here`
3. Fill out `config/reaction_profile.md`
4. `python main.py`, run from the `siduri/` folder so the relative imports
   resolve correctly

## Current status

Phase 1 only: `inputs/chat/console_input.py` -> `core/reactor.py` ->
`outputs/llm/llm_client.py` -> `outputs/voice/tts_client.py`.
Every other file in `inputs/` and `outputs/avatar/` is a stub with notes on
what goes there - don't build them yet, they're placeholders so the
structure doesn't need to change shape later.
