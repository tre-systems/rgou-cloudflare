/// <reference types="@cloudflare/workers-types" />
import { initializeWasm, ZigAI } from "./ai-wasm";

export interface Env {
  // Environment variables can be defined here
  API_SECRET: string;
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

let wasmReady = initializeWasm();

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    console.log(`[Worker] Received request: ${request.method} ${request.url}`);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Check for API secret on other requests
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${env.API_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // AI move endpoint
    if (url.pathname === "/ai-move" && request.method === "POST") {
      const handlerStart = Date.now();
      try {
        const wasmReadyStart = Date.now();
        const wasm = await wasmReady;
        const wasmReadyEnd = Date.now();

        const gameState: GameState = await request.json();

        if (gameState.currentPlayer !== "player2") {
          return new Response(JSON.stringify({ error: "Not AI turn" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        const aiSetupStart = Date.now();
        const zigAI = new ZigAI(wasm);
        zigAI.updateGameState(gameState);
        const aiSetupEnd = Date.now();

        const aiMoveStart = Date.now();
        const aiMove = zigAI.getAIMove();
        const aiMoveEnd = Date.now();

        zigAI.destroy();
        const handlerEnd = Date.now();

        const timings = {
          wasmInitialization: wasmReadyEnd - wasmReadyStart,
          aiSetup: aiSetupEnd - aiSetupStart,
          aiMoveCalculation: aiMoveEnd - aiMoveStart,
          totalHandlerTime: handlerEnd - handlerStart,
        };

        console.log(`[Worker] Timings: ${JSON.stringify(timings)}`);

        return new Response(
          JSON.stringify({
            move: aiMove,
            evaluation: 0, // evaluation not implemented yet in this path
            thinking: `Zig WASM AI has decided.`,
            timings: timings,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      } catch (error: any) {
        console.error("[Worker] Error getting AI move:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to get AI move",
            message: error.message,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "1.1.0-wasm",
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

    // Fallback for other routes
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  },
};
