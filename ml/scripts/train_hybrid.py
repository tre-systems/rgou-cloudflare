#!/usr/bin/env python3

import json
import subprocess
import os
import time
import random
import numpy as np
from typing import Dict, Any, List, Tuple
import argparse
from tqdm import tqdm
import concurrent.futures
import multiprocessing
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import logging
from pathlib import Path

# Setup comprehensive logging
def setup_logging(log_level=logging.INFO):
    """Setup comprehensive logging for training"""
    log_dir = Path.home() / "Desktop" / "rgou-training-data" / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"training_{timestamp}.log"
    
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    logging.info("=" * 60)
    logging.info("🚀 HYBRID RUST+PYTHON ML TRAINING SYSTEM")
    logging.info("=" * 60)
    logging.info(f"📁 Log file: {log_file}")
    logging.info(f"🖥️  CPU cores available: {multiprocessing.cpu_count()}")
    logging.info(f"🔥 PyTorch version: {torch.__version__}")
    logging.info(f"🐍 Python version: {'.'.join(map(str, (3, 13)))}")
    logging.info("=" * 60)
    
    return log_file

def get_optimal_workers():
    """Get optimal number of workers for maximum CPU utilization"""
    cpu_count = multiprocessing.cpu_count()
    optimal_workers = min(cpu_count, 16)
    logging.info(f"⚡ Using {optimal_workers} workers out of {cpu_count} CPU cores")
    return optimal_workers

