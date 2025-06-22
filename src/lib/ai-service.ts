import { GameState } from "./types";

// Configuration for health check, not used for main AI logic anymore
const AI_WORKER_URL =
  process.env.NEXT_PUBLIC_AI_WORKER_URL ||
  "https://rgou-ai-worker.rob-gilks.workers.dev";

export interface AIResponse {
  move: number;
  evaluation: number;
  thinking: string;
}

export interface EvaluationResponse {
  evaluation: number;
  status: string;
  currentPlayer: string;
}

export class AIService {
  private static async makeRequest<T>(
    endpoint: string,
    data?: GameState | Record<string, unknown>,
    isProxy = false
  ): Promise<T> {
    const url = isProxy ? endpoint : `${AI_WORKER_URL}${endpoint}`;
    const secret = process.env.AI_WORKER_SECRET; // Only used for health check now

    try {
      const response = await fetch(url, {
        method: data ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          // Auth header is now handled by the proxy for AI moves
          ...(isProxy ? {} : { Authorization: `Bearer ${secret}` }),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`AI Service error for ${endpoint}:`, error);
      throw new Error(`Failed to communicate with AI service: ${error}`);
    }
  }

  static async getAIMove(gameState: GameState): Promise<AIResponse> {
    // Call the local proxy API route
    return this.makeRequest<AIResponse>("/api/ai-move", gameState, true);
  }

  static async evaluatePosition(
    gameState: GameState
  ): Promise<EvaluationResponse> {
    return this.makeRequest<EvaluationResponse>("/evaluate", gameState);
  }

  static async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    version: string;
  }> {
    // Health check still goes directly to the worker
    return this.makeRequest("/health");
  }

  // Fallback AI implementation for when the worker is not available
  static getFallbackAIMove(gameState: GameState): number {
    if (!gameState.canMove || gameState.validMoves.length === 0) {
      return 0;
    }

    // Simple fallback: choose a random valid move
    const randomIndex = Math.floor(Math.random() * gameState.validMoves.length);
    return gameState.validMoves[randomIndex];
  }
}
