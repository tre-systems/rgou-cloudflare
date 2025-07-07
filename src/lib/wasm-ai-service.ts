import { GameState } from "./types";
import { AIResponse } from "./ai-service";

type Wasm = typeof import("./wasm/rgou_ai_worker");

class WasmAIService {
  private wasm: Wasm | null = null;

  private async loadWasm(): Promise<Wasm> {
    if (this.wasm) {
      return this.wasm;
    }
    const wasm = await import("./wasm/rgou_ai_worker");
    await wasm.default({
      locateFile: (file: string) => `/wasm/${file}`,
    });
    this.wasm = wasm;
    return wasm;
  }

  async getAIMove(gameState: GameState): Promise<AIResponse> {
    const { get_ai_move_wasm } = await this.loadWasm();

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

    const responseJson = get_ai_move_wasm(JSON.stringify(requestBody));
    return JSON.parse(responseJson) as AIResponse;
  }

  async rollDice(): Promise<number> {
    const { roll_dice_wasm } = await this.loadWasm();
    return roll_dice_wasm();
  }
}

export const wasmAiService = new WasmAIService();
