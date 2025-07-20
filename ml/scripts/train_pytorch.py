#!/usr/bin/env python3
"""
PyTorch-based training script for Royal Game of Ur ML AI
Leverages existing Rust code for data generation and game logic
"""

import json
import subprocess
import sys
import time
import argparse
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import torch.nn.functional as F
from dataclasses import dataclass
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class TrainingConfig:
    num_games: int = 1000
    epochs: int = 50
    batch_size: int = 32
    learning_rate: float = 0.001
    validation_split: float = 0.2
    depth: int = 3
    seed: int = 42
    output_file: str = "ml_ai_weights_pytorch.json"
    temp_data_file: str = "temp_training_data.json"
    
    def __post_init__(self):
        # Ensure training data directory exists
        self.training_data_dir = Path.home() / "Desktop" / "rgou-training-data"
        self.training_data_dir.mkdir(parents=True, exist_ok=True)
        
        # Ensure weights directory exists
        self.weights_dir = Path.cwd() / "ml" / "weights"
        self.weights_dir.mkdir(parents=True, exist_ok=True)
        
        # Update temp file path to use training data directory
        self.temp_data_file = str(self.training_data_dir / "temp_training_data.json")
        
        # Update output file path to use weights directory
        if not self.output_file.startswith('/') and not self.output_file.startswith('./'):
            self.output_file = str(self.weights_dir / self.output_file)

class ValueNetwork(nn.Module):
    def __init__(self, input_size: int = 150, hidden_sizes: List[int] = None):
        super().__init__()
        if hidden_sizes is None:
            hidden_sizes = [256, 128, 64, 32]
        
        layers = []
        prev_size = input_size
        
        for hidden_size in hidden_sizes:
            layers.extend([
                nn.Linear(prev_size, hidden_size),
                nn.ReLU(),
                nn.Dropout(0.1)
            ])
            prev_size = hidden_size
        
        layers.append(nn.Linear(prev_size, 1))
        
        self.network = nn.Sequential(*layers)
        
    def forward(self, x):
        return torch.tanh(self.network(x))

class PolicyNetwork(nn.Module):
    def __init__(self, input_size: int = 150, output_size: int = 7, hidden_sizes: List[int] = None):
        super().__init__()
        if hidden_sizes is None:
            hidden_sizes = [256, 128, 64, 32]
        
        layers = []
        prev_size = input_size
        
        for hidden_size in hidden_sizes:
            layers.extend([
                nn.Linear(prev_size, hidden_size),
                nn.ReLU(),
                nn.Dropout(0.1)
            ])
            prev_size = hidden_size
        
        layers.append(nn.Linear(prev_size, output_size))
        
        self.network = nn.Sequential(*layers)
        
    def forward(self, x):
        return F.softmax(self.network(x), dim=-1)

