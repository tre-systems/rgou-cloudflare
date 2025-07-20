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

- **Win Rate**: ~30% vs Classic AI (EMM-1)
- **Speed**: <1ms per move
- **Status**: Competitive baseline with room for improvement

## Training Pipeline

The project uses a **hybrid Rust+Python architecture** for optimal performance:

1. **🦀 Rust Data Generation**: Fast parallel game simulation using all CPU cores
2. **🔥 Python GPU Training**: Efficient neural network training with PyTorch
3. **⚡ Maximum CPU Utilization**: Uses all available cores for data generation
4. **📊 Comprehensive Logging**: Detailed progress tracking and performance metrics

## Quick Training

```bash
# Quick test (5 games, 1 epoch)
npm run train:ml:test

# Standard training (1000 games, 50 epochs)
npm run train:ml

# Production training (5000 games, 100 epochs)
npm run train:ml:production

# Custom training
python ml/scripts/train_hybrid.py --num-games 2000 --epochs 75 --depth 4 --verbose
```

## Training Features

- **🚀 GPU Acceleration**: Apple MPS, NVIDIA CUDA, or CPU fallback
- **📁 Organized Storage**: Training data and weights in `~/Desktop/rgou-training-data/`
- **📊 Progress Logging**: Real-time batch and epoch progress updates
- **⏱️ Early Stopping**: Prevents overfitting with validation monitoring
- **🧹 Clean Exit**: Proper cleanup and resource management

## Training Configuration

| Parameter | Default | Description |
| --------- | ------- | ----------- |
| `--num-games` | 1000 | Number of training games to generate |
| `--epochs` | 50 | Training epochs |
| `--depth` | 3 | Expectiminimax depth for expert moves |
| `--batch-size` | auto | GPU batch size (auto-detected) |
| `--learning-rate` | 0.001 | Learning rate |
| `--verbose` | false | Detailed logging |

## Model Management

### Available Models

- **Hybrid Model**: Latest trained model with hybrid architecture
- **Fast Model**: Simpler architecture (100 inputs) - faster inference
- **v2 Model**: Enhanced architecture (150 inputs) - stronger play

### Loading Weights

```bash
# Load latest hybrid model
npm run load:ml-weights ~/Desktop/rgou-training-data/weights/ml_ai_weights_hybrid.json

# Load fast model
npm run load:ml-weights ml/data/weights/ml_ai_weights_fast.json

# Load v2 model
npm run load:ml-weights ml/data/weights/ml_ai_weights_v2.json
```

### Training Data Organization

```
~/Desktop/rgou-training-data/
├── data/           # Generated training data
├── weights/        # Trained model weights
├── logs/           # Training logs
└── temp/           # Temporary files
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

## Recent Optimizations

### ✅ Completed

- **Hybrid Architecture**: Rust data generation + Python GPU training
- **Maximum CPU Utilization**: Parallel processing with rayon
- **GPU Detection**: Automatic device selection with validation
- **Comprehensive Logging**: Real-time progress tracking
- **Clean Exit**: Proper resource cleanup and exit handling
- **Organized Storage**: Desktop-based training data organization

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
