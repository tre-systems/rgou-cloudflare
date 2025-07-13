#!/usr/bin/env python3

import json
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import random
import os
import subprocess
import tempfile
from typing import List, Tuple, Dict, Any
import argparse
from tqdm import tqdm
import concurrent.futures
import multiprocessing
import time
from pathlib import Path
import gzip
import struct


def get_device():
    if torch.backends.mps.is_available():
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda")
    else:
        return torch.device("cpu")


def get_optimal_batch_size(device, model_size=100):
    if device.type == "mps":
        return 128
    elif device.type == "cuda":
        return 256
    else:
        return 64


def get_optimal_workers():
    cpu_count = multiprocessing.cpu_count()
    return min(cpu_count, 8)


def quantize_weights(weights: List[float], bits: int = 16) -> List[float]:
    """Quantize weights to reduce precision and file size."""
    weights_array = np.array(weights, dtype=np.float32)

    if bits == 16:
        # Convert to float16 (half precision)
        weights_quantized = weights_array.astype(np.float16).astype(np.float32)
    elif bits == 8:
        # More aggressive quantization to 8-bit
        min_val = np.min(weights_array)
        max_val = np.max(weights_array)
        scale = (max_val - min_val) / 255.0
        weights_quantized = (
            np.round((weights_array - min_val) / scale) * scale + min_val
        )
    else:
        return weights

    return weights_quantized.tolist()


def compress_weights(weights_data: Dict[str, Any]) -> bytes:
    """Compress weights data using gzip."""
    json_str = json.dumps(weights_data, separators=(",", ":"))
    return gzip.compress(json_str.encode("utf-8"))


