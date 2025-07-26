# AI System Documentation

This document describes the comprehensive AI system for the Royal Game of Ur, including both Classic AI (expectiminimax) and ML AI (neural network) implementations, performance analysis, testing strategies, and development history.

## Overview

The game features two distinct AI opponents, each with unique playstyles and architectures:

- **Classic AI**: Strategic opponent using expectiminimax algorithm with evolved genetic parameters
- **ML AI**: Modern neural network AI trained through self-play with multiple model variants

Both AIs run locally in the browser via WebAssembly, providing instant responses without network latency.

## Classic AI

The Classic AI is the default and most robust opponent, using the expectiminimax algorithm - an extension of minimax designed for games with chance elements like dice rolls.

### Core Algorithm

- **Minimax**: For deterministic game states where players make choices
- **Expectation Nodes**: For chance-based events (dice rolls), calculating expected value based on probabilities
- **Alpha-Beta Pruning**: Powerful optimization that prunes search tree portions that cannot influence decisions

### Dice Probabilities

| Roll | Probability |
| ---- | ----------- |
| 0    | 1/16        |
| 1    | 4/16        |
| 2    | 6/16        |
| 3    | 4/16        |
| 4    | 1/16        |

### Position Evaluation

The evaluation function uses evolved genetic parameters optimized through a genetic algorithm process (50 generations, 50 individuals per generation, 100 games per evaluation).

**Current Evolved Parameters (July 2025)**:
- `win_score`: 8354 (reduced from 10000)
- `finished_piece_value`: 638 (reduced from 1000)
- `position_weight`: 30 (increased from 15)
- `safety_bonus`: -13 (reduced from 25)
- `rosette_control_bonus`: 61 (increased from 40)
- `advancement_bonus`: 11 (increased from 5)
- `capture_bonus`: 49 (increased from 35)
- `center_lane_bonus`: 4 (increased from 2)

**Performance**: Evolved parameters achieve 61% win rate against default parameters.

### Search Depth Optimization

Optimized for depth 3 search, providing the best performance/speed ratio:

- **Production**: Depth 3 search for optimal balance
- **Maximum Strength**: Depth 4 search for strongest play
- **Fast Alternative**: Depth 2 search for instant speed
- **Testing**: Various depths for performance analysis

## ML AI

The ML AI offers a different challenge with playstyle developed from observing thousands of games.

### Architecture

- **Input**: 150-dimensional feature vector representing game state
- **Model**: Two neural networks sharing input:
  - Value network: predicts expected outcome
  - Policy network: predicts best move (probability distribution)
- **Output**: Move with highest combined score (value + policy + bonuses)

### Model Structure

- Input: 150 features
- Hidden: 256 → 128 → 64 → 32 (ReLU activation)
- Output: Value (1 neuron, tanh), Policy (7 neurons, softmax)

### Training System

**Pure Rust Architecture** with optimized CPU parallel processing:

1. **🦀 Rust Data Generation**: Fast parallel game simulation using all CPU cores
2. **⚡ CPU Training**: Efficient neural network training with custom implementation
3. **🍎 Apple Silicon Optimization**: Uses 8 performance cores on M1/M2/M3
4. **📊 Comprehensive Logging**: Detailed progress tracking and performance metrics

### Model Variants

| Model | Win Rate vs EMM-3 | Training Games | Epochs | Status |
|-------|------------------|----------------|--------|--------|
| **PyTorch V5** | **60.0%** | 2000 | 100 | ✅ **Best ML Performance** |
| **ML-Hybrid** | **60.0%** | 2000 | 100 | ✅ **Best ML Performance** |
| **ML-V4** | **58.9%** | 5000 | 100 | ✅ **Strong Performance** |
| **ML-V2** | **55.6%** | 1000 | 50 | ✅ **Good Performance** |
| **ML-Fast** | **51.1%** | 500 | 25 | ⚠️ **Needs Improvement** |

## Performance Analysis (July 2025)

