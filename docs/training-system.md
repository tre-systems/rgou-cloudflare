# Training System

_Comprehensive guide to the pure Rust training system with Apple Silicon GPU support._

## Overview

The project uses a **pure Rust training system** with **Apple Silicon GPU acceleration** via the Burn framework. This eliminates all Python dependencies and provides superior performance.

### Key Features

- ✅ **Pure Rust implementation** - No Python dependencies
- ✅ **Apple Silicon GPU support** - Metal backend via Burn WGPU
- ✅ **Feature-based separation** - Training code excluded from WASM
- ✅ **Single source of truth** - Same code for training and inference
- ✅ **Automatic differentiation** - Built-in autodiff support
- ✅ **Cross-platform** - Works on macOS, Linux, Windows

## Architecture

### WASM vs Training Separation

The system uses **feature flags** to keep training code completely separate from the WASM bundle:

```toml
# Training dependencies (only when training feature is enabled)
burn = { version = "0.18.0", features = ["train", "autodiff", "wgpu"], optional = true }
burn-wgpu = { version = "0.18.0", features = ["metal"], optional = true }
burn-train = { version = "0.18.0", optional = true }
burn-derive = { version = "0.18.0", optional = true }

[features]
training = [
    "dep:burn",
    "dep:burn-wgpu",
    "dep:burn-train",
    "dep:burn-derive",
]
```

### Size Comparison

| Build Type           | Size      | Training Code   |
| -------------------- | --------- | --------------- |
| **WASM (optimized)** | **223KB** | ✅ **Excluded** |
| **Training (full)**  | ~150MB    | ✅ **Included** |

**WASM size reduction: 99.85% smaller!**

## Quick Start

### Prerequisites

- **Rust & Cargo** - Latest stable version
- **Apple Silicon Mac** - For GPU acceleration (M1/M2/M3)
- **wasm-pack** - For WASM builds: `cargo install wasm-pack --version 0.12.1 --locked`

### Training Commands

```bash
# Quick test (100 games, 10 epochs)
npm run train:ml:test

# Standard training (1000 games, 50 epochs)
npm run train:ml

# Production training (5000 games, 100 epochs)
npm run train:ml:v5

# Custom training
cd worker/rust_ai_core && cargo run --bin train --release --features training -- train 2000 75 0.001 32 4 custom_weights.json
```

### Loading Weights

```bash
# Load trained weights for browser use
npm run load:ml-weights ml/data/weights/ml_ai_weights_v5.json
```

## Neural Network Architecture

### Current Architecture

- **Input**: 150-dimensional feature vector
- **Hidden layers**: [256, 128, 64, 32] (ReLU activation)
- **Value output**: 1 neuron (tanh activation)
- **Policy output**: 7 neurons (softmax activation)
- **Total parameters**: ~81K (value) + ~82K (policy)

### Feature Extraction

The system extracts 150 features from game state:

- Board position features (84 features)
- Game state features (66 features)
- Consistent between training and inference

## Training Pipeline

### Phase 1: Data Generation

- **Rust parallel processing** - Uses all CPU cores
- **Apple Silicon optimization** - Uses performance cores only
- **Game simulation** - Generates training games with expectiminimax AI
- **Feature extraction** - Extracts features from each position
- **Real-time progress** - Updates every game with core utilization

### Phase 2: Neural Network Training

- **Sequential gradient descent** - Standard ML training approach
- **Dual networks** - Separate value and policy networks
- **Progress monitoring** - Updates every 10 seconds with loss trends
- **Early stopping** - Automatic stopping when no improvement
- **Validation split** - 20% validation data for overfitting detection

### Phase 3: Model Saving

- **JSON format** - Compatible with existing system
- **Metadata tracking** - Training parameters and performance
- **Version control** - Model versioning and comparison

## Training Output

### Enhanced Progress Monitoring

The training system provides comprehensive real-time feedback:

#### Data Generation Phase

```
🎮 Core 2: 5.0% - 0.0 games/sec - ETA: 0s - Samples: 150
🎮 Core 3: 10.0% - 0.0 games/sec - ETA: 0s - Samples: 300
...
✅ === Data Generation Complete ===
⏱️  Generation time: 0.25 seconds
📊 Generated 1662 training samples
⚡ Samples per second: 6629
```

