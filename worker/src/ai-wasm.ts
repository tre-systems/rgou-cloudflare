// Simple WASM interface - Rust does all the heavy lifting
// @ts-expect-error - WASM modules resolved at build time
import init, {
  get_ai_move_from_json,
  evaluate_position_from_json,
} from "../pkg/rgou_ai_wasm";
// @ts-expect-error - WASM modules resolved at build time
import wasm from "../pkg/rgou_ai_wasm_bg.wasm";

// GameState interface for typing (Rust handles the actual conversion)
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
  private gameState: GameState | null = null;

  constructor() {
    // No state needed - Rust handles everything
  }

  updateGameState(gameState: GameState): void {
    this.gameState = gameState;
  }

  getAIMove(): number {
    if (!this.gameState) throw new Error("Game state not set");
    return get_ai_move_from_json(JSON.stringify(this.gameState));
  }

  getEvaluation(): number {
    if (!this.gameState) throw new Error("Game state not set");
    return evaluate_position_from_json(JSON.stringify(this.gameState));
  }

  destroy(): void {
    // No cleanup needed
  }
}
