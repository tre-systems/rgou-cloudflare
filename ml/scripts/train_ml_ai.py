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


def set_random_seeds(seed: int = 42):
    """Set random seeds for reproducibility"""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def get_device():
    if torch.backends.mps.is_available():
        try:
            test_tensor = torch.randn(10, 10, device="mps")
            test_result = test_tensor + test_tensor
            print("MPS device is working, using Apple Silicon GPU")
            return torch.device("mps")
        except Exception as e:
            print(f"MPS device failed test: {e}, falling back to CPU")
            return torch.device("cpu")
    elif torch.cuda.is_available():
        return torch.device("cuda")
    else:
        return torch.device("cpu")


def get_optimal_batch_size(device):
    if device.type == "mps":
        return 256
    elif device.type == "cuda":
        return 512
    else:
        return 64


def get_optimal_workers():
    cpu_count = multiprocessing.cpu_count()
    return min(cpu_count, 8)


def quantize_weights(weights: List[float], bits: int = 16) -> List[float]:
    weights_array = np.array(weights, dtype=np.float32)
    if bits == 16:
        weights_quantized = weights_array.astype(np.float16).astype(np.float32)
    else:
        return weights
    return weights_quantized.tolist()


def compress_weights(weights_data: Dict[str, Any]) -> bytes:
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

        return features

    @staticmethod
    def _rosette_control_score(game_state: Dict[str, Any]) -> float:
        rosette_squares = [0, 7, 13, 15, 16]
        score = 0.0
        for square in rosette_squares:
            if (
                square < len(game_state["board"])
                and game_state["board"][square] is not None
            ):
                if game_state["board"][square]["player"] == "player1":
                    score += 1.0
                else:
                    score -= 1.0
        return score / len(rosette_squares)

    @staticmethod
    def _pieces_on_board_count(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        return (
            sum(1 for piece in pieces if piece["square"] >= 0 and piece["square"] < 20)
            / 7.0
        )

    @staticmethod
    def _finished_pieces_count(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        return sum(1 for piece in pieces if piece["square"] == 20) / 7.0

    @staticmethod
    def _average_position_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        valid_pieces = [
            piece for piece in pieces if piece["square"] >= 0 and piece["square"] < 20
        ]
        if not valid_pieces:
            return 0.0
        return sum(piece["square"] for piece in valid_pieces) / (
            len(valid_pieces) * 20.0
        )

    @staticmethod
    def _safety_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        safe_squares = [0, 7, 13, 15, 16]  # Rosette squares
        safe_count = sum(1 for piece in pieces if piece["square"] in safe_squares)
        return safe_count / 7.0

    @staticmethod
    def _center_lane_control(game_state: Dict[str, Any], player: str) -> float:
        center_squares = [4, 5, 6, 7, 8, 9, 10, 11]
        pieces = game_state[f"{player}_pieces"]
        center_count = sum(1 for piece in pieces if piece["square"] in center_squares)
        return center_count / 7.0

    @staticmethod
    def _capture_opportunities(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        opportunities = 0
        for piece in pieces:
            if piece["square"] >= 0 and piece["square"] < 20:
                for other_piece in pieces:
                    if (
                        other_piece != piece
                        and other_piece["square"] >= 0
                        and other_piece["square"] < 20
                    ):
                        if abs(piece["square"] - other_piece["square"]) <= 4:
                            opportunities += 1
        return min(opportunities / 10.0, 1.0)

    @staticmethod
    def _vulnerability_to_capture(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        vulnerable = 0
        for piece in pieces:
            if (
                piece["square"] >= 0
                and piece["square"] < 20
                and piece["square"] not in [0, 7, 13, 15, 16]
            ):
                vulnerable += 1
        return vulnerable / 7.0

    @staticmethod
    def _progress_towards_finish(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        total_progress = 0
        for piece in pieces:
            if piece["square"] >= 0:
                total_progress += piece["square"]
        return total_progress / (7.0 * 20.0)


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
                timeout=10,
            )

            os.unlink(temp_file)

            if result.returncode == 0:
                return json.loads(result.stdout)
            else:
                print(f"Rust AI error: {result.stderr}")
                return {"move": None, "evaluation": 0.0}
        except Exception as e:
            print(f"Error calling Rust AI: {e}")
            return {"move": None, "evaluation": 0.0}

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
                timeout=10,
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
        if player == "player1":
            return [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
        else:
            return [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]

    def _is_square_occupied(
        self, square: int, player: str, game_state: Dict[str, Any]
    ) -> bool:
        if square < 0 or square >= len(game_state["board"]):
            return False
        occupant = game_state["board"][square]
        return occupant is not None and occupant["player"] == player

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
            if piece["square"] == 20:
                continue

            current_track_pos = -1
            if piece["square"] >= 0:
                try:
                    current_track_pos = track.index(piece["square"])
                except ValueError:
                    continue

            new_track_pos = current_track_pos + dice_roll

            if new_track_pos >= len(track):
                if new_track_pos == len(track):
                    valid_moves.append(i)
            else:
                new_actual_pos = track[new_track_pos]
                occupant = game_state["board"][new_actual_pos]

                if occupant is None or (
                    occupant["player"] != player
                    and new_actual_pos not in [0, 7, 13, 15, 16]
                ):
                    valid_moves.append(i)

        return valid_moves

    def _make_move(self, game_state: Dict[str, Any], piece_index: int):
        player = game_state["current_player"]
        pieces = game_state[f"{player}_pieces"]
        piece = pieces[piece_index]
        dice_roll = game_state["dice_roll"]
        track = self._get_player_track(player)

        old_square = piece["square"]
        current_track_pos = -1
        if old_square >= 0:
            try:
                current_track_pos = track.index(old_square)
            except ValueError:
                current_track_pos = -1

        new_track_pos = current_track_pos + dice_roll
        new_square = 20 if new_track_pos >= len(track) else track[new_track_pos]

        if old_square >= 0:
            game_state["board"][old_square] = None

        if new_square != 20:
            occupant = game_state["board"][new_square]
            if (
                occupant
                and occupant["player"] != player
                and new_square not in [0, 7, 13, 15, 16]
            ):
                opponent_pieces = game_state[
                    f"{'player2' if player == 'player1' else 'player1'}_pieces"
                ]
                for opp_piece in opponent_pieces:
                    if opp_piece["square"] == new_square:
                        opp_piece["square"] = -1
                        break

            game_state["board"][new_square] = {"square": new_square, "player": player}

        piece["square"] = new_square

        if new_square not in [0, 7, 13, 15, 16]:
            game_state["current_player"] = (
                "player2" if player == "player1" else "player1"
            )

    def _is_game_over(self, game_state: Dict[str, Any]) -> bool:
        p1_finished = sum(
            1 for piece in game_state["player1_pieces"] if piece["square"] == 20
        )
        p2_finished = sum(
            1 for piece in game_state["player2_pieces"] if piece["square"] == 20
        )
        return p1_finished == 7 or p2_finished == 7

    def _create_initial_state(self) -> Dict[str, Any]:
        return {
            "board": [None] * 21,
            "player1_pieces": [{"square": -1, "player": "player1"} for _ in range(7)],
            "player2_pieces": [{"square": -1, "player": "player2"} for _ in range(7)],
            "current_player": "player1",
            "dice_roll": 0,
            "valid_moves": [],
        }

    def simulate_game(self) -> Dict[str, Any]:
        game_state = self._create_initial_state()
        moves = []
        turn_count = 0
        max_turns = 200

        while not self._is_game_over(game_state) and turn_count < max_turns:
            # Correct distribution for 4 tetrahedral dice (0-4)
            # Roll 0: 1/16 (all 0s)
            # Roll 1: 4/16 (one 1, three 0s)  
            # Roll 2: 6/16 (two 1s, two 0s)
            # Roll 3: 4/16 (three 1s, one 0)
            # Roll 4: 1/16 (all 1s)
            probabilities = [1/16, 4/16, 6/16, 4/16, 1/16]
            dice_roll = random.choices(range(5), weights=probabilities)[0]
            game_state["dice_roll"] = dice_roll

            player = game_state["current_player"]
            pieces = game_state[f"{player}_pieces"]
            valid_moves = self._get_valid_moves(pieces, dice_roll, player, game_state)
            game_state["valid_moves"] = valid_moves

            if valid_moves:
                ai_response = self.rust_ai_client.get_ai_move(game_state)
                if (
                    ai_response.get("move") is not None
                    and ai_response["move"] in valid_moves
                ):
                    move_index = ai_response["move"]
                else:
                    move_index = random.choice(valid_moves)

                moves.append(
                    {
                        "game_state": game_state.copy(),
                        "move": move_index,
                        "dice_roll": dice_roll,
                        "player": player,
                    }
                )

                self._make_move(game_state, move_index)
            else:
                game_state["current_player"] = (
                    "player2" if player == "player1" else "player1"
                )

            turn_count += 1

        return {
            "moves": moves,
            "final_state": game_state,
            "winner": "player1"
            if sum(1 for piece in game_state["player1_pieces"] if piece["square"] == 20)
            == 7
            else "player2",
        }

    def _create_target_policy(
        self, game_state: Dict[str, Any], expert_move: int
    ) -> List[float]:
        policy = [0.0] * 7
        if 0 <= expert_move < 7:
            policy[expert_move] = 1.0
        return policy


class ValueNetwork(nn.Module):
    def __init__(self, input_size: int = 150, dropout_rate: float = 0.2):
        super(ValueNetwork, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(64, 32),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(32, 1),
            nn.Tanh(),
        )

    def forward(self, x):
        return self.layers(x)


class PolicyNetwork(nn.Module):
    def __init__(self, input_size: int = 150, output_size: int = 7, dropout_rate: float = 0.2):
        super(PolicyNetwork, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(64, 32),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(32, output_size),
            # Removed softmax - CrossEntropyLoss will handle this internally
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
        features = GameFeatures.from_game_state(data["game_state"])
        value_target = torch.tensor([data["value_target"]], dtype=torch.float32)
        policy_target = torch.tensor(data["policy_target"], dtype=torch.float32)
        return features, value_target, policy_target


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


def process_game_worker(args):
    game_result, rust_ai_path = args
    
    simulator = GameSimulator(None)
    rust_client = RustAIClient(rust_ai_path) if rust_ai_path else None
    
    game_training_data = []
    
    for move_data in game_result["moves"]:
        game_state = move_data["game_state"]
        features = GameFeatures.from_game_state(game_state)

        try:
            if rust_client:
                value_target = rust_client.evaluate_position(game_state)
                value_target = max(-1.0, min(1.0, value_target / 10.0))
            else:
                p1_finished = sum(
                    1 for piece in game_state["player1_pieces"] if piece["square"] == 20
                )
                p2_finished = sum(
                    1 for piece in game_state["player2_pieces"] if piece["square"] == 20
                )
                value_target = (p2_finished - p1_finished) / 7.0
        except:
            p1_finished = sum(
                1 for piece in game_state["player1_pieces"] if piece["square"] == 20
            )
            p2_finished = sum(
                1 for piece in game_state["player2_pieces"] if piece["square"] == 20
            )
            value_target = (p2_finished - p1_finished) / 7.0

        policy_target = simulator._create_target_policy(
            game_state, move_data["move"]
        )

        game_training_data.append({
            "features": features.tolist(),
            "value_target": value_target,
            "policy_target": policy_target,
            "game_state": game_state,
        })
    
    return game_training_data


def process_games_parallel(game_results, rust_ai_path=None, max_workers=None):
    if max_workers is None:
        max_workers = get_optimal_workers()
    
    print(f"Processing {len(game_results)} games using {max_workers} workers...")
    
    args_list = [(game_result, rust_ai_path) for game_result in game_results]
    
    training_data = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_game = {executor.submit(process_game_worker, args): args for args in args_list}
        
        for future in tqdm(concurrent.futures.as_completed(future_to_game), 
                          total=len(future_to_game), 
                          desc="Processing games"):
            try:
                game_training_data = future.result()
                training_data.extend(game_training_data)
            except Exception as exc:
                print(f'Game processing generated an exception: {exc}')
    
    return training_data


def generate_training_data(
    num_games: int = 1000,
    use_rust_ai: bool = True,
    save_data: bool = True,
    load_existing: bool = False,
) -> List[Dict[str, Any]]:
    if load_existing and os.path.exists("training_data_cache.json"):
        print("Loading existing training data...")
        with open("training_data_cache.json", "r") as f:
            return json.load(f)

    print(f"Generating {num_games} training games...")

    if use_rust_ai:
        rust_ai_path = "worker/rust_ai_core/target/release/rgou-ai-core"
        if not os.path.exists(rust_ai_path):
            print(f"Rust AI not found at {rust_ai_path}, building...")
            subprocess.run(
                ["cargo", "build", "--release"], cwd="worker/rust_ai_core", check=True
            )

        game_results = simulate_games_parallel(num_games, rust_ai_path)

        training_data = process_games_parallel(game_results, rust_ai_path)
    else:
        simulator = GameSimulator(None)
        training_data = []

        for i in tqdm(range(num_games), desc="Generating games"):
            game_result = simulator.simulate_game()

            for move_data in game_result["moves"]:
                game_state = move_data["game_state"]
                features = GameFeatures.from_game_state(game_state)

                # Use piece count difference as fallback value target
                p1_finished = sum(
                    1 for piece in game_state["player1_pieces"] if piece["square"] == 20
                )
                p2_finished = sum(
                    1 for piece in game_state["player2_pieces"] if piece["square"] == 20
                )
                value_target = (p2_finished - p1_finished) / 7.0

                policy_target = simulator._create_target_policy(
                    game_state, move_data["move"]
                )

                training_data.append(
                    {
                        "features": features.tolist(),
                        "value_target": value_target,
                        "policy_target": policy_target,
                        "game_state": game_state,
                    }
                )

    if save_data:
        print("Saving training data...")
        with open("training_data_cache.json", "w") as f:
            json.dump(training_data, f)

    return training_data


def train_networks(
    training_data: List[Dict[str, Any]],
    epochs: int = 100,
    batch_size: int = None,
    learning_rate: float = 0.001,
    validation_split: float = 0.2,
) -> Tuple[ValueNetwork, PolicyNetwork]:
    device = get_device()
    if batch_size is None:
        batch_size = get_optimal_batch_size(device)

    print(f"Training on device: {device}")
    print(f"Batch size: {batch_size}")
    print(f"DataLoader workers: {get_optimal_workers()}")

    # Split data into training and validation
    random.shuffle(training_data)
    split_idx = int(len(training_data) * (1 - validation_split))
    train_data = training_data[:split_idx]
    val_data = training_data[split_idx:]
    
    print(f"Training samples: {len(train_data)}, Validation samples: {len(val_data)}")

    train_dataset = GameDataset(train_data)
    val_dataset = GameDataset(val_data)
    
    train_dataloader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=get_optimal_workers(),
        pin_memory=device.type == "cuda",
    )
    
    val_dataloader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=get_optimal_workers(),
        pin_memory=device.type == "cuda",
    )

    value_network = ValueNetwork().to(device)
    policy_network = PolicyNetwork().to(device)

    # Use AdamW optimizer with weight decay for better regularization
    value_optimizer = optim.AdamW(value_network.parameters(), lr=learning_rate, weight_decay=1e-4)
    policy_optimizer = optim.AdamW(policy_network.parameters(), lr=learning_rate, weight_decay=1e-4)

    # Add learning rate schedulers
    value_scheduler = optim.lr_scheduler.ReduceLROnPlateau(value_optimizer, mode='min', factor=0.5, patience=10, verbose=True)
    policy_scheduler = optim.lr_scheduler.ReduceLROnPlateau(policy_optimizer, mode='min', factor=0.5, patience=10, verbose=True)

    value_criterion = nn.MSELoss()
    policy_criterion = nn.CrossEntropyLoss()

    print(f"Training for {epochs} epochs with {len(train_data)} samples...")

    best_val_loss = float('inf')
    patience_counter = 0
    patience = 20

    for epoch in range(epochs):
        # Training phase
        value_network.train()
        policy_network.train()
        
        train_value_losses = []
        train_policy_losses = []

        for features, value_targets, policy_targets in train_dataloader:
            features = features.to(device)
            value_targets = value_targets.to(device)
            policy_targets = policy_targets.to(device)

            # Train value network
            value_optimizer.zero_grad()
            value_outputs = value_network(features)
            value_loss = value_criterion(value_outputs, value_targets)
            value_loss.backward()
            value_optimizer.step()
            train_value_losses.append(value_loss.item())

            # Train policy network
            policy_optimizer.zero_grad()
            policy_outputs = policy_network(features)
            policy_loss = policy_criterion(policy_outputs, policy_targets)
            policy_loss.backward()
            policy_optimizer.step()
            train_policy_losses.append(policy_loss.item())

        # Validation phase
        value_network.eval()
        policy_network.eval()
        
        val_value_losses = []
        val_policy_losses = []

        with torch.no_grad():
            for features, value_targets, policy_targets in val_dataloader:
                features = features.to(device)
                value_targets = value_targets.to(device)
                policy_targets = policy_targets.to(device)

                value_outputs = value_network(features)
                value_loss = value_criterion(value_outputs, value_targets)
                val_value_losses.append(value_loss.item())

                policy_outputs = policy_network(features)
                policy_loss = policy_criterion(policy_outputs, policy_targets)
                val_policy_losses.append(policy_loss.item())

        # Calculate average losses
        avg_train_value_loss = np.mean(train_value_losses)
        avg_train_policy_loss = np.mean(train_policy_losses)
        avg_val_value_loss = np.mean(val_value_losses)
        avg_val_policy_loss = np.mean(val_policy_losses)
        
        total_val_loss = avg_val_value_loss + avg_val_policy_loss

        # Update learning rate schedulers
        value_scheduler.step(avg_val_value_loss)
        policy_scheduler.step(avg_val_policy_loss)

        # Early stopping
        if total_val_loss < best_val_loss:
            best_val_loss = total_val_loss
            patience_counter = 0
        else:
            patience_counter += 1

        if (epoch + 1) % 10 == 0:
            print(
                f"Epoch {epoch + 1}/{epochs} - "
                f"Train V: {avg_train_value_loss:.4f}, P: {avg_train_policy_loss:.4f} - "
                f"Val V: {avg_val_value_loss:.4f}, P: {avg_val_policy_loss:.4f} - "
                f"LR: {value_optimizer.param_groups[0]['lr']:.6f}"
            )

        if patience_counter >= patience:
            print(f"Early stopping at epoch {epoch + 1}")
            break

    return value_network, policy_network


def extract_weights(network: nn.Module) -> List[float]:
    weights = []
    for param in network.parameters():
        weights.extend(param.data.cpu().numpy().flatten().tolist())
    return weights


def save_weights_optimized(
    value_network: ValueNetwork,
    policy_network: PolicyNetwork,
    filename: str,
    quantize: bool = True,
    compress: bool = True,
    training_metadata: Dict[str, Any] = None,
):
    value_weights = extract_weights(value_network)
    policy_weights = extract_weights(policy_network)

    if quantize:
        value_weights = quantize_weights(value_weights, 16)
        policy_weights = quantize_weights(policy_weights, 16)

    weights_data = {
        "value_weights": value_weights,
        "policy_weights": policy_weights,
        "value_network_config": {
            "input_size": 150,
            "hidden_sizes": [256, 128, 64, 32],
            "output_size": 1,
        },
        "policy_network_config": {
            "input_size": 150,
            "hidden_sizes": [256, 128, 64, 32],
            "output_size": 7,
        },
        "training_metadata": training_metadata or {},
    }

    if compress:
        compressed_data = compress_weights(weights_data)
        with open(filename + ".gz", "wb") as f:
            f.write(compressed_data)
        print(f"Compressed weights saved to {filename}.gz")
    else:
        with open(filename, "w") as f:
            json.dump(weights_data, f, separators=(",", ":"))
        print(f"Weights saved to {filename}")


def main():
    parser = argparse.ArgumentParser(description="Train ML AI for Royal Game of Ur")
    parser.add_argument(
        "--num-games", type=int, default=100, help="Number of games to simulate"
    )
    parser.add_argument(
        "--epochs", type=int, default=100, help="Number of training epochs"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=None,
        help="Training batch size (auto-detect if not specified)",
    )
    parser.add_argument(
        "--learning-rate", type=float, default=0.001, help="Learning rate"
    )
    parser.add_argument(
        "--use-rust-ai",
        action="store_true",
        help="Use Rust AI for training data generation",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="ml/data/weights/ml_ai_weights.json",
        help="Output weights filename",
    )
    parser.add_argument(
        "--load-existing", action="store_true", help="Load existing training data"
    )
    parser.add_argument(
        "--seed", type=int, default=42, help="Random seed for reproducibility"
    )
    parser.add_argument(
        "--validation-split", type=float, default=0.2, help="Validation split ratio"
    )

    args = parser.parse_args()

    set_random_seeds(args.seed)
    print("Starting ML AI training...")
    print(
        f"Configuration: {args.num_games} games, {args.epochs} epochs, batch size {args.batch_size or 'auto-detect'}"
    )
    print(f"Device: {get_device()}")
    print(f"Parallel workers: {get_optimal_workers()}")

    start_time = time.time()
    
    training_data = generate_training_data(
        num_games=args.num_games,
        use_rust_ai=args.use_rust_ai,
        save_data=True,
        load_existing=args.load_existing,
    )

    print(f"Generated {len(training_data)} training samples")

    value_network, policy_network = train_networks(
        training_data=training_data,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        validation_split=args.validation_split,
    )

    training_time = time.time() - start_time
    
    # Collect training metadata
    training_metadata = {
        "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "num_games": args.num_games,
        "num_training_samples": len(training_data),
        "epochs": args.epochs,
        "learning_rate": args.learning_rate,
        "batch_size": args.batch_size or get_optimal_batch_size(get_device()),
        "validation_split": args.validation_split,
        "seed": args.seed,
        "use_rust_ai": args.use_rust_ai,
        "training_time_seconds": training_time,
        "device": str(get_device()),
        "model_version": "v3",  # Increment version for significant changes
        "improvements": [
            "Fixed training loss function (removed softmax from policy network)",
            "Added batch normalization and dropout for regularization",
            "Enhanced value targets using Classic AI evaluation",
            "Added learning rate scheduling and early stopping",
            "Improved optimizer (AdamW with weight decay)",
            "Added validation split and reproducibility controls",
            "Extended training with more games and epochs for ML-v3"
        ]
    }

    save_weights_optimized(value_network, policy_network, args.output, training_metadata=training_metadata)
    print(f"Training completed in {training_time:.2f} seconds!")
    print(f"Training metadata: {training_metadata}")


if __name__ == "__main__":
    main()
