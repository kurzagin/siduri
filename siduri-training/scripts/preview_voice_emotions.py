"""
Manual Voice Preview Utility for Siduri (Nurse Robot Type T / ナースロボ＿タイプＴ).
Synthesizes and saves 1 WAV sample per emotion into scratch/voice_previews/
and plays them sequentially for ear-tuning preset parameters.
"""

import os
import sys

# Ensure UTF-8 output on Windows terminal
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure siduri root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Load .env
_env_path = os.path.join(PROJECT_ROOT, ".env")
if os.path.isfile(_env_path):
    with open(_env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

from outputs.voice.presets import EMOTION_PRESETS, get_voice_preset
from outputs.voice.voicevox_client import VOICEVOX_BASE_URL, VoicevoxClient

# Sample lines per emotion
PREVIEW_SAMPLES = {
    "neutral": "状況を確認しました。問題ありません。",
    "happy": "それは良い知らせですね、マスター。",
    "excited": "マスター、星五です！ 本当に出ましたよ！",
    "surprised": "待ってください。今のは予想していませんでした。",
    "laughing": "ふふっ、それはさすがに見逃せませんね。",
    "annoyed": "その発言は、あまり感心しませんね。",
    "sad": "……残念でしたね。私も、少し悔しいです。",
    "fearful": "マスター、何かがおかしいです。",
    "whispering": "マスター、内緒のお話ですが……秘密ですよ。",
}

OUTPUT_DIR = os.path.join(PROJECT_ROOT, "scratch", "voice_previews")


def generate_and_preview_samples():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    client = VoicevoxClient(base_url=VOICEVOX_BASE_URL)

    print("==========================================================")
    print("      SIDURI VOICEVOX EMOTION PREVIEW GENERATOR          ")
    print(f" Output Directory: {OUTPUT_DIR}")
    print(f" VOICEVOX Engine : {VOICEVOX_BASE_URL}")
    print("==========================================================\n")

    for emotion, text in PREVIEW_SAMPLES.items():
        preset = get_voice_preset(emotion)
        speaker_id = client.resolve_speaker_id(preset)
        out_filename = os.path.join(OUTPUT_DIR, f"{emotion}.wav")

        print(f"[{emotion}] Style: {preset.style_name} (ID: {speaker_id})")
        print(f"  Prosody : speed={preset.speed_scale}, pitch={preset.pitch_scale}, intonation={preset.intonation_scale}, vol={preset.volume_scale}")
        print(f"  Text    : {text}")

        try:
            wav_bytes = client.synthesize(text, preset)
            with open(out_filename, "wb") as f:
                f.write(wav_bytes)
            print(f"  Saved to: {out_filename}")

            if sys.platform == "win32":
                import winsound
                winsound.PlaySound(wav_bytes, winsound.SND_MEMORY)
                print("  Played audio preview.")

        except Exception as e:
            print(f"  [VOICEVOX Warning] Could not synthesize '{emotion}': {type(e).__name__} - {e}")

        print()

    print("==========================================================")
    print(" Voice previews complete!")
    print("==========================================================")


if __name__ == "__main__":
    generate_and_preview_samples()
