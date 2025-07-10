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
      console.log('AI Worker: Starting to load WebAssembly module...');
      wasmModule = await import(/* webpackIgnore: true */ '/wasm/rgou_ai_core.js');
      console.log('AI Worker: rgou_ai_core.js loaded.');

      const wasmUrl = `${self.location.origin}/wasm/rgou_ai_core_bg.wasm`;
      console.log(`AI Worker: Initializing wasm with URL: ${wasmUrl}`);
      await wasmModule.default(wasmUrl);
      console.log('AI Worker: WebAssembly module initialized successfully.');
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
      console.log('AI Worker: Received message:', event.data);
      await loadWasm();
      console.log('AI Worker: Wasm loaded, processing message.');
      const { id, gameState } = event.data;
      const request = transformGameStateToRequest(gameState);

      const responseJson = wasmModule.get_ai_move_wasm(request);
      const response = transformWasmResponse(responseJson);

      console.log('AI Worker: Sending success response:', { type: 'success', id, response });
      self.postMessage({ type: 'success', id, response });
    } catch (error) {
      console.error('AI Worker: Error processing message:', error);
      console.log('AI Worker: Sending error response:', {
        type: 'error',
        id: event.data.id,
        error: (error as Error).message,
      });
      self.postMessage({ type: 'error', id: event.data.id, error: (error as Error).message });
    }
  }
);

loadWasm().then(() => {
  self.postMessage({ type: 'ready' });
});
