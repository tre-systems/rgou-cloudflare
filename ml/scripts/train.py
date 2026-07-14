#!/usr/bin/env python3
"""Run the Rust or PyTorch training backend from shared configuration."""

import argparse
import json
import logging
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


def output_path(directory: Path, filename: str) -> Path:
    candidate = (directory / filename).resolve()
    if not candidate.is_relative_to(directory.resolve()):
        raise ValueError("output file must stay inside the weights directory")
    return candidate


class UnifiedTrainer:
    def __init__(self, config_path: Path | None = None):
        self.config_path = config_path or REPOSITORY_ROOT / "ml/config/training.json"
        self.config = self.load_config()

        self.weights_dir = REPOSITORY_ROOT / "ml/data/weights"
        self.weights_dir.mkdir(parents=True, exist_ok=True)

    def load_config(self) -> dict[str, Any]:
        if not self.config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")

        return json.loads(self.config_path.read_text(encoding="utf-8"))

    def get_training_params(self, preset: str, **overrides: Any) -> dict[str, Any]:
        preset_key = {
            "default": "training_defaults",
            "production": "production_settings",
            "quick": "quick_test_settings",
        }.get(preset)
        if preset_key is None:
            raise ValueError(f"Unknown training preset: {preset}")

        params = self.config[preset_key].copy()
        params.update(overrides)
        return params

    def train_rust(self, params: dict[str, Any], output_file: Path) -> bool:
        logger.info("🦀 Starting Rust training...")

        cmd = [
            "cargo",
            "run",
            "--bin",
            "train",
            "--release",
            "--features",
            "training",
            "--",
            "train",
            str(params["num_games"]),
            str(params["epochs"]),
            str(params["learning_rate"]),
            str(params["batch_size"]),
            str(params["depth"]),
            str(output_file),
        ]

        try:
            subprocess.run(
                cmd,
                cwd=REPOSITORY_ROOT / "worker/rust_ai_core",
                check=True,
            )
            logger.info("✅ Rust training completed successfully")
            return True
        except subprocess.CalledProcessError as error:
            logger.error("❌ Rust training failed: %r", error)
            return False

    def train_pytorch(self, params: dict[str, Any], output_file: Path) -> bool:
        logger.info("🔥 Starting PyTorch training...")

        try:
            cmd = [
                sys.executable,
                str(REPOSITORY_ROOT / "ml/scripts/train_pytorch.py"),
                str(params["num_games"]),
                str(params["epochs"]),
                str(params["learning_rate"]),
                str(params["batch_size"]),
                str(params["depth"]),
                str(output_file),
            ]

            subprocess.run(
                cmd,
                cwd=REPOSITORY_ROOT,
                check=True,
            )
            logger.info("✅ PyTorch training completed successfully")
            return True
        except subprocess.CalledProcessError as error:
            logger.error("❌ PyTorch training failed: %r", error)
            return False

    def train(
        self,
        backend: str,
        preset: str,
        output_file: str | None,
        **overrides: Any,
    ) -> bool:
        params = self.get_training_params(preset, **overrides)

        if output_file is None:
            if backend == "pytorch":
                output_file = self.config["output_formats"]["pytorch"]
            elif backend == "rust":
                output_file = self.config["output_formats"]["rust"]
            else:
                output_file = self.config["output_formats"]["unified"]

        resolved_output_path = output_path(self.weights_dir, output_file)

        if backend == "auto":
            if self.check_pytorch_available():
                backend = "pytorch"
                logger.info("🔥 Auto-selected PyTorch backend")
            else:
                backend = "rust"
                logger.info("🦀 Auto-selected Rust backend")

        if backend not in {"pytorch", "rust"}:
            logger.error("❌ Unknown training backend")
            return False

        logger.info("🚀 Starting training...")
        logger.info("📊 Training parameters validated")

        start_time = time.time()

        if backend == "pytorch":
            success = self.train_pytorch(params, resolved_output_path)
        elif backend == "rust":
            success = self.train_rust(params, resolved_output_path)

        if success:
            training_time = time.time() - start_time
            logger.info(f"🎉 Training completed in {training_time:.2f} seconds")
            logger.info("📁 Weights saved successfully")
        return success

    def check_pytorch_available(self) -> bool:
        try:
            import torch

            available = torch.cuda.is_available() or (
                hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
            )
            if not available:
                logger.info("No PyTorch GPU found; using Rust")
            return available
        except ImportError:
            return False


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("must be positive")
    return parsed


def positive_float(value: str) -> float:
    parsed = float(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("must be positive")
    return parsed


def main():
    parser = argparse.ArgumentParser(description="Unified ML Training Script")
    parser.add_argument(
        "--backend",
        choices=["auto", "rust", "pytorch"],
        default="auto",
        help="Training backend to use",
    )
    parser.add_argument(
        "--preset",
        choices=["default", "quick", "production"],
        default="default",
        help="Training preset to use",
    )
    parser.add_argument("--output", help="Output file name")
    parser.add_argument("--num-games", type=positive_int, help="Games to generate")
    parser.add_argument("--epochs", type=positive_int, help="Training epochs")
    parser.add_argument("--learning-rate", type=positive_float, help="Learning rate")
    parser.add_argument("--batch-size", type=positive_int, help="Batch size")
    parser.add_argument("--depth", type=positive_int, help="Search depth")

    args = parser.parse_args()

    overrides: dict[str, Any] = {}
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
            **overrides,
        )

        if not success:
            sys.exit(1)

    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        logger.error("❌ Training failed: %r", error)
        sys.exit(1)


if __name__ == "__main__":
    main()
