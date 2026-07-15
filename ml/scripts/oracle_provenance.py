#!/usr/bin/env python3
"""Promote and verify the production Oracle model artifact."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import math
import re
import sys
from pathlib import Path
from typing import Any


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MODEL = Path("ml/data/weights/oracle_ai_weights_v1.json")
DEFAULT_MANIFEST = Path("ml/oracle-model-manifest.json")
DEFAULT_DEPLOYED_JSON = Path("public/oracle-weights.json")
DEFAULT_DEPLOYED_GZIP = Path("public/oracle-weights.json.gz")
TRAINING_CONFIG = Path("ml/config/oracle-training.json")
TRAINING_SCRIPT = Path("ml/scripts/train_oracle.py")
ENCODING_SCRIPT = Path("ml/scripts/oracle_tablebase.py")


def repository_path(path: Path) -> Path:
    if path.is_absolute() or ".." in path.parts:
        raise ValueError(f"path must stay inside the repository: {path}")
    return REPOSITORY_ROOT / path


def display_path(path: Path) -> str:
    absolute = path if path.is_absolute() else repository_path(path)
    if not absolute.is_relative_to(REPOSITORY_ROOT):
        raise ValueError(f"path must stay inside the repository: {path}")
    return absolute.relative_to(REPOSITORY_ROOT).as_posix()


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def canonical_hash(value: Any) -> str:
    content = json.dumps(
        value, allow_nan=False, separators=(",", ":"), sort_keys=True
    ).encode("utf-8")
    return sha256_bytes(content)


def expected_weight_count(input_size: int, hidden_sizes: list[int], output_size: int) -> int:
    count = 0
    previous_size = input_size
    for hidden_size in hidden_sizes:
        count += (previous_size + 1) * hidden_size
        previous_size = hidden_size
    return count + (previous_size + 1) * output_size


def validate_model(model_path: Path) -> dict[str, Any]:
    absolute_model = repository_path(model_path)
    model_bytes = absolute_model.read_bytes()
    model = json.loads(model_bytes)
    config_path = repository_path(TRAINING_CONFIG)
    config = json.loads(config_path.read_text(encoding="utf-8"))
    production = config["presets"]["production"]

    architecture = model.get("network_config")
    expected_architecture = {
        "input_size": 32,
        "hidden_sizes": production["architectures"][0],
        "output_size": 1,
    }
    if architecture != expected_architecture:
        raise ValueError("model architecture does not match the production preset")

    weights = model.get("weights")
    expected_count = expected_weight_count(**architecture)
    if not isinstance(weights, list) or len(weights) != expected_count:
        actual = len(weights) if isinstance(weights, list) else "non-array"
        raise ValueError(f"weights has {actual} values; expected {expected_count}")
    if any(
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(value)
        for value in weights
    ):
        raise ValueError("weights contains a non-finite numeric value")

    metadata = model.get("metadata")
    if not isinstance(metadata, dict):
        raise ValueError("model metadata must be an object")
    required = {
        "version",
        "training_date",
        "source_revision",
        "training_config_sha256",
        "training_script_sha256",
        "encoding_script_sha256",
        "tablebase_sha256",
        "tablebase_entries",
        "feature_schema",
        "training_samples",
        "validation_samples",
        "test_samples",
        "sample_seed",
        "sample_keys_sha256",
        "selected_candidate",
        "candidates",
    }
    missing = required - metadata.keys()
    if missing:
        raise ValueError(f"model metadata is missing: {sorted(missing)}")
    if metadata["version"] != "oracle_v1":
        raise ValueError("unexpected Oracle model version")
    if not isinstance(metadata["training_date"], str) or not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})",
        metadata["training_date"],
    ):
        raise ValueError("training_date must be an ISO 8601 timestamp")
    if not isinstance(metadata["source_revision"], str) or not re.fullmatch(
        r"[0-9a-f]{40}", metadata["source_revision"]
    ):
        raise ValueError("source_revision must be a full lowercase Git commit SHA")
    for field in (
        "training_config_sha256",
        "training_script_sha256",
        "encoding_script_sha256",
        "tablebase_sha256",
        "sample_keys_sha256",
    ):
        if not isinstance(metadata[field], str) or not re.fullmatch(
            r"[0-9a-f]{64}", metadata[field]
        ):
            raise ValueError(f"{field} must be a lowercase SHA-256")
    if metadata["feature_schema"] != config["feature_schema"]:
        raise ValueError("feature schema does not match the training configuration")
    if metadata["tablebase_sha256"] != config["tablebase"]["sha256"]:
        raise ValueError("tablebase hash does not match the pinned artifact")
    if metadata["tablebase_entries"] != 137_892_016:
        raise ValueError("unexpected tablebase entry count")

    pinned_inputs = {
        "training_config_sha256": config_path,
        "training_script_sha256": repository_path(TRAINING_SCRIPT),
        "encoding_script_sha256": repository_path(ENCODING_SCRIPT),
    }
    for field, path in pinned_inputs.items():
        if metadata[field] != sha256_file(path):
            raise ValueError(f"{field} does not match {display_path(path)}")

    sample_fields = {
        "training_samples": "samples",
        "validation_samples": "validation_samples",
        "test_samples": "test_samples",
    }
    for metadata_field, preset_field in sample_fields.items():
        if metadata[metadata_field] != production[preset_field]:
            raise ValueError(f"{metadata_field} does not match the production preset")

    selected = metadata["selected_candidate"]
    if not isinstance(selected, dict):
        raise ValueError("selected candidate must be an object")
    if (
        selected.get("hidden_sizes") not in production["architectures"]
        or selected.get("loss") not in production["losses"]
        or selected.get("seed") not in production["seeds"]
    ):
        raise ValueError("selected candidate is outside the production search")
    if not isinstance(metadata["candidates"], list) or len(metadata["candidates"]) != 3:
        raise ValueError("candidate results do not match the production search")
    for split in ("validation", "test"):
        metrics = selected.get(split)
        if not isinstance(metrics, dict):
            raise ValueError(f"selected candidate is missing {split} metrics")
        for metric in ("mae", "rmse", "p95_absolute_error", "max_absolute_error"):
            value = metrics.get(metric)
            if (
                isinstance(value, bool)
                or not isinstance(value, (int, float))
                or not math.isfinite(value)
                or value < 0
            ):
                raise ValueError(f"selected candidate has invalid {split} {metric}")

    return {
        "path": absolute_model,
        "bytes": model_bytes,
        "architecture": architecture,
        "weights": weights,
        "metadata": metadata,
    }


def build_manifest(
    model_path: Path,
    deployed_json_path: Path = DEFAULT_DEPLOYED_JSON,
    deployed_gzip_path: Path = DEFAULT_DEPLOYED_GZIP,
) -> dict[str, Any]:
    validated = validate_model(model_path)
    deployed_json = repository_path(deployed_json_path)
    deployed_gzip = repository_path(deployed_gzip_path)
    json_bytes = deployed_json.read_bytes()
    gzip_bytes = deployed_gzip.read_bytes()
    if json_bytes != validated["bytes"]:
        raise ValueError("deployed JSON does not match the production Oracle model")
    if gzip.decompress(gzip_bytes) != validated["bytes"]:
        raise ValueError("deployed gzip does not contain the production Oracle model")

    return {
        "schema_version": 1,
        "model": {
            "path": display_path(validated["path"]),
            "format": "rgou-canonical-value-network-json-v1",
            "size_bytes": len(validated["bytes"]),
            "sha256": sha256_bytes(validated["bytes"]),
            "weight_count": len(validated["weights"]),
            "weights_sha256": canonical_hash(validated["weights"]),
        },
        "deployment": {
            "json": {
                "path": display_path(deployed_json),
                "size_bytes": len(json_bytes),
                "sha256": sha256_bytes(json_bytes),
            },
            "gzip": {
                "path": display_path(deployed_gzip),
                "content_encoding": "gzip",
                "size_bytes": len(gzip_bytes),
                "sha256": sha256_bytes(gzip_bytes),
                "decompressed_sha256": sha256_bytes(gzip.decompress(gzip_bytes)),
            },
        },
        "architecture": validated["architecture"],
        "training": validated["metadata"],
        "source": {
            "kind": "training_source_commit",
            "revision": validated["metadata"]["source_revision"],
        },
        "inputs": {
            display_path(path): sha256_file(repository_path(path))
            for path in (TRAINING_CONFIG, TRAINING_SCRIPT, ENCODING_SCRIPT)
        },
    }


def write_atomic(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp")
    temporary.write_bytes(content)
    temporary.replace(path)


def deterministic_gzip(content: bytes) -> bytes:
    return gzip.compress(content, compresslevel=9, mtime=0)


def write_manifest(manifest: dict[str, Any], manifest_path: Path) -> None:
    repository_path(manifest_path).write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )


def promote(model_path: Path, manifest_path: Path, json_path: Path, gzip_path: Path) -> None:
    model = validate_model(model_path)
    write_atomic(repository_path(json_path), model["bytes"])
    write_atomic(repository_path(gzip_path), deterministic_gzip(model["bytes"]))
    write_manifest(build_manifest(model_path, json_path, gzip_path), manifest_path)


def verify(model_path: Path, manifest_path: Path, json_path: Path, gzip_path: Path) -> None:
    expected = build_manifest(model_path, json_path, gzip_path)
    actual = json.loads(repository_path(manifest_path).read_text(encoding="utf-8"))
    if actual != expected:
        raise ValueError(f"{display_path(manifest_path)} is stale")
    print(
        f"Verified {expected['model']['path']} "
        f"({expected['model']['sha256']}, {expected['model']['weight_count']} weights)"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("promote", "verify"))
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--deployed-json", type=Path, default=DEFAULT_DEPLOYED_JSON)
    parser.add_argument("--deployed-gzip", type=Path, default=DEFAULT_DEPLOYED_GZIP)
    args = parser.parse_args()
    try:
        if args.command == "promote":
            promote(args.model, args.manifest, args.deployed_json, args.deployed_gzip)
        else:
            verify(args.model, args.manifest, args.deployed_json, args.deployed_gzip)
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print(f"Oracle provenance failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
