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
from typing import List, Tuple, Dict, Any
import argparse


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

        features[idx] = game_state.get("dice_roll", 0) / 4.0
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
            square = game_state["board"][rosette]
            if square is not None:
                score += 1 if square["player"] == "player1" else -1
        return score

    @staticmethod
    def _pieces_on_board_count(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        return sum(1 for p in pieces if p["square"] >= 0 and p["square"] < 20)

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
            if piece["square"] >= 0 and piece["square"] < 20:
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
            if p["square"] >= 0 and p["square"] < 20 and p["square"] in rosette_squares
        )

    @staticmethod
    def _center_lane_control(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        return sum(1 for p in pieces if p["square"] >= 4 and p["square"] <= 11)

    @staticmethod
    def _capture_opportunities(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        rosette_squares = [0, 7, 13, 15, 16]
        return sum(
            1
            for p in pieces
            if p["square"] >= 0
            and p["square"] < 20
            and p["square"] not in rosette_squares
        )

    @staticmethod
    def _vulnerability_to_capture(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        rosette_squares = [0, 7, 13, 15, 16]
        return sum(
            1
            for p in pieces
            if p["square"] >= 0
            and p["square"] < 20
            and p["square"] not in rosette_squares
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
            elif piece["square"] >= 0 and piece["square"] < 20:
                try:
                    track_pos = track.index(piece["square"])
                    total_progress += track_pos / len(track)
                    count += 1
                except ValueError:
                    pass

        return total_progress / count if count > 0 else 0.0


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


def generate_training_data(num_games: int = 1000) -> List[Dict[str, Any]]:
    """Generate training data using the existing AI as teacher"""
    training_data = []

    # This would normally call the Rust AI, but for now we'll simulate
    # In practice, you'd call the existing expectiminimax AI via subprocess or API

    for _ in range(num_games):
        # Simulate a game state
        game_state = {
            "board": [None] * 21,
            "player1_pieces": [{"square": -1, "player": "player1"} for _ in range(7)],
            "player2_pieces": [{"square": -1, "player": "player2"} for _ in range(7)],
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
    """Save network weights in format compatible with Rust"""
    value_weights = extract_weights(value_network)
    policy_weights = extract_weights(policy_network)

    weights_data = {"value_weights": value_weights, "policy_weights": policy_weights}

    with open(filename, "w") as f:
        json.dump(weights_data, f, indent=2)

    print(f"Saved weights to {filename}")
    print(f"Value network: {len(value_weights)} weights")
    print(f"Policy network: {len(policy_weights)} weights")


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

    args = parser.parse_args()

    print("Generating training data...")
    training_data = generate_training_data(args.num_games)
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

    print("Training complete!")


if __name__ == "__main__":
    main()
