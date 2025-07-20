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

1. **Data Generation**: Play games using Classic AI, extract features and outcomes
2. **Training**: Train networks with GPU acceleration (MPS/CUDA)
3. **Evaluation**: Test vs Classic AI for win rate and move quality

## Quick Training

```bash
# Train ML AI v2 (recommended)
npm run train:ml:version -- --version v2

# Train with custom parameters
python ml/scripts/train_ml_ai_version.py --version v3 --epochs 500

# Reuse existing games (faster)
python ml/scripts/train_ml_ai_version.py --version v2 --reuse-games
```

## Available Versions

| Version | Games  | Epochs | Learning Rate | Purpose           |
| ------- | ------ | ------ | ------------- | ----------------- |
| v1      | 100    | 50     | 0.001         | Quick testing     |
| v2      | 1,000  | 100    | 0.001         | Standard training |
| v3      | 5,000  | 300    | 0.0005        | Extended training |
| v4      | 10,000 | 500    | 0.0003        | Advanced training |
| v5      | 20,000 | 1,000  | 0.0002        | Maximum training  |

## Model Management

### Available Models

- **Fast Model**: Simpler architecture (100 inputs) - faster inference
- **v2 Model**: Enhanced architecture (150 inputs) - stronger play

### Loading Weights

```bash
# Load fast model
npm run load:ml-weights ml/data/weights/ml_ai_weights_fast.json

# Load v2 model
npm run load:ml-weights ml/data/weights/ml_ai_weights_v2.json
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
