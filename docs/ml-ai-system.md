# ML AI System

_Neural network AI implementation for the Royal Game of Ur._

## Overview

The ML AI is a neural network agent that learns to play by imitating the Classic AI (expectiminimax algorithm). It provides an alternative playstyle to traditional game theory approaches.

## Architecture

- **Input**: 150-dimensional feature vector representing game state
- **Model**: Two neural networks sharing input:
  - Value network: predicts expected outcome
  - Policy network: predicts best move (probability distribution)
- **Output**: Move with highest combined score (value + policy + bonuses)

## Model Structure

- Input: 150 features
- Hidden: 256 → 128 → 64 → 32 (ReLU activation)
- Output: Value (1 neuron, tanh), Policy (7 neurons, softmax)

## Current Performance

- **v2 Model**: **40% win rate vs Classic AI (EMM-3)** - **Best Performance** ✅
- **Fast Model**: 20% win rate vs Classic AI (EMM-3) - **Needs Improvement** ⚠️
- **v4 Model**: 20% win rate vs Classic AI (EMM-3) - **Needs Improvement** ⚠️
- **Hybrid Model**: 30% win rate vs Classic AI (EMM-3) - **Competitive**
- **Speed**: <1ms per move
- **Status**: v2 model still performs best, but all models need improvement vs EMM-4

## Latest Training Results (v4 Model)

**Training Date**: July 20, 2025  
**Training Time**: 1h 53m 9s  
**Configuration**: 5,000 games, 100 epochs, depth 3  
**Results**:

- **Training Loss**: 0.825
- **Validation Loss**: 0.707 (excellent generalization)
- **Training Samples**: 861,681
- **Model Size**: 4.0M parameters (81,921 value + 82,119 policy)
- **Device**: Apple MPS GPU acceleration
- **Performance**: 1.357 seconds per game generation

**Key Metrics**:

- ✅ Validation loss (0.707) < Training loss (0.825) - excellent generalization
- ✅ Completed all 100 epochs without early stopping
- ✅ Final learning rate: 0.00025 (proper decay)
- ✅ High-quality training data with 861K+ samples
- ⚠️ **Performance Issue**: 32% win rate vs EMM-3, below v2 model's 44%

## Training Pipeline

The project uses a **pure Rust architecture** with **Apple Silicon GPU acceleration**:

1. **🦀 Rust Data Generation**: Fast parallel game simulation using all CPU cores
2. **🔥 Rust GPU Training**: Efficient neural network training with Burn framework
3. **⚡ Apple Silicon Optimization**: Uses Metal backend for GPU acceleration
4. **📊 Comprehensive Logging**: Detailed progress tracking and performance metrics

## Quick Training

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

## Training Features

- **🚀 GPU Acceleration**: Apple MPS, NVIDIA CUDA, or CPU fallback
- **📁 Organized Storage**: Training data and weights in `ml/data/`
- **📊 Progress Logging**: Real-time progress tracking and performance metrics
- **⏱️ Early Stopping**: Prevents overfitting with validation monitoring
- **🧹 Clean Exit**: Proper cleanup and resource management
- **💤 Caffeinate**: Prevents system sleep during long training runs
- **🍎 Apple Silicon Optimization**: Uses Metal backend for GPU acceleration

## Training Configuration

| Parameter         | Default | Description                           |
| ----------------- | ------- | ------------------------------------- |
| `--num-games`     | 1000    | Number of training games to generate  |
| `--epochs`        | 50      | Training epochs                       |
| `--depth`         | 3       | Expectiminimax depth for expert moves |
| `--batch-size`    | auto    | GPU batch size (auto-detected)        |
| `--learning-rate` | 0.001   | Learning rate                         |
| `--verbose`       | false   | Detailed logging                      |

## Model Management

### Available Models

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

## Related Documentation

- [AI System](./ai-system.md) - Classic expectiminimax AI
- [AI Performance](./ai-performance.md) - Performance data and analysis
- [Architecture Overview](./architecture-overview.md) - System design
