# Mac Optimization Guide

_Performance optimization for ML training on Mac systems._

## System Requirements

- macOS 12.3+
- Python 3.8+ with PyTorch 2.0+
- Rust (latest stable)
- Apple Silicon (M1/M2) or Intel Mac with Metal support

## Key Optimizations

### GPU Acceleration (MPS)

- Uses Metal for neural network training
- 3-5x faster than CPU-only
- Batch size: 128 for MPS
- Pin memory for fast transfer

### Parallel Processing

- Uses all CPU cores for data and training
- DataLoader: up to 8 workers
- Game simulation: all cores

### Memory Optimization

- Pin memory for GPU
- Efficient batch processing
- Monitor memory usage

## Environment Setup

### Optimal Threading

```bash
export OMP_NUM_THREADS=$(sysctl -n hw.ncpu)
export MKL_NUM_THREADS=$(sysctl -n hw.ncpu)
export NUMEXPR_NUM_THREADS=$(sysctl -n hw.ncpu)
export VECLIB_MAXIMUM_THREADS=$(sysctl -n hw.ncpu)
```

### Rust Compilation

```toml
[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true
```

## Usage

### Training

```bash
# Optimized training script
./scripts/train_ml_ai_optimized.sh

# Manual training
python scripts/train_ml_ai.py --num-games 10000 --epochs 300 --use-rust-ai
```

### Build Optimized Rust Core

```bash
./scripts/build_rust_ai.sh
```

## Preventing Sleep During Training

Training script uses `caffeinate -i` to keep Mac awake. If running manually:

```bash
caffeinate -i python scripts/train_ml_ai.py
```

## Performance Expectations

- **10-core Mac**: ~1000 games/min, 2-4GB RAM
- **Training time**: 2-4 hours for 10k games/300 epochs

## Troubleshooting

| Issue               | Solution                                                             |
| ------------------- | -------------------------------------------------------------------- |
| MPS not available   | `python -c "import torch; print(torch.backends.mps.is_available())"` |
| Memory issues       | Reduce batch size                                                    |
| Rust build failures | `cargo clean && cargo build --release`                               |

## Best Practices

- Monitor system resources during training
- Adjust batch size and worker count for your hardware
- Clean Rust build artifacts periodically
- Update PyTorch and macOS for latest improvements

## Related Documentation

- [ML AI System](./ml-ai-system.md) - Training and AI implementation
- [Checking Training Status](./checking-training-status.md) - Monitor training progress