def set_random_seeds(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    logging.info(f"🎲 Random seeds set to {seed}")

def get_device():
    """Get the best available device with validation - requires GPU on M1 Mac"""
    if torch.backends.mps.is_available():
        try:
            # Test MPS functionality
            device = torch.device("mps")
            test_tensor = torch.randn(10, 10).to(device)
            test_result = test_tensor * 2
            logging.info("🍎 Using Apple Metal Performance Shaders (MPS)")
            return device
        except Exception as e:
            logging.error(f"❌ MPS available but failed test: {e}")
            logging.error("❌ This may be a PyTorch/MPS compatibility issue")
            raise RuntimeError("MPS GPU failed to initialize")
    elif torch.cuda.is_available():
        try:
            device = torch.device("cuda")
            test_tensor = torch.randn(10, 10).to(device)
            test_result = test_tensor * 2
            logging.info(f"🚀 Using CUDA GPU: {torch.cuda.get_device_name()}")
            return device
        except Exception as e:
            logging.error(f"❌ CUDA available but failed test: {e}")
            raise RuntimeError("CUDA GPU failed to initialize")
    else:
        logging.error("❌ No GPU available!")
        logging.error("❌ This training system requires GPU acceleration")
        logging.error("❌ On M1 Mac, ensure PyTorch with MPS support is installed")
        raise RuntimeError("No GPU available - training requires GPU acceleration")

def get_optimal_batch_size(device):
    if str(device) == "cpu":
        batch_size = 64
        logging.info(f"💻 CPU batch size: {batch_size}")
    else:
        batch_size = 128
        logging.info(f"🚀 GPU batch size: {batch_size}")
    return batch_size

class GameFeatures:
    SIZE = 150

    @staticmethod
    def from_game_state(game_state: Dict[str, Any]) -> np.ndarray:
        features = np.zeros(GameFeatures.SIZE, dtype=np.float32)
        idx = 0

        # Piece positions for player 1 (7 features)
        for piece in game_state["player1_pieces"]:
            square = piece["square"]
            if square >= 0 and square < 21:
                features[idx] = square / 21.0
            elif square == 21:
                features[idx] = 1.0
            else:
                features[idx] = -1.0
            idx += 1

        # Piece positions for player 2 (7 features)
        for piece in game_state["player2_pieces"]:
            square = piece["square"]
            if square >= 0 and square < 21:
                features[idx] = square / 21.0
            elif square == 21:
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

        # Current player (1 feature)
        features[idx] = 1.0 if game_state["current_player"] == "player1" else -1.0
        idx += 1

        # Dice roll (1 feature)
        features[idx] = game_state.get("dice_roll", 0) / 4.0
        idx += 1

        # Valid moves count (1 feature)
        valid_moves = game_state.get("valid_moves", [])
        features[idx] = len(valid_moves) / 7.0
        idx += 1

        # Capture opportunities (2 features)
        features[idx] = GameFeatures._capture_opportunities(game_state, "player1")
        idx += 1
        features[idx] = GameFeatures._capture_opportunities(game_state, "player2")
        idx += 1

        # Vulnerability to capture (2 features)
        features[idx] = GameFeatures._vulnerability_to_capture(game_state, "player1")
        idx += 1
        features[idx] = GameFeatures._vulnerability_to_capture(game_state, "player2")
        idx += 1

        # Progress towards finish (2 features)
        features[idx] = GameFeatures._progress_towards_finish(game_state, "player1")
        idx += 1
        features[idx] = GameFeatures._progress_towards_finish(game_state, "player2")
        idx += 1

        # Advanced strategic features
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
        features[idx] = GameFeatures._rosette_safety_score(game_state, "player1")
        idx += 1
        features[idx] = GameFeatures._rosette_safety_score(game_state, "player2")
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

        # Fill remaining features with zeros
        while idx < GameFeatures.SIZE:
            features[idx] = 0.0
            idx += 1

        return features

    @staticmethod
    def _rosette_control_score(game_state: Dict[str, Any]) -> float:
        rosette_squares = [0, 7, 13, 15, 16]
        score = 0
        for square in rosette_squares:
            occupant = game_state["board"][square]
            if occupant:
                if occupant["player"] == "player1":
                    score -= 1
                else:
                    score += 1
        return score

    @staticmethod
    def _pieces_on_board_count(game_state: Dict[str, Any], player: str) -> float:
        count = 0
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] >= 0 and piece["square"] < 21:
                count += 1
        return count

    @staticmethod
    def _finished_pieces_count(game_state: Dict[str, Any], player: str) -> float:
        count = 0
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] == 21:
                count += 1
        return count

    @staticmethod
    def _average_position_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        total_score = 0
        valid_pieces = 0
        
        for piece in pieces:
            if piece["square"] >= 0 and piece["square"] < 21:
                total_score += piece["square"]
                valid_pieces += 1
        
        return total_score / max(valid_pieces, 1)

    @staticmethod
    def _safety_score(game_state: Dict[str, Any], player: str) -> float:
        safe_squares = [0, 7, 13, 15, 16]  # Rosette squares
        score = 0
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] in safe_squares:
                score += 1
        return score

    @staticmethod
    def _center_lane_control(game_state: Dict[str, Any], player: str) -> float:
        center_squares = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
        score = 0
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] in center_squares:
                score += 1
        return score

    @staticmethod
    def _capture_opportunities(game_state: Dict[str, Any], player: str) -> float:
        opportunities = 0
        opponent = "player2" if player == "player1" else "player1"
        
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] >= 0 and piece["square"] < 21:
                for opp_piece in game_state[f"{opponent}_pieces"]:
                    if opp_piece["square"] >= 0 and opp_piece["square"] < 21:
                        if piece["square"] == opp_piece["square"]:
                            opportunities += 1
        return opportunities

    @staticmethod
    def _vulnerability_to_capture(game_state: Dict[str, Any], player: str) -> float:
        vulnerability = 0
        opponent = "player2" if player == "player1" else "player1"
        
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] >= 0 and piece["square"] < 21:
                for opp_piece in game_state[f"{opponent}_pieces"]:
                    if opp_piece["square"] >= 0 and opp_piece["square"] < 21:
                        if piece["square"] == opp_piece["square"]:
                            vulnerability += 1
        return vulnerability

    @staticmethod
    def _progress_towards_finish(game_state: Dict[str, Any], player: str) -> float:
        total_progress = 0
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] >= 0 and piece["square"] < 21:
                total_progress += piece["square"]
            elif piece["square"] == 21:
                total_progress += 21
        return total_progress / 147.0  # Normalize by max possible progress

    @staticmethod
    def _mobility_score(game_state: Dict[str, Any], player: str) -> float:
        valid_moves = game_state.get("valid_moves", [])
        return len(valid_moves) / 7.0

    @staticmethod
    def _development_score(game_state: Dict[str, Any], player: str) -> float:
        pieces_on_board = 0
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] >= 0 and piece["square"] < 21:
                pieces_on_board += 1
        return pieces_on_board / 7.0

    @staticmethod
    def _tactical_opportunities(game_state: Dict[str, Any], player: str) -> float:
        opportunities = 0
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] >= 0 and piece["square"] < 21:
                # Check if piece can capture or reach rosette
                if piece["square"] in [0, 7, 13, 15, 16]:
                    opportunities += 1
        return opportunities

    @staticmethod
    def _rosette_safety_score(game_state: Dict[str, Any], player: str) -> float:
        rosette_squares = [0, 7, 13, 15, 16]
        score = 0
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] in rosette_squares:
                score += 1
        return score / 5.0

    @staticmethod
    def _center_control_score(game_state: Dict[str, Any], player: str) -> float:
        center_squares = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
        score = 0
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] in center_squares:
                score += 1
        return score / 13.0

    @staticmethod
    def _piece_coordination_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        coordination = 0
        for i, piece1 in enumerate(pieces):
            for j, piece2 in enumerate(pieces):
                if i != j and piece1["square"] >= 0 and piece2["square"] >= 0:
                    distance = abs(piece1["square"] - piece2["square"])
                    if distance <= 3:
                        coordination += 1
        return coordination / 42.0  # Normalize by max possible pairs

    @staticmethod
    def _attack_pressure_score(game_state: Dict[str, Any], player: str) -> float:
        pressure = 0
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] >= 15:  # Close to finish
                pressure += 1
        return pressure / 7.0

    @staticmethod
    def _defensive_structure_score(game_state: Dict[str, Any], player: str) -> float:
        defense = 0
        rosette_squares = [0, 7, 13, 15, 16]
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] in rosette_squares:
                defense += 1
        return defense / 7.0

    @staticmethod
    def _endgame_evaluation(game_state: Dict[str, Any], player: str) -> float:
        finished_pieces = 0
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] == 21:
                finished_pieces += 1
        return finished_pieces / 7.0

    @staticmethod
    def _time_advantage_score(game_state: Dict[str, Any], player: str) -> float:
        total_progress = 0
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] >= 0 and piece["square"] < 21:
                total_progress += piece["square"]
            elif piece["square"] == 21:
                total_progress += 21
        return total_progress / 147.0

    @staticmethod
    def _material_balance_score(game_state: Dict[str, Any]) -> float:
        p1_pieces = len([p for p in game_state["player1_pieces"] if p["square"] != -1])
        p2_pieces = len([p for p in game_state["player2_pieces"] if p["square"] != -1])
        return (p1_pieces - p2_pieces) / 14.0

    @staticmethod
    def _positional_advantage_score(game_state: Dict[str, Any], player: str) -> float:
        total_position = 0
        for piece in game_state[f"{player}_pieces"]:
            if piece["square"] >= 0 and piece["square"] < 21:
                total_position += piece["square"]
            elif piece["square"] == 21:
                total_position += 21
        return total_position / 147.0

