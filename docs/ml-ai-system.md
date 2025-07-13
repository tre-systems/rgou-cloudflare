# ML AI System

## Overview

The ML AI system uses deep learning to train neural networks that can play the Royal Game of Ur. The system consists of:

- **Value Network**: Evaluates game positions and predicts win probability
- **Policy Network**: Predicts the best move probabilities for each position
- **Training Pipeline**: Generates training data and trains the networks

## Architecture

### Neural Networks

Both networks use a feedforward architecture with ReLU activations and dropout:

- **Input Layer**: 100 features representing game state
- **Hidden Layers**: 128 → 64 → 32 neurons with dropout (0.2)
- **Output Layer**:
  - Value Network: 1 neuron (position evaluation)
  - Policy Network: 7 neurons (move probabilities)

### Feature Engineering

The 100-dimensional feature vector includes:

- Piece positions for both players (14 features)
- Board occupancy (21 features)
- Game state metrics (rosette control, piece counts, safety scores, etc.)
- Current player and dice roll information

## Training Process

### Data Generation

1. **Game Simulation**: Uses Rust AI to simulate thousands of games
2. **Parallel Processing**: Utilizes all CPU cores for data generation
3. **Expert Demonstrations**: Extracts moves from the Rust AI as training targets

### Training Configuration

- **Device**: Automatically uses MPS (Metal Performance Shaders) on Mac for GPU acceleration
- **Batch Size**: Optimized for device (128 for MPS, 256 for CUDA, 64 for CPU)
- **Workers**: Uses optimal number of DataLoader workers (up to 8)
- **Memory**: Pin memory enabled for GPU training

### Resource Optimization

The training system is optimized for maximal Mac resource utilization:

- **CPU**: Uses all available cores for parallel game simulation
- **GPU**: Leverages MPS for neural network training
- **Memory**: Efficient data loading with pin memory
- **Rust**: Optimized compilation with native CPU features

## Usage

### Quick Start

```bash
# Run optimized training (recommended)
./scripts/train_ml_ai_optimized.sh

# Or run manually with custom parameters
python scripts/train_ml_ai.py \
    --num-games 10000 \
    --epochs 300 \
    --use-rust-ai \
    --output ml_ai_weights.json
```

### Parameters

- `--num-games`: Number of games to simulate (default: 5000)
- `--epochs`: Training epochs (default: 200)
- `--batch-size`: Batch size (auto-detect if not specified)
- `--learning-rate`: Learning rate (default: 0.001)
- `--use-rust-ai`: Use Rust AI for training data
- `--synthetic`: Use synthetic data instead

### Performance Monitoring

The training script includes resource monitoring:

- Memory usage tracking
- CPU utilization monitoring
- Training time measurement
- Progress bars for data generation and training

## Output

The trained networks are saved as JSON files containing:

- Network weights for both value and policy networks
- Network architecture configuration
- Training metadata

## Integration

The trained weights are loaded by the ML AI service (`src/lib/ml-ai-service.ts`) and used for:

- Real-time game move prediction
- Position evaluation
- AI opponent behavior

## Optimization Features

### Mac-Specific Optimizations

1. **MPS Acceleration**: Automatic GPU acceleration using Metal Performance Shaders
2. **Parallel Processing**: Optimal use of all 10 CPU cores
3. **Memory Management**: Efficient data loading with pin memory
4. **Rust Optimization**: Native CPU compilation with aggressive optimizations

### Environment Variables

The training script sets optimal environment variables:

- `OMP_NUM_THREADS`: OpenMP thread count
- `MKL_NUM_THREADS`: Intel MKL thread count
- `NUMEXPR_NUM_THREADS`: NumExpr thread count
- `VECLIB_MAXIMUM_THREADS`: Accelerate framework thread count

### Build Optimizations

Rust compilation is optimized with:

- `opt-level = 3`: Maximum optimization
- `lto = "fat"`: Link-time optimization
- `panic = "abort"`: Faster panic handling
- `strip = true`: Remove debug symbols
- Native CPU features enabled

## Performance Expectations

With the optimizations, typical performance on a Mac with 10 cores and 32GB RAM:

- **Data Generation**: ~1000 games/minute using all cores
- **Training**: ~50-100 epochs/minute with MPS acceleration
- **Memory Usage**: ~2-4GB during training
- **Total Training Time**: 2-4 hours for 10k games, 300 epochs