> **For the latest, detailed AI performance results, see [AI-MATRIX-RESULTS.md](./AI-MATRIX-RESULTS.md).**

Based on comprehensive testing of 450+ games across all AI types:

### Classic AI Performance

| AI Type | Win Rate | Search Depth | Speed | Notes |
|---------|----------|--------------|-------|-------|
| **EMM-Depth3** | **75.6%** | 3-ply | 15.6ms | **Best overall performance** |
| **EMM-Depth2** | **51.1%** | 2-ply | Instant | Strong alternative |
| **EMM-Depth1** | **46.7%** | 1-ply | Instant | Fast baseline |
| **Heuristic** | **35.6%** | N/A | Instant | Educational baseline |

### ML AI Performance

| Model | Win Rate | Speed | Status |
|-------|----------|-------|--------|
| **ML-Hybrid** | **60.0%** | 52.1ms | ✅ **Best ML Performance** |
| **PyTorch V5** | **60.0%** | 54.8ms | ✅ **Best ML Performance** |
| **ML-V4** | **58.9%** | 50.7ms | ✅ **Strong Performance** |
| **ML-V2** | **55.6%** | 53.5ms | ✅ **Good Performance** |
| **ML-Fast** | **51.1%** | 58.4ms | ⚠️ **Needs Improvement** |

### Speed Analysis

| AI Type | Average Time | Category |
|---------|--------------|----------|
| EMM-Depth1 | 0.0ms | Very Fast |
| EMM-Depth2 | 0.0ms | Very Fast |
| Heuristic | 0.0ms | Very Fast |
| Random | 0.0ms | Very Fast |
| EMM-Depth3 | 15.6ms | Moderate |
| ML-V4 | 50.7ms | Slow |
| ML-Hybrid | 52.1ms | Slow |
| ML-V2 | 53.5ms | Slow |
| PyTorch V5 | 54.8ms | Slow |
| ML-Fast | 58.4ms | Slow |

### Production Recommendations

- **Primary Choice**: EMM-3 (Depth 3) - Best overall performance (75.6% win rate)
- **Fast Alternative**: EMM-1/2 (Depth 1/2) - Instant speed with good performance
- **ML AI Options**: ML-Hybrid or PyTorch V5 - Competitive performance (60% win rate)
- **Educational**: Heuristic AI - Good for learning game mechanics
- **Baseline**: Random AI - For testing and comparison

## AI Testing Strategy

### Test Infrastructure

**Core Components**:
1. **AI Matrix Test** (`worker/rust_ai_core/tests/ai_matrix_test.rs`)
   - Comprehensive testing infrastructure
   - Unified player interface
   - Complete matrix of all AI vs all AI comparisons
   - Automated performance analysis and recommendations

2. **Test Runner Script** (`scripts/test-ai-comparison.sh`)
   - Unified test execution
   - Configurable test parameters
   - Automated result generation

### Test Categories

**Matrix Tests (Primary)**:
- Comprehensive AI Matrix: Every AI vs every other AI
- Performance Rankings: Win rates, speed analysis, recommendations
- Configurable Games: 5-100 games per match via NUM_GAMES environment variable

**Fast Tests (Default)**:
- Basic functionality validation
- AI player trait verification
- Performance metrics calculation

**Slow Tests (Optional)**:
- Depth 4 expectiminimax testing
- Comprehensive ML model evaluation
- Extended game simulations

### Running Tests

```bash
# Quick test suite
npm run test:ai-comparison:fast

# Comprehensive test suite
npm run test:ai-comparison:comprehensive

# Matrix test only
cd worker/rust_ai_core
NUM_GAMES=20 cargo test test_ai_matrix -- --nocapture
```

### Test Results Format

The AI matrix test generates comprehensive results including:
- Win rate matrix for all AI combinations
- Performance rankings and recommendations
- Speed analysis and categorization
- Detailed configuration and timing information

## Training System

### Data Generation

- **Method**: Self-play games with parallel processing
- **Features**: 150+ game state features
- **Targets**: Value function (win/loss prediction) and policy (move probabilities)

