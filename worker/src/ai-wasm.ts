// WebAssembly interface for Zig AI
import wasmModule from "./ai.wasm";

// This GameState must match the structure sent from the client
interface GameState {
  board: (PiecePosition | null)[];
  player1Pieces: PiecePosition[];
  player2Pieces: PiecePosition[];
  currentPlayer: "player1" | "player2";
  diceRoll: number | null;
  validMoves: number[];
}

interface PiecePosition {
  square: number; // -1 for start, 0-19 for board, 20 for finished
  player: "player1" | "player2";
}

interface ZigAIExports {
  createGameState(): number;
  destroyGameState(statePtr: number): void;
  updateGameState(
    statePtr: number,
    p1_squares_ptr: number,
    p2_squares_ptr: number,
    currentPlayer: number,
    diceRoll: number
  ): void;
  getAIMove(statePtr: number): number;
  evaluatePosition(statePtr: number): number;
  wasm_alloc(size: number): number;
  wasm_free(ptr: number, size: number): void;
  memory: WebAssembly.Memory;
}

let wasmInstance: ZigAIExports | null = null;

export async function initializeWasm(): Promise<ZigAIExports> {
  if (wasmInstance) {
    return wasmInstance;
  }

  const importObject = {
    env: {
      js_log: (ptr: number, len: number) => {
        const memory = wasmInstance?.memory;
        if (memory) {
          const buffer = new Uint8Array(memory.buffer, ptr, len);
          const text = new TextDecoder("utf-8").decode(buffer);
          console.log(text);
        }
      },
      js_log_int: (val: number) => {
        console.log(val);
      },
    },
  };

  const instance = await WebAssembly.instantiate(wasmModule, importObject);
  wasmInstance = instance.exports as unknown as ZigAIExports;
  return wasmInstance;
}

export class ZigAI {
  private statePtr: number;
  private wasm: ZigAIExports;
  private p1PiecesPtr: number;
  private p2PiecesPtr: number;
  private readonly PIECES_PER_PLAYER = 7;

  constructor(wasm: ZigAIExports) {
    this.wasm = wasm;
    this.statePtr = this.wasm.createGameState();
    this.p1PiecesPtr = this.wasm.wasm_alloc(this.PIECES_PER_PLAYER);
    this.p2PiecesPtr = this.wasm.wasm_alloc(this.PIECES_PER_PLAYER);
  }

  updateGameState(gameState: GameState): void {
    const p1Squares = new Int8Array(
      this.wasm.memory.buffer,
      this.p1PiecesPtr,
      this.PIECES_PER_PLAYER
    );
    const p2Squares = new Int8Array(
      this.wasm.memory.buffer,
      this.p2PiecesPtr,
      this.PIECES_PER_PLAYER
    );

    for (let i = 0; i < this.PIECES_PER_PLAYER; i++) {
      p1Squares[i] = gameState.player1Pieces[i]?.square ?? -1;
      p2Squares[i] = gameState.player2Pieces[i]?.square ?? -1;
    }

    const currentPlayer = gameState.currentPlayer === "player1" ? 0 : 1;
    const diceRoll = gameState.diceRoll ?? 0;

    this.wasm.updateGameState(
      this.statePtr,
      this.p1PiecesPtr,
      this.p2PiecesPtr,
      currentPlayer,
      diceRoll
    );
  }

  getAIMove(): number {
    return this.wasm.getAIMove(this.statePtr);
  }

  destroy(): void {
    this.wasm.destroyGameState(this.statePtr);
    this.wasm.wasm_free(this.p1PiecesPtr, this.PIECES_PER_PLAYER);
    this.wasm.wasm_free(this.p2PiecesPtr, this.PIECES_PER_PLAYER);
  }
}

// Fallback to TypeScript AI if WASM fails
export function createHybridAI() {
  return {
    async getAIMove(gameState: any): Promise<number> {
      try {
        await initializeWasm();
        const zigAI = new ZigAI(wasmInstance);
        zigAI.updateGameState(gameState);

        // For now, fall back to TypeScript implementation
        // In full implementation, we'd convert gameState to WASM format
        zigAI.destroy();

        return getTypeScriptAIMove(gameState);
      } catch (error) {
        console.warn("WASM AI failed, falling back to TypeScript:", error);
        return getTypeScriptAIMove(gameState);
      }
    },
  };
}

// TypeScript AI implementation (existing logic)
function getTypeScriptAIMove(gameState: any): number {
  if (!gameState.canMove || gameState.validMoves.length === 0) {
    return 0;
  }

  if (gameState.validMoves.length === 1) {
    return gameState.validMoves[0];
  }

  // Simple strategy - prefer moves that advance pieces further
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

    // Add some randomness
    score += Math.random() * 10;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
