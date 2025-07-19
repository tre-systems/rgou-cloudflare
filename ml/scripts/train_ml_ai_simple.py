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
import time


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
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda")
    else:
        return torch.device("cpu")


class GameFeatures:
    SIZE = 150

    @staticmethod
    def from_game_state(game_state: Dict[str, Any]) -> np.ndarray:
        features = np.zeros(GameFeatures.SIZE, dtype=np.float32)
        idx = 0

        # Piece positions (simplified)
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

        # Board occupancy
        for square in game_state["board"]:
            if square is None:
                features[idx] = 0.0
            else:
                features[idx] = 1.0 if square["player"] == "player1" else -1.0
            idx += 1

        # Simple game state features
        p1_finished = sum(1 for piece in game_state["player1_pieces"] if piece["square"] == 20)
        p2_finished = sum(1 for piece in game_state["player2_pieces"] if piece["square"] == 20)
        
        features[idx] = p1_finished / 7.0
        idx += 1
        features[idx] = p2_finished / 7.0
        idx += 1
        features[idx] = 1.0 if game_state["current_player"] == "player1" else -1.0
        idx += 1
        features[idx] = game_state["dice_roll"] / 4.0
        idx += 1

        return features


class RustAIClient:
    def __init__(self, rust_ai_path: str = "worker/rust_ai_core/target/release/rgou-ai-core"):
        self.rust_ai_path = rust_ai_path

    def get_ai_move(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
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
                return json.loads(result.stdout)
            else:
                print(f"Rust AI error: {result.stderr}")
                return {"move": None}
        except Exception as e:
            print(f"Error calling Rust AI: {e}")
            return {"move": None}


class GameSimulator:
    def __init__(self, rust_ai_client: RustAIClient):
        self.rust_ai_client = rust_ai_client

    def _get_player_track(self, player: str):
        return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]

    def _is_square_occupied(self, square: int, player: str, game_state: Dict[str, Any]) -> bool:
        if square < 0 or square >= len(game_state["board"]):
            return False
        occupant = game_state["board"][square]
        return occupant is not None and occupant["player"] == player

    def _all_pieces(self, game_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        return game_state["player1_pieces"] + game_state["player2_pieces"]

    def _get_valid_moves(self, pieces: List[Dict[str, Any]], dice_roll: int, player: str, game_state: Dict[str, Any]) -> List[int]:
        valid_moves = []
        track = self._get_player_track(player)
        
        for i, piece in enumerate(pieces):
            if piece["square"] == -1 and dice_roll == 0:
                valid_moves.append(i)
            elif piece["square"] >= 0 and piece["square"] < 20:
                current_pos = track.index(piece["square"])
                new_pos = current_pos + dice_roll
                if new_pos < len(track):
                    new_square = track[new_pos]
                    if not self._is_square_occupied(new_square, player, game_state):
                        valid_moves.append(i)
        
        return valid_moves

    def _make_move(self, game_state: Dict[str, Any], piece_index: int):
        player = game_state["current_player"]
        pieces = game_state[f"{player}_pieces"]
        dice_roll = game_state["dice_roll"]
        track = self._get_player_track(player)
        
        piece = pieces[piece_index]
        
        if piece["square"] == -1:
            piece["square"] = 0
        else:
            current_pos = track.index(piece["square"])
            new_pos = current_pos + dice_roll
            if new_pos < len(track):
                new_square = track[new_pos]
                piece["square"] = new_square
                
                # Update board
                if new_square < len(game_state["board"]):
                    game_state["board"][new_square] = {"player": player, "piece_index": piece_index}

    def _is_game_over(self, game_state: Dict[str, Any]) -> bool:
        p1_finished = sum(1 for piece in game_state["player1_pieces"] if piece["square"] == 20)
        p2_finished = sum(1 for piece in game_state["player2_pieces"] if piece["square"] == 20)
        return p1_finished >= 7 or p2_finished >= 7

    def _create_initial_state(self) -> Dict[str, Any]:
        return {
            "player1_pieces": [{"square": -1} for _ in range(7)],
            "player2_pieces": [{"square": -1} for _ in range(7)],
            "board": [None] * 20,
            "current_player": "player1",
            "dice_roll": 0,
            "valid_moves": []
        }

    def simulate_game(self) -> Dict[str, Any]:
        game_state = self._create_initial_state()
        moves = []
        max_moves = 100
        
        for move_count in range(max_moves):
            if self._is_game_over(game_state):
                break
                
            # Roll dice
            game_state["dice_roll"] = random.randint(0, 4)
            
            # Get valid moves
            current_player = game_state["current_player"]
            pieces = game_state[f"{current_player}_pieces"]
            valid_moves = self._get_valid_moves(pieces, game_state["dice_roll"], current_player, game_state)
            
            if not valid_moves:
                # Switch players if no valid moves
                game_state["current_player"] = "player2" if current_player == "player1" else "player1"
                continue
            
            # Get AI move
            if self.rust_ai_client:
                ai_response = self.rust_ai_client.get_ai_move(game_state)
                if ai_response.get("move") is not None and ai_response["move"] in valid_moves:
                    move = ai_response["move"]
                else:
                    move = random.choice(valid_moves)
            else:
                move = random.choice(valid_moves)
            
            # Record move
            moves.append({
                "game_state": game_state.copy(),
                "move": move
            })
            
            # Make move
            self._make_move(game_state, move)
            
            # Switch players
            game_state["current_player"] = "player2" if current_player == "player1" else "player1"
        
        return {"moves": moves}


class ValueNetwork(nn.Module):
    def __init__(self, input_size: int = 150):
        super(ValueNetwork, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 256),
            nn.ReLU(),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
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
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, output_size),
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
        value_target = torch.tensor([data["value_target"]], dtype=torch.float32)
        policy_target = torch.tensor(data["policy_target"], dtype=torch.float32)
        return features, value_target, policy_target


