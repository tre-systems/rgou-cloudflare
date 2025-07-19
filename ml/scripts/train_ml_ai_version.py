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
import sys

# Import the existing training infrastructure
from train_ml_ai import (
    set_random_seeds,
    get_device,
    get_optimal_batch_size,
    get_optimal_workers,
    quantize_weights,
    compress_weights,
    GameFeatures,
    RustAIClient,
    GameSimulator,
    ValueNetwork,
    PolicyNetwork,
    GameDataset,
    simulate_game_worker,
    simulate_games_parallel,
    generate_training_data,
    train_networks,
    extract_weights,
    save_weights_optimized
)


def get_version_config(version: str) -> Dict[str, Any]:
    """Get training configuration for a specific version"""
    
    # Base configuration that all versions inherit
    base_config = {
        "use_rust_ai": True,
        "validation_split": 0.15,
        "quantize": True,
        "compress": True,
        "seed": 42
    }
    
    # Version-specific configurations
    version_configs = {
        "v1": {
            "num_games": 100,
            "epochs": 50,
            "learning_rate": 0.001,
            "improvements": ["Initial ML AI training"]
        },
        "v2": {
            "num_games": 1000,
            "epochs": 100,
            "learning_rate": 0.001,
            "improvements": [
                "Fixed training loss function (removed softmax from policy network)",
                "Added batch normalization and dropout for regularization",
                "Enhanced value targets using Classic AI evaluation",
                "Added learning rate scheduling and early stopping",
                "Improved optimizer (AdamW with weight decay)",
                "Added validation split and reproducibility controls"
            ]
        },
        "v3": {
            "num_games": 5000,
            "epochs": 300,
            "learning_rate": 0.0005,
            "improvements": [
                "Fixed training loss function (removed softmax from policy network)",
                "Added batch normalization and dropout for regularization",
                "Enhanced value targets using Classic AI evaluation",
                "Added learning rate scheduling and early stopping",
                "Improved optimizer (AdamW with weight decay)",
                "Added validation split and reproducibility controls",
                "Extended training with 5000 games and 300 epochs for ML-v3"
            ]
        },
        "v4": {
            "num_games": 10000,
            "epochs": 500,
            "learning_rate": 0.0003,
            "improvements": [
                "Fixed training loss function (removed softmax from policy network)",
                "Added batch normalization and dropout for regularization",
                "Enhanced value targets using Classic AI evaluation",
                "Added learning rate scheduling and early stopping",
                "Improved optimizer (AdamW with weight decay)",
                "Added validation split and reproducibility controls",
                "Extended training with 10000 games and 500 epochs for ML-v4"
            ]
        },
        "v5": {
            "num_games": 20000,
            "epochs": 1000,
            "learning_rate": 0.0002,
            "improvements": [
                "Fixed training loss function (removed softmax from policy network)",
                "Added batch normalization and dropout for regularization",
                "Enhanced value targets using Classic AI evaluation",
                "Added learning rate scheduling and early stopping",
                "Improved optimizer (AdamW with weight decay)",
                "Added validation split and reproducibility controls",
                "Extended training with 20000 games and 1000 epochs for ML-v5"
            ]
        }
    }
    
    # Get version config or use latest if version not found
    if version in version_configs:
        config = {**base_config, **version_configs[version]}
    else:
        # For future versions, use the latest known config as base
        latest_version = max(version_configs.keys(), key=lambda x: int(x[1:]))
        config = {**base_config, **version_configs[latest_version]}
        
        # Try to parse version number and scale accordingly
        try:
            version_num = int(version[1:])  # Remove 'v' and convert to int
            latest_num = int(latest_version[1:])
            
            # Scale up parameters for newer versions
            scale_factor = version_num / latest_num
            config["num_games"] = int(config["num_games"] * scale_factor)
            config["epochs"] = int(config["epochs"] * scale_factor)
            config["learning_rate"] = config["learning_rate"] / (scale_factor ** 0.5)
            
            config["improvements"].append(f"Auto-scaled training for ML-{version}")
        except ValueError:
            config["improvements"].append(f"Using latest known configuration for ML-{version}")
    
    return config


