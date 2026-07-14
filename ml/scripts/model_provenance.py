#!/usr/bin/env python3

import argparse
import gzip
import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path
from typing import Any


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MODEL = Path("ml/data/weights/ml_ai_weights_pytorch_v5.json")
DEFAULT_MANIFEST = Path("ml/model-manifest.json")
DEFAULT_DEPLOYED_JSON = Path("public/ml-weights.json")
DEFAULT_DEPLOYED_GZIP = Path("public/ml-weights.json.gz")
TRAINING_CONFIG = Path("ml/config/training.json")
PYPROJECT = Path("ml/pyproject.toml")
UV_LOCK = Path("ml/uv.lock")


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def canonical_hash(value: Any) -> str:
    encoded = json.dumps(
        value, allow_nan=False, separators=(",", ":"), sort_keys=True
    ).encode("utf-8")
    return sha256_bytes(encoded)


def repository_path(path: Path) -> Path:
    return path if path.is_absolute() else REPOSITORY_ROOT / path


def display_path(path: Path) -> str:
    return repository_path(path).relative_to(REPOSITORY_ROOT).as_posix()


def normalize_architecture(config: dict[str, Any]) -> dict[str, Any]:
    if "value_network" in config and "policy_network" in config:
        value = config["value_network"]
        policy = config["policy_network"]
        if value["input_size"] != policy["input_size"]:
            raise ValueError("value and policy networks must use the same input size")
        if value["hidden_sizes"] != policy["hidden_sizes"]:
            raise ValueError(
                "value and policy networks must use the same hidden layers"
            )
        return {
            "input_size": value["input_size"],
            "hidden_sizes": value["hidden_sizes"],
            "value_output_size": value["output_size"],
            "policy_output_size": policy["output_size"],
        }

    required = {
        "input_size",
        "hidden_sizes",
        "value_output_size",
        "policy_output_size",
    }
    missing = required - config.keys()
    if missing:
        raise ValueError(f"network configuration is missing: {sorted(missing)}")
    return {key: config[key] for key in sorted(required)}


def expected_weight_count(
    input_size: int, hidden_sizes: list[int], output_size: int
) -> int:
    total = 0
    previous_size = input_size
    for hidden_size in hidden_sizes:
        total += (previous_size + 1) * hidden_size
        previous_size = hidden_size
    return total + (previous_size + 1) * output_size


def validate_weights(name: str, weights: Any, expected_count: int) -> None:
    if not isinstance(weights, list):
        raise ValueError(f"{name}_weights must be an array")
    if len(weights) != expected_count:
        raise ValueError(
            f"{name}_weights has {len(weights)} values; expected {expected_count}"
        )
    if any(
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(value)
        for value in weights
    ):
        raise ValueError(f"{name}_weights contains a non-finite numeric value")


def validate_metadata(metadata: Any) -> dict[str, Any]:
    if not isinstance(metadata, dict):
        raise ValueError("model metadata must be an object")
    required = {
        "training_date",
        "version",
        "num_games",
        "num_training_samples",
        "epochs",
        "learning_rate",
        "batch_size",
        "validation_split",
        "seed",
        "training_time_seconds",
        "best_validation_loss",
    }
    missing = required - metadata.keys()
    if missing:
        raise ValueError(f"model metadata is missing: {sorted(missing)}")
    return metadata


