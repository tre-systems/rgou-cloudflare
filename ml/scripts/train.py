#!/usr/bin/env python3
"""
Unified ML training script for Royal Game of Ur
Supports both Rust and PyTorch backends with shared configuration
"""

import json
import subprocess
import sys
import time
import argparse
from pathlib import Path
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class UnifiedTrainer:
    def __init__(self, config_path: str = "ml/config/training.json"):
        self.config_path = Path(config_path)
        self.config = self.load_config()
        
        # Ensure directories exist
        self.training_data_dir = Path.home() / "Desktop" / "rgou-training-data"
        self.training_data_dir.mkdir(parents=True, exist_ok=True)
        
        self.weights_dir = Path.cwd() / "ml" / "data" / "weights"
        self.weights_dir.mkdir(parents=True, exist_ok=True)
    
    def load_config(self) -> Dict[str, Any]:
        """Load unified training configuration"""
        if not self.config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        
        with open(self.config_path, 'r') as f:
            return json.load(f)
    
    def get_training_params(self, preset: str = "default", **overrides) -> Dict[str, Any]:
        """Get training parameters from config with optional overrides"""
        if preset == "production":
            params = self.config["production_settings"].copy()
        elif preset == "quick":
            params = self.config["quick_test_settings"].copy()
        else:
            params = self.config["training_defaults"].copy()
        
        # Apply overrides
        params.update(overrides)
        return params
    
    def train_rust(self, params: Dict[str, Any], output_file: str) -> bool:
        """Train using Rust backend"""
        logger.info("🦀 Starting Rust training...")
        
        cmd = [
            "cargo", "run", "--bin", "train", "--release", 
            "--features", "training", "--", "train",
            str(params["num_games"]),
            str(params["epochs"]),
            str(params["learning_rate"]),
            str(params["batch_size"]),
            str(params["depth"]),
            output_file
        ]
        
        try:
            result = subprocess.run(
                cmd,
                cwd="worker/rust_ai_core",
                capture_output=True,
                text=True,
                check=True
            )
            logger.info("✅ Rust training completed successfully")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Rust training failed: {e}")
            logger.error(f"stdout: {e.stdout}")
            logger.error(f"stderr: {e.stderr}")
            return False
    
    def train_pytorch(self, params: Dict[str, Any], output_file: str) -> bool:
        """Train using PyTorch backend"""
        logger.info("🔥 Starting PyTorch training...")
        
        # Create temporary config for PyTorch
        temp_config = {
            "num_games": params["num_games"],
            "epochs": params["epochs"],
            "batch_size": params["batch_size"],
            "learning_rate": params["learning_rate"],
            "validation_split": params.get("validation_split", 0.2),
            "depth": params["depth"],
            "seed": params.get("seed", 42),
            "output_file": str(self.training_data_dir / "temp_training_data.json")
        }
        
        config_file = self.training_data_dir / "temp_config.json"
        with open(config_file, 'w') as f:
            json.dump(temp_config, f, indent=2)
        
        try:
            # Run PyTorch training
            cmd = [
                "python3", "ml/scripts/train_pytorch.py",
                str(params["num_games"]),
                str(params["epochs"]),
                str(params["learning_rate"]),
                str(params["batch_size"]),
                str(params["depth"]),
                output_file
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            logger.info("✅ PyTorch training completed successfully")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ PyTorch training failed: {e}")
            logger.error(f"stdout: {e.stdout}")
            logger.error(f"stderr: {e.stderr}")
            return False
        finally:
            # Clean up temporary files
            config_file.unlink(missing_ok=True)
            (self.training_data_dir / "temp_training_data.json").unlink(missing_ok=True)
    
    def train(self, backend: str = "auto", preset: str = "default", 
              output_file: Optional[str] = None, **overrides) -> bool:
        """Main training function with backend selection"""
        
        # Get training parameters
        params = self.get_training_params(preset, **overrides)
        
        # Determine output file
        if output_file is None:
            if backend == "pytorch":
                output_file = self.config["output_formats"]["pytorch"]
            elif backend == "rust":
                output_file = self.config["output_formats"]["rust"]
            else:
                output_file = self.config["output_formats"]["unified"]
        
        output_path = self.weights_dir / output_file
        
        # Auto-detect backend if not specified
        if backend == "auto":
            if self.check_pytorch_available():
                backend = "pytorch"
                logger.info("🔥 Auto-selected PyTorch backend")
            else:
                backend = "rust"
                logger.info("🦀 Auto-selected Rust backend")
        
        # Log training parameters
        logger.info(f"🚀 Starting {backend.upper()} training...")
        logger.info(f"📊 Parameters: {params}")
        logger.info(f"📁 Output: {output_path}")
        
        # Run training
        start_time = time.time()
        
        if backend == "pytorch":
            success = self.train_pytorch(params, str(output_path))
        elif backend == "rust":
            success = self.train_rust(params, str(output_path))
        else:
            logger.error(f"❌ Unknown backend: {backend}")
            return False
        
        if success:
            training_time = time.time() - start_time
            logger.info(f"🎉 Training completed in {training_time:.2f} seconds")
            logger.info(f"📁 Weights saved to: {output_path}")
            return True
        else:
            return False
    
    def check_pytorch_available(self) -> bool:
        """Check if PyTorch is available with GPU support"""
        try:
            import torch
            # Only consider PyTorch available if GPU acceleration is available
            if torch.cuda.is_available() or (hasattr(torch.backends, 'mps') and torch.backends.mps.is_available()):
                return True
            else:
                logger.warning("⚠️  PyTorch available but no GPU acceleration detected")
                logger.warning("   PyTorch training requires GPU acceleration (CUDA or MPS)")
                return False
        except ImportError:
            return False

def main():
    parser = argparse.ArgumentParser(description="Unified ML Training Script")
    parser.add_argument("--backend", choices=["auto", "rust", "pytorch"], 
                       default="auto", help="Training backend to use")
    parser.add_argument("--preset", choices=["default", "quick", "production"], 
                       default="default", help="Training preset to use")
    parser.add_argument("--output", help="Output file name")
    parser.add_argument("--num-games", type=int, help="Number of games to generate")
    parser.add_argument("--epochs", type=int, help="Number of training epochs")
    parser.add_argument("--learning-rate", type=float, help="Learning rate")
    parser.add_argument("--batch-size", type=int, help="Batch size")
    parser.add_argument("--depth", type=int, help="Search depth")
    
    args = parser.parse_args()
    
    # Build overrides dict
    overrides = {}
    if args.num_games is not None:
        overrides["num_games"] = args.num_games
    if args.epochs is not None:
        overrides["epochs"] = args.epochs
    if args.learning_rate is not None:
        overrides["learning_rate"] = args.learning_rate
    if args.batch_size is not None:
        overrides["batch_size"] = args.batch_size
    if args.depth is not None:
        overrides["depth"] = args.depth
    
    try:
        trainer = UnifiedTrainer()
        success = trainer.train(
            backend=args.backend,
            preset=args.preset,
            output_file=args.output,
            **overrides
        )
        
        if not success:
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 