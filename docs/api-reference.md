# API Reference

The AI Worker exposes the following endpoints.

## POST /ai-move

Get the best move for the current game state.

**Request:**

```json
{
  "player1Pieces": [{"square": -1}, {"square": 4}, ...],
  "player2Pieces": [{"square": 12}, {"square": -1}, ...],
  "currentPlayer": "player2",
  "diceRoll": 3
}
```

**Response:**

```json
{
  "move": {
    "pieceIndex": 2,
    "newSquare": 15
  },
  "evaluation": 150,
  "thinking": "Moving piece from square 12 to 15, which is a safe rosette square.",
  "timings": {
    "aiMoveCalculation": 45,
    "totalHandlerTime": 52
  },
  "diagnostics": {
    "searchDepth": 8,
    "validMoves": [
      { "pieceIndex": 1, "newSquare": 7 },
      { "pieceIndex": 2, "newSquare": 15 }
    ],
    "moveEvaluations": [
      { "move": { "pieceIndex": 1, "newSquare": 7 }, "score": 120 },
      { "move": { "pieceIndex": 2, "newSquare": 15 }, "score": 150 }
    ],
    "transpositionHits": 234,
    "nodesEvaluated": 1245,
    "gamePhase": "Middlegame",
    "boardControl": 25
  }
}
```

## GET /health

Health check endpoint for monitoring the AI worker.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```
