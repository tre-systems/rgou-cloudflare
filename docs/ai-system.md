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

The Classic AI is optimized for depth 1 search, which provides the best performance/speed ratio:

- **Production**: Depth 1 search for optimal balance of speed and quality
- **Alternative**: Depth 2 search for slightly stronger play
- **Testing**: Various depths for performance analysis

This optimization is based on comprehensive testing showing that tactical evaluation is more important than deep search for this game.

## ML AI

The ML AI offers a different kind of challenge, with a playstyle developed from observing thousands of games.

See the [ML AI System Documentation](./ml-ai-system.md) for a detailed breakdown of its architecture, training process, and performance.

## AI vs. AI Mode

In this mode, the Classic AI (Player 1) plays against the ML AI (Player 2). This provides an opportunity to observe the strategic differences between the two AI systems. The game proceeds automatically, with each AI taking its turn until a winner is decided. Both AIs run locally in the browser via WebAssembly.

## Performance (July 2025)

Based on comprehensive testing of 1,250 games across all AI types:

| AI Type                | Win Rate  | Search Depth | Speed     | Notes                                  |
| ---------------------- | --------- | ------------ | --------- | -------------------------------------- |
| **Classic AI (EMM-1)** | **53.6%** | 1-ply        | Instant   | **Optimal - Best overall performance** |
| Classic AI (EMM-2)     | 53.2%     | 2-ply        | Instant   | Strong alternative                     |
| Heuristic AI           | 50.8%     | N/A          | Instant   | Educational baseline                   |
| ML AI                  | 50.0%     | N/A          | <1ms/move | Neural network evaluation only         |
| Random AI              | 48.0%     | N/A          | Instant   | Baseline for comparison                |

### Key Performance Insights

1. **Depth 1 is Optimal**: Provides the best performance/speed ratio for this game
2. **Tactical Evaluation > Deep Search**: The game favors immediate position evaluation
3. **High Luck Component**: Random AI achieves 48% vs expectiminimax, indicating significant randomness
4. **ML AI is Competitive**: 50% win rate vs Classic AI shows good training

### Production Recommendations

- **Primary Choice**: EMM-1 (Depth 1) - Best win rate with instant speed
- **Alternative**: EMM-2 (Depth 2) - Very good performance with instant speed
- **Educational**: Heuristic AI - Competitive performance for learning
- **Research**: ML AI - Alternative playstyle for experimentation

## Implementation Details

- **Classic AI Core**: `worker/rust_ai_core/src/lib.rs`
- **WASM Interface**: `worker/rust_ai_core/src/wasm_api.rs`
- **Frontend Integration**: `src/lib/wasm-ai-service.ts`
- **ML AI Service**: `src/lib/ml-ai-service.ts`

## See Also

- [ML AI System](./ml-ai-system.md)
- [Architecture Overview](./architecture-overview.md)
- [Game Rules and Strategy](./game-rules-strategy.md)
- [AI Development History](./ai-development-history.md) - Historical experiments and findings
