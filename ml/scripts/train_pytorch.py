#!/usr/bin/env python3
"""Train the production network with PyTorch and Rust-generated self-play."""

import argparse
import copy
import json
import logging
import os
import platform
import random
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


def source_commit() -> tuple[str, str]:
    source_paths = [
        "ml/config",
        "ml/scripts",
        "ml/pyproject.toml",
        "ml/uv.lock",
        "rust-toolchain.toml",
        "worker/rust_ai_core",
    ]
    status = subprocess.run(
        [
            "git",
            "status",
            "--porcelain",
            "--untracked-files=normal",
            "--",
            *source_paths,
        ],
        check=True,
        capture_output=True,
        text=True,
        cwd=REPOSITORY_ROOT,
    )
    if status.stdout.strip():
        raise RuntimeError("training sources must be committed before starting a run")
    result = subprocess.run(
        ["git", "show", "-s", "--format=%H%x00%cI", "HEAD"],
        check=True,
        capture_output=True,
        text=True,
        cwd=REPOSITORY_ROOT,
    )
    revision, separator, committed_at = result.stdout.strip().partition("\x00")
    if not separator:
        raise RuntimeError("could not determine the training source commit")
    return revision, committed_at


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
        if self.num_games <= 0 or self.epochs <= 0 or self.batch_size <= 0:
            raise ValueError("num_games, epochs, and batch_size must be positive")
        if self.learning_rate <= 0 or self.depth <= 0:
            raise ValueError("learning_rate and depth must be positive")
        if not 0 < self.validation_split < 1:
            raise ValueError("validation_split must be between 0 and 1")

        self.unified_config = self.load_unified_config()

        configured_data_dir = os.environ.get("RGOU_TRAINING_DATA_DIR")
        self.training_data_dir = (
            Path(configured_data_dir).expanduser()
            if configured_data_dir
            else Path.home() / "Desktop/rgou-training-data"
        )
        self.training_data_dir.mkdir(parents=True, exist_ok=True)

        self.weights_dir = REPOSITORY_ROOT / "ml/data/weights"
        self.weights_dir.mkdir(parents=True, exist_ok=True)

        self.temp_data_file = str(self.training_data_dir / "temp_training_data.json")

        if not Path(self.output_file).is_absolute():
            self.output_file = str(self.weights_dir / self.output_file)

    def load_unified_config(self) -> dict[str, Any]:
        config_path = REPOSITORY_ROOT / "ml/config/training.json"
        return json.loads(config_path.read_text(encoding="utf-8"))


class ValueNetwork(nn.Module):
    def __init__(self, network_config: dict[str, Any]):
        super().__init__()
        input_size = network_config["input_size"]
        hidden_sizes = network_config["hidden_sizes"]
        output_size = network_config["value_output_size"]

        layers = []
        prev_size = input_size

        for hidden_size in hidden_sizes:
            layers.extend(
                [nn.Linear(prev_size, hidden_size), nn.ReLU(), nn.Dropout(0.1)]
            )
            prev_size = hidden_size

        layers.append(nn.Linear(prev_size, output_size))

        self.network = nn.Sequential(*layers)

    def forward(self, x):
        return torch.tanh(self.network(x))


class PolicyNetwork(nn.Module):
    def __init__(self, network_config: dict[str, Any]):
        super().__init__()
        input_size = network_config["input_size"]
        hidden_sizes = network_config["hidden_sizes"]
        output_size = network_config["policy_output_size"]

        layers = []
        prev_size = input_size

        for hidden_size in hidden_sizes:
            layers.extend(
                [nn.Linear(prev_size, hidden_size), nn.ReLU(), nn.Dropout(0.1)]
            )
            prev_size = hidden_size

        layers.append(nn.Linear(prev_size, output_size))

        self.network = nn.Sequential(*layers)

    def forward(self, x):
        return self.network(x)


