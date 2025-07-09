/// <reference lib="webworker" />

import type { GameState } from './types';
import type { AIResponse as ServerAIResponse } from './ai-types';

interface WasmModule {
  default: (input?: string | URL) => Promise<unknown>;
  get_ai_move_wasm: (gameState: unknown) => string;
}

let wasmModule: WasmModule;
let wasmReady: Promise<void> | null = null;

const loadWasm = (): Promise<void> => {
  if (wasmReady) return wasmReady;

  wasmReady = (async () => {
    try {
      wasmModule = await import('/wasm/rgou_ai_core.js');
      const wasmUrl = new URL('/wasm/rgou_ai_core_bg.wasm', self.location.origin);
      await wasmModule.default(wasmUrl.href);
    } catch (error) {
      console.error('Failed to load WebAssembly module in worker:', error);
      throw new Error('WebAssembly module failed to load in worker');
    }
  })();

  return wasmReady;
};

const transformGameStateToRequest = (gameState: GameState) => ({
  player1Pieces: gameState.player1Pieces.map(p => ({ square: p.square })),
  player2Pieces: gameState.player2Pieces.map(p => ({ square: p.square })),
  currentPlayer: gameState.currentPlayer === 'player1' ? 'Player1' : 'Player2',
  diceRoll: gameState.diceRoll,
});

const transformWasmResponse = (responseJson: string): ServerAIResponse => {
  const parsed = JSON.parse(responseJson);
  return {
    ...parsed,
    move: parsed.move,
  };
};

self.addEventListener(
  'message',
  async (event: MessageEvent<{ id: number; gameState: GameState }>) => {
    try {
      await loadWasm();
      const { id, gameState } = event.data;
      const request = transformGameStateToRequest(gameState);

      const responseJson = wasmModule.get_ai_move_wasm(request);
      const response = transformWasmResponse(responseJson);

      self.postMessage({ type: 'success', id, response });
    } catch (error) {
      self.postMessage({ type: 'error', id: event.data.id, error: (error as Error).message });
    }
  }
);

loadWasm().then(() => {
  self.postMessage({ type: 'ready' });
});
