# AI System Documentation

This document describes the two primary AI opponents available in the Royal Game of Ur.

## Overview

The game features two distinct AI opponents, each with a unique playstyle and architecture:

- **Classic AI**: A strategic opponent using the expectiminimax algorithm.
- **ML AI**: A modern, experimental AI powered by a neural network trained through self-play.

At the start of each game, players can choose which AI to play against, or they can watch the two AIs play against each other.

## Classic AI

The Classic AI is the default and most robust opponent. It uses the expectiminimax algorithm, an extension of minimax designed for two-player games with an element of chance, like dice rolls.

### Core Algorithm

- **Minimax**: For deterministic game states where players make choices.
- **Expectation Nodes**: For chance-based events (dice rolls), where the AI calculates the expected value of a move based on the probability of each outcome.
- **Alpha-Beta Pruning**: A powerful optimization that prunes large portions of the search tree that cannot influence the final decision.

### Dice Probabilities

The AI uses the following probabilities for the four tetrahedral dice:

| Roll | Probability |
| ---- | ----------- |
| 0    | 1/16        |
| 1    | 4/16        |
| 2    | 6/16        |
| 3    | 4/16        |
| 4    | 1/16        |

### Position Evaluation

The evaluation function uses evolved genetic parameters that were optimized through a genetic algorithm process. These parameters were evolved over 50 generations with 50 individuals per generation, playing 100 games per evaluation, and validated with 1000 games.

**Current Evolved Parameters (July 2025):**

- `win_score`: 8354 (reduced from 10000)
- `finished_piece_value`: 638 (reduced from 1000)
- `position_weight`: 30 (increased from 15)
- `safety_bonus`: -13 (reduced from 25)
- `rosette_control_bonus`: 61 (increased from 40)
- `advancement_bonus`: 11 (increased from 5)
- `capture_bonus`: 49 (increased from 35)
- `center_lane_bonus`: 4 (increased from 2)

**Performance:** The evolved parameters achieve a 61% win rate against the default parameters, representing a significant improvement in AI strength.

The evaluation function assesses the strategic value of a board state based on these optimized weights. Key factors include:

- **Piece Advantage**: Number of pieces on the board vs. the opponent.
- **Piece Advancement**: How far pieces have moved along their track.
- **Rosette Control**: Occupying safe squares that grant extra turns.
- **Threats**: Potential captures on the next turn.

### Search Depth Optimization

The Classic AI is optimized for depth 3 search, which provides the best performance/speed ratio:

- **Production**: Depth 3 search for optimal balance of speed and quality
- **Maximum Strength**: Depth 4 search for strongest play
- **Fast Alternative**: Depth 2 search for instant speed with strong play
- **Testing**: Various depths for performance analysis

This optimization is based on comprehensive testing showing that depth 3 provides excellent strength while maintaining good speed.

## ML AI

The ML AI offers a different kind of challenge, with a playstyle developed from observing thousands of games.

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

The project uses a **pure Rust architecture** with **optimized CPU parallel processing**:

1. **🦀 Rust Data Generation**: Fast parallel game simulation using all CPU cores
2. **⚡ CPU Training**: Efficient neural network training with custom implementation
3. **🍎 Apple Silicon Optimization**: Uses 8 performance cores on M1/M2/M3
4. **📊 Comprehensive Logging**: Detailed progress tracking and performance metrics

See [ML System Overview](./ml-system-overview.md) for complete training guide.

## AI vs. AI Mode

In this mode, the Classic AI (Player 1) plays against the ML AI (Player 2). This provides an opportunity to observe the strategic differences between the two AI systems. The game proceeds automatically, with each AI taking its turn until a winner is decided. Both AIs run locally in the browser via WebAssembly.

## Performance Analysis (July 2025)

Based on comprehensive testing of 450 games across all AI types:

### Classic AI Performance

| AI Type                | Win Rate  | Search Depth | Speed   | Notes                        |
| ---------------------- | --------- | ------------ | ------- | ---------------------------- |
| **Classic AI (EMM-3)** | **75.6%** | 3-ply        | 15.6ms  | **Best overall performance** |
| **Classic AI (EMM-2)** | **51.1%** | 2-ply        | Instant | Strong alternative           |
| **Classic AI (EMM-1)** | **46.7%** | 1-ply        | Instant | Fast baseline                |
| Heuristic AI           | **35.6%** | N/A          | Instant | Educational baseline         |

**Note:** All Classic AI variants now use evolved genetic parameters that provide a 61% win rate improvement over the original default parameters.

### ML AI Performance

| Model             | Win Rate  | Speed  | Status                     |
| ----------------- | --------- | ------ | -------------------------- |
| **ML-Hybrid**     | **60.0%** | 52.1ms | ✅ **Best ML Performance** |
| **ML-PyTorch-V5** | **60.0%** | 54.8ms | ✅ **Best ML Performance** |
| **ML-V4**         | **58.9%** | 50.7ms | ✅ **Strong Performance**  |
| **ML-V2**         | **55.6%** | 53.5ms | ✅ **Good Performance**    |
| **ML-Fast**       | **51.1%** | 58.4ms | ⚠️ **Needs Improvement**   |

### Key Performance Insights

1. **EMM-3 is Optimal**: Provides the best overall performance (75.6% win rate)
2. **ML AI Breakthrough**: ML-Hybrid and ML-PyTorch-V5 both achieve 60% win rates
3. **Speed vs Performance**: EMM-1/2 provide instant speed with good performance
4. **ML AI Competitive**: Top ML models are competitive with classic AI variants
5. **Evolved Parameters**: All classic AI now uses evolved genetic parameters for improved performance

### Speed Analysis

| AI Type       | Average Time | Category  |
| ------------- | ------------ | --------- |
| EMM-Depth1    | 0.0ms        | Very Fast |
| EMM-Depth2    | 0.0ms        | Very Fast |
| Heuristic     | 0.0ms        | Very Fast |
| Random        | 0.0ms        | Very Fast |
| EMM-Depth3    | 15.6ms       | Moderate  |
| ML-V4         | 50.7ms       | Slow      |
| ML-Hybrid     | 52.1ms       | Slow      |
| ML-V2         | 53.5ms       | Slow      |
| ML-PyTorch-V5 | 54.8ms       | Slow      |
| ML-Fast       | 58.4ms       | Slow      |

### Production Recommendations

- **Primary Choice**: EMM-3 (Depth 3) - Best overall performance (75.6% win rate)
- **Fast Alternative**: EMM-1/2 (Depth 1/2) - Instant speed with good performance
- **ML AI Options**: ML-Hybrid or ML-PyTorch-V5 - Competitive performance (60% win rate)
- **Educational**: Heuristic AI - Good for learning game mechanics
- **Baseline**: Random AI - For testing and comparison

## Implementation Details

- **Classic AI Core**: `worker/rust_ai_core/src/lib.rs`
- **WASM Interface**: `worker/rust_ai_core/src/wasm_api.rs`
- **Frontend Integration**: `src/lib/wasm-ai-service.ts`
- **ML AI Service**: `src/lib/ml-ai-service.ts`

## See Also

- [ML System Overview](./ml-system-overview.md) - Machine learning training system
- [Architecture Overview](./architecture-overview.md) - System design and components
- [Game Rules and Strategy](./game-rules-strategy.md) - Game rules and strategic concepts
- [AI Development History](./ai-development-history.md) - Historical experiments and findings