class PyTorchTrainer:
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.source_revision, self.source_committed_at = source_commit()
        self.configure_reproducibility()

        # Detect best available device - REQUIRE GPU acceleration
        if torch.cuda.is_available():
            self.device = torch.device("cuda")
            logger.info(f"🎮 Using CUDA GPU: {torch.cuda.get_device_name()}")
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            self.device = torch.device("mps")
            logger.info("🍎 Using Apple Metal Performance Shaders (MPS)")
        else:
            logger.error("❌ GPU acceleration required for PyTorch training!")
            logger.error("   CUDA or Apple Metal (MPS) must be available.")
            logger.error(
                "   Please install PyTorch with GPU support or use Rust backend instead."
            )
            raise RuntimeError("GPU acceleration required for PyTorch training")

        logger.info(f"Using device: {self.device}")

        # Initialize networks using unified configuration
        network_config = config.unified_config["network_architecture"]
        self.value_network = ValueNetwork(network_config).to(self.device)
        self.policy_network = PolicyNetwork(network_config).to(self.device)

        # Initialize optimizers
        self.value_optimizer = optim.Adam(
            self.value_network.parameters(), lr=config.learning_rate
        )
        self.policy_optimizer = optim.Adam(
            self.policy_network.parameters(), lr=config.learning_rate
        )

        # Loss functions
        self.value_criterion = nn.MSELoss()
        self.policy_criterion = nn.CrossEntropyLoss()

        logger.info(
            f"Value network parameters: {sum(p.numel() for p in self.value_network.parameters()):,}"
        )
        logger.info(
            f"Policy network parameters: {sum(p.numel() for p in self.policy_network.parameters()):,}"
        )

    def configure_reproducibility(self):
        random.seed(self.config.seed)
        np.random.seed(self.config.seed)
        torch.manual_seed(self.config.seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(self.config.seed)
            torch.backends.cudnn.benchmark = False
            torch.backends.cudnn.deterministic = True
        self.data_loader_generator = torch.Generator().manual_seed(self.config.seed)

    def generate_training_data(self) -> list[dict[str, Any]]:
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
            "output_file": self.config.temp_data_file,
        }

        # Save config to temporary file in training data directory
        config_file = self.config.training_data_dir / "temp_config.json"
        with open(config_file, "w") as f:
            json.dump(rust_config, f, indent=2)

        try:
            # Run Rust data generation
            cmd = [
                "cargo",
                "run",
                "--bin",
                "train",
                "--release",
                "--features",
                "training",
                "--",
                "generate_data",
                str(config_file),
            ]

            # Run Rust data generation with real-time output
            logger.info("🎮 Starting Rust data generation...")
            process = subprocess.Popen(
                cmd,
                cwd=REPOSITORY_ROOT / "worker/rust_ai_core",
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True,
            )

            # Stream output in real-time
            if process.stdout is not None:
                for line in process.stdout:
                    print(line.rstrip())

            # Wait for completion
            process.wait()

            if process.returncode != 0:
                raise subprocess.CalledProcessError(process.returncode, cmd)

            logger.info("✅ Data generation complete")

            # Load generated data (file is saved in training data directory)
            data_file_path = Path(self.config.temp_data_file)
            with open(data_file_path, "r") as f:
                training_data = json.load(f)

            logger.info(f"📊 Loaded {len(training_data)} training samples")
            return training_data

        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Rust data generation failed: {e}")
            logger.error(f"stdout: {e.stdout}")
            logger.error(f"stderr: {e.stderr}")
            raise
        finally:
            Path(config_file).unlink(missing_ok=True)

    def prepare_data_loaders(
        self, training_data: list[dict[str, Any]]
    ) -> tuple[DataLoader, DataLoader]:
        """Convert training data to PyTorch DataLoaders"""
        logger.info("🔄 Preparing data loaders...")

        if len(training_data) < 2:
            raise ValueError("training requires at least two samples")

        # Extract features and targets
        features = torch.tensor(
            [sample["features"] for sample in training_data], dtype=torch.float32
        )
        value_targets = torch.tensor(
            [sample["value_target"] for sample in training_data], dtype=torch.float32
        ).unsqueeze(1)
        policy_targets = torch.tensor(
            [sample["policy_target"] for sample in training_data], dtype=torch.float32
        )

        # Split into train/validation
        split_idx = int(len(training_data) * (1 - self.config.validation_split))

        train_features = features[:split_idx]
        train_value_targets = value_targets[:split_idx]
        train_policy_targets = policy_targets[:split_idx]

        val_features = features[split_idx:]
        val_value_targets = value_targets[split_idx:]
        val_policy_targets = policy_targets[split_idx:]

        # Create datasets
        train_dataset = TensorDataset(
            train_features, train_value_targets, train_policy_targets
        )
        val_dataset = TensorDataset(val_features, val_value_targets, val_policy_targets)

        # Create data loaders
        train_loader = DataLoader(
            train_dataset,
            batch_size=self.config.batch_size,
            shuffle=True,
            generator=self.data_loader_generator,
            num_workers=0,  # Keep simple for now
        )
        val_loader = DataLoader(
            val_dataset, batch_size=self.config.batch_size, shuffle=False, num_workers=0
        )

        logger.info(
            f"📊 Train samples: {len(train_dataset)}, Validation samples: {len(val_dataset)}"
        )
        return train_loader, val_loader

    def train_epoch(self, train_loader: DataLoader) -> float:
        """Train for one epoch"""
        self.value_network.train()
        self.policy_network.train()

        total_loss = 0.0
        num_batches = 0

        for batch_idx, (features, value_targets, policy_targets) in enumerate(
            train_loader
        ):
            features = features.to(self.device)
            value_targets = value_targets.to(self.device)
            policy_targets = policy_targets.to(self.device)

            # Forward pass
            value_outputs = self.value_network(features)
            policy_logits = self.policy_network(features)

            # Calculate losses
            value_loss = self.value_criterion(value_outputs, value_targets)
            policy_loss = self.policy_criterion(policy_logits, policy_targets)
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
                logger.info(
                    f"   📊 Batch {batch_idx}/{len(train_loader)} | Loss: {total_loss_batch.item():.4f}"
                )

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
                policy_logits = self.policy_network(features)

                # Calculate losses
                value_loss = self.value_criterion(value_outputs, value_targets)
                policy_loss = self.policy_criterion(policy_logits, policy_targets)
                total_loss_batch = value_loss + policy_loss

                total_loss += total_loss_batch.item()
                num_batches += 1

        return total_loss / num_batches

    def train(self, training_data: list[dict[str, Any]]) -> dict[str, Any]:
        """Main training loop"""
        logger.info("🚀 Starting PyTorch training...")
        start_time = time.time()

        # Prepare data
        train_loader, val_loader = self.prepare_data_loaders(training_data)

        # Training loop
        best_val_loss = float("inf")
        patience_counter = 0
        patience = 20
        loss_history = []
        best_value_state = None
        best_policy_state = None

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

                    train_trend = (
                        "📉" if recent_train_trend[-1] < recent_train_trend[0] else "📈"
                    )
                    val_trend = (
                        "📉" if recent_val_trend[-1] < recent_val_trend[0] else "📈"
                    )

                    logger.info(
                        f"   📊 Trends: Train {train_trend} | Val {val_trend} | Best Val: {best_val_loss:.4f}"
                    )

            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                best_value_state = copy.deepcopy(self.value_network.state_dict())
                best_policy_state = copy.deepcopy(self.policy_network.state_dict())
                logger.info(f"   🎉 New best validation loss: {best_val_loss:.4f}")
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    logger.info(
                        f"🛑 Early stopping at epoch {epoch + 1} (no improvement for {patience} epochs)"
                    )
                    break

        training_time = time.time() - start_time
        if best_value_state is None or best_policy_state is None:
            raise RuntimeError("training completed without a valid checkpoint")
        self.value_network.load_state_dict(best_value_state)
        self.policy_network.load_state_dict(best_policy_state)

        logger.info("🎉 === Training Complete ===")
        logger.info(f"⏱️  Total training time: {training_time:.2f} seconds")
        logger.info(f"📊 Final validation loss: {best_val_loss:.4f}")

        if loss_history:
            initial_val_loss = loss_history[0][1]
            improvement = (initial_val_loss - best_val_loss) / initial_val_loss * 100.0
            logger.info(f"📈 Loss improvement: {improvement:.2f}%")

        logger.info("═══════════════════════════════════════════════════════════════")

        return {
            "training_date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "version": "pytorch_v1",
            "num_games": self.config.num_games,
            "num_training_samples": len(training_data),
            "epochs": len(loss_history),
            "requested_epochs": self.config.epochs,
            "learning_rate": self.config.learning_rate,
            "batch_size": self.config.batch_size,
            "validation_split": self.config.validation_split,
            "depth": self.config.depth,
            "seed": self.config.seed,
            "training_time_seconds": training_time,
            "best_validation_loss": best_val_loss,
            "source_revision": self.source_revision,
            "source_committed_at": self.source_committed_at,
            "python_version": platform.python_version(),
            "numpy_version": np.__version__,
            "torch_version": torch.__version__,
            "improvements": [
                "PyTorch-based training for maximum speed",
                "GPU acceleration when available",
                "Leverages existing Rust data generation",
                "Optimized neural network architecture",
                "Early stopping and learning rate scheduling",
            ],
        }

    def save_weights(self, filename: str, metadata: dict[str, Any]):
        """Save trained weights and metadata"""
        logger.info(f"💾 Saving weights to {filename}...")

        # Get weights as lists
        value_weights = []
        policy_weights = []

        for param in self.value_network.parameters():
            value_weights.extend(param.data.cpu().numpy().flatten().tolist())

        for param in self.policy_network.parameters():
            policy_weights.extend(param.data.cpu().numpy().flatten().tolist())

        # Create weights data using unified configuration
        weights_data = {
            "value_weights": value_weights,
            "policy_weights": policy_weights,
            "metadata": metadata,
            "network_config": self.config.unified_config["network_architecture"],
        }

        # Save to file
        with open(filename, "w") as f:
            json.dump(weights_data, f, indent=2)

        logger.info(f"✅ Weights saved to {filename}")


