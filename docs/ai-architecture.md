# AI Architecture Documentation

## Overview

The Royal Game of Ur features a unique dual AI architecture that provides both high-performance server-side AI and fast client-side AI. This allows users to choose between the strongest possible AI moves (server) and instant responses with offline capability (client).

## Core AI Implementation

The AI logic is implemented in Rust in the `worker/rust_ai_core` crate and shared between both server and client implementations.

### Key Components

1. **Game State Representation**: Efficiently represents the board state, piece positions, and game rules
2. **Move Generation**: Generates all valid moves for a given game state
3. **Position Evaluation**: Evaluates board positions using strategic heuristics
4. **Minimax Search**: Implements expectiminimax with alpha-beta pruning
5. **Transposition Table**: Caches evaluated positions to avoid redundant calculations

### Search Algorithm

The AI uses expectiminimax algorithm with:

- **Alpha-beta pruning**: Eliminates branches that cannot affect the final result
- **Transposition table**: Stores previously evaluated positions with their scores
- **Quiescence search**: Extends search at leaf nodes to avoid horizon effects
- **Iterative deepening**: Searches progressively deeper to improve move ordering

## Server AI (Cloudflare Worker)

### Architecture

- **Platform**: Cloudflare Workers
- **Language**: Rust
- **Search Depth**: 4 levels (configurable)
- **Endpoint**: `/ai-move`

### Features

- High-performance computation with no time limits
- Deep search for strongest possible moves
- Comprehensive move evaluation and diagnostics
- Optimized for tournament-level play

### API Interface

```rust
pub async fn handle_ai_move(
    req: Request,
    start_time: f64,
    env: &Env
) -> Result<Response>
```

### Response Format

```json
{
  "move": 2,
  "evaluation": 150,
  "thinking": "AI (depth 4) chose move 2 with score 45.2...",
  "timings": {
    "aiMoveCalculation": 125,
    "totalHandlerTime": 135
  },
  "diagnostics": {
    "searchDepth": 4,
    "validMoves": [0, 1, 2],
    "moveEvaluations": [...],
    "transpositionHits": 1250,
    "nodesEvaluated": 8934
  }
}
```

## Client AI (WebAssembly)

### Architecture

- **Platform**: Browser (WebAssembly)
- **Language**: Rust compiled to WASM
- **Search Depth**: 6 levels (higher than server due to focused search)
- **Loading**: Dynamic import from `/wasm/rgou_ai_core.js`

### Features

- Offline gameplay capability
- Instant response times
- Same core AI logic as server
- Integrated with PWA for complete offline experience

### WebAssembly Interface

```rust
#[wasm_bindgen]
pub fn get_ai_move_wasm(game_state_request_js: JsValue) -> Result<JsValue, JsValue>
```

### Client Service Implementation

```typescript
class WasmAiService {
  async getAIMove(gameState: GameState): Promise<AIResponse>;
  async rollDice(): Promise<number>;
  async isAvailable(): Promise<boolean>;
}
```

## AI Strength Comparison

### Server AI

- **Strength**: Maximum (tournament level)
- **Search Depth**: 4 levels
- **Response Time**: 100-300ms
- **Availability**: Requires internet connection
- **Use Case**: Competitive play, learning optimal strategies

### Client AI

- **Strength**: High (casual to intermediate)
- **Search Depth**: 6 levels
- **Response Time**: 10-50ms
- **Availability**: Always available (offline)
- **Use Case**: Quick games, offline play, mobile optimization

## Performance Optimizations

### Shared Optimizations

1. **Bitboard Representation**: Efficient board state storage
2. **Move Ordering**: Prioritizes promising moves first
3. **Transposition Tables**: Avoids re-evaluating identical positions
4. **Pruning**: Alpha-beta pruning eliminates unnecessary branches

### Server-Specific Optimizations

1. **Memory Management**: Optimized for V8 isolates
2. **Response Caching**: Prevents redundant calculations
3. **Logging Optimization**: Minimal logging in production

### Client-Specific Optimizations

1. **WASM Bundle Size**: Minimized binary size
2. **Memory Usage**: Efficient memory management for mobile devices
3. **Lazy Loading**: AI loads only when needed

## Development and Build Process

### Building WebAssembly

```bash
cd worker/rust_ai_core
wasm-pack build --target web --features wasm
```

### Copying WASM Files

```bash
cp worker/rust_ai_core/pkg/rgou_ai_core.js public/wasm/
cp worker/rust_ai_core/pkg/rgou_ai_core_bg.wasm public/wasm/
```

### Testing

Both implementations share the same test suite:

```bash
cd worker/rust_ai_core
cargo test
```

## Future Improvements

### Potential Enhancements

1. **Adaptive Depth**: Adjust search depth based on game complexity
2. **Opening Book**: Pre-computed optimal opening moves
3. **Endgame Tablebase**: Perfect play in endgame positions
4. **Neural Network**: Hybrid approach combining search with learned evaluation

### Performance Monitoring

- Track response times and search statistics
- Monitor WASM loading performance
- Analyze move quality between server and client AIs

## Conclusion

The dual AI architecture provides the best of both worlds: maximum strength when connectivity allows, and instant responsive gameplay when offline. This ensures the Royal Game of Ur is playable anywhere, anytime, while maintaining high-quality AI opponents.