class ValueNetwork(nn.Module):
    def __init__(self, input_size: int = 150, dropout_rate: float = 0.2):
        super(ValueNetwork, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 256),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(64, 32),
            nn.ReLU(),
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
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
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

def setup_training_data_directory():
    """Setup the training data directory on desktop"""
    training_dir = Path.home() / "Desktop" / "rgou-training-data"
    training_dir.mkdir(parents=True, exist_ok=True)
    
    # Create subdirectories
    (training_dir / "data").mkdir(exist_ok=True)
    (training_dir / "weights").mkdir(exist_ok=True)
    (training_dir / "logs").mkdir(exist_ok=True)
    (training_dir / "temp").mkdir(exist_ok=True)
    
    logging.info(f"📁 Training data directory: {training_dir}")
    return training_dir

def generate_training_data_rust(num_games: int, depth: int) -> List[Dict[str, Any]]:
    """Generate training data using Rust (fast data generation)"""
    logging.info("🦀 PHASE 1: RUST DATA GENERATION")
    logging.info(f"🎮 Generating {num_games} training games using Rust...")
    
    # Setup directories
    training_dir = setup_training_data_directory()
    temp_dir = training_dir / "temp"
    
    # Use the Rust training binary for data generation
    rust_bin = os.path.abspath("worker/rust_ai_core/target/release/train")
    
    if not os.path.exists(rust_bin):
        logging.info("🔨 Building Rust training binary...")
        build_start = time.time()
        result = subprocess.run(
            ["cargo", "build", "--release"], 
            cwd="worker/rust_ai_core", 
            capture_output=True,
            text=True
        )
        build_time = time.time() - build_start
        
        if result.returncode != 0:
            logging.error(f"❌ Rust build failed: {result.stderr}")
            raise RuntimeError("Failed to build Rust training binary")
        
        logging.info(f"✅ Rust build completed in {build_time:.2f} seconds")
    
    # Create a temporary config file for Rust
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    config_file = temp_dir / f"config_{timestamp}.json"
    output_file = temp_dir / f"training_data_{timestamp}.json"
    
    config = {
        "num_games": num_games,
        "epochs": 0,  # No training, just data generation
        "batch_size": 32,
        "learning_rate": 0.001,
        "validation_split": 0.2,
        "depth": depth,
        "seed": 42,
        "output_file": str(output_file)
    }
    
    with open(config_file, "w") as f:
        json.dump(config, f, indent=2)
    
    logging.info(f"📄 Rust config saved to: {config_file}")
    logging.info(f"🎯 Configuration: {num_games} games, depth {depth}")
    
    # Run Rust data generation with real-time output
    generation_start = time.time()
    logging.info("🚀 Starting Rust data generation...")
    logging.info("📊 Progress updates will appear below:")
    
    # Use subprocess.Popen for real-time output
    process = subprocess.Popen(
        [rust_bin, "generate_data", str(config_file)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        cwd="worker/rust_ai_core",
        bufsize=1,
        universal_newlines=True
    )
    
    # Read output in real-time
    while True:
        output = process.stdout.readline()
        if output == '' and process.poll() is not None:
            break
        if output:
            # Clean up the output and log it
            output = output.strip()
            if output:
                logging.info(f"🦀 {output}")
    
    # Wait for process to complete
    return_code = process.poll()
    generation_time = time.time() - generation_start
    
    if return_code != 0:
        logging.error(f"❌ Rust data generation failed with return code: {return_code}")
        raise RuntimeError("Rust data generation failed")
    
    # Load the generated data
    if output_file.exists():
        logging.info(f"📂 Loading generated data from: {output_file}")
        load_start = time.time()
        
        with open(output_file, "r") as f:
            training_data = json.load(f)
        
        load_time = time.time() - load_start
        
        # Clean up temporary files
        config_file.unlink(missing_ok=True)
        output_file.unlink(missing_ok=True)
        
        logging.info("✅ Data preparation phase completed successfully!")
        logging.info(f"📊 Generated {len(training_data)} training samples")
        logging.info(f"⏱️  Generation time: {generation_time:.2f} seconds")
        logging.info(f"📂 Data loading time: {load_time:.2f} seconds")
        logging.info(f"🎮 Average time per game: {generation_time / num_games:.3f} seconds")
        logging.info(f"🚀 Samples per second: {len(training_data) / generation_time:.0f}")
        logging.info(f"📈 Average samples per game: {len(training_data) / num_games:.1f}")
        
        # Save a copy to the data directory
        data_file = training_dir / "data" / f"training_data_{timestamp}.json"
        with open(data_file, "w") as f:
            json.dump(training_data, f, indent=2)
        logging.info(f"💾 Training data saved to: {data_file}")
        
        return training_data
    else:
        logging.error("❌ Rust data generation failed - no output file found")
        raise RuntimeError("Rust data generation failed - no output file")

def train_networks_gpu(
    training_data: List[Dict[str, Any]],
    epochs: int = 100,
    batch_size: int = None,
    learning_rate: float = 0.001,
    validation_split: float = 0.2,
) -> Tuple[ValueNetwork, PolicyNetwork]:
    """Train networks using GPU acceleration with comprehensive logging"""
    logging.info("🔥 PHASE 2: GPU NETWORK TRAINING")
    
    device = get_device()
    if batch_size is None:
        batch_size = get_optimal_batch_size(device)

    logging.info(f"🎯 Training on device: {device}")
    logging.info(f"📦 Batch size: {batch_size}")
    logging.info(f"⚡ DataLoader workers: {get_optimal_workers()}")

    # Split data into training and validation
    random.shuffle(training_data)
    split_idx = int(len(training_data) * (1 - validation_split))
    train_data = training_data[:split_idx]
    val_data = training_data[split_idx:]
    
    logging.info(f"📚 Training samples: {len(train_data)}, Validation samples: {len(val_data)}")

    train_dataset = GameDataset(train_data)
    val_dataset = GameDataset(val_data)
    
    train_dataloader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,  # Use main process to avoid hanging
        pin_memory=device.type == "cuda",  # Only use pin_memory for CUDA
    )
    
    val_dataloader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,  # Use main process to avoid hanging
        pin_memory=device.type == "cuda",  # Only use pin_memory for CUDA
    )

    value_network = ValueNetwork().to(device)
    policy_network = PolicyNetwork().to(device)

    logging.info(f"🧠 Value network parameters: {sum(p.numel() for p in value_network.parameters()):,}")
    logging.info(f"🧠 Policy network parameters: {sum(p.numel() for p in policy_network.parameters()):,}")

    value_optimizer = optim.AdamW(value_network.parameters(), lr=learning_rate, weight_decay=1e-4)
    policy_optimizer = optim.AdamW(policy_network.parameters(), lr=learning_rate, weight_decay=1e-4)

    value_scheduler = optim.lr_scheduler.ReduceLROnPlateau(value_optimizer, mode='min', factor=0.5, patience=10)
    policy_scheduler = optim.lr_scheduler.ReduceLROnPlateau(policy_optimizer, mode='min', factor=0.5, patience=10)

    value_criterion = nn.MSELoss()
    policy_criterion = nn.CrossEntropyLoss()

    logging.info(f"🎯 Training for {epochs} epochs with {len(train_data)} samples...")

    best_val_loss = float('inf')
    patience_counter = 0
    patience = 20

    for epoch in range(epochs):
        epoch_start = time.time()
        
        # Training phase
        value_network.train()
        policy_network.train()
        train_loss = 0.0
        
        # Progress bar for training
        train_batches = len(train_dataloader)
        logging.info(f"🔄 Epoch {epoch+1}/{epochs} - Training ({train_batches} batches)")
        
        for batch_idx, (features, value_targets, policy_targets) in enumerate(train_dataloader):
            features = features.to(device)
            value_targets = value_targets.to(device)
            policy_targets = policy_targets.to(device)
            
            # Value network training
            value_optimizer.zero_grad()
            value_outputs = value_network(features)
            value_loss = value_criterion(value_outputs, value_targets)
            value_loss.backward()
            value_optimizer.step()
            
            # Policy network training
            policy_optimizer.zero_grad()
            policy_outputs = policy_network(features)
            policy_loss = policy_criterion(policy_outputs, policy_targets.argmax(dim=1))
            policy_loss.backward()
            policy_optimizer.step()
            
            train_loss += value_loss.item() + policy_loss.item()
            
            # Progress logging every 500 batches or at the end
            if batch_idx % 500 == 0 or batch_idx == train_batches - 1:
                progress = (batch_idx + 1) / train_batches * 100
                current_loss = train_loss / (batch_idx + 1)
                logging.info(f"  📊 Batch {batch_idx+1}/{train_batches} ({progress:.1f}%) - Loss: {current_loss:.6}")
        
        train_loss /= len(train_dataloader)
        
        # Validation phase
        value_network.eval()
        policy_network.eval()
        val_loss = 0.0
        
        logging.info(f"🔍 Epoch {epoch+1}/{epochs} - Validation")
        
        with torch.no_grad():
            for batch_idx, (features, value_targets, policy_targets) in enumerate(val_dataloader):
                features = features.to(device)
                value_targets = value_targets.to(device)
                policy_targets = policy_targets.to(device)
                
                value_outputs = value_network(features)
                policy_outputs = policy_network(features)
                
                value_loss = value_criterion(value_outputs, value_targets)
                policy_loss = policy_criterion(policy_outputs, policy_targets.argmax(dim=1))
                
                val_loss += value_loss.item() + policy_loss.item()
        
        val_loss /= len(val_dataloader)
        
        # Learning rate scheduling
        value_scheduler.step(val_loss)
        policy_scheduler.step(val_loss)
        
        epoch_time = time.time() - epoch_start
        
        # Always log epoch results
        logging.info(f"📈 Epoch {epoch+1}/{epochs} COMPLETE:")
        logging.info(f"  ⏱️  Time: {epoch_time:.2f}s")
        logging.info(f"  📊 Train Loss: {train_loss:.6}")
        logging.info(f"  🔍 Val Loss: {val_loss:.6}")
        logging.info(f"  📚 Learning Rate: {value_optimizer.param_groups[0]['lr']:.6}")
        
        # Early stopping
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            logging.info(f"🏆 New best validation loss: {best_val_loss:.6}")
        else:
            patience_counter += 1
            logging.info(f"⏳ No improvement ({patience_counter}/{patience} patience)")
            if patience_counter >= patience:
                logging.info(f"⏹️  Early stopping at epoch {epoch+1}")
                break

    logging.info(f"✅ Training completed. Best validation loss: {best_val_loss:.6}")
    
    # Clean up DataLoader workers properly
    del train_dataloader
    del val_dataloader
    
    return value_network, policy_network

