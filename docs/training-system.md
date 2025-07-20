# Training System

_Comprehensive guide to the pure Rust training system with optimized CPU parallel processing._

## Overview

The project uses a **pure Rust training system** with **optimized CPU parallel processing**. This eliminates all Python dependencies and provides excellent performance through efficient use of all available CPU cores.

### Key Features

- ✅ **Pure Rust implementation** - No Python dependencies
- ✅ **Optimized CPU parallel processing** - Uses all available cores efficiently
- ✅ **Feature-based separation** - Training code excluded from WASM
- ✅ **Single source of truth** - Same code for training and inference
- ✅ **Cross-platform** - Works on macOS, Linux, Windows
- ✅ **Apple Silicon optimization** - Uses 8 performance cores on M1/M2/M3

## Architecture

### WASM vs Training Separation

The system uses **feature flags** to keep training code completely separate from the WASM bundle:

```toml
[features]
training = []
```

### Size Comparison

| Build Type           | Size      | Training Code   |
| -------------------- | --------- | --------------- |
| **WASM (optimized)** | **223KB** | ✅ **Excluded** |
| **Training (full)**  | ~50MB     | ✅ **Included** |

**WASM size reduction: 99.85% smaller!**

## Quick Start

### Prerequisites

- **Rust & Cargo** - Latest stable version
- **wasm-pack** - For WASM builds: `cargo install wasm-pack --version 0.12.1 --locked`

### Training Commands

```bash
# Quick test (100 games, 10 epochs)
npm run train:ml:test

# Standard training (1000 games, 50 epochs)
npm run train:ml

# Fast training (500 games, 25 epochs)
npm run train:ml:fast

# Production training (5000 games, 100 epochs)
npm run train:ml:production

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

- **Rust parallel processing** - Uses all CPU cores efficiently
- **Apple Silicon optimization** - Uses 8 performance cores on M1/M2/M3
- **Game simulation** - Generates training games with expectiminimax AI
- **Feature extraction** - Extracts features from each position
- **Real-time progress** - Updates every game with core utilization

### Phase 2: Neural Network Training

- **Sequential gradient descent** - Standard ML training approach
- **Dual networks** - Separate value and policy networks
- **Parallel validation** - Uses all cores for validation phase
- **Progress monitoring** - Updates with loss trends
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

#### Training Phase

```
🎯 Training Progress:
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

- **Data generation**: ~8,300 samples/second across 8 cores
- **Training speed**: ~2-3 hours for 100 epochs (5000 games)
- **Memory efficient**: Optimized for modern CPUs
- **Parallel processing**: Uses all available cores
- **Progress monitoring**: Real-time updates

### Inference Performance

- **WASM size**: 223KB (tiny and fast)
- **Move time**: <1ms per move
- **Memory usage**: ~2.8MB for ML models
- **Browser compatibility**: Works in all modern browsers

## Core Utilization

### Apple Silicon Optimization

The system automatically detects Apple Silicon and optimizes core usage:

- **M1/M2/M3 Macs**: Uses 8 performance cores out of 10 total cores
- **High-core systems**: Uses 8 cores for optimal performance
- **Other systems**: Uses all available cores

### Thread Pool Configuration

- **Stack size**: 8MB per thread for deep recursion support
- **Thread count**: Optimized based on system capabilities
- **Load balancing**: Efficient work distribution across cores

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
- **Apple Silicon Optimization**: Uses 8 performance cores for intensive work
- **Improved Progress Tracking**: Atomic completion counter with core identification
- **Fixed Game Simulation**: Corrected turn counting and value target calculation
- **Pure Rust Architecture**: Rust data generation + Rust CPU training
- **Parallel Validation**: Uses all cores for validation phase
- **Comprehensive Logging**: Real-time progress tracking
- **Clean Exit**: Proper resource cleanup and exit handling
- **Organized Storage**: Project-based training data organization

## Move Selection

For each valid move:

1. Simulate the move
2. Extract features
3. Evaluate with both networks
4. Select move with highest combined score

## Why Use ML Instead of Search?

### Advantages

- **Speed**: Neural network inference is much faster than search
- **Memory**: No need to store search trees
- **Scalability**: Can handle complex positions without exponential growth
- **Learning**: Improves with more training data

### Trade-offs

- **Training time**: Requires significant training data and time
- **Black box**: Less interpretable than search-based approaches
- **Quality**: May not reach the same level as deep search

## TODO

### Future Enhancements

- **GPU Training**: Implement GPU acceleration for faster training
  - Consider frameworks like Burn, tch-rs, or custom CUDA/Metal implementation
  - Focus on Apple Silicon Metal backend for optimal performance
  - Maintain compatibility with existing CPU training pipeline
- **Advanced Architectures**: Experiment with transformer-based models
- **Self-Play Training**: Implement reinforcement learning through self-play
- **Model Compression**: Optimize model size for faster inference
