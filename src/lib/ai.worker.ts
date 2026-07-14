/// <reference lib="webworker" />

import type { GameState } from './types';
import type { ServerAIResponse } from './types';

interface WasmModule {
  default: (input?: { module_or_path: string | URL }) => Promise<unknown>;
  get_ai_move_wasm: (gameState: unknown) => string;
  get_classic_ai_move_optimized: (gameState: unknown) => string;
  init_classic_ai: () => string;
  init_ml_ai: () => string;
  init_heuristic_ai: () => string;
  get_heuristic_ai_move: (gameState: unknown) => string;
}

let wasmModule: WasmModule;
let wasmReady: Promise<void> | null = null;
let classicAiInitialized = false;
let heuristicAiInitialized = false;
const WASM_MODULE_URL = '/wasm/rgou_ai_core.js';

const loadWasm = (): Promise<void> => {
  if (wasmReady) return wasmReady;

  wasmReady = (async () => {
    try {
      wasmModule = (await import(/* @vite-ignore */ WASM_MODULE_URL)) as WasmModule;

      const wasmUrl = `${self.location.origin}/wasm/rgou_ai_worker_bg.wasm`;
      await wasmModule.default({ module_or_path: wasmUrl });

      if (typeof wasmModule.get_ai_move_wasm !== 'function') {
        throw new Error('WASM module does not have get_ai_move_wasm function');
      }

      try {
        if (typeof wasmModule.init_classic_ai === 'function') {
          wasmModule.init_classic_ai();
          classicAiInitialized = true;
        } else {
          console.warn('AI Worker: init_classic_ai not available, using fallback');
        }
      } catch (error) {
        console.warn('AI Worker: failed to initialize Classic AI, using fallback:', error);
      }

      try {
        if (typeof wasmModule.init_ml_ai === 'function') {
          wasmModule.init_ml_ai();
        }
      } catch (error) {
        console.warn('AI Worker: failed to initialize ML AI:', error);
      }

      try {
        if (typeof wasmModule.init_heuristic_ai === 'function') {
          wasmModule.init_heuristic_ai();
          heuristicAiInitialized = true;
        }
      } catch (error) {
        console.warn('AI Worker: failed to initialize Heuristic AI:', error);
      }
    } catch (error) {
      console.error('AI Worker: Failed to load WebAssembly module:', error);
      throw new Error(`WebAssembly module failed to load: ${error}`);
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

const getAIMove = (gameState: GameState): ServerAIResponse => {
  const request = transformGameStateToRequest(gameState);

  if (classicAiInitialized && typeof wasmModule.get_classic_ai_move_optimized === 'function') {
    try {
      return JSON.parse(wasmModule.get_classic_ai_move_optimized(request)) as ServerAIResponse;
    } catch (error) {
      console.warn('AI Worker: optimized Classic AI failed, falling back:', error);
    }
  }

  return JSON.parse(wasmModule.get_ai_move_wasm(request)) as ServerAIResponse;
};

const getHeuristicAIMove = (gameState: GameState): ServerAIResponse => {
  const request = transformGameStateToRequest(gameState);

  if (heuristicAiInitialized && typeof wasmModule.get_heuristic_ai_move === 'function') {
    try {
      return JSON.parse(wasmModule.get_heuristic_ai_move(request)) as ServerAIResponse;
    } catch (error) {
      console.warn('AI Worker: Heuristic AI failed, falling back to Classic AI:', error);
    }
  }

  return getAIMove(gameState);
};

self.addEventListener(
  'message',
  async (event: MessageEvent<{ id: number; gameState?: GameState; type?: string }>) => {
    try {
      await loadWasm();

      const { id, gameState, type } = event.data;

      if (gameState) {
        const response =
          type === 'heuristic' ? getHeuristicAIMove(gameState) : getAIMove(gameState);
        self.postMessage({ type: 'success', id, response });
      } else {
        throw new Error('No game state provided for AI move request');
      }
    } catch (error) {
      console.error('AI Worker: Error processing message:', error);
      self.postMessage({ type: 'error', id: event.data.id, error: (error as Error).message });
    }
  }
);

loadWasm()
  .then(() => {
    self.postMessage({ type: 'ready' });
  })
  .catch(error => {
    console.error('AI Worker: Failed to initialize WASM on startup:', error);
    self.postMessage({ type: 'error', id: -1, error: error.message });
  });