def save_weights(value_network: ValueNetwork, policy_network: PolicyNetwork, filename: str, metadata: Dict[str, Any]):
    """Save trained weights in the expected format"""
    logging.info("💾 PHASE 3: SAVING RESULTS")
    
    value_weights = []
    policy_weights = []
    
    # Extract weights from PyTorch models
    for param in value_network.parameters():
        value_weights.extend(param.data.cpu().numpy().flatten().tolist())
    
    for param in policy_network.parameters():
        policy_weights.extend(param.data.cpu().numpy().flatten().tolist())
    
    weights_data = {
        "value_weights": value_weights,
        "policy_weights": policy_weights,
        "value_network_config": {
            "input_size": 150,
            "hidden_sizes": [256, 128, 64, 32],
            "output_size": 1
        },
        "policy_network_config": {
            "input_size": 150,
            "hidden_sizes": [256, 128, 64, 32],
            "output_size": 7
        },
        "metadata": metadata,
    }
    
    # Save to the weights directory
    training_dir = setup_training_data_directory()
    weights_file = training_dir / "weights" / filename
    
    with open(weights_file, "w") as f:
        json.dump(weights_data, f, indent=2)
    
    logging.info(f"💾 Weights saved to {weights_file}")
    logging.info(f"🧠 Value weights: {len(value_weights):,} parameters")
    logging.info(f"🧠 Policy weights: {len(policy_weights):,} parameters")

