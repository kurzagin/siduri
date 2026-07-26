"""
Unit tests for emotion-aware VOICEVOX speech synthesis, prosody presets,
runtime style discovery, fallback ID handling, availability cooldown, and recovery.
Runs 100% offline using HTTP mocks.
"""

import json
import os
import sys
import time
import unittest

# Ensure siduri root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from outputs.voice.availability import VoicevoxAvailability
from outputs.voice.presets import EMOTION_PRESETS, VoicePreset, get_voice_preset
from outputs.voice.voicevox_client import VoicevoxClient


class TestVoicevoxPresets(unittest.TestCase):

    def test_preset_mappings(self):
        self.assertEqual(get_voice_preset("neutral").style_name, "ノーマル")
        self.assertEqual(get_voice_preset("happy").style_name, "楽々")
        self.assertEqual(get_voice_preset("excited").style_name, "楽々")
        # Ensure surprised uses ノーマル (Normal), NOT 恐怖 (Fear)
        self.assertEqual(get_voice_preset("surprised").style_name, "ノーマル")
        self.assertEqual(get_voice_preset("laughing").style_name, "楽々")
        self.assertEqual(get_voice_preset("annoyed").style_name, "ノーマル")
        # Ensure sad uses ノーマル (Normal) with subdued prosody, NOT 内緒話 (Whisper)
        self.assertEqual(get_voice_preset("sad").style_name, "ノーマル")
        self.assertEqual(get_voice_preset("sad").speed_scale, 0.88)
        self.assertEqual(get_voice_preset("fearful").style_name, "恐怖")
        self.assertEqual(get_voice_preset("whispering").style_name, "内緒話")

    def test_case_and_whitespace_normalization(self):
        preset_upper = get_voice_preset("  HAPPY  ")
        self.assertEqual(preset_upper.style_name, "楽々")
        self.assertEqual(preset_upper.speed_scale, 1.04)

        preset_mixed = get_voice_preset("AnNoYeD")
        self.assertEqual(preset_mixed.style_name, "ノーマル")
        self.assertEqual(preset_mixed.pitch_scale, -0.03)

    def test_invalid_emotion_fallback(self):
        preset_invalid = get_voice_preset("invalid_emotion_xyz")
        self.assertEqual(preset_invalid, EMOTION_PRESETS["neutral"])

        preset_empty = get_voice_preset("")
        self.assertEqual(preset_empty, EMOTION_PRESETS["neutral"])

        preset_none = get_voice_preset(None)
        self.assertEqual(preset_none, EMOTION_PRESETS["neutral"])


class TestVoicevoxClient(unittest.TestCase):

    def setUp(self):
        self.client = VoicevoxClient(base_url="http://127.0.0.1:50021", character_name="ナースロボ＿タイプＴ")

    def test_apply_voice_preset(self):
        audio_query = {
            "accent_phrases": [],
            "speedScale": 1.0,
            "pitchScale": 0.0,
            "intonationScale": 1.0,
            "volumeScale": 1.0,
        }
        preset = EMOTION_PRESETS["excited"]
        modified = self.client.apply_voice_preset(audio_query, preset)

        self.assertEqual(modified["speedScale"], 1.12)
        self.assertEqual(modified["pitchScale"], 0.04)
        self.assertEqual(modified["intonationScale"], 1.28)
        self.assertEqual(modified["volumeScale"], 1.05)

    def test_runtime_style_discovery_and_normalization(self):
        mock_speakers_response = [
            {
                "name": "四国めたん",
                "styles": [{"name": "ノーマル", "id": 2, "type": "talk"}],
            },
            {
                "name": "ナースロボ_タイプT",  # Half-width variation
                "styles": [
                    {"name": "ノーマル", "id": 47, "type": "talk"},
                    {"name": "楽々", "id": 48, "type": "talk"},
                    {"name": "恐怖", "id": 49, "type": "talk"},
                    {"name": "内緒話", "id": 50, "type": "talk"},
                ],
            },
        ]

        def mock_fetch(method, url, data, timeout):
            if "speakers" in url:
                return mock_speakers_response
            raise ValueError(f"Unexpected mock URL {url}")

        styles = self.client.discover_styles(http_fetch_fn=mock_fetch)
        self.assertEqual(styles.get("ノーマル"), 47)
        self.assertEqual(styles.get("楽々"), 48)
        self.assertEqual(styles.get("恐怖"), 49)
        self.assertEqual(styles.get("内緒話"), 50)

    def test_fallback_style_id(self):
        # Client without discovered styles falls back to preset.fallback_style_id
        preset_happy = EMOTION_PRESETS["happy"]
        speaker_id = self.client.resolve_speaker_id(preset_happy)
        self.assertEqual(speaker_id, 48)

    def test_synthesis_same_speaker_id_used(self):
        mock_audio_query = {
            "speedScale": 1.0,
            "pitchScale": 0.0,
            "intonationScale": 1.0,
            "volumeScale": 1.0,
        }
        captured_requests = []

        def mock_fetch(method, url, data, timeout):
            captured_requests.append((method, url))
            if "audio_query" in url:
                return mock_audio_query
            elif "synthesis" in url:
                return b"RIFF_WAV_HEADER_MOCK_BYTES"
            raise ValueError(f"Unexpected mock URL {url}")

        preset = EMOTION_PRESETS["annoyed"]
        wav = self.client.synthesize("テスト", preset, http_fetch_fn=mock_fetch)

        self.assertEqual(wav, b"RIFF_WAV_HEADER_MOCK_BYTES")
        self.assertEqual(len(captured_requests), 2)
        # Ensure speaker=47 is present in both /audio_query and /synthesis URLs
        self.assertIn("speaker=47", captured_requests[0][1])
        self.assertIn("speaker=47", captured_requests[1][1])


class TestVoicevoxAvailability(unittest.TestCase):

    def test_cooldown_and_recovery(self):
        avail = VoicevoxAvailability(cooldown_seconds=10.0)
        self.assertTrue(avail.is_available)
        self.assertTrue(avail.should_attempt_request(current_time=100.0))

        # Record failure at t = 100
        avail.record_failure("ConnectionRefusedError", base_url="http://127.0.0.1:50021", current_time=100.0)
        self.assertFalse(avail.is_available)

        # During cooldown (t = 105), should NOT attempt request
        self.assertFalse(avail.should_attempt_request(current_time=105.0))

        # After cooldown (t = 111), SHOULD attempt request
        self.assertTrue(avail.should_attempt_request(current_time=111.0))

        # On successful response, recovers state
        avail.record_success()
        self.assertTrue(avail.is_available)


if __name__ == "__main__":
    unittest.main()