#### Training Phase (Every 10 seconds)

```
🎯 Training Progress (updates every 10 seconds):
═══════════════════════════════════════════════════════════════
⏱️  Epoch 1/100 (2s) | Train: 2.3070 | Val: 1.9651 | Δ: +0.0000 | ETA: 3.3m
   📊 Trends: Train 📉 | Val 📉 | Best Val: 1.9651
   🎉 New best validation loss: 1.9651
```

#### Final Summary

```
🎉 === Training Complete ===
⏱️  Total training time: 180.45 seconds
📊 Final validation loss: 0.8234
📈 Loss improvement: 58.12%
```

### Progress Metrics

- **⏱️ Epoch Progress**: Current epoch, total epochs, epoch time
- **📊 Loss Values**: Training and validation loss with 4 decimal precision
- **📈 Loss Change**: Delta from previous epoch (+/-)
- **⏰ ETA**: Estimated time remaining in minutes
- **📉📈 Trends**: Visual indicators showing if loss is decreasing/increasing
- **🎉 Achievements**: New best validation loss notifications
- **🛑 Early Stopping**: Automatic stopping if no improvement for 20 epochs

## Performance

### Training Performance

- **Data generation**: ~6,600 samples/second across 8 cores
- **Training speed**: ~2-3 hours for 100 epochs (5000 games)
- **Memory efficient**: Optimized for M1/M2/M3 chips
- **Parallel processing**: Uses all available cores
- **Progress monitoring**: Real-time updates every 10 seconds

### Inference Performance

- **WASM size**: 223KB (tiny and fast)
- **Move time**: <1ms per move
- **Memory usage**: ~2.8MB for ML models
- **Browser compatibility**: Works in all modern browsers

## Model Management

### Current Models

| Model      | Win Rate vs EMM-3 | Training Time | Parameters | Status                  |
| ---------- | ----------------- | ------------- | ---------- | ----------------------- |
| **v2**     | **44%**           | 2h            | 164K       | ✅ **Best Performance** |
| **Fast**   | 36%               | 1h            | 164K       | Competitive             |
| **v4**     | 32%               | 1h 53m        | 164K       | ⚠️ Needs Improvement    |
| **Hybrid** | 30%               | 3h            | 164K       | ⚠️ Needs Improvement    |
| **v5**     | TBD               | TBD           | 164K       | In development          |

### Model Comparison

- **v2 Model**: **Best performing model** (July 2025) - **44% win rate vs EMM-3** - **Production Ready** ✅
- **Fast Model**: Competitive model (100 inputs) - **36% win rate vs EMM-3**
- **v4 Model**: Latest production model (July 2025) - **32% win rate vs EMM-3** - **Needs Improvement** ⚠️
- **Hybrid Model**: Hybrid architecture model - **30% win rate vs EMM-3** - **Needs Improvement** ⚠️

### Loading Weights

```bash
# Load best performing model (v2)
npm run load:ml-weights ml/data/weights/ml_ai_weights_v2.json

# Load fast model
npm run load:ml-weights ml/data/weights/ml_ai_weights_fast.json

# Load latest v4 model
npm run load:ml-weights ~/Desktop/rgou-training-data/weights/ml_ai_weights_v4.json

# Load hybrid model
npm run load:ml-weights ~/Desktop/rgou-training-data/weights/ml_ai_weights_hybrid.json
```

### Training Data Organization

```
ml/data/
├── training/       # Generated training data
├── weights/        # Trained model weights
└── genetic_params/ # Genetic algorithm parameters
```

## Training Configuration

| Parameter         | Default | Description                           |
| ----------------- | ------- | ------------------------------------- |
| `--num-games`     | 1000    | Number of training games to generate  |
| `--epochs`        | 50      | Training epochs                       |
| `--depth`         | 3       | Expectiminimax depth for expert moves |
| `--batch-size`    | auto    | GPU batch size (auto-detected)        |
| `--learning-rate` | 0.001   | Learning rate                         |
| `--verbose`       | false   | Detailed logging                      |

## Key Improvements Needed

### High Priority

- **Fix WASM Weight Persistence**: Maintain global singleton in Rust code
- **Correct Training Loss**: Remove softmax from PolicyNetwork definition

