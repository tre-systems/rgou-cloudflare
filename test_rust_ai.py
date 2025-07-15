#!/usr/bin/env python3

import json
import subprocess
import tempfile
import os


def test_rust_ai():
    rust_ai_path = "worker/rust_ai_core/target/release/rgou-ai-core"

    game_state = {
        "board": [None] * 21,
        "player1_pieces": [{"square": -1, "player": "player1"} for _ in range(7)],
        "player2_pieces": [{"square": -1, "player": "player2"} for _ in range(7)],
        "current_player": "player1",
        "dice_roll": 1,
        "valid_moves": [0, 1, 2, 3, 4, 5, 6],
    }

    print("Testing Rust AI...")
    print(f"Game state: {json.dumps(game_state, indent=2)}")

    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(game_state, f)
            temp_file = f.name

        result = subprocess.run(
            [rust_ai_path, "get_move", temp_file],
            capture_output=True,
            text=True,
            timeout=10,
        )

        os.unlink(temp_file)

        if result.returncode == 0:
            print(f"✅ get_move successful: {result.stdout}")
        else:
            print(f"❌ get_move failed: {result.stderr}")

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(game_state, f)
            temp_file = f.name

        result = subprocess.run(
            [rust_ai_path, "evaluate", temp_file],
            capture_output=True,
            text=True,
            timeout=10,
        )

        os.unlink(temp_file)

        if result.returncode == 0:
            print(f"✅ evaluate successful: {result.stdout.strip()}")
        else:
            print(f"❌ evaluate failed: {result.stderr}")

    except Exception as e:
        print(f"❌ Error testing Rust AI: {e}")


if __name__ == "__main__":
    test_rust_ai()
