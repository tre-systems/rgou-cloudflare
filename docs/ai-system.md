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

See the [ML AI System Documentation](./ml-ai-system.md) for a detailed breakdown of its architecture, training process, and performance.

## AI vs. AI Mode

In this mode, the Classic AI (Player 1) plays against the ML AI (Player 2). This provides an opportunity to observe the strategic differences between the two AI systems. The game proceeds automatically, with each AI taking its turn until a winner is decided. Both AIs run locally in the browser via WebAssembly.

## Performance (January 2025)

Based on comprehensive testing of 1,250 games across all AI types:

| AI Type                | Win Rate  | Search Depth | Speed     | Notes                          |
| ---------------------- | --------- | ------------ | --------- | ------------------------------ |
| **Classic AI (EMM-4)** | **75.0%** | 4-ply        | 370ms     | **Maximum strength**           |
| **Classic AI (EMM-3)** | **70.0%** | 3-ply        | 15ms      | **Optimal - Best balance**     |
| Classic AI (EMM-2)     | 98.0%     | 2-ply        | Instant   | Strong alternative             |
| ML AI                  | 49.0%     | N/A          | <1ms/move | Neural network evaluation only |
| Heuristic AI           | 40.0%     | N/A          | Instant   | Educational baseline           |
| Random AI              | 50.0%     | N/A          | Instant   | Baseline for comparison        |

### Key Performance Insights

1. **Depth 3 is Optimal**: Provides the best performance/speed ratio for this game
2. **Depth Matters Significantly**: Each depth level provides substantial improvement
3. **ML AI is Competitive**: 49% win rate vs EMM-3 shows good training
4. **Heuristic is Weak**: Only 40% vs EMM-1, suitable for education only

### Production Recommendations

- **Primary Choice**: EMM-3 (Depth 3) - Best balance of strength and speed
- **Maximum Strength**: EMM-4 (Depth 4) - Highest win rate but slower
- **Fast Alternative**: EMM-2 (Depth 2) - Instant speed with strong play
- **Alternative Playstyle**: ML AI - Different strategic approach
- **Educational**: Heuristic AI - Good for learning game mechanics

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