class GameFeatures:
    SIZE = 150

    @staticmethod
    def from_game_state(game_state: Dict[str, Any]) -> np.ndarray:
        features = np.zeros(GameFeatures.SIZE, dtype=np.float32)
        idx = 0

        for piece in game_state["player1_pieces"]:
            square = piece["square"]
            if square >= 0 and square < 20:
                features[idx] = square / 20.0
            elif square == 20:
                features[idx] = 1.0
            else:
                features[idx] = -1.0
            idx += 1

        for piece in game_state["player2_pieces"]:
            square = piece["square"]
            if square >= 0 and square < 20:
                features[idx] = square / 20.0
            elif square == 20:
                features[idx] = 1.0
            else:
                features[idx] = -1.0
            idx += 1

        for square in game_state["board"]:
            if square is None:
                features[idx] = 0.0
            else:
                features[idx] = 1.0 if square["player"] == "player1" else -1.0
            idx += 1

        features[idx] = GameFeatures._rosette_control_score(game_state)
        idx += 1

        features[idx] = GameFeatures._pieces_on_board_count(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._pieces_on_board_count(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._finished_pieces_count(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._finished_pieces_count(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._average_position_score(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._average_position_score(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._safety_score(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._safety_score(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._center_lane_control(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._center_lane_control(game_state, "player2")
        idx += 1

        features[idx] = 1.0 if game_state["current_player"] == "player1" else -1.0
        idx += 1

        features[idx] = game_state["dice_roll"] / 4.0
        idx += 1

        features[idx] = len(game_state.get("valid_moves", [])) / 7.0
        idx += 1

        features[idx] = GameFeatures._capture_opportunities(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._capture_opportunities(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._vulnerability_to_capture(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._vulnerability_to_capture(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._progress_towards_finish(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._progress_towards_finish(game_state, "player2")
        idx += 1

        # NEW: Advanced strategic features
        features[idx] = GameFeatures._mobility_score(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._mobility_score(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._development_score(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._development_score(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._tactical_opportunities(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._tactical_opportunities(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._king_safety_score(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._king_safety_score(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._center_control_score(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._center_control_score(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._piece_coordination_score(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._piece_coordination_score(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._attack_pressure_score(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._attack_pressure_score(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._defensive_structure_score(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._defensive_structure_score(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._endgame_evaluation(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._endgame_evaluation(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._time_advantage_score(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._time_advantage_score(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._material_balance_score(game_state)
        idx += 1

        features[idx] = GameFeatures._positional_advantage_score(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._positional_advantage_score(game_state, "player2")
        idx += 1

        return features

    @staticmethod
    def _rosette_control_score(game_state: Dict[str, Any]) -> float:
        rosette_squares = [0, 7, 13, 15, 16]
        score = 0
        for rosette in rosette_squares:
            if (
                rosette < len(game_state["board"])
                and game_state["board"][rosette] is not None
            ):
                score += (
                    1.0 if game_state["board"][rosette]["player"] == "player1" else -1.0
                )
        return score

    @staticmethod
    def _pieces_on_board_count(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        return sum(1 for p in pieces if 0 <= p["square"] < 20)

    @staticmethod
    def _finished_pieces_count(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        return sum(1 for p in pieces if p["square"] == 20)

    @staticmethod
    def _average_position_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        track = (
            [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
            if player == "player1"
            else [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]
        )

        total_score = 0.0
        count = 0

        for piece in pieces:
            if 0 <= piece["square"] < 20:
                if piece["square"] in track:
                    track_pos = track.index(piece["square"])
                    total_score += track_pos
                    count += 1

        return total_score / count if count > 0 else 0.0

    @staticmethod
    def _safety_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        rosette_squares = [0, 7, 13, 15, 16]
        return sum(
            1
            for p in pieces
            if 0 <= p["square"] < 20 and p["square"] in rosette_squares
        )

    @staticmethod
    def _center_lane_control(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        return sum(1 for p in pieces if 4 <= p["square"] <= 11)

    @staticmethod
    def _capture_opportunities(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        rosette_squares = [0, 7, 13, 15, 16]
        return sum(
            1
            for p in pieces
            if 0 <= p["square"] < 20 and p["square"] not in rosette_squares
        )

    @staticmethod
    def _vulnerability_to_capture(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        rosette_squares = [0, 7, 13, 15, 16]
        return sum(
            1
            for p in pieces
            if 0 <= p["square"] < 20 and p["square"] not in rosette_squares
        )

    @staticmethod
    def _progress_towards_finish(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        track = (
            [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
            if player == "player1"
            else [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]
        )

        total_progress = 0.0
        count = 0

        for piece in pieces:
            if piece["square"] == 20:
                total_progress += 1.0
                count += 1
            elif 0 <= piece["square"] < 20:
                if piece["square"] in track:
                    track_pos = track.index(piece["square"])
                    total_progress += track_pos / len(track)
                    count += 1

        return total_progress / count if count > 0 else 0.0

    # NEW: Advanced strategic features
    @staticmethod
    def _mobility_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        track = (
            [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
            if player == "player1"
            else [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]
        )

        mobility = 0.0
        for piece in pieces:
            if 0 <= piece["square"] < 20:
                if piece["square"] in track:
                    track_pos = track.index(piece["square"])
                    remaining_steps = len(track) - track_pos
                    mobility += remaining_steps

        return mobility / 7.0

    @staticmethod
    def _development_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        developed_pieces = sum(1 for p in pieces if 0 <= p["square"] < 20)
        return developed_pieces / 7.0

    @staticmethod
    def _tactical_opportunities(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        rosette_squares = [0, 7, 13, 15, 16]
        return sum(
            1
            for p in pieces
            if 0 <= p["square"] < 20 and p["square"] not in rosette_squares
        )

    @staticmethod
    def _king_safety_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        rosette_squares = [0, 7, 13, 15, 16]
        safety_score = sum(
            1
            for p in pieces
            if 0 <= p["square"] < 20 and p["square"] in rosette_squares
        )
        return safety_score / 7.0

    @staticmethod
    def _center_control_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        center_control = sum(1 for p in pieces if 4 <= p["square"] <= 11)
        return center_control / 7.0

    @staticmethod
    def _piece_coordination_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        on_board_pieces = [p["square"] for p in pieces if 0 <= p["square"] < 20]

        coordination = 0.0
        for i in range(len(on_board_pieces)):
            for j in range(i + 1, len(on_board_pieces)):
                distance = abs(on_board_pieces[i] - on_board_pieces[j])
                if distance <= 3:
                    coordination += 1.0

        if len(on_board_pieces) > 1:
            return coordination / (
                len(on_board_pieces) * (len(on_board_pieces) - 1) / 2
            )
        return 0.0

    @staticmethod
    def _attack_pressure_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        opponent = "player2" if player == "player1" else "player1"
        opponent_pieces = game_state[f"{opponent}_pieces"]

        pressure = 0.0
        for piece in pieces:
            if 0 <= piece["square"] < 20:
                for opponent_piece in opponent_pieces:
                    if 0 <= opponent_piece["square"] < 20:
                        distance = abs(piece["square"] - opponent_piece["square"])
                        if distance <= 4:
                            pressure += 1.0 / (distance + 1.0)

        return pressure

    @staticmethod
    def _defensive_structure_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        rosette_squares = [0, 7, 13, 15, 16]

        defensive_score = 0.0
        for piece in pieces:
            if 0 <= piece["square"] < 20:
                if piece["square"] in rosette_squares:
                    defensive_score += 2.0
                else:
                    defensive_score += 0.5

        return defensive_score / 7.0

    @staticmethod
    def _endgame_evaluation(game_state: Dict[str, Any], player: str) -> float:
        finished_pieces = GameFeatures._finished_pieces_count(game_state, player)
        return finished_pieces / 7.0

    @staticmethod
    def _time_advantage_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        time_score = 0.0
        for piece in pieces:
            if piece["square"] == 20:
                time_score += 1.0
            elif 0 <= piece["square"] < 20:
                time_score += 0.5
        return time_score / 7.0

    @staticmethod
    def _material_balance_score(game_state: Dict[str, Any]) -> float:
        p1_finished = GameFeatures._finished_pieces_count(game_state, "player1")
        p2_finished = GameFeatures._finished_pieces_count(game_state, "player2")
        return (p1_finished - p2_finished) / 7.0

    @staticmethod
    def _positional_advantage_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        track = (
            [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
            if player == "player1"
            else [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]
        )

        positional_score = 0.0
        for piece in pieces:
            if 0 <= piece["square"] < 20:
                if piece["square"] in track:
                    track_pos = track.index(piece["square"])
                    positional_score += track_pos / len(track)

        return positional_score / 7.0


class RustAIClient:
    def __init__(
        self, rust_ai_path: str = "worker/rust_ai_core/target/release/rgou-ai-core"
    ):
        self.rust_ai_path = rust_ai_path

    def get_ai_move(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
        try:
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".json", delete=False
            ) as f:
                json.dump(game_state, f)
                temp_file = f.name

            result = subprocess.run(
                [self.rust_ai_path, "get_move", temp_file],
                capture_output=True,
                text=True,
                timeout=5,
            )

            os.unlink(temp_file)

            if result.returncode == 0:
                response = json.loads(result.stdout)
                # Convert Rust AI response format to expected format
                return {
                    "piece_index": response.get("move", 0),
                    "confidence": 0.5,
                    "evaluation": response.get("evaluation", 0.0),
                    "thinking": response.get("thinking", ""),
                }
            else:
                return {"piece_index": 0, "confidence": 0.5}

        except Exception as e:
            print(f"Error getting AI move: {e}")
            return {"piece_index": 0, "confidence": 0.5}

    def evaluate_position(self, game_state: Dict[str, Any]) -> float:
        try:
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".json", delete=False
            ) as f:
                json.dump(game_state, f)
                temp_file = f.name

            result = subprocess.run(
                [self.rust_ai_path, "evaluate", temp_file],
                capture_output=True,
                text=True,
                timeout=5,
            )

            os.unlink(temp_file)

            if result.returncode == 0:
                return float(result.stdout.strip())
            else:
                return 0.0

        except Exception as e:
            print(f"Error evaluating position: {e}")
            return 0.0


class GameSimulator:
    def __init__(self, rust_ai_client: RustAIClient):
        self.rust_ai_client = rust_ai_client

    def _get_player_track(self, player: str):
        return (
            [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
            if player == "player1"
            else [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]
        )

    def _is_square_occupied(
        self, square: int, player: str, game_state: Dict[str, Any]
    ) -> bool:
        if square < 0 or square >= len(game_state["board"]):
            return False
        piece = game_state["board"][square]
        return piece is not None and piece["player"] == player

    def _all_pieces(self, game_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        return game_state["player1_pieces"] + game_state["player2_pieces"]

    def _get_valid_moves(
        self,
        pieces: List[Dict[str, Any]],
        dice_roll: int,
        player: str,
        game_state: Dict[str, Any],
    ) -> List[int]:
        if dice_roll == 0:
            return []

        valid_moves = []
        track = self._get_player_track(player)

        for i, piece in enumerate(pieces):
            if piece["square"] == -1:
                if dice_roll == 1:
                    start_square = track[0]
                    if not self._is_square_occupied(start_square, player, game_state):
                        valid_moves.append(i)
            elif piece["square"] == 20:
                continue
            else:
                try:
                    current_pos = track.index(piece["square"])
                    new_pos = current_pos + dice_roll

                    if new_pos >= len(track):
                        valid_moves.append(i)
                    else:
                        new_square = track[new_pos]
                        if not self._is_square_occupied(new_square, player, game_state):
                            valid_moves.append(i)
                except ValueError:
                    continue

        return valid_moves

    def _make_move(self, game_state: Dict[str, Any], piece_index: int):
        player = game_state["current_player"]
        pieces = game_state[f"{player}_pieces"]
        dice_roll = game_state["dice_roll"]
        track = self._get_player_track(player)

        piece = pieces[piece_index]

        if piece["square"] == -1:
            if dice_roll == 1:
                new_square = track[0]
                piece["square"] = new_square
                game_state["board"][new_square] = {"player": player}
        elif piece["square"] == 20:
            return
        else:
            try:
                current_pos = track.index(piece["square"])
                new_pos = current_pos + dice_roll

                if new_pos >= len(track):
                    piece["square"] = 20
                    if piece["square"] < len(game_state["board"]):
                        game_state["board"][piece["square"]] = None
                else:
                    new_square = track[new_pos]
                    old_square = piece["square"]

                    if old_square < len(game_state["board"]):
                        game_state["board"][old_square] = None

                    piece["square"] = new_square
                    game_state["board"][new_square] = {"player": player}

                    if new_square in [0, 7, 13, 15, 16]:
                        return

            except ValueError:
                return

        game_state["current_player"] = "player2" if player == "player1" else "player1"
        game_state["dice_roll"] = random.randint(0, 4)

    def _is_game_over(self, game_state: Dict[str, Any]) -> bool:
        p1_finished = sum(1 for p in game_state["player1_pieces"] if p["square"] == 20)
        p2_finished = sum(1 for p in game_state["player2_pieces"] if p["square"] == 20)
        return p1_finished == 7 or p2_finished == 7

    def _create_initial_state(self) -> Dict[str, Any]:
        return {
            "board": [None] * 21,
            "player1_pieces": [{"square": -1, "player": "player1"} for _ in range(7)],
            "player2_pieces": [{"square": -1, "player": "player2"} for _ in range(7)],
            "current_player": "player1",
            "dice_roll": random.randint(0, 4),
        }

    def simulate_game(self) -> Dict[str, Any]:
        game_state = self._create_initial_state()
        steps = 0
        examples = []
        max_steps = 200

        while not self._is_game_over(game_state) and steps < max_steps:
            player = game_state["current_player"]
            pieces = game_state[f"{player}_pieces"]
            dice_roll = game_state["dice_roll"]

            valid_moves = self._get_valid_moves(pieces, dice_roll, player, game_state)
            game_state["valid_moves"] = valid_moves

            if valid_moves:
                ai_move = self.rust_ai_client.get_ai_move(game_state)
                piece_index = ai_move.get("piece_index", 0)

                if piece_index is not None and piece_index < len(valid_moves):
                    actual_move = valid_moves[piece_index]
                else:
                    actual_move = valid_moves[0]

                features = GameFeatures.from_game_state(game_state)
                target_policy = self._create_target_policy(game_state, actual_move)

                examples.append(
                    {
                        "features": features.tolist(),
                        "target_policy": target_policy,
                    }
                )

                self._make_move(game_state, actual_move)
            else:
                game_state["current_player"] = (
                    "player2" if player == "player1" else "player1"
                )
                game_state["dice_roll"] = random.randint(0, 4)

            steps += 1

        p1_finished = sum(1 for p in game_state["player1_pieces"] if p["square"] == 20)
        p2_finished = sum(1 for p in game_state["player2_pieces"] if p["square"] == 20)

        return {
            "steps": steps,
            "finished_p1": p1_finished,
            "finished_p2": p2_finished,
            "reason": "max_steps" if steps >= max_steps else "game_over",
            "examples": examples,
        }

    def _create_target_policy(
        self, game_state: Dict[str, Any], expert_move: int
    ) -> List[float]:
        policy = [0.0] * 7
        if 0 <= expert_move < 7:
            policy[expert_move] = 1.0
        return policy


class ValueNetwork(nn.Module):
    def __init__(self, input_size: int = 150):
        super(ValueNetwork, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Tanh(),
        )

    def forward(self, x):
        return self.layers(x)


class PolicyNetwork(nn.Module):
    def __init__(self, input_size: int = 150, output_size: int = 7):
        super(PolicyNetwork, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, output_size),
            nn.Softmax(dim=1),
        )

    def forward(self, x):
        return self.layers(x)


class GameDataset(Dataset):
    def __init__(self, training_data: List[Dict[str, Any]]):
        self.training_data = training_data

    def __len__(self):
        return len(self.training_data)

    def __getitem__(self, idx):
        data = self.training_data[idx]
        features = torch.tensor(data["features"], dtype=torch.float32)
        target_value = torch.tensor(data.get("target_value", 0.0), dtype=torch.float32)
        target_policy = torch.tensor(data["target_policy"], dtype=torch.float32)
        return features, target_value, target_policy


def simulate_game_worker(args):
    rust_ai_path, game_id = args
    client = RustAIClient(rust_ai_path)
    simulator = GameSimulator(client)
    return simulator.simulate_game()


def simulate_games_parallel(num_games, rust_ai_path):
    print(f"Simulating {num_games} games using {get_optimal_workers()} workers...")

    with concurrent.futures.ProcessPoolExecutor(
        max_workers=get_optimal_workers()
    ) as executor:
        args = [(rust_ai_path, i) for i in range(num_games)]
        results = list(
            tqdm(
                executor.map(simulate_game_worker, args),
                total=num_games,
                desc="Simulating games",
            )
        )

    return results


def generate_training_data(
    num_games: int = 1000, use_rust_ai: bool = True
) -> List[Dict[str, Any]]:
    if use_rust_ai:
        rust_ai_path = "worker/rust_ai_core/target/release/rgou-ai-core"

        if not os.path.exists(rust_ai_path):
            print("Building Rust AI core...")
            subprocess.run(
                ["cargo", "build", "--release"], cwd="worker/rust_ai_core", check=True
            )

        game_results = simulate_games_parallel(num_games, rust_ai_path)
        training_data = []

        for i, game_result in enumerate(game_results):
            if i % 100 == 0:
                print(
                    f"Game {i + 1}: {game_result['steps']} moves, P1={game_result['finished_p1']}/7, P2={game_result['finished_p2']}/7, reason={game_result['reason']}"
                )
            training_data.extend(game_result["examples"])
        print(
            f"Generated {len(training_data)} training examples from {num_games} games."
        )
        return training_data
    else:
        training_data = []
        for _ in range(num_games):
            game_state = {
                "board": [None] * 21,
                "player1_pieces": [
                    {"square": -1, "player": "player1"} for _ in range(7)
                ],
                "player2_pieces": [
                    {"square": -1, "player": "player2"} for _ in range(7)
                ],
                "current_player": "player1",
                "dice_roll": random.randint(0, 4),
            }

            for _ in range(50):
                if game_state["current_player"] == "player1":
                    piece_idx = random.randint(0, 6)
                    square = random.randint(0, 19)
                    game_state["player1_pieces"][piece_idx]["square"] = square
                    game_state["board"][square] = {"player": "player1"}
                else:
                    piece_idx = random.randint(0, 6)
                    square = random.randint(0, 19)
                    game_state["player2_pieces"][piece_idx]["square"] = square
                    game_state["board"][square] = {"player": "player2"}

            features = GameFeatures.from_game_state(game_state)

            target_value = random.uniform(-1.0, 1.0)
            target_policy = [random.random() for _ in range(7)]
            policy_sum = sum(target_policy)
            target_policy = [p / policy_sum for p in target_policy]

            training_data.append(
                {
                    "features": features.tolist(),
                    "target_value": target_value,
                    "target_policy": target_policy,
                }
            )

        print(f"Generated {len(training_data)} training examples")
        return training_data


def print_resource_usage():
    print("Resource monitoring not available")


def train_networks(
    training_data: List[Dict[str, Any]],
    epochs: int = 100,
    batch_size: int = None,
    learning_rate: float = 0.001,
) -> Tuple[ValueNetwork, PolicyNetwork]:
    device = get_device()
    if batch_size is None:
        batch_size = get_optimal_batch_size(device)

    print(f"Training on device: {device}")
    print(f"Batch size: {batch_size}")
    print(f"DataLoader workers: {get_optimal_workers()}")

    dataset = GameDataset(training_data)
    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=get_optimal_workers(),
        pin_memory=device.type != "cpu",
    )

    value_network = ValueNetwork().to(device)
    policy_network = PolicyNetwork().to(device)

    value_criterion = nn.MSELoss()
    policy_criterion = nn.CrossEntropyLoss()

    value_optimizer = optim.Adam(value_network.parameters(), lr=learning_rate)
    policy_optimizer = optim.Adam(policy_network.parameters(), lr=learning_rate)

    print("Starting training...")
    start_time = time.time()

    for epoch in range(epochs):
        value_loss_total = 0.0
        policy_loss_total = 0.0
        num_batches = 0

        for features, target_values, target_policies in tqdm(
            dataloader, desc=f"Epoch {epoch + 1}/{epochs}"
        ):
            features = features.to(device)
            target_values = target_values.to(device)
            target_policies = target_policies.to(device)

            value_optimizer.zero_grad()
            value_outputs = value_network(features)
            value_loss = value_criterion(value_outputs, target_values)
            value_loss.backward()
            value_optimizer.step()
            value_loss_total += value_loss.item()

            policy_optimizer.zero_grad()
            policy_outputs = policy_network(features)
            policy_loss = policy_criterion(policy_outputs, target_policies)
            policy_loss.backward()
            policy_optimizer.step()
            policy_loss_total += policy_loss.item()

            num_batches += 1

        if epoch % 10 == 0:
            avg_value_loss = value_loss_total / num_batches
            avg_policy_loss = policy_loss_total / num_batches
            elapsed_time = time.time() - start_time
            print(
                f"Epoch {epoch}: Value Loss = {avg_value_loss:.4f}, Policy Loss = {avg_policy_loss:.4f}, Time = {elapsed_time:.1f}s"
            )
            print_resource_usage()

    return value_network, policy_network


def extract_weights(network: nn.Module) -> List[float]:
    weights = []
    for param in network.parameters():
        weights.extend(param.data.cpu().flatten().tolist())
    return weights


def save_weights_optimized(
    value_network: ValueNetwork,
    policy_network: PolicyNetwork,
    filename: str,
    quantize: bool = True,
    compress: bool = True,
):
    """Save weights with optional quantization and compression."""
    value_weights = extract_weights(value_network)
    policy_weights = extract_weights(policy_network)

    if quantize:
        print("Quantizing weights to 16-bit precision...")
        value_weights = quantize_weights(value_weights, bits=16)
        policy_weights = quantize_weights(policy_weights, bits=16)

    weights_data = {
        "valueWeights": value_weights,
        "policyWeights": policy_weights,
        "valueNetworkConfig": {
            "inputSize": 100,
            "hiddenSizes": [128, 64, 32],
            "outputSize": 1,
        },
        "policyNetworkConfig": {
            "inputSize": 100,
            "hiddenSizes": [128, 64, 32],
            "outputSize": 7,
        },
    }

    if compress:
        print("Compressing weights with gzip...")
        compressed_data = compress_weights(weights_data)

        # Save both compressed and uncompressed versions
        compressed_filename = filename.replace(".json", ".json.gz")
        with open(compressed_filename, "wb") as f:
            f.write(compressed_data)

        # Also save uncompressed for compatibility
        with open(filename, "w") as f:
            json.dump(weights_data, f, separators=(",", ":"))

        # Print size comparison
        uncompressed_size = os.path.getsize(filename)
        compressed_size = os.path.getsize(compressed_filename)
        print(f"Uncompressed size: {uncompressed_size / 1024:.1f} KB")
        print(f"Compressed size: {compressed_size / 1024:.1f} KB")
        print(f"Compression ratio: {uncompressed_size / compressed_size:.1f}x")

        return compressed_filename
    else:
        with open(filename, "w") as f:
            json.dump(weights_data, f, separators=(",", ":"))
        return filename


def save_weights(
    value_network: ValueNetwork, policy_network: PolicyNetwork, filename: str
):
    value_weights = extract_weights(value_network)
    policy_weights = extract_weights(policy_network)

    weights_data = {
        "valueWeights": value_weights,
        "policyWeights": policy_weights,
        "valueNetworkConfig": {
            "inputSize": 100,
            "hiddenSizes": [128, 64, 32],
            "outputSize": 1,
        },
        "policyNetworkConfig": {
            "inputSize": 100,
            "hiddenSizes": [128, 64, 32],
            "outputSize": 7,
        },
    }

    with open(filename, "w") as f:
        json.dump(weights_data, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Train ML AI for Royal Game of Ur")
    parser.add_argument(
        "--num-games", type=int, default=5000, help="Number of training games"
    )
    parser.add_argument(
        "--epochs", type=int, default=200, help="Number of training epochs"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=None,
        help="Batch size for training (auto-detect if not specified)",
    )
    parser.add_argument(
        "--learning-rate", type=float, default=0.001, help="Learning rate"
    )
    parser.add_argument(
        "--output", type=str, default="ml_ai_weights.json", help="Output weights file"
    )
    parser.add_argument(
        "--use-rust-ai",
        action="store_true",
        help="Use Rust AI for training data generation",
    )
    parser.add_argument(
        "--synthetic", action="store_true", help="Use synthetic data instead of Rust AI"
    )
    parser.add_argument(
        "--no-quantize", action="store_true", help="Disable weight quantization"
    )
    parser.add_argument(
        "--no-compress", action="store_true", help="Disable weight compression"
    )

    args = parser.parse_args()

    print("==============================")
    print("Royal Game of Ur ML AI Trainer")
    print("==============================")
    print(f"Device: {get_device()}")
    print(f"Games to generate: {args.num_games}")
    print(f"Epochs: {args.epochs}")
    print(f"Batch size: {args.batch_size or 'auto-detect'}")
    print(f"Learning rate: {args.learning_rate}")
    print(f"Output file: {args.output}")
    print(f"Quantization: {'disabled' if args.no_quantize else 'enabled'}")
    print(f"Compression: {'disabled' if args.no_compress else 'enabled'}")
    print(
        f"Data source: {'Rust AI' if args.use_rust_ai and not args.synthetic else 'Synthetic'}"
    )
    print("------------------------------")

    print("Generating training data...")
    training_data = generate_training_data(
        args.num_games, use_rust_ai=args.use_rust_ai and not args.synthetic
    )
    print(f"Generated {len(training_data)} training examples")

    print("Training networks...")
    value_network, policy_network = train_networks(
        training_data,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
    )

    print("Saving weights...")
    output_file = save_weights_optimized(
        value_network,
        policy_network,
        args.output,
        quantize=not args.no_quantize,
        compress=not args.no_compress,
    )

    print("==============================")
    print("Training complete!")
    print(f"Weights saved to: {output_file}")
    print("==============================")


if __name__ == "__main__":
    main()