def train_networks_with_progress(
    training_data: List[Dict[str, Any]],
    epochs: int = 100,
    batch_size: int = None,
    learning_rate: float = 0.001,
    validation_split: float = 0.2,
) -> Tuple[ValueNetwork, PolicyNetwork]:
    """Enhanced training function with more frequent progress updates"""
    device = get_device()
    if batch_size is None:
        batch_size = get_optimal_batch_size(device)

    print(f"=== TRAINING DEVICE CHECK ===")
    print(f"Training on device: {device}")
    print(f"Device type: {device.type}")
    if device.type == "cpu":
        print("ERROR: CPU detected in training function! This should not happen.")
        raise RuntimeError("CPU detected - GPU training required")
    print(f"Batch size: {batch_size}")
    print(f"DataLoader workers: {get_optimal_workers()}")
    print("=============================")
    sys.stdout.flush()

    # Split data into training and validation
    random.shuffle(training_data)
    split_idx = int(len(training_data) * (1 - validation_split))
    train_data = training_data[:split_idx]
    val_data = training_data[split_idx:]
    
    print(f"Training samples: {len(train_data)}, Validation samples: {len(val_data)}")
    sys.stdout.flush()

    train_dataset = GameDataset(train_data)
    val_dataset = GameDataset(val_data)
    
    train_dataloader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=get_optimal_workers(),
        pin_memory=device.type in ["cuda", "mps"],
    )
    
    val_dataloader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=get_optimal_workers(),
        pin_memory=device.type in ["cuda", "mps"],
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
    print(f"Estimated time per epoch: ~{len(train_data) // batch_size * 0.01:.1f} seconds")
    print("Progress updates every epoch with detailed metrics...")
    sys.stdout.flush()

    best_val_loss = float('inf')
    patience_counter = 0
    patience = 20
    start_time = time.time()

    # Create progress bar for epochs
    epoch_pbar = tqdm(range(epochs), desc="Training epochs", unit="epoch")

    for epoch in epoch_pbar:
        epoch_start_time = time.time()
        
        # Training phase
        value_network.train()
        policy_network.train()
        
        train_value_losses = []
        train_policy_losses = []
        
        # Create batch progress bar for first epoch only
        if epoch == 0:
            batch_pbar = tqdm(train_dataloader, desc=f"Epoch {epoch + 1} training", leave=False)
        else:
            batch_pbar = train_dataloader

        for batch_idx, (features, value_targets, policy_targets) in enumerate(batch_pbar):
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

        # Update progress bar with current metrics
        epoch_pbar.set_postfix({
            'Train_V': f'{avg_train_value_loss:.4f}',
            'Train_P': f'{avg_train_policy_loss:.4f}',
            'Val_V': f'{avg_val_value_loss:.4f}',
            'Val_P': f'{avg_val_policy_loss:.4f}',
            'LR': f'{value_optimizer.param_groups[0]["lr"]:.6f}'
        })

        epoch_time = time.time() - epoch_start_time
        total_time = time.time() - start_time
        
        # Also print detailed epoch progress
        print(f"\nEpoch {epoch + 1}/{epochs} ({epoch_time:.1f}s) - "
              f"Train V: {avg_train_value_loss:.4f}, P: {avg_train_policy_loss:.4f} - "
              f"Val V: {avg_val_value_loss:.4f}, P: {avg_val_policy_loss:.4f} - "
              f"LR: {value_optimizer.param_groups[0]['lr']:.6f} - "
              f"Total: {total_time:.1f}s")
        sys.stdout.flush()

        if patience_counter >= patience:
            print(f"\nEarly stopping at epoch {epoch + 1}")
            sys.stdout.flush()
            break

    epoch_pbar.close()

    return value_network, policy_network


