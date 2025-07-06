import { GameState } from "./types";

// Direct endpoint to the production AI service
const AI_WORKER_URL = "https://rgou-minmax.tre.systems";

export interface MoveEvaluation {
  pieceIndex: number;
  score: number;
  moveType: string;
  fromSquare: number;
  toSquare: number | null;
}

export interface PiecePositions {
  player1OnBoard: number;
  player1Finished: number;
  player2OnBoard: number;
  player2Finished: number;
}

export interface Diagnostics {
  searchDepth: number;
  validMoves: number[];
  moveEvaluations: MoveEvaluation[];
  transpositionHits: number;
  nodesEvaluated: number;
  gamePhase: string;
  boardControl: number;
  piecePositions: PiecePositions;
}

export interface Timings {
  aiMoveCalculation: number;
  totalHandlerTime: number;
}

export interface AIResponse {
  move: number;
  evaluation: number;
  thinking: string;
  timings: Timings;
  diagnostics: Diagnostics;
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
      player1_pieces: gameState.player1Pieces.map((p) => ({
        square: p.square,
      })),
      player2_pieces: gameState.player2Pieces.map((p) => ({
        square: p.square,
      })),
      current_player:
        gameState.currentPlayer === "player1" ? "Player1" : "Player2",
      dice_roll: gameState.diceRoll,
    };
    return this.makeRequest<AIResponse>("/ai-move", requestBody);
  }

  static async evaluatePosition(
    gameState: GameState,
  ): Promise<EvaluationResponse> {
    const requestBody = {
      player1_pieces: gameState.player1Pieces.map((p) => ({
        square: p.square,
      })),
      player2_pieces: gameState.player2Pieces.map((p) => ({
        square: p.square,
      })),
      current_player:
        gameState.currentPlayer === "player1" ? "Player1" : "Player2",
      dice_roll: gameState.diceRoll,
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
