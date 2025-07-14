# AI System Documentation

See also: [ML AI System (Neural Network)](./ml-ai-system.md)

## Overview

The Royal Game of Ur features a dual-AI engine built in Rust, providing both server-side and client-side gameplay. The AI uses advanced game theory algorithms for challenging, fast gameplay.

## Core AI Architecture

### Dual-AI System

- **Client AI (Default)**: Rust compiled to WebAssembly, runs in browser (6-ply, strong, offline)
- **Server AI (Fallback)**: Rust on Cloudflare Workers (4-ply, fast, network-based)
- **ML AI (Experimental)**: See [ML AI System](./ml-ai-system.md)

Both AIs share the same Rust core (`worker/rust_ai_core/src/lib.rs`).

## AI Algorithm: Expectiminimax

The AI uses the expectiminimax algorithm, an extension of minimax for games with chance (dice rolls).

### Algorithm

- **Minimax**: For non-chance states
- **Expectation nodes**: For dice rolls
- **Alpha-beta pruning**: For optimization

#### Formula

```
EMM(node) = {
  max(EMM(child)) if max node
  min(EMM(child)) if min node
  Σ P(child) × EMM(child) if chance node
  evaluation(node) if leaf
}
```

#### Dice Probabilities

| Roll | Probability |
| ---- | ----------- |
| 0    | 1/16        |
| 1    | 4/16        |
| 2    | 6/16        |
| 3    | 4/16        |
| 4    | 1/16        |

## Position Evaluation

The AI evaluates positions using:

- Win detection
- Finished pieces
- Board control
- Position weight
- Safety (rosettes)
- Advancement
- Center lane bonus

## Search Optimization

- **Alpha-beta pruning**: Reduces search space
- **Transposition table**: Caches evaluated positions
- **Quiescence search**: Extends tactical sequences at leaf nodes

## Performance

| AI Type   | Search Depth | Nodes Evaluated | Response Time |
| --------- | ------------ | --------------- | ------------- |
| Client AI | 6 plies      | ~10k-50k        | <100ms        |
| Server AI | 4 plies      | ~1k-10k         | <50ms         |

## References

- [Wikipedia: Royal Game of Ur](https://en.wikipedia.org/wiki/Royal_Game_of_Ur) – Overview of the ancient board game's history and mechanics.
- [Expectiminimax Algorithm Explained](https://en.wikipedia.org/wiki/Backgammon#Computer_play) – Core algorithm used for decision-making under uncertainty in games with chance elements.
- [Strongly Solving the Royal Game of Ur](https://royalur.net/articles/solving/) – In-depth article explaining how AI researchers computed optimal play.
- Russell & Norvig, "Artificial Intelligence: A Modern Approach" – Comprehensive AI textbook covering game theory and search algorithms.

## Implementation

- **Rust core**: `worker/rust_ai_core/src/lib.rs`
- **WASM interface**: `worker/rust_ai_core/src/wasm_api.rs`
- **Frontend integration**: `src/lib/wasm-ai-service.ts`

## See Also

- [ML AI System](./ml-ai-system.md)
- [Architecture Overview](./architecture-overview.md)
