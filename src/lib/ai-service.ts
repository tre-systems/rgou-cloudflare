import { GameState } from "./types";
import { AIResponse, MoveEvaluation, Diagnostics, Timings } from "./ai-types";

// Direct endpoint to the production AI service
const AI_WORKER_URL = "https://rgou-minmax.tre.systems";

export type { AIResponse, MoveEvaluation, Diagnostics, Timings };

export interface EvaluationResponse {
  evaluation: number;
  status: string;
  currentPlayer: string;
}

export class AIService {
  private static async makeRequest<T>(
    endpoint: string,
    data?: GameState | Record<string, unknown>,
  ): Promise<T> {
    const url = `${AI_WORKER_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        method: data ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
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
    const requestBody = {
      player1Pieces: gameState.player1Pieces.map((p) => ({
        square: p.square,
      })),
      player2Pieces: gameState.player2Pieces.map((p) => ({
        square: p.square,
      })),
      currentPlayer:
        gameState.currentPlayer === "player1" ? "Player1" : "Player2",
      diceRoll: gameState.diceRoll,
    };
    return this.makeRequest<AIResponse>("/ai-move", requestBody);
  }

  static async evaluatePosition(
    gameState: GameState,
  ): Promise<EvaluationResponse> {
    const requestBody = {
      player1Pieces: gameState.player1Pieces.map((p) => ({
        square: p.square,
      })),
      player2Pieces: gameState.player2Pieces.map((p) => ({
        square: p.square,
      })),
      currentPlayer:
        gameState.currentPlayer === "player1" ? "Player1" : "Player2",
      diceRoll: gameState.diceRoll,
    };
    return this.makeRequest<EvaluationResponse>("/evaluate", requestBody);
  }

  static async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    version: string;
  }> {
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