def main():
    parser = argparse.ArgumentParser(description="Hybrid Rust+Python ML AI Training")
    parser.add_argument("--num-games", type=int, default=1000, help="Number of games to simulate")
    parser.add_argument("--epochs", type=int, default=100, help="Number of training epochs")
    parser.add_argument("--learning-rate", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--batch-size", type=int, default=None, help="Batch size")
    parser.add_argument("--depth", type=int, default=3, help="Search depth for Rust AI")
    parser.add_argument("--output", type=str, default="ml_ai_weights_hybrid.json", help="Output weights file")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose logging")
    
    args = parser.parse_args()

    # Setup logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    log_file = setup_logging(log_level)
    
    set_random_seeds(42)
    
    # Check GPU availability early
    device = get_device()
    logging.info("🎯 TRAINING CONFIGURATION")
    logging.info(f"🎮 Games: {args.num_games}")
    logging.info(f"🔄 Epochs: {args.epochs}")
    logging.info(f"🔍 Depth: {args.depth}")
    logging.info(f"🎯 Device: {device}")
    logging.info(f"⚡ Workers: {get_optimal_workers()}")
    logging.info("=" * 60)

    start_time = time.time()
    
    try:
        # Phase 1: Generate training data using Rust (fast)
        training_data = generate_training_data_rust(args.num_games, args.depth)
        
        # Clear transition message
        logging.info("=" * 60)
        logging.info("🚀 TRANSITIONING TO TRAINING PHASE")
        logging.info("=" * 60)
        logging.info(f"📊 Data preparation completed: {len(training_data)} samples ready")
        logging.info(f"🔥 Starting neural network training on {device}")
        logging.info("=" * 60)
        
        # Phase 2: Train networks using Python+GPU (efficient)
        value_network, policy_network = train_networks_gpu(
            training_data=training_data,
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.learning_rate,
        )
        
        # Save results
        training_time = time.time() - start_time
        
        metadata = {
            "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "version": "hybrid_v1",
            "num_games": args.num_games,
            "num_training_samples": len(training_data),
            "epochs": args.epochs,
            "learning_rate": args.learning_rate,
            "batch_size": args.batch_size or get_optimal_batch_size(get_device()),
            "depth": args.depth,
            "training_time_seconds": training_time,
            "device": str(get_device()),
            "cpu_cores_used": get_optimal_workers(),
            "log_file": str(log_file),
            "improvements": [
                "Rust data generation (fast)",
                "Python GPU training (efficient)",
                "Hybrid architecture optimization",
                "Eliminated subprocess bottleneck",
                "Maximum CPU utilization",
                "Comprehensive logging",
            ]
        }
        
        save_weights(value_network, policy_network, args.output, metadata)
        
        logging.info("=" * 60)
        logging.info("🎉 TRAINING COMPLETE")
        logging.info("=" * 60)
        logging.info(f"⏱️  Total time: {training_time:.2f} seconds")
        logging.info(f"📊 Generated {len(training_data)} training samples")
        logging.info(f"⚡ Average time per game: {training_time / args.num_games:.3f} seconds")
        logging.info(f"📁 Log file: {log_file}")
        logging.info("=" * 60)
        
        # Force cleanup and exit
        import gc
        gc.collect()
        
    except Exception as e:
        logging.error(f"❌ Training failed with error: {e}")
        logging.error("📁 Check the log file for details")
        raise
    finally:
        # Ensure cleanup happens even on error
        import gc
        gc.collect()

if __name__ == "__main__":
    main() 