def main():
    # Force device check at startup
    print("=== DEVICE CHECK ===")
    device = get_device()
    print(f"Detected device: {device}")
    print(f"Device type: {device.type}")
    if device.type == "cpu":
        print("ERROR: CPU detected! Training will be very slow.")
        print("Please check PyTorch MPS installation.")
        return
    print("GPU detected - proceeding with training")
    print("==================")
    print()
    
    parser = argparse.ArgumentParser(description="Train ML AI for Royal Game of Ur - Versioned")
    parser.add_argument(
        "--version", type=str, default="v3", help="ML version to train (e.g., v1, v2, v3, v4, v5)"
    )
    parser.add_argument(
        "--num-games", type=int, help="Override number of games to simulate"
    )
    parser.add_argument(
        "--epochs", type=int, help="Override number of training epochs"
    )
    parser.add_argument(
        "--learning-rate", type=float, help="Override learning rate"
    )
    parser.add_argument(
        "--batch-size", type=int, help="Override training batch size"
    )
    parser.add_argument(
        "--output-dir", type=str, default="ml/data/weights", help="Output directory for weights"
    )
    parser.add_argument(
        "--load-existing", action="store_true", help="Load existing training data"
    )
    parser.add_argument(
        "--reuse-games", action="store_true", help="Reuse existing games from training_data_cache.json"
    )
    parser.add_argument(
        "--seed", type=int, help="Override random seed"
    )
    parser.add_argument(
        "--validation-split", type=float, help="Override validation split ratio"
    )
    parser.add_argument(
        "--list-versions", action="store_true", help="List available version configurations"
    )

    args = parser.parse_args()

    if args.list_versions:
        print("Available ML versions and their configurations:")
        print("=" * 60)
        for version in ["v1", "v2", "v3", "v4", "v5"]:
            config = get_version_config(version)
            print(f"\n{version.upper()}:")
            print(f"  Games: {config['num_games']:,}")
            print(f"  Epochs: {config['epochs']:,}")
            print(f"  Learning Rate: {config['learning_rate']}")
            print(f"  Improvements: {len(config['improvements'])} features")
        return

    # Get version configuration
    config = get_version_config(args.version)
    
    # Override with command line arguments if provided
    if args.num_games is not None:
        config["num_games"] = args.num_games
    if args.epochs is not None:
        config["epochs"] = args.epochs
    if args.learning_rate is not None:
        config["learning_rate"] = args.learning_rate
    if args.batch_size is not None:
        config["batch_size"] = args.batch_size
    if args.seed is not None:
        config["seed"] = args.seed
    if args.validation_split is not None:
        config["validation_split"] = args.validation_split

    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Generate output filename
    output_filename = os.path.join(args.output_dir, f"ml_ai_weights_{args.version}.json")

    set_random_seeds(config["seed"])
    # Get the actual device that will be used
    device = get_device()
    print(f"Starting ML AI training for {args.version.upper()}...")
    print(f"Configuration: {config['num_games']:,} games, {config['epochs']:,} epochs, learning rate {config['learning_rate']}")
    print(f"Device: {device}")
    print(f"Parallel workers: {get_optimal_workers()}")
    print(f"Output: {output_filename}")
    if args.reuse_games:
        print("Reusing existing games from training_data_cache.json")
    sys.stdout.flush()

    start_time = time.time()
    
    # Check if we should reuse existing games
    if args.reuse_games and os.path.exists("training_data_cache.json"):
        print("Loading existing training data...")
        with open("training_data_cache.json", "r") as f:
            training_data = json.load(f)
        print(f"Loaded {len(training_data)} existing training samples")
        sys.stdout.flush()
    else:
        training_data = generate_training_data(
            num_games=config["num_games"],
            use_rust_ai=config["use_rust_ai"],
            save_data=True,
            load_existing=args.load_existing,
        )
        print(f"Generated {len(training_data)} training samples")
        sys.stdout.flush()

    value_network, policy_network = train_networks_with_progress(
        training_data=training_data,
        epochs=config["epochs"],
        batch_size=config.get("batch_size"),
        learning_rate=config["learning_rate"],
        validation_split=config["validation_split"],
    )

    training_time = time.time() - start_time
    
    # Collect training metadata
    training_metadata = {
        "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "version": args.version,
        "num_games": config["num_games"],
        "num_training_samples": len(training_data),
        "epochs": config["epochs"],
        "learning_rate": config["learning_rate"],
        "batch_size": config.get("batch_size") or get_optimal_batch_size(get_device()),
        "validation_split": config["validation_split"],
        "seed": config["seed"],
        "use_rust_ai": config["use_rust_ai"],
        "training_time_seconds": training_time,
        "device": str(get_device()),
        "model_version": args.version,
        "improvements": config["improvements"],
        "reused_games": args.reuse_games
    }

    save_weights_optimized(
        value_network, 
        policy_network, 
        output_filename, 
        quantize=config["quantize"],
        compress=config["compress"],
        training_metadata=training_metadata
    )
    
    print(f"Training completed in {training_time:.2f} seconds!")
    print(f"Training metadata: {training_metadata}")
    print(f"\nNext steps:")
    print(f"1. Test the model: cd worker/rust_ai_core && cargo test test_ml_{args.version}_vs_expectiminimax_ai -- --nocapture")
    print(f"2. Load weights: npm run load:ml-weights {output_filename}")
    print(f"3. Evaluate: npm run evaluate:ml -- --model {output_filename} --num-games 100")
    sys.stdout.flush()


if __name__ == "__main__":
    main() 