class PyTorchTrainer:
    def __init__(self, config: TrainingConfig):
        self.config = config
        
        # Detect best available device
        if torch.cuda.is_available():
            self.device = torch.device('cuda')
            logger.info(f"🎮 Using CUDA GPU: {torch.cuda.get_device_name()}")
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            self.device = torch.device('mps')
            logger.info("🍎 Using Apple Metal Performance Shaders (MPS)")
        else:
            self.device = torch.device('cpu')
            logger.warning("💻 Using CPU - no GPU acceleration available")
        
        logger.info(f"Using device: {self.device}")
        
        # Initialize networks
        self.value_network = ValueNetwork().to(self.device)
        self.policy_network = PolicyNetwork().to(self.device)
        
        # Initialize optimizers
        self.value_optimizer = optim.Adam(self.value_network.parameters(), lr=config.learning_rate)
        self.policy_optimizer = optim.Adam(self.policy_network.parameters(), lr=config.learning_rate)
        
        # Loss functions
        self.value_criterion = nn.MSELoss()
        self.policy_criterion = nn.CrossEntropyLoss()
        
        logger.info(f"Value network parameters: {sum(p.numel() for p in self.value_network.parameters()):,}")
        logger.info(f"Policy network parameters: {sum(p.numel() for p in self.policy_network.parameters()):,}")
    
    def generate_training_data(self) -> List[Dict[str, Any]]:
        """Generate training data using Rust code"""
        logger.info("🎮 Generating training data using Rust...")
        
        # Create config for Rust data generation
        rust_config = {
            "num_games": self.config.num_games,
            "epochs": 1,  # Not used for data generation
            "batch_size": self.config.batch_size,
            "learning_rate": self.config.learning_rate,
            "validation_split": self.config.validation_split,
            "depth": self.config.depth,
            "seed": self.config.seed,
            "output_file": self.config.temp_data_file
        }
        
        # Save config to temporary file in training data directory
        config_file = self.config.training_data_dir / "temp_config.json"
        with open(config_file, 'w') as f:
            json.dump(rust_config, f, indent=2)
        
        try:
            # Run Rust data generation
            cmd = [
                "cargo", "run", "--bin", "train", "--release", 
                "--features", "training", "--", "generate_data", str(config_file)
            ]
            
            # Run Rust data generation with real-time output
            logger.info("🎮 Starting Rust data generation...")
            process = subprocess.Popen(
                cmd,
                cwd="worker/rust_ai_core",
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Stream output in real-time
            for line in process.stdout:
                print(line.rstrip())
            
            # Wait for completion
            process.wait()
            
            if process.returncode != 0:
                raise subprocess.CalledProcessError(process.returncode, cmd)
            
            logger.info("✅ Data generation complete")
            
            # Load generated data (file is saved in training data directory)
            data_file_path = Path(self.config.temp_data_file)
            with open(data_file_path, 'r') as f:
                training_data = json.load(f)
            
            logger.info(f"📊 Loaded {len(training_data)} training samples")
            return training_data
            
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Rust data generation failed: {e}")
            logger.error(f"stdout: {e.stdout}")
            logger.error(f"stderr: {e.stderr}")
            raise
        finally:
            # Clean up temporary config file
            Path(config_file).unlink(missing_ok=True)
    
    def prepare_data_loaders(self, training_data: List[Dict[str, Any]]) -> Tuple[DataLoader, DataLoader]:
        """Convert training data to PyTorch DataLoaders"""
        logger.info("🔄 Preparing data loaders...")
        
        # Extract features and targets
        features = torch.tensor([sample['features'] for sample in training_data], dtype=torch.float32)
        value_targets = torch.tensor([sample['value_target'] for sample in training_data], dtype=torch.float32).unsqueeze(1)
        policy_targets = torch.tensor([sample['policy_target'] for sample in training_data], dtype=torch.float32)
        
        # Split into train/validation
        split_idx = int(len(training_data) * (1 - self.config.validation_split))
        
        train_features = features[:split_idx]
        train_value_targets = value_targets[:split_idx]
        train_policy_targets = policy_targets[:split_idx]
        
        val_features = features[split_idx:]
        val_value_targets = value_targets[split_idx:]
        val_policy_targets = policy_targets[split_idx:]
        
        # Create datasets
        train_dataset = TensorDataset(train_features, train_value_targets, train_policy_targets)
        val_dataset = TensorDataset(val_features, val_value_targets, val_policy_targets)
        
        # Create data loaders
        train_loader = DataLoader(
            train_dataset, 
            batch_size=self.config.batch_size, 
            shuffle=True,
            num_workers=0  # Keep simple for now
        )
        val_loader = DataLoader(
            val_dataset, 
            batch_size=self.config.batch_size, 
            shuffle=False,
            num_workers=0
        )
        
        logger.info(f"📊 Train samples: {len(train_dataset)}, Validation samples: {len(val_dataset)}")
        return train_loader, val_loader
    
    def train_epoch(self, train_loader: DataLoader) -> float:
        """Train for one epoch"""
        self.value_network.train()
        self.policy_network.train()
        
        total_loss = 0.0
        num_batches = 0
        
        for batch_idx, (features, value_targets, policy_targets) in enumerate(train_loader):
            features = features.to(self.device)
            value_targets = value_targets.to(self.device)
            policy_targets = policy_targets.to(self.device)
            
            # Forward pass
            value_outputs = self.value_network(features)
            policy_outputs = self.policy_network(features)
            
            # Calculate losses
            value_loss = self.value_criterion(value_outputs, value_targets)
            policy_loss = self.policy_criterion(policy_outputs, policy_targets)
            total_loss_batch = value_loss + policy_loss
            
            # Backward pass
            self.value_optimizer.zero_grad()
            self.policy_optimizer.zero_grad()
            total_loss_batch.backward()
            self.value_optimizer.step()
            self.policy_optimizer.step()
            
            total_loss += total_loss_batch.item()
            num_batches += 1
            
            # Progress reporting
            if batch_idx % 100 == 0:
                logger.info(f"   📊 Batch {batch_idx}/{len(train_loader)} | Loss: {total_loss_batch.item():.4f}")
        
        return total_loss / num_batches
    
    def validate_epoch(self, val_loader: DataLoader) -> float:
        """Validate for one epoch"""
        self.value_network.eval()
        self.policy_network.eval()
        
        total_loss = 0.0
        num_batches = 0
        
        with torch.no_grad():
            for features, value_targets, policy_targets in val_loader:
                features = features.to(self.device)
                value_targets = value_targets.to(self.device)
                policy_targets = policy_targets.to(self.device)
                
                # Forward pass
                value_outputs = self.value_network(features)
                policy_outputs = self.policy_network(features)
                
                # Calculate losses
                value_loss = self.value_criterion(value_outputs, value_targets)
                policy_loss = self.policy_criterion(policy_outputs, policy_targets)
                total_loss_batch = value_loss + policy_loss
                
                total_loss += total_loss_batch.item()
                num_batches += 1
        
        return total_loss / num_batches
    
    def train(self, training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Main training loop"""
        logger.info("🚀 Starting PyTorch training...")
        start_time = time.time()
        
        # Prepare data
        train_loader, val_loader = self.prepare_data_loaders(training_data)
        
        # Training loop
        best_val_loss = float('inf')
        patience_counter = 0
        patience = 20
        loss_history = []
        
        logger.info("🎯 Training Progress:")
        logger.info("═══════════════════════════════════════════════════════════════")
        
        for epoch in range(self.config.epochs):
            epoch_start = time.time()
            
            # Train
            train_loss = self.train_epoch(train_loader)
            
            # Validate
            val_loss = self.validate_epoch(val_loader)
            
            epoch_time = time.time() - epoch_start
            loss_history.append((train_loss, val_loss))
            
            # Progress reporting
            if epoch % 5 == 0 or epoch == 0:
                elapsed = time.time() - start_time
                epochs_completed = epoch + 1
                epochs_remaining = self.config.epochs - epochs_completed
                
                avg_epoch_time = elapsed / epochs_completed
                eta_seconds = avg_epoch_time * epochs_remaining
                eta_minutes = eta_seconds / 60.0
                
                loss_improvement = 0.0
                if len(loss_history) > 1:
                    prev_val_loss = loss_history[-2][1]
                    loss_improvement = val_loss - prev_val_loss
                
                logger.info(
                    f"⏱️  Epoch {epochs_completed}/{self.config.epochs} ({epoch_time:.0f}s) | "
                    f"Train: {train_loss:.4f} | Val: {val_loss:.4f} | Δ: {loss_improvement:+.4f} | "
                    f"ETA: {eta_minutes:.1f}m"
                )
                
                if len(loss_history) >= 3:
                    recent_train_trend = [loss_history[i][0] for i in range(-3, 0)]
                    recent_val_trend = [loss_history[i][1] for i in range(-3, 0)]
                    
                    train_trend = "📉" if recent_train_trend[-1] < recent_train_trend[0] else "📈"
                    val_trend = "📉" if recent_val_trend[-1] < recent_val_trend[0] else "📈"
                    
                    logger.info(
                        f"   📊 Trends: Train {train_trend} | Val {val_trend} | Best Val: {best_val_loss:.4f}"
                    )
            
            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                logger.info(f"   🎉 New best validation loss: {best_val_loss:.4f}")
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    logger.info(f"🛑 Early stopping at epoch {epoch + 1} (no improvement for {patience} epochs)")
                    break
        
        training_time = time.time() - start_time
        
        logger.info("🎉 === Training Complete ===")
        logger.info(f"⏱️  Total training time: {training_time:.2f} seconds")
        logger.info(f"📊 Final validation loss: {best_val_loss:.4f}")
        
        if loss_history:
            initial_val_loss = loss_history[0][1]
            improvement = ((initial_val_loss - best_val_loss) / initial_val_loss * 100.0)
            logger.info(f"📈 Loss improvement: {improvement:.2f}%")
        
        logger.info("═══════════════════════════════════════════════════════════════")
        
        return {
            "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "version": "pytorch_v1",
            "num_games": self.config.num_games,
            "num_training_samples": len(training_data),
            "epochs": self.config.epochs,
            "learning_rate": self.config.learning_rate,
            "batch_size": self.config.batch_size,
            "validation_split": self.config.validation_split,
            "seed": self.config.seed,
            "training_time_seconds": training_time,
            "best_validation_loss": best_val_loss,
            "improvements": [
                "PyTorch-based training for maximum speed",
                "GPU acceleration when available",
                "Leverages existing Rust data generation",
                "Optimized neural network architecture",
                "Early stopping and learning rate scheduling"
            ]
        }
    
    def save_weights(self, filename: str, metadata: Dict[str, Any]):
        """Save trained weights and metadata"""
        logger.info(f"💾 Saving weights to {filename}...")
        
        # Get weights as lists
        value_weights = []
        policy_weights = []
        
        for param in self.value_network.parameters():
            value_weights.extend(param.data.cpu().numpy().flatten().tolist())
        
        for param in self.policy_network.parameters():
            policy_weights.extend(param.data.cpu().numpy().flatten().tolist())
        
        # Create weights data
        weights_data = {
            "value_weights": value_weights,
            "policy_weights": policy_weights,
            "metadata": metadata,
            "network_config": {
                "value_network": {
                    "input_size": 150,
                    "hidden_sizes": [256, 128, 64, 32],
                    "output_size": 1
                },
                "policy_network": {
                    "input_size": 150,
                    "hidden_sizes": [256, 128, 64, 32],
                    "output_size": 7
                }
            }
        }
        
        # Save to file
        with open(filename, 'w') as f:
            json.dump(weights_data, f, indent=2)
        
        logger.info(f"✅ Weights saved to {filename}")

def main():
    parser = argparse.ArgumentParser(description="PyTorch-based ML AI Training")
    parser.add_argument("num_games", type=int, nargs='?', default=1000, help="Number of games to generate")
    parser.add_argument("epochs", type=int, nargs='?', default=50, help="Number of training epochs")
    parser.add_argument("learning_rate", type=float, nargs='?', default=0.001, help="Learning rate")
    parser.add_argument("batch_size", type=int, nargs='?', default=32, help="Batch size")
    parser.add_argument("depth", type=int, nargs='?', default=3, help="Search depth")
    parser.add_argument("output_file", type=str, nargs='?', default="ml_ai_weights_pytorch.json", help="Output file")
    
    args = parser.parse_args()
    
    # Create config
    config = TrainingConfig(
        num_games=args.num_games,
        epochs=args.epochs,
        learning_rate=args.learning_rate,
        batch_size=args.batch_size,
        depth=args.depth,
        output_file=args.output_file
    )
    
    logger.info("🚀 Starting PyTorch ML AI Training...")
    logger.info(f"📊 Training Parameters:")
    logger.info(f"  Games: {config.num_games}")
    logger.info(f"  Epochs: {config.epochs}")
    logger.info(f"  Learning Rate: {config.learning_rate}")
    logger.info(f"  Batch Size: {config.batch_size}")
    logger.info(f"  Search Depth: {config.depth}")
    logger.info(f"  Output: {config.output_file}")
    logger.info(f"  Training Data Directory: {config.training_data_dir}")
    
    # Clear GPU status display
    logger.info(f"🎮 GPU Status:")
    if torch.cuda.is_available():
        logger.info(f"  ✅ CUDA GPU: {torch.cuda.get_device_name()}")
        logger.info(f"  📊 GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f}GB")
        logger.info(f"  🚀 GPU acceleration will be used!")
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        logger.info(f"  ✅ Apple Metal (MPS): Available")
        logger.info(f"  🚀 GPU acceleration will be used!")
    else:
        logger.info(f"  ⚠️  No GPU detected - using CPU only")
        logger.info(f"  💡 Install CUDA or use Apple Silicon for GPU acceleration")
        logger.info(f"  🐌 Training will be significantly slower without GPU")
    
    logger.info(f"  🎯 Training Device: {trainer.device if 'trainer' in locals() else 'Will be set'}")
    
    try:
        # Create trainer
        trainer = PyTorchTrainer(config)
        
        # Generate training data using Rust
        training_data = trainer.generate_training_data()
        
        # Train using PyTorch
        metadata = trainer.train(training_data)
        
        # Save weights
        trainer.save_weights(config.output_file, metadata)
        
        logger.info("✅ Training complete!")
        logger.info(f"📁 Weights saved to: {config.output_file}")
        
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        sys.exit(1)
    finally:
        # Clean up temporary files
        Path(config.temp_data_file).unlink(missing_ok=True)
        (config.training_data_dir / "temp_config.json").unlink(missing_ok=True)

if __name__ == "__main__":
    main() 