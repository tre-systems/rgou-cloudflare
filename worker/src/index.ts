/// <reference types="@cloudflare/workers-types" />

export interface Env {
  // Environment variables can be defined here
}

// Add ExecutionContext type for Cloudflare Workers
declare global {
  interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
  }
}

// Interface matching the TypeScript game types
interface GameState {
  board: (PiecePosition | null)[];
  player1Pieces: PiecePosition[];
  player2Pieces: PiecePosition[];
  currentPlayer: "player1" | "player2";
  gameStatus: "waiting" | "playing" | "finished";
  winner: "player1" | "player2" | null;
  diceRoll: number | null;
  canMove: boolean;
  validMoves: number[];
}

interface PiecePosition {
  square: number;
  player: "player1" | "player2";
}

// Simple AI implementation for now (will be enhanced with Zig WebAssembly later)
function evaluateGameState(gameState: GameState): number {
  let score = 0;

  // Count finished pieces
  const p1Finished = gameState.player1Pieces.filter(
    (p) => p.square === 20
  ).length;
  const p2Finished = gameState.player2Pieces.filter(
    (p) => p.square === 20
  ).length;

  // Heavily weight finished pieces
  score += (p2Finished - p1Finished) * 1000;

  // Win condition
  if (p1Finished === 7) return -10000;
  if (p2Finished === 7) return 10000;

  // Evaluate piece positions
  let p1PositionScore = 0;
  let p2PositionScore = 0;

  const PLAYER1_TRACK = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const PLAYER2_TRACK = [
    16, 17, 18, 19, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  ];

  gameState.player1Pieces.forEach((piece) => {
    if (piece.square >= 0 && piece.square < 20) {
      const trackIndex = PLAYER1_TRACK.indexOf(piece.square);
      if (trackIndex >= 0) {
        p1PositionScore += trackIndex + 1;
      }
    }
  });

  gameState.player2Pieces.forEach((piece) => {
    if (piece.square >= 0 && piece.square < 20) {
      const trackIndex = PLAYER2_TRACK.indexOf(piece.square);
      if (trackIndex >= 0) {
        p2PositionScore += trackIndex + 1;
      }
    }
  });

  score += (p2PositionScore - p1PositionScore) * 10;

  return score;
}

function getAIMove(gameState: GameState): number {
  if (!gameState.canMove || gameState.validMoves.length === 0) {
    return 0;
  }

  // Simple strategy for now - could be enhanced with more sophisticated logic
  if (gameState.validMoves.length === 1) {
    return gameState.validMoves[0];
  }

  // Prefer moves that advance pieces further
  let bestMove = gameState.validMoves[0];
  let bestScore = -Infinity;

  for (const move of gameState.validMoves) {
    const piece = gameState.player2Pieces[move];
    let score = 0;

    // Prefer finishing pieces
    if (piece.square >= 12) {
      score += 100;
    }

    // Prefer advancing pieces
    score += piece.square + 1;

    // Add some randomness to make the AI less predictable
    score += Math.random() * 10;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // AI move endpoint
    if (url.pathname === "/ai-move" && request.method === "POST") {
      try {
        const gameState: GameState = await request.json();

        // Validate that it's AI's turn
        if (gameState.currentPlayer !== "player2") {
          return new Response(JSON.stringify({ error: "Not AI turn" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        const aiMove = getAIMove(gameState);
        const evaluation = evaluateGameState(gameState);

        return new Response(
          JSON.stringify({
            move: aiMove,
            evaluation: evaluation,
            thinking: `Considering ${gameState.validMoves.length} possible moves...`,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      } catch (error) {
        return new Response(JSON.stringify({ error: "Invalid request body" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Game evaluation endpoint
    if (url.pathname === "/evaluate" && request.method === "POST") {
      try {
        const gameState: GameState = await request.json();
        const evaluation = evaluateGameState(gameState);

        return new Response(
          JSON.stringify({
            evaluation: evaluation,
            status: gameState.gameStatus,
            currentPlayer: gameState.currentPlayer,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      } catch (error) {
        return new Response(JSON.stringify({ error: "Invalid request body" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    // Default response for root or unknown paths
    return new Response(
      JSON.stringify({
        name: "Royal Game of Ur AI Worker",
        version: "1.0.0",
        endpoints: {
          "/ai-move": "POST - Get AI move for current game state",
          "/evaluate": "POST - Evaluate game position",
          "/health": "GET - Health check",
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  },
};