def commit_details(revision: str) -> tuple[str, str]:
    result = subprocess.run(
        ["git", "show", "-s", "--format=%H%x00%cI", revision],
        cwd=REPOSITORY_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    resolved_revision, separator, committed_at = result.stdout.strip().partition("\x00")
    if not separator or not resolved_revision or not committed_at:
        raise ValueError(f"source revision is invalid: {revision}")
    return resolved_revision, committed_at


def model_revision(model_path: Path, metadata: dict[str, Any]) -> dict[str, Any]:
    training_revision = metadata.get("source_revision")
    if training_revision:
        revision, committed_at = commit_details(training_revision)
        return {
            "kind": "training_source_commit",
            "revision": revision,
            "committed_at": committed_at,
        }

    relative_path = display_path(model_path)
    result = subprocess.run(
        ["git", "log", "-1", "--format=%H%x00%cI", "--", relative_path],
        cwd=REPOSITORY_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    revision, separator, committed_at = result.stdout.strip().partition("\x00")
    if not separator or not revision or not committed_at:
        raise ValueError(f"no committed source revision found for {relative_path}")
    return {
        "kind": "last_model_artifact_commit",
        "revision": revision,
        "committed_at": committed_at,
    }


def validate_source_model(model_path: Path) -> dict[str, Any]:
    absolute_model = repository_path(model_path)
    model_bytes = absolute_model.read_bytes()
    model = json.loads(model_bytes)
    architecture = normalize_architecture(model.get("network_config", {}))
    training_config_path = repository_path(TRAINING_CONFIG)
    training_config = json.loads(training_config_path.read_text(encoding="utf-8"))
    configured_architecture = normalize_architecture(
        training_config["network_architecture"]
    )
    if architecture != configured_architecture:
        raise ValueError("model architecture does not match ml/config/training.json")

    value_weights = model.get("value_weights")
    policy_weights = model.get("policy_weights")
    expected_value_count = expected_weight_count(
        architecture["input_size"],
        architecture["hidden_sizes"],
        architecture["value_output_size"],
    )
    expected_policy_count = expected_weight_count(
        architecture["input_size"],
        architecture["hidden_sizes"],
        architecture["policy_output_size"],
    )
    validate_weights("value", value_weights, expected_value_count)
    validate_weights("policy", policy_weights, expected_policy_count)
    metadata = validate_metadata(model.get("metadata"))

    return {
        "path": absolute_model,
        "bytes": model_bytes,
        "architecture": architecture,
        "value_weights": value_weights,
        "policy_weights": policy_weights,
        "metadata": metadata,
        "training_config_path": training_config_path,
    }


def build_manifest(
    model_path: Path,
    deployed_json_path: Path = DEFAULT_DEPLOYED_JSON,
    deployed_gzip_path: Path = DEFAULT_DEPLOYED_GZIP,
) -> dict[str, Any]:
    validated = validate_source_model(model_path)
    absolute_model = validated["path"]
    model_bytes = validated["bytes"]
    architecture = validated["architecture"]
    value_weights = validated["value_weights"]
    policy_weights = validated["policy_weights"]
    metadata = validated["metadata"]
    training_config_path = validated["training_config_path"]

    absolute_deployed_json = repository_path(deployed_json_path)
    deployed_json_bytes = absolute_deployed_json.read_bytes()
    if deployed_json_bytes != model_bytes:
        raise ValueError(
            "deployed JSON fallback does not match the production source model"
        )

    absolute_deployed_gzip = repository_path(deployed_gzip_path)
    deployed_gzip_bytes = absolute_deployed_gzip.read_bytes()
    deployed_model_bytes = gzip.decompress(deployed_gzip_bytes)
    if deployed_model_bytes != model_bytes:
        raise ValueError("deployed gzip does not contain the production source model")

    return {
        "schema_version": 2,
        "model": {
            "path": display_path(absolute_model),
            "format": "rgou-dual-network-json-v1",
            "size_bytes": absolute_model.stat().st_size,
            "sha256": sha256_file(absolute_model),
            "weights": {
                "value": {
                    "count": len(value_weights),
                    "sha256": canonical_hash(value_weights),
                },
                "policy": {
                    "count": len(policy_weights),
                    "sha256": canonical_hash(policy_weights),
                },
            },
        },
        "deployment": {
            "json": {
                "path": display_path(absolute_deployed_json),
                "size_bytes": len(deployed_json_bytes),
                "sha256": sha256_bytes(deployed_json_bytes),
            },
            "gzip": {
                "path": display_path(absolute_deployed_gzip),
                "content_encoding": "gzip",
                "size_bytes": len(deployed_gzip_bytes),
                "sha256": sha256_bytes(deployed_gzip_bytes),
                "decompressed_sha256": sha256_bytes(deployed_model_bytes),
            },
        },
        "architecture": architecture,
        "training": metadata,
        "source": model_revision(absolute_model, metadata),
        "inputs": {
            "training_config": {
                "path": display_path(training_config_path),
                "sha256": sha256_file(training_config_path),
            },
            "python_project": {
                "path": display_path(PYPROJECT),
                "sha256": sha256_file(repository_path(PYPROJECT)),
            },
            "python_lock": {
                "path": display_path(UV_LOCK),
                "sha256": sha256_file(repository_path(UV_LOCK)),
            },
        },
    }


def write_manifest(
    model_path: Path,
    manifest_path: Path,
    deployed_json_path: Path,
    deployed_gzip_path: Path,
) -> None:
    manifest = build_manifest(model_path, deployed_json_path, deployed_gzip_path)
    absolute_manifest = repository_path(manifest_path)
    absolute_manifest.write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(f"Wrote {display_path(absolute_manifest)}")


def verify_manifest(
    model_path: Path,
    manifest_path: Path,
    deployed_json_path: Path,
    deployed_gzip_path: Path,
) -> None:
    expected = build_manifest(model_path, deployed_json_path, deployed_gzip_path)
    absolute_manifest = repository_path(manifest_path)
    actual = json.loads(absolute_manifest.read_text(encoding="utf-8"))
    if actual != expected:
        raise ValueError(
            f"{display_path(absolute_manifest)} is stale; regenerate model provenance"
        )
    print(
        f"Verified {expected['model']['path']} "
        f"({expected['model']['sha256']}, {expected['model']['weights']['value']['count']} "
        f"value weights, {expected['model']['weights']['policy']['count']} policy weights)"
    )


def write_atomic(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_name(f".{path.name}.tmp")
    temporary_path.write_bytes(content)
    temporary_path.replace(path)


def deterministic_gzip(content: bytes) -> bytes:
    return gzip.compress(content, compresslevel=9, mtime=0)


def promote_model(
    model_path: Path,
    manifest_path: Path,
    deployed_json_path: Path,
    deployed_gzip_path: Path,
) -> None:
    validated = validate_source_model(model_path)
    model_bytes = validated["bytes"]
    write_atomic(repository_path(deployed_json_path), model_bytes)
    write_atomic(
        repository_path(deployed_gzip_path),
        deterministic_gzip(model_bytes),
    )
    write_manifest(model_path, manifest_path, deployed_json_path, deployed_gzip_path)
    verify_manifest(model_path, manifest_path, deployed_json_path, deployed_gzip_path)
    print(f"Promoted {display_path(model_path)}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Promote, generate, or verify production-model provenance"
    )
    parser.add_argument("command", choices=("promote", "generate", "verify"))
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--deployed-json", type=Path, default=DEFAULT_DEPLOYED_JSON)
    parser.add_argument("--deployed-gzip", type=Path, default=DEFAULT_DEPLOYED_GZIP)
    args = parser.parse_args()

    try:
        if args.command == "promote":
            promote_model(
                args.model,
                args.manifest,
                args.deployed_json,
                args.deployed_gzip,
            )
        elif args.command == "generate":
            write_manifest(
                args.model,
                args.manifest,
                args.deployed_json,
                args.deployed_gzip,
            )
        else:
            verify_manifest(
                args.model,
                args.manifest,
                args.deployed_json,
                args.deployed_gzip,
            )
    except (
        OSError,
        ValueError,
        KeyError,
        json.JSONDecodeError,
        subprocess.SubprocessError,
    ) as error:
        print(f"Model provenance failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
