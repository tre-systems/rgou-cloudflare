import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).parents[1] / "scripts/oracle_tablebase.py"
SPEC = importlib.util.spec_from_file_location("oracle_tablebase", SCRIPT)
assert SPEC and SPEC.loader
oracle_tablebase = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = oracle_tablebase
SPEC.loader.exec_module(oracle_tablebase)


class OracleTrainingTests(unittest.TestCase):
    def test_decodes_initial_state_from_tablebase_key(self):
        key = (7 << 28) | (7 << 25)
        features = oracle_tablebase.decode_key(key)

        self.assertEqual(features[:28], (0.0,) * 28)
        self.assertEqual(features[28:], (1, 1, 0, 0))

    def test_decodes_canonical_private_shared_and_score_features(self):
        middle_states = oracle_tablebase.middle_lane_states()
        raw_middle = 2 | (1 << 2)
        compressed = middle_states.index(raw_middle)
        key = (1 << (19 + 3)) | (1 << 3) | (compressed << 6) | (5 << 28) | (5 << 25)

        features = oracle_tablebase.decode_key(key)

        self.assertEqual(features[0], 1)
        self.assertEqual(features[6], 1)
        self.assertEqual(features[12], 1)
        self.assertEqual(features[20], 0)
        self.assertEqual(features[13], 0)
        self.assertEqual(features[21], 1)
        self.assertEqual(features[28:], (5 / 7, 5 / 7, 0, 0))

    def test_validates_tablebase_header_and_rules(self):
        header = json.dumps(
            {"author": "test", "game_settings": oracle_tablebase.EXPECTED_SETTINGS},
            separators=(",", ":"),
        ).encode()
        entries = [(0, 32768), (1, 65535)]
        content = bytearray(b"RGU\0")
        content.extend(len(header).to_bytes(4, "big", signed=True))
        content.extend(header)
        content.extend((1).to_bytes(4, "big", signed=True))
        content.extend(len(entries).to_bytes(4, "big", signed=True))
        for key, _ in entries:
            content.extend(key.to_bytes(4, "big"))
        for _, value in entries:
            content.extend(value.to_bytes(2, "big"))

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "test.rgu"
            path.write_bytes(content)
            layout = oracle_tablebase.parse_tablebase(path)

        self.assertEqual(layout.entry_count, 2)
        self.assertEqual(layout.metadata["game_settings"], oracle_tablebase.EXPECTED_SETTINGS)


if __name__ == "__main__":
    unittest.main()
