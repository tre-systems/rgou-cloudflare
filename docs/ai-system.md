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

The evaluation function is hand-crafted to assess the strategic value of a board state. Key factors include:

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

See [Training System](./training-system.md) for complete training guide.

## AI vs. AI Mode

In this mode, the Classic AI (Player 1) plays against the ML AI (Player 2). This provides an opportunity to observe the strategic differences between the two AI systems. The game proceeds automatically, with each AI taking its turn until a winner is decided. Both AIs run locally in the browser via WebAssembly.

## Performance Analysis (July 2025)

Based on comprehensive testing of 1,250 games across all AI types:

### Classic AI Performance

| AI Type                | Win Rate  | Search Depth | Speed   | Notes                      |
| ---------------------- | --------- | ------------ | ------- | -------------------------- |
| **Classic AI (EMM-4)** | **75.0%** | 4-ply        | 370ms   | **Maximum strength**       |
| **Classic AI (EMM-3)** | **70.0%** | 3-ply        | 15ms    | **Optimal - Best balance** |
| Classic AI (EMM-2)     | 98.0%     | 2-ply        | Instant | Strong alternative         |
| Heuristic AI           | 40.0%     | N/A          | Instant | Educational baseline       |
| Random AI              | 50.0%     | N/A          | Instant | Baseline for comparison    |

### ML AI Models Performance

| Model      | Win Rate vs EMM-3 | Losses | Avg Moves | Speed | First/Second | Status               |
| ---------- | ----------------- | ------ | --------- | ----- | ------------ | -------------------- |
| **v2**     | **44%**           | 56%    | 152.3     | 0.7ms | 23/21        | ✅ **Best**          |
| **Fast**   | 36%               | 64%    | 172.1     | 0.7ms | 11/25        | Competitive          |
| **v4**     | 32%               | 68%    | 147.9     | 0.7ms | 15/17        | ⚠️ Needs Improvement |
| **Hybrid** | 30%               | 70%    | 173.7     | 0.7ms | 9/21         | ⚠️ Needs Improvement |

### Key Performance Insights

1. **Depth 3 is Optimal**: Provides the best performance/speed ratio for this game
2. **Depth Matters Significantly**: Each depth level provides substantial improvement
3. **ML AI is Competitive**: v2 model shows 44% win rate vs EMM-3
4. **Training Regression**: Newer models (v4, hybrid) perform worse than v2 despite more training data

### Speed Analysis

| AI Type            | Average Time | Relative Speed |
| ------------------ | ------------ | -------------- |
| Expectiminimax     | 0.2ms        | 1x (baseline)  |
| ML AI (all models) | 0.7ms        | 3.5x slower    |

### Production Recommendations

- **Primary Choice**: EMM-3 (Depth 3) - Best balance of strength and speed
- **Maximum Strength**: EMM-4 (Depth 4) - Highest win rate but slower
- **Fast Alternative**: EMM-2 (Depth 2) - Instant speed with strong play
- **Alternative Playstyle**: ML AI v2 - Different strategic approach
- **Educational**: Heuristic AI - Good for learning game mechanics

## Implementation Details

- **Classic AI Core**: `worker/rust_ai_core/src/lib.rs`
- **WASM Interface**: `worker/rust_ai_core/src/wasm_api.rs`
- **Frontend Integration**: `src/lib/wasm-ai-service.ts`
- **ML AI Service**: `src/lib/ml-ai-service.ts`

## See Also

- [Training System](./training-system.md) - Machine learning training system
- [Architecture Overview](./architecture-overview.md) - System design and components
- [Game Rules and Strategy](./game-rules-strategy.md) - Game rules and strategic concepts
- [AI Development History](./ai-development-history.md) - Historical experiments and findings
