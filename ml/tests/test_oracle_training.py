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
FIXTURES = Path(__file__).parents[2] / "test-fixtures/oracle-features.json"


def tablebase_key(case):
    current = case["currentPlayer"]
    opponent = "player2" if current == "player1" else "player1"
    current_squares = case[f"{current}Squares"]
    opponent_squares = case[f"{opponent}Squares"]
    tracks = {
        "player1": (3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13),
        "player2": (19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15),
    }
    key = current_squares.count(-1) << 28
    key |= opponent_squares.count(-1) << 25
    for index, bit in enumerate(oracle_tablebase.PRIVATE_BIT_ORDER):
        key |= int(tracks[current][(0, 1, 2, 3, 12, 13)[index]] in current_squares) << (19 + bit)
        key |= int(tracks[opponent][(0, 1, 2, 3, 12, 13)[index]] in opponent_squares) << bit

    raw_middle = 0
    for square in range(4, 12):
        occupant = 2 if square in current_squares else int(square in opponent_squares)
        raw_middle |= occupant << (2 * (square - 4))
    compressed = oracle_tablebase.middle_lane_states().index(raw_middle)
    return key | (compressed << 6)


class OracleTrainingTests(unittest.TestCase):
    def test_shared_feature_fixtures_match_tablebase_decoder(self):
        fixtures = json.loads(FIXTURES.read_text(encoding="utf-8"))
        self.assertEqual(fixtures["schemaVersion"], 1)
        for case in fixtures["cases"]:
            with self.subTest(case=case["name"]):
                self.assertEqual(
                    oracle_tablebase.decode_key(tablebase_key(case)),
                    tuple(case["expected"]),
                )

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
