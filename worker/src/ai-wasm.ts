// WebAssembly interface for Rust AI
import init, { RustGameState } from "./rgou_ai_wasm";
import wasm from "./rgou_ai_wasm_bg.wasm";

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

let wasmInitialized = false;

export async function initializeWasm(): Promise<void> {
  if (wasmInitialized) {
    return;
  }

  await init(wasm);
  wasmInitialized = true;
  console.log("Rust WASM module initialized");
}

export class RustAI {
  private gameState: RustGameState;
  private readonly PIECES_PER_PLAYER = 7;

  constructor() {
    this.gameState = new RustGameState();
  }

  updateGameState(gameState: GameState): void {
    const p1Squares = new Array(this.PIECES_PER_PLAYER).fill(-1);
    const p2Squares = new Array(this.PIECES_PER_PLAYER).fill(-1);

    for (
      let i = 0;
      i < this.PIECES_PER_PLAYER && i < gameState.player1Pieces.length;
      i++
    ) {
      p1Squares[i] = gameState.player1Pieces[i]?.square ?? -1;
    }

    for (
      let i = 0;
      i < this.PIECES_PER_PLAYER && i < gameState.player2Pieces.length;
      i++
    ) {
      p2Squares[i] = gameState.player2Pieces[i]?.square ?? -1;
    }

    const currentPlayer = gameState.currentPlayer === "player1" ? 0 : 1;
    const diceRoll = gameState.diceRoll ?? 0;

    this.gameState.update_game_state(
      new Int8Array(p1Squares),
      new Int8Array(p2Squares),
      currentPlayer,
      diceRoll
    );
  }

  getAIMove(): number {
    return this.gameState.get_ai_move();
  }

  getEvaluation(): number {
    return this.gameState.evaluate_position();
  }

  destroy(): void {
    // Rust handles memory management automatically
    // No explicit cleanup needed
  }
}

// Fallback to TypeScript AI if WASM fails
export function createHybridAI() {
  return {
    async getAIMove(gameState: any): Promise<number> {
      try {
        await initializeWasm();
        const rustAI = new RustAI();
        rustAI.updateGameState(gameState);
        const move = rustAI.getAIMove();
        rustAI.destroy();
        return move;
      } catch (error) {
        console.warn("Rust WASM AI failed, falling back to TypeScript:", error);
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