def generate_training_data(num_games: int = 100) -> List[Dict[str, Any]]:
    print(f"Generating {num_games} training games...")
    
    rust_ai_path = "worker/rust_ai_core/target/release/rgou-ai-core"
    if not os.path.exists(rust_ai_path):
        print(f"Rust AI not found at {rust_ai_path}")
        return []
    
    simulator = GameSimulator(RustAIClient(rust_ai_path))
    training_data = []
    
    print("Simulating games...")
    for i in tqdm(range(num_games), desc="Generating games"):
        game_result = simulator.simulate_game()
        
        for move_data in game_result["moves"]:
            game_state = move_data["game_state"]
            features = GameFeatures.from_game_state(game_state)
            
            # Simple value target based on piece count difference
            p1_finished = sum(1 for piece in game_state["player1_pieces"] if piece["square"] == 20)
            p2_finished = sum(1 for piece in game_state["player2_pieces"] if piece["square"] == 20)
            value_target = (p2_finished - p1_finished) / 7.0
            
            # Simple policy target (one-hot for the chosen move)
            policy_target = [0.0] * 7
            policy_target[move_data["move"]] = 1.0
            
            training_data.append({
                "features": features.tolist(),
                "value_target": value_target,
                "policy_target": policy_target,
                "game_state": game_state,
            })
    
    print(f"Generated {len(training_data)} training samples")
    return training_data


def train_networks(training_data: List[Dict[str, Any]], epochs: int = 50) -> Tuple[ValueNetwork, PolicyNetwork]:
    device = get_device()
    print(f"Training on device: {device}")
    
    dataset = GameDataset(training_data)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    value_network = ValueNetwork().to(device)
    policy_network = PolicyNetwork().to(device)
    
    value_optimizer = optim.Adam(value_network.parameters(), lr=0.001)
    policy_optimizer = optim.Adam(policy_network.parameters(), lr=0.001)
    
    value_criterion = nn.MSELoss()
    policy_criterion = nn.CrossEntropyLoss()
    
    print(f"Training for {epochs} epochs with {len(training_data)} samples...")
    
    for epoch in range(epochs):
        value_losses = []
        policy_losses = []
        
        for features, value_targets, policy_targets in dataloader:
            features = features.to(device)
            value_targets = value_targets.to(device)
            policy_targets = policy_targets.to(device)
            
            # Train value network
            value_optimizer.zero_grad()
            value_outputs = value_network(features)
            value_loss = value_criterion(value_outputs, value_targets)
            value_loss.backward()
            value_optimizer.step()
            value_losses.append(value_loss.item())
            
            # Train policy network
            policy_optimizer.zero_grad()
            policy_outputs = policy_network(features)
            policy_loss = policy_criterion(policy_outputs, policy_targets)
            policy_loss.backward()
            policy_optimizer.step()
            policy_losses.append(policy_loss.item())
        
        if (epoch + 1) % 10 == 0:
            avg_value_loss = np.mean(value_losses)
            avg_policy_loss = np.mean(policy_losses)
            print(f"Epoch {epoch + 1}/{epochs} - Value Loss: {avg_value_loss:.4f}, Policy Loss: {avg_policy_loss:.4f}")
    
    return value_network, policy_network


def extract_weights(network: nn.Module) -> List[float]:
    weights = []
    for param in network.parameters():
        weights.extend(param.data.cpu().numpy().flatten().tolist())
    return weights


def save_weights(value_network: ValueNetwork, policy_network: PolicyNetwork, filename: str):
    value_weights = extract_weights(value_network)
    policy_weights = extract_weights(policy_network)
    
    weights_data = {
        "valueWeights": value_weights,
        "policyWeights": policy_weights,
        "valueNetworkConfig": {
            "inputSize": 150,
            "hiddenSizes": [256, 128, 64, 32],
            "outputSize": 1,
        },
        "policyNetworkConfig": {
            "inputSize": 150,
            "hiddenSizes": [256, 128, 64, 32],
            "outputSize": 7,
        },
        "trainingMetadata": {
            "modelVersion": "v2",
            "trainingDate": time.strftime("%Y-%m-%d %H:%M:%S"),
            "improvements": ["Simplified training script with clear progress output"]
        }
    }
    
    with open(filename, "w") as f:
        json.dump(weights_data, f, separators=(",", ":"))
    print(f"Weights saved to {filename}")


def main():
    parser = argparse.ArgumentParser(description="Simple ML AI Training")
    parser.add_argument("--num-games", type=int, default=50, help="Number of games to simulate")
    parser.add_argument("--epochs", type=int, default=20, help="Number of training epochs")
    parser.add_argument("--output", type=str, default="ml/data/weights/ml_ai_weights_v2.json", help="Output weights filename")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    
    args = parser.parse_args()
    
    set_random_seeds(args.seed)
    print("Starting simple ML AI training...")
    print(f"Configuration: {args.num_games} games, {args.epochs} epochs")
    print(f"Device: {get_device()}")
    
    start_time = time.time()
    
    # Generate training data
    training_data = generate_training_data(args.num_games)
    
    if not training_data:
        print("No training data generated. Exiting.")
        return
    
    # Train networks
    value_network, policy_network = train_networks(training_data, args.epochs)
    
    # Save weights
    save_weights(value_network, policy_network, args.output)
    
    training_time = time.time() - start_time
    print(f"Training completed in {training_time:.2f} seconds!")


if __name__ == "__main__":
    main() 