import { GameState } from "./types";
import { AIResponse } from "./ai-types";

type Wasm = typeof import("./wasm/rgou_ai_worker");

class WasmAIService {
  private wasm: Wasm | null = null;

  private async loadWasm(): Promise<Wasm> {
    if (this.wasm) {
      return this.wasm;
    }
    const wasm = await import("./wasm/rgou_ai_worker");
    this.wasm = wasm;
    return wasm;
  }

  async getAIMove(gameState: GameState): Promise<AIResponse> {
    const { get_ai_move_wasm } = await this.loadWasm();

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

    return get_ai_move_wasm(requestBody) as AIResponse;
  }

  async rollDice(): Promise<number> {
    const { roll_dice_wasm } = await this.loadWasm();
    return roll_dice_wasm();
  }
}

export const wasmAiService = new WasmAIService();
