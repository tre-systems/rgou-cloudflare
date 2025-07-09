# API Reference

## AI Worker API

### Endpoints

#### POST /ai-move

Calculates the best move for the AI player using the minimax algorithm with alpha-beta pruning.

**Request Body:**

```json
{
  "player1Pieces": [{"square": -1}, {"square": -1}, ...],
  "player2Pieces": [{"square": -1}, {"square": -1}, ...],
  "currentPlayer": "Player1" | "Player2",
  "diceRoll": 1 | 2 | 3 | 4
}
```

**Response:**

```json
{
  "move": 0, // piece index to move
  "evaluation": -27,
  "thinking": "AI (depth 4) chose move Some(1) with score -27.7...",
  "timings": {
    "aiMoveCalculation": 12,
    "totalHandlerTime": 15
  },
  "diagnostics": {
    "searchDepth": 4,
    "validMoves": [0, 1, 2, 3, 4, 5, 6],
    "moveEvaluations": [...],
    "transpositionHits": 1112,
    "nodesEvaluated": 2013
  }
}
```

#### GET /health

Returns the health status of the worker.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T12:00:00Z",
  "version": "2.0.0-pure-rust"
}
```

## Logging System

The AI worker uses an optimized logging system designed to be informative while minimizing costs on Cloudflare Workers.

### Log Levels

**Production Mode (ENVIRONMENT=production):**

- Minimal, structured logging
- Key performance metrics only
- No verbose data dumps

**Development Mode (ENVIRONMENT≠production):**

- Additional debugging information
- Move evaluation details
- Game state insights

### Log Format

**Request Logging:**

```
[Worker] POST /ai-move
[AI] Player: Player2, Dice: 1, P1 pieces: 1, P2 pieces: 0
[AI] Response: move=Some(1), eval=-39, time=1ms, nodes=2013, cache_hits=1112
```

**Development Mode Additional Logs:**

```
[AI] Dev mode: Game state converted, current player: Player2
[AI] Dev mode: Top 3 move evaluations:
  1: piece=1, score=-27.7, type=move
  2: piece=2, score=-27.7, type=move
  3: piece=3, score=-27.7, type=move
```

### Cost Optimization

The logging system is designed to minimize Cloudflare Workers costs by:

- Avoiding verbose data structure dumps
- Using structured, concise log messages
- Environment-based log levels
- Focusing on actionable debugging information

### Monitoring

Key metrics logged for monitoring:

- Request timing and throughput
- AI calculation performance
- Cache hit rates
- Node evaluation counts
- Move selection efficiency
