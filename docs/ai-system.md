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

## ML AI

The ML AI offers a different kind of challenge, with a playstyle developed from observing thousands of games.

See the [ML AI System Documentation](./ml-ai-system.md) for a detailed breakdown of its architecture, training process, and performance.

## AI vs. AI Mode

In this mode, the Classic AI (Player 1) plays against the ML AI (Player 2). This provides an opportunity to observe the strategic differences between the two AI systems. The game proceeds automatically, with each AI taking its turn until a winner is decided. Both AIs run locally in the browser via WebAssembly.

## Performance (July 2025)

Based on comprehensive testing of 1,250 games across all AI types:

| AI Type                | Win Rate  | Search Depth | Speed       | Notes                                  |
| ---------------------- | --------- | ------------ | ----------- | -------------------------------------- |
| **Classic AI (EMM-3)** | **81.2%** | 3-ply        | 14.1ms/move | **Optimal - Best overall performance** |
| Classic AI (EMM-2)     | 66.4%     | 2-ply        | 0.0ms/move  | Strong alternative                     |
| ML AI                  | 61.2%     | N/A          | 58.0ms/move | Neural network evaluation only         |
| Classic AI (EMM-1)     | 52.0%     | 1-ply        | 0.0ms/move  | Fast baseline                          |
| Heuristic AI           | 34.8%     | N/A          | 0.0ms/move  | Educational baseline                   |
| Random AI              | 4.4%      | N/A          | 0.0ms/move  | Baseline for comparison                |

### Search Depth Optimization

The Classic AI uses depth 3 search for optimal performance:

- **Main Game (Browser)**: 3-ply search for optimal balance of speed and quality
- **Server/Worker**: 3-ply search for best response times
- **Testing**: 3-ply search for comprehensive validation

This optimization provides the best performance/speed ratio based on comprehensive testing. The Classic AI achieves an 81.2% win rate with moderate speed (14.1ms/move), making it the optimal choice for production use.

**Key Findings:**

- **EMM-3 (Depth 3)**: 81.2% win rate - Best overall performance
- **EMM-2 (Depth 2)**: 66.4% win rate - Strong alternative
- **EMM-1 (Depth 1)**: 52.0% win rate - Fast baseline
- **Heuristic AI**: 34.8% win rate - Educational baseline

## Implementation Details

- **Classic AI Core**: `worker/rust_ai_core/src/lib.rs`
- **WASM Interface**: `worker/rust_ai_core/src/wasm_api.rs`
- **Frontend Integration**: `src/lib/wasm-ai-service.ts`
- **ML AI Service**: `src/lib/ml-ai-service.ts`

## See Also

- [ML AI System](./ml-ai-system.md)
- [Architecture Overview](./architecture-overview.md)
- [Game Rules and Strategy](./game-rules-strategy.md)
