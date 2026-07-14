# Machine Learning

Training for the ML AI. For the network architecture, model list, and how the AI is used in the game, see [AI-SYSTEM.md](../docs/AI-SYSTEM.md).

## Quick start

```bash
uv sync --project ml --locked

npm run train:pytorch:quick       # quick test (100 games, 10 epochs)
npm run train:pytorch             # default (1000 games, 50 epochs)
npm run train:pytorch:production  # production (2000 games, 100 epochs)

ls ml/data/weights/               # trained weights land here
```

No GPU? Use the Rust backend instead (`npm run train:rust`, `:quick`, `:production`).

## Prerequisites

- **uv** for the locked Python training environment
- **Python 3.12.13**, selected from `ml/.python-version` by uv
- **Rust & Cargo** (data generation, and the CPU backend)
- **GPU** for PyTorch: Apple Metal (MPS) or NVIDIA CUDA

`ml/pyproject.toml` declares the supported Python and training dependencies. `ml/uv.lock` pins the complete cross-platform resolution, including artifact hashes. Use `uv sync --project ml --locked`; do not install training dependencies independently with `pip`. Upgrade intentionally with `uv lock --project ml --upgrade`, review the lock diff, and rerun model validation.

Self-play data is written to `~/Desktop/rgou-training-data` by default. Set `RGOU_TRAINING_DATA_DIR` to use another scratch location. Default training output names are ignored because they are replaceable run artifacts; give models selected for comparison or promotion a stable versioned name.

## Backends

| Backend | Hardware                    | Notes                           |
| ------- | --------------------------- | ------------------------------- |
| PyTorch | GPU required (CUDA / Metal) | Faster training                 |
| Rust    | CPU, parallel               | Always available; no GPU needed |

`auto` picks PyTorch when a GPU is available, otherwise Rust. Rust data generation uses the available CPU cores, leaving headroom for the system on Apple Silicon and high-core machines. The launcher uses `caffeinate` when available and also runs on platforms without it.

## Layout

```
ml/
├── .python-version             # pinned training interpreter
├── pyproject.toml              # Python project and direct dependencies
├── uv.lock                     # exact transitive dependency resolution
├── model-manifest.json         # verified production-model provenance
├── config/training.json        # network architecture + training presets
├── scripts/
│   ├── train.sh                # entry point (wraps caffeinate); --backend, --preset, --num-games …
│   ├── train.py                # unified trainer (Rust / PyTorch backends)
│   ├── train_pytorch.py        # PyTorch backend
│   ├── convert_weights.py      # weight format conversion
│   ├── model_provenance.py     # exact model, metadata, and deployment validation
│   └── load-weights.sh         # convert + publish weights (npm run load:ml-weights)
└── data/
    ├── weights/                # trained model weights
    └── genetic_params/         # evolved Classic-AI parameters
```

## Custom runs

```bash
./ml/scripts/train.sh --backend pytorch --num-games 1500 --epochs 75
./ml/scripts/train.sh --backend rust --preset quick
./ml/scripts/load-weights.sh --promote ml/data/weights/my_weights.json
```

Genetic parameters for the Classic AI are evolved separately — see [AI-SYSTEM.md](../docs/AI-SYSTEM.md#evaluation-parameters).

## Reproducibility and model promotion

The PyTorch trainer requires its ML and Rust training sources to be committed before a run, then records that revision. It seeds Python, NumPy, PyTorch, CUDA, and data-loader shuffling. Rust self-play derives an independent random stream for each game from the configured seed and game index, then preserves game-index order when collecting parallel results. The generated corpus therefore does not depend on Rayon scheduling or core allocation.

New model metadata also records actual completed epochs, search depth, Python, NumPy, and PyTorch versions. PyTorch trains the policy head from logits and restores the lowest-validation-loss checkpoint before saving. GPU kernels can still vary across hardware, so the seed makes CPU data generation reproducible and supports repeatable investigation, but it is not a promise of byte-identical GPU retraining.

The checked-in `model-manifest.json` is the production artifact contract. It records:

- the exact source-model, deployed JSON, and deterministic-gzip hashes and sizes;
- exact value and policy weight counts and hashes;
- the normalized network architecture and original training metadata;
- the commit that last changed the production source model;
- hashes for the training configuration, Python project, and lockfile.

Validate the currently promoted model without installing PyTorch:

```bash
"$(uv python find "$(cat ml/.python-version)")" \
  ml/scripts/model_provenance.py verify
```

When promoting a replacement, preserve its training metadata and run the single promotion command. It validates the model before changing public assets, writes byte-identical JSON and deterministic gzip variants, regenerates the manifest, and verifies the result:

```bash
npm run load:ml-weights

./ml/scripts/load-weights.sh --promote \
  ml/data/weights/my_production_model.json
```

Promotion fails if architecture, metadata, numeric values, or exact weight counts do not match. Verification also requires both deployed fallback files to contain the exact production source bytes. Review and commit the source model, both deployed artifacts, and manifest together.

## Troubleshooting

```bash
# Is a GPU visible to PyTorch?
uv run --project ml --locked python -c \
  "import torch; print(torch.cuda.is_available(), torch.backends.mps.is_available())"
```

- **Training too slow** — switch to the Rust backend, or lower `--num-games` / `--epochs`.
- **Out of memory** — reduce `--batch-size`, or use `--preset quick`.
