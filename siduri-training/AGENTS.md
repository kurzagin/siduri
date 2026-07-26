# AGENTS.md

Instructions for any AI agent (Claude Code, Cursor, etc.) working in this repo.

## What this project is

Siduri is an AI VTuber co-host. The person building this is a solo,
non-technical-by-trade streamer, so prioritize working code over clever
code, and prefer small, reviewable changes over large refactors.

## Architecture (do not restructure without being asked)

Everything flows: **inputs → core → outputs**.

- `inputs/<type>/` — things that PRODUCE an `Event` (chat, donation, game,
  screen). Each input source's only job is to build an `Event` and call
  `on_event(event)`. Never call the LLM or TTS directly from an input file.
- `core/events.py` — the `Event` dataclass. This is the shared contract
  every input/output depends on. Don't change its shape without updating
  every input source and the reactor together.
- `core/reactor.py` — the only place that decides how an event gets
  handled (which output(s) it triggers, full LLM reply vs cheap
  micro-reaction). If you're adding "smarter" behavior, it almost always
  belongs here, not in an input or output file.
- `outputs/<type>/` — things that CONSUME a reaction dict
  (`{"text": ..., "emotion": ...}`) and render it (LLM generation, TTS,
  avatar expression). Outputs don't know where events came from.
- `config/reaction_profile.md` — Siduri's personality. This is a content
  file, not code. If a change request is "make her react differently,"
  the fix is usually editing this file, not the Python.
- `main.py` — wires one input source to the reactor to the output(s).
  Keep this file thin; it should read like a table of contents, not
  contain logic.

## Current status

Only `inputs/chat/console_input.py` is implemented (typed chat →
reaction → spoken aloud via `outputs/voice/tts_client.py`). Every other
file under `inputs/` and `outputs/avatar/` is a stub containing only a
comment describing what it should eventually do. Do not implement a stub
unless explicitly asked to build that specific phase — the person is
working through this incrementally on purpose.

## Conventions

- Every new input source must emit `core.events.Event` objects with an
  appropriate `type` (add new types to the `PRIORITY` dict in
  `core/events.py` if needed, don't hardcode priority elsewhere).
- Every new output must accept a `{"text": str, "emotion": str}` dict.
  Valid `emotion` values are listed in `outputs/llm/llm_client.py`'s
  system prompt — keep that list and any output's emotion-handling code
  in sync if you add a new one.
- Python, stdlib + the packages already in `requirements.txt`. Ask before
  adding a new dependency; this person will need to `pip install` it
  manually.
- No frameworks (no Flask/FastAPI/etc.) unless a task explicitly needs a
  server — this stays a simple local script for as long as possible.

## Running it

```
pip install -r requirements.txt
export ANTHROPIC_API_KEY=your_key_here
python main.py        # run from inside the siduri/ folder
```

## When making changes

- Prefer editing one file over touching many. If a request seems to
  require changing `core/events.py` AND multiple inputs AND the reactor,
  stop and confirm the plan before writing code — that's a sign the
  request may be bigger than it looks.
- After changing anything in `core/`, sanity check every file under
  `inputs/` and `outputs/` still matches the contract (Event shape in,
  reaction dict out).
- Don't add error handling, logging frameworks, tests, or config systems
  beyond what's already here unless asked — this is a hobby project in
  early phases, not production infrastructure.
