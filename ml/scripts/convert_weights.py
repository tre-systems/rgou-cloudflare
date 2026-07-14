#!/usr/bin/env python3
"""Convert legacy and current Royal Game of Ur model formats."""

import argparse
import json
import logging
from pathlib import Path
from typing import Any

from model_provenance import (
    REPOSITORY_ROOT,
    expected_weight_count,
    normalize_architecture,
    validate_weights,
)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class WeightConverter:
    def __init__(self, config_path: Path | None = None):
        self.config_path = config_path or REPOSITORY_ROOT / "ml/config/training.json"
        self.config = json.loads(self.config_path.read_text(encoding="utf-8"))

    def load_weights(self, input_file: str) -> tuple[dict[str, Any], str]:
        input_path = Path(input_file)
        weights = json.loads(input_path.read_text(encoding="utf-8"))
        model_format = self.detect_format(weights)
        logger.info("Loaded %s model from %r", model_format, str(input_path))
        return weights, model_format

    @staticmethod
    def detect_format(weights: dict[str, Any]) -> str:
        if "value_weights" not in weights or "policy_weights" not in weights:
            raise ValueError("model is missing value_weights or policy_weights")
        if "value_network_config" in weights and "policy_network_config" in weights:
            return "rust"
        return "unified" if "network_config" in weights else "legacy"

    def convert_to_unified(
        self, weights: dict[str, Any], model_format: str
    ) -> dict[str, Any]:
        if model_format == "unified":
            architecture = normalize_architecture(weights["network_config"])
        elif model_format == "rust":
            architecture = normalize_architecture(
                {
                    "value_network": weights["value_network_config"],
                    "policy_network": weights["policy_network_config"],
                }
            )
        elif model_format == "legacy":
            architecture = normalize_architecture(self.config["network_architecture"])
        else:
            raise ValueError(f"unsupported model format: {model_format}")

        return {
            "value_weights": weights["value_weights"],
            "policy_weights": weights["policy_weights"],
            "metadata": weights.get("metadata", {}),
            "network_config": architecture,
        }

    def convert_to_pytorch(
        self, weights: dict[str, Any], model_format: str
    ) -> dict[str, Any]:
        return self.convert_to_unified(weights, model_format)

    def convert_to_rust(
        self, weights: dict[str, Any], model_format: str
    ) -> dict[str, Any]:
        if model_format == "rust":
            return weights

        unified = self.convert_to_unified(weights, model_format)
        architecture = unified["network_config"]
        common = {
            "input_size": architecture["input_size"],
            "hidden_sizes": architecture["hidden_sizes"],
        }
        return {
            "value_weights": unified["value_weights"],
            "policy_weights": unified["policy_weights"],
            "metadata": unified["metadata"],
            "value_network_config": {
                **common,
                "output_size": architecture["value_output_size"],
            },
            "policy_network_config": {
                **common,
                "output_size": architecture["policy_output_size"],
            },
        }

    def validate(self, weights: dict[str, Any], model_format: str) -> None:
        unified = self.convert_to_unified(weights, model_format)
        architecture = unified["network_config"]
        validate_weights(
            "value",
            unified["value_weights"],
            expected_weight_count(
                architecture["input_size"],
                architecture["hidden_sizes"],
                architecture["value_output_size"],
            ),
        )
        validate_weights(
            "policy",
            unified["policy_weights"],
            expected_weight_count(
                architecture["input_size"],
                architecture["hidden_sizes"],
                architecture["policy_output_size"],
            ),
        )

    @staticmethod
    def save_weights(weights: dict[str, Any], output_file: str) -> None:
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(weights, indent=2) + "\n",
            encoding="utf-8",
        )
        logger.info("Saved weights to %r", str(output_path))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_file", help="Input weights file")
    parser.add_argument("--output", help="Output file name")
    parser.add_argument(
        "--format",
        choices=["unified", "pytorch", "rust"],
        default="unified",
        help="Output format",
    )
    parser.add_argument("--validate", action="store_true", help="Validate weights")
    args = parser.parse_args()

    try:
        converter = WeightConverter()
        weights, model_format = converter.load_weights(args.input_file)
        if args.validate:
            converter.validate(weights, model_format)

        conversion = {
            "unified": converter.convert_to_unified,
            "pytorch": converter.convert_to_pytorch,
            "rust": converter.convert_to_rust,
        }[args.format]
        converted = conversion(weights, model_format)

        input_path = Path(args.input_file)
        output_file = (
            args.output or f"{input_path.stem}_{args.format}{input_path.suffix}"
        )
        converter.save_weights(converted, output_file)
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
        logger.error("Conversion failed: %r", error)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