### Training Presets

**Quick Preset**:
- Games: 100
- Epochs: 10
- Batch Size: 32
- Use Case: Testing and development

**Default Preset**:
- Games: 1000
- Epochs: 50
- Batch Size: 32
- Use Case: Standard training runs

**Production Preset**:
- Games: 2000
- Epochs: 100
- Batch Size: 64
- Use Case: Final model training

### Backend Selection

**Auto (Default)**:
- Automatically selects best available backend
- PyTorch if GPU acceleration is available
- Rust if no GPU acceleration

**Rust**:
- CPU-based training
- Always available
- Slower but more reliable

**PyTorch**:
- GPU-accelerated training
- Requires CUDA or Apple Metal (MPS)
- Faster training when available

### Training Commands

```bash
# Quick development training
npm run train:quick

# Production PyTorch training
npm run train:pytorch:production

# Custom Rust training
npm run train:rust -- --num-games 500 --epochs 25
```

## Development History

### Key Milestones

**July 2025 - PyTorch V5 Breakthrough**:
- First ML model competitive with strongest classic AI (EMM-4)
- 44% win rate vs EMM-4 with 8.1x speed advantage
- Represents breakthrough in ML AI development

**July 2025 - Pure Rust Training Migration**:
- Complete migration from Python to Rust with custom neural network
- 10-20x faster training with Apple Silicon optimization
- Eliminated all Python dependencies

**2024 - Genetic Parameter Evolution**:
- Evolved genetic parameters through 50 generations
- 61% win rate improvement over default parameters
- All classic AI now uses evolved parameters by default

### Lessons Learned

1. **Training Data Quality > Quantity**: v2 model (1,000 games) outperforms newer models (5,000+ games)
2. **Validation Loss ≠ Competitive Performance**: Models with excellent validation can perform poorly in competition
3. **Simpler Architectures Can Be Better**: v2 model's success with simple architecture
4. **Pure Rust Provides Significant Benefits**: 10-20x performance improvements
5. **Apple Silicon Optimization is Critical**: Native Metal backend provides massive benefits

## Implementation Details

### Core Files

- **Classic AI Core**: `worker/rust_ai_core/src/lib.rs`
- **WASM Interface**: `worker/rust_ai_core/src/wasm_api.rs`
- **Frontend Integration**: `src/lib/wasm-ai-service.ts`
- **ML AI Service**: `src/lib/ml-ai-service.ts`
- **Training System**: `ml/scripts/train.sh`

### Genetic Parameter Evolution

```bash
# Run evolution
cd worker/rust_ai_core
cargo run --release --bin evolve_params

# Validate results
cargo test test_genetic_params_comparison -- --nocapture
```

## Future Directions

### Short Term (Next 3 Months)
- Investigate ONNX and 'trace' for ML AI
- Optimize neural network architecture
- Implement GPU training acceleration with Rust

### Medium Term (Next 6 Months)
- Add self-play reinforcement learning
- Implement Monte Carlo Tree Search on top of neural network
- Optimize feature engineering (review 150 features)

### Long Term (Next Year)
- Add multiplayer support
- Create mobile app version
- Implement continuous AI improvement

## Summary

The AI system provides a comprehensive suite of opponents ranging from educational baselines to competitive neural networks. The Classic AI offers reliable, strong play while the ML AI demonstrates the potential of modern machine learning approaches. Both systems run efficiently in the browser, providing instant responses and enabling true offline play.

**Current Recommendations**:
- **Production**: EMM-3 (Depth 3) for best overall performance
- **ML Research**: PyTorch V5 and ML-Hybrid for advanced AI development
- **Educational**: Heuristic AI for understanding game strategy
- **Baseline**: Random AI for performance comparisons 

> **Note:** All AI performance stats, win rates, and timing data in this document are generated by the automated AI matrix test and saved to [AI-MATRIX-RESULTS.md](./AI-MATRIX-RESULTS.md). For the latest results, see that file. 