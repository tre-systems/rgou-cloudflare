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
import copy


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


class SelfPlayTrainer:
    """Advanced trainer that supports self-play reinforcement learning"""
    
    def __init__(self, initial_model_path: str = None):
        self.device = get_device()
        self.value_network = None
        self.policy_network = None
        self.iteration = 0
        
        if initial_model_path and os.path.exists(initial_model_path):
            self.load_model(initial_model_path)
        else:
            self.initialize_networks()
    
    def initialize_networks(self):
        """Initialize networks with improved architecture"""
        self.value_network = ValueNetwork().to(self.device)
        self.policy_network = PolicyNetwork().to(self.device)
        print("Initialized new networks")
    
    def load_model(self, model_path: str):
        """Load pre-trained model"""
        with open(model_path, 'r') as f:
            weights_data = json.load(f)
        
        self.value_network = ValueNetwork().to(self.device)
        self.policy_network = PolicyNetwork().to(self.device)
        
        # Load weights
        value_weights = torch.tensor(weights_data["value_weights"], dtype=torch.float32)
        policy_weights = torch.tensor(weights_data["policy_weights"], dtype=torch.float32)
        
        # Apply weights (simplified - would need proper weight loading logic)
        print(f"Loaded model from {model_path}")
    
    def self_play_games(self, num_games: int = 100) -> List[Dict[str, Any]]:
        """Generate games through self-play"""
        print(f"Generating {num_games} self-play games...")
        
        # This would implement actual self-play logic
        # For now, return empty list as placeholder
        return []
    
    def train_iteration(self, training_data: List[Dict[str, Any]], epochs: int = 50):
        """Train for one iteration"""
        print(f"Training iteration {self.iteration} with {len(training_data)} samples")
        
        # Split data
        random.shuffle(training_data)
        split_idx = int(len(training_data) * 0.8)
        train_data = training_data[:split_idx]
        val_data = training_data[split_idx:]
        
        train_dataset = GameDataset(train_data)
        val_dataset = GameDataset(val_data)
        
        train_dataloader = DataLoader(train_dataset, batch_size=64, shuffle=True)
        val_dataloader = DataLoader(val_dataset, batch_size=64, shuffle=False)
        
        # Optimizers
        value_optimizer = optim.AdamW(self.value_network.parameters(), lr=0.001, weight_decay=1e-4)
        policy_optimizer = optim.AdamW(self.policy_network.parameters(), lr=0.001, weight_decay=1e-4)
        
        # Schedulers
        value_scheduler = optim.lr_scheduler.ReduceLROnPlateau(value_optimizer, patience=5)
        policy_scheduler = optim.lr_scheduler.ReduceLROnPlateau(policy_optimizer, patience=5)
        
        # Training loop
        for epoch in range(epochs):
            # Training
            self.value_network.train()
            self.policy_network.train()
            
            train_losses = []
            for batch in train_dataloader:
                features, value_targets, policy_targets = [b.to(self.device) for b in batch]
                
                # Value network
                value_optimizer.zero_grad()
                value_outputs = self.value_network(features)
                value_loss = nn.MSELoss()(value_outputs, value_targets)
                value_loss.backward()
                value_optimizer.step()
                
                # Policy network
                policy_optimizer.zero_grad()
                policy_outputs = self.policy_network(features)
                policy_loss = nn.CrossEntropyLoss()(policy_outputs, policy_targets)
                policy_loss.backward()
                policy_optimizer.step()
                
                train_losses.append(value_loss.item() + policy_loss.item())
            
            # Validation
            self.value_network.eval()
            self.policy_network.eval()
            
            val_losses = []
            with torch.no_grad():
                for batch in val_dataloader:
                    features, value_targets, policy_targets = [b.to(self.device) for b in batch]
                    
                    value_outputs = self.value_network(features)
                    value_loss = nn.MSELoss()(value_outputs, value_targets)
                    
                    policy_outputs = self.policy_network(features)
                    policy_loss = nn.CrossEntropyLoss()(policy_outputs, policy_targets)
                    
                    val_losses.append(value_loss.item() + policy_loss.item())
            
            # Update schedulers
            value_scheduler.step(np.mean(val_losses))
            policy_scheduler.step(np.mean(val_losses))
            
            if epoch % 10 == 0:
                print(f"Epoch {epoch}: Train={np.mean(train_losses):.4f}, Val={np.mean(val_losses):.4f}")
        
        self.iteration += 1
    
    def save_model(self, filename: str):
        """Save current model"""
        value_weights = []
        for param in self.value_network.parameters():
            value_weights.extend(param.data.cpu().numpy().flatten().tolist())
        
        policy_weights = []
        for param in self.policy_network.parameters():
            policy_weights.extend(param.data.cpu().numpy().flatten().tolist())
        
        weights_data = {
            "value_weights": value_weights,
            "policy_weights": policy_weights,
            "iteration": self.iteration,
            "training_metadata": {
                "model_type": "self_play_enhanced",
                "version": "v3",
                "iteration": self.iteration
            }
        }
        
        with open(filename, 'w') as f:
            json.dump(weights_data, f)
        print(f"Model saved to {filename}")


# Import the existing classes from the main training script
# (These would need to be imported or copied from train_ml_ai.py)
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


def main():
    parser = argparse.ArgumentParser(description="Advanced ML AI Training with Self-Play")
    parser.add_argument("--iterations", type=int, default=5, help="Number of self-play iterations")
    parser.add_argument("--games-per-iteration", type=int, default=100, help="Games per iteration")
    parser.add_argument("--epochs-per-iteration", type=int, default=50, help="Training epochs per iteration")
    parser.add_argument("--initial-model", type=str, help="Path to initial model")
    parser.add_argument("--output-dir", type=str, default="ml/data/weights", help="Output directory")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    
    args = parser.parse_args()
    
    set_random_seeds(args.seed)
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Initialize trainer
    trainer = SelfPlayTrainer(args.initial_model)
    
    # Self-play training loop
    for iteration in range(args.iterations):
        print(f"\n=== Self-Play Iteration {iteration + 1}/{args.iterations} ===")
        
        # Generate self-play games
        self_play_data = trainer.self_play_games(args.games_per_iteration)
        
        # Train on self-play data
        if self_play_data:
            trainer.train_iteration(self_play_data, args.epochs_per_iteration)
        
        # Save model
        model_filename = os.path.join(args.output_dir, f"ml_ai_weights_v3_iter_{iteration + 1}.json")
        trainer.save_model(model_filename)
    
    print("Self-play training completed!")


if __name__ == "__main__":
    main() 