### Medium Priority

- **Enhanced Training Data**: Add `simulate_complete_game()` function in Rust
- **Better Value Targets**: Use Classic AI's evaluation function
- **Unified Architecture**: Single network with two outputs

### Advanced

- **Self-Play Reinforcement Learning**: Fine-tune through self-play
- **Monte Carlo Tree Search**: Add lightweight search on top of neural network
- **Feature Engineering**: Review and optimize 150 features

## Testing

```bash
# Test best performing model (v2)
npm run test:ml-v2

# Test fast model performance
npm run test:ml-fast

# Test v4 model performance
npm run test:ml-v4

# Test hybrid model performance
npm run test:ml-hybrid

# Run all ML tests
npm run test:rust
```

## Recent Optimizations

### ✅ Completed

- **v5 EMM-4 Training**: Training new model with Expectiminimax depth 4 for stronger play
- **Apple Silicon Optimization**: Uses only performance cores (8/10) for intensive work
- **Improved Progress Tracking**: Atomic completion counter with core identification
- **Fixed Game Simulation**: Corrected turn counting and value target calculation
- **Pure Rust Architecture**: Rust data generation + Rust GPU training
- **GPU Detection**: Automatic device selection with validation
- **Comprehensive Logging**: Real-time progress tracking
- **Clean Exit**: Proper resource cleanup and exit handling
- **Organized Storage**: Project-based training data organization

## GPU Training Support

- **Apple Silicon (M1/M2/M3)**: Metal Performance Shaders (MPS) - 10-20x speedup
- **NVIDIA GPUs**: CUDA acceleration
- **Fallback**: CPU training if GPU unavailable

## Move Selection

For each valid move:

1. Simulate the move
2. Extract features
3. Evaluate with both networks
4. Select move with highest combined score

## Why Use ML Instead of Search?

- **Speed**: Moves selected in milliseconds without deep search
- **Unique Playstyle**: Strategies learned from data, not hand-coded
- **Efficiency**: Runs efficiently in browser via WebAssembly

## Mac Optimization

### System Requirements

- macOS 12.3+
- Rust (latest stable)
- Apple Silicon (M1/M2/M3) or Intel Mac with Metal support

### Key Optimizations

- **GPU Acceleration (MPS)**: Uses Metal for neural network training (3-5x faster than CPU-only)
- **Parallel Processing**: Uses all CPU cores for data generation and training
- **Memory Optimization**: Efficient batch processing and GPU memory management

### Environment Setup

```bash
# Optimal threading for Apple Silicon
export OMP_NUM_THREADS=$(sysctl -n hw.ncpu)
export MKL_NUM_THREADS=$(sysctl -n hw.ncpu)
export NUMEXPR_NUM_THREADS=$(sysctl -n hw.ncpu)
export VECLIB_MAXIMUM_THREADS=$(sysctl -n hw.ncpu)
```

### Rust Compilation Optimization

```toml
[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true
```

### Preventing Sleep During Training

Training automatically uses `caffeinate -i` to keep Mac awake. If running manually:

```bash
caffeinate -i cargo run --bin train --release --features training
```

### Performance Expectations

- **10-core Mac**: ~1000 games/min, 2-4GB RAM
- **Training time**: 2-4 hours for 10k games/300 epochs

## Monitoring Training Status

### Quick Status Check

```bash
# Check if training is running
ps aux | grep train | grep -v grep

# Check output files
ls -lh ml/data/weights/ml_ai_weights_*.json*

# Check recent activity
ls -lt ml/data/weights/ | head -5

# Check CPU usage
top -o cpu
```

### Status Indicators

- **Training Running**: Rust process with high CPU usage
- **Training Complete**: Large weights file exists with recent timestamp
- **Check Terminal**: Look for progress output in training terminal

### Troubleshooting

| Issue               | Solution                                                            |
| ------------------- | ------------------------------------------------------------------- |
| MPS not available   | Check Metal support: `cargo run --bin test_gpu --features training` |
| Memory issues       | Reduce batch size in training configuration                         |
| Rust build failures | `cargo clean && cargo build --release`                              |

## Related Documentation

- [AI System](./ai-system.md) - Classic expectiminimax AI
- [Architecture Overview](./architecture-overview.md) - System design
