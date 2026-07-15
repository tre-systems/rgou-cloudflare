#!/usr/bin/env python3
"""Distil the solved Finkel tablebase into a compact canonical value model."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import mmap
import os
import random
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

sys.path.insert(0, str(Path(__file__).resolve().parent))
from oracle_tablebase import (  # noqa: E402
    FEATURE_SIZE,
    PRIVATE_BIT_ORDER,
    decode_key,
    middle_lane_states,
    parse_tablebase,
)

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = REPOSITORY_ROOT / "ml/config/oracle-training.json"
DEFAULT_DATA_DIR = Path.home() / "Desktop/rgou-training-data"


class ValueNetwork(nn.Module):
    def __init__(self, hidden_sizes: Iterable[int]):
        super().__init__()
        layers: list[nn.Module] = []
        previous = FEATURE_SIZE
        for hidden in hidden_sizes:
            layers.extend((nn.Linear(previous, hidden), nn.ReLU()))
            previous = hidden
        layers.append(nn.Linear(previous, 1))
        self.layers = nn.Sequential(*layers)

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return torch.tanh(self.layers(features))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def decode_features(keys: np.ndarray) -> np.ndarray:
    keys = keys.astype(np.uint32, copy=False)
    features = np.zeros((len(keys), FEATURE_SIZE), dtype=np.float32)

    for output, bit in enumerate(PRIVATE_BIT_ORDER):
        features[:, output] = (keys >> (19 + bit)) & 1
        features[:, 6 + output] = (keys >> bit) & 1

    compressed_middle = (keys >> 6) & 0x1FFF
    middle = np.asarray(middle_lane_states(), dtype=np.uint16)[compressed_middle]
    for square in range(8):
        occupant = (middle >> (2 * square)) & 0b11
        features[:, 12 + square] = occupant == 2
        features[:, 20 + square] = occupant == 1

    current_reserve = ((keys >> 28) & 0b111).astype(np.float32)
    opponent_reserve = ((keys >> 25) & 0b111).astype(np.float32)
    current_on_board = features[:, :6].sum(axis=1) + features[:, 12:20].sum(axis=1)
    opponent_on_board = features[:, 6:12].sum(axis=1) + features[:, 20:28].sum(axis=1)
    current_finished = 7 - current_reserve - current_on_board
    opponent_finished = 7 - opponent_reserve - opponent_on_board
    if np.any(current_finished < 0) or np.any(opponent_finished < 0):
        raise ValueError("tablebase contains an invalid piece count")

    features[:, 28] = current_reserve / 7
    features[:, 29] = opponent_reserve / 7
    features[:, 30] = current_finished / 7
    features[:, 31] = opponent_finished / 7
    return features


def sample_tablebase(
    path: Path, layout: Any, count: int, seed: int
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    if count > layout.entry_count:
        raise ValueError("sample count exceeds tablebase entries")
    rng = np.random.default_rng(seed)
    indices = rng.choice(layout.entry_count, size=count, replace=False)
    with path.open("rb") as source, mmap.mmap(source.fileno(), 0, access=mmap.ACCESS_READ) as data:
        keys = np.frombuffer(
            data, dtype=">u4", count=layout.entry_count, offset=layout.keys_offset
        )[indices].astype(np.uint32)
        probabilities = np.frombuffer(
            data, dtype=">u2", count=layout.entry_count, offset=layout.values_offset
        )[indices].astype(np.float32) / 65_535
    return decode_features(keys), probabilities, keys


def select_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def configure_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def make_loader(
    features: np.ndarray,
    probabilities: np.ndarray,
    batch_size: int,
    shuffle: bool,
    seed: int,
) -> DataLoader:
    targets = probabilities * 2 - 1
    dataset = TensorDataset(torch.from_numpy(features), torch.from_numpy(targets[:, None]))
    return DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        generator=torch.Generator().manual_seed(seed),
        num_workers=0,
    )


def loss_function(name: str) -> nn.Module:
    if name == "mse":
        return nn.MSELoss()
    if name == "huber":
        return nn.SmoothL1Loss(beta=0.1)
    raise ValueError(f"unsupported loss: {name}")


def evaluate(
    model: ValueNetwork, loader: DataLoader, device: torch.device
) -> dict[str, float]:
    model.eval()
    errors: list[torch.Tensor] = []
    with torch.no_grad():
        for features, targets in loader:
            predictions = model(features.to(device)).cpu()
            errors.append(((predictions - targets) / 2).abs())
    absolute = torch.cat(errors).flatten()
    return {
        "mae": absolute.mean().item(),
        "rmse": torch.sqrt(torch.mean(absolute.square())).item(),
        "p95_absolute_error": torch.quantile(absolute, 0.95).item(),
        "max_absolute_error": absolute.max().item(),
    }


def train_candidate(
    train_data: tuple[np.ndarray, np.ndarray],
    validation_data: tuple[np.ndarray, np.ndarray],
    hidden_sizes: list[int],
    loss_name: str,
    seed: int,
    epochs: int,
    batch_size: int,
    learning_rate: float,
    device: torch.device,
) -> tuple[ValueNetwork, dict[str, Any]]:
    configure_seed(seed)
    model = ValueNetwork(hidden_sizes).to(device)
    criterion = loss_function(loss_name)
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-5)
    training_loader = make_loader(*train_data, batch_size, True, seed)
    validation_loader = make_loader(*validation_data, batch_size, False, seed)
    best_state: dict[str, torch.Tensor] | None = None
    best_mae = math.inf
    patience = 5
    stale_epochs = 0
    started = time.monotonic()

    for epoch in range(epochs):
        model.train()
        for features, targets in training_loader:
            optimizer.zero_grad(set_to_none=True)
            predictions = model(features.to(device))
            loss = criterion(predictions, targets.to(device))
            loss.backward()
            optimizer.step()

        metrics = evaluate(model, validation_loader, device)
        print(
            f"architecture={hidden_sizes} loss={loss_name} seed={seed} "
            f"epoch={epoch + 1} val_mae={metrics['mae']:.6f}",
            flush=True,
        )
        if metrics["mae"] < best_mae:
            best_mae = metrics["mae"]
            best_state = {name: value.detach().cpu().clone() for name, value in model.state_dict().items()}
            stale_epochs = 0
        else:
            stale_epochs += 1
            if stale_epochs >= patience:
                break

    if best_state is None:
        raise RuntimeError("training did not produce a checkpoint")
    model.load_state_dict(best_state)
    model.to(device)
    return model, {
        "hidden_sizes": hidden_sizes,
        "loss": loss_name,
        "seed": seed,
        "completed_epochs": epoch + 1,
        "training_time_seconds": time.monotonic() - started,
        "validation": evaluate(model, validation_loader, device),
    }


def flatten_weights(model: ValueNetwork) -> list[float]:
    weights: list[float] = []
    for layer in model.layers:
        if not isinstance(layer, nn.Linear):
            continue
        weights.extend(layer.weight.detach().cpu().T.contiguous().flatten().tolist())
        weights.extend(layer.bias.detach().cpu().flatten().tolist())
    return weights


def git_revision() -> str:
    return subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=REPOSITORY_ROOT, text=True
    ).strip()


def run(args: argparse.Namespace) -> int:
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    preset = config["presets"][args.preset]
    data_dir = Path(os.environ.get("RGOU_TRAINING_DATA_DIR", DEFAULT_DATA_DIR)).expanduser()
    tablebase_path = Path(args.tablebase).expanduser() if args.tablebase else data_dir / config["tablebase"]["filename"]
    if not tablebase_path.is_file():
        raise FileNotFoundError(
            f"missing {tablebase_path}; download {config['tablebase']['url']} first"
        )
    actual_hash = sha256_file(tablebase_path)
    if actual_hash != config["tablebase"]["sha256"]:
        raise ValueError("tablebase SHA-256 does not match the pinned artifact")
    layout = parse_tablebase(tablebase_path)

    total = preset["samples"] + preset["validation_samples"] + preset["test_samples"]
    features, probabilities, keys = sample_tablebase(tablebase_path, layout, total, args.sample_seed)
    for index in range(min(32, len(keys))):
        expected = np.asarray(decode_key(int(keys[index])), dtype=np.float32)
        if not np.array_equal(features[index], expected):
            raise ValueError("vectorized features disagree with the reference decoder")
    train_end = preset["samples"]
    validation_end = train_end + preset["validation_samples"]
    training_data = (features[:train_end], probabilities[:train_end])
    validation_data = (features[train_end:validation_end], probabilities[train_end:validation_end])
    test_data = (features[validation_end:], probabilities[validation_end:])
    device = select_device()
    print(f"device={device} entries={layout.entry_count} sampled={total}", flush=True)

    candidates: list[tuple[ValueNetwork, dict[str, Any]]] = []
    for architecture in preset["architectures"]:
        for loss_name in preset["losses"]:
            for seed in preset["seeds"]:
                candidates.append(
                    train_candidate(
                        training_data,
                        validation_data,
                        architecture,
                        loss_name,
                        seed,
                        preset["epochs"],
                        preset["batch_size"],
                        preset["learning_rate"],
                        device,
                    )
                )

    model, best = min(candidates, key=lambda candidate: candidate[1]["validation"]["mae"])
    test_loader = make_loader(*test_data, preset["batch_size"], False, best["seed"])
    best["test"] = evaluate(model, test_loader, device)
    all_results = [result for _, result in candidates]
    source_revision = git_revision()
    output = Path(args.output or REPOSITORY_ROOT / "ml/data/weights/oracle_ai_weights_v1.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "weights": flatten_weights(model),
        "metadata": {
            "version": "oracle_v1",
            "training_date": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "source_revision": source_revision,
            "training_config_sha256": sha256_file(CONFIG_PATH),
            "training_script_sha256": sha256_file(Path(__file__)),
            "encoding_script_sha256": sha256_file(Path(__file__).with_name("oracle_tablebase.py")),
            "tablebase_sha256": actual_hash,
            "tablebase_entries": layout.entry_count,
            "feature_schema": config["feature_schema"],
            "training_samples": preset["samples"],
            "validation_samples": preset["validation_samples"],
            "test_samples": preset["test_samples"],
            "sample_seed": args.sample_seed,
            "sample_keys_sha256": hashlib.sha256(keys.astype(">u4").tobytes()).hexdigest(),
            "selected_candidate": best,
            "candidates": all_results,
        },
        "network_config": {
            "input_size": FEATURE_SIZE,
            "hidden_sizes": best["hidden_sizes"],
            "output_size": 1,
        },
    }
    output.write_text(json.dumps(artifact, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(f"selected={best} output={output}", flush=True)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--preset", choices=("pilot", "production"), default="pilot")
    parser.add_argument("--tablebase")
    parser.add_argument("--output")
    parser.add_argument("--sample-seed", type=int, default=20250715)
    return run(parser.parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
