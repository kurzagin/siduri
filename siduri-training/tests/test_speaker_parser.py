"""
Unit tests for core/speaker_parser.py.
Verifies speaker normalization, decoration stripping, Master aliases,
viewer usernames with spaces or 'chat', and malformed input handling.
"""

import os
import sys
import unittest

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from core.speaker_parser import IncomingMessage, parse_incoming_message


class TestSpeakerParser(unittest.TestCase):

    def test_terminal_default_master_message(self):
        msg = parse_incoming_message("Siduri, please be polite")
        self.assertIsNotNone(msg)
        self.assertEqual(msg.speaker_type, "master")
        self.assertEqual(msg.speaker_name, "Kur Zagin")
        self.assertEqual(msg.message, "Siduri, please be polite")

    def test_ambiguous_prefix_master_message(self):
        msg = parse_incoming_message("chat> chat Kur Zagin: Siduri, please be polite")
        self.assertIsNotNone(msg)
        self.assertEqual(msg.speaker_type, "master")
        self.assertEqual(msg.speaker_name, "Kur Zagin")
        self.assertEqual(msg.message, "Siduri, please be polite")

    def test_master_aliases(self):
        aliases_to_test = ["Kur Zagin", "Master Zagin", "Zagin", "Master"]
        for alias in aliases_to_test:
            msg = parse_incoming_message(f"chat {alias}: hello there")
            self.assertIsNotNone(msg)
            self.assertEqual(msg.speaker_type, "master", f"Failed for alias {alias}")
            self.assertEqual(msg.message, "hello there")

    def test_terminal_viewer_message(self):
        msg = parse_incoming_message("chat> chat viewer123: nice play")
        self.assertIsNotNone(msg)
        self.assertEqual(msg.speaker_type, "viewer")
        self.assertEqual(msg.speaker_name, "viewer123")
        self.assertEqual(msg.message, "nice play")

    def test_anonymous_viewer_message(self):
        msg = parse_incoming_message("chat: nice play dude")
        self.assertIsNotNone(msg)
        self.assertEqual(msg.speaker_type, "viewer")
        self.assertEqual(msg.speaker_name, "anonymous")
        self.assertEqual(msg.message, "nice play dude")

    def test_viewer_username_with_spaces(self):
        msg = parse_incoming_message("chat Some Cool Viewer: nice play")
        self.assertIsNotNone(msg)
        self.assertEqual(msg.speaker_type, "viewer")
        self.assertEqual(msg.speaker_name, "Some Cool Viewer")
        self.assertEqual(msg.message, "nice play")

    def test_viewer_username_containing_chat(self):
        msg = parse_incoming_message("chat chat_king: hello world")
        self.assertIsNotNone(msg)
        self.assertEqual(msg.speaker_type, "viewer")
        self.assertEqual(msg.speaker_name, "chat_king")
        self.assertEqual(msg.message, "hello world")

    def test_duplicate_prompt_prefixes(self):
        msg = parse_incoming_message("chat> chat> > chat Kur Zagin: hello")
        self.assertIsNotNone(msg)
        self.assertEqual(msg.speaker_type, "master")
        self.assertEqual(msg.speaker_name, "Kur Zagin")
        self.assertEqual(msg.message, "hello")

    def test_malformed_and_empty_inputs(self):
        self.assertIsNone(parse_incoming_message(""))
        self.assertIsNone(parse_incoming_message("   "))
        self.assertIsNone(parse_incoming_message("chat:"))
        self.assertIsNone(parse_incoming_message("chat> chat> "))
        self.assertIsNone(parse_incoming_message(None))


if __name__ == "__main__":
    unittest.main()
