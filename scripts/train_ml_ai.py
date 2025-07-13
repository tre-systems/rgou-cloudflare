#!/usr/bin/env python3
"""
Machine Learning AI Training Script for Royal Game of Ur

This script trains neural networks to play the Royal Game of Ur by:
1. Using the existing expectiminimax AI as a teacher
2. Generating training data from self-play
3. Training value and policy networks
4. Exporting trained weights for use in Rust/WASM
"""

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


class GameFeatures:
    """Python implementation of game features for training"""

    SIZE = 100

    @staticmethod
    def from_game_state(game_state: Dict[str, Any]) -> np.ndarray:
        """Convert game state to feature vector"""
        features = np.zeros(GameFeatures.SIZE, dtype=np.float32)
        idx = 0

        # Piece positions for player 1 (14 features)
        for piece in game_state["player1_pieces"]:
            square = piece["square"]
            if square >= 0 and square < 20:
                features[idx] = square / 20.0
            elif square == 20:
                features[idx] = 1.0
            else:
                features[idx] = -1.0
            idx += 1

        # Piece positions for player 2 (14 features)
        for piece in game_state["player2_pieces"]:
            square = piece["square"]
            if square >= 0 and square < 20:
                features[idx] = square / 20.0
            elif square == 20:
                features[idx] = 1.0
            else:
                features[idx] = -1.0
            idx += 1

        # Board occupancy (21 features)
        for square in game_state["board"]:
            if square is None:
                features[idx] = 0.0
            else:
                features[idx] = 1.0 if square["player"] == "player1" else -1.0
            idx += 1

        # Strategic features
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

        # Valid moves count
        features[idx] = len(game_state.get("valid_moves", [])) / 7.0
        idx += 1

        # Capture opportunities
        features[idx] = GameFeatures._capture_opportunities(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._capture_opportunities(game_state, "player2")
        idx += 1

        # Vulnerability to capture
        features[idx] = GameFeatures._vulnerability_to_capture(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._vulnerability_to_capture(game_state, "player2")
        idx += 1

        # Progress towards finish
        features[idx] = GameFeatures._progress_towards_finish(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._progress_towards_finish(game_state, "player2")
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
                try:
                    track_pos = track.index(piece["square"])
                    total_score += track_pos
                    count += 1
                except ValueError:
                    pass

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
            if 0 <= p["square"] < 21 and p["square"] not in rosette_squares
        )

    @staticmethod
    def _vulnerability_to_capture(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        rosette_squares = [0, 7, 13, 15, 16]
        return sum(
            1
            for p in pieces
            if 0 <= p["square"] < 21 and p["square"] not in rosette_squares
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
                try:
                    track_pos = track.index(piece["square"])
                    total_progress += track_pos / len(track)
                    count += 1
                except ValueError:
                    pass

        return total_progress / count if count > 0 else 0.0


class RustAIClient:
    """Client to communicate with the Rust AI for generating training data"""

    def __init__(
        self, rust_ai_path: str = "worker/rust_ai_core/target/release/rgou_ai_core"
    ):
        self.rust_ai_path = rust_ai_path

    def get_ai_move(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
        """Get AI move from Rust AI"""
        try:
            # Create temporary file with game state
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".json", delete=False
            ) as f:
                json.dump(game_state, f)
                temp_file = f.name

            # Call Rust AI
            result = subprocess.run(
                [self.rust_ai_path, "get_move", temp_file],
                capture_output=True,
                text=True,
                timeout=30,
            )

            # Clean up temp file
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
        """Evaluate position using Rust AI"""
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
                timeout=30,
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
    """Simulates games to generate training data"""

    def __init__(self, rust_ai_client: RustAIClient):
        self.rust_ai = rust_ai_client

    def simulate_game(self) -> List[Dict[str, Any]]:
        """Simulate a complete game and return training examples"""
        game_state = self._create_initial_state()
        training_examples = []

        while not self._is_game_over(game_state):
            # Extract features
            features = GameFeatures.from_game_state(game_state)

            # Get expert evaluation
            expert_evaluation = self.rust_ai.evaluate_position(game_state)

            # Get expert move
            expert_response = self.rust_ai.get_ai_move(game_state)
            expert_move = expert_response.get("move")

            # Create target policy
            target_policy = self._create_target_policy(game_state, expert_move)

            # Create training example
            training_examples.append(
                {
                    "features": features.tolist(),
                    "target_value": expert_evaluation,
                    "target_policy": target_policy,
                    "game_state": game_state.copy(),
                }
            )

            # Make move
            if expert_move is not None and expert_move < len(game_state["valid_moves"]):
                move_idx = game_state["valid_moves"][expert_move]
                self._make_move(game_state, move_idx)
            else:
                # No valid moves, switch player
                game_state["current_player"] = (
                    "player2"
                    if game_state["current_player"] == "player1"
                    else "player1"
                )
                game_state["dice_roll"] = random.randint(0, 4)
                game_state["valid_moves"] = []

        return training_examples

    def _create_initial_state(self) -> Dict[str, Any]:
        """Create initial game state"""
        return {
            "board": [None] * 21,
            "player1_pieces": [{"square": -1, "player": "player1"} for _ in range(7)],
            "player2_pieces": [{"square": -1, "player": "player2"} for _ in range(7)],
            "current_player": "player1",
            "dice_roll": random.randint(0, 4),
            "valid_moves": self._get_valid_moves(
                [{"square": -1} for _ in range(7)], random.randint(0, 4)
            ),
        }

    def _is_game_over(self, game_state: Dict[str, Any]) -> bool:
        """Check if game is over"""
        p1_finished = sum(1 for p in game_state["player1_pieces"] if p["square"] == 20)
        p2_finished = sum(1 for p in game_state["player2_pieces"] if p["square"] == 20)
        return p1_finished == 7 or p2_finished == 7

    def _get_valid_moves(
        self, pieces: List[Dict[str, Any]], dice_roll: int
    ) -> List[int]:
        """Get valid moves for current state"""
        valid_moves = []
        for i, piece in enumerate(pieces):
            if piece["square"] == -1 and dice_roll == 0:
                valid_moves.append(i)
            elif piece["square"] >= 0 and piece["square"] + dice_roll < 20:
                valid_moves.append(i)
        return valid_moves

    def _make_move(self, game_state: Dict[str, Any], piece_index: int) -> None:
        """Make a move in the game state"""
        pieces = game_state[f"{game_state['current_player']}_pieces"]
        piece = pieces[piece_index]
        dice_roll = game_state["dice_roll"]

        if piece["square"] == -1 and dice_roll == 0:
            # Enter piece
            piece["square"] = 0
            game_state["board"][0] = piece
        elif piece["square"] >= 0:
            # Move piece
            new_square = piece["square"] + dice_roll
            if new_square < 20:
                game_state["board"][piece["square"]] = None
                piece["square"] = new_square
                game_state["board"][new_square] = piece

        # Switch player and roll dice
        game_state["current_player"] = (
            "player2" if game_state["current_player"] == "player1" else "player1"
        )
        game_state["dice_roll"] = random.randint(0, 4)
        game_state["valid_moves"] = self._get_valid_moves(
            game_state[f"{game_state['current_player']}_pieces"],
            game_state["dice_roll"],
        )

    def _create_target_policy(
        self, game_state: Dict[str, Any], expert_move: int
    ) -> List[float]:
        """Create target policy from expert move"""
        policy = [0.0] * 7
        if expert_move is not None and 0 <= expert_move < 7:
            policy[expert_move] = 1.0
        return policy


class ValueNetwork(nn.Module):
    """Value network for position evaluation"""

    def __init__(self, input_size: int = 100):
        super(ValueNetwork, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Tanh(),
        )

    def forward(self, x):
        return self.layers(x)


class PolicyNetwork(nn.Module):
    """Policy network for move selection"""

    def __init__(self, input_size: int = 100, output_size: int = 7):
        super(PolicyNetwork, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, output_size),
            nn.Softmax(dim=1),
        )

    def forward(self, x):
        return self.layers(x)


class GameDataset(Dataset):
    """Dataset for training data"""

    def __init__(self, training_data: List[Dict[str, Any]]):
        self.data = training_data

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        example = self.data[idx]
        features = torch.FloatTensor(example["features"])
        target_value = torch.FloatTensor([example["target_value"]])
        target_policy = torch.FloatTensor(example["target_policy"])
        return features, target_value, target_policy


def generate_training_data(
    num_games: int = 1000, use_rust_ai: bool = True
) -> List[Dict[str, Any]]:
    """Generate training data using the existing AI as teacher"""
    training_data = []

    if use_rust_ai:
        # Use Rust AI for training data generation
        rust_ai_client = RustAIClient()
        simulator = GameSimulator(rust_ai_client)

        print(f"Generating {num_games} games using Rust AI...")
        for i in tqdm(range(num_games), desc="Generating games"):
            try:
                game_examples = simulator.simulate_game()
                training_data.extend(game_examples)
            except Exception as e:
                print(f"Error simulating game {i}: {e}")
                continue
    else:
        # Fallback to synthetic data
        print(f"Generating {num_games} synthetic games...")
        for _ in tqdm(range(num_games), desc="Generating synthetic data"):
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
                "valid_moves": [],
            }

            # Generate some random positions
            for i in range(random.randint(0, 5)):
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

            # Extract features
            features = GameFeatures.from_game_state(game_state)

            # Generate target values (simplified)
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


def train_networks(
    training_data: List[Dict[str, Any]],
    epochs: int = 100,
    batch_size: int = 32,
    learning_rate: float = 0.001,
) -> Tuple[ValueNetwork, PolicyNetwork]:
    """Train the value and policy networks"""

    # Create datasets
    dataset = GameDataset(training_data)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    # Initialize networks
    value_network = ValueNetwork()
    policy_network = PolicyNetwork()

    # Loss functions and optimizers
    value_criterion = nn.MSELoss()
    policy_criterion = nn.CrossEntropyLoss()

    value_optimizer = optim.Adam(value_network.parameters(), lr=learning_rate)
    policy_optimizer = optim.Adam(policy_network.parameters(), lr=learning_rate)

    # Training loop
    for epoch in range(epochs):
        value_loss_total = 0.0
        policy_loss_total = 0.0

        for features, target_values, target_policies in dataloader:
            # Train value network
            value_optimizer.zero_grad()
            value_outputs = value_network(features)
            value_loss = value_criterion(value_outputs, target_values)
            value_loss.backward()
            value_optimizer.step()
            value_loss_total += value_loss.item()

            # Train policy network
            policy_optimizer.zero_grad()
            policy_outputs = policy_network(features)
            policy_loss = policy_criterion(policy_outputs, target_policies)
            policy_loss.backward()
            policy_optimizer.step()
            policy_loss_total += policy_loss.item()

        if epoch % 10 == 0:
            avg_value_loss = value_loss_total / len(dataloader)
            avg_policy_loss = policy_loss_total / len(dataloader)
            print(
                f"Epoch {epoch}: Value Loss = {avg_value_loss:.4f}, Policy Loss = {avg_policy_loss:.4f}"
            )

    return value_network, policy_network


def extract_weights(network: nn.Module) -> List[float]:
    """Extract weights from PyTorch network"""
    weights = []
    for param in network.parameters():
        weights.extend(param.data.flatten().tolist())
    return weights


def save_weights(
    value_network: ValueNetwork, policy_network: PolicyNetwork, filename: str
):
    """Save trained weights to JSON file"""
    value_weights = extract_weights(value_network)
    policy_weights = extract_weights(policy_network)

    weights_data = {
        "value_weights": value_weights,
        "policy_weights": policy_weights,
        "value_network_config": {
            "input_size": 100,
            "hidden_sizes": [64, 32],
            "output_size": 1,
        },
        "policy_network_config": {
            "input_size": 100,
            "hidden_sizes": [64, 32],
            "output_size": 7,
        },
    }

    with open(filename, "w") as f:
        json.dump(weights_data, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Train ML AI for Royal Game of Ur")
    parser.add_argument(
        "--num-games", type=int, default=1000, help="Number of training games"
    )
    parser.add_argument(
        "--epochs", type=int, default=100, help="Number of training epochs"
    )
    parser.add_argument(
        "--batch-size", type=int, default=32, help="Batch size for training"
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

    args = parser.parse_args()

    print("==============================")
    print("Royal Game of Ur ML AI Trainer")
    print("==============================")
    print(f"Games to generate: {args.num_games}")
    print(f"Epochs: {args.epochs}")
    print(f"Batch size: {args.batch_size}")
    print(f"Learning rate: {args.learning_rate}")
    print(f"Output file: {args.output}")
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
    save_weights(value_network, policy_network, args.output)

    print("==============================")
    print("Training complete!")
    print(f"Weights saved to: {args.output}")
    print("==============================")


if __name__ == "__main__":
    main()
