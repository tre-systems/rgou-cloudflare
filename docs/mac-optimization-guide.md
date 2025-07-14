# Mac Optimization Guide

Related: [ML AI System](./ml-ai-system.md) | [Technical Implementation Guide](./technical-implementation.md)

## Overview

This guide documents optimizations for ML training on Mac, especially with MPS (Metal Performance Shaders) support.

## System Requirements

- macOS 12.3+
- Python 3.8+ with PyTorch 2.0+
- Rust (latest stable)
- Apple Silicon (M1/M2) or Intel Mac with Metal support

## Optimizations

### 1. GPU Acceleration (MPS)

- Uses Metal for neural network training
- 3-5x faster than CPU-only
- Automatic device detection
- Batch size: 128 for MPS
- Pin memory for fast transfer

### 2. Parallel Processing

- Uses all CPU cores for data and training
- Linear scaling with core count
- DataLoader: up to 8 workers
- Game simulation: all cores

### 3. Memory Optimization

- Pin memory for GPU
- Efficient batch processing
- Monitor memory usage

### 4. Rust Compilation

- Optimized for performance
- Example:

```toml
[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true
```

### 5. Environment Variables

- Set optimal threading for numerical libraries

```bash
export OMP_NUM_THREADS=$(sysctl -n hw.ncpu)
export MKL_NUM_THREADS=$(sysctl -n hw.ncpu)
export NUMEXPR_NUM_THREADS=$(sysctl -n hw.ncpu)
export VECLIB_MAXIMUM_THREADS=$(sysctl -n hw.ncpu)
```

### 6. Neural Network Architecture

- Larger hidden layers
- Dropout for regularization
- ReLU activations for MPS

## Usage

```bash
./scripts/train_ml_ai_optimized.sh
# Or
python scripts/train_ml_ai.py --num-games 10000 --epochs 300 --use-rust-ai --output ml_ai_weights.json
```

### Build Optimized Rust Core

```bash
./scripts/build_rust_ai.sh
```

## Preventing Mac Sleep During Training

- Training script uses `caffeinate -i` to keep Mac awake
- If running manually, prefix with `caffeinate -i`

## Performance Monitoring

- Built-in resource usage tracking
- On a 10-core Mac, expect ~1000 games/min, 2-4GB RAM, 2-4 hours for 10k games/300 epochs

## Troubleshooting

- **MPS not available:** `python -c "import torch; print(torch.backends.mps.is_available())"`
- **Memory issues:** Reduce batch size
- **Rust build failures:** `cargo clean && cargo build --release`

## Best Practices

- Monitor system resources
- Adjust batch size and worker count for your hardware
- Clean Rust build artifacts periodically
- Update PyTorch and macOS for latest improvements