def main():
    parser = argparse.ArgumentParser(description="PyTorch-based ML AI Training")
    parser.add_argument(
        "num_games",
        type=int,
        nargs="?",
        default=1000,
        help="Number of games to generate",
    )
    parser.add_argument(
        "epochs", type=int, nargs="?", default=50, help="Number of training epochs"
    )
    parser.add_argument(
        "learning_rate", type=float, nargs="?", default=0.001, help="Learning rate"
    )
    parser.add_argument(
        "batch_size", type=int, nargs="?", default=32, help="Batch size"
    )
    parser.add_argument("depth", type=int, nargs="?", default=3, help="Search depth")
    parser.add_argument(
        "output_file",
        type=str,
        nargs="?",
        default="ml_ai_weights_pytorch.json",
        help="Output file",
    )

    args = parser.parse_args()

    # Create config
    config = TrainingConfig(
        num_games=args.num_games,
        epochs=args.epochs,
        learning_rate=args.learning_rate,
        batch_size=args.batch_size,
        depth=args.depth,
        output_file=args.output_file,
    )

    logger.info("🚀 Starting PyTorch ML AI Training...")
    logger.info("📊 Training Parameters:")
    logger.info(f"  Games: {config.num_games}")
    logger.info(f"  Epochs: {config.epochs}")
    logger.info(f"  Learning Rate: {config.learning_rate}")
    logger.info(f"  Batch Size: {config.batch_size}")
    logger.info(f"  Search Depth: {config.depth}")
    logger.info(f"  Output: {config.output_file}")
    logger.info(f"  Training Data Directory: {config.training_data_dir}")

    logger.info("🎮 GPU status:")
    if torch.cuda.is_available():
        logger.info(f"  ✅ CUDA GPU: {torch.cuda.get_device_name()}")
        logger.info(
            f"  📊 GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f}GB"
        )
        logger.info("  🚀 GPU acceleration will be used!")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        logger.info("  ✅ Apple Metal (MPS): Available")
        logger.info("  🚀 GPU acceleration will be used!")
    else:
        logger.error("No compatible GPU detected; use the Rust backend")

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
        Path(config.temp_data_file).unlink(missing_ok=True)
        (config.training_data_dir / "temp_config.json").unlink(missing_ok=True)


if __name__ == "__main__":
    main()
