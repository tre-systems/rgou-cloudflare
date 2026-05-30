# Machine Learning

Training for the ML AI. For the network architecture, model list, and how the AI is used in the game, see [AI-SYSTEM.md](../docs/AI-SYSTEM.md).

## Quick start

```bash
pip install -r requirements.txt   # PyTorch backend only

npm run train:pytorch:quick       # quick test (100 games, 10 epochs)
npm run train:pytorch             # default (1000 games, 50 epochs)
npm run train:pytorch:production  # production (2000 games, 100 epochs)

ls ml/data/weights/               # trained weights land here
```

No GPU? Use the Rust backend instead (`npm run train:rust`, `:quick`, `:production`).

## Prerequisites

- **Python 3.8+** with `pip` (PyTorch backend)
- **Rust & Cargo** (data generation, and the CPU backend)
- **GPU** for PyTorch: Apple Metal (MPS) or NVIDIA CUDA

## Backends

| Backend | Hardware                    | Notes                           |
| ------- | --------------------------- | ------------------------------- |
| PyTorch | GPU required (CUDA / Metal) | Faster training                 |
| Rust    | CPU, parallel               | Always available; no GPU needed |

`auto` picks PyTorch when a GPU is available, otherwise Rust. Rust data generation uses the available CPU cores, leaving headroom for the system on Apple Silicon and high-core machines.

## Layout

```
ml/
├── config/training.json        # network architecture + training presets
├── scripts/
│   ├── train.sh                # entry point (wraps caffeinate); --backend, --preset, --num-games …
│   ├── train.py                # unified trainer (Rust / PyTorch backends)
│   ├── train_pytorch.py        # PyTorch backend
│   ├── convert_weights.py      # weight format conversion
│   └── load-weights.sh         # convert + publish weights (npm run load:ml-weights)
└── data/
    ├── weights/                # trained model weights
    └── genetic_params/         # evolved Classic-AI parameters
```

## Custom runs

```bash
./ml/scripts/train.sh --backend pytorch --num-games 1500 --epochs 75
./ml/scripts/train.sh --backend rust --preset quick
npm run load:ml-weights ml/data/weights/my_weights.json --copy-to-public
```

Genetic parameters for the Classic AI are evolved separately — see [AI-SYSTEM.md](../docs/AI-SYSTEM.md#evaluation-parameters).

## Troubleshooting

```bash
# Is a GPU visible to PyTorch?
python3 -c "import torch; print(torch.cuda.is_available(), torch.backends.mps.is_available())"
```

- **Training too slow** — switch to the Rust backend, or lower `--num-games` / `--epochs`.
- **Out of memory** — reduce `--batch-size`, or use `--preset quick`.
