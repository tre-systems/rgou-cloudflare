import { GameState } from './types';
import { AIResponse } from './ai-types';

type WasmModule = {
  get_ai_move_wasm: (gameStateJson: string) => string;
  roll_dice_wasm: () => number;
};

class WasmAiService {
  private wasmModule: WasmModule | null = null;
  private initPromise: Promise<void> | null = null;

  private async loadWasm(): Promise<void> {
    if (this.wasmModule) return;

    try {
      const wasmResponse = await fetch('/wasm/rgou_ai_core_bg.wasm');
      const wasmBytes = await wasmResponse.arrayBuffer();

      const jsResponse = await fetch('/wasm/rgou_ai_core.js');
      let jsCode = await jsResponse.text();

      jsCode = jsCode
        .replace(/import\.meta\.url/g, 'location.href')
        .replace(/export\s+function\s+(\w+)/g, 'function $1')
        .replace(/export\s+\{[^}]+\};?/g, '')
        .replace(/export\s+default\s+__wbg_init;/g, '');

      const createWasmModule = new Function(
        jsCode +
          `
        return {
          get_ai_move_wasm,
          roll_dice_wasm,
          initSync
        };
        `
      );

      const wasmModule = createWasmModule();

      wasmModule.initSync({ module: wasmBytes });

      this.wasmModule = {
        get_ai_move_wasm: wasmModule.get_ai_move_wasm,
        roll_dice_wasm: wasmModule.roll_dice_wasm,
      };
    } catch (error) {
      console.error('Failed to load WebAssembly module:', error);
      throw new Error('WebAssembly module failed to load');
    }
  }

  private async ensureWasmLoaded(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.loadWasm();
    }
    return this.initPromise;
  }

  private transformGameStateToRequest(gameState: GameState): {
    player1Pieces: { square: number }[];
    player2Pieces: { square: number }[];
    currentPlayer: string;
    diceRoll: number | null;
  } {
    return {
      player1Pieces: gameState.player1Pieces.map(p => ({
        square: p.square,
      })),
      player2Pieces: gameState.player2Pieces.map(p => ({
        square: p.square,
      })),
      currentPlayer: gameState.currentPlayer === 'player1' ? 'Player1' : 'Player2',
      diceRoll: gameState.diceRoll,
    };
  }

  private transformWasmResponse(wasmResponse: string): AIResponse {
    const parsed = JSON.parse(wasmResponse);

    return {
      move: parsed.move,
      evaluation: parsed.evaluation,
      thinking: parsed.thinking,
      timings: {
        aiMoveCalculation: parsed.timings.aiMoveCalculation,
        totalHandlerTime: parsed.timings.totalHandlerTime,
      },
      diagnostics: {
        searchDepth: parsed.diagnostics.searchDepth,
        validMoves: parsed.diagnostics.validMoves,
        moveEvaluations: parsed.diagnostics.moveEvaluations.map(
          (evaluation: {
            pieceIndex: number;
            score: number;
            moveType: string;
            fromSquare: number;
            toSquare: number | null;
          }) => ({
            pieceIndex: evaluation.pieceIndex,
            score: evaluation.score,
            moveType: evaluation.moveType,
            fromSquare: evaluation.fromSquare,
            toSquare: evaluation.toSquare,
          })
        ),
        transpositionHits: parsed.diagnostics.transpositionHits,
        nodesEvaluated: parsed.diagnostics.nodesEvaluated,
      },
    };
  }

  async getAIMove(gameState: GameState): Promise<AIResponse> {
    await this.ensureWasmLoaded();

    if (!this.wasmModule) {
      throw new Error('WebAssembly module not loaded');
    }

    const request = this.transformGameStateToRequest(gameState);

    try {
      // The `any` cast is required here because the WASM function
      // expects an object, but the generated type definition is incorrect.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseJson = this.wasmModule.get_ai_move_wasm(request as any);
      return this.transformWasmResponse(responseJson);
    } catch (error) {
      console.error('WASM AI error:', error);
      throw new Error(`WASM AI failed: ${error}`);
    }
  }

  async rollDice(): Promise<number> {
    await this.ensureWasmLoaded();

    if (!this.wasmModule) {
      throw new Error('WebAssembly module not loaded');
    }

    return this.wasmModule.roll_dice_wasm();
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.ensureWasmLoaded();
      return this.wasmModule !== null;
    } catch {
      return false;
    }
  }
}

export const wasmAiService = new WasmAiService();
